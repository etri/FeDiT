const plumePalette = `
vec3 plumeColor(float t) {
  if (t < 0.25) return mix(vec3(0.23, 0.51, 0.96), vec3(0.13, 0.83, 0.93), t * 4.0);
  if (t < 0.5) return mix(vec3(0.13, 0.83, 0.93), vec3(0.29, 0.87, 0.50), (t - 0.25) * 4.0);
  if (t < 0.75) return mix(vec3(0.29, 0.87, 0.50), vec3(0.99, 0.88, 0.28), (t - 0.5) * 4.0);
  return mix(vec3(0.99, 0.88, 0.28), vec3(0.94, 0.27, 0.27), (t - 0.75) * 4.0);
}
`;

export const volumeVertex = `
out vec3 localPosition;
void main() {
  localPosition = position + vec3(0.5);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
export const volumeFragment = `
precision highp float;
precision highp sampler3D;
uniform sampler3D field;
uniform sampler3D nextField;
uniform bool interpolate;
uniform float frameMix;
uniform int raySteps;
uniform bool contour;
uniform float contourThreshold;
uniform vec4 contourLevels;
uniform vec3 gridDimensions;
uniform sampler3D mask;
uniform sampler2D sceneDepth;
uniform mat4 volumeToClip;
uniform vec2 resolution;
uniform vec2 valueRange;
uniform float opacity;
uniform vec2 highlightRange;
uniform bool hasHighlight;
uniform bool concentration;
uniform vec3 localCamera;
in vec3 localPosition;
out vec4 outColor;

${plumePalette}

vec3 contourColor(float t) {
  if (t < 0.25) return mix(vec3(0.78, 0.06, 0.98), vec3(1.0, 0.08, 0.47), t * 4.0);
  if (t < 0.5) return mix(vec3(1.0, 0.08, 0.47), vec3(1.0, 0.42, 0.06), (t - 0.25) * 4.0);
  if (t < 0.75) return mix(vec3(1.0, 0.42, 0.06), vec3(1.0, 0.82, 0.08), (t - 0.5) * 4.0);
  return mix(vec3(1.0, 0.82, 0.08), vec3(1.0, 0.12, 0.18), (t - 0.75) * 4.0);
}

float concentrationAt(vec3 p) {
  float v = texture(field, p).r;
  return interpolate ? mix(v, texture(nextField, p).r, frameMix) : v;
}

