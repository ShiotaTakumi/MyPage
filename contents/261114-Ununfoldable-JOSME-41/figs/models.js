/* ===== 第 41 回 OSME-J のスライドの図：4・6・8・9 枚目の、面と頂点の少ない多面体（common.js の道具を使う）===== */
/* ll8・ll10：Lubiw and Lucier の例（results/prior/P3phi_10_30_1o2_1o200.json、P4_10_1.json）。
   ade76・ade67：Akitaya et al. の例。論文に数の座標がないので、論文の作り方から作った（python/prior/akitaya.py）。
   dde20：Demaine et al. の面がすべて鋭角三角形の例（9 枚目）。論文の角（つば 85°・47.5°、帯と冠 85°・10°）から作った（python/prior/hats.py）。
   v7：正三角形 7 枚で 1 つの頂点を囲み（面の角の和は 7 × 60° = 420° なので、平らに収まらず波打つ）、まわりの 7 頂点を下の 1 頂点と結んで閉じた多面体
      （9 頂点 14 面、8 枚目）。7 枚がつながる辺の長さがすべて同じになるよう、頂点の向きを数値で求めた（誤差 3 × 10^-5 ほど）。
      下の頂点は真ん中の頂点から 1 下。面の角の和が 360° より大きいのは真ん中の頂点だけで、そこに赤の点を打つ。
   ico・icod：正二十面体と、その頂点を 1 つ、まわりの 5 頂点を通る平面について折り返して凹ませた形（8 枚目。クリックで ico から icod へ動かす）。
      どちらも、その頂点（凹ませた頂点）が上（+z）に来るように回してある。面の形とつながり方は同じなので、辺展開図も同じになる
      （凹ませた頂点の面の角の和は 300° のまま）。
   tet：少しゆがんだ四面体（6 枚目）。q・cf7・t7・on7：この研究の例（examples/Q_integer.json、CF7_integer.json、T7_integer.json、results/one_concave_polish/oc7_int4.json）。on7 は、回したときに大きく描けるよう、広がりの大きい 2 方向を水平に置き直した。
   V は頂点、T は三角形に分けた面（3 つの頂点と、その 3 辺がもとの面の辺かどうか）。凸でない面があるので、三角形ごとに前後を比べて奥から描く。
   図が出ている間は、縦の軸のまわりに自動で回り続ける。図をドラッグすると、その間は手で回せて（横：方位、縦：仰角）、
   離すとその向きから自動で回り続ける。ページの写し（一覧・印刷・PDF）は動かない */
