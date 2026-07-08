# manself-webapp

A multi-purpose daily-life dashboard: welcome/weather/clock, a calendar (Google Calendar integration planned), and a Jira-style kanban task board.

## Tech stack

- **Frontend**: Vue 3 (Composition API) + Vite + Tailwind CSS + Pinia
- **Backend**: Node.js + Express (ES Modules)
- **Database**: PostgreSQL via Sequelize (models + migrations)

## Prerequisites

- Node.js 20+ and npm
- A running PostgreSQL instance

## Setup

1. Copy the env template and fill in real values:

   ```bash
   cp .env.example backend/.env
   ```

   At minimum, set `DATABASE_URL` to point at your local Postgres instance and create that database:

   ```bash
   createdb manself_dev
   ```

2. Install dependencies for both apps:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Run migrations:

   ```bash
   cd backend
   npm run migrate
   ```

## Running locally

Backend (from `backend/`):

```bash
npm run dev       # nodemon, restarts on file change
```

Starts the Express API on `http://localhost:3000`. Health check: `GET /api/health`.

Frontend (from `frontend/`):

```bash
npm run dev
```

Starts the Vite dev server on `http://localhost:5173`. API calls to `/api/*` are proxied to the backend during development (see `frontend/vite.config.js`).

## Backend scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the API with nodemon |
| `npm start` | Start the API with plain node |
| `npm run migrate` | Run pending Sequelize migrations |
| `npm run migrate:undo` | Roll back the last migration |
| `npm run seed` | Run seeders |

## Frontend scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `frontend/dist` |
| `npm run preview` | Preview the production build locally |

## Project structure

```
manself-webapp/
├── frontend/   # Vue 3 + Vite + Tailwind + Pinia
└── backend/    # Node.js + Express (ESM) + Sequelize
```

See `frontend/src/` and `backend/src/` for the full module layout (components, composables, stores, models, controllers, routes, migrations).

## Status

Skeleton stage: Express server, Postgres schema/migrations, and Vue app shell are wired up end-to-end. Authentication, the weather widget, and Google Calendar sync are not implemented yet.

## Docker

Not set up yet. `frontend/` and `backend/` are structured so each can get its own `Dockerfile` later without restructuring; `docker-compose.yml` at the repo root is a placeholder for that stage.
