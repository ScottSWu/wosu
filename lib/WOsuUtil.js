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
        o.args = o.args || [];
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