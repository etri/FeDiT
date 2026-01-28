/**
 * @file SphereDomainRenderer.tsx
 * @description Renders a sphere-shaped domain
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { SphereDomain } from '../../types/domain.types';

interface SphereDomainRendererProps {
  domain: SphereDomain;
}

const SphereDomainRenderer: React.FC<SphereDomainRendererProps> = ({ domain }) => {
  const { dimensions, origin, display } = domain;

  // Calculate center position
  const position = useMemo(() => {
    return new THREE.Vector3(origin[0], origin[1], origin[2]);
  }, [origin]);

  // Create sphere geometry
  const sphereGeometry = useMemo(() => {
    return new THREE.SphereGeometry(
      dimensions.radius,
      32, // width segments
      16  // height segments
    );
  }, [dimensions.radius]);

  // Create edges geometry for wireframe
  const edgesGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(sphereGeometry, 30); // 30 degree threshold
  }, [sphereGeometry]);

  return (
    <group name="sphere-domain" position={position}>
      {/* Solid fill (optional) */}
      {!display.wireframe && (
        <mesh geometry={sphereGeometry}>
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
        <mesh geometry={sphereGeometry}>
          <meshBasicMaterial
            color={display.color}
            wireframe={true}
            transparent={true}
            opacity={display.opacity}
          />
        </mesh>
      )}

      {/* Edges for better visibility */}
      {!display.wireframe && (
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color="#000000" linewidth={1} />
        </lineSegments>
      )}

      {/* Axis rings for better orientation */}
      <group name="orientation-rings">
        {/* XY plane ring */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[dimensions.radius * 0.98, dimensions.radius, 64]} />
          <meshBasicMaterial
            color="#ff0000"
            transparent={true}
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* XZ plane ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[dimensions.radius * 0.98, dimensions.radius, 64]} />
          <meshBasicMaterial
            color="#00ff00"
            transparent={true}
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* YZ plane ring */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[dimensions.radius * 0.98, dimensions.radius, 64]} />
          <meshBasicMaterial
            color="#0000ff"
            transparent={true}
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Center point indicator */}
      <mesh>
        <sphereGeometry args={[dimensions.radius * 0.02, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

export default SphereDomainRenderer;