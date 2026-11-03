/* ===== AL210 のスライドの図：5 枚目の、高さ 1 の正 3・正 12・正 15 角柱（動かない。common.js の道具を使う）===== */
/* 3 枚目と同じく、Mathematica の既定の視点と光で、側面の 1 枚が正面を向くように描く（底面の辺の長さ 1）。
   右の正 24 角柱（overlap.js）と大きさを比べられるよう、同じ縮尺 UNIT1 で描く。
   正 3 角柱は上面が小さく、数が載らないので、数を角柱の上に書く。
   角柱は図の枠の上下の真ん中に置き（右の正 24 角柱とも、上下の真ん中をそろえる。al210.css）、上面に n の数を書く（冬の LA と同じ） */
const UNIT1 = 30;     // 1 の長さを何 px で描くか
var HEIGHT1 = (function () {
  /* n：角の数、h：高さ、above：数を上面ではなく角柱の上に書くか */
  function setup(svg, n, h, above) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    const cam = camera(MMA_AZ, MMA_EL), c = cam.c, r = cam.r, up = cam.up;
    /* 側面の 1 枚が正面（カメラの水平の向き）を向くように回す */
    const a0 = Math.atan2(c[1], c[0]) - Math.PI / n, R = 1 / (2 * Math.sin(Math.PI / n)), ring = [];   // R：外接円の半径
    for (let i = 0; i < n; i++) ring.push([R * Math.cos(a0 + 2 * Math.PI * i / n), R * Math.sin(a0 + 2 * Math.PI * i / n)]);
    const faces = [ring.map(function (q) { return [q[0], q[1], 0]; }), ring.map(function (q) { return [q[0], q[1], h]; })];
    ring.forEach(function (q, i) {
      const p = ring[(i + 1) % n];
      faces.push([[q[0], q[1], 0], [p[0], p[1], 0], [p[0], p[1], h], [q[0], q[1], h]]);
    });
    const items = faces.map(function (pts) {
      let nrm = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
      if (dot(nrm, c) < 0) nrm = mul(nrm, -1);
      return { xy: pts.map(function (p) { return [dot(p, r), -dot(p, up)]; }),
               depth: pts.reduce(function (s, p) { return s + dot(p, c); }, 0) / pts.length,
               fill: shade(dot(nrm, r), dot(nrm, up)) };
    });
    /* 枠の真ん中に置く */
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    items.forEach(function (it) { it.xy.forEach(function (q) {
      x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
    }); });
    const S = UNIT1, dx = W / 2 - S * (x0 + x1) / 2, dy = H / 2 - S * (y0 + y1) / 2;
    /* 奥の面から描く */
    items.sort(function (a, b) { return a.depth - b.depth; });
    const group = mk("g", {}, svg);
    items.forEach(function (it) {
      mk("polygon", { points: it.xy.map(function (q) { return (dx + S * q[0]).toFixed(2) + "," + (dy + S * q[1]).toFixed(2); }).join(" "),
                      fill: it.fill, stroke: "#000", "stroke-width": 1.2, "stroke-linejoin": "round" }, group);
    });
    /* 上面の真ん中（0, 0, h）に n の数。above のときは、角柱の上の端から 20px 上に */
    const top = [0, 0, h], at = [dx + S * dot(top, r), dy - S * dot(top, up)];
    lid(group, above ? [at[0], dy + S * y0 - 20] : at, String(n));
  }
  return {
    p3: function (svg) { setup(svg, 3, 1, true); },
    p12: function (svg) { setup(svg, 12, 1); },
    p15: function (svg) { setup(svg, 15, 1); }
  };
})();
/* 左の列の下の括弧（︸）：左右に分かれた後の左の列の、正 3 角柱の左の端から最後の「…」の右の端まで
   （測った値：左の範囲の中の横 17.7〜527.3px）をまとめる。とがった先は、その真ん中 */
FIG["h1-brace"] = function (svg) {
  const x0 = 17.7, x1 = 527.3, m = (x0 + x1) / 2, top = 2, h = 20, r = 14;   // h：括弧の高さ、r：曲がりの幅
  const mid = top + h / 2, f = function (x, y) { return x.toFixed(1) + "," + y.toFixed(1); };
  mk("path", { class: "h1-brace-path",
               d: "M" + f(x0, top) + " Q" + f(x0, mid) + " " + f(x0 + r, mid) + " L" + f(m - r, mid) + " Q" + f(m, mid) + " " + f(m, top + h) +
                  " Q" + f(m, mid) + " " + f(m + r, mid) + " L" + f(x1 - r, mid) + " Q" + f(x1, mid) + " " + f(x1, top) }, svg);
};
FIG["h1-3"] = HEIGHT1.p3;
FIG["h1-12"] = HEIGHT1.p12;
FIG["h1-15"] = HEIGHT1.p15;
