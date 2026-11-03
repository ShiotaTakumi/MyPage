/* ===== AL210 のスライドの図：13 枚目の、パラメータで決まるパス状の部分展開図（手で動かせる）===== */
/* 右の操作の欄（<div class="en-ctl">）で、パターン（BSBS・SBSBS の切り替えボタン）、n と、パラメータ ℓ0・p1・d1・ℓ1・p2・d2・ℓ2 を変えられる
   （h は 1 に決めておく。列挙するのはどの側面をどうつなぐかで、h によらないので）
   （d は +1・−1 の切り替えボタン、ほかはバー。BSBS のときは S1 がないので、p1・d1・ℓ1 の欄を薄くして止める）。
   同じ側面を 2 回使う組は、パス状の部分展開図にならないので、図を薄くして「Invalid」と出す。両端の面（S1（BSBS では B1）と S2）の重なりは赤。
   面の組み立ては補助資料サイトの図 4 と同じ考え方：角柱の頂点に番号を付け（下の底面 B1 の頂点 b_j = j、上の底面 B2 の頂点 t_j = n + j、
   側面 s_j は b_j, b_{j+1}, t_{j+1}, t_j）、どの面も外から見て反時計回りに頂点を並べておき、前の面と共有する辺に沿って次の面を置いていく。
   帯は S0 = {s_0, …, s_{ℓ0−1}}、Si = {s_{pi}, s_{pi+di}, …}（i = 1, 2）。B1 に S1 と S0 を付け、S0 の先に B2、B2 に S2 を付ける。
   向きは、B1 を左、S0 の 1 枚目をその右に置き、S0 が上へ伸びるようにする（パラメータを変えても、図がひっくり返らないように）。
   見せる範囲は、B1・S0・B2 に、まわりの余白（h + 1.3）を足したもの。帯 S1・S2 がはみ出すときだけ、その帯まで広げる（帯の先が切れないように）。
   底面の各辺の内側と帯の各側面に、側面のラベルを書く。面の色と B・S の字は 11・12 枚目と同じ。
   はじめは EX（BSBS）。バーやボタンは発表のときに手で動かす */
