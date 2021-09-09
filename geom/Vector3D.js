	//package net.ivank.geom;

	/**
	 * A class for representing a 2D Vector3D
	 * @author Ivan Kuckir
	 */
	 
	/**
	 * @constructor
	 */	
	function Vector3D(x, y, z, w)
	{		
		if(!x) x=0.0; if(!y) y=0.0; if(!z) z=0.0; if(!w) w=0.0;
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
	
	Vector3D.prototype.add   = function(p)
	{
		return new Vector3D(this.x+p.x, this.y+p.y, this.z+p.z, this.w+p.w);
	}

	Vector3D.prototype.clone = function()
	{
		return new Vector3D(this.x, this.y, this.z, this.w);
	}
	
	Vector3D.prototype.copyFrom = function(p)
	{
		this.x = p.x; this.y = p.y; this.z = p.z; this.w = p.w;
	}
	
	Vector3D.prototype.equals = function(p)
	{
		return (this.x == p.x && this.y == p.y && this.z == p.z);
	}
	
	Vector3D.prototype.normalize = function()
	{
		var l = Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
		this.x *= 1/l;
		this.y *= 1/l;
		this.z *= 1/l;
		return l;
	}

	Vector3D.prototype.setTo = function(xa, ya, za)
	{
		this.x = xa; this.y = ya; this.z = za;
	}
	
	Vector3D.prototype.subtract = function(p)
	{
		return new Vector3D(this.x-p.x, this.y-p.y, this.z-p.z, 0);
	}

	Vector3D.distance = function(a, b)
	{
		return Vector3D._distance(a.x, a.y, a.z, b.x, b.y, b.z);
	}
	
	Vector3D._distance = function(x1, y1, z1, x2, y2, z2)
	{
		return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1) + (z2-z1)*(z2-z1) );
	}

	
	