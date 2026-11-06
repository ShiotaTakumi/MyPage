/* ===== AL210 のスライドの図：7・8・9 枚目の (n, h) の表（common.js の道具を使う）===== */
/* 補助資料サイトのトップページの図 2（docs/WALCOM2027/web/classification.js）と同じ枠に、わかっていることを書き込む。
   枠は図 2 と同じ：横は n（3〜31。目盛りは 3 から 2 おき）、縦は h（0.05〜100。対数。目盛りの字は 10 のべきだけ）、
   色も図 2 と同じ（重なる：赤、重ならない：青）。書き込み方は冬の LA の 7 枚目と同じで、範囲は棒、1 点は × で書く。
   目盛りの字は奇数だけなので、境目の偶数（10・12・24・26）には n 軸に吹き出しを付ける（冬の LA と同じ形）。
   クリックで出す層（al210.css で、段階表示の目印・箱が出たら見せる）：
   7 枚目（先行研究）
     k-h1：h = 1 の行の ×（3 ≤ n ≤ 23 は青、n ≥ 24 は赤。定理３）と、n 軸の 24 を指す吹き出し。
           n = 3・4 の × は k-x3・k-x4 に分けておき、その列の棒が出たら消す（棒と重なるため）
     k-n3・k-n4：n = 3・4 の列の青の棒（定理４・定理５）
     k-sch：(12, 15)・(15, 0.2) の赤の ×（Schlickenrieder）
     k-callout：n 軸の 12 を指す吹き出し
   8 枚目（主結果）：はじめは 7 枚目の最後と同じ（n = 3・4 の棒と、残りの ×、24 の吹き出し）。そこに、1 クリックでまとめて（al210.css）、
     k-m1：5 ≤ n ≤ 10 の青の棒と、n 軸の 10 を指す吹き出し
     k-m2：n ≥ 26 の赤の棒と、n 軸の 26 を指す吹き出し（LA の 29 の吹き出しにあたる）
     k-m3：11 ≤ n ≤ 25 の棒（h < h1(n) と h > h2(n) は赤、その間は青。図 2 と同じ）
     を書き込む。× は、棒と一緒に消す（k-hide1〜3。7 枚目の n = 3・4 と同じ）。24 の吹き出しは、h = 1 の × と一緒に k-hide3 で消す。
     棒は図 2 と同じになる。
     k-g6・k-g7・k-g8：定理６・７・８の範囲（5 ≤ n ≤ 10、11 ≤ n ≤ 25、n ≥ 26）を囲む緑の枠（冬の LA の 8 枚目と同じ形。札は付けない）。
           それぞれの定理の箱と一緒に出し、次の定理で消す
   9 枚目（定理７の式）：横を 11 ≤ n ≤ 25 に、縦を 0.05 ≤ h ≤ 20 に広げた表に、8 枚目と同じ棒を描く。
     k-c-h1a〜h1d・k-c-h2a・k-c-h2b：h1 の 4 本・h2 の 2 本の式の曲線。それぞれ、その式を使う n の範囲だけに引く
     （範囲の境目は、隣の式と値が等しくなる n。図 2 と同じく二分法で求める）。色は図 2 と同じ。式の行が出たら見せる
   8 枚目から 9 枚目へ進んだとき（9 枚目のクリックがまだ 1 つも出ていないとき）だけ、9 枚目の表を、8 枚目の表と同じ大きさ・位置・範囲から、
   11 ≤ n ≤ 25 のところへ寄って広がるように動かす（zoomIn。動きは 3 枚目から 4 枚目の morph.js と同じ決まり） */
