
	var BDFac = new EventDispatcher();
	
	BDFac._bds = {};
	BDFac._urls = {};
	BDFac._toload = 0;
	BDFac._loaded = 0;
	
	BDFac.load = function(key, url)
	{
		if(BDFac._urls[key]!=null) return;	// don't load same key - url pair for the second time
		if(BDFac._bds [key]!=null) throw "BitmapData with key \"" + key + "\" already exists!";
		
		var bd = new BitmapData(url);
		BDFac._bds[key] = bd;
		BDFac._urls[key] = url;
		bd.loader.addEventListener(Event.COMPLETE, BDFac._bdLoaded);
		BDFac._toload ++;
	}
	
	BDFac.get = function(key) {  if(BDFac._bds[key]==null) throw "No BitmapData with key \""+key+"\"!";  return BDFac._bds[key];  }
	
	BDFac._bdLoaded = function(e)
	{
		BDFac._loaded++;
		if(BDFac._toload == BDFac._loaded) BDFac.dispatchEvent(new Event(Event.COMPLETE));
	}