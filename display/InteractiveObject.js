
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