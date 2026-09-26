#!/usr/bin/env python3
"""The third step of the reduction: the candidates whose two end faces are not
shown apart by their axis-aligned bounding boxes (AABBs).

For each n, this program takes the candidates that remain after the second
step, one for each class of congruent end faces (counted as in
reduction_congruence.py, whose functions it uses), and removes those whose
two end faces are shown not to overlap for every h > 0 in the following way.

Every vertex of the path partial unfolding has coordinates of the form a + b h
(Section 5.3 of the supplementary site); a and b are read off the end faces at
h = 1 and h = 2. If every vertex of one end face has a larger x-coordinate
than every vertex of the other for every h > 0, that is, a >= a' and b >= b'
with at least one of the two strict, the x-ranges of their AABBs are disjoint
for every h > 0, and the end faces do not overlap; the same holds for the
y-ranges. This is tried in the n coordinate systems turned by k alpha/2 =
k pi/n for k = 0, ..., n - 1 (turning by pi more only changes the signs of the
coordinates), and a candidate is removed if one of them shows the end faces
apart.

The signs of a - a' and b - b' are decided by interval arithmetic (mpmath, 50
digits): the coordinates are computed as intervals that contain their exact
values, and a difference is positive if its interval lies above 0, negative
if it lies below 0, and taken as 0 if its interval contains 0. A coordinate
system is first tried in floating point, and only if this does not rule it
out (with a margin of MARGIN) is it tried in intervals.

The output is the column "step 3" of Table 3 of the supplementary site.

Usage:
    python3 reduction_aabb.py           # n = 3, ..., 25
    python3 reduction_aabb.py 3 12      # n = 3, ..., 12

mpmath is needed (pip install -r requirements.txt), and
reduction_congruence.py must be in the same folder.
"""

import math
import sys
from functools import lru_cache

from mpmath import iv

from reduction_congruence import (classes, end_faces, outline, prism_face,
                                  survivors_bsbs, survivors_sbsbs)

iv.dps = 50                     # the precision of the intervals, in digits
MARGIN = 1e-6                   # floating-point values below -MARGIN are < 0


# ------------------------------------------------------- floating point

def coefficients(n, l0, s1, s2):
    """The vertices of the two end faces, each as ((a_x, a_y), (b_x, b_y)),
    the vertex being at a + b h, in floating point."""
    one, two = end_faces(n, 1.0, l0, s1, s2), end_faces(n, 2.0, l0, s1, s2)
    return [[((2 * x - u, 2 * y - v), (u - x, v - y))
             for (x, y), (u, v) in zip(f, g)] for f, g in zip(one, two)]


def may_be_above(e, f):
    """Whether floating point leaves it possible that every value in e is
    larger than every value in f for every h > 0; each value is (a, b)."""
    return all(a - c >= -MARGIN and b - d >= -MARGIN
               for a, b in e for c, d in f)


def turned(coef, c, s):
    """The coefficients in the coordinate system turned by the angle whose
    cosine and sine are c and s."""
    return ([((ax * c + ay * s, bx * c + by * s),
              (-ax * s + ay * c, -bx * s + by * c))
             for (ax, ay), (bx, by) in face] for face in coef)


def axes(n, coef):
    """The k for which the coordinate system turned by k pi / n is not ruled
    out in floating point."""
    out = []
    for k in range(n):
        t = k * math.pi / n
        e, f = turned(coef, math.cos(t), math.sin(t))
        for axis in (0, 1):
            ea, fa = [p[axis] for p in e], [p[axis] for p in f]
            if may_be_above(ea, fa) or may_be_above(fa, ea):
                out.append(k)
                break
    return out


# ------------------------------------------------------- intervals

def interval_face(n, h, face):
    """prism_face of reduction_congruence.py, with intervals."""
    ids, pts = prism_face(n, h, face)
    if face in ("B1", "B2"):
        pts, x, y = [], iv.mpf(0), iv.mpf(0)
        for k in range(n):
            pts.append((x, y))
            x += iv.cos(2 * k * iv.pi / n)
            y += iv.sin(2 * k * iv.pi / n)
    else:
        pts = [(iv.mpf(x), iv.mpf(y)) for x, y in pts]
    return ids, pts


