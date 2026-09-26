// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 3 of the home page: an example of each of the seven patterns of path partial unfoldings,
// redrawn from Fig. 4 of the paper (docs/WALCOM2027/fig/pattern_*.pdf) with the same faces and colors.
// Plain JavaScript, no build step.

const Patterns = (() => {
  const N = 10;                          // the regular 10-gonal prism, as in the paper
  const H = 1.4;                         // about the height in the figure of the paper
  const PX = 28;                         // pixels per unit length (the labels in style.css are sized to it)
  const PAD = 0.3;                       // margin around each drawing, in units

  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const mul = (p, s) => [p[0] * s, p[1] * s];
  const outward = (d) => [d[1], -d[0]];  // the outside of an edge of a counterclockwise base

  // A base: the regular N-gon walked counterclockwise from `start`, its edge 0 in the direction theta0.
  const base = (start, theta0) => ({ type: "base", ...Unfolding.polygon(start, theta0, 2 * Math.PI / N, N) });

  // A band of `len` side faces from the point a in the direction d, raised by H in the direction m.
  const strip = (a, d, len, m) => ({ type: "band", a, d, len, m, v: Unfolding.band(a, d, len, m, H) });

  // A band of `len` side faces joined to the edge k of the base b. It starts on that edge and runs on
  // past the end of the edge (forward) or past its start (backward).
  function band(b, k, len, forward = true) {
    const d = forward ? b.d[k] : mul(b.d[k], -1);
    return strip(forward ? b.v[k] : b.v[(k + 1) % N], d, len, outward(b.d[k]));
  }

  // The faces of each pattern along the path, placed as in the figure of the paper.
  // B1 has its edge 0 on the right, running up: edge 2 ends at the top vertex, and edge 4 at the
  // upper end of the left side. B2 is joined to the far side of the last face of the band s on
  // edge 0; its edge 0 is its left side, running down, edge 6 starts at the upper end of its right side,
  // and edge 8 starts at its top vertex.
  function build(name) {
    const b1 = base([0, 0], Math.PI / 2);
    const s0 = (len) => band(b1, 0, len);
    const b2 = (s) => base(s.v[2], -Math.PI / 2);
    switch (name) {
      case "B": return [b1];
      case "BS": return [b1, s0(2)];
      case "BSB": { const s = s0(3); return [b1, s, b2(s)]; }
      case "BSBS": { const s = s0(2), c = b2(s); return [b1, s, c, band(c, 8, 2)]; }
      case "S": return [strip([0, 0], [0, 1], 3, [1, 0])];
      case "SBS": return [band(b1, 4, 2, false), b1, band(b1, 0, 3)];
      case "SBSBS": { const s = s0(1), c = b2(s); return [band(b1, 2, 2, false), b1, s, c, band(c, 6, 2)]; }
      default: return [];
    }
  }

  // The bounding box of the faces, in units.
  function box(faces) {
    const all = faces.flatMap((face) => face.v);
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }

  const f = (x) => x.toFixed(2);
  const S = ([x, y]) => [x * PX, -y * PX];               // to pixels; SVG has y pointing down
  const points = (p) => p.map((q) => S(q).map(f).join(",")).join(" ");
  const center = (p) => mul(p.reduce(add, [0, 0]), 1 / p.length);

  // Draws the faces into `svg` at PX pixels per unit, `height` units tall and centered vertically.
  // The faces are drawn in the order of the path, and the labels last.
  function render(svg, faces, height) {
    const b = box(faces);
    const w = b.x1 - b.x0 + 2 * PAD;
    const [vx, vy] = S([b.x0 - PAD, (b.y0 + b.y1) / 2 + height / 2]);
    svg.setAttribute("viewBox", `${f(vx)} ${f(vy)} ${f(w * PX)} ${f(height * PX)}`);
    svg.setAttribute("width", f(w * PX));
    svg.setAttribute("height", f(height * PX));

    let out = "";
    for (const face of faces) {
      out += `<polygon class="${face.type}" points="${points(face.v)}"/>`;
      if (face.type === "band") {
        for (let k = 1; k < face.len; k++) {
          const p = add(face.a, mul(face.d, k));
          out += `<polyline class="fold" points="${points([p, add(p, mul(face.m, H))])}"/>`;
        }
      }
    }
    for (const face of faces) {
      const [x, y] = S(center(face.v));
      out += `<text class="label ${face.type}-label" x="${f(x)}" y="${f(y)}" dy="0.35em">${face.type === "base" ? "B" : "S"}</text>`;
    }
    svg.innerHTML = out;
  }

  // All seven drawings share one height, so that they are at one scale and line up.
  function setup(figure) {
    const drawings = [...figure.querySelectorAll("[data-pattern]")].map((el) => ({ el, faces: build(el.dataset.pattern) }));
    const height = Math.max(...drawings.map(({ faces }) => { const b = box(faces); return b.y1 - b.y0; })) + 2 * PAD;
    for (const { el, faces } of drawings) render(el.querySelector("svg"), faces, height);
  }

  return { build, setup };
})();

if (typeof document !== "undefined") {
  Patterns.setup(document.getElementById("patterns"));
}
