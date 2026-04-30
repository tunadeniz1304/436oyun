import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useNormalizedGLTF } from './useNormalizedGLTF.js';

/* ── Preloads (tree omitted — scene.bin missing) ──────────────────────── */
useGLTF.preload('/models/cars/car1/scene.gltf');
useGLTF.preload('/models/cars/car2/scene.gltf');
useGLTF.preload('/models/fountain/scene.gltf');

/* ── Static seed positions ────────────────────────────────────────────── */
const TREE_POSITIONS = [
  [-18, 0, -14], [-20, 0, 2], [-18, 0, 18], [-12, 0, -22],
  [-8, 0, 22], [0, 0, -22], [8, 0, 22], [14, 0, -20],
  [20, 0, -8], [22, 0, 8], [20, 0, 20], [12, 0, 24],
  [-24, 0, -6], [-22, 0, 12], [6, 0, -24], [24, 0, 0],
  [-16, 0, -18], [16, 0, -16], [-4, 0, 24], [4, 0, -26],
  [-26, 0, 4], [26, 0, -4], [-10, 0, 26], [10, 0, -26],
  [22, 0, -18],
];

const TREE_SCALES = [
  0.9, 1.1, 0.8, 1.0, 1.2, 0.85, 1.05, 0.95,
  1.15, 0.75, 1.0, 1.1, 0.9, 0.8, 1.2, 1.0,
  0.95, 1.05, 0.85, 1.1, 0.9, 1.0, 0.8, 1.15, 1.0,
];

const TREE_ROTATIONS = [
  0.4, 1.1, 2.3, 0.8, 1.6, 3.0, 0.2, 2.7,
  1.4, 0.6, 3.5, 1.9, 2.1, 0.9, 1.3, 0.5,
  2.8, 1.7, 0.3, 2.4, 1.0, 3.2, 0.7, 1.8, 2.5,
];

/* ── Car placements along roads ───────────────────────────────────────── */
const CAR_PLACEMENTS = [
  { path: [[-9, 0, -15], [9, 0, -9]],   t: 0.35, side: 1,  rot: 0.3,  model: 0 },
  { path: [[-9, 0, -15], [-9, 0, 9]],   t: 0.55, side: -1, rot: 1.57, model: 1 },
  { path: [[9, 0, -9],   [9, 0, 9]],    t: 0.4,  side: 1,  rot: 1.57, model: 0 },
  { path: [[-9, 0, 9],   [0, 0, 17]],   t: 0.6,  side: 1,  rot: 2.4,  model: 1 },
  { path: [[9, 0, 9],    [0, 0, 17]],   t: 0.45, side: -1, rot: 0.8,  model: 0 },
  { path: [[-9, 0, -15], [9, 0, -9]],   t: 0.7,  side: -1, rot: 0.3,  model: 1 },
];

function lerpVec(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/* ── Procedural tree (replaces missing GLTF) ──────────────────────────── */
function ProceduralTree({ position, scale, rotation }) {
  const s = scale ?? 1;
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={s}>
      {/* trunk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 1, 7]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
      </mesh>
      {/* lower canopy */}
      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.85, 10, 10]} />
        <meshStandardMaterial color="#2d7a2a" roughness={0.9} />
      </mesh>
      {/* upper canopy */}
      <mesh position={[0, 2.65, 0]}>
        <sphereGeometry args={[0.55, 10, 10]} />
        <meshStandardMaterial color="#3a9636" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function Trees() {
  return (
    <group>
      {TREE_POSITIONS.map((pos, i) => (
        <ProceduralTree
          key={i}
          position={pos}
          scale={TREE_SCALES[i]}
          rotation={TREE_ROTATIONS[i]}
        />
      ))}
    </group>
  );
}

/* ── GLTF Cars ────────────────────────────────────────────────────────── */
function SingleCar({ placement, modelIndex }) {
  const paths = ['/models/cars/car1/scene.gltf', '/models/cars/car2/scene.gltf'];
  const { scene: orig } = useGLTF(paths[modelIndex % 2]);

  const scene = useMemo(() => {
    const c = orig.clone(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxXZ = Math.max(size.x, size.z);
    if (maxXZ > 0) c.scale.setScalar(1.8 / maxXZ);
    const box2 = new THREE.Box3().setFromObject(c);
    c.position.y = -box2.min.y;
    return c;
  }, [orig]);

  const mid = lerpVec(placement.path[0], placement.path[1], placement.t);
  const dx = placement.path[1][0] - placement.path[0][0];
  const dz = placement.path[1][2] - placement.path[0][2];
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  const nx = -dz / len;
  const nz = dx / len;
  const pos = [mid[0] + nx * 2.0 * placement.side, 0, mid[2] + nz * 2.0 * placement.side];

  return (
    <group position={pos} rotation={[0, placement.rot, 0]}>
      <primitive object={scene} />
    </group>
  );
}

export function ParkedCars() {
  return (
    <group>
      {CAR_PLACEMENTS.map((p, i) => (
        <SingleCar key={i} placement={p} modelIndex={p.model} />
      ))}
    </group>
  );
}

/* ── GLTF Fountain ────────────────────────────────────────────────────── */
export function Fountain() {
  const { scene } = useNormalizedGLTF('/models/fountain/scene.gltf', {
    targetFootprint: 4,
    unlocked: true,
  });

  return (
    <group position={[0, 0, 0]}>
      <primitive object={scene} />
    </group>
  );
}
