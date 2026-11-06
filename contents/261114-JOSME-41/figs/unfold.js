/* ===== 第 41 回 OSME-J のスライドの図：2 枚目の、立方体を切り開くアニメーション（common.js の道具を使う）===== */
/* 面を木でつなぎ、親の面との辺（ヒンジ）のまわりに回して開く。
   展開図の上の座標（z = 0 の平面、1 辺の長さ 1）で面を書いておき、
   折り角 90° × (1 − t) だけ親の側へ回してから、親の面の変換をかける（t = 0 で立方体、t = 1 で展開図）。
   図の中の目印（何も表示しない <span step class="unfold-mark">）が出たら開き、消えたら閉じる。
   切る線は、はじめは細く、「各立方体を太線に沿って切ると …」（item step class="cut-lines"）が出たら太くする。
   クリックの順は、その一文と太線 → (a) が開く → (b) が開く → 2 つのキャプション → (a) を囲む赤枠。
   ページを移ったとき（← で次のページから戻ったときを含む）は、動かさずにすぐその状態で描く */
var UNFOLD = (function () {
  function center(poly) {
    const c = [0, 0, 0];
    poly.forEach(function (q) { c[0] += q[0]; c[1] += q[1]; });
    return [c[0] / poly.length, c[1] / poly.length, 0];
  }

  /* faces：{ id, poly: [[x, y], …], parent: id, hinge: [[x, y], [x, y]] }（根の面は parent なし） */
  /* still：ページの写し用（動かさずに、出ている段階表示のとおりに描く） */
  function setup(svg, faces, still) {
    const byId = {};
    faces.forEach(function (f) {
      f.pts = f.poly.map(function (q) { return [q[0], q[1], 0]; });
      byId[f.id] = f;
    });
    /* 回す向き：子の面が、親の面の表（+z、立方体の内側）の側へ立つ向き */
    faces.forEach(function (f) {
      if (!f.parent) return;
      const a = [f.hinge[0][0], f.hinge[0][1], 0], b = [f.hinge[1][0], f.hinge[1][1], 0];
      f.o = a; f.u = norm(sub(b, a));
      f.sign = rot(center(f.poly), f.o, f.u, Math.PI / 2)[2] > 0 ? 1 : -1;
    });
    /* 辺の太さ：ヒンジ（自分の親との辺と、子との辺）は細く、それ以外（切る線）は太く */
    function same(p, q) { return Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9; }
    function isHinge(p, q) {
      return faces.some(function (f) {
        return f.parent && ((same(p, f.hinge[0]) && same(q, f.hinge[1])) || (same(p, f.hinge[1]) && same(q, f.hinge[0])));
      });
    }
    faces.forEach(function (f) {
      f.cut = f.poly.map(function (q, i) { return !isHinge(q, f.poly[(i + 1) % f.poly.length]); });
      /* 立方体の辺ではない線（(b) の上面の対角線。長さが 1 でない）は、切る線を見せるまで描かない */
      f.diag = f.poly.map(function (q, i) {
        const n = f.poly[(i + 1) % f.poly.length];
        return Math.abs(Math.hypot(n[0] - q[0], n[1] - q[1]) - 1) > 1e-9;
      });
    });

    /* t での各面の 3 次元の点。親から順に、展開図の座標のまま回してから親の変換をかける */
    function place(f, t) {
      let pts = f.pts;
      for (let g = f; g.parent; g = byId[g.parent]) {
        const th = g.sign * (Math.PI / 2) * (1 - t);
        pts = pts.map(function (p) { return rot(p, g.o, g.u, th); });
      }
      return pts;
    }

    const W = 440, H = 250;
    const group = mk("g", {}, svg);
    function draw(t) {
      t = Math.max(0, Math.min(1, t));
      const k = ease(t);
      /* カメラ：はじめは Mathematica の既定の視点の向きから、開き終わると真上から（展開図を正面から見る形） */
      const az = MMA_AZ * (1 - k), el = MMA_EL + (Math.PI / 2 - MMA_EL) * k;
      const cam = camera(az, el), c = cam.c, r = cam.r, up = cam.up;
      const items = faces.map(function (f) {
        const pts = place(f, t);
        const xy = pts.map(function (p) { return [dot(p, r), -dot(p, up)]; });
        const depth = pts.reduce(function (s, p) { return s + dot(p, c); }, 0) / pts.length;
        /* 面の向き（画面のこちら側を向くほうに取る）から色を引く */
        let nrm = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
        if (dot(nrm, c) < 0) nrm = mul(nrm, -1);
        return { f: f, xy: xy, depth: depth, fill: shadeToWhite(dot(nrm, r), dot(nrm, up), k) };
      });
      /* 絵の真ん中を図の真ん中に置く */
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      items.forEach(function (it) { it.xy.forEach(function (q) {
        x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
      }); });
      /* 1 辺を何 px で描くか：はじめの立方体は 100px、開き終えた展開図は 64px（(b) の幅 5 が収まる大きさ）。
         途中で図の枠からはみ出さないよう、枠に収まる大きさを上限にする */
      const S = Math.min(100 - 36 * k, 0.96 * W / (x1 - x0), 0.96 * H / (y1 - y0));
      const dx = W / 2 - S * (x0 + x1) / 2, dy = H / 2 - S * (y0 + y1) / 2;
      /* 奥の面から描く */
      items.sort(function (a, b) { return a.depth - b.depth; });
      while (group.firstChild) group.removeChild(group.firstChild);
      items.forEach(function (it) {
        const P = it.xy.map(function (q) { return [dx + S * q[0], dy + S * q[1]]; });
        mk("polygon", { points: P.map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" "),
                        /* 塗りと同じ色の細い縁で、隣り合う面（(b) の上面の三角形 2 つ）の継ぎ目のすき間を埋める */
                        fill: it.fill, stroke: it.fill, "stroke-width": 0.6, "stroke-linejoin": "round" }, group);
        P.forEach(function (q, i) {
          if (it.f.diag[i] && !showCuts) return;
          const n = P[(i + 1) % P.length];
          mk("line", { x1: q[0].toFixed(2), y1: q[1].toFixed(2), x2: n[0].toFixed(2), y2: n[1].toFixed(2),
                       stroke: "#000", "stroke-width": it.f.cut[i] && showCuts ? 4 : 1.2, "stroke-linecap": "round" }, group);
        });
      });
    }

    const mark = svg.closest("figure").querySelector("[step]");
    /* 切る線を太くするかどうか：「各立方体を太線に沿って切ると …」が出ているとき */
    const cutLines = svg.closest("slide").querySelector(".cut-lines");
    let showCuts = false;
    if (still) {
      showCuts = cutLines.classList.contains("on");
      draw(mark.classList.contains("on") ? 1 : 0);
      return;
    }
    /* 目印が出たら開き（1.2 秒）、消えたら閉じる（0.4 秒。戻すときは速く） */
    const now = follow(mark, draw, 1200, 400);
    new MutationObserver(function () {
      showCuts = cutLines.classList.contains("on");
      draw(now());
    }).observe(cutLines, { attributes: true, attributeFilter: ["class"] });
    draw(0);
  }

  /* 底面を [0, 1] × [0, 1] に置き、4 つの側面を底面に付ける（両方の図で同じ） */
  function base() {
    return [
      { id: "bottom", poly: [[0, 0], [1, 0], [1, 1], [0, 1]] },
      { id: "front", poly: [[0, -1], [1, -1], [1, 0], [0, 0]], parent: "bottom", hinge: [[0, 0], [1, 0]] },
      { id: "back",  poly: [[0, 1], [1, 1], [1, 2], [0, 2]],  parent: "bottom", hinge: [[0, 1], [1, 1]] },
      { id: "left",  poly: [[-1, 0], [0, 0], [0, 1], [-1, 1]], parent: "bottom", hinge: [[0, 0], [0, 1]] },
      { id: "right", poly: [[1, 0], [2, 0], [2, 1], [1, 1]],  parent: "bottom", hinge: [[1, 0], [1, 1]] }
    ];
  }
  return {
    /* (a) 辺展開図：上面を右の側面に付ける（十字になる） */
    a: function (svg, still) {
      setup(svg, base().concat([
        { id: "top", poly: [[2, 0], [3, 0], [3, 1], [2, 1]], parent: "right", hinge: [[2, 0], [2, 1]] }
      ]), still);
    },
    /* (b) 一般展開図：上面を対角線で 2 つの三角形に切り、左右の側面にそれぞれ付ける */
    b: function (svg, still) {
      setup(svg, base().concat([
        { id: "top-left",  poly: [[-1, 0], [-1, 1], [-2, 1]], parent: "left",  hinge: [[-1, 0], [-1, 1]] },
        { id: "top-right", poly: [[2, 0], [2, 1], [3, 0]],    parent: "right", hinge: [[2, 0], [2, 1]] }
      ]), still);
    }
  };
})();
figure("unfold-a", UNFOLD.a);
figure("unfold-b", UNFOLD.b);
