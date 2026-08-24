 #version 330 core
out vec4 FragColor;
in vec2 TexCoords;
in vec2 LightUV;
in vec3 WorldPos;
in vec3 Normal;

// material parameters
uniform sampler2D Diffuse_Map;
uniform sampler2D Normal_Map;
uniform sampler2D ORM_Map;
uniform sampler2D Light_Map;

uniform float scale;

// Light Map 처리 방식 (Rendering_Model::Draw에서 프레임당 1회 전달)
//  0 : Light Map 미사용            → lightMapFactor = 1.0 (그림자 없음)
//  1 : 파트별 Light Map            → TexCoords(UV1)로 Light_Map 직접 샘플링
//  2 : 계층 구조 repacking 아틀라스 → LightUV(UV2)로 island 보간 샘플링
uniform int lightMapMode;

//// IBL
uniform samplerCube irradianceMap;
uniform samplerCube prefilterMap;
uniform sampler2D brdfLUT;

// 조명 강도 조절 계수
const float DIRECTLIGHT = 3.0;
const float IBLDIFFUSE = 1.2;

// lights
uniform vec3 lightDirection;  ////추후에 그림자 설정할려면 필요함... 나중에 배경에 맞게 조명 위치 설정해보기!!!<아니면 아싸리 위치말고 방향 벡터로 설정해보기!!!!!!>
vec3 lightColors = vec3(1.0) * DIRECTLIGHT; ////그냥 백색광으로 설정함

uniform vec3 camPos;

const float PI = 3.14159265359;
//해당 원본 코드는 조명이 4개임에 따라 전체 조명에서 IBL에 의한 주변광이 차지하는 비율이 낮아져서 문제가 없었지만
//해당 코드에서는 조명을 1개만 사용함에 딸 주변광 비율이 높아짐에 따라 과한 주변광 반사가 발생함 [반사에서 주변광의 색상이 강하게 나타남]

// 튜닝 포인트[Light Map적용 시 UV Island 내부만 별로 보간을 위한 함수에 사용되는 상수]
const float LM_EPS    = 0.5/255.0;  // 0과 1의 경계 안전값
const float MIN_DENOM = 1e-6;

//Light Map적용 시 UV Island 내부만 별로 보간을 위한 함수
float SampleLight_LinearExcludeZero(vec2 uv)
{
    ivec2 ts  = textureSize(Light_Map, 0);
    vec2  pos = uv * vec2(ts) - 0.5;
    ivec2 i0  = ivec2(floor(pos));
    ivec2 i1  = i0 + ivec2(1,1);
    vec2  f   = fract(pos);

    i0 = clamp(i0, ivec2(0), ts - ivec2(1));
    i1 = clamp(i1, ivec2(0), ts - ivec2(1));

    float v00 = texelFetch(Light_Map, ivec2(i0.x, i0.y), 0).r;
    float v10 = texelFetch(Light_Map, ivec2(i1.x, i0.y), 0).r;
    float v01 = texelFetch(Light_Map, ivec2(i0.x, i1.y), 0).r;
    float v11 = texelFetch(Light_Map, ivec2(i1.x, i1.y), 0).r;

    float w00 = (1.0 - f.x) * (1.0 - f.y);
    float w10 = (      f.x) * (1.0 - f.y);
    float w01 = (1.0 - f.x) * (      f.y);
    float w11 = (      f.x) * (      f.y);

    float m00 = (v00 > LM_EPS) ? 1.0 : 0.0;
    float m10 = (v10 > LM_EPS) ? 1.0 : 0.0;
    float m01 = (v01 > LM_EPS) ? 1.0 : 0.0;
    float m11 = (v11 > LM_EPS) ? 1.0 : 0.0;

    float W00 = w00*m00, W10 = w10*m10, W01 = w01*m01, W11 = w11*m11;
    float denom = W00 + W10 + W01 + W11;

    // 순수 bilinear(참고/폴백)
    float lin = v00*w00 + v10*w10 + v01*w01 + v11*w11;

    return (denom > MIN_DENOM)
        ? (v00*W00 + v10*W10 + v01*W01 + v11*W11) / denom
        : lin; // 모두 0이면 블록 방지용 폴백
}

