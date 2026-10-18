/**
 * @file ConcentrationMarker.tsx
 * @description Component for visualizing concentration distribution point and width
 * Renders a point marker with radius indicator lines and transparent sphere
 */

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface ConcentrationMarkerProps {
  point: [number, number, number];
  width: number;
  color?: string;
  visible?: boolean;
}

const ConcentrationMarker: React.FC<ConcentrationMarkerProps> = ({
  point,
  width,
  color = '#ff0080',
  visible = true,
}) => {
  // Create sphere geometry for the marker
  const sphereGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.01, 16, 16);
  }, []);

  // Create sphere geometry for the width indicator
  const widthSphereGeometry = useMemo(() => {
    return new THREE.SphereGeometry(width, 32, 32);
  }, [width]);

  // Create circle geometries for radius indicators (3 planes)
  const circleGeometries = useMemo(() => {
    const segments = 64;
    return [
      // XY plane (Z = 0)
      new THREE.CircleGeometry(width, segments),
      // XZ plane (Y = 0)
      new THREE.CircleGeometry(width, segments),
      // YZ plane (X = 0)
      new THREE.CircleGeometry(width, segments),
    ];
  }, [width]);

  // Create radial lines as THREE.Line objects
  const radialLines = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
    });

    return Array.from({ length: 8 }).map((_, i) => {
      const angle = (i / 8) * Math.PI * 2;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(angle) * width,
          Math.sin(angle) * width,
          0
        ),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return new THREE.Line(geometry, material);
    });
  }, [width, color]);

  if (!visible) {
    return null;
  }

  return (
    <group name="concentration-marker" position={point}>
      {/* Main point marker */}
      <mesh geometry={sphereGeometry}>
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Transparent sphere showing width */}
      <mesh geometry={widthSphereGeometry}>
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Radius indicator circles on 3 planes */}
      {/* XY plane */}
      <mesh geometry={circleGeometries[0]} rotation={[0, 0, 0]}>
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* XZ plane */}
      <mesh geometry={circleGeometries[1]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* YZ plane */}
      <mesh geometry={circleGeometries[2]} rotation={[0, Math.PI / 2, 0]}>
        <meshBasicMaterial
          color={color}
          transparent={true}
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Radial lines for better visibility */}
      {radialLines.map((line, i) => (
        <primitive key={`radial-${i}`} object={line} />
      ))}
    </group>
  );
};

export default ConcentrationMarker;
