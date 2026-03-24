#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec, Map};

#[derive(Clone)]
#[contracttype]
pub struct Player {
    pub address: Address,
    pub username: String,
    pub xp: u64,
    pub iq_level: u32,
    pub puzzles_solved: u64,
    pub current_streak: u32,
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

#[contract]
pub struct MindBlockContract;

#[contractimpl]
impl MindBlockContract {
    /// Initialize a new player profile
    pub fn register_player(
        env: Env,
        player: Address,
        username: String,
        iq_level: u32,
    ) -> Player {
        player.require_auth();
        
        let new_player = Player {
            address: player.clone(),
            username: username.clone(),
            xp: 0,
            iq_level,
            puzzles_solved: 0,
            current_streak: 0,
        };
        
        env.storage().instance().set(&player, &new_player);
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
        
        let mut player_data: Player = env.storage()
            .instance()
            .get(&player)
            .unwrap_or_else(|| panic!("Player not registered"));
        
        // Calculate XP based on score and IQ level
        let xp_reward = (score as u64) * (player_data.iq_level as u64) / 10;
        
        // Update player stats
        player_data.xp += xp_reward;
        player_data.puzzles_solved += 1;
        player_data.current_streak += 1;
        
        // Save updated player data
        env.storage().instance().set(&player, &player_data);
        
        // Record submission
        let submission = PuzzleSubmission {
            player: player.clone(),
            puzzle_id,
            category,
            score,
            timestamp: env.ledger().timestamp(),
        };
        
        let submission_key = (player.clone(), puzzle_id);
        env.storage().instance().set(&submission_key, &submission);
        
        player_data.xp
    }
    
    /// Get top players by XP (leaderboard)
    pub fn get_leaderboard(env: Env, limit: u32) -> Vec<Player> {
        // Note: In production, implement proper pagination and sorting
        // This is a simplified version
        let mut leaderboard = Vec::new(&env);
        
        // This would need to be implemented with proper indexing
        // For now, returns empty vector as placeholder
        leaderboard
    }
    
    /// Update player IQ level
    pub fn update_iq_level(env: Env, player: Address, new_iq_level: u32) {
        player.require_auth();
        
        let mut player_data: Player = env.storage()
            .instance()
            .get(&player)
            .unwrap_or_else(|| panic!("Player not registered"));
        
        player_data.iq_level = new_iq_level;
        env.storage().instance().set(&player, &player_data);
    }
    
    /// Reset player streak (called when streak is broken)
    pub fn reset_streak(env: Env, player: Address) {
        player.require_auth();
        
        let mut player_data: Player = env.storage()
            .instance()
            .get(&player)
            .unwrap_or_else(|| panic!("Player not registered"));
        
        player_data.current_streak = 0;
        env.storage().instance().set(&player, &player_data);
    }
    
    /// Get player's total XP
    pub fn get_xp(env: Env, player: Address) -> u64 {
        let player_data: Player = env.storage()
            .instance()
            .get(&player)
            .unwrap_or_else(|| panic!("Player not registered"));
        
        player_data.xp
    }
    
    /// Get puzzle submission details
    pub fn get_submission(
        env: Env,
        player: Address,
        puzzle_id: u64,
    ) -> Option<PuzzleSubmission> {
        let submission_key = (player, puzzle_id);
        env.storage().instance().get(&submission_key)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    #[test]
    fn test_register_player() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MindBlockContract);
        let client = MindBlockContractClient::new(&env, &contract_id);
        
        let player = Address::generate(&env);
        let username = String::from_str(&env, "TestPlayer");
        
        env.mock_all_auths();
        
        let result = client.register_player(&player, &username, &100);
        
        assert_eq!(result.xp, 0);
        assert_eq!(result.iq_level, 100);
    }
    
    #[test]
    fn test_submit_puzzle() {
        let env = Env::default();
        let contract_id = env.register_contract(None, MindBlockContract);
        let client = MindBlockContractClient::new(&env, &contract_id);
        
        let player = Address::generate(&env);
        let username = String::from_str(&env, "TestPlayer");
        let category = String::from_str(&env, "coding");
        
        env.mock_all_auths();
        
        client.register_player(&player, &username, &100);
        let xp = client.submit_puzzle(&player, &1, &category, &95);
        
        assert!(xp > 0);
    }
}