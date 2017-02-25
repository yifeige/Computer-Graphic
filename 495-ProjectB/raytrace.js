function CRay() {
	//==============================================================================
	// Object for a ray in an unspecified coord. system (usually 'world' coords).
	this.orig = vec4.fromValues(0, 0, 0, 1); // Ray starting point (x,y,z,w)
	// (default: at origin
	this.dir = vec4.fromValues(0, 0, -1, 0); // The ray's direction vector 
	// (default: look down -z axis)
}

CRay.prototype.printMe = function(name) {
	//==============================================================================
	// print ray's values in the console window:
	if (name == undefined) name = ' ';
	console.log('CRay:', name, '   origin:\t', this.orig[0], ',\t',
		this.orig[1], ',\t', this.orig[2], ',\t', this.orig[3]);
	console.log('     ', name, 'direction:\t', this.dir[0], ',\t',
		this.dir[1], ',\t', this.dir[2], ',\t', this.dir[3]);
}


function CCamera() {

	this.eyePt = vec4.fromValues(0, 0, 5, 1);
	this.uAxis = vec4.fromValues(1, 0, 0, 0); // camera U axis == world x axis			
	this.vAxis = vec4.fromValues(0, 1, 0, 0); // camera V axis == world y axis
	this.nAxis = vec4.fromValues(0, 0, 1, 0); // camera N axis == world z axis.

	this.iNear = 1.0; // CAUTION! SIGN PROBLEMS! (image plane is at n= -iNear)
	this.iLeft = -1.0;
	this.iRight = 1.0;
	this.iBot = -1.0;
	this.iTop = 1.0;
	// and the lower-left-most corner of the image is at (u,v,n) = (iLeft,iBot,-1).
	this.xmax = myPic.xSiz; // horizontal,
	this.ymax = myPic.ySiz; // vertical image resolution.

	this.ufrac = (this.iRight - this.iLeft) / this.xmax; // pixel tile's width
	this.vfrac = (this.iTop - this.iBot) / this.ymax; // pixel tile's height.
	this.isAA = true; // DEFAULT: no antialiasing by jittered supersampling.
	this.subTiles = 1; // super-sampling amount (1x1,2x2,3x3,4x4, etc)
}
CCamera.prototype.rayLookat = function(ex, ey, ez, lx, ly, lz, vx, vy, vz) {
	var cop = vec3.fromValues(ex, ey, ez);
	var looktemp = vec3.fromValues(lx, ly, lz);
	var up = vec3.fromValues(vx, vy, vz);
	var N = vec3.fromValues(0, 0, 0);
	vec3.subtract(N, cop, looktemp);
	vec3.normalize(N, N);
	var U = vec3.fromValues(0, 0, 0);
	vec3.cross(U, up, N)

	vec3.normalize(U, U);
	var V = vec3.fromValues(0, 0, 0);
	vec3.cross(V, N, U);
	vec3.normalize(V, V);
	//console.log(N, V, U)
	this.eyePt[0] = ex;
	this.eyePt[1] = ey;
	this.eyePt[2] = ez;
	this.uAxis[0] = U[0];
	this.uAxis[1] = U[1];
	this.uAxis[2] = U[2];
	this.vAxis[0] = V[0];
	this.vAxis[1] = V[1];
	this.vAxis[2] = V[2];
	this.nAxis[0] = N[0];
	this.nAxis[1] = N[1];
	this.nAxis[2] = N[2];
}
CCamera.prototype.setEyeRay = function(myeRay, xpos, ypos) {

	// Convert image-plane location (xpos,ypos) in the camera's U,V,N coords:
	var posU = this.iLeft + xpos * this.ufrac; // U coord,
	var posV = this.iBot + ypos * this.vfrac; // V coord,
	//  and the N coord is always -1, at the image-plane (zNear) position.
	// Then convert this point location to world-space X,Y,Z coords using our 
	// camera's unit-length coordinate axes uAxis,vAxis,nAxis
	xyzPos = new vec4.create(); // make vector 0,0,0,0.	
	vec4.scaleAndAdd(xyzPos, xyzPos, this.uAxis, posU); // xyzPos += Uaxis * posU;
	vec4.scaleAndAdd(xyzPos, xyzPos, this.vAxis, posV); // xyzPos += Vaxis * posU;
	vec4.scaleAndAdd(xyzPos, xyzPos, this.nAxis, -this.iNear); // += Naxis*(-iNear)
	// The eyeRay we want consists of just 2 world-space values:
	//  	-- the ray origin == camera origin == eyePt in XYZ coords
	//		-- the ray direction TO image-plane point FROM ray origin;
	//				myeRay.dir = (xyzPos + eyePt) - eyePt = xyzPos; thus
	vec4.copy(myeRay.orig, this.eyePt);
	vec4.copy(myeRay.dir, xyzPos);
}

