/**
 * @file Controls.tsx
 * @description Camera controls using OrbitControls from drei
 */

import { OrbitControls } from '@react-three/drei';
import { useViewerStore } from '../hooks/useViewerStore';
import { MOUSE } from 'three';
import { useRef } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export default function Controls() {
  const transformMode = useViewerStore((state) => state.transformMode);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  return (
    <OrbitControls
      ref={controlsRef}
      // Always make default for GizmoHelper animations
      // TransformControls will take priority when active via enabled flags
      makeDefault

      // Damping disabled - stop immediately when mouse released
      enableDamping={false}

      // Pan settings
      enablePan={!transformMode}
      panSpeed={2.0}
      screenSpacePanning

      // Mouse buttons
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.PAN,
        RIGHT: MOUSE.ROTATE,
      }}

      // Don't use target prop - let OrbitControls manage it internally
      // This prevents unwanted camera movements when target changes

      // Enable rotation, zoom, pan - DISABLE ALL during transform mode
      enableRotate={!transformMode}
      enableZoom={!transformMode}
      enabled={!transformMode}

      // Limits (optional, can be configured later)
      // minDistance={0.01}
      // maxDistance={100}
    />
  );
}
