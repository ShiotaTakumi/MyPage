/* ===== 第 41 回 OSME-J のスライドの図：14 枚目の、パス状の部分展開図の削減（figs/enum.js の build・hull を使う）===== */
/* 補助資料サイトの図 5〜7 と同じ例で、3 つの削減を見せる。面の色と帯の描き方は 11〜13 枚目と同じ。字は書かない。
   14 枚目（包含と合同。軽く流す）と 14 枚目（AABB。ちゃんと説明する）に分けた。
     14 枚目の上（包含関係による削減）：SBSBS（n = 12、h = 1、ℓ0 = 1、p1 = 1、d1 = +1、p2 = 11、d2 = −1）。左に伸ばす前（ℓ1 = 2、ℓ2 = 2）、
       右に伸ばしきった（極大な）形（ℓ1 = 5、ℓ2 = 6。残りの側面 1〜11 を使い切る。はじめから出しておく）。クリックで 1 段ずつ：左の帯を S1・S2 交互に
       1 枚ずつ伸ばして止める（伸ばした面は橙）→ 左の伸ばしきった形の外枠だけを右へ滑らせて重ねる →
       橙の面と外枠を消して、真ん中に「⊂」を出す（伸ばす前の形 ⊂ 伸ばしきった形）→ 左に赤の × （ラベルは書かない。
       どの途中も Invalid でなく、最後はどちらにも 1 枚も伸ばせないことを確かめた）
     14 枚目の下（合同なものの削減）：包含の動きが終わるまで出さない（目印 .rd-cong-show で出す）。サイトの図 6 の (a) と (d)
       （SBSBS、n = 12、h = 1）。(d) は (a) の 2 つの底面を入れ替え、ラベルの向きも逆にしたもので、(a) を S0 の真ん中のまわりに左右・上下とも
       反転した形（計算で確かめた）。クリック（目印 .rd-cong-mark）で、(a) の写し（橙の縁）が左右、上下と裏返りながら右へ動き、(d) にぴったり重なる。
       次のクリック（目印 .rd-cong-x）で、写しを消し、右の (d) に赤の × を出す（包含と同じ）
     14 枚目（AABB を用いた削減）：サイトの図 7 の候補（SBSBS、n = 20、ℓ0 = 1、p1 = 2、d1 = −1、ℓ1 = 2、p2 = 4、d2 = −1、ℓ2 = 2）と、BSBS の候補（下の SEP）を切り替える（はじめは BSBS）。
       両端の面 S1・S2 と、その AABB（座標軸に平行な外接長方形。薄い灰色の地に点線）を描く（形はサイトの図 7 に寄せた）。
       図は、回した後の外接長方形を枠いっぱいに描き、左下に座標軸の印を置く（面のラベルと B・S の字は書かない）。バーで k と h を手で変える：
       k は、座標系を kα/2 だけ反時計回りに回す（図では、展開図を時計回りに回して見せる）。k = 2・12・22・32 で、どの h でも x か y の範囲が離れる
       （サイトの図 7 と同じ） */
