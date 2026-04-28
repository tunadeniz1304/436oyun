import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame.js';
import { useMotion } from '../hooks/useMotion.js';
import ProgressTracker from '../components/shared/ProgressTracker.jsx';
import './WorldMap.css';

/* ------------------------------------------------------------------ */
/*  Zone definitions (used for sidebar + routing only now)             */
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
    color: 'var(--zone1-color)',
    bg: 'var(--zone1-bg)',
    isoZone: 1,
  },
  {
    id: 'vv-headquarters',
    number: 2,
    route: '/zone/vv-headquarters',
    name: 'V&V Headquarters',
    cluster: 'Verification · Validation · Oracle',
    clauses: '§4.1.3 · §3.115',
    intro: 'Route 8 missions under a 30-second timer.',
    color: 'var(--zone2-color)',
    bg: 'var(--zone2-bg)',
    isoZone: 2,
  },
  {
    id: 'matrix-tower',
    number: 3,
    route: '/zone/matrix-tower',
    name: 'Test Matrix Tower',
    cluster: 'Levels × Types',
    clauses: '§3.108 · §3.130',
    intro: 'Pick cells in a 4×4 matrix — and justify each.',
    color: 'var(--zone3-color)',
    bg: 'var(--zone3-bg)',
    isoZone: 3,
  },
  {
    id: 'artefact-archive',
    number: 4,
    route: '/zone/artefact-archive',
    name: 'Artefact Archive',
    cluster: 'Test Basis · Test Item / Test Object',
    clauses: '§3.84 · §3.107 · §3.78 · §3.29',
    intro: 'Tag 6 artefacts. One trap. Read carefully.',
    color: 'var(--zone4-color)',
    bg: 'var(--zone4-bg)',
    isoZone: 4,
  },
  {
    id: 'final-inspection',
    number: 5,
    route: '/final-inspection',
    name: 'Final Inspection',
    cluster: 'All concepts + Test Oracle',
    clauses: '§3.115 · §4.1.10',
    intro: 'Five integrated decisions. Earn the ISO Incident Report.',
    color: 'var(--final-color)',
    bg: 'var(--final-bg)',
    isoZone: 5,
    isFinal: true,
  },
];

/* ── Isometric map (from design-export) ───────────────────────────── */

const ZONE_COLORS = {
  1: { color: 'var(--zone1-color)', tint: 'var(--zone1-tint)' },
  2: { color: 'var(--zone2-color)', tint: 'var(--zone2-tint)' },
  3: { color: 'var(--zone3-color)', tint: 'var(--zone3-tint)' },
  4: { color: 'var(--zone4-color)', tint: 'var(--zone4-tint)' },
  5: { color: 'var(--zone5-color)', tint: 'var(--zone5-tint)' },
};
const ZONE_ICONS = { 1: '◬', 2: '◇', 3: '▦', 4: '▤', 5: '◈' };
const ZONE_NAMES = {
  1: 'Error District',
  2: 'V&V Headquarters',
  3: 'Test Matrix Tower',
  4: 'Artefact Archive',
  5: 'Final Inspection',
};

