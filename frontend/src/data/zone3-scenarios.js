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
    text: 'A new sorting algorithm is introduced. Test that it returns the correct order — exercise the algorithm in complete isolation, with no surrounding I/O or integration points.',
    correctCells: [
      { level: 'unit', type: 'functional' },
    ],
    isoRef: '§3.130',
    feedbackPartial:
      'The brief says "in complete isolation, no I/O" — that is unit-level functional testing, and only that. §3.108 defines unit as the smallest testable item.',
  },
  {
    id: 'z3-s2',
    text: 'Test that the login bypass vulnerability via header injection is blocked — at every level it can be observed: in the parser unit, in the auth service integration, and end-to-end on the running system.',
    correctCells: [
      { level: 'unit',        type: 'security' },
      { level: 'integration', type: 'security' },
      { level: 'system',      type: 'security' },
    ],
    isoRef: '§3.130',
    feedbackPartial:
      'Security testing here spans three levels: unit (parser), integration (auth service), and system (end-to-end). §3.130 Note 1: a test type can be performed at a single level OR across several levels.',
  },
  {
    id: 'z3-s3',
    text: 'Verify that the new search endpoint stays under 200 ms p95 under realistic concurrent load — both for the search service tested in isolation, and for the complete system end-to-end.',
    correctCells: [
      { level: 'unit',   type: 'performance' },
      { level: 'system', type: 'performance' },
    ],
    isoRef: '§3.130 Note 1',
    feedbackPartial:
      'Performance testing occurs at two distinct levels: the unit (search service alone) and the full system. §3.130 Note 1\'s example is exactly this cross-level pattern.',
  },
  {
    id: 'z3-s4',
    text: 'Run a final sign-off with five real users completing the new onboarding wizard — measuring whether they can finish the flow without assistance.',
    correctCells: [
      { level: 'acceptance', type: 'usability' },
    ],
    isoRef: '§3.108',
    feedbackPartial:
      'A real-user sign-off on completed, deployed software is acceptance-level usability testing — the highest level, applied to the user-facing quality characteristic.',
  },
];

export const ZONE3_FULL_SCORE  = 200;
export const ZONE3_PER_SCENARIO = ZONE3_FULL_SCORE / 4;   // 50
export const ZONE3_HALF         = ZONE3_PER_SCENARIO / 2; // 25
