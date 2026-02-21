# ProjectMarket 

A **role-based project marketplace** that connects Buyers with Problem Solvers,users, admins through a structured, end-to-end workflow — from project creation to task submission and review.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Project Structure](#project-structure)
7. [API Reference](#api-reference)
8. [Role & Workflow Guide](#role--workflow-guide)
9. [Database Design](#database-design)
10. [Deployment](#deployment)

---

## Features

-  **JWT Authentication** — secure login/register with token-based sessions

-  **Role-Based Access Control** — Admin, Buyer, Problem Solver, and User roles enforced on both frontend and backend

-  **Project Lifecycle Management** — full `open → assigned → in_progress → completed` flow

-  **Task & Submission System** — solvers create tasks and submit ZIP deliverables per task

-  **Dark / Light Theme** — persistent theme toggle, no flash on reload

-  **Fully Responsive Navbar** — CSS media-query-based (no JS layout flicker)

-  **Dashboard with All Projects** — search and filter by status, visible to all roles

-  **Smooth Animations** — Framer Motion transitions throughout

---

## Tech Stack

| Layer        | Technology                                     |
|--------------|------------------------------------------------|
| **Frontend** | Next.js 14 (App Router), React 18              |
| **Styling**  | Pure CSS + CSS Variables (no Tailwind)         |
| **Animation**| Framer Motion                                  |
| **Backend**  | Node.js, Express.js                            |
| **Database** | MongoDB Atlas (`ProjectMarket` DB) + Mongoose  |
| **Auth**     | JWT (`jsonwebtoken` + `bcryptjs`)              |
| **File Upload** | Multer — ZIP only, 50 MB limit              |
| **HTTP Client** | Axios          |

---

## Architecture Overview

### Role Hierarchy

```
Admin (First user is automatically admin)
 ├── Assign Buyer / Problem Solver roles to any user
 ├── View all users
 └── View all projects

Buyer
 ├── Create projects
 ├── Review solver requests
 ├── Assign one problem solver per project
 └── Accept / reject task submissions

Problem Solver
 ├── Maintain a profile (bio, skills, experience)
 ├── Browse open projects in the Marketplace
 ├── Request to work on a project
 └── Once assigned: create tasks and submit ZIP files

User (default/unassigned)
 └── Waiting state — must be assigned a role by Admin
```

### Project Lifecycle

```
  open ──► assigned ──► in_progress ──► completed
                                    │
                                    └──► cancelled
```

1. **Buyer** creates a project → status: `open`

2. **Problem Solvers** send work requests

3. **Buyer** picks a solver → status: `assigned` (other pending requests auto-rejected)

4. **Solver** creates tasks → status: `in_progress`

5. Per task: `todo → in_progress → submitted → completed` (or `rejected` → resubmit)
6. When all tasks complete → project auto-completes


## Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **MongoDB** — local instance or [MongoDB Atlas]

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/projectmarket.git
cd projectmarket
```

### 2. Set up the Backend

```bash
cd backend
touch .env # Edit it with environment variables
npm install
npm run dev
```

Backend starts on `http://localhost:5000`

### 3. Set up the Frontend

```bash
cd ../frontend
touch .env.local # Edit it with environment variables
npm install
npm run dev
```

Frontend starts on `http://localhost:3000`


---

## Environment Variables

### Backend — `backend/.env`

```env
PORT=
MONGODB_URI=
JWT_SECRET=
FRONTEND_URL=
NODE_ENV=
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```


## Project Structure

```
projectmarket/
├── backend/
│   ├── src/
│   │   ├── index.js           # Express app entry point + DB connection
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT verify middleware
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   ├── Request.js
│   │   │   ├── Task.js
│   │   │   └── Submission.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── users.js
│   │       ├── projects.js
│   │       ├── requests.js
│   │       ├── tasks.js
│   │       └── submissions.js
│   ├── uploads/               # Uploaded ZIP files (gitignored)
│   └── .env                   # Backend config (gitignored)
│
├── frontend/
│   ├── app/                   # Next.js pages
│   ├── components/            # Shared UI components
│   ├── context/               # React context providers
│   ├── lib/                   # API client
│   └── styles/                # Global CSS
│
├── render.yaml                # Render.com deployment config
├── vercel.json                # Vercel deployment config
├── .gitignore
└── README.md
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/user-count` | None | Returns `{ count }` — used to show first-user hint |
| `POST` | `/register` | None | Register new user. First user auto-becomes Admin |
| `POST` | `/login` | None | Login, returns `{ token, user }` |
| `GET` | `/me` | JWT | Returns current authenticated user |

### Users — `/api/users`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Admin | Get all users |
| `PATCH` | `/:id/role` | Admin | Assign a role to a user |
| `PATCH` | `/profile` | Problem Solver | Update own profile (bio, skills, etc.) |
| `GET` | `/:id` | Any | Get a user by ID |

### Projects — `/api/projects`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/` | Any | Get all projects (all roles see all projects on dashboard) |
| `GET` | `/:id` | Any | Get project detail with full populated fields |
| `POST` | `/` | Buyer | Create a new project |
| `PATCH` | `/:id` | Buyer | Update project (only while status is `open`) |
| `PATCH` | `/:id/assign` | Buyer | Assign a problem solver — transitions to `assigned` |

### Requests — `/api/requests`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/project/:id` | Buyer / Admin | Get all requests for a specific project |
| `GET` | `/mine` | Problem Solver | Get own work requests |
| `POST` | `/` | Problem Solver | Submit a request to work on a project |

### Tasks — `/api/tasks`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/project/:id` | Buyer / Solver / Admin | List all tasks for a project |
| `POST` | `/` | Problem Solver | Create a task (project must be `assigned`) |
| `PATCH` | `/:id` | Solver / Buyer | Update task status |
| `DELETE` | `/:id` | Problem Solver | Delete a task (only in `todo` status) |

### Submissions — `/api/submissions`

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `GET` | `/task/:id` | Buyer / Solver | List submissions for a task |
| `POST` | `/` | Problem Solver | Upload a ZIP submission (multipart/form-data) |
| `PATCH` | `/:id/review` | Buyer | Accept or reject a submission |

---

## Role & Workflow Guide

### As an Admin
1. Go to **Dashboard** → **Manage Users**
2. Find a user and assign them `buyer` or `problem_solver` role
3. Monitor all projects at `/admin/projects`

### As a Buyer
1. Go to **Dashboard** → click **New Project**
2. Fill in title, description, budget, deadline, and required skills
3. Open your project to review incoming solver requests
4. Assign the best solver — other requests are auto-rejected
5. Monitor task progress; accept or reject each submission
6. Project auto-completes when all tasks are done

### As a Problem Solver
1. Build your profile at `/solver/profile` (bio, skills, links)
2. Browse open projects in the **Marketplace**
3. Request to work on projects that match your skills
4. Once assigned, create tasks in the project detail view
5. Submit a ZIP file per task for buyer review
6. If rejected, fix and resubmit

---

## Database Design

MongoDB database: **`ProjectMarket`**

| Collection | Key Fields | Notes |
|------------|-----------|-------|
| `users` | `name`, `email`, `passwordHash`, `role`, `profile` | `role` ∈ admin, buyer, problem_solver, user |
| `projects` | `title`, `description`, `budget`, `deadline`, `status`, `buyer`, `assignedTo`, `skills` | References `users` |
| `requests` | `project`, `problemSolver`, `message`, `status` | Compound unique index prevents duplicates |
| `tasks` | `project`, `title`, `description`, `status`, `createdBy` | References `projects` + `users` |
| `submissions` | `task`, `project`, `submittedBy`, `fileUrl`, `status`, `feedback` | References all |

---

## Deployment

### Backend — Render / Railway

1. Push your code to GitHub
2. Create a new Web Service pointing to the `backend/` directory
3. Set build command: `npm install`
4. Set start command: `node src/index.js`
5. Add all environment variables from `backend/.env`

### Frontend — Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`
5. Deploy

### MongoDB — Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database named **`ProjectMarket`** (Mongoose will auto-create collections)
3. Add your connection string to `MONGODB_URI` in the backend env

---

