module.exports = function(grunt) {
	grunt.initConfig({
		pkg : grunt.file.readJSON("package.json"),
		
		concat : {
			options : {
				sourceMap : true	
			},
			build : {
				src : [
					//""lib/**/*.js"
					"lib/WOsuUtil.js",
					
					"lib/beatmap/Beatmap.js",
					"lib/beatmap/BeatmapLoader.js",
					"lib/beatmap/BeatmapData.js",
					"lib/beatmap/BeatmapEvents.js",
					"lib/beatmap/BeatmapObjects.js",
					"lib/beatmap/BeatmapMechanics.js",
                    
					"lib/event/Event.js",
					"lib/event/BackgroundEvent.js",
					"lib/event/BreakPeriod.js",
					"lib/event/StoryboardEvent.js",
					"lib/event/StoryboardObject.js",
					"lib/event/TimingPoint.js",
					"lib/event/ColourEvent.js",
                    
					"lib/event/GameEvent.js",
					
					"lib/object/HitObject.js",
					"lib/object/CircleObject.js",
					"lib/object/SliderObject.js",
					"lib/object/SpinnerObject.js",
					
					"lib/player/Player.js",
					"lib/player/ThreePlayer.js",
					"lib/player/ScoreManager.js",
					
					"lib/math/Matrix3.js",
					"lib/replay/Replay.js",
					"lib/replay/ReplayLoader.js",
					
					"lib/skin/Skin.js",
					"lib/skin/SkinLoader.js"
				],
				dest : "ext/WOsu.js"
			}
		}
	});
	
	var tasks = [ "concat" ];
	tasks.map(function(t) { grunt.loadNpmTasks("grunt-contrib-" + t); });
	
	grunt.registerTask("default", tasks);
}