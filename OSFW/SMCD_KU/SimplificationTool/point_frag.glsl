#version 430 core

in VS_OUT
{
	vec4 color;
}fs_in;

out vec4 color;

void main (void)  
{   
	if(fs_in.color.a == 0)
		discard;

	color = fs_in.color;
}        