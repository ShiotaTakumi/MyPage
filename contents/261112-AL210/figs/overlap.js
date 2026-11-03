/* ===== AL210 のスライドの図：4・5 枚目の、重なりを持つ辺展開図に開くアニメーション（common.js の道具を使う）===== */
/* 正角柱（底面の辺の長さ 1）を、2 枚目の立方体と同じく、面を親の面との辺（ヒンジ）のまわりに回して開く。
     4 枚目：Schlickenrieder がスケッチした 2 つ（3 枚目と同じ 2 つ）
       正 12 角柱・高さ 15：族 SBSBS-1 の端の帯を側面 1 枚にした辺展開図
       正 15 角柱・高さ 0.2：族 BSBS-1 の辺展開図
     5 枚目：正 24 角柱・高さ 1：族 BSBS-2 の辺展開図（高さ 1 では n ≥ 24 で重なる。塩田・斎藤 2024）
     7 枚目：4 枚目と同じ 2 つを、開き終えて拡大の丸を出した形だけ（Schlickenrieder の箱の中。動かさない）
     10 枚目：正 15 角柱・高さ 5：族 SBSBS-1 の辺展開図（4 枚目の正 12 角柱と同じ形。重なりが目で見えるように、この大きさにした）。
       角柱の上に双対グラフ（面の真ん中の点と、隣り合う面どうしを、共有する辺の真ん中を通って結ぶ線）を描き、開くと木の線も面と一緒に動く。
       線は、面ごとに、その面の上の半分（面の真ん中 → 共有する辺の真ん中）を面のすぐ後に描くので、奥の面の線は手前の面に隠れる。
       線と点には、全域木の辺か（dg-tree）そうでないか（dg-non）、重なる 2 面を結ぶ木の中のパスか（dg-path・dg-pnode）そうでないか
       （dg-off・dg-offnode）のクラスを付け、面には ov-path・ov-off を付ける。展開図と重なりの層は ov-pz の <g> に入れ、
       パスの面だけを図の枠いっぱいに広げる変換を CSS の変数 --pz に書いておく。パスを見せるだけなので、小さい丸と拡大の丸は出さず、
       重なりは赤で塗るだけにする。
       どれを見せるかは、段階表示の目印に合わせて al210.css で決める
   展開図の面の置き方は、補助資料サイトの docs/WALCOM2027/web/unfolding.js の sbsbs(12, h, 1)・bsbs(n, h, p) と同じ。
   ここでは、どの面をどの面に付けるか（親とヒンジ）と、折り角を書き足した。
   根の面 B2 を z = 0 に置き、ほかの面は、親との辺のまわりに 折り角 × (1 − t) だけ立体の側（+z）へ回す（t = 0 で角柱、t = 1 で展開図）。
   折り角は、底面と側面の間が 90°、側面どうしの間が 360°/n（180° から正 n 角形の内角を引いたもの）。
   図の中の目印（何も表示しない step）で、クリックごとに次のように進む（← で 1 つずつ戻る）。
     unfold-mark：開く（開き終えると、2 つの端の面の重なりを赤で塗る）
     ring-mark：重なりを小さい丸で囲み、続けて、そこから拡大の丸を引き出す
       （小さい丸と同じ場所・大きさから、最後の位置へ動きながら大きくなり、中の倍率も 1 倍から上がる） */
