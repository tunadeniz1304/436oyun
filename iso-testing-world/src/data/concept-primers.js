/**
 * Concept primers — shown on first entry to each zone (per session).
 *
 * Frame the misconception this zone targets BEFORE the player makes
 * wrong answers, so the pedagogical loop becomes anticipatory rather
 * than purely corrective.
 *
 * Schema:
 *   { zoneId, title, misconception, isoTruth, example, isoRef }
 */

export const conceptPrimers = {
  'error-district': {
    zoneId: 'error-district',
    title: 'Error, Fault, Failure — three different things',
    misconception:
      'In everyday speech, "bug", "defect" and "crash" mean the same thing. People often use Error and Failure as synonyms.',
    isoTruth:
      'ISO 29119-1 splits these into a causal chain. An ERROR is a human action (a mistake). A FAULT/DEFECT is a flaw in the work product. A FAILURE is the observable deviation when the fault is exercised.',
    example:
      'A developer removes a null-check (error) → the code now contains an unprotected dereference (fault) → a customer sees the page freeze (failure).',
    isoRef: '§4.7',
  },

  'vv-headquarters': {
    zoneId: 'vv-headquarters',
    title: 'Verification vs. Validation — the question, not the role',
    misconception:
      'It is tempting to say "verification is what developers do, validation is what users do." Many textbooks even teach this.',
    isoTruth:
      'ISO 29119-1 defines the distinction by the question being asked. Verification = "did we build it to the spec?". Validation = "did we build the right thing?". Either party can perform either process.',
    example:
      'A developer comparing API output against an OpenAPI schema is doing verification. The same developer asking a real user "did this flow do what you needed?" is doing validation.',
    isoRef: '§4.1.3',
  },

  'matrix-tower': {
    zoneId: 'matrix-tower',
    title: 'Test Levels and Test Types are independent axes',
    misconception:
      'Many engineers assume the test type is fixed by the level — e.g. "unit testing means functional testing" or "performance testing happens at the system level only".',
    isoTruth:
      'ISO 29119-1 §3.130 Note 1 is explicit: a test type can be performed at a single level OR across several levels. Levels (when in lifecycle) and Types (which quality characteristic) are independent.',
    example:
      'Performance testing can happen at unit level (one isolated function) AND at system level (full deployment). Same type, multiple levels — both legitimate.',
    isoRef: '§3.130',
  },

  'artefact-archive': {
    zoneId: 'artefact-archive',
    title: 'Test basis can be undocumented — and static testing IS testing',
    misconception:
      'A common belief: "Test basis must be a formal document" and "static analysis is a code-quality tool, not testing." Both are wrong by the standard.',
    isoTruth:
      'ISO 29119-1 §3.84 Note 1 says test basis "may also be an undocumented understanding of the required behaviour." And §3.78 explicitly classifies static testing — review without execution — as testing.',
    example:
      'A Slack DM saying "cancel must work even after timeout" IS test basis, even with no Word doc. Reading source code for race conditions IS testing.',
    isoRef: '§3.84',
  },

  'final-inspection': {
    zoneId: 'final-inspection',
    title: 'Final Inspection — Incident #048',
    misconception:
      'You may feel you can skim through this. Don\'t — every step touches a different concept area.',
    isoTruth:
      'The Final integrates all four zones plus the Test Oracle (§3.115). Your answers here adjust the report rows for each concept area, and a cascading note will show how earlier mistakes affected this run.',
    example:
      'A wrong answer in Zone 3 about levels-vs-types may resurface in Final step 3 — and the report will reference it.',
    isoRef: '§3.115',
  },
};

/**
 * Convenience accessor.
 */
export function getConceptPrimer(zoneId) {
  return conceptPrimers[zoneId] ?? null;
}
