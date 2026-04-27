import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame.js';
import { ZONE_META } from '../context/GameContext.jsx';
import { useMotion } from '../hooks/useMotion.js';
import ProgressTracker from '../components/shared/ProgressTracker.jsx';
import './WorldMap.css';

/* ------------------------------------------------------------------ */
/*  Zone definitions — including their (x, y) on the 1200×720 canvas  */
/* ------------------------------------------------------------------ */
const ZONE_DEFS = [
  {
    id: 'error-district',
    number: 1,
    route: '/zone/error-district',
    name: 'Error District',
    cluster: 'Error · Fault · Failure',
    clauses: '§3.39 · §3.40 · §4.7',
    intro: 'Sort 5 incident items along the causal chain.',
    pos: { x: 170, y: 540 },
    building: 'errorDistrict',
  },
  {
    id: 'vv-headquarters',
    number: 2,
    route: '/zone/vv-headquarters',
    name: 'V&V Headquarters',
    cluster: 'Verification · Validation · Oracle',
    clauses: '§4.1.3 · §3.115',
    intro: 'Route 8 missions under a 30-second timer.',
    pos: { x: 385, y: 310 },
    building: 'vvHQ',
  },
  {
    id: 'matrix-tower',
    number: 3,
    route: '/zone/matrix-tower',
    name: 'Test Matrix Tower',
    cluster: 'Levels × Types',
    clauses: '§3.108 · §3.130',
    intro: 'Pick cells in a 4×4 matrix — and justify each.',
    pos: { x: 600, y: 530 },
    building: 'matrixTower',
  },
  {
    id: 'artefact-archive',
    number: 4,
    route: '/zone/artefact-archive',
    name: 'Artefact Archive',
    cluster: 'Test Basis · Test Item / Test Object',
    clauses: '§3.84 · §3.107 · §3.78 · §3.29',
    intro: 'Tag 6 artefacts. One trap. Read carefully.',
    pos: { x: 825, y: 290 },
    building: 'archive',
  },
  {
    id: 'final-inspection',
    number: 5,
    route: '/final-inspection',
    name: 'Final Inspection',
    cluster: 'All concepts + Test Oracle',
    clauses: '§3.115 · §4.1.10',
    intro: 'Five integrated decisions. Earn the ISO Incident Report.',
    pos: { x: 1035, y: 505 },
    building: 'finalInspection',
    isFinal: true,
  },
];

/* Path connecting zone N → N+1 across the canvas (smooth bezier S-curves) */
const ROAD_SEGMENTS = [
  // Z1 (170,540) → Z2 (385,310)
  'M 170 540 C 285 540 290 310 385 310',
  // Z2 (385,310) → Z3 (600,530)
  'M 385 310 C 490 310 495 530 600 530',
  // Z3 (600,530) → Z4 (825,290)
  'M 600 530 C 720 530 720 290 825 290',
  // Z4 (825,290) → Z5 (1035,505)
  'M 825 290 C 935 290 935 505 1035 505',
];

/* ------------------------------------------------------------------ */
/*  Building art — one stylised SVG per zone landmark                 */
/* ------------------------------------------------------------------ */

