/**
 * @file useWaterHeight.ts
 * @description Hook for adjusting water mesh geometry based on water height
 * Keeps the bottom fixed and only adjusts the top vertices
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface UseWaterHeightProps {
  waterHeight: number;
  waterMeshName: string;
  tankType: 'lbm' | 'sph' | 'weir_overflow_sph';
}

export function useWaterHeight({ waterHeight, waterMeshName, tankType }: UseWaterHeightProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (waterHeight <= 0) return;

    // Find water mesh by name
    let waterMesh: THREE.Mesh | undefined;
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name === waterMeshName) {
        waterMesh = object;
      }
    });

    if (!waterMesh?.geometry) {
      console.warn(`Water mesh "${waterMeshName}" not found`);
      return;
    }

    const geometry = waterMesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute('position');

    if (!positionAttribute) {
      console.warn('No position attribute found on water geometry');
      return;
    }

    // Store original positions if not already stored
    if (!geometry.userData.originalPositions) {
      const originalPositions = new Float32Array(positionAttribute.array.length);
      originalPositions.set(positionAttribute.array as Float32Array);
      geometry.userData.originalPositions = originalPositions;
    }

    const originalPositions = geometry.userData.originalPositions as Float32Array;
    const positions = positionAttribute.array as Float32Array;

    // Find bottom and original height
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < originalPositions.length; i += 3) {
      const y = originalPositions[i + 1];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const bottomY = minY;
    const originalHeight = maxY - minY;

    // Calculate new top Y position
    const newTopY = bottomY + waterHeight;

    // Adjust vertices: keep bottom fixed, scale top proportionally
    for (let i = 0; i < originalPositions.length; i += 3) {
      const originalY = originalPositions[i + 1];

      // Calculate normalized height (0 = bottom, 1 = top)
      const normalizedHeight = (originalY - bottomY) / originalHeight;

      // New Y position: interpolate from bottom to new top
      const newY = bottomY + (normalizedHeight * waterHeight);

      positions[i] = originalPositions[i];     // X unchanged
      positions[i + 1] = newY;                 // Y adjusted
      positions[i + 2] = originalPositions[i + 2]; // Z unchanged
    }

    // Mark as needing update
    positionAttribute.needsUpdate = true;

    // Force geometry update for wireframe/edges/points modes
    // Increment version to trigger React Three Fiber updates
    if (positionAttribute instanceof THREE.BufferAttribute) {
      positionAttribute.version++;
    }

    // Store update timestamp for edge geometry regeneration
    geometry.userData.lastUpdateTime = Date.now();

    // Recompute normals and bounds
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.computeVertexNormals();

    console.log(`[useWaterHeight] Updated ${tankType} water: bottom=${bottomY.toFixed(4)}m, height=${waterHeight.toFixed(4)}m, top=${newTopY.toFixed(4)}m`);
  }, [waterHeight, waterMeshName, tankType, scene]);
}
