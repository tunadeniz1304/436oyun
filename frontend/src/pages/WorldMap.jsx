import { useState, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame.js';
import { useMotion } from '../hooks/useMotion.js';
import ProgressTracker from '../components/shared/ProgressTracker.jsx';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Html, ContactShadows, Sky,
  Line, Float, useTexture,
} from '@react-three/drei';
import * as THREE from 'three';
import { normalizeScore } from '../context/scoreUtils.js';
import './WorldMap.css';

/* ── Zone definitions ───────────────────────────────────────────────── */
const ZONE_DEFS = [
  {
    id: 'error-district', number: 1, route: '/zone/error-district',
    name: 'Error District', cluster: 'Error · Fault · Failure',
    clauses: '§3.39 · §3.40 · §4.7',
    intro: 'Sort 5 incident items along the causal chain.',
    color: '#ef4444',
  },
  {
    id: 'vv-headquarters', number: 2, route: '/zone/vv-headquarters',
    name: 'V&V Headquarters', cluster: 'Verification · Validation · Oracle',
    clauses: '§4.1.3 · §3.115',
    intro: 'Route 8 missions under a 30-second timer.',
    color: '#3b82f6',
  },
  {
    id: 'matrix-tower', number: 3, route: '/zone/matrix-tower',
    name: 'Test Matrix Tower', cluster: 'Levels × Types',
    clauses: '§3.108 · §3.130',
    intro: 'Pick cells in a 4×4 matrix — and justify each.',
    color: '#10b981',
  },
  {
    id: 'artefact-archive', number: 4, route: '/zone/artefact-archive',
    name: 'Artefact Archive', cluster: 'Test Basis · Test Item / Test Object',
    clauses: '§3.84 · §3.107 · §3.78 · §3.29',
    intro: 'Tag 6 artefacts. One trap. Read carefully.',
    color: '#f59e0b',
  },
  {
    id: 'final-inspection', number: 5, route: '/final-inspection',
    name: 'Final Inspection', cluster: 'All concepts + Test Oracle',
    clauses: '§3.115 · §4.1.10',
    intro: 'Five integrated decisions. Earn the ISO Incident Report.',
    color: '#8b5cf6',
    isFinal: true,
  },
];

/* ── Campus layout ──────────────────────────────────────────────────── */
const GRID = 7;
const pos3 = (gx, gy) => [(gx - 2.5) * GRID, 0, (gy - 2.5) * GRID];

/* Pentagon road corners (in gx/gy grid space).
 * These define the asphalt loop. Buildings sit OUTSIDE this loop along the
 * sidewalk's outer edge; pedestrians walk on the sidewalk hugging the road. */
const ROAD_CORNERS = {
  'error-district':   [1.3, 0.9],
  'vv-headquarters':  [3.7, 1.1],
  'artefact-archive': [3.7, 2.9],
  'final-inspection': [2.5, 4.4],
  'matrix-tower':     [1.3, 2.9],
};

/* Centroid of the road pentagon, in world (x, z) space */
const ROAD_CENTROID = (() => {
  const pts = Object.values(ROAD_CORNERS).map(([gx, gy]) => pos3(gx, gy));
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
  const cz = pts.reduce((a, p) => a + p[2], 0) / pts.length;
  return [cx, cz];
})();

/* Push a road corner outward from the road centroid by `dist` world units */
const offsetFromCentroid = (id, dist) => {
  const [gx, gy] = ROAD_CORNERS[id];
  const [x, , z] = pos3(gx, gy);
  const dx = x - ROAD_CENTROID[0];
  const dz = z - ROAD_CENTROID[1];
  const len = Math.hypot(dx, dz) || 1;
  return [x + (dx / len) * dist, z + (dz / len) * dist];
};

/* Yaw so the building's +Z face (front) points back toward the road centroid */
const rotationToCentroid = (id) => {
  const [gx, gy] = ROAD_CORNERS[id];
  const [x, , z] = pos3(gx, gy);
  const dx = ROAD_CENTROID[0] - x;
  const dz = ROAD_CENTROID[1] - z;
  return Math.atan2(dx, dz);
};

/* ── Road & sidewalk geometry (single source of truth) ──────────────── */
const ROAD_WIDTH      = 3.5;
const SIDEWALK_WIDTH  = 1.4;
const KERB_THICK      = 0.14;
const SIDEWALK_CENTRE = ROAD_WIDTH / 2 + KERB_THICK + SIDEWALK_WIDTH / 2;

/* Buildings sit just past the OUTER edge of the sidewalk, with a small gap
 * so their footprint doesn't bury the pavement. */
const BUILDING_SETBACK =
  ROAD_WIDTH / 2 + KERB_THICK + SIDEWALK_WIDTH + 2.0;

const BUILDINGS = [
  { id: 'error-district',   shape: 'office',     label: 'Error District HQ'   },
  { id: 'vv-headquarters',  shape: 'skyscraper', label: 'V&V Tower'           },
  { id: 'matrix-tower',     shape: 'campus',     label: 'Matrix Research Hub' },
  { id: 'artefact-archive', shape: 'datacenter', label: 'Artefact Archive'    },
  { id: 'final-inspection', shape: 'hq',         label: 'Final Inspection HQ' },
];

const PATHS = [
  { from: ROAD_CORNERS['error-district'],   to: ROAD_CORNERS['vv-headquarters'],  fromId: 'error-district'   },
  { from: ROAD_CORNERS['error-district'],   to: ROAD_CORNERS['matrix-tower'],     fromId: 'error-district'   },
  { from: ROAD_CORNERS['vv-headquarters'],  to: ROAD_CORNERS['artefact-archive'], fromId: 'vv-headquarters'  },
  { from: ROAD_CORNERS['matrix-tower'],     to: ROAD_CORNERS['final-inspection'], fromId: 'matrix-tower'     },
  { from: ROAD_CORNERS['artefact-archive'], to: ROAD_CORNERS['final-inspection'], fromId: 'artefact-archive' },
];

/* ── Colour helpers ─────────────────────────────────────────────────── */
const hex2rgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/* ── Shared materials ───────────────────────────────────────────────── */
const CONCRETE = { color: '#e8e4dc', roughness: 0.85, metalness: 0 };
const LOCKED   = { color: '#c8cdd6', roughness: 0.95, metalness: 0 };

/* Mix a hex colour toward warm concrete for a tinted facade */
function tintedFacade(hex, mix = 0.78) {
  const [r, g, b] = hex2rgb(hex);
  const [br, bg, bb] = hex2rgb('#f0ebe1');
  const c = new THREE.Color(
    br * mix + r * (1 - mix),
    bg * mix + g * (1 - mix),
    bb * mix + b * (1 - mix),
  );
  return `#${c.getHexString()}`;
}

/* Glass takes a slight zone tint when unlocked */
function tintedGlass(hex) {
  const [r, g, b] = hex2rgb(hex);
  const [br, bg, bb] = hex2rgb('#b8d4e8');
  const c = new THREE.Color(
    br * 0.7 + r * 0.3,
    bg * 0.7 + g * 0.3,
    bb * 0.7 + b * 0.3,
  );
  return `#${c.getHexString()}`;
}

function Mat({ locked, color, ...props }) {
  if (locked) return <meshStandardMaterial {...LOCKED} />;
  return <meshStandardMaterial color={color} {...props} />;
}
function GlassMat({ locked, zoneColor }) {
  if (locked) return <meshStandardMaterial {...LOCKED} />;
  return (
    <meshStandardMaterial
      color={tintedGlass(zoneColor)}
      roughness={0.05}
      metalness={0.25}
      transparent
      opacity={0.82}
      emissive={zoneColor}
      emissiveIntensity={0.12}
    />
  );
}

/* Window grid — rows of small emissive cells on a facade panel */
function WindowGrid({ width, height, position, rotation = [0, 0, 0], cols = 4, rows = 5, locked, zoneColor }) {
  if (locked) return null;
  const cells = [];
  const cellW = (width / cols) * 0.55;
  const cellH = (height / rows) * 0.45;
  const stepX = width / cols;
  const stepY = height / rows;
  const startX = -width / 2 + stepX / 2;
  const startY = -height / 2 + stepY / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push(
        <mesh key={`${r}-${c}`} position={[startX + c * stepX, startY + r * stepY, 0]}>
          <planeGeometry args={[cellW, cellH]} />
          <meshStandardMaterial
            color="#fff6d0"
            emissive="#ffeaa0"
            emissiveIntensity={0.85}
            transparent
            opacity={0.95}
          />
        </mesh>
      );
    }
  }
  return (
    <group position={position} rotation={rotation}>
      {cells}
    </group>
  );
}

/* ── Zone ground patch ──────────────────────────────────────────────── */
function ZonePatch({ color, radius = 5.5, unlocked }) {
  const [r, g, b] = hex2rgb(color);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <circleGeometry args={[radius, 48]} />
      <meshBasicMaterial
        color={new THREE.Color(r, g, b)}
        transparent
        opacity={unlocked ? 0.18 : 0.06}
      />
    </mesh>
  );
}

/* ── Buildings ──────────────────────────────────────────────────────── */