// 대형 mesh에서 텍스처 반복에 따른 특정 패턴이 발생해서 이를 방지를 위해 렌덤 요소 넣음
// Random 8-way tile rotation UV (0~315도)
vec2 getTileUV(vec2 baseUV, float scale)
{
    vec2 uv = baseUV * scale;

    ivec2 tileID = ivec2(floor(uv)); //타일의 위치 계산 (2.4, 3.5) => tileID는 (2, 3) 
    float seed = dot(vec2(tileID), vec2(127.1, 311.7));
    float rnd = fract(sin(seed) * 43758.5453);

    vec2 tileUV = fract(uv); // 타일의 위치 계산 (2.4, 3.5) => tileUV는 (0.4, 0.5) 
    // 1이상의 범위의 타일을 0~1 범위로 가져오는 것이 아닌 상대 좌표만 가져옴 => UV 좌표 위치는 그대로임

    // 선택적 랜덤 플립 (더 랜덤하게 보이게)
    if (fract(rnd * 3.0) < 0.5) tileUV.x = 1.0 - tileUV.x;
    if (fract(rnd * 5.0) < 0.5) tileUV.y = 1.0 - tileUV.y;

    // 8방향 회전 (0~315도)
    int rot = int(mod(floor(rnd * 8.0), 8));
    float angle = float(rot) * 3.14159265 / 4.0;  // 45도 단위 회전
    mat2 rotMat = mat2(cos(angle), -sin(angle),
                       sin(angle),  cos(angle));

    tileUV = rotMat * (tileUV - 0.5) + 0.5;

    return tileUV;
    //return uv; //일단 회전 안하는 코드임
} 
// 해당 방식은 0~1범위 밖의 좌표를 (0, 0) 중심으로 가져와 UV좌표를 0~1 영역에서 다른 UV 좌표와 겹치면서 사용함!! 
// 절대 high-poly 모델에 대한 normal map이나 light map에서 사용하지 말것!!!



