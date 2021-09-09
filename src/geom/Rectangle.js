	//package net.ivank.geom;

	/**
	 * A basic class for representing an axis-aligned rectangle
	 * @author Ivan Kuckir
	 *
	 */
	 
	/**
	 * @constructor
	 */	
	function Rectangle(x, y, w, h)
	{	
		if(!x) x = 0;
		if(!y) y = 0;
		if(!w) w = 0;
		if(!h) h = 0;
		this.x = x;
		this.y = y;
		this.width = w;
		this.height = h;		
	}
		
	Rectangle.prototype.clone = function()
	{
		return new Rectangle(this.x, this.y, this.width, this.height);
	}
		
	Rectangle.prototype.contains = function(x, y)
	{
		return (x >= this.x && x <= this.x+this.width) && (y >= this.y && y <= this.y+this.height);
	}
	
	Rectangle.prototype.containsPoint = function(p)
	{
		return this.contains(p.x, p.y);
	}
	
	Rectangle.prototype.containsRect = function(r)
	{
		return (this.x<=r.x && this.y<=r.y && r.x+r.width<=this.x+this.width && r.y+r.height<=this.y+this.height);
	}
	
	Rectangle.prototype.copyFrom = function(r)
	{
		this.x = r.x; this.y = r.y; this.width = r.width; this.height = r.height;
	}
	
	Rectangle.prototype.equals = function(r)
	{
		return(this.x==r.x && this.y==r.y && this.width==r.width && this.height == r.height);
	}
	
	Rectangle.prototype.inflate = function(dx, dy)
	{
		this.x -= dx;
		this.y -= dy;
		this.width  += 2*dx;
		this.height += 2*dy;
	}
	
	Rectangle.prototype.inflatePoint = function(p)
	{
		this.inflate(p.x, p.y);
	}
	
	Rectangle.prototype.intersection = function(rec)	// : Boolean
	{
		var l = Math.max(this.x, rec.x);
		var u = Math.max(this.y, rec.y);
		var r = Math.min(this.x+this.width , rec.x+rec.width );
		var d = Math.min(this.y+this.height, rec.y+rec.height);
		if(r<l || d<u) return new Rectangle();
		else return new Rectangle(l, u, r-l, d-u);
	}
	
	Rectangle.prototype.intersects = function(r)	// : Boolean
	{
		if(r.y+r.height<this.y || r.x>this.x+this.width || r.y>this.y+this.height || r.x+r.width<this.x) return false;
		return true;
	}
	
	Rectangle.prototype.isEmpty = function()	
	{
		return (this.width<=0 || this.height <= 0);
	}
	
	Rectangle.prototype.offset = function(dx, dy)	
	{
		this.x += dx; this.y += dy;
	}
	
	Rectangle.prototype.offsetPoint = function(p)	
	{
		this.offset(p.x, p.y)
	}
	
	Rectangle.prototype.setEmpty = function()	
	{
		this.x = this.y = this.width = this.height = 0;
	}
	
	Rectangle.prototype.setTo = function(x, y, w, h)	
	{
		this.x = x; this.y = y; this.width = w; this.height = h;
	}
		
	Rectangle.prototype.union = function(r)	// : Rectangle
	{
		if(this.isEmpty()) return r.clone();
		if(r.isEmpty()) return this.clone();
		var nr = this.clone();
		nr._unionWith(r);
		return nr;
	}

	
	Rectangle._temp = new Float32Array(2);
	
	Rectangle.prototype._unionWith = function(r) // : void
	{
		if(r.isEmpty()) return;
		if(this.isEmpty()) { this.copyFrom(r); return; }
		this._unionWP(r.x, r.y);
		this._unionWP(r.x+r.width, r.y+r.height);
	}
	
	Rectangle.prototype._unionWP = function(x, y)	// union with point
	{
		var minx = Math.min(this.x, x);
		var miny = Math.min(this.y, y);
		this.width  = Math.max(this.x + this.width , x) - minx;
		this.height = Math.max(this.y + this.height, y) - miny;
		this.x = minx; this.y = miny;
	}
	
	Rectangle.prototype._unionWL = function(x0,y0,x1,y1)	// union with point
	{
		if(this.width==0 && this.height==0) this._setP(x0,y0);
		else  this._unionWP(x0,y0);
		this._unionWP(x1,y1);
	}
	
	
	Rectangle.prototype._setP = function(x, y)
	{
		this.x = x; this.y = y;
		this.width = this.height = 0;
	}