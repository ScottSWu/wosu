String.prototype.startsWith = function(str) {
    return this.slice(0, str.length) == str;
}

String.prototype.endsWith = function(str) {
    return this.slice(-str.length) == str;
}

var $$ = function(id) {
    return document.getElementById(id);
}

WOsu = function() {}

WOsu.prototype.contructor = WOsu;

// Beatmap API location
WOsu.API = "http://sc-wu.com:9678";

// Shader to support the alpha channel
WOsu.alphaShader = {
    vertexShader: [
        "attribute vec4 wosuColor;",
        "varying vec2 vUv;",
        "varying vec4 vColor;",

        "void main() {",
        "	vColor = wosuColor;",
        // TODO abuse built in colors normals and use "vColor = vec4(color, normal.x);"
        "	vUv = uv;",
        "	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}"
    ].join("\n"),

    fragmentShader: [
        "uniform sampler2D texture;",
        "varying vec4 vColor;",
        "varying vec2 vUv;",

        "void main() {",
        "	gl_FragColor = texture2D(texture, vUv) * vColor;",
        "}"
    ].join("\n"),

    blending: THREE.NormalBlending
};

/*
    Asynchronously call a function.
 */
WOsu.async = function(func, t) {
    setTimeout(func, t || 5);
}

/*
    Asynchronously call multiple functions with a callback when all functions finish.
    The first parameter is the calling instance. The second parameter is an array of functions
    and arguments. The third parameter is the final callback when all functions are finished.
 */
WOsu.resync = function(instance, funcs, callback) {
    var count = 0;
    var total = funcs.length;
    var finish = function() {
        count++;
        if (count >= total) {
            callback();
        }
    };
    
    funcs.map(function(o) {
        WOsu.async(function() {
            o.args.unshift(finish);
            o.fn.apply(instance, o.args);
        });
    });
}

// ==== Creation functions =====

WOsu.create_beat = function(cobj, offset, color, mechanics, textures) {
    var vecColor = new THREE.Vector4(color[0], color[1], color[2], 0);
    var vecWhite = new THREE.Vector4(1, 1, 1, 0);
    var objs = {};

    objs._main = new THREE.Object3D();
    objs._main.position.set(cobj.x + offset.x - 256, 192 - cobj.y - offset.y, offset.z);

    objs.hitcircle = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0,
        size: mechanics.CS * 0.95,
        color: vecColor,
        texture: textures.hitcircle
    });

    objs.hitcircle_overlay = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.1,
        size: mechanics.CS,
        color: vecWhite,
        texture: textures.hitcircle_overlay
    });

    objs.approachcircle = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.3,
        size: mechanics.CS,
        color: vecColor,
        texture: textures.approachcircle
    });

    objs._lighting = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.2,
        size: mechanics.CS,
        color: vecColor,
        texture: textures.lighting
    });

    WOsu.create_number_meshes({
        object: objs,
        number: cobj.comboNumber,
        x: 0,
        y: 0,
        z: 0.2,
        size: mechanics.CS / 2,
        color: vecWhite,
        textures: textures,
        prefix: "default"
    });

    objs.approachcircle.scale.set(3, 3, 1);

    for (var i in objs)
        if (i != "_main") objs._main.add(objs[i]);

    return objs;
}

WOsu.create_slider = function(cobj, offset, color, mechanics, textures) {
    var vecColor = new THREE.Vector4(color[0], color[1], color[2], 0);
    var vecWhite = new THREE.Vector4(1, 1, 1, 0);
    var objs = {};

    cobj.generateBezier();

    objs._main = new THREE.Object3D();
    objs._main.position.set(cobj.x + offset.x - 256, 192 - cobj.y - offset.y, offset.z);

    objs.hitcircle = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0,
        size: mechanics.CS * 0.95,
        color: vecColor,
        texture: textures.hitcircle
    });

    objs.hitcircle_overlay = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.1,
        size: mechanics.CS,
        color: vecWhite,
        texture: textures.hitcircle_overlay
    });

    objs.hitcircle_repeat = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.15,
        size: mechanics.CS,
        color: vecWhite,
        texture: textures.reversearrow
    });

    objs.approachcircle = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.3,
        size: mechanics.CS,
        color: vecColor,
        texture: textures.approachcircle
    });

    objs.endcircle = WOsu.create_quad_mesh({
        x: cobj.endX - cobj.x,
        y: -cobj.endY + cobj.y,
        z: -0.2,
        size: mechanics.CS * 0.95,
        color: vecColor,
        texture: textures.hitcircle
    });

    objs.endcircle_overlay = WOsu.create_quad_mesh({
        x: cobj.endX - cobj.x,
        y: -cobj.endY + cobj.y,
        z: -0.1,
        size: mechanics.CS,
        color: vecWhite,
        texture: textures.hitcircle_overlay
    });

    objs.endcircle_repeat = WOsu.create_quad_mesh({
        x: cobj.endX - cobj.x,
        y: -cobj.endY + cobj.y,
        z: -0.05,
        size: mechanics.CS,
        color: vecWhite,
        texture: textures.reversearrow
    });

    objs.slider = WOsu.create_curve_mesh({
        x: 0,
        y: 0,
        z: -0.4,
        size: mechanics.CS / 2 * 0.95,
        color: vecColor,
        texture: textures.hitcircle,
        object: cobj
    });

    objs.slider_overlay = WOsu.create_curve_mesh({
        x: 0,
        y: 0,
        z: -0.3,
        size: mechanics.CS / 2,
        color: vecWhite,
        texture: textures.hitcircle_overlay,
        object: cobj
    });

    objs.slider_ball = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.3,
        size: mechanics.CS,
        color: vecWhite,
        texture: textures.slider_b
    });

    objs.slider_follow = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.35,
        size: mechanics.CS * 2,
        color: vecWhite,
        texture: textures.slider_followcircle
    });

    objs._lighting = WOsu.create_quad_mesh({
        x: (cobj.repeats % 2 == 0) ? cobj.endX - cobj.x : 0,
        y: (cobj.repeats % 2 == 0) ? -cobj.endY + cobj.y : 0,
        z: 0.2,
        size: mechanics.CS,
        color: vecColor,
        texture: textures.lighting
    });

    WOsu.create_number_meshes({
        object: objs,
        number: cobj.comboNumber,
        x: 0,
        y: 0,
        z: 0.2,
        size: mechanics.CS / 2,
        color: vecWhite,
        textures: textures,
        prefix: "default"
    });

    objs.approachcircle.scale.set(3, 3, 1);
    objs.hitcircle_repeat.visible = false;
    objs.endcircle_repeat.visible = false;

    for (var i in objs)
        if (i != "_main") objs._main.add(objs[i]);

    return objs;
}

WOsu.create_spinner = function(cobj, offset, color, mechanics, textures) {
    var vecWhite = new THREE.Vector4(1, 1, 1, 0);
    var objs = {};

    objs._main = new THREE.Object3D();
    objs._main.position.set(cobj.x - 256, 192 - cobj.y, offset.z);

    objs.spinner_background = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0,
        width: 640,
        height: 480,
        color: vecWhite,
        texture: textures.spinner_background
    });

    objs.spinner_circle = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.1,
        size: 480,
        color: vecWhite,
        texture: textures.spinner_circle
    });

    objs.spinner_metre = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.2,
        width: 640,
        height: 480,
        color: vecWhite,
        texture: textures.spinner_metre
    });

    objs.spinner_approachcircle = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.3,
        size: 480,
        color: vecWhite,
        texture: textures.spinner_approachcircle
    });

    objs._lighting = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0.2,
        size: mechanics.CS,
        color: vecWhite,
        texture: textures.lighting
    });

    //objs._main.add(objs.spinner_background);
    objs._main.add(objs.spinner_circle);
    //objs._main.add(objs.spinner_metre);
    objs._main.add(objs.spinner_approachcircle);
    objs._main.add(objs._lighting);
    //for (var i in objs) if (i!="_main") objs._main.add(objs[i]);

    return objs;
}

