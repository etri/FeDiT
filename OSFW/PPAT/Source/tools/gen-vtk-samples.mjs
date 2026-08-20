#!/usr/bin/env node
/**
 * SimEdit9 - Legacy VTK(BINARY / STRUCTURED_POINTS) 예제 파일 생성기
 *
 * src/lib/vtk-legacy.mjs 가 읽을 수 있는 최소 규격에 정확히 맞춰서 파일을 씁니다.
 *   # vtk DataFile Version 3.0
 *   <comment>
 *   BINARY
 *   DATASET STRUCTURED_POINTS
 *   DIMENSIONS nx ny nz
 *   SPACING sx sy sz
 *   ORIGIN ox oy oz
 *   POINT_DATA N
 *   SCALARS <name> float 1
 *   LOOKUP_TABLE default
 *   <N개 float32 big-endian>
 *   VECTORS <name> float
 *   <3N개 float32 big-endian>
 *
 * 좌표계: 기본은 CFD 관례인 Z-up(z = 고도, 바람은 주로 +x).
 *         가져오기 대화상자의 기본값(importUpAxis = 'z')과 일치합니다.
 *         `--up y` 로 Y-up 파일도 뽑을 수 있습니다(오버레이 경로는 upAxis:'y' 고정).
 *
 * 사용법:
 *   node tools/gen-vtk-samples.mjs                 # 전체 생성 → data/samples/
 *   node tools/gen-vtk-samples.mjs --list          # 케이스 목록만 출력
 *   node tools/gen-vtk-samples.mjs --only 03,04    # 일부만 생성(이름 접두 매칭)
 *   node tools/gen-vtk-samples.mjs --res 2         # 격자 해상도 2배(용량 8배)
 *   node tools/gen-vtk-samples.mjs --up y          # Y-up 으로 축 변환해서 출력
 *   node tools/gen-vtk-samples.mjs --out /tmp/vtk  # 출력 폴더 지정
 */

import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// 공통 수학 유틸
// ---------------------------------------------------------------------------

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sq = (v) => v * v;

/** 0..1 로 부드럽게 전이하는 Hermite 보간. */
function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0 || 1e-9), 0, 1);
    return t * t * (3 - 2 * t);
}

// 대기경계층(ABL) 대수 분포 파라미터
const UREF = 6.0;   // 기준 풍속 [m/s]
const ZREF = 50.0;  // 기준 고도 [m]
const Z0 = 0.5;     // 지표 조도 [m] (도시 지역)

/** 고도 z 에서의 접근류 풍속 [m/s]. */
function ablU(z) {
    if (z <= 0.05) return 0;
    return UREF * Math.log((z + Z0) / Z0) / Math.log((ZREF + Z0) / Z0);
}

/**
 * 직육면체 건물 하나가 만드는 유동 교란.
 * - 측면 우회: 등가 원기둥 포텐셜 흐름(정체점 감속 + 측면 가속)
 * - 지붕: 풍상측 상승류 / 풍하측 하강류
 * - 후류: 속도 결손 + 유선함수 기반 폐쇄 와류(역류 발생)
 *
 * @param {number} x @param {number} y @param {number} z
 * @param {{cx:number, cy:number, a:number, b:number, h:number}} B  a=x반폭, b=y반폭, h=높이
 * @param {number} u0 해당 고도의 접근류 풍속
 */
