
if __name__=="__main__":
	scriptFiles = [
		"beatmap/Beatmap.js",
		"beatmap/BeatmapLoader.js",
		"beatmap/BeatmapData.js",
		"beatmap/BeatmapEvents.js",
		"beatmap/BeatmapObjects.js",
		"beatmap/BeatmapMechanics.js",
		
		"event/Event.js",
		"event/BackgroundEvent.js",
		"event/BreakPeriod.js",
		"event/StoryboardEvent.js",
		"event/StoryboardObject.js",
		"event/TimingPoint.js",
		"event/ColourEvent.js",
		
		"object/HitObject.js",
		"object/SliderObject.js",
		"object/SpinnerObject.js",
		
		"player/Player.js",
		
		"skin/Skin.js",
		"skin/SkinLoader.js",
		
		"replay/Replay.js",
		"replay/ReplayLoader.js",
		
		"math/Matrix3.js",
	];
	
	outputFile = "WOsuData.js";
	fout = open(outputFile,"w");
	for file in scriptFiles:
		print "Writing %s" % file
		fout.write("// %s\n" % file);
		fin = open(file,"r");
		for line in fin:
			fout.write(line);
		fin.close();
		fout.write("\n\n");
	fout.close();
	print "Wrote all to %s" % outputFile
	
	outputFile = "ScriptList.txt";
	fout = open(outputFile,"w");
	for file in scriptFiles:
		print "Listing %s" % file
		fout.write("<script type=\"text/javascript\" src=\"lib/%s\"></script>\n" % file);
	fout.close();
	print "Wrote script list to %s" % outputFile