# PCM (PSMSM2) — Project Report

## Summary

This repository implements a project and task management system with real-time chat and notifications. It consists of a Node.js/Express backend and a React frontend (in `pcm-frontend`). Features include user authentication, project and task management, file uploads per project, activity logging, real-time chat via sockets, and notifications.

## Tech Stack

- **Backend:** Node.js, Express
- **Realtime:** Socket.io (server config under `config/socket.js`)
- **Database:** SQL (init script at `db/init.sql`)
- **Frontend:** React (project `pcm-frontend` — `src/` with components and pages)
- **Other:** multer/file system for uploads, JSON web tokens for auth, custom middleware for error handling

## Repo Structure (high-level)

- `backend/` — Express app and server logic
  - `app.js`, `server.js` — app entrypoints
  - `config/` — database and socket configuration (`database.js`, `socket.js`)
  - `controllers/` — request handlers (`authController.js`, `projectsController.js`, `tasksController.js`, `chatController.js`, etc.)
  - `routes/` — route definitions grouped by feature (`authRoutes.js`, `projectRoutes.js`, `taskRoutes.js`, `chatRoutes.js`, `userRoutes.js`, etc.)
  - `middleware/` — `authMiddleware.js`, `errorMiddleware.js`
  - `utils/` — helpers like `activityLogger.js`, `authUtils.js`, `constants.js`
  - `uploads/` — per-project upload folders (e.g., `project_30/`)
  - `db/init.sql` — database initialization script

- `pcm-frontend/` — React frontend
  - `src/App.js`, `src/index.js`
  - `src/components/` — UI components (`Chat.jsx`, `AddProjectModal.jsx`, `AddTaskModal.jsx`, `ActivityLogs.jsx`, etc.)
  - `src/styles/variables.css` — CSS variables and theme values

## Backend: Key Components

- Authentication: `controllers/authController.js` with routes in `routes/authRoutes.js`. Uses JWT and `middleware/authMiddleware.js`.
- Projects & Tasks: `controllers/projectsController.js`, `controllers/tasksController.js` with routes in `routes/projectRoutes.js` and `routes/taskRoutes.js`.
- Chat: `controllers/chatController.js` and `routes/chatRoutes.js` plus socket configuration in `config/socket.js`.
- Activity Logging: `utils/activityLogger.js` and `controllers/activityController.js` (routes in `routes/activityRoutes.js`).
- File uploads: handled via upload middleware and stored under `backend/uploads/project_<id>/` with subfolders for `project_files` and `task_submissions`.

## Frontend: Key Components

- App entry: `src/index.js` bootstraps React, `src/App.js` defines main app layout.
- Components: modular React components in `src/components/` for projects, tasks, chat, modals, and notifications.
- Styles: central variables in `src/styles/variables.css` used across components.
- Context: `NotificationContext.jsx` to manage user notifications in the UI.

## Database

- Schema initialization: `backend/db/init.sql` — contains table definitions and seed examples. The app expects a SQL-based DB (MySQL/Postgres-style SQL found in `init.sql`).
- Database params: configured in `backend/config/database.js`.

## Realtime & Notifications

- Socket server configured in `backend/config/socket.js` and integrated in `server.js`/`app.js`.
- Chat messages and some notifications are delivered via sockets for real-time updates.

## How to run (development)

1. Backend

```bash
cd backend
npm install
# start with node or npm script (check package.json)
node server.js
```

2. Frontend

```bash
cd pcm-frontend
npm install
npm start
```

Notes: Inspect `backend/package.json` and `pcm-frontend/package.json` for exact scripts (e.g., `start`, `dev`). Ensure the database is running and configured per `backend/config/database.js`.

## API Endpoints (overview)

Routes are grouped under `backend/routes/`. Expect endpoints such as:

- `POST /api/auth/login`, `POST /api/auth/register`
- `GET/POST/PUT/DELETE /api/projects`
- `GET/POST/PUT/DELETE /api/tasks`
- `GET/POST /api/users` (user management)
- `POST /api/chat` and real-time socket events for messaging
- `GET /api/activity` (activity logs)
- `GET /api/notifications` (notifications)

Check the route files for exact paths and parameters: `backend/routes/*.js`.

## Files Added/Edited During Development

- Multiple per-project upload folders exist under `backend/uploads/` (e.g., `backend/uploads/project_30/` etc.).

## Notes & Next Steps

- Add explicit API documentation (request/response examples) for each route.
- Add Postman/OpenAPI spec for easier integration and testing.
- Add database migration tooling (e.g., Knex, Sequelize, or Flyway) for schema management.

---

Generated on: 2025-12-21
