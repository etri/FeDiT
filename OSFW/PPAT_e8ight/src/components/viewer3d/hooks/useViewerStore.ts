/**
 * @file useViewerStore.ts
 * @description Zustand store for managing 3D viewer state
 */

import { create } from 'zustand';
import type { ViewerState, ModelData, DomainDimensions, WaterColumnConfig, CameraConfig, RenderMode, GridConfig, ShadowConfig, MaterialConfig } from '../types/viewer.types';

// Default values
const DEFAULT_LIGHTING = {
  ambientIntensity: 0.5,
  directionalIntensity: 0.8,
  directionalColor: '#ffffff',
  directionalPosition: [5, 10, 7.5] as [number, number, number],
  hemisphereIntensity: 1.0,
  hemisphereSkyColor: '#ffffff',
  hemisphereGroundColor: '#444444',
};

const DEFAULT_DISPLAY = {
  backgroundColor: '#a8a8a8',
  showGrid: false,
  showAxes: false,
  showDomain: true,
  showTriangleVectors: false,
  vectorSize: 1.0,
  vectorColor: '#00ff00',
  enableHover: false,
  enableSelection: false,
  enableAntialiasing: true,
  showEdges: false,
  showFeatureEdges: false,
  edgeColor: '#000000',
  edgeThreshold: 30, // degrees
  renderMode: 'solid' as RenderMode,
};

const DEFAULT_CAMERA: CameraConfig = {
  position: [0.1, 0.15, -0.1] as [number, number, number],
  target: [0, 0.03, 0] as [number, number, number],
  fov: 45,
  near: 0.001,  // Increased from 0.0001 to reduce z-fighting
  far: 100000,  // Increased to 100,000 for extreme zoom out capability
};

const DEFAULT_GRID: GridConfig = {
  cellSize: 1,             // 1m cells (meter-based grid)
  cellThickness: 0.5,      // Thin lines for cells
  cellColor: '#6e6e6e',    // Gray for cells
  sectionSize: 10,         // 10m sections (10 cells per section)
  sectionThickness: 1.0,   // Thicker lines for sections
  sectionColor: '#2080ff', // Blue for major sections
  fadeDistance: 500,       // Fade starts at 500m
  fadeStrength: 1,         // Full fade strength
  fadeFrom: 1,             // Fade from camera (0=origin, 1=camera)
  followCamera: false,     // Static grid
  infiniteGrid: true,      // Infinite grid display
};

const DEFAULT_SHADOW: ShadowConfig = {
  enabled: true,           // Shadows on by default
  frames: 100,             // Number of frames to accumulate
  temporal: true,          // Temporal accumulation for smooth shadows
  scale: 100,              // Shadow plane scale (large for wide coverage)
  opacity: 1,              // Shadow opacity
  color: '#000000',        // Shadow color
  colorBlend: 0.5,         // Color blending amount
  lightAmount: 8,          // Number of randomized lights
  lightRadius: 5,          // Radius of light spread
  lightPosition: [5, 5, -10] as [number, number, number], // Light position
};

const DEFAULT_MATERIAL: MaterialConfig = {
  type: 'transmission',    // Transmission material by default for realistic water
  // Standard material properties
  roughness: 0.0,          // Surface roughness (0=smooth glass/water)
  metalness: 0.0,          // Metalness (0=dielectric, 1=metal)
  // Transmission material properties
  transmission: 1.0,       // Light transmission (0=opaque, 1=transparent)
  thickness: 0.5,          // Refraction thickness
  ior: 1.33,               // Index of refraction (water≈1.33, glass≈1.5)
  chromaticAberration: 0.03, // Color separation effect
  anisotropicBlur: 0.1,    // Directional blur
  distortion: 0.0,         // Surface distortion
  distortionScale: 0.5,    // Distortion intensity
  samples: 16,             // Quality samples (higher=better but slower, 16 for smooth AA)
};

