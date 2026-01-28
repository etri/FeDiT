/**
 * @file Lighting.tsx
 * @description Lighting setup for the 3D scene
 */

import { useViewerStore } from '../hooks/useViewerStore';

export default function Lighting() {
  const lighting = useViewerStore((state) => state.lighting);

  return (
    <>
      {/* Ambient light - provides base illumination */}
      <ambientLight intensity={lighting.ambientIntensity} />

      {/* Directional light - simulates sun/directional light source */}
      <directionalLight
        position={lighting.directionalPosition}
        intensity={lighting.directionalIntensity}
        color={lighting.directionalColor}
        castShadow={true}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
        shadow-camera-near={0.001}
        shadow-camera-far={10}
        shadow-bias={-0.0001}
      />

      {/* Hemisphere light - provides sky/ground color gradient */}
      <hemisphereLight
        args={[lighting.hemisphereSkyColor, lighting.hemisphereGroundColor, lighting.hemisphereIntensity]}
      />
    </>
  );
}
