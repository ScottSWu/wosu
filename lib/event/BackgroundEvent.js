WOsu.BackgroundEvent = function(line) {
	WOsu.Event.call(this,line);
	
	this.media = "";
	
	this.parseBackgroundEvent(line);
}

WOsu.BackgroundEvent.prototype = Object.create( WOsu.Event.prototype );

WOsu.BackgroundEvent.prototype.parseBackgroundEvent = function(line) {
	this.parse(line);
	
	this.media = this.parseParts[2].replace(/\"/g,"").replace(/\\/g,"/");
}