var REDUCE = (function () {
  const f = function (v) { return v.toFixed(2); };
  const avg = function (Q) { return [Q.reduce(function (s, q) { return s + q[0]; }, 0) / Q.length, Q.reduce(function (s, q) { return s + q[1]; }, 0) / Q.length]; };
  const flat = function (L) { return [].concat.apply([], L); };
  const facePts = function (S) { return flat(S.map(function (G) { return G.pts; })); };

  /* 展開図 F を、点を図の上へ移す関数 at で、親 g に描く。底面と帯（1 つの長方形と、中の側面の境目の破線） */
  function paint(g, F, at, cls) {
    const pts = function (Q) { return Q.map(function (p) { return at(p).map(f).join(","); }).join(" "); };
    F.bases.forEach(function (B) { mk("polygon", { class: cls || "pat-base", points: pts(B.pts) }, g); });
    return F.bands.map(function (S) {
      if (!S.length) return null;
      const Q = ENUM.hull(facePts(S));
      mk("polygon", { class: cls || "pat-band", points: pts(Q) }, g);
      if (!cls) S.slice(0, -1).forEach(function (G, i) {
        mk("polyline", { class: "pat-fold", points: pts(G.pts.filter(function (_, j) { return S[i + 1].ids.indexOf(G.ids[j]) >= 0; })) }, g);
      });
      return Q;
    });
  }
  let clips = 0;
  const clipped = function (svg) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height"), cid = "rd-clip-" + (++clips);
    mk("rect", { x: 0, y: 0, width: W, height: H }, mk("clipPath", { id: cid }, mk("defs", {}, svg)));
    return mk("g", { "clip-path": "url(#" + cid + ")" }, svg);
  };

  /* ---- 14 枚目の上：包含関係による削減 ---- */
  const INCL = { pat: "sbsbs", n: 12, h: 1, l0: 1, p1: 1, d1: 1, p2: 11, d2: -1 };
  /* 帯の長さ (ℓ1, ℓ2) の並び：S1 と S2 を交互に 1 枚ずつ伸ばし、残りの側面 1〜11 を使い切ったところ（5, 6）で止まる */
  const GROW = [[2, 2], [3, 2], [3, 3], [4, 3], [4, 4], [5, 4], [5, 5], [5, 6]];
  function incl(svg, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height"), half = W / 2;
    const states = GROW.map(function (l) { return ENUM.build(Object.assign({}, INCL, { l1: l[0], l2: l[1] })); });
    const last = states[states.length - 1];
    /* 向き：伸ばしきった形が、半分の枠にいちばん大きく入るように回す（1° きざみで探す）。見せる範囲はその全体（余白 0.3） */
    const pts0 = flat([last.bases[0].pts, last.bases[1].pts, facePts(flat(last.bands))]);
    const turn = function (th) { const c = Math.cos(th), sn = Math.sin(th); return function (p) { return [c * p[0] + sn * p[1], -sn * p[0] + c * p[1]]; }; };
    const fit = function (P) {
      const xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
      return Math.min((half - 16) / (Math.max.apply(null, xs) - Math.min.apply(null, xs) + 0.6), H / (Math.max.apply(null, ys) - Math.min.apply(null, ys) + 0.6));
    };
    let best = 0;
    for (let d = 1; d < 180; d++) if (fit(pts0.map(turn(d * Math.PI / 180))) > fit(pts0.map(turn(best * Math.PI / 180)))) best = d;
    const rot = turn(best * Math.PI / 180), all = pts0.map(rot), k = fit(all);
    const mx = (Math.min.apply(null, all.map(function (p) { return p[0]; })) + Math.max.apply(null, all.map(function (p) { return p[0]; }))) / 2;
    const my = (Math.min.apply(null, all.map(function (p) { return p[1]; })) + Math.max.apply(null, all.map(function (p) { return p[1]; }))) / 2;
    const atIn = function (cx) { return function (p) { const q = rot(p); return [cx + k * (q[0] - mx), H / 2 - k * (q[1] - my)]; }; };
    const atL = atIn(half / 2), atR = atIn(half + half / 2);
    const pts = function (Q, at) { return Q.map(function (p) { return at(p).map(f).join(","); }).join(" "); };
    /* 展開図 F を描く。帯 S1・S2 のうち、はじめの長さ（2 枚）より先の側面（伸ばした面）は橙に */
    function shape(g, F, at) {
      F.bases.forEach(function (B) { mk("polygon", { class: "pat-base", points: pts(B.pts, at) }, g); });
      F.bands.forEach(function (S, i) {
        const n0 = i === 0 ? S.length : GROW[0][i - 1];
        if (S.length > n0) mk("polygon", { class: "rd-ext", points: pts(ENUM.hull(facePts(S.slice(n0))), at) }, g);
        mk("polygon", { class: "pat-band", points: pts(ENUM.hull(facePts(S.slice(0, n0))), at) }, g);
        S.slice(0, -1).forEach(function (G, j) {
          mk("polyline", { class: j + 1 >= n0 ? "rd-ext-fold" : "pat-fold", points: pts(G.pts.filter(function (_, m) { return S[j + 1].ids.indexOf(G.ids[m]) >= 0; }), at) }, g);
        });
      });
    }
    /* クリックで 1 段ずつ（右の伸ばしきった形は、はじめから出しておく）：
         .rd-incl-mark：左の帯を 1 枚ずつ伸ばし、伸ばしきったところで止める（tg：0〜1。0.3 秒）
         .rd-incl-ovl：左の伸ばしきった形の外枠だけを、右へ滑らせて右の形に重ねる（ts：0〜1。0.25 秒）
         .rd-incl-sub：左の橙の面と、重ねた外枠を消し（左は伸ばす前の形に戻る）、真ん中に「⊂」を出す（どれも 41OSME-J.css で出し入れする）
         .rd-incl-x：左の伸ばす前の形に、赤の × を一度に出す（除く、という意味。41OSME-J.css） */
    let tg = 0, ts = 0;
    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const step = Math.min(GROW.length - 1, Math.floor(tg * (GROW.length - 1) + 1e-9));
      shape(mk("g", {}, svg), states[step], atL);
      paint(mk("g", {}, svg), last, atR);
      txt(f(half), f(H / 2), "⊂", { class: "rd-subset", "text-anchor": "middle", dy: "0.35em" }, svg);
      /* 左の伸ばす前の形を覆う × （外接長方形の対角線。線の太さの分だけ、図の枠の内側に収める） */
      const P0 = flat([states[0].bases[0].pts, states[0].bases[1].pts, facePts(flat(states[0].bands))]).map(atL);
      const bx0 = Math.max(6, Math.min.apply(null, P0.map(function (p) { return p[0]; }))), bx1 = Math.min(half - 6, Math.max.apply(null, P0.map(function (p) { return p[0]; })));
      const by0 = Math.max(6, Math.min.apply(null, P0.map(function (p) { return p[1]; }))), by1 = Math.min(H - 6, Math.max.apply(null, P0.map(function (p) { return p[1]; })));
      const x = mk("g", { class: "rd-cross" }, svg);
      mk("line", { x1: f(bx0), y1: f(by0), x2: f(bx1), y2: f(by1) }, x);
      mk("line", { x1: f(bx1), y1: f(by0), x2: f(bx0), y2: f(by1) }, x);
      if (ts <= 0) return;
      const g = mk("g", { transform: "translate(" + f(half * ease(ts)) + ",0)", class: "rd-outline" }, svg);
      last.bases.forEach(function (B) { mk("polygon", { points: pts(B.pts, atL) }, g); });
      last.bands.forEach(function (S) { if (S.length) mk("polygon", { points: pts(ENUM.hull(facePts(S)), atL) }, g); });
    }
    const fig = svg.closest("figure"), mGrow = fig.querySelector(".rd-incl-mark"), mOvl = fig.querySelector(".rd-incl-ovl");
    if (still) { tg = mGrow.classList.contains("on") ? 1 : 0; ts = mOvl.classList.contains("on") ? 1 : 0; draw(); return; }
    draw();
    follow(mGrow, function (t) { tg = t; draw(); }, 300, 300);     // 伸ばすのも、戻すのと同じ 0.3 秒
    follow(mOvl, function (t) { ts = t; draw(); }, 250, 250);     // 外枠はすばやく
  }

  /* ---- 14 枚目の下：合同なものの削減 ---- */
  /* (a) と、右の (d)（2 つの底面を入れ替え、ラベルの向きも逆にした候補。(a) を S0 の真ん中のまわりに左右・上下とも反転した形。
     計算で確かめた。左右だけの反転よりも面白いので、こちらにした） */
  const CONG = [{ pat: "sbsbs", n: 12, h: 1, l0: 1, p1: 3, d1: 1, l1: 2, p2: 7, d2: -1, l2: 3 },
                { pat: "sbsbs", n: 12, h: 1, l0: 1, p1: 5, d1: 1, l1: 3, p2: 9, d2: -1, l2: 2 }];
  function cong(svg, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    const A = ENUM.build(CONG[0]), B = ENUM.build(CONG[1]);
    const ca = avg(A.bands[0][0].pts), cb = avg(B.bands[0][0].pts);
    /* 左右の半分に 1 つずつ。S0 の真ん中を、半分の真ん中に置く（反転の中心） */
    const pa = flat([A.bases[0].pts, A.bases[1].pts, facePts(flat(A.bands))]);
    const k = Math.min((W / 2 - 16) / (2 * Math.max.apply(null, pa.map(function (p) { return Math.abs(p[0] - ca[0]); }))),
                       (H - 8) / (2 * Math.max.apply(null, pa.map(function (p) { return Math.abs(p[1] - ca[1]); }))));
    const L = [W / 4, H / 2], R = [3 * W / 4, H / 2];
    const atA = function (p) { return [L[0] + k * (p[0] - ca[0]), L[1] - k * (p[1] - ca[1])]; };
    const atB = function (p) { return [R[0] + k * (p[0] - cb[0]), R[1] - k * (p[1] - cb[1])]; };
    function draw(t) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      paint(mk("g", {}, svg), A, atA);
      paint(mk("g", {}, svg), B, atB);
      /* 右の候補を覆う × （外接長方形の対角線。図の枠の内側に収める。.rd-cong-x で、写しを消し、一度に出す。41OSME-J.css） */
      const PB = flat([B.bases[0].pts, B.bases[1].pts, facePts(flat(B.bands))]).map(atB);
      const bx0 = Math.max(W / 2 + 6, Math.min.apply(null, PB.map(function (p) { return p[0]; }))), bx1 = Math.min(W - 6, Math.max.apply(null, PB.map(function (p) { return p[0]; })));
      const by0 = Math.max(6, Math.min.apply(null, PB.map(function (p) { return p[1]; }))), by1 = Math.min(H - 6, Math.max.apply(null, PB.map(function (p) { return p[1]; })));
      const x = mk("g", { class: "rd-cross rd-cross-cong" }, svg);
      mk("line", { x1: f(bx0), y1: f(by0), x2: f(bx1), y2: f(by1) }, x);
      mk("line", { x1: f(bx1), y1: f(by0), x2: f(bx0), y2: f(by1) }, x);
      if (t <= 0) return;
      /* (a) の写し：右へ動きながら、前半で左右に（横の倍率 cos 2πt）、後半で上下に（縦の倍率）裏返る。t = 1 で右の候補に重なる */
      const sx = Math.cos(Math.PI * Math.min(1, 2 * t)), sy = Math.cos(Math.PI * Math.max(0, 2 * t - 1));
      const c = mk("g", { class: "rd-cong-copy", transform: "translate(" + f(L[0] + (R[0] - L[0]) * t) + "," + f(L[1]) + ") scale(" + sx.toFixed(4) + "," + sy.toFixed(4) + ") translate(" + f(-L[0]) + "," + f(-L[1]) + ")" }, svg);
      paint(c, A, atA, "rd-copy");
    }
    const mark = svg.closest("figure").querySelector(".rd-cong-mark");
    if (still) { draw(mark.classList.contains("on") ? 1 : 0); return; }
    draw(0);
    follow(mark, draw, 600, 300);     // 裏返して重ねる動きは 0.6 秒
  }

  /* ---- 14 枚目の下：AABB を用いた削減 ---- */
  /* 候補はサイトの図 7 と同じ（SBSBS、n = 20）。座標系を K · α/2 回すと、どの h でも両端の面の AABB の範囲が離れる（サイトの図 7 の k = 2）。
     左の半分に候補と AABB を描き、右の半分に字（41OSME-J.html）。クリック（目印 .rd-aabb-x）で赤の × （41OSME-J.css） */
  const SEP = { pat: "sbsbs", n: 20, h: 1, l0: 1, p1: 2, d1: -1, l1: 2, p2: 4, d2: -1, l2: 2 }, K = 2;
  function aabb(svg) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height"), half = W / 2;
    const F = ENUM.build(SEP), th = K * Math.PI / SEP.n, c = Math.cos(th), s = Math.sin(th);
    const rot = function (p) { return [c * p[0] + s * p[1], -s * p[0] + c * p[1]]; };
    const all = flat([F.bases[0].pts, F.bases[1].pts, facePts(flat(F.bands))]).map(rot);
    const x0 = Math.min.apply(null, all.map(function (p) { return p[0]; })), x1 = Math.max.apply(null, all.map(function (p) { return p[0]; }));
    const y0 = Math.min.apply(null, all.map(function (p) { return p[1]; })), y1 = Math.max.apply(null, all.map(function (p) { return p[1]; }));
    const k = Math.min((half - 90) / (x1 - x0), (H - 12) / (y1 - y0)), dx = half / 2 - k * (x0 + x1) / 2, dy = H / 2 + k * (y0 + y1) / 2;
    const at = function (p) { const q = rot(p); return [dx + k * q[0], dy - k * q[1]]; };
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const g = clipped(svg), rects = paint(g, F, at);
    /* 両端の面の AABB（回した座標系で、座標軸に平行な外接長方形。薄い灰色の地に点線） */
    [rects[1], rects[2]].forEach(function (Q) {
      const P = Q.map(at), xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
      const bx0 = Math.min.apply(null, xs), by0 = Math.min.apply(null, ys);
      mk("rect", { class: "rd-box", x: f(bx0), y: f(by0), width: f(Math.max.apply(null, xs) - bx0), height: f(Math.max.apply(null, ys) - by0) }, g);
    });
    /* 左下に、座標軸の印（x が右、y が上） */
    const ax = mk("g", { class: "rd-axes", transform: "translate(10," + (H - 12) + ")" }, svg);
    mk("polyline", { points: "28,0 0,0 0,-28" }, ax);
    mk("polygon", { points: "34,0 26,-4 26,4" }, ax);
    mk("polygon", { points: "0,-34 -4,-26 4,-26" }, ax);
    txt(36, 4, "x", { class: "rd-axis-name" }, ax);
    txt(3, -34, "y", { class: "rd-axis-name" }, ax);
    /* 候補を覆う × */
    const P = all.map(function (p) { return [dx + k * p[0], dy - k * p[1]]; });
    const bx0 = Math.max(6, Math.min.apply(null, P.map(function (p) { return p[0]; }))), bx1 = Math.min(half - 6, Math.max.apply(null, P.map(function (p) { return p[0]; })));
    const by0 = Math.max(6, Math.min.apply(null, P.map(function (p) { return p[1]; }))), by1 = Math.min(H - 6, Math.max.apply(null, P.map(function (p) { return p[1]; })));
    const x = mk("g", { class: "rd-cross rd-cross-aabb" }, svg);
    mk("line", { x1: f(bx0), y1: f(by0), x2: f(bx1), y2: f(by1) }, x);
    mk("line", { x1: f(bx1), y1: f(by0), x2: f(bx0), y2: f(by1) }, x);
  }

  return { incl: incl, cong: cong, aabb: aabb };
})();
figure("rd-incl", REDUCE.incl);
figure("rd-cong", REDUCE.cong);
figure("rd-aabb", REDUCE.aabb);

