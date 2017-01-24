var Quad = function(gl)
{
	var output = document.getElementById("output");

	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array( [
               -1.0, -1.0,
               -1.0,  1.0,
                1.0, -1.0,
                1.0, 1.0 ] ),
                gl.STATIC_DRAW);
    this.vertexBuffer.itemSize = 2;
    this.vertexBuffer.numItems = 4;
    this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.vertexShader,
      vShader
      );
    gl.compileShader(this.vertexShader);
    output.textContent += gl.getShaderInfoLog(this.vertexShader);
    this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fragmentShader,
       fShader
       );
    gl.compileShader(this.fragmentShader);
    output.textContent +=
			gl.getShaderInfoLog(this.fragmentShader);
      this.program = gl.createProgram();
    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);
    gl.linkProgram(this.program);
    output.textContent += gl.getProgramInfoLog(this.program);
    this.positionAttributeIndex =
gl.getAttribLocation(this.program, 'vPosition');

this.viewDirMatrixLocation =
   gl.getUniformLocation(this.program,'viewDirMatrix');
 this.eyeLocation = gl.getUniformLocation(this.program,'eye');

} // Quad constructor ends

Quad.prototype.draw = function(gl, viewMat)  {
	  //vec4 camera = viewMat;
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray( this.positionAttributeIndex);
    gl.vertexAttribPointer( this.positionAttributeIndex,
          2, gl.FLOAT,
          false, 8,
          0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    viewDirMatrixData = viewMat; // new Float32Array(16);

     //camera.viewDirMatrix.copyIntoArray(viewDirMatrixData, 0);
     gl.uniformMatrix4fv(this.viewDirMatrixLocation, false, viewDirMatrixData);

     gl.uniform3f(this.eyeLocation, 0.0,0.0,0.0);
  }
