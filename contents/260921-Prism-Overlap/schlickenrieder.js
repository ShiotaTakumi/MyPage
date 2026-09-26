// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 1 of the home page: the two overlapping edge unfoldings sketched by Schlickenrieder,
// redrawn so that the height h can be changed. The geometry is in unfolding.js.
//   (a) n = 12: the family SBSBS-1 with the end band cut down to one side face;
//   (b) n = 15: the family BSBS-1, with the face joined to B2 unshaded as in Fig. 2 of the paper.
// Plain JavaScript, no build step.

const Schlickenrieder = (() => {
  const sketchA = (h) => Unfolding.sbsbs(12, h, 1);
  const sketchB = (h) => Unfolding.bsbs(15, h, 2, true);

  // One panel: a drawing, a slider for h, and a line telling whether it overlaps.
  function setup(root, build, digits) {
    const svg = root.querySelector("svg");
    const input = root.querySelector("input");
    const output = root.querySelector("output");
    const status = root.querySelector(".sketch-status");
    const update = () => {
      const h = Number(input.value);
      const overlapping = Unfolding.render(svg, build(h));
      output.textContent = h.toFixed(digits);
      status.textContent = overlapping
        ? Lang.t({ en: "This edge unfolding overlaps.", ja: "この辺展開図は重なる。" })
        : Lang.t({ en: "This edge unfolding does not overlap.", ja: "この辺展開図は重ならない。" });
      status.classList.toggle("overlap", overlapping);
      status.classList.toggle("no-overlap", !overlapping);
    };
    input.addEventListener("input", update);
    Lang.onChange(update);
    update();
  }

  return { sketchA, sketchB, setup };
})();

if (typeof document !== "undefined") {
  Schlickenrieder.setup(document.getElementById("sketch-12"), Schlickenrieder.sketchA, 2);
  Schlickenrieder.setup(document.getElementById("sketch-15"), Schlickenrieder.sketchB, 3);
}
