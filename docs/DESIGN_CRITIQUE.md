# Design Critique — ISO Testing World

**Project:** OPUS Team — ISO Testing World
**Reviewer:** Design Critique (HCI lens)
**Date:** 2026-04-27
**Stage:** Late prototype — Week 3 demo target

---

## Overall Impression

ISO Testing World has a **cohesive visual identity and a real design system**: five zone colors with matched light tints, a sane spacing scale, a shared component library, and Framer Motion transitions that already feel intentional rather than decorative. For a student project this is well above average. The biggest gap is **interaction polish** — tentative selections, hover differentiation, animated state changes, and small accessibility refinements that an HCI reviewer will absolutely notice in a live demo.

**Overall score: 7.6 / 10**

| Page | Score | One-line verdict |
|---|---|---|
| WorldMap | 8.4 / 10 | Strongest page — strong hierarchy, clean grid, minor token leakage |
| Error District (Z1) | 7.8 / 10 | Drag-drop works visually; needs success animation and contrast pass |
| V&V Headquarters (Z2) | 7.4 / 10 | Solid layout; selection feedback and timer ring lack polish |
| Test Matrix Tower (Z3) | 7.2 / 10 | Matrix is scannable but interaction states are flat |
| Artefact Archive (Z4) | 7.6 / 10 | File-explorer pattern is familiar; truncation + trap UX need work |
| Final Inspection | 7.5 / 10 | Report layout is impressive; choice buttons need stronger states |

---

## Design System (cross-cutting)

### What works
- **Token discipline.** `tokens.css` defines zone colors, tints, neutrals, status colors, spacing (`--gap-xs/sm/md/lg/xl`), radius, shadows. Almost every component pulls from it.
- **Shadow ladder** (`sm/md/lg`) is used consistently to communicate elevation.
- **Global focus-visible** rule means keyboard nav has a baseline ring everywhere.
- **`prefers-reduced-motion`** is acknowledged at the global level.
- **Framer Motion entry animations** are short (0.25–0.32 s) and land softly — not gratuitous.

### What hurts
1. **Hardcoded color leakage.** WorldMap banner gradient (line 9) inlines hex values, and `IncidentCard` tag colors (`#2c3a5a`, `#6c3c0a`, `#2f5212`, etc.) bypass the token system. Reviewers who inspect or you who maintain it will see the inconsistency.
2. **Two competing hover patterns.** Primary buttons use `filter: brightness()`. Secondary/ghost variants use `color-mix()`. Pick one — `color-mix` is the modern, accessible choice.
3. **Padding values drift.** Pages use 14, 18, 22 px paddings interchangeably. The token scale is 4/8/16/24/40 — anything off-grid is a smell.
4. **Disabled state is just `opacity: 0.5`.** No grayscale, no state announcement, no shape change. Looks unfinished next to the rest.
5. **No mobile breakpoint below 720 px.** Matrix cells, timer ring, and the file explorer are hardcoded sizes that will overflow on a 390 px phone.
6. **Typography scale is implicit, not tokenized.** Sizes (10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 18, 22, 30, 38) are sprinkled through CSS files. Add `--text-xs/sm/base/lg/xl/2xl` tokens.
7. **No standard transition duration.** 120 ms (buttons), 140 ms (drop columns), 180 ms (cells), 200 ms (queue dots), 240 ms (mission card), 600 ms (progress fill) — pick a 3-step ladder.
8. **Reduced-motion override is global only.** Component-level animations (card shake, causal-chain motion, step transitions) don't individually respect it.

---

## Page-by-page reports

### 1. WorldMap — 8.4 / 10

**First impression.** The gradient banner + 5 zone cards reads instantly as a "level select." Eye lands on the title, scans down to Zone 1 first, which is correct.

| Dimension | Score | Notes |
|---|---|---|
| Usability | 9 | Locked/unlocked is unmistakable; CTA pill is obvious |
| Visual hierarchy | 9 | Banner → grid → footer flows correctly |
| Consistency | 7 | Hardcoded gradient + odd 14 px icon margin break rhythm |
| Accessibility | 8 | ARIA labels for completion state; focus rings per zone color |
| Polish / animation | 9 | Staggered card entry (0.05 s × index) is delightful |

