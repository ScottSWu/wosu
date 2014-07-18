WOsu.StoryboardEvent = function(line,link,comp) {
	this.parseParts = null;
	
	this.eventType = 0;
	this.compound = false;
	this.easing = 0;
	this.startTime = 0;
	this.endTime = 0;
	this.loopLink = -1;
	this.loopStartTime = -1;
	this.loopEndTime = -1;
	this.startX = 0;
	this.startY = 0;
	this.startZ = 0;
	this.endX = 0;
	this.endY = 0;
	this.endZ = 0;
	
	this.parseStoryboardEvent(line,link,comp);
}

WOsu.StoryboardEvent.prototype.constructor = WOsu.StoryboardEvent;

WOsu.StoryboardEvent.prototype.parseStoryboardEvent = function(line,link,comp) {
	this.parseParts = line.split(",");
	
	if (link!==undefined && link!=null) this.loopLink = link;
	if (comp!==undefined && comp!=null) this.compound = comp;
	
	if (this.parseParts[0]=="L") {
		this.eventType = WOsu.StoryboardEvent.TYPE_L;
		this.startTime = parseInt(this.parseParts[1]);
		this.loopStartTime = -1;
		this.loopEndTime = -1;
		this.startX = parseInt(this.parseParts[2]);
	}
	else if (this.parseParts[0]=="T") {
		this.eventType = WOsu.StoryboardEvent.TYPE_T;
	}
	else {
		this.easing = parseInt(this.parseParts[1]);
		this.startTime = parseInt(this.parseParts[2]);
		if (this.parseParts[3]=="") this.endTime = this.startTime;
		else this.endTime = parseInt(this.parseParts[3]);
		
		if (this.parseParts[0]=="F") {
			this.eventType = WOsu.StoryboardEvent.TYPE_F;
			this.startX = parseFloat(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endX = parseFloat(this.parseParts[5]);
			}
			else {
				this.endX = this.startX;
			}
		}
		else if (this.parseParts[0]=="M") {
			this.eventType = WOsu.StoryboardEvent.TYPE_M;
			this.startX = parseInt(this.parseParts[4]);
			this.startY = parseInt(this.parseParts[5]);
			if (this.parseParts.length>6) {
				this.endX = parseInt(this.parseParts[6]);
				this.endY = parseInt(this.parseParts[7]);
			}
			else {
				this.endX = this.startX;
				this.endY = this.startY;
			}
		}
		else if (this.parseParts[0]=="MX") {
			this.eventType = WOsu.StoryboardEvent.TYPE_MX;
			this.startX = parseInt(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endX = parseInt(this.parseParts[5]);
			}
			else {
				this.endX = this.startX;
			}
		}
		else if (this.parseParts[0]=="MY") {
			this.eventType = WOsu.StoryboardEvent.TYPE_MY;
			this.startY = parseInt(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endY = parseInt(this.parseParts[5]);
			}
			else {
				this.endY = this.startY;
			}
		}
		else if (this.parseParts[0]=="S") {
			this.eventType = WOsu.StoryboardEvent.TYPE_S;
			this.startX = parseFloat(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endX = parseFloat(this.parseParts[5]);
			}
			else {
				this.endX = this.startX;
			}
		}
		else if (this.parseParts[0]=="V") {
			this.eventType = WOsu.StoryboardEvent.TYPE_V;
			this.startX = parseFloat(this.parseParts[4]);
			this.startY = parseFloat(this.parseParts[5]);
			if (this.parseParts.length>6) {
				this.endX = parseFloat(this.parseParts[6]);
				this.endY = parseFloat(this.parseParts[7]);
			}
			else {
				this.endX = this.startX;
				this.endY = this.startY;
			}
		}
		else if (this.parseParts[0]=="R") {
			this.eventType = WOsu.StoryboardEvent.TYPE_R;
			this.startX = parseFloat(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endX = parseFloat(this.parseParts[5]);
			}
			else {
				this.endX = this.startX;
			}
		}
		else if (this.parseParts[0]=="C") {
			this.eventType = WOsu.StoryboardEvent.TYPE_C;
			this.startX = parseInt(this.parseParts[4]);
			this.startY = parseInt(this.parseParts[5]);
			this.startZ = parseInt(this.parseParts[6]);
			if (this.parseParts.length>7) {
				this.endX = parseInt(this.parseParts[6]);
				this.endY = parseInt(this.parseParts[7]);
				this.endZ = parseInt(this.parseParts[8]);
			}
			else {
				this.endX = this.startX;
				this.endY = this.startY;
				this.endZ = this.startZ;
			}
		}
		else if (this.parseParts[0]=="P") {
			this.eventType = WOsu.StoryboardEvent.TYPE_P;
			if (this.parseParts[4][0]=="H") {
				this.startX = 0;
			}
			else if (this.parseParts[4][0]=="V") {
				this.startX = 1;
			}
			else if (this.parseParts[4][0]=="A") {
				this.startX = 2;
			}
		}
	}
}

WOsu.StoryboardEvent.prototype.isInstant = function() { return this.startTime==this.endTime; }

WOsu.StoryboardEvent.TYPE_F		= 0;
WOsu.StoryboardEvent.TYPE_M		= 1;
WOsu.StoryboardEvent.TYPE_MX	= 2;
WOsu.StoryboardEvent.TYPE_MY	= 3;
WOsu.StoryboardEvent.TYPE_S		= 4;
WOsu.StoryboardEvent.TYPE_V		= 5;
WOsu.StoryboardEvent.TYPE_R		= 6;
WOsu.StoryboardEvent.TYPE_C		= 7;
WOsu.StoryboardEvent.TYPE_P		= 8;
WOsu.StoryboardEvent.TYPE_L		= 9;
WOsu.StoryboardEvent.TYPE_T		= 10;