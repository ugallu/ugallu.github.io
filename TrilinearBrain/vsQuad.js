var vsQuadSrc =
` uniform mat4 viewDirMatrix;
 attribute vec2 vPosition;
 varying vec2 tex;
 varying vec3 viewDir;

 void main(void) {
   vec4 position = vec4(vPosition, 0.99, 1);
   gl_Position = position;
   vec4 hViewDir =  position * viewDirMatrix;
   viewDir = hViewDir.xyz / hViewDir.w;
   tex = (position.xy + vec2(1,1)) * vec2(0.5, -0.5);
 }`
;
