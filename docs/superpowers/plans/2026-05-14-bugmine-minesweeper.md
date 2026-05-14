# Bug Mine Minesweeper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Win95-style Minesweeper mini-game ("Bug Mine") to the retro desktop, plus rename the existing BugSweeper shortcut to "TriageDesk".

**Architecture:** Single self-contained component `RetroBugMine.jsx` with all game logic in local state; opened via the existing rich-content popup system in `RetroDesktop.jsx` (same pattern as RetroBrowser and RetroBugSweeper). Grid state is a flat array of cell objects. No new dependencies.

**Tech Stack:** React 18, plain CSS (RetroPopups.css), existing popup infrastructure in RetroDesktop.jsx.

---

## File Map

| Action | File |
|--------|------|
| Create | `frontend/src/components/shared/RetroBugMine.jsx` |
| Modify | `frontend/src/components/shared/RetroDesktop.jsx` — add shortcut + import + handler |
| Modify | `frontend/src/components/shared/RetroPopups.css` — append `.bug-mine__*` styles |

---

### Task 1: Rename BugSweeper → TriageDesk

**Files:**
- Modify: `frontend/src/components/shared/RetroDesktop.jsx`

- [ ] **Step 1: Update SHORTCUTS entry**

In `RetroDesktop.jsx`, find the `bugsweeper` entry in `SHORTCUTS` and change it:

```js
{ id: 'bugsweeper', label: 'TriageDesk.exe', icon: '🗂️', msg: '' }
```

- [ ] **Step 2: Verify dev server shows updated label**

Run: `cd frontend && npm run dev`
Expected: Desktop shortcut column shows `🗂️ TriageDesk.exe` instead of `🐛 BugSweeper.exe`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/shared/RetroDesktop.jsx
git commit -m "fix(desktop): rename BugSweeper shortcut to TriageDesk"
```

---

### Task 2: Create RetroBugMine.jsx — game logic + board generation

**Files:**
- Create: `frontend/src/components/shared/RetroBugMine.jsx`

No automated tests per project rules (CLAUDE.md §14). Manual verification steps provided instead.

- [ ] **Step 1: Create the file with board generation logic**

```jsx
import { useState, useEffect, useCallback } from 'react';
import './RetroPopups.css';

const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;

/**
 * Build a fresh board: flat array of ROWS*COLS cell objects.
 * Mines are placed randomly, numbers computed after.
 * @param {number} safeIdx — index of first-clicked cell (never a mine)
 */
function buildBoard(safeIdx) {
  const total = ROWS * COLS;
  const cells = Array.from({ length: total }, (_, i) => ({
    idx: i,
    isMine: false,
    isOpen: false,
    isFlagged: false,
    neighborCount: 0,
  }));

  // Place mines avoiding safeIdx
  let placed = 0;
  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * total);
    if (r !== safeIdx && !cells[r].isMine) {
      cells[r].isMine = true;
      placed++;
    }
  }

  // Compute neighbor counts
  for (let i = 0; i < total; i++) {
    if (cells[i].isMine) continue;
    cells[i].neighborCount = getNeighbors(i).filter(n => cells[n].isMine).length;
  }

  return cells;
}

function getNeighbors(idx) {
  const row = Math.floor(idx / COLS);
  const col = idx % COLS;
  const neighbors = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        neighbors.push(nr * COLS + nc);
      }
    }
  }
  return neighbors;
}

/** Flood-fill open empty cells from idx */
function floodOpen(cells, idx) {
  const next = [...cells];
  const queue = [idx];
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    next[cur] = { ...next[cur], isOpen: true };
    if (next[cur].neighborCount === 0 && !next[cur].isMine) {
      getNeighbors(cur).forEach(n => {
        if (!visited.has(n) && !next[n].isOpen && !next[n].isFlagged) {
          queue.push(n);
        }
      });
    }
  }
  return next;
}

