var psTraceSrc =
`
precision highp float;
varying vec3 viewDir;
uniform vec3 eye;
uniform sampler2D volume;
varying vec2 tex;

vec3 calcColor2(vec3 ambient, vec3 view, vec3 normal, vec3 light,float lightintensity){
	 ambient *= 0.2;

	 vec3 nview = normalize(view);
	 vec3 nnormal = normalize(normal);
	 vec3 nlight = normalize(light);
	 vec3 nhalf = normalize(nview+nlight);
	 vec3 reflected = reflect(nnormal*-1.0,nlight);

	 return ambient+(max(dot(nnormal,nlight),0.0)*0.6+1.9*pow(max(dot(reflected,nview),0.0),8.0))*lightintensity;
}

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

	// x is the cube-in parameter, y is the out. z flag is 0 if we avoided the cube
	return vec3(max(max(inXY, inYZ), inXZ), min(min(outXY, outYZ), outXZ), 1.0);
}


vec4 get2DTex(sampler2D tex, vec2 position, float depth){
	float row = floor(depth / 16.0 );
	float column = mod(depth, 16.0);
	return texture2D(tex, position.xy + vec2(1.0/16.0, 1.0/16.0) * vec2(column, row));
}

// get 3D texture from a cube, indexed from 0-0-0 to 1-1-1
// with trilinear interpolation
vec4 get3DTex(sampler2D tex, vec3 position){
  vec2 xy = (position.xy + vec2(0.5,0.5)) / vec2(16.0,16.0);
  float z = position.z - 0.5;

  float z1 = floor(z *  256.0);
  float z2 = z1 + 1.0;

    
  vec4 sample1 = get2DTex(tex, xy, z1);
  vec4 sample2 = get2DTex(tex, xy, z2);
  return mix(sample1, sample2, fract(z));
//  return (sample1 * (1.0-fract(z)) + sample2 * (fract(z)));
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
  // 0 isosurface, 1 opacity rc
  float prog = 0.0;

  vec4 background = vec4(vec3(0.0),1.0);
  vec4 d = vec4(normalize(viewDir), 0.0);
  vec4 e = vec4(eye, 1.0);
  // move eye to the right side
  e += vec4(1.0,0.0, -5.0,0.0);

  vec3 t = intCube(d.xyz, e.xyz);
  if(t.z == 0.0){
	// no cube-intersection
  	gl_FragColor = background;
  	return;
  }
  vec4 inCubePos;
  // step precision
  float deltaT = 1.0 / 256.0;

  //float deltaT = 0.31;
  //vec4 inCubePos = e + d*(1.0); 
  vec3 outColor = vec3(0.0);
  float val = 0.0;

  // where to start
  float beg = floor(t.x / deltaT);

  // sum lum

  float luminancy = 0.0;



  float depth = 0.0;
  
  
  for(float i = 1.0; i < 1024.0 ; i+=1.0){
	// cubepos vec3[-1,1]
  	inCubePos = e + d*(t.x+deltaT * (i));
	// transposed cubepos, vec3[0,1]
	vec3 transposedCube = (inCubePos * 0.5 + vec4(1.0,1.0,1.0,0.0)).xyz;
	// trilinear interpolated texture value
	vec3 texValue = get3DTex(volume, transposedCube ).xyz;
        if(prog == 0.0){
		if(0.35 < texValue.x){
			// isoSurface
			outColor = texValue;
			vec3 surfaceNormal = nTex(transposedCube, 0.001953125, volume);
			// phong with fix ambient color, fix light direction and intensity
			outColor = calcColor2(vec3(1.0,0.6,0.6), viewDir, surfaceNormal, vec3(1.0,2.0,5.0),0.65);
			break;
		}
	}
	else if(prog == 1.0){
		if(texValue.x > 0.1){
			depth += texValue.x * texValue.x * 8.0*1.0/1024.0;
		}
	}

	else if(prog == 2.0){
		if(texValue.x > 0.1){
			depth += 1.0/4056.0;
		}
	}

	

	if((t.x + deltaT * i) > t.y){
		// out of box break
		if(prog == 1.0){
			float csill = 0.3;
			float forr = 0.46;
			float epow = pow(2.71828, -1.0 * depth);
			outColor = vec3(luminancy * epow  + forr/csill * (1.0-epow)); 
		}
	  	break;
	}
 
  }

gl_FragColor = vec4(outColor * vec3(1.0),1.0);

}`
;
