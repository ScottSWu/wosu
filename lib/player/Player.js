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

    // New renderer, no sorting
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(this.width, this.height);
    renderer.sortObjects = false;

    // Three.js Scene
    var scene = new THREE.Scene();
    
    // Rendering target for effects
    var target = new THREE.WebGLRenderTarget(this.width, this.height, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat });
    
    // Allow cross origin loading (?)
    THREE.ImageUtils.crossOrigin = '';
    
    // Need to scale to at least 640 x 480 units
    var ratio = this.height / this.width;
    var camera;
    if (ratio > 0.75) { // Width limit
        camera = new THREE.OrthographicCamera(-320, 320, 320 * ratio, -320 * ratio, 1, 1e5);
    } else { // Height limit
        camera = new THREE.OrthographicCamera(-240 / ratio, 240 / ratio, 240, -240, 1, 1e5);
    }
    camera.position.set(0, 0, 2);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.three = {
        renderer: renderer,
        camera: camera,
        scene: scene,
        target: target
    };
    
    // TODO handle resizing

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
        instance.callback.progress("Beatmap", "Finished");
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

WOsu.Player.prototype.loadAudio = function(loadResync) {
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

WOsu.Player.prototype.loadThree = function(loadResync) {
    var instance = this;

    this.callback.progress("Three", "Loading objects");

    this.three.layers = {};
    this.game = {};
    
    this.three.materials = {};

    WOsu.resync(instance, [{
        fn: instance.loadThreeStoryboard
    }, {
        fn: instance.loadThreeGameplay
    }, {
        fn: instance.loadThreeReplay
    }, {
        fn: instance.loadThreeUI
    }, {
        fn: instance.loadThreeStatistics
    }], function() {
        // Finish up
        instance.loadThreeScene();

        instance.callback.progress("Three", "Finished");

        loadResync();
    });
}

/**
    Load Three.js elements for display the storyboard.
    
    // TODO loadThreeStoryboard
*/
WOsu.Player.prototype.loadThreeStoryboard = function(threeResync) {
    var storyboard = new THREE.Object3D();
    var bgpath = "";
    var bme = this.beatmap.BeatmapEvents.BackgroundEvents;
    for (var i = 0; i < bme.length; i++) {
        if (bme[i].type == WOsu.Event.TYPE_BACKGROUND) {
            bgpath = this.api + "/" + this.metadata.song + "/R/" + bme[i].media;
            break;
        }
    }

    if (bgpath != "") {
        var background = this.createThreeQuad({
            x: 0,
            y: 0,
            z: 0,
            width: 640,
            height: 480,
            color: new THREE.Vector4(0.5, 0.5, 0.5, 1.0),
            texture: THREE.ImageUtils.loadTexture(bgpath)
        });

        storyboard.background = background;
        storyboard.add(background);
    }

    this.three.layers.storyboard = storyboard;

    threeResync();
}

/**
    Load Three.js elements for displaying the gameplay.
    
    // TODO Make this super more efficient by consolidating all objects into a flat array.
*/
WOsu.Player.prototype.loadThreeGameplay = function(threeResync) {
    // Hit objects
    var gameplay = new THREE.Object3D();
    var bme = this.beatmap.BeatmapEvents.BackgroundEvents;
    var bmo = this.beatmap.BeatmapObjects;
    var bmm = this.beatmap.BeatmapMechanics;
    var textures = this.skin.textures;
    
    var circleUniforms = {
        currentTime: { type: 'f', value: Number.NEGATIVE_INFINITY },
        approachRate: { type: 'f', value: bmm.AR },
        overallDifficulty: { type: 'f', value: bmm.OD },

        hitcircle: { type: 't', value: textures.hitcircle },
        hitcircle_overlay: { type: 't', value: textures.hitcircle_overlay },
        digits: { type: 'tv', value: [
            textures.score_0,
            textures.score_1,
            textures.score_2,
            textures.score_3,
            textures.score_4,
            textures.score_5,
            textures.score_6,
            textures.score_7,
            textures.score_8,
            textures.score_9
        ]}
    };
    var circleAttributes = {
        colorMask: { type: 'v4', value: [] },
        hitTime: { type: 'f', value: [] },
        objectTime: { type: 'f', value: [] }
    };
    var circleMaterial = new THREE.ShaderMaterial({
        uniforms: circleUniforms,
        attributes: circleAttributes,
        
        vertexShader: WOsu.Player.circleShader.vertexShader,
        fragmentShader: WOsu.Player.circleShader.fragmentShader,
        
        side: THREE.DoubleSide,
        transparent: true
    });
    var circleGeometry = new THREE.Geometry();
    
    var comboColor = 0;
    var comboNumber = 1;
    for (var i=0; i<bmo.length; i++) {
        var hitobj = bmo[i];
        
        if (hitobj.isComboChange()) {
            comboColor = (comboColor + 1) % bmm.colors.length;
            comboNumber = 1;
        }
        
        hitobj.combo = comboColor;
        hitobj.comboNumber = comboNumber;
        
        comboNumber++;
        
        // TODO Stacked notes
        
        if (hitobj.isBeat()) {
            this.createThreeCircle({
                geometry: circleGeometry,
                attributes: circleAttributes,
                object: hitobj,
                mechanics: bmm
            });
        }
        else if (hitobj.isSlider()) {
            // TODO
        }
        else if (hitobj.isSpinner()) {
            // TODO
        }
    }
    
    var circleMesh = new THREE.Mesh(circleGeometry, circleMaterial);
    
    gameplay.add(circleMesh);
    
    this.three.layers.gameplay = gameplay;
    this.game.circleMesh = circleMesh;
    
    threeResync();
}

/**
    Load Three.js elements for displaying the replay.
    
    // TODO Same as loadThreeGameplay
*/
WOsu.Player.prototype.loadThreeReplay = function(threeResync) {
    var replay = new THREE.Object3D();
    var textures = this.skin.textures;
    
    var cursorMesh;
    if (this.layers.replay) {
        cursorMesh = this.createThreeCursor({
            x: 0,
            y: 0,
            z: 0,
            size: 32,
            texture: textures.cursor
        });
    }
    else {
        cursorMesh = new THREE.Object3D();
    }
    
    replay.add(cursorMesh);

    this.three.layers.replay = replay;
    this.game.cursorMesh = cursorMesh;
    this.game.replay = {
        index: 0,
        lastRelease: Number.NEGATIVE_INFINITY
    };

    threeResync();
}

/**
    Load Three.js elements for displaying the UI.
    
    // TODO loadThreeUI
*/
WOsu.Player.prototype.loadThreeUI = function(threeResync) {
    var ui = new THREE.Object3D();
    
    this.three.layers.ui = ui;
    
    threeResync();
}

/**
    Load Three.js elements for displaying statistical elements.
    
    // TODO loadThreeStatistics
*/
WOsu.Player.prototype.loadThreeStatistics = function(threeResync) {
    var stat = new THREE.Object3D();
    
    this.three.layers.stat = stat;
    
    threeResync();
}

/**
    Assemble Three.js scene together. This is the last loading function called.
*/
WOsu.Player.prototype.loadThreeScene = function() {
    // Build scene
    var scene = new THREE.Scene();
    scene.add(this.three.camera);

    // Add layers to the scene
    for (var l in this.layers) {
        scene.add(this.three.layers[l]);
    }

    this.three.scene = scene;
}


// Three.js creation

WOsu.Player.shader = {
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.SrcAlphaFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor
};

/**
    Shader for generic textured quads
*/
WOsu.Player.quadShader = {
    vertexShader: [
        "attribute vec4 colorMask;",
        
        "varying vec2 vUv;",
        "varying vec4 vColor;",
        
        "void main() {",
        "   vColor = colorMask;",
        "   vUv = uv;",
        "   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),
    
    fragmentShader: [
        "uniform sampler2D texture;",
        
        "varying vec4 vColor;",
        "varying vec2 vUv;",
        
        "void main() {",
        "   gl_FragColor = texture2D(texture, vUv) * vColor;",
        "}"
    ].join("\n")
};

WOsu.Player.cursorShader = {
    vertexShader: [
        "uniform float currentTime;",
        
        // Whether or not the cursor is hit or not
        "uniform int isHit;",
        // If the cursor is hit, then this is the time of the last hit
        // Otherwise, it is the time of last release
        "uniform float hitTime;",
        "attribute vec4 colorMask;",
        
        "varying vec2 vUv;",
        "varying vec4 vColor;",
        
        "void main() {",
        "   float diff = (currentTime - hitTime) / 100.0;",
        "   vec3 scaledPosition = position;",
        "   float factor = 1.0;",
        // Cursor has been hit (scaling up)
        "   if (isHit == 1) {",
        "       factor = 1.0 + clamp(diff, 0.0, 1.0) * 0.4;",
        "   }",
        // Cursor has been released (scaling down)
        "   else {",
        "       factor = 1.0 + (1.0 - clamp(diff, 0.0, 1.0)) * 0.4;",
        "   }",
        "   scaledPosition.x *= factor;",
        "   scaledPosition.y *= factor;",
        "   vColor = colorMask;",
        "   vUv = uv;",
        "   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),
    
    fragmentShader: [
        "uniform sampler2D texture;",
        
        "varying vec4 vColor;",
        "varying vec2 vUv;",
        
        "void main() {",
        "   gl_FragColor = texture2D(texture, vUv) * vColor;",
        "}"
    ].join("\n")
};

/**
    Shader for hit circles
*/
WOsu.Player.circleShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",
        
        // Beatmap mechanics to compute opacity
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        
        // The hit object color
        "attribute vec4 colorMask;",
        
        // The hit object time
        "attribute float objectTime;",
        
        // When the beat was hit (otherwise positive infinity)
        "attribute float hitTime;",
        
        // When the beat was hit (but before OD threshold)
        // Cause the beat to shake a bit
        // TODO "uniform float earlyTime;"
        
        // When it's kiai time, flash like crazy
        // TODO "uniform float kiaiTime;"
        
        // TODO Combo number
        // "varying int? digit;"
        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying vec4 vAlpha;",

        "void main() {",
        "   float diff = objectTime - currentTime;",
        // If the circle is outside the approach rate or has already been hit
        "   if (abs(diff) > approachRate || currentTime > hitTime) {",
        // Draw a degenerate triangle behind the camera
        "       gl_Position = vec4(0, 0, -2, 1);",
        "   }",
        "   else {",
        // Interpolate alpha from approach rate to 50
        "       float alpha = clamp((approachRate - diff) / (approachRate - overallDifficulty), 0.0, 1.0);",
        "       vColor = colorMask;",
        "       vAlpha = vec4(1.0, 1.0, 1.0, alpha);",
        "       vUv = uv;",
        "       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "   }",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D hitcircle;",
        "uniform sampler2D hitcircle_overlay;",
        "uniform sampler2D digits[10];",
        
        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying vec4 vAlpha;",

        "void main() {",
        // TODO Draw digits
        "   vec4 color = vec4(0, 0, 0, 0);",
        "   vec4 tex1 = texture2D(hitcircle, vUv);",
        "   color = tex1 * vColor * tex1.a;",
        
        "   vec4 tex2 = texture2D(hitcircle_overlay, vUv);",
        "   color = color * (1.0 - tex2.a) + tex2 * tex2.a;",
        
        "   gl_FragColor = color * vAlpha;",
        "}"
    ].join("\n")
};

