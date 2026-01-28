/**
 * @file useFitToBox.ts
 * @description Hook for fitting the camera to view all objects in the scene
 * Also automatically adjusts camera near/far clipping planes based on scene size
 */

import { useThree } from '@react-three/fiber';
import { useCallback } from 'react';
import * as THREE from 'three';
import { useViewerStore } from './useViewerStore';

export function useFitToBox() {
  const { camera, scene, controls } = useThree();

  const fitToBox = useCallback((animated: boolean = true) => {
    // Collect all visible meshes
    const meshes: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const name = object.name?.toLowerCase() || '';

        // Check if this object or any parent is a shadow
        let isShadowRelated = false;
        let parent = object as THREE.Object3D;
        while (parent) {
          if (parent.userData?.isShadow || parent.name?.toLowerCase().includes('shadow')) {
            isShadowRelated = true;
            break;
          }
          parent = parent.parent as THREE.Object3D;
        }

        // Filter out helpers, grids, shadows, and invisible objects
        if (
          !name.includes('helper') &&
          !name.includes('grid') &&
          !name.includes('gizmo') &&
          !name.includes('shadow') &&
          !name.includes('accumulative') && // AccumulativeShadows plane
          !object.userData?.isHelper &&
          !object.userData?.isGrid &&
          !object.userData?.isShadow &&
          !isShadowRelated &&
          object.visible
        ) {
          meshes.push(object);
        }
      }
    });

    if (meshes.length === 0) {
      //console.log('No meshes to fit');
      return;
    }

    // Calculate bounding box for all meshes
    const box = new THREE.Box3();
    meshes.forEach((mesh) => {
      // Additional check: skip flat planes that might be shadows
      // Check if it's a plane geometry lying flat on the ground
      if (mesh.geometry) {
        const positionAttribute = mesh.geometry.attributes.position;
        if (positionAttribute) {
          // Check if all Y values are near zero (flat plane on ground)
          let isGroundPlane = true;
          const positions = positionAttribute.array;
          for (let i = 1; i < positions.length; i += 3) {
            if (Math.abs(positions[i]) > 0.01) { // Y values
              isGroundPlane = false;
              break;
            }
          }

          if (isGroundPlane) {
            console.log('[FitToBox] Skipping ground plane mesh:', mesh.name || 'unnamed');
            return; // Skip this mesh
          }
        }
      }

      const meshBox = new THREE.Box3().setFromObject(mesh);
      box.union(meshBox);
    });

    // Get box center and size
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Calculate camera distance to fit the object
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    let cameraDistance = maxDim / (2 * Math.tan(fov / 2));

    // Add some padding (1.5x distance)
    cameraDistance *= 1.5;

    // Calculate new camera position (maintain current viewing angle)
    const currentDirection = new THREE.Vector3();
    camera.getWorldDirection(currentDirection);
    currentDirection.multiplyScalar(-1); // Reverse direction
    currentDirection.normalize();

    const newPosition = center.clone().add(
      currentDirection.multiplyScalar(cameraDistance)
    );

    // Automatically adjust camera near/far clipping planes based on scene size
    const perspectiveCamera = camera as THREE.PerspectiveCamera;

    // Calculate optimal near/far based on distance and scene size
    // Near: 0.1% of camera distance (but not less than 0.001)
    const newNear = Math.max(0.001, cameraDistance * 0.001);

    // Far: extremely large value to prevent any clipping
    // Use 100x scene diagonal for massive zoom out capability
    const sceneDiagonal = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);
    const newFar = Math.max(
      sceneDiagonal * 100,  // 100x scene size for extreme zoom out
      cameraDistance + sceneDiagonal * 50,  // Or camera distance + 50x scene
      10000  // Minimum 10,000 units
    );

    // Apply near/far to camera
    perspectiveCamera.near = newNear;
    perspectiveCamera.far = newFar;
    perspectiveCamera.updateProjectionMatrix();

    // Update viewer store with new camera config
    const store = useViewerStore.getState();
    store.setCameraConfig({
      near: newNear,
      far: newFar,
    });

    //console.log('[useFitToBox] Camera near/far adjusted:', {
    //  near: newNear.toFixed(4),
    //  far: newFar.toFixed(2),
    //  cameraDistance: cameraDistance.toFixed(2),
    //  sceneDiagonal: sceneDiagonal.toFixed(2),
    //});

    if (animated && controls) {
      // Animate camera movement using controls
      const startPosition = camera.position.clone();
      const startTarget = (controls as any).target?.clone() || new THREE.Vector3();

      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpolate position
        camera.position.lerpVectors(startPosition, newPosition, easeProgress);

        // Interpolate target
        if ((controls as any).target) {
          (controls as any).target.lerpVectors(startTarget, center, easeProgress);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          console.log('Fit to box completed');
        }
      };

      animate();
    } else {
      // Instant movement
      camera.position.copy(newPosition);
      if ((controls as any).target) {
        (controls as any).target.copy(center);
      }
      camera.lookAt(center);
      console.log('Fit to box completed (instant)');
    }

    console.log(`Fitted ${meshes.length} meshes to view`, {
      center: center.toArray(),
      size: size.toArray(),
      cameraDistance,
      newPosition: newPosition.toArray(),
    });
  }, [camera, scene, controls]);

  return { fitToBox };
}