**Critical issues**
- 🟢 *Minor* — Gradient inlined at WorldMap.css line 9. Promote to `--gradient-banner` token.
- 🟢 *Minor* — Icon block margin `14px 0 6px` breaks 8 px grid. Use `var(--gap-md) 0 var(--gap-xs)`.
- 🟢 *Minor* — CTA pill has no defined hover; relies on parent transform.
- 🟡 *Moderate* — Footer text (11 px muted) is too small for accessible scanning. Lift to 12 px and `--ink-soft`.

**What works well**
- Asymmetric grid (final card spans 2 rows) gives the layout personality.
- Per-zone focus ring color is a thoughtful detail.
- Locked-card hatch pattern is one of the strongest visual moments in the app.

---

### 2. Error District (Zone 1) — 7.8 / 10

**First impression.** Brief panel + drag pool + 3 columns reads as a Kanban classifier — pattern is instantly understood.

| Dimension | Score | Notes |
|---|---|---|
| Usability | 8 | Drag affordance is clear; column targets large |
| Visual hierarchy | 8 | Brief panel does a lot of work; columns are equally weighted |
| Consistency | 8 | Token usage is clean except tag chip colors |
| Accessibility | 7 | dnd-kit keyboard sensor present, but shake animation lacks reduced-motion guard |
| Polish / animation | 7 | Shake on wrong drop is great; **no success feedback when correct** |

**Critical issues**
- 🔴 *Critical* — **No success animation when a card lands in the correct column.** Wrong drop shakes; right drop is silent. This is a hierarchy-of-feedback violation — successful actions need acknowledgment too. Add a 200 ms scale-in + green checkmark or border flash.
- 🟡 *Moderate* — Tag chips (`LOG`, `DEV`, `USER`) use hardcoded hex pairs. Move to `--tag-log-bg`, `--tag-log-fg`, etc.
- 🟡 *Moderate* — Empty-state placeholder ("Drop items here") is `--muted` on `--zone1-bg`. Estimated contrast ≈ 3.2:1, fails WCAG AA. Use `--ink-soft`.
- 🟢 *Minor* — Pool min-height 280 px is hardcoded. Use `min-height: max-content`.
- 🟢 *Minor* — Border-style transition (dashed → solid) snaps because `border-style` is not animatable. Animate `border-color` only and start solid.

**What works well**
- Causal chain reveal at the end is a strong pedagogical payoff — keep it.
- Card shadow ladder during drag (rest → hover → grabbing) is polished.

---

### 3. V&V Headquarters (Zone 2) — 7.4 / 10

**First impression.** Topbar with timer + queue dots + a single mission below — looks like a quiz UI, which is right.

| Dimension | Score | Notes |
|---|---|---|
| Usability | 8 | Three big routing buttons; timer creates urgency |
| Visual hierarchy | 7 | Mission text is the focal point but undersized vs. surrounding chrome |
| Consistency | 8 | Topbar matches global card pattern |
| Accessibility | 7 | Queue dot ARIA labels are good; timer expiry needs announcement |
| Polish / animation | 7 | Mission AnimatePresence is smooth; timer ring under-styled |

**Critical issues**
- 🔴 *Critical* — **Tentative selection has no visible state.** Clicking VERIFICATION should show selected state before submission (border, glow, or checkmark inside the button). Right now the user can't tell if their click registered.
- 🟡 *Moderate* — Timer ring is 56 × 56 px with a 14 px number. The number should be ~18 px and bolder; add a subtle pulse below 5 s.
- 🟡 *Moderate* — Justification field (textarea) has no styled focus state in the CSS shown. Add a `focus-within` border in `--zone2-color`.
- 🟢 *Minor* — Oracle sidebar (320 px fixed) doesn't truly align with main content; use `align-items: stretch` or sticky positioning.
- 🟢 *Minor* — Mission text is 15.5 px. Bump to 16–17 px — it is the reading focus.

