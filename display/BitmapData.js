
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














