import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame.js';
import { useMotion } from '../hooks/useMotion.js';
import ProgressTracker from '../components/shared/ProgressTracker.jsx';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Html, ContactShadows, Sky,
  Line, Float,
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

const BUILDINGS = [
  { id: 'error-district',  gx: 0.8, gy: 0.5,  shape: 'office',     label: 'Error District HQ'  },
  { id: 'vv-headquarters', gx: 4.2, gy: 0.8,  shape: 'skyscraper', label: 'V&V Tower'           },
  { id: 'matrix-tower',    gx: 0.8, gy: 3.2,  shape: 'campus',     label: 'Matrix Research Hub' },
  { id: 'artefact-archive',gx: 4.2, gy: 3.2,  shape: 'datacenter', label: 'Artefact Archive'    },
  { id: 'final-inspection', gx: 2.5, gy: 4.8, shape: 'hq',         label: 'Final Inspection HQ' },
];

const PATHS = [
  { from: [0.8, 0.5], to: [4.2, 0.8], fromId: 'error-district'   },
  { from: [0.8, 0.5], to: [0.8, 3.2], fromId: 'error-district'   },
  { from: [4.2, 0.8], to: [4.2, 3.2], fromId: 'vv-headquarters'  },
  { from: [0.8, 3.2], to: [2.5, 4.8], fromId: 'matrix-tower'     },
  { from: [4.2, 3.2], to: [2.5, 4.8], fromId: 'artefact-archive' },
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
function StreetLamp({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.06, 0.09, 5, 7]} />
        <meshStandardMaterial color="#78869a" roughness={0.7} />
      </mesh>
      <mesh position={[0.5, 4.9, 0]}>
        <boxGeometry args={[1, 0.12, 0.12]} />
        <meshStandardMaterial color="#78869a" roughness={0.7} />
      </mesh>
      <mesh position={[1, 4.85, 0]}>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color="#fffde7" emissive="#fffde7" emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
}

/* ── Road segment with asphalt + lane markings ──────────────────────── */
function RoadSegment({ seg, isCompleted }) {
  const s = new THREE.Vector3(seg.start[0], 0, seg.start[2]);
  const e = new THREE.Vector3(seg.end[0], 0, seg.end[2]);
  const mid = s.clone().add(e).multiplyScalar(0.5);
  const length = s.distanceTo(e);
  const angle = Math.atan2(e.z - s.z, e.x - s.x);

  const linePoints = [
    new THREE.Vector3(seg.start[0], 0, seg.start[2]),
    new THREE.Vector3(seg.end[0], 0, seg.end[2]),
  ];

  return (
    <group>
      {/* asphalt strip */}
      <mesh position={[mid.x, 0.04, mid.z]} rotation={[0, -angle, 0]} receiveShadow>
        <boxGeometry args={[length, 0.08, 3.5]} />
        <meshStandardMaterial color="#3a3f48" roughness={0.95} />
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
        position={[0, 0.1, 0]}
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
  return (
    <group>
      {segments.map((seg, i) => (
        <RoadSegment key={i} seg={seg} isCompleted={completedZones.has(seg.fromId)} />
      ))}
    </group>
  );
}

/* ── Street lamps along roads ───────────────────────────────────────── */
const LAMP_POSITIONS = [
  [-9, 0, -12], [0, 0, -11], [8, 0, -9],
  [-9, 0, -4],  [9, 0, -4],
  [-9, 0, 5],   [9, 0, 5],
  [-4, 0, 13],  [4, 0, 13],
];

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

/* ── Map node ───────────────────────────────────────────────────────── */
function MapNode({ building, isUnlocked, isCompleted, isHovered, onHover, onClick, zoneDef }) {
  const [x, , z] = pos3(building.gx, building.gy);
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
      {LAMP_POSITIONS.map((p, i) => <StreetLamp key={i} position={p} />)}

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
          <span className="world-map__incident">
            <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true" style={{ fill: 'currentColor' }}>
              <path d="M9 1 L17 16 H1 Z" />
              <rect x="8.3" y="6" width="1.4" height="5" fill="#ffffff" />
              <rect x="8.3" y="12" width="1.4" height="1.4" fill="#ffffff" />
            </svg>
            Incident #047 · Production Outage
          </span>
          <h1 className="world-map__title">Corporate Test Campus</h1>
          <p className="world-map__subtitle">
            Resolve the outage by visiting all five company departments. Each location
            represents a critical ISO/IEC/IEEE 29119-1:2022 testing sector.
          </p>
        </div>
        <div className="world-map__topbar-right">
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
