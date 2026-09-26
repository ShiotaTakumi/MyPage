// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 4 of the home page, the lower drawings: a path partial unfolding of pattern BSBS and one of pattern SBSBS, built
// from their parameters as in Algorithm 1 of the paper, with a slider or a switch for every parameter.
// The labels of the side faces are written along the edges of the bases, and each band is drawn as one
// rectangle, as in Fig. 5 of the paper. The geometry is family() in unfolding.js.
// Plain JavaScript, no build step.

const Enumeration = (() => {
  const N_MIN = 3, N_MAX = 30;                // the enumeration is for n <= 25; beyond it, up to 30
  const LOG_MIN = -1.301, LOG_MAX = 2;        // h from 0.05 to 100 on a logarithmic scale, as in Figure 2

  // The parameters of each pattern (Table 1), and where they start: parameters whose two end faces overlap.
  const NAMES = {
    bsbs: ["n", "h", "l0", "p2", "d2", "l2"],
    sbsbs: ["n", "h", "l0", "p1", "d1", "l1", "p2", "d2", "l2"],
  };
  const START = {
    bsbs: { n: 24, h: 0.5, l0: 1, p2: 4, d2: -1, l2: 4 },
    sbsbs: { n: 24, h: 3, l0: 2, p1: 2, d1: 1, l1: 1, p2: 3, d2: 1, l2: 4 },
  };
  const TEX = { n: "n", h: "h", l0: "\\ell_0", l1: "\\ell_1", l2: "\\ell_2", p1: "p_1", p2: "p_2", d1: "d_1", d2: "d_2" };
  // The range of a slider for a given n: labels run from 0 to n - 1, and a band has 1 to n - 1 side faces.
  const range = (name, n) => (name === "n" ? [N_MIN, N_MAX] : name[0] === "p" ? [0, n - 1] : [1, n - 1]);

  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, s) => [p[0] * s, p[1] * s];
  const centroid = (p) => mul(p.reduce(add, [0, 0]), 1 / p.length);
  const mod = (n, x) => ((x % n) + n) % n;
  const f = (x) => x.toFixed(3);
  const points = (p) => p.map((q) => `${f(q[0])},${f(q[1])}`).join(" ");
  // A name with its index as a subscript. The name of a band is edged in the color of the band (style.css),
  // so that a dashed edge through it does not cut the letters; the edge is a third as wide as the letters are tall.
  const name = (letter, index, x, y, size, cls) =>
    `<text class="${cls}" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" stroke-width="${f(size / 3)}" dy="0.35em">${letter}<tspan dy="0.3em" font-size="${f(0.7 * size)}">${index}</tspan></text>`;

  // The edges between consecutive side faces of a band: the two vertices that a face shares with the next.
  const folds = (list) => list.slice(1).map((face, k) =>
    face.pts.filter((p) => list[k].pts.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-9)));

  // The shapes of the path partial unfolding for n, h and the parameters P, as drawn: the two bases, the
  // bands (with their lengths and the edges between their side faces), the overlap of the two end faces,
  // and the vertices of the two end faces (S1, or B1 for BSBS, and S2) face by face, so that each vertex
  // keeps its place in the list as h changes.
  function shapes(n, h, P) {
    const g = Unfolding.family(n, h, P);
    const c = Math.cos(g.rotate), s = Math.sin(g.rotate);
    const T = ([x, y]) => { const X = c * x - s * y, Y = s * x + c * y; return [g.mirror ? -X : X, -Y]; };

    // g.faces is B1, B2, then the side faces of S1, S0 and S2 in this order.
    const l1 = P.l1 ?? 0;
    const side = g.faces.slice(2);
    const bands = [["1", side.slice(0, l1)], ["0", side.slice(l1, l1 + P.l0)], ["2", side.slice(l1 + P.l0)]]
      .filter(([, list]) => list.length)
      .map(([index, list]) => ({ index, len: list.length, pts: Unfolding.hull(list.flatMap((face) => face.pts)).map(T), folds: folds(list).map((e) => e.map(T)) }));
    const bases = [["1", g.faces[0].pts.map(T)], ["2", g.faces[1].pts.map(T)]].map(([index, pts]) => ({ index, pts }));
    const parts = Unfolding.overlaps(g.ends.map((pts) => ({ pts }))).map((p) => p.map(T));
    const ends = [l1 ? side.slice(0, l1).flatMap((face) => face.pts) : g.faces[0].pts,
      side.slice(l1 + P.l0).flatMap((face) => face.pts)].map((p) => p.map(T));
    return { bases, bands, parts, ends };
  }

  // The shapes with every point p moved to move(p).
  const moved = ({ bases, bands, parts, ends }, move) => ({
    bases: bases.map((b) => ({ ...b, pts: b.pts.map(move) })),
    bands: bands.map((b) => ({ ...b, pts: b.pts.map(move), folds: b.folds.map((e) => e.map(move)) })),
    parts: parts.map((p) => p.map(move)),
    ends: ends.map((p) => p.map(move)),
  });

  // Draws the path partial unfolding for n, h and the parameters P, and returns whether its two end faces
  // overlap. It is fitted to a 4:3 frame, unless `view` gives the frame (box: [x, y, width, height]) and
  // the size of the labels of the side faces (label). With view.move, every point p is drawn at move(p),
  // while the text stays upright (Figure 7 turns the unfolding in this way).
  function draw(svg, n, h, P, view) {
    const { bases, bands, parts } = view?.move ? moved(shapes(n, h, P), view.move) : shapes(n, h, P);

    // The frame, as in Unfolding.render.
    let vx, vy, w, hh;
    if (view) [vx, vy, w, hh] = view.box;
    else {
      const all = [...bases, ...bands].flatMap((shape) => shape.pts);
      const x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
      const y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
      const pad = 0.04 * Math.max(x1 - x0, y1 - y0);
      w = x1 - x0 + 2 * pad; hh = y1 - y0 + 2 * pad; vx = x0 - pad; vy = y0 - pad;
      if (w / hh > 4 / 3) { vy -= (w * 3 / 4 - hh) / 2; hh = w * 3 / 4; }
      else { vx -= (hh * 4 / 3 - w) / 2; w = hh * 4 / 3; }
    }
    // Below n = 20 the bases are small, so a drawing fitted to the frame comes out large, and so would the
    // text. Unless `view` fixes the sizes, the text is made smaller in the ratio of the bases (their
    // circumradii), so that it looks as it does for n = 20.
    const scale = view || n >= 20 ? 1 : Math.sin(Math.PI / 20) / Math.sin(Math.PI / n);
    const size = view?.label ?? 0.32 * scale;

    // The label of the side face joined along each edge of a base, just inside the base: the edge from
    // the k-th to the (k + 1)-th vertex is joined to the side face -k - 1 on B1 and k on B2 (see prismFace).
    const labels = bases.flatMap(({ index, pts }) => {
      const o = centroid(pts);
      return pts.map((p, k) => {
        const m = mul(add(p, pts[(k + 1) % n]), 0.5), v = sub(o, m), len = Math.hypot(v[0], v[1]);
        const [x, y] = add(m, mul(v, (0.3 * size / 0.32) / len));        // 0.3 inside for labels of size 0.32
        return `<text class="side-label" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" dy="0.35em">${index === "1" ? mod(n, -k - 1) : k}</text>`;
      });
    });

    svg.setAttribute("viewBox", `${f(vx)} ${f(vy)} ${f(w)} ${f(hh)}`);
    svg.innerHTML =
      bases.map((b) => `<polygon class="base" points="${points(b.pts)}"/>`).join("") +
      bands.map((b) => `<polygon class="band" points="${points(b.pts)}"/>` +
        b.folds.map((e) => `<polyline class="fold" points="${points(e)}"/>`).join("")).join("") +
      parts.map((p) => `<polygon class="overlap" points="${points(p)}"/>`).join("") +
      labels.join("") +
      bases.map((b) => { const [x, y] = centroid(b.pts); return name("B", b.index, x, y, 0.8 * scale, "base-label"); }).join("") +
      bands.map((b) => {
        const [x, y] = centroid(b.pts), size = Math.min(0.55, 0.6 * h, 0.45 * b.len) * scale;     // to fit in the band
        return name("S", b.index, x, y, size, "band-label");
      }).join("");
    return parts.length > 0;
  }

  // One panel: the drawing, and a slider (or a switch for d) for each parameter.
  function setup(root) {
    const key = root.dataset.pattern;
    const svg = root.querySelector(":scope > svg"), empty = root.querySelector(".no-image");   // not the example above it
    const status = root.querySelector(".sketch-status");
    const box = root.querySelector(".params");
    const value = { ...START[key] };

    box.innerHTML = NAMES[key].map((v) => {
      const id = `${key}-${v}`;
      if (v[0] === "d") {
        return `<div class="param" role="radiogroup" aria-labelledby="${id}"><span class="param-name" id="${id}">$${TEX[v]}$</span>` +
          `<span class="param-dir">${[1, -1].map((d) =>
            `<label><input type="radio" name="${id}" data-var="${v}" value="${d}"${d === value[v] ? " checked" : ""} /><span>${d > 0 ? "+1" : "−1"}</span></label>`).join("")}</span></div>`;
      }
      const [lo, hi] = v === "h" ? [LOG_MIN, LOG_MAX] : range(v, value.n);
      const now = v === "h" ? Math.log10(value.h).toFixed(3) : value[v];
      return `<div class="param"><label for="${id}"><span class="param-name">$${TEX[v]}$</span><output for="${id}" data-var="${v}"></output></label>` +
        `<input type="range" id="${id}" data-var="${v}" min="${lo}" max="${hi}" step="${v === "h" ? "0.001" : "1"}" value="${now}" /></div>`;
    }).join("");
    const input = (v) => box.querySelector(`input[type=range][data-var=${v}]`);

    const update = () => {
      // The sliders for the labels and the lengths of the bands follow n.
      const n = Number(input("n").value);
      for (const v of NAMES[key]) {
        if (v === "n" || v === "h" || v[0] === "d") continue;
        const el = input(v), [lo, hi] = range(v, n);
        el.min = lo; el.max = hi;
        if (Number(el.value) > hi) el.value = hi;
      }
      for (const v of NAMES[key]) {
        if (v[0] === "d") value[v] = Number(box.querySelector(`input[data-var=${v}]:checked`).value);
        else if (v === "h") value.h = 10 ** Number(input("h").value);
        else value[v] = Number(input(v).value);
      }
      for (const out of box.querySelectorAll("output")) {
        const v = out.dataset.var;
        out.textContent = v === "h" ? value.h.toPrecision(3) : String(value[v]);
      }

      const P = { l0: value.l0, p1: value.p1 ?? null, d1: value.d1 ?? null, l1: value.l1 ?? null, p2: value.p2, d2: value.d2, l2: value.l2 };
      const ok = Unfolding.valid(n, P);
      svg.toggleAttribute("hidden", !ok);           // an SVG element has no hidden property, only the attribute
      empty.hidden = ok;
      const overlapping = ok && draw(svg, n, value.h, P);
      status.textContent = !ok
        ? Lang.t({ en: "Invalid: the bands are not pairwise disjoint.", ja: "Invalid：帯どうしが側面を共有している。" })
        : overlapping
          ? Lang.t({ en: "The two end faces overlap.", ja: "両端の面は重なる。" })
          : Lang.t({ en: "The two end faces do not overlap.", ja: "両端の面は重ならない。" });
      status.classList.toggle("overlap", overlapping);
      status.classList.toggle("no-overlap", ok && !overlapping);
    };
    box.addEventListener("input", update);
    Lang.onChange(update);
    update();
  }

  return { shapes, draw, setup };
})();

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("#enumeration [data-pattern]")) Enumeration.setup(root);
}
