/**
 * @file STLModel.tsx
 * @description Component for rendering STL models with selection, hover, and edge support
 */

import { memo, useMemo, useEffect, useRef } from 'react';
import { DoubleSide, EdgesGeometry, Mesh } from 'three';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { useSTLLoader } from '../../hooks/useModelLoader';
import { useViewerStore } from '../../hooks/useViewerStore';
import { ensureUVAttributes } from '../../utils/materialFixer';
import type { ModelData } from '../../types/viewer.types';
import type { ThreeEvent } from '@react-three/fiber';

interface STLModelProps {
  model: ModelData;
}

function STLModelComponent({ model }: STLModelProps) {
  const geometry = useSTLLoader(model.url);
  const meshRef = useRef<Mesh>(null);

  // Store for updating model bounding box
  const updateModel = useViewerStore((state) => state.updateModel);

  // Debug: Log geometry information when loaded and dispatch event
  useEffect(() => {
    if (geometry) {
      // Fix UV attributes to prevent shader errors
      ensureUVAttributes(geometry);
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      if (bbox) {
        const size = {
          x: bbox.max.x - bbox.min.x,
          y: bbox.max.y - bbox.min.y,
          z: bbox.max.z - bbox.min.z
        };

        const boundingBoxData = {
          min: bbox.min.toArray() as [number, number, number],
          max: bbox.max.toArray() as [number, number, number],
          size: size
        };

        console.log(`[STLModel] Loaded: ${model.name}`, {
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
        console.log('[STLModel] Dispatched modelGeometryLoaded event for:', model.name);
      }
    }
  }, [geometry, model.id, model.name, model.url, model.visible, updateModel]);

  // Update mesh reference when mesh is created
  useEffect(() => {
    if (meshRef.current && geometry) {
      updateModel(model.id, {
        object: meshRef.current  // Update with actual mesh object
      });
      console.log('[STLModel] Updated mesh reference for:', model.name);
    }
  }, [meshRef.current, geometry, model.id, model.name, updateModel]);

  // Store state for selection and hover
  const selectedModelId = useViewerStore((state) => state.selectedModelId);
  const hoveredModelId = useViewerStore((state) => state.hoveredModelId);
  const setSelectedModelId = useViewerStore((state) => state.setSelectedModelId);
  const setHoveredModelId = useViewerStore((state) => state.setHoveredModelId);
  const enableSelection = useViewerStore((state) => state.displaySettings.enableSelection);
  const enableHover = useViewerStore((state) => state.displaySettings.enableHover);

  // Store state for edges
  const showEdges = useViewerStore((state) => state.displaySettings.showEdges);
  const showFeatureEdges = useViewerStore((state) => state.displaySettings.showFeatureEdges);
  const edgeColor = useViewerStore((state) => state.displaySettings.edgeColor);
  const edgeThreshold = useViewerStore((state) => state.displaySettings.edgeThreshold);

  // Store state for render mode
  const renderMode = useViewerStore((state) => state.displaySettings.renderMode);

  // Store state for material
  const materialConfig = useViewerStore((state) => state.materialConfig);

  // Store state for water height and weir height (needed for edge updates)
  const waterHeight = useViewerStore((state) => state.waterHeight);
  const weirHeight = useViewerStore((state) => state.weirHeight);

  // Check if this is a water mesh (needed before useMemo)
  // Note: Only Broad_weir_fluid (Sedimentation Tank) uses transmission material
  // lbm_water and sph_water (Sedimentation Column) use simple sky blue color
  const isWaterMesh = model.name === 'Broad_weir_fluid';

  // Check if this is a weir wall mesh
  const isWeirWall = model.name === 'Broad_weir_wall';

  // Create edges geometry
  const edgesGeometry = useMemo(() => {
    if (!geometry) return null;

    // Create edges for render modes that need them or when explicitly enabled
    const needsEdges =
      showEdges ||
      showFeatureEdges ||
      renderMode === 'solid+edges' ||
      renderMode === 'hidden-edges';

    if (!needsEdges) return null;

    // Determine threshold angle
    let thresholdAngle = 0;
    if (showFeatureEdges) {
      thresholdAngle = edgeThreshold;
    } else if (renderMode === 'solid+edges' || renderMode === 'hidden-edges') {
      thresholdAngle = 1; // Small angle to show most edges
    }

    return new EdgesGeometry(geometry, thresholdAngle);
  }, [geometry, showEdges, showFeatureEdges, edgeThreshold, renderMode, waterHeight, weirHeight, isWaterMesh, isWeirWall]);

  // Cleanup edges geometry when component unmounts or geometry changes
  useEffect(() => {
    return () => {
      if (edgesGeometry) {
        edgesGeometry.dispose();
      }
    };
  }, [edgesGeometry]);

  // Don't early return for invisible models - still add to scene for export
  // Just hide from rendering using mesh visible prop
  if (!model.visible) {
    console.log(`[STLModel] Loading hidden mesh (for export): ${model.name} (visible=false)`);
  }

  // Check if this model is selected or hovered
  const isSelected = selectedModelId === model.id;
  const isHovered = hoveredModelId === model.id;

  // Use the water mesh check defined earlier
  const isWater = isWaterMesh;

  // Material properties
  let color = isWater ? (model.color || '#1e88e5') : (model.color || '#888888');
  const transparent = isWater ? true : (model.transparent || false);
  let opacity = isWater ? (model.opacity || 0.6) : (model.opacity || 1.0);

  // Highlight selected or hovered models
  if (isSelected) {
    color = '#ffff00'; // Yellow for selected
    opacity = 1.0;
  } else if (isHovered && enableHover) {
    color = '#ff9800'; // Orange for hovered
    opacity = Math.min(opacity + 0.2, 1.0);
  }

  // Event handlers
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!enableSelection) return;
    e.stopPropagation();
    setSelectedModelId(isSelected ? null : model.id);
    console.log(`Model ${isSelected ? 'deselected' : 'selected'}:`, model.name);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (!enableHover) return;
    e.stopPropagation();
    setHoveredModelId(model.id);
  };

  const handlePointerOut = () => {
    if (!enableHover) return;
    setHoveredModelId(null);
  };

  // Determine visibility based on render mode and model.visible
  const showSolid = model.visible && (
    renderMode === 'solid' ||
    renderMode === 'solid+edges' ||
    renderMode === 'solid+wireframe'
  );
  const showWireframeOverlay = model.visible && (renderMode === 'solid+wireframe' || renderMode === 'wireframe');
  const showPoints = model.visible && (renderMode === 'points');
  const showEdgeLines = model.visible && edgesGeometry && (
    showEdges ||
    showFeatureEdges ||
    renderMode === 'solid+edges' ||
    renderMode === 'hidden-edges'
  );

  // Debug: Log rendering info
  useEffect(() => {
    console.log(`[STLModel] Rendering: ${model.name}`, {
      renderMode,
      showSolid,
      showWireframeOverlay,
      showPoints,
      showEdgeLines,
      color,
      opacity,
      isWater,
      position: model.position || [0, 0, 0],
      rotation: model.rotation || [0, 0, 0],
      scale: model.scale || [1, 1, 1],
    });
  }, [model.name, renderMode, showSolid, showWireframeOverlay, showPoints, showEdgeLines, color, opacity, isWater, model.position, model.rotation, model.scale]);

  return (
    <group>
      {/* Solid mesh - always render but hide when not in solid mode */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        name={model.name}
        position={model.position || [0, 0, 0]}
        rotation={model.rotation || [0, 0, 0]}
        scale={model.scale || [1, 1, 1]}
        visible={showSolid}
        renderOrder={transparent ? 3 : 0}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
          {isWater && materialConfig.type === 'transmission' ? (
            // Transmission material for water with glass-like effect
            <MeshTransmissionMaterial
              color={color}
              transmission={materialConfig.transmission}
              thickness={materialConfig.thickness}
              roughness={materialConfig.roughness}
              ior={materialConfig.ior}
              chromaticAberration={materialConfig.chromaticAberration}
              anisotropicBlur={materialConfig.anisotropicBlur}
              distortion={materialConfig.distortion}
              distortionScale={materialConfig.distortionScale}
              samples={materialConfig.samples}
              side={DoubleSide}
              depthWrite={false}
            />
          ) : isWater ? (
            // Standard phong material for water
            <meshPhongMaterial
              color={color}
              transparent={transparent}
              opacity={opacity}
              side={DoubleSide}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-1}
            />
          ) : (
            // Lambert material for non-water models
            <meshLambertMaterial
              color={color}
              transparent={transparent}
              opacity={opacity}
              side={DoubleSide}
              depthWrite={transparent ? false : true}
              polygonOffset={transparent}
              polygonOffsetFactor={transparent ? -1 : 0}
              polygonOffsetUnits={transparent ? -1 : 0}
            />
          )}
      </mesh>

      {/* Wireframe overlay */}
      {showWireframeOverlay && (
        <mesh
          geometry={geometry}
          position={model.position || [0, 0, 0]}
          rotation={model.rotation || [0, 0, 0]}
          scale={model.scale || [1, 1, 1]}
          renderOrder={transparent ? 5 : 2}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <meshBasicMaterial
            color={renderMode === 'wireframe' ? (color) : '#000000'}
            wireframe
            transparent={renderMode === 'solid+wireframe'}
            opacity={renderMode === 'solid+wireframe' ? 0.3 : 1.0}
          />
        </mesh>
      )}

      {/* Points */}
      {showPoints && (
        <points
          geometry={geometry}
          position={model.position || [0, 0, 0]}
          rotation={model.rotation || [0, 0, 0]}
          scale={model.scale || [1, 1, 1]}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <pointsMaterial color={color} size={0.002} sizeAttenuation />
        </points>
      )}

      {/* Edge lines */}
      {showEdgeLines && (
        <lineSegments
          geometry={edgesGeometry}
          position={model.position || [0, 0, 0]}
          rotation={model.rotation || [0, 0, 0]}
          scale={model.scale || [1, 1, 1]}
          renderOrder={transparent ? 4 : 1}
        >
          <lineBasicMaterial
            color={edgeColor}
            depthTest={renderMode !== 'hidden-edges'}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </group>
  );
}

// Memoize component - no custom comparison to allow store state changes to trigger re-renders
// (selectedModelId, hoveredModelId, enableSelection, enableHover from useViewerStore)
export default memo(STLModelComponent);
