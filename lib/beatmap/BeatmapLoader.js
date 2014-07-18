WOsu.BeatmapLoader = { };

WOsu.BeatmapLoader.load = function(text) {
	var map = new WOsu.Beatmap();
	var lines = text.split("\n");
	
	var index = 0;
	var section = "HEADING";
	var key,value;
	var place = -1;
	var link = 0;
	var line;
	while (index<lines.length) {
		line = lines[index++].replace(/\n/g,"");
		if (line.trim().startsWith("[") && line.trim().endsWith("]")) {
			section = line.trim().substring(1,line.trim().length-1).toUpperCase();
		}
		else if (line.trim()!="") {
			if (section=="HEADING") {
				map.BeatmapData.head += line.trim() + "\n";
			}
			else if (section=="GENERAL") {
				line = line.trim();
				if (line.indexOf(":")>0) {
					key = line.substring(0,line.indexOf(":")).trim();
					value = line.substring(line.indexOf(":")+1).trim();
					map.setKey(map.BeatmapData,key,value);
				}
			}
			else if (section=="EDITOR") {
				line = line.trim();
				if (line.indexOf(":")>0) {
					key = line.substring(0,line.indexOf(":")).trim();
					value = line.substring(line.indexOf(":")+1).trim();
					map.setKey(map.BeatmapData,key,value);
				}
			}
			else if (section=="METADATA") {
				line = line.trim();
				if (line.indexOf(":")>0) {
					key = line.substring(0,line.indexOf(":")).trim();
					value = line.substring(line.indexOf(":")+1).trim();
					map.setKey(map.BeatmapData,key,value);
				}
			}
			else if (section=="DIFFICULTY") {
				line = line.trim();
				if (line.indexOf(":")>0) {
					key = line.substring(0,line.indexOf(":")).trim();
					value = line.substring(line.indexOf(":")+1).trim();
					map.setKey(map.BeatmapData,key,value);
				}
			}
			else if (section=="EVENTS") {
				if (line.startsWith("//")) {
					place = WOsu.Beatmap.getEventLayerType(line.substring(2));
				}
				else {
					switch (place) {
						case 0:
							map.BeatmapEvents.BackgroundEvents.push(new WOsu.BackgroundEvent(line)); break;
						case 1:
							map.BeatmapEvents.BreakPeriods.push(new WOsu.BreakPeriod(line)); break;
						case 2:
							map.BeatmapEvents.hasStoryboardBackground = true;
						case 3: case 4: case 5:
							if (line.startsWith(" ")) {
								map.BeatmapEvents.StoryboardObjects[map.BeatmapEvents.StoryboardObjects.length-1].addCommand(line);
							}
							else {
								map.BeatmapEvents.StoryboardObjects.push(new WOsu.StoryboardObject(line));
							}
							break;
						case 6:
						case 7:
						default: break;
					}
				}
			}
			else if (section=="TIMINGPOINTS") {
				map.BeatmapEvents.TimingPoints.push(new WOsu.TimingPoint(map,line));
			}
			else if (section=="COLOURS") {
				if (line.indexOf(":")>0) {
					value = line.substring(line.indexOf(":")+1).trim().split(",");
					map.BeatmapEvents.Colours.push([parseInt(value[0])/255,parseInt(value[1])/255,parseInt(value[2])/255]);
				}
			}
			else if (section=="HITOBJECTS") {
				map.BeatmapObjects.push(WOsu.HitObject.getObject(map,line));
			}
		}
	}
	
	WOsu.async(function() { map.updateStatus("Completed") });
	
	return map;
}

