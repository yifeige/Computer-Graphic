var VSHADER_SOURCE =
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
  //  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  //  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';
var RA = 0;
var RB = 0;
var ANGLE_STEP = 45.0;
var Color_STEP = 1.0;
var isDrag = false; // mouse-drag: true when user holds down mouse button
var xMclik = 0;
var yMclik = 0;
var xMclik1 = 0.6; // last mouse button-down position (in CVV coords)
var yMclik1 = 0.6;
var xMdragTot = 0.0; // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot = 0.0;

function main() {
  //==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  var n = initVertexBuffers(gl, currentColor);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
  window.addEventListener("keydown", myKeyDown, false);
  canvas.onmousedown = function(ev) {
    myMouseDown(ev, gl, canvas)
  };

  // when user's mouse button goes down call mouseDown() function
  canvas.onmousemove = function(ev) {
    myMouseMove(ev, gl, canvas)
  };

  // call mouseMove() function          
  canvas.onmouseup = function(ev) {
    myMouseUp(ev, gl, canvas)
  };
  // Get storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  console.log('\ndraw() fcn, line 152: translate1. rotate1. \nDraw box.\n');
  // Current rotation angle
  var currentAngle = 0.0;
  var currentRoute = 0;
  var currentColor = 0;
  // Model matrix
  var modelMatrix = new Matrix4();
  var oriMatrix = new Matrix4();
  oriMatrix = modelMatrix;

  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle); // Update the rotation angle
    currentColor = animate2(currentColor);
    var n = initVertexBuffers(gl, currentColor);
    drawHand(gl, n, currentAngle, modelMatrix, u_ModelMatrix, RA, RB, currentColor); // Draw the triangle
    currentRoute = animate1(currentRoute);
    document.getElementById('CurAngleDisplay').innerHTML =
      'CurrentSpeed= ' + Math.abs(ANGLE_STEP);
    drawPlane(gl, n, currentAngle, oriMatrix, u_ModelMatrix, currentRoute);
    requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
  };
  tick();

}

function initVertexBuffers(gl, currentColor) {

  currentColor = currentColor * 2;
  //==============================================================================
  var colorShapes = new Float32Array([
    //finger
    0.0, 0.0, 0.1, 1.00, 0, 0 + currentColor, 1 - currentColor, //4 
    0.0, 0.2, 0.1, 1.00, 0 + currentColor, 0, 1 - currentColor, //3
    0.1, 0.0, 0.1, 1.00, 0 + currentColor, 1, 0 + currentColor, //7
    0.1, 0.2, 0.1, 1.00, 0, 1 - currentColor, 1 - currentColor, //8
    0.1, 0.2, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, //5
    0.0, 0.2, 0.1, 1.00, 1 - currentColor, 0, 1 - currentColor, //3
    0.0, 0.2, 0.0, 1.00, 1, 1 - currentColor, 0 + currentColor, //1
    0.0, 0.0, 0.1, 1.00, 1 - currentColor, 1, 1 - currentColor, //4
    0.0, 0.0, 0.0, 1.00, 0 + currentColor, 0 + currentColor, 1, //2
    0.1, 0.0, 0.1, 1.00, 0, 0 + currentColor, 1 - currentColor, //7
    0.1, 0.0, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 0, //6
    0.1, 0.2, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 1, //5
    0.0, 0.0, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, //2
    0.0, 0.2, 0.0, 1.00, 1, 0 + currentColor, 1 - currentColor, //1

    //paw
    0.0, 0.0, 0.1, 1.00, 0, 0 + currentColor, 1 - currentColor, //4 
    0.0, 0.5, 0.1, 1.00, 0 + currentColor, 0, 1 - currentColor, //3
    0.45, 0.0, 0.1, 1.00, 0 + currentColor, 1, 0 + currentColor, //7
    0.45, 0.5, 0.1, 1.00, 0, 1 - currentColor, 1 - currentColor, //8
    0.45, 0.5, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, //5
    0.0, 0.5, 0.1, 1.00, 1 - currentColor, 0, 1 - currentColor, //3
    0.0, 0.5, 0.0, 1.00, 1, 1 - currentColor, 0 + currentColor, //1
    0.0, 0.0, 0.1, 1.00, 1 - currentColor, 1, 1 - currentColor, //4
    0.0, 0.0, 0.0, 1.00, 0 + currentColor, 0 + currentColor, 1, //2
    0.45, 0.0, 0.1, 1.00, 0, 0 + currentColor, 1 - currentColor, //7
    0.45, 0.0, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 0, //6
    0.45, 0.5, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 1, //5
    0.0, 0.0, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, //2
    0.0, 0.5, 0.0, 1.00, 1, 0 + currentColor, 1 - currentColor, //1

    // paper plane
    0.0, 0.0, 0.0, 1.00, 1, 1, 1,
    0.3, 0.8, 0.0, 1.00, 0.8, 0.8, 0.8,
    0.28, 0.0, 0.0, 1.00, 0.9, 0.9, 0.9,

    0.32, 0.0, 0.0, 1.00, 0.9, 0.9, 0.9,
    0.3, 0.8, 0.0, 1.00, 0.8, 0.8, 0.8,
    0.6, 0.0, 0.0, 1.00, 1, 1, 1,

    0.3, 0.8, 0.0, 1.00, 0.8, 0.8, 0.8,
    0.28, 0.0, 0.0, 1.00, 0.6, 0.6, 0.6,
    0.3, 0.0, -0.2, 1.00, 0.5, 0.5, 0.5,

    0.3, 0.8, 0.0, 1.00, 0.8, 0.8, 0.8,
    0.32, 0.0, 0.0, 1.00, 0.6, 0.6, 0.6,
    0.3, 0.0, -0.2, 1.00, 0.5, 0.5, 0.5,

    //line
    0.0, 0.0, 0.0, 1.00, 1, 1, 1,
    0.05, 0.05, 0.0, 1.00, 1, 1, 1,

  ]);
  var n = 42; // The number of vertices

  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
  var FSIZE = colorShapes.BYTES_PER_ELEMENT;

  // Assign the buffer object to a_Position variable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(
    a_Position, // choose Vertex Shader attribute to fill with data
    4, // how many values? 1,2,3 or 4.  (we're using x,y,z,w)
    gl.FLOAT, // data type for each value: usually gl.FLOAT
    false, // did we supply fixed-point data AND it needs normalizing?
    FSIZE * 7, // Stride -- how many bytes used to store each vertex?
    // (x,y,z,w, r,g,b) * bytes/value
    0);
  gl.enableVertexAttribArray(a_Position);
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(
    a_Color, // choose Vertex Shader attribute to fill with data
    3, // how many values? 1,2,3 or 4. (we're using R,G,B)
    gl.FLOAT, // data type for each value: usually gl.FLOAT
    false, // did we supply fixed-point data AND it needs normalizing?
    FSIZE * 7, // Stride -- how many bytes used to store each vertex?
    // (x,y,z,w, r,g,b) * bytes/value
    FSIZE * 4); // Offset -- how many bytes from START of buffer to the
  // value we will actually use?  Need to skip over x,y,z,w

  gl.enableVertexAttribArray(a_Color);
  // Enable assignment of vertex buffer object's position data

  //--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return n;

}

