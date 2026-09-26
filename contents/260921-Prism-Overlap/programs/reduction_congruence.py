#!/usr/bin/env python3
"""The second step of the reduction: the candidates up to congruence of their
two end faces.

For each n, this program takes the candidates that remain after the first
step (counted as in reduction_inclusion.py) and counts them up to congruence
of the pair of their end faces:

    pattern BSBS    the base B1 and the band S2
    pattern SBSBS   the bands S1 and S2

Two candidates are counted once if, for every h > 0, a motion of the plane
(possibly with a reflection) takes the end faces of one onto those of the
other; for pattern SBSBS it may take S1 onto S2 and S2 onto S1. Whether the
end faces overlap depends only on this pair, so one candidate of each class is
enough. The classes contain the candidates related by the three ways of
Section 5.2 of the supplementary site: exchanging the two bases, reversing the
direction of the labels, and the two tuples of a band of one side face. For
pattern SBSBS and n = 6, 12, 14, 18 and 24, some classes also contain
candidates that are not related in these ways but whose end faces are
nevertheless congruent.

The faces are laid down one by one along the path, each on the far side of
the edge it shares with the face before it. Two pairs of end faces are
compared by the distances between all their vertices, for every way of
matching the vertices. The coordinates of the vertices are of the form a + b h
(Section 5.3), so each squared distance is a polynomial in h of degree at most
2, and it is enough to compare the pairs at three heights.

The output is the column "step 2" of Table 3 of the supplementary site.

Usage:
    python3 reduction_congruence.py           # n = 3, ..., 25
    python3 reduction_congruence.py 3 12      # n = 3, ..., 12

Only the standard library is used.
"""

import bisect
import math
import sys
from functools import lru_cache

HEIGHTS = (0.31, 1.7, 4.3)      # three heights at which the pairs are compared
TOL = 1e-7                      # distances that agree to within this are equal


# ------------------------------------------------------------- the first step

def band(n, p, d, length):
    """The side faces p, p + d, ..., p + (length - 1) d modulo n."""
    return tuple((p + k * d) % n for k in range(length))


def free_bands(n, used, both_sides):
    """The bands (p, d, l) that avoid the side faces in `used`, each with the
    side faces that must be used for it to be maximal (as in
    reduction_inclusion.py)."""
    out = []
    for length in range(1, n):
        for p in range(n):
            for d in (+1, -1):
                faces = band(n, p, d, length)
                if used & set(faces):
                    continue
                if length == 1 and both_sides:
                    need = {(p + 1) % n, (p - 1) % n}
                else:
                    need = {(p + length * d) % n}
                out.append((faces, need))
    return out


def survivors_bsbs(n):
    """The candidates (l0, S2) of pattern BSBS that remain after the first
    step: S2 is maximal in its own direction."""
    for l0 in range(1, n):
        s0 = set(range(l0))
        for faces, need in free_bands(n, s0, both_sides=False):
            if need <= s0 | set(faces):
                yield l0, None, faces


def survivors_sbsbs(n):
    """The candidates (l0, S1, S2) of pattern SBSBS that remain after the
    first step: S1 and S2 are maximal, a band of one side face on both
    sides."""
    for l0 in range(1, n):
        s0 = set(range(l0))
        free = free_bands(n, s0, both_sides=True)
        for f1, need1 in free:
            for f2, need2 in free:
                if set(f1) & set(f2):
                    continue
                used = s0 | set(f1) | set(f2)
                if need1 <= used and need2 <= used:
                    yield l0, f1, f2


# ------------------------------------------------------------- the geometry

def polygon(n):
    """The regular n-gon with unit edges, from the origin, counterclockwise."""
    pts, x, y = [], 0.0, 0.0
    for k in range(n):
        pts.append((x, y))
        x += math.cos(2 * math.pi * k / n)
        y += math.sin(2 * math.pi * k / n)
    return pts


def prism_face(n, h, face):
    """A face of the prism in its own coordinates, with the numbers of its
    vertices: b_j = j on B1, t_j = n + j on B2, and the side face j has the
    vertices b_j, b_{j+1}, t_{j+1}, t_j, counterclockwise from outside."""
    if face == "B1":
        return [(-k) % n for k in range(n)], polygon(n)
    if face == "B2":
        return [n + k for k in range(n)], polygon(n)
    k = (face + 1) % n
    return [face, k, n + k, n + face], [(0, 0), (1, 0), (1, h), (0, h)]


def lay(prev, nxt):
    """Lays the face `nxt` down on the far side of the edge it shares with
    the face `prev`, which is already laid down."""
    ids, pts = prev
    nids, npts = nxt
    u, v = [i for i in nids if i in ids]
    P = {i: q for i, q in zip(ids, pts)}
    L = {i: q for i, q in zip(nids, npts)}
    e = (P[v][0] - P[u][0], P[v][1] - P[u][1])
    g = (L[v][0] - L[u][0], L[v][1] - L[u][1])
    t = math.atan2(e[1], e[0]) - math.atan2(g[1], g[0])
    c, s = math.cos(t), math.sin(t)
    out = []
    for x, y in npts:
        x, y = x - L[u][0], y - L[u][1]
        out.append((P[u][0] + c * x - s * y, P[u][1] + s * x + c * y))
    return nids, out


