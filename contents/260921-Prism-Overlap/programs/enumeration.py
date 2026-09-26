#!/usr/bin/env python3
"""Enumeration of the path partial unfoldings of patterns BSBS and SBSBS.

For each n, this program counts the tuples of parameters that Algorithm 1
does not reject:

    pattern BSBS    (l0, p2, d2, l2)
    pattern SBSBS   (l0, p1, d1, l1, p2, d2, l2)

The side faces of the regular n-gonal prism are labeled 0, 1, ..., n - 1 in
order. The band S0 consists of the side faces 0, ..., l0 - 1, and the band
S_i (i = 1, 2) of the side faces p_i, p_i + d_i, ..., p_i + (l_i - 1) d_i,
taken modulo n, where d_i is +1 or -1. A tuple gives a path partial
unfolding if and only if its bands are pairwise disjoint; for pattern BSBS
the band S1 is empty.

What is counted is tuples, not distinct path partial unfoldings: the band
given by (p, +1, l) is also given by (p + l - 1, -1, l), and both tuples are
counted. In particular a band of one side face is counted twice, once with
d = +1 and once with d = -1.

The output is Table 2 of the supplementary site (the column "enumerated" of
Appendix B).

Usage:
    python3 enumeration.py           # n = 3, ..., 25
    python3 enumeration.py 3 12      # n = 3, ..., 12

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


def bands(n, used):
    """The bands that avoid the side faces in `used`.

    Each band is given as its bit mask, with the number of tuples (p, d, l)
    that give it.
    """
    count = {}
    for length in range(1, n):
        for p in range(n):
            for d in (+1, -1):
                mask = band(n, p, d, length)
                if mask & used == 0:
                    count[mask] = count.get(mask, 0) + 1
    return count


def count_bsbs(n):
    """The number of tuples (l0, p2, d2, l2) with S0 and S2 disjoint."""
    total = 0
    for l0 in range(1, n):
        s0 = band(n, 0, +1, l0)
        total += sum(bands(n, s0).values())
    return total


def count_sbsbs(n):
    """The number of tuples (l0, p1, d1, l1, p2, d2, l2) for which the bands
    S0, S1 and S2 are pairwise disjoint."""
    total = 0
    for l0 in range(1, n):
        s0 = band(n, 0, +1, l0)
        free = bands(n, s0)            # the bands that avoid S0, for S1 and S2
        for s1, c1 in free.items():
            for s2, c2 in free.items():
                if s1 & s2 == 0:
                    total += c1 * c2
    return total


def main():
    if len(sys.argv) >= 3:
        lo, hi = int(sys.argv[1]), int(sys.argv[2])
    else:
        lo, hi = 3, 25
    print(f"{'n':>3}  {'BSBS':>7}  {'SBSBS':>9}")
    for n in range(lo, hi + 1):
        print(f"{n:>3}  {count_bsbs(n):>7,}  {count_sbsbs(n):>9,}")


if __name__ == "__main__":
    main()
