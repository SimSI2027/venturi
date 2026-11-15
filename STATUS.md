# STATUS — run 2 (2026-11-15)

1. Done (item 1): TEAR DOWN (27) and REBUILD (27, reversed) modes. Step card with Back/Next (also the arrow keys), part chips, a one-line note and brass section-C callouts. Checkboxes and the last step are saved in localStorage. Progress shows on the mode buttons and the card. Panel tabs Parts/Specs/Steps/Notes; Notes is one saved text box.
2. Done (item 2): ATV prop in src/atv.js, 41 meshes / 53k tris. 7 s intro (seat → tank cover → side covers lift, the rest flies out away from the camera, push-in to the hero view) with Skip, Esc and a "↺ Intro" replay. OFF THE ATV, 9 steps: quad at 38%, step pieces lit brass (cable, duct clamp, joint clamps, joint), carb leaves to the shifter side at A8.
3. Item 3 "My notes": none were given in the prompt (the placeholder was empty), so nothing was changed for it.
4. Live: https://simsi2027.github.io/venturi/ · zero console errors (D3D shader warnings only) · shots in scratch/r2-*.png · URL params ?intro=<s> (hold), ?nointro, ?mode=atv|teardown|rebuild&step=n.
5. Measured once (RTX 4090, 800 px): intro frame 0 was 391k → 279k after the shadow pass stopped following the ATV fade and the carb left the mirror while the ATV is shown; explore 302k; rebuild 110k.
6. Decisions: the ATV casts no shadows and is out of the AO and mirror passes (floor contact shadow scales to it). Ref-20 jet goes back at REBUILD 1 (pilot air jet). Parts removed on the ATV (65-67, 70, 73, 74, 76) stay off through TEAR DOWN and REBUILD.
7. Fixed after looking: intro pieces flew into the camera; the active mode button rendered blank; Back/Next scrolled out of the card on short screens.
8. Skipped: no OFF THE ATV screenshot (run allows 3); phone 390 px and 1902 px not shot; polish (run 3).
9. Look at: the ATV's front/rear fender wings read as flat slabs; the rebuild framing makes the body large next to small parts (float, jets).
10. Look at: OFF THE ATV step 5 (throttle cable) frames the whole cable up to the bar, so the carb is small; the 4-shock layout follows the job file, though a real YFZ450 has 3.
