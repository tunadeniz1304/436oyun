import { useState, useEffect, useRef, useCallback } from 'react';
import { isoDefinitions } from '../../data/iso-definitions.js';
import './RetroSnake.css';

const GRID = 20;
const CELL = 22;                  // canvas cell px
const CANVAS = GRID * CELL;       // 440 px
const START_TICK_MS = 180;
const MIN_TICK_MS = 75;
const SPEEDUP_EVERY = 5;
const SPEEDUP_FACTOR = 0.88;
const BUG_COUNT = 3;

const BUG_ISO_REFS = ['§3.39', '§3.84', '§3.130'];

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

const KEY_TO_DIR = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

const cellsEqual = (a, b) => a.x === b.x && a.y === b.y;

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function randomEmptyCell(occupied) {
  for (let i = 0; i < 80; i++) {
    const c = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    if (!occupied.some(o => cellsEqual(o, c))) return c;
  }
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    const c = { x, y };
    if (!occupied.some(o => cellsEqual(o, c))) return c;
  }
  return { x: 0, y: 0 };
}

function spawnBugs(occupied) {
  const bugs = [];
  const taken = [...occupied];
  for (let i = 0; i < BUG_COUNT; i++) {
    const c = randomEmptyCell(taken);
    bugs.push({ ...c, isoRef: BUG_ISO_REFS[Math.floor(Math.random() * BUG_ISO_REFS.length)] });
    taken.push(c);
  }
  return bugs;
}

function makeInitial() {
  const snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  const bugs = spawnBugs(snake);
  const food = randomEmptyCell([...snake, ...bugs]);
  return { snake, bugs, food };
}

