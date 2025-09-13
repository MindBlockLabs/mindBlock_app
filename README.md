# 🧩 Mind Block App

![alt text](image.png)

## 📘 Introduction
**Mind Block** is a puzzle and coding challenge game that offers **adaptive, rewarding gameplay** tailored to users' IQ and preferences.  
Players solve **logic-based tasks** across categories like **coding, puzzles, blockchain, and logic** to:

- 🎮 Earn in-game recognition (xp)  
- 🚀 Boost problem-solving skills  
- 🏆 Compete socially with friends  

Mind Block is a **next-gen puzzle adventure** blending **AI-generated challenges** with **skill-based progression** in an immersive experience.  

✨ Features include:  
- Quick **IQ-level survey** to personalize your journey  
- Puzzles that evolve with your intelligence level  
- Categories: coding, logic, blockchain, and more  
- **Leaderboards** and upcoming **real-time puzzle battles**  

Whether you're a beginner or a pro, **Mind Block adapts to you**—making every challenge rewarding.

---

## 🏗️ Project Structure
This is a **monorepo** containing three main components:

- **Backend (NestJS)** – API & game logic  
- **Frontend (NextJS)** – User interface  
- **Smart Contracts (Cairo)** – Starknet testnet deployment  

### 🌍 Hosting
- **Backend (NestJS)** → [Render](https://mindblock-webaapp.onrender.com)  
- **Frontend (NextJS)** → (Coming soon on Vercel)  
- **Contracts (Cairo)** → Starknet testnet  

---

## ⚡ Getting Started

Follow these steps to clone and set up the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/MindBlockLabs/mindBlock_app.git
cd mindBlock_app
```

2. Install dependencies

Each package has its own dependencies. You can install them separately or at ones:
Instructions can be found in the general package.json file (script). It is advisable though to install seperately and focus on the folder your isuue is specific to.

Backend (NestJS)
cd backend
npm install

Frontend (NextJS)
cd frontend
npm install

Contracts (Cairo)

Make sure you have Scarb
 and Starknet CLI installed, then:

cd contracts
scarb build

3. Environment variables

Create a .env file inside the backend and/or frontend folders.
For backend:

```bash
REDIS_URL=redis://127.0.0.1:6379
DATABASE_URL='postgresql://neondb_owner:npg_qIXD8TJNmxS6@ep-weathered-fog-ae2k8pwv-pooler.c-2.us-east-2.aws.neon.tech/MindBlock?sslmode=require&channel_binding=require'
```

For frontend:

NEXT_PUBLIC_API_URL=http://localhost:5000

4. Run the project
Backend
cd backend
npm run start:dev

Frontend
cd frontend
npm run dev

Contracts

Deploy your Cairo contracts on Starknet testnet:

cd contracts
starknet-compile
starknet-deploy

## 👥 Contributors & Contact

📢 General Telegram Group: [Join here](https://t.me/+kjacdy68yfwwNTVk)

📧 Owner Emails:

aminubabafatima8@gmail.com

amalikabdulmalik04@gmail.com

## Contribution Guidelines

We ❤️ contributions!

Fork the repo

Create a new branch:

git checkout -b feature/your-feature-name


Commit changes with clear messages:

git commit -m "feat: add puzzle leaderboard"


Push and open a Pull Request (PR).

💡 For issues/bugs, please open an issue.

📜 License

This project is licensed under the MIT License.
