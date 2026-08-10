# 🚀 AI Resume Checker (ATS Resume Roaster & Optimizer)

An end-to-end, AI-powered full-stack web application designed to analyze, score, and optimize resumes for Applicant Tracking Systems (ATS). Powered by **Google Gemini AI**, **React 19**, **Node.js/Express**, and **MongoDB**.

---

## ✨ Features

- 📄 **PDF Resume Upload & Text Extraction**: Upload PDF resumes with automated text extraction, section detection, and metadata analysis.
- 🤖 **AI-Driven ATS Scoring**: Instant comprehensive feedback on ATS compatibility, structural clarity, keyword saturation, and impact metrics using Google Gemini AI (`@google/genai`).
- ✏️ **Smart Bullet Points Rewriter**: Transform weak bullet points into high-impact, action-verb driven statements tailored to targeted job descriptions.
- 🔍 **Version History & Diff Viewer**: Track iterations of your resume over time with side-by-side diff comparisons.
- 📊 **Analytics Dashboard**: Interactive charts displaying score evolution over time, category breakdowns, and skill match insights built with **Recharts**.
- 📥 **PDF Export**: Generate and download professionally formatted PDF resumes directly from the browser using `@react-pdf/renderer`.
- 🔐 **Authentication & Security**: JWT authentication stored in HTTP-only cookies, password hashing with `bcryptjs`, and rate-limiting.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS 4 + Framer Motion
- **State & Data Fetching**: TanStack React Query v5
- **Routing**: React Router v7
- **Charts & UI**: Recharts, Lucide React Icons
- **PDF Generation**: `@react-pdf/renderer`

### **Backend**
- **Runtime**: Node.js (>= 20)
- **Framework**: Express 5
- **Database**: MongoDB with Mongoose 9
- **AI Integration**: Google Gemini SDK (`@google/genai`)
- **File Processing**: Multer, `pdf-parse`, `pdf-lib`
- **Validation & Diffs**: Zod, `diff`
- **Security**: JSON Web Tokens (JWT), `bcryptjs`, Cookie-Parser, CORS, Express Rate Limit

---

## 📁 Repository Structure

```
AIRESUMECHECKER/
├── backend/
│   ├── scripts/          # E2E test scripts & database seeders
│   ├── src/
│   │   ├── config/       # Environment & MongoDB database connection setup
│   │   ├── middleware/   # Auth, upload, error handling, rate limiting
│   │   ├── models/       # Mongoose schemas (User, Resume, Version)
│   │   ├── routes/       # Auth, Resumes, Dashboard, Insights, History APIs
│   │   ├── schemas/      # Zod validation schemas
│   │   ├── services/     # Gemini AI, PDF parser, diff & rewrite engines
│   │   └── server.js     # Express server entry point
│   ├── package.json
│   └── .env              # Backend environment variables
├── frontend/
│   └── AIresumeChecker/
│       └── ai-resume-checker-ui-boilerplate-code/
│           ├── src/
│           │   ├── api/          # Axios API clients
│           │   ├── components/   # UI components (Upload, Analysis, Dashboard, PDF Export)
│           │   ├── context/      # Auth, Theme, and UI context providers
│           │   ├── pages/        # Route pages (Home, Dashboard, Resume Detail, Insights)
│           │   └── routes/       # React Router setup
│           ├── vite.config.js
│           └── package.json
├── package.json          # Root scripts for starting dev servers & tests
└── README.md
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI
- **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)

---

## 🔑 Environment Setup

Create a `.env` file inside the `backend/` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection
MONGO_URI=mongodb://127.0.0.1:27017/ai-resume-checker

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
COOKIE_NAME=arr_token

# Client CORS
CLIENT_ORIGIN=http://localhost:5173,http://localhost:5174

# Google Gemini AI Config
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

---

## 🚀 Quick Start

### 1. Install Dependencies

Install root, backend, and frontend dependencies:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend/AIresumeChecker/ai-resume-checker-ui-boilerplate-code && npm install
```

### 2. Run Development Mode

From the root directory, run both frontend and backend concurrently or individually:

```bash
# Run backend dev server (starts on http://localhost:5000)
npm run dev:backend

# Run frontend dev server (starts on http://localhost:5173)
npm run dev:frontend
```

---

## 🧪 Testing

Run full End-to-End integration tests covering Auth, PDF Parsing, AI Analysis, and Version Diffs:

```bash
npm run test:e2e
```

---

## 🔌 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate user & receive HTTP-only cookie |
| `POST` | `/api/auth/logout` | Clear user authentication session |
| `GET` | `/api/auth/me` | Fetch current user session profile |
| `POST` | `/api/resumes/upload` | Upload PDF resume for parsing and storage |
| `POST` | `/api/resumes/:id/analyze` | Run Gemini AI analysis & ATS scoring |
| `POST` | `/api/resumes/:id/rewrite` | Generate AI-optimized bullet point rewrites |
| `GET` | `/api/dashboard/stats` | Fetch aggregate stats for user dashboard |
| `GET` | `/api/insights` | Fetch skill gap & career recommendation insights |
| `GET` | `/api/history/:resumeId` | Retrieve version history & diff log for a resume |

---

## 📜 License

This project is licensed under the MIT License.
