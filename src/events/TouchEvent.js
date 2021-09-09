//	package net.ivank.events;

function TouchEvent(type, bubbles)
{
	Event.call(this, type, bubbles);
	
	this.stageX = 0;
	this.stageY = 0;
	this.touchPointID = -1;
}
TouchEvent.prototype = new Event();

TouchEvent.prototype._setFromDom = function(t)
{
	var dpr = window.devicePixelRatio || 1;
	this.stageX = t.clientX*dpr;
	this.stageY = t.clientY*dpr;
	this.touchPointID = t.identifier;
}

TouchEvent.TOUCH_BEGIN  = "touchBegin";
TouchEvent.TOUCH_END    = "touchEnd";
TouchEvent.TOUCH_MOVE   = "touchMove";
TouchEvent.TOUCH_OUT    = "touchOut";
TouchEvent.TOUCH_OVER   = "touchOver";
//TouchEvent.TOUCH_ROLL_OUT = "touchRollOut";
//TouchEvent.TOUCH_ROLL_OVER = "touchRollOver";
TouchEvent.TOUCH_TAP = "touchTap";
