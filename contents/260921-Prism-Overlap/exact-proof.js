// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 1 of the pages that derive the overlap conditions of the three families analyzed exactly
// (derivations/bsbs-1.html, bsbs-2.html, sbsbs-1.html): the part of the path partial unfolding around S0, in the
// coordinates of the derivation, with sliders for n (over the range of the family) and h, the overlap of the
// two end faces in red, and a line that says which pairs of edges cross.
//
// With alpha = 2 pi / n, the vertices of B1 are v_0 = (0, 0) and v_j = v_{j-1} + (-sin j alpha, cos j alpha),
// and those of B2 are u_0 = (h, 0) and u_j = u_{j-1} + (sin j alpha, cos j alpha); S0 is the 1 x h rectangle
// below the x-axis between them. For BSBS-1, S2 is the 2 x h rectangle on the edge u_1 u_2 of B2, with the
// corners w_0 = u_2, w_1, w_2, w_3, and the edge v_0 v_1 of B1 is tested; for BSBS-2, S2 is the 3 x h
// rectangle on the edge u_2 u_3, with the corners w_0 = u_3, w_1, w_2, w_3, and the edges v_0 v_1 and v_1 v_2
// are tested. For SBSBS-1, S1 is the 1 x h rectangle on the edge v_0 v_1 of B1, with the corners x_0 = v_0,
// x_1 = v_1, x_2, x_3, and S2 the (n - 2) x h rectangle on the edge u_1 u_2 of B2, with the corners w_0,
// w_1 = u_1, w_2, w_3; the side w_1 w_2 of S2 is tested. The lines through the tested edges are dashed. The
// y-axis points up, as in the figures of the paper. Plain JavaScript.