function buildingEffect(x, y, z, B, u0) {
    const dx = x - B.cx, dy = y - B.cy;
    if (Math.abs(dx) <= B.a && Math.abs(dy) <= B.b && z <= B.h) {
        return {solid: true, du: 0, dv: 0, dw: 0};
    }
    let du = 0, dv = 0, dw = 0;

    // 1) 수평면 내 우회 (등가 반지름 R 의 원기둥 포텐셜 해)
    const R = 0.5 * (B.a + B.b);
    const r2 = dx * dx + dy * dy;
    const r = Math.sqrt(r2) || 1e-6;
    const fz = 1 - smoothstep(B.h * 0.75, B.h * 1.7, z); // 지붕 위로 갈수록 영향 감소
    if (r > R) {
        const r4 = r2 * r2;
        du += -u0 * R * R * (dx * dx - dy * dy) / r4 * fz;
        dv += -u0 * 2 * R * R * dx * dy / r4 * fz;
    }

    // 2) 지붕 부근 상승/하강류
    const roof = Math.exp(-0.5 * sq((z - B.h) / (0.4 * B.h)));
    const latR = Math.exp(-0.5 * sq(dy / (1.2 * B.b)));
    const nearX = Math.exp(-0.5 * sq(dx / (2.0 * B.a)));
    dw += -0.5 * u0 * roof * latR * nearX * Math.tanh(dx / (0.6 * B.a));

    // 3) 후류: 속도 결손 + 폐쇄 와류
    const xw = dx - B.a;
    if (xw > 0) {
        const latW = Math.exp(-0.5 * sq(dy / B.b));
        const fzW = 1 - smoothstep(B.h * 0.85, B.h * 1.5, z);
        du += -0.9 * u0 * Math.exp(-xw / (2.5 * B.h)) * latW * fzW;

        const Lr = 2.4 * B.h;                 // 재부착 길이
        const xi = xw / Lr;
        if (xi < 1) {
            const zz = clamp(z / B.h, 0, 1);
            // psi = A sin(pi*xi) sin(pi*zz),  u = dpsi/dz,  w = -dpsi/dx
            const A = -0.55 * u0 * B.h / Math.PI;
            du += (A * Math.PI / B.h) * Math.sin(Math.PI * xi) * Math.cos(Math.PI * zz) * latW;
            dw += -(A * Math.PI / Lr) * Math.cos(Math.PI * xi) * Math.sin(Math.PI * zz) * latW;
        }
    }
    return {solid: false, du, dv, dw};
}

/** 건물 배열 위의 도시 풍속장. 건물 내부는 [0,0,0]. */
function urbanFlow(x, y, z, buildings) {
    const u0 = ablU(z);
    let u = u0, v = 0, w = 0;
    for (const B of buildings) {
        const e = buildingEffect(x, y, z, B, u0);
        if (e.solid) return [0, 0, 0];
        u += e.du;
        v += e.dv;
        w += e.dw;
    }
    return [u, v, w];
}

/** 유선함수 기반 폐쇄 와류(x-z 평면). 0<xi<1, 0<zz<1 구간에서만 유효. */
function eddyXZ(xi, zz, amp, Lx, Lz) {
    if (xi <= 0 || xi >= 1) return [0, 0];
    const A = -amp * Lz / Math.PI;
    const du = (A * Math.PI / Lz) * Math.sin(Math.PI * xi) * Math.cos(Math.PI * zz);
    const dw = -(A * Math.PI / Lx) * Math.cos(Math.PI * xi) * Math.sin(Math.PI * zz);
    return [du, dw];
}

const speedOf = (v) => Math.hypot(v[0], v[1], v[2]);

// ---------------------------------------------------------------------------
// 케이스 정의
// ---------------------------------------------------------------------------

/** 표준 도시 도메인: 400 x 300 x 96 m */
const URBAN = {size: [400, 300, 96], cell: [5, 5, 4], origin: [0, 0, 0]};

/** 05/11/13 이 공유하는 엇갈림 건물 배열 */
const BLOCKS = (() => {
    const out = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
            out.push({
                cx: 90 + row * 80,
                cy: 70 + col * 80 + (row % 2 ? 40 : 0),
                a: 22,
                b: 22,
                h: 30 + ((row * 3 + col) % 4) * 12
            });
        }
    }
    return out;
})();

const CANYON = {H: 30, Bx: 22, W: 34, x0: 60, rows: 6};
const HILL = {x0: 170, y0: 150, H: 55, Lx: 70, Ly: 90};
const STACK = {x0: 70, y0: 150, H: 45, Q: 5, sig0: 8};
const THERMAL = {x0: 110, y0: 150, b0: 22, W0: 4.5, spread: 0.14, Uamb: 2.5, T0: 6.0};

