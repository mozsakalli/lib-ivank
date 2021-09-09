
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