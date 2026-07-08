# manself-webapp

A multi-purpose daily-life dashboard: welcome/weather/clock, a calendar (Google Calendar integration planned), and a Jira-style kanban task board.

## Tech stack

- **Frontend**: Vue 3 (Composition API) + Vite + Tailwind CSS + Pinia
- **Backend**: Node.js + Express (ES Modules)
- **Database**: PostgreSQL via Sequelize (models + migrations)

## Prerequisites

- Node.js 20+ and npm
- A running PostgreSQL instance (via Docker Compose, or a local install)

## Setup

1. Copy the env template and fill in real values:

   ```bash
   cp .env.example backend/.env
   ```

   At minimum, set `DATABASE_URL` to point at your Postgres instance.

2. Start Postgres. Easiest via Docker Compose:

   ```bash
   docker compose up -d postgres
   ```

   This starts Postgres 16 on `localhost:5432` with a persisted `postgres_data` volume, using the `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` values from `.env.example` (defaults: `postgres` / `postgres` / `manself_dev`) unless overridden by a root-level `.env`.

   Without Docker, create the database manually instead:

   ```bash
   createdb manself_dev
   ```

3. Install dependencies for both apps:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. Run migrations:

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

`docker-compose.yml` currently runs Postgres only (`docker compose up -d postgres`), for local development. `frontend/` and `backend/` are structured so each can get its own `Dockerfile` and be added as services later without restructuring.
