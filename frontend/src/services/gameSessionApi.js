const DEFAULT_API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:3001';

async function readJson(response) {
  if (typeof response.text !== 'function' && typeof response.json === 'function') {
    return response.json();
  }
  const text = await response.text?.();
  if (!text) return null;
  return JSON.parse(text);
}

async function requestJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const body = await readJson(response);
  if (!response.ok) {
    const error = new Error(body?.error ?? `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function setToArray(value) {
  return Array.from(value ?? []);
}

export function toProgressPayload(state) {
  return {
    completedZones: setToArray(state.completedZones),
    zoneScores: state.zoneScores,
    totalScore: state.totalScore,
    primersSeen: setToArray(state.primersSeen),
    hintsUsed: Object.fromEntries(
      Object.entries(state.hintsUsed ?? {}).map(([zoneId, hints]) => [zoneId, setToArray(hints)])
    ),
  };
}

export function createGameSessionApi({
  baseUrl = DEFAULT_API_BASE_URL,
  fetchImpl = fetch,
} = {}) {
  const apiUrl = (path) => `${baseUrl}${path}`;

  return {
    async getOrCreateSession() {
      try {
        return await requestJson(fetchImpl, apiUrl('/api/sessions/current'));
      } catch (error) {
        if (error.status !== 404) throw error;
        return requestJson(fetchImpl, apiUrl('/api/sessions'), {
          method: 'POST',
          body: JSON.stringify({}),
        });
      }
    },

    async saveProgress(sessionId, progress) {
      return requestJson(fetchImpl, apiUrl(`/api/sessions/${sessionId}/progress`), {
        method: 'PATCH',
        body: JSON.stringify(progress),
      });
    },

    async recordWrongAnswer(sessionId, payload) {
      return requestJson(fetchImpl, apiUrl(`/api/sessions/${sessionId}/wrong-answers`), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async completeZone(sessionId, zoneId, score, extra = {}) {
      return requestJson(fetchImpl, apiUrl(`/api/sessions/${sessionId}/complete-zone`), {
        method: 'POST',
        body: JSON.stringify({ zoneId, score, ...extra }),
      });
    },

    async getReport(sessionId) {
      return requestJson(fetchImpl, apiUrl(`/api/sessions/${sessionId}/report`));
    },
  };
}

export const gameSessionApi = createGameSessionApi();
