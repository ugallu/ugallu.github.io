var fShader =
`
precision highp float;
	 varying vec3 viewDir;
	 uniform vec3 eye;

float intPlane(vec3 dir3, vec3 eye3, vec3 base, vec3 point){
 float xx = dot(dir3, base);
 float yy = dot(base, (point - eye3));
 if(xx == 0.0){
 	return 0.0;
 }
 float result = yy / xx;
 return result;
}

vec3 calcColor(vec3 ambient, vec3 view, vec3 normal, vec3 light,float lightintensity){
	 ambient *= 0.2;

	 vec3 nview = normalize(view);
	 vec3 nnormal = normalize(normal);
	 vec3 nlight = normalize(light);
	 vec3 nhalf = normalize(nview+nlight);
	 vec3 reflected = reflect(nnormal*-1.0,nlight);

	 return ambient+(max(dot(nnormal,nlight),0.0)*0.6+0.3*pow(max(dot(reflected,nview),0.0),2.0))*lightintensity;
}

void main() {

vec4 d = vec4(normalize(viewDir), 0.0);

vec3 chessBlack= vec3(0.2, 0.23, 0.3);
vec3 chessWhite = vec3(0.93, 0.9, 0.98);
vec3 pixel = vec3(0.2);

float de = 0.5;
float scale = 0.4;
float speed = 0.1;

if(abs(d.y) < 0.1 )
{
	gl_FragColor = vec4(vec3(0.0), 1.0);
	return;
}
float t = intPlane(d.xyz, eye, vec3(0.0,1.0,0.0), vec3(0.0,-0.4,0.0));

vec2 textCoord = (eye + d.xyz*t).xz;
float cube = sign((mod(textCoord.x,0.05) - 0.049) * (mod(textCoord.y,0.05) - 0.049));
float cube2 = sign((mod(textCoord.x,0.05) - 0.047) * (mod(textCoord.y,0.05) - 0.047));
//float cube = sign((mod(textCoord.x,0.1) - 0.05) * (mod(textCoord.y,0.1) - 0.05)); // chess

if(0.0 > cube) {
pixel = chessBlack;
}
else if (cube2 < 0.0){
pixel = 0.2*chessBlack + 0.8*chessWhite;
} else{
pixel = chessWhite;
}

vec3 nd = vec3(0.,0.,0.);
pixel = calcColor(pixel, d.xyz, vec3(0.0,0.0,1.0), vec3(0.0, 0.05, 1.9) , min(3.0,(1.0-length(textCoord)))*1.30 );
gl_FragColor = vec4(vec3(pixel), 1.0);
}`
;
