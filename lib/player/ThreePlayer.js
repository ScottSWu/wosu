/**
    WOsu three.js player
*/
WOsu.ThreePlayer = function (options) {
    WOsu.Player.call(this, options);

    this.elements.three = null;

    // Initialize Three.js
    this.initThree(options);
}

WOsu.ThreePlayer.prototype = Object.create(WOsu.Player.prototype);

WOsu.ThreePlayer.prototype.constructor = WOsu.ThreePlayer;

WOsu.ThreePlayer.prototype.initThree = function (options) {
    var instance = this;

    // New renderer, no sorting
    // Enable preserveDrawingBuffer if pulling images
    var renderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer: options.preserveDrawingBuffer || false
    });
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(this.width, this.height);
    renderer.sortObjects = false;

    // Three.js Scene
    var scene = new THREE.Scene();

    // TODO Rendering target for layers
    var target = new THREE.WebGLRenderTarget(this.width, this.height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat
    });

    // Allow cross origin loading (?)
    THREE.ImageUtils.crossOrigin = "";

    // Need to scale to at least 640 x 480 units
    var ratio = this.height / this.width;
    var camera;
    if (ratio > 0.75) { // Width limit
        camera = new THREE.OrthographicCamera(-320, 320, 320 * ratio, -320 * ratio, 1, 1e5);
    }
    else { // Height limit
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

// Three.js loading stage

WOsu.ThreePlayer.prototype.loadRenderer = function (loadResync) {
    var instance = this;

    this.callback.progress("Three", "Loading objects");

    this.three.layers = {};

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
    }], function () {
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
WOsu.ThreePlayer.prototype.loadThreeStoryboard = function (threeResync) {
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
            z: -1e4, // This goes in the very back
            width: this.beatmap.BeatmapData.WidescreenStoryboard ? 640 : 850,
            height: 480,
            color: new THREE.Vector4(0.5, 0.5, 0.5, 1.0),
            texture: THREE.ImageUtils.loadTexture(bgpath)
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

/**
    Load Three.js elements for displaying the gameplay.
*/
WOsu.ThreePlayer.prototype.loadThreeGameplay = function (threeResync) {
    var instance = this;

    // Hit objects
    var gameplay = new THREE.Object3D();
    var bmo = this.beatmap.BeatmapObjects;
    var bmm = this.game.mechanics;
    var bme = this.game.events;
    var textures = this.skin.textures;

    // List of materials
    var materials = {
        score: new THREE.ShaderMaterial({
            uniforms: {
                currentTime: {
                    type: 'f',
                    value: Number.NEGATIVE_INFINITY
                },
                approachRate: {
                    type: 'f',
                    value: bmm.AR
                },
                overallDifficulty: {
                    type: 'f',
                    value: bmm.OD
                },
                circleSize: {
                    type: 'f',
                    value: bmm.CS
                },

                hit300: {
                    type: 't',
                    value: textures.hit_300
                },
                hit100: {
                    type: 't',
                    value: textures.hit_100
                },
                hit50: {
                    type: 't',
                    value: textures.hit_50
                },
                hit0: {
                    type: 't',
                    value: textures.hit_0
                }
            },
            attributes: {
                hitTime: {
                    type: 'f'
                },
                score: {
                    type: 'f'
                },
                center: {
                    type: 'v3'
                }
            },

            vertexShader: WOsu.ThreePlayer.scoreShader.vertexShader,
            fragmentShader: WOsu.ThreePlayer.scoreShader.fragmentShader,

            side: THREE.DoubleSide,
            transparent: true
        }),
        approach: new THREE.ShaderMaterial({
            uniforms: {
                currentTime: {
                    type: 'f',
                    value: Number.NEGATIVE_INFINITY
                },
                approachRate: {
                    type: 'f',
                    value: bmm.AR
                },
                overallDifficulty: {
                    type: 'f',
                    value: bmm.OD
                },
                circleSize: {
                    type: 'f',
                    value: bmm.CS
                },

                approachcircle: {
                    type: 't',
                    value: textures.approachcircle
                }
            },
            attributes: {
                colorMask: {
                    type: 'v4'
                },
                startTime: {
                    type: 'f'
                },
                hitTime: {
                    type: 'f'
                },
                center: {
                    type: 'v3'
                }
            },

            vertexShader: WOsu.ThreePlayer.approachShader.vertexShader,
            fragmentShader: WOsu.ThreePlayer.approachShader.fragmentShader,

            side: THREE.DoubleSide,
            transparent: true
        }),
        circle: new THREE.ShaderMaterial({
            uniforms: {
                currentTime: {
                    type: 'f',
                    value: Number.NEGATIVE_INFINITY
                },
                approachRate: {
                    type: 'f',
                    value: bmm.AR
                },
                overallDifficulty: {
                    type: 'f',
                    value: bmm.OD
                },
                circleSize: {
                    type: 'f',
                    value: bmm.CS
                },

                hitcircle: {
                    type: 't',
                    value: textures.hitcircle
                },
                hitcircle_overlay: {
                    type: 't',
                    value: textures.hitcircle_overlay
                }
            },
            attributes: {
                colorMask: {
                    type: 'v4'
                },
                startTime: {
                    type: 'f'
                },
                hitTime: {
                    type: 'f'
                },
                center: {
                    type: 'v3'
                }
            },

            vertexShader: WOsu.ThreePlayer.circleShader.vertexShader,
            fragmentShader: WOsu.ThreePlayer.circleShader.fragmentShader,

            side: THREE.DoubleSide,
            transparent: true
        }),
        slider: new THREE.ShaderMaterial({
            uniforms: {
                currentTime: {
                    type: 'f',
                    value: Number.NEGATIVE_INFINITY
                },
                approachRate: {
                    type: 'f',
                    value: bmm.AR
                },
                overallDifficulty: {
                    type: 'f',
                    value: bmm.OD
                },
                circleSize: {
                    type: 'f',
                    value: bmm.CS
                },

                hitcircle: {
                    type: 't',
                    value: textures.hitcircle
                },
                hitcircle_overlay: {
                    type: 't',
                    value: textures.hitcircle_overlay
                }
            },
            attributes: {
                colorMask: {
                    type: 'v4'
                },
                startTime: {
                    type: 'f'
                },
                endTime: {
                    type: 'f'
                },
                hitTime: {
                    type: 'f'
                },
                center: {
                    type: 'v3'
                }
            },

            vertexShader: WOsu.ThreePlayer.sliderShader.vertexShader,
            fragmentShader: WOsu.ThreePlayer.sliderShader.fragmentShader,

            side: THREE.DoubleSide,
            transparent: true
        }),
        sliderBody: new THREE.ShaderMaterial({
            uniforms: {
                currentTime: {
                    type: 'f',
                    value: Number.NEGATIVE_INFINITY
                },
                approachRate: {
                    type: 'f',
                    value: bmm.AR
                },
                overallDifficulty: {
                    type: 'f',
                    value: bmm.OD
                },
                circleSize: {
                    type: 'f',
                    value: bmm.CS
                },

                hitcircle: {
                    type: 't',
                    value: textures.hitcircle
                },
                hitcircle_overlay: {
                    type: 't',
                    value: textures.hitcircle_overlay
                }
            },
            attributes: {
                colorMask: {
                    type: 'v4'
                },
                startTime: {
                    type: 'f'
                },
                endTime: {
                    type: 'f'
                },
                hitTime: {
                    type: 'f'
                },
                center: {
                    type: 'v3'
                }
            },

            vertexShader: WOsu.ThreePlayer.sliderBodyShader.vertexShader,
            fragmentShader: WOsu.ThreePlayer.sliderBodyShader.fragmentShader,

            side: THREE.DoubleSide,
            transparent: true
        }),
        sliderFollow: new THREE.ShaderMaterial({
            uniforms: {
                currentTime: {
                    type: 'f',
                    value: Number.NEGATIVE_INFINITY
                },
                approachRate: {
                    type: 'f',
                    value: bmm.AR
                },
                overallDifficulty: {
                    type: 'f',
                    value: bmm.OD
                },
                circleSize: {
                    type: 'f',
                    value: bmm.CS
                },

                texture: {
                    type: 't',
                    value: textures.slider_followcircle
                }
            },
            attributes: {
                startTime: {
                    type: 'f'
                },
                endTime: {
                    type: 'f'
                },
                hitTime: {
                    type: 'f'
                },
                releaseTime: {
                    type: 'f'
                },
                center: {
                    type: 'v3'
                }
            },

            vertexShader: WOsu.ThreePlayer.sliderFollowShader.vertexShader,
            fragmentShader: WOsu.ThreePlayer.sliderFollowShader.fragmentShader,

            side: THREE.DoubleSide,
            transparent: true
        }),
        sliderBall: new THREE.ShaderMaterial({
            uniforms: {
                currentTime: {
                    type: 'f',
                    value: Number.NEGATIVE_INFINITY
                },
                approachRate: {
                    type: 'f',
                    value: bmm.AR
                },
                overallDifficulty: {
                    type: 'f',
                    value: bmm.OD
                },
                circleSize: {
                    type: 'f',
                    value: bmm.CS
                },

                texture: {
                    type: 't',
                    value: textures.slider_b
                }
            },
            attributes: {
                startTime: {
                    type: 'f'
                },
                endTime: {
                    type: 'f'
                },
                center: {
                    type: 'v3'
                }
            },

            vertexShader: WOsu.ThreePlayer.sliderBallShader.vertexShader,
            fragmentShader: WOsu.ThreePlayer.sliderBallShader.fragmentShader,

            side: THREE.DoubleSide,
            transparent: true
        }),
        spinner: new THREE.ShaderMaterial({
            uniforms: {
                currentTime: {
                    type: 'f',
                    value: Number.NEGATIVE_INFINITY
                },
                approachRate: {
                    type: 'f',
                    value: bmm.AR
                },
                overallDifficulty: {
                    type: 'f',
                    value: bmm.OD
                },
                circleSize: {
                    type: 'f',
                    value: bmm.CS
                },

                spinner_approachcircle: {
                    type: 't',
                    value: textures.spinner_approachcircle
                },
                spinner_background: {
                    type: 't',
                    value: textures.spinner_background
                },
                spinner_circle: {
                    type: 't',
                    value: textures.spinner_circle
                }
            },
            attributes: {
                startTime: {
                    type: 'f'
                },
                endTime: {
                    type: 'f'
                },
                spinAmount: {
                    type: 'f'
                }
            },

            vertexShader: WOsu.ThreePlayer.spinnerShader.vertexShader,
            fragmentShader: WOsu.ThreePlayer.spinnerShader.fragmentShader,

            side: THREE.DoubleSide,
            transparent: true
        })
    };
    // Aliases
    materials.sliderStart = materials.slider;
    materials.sliderEnd = materials.slider;

    // List of mesh types
    var meshes = {
        score: [],
        approach: [],
        hit: [],
        spinner: []
    };
    // Aliases
    meshes.sliderFollow = meshes.approach;
    meshes.sliderBall = meshes.approach;
    meshes.circle = meshes.hit;
    meshes.slider = meshes.hit;
    meshes.sliderStart = meshes.hit;
    meshes.sliderEnd = meshes.hit;
    meshes.sliderBody = meshes.hit;

    // Offsets
    var offsets = {
        score: 1,

        approach: 2,
        sliderFollow: 2,
        sliderBall: 2,

        hit: 3,
        circle: 3,
        slider: 3,
        sliderStart: 3,
        sliderEnd: 3,
        sliderBody: 3,

        spinner: 4
    };

    var comboColor = 0;
    var comboNumber = 1;
    var totalObjects = bmo.length;

    // TODO Follow points

    var orderedMeshes = [];
    var eventIndex = 0;

    function createThree(type, hitobj, offset, meshList) {
        var nextobj = instance["createThree_" + type]({
            material: materials[type],
            object: hitobj,
            z: -offset / totalObjects - offsets[type],
            mechanics: bmm
        });
        nextobj.gameObject = hitobj;

        meshes[type].push(nextobj);
        orderedMeshes.push(nextobj);
        meshList[type] = nextobj;

    };

    for (var i = 0; i < totalObjects; i++) {
        var hitobj = bmo[i];

        // Associate events with meshes
        // Everything should be in order
        while (eventIndex < bme.length && bme[eventIndex].parent.gameObject != hitobj) {
            eventIndex++;
        }
        var currentEvent = bme[eventIndex];
        var meshList = {};

        if (hitobj.isComboChange()) {
            comboColor = (comboColor + 1) % bmm.colors.length;
            comboNumber = 1;
        }

        hitobj.combo = comboColor;
        hitobj.comboNumber = comboNumber;

        comboNumber++;

        var nextobj;
        if (hitobj.isCircle()) {

            createThree("score", hitobj, i + 0.0, meshList);
            createThree("approach", hitobj, i + 0.0, meshList);
            createThree("circle", hitobj, i + 0.0, meshList);

        }
        else if (hitobj.isSlider()) {

            createThree("score", hitobj, i + 0.0, meshList);
            createThree("approach", hitobj, i + 0.0, meshList);
            createThree("sliderFollow", hitobj, i + 0.3, meshList);
            createThree("sliderBall", hitobj, i + 0.6, meshList);
            createThree("sliderStart", hitobj, i + 0.0, meshList);
            createThree("sliderEnd", hitobj, i + 0.3, meshList);
            createThree("sliderBody", hitobj, i + 0.6, meshList);

        }
        else if (hitobj.isSpinner()) {

            createThree("score", hitobj, i + 0.0, meshList);
            createThree("spinner", hitobj, i + 0.0, meshList);

        }

        currentEvent.parent.data.meshes = meshList;
    }

    // Spinners go behind objects
    for (var i = meshes.spinner.length - 1; i >= 0; i--) {
        gameplay.add(meshes.spinner[i]);
    }
    // Hit objects
    for (var i = meshes.hit.length - 1; i >= 0; i--) {
        gameplay.add(meshes.hit[i]);
    }
    // Approach circles
    for (var i = meshes.approach.length - 1; i >= 0; i--) {
        gameplay.add(meshes.approach[i]);
    }
    // Score indicators
    for (var i = meshes.score.length - 1; i >= 0; i--) {
        gameplay.add(meshes.score[i]);
    }

    // Set all objects to be invisible, except ones within the approach rate at the start
    var index = 0;
    var threshold = bmm.AR * 2
    for (var i = 0; i < orderedMeshes.length; i++) {
        if (orderedMeshes[i].gameObject.time < threshold) {
            orderedMeshes[i].visible = true;
            if (i == index) {
                index++;
            }
        }
        else {
            orderedMeshes[i].visible = false;
        }
    }

    // Layer object
    this.three.layers.gameplay = {
        object: gameplay,
        properties: {
            // The conservative extent of visibility
            objectStart: 0,
            objectEnd: index,
            // An ordered list of all meshes
            objects: orderedMeshes,
            objectLength: orderedMeshes.length,
            // Materials
            materials: materials
        }
    };

    threeResync();
}

/**
    Load Three.js elements for displaying the replay.
*/
WOsu.ThreePlayer.prototype.loadThreeReplay = function (threeResync) {
    var replay = new THREE.Object3D();
    var textures = this.skin.textures;

    var cursorMesh;
    if (this.layers.replay) {
        cursorMesh = this.createThreeCursor({
            x: 0,
            y: 0,
            z: 0
        });
    }
    else {
        cursorMesh = new THREE.Object3D();
    }

    replay.add(cursorMesh);

    this.three.layers.replay = {
        object: replay,
        properties: {
            cursorMesh: cursorMesh
        }
    };

    threeResync();
}

/**
    Load Three.js elements for displaying the UI.
    
    // TODO loadThreeUI
*/
WOsu.ThreePlayer.prototype.loadThreeUI = function (threeResync) {
    var ui = new THREE.Object3D();

    this.three.layers.ui = {
        object: ui,
        properties: {}
    };

    threeResync();
}

/**
    Load Three.js elements for displaying statistical elements.
    
    // TODO loadThreeStatistics
*/
WOsu.ThreePlayer.prototype.loadThreeStatistics = function (threeResync) {
    var stat = new THREE.Object3D();

    this.three.layers.stat = {
        object: stat,
        properties: {}
    };

    threeResync();
}

/**
    Assemble Three.js scene together. This is the last loading function called.
*/
WOsu.ThreePlayer.prototype.loadThreeScene = function () {
    // Build scene
    var scene = this.three.scene;
    scene.add(this.three.camera);

    // Add layers to the scene
    var layers = this.three.layers;
    scene.add(layers.storyboard.object);
    scene.add(layers.gameplay.object);
    scene.add(layers.replay.object);
}


// Three.js creation functions

/**
    Shader for generic textured quads
*/
WOsu.ThreePlayer.quadShader = {
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

/**
    Shader for the mouse cursor
*/
WOsu.ThreePlayer.cursorShader = {
    vertexShader: [
        "uniform float currentTime;",

        // Whether or not the cursor is hit or not
        "uniform int isHit;",
        // If the cursor is hit, then this is the time of the last hit
        // Otherwise, it is the time of last release
        "uniform float hitTime;",

        "varying vec2 vUv;",

        "void main() {",
        "   float diff = (currentTime - hitTime) / 50.0;",
        "   float factor = 1.0;",
        // Cursor has been hit (scaling up)
        "   if (isHit == 1) {",
        "       factor = 1.0 + clamp(diff, 0.0, 1.0) * 0.4;",
        "   }",
        // Cursor has been released (scaling down)
        "   else {",
        "       factor = 1.0 + (1.0 - clamp(diff, 0.0, 1.0)) * 0.4;",
        "   }",
        "   vec4 scaledPosition = vec4(position.x * factor, position.y * factor, position.z, 1.0);",
        "   vUv = uv;",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D texture;",

        "varying vec2 vUv;",

        "void main() {",
        "   gl_FragColor = texture2D(texture, vUv);",
        "}"
    ].join("\n")
};

/**
    Shader for digits
*/
WOsu.ThreePlayer.digitShader = {
    vertexShader: [

    ].join("\n"),

    fragmentShader: [

    ].join("\n")
};

/**
    Shader for score indicators
*/
WOsu.ThreePlayer.scoreShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics to compute size
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The hit object hit time
        "attribute float hitTime;",

        // The score received
        // -1, 0, 1, 2, 3 - none, miss, 50, 100, 300
        "attribute float score;",

        // The position of the hit object
        "attribute vec3 center;",

        // When it's kiai time, flash like crazy
        // TODO "uniform float kiaiTime;"

        "varying vec2 vUv;",
        "varying float vAlpha;",
        "varying float vScore;",

        "void main() {",
        // Interpolate alpha and size
        // From hit time to 100 in, hold 300, fade out 400
        "   float alpha = 0.0;",
        "   float scale = 1.0;",
        "   if (currentTime > hitTime && currentTime < hitTime + 400.0) {",
        "       alpha = clamp((currentTime - hitTime) / 100.0, 0.0, 1.0);",
        "       scale = 0.5 + 0.5 * (clamp((currentTime - hitTime) / 100.0, 0.0, 1.0));",
        "   }",
        "   else if (currentTime > hitTime && currentTime < hitTime + 800.0) {",
        "       alpha = clamp(1.0 - (currentTime - 400.0 - hitTime) / 400.0, 0.0, 1.0);",
        "   }",
        "   vec4 scaledPosition = vec4(scale * position.x + center.x, scale * position.y + center.y, position.z, 1.0);",
        "   vUv = uv;",
        "   vAlpha = alpha;",
        "   vScore = score + 0.5;",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D hit300;",
        "uniform sampler2D hit100;",
        "uniform sampler2D hit50;",
        "uniform sampler2D hit0;",

        "varying vec2 vUv;",
        "varying float vAlpha;",
        "varying float vScore;",

        "void main() {",
        "   vec4 color = vec4(0.0, 0.0, 0.0, 0.0);",
        "   if (vScore > 3.0) {",
        "       color = texture2D(hit300, vUv);",
        "   }",
        "   else if (vScore > 2.0) {",
        "       color = texture2D(hit100, vUv);",
        "   }",
        "   else if (vScore > 1.0) {",
        "       color = texture2D(hit50, vUv);",
        "   }",
        "   else if (vScore > 0.0) {",
        "       color = texture2D(hit0, vUv);",
        "   }",
        "   gl_FragColor = color * vAlpha;",
        "}"
    ].join("\n")
};

/**
    Shader for approach circles
*/
WOsu.ThreePlayer.approachShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics to compute opacity and size
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The hit object start time
        "attribute float startTime;",

        // The hit object hit time
        "attribute float hitTime;",

        // The hit object color
        "attribute vec4 colorMask;",

        // The position of the hit object
        "attribute vec3 center;",

        // When it's kiai time, flash like crazy
        // TODO "uniform float kiaiTime;"

        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",

        "void main() {",
        // Interpolate alpha from approach rate to 50
        "   vUv = uv;",
        "   vColor = colorMask;",
        "   vAlpha = 0.0;",
        "   float scale = 1.0;",
        "   if (currentTime < min(startTime, hitTime)) {",
        "       vAlpha = clamp((approachRate + currentTime - startTime) / (approachRate - overallDifficulty), 0.0, 1.0);",
        "       scale = 1.0 + 3.0 * (startTime - currentTime) / approachRate;",
        "   }",
        // Compute size
        "   vec4 scaledPosition = vec4(position.x * scale + center.x, position.y * scale + center.y, position.z, 1.0);",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D approachcircle;",

        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",

        "void main() {",
        "   vec4 tex1 = texture2D(approachcircle, vUv);",
        "   vec4 color = tex1 * vColor * tex1.a;",

        "   gl_FragColor = color * vAlpha;",
        "}"
    ].join("\n")
};

