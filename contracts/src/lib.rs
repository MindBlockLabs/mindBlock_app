#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

// ─── Storage Keys ────────────────────────────────────────────────────────────

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    PlayerIndex,
    Player(Address),
    Submission(Address, u64),
    Session(Address),
    Badge(Address, u32),
    Admin,
}

// ─── Data Structures ─────────────────────────────────────────────────────────

#[derive(Clone, Debug, PartialEq)]
#[contracttype]
pub struct Player {
    pub address: Address,
    pub username: String,
    pub xp: u64,
    pub iq_level: u32,
    pub puzzles_solved: u64,
    pub current_streak: u32,
    /// Unix timestamp (seconds) of the player's last successful puzzle submission.
    /// Used to automatically reset streak after 24+ hours of inactivity (#293).
    pub last_active_timestamp: u64,
    pub reputation: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct PuzzleSubmission {
    pub player: Address,
    pub puzzle_id: u64,
    pub category: String,
    pub score: u32,
    pub timestamp: u64,
}

/// Issue #447 – Game Session Tracking
#[derive(Clone)]
#[contracttype]
pub struct GameSession {
    pub player: Address,
    pub puzzle_id: u64,
    pub start_time: u64,
    pub end_time: u64, // 0 = still active
}

/// Issue #446 – NFT Badge
#[derive(Clone)]
#[contracttype]
pub struct Badge {
    pub badge_id: u32,
    pub owner: Address,
    pub name: String,
    pub milestone: u64,
    pub minted_at: u64,
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct MindBlockContract;

#[contractimpl]
impl MindBlockContract {
    // ── Admin (Issue #449) ────────────────────────────────────────────────

    /// Set the contract admin. Can only be called once (first caller wins).
    pub fn set_admin(env: Env, admin: Address) {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Admin already set");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    fn require_admin(env: &Env, caller: &Address) {
        caller.require_auth();
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Admin not set"));
        if *caller != admin {
            panic!("Unauthorized: admin only");
        }
    }

    // ── Player Registration ───────────────────────────────────────────────

    pub fn register_player(env: Env, player: Address, username: String, iq_level: u32) -> Player {
        player.require_auth();

        let new_player = Player {
            address: player.clone(),
            username: username.clone(),
            xp: 0,
            iq_level,
            puzzles_solved: 0,
            current_streak: 0,
            last_active_timestamp: 0,
            reputation: 0,
        };

        env.storage()
            .instance()
            .set(&DataKey::Player(player.clone()), &new_player);

        // Update player index
        let mut index: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::PlayerIndex)
            .unwrap_or_else(|| Vec::new(&env));

        let mut exists = false;
        for i in 0..index.len() {
            if index.get(i).unwrap() == player {
                exists = true;
                break;
            }
        }

        if !exists {
            index.push_back(player);
            env.storage()
                .persistent()
                .set(&DataKey::PlayerIndex, &index);
        }

        new_player
    }

    pub fn get_player(env: Env, player: Address) -> Option<Player> {
        env.storage().instance().get(&DataKey::Player(player))
    }

    // ── Puzzle Submission ─────────────────────────────────────────────────

    pub fn submit_puzzle(
        env: Env,
        player: Address,
        puzzle_id: u64,
        category: String,
        score: u32,
    ) -> u64 {
        player.require_auth();

        let mut player_data: Player = env
            .storage()
            .instance()
            .get(&DataKey::Player(player.clone()))
            .unwrap_or_else(|| panic!("Player not registered"));

        // #294: Reject duplicate submissions before any state mutation.
        if env
            .storage()
            .instance()
            .has(&DataKey::Submission(player.clone(), puzzle_id))
        {
            panic!("Puzzle already submitted");
        }

        let current_timestamp = env.ledger().timestamp();
        const SECONDS_IN_A_DAY: u64 = 86_400;
        let day_index = current_timestamp / SECONDS_IN_A_DAY;

        if player_data.puzzles_solved == 0 {
            player_data.current_streak = 1;
            player_data.reputation += 5;
        } else {
            let last_day_index = player_data.last_active_timestamp / SECONDS_IN_A_DAY;

            if day_index == last_day_index + 1 {
                player_data.current_streak += 1;
                player_data.reputation += 15;
            } else if day_index > last_day_index + 1 {
                player_data.current_streak = 1;
                player_data.reputation = player_data.reputation.saturating_sub(20).saturating_add(5);
            } else {
                player_data.reputation += 5;
            }
        }

        let xp_reward = (score as u64) * (player_data.iq_level as u64) / 10;
        player_data.xp += xp_reward;
        player_data.puzzles_solved += 1;
        player_data.last_active_timestamp = current_timestamp;

        // Auto-mint badge on milestones (Issue #446)
        Self::try_mint_badge(&env, &player, &player_data);

        env.storage()
            .instance()
            .set(&DataKey::Player(player.clone()), &player_data);

        let submission = PuzzleSubmission {
            player: player.clone(),
            puzzle_id,
            category,
            score,
            timestamp: current_timestamp,
        };
        env.storage()
            .instance()
            .set(&DataKey::Submission(player.clone(), puzzle_id), &submission);

        player_data.xp
    }

