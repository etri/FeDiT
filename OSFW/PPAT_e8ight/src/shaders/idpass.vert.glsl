// CFD Preprocessor ID 패스 버텍스 셰이더
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

// 삼각형 인덱스를 프래그먼트 셰이더로 전달
flat varying float vTriangleIndex;
varying vec3 vNormal;

void main() {
    // gl_VertexID를 사용하여 삼각형 인덱스 계산
    // 각 삼각형은 3개의 버텍스로 구성
    vTriangleIndex = floor(float(gl_VertexID) / 3.0);
    
    // 노말 변환
    vNormal = normalize(normalMatrix * normal);
    
    // 버텍스 위치 변환
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