WOsu.Player.prototype.createThreeQuad = function(params) {
    if (params.size !== undefined) {
        params.width = params.height = params.size;
    }
    
    params.color = (params.color !== undefined) ? params.color : new THREE.Vector4(1, 1, 1, 1);

    var geometry = new THREE.PlaneGeometry(params.width, params.height, 1, 1);
    
    params.texture.minFilter = THREE.LinearFilter;
    params.texture.magFilter = THREE.LinearFilter;
    var material = new THREE.ShaderMaterial({
        uniforms: {
            texture: {
                type: 't',
                value: params.texture
            }
        },
        attributes: {
            colorMask: {
                type: 'v4',
                value: []
            }
        },

        vertexShader: WOsu.Player.quadShader.vertexShader,
        fragmentShader: WOsu.Player.quadShader.fragmentShader,

        side: THREE.DoubleSide,
        transparent: true,
        blending: WOsu.Player.shader.blending,
        blendEquation: WOsu.Player.shader.blendEquation,
        blendSrc: WOsu.Player.shader.blendSrc,
        blendDst: WOsu.Player.shader.blendDst
    });
    
    material.attributes.colorMask.value.push(
        params.color, params.color, params.color, params.color
    );
    
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(params.x, params.y, params.z);
    
    return mesh;
}

