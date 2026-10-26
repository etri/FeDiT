# DTVS 오픈소스 라이선스 검증 보고서

- 프로젝트: **DTVS** (3차원 디지털 연합트윈 서비스 표출 기술)
- 검증일: 2026-10-22
- 검증 대상: 저장소 내 포함(vendored)된 모든 서드파티 구성요소
- 검증 방식: 소스 내 라이선스 헤더/저작권 고지 직접 식별 (ScanCode 방법론 준용 — origin/license 직접 확인)

> 비고: 본 프로젝트는 `package.json` 없이 서드파티 라이브러리를 `ThirdParty/` 하위에 직접 포함하는 구조이므로,
> 패키지 매니저 의존성 스캔 대신 포함된 각 파일의 라이선스 헤더를 직접 검증하였습니다.

---

## 1. 프로젝트 자체 라이선스

| 항목 | 내용 |
|------|------|
| 라이선스 | **GNU LGPL v2.1** (`/LICENSE`) |
| 자금 지원 | IITP grant (MSIT, No.2022-0-00431) |

---

## 2. 서드파티 구성요소 라이선스 인벤토리

| # | 구성요소 | 버전 | 라이선스 | 저작권자 | 경로 |
|---|----------|------|----------|----------|------|
| 1 | jQuery | 2.1.3 ~ 3.5.0 (16종) | **MIT** | JS Foundation | `jquery/jquery-*.js` |
| 2 | jQuery MiniColors | - | **MIT** | Cory LaViska / A Beautiful Site | `jquery/jquery.minicolors.*` |
| 3 | jsTree | 3.3.8 | **MIT** | Ivan Bozhanov | `jstree/jstree.js` |
| 4 | RequireJS | 2.3.2 | **MIT** | jQuery Foundation | `Require/require.js` |
| 5 | three.js | r97 (min: r87) | **MIT** | mrdoob & contributors | `Three/three.js`, `three.min*.js` |
| 6 | three.js examples (controls/postprocessing/shaders/camera/geometries/lines) | r97 | **MIT** | three.js authors | `Three/js/**` |
| 7 | THREE.MeshLine | - | **MIT** (upstream) | Jaume Sanchez (spite) | `Three/js/THREE.MeshLine*.js` |
| 8 | Draco 3D (decoder/encoder/wasm) | - | **Apache-2.0** | Google | `Three/js/libs/draco/**` |
| 9 | ammo.js (Bullet Physics port) | - | **zlib** | Bullet / ammo.js authors | `Three/js/libs/ammo.js` |
| 10 | dat.GUI | - | **Apache-2.0** | Google Data Arts Team | `Three/js/libs/dat.gui.min.js` |
| 11 | JSZip | - | **MIT 또는 GPLv3 (듀얼)** | Stuart Knightley | `Three/js/libs/jszip.min.js` |
| 12 | opentype.js | - | **MIT** | Frederik De Bleser | `Three/js/libs/opentype.min.js` |
| 13 | stats.js | r16 | **MIT** | mrdoob | `Three/js/libs/stats.min.js` |
| 14 | tween.js | r7 | **MIT** | sole | `Three/js/libs/tween.min.js` |
| 15 | system.js | - | **MIT** | mrdoob | `Three/js/libs/system.min.js` |
| 16 | mmd-parser | - | **MIT** | takahirox | `Three/js/libs/mmdparser.min.js` |
| 17 | timeliner (GUI) | - | **MIT** | zz85 (Joshua Koo) | `Three/js/libs/timeliner_gui.min.js` |
| 18 | zlib.js (inflate/gunzip) | 2012 | **MIT** | imaya | `Three/js/libs/inflate.min.js`, `gunzip.min.js` |
| 19 | o3dgc | - | **MIT** | Khaled Mammou / AMD | `Three/js/libs/o3dgc.js` |

> 미확인/저작권 헤더 부재: `Three/js/libs/opentype.min.js` 내 번들 모듈 다수는 `@license MIT`로 표기됨.
> `THREE.MeshLine.module.js`는 파일 내 라이선스 헤더가 제거된 상태 — upstream(MIT) 기준 판단.

---

## 3. 라이선스 유형별 분포

