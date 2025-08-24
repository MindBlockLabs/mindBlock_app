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

**Naming Convention**
1. All folders/files should begin in lowercase and describe its role (or snake case where applicaple)
2. Name your folders as short as possible
3. Name your files as descriptive as possible
   
---

## 🛠️ Setup & Installation

### Prerequisites
Ensure you have the following installed:
- Node.js (v18+)
- PostgreSQL

### Installation Steps
1. **Clone the Repository**
   ```sh
   git clone <repo-url>
   cd backend
   ```
2. **Install Dependencies**
   ```sh
   npm install
   ```
3. **Set Up Environment Variables**
   Create a `.env` file and edit the database variables according to your PostgreSQL configuration. **Do not edit `.example` for any reason.**
4. **Run Database Migrations**
   ```sh
   npm run typeorm migration:run
   ```
5. **Start the Server**
   ```sh
   npm run start:dev
   ```

---

## 📌 API Documentation
API documentation will be available via **Swagger** at:
```
http://localhost:3000/api
```

---

## ✅ Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -m 'Add feature X'`)
4. Push to the branch (`git push origin feature-name`)
5. Open a Pull Request
