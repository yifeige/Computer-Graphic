var VSHADER_SOURCE =
  'attribute vec4 a_Position; \n' + // vertex position (model coord sys)
  'attribute vec4 a_Positionray;\n'+
  'attribute vec4 a_Normal; \n' + // vertex normal vector (model coord sys)
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform int tracing;\n'+
  'uniform int shademode;\n' +
  'uniform int lightmodeg;\n' +
  'uniform vec3 u_Kd0; \n' + //  Instead, we'll use this 'uniform' 
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'varying mat4 u_MvpMatrix; \n' +
  'uniform vec3 u_eyePosWorldg;\n' +
  'uniform int vatt;\n'+
  'uniform mat4 u_NormalMatrix; \n' + // Inverse Transpose of ModelMatrix;
  'struct Material{\n' +
  'vec3 u_Ke;\n' + // Phong Reflectance: emissive
  'vec3 u_Ka;\n' + // Phong Reflectance: ambient
  // no Phong Reflectance: diffuse? -- no: use v_Kd instead for per-pixel value
  'vec3 u_Ks;\n' + // Phong Reflectance: specular
  'int u_Kshiny;\n' + // Phong Reflectance: 1 < shiny < 200
  '};\n' +
  'uniform Material materialg0;\n' +
  'struct Lamp{ \n' +
  'vec3 u_LampPos;\n' + // Phong Illum: position
  'vec3 u_LampAmb;\n' + // Phong Illum: ambient
  'vec3 u_LampDiff;\n' + // Phong Illum: diffuse
  'vec3 u_LampSpec;\n' + // Phong Illum: specular
  'float onoff;\n' +
  '};\n' +
  'uniform Lamp lampg0;\n' +
  'uniform Lamp lampg1;\n' + 
  'varying vec3 v_Kd; \n' + // Phong Lighting: diffuse reflectance
  'varying vec4 v_Position; \n' +
  'varying vec3 v_Normal; \n' + // Why Vec3? its not a point, hence w==0
  'void main() { \n' +
  'if(tracing>0){\n'+
  '  u_MvpMatrix=u_ProjMatrix*u_ViewMatrix*u_ModelMatrix;\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Position = u_ModelMatrix * a_Position; \n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  
  '  vec3 pointLightDirection0 = lampg0.u_LampPos - v_Position.xyz;\n' +
  '  vec3 pointLightDirection1 = lampg1.u_LampPos - v_Position.xyz;\n' +

  '  float d0 = length(pointLightDirection0);\n' +
  '  float d1 = length(pointLightDirection1);\n' +  
  '  float attenuation0;\n' +
  '  float attenuation1;\n' + 
  '  if(vatt==1){\n' +
  '  attenuation0 = 1.0;\n' +
  '  attenuation1 = 1.0;\n' +
  '  }\n'+
  '  if(vatt==2){\n' +
  '  attenuation0 = 1.0/(0.2*d0);\n' +
  '  attenuation1 = 1.0/(0.2*d1);\n' +
  '  }\n'+
  '  if(vatt==3){\n' +
  '  attenuation0 = 1.0/(0.1*d0*d0);\n' +
  '  attenuation1 = 1.0/(0.1*d1*d1);\n' +
  '  }\n'+


  'if(shademode==0){\n' +
  '  v_Kd = u_Kd0; \n' + // find per-pixel diffuse reflectance from per-vertex
  '}\n' +
  'if(shademode==1){\n' +

 '  vec3 normal = normalize((vec3(u_NormalMatrix * a_Normal))); \n' +
 '  vec4 positon = u_ModelMatrix * a_Position;\n'+
 '  vec3 lightDirection = normalize(lampg0.u_LampPos - positon.xyz);\n' +
 '  vec3 lightDirection1 = normalize(lampg1.u_LampPos - positon.xyz);\n' +
// '  vec3 lightDirection = normalize(vec3(5.0,5.0,6.0)-positon.xyz);\n' +
 //'  vec3 lightDirection1 = normalize(vec3(5.0,5.0,6.0)-positon.xyz);\n' +
 '  vec3 eyeDirection = normalize(u_eyePosWorldg - positon.xyz); \n' +
 '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
 '  float nDotL1 = max(dot(lightDirection1, normal), 0.0); \n' +
 '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
 '  vec3 H1 = normalize(lightDirection1 + eyeDirection); \n' +
 '  float nDotH = max(dot(H, normal), 0.0); \n' +
 '  float nDotH1 = max(dot(H1, normal), 0.0); \n' +
 '  vec3 BH = reflect(-lightDirection,normal); \n' +
 '  vec3 BH1 = reflect(-lightDirection1,normal); \n' +
 '  float nBDotH = max(dot(BH, eyeDirection), 0.0); \n' +
 '  float nBDotH1 = max(dot(BH1, eyeDirection), 0.0); \n' +
 'float e64= 0.0;\n' +
 'float e641= 0.0;\n' +
 'if(lightmodeg==0){\n' + // blinn phong
  '   e64 = pow(nDotH, float(materialg0.u_Kshiny));\n' +
  '   e641 = pow(nDotH1, float(materialg0.u_Kshiny));\n' +
  '}\n' +
  'if(lightmodeg==1){\n' + //phong
  '  e64 = pow(nBDotH, float(materialg0.u_Kshiny));\n' +
  '  e641 = pow(nBDotH1, float(materialg0.u_Kshiny));\n' +
  '}\n' +
  '  vec3 emissive = materialg0.u_Ke;' +
  '  vec3 ambient = lampg0.u_LampAmb * materialg0.u_Ka*lampg0.onoff*attenuation0+lampg1.u_LampAmb * materialg0.u_Ka*lampg1.onoff*attenuation1;\n' +
  '  vec3 diffuse = lampg0.u_LampDiff * u_Kd0 * nDotL*lampg0.onoff*attenuation0+lampg1.u_LampDiff * u_Kd0 * nDotL1*lampg1.onoff*attenuation1;\n' +
  '  vec3 speculr = lampg0.u_LampSpec * materialg0.u_Ks * e64*lampg0.onoff*attenuation0+lampg1.u_LampSpec * materialg0.u_Ks * e641*lampg1.onoff*attenuation1;\n' +



 'v_Kd = diffuse+speculr+emissive+ambient;\n' +

  '}\n' +
  '}\n'+
  'else { \n'+
  '  gl_Position = a_Positionray;\n' +
 '  v_TexCoord = a_TexCoord;\n' +
  '}\n'+
  '}\n';

