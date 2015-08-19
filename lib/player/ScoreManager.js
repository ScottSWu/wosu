/**
    Handles scoring
*/
WOsu.ScoreManager = function (mechanics) {
    this.mechanics = mechanics;

    this.totalScore = 0;
    this.totalAccuracy = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;

    this.hit300 = 0;
    this.hit200 = 0;
    this.hit100 = 0;
    this.hit50 = 0;
    this.hit0 = 0;

    this.hit300g = 0;
    this.hit300k = 0;
    this.hit100k = 0;

    this.score1000 = 0; // Spinner bonus
    this.score100 = 0; // Spinner spins
    this.score30 = 0; // Slider ticks
    this.score10 = 0; // Slider points

    this.combos = [];
}

WOsu.ScoreManager.prototype.constructor = WOsu.ScoreManager;

/**
    Compute the accuracy.
*/
WOsu.ScoreManager.prototype.getAccuracy = function () {
    var totalHits = this.hit300 + this.hit200 + this.hit100 + this.hit50 + this.hit0;
    var weightedHits = 3.0 / 3.0 * this.hit300 + 2.0 / 3.0 * this.hit200 + 1.0 / 3.0 * this.hit100 + 0.5 / 3.0 * this.hit50 + 0.0 / 3.0 * this.hit0;

    if (totalHits == 0) {
        this.totalAccuracy = 0;
    }
    else {
        this.totalAccuracy = weightedHits / totalHits;
    }
    return this.totalAccuracy;
}

/**
    Record an incrase in combo.
*/
WOsu.ScoreManager.prototype.recordCombo = function () {
    this.currentCombo++;
    if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
    }
}

/**
    Record a combo break.
*/
WOsu.ScoreManager.prototype.recordBreak = function () {
    this.combos.push(this.currentCombo);
    this.currentCombo = 0;
}

/**
    Record a score. Call this BEFORE recordCombo.
*/
WOsu.ScoreManager.prototype.recordScore = function (amount) {
    var comboMultiplier = this.currentCombo - 1;
    if (comboMultiplier < 0) {
        comboMultiplier = 0;
    }
    var extra = comboMultiplier * this.mechanics.difficultyMultiplier * this.mechanics.modMultiplier;
    var totalAmount = amount + ~~(amount * extra / 25.0);
    this.totalScore += totalAmount;
}

/**
    Record a 300. Call this BEFORE recordCombo.
*/
WOsu.ScoreManager.prototype.record300 = function () {
    this.hit300++;
    this.recordScore(300);
}

/**
    Record a 100. Call this BEFORE recordCombo.
*/
WOsu.ScoreManager.prototype.record100 = function () {
    this.hit100++;
    this.recordScore(100);
}

/**
    Record a 50. Call this BEFORE recordCombo.
*/
WOsu.ScoreManager.prototype.record50 = function () {
    this.hit50++;
    this.recordScore(50);
}

/**
    Record a miss. Call this BEFORE recordCombo.
*/
WOsu.ScoreManager.prototype.record0 = function () {
    this.hit0++;
    this.recordScore(0);
}

/**
    Record a slider tick.
*/
WOsu.ScoreManager.prototype.record10 = function () {
    this.score10++;
    this.totalScore += 10;
}

/**
    Record a slider point.
*/
WOsu.ScoreManager.prototype.record30 = function () {
    this.score30++;
    this.totalScore += 30;
}

/**
    Record a spinner spin.
*/
WOsu.ScoreManager.prototype.recordSpin = function (times) {
    this.score100 += times;
    this.totalScore += 100 * times;
}

/**
    Record a spinner bonus.
*/
WOsu.ScoreManager.prototype.recordBonus = function (times) {
    this.score1000 += times;
    this.totalScore += 1000 * times;
}

// TODO Other record amounts + k, g
