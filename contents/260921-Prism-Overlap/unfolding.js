// Supplementary material for "Overlap in Edge Unfoldings of Regular Prisms" (WALCOM 2027).
// Edge unfoldings for the drawings of the home page: the three families analyzed exactly in the
// paper (BSBS-1, BSBS-2, SBSBS-1), completed to edge unfoldings by joining the remaining side
// faces to a base, with the test and the drawing of their overlap. Plain JavaScript, no build step.
//
// The coordinates are placed as in the derivations of the repository (docs/proof/):
//   BSBS-1, BSBS-2: BSBS groups 1 and 2 (docs/proof/bsbs/group01.html, group02.html);
//   SBSBS-1: SBSBS group 1 (docs/proof/sbsbs/group01.html), read from its other end.
// The names in the comments (p, q, r, c, v, w, s) are the vertex names used there.
//
// For the pages of the families (family.js), family() lays down the path partial unfolding of any
// family of Appendix C of the paper from its parameters, face by face along the path. For the three
// families above it gives the same faces as bsbs() and sbsbs(), up to a motion of the plane.

const Unfolding = (() => {
  const TAU = 2 * Math.PI;
  const EPS = 1e-9;

  // ---------------------------------------------------------------- vectors

  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, s) => [p[0] * s, p[1] * s];
  const cross = (p, q) => p[0] * q[1] - p[1] * q[0];
  const unit = (theta) => [Math.cos(theta), Math.sin(theta)];
  const leftOf = (d) => [-d[1], d[0]];

  // Regular n-gon with unit edges, walked from `start`. The first edge has the angle theta0,
  // and the direction turns by `turn` at every vertex (-α: clockwise, +α: counterclockwise).
  // v[k] is the k-th vertex and d[k] the direction of the edge from v[k] to v[k + 1].
  function polygon(start, theta0, turn, n) {
    const v = [start], d = [];
    for (let k = 0; k < n; k++) {
      d.push(unit(theta0 + k * turn));
      if (k < n - 1) v.push(add(v[k], d[k]));
    }
    return { v, d };
  }

  // A band of `len` side faces standing on the segment from `a` in the direction d,
  // raised by h in the direction m (both unit vectors).
  function band(a, d, len, m, h) {
    const b = add(a, mul(d, len));
    return [a, b, add(b, mul(m, h)), add(a, mul(m, h))];
  }

  // The same band, face by face.
  const faces = (a, d, len, m, h) => Array.from({ length: len }, (_, k) => band(add(a, mul(d, k)), d, 1, m, h));

  // Side faces joined to the edges k0, ..., n - 1 of a clockwise base, one face each.
  function fringe(base, k0, n, h) {
    const out = [];
    for (let k = k0; k < n; k++) out.push(band(base.v[k], base.d[k], 1, leftOf(base.d[k]), h));
    return out;
  }

  // ---------------------------------------------------------------- the families

  // BSBS-1 (p = 2) and BSBS-2 (p = 3): the base B1, the side face joining it to B2, and the band
  // of p faces joined to B2 along its edge p and running back toward that face (s0 s3 s2 s1).
  // The other side faces are joined to B2. With `nearSide`, the face of the band joined to B2 is
  // left unshaded, as in Fig. 2 of the paper.
  function bsbs(n, h, p, nearSide = false) {
    const a = TAU / n;
    const b1 = polygon([0, -1], Math.PI / 2, a, n);                         // v0 v1 v2 ..., counterclockwise
    const s1 = [[0, -1], [0, 0], [h, 0], [h, -1]];                          // v0 v1 w0 and the corner below w0
    const b2 = polygon([h, -1], Math.PI / 2, -a, n);                        // then w0 w1 w2 ..., clockwise
    const d = mul(b2.d[p], -1), m = leftOf(b2.d[p]);
    return {
      name: `BSBS-${p - 1}`,
      faces: [
        { pts: b1.v, kind: "base" },
        { pts: b2.v, kind: "base" },
        { pts: s1, kind: "path" },
        ...faces(b2.v[p + 1], d, p, m, h).map((pts, k) => ({ pts, kind: nearSide && k === 0 ? "side" : "path" })),
        ...fringe(b2, p + 1, n, h).map((pts) => ({ pts, kind: "side" })),
      ],
      ends: [b1.v, band(b2.v[p + 1], d, p, m, h)],
      rotate: 0,
      mirror: true,                          // B2 on the left, as in Fig. 2 of the paper
    };
  }

  // SBSBS-1: the face s1 on B1, the face joining B1 to B2, and the band of `len` faces joined to
  // B2 along its second edge (n - 2 faces in the family; Schlickenrieder's sketch has one).
  // Any side faces left are joined to B2.
  function sbsbs(n, h, len) {
    const a = TAU / n;
    const s1 = [[0, 0], [1, 0], [1, h], [0, h]];                            // p0 p1 p2 p3
    const b1 = polygon([0, 0], 0, -a, n);                                   // below p0 p1, clockwise
    const s2 = band([1, 0], unit(-a), 1, [Math.sin(a), Math.cos(a)], h);    // q0 q1 q2 q3
    const b2 = polygon(s2[2], Math.PI - a, -a, n);                          // q2 q3 r1 ..., clockwise
    const d = b2.d[2], m = leftOf(d);                                       // from c3 = r1
    return {
      name: "SBSBS-1",
      faces: [
        { pts: b1.v, kind: "base" },
        { pts: b2.v, kind: "base" },
        { pts: s1, kind: "path" },
        { pts: s2, kind: "path" },
        ...faces(b2.v[2], d, len, m, h).map((pts) => ({ pts, kind: "path" })),
        ...fringe(b2, 2 + len, n, h).map((pts) => ({ pts, kind: "side" })),
      ],
      ends: [s1, band(b2.v[2], d, len, m, h)],
      rotate: Math.PI / 2 + a,              // turn so that s2 runs east, as in Fig. 2 of the paper
      mirror: false,
    };
  }

  // ---------------------------------------------------------------- any family

  // A parameter of a family: a number, or "n-c" for n minus the constant c (Appendix C of the paper).
  const value = (n, x) => (typeof x === "string" ? n - Number(x.slice(2)) : x);
  const mod = (n, x) => ((x % n) + n) % n;

  // The side faces of the three bands (Algorithm 1 of the paper). For pattern BSBS, S1 is empty.
  function bands(n, P) {
    const run = (p, d, len) => Array.from({ length: len }, (_, k) => mod(n, p + k * d));
    const l1 = P.l1 == null ? 0 : value(n, P.l1);
    return {
      s0: run(0, 1, value(n, P.l0)),
      s1: l1 ? run(value(n, P.p1), P.d1, l1) : [],
      s2: run(value(n, P.p2), P.d2, value(n, P.l2)),
    };
  }

  // Whether the parameters give a path partial unfolding for this n: every band has at least one
  // side face and no side face is used twice (Algorithm 1 returns Invalid otherwise).
  function valid(n, P) {
    const b = bands(n, P);
    const all = [...b.s0, ...b.s1, ...b.s2];
    return b.s0.length > 0 && b.s2.length > 0 && (P.l1 == null || b.s1.length > 0) && new Set(all).size === all.length;
  }

  // A face of the prism in its own coordinates, its vertices listed counterclockwise as seen from
  // outside. The vertices are numbered: b_j = j on the base B1 and t_j = n + j on the base B2, and the
  // side face s_j has the vertices b_j, b_{j+1}, t_{j+1}, t_j.
  function prismFace(n, h, face) {
    if (face === "B1") return { ids: Array.from({ length: n }, (_, k) => mod(n, -k)), pts: polygon([0, 0], 0, TAU / n, n).v };
    if (face === "B2") return { ids: Array.from({ length: n }, (_, k) => n + k), pts: polygon([0, 0], 0, TAU / n, n).v };
    const k = mod(n, face + 1);
    return { ids: [face, k, n + k, n + face], pts: [[0, 0], [1, 0], [1, h], [0, h]] };
  }

  // Lays the face `next` down along the edge it shares with the face `prev`, already laid down.
  // Both are counterclockwise as seen from outside, so a rotation takes `next` to the far side of that edge.
  function lay(prev, next) {
    const [u, v] = next.ids.filter((id) => prev.ids.includes(id));
    const P = (id) => prev.pts[prev.ids.indexOf(id)];
    const L = (id) => next.pts[next.ids.indexOf(id)];
    const e = sub(P(v), P(u)), g = sub(L(v), L(u));
    const t = Math.atan2(e[1], e[0]) - Math.atan2(g[1], g[0]);
    const c = Math.cos(t), s = Math.sin(t);
    return { ids: next.ids, pts: next.pts.map((q) => { const [x, y] = sub(q, L(u)); return add(P(u), [c * x - s * y, s * x + c * y]); }) };
  }

  // The convex hull of a set of points, counterclockwise (a band is the hull of its side faces).
  function hull(points) {
    const p = [...points].sort((a, b) => (Math.abs(a[0] - b[0]) > EPS ? a[0] - b[0] : a[1] - b[1]));    // x equal up to rounding: by y
    const half = (list) => {
      const out = [];
      for (const q of list) {
        while (out.length >= 2 && cross(sub(out[out.length - 1], out[out.length - 2]), sub(q, out[out.length - 2])) <= EPS) out.pop();
        out.push(q);
      }
      return out.slice(0, -1);
    };
    return [...half(p), ...half(p.reverse())];
  }

  const centroid = (p) => mul(p.reduce(add, [0, 0]), 1 / p.length);

  // The path partial unfolding of the family with the parameters P = { l0, p1, d1, l1, p2, d2, l2 }
  // (Table 1 of the paper; l1 = null for pattern BSBS), laid down from B1: the band S1 on one side,
  // and S0, B2, S2 on the other. It is turned as in Appendix C of the paper: the edge of B1 joined to
  // S0 upright with B1 on its left, so that S0 runs upward and B2 lies to the right.
  function family(n, h, P) {
    const b = bands(n, P);
    const b1 = prismFace(n, h, "B1");
    const chain = (start, labels) => {
      const out = [];
      let prev = start;
      for (const j of labels) { prev = lay(prev, prismFace(n, h, j)); out.push(prev); }
      return out;
    };
    const s1 = chain(b1, b.s1);
    const s0 = chain(b1, b.s0);
    const b2 = lay(s0[s0.length - 1], prismFace(n, h, "B2"));
    const s2 = chain(b2, b.s2);

    const strip = (list) => hull(list.flatMap((face) => face.pts));
    const [c1, c2] = [centroid(b1.pts), centroid(s0[0].pts)];     // B1 and the face of S0 joined to it
    return {
      faces: [
        { pts: b1.pts, kind: "base" },
        { pts: b2.pts, kind: "base" },
        ...[...s1, ...s0, ...s2].map((face) => ({ pts: face.pts, kind: "path" })),
      ],
      ends: [s1.length ? strip(s1) : b1.pts, strip(s2)],
      endFaces: [s1.length ? s1 : [b1], s2],   // the faces of the two end faces, with the numbers of their vertices
      sets: { B1: [b1], B2: [b2], S0: s0, S1: s1, S2: s2 },    // the faces of each base and band, likewise
      endsOnly: true,                        // the red part is where the two end faces overlap
      rotate: Math.PI - Math.atan2(c2[1] - c1[1], c2[0] - c1[0]),
      mirror: true,                          // the faces are laid down as seen from outside; Appendix C shows the mirror image
    };
  }

  // The end points of an edge of the end face `end` (0 or 1) of family(), given by the numbers of the
  // two vertices of the prism at its ends (separations.js).
  function edge(g, end, ids) {
    const at = (id) => {
      for (const face of g.endFaces[end]) {
        const k = face.ids.indexOf(id);
        if (k >= 0) return face.pts[k];
      }
      throw new Error(`no vertex ${id}`);
    };
    return ids.map(at);
  }

  // The vertex of the base or band `on` ("B1", "B2", "S0", "S1" or "S2") of family() that is the vertex
  // b_j (kind "b") or t_j (kind "t") of the prism.
  function vertex(g, n, on, kind, j) {
    const id = (kind === "t" ? n : 0) + mod(n, j);
    for (const face of g.sets[on]) {
      const k = face.ids.indexOf(id);
      if (k >= 0) return face.pts[k];
    }
    throw new Error(`no vertex ${kind}_${j} on ${on}`);
  }

  // ---------------------------------------------------------------- overlap

  const area = (p) => p.reduce((s, q, i) => s + cross(q, p[(i + 1) % p.length]), 0) / 2;

  // The part of the convex polygon `subject` inside the convex polygon `clipper`
  // (Sutherland-Hodgman), for either orientation of `clipper`.
  function clip(subject, clipper) {
    const sign = Math.sign(area(clipper));
    let out = subject;
    for (let i = 0; i < clipper.length && out.length; i++) {
      const a = clipper[i], e = sub(clipper[(i + 1) % clipper.length], a);
      const side = (p) => sign * cross(e, sub(p, a));
      const input = out;
      out = [];
      input.forEach((p, j) => {
        const q = input[(j + 1) % input.length], sp = side(p), sq = side(q);
        if (sp >= 0) out.push(p);
        if ((sp >= 0) !== (sq >= 0)) out.push(add(p, mul(sub(q, p), sp / (sp - sq))));
      });
    }
    return out;
  }

  const overlapArea = (p, q) => {
    const part = clip(p, q);
    return part.length >= 3 ? Math.abs(area(part)) : 0;
  };

  // Whether the two end faces of the path overlap; faces that only touch give no area.
  const endsOverlap = (g) => overlapArea(g.ends[0], g.ends[1]) > EPS;

  // The parts where two faces overlap.
  function overlaps(list) {
    const parts = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const part = clip(list[i].pts, list[j].pts);
        if (part.length >= 3 && Math.abs(area(part)) > EPS) parts.push(part);
      }
    }
    return parts;
  }

  // ---------------------------------------------------------------- drawing

  const ASPECT = 4 / 3;
  const f = (x) => x.toFixed(4);
  const points = (p) => p.map((q) => `${f(q[0])},${f(q[1])}`).join(" ");

  // Draws the unfolding into `svg`, fitted to a 4:3 frame (or, with g.fit, to a frame of its own
  // proportions), and returns whether it overlaps.
  function render(svg, g) {
    const c = Math.cos(g.rotate), s = Math.sin(g.rotate);
    const T = ([x, y]) => {
      const X = c * x - s * y, Y = s * x + c * y;
      return [g.mirror ? -X : X, -Y];                   // SVG has y pointing down
    };
    const drawn = g.faces.map((face) => ({ kind: face.kind, pts: face.pts.map(T) }));
    const parts = overlaps(g.endsOnly ? g.ends.map((pts) => ({ pts })) : g.faces).map((p) => p.map(T));

    const all = drawn.flatMap((face) => face.pts);
    const x0 = Math.min(...all.map((p) => p[0])), x1 = Math.max(...all.map((p) => p[0]));
    const y0 = Math.min(...all.map((p) => p[1])), y1 = Math.max(...all.map((p) => p[1]));
    const pad = (g.labels ? 0.1 : 0.04) * Math.max(x1 - x0, y1 - y0);     // room for the labels
    let w = x1 - x0 + 2 * pad, hh = y1 - y0 + 2 * pad, vx = x0 - pad, vy = y0 - pad;
    if (!g.fit) {                                          // g.fit: keep the proportions of the drawing
      if (w / hh > ASPECT) { vy -= (w / ASPECT - hh) / 2; hh = w / ASPECT; }
      else { vx -= (hh * ASPECT - w) / 2; w = hh * ASPECT; }
    }

    // g.lines: edges [p, q] whose lines are drawn across the frame, dashed, with the edge itself solid.
    const line = ([p, q], cls) => `<line class="${cls}" x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}"/>`;
    const across = ([p, q]) => {
      const d = sub(q, p), k = (w + hh) / Math.hypot(d[0], d[1]);
      return [add(p, mul(d, -k)), add(q, mul(d, k))];
    };
    const lines = (g.lines || []).map((e) => e.map(T));

    // g.axes: [origin, a point on the positive x-axis], drawn across the frame with their names; the
    // y-axis is the x-axis turned by 90 degrees counterclockwise on the screen.
    // the size of the labels: g.labelPx pixels on the screen, or a fraction of the width of the frame
    const px = svg.getBoundingClientRect().width;
    const fs = g.labelPx && px ? (g.labelPx * w) / px : 0.024 * w;
    let axes = "";
    const taken = [];                                    // boxes [cx, cy, width, height] of the names drawn so far
    if (g.axes) {
      const O = T(g.axes[0]), X = sub(T(g.axes[1]), O);
      const ex = mul(X, 1 / Math.hypot(X[0], X[1])), ey = [ex[1], -ex[0]];
      const reach = (d) => Math.min(...[0, 1].map((i) => (d[i] > 1e-9 ? ([vx, vy][i] + [w, hh][i] - O[i]) / d[i]
        : d[i] < -1e-9 ? ([vx, vy][i] - O[i]) / d[i] : Infinity)));
      const name = (d, text) => {
        const [x, y] = add(O, mul(d, reach(d) - 1.2 * fs));
        taken.push([x, y, 0.8 * fs, 1.2 * fs]);
        return `<text class="label axis-name" x="${f(x)}" y="${f(y)}" font-size="${f(fs)}">${text}</text>`;
      };
      axes = [ex, ey].map((d) => line(across([O, add(O, d)]), "axis-line")).join("") + name(ex, "x") + name(ey, "y");
    }

    // g.labels: [{ text: "q_1 = t_5", at, dir }], each named near the point `at`, preferably in the
    // direction `dir` (both in the coordinates of the unfolding), with a dot at `at`; "x_y" is written
    // with y as a subscript. The place of each label is chosen among 16 directions and 3 distances: it
    // must not overlap the names placed before it or cover another dot, and its own dot must be the
    // nearest one. The labels with the most dots near them are placed first.
    const shift = 0.3 * fs;
    const words = (text) => text.split(" = ").map((part) => part.split("_"));
    const size = (text) => {                             // the width and height of a label, roughly
      const parts = words(text);
      const lows = parts.reduce((w, [, low]) => w + (low ? 0.5 + 0.35 * (low.length - 1) : 0), 0);    // subscripts, as n−3
      return [fs * (0.7 * parts.length + lows + 1.1 * (parts.length - 1) + 0.2), 1.7 * fs];
    };
    const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
    const covers = (c, wh, q) => Math.abs(c[0] - q[0]) < wh[0] / 2 && Math.abs(c[1] - q[1]) < wh[1] / 2;
    const meets = (c, wh, [x, y, bw, bh]) => Math.abs(c[0] - x) < (wh[0] + bw) / 2 && Math.abs(c[1] - y) < (wh[1] + bh) / 2;
    const placed = (g.labels || []).map(({ text, at, dir }) => {
      const p = T(at), d = sub(T(add(at, dir)), p);
      return { text, p, prefer: Math.atan2(d[1], d[0]), wh: size(text) };
    });
    const dots = placed.map(({ p }) => p);
    const crowd = (it) => dots.filter((q) => dist(q, it.p) < 4 * fs).length;
    // the best place for the label `it` among `count` directions and the distances `gaps` (in fs), where
    // the boxes `boxes` are taken
    const search = (it, gaps, count, boxes) => {
      let best = null;
      gaps.forEach((gap, ring) => {
        for (let k = 0; k < count; k++) {
          const turn = (k % 2 ? 1 : -1) * Math.ceil(k / 2);                 // 0, +1, -1, +2, ... steps
          const u = [Math.cos(it.prefer + (turn * 2 * Math.PI) / count), Math.sin(it.prefer + (turn * 2 * Math.PI) / count)];
          const reach = Math.abs(u[0]) * it.wh[0] / 2 + Math.abs(u[1]) * it.wh[1] / 2;
          const c = add(it.p, mul(u, gap * fs + reach));
          let cost = 3 * ring + (6.4 / count) * Math.abs(turn);
          if (boxes.some((b) => meets(c, it.wh, b))) cost += 100;
          for (const q of dots) {
            if (q === it.p) continue;
            if (covers(c, [it.wh[0] + 0.4 * fs, it.wh[1] + 0.4 * fs], q)) cost += 60;
            if (dist(c, q) < dist(c, it.p) + 0.3 * fs) cost += 40;
          }
          if (!best || cost < best.cost) best = { c, cost, ring };
        }
      });
      return best;
    };
    for (const it of [...placed].sort((A, B) => crowd(B) - crowd(A))) {
      Object.assign(it, search(it, [0.35, 0.9, 1.6], 16, taken), { box: taken.length });
      taken.push([...it.c, ...it.wh]);
    }
    // A label that could not be placed so is placed again, now with all the other labels in place, among
    // 32 directions and more distances (in a crowded drawing, where edges are about as long as a label).
    for (const it of placed) {
      if (it.cost < 40) continue;
      const again = search(it, [0.35, 0.6, 0.9, 1.25, 1.6, 2, 2.5, 3], 32, taken.filter((_, i) => i !== it.box));
      if (again.cost < it.cost) {
        Object.assign(it, again);
        taken[it.box] = [...it.c, ...it.wh];
      }
    }
    const label = ({ text, p, c, ring }) => {
      let body = "", down = false;
      words(text).forEach(([base, low], i) => {
        if (i) { body += `<tspan${down ? ` dy="${f(-shift)}"` : ""}> = </tspan>`; down = false; }
        body += `<tspan>${base}</tspan>`;
        if (low) { body += `<tspan class="low" dy="${f(shift)}" font-size="${f(0.7 * fs)}">${low}</tspan>`; down = true; }
      });
      const lead = ring > 0 ? line([p, add(c, mul(sub(p, c), (0.7 * fs) / dist(c, p)))], "label-lead") : "";
      return `<circle class="label-dot" cx="${f(p[0])}" cy="${f(p[1])}" r="${f(0.13 * fs)}"/>` + lead +
        `<text class="label" x="${f(c[0])}" y="${f(c[1])}" font-size="${f(fs)}">${body}</text>`;
    };

    svg.setAttribute("viewBox", `${f(vx)} ${f(vy)} ${f(w)} ${f(hh)}`);
    svg.innerHTML =
      axes +
      drawn.map((face) => `<polygon class="${face.kind}" points="${points(face.pts)}"/>`).join("") +
      parts.map((p) => `<polygon class="overlap" points="${points(p)}"/>`).join("") +
      drawn.map((face) => `<polygon class="edge edge-${face.kind}" points="${points(face.pts)}"/>`).join("") +
      lines.map((e) => line(across(e), "separator") + line(e, "separator-edge")).join("") +
      placed.map(label).join("");
    return parts.length > 0;
  }

  return { polygon, band, bsbs, sbsbs, family, edge, vertex, valid, hull, clip, area, overlaps, endsOverlap, render };
})();
