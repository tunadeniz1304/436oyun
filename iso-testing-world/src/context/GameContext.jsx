import { createContext, useReducer, useEffect, useMemo, useCallback } from 'react';

export const ZONE_ORDER = [
  'error-district',
  'vv-headquarters',
  'matrix-tower',
  'artefact-archive',
  'final-inspection',
];

export const ZONE_META = {
  'error-district':   { name: 'Error District',     color: 'var(--zone1-color)', bg: 'var(--zone1-bg)' },
  'vv-headquarters':  { name: 'V&V Headquarters',   color: 'var(--zone2-color)', bg: 'var(--zone2-bg)' },
  'matrix-tower':     { name: 'Test Matrix Tower',  color: 'var(--zone3-color)', bg: 'var(--zone3-bg)' },
  'artefact-archive': { name: 'Artefact Archive',   color: 'var(--zone4-color)', bg: 'var(--zone4-bg)' },
  'final-inspection': { name: 'Final Inspection',   color: 'var(--final-color)', bg: 'var(--final-bg)' },
};

export const REPORT_ROWS = [
  { key: 'error-district',   label: 'Error / Fault / Failure', subLabel: 'Zone 1 — §3.39, §4.7' },
  { key: 'vv-headquarters',  label: 'Verification & Validation', subLabel: 'Zone 2 — §4.1.3' },
  { key: 'matrix-tower',     label: 'Test Levels × Test Types',  subLabel: 'Zone 3 — §3.108, §3.130' },
  { key: 'artefact-archive', label: 'Test Basis & Artefacts',    subLabel: 'Zone 4 — §3.84, §3.107' },
  { key: 'oracle',           label: 'Test Oracle',                subLabel: 'Zone 2 + Final — §3.115, §4.1.10' },
];

const initialState = {
  completedZones: new Set(),
  zoneScores: {
    'error-district':    0,
    'vv-headquarters':   0,
    'matrix-tower':      0,
    'artefact-archive':  0,
    'final-inspection':  0,
    'oracle':            0,
  },
  totalScore: 0,
  wrongAnswers: [],
  sessionStarted: false,
};

function recomputeTotal(zoneScores) {
  return Object.values(zoneScores).reduce((a, b) => a + b, 0);
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_SESSION':
      return { ...state, sessionStarted: true };

    case 'COMPLETE_ZONE': {
      const completedZones = new Set(state.completedZones);
      completedZones.add(action.zoneId);
      const zoneScores = { ...state.zoneScores, [action.zoneId]: action.score };
      return {
        ...state,
        completedZones,
        zoneScores,
        totalScore: recomputeTotal(zoneScores),
      };
    }

    case 'ADD_ORACLE_POINTS': {
      const zoneScores = {
        ...state.zoneScores,
        oracle: Math.min(200, state.zoneScores.oracle + action.points),
      };
      return { ...state, zoneScores, totalScore: recomputeTotal(zoneScores) };
    }

    case 'SET_ORACLE_POINTS': {
      const zoneScores = {
        ...state.zoneScores,
        oracle: Math.max(0, Math.min(200, action.points)),
      };
      return { ...state, zoneScores, totalScore: recomputeTotal(zoneScores) };
    }

    case 'RECORD_WRONG':
      return {
        ...state,
        wrongAnswers: [...state.wrongAnswers, { ...action.payload, timestamp: Date.now() }],
      };

    case 'RESET_ZONE': {
      const completedZones = new Set(state.completedZones);
      completedZones.delete(action.zoneId);
      const zoneScores = { ...state.zoneScores, [action.zoneId]: 0 };
      // Final replay also clears oracle (oracle accumulates from final + zone 2 prompt)
      if (action.zoneId === 'final-inspection') {
        zoneScores.oracle = 0;
      }
      const wrongAnswers = state.wrongAnswers.filter(w => w.zoneId !== action.zoneId);
      return {
        ...state,
        completedZones,
        zoneScores,
        wrongAnswers,
        totalScore: recomputeTotal(zoneScores),
      };
    }

    case 'RESET':
      return { ...initialState, completedZones: new Set() };

    default:
      return state;
  }
}

export const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__GAME_STATE__ = state;
      window.__GAME_DISPATCH__ = dispatch;
    }
  }, [state]);

  const completeZone = useCallback(
    (zoneId, score) => dispatch({ type: 'COMPLETE_ZONE', zoneId, score }),
    []
  );
  const recordWrong = useCallback(
    (payload) => dispatch({ type: 'RECORD_WRONG', payload }),
    []
  );
  const addOraclePoints = useCallback(
    (points) => dispatch({ type: 'ADD_ORACLE_POINTS', points }),
    []
  );
  const setOraclePoints = useCallback(
    (points) => dispatch({ type: 'SET_ORACLE_POINTS', points }),
    []
  );
  const resetZone = useCallback(
    (zoneId) => dispatch({ type: 'RESET_ZONE', zoneId }),
    []
  );
  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);
  const startSession = useCallback(() => dispatch({ type: 'START_SESSION' }), []);

  const isZoneUnlocked = useCallback(
    (zoneId) => {
      if (zoneId === 'error-district') return true;
      if (zoneId === 'final-inspection') {
        return ['error-district', 'vv-headquarters', 'matrix-tower', 'artefact-archive']
          .every(id => state.completedZones.has(id));
      }
      const idx = ZONE_ORDER.indexOf(zoneId);
      if (idx <= 0) return false;
      return state.completedZones.has(ZONE_ORDER[idx - 1]);
    },
    [state.completedZones]
  );

  const value = useMemo(
    () => ({
      state,
      completeZone,
      recordWrong,
      addOraclePoints,
      setOraclePoints,
      resetZone,
      resetGame,
      startSession,
      isZoneUnlocked,
    }),
    [
      state,
      completeZone,
      recordWrong,
      addOraclePoints,
      setOraclePoints,
      resetZone,
      resetGame,
      startSession,
      isZoneUnlocked,
    ]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
