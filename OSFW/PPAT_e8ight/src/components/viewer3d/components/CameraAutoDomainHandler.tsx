/**
 * @file CameraAutoDomainHandler.tsx
 * @description Automatically adjusts camera near/far based on auto domain bounds
 */

import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAutoDomainStore } from '../stores/autoDomainStore';
import { useViewerStore } from '../hooks/useViewerStore';

export default function CameraAutoDomainHandler() {
  const { camera } = useThree();
  const domainBounds = useAutoDomainStore((state) => state.settings.domainBounds);
  const domainBoundsRef = useRef(domainBounds);
  const isVisible = useAutoDomainStore((state) => state.isVisible);
  const transformMode = useViewerStore((state) => state.transformMode);
  const transformModeRef = useRef(transformMode);
  const vehicleDimensions = useAutoDomainStore((state) => state.vehicleDimensions);

  // Track if transform was recently changed
  const transformRecentlyChangedRef = useRef(false);

  // Update refs
  useEffect(() => {
    domainBoundsRef.current = domainBounds;
  }, [domainBounds]);

  useEffect(() => {
    const wasTransformMode = transformModeRef.current;
    transformModeRef.current = transformMode;

    // If transform mode changed in any way, set cooldown flag
    if (wasTransformMode !== transformMode) {
      transformRecentlyChangedRef.current = true;
      console.log('[CameraAutoDomainHandler] Transform mode changed - setting cooldown for 1.5s');

      const timer = setTimeout(() => {
        transformRecentlyChangedRef.current = false;
        console.log('[CameraAutoDomainHandler] Cooldown ended');
      }, 1500); // 1.5 seconds cooldown

      return () => clearTimeout(timer);
    }
  }, [transformMode]);

  // Only adjust camera when vehicle dimensions change, not on every domain update
  useEffect(() => {
    console.log('[CameraAutoDomainHandler] useEffect triggered:', {
      hasVehicleDimensions: !!vehicleDimensions,
      isVisible
    });

    if (!vehicleDimensions || !isVisible) return;

    // Small delay to ensure domain is rendered
    const timer = setTimeout(() => {
      // Check transform mode at execution time
      if (transformModeRef.current || transformRecentlyChangedRef.current) {
        console.log('[CameraAutoDomainHandler] Skipped - transform mode is active or recently changed');
        return;
      }

      if (!domainBoundsRef.current) {
        console.log('[CameraAutoDomainHandler] Skipped - no domain bounds at execution time');
        return;
      }

      console.log('[CameraAutoDomainHandler] About to adjust camera');
      adjustCameraForDomain();
    }, 100);

    return () => clearTimeout(timer);
  }, [vehicleDimensions, isVisible]); // Only trigger on vehicle dimensions or visibility change

  const adjustCameraForDomain = () => {
    const bounds = domainBoundsRef.current;
    if (!bounds) return;

    // Get domain center and size
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    bounds.getCenter(center);
    bounds.getSize(size);

    // Calculate domain diagonal
    const domainDiagonal = Math.sqrt(
      size.x * size.x +
      size.y * size.y +
      size.z * size.z
    );

    // Calculate camera distance from domain center
    const cameraDistance = camera.position.distanceTo(center);

    // Calculate optimal near/far for large domain
    // Near: small value relative to domain size (0.01% of diagonal)
    const newNear = Math.max(0.001, domainDiagonal * 0.0001);

    // Far: extremely large value for automotive domains - no clipping at any distance
    // Use 200x domain diagonal for unlimited zoom out capability
    const newFar = Math.max(
      domainDiagonal * 200,  // 200x domain size for extreme zoom out
      cameraDistance + domainDiagonal * 150,  // Or camera distance + 150x domain
      100000  // Minimum 100,000 units for large CFD domains
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

    console.log('[CameraAutoDomainHandler] Camera adjusted for auto domain:', {
      near: newNear.toFixed(6),
      far: newFar.toFixed(2),
      domainDiagonal: domainDiagonal.toFixed(2),
      domainSize: {
        x: size.x.toFixed(2),
        y: size.y.toFixed(2),
        z: size.z.toFixed(2),
      },
      cameraDistance: cameraDistance.toFixed(2),
    });
  };

  return null;
}