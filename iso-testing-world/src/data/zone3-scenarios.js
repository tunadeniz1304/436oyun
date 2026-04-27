/**
 * Zone 3 — Test Matrix Tower: 6 scenarios.
 *
 * The matrix is Test Levels × Test Types — independent axes per §3.130 Note 1.
 * Distribution (per build instructions §F.9.1):
 *   2 single-cell-correct (no challenge fires)
 *   2 two-cell scenarios
 *   2 three-cell scenarios
 *
 * The single-cell challenge modal fires only when the player selects exactly
 * one cell AND `correctCells.length > 1`. That moment is the teaching trigger
 * for §3.130 Note 1.
 */

export const TEST_LEVELS = [
  { id: 'unit',         label: 'Unit',          clauseRef: '§3.108' },
  { id: 'integration',  label: 'Integration',   clauseRef: '§3.108' },
  { id: 'system',       label: 'System',        clauseRef: '§3.108' },
  { id: 'acceptance',   label: 'Acceptance',    clauseRef: '§3.108' },
];

export const TEST_TYPES = [
  { id: 'functional',   label: 'Functional',    clauseRef: '§3.130' },
  { id: 'security',     label: 'Security',      clauseRef: '§3.130' },
  { id: 'performance',  label: 'Performance',   clauseRef: '§3.130' },
  { id: 'usability',    label: 'Usability',     clauseRef: '§3.130' },
];

export const zone3Scenarios = [
  {
    id: 'z3-s1',
    text:
      'Test that the login bypass vulnerability via header injection is blocked — at every level it can be observed: in the parser unit, in the auth integration, and end-to-end on the running system.',
    correctCells: [
      { level: 'unit',         type: 'security' },
      { level: 'integration',  type: 'security' },
      { level: 'system',       type: 'security' },
    ],
    isoRef: '§3.130',
    feedbackPartial:
      'You picked some valid cells but missed others. §3.130 Note 1: a test type can be performed at a single level OR across several levels — security testing here applies at unit, integration, and system.',
  },
  {
    id: 'z3-s2',
    text:
      'A new sorting algorithm is introduced. Test that it returns the right order — but exercise the algorithm in isolation, with no surrounding I/O.',
    correctCells: [
      { level: 'unit', type: 'functional' },
    ],
    isoRef: '§3.130',
    feedbackPartial:
      'The brief explicitly says "in isolation, no surrounding I/O" — that is unit-level functional testing, and only that.',
  },
  {
    id: 'z3-s3',
    text:
      'Verify that the new search endpoint stays under 200 ms p95 under realistic concurrent load — both for the search service in isolation, and for the full system end-to-end.',
    correctCells: [
      { level: 'unit',   type: 'performance' },
      { level: 'system', type: 'performance' },
    ],
    isoRef: '§3.130 Note 1',
    feedbackPartial:
      'Performance testing here happens at two distinct levels: the unit (the search service alone) and the full system. §3.130 Note 1\'s example is exactly this case.',
  },
  {
    id: 'z3-s4',
    text:
      'Run a final sign-off with five real users completing the new onboarding wizard — measuring whether they can finish without help.',
    correctCells: [
      { level: 'acceptance', type: 'usability' },
    ],
    isoRef: '§3.108',
    feedbackPartial:
      'A real-user sign-off check on completed software is acceptance-level usability testing — the highest level applied to the user-facing quality characteristic.',
  },
  {
    id: 'z3-s5',
    text:
      'A pair of microservices must remain functionally correct when integrated, and must continue to do so when run as part of the full system.',
    correctCells: [
      { level: 'integration', type: 'functional' },
      { level: 'system',      type: 'functional' },
    ],
    isoRef: '§3.130',
    feedbackPartial:
      'Functional testing at integration AND system levels — the same test type, applied at two levels (§3.130 Note 1).',
  },
  {
    id: 'z3-s6',
    text:
      'Ensure the medical-device firmware is robust against malformed inputs across every layer it processes data — at the parser unit, at the integration of subsystems, and at the full system level when deployed on real hardware.',
    correctCells: [
      { level: 'unit',         type: 'security' },
      { level: 'integration',  type: 'security' },
      { level: 'system',       type: 'security' },
    ],
    isoRef: '§3.130 Note 1',
    feedbackPartial:
      'Security testing across three levels — the cross-level pattern §3.130 Note 1 calls out explicitly.',
  },
];

export const ZONE3_FULL_SCORE = 200;
export const ZONE3_PER_SCENARIO = ZONE3_FULL_SCORE / 6;     // ≈ 33.33
export const ZONE3_HALF = ZONE3_PER_SCENARIO / 2;
