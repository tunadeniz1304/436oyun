import { useState } from 'react';
import './RetroVSCode.css';

const FILES = [
  {
    id: 'test_suite',
    name: 'test_suite.py',
    icon: '🐍',
    language: 'python',
    content: `# test_suite.py — ISO/IEC/IEEE 29119-1 Compliant Test Suite
# Author: Senior Test Engineer
# Incident: #047

import unittest

class TestErrorFaultFailure(unittest.TestCase):
    """
    ISO §4.7 — Defect & Incident Management

    IMPORTANT: An error, a fault, and a failure are NOT synonyms.
    Error   → human mistake (developer removes null-check)
    Fault   → code defect that results from the error
    Failure → observable deviation from expected behaviour
    """

    def test_null_check_removed(self):
        # ERROR: Developer removed null-check (§3.39)
        # This human action introduced a FAULT into the code.
        result = process_payment(None)
        # FAILURE: System crashes instead of returning 400
        self.assertEqual(result.status_code, 400)

    def test_incident_report_created(self):
        # §3.40 — Incident Report must reference:
        # 1. What failed (observable behaviour)
        # 2. Expected behaviour
        # 3. Steps to reproduce
        report = create_incident_report(
            actual="NullPointerException at checkout",
            expected="400 Bad Request with error body",
            steps=["Add item to cart", "Proceed with null user"]
        )
        self.assertIsNotNone(report.incident_id)
        self.assertIsNotNone(report.iso_ref)  # must be §3.40


class TestVerificationValidation(unittest.TestCase):
    """
    ISO §4.1.3 — Verification vs Validation

    Verification: "Did we build it RIGHT?" (conforms to spec)
    Validation:   "Did we build the RIGHT thing?" (fits intended use)

    Common misconception: V = developers, V = users. WRONG.
    Either party can perform either activity.
    """

    def test_payment_spec_conformance(self):
        # VERIFICATION: checking against PCI-DSS specification
        # Not about users — about the document.
        conforms = verify_against_spec(module="payment", spec="PCI-DSS-v4")
        self.assertTrue(conforms)

    def test_payment_user_fitness(self):
        # VALIDATION: does this solve the actual user problem?
        user_can_checkout = validate_with_user_scenario(
            scenario="guest_checkout_flow"
        )
        self.assertTrue(user_can_checkout)


class TestOracle(unittest.TestCase):
    """
    ISO §3.115 — Test Oracle

    A test oracle determines whether actual results conform
    to expected results. It is NOT always a human.

    Types: specification-based, existing system, heuristic,
           statistical, user/customer as oracle.
    """

    def test_oracle_determines_pass_fail(self):
        # The oracle is the PCI-DSS spec document itself.
        oracle = SpecificationOracle(doc="PCI-DSS-v4", clause="6.3.1")
        actual_output = run_payment_module()
        verdict = oracle.evaluate(actual_output)
        self.assertEqual(verdict, "PASS")
`,
  },
  {
    id: 'requirements',
    name: 'requirements.txt',
    icon: '📄',
    language: 'text',
    content: `# requirements.txt — Test Environment Dependencies
# ISO §3.84 — Test Basis: this file is part of the test basis.
# §3.84 Note 1: test basis may also be an undocumented understanding.
# (See: verbal_agreement.txt for a controversial example)

unittest2==1.1.0        # extended test framework
coverage==7.4.1         # code coverage measurement
hypothesis==6.99.6      # property-based testing
bandit==1.7.7           # static security analysis (§3.78 Static Testing)
pylint==3.1.0           # static code analysis — NOT dynamic testing
pytest==8.1.1           # test runner

# NOTE: bandit and pylint perform STATIC TESTING (§3.78)
# They analyse without executing the test item.
# pytest performs DYNAMIC TESTING (§3.29) — code must run.
`,
  },
  {
    id: 'incident_report',
    name: 'incident_report.txt',
    icon: '🚨',
    language: 'text',
    content: `INCIDENT REPORT — #047
ISO/IEC/IEEE 29119-1:2022 §3.40 Compliant
===============================================

DATE: 2024-03-14 09:23 UTC
REPORTED BY: QA Lead
STATUS: OPEN

--- INCIDENT (§3.39) ---
Observable Failure: NullPointerException at payment checkout
when user account object is null.

--- CAUSAL CHAIN (§4.7) ---
ERROR   → Developer removed null-check during refactor
          ("Looked redundant" — commit a3f92c1)
FAULT   → Code defect: process_payment() does not guard
          against null user parameter
FAILURE → System throws unhandled exception; user sees 500

--- NOTE ---
These three terms are NOT synonyms. The error (human act)
caused the fault (code flaw) which manifested as a failure
(observable deviation). See ISO §3.39, §4.7.

--- TEST BASIS (§3.84) ---
- PCI-DSS v4 specification (formal document)
- Payment module API contract v2.1 (formal document)
- Verbal agreement with product owner re: guest checkout
  (§3.84 Note 1: undocumented understanding IS valid basis)

--- ASSIGNED TO ---
Test Level: System Testing
Test Type:  Functional + Security
ISO Ref:    §3.108, §3.130, §4.7
`,
  },
  {
    id: 'verbal_agreement',
    name: 'verbal_agreement.txt',
    icon: '💬',
    language: 'text',
    content: `verbal_agreement.txt
====================
Recorded: 2024-03-10, standup meeting

Product Owner: "Guest checkout should work even without
a registered account — just collect email at the end."

Test Engineer: "Got it. So null user object should be
a valid state during the payment flow?"

Product Owner: "Exactly. Don't block on auth."

---
ISO §3.84 — Test Basis
"information used as the basis for designing and
implementing test cases"

NOTE 1: "The test basis may also be an undocumented
understanding of the required behaviour."

This verbal agreement IS a valid test basis under §3.84.
Informal ≠ invalid. The ISO standard explicitly recognises
undocumented understanding as a legitimate source.

→ Test cases for guest checkout MUST be derived from this.
→ Leaving this untagged as test basis is an error.
`,
  },
  {
    id: 'matrix',
    name: 'test_matrix.md',
    icon: '📊',
    language: 'markdown',
    content: `# Test Matrix — Payment Module
## ISO §3.108 (Test Level) × §3.130 (Test Type)

> §3.130 Note 1: A test type can be performed at a single
> test level OR ACROSS SEVERAL TEST LEVELS.

|              | Functional      | Security         | Performance  | Usability       |
|--------------|-----------------|------------------|--------------|-----------------|
| Unit         | ✅ parse()      | ✅ input sanitise | ⬜           | ⬜              |
| Integration  | ✅ API contract | ✅ auth bypass   | ✅ latency   | ⬜              |
| System       | ✅ checkout flow| ✅ pentest       | ✅ load test | ✅ UX review    |
| Acceptance   | ✅ UAT          | ⬜               | ⬜           | ✅ usability study |

## Key Insight
Security testing (column) appears at Unit, Integration, AND
System level. Test LEVEL and test TYPE are independent axes.

Common mistake: "Unit testing = structural/functional only"
ISO reality: Any test type can appear at any test level.
`,
  },
];

