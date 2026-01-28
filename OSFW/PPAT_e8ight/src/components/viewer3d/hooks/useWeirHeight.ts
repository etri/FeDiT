/**
 * @file useWeirHeight.ts
 * @description Hook for adjusting weir wall mesh geometry based on weir height
 * Keeps the bottom fixed and only adjusts the top vertices
 */

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface UseWeirHeightProps {
  weirHeight: number;
  weirMeshName: string;
  tankType: 'weir_overflow_sph';
}

export function useWeirHeight({ weirHeight, weirMeshName, tankType }: UseWeirHeightProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (weirHeight <= 0) return;

    // Find weir mesh by name
    let weirMesh: THREE.Mesh | undefined;
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name === weirMeshName) {
        weirMesh = object;
      }
    });

    if (!weirMesh?.geometry) {
      console.warn(`Weir mesh "${weirMeshName}" not found`);
      return;
    }

    const geometry = weirMesh.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute('position');

    if (!positionAttribute) {
      console.warn('No position attribute found on weir geometry');
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

    // Define which vertex indices to adjust (vertices 0-9)
    //const vertexIndicesToAdjust = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,26,27 - 40];
    const vertexIndicesToAdjust = Array.from({ length: 74 }, (_, i) => i);
    //76, 77, 79, 82, 85, 86, 88, 91, 165, 166, 169, 274, 277, 279, 280, 283, 369, 370, 373, 435, 436, 439, 501, 502, 505, 1740, 1741, 1744, 1788, 1789, 1792, 1812, 1813, 1816, 1836, 1837, 1840, 1841, 1843, 1846, 1860, 1862, 1863, 1866, 1869, 1920, 1922, 1923, 1926, 2062, 2065, 2066
    //add these indices to vertexIndicesToAdjust
    vertexIndicesToAdjust.push(76, 77, 79, 82, 85, 86, 88, 91, 165, 166, 169, 274, 277, 279, 280, 283, 369, 370, 373, 435, 436, 439, 501, 502, 505, 1740, 1741, 1744, 1788, 1789, 1792, 1812, 1813, 1816, 1836, 1837, 1840, 1841, 1843, 1846, 1860, 1862, 1863, 1866, 1869, 1920, 1922, 1923, 1926, 2062, 2065, 2066);  //40

    // Store original heights of target vertices
    if (!geometry.userData.originalWeirHeights) {
      const originalHeights: number[] = [];
      vertexIndicesToAdjust.forEach(vertexIndex => {
        const posIndex = vertexIndex * 3;
        originalHeights[vertexIndex] = originalPositions[posIndex + 1];
      });
      geometry.userData.originalWeirHeights = originalHeights;

      console.log(`[useWeirHeight] Target vertices (0-9) original Y positions:`,
        vertexIndicesToAdjust.map(v => `v${v}: ${originalHeights[v]?.toFixed(4)}`).join(', ')
      );
    }

    const originalHeights = geometry.userData.originalWeirHeights as number[];

    // Find the max original height among target vertices to use as reference
    const maxOriginalHeight = Math.max(...vertexIndicesToAdjust.map(v => originalHeights[v] || 0));

    // Adjust only the specified vertex indices
    for (let vertexIndex = 0; vertexIndex < originalPositions.length / 3; vertexIndex++) {
      const posIndex = vertexIndex * 3;

      if (vertexIndicesToAdjust.includes(vertexIndex)) {
        // This is one of the target vertices - adjust its height
        const originalY = originalHeights[vertexIndex];

        // Calculate normalized height (0 = bottom, 1 = original top)
        const normalizedHeight = originalY / maxOriginalHeight;

        // New Y position: scale to new weir height
        const newY = normalizedHeight * weirHeight;

        positions[posIndex] = originalPositions[posIndex];         // X unchanged
        positions[posIndex + 1] = newY;                            // Y adjusted
        positions[posIndex + 2] = originalPositions[posIndex + 2]; // Z unchanged
      } else {
        // Keep other vertices unchanged
        positions[posIndex] = originalPositions[posIndex];
        positions[posIndex + 1] = originalPositions[posIndex + 1];
        positions[posIndex + 2] = originalPositions[posIndex + 2];
      }
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

    console.log(`[useWeirHeight] Updated ${tankType} weir vertices [0-80]: height=${weirHeight.toFixed(4)}m`);
  }, [weirHeight, weirMeshName, tankType, scene]);
}
