# 🚀 AI-Powered Challenge Platform Backend

## 📌 Overview

This project is a modular, scalable, and AI-powered backend built with **NestJS**, **PostgreSQL**, and **TypeORM**. It powers an interactive challenge platform with features such as authentication, AI-driven recommendations, smart contract interactions, and real-time challenge modes.

---

## 🏗️ Tech Stack

- **Backend Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (via TypeORM)
- **Authentication**: Wallet, Email, Google OAuth
- **Blockchain**: StarkNet smart contract interactions
- **AI Integration**: Challenge generation & solution explanations
- **Caching & Performance**: Redis (for caching)
- **Security & Error Handling**: Robust security mechanisms and centralized error handling

---

## 🎯 Features

### ✅ Authentication & User Management
- Wallet authentication
- Email/password authentication
- Google OAuth integration

### 🧠 AI-Powered Challenge System
- IQ survey-based challenge recommendations
- AI-generated challenges
- AI-assisted solution explanations

### ⛓️ Blockchain & Smart Contracts
- Interaction with **StarkNet** smart contracts
- Token rewards system for challenge completion

### 📊 Progress Tracking & Leaderboards
- Tracks user challenge progress
- Global & friend-based leaderboard system

### ⚡ Real-time Challenges (Future Feature)
- Live multiplayer challenge mode (WebSockets)

### 🛠️ Additional Enhancements
- Advanced caching strategies (Redis)
- Centralized error handling
- Security best practices implemented

---

## 📂 Project Structure
backend/
│── src/
│   ├── auth/        # Authentication module
│── providers/
│   ├── common/      # Shared utilities & helpers
│   ├── config/      # Environment variables & configs
│   ├── main.ts      # Application entry point
│── test/            # Unit & integration tests
│── .env             # Environment variables
│── nest-cli.json    # NestJS configuration
│── package.json     # Dependencies & scripts

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js** (v18+)
- **PostgreSQL**

### Installation Steps
1. **Clone the Repository**
   ```bash
   git clone <repo-url>
   cd backend

### Create a New Branch (if contributing to an open source project)
git checkout -b feature/initialize-nestjs
### Install Dependencies
bash
Copy code
npm install
### Set Up Environment Variables Create a .env file in the backend folder and configure your database variables. Do not edit .env.example.
env
Copy code
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database
Run Database Migrations
bash

### npm run typeorm migration:run
Start the Server
bash

### npm run start:dev

### 📌 API Documentation
API documentation will be available via Swagger at:

bash

http://localhost:3000/api
🚀 Project Setup with NestJS CLI (Handling Merge Conflicts)
If you encounter a merge conflict while running the NestJS CLI (e.g., a conflict on README.md), follow these steps:

Backup Your Existing README.md
bash

mv README.md README.backup.md
Run the Nest CLI Command
bash

nest new . --package-manager npm
The CLI will scaffold your app without conflicting with your backup.
Merge Changes After scaffolding is complete, compare your README.backup.md with the new README file and merge the changes as needed.

### 📜 License
This project is licensed under the MIT License.

### ✨ Contact
For inquiries, feel free to reach out at your-email@example.com.

### Additional Resources
NestJS Documentation – Learn more about the framework.
Discord Channel – Get support and ask questions.
NestJS Devtools – Visualize and interact with your application.
Deployment Documentation – Steps to deploy your application.
<p align="center"> <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a> </p> ```