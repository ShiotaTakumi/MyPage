#!/usr/bin/env wolframscript
(* ::Package:: *)

(* BSBS-4: the two end faces do not overlap for h_1(n) <= h <= h_2(n), where 21 <= n <= 25.

   Mathematica version of bsbs-4.py, written separately from it. The family has l0 = 2, p2 = 4,
   d2 = -1, l2 = 3, and the line is the one through the end p_2 p_4 of S2, at its last side face
   s_2. The script lays the path partial unfolding down in the coordinates of the page (B2 is walked
   along its edges here, instead of being obtained as a mirror image of B1, and each band is walked
   along its base one side face at a time), checks that the signed distances f_{b_j}(h) of the
   vertices b_2, b_3, b_4, b_5 of B1 from the line equal the formulas on the page, that they are
   positive at h_1(n) and h_2(n), and, for every n, that f_{b_j}(h_1(n)) > 0 and f_{b_j}(h_2(n)) > 0
   for every j = 0, ..., n - 1 and that the smallest f_{b_j} is at one of these vertices. Identities
   in alpha are verified as (left side) - (right side) = 0. The sign of a number for a particular n
   (alpha = 2 Pi/n) is decided by interval arithmetic, and, only if the interval contains 0,
   exactly, as the sign of the algebraic number that RootReduce gives.

   Run:  wolframscript -file bsbs-4.wls *)

$Assumptions = a > 0 && h > 0;

passed = 0; failed = 0;
(* zero as an identity in alpha: after TrigReduce (products to sums), else by FullSimplify *)
zeroQ[e_List] := AllTrue[Flatten[e], zeroQ];
zeroQ[e_] := TrigReduce[Expand[e]] === 0 || FullSimplify[e] === 0;
check[label_String, e_] := If[zeroQ[e],
  passed++; Print[label, "  OK"],
  failed++; Print[label, "  NG: ", InputForm[FullSimplify[e]]]];
checkTrue[label_String, b_] := If[TrueQ[b],
  passed++; Print[label, "  OK"],
  failed++; Print[label, "  NG: ", b]];

(* the sign of x, an expression in a, at a = 2 Pi/n. First by interval arithmetic: a is replaced by an
   interval of 80 digits that contains 2 Pi/n, and Mathematica computes an interval that contains the
   value, rounding outward. Only if this interval contains 0 is the sign decided exactly: RootReduce
   gives the value as an algebraic number (a Root object with an isolating interval), whose sign
   Mathematica decides exactly. exact counts these. *)
exact = 0;
around[n_] := With[{c = N[2 Pi/n, 80]}, Interval[{c - 10^-70, c + 10^-70}]];
sgn[x_, n_] := With[{v = x /. a -> around[n]},
  Which[Min[v] > 0, 1, Max[v] < 0, -1, True, exact++; Sign[RootReduce[x /. a -> 2 Pi/n]]]];
positiveQ[x_, n_] := sgn[x, n] === 1;

(* ------------------------------------------------------------ the family *)

{l0, p2, d2, l2} = {2, 4, -1, 3};
ns = Range[21, 25];
shown = {2, 3, 4, 5};                        (* the vertices of B1 in the tables: b_2, b_3, b_4, b_5 *)
names = {"b_2", "b_3", "b_4", "b_5"};

(* ------------------------------------------------------------ the unfolding *)

(* B1: b_0 = (0, 0), b_1 = (1, 0), counterclockwise; the edge b_j b_{j+1} has the direction j a *)
b[j_] := If[j >= 0, Sum[{Cos[i a], Sin[i a]}, {i, 0, j - 1}],
  -Sum[{Cos[i a], Sin[i a]}, {i, j, -1}]];           (* b_j, j < 0, walked back from b_0 *)

(* S0 lies below b_0 b_1 along the x-axis, and B2 below its last side face, from t_{l0-1} = (l0 - 1, -h)
   to t_{l0} = (l0, -h). B2 is walked clockwise from there: its edge t_j t_{j+1} has the direction
   -(j - (l0 - 1)) a *)
dir2[j_] := {Cos[(j - (l0 - 1)) a], -Sin[(j - (l0 - 1)) a]};
t[j_] := {l0 - 1, -h} + Sum[dir2[i], {i, l0 - 1, j - 1}];

(* a band of l side faces s_p, s_(p+d), ... along an edge of a base with the direction dir, outside the
   base: from its corner c_1 on the base at the side face s_p, it is walked along the base one side
   face (the step d dir) at a time, to its corner c_2 at the other end; c_3 and c_4 are c_1 and c_2
   moved by h in the direction out, away from the base *)
