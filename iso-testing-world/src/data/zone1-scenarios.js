/**
 * Zone 1 — Error District: 5 incident-report items.
 * Three columns: ERROR (human action), FAULT/DEFECT (code flaw),
 * FAILURE (observable deviation).
 *
 * Tag legend (visual hint, not the answer):
 *   LOG  = an automated log line
 *   DEV  = a developer's commit/PR comment or interview note
 *   USER = a customer-reported observation
 *
 * Distribution: 2 Error · 2 Fault · 1 Failure (mixed across tags so the tag
 * is not a tell — players must reason from the verb/agent).
 */

export const zone1Scenarios = [
  {
    id: 'z1-s1',
    tag: 'DEV',
    text: 'I removed the null-check during the refactor — looked redundant.',
    correctColumn: 'error',
    isoRef: '§4.7',
    feedbackWrong:
      "This is a human action — the developer's decision to remove a check. The standard frames human actions as errors (mistakes), not as failures or as the resulting code flaw.",
  },
  {
    id: 'z1-s2',
    tag: 'LOG',
    text: 'NullPointerException at PaymentService.charge:142 — `customer.address` is null but dereferenced.',
    correctColumn: 'fault',
    isoRef: '§4.7',
    feedbackWrong:
      'A code flaw embedded in the program (the unprotected dereference) is a fault/defect. It is not the human action that caused it, and it is not yet the user-visible deviation.',
  },
  {
    id: 'z1-s3',
    tag: 'USER',
    text: 'Customer report: "I clicked Pay and the page froze for 30 seconds, then said Sorry, try again."',
    correctColumn: 'failure',
    isoRef: '§3.39',
    feedbackWrong:
      'An observable deviation from required behaviour — experienced by the user — is a failure (and the report itself is an incident, §3.39). The fault was inside the system; the failure is what the user saw.',
  },
  {
    id: 'z1-s4',
    tag: 'DEV',
    text: 'Junior reviewer approved the PR without re-reading the changed branch logic.',
    correctColumn: 'error',
    isoRef: '§4.7',
    feedbackWrong:
      'A human act of judgement that lets a flaw through is itself an error — the act is human, not the flaw it permits and not the user-visible behaviour.',
  },
  {
    id: 'z1-s5',
    tag: 'LOG',
    text: 'Commit 9af2e0: off-by-one in the retry-loop condition (`<` instead of `<=`).',
    correctColumn: 'fault',
    isoRef: '§4.7',
    feedbackWrong:
      'The committed code contains the flaw — the wrong comparator. That is a fault/defect in the code itself. The act of writing it was an error; the visible misbehaviour it produces would be a failure.',
  },
];

export const COLUMN_DEFS = [
  {
    id: 'error',
    label: 'ERROR',
    sublabel: 'human action',
    clauseRef: '§4.7',
    blurb: 'A mistake by a person — a developer, reviewer, designer, or operator.',
  },
  {
    id: 'fault',
    label: 'FAULT / DEFECT',
    sublabel: 'flaw inside the code',
    clauseRef: '§4.7',
    blurb: 'A flaw that exists in the work product itself.',
  },
  {
    id: 'failure',
    label: 'FAILURE',
    sublabel: 'observable deviation',
    clauseRef: '§3.39',
    blurb: "An external observation that the system's behaviour deviates from what is required.",
  },
];

export const ZONE1_FULL_SCORE = 200;
export const ZONE1_PER_ITEM = 40;
