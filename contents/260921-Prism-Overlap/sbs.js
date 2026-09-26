// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 1 of the page on pattern SBS (derivations/sbs.html): the converging case (a) and the chasing case
// (b), with sliders for n, k, l1, l2 and h, and a button that shows the shadows of the proof.
//
// B is the regular n-gon with unit edges and the vertices v_j = sum_{i<j} (cos i alpha, sin i alpha); the
// side face s_j is joined to B along the edge v_j v_{j+1}. S1 is s_0, ..., s_{l1-1}, laid along the line
// of v_0 v_1 from v_0 on; S2 is joined at s_k and laid along the line of v_k v_{k+1}, from v_{k+1} toward
// v_k in the converging case and from v_k toward v_{k+1} in the chasing case. Both lie outside B. The
// drawing is turned so that the chord v_0 v_{k+1} is horizontal, v_0 on the left and the bands below, as
// in the figures of the paper; the shadows are dropped onto a horizontal line under the drawing: those
// of e_1 and e_2 in red, and the gap between them in gray. Plain JavaScript, no build step.

const Sbs = (() => {
  const LOG_MIN = -1.301, LOG_MAX = 2;          // h from 0.05 to 100, as in the figures of the home page
  const START = {
    converging: { n: 11, k: 4, l1: 2, l2: 3, h: 1.5 },   // as in Fig. (a) of the shadows in the paper
    chasing: { n: 11, k: 4, l1: 2, l2: 3, h: 1.5 },
  };
  const NAMES = ["n", "k", "l1", "l2", "h"];
  const TEX = { n: "n", k: "k", l1: "\\ell_1", l2: "\\ell_2", h: "h" };
  // The range of each slider: S1 and S2 share no side face. S1 is s_0, ..., s_{l1-1}; S2 is
  // s_{k-l2+1}, ..., s_k (converging) or s_k, ..., s_{k+l2-1} (chasing), without going round.
  const range = (key, name, v) => ({
    n: [3, 30],
    k: [1, v.n - 1],
    l1: [1, v.k],
    l2: key === "converging" ? [1, v.k + 1 - v.l1] : [1, v.n - v.k],
    h: [LOG_MIN, LOG_MAX],
  })[name];

  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const mul = (p, s) => [p[0] * s, p[1] * s];
  const centroid = (p) => mul(p.reduce(add, [0, 0]), 1 / p.length);
  const f = (x) => x.toFixed(3);
  const points = (p) => p.map((q) => `${f(q[0])},${f(q[1])}`).join(" ");
  const name = (letter, index, [x, y], size, cls) =>
    `<text class="${cls}" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" stroke-width="${f(size / 3)}" dy="0.35em">${letter}` +
    (index === "" ? "" : `<tspan dy="0.3em" font-size="${f(0.7 * size)}">${index}</tspan>`) + "</text>";

  // The shapes, in the coordinates of the drawing (turned, and with y pointing down).
  function shapes(key, { n, k, l1, l2, h }) {
    const a = (2 * Math.PI) / n;
    const V = [[0, 0]];
    for (let j = 0; j < n; j++) V.push(add(V[j], [Math.cos(j * a), Math.sin(j * a)]));   // V[n] = V[0]
    const dir = (j) => [Math.cos(j * a), Math.sin(j * a)];
    const out = (j) => [Math.sin(j * a), -Math.cos(j * a)];          // the outward normal of the edge v_j v_{j+1}
    const band = (p, d, len, nrm) => ({
      pts: [p, add(p, mul(d, len)), add(add(p, mul(d, len)), mul(nrm, h)), add(p, mul(nrm, h))],
      folds: Array.from({ length: len - 1 }, (_, i) => [add(p, mul(d, i + 1)), add(add(p, mul(d, i + 1)), mul(nrm, h))]),
      e: [p, add(p, mul(d, len))],
    });
    const S1 = band(V[0], dir(0), l1, out(0));
    const S2 = key === "converging" ? band(V[k + 1], mul(dir(k), -1), l2, out(k)) : band(V[k], dir(k), l2, out(k));

    // Turn by -k alpha / 2 (the chord along +x), then flip y.
    const t = (-k * a) / 2, c = Math.cos(t), s = Math.sin(t);
    const T = ([x, y]) => [c * x - s * y, -(s * x + c * y)];
    const move = (b) => ({ pts: b.pts.map(T), folds: b.folds.map((e) => e.map(T)), e: b.e.map(T) });
    return { n, k, B: V.slice(0, n).map(T), V: V.map(T), S1: move(S1), S2: move(S2) };
  }

  function draw(svg, key, v, shadows) {
    const { n, k, B, V, S1, S2 } = shapes(key, v);
    const all = [...B, ...S1.pts, ...S2.pts];
    const x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
    const y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
    const size = Math.max(x1 - x0, y1 - y0);
    const base = y1 + 0.12 * size;                                   // the line of the shadows
    const bottom = shadows ? base : y1;
    const pad = 0.05 * size;
    let w = x1 - x0 + 2 * pad, hh = bottom - y0 + 2 * pad, vx = x0 - pad, vy = y0 - pad;
    if (w / hh > 4 / 3) { vy -= (w * 3 / 4 - hh) / 2; hh = w * 3 / 4; } else { vx -= (hh * 4 / 3 - w) / 2; w = hh * 4 / 3; }
    // The labels of the side faces fit on the edges (of length 1), and the other text follows the frame.
    const label = Math.min(0.3, 0.035 * w);

    const o = centroid(B);
    const labels = B.map((p, j) => {
      const q = B[(j + 1) % n], m = mul(add(p, q), 0.5), d = add(o, mul(m, -1)), len = Math.hypot(d[0], d[1]);
      const [x, y] = add(m, mul(d, (0.3 * label / 0.32) / len));
      return `<text class="side-label" x="${f(x)}" y="${f(y)}" font-size="${f(label)}" dy="0.35em">${j}</text>`;
    });
    const bandSvg = (b, index, len) => `<polygon class="band" points="${points(b.pts)}"/>` +
      b.folds.map((e) => `<polyline class="fold" points="${points(e)}"/>`).join("") +
      name("S", index, centroid(b.pts), Math.min(0.055 * w, 0.6 * v.h, 0.45 * len), "band-label");

    let extra = "";
    if (shadows) {
      const vk1 = V[k + 1];
      const drops = [...S1.e, ...S2.e].map((p) => `<polyline class="drop" points="${points([p, [p[0], base]])}"/>`).join("");
      const span = (e) => [Math.min(e[0][0], e[1][0]), Math.max(e[0][0], e[1][0])];
      const [a0, a1] = span(S1.e), [b0, b1] = span(S2.e);
      const [l, r] = a1 <= b0 ? [a1, b0] : b1 <= a0 ? [b1, a0] : [null, null];
      const vs = Math.min(0.5, 0.045 * w);                          // the names of the vertices
      const vertex = (p, index, dy) => name("v", index, [p[0], p[1] + dy], vs, "vertex-label");
      extra =
        `<polyline class="chord" points="${points([V[0], vk1])}"/>` + drops +
        `<polyline class="shadow-line" points="${points([[vx, base], [vx + w, base]])}"/>` +
        (l !== null && r > l ? `<polyline class="gap" points="${points([[l, base], [r, base]])}"/>` : "") +
        `<polyline class="shadow" points="${points([[a0, base], [a1, base]])}"/>` +
        `<polyline class="shadow" points="${points([[b0, base], [b1, base]])}"/>` +
        `<polyline class="edge-e" points="${points(S1.e)}"/><polyline class="edge-e" points="${points(S2.e)}"/>` +
        vertex(V[0], "0", -0.6 * vs) + vertex(vk1, String(k + 1), -0.6 * vs) +
        (key === "chasing" ? vertex(V[k], String(k), -0.6 * vs) : "");
    }

    svg.setAttribute("viewBox", `${f(vx)} ${f(vy)} ${f(w)} ${f(hh)}`);
    svg.innerHTML = `<polygon class="base" points="${points(B)}"/>` + bandSvg(S1, "1", v.l1) + bandSvg(S2, "2", v.l2) +
      labels.join("") + name("B", "", o, Math.min(0.8, 0.07 * w), "base-label") + extra;
  }

  // One panel: the drawing, the button for the shadows, and a slider for each parameter.
  function setup(root) {
    const key = root.dataset.case;
    const svg = root.querySelector("svg"), box = root.querySelector(".params"), toggle = root.querySelector("button.shadow-toggle");
    const value = { ...START[key] };
    let shadows = false;
    box.innerHTML = NAMES.map((v) => {
      const id = `sbs-${key}-${v}`, [lo, hi] = range(key, v, value);
      const now = v === "h" ? Math.log10(value.h).toFixed(3) : value[v];
      return `<div class="param"><label for="${id}"><span class="param-name">$${TEX[v]}$</span><output for="${id}" data-var="${v}"></output></label>` +
        `<input type="range" id="${id}" data-var="${v}" min="${lo}" max="${hi}" step="${v === "h" ? "0.001" : "1"}" value="${now}" /></div>`;
    }).join("");
    const input = (v) => box.querySelector(`input[data-var=${v}]`);

    const update = () => {
      // Each slider follows those before it.
      for (const v of NAMES) {
        const el = input(v);
        if (v !== "h") {
          const [lo, hi] = range(key, v, value);
          el.min = lo; el.max = hi;
          value[v] = Math.min(hi, Math.max(lo, Number(el.value)));
          el.value = value[v];
        } else value.h = 10 ** Number(el.value);
        box.querySelector(`output[data-var=${v}]`).textContent = v === "h" ? value.h.toPrecision(3) : String(value[v]);
      }
      toggle.textContent = shadows ? Lang.t({ en: "Hide the shadows", ja: "影を隠す" }) : Lang.t({ en: "Show the shadows", ja: "影を表示" });
      toggle.setAttribute("aria-pressed", String(shadows));
      draw(svg, key, value, shadows);
    };
    box.addEventListener("input", update);
    toggle.addEventListener("click", () => { shadows = !shadows; update(); });
    Lang.onChange(update);
    update();
  }

  return { shapes, draw, setup };
})();

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("#sbs-cases [data-case]")) Sbs.setup(root);
}
