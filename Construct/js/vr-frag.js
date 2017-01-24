// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* global mat4, WGLUProgram */

window.VRCubeSea = (function () {
  "use strict";

  var cubeSeaVS = [
    "uniform mat4 projectionMat;",
    "uniform mat4 modelViewMat;",
    "attribute vec3 position;",
    "attribute vec2 texCoord;",
    "varying vec2 vTexCoord;",

    "void main() {",
    "  vTexCoord = texCoord;",
    "  gl_Position = projectionMat * modelViewMat * vec4( position, 1.0 );",
    "}",
  ].join("\n");

  var cubeSeaFS = [
    "precision mediump float;",
    "varying vec2 vTexCoord;",

    "void main() {",
    "  gl_FragColor = vec4(vTexCoord,1.,1.);",
    "}",
  ].join("\n");

  var CubeSea = function (gl) {
    this.gl = gl;

    this.program = new WGLUProgram(gl);
    this.program.attachShaderSource(cubeSeaVS, gl.VERTEX_SHADER);
    this.program.attachShaderSource(cubeSeaFS, gl.FRAGMENT_SHADER);
    this.program.bindAttribLocation({
      position: 0,
      texCoord: 1
    });
    this.program.link();

    var cubeVerts = [];
    var cubeIndices = [];

    // Build a single cube.
    function appendCube (x, y, z) {
      if (!x && !y && !z) {
        // Don't create a cube in the center.
        return;
      }

      var size = 0.2;
      // Bottom
      var idx = cubeVerts.length / 5.0;
      cubeIndices.push(idx, idx + 1, idx + 2);
      cubeIndices.push(idx, idx + 2, idx + 3);

      cubeVerts.push(x - size, y - size, z - size, 0.0, 1.0);
      cubeVerts.push(x + size, y - size, z - size, 1.0, 1.0);
      cubeVerts.push(x + size, y - size, z + size, 1.0, 0.0);
      cubeVerts.push(x - size, y - size, z + size, 0.0, 0.0);

      // Top
      idx = cubeVerts.length / 5.0;
      cubeIndices.push(idx, idx + 2, idx + 1);
      cubeIndices.push(idx, idx + 3, idx + 2);

      cubeVerts.push(x - size, y + size, z - size, 0.0, 0.0);
      cubeVerts.push(x + size, y + size, z - size, 1.0, 0.0);
      cubeVerts.push(x + size, y + size, z + size, 1.0, 1.0);
      cubeVerts.push(x - size, y + size, z + size, 0.0, 1.0);

      // Left
      idx = cubeVerts.length / 5.0;
      cubeIndices.push(idx, idx + 2, idx + 1);
      cubeIndices.push(idx, idx + 3, idx + 2);

      cubeVerts.push(x - size, y - size, z - size, 0.0, 1.0);
      cubeVerts.push(x - size, y + size, z - size, 0.0, 0.0);
      cubeVerts.push(x - size, y + size, z + size, 1.0, 0.0);
      cubeVerts.push(x - size, y - size, z + size, 1.0, 1.0);

      // Right
      idx = cubeVerts.length / 5.0;
      cubeIndices.push(idx, idx + 1, idx + 2);
      cubeIndices.push(idx, idx + 2, idx + 3);

      cubeVerts.push(x + size, y - size, z - size, 1.0, 1.0);
      cubeVerts.push(x + size, y + size, z - size, 1.0, 0.0);
      cubeVerts.push(x + size, y + size, z + size, 0.0, 0.0);
      cubeVerts.push(x + size, y - size, z + size, 0.0, 1.0);

      // Back
      idx = cubeVerts.length / 5.0;
      cubeIndices.push(idx, idx + 2, idx + 1);
      cubeIndices.push(idx, idx + 3, idx + 2);

      cubeVerts.push(x - size, y - size, z - size, 1.0, 1.0);
      cubeVerts.push(x + size, y - size, z - size, 0.0, 1.0);
      cubeVerts.push(x + size, y + size, z - size, 0.0, 0.0);
      cubeVerts.push(x - size, y + size, z - size, 1.0, 0.0);

      // Front
      idx = cubeVerts.length / 5.0;
      cubeIndices.push(idx, idx + 1, idx + 2);
      cubeIndices.push(idx, idx + 2, idx + 3);

      cubeVerts.push(x - size, y - size, z + size, 0.0, 1.0);
      cubeVerts.push(x + size, y - size, z + size, 1.0, 1.0);
      cubeVerts.push(x + size, y + size, z + size, 1.0, 0.0);
      cubeVerts.push(x - size, y + size, z + size, 0.0, 0.0);
    }

    var gridSize = 1;

    // Build the cube sea
    for (var x = 0; x < gridSize; ++x) {
      for (var y = 0; y < gridSize; ++y) {
        for (var z = 0; z < gridSize; ++z) {
          appendCube(x - (gridSize / 2), y - (gridSize / 2), z - (gridSize / 2));
        }
      }
    }

    this.vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerts), gl.STATIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

    this.indexCount = cubeIndices.length;
  };

  CubeSea.prototype.render = function (projectionMat, modelViewMat, stats) {
    var gl = this.gl;
    var program = this.program;

    program.use();

    gl.uniformMatrix4fv(program.uniform.projectionMat, false, projectionMat);
    gl.uniformMatrix4fv(program.uniform.modelViewMat, false, modelViewMat);

    gl.enableVertexAttribArray(program.attrib.position);
    gl.enableVertexAttribArray(program.attrib.texCoord);

    gl.vertexAttribPointer(program.attrib.position, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(program.attrib.texCoord, 2, gl.FLOAT, false, 20, 12);

    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

  };

  return CubeSea;
})();