/**
    Shader for hit circles
*/
WOsu.ThreePlayer.circleShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The hit circle color
        "attribute vec4 colorMask;",

        // The hit circle time
        "attribute float startTime;",

        // When the beat was hit (otherwise positive infinity)
        "attribute float hitTime;",

        // TODO Cause the beat to shake a bit if early

        // TODO When it's kiai time, flash like crazy
        // uniform float kiaiTime;

        // Center of the hit object
        "attribute vec3 center;",

        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",

        "void main() {",
        "   vColor = colorMask;",
        "   vUv = uv;",
        "   float scale = 1.0;",
        // If the circle has been hit, fade out
        // Fade for 200 milliseconds, expand up to 1.5x
        "   if (currentTime > hitTime && currentTime < hitTime + 200.0) {",
        "       vAlpha = 1.0 - (currentTime - hitTime) / 200.0;",
        "       scale = 1.0 + (currentTime - hitTime) / 200.0 * 0.5;",
        "   }",
        // If it is before the approach rate
        // or past the overall difficulty time, make invisible
        "   else if (currentTime < startTime - approachRate || currentTime > startTime + overallDifficulty) {",
        "       vAlpha = 0.0;",
        "       scale = 0.0;",
        "   }",
        // Interpolate alpha from approach rate to overall difficulty
        "   else {",
        "       vAlpha = clamp((approachRate + currentTime - startTime) / (approachRate - overallDifficulty), 0.0, 1.0);",
        "   }",
        "   vec4 scaledPosition = vec4(scale * position.x + center.x, scale * position.y + center.y, position.z, 1.0);",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D hitcircle;",
        "uniform sampler2D hitcircle_overlay;",
        "uniform sampler2D digits[10];",

        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",

        "void main() {",
        "   vec4 color = vec4(0, 0, 0, 0);",
        "   vec4 tex1, tex2;",
        // Draw a circle
        "   tex1 = texture2D(hitcircle, vUv);",
        "   color = tex1 * vColor * tex1.a;",
        "   tex2 = texture2D(hitcircle_overlay, vUv);",
        "   color = mix(color, tex2, tex2.a);",
        "   gl_FragColor = color * vec4(1.0, 1.0, 1.0, clamp(vAlpha, 0.0, 1.0));",
        "}"
    ].join("\n")
};