var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'struct Lamp{ \n' +
  'vec3 u_LampPos;\n' + // Phong Illum: position
  'vec3 u_LampAmb;\n' + // Phong Illum: ambient
  'vec3 u_LampDiff;\n' + // Phong Illum: diffuse
  'vec3 u_LampSpec;\n' + // Phong Illum: specular
  'float onoff;\n' +

  '};\n' +
  'uniform int ftracing;\n'+
  'uniform sampler2D u_Sampler;\n' +            // our 2D texture-addr-maker 
                              // (see initTextures() fcn below)
  'varying vec2 v_TexCoord;\n' +
  'uniform Lamp lamp0;\n' +
  'uniform Lamp lamp1;\n' +
  'uniform int lightmode;\n' +
  // first material definition: you write 2nd, 3rd, etc.
  'struct Material{\n' +
  'vec3 u_Ke;\n' + // Phong Reflectance: emissive
  'vec3 u_Ka;\n' + // Phong Reflectance: ambient
  // no Phong Reflectance: diffuse? -- no: use v_Kd instead for per-pixel value
  'vec3 u_Ks;\n' + // Phong Reflectance: specular
  'int u_Kshiny;\n' + // Phong Reflectance: 1 < shiny < 200
  '};\n' +
  'uniform Material material0;\n' +
  'uniform vec3 u_eyePosWorld; \n' + // Camera/eye location in world coords.
  'varying vec3 v_Normal;\n' + // Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' + // pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd; \n' + // Find diffuse reflectance K_d per pix
  'varying vec4 v_Color;\n' +
  'uniform int shademodef;\n' +
  'uniform int fatt;\n'+
  'void main() { \n' +
  'if(ftracing>0)\n{'+
  '  vec3 pointLightDirection0 = lamp0.u_LampPos - v_Position.xyz;\n' +
  '  vec3 pointLightDirection1 = lamp1.u_LampPos - v_Position.xyz;\n' +

  '  float d0 = length(pointLightDirection0);\n' +
  '  float d1 = length(pointLightDirection1);\n' +  
  '  float attenuation0;\n' +
  '  float attenuation1;\n' + 
  '  if(fatt==1){\n' +
  '  attenuation0 = 1.0;\n' +
  '  attenuation1 = 1.0;\n' +
  '  }\n'+
  '  if(fatt==2){\n' +
  '  attenuation0 = 1.0/(0.2*d0);\n' +
  '  attenuation1 = 1.0/(0.2*d1);\n' +
  '  }\n'+
  '  if(fatt==3){\n' +
  '  attenuation0 = 1.0/(0.1*d0*d0);\n' +
  '  attenuation1 = 1.0/(0.1*d1*d1);\n' +
  '  }\n'+

  //'  float lightmode=dot(mode,mode);\n'+
  'if(shademodef==0){\n' +
  '  vec3 normal = normalize(v_Normal); \n' +
  '  vec3 lightDirection = normalize(lamp0.u_LampPos - v_Position.xyz);\n' +
  '  vec3 lightDirection1 = normalize(lamp1.u_LampPos - v_Position.xyz);\n' +
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  '  float nDotL1 = max(dot(lightDirection1, normal), 0.0); \n' +
  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  vec3 H1 = normalize(lightDirection1 + eyeDirection); \n' +
  '  float nDotH = max(dot(H, normal), 0.0); \n' +
  '  float nDotH1 = max(dot(H1, normal), 0.0); \n' +
  '  vec3 BH = reflect(-lightDirection,normal); \n' +
  '  vec3 BH1 = reflect(-lightDirection1,normal); \n' +
  '  float nBDotH = max(dot(BH, eyeDirection), 0.0); \n' +
  '  float nBDotH1 = max(dot(BH1, eyeDirection), 0.0); \n' +
  'float e64= 0.0;\n' +
  'float e641= 0.0;\n' +
  'if(lightmode==0){\n' + // blinn phong
  '   e64 = pow(nDotH, float(material0.u_Kshiny));\n' +
  '   e641 = pow(nDotH1, float(material0.u_Kshiny));\n' +
  '}\n' +
  'if(lightmode==1){\n' + //phong
  '  e64 = pow(nBDotH, float(material0.u_Kshiny));\n' +
  '  e641 = pow(nBDotH1, float(material0.u_Kshiny));\n' +
  '}\n' +
  '  vec3 emissive = material0.u_Ke;' +
  '  vec3 ambient = lamp0.u_LampAmb * material0.u_Ka*lamp0.onoff*attenuation0+lamp1.u_LampAmb * material0.u_Ka*lamp1.onoff*attenuation1;\n' +
  '  vec3 diffuse = lamp0.u_LampDiff * v_Kd * nDotL*lamp0.onoff*attenuation0+lamp1.u_LampDiff * v_Kd * nDotL1*lamp1.onoff*attenuation1;\n' +
  '  vec3 speculr = lamp0.u_LampSpec * material0.u_Ks * e64*lamp0.onoff*attenuation0+lamp1.u_LampSpec * material0.u_Ks * e641*lamp1.onoff*attenuation1;\n' +
  '  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
  '}\n' +
  'if(shademodef==1){\n' +
  'gl_FragColor=vec4(v_Kd,1.0);\n' +
  '}\n' +
  '}\n'+
  'else {\n'+
  '    gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n'+
  '}\n';
var canvas;
var gl;
var n_vcount;
var u_eyePosWorld;
var u_eyePosWorldg;
var eyePosWorld = new Float32Array(3);
var test = 1;
var vatt;
var fatt;
var  tracing1 ;
var tracing2;
var u_ModelMatrix;
var u_NormalMatrix;
var u_ViewMatrix;
var u_ProjMatrix;
var u_lightmode;
var u_lightmodeg;
//var mode=new Float32Array([0,0,0])
//var u_MvpMatrix;
var modelMatrix = new Matrix4();
var normalMatrix = new Matrix4(); // Transformation matrix for normals
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
//var mvpMatrix = new Matrix4();
var currentAngle = 0;
var ANGLE_STEP = 45;
var xMclik = 0;
var yMclik = 0;
var isDrag = 0;
var theta = 180;
var alpha = 90;
var eyeX = 8;
var eyeY = 0;
var eyeZ = 4;
var lookX = eyeX + Math.cos(theta * Math.PI / 180);
var lookY = eyeY + Math.sin(theta * Math.PI / 180);
var lookZ = eyeZ + Math.cos(alpha * Math.PI / 180);
var gndVerts = new Float32Array();
var gndStart = 0;
var sphVerts = new Float32Array();
var sphStart = 0;
var camlight = 1;
var lightmode = 0;
var adjustlight = 1;
var lightx = 0;
var lighty = 0;
var lightz = 15;
var u_shademode;
var u_shademodef;
var shademode = 0;
var softlight=1;
var scene=1;