const ExactProof = (() => {
  const LOG_H = [-1.699, 0.301];                 // h from 0.02 to 2, on a logarithmic scale, unless a family says
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, s) => [p[0] * s, p[1] * s];
  const cross = (p, q) => p[0] * q[1] - p[1] * q[0];
  const centroid = (p) => mul(p.reduce(add, [0, 0]), 1 / p.length);
  const f = (x) => x.toFixed(3);
  const points = (p) => p.map((q) => `${f(q[0])},${f(-q[1])}`).join(" ");        // SVG has y pointing down
  const name = (letter, index, [x, y], size, cls) =>
    `<text class="${cls}" x="${f(x)}" y="${f(-y)}" font-size="${f(size)}" stroke-width="${f(size / 3)}" dy="0.35em">${letter}` +
    (index === "" ? "" : `<tspan dy="0.3em" font-size="${f(0.7 * size)}">${index}</tspan>`) + "</text>";
  const sub1 = (s) => s.replace(/([a-z])(\d)/g, "$1<sub>$2</sub>");                 // "w1w2" -> w<sub>1</sub>w<sub>2</sub>

  // The vertices of the two bases and of S0.
  function bases(n, h) {
    const a = (2 * Math.PI) / n, v = [[0, 0]], u = [[h, 0]];
    for (let j = 1; j < n; j++) {
      v.push(add(v[j - 1], [-Math.sin(j * a), Math.cos(j * a)]));
      u.push(add(u[j - 1], [Math.sin(j * a), Math.cos(j * a)]));
    }
    return { a, v, u, s0: [[0, 0], [h, 0], [h, -1], [0, -1]] };
  }

  // The part of the convex polygon p inside the convex polygon q, both counterclockwise.
  function clip(p, q) {
    let out = p;
    for (let i = 0; i < q.length && out.length; i++) {
      const A = q[i], B = q[(i + 1) % q.length], side = (r) => cross(sub(B, A), sub(r, A));
      const inp = out;
      out = [];
      for (let j = 0; j < inp.length; j++) {
        const r = inp[j], s = inp[(j + 1) % inp.length], dr = side(r), ds = side(s);
        if (dr > 0) out.push(r);
        if ((dr > 0) !== (ds > 0) && dr !== ds) out.push(add(r, mul(sub(s, r), dr / (dr - ds))));
      }
    }
    return out;
  }
  const ccw = (p) => (p.reduce((s, q, i) => s + cross(q, p[(i + 1) % p.length]), 0) > 0 ? p : [...p].reverse());
  // Whether the segments pq and rs cross, each with its ends strictly on the two sides of the other.
  const crosses = (p, q, r, s) => {
    const side = (a, b, c) => Math.sign(cross(sub(b, a), sub(c, a)));
    return side(p, q, r) * side(p, q, s) < 0 && side(r, s, p) * side(r, s, q) < 0;
  };
  // For each tested edge of B1, the sides of S2 that cross it; only the edges that some side crosses.
  const crossings = (edges, sides) => edges
    .map(([name, p, q]) => [name, sides.filter(([, r, s]) => crosses(p, q, r, s)).map(([k]) => k)])
    .filter(([, ks]) => ks.length);
  // The four sides of a band with the corners w_0, w_1, w_2, w_3 (or x_0, ..., x_3).
  const sidesOf = (w, x = "w") => w.map((p, i) => [`${x}${i}${x}${(i + 1) % 4}`, p, w[(i + 1) % 4]]);

  // What each family draws: its bands (each with its name, corners, length, folds and, if given, where its
  // name goes), the two end faces, the edges that are tested (of B1, or of S2 for SBSBS-1), the sides of the
  // other end face and its name, and the names of the points.
  const FAMILIES = {
    "bsbs-1": {
      n: [11, 25], start: { n: 16, h: 0.2 },
      build(n, h) {
        const { a, v, u, s0 } = bases(n, h);
        const e = sub(u[2], u[1]), m = [-Math.cos(2 * a), Math.sin(2 * a)];     // along u_1 u_2, and outward
        const w0 = u[2], w3 = sub(u[2], mul(e, 2)), w1 = add(w0, mul(m, h)), w2 = add(w3, mul(m, h));
        const s2 = [w0, w1, w2, w3];
        return {
          v, u, faces: [ccw(v), ccw(s2)],
          bands: [["0", s0, 1, []], ["2", s2, 2, [[u[1], add(u[1], mul(m, h))]], centroid([u[1], add(u[1], mul(m, h)), w1, w0])]],
          edges: [["v0v1", v[0], v[1]]], sides: sidesOf(s2),
          labels: [["v", "0", v[0], [-1, -0.5]], ["v", "1", v[1], [-1, 0.2]], ["u", "0", u[0], [1, -0.5]],
            ["u", "1", u[1], [1, -0.3]], ["w", "0", w0, [0.9, -0.3]], ["w", "1", w1, [0.4, 0.9]],
            ["w", "2", w2, [-0.9, 0.5]], ["w", "3", w3, [1, -0.1]]],
          keep: [v[0], v[1], v[2], ...u.slice(0, 3), ...s2, ...s0],
        };
      },
    },
    "bsbs-2": {
      n: [14, 25], start: { n: 20, h: 0.4 },
      build(n, h) {
        const { a, v, u, s0 } = bases(n, h);
        const e = sub(u[3], u[2]), m = [-Math.cos(3 * a), Math.sin(3 * a)];     // along u_2 u_3, and outward
        const w0 = u[3], w3 = sub(u[3], mul(e, 3)), w1 = add(w0, mul(m, h)), w2 = add(w3, mul(m, h));
        const s2 = [w0, w1, w2, w3];
        const fold = (p) => [p, add(p, mul(m, h))];
        return {
          v, u, faces: [ccw(v), ccw(s2)],
          bands: [["0", s0, 1, []], ["2", s2, 3, [fold(u[2]), fold(sub(u[2], e))], centroid([...fold(u[2]), w1, w0])]],
          edges: [["v0v1", v[0], v[1]], ["v1v2", v[1], v[2]]], sides: sidesOf(s2),
          labels: [["v", "0", v[0], [-1, -0.5]], ["v", "1", v[1], [-1.1, -0.6]], ["v", "2", v[2], [-0.9, 0.5]],
            ["u", "0", u[0], [1, -0.5]], ["u", "2", u[2], [1, -0.3]], ["w", "0", w0, [0.9, -0.3]],
            ["w", "1", w1, [0.4, 0.9]], ["w", "2", w2, [-0.6, 0.9]], ["w", "3", w3, [1, -0.3]]],
          keep: [...v.slice(0, 4), ...u.slice(0, 4), ...s2, ...s0],
        };
      },
    },
    "sbsbs-1": {
      n: [11, 25], start: { n: 16, h: 3 }, logH: [-0.301, 1.477],      // h from 0.5 to 30
      build(n, h) {
        const { a, v, u, s0 } = bases(n, h);
        const n1 = [Math.cos(a), Math.sin(a)];                                      // outward from B1
        const e = sub(u[2], u[1]), m = [-Math.cos(2 * a), Math.sin(2 * a)];     // along u_1 u_2, and outward
        const x = [v[0], v[1], add(v[1], mul(n1, h)), add(v[0], mul(n1, h))];
        const w1 = u[1], w2 = add(w1, mul(m, h)), w0 = add(w1, mul(e, n - 2)), w3 = add(w0, mul(m, h));
        const along = (k) => [add(w1, mul(e, k)), add(w2, mul(e, k))];
        return {
          v, u, faces: [ccw(x), ccw([w0, w1, w2, w3])], other: "S<sub>1</sub>",
          bands: [["0", s0, 1, []], ["1", [x[0], x[3], x[2], x[1]], 1, []],
            ["2", [w1, w2, w3, w0], n - 2, Array.from({ length: n - 3 }, (_, k) => along(k + 1)), centroid([...along(1), ...along(2)])]],
          edges: [["w1w2", w1, w2]], sides: sidesOf(x, "x"),
          labels: [["x", "0", x[0], [-1, -0.5]], ["x", "1", x[1], [-1, 0.2]], ["x", "2", x[2], [0.2, 1]],
            ["x", "3", x[3], [0.6, -0.9]], ["u", "0", u[0], [1, -0.5]], ["w", "1", w1, [1, -0.3]], ["w", "2", w2, [-0.9, 0.5]]],
          keep: [...v.slice(0, 3), ...u.slice(0, 3), ...x, w1, w2, ...along(2), ...s0],
        };
      },
    },
  };

  // The name of a band: its middle, and for a long band the middle of its first 1.5 side faces. The corners
  // of a band run p0, p1 across it (the height h), then p2, p3, so that p0 p3 runs along its length.
  const middle = (pts, len) => {
    const t = len > 3 ? 1.5 / len : 1, b = add(pts[0], mul(sub(pts[3], pts[0]), t));
    return centroid([pts[0], pts[1], add(pts[1], sub(b, pts[0])), b]);
  };

  function draw(svg, key, n, h) {
    const g = FAMILIES[key].build(n, h);
    // A 4:3 frame around the points that matter: the ends of the bases near S0, S0, and S2.
    const xs = g.keep.map((p) => p[0]), ys = g.keep.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 0.12 * Math.max(x1 - x0, y1 - y0);
    let w = x1 - x0 + 2 * pad, hh = y1 - y0 + 2 * pad;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (w / hh > 4 / 3) hh = (w * 3) / 4; else w = (hh * 4) / 3;
    const size = 0.035 * w, off = 0.9 * size;
    // The lines through the tested edges, across the frame.
    const across = ([, p, q]) => {
      const d = sub(q, p), t = (2 * w) / Math.hypot(d[0], d[1]);
      return `<polyline class="line" points="${points([sub(p, mul(d, t)), add(q, mul(d, t))])}"/>`;
    };
    const overlap = clip(g.faces[1], g.faces[0]);
    svg.setAttribute("viewBox", `${f(cx - w / 2)} ${f(-cy - hh / 2)} ${f(w)} ${f(hh)}`);
    svg.innerHTML =
      `<polygon class="base" points="${points(g.v)}"/><polygon class="base" points="${points(g.u)}"/>` +
      g.bands.map(([, pts, , folds]) => `<polygon class="band" points="${points(pts)}"/>` +
        folds.map((e) => `<polyline class="fold" points="${points(e)}"/>`).join("")).join("") +
      (overlap.length > 2 ? `<polygon class="overlap" points="${points(overlap)}"/>` : "") +
      g.edges.map(across).join("") +
      g.edges.map(([, p, q]) => `<polyline class="line-edge" points="${points([p, q])}"/>`).join("") +
      name("B", "1", [cx - w / 2 + 0.12 * w, -0.5], 1.4 * size, "base-label") +
      name("B", "2", [cx + w / 2 - 0.12 * w, -0.5], 1.4 * size, "base-label") +
      g.bands.map(([index, pts, len, , at]) => name("S", index, at || middle(pts, len), Math.min(size, 0.5 * h + 0.1), "band-label")).join("") +
      g.labels.map(([letter, index, r, [dx, dy]]) => name(letter, index, add(r, [dx * off, dy * off]), size, "vertex-label")).join("");
    g.overlaps = overlap.length > 2;
    return g;
  }

  // The line under the drawing: the pairs of edges that cross, or that none does.
  function say(g) {
    const pairs = crossings(g.edges, g.sides), edges = g.edges.map(([k]) => sub1(k));
    if (pairs.length) {
      return {
        en: pairs.map(([k, ks]) => `${ks.map(sub1).join(" and ")} ${ks.length > 1 ? "cross" : "crosses"} ${sub1(k)}`).join(", and ") +
          ", so the two end faces overlap.",
        ja: pairs.map(([k, ks]) => `${ks.map(sub1).join(" と ")} は ${sub1(k)} と交差`).join("し、") + "する。よって、両端の面は重なる。",
      };
    }
    if (g.overlaps) return { en: "The two end faces overlap.", ja: "両端の面は重なる。" };
    const other = g.other || "S<sub>2</sub>";
    return {
      en: `No side of ${other} crosses ${edges.join(" or ")}, so the two end faces do not overlap.`,
      ja: `${other} のどの辺も ${edges.map((k) => `${k} と${edges.length > 1 ? "も" : ""}`).join(" ")}交差しない。よって、両端の面は重ならない。`,
    };
  }

  function setup(root) {
    const key = root.dataset.exact, fam = FAMILIES[key];
    const svg = root.querySelector("svg"), status = root.querySelector(".sketch-status");
    const nInput = root.querySelector("input[data-var=n]"), hInput = root.querySelector("input[data-var=h]");
    const out = (v) => root.querySelector(`output[data-var=${v}]`);
    nInput.min = fam.n[0]; nInput.max = fam.n[1]; nInput.value = fam.start.n;
    const [lo, hi] = fam.logH || LOG_H;
    hInput.min = lo; hInput.max = hi; hInput.value = Math.log10(fam.start.h).toFixed(3);
    const update = () => {
      const n = Number(nInput.value), h = 10 ** Number(hInput.value);
      out("n").textContent = String(n);
      out("h").textContent = h.toPrecision(3);
      const g = draw(svg, key, n, h), on = g.overlaps;
      status.innerHTML = Lang.t(say(g));
      status.classList.toggle("overlap", on);
      status.classList.toggle("no-overlap", !on);
    };
    root.addEventListener("input", update);
    Lang.onChange(update);
    update();
  }

  return { FAMILIES, clip, crosses, crossings, draw, say, setup };
})();

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-exact]")) ExactProof.setup(root);
}