CCamera.prototype.traceGeom = function(Ray, i, j, colr, Scene) {

	if (Scene.isAA == false) {

		this.setEyeRay(Ray, i, j);
		Scene.traceRay(Ray, colr, 1);
		return;
	} else {
		//console.log("1")
		for (var jj = 0; jj < Scene.ySuperAA; jj++) { // Antialias: for each sub-tile row
			for (var ii = 0; ii < Scene.xSuperAA; ii++) { // 	and for each sub-tile columns:
				this.setEyeRay(Ray, // Create jittered eye ray
					i + ((ii + Math.random()) / Scene.xSuperAA), // randomly within the
					j + ((jj + Math.random()) / Scene.ySuperAA));
				color = vec4.fromValues(0, 0, 0, 0);
				Scene.traceRay(Ray, color, 0);
				//console.log(color)
				vec4.add(colr, colr, color, 1)
			}
		}
		vec4.scale(colr, colr, 1.0 / (Scene.xSuperAA * Scene.ySuperAA));
	}
}

// allowable values for CGeom.shapeType variable.  Add some of your own!
const JT_GNDPLANE = 0; // An endless 'ground plane' surface.
const JT_SPHERE = 1; // A sphere.
const JT_BOX = 2; // An axis-aligned cube.
const JT_CYLINDER = 3; // A cylinder with user-settable radius at each end
// and user-settable length.  radius of 0 at either
// end makes a cone; length of 0 with nonzero
// radius at each end makes a disk.
const JT_TRIANGLE = 4; // a triangle with 3 vertices.
const JT_BLOBBIES = 5; // Implicit surface:Blinn-style Gaussian 'blobbies'.


