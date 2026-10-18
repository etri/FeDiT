/**
 * 물성치 변환 및 계산을 위한 유틸리티 함수들
 */

/**
 * 유량을 L/min에서 m³/s로 변환
 * @param flowRateLMin - 분당 리터 단위의 유량 (L/min)
 * @returns 초당 세제곱미터 단위의 유량 (m³/s)
 * @example
 * convertFlowRateLMinToM3Sec(60) // 0.001 반환
 */
export function convertFlowRateLMinToM3Sec(flowRateLMin: number): number {
  // 1 L/min = 1/60000 m³/s
  return flowRateLMin / 60000;
}

/**
 * 정사각형의 단면적 계산
 * @param sideLength - 정사각형의 한 변의 길이 (m)
 * @returns 단면적 (m²)
 * @example
 * calculateSquareCrossSectionArea(0.5) // 0.25 반환
 */
export function calculateSquareCrossSectionArea(sideLength: number): number {
  return sideLength * sideLength;
}

/**
 * 유속 계산
 * @param flowRateM3Sec - 초당 세제곱미터 단위의 유량 (m³/s)
 * @param crossSectionArea - 단면적 (m²)
 * @returns 초당 미터 단위의 유속 (m/s)
 * @example
 * calculateFlowVelocity(0.001, 0.25) // 0.004 반환
 */
export function calculateFlowVelocity(flowRateM3Sec: number, crossSectionArea: number): number {
  return crossSectionArea > 0 ? flowRateM3Sec / crossSectionArea : 0;
}

/**
 * 유량(m³/s)과 시간(s)으로 부피 계산
 * @param flowRateM3Sec - 초당 세제곱미터 단위의 유량 (m³/s)
 * @param timeSeconds - 초 단위의 시간 (s)
 * @returns 세제곱미터 단위의 부피 (m³)
 * @example
 * calculateVolumeFromM3Sec(0.001, 60) // 0.06 반환
 */
export function calculateVolumeFromM3Sec(flowRateM3Sec: number, timeSeconds: number): number {
  return flowRateM3Sec * timeSeconds;
}

/**
 * 유량(L/min)과 시간(s)으로 부피 계산
 * @param flowRateLMin - 분당 리터 단위의 유량 (L/min)
 * @param timeSeconds - 초 단위의 시간 (s)
 * @returns 세제곱미터 단위의 부피 (m³)
 * @example
 * calculateVolumeFromLMin(60, 60) // 0.06 반환 (60 L/min으로 60초 동안 = 0.06 m³)
 */
export function calculateVolumeFromLMin(flowRateLMin: number, timeSeconds: number): number {
  const flowRateM3Sec = convertFlowRateLMinToM3Sec(flowRateLMin);
  return flowRateM3Sec * timeSeconds;
}

/**
 * 밀도와 부피로 질량 계산
 * @param density - 밀도 (kg/m³)
 * @param volume - 부피 (m³)
 * @returns 질량 (kg)
 * @example
 * calculateMass(1000, 0.001) // 1 반환 (물 1L의 질량)
 * calculateMass(2650, 0.01) // 26.5 반환
 */
export function calculateMass(density: number, volume: number): number {
  return density * volume;
}

/**
 * 부피와 단면적으로 buffer length 계산
 * @param volume - 부피 (m³)
 * @param crossSectionArea - 단면적 (m²)
 * @returns 길이 (m)
 * @example
 * calculateBufferLengthFromVolume(1.0, 0.25) // 4 반환 (1 m³ / 0.25 m² = 4 m)
 * calculateBufferLengthFromVolume(0.5, 0.1) // 5 반환
 */
export function calculateBufferLengthFromVolume(volume: number, crossSectionArea: number): number {
  return crossSectionArea > 0 ? volume / crossSectionArea : 0;
}

/**
 * 유속과 시간으로 buffer length 계산
 * @param flowVelocity - 유속 (m/s)
 * @param time - 시간 (s)
 * @returns 길이 (m) - flowVelocity * time
 * @example
 * calculateBufferLengthFromVelocity(2.0, 5.0) // 10 반환 (2 m/s × 5 s = 10 m)
 * calculateBufferLengthFromVelocity(1.5, 3.0) // 4.5 반환
 */
