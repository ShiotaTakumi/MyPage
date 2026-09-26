#!/usr/bin/env python3
"""SBSBS-20: the two end faces do not overlap for h_1(n) <= h <= h_2(n), where 21 <= n <= 25.

The family has l0 = 1, p1 = 2, d1 = 1, l1 = 2, p2 = 4, d2 = 1, l2 = n - 4 (pattern SBSBS). Its two
end faces are the bands S1 and S2, and the line is the one through the side p_3 p_4 of S1, opposite
B1. The vertices of the prism are b_j on B1 and t_j on B2, where the side face s_j has the vertices
b_j, b_{j+1}, t_{j+1}, t_j (the labels are taken modulo n), and alpha = 2 pi / n.

The path partial unfolding is laid down as on the page of the family:
  - B1 has the vertices b_j = sum_{i<j} (cos i alpha, sin i alpha), counterclockwise from
    b_0 = (0, 0) and b_1 = (1, 0);
  - the band S1 lies along the edge b_{p1} b_{p1+1} of B1, outside B1;
  - the band S0 = {s_0, ..., s_{l0-1}} lies below the edge b_0 b_1, along the x-axis;
  - B2 is joined below the last side face of S0, as a mirror image of B1;
  - the band S2 lies along the edge t_{p2} t_{p2+1} of B2, outside B2.
A band has the corners c_1, on its base at the side face s_{p_i}, c_2, on its base at the other end,
and c_3 = c_1 + h u and c_4 = c_2 + h u, where u is the unit normal to the edge of the base pointing
away from the base. The corners of S1 are p_1, ..., p_4 and those of S2 are q_1, ..., q_4.
For each corner q of S2, f_q(h) = (q - p_3) . (sin 2 alpha, -cos 2 alpha) is its signed distance
from the line, positive on the side away from S1. It has the form A + B h, where B depends on alpha
only, and A on alpha and on n, through the length n - 4 of S2; the program prints A and B, and then
f_q(h_1(n)) and f_q(h_2(n)) for each n. Their signs are decided by interval arithmetic
(mpmath, 50 digits), which gives an interval that contains the exact value; only if the interval
contains 0, the value is tested for 0 exactly (by its minimal polynomial), and, if it is not 0,
computed again with twice as many digits until the interval does not contain 0.

SymPy is needed (pip install sympy; mpmath comes with it). The program also runs in the browser,
with Pyodide, on the page of the family.
"""

import sympy as sp
from mpmath import iv
from sympy.simplify.fu import TR8

iv.dps = 50

a, h = sp.symbols("alpha h", positive=True)
N = sp.Symbol("n", positive=True)       # n itself, in the parameters n - c
vec = lambda x, y: sp.Matrix([x, y])
cos = lambda k: sp.cos(k * a)
sin = lambda k: sp.sin(k * a)

# The family and the line
L0, P1, D1, L1, P2, D2, L2 = 1, 2, 1, 2, 4, 1, N - 4
NS = range(21, 26)


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


p, along1, out1 = band(b, P1, D1, L1, right=True)       # S1; B1 is counterclockwise
q, along2, out2 = band(t, P2, D2, L2, right=False)      # S2; B2 is clockwise


# ------------------------------------------------------------------ the signed distances

normal = out1                            # the unit normal to the side p_3 p_4 of S1 pointing away from S1
f = [sp.expand((v - p[2]).dot(normal)) for v in q]
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
    return iv.mpf(sp.lambdify(a, expr.subs(N, n), modules=[names, "mpmath"])(2 * iv.pi / n))


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
                if sp.minimal_polynomial(expr.subs({a: 2 * sp.pi / n, N: n}), X) == X:
                    return 0
            iv.dps *= 2
    finally:
        iv.dps = digits


def values(n):
    """[(h, [f_q(h) for the four corners q])] at h = h_1(n) and h = h_2(n), as intervals."""
    out = []
    for H in (h1(n), h2(n)):
        out.append((at(H, n), [at(A[k] + B[k] * H, n) for k in range(4)]))
    return out


def show(x):
    """x as printed: its part in n as (n - c) times a sum, where n - c is the length of S2."""
    c = sp.expand(x.coeff(N))
    return str(x) if c == 0 else f"({L2}) * ({c}) + {sp.expand(x - L2 * c)}"


def main():
    print("f_q(h) = A + B h for the corners q_1, ..., q_4 of S2:")
    for k in range(4):
        print(f"  q_{k + 1}:  A = {show(A[k])}")
        print(f"         B = {B[k]}")
    positive = True
    for side, name in enumerate(("h_1(n)", "h_2(n)")):
        print(f"\nAt h = {name}:")
        print("   n         h      f(q_1)     f(q_2)     f(q_3)     f(q_4)")
        for n in NS:
            H, fs = values(n)[side]
            end = (h1, h2)[side](n)
            positive &= all(sign(A[k] + B[k] * end, n) == 1 for k in range(4))
            print(f"  {n:2d}  {float(H.mid):8.6f}  " + "  ".join(f"{float(x.mid):9.6f}" for x in fs))
    print("\nEvery value is positive." if positive else "\nSome value is not shown to be positive.")


if __name__ == "__main__":
    main()