function CGeom(shapeSelect) {


	if (shapeSelect == undefined) shapeSelect = JT_GND_PLANE; // (default shape)
	this.shapeType = shapeSelect;

	this.world2model = new mat4.create(); // the matrix used to transform rays from
	this.mat;
	this.zGrid = 0.0; // create line-grid on the unbounded plane at z=zGrid
	this.xgap = 1.0; // line-to-line spacing
	this.ygap = 1.0;
	this.lineWidth = 0.1; // fraction of xgap used for grid-line width
	this.lineColor = vec4.fromValues(0.1, 0.5, 0.1, 1.0); // RGBA green(A== opacity)
	this.gapColor = vec4.fromValues(0.9, 0.9, 0.9, 1.0); // near-white
}
CGeom.prototype.raySetIdentity = function() {
	//console.log("before", this.world2model)
	mat4.identity(this.world2model)
	//console.log("after", this.world2model)
}
CGeom.prototype.rayTranslate = function(x, y, z) {
//	console.log("before", this.world2model)
	mat4.translate(this.world2model, this.world2model, [-x, -y, -z]);
	//console.log("after", this.world2model)
}
CGeom.prototype.rayRotate = function(x, y, z, ang) {
	//console.log("before", this.world2model)
	anix = vec3.fromValues(x, y, z)
	mat4.rotate(this.world2model, this.world2model, ang, anix)
	//console.log("after", this.world2model)
}
CGeom.prototype.rayScale = function(x, y, z) {
	sc = vec3.fromValues(1 / x, 1 / y, 1 / z)
	mat4.scale(this.world2model, this.world2model, sc)
}
CGeom.prototype.traceGrid = function(inRay,mat) {
	var torg = new vec4.create();
	var tdir = new vec4.create();
	//var temp = new vec4.create();
	vec4.copy(torg, inRay.orig)
	vec4.copy(tdir, inRay.dir)
	vec4.transformMat4(tdir, inRay.dir, this.world2model);
	vec4.transformMat4(torg, inRay.orig, this.world2model);
	var xhit, yhit; // the x,y position where ray hits the plane
	var t0; // ray length where inRay hits the plane:
	var xfrac, yfrac; // fractional part of x/xgap, y/ygap;
	t0 = (this.zGrid - torg[2]) / tdir[2];

	if (t0 < 0.0) {
		return null // the ray doesn't hit our plane--it must have hit 'sky'...
	}
	xhit = torg[0] + tdir[0] * t0;
	yhit = torg[1] + tdir[1] * t0;

	//Now; did the ray hit a line, or a gap between lines?
	xfrac = xhit - Math.floor(xhit); // get just the fractional part.
	yfrac = yhit - Math.floor(yhit);
	if ((xfrac < this.lineWidth) || (yfrac < this.lineWidth)) {
		var hit = new CHit();
		hit.t = t0;
		hit.hitItem = 2;
		vec4.scaleAndAdd(hit.modelHitPt, torg, tdir, t0);
		var tran = new mat4.create();
		mat4.invert(tran, this.world2model);
		var normal = vec4.fromValues(0, 0, 1, 0);
		vec4.copy(hit.surfNorm, normal);
		vec4.transformMat4(hit.hitPoint, hit.modelHitPt, tran)

	} else {
		var hit = new CHit();
		hit.t = t0;
		hit.hitItem = mat;
		vec4.scaleAndAdd(hit.modelHitPt, torg, tdir, t0);

		var tran = new mat4.create();
		mat4.invert(tran, this.world2model);
		var normal = vec4.fromValues(0, 0, 1, 0);
		vec4.copy(hit.surfNorm, normal);
		vec4.transformMat4(hit.hitPoint, hit.modelHitPt, tran)
	}

	//console.log(hit.hitItem)
	hit.hitgeom = this;
	return hit
}
CGeom.prototype.traceCube = function(inRay, mat) {
	var torg = new vec4.create();
	var tdir = new vec4.create();
	//var temp = new vec4.create();
	vec4.copy(torg, inRay.orig)
	vec4.copy(tdir, inRay.dir)
	vec4.transformMat4(tdir, inRay.dir, this.world2model);
	vec4.transformMat4(torg, inRay.orig, this.world2model);
	var xhit, yhit; // the x,y position where ray hits the plane
	var t0 = -1,
		t1 = -1,
		t2 = -1,
		t3 = -1,
		t4 = -1,
		t5 = -1; // ray length where inRay hits the plane:
	var sn = Math.pow(10, -10);
	if (torg[0] > -1.0 && torg[0] < 1.0 && torg[1] > -1.0 && torg[1] < 1.0 && torg[2] > -1.0 && torg[2] < 1.0) {

		return null;
	}
	var f0 = new vec4.create();
	var f1 = new vec4.create();
	var f2 = new vec4.create();
	var f3 = new vec4.create();
	var f4 = new vec4.create();
	var f5 = new vec4.create();
	//var xt1=-1,xt1y=-1,xt1z=-1,xt2=-1,xt2y=-1,xt2z=-1,yt1=-1,yt1x=-1,yt1z=-1,yt2=-1,yt2x=-1,yt2z=-1,zt1=-1,zt1x=-1,zt1y=-1,zt2=-1,zt2x=-1,zt2y=-1;
	if (Math.abs(tdir[0]) < sn) {
		t0 = -1;
		t1 = -1;
	} else {
		t0 = (1.0 - torg[0]) / tdir[0];
		vec4.scaleAndAdd(f0, torg, tdir, t0);
		f0[0] = 1.0;
		t1 = (-1.0 - torg[0]) / tdir[0];
		vec4.scaleAndAdd(f1, torg, tdir, t1);
		f1[0] = -1.0;
	}
	if (Math.abs(tdir[1]) < sn) {
		t2 = -1;
		t3 = -1;
	} else {
		t2 = (1.0 - torg[1]) / tdir[1];
		vec4.scaleAndAdd(f2, torg, tdir, t2);
		f2[1] = 1.0;
		t3 = (-1.0 - torg[1]) / tdir[1];
		vec4.scaleAndAdd(f3, torg, tdir, t3);
		f3[1] = -1.0;
	}
	if (Math.abs(tdir[2]) < sn) {
		t4 = -1;
		t5 = -1;
	} else {
		t4 = (1.0 - torg[2]) / tdir[2];
		vec4.scaleAndAdd(f4, torg, tdir, t4);
		f4[2] = 1.0;
		t5 = (-1.0 - torg[2]) / tdir[2];
		vec4.scaleAndAdd(f5, torg, tdir, t5);
		f5[2] = -1.0;
	}



	// zt1=(1.0-torg[2])/tdir[2];

	if (t0 > 0.0 && f0[1] > -1.0 && f0[1] < 1.0 && f0[2] > -1.0 && f0[2] < 1.0) {

	} else {
		t0 = -1;
	}
	if (t1 > 0.0 && f1[1] > -1.0 && f1[1] < 1.0 && f1[2] > -1.0 && f1[2] < 1.0) {

	} else {
		t1 = -1;
	}
	if (t2 > 0.0 && f2[0] > -1.0 && f2[0] < 1.0 && f2[2] > -1.0 && f2[2] < 1.0) {

	} else {
		t2 = -1;
	}
	if (t3 > 0.0 && f3[0] > -1.0 && f3[0] < 1.0 && f3[2] > -1.0 && f3[2] < 1.0) {

	} else {
		t3 = -1;
	}
	if (t4 > 0.0 && f4[1] > -1.0 && f4[1] < 1.0 && f4[0] > -1.0 && f4[0] < 1.0) {

	} else {
		t4 = -1;
	}
	if (t5 > 0.0 && f5[1] > -1.0 && f5[1] < 1.0 && f5[0] > -1.0 && f5[0] < 1.0) {

	} else {
		t5 = -1;
	}
	var arr = [t0, t1, t2, t3, t4, t5];
	//console.log(arr)
	var minarr = 1000000;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] < minarr && arr[i] > 0) {
			minarr = arr[i]
		}
	}
	var tmin = minarr;
	if (tmin < 1000000) {
		//hit.hit=1;
		hit = new CHit();
		var pt0 = vec4.create();
		hit.t = tmin;
		vec4.scaleAndAdd(hit.modelHitPt, torg, tdir, tmin);
		hit.hitItem = mat;

		var tran = new mat4.create();

		var x = hit.modelHitPt[0];
		var ax = Math.abs(x);
		var y = hit.modelHitPt[1];
		var ay = Math.abs(y);
		var z = hit.modelHitPt[2];
		var az = Math.abs(z);

		if (Math.abs(ax - 1.0) < sn) {
			normal = vec4.fromValues(x, 0, 0.0, 1);
			// console.log(normal);
		}
		if (Math.abs(ay - 1.0) < sn) {
			normal = vec4.fromValues(0.0, y, 0.0, 1);
		}
		if (Math.abs(az - 1.0) < sn) {
			normal = vec4.fromValues(0.0, 0.0, z, 1);
		}
		mat4.transpose(tran, this.world2model);
		vec4.transformMat4(normal, normal, tran);
		vec4.copy(hit.surfNorm, normal);
		mat4.invert(tran, this.world2model);
		vec4.transformMat4(hit.hitPoint, hit.modelHitPt, tran);
		hit.hitgeom = this;
		return hit;
	}
	return null;
}

