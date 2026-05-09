/**
 * Zone 1 — Error District: 8 incident-report items.
 * Three columns: ERROR (human action), FAULT/DEFECT (code flaw),
 * FAILURE (observable deviation).
 *
 * Tag legend (visual hint, not the answer):
 *   LOG  = an automated log line
 *   DEV  = a developer's commit/PR comment or interview note
 *   USER = a customer-reported observation
 *
 * Distribution: 3 Error · 3 Fault · 2 Failure (mixed across tags so the tag
 * is not a tell — players must reason from the verb/agent).
 */

export const zone1Scenarios = [
  {
    id: 'z1-s1',
    tag: 'DEV',
    text: 'I removed the null-check during the refactor — looked redundant.',
    correctColumn: 'error',
    isoRef: '§4.7',
    hint: 'Who is the agent in this sentence — a person, a piece of code, or a customer? That tells you which column.',
    feedbackWrong:
      "This is a human action — the developer's decision to remove a check. The standard frames human actions as errors (mistakes), not as failures or as the resulting code flaw.",
  },
  {
    id: 'z1-s2',
    tag: 'LOG',
    text: 'NullPointerException at PaymentService.charge:142 — `customer.address` is null but dereferenced.',
    correctColumn: 'fault',
    isoRef: '§4.7',
    hint: 'A flaw embedded in the code itself — line number, missing guard — sits in the work product, not in a human or in the user\'s view.',
    feedbackWrong:
      'A code flaw embedded in the program (the unprotected dereference) is a fault/defect. It is not the human action that caused it, and it is not yet the user-visible deviation.',
  },
  {
    id: 'z1-s3',
    tag: 'USER',
    text: 'Customer report: "I clicked Pay and the page froze for 30 seconds, then said Sorry, try again."',
    correctColumn: 'failure',
    isoRef: '§3.39',
    hint: 'What the customer actually observed — the externally visible deviation from expected behaviour — is one of the three columns.',
    feedbackWrong:
      'An observable deviation from required behaviour — experienced by the user — is a failure (and the report itself is an incident, §3.39). The fault was inside the system; the failure is what the user saw.',
  },
  {
    id: 'z1-s4',
    tag: 'DEV',
    text: 'Junior reviewer approved the PR without re-reading the changed branch logic.',
    correctColumn: 'error',
    isoRef: '§4.7',
    hint: 'The act of approving without reading is a human judgement, not a code flaw and not a user-visible event.',
    feedbackWrong:
      'A human act of judgement that lets a flaw through is itself an error — the act is human, not the flaw it permits and not the user-visible behaviour.',
  },
  {
    id: 'z1-s5',
    tag: 'LOG',
    text: 'Commit 9af2e0: off-by-one in the retry-loop condition (`<` instead of `<=`).',
    correctColumn: 'fault',
    isoRef: '§4.7',
    hint: 'The wrong comparator lives inside the committed code. The act of writing it was an error — what got committed is a different thing.',
    feedbackWrong:
      'The committed code contains the flaw — the wrong comparator. That is a fault/defect in the code itself. The act of writing it was an error; the visible misbehaviour it produces would be a failure.',
  },
  {
    id: 'z1-s6',
    tag: 'USER',
    text: 'Support ticket: "Every time I open the dashboard on Friday afternoon, the charts show last week\'s data, never this week\'s."',
    correctColumn: 'failure',
    isoRef: '§3.39',
    hint: 'Required behaviour: see this week\'s data. Observed behaviour: last week\'s data. A user-visible deviation belongs to which column?',
    feedbackWrong:
      'A user observing the system behave differently than required is a failure. The cache-invalidation bug behind it would be the fault; the developer who shipped it made the error.',
  },
  {
    id: 'z1-s7',
    tag: 'DEV',
    text: 'Tech-lead interview note: "I told the team verbally that the timeout was 30s — never updated the design doc."',
    correctColumn: 'error',
    isoRef: '§4.7',
    hint: 'A human action — telling the team but never writing it down — is a mistake by a person, not a flaw in code or an observed deviation.',
    feedbackWrong:
      'Failing to update documentation is a human act. ISO 29119-1 frames such acts as errors, regardless of whether they later cause a fault to be introduced or a failure to occur.',
  },
  {
    id: 'z1-s8',
    tag: 'LOG',
    text: 'Static-analysis output: race condition between `acquireLock()` and `processQueue()` in OrderWorker — both threads can enter the critical section.',
    correctColumn: 'fault',
    isoRef: '§4.7',
    hint: 'A defect detected by static analysis — even before any failure has occurred — is still a flaw in the code. Where does it sit?',
    feedbackWrong:
      'A defect that exists in the code is a fault, even if no failure has been observed yet. Static testing (§3.78) can find faults without executing the system.',
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
export const ZONE1_PER_ITEM = ZONE1_FULL_SCORE / 8; // 25
