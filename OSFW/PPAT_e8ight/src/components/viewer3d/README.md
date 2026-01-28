# Drei-Based 3D Viewer

This directory contains the new React Three Fiber + Drei based 3D viewer implementation.

## Phase 1: Complete ✅

### Features Implemented

- **Basic Canvas Setup**: ViewerCanvas component with configurable camera and renderer
- **Lighting System**: Ambient, Directional, and Hemisphere lights
- **Camera Controls**: OrbitControls from @react-three/drei
- **Display Helpers**: Grid and AxesHelper components
- **State Management**: Zustand store for viewer state
- **Feature Flag**: Environment variable to toggle between old and new viewer

## Phase 2: Complete ✅

### Features Implemented

- **Model Loading System**: useModelLoader hook with support for STL, GLTF, OBJ, PLY
- **STL Model Component**: Renders STL files with configurable materials
- **Models Manager**: Manages all models in the scene
- **SettingsPanel Integration**: Connected SettingsPanel to ViewerStore
- **Dynamic Material System**: Special handling for water meshes (Broad_weir_fluid)

## Phase 3: Complete ✅

### Features Implemented

- **Simulation Components**: Dedicated components for each simulation type
  - `SedimentationColumn`: LBM/SPH tank visualization
  - `WeirOverflowTank`: SPH weir overflow tank with 3 STL files
  - `OpenFOAMDomain`: Wireframe domain box for OpenFOAM simulations
  - `DamBreak`: Domain + water column visualization
- **Simulations Manager**: Conditional rendering based on simulation type
- **WorkbenchPage Integration**: Simulation state synchronized with ViewerStore
- **Event Handlers**: Water height, tank opacity, and dam break water changes

## Phase 4: Complete ✅

### Features Implemented

- **Model Selection**: Click to select/deselect models
  - Yellow highlight for selected models
  - Toggle selection on/off via settings panel
- **Hover Highlighting**: Pointer hover effects
  - Orange highlight for hovered models
  - Toggle hover on/off via settings panel
- **STL Export**: Export models to STL files
  - Individual file export for each model
  - Combined export option available
  - Integration with WorkbenchPage export button
- **Fit to Box**: Automatic camera fitting
  - Auto-fit when models are loaded
  - Auto-fit when simulations change
  - Manual fit-to-box button
  - Smooth animated camera movement
- **Performance Optimizations**: React.memo implementation
  - Memoized STLModel component with custom comparison
  - Memoized simulation components
  - Reduced unnecessary re-renders

### Directory Structure

```
src/components/viewer3d/
├── ViewerCanvas.tsx           # Main Canvas wrapper
├── SceneContent.tsx           # Scene composition
├── README.md                  # This file
├── hooks/
│   ├── useViewerStore.ts      # Zustand state management
│   ├── useModelLoader.ts      # ✅ Model loading hooks (Phase 2)
│   ├── useExportSTL.ts        # ✅ STL export hook (Phase 4)
│   └── useFitToBox.ts         # ✅ Fit-to-box hook (Phase 4)
├── components/
│   ├── Lighting.tsx           # Lighting setup
│   ├── Controls.tsx           # OrbitControls
│   ├── Grid.tsx               # Grid helper
│   ├── AxesHelper.tsx         # Axes helper
│   ├── ExportHandler.tsx      # ✅ STL export handler (Phase 4)
│   ├── FitToBoxHandler.tsx    # ✅ Fit-to-box handler (Phase 4)
│   ├── models/
│   │   ├── Models.tsx         # ✅ Models manager (Phase 2)
│   │   └── STLModel.tsx       # ✅ STL renderer with selection/hover (Phase 2/4)
│   └── simulations/
│       ├── Simulations.tsx      # ✅ Simulations manager (Phase 3)
│       ├── SedimentationColumn.tsx  # ✅ Sedimentation Column (Phase 3)
│       ├── WeirOverflowTank.tsx     # ✅ Weir Overflow Tank (Phase 3)
│       ├── OpenFOAMDomain.tsx       # ✅ OpenFOAM Domain (Phase 3)
│       └── DamBreak.tsx             # ✅ Dam Break with selection/hover (Phase 3/4)
└── types/
    └── viewer.types.ts        # TypeScript type definitions
```

### Usage

#### Drei Viewer is Now Default