CGeom.prototype.traceSphere = function(inRay, item) {

	var torg = new vec4.create();
	var tdir = new vec4.create();
	var temp = new vec4.create();
	vec4.copy(torg, inRay.orig)
	vec4.copy(tdir, inRay.dir)
	vec4.transformMat4(tdir, inRay.dir, this.world2model);
	vec4.transformMat4(torg, inRay.orig, this.world2model);
	//console.log("torg",torg,inRay.orig)
	//console.log(tdir,torg)
	var r2s = new vec4.fromValues(-torg[0], -torg[1], -torg[2], 0);
	//vec4.sub(r2s, ctr, torg);
	var L2 = vec4.squaredLength(r2s);
	var tcas = vec4.dot(r2s, tdir);
	var DL = vec4.length(tdir);
	var DL2 = vec4.dot(tdir, tdir);


	if (L2 >= 1) {
		if (tcas <= 0) {
			return null
		}

		var tca2 = tcas * tcas / DL2;
		var LM2 = L2 - tca2;
		if (LM2 > 1) {
			return null;
		}
		var L2hc = 1 - LM2;
		var t0 = (tcas / DL2) - Math.sqrt(L2hc / DL2);
	} else {
		var tca2 = tcas * tcas / DL2;
		var LM2 = L2 - tca2;
		var L2hc = 1 - LM2;
		var t0 = (tcas / DL2) + Math.sqrt(L2hc / DL2);


	}

	var hit = new CHit();

	var hitp = new vec4.create();
	vec4.scaleAndAdd(hitp, torg, tdir, t0);
	hit.modelHitPt = hitp;
	//	hit.modelHitPt[3]=0;
	if (item == 9) {
		var tot = Math.floor(hitp[0]) + Math.floor(hitp[1]) + Math.floor(hitp[2])
		hit.hitItem = 1 + (Math.abs(tot) % 3);
	} else {
		hit.hitItem = item;
	}
	hit.t = t0;
	var tran = new mat4.create();
	var normal = new vec4.create();
	//mat4.invert(tran,this.world2model);
	mat4.transpose(tran, this.world2model);
	vec4.transformMat4(hit.surfNorm, hit.modelHitPt, tran);
	hit.surfNorm[3] = 0;
	vec4.normalize(hit.surfNorm, hit.surfNorm);
	//vec4.scale(hit.surfNorm,hit.surfNorm,-1);
	mat4.invert(tran, this.world2model)
	vec4.transformMat4(hit.hitPoint, hit.modelHitPt, tran);
	//vec4.transformMat4(tdir, inRay.dir, this.world2model);
	//	vec4.transformMat4(torg, inRay.orig, this.world2model);
	hit.hitgeom = this;
	if (hit.hitPoint[2] < 0) {
		//console.log("error")
		//console.log("mode", hit.modelHitPt, hit.hitPoint, this.world2model, tran);
	}
	return hit;

}