function Lamp() {
  this.u_LampPosg;
  this.u_LampAmbig;
  this.u_LampDiffg;
  this.u_LampSpecg;
  this.u_LampPos;
  this.u_LampAmbi;
  this.u_LampDiff;
  this.u_LampSpec;
  this.u_onoff;
  this.u_onoffg;
  this.lampPos = new Float32Array(3); // x,y,z in world coords
  this.lampAmbi = new Float32Array(3); // r,g,b for ambient illumination
  this.lampDiff = new Float32Array(3); // r,g,b for diffuse illumination
  this.lampSpec = new Float32Array(3); // r,g,b for specular illumination
  this.onoff;

  this.setValue = function() {
    gl.uniform3fv(this.u_LampPosg, this.lampPos);
    gl.uniform3fv(this.u_LampAmbig, this.lampAmbi); // ambient
    gl.uniform3fv(this.u_LampDiffg, this.lampDiff); // diffuse
    gl.uniform3fv(this.u_LampSpecg, this.lampSpec); // Specular
    gl.uniform3fv(this.u_LampPos, this.lampPos);
    gl.uniform3fv(this.u_LampAmbi, this.lampAmbi); // ambient
    gl.uniform3fv(this.u_LampDiff, this.lampDiff); // diffuse
    gl.uniform3fv(this.u_LampSpec, this.lampSpec); // Specular
    gl.uniform1f(this.u_onoff, this.onoff);
    gl.uniform1f(this.u_onoffg, this.onoff);
  }
};
var lamp0 = new Lamp();
var lamp1 = new Lamp();

function MP() {
  this.u_Ke;
  this.u_Ka;
  this.u_Kd;
  this.u_Ks;
  this.u_Kshiny;
  this.u_Keg;
  this.u_Kag;
  this.u_Ksg;
  this.u_Kshinyg;
};
var materialPos = new MP();

function Material() {
  this.matl_Ke = new Float32Array(3); // r,g,b for emissive 'reflectance'
  this.matl_Ka = new Float32Array(3); // r,g,b for ambient reflectance
  this.matl_Kd = new Float32Array(3); // r,g,b for diffuse reflectance
  this.matl_Ks = new Float32Array(3); // r,g,b for specular reflectance
  this.matl_Kshiny;
  this.setValue = function(MP) {
    gl.uniform3fv(MP.u_Ke, this.matl_Ke); // Ke emissive
    gl.uniform3fv(MP.u_Ka, this.matl_Ka); // Ka ambient
    gl.uniform3fv(MP.u_Kd, this.matl_Kd); // Kd diffuse
    gl.uniform3fv(MP.u_Ks, this.matl_Ks); // Ks specular
    gl.uniform1i(MP.u_Kshiny, this.matl_Kshiny);
    gl.uniform3fv(MP.u_Keg, this.matl_Ke); // Ke emissive
    gl.uniform3fv(MP.u_Kag, this.matl_Ka); // Ka ambient
    gl.uniform3fv(MP.u_Ksg, this.matl_Ks); // Ks specular
    gl.uniform1i(MP.u_Kshinyg, this.matl_Kshiny);
  }
}
var material0 = new Material();
var material1 = new Material();
var material2 = new Material();
var material3 = new Material();
var material4 = new Material();



function setlamp(Lampx, num) {
  Lampx.u_LampPos = gl.getUniformLocation(gl.program, 'lamp' + num + '.u_LampPos');
  Lampx.u_LampAmbi = gl.getUniformLocation(gl.program, 'lamp' + num + '.u_LampAmb');
  Lampx.u_LampDiff = gl.getUniformLocation(gl.program, 'lamp' + num + '.u_LampDiff');
  Lampx.u_LampSpec = gl.getUniformLocation(gl.program, 'lamp' + num + '.u_LampSpec');
  Lampx.u_onoff = gl.getUniformLocation(gl.program, 'lamp' + num + '.onoff');
  Lampx.u_LampPosg = gl.getUniformLocation(gl.program, 'lampg' + num + '.u_LampPos');
  Lampx.u_LampAmbig = gl.getUniformLocation(gl.program, 'lampg' + num + '.u_LampAmb');
  Lampx.u_LampDiffg = gl.getUniformLocation(gl.program, 'lampg' + num + '.u_LampDiff');
  Lampx.u_LampSpecg = gl.getUniformLocation(gl.program, 'lampg' + num + '.u_LampSpec');
  Lampx.u_onoff = gl.getUniformLocation(gl.program, 'lamp' + num + '.onoff');
  Lampx.u_onoffg = gl.getUniformLocation(gl.program, 'lampg' + num + '.onoff');

  if (!Lampx.u_LampPos || !Lampx.u_LampAmbi || !Lampx.u_LampDiff || !Lampx.u_LampSpec || !Lampx.u_LampPosg || !Lampx.u_LampAmbig || !Lampx.u_LampDiffg || !Lampx.u_LampSpecg) {
    console.log('Failed to get the Lamp0 storage locations');
    return;
  }
}

function setMaterial(MPx, num) {
  MPx.u_Ke = gl.getUniformLocation(gl.program, 'material' + num + '.u_Ke');
  MPx.u_Ka = gl.getUniformLocation(gl.program, 'material' + num + '.u_Ka');
  MPx.u_Kd = gl.getUniformLocation(gl.program, 'u_Kd' + num);
  MPx.u_Ks = gl.getUniformLocation(gl.program, 'material' + num + '.u_Ks');
  MPx.u_Kshiny = gl.getUniformLocation(gl.program, 'material' + num + '.u_Kshiny');
  MPx.u_Keg = gl.getUniformLocation(gl.program, 'materialg0.u_Ke');
  MPx.u_Kag = gl.getUniformLocation(gl.program, 'materialg' + num + '.u_Ka');
  MPx.u_Ksg = gl.getUniformLocation(gl.program, 'materialg' + num + '.u_Ks');
  MPx.u_Kshinyg = gl.getUniformLocation(gl.program, 'materialg' + num + '.u_Kshiny');
  if (!MPx.u_Ke || !MPx.u_Ka || !MPx.u_Kd || !MPx.u_Ks || !MPx.u_Kshiny || !MPx.u_Keg || !MPx.u_Kag || !MPx.u_Ksg || !MPx.u_Kshinyg) {

    console.log('Failed to get the Phong Reflectance storage locations');
    //return;
  }
  if (!MPx.u_Keg) {
    console.log("keg")
  }
  if (!MPx.u_Kag) {
    console.log("kag")
  }
  if (!MPx.u_Ksg) {
    console.log("ksg")
  }
  if (!MPx.u_Kshinyg) {
    console.log("kshinyg")
  }
}

var myPic = new CImgBuf(256,256); // create RGB image buffer object.
                                  // (must be power-of-two size! try 512...)
