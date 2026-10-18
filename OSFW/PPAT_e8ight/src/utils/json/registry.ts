import type { ConverterFunction } from './types';

/**
 * 변환기 계층 구조 매핑 타입
 * 시뮬레이션마다 다른 솔버별 변환기를 가질 수 있도록 유연하게 설계
 */
type ConverterMapping = {
  [simulation: string]: ({
    [solver: string]: ConverterFunction;
  } & {
    default?: ConverterFunction;
  }) | undefined;
};

/**
 * simulation과 solver로 변환기 반환
 * @param simulation 시뮬레이션 타입 (예: 'sedimentation_column')
 * @param solver 솔버 타입 (예: 'lbm', 'sph')
 * @returns 해당하는 변환 함수 또는 undefined
 */
export function getConverter(
  simulation: string,
  solver: string
): ConverterFunction | undefined {
  const simulationConverters = CONVERTER_MAP[simulation];
  if (!simulationConverters) return undefined;

  // solver에 대한 변환기가 있으면 반환, 없으면 default 확인
  return simulationConverters[solver] || simulationConverters.default;
}

// <------- Configure converter mappings below ------->

/**
 * 변환기 매핑 테이블 (계층 구조)
 * simulation -> solver -> converter function
 */
const CONVERTER_MAP: ConverterMapping = {
  concentration_diffusion: {
    lbm: require('./converters/concentration-diffusion/concentrationDiffusionLBMConverter').convertConcentrationDiffusionLBM,
    default: require('./converters/concentration-diffusion/concentrationDiffusionLBMConverter').convertConcentrationDiffusionLBM,
  },
};

// <-------------------------------------------------------->