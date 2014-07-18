WOsu.Event = function(line) {
	this.parseParts = null;
	
	this.type = 0;
	this.time = 0;
	
	this.parse(line);
}

WOsu.Event.prototype.constructor = WOsu.Event;

WOsu.Event.prototype.parse = function(line) {
	this.parseParts = line.split(",");
	
	if (!isNaN(parseInt(this.parseParts[0]))) {
		this.type = parseInt(this.parseParts[0]);
		this.time = parseInt(this.parseParts[1]);
	}
	else {
		if (this.parseParts[0].startsWith("Video")) {
			this.type = WOsu.Event.TYPE_VIDEO;
			this.time = parseInt(this.parseParts[1]);
		}
		else if (this.parseParts[0].startsWith("Sprite")) {
			this.type = WOsu.Event.TYPE_SPRITE;
		}
		else if (this.parseParts[0].startsWith("Animation")) {
			this.type = WOsu.Event.TYPE_ANIMATION;
		}
	}
}

WOsu.Event.TYPE_BACKGROUND		= 0;
WOsu.Event.TYPE_VIDEO			= 1;
WOsu.Event.TYPE_BREAKPERIOD		= 2;
WOsu.Event.TYPE_COLORTRANSFORM	= 3;
WOsu.Event.TYPE_SPRITE			= 4;
WOsu.Event.TYPE_ANIMATION		= 5;
