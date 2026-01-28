/**
 * CFD Preprocessor Type Definitions
 * This file contains all TypeScript type definitions used throughout the application
 */

// ============================================================================
// Analysis Configuration Types
// ============================================================================

export type AnalysisType =
  | 'automotive'
  | 'pipe'
  | 'marine'
  | 'turbo'
  | 'custom';

export interface AnalysisConfig {
  title: string;
  info: string;
  solver: string;
  turbulence: string;
  sections: string[];
}

export interface AnalysisConfigs {
  [key: string]: AnalysisConfig;
}

// ============================================================================
// Vehicle Configuration Types
// ============================================================================

export interface WindSpeed {
  kmh: number;
  ms: number;
}

export interface VehicleConfig {
  refLength: number;
  frontalArea: number;
  windSpeed: WindSpeed;
  yawAngle: number;
  reynoldsNumber: string;
  groundEffect: boolean;
  rotatingWheels: boolean;
}

// ============================================================================
// Domain Configuration Types
// ============================================================================

export type DomainType = 'windTunnel' | 'freeStream' | 'periodic';

export interface DomainDimensions {
  front: number;
  rear: number;
  top: number;
  side: number;
}

export interface DomainActualSize {
  length: number;
  width: number;
  height: number;
  volume: number;
}

export interface DomainConfig {
  type: DomainType;
  dimensions: DomainDimensions;
  actualSize: DomainActualSize;
  blockageRatio: number;
}

// ============================================================================
// Simulation Configuration Types
// ============================================================================

export type AnalysisMode = 'transient' | 'steadyState';
export type WriteControl = 'timeStep' | 'adjustableRunTime' | 'runTime';
export type WriteFormat = 'ascii' | 'binary';
export type WriteCompression = 'on' | 'off';

export interface PimpleConfig {
  nOuterCorrectors: number;
  nCorrectors: number;
  nNonOrthogonalCorrectors: number;
}

export interface ParallelConfig {
  numberOfProcessors: number;
  decompositionMethod: string;
  distributedIO: boolean;
}

export interface SimulationConfig {
  endTime: number;
  deltaT: number;
  writeInterval: number;
  adjustTimeStep: boolean;
  maxCo: number;
  maxDeltaT: number;
  writeControl: WriteControl;
  writePrecision: number;
  writeCompression: WriteCompression;
  writeFormat: WriteFormat;
  purgeWrite: number;
  pimple: PimpleConfig;
  parallel: ParallelConfig;
}

// ============================================================================
// Turbulence Configuration Types
// ============================================================================

export type TurbulenceModel = 
  | 'kOmegaSST' 
  | 'kEpsilon' 
  | 'kEpsilonRNG' 
  | 'SpalartAllmaras' 
  | 'kOmega';

export type YPlusTarget = 'wallFunction' | 'lowRe' | 'resolved';

export interface TurbulenceConfig {
  model: TurbulenceModel;
  intensity: number;
  lengthScale: number;
  k: number;
  omega: number;
  yPlusTarget: YPlusTarget;
  blendingFunction: string;
}

// ============================================================================
// Fluid Configuration Types
// ============================================================================

export type FluidMaterial = 'air' | 'water' | 'oil' | 'custom';

export interface FluidConfig {
  material: FluidMaterial;
  density: number;
  dynamicViscosity: number;
  kinematicViscosity: number;
  pressure: number;
}

// ============================================================================
// Mesh Configuration Types
// ============================================================================

export type MeshStrategy = 'automotive' | 'pipe' | 'marine';
export type MeshType = 'snappyHexMesh' | 'blockMesh' | 'cfMesh';

export interface BoundaryLayersConfig {
  enabled: boolean;
  nLayers: number;
  expansionRatio: number;
  firstLayerThickness: number;
}

export interface MeshConfig {
  strategy: MeshStrategy;
  mesher: MeshType;
  baseCellSize: number;
  surfaceRefinement: number;
  wakeRefinement: number;
  boundaryLayers: BoundaryLayersConfig;
}

// ============================================================================
// Post-Processing Configuration Types
// ============================================================================

export interface PostProcessingConfig {
  forceCoeffs: boolean;
  pressureCoeffs: boolean;
  wallShearStress: boolean;
  qCriterion: boolean;
  lambda2: boolean;
  streamlines: boolean;
  yPlusField: boolean;
}

// ============================================================================
// Boundary Condition Types
// ============================================================================

export type BoundaryType = 'inlet' | 'outlet' | 'wall' | 'symmetry' | 'slip';
export type BoundaryFace = 'front' | 'back' | 'top' | 'bottom' | 'left' | 'right';
export type WallType = 'noSlip' | 'moving' | 'slip';
export type WallFunction = 'standard' | 'lowRe' | 'scalable';

export interface VelocityVector {
  x: number;
  y: number;
  z: number;
}

export interface TurbulenceProperties {
  k: number;
  omega: number;
}

export interface BoundaryProperties {
  velocity?: VelocityVector;
  pressure?: number;
  turbulence?: TurbulenceProperties;
  wallType?: WallType;
  wallFunction?: WallFunction;
}

