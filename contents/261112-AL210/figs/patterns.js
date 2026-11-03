/* ===== AL210 のスライドの図：11 枚目の、パス状の部分展開図の 7 つのパターンの例 ===== */
/* 補助資料サイトのトップページの図 3（docs/WALCOM2027/web/patterns.js）と同じ面の置き方で描く（正 10 角柱、高さ 1.4）。
   底面は B、帯（連続する 1 枚以上の側面）は S で、帯の中の側面の境目は破線。色は al210.css（サイトと同じ）。
   7 つの図は同じ縮尺（1 の長さを PX px）で、同じ高さの枠に描く（並べたときに大きさと上下の位置がそろうように）。
   図は <svg id="pat-パターン名"> に描く */
var PATTERNS = (function () {
  const N = 10, H = 1.4, PX = 15, PAD = 0.3;
  const add = function (p, q) { return [p[0] + q[0], p[1] + q[1]]; };
  const mul = function (p, s) { return [p[0] * s, p[1] * s]; };
  const unit = function (th) { return [Math.cos(th), Math.sin(th)]; };
  const outward = function (d) { return [d[1], -d[0]]; };     // 反時計回りの底面の辺の外向き

  /* 辺の長さ 1 の正 n 角形：start から、はじめの辺の向き theta0 で、各頂点で turn だけ曲がる（頂点 v と辺の向き d） */
  function polygon(start, theta0, turn, n) {
    const v = [start], d = [];
    for (let k = 0; k < n; k++) {
      d.push(unit(theta0 + k * turn));
      if (k < n - 1) v.push(add(v[k], d[k]));
    }
    return { v: v, d: d };
  }
  const base = function (start, theta0) { const p = polygon(start, theta0, 2 * Math.PI / N, N); return { type: "base", v: p.v, d: p.d }; };
  /* 点 a から向き d へ len 枚の側面を並べ、向き m へ H だけ立てた帯 */
  function strip(a, d, len, m) {
    const b = add(a, mul(d, len));
    return { type: "band", a: a, d: d, len: len, m: m, v: [a, b, add(b, mul(m, H)), add(a, mul(m, H))] };
  }
  /* 底面 b の辺 k に付けた、len 枚の側面の帯。その辺から始まり、辺の終わりの先へ（forward）か、始まりの先へ伸びる */
  function band(b, k, len, forward) {
    if (forward === undefined) forward = true;
    const d = forward ? b.d[k] : mul(b.d[k], -1);
    return strip(forward ? b.v[k] : b.v[(k + 1) % N], d, len, outward(b.d[k]));
  }

  /* パスに沿った面の並び（サイトの patterns.js と同じ置き方） */
  function build(name) {
    const b1 = base([0, 0], Math.PI / 2);
    const s0 = function (len) { return band(b1, 0, len); };
    const b2 = function (s) { return base(s.v[2], -Math.PI / 2); };
    switch (name) {
      case "B": return [b1];
      case "BS": return [b1, s0(2)];
      case "BSB": { const s = s0(3); return [b1, s, b2(s)]; }
      case "BSBS": { const s = s0(2), c = b2(s); return [b1, s, c, band(c, 8, 2)]; }
      case "S": return [strip([0, 0], [0, 1], 3, [1, 0])];
      case "SBS": return [band(b1, 4, 2, false), b1, band(b1, 0, 3)];
      case "SBSBS": { const s = s0(1), c = b2(s); return [band(b1, 2, 2, false), b1, s, c, band(c, 6, 2)]; }
      default: return [];
    }
  }
  function box(faces) {
    const all = [].concat.apply([], faces.map(function (f) { return f.v; }));
    const xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
    return { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
  }
  const NAMES = ["B", "BS", "BSB", "BSBS", "S", "SBS", "SBSBS"];
  /* 7 つの図に共通の高さ（いちばん高いものに合わせる） */
  const HEIGHT = Math.max.apply(null, NAMES.map(function (n) { const b = box(build(n)); return b.y1 - b.y0; })) + 2 * PAD;

  function render(svg, name) {
    const faces = build(name), b = box(faces), w = b.x1 - b.x0 + 2 * PAD;
    const S = function (p) { return [p[0] * PX, -p[1] * PX]; };        // SVG は下向きが正
    const f = function (x) { return x.toFixed(2); };
    const pts = function (P) { return P.map(function (q) { return S(q).map(f).join(","); }).join(" "); };
    const v0 = S([b.x0 - PAD, (b.y0 + b.y1) / 2 + HEIGHT / 2]);
    svg.setAttribute("viewBox", f(v0[0]) + " " + f(v0[1]) + " " + f(w * PX) + " " + f(HEIGHT * PX));
    svg.setAttribute("width", f(w * PX));
    svg.setAttribute("height", f(HEIGHT * PX));
    faces.forEach(function (face) {
      mk("polygon", { class: "pat-" + face.type, points: pts(face.v) }, svg);
      if (face.type === "band") {
        for (let k = 1; k < face.len; k++) {
          const p = add(face.a, mul(face.d, k));
          mk("polyline", { class: "pat-fold", points: pts([p, add(p, mul(face.m, H))]) }, svg);
        }
      }
    });
    /* 面の真ん中に B・S。上下は、大文字の高さ（約 0.7 字）の真ん中を面の真ん中にそろえる（サイトと同じく 0.35 字下げる。
       dominant-baseline: central は字の枠の真ん中なので、大文字では少し上にずれる） */
    faces.forEach(function (face) {
      const c = S(mul(face.v.reduce(add, [0, 0]), 1 / face.v.length));
      txt(f(c[0]), f(c[1]), face.type === "base" ? "B" : "S", { class: "pat-label pat-" + face.type + "-label",
                                                               "text-anchor": "middle", dy: "0.35em" }, svg);
    });
  }
  NAMES.forEach(function (n) { figure("pat-" + n, function (svg) { render(svg, n); }); });
  return { build: build, render: render };
})();
