WOsu.SliderObject = function(map,line) {
	WOsu.HitObject.call(this,map,line);
	
	this.controlX = new Array(0); // Control X coordinates of the slider
	this.controlY = new Array(0); // Control Y coordinates of the slider
	this.repeats = 0; // Repeats
	this.curveX = new Array(0); // Generated curve point X coordinates
	this.curveY = new Array(0); // Generated curve point Y coordinates
	this.sliderSpeed = 0; // Slider speed (osupixels)
	this.sliderLength = 0; // Slider length (pixels)
	this.sliderHitsounds = new Array(0); // Slider hit sounds
	this.endX = 0; // End X coordinate
	this.endY = 0; // End Y coordinate
	this.sliderTime = 0;
	
	this.parseSliderObject(line);
}

WOsu.SliderObject.prototype = Object.create( WOsu.HitObject.prototype );

WOsu.SliderObject.prototype.parseSliderObject = function(line) {
	this.parse(line);
	
	var points = this.parseParts[5].split("|");
	var lastX = this.x,lastY = this.y;
	var nextX,nextY;
	for (var i=1; i<points.length; i++) {
		nextX = parseInt(points[i].substring(0,points[i].indexOf(":")));
		nextY = parseInt(points[i].substring(points[i].indexOf(":")+1));
		
		this.controlX.push(nextX);
		this.controlY.push(nextY);
		
		this.sliderLength += Math.sqrt(Math.pow(nextX-lastX,2) + Math.pow(nextY-lastY,2));
		
		lastX = nextX;
		lastY = nextY;
	}
	this.controlX.unshift(this.x);
	this.controlY.unshift(this.y);
	
	this.repeats = parseInt(this.parseParts[6]);
	this.sliderSpeed = parseFloat(this.parseParts[7]);
	if (this.parseParts.length>8) {
		points = this.parseParts[8].split("\\|");
		for (var i=0; i<points.length; i++) {
			this.sliderHitsounds.push(parseInt(points[i]));
		}
	}
	
	this.endX = this.controlX[this.controlX.length-1];
	this.endY = this.controlY[this.controlY.length-1];
	
	var currentTiming = 0;
	var tp = this.map.BeatmapEvents.TimingPoints;
	var multiplier = this.map.BeatmapData.SliderMultiplier;
	while (currentTiming<tp.length-1 && tp[currentTiming+1].time<=this.time) currentTiming++;
	this.endTime = this.sliderSpeed/multiplier/100 * tp[currentTiming].bpm * this.repeats + this.time;
	this.sliderTime = this.endTime - this.time;
}

WOsu.SliderObject.prototype.generateBezier = function() {
	var max = ~~(this.sliderLength/5);
	
	this.curveX = new Array(max+1);
	this.curveY = new Array(max+1);
	
	var t,degree,pointX,pointY;
	for (var i=0; i<=max; i++) {
		t = i/max;
		pointX = this.controlX.slice(0);
		pointY = this.controlY.slice(0);
		degree = this.controlX.length;
		while (degree>1) {
			for (var j=0; j<degree-1; j++) {
				pointX[j] = pointX[j]*(1-t) + pointX[j+1]*t;
				pointY[j] = pointY[j]*(1-t) + pointY[j+1]*t;
			}
			degree--;
		}
		this.curveX[i] = pointX[0];
		this.curveY[i] = pointY[0];
	}
}

WOsu.SliderObject.prototype.getPosition = function(time) {
	var partial = 0;
	if (this.sliderTime>0) partial = (time - this.time)/this.sliderTime;
	partial = (partial * this.repeats) % 2;
	
	if (partial>1) {
		partial = 2 - partial;
	}
	
	var index;
	var t = partial * this.curveX.length - (index = ~~(partial * this.curveX.length));
	var next = index + 1;
	if (index<0) index = 0; else if (index>=this.curveX.length) index = this.curveX.length-1;
	if (next<0) next = 0; else if (next>=this.curveX.length) next = this.curveX.length-1;
	
	return [ this.curveX[index]*(1-t) + this.curveX[next]*t , this.curveY[index]*(1-t) + this.curveY[next]*t ];
}