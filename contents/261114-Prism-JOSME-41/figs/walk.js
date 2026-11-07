/* ===== 第 41 回 OSME-J のスライドの図：11 枚目の右上の正 10 角柱（B と S の決まりと、7 つのパターンを、角柱の面で見せる）===== */
/* 下の 7 つの図と同じ正 10 角柱を、Mathematica の既定の視点で描く。高さは 6.2（置き場所が縦長なので、細長くして側面を大きく見せる。下の図の高さ 1.4 とは違う）。左の文と箱に近づきすぎないよう、幅は図の枠の 78% までにする。
   下の底面も見えるように、面は透かして描き、色を付けた面（底面は青、帯は緑。下の 7 つの図と同じ色）だけを濃くする。
   B・S の字は、その面と同じ重なり順で描く（面のすぐ後）ので、下の底面の B や裏の帯の S は、手前の側面の下に透けて見える。
   段階表示に合わせて描き分ける：
     walk-b（B の決まり）：2 枚の底面を青にして B を書く
     walk-s（S の決まり）：続く 3 枚の側面を緑の 1 つの帯にして S を書く（底面の色は消して、帯だけにする）
     下の 7 つの図（figure[data-pattern]。1 枚ずつ出る）と、図のない SB・SBSB の目印（span.walk-mark[data-pattern]。説明で触れるので、
       角柱だけを進める）：いちばん後に出たもののパターンの面を、角柱の上で色付けする（図が出るのと同期して、角柱の面も出てくる）
   ← で戻したときと、ページを移ったときも、出ている段階表示のとおりの形で描く */
