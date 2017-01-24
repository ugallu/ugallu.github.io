var psQuadric = `
precision highp float;
varying vec3 viewDir;
uniform vec3 eye;
uniform int time;

uniform mat4 quadrics[32];
 uniform vec4 materials[16];

 // http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
 highp float rand(vec2 co)
 {
     highp float a = 12.9898;
     highp float b = 78.233;
     highp float c = 43758.5453;
     highp float dt= dot(co.xy ,vec2(a,b));
     highp float sn= mod(dt,3.14);
     return fract(sin(sn) * c);
 }

 vec3 calcColor2(vec3 ambient, vec3 view, vec3 normal, vec3 light,float lightintensity){
 	 ambient *= 0.2;

 	 vec3 nview = normalize(view);
 	 vec3 nnormal = normalize(normal);
 	 vec3 nlight = normalize(light);
 	 vec3 nhalf = normalize(nview+nlight);
 	 vec3 reflected = reflect(nnormal*-1.0,nlight);

 	 return ambient+(max(dot(nnormal,nlight),0.0)*0.6+1.9*pow(max(dot(reflected,nview),0.0),8.0))*lightintensity;
 }


vec3 getQuadricNormal(mat4 A, vec4 hit)
{
  return vec3(hit.x,hit.y,hit.z);
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

float intPlane2(vec3 dir3, vec3 eye3, vec3 base, vec3 point, float distance){
  float xx = dot(dir3, base);
  float yy = dot(base, (point - eye3));
  if(xx == 0.0){
  	return 0.0;
  }
  float result = yy / xx;
  if(result < 0.0){
  	return 0.0;
  }
  float d =length((result*dir3+eye3)-point);
  if(d < distance){
    return result;
  }
  else{
    return 0.0;
  }
}

// intersects cube - returns with in and out t parameters
// if not intersected, z = 0
vec3 intCube(vec3 dir3, vec3 eye3, vec3 p1, vec3 p2){
	// intersect left YZ plane
	float intRYZ = intPlane(dir3, eye3, vec3(1.0,0.0,0.0), p1);
	// intersect right YZ plan
	float intLYZ = intPlane(dir3, eye3, vec3(-1.0,0.0,0.0), p2);
	// intersect upper XY plane
	float intUXZ = intPlane(dir3, eye3, vec3(0.0,1.0,0.0), p1);
	// intersect right Y plane
	float intBXZ = intPlane(dir3, eye3, vec3(0.0,-1.0,0.0), p2);
	// intersect front XY plane
	float intFXY = intPlane(dir3, eye3, vec3(0.0,0.0,-1.0), p2);

	float intBXY = intPlane(dir3, eye3, vec3(0.0,0.0,1.0), p1);

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

float intersectClippedQuadric(
    mat4 A, mat4 B, vec4 e, vec4 d) {
    float a = dot( d, A * d);
    float b = dot( e, A * d) + dot(d, A * e );
    float c = dot( e, A * e );

    float discr = b * b - 4.0 * a * c;
    if ( discr < 0.0 )
        return -1.0;
    float sqrt_discr = sqrt( discr );
    float t1 = (-b + sqrt_discr)/2.0/a;
    float t2 = (-b - sqrt_discr)/2.0/a;
    vec4 hit1 = e + d * t1;
    vec4 hit2 = e + d * t2;
    if( dot( hit1, B * hit1) > 0.0)
        t1 = -1.0;
    if( dot( hit2, B * hit2) > 0.0)
        t2 = -1.0;

    float t = (t1<t2)?t1:t2;
    if(t < 0.0)
        t = (t1<t2)?t2:t1;
    return t;
}

vec3 trace(inout vec4 e, inout vec4 d, inout float contrib)
{

  int type = 0;
  vec3 background = vec3(0.2, 0.2, 0.9);

  float bestT = 10000.0;
  vec4 bestMaterial;
  mat4 bestQuadric;
  for(int i=0; i<2; i++) {
    float t = intersectClippedQuadric(quadrics[2*i], quadrics[2*i+1], e, d);
    if(t > 0.0 && t < bestT) {
      type = 0;
      bestT = t;
      bestQuadric = quadrics[2*i];
      bestMaterial = materials[i];
      bestMaterial.xyz *= vec3(0.5,1.0,0.4);
    }
  }
/*  if(bestT<7.50 && bestT > 0.0){
    return vec3(1.0,0.0,0.0);
  }*/

  // hit light
  vec3 lightnormal = vec3(0.0, 0.0,1.0);
  vec3 lightPos = vec3(0.5,2.5,0.0);
  float t = intPlane2(e.xyz, d.xyz, lightnormal, lightPos,0.035);

  if(t > 0.0 && t < bestT) {
    type = 1;
    bestT = t;
  }

  // hit ground
  vec3 groundnormal = vec3(0.0, 1.0,0.0);
  t = (-0.5 - e.y) / d.y;
  if(t > 0.0 && t < bestT) {
    bestMaterial = vec4(1.0,1.0,0.3,0.0);
    type = 2;
    bestT = t;
  }

  vec3 cube = intCube(d.xyz,e.xyz,vec3(0.4,1.0,0.4),vec3(-0.4,0.0,-0.4));
  t = cube.x;
  if(cube.z > 0.0 && t > 0.0 && t < bestT) {
    bestMaterial = vec4(vec3(1.0),0.0);
    type = 3;
    bestT = t;
  }

  if(bestT > 9999.0)
      return vec3(0.2); // invalid
  vec4 hit = e + d*bestT;

  // normal
  vec3 normal;
  if(type== 0){
    normal = getQuadricNormal(bestQuadric, hit);
  }
  else if(type == 1){
    return vec3(1.0);
  }
  else if(type == 2){
    normal = groundnormal;
    bestMaterial = vec4(1.0,1.0,1.0,0.0);
  }
  else if(type == 3){
    normal = vec3(0.0,0.0,-1.0);
    bestMaterial = vec4(0.3,0.2,0.3,0.0);
  }

  // árnyalás, szín return
  float g = contrib;
  contrib *= bestMaterial.w; //tükröződik e a felület

  if( bestMaterial.w < 0.01 ) {
      return calcColor2(bestMaterial.xyz, d.xyz, normal, (bestT*d.xyz+e.xyz) - lightPos, pow(1.5,max(0.0,(5.0-length((bestT*d.xyz+e.xyz) - lightPos))))*0.5);
      } else {
        e = hit - vec4(normal, 0.0) * 0.001; //kijebb hozzuk a pontot hogy a következő hit ne az objektumba ütközzön
        d.xyz = reflect(d.xyz, -normal);
        return normal; //rekurzív által kiszámolt szín
      }

   // nothing was hitten
   return background;
}

float randN(vec4 d,float t){
  float fineness = 0.001;
  return fineness*0.5-fineness*rand(vec2(d.x*d.y*t, d.x*d.z*t));
}

void main() {
    vec4 d = vec4(normalize(viewDir), 0.0);
    vec4 e = vec4(eye, 1.0);
    e+= vec4(0.5,1.0, -6.0,0.0);

    // noise
    float t = float(time);
    d += vec4(randN(d,t),randN(d,t),randN(d,t), 0.0);

    //rekurzív trace tükröződéssel
    vec4 outColor = vec4(0.0, 0.0, 0.0, 1.0);
        float contrib = 1.0;
        for(int iReflection=0; iReflection<1; iReflection++)
        {
          outColor.xyz += trace(e, d, contrib);
          if(contrib < 0.05)
            break;
        }

        gl_FragColor = outColor;

} `;
