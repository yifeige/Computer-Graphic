const PART_XPOS = 0; //  position    
const PART_YPOS = 1;
const PART_ZPOS = 2;
const PART_XVEL = 3; //  velocity    
const PART_YVEL = 4;
const PART_ZVEL = 5;
const PART_X_FTOT = 6; // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT = 7; // to zero, then adds each force to each particle.
const PART_Z_FTOT = 8;
const PART_R = 9; // color : red,green,blue
const PART_G = 10;
const PART_B = 11;
const PART_MASS = 12; // mass   
const PART_DIAM = 13; // on-screen diameter (in pixels)
const PART_RENDMODE = 14; // on-screen appearance (square, round, or soft-round)
const PART_MAXVAR = 15; // Size of array in CPart uses to store its values.

// Vertex shader program:
var VSHADER_SOURCE =
  'precision highp float;\n' + // req'd in OpenGL ES if we use 'float'
  //
  'attribute vec3 a_Position; \n' + // current state: particle position
  'attribute vec3 a_Color; \n' + // current state: particle color
  'attribute float a_diam; \n' + // current state: diameter in pixels
  'varying   vec4 v_Color; \n' + // (varying--send to particle
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +

  'varying mat4 u_MvpMatrix;\n' +
  'void main() {\n' +
  'u_MvpMatrix=u_ProjMatrix*u_ViewMatrix*u_ModelMatrix;\n' +
  '  gl_Position = u_MvpMatrix *vec4(a_Position.x , a_Position.y , a_Position.z, 1.0);  \n' +
  '  gl_PointSize = a_diam; \n' +
  '  v_Color = vec4(a_Color, 1.0); \n' +
  '} \n';

//==============================================================================
// Fragment shader program:
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform  int u_runMode; \n' +
  'varying vec4 v_Color; \n' +
  'void main() {\n' +
  '  if(u_runMode == 0) { \n' +
  '    gl_FragColor = v_Color;  \n' + // red: 0==reset
  '  } \n' +
  '  else if(u_runMode == 1 || u_runMode == 2) {  \n' + //  1==pause, 2==step
  '    float dist = distance(gl_PointCoord, vec2(0.5,0.5)); \n' +
  '    if(dist < 0.2) { gl_FragColor = v_Color; } else {discard; } \n' +
  '  }  \n' +
  '  else if(u_runMode==3){ \n' +
  '    float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '    if(dist < 0.2) { \n' +
  '       gl_FragColor = vec4((1.0 - 1.5*dist)*v_Color.rgb, 1.0);\n' +
  '    } else { discard; }\n' +

  '  }  \n' +
  'else if(u_runMode==4){\n' +
  'gl_FragColor=v_Color;\n' +
  '};\n' +
  '} \n';

// Global Variables
// =========================
var timeStep = 1 / 30; // initialize; current timestep in seconds
var timecontrol = 100;
var g_last = Date.now(); // Timestamp: set after each frame of animation,
var modelMatrix = new Matrix4(); // Model matrix
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var bomp = 0;
var partCount = 6110; // # of particles in our state variable s[0] that
var partCount1 = 3000;
var partCount2 = 3000;
var partCount3 = 90;
var partCount4 = 20;

var myRunMode = 3; // Particle System: 0=reset; 1= pause; 2=step; 3=run
var INIT_VEL = 0.20; // avg particle speed: ++Start,--Start buttons adjust.

var s0 = new Float32Array((partCount + 1160) * PART_MAXVAR);
var s1 = new Float32Array((partCount + 1160) * PART_MAXVAR);
var sp = new Float32Array((partCount + 1160) * PART_MAXVAR);
var stemp = {};
var FSIZE = s0.BYTES_PER_ELEMENT; // memory needed to store an s0 array element;

var theta = 0
var isDrag = false; // mouse-drag: true when user holds down mouse button
var xMclik = 0.0; // last mouse button-down position (in CVV coords)
var yMclik = 0.0;
var xMdragTot = 0.0; // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot = 0.0;
var u_ModelMatrix;
var u_ViewMatrix;
var u_ProjMatrix;
var move = 1;
var theta = 180;
var alpha = 90;
var beta = 0;
var eyeX = 20;
var eyeY = 4;
var eyeZ = 3;
var lookX = eyeX + Math.cos(theta * Math.PI / 180);
var lookY = eyeY + Math.sin(theta * Math.PI / 180);
var lookZ = eyeZ + Math.cos(alpha * Math.PI / 180);
var solver = 1;
var sphVerts = new Float32Array(((13 * 2 * 27) - 2) * 15);
var sphstart=0;


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

  canvas.onmousedown = function(ev) {
    myMouseDown(ev, gl, canvas)
  };
  canvas.onmousemove = function(ev) {
    myMouseMove(ev, gl, canvas)
  };
  canvas.onmouseup = function(ev) {
    myMouseUp(ev, gl, canvas)
  };
  window.addEventListener("keypress", myKeyPress, false);
  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  PartSys_init(0); // 0 == full reset, bouncy-balls; 1==add velocity
  // contents of state variable
  var myVerts = initVertexBuffers(gl);
  if (myVerts < 0) {
    console.log('Failed to create the Vertex Buffer Object');
    return;
  }
  gl.clearColor(0.2, 0.2, 0.2, 1); // RGBA color for clearing <canvas>

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location');
    return;
  }
  u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
  if (!u_runModeID) {
    console.log('Failed to get u_runMode variable location');
    return;
  } // set the value of the uniforms:
  gl.uniform1i(u_runModeID, myRunMode); // (keyboard callbacks set myRunMode)
  projMatrix.setPerspective(40, canvas.width / canvas.height, 1, 40);

  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  var tick = function() {

          canvas.width = innerWidth;
      canvas.height = innerHeight;
        projMatrix.setPerspective(40, canvas.width / canvas.height, 1, 40);

  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    viewMatrix.setLookAt(eyeX, eyeY, eyeZ, // eye position
      lookX, lookY, lookZ, // look-at point (origin)
      0, 0, 1);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    timeStep = animate(timeStep); // get time passed since last screen redraw. 
    if (timeStep > 1000 / timecontrol) {
      draw(gl, myVerts, timeStep);
    } // compute new particle state at current time
    requestAnimationFrame(tick, canvas); // Call again 'at next opportunity',
  }; // within the 'canvas' HTML-5 element.
  tick();
}

function animate(timeStep) {
  var now = Date.now();
  var elapsed = now - g_last;

  if (elapsed > 1000 / timecontrol) {
    g_last = now;
    return elapsed;

  } // Return the amount of time passed.
}