WOsu.create_cursor = function(textures) {
    var vecWhite = new THREE.Vector4(1, 1, 1, 1);
    var objs = {};

    objs._main = new THREE.Object3D();
    objs._main.position.set(0, 0, 0);

    objs.cursor = WOsu.create_quad_mesh({
        x: 0,
        y: 0,
        z: 0,
        size: 32,
        color: vecWhite,
        texture: textures.cursor
    });

    objs._main.add(objs.cursor);

    return objs;
}

WOsu.create_quad_mesh = function(params) {
    if (params.size != undefined) {
        params.width = params.height = params.size;
    }

    var attributes = {
        wosuColor: {
            type: 'v4',
            value: []
        }
    };
    var uniforms = {
        texture: {
            type: 't',
            value: params.texture
        }
    };
    var mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(params.width, params.height, 1, 1),
        //new THREE.MeshBasicMaterial({ color : carr[0]*0x10000+carr[1]*0x100+carr[2] , map : WOsu.textures.skin.hitcircle , transparent : false })/*
        new THREE.ShaderMaterial({
            attributes: attributes,
            uniforms: uniforms,

            vertexShader: WOsu.alphaShader.vertexShader,
            fragmentShader: WOsu.alphaShader.fragmentShader,

            side: THREE.DoubleSide,
            blending: WOsu.alphaShader.blending,
            transparent: true
        })
        //*/
    );

    for (var j = 0; j < mesh.geometry.vertices.length; j++) {
        attributes.wosuColor.value[j] = params.color;
    }

    mesh.attributes = attributes;
    mesh.uniforms = uniforms;
    mesh.position.set(params.x, params.y, params.z);

    return mesh;
}

WOsu.create_curve_mesh = function(params) {
    var attributes = {
        wosuColor: {
            type: 'v4',
            value: []
        }
    };
    var uniforms = {
        texture: {
            type: 't',
            value: params.texture
        }
    };
    var geometry = WOsu.create_curve_geometry(
        params.object.curveX,
        params.object.curveY,
        params.object.x,
        params.object.y,
        params.size
    );
    var mesh = new THREE.Mesh(
        geometry,
        //new THREE.MeshBasicMaterial({ color : carr[0]*0x10000+carr[1]*0x100+carr[2] , map : WOsu.textures.skin.hitcircle , transparent : false })/*
        new THREE.ShaderMaterial({
            attributes: attributes,
            uniforms: uniforms,

            vertexShader: WOsu.alphaShader.vertexShader,
            fragmentShader: WOsu.alphaShader.fragmentShader,

            side: THREE.DoubleSide,
            blending: WOsu.alphaShader.blending,
            transparent: true
        })
        //*/
    );

    for (var j = 0; j < mesh.geometry.vertices.length; j++) {
        attributes.wosuColor.value[j] = params.color;
    }

    mesh.attributes = attributes;
    mesh.uniforms = uniforms;
    mesh.position.set(params.x, params.y, params.z);

    return mesh;
}

WOsu.create_curve_geometry = function(cx, cy, ox, oy, size) {
    var geometry = new THREE.Geometry();

    var bisectors = new Array(cx.length - 2);
    var angle, lastAngle = undefined,
        offset = 0;
    for (var i = 0; i < cx.length - 2; i++) {
        var a1 = Math.atan2(cy[i + 1] - cy[i], cx[i] - cx[i + 1]);
        var a2 = Math.atan2(cy[i + 1] - cy[i + 2], cx[i + 2] - cx[i + 1]);
        var angle = (a1 + a2) / 2;
        if (lastAngle != undefined) {
            if (Math.abs((angle + offset - lastAngle) % (2 * Math.PI)) > Math.PI / 2) {
                offset += Math.PI;
            }
        }
        lastAngle = angle + offset;
        bisectors[i] = new THREE.Vector3(size * Math.cos(lastAngle), size * Math.sin(lastAngle), 0);
    }

    var bisector, lastb = bisectors[0],
        winding = false;
    var offset = new THREE.Vector3(0, size, 0);
    for (var i = 0; i < cx.length; i++) {
        if (i == 0) bisector = bisectors[0];
        else if (i == cx.length - 1) bisector = bisectors[i - 2];
        else bisector = bisectors[i - 1];

        var curve = new THREE.Vector3(cx[i] - ox, oy - cy[i], 0);

        geometry.vertices.push(curve.clone().add(bisector));
        geometry.vertices.push(curve.clone().sub(bisector));
    }

    var normal = new THREE.Vector3(0, 0, 1);
    var uvl = new THREE.Vector2(0.5, 0);
    var uvr = new THREE.Vector2(0.5, 1);
    var face;
    for (var i = 0; i < cx.length - 1; i++) {
        face = new THREE.Face3(2 * i, 2 * i + 1, 2 * i + 2);
        face.normal.copy(normal);
        face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());

        geometry.faces.push(face);
        geometry.faceVertexUvs[0].push([uvl.clone(), uvr.clone(), uvl.clone()]);

        face = new THREE.Face3(2 * i + 1, 2 * i + 2, 2 * i + 3);
        face.normal.copy(normal);
        face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());

        geometry.faces.push(face);
        geometry.faceVertexUvs[0].push([uvr.clone(), uvl.clone(), uvr.clone()]);
    }

    geometry.computeCentroids();
    geometry.computeBoundingBox();

    return geometry;
}

WOsu.create_number_meshes = function(params) {
    if (params.number < 10) {
        var d1 = ~~ (params.number);

        var tex = params.textures[params.prefix + "_" + d1];
        var scale = tex.image.width / tex.image.height * params.size;
        params.object.digit1 = WOsu.create_quad_mesh({
            x: params.x,
            y: params.y,
            z: params.z,
            width: scale,
            height: params.size,
            color: params.color,
            texture: tex
        });
    } else if (params.number < 100) {
        var d1 = ~~ (params.number / 10);
        var d2 = ~~ (params.number % 10);

        var tex1 = params.textures[params.prefix + "_" + d1];
        var scale1 = tex1.image.width / tex1.image.height * params.size;
        var tex2 = params.textures[params.prefix + "_" + d2];
        var scale2 = tex2.image.width / tex2.image.height * params.size;
        var midpoint = (scale2 - scale1) / 2;

        params.object.digit1 = WOsu.create_quad_mesh({
            x: params.x - scale2 / 2,
            y: params.y,
            z: params.z,
            width: scale1,
            height: params.size,
            color: params.color,
            texture: tex1
        });

        params.object.digit2 = WOsu.create_quad_mesh({
            x: params.x + scale1 / 2,
            y: params.y,
            z: params.z,
            width: scale2,
            height: params.size,
            color: params.color,
            texture: tex2
        });
    }
}
WOsu.Beatmap = function() {
	this.BeatmapData      = new WOsu.BeatmapData();
	this.BeatmapEvents    = new WOsu.BeatmapEvents();
	this.BeatmapObjects   = new WOsu.BeatmapObjects();
	this.BeatmapMechanics = new WOsu.BeatmapMechanics();
	this.status           = "";
}

WOsu.Beatmap.prototype.constructor = WOsu.Beatmap;

WOsu.Beatmap.sectionKeys = [
	"HEADING",
	"GENERAL",
	"EDITOR",
	"METADATA",
	"DIFFICULTY",
	"EVENTS",
	"TIMINGPOINTS",
	"COLOURS",
	"HITOBJECTS",
	];

WOsu.Beatmap.stringKeys = [
	"AudioFilename","SampleSet",
	
	"Title","Artist","Creator","Version","Source","Tags",
	
	];
WOsu.Beatmap.arrayKeys = [
	
	"EditorBookmarks",
	
	
	];
WOsu.Beatmap.floatKeys = [
	"StackLeniency",
	
	
	"SliderMultiplier","SliderTickRate",
	];
WOsu.Beatmap.integerKeys = [
	"AudioLeadIn","PreviewTime","Mode",
	"BeatDivisor","GridSize",
	
	"HPDrainRate","CircleSize","OverallDifficulty","ApproachRate",
	];
WOsu.Beatmap.booleanKeys = [
	"Countdown","LetterboxInBreaks","StoryFireInFront",
	"DistanceSnap",
	
	
	];

