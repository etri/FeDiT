/**
 * @file FitToBoxHandler.tsx
 * @description Component that handles automatic camera fitting when models are loaded
 */

import { useEffect, useRef } from 'react';
import { useViewerStore } from '../hooks/useViewerStore';
import { useFitToBox } from '../hooks/useFitToBox';

export default function FitToBoxHandler() {
  const { fitToBox } = useFitToBox();
  const models = useViewerStore((state) => state.models);
  const currentSimulation = useViewerStore((state) => state.currentSimulation);
  const domainDimensions = useViewerStore((state) => state.domainDimensions);
  const waterColumnConfig = useViewerStore((state) => state.waterColumnConfig);
  const tankType = useViewerStore((state) => state.tankType);
  const transformMode = useViewerStore((state) => state.transformMode);

  // Use ref to track transform mode to prevent stale closures
  const transformModeRef = useRef(transformMode);

  // Use ref to track if transform was recently changed (to prevent auto-fit during transform operations)
  const transformRecentlyChangedRef = useRef(false);

  useEffect(() => {
    const wasTransformMode = transformModeRef.current;
    transformModeRef.current = transformMode;

    // If transform mode changed in any way (enabled, disabled, or mode changed), prevent auto-fit
    if (wasTransformMode !== transformMode) {
      transformRecentlyChangedRef.current = true;
      console.log('[FitToBox] Transform mode changed - preventing auto-fit for 1s');

      const timer = setTimeout(() => {
        transformRecentlyChangedRef.current = false;
        console.log('[FitToBox] Auto-fit re-enabled after transform cooldown');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [transformMode]);

  // Use ref to store fitToBox to prevent re-triggering useEffect when fitToBox changes
  const fitToBoxRef = useRef(fitToBox);
  useEffect(() => {
    fitToBoxRef.current = fitToBox;
  }, [fitToBox]);

  // Fit to box when models change (e.g., drag & drop)
  // IMPORTANT: Do NOT auto-fit when transform mode is active!
  // NOTE: transformMode and fitToBox are NOT in deps to avoid re-triggering when they change
  useEffect(() => {
    console.log('[FitToBox] Models effect triggered:', {
      modelsLength: models.length,
      transformMode,
      willFit: models.length > 0 && !transformMode
    });

    if (models.length > 0 && !transformMode) {
      // Longer delay for complex models to ensure they're fully loaded
      // Weir Overflow Tank & Sedimentation Tank: 500ms (3 STL files)
      // Drag & drop models: 400ms (GLB/GLTF/OBJ may take time to load)
      // Other simulations: 100ms
      let delay = 100;

      if (tankType === 'weir_overflow_sph' || tankType === 'sedimentation_tank_lbm' || tankType === 'sedimentation_tank_sph') {
        delay = 500;
      } else if (!currentSimulation) {
        // If no simulation (drag & drop models), use longer delay
        delay = 400;
      }

      const timer = setTimeout(() => {
        // Double-check transform mode at execution time to prevent fit during/after transform
        if (!transformModeRef.current && !transformRecentlyChangedRef.current) {
          console.log('[FitToBox] About to fit camera to models (delay: ' + delay + 'ms)');
          fitToBoxRef.current(true);
          console.log('[FitToBox] Auto-fitted camera to models');
        } else {
          console.log('[FitToBox] Skipped fit - transform mode is active or recently changed');
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [models.length, tankType, currentSimulation]); // Removed transformMode and fitToBox from deps

  // Fit to box when simulation changes
  // IMPORTANT: Do NOT auto-fit when transform mode is active!
  // NOTE: transformMode and fitToBox are NOT in deps to avoid re-triggering when they change
  useEffect(() => {
    if ((currentSimulation || domainDimensions || waterColumnConfig) && !transformMode) {
      // Longer delay for Weir Overflow Tank & Sedimentation Tank
      const delay = (tankType === 'weir_overflow_sph' || tankType === 'sedimentation_tank_lbm' || tankType === 'sedimentation_tank_sph') ? 500 : 100;

      const timer = setTimeout(() => {
        // Double-check transform mode at execution time to prevent fit during/after transform
        if (!transformModeRef.current && !transformRecentlyChangedRef.current) {
          fitToBoxRef.current(true);
          console.log('[FitToBox] Auto-fitted camera to simulation');
        } else {
          console.log('[FitToBox] Skipped fit - transform mode is active or recently changed');
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [currentSimulation, domainDimensions, waterColumnConfig, tankType]); // Removed transformMode and fitToBox from deps

  // Expose fitToBox function to window for manual triggering
  useEffect(() => {
    (window as any).dreiViewerFitToBox = () => fitToBox(true);
    //console.log('[FitToBox] Fit-to-box function registered');

    return () => {
      delete (window as any).dreiViewerFitToBox;
    };
  }, [fitToBox]);

  return null; // This component doesn't render anything
}
