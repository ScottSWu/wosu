WOsu.Beatmap = function() {
	this.BeatmapData      = new WOsu.BeatmapData();
	this.BeatmapEvents    = new WOsu.BeatmapEvents();
	this.BeatmapObjects   = new WOsu.BeatmapObjects();
	this.BeatmapMechanics = new WOsu.BeatmapMechanics();
	this.status           = "";
}

WOsu.Beatmap.prototype.constructor = WOsu.Beatmap;

WOsu.Beatmap.sectionKeys = [
	"HEADING",
	"GENERAL",
	"EDITOR",
	"METADATA",
	"DIFFICULTY",
	"EVENTS",
	"TIMINGPOINTS",
	"COLOURS",
	"HITOBJECTS",
	];

WOsu.Beatmap.stringKeys = [
	"AudioFilename","SampleSet",
	
	"Title","Artist","Creator","Version","Source","Tags",
	
	];
WOsu.Beatmap.arrayKeys = [
	
	"EditorBookmarks",
	
	
	];
WOsu.Beatmap.floatKeys = [
	"StackLeniency",
	
	
	"SliderMultiplier","SliderTickRate",
	];
WOsu.Beatmap.integerKeys = [
	"AudioLeadIn","PreviewTime","Mode",
	"BeatDivisor","GridSize",
	
	"HPDrainRate","CircleSize","OverallDifficulty","ApproachRate",
	];
WOsu.Beatmap.booleanKeys = [
	"Countdown","LetterboxInBreaks","StoryFireInFront",
	"DistanceSnap",
	
	
	];

WOsu.Beatmap.isStringKey  = function(key) { return WOsu.Beatmap.stringKeys.indexOf(key)>=0; }
WOsu.Beatmap.isArrayKey   = function(key) { return WOsu.Beatmap.arrayKeys.indexOf(key)>=0; }
WOsu.Beatmap.isFloatKey   = function(key) { return WOsu.Beatmap.floatKeys.indexOf(key)>=0; }
WOsu.Beatmap.isIntegerKey = function(key) { return WOsu.Beatmap.integerKeys.indexOf(key)>=0; }
WOsu.Beatmap.isBooleanKey = function(key) { return WOsu.Beatmap.booleanKeys.indexOf(key)>=0; }

WOsu.Beatmap.prototype.setKey = function(obj,key,value) {
	if (WOsu.Beatmap.isStringKey(key)) obj[key] = value;
	else if (WOsu.Beatmap.isArrayKey(key)) obj[key] = value.split(",");
	else if (WOsu.Beatmap.isFloatKey(key)) obj[key] = parseFloat(value);
	else if (WOsu.Beatmap.isIntegerKey(key)) obj[key] = parseInt(value);
	else if (WOsu.Beatmap.isBooleanKey(key)) obj[key] = (value=="true" || value=="1") ? true : false;
}
	
WOsu.Beatmap.eventLayerTypes = [
	"Background",
	"Break",
	"Storyboard Layer 0",
	"Storyboard Layer 1",
	"Storyboard Layer 2",
	"Storyboard Layer 3",
	"Storyboard Sound",
	"Background Colour",
	];
WOsu.Beatmap.getEventLayerType = function(key) {
	for (var i=0; i<this.eventLayerTypes.length; i++) {
		if (key.indexOf(this.eventLayerTypes[i])==0) return i;
	}
	return -1;
}

WOsu.Beatmap.prototype.calculate = function() {
	var bm = this.BeatmapMechanics;
	var bd = this.BeatmapData;
	bm.AR = (bd.ApproachRate<=5) ? 1800-bd.ApproachRate*120 : 1200-(bd.ApproachRate-5)*150;
	bm.CS = 140 - 15*bd.CircleSize;
	bm.OD = 160 - bd.OverallDifficulty*6;
	
	var be = this.BeatmapEvents;
	bm.minBPM = -1;
	bm.maxBPM = -1;
	for (var i=0; i<be.TimingPoints.length; i++) {
		var tp = be.TimingPoints[i];
		if (!tp.inherited) {
			if (bm.minBPM==-1 || tp.bpm>bm.minBPM) {
				bm.minBPM = tp.bpm;
			}
			if (bm.maxBPM==-1 || tp.bpm<bm.maxBPM) {
				bm.maxBPM = tp.bpm;
			}
		}
	}
	bm.minBPM = 60000/bm.minBPM;
	bm.maxBPM = 60000/bm.maxBPM;
}

WOsu.Beatmap.prototype.updateStatus = function(s) {
	this.status = s;
}