| 라이선스 | 구성요소 수 | 유형 |
|----------|------------|------|
| MIT | 15 | Permissive |
| Apache-2.0 | 2 (Draco, dat.GUI) | Permissive (특허 조항 포함) |
| zlib | 1 (ammo.js) | Permissive |
| MIT/GPLv3 듀얼 | 1 (JSZip) | 선택 가능 |

→ 전 구성요소가 **허용적(Permissive) 라이선스**이며, Copyleft(GPL/LGPL) 전파 의무가 있는 외부 의존성은 없음.

---

## 4. 컴플라이언스 분석 및 리스크

### ✅ 양호
- 포함된 서드파티는 모두 MIT/Apache-2.0/zlib 계열로, 재배포 및 상용 이용에 제약이 낮음.
- JSZip은 듀얼 라이선스이므로 **MIT 선택** 시 의무사항 최소화 가능.
- 서드파티는 각 파일 내 원 저작권/라이선스 헤더를 보존한 상태로 포함되어 있어 고지 의무 충족에 유리.

### ⚠️ 확인·조치 권장 사항
1. **라이선스 고지 파일(THIRD-PARTY-NOTICES) 부재**
   - 현재 저장소에는 각 서드파티의 라이선스 전문/고지를 모은 통합 고지 파일이 없음.
   - MIT/Apache-2.0/zlib 모두 **저작권 고지 및 라이선스 전문 동봉**을 재배포 조건으로 요구 → 통합 NOTICE 파일 생성 권장.

2. **Apache-2.0 ↔ LGPL-2.1 결합 호환성** (Draco, dat.GUI)
   - 프로젝트 본체가 LGPL-2.1이고 일부 구성요소가 Apache-2.0임.
   - FSF 견해상 Apache-2.0은 특허 종료 조항 때문에 GPLv2/LGPLv2.1과 "단일 결합 저작물"로는 비호환으로 분류됨.
   - 단, 본 구성요소들은 **독립 라이브러리를 런타임에 로드(단순 집합, aggregation)**하는 형태이고 원본을 수정 없이 사용하므로 실질적 리스크는 낮음.
   - → 법무 검토 시 "정적 결합이 아닌 집합 배포"임을 명확히 하는 것을 권장.

3. **MeshLine 라이선스 헤더 제거**
   - `THREE.MeshLine.module.js`에 원 라이선스 헤더가 없음 → upstream(MIT) 고지 복원 권장.

4. **THREE.MeshLine 저작권 고지 복원**, opentype 번들 내 하위 의존성(`@license`) 고지 유지 확인.

### ❗ 비교 — Copyleft 전파 리스크
- 발견된 Copyleft 의존성 **없음**. 프로젝트 LGPL-2.1 정책과 서드파티 간 전파 충돌 없음.

---

## 5. 권장 조치 (Action Items)

1. `THIRD-PARTY-NOTICES.md` 또는 `NOTICE` 파일 생성 — 위 인벤토리의 각 구성요소 저작권·라이선스 전문 포함.
2. Draco/dat.GUI의 Apache-2.0 `NOTICE` 파일 동봉 여부 확인 (Apache-2.0 §4-d 요구).
3. JSZip 듀얼 라이선스 중 **MIT 채택** 명시.
4. `THREE.MeshLine.module.js` 라이선스 헤더 복원.
5. (선택) 정밀 자동 검증이 필요하면 ScanCode.io로 재스캔하여 본 인벤토리와 대조.

---

## 부록 A. 검증에 사용한 근거 (라이선스 헤더 발췌)

- jQuery 3.5.0: `Released under the MIT license — https://jquery.org/license`
- jsTree 3.3.8: `Licensed same as jquery - under the terms of the MIT License`
- RequireJS 2.3.2: `@license RequireJS 2.3.2 ... Released under MIT license`
- Draco: README `## License — Apache License 2.0`
- ammo.js: `a port of Bullet Physics to JavaScript. zlib licensed.`
- dat.GUI: `Licensed under the Apache License, Version 2.0`
- JSZip: `Dual licenced under the MIT license or GPLv3`
- zlib.js(inflate/gunzip): `@license zlib.js 2012 - imaya ... The MIT License`
- o3dgc: `Copyright (c) 2013 Khaled Mammou - AMD ... (MIT 문구)`
- opentype/stats/tween/system/mmdparser/timeliner: 각 헤더 내 MIT 표기 확인