function ErrorDistrictBuilding({ color, bg }) {
  // Three buildings: intact, cracked, fallen — Error → Fault → Failure
  return (
    <svg viewBox="0 0 140 150" width="140" height="150" aria-hidden="true">
      {/* shadow */}
      <ellipse cx="70" cy="142" rx="58" ry="6" fill="rgba(0,0,0,0.18)" />
      {/* building 1 — intact (Error) */}
      <rect x="10" y="62" width="32" height="78" rx="2" fill={color} />
      <rect x="14" y="68" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="24" y="68" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="14" y="82" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="24" y="82" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="14" y="96" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="24" y="96" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="32" y="68" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="32" y="82" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="32" y="96" width="6" height="8" fill={bg} opacity="0.85" />
      <rect x="20" y="120" width="12" height="20" fill={bg} opacity="0.85" />
      {/* building 2 — cracked (Fault) */}
      <rect x="50" y="48" width="36" height="92" rx="2" fill={color} />
      {/* lightning crack */}
      <path d="M68 56 L62 80 L72 86 L60 130" stroke={bg} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <rect x="56" y="60" width="6" height="8" fill={bg} opacity="0.55" />
      <rect x="76" y="60" width="6" height="8" fill={bg} opacity="0.55" />
      <rect x="56" y="100" width="6" height="8" fill={bg} opacity="0.55" />
      <rect x="76" y="100" width="6" height="8" fill={bg} opacity="0.55" />
      {/* building 3 — collapsed (Failure) */}
      <g transform="translate(105 140) rotate(-18)">
        <rect x="-8" y="-66" width="28" height="66" rx="2" fill={color} opacity="0.9" />
        <rect x="-4" y="-60" width="6" height="8" fill={bg} opacity="0.55" />
        <rect x="6"  y="-60" width="6" height="8" fill={bg} opacity="0.55" />
        <rect x="-4" y="-46" width="6" height="8" fill={bg} opacity="0.55" />
        <rect x="6"  y="-46" width="6" height="8" fill={bg} opacity="0.55" />
        {/* dust puff */}
        <circle cx="-10" cy="-2" r="6" fill={bg} opacity="0.55" />
        <circle cx="22"  cy="-3" r="5" fill={bg} opacity="0.45" />
      </g>
      {/* exclamation mark hovering */}
      <g transform="translate(122 30)">
        <circle r="9" fill={color} />
        <rect x="-1" y="-5" width="2" height="6" fill={bg} />
        <rect x="-1" y="2"  width="2" height="2" fill={bg} />
      </g>
    </svg>
  );
}

function VVHQBuilding({ color, bg }) {
  // Twin tower government-style HQ with two flags
  return (
    <svg viewBox="0 0 140 150" width="140" height="150" aria-hidden="true">
      <ellipse cx="70" cy="142" rx="58" ry="6" fill="rgba(0,0,0,0.18)" />
      {/* steps */}
      <rect x="14" y="128" width="112" height="6" fill={color} opacity="0.55" />
      <rect x="22" y="122" width="96"  height="6" fill={color} opacity="0.7" />
      {/* base */}
      <rect x="28" y="78" width="84" height="44" fill={color} />
      {/* pediment */}
      <path d="M28 78 L70 56 L112 78 Z" fill={color} opacity="0.85" />
      {/* twin towers */}
      <rect x="34" y="36" width="22" height="42" fill={color} />
      <rect x="84" y="36" width="22" height="42" fill={color} />
      {/* tower roofs */}
      <path d="M34 36 L45 22 L56 36 Z" fill={color} opacity="0.85" />
      <path d="M84 36 L95 22 L106 36 Z" fill={color} opacity="0.85" />
      {/* V letters on towers */}
      <text x="45" y="62" textAnchor="middle" fontSize="14" fontWeight="800" fill={bg} fontFamily="system-ui">V</text>
      <text x="95" y="62" textAnchor="middle" fontSize="14" fontWeight="800" fill={bg} fontFamily="system-ui">V</text>
      {/* central door */}
      <rect x="62" y="92" width="16" height="30" rx="2" fill={bg} opacity="0.9" />
      {/* columns */}
      <rect x="36" y="86" width="3" height="36" fill={bg} opacity="0.5" />
      <rect x="46" y="86" width="3" height="36" fill={bg} opacity="0.5" />
      <rect x="91" y="86" width="3" height="36" fill={bg} opacity="0.5" />
      <rect x="101" y="86" width="3" height="36" fill={bg} opacity="0.5" />
      {/* flagpoles */}
      <rect x="44.5" y="10" width="1.4" height="14" fill={color} />
      <rect x="94.5" y="10" width="1.4" height="14" fill={color} />
      <path d="M46 10 L54 13 L46 16 Z" fill={color} />
      <path d="M96 10 L104 13 L96 16 Z" fill={color} />
    </svg>
  );
}

