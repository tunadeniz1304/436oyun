/**
 * Fake "My Documents" folder content for the retro desktop feature.
 * Each entry represents a PDF-like document the player can open and read.
 * isoRefs values must be exact keys present in iso-definitions.js.
 */

/**
 * @typedef {{ heading: string, paragraphs: string[] }} DocPage
 */
/**
 * @typedef {{
 *   id: string,
 *   filename: string,
 *   icon: string,
 *   isoRefs: string[],
 *   pages: DocPage[]
 * }} DesktopDocument
 */

/** @type {DesktopDocument[]} */
export const desktopDocuments = [
  {
    id: 'incident-guide',
    filename: 'ReadMe — Incident Reporting (§3.40).pdf',
    icon: '📄',
    isoRefs: ['§3.39', '§3.40', '§4.7'],
    pages: [
      {
        heading: 'What Counts as an Incident?',
        paragraphs: [
          'ISO 29119-1 §3.39 defines an incident as any anomalous or unexpected event, condition, or situation that arises at any point during the life cycle of a project, product, service, or system. ' +
            'The definition is intentionally wide: a test failure, an unexpected warning in a log, an environment behaving differently from its specification — all qualify.',
          'Testers often underreport incidents because they assume an observation only matters if it points to a code defect. ' +
            'The standard takes the opposite view: log every anomaly first, investigate its cause later. ' +
            'This discipline ensures that patterns across multiple small incidents are not lost.',
          'The term "incident" does not imply severity. A minor cosmetic rendering difference is an incident just as much as a system crash. ' +
            'Classification and prioritisation happen after logging, not before.',
        ],
      },
      {
        heading: 'Writing a Compliant Incident Report (§3.40)',
        paragraphs: [
          'An incident report is the formal documentation of the occurrence, nature, and status of an incident (ISO 29119-1 §3.40). ' +
            'At minimum a report must capture: when the incident occurred, what was observed, the environment and configuration, and the steps to reproduce.',
          'The standard notes that incident reports are known by many names in industry — bug reports, defect reports, anomaly reports, trouble reports, problem reports, issue tickets. ' +
            'All of these are incident reports in the sense of §3.40 regardless of which tool or template is used.',
          'Status tracking is a required component. An incident report that is created but never updated is incomplete. ' +
            'The lifecycle states typically include: new, under investigation, confirmed, fixed, verified closed, and deferred.',
        ],
      },
      {
        heading: 'Defect & Incident Management Process (§4.7)',
        paragraphs: [
          'Section 4.7 describes the overall management process: any test result that differs from predicted behaviour is treated as an incident, recorded through an incident report, and then investigated to determine whether the root cause lies in the system under test or in the test itself.',
          'Defects can surface through both dynamic testing (executing the system and observing failures) and static testing (reviewing artefacts without execution). ' +
            'Both routes feed into the same incident management workflow — the discovery method does not change the process.',
          'The process creates an audit trail that connects each observed incident back through the investigation, to the root-cause defect or fault, and finally to the corrective action taken. ' +
            'That traceability is what distinguishes professional defect management from informal "fix-and-forget" practices.',
        ],
      },
    ],
  },

  {
    id: 'test-basis-ref',
    filename: 'Test Basis Quick Reference (§3.84).pdf',
    icon: '📄',
    isoRefs: ['§3.84', '§3.107'],
    pages: [
      {
        heading: 'The Test Basis: More Than a Requirements Doc',
        paragraphs: [
          'ISO 29119-1 §3.84 defines the test basis as the information used as the foundation for designing and implementing test cases. ' +
            'Most engineers think immediately of a formal requirements specification, and that is indeed a valid test basis — but it is not the only kind.',
          'The standard explicitly states that the test basis "may also be an undocumented understanding of the required behaviour." ' +
            'A verbal agreement between a product owner and the development team, an email thread that clarified expected behaviour, or a well-understood business rule that was never written down all qualify.',
          'The implication for test design is that testers should always identify and document what they are using as the test basis before writing test cases. ' +
            'When the basis is informal, capturing it — even as a brief note attached to the test — reduces ambiguity during review and re-execution.',
        ],
      },
      {
        heading: 'Test Item / Test Object (§3.107)',
        paragraphs: [
          'A test item (also called a test object) is any work product that is to be tested, as defined in ISO 29119-1 §3.107. ' +
            'The two terms are interchangeable in the standard; always write "Test Item / Test Object" in documentation to acknowledge both.',
          'Test items are not limited to executable software. A requirements document undergoing a structured review is being tested — it is the test item for that static testing activity, and the review criteria serve as the test basis.',
          'Knowing the distinction between test basis and test item is practically important. ' +
            'The same document can be both: a design specification might serve as the test basis for a system integration test while simultaneously being the test item for a design review. ' +
            'Context determines the role.',
        ],
      },
    ],
  },

  {
    id: 'static-dynamic',
    filename: 'Static vs Dynamic Testing (§3.78, §3.29).pdf',
    icon: '📋',
    isoRefs: ['§3.78', '§3.29', '§4.1.5'],
    pages: [
      {
        heading: 'Static Testing: Testing Without Execution (§3.78)',
        paragraphs: [
          'Static testing is defined in ISO 29119-1 §3.78 as testing in which a test item is examined against quality or other criteria without the test item being executed. ' +
            'Examples include peer reviews, inspections, walkthroughs, and automated static analysis tools.',
          'A persistent misconception is that static analysis is a "code quality" or "linting" activity that sits outside the testing discipline. ' +
            'The standard is unambiguous: static testing is testing, and its results should be handled through formal incident reporting and defect management.',
          'Static testing can be applied at any life-cycle stage where an artefact exists. ' +
            'Reviewing a requirements specification before any code is written is static testing of the requirements document. ' +
            'This early application is one of the most cost-effective ways to find defects because correction costs are lowest at the requirements stage.',
        ],
      },
      {
        heading: 'Dynamic Testing: Testing Through Execution (§3.29)',
        paragraphs: [
          'Dynamic testing is defined in ISO 29119-1 §3.29 as testing in which a test item is evaluated by executing it. ' +
            'The defining characteristic is execution: actual inputs are provided, the system runs, and actual outputs are captured and compared against expected results.',
          'Dynamic testing can only be performed when executable code (or a simulated equivalent) is available. ' +
            'This makes it a later-lifecycle activity compared to static testing, though both may continue in parallel once a build exists.',
          'The need for an explicit test oracle is most visible in dynamic testing. ' +
            'Before executing a test, the tester must know what the correct output should be — otherwise there is no principled basis for declaring a pass or fail. ' +
            'This is why oracle identification is a prerequisite step in dynamic test design.',
        ],
      },
      {
        heading: 'Using Both Methods Together (§4.1.5)',
        paragraphs: [
          'ISO 29119-1 §4.1.5 frames static and dynamic testing as complementary rather than competing approaches. ' +
            'Each method finds different categories of defect; relying on only one leaves gaps in coverage.',
          'Static testing excels at finding ambiguities in requirements, design errors that would be expensive to discover at runtime, and structural code problems. ' +
            'Dynamic testing excels at finding integration failures, performance issues, and runtime behaviours that emerge only when components interact under real conditions.',
          'A mature test strategy allocates effort to both methods and ensures that findings from each feed into the same defect management process. ' +
            'The label "static" or "dynamic" on a defect record is informational, not a signal that the defect should be handled differently.',
        ],
      },
    ],
  },

  {
    id: 'vv-cheatsheet',
    filename: 'Verification & Validation Cheatsheet (§4.1.3).pdf',
    icon: '📋',
    isoRefs: ['§4.1.3'],
    pages: [
      {
        heading: 'The Core Distinction',
        paragraphs: [
          'Verification asks: "Did we build the product right?" It checks whether the test item conforms to its specifications, requirements documents, or other normative references. ' +
            'The benchmark is the specification, not the user.',
          'Validation asks: "Did we build the right product?" It checks whether the test item meets the actual needs and expectations of stakeholders when the product is used as intended. ' +
            'The benchmark is fitness for purpose, not conformance to a document.',
          'Both definitions come from ISO 29119-1 §4.1.3. ' +
            'The practical value of the distinction is that a product can fully pass verification (every requirement is implemented correctly) and still fail validation (the requirements themselves were wrong or incomplete).',
        ],
      },
      {
        heading: 'Who Does What?',
        paragraphs: [
          'A common mistake is assuming verification belongs exclusively to the development team and validation belongs exclusively to end users or customers. ' +
            'ISO 29119-1 §4.1.3 explicitly states that either party may carry out either process.',
          'A developer performing a code review against a design specification is doing verification. ' +
            'A tester running user-scenario tests to confirm that the feature meets business goals is doing validation. ' +
            'Both activities can occur within the same team, on the same build, in the same sprint.',
          'The question to ask before any test activity is: "Which question am I answering — does it conform to spec, or does it meet the real need?" ' +
            'Keeping that question explicit helps teams avoid investing effort in the wrong type of testing for the risk they are trying to address.',
        ],
      },
      {
        heading: 'Overlap and the "Both" Case',
        paragraphs: [
          'Some test activities genuinely serve both verification and validation purposes simultaneously. ' +
            'An acceptance test suite may confirm conformance to a contract (verification) while also confirming that the delivered system supports the user\'s actual workflow (validation).',
          'When a test activity qualifies as "both," the tester should articulate the rationale rather than defaulting to the label out of convenience. ' +
            'Being forced to justify the classification reinforces precise understanding of the two concepts.',
          'Tracking which test cases serve verification versus validation objectives also helps during gap analysis. ' +
            'If all tests are verification-focused, the team may have insufficient evidence that the product will satisfy real stakeholder needs — a risk that often surfaces only after delivery.',
        ],
      },
    ],
  },

  {
    id: 'oracle-primer',
    filename: 'Test Oracle Primer (§3.115).pdf',
    icon: '📄',
    isoRefs: ['§3.115', '§4.1.10'],
    pages: [
      {
        heading: 'What Is a Test Oracle?',
        paragraphs: [
          'A test oracle is any source of information used to determine whether a test has passed or failed (ISO 29119-1 §3.115). ' +
            'Without an oracle, a tester has no objective basis for evaluating the test result — the activity is observation, not testing.',
          'The most familiar oracle is a written specification: the expected output is derived from the spec, and the actual output is compared against it. ' +
            'But oracles can also include a reference system whose behaviour is known to be correct, the output of a previous version of the system, or the judgement of a domain expert.',
          'The "oracle problem" — the difficulty of determining the correct expected result for an arbitrary input — is one of the fundamental unsolved challenges in testing. ' +
            'Acknowledging it is the first step toward investing appropriately in oracle quality rather than assuming it is trivial.',
        ],
      },
      {
        heading: 'Oracle Types in Practice (§4.1.10)',
        paragraphs: [
          'ISO 29119-1 §4.1.10 lists several practical oracle types: a requirements or design specification, a reference implementation (another system known to be correct), a mathematical model, or a human expert or panel. ' +
            'None of these is inherently superior; the appropriate oracle depends on the context and what information is available.',
          'A specification-based oracle is the most auditable: the expected result is derived from a written document that a third party can inspect. ' +
            'A human-expert oracle is the most flexible: experts can handle novel inputs that no specification anticipated. ' +
            'In practice, test suites often combine both.',
          'Before any dynamic test is executed, the expected result must be recorded — not inferred after the fact. ' +
            'Post-hoc oracle construction (deciding the result "looks right" after seeing it) introduces confirmation bias and undermines the evidential value of the test.',
        ],
      },
      {
        heading: 'Oracle Quality and Test Confidence',
        paragraphs: [
          'Oracle quality directly determines the reliability of test results. ' +
            'An ambiguous oracle that can be interpreted in multiple ways will produce inconsistent pass/fail decisions across testers or test runs. ' +
            'A precise, unambiguous oracle eliminates that variability.',
          'Incomplete oracles are a common source of missed failures. ' +
            'If the oracle only checks the primary output and ignores side effects (log entries, database state, downstream system calls), defects in those areas will not be detected even when the main output is correct.',
          'Investing in oracle definition before test execution — reviewing it for completeness, ambiguity, and coverage — is one of the highest-leverage activities in a test process. ' +
            'A well-defined oracle makes the entire test suite more valuable without requiring a single additional test case.',
        ],
      },
    ],
  },
];
