/**
 * @file CameraNearFarHandler.tsx
 * @description Automatically adjusts camera near/far clipping planes based on scene size
 * Monitors changes to models, scenarios, and domain dimensions
 */

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { useViewerStore } from '../hooks/useViewerStore';

export default function CameraNearFarHandler() {
  const { camera, scene } = useThree();
  const models = useViewerStore((state) => state.models);
  const domainDimensions = useViewerStore((state) => state.domainDimensions);

  useEffect(() => {
    // Small delay to ensure all meshes are loaded
    const timer = setTimeout(() => {
      adjustNearFar();
    }, 100);

    return () => clearTimeout(timer);
  }, [models.length, domainDimensions]);

  const adjustNearFar = () => {
    // Collect all visible meshes
    const meshes: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const name = object.name?.toLowerCase() || '';
        // Filter out helpers, grids, shadows, and invisible objects
        if (
          !name.includes('helper') &&
          !name.includes('grid') &&
          !name.includes('gizmo') &&
          !name.includes('shadow') &&
          !object.userData?.isHelper &&
          !object.userData?.isGrid &&
          !object.userData?.isShadow &&
          object.visible
        ) {
          meshes.push(object);
        }
      }
    });

    if (meshes.length === 0) {
      console.log('[CameraNearFarHandler] No meshes to calculate bounds');
      return;
    }

    // Calculate bounding box for all meshes
    const box = new THREE.Box3();
    meshes.forEach((mesh) => {
      const meshBox = new THREE.Box3().setFromObject(mesh);
      box.union(meshBox);
    });

    // Get box center and size
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Calculate scene diagonal
    const sceneDiagonal = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);

    // Calculate camera distance from center
    const cameraDistance = camera.position.distanceTo(center);

    // Calculate optimal near/far
    // Near: very small value relative to scene size (0.01% of scene diagonal, minimum 0.001)
    const newNear = Math.max(0.001, sceneDiagonal * 0.0001);

    // Far: extremely large value to prevent any clipping even from very far away
    // Use 150x scene diagonal for massive zoom out capability
    const newFar = Math.max(
      sceneDiagonal * 150,  // 150x scene size for extreme distance viewing
      cameraDistance + sceneDiagonal * 100,  // Or camera distance + 100x scene
      50000  // Minimum 50,000 units
    );

    // Apply to camera
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    perspectiveCamera.near = newNear;
    perspectiveCamera.far = newFar;
    perspectiveCamera.updateProjectionMatrix();

    // Update viewer store
    const store = useViewerStore.getState();
    store.setCameraConfig({
      near: newNear,
      far: newFar,
    });

    console.log('[CameraNearFarHandler] Camera near/far auto-adjusted:', {
      near: newNear.toFixed(6),
      far: newFar.toFixed(2),
      sceneDiagonal: sceneDiagonal.toFixed(2),
      cameraDistance: cameraDistance.toFixed(2),
      meshCount: meshes.length,
    });
  };

  return null;
}