/** @param {{ onClose: () => void }} props */
export default function RetroBugMine({ onClose }) {
  // null board = waiting for first click (deferred generation for safe first click)
  const [board, setBoard] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'playing' | 'won' | 'lost'
  const [flagCount, setFlagCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [explodedIdx, setExplodedIdx] = useState(null);

  // Timer
  useEffect(() => {
    if (status !== 'playing') return;
    const id = setInterval(() => setSeconds(s => Math.min(s + 1, 999)), 1000);
    return () => clearInterval(id);
  }, [status]);

  const resetGame = useCallback(() => {
    setBoard(null);
    setStatus('idle');
    setFlagCount(0);
    setSeconds(0);
    setExplodedIdx(null);
  }, []);

  function handleLeftClick(idx) {
    if (status === 'lost' || status === 'won') return;
    if (board && board[idx].isFlagged) return;
    if (board && board[idx].isOpen) return;

    let next;
    if (!board) {
      // First click — generate board now so first click is always safe
      next = buildBoard(idx);
      setStatus('playing');
    } else {
      next = [...board];
    }

    if (next[idx].isMine) {
      // Reveal all mines
      next = next.map(c => c.isMine ? { ...c, isOpen: true } : c);
      setBoard(next);
      setExplodedIdx(idx);
      setStatus('lost');
      return;
    }

    next = floodOpen(next, idx);
    setBoard(next);

    // Check win: all non-mine cells open
    const won = next.every(c => c.isMine || c.isOpen);
    if (won) setStatus('won');
  }

  function handleRightClick(e, idx) {
    e.preventDefault();
    if (status === 'lost' || status === 'won' || !board) return;
    if (board[idx].isOpen) return;
    const next = [...board];
    const wasFlag = next[idx].isFlagged;
    next[idx] = { ...next[idx], isFlagged: !wasFlag };
    setBoard(next);
    setFlagCount(f => wasFlag ? f - 1 : f + 1);
  }

  const minesLeft = MINE_COUNT - flagCount;
  const faceIcon = status === 'lost' ? '😵' : status === 'won' ? '😎' : '🙂';

  return (
    <div className="bug-mine">
      {/* Header bar */}
      <div className="bug-mine__header">
        <div className="bug-mine__counter">{String(minesLeft).padStart(3, '0')}</div>
        <button className="bug-mine__face-btn" onClick={resetGame} aria-label="New game">
          {faceIcon}
        </button>
        <div className="bug-mine__counter">{String(seconds).padStart(3, '0')}</div>
      </div>

      {/* Grid */}
      <div className="bug-mine__grid" role="grid">
        {Array.from({ length: ROWS * COLS }, (_, idx) => {
          const cell = board ? board[idx] : null;
          const isOpen = cell?.isOpen ?? false;
          const isFlagged = cell?.isFlagged ?? false;
          const isMine = cell?.isMine ?? false;
          const isExploded = idx === explodedIdx;
          const n = cell?.neighborCount ?? 0;

          let content = '';
          if (isOpen && isMine) content = isExploded ? '💥' : '🐛';
          else if (isOpen && n > 0) content = n;
          else if (!isOpen && isFlagged) content = '📌';

          return (
            <button
              key={idx}
              className={[
                'bug-mine__cell',
                isOpen ? 'bug-mine__cell--open' : 'bug-mine__cell--closed',
                isExploded ? 'bug-mine__cell--exploded' : '',
                isOpen && !isMine && n > 0 ? `bug-mine__cell--n${n}` : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleLeftClick(idx)}
              onContextMenu={(e) => handleRightClick(e, idx)}
              aria-label={isFlagged ? 'Flagged cell' : isOpen ? `${isMine ? 'Bug' : n || 'Empty'}` : 'Hidden cell'}
            >
              {content}
            </button>
          );
        })}
      </div>

      {/* Status bar */}
      <div className="bug-mine__statusbar">
        {status === 'lost' && <span className="bug-mine__status--lost">💥 Bug escaped! Right-click to flag bugs.</span>}
        {status === 'won' && <span className="bug-mine__status--won">✅ All bugs reported! Incident #047 closed.</span>}
        {(status === 'idle' || status === 'playing') && <span>Left-click to inspect · Right-click to flag 📌</span>}
        <button className="bug-mine__close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification — board generates**

Run `npm run dev`, open Bug Mine, click a cell. Expected: board appears, cells flood-open, no console errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/shared/RetroBugMine.jsx
git commit -m "feat(desktop): add Bug Mine minesweeper game component"
```

---

### Task 3: Add Bug Mine CSS styles

**Files:**
- Modify: `frontend/src/components/shared/RetroPopups.css`

- [ ] **Step 1: Append styles**

Add at the end of `RetroPopups.css`:

```css
/* ── Bug Mine — Win95 Minesweeper ── */
.bug-mine {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: #c0c0c0;
  font-family: 'MS Sans Serif', 'Segoe UI', Arial, sans-serif;
  user-select: none;
}

.bug-mine__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #c0c0c0;
  border-bottom: 2px solid #808080;
  box-shadow: inset 2px 2px 0 #fff, inset -2px -2px 0 #808080;
  margin: 6px;
  flex-shrink: 0;
}

.bug-mine__counter {
  background: #000;
  color: #f00;
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 2px;
  padding: 2px 4px;
  min-width: 44px;
  text-align: center;
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-bottom: 2px solid #fff;
  border-right: 2px solid #fff;
}

.bug-mine__face-btn {
  background: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #808080;
  border-right: 2px solid #808080;
  font-size: 18px;
  width: 32px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.bug-mine__face-btn:active {
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-bottom: 2px solid #fff;
  border-right: 2px solid #fff;
}

.bug-mine__grid {
  display: grid;
  grid-template-columns: repeat(9, 28px);
  grid-template-rows: repeat(9, 28px);
  gap: 0;
  margin: 0 6px 0;
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-bottom: 2px solid #fff;
  border-right: 2px solid #fff;
  flex-shrink: 0;
}

.bug-mine__cell {
  width: 28px;
  height: 28px;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  box-sizing: border-box;
}

.bug-mine__cell--closed {
  background: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #808080;
  border-right: 2px solid #808080;
}

.bug-mine__cell--closed:active {
  border: 1px solid #808080;
}

.bug-mine__cell--open {
  background: #c0c0c0;
  border: 1px solid #808080;
  cursor: default;
}

.bug-mine__cell--exploded {
  background: #f00;
}

/* Number colors — classic Minesweeper palette */
.bug-mine__cell--n1 { color: #0000f0; }
.bug-mine__cell--n2 { color: #007b00; }
.bug-mine__cell--n3 { color: #f00; }
.bug-mine__cell--n4 { color: #00007b; }
.bug-mine__cell--n5 { color: #7b0000; }
.bug-mine__cell--n6 { color: #007b7b; }
.bug-mine__cell--n7 { color: #000; }
.bug-mine__cell--n8 { color: #808080; }

.bug-mine__statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  font-size: 11px;
  background: #c0c0c0;
  border-top: 1px solid #808080;
  margin-top: 6px;
  flex-shrink: 0;
}

.bug-mine__status--lost { color: #cc0000; font-weight: bold; }
.bug-mine__status--won  { color: #006600; font-weight: bold; }

.bug-mine__close-btn {
  background: #c0c0c0;
  border-top: 2px solid #fff;
  border-left: 2px solid #fff;
  border-bottom: 2px solid #808080;
  border-right: 2px solid #808080;
  font-family: 'MS Sans Serif', 'Segoe UI', Arial, sans-serif;
  font-size: 11px;
  padding: 2px 10px;
  cursor: pointer;
}

.bug-mine__close-btn:active {
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-bottom: 2px solid #fff;
  border-right: 2px solid #fff;
}
```

- [ ] **Step 2: Verify grid looks correct**

Run `npm run dev`. Open Bug Mine popup. Expected: 9×9 grid of raised gray cells, red counter display, smiley button. Cells look like classic Win95 Minesweeper tiles.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/shared/RetroPopups.css
git commit -m "feat(desktop): add Bug Mine CSS styles"
```

---

### Task 4: Wire Bug Mine into RetroDesktop

**Files:**
- Modify: `frontend/src/components/shared/RetroDesktop.jsx`

- [ ] **Step 1: Add import at top of file**

After the existing imports, add:
```js
import RetroBugMine from './RetroBugMine.jsx';
```

- [ ] **Step 2: Add shortcut entry**

In the `SHORTCUTS` array, add a 7th entry after `bugsweeper`:
```js
{ id: 'bugmine', label: 'Bug Mine', icon: '💥', msg: '' },
```

- [ ] **Step 3: Add handler branch**

In `handleShortcutDoubleClick`, add a new branch alongside the existing `bugsweeper`, `ie`, `my-docs` branches:
```js
if (sc.id === 'bugmine') {
  setDialog({ title: 'Bug Mine', icon: '💥', size: 'lg', content: <RetroBugMine onClose={() => setDialog(null)} /> });
  return;
}
```

- [ ] **Step 4: Adjust popup size for Bug Mine**

The 9×9 grid at 28px per cell = 252px wide. The popup `--lg` is 680px wide which is fine. But height needs to fit the grid (9×28=252px) + header (~44px) + statusbar (~28px) + margins ≈ 360px total. The current `height: 78vh` is more than enough — no size change needed.

- [ ] **Step 5: Manual verification**

Run `npm run dev`. Double-click `💥 Bug Mine` on desktop. Expected:
- Popup opens with header (counter + smiley + timer)
- 9×9 grid of closed cells
- Click a cell → board generates, flood-fill opens empty area
- Right-click a cell → 📌 flag appears, mine counter decrements
- Hit a mine → 💥 explodes red, all bugs revealed, face turns 😵
- Win → face turns 😎, status bar shows victory message
- Smiley button resets game
- Close button dismisses popup

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/shared/RetroDesktop.jsx
git commit -m "feat(desktop): wire Bug Mine game into desktop shortcuts"
```

---

## Self-Review

**Spec coverage:**
- ✅ 9×9 grid, 10 mines — Task 2 `ROWS/COLS/MINE_COUNT`
- ✅ Left click open, right click flag — Task 2 handlers
- ✅ First click always safe — Task 2 `buildBoard(safeIdx)`
- ✅ Flood fill empty cells — Task 2 `floodOpen()`
- ✅ Win/lose detection — Task 2 status checks
- ✅ Mine counter + timer — Task 2 state + useEffect
- ✅ Reset button (smiley) — Task 2 `resetGame`
- ✅ Win95 styling — Task 3 CSS
- ✅ Shortcut renamed TriageDesk — Task 1
- ✅ New 💥 shortcut wired — Task 4
- ✅ No new deps — uses only React hooks + plain CSS
- ✅ No Claude signatures in commits

**Placeholder scan:** None found.

**Type consistency:** `board` is `Cell[] | null` throughout. `status` values `'idle'|'playing'|'won'|'lost'` used consistently. `handleLeftClick(idx: number)` and `handleRightClick(e, idx: number)` match their call sites.
