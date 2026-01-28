import { create } from 'zustand';
import * as THREE from 'three';
import type { VehicleDimensions } from '../utils/vehicleOrientationDetector';
import type { Unit } from '../utils/unitConverter';

export interface AutoDomainSettings {
  // Extension multiples for automotive aerodynamics
  frontExtension: number;  // Multiple of vehicle length
  rearExtension: number;   // Multiple of vehicle length
  sideRatio: number;       // Multiple of vehicle width
  heightRatio: number;     // Multiple of vehicle height

  // Vehicle dimensions (detected automatically)
  vehicleLength: number | null;
  vehicleWidth: number | null;
  vehicleHeight: number | null;
  vehicleOrientation: 'X' | 'Y' | 'Z' | null;

  // CFD Reference values (auto-calculated)
  referenceLength: number | null;  // Vehicle length (for Reynolds number)
  frontalArea: number | null;      // Front projection area (for drag/lift coefficients)

  // Domain bounds
  domainBounds: THREE.Box3 | null;

  // Units
  detectedUnit: Unit | null;
  displayUnit: Unit;
  scaleFactor: number;  // Scale factor to convert from detected to display unit

  // Solver settings
  numberOfIterations: number;
  writeInterval: number;

  // Mesh quality settings
  meshRefinementLevel: number;  // 0: coarse, 1: medium, 2: fine, 3: very fine

  // Detailed Mesh Settings
  baseCellSize: number; // Base mesh cell size (m)
  vehicleSurfaceRefinement: number; // Refinement level around vehicle (0-5)
  wakeRefinement: number; // Refinement level in wake region (0-5)
  groundRefinement: number; // Refinement level near ground (0-5)

  // Boundary Layer Settings
  nBoundaryLayers: number; // Number of boundary layer cells (0-10)
  boundaryLayerExpansionRatio: number; // Expansion ratio (1.0-2.0)
  boundaryLayerFirstThickness: number; // First layer thickness (m)

  // Result file output settings
  writeControl: 'timeStep' | 'runTime' | 'adjustableRunTime' | 'cpuTime' | 'clockTime';  // When to write results
  writeFormat: 'ascii' | 'binary';  // File format for results
  writePrecision: number;           // Number of significant digits (6-15)
  writeCompression: boolean;        // Enable compression for result files
  purgeWrite: number;               // Keep only last N time directories (0 = keep all)

  // Solver stability settings
  relaxationP: number;              // Pressure relaxation factor (0.1-0.7, lower = more stable)
  relaxationU: number;              // Velocity relaxation factor (0.3-0.9, lower = more stable)
  nNonOrthogonalCorrectors: number; // Non-orthogonal correctors (0-3, higher = better quality)
}

interface AutoDomainStore {
  // Settings
  settings: AutoDomainSettings;

  // Visibility controls
  isVisible: boolean;
  showWireframe: boolean;
  showPlanes: boolean;
  showDimensions: boolean;

  // Auto-generation
  autoGenerate: boolean;

  // Vehicle dimensions cache
  vehicleDimensions: VehicleDimensions | null;

  // Three.js objects
  domainGroup: THREE.Group | null;

  // Actions
  updateSettings: (settings: Partial<AutoDomainSettings>) => void;
  setVehicleDimensions: (dimensions: VehicleDimensions) => void;
  setDomainBounds: (bounds: THREE.Box3) => void;
  setDomainGroup: (group: THREE.Group | null) => void;
  setUnit: (unit: Unit) => void;
  setDetectedUnit: (unit: Unit) => void;
  toggleVisibility: (visible?: boolean) => void;
  toggleWireframe: (show?: boolean) => void;
  togglePlanes: (show?: boolean) => void;
  toggleDimensions: (show?: boolean) => void;
  toggleAutoGenerate: (auto?: boolean) => void;
  flipFlowDirection: () => void;
  resetToDefaults: () => void;
  clearDomain: () => void;
}

const defaultSettings: AutoDomainSettings = {
  frontExtension: 3,    // 3x vehicle length in front
  rearExtension: 7,     // 7x vehicle length in rear
  sideRatio: 5,        // 5x vehicle width total
  heightRatio: 5,      // 5x vehicle height total
  vehicleLength: null,
  vehicleWidth: null,
  vehicleHeight: null,
  vehicleOrientation: null,
  referenceLength: null,
  frontalArea: null,
  domainBounds: null,
  detectedUnit: null,
  displayUnit: 'm',    // Default to meters
  scaleFactor: 1.0,
  numberOfIterations: 2000,
  writeInterval: 100,
  meshRefinementLevel: 2,  // Fine quality by default (more accurate mesh)
  baseCellSize: 0.5,       // 0.5m base cell size
  vehicleSurfaceRefinement: 3, // 3 levels around vehicle
  wakeRefinement: 2,       // 2 levels in wake
  groundRefinement: 1,     // 1 level near ground
  nBoundaryLayers: 5,      // 5 boundary layers
  boundaryLayerExpansionRatio: 1.2, // 1.2x expansion
  boundaryLayerFirstThickness: 0.001, // 1mm first layer
  writeControl: 'timeStep', // Write based on time steps
  writeFormat: 'binary',   // Binary format for smaller file size
  writePrecision: 6,       // 6 significant digits (default)
  writeCompression: false, // No compression by default
  purgeWrite: 0,           // Keep all time directories by default
  relaxationP: 0.3,        // Pressure relaxation (conservative for stability)
  relaxationU: 0.7,        // Velocity relaxation (balanced)
  nNonOrthogonalCorrectors: 2, // Non-orthogonal correctors (good quality)
};

