WOsu.Beatmap = function () {
    this.BeatmapData = new WOsu.BeatmapData();
    this.BeatmapEvents = new WOsu.BeatmapEvents();
    this.BeatmapObjects = new WOsu.BeatmapObjects();
    this.BeatmapMechanics = new WOsu.BeatmapMechanics();
}

WOsu.Beatmap.prototype.constructor = WOsu.Beatmap;

WOsu.Beatmap.mods = {
    NoFail: {
        mask: 1 << 0,
        multiplier: 0.5
    },
    Easy: {
        mask: 1 << 1,
        multiplier: 0.5
    },
    NoVideo: {
        mask: 1 << 2,
        multiplier: 1.0
    },
    Hidden: {
        mask: 1 << 3,
        multiplier: 1.06
    },
    HardRock: {
        mask: 1 << 4,
        multiplier: 1.06
    },
    SuddenDeath: {
        mask: 1 << 5,
        multiplier: 1.0
    },
    DoubleTime: {
        mask: 1 << 6,
        multiplier: 1.12
    },
    Relax: {
        mask: 1 << 7,
        multiplier: 0.0
    },
    HalfTime: {
        mask: 1 << 8,
        multiplier: 0.3
    },
    Nightcore: {
        mask: 1 << 9,
        multiplier: 1.12
    },
    Flashlight: {
        mask: 1 << 10,
        multiplier: 1.12
    },
    Autoplay: {
        mask: 1 << 11,
        multiplier: 0.0
    },
    SpunOut: {
        mask: 1 << 12,
        multiplier: 0.9
    },
    Autopilot: {
        mask: 1 << 13,
        multiplier: 0.0
    },
    Perfect: {
        mask: 1 << 14,
        multiplier: 1.0
    },
    // TODO Multipliers for keys
    Key4: {
        mask: 1 << 15,
        multiplier: 1.0
    },
    Key5: {
        mask: 1 << 16,
        multiplier: 1.0
    },
    Key6: {
        mask: 1 << 17,
        multiplier: 1.0
    },
    Key7: {
        mask: 1 << 18,
        multiplier: 1.0
    },
    Key8: {
        mask: 1 << 19,
        multiplier: 1.0
    },
    FadeIn: {
        mask: 1 << 20,
        multiplier: 1.0
    },
    Random: {
        mask: 1 << 21,
        multiplier: 1.0
    },
    Cinema: {
        mask: 1 << 22,
        multiplier: 1.0
    },
    Key9: {
        mask: 1 << 23,
        multiplier: 1.0
    },
    Key10: {
        mask: 1 << 24,
        multiplier: 1.0
    },
    Key1: {
        mask: 1 << 25,
        multiplier: 1.0
    },
    Key3: {
        mask: 1 << 26,
        multiplier: 1.0
    },
    Key2: {
        mask: 1 << 27,
        multiplier: 1.0
    }
};

WOsu.Beatmap.hasMod = function (mods, mod) {
    return (mods & mod.mask) == mod.mask;
};

/**
    Get the timing point at a given time.
*/
WOsu.Beatmap.prototype.getTimingPoint = function (time) {
    var current = 0;
    var points = this.BeatmapEvents.TimingPoints;
    while (current < points.length - 1 && points[current + 1].time <= time) {
        current++;
    }
    return points[current];
}

/**
    Compute technical details of the beatmap (with mods).
*/
WOsu.Beatmap.prototype.loadMechanics = function (mods) {
    mods = (mods === undefined) ? 0 : mods;

    var bm = this.BeatmapMechanics;
    var bd = this.BeatmapData;

    // Apply mods
    var ar = bd.ApproachRate;
    var cs = bd.CircleSize;
    var od = bd.OverallDifficulty;
    var hp = bd.HPDrainRate;

    // Compute total difficulty
    bm.difficulty = cs + od + hp;
    bm.difficultyMultiplier = [6, 13, 18, 25, 31].reduce(function (p, c) {
        return (bm.difficulty > c) ? p + 1 : p;
    }, 2);

    // Compute mod multipliers
    for (var mod in WOsu.Beatmap.mods) {
        if (WOsu.Beatmap.hasMod(mods, mod)) {
            bm.modMultiplier *= mod.multiplier;
        }
    }

    // Adjust difficulty for mods
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

    bm.AR = (ar <= 5) ? 1800 - ar * 120 : 1200 - (ar - 5) * 150;
    bm.CS = (140 - 15 * cs) / 2.0;
    bm.OD = 200 - od * 10;
    bm.hit300 = 80 - od * 6;
    bm.hit100 = 140 - od * 8;
    bm.hit50 = 200 - od * 10;

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
}

/**
    Compute all game events.
*/
WOsu.Beatmap.prototype.loadEvents = function () {
    var bm = this.BeatmapMechanics;
    var bo = this.BeatmapObjects;

    for (var i = 0; i < bo.length; i++) {
        bm.events = bm.events.concat(WOsu.GameEvent.getEvents(bo[i]));
    }

    // Sort events in order
    bm.events.sort(function (a, b) {
        return a.time - b.time;
    });
}