/** 가우시안 연기 확산(도시형 Briggs 계수). 반환 단위 ug/m^3. */
function plumeConc(x, y, z) {
    const X = x - STACK.x0;
    if (X <= 0) return 2;
    // 초기 확산폭 sig0 을 넣어 배출구 근처 특이점(sigma→0)을 제거
    const s0 = sq(STACK.sig0);
    const sy = Math.sqrt(s0 + sq(0.16 * X / Math.sqrt(1 + 0.0004 * X)));
    const sz = Math.sqrt(s0 + sq(0.14 * X / Math.sqrt(1 + 0.0003 * X)));
    const U = Math.max(1, ablU(STACK.H));
    const dy = y - STACK.y0;
    const lateral = Math.exp(-0.5 * sq(dy / sy));
    const vert = Math.exp(-0.5 * sq((z - STACK.H) / sz)) + Math.exp(-0.5 * sq((z + STACK.H) / sz));
    return 2 + 1e6 * STACK.Q / (2 * Math.PI * sy * sz * U) * lateral * vert;
}

/** 도로 선오염원(교통) 농도장. */
function trafficConc(x, y, z) {
    // x 방향 도로 2개(y 고정), y 방향 도로 2개(x 고정)
    const roadsY = [110, 190];   // y = const
    const roadsX = [130, 290];   // x = const
    const sigma = 26, hMix = 18;
    let c = 20; // 배경 농도
    for (const ry of roadsY) c += 900 * Math.exp(-0.5 * sq((y - ry) / sigma));
    for (const rx of roadsX) c += 700 * Math.exp(-0.5 * sq((x - rx) / sigma));
    // 교차로 정체 핫스팟
    for (const rx of roadsX) {
        for (const ry of roadsY) {
            c += 1200 * Math.exp(-0.5 * (sq((x - rx) / 34) + sq((y - ry) / 34)));
        }
    }
    return c * Math.exp(-z / hMix) + 15;
}

