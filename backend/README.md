# ISO Testing World Backend

Node.js + Express backend for storing game sessions, progress snapshots, wrong
answers, and zone completion results.

## Local Setup

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Install backend dependencies:

```bash
cd backend
npm install
```

Create the database schema:

```bash
npm run migrate
```

Run the backend:

```bash
npm run dev
```

The API listens on `http://localhost:3001` by default.

## Environment

Copy `.env.example` to `.env` if local values need to change.

```env
PORT=3001
DATABASE_URL=postgres://iso_user:iso_password@localhost:5432/iso_testing_world
CORS_ORIGIN=http://localhost:5173
```

## API MVP

- `POST /api/sessions`
- `GET /api/sessions/:sessionId`
- `PATCH /api/sessions/:sessionId/progress`
- `POST /api/sessions/:sessionId/wrong-answers`
- `POST /api/sessions/:sessionId/complete-zone`
- `GET /api/sessions/:sessionId/report`
- `GET /health`

## Verification

Run route tests:

```bash
npm test
```
