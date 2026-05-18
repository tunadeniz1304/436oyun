# ISO Testing World

ISO Testing World, ISO/IEC/IEEE 29119-1:2022 Software Testing - Part 1:
General Concepts standardini ogretmek icin hazirlanan tarayici tabanli bir
egitsel oyun prototipidir.

Oyuncu, production incident `#047` uzerinde calisan bir senior test engineer
rolundedir. Oyun, test kavramlarini bolgelere ayirir ve oyuncudan ISO
terminolojisine uygun kararlar vermesini ister.

## Current State

Repo su anda iki ana parcadan olusur:

- `iso-testing-world/`: React + Vite frontend oyunu.
- `backend/`: Node.js + Express + PostgreSQL session/progress API.

Frontend oyun akisi calisir durumdadir. Backend, oyun session bilgisini,
progress snapshotlarini, zone skorlarini ve yanlis cevaplari saklamak icin
eklenmistir. Backend calismiyorsa frontend yine acilir, ancak progress kalici
olmaz ve development console'da backend sync uyarilari gorulebilir.

## Tech Stack

Frontend:

- React 19
- Vite
- React Router
- Framer Motion
- DnD Kit
- Three.js / React Three Fiber
- Plain CSS with CSS variables

Backend:

- Node.js ESM
- Express
- PostgreSQL
- Docker Compose
- `pg`
- `node:test` + `supertest`

## Quick Start: Full Stack

Prerequisites:

- Node.js and npm
- Docker Desktop or compatible Docker runtime

Start PostgreSQL from the repo root:

```bash
docker compose up -d postgres
```

Install and prepare the backend:

```bash
cd backend
npm install
npm run migrate
npm run dev
```

In a second terminal, start the frontend:

```bash
cd iso-testing-world
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The backend listens on:

```text
http://localhost:3001
```

## Frontend Only

For a quick UI run without persistence:

```bash
cd iso-testing-world
npm install
npm run dev
```

The game can still be played, but refresh/session recovery depends on the
backend being available.

## Backend Setup

The backend reads these defaults from `backend/.env.example`:

```env
PORT=3001
DATABASE_URL=postgres://iso_user:iso_password@localhost:5432/iso_testing_world
CORS_ORIGIN=http://localhost:5173
```

Useful commands:

```bash
cd backend
npm run migrate
npm run dev
npm test
```

## Game Structure

The player progresses through four concept zones and a final inspection:

| Zone | Route | Concept focus |
| --- | --- | --- |
| Error District | `/zone/error-district` | Error, fault/defect, failure, incident |
| V&V Headquarters | `/zone/vv-headquarters` | Verification, validation, test oracle |
| Test Matrix Tower | `/zone/matrix-tower` | Test levels and test types |
| Artefact Archive | `/zone/artefact-archive` | Test basis, test item/object, static and dynamic testing |
| Final Inspection | `/final-inspection` | Integrated report and test oracle reasoning |

The world map at `/` controls unlock state. Zone 1 is available first. Later
zones unlock after the previous zone is completed.

## Pedagogical Rules

- Wrong answers open an ISO feedback modal.
- Feedback should include the ISO concept and clause reference.
- Feedback modals require explicit acknowledgement.
- Wrong answers are recorded for the final inspection report.
- Multi-select and multi-tag interactions are intentional because several ISO
  concepts can apply across multiple contexts.
- "Test Item / Test Object" should be shown with both terms.
- Zone 3 is currently being redesigned toward a stronger "test strategy matrix
  defense" model. See `docs/superpowers/specs/2026-05-04-zone3-test-strategy-matrix-design.md`.

## API Summary

Backend session endpoints:

- `POST /api/sessions`
- `GET /api/sessions/current`
- `GET /api/sessions/:sessionId`
- `PATCH /api/sessions/:sessionId/progress`
- `POST /api/sessions/:sessionId/wrong-answers`
- `POST /api/sessions/:sessionId/complete-zone`
- `GET /api/sessions/:sessionId/report`
- `GET /health`

The frontend API client lives at:

```text
iso-testing-world/src/services/gameSessionApi.js
```

By default it calls `http://localhost:3001`. Override with:

```env
VITE_API_BASE_URL=http://localhost:3001
```

## Project Layout

```text
.
|-- backend/
|   |-- src/
|   |   |-- app.js
|   |   |-- server.js
|   |   |-- db/
|   |   |-- repositories/
|   |   |-- routes/
|   |   `-- services/
|   |-- tests/
|   |-- .env.example
|   `-- README.md
|-- docs/
|   |-- ISO-29119-1-2022.pdf
|   |-- DESIGN_CRITIQUE.md
|   `-- superpowers/
|-- iso-testing-world/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- data/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- styles/
|   |-- package.json
|   `-- README.md
|-- docker-compose.yml
|-- backend.md
|-- CLAUDE.md
`-- README.md
```

## Verification

Frontend:

```bash
cd iso-testing-world
npm run build
npm run lint
npm test
```

Backend:

```bash
cd backend
npm test
npm run migrate
```

Full manual smoke test:

1. Start PostgreSQL and backend.
2. Start frontend.
3. Open `http://localhost:5173`.
4. Play from World Map through the zones.
5. Confirm wrong answers create feedback and are stored.
6. Confirm Final Inspection renders score rows and cascading notes.

## Important Docs

- `CLAUDE.md`: project rules, architecture, zone specs, and constraints.
- `backend.md`: backend roadmap and current API direction.
- `iso-testing-world/README.md`: frontend-specific overview.
- `backend/README.md`: backend-specific setup.
- `docs/DESIGN_CRITIQUE.md`: HCI/design review notes.
- `docs/superpowers/specs/2026-05-04-zone3-test-strategy-matrix-design.md`: proposed Zone 3 redesign.

## Out Of Scope For Current Prototype

- Authentication and user accounts
- Admin panel
- Multiplayer
- Leaderboard
- Full analytics dashboard
- Full ISO Parts 2, 3, and 4 gameplay
- Internationalisation

These can be considered after the core educational flow and session persistence
are stable.
