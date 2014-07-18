WOsu.BreakPeriod = function(line) {
	WOsu.Event.call(this,line);
	
	this.endTime = 0;
	
	this.parseBreakPeriod(line);
}

WOsu.BreakPeriod.prototype = Object.create( WOsu.Event.prototype );

WOsu.BreakPeriod.prototype.parseBreakPeriod = function(line) {
	this.parse(line);
	
	this.endTime = parseInt(this.parseParts[2]);
}