band[c1_, dir_, d_, l_, out_] := With[{c2 = c1 + Sum[d dir, {k, 1, l}]}, {c1, c2, c1 + h out, c2 + h out}];

(* S2 lies along the edge t_{p2} t_{p2+1}, outside B2: B2 is on the right of the edge, as it is walked
   clockwise, so the outward normal is the edge turned by +90 degrees *)
out2 = {-dir2[p2][[2]], dir2[p2][[1]]};
s2 = band[If[d2 == 1, t[p2], t[p2 + 1]], dir2[p2], d2, l2, out2];
p = s2;                                   (* the corners p_1, ..., p_4 of S2 *)

(* the signed distance from the line through the end p_2 p_4 of S2, positive away from S2 *)
normal = d2 dir2[p2];
fb[j_] := Expand[(b[j] - p[[2]]) . normal];
f = fb /@ shown;

(* ------------------------------------------------------------ the formulas on the page *)

page = {
  h Sin[3 a] + Cos[a] + Cos[2 a] + Cos[3 a] - Cos[4 a] - 2,
  h Sin[3 a] + Cos[a] + Cos[2 a] + Cos[3 a] - Cos[4 a] - Cos[5 a] - 2,
  h Sin[3 a] + Cos[a] + Cos[2 a] + Cos[3 a] - Cos[4 a] - Cos[5 a] - Cos[6 a] - 2,
  h Sin[3 a] + Cos[a] + Cos[2 a] + Cos[3 a] - Cos[4 a] - Cos[5 a] - Cos[6 a] - Cos[7 a] - 2};
Do[check["f(" <> names[[k]] <> ")", f[[k]] - page[[k]]], {k, 4}];
check["S2 lies in f <= 0: f(p_1) = -3", (p[[1]] - p[[2]]) . normal - (-3)];

(* ------------------------------------------------------------ the two ends of the interval *)

(* h_1(n) and h_2(n) (Section 2 of the home page), in a *)
h1[n_] := Which[
  n <= 12, (Sin[3 a] - Sin[2 a])/Cos[a],
  n <= 16, (Sin[3 a] - Sin[2 a])/(Cos[a] - Cos[3 a]),
  n <= 19, (Cos[4 a] + 2 - Cos[a] - Cos[2 a])/Sin[3 a],
  True, (2 Sin[5 a] - Sin[4 a] - Sin[3 a] + Sin[a])/(Cos[2 a] - Cos[5 a])];
h2[n_] := If[n == 11, Cos[a]/(Sin[3 a] - Sin[2 a]), (Cos[a] - Cos[3 a])/(Sin[3 a] - Sin[2 a])];

(* f(b_j)(h_side(n)) for the vertices in the tables, in a *)
value[k_, side_, n_] := page[[k]] /. h -> If[side == 1, h1[n], h2[n]];
Do[checkTrue["f(" <> names[[k]] <> ")(h_" <> ToString[side] <> "(n)) > 0 for 21 <= n <= 25",
    AllTrue[ns, positiveQ[value[k, side, #], #] &]],
  {side, 2}, {k, 4}];

(* every vertex b_j of B1, j = 0, ..., n - 1, is outside at both ends, and the smallest f(b_j) is at a
   vertex in the tables: every other f(b_j) is larger than one of those (f(b_j) - f(b_k) does not
   depend on h) *)
checkTrue["f(b_j)(h_1(n)) > 0 and f(b_j)(h_2(n)) > 0 for j = 0, ..., n - 1 and 21 <= n <= 25",
  AllTrue[ns, Function[n, AllTrue[Range[0, n - 1], Function[j,
    positiveQ[fb[j] /. h -> h1[n], n] && positiveQ[fb[j] /. h -> h2[n], n]]]]]];
checkTrue["the smallest f(b_j) is at a vertex in the tables for 21 <= n <= 25",
  AllTrue[ns, Function[n, AllTrue[Complement[Range[0, n - 1], Mod[shown, n]], Function[j,
    AnyTrue[Mod[shown, n], positiveQ[Expand[(b[j] - b[#]) . normal], n] &]]]]]];

(* the table: f(b_j)(h_side(n)) for the vertices in the tables rounded to six decimals *)
Do[Print["n=", n, ", h=h_", side, "(n): ", StringRiffle[
    Table[ToString[NumberForm[N[value[k, side, n] /. a -> 2 Pi/n, 20], {12, 6}]], {k, 4}], "  "]],
  {side, 2}, {n, ns}];

Print["passed ", passed, ", failed ", failed, "; signs decided exactly (RootReduce): ", exact];
Exit[If[failed == 0, 0, 1]];
