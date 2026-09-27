#!/usr/bin/env python3
"""BSBS-4: the two end faces do not overlap for h_1(n) <= h <= h_2(n), where 21 <= n <= 25.

The family has l0 = 2, p2 = 4, d2 = -1, l2 = 3 (pattern BSBS, with no band S1). Its two end faces
are B1 and S2, and the line is the one through the end p_2 p_4 of S2, at its last side face s_2. The
vertices of the prism are b_j on B1 and t_j on B2, where the side face s_j has the vertices b_j,
b_{j+1}, t_{j+1}, t_j (the labels are taken modulo n), and alpha = 2 pi / n.

The path partial unfolding is laid down as on the page of the family:
  - B1 has the vertices b_j = sum_{i<j} (cos i alpha, sin i alpha), counterclockwise from
    b_0 = (0, 0) and b_1 = (1, 0);
  - the band S0 = {s_0, ..., s_{l0-1}} lies below the edge b_0 b_1, along the x-axis;
  - B2 is joined below the last side face of S0, as a mirror image of B1;
  - the band S2 lies along the edge t_{p2} t_{p2+1} of B2, outside B2.
The corners of S2 are p_1, on B2 at the side face s_{p2}, p_2, on B2 at the other end, and
p_3 = p_1 + h u and p_4 = p_2 + h u, where u is the unit normal to the edge t_{p2} t_{p2+1} pointing
away from B2.
For each vertex b_j of B1, f_{b_j}(h) = (b_j - p_2) . (-cos 3 alpha, sin 3 alpha) is its signed
distance from the line, positive on the side away from S2. It has the form A + B h, where A and B
depend on alpha only. The program prints A and B for the vertices b_2, b_3, b_4, b_5 of B1, and then
their f(h_1(n)) and f(h_2(n)) for each n; for each n, it also checks that f_{b_j}(h_1(n)) > 0 and
f_{b_j}(h_2(n)) > 0 for every j = 0, ..., n - 1, and that the smallest f_{b_j} is at one of these
vertices (f_{b_j} - f_{b_k} does not depend on h). The signs are decided by interval arithmetic
(mpmath, 50 digits), which gives an interval that contains the exact value; only if the interval
contains 0, the value is tested for 0 exactly (by its minimal polynomial), and, if it is not 0,
computed again with twice as many digits until the interval does not contain 0.

SymPy is needed (pip install sympy; mpmath comes with it). The page of the family shows the formulas
and the tables that this program derives, not the program itself.
"""

import sympy as sp
from mpmath import iv
from sympy.simplify.fu import TR8

iv.dps = 50

a, h = sp.symbols("alpha h", positive=True)
vec = lambda x, y: sp.Matrix([x, y])
cos = lambda k: sp.cos(k * a)
sin = lambda k: sp.sin(k * a)

# The family and the line
L0, P2, D2, L2 = 2, 4, -1, 3
NS = range(21, 26)
SHOWN = [2, 3, 4, 5]            # the vertices b_j of B1 in the tables: b_2, b_3, b_4, b_5


# ------------------------------------------------------------------ the unfolding

def b(j):
    """The vertex b_j of B1."""
    if j >= 0:
        return vec(sum(cos(i) for i in range(j)), sum(sin(i) for i in range(j)))
    return -vec(sum(cos(i) for i in range(j, 0)), sum(sin(i) for i in range(j, 0)))


def turn(v, k):
    """The vector v turned by k alpha."""
    return vec(cos(k) * v[0] - sin(k) * v[1], sin(k) * v[0] + cos(k) * v[1])


def t(j):
    """The vertex t_j of B2. The last side face s_{l0-1} of S0 has its side on B2 from (l0 - 1, -h)
    to (l0, -h); B2 is B1 turned so that its edge b_{l0-1} b_{l0} is horizontal, reflected in the
    x-axis, and moved so that this edge lies on that side."""
    q = turn(b(j) - b(L0 - 1), -(L0 - 1))
    return vec(L0 - 1 + q[0], -h - q[1])


def band(corner, P, D, L, right):
    """The band of the L side faces s_P, s_{P+D}, ... that lies along the edge from corner(P) to
    corner(P + 1) of a base, outside the base: on the right of the edge if right, else on its left.
    Returns its corners [c_1, c_2, c_3, c_4], the unit vector along it from c_1 to c_2, and the unit
    normal to the edge pointing away from the base."""
    edge = corner(P + 1) - corner(P)                        # a unit vector
    out = vec(edge[1], -edge[0]) if right else vec(-edge[1], edge[0])
    start = corner(P) if D == 1 else corner(P + 1)          # c_1, at the side face s_P
    along = D * edge
    return [start, start + L * along, start + h * out, start + L * along + h * out], along, out


