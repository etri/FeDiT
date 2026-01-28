/**
 * @file CustomDomainRenderer.tsx
 * @description Renders a custom domain from imported geometry
 */

import React, { Suspense } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CustomDomain } from '../../types/domain.types';

interface CustomDomainRendererProps {
  domain: CustomDomain;
}

const CustomDomainRenderer: React.FC<CustomDomainRendererProps> = ({ domain }) => {
  const { geometry, origin, display } = domain;

  const LoadedGeometry = () => {
    let loadedGeometry: THREE.BufferGeometry | THREE.Group | undefined;

    if (geometry.type === 'stl') {
      loadedGeometry = useLoader(STLLoader, geometry.url) as THREE.BufferGeometry;
    } else if (geometry.type === 'obj') {
      const obj = useLoader(OBJLoader, geometry.url);
      // Extract geometry from OBJ group
      const geometries: THREE.BufferGeometry[] = [];
      obj.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).geometry) {
          geometries.push((child as THREE.Mesh).geometry);
        }
      });
      if (geometries.length > 0) {
        // Merge geometries if multiple
        loadedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
      } else {
        loadedGeometry = new THREE.BufferGeometry();
      }
    } else {
      console.warn(`Unsupported geometry type: ${geometry.type}`);
      return null;
    }

    const isBufferGeometry = loadedGeometry instanceof THREE.BufferGeometry;

    if (isBufferGeometry) {
      return (
        <mesh
          geometry={loadedGeometry}
          position={origin}
          rotation={geometry.rotation}
          scale={geometry.scale}
        >
          <meshPhongMaterial
            color={display.color}
            transparent={true}
            opacity={display.opacity}
            wireframe={display.wireframe}
            side={THREE.DoubleSide}
            depthWrite={!display.wireframe}
          />
        </mesh>
      );
    } else if (loadedGeometry) {
      return (
        <primitive
          object={loadedGeometry}
          position={origin}
          rotation={geometry.rotation}
          scale={geometry.scale}
        />
      );
    }

    return null;
  };

  return (
    <group name="custom-domain">
      <Suspense fallback={<LoadingIndicator />}>
        <LoadedGeometry />
      </Suspense>

      {/* Bounding box visualization */}
      {display.showBoundaries && (
        <BoundingBoxHelper geometry={geometry} origin={origin} />
      )}
    </group>
  );
};

const LoadingIndicator: React.FC = () => {
  return (
    <mesh>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial color="gray" wireframe />
    </mesh>
  );
};

interface BoundingBoxHelperProps {
  geometry: CustomDomain['geometry'];
  origin: CustomDomain['origin'];
}

const BoundingBoxHelper: React.FC<BoundingBoxHelperProps> = ({ origin }) => {
  // This is a placeholder - actual implementation would calculate bbox from loaded geometry
  return (
    <mesh position={origin}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#ffff00" wireframe transparent opacity={0.3} />
    </mesh>
  );
};

export default CustomDomainRenderer;