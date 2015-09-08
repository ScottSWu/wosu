WOsu.Skin = function (url) {
    this.url = url || "";
    this.textures = {};
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
    //spinner_metre: "spinner-metre.png",
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