WOsu.Beatmap.isStringKey  = function(key) { return WOsu.Beatmap.stringKeys.indexOf(key)>=0; }
WOsu.Beatmap.isArrayKey   = function(key) { return WOsu.Beatmap.arrayKeys.indexOf(key)>=0; }
WOsu.Beatmap.isFloatKey   = function(key) { return WOsu.Beatmap.floatKeys.indexOf(key)>=0; }
WOsu.Beatmap.isIntegerKey = function(key) { return WOsu.Beatmap.integerKeys.indexOf(key)>=0; }
WOsu.Beatmap.isBooleanKey = function(key) { return WOsu.Beatmap.booleanKeys.indexOf(key)>=0; }

WOsu.Beatmap.prototype.setKey = function(obj,key,value) {
	if (WOsu.Beatmap.isStringKey(key)) obj[key] = value;
	else if (WOsu.Beatmap.isArrayKey(key)) obj[key] = value.split(",");
	else if (WOsu.Beatmap.isFloatKey(key)) obj[key] = parseFloat(value);
	else if (WOsu.Beatmap.isIntegerKey(key)) obj[key] = parseInt(value);
	else if (WOsu.Beatmap.isBooleanKey(key)) obj[key] = (value=="true" || value=="1") ? true : false;
}
	
WOsu.Beatmap.eventLayerTypes = [
	"Background",
	"Break",
	"Storyboard Layer 0",
	"Storyboard Layer 1",
	"Storyboard Layer 2",
	"Storyboard Layer 3",
	"Storyboard Sound",
	"Background Colour",
	];
WOsu.Beatmap.getEventLayerType = function(key) {
	for (var i=0; i<this.eventLayerTypes.length; i++) {
		if (key.indexOf(this.eventLayerTypes[i])==0) return i;
	}
	return -1;
}

WOsu.Beatmap.prototype.calculate = function() {
	var bm = this.BeatmapMechanics;
	var bd = this.BeatmapData;
	bm.AR = (bd.ApproachRate<=5) ? 1800-bd.ApproachRate*120 : 1200-(bd.ApproachRate-5)*150;
	bm.CS = 140 - 15*bd.CircleSize;
	bm.OD = 160 - bd.OverallDifficulty*6;
	
	var be = this.BeatmapEvents;
	bm.minBPM = -1;
	bm.maxBPM = -1;
	for (var i=0; i<be.TimingPoints.length; i++) {
		var tp = be.TimingPoints[i];
		if (!tp.inherited) {
			if (bm.minBPM==-1 || tp.bpm>bm.minBPM) {
				bm.minBPM = tp.bpm;
			}
			if (bm.maxBPM==-1 || tp.bpm<bm.maxBPM) {
				bm.maxBPM = tp.bpm;
			}
		}
	}
	bm.minBPM = 60000/bm.minBPM;
	bm.maxBPM = 60000/bm.maxBPM;
}

WOsu.Beatmap.prototype.updateStatus = function(s) {
	this.status = s;
}
WOsu.BeatmapLoader = { };

WOsu.BeatmapLoader.load = function(text) {
	var map = new WOsu.Beatmap();
	var lines = text.split("\n");
	
	var index = 0;
	var section = "HEADING";
	var key,value;
	var place = -1;
	var link = 0;
	var line;
	while (index<lines.length) {
		line = lines[index++].replace(/\n/g,"");
		if (line.trim().startsWith("[") && line.trim().endsWith("]")) {
			section = line.trim().substring(1,line.trim().length-1).toUpperCase();
		}
		else if (line.trim()!="") {
			if (section=="HEADING") {
				map.BeatmapData.head += line.trim() + "\n";
			}
			else if (section=="GENERAL") {
				line = line.trim();
				if (line.indexOf(":")>0) {
					key = line.substring(0,line.indexOf(":")).trim();
					value = line.substring(line.indexOf(":")+1).trim();
					map.setKey(map.BeatmapData,key,value);
				}
			}
			else if (section=="EDITOR") {
				line = line.trim();
				if (line.indexOf(":")>0) {
					key = line.substring(0,line.indexOf(":")).trim();
					value = line.substring(line.indexOf(":")+1).trim();
					map.setKey(map.BeatmapData,key,value);
				}
			}
			else if (section=="METADATA") {
				line = line.trim();
				if (line.indexOf(":")>0) {
					key = line.substring(0,line.indexOf(":")).trim();
					value = line.substring(line.indexOf(":")+1).trim();
					map.setKey(map.BeatmapData,key,value);
				}
			}
			else if (section=="DIFFICULTY") {
				line = line.trim();
				if (line.indexOf(":")>0) {
					key = line.substring(0,line.indexOf(":")).trim();
					value = line.substring(line.indexOf(":")+1).trim();
					map.setKey(map.BeatmapData,key,value);
				}
			}
			else if (section=="EVENTS") {
				if (line.startsWith("//")) {
					place = WOsu.Beatmap.getEventLayerType(line.substring(2));
				}
				else {
					switch (place) {
						case 0:
							map.BeatmapEvents.BackgroundEvents.push(new WOsu.BackgroundEvent(line)); break;
						case 1:
							map.BeatmapEvents.BreakPeriods.push(new WOsu.BreakPeriod(line)); break;
						case 2:
							map.BeatmapEvents.hasStoryboardBackground = true;
						case 3: case 4: case 5:
							if (line.startsWith(" ")) {
								map.BeatmapEvents.StoryboardObjects[map.BeatmapEvents.StoryboardObjects.length-1].addCommand(line);
							}
							else {
								map.BeatmapEvents.StoryboardObjects.push(new WOsu.StoryboardObject(line));
							}
							break;
						case 6:
						case 7:
						default: break;
					}
				}
			}
			else if (section=="TIMINGPOINTS") {
				map.BeatmapEvents.TimingPoints.push(new WOsu.TimingPoint(map,line));
			}
			else if (section=="COLOURS") {
				if (line.indexOf(":")>0) {
					value = line.substring(line.indexOf(":")+1).trim().split(",");
					map.BeatmapEvents.Colours.push([parseInt(value[0])/255,parseInt(value[1])/255,parseInt(value[2])/255]);
				}
			}
			else if (section=="HITOBJECTS") {
				map.BeatmapObjects.push(WOsu.HitObject.getObject(map,line));
			}
		}
	}
	
	WOsu.async(function() { map.updateStatus("Completed") });
	
	return map;
}