CGeom.prototype.traceShape = function(inRay, mat) {

	if (this.shapeType == JT_GNDPLANE) {

		var hit = this.traceGrid(inRay,mat);
		return hit;
	} else if (this.shapeType == JT_SPHERE) {

		var hit = this.traceSphere(inRay, mat);
		return hit;
	} else if (this.shapeType == JT_BOX) {
		var hit = this.traceCube(inRay,mat);
		return hit;

	}

}

function CHit() {
	this.hitItem = -1; // Index# of the CGeom object we pierced;
	this.t; // 'hit time' parameter for the ray; defines one
	// 'hit-point' along ray:  orig + t*dir = hitPt.
	this.hitPoint = new vec4.create(); //worldWhere              // World-space location where the ray pierced
	// the surface of a CGeom item.
	this.surfNorm = new vec4.create(); // World-space surface-normal vector at the hit
	// point: perpendicular to surface.
	this.viewN = new vec4.create(); //hit normal               // Unit-length vector from hitPt back towards
	// the origin of the ray we traced.
	this.isEntering; // true iff ray origin was OUTSIDE the hitItem.
	//a(example; transparency rays begin INSIDE).
	this.modelHitPt = new vec4.create(); // the 'hit point' expressed in model coords.
	this.colr = new vec4.create(); // The final RGB color computed for this point,
	// (note-- not used for shadow rays).
	// (uses RGBA. A==opacity, default A=1=opaque.
	//   this.depth;                  // recursion depth.
	this.hitgeom;
}

function CHitList() {
	this.iEnd = 0;
	this.iNearest = null;
	this.nearT = 100000000;
	this.list;

}
CHitList.prototype.add = function(hit) {
	//console.log("test",hit.t)
	if (hit.t < this.nearT) {
		this.iNearest = this.iEnd;
		this.nearT = hit.t;
		// console.log("add",this.iNearest)
	}
	this.list.push(hit);
	this.iEnd++;
	//console.log("hit",hit,this)

}

function CScene() {
	this.rayCam = new CCamera(); // The ray-tracing camera object.
	this.eyeRay = new CRay(); // Current 'eye' ray we're tracing
	// (ray from camera used to make a pixel)

	//this.myGrid = new CGeom(JT_GNDPLANE);
	this.Geoms = []
	this.Matls = []
	this.Lamps = []
	this.bkgndColr = vec4.fromValues(0.0, 0.5, 0.7, 1, 0);
	// Default RGB background color; used for
	// rays that don't hit any scene items.
	this.errorColr = vec4.fromValues(1.0, 0.0, 0.0, 1.0);
	// initial RGB value for recursive rays.
	this.depthMax = 1; // max. allowed recursion depth for rays.
	this.isAA = true; // is AntiAliased? If TRUE, use jittered
	// super-sampling in a rectagular 'tile'
	// for every pixel, then average colors.
	this.xSuperAA = 4; // # of Anti-Alias superssamples per pixel.
	this.ySuperAA = 4;
	this.relfec=2;
}
CScene.prototype.traceRay = function(ray, colr, itt) {
	if (itt < this.relfec+1) {
		var hitlist = new CHitList();
		hitlist.list = []

		for (var x = 0; x < this.Geoms.length; x++) {

			var hit = this.Geoms[x].traceShape(ray, this.Geoms[x].mat);
			if (hit != null) {
				hitlist.add(hit);
			}

		}
	
		if (hitlist.iEnd == 0) {
			vec4.copy(colr, [0, 0, 0, 1]);
			//	console.log("none")
		} else {
			if (!hitlist.list[hitlist.iNearest]) {
				//console.log("error", "itt", itt, hitlist)
			} else {
				this.findShade(ray, hitlist.list[hitlist.iNearest], itt)
				vec4.copy(colr, hitlist.list[hitlist.iNearest].colr);
			}
		}
	}

}
CScene.prototype.initScene = function(sceneNum) {
	//==============================================================================
	// Set up an interesting ray-tracing scene to render on-screen.
	//		sceneNum==0  (default): line-grid plane with anti-aliasing;
	//									--line-grid forms xy plane at z==-5, sky above;
	//									--camera at world-space origin, gazing in +y direction
	//									--left/right arrow keys turn camera left/right;
	//									--PgUp/PgDn keys tilt camera up/down;
	//									--up/down arrow keys move camera fwd/back in view direction 
	//		sceneNum==1:	First sphere
	//									--line-grid forms xy plane at z==0, sky above;
	//									--camera at world-space (0,-10,5), gazing in +y direction
	//									--onesphere of radius 1 at world-space (0,0,1.5)
}
var Inside=false;
CScene.prototype.makeRayTracedImage = function(outImg) {
	//==============================================================================
	// (Replaces CImgBuf.makeRayTracedImage()); called when you press 'T' or 't')
	// Fill the CImgBuf object 'myImg' with a newly ray-traced image.

	//  var eyeRay = new CRay();	// the ray we trace from our camera for each pixel
	//  var myCam = new CCamera();	// the 3D camera that sets eyeRay values
	//  var myGrid = new CGeom(JT_GNDPLANE);
	//this.Geoms[1].rayTranslate(1, 0, 0);
	var colr = new vec4.create(); // floating-point RGBA color value
	var hit = 0;
	var i, j, idx; // pixel counters; CImgBuf array index
	var ii, jj; // super-sampling indices within 1 tile;
	//	this.rayCam.rayLookat(3, 0, 5, 0, 0, 0, 0, 0, 1)
	console.log(this.Lamps)
	console.log(this.Geoms)
	Inside=false;
		//  this.Lamps[1].lampON=true;
		//	this.Lamps[0].lampON=true;
	this.addMaterial();
	//	this.rayCam.traceGeom(this.eyeRay,100,100,colr,this)
	for (j = 0; j < outImg.ySiz; j++) { // for the j-th row of pixels
		for (i = 0; i < outImg.xSiz; i++) { // and the i-th pixel on that row,
			colr = vec4.fromValues(0.0, 0.0, 0.0, 1.0); // start with zero color, then

			this.rayCam.traceGeom(this.eyeRay, i, j, colr, this)

			idx = (j * outImg.xSiz + i) * outImg.pixSiz; // Array index at pixel (i,j) 
			outImg.fBuf[idx] = colr[0]; // put ray color into floating-pt buffer
			outImg.fBuf[idx + 1] = colr[1];
			outImg.fBuf[idx + 2] = colr[2];


		}
	} // end of entire image.
	outImg.float2int(); // create integer image from floating-point buffer.
}

