
	function RectCont(sizeX, sizeY, spread)
	{
		Resizable.call(this);
		
		this.sizeX = sizeX;
		this.sizeY = sizeY;
		this.spread = (spread==null?false:spread);
		
		this.cont = new Sprite();
		this.addChild(this.cont);
	}
	RectCont.prototype = new Resizable();
	
	RectCont.prototype.resize = function(wi, hi)
	{
		this.w = wi;  this.h = hi;
		//var min = Math.min(wi, hi);
		var comp = this.spread ? Math.max : Math.min;
		this.cont.scaleX = this.cont.scaleY = comp( wi/this.sizeX, hi/this.sizeY);
		
		this.cont.x = (wi-this.sizeX*this.cont.scaleX)/2;
		this.cont.y = (hi-this.sizeY*this.cont.scaleY)/2;
	}
	
	RectCont.prototype.add    = function(item)
	{
		this.cont.addChild(item);
	}
	RectCont.prototype.remove = function(item)
	{
		this.cont.removeChild(item);
	}
	
	
	
	