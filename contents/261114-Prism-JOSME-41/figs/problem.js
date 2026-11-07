/* ===== 第 41 回 OSME-J のスライドの図：6 枚目の、高さ h の正 n 角柱（common.js の道具を使う）===== */
/* 3 枚目と同じく、Mathematica の既定の視点と光で正 n 角柱を描き（底面の辺の長さ 1、側面の 1 枚が正面）、
   上面に n、左に高さの矢印と h を書く（冬の LA と同じ）。n = 3 は上面が小さいので、n を角柱の上に書く（5 枚目と同じ）。
   右の 2 本のバー（<div class="problem-bars"> の中の <input type="range" data-bar="n|h">）で n と h を変えられる。
     n：3〜30 の整数（はじめは 12）
     h：HMIN から、その n で図の枠に入る一番高い値 hmax まで。バーの位置は高さの対数に比例させる
   縮尺は n ごとに決め、h を変えても変えない（底面は動かず、角柱が上に伸び縮みする）。1 の長さは MAX px までで、
   どの n でも少なくとも h = 1 が枠に入る大きさにする。角柱の下の端は、枠の下の端にそろえる。
   右下の再生ボタン（<button class="play">）を押したら、高さを今の値 → hmax（その n で入る一番高い値）→ HMIN（一番低い値）→ 1 と
   なめらかに変えて、「高さはいろいろ」を見せる（高さを、区間ごとに ease でつなぐ。対数でつなぐと、見た目がほとんど変わらない
   低い所（0.05 の近く）に長くとどまるので、高さそのままでつなぎ、画面の上での伸び縮みの速さをそろえる）。動いている間は、h のバーもついてくる。
   n は動かさない（バーで選んでから再生する）。クリックでページを進めても動かさない（ボタンで操作する） */
