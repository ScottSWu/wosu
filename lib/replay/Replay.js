WOsu.Replay = function(json) {
    this.type = 0; // Gameplay type
    this.version = 0; // osu! version
    this.bhash = ""; // Beatmap hash
    this.player = ""; // Player name
    this.rhash = ""; // Replay hash
    this.hits = [0, 0, 0, 0, 0, 0]; // Hit counts
    this.score = 0; // Score
    this.combo = 0; // Combo
    this.perfect = false; // Perfect replay
    this.mods = 0; // Mods
    this.graph = []; // Performance graph
    this.timestamp = 0; // Timestamp
    this.replayData = []; // Actions

    this.index = 0; // Action index
    // TODO Move this index into the player, does not belong here
}

WOsu.Replay.M1 = 1;
WOsu.Replay.M2 = 2;
WOsu.Replay.K1 = 5;
WOsu.Replay.K2 = 10;

WOsu.Replay.hasAction = function(bits, action) {
    return (bits & action) === action;
}

WOsu.Replay.prototype.constructor = WOsu.Replay;