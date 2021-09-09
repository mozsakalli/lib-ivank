
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