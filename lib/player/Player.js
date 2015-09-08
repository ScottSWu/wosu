/*
 * WOsu.Player
 *
 *
 */
WOsu.Player = function (options) {
    options = options || {};
    this.width = options.width || 640;
    this.height = options.height || 480;

    this.callback = {
        progress: options.progressCallback || function() { },
        completion: options.completionCallback || function() { },
        error: options.errorCallback || function() { }
    };
    
    this.elements = {
        audio: null,
        debug: null
    };

    this.skin = null;
    this.replay = null;
    this.beatmap = null;
    this.game = null;

    // Initialize the debugging scheme
    this.initDebug();
}

WOsu.Player.prototype.constructor = WOsu.Player;

WOsu.Player.prototype.setProgressCallback = function (callback) {
    this.callback.progress = callback;
}

WOsu.Player.prototype.setCompletionCallback = function (callback) {
    this.callback.completion = callback;
}

WOsu.Player.prototype.setErrorCallback = function (callback) {
    this.callback.error = callback;
}

WOsu.Player.prototype.initDebug = function () {
    var debug = document.createElement("div");
    var css = {
        "position": "absolute",
        "top": "20px",
        "left": "20px",

        "white-space": "pre-wrap",

        "font-family": "'Lucida Console', Monaco, monospace",
        "font-size": "24px",

        "color": "white",
        "text-shadow": "0px 0px 2px black"
    };
    for (var i in css) {
        debug.style[i] = css[i];
    }

    debug.buffer = "";
    debug.clear = function () {
        debug.buffer = "";
    };
    debug.write = function (i) {
        debug.buffer += i;
    };
    debug.update = function () {
        debug.innerHTML = debug.buffer;
    };

    this.elements.debug = debug;
}

WOsu.Player.prototype.load = function (options) {
    var instance = this;

    this.loaded = false;
    this.playing = false;

    this.api = WOsu.API;

    var layers = this.layers = options.layers || {
        storyboard: true,
        gameplay: false,
        replay: false,
        ui: false,
        stat: true
    };

    if (options.api) {
        if (options.api.trim() != "") {
            this.api = options.api.trim();
        }
    }
    
    if (this.api[this.api.length - 1] == "/") {
        this.api = this.api.substring(0, this.api.length - 1);
    }

    WOsu.resync(instance, [{ // Load skin
        fn: instance.loadSkin,
        args: [options.skin]
    }, { // Load replay
        fn: instance.loadReplay,
        args: [options.replay.type, options.replay.data]
    }], function () {
        instance.callback.progress("Replay", "Finished");

        // Load beatmap
        instance.loadBeatmap(function () {
            // Load gameplay variables
            instance.loadGameplay();

            WOsu.resync(instance, [{
                fn: instance.loadAudio
            }, {
                fn: instance.loadRenderer
            }], function () {
                instance.callback.completion();
            });
        });
    });

    // TODO Read storyboard
    // this.initStoryboard();
}

WOsu.Player.prototype.loadSkin = function (resyncFinish, loc) {
    var instance = this;

    // Progress callback for the skin loader
    var progress = function (loaded, total) {
        instance.callback.progress("Skin", loaded + " / " + total + " loaded");
        if (loaded == total) {
            instance.callback.progress("Skin", "Finished");
            resyncFinish();
        }
    };

    instance.skin = WOsu.SkinLoader.load(loc, progress);
}

WOsu.Player.prototype.loadReplay = function (resyncFinish, type, data) {
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
        ORV.debug.data = data;
        fd.append("replayFile", data.files[0]);
        $.ajax({
            url: "lib/GetReplay.php",
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            type: "POST",
        }).done(function (data) {
            try {
                var error = JSON.parse(data);
                localError(error.message);
            }
            catch (e) {
                instance.parseRawReplay(data, localFinish);
            }
        }).fail(function (data) {
            localError("Failed to upload replay");
        });
    }
    else {
        $.ajax({
            url: instance.api + "/get/" + B64.encode(encodeURI(data)),
            contentType: false,
            processData: false,
            type: "GET",
        }).done(function (data) {
            if (!instance.parseJSONReplay(data, localFinish)) {
                try {
                    var error = JSON.parse(data);
                    localError(error.message);
                }
                catch (e) {
                    instance.parseRawReplay(data, localFinish);
                }
            }
        }).fail(function (data) {
            localError("Failed to retrieve replay");
        });
    }
}

