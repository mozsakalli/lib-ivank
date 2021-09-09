		/**
		 * Set the text format of a text
		 * @param ntf	new text format
		 */
	function TextField()
	{
		InteractiveObject.call(this);
		
		this._tarea		= document.createElement("textarea");
		this._tareaAdded = false;
		this._tarea.setAttribute("style", "font-family:Times New Roman; font-size:12px; z-index:-1; \
											position:absolute; top:0px; left:0px; opacity:0; pointer-events:none; user-select:none; width:100px; height:100px;");
		this._tarea.addEventListener("input", this._tfInput.bind(this), false);
		//this._tarea.addEventListener("mousedown", function(e){e.preventDefault();});
	
		
		this._stage		= null;
		this._type		= "dynamic"; // "dynamic" or "input"
		this._selectable= true;
		this._mdown		= false;
		this._curPos	= -1;
		this._select	= null;	// selection
		this._metrics	= null;		// metrics of rendered text
		this._wordWrap	= false;	// wrap words 
		this._textW		= 0;		// width of text
		this._textH		= 0;		// height of text
		this._areaW		= 100;		// width of whole TF area
		this._areaH		= 100;		// height of whole TF area
		this._text		= "";		// current text
		this._tForm		= new TextFormat();
		this._rwidth	= 0;
		this._rheight	= 0;  
		this._background = false;
		this._border	= false;
		
		this._texture	= gl.createTexture();	// texture
		this._tcArray	= new Float32Array([0,0, 0,0, 0,0, 0,0]);
		this._tcBuffer	= gl.createBuffer();	// texture coordinates buffer
		Stage._setBF(this._tcBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this._tcArray, gl.STATIC_DRAW);
		
		this._fArray	= new Float32Array([0,0,0, 0,0,0, 0,0,0, 0,0,0]);
		this._vBuffer	= gl.createBuffer();	// vertices buffer for 4 vertices
		Stage._setBF(this._vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this._fArray, gl.STATIC_DRAW);
		
		this.addEventListener2(Event.ADDED_TO_STAGE, this._tfATS, this);
		this.addEventListener2(Event.REMOVED_FROM_STAGE, this._tfRFS, this);
		this.addEventListener2(MouseEvent.MOUSE_DOWN, this._tfMD, this);
		
		this.addEventListener2(KeyboardEvent.KEY_UP, this._tfKU, this);
		
		this._brect = new Rectangle();
	}
	TextField.prototype = new InteractiveObject();
	
	TextField.prototype._getLocRect = function() { return this._brect; }
	
	TextField.prototype._loseFocus = function() 
	{ 
		if(this._tareaAdded) document.body.removeChild(this._tarea);
		this._tareaAdded = false;
		this._curPos = -1; 
		this._update(); 
	}
	
	TextField.prototype._tfKU = function(e)
	{
		//console.log(String.fromCharCode(e.keyCode));
		this._tfInput(null);
	}
	
	TextField.prototype._tfInput = function(e)
	{
		if(this._type != "input") return;
		this._text = this._tarea.value;
		this._select = null;
		this._curPos = this._tarea.selectionStart;
		this.setSelection(this._tarea.selectionStart, this._tarea.selectionEnd);
	}
	
	TextField.prototype._tfATS = function(e)
	{
		this._stage = this.stage;
	}
	TextField.prototype._tfRFS = function(e)
	{
		this._loseFocus();
	}
	
	TextField.prototype._tfMD = function(e)
	{
		//console.log("tfMD");
		if(!this._selectable) return;
		if(this._type == "input")
		{
			this._tareaAdded = true;
			document.body.appendChild(this._tarea);
			this._tarea.value = this._text;
			this._tarea.focus();
		}
		var ind = this.getCharIndexAtPoint(this.mouseX, this.mouseY);
		this._mdown = true;
		this._curPos = ind;
		this.setSelection(ind, ind);
		this._update();
		
		this.stage.addEventListener2(MouseEvent.MOUSE_MOVE, this._tfMM, this);
		this.stage.addEventListener2(MouseEvent.MOUSE_UP,   this._tfMU, this);
	}
	TextField.prototype._tfMM = function(e)
	{
		//console.log("tfMM");
		if(!this._selectable || !this._mdown) return;
		var ind = this.getCharIndexAtPoint(this.mouseX, this.mouseY);
		this.setSelection(this._curPos, ind);
	}
	TextField.prototype._tfMU = function(e)
	{
		//console.log("tfMU");
		if(!this._selectable) return;
		//var sel = this._select;
		//if(sel) if(sel.from != sel.to) this._tarea.setSelectionRange(sel.from, sel.to); 
		//this.setSelection(this._curPos, ind);
		this._mdown = false;
		
		if(this._type == "input") this._tarea.focus();
		
		this._stage.removeEventListener(MouseEvent.MOUSE_MOVE, this._tfMM);
		this._stage.removeEventListener(MouseEvent.MOUSE_UP,   this._tfMU);
	}
	
	/* public */
	
	TextField.prototype.appendText = function(newText) { this._text += newText; this._update(); }
	
	TextField.prototype.getCharBoundaries = function(charIndex)
	{
		//console.log("      ".split(" "));
		//if(charIndex>=this._text.length) {var lw =  return new Rectangle(0,0,30,30);}
		var ctx = TextFormat._ctxext;
		this._tForm.setContext(ctx);
		var m = this._metrics;
		var l = this.getLineIndexOfChar(charIndex);
		if(m[l].words.length == 0) return new Rectangle(m[l].x, m[l].y, m[l].width, m[l].height);
		var w = 0;  while(w+1<m[l].words.length && m[l].words[w+1].charOffset<=charIndex) w++;
		var word = m[l].words[w];
		var pref = word.word.substring(0,charIndex-word.charOffset);
		var rect = new Rectangle(word.x + ctx.measureText(pref).width, word.y, 0, word.height);
		rect.width = ctx.measureText(this._text.charAt(charIndex)).width;
		var nw = m[l].words[w+1];
		if(nw && nw.charOffset==charIndex+1) rect.width = nw.x-rect.x;
		return rect;
	}
	
	TextField.prototype.getCharIndexAtPoint = function(x, y)
	{
		if(this._text.length == 0) return 0;
		var ctx = TextFormat._ctxext;
		this._tForm.setContext(ctx);
		var m = this._metrics;
		var l = this.getLineIndexAtPoint(x,y);
		x = Math.max(m[l].x, Math.min(m[l].x+m[l].width, x));
		var w = 0;  while(w+1<m[l].words.length && m[l].words[w+1].x<=x) w++;
		var word = m[l].words[w];
		var ci = word.charOffset;
		var cx = word.x;
		while(true)
		{
			var cw = ctx.measureText(this._text.charAt(ci)).width;
			if(cx+cw*0.5<x && cw!=0) { cx+=cw; ci++; }
			else break;
		}
		return ci;
	}
	
	TextField.prototype.getLineIndexAtPoint = function(x, y)
	{
		var m = this._metrics;
		var l = 0;
		while(l+1<m.length && m[l+1].y<=y) l++;
		return l;
	}
	TextField.prototype.getLineIndexOfChar = function(charIndex)
	{
		var m = this._metrics;
		var l = 0;
		while(l+1<m.length && m[l+1].charOffset<=charIndex) l++;
		return l;
	}
	
	TextField.prototype.getTextFormat = function(ntf)
	{
		return this._tForm.clone();
	}
	
	TextField.prototype.setTextFormat = function(ntf)
	{
		this._tForm.set(ntf);
		this._tarea.style.fontFamily = ntf.font;
		this._tarea.style.fontSize = ntf.size+"px";
		this._tarea.style.textAlign = ntf.align;
		this._update();
	}
	
	TextField.prototype.setSelection = function(begin, end)
	{
		var a = Math.min(begin,end), b = Math.max(begin,end), s = this._select;
		if(s==null || s.from != a || s.to != b)
		{
			this._select = { from:a, to:b };
			//console.log(a, b, this._tarea.setSelectionRange);
		
			//this._tarea.setSelectionRange(a,b);
			this._tarea.selectionStart = a;  this._tarea.selectionEnd = b;
			this._update();
		}
	}
	
	TextField.prototype._update = function()
	{
		var w = this._brect.width  = this._areaW;
		var h = this._brect.height = this._areaH;
		
		if(w == 0 || h == 0) return;
		var data = this._tForm.getImageData(this._text, this);
		this._textW = data.tw;
		this._textH = data.th;
		
		if(data.rw != this._rwidth || data.rh != this._rheight) 
		{
			gl.deleteTexture(this._texture);
			this._texture = gl.createTexture();
		}
		Stage._setTEX(this._texture);
		
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 
						data.rw, data.rh, 0, gl.RGBA, 
						gl.UNSIGNED_BYTE, data.ui8buff);	
		//gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.imageData);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);  
		
		gl.generateMipmap(gl.TEXTURE_2D); 
		
		this._rwidth = data.rw;
		this._rheight = data.rh;
		
		var sx = w / data.rw;
		var sy = h / data.rh;
		
		var ta = this._tcArray;
		ta[2] = ta[6] = sx;
		ta[5] = ta[7] = sy;
		
		Stage._setBF(this._tcBuffer);
		gl.vertexAttribPointer(Stage._main._sprg.tca, 2, gl.FLOAT, false, 0, 0);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, ta);
		
		var fa = this._fArray;
		fa[3] = fa[9] = w;
		fa[7] = fa[10] = h;
		Stage._setBF(this._vBuffer);
		gl.vertexAttribPointer(Stage._main._sprg.vpa, 3, gl.FLOAT, false, 0, 0);
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, fa);
	}

	TextField.prototype._render = function(st)
	{
		if(this._areaW == 0 || this._areaH == 0) return;
		
		gl.uniformMatrix4fv(st._sprg.tMatUniform, false, st._mstack.top());
		st._cmstack.update();
		
		Stage._setVC(this._vBuffer);
		Stage._setTC(this._tcBuffer);
		Stage._setUT(1);
		Stage._setTEX(this._texture);
		Stage._setEBF(st._unitIBuffer);
		
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
	}
	
	this.tp = TextField.prototype;
	tp.ds = tp.__defineSetter__;
	tp.dg = tp.__defineGetter__;
	
	tp.dg("textWidth" , function(){return this._textW;});
	tp.dg("textHeight", function(){return this._textH;});
	
	tp.ds("wordWrap", function(x){this._wordWrap = x; this._update();});
	tp.dg("wordWrap", function( ){return this._wordWrap;});
	
	tp.ds("width" , function(x){this._areaW = Math.max(0,x); this._tarea.style.width = this._areaW+"px"; this._update();});
	tp.dg("width" , function( ){return this._areaW;});
	
	tp.ds("height", function(x){this._areaH = Math.max(0,x); this._tarea.style.height = this._areaH+"px"; this._update();});
	tp.dg("height", function( ){return this._areaH;});
	
	tp.ds("text", function(x){this._text = x+""; this._update();});
	tp.dg("text", function( ){return this._text;});
	
	tp.ds("selectable", function(x){this._selectable = x; this._update();});
	tp.dg("selectable", function( ){return this._selectable;});
	
	tp.ds("type", function(x){this._type = x; this._update();});
	tp.dg("type", function( ){return this._type;});
	
	tp.ds("background", function(x){this._background = x; this._update();});
	tp.dg("background", function( ){return this._background;});
	
	tp.ds("border", function(x){this._border = x; this._update();});
	tp.dg("border", function( ){return this._border;});
	
	delete(tp.ds);
	delete(tp.dg);
	delete(this.tp);
	

