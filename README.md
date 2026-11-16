# VENTURI 39

**Live:** https://simsi2027.github.io/venturi/

[![VENTURI 39: the assembled carburetor with the parts panel](docs/hero.png)](https://simsi2027.github.io/venturi/)

An interactive three.js guide to a Keihin flat-slide carburetor with accelerator pump (the one on a 2004
YFZ450, I.D. mark 5TG1 00), built entirely in code. Every one of the 79 parts-diagram references is a clickable part:
find it, see where it sits, and follow the order it comes off and goes back.

## What this carburetor is

A **Keihin FCR-MX 39**: a flat-slide carburetor with an accelerator pump, I.D. mark **5TG1 00**, fitted to the Yamaha YFZ450.
Years: rebuild-kit sellers list this carburetor for the 2004 to 2009 YFZ450 ([Krenbits](https://krenbits.com/products/em-carb-rebuild-kit-carburetor-for-yamaha-yfz450-2004-2009)); that is a seller's fitment table, not a Yamaha statement, and the OEM carburetor assembly number changes between years (5TG-14101-10 and -21 in 2005 lists, -34 in a 2007 list), so check your own year and VIN before ordering parts.

## Controls

- **Drag** to orbit, **wheel / pinch** to zoom. The page opens on the assembled carburetor; idle, the view sways gently.
- **EXPLODE** slider: the 13 groups come apart in the service manual's order, then each group's parts.
- **Group pills (01-13)**: fly to a group; the rest dim.
- **Hover** a part for its name; **click** it to bring it forward (the rest fades to 10%), **drag** to turn it a full 360 degrees on both axes and use the **wheel** to zoom it. Esc or click away puts it back.
- **Parts** panel: search all 79 references by number or name; **Specs** lists the specifications; **Steps** lists the
  current guided mode; **Notes** keeps your own numbers (pilot screw turns, jets found) in this browser.
- **Tear down / Rebuild**: guided steps with **Back / Next / Done** (or the arrow keys), the camera on the current
  part, a one-line note, brass callouts on the rebuild and a checkbox per step, saved in this browser. 29 steps each:
  the manual's 27 plus 2 marked "added step, not in the manual's list" (throttle cable cover and fuel hose first,
  the pilot screw set last), so every reference but the body comes off in exactly 1 step.
- **?** (button or key) shows these controls on the page.
- **High / Med / Low** sets the render quality; `?perf=1` shows a performance overlay.

## Notice

**Visual guide only. Follow the service manual.** Shapes are eyeballed from the parts diagram and the manual's
drawings: no real dimensions, no CAD. Specifications shown come from the service manual only.

## Credits

- [three.js](https://threejs.org) (MIT)
- Build step and studio setup from the [cutaway](https://github.com/Nyxera0x/cutaway) skill by Nyxera0x
- Font: Barlow Condensed (SIL OFL)

MIT licensed, see [LICENSE](LICENSE).
