#version 330 core
out vec4 FragColor;
in vec3 WorldPos;

uniform sampler2D equirectangularMap;

const vec2 invAtan = vec2(0.1591, 0.3183);
const float exposure = 2.0;  // 필요에 따라 0.5, 1.0, 2.0 등으로 조절

vec2 SampleSphericalMap(vec3 v)
{
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main()
{		
    vec2 uv = SampleSphericalMap(normalize(WorldPos));
    vec3 color = texture(equirectangularMap, uv).rgb;

    // exposure 적용 (선택적으로 사용)
    color *= exposure;

    // Reinhard tone mapping 적용
    color = color / (color + vec3(1.0));

    // 음수 값 방어
    color = max(color, vec3(0.0));

    FragColor = vec4(color, 1.0);
}
