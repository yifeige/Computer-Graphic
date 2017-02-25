
  var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec4 a_Color;\n' +
    'attribute vec4 a_Normal;\n' +
    'uniform mat4 u_ViewMatrix;\n' +
    'uniform mat4 u_ProjMatrix;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'varying mat4 u_MvpMatrix;\n' +
    'uniform mat4 u_NormalMatrix;\n' +
    'uniform vec3 u_LightDirection;\n' +
    'varying vec4 v_Color;\n' +
    'uniform vec3 x;\n' +

    'void main() {\n' +
    'u_MvpMatrix=u_ProjMatrix*u_ViewMatrix*u_ModelMatrix;\n' +
    'gl_Position = u_MvpMatrix * a_Position;\n' +
    'vec4 normvec= normalize(a_Normal);\n' +
    'vec4 normal = u_NormalMatrix * normvec;\n' +
    'float nDotL = clamp(dot(u_LightDirection, normalize(normal.xyz)), 0.0,1.0);\n' +
    'float xtemp = dot(x,x);\n' +
    'nDotL = nDotL+xtemp;\n ' +
    'nDotL = min(nDotL,1.0);\n' +

    '  v_Color = vec4(a_Color.xyz * (0.3+0.7*nDotL), a_Color.a);\n' +

    '}\n';

  // Fragment shader program----------------------------------
  var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
   
    'varying vec4 v_Color;\n' +

    'void main() {\n' +
    '  gl_FragColor = v_Color;\n' +
    '}\n';

  var test = 0;
  var cfollow = 0;
  var flyplane=0;
  var theta = 90;
  var alpha = 90;
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
  var modelMatrix = new Matrix4(); // Model matrix
