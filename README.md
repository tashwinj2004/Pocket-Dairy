# Pocket Dairy

> A role-based daily work-log application that lets employees plan their day and record what they accomplished, while leaders get a read-only view of their entire team's activity — all organised on a clean interactive calendar.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Roles & Permissions](#roles--permissions)
- [Database Schema](#database-schema)

---

## Overview

Pocket Dairy solves a common workplace problem: team leaders have no easy way to see what their employees planned to do versus what they actually did. Employees log two types of entries — **Daily Plan** (what they intend to do) and **Work Done** (what they completed) — attached to specific calendar dates. Leaders can browse any employee's calendar and review their entries without being able to modify them.

Authentication is JWT-based with a 15-day session lifetime. The backend auto-creates all database tables on startup so there is no separate migration step required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Vanilla CSS |
| Date handling | date-fns 4 |
| Backend | FastAPI, Uvicorn |
| Database ORM | SQLAlchemy 2 |
| Database | PostgreSQL |
| Authentication | JWT (python-jose), bcrypt (passlib) |
| Validation | Pydantic v2 |

---

## Project Structure

```
Pocket Dairy/
├── backend/
│   ├── main.py              # FastAPI app, CORS, startup hook
│   ├── database.py          # SQLAlchemy engine, session, Base
│   ├── security.py          # JWT creation/verification, role guards
│   ├── .env.example         # Required environment variable template
│   ├── requirements.txt     # Python dependencies
│   ├── models/
│   │   └── schemas.py       # SQLAlchemy models (User, DailyEntry)
│   │                        # + Pydantic request/response schemas
│   └── routers/
│       ├── auth.py          # /auth — register, login, me
│       ├── employee.py      # /employee — CRUD for own entries
│       └── leader.py        # /leader — read-only team view
│
└── frontend/
    ├── next.config.js
    ├── package.json         # Runs on port 9090
    └── src/
        ├── lib/
        │   └── api.js       # Fetch wrapper + localStorage session helpers
        ├── pages/
        │   ├── _app.jsx     # Global CSS import
        │   ├── index.jsx    # Login / Register page
        │   ├── portal.jsx   # Role-based redirect after login
        │   ├── employee/
        │   │   └── dashboard.jsx
        │   └── leader/
        │       └── dashboard.jsx
        ├── components/
        │   ├── CalendarGrid.jsx   # Interactive monthly calendar
        │   ├── EmployeeModal.jsx  # Day detail — view + add + delete entries
        │   ├── LeaderModal.jsx    # Day detail — read-only entry view
        │   └── Sidebar.jsx       # Navigation: brand, profile, team list, logout
        └── styles/
            ├── globals.css        # Entry point — imports all partials
            ├── base.css           # Reset, typography, shared inputs
            ├── auth.css           # Login/register card
            ├── layout.css         # App shell, sidebar, dashboard
            ├── calendar.css       # Calendar grid and day cells
            ├── modal.css          # Modal overlay, entry list, type tabs
            └── responsive.css     # Mobile breakpoints (≤ 800px)
```

---

## Features

**Employee**
- Register and log in with an email, password, and employee ID
- View a monthly calendar with colour-coded entry dots
- Click any day to open a modal and see that day's entries
- Add a new **Daily Plan** or **Work Done** entry with a task name, client name, location, and description
- Delete their own entries via soft-delete (data is retained in the database)

**Leader**
- Log in to a dedicated dashboard showing the full team list in the sidebar
- Select any employee to view their calendar
- Click any day to see a read-only summary of that employee's entries for that date
- Cannot create or delete entries

**General**
- JWT sessions with a 15-day expiry stored in `localStorage`
- Automatic redirect based on role immediately after login
- Fully responsive — sidebar collapses to an icon strip on mobile

---

## How It Works

1. A user registers with a role of either **employee** or **leader**.
2. On login, the backend issues a signed JWT. The frontend stores the token and user object in `localStorage`.
3. Every API request from the frontend attaches the token as a `Bearer` header via the shared `api()` helper in `src/lib/api.js`.
4. The backend verifies the token on each protected route and enforces role-based access — employees can only access their own entries; leaders can only read.
5. Deleted entries are **soft-deleted** (`is_deleted = true`) rather than permanently removed from the database.

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ with npm
- PostgreSQL (running locally or remotely)

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create your environment file
copy .env.example .env     # Windows
cp .env.example .env       # macOS / Linux

# 5. Edit .env with your actual database URL and a strong JWT secret key

# 6. Create the PostgreSQL database
#    (the app will create tables automatically on first startup)
createdb Pocket_Dairy

# 7. Start the development server
uvicorn main:app --reload --port 9091
```

The API will be live at `http://localhost:9091`.  
Interactive API docs: `http://localhost:9091/docs`

---

### Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be live at `http://localhost:9090`.

> **Note:** The frontend expects the backend to be running at `http://localhost:9091`. To change this, set the `NEXT_PUBLIC_API_URL` environment variable in a `.env.local` file inside the `frontend/` directory.



---

### Quick Start (Run Both Together)

If you have already installed the dependencies in both `backend` and `frontend`, you can start both the backend and frontend servers together using either of these options:

#### Option A: From the `frontend/` folder
If your terminal is in the `frontend` folder, run:
```bash
npm run all
```

#### Option B: From the project root folder
If your terminal is in the main project folder (`Pocket Dairy/`), run:
```bash
node run.js
```

This starts:
- The **Backend** on `http://localhost:9091`
- The **Frontend** on `http://localhost:9090`

It logs color-coded messages from both processes directly to a single terminal. Press `Ctrl + C` once to gracefully exit and stop both servers.

---


## Environment Variables

### Backend — `backend/.env`

| Variable | Description | Default (example) |
|---|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://postgres:...@localhost:5432/Pocket_Dairy` |
| `JWT_SECRET_KEY` | Secret used to sign JWT tokens — **change before production** | `replace-with-a-long-random-production-secret` |

> **Important:** If your PostgreSQL password contains an `@` symbol, it must be percent-encoded as `%40` inside the `DATABASE_URL` string, for example `My@Pass` becomes `My%40Pass`.

### Frontend — `frontend/.env.local` (optional)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:9091` |

---

## API Reference

All protected routes require an `Authorization: Bearer <token>` header.

### Auth — `/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Create a new account. Returns a token. |
| `POST` | `/auth/login` | No | Log in. Returns a token. |
| `GET` | `/auth/me` | Yes | Returns the current user's profile. |

### Employee — `/employee`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/employee/entries?month=YYYY-MM` | Yes (employee) | List own entries for a given month. |
| `POST` | `/employee/entries` | Yes (employee) | Create a new entry. |
| `DELETE` | `/employee/entries/{id}` | Yes (employee) | Soft-delete an entry. |

### Leader — `/leader`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/leader/employees` | Yes (leader) | List all employee accounts. |
| `GET` | `/leader/employees/{id}/entries?month=YYYY-MM` | Yes (leader) | List a specific employee's entries for a given month. |

---

## Roles & Permissions

| Action | Employee | Leader |
|---|---|---|
| Register / Login | ✅ | ✅ |
| View own calendar | ✅ | — |
| Create entry | ✅ | ❌ |
| Delete own entry | ✅ | ❌ |
| View team list | ❌ | ✅ |
| View any employee's calendar | ❌ | ✅ |

---

## Database Schema

### `users`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `email` | VARCHAR(255) | Unique, indexed, stored lowercase |
| `password_hash` | VARCHAR(255) | bcrypt hash |
| `full_name` | VARCHAR(255) | |
| `employee_id` | VARCHAR(100) | Unique, indexed |
| `role` | ENUM | `employee` or `leader` |

### `daily_entries`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key → `users.id`, indexed |
| `entry_date` | DATE | The date this entry belongs to, indexed |
| `entry_type` | ENUM | `plan` or `work_done` |
| `task_name` | VARCHAR(255) | Required |
| `client_name` | VARCHAR(255) | Optional |
| `location` | VARCHAR(255) | Optional |
| `description` | TEXT | Optional |
| `created_at` | TIMESTAMPTZ | Set by the database on insert |
| `is_deleted` | BOOLEAN | Soft-delete flag, indexed |