def chain(n, h, start, labels):
    """The side faces with these labels, laid down one after another from
    the face `start`."""
    out, prev = [], start
    for j in labels:
        prev = lay(prev, prism_face(n, h, j))
        out.append(prev)
    return out


def outline(faces):
    """The four corners of a band, in order around it."""
    if len(faces) == 1:
        return faces[0][1]
    ends = []
    for face, other in ((faces[0], faces[1]), (faces[-1], faces[-2])):
        ids, pts = face
        corner = {i: q for i, q in zip(ids, pts) if i not in other[0]}
        ends.append([corner[i] for i in sorted(corner)])    # b before t
    (b0, t0), (b1, t1) = ends
    return [b0, b1, t1, t0]


@lru_cache(maxsize=None)
def base2(n, h, l0):
    """B2, joined to the far end of S0 = 0, ..., l0 - 1."""
    s0 = chain(n, h, prism_face(n, h, "B1"), range(l0))
    return lay(s0[-1], prism_face(n, h, "B2"))


@lru_cache(maxsize=None)
def end_band(n, h, l0, faces):
    """The outline of S1 (l0 = None, joined to B1) or of S2 (joined to B2)."""
    start = prism_face(n, h, "B1") if l0 is None else base2(n, h, l0)
    return outline(chain(n, h, start, faces))


def end_faces(n, h, l0, s1, s2):
    """The two end faces as lists of vertices in order around them."""
    first = polygon(n) if s1 is None else end_band(n, h, None, s1)
    return [first, end_band(n, h, l0, s2)]


# ------------------------------------------------------------- congruence

def turns(m):
    """The ways of matching the vertices of a polygon of m vertices with
    those of a congruent one, in order around both: rotations and
    reflections."""
    out = []
    for k in range(m):
        out.append([(k + i) % m for i in range(m)])
        out.append([(k - i) % m for i in range(m)])
    return out


def congruent(a, b, swap):
    """Whether the pairs of end faces a and b (each given at every height)
    are congruent for one matching of their vertices at all heights; with
    `swap`, the first end face of a may go to the second of b."""
    for i, j in ([(0, 1), (1, 0)] if swap else [(0, 1)]):
        for pa in turns(len(b[0][i])):
            for pb in turns(len(b[0][j])):
                if all(same(x, [y[i][k] for k in pa] + [y[j][k] for k in pb])
                       for x, y in zip(a, b)):
                    return True
    return False


def same(x, points):
    """Whether the vertices of the pair x and these points have the same
    distances between them, in this order."""
    ps = x[0] + x[1]
    for i in range(len(ps)):
        for j in range(i + 1, len(ps)):
            if abs(math.dist(ps[i], ps[j])
                   - math.dist(points[i], points[j])) > TOL:
                return False
    return True


def classes(n, candidates, swap):
    """One candidate of each class of candidates up to congruence of their end
    faces (with `swap`, the two end faces may be exchanged)."""
    items = []
    for l0, s1, s2 in candidates:
        pair = [end_faces(n, h, l0, s1, s2) for h in HEIGHTS]
        # The sum of the distances at each height: equal for congruent pairs.
        key = tuple(sum(math.dist(p, q)
                        for i, p in enumerate(x[0] + x[1])
                        for q in (x[0] + x[1])[i + 1:]) for x in pair)
        items.append((key, pair, (l0, s1, s2)))
    items.sort(key=lambda item: item[0])
    # One candidate of each class, in the order of the keys; a new candidate
    # is compared only with those whose keys are close to its own.
    firsts, reps = [], []
    for key, pair, candidate in items:
        start = bisect.bisect_left(firsts, key[0] - 1e-6)
        near = [r for k, r, _ in reps[start:]
                if all(abs(u - v) <= 1e-6 for u, v in zip(k, key))]
        if not any(congruent(pair, r, swap) for r in near):
            firsts.append(key[0])
            reps.append((key, pair, candidate))
    return [candidate for _, _, candidate in reps]


def main():
    if len(sys.argv) >= 3:
        lo, hi = int(sys.argv[1]), int(sys.argv[2])
    else:
        lo, hi = 3, 25
    print(f"{'n':>3}  {'BSBS':>5}  {'SBSBS':>7}")
    for n in range(lo, hi + 1):
        bsbs = len(classes(n, survivors_bsbs(n), swap=False))
        sbsbs = len(classes(n, survivors_sbsbs(n), swap=True))
        print(f"{n:>3}  {bsbs:>5,}  {sbsbs:>7,}", flush=True)


if __name__ == "__main__":
    main()
