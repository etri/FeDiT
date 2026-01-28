/**
 * Mesh 파일명 설정
 * simulation -> solver -> STL 파일명들의 매핑 관리
 */

/**
 * Mesh 파일명 계층 구조 매핑 타입
 * 시뮬레이션마다 다른 구조를 가질 수 있도록 유연하게 설계
 */
type MeshNameMapping = {
  [simulation: string]: ({
    [solver: string]: Record<string, string>;
  } & {
    default?: Record<string, string>;
  }) | undefined;
};

/**
 * simulation과 solver로 Mesh 파일명 매핑 반환
 * @param simulation 시뮬레이션 타입 (예: 'sedimentation_column')
 * @param solver 솔버 타입 (예: 'lbm', 'sph')
 * @returns Mesh 파일명 매핑 또는 undefined
 */
export function getMeshNameMapping(
  simulation: string,
  solver: string
): Record<string, string> | undefined {
  const simulationMap = MESH_NAME_MAP[simulation];
  if (!simulationMap) return undefined;

  // solver에 대한 매핑이 있으면 반환, 없으면 default 확인
  return simulationMap[solver] || simulationMap.default;
}

// <------- Configure Mesh name mappings below ------->

/**
 * Mesh 파일명 매핑 테이블 (계층 구조)
 * simulation -> solver -> Mesh 파일명들
 */
const MESH_NAME_MAP: MeshNameMapping = {
  sedimentation_column: {
    lbm: {
      dummy: 'SC_sedi_dummy.stl',
      free_surface: 'SC_sedi_free_surface.stl',
      granule: 'SC_sedi_granule.stl'
    },
    sph: {
      dummy: 'DEM_Cylinder_Sedimentation_Dummy_4.5mm.stl',
      fluid: 'DEM_Cylinder_Sedimentation_Fluid_4.5mm.stl'
    }
  },
  sedimentation_tank: {
    lbm:{
      dummy: 'tank_S1.stl',
      inlet_wall: 'inlet_wall.vtp',
      granule: 'granule_OBC_zone.stl',
      inlet: 'inlet_marker.stl'
    },
    sph: {
      dummy: 'tank_dummy_1023_s90.stl',
      fluid: 'tank_OBC_box_D1L1.stl',
      granule: 'tank_OBC_box_D1L1.stl',
      inlet: 'square_yz_1m_centered.stl'
    }
  },
  weir_overflow: {
    sph: {
      wall: 'Broad_weir_wall.stl',
      fluid: 'Broad_weir_fluid.stl',
      inlet: 'Inlet.stl'
    }
  }
};

// <-------------------------------------------------------->
