#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoords;
layout (location = 5) in vec2 aLightUV;  

out vec2 TexCoords;
out vec2 LightUV; 
out vec3 WorldPos;
out vec3 Normal;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

void main()
{
    TexCoords = aTexCoords;
    LightUV   = aLightUV;
    WorldPos = vec3(model * vec4(aPos, 1.0));

    mat3 normalMatrix = transpose(inverse(mat3(model)));
    Normal = normalize(normalMatrix * aNormal);


    gl_Position =  projection * view * vec4(WorldPos, 1.0);
}