var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1); // 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();   
  var normalMatrix = new Matrix4(); // Transformation matrix for normals
  var viewMatrix = new Matrix4();
  var projMatrix = new Matrix4();

  // Current rotation angle
  var currentAngle = 0.0;
  var currentRoute = 0;
  var currentColor = 0;
  var u_ModelMatrix;
  var u_NormalMatrix;
  var u_LightDirection
  var u_ViewMatrix;
  var u_ProjMatrix;
  var u_x
  xvalue = new Vector3([0, 0, 1]);
  // Model matrix
  var oriMatrix = new Matrix4();
  var n;
  var g_EyeX = 0.1;
  var g_Eyey = -6.3;
  var g_Eyez = 1;
  var g_Lookx = g_EyeX + Math.cos(theta * Math.PI / 180);
  var g_Looky = g_Eyey + Math.sin(theta * Math.PI / 180);
  var g_Lookz = 1;
  var gndStart;
  var gndVerts = new Float32Array([]);
  var sphStart;
  var sphVerts = new Float32Array([]);
  var vnormalx=0;
  var vnormaly=0;
  var vnormalz=0;
  var rfly=0;
  var lfly=0
  var fleft=0;
  var fright=0;
  var tfly=0;
  var bfly=0;
  var ftop=0;
  var fbot=0;
  var setfrus=0;
  var fruleft=-Math.tan(20*Math.PI/180);
  var fruright=Math.tan(20*Math.PI/180);
  var frutop=-Math.tan(20*Math.PI/180);
  var frubot=Math.tan(20*Math.PI/180);
  var frufar=25;
  var frunear=1;  
  var g_top=1;
  var g_far=25;
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
    n = initVertexBuffers(gl, currentColor);
    if (n < 0) {
      console.log('Failed to set the positions of the vertices');
      return;
    }
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    //winResize();
    //window.addEventListener("keydown", myKeyDown, false);
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
document.onkeyup= function(ev){myKeyUp(ev);};
document.onkeydown= function(ev){myKeyDown(ev);};

    // Get storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');


    if (!u_ModelMatrix || !u_NormalMatrix || !u_LightDirection) {
      console.log('Failed to get the storage location');
      return;
    }

    // Set the light direction (in the world coordinate)
    var lightDirection = new Vector3([0, 0, 1]);

    lightDirection.normalize(); // Normalize
    gl.uniform3fv(u_LightDirection, lightDirection.elements);
    u_x = gl.getUniformLocation(gl.program, 'x');
    var xvalue = new Vector3([0, 0, 1]);
    xvalue.elements = [0, 0, 1];
    gl.uniform3fv(u_x, xvalue.elements);
    // Create our JavaScript 'model' matrix: 

    oriMatrix = modelMatrix;
    var vpAspect = 1;

    if (test == 1) { // var n = initVertexBuffers(gl, currentColor);
      draw(gl, n, currentAngle, modelMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, RA, RB, currentColor, oriMatrix, currentRoute, u_x, xvalue);

    } else {
      // Start drawing

      var tick = function() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        currentAngle = animate(currentAngle); // Update the rotation angle
        currentColor = animate2(currentColor);
        // var n = initVertexBuffers(gl, currentColor);  
        currentRoute = animate1(currentRoute);
        document.getElementById('CurAngleDisplay').innerHTML =
          'CurrentSpeed= ' + Math.abs(ANGLE_STEP);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        draw(gl, n, currentAngle, modelMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, RA, RB, currentColor, oriMatrix, currentRoute, u_x, xvalue);
        requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
      };
      tick();
    }

  }

  function makeGroundGrid() {
    //==============================================================================
    // Create a list of vertices that create a large grid of lines in the x,y plane
    // centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

    var xcount = 100; // # of lines to draw in x,y to make the grid.
    var ycount = 100;
    var xymax = 50.0; // grid size; extends to cover +/-xymax in x and y.
    var xColr = new Float32Array([1.0, 1.0, 0.3]); // bright yellow
    var yColr = new Float32Array([0.5, 1.0, 0.5]); // bright green.

    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(10 * 2 * (xcount + ycount));
    // draw a grid made of xcount+ycount lines; 2 vertices per line.

    var xgap = xymax / (xcount - 1); // HALF-spacing between lines in x,y;
    var ygap = xymax / (ycount - 1); // (why half? because v==(0line number/2))

    // First, step thru x values as we make vertical lines of constant-x:
    for (v = 0, j = 0; v < 2 * xcount; v++, j += 10) {
      if (v % 2 == 0) { // put even-numbered vertices at (xnow, -xymax, 0)
        gndVerts[j] = -xymax + (v) * xgap; // x
        gndVerts[j + 1] = -xymax; // y
        gndVerts[j + 2] = 0.0; // z
      } else { // put odd-numbered vertices at (xnow, +xymax, 0).
        gndVerts[j] = -xymax + (v - 1) * xgap; // x
        gndVerts[j + 1] = xymax; // y
        gndVerts[j + 2] = 0.0; // z
      }
      gndVerts[j + 3] = 1;
      gndVerts[j + 4] = xColr[0]; // red
      gndVerts[j + 5] = xColr[1]; // grn
      gndVerts[j + 6] = xColr[2]; // blu
      gndVerts[j + 7] = 1; //normal
      gndVerts[j + 8] = 0;
      gndVerts[j + 9] = 0;
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for (v = 0; v < 2 * ycount; v++, j += 10) {
      if (v % 2 == 0) { // put even-numbered vertices at (-xymax, ynow, 0)
        gndVerts[j] = -xymax; // x
        gndVerts[j + 1] = -xymax + (v) * ygap; // y
        gndVerts[j + 2] = 0.0; // z
      } else { // put odd-numbered vertices at (+xymax, ynow, 0).
        gndVerts[j] = xymax; // x
        gndVerts[j + 1] = -xymax + (v - 1) * ygap; // y
        gndVerts[j + 2] = 0.0; // z
      }
      gndVerts[j + 3] = 1;
      gndVerts[j + 4] = yColr[0]; // red
      gndVerts[j + 5] = yColr[1]; // grn
      gndVerts[j + 6] = yColr[2]; // blu
      gndVerts[j + 7] = 1; //normal
      gndVerts[j + 8] = 0;
      gndVerts[j + 9] = 0;
    }

  }

  function initVertexBuffers(gl, currentColor) {

    currentColor = currentColor * 2;
    var c30 = Math.sqrt(0.75); // == cos(30deg) == sqrt(3) / 2
    var sq2 = Math.sqrt(2.0);
    var sq6 = Math.sqrt(6);
    //==============================================================================
    var handsVerts = new Float32Array([
      //finger
      0.0, 0.0, 0.1, 1.00, 0, 0 + currentColor, 1 - currentColor, 0, 0, 1, //4 
      0.0, 0.2, 0.1, 1.00, 0 + currentColor, 0, 1 - currentColor, 0, 0, 1, //3
      0.1, 0.0, 0.1, 1.00, 0 + currentColor, 1, 0 + currentColor, 0, 0, 1, //7
      0.1, 0.2, 0.1, 1.00, 0, 1 - currentColor, 1 - currentColor, 0, 0, 1, //8
      0.1, 0.2, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, 0, 0, 1, //5
      0.0, 0.2, 0.1, 1.00, 1 - currentColor, 0, 1 - currentColor, 0, 0, 1, //3
      0.0, 0.2, 0.0, 1.00, 1, 1 - currentColor, 0 + currentColor, 0, 0, 1, //1
      0.0, 0.0, 0.1, 1.00, 1 - currentColor, 1, 1 - currentColor, 0, 0, 1, //4
      0.0, 0.0, 0.0, 1.00, 0 + currentColor, 0 + currentColor, 1, 0, 0, 1, //2
      0.1, 0.0, 0.1, 1.00, 0, 0 + currentColor, 1 - currentColor, 0, 0, 1, //7
      0.1, 0.0, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 0, 0, 0, 1, //6
      0.1, 0.2, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 1, 0, 0, 1, //5
      0.0, 0.0, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, 0, 0, 1, //2
      0.0, 0.2, 0.0, 1.00, 1, 0 + currentColor, 1 - currentColor, 0, 0, 1, //1

      //paw
      0.0, 0.0, 0.1, 1.00, 0, 0 + currentColor, 1 - currentColor, 0, 0, 1, //4 
      0.0, 0.5, 0.1, 1.00, 0 + currentColor, 0, 1 - currentColor, 0, 0, 1, //3
      0.45, 0.0, 0.1, 1.00, 0 + currentColor, 1, 0 + currentColor, 0, 0, 1, //7
      0.45, 0.5, 0.1, 1.00, 0, 1 - currentColor, 1 - currentColor, 0, 0, 1, //8
      0.45, 0.5, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, 0, 0, 1, //5
      0.0, 0.5, 0.1, 1.00, 1 - currentColor, 0, 1 - currentColor, 0, 0, 1, //3
      0.0, 0.5, 0.0, 1.00, 1, 1 - currentColor, 0 + currentColor, 0, 0, 1, //1
      0.0, 0.0, 0.1, 1.00, 1 - currentColor, 1, 1 - currentColor, 0, 0, 1, //4
      0.0, 0.0, 0.0, 1.00, 0 + currentColor, 0 + currentColor, 1, 0, 0, 1, //2
      0.45, 0.0, 0.1, 1.00, 0, 0 + currentColor, 1 - currentColor, 0, 0, 1, //7
      0.45, 0.0, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 0, 0, 0, 1, //6
      0.45, 0.5, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 1, 0, 0, 1, //5
      0.0, 0.0, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, 0, 0, 1, //2
      0.0, 0.5, 0.0, 1.00, 1, 0 + currentColor, 1 - currentColor, 0, 0, 1, //1

      //arm

      0.0, 0.0, 0.3, 1.00, 0, 0 + currentColor, 1 - currentColor, 0, 0, 1, //4 
      0.14, 1, 0.2, 1.00, 0 + currentColor, 0, 1 - currentColor, 0, 0, 1, //3
      0.65, 0.0, 0.3, 1.00, 0 + currentColor, 1, 0 + currentColor, 0, 0, 1, //7
      0.51, 1, 0.2, 1.00, 0, 1 - currentColor, 1 - currentColor, 0, 0, 1, //8
      0.51, 1, 0.1, 1.00, 1 - currentColor, 0 + currentColor, 0, 0, 0, 1, //5
      0.14, 1, 0.2, 1.00, 1 - currentColor, 0, 1 - currentColor, 0, 0, 1, //3
      0.14, 1, 0.1, 1.00, 1, 1 - currentColor, 0 + currentColor, 0, 0, 1, //1
      0.0, 0.0, 0.3, 1.00, 1 - currentColor, 1, 1 - currentColor, 0, 0, 1, //4
      0.0, 0.0, 0.0, 1.00, 0 + currentColor, 0 + currentColor, 1, 0, 0, 1, //2
      0.65, 0.0, 0.3, 1.00, 0, 0 + currentColor, 1 - currentColor, 0, 0, 1, //7
      0.65, 0.0, 0.0, 1.00, 0 + currentColor, 1 - currentColor, 0, 0, 0, 1, //6
      0.51, 1, 0.1, 1.00, 0 + currentColor, 1 - currentColor, 1, 0, 0, 1, //5
      0.0, 0.0, 0.0, 1.00, 1 - currentColor, 0 + currentColor, 0, 0, 0, 1, //2
      0.14, 1, 0.1, 1.00, 1, 0 + currentColor, 1 - currentColor, 0, 0, 1, //1

      // paper plane
      0.0, 0.0, 0.0, 1.00, 1, 1, 1, 0, 0, 1,
      0.3, 0.8, 0.0, 1.00, 0.8, 0.8, 0.8, 0, 0, 1,
      0.28, 0.0, 0.0, 1.00, 0.9, 0.9, 0.9, 0, 0, 1,

      0.32, 0.0, 0.0, 1.00, 0.9, 0.9, 0.9, 0, 0, 1,
      0.3, 0.8, 0.0, 1.00, 0.8, 0.8, 0.8, 0, 0, 1,
      0.6, 0.0, 0.0, 1.00, 1, 1, 1, 0, 0, 1,

      0.3, 0.8, 0.0, 1.00, 0.8, 0.8, 0.8, 0, 0, 1,
      0.28, 0.0, 0.0, 1.00, 0.6, 0.6, 0.6, 0, 0, 1,
      0.3, 0.0, -0.2, 1.00, 0.5, 0.5, 0.5, 0, 0, 1,

      0.3, 0.8, 0.0, 1.00, 0.8, 0.8, 0.8, 0, 0, 1,
      0.32, 0.0, 0.0, 1.00, 0.6, 0.6, 0.6, 0, 0, 1,
      0.3, 0.0, -0.2, 1.00, 0.5, 0.5, 0.5, 0, 0, 1,

      //line
      0.0, 0.0, 0.0, 1.00, 1, 1, 1, 0, 0, 1,
      0.05, 0.05, 0.0, 1.00, 1, 1, 1, 0, 0, 1,

      //tree head

      0.0, 0.0, 0.2, 1.00, 0.7, 0.5, 0, 0, 0, 1, //4
      0.1, 0.4, 0.1, 1.00, 0, 1, 0, 0, 0, 1, //3
      0.2, 0.0, 0.2, 1.00, 0.5, 0, 0.5, 0, 0, 1, //7
      0.1, 0.4, 0.1, 1.00, 0, 1, 0, 0, 0, 1, //8
      0.1, 0.4, 0.1, 1.00, 0, 1, 0, 0, 0, 1, //5
      0.1, 0.4, 0.1, 1.00, 0, 1, 0, 0, 0, 1, //3
      0.1, 0.4, 0.1, 1.00, 0, 1, 0, 0, 0, 1, //1
      0.0, 0.0, 0.2, 1.00, 0.7, 0.5, 0, 0, 0, 1, //4
      0.0, 0.0, 0.0, 1.00, 0.3, 0, 0.7, 0, 0, 1, //2
      0.2, 0.0, 0.2, 1.00, 0.5, 0, 0.5, 0, 0, 1, //7
      0.2, 0.0, 0.0, 1.00, 0, 0.5, 0.5, 0, 0, 1, //6
      0.1, 0.4, 0.1, 1.00, 0, 1, 0, 0, 0, 1, //5
      0.0, 0.0, 0.0, 1.00, 0.3, 0, 0.7, 0, 0, 1, //2
      0.1, 0.4, 0.1, 1.00, 0, 1, 0, 0, 0, 1, //1
      //tree
      0.0, 0.0, 0.2, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //4 
      0.0, 0.8, 0.2, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //3
      0.2, 0.0, 0.2, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //7
      0.2, 0.8, 0.2, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //8
      0.2, 0.8, 0.0, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //5
      0.0, 0.8, 0.2, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //3
      0.0, 0.8, 0.0, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //1
      0.0, 0.0, 0.2, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //4
      0.0, 0.0, 0.0, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //2
      0.2, 0.0, 0.2, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //7
      0.2, 0.0, 0.0, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //6
      0.2, 0.8, 0.0, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //5
      0.0, 0.0, 0.0, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //2
      0.0, 0.8, 0.0, 1.00, 0.5, 0.3, 0.1, 0, 0, 1, //1

      //silengzhui
      0.0, 0.0, sq2, 1.0, 0.0, 1.0, 1.0, sq6, sq2, 1, // Node 0 (apex, +z axis;  blue)
      c30, -0.5, 0.0, 1.0, 1.0, 0.0, 1.0, sq6, sq2, 1, // Node 1 (base: lower rt; red)
      0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, sq6, sq2, 1, // Node 2 (base: +y axis;  grn)
      // Face 1: (right side)
      0.0, 0.0, sq2, 1.0, 1.0, 0.0, 1.0, -sq6, sq2, 1, // Node 0 (apex, +z axis;  blue)
      0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, -sq6, sq2, 1, // Node 2 (base: +y axis;  grn)
      -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, -sq6, sq2, 1, // Node 3 (base:lower lft; white)
      // Face 2: (lower side)
      0.0, 0.0, sq2, 1.0, 0.0, 1.0, 1.0, 0, -2 * sq2, 1, // Node 0 (apex, +z axis;  blue) 
      -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0, -2 * sq2, 1, // Node 3 (base:lower lft; white)
      c30, -0.5, 0.0, 1.0, 1.0, 0.0, 0.1, 0, -2 * sq2, 1, // Node 1 (base: lower rt; red) 
      // Face 3: (base side)  
      -c30, -0.5, 0.0, 1.0, 1.0, 1.0, 1.0, 0, 0, -1, // Node 3 (base:lower lft; white)
      0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0, 0, -1, // Node 2 (base: +y axis;  grn)
      c30, -0.5, 0.0, 1.0, 1.0, 0.0, 1.0, 0, 0, -1,

      0.0, 0.0, 0.0, 1.0, 0.3, 0.3, 0.3, 0, 0, 1, // X axis line (origin: gray)
      0.8, 0.0, 0.0, 1.0, 1.0, 0.3, 0.3, 0, 0, 1, //             (endpoint: red)

      0.0, 0.0, 0.0, 1.0, 0.3, 0.3, 0.3, 0, 0, 1, // Y axis line (origin: white)
      0.0, 0.8, 0.0, 1.0, 0.3, 1.0, 0.3, 0, 0, 1, //             (endpoint: green)

      0.0, 0.0, 0.0, 1.0, 0.3, 0.3, 0.3, 0, 0, 1, // Z axis line (origin:white)
      0.0, 0.0, 0.8, 1.0, 0.3, 0.3, 1.0, 0, 0, 1, //  

      // big z
      0, 0, 500, 1, 0.3, 0.3, 1, 0, 0, 1,
      0, 0, -500, 1, 0.3, 0.3, 1, 0, 0, 1,
    ]);
    var n = 98; // The number of vertices
    makeGroundGrid();
    makeSphere();
    mySiz = handsVerts.length + gndVerts.length + sphVerts.length;
    var nn = mySiz / 10;
    var colorShapes = new Float32Array(mySiz);
    forestStart = 0; // we store the forest first.
    for (i = 0, j = 0; j < handsVerts.length; i++, j++) {
      colorShapes[i] = handsVerts[j];
    }
    gndStart = i; // next we'll store the ground-plane;
    for (j = 0; j < gndVerts.length; i++, j++) {
      colorShapes[i] = gndVerts[j];
    }

    sphStart = i; // next, we'll store the sphere;
    for (j = 0; j < sphVerts.length; i++, j++) { // don't initialize i -- reuse it!
      colorShapes[i] = sphVerts[j];
    }

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
      FSIZE * 10, // Stride -- how many bytes used to store each vertex?
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
      FSIZE * 10, // Stride -- how many bytes used to store each vertex?
      // (x,y,z,w, r,g,b) * bytes/value
      FSIZE * 4); // Offset -- how many bytes from START of buffer to the
    // value we will actually use?  Need to skip over x,y,z,w

    gl.enableVertexAttribArray(a_Color);
    // Enable assignment of vertex buffer object's position data
    var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
      console.log('Failed to get the storage location of a_Normal');
      return -1;
    }
    // Use handle to specify how to retrieve color data from our VBO:
    gl.vertexAttribPointer(
      a_Normal, // choose Vertex Shader attribute to fill with data
      3, // how many values? 1,2,3 or 4. (we're using R,G,B)
      gl.FLOAT, // data type for each value: usually gl.FLOAT
      false, // did we supply fixed-point data AND it needs normalizing?
      FSIZE * 10, // Stride -- how many bytes used to store each vertex?
      // (x,y,z,w, r,g,b) * bytes/value
      FSIZE * 7); // Offset -- how many bytes from START of buffer to the
    // value we will actually use?  Need to skip over x,y,z,w

    gl.enableVertexAttribArray(a_Normal);
    //--------------------------------DONE!
    // Unbind the buffer object 
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return n;

  }

  function draw(gl, n, currentAngle, modelMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, RA, RB, currentColor, oriMatrix, currentRoute, u_x, xvalue) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //extra2
    if (cfollow % 2 == 1) {

      var shapeChange = currentColor / 3;
      modelMatrix.setTranslate(-0.8 + RA, 0.5 + RB, 0.0);
     // var dist = Math.sqrt(xMdragTot * xMdragTot + yMdragTot * yMdragTot);
      modelMatrix.rotate(90, 1, 0, 0);
     // modelMatrix.rotate(dist * 120.0, -yMdragTot + 0.0001, xMdragTot + 0.0001, 0.0);
      modelMatrix.scale(1 - shapeChange, 1 - shapeChange, 1 - shapeChange);
      modelMatrix.rotate(-currentAngle * 0.9, 1, 0, 0, 0);
      quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w); // Quaternion-->Matrix
      modelMatrix.concat(quatMatrix);
      modelMatrix.translate(0.1, 1, 0.05);
      modelMatrix.rotate(-currentAngle * 0.7, 1, 0, 0, 0);
      modelMatrix.translate(0, 0, 0.05)
      modelMatrix.translate(0.05, 0.5, 0.05);
      modelMatrix.scale(0.8, 0.8, 0.8);
      modelMatrix.rotate(-currentAngle, 1, 0, 0); // Make new drawing axes that
      modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
      modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
      modelMatrix.scale(0.85, 0.85, 0.85);
      modelMatrix.rotate(-currentAngle * 0.8, 1, 0, 0);
      modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
      modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
      modelMatrix.scale(0.85, 0.85, 0.85);
      modelMatrix.rotate(-currentAngle, 1, 0, 0);
      modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
 
      viewMatrix.setInverseOf(modelMatrix);
      modelMatrix.setIdentity();
    }

    //extra2

    //extra 3
    if(flyplane%2==1)
    {
    if(rfly){
      fright+=1;
      vnormalx= Math.cos((fleft-fright)*Math.PI/180)*0.2;
      vnormaly=-Math.sin((fright-fleft)*Math.PI/180)*0.2;
          }
          else{ if(lfly==0){
            vnormalx=0;
            vnormaly=0;
          }
        }
    if(lfly){
      fleft+=1;
      vnormalx= -Math.cos((fleft-fright)*Math.PI/180)*0.2;
      vnormaly=Math.sin((fright-fleft)*Math.PI/180)*0.2;
    }
    else {if (rfly==0){
            vnormalx=0;
            vnormaly=0;
    }
  }



  if(tfly){
    g_Lookz=g_Lookz+0.01;
    g_Eyez=g_Eyez+0.01;
  }
  if(bfly){
    g_Lookz=g_Lookz-0.01;
    g_Eyez=g_Eyez-0.01;
  }
    g_EyeX=g_EyeX+Math.sin((fright-fleft)*Math.PI/180)*0.02;
    g_Eyey=g_Eyey+Math.cos((fleft-fright)*Math.PI/180)*0.02;
    g_Lookx=g_EyeX+Math.sin((fright-fleft)*Math.PI/180);
    g_Looky=g_Eyey+Math.cos((fleft-fright)*Math.PI/180);

    }



    //extra 3


    // Perspective view
    gl.viewport(0, // Viewport lower-left corner
      0, // location(in pixels)
      innerWidth / 2, // viewport width, height.
      innerHeight);

    if (cfollow % 2 == 0) {
      viewMatrix.setLookAt(g_EyeX, g_Eyey, g_Eyez, // eye position
        g_Lookx, g_Looky, g_Lookz, // look-at point (origin)
        vnormalx, vnormaly, 1);
    }

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    if(setfrus==0){
    projMatrix.setPerspective(40, 1, 1,g_far);
}
    else{
    projMatrix.setFrustum(fruleft,fruright,frutop,frubot,frunear,frufar);
    //console.log(fruleft,fruright,frutop,frubot,frunear,frufar);
    }
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    drawHand(gl, n, currentAngle, modelMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, RA, RB, currentColor); // Draw the triangle
    drawPlane(gl, n, currentAngle, oriMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, currentRoute, u_x, xvalue);
    var oright=(g_far-1)/3*Math.tan(20*Math.PI/180);
    var oleft=-(g_far-1)/3*Math.tan(20*Math.PI/180);
    var otop=(g_far-1)/3*Math.tan(20*Math.PI/180);
    var obot=-(g_far-1)/3*Math.tan(20*Math.PI/180);
    //Ortho View
    gl.viewport(innerWidth / 2, // Viewport lower-left corner
      0, // (x,y) location(in pixels)
      innerWidth / 2, // viewport width, height.
      innerHeight);

      viewMatrix.setLookAt(g_EyeX, g_Eyey, g_Eyez, // eye position
        g_Lookx, g_Looky, g_Lookz, // look-at point (origin)
        vnormalx, vnormaly, 1); // up vector (+y)

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  //  projMatrix.setOrtho(-3 * (gl.drawingBufferWidth / 2) / gl.drawingBufferHeight, 3 * (gl.drawingBufferWidth / 2) / gl.drawingBufferHeight, -6 * (gl.drawingBufferWidth / 2) / gl.drawingBufferHeight, 6 * (gl.drawingBufferWidth / 2) / gl.drawingBufferHeight, 1, 30);
    projMatrix.setOrtho(oleft,oright,obot,otop,1,g_far);
    // Pass the projection matrix to u_ProjMatrix
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    drawHand(gl, n, currentAngle, oriMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, RA, RB, currentColor); // Draw the triangle
    drawPlane(gl, n, currentAngle, modelMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, currentRoute, u_x, xvalue);

  }


  function drawHand(gl, n, currentAngle, modelMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, RA, RB, currentColor) {
    var shapeChange = currentColor / 3;

    //Arm
    modelMatrix.setTranslate(-0.8 + RA, 0.5 + RB, 0.0); // 'set' means DISCARD old matrix,
    //var dist = Math.sqrt(xMdragTot * xMdragTot + yMdragTot * yMdragTot);
    modelMatrix.rotate(90, 1, 0, 0);
    //modelMatrix.rotate(dist * 120.0, -yMdragTot + 0.0001, xMdragTot + 0.0001, 0.0);
    modelMatrix.scale(1 - shapeChange, 1 - shapeChange, 1 - shapeChange);
    modelMatrix.rotate(-currentAngle * 0.9, 1, 0, 0, 0);
    quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w); // Quaternion-->Matrix
    modelMatrix.concat(quatMatrix); // apply that matrix.

    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, 96, 6);
    gl.drawArrays(gl.TRIANGLE_STRIP, 28, 14);
    modelMatrix.translate(0.1, 1, 0.05);

    //----paw----
    modelMatrix.rotate(-currentAngle * 0.7, 1, 0, 0, 0);
    modelMatrix.translate(0, 0, 0.05)
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, 96, 6);
    gl.drawArrays(gl.TRIANGLE_STRIP, 14, 14);

    //-------little finger---------------
    pushMatrix(modelMatrix);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.05, 0.5, 0.05);
    modelMatrix.scale(0.8, 0.8, 0.8);
    modelMatrix.rotate(-currentAngle, 1, 0, 0); // Make new drawing axes that
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle * 0.8, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);

    //----RingFinger----

    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.15, 0.5, 0.05);
    modelMatrix.rotate(-currentAngle, 1, 0, 0); // Make new drawing axes that
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle * 0.8, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);

    //----middle finger---
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.27, 0.5, 0.05);
    modelMatrix.scale(1.1, 1.1, 1.1);
    modelMatrix.rotate(-currentAngle, 1, 0, 0); // Make new drawing axes that
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle * 0.8, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);


    //----forefinger----
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.39, 0.5, 0.05);
    modelMatrix.rotate(-currentAngle, 1, 0, 0); // Make new drawing axes that
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle * 0.8, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);

    //--thumb---
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.43, 0.3, 0.05);
    modelMatrix.rotate(-45, 0, 0, 1);
    modelMatrix.scale(1.1, 0.8, 1.1)
    modelMatrix.rotate(-currentAngle * 0.7, 1, 0, 0); // Make new drawing axes that
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2); // Move box so that we pivot
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);
    modelMatrix.translate(0.1 / 2, 0.4 / 2, 0.1 / 2);
    modelMatrix.scale(0.85, 0.85, 0.85);
    modelMatrix.rotate(-currentAngle * 0.6, 1, 0, 0);
    modelMatrix.translate(-0.1 / 2, 0, -0.1 / 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 14);

    // ground
    modelMatrix.setRotate(0, 1, 0, 0);
    modelMatrix.translate(0.0, 0.0, 0);
    modelMatrix.scale(0.2, 0.2, 0.2); // shrink the drawing axes 
    modelMatrix.rotate(90, 0, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, // use this drawing primitive, and
      gndStart / 10, // start at this vertex number, and
      gndVerts.length / 10);
    modelMatrix.rotate(-90, 0, 0, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, 102, 2);
  }

  function drawPlane(gl, n, currentAngle, oriMatrix, viewMatrix, u_ModelMatrix, u_ViewMatrix, normalMatrix, u_NormalMatrix, currentRoute, u_x, xvalue) {
    var rute = 0;
    //draw lines
    modelMatrix = oriMatrix;
    modelMatrix.setTranslate(0.3, 2.2, 0);
    modelMatrix.rotate(currentRoute * 2, 0, 1, 0);
    modelMatrix.scale(2, 2, 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, 54, 2);
    modelMatrix.translate(0.1 / 2, 0.1 / 2, 0);
    modelMatrix.rotate(currentRoute * 1.95, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, 54, 2);

    //draw plane
    modelMatrix.translate(0.1 / 2, 0.1 / 2, 0);
    modelMatrix.rotate(currentRoute * 1.9, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, 54, 2);
    modelMatrix.translate(0.1 / 2, 0.1 / 2, 0);
    modelMatrix.rotate(currentRoute * 1.85, 0, 1, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.LINES, 54, 2);
    modelMatrix.translate(0.1 / 2, 0.1 / 2, 0); // 'set' means DISCARD old matrix,
    modelMatrix.scale(0.35, 0.35, 0.35);
    modelMatrix.rotate(90, 0, 0, 1);
    modelMatrix.rotate(-180, 0, 1, 0);
    modelMatrix.rotate(40, 1, 0, 0)
    modelMatrix.rotate(currentAngle, 0, 1, 0); // Make new drawing axes that
    modelMatrix.translate(-0.3, 0, 0.2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 42, 12);

    //tree

    modelMatrix.setTranslate(0.4, 0.5, 0.4);
    modelMatrix.rotate(90, 1, 0, 0);
    modelMatrix.scale(2, 2, 2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 56, 14);
    modelMatrix.translate(0.08, -0.2, 0.08);
    modelMatrix.scale(0.3, 0.3, 0.3);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 70, 14);

    //draw sphere

    xvalue.elements = [0, 0, 0];
    gl.uniform3fv(u_x, xvalue.elements);
    modelMatrix.setTranslate(0.3, -0.8, 0.5); // 'set' means DISCARD old matrix,
    modelMatrix.scale(1, 1, -1); // convert to left-handed coord sys
    modelMatrix.scale(0.3, 0.3, 0.3);
    modelMatrix.rotate(currentRoute, 0, 1, 1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
      sphStart / 10, // start at this vertex number, and 
      sphVerts.length / 10);

    //draw Pyramid
    modelMatrix.setTranslate(-0.3, -1.2, 0.0); // 'set' means DISCARD old matrix,
    modelMatrix.scale(0.5, 0.5, 0.5);
    modelMatrix.rotate(currentRoute, 1, 0, 0); // spin drawing axes on Y axis;
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 84, 12);
    u_x = gl.getUniformLocation(gl.program, 'x');
    xvalue.elements = [0, 0, 1];
    gl.uniform3fv(u_x, xvalue.elements);
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
    alert("Press H or F1 for help!\nPress Arrows keys to move the view\nPress Z(up), X(down), C(left), V(right) to turn the camera up down left and right.\nPress B to raise the camera higher, N for lower.\nMouse drag for Rotating the Hand with Quaternion.\nPress ASDF to move the Hand.\nClick Flying-airplane button to enter airplane navigation control.\nIn this method, use J(left), L(right), I(up), K(down) to drive even roll pitch or yaw the camera.\nClick the Follow button to switch the perspective camera to the little finger of the hand.\nClick Perspective/Frustum button to switch the perspective view between perspective and frustum.\nIn frustum, you can use the 12 buttons blow to freely adjust the camera. ");
  };

  function myKeyDown(ev) {


    switch (ev.keyCode) { // keyboard listener

      case 72:
        help();

        break;
      case 112:
        help();

        break;
      case 38:
        g_Eyey += 0.1;
        g_Looky += 0.1;
        break;

      case 40:
        g_Eyey -= 0.1;
        g_Looky -= 0.1;
        break;

      case 37:
        g_EyeX -= 0.1;
        g_Lookx -= 0.1;
        break;
      case 90:
      alpha-=0.8;
        if(alpha>0){
        g_Lookz =g_Eyez+Math.cos(alpha * Math.PI / 180);}
        break;
      case 88:
      alpha+=0.8;
      if(alpha<180){
        g_Lookz =g_Eyez+Math.cos(alpha * Math.PI / 180);}
        break;
      case 39:
        g_EyeX += 0.1;
        g_Lookx += 0.1;

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
      case 67:
        theta -= 0.8
        g_Lookx = g_EyeX + Math.cos(theta * Math.PI / 180);
        g_Looky = g_Eyey + Math.sin(theta * Math.PI / 180);

        break;
      case 86:
        theta += 0.8
        g_Lookx = g_EyeX + Math.cos(theta * Math.PI / 180);
        g_Looky = g_Eyey + Math.sin(theta * Math.PI / 180);
        break;
      case 74:
         lfly=1;
         //console.log(lfly);
         break;
         case 76:
         rfly=1;
         break;
         case 73:
         tfly=1;
         break;
         case 75:
         bfly=1;
         break;
         case 66:
         g_Eyez+=0.03;
         g_Lookz+=0.03;
         break;
         case 78:
         g_Eyez-=0.03;
         g_Lookz-=0.03;
         break;
      default:
        console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);

        break;
    }

  }
  function myKeyUp(ev){
    switch(ev.keyCode) {
            case 74:
         lfly=0;
         console.log(lfly);
         break;
         
         case 76:
         rfly=0;
         break;
         case 73:
         tfly=0;
         break;
         case 75:
         bfly=0;
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
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left; // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    var x = (xp - canvas.width / 2) / // move origin to center of canvas and
      (canvas.width / 2); // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height / 2) / //                     -1 <= y < +1.
      (canvas.height / 2);
    xMdragTot += (x - xMclik); // Accumulate change-in-mouse-position,&
    yMdragTot += (y - yMclik);
    dragQuat(x - xMclik, y - yMclik);
    xMclik = x; // Make next drag-measurement from here.
    yMclik = y;
  };

  function myMouseUp(ev, gl, canvas) {
    var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
    var xp = ev.clientX - rect.left; // x==0 at canvas left edge
    var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
    var x = (xp - canvas.width / 2) / // move origin to center of canvas and
      (canvas.width / 2); // normalize canvas to -1 <= x < +1,
    var y = (yp - canvas.height / 2) / //                     -1 <= y < +1.
      (canvas.height / 2);
    console.log('myMouseUp  (CVV coords  ):  x, y=\t', x, ',\t', y);
    isDrag = false; // CLEAR our mouse-dragging flag, and
  //  console.log("not drag");
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);
    dragQuat(x - xMclik, y - yMclik);
    console.log('myMouseUp: xMdragTot,yMdragTot =', xMdragTot, ',\t', yMdragTot);
  }
