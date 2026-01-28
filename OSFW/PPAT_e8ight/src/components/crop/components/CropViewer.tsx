/**
 * @file CropViewer.tsx
 * @description Independent 3D viewer for crop preview
 */

import { Suspense, useEffect } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { useCropStore } from '../hooks/useCropStore';
import CropBoundingBox from './CropBoundingBox';
import type { ModelData } from '../../viewer3d/types/viewer.types';

interface CropViewerProps {
  modelData: ModelData;
}

function CropScene({ modelData }: CropViewerProps) {
  const geometry = useLoader(STLLoader, modelData.url);
  const { initializeFromBoundingBox } = useCropStore();
  const { camera } = useThree();

  // Initialize crop bounds from model bounding box and adjust camera
  useEffect(() => {
    if (geometry) {
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      if (bbox) {
        initializeFromBoundingBox(bbox);
        
        // Adjust camera to fit the model
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 2;
        
        // Position camera to view the model
        camera.position.set(
          center.x + distance * 0.7,
          center.y + distance * 0.7,
          center.z + distance * 0.7
        );
        camera.lookAt(center);
        camera.updateProjectionMatrix();
      }
    }
  }, [geometry, initializeFromBoundingBox, camera]);

  if (!geometry) {
    return null;
  }

  return (
    <>
      <Environment preset="city" background={false} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 7.5]} intensity={0.8} />
      <hemisphereLight intensity={1.0} />

      {/* Original model */}
      <mesh geometry={geometry}>
        <meshLambertMaterial
          color={modelData.color || '#888888'}
          transparent={modelData.transparent || false}
          opacity={modelData.opacity || 1.0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Crop bounding box with TransformControls */}
      <CropBoundingBox />

      {/* Camera controls - disabled when TransformControls is active */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.1}
        maxDistance={1000}
        makeDefault
      />
    </>
  );
}

export default function CropViewer({ modelData }: CropViewerProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#a8a8a8' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <CropScene modelData={modelData} />
        </Suspense>
      </Canvas>
    </div>
  );
}