function OfficeBuilding({ color, locked }) {
  const facade = locked ? CONCRETE.color : tintedFacade(color, 0.72);
  return (
    <group>
      {/* podium */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[5.5, 1.2, 4]} />
        <Mat locked={locked} color={facade} roughness={0.85} />
      </mesh>
      {/* entrance canopy */}
      <mesh position={[0, 1.35, 2.05]} castShadow>
        <boxGeometry args={[2.4, 0.12, 0.6]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.4} />
      </mesh>
      {/* main tower */}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[3.8, 5.6, 2.8]} />
        <Mat locked={locked} color={facade} roughness={0.85} />
      </mesh>
      {/* glass curtain strips */}
      {[-1.4, -0.4, 0.6, 1.6].map((dy, i) => (
        <mesh key={i} position={[0, 2.2 + dy, 1.42]} castShadow>
          <boxGeometry args={[3.5, 0.65, 0.05]} />
          <GlassMat locked={locked} zoneColor={color} />
        </mesh>
      ))}
      {/* side window rows */}
      <WindowGrid
        width={2.4} height={4.6}
        position={[1.91, 4, 0]}
        rotation={[0, Math.PI / 2, 0]}
        cols={3} rows={4}
        locked={locked} zoneColor={color}
      />
      <WindowGrid
        width={2.4} height={4.6}
        position={[-1.91, 4, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        cols={3} rows={4}
        locked={locked} zoneColor={color}
      />
      {/* colour accent band */}
      <mesh position={[0, 6.96, 0]}>
        <boxGeometry args={[3.9, 0.22, 2.9]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.35} />
      </mesh>
      {/* roof details */}
      <mesh position={[1.2, 7.5, 0.5]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
        <meshStandardMaterial color="#b0b8c4" roughness={0.9} />
      </mesh>
      <mesh position={[-1.0, 7.4, -0.4]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.5]} />
        <meshStandardMaterial color="#b0b8c4" roughness={0.9} />
      </mesh>
      {/* satellite dish */}
      <mesh position={[-1.0, 7.95, -0.4]} rotation={[Math.PI / 4, 0, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.08, 16]} />
        <meshStandardMaterial color="#dcdcdc" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Skyscraper({ color, locked }) {
  const facade = locked ? CONCRETE.color : tintedFacade(color, 0.7);
  return (
    <group>
      {/* wide lobby base */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[4.5, 1.6, 4.5]} />
        <Mat locked={locked} color={facade} roughness={0.8} />
      </mesh>
      {/* lobby glass band */}
      {!locked && (
        <mesh position={[0, 0.8, 2.26]}>
          <boxGeometry args={[3.6, 1, 0.06]} />
          <GlassMat locked={false} zoneColor={color} />
        </mesh>
      )}
      {/* lower shaft */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <boxGeometry args={[3.2, 4.4, 3.2]} />
        <GlassMat locked={locked} zoneColor={color} />
      </mesh>
      {/* lower shaft window grid */}
      <WindowGrid
        width={2.6} height={3.6}
        position={[0, 4.6, 1.62]}
        cols={4} rows={5}
        locked={locked} zoneColor={color}
      />
      <WindowGrid
        width={2.6} height={3.6}
        position={[0, 4.6, -1.62]}
        rotation={[0, Math.PI, 0]}
        cols={4} rows={5}
        locked={locked} zoneColor={color}
      />
      <WindowGrid
        width={2.6} height={3.6}
        position={[1.62, 4.6, 0]}
        rotation={[0, Math.PI / 2, 0]}
        cols={4} rows={5}
        locked={locked} zoneColor={color}
      />
      <WindowGrid
        width={2.6} height={3.6}
        position={[-1.62, 4.6, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        cols={4} rows={5}
        locked={locked} zoneColor={color}
      />
      {/* upper shaft */}
      <mesh position={[0.2, 9.8, 0.2]} castShadow>
        <boxGeometry args={[2.2, 5.6, 2.2]} />
        <GlassMat locked={locked} zoneColor={color} />
      </mesh>
      {/* upper shaft window grid */}
      <WindowGrid
        width={1.7} height={4.6}
        position={[0.2, 9.8, 1.12]}
        cols={3} rows={6}
        locked={locked} zoneColor={color}
      />
      <WindowGrid
        width={1.7} height={4.6}
        position={[0.2, 9.8, -0.72]}
        rotation={[0, Math.PI, 0]}
        cols={3} rows={6}
        locked={locked} zoneColor={color}
      />
      {/* crown band */}
      <mesh position={[0.2, 12.7, 0.2]}>
        <boxGeometry args={[2.3, 0.25, 2.3]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.4} />
      </mesh>
      {/* spire */}
      <mesh position={[0.2, 14.2, 0.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.18, 3, 8]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.6} />
      </mesh>
      {/* spire beacon */}
      {!locked && (
        <mesh position={[0.2, 15.8, 0.2]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
        </mesh>
      )}
      {/* setback accent */}
      <mesh position={[0, 6.95, 0]}>
        <boxGeometry args={[3.3, 0.18, 3.3]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.3} />
      </mesh>
    </group>
  );
}

function CampusBuilding({ color, locked }) {
  const facade = locked ? CONCRETE.color : tintedFacade(color, 0.72);
  return (
    <group>
      {/* wide low hall */}
      <mesh position={[0, 0.9, 0.5]} castShadow>
        <boxGeometry args={[6, 1.8, 4.5]} />
        <Mat locked={locked} color={facade} roughness={0.85} />
      </mesh>
      {/* glass atrium front */}
      <mesh position={[0, 1.5, 2.55]}>
        <boxGeometry args={[4, 2.2, 0.12]} />
        <GlassMat locked={locked} zoneColor={color} />
      </mesh>
      {/* atrium window dots */}
      <WindowGrid
        width={3.6} height={1.8}
        position={[0, 1.5, 2.62]}
        cols={6} rows={2}
        locked={locked} zoneColor={color}
      />
      {/* side windows */}
      <WindowGrid
        width={3.4} height={1.3}
        position={[3.01, 1.1, 0.5]}
        rotation={[0, Math.PI / 2, 0]}
        cols={5} rows={2}
        locked={locked} zoneColor={color}
      />
      <WindowGrid
        width={3.4} height={1.3}
        position={[-3.01, 1.1, 0.5]}
        rotation={[0, -Math.PI / 2, 0]}
        cols={5} rows={2}
        locked={locked} zoneColor={color}
      />
      {/* rear tower */}
      <mesh position={[-1.5, 3.8, -0.8]} castShadow>
        <boxGeometry args={[2.2, 4.2, 2.2]} />
        <Mat locked={locked} color={facade} roughness={0.85} />
      </mesh>
      {/* rear tower windows */}
      <WindowGrid
        width={1.6} height={3.2}
        position={[-1.5, 3.8, 0.32]}
        cols={3} rows={4}
        locked={locked} zoneColor={color}
      />
      {/* colour wall stripe */}
      <mesh position={[-1.5, 3.8, -1.92]}>
        <boxGeometry args={[2.3, 4.3, 0.1]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.3} />
      </mesh>
      {/* rooftop solar panel */}
      {!locked && (
        <mesh position={[1.4, 1.93, 0.5]} rotation={[-Math.PI / 12, 0, 0]} castShadow>
          <boxGeometry args={[2.4, 0.06, 1.6]} />
          <meshStandardMaterial color="#1a2540" roughness={0.3} metalness={0.5} emissive="#0a1430" emissiveIntensity={0.2} />
        </mesh>
      )}
      {/* roof parapet */}
      <mesh position={[0, 1.86, 0.5]}>
        <boxGeometry args={[6.1, 0.18, 4.6]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.25} />
      </mesh>
    </group>
  );
}

function DataCenter({ color, locked }) {
  const facade = locked ? CONCRETE.color : tintedFacade(color, 0.72);
  return (
    <group>
      {/* main block */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[5.5, 3.6, 4]} />
        <Mat locked={locked} color={facade} roughness={0.85} />
      </mesh>
      {/* secondary block */}
      <mesh position={[0, 1.2, -2.6]} castShadow>
        <boxGeometry args={[4, 2.4, 1.2]} />
        <Mat locked={locked} color={facade} roughness={0.85} />
      </mesh>
      {/* vent strips */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 1.6, 1.8, 2.02]}>
          <boxGeometry args={[1.1, 3.5, 0.08]} />
          <meshStandardMaterial color="#9aa4b2" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      {/* status indicator LEDs on vent strips */}
      {!locked && [-1, 0, 1].map((i) => (
        <mesh key={`led-${i}`} position={[i * 1.6, 3.1, 2.08]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
        </mesh>
      ))}
      {/* side window slits */}
      <WindowGrid
        width={3.2} height={1.8}
        position={[-2.78, 2.2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        cols={5} rows={1}
        locked={locked} zoneColor={color}
      />
      {/* colour tech stripe */}
      <mesh position={[2.78, 1.8, 0]}>
        <boxGeometry args={[0.1, 3, 1.2]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.5} />
      </mesh>
      {/* roof AC units */}
      {[[-1.5, 0.8], [0.5, -0.8], [1.8, 0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 3.8, z]} castShadow>
          <boxGeometry args={[0.9, 0.55, 0.9]} />
          <meshStandardMaterial color="#8899aa" roughness={0.9} metalness={0.3} />
        </mesh>
      ))}
      {/* tall antenna mast */}
      <mesh position={[-2.2, 4.6, -1.5]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.8, 8]} />
        <meshStandardMaterial color="#6b7280" roughness={0.6} />
      </mesh>
      {!locked && (
        <mesh position={[-2.2, 5.55, -1.5]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#ff4444" emissive="#ff4444" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  );
}

function ExecutiveHQ({ color, locked }) {
  const drumColor = locked ? '#c8cdd6' : tintedFacade(color, 0.82);
  return (
    <group>
      {/* wide podium ring */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[4.5, 4.5, 1, 32]} />
        <Mat locked={locked} color={drumColor} roughness={0.75} />
      </mesh>
      {/* podium accent ring */}
      <mesh position={[0, 1.02, 0]}>
        <torusGeometry args={[4.5, 0.08, 10, 48]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.5} />
      </mesh>
      {/* columns */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 3.5, 1.8, Math.sin(a) * 3.5]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 2.6, 12]} />
            <meshStandardMaterial color={locked ? '#bbb' : '#f0ece4'} roughness={0.7} />
          </mesh>
        );
      })}
      {/* uplights at column bases */}
      {!locked && Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={`u-${i}`} position={[Math.cos(a) * 3.5, 0.55, Math.sin(a) * 3.5]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
          </mesh>
        );
      })}
      {/* main drum */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <cylinderGeometry args={[3.2, 3.2, 1.8, 32]} />
        <Mat locked={locked} color={drumColor} roughness={0.6} metalness={0} />
      </mesh>
      {/* drum window band */}
      {!locked && Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh
            key={`win-${i}`}
            position={[Math.cos(a) * 3.21, 2.4, Math.sin(a) * 3.21]}
            rotation={[0, -a + Math.PI / 2, 0]}
          >
            <planeGeometry args={[0.65, 0.85]} />
            <meshStandardMaterial
              color="#fff6d0"
              emissive="#ffeaa0"
              emissiveIntensity={0.8}
              transparent
              opacity={0.95}
            />
          </mesh>
        );
      })}
      {/* accent ring */}
      <mesh position={[0, 3.35, 0]}>
        <torusGeometry args={[3.25, 0.12, 12, 48]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.5} />
      </mesh>
      {/* dome */}
      <mesh position={[0, 3.4, 0]} castShadow>
        <sphereGeometry args={[3.0, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={locked ? '#c8cdd6' : '#dce8f4'}
          roughness={0.1}
          metalness={0.05}
          transmission={locked ? 0 : 0.35}
          ior={1.4}
          thickness={1.5}
        />
      </mesh>
      {/* dome accent */}
      <mesh position={[0, 6.38, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.8} />
      </mesh>
      {/* flag pole */}
      {!locked && (
        <>
          <mesh position={[0, 7.2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.5, 8]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          <mesh position={[0.35, 7.6, 0]}>
            <planeGeometry args={[0.6, 0.4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ── Street lamp ────────────────────────────────────────────────────── */
function StreetLamp({ position, rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* base plate */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.1, 12]} />
        <meshStandardMaterial color="#4a5260" roughness={0.7} />
      </mesh>
      {/* pole */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 5, 7]} />
        <meshStandardMaterial color="#78869a" roughness={0.7} />
      </mesh>
      {/* arm */}
      <mesh position={[0.5, 4.9, 0]}>
        <boxGeometry args={[1, 0.12, 0.12]} />
        <meshStandardMaterial color="#78869a" roughness={0.7} />
      </mesh>
      {/* lamp */}
      <mesh position={[1, 4.85, 0]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#fffde7" emissive="#fffde7" emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
}

/* ── Road segment — asphalt + centre line, plus a sidewalk ONLY on the
 * outer side (facing the buildings). The inner side (facing the plaza) is
 * left to the plaza floor itself. ───────────────────────────────────── */
function RoadSegment({ seg, isCompleted }) {
  const s = new THREE.Vector3(seg.start[0], 0, seg.start[2]);
  const e = new THREE.Vector3(seg.end[0], 0, seg.end[2]);
  const mid = s.clone().add(e).multiplyScalar(0.5);
  const length = s.distanceTo(e);
  const angle = Math.atan2(e.z - s.z, e.x - s.x);
  // overshoot so corners knit
  const sidewalkLen = length + SIDEWALK_WIDTH;

  // Local +Z is to the LEFT of travel direction. Pick whichever local side is
  // farther from the road centroid → that's the OUTER side (toward buildings).
  // Travel direction in world: (cos angle, sin angle). Left-normal: (-sin, cos).
  const leftWorld = [mid.x - Math.sin(angle), mid.z + Math.cos(angle)];
  const dLeft  = Math.hypot(leftWorld[0]  - ROAD_CENTROID[0], leftWorld[1]  - ROAD_CENTROID[1]);
  const dMid   = Math.hypot(mid.x - ROAD_CENTROID[0], mid.z - ROAD_CENTROID[1]);
  const outerSign = dLeft > dMid ? 1 : -1; // +1 means outer side is local +Z

  const linePoints = [
    new THREE.Vector3(-length / 2, 0, 0),
    new THREE.Vector3( length / 2, 0, 0),
  ];

  return (
    <group position={[mid.x, 0, mid.z]} rotation={[0, -angle, 0]}>
      {/* asphalt */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[length, 0.08, ROAD_WIDTH]} />
        <meshStandardMaterial color="#3a3f48" roughness={0.95} />
      </mesh>
      {/* kerb on the outer side only */}
      <mesh position={[0, 0.085, outerSign * (ROAD_WIDTH / 2 + KERB_THICK / 2)]}>
        <boxGeometry args={[length, 0.05, KERB_THICK]} />
        <meshStandardMaterial color="#7a7363" roughness={0.85} />
      </mesh>
      {/* sidewalk on the outer side only — facing the buildings */}
      <mesh
        position={[0, 0.07, outerSign * SIDEWALK_CENTRE]}
        receiveShadow
      >
        <boxGeometry args={[sidewalkLen, 0.1, SIDEWALK_WIDTH]} />
        <meshStandardMaterial color="#bfb7a1" roughness={0.92} />
      </mesh>
      {/* centre line */}
      <Line
        points={linePoints}
        color={isCompleted ? '#60a5fa' : '#6b7280'}
        lineWidth={isCompleted ? 4 : 2}
        dashed={!isCompleted}
        dashScale={0.4}
        dashSize={1.2}
        dashOffset={0}
        transparent
        opacity={isCompleted ? 0.9 : 0.5}
        position={[0, 0.12, 0]}
      />
    </group>
  );
}

function MapPaths({ completedZones }) {
  const segments = PATHS.map((p) => ({
    start: pos3(p.from[0], p.from[1]),
    end:   pos3(p.to[0],   p.to[1]),
    fromId: p.fromId,
  }));

  // Each pentagon corner gets two stacked patches that knit the adjoining
  // segments cleanly:
  //   • asphalt disc (full circle, road half-width + small overshoot)
  //   • sidewalk arc on the OUTER side only (sector facing away from centroid)
  const asphaltRadius    = ROAD_WIDTH / 2 + 0.15;
  const sidewalkOuterRad = ROAD_WIDTH / 2 + KERB_THICK + SIDEWALK_WIDTH + 0.05;
  const kerbOuterRad     = ROAD_WIDTH / 2 + KERB_THICK + 0.02;

  return (
    <group>
      {Object.entries(ROAD_CORNERS).map(([id, [gx, gy]]) => {
        const [x, , z] = pos3(gx, gy);
        // Find the two segments meeting at this corner. The "outward" direction
        // is roughly the average of the two unit vectors pointing AWAY from the
        // neighbours (i.e. opposite of vectors to the neighbours).
        const neighbours = segments
          .filter((s) =>
            (Math.abs(s.start[0] - x) < 0.01 && Math.abs(s.start[2] - z) < 0.01) ||
            (Math.abs(s.end[0]   - x) < 0.01 && Math.abs(s.end[2]   - z) < 0.01)
          )
          .map((s) => {
            const other = (Math.abs(s.start[0] - x) < 0.01 && Math.abs(s.start[2] - z) < 0.01)
              ? s.end : s.start;
            const dx = other[0] - x;
            const dz = other[2] - z;
            const len = Math.hypot(dx, dz) || 1;
            return [dx / len, dz / len];
          });
        // Outward bisector = -(n1 + n2)/2, then normalised
        const sumX = neighbours.reduce((a, n) => a + n[0], 0);
        const sumZ = neighbours.reduce((a, n) => a + n[1], 0);
        const inwardLen = Math.hypot(sumX, sumZ) || 1;
        const outDx = -sumX / inwardLen;
        const outDz = -sumZ / inwardLen;
        // Sweep half-angle for the visible outer arc — wide enough to cover the
        // gap between adjacent segments' outer sidewalks.
        // ringGeometry thetaStart=0 points along +X in the mesh's local frame.
        // After rotation [-π/2, 0, 0] (so the ring lies in the XZ plane), the
        // angle increases CCW when viewed from above. We want the arc centred
        // on the outward direction in world XZ:
        const outAngle = Math.atan2(outDz, outDx);
        const halfSweep = Math.PI * 0.55;
        // Compensate for the X-axis rotation: a positive thetaStart in the
        // unrotated ring maps to -Z in world, so flip the angle sign.
        const thetaStart = -outAngle - halfSweep;
        const thetaLength = halfSweep * 2;

        return (
          <group key={`corner-${id}`} position={[x, 0, z]}>
            {/* sidewalk arc — outer sector only */}
            <mesh
              position={[0, 0.069, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <ringGeometry
                args={[asphaltRadius - 0.01, sidewalkOuterRad, 36, 1, thetaStart, thetaLength]}
              />
              <meshStandardMaterial color="#bfb7a1" roughness={0.92} />
            </mesh>
            {/* kerb arc — narrow dark seam, matches sidewalk sector */}
            <mesh
              position={[0, 0.084, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry
                args={[asphaltRadius - 0.01, kerbOuterRad, 36, 1, thetaStart, thetaLength]}
              />
              <meshStandardMaterial color="#7a7363" roughness={0.85} />
            </mesh>
            {/* asphalt disc on top */}
            <mesh
              position={[0, 0.041, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <circleGeometry args={[asphaltRadius, 24]} />
              <meshStandardMaterial color="#3a3f48" roughness={0.95} />
            </mesh>
          </group>
        );
      })}
      {segments.map((seg, i) => (
        <RoadSegment key={i} seg={seg} isCompleted={completedZones.has(seg.fromId)} />
      ))}
    </group>
  );
}

/* ── Pentagon road loop in world (x, z) — derived from ROAD_CORNERS ── */
/* Order: Error → V&V → Artefact → Final → Matrix → Error (CW on screen).
 * Used by lamp placement, traffic routes, and pedestrian sidewalk routes. */
const PENTAGON_WAYPOINTS = [
  ROAD_CORNERS['error-district'],
  ROAD_CORNERS['vv-headquarters'],
  ROAD_CORNERS['artefact-archive'],
  ROAD_CORNERS['final-inspection'],
  ROAD_CORNERS['matrix-tower'],
].map(([gx, gy]) => {
  const [x, , z] = pos3(gx, gy);
  return [x, z];
});

const PENTAGON_REVERSE = [...PENTAGON_WAYPOINTS].reverse();

/* ── Street lamps along the OUTER sidewalk of the pentagon ──────────── */
/* For each pentagon segment we place 2 lamps along its outer kerb, with the
 * lamp arm pointing back toward the road centroid (so the light hangs over
 * the asphalt, not over the building). */
const LAMP_PLACEMENTS = (() => {
  const out = [];
  for (let i = 0; i < PENTAGON_WAYPOINTS.length; i++) {
    const a = PENTAGON_WAYPOINTS[i];
    const b = PENTAGON_WAYPOINTS[(i + 1) % PENTAGON_WAYPOINTS.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    const ux = dx / len;
    const uz = dz / len;
    // Right-hand normal of travel direction (a → b). We'll test whether this
    // side is OUTER by checking which is farther from the road centroid.
    const rightX = -uz;
    const rightZ =  ux;
    const midX = (a[0] + b[0]) / 2;
    const midZ = (a[1] + b[1]) / 2;
    const probeOut = Math.hypot(
      midX + rightX - ROAD_CENTROID[0],
      midZ + rightZ - ROAD_CENTROID[1],
    );
    const probeMid = Math.hypot(midX - ROAD_CENTROID[0], midZ - ROAD_CENTROID[1]);
    const outerSign = probeOut > probeMid ? 1 : -1;
    const nx = rightX * outerSign;
    const nz = rightZ * outerSign;

    // Two lamp positions along the segment, at ~25% and ~75% of its length,
    // offset onto the outer sidewalk centre.
    [0.25, 0.75].forEach((t) => {
      const px = a[0] + ux * len * t + nx * SIDEWALK_CENTRE;
      const pz = a[1] + uz * len * t + nz * SIDEWALK_CENTRE;
      // Lamp arm should point INWARD (toward the road), i.e. opposite of nx,nz.
      // The default StreetLamp arm extends along its local +X axis. A rotation
      // of Y=α rotates +X into world direction (cos α, sin α) in (x, z).
      // So to align local +X with inward = (-nx, -nz): α = atan2(-nz, -nx).
      const armRot = Math.atan2(-nz, -nx);
      out.push({ position: [px, 0, pz], rotation: armRot });
    });
  }
  return out;
})();

/* ── Procedural trees ───────────────────────────────────────────────── */
const TREES = [
  { p: [-18, 0, -14], s: 1.0 }, { p: [-22, 0, 2], s: 1.2 },
  { p: [-19, 0, 19], s: 0.9 }, { p: [-12, 0, -22], s: 1.1 },
  { p: [-8, 0, 24], s: 0.85 }, { p: [0, 0, -23], s: 1.0 },
  { p: [8, 0, 24], s: 1.15 }, { p: [15, 0, -21], s: 0.9 },
  { p: [21, 0, -8], s: 1.0 }, { p: [23, 0, 9], s: 1.1 },
  { p: [21, 0, 21], s: 0.9 }, { p: [13, 0, 25], s: 1.05 },
  { p: [-25, 0, -5], s: 1.0 }, { p: [-23, 0, 13], s: 0.95 },
  { p: [6, 0, -25], s: 1.1 }, { p: [25, 0, -1], s: 0.9 },
  { p: [-17, 0, -19], s: 1.0 }, { p: [17, 0, -17], s: 1.2 },
  { p: [-5, 0, 25], s: 0.85 }, { p: [5, 0, -27], s: 1.0 },
  { p: [-27, 0, 5], s: 0.95 }, { p: [27, 0, -5], s: 1.0 },
  { p: [23, 0, -19], s: 0.9 }, { p: [-20, 0, 22], s: 1.1 },
  { p: [14, 0, 27], s: 1.0 },
];

const TREE_GREENS = [
  ['#2d7a2a', '#3d9638'],
  ['#3a8c3a', '#52b04d'],
  ['#2f6b34', '#46924a'],
  ['#4a9a3e', '#5fb852'],
  ['#286a26', '#3a8e36'],
];

function Trees() {
  return (
    <group>
      {TREES.map(({ p, s }, i) => {
        const [lower, upper] = TREE_GREENS[i % TREE_GREENS.length];
        return (
          <group key={i} position={p} scale={s}>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.13, 0.2, 1.1, 7]} />
              <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
            </mesh>
            <mesh position={[0, 2.0, 0]}>
              <sphereGeometry args={[0.9, 10, 10]} />
              <meshStandardMaterial color={lower} roughness={0.9} />
            </mesh>
            <mesh position={[0, 2.85, 0]}>
              <sphereGeometry args={[0.58, 10, 10]} />
              <meshStandardMaterial color={upper} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ── Flower bushes — scattered colour pops near roads ───────────────── */
const BUSHES = [
  { p: [-6, 0, -8],  c: '#e85d75' },
  { p: [6, 0, -8],   c: '#f5a623' },
  { p: [-6, 0, 9],   c: '#b667d4' },
  { p: [6, 0, 9],    c: '#ffd56b' },
  { p: [-11, 0, 0],  c: '#ff8a5b' },
  { p: [11, 0, 0],   c: '#9be564' },
  { p: [-2, 0, -14], c: '#e85d75' },
  { p: [2, 0, 15],   c: '#f5a623' },
];

function Bushes() {
  return (
    <group>
      {BUSHES.map(({ p, c }, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.45, 10, 10]} />
            <meshStandardMaterial color="#3a7a32" roughness={0.9} />
          </mesh>
          <mesh position={[0.18, 0.55, 0.1]}>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshStandardMaterial color={c} roughness={0.7} emissive={c} emissiveIntensity={0.15} />
          </mesh>
          <mesh position={[-0.15, 0.5, -0.1]}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color={c} roughness={0.7} emissive={c} emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Central plaza fountain ─────────────────────────────────────────── */
function FountainJet() {
  const jetRef = useRef();
  const dropletsRef = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (jetRef.current) {
      const s = 1 + Math.sin(t * 2.6) * 0.06;
      jetRef.current.scale.y = s;
    }
    dropletsRef.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 1.4 + i * 0.35) % 1.6;
      const angle = (i / 8) * Math.PI * 2;
      const radius = 0.35 + phase * 0.5;
      const height = 2.45 - Math.pow(phase - 0.2, 2) * 2.6;
      m.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      const fade = Math.max(0, 1 - phase / 1.6);
      m.scale.setScalar(0.6 + fade * 0.4);
      if (m.material) m.material.opacity = 0.4 + fade * 0.55;
    });
  });

  return (
    <group>
      {/* central water jet */}
      <mesh ref={jetRef} position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.08, 0.18, 1.4, 12, 1, true]} />
        <meshStandardMaterial
          color="#cfe8ff"
          emissive="#7cc4ff"
          emissiveIntensity={0.6}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* arching droplets */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} ref={(el) => (dropletsRef.current[i] = el)}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial
            color="#dff1ff"
            emissive="#9bd8ff"
            emissiveIntensity={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function Fountain() {
  return (
    <group position={[0, 0, 0]}>
      {/* basin rim */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 1.75, 0.36, 40]} />
        <meshStandardMaterial color="#cfc6b0" roughness={0.85} />
      </mesh>
      {/* basin inner water (slightly recessed disc) */}
      <mesh position={[0, 0.34, 0]} receiveShadow>
        <cylinderGeometry args={[1.55, 1.55, 0.06, 40]} />
        <meshStandardMaterial
          color="#7cc4ff"
          emissive="#3a9be0"
          emissiveIntensity={0.35}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* basin trim ring */}
      <mesh position={[0, 0.37, 0]}>
        <torusGeometry args={[1.55, 0.04, 10, 48]} />
        <meshStandardMaterial color="#b8aa8c" roughness={0.7} />
      </mesh>
      {/* central pedestal */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.55, 0.6, 16]} />
        <meshStandardMaterial color="#d7cdb4" roughness={0.8} />
      </mesh>
      {/* mid-tier bowl */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.55, 0.18, 24]} />
        <meshStandardMaterial color="#cfc6b0" roughness={0.8} />
      </mesh>
      {/* mid-tier water dish */}
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.04, 24]} />
        <meshStandardMaterial
          color="#7cc4ff"
          emissive="#3a9be0"
          emissiveIntensity={0.35}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* upper stem */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 0.5, 14]} />
        <meshStandardMaterial color="#d7cdb4" roughness={0.8} />
      </mesh>
      {/* top finial */}
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#b8aa8c" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* animated water */}
      <FountainJet />
    </group>
  );
}

/* ── Plaza furniture: bench ─────────────────────────────────────────── */
function Bench({ position = [0, 0, 0], rotation = 0 }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* seat */}
      <mesh position={[0, 0.34, 0]} castShadow>
        <boxGeometry args={[1.8, 0.08, 0.42]} />
        <meshStandardMaterial color="#8a5a32" roughness={0.85} />
      </mesh>
      {/* backrest */}
      <mesh position={[0, 0.62, -0.17]} castShadow>
        <boxGeometry args={[1.8, 0.46, 0.07]} />
        <meshStandardMaterial color="#8a5a32" roughness={0.85} />
      </mesh>
      {/* end supports */}
      {[-0.82, 0.82].map((x, i) => (
        <mesh key={i} position={[x, 0.17, 0]} castShadow>
          <boxGeometry args={[0.08, 0.34, 0.42]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Seated person — anatomically aligned to bench seat ─────────────── */
/* Bench seat top sits at world Y ≈ 0.38 (seat centre 0.34, half-height 0.04).
 * Hip pivot is at Y = 0.42, slightly back of the bench centre at Z = -0.05.
 * Upper legs extend forward (+Z) horizontally, lower legs hang down from the knee.
 * Forward face of the figure is +Z (matches Bench's front-facing convention). */
function SeatedPerson({ position = [0, 0, 0], rotation = 0, shirt = '#ff6b6b' }) {
  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.008;
  });

  const skin = '#f3c8a4';
  const pants = '#34495e';

  // Pose constants
  const hipY = 0.42;
  const hipZ = -0.05;
  const thighLen = 0.34;
  const shinLen = 0.34;
  const kneeZ = hipZ + thighLen;   // 0.29
  const legX = 0.08;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Upper legs — horizontal, forward from hip to knee.
          Box rotated 90° around X so its long axis lies along +Z. */}
      <mesh position={[ legX, hipY, hipZ + thighLen / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.09, thighLen, 0.1]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>
      <mesh position={[-legX, hipY, hipZ + thighLen / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.09, thighLen, 0.1]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>

      {/* Lower legs — vertical, hanging from knee toward the ground.
          Top of shin meets knee at (legX, hipY, kneeZ); centre is half-length below. */}
      <mesh position={[ legX, hipY - shinLen / 2, kneeZ]}>
        <boxGeometry args={[0.09, shinLen, 0.09]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>
      <mesh position={[-legX, hipY - shinLen / 2, kneeZ]}>
        <boxGeometry args={[0.09, shinLen, 0.09]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>

      {/* Shoes */}
      <mesh position={[ legX, hipY - shinLen + 0.03, kneeZ + 0.05]}>
        <boxGeometry args={[0.1, 0.05, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      <mesh position={[-legX, hipY - shinLen + 0.03, kneeZ + 0.05]}>
        <boxGeometry args={[0.1, 0.05, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>

      {/* Torso — sits on hip, leans back slightly to rest against backrest */}
      <mesh position={[0, hipY + 0.2, hipZ - 0.04]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.26, 0.4, 0.18]} />
        <meshStandardMaterial color={shirt} roughness={0.8} />
      </mesh>

      {/* Arms — shoulders → forearms resting on thighs */}
      <mesh position={[ 0.18, hipY + 0.18, hipZ + 0.05]} rotation={[0.9, 0, 0.05]}>
        <boxGeometry args={[0.07, 0.32, 0.07]} />
        <meshStandardMaterial color={shirt} roughness={0.8} />
      </mesh>
      <mesh position={[-0.18, hipY + 0.18, hipZ + 0.05]} rotation={[0.9, 0, -0.05]}>
        <boxGeometry args={[0.07, 0.32, 0.07]} />
        <meshStandardMaterial color={shirt} roughness={0.8} />
      </mesh>

      {/* Head */}
      <mesh position={[0, hipY + 0.5, hipZ - 0.05]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color={skin} roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ── Standing person — idle stance with hands on hips ───────────────── */
function StandingIdlePerson({ position = [0, 0, 0], rotation = 0, shirt = '#5dade2' }) {
  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.015;
  });

  const skin = '#f3c8a4';
  const pants = '#2c3e50';

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* legs */}
      <mesh position={[0.07, 0.16, 0]}>
        <boxGeometry args={[0.08, 0.32, 0.08]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>
      <mesh position={[-0.07, 0.16, 0]}>
        <boxGeometry args={[0.08, 0.32, 0.08]} />
        <meshStandardMaterial color={pants} roughness={0.85} />
      </mesh>
      {/* torso */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.2, 0.32, 0.16]} />
        <meshStandardMaterial color={shirt} roughness={0.8} />
      </mesh>
      {/* arms */}
      <mesh position={[0.16, 0.46, 0]}>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
        <meshStandardMaterial color={shirt} roughness={0.8} />
      </mesh>
      <mesh position={[-0.16, 0.46, 0]}>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
        <meshStandardMaterial color={shirt} roughness={0.8} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color={skin} roughness={0.85} />
      </mesh>
    </group>
  );
}

/* ── Dog — small box body, sphere head, wagging tail ────────────────── */
function Dog({ position = [0, 0, 0], rotation = 0, fur = '#c89060' }) {
  const tailRef = useRef();
  useFrame(({ clock }) => {
    if (!tailRef.current) return;
    tailRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 8) * 0.6;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* body */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.48, 0.2, 0.22]} />
        <meshStandardMaterial color={fur} roughness={0.85} />
      </mesh>
      {/* head */}
      <mesh position={[0.28, 0.28, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 14]} />
        <meshStandardMaterial color={fur} roughness={0.85} />
      </mesh>
      {/* snout */}
      <mesh position={[0.39, 0.24, 0]} castShadow>
        <boxGeometry args={[0.09, 0.07, 0.09]} />
        <meshStandardMaterial color="#2a2018" roughness={0.7} />
      </mesh>
      {/* ears */}
      <mesh position={[0.22, 0.4, 0.08]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.05, 0.1, 6]} />
        <meshStandardMaterial color={fur} roughness={0.85} />
      </mesh>
      <mesh position={[0.22, 0.4, -0.08]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.05, 0.1, 6]} />
        <meshStandardMaterial color={fur} roughness={0.85} />
      </mesh>
      {/* legs */}
      {[
        [ 0.16, 0,  0.08],
        [ 0.16, 0, -0.08],
        [-0.16, 0,  0.08],
        [-0.16, 0, -0.08],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.05, p[2]]}>
          <boxGeometry args={[0.06, 0.14, 0.06]} />
          <meshStandardMaterial color={fur} roughness={0.85} />
        </mesh>
      ))}
      {/* tail (wags via Y rotation around its hip pivot) */}
      <group ref={tailRef} position={[-0.24, 0.24, 0]}>
        <mesh position={[-0.1, 0.04, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.18, 0.05, 0.05]} />
          <meshStandardMaterial color={fur} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Plaza life: benches, seated people, dog, fountain visitor ─────── */
/* Each bench + its seated occupants share a group, so figures stay anchored
 * to the seat regardless of how the bench rotates to face the fountain. */
function BenchWithPeople({ position, rotation, sitters }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Bench />
      {sitters.map((s, i) => (
        // Bench seat is 1.8 wide along X → spread sitters across it.
        <SeatedPerson key={i} position={[s.x, 0, 0]} rotation={0} shirt={s.shirt} />
      ))}
    </group>
  );
}

function PlazaLife() {
  return (
    <group>
      {/* Bench 1 — NW of fountain, facing the fountain */}
      <BenchWithPeople
        position={[-3.4, 0, -2.6]}
        rotation={Math.PI * 0.75}
        sitters={[
          { x:  0.45, shirt: '#e85d75' },
          { x: -0.45, shirt: '#5dade2' },
        ]}
      />

      {/* Bench 2 — SE of fountain, facing the fountain */}
      <BenchWithPeople
        position={[3.4, 0, 2.6]}
        rotation={-Math.PI * 0.25}
        sitters={[
          { x: 0.3, shirt: '#f5b041' },
        ]}
      />

      {/* Dog padding around between the SE bench and the fountain */}
      <Dog position={[2.4, 0, 2.6]} rotation={-Math.PI * 0.55} fur="#b07440" />

      {/* Visitor on the south side looking at the fountain */}
      <StandingIdlePerson position={[1.4, 0, 2.6]} rotation={Math.PI * 1.05} shirt="#bb8fce" />
    </group>
  );
}

/* ── Traffic & pedestrians ──────────────────────────────────────────── */

/* All cars in the same direction share one speed so spacing never collapses.
 * Different colours, evenly phased around the pentagon → no overtaking, no crashes. */
const CW_SPEED  = 2.0;
const CCW_SPEED = 1.7;

const CW_CARS = [
  { color: '#e74c3c' },
  { color: '#2980b9' },
  { color: '#f1c40f' },
];

const CCW_CARS = [
  { color: '#ecf0f1' },
  { color: '#27ae60' },
];

/* Lateral offset from road centreline — keeps each direction on its own lane.
 * Asphalt is ~3.5 wide; ~0.85 puts each lane comfortably inside its half. */
const LANE_OFFSET = 0.85;

function Car({ route, phase = 0 }) {
  const groupRef = useRef();
  const wheelRefs = useRef([]);

  // pre-compute segment lengths so speed is consistent across segments
  const segs = route.waypoints.map((p, i) => {
    const n = route.waypoints[(i + 1) % route.waypoints.length];
    const dx = n[0] - p[0];
    const dz = n[1] - p[1];
    const len = Math.hypot(dx, dz);
    // unit "right" vector relative to travel direction (drive on the right)
    return { from: p, to: n, len, nx: -dz / len, nz: dx / len };
  });
  const totalLen = segs.reduce((a, s) => a + s.len, 0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * route.speed + phase * totalLen;
    let dist = ((t % totalLen) + totalLen) % totalLen;
    let seg = segs[0];
    for (const s of segs) {
      if (dist <= s.len) { seg = s; break; }
      dist -= s.len;
    }
    const k = dist / seg.len;
    const cx = seg.from[0] + (seg.to[0] - seg.from[0]) * k;
    const cz = seg.from[1] + (seg.to[1] - seg.from[1]) * k;
    // shift onto the right-hand lane relative to travel direction
    const x = cx + seg.nx * LANE_OFFSET;
    const z = cz + seg.nz * LANE_OFFSET;
    const angle = Math.atan2(seg.to[1] - seg.from[1], seg.to[0] - seg.from[0]);
    if (groupRef.current) {
      groupRef.current.position.set(x, 0.18, z);
      groupRef.current.rotation.y = -angle;
    }
    wheelRefs.current.forEach((w) => {
      if (w) w.rotation.x = clock.getElapsedTime() * route.speed * 3;
    });
  });

  return (
    <group ref={groupRef}>
      {/* chassis */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[1.05, 0.28, 0.5]} />
        <meshStandardMaterial color={route.color} roughness={0.4} metalness={0.4} />
      </mesh>
      {/* cabin */}
      <mesh position={[-0.05, 0.36, 0]} castShadow>
        <boxGeometry args={[0.6, 0.22, 0.46]} />
        <meshStandardMaterial color="#1a2540" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* windshield slit */}
      <mesh position={[0.15, 0.36, 0]}>
        <boxGeometry args={[0.05, 0.16, 0.42]} />
        <meshStandardMaterial color="#9bd2ff" emissive="#9bd2ff" emissiveIntensity={0.2} transparent opacity={0.7} />
      </mesh>
      {/* headlights */}
      <mesh position={[0.53, 0.18, 0.18]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#fffbe0" emissive="#fffbe0" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0.53, 0.18, -0.18]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#fffbe0" emissive="#fffbe0" emissiveIntensity={1.4} />
      </mesh>
      {/* tail lights */}
      <mesh position={[-0.53, 0.18, 0.18]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ff5050" emissive="#ff5050" emissiveIntensity={1.0} />
      </mesh>
      <mesh position={[-0.53, 0.18, -0.18]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ff5050" emissive="#ff5050" emissiveIntensity={1.0} />
      </mesh>
      {/* wheels */}
      {[
        [ 0.35, 0,  0.27],
        [ 0.35, 0, -0.27],
        [-0.35, 0,  0.27],
        [-0.35, 0, -0.27],
      ].map((p, i) => (
        <mesh
          key={i}
          ref={(el) => (wheelRefs.current[i] = el)}
          position={p}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Cars() {
  return (
    <group>
      {CW_CARS.map((c, i) => (
        <Car
          key={`cw-${i}`}
          route={{ speed: CW_SPEED, color: c.color, waypoints: PENTAGON_WAYPOINTS }}
          phase={i / CW_CARS.length}
        />
      ))}
      {CCW_CARS.map((c, i) => (
        <Car
          key={`ccw-${i}`}
          route={{ speed: CCW_SPEED, color: c.color, waypoints: PENTAGON_REVERSE }}
          phase={i / CCW_CARS.length}
        />
      ))}
    </group>
  );
}

/* Pedestrians walk on the sidewalk hugging the road, just outside the asphalt.
 * Sidewalk = pentagon corners pushed ~1.9 units outward from the centroid. */
/* Pedestrians walk on the OUTER sidewalk — same lateral offset as the visible
 * sidewalk strip drawn under the road. Keeps figures aligned to the pavement. */
const SIDEWALK_OFFSET = SIDEWALK_CENTRE;
const SIDEWALK_OUTER = PENTAGON_WAYPOINTS.map(([x, z]) => {
  const dx = x - ROAD_CENTROID[0];
  const dz = z - ROAD_CENTROID[1];
  const len = Math.hypot(dx, dz) || 1;
  return [x + (dx / len) * SIDEWALK_OFFSET, z + (dz / len) * SIDEWALK_OFFSET];
});
const SIDEWALK_OUTER_REV = [...SIDEWALK_OUTER].reverse();

const PED_ROUTES = [
  { speed: 0.85, shirt: '#ff6b6b', waypoints: SIDEWALK_OUTER     },
  { speed: 0.70, shirt: '#48c9b0', waypoints: SIDEWALK_OUTER_REV },
  { speed: 0.90, shirt: '#5dade2', waypoints: SIDEWALK_OUTER     },
  { speed: 0.75, shirt: '#f5b041', waypoints: SIDEWALK_OUTER_REV },
  { speed: 0.95, shirt: '#bb8fce', waypoints: SIDEWALK_OUTER     },
  { speed: 0.80, shirt: '#7dcea0', waypoints: SIDEWALK_OUTER_REV },
];

function Pedestrian({ route, phase = 0 }) {
  const groupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  const segs = route.waypoints.map((p, i) => {
    const n = route.waypoints[(i + 1) % route.waypoints.length];
    const dx = n[0] - p[0];
    const dz = n[1] - p[1];
    return { from: p, to: n, len: Math.hypot(dx, dz) };
  });
  const totalLen = segs.reduce((a, s) => a + s.len, 0);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const t = time * route.speed + phase * totalLen;
    let dist = ((t % totalLen) + totalLen) % totalLen;
    let seg = segs[0];
    for (const s of segs) {
      if (dist <= s.len) { seg = s; break; }
      dist -= s.len;
    }
    const k = dist / seg.len;
    const x = seg.from[0] + (seg.to[0] - seg.from[0]) * k;
    const z = seg.from[1] + (seg.to[1] - seg.from[1]) * k;
    const angle = Math.atan2(seg.to[1] - seg.from[1], seg.to[0] - seg.from[0]);
    if (groupRef.current) {
      const bob = Math.abs(Math.sin(time * 6)) * 0.04;
      groupRef.current.position.set(x, 0.02 + bob, z);
      groupRef.current.rotation.y = -angle;
    }
    const swing = Math.sin(time * 6) * 0.5;
    if (leftLegRef.current)  leftLegRef.current.rotation.z  =  swing;
    if (rightLegRef.current) rightLegRef.current.rotation.z = -swing;
    if (leftArmRef.current)  leftArmRef.current.rotation.z  = -swing * 0.7;
    if (rightArmRef.current) rightArmRef.current.rotation.z =  swing * 0.7;
  });

  const skin = '#f3c8a4';
  const pants = '#34495e';

  return (
    <group ref={groupRef}>
      {/* legs (pivots near hip) */}
      <group ref={leftLegRef} position={[0, 0.32, 0.07]}>
        <mesh position={[0, -0.16, 0]}>
          <boxGeometry args={[0.08, 0.32, 0.08]} />
          <meshStandardMaterial color={pants} roughness={0.85} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0, 0.32, -0.07]}>
        <mesh position={[0, -0.16, 0]}>
          <boxGeometry args={[0.08, 0.32, 0.08]} />
          <meshStandardMaterial color={pants} roughness={0.85} />
        </mesh>
      </group>
      {/* torso */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.18, 0.3, 0.16]} />
        <meshStandardMaterial color={route.shirt} roughness={0.8} />
      </mesh>
      {/* arms */}
      <group ref={leftArmRef} position={[0, 0.6, 0.11]}>
        <mesh position={[0, -0.13, 0]}>
          <boxGeometry args={[0.05, 0.28, 0.05]} />
          <meshStandardMaterial color={route.shirt} roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0, 0.6, -0.11]}>
        <mesh position={[0, -0.13, 0]}>
          <boxGeometry args={[0.05, 0.28, 0.05]} />
          <meshStandardMaterial color={route.shirt} roughness={0.8} />
        </mesh>
      </group>
      {/* head */}
      <mesh position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={skin} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Pedestrians() {
  return (
    <group>
      {PED_ROUTES.map((r, i) => (
        <Pedestrian key={i} route={r} phase={i / PED_ROUTES.length} />
      ))}
      {PED_ROUTES.map((r, i) => (
        <Pedestrian key={`b-${i}`} route={r} phase={(i / PED_ROUTES.length) + 0.5} />
      ))}
    </group>
  );
}

/* ── Advertising plane circling the campus ──────────────────────────── */
function AdPlane() {
  const groupRef = useRef();
  const propellerRef = useRef();
  const bannerRef = useRef();
  const logoTexture = useTexture('/logo.png');

  const ORBIT_RADIUS = 26;
  const ORBIT_HEIGHT = 14;
  const ORBIT_SPEED = 0.18;
  const ORBIT_CENTER = [0, 0, -2];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * ORBIT_SPEED;
    const x = ORBIT_CENTER[0] + Math.cos(t) * ORBIT_RADIUS;
    const z = ORBIT_CENTER[2] + Math.sin(t) * ORBIT_RADIUS;
    const y = ORBIT_HEIGHT;

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      // tangent heading: derivative of (cos, sin) is (-sin, cos); plane nose faces +X by default
      const heading = Math.atan2(-Math.cos(t), -Math.sin(t));
      groupRef.current.rotation.y = heading;
      // constant gentle bank into the turn
      groupRef.current.rotation.z = -0.1;
    }
    if (propellerRef.current) {
      propellerRef.current.rotation.x = clock.getElapsedTime() * 28;
    }
    if (bannerRef.current) {
      // slight slipstream sway around vertical axis (banner stays horizontal)
      bannerRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 1.6) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* fuselage — red body (cylinder along X = flight direction) */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.32, 0.22, 2.2, 16]} />
        <meshStandardMaterial color="#d83a2a" roughness={0.55} metalness={0.15} />
      </mesh>
      {/* white belly stripe */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[1.6, 0.12, 0.5]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
      </mesh>
      {/* nose cone */}
      <mesh position={[1.25, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.22, 0.45, 16]} />
        <meshStandardMaterial color="#b82e1e" roughness={0.55} />
      </mesh>
      {/* cockpit glass */}
      <mesh position={[0.35, 0.28, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#9bd8ff"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.78}
          emissive="#4aa8e0"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* upper wing — biplane top wing */}
      <mesh position={[0.05, 0.55, 0]} castShadow>
        <boxGeometry args={[1.1, 0.08, 3.6]} />
        <meshStandardMaterial color="#d83a2a" roughness={0.6} />
      </mesh>
      {/* upper wing white tip stripes */}
      <mesh position={[0.05, 0.59, 1.55]}>
        <boxGeometry args={[1.0, 0.04, 0.4]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
      </mesh>
      <mesh position={[0.05, 0.59, -1.55]}>
        <boxGeometry args={[1.0, 0.04, 0.4]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.6} />
      </mesh>
      {/* lower wing — biplane bottom wing */}
      <mesh position={[0.05, -0.28, 0]} castShadow>
        <boxGeometry args={[1.0, 0.07, 3.2]} />
        <meshStandardMaterial color="#d83a2a" roughness={0.6} />
      </mesh>
      {/* wing struts connecting upper and lower wing */}
      {[-1.1, 1.1].map((dz) => (
        <mesh key={dz} position={[0.05, 0.13, dz]}>
          <boxGeometry args={[0.06, 0.85, 0.06]} />
          <meshStandardMaterial color="#f5f5f5" roughness={0.7} />
        </mesh>
      ))}
      {/* tail vertical fin */}
      <mesh position={[-1.0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.55, 0.65, 0.08]} />
        <meshStandardMaterial color="#d83a2a" roughness={0.6} />
      </mesh>
      {/* tail horizontal stabilizer */}
      <mesh position={[-0.95, 0.05, 0]} castShadow>
        <boxGeometry args={[0.6, 0.06, 1.2]} />
        <meshStandardMaterial color="#d83a2a" roughness={0.6} />
      </mesh>
      {/* landing gear struts */}
      {[-0.3, 0.3].map((dz) => (
        <mesh key={dz} position={[0.15, -0.55, dz]}>
          <cylinderGeometry args={[0.04, 0.04, 0.45, 6]} />
          <meshStandardMaterial color="#3a3f48" roughness={0.7} />
        </mesh>
      ))}
      {/* landing gear wheels */}
      {[-0.3, 0.3].map((dz) => (
        <mesh key={`w-${dz}`} position={[0.15, -0.78, dz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.08, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
        </mesh>
      ))}
      {/* propeller hub */}
      <mesh position={[1.55, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* spinning propeller blades */}
      <group ref={propellerRef} position={[1.62, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.04, 0.9, 0.08]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} transparent opacity={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.04, 0.9, 0.08]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* tow rope from tail to banner */}
      <Line
        points={[
          [-1.25, 0.05, 0],
          [-2.3,  0.05, 0],
          [-3.4,  0.0,  0],
        ]}
        color="#2a2a2a"
        lineWidth={1.5}
        transparent
        opacity={0.85}
      />

      {/* banner trailing horizontally behind the plane (long along X = flight axis) */}
      <group ref={bannerRef} position={[-3.4, 0, 0]}>
        {/* front mast — vertical rod at banner leading edge */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
          <meshStandardMaterial color="#888" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* trailing mast — vertical rod at banner trailing edge */}
        <mesh position={[-4.4, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 1.4, 8]} />
          <meshStandardMaterial color="#888" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* banner cloth — two back-to-back planes so the logo reads correctly from BOTH sides
            (DoubleSide would mirror the text on the back face) */}
        <mesh position={[-2.2, 0, 0.01]}>
          <planeGeometry args={[4.4, 1.3]} />
          <meshStandardMaterial
            map={logoTexture}
            color="#ffffff"
            roughness={0.85}
            metalness={0}
            side={THREE.FrontSide}
            transparent
          />
        </mesh>
        <mesh position={[-2.2, 0, -0.01]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[4.4, 1.3]} />
          <meshStandardMaterial
            map={logoTexture}
            color="#ffffff"
            roughness={0.85}
            metalness={0}
            side={THREE.FrontSide}
            transparent
          />
        </mesh>
      </group>
    </group>
  );
}

/* ── Map node ───────────────────────────────────────────────────────── */
function MapNode({ building, isUnlocked, isCompleted, isHovered, onHover, onClick, zoneDef }) {
  const [x, z] = offsetFromCentroid(building.id, BUILDING_SETBACK);
  const yaw = rotationToCentroid(building.id);
  const { color } = zoneDef;
  const locked = !isUnlocked;
  const labelY = building.shape === 'skyscraper' ? 17 : building.shape === 'hq' ? 9 : 10;
  const markerY = labelY + 1.5;

  return (
    <group position={[x, 0, z]}>
      {/* zone ground patch */}
      <ZonePatch color={color} unlocked={isUnlocked} radius={building.shape === 'hq' ? 6 : 5} />

      <Float
        speed={isHovered ? 1.5 : 0}
        rotationIntensity={0}
        floatIntensity={isHovered ? 0.15 : 0}
      >
        <group
          scale={isHovered ? 1.04 : 1}
          rotation={[0, yaw, 0]}
          onPointerOver={(e) => { e.stopPropagation(); onHover(building.id); }}
          onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
          onClick={(e) => { e.stopPropagation(); if (isUnlocked) onClick(building.id); }}
        >
          {building.shape === 'office'     && <OfficeBuilding   color={color} locked={locked} />}
          {building.shape === 'skyscraper' && <Skyscraper       color={color} locked={locked} />}
          {building.shape === 'campus'     && <CampusBuilding   color={color} locked={locked} />}
          {building.shape === 'datacenter' && <DataCenter       color={color} locked={locked} />}
          {building.shape === 'hq'         && <ExecutiveHQ      color={color} locked={locked} />}

          {/* completed ring on ground */}
          {isCompleted && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
              <ringGeometry args={[5.6, 5.9, 48]} />
              <meshBasicMaterial color="#22c55e" transparent opacity={0.9} />
            </mesh>
          )}

          {/* HTML label */}
          <Html center position={[0, labelY, 0]} zIndexRange={[100, 0]}>
            <div
              className={`zone-label-container ${isHovered ? 'hovered' : ''}`}
              style={{ '--zone-color': color, opacity: isUnlocked ? 1 : 0.65 }}
            >
              <div className="zone-label-title">
                {!isUnlocked && <span className="zone-label-lock">🔒</span>}
                {building.label.toUpperCase()}
              </div>
              {isHovered && <div className="zone-label-subtitle">{zoneDef.name}</div>}
            </div>
          </Html>
        </group>
      </Float>

      {/* floating entry arrow */}
      {isUnlocked && !isCompleted && (
        <Float speed={2.5} floatIntensity={0.8} position={[0, markerY, 0]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.35, 0.7, 4]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </Float>
      )}
    </group>
  );
}

/* ── 3D Scene ───────────────────────────────────────────────────────── */
function WorldMapScene({ state, isZoneUnlocked, hoveredId, setHoveredId, onSelect }) {
  return (
    <>
      {/* ── Sky ── */}
      <Sky
        sunPosition={[40, 12, 80]}
        turbidity={3.5}
        rayleigh={0.6}
        mieCoefficient={0.005}
        mieDirectionalG={0.92}
        inclination={0.52}
        azimuth={0.18}
      />

      {/* ── Lighting ── */}
      <ambientLight intensity={0.55} color="#d6e8ff" />
      <hemisphereLight skyColor="#87ceeb" groundColor="#5a7a3a" intensity={0.45} />
      <directionalLight
        position={[40, 50, 60]}
        intensity={2.0}
        color="#fff8e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />

      {/* ── Camera ── */}
      <OrbitControls
        makeDefault
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.4}
        minDistance={20}
        maxDistance={55}
        target={[0, 2, -2]}
        enablePan={false}
        autoRotate={!hoveredId}
        autoRotateSpeed={0.25}
      />

      {/* ── Ground ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#5e8a4a" roughness={1} />
      </mesh>

      {/* concrete plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[38, 38]} />
        <meshStandardMaterial color="#d2c8b2" roughness={0.9} />
      </mesh>

      {/* central plaza accent — circular tile */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} receiveShadow>
        <ringGeometry args={[2.2, 3.4, 48]} />
        <meshStandardMaterial color="#a8a08b" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]} receiveShadow>
        <circleGeometry args={[2.2, 48]} />
        <meshStandardMaterial color="#b8b094" roughness={0.85} />
      </mesh>

      {/* ── Roads ── */}
      <MapPaths completedZones={state.completedZones} />

      {/* ── Street lamps ── */}
      {LAMP_PLACEMENTS.map((l, i) => (
        <StreetLamp key={i} position={l.position} rotation={l.rotation} />
      ))}

      {/* ── Buildings ── */}
      {BUILDINGS.map((b) => {
        const isUnlocked = isZoneUnlocked(b.id);
        const isCompleted = state.completedZones.has(b.id);
        const zoneDef = ZONE_DEFS.find((z) => z.id === b.id);
        return (
          <MapNode
            key={b.id}
            building={b}
            zoneDef={zoneDef}
            isUnlocked={isUnlocked}
            isCompleted={isCompleted}
            isHovered={hoveredId === b.id}
            onHover={(id) => setHoveredId(id)}
            onClick={onSelect}
          />
        );
      })}

      {/* ── Ambient props ── */}
      <Trees />
      <Bushes />
      <Fountain />
      <PlazaLife />
      <Cars />
      <Pedestrians />

      {/* ── Advertising plane circling overhead ── */}
      <Suspense fallback={null}>
        <AdPlane />
      </Suspense>

      {/* ── Shadows / env ── */}
      <ContactShadows
        position={[0, 0.05, 0]}
        opacity={0.55}
        scale={70}
        blur={3}
        far={15}
        color="#162030"
      />
    </>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
function WorldMap() {
  const navigate = useNavigate();
  const { state, isZoneUnlocked } = useGame();
  const [hoveredId, setHoveredId] = useState(null);

  const completedCount = ['error-district', 'vv-headquarters', 'matrix-tower', 'artefact-archive']
    .filter((id) => state.completedZones.has(id)).length;

  const nextZone = ZONE_DEFS.find((z) => isZoneUnlocked(z.id) && !state.completedZones.has(z.id));

  const headerMotion = useMotion({
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  });

  const sidebarVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
  };
  const cardVariants = {
    hidden:  { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  };

  const handleSelect = (zoneId) => {
    navigate(`/office/${zoneId}`);
  };

  return (
    <div className="world-map">
      <motion.header className="world-map__topbar" {...headerMotion}>
        <div className="world-map__topbar-left">
          <img
            src="/iso-logo2.png"
            alt="ISO Testing World"
            className="world-map__logo"
          />
          <div className="world-map__brand-text">
            <span className="world-map__incident">
              <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true" style={{ fill: 'currentColor' }}>
                <path d="M9 1 L17 16 H1 Z" />
                <rect x="8.3" y="6" width="1.4" height="5" fill="#ffffff" />
                <rect x="8.3" y="12" width="1.4" height="1.4" fill="#ffffff" />
              </svg>
              Incident #047 · Production Outage
            </span>
            <h1 className="world-map__title">
              Corporate Test Campus
              <a
                href="https://github.com/tunadeniz1304/436oyun"
                target="_blank"
                rel="noopener noreferrer"
                className="world-map__github-link"
                aria-label="View source on GitHub"
              >
                <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>
            </h1>
            <p className="world-map__subtitle">
              Resolve the outage by visiting all five company departments. Each location
              represents a critical ISO/IEC/IEEE 29119-1:2022 testing sector.
            </p>
          </div>
        </div>
        <div className="world-map__topbar-right">
          <div className="world-map__help-card" role="group" aria-label="User guide call to action">
            <span className="world-map__help-card-caption">Don't know how to use?</span>
            <button
              type="button"
              className="world-map__help-btn"
              onClick={() => navigate('/user-guide')}
              aria-label="Open user guide"
            >
              📖 User Guide
            </button>
          </div>
          <ProgressTracker completed={completedCount} total={4} />
        </div>
      </motion.header>

      <main className="world-map__body">
        <div className="world-map__map-panel">
          <div className="world-map__canvas-wrapper">
            <Canvas
              camera={{ position: [18, 20, 34], fov: 48 }}
              shadows
              gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
            >
              <WorldMapScene
                state={state}
                isZoneUnlocked={isZoneUnlocked}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
                onSelect={handleSelect}
              />
            </Canvas>
          </div>
          <p className="world-map__no-persist">No persistence — refresh resets the game.</p>
          <p className="world-map__controls-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 15l7-7 7 7" />
            </svg>
            Drag to rotate · Scroll to zoom
          </p>
        </div>

        <motion.aside
          className="world-map__sidebar"
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
        >
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

          <motion.div className="world-map__card world-map__card--score" variants={cardVariants}>
            <div className="world-map__card-label">Total Score</div>
            <div className="world-map__card-bigscore">
              {normalizeScore(state.totalScore)}
              <span className="world-map__card-max"> / 1000</span>
            </div>
          </motion.div>

          {nextZone ? (
            <motion.div
              className="world-map__card world-map__card--next"
              variants={cardVariants}
              style={{ '--btn-color': nextZone.color }}
            >
              <div className="world-map__card-label">Next up</div>
              <p className="world-map__card-text">
                <strong style={{ color: nextZone.color }}>{nextZone.name}</strong>
                {' '}— {nextZone.intro}
              </p>
              <button type="button" className="world-map__enter-btn" onClick={() => navigate(nextZone.route)}>
                Enter {nextZone.name} →
              </button>
            </motion.div>
          ) : completedCount === 4 ? (
            <motion.div
              className="world-map__card world-map__card--next"
              variants={cardVariants}
              style={{ '--btn-color': 'var(--final-color)' }}
            >
              <div className="world-map__card-label">Next up</div>
              <p className="world-map__card-text">
                <strong style={{ color: 'var(--final-color)' }}>Final Inspection</strong>
                {' '}— All departments complete. Enter the Final Executive Inspection.
              </p>
              <button type="button" className="world-map__enter-btn" onClick={() => navigate('/final-inspection')}>
                Enter Final Inspection →
              </button>
            </motion.div>
          ) : null}

          <motion.div className="world-map__card" variants={cardVariants}>
            <div className="world-map__card-label">Legend</div>
            <div className="world-map__legend">
              <div><span className="world-map__legend-dot" style={{ backgroundColor: '#0ea5e9' }} />Active Department</div>
              <div><span className="world-map__legend-dot" style={{ backgroundColor: '#c8cdd6', border: '1px solid #aaa' }} />Locked Building</div>
              <div><span className="world-map__legend-dot" style={{ backgroundColor: '#22c55e' }} />Completed Zone</div>
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