/* 15 枚目：n = 3〜10 の ③ の列（それぞれの表の、その列のところから。2 枚を左右に並べる）と、n = 25 の行（表の中の位置から）を、
   びよーんと伸ばして真ん中に大きく出す・引っ込める。
   大きく出た形と、出ているかどうかは CSS（41OSME-J.css の .rd-pop）で決まる。ここでは、同じページの中のクリックのときだけ、
   表の中の出どころ（クリックのときに測る）と大きく出た形の間を動かす。ページを移ったときは動かさない */
(function () {
  const OPEN = 650, CLOSE = 350;
  /* 表の n = 3〜10 の ③ の列に収まる位置と大きさ（0 の表）。大きく出た形の、スライドの真ん中からのずれで表す */
  function inColumn(pop, table) {
    const slide = pop.closest("slide"), sr = slide.getBoundingClientRect(), k = sr.width / slide.offsetWidth;
    const a = table.querySelector("tbody tr:first-child td:last-child").getBoundingClientRect();
    const z = table.querySelector("tbody tr:nth-child(8) td:last-child").getBoundingClientRect();
    const x = ((a.left + a.right) / 2 - sr.left) / k - slide.offsetWidth / 2, y = ((a.top + z.bottom) / 2 - sr.top) / k - slide.offsetHeight / 2;
    return "translate(-50%, -50%) translate(" + x + "px, " + y + "px) scale(" + (z.bottom - a.top) / k / pop.offsetHeight + ")";
  }
  /* 表の中の 25 の行にぴったり重なる位置（大きさは表と同じ）。大きく出た形の、スライドの真ん中からのずれで表す */
  function inTable(pop, row) {
    const slide = pop.closest("slide"), sr = slide.getBoundingClientRect(), k = sr.width / slide.offsetWidth;
    const pr = pop.getBoundingClientRect(), q = pr.width / pop.offsetWidth / k;     /* 大きく出た形の倍率（ステージの拡大縮小を除く） */
    const tr = pop.querySelector("tbody tr").getBoundingClientRect(), rr = row.getBoundingClientRect();
    /* 吹き出しの中で、25 の行の左上が、吹き出しの左上からどれだけ離れているか（倍率を除く） */
    const ox = (tr.left - pr.left) / k / q, oy = (tr.top - pr.top) / k / q;
    const x = (rr.left - sr.left) / k - ox + pop.offsetWidth / 2 - slide.offsetWidth / 2;
    const y = (rr.top - sr.top) / k - oy + pop.offsetHeight / 2 - slide.offsetHeight / 2;
    return "translate(-50%, -50%) translate(" + x + "px, " + y + "px)";
  }
  function start() {
    document.querySelectorAll(".rd-pop-b-mark").forEach(function (mb) {
      const slide = mb.closest("slide");
      if (mb.closest(".side, .print")) return;
      const ms = slide.querySelector(".rd-pop-s-mark"), mz = slide.querySelector(".rd-zero-mark"), mt = slide.querySelector(".rd-sum-mark");
      const pops = { zb: slide.querySelector(".rd-pop-zb"), zs: slide.querySelector(".rd-pop-zs"),
                     b: slide.querySelector(".rd-pop-b"), s: slide.querySelector(".rd-pop-s") };
      const tables = [].slice.call(slide.querySelectorAll(".rd-counts table"));
      /* 大きく出た形（CSS で決めたもの。出る前・引っ込んだ後も、見えないだけで同じ形）と、表の中の出どころ */
      const big = function (key) { return getComputedStyle(pops[key]).transform; };
      const small = function (key) {
        return key === "zb" || key === "zs" ? inColumn(pops[key], tables[key === "zb" ? 0 : 1])
                                            : inTable(pops[key], tables[key === "b" ? 0 : 1].querySelector("tbody tr:last-child"));
      };
      /* 今出ているもの（4 クリック目で合計を出すときは、どれも引っ込める） */
      const want = function () {
        return mt.classList.contains("on") ? [] : ms.classList.contains("on") ? ["s"] : mb.classList.contains("on") ? ["b"] : mz.classList.contains("on") ? ["zb", "zs"] : [];
      };
      let cur = want();
      function update(on, moved) {
        const t = want();
        if (!moved) {
          cur.filter(function (key) { return t.indexOf(key) < 0; }).forEach(function (key) {
            pops[key].animate([{ transform: big(key), opacity: 1 }, { transform: small(key), opacity: 0 }], { duration: CLOSE, easing: "ease-in" });
          });
          /* 出どころが見えるように、小さいうちにすぐ見えるようにし、ゆっくり動き出してから伸ばす。最後に少し行き過ぎてから戻る */
          t.filter(function (key) { return cur.indexOf(key) < 0; }).forEach(function (key) {
            pops[key].animate([{ transform: small(key), opacity: 0, offset: 0 }, { opacity: 1, offset: .08 }, { transform: big(key), opacity: 1, offset: 1 }],
                              { duration: OPEN, easing: "cubic-bezier(.5, 0, .3, 1.3)" });
          });
        }
        cur = t;
      }
      watchStep(mz, update);
      watchStep(mb, update);
      watchStep(ms, update);
      watchStep(mt, update);
    });
  }
  document.addEventListener("DOMContentLoaded", start);
})();
