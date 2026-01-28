import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAutoDomainStore } from '../stores/autoDomainStore';
import { detectVehicleOrientation } from '../utils/vehicleOrientationDetector';
import { detectUnit, validateVehicleDimensions } from '../utils/unitConverter';
import { useViewerStore } from './useViewerStore';

/**
 * 모델을 바닥(Y=0)에 배치하기 위한 Y 오프셋 계산
 * 모델의 최소 Y 좌표가 0이 되도록 이동
 */
function calculateGroundOffset(boundingBox: { min: [number, number, number]; max: [number, number, number] }): number {
  // boundingBox.min[1]이 Y 최소값
  // 이 값을 0으로 만들기 위해 -min[1]만큼 이동
  return -boundingBox.min[1];
}

/**
 * Hook that automatically generates domain when a model is loaded
 */
export function useAutoDomainGeneration() {
  const { autoGenerate, setVehicleDimensions, setDetectedUnit, clearDomain } = useAutoDomainStore();
  const models = useViewerStore((state) => state.models);
  const updateModel = useViewerStore((state) => state.updateModel);
  const transformMode = useViewerStore((state) => state.transformMode);
  const transformModeRef = useRef(transformMode);
  const processedModelsRef = useRef<Set<string>>(new Set()); // 이미 처리한 모델 추적

  // Update ref
  useEffect(() => {
    transformModeRef.current = transformMode;
  }, [transformMode]);

  useEffect(() => {
    if (!autoGenerate) return;

    // Listen for model geometry loaded events
    const handleModelGeometryLoaded = (event: CustomEvent) => {
      const { modelId, boundingBox } = event.detail;

      if (!boundingBox) return;

      // 모델을 바닥(Y=0)에 배치
      // 이미 처리한 모델은 건너뜀
      let adjustedBoundingBox = boundingBox;

      if (modelId && !processedModelsRef.current.has(modelId)) {
        const yOffset = calculateGroundOffset(boundingBox);

        if (Math.abs(yOffset) > 0.0001) { // 의미 있는 오프셋만 적용
          // 현재 모델의 위치 가져오기
          const currentModel = models.find(m => m.id === modelId);
          const currentPosition = currentModel?.position || [0, 0, 0];

          // Y 위치만 조정 (기존 X, Z 유지)
          const newPosition: [number, number, number] = [
            currentPosition[0],
            currentPosition[1] + yOffset,
            currentPosition[2]
          ];

          // bounding box도 조정
          adjustedBoundingBox = {
            min: [boundingBox.min[0], 0, boundingBox.min[2]] as [number, number, number],
            max: [boundingBox.max[0], boundingBox.max[1] + yOffset, boundingBox.max[2]] as [number, number, number],
            size: boundingBox.size
          };

          updateModel(modelId, {
            position: newPosition,
            boundingBox: adjustedBoundingBox
          });
          processedModelsRef.current.add(modelId);

          console.log(`[AutoDomain] Model "${modelId}" positioned to ground (Y=0):`, {
            originalMinY: boundingBox.min[1],
            yOffset: yOffset.toFixed(4),
            newPosition,
            adjustedBoundingBox
          });
        } else {
          processedModelsRef.current.add(modelId);
        }
      }

      // Create Three.js Box3 from adjusted bounding box data
      const box = new THREE.Box3(
        new THREE.Vector3(...adjustedBoundingBox.min),
        new THREE.Vector3(...adjustedBoundingBox.max)
      );

      // Detect vehicle orientation
      const vehicleDimensions = detectVehicleOrientation(box);

      // Detect unit based on dimensions
      const maxDimension = Math.max(
        vehicleDimensions.length,
        vehicleDimensions.width,
        vehicleDimensions.height
      );
      const detectedUnit = detectUnit(maxDimension);

      console.log('[AutoDomain] Vehicle orientation and unit detected:', {
        orientation: vehicleDimensions.orientation,
        length: vehicleDimensions.length.toFixed(3),
        width: vehicleDimensions.width.toFixed(3),
        height: vehicleDimensions.height.toFixed(3),
        detectedUnit,
      });

      // Validate dimensions
      const validation = validateVehicleDimensions(
        vehicleDimensions.length,
        vehicleDimensions.width,
        vehicleDimensions.height,
        detectedUnit
      );

      if (validation.warnings.length > 0) {
        console.warn('[AutoDomain] Dimension warnings:', validation.warnings);
      }

      // Update store with vehicle dimensions and detected unit
      setDetectedUnit(detectedUnit);
      setVehicleDimensions(vehicleDimensions);
    };

    window.addEventListener('modelGeometryLoaded', handleModelGeometryLoaded as EventListener);

    return () => {
      window.removeEventListener('modelGeometryLoaded', handleModelGeometryLoaded as EventListener);
    };
  }, [autoGenerate, setVehicleDimensions, setDetectedUnit, updateModel, models]);

  // Clear domain when all models are removed
  useEffect(() => {
    if (models.length === 0) {
      clearDomain();
      processedModelsRef.current.clear(); // 처리된 모델 목록 초기화
    }
  }, [models.length, clearDomain]);

  // Handle multiple models - combine bounding boxes
  useEffect(() => {
    if (!autoGenerate || models.length === 0) return;

    // Don't recalculate vehicle dimensions during transform operations
    if (transformModeRef.current) {
      console.log('[AutoDomain] Skipped vehicle dimensions calculation - transform mode is active');
      return;
    }

    // Get all models with bounding boxes
    const modelsWithBounds = models.filter(model => model.boundingBox);

    if (modelsWithBounds.length === 0) return;

    // Combine all bounding boxes
    const combinedBox = new THREE.Box3();
    let firstBox = true;

    modelsWithBounds.forEach(model => {
      if (model.boundingBox) {
        const box = new THREE.Box3(
          new THREE.Vector3(...model.boundingBox.min),
          new THREE.Vector3(...model.boundingBox.max)
        );

        if (firstBox) {
          combinedBox.copy(box);
          firstBox = false;
        } else {
          combinedBox.union(box);
        }
      }
    });

    // Detect vehicle orientation from combined box
    const vehicleDimensions = detectVehicleOrientation(combinedBox);

    // Detect unit if not already set
    const currentDetectedUnit = useAutoDomainStore.getState().settings.detectedUnit;
    if (!currentDetectedUnit) {
      const maxDimension = Math.max(
        vehicleDimensions.length,
        vehicleDimensions.width,
        vehicleDimensions.height
      );
      const detectedUnit = detectUnit(maxDimension);
      setDetectedUnit(detectedUnit);

      console.log('[AutoDomain] Unit detected for combined models:', detectedUnit);
    }

    console.log('[AutoDomain] Combined vehicle dimensions:', {
      modelCount: modelsWithBounds.length,
      orientation: vehicleDimensions.orientation,
      length: vehicleDimensions.length.toFixed(3),
      width: vehicleDimensions.width.toFixed(3),
      height: vehicleDimensions.height.toFixed(3),
    });

    // Update store
    setVehicleDimensions(vehicleDimensions);
  }, [models, autoGenerate, setVehicleDimensions, setDetectedUnit]); // transformMode removed from deps, using ref instead
}