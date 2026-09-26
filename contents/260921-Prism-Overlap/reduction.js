// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figures 5 to 7 of the home page, for the three steps of the reduction.
// Figures 5 and 6 show path partial unfoldings of pattern SBSBS side by side. Figure 5: three that differ
// only in the lengths of S1 and S2, as in Fig. 6 of the paper; the bands of (a) are not maximal, those of
// (b) and (c) are. Figure 6: (b), (c) and (d) are congruent to (a), with the two bases exchanged, with the
// labels of the side faces reversed, and with both. In both figures, the button "Overlay" slides a copy of
// (a) onto the others, turning it over or around on the way in Figure 6, and "Back" slides it back.
// Figure 7: a candidate with the AABBs of its two end faces in the coordinate system turned by k alpha/2,
// shown by turning the unfolding the other way, with sliders for h and k, and whether that coordinate
// system shows the two end faces apart for every h.
// The drawing is draw() in enumeration.js. Plain JavaScript, no build step.

const Reduction = (() => {
  // Figure 5: the parameters of Fig. 6 of the paper. In (a), S1 has one side face, so d1 does not change it.
  const MAXIMAL = {
    n: 40, h: 0.9,
    panels: {
      a: { l0: 3, p1: 4, d1: -1, l1: 1, p2: 9, d2: -1, l2: 3 },
      b: { l0: 3, p1: 4, d1: -1, l1: 2, p2: 9, d2: -1, l2: 5 },
      c: { l0: 3, p1: 4, d1: 1, l1: 2, p2: 9, d2: -1, l2: 4 },
    },
    // The part of the drawing shown, the same for the three: around S0, as in the paper.
    view: { box: [-3.4, -10.0, 9.4, 10.6], label: 0.4 },
    lengths: true,                                           // dimension lines along S1 and S2
    baseNames: [["1", -2.2, -0.8], ["2", 3.4, -0.8]],        // where B1 and B2 are named
  };
  // Figure 6: with l0 = 1, exchanging the bases and reversing the labels each give a candidate. (b) is (a)
  // turned over left to right, (c) is (a) turned over top to bottom, and (d), with both, is (a) turned
  // around by 180 degrees (data-flip in index.html).
  const CONGRUENT = {
    n: 12, h: 1,
    ratio: 2,                                                // of the frame; style.css has the same
    panels: {
      a: { l0: 1, p1: 3, d1: 1, l1: 2, p2: 7, d2: -1, l2: 3 },
      b: { l0: 1, p1: 7, d1: -1, l1: 3, p2: 3, d2: 1, l2: 2 },
      c: { l0: 1, p1: 9, d1: -1, l1: 2, p2: 5, d2: 1, l2: 3 },
      d: { l0: 1, p1: 5, d1: 1, l1: 3, p2: 9, d2: -1, l2: 2 },
    },
  };
  // Figure 7: the coordinate system of the drawing (k = 0) does not show the two end faces apart, but those
  // turned by k alpha/2 for k = 2, 12, 22 and 32 do. At the first h, the boxes for k = 0 meet.
  const SEPARATION = { n: 20, P: { l0: 1, p1: 2, d1: -1, l1: 2, p2: 4, d2: -1, l2: 2 }, h: 8 };
  const LOG_MIN = -1.301, LOG_MAX = 2;                       // h from 0.05 to 100, as in Figure 4
  const EPS = 1e-9;
  const TIME = 800;                                          // the slide, in milliseconds

  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, s) => [p[0] * s, p[1] * s];
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1];
  const centroid = (p) => mul(p.reduce(add, [0, 0]), 1 / p.length);
  const f = (x) => x.toFixed(3);
  const points = (p) => p.map((q) => `${f(q[0])},${f(q[1])}`).join(" ");

  // A frame centered on S0 of (a), as wide as `ratio` times its height. For l0 = 1 the two bases lie level
  // on either side of S0, so turning the frame over, left to right or top to bottom, turns the drawing over
  // about S0.
  function frame({ n, h, ratio, panels }) {
    const { bases, bands } = Enumeration.shapes(n, h, panels.a);
    const [cx, cy] = centroid(bands.find((b) => b.index === "0").pts);
    const all = [...bases, ...bands].flatMap((shape) => shape.pts);
    let w = 2 * Math.max(...all.map((p) => Math.abs(p[0] - cx)));
    let hh = 2 * Math.max(...all.map((p) => Math.abs(p[1] - cy)));
    const pad = 0.04 * Math.max(w, hh);
    w += 2 * pad; hh += 2 * pad;
    if (w / hh > ratio) hh = w / ratio; else w = hh * ratio;
    return { box: [cx - w / 2, cy - hh / 2, w, hh], label: 0.45 };
  }

  // A dimension line along the side of a band away from its base, with the length of the band.
  function dimension(band, base) {
    const o = centroid(base.pts), c = centroid(band.pts);
    const sides = band.pts.map((p, i) => [p, band.pts[(i + 1) % band.pts.length]])
      .filter(([p, q]) => Math.abs(Math.hypot(q[0] - p[0], q[1] - p[1]) - band.len) < 1e-9);
    const far = (s) => { const m = centroid(s); return Math.hypot(m[0] - o[0], m[1] - o[1]); };
    const [p, q] = sides.reduce((a, b) => (far(b) > far(a) ? b : a));
    const e = sub(q, p), len = Math.hypot(e[0], e[1]);
    let u = [-e[1] / len, e[0] / len];
    if (dot(u, sub(centroid([p, q]), c)) < 0) u = mul(u, -1);          // away from the band
    const at = (r, t) => add(r, mul(u, t));
    const [x, y] = at(centroid([p, q]), 0.75);
    return `<polyline class="dimension" points="${points([at(p, 0.15), at(p, 0.35), at(q, 0.35), at(q, 0.15)])}"/>` +
      `<text class="dimension-label" x="${f(x)}" y="${f(y)}" font-size="0.55" dy="0.35em">${band.len}</text>`;
  }

  function draw(svg, spec, P, view) {
    Enumeration.draw(svg, spec.n, spec.h, P, view);
    const { bases, bands } = Enumeration.shapes(spec.n, spec.h, P);
    svg.insertAdjacentHTML("beforeend",
      (spec.lengths ? bands.filter((b) => b.index !== "0").map((b) => dimension(b, bases[b.index === "1" ? 0 : 1])).join("") : "") +
      (spec.baseNames ?? []).map(([index, x, y]) =>
        `<text class="base-label" x="${x}" y="${y}" font-size="0.8" dy="0.35em">B<tspan dy="0.3em" font-size="0.56">${index}</tspan></text>`).join(""));
  }

  function setup(figure, spec) {
    const view = spec.view ?? frame(spec);
    const panel = (key) => figure.querySelector(`[data-panel=${key}]`);
    for (const key of Object.keys(spec.panels)) draw(panel(key).querySelector("svg:not(.ghost)"), spec, spec.panels[key], view);
    const ghosts = [...figure.querySelectorAll("svg.ghost")];
    for (const ghost of ghosts) Enumeration.draw(ghost, spec.n, spec.h, spec.panels.a, view);
    const origin = panel("a").querySelector("svg");

    const overlay = figure.querySelector("[data-action=overlay]"), back = figure.querySelector("[data-action=back]");
    let over = false, moving = false;
    const sync = () => { overlay.disabled = over || moving; back.disabled = !over || moving; };

    // Slides the copies of (a) from (a) onto the other panels (forward), or back, turning each over or
    // around as its data-flip says (style.css holds it there). Each copy sits on its panel, so that it stays
    // there when the page is resized; it starts (or ends) moved onto (a).
    const slide = (forward) => {
      moving = true;
      sync();
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const runs = ghosts.map((ghost) => {
        ghost.classList.add("shown");
        const from = origin.getBoundingClientRect(), to = ghost.getBoundingClientRect();
        const turn = { x: "rotate(0deg) scale(-1, 1)", y: "rotate(0deg) scale(1, -1)", xy: "rotate(180deg) scale(1, 1)" }[ghost.dataset.flip]
          ?? "rotate(0deg) scale(1, 1)";
        const away = { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) rotate(0deg) scale(1, 1)` };
        const home = { transform: `translate(0px, 0px) ${turn}` };
        return ghost.animate(forward ? [away, home] : [home, away],
          { duration: still ? 0 : TIME, easing: "cubic-bezier(0.45, 0, 0.2, 1)" }).finished;
      });
      Promise.all(runs).then(() => {
        over = forward;
        for (const ghost of ghosts) ghost.classList.toggle("shown", over);
        moving = false;
        sync();
      });
    };
    overlay.addEventListener("click", () => slide(true));
    back.addEventListener("click", () => slide(false));
    sync();
  }

  // ---------------------------------------------------------------- Figure 7

  // Each coordinate of each vertex of the two end faces as a + b h (the lemma of Section 5.3), with a and b
  // read off the drawings for h = 1 and h = 2. The coordinates are those of the drawing, with y upward.
  function coefficients(n, P) {
    const [one, two] = [1, 2].map((h) => Enumeration.shapes(n, h, P).ends);
    return one.map((face, i) => face.map(([x, y], j) => {
      const [x2, y2] = two[i][j];
      return { a: [2 * x - x2, -(2 * y - y2)], b: [x2 - x, -(y2 - y)] };
    }));
  }

  // Whether, in the coordinate system turned by theta, every vertex of one end face has a larger x (or y)
  // than every vertex of the other for every h > 0: a >= a' and b >= b', not both equal. Returns "x", "y",
  // or null when neither can be shown.
  function apart(coef, theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    const turn = ({ a, b }) => ({
      x: [a[0] * c + a[1] * s, b[0] * c + b[1] * s],
      y: [-a[0] * s + a[1] * c, -b[0] * s + b[1] * c],
    });
    const [E, F] = coef.map((face) => face.map(turn));
    const above = (P, Q, axis) => P.every((p) => Q.every((q) => {
      const [a, b] = p[axis], [a2, b2] = q[axis];
      return a >= a2 - EPS && b >= b2 - EPS && (a > a2 + EPS || b > b2 + EPS);
    }));
    return ["x", "y"].find((axis) => above(E, F, axis) || above(F, E, axis)) ?? null;
  }

  function setupSeparation(figure) {
    const { n, P } = SEPARATION;
    const svg = figure.querySelector("svg:not(.axes)"), axes = figure.querySelector("svg.axes");
    const status = figure.querySelector(".sketch-status");
    const hInput = figure.querySelector("input[data-var=h]"), kInput = figure.querySelector("input[data-var=k]");
    const out = (v) => figure.querySelector(`output[data-var=${v}]`);
    hInput.min = LOG_MIN; hInput.max = LOG_MAX; hInput.value = Math.log10(SEPARATION.h);
    kInput.max = 2 * n;                                      // a full turn; k and k + n differ by 180 degrees
    const coef = coefficients(n, P);

    // The axes beside the sliders, from the center of a 3.2 x 3.2 square: x to the right and y upward, since
    // the unfolding is turned instead of the coordinate system.
    const axis = (e, name) => {
      const tip = mul(e, 1.1), side = [-e[1], e[0]];
      const head = [tip, add(mul(e, 0.8), mul(side, 0.14)), add(mul(e, 0.8), mul(side, -0.14))];
      const [x, y] = mul(e, 1.42);
      return `<polyline class="axis" points="${points([[0, 0], tip])}"/><polygon class="axis-head" points="${points(head)}"/>` +
        `<text class="axis-label" x="${f(x)}" y="${f(y)}" font-size="0.6" dy="0.35em">${name}</text>`;
    };
    axes.innerHTML = axis([1, 0], "x") + axis([0, -1], "y");

    const update = () => {
      const h = 10 ** Number(hInput.value), k = Number(kInput.value), theta = k * Math.PI / n;
      out("h").textContent = h.toPrecision(3);
      out("k").textContent = `${k} (${Number((180 * k / n).toFixed(1))}°)`;

      // The coordinate system turned counterclockwise by theta is shown by turning the unfolding clockwise by
      // theta about the center c of its bounding box, so that the AABBs stand upright. The frame is the
      // square around the circle about c through the farthest vertex, the same for every k.
      const shape = Enumeration.shapes(n, h, P);
      const all = [...shape.bases, ...shape.bands].flatMap((s) => s.pts);
      const [x0, x1] = [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))];
      const [y0, y1] = [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))];
      const c = [(x0 + x1) / 2, (y0 + y1) / 2];
      const r = 1.04 * Math.max(...all.map((p) => Math.hypot(...sub(p, c))));
      const cos = Math.cos(theta), sin = Math.sin(theta);
      const move = (p) => { const [x, y] = sub(p, c); return add(c, [cos * x - sin * y, sin * x + cos * y]); };  // y points down
      Enumeration.draw(svg, n, h, P, { box: [c[0] - r, c[1] - r, 2 * r, 2 * r], label: 0.32, move });

      const sep = apart(coef, theta);
      const boxes = shape.ends.map((pts) => {
        const xs = pts.map((p) => move(p)[0]), ys = pts.map((p) => move(p)[1]);
        const [a0, a1, b0, b1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        return `<polygon class="aabb${sep ? " apart" : ""}" points="${points([[a0, b0], [a1, b0], [a1, b1], [a0, b1]])}"/>`;
      });
      svg.insertAdjacentHTML("beforeend", boxes.join(""));

      status.innerHTML = sep
        ? Lang.t({ en: `In this coordinate system, the <i>${sep}</i>-ranges are apart for every <i>h</i> &gt; 0.`,
          ja: `この座標系では、すべての <i>h</i> &gt; 0 で <i>${sep}</i> の範囲が交わらない。` })
        : Lang.t({ en: "This coordinate system does not show that the two end faces are apart.", ja: "この座標系では、両端の面が離れていることを示せない。" });
      status.classList.toggle("no-overlap", !!sep);
    };
    figure.addEventListener("input", update);
    Lang.onChange(update);
    update();
  }

  return { MAXIMAL, CONGRUENT, SEPARATION, frame, coefficients, apart, setup, setupSeparation };
})();

if (typeof document !== "undefined") {
  for (const [id, spec] of [["maximal", Reduction.MAXIMAL], ["congruent", Reduction.CONGRUENT]]) {
    const figure = document.getElementById(id);
    if (figure) Reduction.setup(figure, spec);
  }
  const figure = document.getElementById("separation");
  if (figure) Reduction.setupSeparation(figure);
}