    pub fn get_submission(env: Env, player: Address, puzzle_id: u64) -> Option<PuzzleSubmission> {
        env.storage()
            .instance()
            .get(&DataKey::Submission(player, puzzle_id))
    }

    // ── Streak ────────────────────────────────────────────────────────────

    pub fn get_streak(env: Env, player: Address) -> u32 {
        let player_data: Player = match env.storage().instance().get(&DataKey::Player(player)) {
            Some(data) => data,
            None => return 0,
        };

        let current_timestamp = env.ledger().timestamp();
        const SECONDS_IN_A_DAY: u64 = 86_400;
        let day_index = current_timestamp / SECONDS_IN_A_DAY;
        let last_day_index = player_data.last_active_timestamp / SECONDS_IN_A_DAY;

        if day_index > last_day_index + 1 {
            0
        } else {
            player_data.current_streak
        }
    }

    pub fn sync_streak(env: Env, player: Address, streak: u32) {
        player.require_auth();

        let mut player_data: Player = match env
            .storage()
            .instance()
            .get(&DataKey::Player(player.clone()))
        {
            Some(data) => data,
            None => panic!("Player not registered"),
        };

        player_data.current_streak = streak;
        player_data.last_active_timestamp = env.ledger().timestamp();

        env.storage()
            .instance()
            .set(&DataKey::Player(player), &player_data);
    }

    pub fn reset_streak(env: Env, player: Address) {
        player.require_auth();

        let mut player_data: Player = env
            .storage()
            .instance()
            .get(&DataKey::Player(player.clone()))
            .unwrap_or_else(|| panic!("Player not registered"));

        player_data.current_streak = 0;
        env.storage()
            .instance()
            .set(&DataKey::Player(player), &player_data);
    }

    // ── Reputation ────────────────────────────────────────────────────────

    pub fn get_reputation(env: Env, player: Address) -> u32 {
        let player_data: Player = match env.storage().instance().get(&DataKey::Player(player)) {
            Some(data) => data,
            None => return 0,
        };
        player_data.reputation
    }

    pub fn increase_reputation(env: Env, player: Address, value: u32) {
        player.require_auth();

        let mut player_data: Player = match env
            .storage()
            .instance()
            .get(&DataKey::Player(player.clone()))
        {
            Some(data) => data,
            None => panic!("Player not registered"),
        };

        player_data.reputation = player_data.reputation.saturating_add(value);
        env.storage()
            .instance()
            .set(&DataKey::Player(player), &player_data);
    }

    // ── XP / IQ ───────────────────────────────────────────────────────────

    pub fn get_xp(env: Env, player: Address) -> u64 {
        let player_data: Player = env
            .storage()
            .instance()
            .get(&DataKey::Player(player))
            .unwrap_or_else(|| panic!("Player not registered"));
        player_data.xp
    }

    pub fn update_iq_level(env: Env, player: Address, new_iq_level: u32) {
        player.require_auth();

        let mut player_data: Player = env
            .storage()
            .instance()
            .get(&DataKey::Player(player.clone()))
            .unwrap_or_else(|| panic!("Player not registered"));

        player_data.iq_level = new_iq_level;
        env.storage()
            .instance()
            .set(&DataKey::Player(player), &player_data);
    }

    // ── Admin XP ─────────────────────────────────────────────────────────

