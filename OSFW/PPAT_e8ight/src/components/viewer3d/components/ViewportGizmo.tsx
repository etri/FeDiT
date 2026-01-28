/**
 * @file ViewportGizmo.tsx
 * @description Viewport gizmo helper for camera orientation visualization
 * Displays axis indicators in the bottom-right corner with smooth camera animations
 */

import { useMemo } from 'react';
import { GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useViewerStore } from '../hooks/useViewerStore';

export default function ViewportGizmo() {
  const sidebarVisible = useViewerStore((state) => state.sidebarVisible);

  // Adjust margin based on sidebar visibility
  // Settings panel width is 350px, so we need to shift gizmo left by that amount
  const margin = useMemo<[number, number]>(() => {
    const rightMargin = sidebarVisible ? 350 + 80 : 80; // 350px panel + 80px margin, or just 80px
    return [rightMargin, 80];
  }, [sidebarVisible]);

  return (
    <GizmoHelper
      alignment="bottom-right"
      margin={margin}
      renderPriority={999}
    >
      <GizmoViewport
        axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']}
        labelColor="white"
      />
    </GizmoHelper>
  );
}
