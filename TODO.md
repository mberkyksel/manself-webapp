# TODO

Things planned for manself, roughly in the order they should be done.

## 1. Chores leak between accounts (bug, do first)

**What happens.** Run `docker compose up --build`, press *Try the demo*, log out, then register a new account in the same browser: the new user's dashboard already shows the demo's chores.

**Why.** Chores are not stored per user. They live in the browser's `localStorage` under one shared key (`manself:chores`, see `frontend/src/stores/choreStore.js`). Nothing clears that key on logout or register, and the demo login writes its sample chores into it. So it is not only the demo: two real users on one browser see each other's chores. The server has no chores table or API at all (tasks, events and notes are per user on the server).

**Fix options.**
- *Quick:* scope the storage key by user id, clear it on logout, and only seed demo chores for the demo account.
- *Proper (recommended):* store chores on the server, per user (a `chores` table and API, like notes), which also gives sync across devices. Items 2 and 3 need this anyway, so it is the base for both.

**Done when:** a brand-new account starts with no chores, one user never sees another's, and a test covers it (frontend store and API).

## 2. Repeating house chores by weekday

Example: the yellow bag is collected every Tuesday, so it should repeat every Tuesday without adding it by hand.

**What exists.** Right-click a chore badge cycles *none → daily → weekly*. "Weekly" repeats on the same weekday as the badge's date, so "every Tuesday" works today if you start from a Tuesday. But it is hidden behind a right-click and cannot express much more than that (the demo's weekly trash chore is built this way).

**What to add**
- A visible way to set the rule (a small popover on the chore, also described in the Home Widget legend) instead of a hidden right-click.
- "Every Tuesday" picked explicitly, several weekdays at once, every 2 weeks (fortnightly yellow bag), and monthly.
- Keep the trash colour states (grey, yellow, blue, brown) per occurrence.
- Keep the existing behaviour: removing one day only skips that day, switching the rule regenerates the upcoming days.

**Notes.** Today occurrences are generated 30 days ahead (daily) or 12 weeks ahead (weekly) from a `{ recurrence, anchorDateKey }` rule. The new rule needs an interval and a set of weekdays. Best done on top of server-side chores (item 1).

## 3. Health section (a second widget, like the chores)

A daily checklist of health habits you tap or drag to tick off, with icons:
- **Gym** (dumbbell icon)
- **10,000 steps** a day (shoe icon)
- **Water**, 1.5 L a day
- **Supplements:** vitamins A, B, C, D and K, omega-3, and so on

**Decisions to make first**
- *Tracking style per item:* simple done/not done (gym, pills) versus a running amount towards a target (water in glasses or 250 ml steps, steps as a number typed in). There is no phone or watch integration, so steps are entered by hand.
- *Which items:* a fixed starter set, or user-configurable (add, remove, change targets, e.g. a different water goal).
- *Reset:* items reset every day; decide whether to keep history or streaks.
- *Where it lives:* a widget under the Home Widget, or its own section on the dashboard.

**Must be per user and stored on the server from day one** (see item 1), not in `localStorage`.

## Smaller things

- Welcome card: add an `aria-label` to the chores toggle (it only has a `title`) and `aria-hidden` on the stat emojis.
- Home Widget: it is translucent glass when the legend is closed, so a note behind the icon grid can show faintly. Make it solid always if that bothers you.
- Weather: Open-Meteo asks for attribution; it is credited in the README but not in the app.
- Docker: publish prebuilt images to GitHub Container Registry so nobody has to build locally.
- Optional: a cookie banner is only needed if analytics or third-party embeds are added.
