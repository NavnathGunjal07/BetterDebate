# BetterDebate

BetterDebate is a full-stack platform designed to help users engage in structured arguments and receive AI-driven feedback. It provides a real-time debate arena with a public gallery of completed debates.

## Features

- **Real-time Debate Arena:** Join structured, turn-based debates with other users.
- **Topic Selection:** Choose from predefined topics or create your own custom topics.
- **Join by Code:** Easily invite friends by sharing a unique 4-digit join code.
- **AI-Powered Argument Analysis:** Arguments are analyzed in real-time by AI (powered by Gemini) for feedback.
- **Debate Summaries:** Upon completion, debates are summarized by AI to provide overviews and outcomes.
- **Public Debate Gallery:** Unauthenticated users can browse, search, and paginate through completed debates and their summaries.
- **Secure Authentication:** User accounts with encrypted credentials and JWT-based session management.

## Tech Stack

**Frontend:**
- React (bootstrapped with Vite)
- State-based screen routing
- Axios for API communication

**Backend:**
- Node.js & Express
- Prisma ORM
- PostgreSQL (Database)
- Google Generative AI integration (`@google/generative-ai`)

---

## How to Start the App

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Gemini API Key

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` directory and configure the following variables:
```env
PORT=3000
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL="postgresql://user:password@localhost:5432/betterdebate"
FRONTEND_URL="http://localhost:5173"
```

**Database Initialization:**
```bash
npx prisma generate
npx prisma db push
# or npx prisma migrate dev
```

**Start the Backend:**
```bash
npm run dev
```
The backend will run on `http://localhost:3000`. You can also run `npx prisma studio` to view and manage your local database.

### 2. Frontend Setup

Open a new terminal window and navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

**Start the Frontend:**
```bash
npm run dev
```
The frontend will start using Vite, typically accessible at `http://localhost:5173`.

---

Enjoy using BetterDebate!
