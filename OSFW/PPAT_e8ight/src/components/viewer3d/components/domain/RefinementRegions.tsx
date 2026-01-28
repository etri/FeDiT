/**
 * @file RefinementRegions.tsx
 * @description Visualizes mesh refinement regions in the domain
 */

import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { RefinementRegion } from '../../types/domain.types';
import { useDomainStore } from '../../stores/domainStore';

interface RefinementRegionsProps {
  regions: RefinementRegion[];
}

const RefinementRegions: React.FC<RefinementRegionsProps> = ({ regions }) => {
  const selectedRegion = useDomainStore((state) => state.selectedRefinementRegion);

  return (
    <group name="refinement-regions">
      {regions.map((region) => (
        <RefinementRegionRenderer
          key={region.id}
          region={region}
          isSelected={selectedRegion === region.id}
        />
      ))}
    </group>
  );
};

interface RefinementRegionRendererProps {
  region: RefinementRegion;
  isSelected: boolean;
}

const RefinementRegionRenderer: React.FC<RefinementRegionRendererProps> = ({
  region,
  isSelected,
}) => {
  const color = getLevelColor(region.level);
  const opacity = isSelected ? 0.5 : 0.2;

  const renderGeometry = () => {
    switch (region.shape) {
      case 'box':
        return renderBoxRegion(region, color, opacity);
      case 'cylinder':
        return renderCylinderRegion(region, color, opacity);
      case 'sphere':
        return renderSphereRegion(region, color, opacity);
      default:
        return null;
    }
  };

  return (
    <group name={`refinement-${region.id}`}>
      {renderGeometry()}

      {/* Label */}
      {isSelected && (
        <Html center>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontFamily: 'monospace',
              pointerEvents: 'none',
            }}
          >
            <div>{region.name}</div>
            <div style={{ color }}>Level: {region.level}</div>
          </div>
        </Html>
      )}
    </group>
  );
};

function renderBoxRegion(
  region: RefinementRegion,
  color: string,
  opacity: number
) {
  if (!region.min || !region.max) return null;

  const size = [
    region.max[0] - region.min[0],
    region.max[1] - region.min[1],
    region.max[2] - region.min[2],
  ];

  const position = [
    region.min[0] + size[0] / 2,
    region.min[1] + size[1] / 2,
    region.min[2] + size[2] / 2,
  ];

  return (
    <mesh position={position as [number, number, number]}>
      <boxGeometry args={size as [number, number, number]} />
      <meshBasicMaterial
        color={color}
        transparent={true}
        opacity={opacity}
        wireframe={true}
      />
    </mesh>
  );
}

function renderCylinderRegion(
  region: RefinementRegion,
  color: string,
  opacity: number
) {
  if (!region.point1 || !region.point2 || !region.radius) return null;

  // Calculate cylinder position and orientation
  const p1 = new THREE.Vector3(...region.point1);
  const p2 = new THREE.Vector3(...region.point2);
  const direction = new THREE.Vector3().subVectors(p2, p1);
  const height = direction.length();
  const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

  // Calculate rotation to align cylinder with direction
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize());

  return (
    <mesh position={center} quaternion={quaternion}>
      <cylinderGeometry args={[region.radius, region.radius, height, 16]} />
      <meshBasicMaterial
        color={color}
        transparent={true}
        opacity={opacity}
        wireframe={true}
      />
    </mesh>
  );
}

function renderSphereRegion(
  region: RefinementRegion,
  color: string,
  opacity: number
) {
  if (!region.center || !region.sphereRadius) return null;

  return (
    <mesh position={region.center}>
      <sphereGeometry args={[region.sphereRadius, 16, 16]} />
      <meshBasicMaterial
        color={color}
        transparent={true}
        opacity={opacity}
        wireframe={true}
      />
    </mesh>
  );
}

// Get color based on refinement level
function getLevelColor(level: number): string {
  const colors = [
    '#00ff00', // Level 0: Green
    '#ffff00', // Level 1: Yellow
    '#ff8800', // Level 2: Orange
    '#ff0000', // Level 3: Red
    '#ff00ff', // Level 4: Magenta
    '#8800ff', // Level 5+: Purple
  ];
  return colors[Math.min(level, colors.length - 1)];
}

export default RefinementRegions;