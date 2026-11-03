/* ===== AL210 のスライドの図：12 枚目の、n ≥ 26 で重なる 2 つのパス状の部分展開図（figs/overlap.js の展開図を使う）===== */
/* 定理８（n ≥ 26 では、高さによらず、重なる辺展開図がある）を、2 つのパス状の部分展開図で見せる。
     左：BSBS（族 BSBS-2。5 枚目の正 24 角柱と同じ族）。B1・S0・B2 と、B2 に付く 3 面の帯。h ≤ 1.15 で重なる
     右：SBSBS（族 SBSBS-1。4 枚目の正 12 角柱と同じ族）。S1・B1・S0・B2 と、B2 に付く側面 1 枚の 5 面
       （端の帯は伸ばさない。まだ列挙の話をしていないので）。h ≥ 1.15 で重なる
   面の置き方は figs/overlap.js の bsbs(n, h, 3)・sbsbs(n, h) で、そこからパスの面だけを取り出す。
   2 つの図は、下の n と h のバー（共通の 1 組。<div class="large-bars"> の中の <input type="range" data-bar="n|h">）で一緒に動く
   （補助資料サイトの図 10 と同じ形）。
     n：26〜100 の整数、h：HMIN〜HMAX（バーの位置は高さの対数に比例させる）。はじめは n = 26、h = 1.15（2 つとも重なる）
   どちらの図も、S0 を横向き（B1 が左、B2 が右）にして帯が上に来る向きに置く。S0 と帯の外接長方形を、まわりに PAD px の余白を残して
   図の枠いっぱいに広げ（底面ははみ出た分を切る）、2 つの図の縮尺はそろえる（小さいほうに合わせる）。ただし、枠の下の STRIP px は
   あけておく（2・3 クリック目に、そこへ「h ≤ 1.15 で重なる」などの文と「常にどちらかが重なる」の箱を重ねる（al210.css）ので、
   S0 が隠れないように。箱は、あけた所から上へ 19px ほどはみ出すが、S0 の下には PAD px の余白があるので、かからない）。
   （サイトの図 10 は縦を 3.2(1 + h) に決めているので、h が大きいと図が小さくなる）
   面の色と B・S の字は 11 枚目と同じ（帯の中の側面の境目は破線）。両端の面の重なりは赤。
   重なりには、4 枚目と同じく、小さい丸と拡大の丸（<g class="lg-zoom">）を付けておき、見せるかどうかは段階表示に合わせて al210.css で決める。
   拡大の丸は、図の上の 2 隅のうち、重なりから遠いほうに置き（下には文を重ねるので）、倍率は、重なりが拡大の丸の半径ほどになるようにする */
