// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2026 E8IGHT Co., Ltd.
// 점 프래그먼트 셰이더 — 원형 점, 선택적으로 구 모양 음영 (자사 후처리기 점 셰이더 방식)

uniform bool sphereShading;

varying vec3 vColor;

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    if (!sphereShading) {
        gl_FragColor = vec4(vColor, 1.0);
        return;
    }

    float z = sqrt(max(0.0, 0.25 - dist * dist));
    vec3 normal = normalize(vec3(center, z));
    vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
    float diffuse = max(0.0, dot(normal, lightDir));
    float ambient = 0.35;
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = pow(max(0.0, dot(viewDir, reflectDir)), 32.0) * 0.35;
    float lighting = clamp(ambient + diffuse * 0.7 + specular, 0.4, 1.2);
    gl_FragColor = vec4(vColor * lighting, 1.0);
}