The drei-based viewer is now the default and only 3D viewer in the application. No environment variables needed!

#### Accessing Viewer State

```typescript
import { useViewerStore } from './hooks/useViewerStore';

function MyComponent() {
  const backgroundColor = useViewerStore((state) => state.displaySettings.backgroundColor);
  const setBackgroundColor = useViewerStore((state) => state.setBackgroundColor);

  return (
    <button onClick={() => setBackgroundColor('#ff0000')}>
      Change Background
    </button>
  );
}
```

### Store API

#### Display Settings

- `setBackgroundColor(color: string)`
- `setShowGrid(show: boolean)`
- `setShowAxes(show: boolean)`
- `setEnableHover(enabled: boolean)`
- `setEnableSelection(enabled: boolean)`
- `setEnableAntialiasing(enabled: boolean)`

#### Lighting Settings

- `setAmbientIntensity(intensity: number)`
- `setDirectionalIntensity(intensity: number)`
- `setDirectionalColor(color: string)`
- `setDirectionalPosition(position: [number, number, number])`
- `setHemisphereIntensity(intensity: number)`
- `setHemisphereColors(skyColor: string, groundColor: string)`

#### Camera Settings

- `setCameraConfig(config: Partial<CameraConfig>)`

#### Model Management

- `addModel(model: ModelData)`
- `removeModel(id: string)`
- `updateModel(id: string, updates: Partial<ModelData>)`
- `clearModels()`

#### Simulation Settings

- `setSimulation(simulation: SimulationType | null)`
- `setSolverType(solver: SolverType | null)`
- `setTankType(tankType: TankType | null)`
- `setWaterHeight(height: number)`
- `setTankOpacity(opacity: number)`
- `setDomainDimensions(dimensions: DomainDimensions | null)`
- `setWaterColumnConfig(config: WaterColumnConfig | null)`

#### Loading Models (Phase 2)

```typescript
import { useViewerStore } from './hooks/useViewerStore';

function MyComponent() {
  const addModel = useViewerStore((state) => state.addModel);

  const loadSTLModel = () => {
    addModel({
      id: 'model-1',
      url: '/models/Broad_weir_fluid.stl',
      name: 'Broad_weir_fluid',
      type: 'stl',
      visible: true,
      color: '#1e88e5',
      transparent: true,
      opacity: 0.6,
    });
  };

  return <button onClick={loadSTLModel}>Load Model</button>;
}
```

### Next Steps (Future Enhancements)

#### Potential Future Improvements
- Advanced selection features (multi-select, box select)
- Transform controls for models (move, rotate, scale)
- Animation system for time-dependent simulations
- Custom shaders for advanced water effects
- Integration with simulation results visualization
- Model import via drag & drop or file picker
- Camera presets (top view, side view, front view)
- Screenshot capture functionality

### Migration Strategy

Migration completed! ✅

1. ~~Old viewer remains functional (default)~~ → Removed
2. ~~New viewer is developed alongside~~ → Completed
3. ~~Feature flag allows switching between viewers~~ → Removed (drei viewer is now default)
4. ~~Once new viewer has feature parity, old viewer can be deprecated~~ → Legacy viewer deprecated

### Dependencies

```json
{
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.95.0",
  "zustand": "^5.0.8" (already installed)
}
```

### Testing

```bash
# Build
npm run build

# Development
npm run dev

# The drei-based viewer is always active
```

## Technical Notes

### Coordinate System

- Uses Y-up coordinate system (Three.js default)
- Compatible with existing OpenFOAM Y-up convention
- Camera up vector: [0, 1, 0]

### Performance

- Uses Suspense for code splitting
- Device pixel ratio: [1, 2] for retina displays
- Shadows disabled by default for performance
- Grid uses infinite grid pattern from drei

### Known Limitations (Phase 4)

- ✅ ~~No model loading~~ → STL loading implemented
- ✅ ~~No integration with SettingsPanel~~ → Integrated
- ✅ ~~No simulation-specific rendering~~ → Simulation components implemented
- ✅ ~~No picking/selection~~ → Selection system implemented
- ✅ ~~No hover highlighting~~ → Hover effects implemented
- ✅ ~~No STL export~~ → STL export implemented
- ✅ ~~No fit-to-box camera control~~ → Fit-to-box implemented
- ✅ ~~Water height geometry manipulation~~ → Dynamic water height adjustment implemented
- ⚠️ No multi-select or box select (Future)
- ⚠️ No model import via drag & drop (Future)

