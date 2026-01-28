/**
 * @file GLTFModel.tsx
 * @description Component for rendering GLTF/GLB models with per-part selection, hover, and render mode support
 */

import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useViewerStore } from '../../hooks/useViewerStore';
import { fixSceneMaterials } from '../../utils/materialFixer';
import type { ModelData } from '../../types/viewer.types';
import type { GLTF } from 'three-stdlib';
import type { ThreeEvent } from '@react-three/fiber';

interface GLTFModelProps {
  model: ModelData;
}

interface MeshPart {
  mesh: THREE.Mesh;
  id: string;
  name: string;
  originalMaterial: THREE.Material | THREE.Material[];
}

export default function GLTFModel({ model }: GLTFModelProps) {
  // Load GLTF/GLB model
  const gltf = useGLTF(model.url) as GLTF;

  // Get render mode from store
  const renderMode = useViewerStore((state) => state.displaySettings.renderMode);

  // Store for updating model bounding box
  const updateModel = useViewerStore((state) => state.updateModel);

  // Store state for selection and hover
  const selectedModelId = useViewerStore((state) => state.selectedModelId);
  const hoveredModelId = useViewerStore((state) => state.hoveredModelId);
  const setSelectedModelId = useViewerStore((state) => state.setSelectedModelId);
  const setHoveredModelId = useViewerStore((state) => state.setHoveredModelId);
  const enableSelection = useViewerStore((state) => state.displaySettings.enableSelection);
  const enableHover = useViewerStore((state) => state.displaySettings.enableHover);

  // Track mesh parts
  const [meshParts, setMeshParts] = useState<MeshPart[]>([]);

  // Clone scene to avoid modifying cached version
  const clonedScene = useMemo(() => {
    const cloned = gltf.scene.clone();
    // Fix any material/UV issues in the cloned scene
    fixSceneMaterials(cloned);
    return cloned;
  }, [gltf]);

  // Extract mesh parts from cloned scene
  useEffect(() => {
    if (!clonedScene) return;

    const parts: MeshPart[] = [];
    let meshIndex = 0;

    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        const meshName = child.name || `mesh_${meshIndex}`;
        const partId = `${model.id}:${meshName}`;

        // Store original material
        const originalMaterial = Array.isArray(child.material)
          ? child.material.map((m: THREE.Material) => m.clone())
          : child.material.clone();

        // Store part info in userData for event handling
        child.userData.partId = partId;
        child.userData.partName = meshName;
        child.userData.modelId = model.id;
        child.userData.originalMaterial = originalMaterial;

        parts.push({
          mesh: child,
          id: partId,
          name: meshName,
          originalMaterial
        });

        meshIndex++;
      }
    });

    setMeshParts(parts);
    console.log(`[GLTFModel] Extracted ${parts.length} mesh parts from: ${model.name}`);
  }, [clonedScene, model.id, model.name]);

  // Calculate and save bounding box - run only once when scene is loaded
  useEffect(() => {
    if (!clonedScene) return;

    // Compute bounding box for the entire scene
    const box = new THREE.Box3().setFromObject(clonedScene);

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

    console.log(`[GLTFModel] Loaded: ${model.name}`, {
      id: model.id,
      url: model.url,
      visible: model.visible,
      min: boundingBoxData.min,
      max: boundingBoxData.max,
      size: [size.x, size.y, size.z],
    });

    // Update model in store with bounding box
    updateModel(model.id, {
      boundingBox: boundingBoxData
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
    console.log('[GLTFModel] Dispatched modelGeometryLoaded event for:', model.name);
  }, [clonedScene, model.id, model.name, model.url, model.visible, updateModel]);

  // Store the object reference separately - this ensures it persists
  useEffect(() => {
    if (!clonedScene) return;

    // Store the Three.js object for STL export
    updateModel(model.id, {
      object: clonedScene
    });

    console.log('[GLTFModel] Stored object for STL export:', {
      modelId: model.id,
      modelName: model.name,
      hasObject: true,
      objectType: clonedScene.type,
      childCount: clonedScene.children?.length || 0
    });
  }, [clonedScene, model.id, updateModel]);

  // Apply model transformations
  useEffect(() => {
    if (!clonedScene) return;

    // Apply position
    if (model.position) {
      clonedScene.position.set(...model.position);
    }

    // Apply rotation
    if (model.rotation) {
      clonedScene.rotation.set(...model.rotation);
    }

    // Apply scale
    if (model.scale) {
      clonedScene.scale.set(...model.scale);
    }

    // Apply visibility
    clonedScene.visible = model.visible;
  }, [clonedScene, model.position, model.rotation, model.scale, model.visible]);

  // Apply material properties based on render mode and selection/hover state
  useEffect(() => {
    if (meshParts.length === 0) return;

    const showSolid = renderMode === 'solid' ||
                      renderMode === 'solid+edges' ||
                      renderMode === 'solid+wireframe';
    const showWireframeMode = renderMode === 'solid+wireframe' || renderMode === 'wireframe';
    const showPointsMode = renderMode === 'points';

    meshParts.forEach((part) => {
      const child = part.mesh;
      const partId = part.id;

      // Determine if this specific part is selected or hovered
      const isPartSelected = selectedModelId === partId;
      const isPartHovered = hoveredModelId === partId;

      // Determine color based on selection/hover state
      let colorOverride: string | null = null;
      if (isPartSelected) {
        colorOverride = '#ffff00'; // Yellow for selected
      } else if (isPartHovered && enableHover) {
        colorOverride = '#ff9800'; // Orange for hovered
      }

      // Apply render mode
      if (showWireframeMode) {
        const baseColor = colorOverride || model.color || '#cccccc';

        const wireMat = new THREE.MeshBasicMaterial({
          color: baseColor,
          wireframe: true,
          transparent: renderMode === 'solid+wireframe',
          opacity: renderMode === 'solid+wireframe' ? 0.3 : 1.0,
        });
        child.material = wireMat;
      } else if (showPointsMode) {
        const baseColor = colorOverride || model.color || '#cccccc';

        const pointsMat = new THREE.PointsMaterial({
          color: baseColor,
          size: 0.002,
          sizeAttenuation: true,
        });
        child.material = pointsMat;
      } else if (showSolid) {
        if (colorOverride) {
          // Apply selection/hover color - create new material to avoid affecting original
          const materials = Array.isArray(part.originalMaterial)
            ? part.originalMaterial
            : [part.originalMaterial];

          const newMaterials = materials.map((origMat: THREE.Material) => {
            const newMat = origMat.clone();
            if ('color' in newMat) {
              (newMat as any).color.set(colorOverride);
            }
            return newMat;
          });

          child.material = Array.isArray(part.originalMaterial)
            ? newMaterials
            : newMaterials[0];
        } else if (model.color) {
          // Apply model's custom color
          const materials = Array.isArray(part.originalMaterial)
            ? part.originalMaterial
            : [part.originalMaterial];

          const newMaterials = materials.map((origMat: THREE.Material) => {
            const newMat = origMat.clone();
            if ('color' in newMat) {
              (newMat as any).color.set(model.color);
            }
            return newMat;
          });

          child.material = Array.isArray(part.originalMaterial)
            ? newMaterials
            : newMaterials[0];
        } else {
          // Restore original material
          child.material = Array.isArray(part.originalMaterial)
            ? part.originalMaterial.map((m: THREE.Material) => m.clone())
            : part.originalMaterial.clone();
        }

        // Apply transparency and opacity only if explicitly set
        if (model.transparent !== undefined && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((mat: any) => {
            mat.transparent = model.transparent;
            if (model.opacity !== undefined) {
              mat.opacity = model.opacity;
            }
          });
        }
      }

      // Enable shadows
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }, [meshParts, model, renderMode, selectedModelId, hoveredModelId, enableHover]);

  // Event handlers - per part
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!enableSelection) return;
    e.stopPropagation();

    const partId = e.object.userData.partId;
    if (partId) {
      const isCurrentlySelected = selectedModelId === partId;
      setSelectedModelId(isCurrentlySelected ? null : partId);
      console.log(`[GLTFModel] Part ${isCurrentlySelected ? 'deselected' : 'selected'}:`, partId);
    }
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!enableHover) return;
    e.stopPropagation();

    const partId = e.object.userData.partId;
    if (partId) {
      setHoveredModelId(partId);
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    if (!enableHover) return;

    const partId = e.object.userData.partId;
    // Only clear hover if we're leaving the currently hovered part
    if (partId && hoveredModelId === partId) {
      setHoveredModelId(null);
    }
  };

  return (
    <group
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive
        object={clonedScene}
        name={model.name}
        userData={{ modelId: model.id }}
      />
    </group>
  );
}
