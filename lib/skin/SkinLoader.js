WOsu.SkinLoader = {};

/**
    Folder of the default skin elements. Elements in this folder must be complete and accessible.
 */
WOsu.SkinLoader.defaultURL = "Skins/default/";

/**
    Load skin images from a root path.
 */
// FUTURE read skin.ini, 4k, 5k etc.
// FUTURE handle animated skin elements
// FUTURE handle high resolution textures
WOsu.SkinLoader.load = function(loc, progress) {
    var instance = new WOsu.Skin(loc);
    var lt = this.loadedTextures = {};
    var textureList = WOsu.Skin.textureList;

    // Grab an array of texture names
    var textures = [];
    for (var i in textureList) {
        textures.push(i);
    }
    
    var total = textures.length;
    var loaded = 0;
    
    function localProgress(id, tex) {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        instance.textures[id] = tex;
        
        loaded++;

        progress(loaded, total);
    }
    
    textures.forEach(function(t) {
        THREE.ImageUtils.loadTexture(
            loc + textureList[t],
            undefined,
            function(tex) {
                localProgress(t, tex);
            },
            function(evt) {
                // Attempt to load default skin
                loc = WOsu.SkinLoader.defaultURL;
                THREE.ImageUtils.loadTexture(
                    loc + textureList[t],
                    undefined,
                    function(tex) {
                        localProgress(t, tex);
                    },
                    function(evt) {
                        localProgress(t, undefined);
                    }
                );
            }
        );
    });

    return instance;
}