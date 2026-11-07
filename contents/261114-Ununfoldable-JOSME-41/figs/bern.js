/* ===== 第 41 回 OSME-J のスライドの図：3 枚目の Bern et al. の多面体（common.js の道具を使う）===== */
/* spiked tetrahedron（basic hat）。正四面体の 4 つの面を帽子に置き換えた形で、20 頂点 24 面。
   座標は python/prior/hats.py の spiked_tetrahedron("basic", 3.0, alpha=81, beta=35)。面は外から見て反時計回り。
   面はどれも凸なので、像が重なる 2 面の前後を重なりの中の 1 点で比べて、奥から順に描く。
   ページが出ている間は、縦の軸のまわりに自動で回り続ける。図をドラッグすると、その間は手で回せて（横：方位、縦：仰角）、
   離すとその向きから自動で回り続ける。ドラッグしないクリックは、ふつうにページを送る。
   目印（何も表示しない <span step class="bern-mark">）が出たら、回転を止めて辺展開図に開き（面を親の面との辺のまわりに回す）、
   カメラは根の面の真上へ動く。辺を 3 つの組に分けて、組ごとに時間をずらして回し、開く途中で面どうしが貫通しないようにしてある。
   図の大きさと位置は、開く途中で枠に収まるように、はじめに決めてなめらかに変える。
   次の目印（<span step class="bern-red">）が出たら、重なる部分を赤で塗る。
   ← で戻るときは、動かさずにすぐ元の形にして、また回り始める。
   ページの写し（一覧・印刷・PDF）は動かない */