var MODELS = (function () {
  const DATA = {"v7":{"V":[[0.0,0.0,0.2398],[0.6501,0.7475,0.3764],[-0.2211,0.9202,-0.0832],[-0.8285,0.4575,0.5627],[-0.8933,-0.4283,0.1032],[-0.2475,-0.8172,0.7602],[0.606,-0.7955,0.2398],[0.8536,0.0217,-0.2807],[0.0,0.0,-0.7602]],"T":[[0,1,2,1,1,1],[0,2,3,1,1,1],[0,3,4,1,1,1],[0,4,5,1,1,1],[0,5,6,1,1,1],[0,6,7,1,1,1],[0,7,1,1,1,1],[8,2,1,1,1,1],[8,3,2,1,1,1],[8,4,3,1,1,1],[8,5,4,1,1,1],[8,6,5,1,1,1],[8,7,6,1,1,1],[8,1,7,1,1,1]],"dot":0},"ico":{"V":[[0.0,0.0,1.9021],[1.0,1.3764,0.8506],[1.618,-0.5257,0.8507],[0.0,1.7013,-0.8506],[1.0,-1.3764,-0.8506],[-1.618,-0.5257,0.8507],[0.0,-1.7013,0.8506],[-1.0,1.3764,0.8506],[1.618,0.5257,-0.8507],[0.0,-0.0,-1.9021],[-1.0,-1.3764,-0.8506],[-1.618,0.5257,-0.8507]],"T":[[0,2,1,1,1,1],[0,1,7,1,1,1],[0,6,2,1,1,1],[0,5,6,1,1,1],[0,7,5,1,1,1],[1,2,8,1,1,1],[1,3,7,1,1,1],[1,8,3,1,1,1],[2,6,4,1,1,1],[2,4,8,1,1,1],[3,11,7,1,1,1],[3,8,9,1,1,1],[3,9,11,1,1,1],[4,6,10,1,1,1],[4,9,8,1,1,1],[4,10,9,1,1,1],[5,10,6,1,1,1],[5,7,11,1,1,1],[5,11,10,1,1,1],[9,10,11,1,1,1]]},"icod":{"V":[[0.0,-0.0,-0.2008],[1.0,1.3764,0.8506],[1.618,-0.5257,0.8507],[0.0,1.7013,-0.8506],[1.0,-1.3764,-0.8506],[-1.618,-0.5257,0.8507],[0.0,-1.7013,0.8506],[-1.0,1.3764,0.8506],[1.618,0.5257,-0.8507],[0.0,-0.0,-1.9021],[-1.0,-1.3764,-0.8506],[-1.618,0.5257,-0.8507]],"T":[[0,2,1,1,1,1],[0,1,7,1,1,1],[0,6,2,1,1,1],[0,5,6,1,1,1],[0,7,5,1,1,1],[1,2,8,1,1,1],[1,3,7,1,1,1],[1,8,3,1,1,1],[2,6,4,1,1,1],[2,4,8,1,1,1],[3,11,7,1,1,1],[3,8,9,1,1,1],[3,9,11,1,1,1],[4,6,10,1,1,1],[4,9,8,1,1,1],[4,10,9,1,1,1],[5,10,6,1,1,1],[5,7,11,1,1,1],[5,11,10,1,1,1],[9,10,11,1,1,1]]},"dde20":{"V":[[0.3536,0.3536,0.3536],[0.3536,-0.3536,-0.3536],[-0.3536,0.3536,-0.3536],[-0.3536,-0.3536,0.3536],[0.3772,0.3772,-0.4684],[0.3772,0.4684,-0.3772],[0.4684,0.3772,-0.3772],[0.8327,0.8327,-0.8327],[0.3772,-0.4684,0.3772],[0.4684,-0.3772,0.3772],[0.3772,-0.3772,0.4684],[0.8327,-0.8327,0.8327],[-0.4684,0.3772,0.3772],[-0.3772,0.3772,0.4684],[-0.3772,0.4684,0.3772],[-0.8327,0.8327,0.8327],[-0.4684,-0.3772,-0.3772],[-0.3772,-0.3772,-0.4684],[-0.3772,-0.4684,-0.3772],[-0.8327,-0.8327,-0.8327]],"T":[[7,4,5,1,1,1],[7,5,6,1,1,1],[7,6,4,1,1,1],[1,2,4,1,1,1],[0,6,5,1,1,1],[2,0,5,1,1,1],[1,4,6,1,1,1],[0,1,6,1,1,1],[2,5,4,1,1,1],[11,8,9,1,1,1],[11,9,10,1,1,1],[11,10,8,1,1,1],[3,1,8,1,1,1],[0,10,9,1,1,1],[1,0,9,1,1,1],[3,8,10,1,1,1],[0,3,10,1,1,1],[1,9,8,1,1,1],[15,12,13,1,1,1],[15,13,14,1,1,1],[15,14,12,1,1,1],[2,3,12,1,1,1],[0,14,13,1,1,1],[3,0,13,1,1,1],[2,12,14,1,1,1],[0,2,14,1,1,1],[3,13,12,1,1,1],[19,16,17,1,1,1],[19,17,18,1,1,1],[19,18,16,1,1,1],[3,2,16,1,1,1],[1,18,17,1,1,1],[2,1,17,1,1,1],[3,16,18,1,1,1],[1,3,18,1,1,1],[2,17,16,1,1,1]]},"ll8":{"V":[[28.1908,20.1303,-0.3885],[0.0,-20.1303,-0.3208],[-28.1908,20.1303,-0.3885],[0.0,10.9339,-0.1115],[1.0,9.1695,-0.1115],[-1.0,9.1695,-0.1115],[0.0,9.8697,0.3885],[0.0,9.8697,-0.1065]],"T":[[6,0,3,1,1,1],[4,0,6,1,1,1],[6,1,4,1,1,1],[5,1,6,1,1,1],[6,2,5,1,1,1],[3,2,6,1,1,1],[4,7,3,1,1,0],[3,0,4,1,1,0],[5,7,4,1,1,0],[4,1,5,1,1,0],[3,7,5,1,1,0],[5,2,3,1,1,0]]},"ll10":{"V":[[10.0,0.0,0.0],[0.0,-10.0,0.0],[-10.0,0.0,0.0],[0.0,10.0,0.0],[1.0,1.0,0.0],[1.0,-1.0,0.0],[-1.0,-1.0,0.0],[-1.0,1.0,0.0],[0.0,0.0,1.0],[0.0,0.0,-1.0]],"T":[[8,0,4,1,1,1],[5,0,8,1,1,1],[8,1,5,1,1,1],[6,1,8,1,1,1],[8,2,6,1,1,1],[7,2,8,1,1,1],[8,3,7,1,1,1],[4,3,8,1,1,1],[4,0,9,1,1,1],[9,0,5,1,1,1],[5,1,9,1,1,1],[9,1,6,1,1,1],[6,2,9,1,1,1],[9,2,7,1,1,1],[7,3,9,1,1,1],[9,3,4,1,1,1]]},"ade76":{"V":[[0.0,1.866,0.6359],[-0.5,0.0,-0.0641],[-3.7321,-1.866,-0.0641],[0.0,-0.866,-0.0641],[3.7321,-1.866,-0.0641],[0.5,0.0,-0.0641],[0.0,-1.0,-0.6359]],"T":[[0,1,5,1,1,1],[5,1,2,1,1,0],[5,2,3,0,1,0],[3,4,5,1,1,0],[3,2,6,1,1,1],[3,6,4,1,1,1],[1,0,6,1,1,0],[6,2,1,1,1,0],[6,0,5,1,1,0],[6,5,4,0,1,1]]},"ade67":{"V":[[-3.0,0.0,-0.06],[3.0,-0.45,-0.06],[1.0,0.0,-0.06],[3.0,0.45,-0.06],[1.4725,-0.3697,0.06],[1.4725,0.3697,0.06]],"T":[[0,3,2,1,1,0],[2,1,0,1,1,0],[0,1,4,1,1,1],[0,4,5,1,1,1],[0,5,3,1,1,1],[1,2,4,1,1,1],[5,4,2,1,1,1],[3,5,2,1,1,1]]},"q":{"V":[[3.0,1.6154,-0.2308],[-3.0,-1.6154,-0.2308],[1.1538,0.2308,-0.2308],[-0.2308,-0.2308,-0.2308],[1.1538,0.6923,0.2308]],"T":[[3,2,1,1,1,0],[3,1,0,0,1,1],[4,0,1,1,1,1],[4,1,2,1,1,1],[4,2,3,1,1,1],[4,3,0,1,1,1]]},"cf7":{"V":[[1.7143,0.8571,2.1429],[2.1429,0.4286,3.0],[0.4286,1.7143,-3.0],[-0.4286,-0.4286,-0.4286],[-2.1429,-1.7143,-1.7143],[0.0,-0.4286,0.4286],[0.8571,0.4286,0.8571]],"T":[[0,4,5,1,1,1],[0,5,6,1,1,1],[4,0,6,1,1,0],[6,3,4,1,1,0],[2,1,5,1,1,0],[5,3,2,1,1,0],[1,2,6,1,1,1],[1,6,5,1,1,1],[2,3,6,1,1,1],[3,5,4,1,1,1]]},"t7":{"V":[[-0.3,0.0,-0.6],[2.1,0.0,-1.2],[-2.7,1.2,-1.2],[-1.5,3.0,3.0],[2.7,-3.0,-3.0],[-0.9,0.6,0.0],[0.3,0.0,-0.6]],"T":[[6,0,1,1,1,1],[6,1,2,1,1,1],[5,4,3,1,1,1],[6,3,4,1,1,1],[5,0,4,1,1,1],[6,4,0,1,1,1],[2,1,0,1,1,1],[0,5,2,1,1,1],[6,2,5,1,1,1],[5,3,6,1,1,1]]},"on7":{"V":[[-1.1332,0.886,0.1969],[-1.9497,-0.7376,0.4651],[-4.1786,1.3282,-0.1066],[-1.1,-0.1738,0.1733],[-4.5278,-1.3282,-0.4729],[4.5278,0.0155,-0.4219],[0.6471,-0.6566,0.4729]],"T":[[5,4,0,1,1,1],[6,5,0,1,1,1],[0,4,3,1,1,0],[3,6,0,1,1,0],[1,2,3,1,1,0],[3,5,1,1,1,0],[6,2,1,1,1,1],[5,6,1,1,1,1],[6,3,2,1,1,1],[4,5,3,1,1,1]]},"tet":{"V":[[-1.6,-1.35,-0.8],[1.6,-1.35,-0.8],[-0.7,1.35,-0.8],[-0.1,-0.45,0.8]],"T":[[2,1,0,1,1,1],[0,1,3,1,1,1],[1,2,3,1,1,1],[3,2,0,1,1,1]]}};
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
  const SPIN = 2 * Math.PI / 12000;          // 自動で回る速さ（1 周 12 秒）
  const DRAG = 0.01, EL_MAX = 1.5;           // 1px のドラッグで回る角と、仰角の上限
  /* 面を奥から順に並べて返す */
  function order(M, cam) {
    const c = cam.c, r = cam.r, up = cam.up, items = [];
    M.T.forEach(function (t) {
      const pts = [M.V[t[0]], M.V[t[1]], M.V[t[2]]], n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
      if (dot(n, c) <= 1e-9) return;
      items.push({ pts: pts, n: n, edge: t.slice(3), xy: pts.map(function (p) { return [dot(p, r), dot(p, up)]; }), behind: [], wait: 0 });
    });
    function height(it, x, y) { return (dot(it.n, it.pts[0]) - x * dot(it.n, r) - y * dot(it.n, up)) / dot(it.n, c); }
    items.forEach(function (a, i) {
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j], o = clip(a.xy, b.xy);
        if (o.length < 3 || Math.abs(area(o)) < 1e-7) continue;
        const x = o.reduce(function (s, p) { return s + p[0]; }, 0) / o.length, y = o.reduce(function (s, p) { return s + p[1]; }, 0) / o.length;
        const back = height(a, x, y) < height(b, x, y) ? a : b, front = back === a ? b : a;
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
    if (sorted.length < items.length) {
      const depth = function (it) { return it.pts.reduce(function (s, p) { return s + dot(p, c); }, 0); };
      items.filter(function (it) { return sorted.indexOf(it) < 0; }).sort(function (a, b) { return depth(a) - depth(b); })
           .forEach(function (it) { sorted.push(it); });
    }
    return sorted;
  }
  /* 1 周させても、図の枠からはみ出ない大きさ */
  function fit(M, el, W, H) {
    let mx = 0, my = 0;
    for (let k = 0; k < 72; k++) {
      const cam = camera(k * Math.PI / 36, el);
      M.V.forEach(function (p) { mx = Math.max(mx, Math.abs(dot(p, cam.r))); my = Math.max(my, Math.abs(dot(p, cam.up))); });
    }
    return 0.98 * Math.min(W / 2 / mx, H / 2 / my);
  }
  /* 多面体 key（DATA の名前か、{ V, T } そのもの）を、カメラ cam・大きさ S で、原点が (ox, oy) に来るように group に描く（中を消してから）。
     lw は辺の線の太さ。M.dot があれば、その頂点に赤の点を打つ */
  function drawAt(group, key, cam, S, ox, oy, lw) {
    const M = typeof key === "string" ? DATA[key] : key, r = cam.r, up = cam.up;
    while (group.firstChild) group.removeChild(group.firstChild);
    order(M, cam).forEach(function (it) {
      const fill = shade(dot(it.n, r), dot(it.n, up)), Q = it.xy.map(function (q) { return [ox + S * q[0], oy - S * q[1]]; });
      mk("polygon", { points: Q.map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" "), fill: fill, stroke: fill, "stroke-width": 0.6, "stroke-linejoin": "round" }, group);
      Q.forEach(function (q, i) {
        if (!it.edge[i]) return;
        const n = Q[(i + 1) % 3];
        mk("line", { x1: q[0].toFixed(2), y1: q[1].toFixed(2), x2: n[0].toFixed(2), y2: n[1].toFixed(2), stroke: "#000", "stroke-width": lw, "stroke-linecap": "round" }, group);
      });
    });
    if (M.dot !== undefined) {
      const p = M.V[M.dot];
      mk("circle", { cx: (ox + S * dot(p, r)).toFixed(2), cy: (oy - S * dot(p, up)).toFixed(2), r: 5, style: "fill: var(--red)" }, group);
    }
  }
  /* 動いている図の今の向きと大きさ（svg の id ごと）。ほかのページの図が、この図から続けて動くときに使う（figs/q45.js） */
  const LIVE = {};
  /* still：ページの写し用（動かさない）。
     pop に別の多面体の名前を渡すと、同じスライドの目印（<span step class="pop-mark">）が出たとき、key の形から pop の形へ
     頂点を動かして変える（POP ミリ秒。2 つは頂点の数と並び、面が同じであること）。目印が消えたら、すぐ key の形に戻す */
  const POP = 900;
  function setup(svg, key, az, el, still, pop) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height"), group = mk("g", {}, svg);
    const A = DATA[key], M = pop ? { V: A.V.map(function (p) { return p.slice(); }), T: A.T } : A;
    let S = fit(A, el, W, H);
    function draw() { drawAt(group, M, camera(az, el), S, W / 2, H / 2, 1); }
    /* key の形と pop の形の間（t = 0〜1）の形にする */
    function shape(t) {
      const B = DATA[pop], k = ease(t);
      A.V.forEach(function (p, i) { M.V[i] = p.map(function (x, j) { return x + (B.V[i][j] - x) * k; }); });
    }
    const popMark = pop ? svg.closest("slide").querySelector(".pop-mark") : null;
    if (pop) shape(popMark.classList.contains("on") ? 1 : 0);
    draw();
    if (still) return;
    if (pop) follow(popMark, function (t) { shape(t); draw(); }, POP, 0);
    LIVE[svg.id] = function () { return { az: az, el: el, S: S }; };
    const page = svg.closest(".page"), mark = svg.closest("[step]");
    function shown() { return !mark || mark.classList.contains("on"); }
    let last = 0, held = false, moved = false, px = 0, py = 0;
    function frame(time) {
      const dt = last ? Math.min(time - last, 100) : 0;
      last = time;
      if (!held && shown() && page.classList.contains("on")) { az += SPIN * dt; draw(); }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    svg.addEventListener("pointerdown", function (e) {
      if (!shown()) return;
      held = true; moved = false; px = e.clientX; py = e.clientY;
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function (e) {
      if (!held) return;
      const x = e.clientX - px, y = e.clientY - py;
      if (!moved && Math.hypot(x, y) < 4) return;
      moved = true; px = e.clientX; py = e.clientY;
      az -= x * DRAG;
      el = Math.max(-EL_MAX, Math.min(EL_MAX, el + y * DRAG));
      S = fit(A, el, W, H);
      draw();
    });
    function release() { held = false; }
    svg.addEventListener("pointerup", release);
    svg.addEventListener("pointercancel", release);
    /* ドラッグのあとのクリックでは、ページを送らない */
    svg.addEventListener("click", function (e) { if (moved) { moved = false; e.stopPropagation(); } });
  }
  return {
    setup: setup, drawAt: drawAt,
    live: function (id) { return LIVE[id] ? LIVE[id]() : null; },
    data: function (key) { return DATA[key]; }
  };
})();
figure("model-ll8", function (svg, still) { MODELS.setup(svg, "ll8", 1.2, 0.5, still); });
figure("model-ll10", function (svg, still) { MODELS.setup(svg, "ll10", -0.6, 0.9, still); });
figure("model-ade76", function (svg, still) { MODELS.setup(svg, "ade76", 1.2, 0.5, still); });
figure("model-ade67", function (svg, still) { MODELS.setup(svg, "ade67", 1.2, 0.5, still); });
figure("res-cf7", function (svg, still) { MODELS.setup(svg, "cf7", 3.6, 0.6, still); });
figure("res-t7", function (svg, still) { MODELS.setup(svg, "t7", 5, 0.3, still); });
figure("res-q", function (svg, still) { MODELS.setup(svg, "q", 0.3, 0.6, still); });
figure("model-on7", function (svg, still) { MODELS.setup(svg, "on7", 0.5, 0.35, still); });
figure("tet", function (svg, still) { MODELS.setup(svg, "tet", 1.2, 0.8, still); });
figure("model-icopop", function (svg, still) { MODELS.setup(svg, "ico", 0.3, 0.45, still, "icod"); });
figure("model-v7", function (svg, still) { MODELS.setup(svg, "v7", 0.3, 0.5, still); });
figure("end-q", function (svg, still) { MODELS.setup(svg, "q", 0.3, 0.6, still); });
figure("end-cf7", function (svg, still) { MODELS.setup(svg, "cf7", 3.6, 0.6, still); });
figure("end-t7", function (svg, still) { MODELS.setup(svg, "t7", 5, 0.3, still); });
figure("end-on7", function (svg, still) { MODELS.setup(svg, "on7", 0.5, 0.35, still); });
figure("end-dde20", function (svg, still) { MODELS.setup(svg, "dde20", 0.4, 0.5, still); });