/** @type {Array<{name:string,title:string,desc:string,domain:any,scalarsName:?string,vectorsName:?string,resMul?:number,sample:Function}>} */
const CASES = [
    {
        name: '00_tiny_smoke',
        title: '파서 점검용 초소형 격자',
        desc: '5x4x3, 비대칭 spacing + 0이 아닌 origin. scalars=i+10j+100k, vectors=(i,j,k) 로 인덱스를 그대로 인코딩해 x-fastest 순서와 big-endian 처리를 눈으로 검증합니다.',
        domain: {size: [10, 9, 3], cell: [2.5, 3, 1.5], origin: [-10, -20, 2]},
        scalarsName: 'index_code',
        vectorsName: 'ijk',
        resMul: 1,
        sample: (x, y, z, i, j, k) => [i, j, k, i + 10 * j + 100 * k]
    },
    {
        name: '01_uniform_flow',
        title: '균일류',
        desc: '전 영역 +x 방향 5 m/s. 스트림라인이 완전한 직선으로 나와야 하고, 글리프 길이/색이 균일해야 합니다. 축 방향·부호 회귀 검증용.',
        domain: URBAN,
        scalarsName: 'speed',
        vectorsName: 'wind',
        sample: () => [5, 0, 0, 5]
    },
    {
        name: '02_abl_shear',
        title: '대기경계층 전단류',
        desc: '대수 분포 U(z) = Uref·ln((z+z0)/z0)/ln((zref+z0)/z0), z0=0.5 m. 지표 0 → 상공 약 6.8 m/s. 수직 슬라이스와 컬러맵 범위 확인에 적합.',
        domain: URBAN,
        scalarsName: 'speed',
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const u = ablU(z);
            return [u, 0, 0, u];
        }
    },
    {
        name: '03_building_wake',
        title: '단일 건물 후류',
        desc: '50x70x45 m 건물 1동. 정체점 감속, 측면 가속, 지붕 상승류, 후류 역류(폐쇄 와류)가 모두 들어 있습니다. 스트림라인 적분기 검증의 주력 케이스.',
        domain: URBAN,
        scalarsName: 'speed',
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const v = urbanFlow(x, y, z, [{cx: 140, cy: 150, a: 25, b: 35, h: 45}]);
            return [v[0], v[1], v[2], speedOf(v)];
        }
    },
    {
        name: '04_street_canyon',
        title: '가로협곡 스키밍 흐름',
        desc: '높이 30 m 슬래브 6열(폭 22 m, 협곡 34 m, H/W≈0.9). 협곡마다 단일 와류가 생겨 노면에서는 역류, 지붕 높이에서는 순류가 나타납니다. 2차원 검증 케이스.',
        domain: URBAN,
        scalarsName: 'speed',
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const {H, Bx, W, x0, rows} = CANYON;
            const P = Bx + W;
            const t = x - x0;
            const free = [ablU(z) * (1 + 0.12 * Math.exp(-Math.max(0, z - H) / (0.8 * H))), 0, 0];
            let v = free;
            if (t >= 0 && t < rows * P) {
                const p = t % P;
                if (p < Bx && z <= H) return [0, 0, 0, 0];
                if (p >= Bx) {
                    const xi = (p - Bx) / W;
                    const zz = clamp(z / H, 0, 1);
                    const Uc = 0.35 * ablU(H);
                    const [du, dw] = eddyXZ(xi, zz, Uc, W, H);
                    const dv = 0.15 * Uc * Math.sin(2 * Math.PI * y / 150);
                    const s = smoothstep(0.85 * H, 1.25 * H, z); // 지붕 위에서 자유류로 전이
                    v = [
                        du * (1 - s) + free[0] * s,
                        dv * (1 - s) + free[1] * s,
                        dw * (1 - s) + free[2] * s
                    ];
                }
            }
            return [v[0], v[1], v[2], speedOf(v)];
        }
    },
    {
        name: '05_block_array',
        title: '엇갈림 건물군 (도시 캐노피)',
        desc: '높이 30~66 m 건물 12동을 엇갈리게 배치. 가로 채널링, 건물 간 제트, 다중 후류가 겹칩니다. 글리프 밀도·성능 확인에 좋습니다.',
        domain: URBAN,
        scalarsName: 'speed',
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const v = urbanFlow(x, y, z, BLOCKS);
            return [v[0], v[1], v[2], speedOf(v)];
        }
    },
    {
        name: '06_hill_speedup',
        title: '가우시안 언덕 지형 가속',
        desc: '높이 55 m 언덕 위 지형추종 흐름. 정상부 가속, 풍하측 박리 와류 포함. 지형 아래는 0 벡터(고체)라 지표 마스킹 처리를 확인할 수 있습니다.',
        domain: URBAN,
        scalarsName: 'speed',
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const a = (x - HILL.x0) / HILL.Lx, b = (y - HILL.y0) / HILL.Ly;
            const zt = HILL.H * Math.exp(-(a * a + b * b));
            if (z <= zt) return [0, 0, 0, 0];
            const zeta = z - zt;
            const u0 = ablU(zeta);
            const S = 0.9 * (zt / HILL.H) * Math.exp(-zeta / (0.7 * HILL.H));
            let u = u0 * (1 + S);
            const follow = Math.exp(-zeta / (1.4 * HILL.H));
            const dzdx = -2 * (x - HILL.x0) / sq(HILL.Lx) * zt;
            const dzdy = -2 * (y - HILL.y0) / sq(HILL.Ly) * zt;
            let v = u * dzdy * follow;
            let w = u * dzdx * follow;
            // 풍하측 박리 와류
            const xw = x - (HILL.x0 + 0.9 * HILL.Lx);
            const Lr = 2.2 * HILL.H;
            if (xw > 0 && zeta < 0.95 * HILL.H) {
                const lat = Math.exp(-0.5 * sq((y - HILL.y0) / HILL.Ly));
                const [du, dw] = eddyXZ(xw / Lr, clamp(zeta / (0.95 * HILL.H), 0, 1), 0.5 * u0, Lr, 0.95 * HILL.H);
                u += du * lat;
                w += dw * lat;
            }
            const vec = [u, v, w];
            return [u, v, w, speedOf(vec)];
        }
    },
    {
        name: '07_vortex_pair',
        title: '역회전 수직 와류 쌍',
        desc: 'Lamb-Oseen 와류 2개(코어 28 m, 순환 부호 반대) + 약한 평균류 + 코어 상승류. 스트림라인이 강하게 감기므로 RK4 적분·스텝 크기 튜닝 확인용.',
        domain: URBAN,
        scalarsName: 'vorticity',
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const cores = [
                {x: 150, y: 110, G: 900, rc: 28},
                {x: 150, y: 190, G: -900, rc: 28}
            ];
            let u = 1.5, v = 0, w = 0, vort = 0;
            for (const c of cores) {
                const dx = x - c.x, dy = y - c.y;
                const r = Math.hypot(dx, dy) || 1e-6;
                const e = Math.exp(-sq(r / c.rc));
                const vt = c.G / (2 * Math.PI * r) * (1 - e);
                u += vt * (-dy / r);
                v += vt * (dx / r);
                w += 2.0 * e * (1 - clamp(z / 96, 0, 1));
                vort += Math.abs(c.G) / (Math.PI * sq(c.rc)) * e;
            }
            return [u, v, w, vort];
        }
    },
    {
        name: '08_abc_chaotic',
        title: 'ABC 유동 (적분기 스트레스 테스트)',
        desc: 'Arnold-Beltrami-Childress 해석해. 주기 200 m 정육면체에서 3차원 카오스 궤적을 만듭니다. 물리적 도시 바람은 아니고, 스트림라인 적분 안정성 확인 전용.',
        domain: {size: [200, 200, 200], cell: [4, 4, 4], origin: [0, 0, 0]},
        scalarsName: 'speed',
        vectorsName: 'velocity',
        sample: (x, y, z) => {
            const k = 2 * Math.PI / 200;
            const U = 3 / Math.SQRT2;
            const A = Math.sqrt(3), B = Math.SQRT2, C = 1;
            const u = U * (A * Math.sin(k * z) + C * Math.cos(k * y));
            const v = U * (B * Math.sin(k * x) + A * Math.cos(k * z));
            const w = U * (C * Math.sin(k * y) + B * Math.cos(k * x));
            return [u, v, w, Math.hypot(u, v, w)];
        }
    },
    {
        name: '09_plume_dispersion',
        title: '굴뚝 플룸 확산 (벡터+스칼라)',
        desc: '높이 45 m 점오염원의 가우시안 플룸 농도(ug/m^3) + 약한 사행이 있는 ABL 바람장. 벡터와 스칼라가 물리적으로 짝지어진 유일한 케이스라, 스트림라인 위 농도 표시 검증에 씁니다.',
        domain: URBAN,
        scalarsName: 'concentration',
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const u = ablU(z);
            const v = 0.6 * Math.sin(2 * Math.PI * x / 260) * Math.exp(-z / 60);
            const w = 0.15 * Math.cos(2 * Math.PI * x / 200) * Math.exp(-z / 80);
            return [u, v, w, plumeConc(x, y, z)];
        }
    },
    {
        name: '10_concentration_only',
        title: '교통 선오염원 농도 (SCALARS 전용)',
        desc: 'VECTORS 블록이 없는 스칼라 전용 파일. 도로 4개 + 교차로 핫스팟 농도장으로, 스칼라 슬라이스/컬러맵 경로만 단독으로 시험합니다.',
        domain: URBAN,
        scalarsName: 'concentration',
        vectorsName: null,
        sample: (x, y, z) => [0, 0, 0, trafficConc(x, y, z)]
    },
    {
        name: '11_vectors_only',
        title: '건물군 바람장 (VECTORS 전용)',
        desc: 'SCALARS 블록이 없는 벡터 전용 파일. 05번과 같은 유동장이며, 스칼라가 없을 때 글리프 색상 산정(속력 fallback)이 제대로 도는지 확인합니다.',
        domain: URBAN,
        scalarsName: null,
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const v = urbanFlow(x, y, z, BLOCKS);
            return [v[0], v[1], v[2], 0];
        }
    },
    {
        name: '12_thermal_updraft',
        title: '열적 상승류 (연직 대류)',
        desc: '지표 수렴 유입 → 상승 코어 → 상공 확산으로 이어지는 축대칭 열기둥. 평균풍에 의해 기울어집니다. 스칼라는 온도 편차 [K]. 수직 성분이 지배적인 유일한 케이스.',
        domain: URBAN,
        scalarsName: 'temperature',
        vectorsName: 'wind',
        sample: (x, y, z) => {
            const T = THERMAL;
            const tilt = T.Uamb / T.W0;
            const ax = T.x0 + tilt * z;
            const dx = x - ax, dy = y - T.y0;
            const r = Math.hypot(dx, dy) || 1e-6;
            const b = T.b0 + T.spread * z;
            const Wm = T.W0 * sq(T.b0) / sq(b) * (1 - Math.exp(-z / 12));
            const E = Math.exp(-sq(r / b));
            const w = Wm * E;
            // 연속방정식에서 유도된 반경 방향 확산 + 지표 수렴 유입
            const urExp = Wm * T.spread * (r / b) * E;
            const urIn = -2.5 * Math.exp(-z / 14) * (r / (r + T.b0)) * Math.exp(-0.5 * sq(r / (3 * T.b0)));
            const ur = urExp + urIn;
            const u = T.Uamb + ur * (dx / r);
            const v = ur * (dy / r);
            return [u, v, w, T.T0 * E * Math.exp(-z / 70)];
        }
    },
    {
        name: '13_block_array_highres',
        title: '건물군 고해상도 (성능 측정용)',
        desc: '05번과 동일 유동장을 2배 해상도(약 90만 포인트)로 생성. 파싱 시간, 글리프 stride, 메모리 사용량 확인용. --only 로 따로 뽑는 것을 권장합니다.',
        domain: URBAN,
        scalarsName: 'speed',
        vectorsName: 'wind',
        resMul: 2,
        sample: (x, y, z) => {
            const v = urbanFlow(x, y, z, BLOCKS);
            return [v[0], v[1], v[2], speedOf(v)];
        }
    }
];