export function calculateBufferLengthFromVelocity(flowVelocity: number, time: number): number {
  return flowVelocity * time;
}

/**
 * Buffer length를 diameter의 정수배로 adjust
 * @param length - 교정할 길이 (m)
 * @param diameter - 정수배의 기준이 되는 길이 (m)
 * @returns Adjust된 길이 (m)
 * @example
 * adjustBufferLength(3.7, 1.0) // 4 반환 (3.7 ≈ 4배)
 * adjustBufferLength(3.2, 1.0) // 3 반환 (3.2 ≈ 3배)
 * adjustBufferLength(7.6, 2.0) // 8 반환 (7.6 ≈ 4배 × 2)
 */
export function adjustBufferLength(length: number, diameter: number): number {
  if (diameter <= 0) return length;
  return Math.round(length / diameter) * diameter;
}

/**
 * Terminal velocity 계산 (자유낙하 최종 속도)
 * @param height - 탱크 높이 (m)
 * @returns Terminal velocity (m/s)
 * @example
 * calculateTerminalVelocity(1.0) // 4.429 반환 (√(2 × 1.0 × 9.81))
 * calculateTerminalVelocity(0.5) // 3.132 반환
 */
export function calculateTerminalVelocity(height: number): number {
  // v = √(2gh), g = 9.81 m/s²
  return Math.sqrt(2 * height * 9.81);
}

/**
 * Max velocity 계산 (x, y 속도 벡터의 크기)
 * @param xVelocity - x 방향 속도 (m/s)
 * @param yVelocity - y 방향 속도 (m/s)
 * @returns 최대 속도 (m/s) - √(vx² + vy²)
 * @example
 * calculateMaxVelocity(3, 4) // 5 반환 (√(3² + 4²) = √25 = 5)
 * calculateMaxVelocity(1, 1) // 1.414 반환 (√(1² + 1²) = √2)
 */
export function calculateMaxVelocity(xVelocity: number, yVelocity: number): number {
  return Math.sqrt(xVelocity * xVelocity + yVelocity * yVelocity);
}

/**
 * Time step 계산
 * @param dx - 격자 간격 (m)
 * @param maxVelocity - 최대 속도 (m/s)
 * @returns Time step (s) - 0.1 * dx / maxVelocity
 * @example
 * calculateTimeStep(0.01, 1.0) // 0.001 반환 (0.1 * 0.01 / 1.0)
 * calculateTimeStep(0.02, 2.0) // 0.001 반환 (0.1 * 0.02 / 2.0)
 */
export function calculateTimeStep(dx: number, maxVelocity: number): number {
  return maxVelocity > 0 ? 0.1 * dx / maxVelocity : 0;
}

/**
 * Shear modulus 계산 (전단 탄성 계수)
 * @param youngsModulus - Young's modulus (Pa)
 * @param poissonsRatio - Poisson's ratio
 * @returns Shear modulus (Pa) - E / (2(1 + ν))
 * @example
 * calculateShearModulus(10000, 0.3) // 3846.154 반환 (10000 / (2 * (1 + 0.3)))
 * calculateShearModulus(200000, 0.25) // 80000 반환 (200000 / (2 * (1 + 0.25)))
 */
export function calculateShearModulus(youngsModulus: number, poissonsRatio: number): number {
  const denominator = 2 * (1 + poissonsRatio);
  return denominator !== 0 ? youngsModulus / denominator : 0;
}

/**
 * Rayleigh 기준 dt 계산
 * @param density - 밀도 (kg/m³)
 * @param poissonsRatio - Poisson's ratio
 * @param radius - 반지름 (m)
 * @param shearModulus - Shear modulus (Pa)
 * @returns Rayleigh 기준 dt (s) - (πr) / (0.1631ν + 0.8766) * √(ρ/G)
 * @example
 * calculateRayleighDt(1000, 0.3, 0.01, 10000) // 계산 결과 반환
 */
