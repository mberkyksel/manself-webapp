# TODO

Things planned for manself, roughly in the order they should be done.

## 1. Repeating house chores by weekday

Example: the yellow bag is collected every Tuesday, so it should repeat every Tuesday without adding it by hand.

**What exists.** Right-clicking a chore badge does not open a menu: each right-click silently cycles the rule *none → daily → weekly → none*, so the first right-click just makes the chore repeat daily and nothing tells you that happened or lets you choose. "Weekly" repeats on the same weekday as the badge's date, so "every Tuesday" works if you right-click twice from a Tuesday, but you would never guess that. It cannot express much more than that (the demo's weekly trash chore is built this way).

**What to add**
- **A real menu on right-click** (and a long-press on touch) listing the choices: don't repeat, daily, every *Tuesday*, every 2 weeks, monthly, and so on, with the current choice marked. No more silent cycling. Also describe it in the Home Widget legend.
- "Every Tuesday" picked explicitly, several weekdays at once, every 2 weeks (fortnightly yellow bag), and monthly.
- Keep the trash colour states (grey, yellow, blue, brown) per occurrence.
- Keep the existing behaviour: removing one day only skips that day, switching the rule regenerates the upcoming days.

**Notes.** Today occurrences are generated 30 days ahead (daily) or 12 weeks ahead (weekly) from a `{ recurrence, anchorDateKey }` rule. The new rule needs an interval and a set of weekdays. Chores are stored per user on the server now, so the rule is saved with the rest of a user's chores.

## 2. Health section (a second widget, like the chores)

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

**Must be per user and stored on the server from day one**, not in `localStorage` (chores are now stored per user on the server).

## Smaller things

- Welcome card: add an `aria-label` to the chores toggle (it only has a `title`) and `aria-hidden` on the stat emojis.
- Home Widget: it is translucent glass when the legend is closed, so a note behind the icon grid can show faintly. Make it solid always if that bothers you.
- Weather: Open-Meteo asks for attribution; it is credited in the README but not in the app.
- Docker: publish prebuilt images to GitHub Container Registry so nobody has to build locally.
- Optional: a cookie banner is only needed if analytics or third-party embeds are added.
