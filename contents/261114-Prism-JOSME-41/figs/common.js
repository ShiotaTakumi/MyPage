/* ===== 第 41 回 OSME-J のスライドの図：2〜4 枚目で共通の道具 =====
   図のファイルは 41OSME-J.html の先頭で、mma-colors.js → common.js → unfold.js・prism.js・overlap.js・morph.js の順に読む。
   図を描く関数は FIG["svg の id"] に入れておくと、uoh-slide.js がページを組み立てるときに呼ぶ（mk・txt は uoh-slide.js の中にある） */
var FIG = {}, STILL = {};

/* 動く図を登録する：draw(svg, still) を FIG[id] に入れ、<svg> に data-fig="id" を付ける（ページの写しでも残る）。
   still が true のときは、動きを付けずに、その <svg> のまわりで出ている段階表示のとおりに描く */
function figure(id, draw) {
  FIG[id] = function (svg) { svg.setAttribute("data-fig", id); draw(svg, false); };
  STILL[id] = draw;
}
/* ページの写し（一覧・印刷・PDF。uoh-slide.js がページを組み立てるときに作る）の図は、組み立てたときのまま動かない。
   そこで、組み立て終えてから、写しの中の動く図を、その写しで出ている段階表示のとおりに描き直す
   （uoh-slide.js の組み立ても DOMContentLoaded で動き、そちらが先に読まれている） */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".side svg[data-fig], .print svg[data-fig]").forEach(function (svg) {
    const draw = STILL[svg.getAttribute("data-fig")];
    if (!draw) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    draw(svg, true);
  });
});

/* ベクトル、Mathematica の視点と光、クリックに合わせて動かす仕組み */
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function norm(a) { const l = Math.hypot(a[0], a[1], a[2]); return mul(a, 1 / l); }
function ease(x) { return x * x * (3 - 2 * x); }
/* 角柱の上面などに書く字（5 枚目の n の数、6 枚目の n・h）。c は字の真ん中の、図の中の位置。
   数式と同じ書体で、本文と同じ 24pt。italic のときは数式の文字（KaTeX_Math の斜体）、そうでなければ数字（KaTeX_Main） */
function lid(parent, c, text, opacity, italic) {
  txt(c[0].toFixed(2), c[1].toFixed(2), text, { "font-family": italic ? "KaTeX_Math" : "KaTeX_Main", "font-style": italic ? "italic" : "normal",
                                                "font-size": 32, "text-anchor": "middle", "dominant-baseline": "central",
                                                opacity: opacity == null ? 1 : opacity }, parent);
}
/* 点 p を、点 o を通り向き u（単位ベクトル）の直線のまわりに角 th だけ回す（ロドリゲスの公式） */
function rot(p, o, u, th) {
  const v = sub(p, o), c = Math.cos(th), s = Math.sin(th);
  const r = add(add(mul(v, c), mul(cross(u, v), s)), mul(u, dot(u, v) * (1 - c)));
  return add(o, r);
}

/* 面の色：Mathematica の既定の光で描いたときの色。表 MMA_COLORS（mma-colors.js）を引いて決める。
   既定の光は画面に対して固定なので、色は画面から見た面の向き（横 nx・縦 ny の成分、どちらも −1〜1）だけで決まる */
/* Mathematica の色のままでは暗いので、白に LIGHTEN の割合だけ寄せて明るくする（向きによる色の違いは残る） */
const LIGHTEN = 0.35;
function shadeRGB(nx, ny) {
  const G = 25, fx = (nx + 1) / 2 * (G - 1), fy = (1 - ny) / 2 * (G - 1);
  const i0 = Math.max(0, Math.min(G - 1, Math.floor(fx))), j0 = Math.max(0, Math.min(G - 1, Math.floor(fy)));
  const i1 = Math.min(G - 1, i0 + 1), j1 = Math.min(G - 1, j0 + 1), ax = fx - i0, ay = fy - j0;
  function col(i, j, k) { const at = ((j * G + i) * 3 + k) * 2; return parseInt(MMA_COLORS.substr(at, 2), 16); }
  return [0, 1, 2].map(function (k) {
    const v = (1 - ax) * (1 - ay) * col(i0, j0, k) + ax * (1 - ay) * col(i1, j0, k) +
              (1 - ax) * ay * col(i0, j1, k) + ax * ay * col(i1, j1, k);
    return Math.round(v + (255 - v) * LIGHTEN);
  });
}
function shade(nx, ny) { return "rgb(" + shadeRGB(nx, ny).join(",") + ")"; }
/* 展開図にしていくときの面の色：k = 0 で Mathematica の色、k = 1 で白（開き終えた展開図は、見やすいように白で見せる） */
function shadeToWhite(nx, ny, k) {
  return "rgb(" + shadeRGB(nx, ny).map(function (v) { return Math.round(v + (255 - v) * k); }).join(",") + ")";
}

