# STATUS — run 5 (2026-11-15) · v1.2

1. Done (items 1-2): corrections 4-6 appended to VENTURI_JOB.md (git-ignored, no commit). ATV prop, 7 s intro, SKIP INTRO and INTRO buttons deleted with their code (src/atv.js gone, 0 ATV modules); the page opens on the assembled carburetor at its hero angle, first frame 0.98 s.
2. Done (item 3): OFF THE ATV is a 9-step checklist on the carburetor alone; each step outlines in brass the parts it names (47 on step 1, the body on step 8) and nothing on steps 5, 6, 7 and 9, which name 0 parts.
3. Done (item 4): a drag anywhere turns the held part 360 deg in 500 px on both axes (spin was already in the change check), the wheel zooms it, Esc (also from the search box) and a tap away send it home, the rest fades to 10%. Scripted check: 125 px = 90 deg, 500 px = 360 deg.
4. Done (item 5): Next, Back, Done and a list row show the new step at once and settle the parts and camera in 0.45 s; Done now marks the step and moves on. Scripted pass of all 27 steps of both modes: 68 checks, 0 failures, slowest 485 ms (scratch/modes.log).
5. Done (item 6): scratch/coverage.txt has 79 lines; 12 references have "none" as tear-down step: 1 (the body stays), 49-52 (pilot screw set, not in the manual's list), 65-67, 70, 73, 74, 76 (come off in OFF THE ATV steps 3-4). No steps added.
6. Done (item 7): guided modes idled at 60/s because the change check compared the outline's text key; now 0 draws when settled and 30/s while swaying.
7. Done (item 8): README, ? card and page description have no ATV or intro; docs/hero.png retaken at 1600x900 of the assembled carburetor.
8. Fixed after looking: pinch with two fingers zooms a held part (the ? card promised it). Zero console errors (only a driver shader warning X4122); shots scratch/r5-load.png, r5-turn.png, r5-rb5.png.
9. Look at: on rebuild steps where the body fills the view (e.g. 5) the name card still sits across the body's edge; the mixture set (49-52) stays on the bare body in rebuild.
10. Live: https://simsi2027.github.io/venturi/ (200) · tag v1.2 · the mode name "Off the ATV" is kept; the 12 "none" references are listed in item 5.
