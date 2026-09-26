// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 8 of the home page: the candidates of one family of pattern BSBS (BSBS-5 of Appendix C, as in
// Fig. 7 of the paper), with a slider for n. The family is for 21 <= n <= 25; the slider goes on to n = 40
// with the same parameters. Only the part near S0 and S2 is drawn, in a frame fixed to S0, which stays in
// place for every n: the bases grow with n, and S2 stays attached at the same place relative to S0, on the
// side face n - 3. The drawing is draw() in enumeration.js.
// Plain JavaScript, no build step.

const Grouping = (() => {
  const N = [21, 40], H = 1;
  const params = (n) => ({ l0: 2, p2: n - 3, d2: 1, l2: 3 });
  const VIEW = { box: [-2.6, -3.2, 8.4, 6.3], label: 0.3 };      // around S0 (0 <= x <= 1, -2 <= y <= 0)
  // The names of the bases, at fixed places: their centers leave the frame as n grows (that of B1 for
  // every n). The two places are symmetric about the center of S0, as B1 and B2 are.
  const NAMES = [["1", [-1.7, -0.6]], ["2", [2.7, -1.4]]];

  function setup(figure) {
    const svg = figure.querySelector("svg"), input = figure.querySelector("input[data-var=n]");
    const out = (v) => figure.querySelectorAll(`output[data-var=${v}]`);
    input.min = N[0]; input.max = N[1]; input.value = N[0];

    const update = () => {
      const n = Number(input.value);
      Enumeration.draw(svg, n, H, params(n), VIEW);
      for (const label of svg.querySelectorAll("text.base-label")) label.remove();
      for (const [index, [x, y]] of NAMES) {
        svg.insertAdjacentHTML("beforeend",
          `<text class="base-label" x="${x}" y="${y}" font-size="0.8" dy="0.35em">B<tspan dy="0.3em" font-size="0.56">${index}</tspan></text>`);
      }
      for (const o of out("n")) o.textContent = n;
      for (const o of out("p2")) o.textContent = n - 3;
    };
    input.addEventListener("input", update);
    update();
  }

  return { setup };
})();

if (typeof document !== "undefined") {
  const figure = document.getElementById("family");
  if (figure) Grouping.setup(figure);
}