var BERN = (function () {
  const AZ = 0.1, EL = 0.1;                  // はじめの方位と仰角
  const SPIN = 2 * Math.PI / 12000;          // 自動で回る速さ（1 周 12 秒）
  const DRAG = 0.01, EL_MAX = 1.5;           // 1px のドラッグで回る角と、仰角の上限
  const OPEN = 4000;                         // 開くのにかける時間（ミリ秒）
  const V = [
    [1.06066, 1.06066, 1.06066],
    [1.06066, -1.06066, -1.06066],
    [-1.06066, 1.06066, -1.06066],
    [-1.06066, -1.06066, 1.06066],
    [0.81799, 0.81799, -0.11088],
    [0.81799, 0.11088, -0.81799],
    [0.11088, 0.81799, -0.81799],
    [2.39727, 2.39727, -2.39727],
    [0.81799, -0.11088, 0.81799],
    [0.11088, -0.81799, 0.81799],
    [0.81799, -0.81799, 0.11088],
    [2.39727, -2.39727, 2.39727],
    [-0.11088, 0.81799, 0.81799],
    [-0.81799, 0.81799, 0.11088],
    [-0.81799, 0.11088, 0.81799],
    [-2.39727, 2.39727, 2.39727],
    [-0.11088, -0.81799, -0.81799],
    [-0.81799, -0.81799, -0.11088],
    [-0.81799, -0.11088, -0.81799],
    [-2.39727, -2.39727, -2.39727]
  ];
  const F = [[7, 4, 5], [0, 1, 5, 4], [7, 5, 6], [1, 2, 6, 5], [7, 6, 4], [2, 0, 4, 6], [11, 8, 9], [0, 3, 9, 8], [11, 9, 10], [3, 1, 10, 9], [11, 10, 8], [1, 0, 8, 10], [15, 12, 13], [0, 2, 13, 12], [15, 13, 14], [2, 3, 14, 13], [15, 14, 12], [3, 0, 12, 14], [19, 16, 17], [1, 3, 17, 16], [19, 17, 18], [3, 2, 18, 17], [19, 18, 16], [2, 1, 16, 18]];
  /* 辺展開図の全域木（面の双対グラフの木）：面 i の親の面（根は -1）。重なる面の組が少ない木を python/prior/hats_cut_search.py で探した */
  const PARENT = [1, 11, 0, 2, 0, 3, 8, 11, 9, 19, 8, -1, 13, 5, 16, 17, 12, 7, 22, 21, 22, 15, 23, 3];

  /* 面 i と親の面の間の辺の組（根は -1）と、組ごとの回す時間（開く動き全体を 0〜1 として）。
     面どうしが貫通せず、動きが速くなりすぎない組分けを python/prior/hats_open_schedule.js で探した（1,500 コマで貫通 0） */
  const STAGE = [0, 0, 1, 2, 0, 2, 1, 1, 1, 0, 1, -1, 2, 0, 0, 2, 0, 2, 0, 1, 2, 2, 2, 0];
  const WINDOW = [[0, 0.5], [0.25, 0.75], [0.5, 1]];
  /* 開いて同じ平面に並ぶ面の上下：[下の面, 上の面]。重なる部分の台形 2 枚の組（面 1・11 と面 3・23）は、はじめの組で開いて 1 枚の 6 角形になり、
     そのあとは 6 角形のまま動く。6 角形どうしは、面 3・23 の 6 角形が上。開く動きから決まる */
  const STACK = [[1, 3], [1, 23], [11, 3], [11, 23], [5, 2]];

  const faces = F.map(function (f) {
    const pts = f.map(function (i) { return V[i]; });
    return { ids: f, pts: pts, n: norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]))), parent: null };
  });
  faces.forEach(function (f, i) { f.id = i; });
  /* ヒンジ：親の面との辺。回す角は、面の外向きが親の面の外向きに重なる角 */
  faces.forEach(function (f, i) {
    if (PARENT[i] < 0) return;
    const p = faces[PARENT[i]], s = f.ids.filter(function (id) { return p.ids.indexOf(id) >= 0; });
    f.parent = p; f.o = V[s[0]]; f.u = norm(sub(V[s[1]], V[s[0]]));
    f.th = Math.atan2(dot(f.u, cross(f.n, p.n)), dot(f.n, p.n));
  });
  const root = faces[PARENT.indexOf(-1)];
  /* 開く動きの t（0〜1）での面の点と外向き */
  function place(f, t) {
    let pts = f.pts, n = f.n;
    for (let g = f; g.parent; g = g.parent) {
      const w = WINDOW[STAGE[g.id]], x = Math.max(0, Math.min(1, (t - w[0]) / (w[1] - w[0]))), th = g.th * ease(x);
      pts = pts.map(function (p) { return rot(p, g.o, g.u, th); });
      n = rot(n, [0, 0, 0], g.u, th);
    }
    return { pts: pts, n: n };
  }

  function area(P) {
    let s = 0;
    P.forEach(function (p, i) { const q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; });
    return s / 2;
  }
  /* 凸多角形 a を凸多角形 b で切る */
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

  /* 面を、奥から順に並べて返す。閉じているとき（t = 0）は外向きの面だけを取る */
  function order(cam, t) {
    const c = cam.c, r = cam.r, up = cam.up;
    const items = [];
    faces.forEach(function (f) {
      const q = t > 0 ? place(f, t) : f;
      let n = q.n;
      if (dot(n, c) < 0) { if (t === 0) return; n = mul(n, -1); }
      if (t === 0 && dot(n, c) <= 1e-9) return;
      items.push({ id: f.id, pts: q.pts, n: n, xy: q.pts.map(function (p) { return [dot(p, r), dot(p, up)]; }), behind: [], wait: 0 });
    });
    /* 画面の点 (x, y) での、面の手前への高さ */
    function height(it, x, y) {
      return (dot(it.n, it.pts[0]) - x * dot(it.n, r) - y * dot(it.n, up)) / dot(it.n, c);
    }
    items.forEach(function (a, i) {
      if (dot(a.n, c) < 1e-6) return;
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        if (dot(b.n, c) < 1e-6) continue;
        const o = clip(a.xy, b.xy);
        if (o.length < 3 || Math.abs(area(o)) < 1e-7) continue;
        const x = o.reduce(function (s, p) { return s + p[0]; }, 0) / o.length, y = o.reduce(function (s, p) { return s + p[1]; }, 0) / o.length;
        const d = height(a, x, y) - height(b, x, y);
        let back = d < 0 ? a : b;
        /* ほぼ同じ平面にある 2 面は、高さでは比べられないので、開く動きから決まる上下に従う */
        if (Math.abs(d) < 1e-3) STACK.forEach(function (s) {
          if ((s[0] === a.id && s[1] === b.id) || (s[0] === b.id && s[1] === a.id)) back = s[0] === a.id ? a : b;
        });
        const front = back === a ? b : a;
        back.behind.push(front);
        front.wait++;
      }
    });
    const sorted = [], ready = items.filter(function (it) { return it.wait === 0; });
    while (ready.length) {
      const it = ready.pop();
      sorted.push(it);
      it.behind.forEach(function (f) { if (--f.wait === 0) ready.push(f); });
    }
    /* 開く途中で面どうしが交わって前後が循環したときは、残りの面を重心の奥行きの順に足す */
    if (sorted.length < items.length) {
      const depth = function (it) { return it.pts.reduce(function (s, p) { return s + dot(p, c); }, 0); };
      items.filter(function (it) { return sorted.indexOf(it) < 0; }).sort(function (a, b) { return depth(a) - depth(b); })
           .forEach(function (it) { sorted.push(it); });
    }
    return sorted;
  }

  /* 仰角 el で 1 周させても、図の枠からはみ出ない大きさ */
  function fit(el, W, H) {
    let mx = 0, my = 0;
    for (let k = 0; k < 72; k++) {
      const cam = camera(k * Math.PI / 36, el);
      V.forEach(function (p) { mx = Math.max(mx, Math.abs(dot(p, cam.r))); my = Math.max(my, Math.abs(dot(p, cam.up))); });
    }
    return Math.min(W / 2 / mx, H / 2 / my);
  }

  /* 開き終えたときのカメラ：根の面の真上から、展開図が図の枠にいちばん大きく入る向き */
  function flatView(W, H) {
    const flat = faces.map(function (f) { return place(f, 1).pts; });
    const c = root.n, e = norm(sub(root.pts[1], root.pts[0]));
    let best = null;
    for (let d = 0; d < 180; d += 2) {
      const r = rot(e, [0, 0, 0], c, d * Math.PI / 180), up = cross(c, r);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      flat.forEach(function (P) { P.forEach(function (p) {
        const x = dot(p, r), y = dot(p, up);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }); });
      const S = 0.97 * Math.min(W / (x1 - x0), H / (y1 - y0));
      if (!best || S > best.S) best = { S: S, cam: { r: r, up: up, c: c } };
    }
    return best;
  }
  /* 開き終えた展開図の、重なる部分（画面の座標の多角形） */
  function overlaps(cam) {
    const P = faces.map(function (f) { return place(f, 1).pts.map(function (p) { return [dot(p, cam.r), dot(p, cam.up)]; }); }), out = [];
    P.forEach(function (a, i) {
      for (let j = i + 1; j < P.length; j++) {
        const o = clip(a, P[j]);
        if (o.length >= 3 && Math.abs(area(o)) > 1e-7) out.push(o);
      }
    });
    return out;
  }
  /* カメラ a からカメラ b へ、k の割合だけ回したカメラ */
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

  /* still：ページの写し用（動かさずに、出ている段階表示のとおりに描く） */
  function setup(svg, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    const group = mk("g", {}, svg), red = mk("g", { class: "ov-layer" }, svg), flat = flatView(W, H);
    const parts = overlaps(flat.cam).map(function (o) { return { xy: o, el: mk("polygon", { class: "ov-part" }, red) }; });
    let az = AZ, el = EL, S0 = fit(el, W, H), path = null;
    /* 今の向きから開くときの、図の枠に収まる大きさと、開き終えた展開図の真ん中 */
    function plan() {
      const c0 = camera(az, el);
      function box(cam, t) {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        faces.forEach(function (f) { place(f, t).pts.forEach(function (p) {
          const x = dot(p, cam.r), y = dot(p, cam.up);
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }); });
        return [x0, x1, y0, y1];
      }
      const b = box(flat.cam, 1), x = (b[0] + b[1]) / 2, y = (b[2] + b[3]) / 2;
      let S = flat.S;
      for (let q = 1; q <= 34; q++) {
        const t = q / 40, k = ease(t), e = box(between(c0, flat.cam, k), t);
        S = Math.min(S, W / 2 / Math.max(k * x - e[0], e[1] - k * x), H / 2 / Math.max(k * y - e[2], e[3] - k * y));
      }
      return { S: S, x: x, y: y };
    }
    function draw(t) {
      const k = ease(t), cam = between(camera(az, el), flat.cam, k), r = cam.r, up = cam.up;
      const items = order(cam, t);
      if (t > 0 && !path) path = plan();
      if (t === 0) path = null;
      /* 大きさは、はじめの 4 割で開く途中に収まる大きさへ変え、終わりの 2 割で開き終えた大きさへ変える。位置は、原点から展開図の真ん中へ動かす */
      const S = path ? S0 + (path.S - S0) * ease(Math.min(1, t / 0.4)) + (flat.S - path.S) * ease(Math.max(0, (t - 0.8) / 0.2)) : S0;
      const dx = W / 2 - S * k * (path ? path.x : 0), dy = H / 2 + S * k * (path ? path.y : 0);
      function pts(xy) { return xy.map(function (q) { return (dx + S * q[0]).toFixed(2) + "," + (dy - S * q[1]).toFixed(2); }).join(" "); }
      while (group.firstChild) group.removeChild(group.firstChild);
      items.forEach(function (it) {
        const fill = shadeToWhite(dot(it.n, r), dot(it.n, up), k);
        mk("polygon", { points: pts(it.xy), fill: fill, stroke: "#000", "stroke-width": 1.2, "stroke-linejoin": "round" }, group);
      });
      if (t >= 1) parts.forEach(function (p) { p.el.setAttribute("points", pts(p.xy)); });
    }
    const mark = svg.closest("slide").querySelector(".bern-mark"), redMark = svg.closest("slide").querySelector(".bern-red");
    if (still) {
      draw(mark.classList.contains("on") ? 1 : 0);
      red.classList.toggle("show", redMark.classList.contains("on"));
      return;
    }

    const now = follow(mark, draw, OPEN, 0);
    watchStep(redMark, function (on) { red.classList.toggle("show", on); });
    draw(0);
    const page = svg.closest(".page");
    let held = false, moved = false, px = 0, py = 0, last = 0;
    function frame(time) {
      const dt = last ? Math.min(time - last, 100) : 0;
      last = time;
      if (!held && now() === 0 && !mark.classList.contains("on") && page.classList.contains("on")) { az += SPIN * dt; draw(0); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    svg.addEventListener("pointerdown", function (e) {
      moved = false;
      if (mark.classList.contains("on")) return;
      held = true; px = e.clientX; py = e.clientY;
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!held) return;
      const x = e.clientX - px, y = e.clientY - py;
      if (!moved && Math.hypot(x, y) < 4) return;
      moved = true; px = e.clientX; py = e.clientY;
      az -= x * DRAG;
      el = Math.max(-EL_MAX, Math.min(EL_MAX, el + y * DRAG));
      S0 = fit(el, W, H);
      draw(0);
    });
    function release() { held = false; }
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);
    /* ドラッグのあとのクリックでは、ページを送らない */
    svg.addEventListener("click", function (e) { if (moved) e.stopPropagation(); });
  }
  return { setup: setup };
})();
figure("bern", BERN.setup);