WOsu.Player.prototype.createThreeCursor = function(params) {
    if (params.size !== undefined) {
        params.width = params.height = params.size;
    }
    
    params.color = (params.color !== undefined) ? params.color : new THREE.Vector4(1, 1, 1, 1);

    var geometry = new THREE.PlaneGeometry(params.width, params.height, 1, 1);
    
    params.texture.minFilter = THREE.LinearFilter;
    params.texture.magFilter = THREE.LinearFilter;
    var material = new THREE.ShaderMaterial({
        uniforms: {
            currentTime: {
                type: 'f',
                value: Number.NEGATIVE_INFINITY
            },
            isHit: {
                type: 'i',
                value: 0
            },
            hitTime: {
                type: 'f',
                value: Number.NEGATIVE_INFINITY
            },
            texture: {
                type: 't',
                value: params.texture
            }
        },

        vertexShader: WOsu.Player.cursorShader.vertexShader,
        fragmentShader: WOsu.Player.cursorShader.fragmentShader,

        side: THREE.DoubleSide,
        transparent: true,
        blending: WOsu.Player.shader.blending,
        blendEquation: WOsu.Player.shader.blendEquation,
        blendSrc: WOsu.Player.shader.blendSrc,
        blendDst: WOsu.Player.shader.blendDst
    });
    
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(params.x, params.y, params.z);
    
    return mesh;
}

