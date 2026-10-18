/**
 * @file OBJModel.tsx
 * @description Component for rendering OBJ models with render mode support
 */

import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useViewerStore } from '../../hooks/useViewerStore';
import { fixSceneMaterials } from '../../utils/materialFixer';
import type { ModelData } from '../../types/viewer.types';

interface OBJModelProps {
  model: ModelData;
}

export default function OBJModel({ model }: OBJModelProps) {
  // Load OBJ model
  const obj = useLoader(OBJLoader, model.url);

  // Get render mode from store
  const renderMode = useViewerStore((state) => state.displaySettings.renderMode);

  // Store for updating model bounding box
  const updateModel = useViewerStore((state) => state.updateModel);

  // Clone the object to avoid modifying the cached version
  const clonedObj = useMemo(() => {
    const cloned = obj.clone();
    // Fix any material/UV issues
    fixSceneMaterials(cloned);
    return cloned;
  }, [obj]);

  // Calculate and save bounding box
  useEffect(() => {
    if (!clonedObj) return;

    // Compute bounding box for the entire object
    const box = new THREE.Box3().setFromObject(clonedObj);

    if (box.isEmpty()) return;

    const min = box.min;
    const max = box.max;
    const size = {
      x: max.x - min.x,
      y: max.y - min.y,
      z: max.z - min.z
    };

    const boundingBoxData = {
      min: min.toArray() as [number, number, number],
      max: max.toArray() as [number, number, number],
      size: size
    };

    console.log(`[OBJModel] Loaded: ${model.name}`, {
      id: model.id,
      url: model.url,
      visible: model.visible,
      min: boundingBoxData.min,
      max: boundingBoxData.max,
      size: [size.x, size.y, size.z],
    });

    // Update model in store with bounding box and object reference
    updateModel(model.id, {
      boundingBox: boundingBoxData,
      object: clonedObj  // Store the object for STL export
    });

    // Dispatch event with bounding box information
    const event = new CustomEvent('modelGeometryLoaded', {
      detail: {
        modelId: model.id,
        modelName: model.name,
        boundingBox: boundingBoxData
      }
    });
    window.dispatchEvent(event);
    console.log('[OBJModel] Dispatched modelGeometryLoaded event for:', model.name);
  }, [clonedObj, model.id, model.name, model.url, model.visible, updateModel]);

  // Apply model transformations and properties
  useEffect(() => {
    if (!clonedObj) return;

    // Apply position
    if (model.position) {
      clonedObj.position.set(...model.position);
    }

    // Apply rotation
    if (model.rotation) {
      clonedObj.rotation.set(...model.rotation);
    }

    // Apply scale
    if (model.scale) {
      clonedObj.scale.set(...model.scale);
    }

    // Apply visibility
    clonedObj.visible = model.visible;

    // Determine material based on render mode
    const showWireframeMode = renderMode === 'solid+wireframe' || renderMode === 'wireframe';
    const showPointsMode = renderMode === 'points';

    // Traverse and apply material properties
    clonedObj.traverse((child: any) => {
      if (child.isMesh) {
        // Compute normals if needed
        if (child.geometry) {
          child.geometry.computeVertexNormals();
        }

        // Apply material based on render mode
        if (showWireframeMode) {
          // Wireframe mode
          child.material = new THREE.MeshBasicMaterial({
            color: model.color || '#cccccc',
            wireframe: true,
            transparent: renderMode === 'solid+wireframe',
            opacity: renderMode === 'solid+wireframe' ? 0.3 : 1.0,
          });
        } else if (showPointsMode) {
          // Points mode
          child.material = new THREE.PointsMaterial({
            color: model.color || '#cccccc',
            size: 0.002,
            sizeAttenuation: true,
          });
        } else {
          // Solid mode
          child.material = new THREE.MeshPhongMaterial({
            color: model.color || '#cccccc',
            transparent: model.transparent !== undefined ? model.transparent : false,
            opacity: model.opacity !== undefined ? model.opacity : 1.0,
            wireframe: false,
          });
        }

        // Enable shadows
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedObj, model, renderMode]);

  return (
    <primitive
      object={clonedObj}
      name={model.name}
      userData={{ modelId: model.id }}
    />
  );
}
