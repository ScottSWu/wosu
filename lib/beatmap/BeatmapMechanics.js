/**
    A structure containing technical mechanic values.
*/
WOsu.BeatmapMechanics = function() {
    // Difficulties in milliseconds
    this.AR = 0;
    this.CS = 0;
    this.OD = 0;
    this.hit300 = 0;
    this.hit100 = 0;
    this.hit50 = 0;
    this.spin = 1;
    
    // Total difficulty score multiplier
    this.difficulty = 0;
    this.difficultyMultiplier = 1;
    this.modMultiplier = 1;
    
    // Beats per minute (as opposed to milliseconds per beat)
    this.minBPM = 0;
    this.maxBPM = 1;
    
    // Combo colors
    this.colors = [];
}

WOsu.BeatmapMechanics.prototype.constructor = WOsu.BeatmapMechanics;