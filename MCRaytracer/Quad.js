var Quad = function(gl) {
    //új buffer
    this.vertexBuffer = gl.createBuffer();
    //ami vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    //data a vertexbufferbe
    //JS miatt Float32Array-el csináljuk
    //képernyő koordinátában itt a pontok
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1.0, -1.0, -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0
        ]),
        gl.STATIC_DRAW);
    //adatból hány alkot egy vertexet
    this.vertexBuffer.itemSize = 2;
    //hány darab vertex van
    this.vertexBuffer.numItems = 4;

    //Vertex Shader
    this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
    //Vertex shader tartalma
    gl.shaderSource(this.vertexShader, vsQuadSrc);
    /*
          " attribute vec2 vPosition; void main() { " +
          "       gl_Position = vec4(vPosition, 0.99, 1); } "
          */
    //Compileoljuk a shadert
    gl.compileShader(this.vertexShader);
    //Get shader error
    output.textContent += gl.getShaderInfoLog(this.vertexShader);

    //Fragment shader
    this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.fragmentShader, psQuadric);

    gl.compileShader(this.fragmentShader);

    //Get shader error
    output.textContent += gl.getShaderInfoLog(this.fragmentShader);

    //Shadereknek programot csinálunk
    this.program = gl.createProgram();
    //Összegyúrjuk őket
    gl.attachShader(this.program, this.vertexShader);
    gl.attachShader(this.program, this.fragmentShader);
    //linkeljük
    gl.linkProgram(this.program);
    //error log
    output.textContent += gl.getProgramInfoLog(this.program);

    this.positionAttributeIndex = gl.getAttribLocation(this.program, 'vPosition');

    this.viewDirMatrixLocation = gl.getUniformLocation(this.program, 'viewDirMatrix');
    this.eyeLocation = gl.getUniformLocation(this.program, 'eye');
    this.quadricsLocation = gl.getUniformLocation(this.program,'quadrics');
    this.materialsLocation = gl.getUniformLocation(this.program,'materials');
    this.time = gl.getUniformLocation(this.program, 'time');
    this.startTime = Date.now();
}

Quad.prototype.makeSphere = function(){
    return new Matrix4( 1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0,-1.0);
}


Quad.prototype.draw = function(gl, camera) {
    //Összerakott shadereket használjuk
    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(this.positionAttributeIndex);
    //AttributeIndex-ből, 2-esével, Floatonként, false->normalizált, 8 két vertex között byte, 0-> eltolás
    gl.vertexAttribPointer(this.positionAttributeIndex,
        2, gl.FLOAT,
        false, 8,
        0);

    viewDirMatrixData = new Float32Array(16);
    camera.viewDirMatrix.copyIntoArray(viewDirMatrixData, 0);
    gl.uniformMatrix4fv(this.viewDirMatrixLocation, false, viewDirMatrixData);

    gl.uniform3f(this.eyeLocation, camera.position.x, camera.position.y, camera.position.z);

    //gömbök rajzolása
    this.quadricData =
        new Float32Array(16*32);
    this.materialData =
        new Float32Array(16*4);
    //base objektum
    A = this.makeSphere();
    A.copyIntoArray(this.quadricData, 0);
    //clipping objektum az A-hoz
    B = this.makeSphere();
    scaler = new Matrix4();
    scaler.setIdentity();
    scaler.setDiagonal(new Vector4(0.5, 1.9, 0.9, 1.0));
    B.multiply(scaler);
    scaler.transpose();
    B = scaler.mult(B);
    B.copyIntoArray(this.quadricData, 16);


  /*  C = this.makeSphere();
    C.copyIntoArray(this.quadricData, 32);

    D = this.makeSphere();
    scaler = new Matrix4();
    scaler.setIdentity();
    scaler.setDiagonal(new Vector4(2.0, 0.5, 0.9, 1));
    D.multiply(scaler);
    scaler.transpose();
    D = scaler.mult(D);
    D.copyIntoArray(this.quadricData, 48);*/



    //első 3 szám a diffúz érték, a 4. az hogy türöződik e
    this.materialData[0] = 1;
    this.materialData[1] = 1;
    this.materialData[2] = 1;
    this.materialData[3] = 0;
    this.materialData[4] = 1;
    this.materialData[5] = 1;
    this.materialData[6] = 0;
    this.materialData[7] = 0;

    gl.uniformMatrix4fv(this.quadricsLocation, false, this.quadricData);
    gl.uniform4fv(this.materialsLocation, this.materialData);
    gl.uniform1i(this.time, Date.now() - this.startTime);

    //Kirajzol, triangle stripben
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

}