    pub fn admin_set_xp(env: Env, admin: Address, player: Address, xp: u64) {
        Self::require_admin(&env, &admin);
        let mut p: Player = env
            .storage()
            .instance()
            .get(&DataKey::Player(player.clone()))
            .unwrap_or_else(|| panic!("Player not registered"));
        p.xp = xp;
        env.storage()
            .instance()
            .set(&DataKey::Player(player), &p);
    }

    // ── Leaderboard ───────────────────────────────────────────────────────

    pub fn get_leaderboard(env: Env, limit: u32) -> Vec<Player> {
        let index: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::PlayerIndex)
            .unwrap_or_else(|| Vec::new(&env));

        let mut players = Vec::new(&env);
        for i in 0..index.len() {
            let addr = index.get(i).unwrap();
            if let Some(player_data) = env.storage().instance().get::<DataKey, Player>(&DataKey::Player(addr)) {
                players.push_back(player_data);
            }
        }

        if players.is_empty() {
            return players;
        }

        let n = players.len();
        let mut sorted = players;

        for i in 0..n {
            for j in 0..n - i - 1 {
                let p1 = sorted.get(j).unwrap();
                let p2 = sorted.get(j + 1).unwrap();
                if p1.xp < p2.xp {
                    sorted.set(j, p2);
                    sorted.set(j + 1, p1);
                }
            }
        }

        let mut limited = Vec::new(&env);
        let count = if limit < n { limit } else { n };
        for i in 0..count {
            limited.push_back(sorted.get(i).unwrap());
        }

        limited
    }

    // ── Game Sessions (Issue #447) ────────────────────────────────────────

    pub fn start_session(env: Env, player: Address, puzzle_id: u64) -> GameSession {
        player.require_auth();

        if let Some(existing) = env
            .storage()
            .instance()
            .get::<DataKey, GameSession>(&DataKey::Session(player.clone()))
        {
            if existing.end_time == 0 {
                panic!("Active session already exists");
            }
        }

        let session = GameSession {
            player: player.clone(),
            puzzle_id,
            start_time: env.ledger().timestamp(),
            end_time: 0,
        };
        env.storage()
            .instance()
            .set(&DataKey::Session(player), &session);
        session
    }

    pub fn end_session(env: Env, player: Address) -> GameSession {
        player.require_auth();

        let mut session: GameSession = env
            .storage()
            .instance()
            .get(&DataKey::Session(player.clone()))
            .unwrap_or_else(|| panic!("No session found"));

        if session.end_time != 0 {
            panic!("Session already ended");
        }

        session.end_time = env.ledger().timestamp();
        env.storage()
            .instance()
            .set(&DataKey::Session(player), &session);
        session
    }

    pub fn get_active_session(env: Env, player: Address) -> Option<GameSession> {
        let session: Option<GameSession> = env
            .storage()
            .instance()
            .get(&DataKey::Session(player));
        match session {
            Some(s) if s.end_time == 0 => Some(s),
            _ => None,
        }
    }

    // ── NFT Badges (Issue #446) ───────────────────────────────────────────

    pub fn get_badge(env: Env, player: Address, badge_id: u32) -> Option<Badge> {
        env.storage()
            .instance()
            .get(&DataKey::Badge(player, badge_id))
    }

    pub fn award_badge(
        env: Env,
        admin: Address,
        player: Address,
        badge_id: u32,
        name: String,
        milestone: u64,
    ) -> Badge {
        Self::require_admin(&env, &admin);
        let badge = Badge {
            badge_id,
            owner: player.clone(),
            name,
            milestone,
            minted_at: env.ledger().timestamp(),
        };
        env.storage()
            .instance()
            .set(&DataKey::Badge(player, badge_id), &badge);
        badge
    }

    // ── Internal helpers ──────────────────────────────────────────────────

