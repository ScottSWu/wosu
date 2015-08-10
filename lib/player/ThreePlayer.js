/**
    WOsu three.js player
*/
WOsu.ThreePlayer = function (options) {
    WOsu.Player.call(this, options);

    // Initialize Three.js
    this.initThree();
}

WOsu.ThreePlayer.prototype = Object.create(WOsu.Player.prototype);

WOsu.ThreePlayer.prototype.constructor = WOsu.ThreePlayer;

WOsu.ThreePlayer.prototype.initThree = function () {
    var instance = this;

    // New renderer, no sorting
    var renderer = new THREE.WebGLRenderer();
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

WOsu.Player.prototype.loadRenderer = function (loadResync) {
    var instance = this;

    this.callback.progress("Three", "Loading objects");

    this.three.layers = {};

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
    }], function () {
        // Finish up
        instance.loadThreeScene();

        instance.callback.progress("Three", "Finished");

        loadResync();
    });
}

