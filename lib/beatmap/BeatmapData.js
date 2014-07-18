WOsu.BeatmapData = function() {
	// Program variables
	this.head = "";
	this.AudioElement = null;
	this.BeatMapFileName = "";
	this.SongFileName = "";
	
	// General
	this.AudioFilename = "";
	this.AudioLeadIn = 0;
	this.PreviewTime = 0;
	this.Countdown = false;
	this.SampleSet = "";
	this.StackLeniency = 1;
	this.Mode = 0;
	this.LetterboxInBreaks = false;
	
	// Editor
	this.EditorBookmarks = null;
	this.DistanceSpacing = 1;
	this.BeatDivisor = 4;
	this.GridSize = 4;
	
	// Metadata
	this.Title = "";
	this.Artist = "";
	this.Creator = "";
	this.Version = "";
	this.Source = "";
	this.Tags = "";
	
	// Difficulty
	this.HPDrainRate = 5;
	this.CircleSize = 5;
	this.OverallDifficulty = 5;
	this.ApproachRate = 5;
	this.SliderMultiplier = 1;
	this.SliderTickRate = 1;
}