function draw(gl, n, timeStep) {
   gl.viewport(0, // Viewport lower-left corner
    0, // location(in pixels)
    innerWidth, // viewport width, height.
    innerHeight);
  gl.clear(gl.COLOR_BUFFER_BIT); // Clear <canvas>
  // 0=reset; 1= pause; 2=step; 3=run
  s1 = s0;
  ApplyForce1(s1)
  ApplyForce2(s1)
  ApplyForce3(s1)
  ApplyForce4(s1)
  for (var i = 0; i < partCount - 1; i++) { // for every particle in s0 state:
    var pOff = i * PART_MAXVAR; // offset to start of i-th particle
    if (solver == 1) { //eluer
      s0[pOff + PART_XVEL] += s0[PART_X_FTOT + pOff] / 5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s0[pOff + PART_YVEL] += s0[PART_Y_FTOT + pOff] / 5000 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);

      s0[pOff + PART_ZVEL] += s0[PART_Z_FTOT + pOff] / 5000;
      
      s0[PART_XVEL + pOff] *= 0.985;
      s0[PART_YVEL + pOff] *= 0.985;
      s0[PART_ZVEL + pOff] *= 0.985;

      s0[PART_XPOS + pOff] += s0[PART_XVEL + pOff];
      s0[PART_YPOS + pOff] += s0[PART_YVEL + pOff];
      s0[PART_ZPOS + pOff] += s0[PART_ZVEL + pOff];
      s0 = s1;
    }
    if (solver == 2) { //midpoint
      s1[pOff + PART_XVEL] += 0.5 * s1[PART_X_FTOT + pOff] / 5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s1[pOff + PART_YVEL] += 0.5 * s1[PART_Y_FTOT + pOff] / 5000 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
      s1[pOff + PART_ZVEL] += 0.5 * s1[PART_Z_FTOT + pOff] / 5000
     
      s1[PART_XVEL + pOff] *= 0.985;
      s1[PART_YVEL + pOff] *= 0.985;
      s1[PART_ZVEL + pOff] *= 0.985;
      
      s0[pOff + PART_XVEL] += s1[PART_X_FTOT + pOff] / 5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s0[pOff + PART_YVEL] += s1[PART_Y_FTOT + pOff] / 5000 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
   //   s0[pOff+PART_MASS]=s1[pOff+PART_MASS]
      s0[pOff + PART_ZVEL] += s1[PART_Z_FTOT + pOff] / 5000;
      s0[PART_XPOS + pOff] += s1[PART_XVEL + pOff];
      s0[PART_YPOS + pOff] += s1[PART_YVEL + pOff];
      s0[PART_ZPOS + pOff] += s1[PART_ZVEL + pOff];
      s0 = s1;

    }
    if(solver==3){// DAMS-Bashforth
      s1[pOff + PART_XVEL] += 0.5 * s1[PART_X_FTOT + pOff] / 5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s1[pOff + PART_YVEL] += 0.5 * s1[PART_Y_FTOT + pOff] / 5000 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
      s1[pOff + PART_ZVEL] += 0.5 * s1[PART_Z_FTOT + pOff] / 5000
     
      s1[PART_XVEL + pOff] *= 0.985;
      s1[PART_YVEL + pOff] *= 0.985;
      s1[PART_ZVEL + pOff] *= 0.985;
    sp=s0;
          s0[pOff + PART_XVEL] += 1.5*s1[PART_X_FTOT + pOff] / 5000 -0.5*sp[PART_X_FTOT + pOff] / 5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s0[pOff + PART_YVEL] += 1.5*s1[PART_Y_FTOT + pOff] / 5000 -0.5*sp[PART_Y_FTOT + pOff] / 5000 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
   //   s0[pOff+PART_MASS]=s1[pOff+PART_MASS]
      s0[pOff + PART_ZVEL] += 1.5*s1[PART_Z_FTOT + pOff] / 5000 -0.5*sp[PART_Z_FTOT + pOff] / 5000 ;
      s0[PART_XPOS + pOff] += 1.5*s1[PART_XVEL + pOff]-0.5*sp[PART_XVEL + pOff];
      s0[PART_YPOS + pOff] += 1.5*s1[PART_YVEL + pOff]-0.5*sp[PART_YVEL + pOff];
      s0[PART_ZPOS + pOff] += 1.5*s1[PART_ZVEL + pOff]-0.5*sp[PART_ZVEL + pOff];

    s0=s1;
    }
    if(solver==4){//verlet
    s0[PART_XPOS + pOff]=s1[PART_XPOS + pOff];
    s0[PART_YPOS + pOff]=s1[PART_YPOS + pOff];
    s0[PART_ZPOS + pOff]=s1[PART_ZPOS + pOff];
    s0[PART_XVEL + pOff]=s1[PART_XVEL + pOff];
    s0[PART_YVEL + pOff]=s1[PART_YVEL + pOff];
    s0[PART_ZVEL + pOff]=s1[PART_ZVEL + pOff];

    s1[PART_XPOS + pOff]=s0[PART_XPOS + pOff]+s0[PART_XVEL + pOff]+s0[PART_X_FTOT + pOff]/3000;
    s1[PART_YPOS + pOff]=s0[PART_YPOS + pOff]+s0[PART_YVEL + pOff]+s0[PART_Y_FTOT + pOff]/3000;
    s1[PART_ZPOS + pOff]=s0[PART_ZPOS + pOff]+s0[PART_ZVEL + pOff]+s0[PART_Z_FTOT + pOff]/3000;
    s1[PART_XVEL + pOff]=s1[PART_XPOS + pOff]-s0[PART_XPOS + pOff];
    s1[PART_YVEL + pOff]=s1[PART_YPOS + pOff]-s0[PART_YPOS + pOff];
    s1[PART_ZVEL + pOff]=s1[PART_ZPOS + pOff]-s0[PART_ZPOS + pOff];
    s0[pOff + PART_X_FTOT] = s1[pOff + PART_X_FTOT];
    s0[pOff + PART_Y_FTOT] = s1[pOff + PART_Y_FTOT];
    s0[pOff + PART_Z_FTOT] = s1[pOff + PART_Z_FTOT];
    s0[pOff + PART_R] = s1[pOff + PART_R];
    s0[pOff + PART_G] = s1[pOff + PART_G];
    s0[pOff + PART_B] = s1[pOff + PART_B];
    s0[pOff + PART_MASS] = s1[pOff + PART_MASS];
    s0[pOff + PART_DIAM] = s1[pOff + PART_DIAM];
    s0[pOff + PART_RENDMODE] = s1[pOff + PART_RENDMODE];
    }
    if(solver==5){  
      s0 = s1;     
      s0[PART_XPOS + pOff] += s0[PART_XVEL + pOff];
      s0[PART_YPOS + pOff] += s0[PART_YVEL + pOff];
      s0[PART_ZPOS + pOff] += s0[PART_ZVEL + pOff];
      s0[pOff + PART_XVEL] += s0[PART_X_FTOT + pOff] / 5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s0[pOff + PART_YVEL] += s0[PART_Y_FTOT + pOff] / 5000 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);

      s0[pOff + PART_ZVEL] += s0[PART_Z_FTOT + pOff] / 5000;
      
      s0[PART_XVEL + pOff] *= 0.985;
      s0[PART_YVEL + pOff] *= 0.985;
      s0[PART_ZVEL + pOff] *= 0.985;   
    }
    if(solver==6){
      s1[pOff + PART_XVEL] += 0.5 * s1[PART_X_FTOT + pOff] / 5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s1[pOff + PART_YVEL] += 0.5 * s1[PART_Y_FTOT + pOff] / 5000 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
      s1[pOff + PART_ZVEL] += 0.5 * s1[PART_Z_FTOT + pOff] / 5000
     
      s1[PART_XVEL + pOff] *= 0.985;
      s1[PART_YVEL + pOff] *= 0.985;
      s1[PART_ZVEL + pOff] *= 0.985;
      s0[PART_XPOS + pOff] += s1[PART_XVEL + pOff];
      s0[PART_YPOS + pOff] += s1[PART_YVEL + pOff];
      s0[PART_ZPOS + pOff] += s1[PART_ZVEL + pOff];
      s0[pOff + PART_XVEL] += s1[PART_X_FTOT + pOff] / 5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s0[pOff + PART_YVEL] += s1[PART_Y_FTOT + pOff] / 5000 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
   //   s0[pOff+PART_MASS]=s1[pOff+PART_MASS]
      s0[pOff + PART_ZVEL] += s1[PART_Z_FTOT + pOff] / 5000;

      s0 = s1;
    }
    wall1(pOff);
    wall2(pOff);
    wall3(pOff);



  }
  gl.uniform1i(u_runModeID, myRunMode); //run/step/pause changes particle shape

  PartSys_render(gl, s0);
}

