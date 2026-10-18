/**
 * @file Shadows.tsx
 * @description Accumulative shadows component for realistic soft shadows
 * Uses drei's AccumulativeShadows and RandomizedLight
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import { AccumulativeShadows, RandomizedLight } from '@react-three/drei';
import { useViewerStore } from '../hooks/useViewerStore';
import { useThree } from '@react-three/fiber';
import { Box3, Vector3, Mesh, Group } from 'three';

export default function Shadows() {
  const shadowConfig = useViewerStore((state) => state.shadowConfig);
  const models = useViewerStore((state) => state.models);
  const domainDimensions = useViewerStore((state) => state.domainDimensions);
  const transformMode = useViewerStore((state) => state.transformMode);
  const scene = useThree((state) => state.scene);
  const shadowRef = useRef<Group>(null);
  const [shadowKey, setShadowKey] = useState(0); // Key to force re-render of shadows
  const lastDynamicScaleRef = useRef<number>(shadowConfig.scale); // Cache last calculated scale

  // Mark shadow plane with userData to exclude from fit-to-box calculations
  useEffect(() => {
    if (shadowRef.current) {
      shadowRef.current.traverse((object) => {
        object.userData.isShadow = true;
      });
    }
  }, []);

  // Listen for domain updates and model updates to regenerate shadows
  useEffect(() => {
    const handleDomainUpdate = () => {
      console.log('[Shadows] Domain updated, regenerating shadows');
      setShadowKey((prev) => prev + 1);
    };

    const handleModelUpdate = () => {
      console.log('[Shadows] Model geometry updated, regenerating shadows');
      setShadowKey((prev) => prev + 1);
    };

    // Listen for domain updates
    window.addEventListener('domainUpdated', handleDomainUpdate);

    // Listen for model geometry updates
    window.addEventListener('modelGeometryLoaded', handleModelUpdate);

    return () => {
      window.removeEventListener('domainUpdated', handleDomainUpdate);
      window.removeEventListener('modelGeometryLoaded', handleModelUpdate);
    };
  }, []);

  // Calculate dynamic scale based on domain dimensions or rendered meshes
  const dynamicScale = useMemo(() => {
    // Priority 1: Use domain dimensions if available (most reliable)
    if (domainDimensions) {
      const maxDim = Math.max(
        domainDimensions.width,
        domainDimensions.height,
        domainDimensions.depth
      );
      // Use 3x domain size to ensure shadow covers beyond the domain
      const scale = Math.max(maxDim * 3, 10);
      lastDynamicScaleRef.current = scale;
      return scale;
    }

    // Priority 2: Calculate from actual rendered meshes in the scene
    if (models.length === 0) {
      lastDynamicScaleRef.current = shadowConfig.scale;
      return shadowConfig.scale;
    }

    const box = new Box3();
    let hasAutoDomain = false;

    // Traverse scene and find all meshes and domain bounds
    scene.traverse((object) => {
      // Check for auto domain group
      if (object.name === 'autoDomain') {
        hasAutoDomain = true;
        // Include domain wireframe in bounds calculation
        object.traverse((child) => {
          if (child instanceof Mesh && child.geometry) {
            child.geometry.computeBoundingBox();
            if (child.geometry.boundingBox) {
              const childBox = child.geometry.boundingBox.clone();
              childBox.applyMatrix4(child.matrixWorld);
              box.union(childBox);
            }
          }
        });
      } else if (
        object instanceof Mesh &&
        object.geometry &&
        !object.userData.isShadow &&
        !object.userData.isTransformControl
      ) {
        // Compute bounding box for regular meshes (exclude shadows and transform controls)
        object.geometry.computeBoundingBox();
        if (object.geometry.boundingBox) {
          // Clone and apply world transform
          const meshBox = object.geometry.boundingBox.clone();
          meshBox.applyMatrix4(object.matrixWorld);
          box.union(meshBox);
        }
      }
    });

    if (box.isEmpty()) {
      lastDynamicScaleRef.current = shadowConfig.scale;
      return shadowConfig.scale;
    }

    const size = new Vector3();
    box.getSize(size);
    const maxSize = Math.max(size.x, size.y, size.z);

    // Return 5x the bounding box size or minimum 10
    // Use 7x for automotive domain to ensure full coverage
    const multiplier = hasAutoDomain ? 7 : 5;
    const scale = Math.max(maxSize * multiplier, 10);
    lastDynamicScaleRef.current = scale;
    return scale;
  }, [models, domainDimensions, shadowConfig.scale, shadowConfig.enabled, scene, shadowKey]);

  // Don't render shadows when transform mode is active to avoid conflicts
  if (!shadowConfig.enabled || transformMode) return null;

  return (
    <group ref={shadowRef}>
      <AccumulativeShadows
        key={shadowKey} // Force re-render when key changes
        temporal={shadowConfig.temporal}
        frames={shadowConfig.frames}
        color={shadowConfig.color}
        colorBlend={shadowConfig.colorBlend}
        alphaTest={0.85}
        scale={dynamicScale}
        position={[0, -0.002, 0]} // Slightly below ground to avoid z-fighting
        opacity={shadowConfig.opacity}
      >
        <RandomizedLight
          amount={shadowConfig.lightAmount}
          radius={shadowConfig.lightRadius}
          position={shadowConfig.lightPosition}
          ambient={0.5}
          intensity={1}
          bias={0.001}
        />
      </AccumulativeShadows>
    </group>
  );
}
