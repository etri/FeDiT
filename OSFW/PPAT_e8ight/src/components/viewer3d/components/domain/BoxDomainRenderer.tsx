/**
 * @file BoxDomainRenderer.tsx
 * @description Renders a box-shaped domain with wireframe and optional solid fill
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { BoxDomain } from '../../types/domain.types';

interface BoxDomainRendererProps {
  domain: BoxDomain;
}

const BoxDomainRenderer: React.FC<BoxDomainRendererProps> = ({ domain }) => {
  const { dimensions, origin, display } = domain;

  // Calculate center position
  const position = useMemo(() => {
    return new THREE.Vector3(
      origin[0] + dimensions.width / 2,
      origin[1] + dimensions.height / 2,
      origin[2] + dimensions.depth / 2
    );
  }, [origin, dimensions]);

  // Create box geometry
  const boxGeometry = useMemo(() => {
    return new THREE.BoxGeometry(
      dimensions.width,
      dimensions.height,
      dimensions.depth
    );
  }, [dimensions]);

  // Create edges geometry for wireframe
  const edgesGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(boxGeometry);
  }, [boxGeometry]);

  return (
    <group name="box-domain" position={position}>
      {/* Solid fill (optional) */}
      {!display.wireframe && (
        <mesh geometry={boxGeometry}>
          <meshBasicMaterial
            color={display.color}
            transparent={true}
            opacity={display.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Wireframe edges */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial
          color={display.wireframe ? display.color : '#000000'}
          linewidth={2}
        />
      </lineSegments>

      {/* Corner markers for better visibility */}
      {Array.from({ length: 8 }).map((_, index) => {
        const x = (index & 1) ? dimensions.width / 2 : -dimensions.width / 2;
        const y = (index & 2) ? dimensions.height / 2 : -dimensions.height / 2;
        const z = (index & 4) ? dimensions.depth / 2 : -dimensions.depth / 2;

        return (
          <mesh key={`corner-${index}`} position={[x, y, z]}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshBasicMaterial color={display.color} />
          </mesh>
        );
      })}
    </group>
  );
};

export default BoxDomainRenderer;