/**
    Parse a replay in binary osr format
 */
WOsu.Player.prototype.parseRawReplay = function (bytedata, finish) {
    var instance = this;
    this.callback.progress("Replay", "Loading raw replay");

    function progress(percent) {
        instance.callback.progress("Replay", "Loading raw replay (" + percent + "%)");
    }

    this.replay = WOsu.ReplayLoader.loadRawHex(bytedata, finish, progress);
}

/**
    Parse an pre-parsed replay in json format
 */
WOsu.Player.prototype.parseJSONReplay = function (data, finish) {
    var instance = this;
    this.callback.progress("Replay", "Loading JSON replay");

    try {
        this.replay = WOsu.ReplayLoader.loadJSON(JSON.parse(data));
        finish();

        return true;
    }
    catch (e) {
        return false;
    }
}

/**
    Parse replay information to proceed loading other resources
 */
WOsu.Player.prototype.parseReplayInfo = function () {
    var instance = this;
}

/**
    Load the beatmap from the API
    
    TODO Seperate from replay, load any beatmap by hash or name or whatever
*/
WOsu.Player.prototype.loadBeatmap = function (finish) {
    var instance = this;

    this.callback.progress("Beatmap", "Loading");

    function localFinish() {
        // TODO Transformations because of Easy/HR?
        // Hidden and Flashlight should go into the shaders
        // Technical calculations
        //instance.beatmap.loadMechanics(this.replay.mods);
        // TODO Include mods
        // Create and sort game events
        // instance.beatmap.loadEvents();
        //instance.beatmap.loadEvents(this.replay.mods);

        instance.callback.progress("Beatmap", "Finished");
        finish();
    }

    // Make sure the replay is loaded and it contains a beatmap hash
    if (this.replay && this.replay.type == 0 && this.replay.bhash.length == 32) {
        // Get beatmap metadata
        $.ajax({
            url: instance.api + "/" + this.replay.bhash,
            type: "GET",
        }).done(function (data) {
            instance.metadata = data;

            // Get beatmap data
            $.ajax({
                url: instance.api + "/" + instance.replay.bhash + "/R",
                contentType: false,
                processData: false,
                type: "GET",
            }).done(function (data) {
                // Load the beatmap
                instance.beatmap = WOsu.BeatmapLoader.load(data);

                localFinish();
            }).fail(function (data) {
                // In case the data comes as a typical xhr request (?)
                if (typeof (data) == "object" && data.readyState == 4 && data.status == 200) {
                    instance.beatmap = WOsu.BeatmapLoader.load(data.responseText);

                    localFinish();
                }
                else {
                    instance.beatmap = new WOsu.Beatmap();
                    instance.callback.progress("Beatmap", "Failed");
                }
            });
        }).fail(function (data) {
            instance.callback.error("Beatmap", "Error retreiving metadata");
        });
    }
    else {
        instance.callback.error("Beatmap", "Invalid replay");
    }
}

/**
    Load gameplay variables
*/
WOsu.Player.prototype.loadGameplay = function () {
    var mechanics = this.beatmap.loadMechanics(this.replay.mods);
    var events = this.beatmap.loadEvents(mechanics);

    this.game = {
        score: new WOsu.ScoreManager(mechanics),
        index: {
            eventIndex: 0,
            eventLength: events.length,
            replayIndex: 0,
            replayEdge: 0,
            replayLength: this.replay.replayData.length
        },
        mechanics: mechanics,
        events: events,
        currentCircles: [],
        currentSliders: [],
        currentSpinners: []
    };
}

WOsu.Player.prototype.loadAudio = function (loadResync) {
    this.callback.progress("Audio", "Loading");

    var audioElement = document.createElement("audio");
    audioElement.preload = "auto";
    audioElement.volume = 0.3;
    audioElement.setAttribute("src", this.api + "/" + this.metadata.song + "/R/" + this.beatmap.BeatmapData.AudioFilename);
    audioElement.setAttribute("controls", "controls");
    this.elements.audio = this.audio = audioElement;

    this.callback.progress("Audio", "Finished");

    loadResync();
}

