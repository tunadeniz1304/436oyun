/**
 * Verbatim definitions from ISO/IEC/IEEE 29119-1:2022 (Second edition).
 * Section 3 entries are quoted verbatim.
 * Section 4 entries are paraphrased single-sentence summaries (the source field
 * marks them explicitly) because §4.x is prose, not a single-line definition.
 *
 * This file is the single source of truth for ISO clause references in the app.
 * Never inline an ISO definition in JSX — always source from here.
 */

export const isoDefinitions = {
  '§3.29': {
    term: 'dynamic testing',
    definition: 'testing in which a test item is evaluated by executing it',
    note: null,
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.29',
  },

  '§3.39': {
    term: 'incident',
    definition:
      'anomalous or unexpected event, set of events, condition, or situation at any time during the life cycle of a project, product, service, or system',
    note: null,
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.39',
  },

  '§3.40': {
    term: 'incident report',
    definition: 'documentation of the occurrence, nature, and status of an incident',
    note:
      'Incident reports are also known as anomaly reports, bug reports, defect reports, error reports, issues, problem reports and trouble reports, amongst other terms.',
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.40',
  },

  '§3.78': {
    term: 'static testing',
    definition:
      'testing in which a test item is examined against a set of quality or other criteria without the test item being executed',
    note: 'Examples include reviews and static analysis.',
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.78',
  },

  '§3.84': {
    term: 'test basis',
    definition:
      'information used as the basis for designing and implementing test cases',
    note:
      'The test basis may take the form of documentation, such as a requirements specification, design specification, or module specification, but may also be an undocumented understanding of the required behaviour.',
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.84',
  },

  '§3.107': {
    term: 'test item / test object',
    definition: 'work product to be tested',
    note:
      'Examples: software component, system, requirements document, design specification, user guide. The terms "test item" and "test object" are interchangeable in this standard.',
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.107',
  },

  '§3.108': {
    term: 'test level',
    definition:
      'one of a sequence of test stages each of which is typically associated with the achievement of particular objectives and used to treat particular risks',
    note:
      'Common test levels, listed sequentially: unit/component testing, integration testing, system testing, system integration testing, acceptance testing.',
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.108',
  },

  '§3.115': {
    term: 'test oracle',
    definition:
      'source of information for determining whether a test has passed or failed',
    note:
      'The test oracle is often a specification used to generate expected results for individual test cases, but other sources may be used, such as comparing actual results with those of another similar program or system or asking a human expert.',
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.115',
  },

  '§3.130': {
    term: 'test type',
    definition: 'testing that is focused on specific quality characteristics',
    note:
      'A test type can be performed at a single test level or across several test levels (e.g. performance testing performed at a unit test level and at a system test level).',
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.130',
  },

  '§3.130 Note 1': {
    term: 'test type — Note 1 to entry',
    definition:
      'A test type can be performed at a single test level or across several test levels (e.g. performance testing performed at a unit test level and at a system test level).',
    note: null,
    source: 'ISO/IEC/IEEE 29119-1:2022 §3.130 Note 1 to entry',
  },

  '§4.1.3': {
    term: 'verification and validation',
    definition:
      'Verification focuses on the conformance of a test item with specifications, specified requirements, or other documents, while validation focuses on the acceptability of the test item to meet the needs of the stakeholders, when used as intended.',
    note:
      'Verification and validation are separate processes which both employ testing as one of their principal practices. Either party — developer or user — may carry out either process; the distinction is the question being asked, not the role.',
    source: 'ISO/IEC/IEEE 29119-1:2022 §4.1.3',
  },

  '§4.1.5': {
    term: 'static and dynamic testing',
    definition:
      'Static testing is evaluation of a test item where no execution of the code takes place; dynamic testing involves executing code and running test cases.',
    note:
      'Static testing can take the form of documentation review or source-code review and can be performed anywhere in the life cycle. Dynamic testing can only occur in parts of the life cycle when executable code is available.',
    source: 'ISO/IEC/IEEE 29119-1:2022 §4.1.5',
  },

  '§4.1.10': {
    term: 'test oracle (elaboration)',
    definition:
      'A test oracle is a source of information used to determine whether a test has passed or failed. A test oracle may be, but is not limited to: a requirements or design specification; another similar system; a human expert or group of experts.',
    note: null,
    source: 'ISO/IEC/IEEE 29119-1:2022 §4.1.10',
  },

  '§4.2.4.2': {
    term: 'test levels (in the test strategy)',
    definition:
      'Testing for a project is performed at various distinct stages of the life cycle, typically referred to as test levels — commonly unit testing, integration testing, system testing, and acceptance testing.',
    note:
      'Test levels may be associated with both static and dynamic testing and are closely related to development activities.',
    source: 'paraphrase of ISO/IEC/IEEE 29119-1:2022 §4.2.4.2',
  },

  '§4.2.4.3': {
    term: 'types of testing',
    definition:
      'Test types are categories of testing focused on specific quality characteristics — e.g. functional, security, performance, usability — and are independent of the test level at which they are performed.',
    note: null,
    source: 'paraphrase of ISO/IEC/IEEE 29119-1:2022 §4.2.4.3',
  },

  '§4.2.4.5': {
    term: 'test practices',
    definition:
      'A variety of test practices can be implemented as part of a test strategy; common practices include exploratory testing, scripted testing, and risk-based testing, among others.',
    note:
      'Test practices form a third axis in the standard alongside test levels and test types but are detailed in Part 2 normative content.',
    source: 'paraphrase of ISO/IEC/IEEE 29119-1:2022 §4.2.4.5',
  },

  '§4.7': {
    term: 'defects and incident management',
    definition:
      'A test result that differs from predicted behaviour is regarded as an incident to be recorded, investigated, and possibly resolved; failed tests, as indications of possible defects, are investigated systematically to determine whether the defects are in the system under test or in the tests themselves.',
    note:
      'Defects can be found by dynamic and static testing as well as by other activities such as analysis or verification and validation.',
    source: 'paraphrase of ISO/IEC/IEEE 29119-1:2022 §4.7',
  },
};

/**
 * Convenience accessor: returns the definition or a fallback shape if the
 * clause is not registered. Always trace the cause when this fallback fires
 * (it indicates a missing entry, not a runtime issue).
 */
export function getISODefinition(clauseRef) {
  const def = isoDefinitions[clauseRef];
  if (!def) {
    if (import.meta.env.DEV) {
      console.warn(`[iso-definitions] Missing entry for ${clauseRef}`);
    }
    return {
      term: clauseRef,
      definition: 'Definition not registered.',
      note: null,
      source: clauseRef,
    };
  }
  return def;
}