var ENUM = (function () {
  const EX = { pat: "bsbs", n: 12, h: 1, l0: 2, p1: 4, d1: 1, l1: 2, p2: 9, d2: -1, l2: 2 };
  const HMIN = 0.05, HMAX = 100;
  const TAU = 2 * Math.PI;
  const avg = function (Q) { return [Q.reduce(function (s, q) { return s + q[0]; }, 0) / Q.length, Q.reduce(function (s, q) { return s + q[1]; }, 0) / Q.length]; };
  /* 凸包（帯は、並んだ側面の凸包の長方形）。点は x、x がほぼ同じなら y の順に並べる（縦にそろった点の x は、計算の丸めでわずかに違うことがあり、
     x だけで並べると、その順が崩れて頂点が抜け、帯が三角形などになる） */
  function hull(P) {
    const p = P.slice().sort(function (a, b) { return Math.abs(a[0] - b[0]) > 1e-9 ? a[0] - b[0] : a[1] - b[1]; });
    const cr = function (o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); };
    const half = function (list) {
      const out = [];
      list.forEach(function (q) { while (out.length >= 2 && cr(out[out.length - 2], out[out.length - 1], q) <= 1e-9) out.pop(); out.push(q); });
      return out.slice(0, -1);
    };
    return half(p).concat(half(p.slice().reverse()));
  }

  /* 状態 s の、パスの面。B1・B2 と、帯 S0・S1・S2（側面の列。BSBS では S1 は空）。valid は、同じ側面を 2 回使っていないか */
  function build(s) {
    const N = s.n, H = s.h, mod = function (x) { return ((x % N) + N) % N; };
    const poly = function () {
      const v = [[0, 0]];
      for (let k = 0; k < N - 1; k++) v.push([v[k][0] + Math.cos(k * TAU / N), v[k][1] + Math.sin(k * TAU / N)]);
      return v;
    };
    const face = function (f) {
      if (f === "B1") return { ids: poly().map(function (_, k) { return mod(-k); }), pts: poly() };
      if (f === "B2") return { ids: poly().map(function (_, k) { return N + k; }), pts: poly() };
      return { side: f, ids: [f, mod(f + 1), N + mod(f + 1), N + f], pts: [[0, 0], [1, 0], [1, H], [0, H]] };
    };
    /* 面 next を、置いてある面 prev と共有する辺に沿って置く（2 つとも外から見て反時計回りなので、回すだけで辺の向こう側に来る） */
    const lay = function (prev, next) {
      const sh = next.ids.filter(function (id) { return prev.ids.indexOf(id) >= 0; });
      const A = function (id) { return prev.pts[prev.ids.indexOf(id)]; }, B = function (id) { return next.pts[next.ids.indexOf(id)]; };
      const t = Math.atan2(A(sh[1])[1] - A(sh[0])[1], A(sh[1])[0] - A(sh[0])[0]) - Math.atan2(B(sh[1])[1] - B(sh[0])[1], B(sh[1])[0] - B(sh[0])[0]);
      const c = Math.cos(t), sn = Math.sin(t), o = B(sh[0]), a = A(sh[0]);
      return { side: next.side, ids: next.ids, pts: next.pts.map(function (q) { const x = q[0] - o[0], y = q[1] - o[1]; return [a[0] + c * x - sn * y, a[1] + sn * x + c * y]; }) };
    };
    const run = function (p, d, len) { const out = []; for (let k = 0; k < len; k++) out.push(mod(p + k * d)); return out; };
    const chain = function (start, labels) { const out = []; let prev = start; labels.forEach(function (j) { prev = lay(prev, face(j)); out.push(prev); }); return out; };
    const L = { s0: run(0, 1, s.l0), s1: s.pat === "bsbs" ? [] : run(s.p1, s.d1, s.l1), s2: run(s.p2, s.d2, s.l2) };
    const used = L.s0.concat(L.s1, L.s2);
    const b1 = face("B1"), s1 = chain(b1, L.s1), s0 = chain(b1, L.s0), b2 = lay(s0[s0.length - 1], face("B2")), s2 = chain(b2, L.s2);
    /* B1 を左、S0 の 1 枚目をその右に。S0 が上へ伸びるように上下を決める（1 枚目の、2 枚目の側の下の頂点 b_1 が上に来るように） */
    const c1 = avg(b1.pts), c0 = avg(s0[0].pts), t = -Math.atan2(c0[1] - c1[1], c0[0] - c1[0]), c = Math.cos(t), sn = Math.sin(t);
    const turn = function (q) { const x = q[0] - c1[0], y = q[1] - c1[1]; return [c * x - sn * y, sn * x + c * y]; };
    const flip = turn(s0[0].pts[1])[1] < turn(s0[0].pts[0])[1] ? -1 : 1;
    const move = function (F) { return { side: F.side, ids: F.ids, pts: F.pts.map(function (q) { const p = turn(q); return [p[0], flip * p[1]]; }) }; };
    return { n: N, bases: [move(b1), move(b2)], bands: [s0.map(move), s1.map(move), s2.map(move)], valid: new Set(used).size === used.length };
  }

  let clips = 0;
  function draw(svg, s) {
    const W = +svg.getAttribute("width"), Hs = +svg.getAttribute("height"), F = build(s), N = F.n;
    /* 見せる範囲：B1・S0・B2 にまわりの余白（h + 1.3）を足したもの。帯 S1・S2 がそこからはみ出すときは、帯（と、その外に書く S の字の分の 0.9）
       まで広げる（はみ出した帯の先が切れないように）。これを枠いっぱいに */
    const core = [].concat(F.bases[0].pts, F.bases[1].pts, [].concat.apply([], F.bands[0].map(function (G) { return G.pts; })));
    const ends = [].concat.apply([], F.bands.slice(1).map(function (S) { return [].concat.apply([], S.map(function (G) { return G.pts; })); }));
    const m = s.h + 1.3, ext = function (P, i, sg, pad) { return P.length ? sg * Math.max.apply(null, P.map(function (p) { return sg * p[i]; })) + sg * pad : -sg * Infinity; };
    const x0 = Math.min(ext(core, 0, -1, m), ext(ends, 0, -1, 0.9)), x1 = Math.max(ext(core, 0, 1, m), ext(ends, 0, 1, 0.9));
    const y0 = Math.min(ext(core, 1, -1, m), ext(ends, 1, -1, 0.9)), y1 = Math.max(ext(core, 1, 1, m), ext(ends, 1, 1, 0.9));
    const k = Math.min(W / (x1 - x0), Hs / (y1 - y0)), dx = W / 2 - k * (x0 + x1) / 2, dy = Hs / 2 + k * (y0 + y1) / 2;
    const at = function (p) { return [dx + k * p[0], dy - k * p[1]]; };
    const f = function (v) { return v.toFixed(2); };
    const pts = function (Q) { return Q.map(function (p) { return at(p).map(f).join(","); }).join(" "); };
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const cid = "en-clip-" + (++clips);
    mk("rect", { x: 0, y: 0, width: W, height: Hs }, mk("clipPath", { id: cid }, mk("defs", {}, svg)));
    const g = mk("g", { "clip-path": "url(#" + cid + ")", class: F.valid ? "" : "en-invalid" }, svg);
    F.bases.forEach(function (B) { mk("polygon", { class: "pat-base", points: pts(B.pts) }, g); });
    /* 帯：1 つの長方形として塗り、中の側面の境目を破線で引く（11・12 枚目と同じ） */
    const rects = F.bands.map(function (S) {
      if (!S.length) return null;
      const Q = hull([].concat.apply([], S.map(function (G) { return G.pts; })));
      mk("polygon", { class: "pat-band", points: pts(Q) }, g);
      S.slice(0, -1).forEach(function (G, i) {
        mk("polyline", { class: "pat-fold", points: pts(G.pts.filter(function (_, j) { return S[i + 1].ids.indexOf(G.ids[j]) >= 0; })) }, g);
      });
      return Q;
    });
    /* 両端の面の重なり（赤） */
    if (F.valid) {
      const part = OVERLAP.clip(rects[1] || F.bases[0].pts, rects[2]);
      if (part.length >= 3 && Math.abs(OVERLAP.area(part)) > 1e-9) mk("polygon", { class: "ov-part", points: pts(part) }, g);
    }
    /* ラベル：底面の各辺の内側に、そこに付く側面のラベル（各側面は両方の底面に接するので、2 回ずつ出る）。帯の各側面の中に、その側面のラベル */
    F.bases.forEach(function (B) {
      const o = avg(B.pts);
      B.pts.forEach(function (p, i) {
        const q = B.pts[(i + 1) % N], u = B.ids[i] % N, v = B.ids[(i + 1) % N] % N, j = (((v - u) % N) + N) % N === 1 ? u : v;
        const mm = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = Math.hypot(o[0] - mm[0], o[1] - mm[1]);
        const r = at([mm[0] + 0.4 * (o[0] - mm[0]) / d, mm[1] + 0.4 * (o[1] - mm[1]) / d]);
        txt(f(r[0]), f(r[1]), String(j), { class: "en-edge", "text-anchor": "middle", dy: "0.35em" }, g);
      });
    });
    F.bands.forEach(function (S) { S.forEach(function (G) {
      const r = at(avg(G.pts));
      txt(f(r[0]), f(r[1]), String(G.side), { class: "en-side", "text-anchor": "middle", dy: "0.35em" }, g);
    }); });
    /* B1・B2、S0・S1・S2 の字（下付きの番号つき）：底面は真ん中、S1・S2 は付いている底面から帯へ向かう向きの帯の先の外、S0 は帯の下 */
    const name = function (r, letter, index, cls) {
      const tx = txt(f(r[0]), f(r[1]), letter, { class: "en-name " + cls, "text-anchor": "middle", dy: "0.35em" }, g);
      mk("tspan", { "baseline-shift": "sub", "font-size": "70%" }, tx).textContent = index;
    };
    const cb = F.bases.map(function (B) { return at(avg(B.pts)); });
    cb.forEach(function (r, i) { name(r, "B", String(i + 1), "en-b"); });
    rects.forEach(function (Q, i) {
      if (!Q) return;
      const C = Q.map(at), o = avg(C);
      const u = i === 0 ? [0, 1] : (function () { const b = cb[i - 1], d = Math.hypot(o[0] - b[0], o[1] - b[1]); return [(o[0] - b[0]) / d, (o[1] - b[1]) / d]; })();
      const reach = Math.max.apply(null, C.map(function (q) { return (q[0] - o[0]) * u[0] + (q[1] - o[1]) * u[1]; }));
      name([o[0] + u[0] * (reach + 13), o[1] + u[1] * (reach + 13)], "S", String(i), "en-s");
    });
    if (!F.valid) txt(12, 28, "Invalid", { class: "en-invalid-text" }, svg);
  }

  /* 操作の欄：バー（data-key の行の <input type="range">。値はその横の <span>）と、切り替えボタン（data-key の行の <button data-v>） */
  function setup(svg, still) {
    const ctl = svg.closest("slide").querySelector(".en-ctl");
    const row = function (key) { return ctl.querySelector('[data-key="' + key + '"]'); };
    const hOf = function (v) { return Math.exp(Math.log(HMIN) + (Math.log(HMAX) - Math.log(HMIN)) * v / 1000); };
    const vOf = function (x) { return Math.round((Math.log(x) - Math.log(HMIN)) / (Math.log(HMAX) - Math.log(HMIN)) * 1000); };
    const state = Object.assign({}, EX);
    /* 操作の欄を状態に合わせる（p・ℓ の上限は n − 1。BSBS のときは S1 の行を止める） */
    function sync() {
      Object.keys(state).forEach(function (key) {
        const r = row(key);
        if (!r) return;                           // h（行がない）
        const el = r.querySelector("input"), off = state.pat === "bsbs" && key[1] === "1";
        if (el) {
          if (key[0] === "p" || key[0] === "l") el.max = state.n - 1;
          el.value = key === "h" ? vOf(state.h) : state[key];
          el.disabled = off;
          r.querySelector(".bar > span").textContent = key === "h" ? state.h.toFixed(2) : String(state[key]);
        }
        [].slice.call(r.querySelectorAll("button")).forEach(function (b) {
          b.classList.toggle("sel", b.getAttribute("data-v") === String(state[key]));
          b.disabled = off;
        });
        r.classList.toggle("off", off);
      });
    }
    function paint() { sync(); draw(svg, state); }
    paint();
    if (still) return;
    /* 操作したクリックでページが進まないようにし、操作し終えたらフォーカスを外す（6・12 枚目と同じ） */
    ctl.addEventListener("click", function (e) { e.stopPropagation(); });
    [].slice.call(ctl.querySelectorAll("[data-key]")).forEach(function (r) {
      const key = r.getAttribute("data-key"), el = r.querySelector("input");
      if (el) {
        el.addEventListener("input", function () {
          state[key] = key === "h" ? hOf(+el.value) : +el.value;
          if (key === "n") ["p1", "p2", "l0", "l1", "l2"].forEach(function (x) { state[x] = Math.min(state[x], state.n - 1); });
          paint();
        });
        el.addEventListener("change", function () { el.blur(); });
        el.addEventListener("pointerup", function () { el.blur(); });
      }
      [].slice.call(r.querySelectorAll("button")).forEach(function (b) {
        b.addEventListener("click", function () {
          const v = b.getAttribute("data-v");
          state[key] = key === "pat" ? v : +v;
          b.blur(); paint();
        });
      });
    });
  }
  return { p: setup, build: build, hull: hull };     // build・hull は 14 枚目（figs/reduce.js）でも使う
})();
figure("enum-fig", ENUM.p);