var KNOWN = (function () {
  const { sin, cos, PI } = Math;
  const M = { l: 80, r: 6, t: 8, b: 78 };     // 枠のまわりの余白（左に h の目盛りと「高さ h」、下に n の目盛りと「正 n 角形」）

  /* 主結果の 2 つの閾値（α = 2π/n）。式と、どの n でどの式を使うかは、補助資料サイトの classification.js と同じ */
  const H1 = [
    function (n) { const a = 2 * PI / n; return (sin(3 * a) - sin(2 * a)) / cos(a); },                    // 11 ≤ n ≤ 12
    function (n) { const a = 2 * PI / n; return (sin(3 * a) - sin(2 * a)) / (cos(a) - cos(3 * a)); },     // 13 ≤ n ≤ 16
    function (n) { const a = 2 * PI / n; return (cos(4 * a) + 2 - cos(a) - cos(2 * a)) / sin(3 * a); },   // 17 ≤ n ≤ 19
    function (n) { const a = 2 * PI / n;                                                                  // 20 ≤ n ≤ 25
      return (2 * sin(5 * a) - sin(4 * a) - sin(3 * a) + sin(a)) / (cos(2 * a) - cos(5 * a)); }
  ];
  const H2 = [
    function (n) { const a = 2 * PI / n; return cos(a) / (sin(3 * a) - sin(2 * a)); },                   // n = 11
    function (n) { const a = 2 * PI / n; return (cos(a) - cos(3 * a)) / (sin(3 * a) - sin(2 * a)); }      // 12 ≤ n ≤ 25
  ];
  function h1(n) { return H1[n <= 12 ? 0 : n <= 16 ? 1 : n <= 19 ? 2 : 3](n); }
  function h2(n) { return H2[n <= 11 ? 0 : 1](n); }
  /* 隣り合う 2 つの式の値が等しくなる n（lo〜hi の間。二分法） */
  function crossing(f, g, lo, hi) {
    const d = function (x) { return f(x) - g(x); };
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (d(lo) * d(mid) <= 0) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  }
  const SW1 = [crossing(H1[0], H1[1], 11.5, 13.5), crossing(H1[1], H1[2], 15.5, 17.5), crossing(H1[2], H1[3], 19, 21)];
  const SW2 = [crossing(H2[0], H2[1], 11, 13)];

  /* 表の範囲：n は nMin〜nMax（左右に 0.7 ずつ余白）、h は hLo〜hHi（対数） */
  const WIDE = { nMin: 3, nMax: 31, hLo: 0.05, hHi: 100 }, ZOOM = { nMin: 11, nMax: 25, hLo: 0.05, hHi: 20 };
  let clips = 0;     // 切り抜きの id（ページの写しでも重ならないように、通し番号）

  /* mode："known"（7 枚目）、"main"（8 枚目）、"zoom"（9 枚目）、"an"（18 枚目）、"sb"（19 枚目）、"move"（8 枚目から 9 枚目へ動く途中。棒だけ）。
     v：見る範囲（n は xLo〜xHi、h は hLo〜hHi）、図の大きさ W・H、「高さ h」の横の位置 tx。書かなければ、その mode の決まりの値 */
  function setup(svg, mode, v) {
    const R = mode === "zoom" || mode === "an" || mode === "sb" ? ZOOM : WIDE;
    v = v || { xLo: R.nMin - 0.7, xHi: R.nMax + 0.7, hLo: R.hLo, hHi: R.hHi,
               W: +svg.getAttribute("width"), H: +svg.getAttribute("height"), tx: mode === "zoom" || mode === "an" || mode === "sb" ? 32 : 22 };
    const X_LO = v.xLo, X_HI = v.xHi, H_LO = v.hLo, H_HI = v.hHi, W = v.W, H = v.H;
    const pw = W - M.l - M.r, ph = H - M.t - M.b, LY0 = Math.log10(H_LO), LY1 = Math.log10(H_HI);
    const X = function (n) { return M.l + (n - X_LO) / (X_HI - X_LO) * pw; };
    const Y = function (h) { return M.t + (LY1 - Math.log10(h)) / (LY1 - LY0) * ph; };
    const bw = 0.3 * pw / (X_HI - X_LO);     // 棒の幅（図 2 と同じく、n の 1 つ分の 0.3）
    const f = function (v) { return v.toFixed(1); };

    /* 格子：h は 1〜9 × 10 のべきごと、n は目盛りの字のあるところ */
    const grid = mk("g", { class: "k-grid" }, svg), ticksN = [], ticksH = [];
    for (let n = WIDE.nMin; n <= WIDE.nMax; n += 2) if (n >= X_LO && n <= X_HI) ticksN.push(n);
    for (let e = -2; e <= 2; e++) for (let k = 1; k <= 9; k++) {
      const h = k * Math.pow(10, e);
      if (h >= H_LO * 0.9999 && h <= H_HI * 1.0001) ticksH.push({ h: h, major: k === 1 });
    }
    ticksH.forEach(function (t) { mk("line", { x1: M.l, x2: M.l + pw, y1: f(Y(t.h)), y2: f(Y(t.h)) }, grid); });
    ticksN.forEach(function (n) { mk("line", { x1: f(X(n)), x2: f(X(n)), y1: M.t, y2: M.t + ph }, grid); });

    /* 層 */
    const layer = function (cls) { return mk("g", { class: "k-layer " + cls }, svg); };
    const group = function (cls) { return mk("g", { class: cls }, svg); };
    const bar = function (parent, n, lo, hi, ov) {
      lo = Math.max(lo, H_LO); hi = Math.min(hi, H_HI);
      if (hi <= lo) return;
      mk("rect", { class: ov ? "k-ov" : "k-no", x: f(X(n) - bw / 2), width: f(bw), y: f(Y(hi)), height: f(Y(lo) - Y(hi)) }, parent);
    };
    const middle = function (parent, n) {     // 11 ≤ n ≤ 25 の棒（h1 より下と h2 より上は赤、その間は青）
      bar(parent, n, H_LO, h1(n), true);
      bar(parent, n, h1(n), h2(n), false);
      bar(parent, n, h2(n), H_HI, true);
    };
    const cross = function (parent, n, h, ov) {
      const x = X(n), y = Y(h), d = 7.5;
      mk("path", { class: "k-x " + (ov ? "k-ov" : "k-no"),
                   d: "M" + f(x - d) + "," + f(y - d) + "L" + f(x + d) + "," + f(y + d) + "M" + f(x - d) + "," + f(y + d) + "L" + f(x + d) + "," + f(y - d) }, parent);
    };
    /* n 軸の n を指す吹き出し：目盛りの字の段に、白地の丸（中に n）を置き、とがった先を軸に付ける */
    const callout = function (parent, n) {
      const cx = X(n), r = 17, cy = M.t + ph + 30, tip = M.t + ph + 1, a = 0.42;
      const p = function (th) { return f(cx + r * Math.sin(th)) + "," + f(cy - r * Math.cos(th)); };
      mk("path", { class: "k-bubble", d: "M" + f(cx) + "," + f(tip) + "L" + p(a) + "A" + r + "," + r + " 0 1 1 " + p(-a) + "Z" }, parent);
      txt(f(cx), f(cy), String(n), { class: "k-num", "text-anchor": "middle", "dominant-baseline": "central" }, parent);
    };
    let tail = function () {};     // 枠と字の後に描くもの（吹き出し）
    if (mode === "known") {
      const n3 = layer("k-n3"), n4 = layer("k-n4"), h1row = layer("k-h1"), sch = layer("k-sch");
      bar(n3, 3, H_LO, H_HI, false);
      bar(n4, 4, H_LO, H_HI, false);
      for (let n = R.nMin; n <= R.nMax; n++) cross(n <= 4 ? mk("g", { class: "k-x" + n }, h1row) : h1row, n, 1, n >= 24);
      cross(sch, 12, 15, true);
      cross(sch, 15, 0.2, true);
      tail = function () { callout(layer("k-callout"), 12); callout(layer("k-h1"), 24); };
    } else if (mode === "main") {
      const known = group("k-known"), m1 = layer("k-m1"), m2 = layer("k-m2"), m3 = layer("k-m3");
      const hide = [group("k-hide1"), group("k-hide2"), group("k-hide3")];
      bar(known, 3, H_LO, H_HI, false);
      bar(known, 4, H_LO, H_HI, false);
      for (let n = 5; n <= 10; n++) bar(m1, n, H_LO, H_HI, false);
      for (let n = 26; n <= R.nMax; n++) bar(m2, n, H_LO, H_HI, true);
      for (let n = 11; n <= 25; n++) middle(m3, n);
      for (let n = 5; n <= R.nMax; n++) cross(hide[n <= 10 ? 0 : n >= 26 ? 1 : 2], n, 1, n >= 24);
      cross(hide[2], 12, 15, true);
      cross(hide[2], 15, 0.2, true);
      /* 緑の枠：列の間（n = 4.5、10.5、25.5）で区切り、区切りから 4px 内側に引く */
      const y0 = M.t + 3, y1 = M.t + ph - 3;
      [[4.5, 10.5, "k-g6"], [10.5, 25.5, "k-g7"], [25.5, X_HI, "k-g8"]].forEach(function (g) {
        const x0 = X(g[0]) + 4, x1 = Math.min(X(g[1]), M.l + pw) - 4;
        mk("rect", { class: "k-frame-green", x: f(x0), y: f(y0), width: f(x1 - x0), height: f(y1 - y0), rx: 5 }, layer(g[2]));
      });
      /* 吹き出しは目盛りの字より上に描くため、棒とは別の層（同じクラス）にする */
      tail = function () { callout(group("k-hide3"), 24); callout(layer("k-m1"), 10); callout(layer("k-m2"), 26); };
    } else if (mode === "an") {
      /* 18 枚目：はじめは何も描かない表に、上限の曲線と赤の棒を、族ごとに足していく（出し入れは al210.css）。
         BSBS-1（サイトの bsbs-1.html）：hw3（= h1 の 11〜12 の式）と hw2（= 13〜16 の式）。11 ≤ n ≤ 25 の全体で、どちらの下でも重なる（重なるのは h < max(hw2, hw3)）。
         BSBS-2（bsbs-2.html）：φ1（= 17〜19 の式）は 16 ≤ n ≤ 25 で、μ2（= 20〜25 の式）は 14 ≤ n ≤ 25 で、その下では重なる
         （重なるのは、14・15 で h < μ3、16 以上で h < max(φ1, μ2)。μ3 は BSBS-1 の赤の中なので引かない）。
         BSBS-1 は、左の図（n = 25）で h を下げたときに先に重なり始める hw2 を 1 本目に、hw3 を 2 本目に。
         BSBS-2 は、範囲が増えていく感じを見せるため、増え方の小さい φ1 を先に。どこから来たかは見せず、曲線を 2 本引くだけ。
         赤の棒は、その高さより下は重なる、の意味で、段ごとに伸ばす：k1 = hw2 → k2 = max(k1, hw3) → k3 = max(k2, φ1) → k4 = max(k3, μ2) = h1
         （全部の n で h1 と一致し、どの上限もその下で重なり上で重ならないことを、スライドの図の座標で確かめた。checks/an_edges.js）。
         各族の最後に、赤の境目になる所だけを残す（BSBS-1 のあとは hw3・hw2 の境目、最後は h1 の 4 本） */
      const clip = "k-clip-" + (++clips);
      mk("rect", { x: M.l, y: M.t, width: pw, height: ph }, mk("clipPath", { id: clip }, mk("defs", {}, svg)));
      /* 曲線の白い縁は、赤の棒より下の層に置く（棒の上に置くと、棒の上の端が曲線に沿って斜めに削られて見えるため。白い縁は、曲線どうしが交わる所でだけ効く。9 枚目はそのまま） */
      const halos = mk("g", { "clip-path": "url(#" + clip + ")" }, svg), bars = mk("g", { "clip-path": "url(#" + clip + ")" }, svg);
      const lines = mk("g", { "clip-path": "url(#" + clip + ")" }, svg);
      for (let n = 11; n <= 25; n++) {
        const k = [H1[1](n)];
        k.push(Math.max(k[0], H1[0](n)));
        k.push(Math.max(k[1], n >= 16 ? H1[2](n) : 0));
        k.push(Math.max(k[2], n >= 14 ? H1[3](n) : 0));
        const y0 = Y(H_LO), y1 = Y(Math.max(k[3], H_LO)), full = y0 - y1;
        const st = k.map(function (h, i) { return "--k" + (i + 1) + ":" + (full > 0 ? (y0 - Y(Math.max(h, H_LO))) / full : 0).toFixed(4); }).join(";");
        mk("rect", { class: "k-ov an-bar", x: f(X(n) - bw / 2), width: f(bw), y: f(y1), height: f(full), style: st }, bars);
      }
      const curve = function (fn, from, to, cls, col) {
        let d = "";
        for (let i = 0; i <= 200; i++) {
          const n = from + (to - from) * i / 200;
          d += (i ? "L" : "M") + f(X(n)) + "," + f(Y(Math.max(H_LO / 2, Math.min(H_HI * 2, fn(n)))));
        }
        mk("path", { class: "an-curve " + cls + " k-halo", d: d }, halos);
        mk("path", { class: "an-curve " + cls + " k-curve " + col, d: d }, lines);
      };
      curve(H1[1], X_LO, X_HI, "an-c1", "h1b");                 // hw2（n = 25 で h を下げると、こちらが先に重なり始めるので 1 本目）
      curve(H1[0], X_LO, X_HI, "an-c2", "h1a");                 // hw3
      curve(H1[0], X_LO, SW1[0], "an-v an-v1", "h1a");          // BSBS-1 の赤の境目になる所だけ
      curve(H1[1], SW1[0], X_HI, "an-v an-v2", "h1b");
      curve(H1[2], 15.5, X_HI, "an-c3", "h1c");                 // φ1（16 ≤ n ≤ 25）
      curve(H1[3], 13.5, X_HI, "an-c4", "h1d");                 // μ2（14 ≤ n ≤ 25）
      const ends1 = [X_LO, SW1[0], SW1[1], SW1[2], X_HI];       // 最後に残す h1 の 4 本（9 枚目と同じ所で切る）
      /* 左の図の n を 25 から 11 へ替えながら打つ点（hw2 の辺の組がちょうど触れる高さ。出すのは figs/group.js の row） */
      for (let n = 11; n <= 25; n++) mk("circle", { class: "an-mk", "data-n": n, cx: f(X(n)), cy: f(Y(H1[1](n))), r: 4, opacity: 0 }, svg);
      /* 左の図の今の n・h の点（位置は figs/group.js の row が決める。そのために、縦の位置の決め方を svg に書いておく） */
      mk("circle", { class: "an-pt", cx: f(X(25)), cy: f(Y(1)), r: 4, opacity: 0 }, svg);
      /* BSBS-3（18 ≤ n ≤ 25）：各列の h1(n) から上へ伸ばす線と、左の図の今の n・h の点（どちらも位置と出し入れは figs/group.js の row） */
      const trails = mk("g", { "clip-path": "url(#" + clip + ")" }, svg);
      for (let n = 18; n <= 25; n++) mk("line", { class: "an-tr", "data-n": n, x1: f(X(n)), x2: f(X(n)), y1: f(Y(h1(n))), y2: f(Y(h1(n))), opacity: 0 }, trails);
      mk("circle", { class: "an-pt3", cx: f(X(18)), cy: f(Y(1)), r: 4, opacity: 0 }, svg);
      svg.setAttribute("data-y", [M.t, ph, LY0, LY1].join(","));
      ["h1a", "h1b", "h1c", "h1d"].forEach(function (c, i) { curve(H1[i], ends1[i], ends1[i + 1], "an-w", c); });
    } else if (mode === "sb") {
      /* 19 枚目：18 枚目の最後と同じ（h1 より下の赤の棒と、h1 の 4 本の曲線。BSBS-3 の段の青の線は消す）から始める。
         SBSBS-1（サイトの sbsbs-1.html）を解析して出る h2 の 2 本の曲線を引き、その上を赤に（.sb-h2）→ h1 と h2 の間を青に（.sb-blue。
         残りの族は、そこでは重ならない）。出し入れは al210.css（曲線は左から引き、上の赤は h2 の線から上へ伸ばし、間の青は一度に出す）。
         曲線の白い縁は、18 枚目と同じく棒より下の層に置く */
      const clip = "k-clip-" + (++clips);
      mk("rect", { x: M.l, y: M.t, width: pw, height: ph }, mk("clipPath", { id: clip }, mk("defs", {}, svg)));
      const cg = function (cls) { return mk("g", { class: cls, "clip-path": "url(#" + clip + ")" }, svg); };
      const halos = cg(""), lo = cg(""), hi = cg("sb-hi"), mid = cg("sb-mid"), lines = cg("");
      for (let n = 11; n <= 25; n++) {
        bar(lo, n, H_LO, h1(n), true);
        bar(hi, n, h2(n), H_HI, true);
        bar(mid, n, h1(n), h2(n), false);
      }
      const curve = function (fn, from, to, cls, col) {
        let d = "";
        for (let i = 0; i <= 200; i++) {
          const n = from + (to - from) * i / 200;
          d += (i ? "L" : "M") + f(X(n)) + "," + f(Y(Math.max(H_LO / 2, Math.min(H_HI * 2, fn(n)))));
        }
        mk("path", { class: "k-halo " + cls, d: d }, halos);
        mk("path", { class: "k-curve " + col + " " + cls, d: d }, lines);
      };
      const ends1 = [X_LO, SW1[0], SW1[1], SW1[2], X_HI], ends2 = [X_LO, SW2[0], X_HI];
      ["h1a", "h1b", "h1c", "h1d"].forEach(function (c, i) { curve(H1[i], ends1[i], ends1[i + 1], "", c); });
      ["h2a", "h2b"].forEach(function (c, i) { curve(H2[i], ends2[i], ends2[i + 1], "sb-c", c); });
    } else if (mode === "move") {
      /* 動く途中：8 枚目の最後と同じ棒を、表の枠で切って描く。
         v.cv が正のとき（19 枚目の最後）は、h1・h2 の曲線も、その濃さで、11 ≤ n ≤ 25 の表の範囲に描く（18 枚目と同じ太さ。動き始めに消していく） */
      const id = v.clip || "k-clip-move";
      mk("rect", { x: M.l, y: M.t, width: pw, height: ph }, mk("clipPath", { id: id }, mk("defs", {}, svg)));
      const halos = v.cv > 0 ? mk("g", { "clip-path": "url(#" + id + ")", opacity: v.cv.toFixed(3) }, svg) : null;
      const bars = mk("g", { "clip-path": "url(#" + id + ")" }, svg);
      for (let n = WIDE.nMin; n <= WIDE.nMax; n++) {
        if (n < X_LO - 1 || n > X_HI + 1) continue;
        if (n <= 10 || n >= 26) bar(bars, n, H_LO, H_HI, n >= 26); else middle(bars, n);
      }
      if (halos) {
        const lines = mk("g", { "clip-path": "url(#" + id + ")", opacity: v.cv.toFixed(3) }, svg);
        const curve = function (fn, from, to, col) {
          let d = "";
          for (let i = 0; i <= 200; i++) {
            const n = from + (to - from) * i / 200;
            d += (i ? "L" : "M") + f(X(n)) + "," + f(Y(Math.max(H_LO / 2, Math.min(H_HI * 2, fn(n)))));
          }
          mk("path", { class: "k-halo", d: d, style: "stroke-width: 7px" }, halos);
          mk("path", { class: "k-curve " + col, d: d, style: "stroke-width: 4px" }, lines);
        };
        const lo = ZOOM.nMin - 0.7, hi = ZOOM.nMax + 0.7, ends1 = [lo, SW1[0], SW1[1], SW1[2], hi], ends2 = [lo, SW2[0], hi];
        ["h1a", "h1b", "h1c", "h1d"].forEach(function (c, i) { curve(H1[i], ends1[i], ends1[i + 1], c); });
        ["h2a", "h2b"].forEach(function (c, i) { curve(H2[i], ends2[i], ends2[i + 1], c); });
      }
    } else {
      const bars = group("k-bars");
      for (let n = 11; n <= 25; n++) middle(bars, n);
      /* 曲線：その式を使う n の範囲（from〜to）に引く。表の枠からはみ出す分は切る。
         赤や青の棒の上でも線の位置がわかるように、下に白い縁（k-halo）を敷く。白い縁は、隣の曲線の端を隠さないように、
         全部の曲線より下の層にまとめる（どちらの層も、その式の行が出たら見せる） */
      const clip = "k-clip-" + (++clips);
      mk("rect", { x: M.l, y: M.t, width: pw, height: ph }, mk("clipPath", { id: clip }, mk("defs", {}, svg)));
      const halos = mk("g", { "clip-path": "url(#" + clip + ")" }, svg), lines = mk("g", { "clip-path": "url(#" + clip + ")" }, svg);
      const curve = function (fn, from, to, cls) {
        let d = "";
        for (let i = 0; i <= 200; i++) {
          const n = from + (to - from) * i / 200;
          d += (i ? "L" : "M") + f(X(n)) + "," + f(Y(Math.max(H_LO / 2, Math.min(H_HI * 2, fn(n)))));
        }
        mk("path", { class: "k-layer k-c-" + cls + " k-halo", d: d }, halos);
        mk("path", { class: "k-layer k-c-" + cls + " k-curve " + cls, d: d }, lines);
      };
      const ends1 = [X_LO, SW1[0], SW1[1], SW1[2], X_HI], ends2 = [X_LO, SW2[0], X_HI];
      ["h1a", "h1b", "h1c", "h1d"].forEach(function (c, i) { curve(H1[i], ends1[i], ends1[i + 1], c); });
      ["h2a", "h2b"].forEach(function (c, i) { curve(H2[i], ends2[i], ends2[i + 1], c); });
    }

    /* 枠・目盛り・字 */
    mk("rect", { class: "k-frame", x: M.l, y: M.t, width: pw, height: ph }, svg);
    ticksN.forEach(function (n) {
      mk("line", { class: "k-tick", x1: f(X(n)), x2: f(X(n)), y1: M.t + ph, y2: M.t + ph + 5 }, svg);
      txt(f(X(n)), M.t + ph + 26, String(n), { class: "k-num", "text-anchor": "middle" }, svg);
    });
    ticksH.forEach(function (t) {
      mk("line", { class: "k-tick", x1: M.l - (t.major ? 6 : 3), x2: M.l, y1: f(Y(t.h)), y2: f(Y(t.h)) }, svg);
      if (t.major) txt(M.l - 10, f(Y(t.h)), String(t.h), { class: "k-num", "text-anchor": "end", "dominant-baseline": "central" }, svg);
    });
    const title = function (x, y, before, v, after, attrs) {
      const t = txt(x, y, before, Object.assign({ class: "k-title", "text-anchor": "middle" }, attrs || {}), svg);
      mk("tspan", { class: "k-var" }, t).textContent = v;
      if (after) mk("tspan", {}, t).textContent = after;
    };
    title(f(M.l + pw / 2), H - 12, "正 ", "n", " 角形");
    /* 「高さ h」は縦書きにして左に置く。9 枚目は目盛りの字が短い（0.1・1・10）ので、表に 10px 寄せる */
    title(0, 0, "高さ ", "h", "", { transform: "translate(" + f(v.tx) + " " + f(M.t + ph / 2) + ") rotate(-90)" });
    tail();
  }
  /* 8 枚目から 9 枚目へ：9 枚目の表を、8 枚目の表の位置・大きさ・範囲から、9 枚目の位置・大きさ・範囲へ MOVE ミリ秒で動かす
     （位置と大きさはそのまま、n はそのまま、h は対数でつなぐ）。動く間は毎回描き直し、終わったら 9 枚目の形で描き直す。
     右の式は、表が寄り終わるころに出す。ページを組み立て終えてから始める */
  const MOVE = 900;
  /* 図の左上の、スライドの中の座標（ステージの拡大縮小を除く） */
  const corner = function (svg) {
    const s = svg.closest("slide").getBoundingClientRect(), r = svg.getBoundingClientRect(), k = s.width / 904;
    return [(r.left - s.left) / k, (r.top - s.top) / k];
  };
  function zoomIn() {
    const big = document.getElementById("main-plot"), small = document.getElementById("zoom-plot");
    if (!big || !small) return;
    const from = big.closest(".page"), to = small.closest(".page");
    const clear = function () { while (small.firstChild) small.removeChild(small.firstChild); };
    const size = function (W, H) {
      small.setAttribute("width", W.toFixed(1)); small.setAttribute("height", H.toFixed(1));
      small.setAttribute("viewBox", "0 0 " + W.toFixed(1) + " " + H.toFixed(1));
    };
    const W1 = +small.getAttribute("width"), H1 = +small.getAttribute("height");
    let raf = 0, fade = null;
    function done() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      size(W1, H1); small.style.transform = ""; clear(); setup(small, "zoom");
      if (fade) fade.finish();
      RUNNING.delete(self);
    }
    const self = { finish: done };
    function play() {
      /* 8 枚目はもう隠れているので、一瞬だけ表示の扱いに戻して位置を測る（描かれる前に戻すので、画面には出ない） */
      from.style.display = "block";
      const p0 = corner(big);
      from.style.display = "";
      const p1 = corner(small), W0 = +big.getAttribute("width"), H0 = +big.getAttribute("height");
      const a = [WIDE.nMin - 0.7, WIDE.nMax + 0.7, Math.log10(WIDE.hLo), Math.log10(WIDE.hHi), 22];
      const b = [ZOOM.nMin - 0.7, ZOOM.nMax + 0.7, Math.log10(ZOOM.hLo), Math.log10(ZOOM.hHi), 32];
      const formulas = to.querySelector(".formulas");
      fade = formulas ? formulas.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: MOVE + 300 }) : null;
      const t0 = performance.now();
      function frame(now) {
        const t = Math.min(1, (now - t0) / MOVE);
        if (t >= 1) { done(); return; }
        const k = ease(t), L = function (u, w) { return u + (w - u) * k; }, c = a.map(function (u, i) { return L(u, b[i]); });
        const W = L(W0, W1), H = L(H0, H1);
        size(W, H);
        small.style.transform = "translate(" + (L(p0[0], p1[0]) - p1[0]).toFixed(2) + "px," + (L(p0[1], p1[1]) - p1[1]).toFixed(2) + "px)";
        clear();
        setup(small, "move", { xLo: c[0], xHi: c[1], hLo: Math.pow(10, c[2]), hHi: Math.pow(10, c[3]), W: W, H: H, tx: c[4] });
        raf = requestAnimationFrame(frame);
      }
      RUNNING.add(self);
      raf = requestAnimationFrame(frame);
    }
    /* 8 枚目の出し入れを見る。8 枚目から 9 枚目へ移るときは、8 枚目が消えた時点で 9 枚目はもう出ている */
    new MutationObserver(function (recs) {
      const left = recs.some(function (r) { return r.target === from; }) && !from.classList.contains("on");
      if (left && to.classList.contains("on") && !to.querySelector("[step].on")) play();
    }).observe(from, { attributes: true, attributeFilter: ["class"] });
  }
  document.addEventListener("DOMContentLoaded", zoomIn);
  /* 19 枚目の最後（目印 .sb-all）：右下の表を、h1・h2 の曲線を消しながら、8 枚目の表と同じ大きさ・位置・範囲へ広げ、8 枚目の棒を出したときの形にする。
     動きは zoomIn の逆向き。← で戻るときは動かさない。
     svg は 8 枚目と同じ所に置いてあり（al210.html・al210.css）、動く間は、その大きさを変え、右下の表の位置から動かして描く */
  function sball(svg, still) {
    const slide = svg.closest("slide"), m = slide.querySelector(".sb-all"), small = slide.querySelector(".sb-plot svg");
    const W1 = +svg.getAttribute("width"), H1 = +svg.getAttribute("height");
    const clear = function () { while (svg.firstChild) svg.removeChild(svg.firstChild); };
    const size = function (W, H) {
      svg.setAttribute("width", W.toFixed(1)); svg.setAttribute("height", H.toFixed(1));
      svg.setAttribute("viewBox", "0 0 " + W.toFixed(1) + " " + H.toFixed(1));
    };
    const none = function () { size(W1, H1); svg.style.transform = ""; clear(); };
    const fin = function () { none(); setup(svg, "main"); };
    if (still) { if (m.classList.contains("on")) fin(); else none(); return; }
    none();
    const a = [ZOOM.nMin - 0.7, ZOOM.nMax + 0.7, Math.log10(ZOOM.hLo), Math.log10(ZOOM.hHi), 32];
    const b = [WIDE.nMin - 0.7, WIDE.nMax + 0.7, Math.log10(WIDE.hLo), Math.log10(WIDE.hHi), 22];
    let p0 = null, p1 = null, W0 = 0, H0 = 0;
    follow(m, function (t) {
      if (t <= 0) { none(); p0 = null; return; }
      if (t >= 1) { fin(); return; }
      if (!p0) { none(); p0 = corner(small); p1 = corner(svg); W0 = +small.getAttribute("width"); H0 = +small.getAttribute("height"); }
      const k = ease(t), L = function (u, w) { return u + (w - u) * k; }, c = a.map(function (u, i) { return L(u, b[i]); });
      const W = L(W0, W1), H = L(H0, H1);
      size(W, H);
      svg.style.transform = "translate(" + (L(p0[0], p1[0]) - p1[0]).toFixed(2) + "px," + (L(p0[1], p1[1]) - p1[1]).toFixed(2) + "px)";
      clear();
      setup(svg, "move", { xLo: c[0], xHi: c[1], hLo: Math.pow(10, c[2]), hHi: Math.pow(10, c[3]), W: W, H: H, tx: c[4],
                           cv: 1 - Math.min(1, t / 0.3), clip: "k-clip-sball" });
    }, MOVE, 0);
  }

  return { p: function (svg) { setup(svg, "known"); }, m: function (svg) { setup(svg, "main"); }, z: function (svg) { setup(svg, "zoom"); },
           a: function (svg) { setup(svg, "an"); }, s: function (svg) { setup(svg, "sb"); }, all: sball,
           h1: h1, h2: h2, H1: H1 };
})();
figure("known-plot", KNOWN.p);
figure("main-plot", KNOWN.m);
figure("zoom-plot", KNOWN.z);
