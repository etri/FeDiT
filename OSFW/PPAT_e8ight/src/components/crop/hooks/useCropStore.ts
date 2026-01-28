/**
 * @file useCropStore.ts
 * @description Zustand store for managing crop state
 */

import { create } from 'zustand';
import * as THREE from 'three';

export interface CropState {
  // 크롭 바운딩 박스
  cropMin: [number, number, number];
  cropMax: [number, number, number];
  // 원본 모델 바운딩 박스
  originalMin: [number, number, number];
  originalMax: [number, number, number];
  // 바운딩 박스의 위치와 스케일 (TransformControls용)
  boxPosition: [number, number, number];
  boxScale: [number, number, number];
  // Actions
  setCropBounds: (min: [number, number, number], max: [number, number, number]) => void;
  setBoxTransform: (position: [number, number, number], scale: [number, number, number]) => void;
  resetToOriginal: () => void;
  initializeFromBoundingBox: (bbox: THREE.Box3) => void;
}

export const useCropStore = create<CropState>((set) => ({
  // Initial state
  cropMin: [0, 0, 0],
  cropMax: [1, 1, 1],
  originalMin: [0, 0, 0],
  originalMax: [1, 1, 1],
  boxPosition: [0, 0, 0],
  boxScale: [1, 1, 1],

  // Set both min and max
  setCropBounds: (min, max) => {
    const center: [number, number, number] = [
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2,
    ];
    const size: [number, number, number] = [
      max[0] - min[0],
      max[1] - min[1],
      max[2] - min[2],
    ];
    set({
      cropMin: min,
      cropMax: max,
      boxPosition: center,
      boxScale: size,
    });
  },

  // Set box transform (from TransformControls)
  setBoxTransform: (position, scale) => {
    const halfSize: [number, number, number] = [
      scale[0] / 2,
      scale[1] / 2,
      scale[2] / 2,
    ];
    const min: [number, number, number] = [
      position[0] - halfSize[0],
      position[1] - halfSize[1],
      position[2] - halfSize[2],
    ];
    const max: [number, number, number] = [
      position[0] + halfSize[0],
      position[1] + halfSize[1],
      position[2] + halfSize[2],
    ];
    set({
      boxPosition: position,
      boxScale: scale,
      cropMin: min,
      cropMax: max,
    });
  },

  // Reset to original bounds
  resetToOriginal: () =>
    set((state) => {
      const center: [number, number, number] = [
        (state.originalMin[0] + state.originalMax[0]) / 2,
        (state.originalMin[1] + state.originalMax[1]) / 2,
        (state.originalMin[2] + state.originalMax[2]) / 2,
      ];
      const size: [number, number, number] = [
        state.originalMax[0] - state.originalMin[0],
        state.originalMax[1] - state.originalMin[1],
        state.originalMax[2] - state.originalMin[2],
      ];
      return {
        cropMin: state.originalMin,
        cropMax: state.originalMax,
        boxPosition: center,
        boxScale: size,
      };
    }),

  // Initialize from Three.js Box3
  initializeFromBoundingBox: (bbox: THREE.Box3) => {
    const min: [number, number, number] = [bbox.min.x, bbox.min.y, bbox.min.z];
    const max: [number, number, number] = [bbox.max.x, bbox.max.y, bbox.max.z];
    const center: [number, number, number] = [
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2,
    ];
    const size: [number, number, number] = [
      max[0] - min[0],
      max[1] - min[1],
      max[2] - min[2],
    ];
    set({
      originalMin: min,
      originalMax: max,
      cropMin: min,
      cropMax: max,
      boxPosition: center,
      boxScale: size,
    });
  },
}));
