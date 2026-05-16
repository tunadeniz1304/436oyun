import { useState, useEffect, useRef, useCallback } from 'react';
import { isoDefinitions } from '../../data/iso-definitions.js';
import './RetroSnake.css';

const GRID = 20;
const CELL = 22;
const CANVAS = GRID * CELL;
const START_TICK_MS = 180;
const MIN_TICK_MS = 75;
const SPEEDUP_EVERY = 5;
const SPEEDUP_FACTOR = 0.88;
const BUG_COUNT = 3;
const MAX_LIVES = 2;
const HEART_SPAWN_EVERY = 4; // every N foods, try to spawn a heart if lives < MAX

const BUG_ISO_REFS = ['§3.39', '§3.84', '§3.130'];

const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

const KEY_TO_DIR = {
  ArrowUp: 'up', w: 'up', W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

// ISO quiz pool — shown when player picks up a heart.
const QUIZ_POOL = [
  {
    isoRef: '§3.84',
    question: 'According to ISO/IEC/IEEE 29119-1 §3.84, the test basis is:',
    choices: [
      'Only a formally approved requirements document',
      'Any information used as the basis for designing and implementing test cases — may even be an undocumented understanding',
      'The output of dynamic testing only',
    ],
    correct: 1,
  },
  {
    isoRef: '§3.130',
    question: 'Per §3.130 Note 1, a test type (e.g. performance, security):',
    choices: [
      'Can only be performed at a single test level',
      'Is the same thing as a test level',
      'Can be performed at a single test level or across several test levels',
    ],
    correct: 2,
  },
  {
    isoRef: '§4.1.3',
    question: 'Which best describes the distinction between Verification and Validation?',
    choices: [
      'Verification is done by developers; validation is done by users',
      'Verification checks conformance to a specification; validation checks fitness for intended use — either party can do either',
      'Verification happens before coding; validation happens after release',
    ],
    correct: 1,
  },
  {
    isoRef: '§3.115',
    question: 'A test oracle is:',
    choices: [
      'A source of information for determining whether a test has passed or failed',
      'A test management tool',
      'A type of automated test runner',
    ],
    correct: 0,
  },
  {
    isoRef: '§3.78',
    question: 'Static testing means:',
    choices: [
      'Testing without executing the test item (e.g. reviews, static analysis)',
      'Testing only on a stable production server',
      'Manual testing as opposed to automated testing',
    ],
    correct: 0,
  },
];

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

function drawHeart(ctx, cxp, cyp, size) {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(cxp, cyp + s * 0.3);
  ctx.bezierCurveTo(cxp, cyp + s * 0.1, cxp - s * 0.5, cyp - s * 0.2, cxp - s * 0.5, cyp - s * 0.5);
  ctx.bezierCurveTo(cxp - s * 0.5, cyp - s * 0.8, cxp - s * 0.15, cyp - s * 0.8, cxp, cyp - s * 0.5);
  ctx.bezierCurveTo(cxp + s * 0.15, cyp - s * 0.8, cxp + s * 0.5, cyp - s * 0.8, cxp + s * 0.5, cyp - s * 0.5);
  ctx.bezierCurveTo(cxp + s * 0.5, cyp - s * 0.2, cxp, cyp + s * 0.1, cxp, cyp + s * 0.3);
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
  return { snake, bugs, food, heart: null };
}

function pickQuiz() {
  return QUIZ_POOL[Math.floor(Math.random() * QUIZ_POOL.length)];
}

export default function RetroSnake({ onClose }) {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'start' | 'howto' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [length, setLength] = useState(3);
  const [tps, setTps] = useState(Math.round(1000 / START_TICK_MS));
  const [lives, setLives] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [endReason, setEndReason] = useState(null);
  const [wrapWalls, setWrapWalls] = useState(false); // chosen on PLAY

  const gameRef = useRef(makeInitial());
  const dirRef = useRef('right');
  const queuedDirRef = useRef(null);
  const tickMsRef = useRef(START_TICK_MS);
  const lastTickRef = useRef(0);
  const foodsEatenRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(1);
  const rafRef = useRef(0);
  const canvasRef = useRef(null);
  const phaseRef = useRef('loading');
  const pausedRef = useRef(false);
  const wrapWallsRef = useRef(false);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pausedRef.current = !!(feedback || quiz); }, [feedback, quiz]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { wrapWallsRef.current = wrapWalls; }, [wrapWalls]);

  // Loading → start screen
  useEffect(() => {
    if (phase !== 'loading') return;
    const id = setTimeout(() => setPhase('start'), 900);
    return () => clearTimeout(id);
  }, [phase]);

  const resetState = useCallback(() => {
    gameRef.current = makeInitial();
    dirRef.current = 'right';
    queuedDirRef.current = null;
    tickMsRef.current = START_TICK_MS;
    lastTickRef.current = 0;
    foodsEatenRef.current = 0;
    scoreRef.current = 0;
    livesRef.current = 1;
    setScore(0);
    setLength(3);
    setTps(Math.round(1000 / START_TICK_MS));
    setLives(1);
    setFeedback(null);
    setQuiz(null);
    setEndReason(null);
  }, []);

  const handleReset = useCallback(() => {
    resetState();
    setPhase('playing');
  }, [resetState]);

  // Resume play after losing a life — keep the snake where it is (just back
  // off the offending move). For wall hits, the head was never advanced; for
  // self/bug hits, also keep the snake intact and let the player react.
  const resumeAfterDamage = useCallback((reasonKey) => {
    const g = gameRef.current;
    if (reasonKey === 'bug') {
      // remove the bug we just hit so the cell is safe to occupy / pass over
      const head = g.snake[0];
      const dir = dirRef.current;
      const nextHead = {
        x: head.x + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0),
        y: head.y + (dir === 'up' ? -1 : dir === 'down' ? 1 : 0),
      };
      gameRef.current = {
        ...g,
        bugs: g.bugs.filter(b => !cellsEqual(b, nextHead)),
      };
    }
    // wall / self: snake state unchanged; player just keeps playing.
    lastTickRef.current = 0;
  }, []);

  // Keyboard
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const onKey = (e) => {
      if (pausedRef.current) return;
      const next = KEY_TO_DIR[e.key];
      if (!next) return;
      e.preventDefault();
      if (next === OPPOSITE[dirRef.current]) return;
      queuedDirRef.current = next;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // Take damage helper — sets feedback modal and handles game over.
  // Returns true if game should end now.
  const takeDamage = useCallback((reasonKey, isoRef) => {
    const newLives = livesRef.current - 1;
    livesRef.current = newLives;
    setLives(newLives);
    const def = isoRef ? isoDefinitions[isoRef] : null;
    setFeedback({
      kind: 'damage',
      reasonKey,
      isoRef: isoRef ?? '§4.7',
      term: def?.term ?? 'incident',
      definition: def?.definition ?? 'An incident is an anomalous or unexpected event during the life cycle of a project, product, service or system.',
      note: def?.note ?? null,
      fatal: newLives <= 0,
    });
  }, []);

  // Single rAF loop
  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');

    const cx = (c) => c.x * CELL + CELL / 2;
    const cy = (c) => c.y * CELL + CELL / 2;

    const draw = () => {
      const { snake, bugs, food, heart } = gameRef.current;
      const dir = dirRef.current;

      // Arena background
      const grad = ctx.createRadialGradient(CANVAS / 2, CANVAS / 2, CANVAS * 0.1, CANVAS / 2, CANVAS / 2, CANVAS * 0.75);
      grad.addColorStop(0, '#1a3d22');
      grad.addColorStop(1, '#0b1e0f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS, CANVAS);

      // Dotted grid
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let y = 1; y < GRID; y++) {
        for (let x = 1; x < GRID; x++) {
          ctx.fillRect(x * CELL - 0.5, y * CELL - 0.5, 1.5, 1.5);
        }
      }

      // Food
      const fcx = food.x * CELL + CELL / 2, fcy = food.y * CELL + CELL / 2;
      const fr = CELL / 2 - 2;
      ctx.shadowColor = 'rgba(255, 213, 74, 0.55)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffd54a';
      ctx.beginPath();
      ctx.arc(fcx, fcy, fr, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(fcx - fr * 0.35, fcy - fr * 0.35, fr * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000080';
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TC', fcx, fcy + 1);

      // Heart (pickup) — pulsing
      if (heart) {
        const hcx2 = heart.x * CELL + CELL / 2;
        const hcy2 = heart.y * CELL + CELL / 2;
        const pulse = 1 + Math.sin(performance.now() / 250) * 0.08;
        const hs = (CELL - 4) * pulse;
        ctx.shadowColor = 'rgba(255, 90, 110, 0.7)';
        ctx.shadowBlur = 12;
        drawHeart(ctx, hcx2, hcy2, hs);
        ctx.fillStyle = '#ff5a6e';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#7a1d2b';
        ctx.lineWidth = 1.5;
        drawHeart(ctx, hcx2, hcy2, hs);
        ctx.stroke();
        // shine
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(hcx2 - hs * 0.2, hcy2 - hs * 0.35, hs * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bugs
      bugs.forEach(b => {
        const bx = b.x * CELL + 3;
        const by = b.y * CELL + 3;
        const bs = CELL - 6;
        ctx.fillStyle = '#c0392b';
        roundRect(ctx, bx, by, bs, bs, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        roundRect(ctx, bx, by, bs, bs * 0.45, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText('×', bx + bs / 2, by + bs / 2 + 1);
      });

      // Snake — split the path at wrap-around discontinuities so a wrapping
      // segment doesn't draw a long line across the board.
      const tracePath = () => {
        ctx.beginPath();
        if (snake.length === 0) return;
        ctx.moveTo(cx(snake[0]), cy(snake[0]));
        for (let i = 1; i < snake.length; i++) {
          const dx = Math.abs(snake[i].x - snake[i - 1].x);
          const dy = Math.abs(snake[i].y - snake[i - 1].y);
          // adjacent cells differ by 1; anything larger means the snake wrapped
          if (dx > 1 || dy > 1) {
            ctx.moveTo(cx(snake[i]), cy(snake[i]));
          } else {
            ctx.lineTo(cx(snake[i]), cy(snake[i]));
          }
        }
        if (snake.length === 1) {
          ctx.lineTo(cx(snake[0]) + 0.01, cy(snake[0]));
        }
      };

      if (snake.length > 0) {
        const bodyW = CELL - 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0d3a16';
        ctx.lineWidth = bodyW + 4;
        tracePath();
        ctx.stroke();
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = bodyW;
        tracePath();
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = bodyW * 0.4;
        tracePath();
        ctx.stroke();

        const head = snake[0];
        const hcx = cx(head), hcy = cy(head);
        const hr = bodyW / 2 + 1;
        ctx.fillStyle = '#0d3a16';
        ctx.beginPath();
        ctx.arc(hcx, hcy, hr + 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7dd66f';
        ctx.beginPath();
        ctx.arc(hcx, hcy, hr, 0, Math.PI * 2);
        ctx.fill();

        const eyeOffFwd = hr * 0.45;
        const eyeOffSide = hr * 0.45;
        let e1, e2;
        if (dir === 'right')      { e1 = [hcx + eyeOffFwd, hcy - eyeOffSide]; e2 = [hcx + eyeOffFwd, hcy + eyeOffSide]; }
        else if (dir === 'left')  { e1 = [hcx - eyeOffFwd, hcy - eyeOffSide]; e2 = [hcx - eyeOffFwd, hcy + eyeOffSide]; }
        else if (dir === 'up')    { e1 = [hcx - eyeOffSide, hcy - eyeOffFwd]; e2 = [hcx + eyeOffSide, hcy - eyeOffFwd]; }
        else                       { e1 = [hcx - eyeOffSide, hcy + eyeOffFwd]; e2 = [hcx + eyeOffSide, hcy + eyeOffFwd]; }
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

      if (pausedRef.current) { draw(); return; }
      if (!lastTickRef.current) lastTickRef.current = now;
      const elapsed = now - lastTickRef.current;
      if (elapsed < tickMsRef.current) { draw(); return; }
      lastTickRef.current = now;

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

      // Wall
      if (nextHead.x < 0 || nextHead.x >= GRID || nextHead.y < 0 || nextHead.y >= GRID) {
        if (wrapWallsRef.current) {
          // wrap around: exit one side, enter the opposite
          nextHead.x = (nextHead.x + GRID) % GRID;
          nextHead.y = (nextHead.y + GRID) % GRID;
        } else {
          takeDamage('wall', '§3.39');
          draw();
          return;
        }
      }
      // Self
      if (g.snake.slice(0, -1).some(c => cellsEqual(c, nextHead))) {
        takeDamage('self', '§3.39');
        draw();
        return;
      }
      // Bug
      const hitBug = g.bugs.find(b => cellsEqual(b, nextHead));
      if (hitBug) {
        takeDamage('bug', hitBug.isoRef);
        draw();
        return;
      }
      // Heart pickup → open quiz, don't advance the snake
      if (g.heart && cellsEqual(nextHead, g.heart)) {
        gameRef.current = { ...g, heart: null };
        setQuiz({ ...pickQuiz(), answered: false, picked: null });
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

        // Maybe spawn a heart if no heart on board and player isn't at max lives
        let newHeart = g.heart;
        if (!newHeart && livesRef.current < MAX_LIVES && foodsEatenRef.current % HEART_SPAWN_EVERY === 0) {
          newHeart = randomEmptyCell([...newSnake, ...newBugs, newFood]);
        }
        // if player is back at max, drop any pending heart
        if (livesRef.current >= MAX_LIVES) newHeart = null;

        gameRef.current = { snake: newSnake, bugs: newBugs, food: newFood, heart: newHeart };
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
  }, [phase, takeDamage]);

  // Damage modal dismiss handler
  const handleDamageDismiss = useCallback(() => {
    const fatal = feedback?.fatal;
    const reason = feedback?.reasonKey;
    setFeedback(null);
    if (fatal) {
      setEndReason(reason);
      setPhase('gameover');
      return;
    }
    resumeAfterDamage(reason);
  }, [feedback, resumeAfterDamage]);

  // Quiz answer handler
  const handleQuizAnswer = useCallback((idx) => {
    setQuiz(q => q ? { ...q, picked: idx, answered: true } : q);
  }, []);

  const handleQuizDismiss = useCallback(() => {
    if (!quiz) return;
    if (quiz.picked === quiz.correct) {
      // award +1 life up to max
      const newLives = Math.min(MAX_LIVES, livesRef.current + 1);
      livesRef.current = newLives;
      setLives(newLives);
    }
    setQuiz(null);
  }, [quiz]);

  const handlePlay = useCallback((wrap) => {
    setWrapWalls(wrap);
    wrapWallsRef.current = wrap;
    setPhase('playing');
  }, []);

  if (phase === 'start') {
    return <StartScreen onPlay={handlePlay} onHowTo={() => setPhase('howto')} onClose={onClose} />;
  }

  if (phase === 'howto') {
    return <HowToScreen onBack={() => setPhase('start')} />;
  }

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
        <div className="snake__hud-cell snake__hud-cell--lives">
          <span className="snake__hud-label">LIVES</span>
          <span className="snake__lives">
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span
                key={i}
                className={['snake__life', i < lives ? 'snake__life--full' : 'snake__life--empty'].join(' ')}
                aria-label={i < lives ? 'full life' : 'empty slot'}
              >
                ♥
              </span>
            ))}
          </span>
        </div>
        <div className="snake__hud-cell snake__hud-cell--legend">
          <span className="snake__legend"><span className="snake__legend-dot snake__legend-dot--food" /> TC</span>
          <span className="snake__legend"><span className="snake__legend-dot snake__legend-dot--bug" /> Defect</span>
          <span className="snake__legend"><span className="snake__legend-dot snake__legend-dot--heart" /> Life</span>
          <span className="snake__legend snake__legend--mode">
            {wrapWalls ? '🔁 walls wrap' : '🧱 walls block'}
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
        <div className="snake__hint">
          Arrows or WASD · eat TC · avoid defects · catch ♥ and answer correctly for +1 life (max {MAX_LIVES})
        </div>
      </div>

      {feedback && (
        <DamageOverlay feedback={feedback} onDismiss={handleDamageDismiss} />
      )}
      {quiz && (
        <QuizOverlay quiz={quiz} onAnswer={handleQuizAnswer} onDismiss={handleQuizDismiss} />
      )}
    </div>
  );
}

function DamageOverlay({ feedback, onDismiss }) {
  const reasonLine =
    feedback.reasonKey === 'wall' ? 'Out of bounds — the snake left the test scope.'
    : feedback.reasonKey === 'self' ? 'Self-collision — the test case ran into itself.'
    : 'A defect was hit.';
  const title = feedback.fatal ? '⚠ FATAL — NO LIVES LEFT' : '⚠ LIFE LOST';
  return (
    <div className="snake__feedback-root" role="dialog" aria-modal="true">
      <div className="snake__feedback-backdrop" />
      <div className="snake__feedback-box">
        <div className="snake__feedback-header">
          <span>{title} — ISO {feedback.isoRef}</span>
        </div>
        <div className="snake__feedback-body">
          <div className="snake__feedback-reason">{reasonLine}</div>
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
            {feedback.fatal ? 'See results →' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuizOverlay({ quiz, onAnswer, onDismiss }) {
  const isCorrect = quiz.answered && quiz.picked === quiz.correct;
  return (
    <div className="snake__feedback-root" role="dialog" aria-modal="true">
      <div className="snake__feedback-backdrop" />
      <div className="snake__feedback-box snake__feedback-box--quiz">
        <div className="snake__feedback-header snake__feedback-header--quiz">
          <span>♥ EXTRA LIFE CHALLENGE — ISO {quiz.isoRef}</span>
        </div>
        <div className="snake__feedback-body">
          <div className="snake__quiz-question">{quiz.question}</div>
          <div className="snake__quiz-choices">
            {quiz.choices.map((c, i) => {
              const picked = quiz.picked === i;
              const correct = i === quiz.correct;
              let cls = 'snake__quiz-choice';
              if (quiz.answered) {
                if (correct) cls += ' snake__quiz-choice--correct';
                else if (picked) cls += ' snake__quiz-choice--wrong';
                else cls += ' snake__quiz-choice--dim';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  disabled={quiz.answered}
                  onClick={() => onAnswer(i)}
                >
                  <span className="snake__quiz-choice-key">{String.fromCharCode(65 + i)}</span>
                  <span>{c}</span>
                </button>
              );
            })}
          </div>
          {quiz.answered && (
            <div className={['snake__quiz-result', isCorrect ? 'snake__quiz-result--ok' : 'snake__quiz-result--bad'].join(' ')}>
              {isCorrect
                ? '✓ Correct — +1 life awarded.'
                : '✗ Incorrect — no life awarded. Review the clause in iso-definitions and try the next heart.'}
            </div>
          )}
          <button
            className="snake__btn snake__btn--primary"
            disabled={!quiz.answered}
            onClick={onDismiss}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

function StartScreen({ onPlay, onHowTo, onClose }) {
  const [wrap, setWrap] = useState(false);
  return (
    <div className="snake snake--start">
      <div className="snake__start-card">
        <div className="snake__start-logo">🐍</div>
        <div className="snake__start-title">SNAKE</div>
        <div className="snake__start-subtitle">An ISO/IEC/IEEE 29119-1 mini-game</div>

        <fieldset className="snake__start-fieldset">
          <legend>Wall mode</legend>
          <label className="snake__start-radio">
            <input
              type="radio"
              name="wallmode"
              checked={!wrap}
              onChange={() => setWrap(false)}
            />
            <span><strong>Walls block</strong> — hitting a wall costs a life</span>
          </label>
          <label className="snake__start-radio">
            <input
              type="radio"
              name="wallmode"
              checked={wrap}
              onChange={() => setWrap(true)}
            />
            <span><strong>Walls wrap</strong> — exit one side, enter the opposite</span>
          </label>
        </fieldset>

        <div className="snake__start-btns">
          <button className="snake__btn snake__btn--primary snake__btn--big" onClick={() => onPlay(wrap)}>
            ▶ PLAY
          </button>
          <button className="snake__btn snake__btn--big" onClick={onHowTo}>
            ? HOW TO PLAY
          </button>
        </div>

        <button className="snake__start-quit" onClick={onClose}>Exit</button>
      </div>
    </div>
  );
}

function HowToScreen({ onBack }) {
  return (
    <div className="snake snake--start">
      <div className="snake__start-card snake__start-card--howto">
        <div className="snake__start-title">HOW TO PLAY</div>

        <div className="snake__howto-grid">
          <div className="snake__howto-icon">⬆ ⬇ ⬅ ➡</div>
          <div>Move with <strong>arrow keys</strong> or <strong>WASD</strong>. The snake cannot reverse on itself.</div>

          <div className="snake__howto-icon">🟡</div>
          <div>Eat <strong>TC</strong> (test case) discs to grow and score points. Every 5 foods the snake speeds up.</div>

          <div className="snake__howto-icon">🟥</div>
          <div>Avoid <strong>defects</strong> (red squares). Hitting one costs a life and shows the relevant ISO clause.</div>

          <div className="snake__howto-icon">♥</div>
          <div>Catch the pulsing <strong>heart</strong> to trigger an ISO quiz. Answer correctly to earn an extra life (max 2 total).</div>

          <div className="snake__howto-icon">🧱</div>
          <div><strong>Wall mode</strong> is chosen on the start screen — walls can either block (life lost) or wrap around the board.</div>

          <div className="snake__howto-icon">💀</div>
          <div>When all lives are gone, the game ends. After losing a life mid-game, play continues from where you left off.</div>
        </div>

        <button className="snake__btn snake__btn--primary snake__btn--big" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
