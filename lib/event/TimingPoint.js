WOsu.TimingPoint = function(parent,line) {
	this.parseParts = null;
	
	this.map = parent;
	this.time = 0;
	this.bpm = 0;	// This is actually like milliseconds per beat or something.
					// Removes the need to divide when calculating slider speeds.
	this.meter = 4;
	this.sampletype = 0;
	this.sampleset = 0;
	this.volume = 0;
	this.inherited = false;
	this.negativeBPM = false;
	this.ki = false;
	
	this.parse(line);
}

WOsu.TimingPoint.prototype.constructor = WOsu.TimingPoint;

WOsu.TimingPoint.prototype.parse = function(line) {
	this.parseParts = line.split(",");
	
	this.time = parseInt(this.parseParts[0]);
	this.bpm = parseFloat(this.parseParts[1]);
	this.meter = parseInt(this.parseParts[2]);
	this.sampletype = parseInt(this.parseParts[3]);
	this.sampleset = parseInt(this.parseParts[4]);
	this.volume = parseFloat(this.parseParts[5]);
	this.inherited = (this.parseParts[6]=="0") ? true : false;
	this.ki = (this.parseParts[7]=="0") ? true : false;
	
	if (this.bpm<0) {
		this.negativeBPM = true;
		var tp = this.map.BeatmapEvents.TimingPoints;
		for (var i=tp.length-1; i>=0; i--) {
			if (!tp[i].negativeBPM && tp[i].time<=this.time) {
				this.bpm = -this.bpm/100.0 * tp[i].bpm;
				break;
			}
		}
	}
}