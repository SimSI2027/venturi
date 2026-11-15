# STATUS — run 3 (2026-11-15) · v1.0

1. Item 1 (materials and lighting): checked against "The look", already in line from run 1 (key upper left, cool fill 25% of key, floor contact shadow, 12% mirror, ACES, cast 0.55 + grain normal map, brighter machined bore/lip, brass/steel/rubber/plastic/anodised slide). No change, no commit.
2. Done (item 2): measured with VENTURI.fit() at 1902x935, 1189x940, 390x844. Explore, explode, all 13 pills and all three guided modes were 0.80 and centred. The selected part was 0.21-0.43; it is now sized from its projected extents to 0.71-0.81 (scale clamp 30 -> 80 for the 3.7 mm clip 13).
3. Done (item 3): MSAA 8/4 + SMAA and 35 deg creased normals were already in. Washers 6, 7 and 52 went from 0.6 to 0.8 mm (1.2 -> 1.6 px on a phone); everything else is >= 1.6 px. One cubic in-out easing for all UI transitions.
4. Done (item 4): "?" button and card (? key, Esc, click-away). docs/hero.png is 1600x900 (explode 0.35). Title, description, OG/Twitter tags and the favicon come from scripts/head.mjs (run 1), and the page was rebuilt with them.
5. Done (item 5): README has the hero image linked to the live page, plus the guided modes, intro, notes and ? card.
6. Item 6 "My fixes": none were given (the prompt still had the template placeholder), so nothing was changed.
7. Live: https://simsi2027.github.io/venturi/ · tag v1.0 · zero console errors (D3D X4122 warning only) · shots scratch/r3-*.png (assembled, explode 1, selected 47, rebuild 20 with ? card).
8. Fixed after looking: ? card columns (fixed 230 px label column -> auto grid); the part card ran under the dock at 500 px tall (now scrolls).
9. Look at: a selected part at 800x500 sits right against the card's edge and the header (it is inside the rule but tight); the dimmed body behind it reads busy.
10. Look at: whether the cast body is pale enough for you on your screen; the explode-1 view leaves small parts (jets, clips) only a few px wide, which is still within the rule.
