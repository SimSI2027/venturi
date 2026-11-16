# STATUS — run 4 (2026-11-15) · v1.1

1. Done (item 1): I appended corrections 1-3 to VENTURI_JOB.md. The file is git-ignored, so this item has no commit.
2. Done (items 2-3, one commit, same pose code): explode goes to 0 on entry. The current step's parts sit 0.5 body-lengths out along their removal direction, with the brass outline and the name card. Tear-down 3 hides 15 parts; rebuild 1 shows only the bare body plus "20 · JET, MAIN (#100)"; rebuild parts slide home in 0.6 s.
3. Done (item 4): the pilot-screw-turns callout is on TEAR DOWN 1 only and on no REBUILD step.
4. Done (items 5-10): new YFZ450 at L = 175 cm (the carburetor's 12.15 cm = 0.07 L), measured at 1.005 x 0.64 x 0.59 L; 41 meshes, 63.6k triangles. Fender heights are solved in code for a 0.03 L gap over the tread, so items 6 and 7 share one commit.
5. Done (items 11-12): intro frame 0 is the photo's front three-quarter view at 20 deg up, with the quad at 0.80 of the usable area. In OFF THE ATV the quad is solid at 100% (seat, tank cover and side covers off), the carburetor is outlined and step 1 fills 0.80 from outside.
6. Fixed after looking: the gloss-black bodywork read as chrome and the aluminium as white; a guided name card sat across the body on tear-down 3 (it now goes above it).
7. Budget: 401k triangles were drawn with the quad on screen. Now the carburetor skips AO and shadows while inside the quad, and the ATV skips the outline depth pass; maximum 289k.
8. Live: https://simsi2027.github.io/venturi/ · tag v1.1 · zero console errors · shots scratch/r4-*.png (taken before the 3 fixes).
9. Look at: on rebuild steps where the body fills the view (e.g. 3) the name card has no room outside the body; the mixture set (pilot screw, not in section B) stays with the "bare" body.
10. Look at: perf showed guided modes drawing 60 frames/s while idle (30 expected); the new shells after the material change have not been re-shot.
