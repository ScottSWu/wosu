/**
    Handles indexing
*/
WOsu.IndexManager = function(gameEvents, replayData) {
    // Current game event in question
    this.gameEvents = events;
    this.gameIndex = 0;
    this.gameLength = events.length;
    
    // Current replay action
    repayData = (replayData === undefined) ? [] : replayData;
    this.replayData = replayData;
    this.replayIndex = 0;
    this.replayCurrent = 0;
    this.replayRelease = Number.NEGATIVE_INFINITY;
    this.replayLength = replayData.length;
}

WOsu.IndexManager.prototype.constructor = WOsu.IndexManager;
