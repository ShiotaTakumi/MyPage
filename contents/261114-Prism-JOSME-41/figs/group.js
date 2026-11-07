/* ===== 第 41 回 OSME-J のスライドの図：16 枚目の、パス状の部分展開図のグループ化（figs/enum.js の build・hull を使う）===== */
/* 3 段階の削減のあとに残る BSBS の候補 55 個を、n = 11〜25 の列に小さく並べる（各列の上に n。列の中は族の番号の順）。
   候補は、補助資料サイトの表 4 の 8 族（パラメータと n の範囲）から作る。族の n の範囲の長さの和は 55 で、
   n ごとの数も 15 枚目の表の ③ と同じ。面の色と帯の描き方は 11〜14 枚目と同じ。h = 1。
   クリック（目印 .gp-pick）で、族 2（ℓ0 = 1、p2 = 3、d2 = −1、ℓ2 = 3、14 ≤ n ≤ 25。パラメータがすべて定数）の 12 個が、
   それぞれの位置からびよーんと伸びて、真ん中に大きく並ぶ（1 段 4 個）。ほかは薄くする→
   12 個すべてに、S0 と S2 の側面の番号（0 と 3, 2, 1）を書く（目印 .gp-lab。ℓ0・p2・d2・ℓ2 が図のどこに当たるかを見せる）。式は、1 個を大きく出した次のクリックで出し、それを戻しても残す→
   次の目印（.gp-pick2）で、族 2 が引っ込み、族 5（ℓ0 = 2、p2 = n − 3、d2 = +1、ℓ2 = 3、21 ≤ n ≤ 25。原稿の図とサイトの図 8 の例）の 5 個が同じように出る
   （1 段 3 個）→ 式。はじめ族 5 だけにしたら「1 クリック目は 14〜25 のやつ。
   式は 41OSME-J.html に書き、41OSME-J.css で出す */