function MatrixTowerBuilding({ color, bg }) {
  // Tall tower with 4×4 grid of windows — some lit, some dark
  return (
    <svg viewBox="0 0 140 170" width="140" height="170" aria-hidden="true">
      <ellipse cx="70" cy="162" rx="48" ry="6" fill="rgba(0,0,0,0.18)" />
      {/* base plinth */}
      <rect x="34" y="146" width="72" height="14" fill={color} opacity="0.85" />
      {/* tower */}
      <rect x="42" y="32" width="56" height="116" fill={color} />
      {/* roof step */}
      <rect x="40" y="28" width="60" height="6" fill={color} opacity="0.85" />
      {/* spire */}
      <rect x="68" y="6" width="4" height="22" fill={color} />
      <circle cx="70" cy="6" r="3" fill={color} />
      {/* 4×4 grid of windows */}
      {[0,1,2,3].map((row) =>
        [0,1,2,3].map((col) => {
          // pattern of "lit" cells (the diagonal pattern matters less than visual rhythm)
          const lit = (row + col) % 2 === 0 || (row === 1 && col === 2) || (row === 2 && col === 1);
          return (
            <rect
              key={`m-${row}-${col}`}
              x={48 + col * 12}
              y={42 + row * 24}
              width="8"
              height="14"
              rx="1"
              fill={bg}
              opacity={lit ? 0.95 : 0.35}
            />
          );
        })
      )}
      {/* door */}
      <rect x="62" y="128" width="16" height="18" rx="2" fill={bg} opacity="0.9" />
      {/* flag on spire */}
      <path d="M72 8 L82 11 L72 14 Z" fill={color} />
    </svg>
  );
}

function ArchiveBuilding({ color, bg }) {
  // Library / archive with columns + pediment
  return (
    <svg viewBox="0 0 160 150" width="160" height="150" aria-hidden="true">
      <ellipse cx="80" cy="142" rx="68" ry="6" fill="rgba(0,0,0,0.18)" />
      {/* steps */}
      <rect x="12" y="128" width="136" height="6" fill={color} opacity="0.5" />
      <rect x="22" y="122" width="116" height="6" fill={color} opacity="0.7" />
      {/* base */}
      <rect x="28" y="64" width="104" height="58" fill={color} />
      {/* pediment */}
      <path d="M22 64 L80 30 L138 64 Z" fill={color} opacity="0.9" />
      {/* pediment carving */}
      <circle cx="80" cy="56" r="6" fill={bg} opacity="0.85" />
      {/* columns */}
      {[0,1,2,3,4].map((i) => (
        <g key={`col-${i}`}>
          <rect x={36 + i * 22} y={70} width="8" height="46" fill={bg} opacity="0.92" />
          <rect x={34 + i * 22} y={68} width="12" height="3" fill={bg} opacity="0.7" />
          <rect x={34 + i * 22} y={114} width="12" height="3" fill={bg} opacity="0.7" />
        </g>
      ))}
      {/* book stacks visible in the entrance */}
      <rect x="70" y="100" width="20" height="22" fill={color} opacity="0.85" />
      <rect x="72" y="104" width="16" height="2" fill={bg} opacity="0.7" />
      <rect x="72" y="110" width="16" height="2" fill={bg} opacity="0.7" />
      <rect x="72" y="116" width="16" height="2" fill={bg} opacity="0.7" />
      {/* paper scrolls floating */}
      <g transform="translate(140 38)">
        <rect x="-6" y="-8" width="14" height="18" rx="2" fill={bg} stroke={color} strokeWidth="1.4" />
        <line x1="-3" y1="-3" x2="5" y2="-3" stroke={color} strokeWidth="0.8" />
        <line x1="-3" y1="0" x2="5" y2="0" stroke={color} strokeWidth="0.8" />
        <line x1="-3" y1="3" x2="5" y2="3" stroke={color} strokeWidth="0.8" />
      </g>
    </svg>
  );
}

