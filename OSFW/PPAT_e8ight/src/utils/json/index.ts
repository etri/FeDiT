import { getConverter } from '../../configs/jsonConverterConfig';

// 타입 재수출
export type { ConverterFunction } from './types';

// 개별 변환기 재수출 (필요시 직접 사용 가능)
export { convertConcentrationDiffusionLBM } from './converters/concentration-diffusion/concentrationDiffusionLBMConverter';


/**
 * 프로젝트 데이터 변환 함수
 *
 * @param simulation 시뮬레이션 타입 (예: 'concentration_diffusion')
 * @param solver 솔버 타입 (예: 'lbm')
 * @param formData 단일 form 데이터
 * @returns 변환된 결과
 * @throws 변환기를 찾을 수 없거나 변환 중 오류 발생시
 */
export function convertProjectData(
  simulation: string,
  solver: string,
  formData: any
): any {
  console.log('[convertProjectData] Input parameters:', {
    simulation,
    solver,
    formData,
    formDataType: typeof formData,
    formDataKeys: formData ? Object.keys(formData) : 'formData is null/undefined'
  });

  const converter = getConverter(simulation, solver);
  console.log('[convertProjectData] Converter found:', !!converter);

  if (!converter) {
    throw new Error(
      `No converter found for: ${simulation}.${solver}`
    );
  }

  try {
    console.log('[convertProjectData] Calling converter with formData:', formData);
    const result = converter(formData);
    console.log('[convertProjectData] Converter result:', result);
    return result;
  } catch (error) {
    console.error('[convertProjectData] Converter error:', error);
    console.error('[convertProjectData] Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw new Error(
      `Failed to convert data with ${simulation}.${solver} converter: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}


/**
 * 사용 예시:
 *
 * import { convertProjectData } from '@/utils/json';
 *
 * // ProjectPanel에서 form 데이터 수집 (단일 form)
 * const formData = {
 *   waterHeight: 0.032,
 *   diffusionCoefficient: 1e-9,
 *   // ... 기타 form 필드들
 * };
 *
 * // 변환 함수 호출
 * const result = convertProjectData('concentration_diffusion', 'lbm', formData);
 *
 * // JSON 다운로드
 * downloadJSON(result, 'simulation_data.json');
 */
