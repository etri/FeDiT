/**
 * @file ImportCropBox.tsx
 * @description Crop bounding box with TransformControls supporting translate, rotate, and scale modes
 */

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useImportStore, type GizmoMode } from '../hooks/useImportStore';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';

interface ImportCropBoxProps {
  visible?: boolean;
}

export default function ImportCropBox({ visible = true }: ImportCropBoxProps) {
  const { 
    boxPosition, 
    boxRotation, 
    boxScale, 
    gizmoMode,
    cropEnabled,
    dialogReady,
    setBoxTransform 
  } = useImportStore();
  
  const { gl, size, camera } = useThree();
  const boxRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<TransformControlsImpl>(null);
  const isUpdatingFromStore = useRef(false);

  // Create edges geometry for wireframe visualization
  const edgesGeometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    return new THREE.EdgesGeometry(boxGeometry);
  }, []);

  // Update box transform when store changes (without detach/attach to prevent interruption)
  useEffect(() => {
    if (!boxRef.current || !controlsRef.current) return;

    // Check if values actually changed to avoid unnecessary updates
    const currentPos = boxRef.current.position;
    const currentRot = boxRef.current.rotation;
    const currentScale = boxRef.current.scale;
    
    const posChanged = 
      Math.abs(currentPos.x - boxPosition[0]) > 0.0001 ||
      Math.abs(currentPos.y - boxPosition[1]) > 0.0001 ||
      Math.abs(currentPos.z - boxPosition[2]) > 0.0001;
    
    const rotChanged = 
      Math.abs(currentRot.x - boxRotation[0]) > 0.0001 ||
      Math.abs(currentRot.y - boxRotation[1]) > 0.0001 ||
      Math.abs(currentRot.z - boxRotation[2]) > 0.0001;
    
    const scaleChanged = 
      Math.abs(currentScale.x - boxScale[0]) > 0.0001 ||
      Math.abs(currentScale.y - boxScale[1]) > 0.0001 ||
      Math.abs(currentScale.z - boxScale[2]) > 0.0001;
    
    if (!posChanged && !rotChanged && !scaleChanged) {
      return; // No change needed
    }
    
    // Set flag to prevent onChange from triggering during store update
    isUpdatingFromStore.current = true;
    
    // Update mesh transform directly (TransformControls will follow)
    boxRef.current.position.set(boxPosition[0], boxPosition[1], boxPosition[2]);
    boxRef.current.rotation.set(boxRotation[0], boxRotation[1], boxRotation[2]);
    boxRef.current.scale.set(boxScale[0], boxScale[1], boxScale[2]);
    
    // Update TransformControls to reflect the new position
    controlsRef.current.updateMatrixWorld();
    
    // Reset flag after a microtask to allow any pending onChange to complete
    Promise.resolve().then(() => {
      isUpdatingFromStore.current = false;
    });
  }, [boxPosition, boxRotation, boxScale]);

  // Update gizmo mode when changed
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.setMode(gizmoMode);
    }
  }, [gizmoMode]);

  // Listen for TransformControls dragging events to disable OrbitControls
  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    const handleDraggingChanged = (event: any) => {
      // Find OrbitControls in the scene and disable/enable it
      if (boxRef.current) {
        const scene = boxRef.current.parent;
        if (scene) {
          scene.traverse((object: any) => {
            if (object.type === 'OrbitControls' || object.isOrbitControls) {
              object.enabled = !event.value;
            }
          });
        }
      }
    };

    controls.addEventListener('dragging-changed', handleDraggingChanged);

    return () => {
      controls.removeEventListener('dragging-changed', handleDraggingChanged);
    };
  }, []);

  // Ensure canvas size is correct before attaching TransformControls
  useEffect(() => {
    if (gl && size) {
      // Force canvas to update its size
      gl.setSize(size.width, size.height, false);
      
      // Update camera aspect ratio if PerspectiveCamera
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
      }
    }
  }, [gl, size.width, size.height, camera]);

  // Track if controls have been attached - persists across re-renders
  const hasAttachedRef = useRef(false);

  // Attach TransformControls to mesh only ONCE when dialogReady becomes true
  // Using empty dependency array with refs to prevent re-execution
  useEffect(() => {
    // Only run when dialogReady is true and not already attached
    if (!dialogReady || hasAttachedRef.current) return;
    if (!controlsRef.current || !boxRef.current || !gl) return;
    
    // Mark as attached BEFORE async operations
    hasAttachedRef.current = true;
    
    // Use requestAnimationFrame to ensure canvas is fully initialized
    const attachControls = () => {
      if (!controlsRef.current || !boxRef.current || !gl) return;
      
      // Ensure canvas size is correct
      gl.setSize(size.width, size.height, false);
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = size.width / size.height;
        camera.updateProjectionMatrix();
      }
      
      controlsRef.current.attach(boxRef.current);
      
      // Force TransformControls to update its internal state
      controlsRef.current.updateMatrixWorld();
    };
    
    // Wait for next frame to ensure canvas is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(attachControls);
    });
    
    // NO cleanup that resets hasAttachedRef - it persists until component unmounts
  }, [dialogReady]); // ONLY depend on dialogReady - other refs are stable
  
  // Separate cleanup effect for component unmount only
  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.detach();
      }
      hasAttachedRef.current = false;
    };
  }, []); // Empty dependency - runs only on unmount

  // Handle transform changes from gizmo
  const handleChange = () => {
    // Ignore onChange if we're updating from store to prevent infinite loop
    if (isUpdatingFromStore.current || !boxRef.current) return;

    const position: [number, number, number] = [
      boxRef.current.position.x,
      boxRef.current.position.y,
      boxRef.current.position.z,
    ];

    const rotation: [number, number, number] = [
      boxRef.current.rotation.x,
      boxRef.current.rotation.y,
      boxRef.current.rotation.z,
    ];

    const scale: [number, number, number] = [
      Math.abs(boxRef.current.scale.x),
      Math.abs(boxRef.current.scale.y),
      Math.abs(boxRef.current.scale.z),
    ];

    // Check if values actually changed compared to store to prevent unnecessary updates
    const posChanged = 
      Math.abs(position[0] - boxPosition[0]) > 0.0001 ||
      Math.abs(position[1] - boxPosition[1]) > 0.0001 ||
      Math.abs(position[2] - boxPosition[2]) > 0.0001;
    
    const rotChanged = 
      Math.abs(rotation[0] - boxRotation[0]) > 0.0001 ||
      Math.abs(rotation[1] - boxRotation[1]) > 0.0001 ||
      Math.abs(rotation[2] - boxRotation[2]) > 0.0001;
    
    const scaleChanged = 
      Math.abs(scale[0] - boxScale[0]) > 0.0001 ||
      Math.abs(scale[1] - boxScale[1]) > 0.0001 ||
      Math.abs(scale[2] - boxScale[2]) > 0.0001;

    // Only update store if values actually changed
    if (!posChanged && !rotChanged && !scaleChanged) {
      return;
    }

    setBoxTransform(position, rotation, scale);
  };

  // Don't render if crop is disabled
  if (!cropEnabled || !visible) {
    return null;
  }

  // Initialize mesh position on first render
  useEffect(() => {
    if (boxRef.current && !isUpdatingFromStore.current) {
      boxRef.current.position.set(boxPosition[0], boxPosition[1], boxPosition[2]);
      boxRef.current.rotation.set(boxRotation[0], boxRotation[1], boxRotation[2]);
      boxRef.current.scale.set(boxScale[0], boxScale[1], boxScale[2]);
    }
  }, []); // Only run once on mount

  // Two-phase rendering: first render mesh only, then render TransformControls
  // This ensures boxRef.current is available when TransformControls is rendered
  if (!boxRef.current) {
    return (
      <mesh 
        ref={boxRef}
      >
        {/* Invisible box for TransformControls interaction */}
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial visible={false} />
        
        {/* Green wireframe visualization */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial 
            color="#00ff00" 
            linewidth={2} 
            transparent 
            opacity={0.8} 
          />
        </lineSegments>

        {/* Semi-transparent fill */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial 
            color="#00ff00" 
            transparent 
            opacity={0.1} 
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </mesh>
    );
  }

  return (
    <>
      {/* Crop box mesh - don't use position prop to avoid React Three Fiber transform conflicts */}
      <mesh 
        ref={boxRef}
      >
        {/* Invisible box for TransformControls interaction */}
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial visible={false} />
        
        {/* Green wireframe visualization */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial 
            color="#00ff00" 
            linewidth={2} 
            transparent 
            opacity={0.8} 
          />
        </lineSegments>

        {/* Semi-transparent fill */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial 
            color="#00ff00" 
            transparent 
            opacity={0.1} 
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </mesh>
      
      {/* Transform controls (gizmo) - explicitly pass camera and domElement */}
      <TransformControls
        ref={controlsRef}
        object={boxRef.current}
        mode={gizmoMode}
        space="world"
        camera={camera}
        domElement={gl.domElement}
        onChange={handleChange}
        showX
        showY
        showZ
        size={0.8}
        translationSnap={gizmoMode === 'translate' ? 0.1 : undefined}
        rotationSnap={gizmoMode === 'rotate' ? Math.PI / 18 : undefined} // 10 degrees
        scaleSnap={gizmoMode === 'scale' ? 0.1 : undefined}
      />
    </>
  );
}

// Re-export types for convenience
export type { GizmoMode };
