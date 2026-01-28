/**
 * @file Grid.tsx
 * @description Grid helper component for the 3D scene
 * Uses drei's shader-based infinite grid with configurable appearance
 */

import { Grid as DreiGrid } from '@react-three/drei';
import { useViewerStore } from '../hooks/useViewerStore';

export default function Grid() {
  const showGrid = useViewerStore((state) => state.displaySettings.showGrid);
  const gridConfig = useViewerStore((state) => state.gridConfig);

  if (!showGrid) return null;

  return (
    <DreiGrid
      // Cell configuration (minor grid lines)
      cellSize={gridConfig.cellSize}
      cellThickness={gridConfig.cellThickness}
      cellColor={gridConfig.cellColor}

      // Section configuration (major grid lines)
      sectionSize={gridConfig.sectionSize}
      sectionThickness={gridConfig.sectionThickness}
      sectionColor={gridConfig.sectionColor}

      // Fade configuration
      fadeDistance={gridConfig.fadeDistance}
      fadeStrength={gridConfig.fadeStrength}
      fadeFrom={gridConfig.fadeFrom}

      // Display mode
      followCamera={gridConfig.followCamera}
      infiniteGrid={gridConfig.infiniteGrid}
    />
  );
}
