// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 10 of the home page: the families BSBS-2 and SBSBS-1 (families.js) for n >= 26, side by side,
// with one slider for n (26 to 100) and one for h (0.05 to 100 on a logarithmic scale) for both. Only the
// part around S0 is drawn: the frame has S0 a little below its middle and grows with h, so that the bands
// and the overlap of the two end faces stay in view however large the bases are. The drawing is draw()
// in enumeration.js; the labels of the side faces are left out, and the names of the bases and the bands
// are set in sizes that follow the frame. Plain JavaScript, no build step.

const Large = (() => {
  const N = [26, 100], START = { n: 26, h: 1.15 };
  const LOG_MIN = -1.301, LOG_MAX = 2;                  // h from 0.05 to 100, as in Figure 4
  const f = (x) => x.toFixed(3);
  const centroid = (p) => [p.reduce((s, q) => s + q[0], 0) / p.length, p.reduce((s, q) => s + q[1], 0) / p.length];

  // A name with its index as a subscript, as in enumeration.js.
  const name = (letter, index, [x, y], size, cls) =>
    `<text class="${cls}" x="${f(x)}" y="${f(y)}" font-size="${f(size)}" stroke-width="${f(size / 3)}" dy="0.35em">${letter}<tspan dy="0.3em" font-size="${f(0.7 * size)}">${index}</tspan></text>`;

  // The frame around S0 for the height h: 4:3, as tall as 3.2 (1 + h), with the center of S0 at 62% of
  // the height from the top (the bands S1 and S2 go up from S0).
  function frame(s0, h) {
    const [cx, cy] = centroid(s0);
    const hh = 3.2 * (1 + h), w = (hh * 4) / 3;
    return [cx - w / 2, cy - 0.62 * hh, w, hh];
  }

  function draw(svg, n, h, P) {
    const { bases, bands } = Enumeration.shapes(n, h, P);
    const s0 = bands.find((b) => b.index === "0");
    const box = frame(s0.pts, h), [x0, y0, w, hh] = box;
    const overlapping = Enumeration.draw(svg, n, h, P, { box, label: 0.025 * w });
    for (const text of svg.querySelectorAll("text")) text.remove();

    // The name of each base on the way from the center of S0 to the center of the base, at most 0.3 of
    // the width of the frame from S0, so that it stays in the frame; no larger than half the circumradius.
    const c = centroid(s0.pts), R = 1 / (2 * Math.sin(Math.PI / n));
    const names = bases.map(({ index, pts }) => {
      const o = centroid(pts), d = Math.hypot(o[0] - c[0], o[1] - c[1]), t = Math.min(1, (0.3 * w) / d);
      return name("B", index, [c[0] + t * (o[0] - c[0]), c[1] + t * (o[1] - c[1])], Math.min(0.055 * w, 0.5 * R), "base-label");
    });
    // The name of each band in the middle of its part in the frame, no larger than its narrower side.
    const rect = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + hh], [x0, y0 + hh]];
    for (const b of bands) {
      const part = Unfolding.clip(b.pts, rect);
      if (part.length < 3) continue;
      names.push(name("S", b.index, centroid(part), Math.min(0.04 * w, 0.8 * Math.min(h, b.len)), "band-label"));
    }
    svg.insertAdjacentHTML("beforeend", names.join(""));
    return overlapping;
  }

  function setup(figure) {
    const nInput = figure.querySelector("input[data-var=n]"), hInput = figure.querySelector("input[data-var=h]");
    const out = (v) => figure.querySelector(`output[data-var=${v}]`);
    nInput.min = N[0]; nInput.max = N[1]; nInput.value = START.n;
    hInput.min = LOG_MIN; hInput.max = LOG_MAX; hInput.value = Math.log10(START.h);
    // data-large names the family (not data-family, which is for family.js)
    const panels = [...figure.querySelectorAll("[data-large]")].map((root) => ({
      P: Families[root.dataset.large].P, svg: root.querySelector("svg"), status: root.querySelector(".sketch-status"),
    }));

    const update = () => {
      const n = Number(nInput.value), h = 10 ** Number(hInput.value);
      out("n").textContent = String(n);
      out("h").textContent = h.toPrecision(3);
      for (const { P, svg, status } of panels) {
        const overlapping = draw(svg, n, h, P);
        status.textContent = overlapping
          ? Lang.t({ en: "The two end faces overlap.", ja: "両端の面は重なる。" })
          : Lang.t({ en: "The two end faces do not overlap.", ja: "両端の面は重ならない。" });
        status.classList.toggle("overlap", overlapping);
        status.classList.toggle("no-overlap", !overlapping);
      }
    };
    figure.addEventListener("input", update);
    Lang.onChange(update);
    update();
  }

  return { setup };
})();

if (typeof document !== "undefined") {
  const figure = document.getElementById("large");
  if (figure) Large.setup(figure);
}