void main() {
  vec3 direction = normalize(localPosition - localCamera);
  vec3 inverse = 1.0 / direction;
  vec3 t0 = (vec3(0.0) - localCamera) * inverse;
  vec3 t1 = (vec3(1.0) - localCamera) * inverse;
  float nearT = max(max(min(t0.x, t1.x), min(t0.y, t1.y)), min(t0.z, t1.z));
  float farT = min(min(max(t0.x, t1.x), max(t0.y, t1.y)), max(t0.z, t1.z));
  if (farT < max(nearT, 0.0)) discard;

  float startT = max(nearT, 0.0);
  float travel = farT - startT;
  int steps = raySteps > 0 ? min(raySteps, 128) : 128;
  // 등치면은 재생 품질과 별개로 격자 셀마다 두 번 이상 탐색
  if (contour) steps = min(256, max(steps, int(ceil(length(direction * gridDimensions) * travel * 2.0))));
  float stepSize = travel / float(steps);
  float opaqueDepth = texture(sceneDepth, gl_FragCoord.xy / resolution).r;
  vec4 color = vec4(0.0);
  float peak = 0.0;
  vec3 previousPosition = localCamera + direction * startT;
  float previousValue = concentrationAt(clamp(previousPosition, 0.0, 1.0));
  bool contourSeen[4];
  for (int level = 0; level < 4; level++) contourSeen[level] = false;
  for (int i = 0; i < 256; i++) {
    if (i >= steps) break;
    vec3 p = localCamera + direction * (startT + (float(i) + (contour ? 1.0 : 0.5)) * stepSize);
    float v = concentrationAt(p);
    float before = previousValue;
    vec3 beforePosition = previousPosition;
    previousValue = v;
    previousPosition = p;
    if (concentration && max(v, before) <= 0.0) continue;
    if (!contour && hasHighlight && (v < highlightRange.x || v >= highlightRange.y)) continue;
    vec4 clip = volumeToClip * vec4(p - vec3(0.5), 1.0);
    float sampleDepth = clip.z / clip.w * 0.5 + 0.5;
    bool occluded = sampleDepth > opaqueDepth + 0.00001;

    float span = max(valueRange.y - valueRange.x, 0.000001);
    if (contour) {
      // 원농도의 고정 등치값 교차점만 표면으로 합성
      bool customContour = contourThreshold > max(0.0, valueRange.x) && contourThreshold < valueRange.y;
      for (int crossingIndex = 0; crossingIndex < 4; crossingIndex++) {
        if (customContour && crossingIndex > 0) break;
        int level = customContour ? 0 : v >= before ? crossingIndex : 3 - crossingIndex;
        float threshold = customContour ? contourThreshold : contourLevels[level];
        float fraction = clamp((threshold - valueRange.x) / span, 0.0, 1.0);
        if (threshold <= 0.0 || contourSeen[level] || (!customContour && level > 0 && threshold <= contourLevels[level - 1])) continue;
        if ((before < threshold && v >= threshold) || (before >= threshold && v < threshold)) {
          float crossing = clamp((threshold - before) / (v - before), 0.0, 1.0);
          vec3 surface = mix(beforePosition, p, crossing);
          if (texture(mask, surface).r < 0.001) continue;
          if (hasHighlight && (threshold < highlightRange.x || threshold >= highlightRange.y)) continue;
          vec4 surfaceClip = volumeToClip * vec4(surface - vec3(0.5), 1.0);
          float surfaceDepth = surfaceClip.z / surfaceClip.w * 0.5 + 0.5;
          if (surfaceDepth > opaqueDepth + 0.00001) continue;
          // 농도별 색상과 표시 밀도를 높여 건물 표면과 등치면 구분
          float a = (0.70 + 0.06 * float(level)) * opacity;
          color.rgb += (1.0 - color.a) * a * contourColor(fraction);
          color.a += (1.0 - color.a) * a;
          contourSeen[level] = true;
        }
      }
      // 가려지기 전 마지막 선분의 등치면 교차도 확인한 뒤 종료
      if (occluded) break;
      continue;
    }
    if (occluded) break;
    if (texture(mask, p).r < 0.001) continue;
    if (concentration && v <= 0.0) continue;
    float t = clamp((v - valueRange.x) / span, 0.0, 1.0);
    vec3 c = vec3(min(1.0, 2.0 * t), 0.25 + 0.55 * (1.0 - abs(2.0 * t - 1.0)), min(1.0, 2.0 * (1.0 - t)));
    float a = 0.035 * opacity;
    if (concentration) {
      peak = max(peak, t);
      c = plumeColor(t);
      // 낮은 농도의 표시 밀도 보정
      float density = smoothstep(0.0, 0.7, sqrt(t));
      a = (1.0 - exp(-24.0 * density * stepSize)) * opacity;
    }
    color.rgb += (1.0 - color.a) * a * c;
    color.a += (1.0 - color.a) * a;
    if (color.a > 0.96) break;
  }
  if (color.a < 0.001) discard;
  if (concentration && !contour) color.rgb = color.a * plumeColor(peak);
  outColor = color;
}
`;

export const streamlineVertex = `
uniform vec2 resolution;
uniform float lineWidth;
uniform float playbackTime;
in vec3 segmentStart;
in vec3 segmentEnd;
in vec2 segmentTimes;
in float ribbonSide;
in float ribbonEndpoint;
out vec3 localPosition;
out float sidePosition;
flat out float timeVisible;
void main() {
  float duration = segmentTimes.y - segmentTimes.x;
  float elapsed = duration > 0.0 ? clamp((playbackTime - segmentTimes.x) / duration, 0.0, 1.0) : step(segmentTimes.y, playbackTime);
  vec3 currentEnd = mix(segmentStart, segmentEnd, elapsed);
  localPosition = ribbonEndpoint < 0.0 ? segmentStart : currentEnd;
  sidePosition = ribbonSide;
  timeVisible = duration > 0.0 ? (playbackTime > segmentTimes.x ? 1.0 : 0.0) : step(segmentTimes.y, playbackTime);
  vec4 start = projectionMatrix * modelViewMatrix * vec4(segmentStart - vec3(0.5), 1.0);
  vec4 end = projectionMatrix * modelViewMatrix * vec4(currentEnd - vec3(0.5), 1.0);
  vec2 delta = (end.xy / max(end.w, 0.00001) - start.xy / max(start.w, 0.00001)) * resolution;
  vec2 tangent = delta / max(length(delta), 0.00001);
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(localPosition - vec3(0.5), 1.0);
  // 이웃 선분 끝을 반 픽셀 겹쳐 입자 경로의 화면 틈을 방지
  vec2 pixels = normal * ribbonSide * lineWidth * 0.5 + tangent * ribbonEndpoint * 0.5;
  clip.xy += pixels * 2.0 / resolution * clip.w;
  gl_Position = clip;
}
`;

export const streamlineFragment = `
precision highp float;
precision highp sampler3D;
uniform sampler3D field;
uniform sampler3D nextField;
uniform sampler3D mask;
uniform sampler2D sceneDepth;
uniform float frameMix;
uniform float concentrationScale;
uniform vec2 resolution;
uniform vec2 valueRange;
uniform float opacity;
uniform vec2 highlightRange;
uniform bool hasHighlight;
in vec3 localPosition;
in float sidePosition;
flat in float timeVisible;
out vec4 outColor;

${plumePalette}

void main() {
  if (timeVisible < 0.5) discard;
  if (any(lessThan(localPosition, vec3(0.0))) || any(greaterThan(localPosition, vec3(1.0)))) discard;
  if (texture(mask, localPosition).r < 0.001) discard;
  float opaqueDepth = texture(sceneDepth, gl_FragCoord.xy / resolution).r;
  if (gl_FragCoord.z > opaqueDepth + 0.00001) discard;
  float v = mix(texture(field, localPosition).r, texture(nextField, localPosition).r, frameMix);
  if (v <= 0.0 || (hasHighlight && (v < highlightRange.x || v >= highlightRange.y))) discard;
  float t = clamp((v - valueRange.x) / max(valueRange.y - valueRange.x, 0.000001), 0.0, 1.0);
  // 현재 농도로 입자 경로의 표시 밀도만 완만하게 조정
  float density = smoothstep(0.0, max(concentrationScale * 0.25, 0.000001), v);
  float edge = 1.0 - smoothstep(0.65, 1.0, abs(sidePosition));
  float alpha = 0.95 * density * edge * opacity;
  if (alpha < 0.001) discard;
  outColor = vec4(plumeColor(t) * alpha, alpha);
}
`;