// ---------------------------------------------------------------------------
// Legacy VTK writer
// ---------------------------------------------------------------------------

function fmt(v) {
    return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(6)));
}

/**
 * Legacy VTK 헤더는 ASCII 전용이다. 비-ASCII 문자가 섞이면 리더의
 * TextDecoder('ascii') 경로에서 깨질 뿐 아니라, Buffer 인코딩 과정에서
 * 하위 바이트가 0x0A/0x0D 로 떨어지며 줄 구조 자체가 망가진다.
 * (예: '밍' U+BC0D → 0x0D = CR)
 */
function asciiSafe(s, fallback) {
    const t = String(s ?? '').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();
    return t || fallback;
}

/** Float32Array → big-endian 바이트 버퍼. */
function toBigEndian(arr) {
    const buf = Buffer.allocUnsafe(arr.length * 4);
    for (let i = 0; i < arr.length; i++) buf.writeFloatBE(arr[i], i * 4);
    return buf;
}

function writeVTK(filePath, f) {
    const N = f.dims[0] * f.dims[1] * f.dims[2];
    const scalarsName = asciiSafe(f.scalarsName, 'scalars').replace(/ /g, '_');
    const vectorsName = asciiSafe(f.vectorsName, 'vectors').replace(/ /g, '_');
    const header =
        '# vtk DataFile Version 3.0\n' +
        `${asciiSafe(f.comment, 'SimEdit9 synthetic sample')}\n` +
        'BINARY\n' +
        'DATASET STRUCTURED_POINTS\n' +
        `DIMENSIONS ${f.dims.join(' ')}\n` +
        `SPACING ${f.spacing.map(fmt).join(' ')}\n` +
        `ORIGIN ${f.origin.map(fmt).join(' ')}\n` +
        `POINT_DATA ${N}\n`;

    const chunks = [Buffer.from(header, 'utf8')];
    if (f.scalars) {
        chunks.push(Buffer.from(`SCALARS ${scalarsName} float 1\nLOOKUP_TABLE default\n`, 'utf8'));
        chunks.push(toBigEndian(f.scalars));
        chunks.push(Buffer.from('\n', 'utf8'));
    }
    if (f.vectors) {
        chunks.push(Buffer.from(`VECTORS ${vectorsName} float\n`, 'utf8'));
        chunks.push(toBigEndian(f.vectors));
        chunks.push(Buffer.from('\n', 'utf8'));
    }
    const out = Buffer.concat(chunks);
    writeFileSync(filePath, out);
    return out.length;
}