WOsu.Beatmap.readBeatmap = function(folder,map) {
	var req = new XMLHttpRequest();
	req.open("GET","GetBeatmap.php?folder=" + encodeURIComponent(folder) + "&map=" + encodeURIComponent(map),false);
	req.send();
	var res = req.responseText;
	
	if (res.startsWith("Error")) {
		return false;
	}
	res = res.substring(0,res.lastIndexOf("~~\\e\\~~"));
	var data = JSON.parse(res);
	
	var map = new WOsu.Beatmap();
	map.BeatmapData.head = data.Head;
	
	// Mapped variables
	var line,key,value;
	
	// General
	for (var i=0; i<data.General.length; i++) {
		line = data.General[i].trim();
		if (line.indexOf(":")>0) {
			key = line.substring(0,line.indexOf(":")).trim();
			value = line.substring(line.indexOf(":")+1).trim();
			map.setKey(map.BeatmapData,key,value);
		}
	}
	
	// Editor
	for (var i=0; i<data.Editor.length; i++) {
		line = data.Editor[i].trim();
		if (line.indexOf(":")>0) {
			key = line.substring(0,line.indexOf(":")).trim();
			value = line.substring(line.indexOf(":")+1).trim();
			map.setKey(map.BeatmapData,key,value);
		}
	}
	
	// Metadata
	for (var i=0; i<data.Metadata.length; i++) {
		line = data.Metadata[i].trim();
		if (line.indexOf(":")>0) {
			key = line.substring(0,line.indexOf(":")).trim();
			value = line.substring(line.indexOf(":")+1).trim();
			map.setKey(map.BeatmapData,key,value);
		}
	}
	
	// Difficulty
	for (var i=0; i<data.Difficulty.length; i++) {
		line = data.Difficulty[i].trim();
		if (line.indexOf(":")>0) {
			key = line.substring(0,line.indexOf(":")).trim();
			value = line.substring(line.indexOf(":")+1).trim();
			map.setKey(map.BeatmapData,key,value);
		}
	}
	
	// Events
	var place = -1;
	var link = 0;
	for (var i=0; i<data.Events.length; i++) {
		line = data.Events[i];
		if (line.startsWith("//")) {
			place = WOsu.Beatmap.getEventLayerType(line.substring(2));
		}
		else {
			switch (place) {
				case 0:
					map.BeatmapEvents.BackgroundEvents.push(new WOsu.BackgroundEvent(line)); break;
				case 1:
					map.BeatmapEvents.BreakPeriods.push(new WOsu.BreakPeriod(line)); break;
				case 2:
					map.BeatmapEvents.hasStoryboardBackground = true;
				case 3: case 4: case 5:
					if (line.startsWith(" ")) {
						map.BeatmapEvents.StoryboardObjects[map.BeatmapEvents.StoryboardObjects.length-1].addCommand(line);
					}
					else {
						map.BeatmapEvents.StoryboardObjects.push(new WOsu.StoryboardObject(line));
					}
					break;
				case 6:
				case 7:
				default: break;
			}
		}
	}
	
	// External storyboard
	place = -1;
	link = 0;
	if (data.Storyboard!=undefined) {
		for (var i=0; i<data.Storyboard.length; i++) {
			line = data.Storyboard[i];
			if (line.startsWith("//")) {
				place = WOsu.Beatmap.getEventLayerType(line.substring(2));
			}
			else {
				switch (place) {
					case 0:
						map.BeatmapEvents.BackgroundEvents.push(new WOsu.BackgroundEvent(line)); break;
					case 1:
						map.BeatmapEvents.BreakPeriods.push(new WOsu.BreakPeriod(line)); break;
					case 2:
						map.BeatmapEvents.hasStoryboardBackground = true;
					case 3: case 4: case 5:
						if (line.startsWith(" ")) {
							map.BeatmapEvents.StoryboardObjects[map.BeatmapEvents.StoryboardObjects.length-1].addCommand(line);
						}
						else {
							map.BeatmapEvents.StoryboardObjects.push(new WOsu.StoryboardObject(line));
						}
						break;
					case 6:
					case 7:
					default: break;
				}
			}
		}
		map.BeatmapEvents.hasExternalStoryboard = true;
	}
	
	// Timing Points
	for (var i=0; i<data.TimingPoints.length; i++) {
		line = data.TimingPoints[i];
		map.BeatmapEvents.TimingPoints.push(new WOsu.TimingPoint(map,line));
	}
	
	// Colours
	if (data.Colours!=undefined) {
		var hex;
		for (var i=0; i<data.Colours.length; i++) {
			line = data.Colours[i];
			if (line.indexOf(":")>0) {
				value = line.substring(line.indexOf(":")+1).trim().split(",");
				map.BeatmapEvents.Colours.push([parseInt(value[0])/255,parseInt(value[1])/255,parseInt(value[2])/255]);
			}
		}
	}
	
	// Hit Objects
	var currentTiming = 0;
	for (var i=0; i<data.HitObjects.length; i++) {
		line = data.HitObjects[i];
		map.BeatmapObjects.push(WOsu.HitObject.getObject(map,line));
	}
	
	return map;
}

WOsu.BeatmapData = function() {
	// Program variables
	this.head = "";
	this.AudioElement = null;
	this.BeatMapFileName = "";
	this.SongFileName = "";
	
	// General
	this.AudioFilename = "";
	this.AudioLeadIn = 0;
	this.PreviewTime = 0;
	this.Countdown = false;
	this.SampleSet = "";
	this.StackLeniency = 1;
	this.Mode = 0;
	this.LetterboxInBreaks = false;
	
	// Editor
	this.EditorBookmarks = null;
	this.DistanceSpacing = 1;
	this.BeatDivisor = 4;
	this.GridSize = 4;
	
	// Metadata
	this.Title = "";
	this.Artist = "";
	this.Creator = "";
	this.Version = "";
	this.Source = "";
	this.Tags = "";
	
	// Difficulty
	this.HPDrainRate = 5;
	this.CircleSize = 5;
	this.OverallDifficulty = 5;
	this.ApproachRate = 5;
	this.SliderMultiplier = 1;
	this.SliderTickRate = 1;
}

WOsu.BeatmapEvents = function() {
	// Events
	this.BackgroundEvents = new Array();
	this.BreakPeriods = new Array();
	this.StoryboardObjects = new Array();
	this.hasExternalStoryboard = false;
	this.hasStoryboardBackground = false;
	
	// Timing Points
	this.TimingPoints = new Array();
	
	// Colours
	this.Colours = new Array();
}

WOsu.BeatmapObjects = function() {
	Array.call(this);
}

WOsu.BeatmapObjects.prototype = Object.create( Array.prototype );

WOsu.BeatmapMechanics = function() {
	this.AR = 0;
	this.CS = 0;
	this.OD = 0;
	this.minBPM = 0;
	this.maxBPM = 1;
}

WOsu.BeatmapMechanics.prototype.constructor = WOsu.BeatmapMechanics;

WOsu.Event = function(line) {
	this.parseParts = null;
	
	this.type = 0;
	this.time = 0;
	
	this.parse(line);
}

WOsu.Event.prototype.constructor = WOsu.Event;

WOsu.Event.prototype.parse = function(line) {
	this.parseParts = line.split(",");
	
	if (!isNaN(parseInt(this.parseParts[0]))) {
		this.type = parseInt(this.parseParts[0]);
		this.time = parseInt(this.parseParts[1]);
	}
	else {
		if (this.parseParts[0].startsWith("Video")) {
			this.type = WOsu.Event.TYPE_VIDEO;
			this.time = parseInt(this.parseParts[1]);
		}
		else if (this.parseParts[0].startsWith("Sprite")) {
			this.type = WOsu.Event.TYPE_SPRITE;
		}
		else if (this.parseParts[0].startsWith("Animation")) {
			this.type = WOsu.Event.TYPE_ANIMATION;
		}
	}
}

WOsu.Event.TYPE_BACKGROUND		= 0;
WOsu.Event.TYPE_VIDEO			= 1;
WOsu.Event.TYPE_BREAKPERIOD		= 2;
WOsu.Event.TYPE_COLORTRANSFORM	= 3;
WOsu.Event.TYPE_SPRITE			= 4;
WOsu.Event.TYPE_ANIMATION		= 5;

WOsu.BackgroundEvent = function(line) {
	WOsu.Event.call(this,line);
	
	this.media = "";
	
	this.parseBackgroundEvent(line);
}

WOsu.BackgroundEvent.prototype = Object.create( WOsu.Event.prototype );

