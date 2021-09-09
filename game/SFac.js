
	var SFac = new EventDispatcher();
	
	SFac._bds = {};
	SFac._toload = 0;
	SFac._loaded = 0;
	
	SFac.load = function(key, url, sprite)
	{
		if(SFac._bds[key]!=null) throw "Sound with key \"" + key + "\" already exists!";
		
		var sobj = { urls:[url], onload: SFac._rloaded };
		if(sprite)  sobj.sprite = sprite;
		
		var sound = new Howl(sobj);
		SFac._bds[key] = sound;
		
		SFac._toload ++;
	}
	
	SFac._rloaded = function(e)
	{
		SFac._loaded++;
		if(SFac._toload == SFac._loaded) SFac.dispatchEvent(new Event(Event.COMPLETE));
	}
	
	SFac.play     = function(key) { SFac._play(key, true ); }
	SFac.playOnce = function(key) { SFac._play(key, false); }
	
	SFac._play = function(key, loop) 
	{  
		var pts = key.split(":");
		if(SFac._bds[pts[0]]==null) throw "No Sound with key \""+pts[0]+"\"!";  
		
		 SFac._bds[pts[0]].loop = loop
		if(pts[1]) SFac._bds[pts[0]].play(pts[1]);
		else SFac._bds[pts[0]].play();
	}
	
	SFac.stop = function(key)
	{
		if(SFac._bds[key]==null) throw "No Sound with key \""+key+"\"!"; 
		SFac._bds[key].stop();
	}
	
	