    fn try_mint_badge(env: &Env, player: &Address, p: &Player) {
        let milestones: [(u64, u32, &str); 3] = [
            (10, 1, "Novice"),
            (50, 2, "Solver"),
            (100, 3, "Master"),
        ];
        for (threshold, badge_id, name) in milestones {
            if p.puzzles_solved == threshold
                && !env
                    .storage()
                    .instance()
                    .has(&DataKey::Badge(player.clone(), badge_id))
            {
                let badge = Badge {
                    badge_id,
                    owner: player.clone(),
                    name: String::from_str(env, name),
                    milestone: threshold,
                    minted_at: env.ledger().timestamp(),
                };
                env.storage()
                    .instance()
                    .set(&DataKey::Badge(player.clone(), badge_id), &badge);
                env.events().publish(
                    (symbol_short!("badge"), player.clone()),
                    badge_id,
                );
            }
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        Address, Env, String,
    };

    fn setup() -> (Env, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(MindBlockContract, ());
        let player = Address::generate(&env);
        (env, player, contract_id)
    }

    // ── register_player ───────────────────────────────────────────────────────

    #[test]
    fn test_register_player() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let result = client.register_player(&player, &String::from_str(&env, "TestPlayer"), &100);
        assert_eq!(result.xp, 0);
        assert_eq!(result.iq_level, 100);
        assert_eq!(result.puzzles_solved, 0);
        assert_eq!(result.current_streak, 0);
        assert_eq!(result.last_active_timestamp, 0);
    }

    // ── submit_puzzle ─────────────────────────────────────────────────────────