function FinalInspectionBuilding({ color, bg }) {
  // Domed inspection courthouse with seal/star
  return (
    <svg viewBox="0 0 160 160" width="160" height="160" aria-hidden="true">
      <ellipse cx="80" cy="152" rx="68" ry="6" fill="rgba(0,0,0,0.18)" />
      {/* steps */}
      <rect x="10" y="138" width="140" height="6" fill={color} opacity="0.45" />
      <rect x="20" y="132" width="120" height="6" fill={color} opacity="0.65" />
      <rect x="30" y="126" width="100" height="6" fill={color} opacity="0.85" />
      {/* base */}
      <rect x="36" y="74" width="88" height="52" fill={color} />
      {/* dome drum */}
      <rect x="58" y="42" width="44" height="32" fill={color} opacity="0.92" />
      {/* dome */}
      <path d="M58 42 Q80 12 102 42 Z" fill={color} />
      {/* finial + star */}
      <rect x="79" y="6" width="2" height="10" fill={color} />
      <g transform="translate(80 6)">
        <path d="M0 -7 L2 -2 L7 -2 L3 1 L4 6 L0 3 L-4 6 L-3 1 L-7 -2 L-2 -2 Z" fill={color} />
      </g>
      {/* dome window */}
      <rect x="74" y="50" width="12" height="20" rx="6" fill={bg} opacity="0.9" />
      <rect x="74" y="50" width="12" height="20" rx="6" fill="none" stroke={color} strokeWidth="1.2" />
      {/* central door */}
      <rect x="68" y="96" width="24" height="30" rx="2" fill={bg} opacity="0.9" />
      <path d="M68 96 Q80 86 92 96" stroke={color} strokeWidth="1.5" fill="none" />
      {/* columns flanking door */}
      <rect x="44" y="86" width="4" height="40" fill={bg} opacity="0.6" />
      <rect x="54" y="86" width="4" height="40" fill={bg} opacity="0.6" />
      <rect x="102" y="86" width="4" height="40" fill={bg} opacity="0.6" />
      <rect x="112" y="86" width="4" height="40" fill={bg} opacity="0.6" />
      {/* seal on the base */}
      <circle cx="80" cy="86" r="6" fill={bg} opacity="0.9" />
      <text x="80" y="90" textAnchor="middle" fontSize="9" fontWeight="800" fill={color} fontFamily="system-ui">★</text>
    </svg>
  );
}

const BUILDINGS = {
  errorDistrict: ErrorDistrictBuilding,
  vvHQ: VVHQBuilding,
  matrixTower: MatrixTowerBuilding,
  archive: ArchiveBuilding,
  finalInspection: FinalInspectionBuilding,
};

/* ------------------------------------------------------------------ */
/*  Tiny inline icons                                                  */
/* ------------------------------------------------------------------ */
function LockGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M7 11 V8 a5 5 0 0 1 10 0 v3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="4" y="11" width="16" height="11" rx="2" fill="currentColor" />
      <circle cx="12" cy="16" r="1.6" fill="#fff" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path d="M5 12.5 L10 17 L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Zone landmark — absolutely-positioned interactive hotspot          */
