
	function MarginCont(size, margin)
	{
		Resizable.call(this);
		
		this.size = size;
		this.MARGIN = margin;
		
		this.w = 1;
		this.h = 1;
		
		//	0 --- 1
		//  |     |
		//  2 --- 3
		
		this.items = [[], [], [], []];
		this.cont = new Sprite();
		this.addChild(this.cont);
	}
	MarginCont.prototype = new Resizable();
	
	MarginCont.prototype.resize = function(wi, hi)
	{
		this.w = wi;  this.h = hi;
		var min = Math.min(wi, hi);
		this.cont.scaleX = this.cont.scaleY = min / this.size;
		
		var cw = wi / this.cont.scaleX;
		var ch = hi / this.cont.scaleX;
		
		for(var i=0; i<this.items[0].length; i++)
		{
			var it = this.items[0][i];
			var pit = this.items[0][i-1];
			it.x = this.MARGIN;
			if(i==0) it.y = this.MARGIN;
			else it.y = pit.y + pit.height + this.MARGIN;
		}
		
		for(var i=0; i<this.items[1].length; i++)
		{
			var it = this.items[1][i];
			var pit = this.items[1][i-1];
			it.x = cw - it.width - this.MARGIN;
			if(i==0) it.y = this.MARGIN;
			else it.y = pit.y + pit.height + this.MARGIN;
		}
		
		for(var i=0; i<this.items[2].length; i++)
		{
			var it = this.items[2][i];
			var pit = this.items[2][i-1];
			it.x = this.MARGIN;
			if(i==0) it.y = ch - it.height - this.MARGIN;
			else  it.y = pit.y - it.height - this.MARGIN;
		}
		
		for(var i=0; i<this.items[3].length; i++)
		{
			var it = this.items[3][i];
			var pit = this.items[3][i-1];
			it.x = cw - it.width - this.MARGIN;
			if(i==0) it.y = ch - it.height - this.MARGIN;
			else  it.y = pit.y - it.height - this.MARGIN;
		}
	}
	
	MarginCont.prototype.add = function(item, pos)
	{
		this.items[pos].push(item);
		this.cont.addChild(item);
		this.resize(this.w, this.h);
	}
	
	MarginCont.prototype.remove = function(item, pos)
	{
		if(this.items[pos].indexOf(item)==-1) throw "no such item in container";
		this.items[pos].splice(this.items[pos].indexOf(item), 1);
		this.cont.removeChild(item);
		this.resize(this.w, this.h);
	}
	
	
	
	