WOsu.BackgroundEvent.prototype.parseBackgroundEvent = function(line) {
	this.parse(line);
	
	this.media = this.parseParts[2].replace(/\"/g,"").replace(/\\/g,"/");
}
WOsu.BreakPeriod = function(line) {
	WOsu.Event.call(this,line);
	
	this.endTime = 0;
	
	this.parseBreakPeriod(line);
}

WOsu.BreakPeriod.prototype = Object.create( WOsu.Event.prototype );

WOsu.BreakPeriod.prototype.parseBreakPeriod = function(line) {
	this.parse(line);
	
	this.endTime = parseInt(this.parseParts[2]);
}
WOsu.StoryboardEvent = function(line,link,comp) {
	this.parseParts = null;
	
	this.eventType = 0;
	this.compound = false;
	this.easing = 0;
	this.startTime = 0;
	this.endTime = 0;
	this.loopLink = -1;
	this.loopStartTime = -1;
	this.loopEndTime = -1;
	this.startX = 0;
	this.startY = 0;
	this.startZ = 0;
	this.endX = 0;
	this.endY = 0;
	this.endZ = 0;
	
	this.parseStoryboardEvent(line,link,comp);
}

WOsu.StoryboardEvent.prototype.constructor = WOsu.StoryboardEvent;

WOsu.StoryboardEvent.prototype.parseStoryboardEvent = function(line,link,comp) {
	this.parseParts = line.split(",");
	
	if (link!==undefined && link!=null) this.loopLink = link;
	if (comp!==undefined && comp!=null) this.compound = comp;
	
	if (this.parseParts[0]=="L") {
		this.eventType = WOsu.StoryboardEvent.TYPE_L;
		this.startTime = parseInt(this.parseParts[1]);
		this.loopStartTime = -1;
		this.loopEndTime = -1;
		this.startX = parseInt(this.parseParts[2]);
	}
	else if (this.parseParts[0]=="T") {
		this.eventType = WOsu.StoryboardEvent.TYPE_T;
	}
	else {
		this.easing = parseInt(this.parseParts[1]);
		this.startTime = parseInt(this.parseParts[2]);
		if (this.parseParts[3]=="") this.endTime = this.startTime;
		else this.endTime = parseInt(this.parseParts[3]);
		
		if (this.parseParts[0]=="F") {
			this.eventType = WOsu.StoryboardEvent.TYPE_F;
			this.startX = parseFloat(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endX = parseFloat(this.parseParts[5]);
			}
			else {
				this.endX = this.startX;
			}
		}
		else if (this.parseParts[0]=="M") {
			this.eventType = WOsu.StoryboardEvent.TYPE_M;
			this.startX = parseInt(this.parseParts[4]);
			this.startY = parseInt(this.parseParts[5]);
			if (this.parseParts.length>6) {
				this.endX = parseInt(this.parseParts[6]);
				this.endY = parseInt(this.parseParts[7]);
			}
			else {
				this.endX = this.startX;
				this.endY = this.startY;
			}
		}
		else if (this.parseParts[0]=="MX") {
			this.eventType = WOsu.StoryboardEvent.TYPE_MX;
			this.startX = parseInt(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endX = parseInt(this.parseParts[5]);
			}
			else {
				this.endX = this.startX;
			}
		}
		else if (this.parseParts[0]=="MY") {
			this.eventType = WOsu.StoryboardEvent.TYPE_MY;
			this.startY = parseInt(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endY = parseInt(this.parseParts[5]);
			}
			else {
				this.endY = this.startY;
			}
		}
		else if (this.parseParts[0]=="S") {
			this.eventType = WOsu.StoryboardEvent.TYPE_S;
			this.startX = parseFloat(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endX = parseFloat(this.parseParts[5]);
			}
			else {
				this.endX = this.startX;
			}
		}
		else if (this.parseParts[0]=="V") {
			this.eventType = WOsu.StoryboardEvent.TYPE_V;
			this.startX = parseFloat(this.parseParts[4]);
			this.startY = parseFloat(this.parseParts[5]);
			if (this.parseParts.length>6) {
				this.endX = parseFloat(this.parseParts[6]);
				this.endY = parseFloat(this.parseParts[7]);
			}
			else {
				this.endX = this.startX;
				this.endY = this.startY;
			}
		}
		else if (this.parseParts[0]=="R") {
			this.eventType = WOsu.StoryboardEvent.TYPE_R;
			this.startX = parseFloat(this.parseParts[4]);
			if (this.parseParts.length>5) {
				this.endX = parseFloat(this.parseParts[5]);
			}
			else {
				this.endX = this.startX;
			}
		}
		else if (this.parseParts[0]=="C") {
			this.eventType = WOsu.StoryboardEvent.TYPE_C;
			this.startX = parseInt(this.parseParts[4]);
			this.startY = parseInt(this.parseParts[5]);
			this.startZ = parseInt(this.parseParts[6]);
			if (this.parseParts.length>7) {
				this.endX = parseInt(this.parseParts[6]);
				this.endY = parseInt(this.parseParts[7]);
				this.endZ = parseInt(this.parseParts[8]);
			}
			else {
				this.endX = this.startX;
				this.endY = this.startY;
				this.endZ = this.startZ;
			}
		}
		else if (this.parseParts[0]=="P") {
			this.eventType = WOsu.StoryboardEvent.TYPE_P;
			if (this.parseParts[4][0]=="H") {
				this.startX = 0;
			}
			else if (this.parseParts[4][0]=="V") {
				this.startX = 1;
			}
			else if (this.parseParts[4][0]=="A") {
				this.startX = 2;
			}
		}
	}
}

WOsu.StoryboardEvent.prototype.isInstant = function() { return this.startTime==this.endTime; }

WOsu.StoryboardEvent.TYPE_F		= 0;
WOsu.StoryboardEvent.TYPE_M		= 1;
WOsu.StoryboardEvent.TYPE_MX	= 2;
WOsu.StoryboardEvent.TYPE_MY	= 3;
WOsu.StoryboardEvent.TYPE_S		= 4;
WOsu.StoryboardEvent.TYPE_V		= 5;
WOsu.StoryboardEvent.TYPE_R		= 6;
WOsu.StoryboardEvent.TYPE_C		= 7;
WOsu.StoryboardEvent.TYPE_P		= 8;
WOsu.StoryboardEvent.TYPE_L		= 9;
WOsu.StoryboardEvent.TYPE_T		= 10;
WOsu.StoryboardObject = function(line) {
	WOsu.Event.call(this,line);
	
	this.startTime = 0;
	this.endTime = 0;
	this.layer = 0;
	this.origin = 0;
	this.filePath = "";
	this.x = 0;
	this.y = 0;
	this.offsetX = 0;
	this.offsetY = 0;
	this.frameCount = 0;
	this.frameDelay = 0;
	this.loopType = 0;
	this.events = new Array(0);
	this.hasCompound = false;
	
	this.fade = 1;
	this.scaleX = 1;
	this.scaleY = 1;
	this.rotation = 0;
	this.r = 1;
	this.g = 1;
	this.b = 1;
	this.parameterH = false;
	this.parameterV = false;
	this.parameterA = false;
	
	this.parseStoryboardObject(line);
}

WOsu.StoryboardObject.prototype = Object.create( WOsu.Event.prototype );

WOsu.StoryboardObject.prototype.clone = function() {
	var original = this;
	clone = {};
	for (var i in original) {
		clone[i] = original[i];
	}
	return clone;
}

WOsu.StoryboardObject.prototype.parseStoryboardObject = function(line) {
	this.parse(line);
	
	if (this.parseParts[1]=="Background") {
		this.layer = 0;
	}
	else if (this.parseParts[1]=="Fail") {
		this.layer = 1;
	}
	else if (this.parseParts[1]=="Pass") {
		this.layer = 2;
	}
	else if (this.parseParts[1]=="Foreground") {
		this.layer = 3;
	}
	else {
		this.layer = parseInt(this.parseParts[1]);
		if (isNaN(this.layer)) this.layer = 0;
	}
	
	if (this.parseParts[2]=="TopLeft") {
		this.origin = 0;
	}
	else if (this.parseParts[2]=="TopCentre") {
		this.origin = 1;
	}
	else if (this.parseParts[2]=="TopRight") {
		this.origin = 2;
	}
	else if (this.parseParts[2]=="CentreLeft") {
		this.origin = 3;
	}
	else if (this.parseParts[2]=="Centre") {
		this.origin = 4;
	}
	else if (this.parseParts[2]=="CentreRight") {
		this.origin = 5;
	}
	else if (this.parseParts[2]=="BottomLeft") {
		this.origin = 6;
	}
	else if (this.parseParts[2]=="BottomCentre") {
		this.origin = 7;
	}
	else if (this.parseParts[2]=="BottomRight") {
		this.origin = 8;
	}
	else {
		this.origin = parseInt(this.parseParts[2]);
		if (isNaN(this.origin)) {
			this.origin = 0;
		}
	}
	
	this.filepath = this.parseParts[3].replace(/\"/g,"").replace(/\\/g,"/");
	this.x = parseInt(this.parseParts[4]);
	this.y = parseInt(this.parseParts[5]);
	
	if (this.type==WOsu.Event.TYPE_ANIMATION) {
		this.frameCount = parseInt(this.parseParts[6]);
		this.frameDelay = parseInt(this.parseParts[7]);
		if (this.parseParts[8]=="LoopForever") {
			this.loopType = 0;
		}
		else if (this.parseParts[8]=="LoopOnce") {
			this.loopType = 1;
		}
		else {
			this.loopType = parseInt(this.parseParts[8]);
			if (isNaN(this.loopType)) this.loopType = 1;
		}
	}
}

WOsu.StoryboardObject.prototype.isVisible = function(time) {
	if (time>this.endTime || time<this.startTime) return false;
	return true;
	
	/*
	var relativeTime;
	if (this.time>this.endTime) return false;
	for (var i=this.events.length-1; i>=0; i--) {
		if (!this.events[i].compound) {
			if (this.events[i].type==WOsu.StoryboardEvent.TYPE_L) {
				if (this.time>this.events[i].endTime) return false;
				else if (this.time>=this.events[i].startTime+this.events[i].loopStartTime) return true;
			}
			else {
				if (this.events[i].startTime<=this.time) {
					return true;
				}
			}
		}
	}
	return false;
	*/
}

WOsu.StoryboardObject.prototype.addCommand = function(line) {
	var event,newEvent;
	if (line.startsWith("  ")) {
		for (var i=this.events.length-1; i>=0; i--) {
			event = this.events[i];
			if (event.eventType==WOsu.StoryboardEvent.TYPE_L || event.eventType==WOsu.StoryboardEvent.TYPE_T) {
				this.hasCompound = true;
				newEvent = new WOsu.StoryboardEvent(line.substring(2),i,true);
				this.events.push(newEvent);
				event.endX = this.events.length-1;
				if (event.loopStartTime==-1 || newEvent.startTime<event.loopStartTime) {
					event.loopStartTime = newEvent.startTime;
				}
				if (event.loopEndTime==-1 || newEvent.endTime>event.loopEndTime) {
					event.loopEndTime = newEvent.endTime;
					event.endTime = event.startTime + event.loopStartTime + (newEvent.endTime-event.loopStartTime)*event.startX;
				}
				break;
			}
		}
	}
	else {
		this.events.push(new WOsu.StoryboardEvent(line.substring(1)));
	}
}

WOsu.StoryboardObject.prototype.getImageFile = function(n) {
	if (this.type==WOsu.Event.TYPE_SPRITE) {
		return this.filepath;
	}
	else if (this.type==WOsu.Event.TYPE_ANIMATION) {
		return this.filepath.substring(0,this.filepath.lastIndexOf(".")) + n + this.filepath.substring(this.filepath.lastIndexOf("."));
	}
	return this.filepath;
}

WOsu.StoryboardObject.prototype.getNumberImages = function() {
	if (this.type==WOsu.Event.TYPE_SPRITE) {
		return 1;
	}
	else if (this.type==WOsu.Event.TYPE_ANIMATION) {
		return this.frameCount;
	}
	return this.frameCount;
}

WOsu.TimingPoint = function(parent,line) {
	this.parseParts = null;
	
	this.map = parent;
	this.time = 0;
	this.bpm = 0;	// This is actually like milliseconds per beat or something.
					// Removes the need to divide when calculating slider speeds.
	this.meter = 4;
	this.sampletype = 0;
	this.sampleset = 0;
	this.volume = 0;
	this.inherited = false;
	this.negativeBPM = false;
	this.ki = false;
	
	this.parse(line);
}

WOsu.TimingPoint.prototype.constructor = WOsu.TimingPoint;

WOsu.TimingPoint.prototype.parse = function(line) {
	this.parseParts = line.split(",");
	
	this.time = parseInt(this.parseParts[0]);
	this.bpm = parseFloat(this.parseParts[1]);
	this.meter = parseInt(this.parseParts[2]);
	this.sampletype = parseInt(this.parseParts[3]);
	this.sampleset = parseInt(this.parseParts[4]);
	this.volume = parseFloat(this.parseParts[5]);
	this.inherited = (this.parseParts[6]=="0") ? true : false;
	this.ki = (this.parseParts[7]=="0") ? true : false;
	
	if (this.bpm<0) {
		this.negativeBPM = true;
		var tp = this.map.BeatmapEvents.TimingPoints;
		for (var i=tp.length-1; i>=0; i--) {
			if (!tp[i].negativeBPM && tp[i].time<=this.time) {
				this.bpm = -this.bpm/100.0 * tp[i].bpm;
				break;
			}
		}
	}
}
WOsu.ColourEvent = function(line) {
	WOsu.Event.call(this,line);
	
	this.r = 255;
	this.g = 255;
	this.b = 255;
	
	this.parseColourEvent(line);
}

WOsu.ColourEvent.prototype = Object.create( WOsu.Event.prototype );

WOsu.ColourEvent.prototype.parseColourEvent = function(line) {
	this.parse(line);
	
	this.r = parseInt(this.parseParts[2]);
	this.g = parseInt(this.parseParts[3]);
	this.b = parseInt(this.parseParts[4]);
}
WOsu.HitObject = function(map,line) {
	this.parseParts = null;
	
	this.map = map;
	this.x = 0; // X coordinate (0-512)
	this.y = 0; // Y coordinate (0-392)
	this.endX = this.x;
	this.endY = this.y;
	this.time = 0; // Milliseconds after the beginning of the song
	this.endTime = 0;
	this.type; // Bit (3,2,1,0) -> (Spinner,New combo,Slider,Beat)
	this.combo = 0; // Combo color
	this.comboNumber = 1; // Combo number
	this.hitsound = 0; // Hit sound; Bit (3,2,1,0) -> (Clap,Finish,Whistle,Normal)
	
	this.parse(line);
}

WOsu.HitObject.getObject = function(map,line) {
	var t = new WOsu.HitObject(map,line);
	if ((t.type & 8)==8) {
		t = new WOsu.SpinnerObject(map,line);
	}
	else if ((t.type & 2)==2) {
		t = new WOsu.SliderObject(map,line);
	}
	return t;
}

WOsu.HitObject.prototype.constructor = WOsu.HitObject;

WOsu.HitObject.prototype.parse = function(line) {
	this.parseParts = line.split(",");
	this.x = parseInt(this.parseParts[0]);
	this.y = parseInt(this.parseParts[1]);
	this.time = parseInt(this.parseParts[2]);
	this.type = parseInt(this.parseParts[3]);
	this.hitsound = parseInt(this.parseParts[4]);
	
	this.endX = this.x;
	this.endY = this.y;
	this.endTime = this.time;
}

WOsu.HitObject.prototype.isBeat = function() {
	return (this.type & 1)==1;
}

WOsu.HitObject.prototype.isSlider = function() {
	return (this.type & 2)==2;
}

WOsu.HitObject.prototype.isComboChange = function() {
	return (this.type & 4)==4;
}

WOsu.HitObject.prototype.isSpinner = function() {
	return (this.type & 8)==8;
}
WOsu.SliderObject = function(map,line) {
	WOsu.HitObject.call(this,map,line);
	
	this.controlX = new Array(0); // Control X coordinates of the slider
	this.controlY = new Array(0); // Control Y coordinates of the slider
	this.repeats = 0; // Repeats
	this.curveX = new Array(0); // Generated curve point X coordinates
	this.curveY = new Array(0); // Generated curve point Y coordinates
	this.sliderSpeed = 0; // Slider speed (osupixels)
	this.sliderLength = 0; // Slider length (pixels)
	this.sliderHitsounds = new Array(0); // Slider hit sounds
	this.endX = 0; // End X coordinate
	this.endY = 0; // End Y coordinate
	this.sliderTime = 0;
	
	this.parseSliderObject(line);
}

WOsu.SliderObject.prototype = Object.create( WOsu.HitObject.prototype );

WOsu.SliderObject.prototype.parseSliderObject = function(line) {
	this.parse(line);
	
	var points = this.parseParts[5].split("|");
	var lastX = this.x,lastY = this.y;
	var nextX,nextY;
	for (var i=1; i<points.length; i++) {
		nextX = parseInt(points[i].substring(0,points[i].indexOf(":")));
		nextY = parseInt(points[i].substring(points[i].indexOf(":")+1));
		
		this.controlX.push(nextX);
		this.controlY.push(nextY);
		
		this.sliderLength += Math.sqrt(Math.pow(nextX-lastX,2) + Math.pow(nextY-lastY,2));
		
		lastX = nextX;
		lastY = nextY;
	}
	this.controlX.unshift(this.x);
	this.controlY.unshift(this.y);
	
	this.repeats = parseInt(this.parseParts[6]);
	this.sliderSpeed = parseFloat(this.parseParts[7]);
	if (this.parseParts.length>8) {
		points = this.parseParts[8].split("\\|");
		for (var i=0; i<points.length; i++) {
			this.sliderHitsounds.push(parseInt(points[i]));
		}
	}
	
	this.endX = this.controlX[this.controlX.length-1];
	this.endY = this.controlY[this.controlY.length-1];
	
	var currentTiming = 0;
	var tp = this.map.BeatmapEvents.TimingPoints;
	var multiplier = this.map.BeatmapData.SliderMultiplier;
	while (currentTiming<tp.length-1 && tp[currentTiming+1].time<=this.time) currentTiming++;
	this.endTime = this.sliderSpeed/multiplier/100 * tp[currentTiming].bpm * this.repeats + this.time;
	this.sliderTime = this.endTime - this.time;
}

WOsu.SliderObject.prototype.generateBezier = function() {
	var max = ~~(this.sliderLength/5);
	
	this.curveX = new Array(max+1);
	this.curveY = new Array(max+1);
	
	var t,degree,pointX,pointY;
	for (var i=0; i<=max; i++) {
		t = i/max;
		pointX = this.controlX.slice(0);
		pointY = this.controlY.slice(0);
		degree = this.controlX.length;
		while (degree>1) {
			for (var j=0; j<degree-1; j++) {
				pointX[j] = pointX[j]*(1-t) + pointX[j+1]*t;
				pointY[j] = pointY[j]*(1-t) + pointY[j+1]*t;
			}
			degree--;
		}
		this.curveX[i] = pointX[0];
		this.curveY[i] = pointY[0];
	}
}

WOsu.SliderObject.prototype.getPosition = function(time) {
	var partial = 0;
	if (this.sliderTime>0) partial = (time - this.time)/this.sliderTime;
	partial = (partial * this.repeats) % 2;
	
	if (partial>1) {
		partial = 2 - partial;
	}
	
	var index;
	var t = partial * this.curveX.length - (index = ~~(partial * this.curveX.length));
	var next = index + 1;
	if (index<0) index = 0; else if (index>=this.curveX.length) index = this.curveX.length-1;
	if (next<0) next = 0; else if (next>=this.curveX.length) next = this.curveX.length-1;
	
	return [ this.curveX[index]*(1-t) + this.curveX[next]*t , this.curveY[index]*(1-t) + this.curveY[next]*t ];
}
WOsu.SpinnerObject = function(map,line) {
	WOsu.HitObject.call(this,map,line);
	
	this.spinnerTime = 0; // Spinner time
	
	this.parseSpinnerObject(line);
}

WOsu.SpinnerObject.prototype = Object.create( WOsu.HitObject.prototype );

WOsu.SpinnerObject.prototype.parseSpinnerObject = function(line) {
	this.parse(line);
	
	this.endTime = parseInt(this.parseParts[5]);
	this.spinnerTime = this.endTime - this.time;
}
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
WOsu.Skin = function(url) {
    this.url = url || "";
    this.textures = {};
    this.status = 0;
}

WOsu.Skin.prototype.constructor = WOsu.Skin;

WOsu.Skin.textureList = { // List of textures
    approachcircle: "approachcircle.png",

    cursor: "cursor.png",
    cursortrail: "cursortrail.png",

    hitcircle: "hitcircle.png",
    hitcircle_overlay: "hitcircleoverlay.png",

    slider_b: "sliderb.png",
    slider_followcircle: "sliderfollowcircle.png",
    slider_point10: "sliderpoint10.png",
    slider_point30: "sliderpoint30.png",
    slider_scorepoint: "sliderscorepoint.png",
    reversearrow: "reversearrow.png",

    spinner_approachcircle: "spinner-approachcircle.png",
    spinner_background: "spinner-background.png",
    spinner_circle: "spinner-circle.png",
    spinner_clear: "spinner-clear.png",
    spinner_metre: "spinner-metre.png",
    spinner_osu: "spinner-osu.png",
    spinner_rpm: "spinner-rpm.png",
    spinner_spin: "spinner-spin.png",

    hit_0: "hit0.png",
    hit_50: "hit50.png",
    hit_50k: "hit50k.png",
    hit_100: "hit100.png",
    hit_100k: "hit100k.png",
    hit_300: "hit300.png",
    hit_300g: "hit300g.png",
    hit_300k: "hit300k.png",

    lighting: "lighting.png",

    default_0: "default-0.png",
    default_1: "default-1.png",
    default_2: "default-2.png",
    default_3: "default-3.png",
    default_4: "default-4.png",
    default_5: "default-5.png",
    default_6: "default-6.png",
    default_7: "default-7.png",
    default_8: "default-8.png",
    default_9: "default-9.png",

    score_0: "score-0.png",
    score_1: "score-1.png",
    score_2: "score-2.png",
    score_3: "score-3.png",
    score_4: "score-4.png",
    score_5: "score-5.png",
    score_6: "score-6.png",
    score_7: "score-7.png",
    score_8: "score-8.png",
    score_9: "score-9.png",
    score_comma: "score-comma.png",
    score_dot: "score-dot.png",
    score_percent: "score-percent.png",
    score_x: "score-x.png",

    scorebar_bg: "scorebar-bg.png",
    scorebar_colour: "scorebar-colour.png",
    scorebar_ki: "scorebar-ki.png",
    scorebar_kidanger: "scorebar-kidanger.png",
    scorebar_kidanger2: "scorebar-kidanger2.png",

    section_fail: "section-fail.png",
    section_pass: "section-pass.png",

    volume: "volume-bg.png"
};
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
WOsu.Matrix3 = function(args) {
	this.matrix = new Array(9);
	try {
		this.matrix = [ 1,0,0, 0,1,0, 0,0,1 ];
		if (args.length==1 && args[0]==0) {
			this.matrix = [ 0,0,0, 0,0,0, 0,0,0 ];
		}
		else if (args.length==4) {
			this.matrix[0] = args[0];
			this.matrix[1] = args[1];
			this.matrix[3] = args[2];
			this.matrix[4] = args[3];
		}
		else if (args.length>=6) {
			for (var i=0; i<args.length; i++) this.matrix[i] = args[i];
		}
	}
	catch (err) {
		this.matrix = [ 1,0,0, 0,1,0, 0,0,1 ];
	}
}

WOsu.Matrix3.prototype.constructor = WOsu.Matrix3;

WOsu.Matrix3.getRotation = function(theta) {
	return new WOsu.Matrix3([Math.cos(theta),-Math.sin(theta),Math.sin(theta),Math.cos(theta)]);
}

WOsu.Matrix3.getScale = function(x,y) {
	return new WOsu.Matrix3([ x,0,0, 0,y,0, 0,0,1 ]);
}

WOsu.Matrix3.getTranslation = function(x,y) {
	return new WOsu.Matrix3([ 1,0,x, 0,1,y, 0,0,1 ]);
}

WOsu.Matrix3.prototype.clone = function() {
	return new WOsu.Matrix3(this.matrix);
}

WOsu.Matrix3.prototype.reset = function() {
	this.matrix = [ 1,0,0, 0,1,0, 0,0,1 ];
}

WOsu.Matrix3.prototype.multiply = function(mat2) {
	this.matrix = [
		this.matrix[0]*mat2.matrix[0] + this.matrix[1]*mat2.matrix[3] + this.matrix[2]*mat2.matrix[6],
		this.matrix[0]*mat2.matrix[1] + this.matrix[1]*mat2.matrix[4] + this.matrix[2]*mat2.matrix[7],
		this.matrix[0]*mat2.matrix[2] + this.matrix[1]*mat2.matrix[5] + this.matrix[2]*mat2.matrix[8],
		this.matrix[3]*mat2.matrix[0] + this.matrix[4]*mat2.matrix[3] + this.matrix[5]*mat2.matrix[6],
		this.matrix[3]*mat2.matrix[1] + this.matrix[4]*mat2.matrix[4] + this.matrix[5]*mat2.matrix[7],
		this.matrix[3]*mat2.matrix[2] + this.matrix[4]*mat2.matrix[5] + this.matrix[5]*mat2.matrix[8],
		this.matrix[6]*mat2.matrix[0] + this.matrix[7]*mat2.matrix[3] + this.matrix[8]*mat2.matrix[6],
		this.matrix[6]*mat2.matrix[1] + this.matrix[7]*mat2.matrix[4] + this.matrix[8]*mat2.matrix[7],
		this.matrix[6]*mat2.matrix[2] + this.matrix[7]*mat2.matrix[5] + this.matrix[8]*mat2.matrix[8]
	];
}

WOsu.Matrix3.prototype.multiplyB = function(mat2) {
	this.matrix = [
		mat2.matrix[0]*this.matrix[0] + mat2.matrix[1]*this.matrix[3] + mat2.matrix[2]*this.matrix[6],
		mat2.matrix[0]*this.matrix[1] + mat2.matrix[1]*this.matrix[4] + mat2.matrix[2]*this.matrix[7],
		mat2.matrix[0]*this.matrix[2] + mat2.matrix[1]*this.matrix[5] + mat2.matrix[2]*this.matrix[8],
		mat2.matrix[3]*this.matrix[0] + mat2.matrix[4]*this.matrix[3] + mat2.matrix[5]*this.matrix[6],
		mat2.matrix[3]*this.matrix[1] + mat2.matrix[4]*this.matrix[4] + mat2.matrix[5]*this.matrix[7],
		mat2.matrix[3]*this.matrix[2] + mat2.matrix[4]*this.matrix[5] + mat2.matrix[5]*this.matrix[8],
		mat2.matrix[6]*this.matrix[0] + mat2.matrix[7]*this.matrix[3] + mat2.matrix[8]*this.matrix[6],
		mat2.matrix[6]*this.matrix[1] + mat2.matrix[7]*this.matrix[4] + mat2.matrix[8]*this.matrix[7],
		mat2.matrix[6]*this.matrix[2] + mat2.matrix[7]*this.matrix[5] + mat2.matrix[8]*this.matrix[8]
	];
}

WOsu.Matrix3.multiply = function(mat1,mat2) {
	return new WOsu.Matrix3([
		mat1.matrix[0]*mat2.matrix[0] + mat1.matrix[1]*mat2.matrix[3] + mat1.matrix[2]*mat2.matrix[6],
		mat1.matrix[0]*mat2.matrix[1] + mat1.matrix[1]*mat2.matrix[4] + mat1.matrix[2]*mat2.matrix[7],
		mat1.matrix[0]*mat2.matrix[2] + mat1.matrix[1]*mat2.matrix[5] + mat1.matrix[2]*mat2.matrix[8],
		mat1.matrix[3]*mat2.matrix[0] + mat1.matrix[4]*mat2.matrix[3] + mat1.matrix[5]*mat2.matrix[6],
		mat1.matrix[3]*mat2.matrix[1] + mat1.matrix[4]*mat2.matrix[4] + mat1.matrix[5]*mat2.matrix[7],
		mat1.matrix[3]*mat2.matrix[2] + mat1.matrix[4]*mat2.matrix[5] + mat1.matrix[5]*mat2.matrix[8],
		mat1.matrix[6]*mat2.matrix[0] + mat1.matrix[7]*mat2.matrix[3] + mat1.matrix[8]*mat2.matrix[6],
		mat1.matrix[6]*mat2.matrix[1] + mat1.matrix[7]*mat2.matrix[4] + mat1.matrix[8]*mat2.matrix[7],
		mat1.matrix[6]*mat2.matrix[2] + mat1.matrix[7]*mat2.matrix[5] + mat1.matrix[8]*mat2.matrix[8]
	]);
}

WOsu.Matrix3.prototype.getCSS3Transform = function() {
	return "matrix(" + [this.matrix[0],this.matrix[3],this.matrix[1],this.matrix[4],this.matrix[2],this.matrix[5]].join() + ")";
}
WOsu.Replay = function(json) {
    this.type = 0; // Gameplay type
    this.version = 0; // osu! version
    this.bhash = ""; // Beatmap hash
    this.player = ""; // Player name
    this.rhash = ""; // Replay hash
    this.hits = [0, 0, 0, 0, 0, 0]; // Hit counts
    this.score = 0; // Score
    this.combo = 0; // Combo
    this.perfect = false; // Perfect replay
    this.mods = 0; // Mods
    this.graph = []; // Performance graph
    this.timestamp = 0; // Timestamp
    this.replayData = []; // Actions

    this.index = 0; // Action index
    // TODO Move this index into the player, does not belong here
}

WOsu.Replay.prototype.constructor = WOsu.Replay;
WOsu.ReplayLoader = {};

WOsu.ReplayLoader.loadJSON = function(data, finish, progress) {
    var replay = new WOsu.Replay();

    for (var i in json) {
        this[i] = json[i];
    }

    return replay;
}

WOsu.ReplayLoader.loadRaw = function(data, finish, progress) {
    var replay = new WOsu.Replay();

    var bytes = new Uint8ClampedArray(~~(data.length / 2));
    for (var i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(data[2 * i] + data[2 * i + 1], 16);
    }
    var index = 0;

    function getByte() {
        return bytes[index++];
    }

    function getShort() {
        return bytes[index++] | (bytes[index++] << 8);
    }

    function getInt() {
        return bytes[index++] | (bytes[index++] << 8) | (bytes[index++] << 16) | (bytes[index++] << 24);
    }

    function getLong() {
        return getInt() + getInt() * 0x100000000;
    }

    function getULEB128() {
        var val = 0;
        var i = 0;
        var c;
        while (((c = getByte()) & 0x80) == 0x80) {
            val = val | ((c & 0x7F) << (i++ * 7));
        }
        val = val | ((c & 0x7F) << (i++ * 7));
        return val;
    }

    function getString(len) {
        var s = "";
        for (var i = 0; i < len; i++) {
            s += String.fromCharCode(getByte());
        }
        return s;
    }

    function getBytes(len) {
        var b = new Uint8ClampedArray(len);
        for (var i = 0; i < len; i++) {
            b[i] = getByte();
        }
        return b;
    }

    function getGraph(str) {
        return str;
    }

    function parseReplayData(data) {
        if (!data) return;
        var lines = data.split(",");
        var parts;

        var time = 0;
        var bits, actionBits;
        var M1 = 1,
            M2 = 2,
            K1 = 5,
            K2 = 10;

        for (var i = 0; i < lines.length; i++) {
            parts = lines[i].split("|");
            time += parseInt(parts[0]);
            bits = parseInt(parts[3]);
            actionBits = 0;
            if ((bits & K2) == K2) {
                actionBits |= K2;
                bits &= ~K2;
            }
            if ((bits & K1) == K1) {
                actionBits |= K1;
                bits &= ~K1;
            }
            if ((bits & M2) == M2) {
                actionBits |= M2;
                bits &= ~M2;
            }
            if ((bits & M1) == M1) {
                actionBits |= M1;
                bits &= ~M1;
            }
            replay.replayData.push([time, parseFloat(parts[1]), parseFloat(parts[2]), actionBits]);
        }
    }

    var cont = 0;

    replay.type = getByte();
    replay.version = getInt();
    cont = getByte();
    if (cont == 0x0B) replay.bhash = getString(getULEB128());
    cont = getByte();
    if (cont == 0x0B) replay.player = getString(getULEB128());
    cont = getByte();
    if (cont == 0x0B) replay.rhash = getString(getULEB128());
    replay.hits[0] = getShort();
    replay.hits[1] = getShort();
    replay.hits[2] = getShort();
    replay.hits[3] = getShort();
    replay.hits[4] = getShort();
    replay.hits[5] = getShort();
    replay.score = getInt();
    replay.combo = getShort();
    replay.perfect = getByte() == 1;
    replay.mods = getInt();
    cont = getByte();
    if (cont == 0x0B) replay.graph = getGraph(getString(getULEB128()));
    replay.timestamp = getLong();

    var datasize = getInt();
    LZMA.decompress(
        bytes.subarray(index),
        function(data) {
            parseReplayData(data);
            finish(replay);
        },
        function(percent) {
            progress(percent);
        }
    );

    return replay;
}
//# sourceMappingURL=WOsu.js.map