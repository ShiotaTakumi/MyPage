#!/usr/bin/env python3
"""The first step of the reduction: the candidates in which every band other
than S0 is maximal.

For each n, this program counts the tuples of parameters that give a path
partial unfolding (as enumeration.py does) and in which the bands S1 and S2
are maximal:

    pattern BSBS    (l0, p2, d2, l2)
    pattern SBSBS   (l0, p1, d1, l1, p2, d2, l2)

A band is maximal if it cannot be extended without reusing a side face of the
path partial unfolding. The band S_i consists of the side faces p_i,
p_i + d_i, ..., p_i + (l_i - 1) d_i, taken modulo n, and is extended by the
side face p_i + l_i d_i, just past its end in its own direction; so it is
maximal if that side face is used by S0, S1 or S2.

A band of one side face is given by two tuples, one with d_i = +1 and one
with d_i = -1. As in Table 3 of the supplementary site, the two patterns
treat them differently:

    pattern BSBS    each of the two tuples is judged in its own direction,
                    as above;
    pattern SBSBS   the band is maximal only if the side faces on both sides
                    of it are used. Then both tuples are kept, and otherwise
                    both are removed.

Either way, a candidate is removed only when its bands lie in those of
another candidate, so no candidate whose end faces overlap is lost; the
second way removes more candidates.

The output is the column "step 1" of Table 3 of the supplementary site.

Usage:
    python3 reduction_inclusion.py           # n = 3, ..., 25
    python3 reduction_inclusion.py 3 12      # n = 3, ..., 12

Only the standard library is used.
"""

import sys


def band(n, p, d, length):
    """The side faces p, p + d, ..., p + (length - 1) d modulo n, as a bit mask.

    Bit j of the mask stands for the side face j.
    """
    mask = 0
    for k in range(length):
        mask |= 1 << ((p + k * d) % n)
    return mask


def bands(n, used, both_sides):
    """The bands that avoid the side faces in `used`, one for each tuple
    (p, d, l) that gives it.

    Each band is given as its bit mask, with the side faces that must be used
    for it to be maximal: the one past its end, or, for a band of one side
    face when `both_sides` is true, the two beside it.
    """
    out = []
    for length in range(1, n):
        for p in range(n):
            for d in (+1, -1):
                mask = band(n, p, d, length)
                if mask & used:
                    continue
                if length == 1 and both_sides:
                    need = (1 << ((p + 1) % n)) | (1 << ((p - 1) % n))
                else:
                    need = 1 << ((p + length * d) % n)
                out.append((mask, need))
    return out


def count_bsbs(n):
    """The number of tuples (l0, p2, d2, l2) with S0 and S2 disjoint and S2
    maximal in its own direction."""
    total = 0
    for l0 in range(1, n):
        s0 = band(n, 0, +1, l0)
        for mask, need in bands(n, s0, both_sides=False):
            if need & ~(s0 | mask) == 0:
                total += 1
    return total


def count_sbsbs(n):
    """The number of tuples (l0, p1, d1, l1, p2, d2, l2) with S0, S1 and S2
    pairwise disjoint and S1 and S2 maximal (a band of one side face on both
    sides)."""
    total = 0
    for l0 in range(1, n):
        s0 = band(n, 0, +1, l0)
        free = bands(n, s0, both_sides=True)     # for S1 and S2 alike
        for m1, need1 in free:
            for m2, need2 in free:
                if m1 & m2:
                    continue
                used = s0 | m1 | m2
                if need1 & ~used == 0 and need2 & ~used == 0:
                    total += 1
    return total


def main():
    if len(sys.argv) >= 3:
        lo, hi = int(sys.argv[1]), int(sys.argv[2])
    else:
        lo, hi = 3, 25
    print(f"{'n':>3}  {'BSBS':>5}  {'SBSBS':>7}")
    for n in range(lo, hi + 1):
        print(f"{n:>3}  {count_bsbs(n):>5,}  {count_sbsbs(n):>7,}")


if __name__ == "__main__":
    main()
