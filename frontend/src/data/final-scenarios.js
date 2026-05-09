/**
 * Final Inspection — Incident #048 (escalation of #047).
 *
 * Five sub-steps, one per concept area. Each step's score is added to the
 * matching report row in state.zoneScores:
 *   step 1 → error-district  (Error/Fault/Failure)
 *   step 2 → vv-headquarters (V&V)
 *   step 3 → matrix-tower    (Levels × Types)
 *   step 4 → artefact-archive (Artefacts)
 *   step 5 → oracle          (Test Oracle)
 *
 * NOTE: Final scoring writes to a separate ledger and is reflected in
 * state.zoneScores['final-inspection'] as the average across the 5 steps.
 * The report itself reads from each concept-area row directly so the player
 * sees the cumulative picture across the journey.
 */

export const FINAL_PER_STEP = 40;       // 200 / 5
export const FINAL_FULL = 200;
export const FINAL_HALF = 20;

export const finalSteps = [
  {
    id: 'fi-s1',
    concept: 'error-district',
    title: 'Step 1 — Classify the new incident',
    text:
      'Production logs show: NullPointerException at PaymentService.charge:142 — `customer.address` is null but dereferenced. What kind of thing is this?',
    type: 'choice',
    options: [
      { key: 'error',   label: 'ERROR',           sublabel: 'human action' },
      { key: 'fault',   label: 'FAULT / DEFECT',  sublabel: 'flaw inside the code' },
      { key: 'failure', label: 'FAILURE',          sublabel: 'observable deviation' },
    ],
    correctKey: 'fault',
    isoRef: '§4.7',
    feedbackWrong:
      'A code flaw embedded in the program (the unprotected dereference) is a fault/defect — distinct from the human act that caused it and from the user-visible behaviour it produces.',
  },
  {
    id: 'fi-s2',
    concept: 'vv-headquarters',
    title: 'Step 2 — Pick V or V (or BOTH)',
    text:
      'You need to demonstrate that the patched payment-gateway integration (a) conforms to the PCI-DSS specification, AND (b) is genuinely usable by the on-call engineers under real incident conditions. Which assessment(s) do you need?',
    type: 'choice',
    options: [
      { key: 'verification', label: 'VERIFICATION', sublabel: 'spec only' },
      { key: 'validation',   label: 'VALIDATION',   sublabel: 'use only' },
      { key: 'both',         label: 'BOTH',          sublabel: 'both questions' },
    ],
    correctKey: 'both',
    isoRef: '§4.1.3',
    feedbackWrong:
      'Two questions are being asked: spec-conformance (verification) AND fit-for-use (validation). Either alone is insufficient evidence here — both processes are needed.',
  },
  {
    id: 'fi-s3',
    concept: 'matrix-tower',
    title: 'Step 3 — Choose level × type',
    text:
      'For the security regression around the patched dereference, where do you place tests? Pick at least one cell.',
    type: 'matrix',
    correctCells: [
      { level: 'unit',         type: 'security' },
      { level: 'integration',  type: 'security' },
      { level: 'system',       type: 'security' },
    ],
    isoRef: '§3.130 Note 1',
    feedbackPartial:
      'The regression should be exercised at unit (the parser), integration (the auth boundary), and system (full deployment) — §3.130 Note 1 explicitly allows the same type across multiple levels.',
  },
  {
    id: 'fi-s4',
    concept: 'artefact-archive',
    title: 'Step 4 — Tag the key artefact',
    text:
      'The product owner sent a Slack DM: "Make sure cancel keeps working even after timeout." There is no formal requirement document. How do you classify this artefact?',
    type: 'tags',
    correctTags: ['basis'],
    isoRef: '§3.84',
    feedbackWrong:
      '§3.84 Note 1: an undocumented understanding of required behaviour still counts as test basis. The lack of a Word doc does not change its role.',
  },
  {
    id: 'fi-s5',
    concept: 'oracle',
    title: 'Step 5 — Identify the test oracle',
    text:
      'When you run the cancel-after-timeout test, what determines whether it has passed or failed?',
    type: 'choice',
    options: [
      { key: 'spec',   label: 'The spec only',                 sublabel: 'No spec exists.' },
      { key: 'human',  label: 'A human expert only',           sublabel: 'Slack DM sender.' },
      { key: 'both',   label: 'Both — partial oracle',          sublabel: 'Slack DM + human sign-off.' },
    ],
    correctKey: 'both',
    isoRef: '§3.115',
    feedbackWrong:
      '§3.115 Note 1 lists multiple legitimate sources: a specification, another similar system, OR a human expert. With only an informal Slack note, the oracle is a partial composite — the note PLUS a human expert\'s sign-off.',
  },
];

/**
 * Map a final-step concept to the report row whose score it influences.
 */
export const STEP_TO_ROW = {
  'error-district':   'error-district',
  'vv-headquarters':  'vv-headquarters',
  'matrix-tower':     'matrix-tower',
  'artefact-archive': 'artefact-archive',
  'oracle':           'oracle',
};
