# Ethara Team Task Manager

A production-style MERN project management application with JWT authentication, role-based access control, project membership, task assignment, dashboard analytics, overdue tracking, filtering, pagination, and a responsive React UI.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router DOM, Axios, Context API
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Auth: JWT access tokens, bcryptjs password hashing
- Security: Helmet, CORS allow-list, Mongo sanitization, rate limiting, protected routes, RBAC middleware

## Project Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    utils/
frontend/
  src/
    api/
    components/
    context/
    pages/
    utils/
```

## Setup

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Update `backend/.env` with your MongoDB URI and a strong `JWT_SECRET`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend defaults to `http://localhost:5000/api`. Change `VITE_API_URL` if your API runs elsewhere.

## Environment Variables

Backend:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ethara_team_task_manager
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ALLOW_PUBLIC_ADMIN_SIGNUP=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

Set `ALLOW_PUBLIC_ADMIN_SIGNUP=false` outside demo environments and create admins through a trusted operational flow.

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

## Roles

Admin:

- Create, edit, and delete projects
- Add and remove project members
- Create, assign, edit, and delete tasks
- View all projects, tasks, team members, and dashboard analytics

Member:

- View projects where they are a member
- View assigned tasks
- Update task status
- Cannot delete projects or tasks

## API Endpoints

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/users` admin only

Projects:

- `POST /api/projects` admin only
- `GET /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id` admin only
- `DELETE /api/projects/:id` admin only
- `POST /api/projects/:id/members` admin only
- `DELETE /api/projects/:id/members/:memberId` admin only

Tasks:

- `POST /api/tasks` admin only
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id` admin only
- `DELETE /api/tasks/:id` admin only
- `PUT /api/tasks/:id/status`

Dashboard:

- `GET /api/dashboard`

## Query Features

`GET /api/tasks` supports:

- `search`
- `status`
- `priority`
- `project`
- `assignedTo` admin only
- `overdue=true`
- `page`
- `limit`
- `sortBy`
- `sortOrder=asc|desc`

`GET /api/projects` supports:

- `search`
- `page`
- `limit`
- `sortBy`
- `sortOrder=asc|desc`

## Notes

- Due dates are validated on the backend and frontend and cannot be in the past.
- Task assignment is rejected unless the assignee belongs to the selected project.
- Passwords are hashed and never returned by the API.
- Invalid or expired JWTs receive `401` responses and the frontend clears local auth state.
