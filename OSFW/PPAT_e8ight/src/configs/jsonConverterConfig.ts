/**
 * JSON 변환기 설정
 * simulation -> solver -> converter function의 매핑 관리
 */

import type { ConverterFunction } from '../utils/json/types';

// <------- Import converter functions below ------->

import { convertConcentrationDiffusionLBM } from '../utils/json/converters/concentration-diffusion/concentrationDiffusionLBMConverter';

// <-------------------------------------------------------->

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
 * @param simulation 시뮬레이션 타입 (예: 'concentration_diffusion')
 * @param solver 솔버 타입 (예: 'lbm')
 * @returns 해당하는 변환 함수 또는 undefined
 */
export function getConverter(
  simulation: string,
  solver: string
): ConverterFunction | undefined {
  const simulationConverters = JSON_CONVERTER_MAP[simulation];
  if (!simulationConverters) return undefined;

  // solver에 대한 변환기가 있으면 반환, 없으면 default 확인
  return simulationConverters[solver] || simulationConverters.default;
}

// <------- Configure converter mappings below ------->

/**
 * 변환기 매핑 테이블 (계층 구조)
 * simulation -> solver -> converter function
 */
const JSON_CONVERTER_MAP: ConverterMapping = {
  concentration_diffusion: {
    lbm: convertConcentrationDiffusionLBM,
    default: convertConcentrationDiffusionLBM,
  },
};

// <-------------------------------------------------------->
