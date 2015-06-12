/*
 * WOsu.Player
 *
 *
 */
WOsu.Player = function(options) {
    this.width = options.width || 640;
    this.height = options.height || 480;

    this.callback = {
        progress: options.progressCallback,
        completion: options.completionCallback,
        error: options.errorCallback
    };

    this.skin = null;
    this.replay = null;
    this.beatmap = null;
    this.game = null;

    this.elements = {
        audio: null,
        three: null
    };

    // Initialize Three.js
    this.initThree();
}

WOsu.Player.prototype.constructor = WOsu.Player;

WOsu.Player.prototype.initThree = function() {
    var instance = this;

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(this.width, this.height);

    // Need to scale to at least 640 x 480 units
    var ratio = this.height / this.width;
    var camera;
    if (ratio > 0.75) { // Width limit
        camera = new THREE.OrthographicCamera(-320, 320, 320 * ratio, -320 * ratio, 1, 1e9);
    } else { // Height limit
        camera = new THREE.OrthographicCamera(-240 / ratio, 240 / ratio, 240, -240, 1, 1e9);
    }
    camera.position.set(0, 0, 2);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var light = new THREE.AmbientLight(0xFFFFFF);

    this.three = {
        renderer: renderer,
        camera: camera,
        light: light,
        status: ""
    };

    this.elements.three = renderer.domElement;
}

WOsu.Player.prototype.load = function(options) {
    var instance = this;

    this.loaded = false;
    this.playing = false;

    this.api = WOsu.API;

    console.log(options);

    if (options.api && options.api.trim() != "") {
        this.api = options.api.trim();
    }
    if (this.api[this.api.length - 1] == "/") {
        this.api = this.api.substring(0, this.api.length - 1);
    }

    var layers = this.layers = options.layers || {
        storyboard: true,
        gameplay: false,
        replay: false,
        ui: false,
        stat: true
    };

    WOsu.resync(instance, [{ // Load skin
        fn: instance.loadSkin,
        args: [options.skin]
    }, { // Load replay
        fn: instance.loadReplay,
        args: [options.replay.type, options.replay.data]
    }], function() {
        instance.callback.progress("Replay", "Finished");

        instance.loadBeatmap(function() {
            WOsu.resync(instance, [{
                fn: instance.loadAudio,
                args: []
            }, {
                fn: instance.loadThree,
                args: []
            }], function() {
                instance.callback.completion();
            });
        });
    });

    // TODO Read storyboard
    // this.initStoryboard();
}

WOsu.Player.prototype.setProgressCallback = function(callback) {
    this.callback.progress = callback;
}

WOsu.Player.prototype.setCompletionCallback = function(callback) {
    this.callback.completion = callback;
}

WOsu.Player.prototype.setErrorCallback = function(callback) {
    this.callback.error = callback;
}

WOsu.Player.prototype.loadSkin = function(resyncFinish, loc) {
    var instance = this;

    // Progress callback for the skin loader
    var progress = function(loaded, total) {
        instance.callback.progress("Skin", loaded + " / " + total + " loaded");
        if (loaded == total) {
            instance.callback.progress("Skin", "Finished");
            resyncFinish();
        }
    };

    instance.skin = WOsu.SkinLoader.load(loc, progress);
}

WOsu.Player.prototype.loadReplay = function(resyncFinish, type, data) {
    var instance = this;
    this.callback.progress("Replay", "Loading replay");

    // When finished, parse the replay info and call the callback
    function localFinish(success) {
        instance.parseReplayInfo();
        resyncFinish();
    }

    // Failure
    function localError(message) {
        instance.callback.error("Replay", message);
    }

    if (type == "file") {
        var fd = new FormData();
        fd.append("replayFile", data.files[0]);
        $.ajax({
            url: "lib/GetReplay.php",
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            type: "POST",
        }).done(function(data) {
            try {
                var error = JSON.parse(data);
                localError(error.message);
            } catch (e) {
                instance.parseRawReplay(data, localFinish);
            }
        }).fail(function(data) {
            localError("Failed to upload replay");
        });
    } else {
        $.ajax({
            url: instance.api + "/get/" + B64.encode(encodeURI(data)),
            contentType: false,
            processData: false,
            type: "GET",
        }).done(function(data) {
            if (!instance.parseJSONReplay(data, localFinish)) {
                try {
                    var error = JSON.parse(data);
                    localError(error.message);
                } catch (e) {
                    instance.parseRawReplay(data, localFinish);
                }
            }
        }).fail(function(data) {
            localError("Failed to retrieve replay");
        });
    }
}