CScene.prototype.findShade = function(ray, hit, mate) {
	//console.log(hit)]
	var L = new vec4.create();
	var N = new vec4.create();
	var V = new vec4.create();
	var C = new vec4.create();
	var R = new vec4.create();
	var mattype = hit.hitItem;
	//var material = new Material(hit.hitItem);
	//console.log(material)

	//vec4.copy(V,this.eyeRay.dir);
	vec4.subtract(V, this.rayCam.eyePt, hit.hitPoint)
	vec4.normalize(V, V)


	//console.log("V",V)
	for (x = 0; x < this.Lamps.length; x++) {
		if (this.Lamps[x].lampON == 1) {
			var shadowRay = new CRay();
			vec4.subtract(shadowRay.dir, this.Lamps[x].lampPos, hit.hitPoint);
			//	vec4.copy(shadowRay.orig, hit.hitPoint);
			vec4.scaleAndAdd(shadowRay.orig, hit.hitPoint, ray.dir, -0.003);
			//vec4.add(shadowRay.orig,[0.01,0.01,0.01,0] , hit.hitPoint);
			var isShadow = false;
			var tempray = new CRay();
			for (var y = 0; y < this.Geoms.length; y++) {
				vec4.copy(tempray.dir, shadowRay.dir);
				vec4.copy(tempray.orig, shadowRay.orig);
				var hittemp = this.Geoms[y].traceShape(tempray, 1);
				if (hittemp != null) {
					isShadow = true;
					break;
				}
			}
			vec4.subtract(L, this.Lamps[x].lampPos, hit.hitPoint);
			//L[3]=0;
			vec4.scale(C, hit.surfNorm, vec4.dot(L, hit.surfNorm));
			for (var i = 0; i < 4; i++) {
				R[i] = 2 * C[i] - L[i]
			}

			vec4.normalize(L, L);
			vec4.normalize(R, R);

			for (var i = 0; i < 3; i++) {
				if (mate == 1) {
				hit.colr[i] += this.Lamps[x].lampAmbi[i] * this.Matls[mattype].K_ambi[i] + this.Matls[mattype].K_emit[i]
					}
					if (isShadow == false) {
				hit.colr[i] += this.Lamps[x].lampDiff[i] * this.Matls[mattype].K_diff[i] * Math.max(0, (vec4.dot(hit.surfNorm, L)))
				hit.colr[i] += this.Lamps[x].lampSpec[i] * this.Matls[mattype].K_spec[i] * Math.pow(Math.max(0, vec4.dot(R, V)), this.Matls[mattype].K_shiny);
				//console.log("spe",Math.max(0,vec4.dot(hit.surfNorm,L1)))
					}
			}
		}
	}

	if (hit.hitItem == 5) {
		var refracray=new CRay();
		var Cref=new vec4.create();
		vec4.normalize(ray.dir,ray.dir);
		vec4.scale(Cref,hit.surfNorm,-vec4.dot(ray.dir,hit.surfNorm));
		var Proj=new vec4.create();
		vec4.add(Proj,Cref,ray.dir);
		if(Inside){
			Inside=false;
			//var refnormal=vec4.create();
			//vec4.scale(refnormal,hit.surfNorm,-1);
			var cos=vec4.dot(ray.dir,hit.surfNorm)/vec4.length(ray.dir)/vec4.length(hit.surfNorm)
		    var sinin=Math.sin(Math.acos(cos))
		    var sinout=sinin/0.9;
		    if(sinout>1){
		    	return;
		    }
            var outScalor = vec4.length(Proj)/Math.tan(Math.asin(sinout));
			vec4.scaleAndAdd(refracray.dir,Proj,hit.surfNorm,outScalor);
			
		}
		else{
			Inside=true;
			var cos=-vec4.dot(ray.dir,hit.surfNorm)/vec4.length(ray.dir)/vec4.length(hit.surfNorm);
			var sinin=Math.sin(Math.acos(cos))
		    var sinout=sinin;
		    var sinout=sinin*0.9;
		    if(sinout>1){
		    	return;
		    }
		      var outScalor = vec4.length(Proj)/Math.tan(Math.asin(sinout));
			vec4.scaleAndAdd(refracray.dir,Proj,hit.surfNorm,-outScalor);

		}
		vec4.scaleAndAdd(refracray.orig,hit.hitPoint,ray.dir,0.00001);
		var refracolor=new vec4.create();
		this.traceRay(refracray,refracolor,this.relfec);
	    vec4.add(hit.colr,hit.colr,refracolor);
			}

	if (hit.hitItem!==3&&hit.hitItem!=4&&mate < this.relfec+1) {

		var C3 = new vec4.create();
		var light = vec4.create();
		vec4.scale(C3, hit.surfNorm, -vec4.dot(ray.dir, hit.surfNorm));

		var reflray = new CRay();

		vec4.scaleAndAdd(reflray.dir, ray.dir, C3, 2);
		vec4.copy(reflray.orig, hit.hitPoint);
		vec4.scaleAndAdd(reflray.orig, reflray.orig, ray.dir, -0.0003);
		var color = new vec4.create();
		this.traceRay(reflray, color, mate + 1);
		//if(vec4.length(color>0))

		color[3] = 0;

		vec4.add(hit.colr, hit.colr, color);

	}


	hit.colr[3] = 1.0;

}
CScene.prototype.addGeom = function(shape, mat) {
	var geom = new CGeom(shape);
	this.Geoms.push(geom);
	this.Geoms[this.Geoms.length - 1].mat = mat;
}
CScene.prototype.addLamp = function(pos, ambi, diff, spec) {
	var li = new lights(pos, ambi, diff, spec);
	this.Lamps.push(li);
}
CScene.prototype.addMaterial = function() {
	for (var i = 0; i < 24; i++) {
		var material = new Material(i);
		this.Matls.push(material);
	}
}