export function calculateRayleighDt(density: number, poissonsRatio: number, radius: number, shearModulus: number): number {
  if (shearModulus <= 0 || density <= 0 || radius <= 0) {
    return 0;
  }
  const numerator = Math.PI * radius;
  const denominator = 0.1631 * poissonsRatio + 0.8766;
  if (denominator === 0) {
    return 0;
  }
  const sqrtPart = Math.sqrt(density / shearModulus);
  return (numerator / denominator) * sqrtPart;
}

/**
 * Hertz 기준 dt 계산
 * @param density - 밀도 (kg/m³)
 * @param radius - 반지름 (m)
 * @param youngsModulus - Young's modulus (Pa)
 * @param poissonsRatio - Poisson's ratio
 * @param maxVelocity - 최대 속도 (m/s)
 * @returns Hertz 기준 dt (s) - 2.94 * (m_eff² / (R_eff * E*² * v_rel))^(1/5)
 * @example
 * calculateHertzDt(0.01, 10000, 0.3, 1.0, 1000) // 계산 결과 반환
 */
export function calculateHertzDt(density: number, radius: number, youngsModulus: number, poissonsRatio: number, maxVelocity: number): number {
  if (radius <= 0 || youngsModulus <= 0 || maxVelocity <= 0 || density <= 0) {
    return 0;
  }
  
  // E* = E / (2(1-ν²)) - 유효 탄성 계수
  const denominatorEStar = 2 * (1 - poissonsRatio * poissonsRatio);
  if (denominatorEStar === 0) {
    return 0;
  }
  const eStar = youngsModulus / denominatorEStar;
  
  // m_eff = ρ × (4/3)πr³ - 유효 질량(granule 입자 중 가장 작은 입자의 질량)
  const mEff = density * (4 / 3) * Math.PI * radius * radius * radius;
  
  // v_rel = u_max (maxVelocity) - 상대 속도(최대 속도)
  const vRel = maxVelocity;
  
  // R_eff = radius - 유효 반지름(입자 중 가장 작은 입자의 반지름)
  const rEff = radius;
  
  // t_H = 2.94 * (m_eff² / (R_eff * E*² * v_rel))^(1/5)
  const numerator = mEff * mEff;
  const denominator = rEff * eStar * eStar * vRel;
  if (denominator === 0) {
    return 0;
  }
  const fraction = numerator / denominator;
  const result = 2.94 * Math.pow(fraction, 1 / 5);
  
  return result;
}

/**
 * DEM sub dt 계산
 * @param rayleighDt - Rayleigh 기준 dt (s)
 * @param hertzDt - Hertz 기준 dt (s)
 * @returns DEM sub dt (s) - 0.05 × min(t_R, t_H)
 * @example
 * calculateDemSubDt(0.001, 0.0005) // 0.000025 반환 (0.05 × min(0.001, 0.0005))
 * calculateDemSubDt(0.0005, 0.001) // 0.000025 반환 (0.05 × min(0.0005, 0.001))
 */
export function calculateDemSubDt(rayleighDt: number, hertzDt: number): number {
  if (rayleighDt <= 0 || hertzDt <= 0) {
    return 0;
  }
  const minDt = Math.min(rayleighDt, hertzDt);
  return 0.05 * minDt;
}

/**
 * DEM Iteration 계산
 * @param dt - Time step (s)
 * @param demSubDt - DEM sub dt (s)
 * @returns DEM Iteration - ⌈Δt / Δt_sub⌉ (올림 처리된 정수)
 * @example
 * calculateDemIteration(0.0005, 0.00001) // 50 반환 (0.0005 / 0.00001)
 * calculateDemIteration(0.001, 0.00003) // 34 반환 (33.33... → 34로 올림)
 */
export function calculateDemIteration(dt: number, demSubDt: number): number {
  if (demSubDt <= 0 || dt <= 0) {
    return 0;
  }
  return Math.ceil(dt / demSubDt);
}