def interval_lay(n, prev, nxt):
    """lay of reduction_congruence.py, with intervals. Every face is turned
    by a multiple of pi / n; the multiple is read off in floating point, and
    the turn itself is made in intervals."""
    ids, pts = prev
    nids, npts = nxt
    u, v = [i for i in nids if i in ids]
    P = {i: q for i, q in zip(ids, pts)}
    L = {i: q for i, q in zip(nids, npts)}
    lo = lambda z: float(z.a)
    t = (math.atan2(lo(P[v][1]) - lo(P[u][1]), lo(P[v][0]) - lo(P[u][0]))
         - math.atan2(lo(L[v][1]) - lo(L[u][1]), lo(L[v][0]) - lo(L[u][0])))
    k = round(t / (math.pi / n))
    assert abs(t - k * math.pi / n) < 1e-6
    c, s = iv.cos(k * iv.pi / n), iv.sin(k * iv.pi / n)
    out = []
    for x, y in npts:
        x, y = x - L[u][0], y - L[u][1]
        out.append((P[u][0] + c * x - s * y, P[u][1] + s * x + c * y))
    return nids, out


def interval_chain(n, h, start, labels):
    """chain of reduction_congruence.py, with intervals."""
    out, prev = [], start
    for j in labels:
        prev = interval_lay(n, prev, interval_face(n, h, j))
        out.append(prev)
    return out


@lru_cache(maxsize=None)
def interval_base2(n, h, l0):
    """B2, joined to the far end of S0 = 0, ..., l0 - 1, with intervals."""
    b1 = interval_face(n, h, "B1")
    s0 = interval_chain(n, h, b1, range(l0))
    return interval_lay(n, s0[-1], interval_face(n, h, "B2"))


def interval_end_faces(n, h, l0, s1, s2):
    """end_faces of reduction_congruence.py, with intervals."""
    b1 = interval_face(n, h, "B1")
    first = b1[1] if s1 is None else outline(interval_chain(n, h, b1, s1))
    last = outline(interval_chain(n, h, interval_base2(n, h, l0), s2))
    return [first, last]


def interval_coefficients(n, l0, s1, s2):
    """coefficients, with intervals."""
    one = interval_end_faces(n, 1, l0, s1, s2)
    two = interval_end_faces(n, 2, l0, s1, s2)
    return [[((2 * x - u, 2 * y - v), (u - x, v - y))
             for (x, y), (u, v) in zip(f, g)] for f, g in zip(one, two)]


def sign(x):
    """+1 or -1 if the interval x lies above or below 0, and 0 otherwise."""
    return 1 if x.a > 0 else -1 if x.b < 0 else 0


def above(e, f):
    """Whether every value in e is larger than every value in f for every
    h > 0; each value is (a, b), for a + b h, with intervals."""
    for a, b in e:
        for c, d in f:
            sa, sb = sign(a - c), sign(b - d)
            if sa < 0 or sb < 0 or (sa == 0 and sb == 0):
                return False
    return True


# ------------------------------------------------------- the third step

def apart(n, l0, s1, s2):
    """Whether, in one of the n coordinate systems, the x-ranges or the
    y-ranges of the two end faces are disjoint for every h > 0."""
    ks = axes(n, coefficients(n, l0, s1, s2))
    if not ks:
        return False
    coef = interval_coefficients(n, l0, s1, s2)
    for k in ks:
        e, f = turned(coef, iv.cos(k * iv.pi / n), iv.sin(k * iv.pi / n))
        for axis in (0, 1):
            ea, fa = [p[axis] for p in e], [p[axis] for p in f]
            if above(ea, fa) or above(fa, ea):
                return True
    return False


def remaining(n, candidates, swap):
    """The number of candidates that remain after the third step."""
    return sum(1 for l0, s1, s2 in classes(n, candidates, swap)
               if not apart(n, l0, s1, s2))


def main():
    if len(sys.argv) >= 3:
        lo, hi = int(sys.argv[1]), int(sys.argv[2])
    else:
        lo, hi = 3, 25
    print(f"{'n':>3}  {'BSBS':>5}  {'SBSBS':>7}")
    for n in range(lo, hi + 1):
        bsbs = remaining(n, survivors_bsbs(n), swap=False)
        sbsbs = remaining(n, survivors_sbsbs(n), swap=True)
        print(f"{n:>3}  {bsbs:>5,}  {sbsbs:>7,}", flush=True)


if __name__ == "__main__":
    main()
