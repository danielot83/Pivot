# Pivot

**Basketball coaching, all in one place.**

Pivot is a coaching platform for basketball clubs — roster management,
a shared exercise library, session planning, match sheets, interactive
play design, and a detailed player-development tracker, all in the
browser, free to use.

**[→ Try it live](https://danielot83.github.io/Pivot/)**

## Status

| Module | Status | Tested? |
|---|---|---|
| Roster | ✅ Live | ✅ Simulated tests pass |
| Player assessment (Suivi) | ✅ Live | ✅ Simulated tests pass |
| Exercise creator + library | ✅ Live | ✅ Simulated tests pass |
| Training builder | ✅ Live | ✅ Simulated tests pass |
| Match day | ✅ Live | ✅ Simulated tests pass |
| Play design | ✅ Live | ✅ Simulated tests pass |
| Compare players | ✅ Live (extra tool) | ✅ Simulated tests pass |
| PDF export (all modules above) | ✅ Live | ✅ Simulated tests pass |
| Excel import/export | ✅ Live | ✅ Simulated tests pass |
| AI-assisted fill-in (Suivi) | ✅ Live | ✅ Simulated tests pass |
| 56 shared starter exercises | ✅ Seeded | ✅ SQL structure checked |

"Simulated tests pass" means: checked with a Node.js harness that mimics
Supabase's responses — **not yet confirmed against real, live production
data end to end.** Treat every module as "should work" until you've
clicked through it yourself at least once.

## How it's built

- Plain HTML/CSS/JavaScript — no build step, no framework. Each page is
  one self-contained file (plus two shared ones: `modules-grid.js` and
  `court-diagram.js`).
- [Supabase](https://supabase.com) for accounts, database, and file
  storage (Postgres + Row Level Security — each club only ever sees its
  own data, enforced by the database itself, not just the app).
- Hosted for free on GitHub Pages.
- PDFs are generated **in the browser** (via jsPDF) — no server needed
  for that anymore. This makes the original idea of a small PDF service
  on Infomaniak an open question rather than a requirement — see below.

## Where everything lives

```
Pivot/
├── index.html          # public landing page
├── login.html          # sign up / log in, create or join a club
├── module.html          # public info page per module
├── modules-grid.js       # shared module list, used across pages
├── dashboard.html        # home screen once logged in
├── settings.html          # club logo, members, exercise sharing
│
├── roster.html             # players by season/team
├── assessment.html          # player assessment (Suivi)
├── play_design.html          # interactive play/set drawing
├── exercises.html              # exercise creator (5-step diagrams)
├── library.html                 # search/filter the exercise library
├── court-diagram.js               # shared drawing engine — used by
│                                    both play_design.html and exercises.html
├── match.html                   # match day: call-up, stats, season summary
├── training.html               # session builder, attendance
├── compare.html                # compare any players/seasons side by side
│
├── database/            # SQL migrations, run in Supabase, in order
│   └── step2 … step15
└── docs/                 # project plan and notes
```

Everything above (except `database/` and `docs/`) goes in the
**repository root** — HTML and JS sit side by side, since pages link to
each other and to the shared JS files by plain filename.

## Open questions

- **Infomaniak / a PDF microservice**: originally planned for generating
  match/session/assessment sheets server-side. Since PDFs now generate
  directly in the browser, this may no longer be needed at all — worth
  deciding deliberately rather than building it "because it was in the
  plan."
- Security: 2FA, CAPTCHA on signup, and finer-grained permissions
  (per-team, not just per-club) are designed but not built.
- Multi-language: none for now, by design — the whole app (including the
  56 seeded exercises) is in English only.
- Translate the desktop app's remaining content, if anything is found
  still in French.

See `docs/Pivot_Cloud_Plan_v1.md` for the fuller roadmap and history.

---

© 2026 DOT — non-profit.