export const useAutoDomainStore = create<AutoDomainStore>((set, get) => ({
  // Initial state
  settings: { ...defaultSettings },
  isVisible: true,
  showWireframe: true,
  showPlanes: true,
  showDimensions: false,
  autoGenerate: true,
  vehicleDimensions: null,
  domainGroup: null,

  // Actions
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setVehicleDimensions: (dimensions) => {
    // Calculate frontal area (width × height)
    const frontalArea = dimensions.width * dimensions.height;

    // Reference length is the vehicle length
    const referenceLength = dimensions.length;

    set({
      vehicleDimensions: dimensions,
      settings: {
        ...get().settings,
        vehicleLength: dimensions.length,
        vehicleWidth: dimensions.width,
        vehicleHeight: dimensions.height,
        vehicleOrientation: dimensions.orientation,
        referenceLength: referenceLength,
        frontalArea: frontalArea,
      },
    });
  },

  setDomainBounds: (bounds) =>
    set((state) => ({
      settings: { ...state.settings, domainBounds: bounds },
    })),

  setDomainGroup: (group) =>
    set({ domainGroup: group }),

  setUnit: (unit) => {
    const currentSettings = get().settings;
    const detectedUnit = currentSettings.detectedUnit || 'm';

    // Calculate scale factor for conversion
    let scaleFactor = 1.0;
    if (detectedUnit !== unit) {
      // Import the conversion function
      const { getConversionFactor } = require('../utils/unitConverter');
      scaleFactor = getConversionFactor(detectedUnit, unit);
    }

    set((state) => ({
      settings: {
        ...state.settings,
        displayUnit: unit,
        scaleFactor,
      },
    }));
  },

  setDetectedUnit: (unit) =>
    set((state) => ({
      settings: {
        ...state.settings,
        detectedUnit: unit,
        displayUnit: unit,  // Initially set display unit same as detected
        scaleFactor: 1.0,
      },
    })),

  toggleVisibility: (visible) =>
    set((state) => ({
      isVisible: visible !== undefined ? visible : !state.isVisible,
    })),

  toggleWireframe: (show) =>
    set((state) => ({
      showWireframe: show !== undefined ? show : !state.showWireframe,
    })),

  togglePlanes: (show) =>
    set((state) => ({
      showPlanes: show !== undefined ? show : !state.showPlanes,
    })),

  toggleDimensions: (show) =>
    set((state) => ({
      showDimensions: show !== undefined ? show : !state.showDimensions,
    })),

  toggleAutoGenerate: (auto) =>
    set((state) => ({
      autoGenerate: auto !== undefined ? auto : !state.autoGenerate,
    })),

  flipFlowDirection: () => {
    const currentSettings = get().settings;
    const tempFront = currentSettings.frontExtension;

    set((state) => ({
      settings: {
        ...state.settings,
        frontExtension: currentSettings.rearExtension,
        rearExtension: tempFront,
      },
    }));

    console.log('[AutoDomainStore] Flow direction flipped:', {
      oldFront: tempFront,
      newFront: currentSettings.rearExtension,
      oldRear: currentSettings.rearExtension,
      newRear: tempFront,
    });

    // Trigger shadow regeneration after flipping
    const event = new CustomEvent('domainUpdated', {
      detail: {
        action: 'flipFlowDirection',
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
    console.log('[AutoDomainStore] Flow flipped, triggering shadow regeneration');
  },

  resetToDefaults: () => {
    const currentState = get();
    set({
      settings: {
        ...defaultSettings,
        vehicleLength: currentState.settings.vehicleLength,
        vehicleWidth: currentState.settings.vehicleWidth,
        vehicleHeight: currentState.settings.vehicleHeight,
        vehicleOrientation: currentState.settings.vehicleOrientation,
      },
    });

    // Trigger shadow regeneration after reset
    const event = new CustomEvent('domainUpdated', {
      detail: {
        action: 'resetToDefaults',
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
    console.log('[AutoDomainStore] Settings reset, triggering shadow regeneration');
  },

  clearDomain: () => {
    // Clean up Three.js objects
    const domainGroup = get().domainGroup;
    if (domainGroup) {
      domainGroup.clear();
      domainGroup.removeFromParent();
    }

    set({
      settings: { ...defaultSettings },
      vehicleDimensions: null,
      domainGroup: null,
      isVisible: true,
      showWireframe: true,
      showPlanes: true,
      showDimensions: false,
    });
  },
}));