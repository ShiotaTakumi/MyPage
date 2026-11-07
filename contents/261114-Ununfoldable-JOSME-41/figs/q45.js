/* ===== 第 41 回 OSME-J のスライドの図：9 枚目の、多面体 Q の全ての辺展開（common.js の道具を使う）===== */
/* examples/Q_integer.json の座標。底面の全域木 45 本を 9 × 5 に並べ、目印（<span step class="q45-mark">）が出たら一度に開く。
   底面（面 0）を動かさず、ほかの面を親の面との辺のまわりに回す。カメラは真上へ動く。
   次の目印（<span step class="q45-red">）が出たら、重なる部分を赤で塗る。← で戻るときは動かさない */
var Q45 = (function () {
  const V = [[6.5, 3.5, -0.5], [-6.5, -3.5, -0.5], [2.5, 0.5, -0.5], [-0.5, -0.5, -0.5], [2.5, 1.5, 0.5]];
  const F = [[3, 2, 1, 0], [4, 0, 1], [4, 1, 2], [4, 2, 3], [4, 3, 0]];
  const BASE_TRIS = [[0, 1, 2], [0, 2, 3]];                       // 底面は凸でないので、重なりを調べるときは三角形に分ける
  const TREES = [[-1, 0, 0, 0, 0], [-1, 0, 0, 0, 1], [-1, 0, 0, 0, 3], [-1, 0, 0, 2, 0], [-1, 0, 0, 4, 0], [-1, 0, 0, 2, 1], [-1, 0, 0, 4, 1], [-1, 0, 0, 2, 3], [-1, 0, 1, 0, 0], [-1, 0, 3, 0, 0], [-1, 0, 1, 0, 1], [-1, 0, 1, 0, 3], [-1, 0, 3, 0, 1], [-1, 0, 3, 0, 3], [-1, 0, 1, 2, 0], [-1, 0, 1, 4, 0], [-1, 0, 3, 4, 0], [-1, 0, 1, 2, 1], [-1, 0, 1, 4, 1], [-1, 0, 1, 2, 3], [-1, 0, 3, 4, 1], [-1, 2, 0, 0, 0], [-1, 4, 0, 0, 0], [-1, 2, 0, 0, 1], [-1, 2, 0, 0, 3], [-1, 4, 0, 0, 3], [-1, 2, 0, 2, 0], [-1, 2, 0, 4, 0], [-1, 4, 0, 2, 0], [-1, 4, 0, 4, 0], [-1, 2, 0, 2, 1], [-1, 2, 0, 4, 1], [-1, 2, 0, 2, 3], [-1, 4, 0, 2, 3], [-1, 4, 1, 0, 0], [-1, 2, 3, 0, 0], [-1, 4, 3, 0, 0], [-1, 2, 3, 0, 1], [-1, 4, 1, 0, 3], [-1, 2, 3, 0, 3], [-1, 4, 3, 0, 3], [-1, 4, 1, 2, 0], [-1, 4, 1, 4, 0], [-1, 2, 3, 4, 0], [-1, 4, 3, 4, 0]];                           // 全域木：面 i の親の面（底面は -1）
  const COLS = 9, ROWS = 5, OPEN = 3000, LAST = 0.9;
  const AZ = 330 * Math.PI / 180, EL = 0.7;   // 斜め上から、枠に大きく入る向き

  const faces = F.map(function (f) {
    const pts = f.map(function (i) { return V[i]; });
    return { ids: f, pts: pts, n: norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]))) };
  });
  function area(P) {
    let s = 0;
    P.forEach(function (p, i) { const q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; });
    return s / 2;
  }
  function clip(a, b) {
    if (area(b) < 0) b = b.slice().reverse();
    let out = a;
    b.forEach(function (p, i) {
      const q = b[(i + 1) % b.length], inp = out;
      out = [];
      function side(s) { return (q[0] - p[0]) * (s[1] - p[1]) - (q[1] - p[1]) * (s[0] - p[0]); }
      inp.forEach(function (s, j) {
        const t = inp[(j + 1) % inp.length], ds = side(s), dt = side(t);
        if (ds >= 0) out.push(s);
        if (ds * dt < 0) { const k = ds / (ds - dt); out.push([s[0] + (t[0] - s[0]) * k, s[1] + (t[1] - s[1]) * k]); }
      });
    });
    return out;
  }
  function between(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    const A = [a.r, a.up, a.c], B = [b.r, b.up, b.c];
    function m(i, j) { return B[0][i] * A[0][j] + B[1][i] * A[1][j] + B[2][i] * A[2][j]; }
    const tr = m(0, 0) + m(1, 1) + m(2, 2), th = Math.acos(Math.max(-1, Math.min(1, (tr - 1) / 2)));
    let u = [m(2, 1) - m(1, 2), m(0, 2) - m(2, 0), m(1, 0) - m(0, 1)];
    if (Math.hypot(u[0], u[1], u[2]) < 1e-9) return k < 0.5 ? a : b;
    u = norm(u);
    const o = [0, 0, 0];
    return { r: rot(a.r, o, u, th * k), up: rot(a.up, o, u, th * k), c: rot(a.c, o, u, th * k) };
  }

  /* 1 つの全域木の、ヒンジと、開き終えたときの見え方 */
  function prepare(parent, CW, CH) {
    const hinge = parent.map(function (p, i) {
      if (p < 0) return null;
      const f = faces[i], g = faces[p], s = f.ids.filter(function (id) { return g.ids.indexOf(id) >= 0; });
      const o = V[s[0]], u = norm(sub(V[s[1]], V[s[0]]));
      return { o: o, u: u, th: Math.atan2(dot(u, cross(f.n, g.n)), dot(f.n, g.n)) };
    });
    function place(i, k) {
      let pts = faces[i].pts, n = faces[i].n;
      for (let j = i; parent[j] >= 0; j = parent[j]) {
        const h = hinge[j], th = h.th * k;
        pts = pts.map(function (p) { return rot(p, h.o, h.u, th); });
        n = rot(n, [0, 0, 0], h.u, th);
      }
      return { pts: pts, n: n };
    }
    const flat = faces.map(function (f, i) { return place(i, 1).pts; });
    const c = [0, 0, 1];
    let best = null;
    for (let d = 0; d < 180; d += 3) {
      const a = d * Math.PI / 180, r = [Math.cos(a), Math.sin(a), 0], up = cross(c, r);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      flat.forEach(function (P) { P.forEach(function (p) {
        const x = dot(p, r), y = dot(p, up);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }); });
      const S = 0.92 * Math.min(CW / (x1 - x0), CH / (y1 - y0));
      if (!best || S > best.S) best = { S: S, cam: { r: r, up: up, c: c }, x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
    }
    /* 重なる部分：底面は三角形に分けて、面の組ごとに調べる */
    const xy = flat.map(function (P) { return P.map(function (p) { return [dot(p, best.cam.r), dot(p, best.cam.up)]; }); });
    const pieces = xy.map(function (P, i) { return i === 0 ? BASE_TRIS.map(function (t) { return t.map(function (j) { return P[j]; }); }) : [P]; });
    const parts = [];
    for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) {
      pieces[i].forEach(function (a) { pieces[j].forEach(function (b) {
        const o = clip(a, b);
        if (o.length >= 3 && Math.abs(area(o)) > 1e-7) parts.push(o);
      }); });
    }
    return { place: place, view: best, parts: parts };
  }

  function setup(svg, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height"), CW = W / COLS, CH = H / ROWS;
    const c0 = camera(AZ, EL);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    V.forEach(function (p) {
      const x = dot(p, c0.r), y = dot(p, c0.up);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    });
    const S0 = 0.92 * Math.min(CW / (x1 - x0), CH / (y1 - y0)), bx = (x0 + x1) / 2, by = (y0 + y1) / 2;
    const cells = TREES.map(function (parent, i) {
      const c = prepare(parent, CW, CH);
      c.cx = (i % COLS + 0.5) * CW; c.cy = (Math.floor(i / COLS) + 0.5) * CH;
      c.g = mk("g", {}, svg);
      return c;
    });
    const red = mk("g", { class: "ov-layer" }, svg);
    cells.forEach(function (c) { c.red = c.parts.map(function (o) { return { xy: o, el: mk("polygon", { class: "ov-part q45-part" }, red) }; }); });
    function draw(t) {
      const k = ease(t);
      cells.forEach(function (c) {
        const cam = between(c0, c.view.cam, k), r = cam.r, up = cam.up, S = S0 + (c.view.S - S0) * k;
        const ox = c.cx - S * ((1 - k) * bx + k * c.view.x), oy = c.cy + S * ((1 - k) * by + k * c.view.y);
        const pts = function (P) { return P.map(function (q) { return (ox + S * q[0]).toFixed(2) + "," + (oy - S * q[1]).toFixed(2); }).join(" "); };
        const items = faces.map(function (f, i) {
          const q = c.place(i, k);
          let n = q.n;
          if (dot(n, cam.c) < 0) n = mul(n, -1);
          /* 開き終わる近くは面がほぼ同じ高さになるので、重ねる順は、途中（LAST）の形で決めたまま変えない */
          const d = c.place(i, Math.min(k, LAST)).pts, dc = between(c0, c.view.cam, Math.min(k, LAST)).c;
          return { n: n, xy: q.pts.map(function (p) { return [dot(p, r), dot(p, up)]; }), depth: d.reduce(function (s, p) { return s + dot(p, dc); }, 0) / d.length };
        }).sort(function (a, b) { return a.depth - b.depth; });
        while (c.g.firstChild) c.g.removeChild(c.g.firstChild);
        items.forEach(function (it) {
          const fill = shadeToWhite(dot(it.n, r), dot(it.n, up), k);
          mk("polygon", { points: pts(it.xy), fill: fill, stroke: "#000", "stroke-width": 0.7, "stroke-linejoin": "round" }, c.g);
        });
        if (t >= 1) c.red.forEach(function (p) { p.el.setAttribute("points", pts(p.xy)); });
      });
    }
    const slide = svg.closest("slide"), mark = slide.querySelector(".q45-mark"), redMark = slide.querySelector(".q45-red");
    if (still) { draw(mark.classList.contains("on") ? 1 : 0); red.classList.toggle("show", redMark.classList.contains("on")); return; }
    follow(mark, draw, OPEN, 0);
    watchStep(redMark, function (on) { red.classList.toggle("show", on); });
    draw(0);
  }
  return { setup: setup };
})();
figure("q45", Q45.setup);