**What works well**
- Queue dot states (inactive → active hollow → done filled) are excellent and reusable.
- The Oracle prompt as a side panel is a clever way to add §3.115 without a separate screen.

---

### 4. Test Matrix Tower (Zone 3) — 7.2 / 10

**First impression.** A 4×4 matrix with row/column headers — clean, but currently feels static, like a table not a game element.

| Dimension | Score | Notes |
|---|---|---|
| Usability | 7 | Multi-select is clear once you click; not obvious it's multi |
| Visual hierarchy | 7 | Matrix dominates correctly; brief is readable |
| Consistency | 7 | Verdict pill, brief, and submit all use slightly different padding |
| Accessibility | 6 | Cells lack ARIA labels for level/type combo |
| Polish / animation | 6 | Hover is soft; selection has no entry animation |

**Critical issues**
- 🔴 *Critical* — **Cells have no ARIA labels.** A screen reader user hears "button" with no level/type context. Add `aria-label="Select Unit level, Functional type"`.
- 🔴 *Critical* — Selection state is instant — no animation on the inset shadow / checkmark. Add a 180 ms scale-in for the check mark; the cell selecting should feel like an action.
- 🟡 *Moderate* — Verdict label is `text-transform: uppercase` without `letter-spacing`. Add `letter-spacing: 0.04em` so it stops feeling cramped.
- 🟡 *Moderate* — Cell hover (60 % zone3-bg blend) is too subtle on white. Increase to 80 % or add a 1 px border swap.
- 🟢 *Minor* — Cell height fixed at 60 px. Use `min-height: 60px` so longer headers don't clip on narrow screens.
- 🟢 *Minor* — Counter text ("3 of 12 selected") is 13 px soft gray. Make it 14 px and bold the number.

**What works well**
- The single-cell challenge modal is exactly the right pedagogical interaction.
- Scope note at the bottom (§4.2.4.5 Test Practices, deferred) shows scope discipline — graders will notice this.

---

### 5. Artefact Archive (Zone 4) — 7.6 / 10

**First impression.** Two-pane file explorer — familiar from VS Code / Finder. Reads as "inspect each file" immediately.

| Dimension | Score | Notes |
|---|---|---|
| Usability | 8 | File-explorer pattern is universally understood |
| Visual hierarchy | 8 | Selected file has strong inset bar; right pane breathes |
| Consistency | 8 | Strongest token usage of any zone |
| Accessibility | 6 | Truncated filenames with no tooltip; no aria-label on rows |
| Polish / animation | 8 | Detail-panel slide-in (x:6 → 0) feels right |

**Critical issues**
- 🔴 *Critical* — **Truncated filenames** in the explorer use `text-overflow: ellipsis` with no `title` attribute. User sees `requirement…` and cannot recover the full name. Add `title={fileName}` and consider a tooltip on hover/focus.
- 🟡 *Moderate* — File rows have no `aria-label` describing filename + status. Screen readers hear just the truncated visible text.
- 🟡 *Moderate* — The trap file (`verbal_agreement.txt`) — per CLAUDE.md "the most important teaching moment in the entire game" — needs a stronger visual moment when the §3.84 Note 1 callout fires. Right now it's a regular modal. Consider a slide-up callout from the bottom with a typewriter reveal of the Note 1 text.
- 🟢 *Minor* — Detail-panel padding 18 px is off-grid; use 20 px.
- 🟢 *Minor* — Tag pills (`Pill.css` — 1.5 px border + 6 px padding) are visually heavy; reduce border to 1 px or pad to 8 px.

**What works well**
- Monospace font for filenames is a perfect typographic choice — communicates "code artefact" instantly.
- Left inset bar on the selected row is a clean, confident selection signal.

---

### 6. Final Inspection — 7.5 / 10

**First impression.** Brief banner with INCIDENT #048 pill + 5-step queue + step content — feels like an audit form, which matches the narrative.