var OVERLAP = (function () {
  const TAU = 2 * Math.PI, R90 = Math.PI / 2;

  /* 平面のベクトル */
  function unit(th) { return [Math.cos(th), Math.sin(th)]; }
  function plus(p, q) { return [p[0] + q[0], p[1] + q[1]]; }
  function minus(p, q) { return [p[0] - q[0], p[1] - q[1]]; }
  function times(p, k) { return [p[0] * k, p[1] * k]; }
  function left(d) { return [-d[1], d[0]]; }
  function wedge(p, q) { return p[0] * q[1] - p[1] * q[0]; }
  function area(P) { return P.reduce(function (s, q, i) { return s + wedge(q, P[(i + 1) % P.length]); }, 0) / 2; }
  function centroid(P) { return times(P.reduce(plus, [0, 0]), 1 / P.length); }

  /* 辺の長さ 1 の正 n 角形の頂点：start から、はじめの辺の向き theta0 で、各頂点で turn だけ曲がる */
  function polygon(start, theta0, turn, n) {
    const v = [start];
    for (let k = 0; k < n - 1; k++) v.push(plus(v[k], unit(theta0 + k * turn)));
    return v;
  }
  /* 辺 a → a + d（d は単位ベクトル）の上に、向き m へ高さ h だけ立てた側面 */
  function side(a, d, m, h) {
    const b = plus(a, d);
    return [a, b, plus(b, times(m, h)), plus(a, times(m, h))];
  }
  /* 時計回りの底面 base の辺 k の外側に立てた側面（その底面に付ける。折り角 90°） */
  function onBase(id, parent, base, k, h) {
    const a = base[k], b = base[(k + 1) % base.length], d = minus(b, a);
    return { id: id, poly: side(a, d, left(d), h), parent: parent, hinge: [a, b], fold: R90 };
  }

  /* 族 SBSBS-1 の辺展開図（端の帯は側面 1 枚）。unfolding.js の sbsbs(n, h, 1) と同じ置き方。
     S1 は B1 に、S2 は B1 と B2 をつなぎ、E2 は B2 の辺 2 に付いた端の面。ほかの側面は B2 に付ける。
     2 つの端の面は S1 と E2 */
  function sbsbs(n, h) {
    const a = TAU / n;
    const s1 = [[0, 0], [1, 0], [1, h], [0, h]];
    const b1 = polygon([0, 0], 0, -a, n);                                   // 時計回り
    const s2 = side([1, 0], unit(-a), [Math.sin(a), Math.cos(a)], h);
    const b2 = polygon(s2[2], Math.PI - a, -a, n);                          // 時計回り
    const faces = [
      { id: "B2", poly: b2 },
      { id: "S2", poly: s2, parent: "B2", hinge: [s2[2], s2[3]], fold: R90 },
      { id: "B1", poly: b1, parent: "S2", hinge: [s2[0], s2[1]], fold: R90 },
      { id: "S1", poly: s1, parent: "B1", hinge: [s1[0], s1[1]], fold: R90 }
    ];
    for (let k = 2; k < n; k++) faces.push(onBase("E" + k, "B2", b2, k, h));
    return { faces: faces, ends: [["S1"], ["E2"]] };
  }

  /* 族 BSBS-(p − 1) の辺展開図（p = 2 で BSBS-1、p = 3 で BSBS-2）。unfolding.js の bsbs(n, h, p) と同じ置き方。
     S1 は B1 と B2 をつなぎ、端の帯（C1, …, Cp）は B2 の辺 p に付けて S1 の側へ伸ばす（C2 から先は、1 つ前の面に付ける。折り角 360°/n）。
     ほかの側面は B2 に付ける。2 つの端の面は B1 と、帯 C1, …, Cp */
  function bsbs(n, h, p) {
    const a = TAU / n;
    const b1 = polygon([0, -1], Math.PI / 2, a, n);                         // 反時計回り
    const s1 = [[0, -1], [0, 0], [h, 0], [h, -1]];
    const b2 = polygon([h, -1], Math.PI / 2, -a, n);                        // 時計回り
    const e = minus(b2[p + 1], b2[p]), d = times(e, -1), m = left(e);
    const faces = [
      { id: "B2", poly: b2 },
      { id: "S1", poly: s1, parent: "B2", hinge: [s1[3], s1[2]], fold: R90 },
      { id: "B1", poly: b1, parent: "S1", hinge: [s1[0], s1[1]], fold: R90 }
    ], band = [];
    for (let k = 0; k < p; k++) {
      const c = side(plus(b2[p + 1], times(d, k)), d, m, h), id = "C" + (k + 1);
      faces.push(k === 0 ? { id: id, poly: c, parent: "B2", hinge: [b2[p + 1], b2[p]], fold: R90 }
                         : { id: id, poly: c, parent: "C" + k, hinge: [c[0], c[3]], fold: a });
      band.push(id);
    }
    for (let k = p + 1; k < n; k++) faces.push(onBase("E" + k, "B2", b2, k, h));
    return { faces: faces, ends: [["B1"], band] };
  }

  /* 凸多角形 P の、凸多角形 Q の中の部分（Sutherland–Hodgman。Q の向きはどちらでもよい） */
  function clip(P, Q) {
    const sign = Math.sign(area(Q));
    let out = P;
    for (let i = 0; i < Q.length && out.length; i++) {
      const a = Q[i], e = minus(Q[(i + 1) % Q.length], a), input = out;
      function inside(p) { return sign * wedge(e, minus(p, a)); }
      out = [];
      input.forEach(function (p, j) {
        const q = input[(j + 1) % input.length], sp = inside(p), sq = inside(q);
        if (sp >= 0) out.push(p);
        if ((sp >= 0) !== (sq >= 0)) out.push(plus(p, times(minus(q, p), sp / (sp - sq))));
      });
    }
    return out;
  }

  /* 展開図 net（sbsbs() か bsbs()）を 3 次元に置き、たたみ方を決める。
     opt.mirror：左右を反転して置くか、opt.turn：開き終えた展開図を、画面で何ラジアン回して見せるか。
     返すもの：faces・byId、place(f, t)（t での面 f の 3 次元の点）、world(q)（展開図の上の点 q の置き場所）、az1 */
  function fold(net, opt) {
    const faces = net.faces, byId = {};
    faces.forEach(function (f) { byId[f.id] = f; });

    /* 置き方：左右を反転し（mirror）、B2 の重心を原点に置いてから、角 phi だけ回す。
       phi は、たたんだ角柱が 3 枚目と同じ向き（側面の 1 枚が正面を向く）になるように、B2 のどれかの辺の外向きの法線を
       カメラの水平の向きにそろえる角。開き終えたときのカメラの方位 az1 は、展開図が画面で turn だけ回って見える向き。
       n 通りの phi のうち、az1 が始めの方位 MMA_AZ にいちばん近いもの（開くあいだにカメラが回る量の少ないもの）を選ぶ */
    const sx = opt.mirror ? -1 : 1;
    const g0 = centroid(byId.B2.poly.map(function (q) { return [sx * q[0], q[1]]; }));
    function local(q) { return minus([sx * q[0], q[1]], g0); }
    const B2 = byId.B2.poly.map(local);
    let phi = 0, az1 = 0, best = Infinity;
    B2.forEach(function (q, k) {
      const mid = times(plus(q, B2[(k + 1) % B2.length]), 0.5);
      const p = MMA_AZ - R90 - Math.atan2(mid[1], mid[0]);
      let z = p - opt.turn - MMA_AZ;
      z -= TAU * Math.round(z / TAU);
      if (Math.abs(z) < best) { best = Math.abs(z); phi = p; az1 = MMA_AZ + z; }
    });
    function world(q) {
      const p = local(q), c = Math.cos(phi), s = Math.sin(phi);
      return [c * p[0] - s * p[1], s * p[0] + c * p[1], 0];
    }

    /* 回す向き：子の面が、親の面の表（+z、立体の側）へ立つ向き */
    faces.forEach(function (f) {
      f.pts = f.poly.map(world);
      if (!f.parent) return;
      f.o = world(f.hinge[0]);
      f.u = norm(sub(world(f.hinge[1]), f.o));
      const c = mul(f.pts.reduce(add, [0, 0, 0]), 1 / f.pts.length);
      f.sign = rot(c, f.o, f.u, f.fold)[2] > 0 ? 1 : -1;
    });
    /* t での各面の 3 次元の点。親から順に、展開図の上の位置のまま回してから親の変換をかける */
    function place(f, t) {
      let pts = f.pts;
      for (let g = f; g.parent; g = byId[g.parent]) {
        const th = g.sign * g.fold * (1 - t);
        pts = pts.map(function (p) { return rot(p, g.o, g.u, th); });
      }
      return pts;
    }
    return { faces: faces, byId: byId, place: place, world: world, az1: az1 };
  }

  /* opt：fold() の mirror・turn に加えて、zoom（拡大の丸の、図の中の真ん中 x, y と半径 r。px）、dur（開くのにかかるミリ秒）、
     like（3 枚目の同じ角柱の <svg> の id。開く前の大きさを、それに合わせる）か unit（開く前に、1 の長さを何 px で描くか）、
     label（開く前の上面に書く数。開き始めると消す）、center0・center1（開く前の角柱・開き終えた展開図の上下の真ん中を置く、
     図の中の高さ。px。書かなければ図の真ん中。開く途中は、その間をなめらかに移す）、middle0（開く前の角柱の左右の真ん中を置く、
     図の中の横の位置。px。書かなければ図の真ん中。開くにつれて、図の真ん中へ移す）、
     done（true なら、目印を使わず、開き終えて拡大の丸を出した形だけを描く）、
     path・dual（true なら、上の 10 枚目の形にする。丸を出さないので zoom は要らない）。
     still：ページの写し用（動かさずに、出ている段階表示のとおりに描く） */
  let zooms = 0;
  function setup(svg, net, opt, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    const F = fold(net, opt), faces = F.faces, byId = F.byId, place = F.place, world = F.world, az1 = F.az1;

    /* t での面の、画面の向きの座標（大きさを掛ける前）と、その広がり。
       カメラは、はじめは Mathematica の既定の視点から、開き終わると真上から（方位 az1） */
    function view(t) {
      const k = ease(t);
      const cam = camera(MMA_AZ + (az1 - MMA_AZ) * k, MMA_EL + (R90 - MMA_EL) * k), c = cam.c, r = cam.r, up = cam.up;
      const items = faces.map(function (f) {
        const pts = place(f, t);
        const depth = pts.reduce(function (s, p) { return s + dot(p, c); }, 0) / pts.length;
        let nrm = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
        if (dot(nrm, c) < 0) nrm = mul(nrm, -1);
        return { f: f, xy: pts.map(function (p) { return [dot(p, r), -dot(p, up)]; }), depth: depth,
                 fill: shadeToWhite(dot(nrm, r), dot(nrm, up), k) };
      });
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      items.forEach(function (it) { it.xy.forEach(function (q) {
        x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
      }); });
      return { items: items, r: r, up: up, x0: x0, x1: x1, y0: y0, y1: y1 };
    }
    /* 幅 w・高さ h の枠に収まる大きさ（1 の長さを何 px で描くか） */
    function fit(v, w, h) { return Math.min(0.96 * w / (v.x1 - v.x0), 0.96 * h / (v.y1 - v.y0)); }
    /* 大きさ：開く前は、3 枚目の同じ角柱と同じ（3 枚目の図の枠 opt.like に収めたときの大きさ）。開き終えると、この図の枠いっぱい。
       途中はその間をなめらかにつなぎ、枠からはみ出さないようにする */
    const like = opt.like && document.getElementById(opt.like);
    const S0 = opt.unit || (like ? fit(view(0), +like.getAttribute("width"), +like.getAttribute("height")) : fit(view(0), W, H)), S1 = fit(view(1), W, H);
    /* t での絵：大きさを決めて、図の真ん中に置く */
    function frame(t) {
      const v = view(t), items = v.items, r = v.r, up = v.up;
      const k = ease(t), S = Math.min(S0 + (S1 - S0) * k, fit(v, W, H));
      const c0 = opt.center0 == null ? H / 2 : opt.center0, c1 = opt.center1 == null ? H / 2 : opt.center1;
      const m0 = opt.middle0 == null ? W / 2 : opt.middle0;
      let dx = m0 + (W / 2 - m0) * k - S * (v.x0 + v.x1) / 2, dy = c0 + (c1 - c0) * k - S * (v.y0 + v.y1) / 2;
      /* 開く途中も、絵が図の枠からはみ出さないように（上の箱などにぶつからないように）。S は枠に収まる大きさ以下なので、両方を満たせる */
      dx = Math.min(Math.max(dx, 2 - S * v.x0), W - 2 - S * v.x1);
      dy = Math.min(Math.max(dy, 2 - S * v.y0), H - 2 - S * v.y1);
      items.forEach(function (it) { it.P = it.xy.map(function (q) { return [dx + S * q[0], dy + S * q[1]]; }); });
      /* 奥の面から描く */
      items.sort(function (a, b) { return a.depth - b.depth; });
      /* 展開図の上の点 q（開き終えたとき）の、図の中の位置 */
      function at(q) { const p = world(q); return [dx + S * dot(p, r), dy - S * dot(p, up)]; }
      return { items: items, at: at };
    }
    function points(P) { return P.map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" "); }
    /* 面の木（親をたどる）の上で、2 つの端の面を結ぶパスの面 */
    const onPath = {};
    if (opt.path) {
      const up = function (id) { const r = []; for (let g = byId[id]; g; g = byId[g.parent]) r.push(g.id); return r; };
      const a = up(net.ends[0][0]), b = up(net.ends[1][0]), meet = a.filter(function (id) { return b.indexOf(id) >= 0; })[0];
      a.slice(0, a.indexOf(meet) + 1).concat(b.slice(0, b.indexOf(meet))).forEach(function (id) { onPath[id] = true; });
    }
    /* dual のとき：双対グラフの辺（たたんだ角柱で辺を共有する 2 面）。面ごとに、共有する辺の 2 頂点の番号とクラスを持つ */
    const halves = {};
    if (opt.dual) {
      const P0 = {};
      faces.forEach(function (f) { P0[f.id] = place(f, 0); halves[f.id] = []; });
      const near = function (p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-6; };
      faces.forEach(function (f, i) { faces.forEach(function (g, j) {
        if (j <= i) return;
        const shared = [];
        P0[f.id].forEach(function (p, a) { P0[g.id].forEach(function (q, b) { if (near(p, q)) shared.push([a, b]); }); });
        if (shared.length !== 2) return;
        const tree = f.parent === g.id || g.parent === f.id, path = tree && onPath[f.id] && onPath[g.id];
        const cls = "dg " + (tree ? "dg-tree" : "dg-non") + (path ? " dg-path" : " dg-off");
        halves[f.id].push({ a: shared[0][0], b: shared[1][0], cls: cls });
        halves[g.id].push({ a: shared[0][1], b: shared[1][1], cls: cls });
      }); });
    }
    function paint(items, parent, attrs, dual) {
      items.forEach(function (it) {
        const cls = opt.path ? { class: onPath[it.f.id] ? "ov-path" : "ov-off" } : {};
        mk("polygon", Object.assign({ points: points(it.P), fill: it.fill, stroke: "#000", "stroke-width": 1.2,
                                      "stroke-linejoin": "round" }, cls, attrs || {}), parent);
        if (!dual || !opt.dual) return;
        /* この面の上の、双対グラフの線の半分と点（太さは、広げても変えない） */
        const c = centroid(it.P);
        halves[it.f.id].forEach(function (hf) {
          const m = times(plus(it.P[hf.a], it.P[hf.b]), 0.5);
          mk("line", { x1: c[0].toFixed(2), y1: c[1].toFixed(2), x2: m[0].toFixed(2), y2: m[1].toFixed(2), class: hf.cls,
                       "vector-effect": "non-scaling-stroke" }, parent);
        });
        mk("circle", { cx: c[0].toFixed(2), cy: c[1].toFixed(2), r: 3.5, class: "dg-node " + (onPath[it.f.id] ? "dg-pnode" : "dg-offnode") }, parent);
      });
    }

    /* 層：展開図、重なり（赤。開き終えたら出す）、小さい丸と拡大（目印が出たら出す） */
    const host = opt.path ? mk("g", { class: "ov-pz" }, svg) : svg;
    const group = mk("g", {}, host), red = mk("g", { class: "ov-layer" }, host);
    const ring = mk("g", { class: "ov-layer" }, svg), zoom = mk("g", { class: "ov-layer" }, svg);
    const last = frame(1), parts = [];
    net.ends[0].forEach(function (a) { net.ends[1].forEach(function (b) {
      const part = clip(byId[a].poly, byId[b].poly);
      if (part.length >= 3 && Math.abs(area(part)) > 1e-9) parts.push(part.map(last.at));
    }); });
    const all = [].concat.apply([], parts);
    const ox0 = Math.min.apply(null, all.map(function (q) { return q[0]; })), ox1 = Math.max.apply(null, all.map(function (q) { return q[0]; }));
    const oy0 = Math.min.apply(null, all.map(function (q) { return q[1]; })), oy1 = Math.max.apply(null, all.map(function (q) { return q[1]; }));
    const O = [(ox0 + ox1) / 2, (oy0 + oy1) / 2], Z = opt.zoom ? [opt.zoom.x, opt.zoom.y] : O, rz = opt.zoom ? opt.zoom.r : 1;
    /* 小さい丸は重なりを囲む大きさ、拡大の倍率は、重なりが大きい丸の直径の半分ほどになるように */
    const rs = Math.max(6, 0.75 * Math.hypot(ox1 - ox0, oy1 - oy0));
    const M = rz / Math.max(ox1 - ox0, oy1 - oy0);
    /* path のとき：パスの面だけを図の枠いっぱいに広げる変換 */
    if (opt.path) {
      const ps = [].concat.apply([], last.items.filter(function (it) { return onPath[it.f.id]; }).map(function (it) { return it.P; }));
      const xs = ps.map(function (q) { return q[0]; }), ys = ps.map(function (q) { return q[1]; });
      const bx0 = Math.min.apply(null, xs), bx1 = Math.max.apply(null, xs), by0 = Math.min.apply(null, ys), by1 = Math.max.apply(null, ys);
      const s = Math.min(0.94 * W / (bx1 - bx0), 0.94 * H / (by1 - by0)), tx = W / 2 - s * (bx0 + bx1) / 2, ty = H / 2 - s * (by0 + by1) / 2;
      host.style.setProperty("--pz", "matrix(" + [s, 0, 0, s, tx, ty].map(function (v) { return v.toFixed(4); }).join(",") + ")");
      host.style.setProperty("--pzs", s.toFixed(4));     // 広げる倍率（広げても線の太さと点の大きさを変えないよう、CSS でこれで割る）
    }
    parts.forEach(function (P) { mk("polygon", { points: points(P), class: "ov-part" }, red); });
    mk("circle", { cx: O[0].toFixed(2), cy: O[1].toFixed(2), r: rs.toFixed(2), class: "ov-ring" }, ring);
    /* 拡大の丸：2 つの丸をつなぐ線（共通外接線）、白で下を隠す丸、その中の拡大した展開図、縁。
       動かすときは、位置・半径・倍率を書き換える */
    const leads = [0, 1].map(function () { return mk("line", { class: "ov-lead" }, zoom); });
    const cid = "ov-zoom-" + (++zooms);       // 切り抜きの id（ページの写しでも重ならないように、通し番号）
    const back = mk("circle", { fill: "#fff" }, zoom);
    const hole = mk("circle", {}, mk("clipPath", { id: cid }, mk("defs", {}, zoom)));
    const inner = mk("g", {}, mk("g", { "clip-path": "url(#" + cid + ")" }, zoom));
    paint(last.items, inner, { "vector-effect": "non-scaling-stroke" });
    parts.forEach(function (P) { mk("polygon", { points: points(P), class: "ov-part" }, inner); });
    const rim = mk("circle", { class: "ov-ring" }, zoom);

    function show(layer, on) { layer.setAttribute("class", on ? "ov-layer show" : "ov-layer"); }
    function draw(t) {
      t = Math.max(0, Math.min(1, t));
      while (group.firstChild) group.removeChild(group.firstChild);
      const items = frame(t).items;
      paint(items, group, null, true);
      /* 上面（B1）に書いた数（opt.label）は、開き始めると薄くして消す */
      if (opt.label && t < 0.2) {
        const top = items.filter(function (it) { return it.f.id === "B1"; })[0];
        lid(group, centroid(top.P), opt.label, 1 - t / 0.2);
      }
      show(red, t >= 1);
    }
    /* 拡大の丸を引き出す：z = 0 で小さい丸と同じ（倍率 1）、z = 1 で最後の位置・大きさ（倍率 M）。
       はじめの PAUSE の間は小さい丸だけを見せ、そこから引き出す */
    const PAUSE = 0.15;
    function pull(z) {
      z = Math.max(0, Math.min(1, z));
      show(ring, z > 0);
      show(zoom, z > PAUSE);
      const e = ease(Math.max(0, (z - PAUSE) / (1 - PAUSE)));
      const C = plus(O, times(minus(Z, O), e)), r = rs + (rz - rs) * e, k = 1 + (M - 1) * e;
      [back, hole, rim].forEach(function (c) { c.setAttribute("cx", C[0].toFixed(2)); c.setAttribute("cy", C[1].toFixed(2)); c.setAttribute("r", r.toFixed(2)); });
      inner.setAttribute("transform", "translate(" + C[0].toFixed(2) + "," + C[1].toFixed(2) + ") scale(" + k.toFixed(4) +
                                      ") translate(" + (-O[0]).toFixed(3) + "," + (-O[1]).toFixed(3) + ")");
      /* つなぐ線は、2 つの丸が離れて共通外接線が引けるときだけ */
      const dz = minus(C, O), d = Math.hypot(dz[0], dz[1]), ok = d > r - rs + 1;
      leads.forEach(function (line, i) {
        line.setAttribute("visibility", ok ? "visible" : "hidden");
        if (!ok) return;
        const a = Math.atan2(dz[1], dz[0]) + (i ? -1 : 1) * Math.acos((rs - r) / d);
        const p = plus(O, times(unit(a), rs)), q = plus(C, times(unit(a), r));
        line.setAttribute("x1", p[0].toFixed(2)); line.setAttribute("y1", p[1].toFixed(2));
        line.setAttribute("x2", q[0].toFixed(2)); line.setAttribute("y2", q[1].toFixed(2));
      });
    }
    if (opt.done) { draw(1); pull(1); return; }
    const fig = svg.closest("figure"), unfoldMark = fig.querySelector(".unfold-mark"), ringMark = fig.querySelector(".ring-mark");
    if (opt.path) {
      /* 10 枚目：丸は出さない（パスを見せるだけなので、重なりは赤で塗るだけにする）。開くのは 4 枚目と同じ */
      [ring, zoom].forEach(function (g) { svg.removeChild(g); });
      if (still) { draw(unfoldMark.classList.contains("on") ? 1 : 0); return; }
      draw(0);
      follow(unfoldMark, draw, opt.dur, 400);
      return;
    }
    if (still) {
      draw(unfoldMark.classList.contains("on") ? 1 : 0);
      pull(ringMark.classList.contains("on") ? 1 : 0);
      return;
    }
    draw(0);
    pull(0);
    /* 開く目印が出たら開き、消えたら閉じる（戻すときは速く）。
       丸の目印が出たら、小さい丸で囲んでから拡大の丸を引き出し（1 秒）、消えたら縮めて消す（0.3 秒） */
    follow(unfoldMark, draw, opt.dur, 400);
    follow(ringMark, pull, 1000, 300);
  }

  return {
    /* 確かめ用（たたんだときに角柱が閉じるか、など） */
    sbsbs: sbsbs, bsbs: bsbs, fold: fold, clip: clip, area: area,
    /* 正 12 角柱・高さ 15：展開図は、S2 が右へ伸びる向きに見せる（補助資料サイトと同じ向き） */
    p12: function (svg, still) { setup(svg, sbsbs(12, 15), { mirror: false, turn: Math.PI / 2 + TAU / 12, zoom: { x: 370, y: 266, r: 58 }, dur: 1800, like: "prism-12" }, still); },
    /* 正 15 角柱・高さ 0.2：展開図は、B2 を左に見せる（冬の LA と同じ向き） */
    p15: function (svg, still) { setup(svg, bsbs(15, 0.2, 2), { mirror: true, turn: 0, zoom: { x: 370, y: 266, r: 58 }, dur: 1800, like: "prism-15" }, still); },
    /* 5 枚目：正 24 角柱・高さ 1。開く前は、左の正 12・正 15 角柱（height1.js）と同じ縮尺 UNIT1 で描く */
    p24: function (svg, still) { setup(svg, bsbs(24, 1, 3), { mirror: true, turn: 0, zoom: { x: 250, y: 266, r: 56 }, dur: 1800, unit: UNIT1, label: "24", center0: 89, center1: 110, middle0: 144 }, still); },
    /* 7 枚目：4 枚目と同じ 2 つの、開き終えた形 */
    d12: function (svg) { setup(svg, sbsbs(12, 15), { mirror: false, turn: Math.PI / 2 + TAU / 12, zoom: { x: 326, y: 130, r: 40 }, done: true }); },
    d15: function (svg) { setup(svg, bsbs(15, 0.2, 2), { mirror: true, turn: 0, zoom: { x: 326, y: 130, r: 40 }, done: true }); },
    /* 10 枚目：正 15 角柱・高さ 5（双対グラフを重ねて開く） */
    path15: function (svg, still) { setup(svg, sbsbs(15, 5), { mirror: false, turn: Math.PI / 2 + TAU / 15, dur: 1800, path: true, dual: true }, still); }
  };
})();
figure("overlap-12", OVERLAP.p12);
figure("overlap-15", OVERLAP.p15);
figure("overlap-24", OVERLAP.p24);
figure("known-12", OVERLAP.d12);
figure("known-15", OVERLAP.d15);
figure("path-15", OVERLAP.path15);