function CImgBuf(wide, tall) {
	//==============================================================================
	// Construct an 'image-buffer' object to hold a floating-point ray-traced image.
	//  Contains BOTH
	//	iBuf -- 2D array of 8-bit RGB pixel values we can display on-screen, AND
	//	fBuf -- 2D array of floating-point RGB pixel values we usually CAN'T display,
	//          but contains full-precision results of ray-tracing.
	//			--Both buffers hold the same numbers of pixels & values(xSiz,ySiz,pixSiz)
	//			--imgBuf.int2float() copies/converts current iBuf contents to fBuf
	//			--imgBuf.float2int() copies/converts current fBuf contents to iBuf
	//	WHY?  
	//	--Our ray-tracer computes floating-point light amounts(e.g. radiance L) //    but neither our display nor our WebGL texture-map buffers can accept 
	//		images with floating-point pixel values.
	//	--You will NEED all those floating-point values for applications such as
	//    environment maps (re-lighting from sky image) and lighting simulations.
	// Stay simple in early versions of your ray-tracer: keep 0.0 <= RGB < 1.0, 
	// but later you can modify your ray-tracer to compute physically verifiable 
	//	units of visible light, such as radiometric units of Radiance 
	// (watts/(steradians*meter^2)), or photometric units of luminance 
	// (lumens/(steradians*meter^2 aka cd/m^2)).

	this.xSiz = wide; // image width in pixels
	this.ySiz = tall; // image height in pixels
	this.pixSiz = 3; // pixel size (3 for RGB, 4 for RGBA, etc)
	this.iBuf = new Uint8Array(this.xSiz * this.ySiz * this.pixSiz);
	this.fBuf = new Float32Array(this.xSiz * this.ySiz * this.pixSiz);
}