function drawHand(gl, n, currentAngle, modelMatrix, u_ModelMatrix, RA, RB, currentColor) {
  //==============================================================================
  // Clear <canvas>

  gl.clear(gl.COLOR_BUFFER_BIT);
  var shapeChange = currentColor / 3;

  //paw
  modelMatrix.setTranslate(-0.8 + RA, -0.8 + RB, 0.0); // 'set' means DISCARD old matrix,

  var dist = Math.sqrt(xMdragTot * xMdragTot + yMdragTot * yMdragTot);
  // why add 0.001? avoids divide-by-zero in next statement
  // in cases where user didn't drag the mouse.)
  modelMatrix.rotate(dist * 120.0, -yMdragTot + 0.0001, xMdragTot + 0.0001, 0.0);
  modelMatrix.scale(1 - shapeChange, 1 - shapeChange, 1 - shapeChange);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 14, 14);
  //-------little finger---------------
  pushMatrix(modelMatrix);
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.05, 0.5, 0.05);
  modelMatrix.scale(0.8, 0.8, 0.8);
  modelMatrix.rotate(currentAngle, 1, 0, 0); // Make new drawing axes that
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle * 0.8, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);

  //----RingFinger----

  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.15, 0.5, 0.05);
  modelMatrix.rotate(currentAngle, 1, 0, 0); // Make new drawing axes that
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle * 0.8, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);

  //----middle finger---
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.27, 0.5, 0.05);
  modelMatrix.scale(1.1, 1.1, 1.1);
  modelMatrix.rotate(currentAngle, 1, 0, 0); // Make new drawing axes that
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle * 0.8, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);

  //----forefinger----
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.39, 0.5, 0.05);
  modelMatrix.rotate(currentAngle, 1, 0, 0); // Make new drawing axes that
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
 gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle * 0.8, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);

  //--thumb---
  modelMatrix = popMatrix();
  pushMatrix(modelMatrix);
  modelMatrix.translate(0.43, 0.3, 0.05);
  modelMatrix.rotate(-45, 0, 0, 1);
  modelMatrix.scale(1.1, 0.8, 1.1)
  modelMatrix.rotate(currentAngle * 0.7, 1, 0, 0); // Make new drawing axes that
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
  modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
  modelMatrix.scale(0.85, 0.85, 0.85);
  modelMatrix.rotate(currentAngle * 0.6, 1, 0, 0);
  modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
}