// ---------------------------------------------------------------------------
// 샘플링 + 축 변환
// ---------------------------------------------------------------------------

function makeGrid(domain, res) {
    const spacing = domain.cell.map((c) => c / res);
    const dims = domain.size.map((L, i) => Math.max(2, Math.round(L / spacing[i]) + 1));
    return {dims, spacing, origin: domain.origin.slice()};
}

/** 케이스를 Z-up 격자에서 샘플링. */
function sampleCase(c, res) {
    const {dims, spacing, origin} = makeGrid(c.domain, c.resMul ? res * c.resMul : res);
    const [nx, ny, nz] = dims;
    const [sx, sy, sz] = spacing;
    const [ox, oy, oz] = origin;
    const N = nx * ny * nz;

    const scalars = c.scalarsName ? new Float32Array(N) : null;
    const vectors = c.vectorsName ? new Float32Array(N * 3) : null;

    let smin = Infinity, smax = -Infinity, vmax = 0;
    for (let k = 0; k < nz; k++) {
        const z = oz + k * sz;
        for (let j = 0; j < ny; j++) {
            const y = oy + j * sy;
            for (let i = 0; i < nx; i++) {
                const x = ox + i * sx;
                const id = i + j * nx + k * nx * ny;
                const r = c.sample(x, y, z, i, j, k);
                if (vectors) {
                    vectors[id * 3] = r[0];
                    vectors[id * 3 + 1] = r[1];
                    vectors[id * 3 + 2] = r[2];
                    const m = Math.hypot(r[0], r[1], r[2]);
                    if (m > vmax) vmax = m;
                }
                if (scalars) {
                    const s = r[3];
                    scalars[id] = s;
                    if (s < smin) smin = s;
                    if (s > smax) smax = s;
                }
            }
        }
    }
    return {
        dims, spacing, origin, count: N,
        scalars, scalarsName: c.scalarsName,
        vectors, vectorsName: c.vectorsName,
        stats: {
            scalarMin: scalars ? smin : null,
            scalarMax: scalars ? smax : null,
            speedMax: vectors ? vmax : null
        }
    };
}

