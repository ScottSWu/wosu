WOsu.HitObject = function(map, line) {
    this.parseParts = null;

    this.map = map;
    this.x = 0; // X coordinate (0-512)
    this.y = 0; // Y coordinate (0-392)
    this.endX = this.x;
    this.endY = this.y;
    this.time = 0; // Milliseconds after the beginning of the song
    this.endTime = 0;
    this.type; // Bit (3,2,1,0) -> (Spinner,New combo,Slider,Beat)
    this.combo = 0; // Combo color
    this.comboNumber = 1; // Combo number
    this.hitsound = 0; // Hit sound; Bit (3,2,1,0) -> (Clap,Finish,Whistle,Normal)

    this.parse(line);
}

WOsu.HitObject.getObject = function(map, line) {
    var t = new WOsu.HitObject(map, line);
    if (t.isCircle()) {
        t = new WOsu.CircleObject(map, line);
    } else if (t.isSlider()) {
        t = new WOsu.SliderObject(map, line);
    } else if (t.isSpinner()) {
        t = new WOsu.SpinnerObject(map, line);
    }
    return t;
}

WOsu.HitObject.prototype.constructor = WOsu.HitObject;

WOsu.HitObject.prototype.parse = function(line) {
    this.parseParts = line.split(",");
    this.x = parseInt(this.parseParts[0]);
    this.y = parseInt(this.parseParts[1]);
    this.time = parseInt(this.parseParts[2]);
    this.type = parseInt(this.parseParts[3]);
    this.hitsound = parseInt(this.parseParts[4]);

    this.endX = this.x;
    this.endY = this.y;
    this.endTime = this.time;
}

WOsu.HitObject.prototype.isCircle = function() {
    return (this.type & 1) == 1;
}

WOsu.HitObject.prototype.isSlider = function() {
    return (this.type & 2) == 2;
}

WOsu.HitObject.prototype.isComboChange = function() {
    return (this.type & 4) == 4;
}

WOsu.HitObject.prototype.isSpinner = function() {
    return (this.type & 8) == 8;
}