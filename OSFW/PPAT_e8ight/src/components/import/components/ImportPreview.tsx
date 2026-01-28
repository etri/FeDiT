/**
 * @file ImportPreview.tsx
 * @description 3D preview viewer for STL import with crop box
 */

import { Suspense, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { useImportStore } from '../hooks/useImportStore';
import { cropBufferGeometry } from '../../crop/utils/cropGeometry';
import ImportCropBox from './ImportCropBox';

interface ImportPreviewProps {
  fileUrl: string;
}

function PreviewScene({ fileUrl }: ImportPreviewProps) {
  const geometry = useLoader(STLLoader, fileUrl);
  const { initializeFromGeometry, cropEnabled, showCropPreview, cropMin, cropMax, capCrossSection } = useImportStore();
  const { camera, gl, size } = useThree();
  const hasInitialized = useRef(false);

  // Create cropped geometry for preview
  const croppedGeometry = useMemo(() => {
    if (!showCropPreview || !geometry) return null;
    try {
      const cropped = cropBufferGeometry(geometry, cropMin, cropMax, capCrossSection);
      return cropped;
    } catch (error) {
      console.error('[ImportPreview] Failed to crop geometry:', error);
      return null;
    }
  }, [showCropPreview, geometry, cropMin, cropMax, capCrossSection]);

  // Force canvas resize and camera update when size changes
  useEffect(() => {
    // Force canvas to update its size
    gl.setSize(size.width, size.height, false);
    
    // Update camera aspect ratio and projection matrix
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
    }
  }, [gl, size.width, size.height, camera]);

  // Initialize store from geometry (only once)
  useEffect(() => {
    if (geometry && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Force canvas resize again before initializing geometry
      gl.setSize(size.width, size.height, false);
      if ('aspect' in camera) {
        (camera as THREE.PerspectiveCamera).aspect = size.width / size.height;
      }
      camera.updateProjectionMatrix();
      
      // Adjust camera to fit the model
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      if (bbox) {
        const bboxSize = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());
        const maxDim = Math.max(bboxSize.x, bboxSize.y, bboxSize.z);
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
      
      initializeFromGeometry(geometry);
      
      // Force another resize in next frame to ensure everything is updated
      requestAnimationFrame(() => {
        gl.setSize(size.width, size.height, false);
        if ('aspect' in camera) {
          (camera as THREE.PerspectiveCamera).aspect = size.width / size.height;
        }
        camera.updateProjectionMatrix();
      });
    }
  }, [geometry, initializeFromGeometry, camera, gl, size]);

  // Reset initialization flag when fileUrl changes
  useEffect(() => {
    hasInitialized.current = false;
  }, [fileUrl]);

  if (!geometry) {
    return null;
  }

  return (
    <>
      {/* Environment for better lighting */}
      <Environment preset="city" background={false} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 7.5]} intensity={0.8} castShadow />
      <hemisphereLight intensity={1.0} />

      {/* Grid helper */}
      <gridHelper 
        args={[1000, 100, '#666666', '#444444']} 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]}
      />

      {/* Axes helper */}
      <axesHelper args={[100]} />

      {/* Show either cropped preview or original model */}
      {showCropPreview && croppedGeometry ? (
        /* Cropped model preview */
        <mesh 
          geometry={croppedGeometry} 
          castShadow 
          receiveShadow
        >
          <meshLambertMaterial
            color="#4CAF50"
            transparent={false}
            opacity={1.0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : (
        /* Original model - semi-transparent when crop is enabled */
        <mesh 
          geometry={geometry} 
          castShadow 
          receiveShadow
        >
          <meshLambertMaterial
            color="#888888"
            transparent={cropEnabled}
            opacity={cropEnabled ? 0.5 : 1.0}
            side={THREE.DoubleSide}
            depthWrite={!cropEnabled}
          />
        </mesh>
      )}

      {/* Crop bounding box with gizmo - hide during crop preview */}
      {!showCropPreview && <ImportCropBox visible={cropEnabled} />}

      {/* Orbit controls - will be disabled by TransformControls when dragging */}
      <OrbitControls
        ref={(controls) => {
          if (controls) {
            // Store reference for TransformControls to access
            (controls as any).isOrbitControls = true;
          }
        }}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.1}
        maxDistance={10000}
        makeDefault
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#666666" wireframe />
    </mesh>
  );
}

export default function ImportPreview({ fileUrl }: ImportPreviewProps) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#a8a8a8' }}>
      <Canvas
        camera={{ 
          position: [0, 0, 5], 
          fov: 45,
          near: 0.001,
          far: 100000
        }}
        gl={{ 
          antialias: true,
          preserveDrawingBuffer: true
        }}
        shadows
        onCreated={({ gl, camera, size }) => {
          // Force initial canvas size update
          gl.setSize(size.width, size.height, false);
          if (camera instanceof THREE.PerspectiveCamera) {
            camera.aspect = size.width / size.height;
            camera.updateProjectionMatrix();
          }
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <PreviewScene fileUrl={fileUrl} />
        </Suspense>
      </Canvas>
    </div>
  );
}
