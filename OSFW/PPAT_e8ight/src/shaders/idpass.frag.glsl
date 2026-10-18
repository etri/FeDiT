// CFD Preprocessor ID 패스 프래그먼트 셰이더
precision highp float;

// 유니폼
uniform float uKind; // 1.0 = vertex, 2.0 = edge, 3.0 = face
uniform sampler2D uTri2FaceTexture; // 삼각형->면 맵핑 텍스처
uniform float uTri2FaceSize; // 맵핑 데이터 크기
uniform float uEntityIndex; // 직접 지정된 엔티티 인덱스 (엣지/버텍스용)

// varying
flat varying float vTriangleIndex;
varying vec3 vNormal;

// 32비트 정수를 RGBA로 인코딩
vec4 encodeInt32(float value) {
    // 32비트 정수를 4개의 8비트 값으로 분할
    float v = value;
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;
    enc = fract(enc);
    enc -= enc.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
    return enc;
}

// 16비트 정수를 RG로 인코딩
vec2 encodeInt16(float value) {
    float v = value;
    vec2 enc = vec2(1.0, 255.0) * v;
    enc = fract(enc);
    enc.x -= enc.y * (1.0/255.0);
    return enc;
}

void main() {
    float entityIndex = 0.0;
    
    if (uKind == 3.0) { // Face
        if (uTri2FaceSize > 0.0) {
            // tri2face 텍스처에서 face 인덱스 조회
            float texCoord = (vTriangleIndex + 0.5) / uTri2FaceSize;
            vec4 mappingData = texture2D(uTri2FaceTexture, vec2(texCoord, 0.5));
            
            // 텍스처에서 32비트 정수 디코딩
            entityIndex = dot(mappingData, vec4(1.0, 255.0, 65025.0, 16581375.0));
        } else {
            // 맵핑이 없으면 삼각형 인덱스를 그대로 사용
            entityIndex = vTriangleIndex;
        }
    } else if (uKind == 2.0) { // Edge
        entityIndex = uEntityIndex;
    } else if (uKind == 1.0) { // Vertex
        entityIndex = uEntityIndex;
    }
    
    // 출력 포맷:
    // R,G: 엔티티 인덱스 (16비트)
    // B: kind (1=vertex, 2=edge, 3=face)
    // A: 1.0 (불투명)
    
    vec2 encodedIndex = encodeInt16(entityIndex);
    
    gl_FragColor = vec4(
        encodedIndex.x,
        encodedIndex.y,
        uKind / 255.0,
        1.0
    );
}
