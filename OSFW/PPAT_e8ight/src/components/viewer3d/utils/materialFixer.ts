/**
 * Fixes material issues related to UV coordinates and shader errors
 */

import * as THREE from 'three';

/**
 * Fix UV channel issues in materials
 * Ensures materials don't reference non-existent UV channels
 */
export function fixMaterialUVChannels(material: THREE.Material | THREE.Material[]): void {
  const materials = Array.isArray(material) ? material : [material];

  materials.forEach((mat) => {
    if (mat instanceof THREE.MeshStandardMaterial ||
        mat instanceof THREE.MeshBasicMaterial ||
        mat instanceof THREE.MeshPhongMaterial ||
        mat instanceof THREE.MeshLambertMaterial) {

      // Ensure map uses UV channel 0 (default)
      if (mat.map) {
        mat.map.channel = 0;
      }

      // Fix other texture maps
      if ('alphaMap' in mat && mat.alphaMap) {
        mat.alphaMap.channel = 0;
      }

      if ('normalMap' in mat && mat.normalMap) {
        mat.normalMap.channel = 0;
      }

      if ('roughnessMap' in mat && mat.roughnessMap) {
        mat.roughnessMap.channel = 0;
      }

      if ('metalnessMap' in mat && mat.metalnessMap) {
        mat.metalnessMap.channel = 0;
      }

      if ('emissiveMap' in mat && mat.emissiveMap) {
        mat.emissiveMap.channel = 0;
      }

      if ('aoMap' in mat && mat.aoMap) {
        // AO map typically uses UV2, but fallback to UV1 if not available
        mat.aoMap.channel = 1;
      }

      if ('lightMap' in mat && mat.lightMap) {
        // Light map typically uses UV2, but fallback to UV1 if not available
        mat.lightMap.channel = 1;
      }

      // Update material to ensure changes take effect
      mat.needsUpdate = true;
    }
  });
}

/**
 * Ensure geometry has required UV attributes
 */
export function ensureUVAttributes(geometry: THREE.BufferGeometry): void {
  // Ensure UV (uv1) exists
  if (!geometry.attributes.uv && geometry.attributes.uv1) {
    geometry.setAttribute('uv', geometry.attributes.uv1);
  }

  // Ensure UV2 exists for aoMap and lightMap
  if (!geometry.attributes.uv2 && geometry.attributes.uv) {
    // Clone UV1 to UV2 if UV2 doesn't exist
    geometry.setAttribute('uv2', geometry.attributes.uv.clone());
  }

  // Remove any UV channels beyond UV2 to prevent shader errors
  const uvChannels = ['uv3', 'uv4', 'uv5', 'uv6', 'uv7', 'uv8'];
  uvChannels.forEach(channel => {
    if (geometry.attributes[channel]) {
      geometry.deleteAttribute(channel);
    }
  });
}

/**
 * Create a safe fallback material
 */
export function createSafeMaterial(color: string | number = 0xcccccc): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    metalness: 0.1,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
}

/**
 * Fix all materials and geometries in a scene/object
 */
export function fixSceneMaterials(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Fix geometry UVs
      if (child.geometry) {
        ensureUVAttributes(child.geometry);
      }

      // Fix material UV channels
      if (child.material) {
        try {
          fixMaterialUVChannels(child.material);
        } catch (error) {
          console.warn('Failed to fix material, replacing with safe material:', error);
          // Replace with safe material if fixing fails
          child.material = createSafeMaterial();
        }
      }
    }
  });
}