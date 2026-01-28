import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAutoDomainStore } from '../../stores/autoDomainStore';
import { useAutoCameraFit } from '../../hooks/useAutoCameraFit';
import {
  calculateDomainBounds,
  createDomainWireframe,
  createDomainPlanes,
  createFlowArrows,
} from '../../utils/vehicleOrientationDetector';

export const AutoDomain: React.FC = () => {
  const { scene } = useThree();
  const domainGroupRef = useRef<THREE.Group | null>(null);

  const settings = useAutoDomainStore((state) => state.settings);
  const isVisible = useAutoDomainStore((state) => state.isVisible);
  const showWireframe = useAutoDomainStore((state) => state.showWireframe);
  const showPlanes = useAutoDomainStore((state) => state.showPlanes);
  const showDimensions = useAutoDomainStore((state) => state.showDimensions);
  const vehicleDimensions = useAutoDomainStore((state) => state.vehicleDimensions);

  // Hook for auto camera fit
  useAutoCameraFit();

  // Initialize domain group
  useEffect(() => {
    const domainGroup = new THREE.Group();
    domainGroup.name = 'autoDomain';
    domainGroupRef.current = domainGroup;
    scene.add(domainGroup);

    return () => {
      scene.remove(domainGroup);
      domainGroup.clear();
      domainGroupRef.current = null;
    };
  }, [scene]);

  // Update domain visualization
  useEffect(() => {
    if (!vehicleDimensions || !domainGroupRef.current) return;

    const domainGroup = domainGroupRef.current;

    // Clear existing objects
    domainGroup.clear();

    // Calculate domain bounds
    const domainBounds = calculateDomainBounds(
      vehicleDimensions,
      settings.frontExtension,
      settings.rearExtension,
      settings.sideRatio,
      settings.heightRatio
    );

    // Update store with new bounds (without causing re-render)
    useAutoDomainStore.getState().setDomainBounds(domainBounds);

    // Create wireframe
    if (showWireframe) {
      const wireframe = createDomainWireframe(domainBounds, 0x00ffff);
      domainGroup.add(wireframe);
    }

    // Check if flow is flipped by comparing front and rear extensions
    const isFlipped = settings.frontExtension > settings.rearExtension;

    // Create planes with inlet/outlet visualization
    if (showPlanes) {
      const planes = createDomainPlanes(domainBounds, vehicleDimensions?.orientation || null, isFlipped);
      planes.forEach((plane) => domainGroup.add(plane));
    }

    // Create flow direction arrows
    const flowArrows = createFlowArrows(domainBounds, vehicleDimensions?.orientation || null, isFlipped);
    domainGroup.add(flowArrows);

    // Dimension labels removed - lines were distracting

    // Update visibility
    domainGroup.visible = isVisible;

    // Dispatch event to regenerate shadows
    const event = new CustomEvent('domainUpdated', {
      detail: {
        bounds: domainBounds,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
    console.log('[AutoDomain] Domain updated, triggering shadow regeneration');
  }, [
    vehicleDimensions,
    settings.frontExtension,
    settings.rearExtension,
    settings.sideRatio,
    settings.heightRatio,
    showWireframe,
    showPlanes,
    showDimensions,
    isVisible,
  ]);

  // Update visibility separately
  useEffect(() => {
    if (domainGroupRef.current) {
      domainGroupRef.current.visible = isVisible;
    }
  }, [isVisible]);

  return null;
};