export const useViewerStore = create<ViewerState>((set) => ({
  // Initial state
  displaySettings: DEFAULT_DISPLAY,
  lighting: DEFAULT_LIGHTING,
  cameraConfig: DEFAULT_CAMERA,
  gridConfig: DEFAULT_GRID,
  shadowConfig: DEFAULT_SHADOW,
  materialConfig: DEFAULT_MATERIAL,
  models: [],
  selectedModelId: null,
  hoveredModelId: null,
  currentSimulation: null,
  solverType: null,
  tankType: null,
  waterHeight: 0,
  weirHeight: 0.9,
  granuleOBCSideLength: 1.0,
  inletMarkerSideLength: 0.1,
  tankOpacity: 0.5,
  injectionTime: 0,
  injectorFlowVelocity: 0,
  domainDimensions: null,
  waterColumnConfig: null,
  sidebarVisible: false,

  // Transform controls
  transformMode: null,
  transformSpace: 'world',
  isTransforming: false,

  // Display actions
  setBackgroundColor: (color: string) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, backgroundColor: color },
    })),

  setShowGrid: (show: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, showGrid: show },
    })),

  setShowAxes: (show: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, showAxes: show },
    })),

  setShowDomain: (show: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, showDomain: show },
    })),

  setShowTriangleVectors: (show: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, showTriangleVectors: show },
    })),

  setVectorSettings: (size: number, color: string) =>
    set((state) => ({
      displaySettings: {
        ...state.displaySettings,
        vectorSize: size,
        vectorColor: color,
      },
    })),

  setEnableHover: (enabled: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, enableHover: enabled },
    })),

  setEnableSelection: (enabled: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, enableSelection: enabled },
    })),

  setEnableAntialiasing: (enabled: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, enableAntialiasing: enabled },
    })),

  setShowEdges: (show: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, showEdges: show },
    })),

  setShowFeatureEdges: (show: boolean) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, showFeatureEdges: show },
    })),

  setEdgeColor: (color: string) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, edgeColor: color },
    })),

  setEdgeThreshold: (threshold: number) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, edgeThreshold: threshold },
    })),

  setRenderMode: (mode: RenderMode) =>
    set((state) => ({
      displaySettings: { ...state.displaySettings, renderMode: mode },
    })),

  // Lighting actions
  setAmbientIntensity: (intensity: number) =>
    set((state) => ({
      lighting: { ...state.lighting, ambientIntensity: intensity },
    })),

  setDirectionalIntensity: (intensity: number) =>
    set((state) => ({
      lighting: { ...state.lighting, directionalIntensity: intensity },
    })),

  setDirectionalColor: (color: string) =>
    set((state) => ({
      lighting: { ...state.lighting, directionalColor: color },
    })),

  setDirectionalPosition: (position: [number, number, number]) =>
    set((state) => ({
      lighting: { ...state.lighting, directionalPosition: position },
    })),

  setHemisphereIntensity: (intensity: number) =>
    set((state) => ({
      lighting: { ...state.lighting, hemisphereIntensity: intensity },
    })),

  setHemisphereColors: (skyColor: string, groundColor: string) =>
    set((state) => ({
      lighting: {
        ...state.lighting,
        hemisphereSkyColor: skyColor,
        hemisphereGroundColor: groundColor,
      },
    })),

  // Camera actions
  setCameraConfig: (config: Partial<CameraConfig>) =>
    set((state) => ({
      cameraConfig: { ...state.cameraConfig, ...config },
    })),

  // Grid actions
  setGridConfig: (config: Partial<GridConfig>) =>
    set((state) => ({
      gridConfig: { ...state.gridConfig, ...config },
    })),

  // Shadow actions
  setShadowConfig: (config: Partial<ShadowConfig>) =>
    set((state) => ({
      shadowConfig: { ...state.shadowConfig, ...config },
    })),

  // Material actions
  setMaterialConfig: (config: Partial<MaterialConfig>) =>
    set((state) => ({
      materialConfig: { ...state.materialConfig, ...config },
    })),

  // Model actions
  addModel: (model: ModelData) =>
    set((state) => ({
      models: [...state.models, model],
    })),

  removeModel: (id: string) =>
    set((state) => ({
      models: state.models.filter((m) => m.id !== id),
    })),

  updateModel: (id: string, updates: Partial<ModelData>) =>
    set((state) => ({
      models: state.models.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  clearModels: () => set({ models: [] }),

  setSelectedModelId: (id: string | null) => set({ selectedModelId: id }),

  setHoveredModelId: (id: string | null) => set({ hoveredModelId: id }),

  // Simulation actions
  setSimulation: (simulation) => set({ currentSimulation: simulation }),

  setSolverType: (solver) => set({ solverType: solver }),

  setTankType: (tankType) => set({ tankType }),

  // Simulation data actions
  setWaterHeight: (height: number) => set({ waterHeight: height }),

  setWeirHeight: (height: number) => set({ weirHeight: height }),

  setGranuleOBCSideLength: (length: number) => set({ granuleOBCSideLength: length }),

  setInletMarkerSideLength: (length: number) => set({ inletMarkerSideLength: length }),

  setTankOpacity: (opacity: number) => set({ tankOpacity: opacity }),

  setInjectionTime: (time: number) => set({ injectionTime: time }),

  setInjectorFlowVelocity: (velocity: number) => set({ injectorFlowVelocity: velocity }),

  setDomainDimensions: (dimensions: DomainDimensions | null) =>
    set({ domainDimensions: dimensions }),

  setWaterColumnConfig: (config: WaterColumnConfig | null) =>
    set({ waterColumnConfig: config }),

  // UI state actions
  setSidebarVisible: (visible: boolean) => set({ sidebarVisible: visible }),

  // Transform controls actions
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | null) => {
    console.log('[useViewerStore] setTransformMode called:', mode);
    set({ transformMode: mode });
  },
  setTransformSpace: (space: 'world' | 'local') => set({ transformSpace: space }),
  setIsTransforming: (isTransforming: boolean) => set({ isTransforming }),

  // Reset action
  reset: () =>
    set({
      displaySettings: DEFAULT_DISPLAY,
      lighting: DEFAULT_LIGHTING,
      cameraConfig: DEFAULT_CAMERA,
      gridConfig: DEFAULT_GRID,
      shadowConfig: DEFAULT_SHADOW,
      materialConfig: DEFAULT_MATERIAL,
      models: [],
      selectedModelId: null,
      hoveredModelId: null,
      currentSimulation: null,
      solverType: null,
      tankType: null,
      waterHeight: 0,
      weirHeight: 0.9,
      granuleOBCSideLength: 1.0,
      inletMarkerSideLength: 0.1,
      tankOpacity: 0.5,
      domainDimensions: null,
      waterColumnConfig: null,
      sidebarVisible: false,
      transformMode: null,
      transformSpace: 'world',
      isTransforming: false,
    }),
}));
