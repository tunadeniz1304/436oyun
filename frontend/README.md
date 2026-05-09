# ISO Testing World

A browser-based educational simulation that teaches **ISO/IEC/IEEE 29119-1:2022 — Software Testing — Part 1: General Concepts** to software-engineering students through a 10–15 minute incident-response narrative.

**Team:** OPUS — Tuna Deniz, Goktuğ Tabak, Oğuzhan Tarhan, Buğra Kara
**Course:** IT & ISQS — Learner-as-Designer Project

## Quick start

```bash
npm install
npm run dev   # opens http://localhost:5173
```

That is the entire setup. No backend, no database, no auth — everything is in-memory React state.

## What the player does

The player is a senior test engineer resolving production incident #047. They progress through five zones, each targeting a specific ISO concept cluster and each designed so that informal, everyday definitions produce the wrong answer:

| Zone                        | Concept cluster                       | Misconception exposed                                |
| --------------------------- | ------------------------------------- | ---------------------------------------------------- |
| **1 · Error District**      | Error → Fault → Failure (§3.39, §4.7) | "bug, defect, and crash mean the same thing"         |
| **2 · V&V Headquarters**    | Verification, Validation (§4.1.3)     | "verification = developers; validation = users"     |
| **3 · Test Matrix Tower**   | Levels × Types (§3.108, §3.130)       | "test type is fixed by test level"                   |
| **4 · Artefact Archive**    | Test Basis & Test Item (§3.84, §3.107)| "static analysis is not testing; basis must be a doc"|
| **Final Inspection**        | All + Test Oracle (§3.115, §4.1.10)   | integrating decisions across the whole framing       |

Every wrong answer opens a feedback modal that **cannot be dismissed without reading** the verbatim ISO clause definition.

## Stack

- Vite + React 18+
- React Router v6
- @dnd-kit/core + @dnd-kit/sortable (Zone 1 only)
- Framer Motion (route transitions, modal animations)
- Plain CSS files with CSS variables — no Tailwind, no styled-components, no UI library
- JavaScript with JSDoc — no TypeScript

## Smoke test (Week-3 demo definition of done)

A run is successful if:

1. `npm install && npm run dev` opens a working page at `http://localhost:5173`
2. WorldMap shows Zone 1 unlocked and Zones 2–4 + Final locked
3. Each zone is playable end-to-end and unlocks the next on completion
4. Wrong answers anywhere open a `FeedbackModal` that cannot be dismissed without clicking **I understand**
5. After all four zones complete, Final Inspection is reachable and the ISO Incident Report renders with five score rows, clause references, replay buttons where score < 200, and any cascading notes
6. No console errors, no key warnings, no 404s on routes
7. A full playthrough takes 10–15 minutes

## Directory layout

```
src/
  main.jsx                       Router + provider mount
  App.jsx                        Routes + page transitions
  context/GameContext.jsx        useReducer state, exposes useGame()
  data/                          ISO definitions + per-zone scenarios
  pages/                         One page per route
  components/shared/             FeedbackModal, ISOTooltip, ZoneLayout, …
  components/zone1/ … zone4/     Zone-specific subcomponents
  components/final/              Score rows + ISO Incident Report
  hooks/                         useGame, useTimer, useMotion, useCountUp …
  styles/                        tokens.css (CSS variables), global.css
```

## Pedagogical guarantees

These are the lines the codebase will not cross — see `CLAUDE.md` for the full list.

- Every wrong answer opens `<FeedbackModal>` with the verbatim ISO clause text and reference.
- `<FeedbackModal>` cannot be dismissed without clicking **I understand** (no ×, no backdrop, no ESC).
- Every wrong answer is recorded in `state.wrongAnswers` with full context for the Final Inspection report.
- Multi-select / multi-tag UX is first-class — the standard is full of "this can apply at several levels" / "may also be" cases, and the UI reflects that.
- ISO terminology is exact. **"Test Item / Test Object"** is always shown with both terms.

## Accessibility

- Every animation respects `prefers-reduced-motion: reduce`.
- Modals trap keyboard focus and return focus to the opener on close.
- Buttons, pills, and matrix cells are keyboard-reachable via Tab + activated by Enter / Space.
- Aria roles (`dialog`, `progressbar`, `timer`, `gridcell`) are used where they match the semantics.

## Out of scope (intentionally)

- Risk-based testing (§4.2.2), test practices in the matrix (§4.2.4.5), Parts 2/3/4 of the standard
- Session persistence (refresh resets state — by design)
- Multiplayer, internationalisation, authentication
- Tests (Week-3 deliverable is a playable prototype, not test coverage)
