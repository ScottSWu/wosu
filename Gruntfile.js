module.exports = function(grunt) {
	grunt.initConfig({
		pkg : grunt.file.readJSON("package.json"),
		
		concat : {
			build : {
				src : [
					"lib/**.js"
				],
				dest : "ext/WOsu.js"
			}
		}
	});
	
	var tasks = [ "concat" ];
	tasks.map(function(t) { grunt.loadNpmTasks("grunt-contrib-" + t); });
	
	
	grunt.registerTask("default", tasks);
}