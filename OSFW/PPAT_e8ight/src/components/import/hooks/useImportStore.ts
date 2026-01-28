/**
 * @file useImportStore.ts
 * @description Zustand store for managing STL import state with gizmo controls
 */

import { create } from 'zustand';
import * as THREE from 'three';

export type SourceUnit = 'mm' | 'cm' | 'm' | 'inch';
export type GizmoMode = 'translate' | 'rotate' | 'scale';

// Unit conversion factors to meters
export const UNIT_TO_METERS: Record<SourceUnit, number> = {
  'mm': 0.001,
  'cm': 0.01,
  'm': 1.0,
  'inch': 0.0254,
};

export interface BoundingBoxData {
  min: [number, number, number];
  max: [number, number, number];
  size: { x: number; y: number; z: number };
}

export interface ImportState {
  // File info
  fileUrl: string | null;
  fileName: string;
  
  // Unit settings
  sourceUnit: SourceUnit;
  scaleFactor: number;
  
  // Original geometry bounding box
  originalBounds: BoundingBoxData | null;
  
  // Crop settings
  cropEnabled: boolean;
  cropMin: [number, number, number];
  cropMax: [number, number, number];
  
  // Crop box transform (for gizmo)
  boxPosition: [number, number, number];
  boxRotation: [number, number, number];
  boxScale: [number, number, number];
  
  // Gizmo mode
  gizmoMode: GizmoMode;
  
  // Loading state
  isLoading: boolean;
  
  // Dialog ready state (for TransformControls initialization)
  dialogReady: boolean;
  
  // Crop preview state
  showCropPreview: boolean;
  
  // Cap cross-section option
  capCrossSection: boolean;
  
  // Actions
  setFileInfo: (url: string, name: string) => void;
  setSourceUnit: (unit: SourceUnit) => void;
  setCropEnabled: (enabled: boolean) => void;
  setGizmoMode: (mode: GizmoMode) => void;
  setDialogReady: (ready: boolean) => void;
  setShowCropPreview: (show: boolean) => void;
  setCapCrossSection: (cap: boolean) => void;
  setBoxTransform: (
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
  setCropBounds: (min: [number, number, number], max: [number, number, number]) => void;
  initializeFromGeometry: (geometry: THREE.BufferGeometry) => void;
  resetCropToOriginal: () => void;
  reset: () => void;
}

// Auto-detect unit based on bounding box size (heuristic)
export function detectSourceUnit(maxDimension: number): SourceUnit {
  // Typical vehicle dimensions as reference
  // Car: ~4.5m long, ~1.8m wide, ~1.4m tall
  if (maxDimension > 100) return 'mm';      // 4500+ → likely mm
  if (maxDimension > 10) return 'cm';       // 450+ → likely cm
  if (maxDimension > 0.01) return 'm';      // Already in meters
  return 'm';
}

export const useImportStore = create<ImportState>((set, get) => ({
  // Initial state
  fileUrl: null,
  fileName: '',
  sourceUnit: 'mm',
  scaleFactor: 0.001,
  originalBounds: null,
  cropEnabled: true,
  cropMin: [0, 0, 0],
  cropMax: [1, 1, 1],
  boxPosition: [0, 0, 0],
  boxRotation: [0, 0, 0],
  boxScale: [1, 1, 1],
  gizmoMode: 'translate',
  isLoading: false,
  dialogReady: false,
  showCropPreview: false,
  capCrossSection: true,

  // Set file info
  setFileInfo: (url, name) => set({
    fileUrl: url,
    fileName: name,
    isLoading: true,
  }),

  // Set source unit and update scale factor
  setSourceUnit: (unit) => set({
    sourceUnit: unit,
    scaleFactor: UNIT_TO_METERS[unit],
  }),

  // Toggle crop
  setCropEnabled: (enabled) => set({ cropEnabled: enabled }),

  // Set gizmo mode
  setGizmoMode: (mode) => set({ gizmoMode: mode }),

  // Set dialog ready state
  setDialogReady: (ready) => set({ dialogReady: ready }),

  // Set crop preview state
  setShowCropPreview: (show) => set({ showCropPreview: show }),

  // Set cap cross-section option
  setCapCrossSection: (cap) => set({ capCrossSection: cap }),

  // Set box transform from gizmo
  setBoxTransform: (position, rotation, scale) => {
    // Calculate crop bounds from box transform
    // Note: rotation affects the crop differently - we store it separately
    const halfSize: [number, number, number] = [
      Math.abs(scale[0]) / 2,
      Math.abs(scale[1]) / 2,
      Math.abs(scale[2]) / 2,
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
      boxRotation: rotation,
      boxScale: scale,
      cropMin: min,
      cropMax: max,
    });
  },

  // Set crop bounds directly
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

  // Initialize from loaded geometry
  initializeFromGeometry: (geometry) => {
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    
    if (!bbox) {
      console.warn('[useImportStore] Geometry has no bounding box');
      set({ isLoading: false });
      return;
    }

    const min: [number, number, number] = [bbox.min.x, bbox.min.y, bbox.min.z];
    const max: [number, number, number] = [bbox.max.x, bbox.max.y, bbox.max.z];
    const size = {
      x: max[0] - min[0],
      y: max[1] - min[1],
      z: max[2] - min[2],
    };

    const center: [number, number, number] = [
      (min[0] + max[0]) / 2,
      (min[1] + max[1]) / 2,
      (min[2] + max[2]) / 2,
    ];

    const boxSize: [number, number, number] = [size.x, size.y, size.z];

    // Auto-detect source unit
    const maxDim = Math.max(size.x, size.y, size.z);
    const detectedUnit = detectSourceUnit(maxDim);

    console.log('[useImportStore] Initialized from geometry:', {
      min,
      max,
      size,
      detectedUnit,
      maxDimension: maxDim,
    });

    set({
      originalBounds: { min, max, size },
      cropMin: min,
      cropMax: max,
      boxPosition: center,
      boxRotation: [0, 0, 0],
      boxScale: boxSize,
      sourceUnit: detectedUnit,
      scaleFactor: UNIT_TO_METERS[detectedUnit],
      isLoading: false,
    });
  },

  // Reset crop to original bounds
  resetCropToOriginal: () => {
    const { originalBounds } = get();
    if (!originalBounds) return;

    const center: [number, number, number] = [
      (originalBounds.min[0] + originalBounds.max[0]) / 2,
      (originalBounds.min[1] + originalBounds.max[1]) / 2,
      (originalBounds.min[2] + originalBounds.max[2]) / 2,
    ];

    const size: [number, number, number] = [
      originalBounds.size.x,
      originalBounds.size.y,
      originalBounds.size.z,
    ];

    set({
      cropMin: originalBounds.min,
      cropMax: originalBounds.max,
      boxPosition: center,
      boxRotation: [0, 0, 0],
      boxScale: size,
    });
  },

  // Full reset
  reset: () => set({
    fileUrl: null,
    fileName: '',
    sourceUnit: 'mm',
    scaleFactor: 0.001,
    originalBounds: null,
    cropEnabled: true,
    cropMin: [0, 0, 0],
    cropMax: [1, 1, 1],
    boxPosition: [0, 0, 0],
    boxRotation: [0, 0, 0],
    boxScale: [1, 1, 1],
    gizmoMode: 'translate',
    isLoading: false,
    dialogReady: false,
    showCropPreview: false,
    capCrossSection: true,
  }),
}));
