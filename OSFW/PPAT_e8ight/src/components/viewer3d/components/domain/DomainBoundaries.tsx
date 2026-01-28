/**
 * @file DomainBoundaries.tsx
 * @description Visualizes domain boundaries with different colors based on boundary type
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { Domain, BoxDomain, BoundaryType } from '../../types/domain.types';
import { useDomainStore } from '../../stores/domainStore';

interface DomainBoundariesProps {
  domain: Domain;
}

// Color mapping for different boundary types
const BOUNDARY_COLORS: Record<BoundaryType, string> = {
  wall: '#808080',
  inlet: '#0000ff',
  outlet: '#ff0000',
  symmetry: '#00ff00',
  periodic: '#ff00ff',
  empty: '#ffff00',
  patch: '#00ffff',
  processor: '#ff8800',
  atmosphere: '#88ff00',
  slip: '#ff0088',
};

const DomainBoundaries: React.FC<DomainBoundariesProps> = ({ domain }) => {
  const selectedBoundary = useDomainStore((state) => state.selectedBoundary);

  const boundaryFaces = useMemo(() => {
    if (domain.shape === 'box') {
      return renderBoxBoundaries(domain as BoxDomain, selectedBoundary);
    }
    // Add other domain types as needed
    return null;
  }, [domain, selectedBoundary]);

  return <group name="domain-boundaries">{boundaryFaces}</group>;
};

function renderBoxBoundaries(domain: BoxDomain, selectedBoundary: string | null) {
  const { dimensions, origin, boundaries } = domain;
  const faces = [];

  // Helper to create a face plane
  const createFace = (
    key: string,
    position: [number, number, number],
    rotation: [number, number, number],
    size: [number, number],
    boundaryConfig: typeof boundaries[keyof typeof boundaries]
  ) => {
    const isSelected = selectedBoundary === key;
    const color = BOUNDARY_COLORS[boundaryConfig.type] || '#ffffff';

    return (
      <group key={key} position={position} rotation={rotation}>
        {/* Face plane */}
        <mesh>
          <planeGeometry args={size} />
          <meshBasicMaterial
            color={color}
            transparent={true}
            opacity={isSelected ? 0.6 : 0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Face outline */}
        <lineLoop>
          <edgesGeometry args={[new THREE.PlaneGeometry(...size)]} />
          <lineBasicMaterial color={color} linewidth={isSelected ? 3 : 1} />
        </lineLoop>

        {/* Velocity vector for inlet boundaries */}
        {boundaryConfig.type === 'inlet' && boundaryConfig.velocity?.value && (
          <arrowHelper
            args={[
              new THREE.Vector3(...boundaryConfig.velocity.value).normalize(),
              new THREE.Vector3(0, 0, 0),
              Math.min(...size) * 0.3,
              0x0000ff,
              Math.min(...size) * 0.1,
              Math.min(...size) * 0.05,
            ]}
          />
        )}
      </group>
    );
  };

  // X-min face (left)
  faces.push(
    createFace(
      'xMin',
      [origin[0], origin[1] + dimensions.height / 2, origin[2] + dimensions.depth / 2],
      [0, Math.PI / 2, 0],
      [dimensions.depth, dimensions.height],
      boundaries.xMin
    )
  );

  // X-max face (right)
  faces.push(
    createFace(
      'xMax',
      [
        origin[0] + dimensions.width,
        origin[1] + dimensions.height / 2,
        origin[2] + dimensions.depth / 2,
      ],
      [0, -Math.PI / 2, 0],
      [dimensions.depth, dimensions.height],
      boundaries.xMax
    )
  );

  // Y-min face (bottom)
  faces.push(
    createFace(
      'yMin',
      [origin[0] + dimensions.width / 2, origin[1], origin[2] + dimensions.depth / 2],
      [-Math.PI / 2, 0, 0],
      [dimensions.width, dimensions.depth],
      boundaries.yMin
    )
  );

  // Y-max face (top)
  faces.push(
    createFace(
      'yMax',
      [
        origin[0] + dimensions.width / 2,
        origin[1] + dimensions.height,
        origin[2] + dimensions.depth / 2,
      ],
      [Math.PI / 2, 0, 0],
      [dimensions.width, dimensions.depth],
      boundaries.yMax
    )
  );

  // Z-min face (back)
  faces.push(
    createFace(
      'zMin',
      [origin[0] + dimensions.width / 2, origin[1] + dimensions.height / 2, origin[2]],
      [0, Math.PI, 0],
      [dimensions.width, dimensions.height],
      boundaries.zMin
    )
  );

  // Z-max face (front)
  faces.push(
    createFace(
      'zMax',
      [
        origin[0] + dimensions.width / 2,
        origin[1] + dimensions.height / 2,
        origin[2] + dimensions.depth,
      ],
      [0, 0, 0],
      [dimensions.width, dimensions.height],
      boundaries.zMax
    )
  );

  return faces;
}

export default DomainBoundaries;