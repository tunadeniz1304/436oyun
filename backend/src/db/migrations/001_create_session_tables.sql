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
