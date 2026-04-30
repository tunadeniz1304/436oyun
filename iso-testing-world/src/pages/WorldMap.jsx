import { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../hooks/useGame.js';
import { useMotion } from '../hooks/useMotion.js';
import ProgressTracker from '../components/shared/ProgressTracker.jsx';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls, Html, ContactShadows, Sky,
  Line, Float, useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import { ParkedCars, Fountain } from '../three/SceneProps.jsx';
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

useGLTF.preload('/models/fountain/scene.gltf');
useGLTF.preload('/models/cars/car1/scene.gltf');
useGLTF.preload('/models/cars/car2/scene.gltf');

/* ── Colour helpers ─────────────────────────────────────────────────── */
const hex2rgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/* ── Shared materials ───────────────────────────────────────────────── */
const CONCRETE = { color: '#e8e4dc', roughness: 0.85, metalness: 0 };
const GLASS    = { color: '#b8d4e8', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.82 };
const LOCKED   = { color: '#c8cdd6', roughness: 0.95, metalness: 0 };

function Mat({ locked, ...props }) {
  return <meshStandardMaterial {...(locked ? LOCKED : props)} />;
}
function GlassMat({ locked }) {
  return locked ? <meshStandardMaterial {...LOCKED} /> : <meshStandardMaterial {...GLASS} />;
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
  return (
    <group>
      {/* podium */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[5.5, 1.2, 4]} />
        <Mat locked={locked} {...CONCRETE} />
      </mesh>
      {/* main tower */}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[3.8, 5.6, 2.8]} />
        <Mat locked={locked} {...CONCRETE} />
      </mesh>
      {/* glass curtain strips */}
      {[-1.4, -0.4, 0.6, 1.6].map((dy, i) => (
        <mesh key={i} position={[0, 2.2 + dy, 1.42]} castShadow>
          <boxGeometry args={[3.5, 0.65, 0.05]} />
          <GlassMat locked={locked} />
        </mesh>
      ))}
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
    </group>
  );
}

function Skyscraper({ color, locked }) {
  return (
    <group>
      {/* wide lobby base */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[4.5, 1.6, 4.5]} />
        <Mat locked={locked} {...CONCRETE} />
      </mesh>
      {/* lower shaft */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <boxGeometry args={[3.2, 4.4, 3.2]} />
        <GlassMat locked={locked} />
      </mesh>
      {/* upper shaft */}
      <mesh position={[0.2, 9.8, 0.2]} castShadow>
        <boxGeometry args={[2.2, 5.6, 2.2]} />
        <GlassMat locked={locked} />
      </mesh>
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
      {/* setback accent */}
      <mesh position={[0, 6.95, 0]}>
        <boxGeometry args={[3.3, 0.18, 3.3]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.3} />
      </mesh>
    </group>
  );
}

function CampusBuilding({ color, locked }) {
  return (
    <group>
      {/* wide low hall */}
      <mesh position={[0, 0.9, 0.5]} castShadow>
        <boxGeometry args={[6, 1.8, 4.5]} />
        <Mat locked={locked} {...CONCRETE} />
      </mesh>
      {/* glass atrium front */}
      <mesh position={[0, 1.5, 2.55]}>
        <boxGeometry args={[4, 2.2, 0.12]} />
        <GlassMat locked={locked} />
      </mesh>
      {/* rear tower */}
      <mesh position={[-1.5, 3.8, -0.8]} castShadow>
        <boxGeometry args={[2.2, 4.2, 2.2]} />
        <Mat locked={locked} {...CONCRETE} />
      </mesh>
      {/* colour wall stripe */}
      <mesh position={[-1.5, 3.8, -1.92]}>
        <boxGeometry args={[2.3, 4.3, 0.1]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.3} />
      </mesh>
      {/* roof parapet */}
      <mesh position={[0, 1.86, 0.5]}>
        <boxGeometry args={[6.1, 0.18, 4.6]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.25} />
      </mesh>
    </group>
  );
}

function DataCenter({ color, locked }) {
  return (
    <group>
      {/* main block */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[5.5, 3.6, 4]} />
        <Mat locked={locked} {...CONCRETE} />
      </mesh>
      {/* secondary block */}
      <mesh position={[0, 1.2, -2.6]} castShadow>
        <boxGeometry args={[4, 2.4, 1.2]} />
        <Mat locked={locked} {...CONCRETE} />
      </mesh>
      {/* vent strips */}
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[i * 1.6, 1.8, 2.02]}>
          <boxGeometry args={[1.1, 3.5, 0.08]} />
          <meshStandardMaterial color="#9aa4b2" roughness={0.8} />
        </mesh>
      ))}
      {/* colour tech stripe */}
      <mesh position={[2.78, 1.8, 0]}>
        <boxGeometry args={[0.1, 3, 1.2]} />
        <meshStandardMaterial color={locked ? '#aaa' : color} emissive={locked ? '#000' : color} emissiveIntensity={locked ? 0 : 0.5} />
      </mesh>
      {/* roof AC units */}
      {[[-1.5, 0.8], [0.5, -0.8], [1.8, 0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 3.8, z]} castShadow>
          <boxGeometry args={[0.9, 0.55, 0.9]} />
          <meshStandardMaterial color="#8899aa" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function ExecutiveHQ({ color, locked }) {
  return (
    <group>
      {/* wide podium ring */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[4.5, 4.5, 1, 32]} />
        <Mat locked={locked} {...CONCRETE} />
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
      {/* main drum */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <cylinderGeometry args={[3.2, 3.2, 1.8, 32]} />
        <Mat locked={locked} color="#f5f2ec" roughness={0.6} metalness={0} />
      </mesh>
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

function Trees() {
  return (
    <group>
      {TREES.map(({ p, s }, i) => (
        <group key={i} position={p} scale={s}>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.13, 0.2, 1.1, 7]} />
            <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
          </mesh>
          <mesh position={[0, 2.0, 0]}>
            <sphereGeometry args={[0.9, 10, 10]} />
            <meshStandardMaterial color="#2d7a2a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.85, 0]}>
            <sphereGeometry args={[0.58, 10, 10]} />
            <meshStandardMaterial color="#3d9638" roughness={0.9} />
          </mesh>
        </group>
      ))}
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
        <meshStandardMaterial color="#c4bfb0" roughness={0.9} />
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
      <Suspense fallback={null}>
        <ParkedCars />
        <Fountain />
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
    const def = ZONE_DEFS.find((z) => z.id === zoneId);
    if (def) navigate(def.route);
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
              {state.totalScore}
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
