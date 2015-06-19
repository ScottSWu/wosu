wosu
====

Web osu! library.

This is a library primarily based off of three.js and lzma.js for reading and displaying osu! related files.

An example of this library in use can be found [here](http://sc-wu.com/p/wosu/).



Structures
----

**Beatmaps**

    var beatmap = WOsu.BeatmapLoader.load(textData);

Where `textData` are raw contents of an `.osu` file. Currently, only standard maps are supported. Other maps will probably throw an error when reading objects.


**Storyboards** (incomplete - still need to port over from the osu! Storyboard Viewer)


**Raw Replays** (e.g. uploaded using GetReplay.php)

    var replay = WOsu.ReplayLoader.load(byteData, finishCallback, progressCallback);

Where `byteData` is a string of hexadecimal characters. The two callbacks are used by lzma.js's web workers.


**Pre-parsed JSON Replays**

    var replay = new WOsu.ReplayLoader.loadJSON(jsonData);

Old method of obtaining replays before lzma.js.


**Beatmap API**

This library uses an API to identify replays and retrieve beatmap resources. Currently it is using a barebones API [here](https://github.com/ScottSWu/wosu-api).

- `/[0-9a-f]{32}` returns data in json format about a single beatmap or song. Beatmaps are hashed by content. Songs are hashed by name (just as they are downloaded from osu!).
- `/[0-9a-f]{32}/R` returns raw text data about a beatmap or song. Text data of a song gives a list of all files in the folder.
- `/[0-9a-f]{32}/R/*` returns any file in the song folder.


Player
----

*This section needs to be updated*

A player is available using,

    var player = new WOsu.Player({
        width : width,
        height : height,
        
        progressCallback : progressCallback,
        completionCallback : completionCallback,
        errorCallback : errorCallback
    });
    
    player.load({
        replay : { type : "url" , data : "replay.osr" },
        skin : "skinfolder"
    });

After loading, the three.js and audio player DOM elements may be retrieved as

    player.elements.three

and

    player.elements.audio

Finally, the player may be started using

    player.play();


Development
----

Use grunt to concatenate and map all files. However, since certain files need to be in the right order, each file is currently listed within the Gruntfile.
Grunt concatenates all scripts in `lib` into `ext/WOsu.js` and `ext/WOsu.js.map`.
