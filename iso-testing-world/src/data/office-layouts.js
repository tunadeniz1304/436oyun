export function getPlayerStart(map) {
  for (let row = 0; row < map.length; row++) {
    const col = map[row].indexOf('X');
    if (col !== -1) return { col, row: row - 2 };
  }
  return { col: 12, row: 14 };
}

export const OFFICE_LAYOUTS = {

  /* ─────────────────────────────────────────────────────────────
     ZONE 1 — Error District HQ
     Coral theme · Incident triage floor
  ───────────────────────────────────────────────────────────── */
  'error-district': {
    zoneRoute: '/zone/error-district',
    color: 'var(--zone1-color)',
    label: 'Error District HQ',
    map: [
      '########################',
      '#B....................B#',
      '#....DD.........DD....#',
      '#....DC.........DC....#',
      '#####W.....P....W#####',
      '#....W.........W.....#',
      '#.DD.W....C....W.DD..#',
      '#.DC.W....D....W.DC..#',
      '#....WWWW...WWWW.....#',
      '#......................#',
      '#....DDDDDDDDDDD......#',
      '#....CCCCCCCCCCC......#',
      '#....P.........P......#',
      '#......................#',
      '#..P...............P..#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'alex',
        name: 'Alex Chen',
        role: 'Incident Commander',
        type: 'main',
        col: 10, row: 6,
        facing: 'down',
        lines: [
          'Production incident #047 is still active. Every second costs us.',
          'Three concepts are constantly confused here — and that confusion costs lives in prod.',
          'ERROR is a human action: the developer\'s decision, the misunderstanding in their head.',
          'FAULT (or Defect) is the result of that error encoded in the software artifact.',
          'FAILURE is what happens at runtime when that fault is triggered — the observable deviation.',
          'The chain is causal and ordered: Error → Fault → Failure. You cannot have a Failure without a Fault, and no Fault without an Error.',
          'ISO/IEC/IEEE 29119-1 §4.7 makes this explicit. Now go classify those incident cards.',
        ],
      },
      { id: 'w1', name: 'Dev Patel', role: 'Backend Engineer', type: 'worker',
        col: 5, row: 3, facing: 'right', bubble: 'Reviewing null-check...' },
      { id: 'w2', name: 'Lin Meyer', role: 'Frontend Engineer', type: 'worker',
        col: 5, row: 7, facing: 'down', bubble: 'Tracing the crash log...' },
      { id: 'w3', name: 'Ramos QA', role: 'QA Engineer', type: 'worker',
        col: 18, row: 3, facing: 'left', bubble: 'Writing repro steps...' },
      { id: 'w4', name: 'Okonkwo', role: 'QA Lead', type: 'worker',
        col: 18, row: 7, facing: 'down', bubble: 'Ticket triage...' },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     ZONE 2 — V&V Headquarters
     Blue theme · Two-wing building, divider wall
  ───────────────────────────────────────────────────────────── */
  'vv-headquarters': {
    zoneRoute: '/zone/vv-headquarters',
    color: 'var(--zone2-color)',
    label: 'V&V Headquarters — Floor 12',
    map: [
      '########################',
      '#B..........W.......B.#',
      '#.DD........W........##',
      '#.DC........W........D#',
      '#...........W........C#',
      '#.DD........W........D#',
      '#.DC........W........C#',
      '#...........W.........#',
      '#.DD........W........D#',
      '#.DC.......WWW.......C#',
      '#..........C...........#',
      '#....P.....D....P.....#',
      '#......................#',
      '#....DDDDDDDDDDD......#',
      '#....CCCCCCCCCCC......#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'morgan',
        name: 'Morgan Lee',
        role: 'V&V Division Lead',
        type: 'main',
        col: 11, row: 10,
        facing: 'down',
        lines: [
          'Welcome to V&V HQ, Floor 12. Left wing: Verification. Right wing: Validation.',
          'Most engineers get this wrong: they think it\'s about WHO does the work.',
          'Verification asks: "Did we build the product right?" — conformance to specification.',
          'Validation asks: "Did we build the right product?" — fitness for intended use.',
          'Either team can ask either question. The distinction is the question, not the person.',
          'ISO/IEC/IEEE 29119-1 §4.1.3 defines both. You\'ll also meet the Test Oracle here — §3.115.',
          'Eight missions, 30 seconds each. Route them correctly. Enter the zone.',
        ],
      },
      { id: 'v1', name: 'Priya S.', role: 'Verification Eng.', type: 'worker',
        col: 4, row: 3, facing: 'down', bubble: 'Spec walkthrough...' },
      { id: 'v2', name: 'Hector R.', role: 'Verification Eng.', type: 'worker',
        col: 4, row: 6, facing: 'down', bubble: 'Conformance check...' },
      { id: 'v3', name: 'Anna K.', role: 'Verification Eng.', type: 'worker',
        col: 4, row: 9, facing: 'right', bubble: 'Reviewing docs...' },
      { id: 'val1', name: 'James O.', role: 'Validation Eng.', type: 'worker',
        col: 19, row: 3, facing: 'down', bubble: 'UAT planning...' },
      { id: 'val2', name: 'Fatima N.', role: 'Validation Eng.', type: 'worker',
        col: 19, row: 6, facing: 'left', bubble: 'User feedback...' },
      { id: 'val3', name: 'Carlos B.', role: 'Validation Eng.', type: 'worker',
        col: 19, row: 9, facing: 'down', bubble: 'Prototype test...' },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     ZONE 3 — Test Matrix Tower
     Green theme · Central briefing room + open floor
  ───────────────────────────────────────────────────────────── */
  'matrix-tower': {
    zoneRoute: '/zone/matrix-tower',
    color: 'var(--zone3-color)',
    label: 'Test Matrix Research Hub',
    map: [
      '########################',
      '#B....................B#',
      '#..WWWWWWWWWWWWWWWWW..#',
      '#..W.......C.......W..#',
      '#..W.......D.......W..#',
      '#..W...............W..#',
      '#..W...............W..#',
      '#..WWWWWW.....WWWWWW..#',
      '#......................#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#....P.........P......#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#......................#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'sam',
        name: 'Sam Rivera',
        role: 'Test Architect',
        type: 'main',
        col: 11, row: 4,
        facing: 'down',
        lines: [
          'Welcome to the Matrix Research Hub. That grid on the wall is the core idea.',
          'There are two completely independent axes in ISO test design.',
          'Test LEVEL is WHERE in the lifecycle: Unit, Integration, System, Acceptance.',
          'Test TYPE is WHAT quality characteristic you\'re probing: Functional, Security, Performance, Usability.',
          'The critical insight: these axes are orthogonal. A security test can run at unit, integration, AND system level simultaneously.',
          'ISO/IEC/IEEE 29119-1 §3.130 Note 1 is explicit: "A test type can be performed at a single test level or across several test levels."',
          'Select every valid cell in the 4×4 matrix. Justify each one. Enter the zone.',
        ],
      },
      { id: 'm1', name: 'Yuki T.', role: 'Test Researcher', type: 'worker',
        col: 4, row: 10, facing: 'right', bubble: 'Filling the matrix...' },
      { id: 'm2', name: 'Diego F.', role: 'Test Researcher', type: 'worker',
        col: 18, row: 10, facing: 'left', bubble: 'Level analysis...' },
      { id: 'm3', name: 'Elif A.', role: 'Test Researcher', type: 'worker',
        col: 4, row: 13, facing: 'down', bubble: 'Type mapping...' },
      { id: 'm4', name: 'Kofi B.', role: 'Test Researcher', type: 'worker',
        col: 18, row: 13, facing: 'down', bubble: 'Orthogonality check...' },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     ZONE 4 — Artefact Archive
     Amber theme · Archive hall with shelves
  ───────────────────────────────────────────────────────────── */
  'artefact-archive': {
    zoneRoute: '/zone/artefact-archive',
    color: 'var(--zone4-color)',
    label: 'Artefact Archive — Vault B',
    map: [
      '########################',
      '#BBBBBBBBBBBBBBBBBBBBB#',
      '#......................#',
      '#......................#',
      '#.DDDDDDDDDDDDDDDDDDD.#',
      '#.CCCCCCCCCCCCCCCCCCC.#',
      '#..........C...........#',
      '#.P........D.........P.#',
      '#.DD...............DD.#',
      '#.DC...............DC.#',
      '#......................#',
      '#.DD...............DC.#',
      '#.DC...............DD.#',
      '#......................#',
      '#.BBBBBBBBBBBBBBBBBBB.#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'jordan',
        name: 'Jordan Park',
        role: 'Documentation Chief',
        type: 'main',
        col: 11, row: 6,
        facing: 'down',
        lines: [
          'Welcome to Vault B. This archive contains every artefact for Incident #047.',
          'Your task: tag each artefact with the correct ISO category.',
          'TEST BASIS (§3.84): the information used to design test cases. Does NOT have to be a formal document.',
          'TEST ITEM / TEST OBJECT (§3.107): the thing being tested. Always use BOTH terms — ISO lists them as equivalents.',
          'STATIC TESTING (§3.78): analysis without executing the software — reviews, walkthroughs, inspections.',
          'DYNAMIC TESTING (§3.29): testing by executing the software.',
          'There is one trap artefact. It looks informal — but §3.84 Note 1 says the test basis "may also be an undocumented understanding." Tag it correctly. Enter the zone.',
        ],
      },
      { id: 'a1', name: 'Deniz K.', role: 'Senior Archivist', type: 'worker',
        col: 4, row: 9, facing: 'right', bubble: 'Filing requirements...' },
      { id: 'a2', name: 'Yildiz O.', role: 'Doc Reviewer', type: 'worker',
        col: 18, row: 9, facing: 'left', bubble: 'Reviewing spec...' },
      { id: 'a3', name: 'Emre C.', role: 'Static Tester', type: 'worker',
        col: 4, row: 12, facing: 'down', bubble: 'Code walkthrough...' },
      { id: 'a4', name: 'Naz B.', role: 'Doc Writer', type: 'worker',
        col: 18, row: 12, facing: 'down', bubble: 'Drafting notes...' },
    ],
  },

  /* ─────────────────────────────────────────────────────────────
     ZONE 5 — Final Inspection HQ
     Purple theme · Grand audit chamber
  ───────────────────────────────────────────────────────────── */
  'final-inspection': {
    zoneRoute: '/final-inspection',
    color: 'var(--final-color)',
    label: 'Final Inspection — Audit Chamber',
    map: [
      '########################',
      '#BB..................BB#',
      '#BB..................BB#',
      '#......................#',
      '#..DDDDDDDDDDDDDDDDD..#',
      '#..CCCCCCCCCCCCCCCCC..#',
      '#..CCCCCCCCCCCCCCCCC..#',
      '#..DDDDDDDDDDDDDDDDD..#',
      '#..........C...........#',
      '#....P.....D...P......#',
      '#..BB..................#',
      '#..BB..................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#......................#',
      '#..........X..........#',
      '########################',
    ],
    npcs: [
      {
        id: 'taylor',
        name: 'Taylor Brooks',
        role: 'Chief Auditor',
        type: 'main',
        col: 11, row: 8,
        facing: 'down',
        lines: [
          'You\'ve reached the Final Inspection chamber. This is where it all comes together.',
          'Every decision you made in Zones 1 through 4 is on record.',
          'We\'re adding one final concept: Test Oracle (§3.115) — the mechanism that determines whether a test passed or failed.',
          'Without a defined oracle, you cannot have a verdict. No verdict means no test.',
          'The ISO Incident Report will show five score dimensions. A wrong answer in an earlier zone cascades here.',
          'This is your last chance to apply everything you\'ve learned. Make it count.',
          'Enter the Final Inspection.',
        ],
      },
      { id: 'f1', name: 'Bahar Y.', role: 'Lead Inspector', type: 'worker',
        col: 5, row: 5, facing: 'right', bubble: 'Reviewing Zone 1...' },
      { id: 'f2', name: 'Cem A.', role: 'Score Auditor', type: 'worker',
        col: 18, row: 5, facing: 'left', bubble: 'Calculating scores...' },
      { id: 'f3', name: 'Lale T.', role: 'Cascade Analyst', type: 'worker',
        col: 5, row: 6, facing: 'right', bubble: 'Tracing cascade...' },
      { id: 'f4', name: 'Mert D.', role: 'Oracle Specialist', type: 'worker',
        col: 18, row: 6, facing: 'left', bubble: 'Oracle check §3.115...' },
    ],
  },

};
