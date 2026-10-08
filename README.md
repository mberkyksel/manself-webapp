# manself

[![CI](https://github.com/mberkyksel/manself-webapp/actions/workflows/node.js.yml/badge.svg)](https://github.com/mberkyksel/manself-webapp/actions/workflows/node.js.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**manself** is a personal daily-life dashboard: a ten-day calendar, a focus-style task board, drag-to-schedule household chores, sticky notes, weather and a clock, behind a full account system. Vue 3 on the front, Express and PostgreSQL behind it, and the whole thing starts with one Docker command.

![The manself dashboard: ten-day calendar, chores widget, weather, clock, todos and sticky notes](docs/screenshots/dashboard.png)

It is a portfolio project, built with [Claude Code](https://claude.com/claude-code) as a pair programmer. Every change went through a pull request that was reviewed and merged by hand, with CI running the tests (and a Docker smoke test) each time.

## Quick start

You only need [Docker](https://docs.docker.com/get-docker/) (Compose 2.24 or newer). No `.env`, no keys, no database to set up:

```bash
git clone https://github.com/mberkyksel/manself-webapp.git
cd manself-webapp
docker compose up --build
```

Then open **http://localhost:8080** and press **Try the demo**. The first build takes a minute or two.

Stop it with `Ctrl+C`. `docker compose down` removes the containers and keeps your data; add `-v` to wipe the database too.

## Try the demo

The quickest way to see everything is the one-click demo account. Start the app (see [Quick start](#quick-start)), open it, and press **Try the demo**. Demo mode is on by default with Docker. See [Demo mode](#demo-mode) for what the account contains.

A two-minute tour:

1. **Calendar.** The top card shows the next ten days. Press **+ Add** on a day to create an event, or **Full month** for the whole grid.
2. **Chores.** Drag an icon from the *Home Widget* (top right) onto a day. On a chore badge: click toggles done, double-click removes it (an *Undo* toast appears), right-click cycles repeat (daily / weekly).
3. **Celebration.** Today is one chore short of done. Click the laundry badge in *Today's Chores* to finish the day and get the confetti.
4. **Task board.** Tick the circle on *Prepare Friday demo slides* (or drag it into **Done**): it gets a DONE stamp and the progress bar moves. The overdue and due-today chips at the top show what needs attention. Deleting a task asks for confirmation first.
5. **Sticky notes.** On wide screens, drag a note anywhere or add one with **+ Note**. Below 1440 px wide (phones, tablets, small laptops) they turn into a bottom sheet, so they never cover the page.
6. **Weather.** The card uses your browser location. If you block it, it falls back to a saved city, then to Berlin.
7. **Settings.** Open the menu (top-left logo), then **Settings**, to change the name or weather city. Email, password and deletion are locked on the demo account, and the page says so.

Resize the window (or open it on a phone) to see the mobile layout.

## Screenshots

All taken from the demo account.

| Landing page | Board and sticky notes |
| --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Kanban board, today's chores and sticky notes](docs/screenshots/board.png) |

<p align="center">
  <img src="docs/screenshots/mobile.png" alt="The dashboard on a phone" width="300" />
</p>

## Features

Working end to end, not a skeleton:

- **Auth**: register, login, a settings page (`/app/settings`) to update name/email/password and delete the account (all destructive/credential-changing actions require the current password), session-expiry handling (expired/invalid tokens redirect to login instead of failing silently)
- **Dashboard**: welcome banner, clock, weather (browser geolocation, falling back to a saved city or a default; OpenWeather with a daily-quota budget, or keyless Open-Meteo when no API key is set), branded favicon/wordmark, copyright footer
- **Calendar**: compact and full-month views, event CRUD, optional task linking
- **Task board**: Now / Next / Done lanes with a progress bar, overdue and due-today chips, friendly due-date labels, one-tap completion with a DONE stamp, a collapsing Done lane, and drag-and-drop across lanes (mouse and touch, via Pointer Events)
- **Chores widget**: drag-to-schedule onto a calendar day (mouse and touch), daily/weekly recurrence
- **Sticky notes**: free-drag positioning from 1440 px wide up, a stacked bottom-sheet list below that (no free positioning there - they would cover the page)
- **Today's Todos**: due-today and overdue tasks, inline complete toggle
- **Feedback**: toast notifications, confirm dialogs before destructive actions, and an *Undo* for removed chores; helpful empty states
- **Public site**: landing page with a product preview, 404 page, one-click demo login
- Responsive down to mobile widths across the whole app

**Not implemented yet:** Google Calendar sync. Calendar events are local to the app for now.

## Tech stack

- **Frontend**: Vue 3 (Composition API, `<script setup>`), Vue Router, Pinia, Vite, Tailwind CSS 3, Lucide icons
- **Backend**: Node.js 20+ and Express 5 (ES modules), JWT authentication, bcrypt
- **Database**: PostgreSQL 16 via Sequelize (models and migrations)
- **Tests and CI**: Vitest with Vue Test Utils, Node's test runner with supertest, and GitHub Actions (tests on Node 20 and 22, plus a Docker smoke test)
- **Packaging**: Docker Compose, with nginx serving the build and proxying the API

## Docker

`docker-compose.yml` runs the whole stack: Postgres, the backend API, and the frontend (built, then served by nginx, which also proxies `/api/*` to the backend so the browser only ever talks to one origin - see `frontend/nginx.conf`).

```bash
docker compose up --build        # add -d to run in the background
```

It is set up so that nothing has to be configured:

- **Only the web app's port is published**: `http://localhost:8080` (change it with `FRONTEND_PORT`). The API and Postgres stay inside Docker's network, so nothing clashes with a database or dev server you already run.
- **Demo mode is on** (`DEMO_MODE=true`), so the login page has **Try the demo**.
- **`JWT_SECRET` can be left out**: in demo mode a random one is generated on each start (everyone is signed out when the backend restarts). It is *required* as soon as `DEMO_MODE` is off.
- **Weather needs no key**: without `WEATHER_API_KEY` the backend uses [Open-Meteo](https://open-meteo.com/); with a key it uses OpenWeather.
- The backend waits for Postgres to be healthy, runs any pending migrations on every start, and the frontend waits for the backend to be healthy, so the first click always works.

To change anything, copy `.env.example` to `.env` next to `docker-compose.yml` (optional; it is picked up automatically) or set variables in your shell.

**This is a demo setup, not a production one.** Everyone who clicks *Try the demo* shares one account that is reset on each login. For a real deployment set `DEMO_MODE=false`, a real `JWT_SECRET`, and your own database credentials.

**Developing outside Docker?** `docker-compose.dev.yml` publishes Postgres (`POSTGRES_PORT`, default 5432) and the backend (`BACKEND_PORT`, default 3000) for that; see [Local development](#local-development).

## Demo mode

With `DEMO_MODE=true` (set in `.env`, see `.env.example`) the login and register pages show a **Try the demo** button. One click logs into a shared sample account (`demo@manself.local` / `demo-manself`) that is reset to fresh, date-relative data every time: tasks due today and overdue, upcoming calendar events, sticky notes, and scheduled chores (today is one chore short of done, so finishing it shows the confetti).

- `npm run seed` (in `backend/`) runs the same reset from the command line.
- The server owns tasks, events and notes; chores live in the browser, so the demo login seeds those client-side.
- Email, password and account deletion are blocked on the demo account. Leave `DEMO_MODE` off for any real deployment.

## Local development

To work on the code, run the backend and frontend with npm and keep only Postgres in Docker.

### Prerequisites

- Node.js 20+ and npm
- A running PostgreSQL instance (via Docker Compose, or a local install)

### Setup

1. Copy the env template:

   ```bash
   cp .env.example backend/.env
   ```

   Set `DATABASE_URL` to point at your Postgres instance. `JWT_SECRET` is optional while `DEMO_MODE=true` (a random one is made on each start); generate a real one with `openssl rand -hex 32` if you turn demo mode off.

2. Start Postgres. Easiest via Docker Compose, using the dev file that publishes its port:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
   ```

   This starts Postgres 16 on `localhost:5432` with a persisted `postgres_data` volume, using the `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` values from `.env.example` (defaults: `postgres` / `postgres` / `manself_dev`) unless overridden by a root-level `.env`. If something else already uses port 5432 (a local Postgres, for example), set `POSTGRES_PORT=5433` in that root `.env` and use the same port in `DATABASE_URL`. To make a plain `docker compose up -d postgres` do the same, add `COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml` to that `.env`.

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

### Running locally

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
| `npm test` | Run the API tests (needs the test database, see [Tests](#tests)) |
| `npm run test:setup` | Run migrations on the test database |

## Frontend scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `frontend/dist` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the unit tests once (Vitest) |
| `npm run test:watch` | Re-run the unit tests on change |

## Tests

Both apps run in CI on every push and pull request (`.github/workflows/node.js.yml`).

**Frontend** (Vitest + jsdom, nothing else needed):

```bash
cd frontend && npm test
```

Covers the chore store (recurrence, skipped days, undo), toasts, confirm dialogs, chore removal with undo, the auth store, the weather fallback order, and the "all chores done" celebration.

**Backend** (Node's built-in test runner + supertest) runs the real Express app against a real Postgres, so the migrations and their cascading deletes are exercised. It uses a **separate database** and refuses to run if the database name doesn't contain `test`, because the tests truncate tables:

```bash
docker compose exec postgres createdb -U postgres manself_test     # once
export TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/manself_test   # adjust the port if you changed POSTGRES_PORT
cd backend
npm run test:setup   # runs the migrations on the test database
npm test
```

Covers register/login/token checks, profile, password and email changes, account deletion (including that owned data is deleted), per-user data isolation, demo mode and its restrictions, and the weather endpoint (with the upstream API stubbed).

## Project structure

```
manself-webapp/
├── frontend/              # Vue 3 + Vite + Tailwind + Pinia (src/: components, composables, stores, views)
├── backend/               # Express + Sequelize (src/: controllers, routes, models, migrations, __tests__)
├── docs/screenshots/      # images used in this README
├── docker-compose.yml     # the zero-config stack
├── docker-compose.dev.yml # extra ports for developing outside Docker
└── .github/workflows/     # CI: tests on Node 20 and 22, Docker smoke test
```

## Credits

- Fonts: [Fredoka](https://github.com/hafontia/Fredoka-One) for the wordmark (SIL Open Font License 1.1, see `frontend/src/assets/fonts/fredoka-OFL.txt`) and Permanent Marker by Font Diner for the sticky notes (Apache License 2.0, see `frontend/src/assets/fonts/permanent-marker-APACHE-2.0.txt`). Both are self-hosted.
- Icons: [Lucide](https://lucide.dev/) (ISC). Animated weather icons: [Skycons](https://github.com/darkskyapp/skycons) (MIT).
- Weather data: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0, used when no OpenWeather key is set) and [OpenWeather](https://openweathermap.org/) (when one is).

## License

[MIT](LICENSE) © 2026 Mehmet Berk Yüksel