WOsu.Beatmap.readBeatmap = function(folder,map) {
	var req = new XMLHttpRequest();
	req.open("GET","GetBeatmap.php?folder=" + encodeURIComponent(folder) + "&map=" + encodeURIComponent(map),false);
	req.send();
	var res = req.responseText;
	
	if (res.startsWith("Error")) {
		return false;
	}
	res = res.substring(0,res.lastIndexOf("~~\\e\\~~"));
	var data = JSON.parse(res);
	
	var map = new WOsu.Beatmap();
	map.BeatmapData.head = data.Head;
	
	// Mapped variables
	var line,key,value;
	
	// General
	for (var i=0; i<data.General.length; i++) {
		line = data.General[i].trim();
		if (line.indexOf(":")>0) {
			key = line.substring(0,line.indexOf(":")).trim();
			value = line.substring(line.indexOf(":")+1).trim();
			map.setKey(map.BeatmapData,key,value);
		}
	}
	
	// Editor
	for (var i=0; i<data.Editor.length; i++) {
		line = data.Editor[i].trim();
		if (line.indexOf(":")>0) {
			key = line.substring(0,line.indexOf(":")).trim();
			value = line.substring(line.indexOf(":")+1).trim();
			map.setKey(map.BeatmapData,key,value);
		}
	}
	
	// Metadata
	for (var i=0; i<data.Metadata.length; i++) {
		line = data.Metadata[i].trim();
		if (line.indexOf(":")>0) {
			key = line.substring(0,line.indexOf(":")).trim();
			value = line.substring(line.indexOf(":")+1).trim();
			map.setKey(map.BeatmapData,key,value);
		}
	}
	
	// Difficulty
	for (var i=0; i<data.Difficulty.length; i++) {
		line = data.Difficulty[i].trim();
		if (line.indexOf(":")>0) {
			key = line.substring(0,line.indexOf(":")).trim();
			value = line.substring(line.indexOf(":")+1).trim();
			map.setKey(map.BeatmapData,key,value);
		}
	}
	
	// Events
	var place = -1;
	var link = 0;
	for (var i=0; i<data.Events.length; i++) {
		line = data.Events[i];
		if (line.startsWith("//")) {
			place = WOsu.Beatmap.getEventLayerType(line.substring(2));
		}
		else {
			switch (place) {
				case 0:
					map.BeatmapEvents.BackgroundEvents.push(new WOsu.BackgroundEvent(line)); break;
				case 1:
					map.BeatmapEvents.BreakPeriods.push(new WOsu.BreakPeriod(line)); break;
				case 2:
					map.BeatmapEvents.hasStoryboardBackground = true;
				case 3: case 4: case 5:
					if (line.startsWith(" ")) {
						map.BeatmapEvents.StoryboardObjects[map.BeatmapEvents.StoryboardObjects.length-1].addCommand(line);
					}
					else {
						map.BeatmapEvents.StoryboardObjects.push(new WOsu.StoryboardObject(line));
					}
					break;
				case 6:
				case 7:
				default: break;
			}
		}
	}
	
	// External storyboard
	place = -1;
	link = 0;
	if (data.Storyboard!=undefined) {
		for (var i=0; i<data.Storyboard.length; i++) {
			line = data.Storyboard[i];
			if (line.startsWith("//")) {
				place = WOsu.Beatmap.getEventLayerType(line.substring(2));
			}
			else {
				switch (place) {
					case 0:
						map.BeatmapEvents.BackgroundEvents.push(new WOsu.BackgroundEvent(line)); break;
					case 1:
						map.BeatmapEvents.BreakPeriods.push(new WOsu.BreakPeriod(line)); break;
					case 2:
						map.BeatmapEvents.hasStoryboardBackground = true;
					case 3: case 4: case 5:
						if (line.startsWith(" ")) {
							map.BeatmapEvents.StoryboardObjects[map.BeatmapEvents.StoryboardObjects.length-1].addCommand(line);
						}
						else {
							map.BeatmapEvents.StoryboardObjects.push(new WOsu.StoryboardObject(line));
						}
						break;
					case 6:
					case 7:
					default: break;
				}
			}
		}
		map.BeatmapEvents.hasExternalStoryboard = true;
	}
	
	// Timing Points
	for (var i=0; i<data.TimingPoints.length; i++) {
		line = data.TimingPoints[i];
		map.BeatmapEvents.TimingPoints.push(new WOsu.TimingPoint(map,line));
	}
	
	// Colours
	if (data.Colours!=undefined) {
		var hex;
		for (var i=0; i<data.Colours.length; i++) {
			line = data.Colours[i];
			if (line.indexOf(":")>0) {
				value = line.substring(line.indexOf(":")+1).trim().split(",");
				map.BeatmapEvents.Colours.push([parseInt(value[0])/255,parseInt(value[1])/255,parseInt(value[2])/255]);
			}
		}
	}
	
	// Hit Objects
	var currentTiming = 0;
	for (var i=0; i<data.HitObjects.length; i++) {
		line = data.HitObjects[i];
		map.BeatmapObjects.push(WOsu.HitObject.getObject(map,line));
	}
	
	return map;
}
