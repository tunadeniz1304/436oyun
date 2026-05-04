# Zone 3 Test Strategy Matrix Design

**Status:** Design proposal  
**Date:** 2026-05-04  
**Scope:** Replace the current "find the exact answer key" Zone 3 logic with a more ISO-aligned strategy-defense game.  
**Primary concept cluster:** Test Level, Test Type, Test Strategy, Test Coverage, Test Model, Test Basis traceability.

## Goal

Zone 3 should teach that test levels and test types are independent strategy choices, not fixed labels. The player should not be rewarded only for guessing a hidden exact cell set. The player should be rewarded for building and defending a test strategy matrix using evidence from the scenario.

The new Zone 3 game should answer this learning question:

> Given a test situation, can the player choose appropriate level/type combinations and justify each selected cell using ISO concepts such as test item, test objective, risk, test basis, test model, and coverage?

## Why The Current Logic Feels Wrong

The current Zone 3 data model defines one exact `correctCells` list per scenario. The evaluation checks whether the selected matrix cells exactly match that list. This is simple and playable, but it creates a pedagogical problem:

- ISO 29119-1 frames levels and types as strategy choices selected to meet objectives and treat risks.
- A matrix is useful as a teaching canvas, but "matrix" itself is not the main ISO concept.
- A different selection can be reasonable if it is supported by the scenario evidence.
- The current game can mark a player wrong because their interpretation differs from the answer key, not because their ISO reasoning is weak.

The new design keeps the matrix, but changes the core task from "guess the exact cells" to "defend a coherent strategy."

## ISO Basis

The design should stay grounded in these ISO 29119-1 areas:

- `Section 3.108 Test Level`: levels are staged testing contexts with objectives and risks.
- `Section 3.130 Test Type`: types focus on quality characteristics and can occur at one or more levels.
- `Section 3.117 Test Plan`: plans can be organized around test levels or test types.
- `Section 3.127 Test Strategy`: strategy describes selected levels, types, techniques, completion criteria, data, environments, and deliverables.
- `Section 3.111 Test Model`: a representation of the test item that focuses testing on characteristics or qualities.
- `Section 3.89` and `Section 3.90 Test Coverage / Coverage Item`: coverage should be explicit, not guessed.
- `Section 3.85 Test Case`: cases are implementation documentation for the relevant level or type.
- `Section 4.2.4.2` and `Section 4.2.4.3`: levels and types are separate categories of test approaches.
- `Section 4.2.4.5 Test Practices`: acknowledged as a possible third axis, but not implemented in Zone 3.
- `Section 4.3.2.4.2 Test Specification`: traceability from test cases back to the test basis supports coverage and rerun selection.
- `Section 4.4.1 Test Model`: test basis informs the model, the model identifies coverage items, and coverage items generate test cases.

No long ISO text should be copied into the new document or UI. UI definitions should continue to come from `src/data/iso-definitions.js`.

## Design Direction

Recommended approach: **Test Strategy Matrix Defense**.

The player receives an incident/testing brief. They select cells on the Level x Type matrix. For every selected cell, they must attach a short structured defense:

- What is the test item?
- What is the test objective?
- Which risk or quality concern is being treated?
- Which scenario evidence supports this cell?
- What coverage item or model focus does this cell address?

The system then evaluates whether the matrix is supported by evidence and whether important strategy targets are left uncovered.

This preserves the existing matrix identity while making the player's ISO reasoning visible.

## Alternative Approaches Considered

### Option 1: Flexible Answer Key

Keep the current matrix and allow multiple accepted cell sets per scenario.

**Pros:** Smallest implementation change.  
**Cons:** Still hides the reasoning. The player can pass by guessing cells without understanding why they are valid.

### Option 2: Test Strategy Matrix Defense

Keep the 4x4 matrix, but require a defense for each selected cell.

**Pros:** Best fit for Zone 3. Keeps the current visual identity and directly teaches level/type independence.  
**Cons:** Needs a richer scenario data model and a defense panel.

### Option 3: Full Traceability/Coverage Puzzle

Turn Zone 3 into a larger flow from test basis to model, coverage item, test case, and procedure.

**Pros:** Very ISO-aligned.  
**Cons:** Too much scope for one zone and overlaps with Zone 4 and Final Inspection.

**Decision:** Use Option 2. Borrow traceability and coverage ideas only as justification fields, not as a full separate puzzle.

## Core Player Loop

1. **Read the test brief**
   - The brief describes a product change, incident, or quality concern.
   - Important evidence phrases are shown as selectable chips, for example "parser unit", "auth service integration", "running system", "real users", "p95 latency", "header injection".

2. **Select matrix cells**
   - Rows remain test levels: Unit, Integration, System, Acceptance.
   - Columns remain test types: Functional, Security, Performance, Usability.
   - The player can select one or more cells.

3. **Defend each selected cell**
   - Selecting a cell creates a strategy card in a side panel.
   - The player fills the card using structured chips/dropdowns, not arbitrary prose.
   - Required fields:
     - Test Item
     - Objective
     - Risk / Quality Concern
     - Evidence From Brief
     - Coverage Focus