var PROBLEM = (function () {
  const DUR = 4000, MAX = 40, HMIN = 0.05, ROOM = 24;   // ROOM：n = 3 で上に書く n の分（px）

  /* 0〜1 での高さ：keys の間を、区間の長さ（高さの差）に比べた時間をかけてつなぐ */
  function path(keys) {
    const lens = keys.slice(1).map(function (v, i) { return Math.abs(v - keys[i]); });
    const total = lens.reduce(function (s, v) { return s + v; }, 0) || 1;
    return function (t) {
      let x = Math.max(0, Math.min(1, t)) * total;
      for (let i = 0; i < lens.length; i++) {
        if (x <= lens[i] || i === lens.length - 1) return keys[i] + (keys[i + 1] - keys[i]) * ease(lens[i] ? Math.min(1, x / lens[i]) : 1);
        x -= lens[i];
      }
    };
  }

  function setup(svg, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    const cam = camera(MMA_AZ, MMA_EL), c = cam.c, r = cam.r, up = cam.up;
    const group = mk("g", {}, svg), CE = dot([0, 0, 1], up);    // CE：高さ 1 が画面で何の長さに見えるか
    let n = 12, h = 1, ring, left, S, dx, dy, hmax;

    /* n が決まったら：底面の頂点、左の輪郭になる頂点（高さの矢印は、その縦の辺に沿わせる）、縮尺 S、置き場所、入る一番高い h */
    function shape() {
      const a0 = Math.atan2(c[1], c[0]) - Math.PI / n, R = 1 / (2 * Math.sin(Math.PI / n));   // R：外接円の半径
      ring = [];
      for (let i = 0; i < n; i++) ring.push([R * Math.cos(a0 + 2 * Math.PI * i / n), R * Math.sin(a0 + 2 * Math.PI * i / n)]);
      left = ring.reduce(function (a, q) { return dot([q[0], q[1], 0], r) < dot([a[0], a[1], 0], r) ? q : a; });
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      ring.forEach(function (q) {
        const p = [q[0], q[1], 0], x = dot(p, r), y = -dot(p, up);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      });
      /* 左に矢印と h を書く分（60px）を空ける。底面の縦の広がり e0 と、高さ 1 の分が枠に入るように。n = 3 は、上に書く n の分も空ける */
      const e0 = y1 - y0;
      S = Math.min(MAX, 0.9 * (W - 120) / (x1 - x0), 0.92 * H / (e0 + CE));
      hmax = ((0.92 * H - (n === 3 ? ROOM : 0)) / S - e0) / CE;
      dx = W / 2 - S * (x0 + x1) / 2; dy = H - 4 - S * y1;
    }
    shape();

    function draw() {
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
      const at = function (p) { return [dx + S * dot(p, r), dy - S * dot(p, up)]; };
      items.sort(function (a, b) { return a.depth - b.depth; });
      while (group.firstChild) group.removeChild(group.firstChild);
      items.forEach(function (it) {
        mk("polygon", { points: it.xy.map(function (q) { return (dx + S * q[0]).toFixed(2) + "," + (dy + S * q[1]).toFixed(2); }).join(" "),
                        fill: it.fill, stroke: "#000", "stroke-width": 1.2, "stroke-linejoin": "round" }, group);
      });
      /* 上面の真ん中に n。n = 3 は、角柱の上の端から 20px 上に */
      const c0 = at([0, 0, h]);
      if (n === 3) lid(group, [c0[0], Math.min.apply(null, ring.map(function (q) { return at([q[0], q[1], h])[1]; })) - 20], "n", 1, true);
      else lid(group, c0, "n", 1, true);
      /* 高さの矢印（両向き）と h：左の輪郭の縦の辺から 18px 左。矢印が短く、三角が重なるときは、
         寸法線と同じく、三角を線の外側から内向きに付け、測っている上の端と下の端から横線（補助線）を矢印の少し先まで引く */
      const b = at([left[0], left[1], 0]), t = at([left[0], left[1], h]), x = b[0] - 18, inward = b[1] - t[1] < 30;
      const line = function (ya, yb) { mk("line", { x1: x.toFixed(2), y1: ya.toFixed(2), x2: x.toFixed(2), y2: yb.toFixed(2), class: "h-arrow" }, group); };
      if (inward) {
        line(t[1] - 18, t[1]); line(b[1], b[1] + 18);
        [t[1], b[1]].forEach(function (y) {
          mk("line", { x1: (x - 8).toFixed(2), y1: y.toFixed(2), x2: (b[0] - 3).toFixed(2), y2: y.toFixed(2), class: "h-extension" }, group);
        });
      } else line(t[1] + 7, b[1] - 7);
      [[t[1], inward ? -1 : 1], [b[1], inward ? 1 : -1]].forEach(function (e) {
        mk("polygon", { points: [[x, e[0]], [x - 6, e[0] + 11 * e[1]], [x + 6, e[0] + 11 * e[1]]].map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" "),
                        class: "h-arrow-head" }, group);
      });
      lid(group, [x - 20, (t[1] + b[1]) / 2], "h", 1, true);
    }

    if (still) { draw(); return; }
    draw();

    /* 2 本のバー。バーを操作したクリックでページが進まないようにし、操作し終えたら、キーがページ送りに戻るようにフォーカスを外す */
    const bars = svg.closest("slide").querySelector(".problem-bars");
    const input = function (k) { return bars.querySelector('input[data-bar="' + k + '"]'); };
    const shown = function (k) { return bars.querySelector('span[data-bar="' + k + '"]'); };
    function showN() { shown("n").textContent = String(n); }
    /* h とバーの位置（0〜1000）：HMIN〜hmax を、高さの対数で */
    const hOf = function (v) { return Math.exp(Math.log(HMIN) + (Math.log(hmax) - Math.log(HMIN)) * v / 1000); };
    const vOf = function (x) { return Math.round((Math.log(x) - Math.log(HMIN)) / (Math.log(hmax) - Math.log(HMIN)) * 1000); };
    function showH() { shown("h").textContent = h.toFixed(2); input("h").value = vOf(h); }
    input("n").value = n; showN(); showH();
    bars.addEventListener("click", function (e) { e.stopPropagation(); });
    /* n を変えたら、縮尺と入る範囲を決め直し、h がはみ出すなら入る一番高い値にする */
    input("n").addEventListener("input", function () { stop(); n = +this.value; shape(); h = Math.min(h, hmax); showN(); showH(); draw(); });
    input("h").addEventListener("input", function () { stop(); h = hOf(+this.value); shown("h").textContent = h.toFixed(2); draw(); });
    [input("n"), input("h")].forEach(function (el) {
      el.addEventListener("change", function () { el.blur(); });
      el.addEventListener("pointerup", function () { el.blur(); });
    });

    /* 再生ボタンで高さを動かす。動いている途中なら RUNNING に入れておく（最後の形は、h = 1 に戻った形） */
    let raf = 0, t0 = 0, go = null;
    const self = { finish: function () { stop(); } };
    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = 0; h = 1; showH(); draw(); }
      RUNNING.delete(self);
    }
    function play() {
      go = path([h, hmax, HMIN, 1]);
      t0 = performance.now(); raf = requestAnimationFrame(frame); RUNNING.add(self);
    }
    function frame(now) {
      const x = Math.max(0, now - t0) / DUR;
      if (x >= 1) { stop(); return; }
      h = go(x); showH(); draw();
      raf = requestAnimationFrame(frame);
    }
    /* 押したら、キーがページ送りに戻るようにフォーカスを外す（ボタンのクリックではページは進まない。uoh-slide.js） */
    svg.closest("slide").querySelector(".play").addEventListener("click", function () { this.blur(); stop(); play(); });
  }
  return { p: setup };
})();
figure("problem-prism", PROBLEM.p);
