import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const GREY = new THREE.Color(0.55, 0.55, 0.55);

/**
 * Loads a GLTF, auto-fits it to a target XZ footprint, grounds it to y=0,
 * and applies a desaturation pass when unlocked=false.
 *
 * @param {string} path - public path e.g. '/models/office/scene.gltf'
 * @param {{ targetFootprint?: number, unlocked?: boolean }} opts
 * @returns {{ scene: THREE.Group }}
 */
export function useNormalizedGLTF(path, { targetFootprint = 5, unlocked = true } = {}) {
  const { scene: original } = useGLTF(path);

  const scene = useMemo(() => {
    const cloned = original.clone(true);

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Uniform scale based on XZ footprint
    const maxXZ = Math.max(size.x, size.z);
    if (maxXZ > 0) {
      const s = targetFootprint / maxXZ;
      cloned.scale.setScalar(s);
    }

    // Ground to y=0 after scaling
    const box2 = new THREE.Box3().setFromObject(cloned);
    cloned.position.y = -box2.min.y;

    // Desaturate when locked
    if (!unlocked) {
      cloned.traverse((node) => {
        if (node.isMesh && node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          node.material = mats.map((m) => {
            const clone = m.clone();
            clone.color = GREY.clone();
            clone.emissive = new THREE.Color(0, 0, 0);
            clone.emissiveIntensity = 0;
            clone.roughness = 1;
            clone.metalness = 0;
            return clone;
          });
          if (!Array.isArray(node.material) && mats.length === 1) {
            node.material = node.material[0];
          }
        }
      });
    }

    return cloned;
  }, [original, targetFootprint, unlocked]);

  return { scene };
}