4. **Review coverage**
   - A small coverage meter shows whether the strategy addresses the scenario's explicit risks/objectives.
   - The meter does not reveal the hidden answer directly.
   - It can say "1 risk untreated" or "unsupported cell present".

5. **Submit matrix defense**
   - The system scores the strategy.
   - Feedback is based on missing coverage, unsupported cells, or weak justification.

6. **Learn from review**
   - The review screen explains:
     - Accepted cells
     - Unsupported cells
     - Missing coverage
     - ISO concept involved
   - Wrong or partial answers still open the ISO feedback modal.

## Screen Structure

### Left Panel: Scenario Brief

Contains:

- Mission number and title.
- Incident/testing brief.
- Evidence chips extracted from the brief.
- Optional misconception prompt, for example: "Do not assume performance only happens at system level."

The player should be able to click evidence chips and reuse them in a defense card.

### Center Panel: Level x Type Matrix

Keeps the current 4x4 grid:

- Rows: Unit, Integration, System, Acceptance.
- Columns: Functional, Security, Performance, Usability.
- Cells can be selected/deselected.
- Selected cells show a checkmark and have an associated defense status:
  - Missing defense
  - Partially defended
  - Defended
  - Unsupported

### Right Panel: Strategy Defense Stack

For each selected cell, show a compact card:

- Header: `Unit x Security`, `System x Performance`, etc.
- Test Item selector.
- Objective selector.
- Risk / Quality Concern selector.
- Evidence selector.
- Coverage Focus selector.
- Optional one-line note field for reflection only.

The note field is not scored. It is there for classroom discussion and final report flavor.

### Bottom Bar: Submit And Coverage Summary

Shows:

- Number of selected cells.
- Number of defended cells.
- Number of scenario objectives covered.
- Submit button.

Submit is disabled until every selected cell has at least a minimal defense.

## Data Model Concept

The future implementation should move away from one rigid `correctCells` list. A scenario should define strategy targets and evidence.

Conceptual shape:

```js
{
  id: 'z3-strategy-1',
  title: 'Header injection login bypass',
  brief: '...',
  evidence: [
    { id: 'parser-unit', label: 'parser unit', supportsLevels: ['unit'] },
    { id: 'auth-service', label: 'auth service integration', supportsLevels: ['integration'] },
    { id: 'running-system', label: 'end-to-end running system', supportsLevels: ['system'] },
    { id: 'header-injection', label: 'header injection vulnerability', supportsTypes: ['security'] }
  ],
  targets: [
    {
      cell: { level: 'unit', type: 'security' },
      required: true,
      testItem: 'parser unit',
      objective: 'block malformed header parsing',
      risk: 'login bypass',
      coverageFocus: 'header injection branch',
      evidenceIds: ['parser-unit', 'header-injection']
    }
  ],
  unsupportedCells: [
    {
      cell: { level: 'acceptance', type: 'security' },
      reason: 'No stakeholder sign-off or acceptance-context evidence is present in this brief.'
    }
  ]
}
```

The exact schema can be simplified during implementation, but the important shift is:

- From: "this exact set is correct"
- To: "these targets must be covered, and selected cells must be defensible"

## Evaluation Model

Each scenario can still be worth 50 points. The scoring should reflect reasoning quality:

- **Coverage of required strategy targets: 20 points**
  - Did the player cover the scenario's explicit objectives and risks?
  - Partial credit for covering some required targets.

- **ISO-consistent defense: 20 points**
  - Does each selected cell have a matching test item, objective, risk/quality concern, evidence, and coverage focus?
  - A cell without evidence should not receive full credit.

- **Strategy economy: 10 points**
  - Did the player avoid unsupported "test everything everywhere" choices?
  - Extra cells are allowed only when scenario evidence supports them.

This makes a single-cell answer valid when the brief truly supports only one cell. It also makes cross-level answers valid when the brief gives cross-level evidence.

## Feedback Rules

Feedback should diagnose the reasoning problem, not only say "wrong".

### Missing Required Cell

If the player misses a required target:

- Show: "Coverage gap"
- Ask: "Which risk or objective from the brief remains untreated?"
- Reference the relevant ISO concept: test objective, test level, test type, or coverage.

### Unsupported Extra Cell

If the player adds a cell without evidence:

- Show: "Unsupported strategy cell"
- Ask: "What in the scenario makes this test item available at this level?"
- Explain that more cells are not automatically better.

### Wrong Type

If the selected level is plausible but the type is wrong:

- Show: "Quality characteristic mismatch"
- Ask whether the brief is about functionality, security, performance, or usability.

### Wrong Level

If the type is plausible but the level is wrong:

- Show: "Lifecycle/test item mismatch"
- Ask whether the brief refers to a unit, integrated parts, full system, or stakeholder acceptance.

### Weak Defense

If the cell is plausible but defense fields do not match:

- Show: "Defense mismatch"
- Example: A `System x Performance` cell cannot be defended with a `parser unit` test item.

## Single-Cell Challenge Change

The current single-cell challenge asks "why only one?" whenever the player selects one cell for a multi-cell scenario. This is close, but it should become evidence-aware.

New behavior:

- If the scenario has cross-level evidence and the player selects one cell, show the challenge.
- If the scenario genuinely supports one cell only, do not challenge.
- If the player selects many cells without evidence, show an "unsupported expansion" challenge instead.

This prevents the game from teaching the false rule that single-cell answers are suspicious by default.

## Example Scenario Set

### Scenario 1: Sorting Algorithm In Isolation

Brief:

> A new sorting algorithm is introduced. Test that it returns the correct order in complete isolation, with no surrounding I/O or integration points.

Expected strategy:

- `Unit x Functional`

Why:

- Test item: isolated algorithm unit.
- Objective: correct ordering.
- Type: functional.
- No scenario evidence supports integration, system, acceptance, performance, security, or usability.

Teaching point:

- A single-cell answer can be valid when the brief genuinely limits the context.

### Scenario 2: Header Injection Login Bypass

Brief:

> Test that a login bypass via header injection is blocked in the parser unit, auth service integration, and the running system.

Expected strategy:

- `Unit x Security`
- `Integration x Security`
- `System x Security`

Why:

- Same type across multiple levels.
- Each level has separate evidence in the brief.

Teaching point:

- Test type is not locked to one level.

### Scenario 3: Search Latency Under Load

Brief:

> Verify that search stays below p95 latency under realistic concurrent load, both for the isolated search service and for the full deployed system.

Expected strategy:

- `Unit x Performance`
- `System x Performance`

Important design note:

- The scenario must explicitly say the search service is tested in isolation with dependencies mocked or removed. If a later version wants integration-level performance, the brief must mention a real database, external index, or service boundary.

Teaching point:

- Ambiguous scenario writing creates unfair grading. The new model should expose ambiguity instead of hiding it.

### Scenario 4: Onboarding User Sign-Off

Brief:

> Five real users complete the new onboarding wizard and report whether they can finish without assistance.

Expected strategy:

- `Acceptance x Usability`

Why:

- Stakeholder/user sign-off suggests acceptance level.
- Completion without assistance targets usability.

Teaching point:

- Acceptance is a level, usability is a type.

## What Will Happen In The Game

- Zone 3 will still be a matrix-based game.
- The player will still select Level x Type cells.
- The player will defend each selected cell using structured ISO reasoning.
- The game will accept a strategy when evidence supports it.
- The game will show partial credit for missing coverage or weak defense.
- The game will reject unsupported over-testing.
- Feedback will explain the ISO concept behind each mistake.
- The final report can mention whether Zone 3 mistakes were coverage gaps, unsupported cells, or level/type confusion.
- The design will stay compatible with a 10-15 minute prototype by keeping four scenarios.

## What Will Not Happen

- The game will not grade by the order in which cells are clicked.
- The game will not treat the matrix as a formal ISO artifact.
- The game will not require every test type to appear at every level.
- The game will not teach "more cells means better strategy."
- The game will not add Test Practices as a third matrix axis.
- The game will not become a full risk-based testing simulator.
- The game will not use free-form AI or natural-language grading.
- The game will not require writing complete test cases or test procedures.
- The game will not introduce ISO Parts 2, 3, or 4 as required gameplay.
- The game will not add a timer to Zone 3.

## Implementation Boundaries For Later

This document is a design spec, not an implementation plan. A later implementation plan should likely include:

- Replace or extend `zone3-scenarios.js` with a strategy-focused scenario schema.
- Add a pure `evaluateStrategyMatrix()` function that scores coverage, defense, and economy.
- Add a `StrategyDefensePanel` component for selected-cell cards.
- Add `EvidenceChip` and `CoverageSummary` components.
- Rework `SingleCellChallenge` into evidence-aware strategy feedback.
- Preserve existing `Matrix.jsx` if possible.
- Keep ISO text sourced through `iso-definitions.js`.

## Acceptance Criteria For The Design

The redesigned Zone 3 is successful if:

- A player can explain why each selected cell belongs in the matrix.
- A single-cell scenario can be correct without being suspicious.
- A cross-level scenario teaches that the same test type can span several levels.
- Unsupported extra cells are treated as strategy noise, not as ambition.
- Feedback identifies whether the issue was missing coverage, unsupported evidence, wrong level, wrong type, or weak defense.
- The game remains playable in roughly the same time as the current Zone 3.
- The zone still supports the larger game promise: informal testing assumptions should fail, ISO-precise reasoning should pass.

## Locked Design Defaults

- Defense fields are mandatory before submit.
- A non-spoiling coverage meter is visible during selection.
- Supported alternative cells can receive full credit only when all required targets remain covered.
- Optional reflection text can appear in Final Inspection, but it is not scored.
- Scenario wording must be precise enough that the intended level is defensible from the brief alone.