vec3 getNormalFromMap(vec2 tileUV)
{
    vec3 tangentNormal = texture(Normal_Map, tileUV).xyz * 2.0 - 1.0;

    vec3 Q1  = dFdx(WorldPos);
    vec3 Q2  = dFdy(WorldPos);
    vec2 st1 = dFdx(TexCoords * scale);  // 여긴 그대로 둬도 괜찮음 (TBN 계산용)
    vec2 st2 = dFdy(TexCoords * scale);

    vec3 N   = normalize(Normal);
    vec3 T  = normalize(Q1 * st2.t - Q2 * st1.t);
    vec3 B  = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
}
// ----------------------------------------------------------------------------
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
// ----------------------------------------------------------------------------
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// ----------------------------------------------------------------------------
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}   
// ----------------------------------------------------------------------------
void main()
{		
    vec2 tileUV = getTileUV(TexCoords, scale);
    
    
    vec3 albedo     = pow(texture(Diffuse_Map, tileUV).rgb, vec3(2.2));
    float metallic  = texture(ORM_Map, tileUV).b;
    float roughness = texture(ORM_Map, tileUV).g;
    float ao        = texture(ORM_Map, tileUV).r;


    // ------------------------------------------------------------------
    // Light Map 밝기 계수 결정 (lightMapMode에 따라 3가지)
    //
    //  case 0 : Light Map 미사용 → 1.0 (그림자 없이 항상 밝게)
    //
    //  case 1 : 파트별 Light Map — 파트 전용 이미지를 TexCoords(UV1)로 직접 샘플링.
    //           매칭되는 png가 없는 파트에는 검은색 더미 텍스처가 바인딩되어
    //           결과가 0.0이 되므로, 별도 분기 없이 완전 그림자로 처리된다.
    //
    //  case 2 : 아틀라스(repacking) — LightUV(UV2)로 island 보간 샘플링.
    //           repacking에서 어두워 제외된 영역은 UV2가 (-1,-1)로 들어오며,
    //           이 값 하나로 완전 그림자 판정이 끝난다. 두 경우 모두 여기서 처리됨:
    //             - 파트 전체가 어두움      → 메쉬의 모든 정점이 (-1,-1)
    //             - 특정 UV island가 어두움 → 그 island 정점만 (-1,-1)
    // ------------------------------------------------------------------
    float lightMapFactor = 1.0;

    if (lightMapMode == 1)
    {
        lightMapFactor = texture(Light_Map, TexCoords).r;
    }
    else if (lightMapMode == 2)
    {
        lightMapFactor = 0.005; // UV2가 (-1,-1)인 영역 = 완전 그림자
        if (LightUV.x >= 0.0 && LightUV.y >= 0.0)
        {
            lightMapFactor = SampleLight_LinearExcludeZero(LightUV);
        }
    }


    vec3 N = getNormalFromMap(tileUV);
    vec3 V = normalize(camPos - WorldPos);
    vec3 R = reflect(-V, N); 
    // calculate reflectance at normal incidence; if dia-electric (like plastic) use F0 
    // of 0.04 and if it's a metal, use the albedo color as F0 (metallic workflow)    
    vec3 F0 = vec3(0.04); 
    F0 = mix(F0, albedo, metallic);
    

    // reflectance equation
    vec3 Lo = vec3(0.0);

    // calculate per-light radiance
    vec3 L = normalize(lightDirection); // 원본 : vec3 L = normalize(lightPositions[i] - WorldPos);[표면에서 광원으로 향하는 방향 벡터]
    //vec3 L = normalize(vec3(0.0, -1.0, 0.0)); // 위에서 아래로 비추는 방향
    vec3 H = normalize(V + L);
    //float distance = length(lightPosition - WorldPos);
    float attenuation = 1.0; // (distance * distance);//그냥 거리에 의한 감쇠는 고려하지 않도록....
    vec3 radiance = lightColors * attenuation;

    // Cook-Torrance BRDF
    float NDF = DistributionGGX(N, H, roughness);   
    float G   = GeometrySmith(N, V, L, roughness);      
    vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);
            
    vec3 numerator    = NDF * G * F; 
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001; // + 0.0001 to prevent divide by zero
    vec3 specular = numerator / denominator;
            
    // kS is equal to Fresnel
    vec3 kS = F;
    // for energy conservation, the diffuse and specular light can't
    // be above 1.0 (unless the surface emits light); to preserve this
    // relationship the diffuse component (kD) should equal 1.0 - kS.
    vec3 kD = vec3(1.0) - kS;
    // multiply kD by the inverse metalness such that only non-metals 
    // have diffuse lighting, or a linear blend if partly metal (pure metals
    // have no diffuse light).
    kD *= 1.0 - metallic;	  

    // scale light by NdotL
    float NdotL = max(dot(N, L), 0.0);        

    // add to outgoing radiance Lo
    //Lo += (kD * albedo / PI + specular) * radiance * NdotL;  // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again  
    //Lo *= lightMapFactor; //그림자 효과 적용
    //위의 두 코드는 NdotL과 LightMap(NdotL 효과 적용됨)에 의해 효과가 중첩되어 NdotL을 제거함
    Lo += (kD * albedo / PI + specular) * radiance * lightMapFactor;  // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again  




    // ambient lighting (note that the next IBL tutorial will replace 
    // this ambient lighting with environment lighting).

    // ambient lighting (we now use IBL as the ambient term)
    vec3 F_IBL_D = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);


    ////ibl irradiance


    vec3 kS_IBL_D = F_IBL_D;
    vec3 kD_IBL_D = 1.0 - kS_IBL_D;
    kD_IBL_D *= 1.0 - metallic;	  
    
    vec3 irradiance = texture(irradianceMap, N).rgb * IBLDIFFUSE;
    vec3 diffuse      = irradiance * albedo;
    ////ibl 


    // sample both the pre-filter map and the BRDF lut and combine them together as per the Split-Sum approximation to get the IBL specular part.
    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = textureLod(prefilterMap, R,  roughness * MAX_REFLECTION_LOD).rgb;    
    vec2 brdf  = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
    vec3 specular_IBL_S = prefilteredColor * (F_IBL_D * brdf.x + brdf.y);

    vec3 ambient = (kD_IBL_D * diffuse + specular_IBL_S) * ao;

    // soft shadow ambient 보정
    vec3 ambientShadowFactor = mix(vec3(0.3), vec3(1.0), lightMapFactor);// 그림자 안에서도 최소 반사 유지
    vec3 color = ambient * ambientShadowFactor + Lo;

    //vec3 color = ambient + Lo;

    // HDR tonemapping
    color = color / (color + vec3(1.0));
    // gamma correct
    color = pow(color, vec3(1.0/2.2)); 

    FragColor = vec4(color, 1.0);
}