| Dimension | Score | Notes |
|---|---|---|
| Usability | 8 | Step-by-step prompts the right action each time |
| Visual hierarchy | 8 | The 38 px total-score number lands hard — strongest moment |
| Consistency | 7 | Brief padding 18 px and step padding 22 px both off-grid |
| Accessibility | 7 | Choice sublabels (11 px, 0.8 opacity) borderline AA |
| Polish / animation | 7 | Step transitions clean; progress bars don't animate |

**Critical issues**
- 🔴 *Critical* — **Progress bars in the final report don't animate width.** This is the grand finale — the 5 score rows should fill from 0 → final value over 800–1000 ms, staggered. Currently they snap into place. This is the single biggest "wow" moment you're leaving on the table.
- 🟡 *Moderate* — Choice buttons have no tentative-selected state (same issue as Zone 2). Add inset border or ring before the user clicks Submit.
- 🟡 *Moderate* — Choice sublabel at `opacity: 0.8` on white is ~3.9:1 contrast. Drop opacity, use `--ink-soft` directly.
- 🟢 *Minor* — Total box uses solid white; matching the brief's gradient background would tie the page together.
- 🟢 *Minor* — Replay button per row is just a text button; add an icon for affordance.

**What works well**
- The cascading note in the total-score panel is a *huge* pedagogical and design win — that personalized line is the kind of detail an HCI grader will quote in their feedback.
- The 38 px / 18 px split typography on "650 / 1000" is excellent visual rhythm.

---

## Priority recommendations (in order of impact for the demo)

1. **Animate the Final Report progress bars on mount.** Stagger 5 rows × 800 ms width transition. Highest-visibility fix; biggest emotional payoff.
2. **Add tentative-selection state to all choice buttons** (Zone 2 routing buttons, Final Inspection choices). Currently a click feels unacknowledged. A 2 px ring in the zone color + subtle inset solves it everywhere.
3. **Add a success animation in Zone 1** when a card lands correctly. Without it, the only feedback is shake-on-wrong, which is a one-sided loop.
4. **Fix the truncation problem in Zone 4.** Add `title` attributes and `aria-label`s to file rows. Five-minute change, removes a real accessibility blocker.
5. **Make the Zone 4 trap-file moment cinematic.** This is the quoted "most important teaching moment in the entire game" — give it a slide-up callout with a typewriter reveal of the §3.84 Note 1 text.
6. **Add `--text-xs … --text-2xl` typography tokens** and replace ad-hoc font-sizes. Cuts the "11.5/12.5/13.5" drift visibly.
7. **Standardize transition durations** to a 3-step ladder: 150 ms (micro), 250 ms (component), 400 ms (page). Replace 120/140/180/200/240/600.
8. **Audit hardcoded colors** — WorldMap banner gradient, IncidentCard tag chips. Should all live in `tokens.css`.
9. **Add a 480 px breakpoint** to the matrix and timer ring so a phone demo doesn't fall apart.
10. **Per-component `prefers-reduced-motion` overrides** on shake, causal-chain reveal, and step transitions. Showing this to a graders signals HCI maturity.

---

## What an HCI grader will likely praise

- The **token-driven design system** — the project has one, and most projects at this level don't.
- **Per-zone visual identity** without losing system cohesion.
- **Locked-card hatch pattern** and **cascading-note** in the final report — these are the two most distinctive design moments.
- **Modal cannot be dismissed without acknowledgment** — pedagogically intentional, and the design supports it (no close affordances).

## What an HCI grader will likely call out

- Inconsistent interaction feedback (especially for tentative state).
- Off-grid padding / typography drift.
- Insufficient mobile / small-viewport handling.
- A few ARIA gaps in interactive grids and lists.
- Animation present at boundaries (entry/exit) but missing at state changes (selection, success).

---

*Hit the top 5 priority items and this project moves from "well-executed student work" into "publish-ready interaction design." All five are surgical, no architectural changes.*