/**
 * Z-up 필드를 Y-up 으로 축 변환.
 * main.mjs 의 upAxis:'z' 임포트와 동일한 회전: (x, y, z) → (x, z, -y)
 */
function toYUp(f) {
    const [nx, ny, nz] = f.dims;
    const [sx, sy, sz] = f.spacing;
    const [ox, oy, oz] = f.origin;

    const dims = [nx, nz, ny];
    const spacing = [sx, sz, sy];
    const origin = [ox, oz, -(oy + (ny - 1) * sy)];

    const N = nx * ny * nz;
    const scalars = f.scalars ? new Float32Array(N) : null;
    const vectors = f.vectors ? new Float32Array(N * 3) : null;

    // 새 인덱스 (i, j', k') ← 옛 인덱스 (i, ny-1-k', j')
    for (let kp = 0; kp < dims[2]; kp++) {
        for (let jp = 0; jp < dims[1]; jp++) {
            for (let i = 0; i < dims[0]; i++) {
                const nid = i + jp * dims[0] + kp * dims[0] * dims[1];
                const oid = i + (ny - 1 - kp) * nx + jp * nx * ny;
                if (scalars) scalars[nid] = f.scalars[oid];
                if (vectors) {
                    const vx = f.vectors[oid * 3], vy = f.vectors[oid * 3 + 1], vz = f.vectors[oid * 3 + 2];
                    vectors[nid * 3] = vx;
                    vectors[nid * 3 + 1] = vz;
                    vectors[nid * 3 + 2] = -vy;
                }
            }
        }
    }
    return {...f, dims, spacing, origin, scalars, vectors};
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
    const o = {out: path.join(ROOT, 'data', 'samples'), res: 1, up: 'z', only: null, list: false};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--list') o.list = true;
        else if (a === '--out') o.out = path.resolve(argv[++i]);
        else if (a === '--res') o.res = Math.max(0.25, Number(argv[++i]) || 1);
        else if (a === '--up') o.up = (argv[++i] === 'y') ? 'y' : 'z';
        else if (a === '--only') o.only = String(argv[++i]).split(',').map((s) => s.trim()).filter(Boolean);
        else if (a === '-h' || a === '--help') o.list = true;
    }
    return o;
}

