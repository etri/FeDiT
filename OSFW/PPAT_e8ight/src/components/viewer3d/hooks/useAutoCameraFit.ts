import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAutoDomainStore } from '../stores/autoDomainStore';
import { useViewerStore } from './useViewerStore';

/**
 * Hook that automatically fits camera to domain bounds when they change
 */
export function useAutoCameraFit() {
  const { camera, controls } = useThree();
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
      console.log('[useAutoCameraFit] Transform mode changed - setting cooldown for 1.5s');

      const timer = setTimeout(() => {
        transformRecentlyChangedRef.current = false;
        console.log('[useAutoCameraFit] Cooldown ended');
      }, 1500); // 1.5 seconds cooldown

      return () => clearTimeout(timer);
    }
  }, [transformMode]);

  // Only fit camera when vehicle dimensions change (initial load), not on every domain update
  useEffect(() => {
    console.log('[useAutoCameraFit] useEffect triggered:', {
      hasVehicleDimensions: !!vehicleDimensions,
      isVisible,
      transformMode: transformModeRef.current
    });

    if (!vehicleDimensions || !isVisible || !controls) return;

    // Small delay to ensure domain is rendered
    const timer = setTimeout(() => {
      // Check transform mode at execution time
      if (transformModeRef.current || transformRecentlyChangedRef.current) {
        console.log('[useAutoCameraFit] Skipped - transform mode is active or recently changed');
        return;
      }

      if (!domainBoundsRef.current) {
        console.log('[useAutoCameraFit] Skipped - no domain bounds at execution time');
        return;
      }

      console.log('[useAutoCameraFit] About to fit camera to domain');
      fitCameraToDomain();
    }, 200);

    return () => clearTimeout(timer);
  }, [vehicleDimensions, isVisible]); // Only trigger on vehicle dimensions or visibility change

  const fitCameraToDomain = () => {
    const bounds = domainBoundsRef.current;
    if (!bounds || !controls) return;

    console.log('[useAutoCameraFit] fitCameraToDomain called');

    // Get domain center and size
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    bounds.getCenter(center);
    bounds.getSize(size);

    // Calculate the maximum dimension
    const maxDim = Math.max(size.x, size.y, size.z);

    // Set camera position (view from front-top angle)
    const offset = new THREE.Vector3(
      -maxDim * 0.8,  // X offset (front)
      maxDim * 0.6,   // Y offset (above)
      maxDim * 0.8    // Z offset (side)
    );

    camera.position.copy(center).add(offset);

    // Update controls target to domain center
    if ('target' in controls) {
      (controls as any).target.copy(center);
      (controls as any).update();
    }

    console.log('[useAutoCameraFit] Camera fitted to domain:', {
      center: {
        x: center.x.toFixed(2),
        y: center.y.toFixed(2),
        z: center.z.toFixed(2),
      },
      size: {
        x: size.x.toFixed(2),
        y: size.y.toFixed(2),
        z: size.z.toFixed(2),
      },
      cameraPosition: {
        x: camera.position.x.toFixed(2),
        y: camera.position.y.toFixed(2),
        z: camera.position.z.toFixed(2),
      },
    });
  };
}