/* ------------------------------------------------------------------ */
function ZoneLandmark({ def, unlocked, completed, score, isNext, onSelect, index }) {
  const meta = ZONE_META[def.id];
  const Building = BUILDINGS[def.building];
  const motionProps = useMotion({
    initial: { opacity: 0, y: 14, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.45, delay: 0.12 + index * 0.08, ease: 'easeOut' },
  });

  const status = !unlocked ? 'locked' : completed ? 'completed' : isNext ? 'next' : 'open';
  const ariaLabel =
    status === 'locked'
      ? `Zone ${def.number} ${def.name} — locked. Complete the previous zone first.`
      : status === 'completed'
        ? `Zone ${def.number} ${def.name} — completed. Score ${score} of 200. Replay.`
        : `Zone ${def.number} ${def.name}. ${def.intro} Start.`;

  return (
    <motion.div
      className={`landmark landmark--${status} ${def.isFinal ? 'landmark--final' : ''}`.trim()}
      style={{
        left:  `${(def.pos.x / 1200) * 100}%`,
        top:   `${(def.pos.y / 720)  * 100}%`,
        '--landmark-color': meta.color,
        '--landmark-bg':    meta.bg,
      }}
      {...motionProps}
    >
      {/* Floating pin marker above each landmark */}
      <div className="landmark__pin" aria-hidden="true">
        <div className="landmark__pin-flag">
          {status === 'completed' ? (
            <span className="landmark__pin-check"><CheckGlyph /></span>
          ) : status === 'locked' ? (
            <span className="landmark__pin-lock"><LockGlyph /></span>
          ) : (
            <span className="landmark__pin-num">{def.number}</span>
          )}
        </div>
        <div className="landmark__pin-stem" />
      </div>

      {/* Pulsing "you are here" beacon on the next available zone */}
      {status === 'next' ? <span className="landmark__beacon" aria-hidden="true" /> : null}

      {/* The actual building artwork */}
      <button
        type="button"
        className="landmark__btn"
        onClick={unlocked ? onSelect : undefined}
        disabled={!unlocked}
        aria-label={ariaLabel}
      >
        <span className="landmark__art">
          <Building color={meta.color} bg={meta.bg} />
        </span>

        {status === 'locked' ? <span className="landmark__fog" aria-hidden="true" /> : null}

        <span className="landmark__plate">
          <span className="landmark__plate-num">Zone {def.number}</span>
          <span className="landmark__plate-name">{def.name}</span>
        </span>
      </button>

      {/* Hover info card */}
      <div className="landmark__info" role="presentation">
        <div className="landmark__info-cluster">{def.cluster}</div>
        <div className="landmark__info-intro">{def.intro}</div>
        <div className="landmark__info-foot">
          <span className="landmark__info-clauses">{def.clauses}</span>
          <span className="landmark__info-cta">
            {status === 'locked' ? 'LOCKED'
              : status === 'completed' ? `${score} / 200`
              : def.isFinal ? 'START FINAL →'
              : 'ENTER →'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Decorative atmosphere — clouds, trees, distant blocks              */
/* ------------------------------------------------------------------ */
function MapAtmosphere() {
  return (
    <>
      {/* far-distance city blocks (very faint) */}
      <g opacity="0.18" fill="var(--ink-soft)">
        <rect x="60"   y="220" width="60" height="40" rx="3" />
        <rect x="130"  y="200" width="40" height="60" rx="3" />
        <rect x="220"  y="230" width="50" height="30" rx="3" />
        <rect x="700"  y="190" width="50" height="70" rx="3" />
        <rect x="760"  y="220" width="60" height="40" rx="3" />
        <rect x="970"  y="200" width="40" height="60" rx="3" />
        <rect x="1090" y="240" width="60" height="20" rx="3" />
      </g>

      {/* clouds */}
      <g fill="#ffffff" opacity="0.9">
        <ellipse cx="180" cy="90" rx="44" ry="14" />
        <ellipse cx="200" cy="80" rx="30" ry="14" />
        <ellipse cx="160" cy="80" rx="24" ry="12" />
      </g>
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="780" cy="70"  rx="38" ry="12" />
        <ellipse cx="800" cy="60"  rx="26" ry="12" />
      </g>
      <g fill="#ffffff" opacity="0.85">
        <ellipse cx="1050" cy="110" rx="48" ry="14" />
        <ellipse cx="1070" cy="98"  rx="30" ry="13" />
      </g>

      {/* trees */}
      <g>
        <ellipse cx="320" cy="610" rx="14" ry="18" fill="#7da06b" />
        <rect x="319" y="608" width="2" height="14" fill="#5a4022" />
      </g>
      <g>
        <ellipse cx="510" cy="445" rx="12" ry="16" fill="#7da06b" />
        <rect x="509" y="443" width="2" height="12" fill="#5a4022" />
      </g>
      <g>
        <ellipse cx="730" cy="615" rx="14" ry="18" fill="#7da06b" />
        <rect x="729" y="613" width="2" height="14" fill="#5a4022" />
      </g>
      <g>
        <ellipse cx="930" cy="430" rx="12" ry="16" fill="#7da06b" />
        <rect x="929" y="428" width="2" height="12" fill="#5a4022" />
      </g>
      <g>
        <ellipse cx="1140" cy="600" rx="14" ry="18" fill="#7da06b" />
        <rect x="1139" y="598" width="2" height="14" fill="#5a4022" />
      </g>

      {/* small ground tufts */}
      {[100, 260, 460, 690, 880, 1100].map((x) => (
        <path key={`tuft-${x}`} d={`M ${x} 670 q 4 -8 8 0 q 4 -8 8 0 q 4 -8 8 0`} stroke="#9bb47e" strokeWidth="1.2" fill="none" />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main map page                                                      */
/* ------------------------------------------------------------------ */
function WorldMap() {
  const navigate = useNavigate();
  const { state, isZoneUnlocked } = useGame();
  const completedCount = ['error-district', 'vv-headquarters', 'matrix-tower', 'artefact-archive']
    .filter((id) => state.completedZones.has(id)).length;

  // Find the next zone to complete (the first unlocked, not-completed zone)
  const nextZoneId = ZONE_DEFS.find(
    (z) => isZoneUnlocked(z.id) && !state.completedZones.has(z.id)
  )?.id;

  const headerMotion = useMotion({
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  });

  const stageMotion = useMotion({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4, delay: 0.05, ease: 'easeOut' },
  });

  return (
    <div className="world-map">
      <motion.header className="world-map__topbar" {...headerMotion}>
        <div className="world-map__topbar-left">
          <span className="world-map__incident">
            <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true">
              <path d="M9 1 L17 16 H1 Z" fill="currentColor" />
              <rect x="8.3" y="6"  width="1.4" height="5"   fill="#ffffff" />
              <rect x="8.3" y="12" width="1.4" height="1.4" fill="#ffffff" />
            </svg>
            Incident #047 · Production Outage
          </span>
          <h1 className="world-map__title">ISO Testing World</h1>
          <p className="world-map__subtitle">
            Resolve the outage by visiting all five districts. Each location
            teaches a cluster of ISO/IEC/IEEE 29119-1:2022 concepts.
          </p>
        </div>
        <div className="world-map__topbar-right">
          <ProgressTracker completed={completedCount} total={4} />
        </div>
      </motion.header>

      <motion.main className="world-map__stage" {...stageMotion}>
        {/* The illustrated SVG canvas — sky, ground, roads, atmosphere */}
        <svg
          className="world-map__art"
          viewBox="0 0 1200 720"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#cfe6f4" />
              <stop offset="60%"  stopColor="#e8f1f7" />
              <stop offset="100%" stopColor="#f3efe4" />
            </linearGradient>
            <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#f0e9d6" />
              <stop offset="100%" stopColor="#e6dec2" />
            </linearGradient>
            <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(0,0,0,0.05)" />
            </pattern>
          </defs>

          {/* sky */}
          <rect x="0" y="0" width="1200" height="350" fill="url(#skyGrad)" />
          {/* ground */}
          <rect x="0" y="350" width="1200" height="370" fill="url(#groundGrad)" />
          {/* dot texture on the ground */}
          <rect x="0" y="350" width="1200" height="370" fill="url(#dots)" />
          {/* horizon */}
          <line x1="0" y1="350" x2="1200" y2="350" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />

          <MapAtmosphere />

          {/* Roads — outer (light beige) */}
          {ROAD_SEGMENTS.map((d, i) => (
            <path
              key={`road-bg-${i}`}
              d={d}
              fill="none"
              stroke="#f5edd2"
              strokeWidth="22"
              strokeLinecap="round"
            />
          ))}
          {/* Roads — middle (cream center) */}
          {ROAD_SEGMENTS.map((d, i) => (
            <path
              key={`road-mid-${i}`}
              d={d}
              fill="none"
              stroke="#fbf8ec"
              strokeWidth="14"
              strokeLinecap="round"
            />
          ))}
          {/* Roads — dashed centerline; segments completed turn solid+colored */}
          {ROAD_SEGMENTS.map((d, i) => {
            // segment i connects ZONE_DEFS[i] -> ZONE_DEFS[i+1]
            // it's "completed" when the source zone is in completedZones
            const fromId = ZONE_DEFS[i].id;
            const completed = state.completedZones.has(fromId);
            const meta = ZONE_META[fromId];
            return (
              <path
                key={`road-line-${i}`}
                d={d}
                fill="none"
                stroke={completed ? meta.color : '#c9beae'}
                strokeWidth={completed ? 2.5 : 2}
                strokeDasharray={completed ? '0' : '6 6'}
                strokeLinecap="round"
                opacity={completed ? 0.95 : 0.7}
                className={completed ? 'road-line road-line--done' : 'road-line'}
              />
            );
          })}
        </svg>

        {/* Zone landmarks — absolutely-positioned interactive hotspots */}
        <div className="world-map__landmarks">
          {ZONE_DEFS.map((def, idx) => {
            const unlocked  = isZoneUnlocked(def.id);
            const completed = state.completedZones.has(def.id);
            const score     = state.zoneScores[def.id];
            const isNext    = def.id === nextZoneId;
            return (
              <ZoneLandmark
                key={def.id}
                def={def}
                index={idx}
                unlocked={unlocked}
                completed={completed}
                score={score}
                isNext={isNext}
                onSelect={() => navigate(def.route)}
              />
            );
          })}
        </div>
      </motion.main>

      <footer className="world-map__footer">
        <span>OPUS · ISO/IEC/IEEE 29119-1:2022 — Part 1: General Concepts</span>
      </footer>
    </div>
  );
}

export default WorldMap;
