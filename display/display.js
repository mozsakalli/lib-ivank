

	var BlendMode = 
	{
		NORMAL		: "normal",
		ADD			: "add",
		SUBTRACT	: "subtract",
		MULTIPLY	: "multiply",
		SCREEN		: "screen",
		
		ERASE		: "erase",
		ALPHA		: "alpha"
	}
	/** 
	 * A basic class in the Display API
	 * 
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function DisplayObject()
	{		
		EventDispatcher.call(this);
		
		this.visible	= true;
		
		this.parent		= null;
		this.stage		= null;
		
		this.transform	= new Transform();
		this.transform._obj = this;
		
		this.blendMode	= BlendMode.NORMAL;
		
		//*
		//	for fast access
		this.x			= 0;
		this.y			= 0;
		this.z			= 0;
		//*/
		
		this._trect		= new Rectangle();	// temporary rectangle
		
		this._tempP     = new Point();
		this._torg		= Point._v4.create();
		this._tvec4_0	= Point._v4.create();
		this._tvec4_1	= Point._v4.create();
		
		this._tempm		= Point._m4.create();
		
		this._atsEv	= new Event(Event.ADDED_TO_STAGE);
		this._rfsEv	= new Event(Event.REMOVED_FROM_STAGE);
		this._atsEv.target = this._rfsEv.target = this;
	}
	DisplayObject.prototype = new EventDispatcher();
	
	DisplayObject.prototype.dispatchEvent = function(e)	// : returns the deepest active InteractiveObject of subtree
	{
		EventDispatcher.prototype.dispatchEvent.call(this, e);
		if(e.bubbles && this.parent != null) this.parent.dispatchEvent(e);
	}
	
	DisplayObject.prototype._globalToLocal = function(sp, tp)	// OK
	{
		var org = this._torg;
		Stage._main._getOrigin(org);
		Point._m4.multiplyVec4(this._getAIMat(), org, org);
		
		var p1 = this._tvec4_1;
		p1[0] = sp.x;  p1[1] = sp.y;  p1[2] = 0;  p1[3] = 1;
		Point._m4.multiplyVec4(this._getAIMat(), p1, p1);
		
		this._lineIsc(org, p1, tp);
	}
	
	DisplayObject.prototype.globalToLocal = function(p)		// OK
	{
		var lp = new Point();
		this._globalToLocal(p, lp);
		return lp;
	}
	
	DisplayObject.prototype.localToGlobal = function(p)		// OK
	{
		var org = this._torg;
		Stage._main._getOrigin(org);
		
		var p1 = this._tvec4_1;
		p1[0] = p.x;  p1[1] = p.y;  p1[2] = 0;  p1[3] = 1;
		Point._m4.multiplyVec4(this._getATMat(), p1, p1);
		
		var lp = new Point();
		this._lineIsc(org, p1, lp);
		return lp;
	}
	
	// Intersection between line p0, p1 and plane z=0  (result has z==0)
	
	DisplayObject.prototype._lineIsc = function(p0, p1, tp)
	{
		var dx = p1[0]-p0[0], dy = p1[1]-p0[1], dz = p1[2]-p0[2];
		
		var len = Math.sqrt(dx*dx + dy*dy + dz*dz);
		dx /= len; dy /= len; dz /= len; 
		
		var d = -p0[2]/dz;
		tp.x = p0[0] + d*dx;
		tp.y = p0[1] + d*dy;
	}
	
	DisplayObject.prototype._transfRect = function(mat, torg, srct, trct)
	{
		var sp = this._tvec4_0;
		var tp = this._tvec4_1;
		var p = new Point();
		var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
		
		sp[0] = srct.x;  sp[1] = srct.y;  sp[2] = 0; sp[3] = 1;		
		Point._m4.multiplyVec4(mat, sp, tp);
		this._lineIsc(torg, tp, p);
		minx = Math.min(minx, p.x);  miny = Math.min(miny, p.y);
		maxx = Math.max(maxx, p.x);  maxy = Math.max(maxy, p.y);
		
		sp[0] = srct.x+srct.width;  sp[1] = srct.y;  sp[2] = 0; sp[3] = 1;		
		Point._m4.multiplyVec4(mat, sp, tp);
		this._lineIsc(torg, tp, p);
		minx = Math.min(minx, p.x);  miny = Math.min(miny, p.y);
		maxx = Math.max(maxx, p.x);  maxy = Math.max(maxy, p.y);
		
		sp[0] = srct.x;  sp[1] = srct.y+srct.height;  sp[2] = 0; sp[3] = 1;		
		Point._m4.multiplyVec4(mat, sp, tp);
		this._lineIsc(torg, tp, p);
		minx = Math.min(minx, p.x);  miny = Math.min(miny, p.y);
		maxx = Math.max(maxx, p.x);  maxy = Math.max(maxy, p.y);
		
		sp[0] = srct.x+srct.width;  sp[1] = srct.y+srct.height;  sp[2] = 0; sp[3] = 1;		
		Point._m4.multiplyVec4(mat, sp, tp);
		this._lineIsc(torg, tp, p);
		minx = Math.min(minx, p.x);  miny = Math.min(miny, p.y);
		maxx = Math.max(maxx, p.x);  maxy = Math.max(maxy, p.y);
		
		trct.x = minx;  trct.y = miny; 
		trct.width = maxx-minx;  trct.height = maxy-miny;
	}
	
	DisplayObject.prototype._getLocRect = function() {}
	
	//  Returns bounding rectangle
	// 		tmat : matrix from global to target local
	// 		torg : origin in tmat coordinates
	//		result: read-only
	
	DisplayObject.prototype._getRect = function(tmat, torg, stks)
	{
		Point._m4.multiply(tmat, this._getATMat(), this._tempm);
		this._transfRect(this._tempm, torg, this._getLocRect(), this._trect);
		return this._trect;
	}
	
	DisplayObject.prototype._getR = function(tcs, stks)
	{
		Stage._main._getOrigin(this._torg);
		Point._m4.multiplyVec4(tcs._getAIMat(), this._torg, this._torg);
		return this._getRect(tcs._getAIMat(), this._torg, stks);
	}
	
	DisplayObject.prototype._getParR = function(tcs, stks)
	{
		if(DisplayObject._tdo==null) DisplayObject._tdo = new DisplayObject();
		var nopar = this.parent==null;
		if(nopar) this.parent = DisplayObject._tdo;
		var out = this._getR(this.parent, stks);
		if(nopar) this.parent = null;
		return out;
	}
	
	// no strokes
	DisplayObject.prototype.getRect   = function(tcs) {  return this._getR(tcs, false).clone();  }
	// with strokes
	DisplayObject.prototype.getBounds = function(tcs) {  return this._getR(tcs, true ).clone();  }
	
	
	//  Check, whether object hits a line org, p in local coordinate system
	
	DisplayObject.prototype._htpLocal = function(org, p)
	{
		var tp = this._tempP;
		this._lineIsc(org, p, tp);
		return this._getLocRect().contains(tp.x, tp.y);
	}
	
	//  tests, if object intersects a point in Stage coordinates
	
	DisplayObject.prototype.hitTestPoint = function(x, y, shapeFlag)
	{
		if(shapeFlag==null) shapeFlag = false;
		
		var org = this._torg;
		Stage._main._getOrigin(org);
		Point._m4.multiplyVec4(this._getAIMat(), org, org);
			
		var p1 = this._tvec4_1;
		p1[0] = x;  p1[1] = y;  p1[2] = 0;  p1[3] = 1;
		Point._m4.multiplyVec4(this._getAIMat(), p1, p1);
		
		//  org and p1 are in local coordinates
		//  now we have to decide, if line (p0, p1) intersects an object
		
		if(shapeFlag)   return this._htpLocal(org, p1);
		else            return this._getR(Stage._main, false).contains(x,y);
	}
	
	DisplayObject.prototype.hitTestObject = function(obj)
	{
		var r0 = this._getR(Stage._main, false);
		var r1 = obj ._getR(Stage._main, false);
		return r0.intersects(r1);
	}
	
	
	DisplayObject.prototype._loseFocus = function(){}
	
	
	/*
		Returns the deepest InteractiveObject of subtree with mouseEnabled = true  OR itself, if "hit over" and mouseEnabled = false
	*/
	
	DisplayObject.prototype._getTarget = function(porg, pp)	
	{
		return null;
	}
	

	
	DisplayObject.prototype._setStage = function(st)
	{
		var pst = this.stage;	// previous stage
		this.stage = st;
		if(pst == null && st != null) this.dispatchEvent(this._atsEv);
		if(pst != null && st == null) this.dispatchEvent(this._rfsEv);
	}
	
	/** 
	 * This method adds a drawing matrix onto the OpenGL stack
	 */
	DisplayObject.prototype._preRender = function(st)
	{
		var m = this.transform._getTMat();
		st._mstack.push(m);
		st._cmstack.push(this.transform._cmat, this.transform._cvec, this.transform._cID, this.blendMode);
	}
	
	
	
	/** 
	 * This method renders the current content
	 */
	DisplayObject.prototype._render = function(st)
	{
	}
	
	/** 
	 * This method renders the whole object
	 */
	DisplayObject.prototype._renderAll = function(st)
	{
		if(!this.visible) return;
		
		this._preRender(st);
		this._render(st);
		st._mstack.pop();
		st._cmstack.pop();
	}
	
	/*
		Absolute Transform matrix
	*/
	DisplayObject.prototype._getATMat = function()
	{
		if(this.parent == null) return this.transform._getTMat();
		Point._m4.multiply(this.parent._getATMat(), this.transform._getTMat(), this.transform._atmat);
		return this.transform._atmat;
	}
	
	/*
		Absolute Inverse Transform matrix
	*/
	DisplayObject.prototype._getAIMat = function()
	{
		if(this.parent == null) return this.transform._getIMat();
		Point._m4.multiply(this.transform._getIMat(), this.parent._getAIMat(), this.transform._aimat);
		return this.transform._aimat;
	}
	
	DisplayObject.prototype._getMouse = function()
	{
		var lp = this._tempP;
		lp.setTo(Stage._mouseX, Stage._mouseY);
		this._globalToLocal(lp, lp);
		return lp;
	}
	
	
	this.dp = DisplayObject.prototype;
	dp.ds = dp.__defineSetter__;
	dp.dg = dp.__defineGetter__;
	
	/*
	dp.ds("x", function(x){this.transform._tmat[12] = x; this.transform._imat[12] = -x;});
	dp.ds("y", function(y){this.transform._tmat[13] = y; this.transform._imat[13] = -y;});
	dp.ds("z", function(z){this.transform._tmat[14] = z; this.transform._imat[14] = -z;});
	dp.dg("x", function( ){return this.transform._tmat[12];});
	dp.dg("y", function( ){return this.transform._tmat[13];});
	dp.dg("z", function( ){return this.transform._tmat[14];});
	//*/
	
	dp.ds("scaleX", function(sx){this.transform._checkVals(); this.transform._scaleX = sx; this.transform._mdirty = true;});
	dp.ds("scaleY", function(sy){this.transform._checkVals(); this.transform._scaleY = sy; this.transform._mdirty = true;});
	dp.ds("scaleZ", function(sz){this.transform._checkVals(); this.transform._scaleZ = sz; this.transform._mdirty = true;});
	dp.dg("scaleX", function(  ){this.transform._checkVals(); return this.transform._scaleX;});
	dp.dg("scaleY", function(  ){this.transform._checkVals(); return this.transform._scaleY;});
	dp.dg("scaleZ", function(  ){this.transform._checkVals(); return this.transform._scaleZ;});
	
	dp.ds("rotationX", function(r){this.transform._checkVals(); this.transform._rotationX = r; this.transform._mdirty = true;});
	dp.ds("rotationY", function(r){this.transform._checkVals(); this.transform._rotationY = r; this.transform._mdirty = true;});
	dp.ds("rotationZ", function(r){this.transform._checkVals(); this.transform._rotationZ = r; this.transform._mdirty = true;});
	dp.ds("rotation" , function(r){this.transform._checkVals(); this.transform._rotationZ = r; this.transform._mdirty = true;});
	dp.dg("rotationX", function( ){this.transform._checkVals(); return this.transform._rotationX;});
	dp.dg("rotationY", function( ){this.transform._checkVals(); return this.transform._rotationY;});
	dp.dg("rotationZ", function( ){this.transform._checkVals(); return this.transform._rotationZ;});
	dp.dg("rotation" , function( ){this.transform._checkVals(); return this.transform._rotationZ;});
	
	dp.ds("width"    , function(w){var ow = this.width ; this.transform._postScale(w/ow, 1); });
	dp.ds("height"   , function(h){var oh = this.height; this.transform._postScale(1, h/oh); });
	
	dp.dg("width"    , function( ){this.transform._checkVals(); return this._getParR(this, true).width ;});
	dp.dg("height"   , function( ){this.transform._checkVals(); return this._getParR(this, true).height;});
	
	dp.ds("alpha", function(a){ this.transform._cmat[15] = a; this.transform._checkColorID(); });
	dp.dg("alpha", function( ){ return this.transform._cmat[15]; });
	
	dp.dg("mouseX", function(){return this._getMouse().x;});
	dp.dg("mouseY", function(){return this._getMouse().y;});
	
	
	delete(dp.ds);
	delete(dp.dg);
	delete(this.dp);
	

		function InteractiveObject()
		{
			DisplayObject.call(this);
			
			this.buttonMode = false;
			this.mouseEnabled = true;
			this.mouseChildren = true;
		}
		InteractiveObject.prototype = new DisplayObject();
		
		
		InteractiveObject.prototype._getTarget = function(porg, pp)
		{
			if(!this.visible || !this.mouseEnabled) return null;
			
			var r = this._getLocRect();
			if(r == null) return null;
			
			var org = this._tvec4_0, p   = this._tvec4_1;
			Point._m4.multiplyVec4(this.transform._getIMat(), porg, org);
			Point._m4.multiplyVec4(this.transform._getIMat(), pp, p);
			
			var pt = this._tempP;
			this._lineIsc(org, p, pt);
			
			if(r.contains(pt.x, pt.y)) return this;
			return null;
		}
	/** 
	 * A basic container class in the Display API
	 * 
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function DisplayObjectContainer()
	{	
		InteractiveObject.call(this);
	
		this._tempR = new Rectangle();
		
		this.numChildren = 0;
		this._children = [];
	}
	DisplayObjectContainer.prototype = new InteractiveObject();
	
	DisplayObjectContainer.prototype._getRect = function(tmat, torg, stks)
	{
		var r = this._trect;  r.setEmpty();
		
		for(var i=0; i<this.numChildren; i++)
		{
			var ch = this._children[i];  if(!ch.visible) continue;
			r._unionWith(ch._getRect(tmat, torg, stks));
		}
		return r;
	}
	
	DisplayObjectContainer.prototype._htpLocal = function(org, p)
	{
		var n = this._children.length;
		for(var i=0; i<n; i++)
		{
			var ch = this._children[i];
			if(!ch.visible) continue;
			var corg = ch._tvec4_0, cp = ch._tvec4_1, im = ch.transform._getIMat();
			Point._m4.multiplyVec4(im, org, corg);
			Point._m4.multiplyVec4(im, p, cp);
			return ch._htpLocal(corg, cp);
		}
		return false;
	}
	
	
	/**
	 * Adds a child to the container
	 * 
	 * @param o	a chil object to be added
	 */
	DisplayObjectContainer.prototype.addChild = function(o)
	{
		this._children.push(o);
		o.parent = this;
		o._setStage(this.stage);
		++ this.numChildren;
	}
	
	/**
	 * Removes a child from the container
	 * 
	 * @param o	a child object to be removed
	 */
	DisplayObjectContainer.prototype.removeChild = function(o)
	{
		var ind = this._children.indexOf(o);
		if(ind<0) return;
		this._children.splice(ind, 1);
		o.parent = null;
		o._setStage(null);
		-- this.numChildren;
	}
	
	DisplayObjectContainer.prototype.removeChildAt = function(i)
	{
		this.removeChild(this._children[i]);
	}
	
	/**
	 * Checks, if a container contains a certain child
	 * 
	 * @param o	an object for which we check, if it is contained or not
	 * @return	true if contains, false if not
	 */
	DisplayObjectContainer.prototype.contains = function(o)
	{
		return (this._children.indexOf(o)>=0);
	}
	
	DisplayObjectContainer.prototype.getChildIndex = function(o)
	{
		return this._children.indexOf(o);
	}
	
	/**
	 * Sets the child index in the current children list.
	 * Child index represents a "depth" - an order, in which children are rendered
	 * 
	 * @param c1	a child object
	 * @param i2	a new depth value
	 */
	DisplayObjectContainer.prototype.setChildIndex = function(c1, i2)
	{
		var i1 = this._children.indexOf(c1);
		
		if(i2>i1) 
		{
			for(var i= i1+1; i<= i2; i++) this._children[i-1] = this._children[i];
			this._children[i2] = c1;
		}
		else if(i2<i1) 
		{
			for(var i= i1-1; i>= i2; i--) this._children[i+1] = this._children[i];
			this._children[i2] = c1;
		}
	}
	
	
	/**
	 * Returns the child display object instance that exists at the specified index.
	 * 
	 * @param i	index (depth)
	 * @return	an object at this index
	 */
	DisplayObjectContainer.prototype.getChildAt = function(i)
	{
		return this._children[i];
	}
	
	
	DisplayObjectContainer.prototype._render = function(st)
	{
		for(var i=0; i<this.numChildren; i++) this._children[i]._renderAll(st);
	}
	
	
	DisplayObjectContainer.prototype._getTarget = function(porg, pp)	// parent origin, parent point
	{
		if(!this.visible || (!this.mouseChildren && !this.mouseEnabled)) return null;
		
		var org = this._tvec4_0, p   = this._tvec4_1, im = this.transform._getIMat();
		Point._m4.multiplyVec4(im, porg, org);
		Point._m4.multiplyVec4(im, pp, p);
		
		var topTGT = null;
		var n = this.numChildren - 1;
		
		for(var i=n; i>-1; i--) 
		{
			var ntg = this._children[i]._getTarget(org, p);
			if(ntg != null) {topTGT = ntg;  break;}
		}
		if(!this.mouseChildren && topTGT != null) return this;
		return topTGT;
	}
	
		/*
		Check, whether object hits pt[0], pt[1] in parent coordinate system
	*/
	
	
	
	DisplayObjectContainer.prototype._setStage = function(st)
	{
		InteractiveObject.prototype._setStage.call(this, st);
		for(var i=0; i<this.numChildren; i++) this._children[i]._setStage(st);
	}
	
	
	
	

	function BitmapData(imgURL)
	{
		// public
		this.width = 0;							// size of texture
		this.height = 0;
		this.rect = new Rectangle();						
		this.loader = new EventDispatcher();
		this.loader.bitmapData = this;
		//this.loader.bytesLoaded = 0;
		//this.loader.bytesTotal = 0;
		
		// private
		this._rwidth  = 0;						// real size of bitmap in memory (power of two)
		this._rheight = 0;
		this._rrect   = null;
		this._texture = null;
		this._tcBuffer = null;		//	texture coordinates buffer
		this._vBuffer  = null;		//	four vertices of bitmap
		this._loaded = false;
		this._dirty  = true;					
		this._gpuAllocated = false;
		this._buffer  = null;					//  Uint8 container for texture
		this._ubuffer = null;					//  Uint32 container for texture
		
		/*
		this._opEv = new Event(Event.OPEN);
		this._pgEv = new Event(Event.PROGRESS);
		this._cpEv = new Event(Event.COMPLETE);
		
		this._opEv.target = this._pgEv.target = this._cpEv.target = this.loader;
		*/
		
		if(imgURL == null) return;
		
		var img = document.createElement("img");
		img.crossOrigin = "Anonymous";
		img.onload		= function(e){ this._initFromImg(img, img.width, img.height); var ev = new Event(Event.COMPLETE); this.loader.dispatchEvent(ev);}.bind(this);
		img.src 		= imgURL;
	}
	
	/* public */
	
	BitmapData.empty = function(w, h, fc)
	{
		if(fc==null) fc=0xffffffff;
		var bd = new BitmapData(null);
		bd._initFromImg(null, w, h, fc);
		return bd;
	}
	
	BitmapData.prototype.setPixel = function(x, y, color) 
	{ 
		var i = y*this.width+x, b = this._ubuffer;
		b[i] = (b[i] & 0xff000000)+color;
		this._dirty = true;
	}
	BitmapData.prototype.setPixel32 = function(x, y, color) 
	{ 
		var i = y*this.width+x;
		this._ubuffer[i] = color;
		this._dirty = true;
	}
	BitmapData.prototype.setPixels = function(r, buff)
	{
		this._copyRectBuff(buff, r, this._buffer, this.rect);
		this._dirty = true;
	}
	
	BitmapData.prototype.getPixel = function(x, y) 
	{ 
		var i = y*this.width+x;
		return this._ubuffer[i] & 0xffffff;
	}
	BitmapData.prototype.getPixel32 = function(x, y) 
	{ 
		var i = y*this.width+x;
		return this._ubuffer[i];
	}
	BitmapData.prototype.getPixels = function(r, buff)
	{
		if(!buff) buff = new Uint8Array(r.width * r.height * 4);
		this._copyRectBuff(this._buffer, this.rect, buff, r);
		return buff;
	}
	
	BitmapData.prototype.draw = function(dobj)
	{
		if(this._dirty) this._syncWithGPU();
		this._setTexAsFB();
		Stage._setTEX(null);
		dobj._render(Stage._main);
		
		var buff = this._buffer, r = this.rect;
		gl.readPixels(r.x, r.y, r.width, r.height, gl.RGBA, gl.UNSIGNED_BYTE, buff);
		Stage._main._setFramebuffer(null, Stage._main.stageWidth, Stage._main.stageHeight, false);
		
		Stage._setTEX(this._texture);
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	
	/* private */
	
	BitmapData.prototype._syncWithGPU = function()
	{
		var r = this.rect, buff = this._buffer;
		
		if(!this._gpuAllocated)
		{
			var w = r.width, h = r.height;
			var xsc = w/this._rwidth;
			var ysc = h/this._rheight;
			
			this._texture = gl.createTexture();
			this._tcBuffer = gl.createBuffer();		//	texture coordinates buffer
			this._vBuffer  = gl.createBuffer();		//	four vertices of bitmap
			
			Stage._setBF(this._tcBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, xsc,0, 0,ysc, xsc,ysc]), gl.STATIC_DRAW);
		
			Stage._setBF(this._vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0, w,0,0, 0,h,0, w,h,0]), gl.STATIC_DRAW);
		
			var ebuff = new Uint8Array(this._rwidth*this._rheight*4);
			var ebuff32 = new Uint32Array(ebuff.buffer);
			for(var i=0; i<ebuff32.length; i++) ebuff32[i] = 0x00ffffff;
			
			Stage._setTEX(this._texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
						this._rwidth, this._rheight, 0, gl.RGBA, 
						gl.UNSIGNED_BYTE, ebuff);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			this._gpuAllocated = true;
		}
		
		Stage._setTEX(this._texture);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, r.x, r.y, r.width, r.height,  gl.RGBA, gl.UNSIGNED_BYTE, buff);
		gl.generateMipmap(gl.TEXTURE_2D);
		this._dirty = false;
	}
	
	BitmapData.prototype._setTexAsFB = function()
	{
		if(BitmapData._fbo == null)
		{
			BitmapData._fbo = gl.createFramebuffer();
			var rbo = gl.createRenderbuffer();
			gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
			gl.bindFramebuffer(gl.FRAMEBUFFER, BitmapData._fbo);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
		}
		
		Stage._main._setFramebuffer(BitmapData._fbo, this._rwidth, this._rheight, true);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0);
	}
	
	
	BitmapData.prototype._initFromImg = function(img, w, h, fc)
	{
		this._loaded = true;
		this.width  = w;		// image width
		this.height = h;		// image.height
		this.rect = new Rectangle(0,0,w,h);
		this._rwidth  = BitmapData._nhpot(w);	// width - power of Two
		this._rheight = BitmapData._nhpot(h);	// height - power of Two
		this._rrect = new Rectangle(0,0,this._rwidth, this._rheight);
		
		var cnv = BitmapData._canv;
		cnv.width = w;
		cnv.height = h;
		var ctx = BitmapData._ctx;
		if(img != null) ctx.drawImage(img, 0, 0);
		var imgd = ctx.getImageData(0, 0, w, h);
		
		if(window.CanvasPixelArray && imgd.data instanceof CanvasPixelArray)	// old standard, implemented in IE11
		{
			this._buffer = new Uint8Array(imgd.data);
		}
		else this._buffer = new Uint8Array(imgd.data.buffer);
		
		this._ubuffer = new Uint32Array(this._buffer.buffer);	// another ArrayBufferView for the same buffer4
		
		if(img == null) for(var i=0, b=this._ubuffer; i<b.length; i++) b[i] = fc;
	}
	
	BitmapData.prototype._copyRectBuff = function(sc, sr, tc, tr) // from buffer, from rect, to buffer, to rect
	{
		sc = new Uint32Array(sc.buffer);
		tc = new Uint32Array(tc.buffer);
		var ar = sr.intersection(tr);
		var sl = Math.max(0,ar.x-sr.x);
		var tl = Math.max(0,ar.x-tr.x);
		var st = Math.max(0,ar.y-sr.y);
		var tt = Math.max(0,ar.y-tr.y);
		var w = ar.width;
		var h = ar.height;
		
		for(var i=0; i<h; i++)
		{
			var sind = (st+i)*sr.width + sl;
			var tind = (tt+i)*tr.width + tl;
			for(var j=0; j<w; j++)
				tc[tind++] = sc[sind++];
		}
	}
	
