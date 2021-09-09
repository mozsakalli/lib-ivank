

	/*
		There are 3 states in the game
		
		
		1. MainMenu		2. LevelSelect		3.GameControl
													|
													Game
	*/
	function Main(wi, hi)
	{
		Resizable.call(this, wi, hi);
		this.mm;
		this.ls;
		this.gc;
		
		this.addEventListener2("GoPlay",		Main.GoPlay		 , this	);		// 1 -> 2
		this.addEventListener2("GoBack",		Main.GoBack		 , this	);		// 2 -> 1		
		this.addEventListener2("LevelChosen", 	Main.LevelChosen , this	);		// 2 -> 3
		this.addEventListener2("GameDone", 		Main.GameDone	 , this	);		// 3 -> 2 when finished
		this.addEventListener2("ExitGame",		Main.ExitGame	 , this	);		// 3 -> 2 when exiting a game
		
		this.addEventListener2(Event.ADDED_TO_STAGE, this.onATS, this);
	}	
	Main.prototype = new Resizable();
	
	Main.prototype.onATS = function(e)
	{
		this.stage.addEventListener2(Event.RESIZE, this.resize, this);
		this.resize(null);
	}

	Main.prototype.resize = function(e)
	{
		var wi = this.stage.stageWidth;
		var hi = this.stage.stageHeight;
		this.w = wi;  this.h = hi;
		if(this.mm) this.mm.resize(wi, hi);
		if(this.ls) this.ls.resize(wi, hi);
		if(this.gc) this.gc.resize(wi, hi);
	}
	
	Main.GoPlay = function(e)
	{
		this.removeChild(this.mm);
		this.addChild(this.ls);
	}
	
	Main.GoBack = function(e)
	{
		this.removeChild(this.ls);
		this.addChild(this.mm);
	}
	
	Main.LevelChosen = function(e)
	{
		this.removeChild(this.ls);
		this.addChild(this.gc);
		this.gc.StartLevel(this.ls.levelData);
	}
	
	Main.GameDone = function(e)
	{
		var th = e.target;
		this.removeChild(this.gc);
		this.addChild(this.ls);
		this.ls.LevelDone(this.gc.result);
	}
	
	Main.ExitGame = function(e)
	{
		var th = e.target;
		this.removeChild(this.gc);
		this.addChild(this.ls);
	}
	