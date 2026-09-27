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
values, and a difference is positive if its interval lies above 0 and
negative if it lies below 0. A difference whose interval contains 0 is
decided exactly. With z = exp(i pi / (2n)), every vertex, as a point of the
complex plane, is a polynomial in z with integer coefficients at h = 1 and at
h = 2, and so the difference, in any of the n coordinate systems, is the real
or the imaginary part of such a polynomial w. It is 0 if and only if
w + conj(w) (or w - conj(w)), again a polynomial in z since conj(z) = z^-1,
is divisible by the cyclotomic polynomial Phi_4n, the minimal polynomial of
z; if it is not 0, its sign is found by computing it in intervals with more
and more digits. A coordinate system is first tried in floating point, and
only if this does not rule it out (with a margin of MARGIN) is it tried in
intervals.

The output is the column "step 3" of Table 3 of the supplementary site,
followed by the number of differences, for both patterns, that were decided
exactly, and the number of those that were not 0.

Usage:
    python3 reduction_aabb.py           # n = 3, ..., 25
    python3 reduction_aabb.py 3 12      # n = 3, ..., 12

mpmath is needed (pip install -r requirements.txt), and
reduction_congruence.py must be in the same folder.
"""

import cmath
import math
import sys
from collections import Counter
from functools import lru_cache

from mpmath import iv

from reduction_congruence import (classes, end_faces, outline, prism_face,
                                  survivors_bsbs, survivors_sbsbs)

iv.dps = 50                     # the precision of the intervals, in digits
MARGIN = 1e-6                   # floating-point values below -MARGIN are < 0
tests = Counter()               # the differences decided exactly, and those
                                # of them that are not 0


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


def sign(x, *which):
    """+1 or -1 if the interval x lies above or below 0. If x contains 0, the
    sign is decided exactly: x is the difference exact_difference(*which)."""
    if x.a > 0:
        return 1
    if x.b < 0:
        return -1
    return exact_sign(*exact_difference(*which))


def above(e, f, where, one):
    """Whether every value in e is larger than every value in f for every
    h > 0; each value is (a, b), for a + b h, with intervals. The values are
    those of the vertices of the end face `one` (e) and of the other end face
    (f), as in exact_difference."""
    for i, (a, b) in enumerate(e):
        for j, (c, d) in enumerate(f):
            sa = sign(a - c, where, one, i, j, 0)
            sb = sign(b - d, where, one, i, j, 1)
            if sa < 0 or sb < 0 or (sa == 0 and sb == 0):
                return False
    return True


# ------------------------------------------------------- exact values

def division(p, q):
    """The quotient and the remainder of the polynomial p divided by the monic
    polynomial q; a polynomial is the list of its coefficients, from the
    constant term."""
    p, m = list(p), len(q) - 1
    quotient = [0] * max(len(p) - m, 0)
    for top in reversed(range(len(quotient))):
        t = quotient[top] = p[top + m]
        for i, x in enumerate(q):
            p[top + i] -= t * x
    return quotient, p[:m]


@lru_cache(maxsize=None)
def cyclotomic(m):
    """The m-th cyclotomic polynomial: z^m - 1 divided by the d-th cyclotomic
    polynomials for the divisors d < m of m."""
    p = [-1] + [0] * (m - 1) + [1]
    for d in range(1, m):
        if m % d == 0:
            p, rest = division(p, cyclotomic(d))
            assert not any(rest)
    return tuple(p)


class Exact:
    """The complex number c_0 + c_1 z + ... + c_{N-1} z^(N-1), z = exp(2 pi i
    / N), given exactly by its integer coefficients c. Here N = 4n, so that
    z^2 turns by pi / n, z^4 = exp(2 pi i / n) and z^n = i."""

    def __init__(self, c):
        self.c = tuple(c)

    def __add__(self, other):
        return Exact(x + y for x, y in zip(self.c, other.c))

    def __sub__(self, other):
        return Exact(x - y for x, y in zip(self.c, other.c))

    def __rmul__(self, k):
        """k times this number, for an integer k."""
        return Exact(k * x for x in self.c)

    def turn(self, m):
        """This number times z^m."""
        N = len(self.c)
        return Exact(self.c[(j - m) % N] for j in range(N))

    def conj(self):
        """The complex conjugate: z^j becomes z^-j."""
        N = len(self.c)
        return Exact(self.c[-j % N] for j in range(N))

    def is_zero(self):
        """Whether this number is 0, that is, whether the polynomial is
        divisible by the N-th cyclotomic polynomial, the minimal polynomial
        of z."""
        return not any(division(self.c, cyclotomic(len(self.c)))[1])

    def value(self):
        """This number in floating point."""
        N = len(self.c)
        return sum(x * cmath.exp(2j * math.pi * j / N)
                   for j, x in enumerate(self.c) if x)

    def part(self, axis):
        """The real part (axis 0) or the imaginary part (axis 1), as an
        interval."""
        N, f = len(self.c), (iv.cos, iv.sin)[axis]
        return sum((x * f(2 * j * iv.pi / N)
                    for j, x in enumerate(self.c) if x), iv.mpf(0))


def power(n, m):
    """z^m, for z = exp(i pi / (2n))."""
    c = [0] * (4 * n)
    c[m % (4 * n)] = 1
    return Exact(c)


def exact_face(n, h, face):
    """prism_face of reduction_congruence.py, exactly, for an integer h; each
    vertex is a point of the complex plane."""
    ids, _ = prism_face(n, h, face)
    zero = 0 * power(n, 0)
    if face in ("B1", "B2"):
        pts, p = [], zero
        for k in range(n):
            pts.append(p)
            p = p + power(n, 4 * k)             # exp(2 pi i k / n)
        return ids, pts
    one, up = power(n, 0), h * power(n, n)      # 1 and i h
    return ids, [zero, one, one + up, up]


def exact_lay(n, prev, nxt):
    """lay of reduction_congruence.py, exactly. The face is turned by k pi / n;
    k is read off in floating point, and the edge that the face shares with
    `prev` is checked to fall exactly on its place."""
    ids, pts = prev
    nids, npts = nxt
    u, v = [i for i in nids if i in ids]
    P = {i: q for i, q in zip(ids, pts)}
    L = {i: q for i, q in zip(nids, npts)}
    t = cmath.phase((P[v] - P[u]).value() / (L[v] - L[u]).value())
    k = round(t / (math.pi / n))
    assert (P[v] - P[u] - (L[v] - L[u]).turn(2 * k)).is_zero()
    return nids, [P[u] + (q - L[u]).turn(2 * k) for q in npts]


def exact_chain(n, h, start, labels):
    """chain of reduction_congruence.py, exactly."""
    out, prev = [], start
    for j in labels:
        prev = exact_lay(n, prev, exact_face(n, h, j))
        out.append(prev)
    return out


@lru_cache(maxsize=None)
def exact_base2(n, h, l0):
    """B2, joined to the far end of S0 = 0, ..., l0 - 1, exactly."""
    b1 = exact_face(n, h, "B1")
    s0 = exact_chain(n, h, b1, range(l0))
    return exact_lay(n, s0[-1], exact_face(n, h, "B2"))


def exact_end_faces(n, h, l0, s1, s2):
    """end_faces of reduction_congruence.py, exactly."""
    b1 = exact_face(n, h, "B1")
    first = b1[1] if s1 is None else outline(exact_chain(n, h, b1, s1))
    last = outline(exact_chain(n, h, exact_base2(n, h, l0), s2))
    return [first, last]


@lru_cache(maxsize=1)
def exact_coefficients(n, l0, s1, s2):
    """The vertices of the two end faces, each as (A, B), the vertex being at
    A + B h as a point of the complex plane, exactly."""
    one = exact_end_faces(n, 1, l0, s1, s2)
    two = exact_end_faces(n, 2, l0, s1, s2)
    return [[(2 * p - q, q - p) for p, q in zip(f, g)]
            for f, g in zip(one, two)]


def exact_difference(where, one, i, j, m):
    """The difference of a (m = 0) or b (m = 1) between the vertex i of the
    end face `one` and the vertex j of the other end face, exactly. `where` is
    (n, l0, s1, s2, k, axis): the candidate, and the coordinate `axis` of the
    coordinate system turned by k pi / n in which the difference is taken. It
    is given as (w, axis), being the real part (axis 0) or the imaginary part
    (axis 1) of w."""
    n, l0, s1, s2, k, axis = where
    coef = exact_coefficients(n, l0, s1, s2)
    w = coef[one][i][m] - coef[1 - one][j][m]
    return w.turn(-2 * k), axis


def exact_sign(w, axis):
    """The sign of the real part (axis 0) or the imaginary part (axis 1) of w.
    The part is 0 if and only if w + conj(w) (or w - conj(w)) is 0; if it is
    not 0, it is computed in intervals with more and more digits until its
    interval lies on one side of 0."""
    tests["exact"] += 1
    if (w + w.conj() if axis == 0 else w - w.conj()).is_zero():
        return 0
    tests["nonzero"] += 1
    dps = iv.dps
    try:
        while True:
            iv.dps *= 2
            x = w.part(axis)
            if x.a > 0 or x.b < 0:
                return 1 if x.a > 0 else -1
    finally:
        iv.dps = dps


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
            where = (n, l0, s1, s2, k, axis)
            if above(ea, fa, where, 0) or above(fa, ea, where, 1):
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
    print(f"{'n':>3}  {'BSBS':>5}  {'SBSBS':>7}  {'exact':>6}  {'nonzero':>7}")
    for n in range(lo, hi + 1):
        tests.clear()
        bsbs = remaining(n, survivors_bsbs(n), swap=False)
        sbsbs = remaining(n, survivors_sbsbs(n), swap=True)
        print(f"{n:>3}  {bsbs:>5,}  {sbsbs:>7,}  {tests['exact']:>6,}  "
              f"{tests['nonzero']:>7,}", flush=True)


if __name__ == "__main__":
    main()