var WALK = (function () {
  const N = 10, H = 6.2;
  const COLOR = { base: { fill: "#a9d8f4", edge: "#1d81e9", ink: "#1d2088" }, band: { fill: "#b7e4c4", edge: "#1a8502", ink: "#006030" } };
  /* パターンごとの面：底面は上（"top"）・下（"bottom"）、帯は側面の番号（0 が正面、1, 2, … が右回り）の並び。
     B で始まるもの（B → BS → BSB → BSBS）と、S で始まるもの（S → SBS → SBSBS。SB と SBSB は BS・BSBS を逆から読んだものなので、図はない）は、
     それぞれ 1 本のパスを伸ばしていく形にし、前のパターンの面を残したまま足していく。
     そのため帯の長さは下の図と同じとは限らない。帯は、手前の右（1, 2）・左（8, 9）と、裏（4, 5）を使う */
  const PATTERNS = {
    B: [["base", "top"]],
    BS: [["base", "top"], ["band", [1, 2]]],
    BSB: [["base", "top"], ["band", [1, 2]], ["base", "bottom"]],
    BSBS: [["base", "top"], ["band", [1, 2]], ["base", "bottom"], ["band", [8, 9]]],
    S: [["band", [8, 9]]],
    SB: [["band", [8, 9]], ["base", "top"]],
    SBS: [["band", [8, 9]], ["base", "top"], ["band", [1, 2]]],
    SBSB: [["band", [8, 9]], ["base", "top"], ["band", [1, 2]], ["base", "bottom"]],
    SBSBS: [["band", [8, 9]], ["base", "top"], ["band", [1, 2]], ["base", "bottom"], ["band", [4, 5]]]
  };

  function setup(svg, still) {
    const W = +svg.getAttribute("width"), Hs = +svg.getAttribute("height");
    const cam = camera(MMA_AZ, MMA_EL), c = cam.c, r = cam.r, up = cam.up;
    /* 側面 0 が正面（カメラの水平の向き）を向くように回す */
    const a0 = Math.atan2(c[1], c[0]) - Math.PI / N, R = 1 / (2 * Math.sin(Math.PI / N)), ring = [];
    for (let i = 0; i < N; i++) ring.push([R * Math.cos(a0 + 2 * Math.PI * i / N), R * Math.sin(a0 + 2 * Math.PI * i / N)]);
    const faces = { bottom: ring.map(function (q) { return [q[0], q[1], 0]; }), top: ring.map(function (q) { return [q[0], q[1], H]; }) };
    ring.forEach(function (q, i) {
      const p = ring[(i + 1) % N];
      faces[i] = [[q[0], q[1], 0], [p[0], p[1], 0], [p[0], p[1], H], [q[0], q[1], H]];
    });
    /* 図の枠に収める */
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    Object.keys(faces).forEach(function (k) { faces[k].forEach(function (p) {
      const x = dot(p, r), y = -dot(p, up);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }); });
    const S = Math.min(0.78 * W / (x1 - x0), 0.96 * Hs / (y1 - y0));
    const dx = W / 2 - S * (x0 + x1) / 2, dy = Hs / 2 - S * (y0 + y1) / 2;
    const at = function (p) { return [dx + S * dot(p, r), dy - S * dot(p, up)]; };
    const mid = function (pts) { return mul(pts.reduce(add, [0, 0, 0]), 1 / pts.length); };
    /* 底面の B を書く場所：上の底面は手前寄り（裏の帯の S と離すため）、下の底面は真ん中 */
    const fa = Math.atan2(c[1], c[0]);
    const BASE_AT = { top: [0.45 * R * Math.cos(fa), 0.45 * R * Math.sin(fa), H], bottom: [0, 0, 0] };
    const f2 = function (v) { return v.toFixed(2); };

    /* 状態 st：{ on: { 面: "base" | "band" }, labels: [[種類, 3 次元の点, 重なり順を合わせる面]] } */
    function draw(st) {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const items = Object.keys(faces).map(function (k) {
        const pts = faces[k];
        let nrm = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
        if (dot(nrm, c) < 0) nrm = mul(nrm, -1);
        return { k: k, pts: pts, depth: pts.reduce(function (s, p) { return s + dot(p, c); }, 0) / pts.length, fill: shade(dot(nrm, r), dot(nrm, up)) };
      });
      items.sort(function (a, b) { return a.depth - b.depth; });
      items.forEach(function (it) {
        const kind = st.on[it.k], col = kind && COLOR[kind];
        mk("polygon", { points: it.pts.map(at).map(function (q) { return f2(q[0]) + "," + f2(q[1]); }).join(" "),
                        fill: col ? col.fill : it.fill, "fill-opacity": col ? 0.9 : 0.3,
                        stroke: col ? col.edge : "#333", "stroke-width": col ? 1.5 : 0.8, "stroke-linejoin": "round" }, svg);
        st.labels.filter(function (l) { return l[2] === it.k; }).forEach(function (l) {
          const q = at(l[1]);
          txt(f2(q[0]), f2(q[1]), l[0] === "base" ? "B" : "S", { class: "walk-label", fill: COLOR[l[0]].ink, "text-anchor": "middle", dy: "0.35em" }, svg);
        });
      });
    }

    /* 帯の S は帯の真ん中に書き、帯のいちばん手前の面と同じ重なり順にする。ただし裏側の帯は、上の底面の B と重ならないよう、
       帯の下寄り（高さの 0.25）に書く（手前の側面の下に透けて見える） */
    function bandLabel(band) {
      const m = mid([].concat.apply([], band.map(function (k) { return faces[k]; })));
      if (m[0] * c[0] + m[1] * c[1] < 0) m[2] = 0.25 * H;
      const front = band.reduce(function (a, k) { return dot(mid(faces[k]), c) > dot(mid(faces[a]), c) ? k : a; });
      return ["band", m, String(front)];
    }
    /* パターンの面と字 */
    function pattern(segs) {
      const st = { on: {}, labels: [] };
      segs.forEach(function (s) {
        if (s[0] === "base") { st.on[s[1]] = "base"; st.labels.push(["base", BASE_AT[s[1]], s[1]]); }
        else { s[1].forEach(function (k) { st.on[k] = "band"; }); st.labels.push(bandLabel(s[1])); }
      });
      return st;
    }
    const slide = svg.closest("slide");
    const mb = slide.querySelector(".walk-b"), ms = slide.querySelector(".walk-s"), thm = slide.querySelector(".pat-thm");
    const figs = [].slice.call(slide.querySelectorAll("[data-pattern]"));     // 図と、SB・SBSB の目印（ページの中の並び順）
    /* 出ている段階表示のとおりの形：出ている図のうちいちばん後のもの → 定理が出ていれば何も色付けしない→
       S の決まり → B の決まり → 何もなし */
    function current() {
      const shown = figs.filter(function (f) { return f.classList.contains("on"); });
      if (shown.length) return pattern(PATTERNS[shown[shown.length - 1].getAttribute("data-pattern")]);
      if (thm.classList.contains("on")) return { on: {}, labels: [] };
      if (ms.classList.contains("on")) return pattern([["band", [9, 0, 1]]]);     // S の決まりのときは、帯だけ（底面の色は消す）
      if (mb.classList.contains("on")) return pattern([["base", "top"], ["base", "bottom"]]);
      return { on: {}, labels: [] };
    }
    draw(current());
    if (still) return;
    [mb, ms, thm].concat(figs).forEach(function (m) { watchStep(m, function () { draw(current()); }); });
  }
  return { p: setup };
})();
figure("walk-10", WALK.p);
