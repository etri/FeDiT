/**
 * @file AnalysisDomainBox.tsx
 * @description Lightweight component for visualizing analysis domain box
 * Renders a wireframe box based on domain min/max coordinates
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface AnalysisDomainBoxProps {
  min: [number, number, number];
  max: [number, number, number];
  color?: string;
  visible?: boolean;
}

const AnalysisDomainBox: React.FC<AnalysisDomainBoxProps> = ({
  min,
  max,
  color = '#2080ff',
  visible = true,
}) => {
  // Calculate dimensions
  const dimensions = useMemo(() => {
    return [
      max[0] - min[0],
      max[1] - min[1],
      max[2] - min[2],
    ] as [number, number, number];
  }, [min, max]);

  // Calculate center position
  const position = useMemo(() => {
    return new THREE.Vector3(
      min[0] + dimensions[0] / 2,
      min[1] + dimensions[1] / 2,
      min[2] + dimensions[2] / 2
    );
  }, [min, dimensions]);

  // Create box geometry
  const boxGeometry = useMemo(() => {
    return new THREE.BoxGeometry(dimensions[0], dimensions[1], dimensions[2]);
  }, [dimensions]);

  // Create edges geometry for wireframe
  const edgesGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(boxGeometry);
  }, [boxGeometry]);

  if (!visible) {
    return null;
  }

  return (
    <group name="analysis-domain-box" position={position}>
      {/* Wireframe edges */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>

      {/* Corner markers for better visibility */}
      {Array.from({ length: 8 }).map((_, index) => {
        const x = (index & 1) ? dimensions[0] / 2 : -dimensions[0] / 2;
        const y = (index & 2) ? dimensions[1] / 2 : -dimensions[1] / 2;
        const z = (index & 4) ? dimensions[2] / 2 : -dimensions[2] / 2;

        return (
          <mesh key={`corner-${index}`} position={[x, y, z]}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
};

export default AnalysisDomainBox;
