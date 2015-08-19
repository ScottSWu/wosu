WOsu.SliderObject = function (map, line) {
    WOsu.HitObject.call(this, map, line);

    this.controlX = []; // Control X coordinates of the slider
    this.controlY = []; // Control Y coordinates of the slider
    this.repeats = 0; // Repeats
    this.curveX = []; // Generated curve point X coordinates
    this.curveY = []; // Generated curve point Y coordinates
    this.curveLength = 0; // Number of curve points
    this.sliderSpeed = 0; // Slider speed (osupixels)
    this.sliderLength = 0; // Slider length (pixels)
    this.sliderHitsounds = []; // Slider hit sounds
    this.endX = 0; // End X coordinate
    this.endY = 0; // End Y coordinate
    this.curveTime = 0; // Time for a single slide
    this.sliderTime = 0; // Time for the whole slider
    this.timingPoint = null; // The corresponding timing point
    this.ticks = []; // Slider ticks

    this.parseSliderObject(line);
}

WOsu.SliderObject.prototype = Object.create(WOsu.HitObject.prototype);

WOsu.SliderObject.prototype.parseSliderObject = function (line) {
    var points = this.parseParts[5].split("|");
    var lastX = this.x,
        lastY = this.y;
    var nextX, nextY;
    for (var i = 1; i < points.length; i++) {
        nextX = parseInt(points[i].substring(0, points[i].indexOf(":")));
        nextY = parseInt(points[i].substring(points[i].indexOf(":") + 1));

        this.controlX.push(nextX);
        this.controlY.push(nextY);

        this.sliderLength += Math.sqrt(Math.pow(nextX - lastX, 2) + Math.pow(nextY - lastY, 2));

        lastX = nextX;
        lastY = nextY;
    }
    this.controlX.unshift(this.x);
    this.controlY.unshift(this.y);

    this.repeats = parseInt(this.parseParts[6]);
    this.sliderSpeed = parseFloat(this.parseParts[7]);
    if (this.parseParts.length > 8) {
        points = this.parseParts[8].split("\\|");
        for (var i = 0; i < points.length; i++) {
            this.sliderHitsounds.push(parseInt(points[i]));
        }
    }

    this.endX = this.controlX[this.controlX.length - 1];
    this.endY = this.controlY[this.controlY.length - 1];

    // Slider timings
    var multiplier = this.map.BeatmapData.SliderMultiplier;
    this.timingPoint = this.map.getTimingPoint(this.time);
    this.curveTime = this.sliderSpeed / multiplier / 100 * this.timingPoint.bpm;
    this.endTime = this.curveTime * this.repeats + this.time;
    this.sliderTime = this.endTime - this.time;

    // Slider tick points
    var tickRate = this.map.BeatmapData.SliderTickRate;
    var frequency = (100.0 * this.timingPoint.ratio * multiplier) / (this.sliderSpeed * tickRate);
    for (var i = frequency; i < 1.0 - WOsu.EPSILON; i += frequency) {
        this.ticks.push(i);
    }
}

WOsu.SliderObject.prototype.generateBezier = function () {
    var max = ~~(this.sliderLength / 5);

    this.curveX = new Array(max + 1);
    this.curveY = new Array(max + 1);

    var t, degree, pointX, pointY;
    for (var i = 0; i <= max; i++) {
        t = i / max;
        pointX = this.controlX.slice(0);
        pointY = this.controlY.slice(0);
        degree = this.controlX.length;
        while (degree > 1) {
            for (var j = 0; j < degree - 1; j++) {
                pointX[j] = pointX[j] * (1 - t) + pointX[j + 1] * t;
                pointY[j] = pointY[j] * (1 - t) + pointY[j + 1] * t;
            }
            degree--;
        }
        this.curveX[i] = pointX[0];
        this.curveY[i] = pointY[0];
    }

    this.curveLength = this.curveX.length;
}

WOsu.SliderObject.prototype.getPosition = function (time) {
    var last = 0;
    var next = 0;
    var t = 0;
    if (time < this.time) {
        last = 0;
        next = last;
        t = 0;
    }
    else if (time > this.endTime) {
        last = this.curveLength - 1;
        next = last;
        t = 0;
    }
    else {
        var diff = time - this.time;
        var repeats = ~~(diff / this.curveTime);
        var partial = (diff % this.curveTime) / this.curveTime;
        if (repeats % 2 == 1) {
            partial = 1.0 - partial;
        }
        last = ~~(partial * this.curveLength);
        next = last + 1;
        if (next >= this.curveLength) {
            next = last;
        }
        t = partial * this.curveLength - last;
    }

    return [this.curveX[last] * (1 - t) + this.curveX[next] * t, this.curveY[last] * (1 - t) + this.curveY[next] * t];
}

WOsu.SliderObject.prototype.getDistance = function (time, x, y) {
    var pos = this.getPosition(time);
    var dx = pos[0] - x;
    var dy = pos[1] - y;
    return Math.sqrt(dx * dx + dy * dy);
}