CImgBuf.prototype.setTestPattern = function(pattNum) {
	//==============================================================================
	// Replace current 8-bit RGB contents of 'imgBuf' with a colorful pattern
	// 2D color image:  8-bit unsigned integers in a 256*256*3 array
	// to store r,g,b,r,g,b integers (8-bit)
	// In WebGL texture map sizes MUST be a power-of-two (2,4,8,16,32,64,...4096)
	// with origin at lower-left corner.
	// (NOTE: this 'power-of-two' limit will probably vanish in a few years of
	// WebGL advances, just as it did for OpenGL)

	// use local vars to set the array's contents.
	for (var j = 0; j < this.ySiz; j++) { // for the j-th row of pixels
		for (var i = 0; i < this.xSiz; i++) { // and the i-th pixel on that row,
			var idx = (j * this.xSiz + i) * this.pixSiz; // Array index at pixel (i,j) 
			switch (pattNum) {
				case 0: //================(Colorful L-shape)============================
					if (i < this.xSiz / 4 || j < this.ySiz / 4) {
						this.iBuf[idx] = i; // 0 <= red <= 255
						this.iBuf[idx + 1] = j; // 0 <= grn <= 255
					} else {
						this.iBuf[idx] = 0;
						this.iBuf[idx + 2] = 0;
					}
					this.iBuf[idx + 2] = 255 - i - j; // 0 <= blu <= 255
					break;
				case 1: //================(bright orange)===============================
					this.iBuf[idx] = 255;
					this.iBuf[idx + 1] = 128;
					this.iBuf[idx + 2] = 0;
					break;
				default:
					console.log("imgBuf.setTestPattern() says: WHUT!?");
					break;
			}
		}
	}
	this.int2float(); // fill the floating-point buffer with same test pattern.
}

CImgBuf.prototype.int2float = function() {
	//==============================================================================
	// Convert current integerRGB image in iBuf into floating-point RGB image in fBuf
	for (var j = 0; j < this.ySiz; j++) { // for each scanline
		for (var i = 0; i < this.xSiz; i++) { // for each pixel on that scanline
			var idx = (j * this.xSiz + i) * this.pixSiz; // Find array index at pixel (i,j)
			// convert integer 0 <= RGB <= 255 to floating point 0.0 <= R,G,B <= 1.0
			this.fBuf[idx] = this.iBuf[idx] / 255.0; // red
			this.fBuf[idx + 1] = this.iBuf[idx + 1] / 255.0; // grn
			this.fBuf[idx + 2] = this.iBuf[idx + 2] / 255.0; // blu

		}
	}
}

CImgBuf.prototype.float2int = function() {
	//==============================================================================
	// Convert current floating-point RGB image in fBuf into integerRGB image in iBuf
	for (var j = 0; j < this.ySiz; j++) { // for each scanline
		for (var i = 0; i < this.xSiz; i++) { // for each pixel on that scanline
			var idx = (j * this.xSiz + i) * this.pixSiz; // Find array index at pixel (i,j)
			// find 'clamped' color values that stay >=0.0 and <=1.0:
			var rval = Math.min(1.0, Math.max(0.0, this.fBuf[idx]));
			var gval = Math.min(1.0, Math.max(0.0, this.fBuf[idx + 1]));
			var bval = Math.min(1.0, Math.max(0.0, this.fBuf[idx + 2]));
			// Divide [0,1] span into 256 equal-sized parts: e.g.  Math.floor(rval*256)
			// In the rare case when rval==1.0 you get unwanted '256' result that won't
			// fit into the 8-bit RGB values.  Fix it with Math.min():
			this.iBuf[idx] = Math.min(255, Math.floor(rval * 256.0)); // red
			this.iBuf[idx + 1] = Math.min(255, Math.floor(gval * 256.0)); // grn
			this.iBuf[idx + 2] = Math.min(255, Math.floor(bval * 256.0)); // blu

		}
	}
}

function lights(pos, ambi, diff, spec) {
	this.lampPos = pos;
	this.lampAmbi = ambi;
	this.lampDiff = diff;
	this.lampSpec = spec;
	this.lampON = 1;
}