/**
    Parse a replay in binary osr format
 */
WOsu.Player.prototype.parseRawReplay = function(bytedata, finish) {
    var instance = this;
    this.callback.progress("Replay", "Loading raw replay");

    function progress(percent) {
        instance.callback.progress("Replay", "Loading raw replay (" + percent + "%)");
    }

    this.replay = WOsu.ReplayLoader.loadRaw(bytedata, finish, progress);
}

/**
    Parse an pre-parsed replay in json format
 */
WOsu.Player.prototype.parseJSONReplay = function(data, finish) {
    var instance = this;
    this.callback.progress("Replay", "Loading JSON replay");

    try {
        this.replay = WOsu.ReplayLoader.loadJSON(JSON.parse(data));
        finish();

        return true;
    } catch (e) {
        return false;
    }
}

/**
    Parse replay information to proceed loading other resources
 */
WOsu.Player.prototype.parseReplayInfo = function() {
    var instance = this;

    // NOTE DEBUGGING
    console.log(this.replay);
}

WOsu.Player.prototype.loadBeatmap = function(finish) {
    var instance = this;

    this.callback.progress("Beatmap", "Loading");

    function localFinish() {
        instance.callback.progress("Beatmap", "Success");
        instance.calculateBeatmap();
        finish();
    }

    // Make sure the replay is loaded and it contains a beatmap hash
    if (this.replay && this.replay.type == 0 && this.replay.bhash.length == 32) {
        // Get beatmap metadata
        $.ajax({
            url: instance.api + "/" + this.replay.bhash,
            type: "GET",
        }).done(function(data) {
            instance.metadata = data;

            // Get beatmap data
            $.ajax({
                url: instance.api + "/" + instance.replay.bhash + "/R",
                contentType: false,
                processData: false,
                type: "GET",
            }).done(function(data) {
                // Load the beatmap
                instance.beatmap = WOsu.BeatmapLoader.load(data);

                localFinish();
            }).fail(function(data) {
                // In case the data comes as a typical xhr request (?)
                if (typeof(data) == "object" && data.readyState == 4 && data.status == 200) {
                    instance.beatmap = WOsu.BeatmapLoader.load(data.responseText);


                    localFinish();
                } else {
                    instance.beatmap = new WOsu.Beatmap();
                    instance.callback.progress("Beatmap", "Failed");
                }
            });
        }).fail(function(data) {
            instance.callback.error("Beatmap", "Error retreiving metadata");
        });
    } else {
        instance.callback.error("Beatmap", "Invalid replay");
    }
}

WOsu.Player.prototype.calculateBeatmap = function() {
    this.callback.progress("Beatmap", "Calculating beatmap mechanics");

    this.beatmap.calculate();

    this.callback.progress("Beatmap", "Finished");
}

WOsu.Player.prototype.loadAudio = function(resyncFinish) {
    this.callback.progress("Audio", "Loading");

    var audioElement = document.createElement("audio");
    audioElement.preload = "auto";
    audioElement.volume = 0.3;
    audioElement.setAttribute("src", this.api + "/" + this.metadata.song + "/R/" + this.beatmap.BeatmapData.AudioFilename);
    audioElement.setAttribute("controls", "controls");
    this.elements.audio = this.audio = audioElement;

    this.callback.progress("Audio", "Finished");

    resyncFinish();
}