// FUTURE Eventually most code after this will be separated into
//        gamemode specific files, e.g. StandardPlayer, TaikoPlayer, etc.
// FUTURE For ctb player, figure out how random positions are seeded

/**
    Load the renderer. This is the last step of the loading process.
*/
WOsu.Player.prototype.loadRenderer = function (loadResync) {
    loadResync();
}



WOsu.Player.prototype.play = function () {
    var instance = this;

    this.playing = true;
    this.audio.load();
    this.audio.addEventListener("canplay", function () {
        instance.audio.play();
    });

    this.frame();
}

WOsu.Player.prototype.frame = function (manualTime) {
    var instance = this;

    if (this.playing) {
        var time = 0;
        if (manualTime !== undefined) {
            time = manualTime;
        }
        else {
            this.audio.currentTime * 1000;
        }

        this.frame_storyboard(time);

        // Parse the replay first so scores are updated correctly
        this.frame_replay(time);

        // Update game uniforms
        this.frame_game(time);

        // Debug data
        this.frame_debug(time);
    }

    if (manualTime === undefined) {
        requestAnimationFrame(function () {
            instance.frame();
        });
    }
}

WOsu.Player.prototype.frame_game = function (time) {
    
}

// TODO Abstract scoring parts of the replay
WOsu.Player.prototype.frame_replay = function (time) {
    var replay = this.three.layers.replay.properties;
    var data = this.replay.replayData;
    var game = this.game;
    var index = this.game.index;
    var score = this.game.score;
    var bmm = this.game.mechanics;
    var events = this.game.events;

    while (index.replayIndex < index.replayLength) {
        var currReplay = data[index.replayIndex];
        var currKeys = currReplay.keys;
        var lastReplay = (index.replayIndex > 0) ? data[index.replayIndex - 1] : currReplay;
        var lastKeys = lastReplay.keys;

        var keyDown = lastKeys > 0;
        var keyPress = (WOsu.Replay.hasAction(currKeys, WOsu.Replay.M1) && !WOsu.Replay.hasAction(lastKeys, WOsu.Replay.M1)) || (WOsu.Replay.hasAction(currKeys, WOsu.Replay.M2) && !WOsu.Replay.hasAction(lastKeys, WOsu.Replay.M2));
        var keyRelease = (currKeys == 0) && (lastKeys > 0);

        // Advance through hold events (and missed events)
        var pass = true;
        while (index.eventIndex < index.eventLength && pass) {
            pass = false;
            var event = events[index.eventIndex];
            var timeDiff = currReplay.time - event.time;
            var distDiff = Math.sqrt((currReplay.x - event.x) * (currReplay.x - event.x) + (currReplay.y - event.y) * (currReplay.y - event.y));
            if (event.isType(WOsu.GameEvent.TYPE_CIRCLE)) {

                if (timeDiff > bmm.OD) {
                    // Missed hit circle
                    score.record0();
                    score.recordBreak();
                    console.log("Circle miss " + event.time);
                    pass = true;

                    var meshes = event.parent.data.meshes;
                    var times = new THREE.BufferAttribute(new Float32Array(WOsu.repeat(currReplay.time, 6)), 1);
                    var scores = new THREE.BufferAttribute(new Float32Array(WOsu.repeat(0, 6)), 1);
                    meshes.score.geometry.addAttribute("hitTime", times);
                    meshes.score.geometry.addAttribute("score", scores);
                    meshes.approach.geometry.addAttribute("hitTime", times);
                    meshes.circle.geometry.addAttribute("hitTime", times);
                }

            }
            else if (event.isType(WOsu.GameEvent.TYPE_SLIDER_START)) {

                if (timeDiff > bmm.OD) {
                    // Only the slider start is subject to od lock
                    console.log("Slider start miss");
                    score.recordBreak();
                    pass = true;
                    // Add to the current list of sliders
                    game.currentSliders.push(event.parent);

                    var times = new THREE.BufferAttribute(WOsu.repeatFloat(currReplay.time, 6), 1);
                    event.data.meshes.sliderFollow.geometry.addAttribute("hitTime", times);
                }

            }
            else if (event.isType(WOsu.GameEvent.TYPE_SLIDER_END)) {

                if (timeDiff >= -bmm.hit300) {
                    var hitScore = -1;
                    if (event.parent.data.hold) {
                        event.parent.data.hit++;
                        // Compute score
                        score.record30();
                        score.recordCombo();
                        if (event.parent.data.hit == event.parent.data.total) {
                            // All ticks hit
                            score.record300();
                            hitScore = 3;
                        }
                        else if (event.parent.data.hit * 2 >= event.parent.data.total) {
                            // At least half ticks hit
                            score.record100();
                            hitScore = 2;
                        }
                        else {
                            // At least one hit
                            score.record50();
                            hitScore = 1;
                        }
                        console.log(currReplay.time + " " + score.currentCombo + " " + "Slider hit");

                        var times = new THREE.BufferAttribute(WOsu.repeatFloat(currReplay.time, 6), 1);
                        event.parent.data.meshes.sliderFollow.geometry.addAttribute("releaseTime", times);
                    }
                    else {
                        if (event.parent.data.hit * 2 >= event.parent.data.total) {
                            // At least half ticks hit
                            score.record100();
                            hitScore = 2;
                        }
                        else if (event.parent.data.hit > 0) {
                            // At least one hit
                            score.record50();
                            hitScore = 1;
                        }
                        else {
                            // Completely missed
                            score.record0();
                            hitScore = 0;
                        }
                        console.log(currReplay.time + " " + score.currentCombo + " " + "Slider end missed");
                    }
                    pass = true;
                    // Remove from the current list of sliders
                    game.currentSliders.splice(game.currentSliders.indexOf(event.parent), 1);

                    var meshes = event.parent.data.meshes;
                    var times = new THREE.BufferAttribute(new Float32Array(WOsu.repeat(currReplay.time, 6)), 1);
                    var scores = new THREE.BufferAttribute(new Float32Array(WOsu.repeat(hitScore, 6)), 1);
                    meshes.score.geometry.addAttribute("hitTime", times);
                    meshes.score.geometry.addAttribute("score", scores);
                    meshes.approach.geometry.addAttribute("hitTime", times);
                    meshes.sliderStart.geometry.addAttribute("hitTime", times);
                    meshes.sliderEnd.geometry.addAttribute("hitTime", times);
                }

            }
            else if (event.isType(WOsu.GameEvent.TYPE_SLIDER)) {

                // Slider parts are immediate misses
                if (timeDiff > 0) {
                    if (event.parent.data.hold) { // Hit
                        if (event.isType(WOsu.GameEvent.TYPE_SLIDER_POINT)) {
                            score.record30();
                        }
                        else if (event.isType(WOsu.GameEvent.TYPE_SLIDER_TICK)) {
                            score.record10();
                        }
                        score.recordCombo();
                        event.parent.data.hit++;
                        pass = true;
                    }
                    else { // Miss
                        console.log("Slider break " + event.time);
                        score.recordBreak();
                        pass = true;
                    }
                }

            }
            else if (event.isType(WOsu.GameEvent.TYPE_SPINNER_START)) {

                if (timeDiff > 0) {
                    pass = true;
                    // Add to the current list of spinners
                    game.currentSpinners.push(event.parent);
                }

            }
            else if (event.isType(WOsu.GameEvent.TYPE_SPINNER_END)) {

                if (timeDiff > 0) {
                    // TODO Spinner end score
                    var spins = event.parent.data.spins;
                    var needed = event.parent.data.clear * bmm.spin;
                    var extra = spins - needed;
                    var hitScore = -1;
                    console.log(spins + " " + needed);
                    if (spins >= needed) {
                        // Completely cleared
                        score.record300();
                        score.recordSpin(~~(needed + 2 * extra));
                        score.recordBonus(~~(extra));
                        score.recordCombo();

                        hitScore = 3;
                    }
                    else if (spins >= needed - 0.5) {
                        // Almost cleared
                        score.record100();
                        score.recordSpin(~~spins);
                        score.recordCombo();

                        hitScore = 2;
                    }
                    else if (spins >= needed - 1.0) {
                        // Barely cleared
                        score.record50();
                        score.recordSpin(~~spins);
                        score.recordCombo();

                        hitScore = 1
                    }
                    else {
                        // Did not clear
                        score.record0();
                        score.recordSpin(~~spins);
                        score.recordBreak();

                        hitScore = 0;
                    }
                    pass = true;
                    // Remove from the current list of sliders
                    game.currentSpinners.splice(game.currentSpinners.indexOf(event.parent), 1);

                    var meshes = event.parent.data.meshes;
                    var times = new THREE.BufferAttribute(new Float32Array(WOsu.repeat(currReplay.time, 6)), 1);
                    var scores = new THREE.BufferAttribute(new Float32Array(WOsu.repeat(hitScore, 6)), 1);
                    meshes.score.geometry.addAttribute("hitTime", times);
                    meshes.score.geometry.addAttribute("score", scores);
                    meshes.spinner.geometry.addAttribute("hitTime", times);
                }

            }
            else {
                pass = true;
            }

            if (pass) {
                index.eventIndex++;
            }
        }

        // Check for edges (circles and slider starts)
        if (index.eventIndex < index.eventLength && keyPress && index.replayEdge <= index.replayIndex) { // Rising edge

            var event = events[index.eventIndex];
            var timeDiff = Math.abs(event.time - currReplay.time);
            var distDiff = Math.sqrt((currReplay.x - event.x) * (currReplay.x - event.x) + (currReplay.y - event.y) * (currReplay.y - event.y));
            if (event.isType(WOsu.GameEvent.TYPE_CIRCLE) && distDiff < bmm.CS) {

                var hitScore = -1;
                if (timeDiff < bmm.hit300) {
                    score.record300();
                    score.recordCombo();
                    index.eventIndex++;

                    hitScore = 3;
                }
                else if (timeDiff < bmm.hit100) {
                    score.record100();
                    score.recordCombo();
                    index.eventIndex++;

                    hitScore = 2;
                }
                else if (timeDiff < bmm.hit50) {
                    score.record50();
                    score.recordCombo();
                    index.eventIndex++;

                    hitScore = 1;
                }
                else {
                    // TODO Circles miss if too early (?)
                }
                console.log(event.time + " " + "Circle hit" + " " + score.currentCombo + " " + distDiff + " " + timeDiff);

                event.data.finish = true;

                var meshes = event.parent.data.meshes;
                var times = new THREE.BufferAttribute(WOsu.repeatFloat(currReplay.time, 6), 1);
                var scores = new THREE.BufferAttribute(WOsu.repeatFloat(hitScore, 6), 1);
                meshes.score.geometry.addAttribute("hitTime", times);
                meshes.score.geometry.addAttribute("score", scores);
                meshes.approach.geometry.addAttribute("hitTime", times);
                meshes.circle.geometry.addAttribute("hitTime", times);

            }
            else if (event.isType(WOsu.GameEvent.TYPE_SLIDER_START) && distDiff <= bmm.CS) {

                if (timeDiff < bmm.OD) {
                    event.parent.data.hit++;
                    event.parent.data.hold = true;
                    score.record30();
                    score.recordCombo();
                    index.eventIndex++;

                    var times = new THREE.BufferAttribute(WOsu.repeatFloat(currReplay.time, 6), 1);
                    event.parent.data.meshes.sliderFollow.geometry.addAttribute("hitTime", times);
                }
                else if (timeDiff < bmm.AR) {
                    // Hitting too early counts as a miss
                    console.log(currReplay.time + " Slider start early");
                    score.recordBreak();
                    index.eventIndex++;
                }
                // Add to the current list of sliders
                game.currentSliders.push(event.parent);

            }

            index.replayEdge = index.replayIndex + 1;

        }
        else if (keyRelease) { // Complete falling edge

            // TODO
            index.replayEdge = index.replayIndex + 1;

        }

        // Detect any non-fixed events:
        //     Slider breaks by moving out of the circle or lifting up the key
        //     Slider holds by keydown over the slider
        //     Spinner spinning
        var keyStillDown = currKeys > 0; // Keydown referring to the current time
        for (var i = 0; i < game.currentSliders.length; i++) {
            var slider = game.currentSliders[i];
            var distance = slider.gameObject.getDistance(currReplay.time, currReplay.x, currReplay.y);
            if (slider.data.hold) {
                // TODO Verify the 3 constant
                // TODO Move constants into mechanics
                if (keyRelease || distance > 3 * bmm.CS) {
                    slider.data.hold = false;
                    console.log(currReplay.time + " Slider let go " + keyRelease + " " + distance);

                    var times = new THREE.BufferAttribute(WOsu.repeatFloat(currReplay.time, 6), 1);
                    slider.data.meshes.sliderFollow.geometry.addAttribute("releaseTime", times);
                }
            }
            else {
                if (keyStillDown && distance <= bmm.CS) {
                    slider.data.hold = true;

                    var times = new THREE.BufferAttribute(WOsu.repeatFloat(currReplay.time, 6), 1);
                    slider.data.meshes.sliderFollow.geometry.addAttribute("hitTime", times);
                }
            }
        }
        if (game.currentSpinners.length > 0) {
            var spinner = game.currentSpinners[0];
            if (keyDown && keyStillDown) {
                // Compute spin amount
                var lastAngle = Math.atan2(192 - lastReplay.y, lastReplay.x - 256);
                var currAngle = Math.atan2(192 - currReplay.y, currReplay.x - 256);
                var diff = (Math.abs(lastAngle - currAngle) / (2.0 * Math.PI)) % 1.0;
                diff = (diff > 0.5) ? 1.0 - diff : diff;

                // Add weighted difference to samples
                var dt = currReplay.time - lastReplay.time;
                var samples = spinner.data.samples;

                samples.push([currReplay.time, diff * dt]);
                spinner.data.sampleTotal += diff * dt;

                // Restrict sampling to 1 seconds (?) unmeasured
                while (samples.length > 0 && currReplay.time - samples[0][0] > 1000) {
                    spinner.data.sampleTotal -= samples[0][1];
                    samples.shift();
                }
                var spins = spinner.data.sampleTotal / 1000;
                // Limit to 477 spins per minute (?)
                speed = 60000.0 * spins / dt;
                if (speed > 477) {
                    spins = 477 * dt / 60000.0;
                }
                spinner.data.spins += spins;
            }
        }

        // Advance replay
        if (index.replayIndex < index.replayLength - 1 && time > data[index.replayIndex + 1].time) {
            index.replayIndex++;
        }
        else {
            break;
        }
    }

    // Get the current and next sets of replay data
    var rd = data[index.replayIndex];
    var nd = (index.replayIndex === index.replayLength - 1) ? rd : data[index.replayIndex + 1];

    // Transform to cartesian coordinates
    var p1 = new THREE.Vector3(rd.x - 256, 192 - rd.y, 0);
    var p2 = new THREE.Vector3(nd.x - 256, 192 - nd.y, 0);

    // Compute interpolation between the sets
    var interp = (nd.time - rd.time === 0) ? 0 : (time - rd.time) / (nd.time - rd.time);
    var cursor = replay.cursorMesh;
    cursor.position.lerpVectors(p1, p2, interp);

    // Set cursor uniforms
    var uniforms = cursor.material.uniforms;
    uniforms.currentTime.value = time;
    uniforms.isHit.value = (rd.keys > 0) ? 1 : 0;
    uniforms.hitTime.value = (rd.keys > 0) ? rd.time : rd.lastReleaseTime;
}

WOsu.Player.prototype.frame_storyboard = function (time) {
    // TODO Storyboard
}

WOsu.Player.prototype.frame_debug = function (time) {
    var debug = this.elements.debug;
    debug.clear();

    debug.write("Time: " + time.toFixed(0) + "\n");
    debug.write("\n");

    var score = this.game.score;
    debug.write("Score:    " + score.totalScore + "\n");
    debug.write("Accuracy: " + (score.getAccuracy() * 100).toFixed(2) + "%\n");
    debug.write("Combo:    " + score.currentCombo + "\n");
    debug.write("\n");

    var cursor = this.replay.replayData[this.game.index.replayIndex];
    debug.write("Cursor X: " + cursor.x.toFixed(0) + "\n");
    debug.write("Cursor Y: " + cursor.y.toFixed(0) + "\n");
    var k1 = ((cursor.keys % 2) > 0);
    var k2 = ((cursor.keys % 4) > 1);
    debug.write("Keys: ");
    debug.write((k1 ? "<u>" : "") + "K1" + (k1 ? "</u>" : "") + " ");
    debug.write((k2 ? "<u>" : "") + "K2" + (k2 ? "</u>" : "") + " ");
    debug.write("\n");

    debug.update();
}
