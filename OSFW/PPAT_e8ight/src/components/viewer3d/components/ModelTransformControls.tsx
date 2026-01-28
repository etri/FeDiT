import { useEffect, useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import { useViewerStore } from '../hooks/useViewerStore';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';

export function ModelTransformControls() {
  const {
    selectedModelId,
    models,
    transformMode,
    transformSpace,
    currentSimulation,
    updateModel,
    setIsTransforming,
  } = useViewerStore();

  const controlsRef = useRef<TransformControlsImpl>(null);
  const selectedModel = models.find((m) => m.id === selectedModelId);

  // Update controls when transform mode changes
  useEffect(() => {
    if (controlsRef.current && transformMode) {
      controlsRef.current.setMode(transformMode);
    }
  }, [transformMode]);

  // Mark transform controls to exclude from shadow calculations
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.traverse((object) => {
        object.userData.isTransformControl = true;
      });
    }
  }, []);

  // Update controls when transform space changes
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.setSpace(transformSpace);
    }
  }, [transformSpace]);

  // Listen for dragging events
  useEffect(() => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;

    const handleDraggingChanged = (event: any) => {
      console.log('[ModelTransformControls] dragging-changed:', event.value);
      setIsTransforming(event.value);
    };

    const handleMouseDown = () => {
      console.log('[ModelTransformControls] mousedown - setting isTransforming to true');
      setIsTransforming(true);
    };

    const handleMouseUp = () => {
      console.log('[ModelTransformControls] mouseup - setting isTransforming to false');
      setIsTransforming(false);
    };

    const handleObjectChange = () => {
      console.log('[ModelTransformControls] objectChange event');
    };

    controls.addEventListener('dragging-changed', handleDraggingChanged);
    controls.addEventListener('mouseDown', handleMouseDown);
    controls.addEventListener('mouseUp', handleMouseUp);
    controls.addEventListener('objectChange', handleObjectChange);

    return () => {
      controls.removeEventListener('dragging-changed', handleDraggingChanged);
      controls.removeEventListener('mouseDown', handleMouseDown);
      controls.removeEventListener('mouseUp', handleMouseUp);
      controls.removeEventListener('objectChange', handleObjectChange);
    };
  }, [setIsTransforming]);

  // Don't render if simulation is selected, no model is selected, or no transform mode
  if (currentSimulation || !selectedModel || !transformMode || !selectedModel.object) {
    return null;
  }

  const handleChange = () => {
    if (!controlsRef.current || !selectedModel.object) return;

    const object = selectedModel.object;

    // Get current transform from Three.js object
    const position: [number, number, number] = [
      object.position.x,
      object.position.y,
      object.position.z,
    ];

    const rotation: [number, number, number] = [
      object.rotation.x,
      object.rotation.y,
      object.rotation.z,
    ];

    const scale: [number, number, number] = [
      object.scale.x,
      object.scale.y,
      object.scale.z,
    ];

    // Update store with new transform
    updateModel(selectedModel.id, {
      position,
      rotation,
      scale,
    });
  };

  return (
    <TransformControls
      ref={controlsRef}
      object={selectedModel.object}
      mode={transformMode}
      space={transformSpace}
      onChange={handleChange}
      onMouseDown={() => {
        console.log('[ModelTransformControls] onMouseDown prop - setting isTransforming to true');
        setIsTransforming(true);
      }}
      onMouseUp={() => {
        console.log('[ModelTransformControls] onMouseUp prop - setting isTransforming to false');
        setIsTransforming(false);
      }}
      translationSnap={transformMode === 'translate' ? 0.1 : undefined}
      rotationSnap={transformMode === 'rotate' ? (Math.PI / 18) : undefined} // 10 degrees
      scaleSnap={transformMode === 'scale' ? 0.1 : undefined}
      showX
      showY
      showZ
      size={0.8}
    />
  );
}
