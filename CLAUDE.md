# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file is the single source of truth for the AI assistant working on this
project. **Read it end-to-end before writing any code.** When in doubt, this
file overrides chat history.

---

## Commands

The app lives in `iso-testing-world/`. All commands run from that directory.

```bash
cd iso-testing-world
npm install          # first-time setup (React 18 + Vite + react-router-dom + @dnd-kit + framer-motion)
npm run dev          # dev server → http://localhost:5173
npm run build        # production build (use to verify no compile errors)
npm run lint         # ESLint check
npm run preview      # preview production build locally
```

There are no tests — Week 3 deliverable is a playable prototype, not test coverage (§14).

---

## 0 · TL;DR for first-time setup

```bash
npm create vite@latest iso-testing-world -- --template react
cd iso-testing-world
npm install
npm install react-router-dom @dnd-kit/core @dnd-kit/sortable framer-motion \
            three @react-three/fiber @react-three/drei
npm run dev   # opens http://localhost:5173
```

That's the entire dependency list. Don't add others without team approval.

---

## 1 · What this project is

**ISO Testing World** is a browser-based educational simulation that teaches
ISO/IEC/IEEE 29119-1:2022 (General Concepts in software testing) to software
engineering students.

Player role: senior test engineer resolving production incident `#047`. Five
zones, each targeting a specific ISO concept cluster, plus a Final Inspection
that integrates everything and adds Test Oracle (§3.115).

Every zone is designed so that informal, everyday definitions produce the wrong
answer. Correct play requires ISO-precise vocabulary. This is the project's
core pedagogical claim and must never be diluted.

**Team:** OPUS — Tuna Deniz, Goktuğ Tabak, Oğuzhan Tarhan, Buğra Kara
**Course:** IT & ISQS — Learner-as-Designer Project
**Standard:** ISO/IEC/IEEE 29119-1:2022 (Second edition)
**Deadline:** Week 3 — playable 10-minute prototype.

---

## 2 · Stack (locked — do not deviate)

- Vite + React 18
- React Router v6
- @dnd-kit/core + @dnd-kit/sortable (Zone 1 only)
- Framer Motion (entry/exit transitions, modal animations)
- `three` — core 3D engine (**WorldMap only**)
- `@react-three/fiber` — React renderer for three.js (**WorldMap only**)
- `@react-three/drei` — helpers: `OrbitControls`, `Sky`, `Float`, `Html`, `ContactShadows`, `Line` (**WorldMap only**)
- Plain CSS files with CSS variables — **no Tailwind, no styled-components, no UI lib**
- JavaScript with JSDoc — **no TypeScript**
- ESLint default config

**3D scope rule:** Three.js is permitted **only on the WorldMap**
([src/pages/WorldMap.jsx](iso-testing-world/src/pages/WorldMap.jsx)). All
buildings, terrain, and ambient props are **procedural** — built from
three.js geometry primitives in code, with no external GLTF assets. This
keeps the bundle small, removes asset-licensing concerns, and forces every
visual element to be intentional. See §14 for the zones-stay-2D rule.

---

## 3 · Architecture in one paragraph

Single-page React app. `main.jsx` mounts `<App />` inside `BrowserRouter`. `App.jsx`
wraps everything in `<GameProvider>` (from `src/context/GameContext.jsx`) and
defines six routes. Each zone page lives in `src/pages/`, loads its data from
`src/data/*.js`, renders inside `<ZoneLayout>`, and calls `useGame()` to update
global state on completion or wrong answers. `<FeedbackModal>` and
`<ISOTooltip>` are shared and used in every zone. **No backend, no database,
no auth, no localStorage** — everything is in-memory React state.

---

## 4 · File tree (target end state)