const COMMENT_COLOR = '#6a9955';
const KEYWORD_COLOR = '#569cd6';
const STRING_COLOR  = '#ce9178';
const ARROW_COLOR   = '#ce9178';

function highlightLine(line, language) {
  if (language === 'text' || language === 'markdown') {
    if (
      line.trim().startsWith('#') ||
      line.trim().startsWith('---') ||
      line.trim().startsWith('===')
    ) {
      return <span style={{ color: COMMENT_COLOR }}>{line}</span>;
    }
    if (line.trim().startsWith('→') || line.trim().startsWith('✅') || line.trim().startsWith('⬜')) {
      return <span style={{ color: ARROW_COLOR }}>{line}</span>;
    }
    if (line.includes('§')) {
      const parts = line.split(/(§[\d.]+[\w.]*)/g);
      return parts.map((part, i) =>
        /^§/.test(part)
          ? <span key={i} style={{ color: KEYWORD_COLOR }}>{part}</span>
          : part
      );
    }
    return line;
  }

  // Python: only handle comment lines (full-line or trailing comment)
  const commentIdx = line.indexOf('#');
  if (commentIdx !== -1) {
    const code = line.slice(0, commentIdx);
    const comment = line.slice(commentIdx);
    return (
      <>
        {code}
        <span style={{ color: COMMENT_COLOR }}>{comment}</span>
      </>
    );
  }
  return line;
}