### Phase 2 New Features

#### Model Loading Hook
```typescript
import { useSTLLoader, useGLTFLoader } from './hooks/useModelLoader';

// Load STL
const geometry = useSTLLoader('/models/model.stl');

// Load GLTF
const gltf = useGLTFLoader('/models/model.gltf');
```

#### STLModel Component
- Automatic material selection (Phong for water, Lambert for others)
- Special water material for Broad_weir_fluid
- DoubleSide rendering
- Configurable position, rotation, scale

#### SettingsPanel Integration
- Grid on/off → ViewerStore
- Axes on/off → ViewerStore
- Background color → ViewerStore
- Lighting settings → ViewerStore
- All settings sync automatically

### Phase 3 New Features

#### Simulation Components
Each simulation is implemented as a dedicated React component that:
- Manages its own model loading and cleanup
- Reads configuration from ViewerStore
- Automatically updates when store state changes

#### Simulations Manager
```typescript
import { useViewerStore } from './hooks/useViewerStore';

// The Simulations component automatically renders the correct simulation
// based on currentSimulation and tankType in the store

// Example: Setting up a dam break simulation
const store = useViewerStore.getState();
store.setSimulation('dam_break');
store.setDomainDimensions({ width: 0.584, height: 0.4, depth: 0.01 });
store.setWaterColumnConfig({ width: 0.146, height: 0.6, depth: 0.01 });
```

#### WorkbenchPage Integration
- Simulation state automatically syncs with project data
- Water height changes propagate from forms to viewer
- Tank opacity adjustments update in real-time
- Dam break water column dimensions are reactive

#### Supported Simulations
- **Sedimentation Column** (LBM/SPH): Tank + water STL models
- **Weir Overflow Tank** (SPH): Broad_weir_fluid, Broed_weir_wall, Inlet STLs
- **Dam Break** (OpenFOAM): Domain box + water column geometry
- **OpenFOAM Generic**: Wireframe domain box for all OpenFOAM simulations

### Phase 4 New Features

#### Model Selection and Hover
```typescript
// Selection is controlled by enableSelection setting in ViewerStore
const store = useViewerStore.getState();
store.setEnableSelection(true); // Enable selection
store.setEnableHover(true); // Enable hover

// Selected models are highlighted in yellow
// Hovered models are highlighted in orange

// Access selected model
const selectedModelId = useViewerStore((state) => state.selectedModelId);
```

#### STL Export
```typescript
// Export all visible models to separate STL files
(window as any).dreiViewerExportSTL();

// Export all models as a single combined STL
(window as any).dreiViewerExportCombinedSTL('combined.stl');

// WorkbenchPage integration
// Click the STL Export button in the UI to export models
```

#### Fit to Box
```typescript
// Automatic fit-to-box on model load
// FitToBoxHandler automatically fits the camera when:
// - Models are loaded
// - Simulations change
// - Domain dimensions change

// Manual fit-to-box
(window as any).dreiViewerFitToBox();

// WorkbenchPage integration
// Click the fit-to-box button in the UI
```

#### Water Height Adjustment
```typescript
// Water height is automatically adjusted in real-time
// The useWaterHeight hook manipulates geometry to keep the bottom fixed
// and only adjust the top vertices

// SedimentationColumn (LBM/SPH)
// - Adjusts lbm_water or sph_water mesh
// - Bottom stays fixed at tank bottom
// - Top vertices scale proportionally with height

// WeirOverflowTank (SPH)
// - Adjusts Broad_weir_fluid mesh
// - Maintains proper water level visualization

// Water height changes are triggered by:
// 1. Form input (waterHeight field in sedimentation forms)
// 2. CustomEvent 'tankWaterHeightChanged'
// 3. ViewerStore.setWaterHeight()
```

#### Performance Optimizations
- **React.memo**: All model and simulation components are memoized
- **Custom comparison functions**: STLModel only re-renders when URL, visibility, or ID changes
- **Simulation components**: Memoized to prevent re-renders when parent updates
- **Reduced re-renders**: Selection and hover state changes only affect relevant components
- **Geometry caching**: Original water geometry positions cached for fast height updates