```
src/
  main.jsx                       Router + provider mount
  App.jsx                        Routes
  context/
    GameContext.jsx              useReducer state, exposes useGame()
  data/
    iso-definitions.js           clause → { term, definition, note, source }
    zone1-scenarios.js
    zone2-missions.js
    zone3-scenarios.js
    zone4-artefacts.js
    final-scenarios.js
  pages/
    WorldMap.jsx
    ErrorDistrict.jsx            (Zone 1)
    VVHeadquarters.jsx           (Zone 2)
    TestMatrixTower.jsx          (Zone 3)
    ArtefactArchive.jsx          (Zone 4)
    FinalInspection.jsx
  components/
    shared/
      FeedbackModal.jsx
      ISOTooltip.jsx
      ZoneLayout.jsx
      ScoreBadge.jsx
      Button.jsx
      Pill.jsx
      LockedCard.jsx
    zone1/  …                    (zone-specific subcomponents go here)
    zone2/  …
    zone3/  …
    zone4/  …
    final/  …
  hooks/
    useGame.js
    useTimer.js                  (Zone 2)
  styles/
    tokens.css                   CSS variables — colours, spacing, fonts
    global.css
public/
  fonts/                         (optional — Caveat & Patrick Hand if used)
```

---

## 5 · Routing

| Path                          | Component         | Guard                              |
|-------------------------------|-------------------|------------------------------------|
| `/`                           | `WorldMap`        | always                             |
| `/zone/error-district`        | `ErrorDistrict`   | always (Zone 1 unlocked at start)  |
| `/zone/vv-headquarters`       | `VVHeadquarters`  | Zone 1 in `completedZones`         |
| `/zone/matrix-tower`          | `TestMatrixTower` | Zone 2 in `completedZones`         |
| `/zone/artefact-archive`      | `ArtefactArchive` | Zone 3 in `completedZones`         |
| `/final-inspection`           | `FinalInspection` | All four zones in `completedZones` |
| `*`                           | redirect to `/`   |                                    |

If a guard fails, redirect to `/` (don't render an error page — the locked
state on the WorldMap is the explanation).

---

## 6 · Game state (`GameContext.jsx`)

```js
// State shape
{
  completedZones: Set,           // Set of zoneIds that are finished
  zoneScores: {
    'error-district':    0,
    'vv-headquarters':   0,
    'matrix-tower':      0,
    'artefact-archive':  0,
    'final-inspection':  0,
  },
  totalScore: 0,
  wrongAnswers: [],              // see schema below
  sessionStarted: false,
}

// wrongAnswers entry shape
{ zoneId, itemId, playerAnswer, correctAnswer, isoRef, timestamp }

// Actions (dispatch shapes)
START_SESSION
COMPLETE_ZONE   { zoneId, score }
RECORD_WRONG    { zoneId, itemId, playerAnswer, correctAnswer, isoRef }
RESET

// Hook
const { state, completeZone, recordWrong, isZoneUnlocked, resetGame } = useGame();

// Unlock chain
const ZONE_ORDER = [
  'error-district',
  'vv-headquarters',
  'matrix-tower',
  'artefact-archive',
  'final-inspection',
];
// Zone N unlocks when Zone N-1 is in completedZones. Zone 1 always unlocked.
```

Persistence: **none.** Refresh resets state. Intentional.

---

## 7 · Zone specifications

### 7.1 Zone 1 — Error District

**Concepts:** Error (§3.39), Fault/Defect, Failure, Incident (§3.39),
Incident Report (§3.40), Defect & Incident Management (§4.7)

**Misconception:** "bug," "defect," and "crash" name the same event.
**ISO reality:** Three causally ordered stages: Error (human act) → Fault/Defect
(code flaw) → Failure (observable deviation). They are not synonyms.

**Mechanic:** Drag-and-drop. Five incident cards (LOG / DEV / USER tags) sorted
into three columns: ERROR · FAULT/DEFECT · FAILURE. Wrong drop opens
`FeedbackModal`. On full completion, animate the causal chain
"Error → Fault → Failure" across the screen.

**Mistake-revealed condition:** Dropping every card into a single column.

### 7.2 Zone 2 — V&V Headquarters

**Concepts:** Verification (§4.1.3), Validation (§4.1.3), Test Oracle (§3.115)

**Misconception:** "Verification = developers; Validation = users."
**ISO reality:** Either party can do either. The distinction is the question
being asked: Verification = "did we build it to the spec?", Validation =
"did we build the right thing?"

**Mechanic:** 8 mission cards, one at a time. **30-second timer per mission**
(extended from 15s for genuine reasoning). Three routing buttons:
`VERIFICATION` · `VALIDATION` · `BOTH`. "Both" requires a written
justification (≥ 3 words; reject single-word answers). One mission per session
also surfaces the **Oracle prompt** (§3.115): "What determines pass/fail?" —
this is why §3.115 is covered in Zone 2 as well as in Final.

