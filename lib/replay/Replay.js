WOsu.Replay = function(json) {
	this.type = 0; // Gameplay type
	this.version = 0; // osu! version
	this.bhash = ""; // Beatmap hash
	this.player = ""; // Player name
	this.rhash = ""; // Replay hash
	this.hits = [0,0,0,0,0,0]; // Hit counts
	this.score = 0; // Score
	this.combo = 0; // Combo
	this.perfect = false; // Perfect replay
	this.mods = 0; // Mods
	this.graph = []; // Performance graph
	this.timestamp = 0; // Timestamp
	this.replayData = []; // Actions
	
	for (var i in json) {
		this[i] = json[i];
	}
	
	this.status = "";
}

WOsu.Replay.prototype.constructor = WOsu.Replay;

WOsu.Replay.prototype.parseReplayData = function(data) {
	this.status = "Parsing data";
	
	if (!data) return;
	var lines = data.split(",");
	var parts;
	
	var time = 0;
	var bits,actionBits;
	var M1 = 1, M2 = 2, K1 = 5, K2 = 10;
	
	for (var i=0; i<lines.length; i++) {
		parts = lines[i].split("|");
		time += parseInt(parts[0]);
		bits = parseInt(parts[3]);
		actionBits = 0;
		if ((bits & K2)==K2) {
			actionBits |= K2;
			bits &= ~K2;
		}
		if ((bits & K1)==K1) {
			actionBits |= K1;
			bits &= ~K1;
		}
		if ((bits & M2)==M2) {
			actionBits |= M2;
			bits &= ~M2;
		}
		if ((bits & M1)==M1) {
			actionBits |= M1;
			bits &= ~M1;
		}
		this.replayData.push([time,parseFloat(parts[1]),parseFloat(parts[2]),actionBits]);
	}
}
