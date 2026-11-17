1. Run 20 (2026-11-17), small fixes, v3.0.1. Done: 2 float callout now on REBUILD step 10 (Fit: Float pin); 3 REBUILD step 29 note reads "These go on after the carburetor is back on the ATV: fuel hose, then the throttle cable cover, 2 bolts, 4 Nm." (TEAR DOWN step 1 note unchanged); 4 plate 11 shows only "Check: Scratched, worn or damaged: replace." (valve 9 keeps both sentences).
2. Item 1: correction 46 appended to VENTURI_JOB.md (git-ignored, so no commit). Blender is closed; the page stays procedural.
3. Item 5, K16 (TEAR DOWN step 9): the old -Z flight ran through the cable wheel (K12), washer K15 and spring K14 in a 20-point box test, so it now goes in 2 legs: 57 mm out along the throttle shaft to its +Z end, then 24.5 mm up (new `legs` option in src/lib/asm.js; hover maths in src/main.js).
4. K16 test after the fix: 0 contacts with the wheel, washer, spring or any other part except the slide it rides on, the shaft until it slides off, its own stop screw and the body's merged shell (whose box covers the whole body); 1 graze with screw 14 (0.7 mm of box overlap, points 1-3).
5. Item 6: scratch/steps_export.txt rewritten; account script 111 parts, 0 failures; mode pass 72 checks, 0 failures, 0 console errors. Screenshots: 1 (800 px, step 9); the lever is too small to pick out, so the path rests on the numbers (it moved +57.2 mm Z, +24.5 mm Y and is in frame).
6. Live: https://simsi2027.github.io/venturi/ · tag v3.0.1 · pushed to main.
7. Skipped: nothing from this prompt.
8. Look at: (a) K16 at step 9 on the live page: does the lever clear the shaft end and the screw 14 head? (b) The dashed line for K16 shows only its first leg. (c) Step 9's camera frames the parts, not K16's flight.
9. Not done from before: brightness checked in 8 of 58 steps; the 7 unclear marks; real scale in the tray.
10. Shape work stays closed (correction 39); Blender closed (corrections 45-46).
