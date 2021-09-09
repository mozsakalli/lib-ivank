
	var TextFormatAlign = 
	{
		LEFT	: "left",
		CENTER	: "center",
		RIGHT	: "right",
		JUSTIFY	: "justify"
	}
			/**
		 * A constructor of text format
		 * @param f		URL of font
		 * @param s		size of text
		 * @param c		color of text
		 */
		 
	function TextFormat(f, s, c, b, i, a, l)
	{
		/* public */
		this.font	= f?f:"Times New Roman";
		this.size	= s?s:12;
		this.color	= c?c:0x000000;
		this.bold	= b?b:false;
		this.italic	= i?i:false;
		this.align	= a?a:TextFormatAlign.LEFT;
		this.leading= l?l:0;
		
		this.maxW = 0;
		this.data = {image:null, tw:0, th:0, rw:0, rh:0};	// image, text width/height, real width/height
	}
	
	TextFormat.prototype.clone = function()
	{
		return (new TextFormat(this.font, this.size, this.color, this.bold, this.italic, this.align, this.leading));
	}
	
	TextFormat.prototype.set = function(tf)
	{
		this.font = tf.font;
		this.size = tf.size;
		this.color = tf.color;
		this.bold = tf.bold;
		this.italic = tf.italic;
		this.align = tf.align;
		this.leading = tf.leading;
	}
	
	/*
		metrics = 	// for each line
		[
			{	
				x, y, width, height,
				charOffset  // int
				words =  // for each word
				[
					{
						x, y, width, height
						word // String
					}
					, ...
				]
			}
			, ...
		]
	*/
	TextFormat.prototype.setContext = function(ctx)
	{
		var c = this.color;
		var r = (c>>16 & 0x0000ff);
		var g = (c>>8 & 0x0000ff);
		var b = (c & 0x0000ff);
		
		ctx.textBaseline = "top";
		ctx.fillStyle = ctx.strokeStyle = "rgb("+r+","+g+","+b+")";
		ctx.font = (this.italic?"italic ":"")+(this.bold?"bold ":"")+this.size+"px "+this.font;
	}
	
	TextFormat.prototype.getImageData = function(s, tf)	// string, TextField - read only
	{
		var canv = TextFormat._canvas;
		var ctx = TextFormat._ctxext;
		var data = this.data;
		
		canv.width	= data.rw = this._nhpt(tf._areaW); //console.log(tf._areaW, canv.width);
		canv.height	= data.rh = this._nhpt(tf._areaH); //console.log(tf._areaH, canv.height);
	
		if(tf._background)
		{
			//console.log("has background");
			ctx.fillStyle="rgba(255,255,255,1)";
			ctx.fillRect(0,0,tf._areaW,tf._areaH);
		}
		if(tf._border)
		{
			ctx.strokeStyle = "rgb(0,0,0)";
			ctx.beginPath();
			//ctx.moveTo(Math.round(b0.x)+0.5, b0.y);
			//ctx.lineTo(Math.round(b0.x)+0.5, b0.y+b0.height);
			
			ctx.rect(0.5,0.5,tf._areaW-1,tf._areaH-1);
			ctx.stroke();
		}
		
		
		this.setContext(ctx);
	
		var metrics = [];
		this.maxW = 0;
		var pars = s.split("\n");
		var line = 0;
		var posY = 0;
		var lineH = this.size * 1.25;
		var coff = 0;	// character offset
		for(var i=0; i<pars.length; i++)
		{
			var lc = this.renderPar(pars[i], posY, lineH, ctx, tf, coff, metrics);
			line += lc;
			posY += lc *(lineH +this.leading);
			coff += pars[i].length + 1;
		}
		if(this.align == TextFormatAlign.JUSTIFY) this.maxW = Math.max(this.maxW, tf._areaW);
		
		data.tw = this.maxW;
		data.th = (lineH+this.leading)*line - this.leading;
		tf._metrics = metrics;
		
		if(tf._selectable && tf._select && tf._select.from < tf._select.to)
		{
			var sel = tf._select;
			var m = metrics;
			var l0 = tf.getLineIndexOfChar(sel.from);
			var l1 = tf.getLineIndexOfChar(sel.to-1);
			var b0 = tf.getCharBoundaries(sel.from);
			var b1 = tf.getCharBoundaries(sel.to-1);
			ctx.fillStyle="rgba(0,0,0,0.25)";
			if(l0 == l1) { ctx.fillRect(b0.x, b0.y, b1.x+b1.width-b0.x, b1.y+b1.height-b0.y); }
			else
			{
				ctx.fillRect(b0.x, b0.y, m[l0].x+m[l0].width-b0.x, m[l0].y+m[l0].height-b0.y);
				for(var l=l0+1; l<l1; l++) ctx.fillRect(m[l].x, m[l].y, m[l].width, m[l].height);
				ctx.fillRect(m[l1].x, m[l1].y, b1.x+b1.width-m[l1].x, b1.y+b1.height-m[l1].y);
			}
		}
		else if(tf._type=="input" && tf._curPos>-1)
		{
			var b0 = tf.getCharBoundaries(tf._curPos);
			ctx.beginPath();
			ctx.moveTo(Math.round(b0.x)+0.5, b0.y);
			ctx.lineTo(Math.round(b0.x)+0.5, b0.y+b0.height);
			ctx.stroke();
		}
		
		data.canvas = canv;
		var imgd = ctx.getImageData(0,0,data.rw,data.rh);
		
		
		if(window.CanvasPixelArray && imgd.data instanceof CanvasPixelArray)	// old standard, implemented in IE11
		{
			data.ui8buff = new Uint8Array(imgd.data);
		}
		else data.ui8buff = new Uint8Array(imgd.data.buffer);
		
		//var ui8buff = new Uint8Array(imgd.data);
		//data.ui8buff = ui8buff;
		
		return data;
	}
	
	TextFormat.prototype.renderPar = function(s, posY, lineH, ctx, tf, coff, metrics)	// returns number of lines
	{
		var words;
		if(tf._wordWrap) words = s.split(" ");
		else words = [s];
		
		var spacew = ctx.measureText(" ").width;
		var curlw = 0;			// current line width
		var maxlw = tf._areaW;	// maximum line width
		var cl = 0;				// current line
		
		var lines = [[]];		// array of lines , line = (arrays of words)
		var lspace = [];		// free line space
		
		for(var i=0; i<words.length; i++)
		{
			var word = words[i];
			var ww = ctx.measureText(word).width;
			if(curlw + ww <= maxlw || curlw == 0)
			{
				lines[cl].push(word);
				curlw += ww + spacew;
			}
			else
			{
				lspace.push(maxlw - curlw + spacew);
				lines.push([]);
				cl++;
				curlw = 0;
				i--;
			}
		}
		lspace.push(maxlw - curlw + spacew);
		
		for(var i=0; i<lines.length; i++)
		{
			var mline = { x:0,y:0,width:0,height:0, charOffset:coff, words:[] };
			mline.height = this.size*1.25+this.leading;
			var line = lines[i];
			//while(line[line.length-1] == "") {line.pop(); lspace[i] += spacew; }
			this.maxW = Math.max(this.maxW, maxlw-lspace[i]);
			
			var gap, lineY = posY + (lineH+this.leading)*i;
			curlw = 0, gap = spacew;
			if(this.align == TextFormatAlign.CENTER ) curlw = lspace[i]*0.5;
			if(this.align == TextFormatAlign.RIGHT  ) curlw = lspace[i];
			if(this.align == TextFormatAlign.JUSTIFY) gap = spacew+lspace[i]/(line.length-1);
			
			mline.x = curlw;
			mline.y = lineY;
			
			
			for(var j=0; j<line.length; j++)
			{
				var word = line[j];
				ctx.fillText(word, curlw, lineY);
				var ww = ctx.measureText(word).width;
				
				mline.words.push({x:curlw, y:lineY, width:ww, height:mline.height, charOffset:coff, word:word});
				
				if(i < lines.length-1) curlw += ww + gap;	// not last line
				else {curlw += ww + spacew;}		// last line
				coff += word.length+1;
			}
			
			mline.width = curlw-mline.x;
			if(i==lines.length-1) mline.width -= spacew;
			metrics.push(mline);
		}
		return cl+1;
	}
	
	TextFormat.prototype._nhpt = function(x) 
	{
		--x;
		for (var i = 1; i < 32; i <<= 1) x = x | x >> i;
		return x + 1;
	}
	
	TextFormat._canvas = document.createElement("canvas");
	TextFormat._ctxext = TextFormat._canvas.getContext("2d");
	
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
	

