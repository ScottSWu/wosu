WOsu.BeatmapLoader = {};

WOsu.BeatmapLoader.sectionKeys = [
    "HEADING",
    "GENERAL",
    "EDITOR",
    "METADATA",
    "DIFFICULTY",
    "EVENTS",
    "TIMINGPOINTS",
    "COLOURS",
    "HITOBJECTS",
];

WOsu.BeatmapLoader.stringKeys = [
    "AudioFilename", "SampleSet",

    "Title", "Artist", "Creator", "Version", "Source", "Tags",

];
WOsu.BeatmapLoader.arrayKeys = [

    "EditorBookmarks",


];
WOsu.BeatmapLoader.floatKeys = [
    "StackLeniency",


    "SliderMultiplier", "SliderTickRate",
];
WOsu.BeatmapLoader.integerKeys = [
    "AudioLeadIn", "PreviewTime", "Mode",
    "BeatDivisor", "GridSize",

    "HPDrainRate", "CircleSize", "OverallDifficulty", "ApproachRate",
];
WOsu.BeatmapLoader.booleanKeys = [
    "Countdown", "LetterboxInBreaks", "StoryFireInFront",
    "DistanceSnap",


];

WOsu.BeatmapLoader.isStringKey = function(key) {
    return WOsu.BeatmapLoader.stringKeys.indexOf(key) >= 0;
}

WOsu.BeatmapLoader.isArrayKey = function(key) {
    return WOsu.BeatmapLoader.arrayKeys.indexOf(key) >= 0;
}

WOsu.BeatmapLoader.isFloatKey = function(key) {
    return WOsu.BeatmapLoader.floatKeys.indexOf(key) >= 0;
}

WOsu.BeatmapLoader.isIntegerKey = function(key) {
    return WOsu.BeatmapLoader.integerKeys.indexOf(key) >= 0;
}

WOsu.BeatmapLoader.isBooleanKey = function(key) {
    return WOsu.BeatmapLoader.booleanKeys.indexOf(key) >= 0;
}

WOsu.BeatmapLoader.setKey = function(obj, key, value) {
    if (WOsu.BeatmapLoader.isStringKey(key)) {
        obj[key] = value;
    } else if (WOsu.BeatmapLoader.isArrayKey(key)) {
        obj[key] = value.split(",");
    } else if (WOsu.BeatmapLoader.isFloatKey(key)) {
        obj[key] = parseFloat(value);
    } else if (WOsu.BeatmapLoader.isIntegerKey(key)) {
        obj[key] = parseInt(value);
    } else if (WOsu.BeatmapLoader.isBooleanKey(key)) {
        obj[key] = (value == "true" || value == "1") ? true : false;
    }
}

WOsu.BeatmapLoader.eventLayerTypes = [
    "Background",
    "Break",
    "Storyboard Layer 0",
    "Storyboard Layer 1",
    "Storyboard Layer 2",
    "Storyboard Layer 3",
    "Storyboard Sound",
    "Background Colour",
];
WOsu.BeatmapLoader.getEventLayerType = function(key) {
    for (var i = 0; i < this.eventLayerTypes.length; i++) {
        if (key.indexOf(this.eventLayerTypes[i]) == 0) return i;
    }
    return -1;
}

WOsu.BeatmapLoader.load = function(text) {
    var Loader = WOsu.BeatmapLoader;

    var map = new WOsu.Beatmap();
    var mapData = map.BeatmapData;
    var mapEvents = map.BeatmapEvents;
    var mapObjects = map.BeatmapObjects;
    var mapMechanics = map.BeatmapMechanics;

    var lines = text.split("\n");

    var index = 0;
    var section = "HEADING";
    var key, value;
    var place = -1;
    var link = 0;
    var line;
    while (index < lines.length) {
        line = lines[index++].replace(/\n/g, "");
        if (line.trim().startsWith("[") && line.trim().endsWith("]")) {
            section = line.trim().substring(1, line.trim().length - 1).toUpperCase();
        } else if (line.trim() != "") {
            if (section == "HEADING") {
                mapData.head += line.trim() + "\n";
            } else if (section == "GENERAL") {
                line = line.trim();
                if (line.indexOf(":") > 0) {
                    key = line.substring(0, line.indexOf(":")).trim();
                    value = line.substring(line.indexOf(":") + 1).trim();
                    Loader.setKey(mapData, key, value);
                }
            } else if (section == "EDITOR") {
                line = line.trim();
                if (line.indexOf(":") > 0) {
                    key = line.substring(0, line.indexOf(":")).trim();
                    value = line.substring(line.indexOf(":") + 1).trim();
                    Loader.setKey(mapData, key, value);
                }
            } else if (section == "METADATA") {
                line = line.trim();
                if (line.indexOf(":") > 0) {
                    key = line.substring(0, line.indexOf(":")).trim();
                    value = line.substring(line.indexOf(":") + 1).trim();
                    Loader.setKey(mapData, key, value);
                }
            } else if (section == "DIFFICULTY") {
                line = line.trim();
                if (line.indexOf(":") > 0) {
                    key = line.substring(0, line.indexOf(":")).trim();
                    value = line.substring(line.indexOf(":") + 1).trim();
                    Loader.setKey(mapData, key, value);
                }
            } else if (section == "EVENTS") {
                if (line.startsWith("//")) {
                    place = Loader.getEventLayerType(line.substring(2));
                } else {
                    switch (place) {
                        case 0:
                            mapEvents.BackgroundEvents.push(new WOsu.BackgroundEvent(line));
                            break;
                        case 1:
                            mapEvents.BreakPeriods.push(new WOsu.BreakPeriod(line));
                            break;
                        case 2:
                            mapEvents.hasStoryboardBackground = true;
                        case 3:
                        case 4:
                        case 5:
                            if (line.startsWith(" ")) {
                                mapEvents.StoryboardObjects[map.BeatmapEvents.StoryboardObjects.length - 1].addCommand(line);
                            } else {
                                mapEvents.StoryboardObjects.push(new WOsu.StoryboardObject(line));
                            }
                            break;
                        case 6:
                        case 7:
                        default:
                            break;
                    }
                }
            } else if (section == "TIMINGPOINTS") {
                mapEvents.TimingPoints.push(new WOsu.TimingPoint(map, line));
            } else if (section == "COLOURS") {
                if (line.indexOf(":") > 0) {
                    value = line.substring(line.indexOf(":") + 1).trim().split(",");
                    mapEvents.Colours.push([parseInt(value[0]) / 255, parseInt(value[1]) / 255, parseInt(value[2]) / 255]);
                }
            } else if (section == "HITOBJECTS") {
                mapObjects.push(WOsu.HitObject.getObject(map, line));
            }
        }
    }

    return map;
}