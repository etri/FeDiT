/**
 * @file viewer.types.ts
 * @description Type definitions for the drei-based 3D viewer
 */

import type { SimulationId } from '../../../configs/simulationConfig';
import type { SolverId } from '../../../configs/solverConfig';

// Simulation types
export type SimulationType = SimulationId;
export type SolverType = SolverId;

// Tank types
export type TankType = 'lbm' | 'sph' | 'sedtank_sph' | 'weir_overflow_sph' | 'sedimentation_tank_lbm' | 'sedimentation_tank_sph';

// Render modes
export type RenderMode =
  | 'solid'           // Normal solid rendering
  | 'wireframe'       // Wireframe only
  | 'points'          // Point cloud
  | 'solid+edges'     // Solid with edge overlay
  | 'solid+wireframe' // Solid with wireframe overlay
  | 'hidden-edges';   // Edges with hidden lines visible

// Bounding box data
export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
  size: {
    x: number;
    y: number;
    z: number;
  };
}

// Model data structure
export interface ModelData {
  id: string;
  url: string;
  name: string;
  type: 'stl' | 'gltf' | 'obj' | 'ply';
  visible: boolean;
  color?: string;
  transparent?: boolean;
  opacity?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  boundingBox?: BoundingBox;
  object?: any; // Three.js object reference for STL export
}

// Lighting configuration
export interface LightingConfig {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: [number, number, number];
  hemisphereIntensity: number;
  hemisphereSkyColor: string;
  hemisphereGroundColor: string;
}

// Display settings
export interface DisplaySettings {
  backgroundColor: string;
  showGrid: boolean;
  showAxes: boolean;
  showDomain: boolean;
  showTriangleVectors: boolean;
  vectorSize: number;
  vectorColor: string;
  enableHover: boolean;
  enableSelection: boolean;
  enableAntialiasing: boolean;
  showEdges: boolean;
  showFeatureEdges: boolean;
  edgeColor: string;
  edgeThreshold: number; // Feature edge angle threshold in degrees
  renderMode: RenderMode;
}

// Domain dimensions for OpenFOAM simulations
export interface DomainDimensions {
  width: number;
  height: number;
  depth: number;
  centerX?: number;  // Optional - domain center X position (defaults to depth/2 if not provided)
  centerY?: number;  // Optional - domain center Y position (defaults to height/2 if not provided)
  centerZ?: number;  // Optional - domain center Z position (defaults to width/2 if not provided)
}

// Water column for Dam Break simulation
export interface WaterColumnConfig {
  width: number;
  height: number;
  depth: number;
}

// Sedimentation Tank STL files
export interface SedTankModels {
  broadWeirFluid: string;  // Broad_weir_fluid.stl
  broadWeirWall: string;   // Broed_weir_wall.stl
  inlet: string;           // Inlet.stl
}

// Camera configuration
export interface CameraConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
}

// Grid configuration
export interface GridConfig {
  cellSize: number;
  cellThickness: number;
  cellColor: string;
  sectionSize: number;
  sectionThickness: number;
  sectionColor: string;
  fadeDistance: number;
  fadeStrength: number;
  fadeFrom: number;
  followCamera: boolean;
  infiniteGrid: boolean;
}

// Shadow configuration
export interface ShadowConfig {
  enabled: boolean;
  frames: number;
  temporal: boolean;
  scale: number;
  opacity: number;
  color: string;
  colorBlend: number;
  lightAmount: number;
  lightRadius: number;
  lightPosition: [number, number, number];
}

// Material types
export type MaterialType = 'standard' | 'transmission';

// Material configuration
export interface MaterialConfig {
  type: MaterialType;
  // Standard material (MeshLambertMaterial/MeshPhongMaterial)
  roughness: number;
  metalness: number;
  // Transmission material (MeshTransmissionMaterial)
  transmission: number;
  thickness: number;
  ior: number; // Index of refraction
  chromaticAberration: number;
  anisotropicBlur: number;
  distortion: number;
  distortionScale: number;
  samples: number; // Quality samples for transmission
}

