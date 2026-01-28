/**
 * @file Effects.tsx
 * @description Post-processing effects for anti-aliasing
 * Uses drei's Effects component with multisampling
 */

import { Effects as DreiEffects } from '@react-three/drei';
import { useViewerStore } from '../hooks/useViewerStore';

export default function Effects() {
  const enableAntialiasing = useViewerStore((state) => state.displaySettings.enableAntialiasing);

  if (!enableAntialiasing) return null;

  return (
    <DreiEffects
      multisamping={8} // 8x MSAA for smooth anti-aliasing
      disableGamma={false}
      disableRenderPass={false}
    />
  );
}
