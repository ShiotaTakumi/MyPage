// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Figure 2 of the home page: the classification of Theorem 1 in the (n, h)-plane, redrawn from
// Fig. 3 of the paper (scripts/gen_semilog_en.py), with a readout at the pointer.
// Plain JavaScript, no build step.

const Classification = (() => {
  const { sin, cos, log10, PI } = Math;
  const N_MIN = 3, N_MAX = 31;
  const X_LO = N_MIN - 0.7, X_HI = N_MAX + 0.7;
  const H_LO = 0.05, H_HI = 100;

  // ---------------------------------------------------------------- Theorem 1

  // The four branches of h_1 and the two of h_2, as functions of a real n (alpha = 2 pi / n).
  const H1 = [
    (n) => { const a = 2 * PI / n; return (sin(3 * a) - sin(2 * a)) / cos(a); },                    // 11 <= n <= 12
    (n) => { const a = 2 * PI / n; return (sin(3 * a) - sin(2 * a)) / (cos(a) - cos(3 * a)); },     // 13 <= n <= 16
    (n) => { const a = 2 * PI / n; return (cos(4 * a) + 2 - cos(a) - cos(2 * a)) / sin(3 * a); },   // 17 <= n <= 19
    (n) => { const a = 2 * PI / n;                                                                  // 20 <= n <= 25
      return (2 * sin(5 * a) - sin(4 * a) - sin(3 * a) + sin(a)) / (cos(2 * a) - cos(5 * a)); },
  ];
  const H2 = [
    (n) => { const a = 2 * PI / n; return cos(a) / (sin(3 * a) - sin(2 * a)); },                   // n = 11
    (n) => { const a = 2 * PI / n; return (cos(a) - cos(3 * a)) / (sin(3 * a) - sin(2 * a)); },     // 12 <= n <= 25
  ];
  const branch1 = (n) => (n <= 12 ? 0 : n <= 16 ? 1 : n <= 19 ? 2 : 3);
  const branch2 = (n) => (n <= 11 ? 0 : 1);
  const h1 = (n) => H1[branch1(n)](n);
  const h2 = (n) => H2[branch2(n)](n);

  // Whether the regular n-gonal prism of height h has an overlapping edge unfolding.
  function overlapping(n, h) {
    if (n <= 10) return false;
    if (n >= 26) return true;
    return h < h1(n) || h > h2(n);
  }

  // Where one branch takes over from the next, found by bisection (as in the script of the paper).
  function crossing(f, g, lo, hi) {
    const d = (x) => f(x) - g(x);
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (d(lo) * d(mid) <= 0) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  }
  const SW1 = [crossing(H1[0], H1[1], 11.5, 13.5), crossing(H1[1], H1[2], 15.5, 17.5), crossing(H1[2], H1[3], 19, 21)];
  const SW2 = [crossing(H2[0], H2[1], 11, 13)];

  // Each branch is drawn solid where it is the threshold and dotted elsewhere,
  // darker colors for the branches that take effect first.
  const CURVES = [
    ...H1.map((f, i) => ({ f, cls: ["h1a", "h1b", "h1c", "h1d"][i], from: [11, ...SW1][i], to: [...SW1, X_HI][i] })),
    ...H2.map((f, i) => ({ f, cls: ["h2a", "h2b"][i], from: [11, ...SW2][i], to: [...SW2, X_HI][i] })),
  ];

  // ---------------------------------------------------------------- drawing

  const r1 = (x) => x.toFixed(1);
  const fmt = (h) => h.toPrecision(3);

  function draw(plot) {
    const svg = plot.querySelector("svg");
    const tip = plot.querySelector(".classify-tip");
    const W = plot.clientWidth;
    if (W < 200) return;                  // not laid out yet; drawn once it has a width
    const H = Math.round(Math.min(Math.max(W * 0.56, 320), 560));
    const m = { l: 74, r: 14, t: 10, b: 62 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const LY0 = log10(H_LO), LY1 = log10(H_HI);
    const X = (n) => m.l + (n - X_LO) / (X_HI - X_LO) * pw;
    const Y = (h) => m.t + (LY1 - log10(h)) / (LY1 - LY0) * ph;
    const unitX = pw / (X_HI - X_LO);
    const bw = Math.max(2, 0.3 * unitX);

    // Grid: a line at every 1, 2, ..., 9 times a power of ten, and at every labelled n.
    const step = 2 * unitX >= 34 ? 2 : 4;
    const ticksN = [];
    for (let n = N_MIN; n <= N_MAX; n += step) ticksN.push(n);
    const gridH = [];
    for (let e = -2; e <= 2; e++) for (let k = 1; k <= 9; k++) {
      const h = k * 10 ** e;
      if (h >= H_LO && h <= H_HI) gridH.push({ h, major: k === 1 });
    }
    let out = "";
    out += gridH.map(({ h }) => `<line class="grid" x1="${m.l}" x2="${m.l + pw}" y1="${r1(Y(h))}" y2="${r1(Y(h))}"/>`).join("");
    out += ticksN.map((n) => `<line class="grid" x1="${r1(X(n))}" x2="${r1(X(n))}" y1="${m.t}" y2="${m.t + ph}"/>`).join("");

    // A bar for every n, colored along h.
    for (let n = N_MIN; n <= N_MAX; n++) {
      const x = r1(X(n) - bw / 2), w = r1(bw);
      const bar = (lo, hi, ov) =>
        `<rect class="bar ${ov ? "overlap" : "no-overlap"}" x="${x}" width="${w}" y="${r1(Y(hi))}" height="${r1(Y(lo) - Y(hi))}"/>`;
      if (n <= 10) out += bar(H_LO, H_HI, false);
      else if (n >= 26) out += bar(H_LO, H_HI, true);
      else out += bar(H_LO, h1(n), true) + bar(h1(n), h2(n), false) + bar(h2(n), H_HI, true);
    }

    // The six branches, clipped to the plot.
    const path = (f, lo, hi, steps) => {
      let d = "", pen = false;
      for (let i = 0; i <= steps; i++) {
        const n = lo + (hi - lo) * i / steps, v = f(n);
        if (!Number.isFinite(v) || v <= H_LO / 4 || v >= H_HI * 4) { pen = false; continue; }
        d += `${pen ? "L" : "M"}${r1(X(n))},${r1(Y(v))}`;
        pen = true;
      }
      return d;
    };
    out += `<defs><clipPath id="classify-clip"><rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}"/></clipPath></defs>`;
    out += `<g clip-path="url(#classify-clip)">`;
    out += CURVES.map((c) => `<path class="curve dotted ${c.cls}" d="${path(c.f, 11, X_HI, 400)}"/>`).join("");
    out += CURVES.map((c) => `<path class="curve ${c.cls}" d="${path(c.f, c.from, c.to, 200)}"/>`).join("");
    const dot = (n, f, cls) => `<circle class="dot ${cls}" cx="${r1(X(n))}" cy="${r1(Y(f(n)))}" r="4.5"/>`;
    out += dot(11, H1[0], "h1a") + dot(11, H2[0], "h2a");
    out += SW1.map((n, i) => dot(n, H1[i + 1], ["h1b", "h1c", "h1d"][i])).join("") + dot(SW2[0], H2[1], "h2b");
    out += `</g>`;

    // Frame, ticks and labels.
    out += `<rect class="frame" x="${m.l}" y="${m.t}" width="${pw}" height="${ph}"/>`;
    out += ticksN.map((n) =>
      `<line class="tick" x1="${r1(X(n))}" x2="${r1(X(n))}" y1="${m.t + ph}" y2="${m.t + ph + 5}"/>` +
      `<text class="tick-label" x="${r1(X(n))}" y="${m.t + ph + 22}" text-anchor="middle">${n}</text>`).join("");
    out += gridH.map(({ h, major }) =>
      `<line class="tick" x1="${m.l - (major ? 6 : 3)}" x2="${m.l}" y1="${r1(Y(h))}" y2="${r1(Y(h))}"/>` +
      (major ? `<text class="tick-label" x="${m.l - 10}" y="${r1(Y(h))}" text-anchor="end" dominant-baseline="middle">${h}</text>` : "")).join("");
    out += `<text class="axis-title" x="${r1(m.l + pw / 2)}" y="${H - 10}" text-anchor="middle"><tspan class="var">n</tspan>${Lang.t({ en: " (number of sides)", ja: "（底面の辺の数）" })}</text>`;
    out += `<text class="axis-title" transform="translate(20 ${r1(m.t + ph / 2)}) rotate(-90)" text-anchor="middle"><tspan class="var">h</tspan>${Lang.t({ en: " (height)", ja: "（高さ）" })}</text>`;
    out += `<g class="selection"></g><g class="hover"></g>`;

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("width", W);
    svg.setAttribute("height", H);
    svg.innerHTML = out;
    const hover = svg.querySelector(".hover");
    const mark = () => {
      svg.querySelector(".selection").innerHTML = selected
        ? `<circle class="point" cx="${r1(X(selected.n))}" cy="${r1(Y(selected.h))}" r="4.5"/>`
        : "";
    };
    mark();
    tip.hidden = true;

    // The point under the pointer: the nearest n, and h read off the vertical position.
    // While dragging (`clamp`), a pointer outside the plot is held at its edge.
    const locate = (e, clamp = false) => {
      const box = svg.getBoundingClientRect();
      let px = e.clientX - box.left, py = e.clientY - box.top;
      if (clamp) {
        px = Math.min(Math.max(px, m.l), m.l + pw);
        py = Math.min(Math.max(py, m.t), m.t + ph);
      } else if (px < m.l || px > m.l + pw || py < m.t || py > m.t + ph) return null;
      const n = Math.min(N_MAX, Math.max(N_MIN, Math.round(X_LO + (px - m.l) / unitX)));
      return { n, h: 10 ** (LY1 - (py - m.t) / ph * (LY1 - LY0)), py };
    };

    // Pointing: a readout of n and h only.
    const show = (at) => {
      if (!at) { hide(); return; }
      const { n, h, py } = at, x = X(n);
      hover.innerHTML =
        `<rect class="hover-bar" x="${r1(x - bw / 2 - 3)}" y="${m.t}" width="${r1(bw + 6)}" height="${ph}"/>` +
        `<line class="hover-line" x1="${m.l}" x2="${m.l + pw}" y1="${r1(py)}" y2="${r1(py)}"/>` +
        `<circle class="point" cx="${r1(x)}" cy="${r1(py)}" r="4.5"/>`;
      tip.innerHTML = `<p class="tip-at"><i>n</i> = ${n}, <i>h</i> = ${fmt(h)}</p>`;
      tip.hidden = false;
      // Beside the point if there is room, otherwise above it (or below, near the top).
      const tw = tip.offsetWidth, th = tip.offsetHeight, gap = 18;
      let left, top;
      if (x + gap + tw <= W || x - gap - tw >= 0) {
        left = x + gap + tw <= W ? x + gap : x - gap - tw;
        top = Math.min(Math.max(0, py - th / 2), H - th);
      } else {
        left = Math.min(Math.max(0, x - tw / 2), W - tw);
        top = py - gap - th >= 0 ? py - gap - th : py + gap;
      }
      tip.style.left = `${left}px`;
      tip.style.top = `${top}px`;
    };
    const hide = () => { hover.innerHTML = ""; tip.hidden = true; };

    // Choosing: one point at a time, answered below the plot. Pressing picks the point under the
    // pointer, and dragging moves it along; the answer is redrawn at most once a frame.
    const result = plot.closest(".classify").querySelector(".classify-result");
    let dragging = false, frame = 0;
    const choose = (at) => {
      selected = { n: at.n, h: at.h };
      mark();
      if (!frame) {
        frame = requestAnimationFrame(() => { frame = 0; answer(result, selected.n, selected.h); });
      }
    };
    svg.onpointerdown = (e) => {
      const at = locate(e);
      if (!at) return;
      e.preventDefault();
      dragging = true;
      svg.setPointerCapture(e.pointerId);
      show(at);
      choose(at);
    };
    svg.onpointermove = (e) => {
      const at = locate(e, dragging);
      show(at);
      if (dragging && at) choose(at);
    };
    const release = (e) => {
      dragging = false;
      if (e.pointerType !== "mouse") hide();
    };
    svg.onpointerup = release;
    svg.onpointercancel = release;
    svg.onpointerleave = (e) => { if (e.pointerType === "mouse" && !dragging) hide(); };
  }

  // The point chosen last, (24, 1) to begin with; it stays marked when the plot is redrawn.
  let selected = { n: 24, h: 1 };

  // An overlapping edge unfolding at (n, h), drawn as in Figure 1 (the end band of SBSBS-1 cut down to
  // one face, the other faces joined to B2): for n >= 26, the family of the proof for that height,
  // BSBS-2 below h = 1.15 and SBSBS-1 from there on; otherwise the first of the three families whose
  // end faces overlap. (BSBS-1 needs n >= 4 and BSBS-2 needs n >= 5, for the band to fit on B2.)
  function witness(n, h) {
    const bsbs1 = () => Unfolding.bsbs(n, h, 2, true);
    const bsbs2 = () => Unfolding.bsbs(n, h, 3, true);
    const sbsbs1 = () => Unfolding.sbsbs(n, h, 1);
    const families = n >= 26 ? [h < 1.15 ? bsbs2 : sbsbs1] : [n >= 4 && bsbs1, n >= 5 && bsbs2, sbsbs1].filter(Boolean);
    for (const build of families) {
      const g = build();
      if (Unfolding.endsOverlap(g)) return g;
    }
    return null;
  }

  // The answer at (n, h): a sentence for a blue point, and an overlapping edge unfolding for a red one.
  // Without an unfolding, a gray frame of the same size stands in, so that the page does not jump.
  function answer(result, n, h) {
    const at = `<p class="result-at"><i>n</i> = ${n}, <i>h</i> = ${fmt(h)}</p>`;
    const ov = overlapping(n, h), g = ov ? witness(n, h) : null;
    const empty = `<div class="sketch result-drawing"><div class="no-image">${Lang.t({ en: "No image", ja: "図なし" })}</div></div>`;
    const exists = Lang.t({ en: "An overlapping edge unfolding exists.", ja: "重なる辺展開図が存在する。" });
    if (!ov) {
      result.innerHTML = at + `<p class="result-verdict no-overlap">${Lang.t({ en: "No edge unfolding overlaps.", ja: "どの辺展開図も重ならない。" })}</p>` + empty;
    } else if (!g) {
      result.innerHTML = at + `<p class="result-verdict overlap">${exists}</p>` + empty;
    } else {
      const label = Lang.t({
        en: `An overlapping edge unfolding of the regular ${n}-gonal prism of height ${fmt(h)}`,
        ja: `高さ ${fmt(h)} の正 ${n} 角柱の重なる辺展開図`,
      });
      result.innerHTML = at +
        `<p class="result-verdict overlap">${Lang.t({ en: "An overlapping edge unfolding exists, for example:", ja: "重なる辺展開図が存在する。例を下に示す。" })}</p>` +
        `<div class="sketch result-drawing"><svg role="img" aria-label="${label}"></svg></div>`;
      Unfolding.render(result.querySelector("svg"), g);
    }
  }

  function setup(plot) {
    draw(plot);
    answer(plot.closest(".classify").querySelector(".classify-result"), selected.n, selected.h);

    // A check box for each branch shows or hides its curve (see .hide-* in style.css).
    const figure = plot.closest(".classify");
    figure.querySelectorAll("input[data-curve]").forEach((box) => {
      const apply = () => figure.classList.toggle(`hide-${box.dataset.curve}`, !box.checked);
      box.addEventListener("change", apply);
      apply();
    });

    // The axis titles and the answer are in the language of the page.
    Lang.onChange(() => {
      draw(plot);
      answer(figure.querySelector(".classify-result"), selected.n, selected.h);
    });

    if (typeof ResizeObserver !== "undefined") {
      let width = plot.clientWidth;
      new ResizeObserver(() => {
        if (plot.clientWidth !== width) { width = plot.clientWidth; draw(plot); }
      }).observe(plot);
    }
  }

  return { h1, h2, overlapping, witness, SW1, SW2, setup };
})();

if (typeof document !== "undefined") {
  Classification.setup(document.querySelector("#classification .classify-plot"));
}
