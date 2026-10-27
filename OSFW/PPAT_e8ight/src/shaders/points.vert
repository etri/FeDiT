// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
// 점 정점 셰이더 — 자사 후처리기의 점 셰이더 규약을 따른다.
// 차이: 색 매핑 값(fieldScalar)은 CPU에서 미리 계산한 1개 float이고(스칼라/벡터 크기/성분),
//       컬러맵은 1D 텍스처에서 읽는다. 숨길 점은 절두체 밖으로 보내는 같은 방식을 쓴다.
// 조상 Clip·Threshold 판정은 CPU(filter.ts makeChainTester)가 점마다 hidden 속성(0/1)으로 올린다.

attribute float fieldScalar;
attribute float pointRadius;    // 점마다 다른 반지름 (다중 레벨). useRadiusAttr일 때만 사용
attribute float hidden;         // 1 이면 가공 사슬에 걸려 숨김
uniform bool useRadiusAttr;

uniform sampler2D colormapTex;
uniform float rangeMin;
uniform float rangeMax;
uniform int colorMode;        // 0 = 컬러맵, 1 = 단색(baseColor)
uniform vec3 baseColor;

uniform float pointSize;        // 슬라이더 배율
uniform float pointWorldRadius; // 점의 실제 반지름 (m)
uniform float cameraFov;        // 도
uniform float orthoHeight;      // 직교 투영일 때 화면 세로에 보이는 길이 (m). 0이면 원근
uniform float viewportHeight;   // 픽셀

varying vec3 vColor;

void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    bool hide = fieldScalar > 1.0e29; // 결측값 표시
    if (hidden > 0.5) hide = true;

    if (hide) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        gl_PointSize = 0.0;
        return;
    }

    float t = clamp((fieldScalar - rangeMin) / max(rangeMax - rangeMin, 1.0e-12), 0.0, 1.0);
    vColor = (colorMode == 0) ? texture2D(colormapTex, vec2(t, 0.5)).rgb : baseColor;

    // 원근에 따른 점 크기: 실제 반지름이 화면에서 차지하는 지름 (자사 후처리기 방식)
    float viewDistance = max(length(mvPosition.xyz), 1.0e-3);
    float screenHeight = orthoHeight > 0.0 ? orthoHeight : 2.0 * viewDistance * tan(radians(cameraFov) * 0.5);
    float worldRadius = useRadiusAttr ? pointRadius : pointWorldRadius;
    float desiredScreenDiameter = (worldRadius * 2.0) / screenHeight * viewportHeight;
    // 상한 96px: 너무 큰 스프라이트는 겹쳐 그리는 비용(fill rate)만 키운다
    gl_PointSize = clamp(desiredScreenDiameter * pointSize, 1.0, 96.0);
}