/**
    Shader for slider endpoints
*/
WOsu.ThreePlayer.sliderShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The hit object color
        "attribute vec4 colorMask;",

        // The hit object start time
        "attribute float startTime;",

        // The hit object end time
        "attribute float endTime;",

        // When the beat was hit (otherwise positive infinity)
        "attribute float hitTime;",

        // TODO Number of repeats
        //"attribute int repeats;",

        // When it's kiai time, flash like crazy
        // TODO "uniform float kiaiTime;"

        // Center of the hit object
        "attribute vec3 center;",

        // TODO Combo number
        // "varying int? combo;"
        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",

        "void main() {",
        "   vColor = colorMask;",
        "   vUv = uv;",
        "   float scale = 1.0;",
        // If the circle has been hit, fade out
        // Fade for 250 milliseconds, expand up to 1.4x
        "   if (currentTime > hitTime && currentTime < hitTime + 250.0) {",
        "       vAlpha = 1.0 - (currentTime - hitTime) / 250.0;",
        "       scale = 1.0 + (currentTime - hitTime) / 250.0 * 0.4;",
        "   }",
        // If it is before the approach rate
        // or past the overall difficulty time, make invisible
        "   else if (currentTime < startTime - approachRate || currentTime > endTime) {",
        "       vAlpha = 0.0;",
        "       scale = 0.0;",
        "   }",
        // Interpolate alpha from approach rate to overall difficulty
        "   else {",
        "       vAlpha = clamp((approachRate + currentTime - startTime) / (approachRate - overallDifficulty), 0.0, 1.0);",
        "   }",
        "   vec4 scaledPosition = vec4(scale * position.x + center.x, scale * position.y + center.y, position.z, 1.0);",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D hitcircle;",
        "uniform sampler2D hitcircle_overlay;",
        "uniform sampler2D digits[10];",

        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",

        "void main() {",
        "   vec4 color = vec4(0, 0, 0, 0);",
        "   vec4 tex1, tex2;",
        // Draw a circle
        "   tex1 = texture2D(hitcircle, vUv);",
        "   color = tex1 * vColor * tex1.a;",
        "   tex2 = texture2D(hitcircle_overlay, vUv);",
        "   color = mix(color, tex2, tex2.a);",
        "   gl_FragColor = color * vec4(1.0, 1.0, 1.0, clamp(vAlpha, 0.0, 1.0));",
        "}"
    ].join("\n")
};