/**
 * @param {{ onClose: () => void }} props
 */
export default function RetroVSCode({ onClose }) {
  const [activeFile, setActiveFile] = useState(FILES[0]);
  const [hoveredId, setHoveredId] = useState(null);

  const lines = activeFile.content.split('\n');

  return (
    <div className="rvsc">
      {/* Title bar */}
      <div className="rvsc__titlebar">
        <div className="rvsc__dots">
          <span className="rvsc__dot rvsc__dot--red" onClick={onClose} title="Close" />
          <span className="rvsc__dot rvsc__dot--yellow" />
          <span className="rvsc__dot rvsc__dot--green" />
        </div>
        <span className="rvsc__titlebar-title">
          {activeFile.name} — Visual Studio Code
        </span>
        <div className="rvsc__menu-bar">
          {['File', 'Edit', 'View', 'Run', 'Terminal', 'Help'].map(m => (
            <span key={m} className="rvsc__menu-item">{m}</span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="rvsc__body">
        {/* Activity bar */}
        <div className="rvsc__activitybar">
          <span className="rvsc__activity-icon rvsc__activity-icon--active" title="Explorer">⎇</span>
          <span className="rvsc__activity-icon" title="Search">🔍</span>
          <span className="rvsc__activity-icon" title="Source Control">⌥</span>
          <span className="rvsc__activity-icon" title="Extensions">⊞</span>
        </div>

        {/* Sidebar */}
        <div className="rvsc__sidebar">
          <div className="rvsc__sidebar-header">EXPLORER</div>
          <div className="rvsc__sidebar-folder">▾ INCIDENT_047</div>
          {FILES.map(f => (
            <div
              key={f.id}
              className={[
                'rvsc__sidebar-file',
                activeFile.id === f.id  ? 'rvsc__sidebar-file--active' : '',
                hoveredId === f.id      ? 'rvsc__sidebar-file--hover'  : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setActiveFile(f)}
              onMouseEnter={() => setHoveredId(f.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <span className="rvsc__file-icon">{f.icon}</span>
              <span>{f.name}</span>
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="rvsc__editor">
          {/* Tabs */}
          <div className="rvsc__tabs">
            {FILES.map(f => (
              <div
                key={f.id}
                className={['rvsc__tab', activeFile.id === f.id ? 'rvsc__tab--active' : ''].filter(Boolean).join(' ')}
                onClick={() => setActiveFile(f)}
              >
                <span>{f.icon}</span>
                <span>{f.name}</span>
              </div>
            ))}
          </div>

          {/* Breadcrumb */}
          <div className="rvsc__breadcrumb">
            INCIDENT_047 › {activeFile.name}
          </div>

          {/* Code */}
          <div className="rvsc__code">
            {lines.map((line, i) => (
              <div key={i} className="rvsc__line">
                <span className="rvsc__line-num">{i + 1}</span>
                <span className="rvsc__line-content">
                  {highlightLine(line, activeFile.language)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="rvsc__statusbar">
        <span>⎇ main</span>
        <span>⚠ 0 errors, 0 warnings</span>
        <span>
          {activeFile.language === 'python'   ? 'Python'
           : activeFile.language === 'markdown' ? 'Markdown'
           : 'Plain Text'}
        </span>
        <span>UTF-8</span>
        <span>ISO 29119-1:2022</span>
      </div>
    </div>
  );
}
