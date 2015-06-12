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
WOsu.SkinLoader.load = function(loc, progress) {
    var instance = new WOsu.Skin(loc);
    var lt = this.loadedTextures = {};
    var textureList = WOsu.Skin.textureList;

    function localProgress(id, tex) {
        instance.textures[id] = tex;

        var loaded = 0;
        var total = 0;
        var textureList = WOsu.Skin.textureList;

        for (var image in textureList) {
            total++;
            if (instance.textures[image] !== undefined) {
                loaded++;
            }
        }

        progress(loaded, total);
    }

    for (var i in textureList) {
        // NOTE Is there a neater way to do this
        (function(j, loc) {
            WOsu.async(function() {
                // Load texture
                THREE.ImageUtils.loadTexture(
                    loc + textureList[j],
                    undefined,
                    function(tex) {
                        localProgress(j, tex);
                    },
                    function(evt) {
                        // Attempt to load default skin
                        loc = WOsu.SkinLoader.defaultURL;
                        THREE.ImageUtils.loadTexture(
                            loc + textureList[j],
                            undefined,
                            function(tex) {
                                localProgress(j, tex);
                            },
                            function(evt) {
                                updateStatus(j, null);
                            }
                        );
                    }
                );
            });
        })(i, loc);
    }

    return instance;
}