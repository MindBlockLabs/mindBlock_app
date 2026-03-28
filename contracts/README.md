# 🔗 Mind Block - Stellar Smart Contracts

Blockchain layer for the Mind Block puzzle and coding challenge game, deployed on **Stellar testnet** using Soroban smart contracts.

## 📘 Overview

The Mind Block smart contract handles:
- **Player registration** with IQ-based personalization
- **XP tracking** and reward distribution
- **Puzzle submission** recording on-chain
- **Leaderboard** data (player rankings by XP)
- **Streak management** for daily challenges

All game achievements and progress are stored immutably on the Stellar blockchain, ensuring **transparency** and **verifiability**.

---

## 🏗️ Contract Structure

### Main Contract: `MindBlockContract`

#### Data Structures

**Player**
```rust
pub struct Player {
    pub address: Address,      // Stellar address
    pub username: String,       // Player username
    pub xp: u64,               // Total experience points
    pub iq_level: u32,         // Player IQ level (affects rewards)
    pub puzzles_solved: u64,   // Total puzzles completed
    pub current_streak: u32,   // Consecutive days played
}
```

**PuzzleSubmission**
```rust
pub struct PuzzleSubmission {
    pub player: Address,
    pub puzzle_id: u64,
    pub category: String,      // coding, logic, blockchain, etc.
    pub score: u32,           // 0-100
    pub timestamp: u64,
}
```

#### Key Functions

| Function | Description | Auth Required |
|----------|-------------|---------------|
| `register_player()` | Create new player profile with IQ level | ✅ |
| `get_player()` | Retrieve player stats | ❌ |
| `submit_puzzle()` | Submit solution and earn XP | ✅ |
| `get_leaderboard()` | Fetch top players by XP | ❌ |
| `update_iq_level()` | Adjust player IQ level | ✅ |
| `reset_streak()` | Reset daily streak counter | ✅ |
| `get_xp()` | Get player's total XP | ❌ |
| `get_submission()` | Retrieve puzzle submission details | ❌ |

---

## ⚡ Getting Started

### Prerequisites

Install the required tools:

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Add WebAssembly target
rustup target add wasm32-unknown-unknown
```

### 1. Build the Contract

```bash
cd contracts
stellar contract build
```

This generates a `.wasm` file in `target/wasm32-unknown-unknown/release/`.

### 2. Deploy to Stellar Testnet

```bash
# Deploy contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/mindblock_contract.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet

# Save the contract ID returned
```

### 3. Initialize Contract

```bash
# Example: Register a player
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <YOUR_SECRET_KEY> \
  --network testnet \
  -- register_player \
  --player <PLAYER_ADDRESS> \
  --username "CryptoMaster" \
  --iq_level 120
```

---

## 🧪 Testing

Run the built-in test suite:

```bash
cargo test
```

### Test Coverage

- ✅ Player registration
- ✅ Puzzle submission and XP calculation
- ✅ IQ level updates
- ✅ Streak management
- ✅ Data retrieval

---

## 📊 XP Calculation Formula

```
XP Earned = (Puzzle Score × IQ Level) ÷ 10
```

**Example:**
- Player IQ: 120
- Puzzle Score: 95/100
- XP Earned: (95 × 120) ÷ 10 = **1,140 XP**

Higher IQ levels earn more XP for the same score, rewarding advanced players while keeping the game balanced.

---

## 🔐 Security Features

- **Authentication Required**: All state-changing functions require player signature
- **Data Validation**: IQ levels, scores, and timestamps are validated
- **Immutable Records**: Puzzle submissions are permanently stored on-chain
- **No External Calls**: Contract is self-contained with no oracle dependencies

---

## 🚀 Integration with Backend

The NestJS backend interacts with this contract via the Stellar SDK:

```typescript
import { SorobanRpc, TransactionBuilder, Keypair } from '@stellar/stellar-sdk';

// Submit puzzle solution
async function submitPuzzle(playerAddress: string, puzzleId: number, score: number) {
  const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org');
  
  // Build and submit transaction
  // ... (See backend integration docs)
}
```

---

## 📁 File Structure

```
contracts/
├── src/
│   ├── lib.rs              # Main contract logic
│   └── test.rs             # Unit tests
├── Cargo.toml              # Dependencies
├── README.md               # This file
└── target/                 # Build output (gitignored)
```

---

## 🛠️ Development Workflow

1. **Make changes** to `src/lib.rs`
2. **Build**: `stellar contract build`
3. **Test**: `cargo test`
4. **Deploy**: Use Stellar CLI to deploy to testnet
5. **Verify**: Check contract on [Stellar Expert](https://stellar.expert/explorer/testnet)

---

## 🌐 Testnet Explorer

View deployed contracts and transactions:
- [Stellar Expert Testnet](https://stellar.expert/explorer/testnet)
- [StellarChain Testnet](https://testnet.stellarchain.io/)

---

## 📞 Support

- **General Telegram**: [Join here](https://t.me/+kjacdy68yfwwNTVk)
- **Issues**: Open a GitHub issue in the main repo
- **Email**: 
  - aminubabafatima8@gmail.com
  - amalikabdulmalik04@gmail.com

---

## 🤝 Contributing

We welcome contributions! See the main repo's [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Smart Contract Contributions:**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-contract-feature`
3. Write tests for new functionality
4. Ensure all tests pass: `cargo test`
5. Submit a pull request

---

## 📜 License

MIT License - See [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ by the Mind Block team**