p, along2, out2 = band(t, P2, D2, L2, right=False)      # S2; B2 is clockwise


# ------------------------------------------------------------------ the signed distances

normal = along2                          # the unit normal to the end p_2 p_4 of S2 pointing away from S2
f = [sp.expand((b(j) - p[1]).dot(normal)) for j in SHOWN]
A = [sp.expand(TR8(x.coeff(h, 0))) for x in f]      # product-to-sum
B = [sp.expand(TR8(x.coeff(h, 1))) for x in f]


# ------------------------------------------------------------------ the two ends of the interval

def h1(n):
    """h_1(n) (Section 2 of the home page), in alpha."""
    if n <= 12:
        return (sin(3) - sin(2)) / cos(1)
    if n <= 16:
        return (sin(3) - sin(2)) / (cos(1) - cos(3))
    if n <= 19:
        return (cos(4) + 2 - cos(1) - cos(2)) / sin(3)
    return (2 * sin(5) - sin(4) - sin(3) + sin(1)) / (cos(2) - cos(5))


def h2(n):
    """h_2(n) (Section 2 of the home page), in alpha."""
    return cos(1) / (sin(3) - sin(2)) if n == 11 else (cos(1) - cos(3)) / (sin(3) - sin(2))


def at(expr, n):
    """expr at alpha = 2 pi / n, as an interval that contains its exact value. Every number in expr
    becomes an interval: sin, cos, pi and the fractions (written mpf(p)/mpf(q)) are those of iv, and so
    is an integer, which expr may reduce to."""
    names = {"sin": iv.sin, "cos": iv.cos, "pi": iv.pi, "mpf": iv.mpf}
    return iv.mpf(sp.lambdify(a, expr, modules=[names, "mpmath"])(2 * iv.pi / n))


def sign(expr, n):
    """The sign of expr at alpha = 2 pi / n, decided as described at the top."""
    digits = iv.dps
    try:
        while True:
            x = at(expr, n)
            if x.a > 0:
                return 1
            if x.b < 0:
                return -1
            if iv.dps == digits:                        # only once: is the value exactly 0?
                X = sp.Symbol("X")
                if sp.minimal_polynomial(expr.subs(a, 2 * sp.pi / n), X) == X:
                    return 0
            iv.dps *= 2
    finally:
        iv.dps = digits


def values(n):
    """[(h, [f_{b_j}(h) for the vertices b_j in SHOWN])] at h = h_1(n) and h = h_2(n), as intervals."""
    out = []
    for H in (h1(n), h2(n)):
        out.append((at(H, n), [at(A[k] + B[k] * H, n) for k in range(len(SHOWN))]))
    return out


def every_vertex(n):
    """Whether f_{b_j}(h_1(n)) > 0 and f_{b_j}(h_2(n)) > 0 for every vertex b_j of B1, and the
    smallest f_{b_j} is at a vertex in SHOWN: every other f_{b_j} is larger than one of those (the
    difference does not depend on h)."""
    shown = [j % n for j in SHOWN]
    fb = [sp.expand((b(j) - p[1]).dot(normal)) for j in range(n)]
    outside = all(sign(x.subs(h, H), n) == 1 for H in (h1(n), h2(n)) for x in fb)
    nearest = all(any(sign(fb[j] - fb[k], n) == 1 for k in shown) for j in range(n) if j not in shown)
    return outside and nearest


def main():
    names = [f"b_{j}" if j >= 0 else f"b_{{n{j}}}" for j in SHOWN]
    print(f"f_b(h) = A + B h for the vertices {', '.join(names)} of B1:")
    for name, x, y in zip(names, A, B):
        print(f"  {name}:  A = {x}")
        print(f"  {' ' * len(name)}   B = {y}")
    positive = True
    for side, name in enumerate(("h_1(n)", "h_2(n)")):
        print(f"\nAt h = {name}:")
        print("   n         h" + "".join(f"{'f(' + x + ')':>12}" for x in names))
        for n in NS:
            H, fs = values(n)[side]
            end = (h1, h2)[side](n)
            positive &= all(sign(A[k] + B[k] * end, n) == 1 for k in range(len(SHOWN)))
            print(f"  {n:2d}  {float(H.mid):8.6f}" + "".join(f"{float(x.mid):12.6f}" for x in fs))
    every = all(every_vertex(n) for n in NS)
    print("\nFor every n: f_{b_j}(h_1(n)) > 0 and f_{b_j}(h_2(n)) > 0 for j = 0, ..., n - 1, and the "
          "smallest f_{b_j} is in the tables." if every else "\nSome vertex of B1 is not shown to be so.")
    print("\nEvery value is positive." if positive and every else "\nSome value is not shown to be positive.")


if __name__ == "__main__":
    main()