// Viewer state interface (for Zustand store)
export interface ViewerState {
  // Display settings
  displaySettings: DisplaySettings;

  // Lighting
  lighting: LightingConfig;

  // Camera
  cameraConfig: CameraConfig;

  // Grid
  gridConfig: GridConfig;

  // Shadows
  shadowConfig: ShadowConfig;

  // Material
  materialConfig: MaterialConfig;

  // Models
  models: ModelData[];
  selectedModelId: string | null;
  hoveredModelId: string | null;

  // Simulation specific
  currentSimulation: SimulationType | null;
  solverType: SolverType | null;
  tankType: TankType | null;

  // Simulation data
  waterHeight: number;
  weirHeight: number;
  granuleOBCSideLength: number;
  inletMarkerSideLength: number;
  tankOpacity: number;
  injectionTime: number;
  injectorFlowVelocity: number;
  domainDimensions: DomainDimensions | null;
  waterColumnConfig: WaterColumnConfig | null;

  // UI state
  sidebarVisible: boolean;

  // Transform controls
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  transformSpace: 'world' | 'local';
  isTransforming: boolean;

  // Actions - Display
  setBackgroundColor: (color: string) => void;
  setShowGrid: (show: boolean) => void;
  setShowAxes: (show: boolean) => void;
  setShowDomain: (show: boolean) => void;
  setShowTriangleVectors: (show: boolean) => void;
  setVectorSettings: (size: number, color: string) => void;
  setEnableHover: (enabled: boolean) => void;
  setEnableSelection: (enabled: boolean) => void;
  setEnableAntialiasing: (enabled: boolean) => void;
  setShowEdges: (show: boolean) => void;
  setShowFeatureEdges: (show: boolean) => void;
  setEdgeColor: (color: string) => void;
  setEdgeThreshold: (threshold: number) => void;
  setRenderMode: (mode: RenderMode) => void;

  // Actions - Lighting
  setAmbientIntensity: (intensity: number) => void;
  setDirectionalIntensity: (intensity: number) => void;
  setDirectionalColor: (color: string) => void;
  setDirectionalPosition: (position: [number, number, number]) => void;
  setHemisphereIntensity: (intensity: number) => void;
  setHemisphereColors: (skyColor: string, groundColor: string) => void;

  // Actions - Camera
  setCameraConfig: (config: Partial<CameraConfig>) => void;

  // Actions - Grid
  setGridConfig: (config: Partial<GridConfig>) => void;

  // Actions - Shadow
  setShadowConfig: (config: Partial<ShadowConfig>) => void;

  // Actions - Material
  setMaterialConfig: (config: Partial<MaterialConfig>) => void;

  // Actions - Models
  addModel: (model: ModelData) => void;
  removeModel: (id: string) => void;
  updateModel: (id: string, updates: Partial<ModelData>) => void;
  clearModels: () => void;
  setSelectedModelId: (id: string | null) => void;
  setHoveredModelId: (id: string | null) => void;

  // Actions - Simulation
  setSimulation: (simulation: SimulationType | null) => void;
  setSolverType: (solver: SolverType | null) => void;
  setTankType: (tankType: TankType | null) => void;

  // Actions - Simulation data
  setWaterHeight: (height: number) => void;
  setWeirHeight: (height: number) => void;
  setGranuleOBCSideLength: (length: number) => void;
  setInletMarkerSideLength: (length: number) => void;
  setTankOpacity: (opacity: number) => void;
  setInjectionTime: (time: number) => void;
  setInjectorFlowVelocity: (velocity: number) => void;
  setDomainDimensions: (dimensions: DomainDimensions | null) => void;
  setWaterColumnConfig: (config: WaterColumnConfig | null) => void;

  // Actions - UI state
  setSidebarVisible: (visible: boolean) => void;

  // Actions - Transform controls
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | null) => void;
  setTransformSpace: (space: 'world' | 'local') => void;
  setIsTransforming: (isTransforming: boolean) => void;

  // Actions - Reset
  reset: () => void;
}

// Component props types
export interface ViewerCanvasProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface SceneContentProps {
  // Props can be added as needed
}