    #[test]
    fn test_submit_puzzle() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "TestPlayer"), &100);
        let xp = client.submit_puzzle(&player, &1, &String::from_str(&env, "coding"), &95);
        assert_eq!(xp, 950);
    }

    // ── get_player ────────────────────────────────────────────────────────────

    #[test]
    fn test_get_player_unregistered_returns_none() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        assert!(client.get_player(&player).is_none());
    }

    #[test]
    fn test_get_player_registered() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Alice"), &120);
        let data = client.get_player(&player).unwrap();
        assert_eq!(data.iq_level, 120);
        assert_eq!(data.xp, 0);
    }

    // ── get_xp ────────────────────────────────────────────────────────────────

    #[test]
    fn test_get_xp() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Bob"), &100);
        client.submit_puzzle(&player, &1, &String::from_str(&env, "logic"), &80);
        assert_eq!(client.get_xp(&player), 800);
    }

    // ── get_submission ────────────────────────────────────────────────────────

    #[test]
    fn test_get_submission_none_before_submit() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Carol"), &100);
        assert!(client.get_submission(&player, &42).is_none());
    }

    #[test]
    fn test_get_submission_after_submit() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Dave"), &100);
        client.submit_puzzle(&player, &7, &String::from_str(&env, "blockchain"), &90);
        let sub = client.get_submission(&player, &7).unwrap();
        assert_eq!(sub.puzzle_id, 7);
        assert_eq!(sub.score, 90);
    }

    // ── update_iq_level ───────────────────────────────────────────────────────

    #[test]
    fn test_update_iq_level() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Eve"), &100);
        client.update_iq_level(&player, &150);
        assert_eq!(client.get_player(&player).unwrap().iq_level, 150);
    }

    // ── streak management ─────────────────────────────────────────────────────

    #[test]
    fn test_streak_stays_same_within_same_day() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "Frank"), &100);
        client.submit_puzzle(&player, &1, &category, &70);
        assert_eq!(client.get_streak(&player), 1);
        env.ledger().with_mut(|l| l.timestamp = 1000);
        client.submit_puzzle(&player, &2, &category, &70);
        assert_eq!(client.get_streak(&player), 1);
    }

    #[test]
    fn test_streak_increments_on_consecutive_day() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "logic");
        client.register_player(&player, &String::from_str(&env, "Grace"), &100);
        env.ledger().with_mut(|l| l.timestamp = 40000);
        client.submit_puzzle(&player, &1, &category, &70);
        assert_eq!(client.get_streak(&player), 1);
        env.ledger().with_mut(|l| l.timestamp = 100000);
        client.submit_puzzle(&player, &2, &category, &70);
        assert_eq!(client.get_streak(&player), 2);
    }

    #[test]
    fn test_streak_resets_after_missed_day() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "Heidi"), &100);
        client.submit_puzzle(&player, &1, &category, &70);
        assert_eq!(client.get_streak(&player), 1);
        env.ledger().with_mut(|l| l.timestamp = 172801);
        client.submit_puzzle(&player, &2, &category, &70);
        assert_eq!(client.get_streak(&player), 1);
    }

    #[test]
    fn test_get_streak_returns_zero_on_expiry() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "Ivan"), &100);
        client.submit_puzzle(&player, &1, &category, &70);
        assert_eq!(client.get_streak(&player), 1);
        env.ledger().with_mut(|l| l.timestamp = 172801);
        assert_eq!(client.get_streak(&player), 0);
    }

    #[test]
    fn test_last_active_timestamp_updated_on_every_submission() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "Judy"), &100);
        env.ledger().with_mut(|l| l.timestamp = 1000);
        client.submit_puzzle(&player, &1, &category, &80);
        assert_eq!(client.get_player(&player).unwrap().last_active_timestamp, 1000);
        env.ledger().with_mut(|l| l.timestamp = 2000);
        client.submit_puzzle(&player, &2, &category, &80);
        assert_eq!(client.get_player(&player).unwrap().last_active_timestamp, 2000);
    }

    #[test]
    fn test_sync_streak() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "SyncTester"), &100);
        client.sync_streak(&player, &5);
        assert_eq!(client.get_streak(&player), 5);
        assert_eq!(client.get_player(&player).unwrap().last_active_timestamp, env.ledger().timestamp());
    }

    // ── duplicate submission rejection (#294) ─────────────────────────────────

    #[test]
    #[should_panic]
    fn test_duplicate_puzzle_submission_rejected() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "Ivan"), &100);
        client.submit_puzzle(&player, &1, &category, &80);
        client.submit_puzzle(&player, &1, &category, &80);
    }

    #[test]
    fn test_single_submission_stats_are_correct() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "Judy"), &100);
        let xp = client.submit_puzzle(&player, &1, &category, &80);
        assert_eq!(xp, 800);
        let data = client.get_player(&player).unwrap();
        assert_eq!(data.xp, 800);
        assert_eq!(data.puzzles_solved, 1);
        assert_eq!(data.current_streak, 1);
    }

    // ── leaderboard ───────────────────────────────────────────────────────────

    #[test]
    fn test_leaderboard_returns_vec() {
        let (env, _player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let board = client.get_leaderboard(&5);
        assert_eq!(board.len(), 0);
    }

    #[test]
    fn test_leaderboard_sorting() {
        let env = Env::default();
        let contract_id = env.register(MindBlockContract, ());
        let client = MindBlockContractClient::new(&env, &contract_id);
        let p1 = Address::generate(&env);
        let p2 = Address::generate(&env);
        let p3 = Address::generate(&env);
        let category = String::from_str(&env, "coding");
        env.mock_all_auths();
        client.register_player(&p1, &String::from_str(&env, "Alice"), &10);
        client.register_player(&p2, &String::from_str(&env, "Bob"), &20);
        client.register_player(&p3, &String::from_str(&env, "Charlie"), &30);
        client.submit_puzzle(&p1, &1, &category, &50);
        client.submit_puzzle(&p2, &1, &category, &50);
        client.submit_puzzle(&p3, &1, &category, &50);
        let leaderboard = client.get_leaderboard(&5);
        assert_eq!(leaderboard.len(), 3);
        assert_eq!(leaderboard.get(0).unwrap().address, p3);
        assert_eq!(leaderboard.get(1).unwrap().address, p2);
        assert_eq!(leaderboard.get(2).unwrap().address, p1);
        let leaderboard_limit = client.get_leaderboard(&1);
        assert_eq!(leaderboard_limit.len(), 1);
        assert_eq!(leaderboard_limit.get(0).unwrap().address, p3);
    }

    // ── reputation system ─────────────────────────────────────────────────────

    #[test]
    fn test_get_reputation_unregistered_returns_zero() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        assert_eq!(client.get_reputation(&player), 0);
    }

    #[test]
    fn test_get_reputation_registered_initial_is_zero() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "ReputationUser"), &100);
        assert_eq!(client.get_reputation(&player), 0);
    }

    #[test]
    fn test_reputation_gain_on_submission() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "RepUser"), &100);
        client.submit_puzzle(&player, &1, &category, &70);
        assert_eq!(client.get_reputation(&player), 5);
        client.submit_puzzle(&player, &2, &category, &70);
        assert_eq!(client.get_reputation(&player), 10);
    }

    #[test]
    fn test_reputation_bonus_and_penalty() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "StreakRepUser"), &100);
        client.submit_puzzle(&player, &1, &category, &70);
        assert_eq!(client.get_reputation(&player), 5);
        env.ledger().with_mut(|l| l.timestamp = 86400);
        client.submit_puzzle(&player, &2, &category, &70);
        assert_eq!(client.get_reputation(&player), 20);
        env.ledger().with_mut(|l| l.timestamp = 259200);
        client.submit_puzzle(&player, &3, &category, &70);
        assert_eq!(client.get_reputation(&player), 5);
    }

    #[test]
    fn test_reputation_saturating_behavior() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let category = String::from_str(&env, "coding");
        client.register_player(&player, &String::from_str(&env, "PoorUser"), &100);
        client.submit_puzzle(&player, &1, &category, &70);
        assert_eq!(client.get_reputation(&player), 5);
        env.ledger().with_mut(|l| l.timestamp = 172801);
        client.submit_puzzle(&player, &2, &category, &70);
        assert_eq!(client.get_reputation(&player), 5);
    }

    #[test]
    fn test_increase_reputation_manual() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "ManualUser"), &100);
        client.increase_reputation(&player, &50);
        assert_eq!(client.get_reputation(&player), 50);
    }

    // ── Issue #449 – Admin Controls ───────────────────────────────────────────

    #[test]
    fn test_admin_set_and_get() {
        let (env, _player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.set_admin(&admin);
        assert_eq!(client.get_admin(), Some(admin));
    }

    #[test]
    #[should_panic(expected = "Admin already set")]
    fn test_admin_cannot_be_overwritten() {
        let (env, _player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let admin1 = Address::generate(&env);
        let admin2 = Address::generate(&env);
        client.set_admin(&admin1);
        client.set_admin(&admin2);
    }

    #[test]
    #[should_panic(expected = "Unauthorized: admin only")]
    fn test_non_admin_cannot_set_xp() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let attacker = Address::generate(&env);
        client.set_admin(&admin);
        client.register_player(&player, &String::from_str(&env, "Bob"), &80);
        client.admin_set_xp(&attacker, &player, &9999);
    }

    #[test]
    fn test_admin_set_xp() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.set_admin(&admin);
        client.register_player(&player, &String::from_str(&env, "Bob"), &80);
        client.admin_set_xp(&admin, &player, &500);
        assert_eq!(client.get_xp(&player), 500);
    }

    // ── Issue #447 – Game Session Tracking ───────────────────────────────────

    #[test]
    fn test_start_and_end_session() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Carol"), &90);
        let session = client.start_session(&player, &42);
        assert_eq!(session.puzzle_id, 42);
        assert_eq!(session.end_time, 0);
        assert!(client.get_active_session(&player).is_some());
        let ended = client.end_session(&player);
        assert!(ended.end_time > 0);
        assert!(client.get_active_session(&player).is_none());
    }

    #[test]
    #[should_panic(expected = "Active session already exists")]
    fn test_prevent_multiple_active_sessions() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Dave"), &70);
        client.start_session(&player, &1);
        client.start_session(&player, &2);
    }

    #[test]
    fn test_can_start_new_session_after_ending() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Eve"), &85);
        client.start_session(&player, &1);
        client.end_session(&player);
        client.start_session(&player, &2);
    }

    // ── Issue #446 – NFT Badge Rewards ────────────────────────────────────────

    #[test]
    fn test_badge_minted_at_milestone() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        client.register_player(&player, &String::from_str(&env, "Frank"), &100);
        for i in 0..10u64 {
            client.submit_puzzle(&player, &i, &String::from_str(&env, "logic"), &80);
        }
        let badge = client.get_badge(&player, &1);
        assert!(badge.is_some());
        let b = badge.unwrap();
        assert_eq!(b.milestone, 10);
        assert_eq!(b.badge_id, 1);
    }

    #[test]
    fn test_admin_award_badge() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.set_admin(&admin);
        client.register_player(&player, &String::from_str(&env, "Grace"), &95);
        let badge = client.award_badge(&admin, &player, &99, &String::from_str(&env, "Special"), &0);
        assert_eq!(badge.badge_id, 99);
        assert_eq!(badge.owner, player);
    }

    #[test]
    #[should_panic(expected = "Unauthorized: admin only")]
    fn test_non_admin_cannot_award_badge() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let attacker = Address::generate(&env);
        client.set_admin(&admin);
        client.register_player(&player, &String::from_str(&env, "Hank"), &60);
        client.award_badge(&attacker, &player, &1, &String::from_str(&env, "Fake"), &0);
    }
}