function PartSys_render(gl, s) {


  gl.bufferSubData(gl.ARRAY_BUFFER, // GLenum target,
    0, // offset to data we'll transfer
    s0); // Data source (Javascript array)
  modelMatrix.setIdentity();
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  gl.drawArrays(gl.POINTS, 0, partCount1);


  gl.uniform1i(u_runModeID, 4);
  gl.drawArrays(gl.LINES, // use this drawing primitive, and
    (gndstart) / 15, // start at this vertex number, and
    gndVerts.length / 15);


  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15, 5);

  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 5, 5);
  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 10, 5);
  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 15, 5);
  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 20, 5);
  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 25, 5);

    gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15+30, 5);

  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 35, 5);
  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 40, 5);
  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 45, 5);
  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 50, 5);
  gl.drawArrays(gl.LINE_LOOP, (cubestart + 1) / 15 + 55, 5);
      gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
      sphstart / 15, // start at this vertex number, and 
      sphVerts.length / 15);

  gl.uniform1i(u_runModeID, myRunMode);

  //fire

  gl.drawArrays(gl.POINTS, partCount1, partCount2);

  //boids

  gl.drawArrays(gl.POINTS, partCount1 + partCount2, partCount3);

  //String
  gl.drawArrays(gl.POINTS, partCount1 + partCount2 + partCount3, partCount4);
 // gl.drawArrays(gl.POINTS,(cubestart + 1) / 15 + 30,1);


}

  function makeSphere() {
    var slices = 13; // # of slices of the sphere along the z axis. >=3 req'd
    var sliceVerts = 27; // # of vertices around the top edge of the slice
    var topColr = new Float32Array([0.7, 0.7, 0.7]); // North Pole: light gray
    var equColr = new Float32Array([0.3, 0.7, 0.3]); // Equator:    bright green
    var botColr = new Float32Array([0.9, 0.9, 0.9]); // South Pole: brightest gray.
    var sliceAngle = Math.PI / slices; // lattitude angle spanned by one slice.

    var cos0 = 0.0; // sines,cosines of slice's top, bottom edge.
    var sin0 = 0.0;
    var cos1 = 0.0;
    var sin1 = 0.0;
    var j = 0; // initialize our array index
    var isLast = 0;
    var isFirst = 1;
    for (s = 0; s < slices; s++) { // for each slice of the sphere,

      if (s == 0) {
        isFirst = 1; // skip 1st vertex of 1st slice.
        cos0 = 1.0; // initialize: start at north pole.
        sin0 = 0.0;
      } else { // otherwise, new top edge == old bottom edge
        isFirst = 0;
        cos0 = cos1;
        sin0 = sin1;
      } // & compute sine,cosine for new bottom edge.
      cos1 = Math.cos((s + 1) * sliceAngle);
      sin1 = Math.sin((s + 1) * sliceAngle);
      if (s == slices - 1) isLast = 1; // skip last vertex of last slice.
      for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += 15) {
        if (v % 2 == 0) {
          sphVerts[j] = 4+0.25*sin0 * Math.cos(Math.PI * (v) / sliceVerts);
          sphVerts[j + 1] = 6+0.25*sin0 * Math.sin(Math.PI * (v) / sliceVerts);
          sphVerts[j + 2] = 1+0.25*cos0;

        } else {
          sphVerts[j] =4+ 0.25*sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts); // x
          sphVerts[j + 1] =6+ 0.25*sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts); // y
          sphVerts[j + 2] = 1+0.25*cos1; // z

        }
       
    sphVerts[j + PART_XVEL] = 0;
    sphVerts[j + PART_YVEL] = 0;
    sphVerts[j + PART_ZVEL] = 0.0;
    sphVerts[j + PART_X_FTOT] = 0.0;
    sphVerts[j + PART_Y_FTOT] = 0.0;
    sphVerts[j + PART_Z_FTOT] = 0.0;
    sphVerts[j + PART_R] = 0.2;
    sphVerts[j + PART_G] = 0.8;
    sphVerts[j + PART_B] = 0.8;
    sphVerts[j + PART_MASS] = 0;
    sphVerts[j + PART_DIAM] = 0;
    sphVerts[j + PART_RENDMODE] = 0;
      }
    }
  }


function makeGroundGrid() {
  var xcount = 100; // # of lines to draw in x,y to make the grid.
  var ycount = 100;
  var xymax = 50.0; // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([1.0, 1.0, 0.3]); // bright yellow
  var yColr = new Float32Array([0.5, 1.0, 0.5]); // bright green.

  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(PART_MAXVAR * 2 * (xcount + ycount));
  // draw a grid made of xcount+ycount lines; 2 vertices per line.

  var xgap = xymax / (xcount - 1); // HALF-spacing between lines in x,y;
  var ygap = xymax / (ycount - 1); // (why half? because v==(0line number/2))

  // First, step thru x values as we make vertical lines of constant-x:
  for (v = 0, j = 0; v < 2 * xcount; v++, j += 15) {
    if (v % 2 == 0) { // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j] = -xymax + (v) * xgap; // x
      gndVerts[j + 1] = -xymax; // y
      gndVerts[j + 2] = 0.0; // z
    } else { // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j] = -xymax + (v - 1) * xgap; // x
      gndVerts[j + 1] = xymax; // y
      gndVerts[j + 2] = 0.0; // z
    }
    gndVerts[j + PART_XVEL] = 0;
    gndVerts[j + PART_YVEL] = 0;
    gndVerts[j + PART_ZVEL] = 0.0;
    gndVerts[j + PART_X_FTOT] = 0.0;
    gndVerts[j + PART_Y_FTOT] = 0.0;
    gndVerts[j + PART_Z_FTOT] = 0.0;
    gndVerts[j + PART_R] = 0.1;
    gndVerts[j + PART_G] = 0.1;
    gndVerts[j + PART_B] = 0.8;
    gndVerts[j + PART_MASS] = 0;
    gndVerts[j + PART_DIAM] = 0;
    gndVerts[j + PART_RENDMODE] = 0;

  }
  for (v = 0; v < 2 * ycount; v++, j += 15) {
    if (v % 2 == 0) { // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j] = -xymax; // x
      gndVerts[j + 1] = -xymax + (v) * ygap; // y
      gndVerts[j + 2] = 0.0; // z
    } else { // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j] = xymax; // x
      gndVerts[j + 1] = -xymax + (v - 1) * ygap; // y
      gndVerts[j + 2] = 0.0; // z
    }
    gndVerts[j + PART_XVEL] = 0;
    gndVerts[j + PART_YVEL] = 0;
    gndVerts[j + PART_ZVEL] = 0.0;
    gndVerts[j + PART_X_FTOT] = 0.0;
    gndVerts[j + PART_Y_FTOT] = 0.0;
    gndVerts[j + PART_Z_FTOT] = 0.0;
    gndVerts[j + PART_R] = 0.1;
    gndVerts[j + PART_G] = 0.1;
    gndVerts[j + PART_B] = 0.8;
    gndVerts[j + PART_MASS] = 0;
    gndVerts[j + PART_DIAM] = 0;
    gndVerts[j + PART_RENDMODE] = 0; // 0,1,2 or 3.;

  }

}

