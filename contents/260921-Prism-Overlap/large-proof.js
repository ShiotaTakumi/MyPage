// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// The figure on the pages of the proof for n >= 26 (derivations/large-bsbs-2.html, large-sbsbs-1.html):
// the part of the path partial unfolding around S0, in the coordinates of the proof, with sliders for n
// (26 to 100) and h, over the heights of the claim of the page (0.05 to 1.15 for BSBS-2, 1.15 to 3 for
// SBSBS-1), and a line that says whether the proof's criterion holds.
//
// With alpha = 2 pi / n, the vertices of B1 are v_0 = (0, 0) and v_j = v_{j-1} + (-sin j alpha, cos j alpha),
// and those of B2 are u_0 = (h, 0) and u_j = u_{j-1} + (sin j alpha, cos j alpha); S0 is the 1 x h rectangle
// below the x-axis between them. For BSBS-2, S2 is the 3 x h rectangle on the edge u_2 u_3 of B2; the
// quadrilateral Q = R v_0 v_1 v_2 (R = (-sin alpha - sin 2 alpha, 0)) and the corner w_2 of S2 are in red,
// and the end faces overlap when w_2 is inside Q. For SBSBS-1, S1 is the 1 x h rectangle on v_0 v_1 and S2
// the (n - 2) x h rectangle on u_1 u_2; the segments x_1 x_2 and w_1 w_2 are in red, and the end faces
// overlap when they cross. The y-axis points up, as in the figures of the paper. Plain JavaScript.

