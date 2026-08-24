#version 430 core
layout (location = 0) in vec3 position;
layout (location = 1) in uint picked;
layout (location = 2) in uint color;

uniform mat4 umvMat;
uniform mat4 upMat;
uniform float ufSize;

out VS_OUT
{
	vec4 color;
}vs_out;

void main(void)
{
	if (picked > 0)
	{
		vs_out.color = vec4(0.0,0.0,1.0,1.0);
		gl_PointSize = ufSize + 3.0;
	}
	else
	{
		uint i_r = (color >> 16) & 0x000000ff;
		uint i_g = (color >> 8) & 0x000000ff;
		uint i_b = (color ) & 0x000000ff;
		float r = float(i_r) / 255.0;
		float g = float(i_g) / 255.0;
		float b = float(i_b) / 255.0;
		vs_out.color = vec4(r,g,b,1.0);

		//vs_out.color = vec4(0.0,0.0,1.0,1.0);
		
		gl_PointSize = ufSize;
	}
	
	//gl_PointSize = ufSize;
	gl_Position = upMat * umvMat * vec4(position, 1.0);
	
}       