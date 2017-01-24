var vShader =
` uniform mat4 viewDirMatrix;
 attribute vec2 vPosition;

 varying vec3 viewDir;

 void main(void) {
   vec4 position = vec4(vPosition, 0.99, 1);
   gl_Position = position;
   vec4 hViewDir =  position * viewDirMatrix;
   viewDir = hViewDir.xyz / hViewDir.w;
 }`
;
