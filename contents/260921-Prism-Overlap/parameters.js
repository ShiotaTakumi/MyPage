// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 4 of the home page, the upper drawings: an example of the parameters of patterns BSBS and SBSBS, redrawn from Fig. 5
// of the paper (docs/WALCOM2027/fig/bsbs_params.pdf, sbsbs_params.pdf) with the same prism and parameters.
// The unfolding is drawn by draw() in enumeration.js; on it are marked the exterior angle alpha, the
// direction in which the labels increase on each base (red), the lengths l0, l1, l2 and the height h, the
// edge of B_i joined to the side face p_i, and the direction d_i in which S_i extends.
// Plain JavaScript, no build step.

const Parameters = (() => {
  const N = 20, H = 0.8;                 // as in the paper
  const PANELS = {
    bsbs: { l0: 2, p2: 5, d2: -1, l2: 4 },
    sbsbs: { l0: 2, p1: 3, d1: -1, l1: 2, p2: 5, d2: -1, l2: 2 },
  };
  const ALPHA = 9;                       // alpha is marked where the edges of the side faces 9 and 8 of B1 meet

  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, s) => [p[0] * s, p[1] * s];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
  const cross = (p, q) => p[0] * q[1] - p[1] * q[0];
  const unit = (p) => mul(p, 1 / Math.hypot(p[0], p[1]));
  const centroid = (p) => mul(p.reduce(add, [0, 0]), 1 / p.length);
  const mod = (x) => ((x % N) + N) % N;
  const f = (x) => x.toFixed(3);
  const points = (p) => p.map((q) => `${f(q[0])},${f(q[1])}`).join(" ");

  // A symbol in italics with an optional subscript, centered at (x, y).
  const symbol = (cls, letter, index, [x, y], size = 0.5) =>
    `<text class="sym ${cls}" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" dy="0.35em">${letter}` +
    (index === "" ? "" : `<tspan dy="0.3em" font-size="${f(0.7 * size)}">${index}</tspan>`) + "</text>";

  // An arrowhead at `tip`, pointing in the direction e.
  const head = (cls, tip, e, len = 0.22) => {
    const side = [-e[1], e[0]], back = add(tip, mul(e, -len));
    return `<polygon class="${cls}" points="${points([tip, add(back, mul(side, 0.45 * len)), add(back, mul(side, -0.45 * len))])}"/>`;
  };

  // A dimension line beside the side from p to q, on the side u (a unit vector), with its symbol.
  const dimension = (cls, p, q, u, letter, index) => {
    const at = (r, t) => add(r, mul(u, t));
    return `<polyline class="${cls}" points="${points([at(p, 0.1), at(p, 0.3), at(q, 0.3), at(q, 0.1)])}"/>` +
      symbol(`${cls}-label`, letter, index, at(centroid([p, q]), 0.7));
  };

  // The edge of a base joined to the side face `label`: on B1 the edge k is joined to the side face -k - 1,
  // and on B2 to the side face k (see draw() in enumeration.js).
  const edge = (base, label) => {
    const k = base.index === "1" ? mod(-label - 1) : label;
    return [base.pts[k], base.pts[(k + 1) % N]];
  };

  function annotate(bases, bands, P) {
    const out = [], marks = [];
    const keep = (...ps) => { marks.push(...ps); };

    // The direction in which the labels increase on each base: along the order of the vertices on B2,
    // against it on B1.
    for (const b of bases) {
      const c = centroid(b.pts), r = 0.4 * Math.hypot(...sub(b.pts[0], c));
      const along = Math.sign(cross(sub(b.pts[0], c), sub(b.pts[1], c)));
      const s = b.index === "2" ? along : -along;                   // +1: the angle grows (clockwise on screen)
      const other = centroid(bases.find((o) => o !== b).pts), gap = Math.atan2(other[1] - c[1], other[0] - c[0]);
      const a0 = gap + s * 0.5, a1 = a0 + s * (2 * Math.PI - 1.0);  // leave a gap toward the other base
      const at = (a) => add(c, [r * Math.cos(a), r * Math.sin(a)]);
      const [p0, p1] = [at(a0), at(a1)];
      out.push(`<path class="turn" d="M ${f(p0[0])} ${f(p0[1])} A ${f(r)} ${f(r)} 0 1 ${s > 0 ? 1 : 0} ${f(p1[0])} ${f(p1[1])}"/>`);
      out.push(head("turn-head", p1, [-Math.sin(a1) * s, Math.cos(a1) * s], 0.35));
    }

    // alpha: the exterior angle at the vertex where the edges of the side faces ALPHA and ALPHA - 1 of B1 meet.
    {
      const b1 = bases.find((b) => b.index === "1");
      const [a, v] = edge(b1, ALPHA), [, w] = edge(b1, ALPHA - 1);
      const e1 = unit(sub(v, a)), e2 = unit(sub(w, v));
      const ext = add(v, mul(e1, 1.6)), side = add(v, mul(e2, 1.6));
      const r = 0.9;
      const q1 = add(v, mul(e1, r)), q2 = add(v, mul(e2, r));
      const sweep = cross(e1, e2) > 0 ? 1 : 0;
      out.push(`<polyline class="alpha-line" points="${points([v, ext])}"/>`);
      out.push(`<path class="alpha-arc" d="M ${f(q1[0])} ${f(q1[1])} A ${r} ${r} 0 0 ${sweep} ${f(q2[0])} ${f(q2[1])}"/>`);
      const mid = unit(add(e1, e2));
      out.push(symbol("alpha-label", "α", "", add(v, mul(mid, 1.3))));
      keep(ext, side, add(v, mul(mid, 1.7)));
    }

    // S0: its length l0 beside the side away from B1, and the height h below it.
    {
      const b1 = bases.find((b) => b.index === "1"), s0 = bands.find((b) => b.index === "0");
      const o = centroid(b1.pts), c = centroid(s0.pts);
      const sides = s0.pts.map((p, i) => [p, s0.pts[(i + 1) % 4]]);
      const len = ([p, q]) => Math.hypot(...sub(q, p));
      const long = sides.filter((s) => Math.abs(len(s) - P.l0) < 1e-9);
      const [p, q] = long.reduce((x, y) => (Math.hypot(...sub(centroid(y), o)) > Math.hypot(...sub(centroid(x), o)) ? y : x));
      const u = unit(sub(centroid([p, q]), c));
      out.push(dimension("length", p, q, u, "ℓ", "0"));
      const short = sides.filter((s) => Math.abs(len(s) - H) < 1e-9);
      const [a, b] = short.reduce((x, y) => (centroid(y)[1] > centroid(x)[1] ? y : x));   // the lower one
      out.push(dimension("height", a, b, unit(sub(centroid([a, b]), c)), "h", ""));
      keep(add(centroid([p, q]), mul(u, 1.0)), add(centroid([a, b]), [0, 1.0]));
    }

    // S1 and S2: the edge joined to p_i, the direction d_i, and the length l_i.
    for (const i of ["1", "2"]) {
      if (P[`l${i}`] == null) continue;
      const base = bases.find((b) => b.index === i), band = bands.find((b) => b.index === i);
      const o = centroid(base.pts), [a, b] = edge(base, P[`p${i}`]);
      const u = unit(sub(b, a)), mid = centroid([a, b]);
      const inward = unit(sub(o, mid));
      // d_i: the way along the edge in which the band runs past the edge.
      const reach = band.pts.map((p) => dot(sub(p, a), u));
      const e = Math.max(...reach) > 1.5 ? u : mul(u, -1);
      out.push(`<polyline class="p-mark" points="${points([a, b])}"/>`);
      out.push(symbol("p-label", "p", i, add(add(mid, mul(e, -0.95)), mul(inward, -0.4))));
      const from = add(add(mid, mul(inward, 1.0)), mul(e, 0.2)), to = add(from, mul(e, 1.2));
      out.push(`<polyline class="d-arrow" points="${points([from, to])}"/>` + head("d-head", to, e));
      out.push(symbol("d-label", "d", i, add(add(from, mul(e, 0.55)), mul(inward, 0.45))));
      // l_i beside the side of the band away from the base.
      const sides = band.pts.map((p, k) => [p, band.pts[(k + 1) % 4]]).filter(([p, q]) => Math.abs(Math.hypot(...sub(q, p)) - P[`l${i}`]) < 1e-9);
      const [p, q] = sides.reduce((x, y) => (Math.hypot(...sub(centroid(y), o)) > Math.hypot(...sub(centroid(x), o)) ? y : x));
      const away = unit(sub(centroid([p, q]), centroid(band.pts)));
      out.push(dimension("length", p, q, away, "ℓ", i));
      keep(add(centroid([p, q]), mul(away, 1.0)), add(mid, mul(e, -1.3)));
    }
    return { svg: out.join(""), marks };
  }

  function draw(svg, P) {
    const { bases, bands } = Enumeration.shapes(N, H, P);
    const { svg: marks, marks: extra } = annotate(bases, bands, P);
    // The frame holds the unfolding and the marks around it, 4:3 as in the drawings below.
    const all = [...bases, ...bands].flatMap((s) => s.pts).concat(extra);
    const x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
    const y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
    const pad = 0.03 * Math.max(x1 - x0, y1 - y0);
    let w = x1 - x0 + 2 * pad, hh = y1 - y0 + 2 * pad, vx = x0 - pad, vy = y0 - pad;
    if (w / hh > 4 / 3) { vy -= (w * 3 / 4 - hh) / 2; hh = w * 3 / 4; } else { vx -= (hh * 4 / 3 - w) / 2; w = hh * 4 / 3; }
    Enumeration.draw(svg, N, H, P, { box: [vx, vy, w, hh], label: 0.32 });
    svg.insertAdjacentHTML("beforeend", marks);
  }

  function setup(figure) {
    for (const [key, P] of Object.entries(PANELS)) draw(figure.querySelector(`[data-example=${key}] svg`), P);
  }

  return { PANELS, setup };
})();

if (typeof document !== "undefined") {
  const figure = document.getElementById("enumeration");
  if (figure) Parameters.setup(figure);
}
