/**
 * @file ViewerCanvas.tsx
 * @description Main Canvas component for the drei-based 3D viewer
 */

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { useDetectGPU } from '@react-three/drei';
import * as THREE from 'three';
import SceneContent from './SceneContent';
import { TransformPanel } from './components/controls/TransformPanel';
import { FitToBoxButton } from './components/controls/FitToBoxButton';
import { RenderModeButton } from './components/controls/RenderModeButton';
import { useViewerStore } from './hooks/useViewerStore';
import type { ViewerCanvasProps } from './types/viewer.types';
import './styles/viewer.css';

export default function ViewerCanvas({ className, style }: ViewerCanvasProps) {
  const backgroundColor = useViewerStore((state) => state.displaySettings.backgroundColor);
  const antialias = useViewerStore((state) => state.displaySettings.enableAntialiasing);
  const cameraConfig = useViewerStore((state) => state.cameraConfig);
  const GPUTier = useDetectGPU();

  // Auto-adjust settings based on GPU tier
  useEffect(() => {
    if (!GPUTier) return;

    console.log('[ViewerCanvas] GPU Detection:', {
      tier: GPUTier.tier,
      isMobile: GPUTier.isMobile,
      type: GPUTier.type,
      fps: GPUTier.fps,
    });

    const store = useViewerStore.getState();

    // Optimize settings for lower-tier GPUs
    if (GPUTier.tier === 0 || GPUTier.tier === 1 || GPUTier.isMobile) {
      console.log('[ViewerCanvas] Low-tier GPU detected, optimizing settings...');

      // Disable shadows on low-tier GPUs
      store.setShadowConfig({ enabled: false });

      // Reduce material quality
      store.setMaterialConfig({
        samples: 4, // Reduce from 16 to 4
      });

      // Disable antialiasing
      store.setEnableAntialiasing(false);
    } else if (GPUTier.tier === 2) {
      console.log('[ViewerCanvas] Mid-tier GPU detected, using balanced settings...');

      // Keep shadows but reduce quality
      store.setShadowConfig({
        frames: 50, // Reduce from 100 to 50
      });

      // Medium material quality
      store.setMaterialConfig({
        samples: 8, // Reduce from 16 to 8
      });
    } else {
      console.log('[ViewerCanvas] High-tier GPU detected, using maximum quality...');
      // Keep all high-quality settings as default
    }
  }, [GPUTier]);

  // Calculate DPR based on GPU tier
  const dpr = GPUTier
    ? (GPUTier.tier === 0 || GPUTier.isMobile ? 1 : Math.min(window.devicePixelRatio, 2))
    : window.devicePixelRatio;

  return (
    <div
      className={`viewer-canvas-wrapper ${className || ''}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        zIndex: 1,
        ...style
      }}
    >
      <Canvas
        camera={{
          position: cameraConfig.position,
          fov: cameraConfig.fov,
          near: cameraConfig.near,
          far: cameraConfig.far,
          up: [0, 1, 0], // Y-up convention
        }}
        gl={{
          antialias,
          alpha: true,
          preserveDrawingBuffer: true, // For screenshots/exports
          powerPreference: 'high-performance', // Use dedicated GPU
          logarithmicDepthBuffer: true, // Reduce z-fighting significantly
          outputColorSpace: THREE.SRGBColorSpace, // Proper color space for GLB/GLTF
          toneMapping: THREE.ACESFilmicToneMapping, // Better tone mapping for PBR materials
          toneMappingExposure: 1.0, // Brightness adjustment
        }}
        shadows // Enable shadows for AccumulativeShadows
        dpr={dpr} // Adaptive DPR based on GPU tier
        onCreated={({ gl }) => {
          // Ensure proper color space and tone mapping
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <color attach="background" args={[backgroundColor]} />
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {/* Transform Panel UI - outside Canvas */}
      <TransformPanel />

      {/* Fit to Box button - outside Canvas for fixed screen position */}
      <FitToBoxButton position={{ top: '20px', left: '50%' }} />

      {/* Render Mode dropdown - outside Canvas for fixed screen position (next to fit-to-box) */}
      <RenderModeButton />
    </div>
  );
}
