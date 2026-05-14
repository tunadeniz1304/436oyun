import { useState, useEffect, useCallback } from 'react';
import './RetroPopups.css';

const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;

function buildBoard(safeIdx) {
  const total = ROWS * COLS;
  const cells = Array.from({ length: total }, (_, i) => ({
    idx: i,
    isMine: false,
    isOpen: false,
    isFlagged: false,
    neighborCount: 0,
  }));

  let placed = 0;
  while (placed < MINE_COUNT) {
    const r = Math.floor(Math.random() * total);
    if (r !== safeIdx && !cells[r].isMine) {
      cells[r].isMine = true;
      placed++;
    }
  }

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
  const [board, setBoard] = useState(null);
  const [status, setStatus] = useState('idle');
  const [flagCount, setFlagCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [explodedIdx, setExplodedIdx] = useState(null);

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
      next = buildBoard(idx);
      setStatus('playing');
    } else {
      next = [...board];
    }

    if (next[idx].isMine) {
      next = next.map(c => c.isMine ? { ...c, isOpen: true } : c);
      setBoard(next);
      setExplodedIdx(idx);
      setStatus('lost');
      return;
    }

    next = floodOpen(next, idx);
    setBoard(next);

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
      <div className="bug-mine__header">
        <div className="bug-mine__counter">{String(minesLeft).padStart(3, '0')}</div>
        <button className="bug-mine__face-btn" onClick={resetGame} aria-label="New game">
          {faceIcon}
        </button>
        <div className="bug-mine__counter">{String(seconds).padStart(3, '0')}</div>
      </div>

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

      <div className="bug-mine__statusbar">
        {status === 'lost' && <span className="bug-mine__status--lost">💥 Bug escaped! Right-click to flag bugs.</span>}
        {status === 'won' && <span className="bug-mine__status--won">✅ All bugs reported! Incident #047 closed.</span>}
        {(status === 'idle' || status === 'playing') && <span>Left-click to inspect · Right-click to flag 📌</span>}
        <button className="bug-mine__close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