BitmapData._canv = document.createElement("canvas");
BitmapData._ctx = BitmapData._canv.getContext("2d");

	
BitmapData._ipot = function(x) {
    return (x & (x - 1)) == 0;
}
 
BitmapData._nhpot = function(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1)   x = x | x >> i;
    return x + 1;
}















	/** 
	 * A basic class for rendering bitmaps
	 * 
	 * @author Ivan Kuckir
	 * @version 1.0
	 */
	function Bitmap(bd)
	{
		DisplayObject.call(this);
		this.bitmapData = bd;
	}
	Bitmap.prototype = new InteractiveObject();		// this Bitmap is InteractiveObject !!!
	
	Bitmap.prototype._getLocRect = function()
	{
		return this.bitmapData.rect;
	}
	
	Bitmap.prototype._render = function(st)
	{
		//return;
		var tbd = this.bitmapData;
		if(!tbd._loaded) return;
		if( tbd._dirty ) tbd._syncWithGPU();
		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();
		
		Stage._setVC(tbd._vBuffer);
		Stage._setTC(tbd._tcBuffer);
		Stage._setUT(1);
		Stage._setTEX(tbd._texture);
		Stage._setEBF(st._unitIBuffer);
		
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}

    var gl;

    function Stage(canvID) 
	{
		DisplayObjectContainer.call(this);
		document.body.setAttribute("style", "margin:0; overflow:hidden");
		
		//<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"/>
		
		var meta = document.createElement('meta');
		meta.setAttribute("name", "viewport");
		meta.setAttribute("content", "width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0");
		document.getElementsByTagName('head')[0].appendChild(meta);
		
		this.stage = this;
		
		this.stageWidth = 0;
		this.stageHeight = 0;
		
		this.focus   = null;			// keyboard focus, never Stage
		this._focii = [null, null, null];
		this._mousefocus = null;		// mouse focus of last mouse move, used to detect MOUSE_OVER / OUT, never Stage
		
		this._knM = false;	// know mouse
		this._mstack = new Stage._MStack();		// transform matrix stack
		this._cmstack = new Stage._CMStack();	// color matrix stack
		this._sprg = null;
		
		this._svec4_0	= Point._v4.create();
		this._svec4_1	= Point._v4.create();
		
		this._pmat = Point._m4.create([
			 1, 0, 0, 0,
			 0, 1, 0, 0,
			 0, 0, 1, 1,
			 0, 0, 0, 1
		]);	// project matrix
		
		this._umat = Point._m4.create([
			 2, 0, 0, 0,
			 0,-2, 0, 0,
			 0, 0, 2, 0,
			-1, 1, 0, 1
		]);	// unit matrix
		
		this._smat = Point._m4.create([
			 0, 0, 0, 0,
			 0, 0, 0, 0,
			 0, 0, 0.001, 0,
			 0, 0, 0, 1
		]);	// scale matrix
		
		//this._efEv = new Event(Event.ENTER_FRAME);
		//this._rsEv = new Event(Event.RESIZE);
		
		this._mcEvs = [	new MouseEvent(MouseEvent.CLICK			,true), 
						new MouseEvent(MouseEvent.MIDDLE_CLICK	,true), 
						new MouseEvent(MouseEvent.RIGHT_CLICK	,true) ];
						
		this._mdEvs = [ new MouseEvent(MouseEvent.MOUSE_DOWN		,true),
						new MouseEvent(MouseEvent.MIDDLE_MOUSE_DOWN	,true),
						new MouseEvent(MouseEvent.RIGHT_MOUSE_DOWN	,true) ];
						
		this._muEvs = [ new MouseEvent(MouseEvent.MOUSE_UP			,true),
						new MouseEvent(MouseEvent.MIDDLE_MOUSE_UP	,true),
						new MouseEvent(MouseEvent.RIGHT_MOUSE_UP	,true) ];
		
		this._smd   = [false, false, false];	// stage mouse down, for each mouse button
		this._smu   = [false, false, false];	// stage mouse up, for each mouse button
		
		this._smm  = false;	// stage mouse move
		this._srs  = false;	// stage resized
		this._touches = {};
		//this._touches = [];
		//for(var i=0; i<30; i++) this._touches.push({touch:null, target:null, act:0});	// down: 0 - nothing, 1 - is down, 2 - was moved, 3 - is up
		
		this._canvas = this.canvas = document.getElementById(canvID);
		//this.canvas.setAttribute("style", "user-select: none;");
		
		Stage._main = this;
		
		var par = { alpha:true, antialias:true, depth:true, premultipliedAlpha: true };
		var c = this.canvas;
		gl = c.getContext("webgl", par);
		if (!gl) gl = c.getContext("experimental-webgl", par);
		if (!gl) alert("Could not initialize WebGL. Try to update your browser or graphic drivers.");
		
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		
		//if(WebGLDebugUtils) WebGLDebugUtils.makeDebugContext(gl);
		
		//c.style["-webkit-user-select"] = "none";
		
		var d = document;
		d.addEventListener("contextmenu",		Stage._ctxt, false);
		d.addEventListener("dragstart",			Stage._blck, false);
		
		//if(Stage._isTD())
		{
			c.addEventListener("touchstart",	Stage._onTD, false);
			c.addEventListener("touchmove",		Stage._onTM, false);
			c.addEventListener("touchend",		Stage._onTU, false);
			d.addEventListener("touchstart",	Stage._blck, false);
			c.addEventListener("touchmove",		Stage._blck, false);
			c.addEventListener("touchend",		Stage._blck, false);
		}
		//else
		{
			c.addEventListener("mousedown",		Stage._onMD, false);
			c.addEventListener("mousemove",		Stage._onMM, false);
			c.addEventListener("mouseup",		Stage._onMU, false);	
			//c.addEventListener("mousedown",		Stage._blck, false);	// prevents IFRAME from getting focus = receiving keyboard events
			c.addEventListener("mousemove",		Stage._blck, false);
			c.addEventListener("mouseup",		Stage._blck, false);	
		}
		
		//c.onselect=function(){alert("onselect");}
		
		d.addEventListener("keydown",	Stage._onKD, false);
		d.addEventListener("keyup",		Stage._onKU, false);
		d.addEventListener("keydown",	Stage._blck, false);
		d.addEventListener("keyup",		Stage._blck, false);
		
		window.addEventListener("resize",	Stage._onRS, false);
       
        this._initShaders();
        this._initBuffers();

        gl.clearColor(0, 0, 0, 0);
		
		gl.enable(gl.BLEND);
		gl.blendEquation(gl.FUNC_ADD);		
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		
		this._resize();
		this._srs = true;
        _requestAF(Stage._tick);
    }
	Stage.prototype = new DisplayObjectContainer();
	
	Stage.prototype._getOrigin = function(org)
	{
		org[0] = this.stageWidth/2;  org[1] = this.stageHeight/2;  org[2] = -500;  org[3] = 1;
	}
	
	Stage._mouseX = 0;
	Stage._mouseY = 0;
	
	Stage._curBF = -1;
	Stage._curEBF = -1;
	
	Stage._curVC = -1;
	Stage._curTC = -1;
	Stage._curUT = -1;
	Stage._curTEX = -1;
	
	Stage._curBMD = "normal";
	
	Stage._setBF = function(bf)
	{
		if(Stage._curBF != bf) {
			gl.bindBuffer(gl.ARRAY_BUFFER, bf);
			Stage._curBF = bf;
		}
	}
	Stage._setEBF = function(ebf)
	{
		if(Stage._curEBF != ebf) {
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebf);
			Stage._curEBF = ebf;
		}
	}
	Stage._setVC = function(vc)
	{
		if(Stage._curVC != vc) {
			gl.bindBuffer(gl.ARRAY_BUFFER, vc);
			gl.vertexAttribPointer(Stage._main._sprg.vpa, 3, gl.FLOAT, false, 0, 0);
			Stage._curVC = Stage._curBF = vc;
		}
	}
	Stage._setTC = function(tc)
	{
		if(Stage._curTC != tc) {
			gl.bindBuffer(gl.ARRAY_BUFFER, tc);
			gl.vertexAttribPointer(Stage._main._sprg.tca, 2, gl.FLOAT, false, 0, 0);
			Stage._curTC = Stage._curBF = tc;
		}
	}
	Stage._setUT = function(ut)
	{
		if(Stage._curUT != ut) {
			gl.uniform1i (Stage._main._sprg.useTex, ut);
			Stage._curUT = ut;
		}
	}
	Stage._setTEX = function(tex)
	{
		if(Stage._curTEX != tex) {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			Stage._curTEX = tex;
		}
	}
	Stage._setBMD = function(bmd)
	{
		if(Stage._curBMD != bmd) 
		{
			if		(bmd == BlendMode.NORMAL  ) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if	(bmd == BlendMode.MULTIPLY) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if	(bmd == BlendMode.ADD)	  {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE);
			}
			else if (bmd == BlendMode.SUBTRACT) { 
				gl.blendEquationSeparate(gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE); 
			}
			else if (bmd == BlendMode.SCREEN) { 
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
			}
			else if (bmd == BlendMode.ERASE) { 
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
			}
			else if (bmd == BlendMode.ALPHA) {
				gl.blendEquation(gl.FUNC_ADD);
				gl.blendFunc(gl.ZERO, gl.SRC_ALPHA);
			}
			Stage._curBMD = bmd;
		}
	}
	
	Stage._okKeys = 	// keyCodes, which are not prevented by IvanK
	[	
		112, 113, 114, 115,   116, 117, 118, 119,   120, 121, 122, 123,	// F1 - F12
		13,	// Enter
		16,	// Shift
		//17,	// Ctrl
		18,	// Alt
		27	// Esc
	];
	
	/** Is Touchscreen Device */
	Stage._isTD = function() { return !!('ontouchstart' in window); }

	Stage._ctxt = function(e){ if(Stage._main.hasEventListener(MouseEvent.RIGHT_CLICK))e.preventDefault();}
	
	Stage.prototype._getMakeTouch = function(id) 
	{  
		var t = this._touches["t"+id];
		if(t==null) {  t = {touch:null, target:null, act:0};  this._touches["t"+id] = t;  }
		return t;
	}
	
	Stage._onTD = function(e){ 
		Stage._setStageMouse(e.touches.item(0)); Stage._main._smd[0] = true; Stage._main._knM = true;
		
		var main = Stage._main;
		for(var i=0; i<e.changedTouches.length; i++)
		{
			var tdom = e.changedTouches.item(i);
			var t = main._getMakeTouch(tdom.identifier);
			t.touch = tdom;
			t.act = 1;
		}
		main._processMouseTouch();
	}
	Stage._onTM = function(e){ 
		Stage._setStageMouse(e.touches.item(0)); Stage._main._smm    = true; Stage._main._knM = true;
		var main = Stage._main;
		for(var i=0; i<e.changedTouches.length; i++)
		{
			var tdom = e.changedTouches.item(i);
			var t = main._getMakeTouch(tdom.identifier);
			t.touch = tdom;
			t.act = 2;
		}
		main._processMouseTouch();
	}
	Stage._onTU = function(e){ 
		Stage._main._smu[0] = true; Stage._main._knM = true;
		var main = Stage._main;
		for(var i=0; i<e.changedTouches.length; i++)
		{
			var tdom = e.changedTouches.item(i);
			var t = main._getMakeTouch(tdom.identifier);
			t.touch = tdom;
			t.act = 3;
		}
		main._processMouseTouch();
	}
	
	Stage._onMD = function(e){ Stage._setStageMouse(e); Stage._main._smd[e.button] = true; Stage._main._knM = true;  Stage._main._processMouseTouch(); }
	Stage._onMM = function(e){ Stage._setStageMouse(e); Stage._main._smm           = true; Stage._main._knM = true;  Stage._main._processMouseTouch(); }
	Stage._onMU = function(e){ Stage._main._smu[e.button] = true; Stage._main._knM = true;  Stage._main._processMouseTouch(); }
	
	Stage._onKD = function(e)
	{
		var st = Stage._main;
		var ev = new KeyboardEvent(KeyboardEvent.KEY_DOWN, true);
		ev._setFromDom(e);
		if(st.focus && st.focus.stage) st.focus.dispatchEvent(ev); else st.dispatchEvent(ev);
	}
	Stage._onKU = function(e)
	{ 
		var st = Stage._main;
		var ev = new KeyboardEvent(KeyboardEvent.KEY_UP, true);
		ev._setFromDom(e);
		if(st.focus && st.focus.stage) st.focus.dispatchEvent(ev); else st.dispatchEvent(ev);
	}
	Stage._blck = function(e)
	{ 
		if(e.keyCode != null) 
		{
			if(e.target.tagName.toLowerCase()=="textarea") {}
			else
				if(Stage._okKeys.indexOf(e.keyCode)==-1) e.preventDefault(); 
		} 
		else e.preventDefault(); 
	}
	Stage._onRS = function(e){ Stage._main._srs = true; }
	
	Stage._getDPR = function() { return window.devicePixelRatio || 1; }
	
	Stage.prototype._resize = function()
	{
		var dpr = Stage._getDPR();
		var w = window.innerWidth  * dpr;
		var h = window.innerHeight * dpr;
		
		this._canvas.style.width  = window.innerWidth  + "px";
		this._canvas.style.height = window.innerHeight + "px";
		
		this.stageWidth  = w;
		this.stageHeight = h;
		
		this._canvas.width  = w;
		this._canvas.height = h;
	
		this._setFramebuffer(null, w, h, false);
	}

    Stage.prototype._getShader = function(gl, str, fs) {
	
        var shader;
        if (fs)	shader = gl.createShader(gl.FRAGMENT_SHADER);
        else	shader = gl.createShader(gl.VERTEX_SHADER);   

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }
        return shader;
    }



    Stage.prototype._initShaders = function() 
	{	
		var fs = "\
			precision mediump float;\
			varying vec2 texCoord;\
			\
			uniform sampler2D uSampler;\
			uniform vec4 color;\
			uniform bool useTex;\
			\
			uniform mat4 cMat;\
			uniform vec4 cVec;\
			\
			void main(void) {\
				vec4 c;\
				if(useTex) { c = texture2D(uSampler, texCoord);  c.xyz *= (1.0/c.w); }\
				else c = color;\
				c = (cMat*c)+cVec;\n\
				c.xyz *= min(c.w, 1.0);\n\
				gl_FragColor = c;\
			}";
		
		var vs = "\
			attribute vec3 verPos;\
			attribute vec2 texPos;\
			\
			uniform mat4 tMat;\
			\
			varying vec2 texCoord;\
			\
			void main(void) {\
				gl_Position = tMat * vec4(verPos, 1.0);\
				texCoord = texPos;\
			}";
			
		var fShader = this._getShader(gl, fs, true );
        var vShader = this._getShader(gl, vs, false);

        this._sprg = gl.createProgram();
        gl.attachShader(this._sprg, vShader);
        gl.attachShader(this._sprg, fShader);
        gl.linkProgram(this._sprg);

        if (!gl.getProgramParameter(this._sprg, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(this._sprg);

        this._sprg.vpa		= gl.getAttribLocation(this._sprg, "verPos");
        this._sprg.tca		= gl.getAttribLocation(this._sprg, "texPos");
        gl.enableVertexAttribArray(this._sprg.tca);
		gl.enableVertexAttribArray(this._sprg.vpa);

		this._sprg.tMatUniform		= gl.getUniformLocation(this._sprg, "tMat");
		this._sprg.cMatUniform		= gl.getUniformLocation(this._sprg, "cMat");
		this._sprg.cVecUniform		= gl.getUniformLocation(this._sprg, "cVec");
        this._sprg.samplerUniform	= gl.getUniformLocation(this._sprg, "uSampler");
		this._sprg.useTex			= gl.getUniformLocation(this._sprg, "useTex");
		this._sprg.color			= gl.getUniformLocation(this._sprg, "color");
    }

	
    Stage.prototype._initBuffers = function() 
	{
        this._unitIBuffer = gl.createBuffer();
		
		Stage._setEBF(this._unitIBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,  1,2,3]), gl.STATIC_DRAW);
    }
	
	Stage.prototype._setFramebuffer = function(fbo, w, h, flip) 
	{
		this._mstack.clear();
		
		this._mstack.push(this._pmat, 0);
		if(flip)	{ this._umat[5] =  2; this._umat[13] = -1;}
		else		{ this._umat[5] = -2; this._umat[13] =  1;}
		this._mstack.push(this._umat);
		
		this._smat[0] = 1/w;  this._smat[5] = 1/h;
		this._mstack.push(this._smat);
	
		gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
		if(fbo) gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w,h);
		gl.viewport(0, 0, w, h);
	}
	
	Stage._setStageMouse = function(t)	// event, want X
	{
		var dpr = Stage._getDPR();
		Stage._mouseX = t.clientX * dpr;
		Stage._mouseY = t.clientY * dpr;
		//console.log(Stage._mouseX, Stage._mouseY);
	}

    Stage.prototype._drawScene = function() 
	{		
		if(this._srs)
		{
			this._resize();
			this.dispatchEvent(new Event(Event.RESIZE));
			this._srs = false;
		}
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		
		//this._processMouseTouch();
		
		//	proceeding EnterFrame
		var efs = EventDispatcher.efbc;
		var ev = new Event(Event.ENTER_FRAME, false);
		for(var i=0; i<efs.length; i++)
		{
			ev.target = efs[i];
			efs[i].dispatchEvent(ev);
		}
		
        this._renderAll(this);
    }
	
	Stage.prototype._processMouseTouch = function()
	{
		if(this._knM)
		{
			var org = this._svec4_0;
			this._getOrigin(org);
			var p   = this._svec4_1;
			p[0] = Stage._mouseX;  p[1] = Stage._mouseY;  p[2] = 0;  p[3] = 1;
			
			//	proceeding Mouse Events
			var newf = this._getTarget(org, p);
			var fa = this._mousefocus || this;
			var fb = newf || this;
			
			if(newf != this._mousefocus)
			{
				if(fa != this)
				{
					var ev = new MouseEvent(MouseEvent.MOUSE_OUT, true);
					ev.target = fa;
					fa.dispatchEvent(ev);
				}
				if(fb != this)
				{
					var ev = new MouseEvent(MouseEvent.MOUSE_OVER, true);
					ev.target = fb;
					fb.dispatchEvent(ev);
				}
			}
			
			if(this._smd[0] && this.focus && newf != this.focus) this.focus._loseFocus();
			for(var i=0; i<3; i++)
			{
				this._mcEvs[i].target = this._mdEvs[i].target = this._muEvs[i].target = fb;
				if(this._smd[i])	{fb.dispatchEvent(this._mdEvs[i]); this._focii[i] = this.focus = newf;}
				if(this._smu[i])	{fb.dispatchEvent(this._muEvs[i]); if(newf == this._focii[i]) fb.dispatchEvent(this._mcEvs[i]); }
				this._smd[i] = this._smu[i] = false;
			}
			
			if(this._smm)	{  var ev = new MouseEvent(MouseEvent.MOUSE_MOVE, true); ev.target = fb;  fb.dispatchEvent(ev);  this._smm=false;  }
			
			this._mousefocus = newf;
		
			//	checking buttonMode
			var uh = false, ob = fb;
			while(ob.parent != null) {uh |= ob.buttonMode; ob = ob.parent;}
			var cursor = uh?"pointer":"default";
			if(fb instanceof TextField && fb.selectable) cursor = "text"
			this._canvas.style.cursor = cursor;
		}
		
		var dpr = Stage._getDPR();
		//for(var i=0; i<this._touches.length; i++) 
		for(var tind in this._touches)
		{
			var t = this._touches[tind];
			if(t.act == 0) continue;
			
			var org = this._svec4_0;
			this._getOrigin(org);
			var p   = this._svec4_1;
			p[0] = t.touch.clientX*dpr;  p[1] = t.touch.clientY*dpr;  p[2] = 0;  p[3] = 1;
			
			var newf = this._getTarget(org, p);
			var fa = t.target || this;
			var fb = newf || this;
			
			if(newf != t.target)
			{
				if(fa != this)
				{
					var ev = new TouchEvent(TouchEvent.TOUCH_OUT, true);
					ev._setFromDom(t.touch);
					ev.target = fa;
					fa.dispatchEvent(ev);
				}
				if(fb != this)
				{
					var ev = new TouchEvent(TouchEvent.TOUCH_OVER, true);
					ev._setFromDom(t.touch);
					ev.target = fb;
					fb.dispatchEvent(ev);
				}
			}
			
			var ev;
			if(t.act == 1)  ev = new TouchEvent(TouchEvent.TOUCH_BEGIN, true);
			if(t.act == 2)  ev = new TouchEvent(TouchEvent.TOUCH_MOVE , true);
			if(t.act == 3)  ev = new TouchEvent(TouchEvent.TOUCH_END  , true);
			ev._setFromDom(t.touch);
			ev.target = fb;
			fb.dispatchEvent(ev);
			if(t.act == 3 && newf == t.target)
			{
				ev = new TouchEvent(TouchEvent.TOUCH_TAP, true);
				ev._setFromDom(t.touch);
				ev.target = fb;
				fb.dispatchEvent(ev);
			}
			t.act = 0;
			t.target = (t.act==3)?null:newf;
		}
	}
	


    Stage._tick = function() {
        _requestAF(Stage._tick);
        Stage.prototype._drawScene.call(Stage._main);
    }

	Stage._MStack = function()
	{
		this.mats = [];
		this.size = 1;
		for(var i=0; i<30; i++) this.mats.push(Point._m4.create());
	}
	
	Stage._MStack.prototype.clear = function()
	{
		this.size = 1;
	}

	Stage._MStack.prototype.push = function(m)
	{
		var s = this.size++;
		Point._m4.multiply(this.mats[s-1], m, this.mats[s]);
	}
	
	Stage._MStack.prototype.pop = function()
	{
		this.size--;
	}
	
	Stage._MStack.prototype.top = function()
	{
		return(this.mats[this.size-1]);
	}
	
	/*
		Color matrix stack
	*/
	Stage._CMStack = function()
	{
		this.mats = [];	//	linear transform matrix
		this.vecs = [];	//  affine shift column
		this.isID = []; //	is Identity
		
		this.bmds = []; //	blend modes
		this.lnnm = [];	//	last not NORMAL blend mode
		this.size = 1;
		this.dirty = true;	// if top matrix is different than shader value
		for(var i=0; i<30; i++) {	this.mats.push(Point._m4.create()); this.vecs.push(new Float32Array(4)); 
									this.isID.push(true); this.bmds.push(BlendMode.NORMAL); this.lnnm.push(0); }
	}
	
	Stage._CMStack.prototype.push = function(m, v, id, bmd)
	{
		var s = this.size++;
		this.isID[s] = id;
		 
		if(id) {
			Point._m4.set(this.mats[s-1], this.mats[s]);
			Point._v4.set(this.vecs[s-1], this.vecs[s]);
		}
		else
		{
			Point._m4.multiply    (this.mats[s-1], m, this.mats[s]);
			Point._m4.multiplyVec4(this.mats[s-1], v, this.vecs[s]);
			Point._v4.add	      (this.vecs[s-1], this.vecs[s], this.vecs[s]);
		}
		if(!id) this.dirty = true;
		
		this.bmds[s] = bmd;
		this.lnnm[s] = (bmd==BlendMode.NORMAL) ? this.lnnm[s-1] : s;
	}
	
	Stage._CMStack.prototype.update = function()
	{
		if(this.dirty)
		{
			var st = Stage._main, s = this.size-1;
			gl.uniformMatrix4fv(st._sprg.cMatUniform, false, this.mats[s]);
			gl.uniform4fv      (st._sprg.cVecUniform, this.vecs[s]);
			this.dirty = false;
		}
		var n = this.lnnm[this.size-1];
		Stage._setBMD(this.bmds[n]);
	}
	
	Stage._CMStack.prototype.pop = function()
	{
		if(!this.isID[this.size-1]) this.dirty = true;
		this.size--;
	}
	


	
	
	/**
	 * A basic class for vector drawing
	 * 
	 * @author Ivan Kuckir
	 */
	function Graphics()
	{
		this._conf = 
		{
			// type: 0 - none, 1 - color, 2 - bitmap;
			ftype   : 0,
			fbdata  : null,
			fcolor  : null,
			lwidth  : 0,
			lcolor  : null
		}
	
		this._points = [0,0];
		this._fills  = [];
		this._afills = [];	// _fills + triangles
		this._lfill = null;	// last fill (Graphics.Fill or Graphics.Tgs)
		this._rect = new Rectangle(0,0,0,0);	// fill rect
		this._srect = new Rectangle(0,0,0,0);	// stroke rect
		
		this._startNewFill();
	}
	/*
	Graphics._lnum = 0;
	Graphics._fnum = 0;
	Graphics._tnum = 0;
	*/
	
	Graphics._delTgs = {};
	Graphics._delNum = 0;
	
	Graphics.prototype._startNewFill = function()	// starting new fill with new line, ending old line
	{
		this._endLine();
		var len = this._points.length/2;
		var fill = new Graphics.Fill(len-1, this._conf);
		this._fills.push(fill);
		this._afills.push(fill);
		this._lfill = fill;
	}
	
	Graphics.prototype._startLine = function()
	{
		var len = this._points.length/2;
		var fill = this._fills[this._fills.length-1];
		var fllen = fill.lines.length;
		if(fllen>0 && fill.lines[fllen-1].isEmpty())
			fill.lines[fllen-1].Set(len-1, this._conf);
		else 
			fill.lines.push(new Graphics.Line(len-1, this._conf));
	}
	
	Graphics.prototype._endLine = function()	// starting new line in last fill
	{
		if(this._fills.length==0) return;
		var len = this._points.length/2;
		var fill = this._fills[this._fills.length-1];
		if(fill.lines.length != 0)
			fill.lines[fill.lines.length-1].end = len-1;
	}
	
	/**
	 * Renders a vector content
	 */
	Graphics.prototype._render = function(st)
	{
		this._endLine();
		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();
		
		for(var i=0; i<this._afills.length; i++)  this._afills[i].render(st, this._points, this._rect);
	}

	Graphics.prototype.lineStyle = function(thickness, color, alpha)
	{
		if(!color) color = 0x000000;
		if(!alpha) alpha = 1;
		
		//if(this._conf.lwidth==thickness && Graphics.equalColor(this._conf.color, Graphics.makeColor(color, alpha))) return;
		//////////
		this._conf.lwidth = thickness;
		this._conf.lcolor = Graphics.makeColor(color, alpha);
		
		this._endLine();
		this._startLine();
		//////////
	}
		
	/**
	 * Begin to fill some shape
	 * @param color	color
	 */
	Graphics.prototype.beginFill = function(color, alpha)
	{
		if(alpha==null) alpha = 1;
		
		this._conf.ftype  = 1;
		this._conf.fcolor = Graphics.makeColor(color, alpha);
		this._startNewFill();
	}
	
	Graphics.prototype.beginBitmapFill = function(bdata)
	{
		this._conf.ftype  = 2;
		this._conf.fbdata = bdata;
		this._startNewFill();
	}
		
	/**
	 * End filling some shape
	 */
	Graphics.prototype.endFill = function() 
	{ 
		this._conf.ftype  = 0;
		this._startNewFill();
	}
		
	/**
	 * Move a "drawing brush" to some position
	 * @param x
	 * @param y
	 */
	Graphics.prototype.moveTo = function(x, y)
	{
		this._endLine();
		this._points.push(x,y);
		this._startLine();
	}
		
	/**
	 * Draw a line to some position
	 * @param x
	 * @param y
	 */
	Graphics.prototype.lineTo = function(x2, y2)
	{
		var ps = this._points;
		if(x2==ps[ps.length-2] && y2==ps[ps.length-1]) return;
		if(ps.length>0) if(this._conf.ftype >0) this._rect._unionWL(ps[ps.length-2], ps[ps.length-1], x2,y2);
		if(this._conf.lwidth>0) this._srect._unionWL(ps[ps.length-2], ps[ps.length-1], x2,y2);
		ps.push(x2,y2);
	}
	
	
	Graphics.prototype.curveTo = function(bx, by, cx, cy)
	{
		var ps = this._points;
		var ax   = ps[ps.length-2];  
		var ay   = ps[ps.length-1];
		var t = 2/3;
		this.cubicCurveTo(ax+t*(bx-ax), ay+t*(by-ay), cx+t*(bx-cx), cy+t*(by-cy), cx, cy);
	}
	
	Graphics.prototype.cubicCurveTo = function(bx, by, cx, cy, dx, dy, parts)
	{
		/*
				b --- q --- c
			   / 			 \
			  p				  r
			 /				   \
			a					d
		*/
		if(!parts) parts = 40;
		var ps = this._points;
		var ax   = ps[ps.length-2], ay = ps[ps.length-1];
		var tobx = bx - ax, toby = by - ay;  // directions
		var tocx = cx - bx, tocy = cy - by;
		var todx = dx - cx, tody = dy - cy;
		var step = 1/parts;
		
		for(var i=1; i<parts; i++)
		{
			var d = i*step;
			var px = ax +d*tobx,  py = ay +d*toby;
			var qx = bx +d*tocx,  qy = by +d*tocy;
			var rx = cx +d*todx,  ry = cy +d*tody;
			var toqx = qx - px,   toqy = qy - py;
			var torx = rx - qx,   tory = ry - qy;
			
			var sx = px +d*toqx, sy = py +d*toqy;
			var tx = qx +d*torx, ty = qy +d*tory;
			var totx = tx - sx,  toty = ty - sy;
			this.lineTo(sx + d*totx, sy + d*toty);
		}
		this.lineTo(dx, dy);
	}
		
	/**
	 * Draw a circle
	 * @param x		X coordinate of a center
	 * @param y		Y coordinate of a center
	 * @param r		radius
	 */
	Graphics.prototype.drawCircle = function(x, y, r)
	{
		this.drawEllipse(x, y, r*2, r*2);
	}
	
	/**
	 * Draw an ellipse
	 * @param x		X coordinate of a center
	 * @param y		Y coordinate of a center
	 * @param w		ellipse width
	 * @param h		ellipse height
	 */
	Graphics.prototype.drawEllipse = function(x, y, w, h)	
	{
		var hw = w/2, hh = h/2;
		var c = 0.553;
		this.moveTo(x, y-hh);
		
		this.cubicCurveTo(x+c*hw, y-hh,    x+hw, y-c*hh,     x+hw, y, 16);
		this.cubicCurveTo(x+hw, y+c*hh,    x+c*hw, y+hh,     x, y+hh, 16);
		this.cubicCurveTo(x-c*hw, y+hh,    x-hw, y+c*hh,     x-hw, y, 16);
		this.cubicCurveTo(x-hw, y-c*hh,    x-c*hw, y-hh,     x, y-hh, 16);
	}
		
	
	Graphics.prototype.drawRect = function(x, y, w, h)
	{
		this.moveTo(x,y);
		this.lineTo(x+w,y);
		this.lineTo(x+w,y+h);
		this.lineTo(x,y+h);
		this.lineTo(x,y);
	}
	
	/**
	 * Draws a rectangle with round corners
	 * @param x		X coordinate of top left corner
	 * @param y		Y coordinate of top left corner
	 * @param w		width
	 * @param h		height
	 */
	Graphics.prototype.drawRoundRect = function(x, y, w, h, ew, eh)
	{
		var hw = ew/2, hh = eh/2;
		var c = 0.553;
		var x0 = x+hw, x1 = x+w-hw;
		var y0 = y+hh, y1 = y+h-hh; 
		
		this.moveTo(x0, y);
		this.lineTo(x1, y);
		this.cubicCurveTo(x1+c*hw, y,    x+w, y0-c*hh,   x+w, y0, 16);
		this.lineTo(x+w, y1);
		this.cubicCurveTo(x+w, y1+c*hh,  x1+c*hw, y+h,   x1, y+h, 16);
		this.lineTo(x0, y+h);
		this.cubicCurveTo(x0-c*hw, y+h,  x, y1+c*hh,     x,  y1 , 16);
		this.lineTo(x, y0);
		this.cubicCurveTo(x, y0-c*hh,    x0-c*hw, y,     x0, y  , 16);
	}
	
	Graphics.prototype.drawTriangles = function(vrt, ind, uvt)
	{
		Graphics.Fill.updateRect(vrt, this._rect);
		var nvrt = [];
		for(var i=0; i<vrt.length; i+=2) nvrt.push( vrt[i], vrt[i+1], 0 );
		var tgs = Graphics._makeTgs(nvrt, ind, uvt, this._conf.fcolor, this._conf.fbdata);
		this._afills.push(tgs);
		this._lfill = tgs;
	}
	
	Graphics.prototype.drawTriangles3D = function(vrt, ind, uvt)
	{
		var tgs = Graphics._makeTgs( vrt, ind, uvt, this._conf.fcolor, this._conf.fbdata);
		this._afills.push(tgs);
		this._lfill = tgs;
	}
	
	
	Graphics.prototype.clear = function()
	{
		//console.log("clearing");
		this._conf.ftype = 0;
		this._conf.bdata = null;
		this._conf.fcolor = null;
		this._conf.lwidth = 0;
	
		this._points = [0,0];
		this._fills  = [];
		for(var i=0; i<this._afills.length; i++)
		{
			var f = this._afills[i];
			if(f instanceof Graphics.Fill)
			{ 
				if(f.tgs) Graphics._freeTgs(f.tgs); 
				for(var j=0; j<f.lineTGS.length; j++) Graphics._freeTgs(f.lineTGS[j]);
			}
			else Graphics._freeTgs(f);
		}
		this._afills = [];	// _fills + triangles
		this._lfill = null;
		this._rect.setEmpty();
		this._startNewFill();
	}
		
		/**
		 * Returns a bounding rectangle of a vector content
		 * @return	a bounding rectangle
		 */
		 
	Graphics.prototype._getLocRect = function(stks)
	{
		if(stks==false) return this._rect;
		else return this._rect.union(this._srect);
	}
	
	Graphics.prototype._hits = function(x, y)
	{
		return this._rect.contains(x,y);
	}
	
	Graphics.makeColor = function(c, a)
	{
		var col = new Float32Array(4);
		col[0] = (c>>16 & 255)*0.0039215686;
		col[1] = (c>>8 & 255)*0.0039215686;
		col[2] = (c & 255)*0.0039215686;
		col[3] = a;
		return col;
	}
	Graphics.equalColor = function(a,b)
	{
		return a[0]==b[0] && a[1]==b[1] && a[2]==b[2] && a[3]==b[3];
	}
	
	Graphics.len = function(x, y)
	{
		return Math.sqrt(x*x+y*y);
	}
	
	
	/*
		Fill represents a drawable element.
	*/
	
	
	Graphics.Fill = function(begin, conf)
	{
		// type: 0 - none, 1 - color, 2 - bitmap;
		this.type = conf.ftype;
		this.color = conf.fcolor;
		this.bdata = conf.fbdata;
		
		this.lines = [new Graphics.Line(begin, conf)];
		this.lineTGS = [];
		
		this.dirty = true;
		
		this.tgs = null;
	}
	
	Graphics.Fill.prototype.Build = function(ps, rect)
	{
		//console.log("building Fill");
		var tvrt = [];
		var tind = [];
		
		var lTGS = [];	// array of { vrt:[], ind:[], color:[] }
		
		var cline = null;
		var lwidth = -1;
		var lcolor = null;
		
		for(var l=0; l<this.lines.length; l++)
		{
			var line = this.lines[l];
			if(line.begin==line.end) continue;
			
			var lbeg = line.begin*2;
			var lend = line.end*2;
			
			var firstEqLast = (ps[lbeg] == ps[lend] && ps[lbeg+1] == ps[lend+1]);
			if(firstEqLast)  lend-=2;
			
			if(line.width>0)
			{
				if(cline == null || line.width != lwidth || !Graphics.equalColor(lcolor, line.color))
				{
					cline = { vrt:[], ind:[], color:line.color};
					lTGS.push(cline);
					lwidth = line.width;
					lcolor = line.color;
				}
				Graphics.Line.GetTriangles(ps, lbeg, lend, line, (this.type!=0 || firstEqLast), cline.ind, cline.vrt);
			}
			
			if(this.type != 0 && lend-lbeg>2)
			{
				var vts = ps.slice(line.begin*2, line.end*2+2);
				if(firstEqLast) { vts.pop(); vts.pop(); }
				if(Graphics.PolyK.GetArea(vts)<0) vts = Graphics.PolyK.Reverse(vts);
				
				//Graphics.Fill.updateRect(vts, rect);
				
				var vnum = tvrt.length/3;
				var ind = Graphics.PolyK.Triangulate(vts);
				for(var i=0; i<ind.length; i++) tind.push( ind[i] + vnum );
				for(var i=0; i<vts.length/2; i++) tvrt.push( vts[2*i], vts[2*i+1], 0 );
			}
		}
		
		for(var i=0; i<lTGS.length; i++) { this.lineTGS.push(Graphics._makeTgs(lTGS[i].vrt, lTGS[i].ind, null, lTGS[i].color)); }
		
		if(tvrt.length > 0) this.tgs = Graphics._makeTgs(tvrt, tind, null, this.color, this.bdata);
	}
	
	Graphics.Fill.prototype.isEmpty = function()
	{
		if(this.lines.length==0) return true;
		return this.lines[0].isEmpty();
	}
	
	Graphics.Fill.prototype.render = function(st, ps, rect)
	{
		if(this.dirty) { this.Build(ps, rect);  this.dirty = false; }
		if(this.tgs) this.tgs.render(st);
		for(var i=0; i<this.lineTGS.length; i++)	this.lineTGS[i].render(st);
	}
	
	Graphics.Fill.updateRect = function(vts, rect)
	{
		var minx =  Infinity, miny =  Infinity;
		var maxx = -Infinity, maxy = -Infinity;
		
		if(!rect.isEmpty()) { minx=rect.x; miny=rect.y; maxx=rect.x+rect.width; maxy=rect.y+rect.height;  }
		for(var i=0; i<vts.length; i+=2)
		{
			minx = Math.min(minx, vts[i  ]);
			miny = Math.min(miny, vts[i+1]);
			maxx = Math.max(maxx, vts[i  ]);
			maxy = Math.max(maxy, vts[i+1]);
		}
		rect.x = minx;  rect.y = miny; rect.width = maxx-minx;  rect.height = maxy - miny;
	}
	
	
	Graphics.Line = function(begin, conf)
	{
		this.begin = begin;	// index to first point
		this.end   = -1;	// index to last point
		this.width = conf.lwidth;
		this.color = conf.lcolor;
		
		//this.dirty = true;
	}
	Graphics.Line.prototype.Set = function(begin, conf)
	{
		this.begin = begin;	// index to first point
		this.end   = -1;	// index to last point
		this.width = conf.lwidth;
		this.color = conf.lcolor;
	}
	
	Graphics.Line.prototype.isEmpty = function()
	{
		return this.begin == this.end;
	}
	
	
	Graphics.Line.GetTriangles = function(ps, lbeg, lend, line, close, ind, vrt)
	{
		var vnum = vrt.length/3;
		var l = lend-lbeg-2;
		
		if(close) Graphics.Line.AddJoint(ps, lend, lbeg, lbeg+2, line.width, vrt);
		else      Graphics.Line.AddEnd  (ps, lbeg, lbeg+2, true, line.width, vrt);
		
		for(var i=0; i<l; i+=2)
		{
			Graphics.Line.AddJoint(ps, lbeg+i, lbeg+i+2, lbeg+i+4, line.width, vrt);
			ind.push(vnum+i+0, vnum+i+1, vnum+i+2, vnum+i+1, vnum+i+2, vnum+i+3 );
		}
		
		if(close) 
		{
			Graphics.Line.AddJoint(ps, lbeg+l, lbeg+l+2, lbeg, line.width, vrt);
			ind.push(vnum+l+0, vnum+l+1, vnum+l+2, vnum+l+1, vnum+l+2, vnum+l+3 );
			ind.push(vnum+l+2, vnum+l+3, vnum+0, vnum+l+3, vnum+0, vnum+1);
		}
		else
		{
			Graphics.Line.AddEnd(ps, lbeg+l, lbeg+l+2, false, line.width, vrt);
			ind.push(vnum+0+l, vnum+1+l, vnum+2+l, vnum+1+l, vnum+2+l, vnum+3+l );
		}
	}
	Graphics.Line.AddEnd   = function(ps, i0, i1, start, width, vrt)
	{
		var x1 = ps[i0], y1 = ps[i0+1];
		var x2 = ps[i1], y2 = ps[i1+1];
				
		var il = 0.5*width/Graphics.len(x1-x2, y1-y2);;
		var dx =  il*(y1-y2); dy = -il*(x1-x2);
		
		//if(start) {vrt.push(x1+dx); vrt.push(y1+dy); vrt.push(0); vrt.push(x1-dx); vrt.push(y1-dy); vrt.push(0);}
		//else	  {vrt.push(x2+dx); vrt.push(y2+dy); vrt.push(0); vrt.push(x2-dx); vrt.push(y2-dy); vrt.push(0);}
		if(start) vrt.push(x1+dx, y1+dy, 0, x1-dx, y1-dy, 0);
		else	  vrt.push(x2+dx, y2+dy, 0, x2-dx, y2-dy, 0);
	}
	
	Graphics.Line.AddJoint = function(ps, i0, i1, i2, width, vrt)
	{
		var a1 = new Point(), a2 = new Point(), b1 = new Point(), b2 = new Point(), c = new Point();
		
		var x1 = ps[i0], y1 = ps[i0+1];
		var x2 = ps[i1], y2 = ps[i1+1];
		var x3 = ps[i2], y3 = ps[i2+1];
		
		var ilA = 0.5*width/Graphics.len(x1-x2, y1-y2);
		var ilB = 0.5*width/Graphics.len(x2-x3, y2-y3);
		var dxA =  ilA*(y1-y2), dyA = -ilA*(x1-x2);
		var dxB =  ilB*(y2-y3), dyB = -ilB*(x2-x3);
		
		//if(dxA==dxB && dyA==dyB)
		if(Math.abs(dxA-dxB)+Math.abs(dyA-dyB) < 0.0000001)
		{
			vrt.push(x2+dxA, y2+dyA, 0);
			vrt.push(x2-dxA, y2-dyA, 0);
			return;
		}
			
		a1.setTo(x1+dxA, y1+dyA);   a2.setTo(x2+dxA, y2+dyA);
		b1.setTo(x2+dxB, y2+dyB);   b2.setTo(x3+dxB, y3+dyB);
		Graphics.PolyK._GetLineIntersection(a1, a2, b1, b2, c);
		vrt.push(c.x, c.y, 0);
		
		a1.setTo(x1-dxA, y1-dyA);   a2.setTo(x2-dxA, y2-dyA);
		b1.setTo(x2-dxB, y2-dyB);   b2.setTo(x3-dxB, y3-dyB);
		Graphics.PolyK._GetLineIntersection(a1, a2, b1, b2, c);
		vrt.push(c.x, c.y, 0);
	}
	
	/*
		Basic container for triangles.
	*/
	
	Graphics._makeTgs = function(vrt, ind, uvt, color, bdata)
	{
		var name = "t_"+vrt.length+"_"+ind.length;
		//console.log(name);
		var arr = Graphics._delTgs[name];
		if(arr == null || arr.length == 0) return new Graphics.Tgs(vrt, ind, uvt, color, bdata);
		//console.log("recycling triangles ...");
		var t = arr.pop();
		Graphics._delNum--;
		t.Set(vrt, ind, uvt, color, bdata);
		return t;
	}
	
	Graphics._freeTgs = function(tgs)
	{
		//console.log("Freeing:", tgs);
		var arr = Graphics._delTgs[tgs.name];
		if(arr == null) arr = [];
		arr.push(tgs);
		Graphics._delNum++;
		Graphics._delTgs[tgs.name] = arr;
	}
	
	Graphics.Tgs = function(vrt, ind, uvt, color, bdata)
	{
		this.color = color;
		this.bdata = bdata;
		this.name = "t_"+vrt.length+"_"+ind.length;
		
		this.useTex   = (bdata!=null);
		this.dirtyUVT = true;
		this.emptyUVT = (uvt==null);
		this.useIndex = vrt.length/3 <= 65536;	// use index array for drawing triangles
		
		if(this.useIndex)
		{
			this.ind = new Uint16Array (ind);
			this.vrt = new Float32Array(vrt);
			if(uvt) this.uvt = new Float32Array(uvt);
			else    this.uvt = new Float32Array(vrt.length * 2/3);
			
			this.ibuf = gl.createBuffer();
			Stage._setEBF(this.ibuf);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.ind, gl.STATIC_DRAW);
		}
		else
		{
			this.vrt = new Float32Array(ind.length*3);
			Graphics.Tgs.unwrapF32(ind, vrt, 3, this.vrt); //new Float32Array(Tgs.unwrap(ind, vrt, 3));
			
			this.uvt = new Float32Array(ind.length*2);
			if(uvt) Graphics.Tgs.unwrapF32(ind, uvt, 2, this.uvt); //new Float32Array(Tgs.unwrap(ind, uvt, 2));
			//else    this.uvt = new Float32Array(ind.length*2);
		}
		
		this.vbuf = gl.createBuffer();
		Stage._setBF(this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.vrt, gl.STATIC_DRAW);
		
		this.tbuf = gl.createBuffer();
		Stage._setBF(this.tbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.uvt, gl.STATIC_DRAW);
	}
	
	Graphics.Tgs.prototype.Set = function(vrt, ind, uvt, color, bdata)
	{
		this.color = color;
		this.bdata = bdata;
		//this.name = "t_"+vrt.length+"_"+ind.length;
		
		this.useTex   = (bdata!=null);
		this.dirtyUVT = true;
		this.emptyUVT = (uvt==null);
		//this.useIndex = vrt.length/3 <= 65536;	// use index array for drawing triangles
		
		if(this.useIndex)
		{
			var il = ind.length, vl = vrt.length;
			for(var i=0; i<il; i++) this.ind[i] = ind[i];
			for(var i=0; i<vl; i++) this.vrt[i] = vrt[i];
			if(uvt) for(var i=0; i<uvt.length; i++) this.uvt[i] = uvt[i];
			/*
			this.ind = new Uint16Array (ind);
			this.vrt = new Float32Array(vrt);
			if(uvt) this.uvt = new Float32Array(uvt);
			else    this.uvt = new Float32Array(vrt.length * 2/3);
			
			this.ibuf = gl.createBuffer();
			*/
			Stage._setEBF(this.ibuf);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.ind, gl.STATIC_DRAW);
			
		}
		else
		{
			Graphics.Tgs.unwrapF32(ind, vrt, 3, this.vrt);
			if(uvt) Graphics.Tgs.unwrapF32(ind, uvt, 2, this.uvt);
		}
		
		//this.vbuf = gl.createBuffer();
		Stage._setBF(this.vbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.vrt, gl.STATIC_DRAW);
		
		//this.tbuf = gl.createBuffer();
		Stage._setBF(this.tbuf);
		gl.bufferData(gl.ARRAY_BUFFER, this.uvt, gl.STATIC_DRAW);
	}
	
	Graphics.Tgs.prototype.render = function(st)
	{
		if(this.useTex)
		{
			var bd = this.bdata;
			if(bd._loaded == false) return;
			if(bd._dirty) bd._syncWithGPU();
			if(this.dirtyUVT)
			{
				this.dirtyUVT = false;
				if(this.emptyUVT)
				{
					this.emptyUVT = false;
					var cw = 1/bd._rwidth, ch = 1/bd._rheight;
					for(var i=0; i<this.uvt.length; i++) {this.uvt[2*i] = cw*this.vrt[3*i]; this.uvt[2*i+1] = ch*this.vrt[3*i+1];}
				}
				else if(bd.width != bd._rwidth || bd.height != bd._rheight)
				{
					var cw = bd.width/bd._rwidth, ch = bd.height/bd._rheight;
					for(var i=0; i<this.uvt.length; i++) {this.uvt[2*i] *= cw; this.uvt[2*i+1] *= ch; }
				}
				Stage._setBF(this.tbuf);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.uvt);
			}
			Stage._setUT(1);
			Stage._setTEX(bd._texture);
		}
		else
		{
			Stage._setUT(0);
			gl.uniform4fv(st._sprg.color, this.color);
		}
		
		Stage._setTC(this.tbuf);
		Stage._setVC(this.vbuf);
		
		if(this.useIndex)
		{
			Stage._setEBF(this.ibuf);
			gl.drawElements(gl.TRIANGLES, this.ind.length, gl.UNSIGNED_SHORT, 0);	// druhý parametr - počet indexů
		}
		else  gl.drawArrays(gl.TRIANGLES, 0, this.vrt.length/3);
	}
	
	Graphics.Tgs.unwrapF32 = function(ind, crd, cpi, ncrd)	
	{
		//var ncrd = new Float32Array(ind.length*cpi);
		var il = ind.length;
		for(var i=0; i<il; i++)
			for(var j=0; j<cpi; j++)
				ncrd[i*cpi+j] = crd[ind[i]*cpi+j];
		//return ncrd;
	}
	
	
	
	Graphics.PolyK = {};
	
	Graphics.PolyK.Triangulate = function(p)
	{
		var n = p.length>>1;
		if(n< 3) return [];
		
		var tgs = [];
		
		if(Graphics.PolyK.IsConvex(p)) { for(var i=1; i<n-1; i++) tgs.push(0, i, i+1);  return tgs; }
		
		var avl = [];
		for(var i=0; i<n; i++) avl.push(i);
		
		var i = 0;
		var al = n;
		while(al > 3)
		{
			var i0 = avl[(i+0)%al];
			var i1 = avl[(i+1)%al];
			var i2 = avl[(i+2)%al];
			
			var ax = p[2*i0],  ay = p[2*i0+1];
			var bx = p[2*i1],  by = p[2*i1+1];
			var cx = p[2*i2],  cy = p[2*i2+1];
			
			var earFound = false;
			if(Graphics.PolyK._convex(ax, ay, bx, by, cx, cy))
			{
				earFound = true;
				for(var j=0; j<al; j++)
				{
					var vi = avl[j];
					if(vi==i0 || vi==i1 || vi==i2) continue;
					if(Graphics.PolyK._PointInTriangle(p[2*vi], p[2*vi+1], ax, ay, bx, by, cx, cy)) {earFound = false; break;}
				}
			}
			if(earFound)
			{
				tgs.push(i0, i1, i2);
				avl.splice((i+1)%al, 1);
				al--;
				i= 0;
			}
			else if(i++ > 3*al) break;		// no convex angles :(
		}
		tgs.push(avl[0], avl[1], avl[2]);
		return tgs;
	}
	
	Graphics.PolyK.IsConvex = function(p)
	{
		if(p.length<6) return true;
		var l = p.length - 4;
		for(var i=0; i<l; i+=2)
			if(!Graphics.PolyK._convex(p[i], p[i+1], p[i+2], p[i+3], p[i+4], p[i+5])) return false;
		if(!Graphics.PolyK._convex(p[l  ], p[l+1], p[l+2], p[l+3], p[0], p[1])) return false;
		if(!Graphics.PolyK._convex(p[l+2], p[l+3], p[0  ], p[1  ], p[2], p[3])) return false;
		return true;
	}
	
	Graphics.PolyK._convex = function(ax, ay, bx, by, cx, cy)
	{
		return (ay-by)*(cx-bx) + (bx-ax)*(cy-by) >= 0;
	}
	
	Graphics.PolyK._PointInTriangle = function(px, py, ax, ay, bx, by, cx, cy)
	{
		var v0x = cx-ax, v0y = cy-ay;
		var v1x = bx-ax, v1y = by-ay;
		var v2x = px-ax, v2y = py-ay;
		
		var dot00 = v0x*v0x+v0y*v0y;
		var dot01 = v0x*v1x+v0y*v1y;
		var dot02 = v0x*v2x+v0y*v2y;
		var dot11 = v1x*v1x+v1y*v1y;
		var dot12 = v1x*v2x+v1y*v2y;
		
		var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
		var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
		var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

		// Check if point is in triangle
		return (u >= 0) && (v >= 0) && (u + v < 1);
	}
	
	Graphics.PolyK._GetLineIntersection = function(a1, a2, b1, b2, c)
	{
		var dax = (a1.x-a2.x), dbx = (b1.x-b2.x);
		var day = (a1.y-a2.y), dby = (b1.y-b2.y);

		var Den = dax*dby - day*dbx;
		if (Den == 0) return null;	// parallel
		
		var A = (a1.x * a2.y - a1.y * a2.x);
		var B = (b1.x * b2.y - b1.y * b2.x);
		
		c.x = ( A*dbx - dax*B ) / Den;
		c.y = ( A*dby - day*B ) / Den;
	}
	
	Graphics.PolyK.GetArea = function(p)
	{
		if(p.length <6) return 0;
		var l = p.length - 2;
		var sum = 0;
		for(var i=0; i<l; i+=2)  sum += (p[i+2]-p[i]) * (p[i+1]+p[i+3]);
		sum += (p[0]-p[l]) * (p[l+1]+p[1]);
		return - sum * 0.5;
	}
	
	Graphics.PolyK.Reverse = function(p)
	{
		var np = [];
		for(var j=p.length-2; j>=0; j-=2)  np.push(p[j], p[j+1])
		return np;
	}
	function Sprite()
	{
		DisplayObjectContainer.call(this);
		
		this._trect2 = new Rectangle();
		
		this.graphics = new Graphics();
	}
	Sprite.prototype = new DisplayObjectContainer();
	
	
	Sprite.prototype._getRect = function(tmat, torg, stks)
	{
		var r1 = DisplayObjectContainer.prototype._getRect.call(this, tmat, torg, stks);
		var r2 = this.graphics._getLocRect(stks);
		
		Point._m4.multiply(tmat, this._getATMat(), this._tempm);
		this._transfRect(this._tempm, torg, r2, this._trect2);
		return r1.union(this._trect2);
	}
	
	
	
	Sprite.prototype._render = function(st)
	{
		this.graphics._render(st);
		DisplayObjectContainer.prototype._render.call(this, st);
	}
	
	Sprite.prototype._getTarget = function(porg, pp)
	{
		if(!this.visible || (!this.mouseChildren && !this.mouseEnabled)) return null; 
		
		var tgt = DisplayObjectContainer.prototype._getTarget.call(this, porg, pp);
		if(tgt != null) return tgt;
		
		if(!this.mouseEnabled) return null;
		
		var org = this._tvec4_0, p   = this._tvec4_1, im = this.transform._getIMat();
		Point._m4.multiplyVec4(im, porg, org);
		Point._m4.multiplyVec4(im, pp, p);
			
		var pt = this._tempP;
		this._lineIsc(org, p, pt);
		
		if(this.graphics._hits(pt.x, pt.y)) return this;
		return null;
	}
	
	Sprite.prototype._htpLocal = function(org, p)
	{
		var tp = this._tempP;
		this._lineIsc(org, p, tp);
		
		if(this.graphics._hits(tp.x, tp.y)) return true;
		return DisplayObjectContainer.prototype._htpLocal.call(this, org, p);
	}