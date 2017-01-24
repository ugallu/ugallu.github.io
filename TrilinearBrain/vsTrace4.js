var psTraceSrc =
`
precision highp float;
varying vec3 viewDir;
uniform vec3 eye;
uniform sampler2D volume;
varying vec2 tex;

float f(vec3 point){
	// (point - kozep ).length - r
	// vec3 is enough
	vec3 kozep = vec3(0.0, 0.0, 3.5);
	float tav = abs(length(point - kozep));
	if(tav < 0.5){
		return tav * 0.1;
	}
	return 0.0;
}

vec3 n(vec3 hit, float eps){
	// df(r)/dx = f(r+(, 0, 0)) - f(r-(, 0, 0))
	float dx = f(hit + vec3(eps, 0,0)) - f(hit - vec3(eps, 0,0));
	float dy = f(hit + vec3(0, eps,0)) - f(hit - vec3(0, eps,0));
	float dz = f(hit + vec3(0,0, eps)) - f(hit - vec3(0,0, eps));
	return normalize(vec3(dx,dy, dz));
}

float intPlane(vec3 dir3, vec3 eye3, vec3 base, vec3 point){
  float xx = dot(dir3, base);
  float yy = dot(base, (point - eye3));
  if(xx == 0.0){
  	return 0.0;
  }
  float result = yy / xx;
  if(result < 0.0){
  	return 0.0;
  }
  return result;
}

// intersects cube - returns with in and out t parameters
// if not intersected, z = 0
vec3 intCube(vec3 dir3, vec3 eye3){
	// intersect left YZ plane
	float intRYZ = intPlane(dir3, eye3, vec3(1.0,0.0,0.0), vec3(-1.0,-1.0,-1.0));
	// intersect right YZ plan
	float intLYZ = intPlane(dir3, eye3, vec3(-1.0,0.0,0.0), vec3(1.0,1.0,1.0));
	// intersect upper XY plane
	float intUXZ = intPlane(dir3, eye3, vec3(0.0,1.0,0.0), vec3(-1.0,-1.0,-1.0));
	// intersect right Y plane
	float intBXZ = intPlane(dir3, eye3, vec3(0.0,-1.0,0.0), vec3(1.0,1.0,1.0));
	// intersect front XY plane
	float intFXY = intPlane(dir3, eye3, vec3(0.0,0.0,-1.0), vec3(1.0,1.0,1.0));

	float intBXY = intPlane(dir3, eye3, vec3(0.0,0.0,1.0), vec3(-1.0,-1.0,-1.0));

	float inYZ = min(intLYZ, intRYZ);
	float outYZ = max(intLYZ, intRYZ);

	float inXZ = min(intUXZ, intBXZ);
	float outXZ = max(intUXZ, intBXZ);

	float inXY = min(intBXY, intFXY);
	float outXY = max(intBXY, intFXY);

	// check if we missed the cube
	// we leave a plane before intersect the others
	if(outXY <= inYZ || outXY <= inXZ ){
		return vec3(0.0,0.0, 0.0);		
	}
	// ||  || outYZ < inXY || outYZ < inXZ
	if(outXZ <= inYZ || outXZ <= inXY ){
		return vec3(1.0,0.0, 0.0);		
	}
	if(outYZ <= inXY || outYZ <= inXZ ){
		return vec3(0.0,1.0, 0.0);		
	}
	return vec3(max(max(inXY, inYZ), inXZ), min(min(outXY, outYZ), outXZ), 1.0);
}


vec4 get2DTex(sampler2D tex, vec2 position, int depth){
	int row = int(floor(float(depth) / 16.0 ));
	int column = int(mod(float(depth), 16.0));
	return texture2D(tex, position.xy + vec2(1.0/16.0, 1.0/16.0) * vec2(column, row));
}

// get 3D texture from a cube, indexed from 0-0-0 to 1-1-1
// with trilinear interpolation
vec4 get3DTex(sampler2D tex, vec3 position){
  vec2 xy = (position.xy + vec2(0.5,0.5)) / vec2(16.0,16.0);
  float z = position.z - 0.5;
  if(z > 0.75 || z < 0.25){
  	return vec4(0.0,0.0,0.0,1.0);
  }

  int z1 = int(floor(z *  16.0));
  int z2 = int(ceil(z *  16.0 ));
  vec4 sample1 = get2DTex(tex, xy, z1);
  vec4 sample2 = get2DTex(tex, xy, z2);
  return (sample1 * (1.0-fract(position.z)) + sample2 *fract(position.z));
}

vec3 nTex(vec3 hit, float eps, sampler2D tex){
	// dget3DTex(r)/dx = get3DTex(r+(, 0, 0)) - get3DTex(r-(, 0, 0))
	float dx = get3DTex(tex, hit + vec3(eps, 0,0)).x - get3DTex(tex, hit - vec3(eps, 0,0)).x;
	float dy = get3DTex(tex, hit + vec3(0, eps,0)).x - get3DTex(tex, hit - vec3(0, eps,0)).x;
	float dz = get3DTex(tex, hit + vec3(0,0, eps)).x - get3DTex(tex, hit - vec3(0,0, eps)).x;
	return normalize(vec3(dx,dy, dz));
}

vec3 calcColor(vec4 cPos, sampler2D tex){
	vec3 transposedCube = (cPos + (vec4(0.0,0.0,-8.0,0.0)) * 0.5).xyz;
  	return nTex(transposedCube, 0.001, tex);
}

void main() {
  vec4 DDD = vec4(0.2,0.9,0.7,1.0);
  vec4 background = vec4(0.3,0.0,0.0,1.0);
  vec4 d = vec4(normalize(viewDir), 0.0);
  vec4 e = vec4(eye, 1.0);
  e += vec4(-1.0,-1.0, -5.0,0.0);

  vec3 t = intCube(d.xyz, e.xyz);
  if(t.z == 0.0){
  	gl_FragColor = vec4(vec3(0.2),1.0);
  	return;
  }
  vec4 inCubePos;
//(fInter.xyz + vec3(0.0,0.0,0.20.0))
  float deltaT = 1.0 / 16.0;
  float tt = 2.0;

  //float deltaT = 0.31;
  //vec4 inCubePos = e + d*(1.0); 
  vec3 maxColor = vec3(0.0);
  float val = 0.0;

  for(float i = 1.0; i < 4056.0 ; i+=1.0){
  	inCubePos = e + d*(t.x + deltaT * i);

  	//if((deltaT * i) > 2.29){
  	//	gl_FragColor = DDD;
  	//	return;
  		vec3 transposedCube = (inCubePos * 0.5 + vec4(1.0,1.0,1.0,0.0)).xyz;
		vec3 ccc = get3DTex(volume, transposedCube ).xyz;
  //	}
 //

  	
  	//if(val < length(ccc)){
  //		val = length(ccc);
  //		maxColor = ccc;
  //	}
  //maxColor += ccc; 
  if(0.35 < ccc.x){
	maxColor = ccc;
	break;
  }
  //tt += deltaT;
  if((t.x + deltaT * i) > t.y){
  	break;
  }
 
  }

  //gl_FragColor = vec4(calcColor(inCubePos, volume) ,1.0);
  gl_FragColor = vec4(maxColor * vec3(1.0/1.0),1.0);
  //for(int iter=0; iter<150; iter++){

  //}

}`
;