WOsu.Player.prototype.loadThree = function(resyncFinish) {
    var instance = this;

    this.callback.progress("Three", "Loading objects");
    
    // Scene
    var scene = new THREE.Scene();
    scene.add(this.three.camera);
    scene.add(this.three.light);

    // Game
    var game = {};

    // Storyboard (background only for now)
    var storyboard = new THREE.Object3D(); {
        var bgpath = "";
        var bme = this.beatmap.BeatmapEvents.BackgroundEvents;
        for (var i = 0; i < bme.length; i++) {
            if (bme[i].type == WOsu.Event.TYPE_BACKGROUND) {
                bgpath = this.api + "/" + this.metadata.song + "/R/" + bme[i].media;
                break;
            }
        }

        if (bgpath != "") {
            var bgtex = THREE.ImageUtils.loadTexture(bgpath);
            var background = WOsu.create_quad_mesh({
                x: 0,
                y: 0,
                z: -this.beatmap.BeatmapObjects.length - 10,
                width: 640,
                height: 480,
                color: new THREE.Vector4(0.5, 0.5, 0.5, 1),
                texture: bgtex
            });
        }

        storyboard.background = background;
        storyboard.add(background);
    }

    // Hit objects
    var gameplay = new THREE.Object3D(); {
        var bme = this.beatmap.BeatmapEvents.BackgroundEvents;
        var bmo = this.beatmap.BeatmapObjects;
        var bmm = this.beatmap.BeatmapMechanics;
        var textures = ORV.player.skin.textures;

        game.objects = [];
        game.start = 0;
        game.end = 0;
        game.colors = bme.Colours || [
            [0xFF, 0x80, 0x80],
            [0x80, 0xFF, 0x00],
            [0x00, 0x80, 0xC0],
            [0xFF, 0xFF, 0x80]
        ];

        var total = bmo.length;
        var cobj, objs;
        var lastPosition = new THREE.Vector3(-1, -1, 0);
        var offset = new THREE.Vector3(0, 0, 0);
        var comboColor = 0;
        var comboNumber = 1;

        for (var i = 0; i < total; i++) {
            cobj = bmo[i];
            if (cobj.time < bmm.AR) game.end++;

            if (lastPosition.x == cobj.endX && lastPosition.y == cobj.endY) {
                offset.x += 4;
                offset.y -= 4;
            } else {}

            offset.x = 0;
            offset.y = 0;
            offset.z = -i - 1;
            lastPosition.x = cobj.endX;
            lastPosition.y = cobj.endY;

            if (cobj.isComboChange()) {
                comboColor++;
                comboNumber = 1;
            }
            cobj.combo = comboColor % game.colors.length;
            cobj.comboNumber = comboNumber;

            if (cobj.isBeat()) {
                objs = WOsu.create_beat(cobj, offset, game.colors[cobj.combo], bmm, textures);
            } else if (cobj.isSlider()) {
                objs = WOsu.create_slider(cobj, offset, game.colors[cobj.combo], bmm, textures);
            } else if (cobj.isSpinner()) {
                objs = WOsu.create_spinner(cobj, offset, game.colors[cobj.combo], bmm, textures);
            }

            comboNumber++;

            game.objects.push(objs);
        }

        for (var i = 0; i < game.end; i++) {
            gameplay.add(game.objects[i].main);
        }

        this.game = game;
    }

    // Replay
    var replay = new THREE.Object3D(); {
        game.replay = {
            index: 0
        };

        if (this.layers.replay) {
            game.replay.cursor = WOsu.create_cursor(textures);
            replay.add(game.replay.cursor._main);
        }
    }

    // UI
    var ui = new THREE.Object3D(); {}

    // Stat
    var stat = new THREE.Object3D(); {}

    this.three.layers = {
        storyboard: storyboard,
        gameplay: gameplay,
        replay: replay,
        ui: ui,
        stat: stat
    };

    for (var l in this.layers) {
        scene.add(this.three.layers[l]);

        if (!this.layers[l]) {
            this.three.layers[l].traverse(function(o) {
                o.visible = true;
            });
        }
    }

    this.three.scene = scene;

    this.callback.progress("Three", "Finished");

    resyncFinish();
}

WOsu.Player.prototype.play = function() {
    var instance = this;
    this.playing = true;

    this.playing = true;
    this.audio.load();
    this.audio.addEventListener("canplay", function() {
        instance.audio.play();
    });

    function frame() {
        requestAnimationFrame(frame);

        if (instance.playing) {
            var time = instance.audio.currentTime * 1000;
            instance.frame_game(time);
            instance.frame_replay(time);
        }

        instance.three.renderer.render(instance.three.scene, instance.three.camera);
    }

    frame();
}