/**
    Shader for slider bodies
*/
WOsu.ThreePlayer.sliderBodyShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The hit object color
        "attribute vec4 colorMask;",

        // The hit object start time
        "attribute float startTime;",

        // The hit object end time
        "attribute float endTime;",

        // When the beat was hit (otherwise positive infinity)
        "attribute float hitTime;",

        // TODO Number of repeats
        //"attribute int repeats;",

        // When it's kiai time, flash like crazy
        // TODO "uniform float kiaiTime;"

        // Center of the hit object
        "attribute vec3 center;",

        // TODO Combo number
        // "varying int? combo;"
        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",

        "void main() {",
        "   vColor = colorMask;",
        "   vUv = uv;",
        // If the circle has been hit, fade out
        // Fade for 200 milliseconds
        "   if (currentTime > hitTime && currentTime < hitTime + 250.0) {",
        "       vAlpha = clamp(1.0 - (currentTime - hitTime) / 200.0, 0.0, 1.0);",
        "   }",
        // If it is before the approach rate
        // or past the overall difficulty time, make invisible
        "   else if (currentTime < startTime - approachRate || currentTime > endTime) {",
        "       vAlpha = 0.0;",
        "   }",
        // Interpolate alpha from approach rate to overall difficulty
        "   else {",
        "       vAlpha = clamp((approachRate + currentTime - startTime) / (approachRate - overallDifficulty), 0.0, 1.0);",
        "   }",
        "   vec4 scaledPosition = vec4(position.x, position.y, position.z, 1.0);",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D hitcircle;",
        "uniform sampler2D hitcircle_overlay;",
        "uniform sampler2D digits[10];",

        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",

        "void main() {",
        "   vec4 color = vec4(0, 0, 0, 0);",
        "   vec4 tex1, tex2;",
        // Draw a circle
        "   tex1 = texture2D(hitcircle, vUv);",
        "   color = tex1 * vColor * tex1.a;",
        "   tex2 = texture2D(hitcircle_overlay, vUv);",
        "   color = mix(color, tex2, tex2.a);",
        "   gl_FragColor = color * vec4(1.0, 1.0, 1.0, clamp(vAlpha, 0.0, 1.0));",
        "}"
    ].join("\n")
};

