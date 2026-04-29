# SMS Client Manager

A full-stack CRM web application to manage clients, track follow-ups, and log activity — built with **React + FastAPI + MongoDB**.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS        |
| Backend   | FastAPI (Python 3.11+)              |
| Database  | MongoDB (local or Atlas)            |
| Auth      | JWT (python-jose) + bcrypt          |

---

## Project Structure

```
sms-client-manager/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt
│   ├── .env                     # Environment variables
│   ├── core/
│   │   ├── database.py          # MongoDB connection
│   │   └── security.py          # JWT + password hashing
│   ├── routers/
│   │   ├── auth.py              # /api/auth/*
│   │   ├── clients.py           # /api/clients/*
│   │   └── activity.py          # /api/activity/*
│   ├── schemas/
│   │   └── schemas.py           # Pydantic models
│   └── utils/
│       └── helpers.py           # Serialization helpers
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── AuthContext.jsx  # Global auth state
        ├── utils/
        │   ├── api.js           # Axios instance
        │   └── helpers.js       # Formatters + constants
        ├── components/
        │   ├── layout/
        │   │   └── AppLayout.jsx        # Sidebar + shell
        │   ├── ui/
        │   │   ├── index.jsx            # Shared UI primitives
        │   │   └── DatePickerInput.jsx  # Calendar dropdown
        │   ├── clients/
        │   │   ├── ClientCard.jsx
        │   │   └── ClientForm.jsx
        │   └── timeline/
        │       └── Timeline.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── SignupPage.jsx
            ├── DashboardPage.jsx
            ├── ClientsPage.jsx
            └── ClientDetailPage.jsx
```

---

## Prerequisites

Before starting, ensure you have installed:

- **Node.js** v18+ — https://nodejs.org
- **Python** 3.11+ — https://python.org
- **MongoDB Community** — https://www.mongodb.com/try/download/community
  - Or use **MongoDB Atlas** (free cloud) — https://cloud.mongodb.com

---

## Setup in VS Code

### Step 1 — Open the project

```bash
# Open the project folder in VS Code
code sms-client-manager
```

---

### Step 2 — Start MongoDB

**Option A: Local MongoDB**
```bash
# Windows (if installed as a service, it's already running)
# Check: open Task Manager → Services → look for MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (cloud)**
1. Create a free cluster at https://cloud.mongodb.com
2. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net`
3. Use it as `MONGODB_URL` in the `.env` file (Step 3)

---

### Step 3 — Backend Setup

Open a **new VS Code terminal** (`Ctrl+`` ` `` → New Terminal`):

```bash
# Navigate to backend
cd backend

# Create a Python virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# The .env file is already created. Edit it if needed:
# MONGODB_URL=mongodb://localhost:27017
# DB_NAME=sms_client_manager
# SECRET_KEY=change-this-to-a-random-string

# Start the backend server
uvicorn main:app --reload --port 8000
```

You should see:
```
✅ Connected to MongoDB: sms_client_manager
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### Step 4 — Frontend Setup

Open a **second VS Code terminal** (click the `+` icon in the terminal panel):

```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start the dev server
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### Step 5 — Open the App

Visit **http://localhost:5173** in your browser.

1. Click **Sign up** to create your account
2. You're in! Start adding clients from the dashboard.

---

## API Documentation

FastAPI auto-generates interactive docs at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Auth Routes

| Method | Endpoint          | Description         | Auth Required |
|--------|-------------------|---------------------|---------------|
| POST   | /api/auth/signup  | Register new user   | ❌            |
| POST   | /api/auth/login   | Login, get JWT      | ❌            |
| GET    | /api/auth/me      | Get current user    | ✅            |

### Client Routes

| Method | Endpoint                  | Description                        | Auth Required |
|--------|---------------------------|------------------------------------|---------------|
| POST   | /api/clients/             | Create a new client                | ✅            |
| GET    | /api/clients/             | List / search clients              | ✅            |
| GET    | /api/clients/dashboard    | Dashboard data (today/upcoming/overdue) | ✅       |
| GET    | /api/clients/{id}         | Get single client                  | ✅            |
| PUT    | /api/clients/{id}         | Update client                      | ✅            |
| DELETE | /api/clients/{id}         | Delete client + activity logs      | ✅            |

#### Query Parameters for GET /api/clients/

| Param         | Type   | Description                        |
|---------------|--------|------------------------------------|
| search        | string | Filter by name or phone            |
| status        | string | Filter by status enum              |
| followup_from | date   | Follow-up date range start (ISO)   |
| followup_to   | date   | Follow-up date range end (ISO)     |
| skip          | int    | Pagination offset (default: 0)     |
| limit         | int    | Page size (default: 50, max: 200)  |

### Activity Routes

| Method | Endpoint               | Description                  | Auth Required |
|--------|------------------------|------------------------------|---------------|
| GET    | /api/activity/{client_id} | Get activity timeline     | ✅            |

---

## Client Status Values

| Status          | Description                        |
|-----------------|------------------------------------|
| Not Responded   | Initial state, no response yet     |
| Interested      | Client expressed interest          |
| Follow-up Later | Needs follow-up at a later date    |
| Closed          | Deal closed or client inactive     |

---

## Database Schema (MongoDB Collections)

### users
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password_hash": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### clients
```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "name": "string",
  "phone": "string",
  "notes": "string | null",
  "status": "enum",
  "next_followup_date": "datetime | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### activity_logs
```json
{
  "_id": "ObjectId",
  "client_id": "string",
  "activity_type": "enum",
  "description": "string",
  "metadata": "object",
  "created_at": "datetime"
}
```

---

## VS Code Recommended Extensions

Install these for the best development experience:

- **Python** (ms-python.python) — Python language support
- **Pylance** (ms-python.vscode-pylance) — Python type checking
- **ES7+ React/Redux** (dsznajder.es7-react-js-snippets) — React snippets
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss) — Tailwind autocomplete
- **Thunder Client** (rangav.vscode-thunder-client) — API testing (like Postman inside VS Code)
- **MongoDB for VS Code** (mongodb.mongodb-vscode) — Browse your database

---

## Common Issues

**"Connection refused" on backend startup**
→ Make sure MongoDB is running (see Step 2)

**"Module not found" errors in backend**
→ Make sure your virtual environment is activated (`venv\Scripts\activate`)

**Frontend shows blank page**
→ Check browser console for errors; ensure backend is running on port 8000

**CORS errors**
→ The Vite proxy (`/api → localhost:8000`) handles this. Make sure you're accessing via `localhost:5173`, not `127.0.0.1`

---

## Production Deployment Notes

1. Set a strong `SECRET_KEY` in `.env`
2. Use MongoDB Atlas instead of local MongoDB
3. Build frontend: `npm run build` (outputs to `dist/`)
4. Serve backend with: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Serve frontend via Nginx or any static host (Vercel, Netlify)