**Mistake-revealed condition:** Routing by role triggers the prompt
*"Are you checking conformance to a specification, or fitness for intended
use?"*

### 7.3 Zone 3 — Test Matrix Tower

**Concepts:** Test Level (§3.108, §4.2.4.2), Test Type (§3.130, §4.2.4.3),
orthogonality

**Misconception:** Test type is fixed by level (e.g. "unit testing = structural
only").
**ISO reality:** Test Level (when in lifecycle) and Test Type (which quality
characteristic) are independent axes. §3.130 Note 1 states: *"A test type can
be performed at a single test level or across several test levels."*

**Mechanic:** 4×4 grid. Rows = Test Levels (Unit / Integration / System /
Acceptance). Columns = Test Types (Functional / Security / Performance /
Usability). Multi-select. Submit requires ≥ 1 cell. Each selected cell needs
a one-line justification.

**Mistake-revealed condition:** Selecting a single cell opens a challenge
modal: *"Why only one? §3.130 Note 1 says a test type can be performed across
several test levels."* — player can go back or add more cells.

**Out of scope:** Test Practices (§4.2.4.5) are a third axis in the standard
but Part 2 normative content. Zone 3 includes a one-line scope note. **Do not
add a third axis.**

### 7.4 Zone 4 — Artefact Archive

**Concepts:** Test Basis (§3.84), Test Item / Test Object (§3.107), Static
Testing (§3.78), Dynamic Testing (§3.29), §4.1.5

**Misconceptions:**
- "Static analysis is a code-quality tool, not a testing activity."
- "Test basis must be a formal document."

**ISO reality:** §3.78 explicitly classifies static testing as testing.
§3.84 Note 1: *"The test basis may also be an undocumented understanding of
the required behaviour."*

**Mechanic:** Six file artefacts in a file-explorer panel. For each selected
file, the right panel shows four multi-select tag pills:
- `Test Basis` (§3.84)
- `Test Item / Test Object` (§3.107) — **always both terms in the UI label**
- `Static Testing` (§3.78)
- `Dynamic Testing` (§3.29)

**Trap artefact:** `verbal_agreement.txt` — must be tagged `Test Basis`.
Leaving it untagged opens the §3.84 Note 1 callout. **This is the most
important teaching moment in the entire game** — treat it carefully.

### 7.5 Final Inspection

**Concepts:** All Part 1 + Test Oracle (§3.115, §4.1.10)

Auto-generated **ISO Incident Report** with five score rows
(Error/Fault/Failure · V&V · Levels×Types · Artefacts · Test Oracle), each
with: bar, exact score, status badge (CORRECT / PARTIAL / REVIEW / `N` errors),
violated clause link, and a Replay button if score < 200.

A **cascading note** in the total-score panel references how an earlier zone
mistake affected behaviour in the Final (e.g. *"Your Zone 3 partial answer
affected oracle confidence in Final step 4"*). This is the personalised
reflection promised in the proposal.

Total: 1000 points (200 × 5 concept areas).

---

## 8 · ISO definitions (`src/data/iso-definitions.js`)

```js
export const isoDefinitions = {
  '§3.84': {
    term: 'test basis',
    definition: 'information used as the basis for designing and implementing test cases',
    note: 'The test basis may also be an undocumented understanding of the required behaviour.',
    source: 'ISO/IEC/IEEE 29119-1:2022',
  },
  // … one entry for every clause referenced in any data file
};
```

**Rule:** every `isoRef` value used anywhere in `src/data/` must have a
matching entry here. Never inline an ISO definition in JSX — pull from this
file via `<ISOTooltip>` or `<FeedbackModal>` props.

---

## 9 · Data file schemas

### `zone1-scenarios.js`
```js
{
  id: 'z1-s1',
  tag: 'DEV',                    // 'LOG' | 'DEV' | 'USER'
  text: 'I removed the null-check during the refactor — looked redundant.',
  correctColumn: 'error',        // 'error' | 'fault' | 'failure'
  isoRef: '§4.7',
  feedbackWrong: 'This is a human action — the developer\'s decision. Error, not failure.',
}
```

### `zone2-missions.js`
```js
{
  id: 'z2-m1',
  text: 'Confirm that the new payment-gateway integration conforms to the PCI-DSS specification document.',
  correctRouting: 'verification', // 'verification' | 'validation' | 'both'
  isoRef: '§4.1.3',
  feedbackWrong: 'You are checking conformance to a written specification — that is verification, not validation.',
  oraclePromptHere: false,       // exactly ONE mission per session has true
}
```

### `zone3-scenarios.js`
```js
{
  id: 'z3-s1',
  text: 'Test that the login bypass vulnerability via header injection is blocked — at every level it can be observed.',
  correctCells: [
    { level: 'unit',        type: 'security' },
    { level: 'integration', type: 'security' },
    { level: 'system',      type: 'security' },
  ],
  isoRef: '§3.130 Note 1',
  feedbackPartial: 'You picked some valid cells but missed others. §3.130 Note 1: a type can apply at multiple levels.',
}
```

### `zone4-artefacts.js`
```js
{
  id: 'z4-a1',
  icon: 'doc',                   // 'doc' | 'code' | 'chat' | 'chart'
  name: 'requirements_v2.docx',
  description: 'Formal payment-module specification.',
  correctTags: ['basis', 'static'],   // subset of: 'basis' | 'testitem' | 'static' | 'dynamic'
  trap: false,
  trapExplanation: null,
  isoRef: '§3.84',
}
// `verbal_agreement.txt` is the only entry with trap: true and a non-null trapExplanation.
```

---

## 10 · Component contracts

### `<FeedbackModal>`
```jsx
<FeedbackModal
  isOpen={boolean}
  onClose={() => void}
  isoRef="§3.84"
  term="test basis"
  definition="information used as..."
  note="may also be undocumented..."           // optional
  playerAnswer="what the player chose"
  explanation="one sentence why it was wrong"
/>
```
**Cannot be dismissed without clicking "I understand."** No × button.
No backdrop click. No ESC handler. This is a hard rule.

### `<ISOTooltip>`
```jsx
<ISOTooltip clauseRef="§3.130">Test Type</ISOTooltip>
```
Renders children with a small clause badge. On hover/tap shows the full
definition from `isoDefinitions[clauseRef]`.

### `<ZoneLayout>`
```jsx
<ZoneLayout
  zoneId="error-district"
  zoneName="Error District"
  zoneColor="var(--zone1-color)"
  scoreLabel="40 / 200"
>
  {/* zone content */}
</ZoneLayout>
```
Provides the colored header bar, score badge, back-to-map link.

### `<TagSelector>` (Zone 4)
```jsx
<TagSelector
  tags={['basis', 'testitem', 'static', 'dynamic']}
  selectedTags={string[]}
  onChange={(newTags) => void}
/>
```
Multi-select pills. Each pill wrapped in `<ISOTooltip>`. Labels:
- `basis` → "Test Basis"
- `testitem` → "Test Item / Test Object" ← **always both terms**
- `static` → "Static Testing"
- `dynamic` → "Dynamic Testing"

---

## 11 · CSS tokens (`src/styles/tokens.css`)

```css
:root {
  /* Zone accent colors */
  --zone1-color: #993C1D;   /* coral  — Error District */
  --zone2-color: #0C447C;   /* blue   — V&V HQ */
  --zone3-color: #3B6D11;   /* green  — Matrix Tower */
  --zone4-color: #854F0B;   /* amber  — Artefact Archive */
  --final-color: #3C3489;   /* purple — Final Inspection */

  /* Tints (lighter background variants) */
  --zone1-bg: #FAECE7;
  --zone2-bg: #E6F1FB;
  --zone3-bg: #EAF3DE;
  --zone4-bg: #FAEEDA;
  --final-bg: #EEEDFE;

  /* Neutral */
  --ink: #1a1a1a;
  --ink-soft: #555;
  --muted: #888;
  --paper: #fefcf7;
  --line: #ddd;
}
```

**Never hardcode a colour in JSX or component CSS — always reference a token.**

---

## 12 · Build sequence (recommended order for one-shot scaffold)

Build in this order. After each step, `npm run dev` should still serve a
working page even if the next step isn't done yet.

1. **Scaffold + deps** — Vite scaffold, install dependencies, set up folder tree, add `tokens.css` and `global.css`, blank `App.jsx` rendering "Hello".
2. **Routing skeleton** — six routes pointing at six placeholder pages each containing only `<h1>Page name</h1>`.
3. **`GameContext` + `useGame` hook** — full reducer with all actions. Wire `<GameProvider>` in `main.jsx`.
4. **`iso-definitions.js`** — populate every clause referenced anywhere in zone specs above (~14 entries minimum).
5. **Shared components** — `FeedbackModal`, `ISOTooltip`, `ZoneLayout`, `Button`, `Pill`, `ScoreBadge`, `LockedCard`. Each with its own CSS file.
6. **WorldMap** — five zone cards with locked/unlocked states, progress tracker, unlock arrows. Reads `state.completedZones`.
7. **Zone 1 Error District** — drag-and-drop with @dnd-kit, 5 scenarios, FeedbackModal on wrong drop, causal-chain animation on completion.
8. **Zone 2 V&V Headquarters** — 8 missions, 30-second `useTimer` hook, three routing buttons, justification field, Oracle prompt on one mission.
9. **Zone 3 Test Matrix Tower** — 4×4 grid, multi-select, single-cell challenge modal, per-cell justification, scope note.
10. **Zone 4 Artefact Archive** — file explorer (left), tag selector (right), trap artefact handling, §3.84 Note 1 callout.
11. **Final Inspection** — five score rows, status badges, replay buttons, cascading note, total score panel.
12. **Polish pass** — Framer Motion route transitions, focus management on modal, accessible button labels, `prefers-reduced-motion` honoured. `README.md` smoke test (npm install → npm run dev → all five zones playable).

**Stop and ask the team only if:** a design ambiguity in this file cannot be
resolved by reading `OPUS_Concept_Analysis_1.pdf` or `ProjectBrief_2_1_1.pdf`.
Otherwise default to the simplest implementation that meets every
pedagogical principle in §13.

---

## 13 · Pedagogical principles (non-negotiable)

1. Every wrong answer in any zone opens `<FeedbackModal>` with the **verbatim**
   ISO definition and clause reference.
2. `<FeedbackModal>` cannot be dismissed without clicking "I understand."
3. Every wrong answer is recorded in `state.wrongAnswers` with full context.
4. The Final Report shows **cascading effects**: an earlier mistake in one
   zone is referenced in the Final's commentary.
5. Multi-select / multi-tag UX is first-class, not an edge case. The standard
   is full of "this can apply at several levels" / "may also be" — the UI
   must reflect that.
6. ISO terminology is exact. "Test Item / Test Object" never just "Test Object."
7. The game **does not reward speed for its own sake**. Timers exist only in
   Zone 2 to force a routing decision under realistic pressure (30s).

---

## 14 · Out of scope — do not add

- **Risk-based testing (§4.2.2, §3.69)** — Part 2 normative content.
- **Test Practices (§4.2.4.5)** — boundary note exists in Zone 3, intentionally
  not in the matrix.
- **Full test process model (§4.3.1–4.3.7)** — Part 2 normative content.
- **Session persistence** — state is in-memory only.
- **Multiplayer** — single-player only.
- **Parts 2, 3, 4 of ISO 29119** — game covers Part 1 only.
- **Internationalisation** — English only for the prototype.
- **Authentication / accounts.**
- **Backend API.** No `/api` folder. No `fetch`. No mock server.
- **Tests** — Week 3 deliverable is a playable prototype, not test coverage.
  Add tests in a future iteration.
- **TypeScript** — JSDoc only.
- **Tailwind / UI library** — plain CSS files only.
- **localStorage / sessionStorage / IndexedDB.**
- **3D inside zones** — Three.js is permitted **only** on the WorldMap.
  Zones 1–4 and Final Inspection stay DOM-based. Pedagogical mechanics
  (drag-drop, multi-select, tagging, justification fields) need accessible
  HTML, not WebGL. See §13.5 (multi-select is first-class).
- **External GLTF / FBX / OBJ models** — the WorldMap is procedural. No
  `public/models/` folder, no `useGLTF()` calls, no asset downloads. Every
  building, prop, and decoration is built from three.js geometry primitives
  (`boxGeometry`, `cylinderGeometry`, `sphereGeometry`, etc.) in code.

If the user (team member) explicitly wants any of the above, that is a
Week 4+ decision and must be flagged before implementation.

---

## 15 · Things you must never do

- **Never add a close button (× / ESC / backdrop) to `<FeedbackModal>`** —
  the player must read the ISO definition.
- **Never use "Test Object" alone** — always "Test Item / Test Object" (§3.107).
- **Never inline an ISO definition in JSX** — always source from
  `iso-definitions.js`.
- **Never change `ZONE_ORDER`** without updating both `GameContext.jsx` and
  `WorldMap.jsx` card order.
- **Never add Part 2 content** to any zone without explicit team confirmation.
- **Never skip adding a clause to `iso-definitions.js`** when introducing a
  new `isoRef` in any data file — the build must trace every reference back
  to a definition.
- **Never hardcode colours in JSX or CSS.** Use tokens from `tokens.css`.
- **Never reach for a backend or browser-storage API.** State lives in
  React reducer memory only.
- **Never call `useGLTF()` or load external 3D models.** The WorldMap is
  procedural — every shape comes from three.js geometry primitives. No
  `public/models/` folder. If you find a `useGLTF` import, delete it.
- **Never put a `<Canvas>` outside the WorldMap.** Zones are DOM-only (§14).

---

## 16 · @dnd-kit recipe (Zone 1 only)

```jsx
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

function IncidentCard({ id, text, tag }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <span className="tag">{tag}</span> {text}
    </div>
  );
}

function DropColumn({ id, label, children }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`column ${isOver ? 'over' : ''}`}>
      <h3>{label}</h3>
      {children}
    </div>
  );
}

function ClassifyBoard({ scenarios, onComplete }) {
  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const item = scenarios.find(s => s.id === active.id);
    const correct = item.correctColumn === over.id;
    // dispatch RECORD_WRONG if not correct, etc.
  };
  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* render cards + columns */}
    </DndContext>
  );
}
```

---

## 17 · Quick reference — ISO clause → game location

| Clause      | Term                            | Zone(s)                      |
|-------------|----------------------------------|------------------------------|
| §3.29       | dynamic testing                  | Zone 4 tag                   |
| §3.39       | incident                         | Zone 1 scenario context      |
| §3.40       | incident report                  | Zone 1, Final Report         |
| §3.78       | static testing                   | Zone 4 tag                   |
| §3.84       | test basis                       | Zone 4 tag + trap artefact   |
| §3.107      | test item / test object          | Zone 4 tag                   |
| §3.108      | test level                       | Zone 3 matrix rows           |
| §3.115      | test oracle                      | Zone 2 (Oracle prompt) + Final |
| §3.130      | test type                        | Zone 3 matrix columns        |
| §4.1.3      | verification and validation      | Zone 2 routing               |
| §4.1.5      | static and dynamic testing       | Zone 4                       |
| §4.1.10     | test oracle (elaboration)        | Final Inspection             |
| §4.2.4.2    | test levels detail               | Zone 3                       |
| §4.2.4.3    | test types detail                | Zone 3                       |
| §4.2.4.5    | test practices (scope note only) | Zone 3 footer                |
| §4.7        | defect & incident management     | Zone 1 causal chain          |

---

## 18 · Definition of done (Week 3 demo)

A demo run is successful if **all** of the following are true:

- `npm install && npm run dev` opens a working page at `http://localhost:5173`.
- WorldMap shows Zone 1 unlocked and Zones 2–4 + Final locked.
- Each zone is playable end-to-end and updates `completedZones` on completion.
- Wrong answers in any zone open a `FeedbackModal` that cannot be dismissed
  without clicking "I understand."
- After all four zones are complete, Final Inspection is reachable and the
  ISO Incident Report renders with five score rows, clause references, and
  a cascading-note line.
- No console errors. No "key" warnings. No 404s on routes.
- A full playthrough takes 10–15 minutes.

---

*CLAUDE.md — ISO Testing World — OPUS Team — keep updated when scope,
architecture, or data schemas change.*