export interface BoundaryCondition {
  name: string;
  type: BoundaryType;
  face: BoundaryFace;
  properties: BoundaryProperties;
}

// ============================================================================
// Model Information Types
// ============================================================================

export interface ModelInfo {
  hasModel: boolean;
  modelName: string;
}

// ============================================================================
// Main Configuration Type
// ============================================================================

export interface CFDConfiguration {
  metadata: {
    caseName: string;
    solver: string;
    analysisType: AnalysisMode;
    turbulenceModel: TurbulenceModel;
    generated: string;
  };
  vehicle: VehicleConfig;
  domain: DomainConfig;
  simulation: SimulationConfig;
  turbulence: TurbulenceConfig;
  fluid: FluidConfig;
  mesh: MeshConfig;
  postProcessing: PostProcessingConfig;
  boundaries: BoundaryCondition[];
  modelInfo: ModelInfo;
}

// ============================================================================
// UI Configuration Types
// ============================================================================

export interface SavePreset {
  writeControl: WriteControl;
  writeInterval: number;
  purgeWrite: number;
  writeFormat: WriteFormat;
  writeCompression: WriteCompression;
}

export interface SavePresets {
  debug: SavePreset;
  normal: SavePreset;
  production: SavePreset;
}

// ============================================================================
// Transform Configuration Types
// ============================================================================

export type TransformMode = 'none' | 'translate' | 'rotate' | 'scale';
export type TransformSpace = 'local' | 'world';

export interface TransformState {
  position: VelocityVector;
  rotation: VelocityVector;
  scale: VelocityVector;
}

export interface TransformSnapping {
  translation: number;
  rotation: number;
  scale: number;
}

// ============================================================================
// Viewer Configuration Types
// ============================================================================

export interface CameraConfig {
  fov: number;
  distance: number;
  rotationSpeed: number;
  autoRotate: boolean;
}

export interface LightingConfig {
  ambientIntensity: number;
  ambientColor: string;
  directionalIntensity: number;
  directionalColor: string;
  shadowsEnabled: boolean;
}

export interface MaterialConfig {
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
}

export interface DisplayConfig {
  backgroundColor: string;
  gridEnabled: boolean;
  axesEnabled: boolean;
  antialiasEnabled: boolean;
}

export interface ViewerConfig {
  camera: CameraConfig;
  lighting: LightingConfig;
  material: MaterialConfig;
  display: DisplayConfig;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'success' | 'error' | 'warning';

export interface Notification {
  message: string;
  type: NotificationType;
  duration?: number;
}

// ============================================================================
// Loading Indicator Types
// ============================================================================

export interface LoadingStep {
  number: number;
  message: string;
  active: boolean;
  completed: boolean;
}

export interface LoadingConfig {
  title: string;
  steps: LoadingStep[];
  currentStep: number;
}

// ============================================================================
// File Handling Types
// ============================================================================

export type FileFormat = 'step' | 'stp' | 'glb' | 'gltf' | 'igs' | 'iges';

export interface FileInfo {
  name: string;
  size: number;
  type: FileFormat;
  lastModified: Date;
}

// ============================================================================
// Export Configuration Types
// ============================================================================

export interface STLExportConfig {
  binary: boolean;
  scaleFactor: number;
  centerAtOrigin: boolean;
}

export interface OpenFOAMExportConfig {
  includeMesh: boolean;
  includeBoundaryConditions: boolean;
  includeSolverSettings: boolean;
  includePostProcessing: boolean;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface PerformanceStats {
  fps: number;
  triangleCount: number;
  drawCalls: number;
  memoryUsage: number;
}

// ============================================================================
// Event Handler Types
// ============================================================================

export interface MouseEvent {
  clientX: number;
  clientY: number;
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface KeyboardEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
  center: Vector3;
  size: Vector3;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  size?: number;
  error?: string;
}

// ============================================================================
// Global Window Extensions
// ============================================================================

declare global {
  interface Window {
    viewer?: any;
    cfdManager?: any;
    uiPanel?: any;
    THREE?: any;
    STLExporter?: any;
    OpenFOAMExporter?: any;
    STEPLoader?: any;
    
    // Global functions
    selectAnalysis?: (type: AnalysisType) => void;
    backToSelection?: () => void;
    openParameterGuide?: () => void;
    exportSTL?: () => void;
    exportOpenFOAMNative?: () => Promise<void>;
    showLoading?: (title: string, message: string) => void;
    hideLoading?: () => void;
    updateLoadingStep?: (stepNumber: number, message?: string) => void;
    completeLoading?: () => void;
    applySavePreset?: (preset: keyof SavePresets) => void;
    togglePanel?: (panelId: string) => void;
    handleViewportResize?: () => void;
    setupResizeObserver?: () => void;
    updateWriteIntervalLabel?: () => void;
    updateSaveFrequency?: () => void;
    updateSolverSettings?: () => void;
    updateProcessorSettings?: () => void;
    updateTurbulenceSettings?: () => void;
    updateReynolds?: () => void;
  }
}

export {};
