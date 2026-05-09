/**
 * Zone 4 — Artefact Archive: 6 file artefacts.
 *
 * Tag set (always shown in the UI label below):
 *   basis    — Test Basis (§3.84)
 *   testitem — Test Item / Test Object (§3.107) — both terms always
 *   static   — Static Testing (§3.78)
 *   dynamic  — Dynamic Testing (§3.29)
 *
 * Note 1 to §3.84 ("test basis may be undocumented") is the most important
 * teaching moment in the entire game. The trap artefact `verbal_agreement.txt`
 * MUST be tagged with `basis` — leaving it untagged opens the Note 1 callout
 * before the player can advance.
 */

export const zone4Artefacts = [
  {
    id: 'z4-a1',
    icon: 'doc',
    name: 'requirements_v2.docx',
    description: 'Formal payment-module specification, signed off by the product team last sprint.',
    correctTags: ['basis', 'static'],
    trap: false,
    trapExplanation: null,
    isoRef: '§3.84',
    feedbackWrong:
      'A signed-off requirements document is canonical test basis (§3.84) and is most often examined via static testing (§3.78) — review.',
  },
  {
    id: 'z4-a2',
    icon: 'code',
    name: 'login_module.py',
    description: 'Source code for the authentication module. Currently being tested for the upcoming release.',
    correctTags: ['testitem', 'static', 'dynamic'],
    trap: false,
    trapExplanation: null,
    isoRef: '§3.107',
    feedbackWrong:
      'Executable source code is the test item / test object (§3.107). It can be examined statically (code review, §3.78) AND executed dynamically (§3.29). Both kinds of testing apply to the same artefact.',
  },
  {
    id: 'z4-a3',
    icon: 'doc',
    name: 'design_review_minutes.md',
    description: 'Minutes captured during last week\'s architecture review — decisions about service boundaries.',
    correctTags: ['basis'],
    trap: false,
    trapExplanation: null,
    isoRef: '§3.84',
    feedbackWrong:
      'Review minutes that capture agreed-upon behaviour are test basis information (§3.84). They are not themselves the thing being tested.',
  },
  {
    id: 'z4-a4',
    icon: 'chart',
    name: 'login_test_run.log',
    description: 'Output log captured during a dynamic test run last night. Contains pass/fail entries and timing data.',
    correctTags: [],
    trap: false,
    trapExplanation:
      'Test run logs are *output* from testing, not basis nor test item nor a kind of testing. The right answer is "no role" — use Skip.',
    isoRef: '§3.107',
    feedbackWrong:
      'A test execution log is testware output, not one of the four roles offered. The correct action here is to leave it untagged (Skip — no role) — every artefact does not fit one of these four labels.',
  },
  {
    id: 'z4-a5',
    icon: 'chart',
    name: 'architecture_diagram.svg',
    description: 'Current system architecture diagram, used as the canonical reference for integration testing.',
    correctTags: ['basis', 'static'],
    trap: false,
    trapExplanation: null,
    isoRef: '§3.84',
    feedbackWrong:
      'A canonical architecture diagram is test basis (§3.84) — it defines what the system is meant to do — and is examined via static review.',
  },
  {
    id: 'z4-a6',
    icon: 'chat',
    name: 'verbal_agreement.txt',
    description:
      'A short note from a hallway conversation with the product owner: "The cancel button should always work, even after timeout." No formal document was ever produced.',
    correctTags: ['basis'],
    trap: true,
    trapExplanation:
      '§3.84 Note 1: "The test basis may take the form of documentation, such as a requirements specification, design specification, or module specification, but may also be an undocumented understanding of the required behaviour." A document is not required — a verbal agreement that captures required behaviour IS test basis.',
    isoRef: '§3.84',
    feedbackWrong:
      'You left a description of required behaviour untagged because it was not written down. §3.84 Note 1 is explicit: an undocumented understanding still counts as test basis.',
  },
];

export const ZONE4_FULL_SCORE = 200;
export const ZONE4_PER_ARTEFACT = ZONE4_FULL_SCORE / 6;     // ≈ 33.33
export const ZONE4_HALF = ZONE4_PER_ARTEFACT / 2;
