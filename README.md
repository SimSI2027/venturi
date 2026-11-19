# VENTURI 39

**Live:** https://simsi2027.github.io/venturi/

[![VENTURI 39: the assembled carburetor with the parts panel](docs/hero.png)](https://simsi2027.github.io/venturi/)

Look: studio lighting by default; add ?light=classic to compare.

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
- **Throttle** slider (EXPLORE, beside EXPLODE), 0-100%: the slide lifts with the jet needle and the pump levers turn; visual only, and the footer says so while it is open.
- **Circuits**: 5 buttons (Fuel in, Pilot, Main, Pump, Starter) outline a circuit's parts, dim the rest and list them in the card; visual only, and each throttle range is a rule of thumb, not from the manual.
- **Bench steps**: at TEAR DOWN 19 (REBUILD 11) the float chamber sits on the bench beside the body while accelerator jet 77 comes out of it, and at TEAR DOWN 11-13 (REBUILD 17-19) the slide 9 does, for plate 11, needle holder 14 and jet needle 48.
- **Kit** tab: the parts a rebuild usually replaces, with their quantities and a "manual: fit new" column for the ones the manual marks New.
- **?** (button or key) shows these controls on the page.
- **High / Med / Low** sets the render quality; `?perf=1` shows a performance overlay.

## At the bench

1. Open **Steps** first: the "Off the ATV" list (seat and covers, then the manual's 9 steps) has a checkbox per line, saved in this browser.
2. Before the first TEAR DOWN step, count the pilot screw turns from seated and write them in **Notes**; REBUILD step 1 asks for them back.
3. In TEAR DOWN each part goes to the tray under the carburetor, grouped by step; REBUILD puts them back in reverse, with the manual's notes as brass callouts.
4. A part's card shows the manual's check line where it has one, "manual: fit new" (also a column in **Kit**) and "Apply thread locker (LT)" on the throttle shaft screw.
5. Parts the manual's list does not name say so on their card; the page is a visual guide only, so follow the service manual.

## Jets

Stock settings, straight from the service manual (`specs.json`):

| Part | Stock |
|---|---|
| Main jet | #158 |
| Main air jet | 1.0 mm |
| Pilot jet | #42 |
| Pilot air jet | #100 |
| Starter jet | #90 |
| Jet needle | NDSR, clip in groove 4 |
| Cutaway | 1.5 |

What each part governs, by throttle opening (a general rule of thumb for slide carburetors, not a manual figure):

| Throttle range | Governed by |
|---|---|
| Idle to about 1/8 | Pilot screw and pilot jet |
| About 1/8 to 3/4 | Jet needle (and its clip groove) |
| About 3/4 to full | Main jet |
| Quick opening | Accelerator pump |

Jets are replaceable: altitude, temperature and intake or exhaust changes can all call for a different size. Do not change them from this page; the service manual decides.

## Notice

**Visual guide only. Follow the service manual.** Shapes are eyeballed from the parts diagram and the manual's
drawings: no real dimensions, no CAD. Specifications shown come from the service manual only.

## Credits

- [three.js](https://threejs.org) (MIT)
- Build step and studio setup from the [cutaway](https://github.com/Nyxera0x/cutaway) skill by Nyxera0x
- Font: Barlow Condensed (SIL OFL)

MIT licensed, see [LICENSE](LICENSE).
