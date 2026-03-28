#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

#[derive(Clone, Debug, PartialEq)] // Added Debug and PartialEq for tests
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

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    PlayerIndex,
}

#[contract]
pub struct MindBlockContract;

#[contractimpl]
impl MindBlockContract {
    /// Initialize a new player profile
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
        };

        env.storage().instance().set(&player, &new_player);

        // Update player index
        let mut index: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::PlayerIndex)
            .unwrap_or_else(|| Vec::new(&env));

        // Check if player is already in index
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

    /// Get player profile
    pub fn get_player(env: Env, player: Address) -> Option<Player> {
        env.storage().instance().get(&player)
    }

    /// Submit puzzle solution and award XP
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
            .get(&player)
            .unwrap_or_else(|| panic!("Player not registered"));

        // #294: Reject duplicate submissions before any state mutation.
        let submission_key = (player.clone(), puzzle_id);
        if env.storage().instance().has(&submission_key) {
            panic!("Puzzle already submitted");
        }

        // #293: Auto-reset streak when the player has been inactive for more than 24 hours.
        let current_timestamp = env.ledger().timestamp();
        const SECONDS_IN_A_DAY: u64 = 86_400;
        // Guard on puzzles_solved > 0 rather than last_active_timestamp != 0,
        // because the test environment starts the ledger clock at 0, making
        // timestamp == 0 an ambiguous sentinel for "never submitted".
        if player_data.puzzles_solved > 0
            && current_timestamp > player_data.last_active_timestamp
            && current_timestamp - player_data.last_active_timestamp > SECONDS_IN_A_DAY
        {
            player_data.current_streak = 0;
        }

        // Calculate XP based on score and IQ level
        let xp_reward = (score as u64) * (player_data.iq_level as u64) / 10;

        // Update player stats
        player_data.xp += xp_reward;
        player_data.puzzles_solved += 1;
        player_data.current_streak += 1;
        player_data.last_active_timestamp = current_timestamp; // #293: track last activity

        // Save updated player data
        env.storage().instance().set(&player, &player_data);

        // Record submission
        let submission = PuzzleSubmission {
            player: player.clone(),
            puzzle_id,
            category,
            score,
            timestamp: current_timestamp,
        };

        env.storage().instance().set(&submission_key, &submission);

        player_data.xp
    }

    /// Get top players by XP (leaderboard)
    pub fn get_leaderboard(env: Env, limit: u32) -> Vec<Player> {
        let index: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::PlayerIndex)
            .unwrap_or_else(|| Vec::new(&env));

        let mut players = Vec::new(&env);
        for i in 0..index.len() {
            let addr = index.get(i).unwrap();
            if let Some(player_data) = env.storage().instance().get::<Address, Player>(&addr) {
                players.push_back(player_data);
            }
        }

        // Sort players by XP descending using bubble sort (Soroban Vec is immutable, so we build a new one)
        // This is inefficient for large N, but works for now.
        if players.is_empty() {
            return players;
        }

        let n = players.len();
        let mut sorted = players;

        // Bubble sort implementation on Soroban Vec
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

        // Apply limit
        let mut limited = Vec::new(&env);
        let count = if limit < n { limit } else { n };
        for i in 0..count {
            limited.push_back(sorted.get(i).unwrap());
        }

        limited
    }

    /// Update player IQ level
    pub fn update_iq_level(env: Env, player: Address, new_iq_level: u32) {
        player.require_auth();

        let mut player_data: Player = env
            .storage()
            .instance()
            .get(&player)
            .unwrap_or_else(|| panic!("Player not registered"));

        player_data.iq_level = new_iq_level;
        env.storage().instance().set(&player, &player_data);
    }

    /// Reset player streak (called when streak is broken)
    pub fn reset_streak(env: Env, player: Address) {
        player.require_auth();

        let mut player_data: Player = env
            .storage()
            .instance()
            .get(&player)
            .unwrap_or_else(|| panic!("Player not registered"));

        player_data.current_streak = 0;
        env.storage().instance().set(&player, &player_data);
    }

    /// Get player's total XP
    pub fn get_xp(env: Env, player: Address) -> u64 {
        let player_data: Player = env
            .storage()
            .instance()
            .get(&player)
            .unwrap_or_else(|| panic!("Player not registered"));

        player_data.xp
    }

    /// Get puzzle submission details
    pub fn get_submission(env: Env, player: Address, puzzle_id: u64) -> Option<PuzzleSubmission> {
        let submission_key = (player, puzzle_id);
        env.storage().instance().get(&submission_key)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        Address, Env, String,
    };

    // ── helpers ──────────────────────────────────────────────────────────────

    /// Returns (env, player_address, contract_id).
    /// The client must be constructed inside each test to avoid lifetime issues.
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
        let username = String::from_str(&env, "TestPlayer");

        let result = client.register_player(&player, &username, &100);

        assert_eq!(result.xp, 0);
        assert_eq!(result.iq_level, 100);
        assert_eq!(result.puzzles_solved, 0);
        assert_eq!(result.current_streak, 0);
        assert_eq!(result.last_active_timestamp, 0);
    }

    // ── submit_puzzle (happy path) ────────────────────────────────────────────

    #[test]
    fn test_submit_puzzle() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "TestPlayer");
        let category = String::from_str(&env, "coding");

        client.register_player(&player, &username, &100);
        let xp = client.submit_puzzle(&player, &1, &category, &95);

        // XP = 95 * 100 / 10 = 950
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
        let username = String::from_str(&env, "Alice");

        client.register_player(&player, &username, &120);

        let data = client.get_player(&player).unwrap();
        assert_eq!(data.iq_level, 120);
        assert_eq!(data.xp, 0);
    }

    // ── get_xp ────────────────────────────────────────────────────────────────

    #[test]
    fn test_get_xp() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Bob");
        let category = String::from_str(&env, "logic");

        client.register_player(&player, &username, &100);
        client.submit_puzzle(&player, &1, &category, &80);

        // XP = 80 * 100 / 10 = 800
        assert_eq!(client.get_xp(&player), 800);
    }

    // ── get_submission ────────────────────────────────────────────────────────

    #[test]
    fn test_get_submission_none_before_submit() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Carol");
        client.register_player(&player, &username, &100);

        assert!(client.get_submission(&player, &42).is_none());
    }

    #[test]
    fn test_get_submission_after_submit() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Dave");
        let category = String::from_str(&env, "blockchain");

        client.register_player(&player, &username, &100);
        client.submit_puzzle(&player, &7, &category, &90);

        let sub = client.get_submission(&player, &7).unwrap();
        assert_eq!(sub.puzzle_id, 7);
        assert_eq!(sub.score, 90);
    }

    // ── update_iq_level ───────────────────────────────────────────────────────

    #[test]
    fn test_update_iq_level() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Eve");

        client.register_player(&player, &username, &100);
        client.update_iq_level(&player, &150);

        let data = client.get_player(&player).unwrap();
        assert_eq!(data.iq_level, 150);
    }

    // ── streak management ─────────────────────────────────────────────────────

    #[test]
    fn test_streak_increments_within_24_hours() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Frank");
        let category = String::from_str(&env, "coding");

        client.register_player(&player, &username, &100);

        // First submission — streak becomes 1
        client.submit_puzzle(&player, &1, &category, &70);
        assert_eq!(client.get_player(&player).unwrap().current_streak, 1);

        // Second submission within 24 h — streak becomes 2
        client.submit_puzzle(&player, &2, &category, &70);
        assert_eq!(client.get_player(&player).unwrap().current_streak, 2);
    }

    #[test]
    fn test_streak_resets_after_24_hours_inactivity() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Grace");
        let category = String::from_str(&env, "logic");

        client.register_player(&player, &username, &100);

        // Build streak to 2
        client.submit_puzzle(&player, &1, &category, &70);
        client.submit_puzzle(&player, &2, &category, &70);
        assert_eq!(client.get_player(&player).unwrap().current_streak, 2);

        // Advance ledger clock past 24 hours
        env.ledger().with_mut(|l| {
            l.timestamp += 86_401;
        });

        // Submit after inactivity — streak must reset to 0 then increment to 1
        client.submit_puzzle(&player, &3, &category, &70);
        assert_eq!(client.get_player(&player).unwrap().current_streak, 1);
    }

    #[test]
    fn test_last_active_timestamp_updated_on_submission() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Heidi");
        let category = String::from_str(&env, "coding");

        client.register_player(&player, &username, &100);

        let ts_before = env.ledger().timestamp();
        client.submit_puzzle(&player, &1, &category, &80);

        let data = client.get_player(&player).unwrap();
        assert_eq!(data.last_active_timestamp, ts_before);
    }

    // ── duplicate submission rejection (#294) ─────────────────────────────────

    #[test]
    #[should_panic]
    fn test_duplicate_puzzle_submission_rejected() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Ivan");
        let category = String::from_str(&env, "coding");

        client.register_player(&player, &username, &100);
        client.submit_puzzle(&player, &1, &category, &80);

        // Second submission with the same puzzle_id must panic
        client.submit_puzzle(&player, &1, &category, &80);
    }

    /// Verify that stats are correct after a single submission and are not corrupted.
    /// Duplicate rejection is already proven by test_duplicate_puzzle_submission_rejected.
    #[test]
    fn test_single_submission_stats_are_correct() {
        let (env, player, contract_id) = setup();
        let client = MindBlockContractClient::new(&env, &contract_id);
        let username = String::from_str(&env, "Judy");
        let category = String::from_str(&env, "coding");

        client.register_player(&player, &username, &100);
        let xp = client.submit_puzzle(&player, &1, &category, &80);

        // XP = 80 * 100 / 10 = 800
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
        // Current implementation is a stub; verify it returns without panicking
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

        // Accumulate XP
        client.submit_puzzle(&p1, &1, &category, &50); // Alice: (50 * 10) / 10 = 50 XP
        client.submit_puzzle(&p2, &1, &category, &50); // Bob: (50 * 20) / 10 = 100 XP
        client.submit_puzzle(&p3, &1, &category, &50); // Charlie: (50 * 30) / 10 = 150 XP

        let leaderboard = client.get_leaderboard(&5);
        assert_eq!(leaderboard.len(), 3);
        assert_eq!(leaderboard.get(0).unwrap().address, p3); // Charlie first
        assert_eq!(leaderboard.get(1).unwrap().address, p2); // Bob second
        assert_eq!(leaderboard.get(2).unwrap().address, p1); // Alice third

        // Test limit
        let leaderboard_limit = client.get_leaderboard(&1);
        assert_eq!(leaderboard_limit.len(), 1);
        assert_eq!(leaderboard_limit.get(0).unwrap().address, p3);
    }
}
