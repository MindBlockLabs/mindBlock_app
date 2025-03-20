# 🚀 AI-Powered Challenge Platform Backend

## 📌 Overview
This project is a modular, scalable, and AI-powered backend built with **NestJS**, **PostgreSQL**, and **TypeORM**. It powers an interactive challenge platform with features such as authentication, AI-driven recommendations, smart contract interactions, and real-time challenge modes.

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
```
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
```

---

## 🛠️ Setup & Installation

### Prerequisites
Ensure you have the following installed:
- Node.js (v18+)
- PostgreSQL

## 📌 API Documentation
API documentation will be available via **Swagger** at:
```
http://localhost:3000/api
```

## 🛡️ Security & Best Practices
- Follows NestJS best practices for security & scalability
- Uses JWT-based authentication for secure access
- Implements role-based access control (RBAC)
- Logs and monitors API requests for security insights

---

## 📜 License
This project is licensed under the MIT License.

---

## ✨ Contact
For inquiries, feel free to reach out at **your-email@example.com**

