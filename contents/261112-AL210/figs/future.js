/* ===== AL210 のスライドの図：20 枚目（おわりに）の、今後の課題の 4 つの角柱（common.js の道具を使う）===== */
/* 5 枚目と同じく、Mathematica の既定の視点と光で、側面の 1 枚が正面を向くように描く。
   底面は辺の長さ 1 の正 6 角形、高さ HT。出したときは 4 つとも正角柱で、そのあと 1 クリックごとに 1 つずつ、上面だけを動かして変える
   （順に、ひねる：上面を TWIST 回し、側面を三角形 2 枚ずつに分ける（π/6 で反角柱）・
   サイズを小さく：上面を SIZE 倍に（ほぼ角錐になるまで）・位置を移動：上面を画面の右へ SHIFT 移す・
   角度を変える：上面の画面の右の端を今の高さのまま、左ほど下げる。キャプションも、この言い方で）。動かす目印は .end-a1〜.end-a4（MOVE ミリ秒。← で戻るときは動かさない）。
   底面は動かさず、正角柱の形を図の枠の真ん中に置く（出したときに 4 つの並びがそろうように。位置を移動した上面は、枠の右へはみ出してよい。al210.css）。
   4 つとも同じ縮尺 UNIT。
   どれも凸なので、奥の面から描けば隠れる面は隠れる。ひねるときの側面の対角線は、回すにつれて濃くする（正角柱のときは見せない） */
var FUTURE = (function () {
  const N = 6, HT = 1.6, UNIT = 49, TWIST = Math.PI / N, SIZE = 0.08, SHIFT = 1.2, TILT = 0.55, MOVE = 1200;
  const cam = camera(MMA_AZ, MMA_EL), c = cam.c, r = cam.r, up = cam.up;
  const a0 = Math.atan2(c[1], c[0]) - Math.PI / N, R = 1 / (2 * Math.sin(Math.PI / N)), BOT = [];
  for (let i = 0; i < N; i++) BOT.push([R * Math.cos(a0 + 2 * Math.PI * i / N), R * Math.sin(a0 + 2 * Math.PI * i / N), 0]);
  const xy = function (p) { return [dot(p, r), -dot(p, up)]; }, XR = Math.max.apply(null, BOT.map(function (p) { return dot(p, r); }));
  /* 上面の点の作り方（t = 0 で正角柱、t = 1 で変え終えた形） */
  const TOPS = [
    function (p, t) { const a = TWIST * t, cs = Math.cos(a), sn = Math.sin(a); return [cs * p[0] - sn * p[1], sn * p[0] + cs * p[1], HT]; },
    function (p, t) { const k = 1 + (SIZE - 1) * t; return [k * p[0], k * p[1], HT]; },
    function (p, t) { return [p[0] + SHIFT * t * r[0], p[1] + SHIFT * t * r[1], HT]; },
    function (p, t) { return [p[0], p[1], HT - TILT * t * (XR - (p[0] * r[0] + p[1] * r[1]))]; }     // XR：底面の、画面でいちばん右の点の横の位置
  ];
  const fillOf = function (pts) {
    let nrm = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (dot(nrm, c) < 0) nrm = mul(nrm, -1);
    return shade(dot(nrm, r), dot(nrm, up));
  };
  const depth = function (pts) { return pts.reduce(function (s, p) { return s + dot(p, c); }, 0) / pts.length; };
  /* k 番目の角柱を、変える割合 t で描く。o：図の上の原点の位置 */
  function draw(svg, k, t, o) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const tp = BOT.map(function (p) { return TOPS[k](p, t); }), at = function (p) { const q = xy(p); return [o[0] + UNIT * q[0], o[1] + UNIT * q[1]]; };
    const pts = function (P) { return P.map(function (p) { return at(p).map(function (v) { return v.toFixed(2); }).join(","); }).join(" "); };
    const items = [{ d: depth(BOT), f: function (g) { mk("polygon", { class: "end-face", points: pts(BOT), fill: fillOf(BOT) }, g); } },
                   { d: depth(tp), f: function (g) { mk("polygon", { class: "end-face", points: pts(tp), fill: fillOf(tp) }, g); } }];
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N, Q = [BOT[i], BOT[j], tp[j], tp[i]];
      items.push({ d: depth(Q), f: function (g) {
        if (k === 0) {     // ひねる：短いほうの対角線（b_{i+1}–t_i）で三角形 2 枚に分ける（凸のまま）
          [[BOT[i], BOT[j], tp[i]], [BOT[j], tp[j], tp[i]]].forEach(function (T) {
            const col = fillOf(T);
            mk("polygon", { points: pts(T), fill: col, stroke: col, "stroke-width": 0.6 }, g);     // 2 枚のすき間が見えないように、同じ色の縁
          });
          mk("polygon", { class: "end-edge", points: pts(Q) }, g);
          const a = at(BOT[j]), b = at(tp[i]);
          mk("line", { class: "end-edge", x1: a[0].toFixed(2), y1: a[1].toFixed(2), x2: b[0].toFixed(2), y2: b[1].toFixed(2),
                       "stroke-opacity": Math.min(1, t * 3).toFixed(3) }, g);
        } else mk("polygon", { class: "end-face", points: pts(Q), fill: fillOf(Q) }, g);
      } });
    }
    items.sort(function (a, b) { return a.d - b.d; });
    const g = mk("g", {}, svg);
    items.forEach(function (it) { it.f(g); });
  }
  /* 正角柱の形（変える前）の外接長方形の真ん中を、図の枠の真ん中に置く */
  function origin(svg, k) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height"), Q = [];
    BOT.concat(BOT.map(function (p) { return TOPS[k](p, 0); })).forEach(function (p) { Q.push(xy(p)); });
    const xs = Q.map(function (q) { return q[0]; }), ys = Q.map(function (q) { return q[1]; });
    return [W / 2 - UNIT * (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, H / 2 - UNIT * (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2];
  }
  function prism(k) {
    return function (svg, still) {
      const o = origin(svg, k), m = svg.closest("slide").querySelector(".end-a" + (k + 1));
      if (still) { draw(svg, k, m.classList.contains("on") ? 1 : 0, o); return; }
      draw(svg, k, 0, o);
      follow(m, function (t) { draw(svg, k, ease(t), o); }, MOVE, 0);
    };
  }
  return { twist: prism(0), size: prism(1), pos: prism(2), tilt: prism(3) };
})();
figure("end-twist", FUTURE.twist);
figure("end-size", FUTURE.size);
figure("end-pos", FUTURE.pos);
figure("end-tilt", FUTURE.tilt);
