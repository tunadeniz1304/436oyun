# Backend Session Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js backend MVP that stores game sessions, progress, wrong answers, and zone completion data in PostgreSQL.

**Architecture:** Add a separate `backend/` Node.js service next to the existing `iso-testing-world/` frontend. The backend exposes a small Express API, uses `pg` for PostgreSQL access, and ships with SQL migrations plus Docker Compose for local database startup.

**Tech Stack:** Node.js ESM, Express, `pg`, PostgreSQL in Docker, `node:test`, `supertest`.

---

## File Structure

- Create `docker-compose.yml`: local PostgreSQL service.
- Create `backend/package.json`: backend scripts and dependencies.
- Create `backend/.env.example`: documented environment variables.
- Create `backend/src/app.js`: Express app and route mounting.
- Create `backend/src/server.js`: runtime server entrypoint.
- Create `backend/src/db/pool.js`: PostgreSQL pool creation.
- Create `backend/src/db/migrate.js`: migration runner.
- Create `backend/src/db/migrations/001_create_session_tables.sql`: database schema.
- Create `backend/src/repositories/sessionRepository.js`: SQL persistence functions.
- Create `backend/src/routes/sessionRoutes.js`: API routes.
- Create `backend/src/services/sessionService.js`: request validation and response shaping.
- Create `backend/tests/sessionRoutes.test.js`: endpoint tests.
- Modify `backend.md`: lock backend choice to Node.js + PostgreSQL + Docker.

## Task 1: Backend Package And Docker Baseline

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create backend package**

Use ESM and native test runner:

```json
{
  "name": "iso-testing-world-backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "node --test",
    "migrate": "node src/db/migrate.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "supertest": "^7.0.0"
  }
}
```

- [ ] **Step 2: Add environment template**

```env
PORT=3001
DATABASE_URL=postgres://iso_user:iso_password@localhost:5432/iso_testing_world
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 3: Add Docker Compose PostgreSQL**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: iso-testing-world-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: iso_user
      POSTGRES_PASSWORD: iso_password
      POSTGRES_DB: iso_testing_world
    ports:
      - "5432:5432"
    volumes:
      - iso_testing_world_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U iso_user -d iso_testing_world"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  iso_testing_world_pgdata:
```

- [ ] **Step 4: Install dependencies**

Run: `npm install` from `backend/`.

Expected: `backend/package-lock.json` is created.

- [ ] **Step 5: Commit baseline**

```bash
git add docker-compose.yml backend/package.json backend/package-lock.json backend/.env.example backend.md docs/superpowers/plans/2026-05-04-backend-session-progress.md
git commit -m "docs: plan backend session progress"
```

## Task 2: Database Migration

**Files:**
- Create: `backend/src/db/migrations/001_create_session_tables.sql`
- Create: `backend/src/db/pool.js`
- Create: `backend/src/db/migrate.js`

- [ ] **Step 1: Add schema migration**

Create tables:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  total_score integer NOT NULL DEFAULT 0 CHECK (total_score >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS session_progress (
  session_id uuid PRIMARY KEY REFERENCES game_sessions(id) ON DELETE CASCADE,
  completed_zones jsonb NOT NULL DEFAULT '[]'::jsonb,
  zone_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  primers_seen jsonb NOT NULL DEFAULT '[]'::jsonb,
  hints_used jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wrong_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  zone_id text NOT NULL,
  item_id text NOT NULL,
  player_answer text NOT NULL,
  correct_answer text NOT NULL,
  iso_ref text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zone_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  zone_id text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 200),
  wrong_count integer NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  hints_used_count integer NOT NULL DEFAULT 0 CHECK (hints_used_count >= 0),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, zone_id)
);
```

- [ ] **Step 2: Add pool factory**

`pool.js` exports `createPool()` and `pool`.

- [ ] **Step 3: Add migration runner**

`migrate.js` reads `src/db/migrations/*.sql` in filename order and runs them in a transaction.

- [ ] **Step 4: Verify migration script loads**

Run: `npm run migrate` from `backend/` after starting Docker.

Expected: migration completes without SQL errors.

- [ ] **Step 5: Commit migration**

```bash
git add backend/src/db docker-compose.yml
git commit -m "feat: add postgres session schema"
```

## Task 3: Session API With Tests

**Files:**
- Create: `backend/tests/sessionRoutes.test.js`
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Create: `backend/src/routes/sessionRoutes.js`
- Create: `backend/src/services/sessionService.js`
- Create: `backend/src/repositories/sessionRepository.js`

- [ ] **Step 1: Write failing API tests**

Use an in-memory fake repository injected into `createApp()` so route behavior is tested without a live database.

Test cases:

- `POST /api/sessions` returns a `sessionId`.
- `GET /api/sessions/:sessionId` returns progress.
- `PATCH /api/sessions/:sessionId/progress` saves progress.
- `POST /api/sessions/:sessionId/wrong-answers` records a wrong answer.
- `POST /api/sessions/:sessionId/complete-zone` records zone completion.
- `GET /api/sessions/:sessionId/report` returns report data.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test` from `backend/`.

Expected: tests fail because `src/app.js` does not exist.

- [ ] **Step 3: Implement app and routes**

Create `createApp({ repository })`, mount JSON middleware, CORS, health route, and session routes.

- [ ] **Step 4: Implement service validation**

Reject invalid payloads with HTTP 400. Return HTTP 404 when repository cannot find a session.

- [ ] **Step 5: Implement SQL repository**

Use parameterized queries for every database call.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `npm test` from `backend/`.

Expected: all session route tests pass.

- [ ] **Step 7: Commit API**

```bash
git add backend/src backend/tests
git commit -m "feat: add session progress api"
```

## Task 4: Documentation And Verification

**Files:**
- Modify: `backend.md`
- Modify: `backend/README.md`

- [ ] **Step 1: Document local backend commands**

Add:

```bash
docker compose up -d postgres
cd backend
npm install
npm run migrate
npm run dev
npm test
```

- [ ] **Step 2: Run verification**

Run:

```bash
cd backend
npm test
```

Run:

```bash
cd backend
npm run migrate
```

- [ ] **Step 3: Commit docs**

```bash
git add backend.md backend/README.md
git commit -m "docs: document backend setup"
```

## Self-Review

- The plan covers session creation, progress read/write, wrong answer records, zone completion, report read, PostgreSQL schema, Docker startup, and backend docs.
- No auth, admin, leaderboard, multiplayer, or full game-rule migration is included.
- Route names match `backend.md`.
- Data names match the existing frontend state names: `completedZones`, `zoneScores`, `wrongAnswers`, `primersSeen`, and `hintsUsed`.
