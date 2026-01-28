/**
 * @file CropBoundingBox.tsx
 * @description Bounding box visualization with TransformControls for crop area manipulation
 */

import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { useCropStore } from '../hooks/useCropStore';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';

export default function CropBoundingBox() {
  const { boxPosition, boxScale, setBoxTransform } = useCropStore();
  const boxRef = useRef<THREE.Mesh>(null);
  const controlsRef = useRef<TransformControlsImpl>(null);

  // Create edges geometry for wireframe
  const edgesGeometry = useMemo(() => {
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    return new THREE.EdgesGeometry(boxGeometry);
  }, []);

  // Update box position and scale when store changes
  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.position.set(boxPosition[0], boxPosition[1], boxPosition[2]);
      boxRef.current.scale.set(boxScale[0], boxScale[1], boxScale[2]);
    }
  }, [boxPosition, boxScale]);

  // Update TransformControls object when boxRef is ready
  useEffect(() => {
    if (controlsRef.current && boxRef.current) {
      controlsRef.current.attach(boxRef.current);
    }
  }, []);

  // Handle transform changes
  const handleChange = () => {
    if (!boxRef.current) return;

    const position: [number, number, number] = [
      boxRef.current.position.x,
      boxRef.current.position.y,
      boxRef.current.position.z,
    ];

    const scale: [number, number, number] = [
      boxRef.current.scale.x,
      boxRef.current.scale.y,
      boxRef.current.scale.z,
    ];

    setBoxTransform(position, scale);
  };

  // Don't render TransformControls until mesh is ready
  if (!boxRef.current) {
    return (
      <mesh ref={boxRef} position={boxPosition} scale={boxScale}>
        {/* Invisible box for TransformControls */}
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial visible={false} />
        
        {/* Wireframe box */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color="#00ff00" linewidth={2} transparent opacity={0.8} />
        </lineSegments>
      </mesh>
    );
  }

  return (
    <>
      <mesh ref={boxRef} position={boxPosition} scale={boxScale}>
        {/* Invisible box for TransformControls */}
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial visible={false} />
        
        {/* Wireframe box */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color="#00ff00" linewidth={2} transparent opacity={0.8} />
        </lineSegments>
      </mesh>
      
      <TransformControls
        ref={controlsRef}
        object={boxRef.current}
        mode="scale"
        space="world"
        onChange={handleChange}
        showX
        showY
        showZ
        size={0.8}
      />
    </>
  );
}
