# STATUS — run 1 (2026-11-15)

1. Done: data.js (79 refs, 13 groups, fits, steps A/B/C, specs verbatim); Ironwood stage/perf/asm/materials/build copied; all 13 groups built (83 clickable parts = 79 refs + 4 extra pieces of ref 1); EXPLODE, pills, hover, click-to-solo spin with card, parts panel with search + SPECS; repo, Pages, push.
2. Live: https://simsi2027.github.io/venturi/ · first frame ~1.0 s · zero console errors (D3D shader warnings only) · shots in scratch/r1-*.png.
3. Measured once (RTX 4090, 1902x935): carb ~130k tris per pass; frame totals idle 257k, exploded 288k; selected was 400k (shadow pass every frame), fixed to update shadows only when a move settles.
4. Ref 1 pieces with no fiche number of their own, shown as "1 · CARBURETOR ASSY 1" + piece: top cover, float chamber, pilot air cover, spacer (B24).
5. Group calls I made (drawings unclear): 4/6/7/8/29/45 → pump; 5 → bowl; 35/53/54/56/64 → starters; 36/55/62/63 → sensor; 40-44 → linkage; 68/69/75 → hoses.
6. Ref 20 sits as the main jet; it is also the B27 pilot air jet target (its card shows the conflict). Mixture group (49-52) has no manual step: card says count turns first.
7. Fixed after looking: aluminium read as white (darker cast), detail card ran into the dock, exploded layout too tall.
8. Skipped: ref/atv.webp (duplicate of atv.jpg, not read); guided modes, notes field, ATV and intro (run 2); polish (run 3).
9. Look at: the exploded layout for overlaps at 1902x935 (only seen at 800 px) and the 390 px phone layout (not shot).
10. Look at: tris during explode animation (~430k with the shadow pass) vs the 350k rule; carb is ~130k, under the ~250k target.
