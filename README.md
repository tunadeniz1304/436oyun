<div align="center">

  <img src="frontend/public/iso-logo2.png" alt="ISO Testing World logo" width="380" height="auto" />
  <h1>ISO Testing World</h1>

  <p>
    Browser-based educational simulation that teaches ISO/IEC/IEEE 29119-1:2022 — Part 1: General Concepts.
  </p>

<!-- Badges -->
<p>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Node.js-ESM-339933?logo=node.js&logoColor=white" alt="Node.js ESM" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/Standard-ISO%2FIEC%2FIEEE%2029119--1%3A2022-0C447C" alt="ISO/IEC/IEEE 29119-1:2022" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
</p>

<h4>
  <a href="https://opus-isotestingworld.vercel.app/">View Demo</a>
  <span> · </span>
  <a href="CLAUDE.md">Documentation</a>
</h4>

</div>

<br />

<!-- Table of Contents -->
# :notebook_with_decorative_cover: Table of Contents

- [About the Project](#star2-about-the-project)
  * [Screenshots](#camera-screenshots)
  * [Tech Stack](#space_invader-tech-stack)
  * [Features](#dart-features)
  * [Color Reference](#art-color-reference)
  * [Environment Variables](#key-environment-variables)
- [Getting Started](#toolbox-getting-started)
  * [Prerequisites](#bangbang-prerequisites)
  * [Installation](#gear-installation)
  * [Running Tests](#test_tube-running-tests)
  * [Run Locally](#running-run-locally)
  * [Deployment](#triangular_flag_on_post-deployment)
- [Usage](#eyes-usage)
- [Roadmap](#compass-roadmap)
- [Contributing](#wave-contributing)
- [FAQ](#grey_question-faq)
- [License](#warning-license)
- [Contact](#handshake-contact)
- [Acknowledgements](#gem-acknowledgements)


<!-- About the Project -->
## :star2: About the Project

ISO Testing World is a browser-based educational game built for the IT & ISQS Learner-as-Designer course. Players take the role of a senior test engineer resolving production incident `#047` across five zones, each targeting a different ISO/IEC/IEEE 29119-1:2022 concept cluster. Every zone is designed so that informal, everyday definitions produce the wrong answer — correct play requires ISO-precise vocabulary. The game includes an office-interior simulation layer with NPC-driven briefings, pixel-art characters, and retro desktop mini-tools that contextualise the incidents before each zone.

**Team:** OPUS — Tuna Deniz, Göktuğ Tabak, Oğuzhan Tarhan, Buğra Kara
**Course:** IT & ISQS — Learner-as-Designer Project
**Standard:** ISO/IEC/IEEE 29119-1:2022 (Second edition)


<!-- Screenshots -->
### :camera: Screenshots

<div align="center">

  <img src="frontend/public/screenshots/landing_renkli.png" alt="WorldMap — Corporate Test Campus (all zones complete)" width="700" />
  <p><em>WorldMap — Corporate Test Campus showing all four zones complete and Final Inspection unlocked.</em></p>

  <img src="frontend/public/screenshots/zone1.png" alt="Zone 1 — Error District drag-and-drop board" width="700" />
  <p><em>Zone 1 — Error District: drag incident cards into the Error, Fault/Defect, or Failure column.</em></p>

  <img src="frontend/public/screenshots/zone4.png" alt="Zone 4 — Artefact Archive tag selector" width="700" />
  <p><em>Zone 4 — Artefact Archive: multi-select ISO role tags (Test Basis, Test Item / Test Object, Static Testing, Dynamic Testing) per artefact.</em></p>

  <img src="frontend/public/screenshots/ofis1.png" alt="Office Interior — Error District HQ War Room" width="700" />
  <p><em>Office Interior — Error District HQ War Room: NPC pixel characters deliver zone briefings before gameplay begins.</em></p>

  <img src="frontend/public/screenshots/vscode.png" alt="Retro VSCode desktop tool inside the office" width="700" />
  <p><em>Retro VSCode — in-world source file view that surfaces test artefacts as contextual evidence.</em></p>

</div>


<!-- TechStack -->
### :space_invader: Tech Stack

<details>
  <summary>Client</summary>
  <ul>
    <li><a href="https://react.dev/">React 19</a></li>
    <li><a href="https://vitejs.dev/">Vite 8</a></li>
    <li><a href="https://reactrouter.com/">React Router v7</a></li>
    <li><a href="https://dndkit.com/">@dnd-kit/core + @dnd-kit/sortable</a> (Zone 1 drag-and-drop)</li>
    <li><a href="https://www.framer.com/motion/">Framer Motion</a> (route transitions, modal animations)</li>
    <li><a href="https://threejs.org/">Three.js</a> + <a href="https://docs.pmnd.rs/react-three-fiber">@react-three/fiber</a> + <a href="https://drei.pmnd.rs/">@react-three/drei</a> (WorldMap only — procedural geometry, no external 3D assets)</li>
    <li>Plain CSS files with CSS variables — no Tailwind, no UI library</li>
    <li>JavaScript with JSDoc — no TypeScript</li>
  </ul>
</details>

<details>
  <summary>Server</summary>
  <ul>
    <li>Node.js ESM</li>
    <li><a href="https://expressjs.com/">Express</a></li>
    <li><a href="https://node-postgres.com/">pg</a> (PostgreSQL driver)</li>
    <li>node:test + <a href="https://github.com/ladjs/supertest">supertest</a> (backend integration tests)</li>
  </ul>
</details>

<details>
  <summary>Database / Infra</summary>
  <ul>
    <li><a href="https://www.postgresql.org/">PostgreSQL 16</a></li>
    <li><a href="https://docs.docker.com/compose/">Docker Compose</a></li>
  </ul>
</details>


<!-- Features -->
### :dart: Features

- **Five concept zones + Final Inspection** — each zone targets a specific ISO/IEC/IEEE 29119-1:2022 concept cluster (Error/Fault/Failure, V&V, Test Levels × Types, Test Basis/Item, Test Oracle) and is designed so informal definitions produce the wrong answer.
- **Unskippable ISO feedback modal** — every wrong answer opens a modal with the verbatim ISO clause definition and reference; it cannot be dismissed without clicking "I understand."
- **Multi-select and multi-tag UX** — multi-select is first-class throughout, reflecting the standard's "this can apply at several levels / may also be" language.
- **Office-interior simulation layer** — NPC-driven pixel-art office rooms (War Room, Vault B, Audit Chamber) with task HUD, manager briefings, and NPC dialogue that wrap and contextualise each zone.
- **Retro desktop mini-tools** — in-office windows: Visual Studio Code (source artefacts), BugSweeper, Internet Explorer (ISO Research Portal), Pipeline Ops (matrix game), and Snake; all rendered as OS-era windows on a retro desktop.
- **Session and progress persistence** — Node.js + Express + PostgreSQL backend stores sessions, zone scores, and wrong answers; frontend degrades gracefully when the backend is unavailable.
- **Procedural 3D WorldMap** — Three.js WorldMap built entirely from geometry primitives; no external GLTF or asset files.
- **Accessible interactions** — full keyboard navigation, focus trapping in modals, `prefers-reduced-motion` respected throughout, ARIA roles on all interactive regions.


<!-- Color Reference -->
### :art: Color Reference

| Zone | Color | Hex |
| --- | --- | --- |
| Error District (Zone 1) | ![#993C1D](https://img.shields.io/badge/-993C1D-993C1D) | `#993C1D` |
| V&V Headquarters (Zone 2) | ![#0C447C](https://img.shields.io/badge/-0C447C-0C447C) | `#0C447C` |
| Test Matrix Tower (Zone 3) | ![#3B6D11](https://img.shields.io/badge/-3B6D11-3B6D11) | `#3B6D11` |
| Artefact Archive (Zone 4) | ![#854F0B](https://img.shields.io/badge/-854F0B-854F0B) | `#854F0B` |
| Final Inspection | ![#3C3489](https://img.shields.io/badge/-3C3489-3C3489) | `#3C3489` |


<!-- Env Variables -->
### :key: Environment Variables

The backend reads from `backend/.env` (copy from `backend/.env.example`):

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | Backend HTTP port |
| `DATABASE_URL` | `postgres://iso_user:iso_password@localhost:5432/iso_testing_world` | PostgreSQL connection string |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

The frontend can override the API base URL:

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:3001` | Backend base URL used by `frontend/src/services/gameSessionApi.js` |


<!-- Getting Started -->
## :toolbox: Getting Started

<!-- Prerequisites -->
### :bangbang: Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for the PostgreSQL container)

The frontend runs without Docker if you skip the backend. See the [Frontend only](#frontend-only) section under Run Locally.


<!-- Installation -->
### :gear: Installation

Clone the repository:

```bash
git clone https://github.com/<your-org>/436oyun.git
cd 436oyun
```

The project has two separate `package.json` files — one in `frontend/` and one in `backend/`. Install each independently (see Run Locally below).


<!-- Running Tests -->
### :test_tube: Running Tests

Backend integration tests:

```bash
cd backend
npm test
```

Frontend linting (no unit-test suite in the current prototype — Week 3 deliverable is a playable prototype):

```bash
cd frontend
npm run lint
```


<!-- Run Locally -->
### :running: Run Locally

#### Full stack (frontend + backend + database)

**Step 1 — Start PostgreSQL:**

```bash
docker compose up -d postgres
```

**Step 2 — Set up and start the backend:**

```bash
cd backend
npm install
npm run migrate
npm run dev
```

The backend listens on `http://localhost:3001`.

**Step 3 — Start the frontend (new terminal):**

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

#### Frontend only

If you only want to run the game without session persistence:

```bash
cd frontend
npm install
npm run dev
```

The game is fully playable. Refresh resets all state (by design for the prototype). Development console will show backend sync warnings, which can be ignored.


<!-- Deployment -->
### :triangular_flag_on_post: Deployment

The frontend is deployed to Vercel at **[https://opus-isotestingworld.vercel.app/](https://opus-isotestingworld.vercel.app/)**.

To produce a production build locally:

```bash
cd frontend
npm run build
npm run preview
```

The backend is a standard Node.js process (`node src/server.js`) and requires PostgreSQL at the configured `DATABASE_URL`. The Vercel deployment runs the frontend only — session persistence requires a separately hosted backend.


<!-- Usage -->
## :eyes: Usage

1. Open **[https://opus-isotestingworld.vercel.app/](https://opus-isotestingworld.vercel.app/)** (or `http://localhost:5173` for a local dev run).
2. On the **WorldMap (Corporate Test Campus)**, Zone 1 — Error District HQ is unlocked. Later zones unlock sequentially as each zone is completed.
3. Before each zone, step into the **office interior** and speak with NPCs to receive your briefing. The task HUD in the top-left tracks your current objectives.
4. Complete the zone gameplay (drag-and-drop, routing decisions, matrix selection, or artefact tagging depending on the zone).
5. Every wrong answer opens the **ISO feedback modal** with the verbatim clause definition. Click "I understand" to continue.
6. After completing all four zones, enter **Final Inspection** to see the ISO Incident Report — five scored concept rows, clause references, replay buttons, and a cascading note showing how earlier wrong answers affected later decisions.

The retro desktop tools (VSCode, BugSweeper, Internet Explorer, Pipeline Ops, Snake) are available from the office computers and provide contextual artefacts and mini-games between zone runs.


<!-- Roadmap -->
## :compass: Roadmap

**Completed**
- [x] Five ISO concept zones (Error District, V&V HQ, Test Matrix Tower, Artefact Archive, Final Inspection)
- [x] ISO feedback modal with verbatim clause text — unskippable
- [x] Office interior simulation with NPC briefings and task HUD
- [x] Retro desktop mini-tools (VSCode, BugSweeper, Internet Explorer, Pipeline Ops, Snake)
- [x] Session and progress persistence (backend: Node.js + Express + PostgreSQL)
- [x] Procedural Three.js WorldMap

**Planned (post Week 3)**
- [ ] Login and player profiles
- [ ] Leaderboard
- [ ] Teacher / instructor panel
- [ ] Class-level performance analytics
- [ ] Most-missed ISO concept reporting
- [ ] ISO Parts 2, 3, and 4 gameplay
- [ ] Internationalisation (Turkish + English)
- [ ] Session replay


<!-- Contributing -->
## :wave: Contributing

ISO Testing World is a course project developed by the OPUS team. External contributions are out of scope for the current prototype period.

Team members follow the branch naming and commit style conventions in [CLAUDE.md](CLAUDE.md):

- `feature/<short-name>` / `bugfix/<short-name>` / `docs/<short-name>` / `refactor/<short-name>`
- `feat(scope): …` / `fix(scope): …` / `docs(scope): …` / `refactor(scope): …`


<!-- FAQ -->
## :grey_question: FAQ

- **Do I need the backend running to play the game?**

  No. The game runs fully at [https://opus-isotestingworld.vercel.app/](https://opus-isotestingworld.vercel.app/) without a backend. Without the backend, session progress is in-memory only — a page refresh resets all state. The console will show backend sync warnings, which can be ignored.

- **Why are there two folders — `iso-testing-world/` and `frontend/`?**

  The project migrated from `iso-testing-world/` to `frontend/` during development. The `iso-testing-world/` folder is a legacy artifact (contains only `dist/` and `node_modules/`). The active frontend codebase lives in `frontend/`.

- **Why can't I close the feedback modal by pressing Escape or clicking outside it?**

  This is intentional. The pedagogical design of ISO Testing World requires players to read the verbatim ISO clause definition before continuing. The "I understand" button is the only dismissal path — removing that constraint would undermine the game's core educational purpose (see `CLAUDE.md` §13).


<!-- License -->
## :warning: License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.


<!-- Contact -->
## :handshake: Contact

OPUS Team — Tuna Deniz, Göktuğ Tabak, Oğuzhan Tarhan, Buğra Kara

Course: IT & ISQS — Learner-as-Designer Project


<!-- Acknowledgements -->
## :gem: Acknowledgements

- [ISO/IEC/IEEE 29119-1:2022](https://www.iso.org/standard/81291.html) — Software and systems engineering — Software testing — Part 1: General concepts
- [awesome-readme-template](https://github.com/Louis3797/awesome-readme-template) — README structure and styling
- [React](https://react.dev/), [Vite](https://vitejs.dev/), [Three.js](https://threejs.org/), [Framer Motion](https://www.framer.com/motion/), [@dnd-kit](https://dndkit.com/) — core libraries
- [Shields.io](https://shields.io/) — badge generation
