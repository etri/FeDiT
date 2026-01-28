/**
 * @file useModelLoader.ts
 * @description Hook for loading 3D models with React Three Fiber
 */

import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import type { BufferGeometry, Object3D } from 'three';

/**
 * Load STL file
 */
export function useSTLLoader(url: string): BufferGeometry {
  return useLoader(STLLoader, url);
}

/**
 * Load GLTF file
 */
export function useGLTFLoader(url: string): GLTF {
  return useLoader(GLTFLoader, url);
}

/**
 * Load OBJ file
 */
export function useOBJLoader(url: string): Object3D {
  return useLoader(OBJLoader, url);
}

/**
 * Load PLY file
 */
export function usePLYLoader(url: string): BufferGeometry {
  return useLoader(PLYLoader, url);
}

/**
 * Generic model loader based on file type
 */
export function useModelLoader(url: string, type: 'stl' | 'gltf' | 'obj' | 'ply') {
  switch (type) {
    case 'stl':
      return useSTLLoader(url);
    case 'gltf':
      return useGLTFLoader(url);
    case 'obj':
      return useOBJLoader(url);
    case 'ply':
      return usePLYLoader(url);
    default:
      throw new Error(`Unsupported model type: ${type}`);
  }
}

/**
 * Preload models (useful for performance)
 */
export function preloadSTL(url: string) {
  useLoader.preload(STLLoader, url);
}

export function preloadGLTF(url: string) {
  useLoader.preload(GLTFLoader, url);
}

export function preloadOBJ(url: string) {
  useLoader.preload(OBJLoader, url);
}

export function preloadPLY(url: string) {
  useLoader.preload(PLYLoader, url);
}
