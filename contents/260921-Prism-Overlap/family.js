// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// The figure on the page of each family (derivations/bsbs-*.html, derivations/sbsbs-*.html), and the
// three drawings of Figure 9 of the home page: the path partial unfolding of the family, drawn as in
// Appendix C of the paper, with sliders for n and h and the overlap of its two end faces in red. The
// parameters of the families are in families.js and the geometry in unfolding.js. On the pages of the
// families other than the three of Figure 9, the line that separates the two end faces for
// h_1(n) <= h <= h_2(n) is drawn for each n up to 25 (separations.js). Plain JavaScript, no build step.
//
// The limits of the sliders are written into each page (scripts/gen_family_pages.py, and by hand in
// index.html): n runs from the smallest n of the family in Appendix C up to 31, and h from 0.05 to 100
// on a logarithmic scale, as in Figure 2 of the home page. The slider for h holds log10(h).
//
// A drawing with data-n has that n fixed and no slider for n; its slider for h runs from h_1(n) to
// h_2(n) (separations.js) and holds the fraction t of the way, h = h_1(n) + t (h_2(n) - h_1(n)).
//
// A drawing with data-frame="proof" has no sliders: it shows the n of data-n and the h of data-h, "h1" or
// "h2" for h_1(n) or h_2(n), in the coordinates of the proof on the page of the family: b_0 at the
// origin, b_1 on the positive x-axis and B1 above it, with the axes, in the proportions of the drawing.
// data-labels names vertices: a list of [text, base or band, "b" or "t", j, "out" or "in"], for the
// vertex b_j or t_j of that base or band, named outside it or inside it.

const Family = (() => {
  const fmt = (h) => h.toPrecision(3);
  const LABEL_PX = 15;                   // the size of the labels of a drawing with data-frame="proof", in pixels

  function setup(root) {
    const { P } = Families[root.dataset.family];
    const svg = root.querySelector("svg");
    const nInput = root.querySelector("input[data-var=n]"), hInput = root.querySelector("input[data-var=h]");
    const nOut = root.querySelector("output[data-var=n]"), hOut = root.querySelector("output[data-var=h]");
    const status = root.querySelector(".sketch-status");
    const lines = typeof Separations === "undefined" ? {} : Separations[root.dataset.family] || {};
    const fixed = root.dataset.n ? Number(root.dataset.n) : null;
    const proof = root.dataset.frame === "proof";
    const labels = root.dataset.labels ? JSON.parse(root.dataset.labels) : [];
    const height = (n) => {
      if (proof) return lines[n].h[root.dataset.h === "h1" ? 0 : 1];
      if (fixed === null) return 10 ** Number(hInput.value);
      const [h1, h2] = lines[n].h;
      return h1 + Number(hInput.value) * (h2 - h1);
    };
    const update = () => {
      const n = fixed ?? Number(nInput.value), h = height(n);
      const g = Unfolding.family(n, h, P);
      const sep = lines[n];
      if (sep) g.lines = [Unfolding.edge(g, sep.end === "S2" ? 1 : 0, sep.ids)];
      if (proof) {
        const [p0, p1] = [0, 1].map((j) => Unfolding.vertex(g, n, "B1", "b", j));
        g.rotate = Math.PI - Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);      // b_0 b_1 along +x after the mirror
        g.mirror = true;
        g.fit = true;
        g.labelPx = LABEL_PX;
        g.axes = [p0, p1];
        // each label goes out along the bisector of the outer angle of its base or band at the vertex,
        // or in along it
        const unit = (p, q) => { const d = [p[0] - q[0], p[1] - q[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };
        g.labels = labels.map(([text, on, kind, j, side]) => {
          const at = Unfolding.vertex(g, n, on, kind, j);
          const outline = Unfolding.hull(g.sets[on].flatMap((face) => face.pts));
          const dist = outline.map((q) => Math.hypot(q[0] - at[0], q[1] - at[1]));
          const k = dist.indexOf(Math.min(...dist)), m = outline.length;
          const [u, v] = [unit(at, outline[(k + m - 1) % m]), unit(at, outline[(k + 1) % m])];
          const dir = [u[0] + v[0], u[1] + v[1]];
          return { text, at, dir: side === "in" ? [-dir[0], -dir[1]] : dir };
        });
      }
      const overlapping = Unfolding.render(svg, g);
      if (nOut) nOut.textContent = String(n);
      if (!status) return;
      hOut.textContent = fmt(h);
      status.textContent = overlapping
        ? Lang.t({ en: "The two end faces overlap.", ja: "両端の面は重なる。" })
        : Lang.t({ en: "The two end faces do not overlap.", ja: "両端の面は重ならない。" });
      status.classList.toggle("overlap", overlapping);
      status.classList.toggle("no-overlap", !overlapping);
    };
    if (nInput) nInput.addEventListener("input", update);
    if (hInput) hInput.addEventListener("input", update);
    if (proof) window.addEventListener("resize", update);        // the labels keep their size on the screen
    Lang.onChange(update);
    update();
  }

  return { setup };
})();

if (typeof document !== "undefined") {
  for (const root of document.querySelectorAll("[data-family]")) Family.setup(root);
}
