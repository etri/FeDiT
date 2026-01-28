import { getMeshNameMapping } from '../../configs/meshConfig';
import { arrayBufferToBase64 } from './helpers';
import type { MeshFile } from './types';

// 타입 재수출
export type { MeshFile } from './types';

// 헬퍼 함수 재수출
export { arrayBufferToBase64 } from './helpers';

/**
 * Viewer에서 Mesh 파일 데이터 생성
 *
 * @param simulation 시뮬레이션 타입 (예: 'sedimentation_column')
 * @param solver 솔버 타입 (예: 'lbm', 'sph')
 * @returns Mesh 파일 배열 (Promise)
 */
export async function getMeshFiles(
  simulation: string,
  solver: string
): Promise<MeshFile[]> {
  const meshFiles: MeshFile[] = [];
  const nameMap = getMeshNameMapping(simulation, solver);

  // 매핑이 없으면 빈 배열 반환
  if (!nameMap) {
    console.warn(`No Mesh name mapping found for: ${simulation}.${solver}`);
    return meshFiles;
  }

  // Drei viewer의 getSTLData 함수 사용 (window 객체에 노출됨)
  const dreiGetSTLData = (window as any).dreiViewerGetSTLData;

  if (!dreiGetSTLData) {
    console.warn('Drei viewer getSTLData not available');
    return meshFiles;
  }

  try {
    console.log('[getMeshFiles] Using Drei viewer getSTLData');
    const { wallData, inletData, waterData, inletWallVtpData, tankS1Data, granuleOBCData } = await dreiGetSTLData();

    // 중복 방지를 위한 Set (파일명 추적)
    const addedFileNames = new Set<string>();

    // Helper function to add mesh file if not already added
    const addMeshFileIfNotExists = (fileName: string, data: ArrayBuffer) => {
      if (!addedFileNames.has(fileName)) {
        meshFiles.push({
          name: fileName,
          data: arrayBufferToBase64(data)
        });
        addedFileNames.add(fileName);
        console.log(`[getMeshFiles] Added mesh file: ${fileName}`);
      } else {
        console.log(`[getMeshFiles] Skipped duplicate file: ${fileName}`);
      }
    };

    // Name mapping에 따른 Mesh 파일들 처리 (wallData 사용)
    if (nameMap.tank && wallData) {
      addMeshFileIfNotExists(nameMap.tank, wallData);
    }
    if (nameMap.wall && wallData) {
      addMeshFileIfNotExists(nameMap.wall, wallData);
    }

    // Name mapping에 따른 Mesh 파일들 처리 (tankS1Data 사용 - Sedimentation Tank LBM)
    if (nameMap.dummy && tankS1Data) {
      addMeshFileIfNotExists(nameMap.dummy, tankS1Data);
      console.log('[getMeshFiles] Added tank_S1 data for dummy');
    } else if (nameMap.dummy && wallData) {
      // Fallback to wallData for other simulations
      addMeshFileIfNotExists(nameMap.dummy, wallData);
    }

    // Name mapping에 따른 Mesh 파일들 처리 (inletData 사용)
    if (nameMap.inlet && inletData) {
      addMeshFileIfNotExists(nameMap.inlet, inletData);
      console.log('[getMeshFiles] Added inlet_marker data for inlet');
    }

    // Name mapping에 따른 Mesh 파일들 처리 (inletWallVtpData 사용 - Sedimentation Tank LBM)
    if (nameMap.inlet_wall && inletWallVtpData) {
      addMeshFileIfNotExists(nameMap.inlet_wall, inletWallVtpData);
      console.log('[getMeshFiles] Added inlet_wall.vtp data for inlet_wall');
    } else if (nameMap.inlet_wall && inletData) {
      // Fallback to inletData for other simulations
      addMeshFileIfNotExists(nameMap.inlet_wall, inletData);
    }

    // Name mapping에 따른 Mesh 파일들 처리 (waterData 사용)
    if (nameMap.water && waterData) {
      addMeshFileIfNotExists(nameMap.water, waterData);
    }
    if (nameMap.free_surface && waterData) {
      addMeshFileIfNotExists(nameMap.free_surface, waterData);
    }

    // Name mapping에 따른 Mesh 파일들 처리 (granuleOBCData 사용 - Sedimentation Tank LBM)
    if (nameMap.granule && granuleOBCData) {
      addMeshFileIfNotExists(nameMap.granule, granuleOBCData);
      console.log('[getMeshFiles] Added granule_OBC_zone data for granule');
    } else if (nameMap.granule && waterData) {
      // Fallback to waterData for other simulations
      addMeshFileIfNotExists(nameMap.granule, waterData);
    }

    // Name mapping에 따른 Mesh 파일들 처리 (fluid - waterData 또는 granuleOBCData)
    // SPH의 경우 fluid와 granule이 같은 mesh (tank_OBC_box_D1L1)를 가리킬 수 있음
    if (nameMap.fluid && granuleOBCData) {
      addMeshFileIfNotExists(nameMap.fluid, granuleOBCData);
      console.log('[getMeshFiles] Added granule_OBC_zone data for fluid');
    } else if (nameMap.fluid && waterData) {
      addMeshFileIfNotExists(nameMap.fluid, waterData);
    }

    console.log('Mesh files prepared:', meshFiles.map(f => ({
      name: f.name,
      size: f.data.length
    })));
  } catch (error) {
    console.error('Mesh 데이터 수집 실패:', error);
    // 에러 발생해도 빈 배열 반환 (시뮬레이션 계속 진행 가능)
  }

  return meshFiles;
}

/**
 * 사용 예시:
 *
 * import { getMeshFiles } from '@/utils/mesh';
 *
 * // Mesh 파일 데이터 생성
 * const meshFiles = await getMeshFiles('sedimentation_column', 'lbm');
 * // 결과: [{ name: 'SC_sedi_dummy.stl', data: '...' }, ...]
 */