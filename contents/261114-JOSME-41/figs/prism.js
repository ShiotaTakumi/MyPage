/* ===== 第 41 回 OSME-J のスライドの図：3 枚目の正 n 角柱（common.js の道具を使う）===== */
/* Mathematica の既定の視点と光で描く（底面の辺の長さを 1、底面を z = 0 に置く）。
   ラベル（上面・底面・側面。それぞれ step）が 1 つ出るたび（クリック）に、その面を 1 回だけ光らせる
   （それぞれの色がぼやっと出て、ぼやっと消える）。終わると元の色に戻る（ラベルは残る）。
   底面は側面と上面の陰で見えないので、先に全体を透かしてから光らせ、終わったら透かしを戻す。
   ← でラベルを消したときと、ページを移ったとき（← で次のページから戻ったときを含む）は、光らせずに元の色ですぐ見せる */
var PRISM = (function () {
  /* 役割ごとの色（Okabe–Ito の配色から。色覚の違いがあっても見分けやすい）。ラベルの字の色は 41OSME-J.css */
  const ROLE = { top: [230, 159, 0], side: [0, 158, 115], bottom: [0, 114, 178] };
  /* 面に塗るときは、白に PALE の割合だけ寄せる（Mathematica の明るさに合わせる） */
  const PALE = 0.4;
  function lum(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  /* 陰影の基準：上面・底面は真上を向いた面、側面は正面を向いた面の明るさ。これと同じ明るさの面は役割の色そのまま、
     明るい面・暗い面は、Mathematica の色の明るさの比だけ明るく・暗くする */
  const REF = { top: lum(shadeRGB(0, Math.cos(MMA_EL))), side: lum(shadeRGB(0, -Math.sin(MMA_EL))) };
  REF.bottom = REF.top;
  function tint(role, rgb) {
    const f = lum(rgb) / REF[role];
    return ROLE[role].map(function (v) {
      v = v + (255 - v) * PALE;
      return f < 1 ? v * f : v + (255 - v) * Math.min(1, f - 1);
    });
  }
  function mix(a, b, k) { return a.map(function (v, i) { return Math.round(v + (b[i] - v) * k); }); }
  /* 光らせる長さ：GLOW ミリ秒（前半で色が出て、後半で消える）。
     底面のときは、その前に FADE ミリ秒で全体を透かし（面の不透明度を CLEAR に）、光らせたあとで FADE ミリ秒で戻す */
  const GLOW = 1800, FADE = 600, CLEAR = 0.25;
  /* 2 つの図の描く関数（2 つ同時に光らせる） */
  const draws = [];

  /* n：角の数、h：高さ（底面の辺の長さを 1 とする） */
  function setup(svg, n, h) {
    const W = +svg.getAttribute("width"), H = +svg.getAttribute("height");
    const cam = camera(MMA_AZ, MMA_EL), c = cam.c, r = cam.r, up = cam.up;
    /* 側面の 1 枚が正面（カメラの水平の向き）を向くように回す */
    const a0 = Math.atan2(c[1], c[0]) - Math.PI / n, R = 1 / (2 * Math.sin(Math.PI / n)), ring = [];   // R：外接円の半径
    for (let i = 0; i < n; i++) ring.push([R * Math.cos(a0 + 2 * Math.PI * i / n), R * Math.sin(a0 + 2 * Math.PI * i / n)]);
    const faces = [
      { role: "bottom", pts: ring.map(function (q) { return [q[0], q[1], 0]; }) },
      { role: "top", pts: ring.map(function (q) { return [q[0], q[1], h]; }) }
    ];
    ring.forEach(function (q, i) {
      const p = ring[(i + 1) % n];
      faces.push({ role: "side", pts: [[q[0], q[1], 0], [p[0], p[1], 0], [p[0], p[1], h], [q[0], q[1], h]] });
    });
    /* 図に収まる大きさにし、真ん中に置く */
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    faces.forEach(function (f) { f.pts.forEach(function (p) {
      const x = dot(p, r), y = -dot(p, up);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }); });
    const S = Math.min(0.96 * W / (x1 - x0), 0.96 * H / (y1 - y0));
    const dx = W / 2 - S * (x0 + x1) / 2, dy = H / 2 - S * (y0 + y1) / 2;

    const group = mk("g", {}, svg);
    /* lit：光らせている面の役割（"top"・"bottom"・"side"。なければ null）、k：その明るさ（0〜1）、
       clear：全体を透かす割合（0〜1。1 で面の不透明度が CLEAR） */
    function draw(lit, k, clear) {
      const base = 1 - (1 - CLEAR) * clear;
      const items = faces.map(function (f) {
        const depth = f.pts.reduce(function (s, p) { return s + dot(p, c); }, 0) / f.pts.length;
        let nrm = norm(cross(sub(f.pts[1], f.pts[0]), sub(f.pts[2], f.pts[0])));
        if (dot(nrm, c) < 0) nrm = mul(nrm, -1);
        const rest = shadeRGB(dot(nrm, r), dot(nrm, up));
        /* 光らせている面は、色を役割の色へ寄せ、透かしているときも k の分だけ不透明に戻す */
        const on = f.role === lit ? k : 0;
        return { pts: f.pts, depth: depth, fill: "rgb(" + mix(rest, tint(f.role, rest), on).join(",") + ")", op: base + (1 - base) * on };
      });
      /* 奥の面から描く */
      items.sort(function (a, b) { return a.depth - b.depth; });
      while (group.firstChild) group.removeChild(group.firstChild);
      function poly(pts, attrs) {
        const P = pts.map(function (p) { return [dx + S * dot(p, r), dy - S * dot(p, up)]; });
        mk("polygon", Object.assign({ points: P.map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" "),
                                      stroke: "#000", "stroke-width": 1.2, "stroke-linejoin": "round" }, attrs), group);
      }
      items.forEach(function (it) { poly(it.pts, { fill: it.fill, "fill-opacity": it.op.toFixed(3) }); });
    }
    draw(null, 0, 0);
    draws.push(draw);
    if (draws.length === 1) glow(svg.closest("slide").querySelector(".prism-labels"));
  }

  /* ラベルが出たら、その面を光らせ始める（前の面が光っている途中なら止める）。
     ← でそのラベルを消したときと、ページを移ったときは、止めて元の色で描く */
  function glow(labels) {
    let raf = 0, t0 = 0, lit = null;
    function paint(k, clear) { draws.forEach(function (d) { d(lit, k, clear); }); }
    /* 光らせている途中なら RUNNING に入れておく（最後の形は、元の色に戻った形） */
    const self = { finish: function () { stop(); } };
    function stop() { cancelAnimationFrame(raf); raf = 0; lit = null; RUNNING.delete(self); paint(0, 0); }
    function frame(now) {
      /* 描画の時刻が始めの時刻より前に来ることがあるので、0 より小さくしない */
      let x = Math.max(0, now - t0), clear = 0;
      /* 底面：先に透かす */
      if (lit === "bottom") { clear = ease(Math.min(1, x / FADE)); x -= FADE; }
      if (x < GLOW) {
        /* 明るさ k は sin² の山 1 つ（0 からなめらかに 1 まで上がって、0 に戻る） */
        paint(x > 0 ? Math.pow(Math.sin(Math.PI * x / GLOW), 2) : 0, clear);
        raf = requestAnimationFrame(frame);
      } else if (lit === "bottom" && x < GLOW + FADE) {
        /* 底面：光らせたあとで透かしを戻す */
        paint(0, 1 - ease((x - GLOW) / FADE));
        raf = requestAnimationFrame(frame);
      } else stop();
    }
    ["top", "bottom", "side"].forEach(function (role) {
      watchStep(labels.querySelector(".prism-" + role), function (on, moved) {
        if (on && !moved) { stop(); lit = role; t0 = performance.now(); raf = requestAnimationFrame(frame); RUNNING.add(self); }
        else if (moved || lit === role) stop();
      });
    });
  }
  return {
    /* 細長い正 12 角柱（高さ 15）と、平たい正 15 角柱（高さ 0.2）。冬の LA と同じ、Schlickenrieder がスケッチした 2 つ */
    p12: function (svg) { setup(svg, 12, 15); },
    p15: function (svg) { setup(svg, 15, 0.2); }
  };
})();
FIG["prism-12"] = PRISM.p12;
FIG["prism-15"] = PRISM.p15;
