import { pool as defaultPool } from '../db/pool.js';

function mapWrongAnswer(row) {
  return {
    id: row.id,
    zoneId: row.zone_id,
    itemId: row.item_id,
    playerAnswer: row.player_answer,
    correctAnswer: row.correct_answer,
    isoRef: row.iso_ref,
    createdAt: row.created_at,
  };
}

function mapZoneAttempt(row) {
  return {
    id: row.id,
    zoneId: row.zone_id,
    score: row.score,
    wrongCount: row.wrong_count,
    hintsUsedCount: row.hints_used_count,
    completedAt: row.completed_at,
  };
}

async function loadSession(db, sessionId) {
  const sessionResult = await db.query(
    `
      SELECT
        gs.id,
        gs.player_name,
        gs.status,
        gs.total_score,
        gs.started_at,
        gs.completed_at,
        COALESCE(sp.completed_zones, '[]'::jsonb) AS completed_zones,
        COALESCE(sp.zone_scores, '{}'::jsonb) AS zone_scores,
        COALESCE(sp.primers_seen, '[]'::jsonb) AS primers_seen,
        COALESCE(sp.hints_used, '{}'::jsonb) AS hints_used
      FROM game_sessions gs
      LEFT JOIN session_progress sp ON sp.session_id = gs.id
      WHERE gs.id = $1
    `,
    [sessionId]
  );

  if (sessionResult.rowCount === 0) return null;

  const wrongAnswerResult = await db.query(
    'SELECT * FROM wrong_answers WHERE session_id = $1 ORDER BY created_at ASC',
    [sessionId]
  );
  const attemptResult = await db.query(
    'SELECT * FROM zone_attempts WHERE session_id = $1 ORDER BY completed_at ASC',
    [sessionId]
  );

  const row = sessionResult.rows[0];
  return {
    sessionId: row.id,
    playerName: row.player_name,
    status: row.status,
    totalScore: row.total_score,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    completedZones: row.completed_zones,
    zoneScores: row.zone_scores,
    primersSeen: row.primers_seen,
    hintsUsed: row.hints_used,
    wrongAnswers: wrongAnswerResult.rows.map(mapWrongAnswer),
    zoneAttempts: attemptResult.rows.map(mapZoneAttempt),
  };
}

export function createSessionRepository(db = defaultPool) {
  return {
    async createSession({ playerName }) {
      const result = await db.query(
        'INSERT INTO game_sessions (player_name) VALUES ($1) RETURNING id',
        [playerName]
      );
      const sessionId = result.rows[0].id;
      await db.query('INSERT INTO session_progress (session_id) VALUES ($1)', [sessionId]);
      return loadSession(db, sessionId);
    },

    async getSession(sessionId) {
      return loadSession(db, sessionId);
    },

    async saveProgress(sessionId, progress) {
      const existing = await loadSession(db, sessionId);
      if (!existing) return null;

      await db.query(
        `
          INSERT INTO session_progress (
            session_id,
            completed_zones,
            zone_scores,
            primers_seen,
            hints_used,
            updated_at
          )
          VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, now())
          ON CONFLICT (session_id)
          DO UPDATE SET
            completed_zones = EXCLUDED.completed_zones,
            zone_scores = EXCLUDED.zone_scores,
            primers_seen = EXCLUDED.primers_seen,
            hints_used = EXCLUDED.hints_used,
            updated_at = now()
        `,
        [
          sessionId,
          JSON.stringify(progress.completedZones),
          JSON.stringify(progress.zoneScores),
          JSON.stringify(progress.primersSeen),
          JSON.stringify(progress.hintsUsed),
        ]
      );
      await db.query('UPDATE game_sessions SET total_score = $2 WHERE id = $1', [
        sessionId,
        progress.totalScore,
      ]);
      return loadSession(db, sessionId);
    },

    async recordWrongAnswer(sessionId, payload) {
      const existing = await loadSession(db, sessionId);
      if (!existing) return null;

      const result = await db.query(
        `
          INSERT INTO wrong_answers (
            session_id,
            zone_id,
            item_id,
            player_answer,
            correct_answer,
            iso_ref
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
        [
          sessionId,
          payload.zoneId,
          payload.itemId,
          payload.playerAnswer,
          payload.correctAnswer,
          payload.isoRef,
        ]
      );
      return mapWrongAnswer(result.rows[0]);
    },

    async completeZone(sessionId, payload) {
      const existing = await loadSession(db, sessionId);
      if (!existing) return null;

      await db.query(
        `
          INSERT INTO zone_attempts (
            session_id,
            zone_id,
            score,
            wrong_count,
            hints_used_count,
            completed_at
          )
          VALUES ($1, $2, $3, $4, $5, now())
          ON CONFLICT (session_id, zone_id)
          DO UPDATE SET
            score = EXCLUDED.score,
            wrong_count = EXCLUDED.wrong_count,
            hints_used_count = EXCLUDED.hints_used_count,
            completed_at = now()
        `,
        [
          sessionId,
          payload.zoneId,
          payload.score,
          payload.wrongCount,
          payload.hintsUsedCount,
        ]
      );

      const completedZones = Array.from(new Set([...existing.completedZones, payload.zoneId]));
      const zoneScores = { ...existing.zoneScores, [payload.zoneId]: payload.score };
      const totalScore = Object.values(zoneScores).reduce((sum, score) => sum + score, 0);

      return this.saveProgress(sessionId, {
        completedZones,
        zoneScores,
        totalScore,
        primersSeen: existing.primersSeen,
        hintsUsed: existing.hintsUsed,
      });
    },
  };
}
