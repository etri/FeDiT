/**
 * @file useExportSTL.ts
 * @description Hook for exporting STL files from the drei viewer
 */

import { useThree } from '@react-three/fiber';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import * as THREE from 'three';
import { useViewerStore } from './useViewerStore';

export function useExportSTL() {
  const { scene } = useThree();
  const tankType = useViewerStore((state) => state.tankType);

  /**
   * Export all meshes in the scene to STL files
   */
  const exportToSTL = () => {
    const meshes: THREE.Mesh[] = [];

    // Collect all meshes from the scene
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Filter out helpers, grids, and other non-exportable objects
        const name = object.name?.toLowerCase() || '';
        if (
          !name.includes('helper') &&
          !name.includes('grid') &&
          !name.includes('gizmo') &&
          !object.userData?.isHelper &&
          !object.userData?.isGrid &&
          object.visible
        ) {
          meshes.push(object);
        }
      }
    });

    if (meshes.length === 0) {
      console.warn('No meshes to export');
      return;
    }

    console.log(`Exporting ${meshes.length} meshes to STL`);

    const exporter = new STLExporter();

    // Export each mesh separately
    meshes.forEach((mesh) => {
      try {
        // Generate binary STL
        const stlBinary = exporter.parse(mesh, { binary: true });

        // Create blob and download
        const blob = new Blob([stlBinary.buffer as ArrayBuffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${mesh.name || 'mesh'}.stl`;
        link.click();
        URL.revokeObjectURL(url);

        console.log(`Exported: ${mesh.name || 'mesh'}.stl`);
      } catch (error) {
        console.error(`Failed to export mesh ${mesh.name}:`, error);
      }
    });

    console.log('STL export completed');
  };

  /**
   * Export all meshes as a single combined STL file
   */
  const exportCombinedSTL = (filename: string = 'combined.stl') => {
    const meshes: THREE.Mesh[] = [];

    // Collect all meshes from the scene
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const name = object.name?.toLowerCase() || '';
        if (
          !name.includes('helper') &&
          !name.includes('grid') &&
          !name.includes('gizmo') &&
          !object.userData?.isHelper &&
          !object.userData?.isGrid &&
          object.visible
        ) {
          meshes.push(object);
        }
      }
    });

    if (meshes.length === 0) {
      console.warn('No meshes to export');
      return;
    }

    console.log(`Exporting ${meshes.length} meshes as combined STL`);

    // Create a group to combine all meshes
    const group = new THREE.Group();
    meshes.forEach((mesh) => {
      // Clone the mesh to avoid modifying the scene
      const clone = mesh.clone();
      clone.updateMatrixWorld(true);
      group.add(clone);
    });

    try {
      const exporter = new STLExporter();
      const stlBinary = exporter.parse(group, { binary: true });

      // Create blob and download
      const blob = new Blob([stlBinary.buffer as ArrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      console.log(`Exported: ${filename}`);
    } catch (error) {
      console.error('Failed to export combined STL:', error);
    }

    // Clean up
    group.clear();
  };

  /**
   * Get STL data as ArrayBuffers (for API submission)
   * Returns each mesh separately by category (wall, inlet, water, etc.)
   * Prioritizes _temp meshes for water/fluid to use original geometry
   * Also includes inlet_wall.vtp data if available
   * For Sedimentation Tank LBM: tank_S1 and granule_OBC_zone are returned separately
   */
  const getSTLData = async (): Promise<{
    wallData: ArrayBuffer | null;
    inletData: ArrayBuffer | null;
    waterData: ArrayBuffer | null;
    inletWallVtpData: ArrayBuffer | null;
    tankS1Data: ArrayBuffer | null;
    granuleOBCData: ArrayBuffer | null;
  }> => {
    const wallMeshes: THREE.Mesh[] = [];
    const inletMeshes: THREE.Mesh[] = [];
    const waterMeshes: THREE.Mesh[] = [];
    const waterTempMeshes: THREE.Mesh[] = [];
    const tankS1Meshes: THREE.Mesh[] = [];
    const granuleOBCMeshes: THREE.Mesh[] = [];

    // Collect and categorize meshes from the scene
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const name = object.name?.toLowerCase() || '';

        // Skip helpers, grids, and gizmos
        if (
          name.includes('helper') ||
          name.includes('grid') ||
          name.includes('gizmo') ||
          object.userData?.isHelper ||
          object.userData?.isGrid
        ) {
          return;
        }

        // Categorize based on naming conventions
        // Sedimentation Tank LBM specific meshes (priority)
        if (name === 'tank_s1') {
          tankS1Meshes.push(object);
        }
        else if (name === 'granule_obc_zone' || name === 'tank_obc_box_d1l1') {
          // Both LBM and SPH granule/OBC meshes
          granuleOBCMeshes.push(object);
        }
        // Inlet meshes (both LBM and SPH)
        else if (name.includes('inlet') || name === 'square_yz_1m_centered') {
          inletMeshes.push(object);
        }
        // Wall/Tank meshes: contain tank, wall, dummy, weir (but not inlet or tank_s1)
        else if (
          name.includes('_tank') ||
          name.includes('_wall') ||
          name.includes('_dummy') ||
          name.includes('broad_weir_wall')
        ) {
          wallMeshes.push(object);
        }
        // Water/Fluid temp meshes (original geometry for export)
        else if (
          name.includes('_water_temp') ||
          name.includes('_fluid_temp')
        ) {
          waterTempMeshes.push(object);
        }
        // Water/Fluid meshes: contain water, fluid (excluding temp)
        else if (
          name.includes('_water') ||
          name.includes('_fluid') ||
          name.includes('broad_weir_fluid')
        ) {
          waterMeshes.push(object);
        }
      }
    });

    console.log(`[getSTLData] Found ${wallMeshes.length} wall meshes, ${inletMeshes.length} inlet meshes, ${waterMeshes.length} water meshes, ${waterTempMeshes.length} water temp meshes, ${tankS1Meshes.length} tank_S1 meshes, ${granuleOBCMeshes.length} granule_OBC meshes`);

    // Debug: Log mesh names
    if (wallMeshes.length > 0) {
      console.log(`[getSTLData] Wall mesh names:`, wallMeshes.map(m => m.name));
    }
    if (inletMeshes.length > 0) {
      console.log(`[getSTLData] Inlet mesh names:`, inletMeshes.map(m => m.name));
    }
    if (waterTempMeshes.length > 0) {
      console.log(`[getSTLData] Water temp mesh names:`, waterTempMeshes.map(m => m.name));
    }
    if (waterMeshes.length > 0) {
      console.log(`[getSTLData] Water mesh names:`, waterMeshes.map(m => m.name));
    }
    if (tankS1Meshes.length > 0) {
      console.log(`[getSTLData] tank_S1 mesh names:`, tankS1Meshes.map(m => m.name));
    }
    if (granuleOBCMeshes.length > 0) {
      console.log(`[getSTLData] granule_OBC mesh names:`, granuleOBCMeshes.map(m => m.name));
    }

    let wallData: ArrayBuffer | null = null;
    let inletData: ArrayBuffer | null = null;
    let waterData: ArrayBuffer | null = null;
    let tankS1Data: ArrayBuffer | null = null;
    let granuleOBCData: ArrayBuffer | null = null;

    const exporter = new STLExporter();

    // Helper function to convert STL binary to ArrayBuffer
    const convertToArrayBuffer = (stlBinary: any): ArrayBuffer => {
      if (stlBinary instanceof DataView) {
        const dataView = stlBinary as DataView;
        const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        return bytes.slice().buffer as unknown as ArrayBuffer;
      } else if (stlBinary instanceof ArrayBuffer) {
        return stlBinary;
      } else {
        const buffer = stlBinary.buffer || stlBinary;
        return buffer instanceof ArrayBuffer ? buffer : new ArrayBuffer(0);
      }
    };

    // Export wall meshes as combined binary STL
    if (wallMeshes.length > 0) {
      try {
        const group = new THREE.Group();
        wallMeshes.forEach((mesh) => {
          const clone = mesh.clone();
          clone.updateMatrixWorld(true);
          group.add(clone);
        });

        const stlBinary = exporter.parse(group, { binary: true });
        wallData = convertToArrayBuffer(stlBinary);
        group.clear();
        console.log(`[getSTLData] Wall data: ${wallData ? (wallData.byteLength / 1024).toFixed(2) + ' KB' : 'null'}`);
      } catch (error) {
        console.error('[getSTLData] Failed to export wall data:', error);
      }
    } else {
      console.warn('[getSTLData] No wall meshes found in scene');
    }

    // Export inlet meshes as combined binary STL
    if (inletMeshes.length > 0) {
      try {
        const group = new THREE.Group();
        inletMeshes.forEach((mesh) => {
          const clone = mesh.clone();

          // Handle inlet marker position for export
          if (mesh.name === 'inlet_marker' || mesh.name === 'square_yz_1m_centered') {
            if (tankType === 'sedimentation_tank_lbm' || tankType === 'sedimentation_tank_sph') {
              // For Sedimentation Tank LBM/SPH, apply world transformations to geometry
              // This bakes the position offset into the mesh geometry
              clone.updateMatrixWorld(true);
              clone.geometry = clone.geometry.clone();
              clone.geometry.applyMatrix4(clone.matrixWorld);
              clone.position.set(0, 0, 0);
              clone.rotation.set(0, 0, 0);
              clone.scale.set(1, 1, 1);
              clone.updateMatrix();
              const typeLabel = tankType === 'sedimentation_tank_lbm' ? 'LBM' : 'SPH';
              console.log(`[getSTLData] Applied world transformations to "${mesh.name}" geometry for ${typeLabel} (position baked in)`);
            } else {
              // For other tank types, reset position to origin
              clone.position.set(0, 0, 0);
              console.log(`[getSTLData] Reset position to [0, 0, 0] for "${mesh.name}" export`);
            }
          }

          clone.updateMatrixWorld(true);
          group.add(clone);
        });

        const stlBinary = exporter.parse(group, { binary: true });
        inletData = convertToArrayBuffer(stlBinary);
        group.clear();
        console.log(`[getSTLData] Inlet data: ${inletData ? (inletData.byteLength / 1024).toFixed(2) + ' KB' : 'null'}`);
      } catch (error) {
        console.error('[getSTLData] Failed to export inlet data:', error);
      }
    } else {
      console.warn('[getSTLData] No inlet meshes found in scene');
    }

    // Export water meshes as combined binary STL
    // Only use temp meshes for Sedimentation Column (tankType: 'lbm' or 'sph')
    const isSedimentationColumn = tankType === 'lbm' || tankType === 'sph';
    const meshesToExport = (isSedimentationColumn && waterTempMeshes.length > 0) ? waterTempMeshes : waterMeshes;

    if (meshesToExport.length > 0) {
      try {
        const group = new THREE.Group();
        meshesToExport.forEach((mesh) => {
          const clone = mesh.clone();
          clone.updateMatrixWorld(true);
          group.add(clone);
        });

        const stlBinary = exporter.parse(group, { binary: true });
        waterData = convertToArrayBuffer(stlBinary);
        group.clear();

        const sourceType = (isSedimentationColumn && waterTempMeshes.length > 0)
          ? 'temp (original geometry)'
          : 'display (modified geometry)';
        console.log(`[getSTLData] Water data from ${sourceType}: ${waterData ? (waterData.byteLength / 1024).toFixed(2) + ' KB' : 'null'}`);
      } catch (error) {
        console.error('[getSTLData] Failed to export water data:', error);
      }
    } else {
      console.warn('[getSTLData] No water meshes found in scene');
    }

    // Export tank_S1 meshes as binary STL (for Sedimentation Tank LBM)
    if (tankS1Meshes.length > 0) {
      try {
        const group = new THREE.Group();
        tankS1Meshes.forEach((mesh) => {
          const clone = mesh.clone();
          clone.updateMatrixWorld(true);
          group.add(clone);
        });

        const stlBinary = exporter.parse(group, { binary: true });
        tankS1Data = convertToArrayBuffer(stlBinary);
        group.clear();
        console.log(`[getSTLData] tank_S1 data: ${tankS1Data ? (tankS1Data.byteLength / 1024).toFixed(2) + ' KB' : 'null'}`);
      } catch (error) {
        console.error('[getSTLData] Failed to export tank_S1 data:', error);
      }
    } else {
      console.warn('[getSTLData] No tank_S1 meshes found in scene');
    }

    // Export granule_OBC_zone meshes as binary STL (for Sedimentation Tank LBM/SPH)
    if (granuleOBCMeshes.length > 0) {
      try {
        const group = new THREE.Group();
        granuleOBCMeshes.forEach((mesh) => {
          const clone = mesh.clone();

          // For SPH Sedimentation Tank, apply world transformations to geometry
          // This bakes the position offset into the mesh geometry
          if (tankType === 'sedimentation_tank_sph' && mesh.name === 'tank_obc_box_d1l1') {
            clone.updateMatrixWorld(true);
            clone.geometry = clone.geometry.clone();
            clone.geometry.applyMatrix4(clone.matrixWorld);
            clone.position.set(0, 0, 0);
            clone.rotation.set(0, 0, 0);
            clone.scale.set(1, 1, 1);
            clone.updateMatrix();
            console.log(`[getSTLData] Applied world transformations to "${mesh.name}" geometry for SPH (position baked in)`);
          } else {
            clone.updateMatrixWorld(true);
          }

          group.add(clone);
        });

        const stlBinary = exporter.parse(group, { binary: true });
        granuleOBCData = convertToArrayBuffer(stlBinary);
        group.clear();
        console.log(`[getSTLData] granule_OBC_zone data: ${granuleOBCData ? (granuleOBCData.byteLength / 1024).toFixed(2) + ' KB' : 'null'}`);
      } catch (error) {
        console.error('[getSTLData] Failed to export granule_OBC_zone data:', error);
      }
    } else {
      console.warn('[getSTLData] No granule_OBC_zone meshes found in scene');
    }

    // Get inlet_wall.vtp data if available (for LBM sedimentation tank)
    let inletWallVtpData: ArrayBuffer | null = null;
    if (typeof (window as any).getInletWallVtpData === 'function') {
      inletWallVtpData = (window as any).getInletWallVtpData();
      if (inletWallVtpData) {
        console.log(`[getSTLData] inlet_wall.vtp data: ${(inletWallVtpData.byteLength / 1024).toFixed(2)} KB`);
      }
    }

    return { wallData, inletData, waterData, inletWallVtpData, tankS1Data, granuleOBCData };
  };

  /**
   * Export a specific mesh by name to STL file
   */
  const exportSpecificMesh = (meshName: string) => {
    let targetMesh: THREE.Mesh | null = null;

    // Find the mesh by name
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.name === meshName) {
        targetMesh = object;
      }
    });

    if (!targetMesh) {
      console.warn(`Mesh "${meshName}" not found in scene`);
      return;
    }

    console.log(`[exportSpecificMesh] Found mesh "${meshName}"`);
    console.log(`[exportSpecificMesh] Geometry vertices:`, (targetMesh as THREE.Mesh).geometry.attributes.position.count);

    try {
      const exporter = new STLExporter();

      // Clone the mesh to reset position for inlet_marker/square_yz_1m_centered
      const meshToExport = (targetMesh as THREE.Mesh).clone();

      // Reset position to origin for inlet markers (they have offset to prevent z-fighting in viewer)
      if (meshName === 'inlet_marker' || meshName === 'square_yz_1m_centered') {
        meshToExport.position.set(0, 0, 0);
        meshToExport.updateMatrixWorld(true);
        console.log(`[exportSpecificMesh] Reset position to [0, 0, 0] for "${meshName}" export`);
      }

      // Generate binary STL
      const stlBinary = exporter.parse(meshToExport, { binary: true });

      console.log(`[exportSpecificMesh] STL binary type:`, stlBinary.constructor.name);
      console.log(`[exportSpecificMesh] STL binary:`, stlBinary);

      // Handle DataView (returned by STLExporter with binary: true)
      let arrayBuffer: ArrayBuffer;
      if ((stlBinary as any) instanceof DataView) {
        const dataView = stlBinary as DataView;
        // Convert DataView to ArrayBuffer by copying bytes
        const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
        arrayBuffer = bytes.slice().buffer as unknown as ArrayBuffer;
      } else if ((stlBinary as any) instanceof ArrayBuffer) {
        arrayBuffer = stlBinary as unknown as ArrayBuffer;
      } else {
        // @ts-ignore - handle unknown type
        const buffer = (stlBinary as any).buffer || stlBinary;
        arrayBuffer = buffer instanceof ArrayBuffer ? buffer : new ArrayBuffer(0);
      }

      console.log(`[exportSpecificMesh] ArrayBuffer size:`, arrayBuffer.byteLength, 'bytes');

      if (arrayBuffer.byteLength === 0) {
        console.error(`[exportSpecificMesh] Empty ArrayBuffer - export failed`);
        return;
      }

      // Create blob and download
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${meshName}_modified.stl`;
      link.click();
      URL.revokeObjectURL(url);

      console.log(`[exportSpecificMesh] Exported: ${meshName}_modified.stl (${(arrayBuffer.byteLength / 1024).toFixed(2)} KB)`);
    } catch (error) {
      console.error(`Failed to export mesh ${meshName}:`, error);
    }
  };

  return {
    exportToSTL,
    exportCombinedSTL,
    getSTLData,
    exportSpecificMesh,
  };
}
