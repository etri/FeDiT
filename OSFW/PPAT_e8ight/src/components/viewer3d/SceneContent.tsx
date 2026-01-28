/**
 * @file SceneContent.tsx
 * @description Main scene content component that combines all scene elements
 */

import { Environment } from '@react-three/drei';
import Lighting from './components/Lighting';
import Controls from './components/Controls';
import Grid from './components/Grid';
import Shadows from './components/Shadows';
import ViewportGizmo from './components/ViewportGizmo';
import Effects from './components/Effects';
import Models from './components/models/Models';
import Simulations from './components/simulations/Simulations';
import { AutoDomain } from './components/domain/AutoDomain';
import ExportHandler from './components/ExportHandler';
import FitToBoxHandler from './components/FitToBoxHandler';
import CameraNearFarHandler from './components/CameraNearFarHandler';
import CameraAutoDomainHandler from './components/CameraAutoDomainHandler';
import { ModelTransformControls } from './components/ModelTransformControls';
import { useAutoDomainGeneration } from './hooks/useAutoDomainGeneration';
import useProjectStore from '../../stores/projectStore';

export default function SceneContent() {
  // Get simulation type from project store
  const simulationType = useProjectStore(state => state.simulationType);

  // Check if this is automotive aerodynamics simulation
  const isAutomotiveAero = simulationType === 'automotive_aerodynamics';

  // Hook for auto domain generation (only for automotive)
  if (isAutomotiveAero) {
    useAutoDomainGeneration();
  }

  return (
    <>
      {/* Environment map for PBR materials (GLB/GLTF) */}
      <Environment preset="city" background={false} />

      {/* Lighting setup */}
      <Lighting />

      {/* Camera controls */}
      <Controls />

      {/* Grid helper */}
      <Grid />

      {/* Shadows */}
      <Shadows />

      {/* Viewport gizmo - bottom-right corner */}
      <ViewportGizmo />

      {/* Models */}
      <Models />

      {/* Transform controls for selected model */}
      <ModelTransformControls />

      {/* Simulations */}
      <Simulations />

      {/* Domain visualization - only for automotive aerodynamics */}
      {isAutomotiveAero && <AutoDomain />}

      {/* Export handler */}
      <ExportHandler />

      {/* Fit to box handler */}
      <FitToBoxHandler />

      {/* Camera near/far auto-adjustment handler */}
      {isAutomotiveAero ? (
        <CameraAutoDomainHandler />
      ) : (
        <CameraNearFarHandler />
      )}

      {/* Post-processing effects for anti-aliasing */}
      <Effects />
    </>
  );
}