var LARGE = (function () {
  const HMIN = 0.05, HMAX = 100, H0 = 1.15, RZ = 52, STRIP = 88, PAD = 26;
  const hOf = function (v) { return Math.exp(Math.log(HMIN) + (Math.log(HMAX) - Math.log(HMIN)) * v / 1000); };
  const vOf = function (x) { return Math.round((Math.log(x) - Math.log(HMIN)) / (Math.log(HMAX) - Math.log(HMIN)) * 1000); };
  /* 多角形の重心（面積で重みを付けたもの。切り取った底面の字の位置に使う） */
  function center(P) {
    let A = 0, x = 0, y = 0;
    P.forEach(function (p, i) {
      const q = P[(i + 1) % P.length], w = p[0] * q[1] - q[0] * p[1];
      A += w; x += (p[0] + q[0]) * w; y += (p[1] + q[1]) * w;
    });
    return [x / (3 * A), y / (3 * A)];
  }
  const span = function (pts) {
    const xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  };

  /* パスの面：底面 bases、帯 bands（帯ごとに、並んだ側面の列）、S0、両端の面の重なり parts。
     座標は、S0 を [0, h] × [−1, 0] に置き、B1 が左、帯が上に来る向き（y は上向き） */
  function path(kind, n, h) {
    const net = kind === "bsbs" ? OVERLAP.bsbs(n, h, 3) : OVERLAP.sbsbs(n, h), by = {};
    /* SBSBS は、S0（overlap.js の S2）が B1 の辺 1 に付いて斜めを向いているので、B1 と S0 と S1 が会う点を原点に移し、S0 が右を向くように回す */
    const a = 2 * Math.PI / n, c = Math.cos(a - Math.PI / 2), s = Math.sin(a - Math.PI / 2);
    const move = kind === "bsbs" ? function (p) { return p; } : function (p) { const q = [p[0] - 1, p[1]]; return [c * q[0] - s * q[1], s * q[0] + c * q[1]]; };
    net.faces.forEach(function (f) { by[f.id] = f.poly.map(move); });
    const P = kind === "bsbs"
      ? { bases: [by.B1, by.B2], bands: [[by.S1], [by.C1, by.C2, by.C3]], s0: by.S1, ends: [[by.B1], [by.C1, by.C2, by.C3]] }
      : { bases: [by.B1, by.B2], bands: [[by.S1], [by.S2], [by.E2]], s0: by.S2, ends: [[by.S1], [by.E2]] };
    P.parts = [];
    P.ends[0].forEach(function (A) { P.ends[1].forEach(function (B) {
      const part = OVERLAP.clip(A, B);
      if (part.length >= 3 && Math.abs(OVERLAP.area(part)) > 1e-12) P.parts.push(part);
    }); });
    /* 見せたい範囲：S0 と帯の外接長方形 */
    const pts = P.s0.slice();
    P.bands.forEach(function (S) { S.forEach(function (F) { F.forEach(function (p) { pts.push(p); }); }); });
    P.extent = span(pts);
    return P;
  }

  /* 面と重なりを描く（map：図の上の位置に移す関数） */
  function scene(parent, P, map) {
    const pts = function (Q) { return Q.map(function (p) { return map(p).map(function (v) { return v.toFixed(2); }).join(","); }).join(" "); };
    P.bases.forEach(function (B) { mk("polygon", { class: "pat-base", points: pts(B) }, parent); });
    /* 帯は 1 つの長方形として塗り、中の側面の境目を破線で引く（11 枚目と同じ） */
    P.bands.forEach(function (S) {
      const last = S[S.length - 1];
      mk("polygon", { class: "pat-band", points: pts([S[0][0], last[1], last[2], S[0][3]]) }, parent);
      S.slice(0, -1).forEach(function (F) { mk("polyline", { class: "pat-fold", points: pts([F[1], F[2]]) }, parent); });
    });
    P.parts.forEach(function (Q) { mk("polygon", { class: "ov-part", points: pts(Q) }, parent); });
  }

  let zooms = 0;
  function draw(svg, kind, n, h) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    const both = { bsbs: path("bsbs", n, h), sbsbs: path("sbsbs", n, h) }, P = both[kind];
    /* 縮尺：2 つの図の見せたい範囲が、どちらも枠（下の STRIP px を除く）に、まわりに PAD px 残して入る大きさ。範囲の真ん中を、その真ん中に */
    const T = H - STRIP, k = Math.min.apply(null, ["bsbs", "sbsbs"].map(function (key) {
      const e = both[key].extent; return Math.min((W - 2 * PAD) / (e[2] - e[0]), (T - 2 * PAD) / (e[3] - e[1]));
    }));
    const e = P.extent, x0 = (e[0] + e[2]) / 2 - W / (2 * k), y1 = (e[1] + e[3]) / 2 + T / (2 * k);
    const at = function (p) { return [(p[0] - x0) * k, (y1 - p[1]) * k]; };
    const box = [[x0, y1 - T / k], [x0 + W / k, y1 - T / k], [x0 + W / k, y1], [x0, y1]];     // 字を書く範囲（下の STRIP px を除く）
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    scene(svg, P, at);
    /* B の字：底面の見えている部分の真ん中に（見えている部分が字より小さいときは書かない） */
    P.bases.forEach(function (B) {
      const part = OVERLAP.clip(B, box);
      if (part.length < 3) return;
      const b = span(part.map(at));
      if (Math.min(b[2] - b[0], b[3] - b[1]) < 24) return;
      const q = at(center(part));
      txt(q[0].toFixed(2), q[1].toFixed(2), "B", { class: "lg-label lg-b", "font-size": 17, "text-anchor": "middle", dy: "0.35em" }, svg);
    });
    /* S の字：帯の見えている部分の真ん中に、帯の細いほうの幅に収まる大きさで（小さすぎるときは書かない） */
    P.bands.forEach(function (S) {
      const part = OVERLAP.clip([S[0][0], S[S.length - 1][1], S[S.length - 1][2], S[0][3]], box);
      const size = Math.min(14, 0.8 * k * Math.min(h, S.length));
      if (part.length < 3 || size < 7) return;
      const q = at(center(part));
      txt(q[0].toFixed(2), q[1].toFixed(2), "S", { class: "lg-label lg-s", "font-size": size.toFixed(1), "stroke-width": (size / 3.5).toFixed(2),
                                                   "text-anchor": "middle", dy: "0.35em" }, svg);
    });
    if (!P.parts.length) return;

    /* 重なりの小さい丸と拡大の丸。座標は、拡大した先でも丸めの誤差が出ないよう、もとの点から直接計算する */
    const ob = span([].concat.apply([], P.parts.map(function (Q) { return Q.map(at); })));
    const O = [(ob[0] + ob[2]) / 2, (ob[1] + ob[3]) / 2], rs = Math.max(6, 0.75 * Math.hypot(ob[2] - ob[0], ob[3] - ob[1]));
    const M = Math.max(1, RZ / Math.max(ob[2] - ob[0], ob[3] - ob[1], 1e-9));
    const corners = [[RZ + 8, RZ + 8], [W - RZ - 8, RZ + 8]];
    const Z = corners.reduce(function (a, q) { return Math.hypot(q[0] - O[0], q[1] - O[1]) > Math.hypot(a[0] - O[0], a[1] - O[1]) ? q : a; });
    const g = mk("g", { class: "lg-zoom" }, svg), f = function (v) { return v.toFixed(2); };
    mk("circle", { cx: f(O[0]), cy: f(O[1]), r: f(rs), class: "ov-ring" }, g);
    /* 2 つの丸をつなぐ線（共通外接線） */
    const d = Math.hypot(Z[0] - O[0], Z[1] - O[1]);
    if (d > RZ - rs + 1) [1, -1].forEach(function (sg) {
      const t = Math.atan2(Z[1] - O[1], Z[0] - O[0]) + sg * Math.acos((rs - RZ) / d), u = [Math.cos(t), Math.sin(t)];
      mk("line", { x1: f(O[0] + rs * u[0]), y1: f(O[1] + rs * u[1]), x2: f(Z[0] + RZ * u[0]), y2: f(Z[1] + RZ * u[1]), class: "ov-lead" }, g);
    });
    mk("circle", { cx: f(Z[0]), cy: f(Z[1]), r: RZ, fill: "#fff" }, g);
    const cid = "lg-zoom-" + (++zooms);       // 切り抜きの id（ページの写しでも重ならないように、通し番号）
    mk("circle", { cx: f(Z[0]), cy: f(Z[1]), r: RZ }, mk("clipPath", { id: cid }, mk("defs", {}, g)));
    scene(mk("g", { "clip-path": "url(#" + cid + ")" }, g), P, function (p) { const q = at(p); return [Z[0] + M * (q[0] - O[0]), Z[1] + M * (q[1] - O[1])]; });
    mk("circle", { cx: f(Z[0]), cy: f(Z[1]), r: RZ, class: "ov-ring" }, g);
  }

  /* 図ごとの設定：その図を、バーの今の値で描き、バーが動いたら描き直す。h の値は、バーの位置からではちょうど 1.15 にならないので、
     バーの枠の data-h に持つ（ページの写しにも写る）。バーの表示と、バーを操作したクリックでページが進まないこと・
     操作し終えたらフォーカスを外すこと（6 枚目と同じ）は、バーの枠ごとに 1 度だけ付ける */
  const READY = new WeakSet();
  function panel(kind) {
    return function (svg, still) {
      const bars = svg.closest("slide").querySelector(".large-bars");
      const input = function (key) { return bars.querySelector('input[data-bar="' + key + '"]'); };
      const shown = function (key) { return bars.querySelector('span[data-bar="' + key + '"]'); };
      const h = function () { return +bars.getAttribute("data-h"); };
      if (!READY.has(bars)) {
        READY.add(bars);
        if (!bars.hasAttribute("data-h")) bars.setAttribute("data-h", String(H0));
        input("h").value = vOf(h());
        shown("n").textContent = input("n").value; shown("h").textContent = h().toFixed(2);
        if (!still) {
          bars.addEventListener("click", function (e) { e.stopPropagation(); });
          input("n").addEventListener("input", function () { shown("n").textContent = this.value; });
          input("h").addEventListener("input", function () { bars.setAttribute("data-h", String(hOf(+this.value))); shown("h").textContent = h().toFixed(2); });
          [input("n"), input("h")].forEach(function (el) {
            el.addEventListener("change", function () { el.blur(); });
            el.addEventListener("pointerup", function () { el.blur(); });
          });
        }
      }
      const redraw = function () { draw(svg, kind, +input("n").value, h()); };
      redraw();
      if (still) return;
      [input("n"), input("h")].forEach(function (el) { el.addEventListener("input", redraw); });
    };
  }
  return { bsbs: panel("bsbs"), sbsbs: panel("sbsbs") };
})();
figure("large-bsbs", LARGE.bsbs);
figure("large-sbsbs", LARGE.sbsbs);
