/*
    WOsu three.js local player (nodejs)
*/
WOsu.LocalThreePlayer = function (options) {
    WOsu.ThreePlayer.call(this, options);
}

WOsu.LocalThreePlayer.prototype = Object.create(WOsu.ThreePlayer.prototype);

WOsu.LocalThreePlayer.prototype.constructor = WOsu.LocalThreePlayer;

/*
    Rewrite the load function to load local files
*/
WOsu.LocalThreePlayer.prototype.load = function (options) {
    var instance = this;

    this.loaded = false;
    this.playing = false;

    var layers = this.layers = options.layers || {
        storyboard: true,
        gameplay: false,
        replay: false,
        ui: false,
        stat: true
    };
    
    this.beatmap = options.beatmap;
    this.replay = options.replay;
    this.skin = options.skin;
    this.metadata = {
        song: options.song
    };
    
    this.loadGameplay();
    this.loadRenderer(function() {
        instance.playing = true;
        instance.callback.completion();
    });
}

/**
    Load Three.js elements for display the storyboard.
    
    // TODO loadThreeStoryboard
*/
WOsu.LocalThreePlayer.prototype.loadThreeStoryboard = function (threeResync) {
    var storyboard = new THREE.Object3D();
    var bgpath = "";
    var bme = this.beatmap.BeatmapEvents.BackgroundEvents;
    for (var i = 0; i < bme.length; i++) {
        if (bme[i].type == WOsu.Event.TYPE_BACKGROUND) {
            bgpath = this.metadata.song + "\\" + bme[i].media;
            break;
        }
    }

    if (bgpath != "") {
        var data = fs.readFileSync(bgpath);
        var dataurl = data.toString("base64");

        var image = document.createElement("img");
        var extension = bgpath.substring(bgpath.lastIndexOf(".") + 1);
        image.src = "data:image/" + extension + ";base64," + dataurl;
        
        var bgtex = new THREE.Texture(image);
        bgtex.needsUpdate = true;
        bgtex.minFilter = THREE.LinearFilter;
        bgtex.magFilter = THREE.LinearFilter;
        
        var background = this.createThreeQuad({
            x: 0,
            y: 0,
            z: -1e4, // This goes in the very back
            width: this.beatmap.BeatmapData.WidescreenStoryboard ? 640 : 850,
            height: 480,
            color: new THREE.Vector4(0.5, 0.5, 0.5, 1.0),
            texture: bgtex
        });

        storyboard.background = background;
        storyboard.add(background);
    }

    this.three.layers.storyboard = {
        object: storyboard,
        properties: {}
    };

    threeResync();
}
