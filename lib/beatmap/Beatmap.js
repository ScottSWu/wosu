WOsu.Beatmap = function() {
    this.BeatmapData = new WOsu.BeatmapData();
    this.BeatmapEvents = new WOsu.BeatmapEvents();
    this.BeatmapObjects = new WOsu.BeatmapObjects();
    this.BeatmapMechanics = new WOsu.BeatmapMechanics();
}

WOsu.Beatmap.prototype.constructor = WOsu.Beatmap;

WOsu.Beatmap.mods = {
    NoFail:      1<<0,
    Easy:        1<<1,
    NoVideo:     1<<2,
    Hidden:      1<<3,
    HardRock:    1<<4,
    SuddenDeath: 1<<5,
    DoubleTime:  1<<6,
    Relax:       1<<7,
    HalfTime:    1<<8,
    Nightcore:   1<<9,
    Flashlight:  1<<10,
    Autoplay:    1<<11,
    SpunOut:     1<<12,
    Autopilot:   1<<13,
    Perfect:     1<<14,
    Key4:        1<<15,
    Key5:        1<<16,
    Key6:        1<<17,
    Key7:        1<<18,
    Key8:        1<<19,
    FadeIn:      1<<20,
    Random:      1<<21,
    Cinema:      1<<22,
    Key9:        1<<23,
    Key10:       1<<24,
    Key1:        1<<25,
    Key3:        1<<26,
    Key2:        1<<27
};

WOsu.Beatmap.hasMod = function(mods, mod) {
    return (mods & mod) == mod;
}

/**
    Compute technical details of the beatmap (with mods).
*/
WOsu.Beatmap.prototype.calculate = function(mods) {
    var bm = this.BeatmapMechanics;
    var bd = this.BeatmapData;
    
    // Apply mods
    var ar = bd.ApproachRate;
    var od = bd.OverallDifficulty;
    if (WOsu.Beatmap.hasMod(mods, WOsu.Beatmap.mods.HardRock)) {
        ar = ar * 1.4;
        od = od * 1.4;
        if (ar > 10) {
            ar = 10;
        }
        if (od > 10) {
            od = 10;
        }
    }
    else if (WOsu.Beatmap.hasMod(mods, WOsu.Beatmap.mods.Easy)) {
        ar = ar * 0.5;
    }
    
    bm.AR = (bd.ApproachRate <= 5) ? 1800 - bd.ApproachRate * 120 : 1200 - (bd.ApproachRate - 5) * 150;
    bm.CS = 140 - 15 * bd.CircleSize;
    bm.OD = 200 - bd.OverallDifficulty * 10;

    var be = this.BeatmapEvents;
    bm.minBPM = -1;
    bm.maxBPM = -1;
    for (var i = 0; i < be.TimingPoints.length; i++) {
        var tp = be.TimingPoints[i];
        if (!tp.inherited) {
            if (bm.minBPM == -1 || tp.bpm > bm.minBPM) {
                bm.minBPM = tp.bpm;
            }
            if (bm.maxBPM == -1 || tp.bpm < bm.maxBPM) {
                bm.maxBPM = tp.bpm;
            }
        }
    }
    bm.minBPM = 60000 / bm.minBPM;
    bm.maxBPM = 60000 / bm.maxBPM;
    
    // TODO Check skin colors
    bm.colors = [
        [0xFF, 0x80, 0x80],
        [0x80, 0xFF, 0x00],
        [0x00, 0x80, 0xC0],
        [0xFF, 0xFF, 0x80]
    ];
    
    console.log(bm.colors);
}
