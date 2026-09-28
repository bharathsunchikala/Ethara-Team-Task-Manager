# Team Task Manager

A production-style project management application with JWT authentication, role-based access control, project membership, task assignment, dashboard analytics, overdue tracking, filtering, pagination, and a responsive React UI. The existing Node.js API remains the default production backend; an optional FastAPI service provides a Python API and AI task-assignee recommendations.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router DOM, Axios, Context API
- Default backend: Node.js, Express.js, MongoDB, Mongoose
- Optional backend: Python 3.11+, FastAPI, Motor, Pydantic
- AI: scikit-learn TF-IDF and Logistic Regression
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

### Root Scripts

The repository includes a root `package.json` for deployment platforms such as Railway.

```bash
npm install
npm run build
npm start
```

The root build script builds the React app. The root start script starts the Express API, which serves `frontend/dist` in production.

### Backend (Node.js)

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Update `backend/.env` with your MongoDB URI and a strong `JWT_SECRET`.

### FastAPI Backend (optional)

The Python service is in `backend/app` and uses the same MongoDB collections as the Node API. Run it from the `backend` directory:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements-dev.txt
make run
```

On Windows PowerShell, use `python -m uvicorn app.main:app --reload` from `backend` if GNU Make is unavailable.

Set `MONGO_URI`, `JWT_SECRET`, and optionally `CLIENT_URL` in `backend/.env`. The FastAPI API is served at `http://localhost:8000`; interactive API docs are at `/docs`. The frontend can call its recommendation endpoint by setting `VITE_FASTAPI_URL=http://localhost:8000/api/v1` in `frontend/.env` and restarting Vite. Use the same `JWT_SECRET` as the Node service so existing login tokens work.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

The frontend defaults to `http://localhost:5000/api`. Change `VITE_API_URL` if your API runs elsewhere.

## Railway Deployment

This repo is configured for a single Railway service from the repository root.

Railway uses:

- `railway.json`
- root `package.json`
- `npm run build`
- `npm start`
- health check path `/api/health`

Required Railway variables:

```env
NODE_ENV=production
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
ALLOW_PUBLIC_ADMIN_SIGNUP=true
```

Do not set `PORT` on Railway; Railway provides it automatically.

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

### FastAPI API Reference

All FastAPI endpoints are prefixed with `/api/v1`; all routes except registration, login, and health require a bearer token.

- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `GET /api/v1/auth/users` (admin only)
- `GET /api/v1/users`, `GET /api/v1/users/{id}`, `PATCH /api/v1/users/{id}`
- `GET /api/v1/projects`, `POST /api/v1/projects`, `GET /api/v1/projects/{id}`, `PATCH /api/v1/projects/{id}`, `DELETE /api/v1/projects/{id}`
- `GET /api/v1/projects/{id}/stats`
- `GET /api/v1/tasks`, `POST /api/v1/tasks`, `GET /api/v1/tasks/{id}`, `PATCH /api/v1/tasks/{id}`, `DELETE /api/v1/tasks/{id}`
- `POST /api/v1/tasks/{id}/recommend`
- `GET /api/health`

### AI Feature

`backend/app/ai/trainer.py` trains a TF-IDF and Logistic Regression model from `backend/app/ai/tasks_training.csv` and writes `model.joblib`. Train with `python -m app.ai.trainer` from `backend`. Replace the sample labels with real Mongo user IDs before relying on model predictions. Recommendations are restricted to the task project's members; if the model is missing or predicts an ineligible user, the API safely chooses an eligible member and returns zero confidence.

### FastAPI Deployment

Run the Python service and MongoDB locally with Docker Compose:

```bash
JWT_SECRET="replace-with-a-long-random-secret" docker compose up --build
```

In Windows PowerShell, set `$env:JWT_SECRET="replace-with-a-long-random-secret"` before running `docker compose up --build`.

The GitHub Actions workflow runs Ruff, async HTTP tests, and a Docker build on pushes and pull requests. On pushes to `main`, it also publishes to Docker Hub and triggers a Render deployment. Configure repository secrets `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_API_KEY`, and `RENDER_SERVICE_ID`.

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

## License

No license file is currently included in this repository.
