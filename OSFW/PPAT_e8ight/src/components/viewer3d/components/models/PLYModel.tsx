/**
 * @file PLYModel.tsx
 * @description Component for rendering PLY models with render mode support
 */

import { useLoader } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useViewerStore } from '../../hooks/useViewerStore';
import { ensureUVAttributes } from '../../utils/materialFixer';
import type { ModelData } from '../../types/viewer.types';

interface PLYModelProps {
  model: ModelData;
}

export default function PLYModel({ model }: PLYModelProps) {
  // Load PLY model (returns BufferGeometry)
  const geometry = useLoader(PLYLoader, model.url);
  const meshRef = useRef<THREE.Mesh>(null);

  // Get render mode from store
  const renderMode = useViewerStore((state) => state.displaySettings.renderMode);

  // Store for updating model bounding box
  const updateModel = useViewerStore((state) => state.updateModel);

  // Calculate and save bounding box
  useEffect(() => {
    if (!geometry) return;

    // Fix UV attributes to prevent shader errors
    ensureUVAttributes(geometry);

    // Compute bounding box for the geometry
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;

    if (!bbox) return;

    const min = bbox.min;
    const max = bbox.max;
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

    console.log(`[PLYModel] Loaded: ${model.name}`, {
      id: model.id,
      url: model.url,
      visible: model.visible,
      min: boundingBoxData.min,
      max: boundingBoxData.max,
      size: [size.x, size.y, size.z],
      vertices: geometry.attributes.position?.count || 0,
    });

    // Update model in store with bounding box and mesh reference
    updateModel(model.id, {
      boundingBox: boundingBoxData,
      object: meshRef.current  // Store the mesh for STL export
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
    console.log('[PLYModel] Dispatched modelGeometryLoaded event for:', model.name);
  }, [geometry, model.id, model.name, model.url, model.visible, updateModel]);

  // Create mesh with material
  const mesh = useMemo(() => {
    // Fix UV attributes before using geometry
    ensureUVAttributes(geometry);

    // Compute normals for proper lighting
    geometry.computeVertexNormals();

    // Determine material based on render mode
    const showWireframeMode = renderMode === 'solid+wireframe' || renderMode === 'wireframe';
    const showPointsMode = renderMode === 'points';

    let material;
    if (showWireframeMode) {
      // Wireframe mode
      material = new THREE.MeshBasicMaterial({
        color: model.color || '#cccccc',
        wireframe: true,
        transparent: renderMode === 'solid+wireframe',
        opacity: renderMode === 'solid+wireframe' ? 0.3 : 1.0,
        side: THREE.DoubleSide,
      });
    } else if (showPointsMode) {
      // Points mode
      material = new THREE.PointsMaterial({
        color: model.color || '#cccccc',
        size: 0.002,
        sizeAttenuation: true,
      });
    } else {
      // Solid mode
      material = new THREE.MeshPhongMaterial({
        color: model.color || '#cccccc',
        transparent: model.transparent !== undefined ? model.transparent : false,
        opacity: model.opacity !== undefined ? model.opacity : 1.0,
        side: THREE.DoubleSide,
        wireframe: false,
      });
    }

    // Create mesh or points based on render mode
    const object = showPointsMode
      ? new THREE.Points(geometry, material)
      : new THREE.Mesh(geometry, material);

    // Apply transformations
    if (model.position) {
      object.position.set(...model.position);
    }
    if (model.rotation) {
      object.rotation.set(...model.rotation);
    }
    if (model.scale) {
      object.scale.set(...model.scale);
    }

    // Apply visibility
    object.visible = model.visible;

    // Enable shadows (only for mesh)
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }

    // Set name and userData
    object.name = model.name;
    object.userData.modelId = model.id;

    return object;
  }, [geometry, model, renderMode]);

  // Update object reference when mesh is created
  useEffect(() => {
    if (mesh) {
      updateModel(model.id, {
        object: mesh  // Store the mesh/points object for STL export
      });
      console.log('[PLYModel] Updated object reference for:', model.name);
    }
  }, [mesh, model.id, model.name, updateModel]);

  return <primitive object={mesh} />;
}