var GROUP = (function () {
  const f = function (v) { return v.toFixed(2); };
  const flat = function (L) { return [].concat.apply([], L); };
  const facePts = function (S) { return flat(S.map(function (G) { return G.pts; })); };
  /* サイトの表 4（パターン BSBS の族）。p2 が関数のものは n で表す */
  const FAM = [
    { l0: 1, p2: 2, d2: -1, l2: 2, n: [11, 25] },
    { l0: 1, p2: 3, d2: -1, l2: 3, n: [14, 25] },
    { l0: 1, p2: 4, d2: -1, l2: 4, n: [18, 25] },
    { l0: 2, p2: 4, d2: -1, l2: 3, n: [21, 25] },
    { l0: 2, p2: function (n) { return n - 3; }, d2: 1, l2: 3, n: [21, 25] },
    { l0: 1, p2: 5, d2: -1, l2: 5, n: [22, 25] },
    { l0: 2, p2: 5, d2: -1, l2: 4, n: [23, 25] },
    { l0: 2, p2: function (n) { return n - 4; }, d2: 1, l2: 4, n: [23, 25] }
  ];
  const PICKS = [1, 4];     // 大きく並べる族：族 2（すべて定数）→ 族 5（p2 = n − 3）。0 から数えた番号
  /* CSS の cubic-bezier(x1, y1, x2, y2) と同じ形の関数（x から t を二分法で求めて y を返す） */
  const bezier = function (x1, y1, x2, y2) {
    const at = function (a, b, t) { return 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t; };
    return function (x) {
      let lo = 0, hi = 1;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (at(x1, x2, m) < x) lo = m; else hi = m; }
      return at(y1, y2, (lo + hi) / 2);
    };
  };
  const OUT = bezier(.5, 0, .3, 1.3), SMOOTH = bezier(.4, 0, .2, 1);
  const NS = [];
  for (let n = 11; n <= 25; n++) NS.push(n);

  /* 候補 1 つの面（点はまだ図の上に移していない）。向きは 13 枚目と同じ横向き（B1 が左、S0、B2 が右） */
  function faces(fam, n) {
    const F = ENUM.build({ pat: "bsbs", n: n, h: 1, l0: fam.l0, p1: 0, d1: 1, l1: 0,
                           p2: typeof fam.p2 === "function" ? fam.p2(n) : fam.p2, d2: fam.d2, l2: fam.l2 });
    return F;
  }
  const allPts = function (F) { return flat([F.bases[0].pts, F.bases[1].pts, facePts(flat(F.bands))]); };
  const turn = function (th) { const c = Math.cos(th), s = Math.sin(th); return function (p) { return [c * p[0] + s * p[1], -s * p[0] + c * p[1]]; }; };
  const box = function (P) {
    const xs = P.map(function (p) { return p[0]; }), ys = P.map(function (p) { return p[1]; });
    return { x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) };
  };
  const TH = 0;

  /* 候補を、真ん中を原点にした向きそろえ済みの座標で、親 g に描く。返すのは幅と高さ。
     cut：帯 S2 の途中の 2 マス（2・3 枚目）を点線で描く（18 枚目の大きくした SBSBS-1。長く伸びた帯を 4 マスに縮めて見せる） */
  function shape(g, F, at0, cut) {
    const rot = turn(TH), b = box(allPts(F).map(rot)), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const at = at0 || function (p) { const q = rot(p); return [q[0] - cx, -(q[1] - cy)]; };     // at0：h を変えて描き直すとき、B1 を動かさないための決まった移し方
    const pts = function (Q) { return Q.map(function (p) { return at(p).map(function (v) { return v.toFixed(3); }).join(","); }).join(" "); };
    F.bases.forEach(function (B) { mk("polygon", { class: "pat-base", points: pts(B.pts) }, g); });
    F.bands.forEach(function (S, k) {
      if (!S.length) return;
      if (cut && k === 2) {
        S.forEach(function (G, i) { if (i === 1 || i === 2) mk("polygon", { class: "sb-omit", points: pts(G.pts) }, g); });
        S.forEach(function (G, i) { if (i !== 1 && i !== 2) mk("polygon", { class: "pat-band", points: pts(G.pts) }, g); });
        return;
      }
      mk("polygon", { class: "pat-band", points: pts(ENUM.hull(facePts(S))) }, g);
      S.slice(0, -1).forEach(function (G, i) {
        mk("polyline", { class: "pat-fold", points: pts(G.pts.filter(function (_, j) { return S[i + 1].ids.indexOf(G.ids[j]) >= 0; })) }, g);
      });
    });
    return { w: b.x1 - b.x0, h: b.y1 - b.y0, at: at };
  }
  /* 帯の側面の番号（S0 と S2 の各面の真ん中）を、親 g に描く（目印 .gp-lab で出す。41OSME-J.css）。
     g は倍率 k で大きく並べるので、字の大きさは 1/k 倍で書いて、大きく並べたときに決まった大きさになるようにする */
  function labels(g, F, at, k, cls) {
    const L = mk("g", { class: "gp-lab-t " + cls }, g);
    const mid = function (G) { const P = G.pts.map(at); return [P.reduce(function (a, q) { return a + q[0]; }, 0) / P.length, P.reduce(function (a, q) { return a + q[1]; }, 0) / P.length]; };
    [F.bands[0], F.bands[2]].forEach(function (S) {
      S.forEach(function (G) {
        const c = mid(G);
        mk("text", { x: c[0].toFixed(3), y: c[1].toFixed(3), "font-size": (11 / k).toFixed(4), "text-anchor": "middle", dy: "0.35em" }, L).textContent = String(G.side);
      });
    });
  }

  /* 括弧（{ の形）：P0 から P1 までに沿い、先が向き w（単位ベクトル）へ深さ d だけ出る。返すのは先の点 */
  function brace(g, P0, P1, w, d) {
    const L = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), u = [(P1[0] - P0[0]) / L, (P1[1] - P0[1]) / L], M = [(P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2];
    const at = function (P, s, t) { return [P[0] + w[0] * s + u[0] * t, P[1] + w[1] * s + u[1] * t]; };
    const pt = function (q) { return q.map(function (x) { return x.toFixed(2); }).join(","); };
    const r = Math.min(6, L / 6);
    mk("path", { class: "gp-call-brace", d: "M" + pt(P0) + " Q" + pt(at(P0, d / 2, 0)) + " " + pt(at(P0, d / 2, r)) + " L" + pt(at(M, d / 2, -r)) +
                 " Q" + pt(at(M, d / 2, 0)) + " " + pt(at(M, d, 0)) + " Q" + pt(at(M, d / 2, 0)) + " " + pt(at(M, d / 2, r)) +
                 " L" + pt(at(P1, d / 2, -r)) + " Q" + pt(at(P1, d / 2, 0)) + " " + pt(P1) }, g);
    return at(M, d, 0);
  }
  /* ズームした 1 個への書き込み（スライドの座標で描く。scr は面の点をスライドの座標へ移す関数）：
     S0 と S2 の側面の番号、B2 の辺の番号 0〜p2（S0 が付く辺が 0）、
     「長さ 1」（S0 の括弧）・「位置 3」（S2 が付く B2 の辺）・「向き −1」（S2 に沿った矢印）・「長さ 3」（S2 に沿った括弧） */
  function callouts(g, F, scr) {
    const mid = function (P) { return [P.reduce(function (a, q) { return a + q[0]; }, 0) / P.length, P.reduce(function (a, q) { return a + q[1]; }, 0) / P.length]; };
    const pt = function (q) { return q.map(function (x) { return x.toFixed(2); }).join(","); };
    const S0 = F.bands[0], S2 = F.bands[2], B2 = F.bases[1];
    const c2 = mid(B2.pts.map(scr));
    /* 字の四角の半分の幅と高さ（.gp-call-* は 24px）。reach は、半分の幅 w・高さ h の四角が、向き d へ張り出す長さ */
    const HH = 9, hw = function (s) { return 7 * String(s).length; };
    const reach = function (w, h, d) { return w * Math.abs(d[0]) + h * Math.abs(d[1]); };
    /* 側面の番号 */
    S0.concat(S2).forEach(function (G) { const c = mid(G.pts.map(scr)); txt(f(c[0]), f(c[1]), String(G.side), { class: "gp-call-side", "text-anchor": "middle", dy: "0.35em" }, g); });
    /* B2 の辺の番号（辺の真ん中から、B2 の中心へ少し入った所）。0 から p2 まで、近いほうの回り方で書く。
       p2 が n の半分より大きいとき（族 5 の p2 = n − 3 など）は、0, n − 1, n − 2, …, p2 と逆に回る */
    const p2 = S2[0].side, N = F.n, rev = p2 > N / 2, ks = [0];
    if (rev) for (let k = N - 1; k >= p2; k--) ks.push(k); else for (let k = 1; k <= p2; k++) ks.push(k);
    let e3 = null;
    ks.forEach(function (k) {
      const A = scr(B2.pts[k]), Bp = scr(B2.pts[(k + 1) % N]), m = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2];
      const d = Math.hypot(c2[0] - m[0], c2[1] - m[1]), nr = [(c2[0] - m[0]) / d, (c2[1] - m[1]) / d], o = reach(hw(k), HH, nr) + 5;
      const q = [m[0] + nr[0] * o, m[1] + nr[1] * o];
      txt(f(q[0]), f(q[1]), String(k), { class: "gp-call-edge" + (k === p2 ? " gp-call-hit" : ""), "text-anchor": "middle", dy: "0.35em" }, g);
      if (k === p2) e3 = q;
    });
    /* 「位置 3」：B2 の中へ引き出す。引き出し線は、辺の番号の四角の外から引く */
    const lead = function (to) {
      const l = Math.hypot(to[0] - e3[0], to[1] - e3[1]), d = [(to[0] - e3[0]) / l, (to[1] - e3[1]) / l], o = reach(hw(p2), HH, d) + 3;
      mk("line", { class: "gp-call-lead", x1: f(e3[0] + d[0] * o), y1: f(e3[1] + d[1] * o), x2: f(to[0]), y2: f(to[1]) }, g);
    };
    if (rev) {
      /* 逆に回ったときの「位置 18 = 21 − 3 = n − 3」（n は斜体）は、1 行では B2 をはみ出すので、2 行にして B2 の真ん中に置く */
      txt(f(c2[0]), f(c2[1] - 18), "位置 " + p2, { class: "gp-call-text", "text-anchor": "middle", dy: "0.35em" }, g);
      const t2 = mk("text", { x: f(c2[0]), y: f(c2[1] + 14), class: "gp-call-text", "text-anchor": "middle", dy: "0.35em" }, g);
      mk("tspan", {}, t2).textContent = "= " + N + " − " + (N - p2) + " = ";
      mk("tspan", { class: "gp-var" }, t2).textContent = "n";
      mk("tspan", {}, t2).textContent = " − " + (N - p2);
      lead([c2[0] - 30, c2[1] + 32]);
    } else {
      /* 字は、辺の番号から B2 の中心へ 45px 入った所から右へ書く */
      const ed = Math.hypot(c2[0] - e3[0], c2[1] - e3[1]), pos = [e3[0] + (c2[0] - e3[0]) / ed * 45, e3[1] + (c2[1] - e3[1]) / ed * 45];
      lead([pos[0] - 2, pos[1]]);
      txt(f(pos[0]), f(pos[1]), "位置 " + p2, { class: "gp-call-text", "text-anchor": "start", dy: "0.35em" }, g);
    }
    /* 「長さ 1」：S0 が B1 に接する辺（頂点 0 から ℓ0 まで。帯の長さの向き）に沿って、B1 の中に括弧を置き、その先に字
        */
    const c1 = mid(F.bases[0].pts.map(scr));
    const v0 = scr(S0[0].pts[S0[0].ids.indexOf(0)]), v1 = scr(S0[S0.length - 1].pts[S0[S0.length - 1].ids.indexOf(S0.length % N)]);
    const vm = [(v0[0] + v1[0]) / 2, (v0[1] + v1[1]) / 2], vd = Math.hypot(c1[0] - vm[0], c1[1] - vm[1]), w0 = [(c1[0] - vm[0]) / vd, (c1[1] - vm[1]) / vd];
    const tip0 = brace(g, [v0[0] + w0[0] * 5, v0[1] + w0[1] * 5], [v1[0] + w0[0] * 5, v1[1] + w0[1] * 5], w0, 10);
    txt(f(tip0[0] + w0[0] * 8), f(tip0[1] + w0[1] * 8), "長さ " + S0.length, { class: "gp-call-text", "text-anchor": w0[0] < 0 ? "end" : "start", dy: "0.35em" }, g);
    /* S2：帯の外側（B2 から遠い側）に、矢印（番号の進む向き）と、その外に括弧 */
    const a = mid(S2[0].pts.map(scr)), z = mid(S2[S2.length - 1].pts.map(scr));
    const len = Math.hypot(z[0] - a[0], z[1] - a[1]), u = [(z[0] - a[0]) / len, (z[1] - a[1]) / len];
    let v = [-u[1], u[0]];
    if ((a[0] - c2[0]) * v[0] + (a[1] - c2[1]) * v[1] < 0) v = [-v[0], -v[1]];
    const s2all = [].concat.apply([], S2.map(function (G) { return G.pts.map(scr); }));
    const half = Math.max.apply(null, s2all.map(function (q) { return (q[0] - a[0]) * v[0] + (q[1] - a[1]) * v[1]; }));     // 帯の真ん中の線から外側の辺まで
    const along = function (o, t) { return [a[0] + v[0] * o + u[0] * t, a[1] + v[1] * o + u[1] * t]; };
    const lo = Math.min.apply(null, s2all.map(function (q) { return (q[0] - a[0]) * u[0] + (q[1] - a[1]) * u[1]; }));
    const hi = Math.max.apply(null, s2all.map(function (q) { return (q[0] - a[0]) * u[0] + (q[1] - a[1]) * u[1]; }));
    const ar = half + 12, p0 = along(ar, 6), p1 = along(ar, len), hd = 9;
    mk("line", { class: "gp-call-arrow", x1: f(p0[0]), y1: f(p0[1]), x2: f(p1[0] - u[0] * hd), y2: f(p1[1] - u[1] * hd) }, g);
    mk("polygon", { class: "gp-call-head", points: [p1, [p1[0] - u[0] * hd * 1.6 + v[0] * hd * 0.7, p1[1] - u[1] * hd * 1.6 + v[1] * hd * 0.7],
                                                     [p1[0] - u[0] * hd * 1.6 - v[0] * hd * 0.7, p1[1] - u[1] * hd * 1.6 - v[1] * hd * 0.7]].map(pt).join(" ") }, g);
    /* 「向き」は、帯の端より外の、矢印の根元の側に書く（先の側は B1 に当たる） */
    const dl = along(ar, lo - reach(42, 12, u) - 8);
    txt(f(dl[0]), f(dl[1]), "向き " + (S2.length > 1 && S2[1].side === (S2[0].side + 1) % F.n ? "+1" : "−1"), { class: "gp-call-text", "text-anchor": "middle", dy: "0.35em" }, g);
    /* 括弧：帯の長さいっぱい（lo〜hi）に、矢印のさらに外側。先から「長さ 3」を外へ */
    const tip2 = brace(g, along(ar + 16, lo), along(ar + 16, hi), v, 10);
    const o2 = reach(34, 12, v) + 4;
    txt(f(tip2[0] + v[0] * o2), f(tip2[1] + v[1] * o2), "長さ " + S2.length, { class: "gp-call-text", "text-anchor": "middle", dy: "0.35em" }, g);
  }

  /* 8 族にまとめたときの場所（16 枚目の最後。17 枚目の始まりも同じ所から動かす）：4 列 × 2 段（族の番号の順）。
     各段で、いちばん高い絵（n = 25）の高さに合わせ、絵と名前をひとまとめにして段の上下の真ん中に置く。
     rep[k] は族 k の n = 25 の絵の大きさ（shape の返り値）。返すのは、族ごとの真ん中 x・y と、絵の枠の幅 w・高さ h、名前の基準の y（絵の下の端） */
  function piles(W, H, rep) {
    const PTOP = 14, PBOT = 10, PH = (H - PTOP - PBOT) / 2, PLAB = 68, cw = W / 4 - 28, ch = PH - PLAB - 10;
    const dh = [0, 0];
    rep.forEach(function (sz, k) { const r = Math.floor(k / 4); dh[r] = Math.max(dh[r], sz.h * Math.min(cw / sz.w, ch / sz.h)); });
    return rep.map(function (sz, k) {
      const c = k % 4, r = Math.floor(k / 4), y = PTOP + r * PH + (PH - dh[r] - PLAB) / 2 + dh[r] / 2;
      return { x: (c + 0.5) * W / 4, y: y, w: cw, h: dh[r], yb: y + dh[r] / 2 };
    });
  }
  /* 族の名前と n の範囲・個数（16 枚目の最後と同じ書き方） */
  function pileLabel(g, k, P) {
    const fam = FAM[k], cnt = fam.n[1] - fam.n[0] + 1;
    txt(f(P.x), f(P.yb + 30), "BSBS-" + (k + 1), { class: "gp-pile-name", "text-anchor": "middle" }, g);
    const t = mk("text", { x: f(P.x), y: f(P.yb + 59), class: "gp-pile-range", "text-anchor": "middle" }, g);
    mk("tspan", {}, t).textContent = fam.n[0] + " ≤ ";
    mk("tspan", { class: "gp-var" }, t).textContent = "n";
    mk("tspan", {}, t).textContent = " ≤ " + fam.n[1] + "（" + cnt + " 個）";
  }

  function grid(svg, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    const HEAD = 30, CW = W / NS.length, ROWS = 8, CH = (H - HEAD) / ROWS, PAD = 3;
    /* 大きく並べる m 個の枠：横長の形なので、m ≤ 6 なら 1 段 3 個、それより多ければ 1 段 4 個で、段を中央にそろえる。
       上は n の数字の行（薄くしたもの）にかからないように 24px、下は式を出す場所として 70px あける */
    const LABEL = 30, TOP = 24, BOTTOM = 70;
    const slots = function (m) {
      const cols = m <= 6 ? 3 : 4, rows = Math.ceil(m / cols), sh = (H - TOP - BOTTOM) / rows, out = [];
      for (let i = 0; i < m; i++) {
        const r = Math.floor(i / cols), cnt = Math.min(cols, m - r * cols), c = i - r * cols;
        out.push({ x: W / 2 + (c - (cnt - 1) / 2) * (W / cols), y: TOP + (r + 0.5) * sh - LABEL / 2, w: W / cols - 20, h: sh - LABEL - 12 });
      }
      return out;
    };
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const back = mk("g", { class: "gp-back" }, svg), front = mk("g", {}, svg), heads = mk("g", {}, back);
    const sets = PICKS.map(function () { return { items: [], labels: [], last: 0 }; });
    const all = [];
    NS.forEach(function (n, c) {
      const x = (c + 0.5) * CW;
      txt(f(x), "22", String(n), { class: "gp-n", "text-anchor": "middle" }, heads);
      let row = 0;
      FAM.forEach(function (fam, k) {
        if (n < fam.n[0] || n > fam.n[1]) return;
        const y = HEAD + (row + 0.5) * CH;
        row++;
        const set = PICKS.indexOf(k);
        const g = mk("g", {}, set >= 0 ? front : back);
        const sz = shape(g, faces(fam, n));
        const s = Math.min((CW - 2 * PAD) / sz.w, (CH - 2 * PAD) / sz.h);
        const item = { g: g, from: [x, y, s], sz: sz, n: n, k: k, set: set, F: faces(fam, n) };
        all.push(item);
        if (set >= 0) sets[set].items.push(item);
      });
    });
    /* 大きく並べたときの位置と、その下の n（「n = 21」の n は斜体） */
    sets.forEach(function (set) {
      const sl = slots(set.items.length);
      set.items.forEach(function (p, i) {
        p.to = [sl[i].x, sl[i].y, Math.min(sl[i].w / p.sz.w, sl[i].h / p.sz.h)];
        labels(p.g, p.F, p.sz.at, p.to[2], "gp-s" + sets.indexOf(set));     // 側面の番号（目印 .gp-lab・.gp-lab2 で出す）
        const t = mk("text", { x: f(sl[i].x), y: f(sl[i].y + sl[i].h / 2 + 26), class: "gp-big-n", "text-anchor": "middle" }, front);
        mk("tspan", { class: "gp-var" }, t).textContent = "n";
        mk("tspan", {}, t).textContent = " = " + p.n;
        set.labels.push(t);
      });
    });
    /* まとめたときの位置と、族の名前・n の範囲・個数 */
    const rep = [];
    all.forEach(function (p) { if (p.n === 25) rep[p.k] = p.sz; });
    const PL = piles(W, H, rep);
    all.forEach(function (p) { const P = PL[p.k]; p.pile = [P.x, P.y, Math.min(P.w / p.sz.w, P.h / p.sz.h)]; });
    const plabs = FAM.map(function (fam, k) { const g = mk("g", { opacity: 0 }, svg); pileLabel(g, k, PL[k]); return g; });
    /* 族 2 の n = 14 を、真ん中にさらに大きく出して、パラメータが図のどこに当たるかを言葉で書き込む
       （目印 .gp-zoom で出し、次の目印 .gp-lab で戻す。12 個に書くと混むので 1 個だけ） */
    /* 族 5 も同じように、n = 21 を大きく出す（p2 = 18 を「18 = 21 − 3」と書く）。どちらも B1 の左に「n = 14」などを出す */
    const ZB = { x: W / 2, y: 240, w: 580, h: 300 };
    const panel = mk("rect", { x: 0, y: 0, width: W, height: H, class: "gp-panel", opacity: 0 }, svg);
    const zooms = sets.map(function (set) {
      const zp = set.items[0], zg = mk("g", { opacity: 0 }, svg);
      const zsz = shape(zg, zp.F), kz = Math.min(ZB.w / zsz.w, ZB.h / zsz.h);
      const scr = function (p) { const q = zsz.at(p); return [ZB.x + kz * q[0], ZB.y + kz * q[1]]; };
      const call = mk("g", { class: "gp-call", opacity: 0 }, svg);
      callouts(call, zp.F, scr);
      const B1 = zp.F.bases[0].pts.map(scr), x0 = Math.min.apply(null, B1.map(function (q) { return q[0]; }));
      const y1 = B1.reduce(function (u, q) { return u + q[1]; }, 0) / B1.length;
      const t = mk("text", { x: f(x0 - 24), y: f(y1), class: "gp-zoom-n", "text-anchor": "end", dy: "0.35em" }, call);
      mk("tspan", { class: "gp-var" }, t).textContent = "n";
      mk("tspan", {}, t).textContent = " = " + zp.n;
      return { zp: zp, zg: zg, kz: kz, call: call, last: 0 };
    });
    /* a：1 つ目の族（目印 .gp-pick）、b：2 つ目の族（目印 .gp-pick2）。それぞれ、次の族へ行く前の目印 .gp-all（r）・.gp-all2（r2）で
       表の中へ引っ込み、いったん全体を見せる。
       それぞれ 0（表の中）〜1（大きく並ぶ）。出るときは 15 枚目と同じ動き（小さいうちはゆっくり動き出し、最後に少し行き過ぎて戻る。
       cubic-bezier(.5, 0, .3, 1.3)）、引っ込むときは、行き過ぎずに加速しながら戻る（ease-in）。
       gt（.gp-gather）：55 個がそれぞれの族の場所へ集まり、8 つにまとまる（重なったものは消えて、n = 25 の絵が残る）。16 枚目はここで終わる */
    let a = 0, b = 0, z = 0, l = 0, r = 0, z2 = 0, l2 = 0, r2 = 0, gt = 0;
    const ez = function (t, last) { return t <= 0 ? 0 : t >= 1 ? 1 : t >= last ? OUT(t) : 1 - (1 - t) * (1 - t); };
    const lerp = function (u, v, e) { return u.map(function (x, i) { return x + (v[i] - x) * e; }); };
    const put = function (g, v) { g.setAttribute("transform", "translate(" + f(v[0]) + "," + f(v[1]) + ") scale(" + Math.max(0.0001, v[2]).toFixed(4) + ")"); };
    function render() {
      /* ズーム：族 2 は z（.gp-zoom）で出て l（.gp-lab）で戻り、族 5 は z2（.gp-zoom2）で出て l2（.gp-lab2）で戻る */
      const zts = [z * (1 - l), z2 * (1 - l2)];
      zooms.forEach(function (Z, k) {
        const zt = zts[k], ze = ez(zt, Z.last), zp = Z.zp;
        Z.last = zt;
        put(Z.zg, lerp(zp.to, [ZB.x, ZB.y, Z.kz], ze));
        Z.zg.setAttribute("opacity", zt > 0 ? 1 : 0);
        Z.call.setAttribute("opacity", Math.max(0, (zt - 0.7) / 0.3).toFixed(3));
      });
      panel.setAttribute("opacity", (0.9 * Math.min(1, Math.max(zts[0], zts[1]) * 2)).toFixed(3));
      const ts = [a * (1 - r) * (1 - b), b * (1 - r2)];
      const dim = 1 - 0.82 * Math.min(1, Math.max(ts[0], ts[1]) * 1.5);     // 表に残るもの（大きく並べていないもの）の濃さ
      back.setAttribute("opacity", dim.toFixed(3));
      const es = ts.map(function (t, k) { const e = ez(t, sets[k].last); sets[k].last = t; return e; });
      const eg = gt <= 0 ? 0 : gt >= 1 ? 1 : SMOOTH(gt);     // 集めるときは行き過ぎずに、すっと
      /* n = 25 以外は、動き出すと半分の所までに 0.25 の濃さへ薄くなり、残像として一緒に動いて、最後（0.85 から）に消える
       */
      const fade = gt <= 0.5 ? 1 - 1.5 * gt : gt <= 0.85 ? 0.25 : 0.25 * Math.max(0, 1 - (gt - 0.85) / 0.15);
      all.forEach(function (p) {
        const base = p.set >= 0 ? lerp(p.from, p.to, es[p.set]) : p.from;
        put(p.g, lerp(base, p.pile, eg));
        /* 大きく並べる族は、表の中にいるあいだはほかの候補と同じ濃さ、出始めたらすぐ濃くする */
        let op = p.set >= 0 ? dim + (1 - dim) * Math.min(1, ts[p.set] * 4) : 1;
        if (p.n !== 25) op *= fade;
        p.g.setAttribute("opacity", op.toFixed(3));
      });
      sets.forEach(function (set, k) { set.labels.forEach(function (lb) { lb.setAttribute("opacity", Math.max(0, (ts[k] - 0.6) / 0.4).toFixed(3)); }); });
      heads.setAttribute("opacity", (1 - Math.min(1, gt * 2)).toFixed(3));
      plabs.forEach(function (g) { g.setAttribute("opacity", Math.max(0, (gt - 0.7) / 0.3).toFixed(3)); });
    }
    const slide = svg.closest("slide"), q = function (c) { return slide.querySelector(c); };
    const m1 = q(".gp-pick"), m2 = q(".gp-pick2"), mz = q(".gp-zoom"), ml = q(".gp-lab"), mr = q(".gp-all");
    const mz2 = q(".gp-zoom2"), ml2 = q(".gp-lab2"), mr2 = q(".gp-all2"), mg = q(".gp-gather");
    const on = function (m) { return m.classList.contains("on") ? 1 : 0; };
    if (still) {
      a = on(m1); b = on(m2); z = on(mz); l = on(ml); r = on(mr); z2 = on(mz2); l2 = on(ml2); r2 = on(mr2); gt = on(mg);
      render(); return;
    }
    render();
    follow(m1, function (t) { a = t; render(); }, 650, 350);     // 15 枚目の 25 の行と同じ速さ
    follow(mz, function (t) { z = t; render(); }, 650, 350);
    follow(ml, function (t) { l = t; render(); }, 650, 350);
    follow(mr, function (t) { r = t; render(); }, 650, 350);     // 族 2 を表に戻して、全体をいったん見せる
    follow(m2, function (t) { b = t; render(); }, 650, 350);
    follow(mz2, function (t) { z2 = t; render(); }, 650, 350);
    follow(ml2, function (t) { l2 = t; render(); }, 650, 350);
    follow(mr2, function (t) { r2 = t; render(); }, 650, 350);     // 族 5 を表に戻して、全体をいったん見せる
    follow(mg, function (t) { gt = t; render(); }, 1100, 500);     // 55 個を 8 族にまとめる
  }

  /* ---- 17 枚目：8 つを上に 1 行に並べ、BSBS-1・BSBS-2 を左に大きく出して、赤の範囲がどう決まるかを見せる（右下の表は figs/known.js の an） ----
     16 枚目から → で進んだときだけ、8 つを 16 枚目の最後の場所から上の 1 行へ動かし、右下の表をあとから出す（3 枚目から 4 枚目の morph.js と同じ決まり）。
     クリック：BSBS-1 を左に大きく出す（.an-b1）→ n = 25 の h を 1 から H_END まで下げながら寄り、重なった所を赤に。右の表の n = 25 の列に、今の h の点（.an-a1）→
     線と赤の棒（.an-l1。41OSME-J.css）→ BSBS-1 を上の行へ引っ込めてから BSBS-2 を出す（.an-b2）→ 線と赤の棒（.an-l2）→ BSBS-3〜8 に赤の ×（.an-xall） */
  const MOVE = 900;
  function row(svg, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const RW = W / 8, RY = 38, RBOX = { w: RW - 12, h: 58 }, BIG = { x: 212, y: 290, w: 396, h: 230 };
    const reps = FAM.map(function (fam, k) {
      const g = mk("g", {}, svg), F = faces(fam, 25), sz = shape(g, F);
      return { g: g, F: F, sz: sz, k: k, row: [(k + 0.5) * RW, RY, Math.min(RBOX.w / sz.w, RBOX.h / sz.h)] };
    });
    const PL = piles(W, H, reps.map(function (r) { return r.sz; }));
    reps.forEach(function (r) { const P = PL[r.k]; r.pile = [P.x, P.y, Math.min(P.w / r.sz.w, P.h / r.sz.h)]; });
    /* 16 枚目の最後の名前（動き出すと消える）と、上の行の名前 */
    const oldLab = mk("g", { opacity: 0 }, svg);
    reps.forEach(function (r) { pileLabel(oldLab, r.k, PL[r.k]); });
    const rowLab = mk("g", {}, svg);
    reps.forEach(function (r) { txt(f(r.row[0]), f(RY + RBOX.h / 2 + 22), "BSBS-" + (r.k + 1), { class: "an-row-name", "text-anchor": "middle" }, rowLab); });
    /* BSBS-3〜8 に付ける赤の × （.an-xall で一度に出す。41OSME-J.css） */
    reps.forEach(function (r) {
      if (r.k < 2) return;
      const x = r.row[0], d = 24, g = mk("g", { class: "an-x" }, svg);
      mk("line", { x1: f(x - d), y1: f(RY - d), x2: f(x + d), y2: f(RY + d) }, g);
      mk("line", { x1: f(x + d), y1: f(RY - d), x2: f(x - d), y2: f(RY + d) }, g);
    });
    /* 左の場所（拡大したときは、ここで切る） */
    let cid = 0;
    while (document.getElementById("an-clip-" + cid)) cid++;
    const clipR = mk("rect", { x: 0, y: 100, width: 440, height: H - 100 }, mk("clipPath", { id: "an-clip-" + cid }, mk("defs", {}, svg)));
    const bigs = [0, 1].map(function (k) {
      const wrap = mk("g", {}, svg), g = mk("g", { opacity: 0 }, wrap), F = reps[k].F, sz = shape(g, F), s1 = Math.min(BIG.w / sz.w, BIG.h / sz.h);
      const lab = txt(f(BIG.x), f(BIG.y + sz.h * s1 / 2 + 40), "BSBS-" + (k + 1), { class: "an-big-name", "text-anchor": "middle", opacity: 0 }, svg);
      return { wrap: wrap, g: g, sz: sz, lab: lab, from: reps[k].row, to: [BIG.x, BIG.y, s1], last: 0 };
    });
    const slide = svg.closest("slide"), q = function (c) { return slide.querySelector(c); };
    /* BSBS-1（n = 25）の h を下げた形。B1 と S2 の重なった所を赤に。重なりは小さいので、h を下げながら、S0・S2 と B1 の辺のまわりへ寄る */
    const fam0 = FAM[0], H_END = 0.45, T_DOWN = 2000;     // ミリ秒
    const build1 = function (h) { return ENUM.build({ pat: "bsbs", n: 25, h: h, l0: fam0.l0, p1: 0, d1: 1, l1: 0, p2: fam0.p2, d2: fam0.d2, l2: fam0.l2 }); };
    /* 寄ったときの見せる範囲（余白 0.6）を、左の場所（10〜430、115〜520）いっぱいに */
    const roi = function (h) {
      const F = build1(h), B = F.bases[0], P = [1, 2].map(function (id) { return B.pts[B.ids.indexOf(id)]; });
      return P.concat(facePts(F.bands[0].concat(F.bands[2]))).map(bigs[0].sz.at);
    };
    const RB = box(roi(1).concat(roi(H_END))), zs = Math.min(420 / (RB.x1 - RB.x0 + 1.2), 405 / (RB.y1 - RB.y0 + 1.2));
    const ZOOM1 = [220 - zs * (RB.x0 + RB.x1) / 2, 318 - zs * (RB.y0 + RB.y1) / 2, zs];
    let lastH = 1;
    const redraw1 = function (h) {
      if (h === lastH) return;
      lastH = h;
      const g = bigs[0].g, at = bigs[0].sz.at, Fh = build1(h);
      while (g.firstChild) g.removeChild(g.firstChild);
      shape(g, Fh, at);
      const part = OVERLAP.clip(Fh.bases[0].pts.map(at), ENUM.hull(facePts(Fh.bands[2])).map(at));
      if (part.length > 2) mk("polygon", { class: "ov-part", points: part.map(function (p) { return p.map(function (x) { return x.toFixed(3); }).join(","); }).join(" ") }, g);
    };
    /* 右の表の点。表は、この図より後に描かれるので、そのつど探す */
    const markAt = function (h, vis) {
      const plotSvg = q(".an-plot svg"), pt = plotSvg && plotSvg.querySelector(".an-pt");
      if (!pt || !plotSvg.getAttribute("data-y")) return;
      const m = plotSvg.getAttribute("data-y").split(",").map(Number);     // 表の上の端・高さ・h の範囲（対数）。figs/known.js の an が付ける
      pt.setAttribute("cy", (m[0] + (m[3] - Math.log10(h)) / (m[3] - m[2]) * m[1]).toFixed(2));
      pt.setAttribute("opacity", vis);
    };
    const put = function (g, v) { g.setAttribute("transform", "translate(" + f(v[0]) + "," + f(v[1]) + ") scale(" + Math.max(0.0001, v[2]).toFixed(4) + ")"); };
    const lerp = function (u, v, e) { return u.map(function (x, i) { return x + (v[i] - x) * e; }); };
    const cl = function (x) { return Math.max(0, Math.min(1, x)); };
    /* m：16 枚目の場所（0）から上の行（1）へ */
    function place(m) {
      const e = m <= 0 ? 0 : m >= 1 ? 1 : SMOOTH(m);
      reps.forEach(function (r) { put(r.g, lerp(r.pile, r.row, e)); });
      oldLab.setAttribute("opacity", Math.max(0, 1 - m * 3).toFixed(3));
      rowLab.setAttribute("opacity", Math.max(0, (m - 0.7) / 0.3).toFixed(3));
    }
    /* u1・u2：BSBS-1・BSBS-2 を左に出す。BSBS-2 を出すとき（u2）は、BSBS-1 を上の行へ引っ込め（0〜0.45）、それから BSBS-2 を出す（0.4〜1）。a1：h を下げる */
    let u1 = 0, u2 = 0, a1 = 0;
    const hNow = function () { return 1 + (H_END - 1) * SMOOTH(cl(a1)); };
    function pop() {
      redraw1(hNow());
      markAt(hNow(), a1 > 0 ? 1 : 0);
      const back = 1 - Math.pow(cl(u2 / 0.45), 2);     // 引っ込める動き（1 → 0。上の行へ近づくほど速く）
      const show = [u1 * back, cl((u2 - 0.4) / 0.6)], z = cl(a1 / 0.6) * back;
      /* 左の場所で切っている所は、引っ込めるにつれて上へ広げる（上の行で切れないように） */
      const cy = back > 0 && back < 1 ? 100 * back : 100;
      clipR.setAttribute("y", f(cy)); clipR.setAttribute("height", f(H - cy));
      bigs.forEach(function (B, k) {
        const t = show[k], b = k === 0 && back < 1;
        const e = b ? back : t <= 0 ? 0 : t >= 1 ? 1 : t >= B.last ? OUT(t) : 1 - (1 - t) * (1 - t);
        B.last = t;
        const at = lerp(B.from, B.to, e);
        put(B.g, k === 0 ? lerp(at, ZOOM1, b ? z : z <= 0 ? 0 : z >= 1 ? 1 : SMOOTH(z)) : at);
        B.g.setAttribute("opacity", t > 0 ? 1 : 0);
        if (k === 0 && z > 0) B.wrap.setAttribute("clip-path", "url(#an-clip-" + cid + ")"); else B.wrap.removeAttribute("clip-path");
        B.lab.setAttribute("opacity", (cl((t - 0.6) / 0.4) * (k === 0 ? (1 - cl(z * 3)) * (1 - cl(u2 * 4)) : 1)).toFixed(3));     // 戻るときは名前を出さない
      });
    }
    const m1 = q(".an-b1"), m2 = q(".an-b2"), ma1 = q(".an-a1");
    const on = function (m) { return m.classList.contains("on") ? 1 : 0; };
    place(1);
    if (still) {
      u1 = on(m1); u2 = on(m2); a1 = on(ma1); pop();
      setTimeout(function () { markAt(hNow(), a1); }, 0);     // ページの写しでは、右の表がこの図より後に描き直されるので、そのあとで点を置く
      return;
    }
    pop();
    /* ← で戻るときは動かさず、すぐ前の形にする（赤の棒も 41OSME-J.js・41OSME-J.css で同じようにする） */
    follow(m1, function (t) { u1 = t; pop(); }, 650, 0);
    follow(ma1, function (t) { a1 = t; pop(); }, T_DOWN, 0);     // h を下げる
    follow(m2, function (t) { u2 = t; pop(); }, 1100, 0);     // BSBS-1 を引っ込めてから、BSBS-2 を出す
    /* 16 枚目から → で進んだときだけ動かす（16 枚目が消えた時点で 17 枚目はもう出ている） */
    const prev = document.getElementById("gp-grid"), to = svg.closest(".page"), plot = slide.querySelector(".an-plot");
    if (!prev) return;
    const from = prev.closest(".page");
    let raf = 0, fade = null;
    const self = { finish: function () { if (raf) cancelAnimationFrame(raf); raf = 0; place(1); if (fade) fade.finish(); RUNNING.delete(self); } };
    new MutationObserver(function (recs) {
      const left = recs.some(function (r) { return r.target === from; }) && !from.classList.contains("on");
      if (!(left && to.classList.contains("on") && !to.querySelector("[step].on"))) return;
      const t0 = performance.now();
      fade = plot ? plot.animate([{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: MOVE + 400 }) : null;
      const frame = function (now) {
        const m = Math.min(1, (now - t0) / MOVE);
        place(m);
        if (m < 1) raf = requestAnimationFrame(frame); else { raf = 0; RUNNING.delete(self); }
      };
      place(0);
      RUNNING.add(self);
      raf = requestAnimationFrame(frame);
    }).observe(from, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---- 18 枚目：SBSBS をグループ化した 68 族を、n = 25 の形で一度に並べる（9 列 × 8 段。族の番号の順） ----
     パラメータは、補助資料サイトの表 5（docs/WALCOM2027/web/families.js）から写した。h = 1。向きは 16・17 枚目と同じ横向き。
     クリック（目印 .sb-pick）で、SBSBS-1 のほかを薄くし（調べる必要があるのは SBSBS-1 だけ。41OSME-J.css）、
     続けてすぐに、SBSBS-1 を、左の場所（次のクリックで右下に表を重ねても隠れない所）にできるだけ大きく出す（動きは 15・16 枚目と同じ 0.65 秒）。
     大きくした形は、長く伸びた帯 S2（n − 2 = 23 マス）を 4 マスに縮め、途中の 2 マスを点線にする。伸び始めに、マスの元の形から
     縮めた形へ入れ替える（どちらも同じ座標で描く。S2 の最初の 4 マスと底面の点は、ℓ2 = 23 と 4 で同じことを確かめた）。
     名前は、マスの小さいものを消し、大きくした図の下に 17 枚目と同じ大きさで出す */
  const SFAM = [     // [ℓ0, p1, d1, ℓ1, p2, d2, ℓ2, n の範囲の下の端]。ℓ・p の −c は n − c。n の範囲の上の端は、どれも 25
    [1, 1, 1, 1, 2, 1, -2, 11], [2, 2, 1, 1, 3, 1, -3, 13], [1, 1, 1, 1, 3, -1, 2, 15], [1, 1, 1, 2, 3, 1, -3, 15],
    [2, 3, 1, -3, 2, 1, 1, 15], [1, 2, -1, 2, 3, 1, -3, 17], [2, 2, 1, 1, 4, -1, 2, 17], [2, 2, 1, 2, 4, 1, -4, 17],
    [3, 3, 1, 1, 4, 1, -4, 17], [1, 1, 1, 1, 4, -1, 3, 19], [1, 1, 1, 2, 4, -1, 2, 19], [1, 1, 1, 3, 4, 1, -4, 19],
    [2, 3, -1, 2, 4, 1, -4, 19], [2, 4, 1, -4, 2, 1, 2, 19], [2, 4, -1, 2, 2, 1, 1, 19], [3, 3, 1, 1, 5, -1, 2, 19],
    [3, 3, 1, 2, 5, 1, -5, 19], [3, 4, 1, -4, 3, 1, 1, 19], [1, 1, 1, 1, 5, -1, 4, 21], [1, 2, 1, 2, 4, 1, -4, 21],
    [1, 2, -1, 2, 4, 1, -4, 21], [1, 2, -1, 2, 4, -1, 2, 21], [2, 2, 1, 1, 5, -1, 3, 21], [2, 2, 1, 2, 5, -1, 2, 21],
    [2, 2, 1, 3, 5, 1, -5, 21], [2, 4, 1, -4, 3, -1, 2, 21], [4, 4, 1, 1, 5, 1, -5, 21], [1, 1, 1, 1, 6, -1, 5, 23],
    [1, 1, 1, 2, 5, -1, 3, 23], [1, 1, 1, 3, 5, -1, 2, 23], [1, 1, 1, 4, 5, 1, -5, 23], [1, 3, -1, 3, 4, 1, -4, 23],
    [2, 3, 1, 2, 5, 1, -5, 23], [2, 3, -1, 2, 5, 1, -5, 23], [2, 3, -1, 2, 5, -1, 2, 23], [2, 5, 1, -5, 2, 1, 3, 23],
    [2, 5, -1, 2, 2, 1, 2, 23], [2, 5, -1, 3, 2, 1, 1, 23], [3, 3, 1, 1, 6, -1, 3, 23], [3, 3, 1, 2, 6, -1, 2, 23],
    [3, 3, 1, 3, 6, 1, -6, 23], [3, 4, -1, 2, 5, 1, -5, 23], [3, 5, 1, -5, 3, 1, 2, 23], [3, 5, -1, 2, 3, 1, 1, 23],
    [4, 4, 1, 1, 6, -1, 2, 23], [4, 4, 1, 2, 6, 1, -6, 23], [4, 5, 1, -5, 4, 1, 1, 23], [1, 1, 1, 1, 7, -1, 6, 25],
    [1, 2, 1, 2, 5, -1, 2, 25], [1, 2, 1, 3, 5, 1, -5, 25], [1, 2, -1, 2, 5, 1, -5, 25], [1, 2, -1, 2, 5, -1, 3, 25],
    [2, 2, 1, 1, 6, -1, 4, 25], [2, 2, 1, 2, 6, -1, 3, 25], [2, 2, 1, 3, 6, -1, 2, 25], [2, 2, 1, 4, 6, 1, -6, 25],
    [2, 4, -1, 3, 5, 1, -5, 25], [2, 5, 1, -5, 3, 1, 2, 25], [2, 5, 1, -5, 3, -1, 2, 25], [2, 5, -1, 2, 3, -1, 2, 25],
    [3, 4, 1, 2, 6, 1, -6, 25], [3, 4, -1, 2, 6, 1, -6, 25], [3, 4, -1, 2, 6, -1, 2, 25], [3, 5, 1, -5, 4, -1, 2, 25],
    [4, 4, 1, 1, 7, -1, 3, 25], [4, 4, 1, 2, 7, -1, 2, 25], [4, 4, 1, 3, 7, 1, -7, 25], [5, 5, 1, 1, 6, 1, -6, 25]
  ];
  function sgrid(svg, still) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const COLS = 9, ROWS = 8, CW = W / COLS, CH = H / ROWS, BW = CW - 12, BH = CH - 24;     // 1 つ分の枠と、図を入れる箱（下に名前）
    const put = function (g, v) { g.setAttribute("transform", "translate(" + f(v[0]) + "," + f(v[1]) + ") scale(" + v[2].toFixed(4) + ")"); };
    let one = null;
    SFAM.forEach(function (P, i) {
      const v = function (k) { return P[k] < 0 ? 25 + P[k] : P[k]; };
      const F = ENUM.build({ pat: "sbsbs", n: 25, h: 1, l0: v(0), p1: v(1), d1: P[2], l1: v(3), p2: v(4), d2: P[5], l2: v(6) });
      const cx = (i % COLS + 0.5) * CW, top = Math.floor(i / COLS) * CH;
      const fam = mk("g", { class: "sb-fam" + (i ? " sb-other" : "") }, svg), g = mk("g", {}, fam), sz = shape(g, F);
      const cell = [cx, top + 3 + BH / 2, Math.min(BW / sz.w, BH / sz.h)];
      put(g, cell);
      const lab = txt(f(cx), f(top + CH - 6), "SBSBS-" + (i + 1), { class: "sb-name", "text-anchor": "middle" }, fam);
      if (!i) one = { fam: fam, g: g, cell: cell, lab: lab, P: P, at: sz.at };
    });
    svg.appendChild(one.fam);     // 大きくしたときに、薄くしたほかの族より上に来るように
    /* 帯 S2 を 4 マスに縮めた形（マスの元の形と同じ座標で） */
    const P1 = one.P, short = ENUM.build({ pat: "sbsbs", n: 25, h: 1, l0: P1[0], p1: P1[1], d1: P1[2], l1: P1[3], p2: P1[4], d2: P1[5], l2: 4 });
    const g2 = mk("g", { opacity: 0 }, one.fam);
    shape(g2, short, one.at, true);
    const sb = box(allPts(short).map(one.at));
    /* 大きくした形：左の場所（10〜424、8〜486。下に名前） */
    const BX0 = 10, BX1 = 424, BY0 = 8, BY1 = 486, S = Math.min((BX1 - BX0) / (sb.x1 - sb.x0), (BY1 - BY0) / (sb.y1 - sb.y0));
    const big = [(BX0 + BX1) / 2 - S * (sb.x0 + sb.x1) / 2, (BY0 + BY1) / 2 - S * (sb.y0 + sb.y1) / 2, S];
    const bigLab = txt(f((BX0 + BX1) / 2), f((BY0 + BY1) / 2 + (sb.y1 - sb.y0) * S / 2 + 38), "SBSBS-1", { class: "an-big-name", "text-anchor": "middle", opacity: 0 }, one.fam);
    const render = function (t) {
      const e = t <= 0 ? 0 : t >= 1 ? 1 : OUT(t), v = one.cell.map(function (x, k) { return x + (big[k] - x) * e; });
      put(one.g, v); put(g2, v);
      one.g.setAttribute("opacity", (1 - Math.min(1, t * 4)).toFixed(3));     // 伸び始めに、縮めた形へ入れ替える
      g2.setAttribute("opacity", Math.min(1, t * 4).toFixed(3));
      one.lab.setAttribute("opacity", (1 - Math.min(1, t * 3)).toFixed(3));
      bigLab.setAttribute("opacity", Math.max(0, (t - 0.6) / 0.4).toFixed(3));
    };
    const m = svg.closest("slide").querySelector(".sb-pick");
    if (still) { render(m.classList.contains("on") ? 1 : 0); return; }
    render(0);
    follow(m, render, 650, 0);     // ← で戻るときは、すぐ前の形に
  }

  /* ---- 19 枚目（おわりに）：解析した 3 つ（BSBS-1・BSBS-2・SBSBS-1）を横に並べる。n = 25・h = 1 の形で、
     SBSBS-1 は 18 枚目と同じく、帯 S2 を 4 マスに縮めて途中の 2 マスを点線にする。3 つとも同じ縮尺。下に名前。
     3 つの間は GAP にそろえて、真ん中に寄せる ---- */
  function ends(svg) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const P = SFAM[0];
    const Fs = [faces(FAM[0], 25), faces(FAM[1], 25),
                ENUM.build({ pat: "sbsbs", n: 25, h: 1, l0: P[0], p1: P[1], d1: P[2], l1: P[3], p2: P[4], d2: P[5], l2: 4 })];
    const CW = W / 3, BH = H - 36, GAP = 40;     // 縮尺を決める 1 つ分の幅と、図を入れる高さ（下に名前）、図と図の間
    const gs = Fs.map(function (F, k) { const g = mk("g", {}, svg); return { g: g, sz: shape(g, F, null, k === 2) }; });
    const S = Math.min.apply(null, gs.map(function (o) { return Math.min((CW - 24) / o.sz.w, BH / o.sz.h); }));
    let x = (W - gs.reduce(function (a, o) { return a + o.sz.w * S; }, 0) - 2 * GAP) / 2;
    gs.forEach(function (o, k) {
      const cx = x + o.sz.w * S / 2;
      x += o.sz.w * S + GAP;
      o.g.setAttribute("transform", "translate(" + f(cx) + "," + f(BH / 2) + ") scale(" + S.toFixed(4) + ")");
      txt(f(cx), f(H - 8), (k < 2 ? "BSBS-" : "SBSBS-") + (k < 2 ? k + 1 : 1), { class: "end-name", "text-anchor": "middle" }, svg);
    });
  }

  return { grid: grid, row: row, sgrid: sgrid, ends: ends, FAM: FAM };
})();
figure("gp-grid", GROUP.grid);
figure("an-row", GROUP.row);
figure("an-plot", KNOWN.a);     // 17 枚目の右下の表（はじめは何も描かない。曲線と赤の棒は 41OSME-J.css で出す）
figure("sb-grid", GROUP.sgrid);
figure("sb-plot", KNOWN.s);     // 18 枚目の右下の表（17 枚目の最後から、BSBS-3 の段の青の線を消した形。h2 の曲線と、上の赤・間の青は 41OSME-J.css で出す）
figure("sb-all", KNOWN.all);     // 18 枚目の最後に、右下の表を 8 枚目の表へ広げる
figure("end-fams", GROUP.ends);     // 19 枚目の、解析した 3 つ
