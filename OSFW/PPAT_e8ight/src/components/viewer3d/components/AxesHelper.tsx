/**
 * @file AxesHelper.tsx
 * @description Axes helper component for the 3D scene
 */

import { useRef, useEffect } from 'react';
import { AxesHelper as ThreeAxesHelper, Group } from 'three';
import { useViewerStore } from '../hooks/useViewerStore';

export default function AxesHelper() {
  const showAxes = useViewerStore((state) => state.displaySettings.showAxes);
  const ref = useRef<Group>(null);

  useEffect(() => {
    if (!ref.current || !showAxes) return;

    const axesHelper = new ThreeAxesHelper(0.02); // 0.02 = size (20mm)
    ref.current.add(axesHelper);

    return () => {
      ref.current?.remove(axesHelper);
      axesHelper.dispose();
    };
  }, [showAxes]);

  if (!showAxes) return null;

  return <group ref={ref} />;
}
