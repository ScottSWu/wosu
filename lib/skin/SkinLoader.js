WOsu.SkinLoader = { };

WOsu.SkinLoader.defaultURL = "Skins/funnytrees - view/";

WOsu.SkinLoader.load = function(loc,progress) {
	var instance = new WOsu.Skin(loc);
	var lt = this.loadedTextures = {};
	var textureList = WOsu.Skin.textureList;
	
	function updateStatus(id,tex) {
		instance.textures[id] = tex;
		
		var loaded = 0;
		var total = 0;
		var textureList = WOsu.Skin.textureList;
		
		for (var image in textureList) {
			total++;
			if (instance.textures[image]!==undefined) {
				loaded++;
			}
		}
		
		if (loaded==total) {
			instance.status = 1;
		}
		else {
			instance.status = loaded/total;
		}
		
		progress("Skin",loaded + " / " + total + " loaded");
	}

	for (var i in textureList) {
		(function(j,loc) {
			WOsu.async(function() {
				THREE.ImageUtils.loadTexture(
					loc + textureList[j],
					undefined,
					function(tex) {
						updateStatus(j,tex);
					},
					function(evt) {
						loc = WOsu.SkinLoader.defaultURL;
						THREE.ImageUtils.loadTexture(
							loc + textureList[j],
							undefined,
							function(tex) {
								updateStatus(j,tex);
							},
							function(evt) {
								updateStatus(j,null);
							}
						);
					}
				);
			},5);
		})(i,loc);
	}
	
	return instance;
}