/**
    Shader for slider ball
*/
WOsu.ThreePlayer.sliderBallShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The hit object start time
        "attribute float startTime;",

        // The hit object end time
        "attribute float endTime;",

        // When it's kiai time, flash like crazy
        // TODO "uniform float kiaiTime;"

        // Center of the hit object
        "attribute vec3 center;",

        "varying vec2 vUv;",
        "varying float vAlpha;",

        "void main() {",
        "   vUv = uv;",
        "   vAlpha = 0.0;",
        "   if (startTime <= currentTime && currentTime <= endTime) {",
        "       vAlpha = 1.0;",
        "   }",
        "   vec4 scaledPosition = vec4(position.x + center.x, position.y + center.y, position.z, 1.0);",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D texture;",

        "varying vec2 vUv;",
        "varying float vAlpha;",

        "void main() {",
        "   gl_FragColor = texture2D(texture, vUv) * vec4(1.0, 1.0, 1.0, clamp(vAlpha, 0.0, 1.0));",
        "}"
    ].join("\n")
};

/**
    Shader for the slider ball follow circle shader
*/
WOsu.ThreePlayer.sliderFollowShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The hit object start time
        "attribute float startTime;",

        // The hit object end time
        "attribute float endTime;",

        // When the slider ball was last hit
        "attribute float hitTime;",

        // When the slider ball was last released
        "attribute float releaseTime;",

        // Center of the hit object
        "attribute vec3 center;",

        "varying vec2 vUv;",
        "varying float vAlpha;",

        "void main() {",
        "   vUv = uv;",
        "   float scale = 0.0;",
        "   vAlpha = 0.0;",
        // The slider ball is being held
        "   if (hitTime > releaseTime) {",
        "       vAlpha = clamp((currentTime - hitTime) / 100.0, 0.0, 1.0);",
        "       scale = clamp(0.6 + (currentTime - hitTime) / 100.0 * 0.4, 0.6, 1.0);",
        "   }",
        // The slider ball was released
        "   else if (startTime < currentTime && currentTime < endTime) {",
        "       vAlpha = clamp(1.0 - (currentTime - releaseTime) / 100.0, 0.0, 1.0);",
        "       scale = clamp(1.0 - (currentTime - releaseTime) / 100.0 * 0.4, 0.6, 1.0);",
        "   }",
        "   vec4 scaledPosition = vec4(scale * position.x + center.x, scale * position.y + center.y, position.z, 1.0);",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D texture;",

        "varying vec2 vUv;",
        "varying float vAlpha;",

        "void main() {",
        "   gl_FragColor = texture2D(texture, vUv) * vec4(1.0, 1.0, 1.0, 1.0);",
        "}"
    ].join("\n")
};

/**
    Shader for the slider repeat arrow shader
*/
WOsu.ThreePlayer.sliderRepeatShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The hit object start time
        "attribute float startTime;",

        // The hit object end time
        "attribute float endTime;",

        // When the slider ball was last hit
        "attribute float hitTime;",

        // When the slider ball was last released
        "attribute float releaseTime;",

        // When it's kiai time, flash like crazy
        // TODO "uniform float kiaiTime;"

        // Center of the hit object
        "attribute vec3 center;",

        "varying vec2 vUv;",
        "varying float vAlpha;",

        "void main() {",
        "   float scale = 0.0;",
        "   vAlpha = 0.0;",
        // The slider ball is being held
        "   if (hitTime > releaseTime) {",
        "       vAlpha = (currentTime - hitTime) / 100.0;",
        "       scale = 0.5 + (currentTime - hitTime) / 100.0 * 0.5;",
        "   }",
        // The slider ball was released
        "   else {",
        "       vAlpha = 1.0 - (currentTime - releaseTime) / 100.0;",
        "       scale = 1.0 - (currentTime - releaseTime) / 100.0 * 0.5;",
        "   }",
        "   vec4 scaledPosition = vec4(scale * position.x + center.x, scale * position.y + center.y, position.z, 1.0);",
        "   gl_Position = projectionMatrix * modelViewMatrix * scaledPosition;",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D texture;",

        "varying vec2 vUv;",
        "varying float vAlpha;",

        "void main() {",
        "   gl_FragColor = texture2D(texture, vUv) * vec4(1.0, 1.0, 1.0, vAlpha);",
        "}"
    ].join("\n")
};

/**
    Shader for spinners
*/
WOsu.ThreePlayer.spinnerShader = {
    vertexShader: [
        // The current time of the playback
        "uniform float currentTime;",

        // Beatmap mechanics to compute opacity
        "uniform float approachRate;",
        "uniform float overallDifficulty;",
        "uniform float circleSize;",

        // The spinner start time
        "attribute float startTime;",

        // The spinner end time
        "attribute float endTime;",

        // The spin amount
        "attribute float spinAmount;",

        // When it's kiai time, flash like crazy
        // TODO "uniform float kiaiTime;"

        // TODO Spinner speed
        "varying vec2 vUv;",
        "varying vec4 vColor;",
        "varying float vAlpha;",
        "varying float vScale;",

        "void main() {",
        "   float alpha = 0.0;",
        "   if (currentTime < endTime) {",
        "       alpha = clamp((approachRate + currentTime - startTime) / (approachRate), 0.0, 1.0);",
        "   }",
        // Interpolate scale from start time to end time
        "   vScale = clamp((endTime - currentTime) / (endTime - startTime), 0.0, 1.0);",
        // Interpolate alpha from approach rate to start time
        "   vAlpha = alpha;",
        "   vUv = uv;",
        "   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D spinner_approachcircle;",
        "uniform sampler2D spinner_circle;",
        "uniform sampler2D spinner_background;",

        "varying vec2 vUv;",
        "varying float vAlpha;",
        "varying float vScale;",

        "void main() {",
        "   vec4 tex = texture2D(spinner_background, vUv);",
        "   vec4 color = tex * tex.a;",

        // Spinner circle is square-ish
        // 512 x 384 -> 384 x 384
        // TODO Rotate by the spin ammount
        "   vec2 nuv = vec2(vUv.x * 4.0 / 3.0 - 1.0 / 6.0, vUv.y);",
        "   tex = texture2D(spinner_circle, nuv);",
        "   color = mix(color, tex, tex.a);",

        // Approach circle is also square-ish
        "   nuv = 2.0 * (nuv - 0.5) / vScale;",
        "   if (nuv.x >= -1.0 && nuv.x <=1.0 && nuv.x >= -1.0 && nuv.x <= 1.0) {",
        "       nuv = (nuv + 1.0) / 2.0;",
        "       tex = texture2D(spinner_approachcircle, nuv);",
        "       color = mix(color, tex, tex.a);",
        "   }",

        "   gl_FragColor = color * vec4(1.0, 1.0, 1.0, vAlpha);",
        "}"
    ].join("\n")
};

