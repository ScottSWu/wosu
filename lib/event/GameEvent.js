/**
    Handle game events and links multiple game events together.
*/
WOsu.GameEvent = function (type, time, x, y, gameObject, parent) {
    this.type = type;
    this.time = time;
    this.x = x;
    this.y = y;
    this.gameObject = gameObject;
    this.parent = (parent === undefined) ? this : parent;
    this.data = {};
}

WOsu.GameEvent.getEvents = function (obj) {
    var events = [];
    if (obj.isCircle()) {

        // Only one event for circles
        var parent = new WOsu.GameEvent(WOsu.GameEvent.TYPE_CIRCLE, obj.time, obj.x, obj.y, obj);
        events.push(parent);

    }
    else if (obj.isSlider()) {

        // Slider start
        var parent = new WOsu.GameEvent(WOsu.GameEvent.TYPE_SLIDER_START, obj.time, obj.x, obj.y, obj);
        events.push(parent);
        
        // Slider end
        events.push(new WOsu.GameEvent(WOsu.GameEvent.TYPE_SLIDER_END, obj.endTime, obj.endX, obj.endY, obj, parent));
        
        // Slider ticks
        var offsetTime = obj.time;
        for (var i = 0; i < obj.repeats; i++) {
            for (var j = 0; j < obj.ticks.length; j++) {
                // TODO Use slider.getPosition instead
                // Interpolation
                var t = obj.ticks[j];
                if (i % 2 == 0) {
                    t = 1.0 - t;
                }
                // Positional interpolation
                var ti = t * obj.curveLength;
                if (ti < 0) { // Clamp to the array size
                    ti = 0;
                }
                else if (ti >= obj.curveLength) {
                    ti = obj.curveLength - 1;
                }
                events.push(new WOsu.GameEvent(WOsu.GameEvent.TYPE_SLIDER_TICK, offsetTime + t * obj.curveTime, obj.curveX[ti], obj.curveY[ti], obj, parent));
            }
            offsetTime += obj.curveTime;
        }
        
        // Slider repeats
        offsetTime = obj.time;
        for (var i = 1; i < obj.repeats; i++) {
            offsetTime += obj.curveTime;
            
            // Repeat
            if (i % 2 == 0) { // Repeat at the beginning
                events.push(new WOsu.GameEvent(WOsu.GameEvent.TYPE_SLIDER_REPEAT, offsetTime, obj.x, obj.y, obj, parent));
            }
            else { // Repeat at the end
                events.push(new WOsu.GameEvent(WOsu.GameEvent.TYPE_SLIDER_REPEAT, offsetTime, obj.endX, obj.endY, obj, parent));
            }
        }

        // Whether or not the slider is held or not
        parent.data.hold = false;
        // Total combo points
        parent.data.hit = 0;
        parent.data.total = events.length;

    }
    else if (obj.isSpinner()) {

        // Spinner start
        var parent = new WOsu.GameEvent(WOsu.GameEvent.TYPE_SPINNER_START, obj.time, obj.x, obj.y, obj);
        events.push(parent);
        // Spinner end
        events.push(new WOsu.GameEvent(WOsu.GameEvent.TYPE_SPINNER_END, obj.endTime, obj.x, obj.y, obj, parent));
        
        parent.data.spins = 0;

    }
    return events;
}

WOsu.GameEvent.prototype.constructor = WOsu.GameEvent;

WOsu.GameEvent.prototype.isType = function (type) {
    return (this.type & type) == type;
}

WOsu.GameEvent.TYPE_NONE = 0;
WOsu.GameEvent.TYPE_CIRCLE = 1;

WOsu.GameEvent.TYPE_SLIDER = 2;
WOsu.GameEvent.TYPE_SLIDER_POINT = 2 + 4;
WOsu.GameEvent.TYPE_SLIDER_START = 2 + 4 + 8;
WOsu.GameEvent.TYPE_SLIDER_END = 2 + 4 + 16;
WOsu.GameEvent.TYPE_SLIDER_REPEAT = 2 + 4 + 32;
WOsu.GameEvent.TYPE_SLIDER_TICK = 2 + 64;

WOsu.GameEvent.TYPE_SPINNER = 128;
WOsu.GameEvent.TYPE_SPINNER_START = 128 + 256;
WOsu.GameEvent.TYPE_SPINNER_END = 128 + 512;