/* カメラ：方位 az・仰角 el から見る向き c と、画面の右 r・上 up（正射影で、点 p は画面の (p・r, −p・up) に描く）。
   Mathematica の既定の視点（ViewPoint -> {1.3, -2.4, 2}）は az = MMA_AZ、el = MMA_EL */
const MMA_AZ = Math.atan2(1.3, 2.4), MMA_EL = Math.atan2(2, Math.hypot(1.3, 2.4));
function camera(az, el) {
  const c = [Math.cos(el) * Math.sin(az), -Math.cos(el) * Math.cos(az), Math.sin(el)];
  const r = [Math.cos(az), Math.sin(az), 0];
  return { c: c, r: r, up: cross(c, r) };
}

/* 動いている途中のアニメーション（{ finish() } の集まり）。連打したときのため、次のキーかクリックが来たら、
   それを受ける前に（uoh-slide.js のページ送りより先に。捕捉の段階で受ける）、動いている途中のものを全部最後の形にする */
const RUNNING = new Set();
function finishAll() {
  Array.from(RUNNING).forEach(function (a) { a.finish(); });
  /* CSS の動き（5 枚目の、左右に分かれる動きなど）も最後の形にする（終わりのない動きは finish できないので、とばす） */
  if (document.getAnimations) document.getAnimations().forEach(function (a) { try { a.finish(); } catch (e) {} });
}
addEventListener("keydown", finishAll, true);
addEventListener("click", finishAll, true);

/* 図の中の目印（何も表示しない step）が出たら t を 1 へ（open ミリ秒）、消えたら 0 へ（close ミリ秒）動かし、そのたびに draw(t) を呼ぶ。
   ページを移ったとき（← で次のページから戻ったときを含む）は、動かさずにすぐその状態で描く。返す関数は今の t を返す */
function follow(mark, draw, open, close) {
  let t = 0, from = 0, to = 0, start = 0, raf = 0, dur = open;
  /* 動いている途中なら RUNNING に入れておき、finish() で最後の形にする */
  const self = { finish: function () { jump(to); } };
  function frame(now) {
    /* 描画の時刻が動き始めの時刻より前に来ることがあるので、0〜1 に収める */
    const x = dur > 0 ? Math.max(0, Math.min(1, (now - start) / dur)) : 1;     // 0 ミリ秒なら、すぐその状態に
    t = from + (to - from) * x;
    draw(t);
    raf = x < 1 ? requestAnimationFrame(frame) : 0;
    if (!raf) RUNNING.delete(self);
  }
  function goTo(target) {
    if (target === to) return;
    cancelAnimationFrame(raf);
    from = t; to = target; start = performance.now(); dur = target ? open : close;
    raf = requestAnimationFrame(frame);
    RUNNING.add(self);
  }
  /* 動かさずに、すぐその状態で描く */
  function jump(target) {
    cancelAnimationFrame(raf);
    raf = 0; t = from = to = target;
    RUNNING.delete(self);
    draw(t);
  }
  /* ページを移ったときは jump、同じページのクリックでは goTo */
  watchStep(mark, function (on, moved) { if (moved) jump(on ? 1 : 0); else goTo(on ? 1 : 0); });
  return function () { return t; };
}

/* 目印（step）の出し入れを見て、cb(出ているか, ページを移ったときか) を呼ぶ。
   ページを移ったとき（← で次のページから戻ったときを含む）は、目印と一緒にページの出し入れも変わるので、それで見分ける */
function watchStep(mark, cb) {
  const page = mark.closest(".page");
  const watch = new MutationObserver(function (recs) {
    cb(mark.classList.contains("on"), recs.some(function (r) { return r.target === page; }));
  });
  watch.observe(mark, { attributes: true, attributeFilter: ["class"] });
  watch.observe(page, { attributes: true, attributeFilter: ["class"] });
}
