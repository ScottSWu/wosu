String.prototype.startsWith = function (str) {
    return this.slice(0, str.length) == str;
}

String.prototype.endsWith = function (str) {
    return this.slice(-str.length) == str;
}

var $$ = function (id) {
    return document.getElementById(id);
}

WOsu = function () {}

WOsu.prototype.contructor = WOsu;

// Epsilon value
WOsu.EPSILON = 1e-4;

// Default Beatmap API location
WOsu.API = "http://sc-wu.com:9678";

/*
    Asynchronously call a function.
 */
WOsu.async = function (func, t) {
    setTimeout(func, t || 5);
}

/*
    Asynchronously call multiple functions with a callback when all functions finish.
    The first parameter is the calling instance. The second parameter is an array of functions
    and arguments. The third parameter is the final callback when all functions are finished.
 */
WOsu.resync = function (instance, funcs, callback) {
    var count = 0;
    var total = funcs.length;
    var finish = function () {
        count++;
        if (count >= total) {
            callback();
        }
    };

    funcs.forEach(function (o) {
        o.args = o.args || [];
        WOsu.async(function () {
            o.args.unshift(finish);
            o.fn.apply(instance, o.args);
        });
    });
}

/**
    Repeat an array a certain number of times
*/
WOsu.repeat = function (arr, times) {
    var rep = [];
    while (times-- > 0) {
        rep = rep.concat(arr);
    }
    return rep;
}

/**
    Repeat an array a certain number of times and return as a Float32Array
*/
WOsu.repeatFloat = function (arr, times) {
    return new Float32Array(WOsu.repeat(arr, times));
}