var myScene = new CScene(); 
function main() {
  canvas = document.getElementById('webgl');
    browserResize();
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  n_vcount = initVertexBuffers(gl);
  if (n_vcount < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  //-----------mvp------------------------  
  u_shademode = gl.getUniformLocation(gl.program, 'shademode');
  u_shademodef = gl.getUniformLocation(gl.program, 'shademodef')
  gl.uniform1i(u_shademode, shademode);
  gl.uniform1i(u_shademodef, shademode);
  u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  u_eyePosWorldg = gl.getUniformLocation(gl.program, 'u_eyePosWorldg');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ModelMatrix || !u_NormalMatrix) {
    console.log('Failed to get uLoc_ matrix storage locations');
    return;
  }
  u_lightmode = gl.getUniformLocation(gl.program, 'lightmode');
  u_lightmodeg = gl.getUniformLocation(gl.program, 'lightmodeg');
  vatt=gl.getUniformLocation(gl.program,'vatt');
  fatt=gl.getUniformLocation(gl.program,'fatt');
  att(1);

  gl.uniform1i(u_lightmode, lightmode);

  gl.uniform1i(u_lightmodeg, lightmode);
  //---------lamp0------------------------

  setlamp(lamp0, 0);
  setlamp(lamp1, 1);
  //--------material0----------

  setMaterial(materialPos, 0);


  //-----------set value

tracing1= gl.getUniformLocation(gl.program, 'tracing');
tracing2= gl.getUniformLocation(gl.program, 'ftracing');
  lamp0.lampPos.set([lightx,lighty,lightz]);
  lamp0.lampAmbi.set([0.4, 0.4, 0.4]);
  lamp0.lampDiff.set([1.0, 1.0, 1.0]);
  lamp0.lampSpec.set([1.0, 1.0, 1.0]);
  lamp0.onoff = 1;
  lamp0.setValue();

  if (camlight == 1) {
    lamp1.lampPos.set([eyeX, eyeY, eyeZ]);
    lamp1.lampAmbi.set([0.4, 0.4, 0.4]);
    lamp1.lampDiff.set([1.0, 1.0, 1.0]);
    lamp1.lampSpec.set([1.0, 1.0, 1.0]);
    lamp1.onoff = 1;
  } else {
    lamp1.lampPos.set([eyeX, eyeY, eyeZ]);
    lamp1.lampAmbi.set([0.4, 0.4, 0.4]);
    lamp1.lampDiff.set([1.0, 1.0, 1.0]);
    lamp1.lampSpec.set([1.0, 1.0, 1.0]);
    lamp1.onoff = 0;
  }
  lamp1.setValue();
  // Init reflectance values for our (first) Phong material in global variables;
  material0.matl_Ke.set([0.20*softlight, 0.20*softlight, 0.0]);
  material0.matl_Ka.set([0.24725, 0.2245, 0.0645, ]);
  material0.matl_Kd.set([0.34615, 0.3143, 0.0903, ]);
  material0.matl_Ks.set([0.797357, 0.723991, 0.208006, ]);
  material0.matl_Kshiny = 83.2; // Specular shinyness exponent

  material1.matl_Ke.set([0.20*softlight, 0.20*softlight, 0.20*softlight]);
  material1.matl_Ka.set([0.23125, 0.23125, 0.23125, ]);
  material1.matl_Kd.set([0.2775, 0.2775, 0.2775, ]);
  material1.matl_Ks.set([0.2775, 0.2775, 0.2775, ]);
  material1.matl_Kshiny = 89.6; // Specular shinyness exponent

  material2.matl_Ke.set([0.10*softlight, 0.20*softlight, 0.10*softlight]);
  material2.matl_Ka.set([0.135, 0.2225, 0.1575, ]);
  material2.matl_Kd.set([0.135, 0.2225, 0.1575, ]);
  material2.matl_Ks.set([0.316228, 0.316228, 0.316228, ]);
  material2.matl_Kshiny = 12.8;

  material3.matl_Ke.set([0.20*softlight, 0.20*softlight, 0.0]);
  material3.matl_Ka.set([0.24725, 0.2245, 0.0645, ]);
  material3.matl_Kd.set([0.34615, 0.3143, 0.0903, ]);
  material3.matl_Ks.set([0.797357, 0.723991, 0.208006, ]);
  material3.matl_Kshiny = 83.2; // Specular shinyness exponent

  material4.matl_Ke.set([0.10*softlight, 0.10*softlight, 0.10*softlight]);
  material4.matl_Ka.set([0.05, 0.05, 0.05, ]);
  material4.matl_Kd.set([0.0, 0.2, 0.6, ]);
  material4.matl_Ks.set([0.1, 0.2, 0.3, ]);
  material4.matl_Kshiny = 5;

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
  document.onkeyup = function(ev) {
    myKeyUp(ev);
  };
  document.onkeydown = function(ev) {
    myKeyDown(ev);
  };
myScene.addGeom(0,3);
myScene.addGeom(1,11);
myScene.addGeom(1,17); 
myScene.addGeom(1,5);
myScene.addGeom(1,9);
myScene.addGeom(2,6);
myScene.addGeom(2,7);
myScene.addGeom(2,6);
myScene.addGeom(2,9);
myScene.Geoms[1].rayTranslate(0,-4,1.1);
myScene.Geoms[1].rayScale(0.5,0.5,0.5);
myScene.Geoms[2].rayTranslate(0,0,1.1);
myScene.Geoms[2].rayScale(1,1,0.3);
myScene.Geoms[3].rayTranslate(0,2,1.1);
myScene.Geoms[4].rayTranslate(0,4,1.1);
myScene.Geoms[5].rayTranslate(0,-4.3,1.1);
myScene.Geoms[6].rayTranslate(15,0,1.1);
myScene.Geoms[6].rayScale(0.2,0.2,0.2);
myScene.Geoms[7].rayTranslate(-3,0,1.1);
myScene.Geoms[8].rayTranslate(-3,3,1.1);
myScene.Geoms[8].rayScale(1,1,0.3);
//console.log(myScene.Geoms.length)
myScene.addLamp([eyeX,eyeY,eyeZ,1],
                [0.4,0.4,0.4,1],
                [1,1,1,1],
                [1,1,1,1]
                 );

myScene.addLamp([lightx,lighty,lightz,1],
                [0.4,0.4,0.4,1],
                [1,1,1,1],
                [1,1,1,1]
                 );

myScene.addLamp([-3+Math.random(),-3+Math.random(),10,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([-1+Math.random(),-3+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([1+Math.random(),-3+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([3+Math.random(),-3+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([-3+Math.random(),-1+Math.random(),10,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([-1+Math.random(),-1+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([1+Math.random(),-1+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([3+Math.random(),-1+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([-3+Math.random(),1+Math.random(),10,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([-1+Math.random(),1+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([1+Math.random(),1+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([-3+Math.random(),1+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([-3+Math.random(),3+Math.random(),10,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([-1+Math.random(),3+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([1+Math.random(),3+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.addLamp([3+Math.random(),3+Math.random(),4,1],
                [0.4/16,0.4/16,0.4/16,1],
                [1/16,1/16,1/16,1],
                [1/16,1/16,1/16,1]
                 );
myScene.rayCam.rayLookat(eyeX,eyeY,eyeZ,lookX,lookY,lookZ, 0, 0, 1)
//myScene.rayCam.rayLookat(5,0,5,0,0,0,0,1,0);
  if (!initTextures(gl, 4)) {
    console.log('Failed to intialize the texture object(s).');
    return;
  }
  if (test == 0) {
    draw();
  } else {
    var tick = function() {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      currentAngle = animate(currentAngle);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      draw();
      requestAnimationFrame(tick, canvas);
    };
    tick();
  }
}

function draw() {

  gl.viewport(0,        // Viewport lower-left corner
              0,                              // location(in pixels)
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight);
      gl.uniform1i(tracing1, 1);
      gl.uniform1i(tracing2, 1);
  eyePosWorld.set([eyeX, eyeY, eyeZ]);
  gl.uniform3fv(u_eyePosWorld, eyePosWorld);
  gl.uniform3fv(u_eyePosWorldg, eyePosWorld);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  viewMatrix.setLookAt(eyePosWorld[0], eyePosWorld[1], eyePosWorld[2], // eye position
    lookX, lookY, lookZ, // look-at point (origin)
    0, 0,1);
  lamp0.lampPos.set([lightx, lighty, lightz]);
  lamp0.onoff = adjustlight;
  lamp0.setValue();
  lamp1.lampPos.set([eyeX, eyeY, eyeZ]);
  lamp1.lampAmbi.set([0.4, 0.4, 0.4]);
  lamp1.lampDiff.set([1.0, 1.0, 1.0]);
  lamp1.lampSpec.set([1.0, 1.0, 1.0]);
  lamp1.onoff = camlight;
  lamp1.setValue();
  gl.uniform1i(u_shademode, shademode);
  gl.uniform1i(u_shademodef, shademode);
  gl.uniform1i(u_lightmode, lightmode);
  gl.uniform1i(u_lightmodeg, lightmode);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  projMatrix.setPerspective(80, canvas.width / canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  drawhand();
  gl.viewport(gl.drawingBufferWidth/2,        // Viewport lower-left corner
              0,                              // location(in pixels)
              gl.drawingBufferWidth/2,        // viewport width, height.
              gl.drawingBufferHeight);
//  gl.uniform1i(u_isTextureLoc, 1);            // DO use texture,

    gl.uniform1i(tracing1, 0);
    gl.uniform1i(tracing2, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

function drawhand() {

  //------------ground----------------

  material3.setValue(materialPos);
  modelMatrix.setRotate(0, 1, 0, 0);
  modelMatrix.translate(0.0, 0.0, 0);
  modelMatrix.scale(0.2, 0.2, 0.2); // shrink the drawing axes 
  modelMatrix.rotate(90, 0, 0, 1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    gndStart / 7, // start at this vertex number, and
    gndVerts.length / 7);

 if(scene==1){
  //--------------------------shpere------------------------------------------------------------------
    material1.setValue(materialPos);
  modelMatrix.setTranslate(0, -4.3, 1); // 'set' means DISCARD old matrix,


  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 24, 24);

      material1.setValue(materialPos);
  modelMatrix.setTranslate(3, 0, 1); // 'set' means DISCARD old matrix,
  modelMatrix.scale(0.2,0.2,0.2);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 24, 24);

      material1.setValue(materialPos);
  modelMatrix.setTranslate(-5, 0, 1); // 'set' means DISCARD old matrix,


  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 24, 24);
      material1.setValue(materialPos);
  modelMatrix.setTranslate(-3, 0, 1); // 'set' means DISCARD old matrix,
 modelMatrix.scale(1,1,0.3);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 24, 24);

  material1.setValue(materialPos);
  modelMatrix.setTranslate(0,0,0);
  modelMatrix.translate(-3, -3, 1); // 'set' means DISCARD old matrix,
  //modelMatrix.scale(1, 1, -1); // convert to left-handed coord sys
  //modelMatrix.scale(0, 0.3, 0.3);
  modelMatrix.scale(0.5,0.5,0.5);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    sphStart / 7, // start at this vertex number, and 
    sphVerts.length / 7);
  material2.setValue(materialPos);
  modelMatrix.setTranslate(0, 0, 1); // 'set' means DISCARD old matrix,
  modelMatrix.scale(1,1,0.3)
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    sphStart / 7, // start at this vertex number, and 
    sphVerts.length / 7);
  material1.setValue(materialPos);
  modelMatrix.setTranslate(0, 2, 1); // 'set' means DISCARD old matrix,

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    sphStart / 7, // start at this vertex number, and 
    sphVerts.length / 7);
  material2.setValue(materialPos);
  modelMatrix.setTranslate(0, 4, 1); // 'set' means DISCARD old matrix,

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    sphStart / 7, // start at this vertex number, and 
    sphVerts.length / 7);
}
else{
      material1.setValue(materialPos);
  modelMatrix.setTranslate(2, 0, 1); // 'set' means DISCARD old matrix,


  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 24, 24);

      material1.setValue(materialPos);
  modelMatrix.setTranslate(3.6, 3.6, 1); // 'set' means DISCARD old matrix,
  modelMatrix.scale(0.2,0.2,0.2);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 24, 24);

      material1.setValue(materialPos);
  modelMatrix.setTranslate(0, 2, 1); // 'set' means DISCARD old matrix,


  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 24, 24);
      material1.setValue(materialPos);
  modelMatrix.setTranslate(-3,3, 1); // 'set' means DISCARD old matrix,
 modelMatrix.scale(1,1,1.8);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, 24, 24);

  material1.setValue(materialPos);
  modelMatrix.setTranslate(0,0,0);
  modelMatrix.translate(-4, 0, 2); // 'set' means DISCARD old matrix,
  //modelMatrix.scale(1, 1, -1); // convert to left-handed coord sys
  //modelMatrix.scale(0, 0.3, 0.3);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    sphStart / 7, // start at this vertex number, and 
    sphVerts.length / 7);
  material2.setValue(materialPos);
  modelMatrix.setTranslate(-2, 0, 2); // 'set' means DISCARD old matrix,
  //modelMatrix.scale(1,1,0.3)
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    sphStart / 7, // start at this vertex number, and 
    sphVerts.length / 7);
  material1.setValue(materialPos);
  modelMatrix.setTranslate(-3,-4, 2); // 'set' means DISCARD old matrix,

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    sphStart / 7, // start at this vertex number, and 
    sphVerts.length / 7);
  material2.setValue(materialPos);
  modelMatrix.setTranslate(-3, -2,2); // 'set' means DISCARD old matrix,

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, // use this drawing primitive, and
    sphStart / 7, // start at this vertex number, and 
    sphVerts.length / 7);
}


}

function initVertexBuffers(gl) { // Create a sphere
  var c30 = Math.sqrt(0.75); // == cos(30deg) == sqrt(3) / 2
  var sq2 = Math.sqrt(2.0);
  var sq6 = Math.sqrt(6);
  var handsVerts = new Float32Array([
    //finger

    -0.95, 0.95, 0, 1, 0, 0, 1,
    -0.95, -0.95, 0, 0, 0, 0, 1,
    0.95, 0.95, 1, 1, 0, 0, 1,
    0.95, -0.95, 1, 0, 0, 0, 1,

    0.1, 0.2, 0.1, 1, 1, 0, 0,
    0.1, 0, 0.1, 1, 1, 0, 0,
    0.1, 0.2, 0, 1, 1, 0, 0,
    0.1, 0, 0, 1, 1, 0, 0,

    0.1, 0, 0, 1, 0, 0, -1,
    0.1, 0.2, 0, 1, 0, 0, -1,
    0, 0, 0, 1, 0, 0, -1,
    0, 0.2, 0, 1, 0, 0, -1,

    0, 0.2, 0, 1, -1, 0, 0,
    0, 0, 0, 1, -1, 0, 0,
    0, 0.2, 0.1, 1, -1, 0, 0,
    0, 0, 0.1, 1, -1, 0, 0,

    0, 0, 0.1, 1, 0, -1, 0,
    0, 0, 0, 1, 0, -1, 0,
    0.1, 0, 0.1, 1, 0, -1, 0,
    0.1, 0, 0, 1, 0, -1, 0,

    0, 0.2, 0, 1, 0, 1, 0,
    0, 0.2, 0.1, 1, 0, 1, 0,
    0.1, 0.2, 0, 1, 0, 1, 0,
    0.1, 0.2, 0.1, 1, 0, 1, 0,

    //paw
    -1, -1, 1, 1, 0, 0, 1,
    -1,  1, 1, 1, 0, 0, 1,
     1, -1, 1, 1, 0, 0, 1,
     1,  1, 1, 1, 0, 0, 1,

    1,  1,  1,  1, 1, 0, 0,
    1, -1,  1,  1, 1, 0, 0,
    1,  1, -1,  1, 1, 0, 0,
    1, -1, -1,  1, 1, 0, 0,

     1, -1, -1, 1, 0, 0, -1,
     1,  1, -1, 1, 0, 0, -1,
    -1, -1, -1, 1, 0, 0, -1,
    -1,  1, -1, 1, 0, 0, -1,

    -1,  1, -1, 1, -1, 0, 0,
    -1, -1, -1, 1, -1, 0, 0,
    -1,  1,  1, 1, -1, 0, 0,
    -1, -1,  1, 1, -1, 0, 0,

    -1, -1,  1, 1, 0, -1, 0,
    -1, -1, -1, 1, 0, -1, 0,
     1, -1,  1, 1, 0, -1, 0,
     1, -1, -1, 1, 0, -1, 0,

    -1,  1, -1, 1, 0, 1, 0,
    -1,  1,  1, 1, 0, 1, 0,
     1,  1, -1, 1, 0, 1, 0,
     1,  1,  1, 1, 0, 1, 0,

    0, 0, 500, 1, 0, 0, 1,
    0, 0, -500, 1, 0, 0, 1,

    0.0, 0.0, sq2, 1.0, sq6, sq2, 1, // Node 0 (apex, +z axis;  blue)
    c30, -0.5, 0.0, 1.0, sq6, sq2, 1, // Node 1 (base: lower rt; red)
    0.0, 1.0, 0.0, 1.0, sq6, sq2, 1, // Node 2 (base: +y axis;  grn)
    // Face 1: (right side)
    0.0, 0.0, sq2, 1.0, -sq6, sq2, 1, // Node 0 (apex, +z axis;  blue)
    0.0, 1.0, 0.0, 1.0, -sq6, sq2, 1, // Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, -sq6, sq2, 1, // Node 3 (base:lower lft; white)
    // Face 2: (lower side)
    0.0, 0.0, sq2, 1.0, 0.0, -2 * sq2, 1, // Node 0 (apex, +z axis;  blue) 
    -c30, -0.5, 0.0, 1.0, 1.0, -2 * sq2, 1, // Node 3 (base:lower lft; white)
    c30, -0.5, 0.0, 1.0, 1.0, -2 * sq2, 1, // Node 1 (base: lower rt; red) 
    // Face 3: (base side)  
    -c30, -0.5, 0.0, 1.0, 0, 0, -1, // Node 3 (base:lower lft; white)
    0.0, 1.0, 0.0, 1.0, 0, 0, -1, // Node 2 (base: +y axis;  grn)
    c30, -0.5, 0.0, 1.0, 0, 0, -1,
  ]);
  var n = 62;
  //makeGroundGrid();
  makeground();
  makeSphere();
  mySiz = handsVerts.length + gndVerts.length + sphVerts.length; //+ gndVerts.length + sphVerts.length;
  //console.log(mySiz / 7);
  var nn = mySiz / 7;
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
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
  var FSIZE = colorShapes.BYTES_PER_ELEMENT;
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  var ray_Position=gl.getAttribLocation(gl.program, 'a_Positionray')
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  if(ray_Position<0){
    console.log('failed to get ray ')
    return -1;
  }
    gl.vertexAttribPointer(ray_Position,    // select the vertex attrib in the GPU
                          2,      // # of values per attrib (1,2,3, or 4)
                          gl.FLOAT,   // data-type of each value in this attrib
                          false,    // is this attrib already normalized?
                          FSIZE*7,  // stride: # of bytes from start of this
                                // attribute to the start of the next one
                          0);
  gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE * 7, 0);
  var a_TexCoordID = gl.getAttribLocation(gl.program, 'a_TexCoord');
  if (a_TexCoordID < 0) {
    console.log('Failed to get the GPU storage location of a_TexCoord');
    return -1;
  }
    gl.vertexAttribPointer(a_TexCoordID,  // select the vertex attrib in the GPU 
                          2,          // # of values per attrib (1,2,3, or 4)
                          gl.FLOAT,   // data-type of each value in this attrib
                          false,      // is this attrib already normalized?
                          FSIZE*7,    // stride: # of bytes from start of this
                                      // attribute to the start of the next one
                          FSIZE*2);   // offset: # of bytes to the start of data
  gl.enableVertexAttribArray(a_TexCoordID); 
  gl.enableVertexAttribArray(a_Position);
    gl.enableVertexAttribArray(ray_Position);
  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (a_Normal < 0) {
    console.log('Failed to get the storage location of a_Normal');
    return -1;
  }
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 7, FSIZE * 4);
  gl.enableVertexAttribArray(a_Normal);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return n;
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

function myKeyDown(ev) {


  switch (ev.keyCode) { // keyboard listener
    case 87:

    lookY += 0.1*Math.sin(theta*Math.PI / 180);
    eyeY += 0.1*Math.sin(theta*Math.PI / 180);
    lookX += 0.1*Math.cos(theta*Math.PI / 180);
    eyeX += 0.1*Math.cos(theta*Math.PI / 180);

      break;
    case 83:
    lookY -= 0.1*Math.sin(theta*Math.PI / 180);
    eyeY -= 0.1*Math.sin(theta*Math.PI / 180);
    lookX -= 0.1*Math.cos(theta*Math.PI / 180);
    eyeX -= 0.1*Math.cos(theta*Math.PI / 180);
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
    case 65:
      eyeZ += 0.03;
      lookZ += 0.03;
      break;
    case 68:
      eyeZ -= 0.03;
      lookZ -= 0.03;
      break;
    case 90: //z
      camlight += 1;
      camlight %= 2;
      myScene.Lamps[0].lampON=camlight;

      break;
    case 88: //x
      lightchange();
      break;
    case 38:
      lighty += 0.5;
      break;
    case 40:
      lighty -= 0.5;
      break;
    case 37:
      lightx += 0.5;
      break;
    case 39:
      lightx -= 0.5;
      break;
    case 16:
      lightz += 0.5;
      break;
    case 17:
      lightz -= 0.5;

      break;
          case 84:
        myScene.rayCam.rayLookat(eyeX,eyeY,eyeZ,lookX,lookY,lookZ, 0, 0, 1);
        vec4.copy(myScene.Lamps[0].lampPos,[eyeX,eyeY,eyeZ,1]);
        vec4.copy(myScene.Lamps[0].lampPos,[lightx,lighty,lightz,1]);
        myScene.makeRayTracedImage(myPic);
        refreshTextures();
        break;
      case 72:
        help();

        break;
    case 67:
      shadem();
      break;
      case 32:
      changescene();
      break;

    default:
      console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);

      break;
  }

}

function myKeyUp(ev) {
  switch (ev.keyCode) {

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

}

//-----------------shpere-----------------------------------------------------------------------------
function makeSphere() {
  var slices = 13; // # of slices of the sphere along the z axis. >=3 req'd
  var sliceVerts = 27; // # of vertices around the top edge of the slice
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
    for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += 7) {
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
      sphVerts[j + 4] = sphVerts[j];
      sphVerts[j + 5] = sphVerts[j + 1];
      sphVerts[j + 6] = sphVerts[j + 2];
    }
  }
}

function makeground() {
  var x = -100;
  var y = -100;
  var i = 0;
  var j = 0;
  var gap = 0.2;
  var nx = 0;
  var ny = 0;
  var nz = 1;
  planeVerts = [];

  for (j = y; j < -y; j += 2) {
    planeVerts.push(i, j, 0, 1, nx, ny, nz);
    for (i = x; i < -x; i++) {
      nx = -0.1+Math.random() / 5;
      ny = -0.1+Math.random() / 5;
      nz = 0.9 + Math.random() / 5;
      planeVerts.push(i, j + 1, 0, 1, nx, ny, nz);
      planeVerts.push(i + 1, j, 0, 1, nx, ny, nz);
    }

    for (i = -x; i > x; i--) {
      nx = -0.1 + Math.random() / 5;
      ny = -0.1 + Math.random() / 5;
      nz = 0.9 + Math.random() / 5;
      planeVerts.push(i, j + 2, 0, 1, nx, ny, nz);
      planeVerts.push(i - 1, j + 1, 0, 1, nx, ny, nz);
    }
  }
  gndVerts = new Float32Array(planeVerts);
}

function headlight() {
  camlight += 1;
  camlight %= 2;
}

function lightchange() {
myScene.isAA=!myScene.isAA;
if(myScene.isAA){
  console.log("4*4 Jitter antialiasing")
}
else{
  console.log("1 sample per pixel")
}
}

function adjlight() {
  adjustlight += 1;
  adjustlight %= 2;
  myScene.Lamps[1].lampON=adjustlight;
}

function submitA() {
  var R = document.getElementById('ar').value;
  var G = document.getElementById('ag').value;
  var B = document.getElementById('ab').value;
  if (!R || !G || !B || R < 0 || G < 0 || B < 0 || R > 1 || G > 1 || B > 1) {
    console.log("invaliad submitA");
    alert("Please input valid RGB value (0<=RGB<=1) for ambient before submit!")
  } else {
    lamp0.lampAmbi.set([R, G, B]);
  }

}

function submitD() {
  var R = document.getElementById('dr').value;
  var G = document.getElementById('dg').value;
  var B = document.getElementById('db').value;
  if (!R || !G || !B || R < 0 || G < 0 || B < 0 || R > 1 || G > 1 || B > 1) {
    console.log("invaliad submitA");
    alert("Please input valid RGB value (0<=RGB<=1) for diffuse before submit!")
  } else {
    lamp0.lampDiff.set([R, G, B]);
  }

}

function submitS() {
  var R = document.getElementById('sr').value;
  var G = document.getElementById('sg').value;
  var B = document.getElementById('sb').value;
  if (!R || !G || !B || R < 0 || G < 0 || B < 0 || R > 1 || G > 1 || B > 1) {
    console.log("invaliad submitA");
    alert("Please input valid RGB value (0<=RGB<=1) for diffuse before submit!")
  } else {
    lamp0.lampSpec.set([R, G, B]);
  }

}
function submit() {

  var X = document.getElementById('ax').value;
  var Y = document.getElementById('ay').value;
  var Z = document.getElementById('az').value;
 if (!X || !Y || !Z ) {
    console.log("invaliad submitA");
    alert("Please input valid Poistion value !")
  } else{
  console.log(X, Y, Z);
  lightx=X;
  lighty=Y;
  lightz=Z;
  lamp0.lampPos.set([lightx, lighty, lightz]);
  lamp0.setValue();
  vec4.copy(myScene.Lamps[1].lampPos,[lightx,lighty,lightz,1]);
}
}
function l1off(){
  adjlight();
}

function reset() {
  lamp0.lampPos.set([lightx, lighty, lightz]);
  lamp0.lampAmbi.set([0.4, 0.4, 0.4]);
  lamp0.lampDiff.set([1.0, 1.0, 1.0]);
  lamp0.lampSpec.set([1.0, 1.0, 1.0]);
  lamp0.onoff = 1;
  lamp0.setValue();
}

function shadem() {
  softlight += 1;
  softlight %= 2;
  for (i=2;i<myScene.Lamps.length;i++){
    myScene.Lamps[i].lampON=softlight;
  }
  console.log(softlight)

}
function att (num) {
gl.uniform1i(vatt,num);
gl.uniform1i(fatt,num);
}
  function help() { // help message
    alert("Press H for help!\n"+
      "Press JLIK to rotate the camera\n"+
      "Press K(up), I(down), J(left), L(right) to turn the camera up down left and right.\n"+
      "Press A to raise the camera higher, D for lower.\n"+
      "Use the Head Light buttun or Z to turn on or off the headlight.\n"+
      "Press Space to switch between two scenes\n"+
      "Use T to ra tracing\n"+
      "Use the text area blow it to set the position of a light, the other one is bound to the eyepoint.\n"+
      "Use C to swich on/off the AreaLight, which very time consuming.\n"+
      "Use X to swich on/off the antialiasing.\n"+
      "Use the text area to set the reflection depth, which is very time consuming, the default is 2.\n");
  };
  function browserResize() {

 console.log('myCanvas width,height=', canvas.width, canvas.height);    
 console.log('Browser window: innerWidth,innerHeight=', 
                                innerWidth, innerHeight); 
                    // See: http://www.w3schools.com/jsref/obj_window.asp
  //Make a square canvas/CVV fill the SMALLER of the width/2 or height:
  if(innerWidth > 2*innerHeight) {  // fit to brower-window height
    canvas.width = 2*innerHeight-20;
    canvas.height = innerHeight-20;
    }
  else {  // fit canvas to browser-window width
    canvas.width = innerWidth-20;
    canvas.height = 0.5*innerWidth-20;
    }  
 console.log('NEW myCanvas width,height=', canvas.width, canvas.height);    
}
function initTextures(gl, n) {
//==============================================================================
// set up the GPU to supply a texture image and pixel-by-pixel texture addresses
// for our Fragment Shader.
  var textureID = gl.createTexture();   // Get GPU location for new texture map 
  if (!textureID) {
    console.log('Failed to create the texture object on the GPU');
    return false;
  }

  // Get GPU location of a new uniform u_Sampler
  var u_SamplerID = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_SamplerID) {
    console.log('Failed to get the GPU location of u_Sampler');
    return false;
  }

  // 2D color image:  8-bit unsigned integers in a 256*256*3 array
  // to store r,g,b,r,g,b integers (8-bit)
  // WebGL texture map sizes MUST be a power-of-two (2,4,8,16,32,64,...4096)

  myPic.setTestPattern(1);        // fill it with an initial test-pattern.
                                  // 0 == colorful L-shaped pattern
                                  // 1 == uniform orange screen
  
  // Enable texture unit0 for our use
  gl.activeTexture(gl.TEXTURE0);
  // Bind our texture object (made at start of this fcn) to GPU's texture hdwe.
  gl.bindTexture(gl.TEXTURE_2D, textureID);
  // allocate memory and load the texture image into our texture object on GPU:
  gl.texImage2D(gl.TEXTURE_2D,  //  'target'--the use of this texture
                0,              //  MIP-map level (default: 0)
                gl.RGB,         // GPU's data format (RGB? RGBA? etc)
                myPic.xSiz,     // image width in pixels,
                myPic.ySiz,     // image height in pixels,
                0,              // byte offset to start of data
                gl.RGB,         // source/input data format (RGB? RGBA?)
                gl.UNSIGNED_BYTE,   // data type for each color channel       
                myPic.iBuf);  // data source.
                
  // Set the WebGL texture-filtering parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture unit 0 to be driven by the sampler
  gl.uniform1i(u_SamplerID, 0);
  return true;                  // done.
}
function refreshTextures() {
//==============================================================================
// Modify/update the contents of the texture map(s) stored in the GPU;
// copy current contents of CImgBuf object 'myPic'  (see initTextures() above)
// into the existing texture-map object stored in the GPU:

  gl.texSubImage2D(gl.TEXTURE_2D,   //  'target'--the use of this texture
                0,              //  MIP-map level (default: 0)
                0,0,            // xoffset, yoffset (shifts the image)
                myPic.xSiz,     // image width in pixels,
                myPic.ySiz,     // image height in pixels,
                gl.RGB,         // source/input data format (RGB? RGBA?)
                gl.UNSIGNED_BYTE,   // data type for each color channel       
                myPic.iBuf);  // data source.
}
function changeitt(){
    var X = document.getElementById('itt').value;
    if(0<=X&&X<=16){
      console.log("set reflection to", X);
      myScene.relfec=X;
    }
    else{

          alert("Please input valid time (0<=time<=16)!")

    }
}
function changescene(){
  scene+=1;
  scene%=2;
  console.log("current scene is",scene);
  if(scene==1){
    for(var i=0;i<myScene.Geoms.length;i++){
  myScene.Geoms[i].raySetIdentity();
}
myScene.Geoms[0].mat=3;
    myScene.Geoms[1].rayTranslate(0,-4,1.1);
myScene.Geoms[1].rayScale(0.5,0.5,0.5);
myScene.Geoms[2].rayTranslate(0,0,1.1);
myScene.Geoms[2].rayScale(1,1,0.3);
myScene.Geoms[3].rayTranslate(0,2,1.1);
myScene.Geoms[4].rayTranslate(0,4,1.1);
myScene.Geoms[5].rayTranslate(0,-4.3,1.1);
myScene.Geoms[6].rayTranslate(15,0,1.1);
myScene.Geoms[6].rayScale(0.2,0.2,0.2);
myScene.Geoms[7].rayTranslate(-3,0,1.1);
myScene.Geoms[8].rayTranslate(-3,3,1.1);
myScene.Geoms[8].rayScale(1,1,0.3);
  }
  else{
for(var i=0;i<myScene.Geoms.length;i++){
  myScene.Geoms[i].raySetIdentity();
}
myScene.Geoms[0].mat=4;
myScene.Geoms[1].rayTranslate(-4,0,2.1);
myScene.Geoms[1].mat=1;
myScene.Geoms[2].rayTranslate(-2,0,2.1);
myScene.Geoms[2].mat=2;
myScene.Geoms[3].rayTranslate(-3,-4,2.1);
myScene.Geoms[4].rayTranslate(-3,-2,2.1);
myScene.Geoms[5].rayTranslate(2,0,1.1);
myScene.Geoms[6].rayTranslate(18,18,1.1);
myScene.Geoms[6].rayScale(0.2,0.2,0.2);
myScene.Geoms[7].rayTranslate(0,2,1.1);
myScene.Geoms[8].rayTranslate(-3,3,1.1);
myScene.Geoms[8].rayScale(1,1,1.8);
  }
}
