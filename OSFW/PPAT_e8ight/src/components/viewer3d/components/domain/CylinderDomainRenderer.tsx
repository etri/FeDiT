/**
 * @file CylinderDomainRenderer.tsx
 * @description Renders a cylinder-shaped domain
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { CylinderDomain } from '../../types/domain.types';

interface CylinderDomainRendererProps {
  domain: CylinderDomain;
}

const CylinderDomainRenderer: React.FC<CylinderDomainRendererProps> = ({ domain }) => {
  const { dimensions, origin, display } = domain;

  // Calculate rotation based on axis
  const rotation = useMemo(() => {
    switch (dimensions.axis) {
      case 'x':
        return [0, 0, Math.PI / 2] as [number, number, number];
      case 'y':
        return [0, 0, 0] as [number, number, number]; // Default orientation
      case 'z':
        return [Math.PI / 2, 0, 0] as [number, number, number];
      default:
        return [0, 0, 0] as [number, number, number];
    }
  }, [dimensions.axis]);

  // Calculate center position
  const position = useMemo(() => {
    return new THREE.Vector3(
      origin[0],
      origin[1] + (dimensions.axis === 'y' ? dimensions.height / 2 : 0),
      origin[2]
    );
  }, [origin, dimensions]);

  // Create cylinder geometry
  const cylinderGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(
      dimensions.radius,
      dimensions.radius,
      dimensions.height,
      32, // radial segments
      1,  // height segments
      false // open ended
    );
  }, [dimensions]);

  // Create edges geometry for wireframe
  const edgesGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(cylinderGeometry, 30); // 30 degree threshold
  }, [cylinderGeometry]);

  return (
    <group name="cylinder-domain" position={position} rotation={rotation}>
      {/* Solid fill (optional) */}
      {!display.wireframe && (
        <mesh geometry={cylinderGeometry}>
          <meshBasicMaterial
            color={display.color}
            transparent={true}
            opacity={display.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Wireframe */}
      {display.wireframe && (
        <mesh geometry={cylinderGeometry}>
          <meshBasicMaterial
            color={display.color}
            wireframe={true}
            transparent={true}
            opacity={display.opacity}
          />
        </mesh>
      )}

      {/* Edges for better visibility */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color={display.wireframe ? display.color : '#000000'}
          linewidth={2}
        />
      </lineSegments>

      {/* Top cap indicator */}
      <mesh position={[0, dimensions.height / 2, 0]}>
        <ringGeometry args={[dimensions.radius * 0.9, dimensions.radius, 32]} />
        <meshBasicMaterial
          color="#00ff00"
          transparent={true}
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bottom cap indicator */}
      <mesh position={[0, -dimensions.height / 2, 0]}>
        <ringGeometry args={[dimensions.radius * 0.9, dimensions.radius, 32]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent={true}
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Axis indicator arrow */}
      <arrowHelper
        args={[
          new THREE.Vector3(0, 1, 0), // direction
          new THREE.Vector3(0, 0, 0), // origin
          dimensions.height * 0.3,    // length
          0xffff00,                    // color
          dimensions.height * 0.1,     // head length
          dimensions.height * 0.05     // head width
        ]}
      />
    </group>
  );
};

export default CylinderDomainRenderer;