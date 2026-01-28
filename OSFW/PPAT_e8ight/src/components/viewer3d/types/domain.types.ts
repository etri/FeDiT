/**
 * @file domain.types.ts
 * @description Comprehensive domain configuration types for CFD simulations
 */

import type { Vector3Tuple } from './common.types';

// Domain shape types
export type DomainShape = 'box' | 'cylinder' | 'sphere' | 'custom';

// Boundary condition types (OpenFOAM compatible)
export type BoundaryType =
  | 'wall'           // No-slip wall
  | 'inlet'          // Velocity or pressure inlet
  | 'outlet'         // Pressure outlet
  | 'symmetry'       // Symmetry plane
  | 'periodic'       // Periodic boundary
  | 'empty'          // 2D simulation boundary
  | 'patch'          // Generic patch
  | 'processor'      // Inter-processor boundary
  | 'atmosphere'     // Open atmosphere
  | 'slip';          // Slip wall

// Boundary face names for box domain
export type BoxFace = 'xMin' | 'xMax' | 'yMin' | 'yMax' | 'zMin' | 'zMax';

// Cylinder face names
export type CylinderFace = 'inlet' | 'outlet' | 'wall' | 'axis';

// Base boundary configuration
export interface BoundaryConfig {
  type: BoundaryType;
  name: string;
  // Velocity boundary condition
  velocity?: {
    type: 'fixedValue' | 'zeroGradient' | 'inletOutlet' | 'slip' | 'noSlip';
    value?: Vector3Tuple;
  };
  // Pressure boundary condition
  pressure?: {
    type: 'fixedValue' | 'zeroGradient' | 'totalPressure' | 'fixedFluxPressure';
    value?: number;
  };
  // Temperature boundary condition (for heat transfer)
  temperature?: {
    type: 'fixedValue' | 'zeroGradient' | 'inletOutlet';
    value?: number;
  };
  // Turbulence boundary conditions
  turbulence?: {
    k?: number;        // Turbulent kinetic energy
    epsilon?: number;  // Turbulent dissipation rate
    omega?: number;    // Specific dissipation rate
    nut?: number;      // Turbulent viscosity
  };
}

// Mesh refinement region
export interface RefinementRegion {
  id: string;
  name: string;
  shape: 'box' | 'cylinder' | 'sphere';
  // Box parameters
  min?: Vector3Tuple;
  max?: Vector3Tuple;
  // Cylinder parameters
  point1?: Vector3Tuple;
  point2?: Vector3Tuple;
  radius?: number;
  // Sphere parameters
  center?: Vector3Tuple;
  sphereRadius?: number;
  // Refinement level
  level: number; // 0 = coarse, higher = finer
}

// Mesh quality criteria
export interface MeshQualityCriteria {
  maxNonOrthogonality: number;  // Maximum non-orthogonality angle (degrees)
  maxSkewness: number;           // Maximum skewness
  maxAspectRatio: number;        // Maximum aspect ratio
  minDeterminant: number;        // Minimum cell determinant
  minFaceArea: number;           // Minimum face area (m²)
  minCellVolume: number;         // Minimum cell volume (m³)
}

// Mesh configuration
export interface MeshConfig {
  // Base mesh resolution
  cellSize: number;              // Base cell size in meters
  // Mesh divisions for structured mesh
  divisions?: {
    x: number;
    y: number;
    z: number;
  };
  // Refinement regions
  refinementRegions: RefinementRegion[];
  // Surface refinement level
  surfaceRefinementLevel: number;
  // Feature edge refinement
  featureRefinementLevel: number;
  // Layers configuration
  layers?: {
    nLayers: number;           // Number of layers
    expansionRatio: number;    // Layer expansion ratio
    finalLayerThickness: number; // Final layer thickness ratio
    minThickness: number;      // Minimum thickness ratio
  };
  // Mesh quality controls
  quality: MeshQualityCriteria;
  // Mesh motion (for dynamic mesh)
  motion?: {
    type: 'static' | 'rotating' | 'oscillating' | 'deforming';
    // Rotation parameters
    rotationAxis?: Vector3Tuple;
    rotationCenter?: Vector3Tuple;
    rpm?: number;
    // Oscillation parameters
    amplitude?: Vector3Tuple;
    frequency?: number;
  };
}

// Base domain configuration
export interface BaseDomain {
  id: string;
  name: string;
  shape: DomainShape;
  units: 'meters' | 'millimeters' | 'inches';
  // Origin point for domain positioning
  origin: Vector3Tuple;
  // Mesh configuration
  mesh: MeshConfig;
  // Boundary conditions
  boundaries: Record<string, BoundaryConfig>;
  // Display settings
  display: {
    visible: boolean;
    color: string;
    opacity: number;
    wireframe: boolean;
    showBoundaries: boolean;
    showRefinementRegions: boolean;
  };
}

// Box domain configuration
export interface BoxDomain extends BaseDomain {
  shape: 'box';
  dimensions: {
    width: number;   // X dimension
    height: number;  // Y dimension
    depth: number;   // Z dimension
  };
  boundaries: Record<BoxFace, BoundaryConfig>;
}

// Cylinder domain configuration
export interface CylinderDomain extends BaseDomain {
  shape: 'cylinder';
  dimensions: {
    radius: number;
    height: number;
    axis: 'x' | 'y' | 'z';
  };
  boundaries: Record<CylinderFace, BoundaryConfig>;
}

// Sphere domain configuration
export interface SphereDomain extends BaseDomain {
  shape: 'sphere';
  dimensions: {
    radius: number;
  };
  boundaries: {
    outer: BoundaryConfig;
  };
}

// Custom domain with imported geometry
export interface CustomDomain extends BaseDomain {
  shape: 'custom';
  geometry: {
    type: 'stl' | 'obj';
    url: string;
    scale: Vector3Tuple;
    rotation: Vector3Tuple;
  };
  // Custom boundaries defined by patch names
  boundaries: Record<string, BoundaryConfig>;
}

// Union type for all domain types
export type Domain = BoxDomain | CylinderDomain | SphereDomain | CustomDomain;

// Domain preset for common cases
export interface DomainPreset {
  id: string;
  name: string;
  description: string;
  category: 'external-flow' | 'internal-flow' | 'multiphase' | 'heat-transfer';
  icon?: string;
  domain: Partial<Domain>;
}

// Domain validation result
export interface DomainValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: {
    cellCount?: number;
    minCellSize?: number;
    maxCellSize?: number;
    meshQuality?: 'excellent' | 'good' | 'acceptable' | 'poor';
  };
}

// Domain state for the store
export interface DomainState {
  // Current domain configuration
  domain: Domain | null;
  // Available presets
  presets: DomainPreset[];
  // Validation state
  validation: DomainValidation | null;
  // UI state
  selectedBoundary: string | null;
  selectedRefinementRegion: string | null;
  showMeshPreview: boolean;

  // Actions
  setDomain: (domain: Domain | null) => void;
  updateDomain: (updates: Partial<Domain>) => void;
  updateDimensions: (dimensions: any) => void;
  setBoundaryCondition: (face: string, config: BoundaryConfig) => void;
  addRefinementRegion: (region: RefinementRegion) => void;
  removeRefinementRegion: (id: string) => void;
  updateRefinementRegion: (id: string, updates: Partial<RefinementRegion>) => void;
  updateMeshConfig: (config: Partial<MeshConfig>) => void;
  applyPreset: (presetId: string) => void;
  validateDomain: () => Promise<DomainValidation>;
  exportDomain: () => any; // Export domain configuration
  importDomain: (config: any) => void; // Import domain configuration
  reset: () => void;
}