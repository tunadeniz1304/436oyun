/**
 * Fake "Internet Explorer" page content for the retro desktop feature.
 * Each page is a stand-alone educational article about ISO/IEC/IEEE 29119-1:2022 concepts.
 * isoCallout values must be exact keys present in iso-definitions.js.
 */

/** @typedef {{ toId: string, label: string }} PageLink */
/**
 * @typedef {{
 *   heading: string,
 *   paragraphs: string[],
 *   isoCallout: string|null,
 *   links: PageLink[]
 * }} PageSection
 */
/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   lede: string,
 *   sections: PageSection[]
 * }} BrowserPage
 */

/** @type {Object.<string, BrowserPage>} */
export const browserPages = {
  index: {
    id: 'index',
    title: 'OPUS Corp Intranet — ISO Research Portal',
    lede:
      'Welcome to the OPUS Corp internal knowledge base for ISO/IEC/IEEE 29119-1:2022. ' +
      'This portal consolidates key definitions and guidance to support our ongoing testing standards initiative.',
    sections: [
      {
        heading: 'Research Topics',
        paragraphs: [
          'Use the links below to explore specific concept areas covered by the standard. ' +
            'Each article includes plain-language explanations alongside the normative clause references.',
          'All content is drawn directly from ISO/IEC/IEEE 29119-1:2022 (Second edition). ' +
            'For binding interpretations, refer to the official standard document.',
        ],
        isoCallout: null,
        links: [
          { toId: 'incident', label: 'Incidents & Defect Management (§3.39, §3.40, §4.7)' },
          { toId: 'test-basis', label: 'Test Basis & Test Items (§3.84, §3.107)' },
          { toId: 'oracle', label: 'Test Oracle (§3.115, §4.1.10)' },
          { toId: 'vv', label: 'Verification, Validation & Testing Methods (§4.1.3, §4.1.5)' },
        ],
      },
    ],
  },

  incident: {
    id: 'incident',
    title: 'Incidents & Defect Management — ISO 29119-1 §3.39 / §3.40 / §4.7',
    lede:
      'Understanding the precise meaning of "incident" is essential for disciplined defect management. ' +
      'This article explains how ISO 29119-1 distinguishes incidents from defects and from the reports that document them.',
    sections: [
      {
        heading: 'What Is an Incident? (§3.39)',
        paragraphs: [
          'An incident is any anomalous or unexpected event, condition, or situation that occurs at any point during the life cycle of a project, product, service, or system. ' +
            'The term is deliberately broad: it covers a test failure, an unexpected log entry, or an observed deviation from expected behaviour.',
          'Incidents are not limited to code defects. A requirement that turns out to be ambiguous, a build that takes three times longer than expected, or a configuration mismatch discovered during integration are all incidents under the standard.',
          'The key practical implication is that every unexpected observation during testing should be captured — even if the tester suspects it is a test-environment issue rather than a product defect. ' +
            'That determination comes later, during investigation.',
        ],
        isoCallout: '§3.39',
        links: [],
      },
      {
        heading: 'Incident Reports and Defect Management (§3.40, §4.7)',
        paragraphs: [
          'An incident report is the formal documentation of the occurrence, nature, and status of an incident. ' +
            'ISO 29119-1 §3.40 notes that incident reports go by many names in practice — bug reports, defect reports, anomaly reports, trouble reports — but they all serve the same normative purpose.',
          'The defect and incident management process described in §4.7 treats any test result that differs from predicted behaviour as an incident to be recorded, investigated, and resolved. ' +
            'This process applies the same discipline to defects found through dynamic testing, static analysis, and reviews.',
          'A common mistake is conflating the incident (the observed anomaly) with the defect (the underlying fault in the product) and with the failure (the observable deviation from expected behaviour). ' +
            'ISO 29119-1 keeps these concepts distinct: the error is a human action, the fault/defect is the resulting flaw in the artefact, and the failure is the observable consequence during execution.',
        ],
        isoCallout: '§4.7',
        links: [],
      },
    ],
  },

  'test-basis': {
    id: 'test-basis',
    title: 'Test Basis & Test Items — ISO 29119-1 §3.84 / §3.107',
    lede:
      'The test basis defines what testers use to derive test cases, while test items are the work products being tested. ' +
      'Both concepts are broader than most practitioners expect.',
    sections: [
      {
        heading: 'Test Basis (§3.84)',
        paragraphs: [
          'The test basis is the information used as the foundation for designing and implementing test cases. ' +
            'Most engineers think immediately of formal requirements documents or design specifications — and those are certainly valid test bases.',
          'However, §3.84 explicitly acknowledges that the test basis "may also be an undocumented understanding of the required behaviour." ' +
            'This means a verbal agreement between a product owner and a developer, or a shared team convention, qualifies as a test basis even when nothing is written down.',
          'The practical implication is significant: testers should identify and document what they are using as the test basis for each test case, even when that basis is informal. ' +
            'Relying on an undocumented basis introduces risk because the expected behaviour cannot be verified by a third party.',
        ],
        isoCallout: '§3.84',
        links: [],
      },
      {
        heading: 'Test Item / Test Object (§3.107)',
        paragraphs: [
          'A test item — also called a test object — is any work product that is to be tested. ' +
            'The standard uses both terms interchangeably, which is why the recommended UI label is always "Test Item / Test Object" to avoid inadvertently privileging one term.',
          'Test items are not limited to executable software. A requirements document, a design specification, or a user guide can each be a test item when it is being evaluated through static testing techniques such as review or inspection.',
          'Distinguishing the test item from the test basis matters in practice. ' +
            'The test basis is the reference used to judge the item; the test item is the artefact being judged. ' +
            'A requirements specification can simultaneously be the test basis for a system test and the test item for a requirements review.',
        ],
        isoCallout: '§3.107',
        links: [],
      },
    ],
  },

  oracle: {
    id: 'oracle',
    title: 'Test Oracle — ISO 29119-1 §3.115 / §4.1.10',
    lede:
      'A test oracle is the source of truth used to decide whether a test has passed or failed. ' +
      'Understanding what qualifies as an oracle is critical to designing sound test cases.',
    sections: [
      {
        heading: 'Defining the Test Oracle (§3.115)',
        paragraphs: [
          'ISO 29119-1 §3.115 defines a test oracle as any source of information used to determine whether a test has passed or failed. ' +
            'The most common oracle is a written specification: the tester compares the actual output to the expected output derived from the spec.',
          'But oracles are not limited to written specifications. The standard notes that oracles may include comparison against a similar or reference system, or consultation with a human expert or group of experts. ' +
            'In exploratory testing, the tester\'s own informed judgement can serve as the oracle.',
          'The oracle problem — the difficulty of determining the correct expected result for any given input — is one of the fundamental challenges in testing. ' +
            'Recognising this explicitly helps testers avoid the false assumption that testing is simply "run the code and see if it crashes."',
        ],
        isoCallout: '§3.115',
        links: [],
      },
      {
        heading: 'Oracle Elaboration in Practice (§4.1.10)',
        paragraphs: [
          'Section 4.1.10 elaborates on how test oracles are used in practice. ' +
            'An oracle may be, but is not limited to: a requirements or design specification, another system whose behaviour is known to be correct, or a human expert.',
          'When no written oracle exists, the tester must document the expected result explicitly before running the test — otherwise there is no objective basis for the pass/fail decision. ' +
            'Teams that skip this step often find themselves debugging results rather than testing against a defined criterion.',
          'Oracle selection directly affects test effectiveness. A weak oracle (one that is ambiguous or incomplete) can cause real failures to be missed or can generate false failures that waste investigation time. ' +
            'Investing in clear, authoritative oracles before test execution is a recognised good practice under §4.1.10.',
        ],
        isoCallout: '§4.1.10',
        links: [],
      },
    ],
  },

  vv: {
    id: 'vv',
    title: 'Verification, Validation & Testing Methods — ISO 29119-1 §4.1.3 / §4.1.5',
    lede:
      'Verification and validation are two distinct processes that both use testing as a primary technique. ' +
      'Static and dynamic testing are the two fundamental methods applicable to both.',
    sections: [
      {
        heading: 'Verification vs. Validation (§4.1.3)',
        paragraphs: [
          'Verification asks: "Did we build the product right?" It focuses on whether the test item conforms to its specifications, requirements, or other governing documents. ' +
            'Validation asks: "Did we build the right product?" It focuses on whether the test item meets the actual needs of the stakeholders when used as intended.',
          'A critical misconception is that verification belongs to developers and validation belongs to users. ' +
            'ISO 29119-1 §4.1.3 is explicit that either party may carry out either process; the distinction is the question being asked, not the organisational role performing the activity.',
          'In practice, both processes can overlap. A single test session might include verification steps (checking conformance to a written requirement) and validation steps (confirming that the requirement, even if implemented correctly, actually satisfies the user\'s need). ' +
            'Teams should be clear about which question they are answering at each stage.',
        ],
        isoCallout: '§4.1.3',
        links: [],
      },
      {
        heading: 'Static and Dynamic Testing (§4.1.5)',
        paragraphs: [
          'Static testing evaluates a test item without executing it. ' +
            'Examples include document reviews, requirements inspections, code walkthroughs, and static analysis tools that scan source code for patterns. ' +
            'Static testing can be applied at any point in the life cycle where an artefact exists — even before any executable code has been written.',
          'Dynamic testing evaluates a test item by executing it and observing the actual outputs. ' +
            'Dynamic testing can only occur when executable code is available, but it provides direct evidence of runtime behaviour that static techniques cannot replicate.',
          'A common mistake is treating static analysis as a "code quality" activity separate from testing. ' +
            'ISO 29119-1 §3.78 and §4.1.5 are unambiguous: static testing is a legitimate testing activity, and its findings should be handled through the same incident reporting and defect management process as dynamic test failures.',
        ],
        isoCallout: '§4.1.5',
        links: [],
      },
    ],
  },
};
