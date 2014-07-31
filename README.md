wosu
====

Web osu! library

This is a library based off of jQuery, three.js and lzma.js for reading and displaying osu! related files.

Wosu provides both data structures and functions for parsing beatmaps, storyboards and replays.

**Beatmaps**

    $.ajax({
        url : "beatmap.osu",
        dataType : "text"
    }).done(function(data) {
        var beatmap = WOsu.BeatmapLoader.load(data);
    });

Note: This library relies heavily on asynchronous calls.


**Storyboards** (incomplete - still need to port over from the osu! Storyboard Viewer)


**Pre-parsed JSON Replays**

    $.ajax({
        url : "replay.osr.json",
        dataType : "json"
    }).done(function(data) {
        var replay = new WOsu.Replay(data);
    });


**Raw Replays** (e.g. uploaded using GetReplay.php)

    var replay = WOsu.ReplayLoader.load(bytedata,finishCallback,progressCallback);

Note: Callbacks are required due to the way lzma.js works.



In addition it provides a web player based on three.js. WebGL is required, so Canvas fallback is not an option.

    var player = new WOsu.Player({
        width : width,
        height : height,
        
        progressCallback : progressCallback,
        completionCallback : completionCallback,
        errorCallback : errorCallback
    });
    
    player.load({
        replay : { type : "urL" , data : "replay.osr.json" },
        skin : "skinfolder"
    });

After loading, the three.js and audio player DOM elements may be retrieved as

    player.elements.three

and

    player.elements.audio

Finally, the player may be started using

    player.play();