function main() {
    const opt = parseArgs(process.argv.slice(2));

    if (opt.list) {
        console.log('\nSimEdit9 VTK 예제 케이스\n');
        for (const c of CASES) {
            const g = makeGrid(c.domain, c.resMul ? opt.res * c.resMul : opt.res);
            const kinds = [c.scalarsName && 'SCALARS', c.vectorsName && 'VECTORS'].filter(Boolean).join('+');
            console.log(`  ${c.name.padEnd(26)} ${g.dims.join('x').padEnd(14)} ${kinds.padEnd(15)} ${c.title}`);
        }
        console.log('');
        return;
    }

    const selected = opt.only
        ? CASES.filter((c) => opt.only.some((p) => c.name.startsWith(p) || c.name.includes(p)))
        : CASES;

    if (!selected.length) {
        console.error('일치하는 케이스가 없습니다. --list 로 확인하세요.');
        process.exitCode = 1;
        return;
    }

    mkdirSync(opt.out, {recursive: true});
    const manifest = [];
    let totalBytes = 0;

    for (const c of selected) {
        const t0 = process.hrtime.bigint();
        let f = sampleCase(c, opt.res);
        if (opt.up === 'y') f = toYUp(f);
        // 헤더 2행은 ASCII 만 허용되므로 한글 제목이 아닌 케이스 이름을 쓴다(제목은 manifest.json 참조).
        f.comment = `${c.name} | SimEdit9 synthetic sample | up=${opt.up} | ${c.scalarsName || '-'}/${c.vectorsName || '-'}`;

        const file = path.join(opt.out, `${c.name}.vtk`);
        const bytes = writeVTK(file, f);
        totalBytes += bytes;
        const ms = Number(process.hrtime.bigint() - t0) / 1e6;

        manifest.push({
            file: `${c.name}.vtk`,
            title: c.title,
            description: c.desc,
            upAxis: opt.up,
            dims: f.dims,
            spacing: f.spacing,
            origin: f.origin,
            points: f.count,
            scalars: c.scalarsName,
            vectors: c.vectorsName,
            scalarRange: f.stats.scalarMin === null ? null : [f.stats.scalarMin, f.stats.scalarMax],
            maxSpeed: f.stats.speedMax,
            bytes
        });

        const mb = (bytes / 1048576).toFixed(2);
        const rng = f.stats.scalarMin === null
            ? 'scalars 없음'
            : `${c.scalarsName} ∈ [${f.stats.scalarMin.toFixed(2)}, ${f.stats.scalarMax.toFixed(2)}]`;
        console.log(`✓ ${c.name.padEnd(26)} ${f.dims.join('x').padEnd(14)} ${mb.padStart(7)} MB  ${rng}  (${ms.toFixed(0)} ms)`);
    }

    writeFileSync(
        path.join(opt.out, 'manifest.json'),
        JSON.stringify({generatedBy: 'tools/gen-vtk-samples.mjs', upAxis: opt.up, res: opt.res, cases: manifest}, null, 2)
    );

    console.log(`\n총 ${selected.length}개 / ${(totalBytes / 1048576).toFixed(1)} MB → ${opt.out}`);
    console.log(`가져오기 대화상자에서 Up축 = ${opt.up.toUpperCase()}, 스케일 = 1 로 불러오세요.`);
}

main();