function lighten(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const blend = (c) => Math.min(255, Math.round(c + (255 - c) * 0.25));
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
}
function darken(hex) {
  if (!hex || hex.startsWith('rgb')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const blend = (c) => Math.round(c * 0.7);
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
}

/* Resolve CSS variable to hex at runtime via a hidden div */
function resolveColor(cssVar) {
  // fallback colors in order for each zone
  const fallback = {
    '--zone1-color': '#993C1D',
    '--zone2-color': '#0C447C',
    '--zone3-color': '#3B6D11',
    '--zone4-color': '#854F0B',
    '--zone5-color': '#3C3489',
    '--final-color': '#3C3489',
  };
  const key = cssVar.replace('var(', '').replace(')', '').trim();
  return fallback[key] ?? '#888';
}

/* Isometric box: cx/cy = bottom-center anchor point */
function Box({ cx, cy, w, h, fill, top, side }) {
  /* Diamond corners at ground level */
  const TL = { x: cx - w,     y: cy - w * 0.5 };
  const TR = { x: cx,         y: cy - w };
  const BR = { x: cx + w,     y: cy - w * 0.5 };
  const BL = { x: cx,         y: cy };
  /* Same corners lifted by h */
  const TL2 = { x: TL.x, y: TL.y - h };
  const TR2 = { x: TR.x, y: TR.y - h };
  const BR2 = { x: BR.x, y: BR.y - h };
  const BL2 = { x: BL.x, y: BL.y - h };
  return (
    <g>
      {/* right face */}
      <polygon points={`${BL.x},${BL.y} ${BR.x},${BR.y} ${BR2.x},${BR2.y} ${BL2.x},${BL2.y}`} fill={fill} />
      {/* left face */}
      <polygon points={`${TL.x},${TL.y} ${BL.x},${BL.y} ${BL2.x},${BL2.y} ${TL2.x},${TL2.y}`} fill={side} />
      {/* top face */}
      <polygon points={`${TL2.x},${TL2.y} ${TR2.x},${TR2.y} ${BR2.x},${BR2.y} ${BL2.x},${BL2.y}`} fill={top} />
    </g>
  );
}

/* Zone 1 — Fortress: solid block + battlements + tower + flag */
function FortressBuilding({ cx, baseY, fill, top, side, unlocked }) {
  const w = 44, h = 52;
  return (
    <g>
      <Box cx={cx} cy={baseY} w={w} h={h} fill={fill} top={top} side={side} />
      {/* battlements */}
      {[-30, -16, -2, 12, 26].map((dx) => (
        <rect key={dx} x={cx + dx - w + w} y={baseY - h - 8} width={8} height={9}
          fill={side} transform={`skewX(-26)`} style={{ transformOrigin: `${cx}px ${baseY - h}px` }} />
      ))}
      {/* side tower */}
      <Box cx={cx + 22} cy={baseY - 8} w={18} h={38} fill={fill} top={top} side={side} />
      {/* door arch */}
      <ellipse cx={cx - 8} cy={baseY - 6} rx={6} ry={8} fill="#111" opacity="0.75" />
      {/* flag */}
      <line x1={cx + 22} y1={baseY - 46} x2={cx + 22} y2={baseY - 46 - 16} stroke="#3a2820" strokeWidth="1.5" />
      <polygon points={`${cx + 22},${baseY - 62} ${cx + 22 + 12},${baseY - 58} ${cx + 22},${baseY - 54}`} fill={unlocked ? '#993C1D' : '#444'} />
      {/* windows */}
      {unlocked && (
        <>
          <rect x={cx - 18} y={baseY - h * 0.6} width={5} height={7} fill="#FFD86B" opacity="0.9" />
          <rect x={cx - 8}  y={baseY - h * 0.6} width={5} height={7} fill="#FFD86B" opacity="0.7" />
        </>
      )}
    </g>
  );
}

/* Zone 2 — Glass tower: tall slim box + antenna + lit windows */
function GlassBuilding({ cx, baseY, fill, top, side, unlocked }) {
  const w = 28, h = 90;
  return (
    <g>
      <Box cx={cx} cy={baseY} w={w} h={h} fill={fill} top={top} side={side} />
      {/* antenna */}
      <line x1={cx} y1={baseY - h} x2={cx} y2={baseY - h - 22} stroke={side} strokeWidth="2" />
      <circle cx={cx} cy={baseY - h - 22} r="3" fill={unlocked ? '#FFD86B' : '#333'} />
      {/* windows grid */}
      {unlocked && [0,1,2,3,4,5].map((row) =>
        [0,1].map((col) => (
          <rect key={`${row}-${col}`}
            x={cx + 2 + col * 10} y={baseY - h + 10 + row * 14}
            width={7} height={10}
            fill={row < 3 ? '#FFD86B' : 'rgba(180,220,255,0.9)'}
            opacity={(row + col) % 2 === 0 ? 1 : 0.6} />
        ))
      )}
      {/* lobby door */}
      <rect x={cx - 5} y={baseY - 14} width={10} height={14} fill="#111" opacity="0.6" />
    </g>
  );
}

/* Zone 3 — Ziggurat: 3 stepped tiers */
function ZigguratBuilding({ cx, baseY, fill, top, side, unlocked }) {
  const tiers = [
    { w: 48, h: 22, dy: 0 },
    { w: 34, h: 20, dy: 22 },
    { w: 22, h: 26, dy: 42 },
  ];
  return (
    <g>
      {tiers.map((t, i) => (
        <Box key={i} cx={cx} cy={baseY - t.dy} w={t.w} h={t.h} fill={fill} top={top} side={side} />
      ))}
      {/* top spire */}
      <line x1={cx} y1={baseY - 68} x2={cx} y2={baseY - 68 - 14} stroke={side} strokeWidth="2" />
      <polygon points={`${cx - 5},${baseY - 68} ${cx + 5},${baseY - 68} ${cx},${baseY - 68 - 14}`} fill={top} />
      {/* tier windows */}
      {unlocked && tiers.map((t, i) => (
        <rect key={`tw-${i}`}
          x={cx + 4} y={baseY - t.dy - t.h + 6}
          width={6} height={8}
          fill="#FFD86B" opacity={0.8 - i * 0.15}>
          <animate attributeName="opacity" values={`${0.6 - i * 0.1};${0.95 - i * 0.1};${0.6 - i * 0.1}`} dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </g>
  );
}

/* Zone 4 — Bunker: wide low box + radar dish */
function BunkerBuilding({ cx, baseY, fill, top, side, unlocked }) {
  const w = 54, h = 32;
  const dishCx = cx + 16, dishCy = baseY - h - 8;
  return (
    <g>
      <Box cx={cx} cy={baseY} w={w} h={h} fill={fill} top={top} side={side} />
      {/* radar dish */}
      <line x1={dishCx} y1={baseY - h} x2={dishCx} y2={dishCy} stroke={side} strokeWidth="1.5" />
      <ellipse cx={dishCx} cy={dishCy} rx={14} ry={7} fill={side} stroke={top} strokeWidth="1" />
      <ellipse cx={dishCx} cy={dishCy} rx={9}  ry={4.5} fill="none" stroke={top} strokeWidth="0.8" opacity="0.6" />
      <circle  cx={dishCx} cy={dishCy} r={2.5} fill={top} />
      {/* tick marks around dish */}
      {[0,60,120,180,240,300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return <line key={deg}
          x1={dishCx + 9  * Math.cos(rad)} y1={dishCy + 4.5 * Math.sin(rad)}
          x2={dishCx + 12 * Math.cos(rad)} y2={dishCy + 6   * Math.sin(rad)}
          stroke={top} strokeWidth="1" />;
      })}
      {/* entry hatch */}
      <rect x={cx - 12} y={baseY - h + 4} width={14} height={10} rx="1" fill="#111" opacity="0.55" />
      {unlocked && (
        <circle cx={dishCx} cy={dishCy} r={5} fill="#FFD86B" opacity="0.7">
          <animate attributeName="r" values="5;9;5" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

/* Zone 5 — Capitol: wide base + drum + dome + spire */
function CapitolBuilding({ cx, baseY, fill, top, side, unlocked }) {
  const baseW = 50, baseH = 28;
  const drumW = 28, drumH = 16;
  const totalBase = baseH + drumH;
  return (
    <g>
      {/* columns */}
      {[-24,-12,0,12,24].map((dx) => (
        <Box key={dx} cx={cx + dx} cy={baseY - baseH + 2} w={5} h={baseH - 4} fill={side} top={top} side={side} />
      ))}
      {/* pediment */}
      <polygon
        points={`${cx - baseW},${baseY - baseH} ${cx + baseW},${baseY - baseH} ${cx},${baseY - baseH - 18}`}
        fill={top} stroke={side} strokeWidth="0.5" />
      {/* base block */}
      <Box cx={cx} cy={baseY} w={baseW} h={baseH} fill={fill} top={top} side={side} />
      {/* drum */}
      <Box cx={cx} cy={baseY - baseH} w={drumW} h={drumH} fill={fill} top={top} side={side} />
      {/* dome */}
      <ellipse cx={cx} cy={baseY - totalBase} rx={drumW} ry={drumH * 1.1} fill={top} stroke={side} strokeWidth="0.5" />
      {/* spire */}
      <line x1={cx} y1={baseY - totalBase - drumH * 1.1} x2={cx} y2={baseY - totalBase - drumH * 1.1 - 18} stroke={side} strokeWidth="2" />
      <circle cx={cx} cy={baseY - totalBase - drumH * 1.1 - 20} r="3" fill={unlocked ? '#FFD86B' : '#333'} />
      {unlocked && (
        <>
          <rect x={cx - 10} y={baseY - baseH * 0.55} width={6} height={8} fill="#FFD86B" opacity="0.9" />
          <rect x={cx + 4}  y={baseY - baseH * 0.55} width={6} height={8} fill="#FFD86B" opacity="0.7" />
        </>
      )}
    </g>
  );
}

/* Label height below the building anchor */
const LABEL_OFFSET = 32;

function Building({ cx, baseY, zone, unlocked, shape, label }) {
  const hex  = resolveColor(`var(--zone${zone}-color)`);
  const fill = unlocked ? hex        : '#3a3a3a';
  const top  = unlocked ? lighten(hex) : '#4a4a4a';
  const side = unlocked ? darken(hex)  : '#222';

  return (
    <g>
      {unlocked && (
        <ellipse cx={cx} cy={baseY + 4} rx={58} ry={26} fill="url(#warm-glow)">
          <animate attributeName="opacity" values="1;0.6;1" dur="2.4s" repeatCount="indefinite" />
        </ellipse>
      )}
      <g opacity={unlocked ? 1 : 0.38}>
        {shape === 'fortress' && <FortressBuilding cx={cx} baseY={baseY} fill={fill} top={top} side={side} unlocked={unlocked} />}
        {shape === 'glass'    && <GlassBuilding    cx={cx} baseY={baseY} fill={fill} top={top} side={side} unlocked={unlocked} />}
        {shape === 'ziggurat' && <ZigguratBuilding cx={cx} baseY={baseY} fill={fill} top={top} side={side} unlocked={unlocked} />}
        {shape === 'bunker'   && <BunkerBuilding   cx={cx} baseY={baseY} fill={fill} top={top} side={side} unlocked={unlocked} />}
        {shape === 'capitol'  && <CapitolBuilding  cx={cx} baseY={baseY} fill={fill} top={top} side={side} unlocked={unlocked} />}
      </g>
      {/* name label */}
      <g transform={`translate(${cx} ${baseY + LABEL_OFFSET})`}>
        <rect x={-52} y={-11} width={104} height={22} rx={4} fill="#fff" stroke={unlocked ? hex : '#ccc'} strokeWidth="1.2" />
        {!unlocked && <text x={-40} y={4} fontSize="10" fill="#888">🔒</text>}
        <text
          x={unlocked ? 0 : 6} y={4}
          textAnchor="middle" fontSize="10" fontWeight="700"
          fill={unlocked ? hex : '#888'} fontFamily="var(--font-mono)"
          letterSpacing="0.04em"
        >
          {label.toUpperCase()}
        </text>
      </g>
    </g>
  );
}

function Tree({ cx, cy }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <ellipse cx="0" cy="2" rx="6" ry="2" fill="rgba(0,0,0,0.18)" />
      <rect x="-1.5" y="-6" width="3" height="6" fill="#6b4a2a" />
      <polygon points="0,-26 -8,-6 8,-6" fill="#3B6D11" />
      <polygon points="0,-22 -6,-10 6,-10" fill="#4F8C19" />
      <polygon points="0,-18 -5,-12 5,-12" fill="#67A924" />
    </g>
  );
}

function IsometricMap({ completedZones, onSelect, isZoneUnlocked }) {
  const [hoveredId, setHoveredId] = useState(null);

  /*
   * Isometric projection: tile half-width = TW, tile half-height = TH
   * Screen coords: sx = ox + (gx - gy) * TW,  sy = oy + (gx + gy) * TH
   * Buildings are anchored at their tile center (sx, sy).
   * baseY for a building = sy + TH  (bottom of tile diamond).
   */
  const TW = 72, TH = 36;   // tile half-width / half-height
  const ox = 500, oy = 90;  // isometric origin (top of diamond grid)

  const proj = (gx, gy) => ({
    x: ox + (gx - gy) * TW,
    y: oy + (gx + gy) * TH,
  });

  /* Grid spans gx: 0..5, gy: 0..5 — 6×6 tiles */
  const GRID = [0, 1, 2, 3, 4, 5];

  /* Building positions (grid coords) */
  const buildings = [
    { zone: 1, gx: 1,   gy: 0,   id: 'error-district',   shape: 'fortress', label: 'Error District' },
    { zone: 2, gx: 4,   gy: 1,   id: 'vv-headquarters',  shape: 'glass',    label: 'V&V HQ' },
    { zone: 3, gx: 1,   gy: 3,   id: 'matrix-tower',     shape: 'ziggurat', label: 'Matrix Tower' },
    { zone: 4, gx: 4,   gy: 3,   id: 'artefact-archive', shape: 'bunker',   label: 'Artefact Archive' },
    { zone: 5, gx: 2.5, gy: 4.5, id: 'final-inspection', shape: 'capitol',  label: 'Final Inspection' },
  ];

  /* Paths (zone unlock chain) */
  const paths = [
    { from: [1, 0],   to: [4, 1],   fromId: 'error-district' },
    { from: [1, 0],   to: [1, 3],   fromId: 'error-district' },
    { from: [4, 1],   to: [4, 3],   fromId: 'vv-headquarters' },
    { from: [1, 3],   to: [2.5, 4.5], fromId: 'matrix-tower' },
    { from: [4, 3],   to: [2.5, 4.5], fromId: 'artefact-archive' },
  ];

  /* Stone-path tile set for ground colouring */
  const stoneSet = new Set();
  buildings.forEach((b) => stoneSet.add(`${Math.round(b.gx)},${Math.round(b.gy)}`));
  paths.forEach(({ from: [x1, y1], to: [x2, y2] }) => {
    const steps = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      stoneSet.add(`${Math.round(x1 + (x2 - x1) * t)},${Math.round(y1 + (y2 - y1) * t)}`);
    }
  });

  const trees = [
    { gx: 0, gy: 2 }, { gx: 3, gy: 0 }, { gx: 5, gy: 2 },
    { gx: 0, gy: 5 }, { gx: 5, gy: 5 }, { gx: 3, gy: 5 },
  ];

  /* Diamond tile polygon for a given grid cell */
  const tilePoly = (gx, gy) => {
    const { x, y } = proj(gx, gy);
    return `${x},${y + TH} ${x + TW},${y} ${x + TW * 2},${y + TH} ${x + TW},${y + TH * 2}`;
  };

  return (
    <svg
      viewBox="0 0 1000 600"
      width="100%" height="100%"
      style={{ display: 'block' }}
      aria-label="Isometric map of five zones"
    >
      <defs>
        <filter id="fog-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="building-shadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="7" floodColor="rgba(0,0,0,0.22)" />
        </filter>
        <filter id="building-shadow-hover" x="-35%" y="-35%" width="170%" height="170%">
          <feDropShadow dx="0" dy="9" stdDeviation="14" floodColor="rgba(0,0,0,0.34)" />
        </filter>
        <radialGradient id="fog-grad" cx="50%" cy="45%" r="55%">
          <stop offset="0%"   stopColor="#b0bec5" stopOpacity="0.92" />
          <stop offset="60%"  stopColor="#90a4ae" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#78909c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="warm-glow" cx="50%" cy="60%" r="55%">
          <stop offset="0%"   stopColor="#FFD86B" stopOpacity="0.6" />
          <stop offset="55%"  stopColor="#F5A742" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F5A742" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette-grad" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="#1a1008" stopOpacity="0" />
          <stop offset="72%"  stopColor="#1a1008" stopOpacity="0" />
          <stop offset="100%" stopColor="#1a1008" stopOpacity="0.16" />
        </radialGradient>
        <linearGradient id="path-gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#F5C16C" stopOpacity="0.7" />
          <stop offset="50%"  stopColor="#FFD86B" stopOpacity="1" />
          <stop offset="100%" stopColor="#F5C16C" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* ── Ground tiles (painter's order: back-to-front = low gy+gx first) ── */}
      {GRID.flatMap((gy) =>
        GRID.map((gx) => {
          const key = `${gx},${gy}`;
          const isStone = stoneSet.has(key);
          const isDirt  = !isStone && ((gx * 7 + gy * 13) % 5 === 0);
          const fill = isStone ? '#c8c2b2' : isDirt ? '#d9c29a' : '#c4dda0';
          return (
            <polygon
              key={key}
              points={tilePoly(gx, gy)}
              fill={fill}
              stroke="rgba(0,0,0,0.07)"
              strokeWidth="0.6"
            />
          );
        })
      )}

      {/* ── Dashed paths between zones ── */}
      {paths.map((p, i) => {
        const a = proj(p.from[0], p.from[1]);
        const b = proj(p.to[0],   p.to[1]);
        const ax = a.x + TW, ay = a.y + TH;
        const bx = b.x + TW, by = b.y + TH;
        const done   = completedZones.has(p.fromId);
        const stroke = done ? '#F5C16C' : '#7a6e5f';
        return (
          <line key={i}
            x1={ax} y1={ay} x2={bx} y2={by}
            stroke={stroke}
            strokeWidth={done ? 3.5 : 2}
            strokeDasharray={done ? 'none' : '5 7'}
            strokeLinecap="round"
            opacity={done ? 0.95 : 0.5}
            style={{ filter: done ? 'drop-shadow(0 1px 3px rgba(245,193,108,0.6))' : 'none' }}
          >
            {!done && (
              <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.8s" repeatCount="indefinite" />
            )}
          </line>
        );
      })}

      {/* ── Trees ── */}
      {trees.map((t, i) => {
        const { x, y } = proj(t.gx, t.gy);
        return <Tree key={i} cx={x + TW} cy={y + TH} />;
      })}

      {/* ── Atmospheric clouds ── */}
      <g aria-hidden="true" className="map-clouds">
        {[
          { id: 'c1', cx:  60, cy: 55, rx: 42, ry: 14, dx: 1060, dur: '32s', delay: '0s'   },
          { id: 'c2', cx: 320, cy: 28, rx: 30, ry: 10, dx: 1060, dur: '44s', delay: '-14s' },
          { id: 'c3', cx: 700, cy: 70, rx: 48, ry: 16, dx: 1060, dur: '26s', delay: '-8s'  },
        ].map((cloud) => (
          <g key={cloud.id} opacity="0.48">
            <ellipse cx={cloud.cx} cy={cloud.cy} rx={cloud.rx} ry={cloud.ry} fill="#fff" />
            <ellipse cx={cloud.cx - cloud.rx * 0.28} cy={cloud.cy - cloud.ry * 0.55} rx={cloud.rx * 0.55} ry={cloud.ry * 0.9} fill="#fff" />
            <ellipse cx={cloud.cx + cloud.rx * 0.33} cy={cloud.cy - cloud.ry * 0.4} rx={cloud.rx * 0.42} ry={cloud.ry * 0.8} fill="#fff" />
            <animateTransform attributeName="transform" type="translate"
              from={`-${cloud.dx} 0`} to="0 0"
              dur={cloud.dur} begin={cloud.delay} repeatCount="indefinite" />
          </g>
        ))}
      </g>

      {/* ── START signpost (top-left of zone 1) ── */}
      {(() => {
        const { x, y } = proj(0, 0);
        const sx = x + TW, sy = y + TH;
        const c1 = resolveColor('var(--zone1-color)');
        return (
          <g transform={`translate(${sx} ${sy - 10})`}>
            <rect x="-1" y="-20" width="2" height="20" fill="#7a5c3a" />
            <rect x="-16" y="-20" width="32" height="12" rx="2" fill="#fff" stroke={c1} strokeWidth="1.5" />
            <text x="0" y="-11" textAnchor="middle" fontFamily="var(--font-mono)" fontWeight="800" fontSize="8" fill={c1}>START</text>
          </g>
        );
      })()}

      {/* ── Buildings (painter's order: low gy+gx first) ── */}
      {[...buildings]
        .sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy))
        .map((b, i) => {
          const { x, y } = proj(b.gx, b.gy);
          const cx       = x + TW;
          const baseY    = y + TH * 2;
          const unlocked = isZoneUnlocked(b.id);
          const isHovered = hoveredId === b.id && unlocked;
          const zColor    = resolveColor(`var(--zone${b.zone}-color)`);
          const zoneDef   = ZONE_DEFS.find((z) => z.id === b.id);
          return (
            <g key={b.id}
               onClick={() => unlocked && onSelect(b.id)}
               onMouseEnter={() => unlocked && setHoveredId(b.id)}
               onMouseLeave={() => setHoveredId(null)}
               style={{
                 cursor: unlocked ? 'pointer' : 'default',
                 transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                 transition: 'transform 220ms cubic-bezier(0,0,0.2,1), filter 220ms ease',
                 filter: isHovered
                   ? `drop-shadow(0 9px 18px rgba(0,0,0,0.34))`
                   : unlocked
                     ? `drop-shadow(0 3px 10px rgba(0,0,0,0.20))`
                     : 'none',
                 animation: `iso-map-appear 0.45s ${i * 0.09}s ease-out both`,
               }}
            >
              <Building cx={cx} baseY={baseY} zone={b.zone} unlocked={unlocked} shape={b.shape} label={b.label} />
              {isHovered && (
                <g transform={`translate(${cx} ${baseY - 130})`} style={{ pointerEvents: 'none' }}>
                  <rect x="-72" y="-20" width="144" height="42" rx="7"
                    fill="#fff" stroke={zColor} strokeWidth="1.5"
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.13))' }} />
                  <text x="0" y="-3" textAnchor="middle" fontSize="10" fontWeight="700"
                    fill={zColor} fontFamily="var(--font-mono)" letterSpacing="0.05em">
                    {b.label.toUpperCase()}
                  </text>
                  <text x="0" y="13" textAnchor="middle" fontSize="9" fill="#666"
                    fontFamily="var(--font-body)">
                    {zoneDef?.clauses ?? ''}
                  </text>
                </g>
              )}
            </g>
          );
        })}

      {/* ── Fog overlays for locked zones ── */}
      {buildings.filter((b) => !isZoneUnlocked(b.id)).map((b) => {
        const { x, y } = proj(b.gx, b.gy);
        const cx    = x + TW;
        const baseY = y + TH * 2;
        return (
          <g key={`fog-${b.id}`} style={{ pointerEvents: 'none' }}>
            <ellipse cx={cx} cy={baseY - 40} rx={80} ry={60}
              fill="url(#fog-grad)" filter="url(#fog-blur)" opacity="0.88">
              <animate attributeName="opacity" values="0.82;0.95;0.82" dur="7s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx={cx + 10} cy={baseY - 60} rx={55} ry={35}
              fill="#c8d2db" opacity="0.5" filter="url(#fog-blur)">
              <animate attributeName="cx" values={`${cx+10};${cx-10};${cx+10}`} dur="11s" repeatCount="indefinite" />
            </ellipse>
          </g>
        );
      })}

      {/* ── Vignette overlay ── */}
      <rect x="0" y="0" width="1000" height="600"
        fill="url(#vignette-grad)" style={{ pointerEvents: 'none' }} />

      {/* ── Compass rose (bottom-right) ── */}
      <g transform="translate(940 540)">
        <circle r="24" fill="#fff" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
        <polygon points="0,-20 3.5,0 0,20 -3.5,0" fill="#1a1a1a" opacity="0.8" />
        <polygon points="-20,0 0,3.5 20,0 0,-3.5" fill="#1a1a1a" opacity="0.4" />
        <polygon points="0,-20 3.5,0 0,0" fill="#993C1D" />
        <text x="0" y="-12" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#fff" fontFamily="var(--font-mono)">N</text>
        <text x="13" y="2"  textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#444" fontFamily="var(--font-mono)">E</text>
        <text x="0"  y="17" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#444" fontFamily="var(--font-mono)">S</text>
        <text x="-13" y="2" textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#444" fontFamily="var(--font-mono)">W</text>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main WorldMap page                                                  */
/* ------------------------------------------------------------------ */
function WorldMap() {
  const navigate = useNavigate();
  const { state, isZoneUnlocked } = useGame();

  const completedCount = ['error-district', 'vv-headquarters', 'matrix-tower', 'artefact-archive']
    .filter((id) => state.completedZones.has(id)).length;

  const nextZone = ZONE_DEFS.find((z) => isZoneUnlocked(z.id) && !state.completedZones.has(z.id));

  const headerMotion = useMotion({
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut' },
  });

  const sidebarVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } },
  };
  const cardVariants = {
    hidden:   { opacity: 0, x: 16 },
    visible:  { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  };

  const handleSelect = (zoneId) => {
    const def = ZONE_DEFS.find((z) => z.id === zoneId);
    if (def) navigate(def.route);
  };

  return (
    <div className="world-map">
      <motion.header className="world-map__topbar" {...headerMotion}>
        <div className="world-map__topbar-left">
          <span className="world-map__incident">
            <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true">
              <path d="M9 1 L17 16 H1 Z" fill="currentColor" />
              <rect x="8.3" y="6" width="1.4" height="5" fill="#ffffff" />
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

      <main className="world-map__body">
        {/* Isometric map (left, large) */}
        <div className="world-map__map-panel">
          <IsometricMap
            completedZones={state.completedZones}
            onSelect={handleSelect}
            isZoneUnlocked={isZoneUnlocked}
          />
          <p className="world-map__no-persist">No persistence — refresh resets the game.</p>
        </div>

        {/* Sidebar (right) */}
        <motion.aside
          className="world-map__sidebar"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Progress card */}
          <motion.div className="world-map__card" variants={cardVariants}>
            <div className="world-map__card-label">Progress</div>
            <div className="world-map__card-score" style={{ color: 'var(--final-color)' }}>
              {completedCount} / 4 zones
            </div>
            <div className="world-map__progress-bar">
              <div className="world-map__progress-fill" style={{ width: `${(completedCount / 4) * 100}%` }} />
            </div>
            <div className="world-map__zone-chips">
              {ZONE_DEFS.filter((z) => !z.isFinal).map((z) => {
                const done = state.completedZones.has(z.id);
                const isNext = z.id === nextZone?.id;
                return (
                  <div
                    key={z.id}
                    className={`world-map__zone-chip ${done ? 'is-done' : isNext ? 'is-next' : ''}`}
                    style={{ '--chip-color': z.color }}
                    title={z.name}
                  >
                    {done ? '✓' : z.number}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Score card */}
          <motion.div className="world-map__card world-map__card--score" variants={cardVariants}>
            <div className="world-map__card-label">Total Score</div>
            <div className="world-map__card-bigscore" style={{ color: 'var(--final-color)' }}>
              {state.totalScore}
              <span className="world-map__card-max"> / 1000</span>
            </div>
          </motion.div>

          {/* Next up card */}
          {nextZone ? (
            <motion.div className="world-map__card world-map__card--next" variants={cardVariants}>
              <div className="world-map__card-label">Next up</div>
              <p className="world-map__card-text">
                <strong style={{ color: nextZone.color }}>{nextZone.name}</strong>
                {' '}— {nextZone.intro}
              </p>
              <button
                type="button"
                className="world-map__enter-btn"
                style={{ '--btn-color': nextZone.color }}
                onClick={() => navigate(nextZone.route)}
              >
                Enter Zone {nextZone.number} →
              </button>
            </motion.div>
          ) : completedCount === 4 ? (
            <motion.div className="world-map__card world-map__card--next" variants={cardVariants}>
              <div className="world-map__card-label">Next up</div>
              <p className="world-map__card-text">
                <strong style={{ color: 'var(--final-color)' }}>Final Inspection</strong>
                {' '}— All four zones complete. Enter the Final Inspection.
              </p>
              <button
                type="button"
                className="world-map__enter-btn"
                style={{ '--btn-color': 'var(--final-color)' }}
                onClick={() => navigate('/final-inspection')}
              >
                Enter Final Inspection →
              </button>
            </motion.div>
          ) : null}

          {/* Legend */}
          <motion.div className="world-map__card" variants={cardVariants}>
            <div className="world-map__card-label">Legend</div>
            <div className="world-map__legend">
              <div><span className="world-map__legend-dot" style={{ background: 'var(--zone1-color)' }} />Unlocked &amp; glowing</div>
              <div><span className="world-map__legend-dot" style={{ background: 'var(--ink-muted)' }} />Locked · in fog</div>
              <div><span className="world-map__legend-dot" style={{ background: '#28a745' }} />Completed</div>
            </div>
          </motion.div>
        </motion.aside>
      </main>

      <footer className="world-map__footer">
        <span>OPUS · ISO/IEC/IEEE 29119-1:2022 — Part 1: General Concepts</span>
      </footer>
    </div>
  );
}

export default WorldMap;
