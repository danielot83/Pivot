# Pivot

**Basketball coaching, all in one place.**

Pivot is a coaching platform for basketball clubs — a shared exercise
library, session planning, match sheets, and a detailed player-development
tracker, all in the browser, free to use.

**[→ Try it live](https://danielot83.github.io/Pivot/)**

## What's inside

| Module | Status |
|---|---|
| Roster — players by season and team | ✅ Live |
| Player assessment (Suivi) — 36 criteria, basic/advanced modes | ✅ Live |
| Exercise library | 🚧 Coming |
| Training builder | 🚧 Coming |
| Match day | 🚧 Coming |
| Play design | 🚧 Coming |

## How it's built

- Plain HTML/CSS/JavaScript — no build step, no framework, easy to read
  and change one file at a time.
- [Supabase](https://supabase.com) for accounts, database, and file
  storage (Postgres + Row Level Security).
- Hosted for free on GitHub Pages.

```
Pivot/
├── index.html        # public landing page
├── login.html         # sign up / log in, create or join a club
├── dashboard.html      # home screen once logged in
├── settings.html        # club logo and admin settings
├── roster.html            # player roster
├── assessment.html          # player assessment (Suivi)
├── module.html                # public info page per module
├── modules-grid.js              # shared module list, used across pages
├── database/                      # SQL migrations, in order
└── docs/                            # project plan and notes
```

## Status

Early and under active development — built incrementally, module by
module. See `docs/Pivot_Cloud_Plan_v1.md` for the roadmap.

---

© 2026 DOT — non-profit.
