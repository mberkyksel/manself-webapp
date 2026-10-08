# manself-webapp

A multi-purpose daily-life dashboard: welcome/weather/clock, a calendar (Google Calendar integration planned), a Jira-style kanban task board, a drag-to-schedule recurring household chores widget, freely-positioned sticky notes, and a due-today/overdue todo list - with full account management (register, login, profile/email/password updates, account deletion) behind it.

![The manself dashboard: ten-day calendar, chores widget, weather, clock, todos and sticky notes](docs/screenshots/dashboard.png)

## Try the demo

The quickest way to see everything is the one-click demo account. Start the app (see [Docker](#docker) or [Setup](#setup)), open it, and press **Try the demo**. It needs `DEMO_MODE=true`, which `.env.example` already sets. See [Demo mode](#demo-mode) for what the account contains.

A two-minute tour:

1. **Calendar.** The top card shows the next ten days. Press **+ Add** on a day to create an event, or **Full month** for the whole grid.
2. **Chores.** Drag an icon from the *Home Widget* (top right) onto a day. On a chore badge: click toggles done, double-click removes it (an *Undo* toast appears), right-click cycles repeat (daily / weekly).
3. **Celebration.** Today is one chore short of done. Click the laundry badge in *Today's Chores* to finish the day and get the confetti.
4. **Kanban board.** Drag *Prepare Friday demo slides* into **Done**. Deleting a task asks for confirmation first.
5. **Sticky notes.** Drag a note anywhere, or add one with **+ Note**. Below 640 px wide they turn into a bottom sheet.
6. **Weather.** The card uses your browser location. If you block it, it falls back to a saved city, then to Berlin.
7. **Settings.** Open the menu (top-left logo), then **Settings**, to change the name or weather city. Email, password and deletion are locked on the demo account, and the page says so.

Resize the window (or open it on a phone) to see the mobile layout.

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

## Screenshots

All taken from the demo account.

| Landing page | Board and sticky notes |
| --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Kanban board, today's chores and sticky notes](docs/screenshots/board.png) |

<p align="center">
  <img src="docs/screenshots/mobile.png" alt="The dashboard on a phone" width="300" />
</p>

## Status

End-to-end functional, not just a skeleton:

- **Auth**: register, login, a settings page (`/app/settings`) to update name/email/password and delete the account (all destructive/credential-changing actions require the current password), session-expiry handling (expired/invalid tokens redirect to login instead of failing silently)
- **Dashboard**: welcome banner, clock, weather (browser geolocation, falling back to a saved city or a default; daily-quota API), branded favicon/wordmark, copyright footer
- **Calendar**: compact and full-month views, event CRUD, optional task linking
- **Kanban board**: task CRUD, drag-and-drop reordering across columns (mouse and touch, via Pointer Events)
- **Chores widget**: drag-to-schedule onto a calendar day (mouse and touch), daily/weekly recurrence
- **Sticky notes**: free-drag positioning on desktop/tablet, a stacked bottom-sheet list on mobile (no free positioning there - not enough room)
- **Today's Todos**: due-today and overdue tasks, inline complete toggle
- **Feedback**: toast notifications, confirm dialogs before destructive actions, and an *Undo* for removed chores; helpful empty states
- **Public site**: landing page with a product preview, 404 page, one-click demo login
- Responsive down to mobile widths across the whole app

Not implemented yet: Google Calendar sync (calendar events are local-only for now).

## Demo mode

With `DEMO_MODE=true` (set in `.env`, see `.env.example`) the login and register pages show a **Try the demo** button. One click logs into a shared sample account (`demo@manself.local` / `demo-manself`) that is reset to fresh, date-relative data every time: tasks due today and overdue, upcoming calendar events, sticky notes, and scheduled chores (today is one chore short of done, so finishing it shows the confetti).

- `npm run seed` (in `backend/`) runs the same reset from the command line.
- The server owns tasks, events and notes; chores live in the browser, so the demo login seeds those client-side.
- Email, password and account deletion are blocked on the demo account. Leave `DEMO_MODE` off for any real deployment.

## Docker

`docker-compose.yml` runs the full stack: Postgres, the backend API, and the frontend (built and served via nginx).

```bash
cp .env.example .env   # fill in JWT_SECRET at minimum
docker compose up -d --build
```

- Frontend: `http://localhost:8080` (nginx serves the Vite production build and proxies `/api/*` to the backend, same-origin - see `frontend/nginx.conf`)
- Backend (direct): `http://localhost:3000`
- Postgres: `localhost:5432`

The backend container runs pending migrations on every start before launching the server, so pulling new migration files just needs a restart - no manual `npm run migrate` step. Override the default host ports with `BACKEND_PORT` / `FRONTEND_PORT` / `POSTGRES_PORT` in `.env` if they collide with something else already running.

To run Postgres only, for local (non-Docker) frontend/backend development:

```bash
docker compose up -d postgres
```
