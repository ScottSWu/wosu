WOsu.SpinnerObject = function(map, line) {
    WOsu.HitObject.call(this, map, line);

    this.spinnerTime = 0; // Spinner time

    this.parseSpinnerObject(line);
}

WOsu.SpinnerObject.prototype = Object.create(WOsu.HitObject.prototype);

WOsu.SpinnerObject.prototype.parseSpinnerObject = function(line) {
    this.endTime = parseInt(this.parseParts[5]);
    this.spinnerTime = this.endTime - this.time;
}