function drawPlane(gl, n, currentAngle, oriMatrix, u_ModelMatrix, currentRoute) {
// do not clear the canvas so the plane can show with the hand
  var rute = 0;
  modelMatrix = oriMatrix;
  modelMatrix.setTranslate(xMclik1, yMclik1, 0);
  modelMatrix.rotate(currentRoute * 2, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.LINES, 40, 2);
  modelMatrix.translate(0.1 / 2, 0.1 / 2, 0);
  modelMatrix.rotate(currentRoute * 1.95, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.LINES, 40, 2);
  modelMatrix.translate(0.1 / 2, 0.1 / 2, 0);
  modelMatrix.rotate(currentRoute * 1.9, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.LINES, 40, 2);
  modelMatrix.translate(0.1 / 2, 0.1 / 2, 0);
  modelMatrix.rotate(currentRoute * 1.85, 0, 1, 0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.LINES, 40, 2);
  modelMatrix.translate(0.1 / 2, 0.1 / 2, 0); // 'set' means DISCARD old matrix,
  modelMatrix.scale(0.35, 0.35, 0.35);
  modelMatrix.rotate(90, 0, 0, 1);
  modelMatrix.rotate(-180, 0, 1, 0);
  modelMatrix.rotate(40, 1, 0, 0)
  modelMatrix.rotate(currentAngle, 0, 1, 0); // Make new drawing axes that
  modelMatrix.translate(-0.3, 0, 0.2);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 28, 12);

}

var g_last = Date.now();

function animate(angle) { // for finger control. form -85 to 0 degree.
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  if (angle > 0.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if (angle < -85.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;

  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}
var t_last = Date.now();

function animate1(rute) { //for plane control, runs 360 degrees.

  var t_now = Date.now();
  var t_elapsed = t_now - t_last;
  t_last = t_now;
  var newrute = rute + (Math.abs(ANGLE_STEP) * t_elapsed) / 1000.0;
  return newrute;

}
var tt_last = Date.now();

function animate2(colorchange) { // for color change and shape change, from 0-0.5

  var tt_now = Date.now();
  var tt_elapsed = tt_now - tt_last;
  tt_last = tt_now;
  if (colorchange < 0.0 && Color_STEP < 0) Color_STEP = -Color_STEP;
  if (colorchange > 0.5 && Color_STEP > 0) Color_STEP = -Color_STEP;
  var newcolor = colorchange + (Color_STEP * tt_elapsed) / 9000.0;
  return newcolor;

}

function moreCCW() { //accelearte
  //==============================================================================

  ANGLE_STEP *= 1.15;
}

function lessCCW() { //slow down
  //==============================================================================
  ANGLE_STEP *= 0.85;
  var tt_last = Date.now();
}

function moreRA() { // move the hand
  RA += 0.05;
}

function lessRA() {
  RA -= 0.05;
}

function moreRB() {
  RB += 0.05;
}

function lessRB() {
  RB -= 0.05;
}

function help() { // help message
  alert("Press H or F1 for help!\nPress Right Arrow for Faster Speed.\nPress Left Arrow for Slower Speed.\nMouse drag for Rotating the Hand.\nPress ASDF to move the Hand.\nDouble Click to Relocate the PaperPlane.");
};

function myKeyDown(ev) {


  switch (ev.keyCode) { // keyboard listener

    case 72: 
      help();

      break;
    case 112: 
      help();

      break;
    case 39: 
      moreCCW();
      console.log(ANGLE_STEP);
      break;

    case 37: 
      lessCCW();
      console.log(ANGLE_STEP);
      break;
    case 65: 
      lessRA();
      console.log(RA);
      break;
    case 68: 
      moreRA();
      console.log(RA);
      break;
    case 87: 
      moreRB();
      console.log(RB);
      break;
    case 83: 
      lessRB();
      console.log(RB);
      break;
    default:
      console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);

      break;
  }

}

function myMouseDown(ev, gl, canvas) { // mouse click
  //==============================================================================
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  var x = (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height / 2) / //                     -1 <= y < +1.
    (canvas.height / 2);
  isDrag = true; // set our mouse-dragging flag
  if (x == xMclik && y == yMclik) // check the double click
    xMclik1 = x;
  if (x == xMclik && y == yMclik)
    yMclik1 = y;
  xMclik = x; // record where mouse-dragging began
  yMclik = y;

};


function myMouseMove(ev, gl, canvas) {
  if (isDrag == false) return; // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  //  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);

  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height / 2) / //                     -1 <= y < +1.
    (canvas.height / 2);
  //  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik); // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x; // Make next drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  //  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);

  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height / 2) / //                     -1 <= y < +1.
    (canvas.height / 2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t', x, ',\t', y);

  isDrag = false; // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  console.log('myMouseUp: xMdragTot,yMdragTot =', xMdragTot, ',\t', yMdragTot);
};