export default function RetroSnake({ onClose }) {
  const [phase, setPhase] = useState('loading');
  // React state is only for *displayed* values + things that gate render.
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [tps, setTps] = useState(Math.round(1000 / START_TICK_MS));
  const [feedback, setFeedback] = useState(null);
  const [endReason, setEndReason] = useState(null);

  // All hot game state lives in refs — no re-renders per tick.
  const gameRef = useRef(makeInitial());
  const dirRef = useRef('right');
  const queuedDirRef = useRef(null);
  const tickMsRef = useRef(START_TICK_MS);
  const lastTickRef = useRef(0);
  const foodsEatenRef = useRef(0);
  const scoreRef = useRef(0);
  const rafRef = useRef(0);
  const canvasRef = useRef(null);
  const phaseRef = useRef('loading');
  const feedbackRef = useRef(null);

  // keep refs in sync with state for the loop's conditionals
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);

  // Loading → playing
  useEffect(() => {
    if (phase !== 'loading') return;
    const id = setTimeout(() => setPhase('playing'), 900);
    return () => clearTimeout(id);
  }, [phase]);

  const resetState = useCallback(() => {
    const s = makeInitial();
    gameRef.current = s;
    dirRef.current = 'right';
    queuedDirRef.current = null;
    tickMsRef.current = START_TICK_MS;
    lastTickRef.current = 0;
    foodsEatenRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setLength(3);
    setTps(Math.round(1000 / START_TICK_MS));
    setFeedback(null);
    setEndReason(null);
  }, []);

  const handleReset = useCallback(() => {
    resetState();
    setPhase('playing');
  }, [resetState]);

  // Keyboard — bound once for the playing phase
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const onKey = (e) => {
      if (feedbackRef.current) return;
      const next = KEY_TO_DIR[e.key];
      if (!next) return;
      e.preventDefault();
      if (next === OPPOSITE[dirRef.current]) return;
      queuedDirRef.current = next;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // Single rAF loop — drives ticks AND draws. Only mounts when entering 'playing'.
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const cx = (c) => c.x * CELL + CELL / 2;
    const cy = (c) => c.y * CELL + CELL / 2;

    const draw = () => {
      const { snake, bugs, food } = gameRef.current;
      const dir = dirRef.current;

      // Arena background — soft vignette green
      const grad = ctx.createRadialGradient(CANVAS / 2, CANVAS / 2, CANVAS * 0.1, CANVAS / 2, CANVAS / 2, CANVAS * 0.75);
      grad.addColorStop(0, '#1a3d22');
      grad.addColorStop(1, '#0b1e0f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS, CANVAS);

      // Dotted grid — small dots at intersections, much subtler than lines
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let y = 1; y < GRID; y++) {
        for (let x = 1; x < GRID; x++) {
          ctx.fillRect(x * CELL - 0.5, y * CELL - 0.5, 1.5, 1.5);
        }
      }

      // Food — yellow disc with shine + label
      const fx = food.x * CELL, fy = food.y * CELL;
      const fcx = fx + CELL / 2, fcy = fy + CELL / 2;
      const fr = CELL / 2 - 2;
      ctx.shadowColor = 'rgba(255, 213, 74, 0.55)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffd54a';
      ctx.beginPath();
      ctx.arc(fcx, fcy, fr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // shine
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(fcx - fr * 0.35, fcy - fr * 0.35, fr * 0.32, 0, Math.PI * 2);
      ctx.fill();
      // label
      ctx.fillStyle = '#000080';
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TC', fcx, fcy + 1);

      // Bugs — rounded red squares with white ×
      bugs.forEach(b => {
        const bx = b.x * CELL + 3;
        const by = b.y * CELL + 3;
        const bs = CELL - 6;
        const br = 4;
        ctx.fillStyle = '#c0392b';
        roundRect(ctx, bx, by, bs, bs, br);
        ctx.fill();
        // top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        roundRect(ctx, bx, by, bs, bs * 0.45, br);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText('×', bx + bs / 2, by + bs / 2 + 1);
      });

      // Snake — strokes a continuous rounded path through cell centers
      if (snake.length > 0) {
        const bodyW = CELL - 4;

        // outer dark outline
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0d3a16';
        ctx.lineWidth = bodyW + 4;
        ctx.beginPath();
        ctx.moveTo(cx(snake[0]), cy(snake[0]));
        for (let i = 1; i < snake.length; i++) ctx.lineTo(cx(snake[i]), cy(snake[i]));
        if (snake.length === 1) ctx.lineTo(cx(snake[0]) + 0.01, cy(snake[0]));
        ctx.stroke();

        // main body fill
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = bodyW;
        ctx.beginPath();
        ctx.moveTo(cx(snake[0]), cy(snake[0]));
        for (let i = 1; i < snake.length; i++) ctx.lineTo(cx(snake[i]), cy(snake[i]));
        if (snake.length === 1) ctx.lineTo(cx(snake[0]) + 0.01, cy(snake[0]));
        ctx.stroke();

        // glossy top highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = bodyW * 0.4;
        ctx.beginPath();
        ctx.moveTo(cx(snake[0]), cy(snake[0]));
        for (let i = 1; i < snake.length; i++) ctx.lineTo(cx(snake[i]), cy(snake[i]));
        if (snake.length === 1) ctx.lineTo(cx(snake[0]) + 0.01, cy(snake[0]));
        ctx.stroke();

        // Head — slightly larger circle, drawn on top with eyes
        const head = snake[0];
        const hcx = cx(head), hcy = cy(head);
        const hr = bodyW / 2 + 1;
        // outline
        ctx.fillStyle = '#0d3a16';
        ctx.beginPath();
        ctx.arc(hcx, hcy, hr + 1.5, 0, Math.PI * 2);
        ctx.fill();
        // head fill
        ctx.fillStyle = '#7dd66f';
        ctx.beginPath();
        ctx.arc(hcx, hcy, hr, 0, Math.PI * 2);
        ctx.fill();

        // eyes
        const eyeOffFwd = hr * 0.45;
        const eyeOffSide = hr * 0.45;
        let e1, e2;
        if (dir === 'right') {
          e1 = [hcx + eyeOffFwd, hcy - eyeOffSide];
          e2 = [hcx + eyeOffFwd, hcy + eyeOffSide];
        } else if (dir === 'left') {
          e1 = [hcx - eyeOffFwd, hcy - eyeOffSide];
          e2 = [hcx - eyeOffFwd, hcy + eyeOffSide];
        } else if (dir === 'up') {
          e1 = [hcx - eyeOffSide, hcy - eyeOffFwd];
          e2 = [hcx + eyeOffSide, hcy - eyeOffFwd];
        } else {
          e1 = [hcx - eyeOffSide, hcy + eyeOffFwd];
          e2 = [hcx + eyeOffSide, hcy + eyeOffFwd];
        }
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(e1[0], e1[1], 2.4, 0, Math.PI * 2);
        ctx.arc(e2[0], e2[1], 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(e1[0], e1[1], 1.2, 0, Math.PI * 2);
        ctx.arc(e2[0], e2[1], 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const step = (now) => {
      if (phaseRef.current !== 'playing') return;
      rafRef.current = requestAnimationFrame(step);

      if (feedbackRef.current) { draw(); return; }
      if (!lastTickRef.current) lastTickRef.current = now;
      const elapsed = now - lastTickRef.current;
      if (elapsed < tickMsRef.current) { draw(); return; }
      lastTickRef.current = now;

      // tick
      if (queuedDirRef.current) {
        dirRef.current = queuedDirRef.current;
        queuedDirRef.current = null;
      }
      const dir = dirRef.current;
      const g = gameRef.current;
      const head = g.snake[0];
      const nextHead = {
        x: head.x + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0),
        y: head.y + (dir === 'up' ? -1 : dir === 'down' ? 1 : 0),
      };

      if (nextHead.x < 0 || nextHead.x >= GRID || nextHead.y < 0 || nextHead.y >= GRID) {
        setEndReason('wall'); setPhase('gameover'); return;
      }
      if (g.snake.slice(0, -1).some(c => cellsEqual(c, nextHead))) {
        setEndReason('self'); setPhase('gameover'); return;
      }
      const hitBug = g.bugs.find(b => cellsEqual(b, nextHead));
      if (hitBug) {
        const def = isoDefinitions[hitBug.isoRef];
        setFeedback({
          isoRef: hitBug.isoRef,
          term: def?.term ?? hitBug.isoRef,
          definition: def?.definition ?? '',
          note: def?.note ?? null,
        });
        draw();
        return;
      }
      let newSnake;
      if (cellsEqual(nextHead, g.food)) {
        newSnake = [nextHead, ...g.snake];
        foodsEatenRef.current += 1;
        scoreRef.current += 10;
        if (foodsEatenRef.current % SPEEDUP_EVERY === 0) {
          tickMsRef.current = Math.max(MIN_TICK_MS, Math.floor(tickMsRef.current * SPEEDUP_FACTOR));
          setTps(Math.round(1000 / tickMsRef.current));
        }
        const newBugs = spawnBugs(newSnake);
        const newFood = randomEmptyCell([...newSnake, ...newBugs]);
        gameRef.current = { snake: newSnake, bugs: newBugs, food: newFood };
        setScore(scoreRef.current);
        setLength(newSnake.length);
      } else {
        newSnake = [nextHead, ...g.snake.slice(0, -1)];
        gameRef.current = { ...g, snake: newSnake };
      }
      draw();
    };

    draw();
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  if (phase === 'loading') {
    return (
      <div className="snake snake--loading">
        <div className="snake__loading-card">
          <div className="snake__loading-icon">🐍</div>
          <div className="snake__loading-title">Snake.exe</div>
          <div className="snake__loading-subtitle">Initializing test environment…</div>
          <div className="snake__loading-progress">
            <div className="snake__loading-bar" />
          </div>
          <div className="snake__loading-log">
            <div>&gt; Loading test cases……… OK</div>
            <div>&gt; Spawning defect cells… OK</div>
            <div>&gt; Connecting to ISO/IEC/IEEE 29119-1…</div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'gameover') {
    const reasonText =
      endReason === 'wall' ? 'Out of bounds — the snake left the test scope.'
      : endReason === 'self' ? 'Self-collision — the test case ran into itself.'
      : endReason === 'bug' ? 'A defect was hit. Game over.'
      : 'Game over.';
    return (
      <div className="snake snake--result">
        <div className="snake__result-title">🐍 Game Over</div>
        <div className="snake__result-score">
          Score: <strong>{score}</strong> · Length: <strong>{length}</strong> · Foods: <strong>{foodsEatenRef.current}</strong>
        </div>
        <div className="snake__result-reason">{reasonText}</div>
        <div className="snake__iso-callout">
          <div className="snake__iso-callout-title">ISO/IEC/IEEE 29119-1 — §4.7 Defects &amp; Incident Management</div>
          <div className="snake__iso-callout-def">
            Every collision with a defect cell, or stepping out of test scope,
            is an <strong>incident</strong> (§3.39) worth recording.
          </div>
        </div>
        <div className="snake__result-btns">
          <button className="snake__btn snake__btn--primary" onClick={handleReset}>Play Again</button>
          <button className="snake__btn" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="snake">
      <div className="snake__hud">
        <div className="snake__hud-cell">
          <span className="snake__hud-label">SCORE</span>
          <span className="snake__hud-value snake__hud-value--gold">{score}</span>
        </div>
        <div className="snake__hud-cell">
          <span className="snake__hud-label">LENGTH</span>
          <span className="snake__hud-value">{length}</span>
        </div>
        <div className="snake__hud-cell">
          <span className="snake__hud-label">SPEED</span>
          <span className="snake__hud-value">{tps} tps</span>
        </div>
        <div className="snake__hud-cell snake__hud-cell--legend">
          <span className="snake__legend">
            <span className="snake__legend-dot snake__legend-dot--food" /> Test Case
          </span>
          <span className="snake__legend">
            <span className="snake__legend-dot snake__legend-dot--bug" /> Defect
          </span>
        </div>
      </div>

      <div className="snake__canvas-wrap">
        <div className="snake__canvas-frame">
          <canvas
            ref={canvasRef}
            width={CANVAS}
            height={CANVAS}
            className="snake__canvas"
          />
        </div>
        <div className="snake__hint">Arrows or WASD to move · eat TC · avoid defects</div>
      </div>

      {feedback && (
        <FeedbackOverlay
          feedback={feedback}
          onDismiss={() => {
            setFeedback(null);
            setEndReason('bug');
            setPhase('gameover');
          }}
        />
      )}
    </div>
  );
}

function FeedbackOverlay({ feedback, onDismiss }) {
  return (
    <div className="snake__feedback-root" role="dialog" aria-modal="true">
      <div className="snake__feedback-backdrop" />
      <div className="snake__feedback-box">
        <div className="snake__feedback-header">
          <span>⚠ DEFECT HIT — ISO {feedback.isoRef}</span>
        </div>
        <div className="snake__feedback-body">
          <div className="snake__feedback-row">
            <div>
              <div className="snake__feedback-label">ISO TERM</div>
              <div className="snake__feedback-value">{feedback.term}</div>
            </div>
            <div>
              <div className="snake__feedback-label">CLAUSE</div>
              <div className="snake__feedback-value snake__feedback-clause">{feedback.isoRef}</div>
            </div>
          </div>
          <div className="snake__feedback-def">&ldquo;{feedback.definition}&rdquo;</div>
          {feedback.note && (
            <div className="snake__feedback-note">
              <strong>Note 1 to entry:</strong> &ldquo;{feedback.note}&rdquo;
            </div>
          )}
          <button className="snake__btn snake__btn--primary" onClick={onDismiss}>
            I understand →
          </button>
        </div>
      </div>
    </div>
  );
}