function dragQuat(xdrag, ydrag) {

  var res = 5;
  var qTmp = new Quaternion(0,0,0,1);
  
  var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
  qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
  qTmp.multiply(qNew,qTot);     // apply new rotation to current rotation. 
  qTot.copy(qTmp);

};

  function makeSphere() {
    var slices = 13; // # of slices of the sphere along the z axis. >=3 req'd
    var sliceVerts = 27; // # of vertices around the top edge of the slice
    var topColr = new Float32Array([0.7, 0.7, 0.7]); // North Pole: light gray
    var equColr = new Float32Array([0.3, 0.7, 0.3]); // Equator:    bright green
    var botColr = new Float32Array([0.9, 0.9, 0.9]); // South Pole: brightest gray.
    var sliceAngle = Math.PI / slices; // lattitude angle spanned by one slice.
    sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * 10);
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
      for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += 10) {
        if (v % 2 == 0) {
          sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
          sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
          sphVerts[j + 2] = cos0;
          sphVerts[j + 3] = 1.0;
        } else {
          sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts); // x
          sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts); // y
          sphVerts[j + 2] = cos1; // z
          sphVerts[j + 3] = 1.0; // w.   
        }
        var tc = hsva(360 / 13 * v, 1, 1);
        sphVerts[j + 4] = tc[0]; // equColr[0]; 
        sphVerts[j + 5] = tc[1]; // equColr[1]; 
        sphVerts[j + 6] = tc[2]; // equColr[2];          

        sphVerts[j + 7] = sphVerts[j];
        sphVerts[j + 8] = sphVerts[j + 1];
        sphVerts[j + 9] = sphVerts[j + 2];
      }
    }
  }

  function hsva(h, s, v) {
    if (s > 1 || v > 1) {
      return;
    }
    var th = h % 360;
    var i = Math.floor(th / 60);
    var f = th / 60 - i;
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    var k = v * (1 - s * (1 - f));
    var color = new Array();
    if (!s > 0 && !s < 0) {
      color.push(v, v, v);
    } else {
      var r = new Array(v, n, m, m, k, v);
      var g = new Array(k, v, v, n, m, m);
      var b = new Array(m, m, k, v, v, n);
      color.push(r[i], g[i], b[i]);
    }
    return color;
  }



  function follow() {
    cfollow = cfollow + 1;
    ANGLE_STEP = 5;
    if(flyplane%2==1)
      {flyplane+=1;}
  }
  function planefly(){
  flyplane= flyplane+1;
  if(cfollow%2==1)
    {cfollow+=1;}
  }
  function frulp(){
fruleft+=0.01;
  }
    function frulm(){
fruleft-=0.01;
  }
    function frurp(){
fruright-=0.01;
  }
    function frurm(){
fruright+=0.01;
  }
      function fruup(){
frutop-=0.01;
  }
    function fruum(){
frutop+=0.01;
  }
        function frudp(){
frubot+=0.01;
  }
    function frudm(){
frubot-=0.01;
  }
        function frufp(){
frufar-=0.01;
  }
    function frufm(){
frufar+=0.01;
  }
        function frunp(){
frunear+=0.01;
  }
    function frunm(){
frunear-=0.01;
  }
function setf(){

  setfrus+=1;
  setfrus%=2;
  if (setfrus)
  {
        document.getElementById('PFResult').innerHTML =
          'Frustum Please use keys blow to modify the  view camera.';
  }
  else{
  fruleft=-Math.tan(20*Math.PI/180);
  fruright=Math.tan(20*Math.PI/180);
  frutop=-Math.tan(20*Math.PI/180);
  frubot=Math.tan(20*Math.PI/180);
  frufar=25;
  frunear=1;  
  document.getElementById('PFResult').innerHTML ='Perspective'
  }
  console.log(setfrus)
  document.getElementById('button1').innerHTML.value="aaa";
}