WOsu.Player.prototype.frame_game = function(time) {
    var game = this.game;
    var hobj, gobj, cobj, dt, op;

    for (var i = game.start; i < game.end; i++) {
        hobj = this.beatmap.BeatmapObjects[i];
        gobj = game.objects[i];
        dt = hobj.time - time;

        if (dt >= 0 && dt <= this.beatmap.BeatmapMechanics.AR) {
            op = 1 - dt / this.beatmap.BeatmapMechanics.AR;
            for (var j in gobj) {
                if (j[0] != "_") {
                    for (var k = 0; k < gobj[j].geometry.vertices.length; k++) {
                        gobj[j].attributes.wosuColor.value[k].w = op;
                    }
                    gobj[j].attributes.wosuColor.needsUpdate = true;
                }
            }
            gobj._opaque = false;
            if (hobj.isBeat()) {
                gobj.approachcircle.scale.set(3 - op * 2, 3 - op * 2, 1);
            } else if (hobj.isSlider()) {
                gobj.approachcircle.scale.set(3 - op * 2, 3 - op * 2, 1);
                gobj.slider_ball.visible = false;
                gobj.slider_follow.visible = false;
            }
        } else {
            if (hobj.isBeat() || hobj.isSlider()) {
                gobj.approachcircle.visible = false;
                if (!gobj._opaque) {
                    gobj._opaque = true;
                    for (var j in gobj) {
                        if (j[0] != "_") {
                            for (var k = 0; k < gobj[j].geometry.vertices.length; k++) {
                                gobj[j].attributes.wosuColor.value[k].w = 1;
                            }
                            gobj[j].attributes.wosuColor.needsUpdate = true;
                        }
                    }
                }
            }
            if (hobj.endTime - time < -this.beatmap.BeatmapMechanics.AR) {
                this.three.scene.remove(game.objects[game.start]._main);
                game.start++;
            } else if (hobj.endTime - time < 0) {
                op = (1 - Math.abs((time - hobj.endTime) / this.beatmap.BeatmapMechanics.AR * 2 - 1)) * 0.5;
                for (var k = 0; k < gobj._lighting.geometry.vertices.length; k++) {
                    gobj._lighting.attributes.wosuColor.value[k].w = op;
                }
                gobj._lighting.attributes.wosuColor.needsUpdate = true;
                var sop = (time - hobj.endTime) / this.beatmap.BeatmapMechanics.AR * 0.1 + 2;
                gobj._lighting.scale.set(sop, sop, 1);

                for (var j in gobj) {
                    if (j[0] != "_") {
                        gobj[j].visible = false;
                    }
                }
            } else {
                if (hobj.isSlider()) { // Slider Ball
                    gobj.slider_ball.visible = true;
                    gobj.slider_follow.visible = true;
                    var pos = hobj.getPosition(time);
                    gobj.slider_ball.position.set(pos[0] - hobj.x, hobj.y - pos[1], 0.3);
                    gobj.slider_follow.position.set(pos[0] - hobj.x, hobj.y - pos[1], 0.35);
                } else if (hobj.isSpinner()) { // Spinner Approach Circle
                    op = (time - hobj.time) / hobj.spinnerTime;
                    gobj.spinner_approachcircle.scale.set(1 - op, 1 - op, 1);
                }
            }
        }
    }

    // Add appearing objects
    hobj = this.beatmap.BeatmapObjects[game.end];
    if (hobj != undefined && hobj.time - time < this.beatmap.BeatmapMechanics.AR && game.end < this.beatmap.BeatmapObjects.length) {
        var gobj = game.objects[game.end];
        this.three.scene.add(gobj._main);
        game.end++;
    }
}

WOsu.Player.prototype.frame_replay = function(time) {
    var rpo = this.replay; // Replay object
    var rpg = this.game.replay; // Replay game data
    var rpl = this.three.layers.replay; // Replay THREE objects

    while (rpg.index < rpo.replayData.length - 1 && time > rpo.replayData[rpg.index + 1][0]) {
        rpg.index++;
    }

    var rd = rpo.replayData[rpg.index];
    var nd;
    if (rpg.index == rpo.replayData.length - 1) nd = rd;
    else nd = rpo.replayData[rpg.index + 1];

    var p1 = new THREE.Vector3(rd[1] - 256, 192 - rd[2], 0);
    var p2 = new THREE.Vector3(nd[1] - 256, 192 - nd[2], 0);
    var interp = (nd[0] - rd[0] == 0) ? 0 : (time - rd[0]) / (nd[0] - rd[0]);

    var cursor = rpg.cursor._main;
    cursor.position.set(p1.x * (1 - interp) + p2.x * interp, p1.y * (1 - interp) + p2.y * interp, 0);

    var cscale = cursor.scale.x;
    if (rd[3] > 0 && cscale < 1.4) {
        cscale += 0.05;
    } else if (rd[3] == 0 && cscale > 1.0) {
        cscale -= 0.05;
    }
    cursor.scale.set(cscale, cscale, 1);
}