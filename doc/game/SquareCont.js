
	function SquareCont(size)
	{
		Sprite.call(this);
		
		this.size = size;
		
		this.cont = new Sprite();
		this.addChild(this.cont);
	}
	SquareCont.prototype = new Resizable();
	
	SquareCont.prototype.resize = function(wi, hi)
	{
		this.w = wi;  this.h = hi;
		var min = Math.min(wi, hi);
		this.cont.scaleX = this.cont.scaleY = min / this.size;
		
		this.cont.x = (wi-min)/2;
		this.cont.y = (hi-min)/2;
	}
	
	SquareCont.prototype.add    = function(item)
	{
		this.cont.addChild(item);
	}
	SquareCont.prototype.remove = function(item)
	{
		this.cont.removeChild(item);
	}
	
	
	
	