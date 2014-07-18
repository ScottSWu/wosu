WOsu.StoryboardObject = function(line) {
	WOsu.Event.call(this,line);
	
	this.startTime = 0;
	this.endTime = 0;
	this.layer = 0;
	this.origin = 0;
	this.filePath = "";
	this.x = 0;
	this.y = 0;
	this.offsetX = 0;
	this.offsetY = 0;
	this.frameCount = 0;
	this.frameDelay = 0;
	this.loopType = 0;
	this.events = new Array(0);
	this.hasCompound = false;
	
	this.fade = 1;
	this.scaleX = 1;
	this.scaleY = 1;
	this.rotation = 0;
	this.r = 1;
	this.g = 1;
	this.b = 1;
	this.parameterH = false;
	this.parameterV = false;
	this.parameterA = false;
	
	this.parseStoryboardObject(line);
}

WOsu.StoryboardObject.prototype = Object.create( WOsu.Event.prototype );

WOsu.StoryboardObject.prototype.clone = function() {
	var original = this;
	clone = {};
	for (var i in original) {
		clone[i] = original[i];
	}
	return clone;
}

WOsu.StoryboardObject.prototype.parseStoryboardObject = function(line) {
	this.parse(line);
	
	if (this.parseParts[1]=="Background") {
		this.layer = 0;
	}
	else if (this.parseParts[1]=="Fail") {
		this.layer = 1;
	}
	else if (this.parseParts[1]=="Pass") {
		this.layer = 2;
	}
	else if (this.parseParts[1]=="Foreground") {
		this.layer = 3;
	}
	else {
		this.layer = parseInt(this.parseParts[1]);
		if (isNaN(this.layer)) this.layer = 0;
	}
	
	if (this.parseParts[2]=="TopLeft") {
		this.origin = 0;
	}
	else if (this.parseParts[2]=="TopCentre") {
		this.origin = 1;
	}
	else if (this.parseParts[2]=="TopRight") {
		this.origin = 2;
	}
	else if (this.parseParts[2]=="CentreLeft") {
		this.origin = 3;
	}
	else if (this.parseParts[2]=="Centre") {
		this.origin = 4;
	}
	else if (this.parseParts[2]=="CentreRight") {
		this.origin = 5;
	}
	else if (this.parseParts[2]=="BottomLeft") {
		this.origin = 6;
	}
	else if (this.parseParts[2]=="BottomCentre") {
		this.origin = 7;
	}
	else if (this.parseParts[2]=="BottomRight") {
		this.origin = 8;
	}
	else {
		this.origin = parseInt(this.parseParts[2]);
		if (isNaN(this.origin)) {
			this.origin = 0;
		}
	}
	
	this.filepath = this.parseParts[3].replace(/\"/g,"").replace(/\\/g,"/");
	this.x = parseInt(this.parseParts[4]);
	this.y = parseInt(this.parseParts[5]);
	
	if (this.type==WOsu.Event.TYPE_ANIMATION) {
		this.frameCount = parseInt(this.parseParts[6]);
		this.frameDelay = parseInt(this.parseParts[7]);
		if (this.parseParts[8]=="LoopForever") {
			this.loopType = 0;
		}
		else if (this.parseParts[8]=="LoopOnce") {
			this.loopType = 1;
		}
		else {
			this.loopType = parseInt(this.parseParts[8]);
			if (isNaN(this.loopType)) this.loopType = 1;
		}
	}
}

WOsu.StoryboardObject.prototype.isVisible = function(time) {
	if (time>this.endTime || time<this.startTime) return false;
	return true;
	
	/*
	var relativeTime;
	if (this.time>this.endTime) return false;
	for (var i=this.events.length-1; i>=0; i--) {
		if (!this.events[i].compound) {
			if (this.events[i].type==WOsu.StoryboardEvent.TYPE_L) {
				if (this.time>this.events[i].endTime) return false;
				else if (this.time>=this.events[i].startTime+this.events[i].loopStartTime) return true;
			}
			else {
				if (this.events[i].startTime<=this.time) {
					return true;
				}
			}
		}
	}
	return false;
	*/
}

WOsu.StoryboardObject.prototype.addCommand = function(line) {
	var event,newEvent;
	if (line.startsWith("  ")) {
		for (var i=this.events.length-1; i>=0; i--) {
			event = this.events[i];
			if (event.eventType==WOsu.StoryboardEvent.TYPE_L || event.eventType==WOsu.StoryboardEvent.TYPE_T) {
				this.hasCompound = true;
				newEvent = new WOsu.StoryboardEvent(line.substring(2),i,true);
				this.events.push(newEvent);
				event.endX = this.events.length-1;
				if (event.loopStartTime==-1 || newEvent.startTime<event.loopStartTime) {
					event.loopStartTime = newEvent.startTime;
				}
				if (event.loopEndTime==-1 || newEvent.endTime>event.loopEndTime) {
					event.loopEndTime = newEvent.endTime;
					event.endTime = event.startTime + event.loopStartTime + (newEvent.endTime-event.loopStartTime)*event.startX;
				}
				break;
			}
		}
	}
	else {
		this.events.push(new WOsu.StoryboardEvent(line.substring(1)));
	}
}

WOsu.StoryboardObject.prototype.getImageFile = function(n) {
	if (this.type==WOsu.Event.TYPE_SPRITE) {
		return this.filepath;
	}
	else if (this.type==WOsu.Event.TYPE_ANIMATION) {
		return this.filepath.substring(0,this.filepath.lastIndexOf(".")) + n + this.filepath.substring(this.filepath.lastIndexOf("."));
	}
	return this.filepath;
}

WOsu.StoryboardObject.prototype.getNumberImages = function() {
	if (this.type==WOsu.Event.TYPE_SPRITE) {
		return 1;
	}
	else if (this.type==WOsu.Event.TYPE_ANIMATION) {
		return this.frameCount;
	}
	return this.frameCount;
}