WOsu.Player.prototype.createThreeCircle = function(params) {
    var obj = params.object;
    var x = obj.x - 256;
    var y = 192 - obj.y;
    var z = 0;
    var r = params.mechanics.CS / 2;
    
    var geo = params.geometry;
    var offset = geo.vertices.length;;
    geo.vertices.push(
        new THREE.Vector3(x - r, y - r, z),
        new THREE.Vector3(x - r, y + r, z),
        new THREE.Vector3(x + r, y + r, z),
        new THREE.Vector3(x + r, y - r, z)
    );
    geo.faces.push(
        new THREE.Face3(offset, offset+1, offset+2),
        new THREE.Face3(offset, offset+2, offset+3)
    );
    geo.faceVertexUvs[0].push(
        [ new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1) ],
        [ new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(1, 0) ]
    );
    
    var att = params.attributes;
    att.objectTime.value.push(
        obj.time, obj.time, obj.time, obj.time
    );
    att.hitTime.value.push(
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
    );
    var colors = params.mechanics.colors;
    var c = new THREE.Vector4(colors[obj.combo][0] / 255.0, colors[obj.combo][1] / 255.0, colors[obj.combo][2] / 255.0, 1);
    att.colorMask.value.push(c, c, c, c);
    att.colorMask.needsUpdate = true;
}




WOsu.Player.prototype.play = function() {
    var instance = this;

    this.playing = true;
    this.audio.load();
    this.audio.addEventListener("canplay", function() {
        instance.audio.play();
    });

    this.frame();
}

WOsu.Player.prototype.frame = function() {
    var instance = this;
    requestAnimationFrame(function() {
        instance.frame();
    });

    if (this.playing) {
        var time = this.audio.currentTime * 1000;
        this.frame_game(time);
        this.frame_replay(time);
    }

    var renderer = this.three.renderer;
    renderer.render(this.three.scene, this.three.camera);
}

WOsu.Player.prototype.frame_game = function(time) {
    var game = this.game;
    var hobj, gobj, cobj, dt, op;
    
    // Set gameplay uniforms
    var uniforms;
    uniforms = game.circleMesh.material.uniforms;
    uniforms.currentTime.value = time;
    
    // TODO Handle sliders and spinners as well
    // TODO Handle slider balls (but not slider ball circle!)
}

WOsu.Player.prototype.frame_replay = function(time) {
    var rpo = this.replay; // Replay object
    var rpg = this.game.replay; // Replay game data
    var rpl = this.three.layers.replay; // Replay THREE objects

    while (rpg.index < rpo.replayData.length - 1 && time > rpo.replayData[rpg.index + 1].time) {
        rpg.index++;
    }

    // Get the current and next sets of replay data
    var rd = rpo.replayData[rpg.index];
    var nd = (rpg.index === rpo.replayData.length - 1) ? rd : rpo.replayData[rpg.index + 1];

    // Transform to cartesian coordinates
    var p1 = new THREE.Vector3(rd.x - 256, 192 - rd.y, 0);
    var p2 = new THREE.Vector3(nd.x - 256, 192 - nd.y, 0);
    
    // Compute interpolation between the sets
    var interp = (nd.time - rd.time === 0) ? 0 : (time - rd.time) / (nd.time - rd.time);
    var cursor = this.game.cursorMesh;
    cursor.position.lerpVectors(p1, p2, interp);

    // Set cursor uniforms
    cursor.material.uniforms.currentTime.value = time;
    cursor.material.uniforms.isHit.value = (rd.keys > 0) ? 1 : 0;
    cursor.material.uniforms.hitTime.value = (rd.keys > 0) ? rd.time : rd.lastReleaseTime;
}