const LargeProof = (() => {
  const N = [26, 100], START = { n: 26, h: 1.15 };
  const H = { "bsbs-2": [0.05, 1.15], "sbsbs-1": [1.15, 3] };     // the heights of the claim of each page
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

  // The vertices of the two bases and of S0.
  function bases(n, h) {
    const a = (2 * Math.PI) / n, v = [[0, 0]], u = [[h, 0]];
    for (let j = 1; j < n; j++) {
      v.push(add(v[j - 1], [-Math.sin(j * a), Math.cos(j * a)]));
      u.push(add(u[j - 1], [Math.sin(j * a), Math.cos(j * a)]));
    }
    return { a, v, u, s0: [[0, 0], [h, 0], [h, -1], [0, -1]] };
  }

  // What each family draws: its bands, the marks in red, the names, and whether the criterion holds.
  const FAMILIES = {
    "bsbs-2": (n, h) => {
      const { a, v, u, s0 } = bases(n, h);
      const d = sub(u[2], u[3]), nrm = [-Math.cos(3 * a), Math.sin(3 * a)];     // along u_3 u_2, and outward
      const end = add(u[3], mul(d, 3)), w2 = add(end, mul(nrm, h));
      const s2 = [u[3], end, w2, add(u[3], mul(nrm, h))];
      const R = [-(Math.sin(a) + Math.sin(2 * a)), 0];
      const Q = [R, v[0], v[1], v[2]];
      const inside = Q.every((p, i) => cross(sub(Q[(i + 1) % 4], p), sub(w2, p)) > 0);
      return {
        v, u, bands: [["0", s0, 1], ["2", s2, 3]],
        marks: `<polygon class="quad" points="${points(Q)}"/>`,
        dots: [w2],
        labels: [["v", "0", v[0], [0.6, -0.9]], ["v", "1", v[1], [1, 0]], ["v", "2", v[2], [1, 0.2]], ["R", "", R, [0, -1]],
          ["u", "0", u[0], [-0.6, -0.9]], ["u", "3", u[3], [-1, 0.2]], ["w", "2", w2, [-1, 0.6]]],
        keep: [...v.slice(0, 4), ...u.slice(0, 5), ...s2, R],
        holds: inside,
        say: inside
          ? { en: "w<sub>2</sub> is inside Q, so the two end faces overlap.", ja: "w<sub>2</sub> は Q の内部にある。よって、両端の面は重なる。" }
          : { en: "w<sub>2</sub> is not inside Q.", ja: "w<sub>2</sub> は Q の内部にない。" },
      };
    },
    "sbsbs-1": (n, h) => {
      const { a, v, u, s0 } = bases(n, h);
      const n1 = [Math.cos(a), Math.sin(a)], n2 = [-Math.cos(2 * a), Math.sin(2 * a)];   // outward normals
      const x1 = v[1], x2 = add(v[1], mul(n1, h)), w1 = u[1], w2 = add(u[1], mul(n2, h));
      const s1 = [v[0], v[1], x2, add(v[0], mul(n1, h))];
      const d2 = sub(u[2], u[1]), far = add(u[1], mul(d2, n - 2));
      const s2 = [u[1], far, add(far, mul(n2, h)), w2];
      const side = (p, q, r) => Math.sign(cross(sub(q, p), sub(r, p)));
      const crossing = side(x1, x2, w1) * side(x1, x2, w2) < 0 && side(w1, w2, x1) * side(w1, w2, x2) < 0;
      return {
        v, u, bands: [["0", s0, 1], ["1", s1, 1], ["2", s2, n - 2]],
        marks: `<polyline class="segment" points="${points([x1, x2])}"/><polyline class="segment" points="${points([w1, w2])}"/>`,
        dots: [x1, x2, w1, w2],
        labels: [["v", "0", v[0], [0.6, -0.9]], ["x", "1", x1, [-1, 0]], ["x", "2", x2, [-0.4, 1]], ["w", "1", w1, [1, 0]], ["w", "2", w2, [0.4, 1]],
          ["u", "0", u[0], [-0.6, -0.9]]],
        keep: [...v.slice(0, 3), ...u.slice(0, 4), ...s1, u[1], w2, add(u[1], mul(d2, 2))],
        holds: crossing,
        say: crossing
          ? { en: "x<sub>1</sub>x<sub>2</sub> and w<sub>1</sub>w<sub>2</sub> cross, so the two end faces overlap.", ja: "x<sub>1</sub>x<sub>2</sub> と w<sub>1</sub>w<sub>2</sub> は交差する。よって、両端の面は重なる。" }
          : { en: "x<sub>1</sub>x<sub>2</sub> and w<sub>1</sub>w<sub>2</sub> do not cross.", ja: "x<sub>1</sub>x<sub>2</sub> と w<sub>1</sub>w<sub>2</sub> は交差しない。" },
      };
    },
  };

  // Where a band is named: its middle, or, for a long band (S2 of SBSBS-1), the middle of its first 1.5 side
  // faces, which are in the frame. The corners of a band run p0, p1 along its length, then p2, p3.
  const middle = (pts, len) => {
    const t = len > 3 ? 1.5 / len : 1, b = add(pts[0], mul(sub(pts[1], pts[0]), t));
    return centroid([pts[0], b, add(b, sub(pts[3], pts[0])), pts[3]]);
  };

  function draw(svg, key, n, h) {
    const g = FAMILIES[key](n, h);
    // A 4:3 frame around the points that matter: the ends of the bases near S0, S0, and the marks.
    const xs = g.keep.map((p) => p[0]).concat([-1.2, h + 1.2]), ys = g.keep.map((p) => p[1]).concat([-1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 0.12 * Math.max(x1 - x0, y1 - y0);
    let w = x1 - x0 + 2 * pad, hh = y1 - y0 + 2 * pad, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    if (w / hh > 4 / 3) hh = (w * 3) / 4; else w = (hh * 4) / 3;
    const size = 0.035 * w, off = 0.9 * size;
    svg.setAttribute("viewBox", `${f(cx - w / 2)} ${f(-cy - hh / 2)} ${f(w)} ${f(hh)}`);
    svg.innerHTML =
      `<polygon class="base" points="${points(g.v)}"/><polygon class="base" points="${points(g.u)}"/>` +
      g.bands.map(([, pts]) => `<polygon class="band" points="${points(pts)}"/>`).join("") +
      g.marks + g.dots.map(([x, y]) => `<circle class="corner" cx="${f(x)}" cy="${f(-y)}" r="${f(0.22 * size)}"/>`).join("") +
      name("B", "1", [cx - w / 2 + 0.12 * w, -0.5], 1.4 * size, "base-label") +
      name("B", "2", [cx + w / 2 - 0.12 * w, -0.5], 1.4 * size, "base-label") +
      g.bands.map(([index, pts, len]) => name("S", index, middle(pts, len), Math.min(size, 0.5 * h + 0.1), "band-label")).join("") +
      g.labels.map(([letter, index, p, [dx, dy]]) => name(letter, index, add(p, [dx * off, dy * off]), size, "vertex-label")).join("");
    return g;
  }

  function setup(root) {
    const key = root.dataset.proof;
    const svg = root.querySelector("svg"), status = root.querySelector(".sketch-status");
    const nInput = root.querySelector("input[data-var=n]"), hInput = root.querySelector("input[data-var=h]");
    const out = (v) => root.querySelector(`output[data-var=${v}]`);
    nInput.min = N[0]; nInput.max = N[1]; nInput.value = START.n;
    hInput.min = H[key][0]; hInput.max = H[key][1]; hInput.value = START.h;
    const update = () => {
      const n = Number(nInput.value), h = Number(hInput.value);
      out("n").textContent = String(n);
      out("h").textContent = h.toFixed(2);
      const g = draw(svg, key, n, h);
      status.innerHTML = Lang.t(g.say);
      status.classList.toggle("overlap", g.holds);
      status.classList.toggle("no-overlap", !g.holds);
    };
    root.addEventListener("input", update);
    Lang.onChange(update);
    update();
  }

  return { FAMILIES, setup };
})();

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-proof]")) LargeProof.setup(root);
}
