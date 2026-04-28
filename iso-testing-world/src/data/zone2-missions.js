/**
 * Zone 2 — V&V Headquarters: 11 missions.
 *
 * Distribution: 4 verification, 4 validation, 3 both. Exactly one mission
 * carries the Oracle prompt (m4 — middle of the run). Order is fixed; mission
 * queue advances strictly left to right.
 *
 * The misconception this exposes (CLAUDE.md §7.2):
 *   "Verification = developers; Validation = users."
 * The standard's framing is about the *question*, not the role. So the
 * scenarios deliberately assign the same role to V and V cases, and the
 * routing must be picked from the question being asked.
 */

export const zone2Missions = [
  {
    id: 'z2-m1',
    text:
      'Confirm that the new payment-gateway integration conforms to the PCI-DSS specification document agreed with the security team.',
    correctRouting: 'verification',
    isoRef: '§4.1.3',
    hint: 'The wording says "conforms to the specification document". That tells you which question is being asked.',
    feedbackWrong:
      'You are checking conformance to a written specification — that is verification, not validation. The party doing the checking is irrelevant to this distinction.',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m2',
    text:
      'Sit with three real customers as they file a refund and observe whether the new flow actually meets their expectations under everyday conditions.',
    correctRouting: 'validation',
    isoRef: '§4.1.3',
    hint: 'No spec document is mentioned — instead, "real customers" and "everyday conditions". Which question maps to that?',
    feedbackWrong:
      'You are evaluating fitness for the stakeholders\' intended use — that is validation. Conformance to a written spec is not at issue here.',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m3',
    text:
      'A developer compares the API response shape for /orders against the OpenAPI schema in the design documents, line by line.',
    correctRouting: 'verification',
    isoRef: '§4.1.3',
    hint: 'A developer is doing this — but ignore the role. Read the activity: "compares against the OpenAPI schema." That is the signal.',
    feedbackWrong:
      'Conformance check against the written specification — that is verification. The fact that a developer is doing it does not make it the developer\'s exclusive activity.',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m4',
    text:
      'Operations is rolling out a new alerting system and wants to know both that it implements the runbook step-by-step and that it actually helps the on-call engineers respond faster in real incidents.',
    correctRouting: 'both',
    isoRef: '§4.1.3',
    hint: 'Two distinct questions are being asked in this sentence. Count them: spec-conformance AND fit-for-real-use.',
    feedbackWrong:
      'Two questions are being asked: conformance to the runbook (verification) AND fitness for the on-call engineers\' use (validation). The standard treats these as separate processes; here you need both.',
    oraclePromptHere: true,
  },
  {
    id: 'z2-m5',
    text:
      'A test plan asks you to check that the password-reset email links contain the exact tokens specified in the design document and nothing else.',
    correctRouting: 'verification',
    isoRef: '§4.1.3',
    hint: 'The phrase "exact tokens specified in the design document" is decisive — only one of the two questions cares about that.',
    feedbackWrong:
      'You are confirming conformance to the design document — verification. Whether users like the email is a separate question.',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m6',
    text:
      'Beta testers are asked: "When you tried the new search, did it surface what you actually wanted?" — and their answers will decide whether the team ships.',
    correctRouting: 'validation',
    isoRef: '§4.1.3',
    hint: 'There may not even be a written spec for "what users actually wanted". That tells you which routing applies.',
    feedbackWrong:
      'You are checking whether the test item meets the stakeholders\' actual needs — validation. There may not even be a written spec for "good search results".',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m7',
    text:
      'A regulator audit demands evidence that the medical-device firmware (a) implements every requirement in the IEC 62304 documentation, and (b) is genuinely usable by clinicians under hospital conditions.',
    correctRouting: 'both',
    isoRef: '§4.1.3',
    hint: 'The sentence literally lists two requirements (a) and (b) — one targets a document, one targets real use.',
    feedbackWrong:
      'Two questions being asked: documentary conformance (verification) AND clinician usability (validation). Either alone would be insufficient evidence for the audit.',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m8',
    text:
      'A product manager runs a hallway test: "If a brand-new user opens the app, can they understand what it does in 30 seconds?"',
    correctRouting: 'validation',
    isoRef: '§4.1.3',
    hint: '"Brand-new user" + "understand it" — no spec is being checked. Which question is that?',
    feedbackWrong:
      'You are evaluating fitness for use by the intended audience — validation. There is no written spec defining "understandable in 30 seconds".',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m9',
    text:
      'QA runs a checklist of the 47 acceptance criteria from the user story, marking each as pass or fail against the running build.',
    correctRouting: 'verification',
    isoRef: '§4.1.3',
    hint: '"Checklist of acceptance criteria from the user story" — those are written requirements. Which question does that match?',
    feedbackWrong:
      'You are checking conformance to written acceptance criteria — that is verification. Even though it is called "acceptance testing" colloquially, the activity here matches a specification, line by line.',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m10',
    text:
      'Product brings two real recruiters into the office, hands them the new candidate-screening tool, and watches whether their hiring instincts get useful support from the AI suggestions.',
    correctRouting: 'validation',
    isoRef: '§4.1.3',
    hint: 'No specification appears — instead, real users\' instincts and intended use. Which question is being asked?',
    feedbackWrong:
      'You are evaluating fitness for stakeholders\' intended use — validation. The role of the people involved (product, recruiters) does not determine the routing; the question being asked does.',
    oraclePromptHere: false,
  },
  {
    id: 'z2-m11',
    text:
      'Before merging the new export feature, the team needs to confirm that (a) the CSV format matches the documented schema exactly, and (b) finance teams in three regions can actually use the file in their existing pipelines.',
    correctRouting: 'both',
    isoRef: '§4.1.3',
    hint: 'Two questions chained with "and": one references a documented schema, the other references real-world use across regions.',
    feedbackWrong:
      'Two distinct questions are present: schema conformance (verification) AND fit-for-use across real finance pipelines (validation). The standard separates these processes — you need both here.',
    oraclePromptHere: false,
  },
];

export const ZONE2_FULL_SCORE = 200;
export const ZONE2_PER_MISSION = ZONE2_FULL_SCORE / 11;   // ~18.18
export const ZONE2_PARTIAL_BOTH = ZONE2_PER_MISSION / 2;  // half-credit for partial "both" justification
export const ORACLE_FULL_POINTS = 50;                     // for selecting "both — partial oracle"
