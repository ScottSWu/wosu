WOsu.ColourEvent = function(line) {
	WOsu.Event.call(this,line);
	
	this.r = 255;
	this.g = 255;
	this.b = 255;
	
	this.parseColourEvent(line);
}

WOsu.ColourEvent.prototype = Object.create( WOsu.Event.prototype );

WOsu.ColourEvent.prototype.parseColourEvent = function(line) {
	this.parse(line);
	
	this.r = parseInt(this.parseParts[2]);
	this.g = parseInt(this.parseParts[3]);
	this.b = parseInt(this.parseParts[4]);
}