function PartSys_init(sel) {

  var doit = 1;
  switch (sel) {
    case 0:
      for (var i = 0; i < partCount1; i++) {
        var pOff = i * PART_MAXVAR; // starting index of each particle
        var xcyc = roundRand3D();
        if (doit == 1) {
          doit = 0;
        }
        s0[pOff + PART_XPOS] = 5+5*xcyc[0]//3.9 + 0.9 * xcyc[0]; // 0.0 <= randomRound() < 1.0
        s0[pOff + PART_YPOS] = 5+5*xcyc[1]//0.9 + 0.9 * xcyc[1];
        s0[pOff + PART_ZPOS] = 5+5*xcyc[2];
        xcyc = roundRand2D();
        s0[pOff + PART_XVEL] = 0 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
        s0[pOff + PART_YVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
        s0[pOff + PART_ZVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
        s0[pOff + PART_X_FTOT] = 0.0;
        s0[pOff + PART_Y_FTOT] = 0.0;
        s0[pOff + PART_Z_FTOT] = 0.0;
        s0[pOff + PART_R] = 0.2 + 0.8 * Math.random();
        s0[pOff + PART_G] = 0.2 + 0.8 * Math.random();
        s0[pOff + PART_B] = 0.2 + 0.8 * Math.random();
        s0[pOff + PART_MASS] = 1.0 // + 0.2 * Math.random();
        s0[pOff + PART_DIAM] = 9.0 //+ 10.0 * Math.random();
        s0[pOff + PART_RENDMODE] = Math.floor(4.0 * Math.random()); // 0,1,2 or 3.
        //temp=pOff + PART_RENDMODE
      }
      for (var i = partCount1; i < partCount1 + partCount2; i++) {
        var pOff = i * PART_MAXVAR; // starting index of each particle
        var xcyc = roundRand3D();
        if (doit == 1) {
          console.log('xc,yc= ' + xcyc[0] + ', ' + xcyc[1]);
          doit = 0;
        }
        s0[pOff + PART_XPOS] = 0.9 + 0.9 * xcyc[0]; // 0.0 <= randomRound() < 1.0
        s0[pOff + PART_YPOS] = 4.9 + 0.9 * xcyc[1];
        s0[pOff + PART_ZPOS] = 0;
        xcyc = roundRand2D();
        s0[pOff + PART_XVEL] = 0 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
        s0[pOff + PART_YVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
        s0[pOff + PART_ZVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
        s0[pOff + PART_X_FTOT] = 0.0;
        s0[pOff + PART_Y_FTOT] = 0.0;
        s0[pOff + PART_Z_FTOT] = 0.0;
        s0[pOff + PART_R] = 0.6 + 0.2 * Math.random();
        s0[pOff + PART_G] = 0.4 + 0.2 * Math.random();
        s0[pOff + PART_B] = 0.1 * Math.random();
        s0[pOff + PART_MASS] = 1.0 // + 0.2 * Math.random();
        s0[pOff + PART_DIAM] = 18.0 //+ 10.0 * Math.random();
        s0[pOff + PART_RENDMODE] = Math.floor(4.0 * Math.random()); // 0,1,2 or 3.

      }
      var pOff = (partCount1 + partCount2) * PART_MAXVAR;
      s0[pOff + PART_XPOS] = 2.5; // 0.0 <= randomRound() < 1.0
      s0[pOff + PART_YPOS] = 4.5;
      s0[pOff + PART_ZPOS] = 0.9;
      xcyc = roundRand2D();
      s0[pOff + PART_XVEL] = 0 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      s0[pOff + PART_YVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
      s0[pOff + PART_ZVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
      s0[pOff + PART_X_FTOT] = 0.0;
      s0[pOff + PART_Y_FTOT] = 0.0;
      s0[pOff + PART_Z_FTOT] = 0.0;
      s0[pOff + PART_R] = 0;
      s0[pOff + PART_G] = 0.9;
      s0[pOff + PART_B] = 0.3;
      s0[pOff + PART_MASS] = 1.0 // + 0.2 * Math.random();
      s0[pOff + PART_DIAM] = 30.0 //+ 10.0 * Math.random();
      s0[pOff + PART_RENDMODE] = Math.floor(4.0 * Math.random()); // 0,1,2 or 3.

      for (var i = partCount1 + partCount2 + 1; i < partCount1 + partCount2 + partCount3; i++) {
        var pOff = i * PART_MAXVAR; // starting index of each particle
        var xcyc = roundRand3D();
        if (doit == 1) {
          console.log('xc,yc= ' + xcyc[0] + ', ' + xcyc[1]);
          doit = 0;
        }
        s0[pOff + PART_XPOS] = 2.5 + 0.9 * xcyc[0]; // 0.0 <= randomRound() < 1.0
        s0[pOff + PART_YPOS] = 4.5 + 0.9 * xcyc[1];
        s0[pOff + PART_ZPOS] = 0.9 + 0.9 * xcyc[2];
        xcyc = roundRand2D();
        s0[pOff + PART_XVEL] = 0 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
        s0[pOff + PART_YVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
        s0[pOff + PART_ZVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
        s0[pOff + PART_X_FTOT] = 0.0;
        s0[pOff + PART_Y_FTOT] = 0.0;
        s0[pOff + PART_Z_FTOT] = 0.0;
        s0[pOff + PART_R] = 0.7 + 0.2 * Math.random();
        s0[pOff + PART_G] = 0.7 + 0.2 * Math.random();
        s0[pOff + PART_B] = 0.7 * Math.random();
        s0[pOff + PART_MASS] = 1.0 // + 0.2 * Math.random();
        s0[pOff + PART_DIAM] = 18.0 //+ 10.0 * Math.random();
        s0[pOff + PART_RENDMODE] = Math.floor(4.0 * Math.random()); // 0,1,2 or 3.

      }

      for (var i = partCount1 + partCount2 + partCount3; i < partCount1 + partCount2 + partCount3 + partCount4; i++) {
        var pOff = i * PART_MAXVAR; // starting index of each particle
        var xcyc = roundRand3D();
        if (doit == 1) {
          console.log('xc,yc= ' + xcyc[0] + ', ' + xcyc[1]);
          doit = 0;
        }
        s0[pOff + PART_XPOS] = 8; // 0.0 <= randomRound() < 1.0
        s0[pOff + PART_YPOS] = 4;
        s0[pOff + PART_ZPOS] = 1.86 + 0.2 * (i - (partCount1 + partCount2 + partCount3));
        xcyc = roundRand2D();
        s0[pOff + PART_XVEL] = 0 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
        s0[pOff + PART_YVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
        s0[pOff + PART_ZVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
        s0[pOff + PART_X_FTOT] = 0.0;
        s0[pOff + PART_Y_FTOT] = 0.0;
        s0[pOff + PART_Z_FTOT] = 0.0;
        s0[pOff + PART_R] = 0.2 + 0.2 * Math.random();
        s0[pOff + PART_G] = 0.7 + 0.2 * Math.random();
        s0[pOff + PART_B] = 0.3 + 0.7 * Math.random();
        s0[pOff + PART_MASS] = 1.0 // + 0.2 * Math.random();
        s0[pOff + PART_DIAM] = 30.0 //+ 10.0 * Math.random();
        s0[pOff + PART_RENDMODE] = Math.floor(4.0 * Math.random()); // 0,1,2 or 3.
        temp = pOff + PART_RENDMODE
      }
      cube = new Float32Array([
        0.0, 0.0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 0.0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 10, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 10, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        //face 2
        10, 10, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 10, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 10, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 10, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 10, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        //face 3
        0, 10, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 10, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 0, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 0, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 10, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        //face 4
        10, 0, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 0, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 0, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        //face 5
        10, 0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 0, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 10, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 10, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        10, 0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        //face 6
        0, 0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 10, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 10, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 0, 1.8, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,
        0, 0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 0, 0, 0, 0, 0,

        1.0, 1.0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1.0, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1.9, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1.9, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        //face 2
        1.9, 1.9, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1.9, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1.9, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1.9, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1.9, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        //face 3
        1, 1.9, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1.9, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1.9, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        //face 4
        1.9, 1, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1, 0.0, 1.0, 1, 2, 3, 4, 5, 1,1, 0, 0, 0, 0,
        1.9, 1, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        //face 5
        1.9, 1, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1.9, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1.9, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1.9, 1, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        //face 6
        1, 1, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1.9, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1.9, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1, 10.9, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,
        1, 1, 0.0, 1.0, 1, 2, 3, 4, 5, 1, 1, 0, 0, 0, 0,

      ]);
      makeGroundGrid();
      makeSphere();
      cubestart = temp;
      for (i = temp + 1, j = 0; j < cube.length; i++, j++) {
        s0[i] = cube[j];
      }
      gndstart = i;
      for (j = 0; j < gndVerts.length; i++, j++) {
        s0[i] = gndVerts[j];
      }
   
      sphstart=i;
      for(j=0;j<sphVerts.length;i++,j++){
      s0[i] = sphVerts[j];
      }  
      s1 = s0;
      sp=s0;
      break;

  }
}

function roundRand2D() {
  var xy = [0, 0];
  do { // 0.0 <= Math.random() < 1.0 with uniform PDF.
    xy[0] = 2.0 * Math.random() - 1.0; // choose an equally-likely 2D point
    xy[1] = 2.0 * Math.random() - 1.0; // within the +/-1, +/-1 square.
  }
  while (xy[0] * xy[0] + xy[1] * xy[1] >= 1.0); // keep 1st point inside circle
  //  while(xdisc*xdisc + ydisc*ydisc >= 1.0);    // keep 1st point inside circle.
  return xy;
}

function roundRand3D() {
  do { // 0.0 <= Math.random() < 1.0 with uniform PDF.
    xball = 2.0 * Math.random() - 1.0; // choose an equally-likely 2D point
    yball = 2.0 * Math.random() - 1.0; // within the +/-1, +/-1 square.
    zball = 2.0 * Math.random() - 1.0;
  }
  while (xball * xball + yball * yball + zball * zball >= 1.0); // keep 1st point inside sphere.
  ret = new Array(xball, yball, zball);
  return ret;
}

function initVertexBuffers(gl) {
  vertexBufferID = gl.createBuffer(); //(make it global: PartSys_render()
  // modifies this buffers' contents)
  if (!vertexBufferID) {
    console.log('Failed to create the gfx buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferID);

  gl.bufferData(gl.ARRAY_BUFFER, // GLenum target,
    s0, // ArrayBufferView data (or size)
    gl.DYNAMIC_DRAW); // Usage hint.
  a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_PositionID < 0) {
    console.log('Failed to get the gfx storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(
    a_PositionID, //index == attribute var. name used in the shader pgm.
    3, // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT, // type == what data type did we use for those numbers?
    false, // isNormalized == are these fixed-point values that we need
    //                  normalize before use? true or false
    PART_MAXVAR * FSIZE, // stride == #bytes (of other, interleaved data) between 
    // separating OUR values.
    PART_XPOS * FSIZE); // Offset -- how many bytes from START of buffer to the
  gl.enableVertexAttribArray(a_PositionID);

  // ---------------Connect 'a_Color' attribute to bound buffer:--------------
  a_ColorID = gl.getAttribLocation(gl.program, 'a_Color');
  if (a_ColorID < 0) {
    console.log('Failed to get the gfx storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(
    a_ColorID, //index == attribute var. name used in the shader pgm.
    3, // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT, // type == what data type did we use for those numbers?
    false, // isNormalized == are these fixed-point values that we need
    //                  normalize before use? true or false
    PART_MAXVAR * FSIZE, // stride == #bytes (of other, interleaved data) between 
    // separating OUR values?
    PART_R * FSIZE); // Offset -- how many bytes from START of buffer to the
  gl.enableVertexAttribArray(a_ColorID);

  // ---------------Connect 'a_diam' attribute to bound buffer:---------------
  a_diamID = gl.getAttribLocation(gl.program, 'a_diam');
  if (a_diamID < 0) {
    console.log('Failed to get the storage location of scalar a_diam');
    return -1;
  }
  gl.vertexAttribPointer(
    a_diamID, //index == attribute var. name used in the shader pgm.
    1, // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT, // type == what data type did we use for those numbers?
    false, // isNormalized == are these fixed-point values that we need
    //                  to normalize before use? true or false
    PART_MAXVAR * FSIZE, // stride == #bytes (of other, interleaved data) between 
    // separating OUR values?
    PART_DIAM * FSIZE); // Offset -- how many bytes from START of buffer to the
  gl.enableVertexAttribArray(a_diamID);

  // --------------DONE with connecting attributes to bound buffer:-----------
  return partCount;
}



//===================Mouse and Keyboard event-handling Callbacks================
//==============================================================================
function myMouseDown(ev, gl, canvas) {
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; //x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); //y==0 at canvas bottom edge
  var x = (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height / 2) / //                    -1 <= y < +1.
    (canvas.height / 2);

  isDrag = true; // set our mouse-dragging flag
  xMclik = x; // record where mouse-dragging began
  yMclik = y;
};

function myMouseMove(ev, gl, canvas) {

  if (isDrag == false) return; // IGNORE all mouse-moves except 'dragging'

  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; //x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); //y==0 at canvas bottom edge
  var x = (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height / 2) / //                    -1 <= y < +1.
    (canvas.height / 2);
  xMdragTot += (x - xMclik); // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x; // Make next drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left; // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
  var x = (xp - canvas.width / 2) / // move origin to center of canvas and
    (canvas.width / 2); // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height / 2) / //                    -1 <= y < +1.
    (canvas.height / 2);

  isDrag = false; // CLEAR our mouse-dragging flag, and
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
};

function myKeyDown(ev) {
  switch (ev.keyCode) { // keyboard listener
    case 87:

      lookY += 0.1 * Math.sin(theta * Math.PI / 180);
      eyeY += 0.1 * Math.sin(theta * Math.PI / 180);
      lookX += 0.1 * Math.cos(theta * Math.PI / 180);
      eyeX += 0.1 * Math.cos(theta * Math.PI / 180);

      break;
    case 83:
      lookY -= 0.1 * Math.sin(theta * Math.PI / 180);
      eyeY -= 0.1 * Math.sin(theta * Math.PI / 180);
      lookX -= 0.1 * Math.cos(theta * Math.PI / 180);
      eyeX -= 0.1 * Math.cos(theta * Math.PI / 180);

      break;
    case 68:
      lookX -= 0.1 * Math.sin(-theta * Math.PI / 180);
      eyeX -= 0.1 * Math.sin(-theta * Math.PI / 180);
      lookY -= 0.1 * Math.cos(-theta * Math.PI / 180);
      eyeY -= 0.1 * Math.cos(-theta * Math.PI / 180);
      break;
    case 65:
      lookX += 0.1 * Math.sin(-theta * Math.PI / 180);
      eyeX += 0.1 * Math.sin(-theta * Math.PI / 180);
      lookY += 0.1 * Math.cos(-theta * Math.PI / 180);
      eyeY += 0.1 * Math.cos(-theta * Math.PI / 180);
      break;
    case 73:
      alpha -= 0.8;
      if (alpha > 0) {
        lookZ = eyeZ + Math.cos(alpha * Math.PI / 180);
      }
      break;
    case 75:
      alpha += 0.8;
      if (alpha < 180) {
        lookZ = eyeZ + Math.cos(alpha * Math.PI / 180);
      }
      break;
    case 74:
      theta += 0.8
      lookX = eyeX + Math.cos(theta * Math.PI / 180);
      lookY = eyeY + Math.sin(theta * Math.PI / 180);
      break;
    case 76:
      theta -= 0.8
      lookX = eyeX + Math.cos(theta * Math.PI / 180);
      lookY = eyeY + Math.sin(theta * Math.PI / 180);
      break;
    case 69:
      eyeZ += 0.03;
      lookZ += 0.03;

      break;
    case 81:
      eyeZ -= 0.03;
      lookZ -= 0.03;

      break;
    default:
      break;
  }
}

function myKeyUp(ev) {}

function myKeyPress(ev) {

  bomp1 = 1;
  myChar = String.fromCharCode(ev.keyCode); //  convert code to character-string
  switch (myChar) {


    case 'R': // HARD reset: position AND velocity.
      myRunMode = 0; // RESET!
      PartSys_init(0);
      break;
    case 'r': // 'SOFT' reset: boost velocity only.
      PartSys_init(1);
      break;
    case 'p':
    case 'P': // toggle pause/run:
      if (myRunMode == 3) myRunMode = 1; // if running, pause
      else myRunMode = 3; // if paused, run.
      break;
    case ' ': // space-bar: single-step
      myRunMode = 2;
      break;
    case 'n':
      bomp = 1
      break;
    case 'N':
      bomp = 2
      break;
    default:
      break;

  }
}

function onPlusButton() {
  //==============================================================================
  INIT_VEL *= 1.2; // increase
  console.log('Initial velocity: ' + INIT_VEL);
}

function onMinusButton() {
  //==============================================================================
  INIT_VEL /= 1.2; // shrink
  console.log('Initial velocity: ' + INIT_VEL);
}

function ApplyForce1(sx) {
  for (var i = 0; i < partCount1; i++) { // for every particle in s0 state:
    // -- apply acceleration due to gravity to current velocity:
    var pOff = i * PART_MAXVAR;
    sx[PART_X_FTOT + pOff] = 0.0;
    sx[PART_Y_FTOT + pOff] = 0.0;
    sx[PART_Z_FTOT + pOff] = -9.8;
  };

  if (bomp == 1) {
    f = 500
    bp = [3.9, 0.9, -0.1]
    for (var i = 0; i < partCount1; i++) {
      var pOff = i * PART_MAXVAR;
      s = Math.sqrt(Math.pow((sx[PART_XPOS + pOff] - bp[0]), 2) + Math.pow((sx[PART_YPOS + pOff] - bp[1]), 2) + Math.pow((sx[PART_ZPOS + pOff] - bp[2]), 2));
      sx[PART_X_FTOT + pOff] += (f * (sx[PART_XPOS + pOff] - bp[0]) / s);
      sx[PART_Y_FTOT + pOff] += (f * (sx[PART_YPOS + pOff] - bp[1]) / s);
      sx[PART_Z_FTOT + pOff] += ((f * (sx[PART_ZPOS + pOff] - bp[2]) / s - 9.8));

    }
    bomp = 0;
  } else if (bomp == 2) {
    f = 50
    bp = [3.9, 0.9, -0.1]
    for (var i = 0; i < partCount1; i++) {
      var pOff = i * PART_MAXVAR;
      s = Math.sqrt(Math.pow((sx[PART_XPOS + pOff] - bp[0]), 2) + Math.pow((sx[PART_YPOS + pOff] - bp[1]), 2) + Math.pow((sx[PART_ZPOS + pOff] - bp[2]), 2));
      sx[PART_X_FTOT + pOff] += -(f * (sx[PART_XPOS + pOff] - bp[0]) / s);
      sx[PART_Y_FTOT + pOff] += -(f * (sx[PART_YPOS + pOff] - bp[1]) / s);
      sx[PART_Z_FTOT + pOff] += -(f * (sx[PART_ZPOS + pOff] - bp[2]) / s);

    }
    bomp = 0;
  }
    directionc = new Vector3([0, 0, 0])
    dir=directionc.elements;

  /*
    for (var i = 0; i < partCount1; i++) { // for every particle in sx state:
      // -- apply acceleration due to gravity to current velocity:
      var pOff = i * PART_MAXVAR;
        sx[pOff + PART_XVEL] +=sx[PART_X_FTOT + pOff]/5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
        sx[pOff + PART_YVEL] +=sx[PART_Y_FTOT + pOff]/5000// INIT_VEL * (0.4 + 0.2 * xcyc[1]);
       
        if(sx[PART_ZPOS+pOff]==0&&sx[pOff + PART_ZVEL]==0 &&sx[PART_Z_FTOT + pOff]<0){
        sx[pOff + PART_ZVEL]=0;
      } 
        else     {sx[pOff + PART_ZVEL] +=sx[PART_Z_FTOT + pOff]/5000};

        // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
      }
*/

}

function ApplyForce2(sx) {
  for (var i = partCount1; i < partCount1 + partCount2; i++) { // for every particle in sx state:
    // -- apply acceleration due to gravity to current velocity:
    var pOff = i * PART_MAXVAR;
    sx[PART_X_FTOT + pOff] = 0.0;
    sx[PART_Y_FTOT + pOff] = 0.0;
    sx[PART_Z_FTOT + pOff] = 0;
  };
  var xcyc = roundRand3D();
  bp = [0.9, 4.9, -0.1]
  for (var i = partCount1; i < partCount1 + partCount2; i++) { // for every particle in sx state:
    // -- apply acceleration due to gravity to current velocity:
    var pOff = i * PART_MAXVAR;

    if (sx[PART_MASS + pOff] > 0.1) {
      s = Math.sqrt(Math.pow((sx[PART_XPOS + pOff] - bp[0]), 2) + Math.pow((sx[PART_YPOS + pOff] - bp[1]), 2) + Math.pow((sx[PART_ZPOS + pOff] - bp[2]), 2));
      sx[PART_X_FTOT + pOff] = (-2 * (sx[PART_XPOS + pOff] - bp[0]) / s);
      sx[PART_Y_FTOT + pOff] = (-2 * (sx[PART_YPOS + pOff] - bp[1]) / s);
      sx[PART_Z_FTOT + pOff] = Math.max(0, (9.6 - 9.8 * (sx[PART_MASS + pOff])));
      sx[pOff + PART_R] = 0.6 + 0.2 * Math.random() + (1 - sx[PART_MASS + pOff]) * 0.5;
      sx[pOff + PART_G] = 0.3 + 0.2 * Math.random() - (1 - sx[PART_MASS + pOff]) * 0.2;
      sx[pOff + PART_B] = 0;
      sx[pOff + PART_DIAM] = 30 - (1 - sx[PART_MASS + pOff]) * 10;
      sx[PART_MASS + pOff] -= 0.07 * (1 - s);

    } else {

      sx[pOff + PART_XPOS] = 0.9 + 0.9 * xcyc[0]; // 0.0 <= randomRound() < 1.0
      sx[pOff + PART_YPOS] = 4.9 + 0.9 * xcyc[1];
      sx[pOff + PART_ZPOS] = 0;
      xcyc = roundRand2D();
      sx[pOff + PART_XVEL] = 0 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
      sx[pOff + PART_YVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
      sx[pOff + PART_ZVEL] = 0 // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
      sx[pOff + PART_X_FTOT] = 0.0;
      sx[pOff + PART_Y_FTOT] = 0.0;
      sx[pOff + PART_Z_FTOT] = 0.0;
      sx[pOff + PART_R] = 0.6 + 0.2 * Math.random();
      sx[pOff + PART_G] = 0.3 + 0.2 * Math.random();
      sx[pOff + PART_B] = 0.0 * Math.random();
      sx[pOff + PART_MASS] = 1.0 // + 0.2 * Math.random();
      sx[pOff + PART_DIAM] = 30.0 //+ 10.0 * Math.random();
      sx[pOff + PART_RENDMODE] = Math.floor(4.0 * Math.random()); // 0,1,2 or 3.
    }

  }


}

function ApplyForce3(sx) {
  centerx = 0;
  centery = 0;
  centerz = 0;
  pOff = (partCount1 + partCount2) * PART_MAXVAR;

  for (var i = partCount1 + partCount2 + 1; i < partCount1 + partCount2 + partCount3; i++) { // for every particle in sx state:
    // -- apply acceleration due to gravity to current velocity:
    var pOff = i * PART_MAXVAR;
    sx[PART_X_FTOT + pOff] = 0.0;
    sx[PART_Y_FTOT + pOff] = 0.0;
    sx[PART_Z_FTOT + pOff] = 0.0;
    centerx += sx[PART_XPOS + pOff];
    centery += sx[PART_YPOS + pOff];
    centerz += sx[PART_ZPOS + pOff];
  };
  centerx /= partCount3;
  centery /= partCount3;
  centerz /= partCount3;

  // cohesion and seperation
  direction = new Vector3([0, 0, 0])
  Dir = direction.elements;
    direction2 = new Vector3([0, 0, 0])
  Dir2 = direction.elements;
  //direction2=new Vector3([0,0,0])
  //Dir2=direction2.elements;
  cohesionForce = 1;

  for (var i = partCount1 + partCount2+1; i < partCount1 + partCount2 + partCount3; i++) { // for every particle in sx state:
    // -- apply acceleration due to gravity to current velocity:
    var pOff = i * PART_MAXVAR;
    Dir2[0]=sx[PART_XPOS + pOff]-4;
    Dir2[1]=sx[PART_YPOS + pOff]-6;
    Dir2[2]=sx[PART_ZPOS + pOff]-1;
   direction2.normalize();
    bdis=Math.sqrt(Dir2[0]*Dir2[0]+Dir2[1]*Dir2[1]+Dir2[2]*Dir2[2])
    if(bdis<1){
    sx[PART_X_FTOT + pOff] += 3* Dir2[0];
    sx[PART_Y_FTOT + pOff] += 3* Dir2[1];
    sx[PART_Z_FTOT + pOff] += 3 * Dir2[2];
    }
    spdis = [0, 0, 0]
    Dir[0] = centerx - sx[PART_XPOS + pOff];
    Dir[1] = centery - sx[PART_YPOS + pOff];
    Dir[2] = centerz - sx[PART_ZPOS + pOff];
    direction.normalize();
    sx[PART_X_FTOT + pOff] += cohesionForce * Dir[0];
    sx[PART_Y_FTOT + pOff] += cohesionForce * Dir[1];
    sx[PART_Z_FTOT + pOff] += cohesionForce * Dir[2];
    for (var j = partCount1 + partCount2; j < partCount1 + partCount2 + partCount3; j++) { // for every particle in sx state:
      // -- apply acceleration due to gravity to current velocity:
      var pOff1 = j * PART_MAXVAR;
      speForce = 2
      if (i != j) {
        a = sx[PART_XPOS + pOff] - sx[PART_XPOS + pOff1];
        b = sx[PART_YPOS + pOff] - sx[PART_YPOS + pOff1];
        c = sx[PART_ZPOS + pOff] - sx[PART_ZPOS + pOff1];
        dis = Math.sqrt((a * a) + (b * b) + (c * c))
        if (dis != 0 && dis < 1) {
          a /= dis * dis;
          b /= dis * dis;
          c /= dis * dis
          spdis[0] += a * speForce;
          spdis[1] += b * speForce;
          spdis[2] += c * speForce;
        }
      }
    }
    sx[PART_X_FTOT + pOff] += spdis[0] / 90;
    sx[PART_Y_FTOT + pOff] += spdis[1] / 90;
    sx[PART_Z_FTOT + pOff] += spdis[2] / 90;


  }

  //alignement:
  beta += 0.01
  pLead = (partCount1 + partCount2) * PART_MAXVAR
  hx = sx[PART_XPOS + pLead]
  hy = sx[PART_YPOS + pLead]
  hz = sx[PART_ZPOS + pLead]
  directionH = new Vector3([0, 0, 0])
  DirH = direction.elements;

  leadingForce = 1.5
  for (var i = partCount1 + partCount2 + 1; i < partCount1 + partCount2 + partCount3; i++) { // for every particle in sx state:
    // -- apply acceleration due to gravity to current velocity:
    var pOff = i * PART_MAXVAR;

    spdis = [0, 0, 0]
    DirH[0] = hx - sx[PART_XPOS + pOff];
    DirH[1] = hy - sx[PART_YPOS + pOff];
    DirH[2] = hz - sx[PART_ZPOS + pOff];
    direction.normalize();
    sx[PART_X_FTOT + pOff] += leadingForce * DirH[0];
    sx[PART_Y_FTOT + pOff] += leadingForce * DirH[1];
    sx[PART_Z_FTOT + pOff] += leadingForce * DirH[2];
  }
  sx[pLead + PART_XPOS] = 2.5+3 * Math.cos(beta/2); //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
  sx[pLead + PART_YPOS] = 4.5+3 * Math.sin(beta/2); // INIT_VEL * (0.4 + 0.2 * xcyc[1]);
  sx[pLead + PART_ZPOS] = 1;
  /*
        for (var i = partCount1+partCount2; i < partCount1+partCount2+partCount3; i++) { // for every particle in sx state:
      // -- apply acceleration due to gravity to current velocity:
      var pOff = i * PART_MAXVAR;
        sx[pOff + PART_XVEL] +=sx[PART_X_FTOT + pOff]/5000; //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
        sx[pOff + PART_YVEL] +=sx[PART_Y_FTOT + pOff]/5000;// INIT_VEL * (0.4 + 0.2 * xcyc[1]);
       
        sx[pOff + PART_ZVEL] +=sx[PART_Z_FTOT + pOff]/5000;

      }
*/
}

function ApplyForce4(sx) {
  for (var i = partCount1 + partCount2 + partCount3; i < partCount1 + partCount2 + partCount3 + partCount4; i++) { // for every particle in sx state:
    // -- apply acceleration due to gravity to current velocity:
    var pOff = i * PART_MAXVAR;
    sx[PART_X_FTOT + pOff] = 0.0;
    sx[PART_Y_FTOT + pOff] = 0.0;
    sx[PART_Z_FTOT + pOff] = -9.8;
  };
  k = 1000;
  for (var i = partCount1 + partCount2 + partCount3; i < partCount1 + partCount2 + partCount3 + partCount4 - 1; i++) { // for every particle in sx state:
    // -- apply acceleration due to gravity to current velocity:
    var pOff = i * PART_MAXVAR;
    var pOff2 = pOff + PART_MAXVAR;
    xd = sx[PART_XPOS + pOff2] - sx[PART_XPOS + pOff];
    yd = sx[PART_YPOS + pOff2] - sx[PART_YPOS + pOff];
    zd = sx[PART_ZPOS + pOff2] - sx[PART_ZPOS + pOff] - 0.2;
    sx[PART_X_FTOT + pOff] += xd * k;
    sx[PART_Y_FTOT + pOff] += yd * k;
    sx[PART_Z_FTOT + pOff] += zd * k;
    // console.log(sx[PART_Z_FTOT + pOff])

    if (i > partCount1 + partCount2 + partCount3) {
      var pOff3 = pOff - PART_MAXVAR;
      xd1 = sx[PART_XPOS + pOff3] - sx[PART_XPOS + pOff];
      yd1 = sx[PART_YPOS + pOff3] - sx[PART_YPOS + pOff];
      zd1 = sx[PART_ZPOS + pOff3] - sx[PART_ZPOS + pOff] + 0.2;


      sx[PART_X_FTOT + pOff] += xd1 * k;
      sx[PART_Y_FTOT + pOff] += yd1 * k;
      sx[PART_Z_FTOT + pOff] += zd1 * k;
    }
  };
  /*
      for (var i = partCount1+partCount2+partCount3; i <partCount1+partCount2+partCount3+ partCount4-1; i++) { // for every particle in s0 state:
        // -- apply acceleration due to gravity to current velocity:
        var pOff = i * PART_MAXVAR;
          s0[pOff + PART_XVEL] +=s0[PART_X_FTOT + pOff]/5000 //INIT_VEL * (0.4 + 0.2 * xcyc[0]);
          s0[pOff + PART_YVEL] +=s0[PART_Y_FTOT + pOff]/5000// INIT_VEL * (0.4 + 0.2 * xcyc[1]);
         
          if(s0[PART_ZPOS+pOff]==0&&s0[pOff + PART_ZVEL]==0 &&s0[PART_Z_FTOT + pOff]<0){
          s0[pOff + PART_ZVEL]=0;
        } 
          else     {s0[pOff + PART_ZVEL] +=s0[PART_Z_FTOT + pOff]/5000};

        }
  */

}

function wall1(pOff) {
  if (s0[PART_XPOS + pOff] < 0.0 && s0[PART_XVEL + pOff] < 0.0) {
    s0[PART_XVEL + pOff] = -s0[PART_XVEL + pOff];
    // bounce on left wall.
  } else if (s0[PART_XPOS + pOff] > 10 && s0[PART_XVEL + pOff] > 0.0) {
    s0[PART_XVEL + pOff] = -s0[PART_XVEL + pOff];
    // bounce on right wall
  }
  /*
      }
*/
  if (s0[PART_YPOS + pOff] < 0.0 && s0[PART_YVEL + pOff] < 0.0) {
    s0[PART_YVEL + pOff] = -s0[PART_YVEL + pOff];
    // bounce on left wall.
  } else if (s0[PART_YPOS + pOff] > 10 && s0[PART_YVEL + pOff] > 0.0) {
    s0[PART_YVEL + pOff] = -s0[PART_YVEL + pOff];
    // bounce on right wall
  }

  if (s0[PART_ZPOS + pOff] < 0.0 && s0[PART_ZVEL + pOff] < 0.0) {
    s0[PART_ZVEL + pOff] = -s0[PART_ZVEL + pOff] ;
  }
  if (s0[PART_XPOS + pOff] <= 0.0) s0[PART_XPOS + pOff] = 0.0;
  if (s0[PART_XPOS + pOff] >= 10) s0[PART_XPOS + pOff] = 10;
  if (s0[PART_YPOS + pOff] <= 0.0) s0[PART_YPOS + pOff] = 0.0;
  if (s0[PART_YPOS + pOff] >= 10) s0[PART_YPOS + pOff] = 10;
  if (s0[PART_ZPOS + pOff] <= 0.0) s0[PART_ZPOS + pOff] = 0.0;
}

function wall2(pOff) {
  if (s0[PART_XPOS + pOff] < 1.9&& s0[PART_XPOS + pOff]>1.6&&s0[PART_YPOS + pOff]>1.0&&s0[PART_YPOS + pOff]<1.9&& s0[PART_XVEL + pOff] < 0.0) {
    s0[PART_XVEL + pOff] = -s0[PART_XVEL + pOff];

    // bounce on left wall.
  } else if (s0[PART_XPOS + pOff] < 1.3&& s0[PART_XPOS + pOff]>1.0&&s0[PART_YPOS + pOff]>1.0&&s0[PART_YPOS + pOff]<1.9&& s0[PART_XVEL + pOff] > 0.0) {
    s0[PART_XVEL + pOff] = -s0[PART_XVEL + pOff];

    // bounce on right wall
  }
  /*
      }
*/
  if (s0[PART_XPOS + pOff] < 1.9&& s0[PART_XPOS + pOff]>1.0&&s0[PART_YPOS + pOff]<1.9&&s0[PART_YPOS + pOff]>1.6&& s0[PART_YVEL + pOff] < 0.0) {
    s0[PART_YVEL + pOff] = -s0[PART_YVEL + pOff];
    // bounce on left wall.
  } else if (s0[PART_XPOS + pOff] < 1.9&& s0[PART_XPOS + pOff]>1.0&&s0[PART_YPOS + pOff]>1.0&&s0[PART_YPOS + pOff]<1.3&& s0[PART_YVEL + pOff] > 0.0) {
    s0[PART_YVEL + pOff] = -s0[PART_YVEL + pOff];
    // bounce on right wall
  }


  if (s0[PART_XPOS + pOff] < 1.9&& s0[PART_XPOS + pOff]>1.45&&s0[PART_YPOS + pOff]>1.0&&s0[PART_YPOS + pOff]<1.9) s0[PART_XPOS + pOff] = 2.9;
  if (s0[PART_XPOS + pOff] < 1.45&& s0[PART_XPOS + pOff]>1.0&&s0[PART_YPOS + pOff]>1.0&&s0[PART_YPOS + pOff]<1.9) s0[PART_XPOS + pOff] = 2.0;
  if (s0[PART_XPOS + pOff] < 1.9&& s0[PART_XPOS + pOff]>1.0&&s0[PART_YPOS + pOff]<1.9&&s0[PART_YPOS + pOff]>1.45) s0[PART_YPOS + pOff] = 2.9;
  if (s0[PART_XPOS + pOff] < 1.9&& s0[PART_XPOS + pOff]>1.0&&s0[PART_YPOS + pOff]>1.0&&s0[PART_YPOS + pOff]<1.45) s0[PART_YPOS + pOff] = 2.0;
 // if (s0[PART_ZPOS + pOff] <= 0.0) s0[PART_ZPOS + pOff] = 0.0;
 //console.log(1)
}
function wall3(pOff){

x=s0[PART_XPOS + pOff]-4;
y=s0[PART_YPOS + pOff]-6;
z=s0[PART_ZPOS + pOff]-1;
dis=Math.sqrt(x*x+y*y+z*z);
x1=x+s0[PART_XVEL + pOff]/5000
y1=x+s0[PART_YVEL + pOff]/5000
z1=x+s0[PART_ZVEL + pOff]/5000
dis1=Math.sqrt(x1*x1+y1*y1+z1*z1);
if(dis<0.3&&dis1<dis){

  s0[PART_XVEL + pOff]=-s0[PART_XVEL + pOff]+0.1*Math.random()*s0[PART_ZVEL + pOff]
  s0[PART_YVEL + pOff]=-s0[PART_YVEL + pOff]+0.1*Math.random()*s0[PART_ZVEL + pOff]
  s0[PART_ZVEL + pOff]=-s0[PART_ZVEL + pOff]+0.2*Math.random()*s0[PART_ZVEL + pOff]



}
}
function submit() {

  var X = document.getElementById('ar').value;
  var Y = document.getElementById('ag').value;
  var Z = document.getElementById('ab').value;

  console.log(X, Y, Z)
  j = 20
  for (var i = partCount1 + partCount2 + partCount3; i < partCount1 + partCount2 + partCount3 + partCount4 - 1; i++) { // for every particle in s0 state:
    var pOff = i * PART_MAXVAR;

    s0[PART_XPOS + pOff] = 8 + (X) / 20 * j;
    s0[PART_YPOS + pOff] = 4 + (Y) / 20 * j;
    s0[PART_ZPOS + pOff] += Z / 20 * j;
    j--
  }
}

function submitfr() {
  var fr = document.getElementById('fr').value;
  timecontrol = fr;
}
function Euler(){
  solver=1;
  console.log("Euler")
    document.getElementById('solverresult').innerHTML =    "Implict Euler";
}
function MidPoint(){
solver=2;
  console.log("MidPoint")
    document.getElementById('solverresult').innerHTML =    "Implict MidPoint";
}
function Adamas(){
  solver=3;
  console.log("Adamas-Bashforth")
    document.getElementById('solverresult').innerHTML =    "Adamas-Bashforth";
}
function Verlet(){
  solver=4;
  console.log("Verlet")
    document.getElementById('solverresult').innerHTML =    "Verlet, this solver seems is too stable that the force affected too little.";
}
function EEuler(){
  solver=5;
  console.log("Explict Euler")
  document.getElementById('solverresult').innerHTML =    "Explict Euler";
}
function EMidPoint(){
  solver=6;
  console.log("Explict MidPoint")
      document.getElementById('solverresult').innerHTML =    "Explict MidPoint";
}