WOsu.ThreePlayer.prototype.createThreeQuad = function (params) {
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

        vertexShader: WOsu.ThreePlayer.quadShader.vertexShader,
        fragmentShader: WOsu.ThreePlayer.quadShader.fragmentShader,

        side: THREE.DoubleSide,
        transparent: true
    });

    material.attributes.colorMask.value.push(
        params.color, params.color, params.color, params.color
    );

    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(params.x, params.y, params.z);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThreeCursor = function (params) {
    if (params.size !== undefined) {
        params.width = params.height = params.size;
    }

    params.color = (params.color !== undefined) ? params.color : new THREE.Vector4(1, 1, 1, 1);

    var geometry = new THREE.BufferGeometry();

    var s = 32 / 2.0;
    var positions = new Float32Array([-s, -s, 0, -s, s, 0,
        s, s, 0,

        -s, -s, 0,
        s, s, 0,
        s, -s, 0
    ]);
    geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

    var uvs = new Float32Array([
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ]);
    geometry.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    var texture = this.skin.textures.cursor;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
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
                value: texture
            }
        },

        vertexShader: WOsu.ThreePlayer.cursorShader.vertexShader,
        fragmentShader: WOsu.ThreePlayer.cursorShader.fragmentShader,

        side: THREE.DoubleSide,
        transparent: true
    });

    var mesh = new THREE.Mesh(geometry, material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_score = function (params) {
    var obj = params.object;
    var x = (obj.isSlider() ? obj.endX : obj.x) - 256;
    var y = 192 - (obj.isSlider() ? obj.endY : obj.y);
    var z = params.z;
    var s = params.mechanics.CS * 2.0;
    var colors = params.mechanics.colors;
    var r = colors[obj.combo][0] / 255.0;
    var g = colors[obj.combo][1] / 255.0;
    var b = colors[obj.combo][2] / 255.0;

    var geometry = new THREE.BufferGeometry();

    var positions = [
        -s, -s, z,
        -s, +s, z,
        +s, +s, z,

        -s, -s, z,
        +s, +s, z,
        +s, -s, z
    ];

    var uvs = [
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ];

    var hitTimes = [
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
    ];

    var scores = [
        -1, -1, -1,
        -1, -1, -1
    ];

    var centers = [
        x, y, 0, x, y, 0, x, y, 0,
        x, y, 0, x, y, 0, x, y, 0
    ];

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("hitTime", new THREE.BufferAttribute(new Float32Array(hitTimes), 1));
    geometry.addAttribute("score", new THREE.BufferAttribute(new Int32Array(scores), 1));
    geometry.addAttribute("center", new THREE.BufferAttribute(new Float32Array(centers), 3));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_approach = function (params) {
    var obj = params.object;
    var offset = params.mechanics.stack * obj.stack;
    var x = obj.x - 256 + offset;
    var y = 192 - obj.y + offset;
    var z = params.z;
    var s = params.mechanics.CS;
    var colors = params.mechanics.colors;
    var r = colors[obj.combo][0] / 255.0;
    var g = colors[obj.combo][1] / 255.0;
    var b = colors[obj.combo][2] / 255.0;

    var geometry = new THREE.BufferGeometry();

    var positions = [
        -s, -s, z,
        -s, +s, z,
        +s, +s, z,

        -s, -s, z,
        +s, +s, z,
        +s, -s, z
    ];

    var uvs = [
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ];

    var colors = [
        r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0,
        r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0
    ];

    var startTimes = [
        obj.time, obj.time, obj.time,
        obj.time, obj.time, obj.time
    ];

    var hitTimes = [
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
    ];

    var centers = [
        x, y, 0, x, y, 0, x, y, 0,
        x, y, 0, x, y, 0, x, y, 0
    ];

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("colorMask", new THREE.BufferAttribute(new Float32Array(colors), 4));
    geometry.addAttribute("startTime", new THREE.BufferAttribute(new Float32Array(startTimes), 1));
    geometry.addAttribute("hitTime", new THREE.BufferAttribute(new Float32Array(hitTimes), 1));
    geometry.addAttribute("center", new THREE.BufferAttribute(new Float32Array(centers), 3));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_circle = function (params) {
    var obj = params.object;
    var offset = params.mechanics.stack * obj.stack;
    var x = obj.x - 256 + offset;
    var y = 192 - obj.y + offset;
    var z = params.z;
    var s = params.mechanics.CS;
    var colors = params.mechanics.colors;
    var r = colors[obj.combo][0] / 255.0;
    var g = colors[obj.combo][1] / 255.0;
    var b = colors[obj.combo][2] / 255.0;

    var geometry = new THREE.BufferGeometry();

    var positions = [
        -s, -s, z,
        -s, +s, z,
        +s, +s, z,

        -s, -s, z,
        +s, +s, z,
        +s, -s, z
    ];

    var uvs = [
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ];

    var colors = [
        r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0,
        r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0
    ];

    var startTimes = [
        obj.time, obj.time, obj.time,
        obj.time, obj.time, obj.time
    ];

    var endTimes = [
        obj.time, obj.time, obj.time,
        obj.time, obj.time, obj.time
    ];

    var hitTimes = [
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
    ];

    var centers = [
        x, y, 0, x, y, 0, x, y, 0,
        x, y, 0, x, y, 0, x, y, 0
    ];

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("colorMask", new THREE.BufferAttribute(new Float32Array(colors), 4));
    geometry.addAttribute("startTime", new THREE.BufferAttribute(new Float32Array(startTimes), 1));
    geometry.addAttribute("endTime", new THREE.BufferAttribute(new Float32Array(endTimes), 1));
    geometry.addAttribute("hitTime", new THREE.BufferAttribute(new Float32Array(hitTimes), 1));
    geometry.addAttribute("center", new THREE.BufferAttribute(new Float32Array(centers), 3));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_sliderStart = function (params) {
    var obj = params.object;
    var offset = params.mechanics.stack * obj.stack;
    var x = obj.x - 256 + offset;
    var y = 192 - obj.y + offset;
    var z = params.z;
    var s = params.mechanics.CS;
    var colors = params.mechanics.colors;
    var r = colors[obj.combo][0] / 255.0;
    var g = colors[obj.combo][1] / 255.0;
    var b = colors[obj.combo][2] / 255.0;

    var geometry = new THREE.BufferGeometry();

    var positions = [
        -s, -s, z,
        -s, +s, z,
        +s, +s, z,

        -s, -s, z,
        +s, +s, z,
        +s, -s, z
    ];

    var uvs = [
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ];

    var colors = [
        r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0,
        r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0
    ];

    var startTimes = [
        obj.time, obj.time, obj.time,
        obj.time, obj.time, obj.time
    ];

    var endTimes = [
        obj.endTime, obj.endTime, obj.endTime,
        obj.endTime, obj.endTime, obj.endTime
    ];

    var hitTimes = [
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
    ];

    var centers = [
        x, y, 0, x, y, 0, x, y, 0,
        x, y, 0, x, y, 0, x, y, 0
    ];

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("colorMask", new THREE.BufferAttribute(new Float32Array(colors), 4));
    geometry.addAttribute("startTime", new THREE.BufferAttribute(new Float32Array(startTimes), 1));
    geometry.addAttribute("endTime", new THREE.BufferAttribute(new Float32Array(endTimes), 1));
    geometry.addAttribute("hitTime", new THREE.BufferAttribute(new Float32Array(hitTimes), 1));
    geometry.addAttribute("center", new THREE.BufferAttribute(new Float32Array(centers), 3));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_sliderEnd = function (params) {
    var obj = params.object;
    var offset = params.mechanics.stack * obj.stack;
    var x = obj.endX - 256 + offset;
    var y = 192 - obj.endY + offset;
    var z = params.z;
    var s = params.mechanics.CS;
    var colors = params.mechanics.colors;
    var r = colors[obj.combo][0] / 255.0;
    var g = colors[obj.combo][1] / 255.0;
    var b = colors[obj.combo][2] / 255.0;

    var geometry = new THREE.BufferGeometry();

    var positions = [
        -s, -s, z,
        -s, +s, z,
        +s, +s, z,

        -s, -s, z,
        +s, +s, z,
        +s, -s, z
    ];

    var uvs = [
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ];

    var colors = [
        r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0,
        r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0
    ];

    var startTimes = [
        obj.time, obj.time, obj.time,
        obj.time, obj.time, obj.time
    ];

    var endTimes = [
        obj.endTime, obj.endTime, obj.endTime,
        obj.endTime, obj.endTime, obj.endTime
    ];

    var hitTimes = [
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY,
        Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY
    ];

    var centers = [
        x, y, 0, x, y, 0, x, y, 0,
        x, y, 0, x, y, 0, x, y, 0
    ];

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("colorMask", new THREE.BufferAttribute(new Float32Array(colors), 4));
    geometry.addAttribute("startTime", new THREE.BufferAttribute(new Float32Array(startTimes), 1));
    geometry.addAttribute("endTime", new THREE.BufferAttribute(new Float32Array(endTimes), 1));
    geometry.addAttribute("hitTime", new THREE.BufferAttribute(new Float32Array(hitTimes), 1));
    geometry.addAttribute("center", new THREE.BufferAttribute(new Float32Array(centers), 3));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_sliderBody = function (params) {
    var obj = params.object;
    var offset = params.mechanics.stack * obj.stack;
    var z = params.z;
    var s = params.mechanics.CS;
    var colors = params.mechanics.colors;
    var r = colors[obj.combo][0] / 255.0;
    var g = colors[obj.combo][1] / 255.0;
    var b = colors[obj.combo][2] / 255.0;

    var geometry = new THREE.BufferGeometry();

    var positions = [];
    var uvs = [];
    var indices = [];
    var colors = [];
    var startTimes = [];
    var endTimes = [];
    var hitTimes = [];
    var centers = [];
    var hitTypes = [];

    // Generate the curve itself
    obj.generateBezier();

    // Translate curve points
    var curve = [];
    var l = obj.curveX.length;
    for (var i = 0; i < l; i++) {
        curve.push(new THREE.Vector2(
            obj.curveX[i] - 256 + offset, 192 - obj.curveY[i] + offset
        ));
    }

    // Compute curve normals
    var normals = [];
    normals.push(new THREE.Vector2(
        curve[1].y - curve[0].y, curve[0].x - curve[1].x
    ).normalize());
    for (var i = 1; i < l - 1; i++) {
        var v0 = new THREE.Vector2(
            curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y
        ).normalize();
        var v1 = new THREE.Vector2(
            curve[i + 1].x - curve[i].x, curve[i + 1].y - curve[i].y
        ).normalize();
        v0.add(v1).normalize();

        normals.push(new THREE.Vector2(v0.y, -v0.x));
    }
    normals.push(new THREE.Vector2(
        curve[l - 1].y - curve[l - 2].y, curve[l - 2].x - curve[l - 1].x
    ).normalize());

    // Scale normals by circle size
    for (var i = 0; i < l; i++) {
        normals[i].multiplyScalar(s);
    }

    // Construct the geometry
    for (var i = 0; i < l; i++) {
        var v0 = curve[i].clone().add(normals[i]);
        var v1 = curve[i].clone().sub(normals[i]);
        positions.push(v0.x, v0.y, params.z, v1.x, v1.y, params.z);
        uvs.push(0.5, 0.0, 0.5, 1.0);
        colors.push(r, g, b, 1.0, r, g, b, 1.0);
        startTimes.push(obj.time, obj.time);
        endTimes.push(obj.endTime, obj.endTime);
        hitTimes.push(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
        centers.push(curve[i].x, curve[i].y, curve[i].x, curve[i].y);
        hitTypes.push(2.0, 2.0);
    }
    // Add faces
    for (var i = 0; i < l - 1; i++) {
        indices.push(
            2 * i + 0, 2 * i + 1, 2 * i + 2,
            2 * i + 2, 2 * i + 1, 2 * i + 3
        );
    }

    // Semicircle end caps
    var start = curve[0].clone().sub(curve[1]).normalize().multiplyScalar(s);
    var end = curve[l - 1].clone().sub(curve[l - 2]).normalize().multiplyScalar(s);
    var point;
    // Start cap
    point = curve[0].clone().add(normals[0]);
    positions.push(point.x, point.y, params.z);
    point = curve[0].clone().sub(normals[0]);
    positions.push(point.x, point.y, params.z);
    point = curve[0].clone().add(start).add(normals[0]);
    positions.push(point.x, point.y, params.z);
    point = curve[0].clone().add(start).sub(normals[0]);
    positions.push(point.x, point.y, params.z);
    uvs.push(0.5, 0.0, 0.5, 1.0, 0.0, 0.0, 0.0, 1.0);
    colors.push(r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0);
    startTimes.push(obj.time, obj.time, obj.time, obj.time);
    endTimes.push(obj.endTime, obj.endTime, obj.endTime, obj.endTime);
    hitTimes.push(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    centers.push(curve[0].x, curve[0].y, curve[0].x, curve[0].y, curve[0].x, curve[0].y, curve[0].x, curve[0].y);
    hitTypes.push(2.0, 2.0, 2.0, 2.0);
    indices.push(
        2 * l + 0, 2 * l + 1, 2 * l + 2,
        2 * l + 2, 2 * l + 1, 2 * l + 3
    );

    // End cap
    point = curve[l - 1].clone().add(normals[l - 1]);
    positions.push(point.x, point.y, params.z);
    point = curve[l - 1].clone().sub(normals[l - 1]);
    positions.push(point.x, point.y, params.z);
    point = curve[l - 1].clone().add(end).add(normals[l - 1]);
    positions.push(point.x, point.y, params.z);
    point = curve[l - 1].clone().add(end).sub(normals[l - 1]);
    positions.push(point.x, point.y, params.z);
    uvs.push(0.5, 0.0, 0.5, 1.0, 1.0, 0.0, 1.0, 1.0);
    colors.push(r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0, r, g, b, 1.0);
    startTimes.push(obj.time, obj.time, obj.time, obj.time);
    endTimes.push(obj.endTime, obj.endTime, obj.endTime, obj.endTime);
    hitTimes.push(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    centers.push(curve[l - 1].x, curve[l - 1].y, curve[l - 1].x, curve[l - 1].y, curve[l - 1].x, curve[l - 1].y, curve[l - 1].x, curve[l - 1].y);
    hitTypes.push(2.0, 2.0, 2.0, 2.0);
    indices.push(
        2 * l + 4, 2 * l + 5, 2 * l + 6,
        2 * l + 6, 2 * l + 5, 2 * l + 7
    );

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("index", new THREE.BufferAttribute(new Uint32Array(indices), 3));
    geometry.addAttribute("colorMask", new THREE.BufferAttribute(new Float32Array(colors), 4));
    geometry.addAttribute("startTime", new THREE.BufferAttribute(new Float32Array(startTimes), 1));
    geometry.addAttribute("endTime", new THREE.BufferAttribute(new Float32Array(endTimes), 1));
    geometry.addAttribute("hitTime", new THREE.BufferAttribute(new Float32Array(hitTimes), 1));
    geometry.addAttribute("center", new THREE.BufferAttribute(new Float32Array(centers), 2));
    geometry.addAttribute("hitType", new THREE.BufferAttribute(new Float32Array(hitTypes), 1));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_sliderBall = function (params) {
    var obj = params.object;
    var offset = params.mechanics.stack * obj.stack;
    var x = obj.x - 256 + offset;
    var y = 192 - obj.y + offset;
    var z = params.z;
    var s = params.mechanics.CS;

    var geometry = new THREE.BufferGeometry();

    var positions = [
        -s, -s, z,
        -s, +s, z,
        +s, +s, z,

        -s, -s, z,
        +s, +s, z,
        +s, -s, z
    ];

    var uvs = [
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ];

    var startTimes = [
        obj.time, obj.time, obj.time,
        obj.time, obj.time, obj.time
    ];

    var endTimes = [
        obj.endTime, obj.endTime, obj.endTime,
        obj.endTime, obj.endTime, obj.endTime
    ];

    var centers = [
        x, y, 0, x, y, 0, x, y, 0,
        x, y, 0, x, y, 0, x, y, 0
    ];

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("startTime", new THREE.BufferAttribute(new Float32Array(startTimes), 1));
    geometry.addAttribute("endTime", new THREE.BufferAttribute(new Float32Array(endTimes), 1));
    geometry.addAttribute("center", new THREE.BufferAttribute(new Float32Array(centers), 3));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_sliderFollow = function (params) {
    var obj = params.object;
    var offset = params.mechanics.stack * obj.stack;
    var x = obj.x - 256 + offset;
    var y = 192 - obj.y + offset;
    var z = params.z;
    var s = params.mechanics.CS * 2;

    var geometry = new THREE.BufferGeometry();

    var positions = [
        -s, -s, z,
        -s, +s, z,
        +s, +s, z,

        -s, -s, z,
        +s, +s, z,
        +s, -s, z
    ];

    var uvs = [
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ];

    var startTimes = [
        obj.time, obj.time, obj.time,
        obj.time, obj.time, obj.time
    ];

    var endTimes = [
        obj.endTime, obj.endTime, obj.endTime,
        obj.endTime, obj.endTime, obj.endTime
    ];

    var hitTimes = [
        Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY
    ];

    var releaseTimes = [
        Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY,
        Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY
    ];

    var centers = [
        x, y, 0, x, y, 0, x, y, 0,
        x, y, 0, x, y, 0, x, y, 0
    ];

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("startTime", new THREE.BufferAttribute(new Float32Array(startTimes), 1));
    geometry.addAttribute("endTime", new THREE.BufferAttribute(new Float32Array(endTimes), 1));
    geometry.addAttribute("hitTime", new THREE.BufferAttribute(new Float32Array(hitTimes), 1));
    geometry.addAttribute("releaseTime", new THREE.BufferAttribute(new Float32Array(releaseTimes), 1));
    geometry.addAttribute("center", new THREE.BufferAttribute(new Float32Array(centers), 3));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}

WOsu.ThreePlayer.prototype.createThree_spinner = function (params) {
    var obj = params.object;
    var z = params.z;

    var geometry = new THREE.BufferGeometry();

    var positions = [-320, -240, z, -320, 240, z,
        320, 240, z,

        -320, -240, z,
        320, 240, z,
        320, -240, z
    ];

    var uvs = [
        0.0, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.0, 0.0, 1.0, 1.0, 1.0, 0.0
    ];

    var startTimes = [
        obj.time, obj.time, obj.time,
        obj.time, obj.time, obj.time
    ];

    var endTimes = [
        obj.endTime, obj.endTime, obj.endTime,
        obj.endTime, obj.endTime, obj.endTime
    ];

    var spinAmounts = [
        0, 0, 0, 0, 0, 0
    ];

    geometry.addAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.addAttribute("uv", new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geometry.addAttribute("startTime", new THREE.BufferAttribute(new Float32Array(startTimes), 1));
    geometry.addAttribute("endTime", new THREE.BufferAttribute(new Float32Array(endTimes), 1));
    geometry.addAttribute("spinAmount", new THREE.BufferAttribute(new Float32Array(spinAmounts), 1));

    var mesh = new THREE.Mesh(geometry, params.material);

    return mesh;
}


// Overriding frames

WOsu.ThreePlayer.prototype.frame = function (manualTime) {
    WOsu.Player.prototype.frame.call(this, manualTime);
    
    var renderer = this.three.renderer;
    renderer.render(this.three.scene, this.three.camera);
}

WOsu.ThreePlayer.prototype.frame_game = function (time) {
    WOsu.Player.prototype.frame_game.call(this, time);
    
    var game = this.three.layers.gameplay.properties;

    // Show / hide approaching objects
    var threshold = this.game.mechanics.AR * 2;
    var mesh;
    // Show
    while (game.objectEnd < game.objectLength && (mesh = game.objects[game.objectEnd]).gameObject.time < time + threshold) {
        mesh.visible = true;
        game.objectEnd++;
    }
    // Hide
    while (game.objectStart < game.objectLength && (mesh = game.objects[game.objectStart]).gameObject.endTime < time - threshold) {
        mesh.visible = false;
        game.objectStart++;
    }

    // Set gameplay uniforms
    for (var i in game.materials) {
        game.materials[i].uniforms.currentTime.value = time;
    }

    // TODO Handler follow points
    // TODO Handle sliders and spinners as well
    // Slider balls
    for (var i = 0; i < this.game.currentSliders.length; i++) {
        var slider = this.game.currentSliders[i];
        var meshes = slider.data.meshes;
        var pos = slider.gameObject.getPosition(time);
        var centers = new THREE.BufferAttribute(WOsu.repeatFloat([pos[0] - 256, 192 - pos[1], 0], 6), 3);
        meshes.sliderBall.geometry.addAttribute("center", centers);
        meshes.sliderFollow.geometry.addAttribute("center", centers);
    }
}

