// 8 pump: accelerator pump under the float chamber's cable-side lobe (from the photos). Cover (27) with screws (4) and
// gasket (29), spring (30), diaphragm (28), O-ring (31).
// Run 9: 45 PLATE is the stamped guard plate of carb_12, a shield-shaped plate under the pump cover's ears that
// reaches out past the bowl's cable-side edge; the adjusting screw (8, fits 45) goes up through its far ear with its
// washers (6, 7). The pump rod now rides with the bowl and its lever with the body. Built in carb space.
import {Asm} from '../lib/asm.js';
import {THREE, merge, cylY, tubeY, latheY, oring, springY, screwY, rpoly, rbox, extrudeXY, mk, part, mm} from './kit.js';
import {PUMP, PYW} from './bowl.js';
import {inset} from './body.js';

const [PX, PZ] = PUMP, PY = PYW - 0.2; // the cover's top: gasket and diaphragm fill the 0.2 up to the housing's face
// run 10 (item 6): the guard plate's outline (x, z): round under the whole pump cover (r 2.15), then a fan out to the
// cable side whose tip reads 85 mm from the bowl's centre in the underside overlay (carb_12's outer tip, 3.4 off; the
// plate is nearer that camera than the bore, so it is 72 mm true; a true 85 stood 34 mm proud in carb_8)
const arcP = (cx, cz, r, a0, a1, n) => Array.from({length: n}, (_, i) => { const a = a0 + ((a1 - a0) * i) / (n - 1); return [cx + Math.cos(a) * r, cz + Math.sin(a) * r, 0.25]; });
const SHIELD45 = [...arcP(PX, PZ, 2.15, -0.25 * Math.PI, 1.25 * Math.PI, 14), [-1.5, -5.95, 0.4], [-2.2, -6.7, 0.4], [-1.6, -6.88, 0.5], [-0.78, -6.95, 0.6], [0.1, -6.88, 0.5], [0.85, -6.72, 0.4], [1.75, -6.0, 0.4]];
const ADJ = [1.16, -5.88]; // the adjusting screw (8) up through the fan near its air-box edge (item 5: carb_12's place from the screws)

export function buildPump(index) {
  const A = new Asm('pump', 'Pump', {offset: [0, -9.0, -3.0], index, axis: [0, -1, 0]});
  const {cast, rubber, steel, zinc} = A.M;
  // 27 cover: a shallow round cover with three screw ears and the rod boss
  const ER = 1.75; // a round cover 3.2 across (carb_12, carb_bottom), screw ears at r 1.75
  const EA = [0.55, 2.85, 4.95]; // the ears clear of the plate's ear and the lobe's root
  const ears = merge(EA.map((a) => cylY(0.34, -0.4, 0).translate(Math.cos(a) * ER, 0, Math.sin(a) * ER)));
  const cov = merge([latheY([[-0.55, 0], [-0.55, 1.25], [-0.4, 1.5], [0, 1.6], [0, 0]].reverse().map(([y, r]) => [y, r]).reverse()), ears, cylY(0.35, -0.85, -0.5)]);
  A.add(part([PX, PY, PZ], mk(cov, cast)), '27', {ex: [0, -3.4, 0], order: 0.15});
  const scr = screwY(mm(8), mm(3.5), mm(2), mm(2.6)).rotateX(Math.PI); // M4 x 8 (Keihin list)
  const PT = mm(1.2); // the plate's thickness
  A.add(part([PX, PY - 0.4 - PT, PZ], ...EA.map((a) => mk(scr.clone(), zinc, Math.cos(a) * ER, 0, Math.sin(a) * ER))), '4', {ex: [0, -5.0, 0], order: 0});
  // the stack under the bowl's pump housing: gasket 29 on the cover, diaphragm 28 on the gasket; both a little
  // wider than the cover and housing, so their black edges show between them
  A.add(part([PX, PY, PZ], mk(tubeY(1.72, 1.3, 0, 0.1), rubber)), '29', {ex: [0, -2.5, 0], order: 0.3});
  A.add(part([PX, PY - 0.5, PZ], mk(springY(0.75, 0.55, 0.06, 4), steel)), '30', {ex: [0, -1.7, 0], order: 0.35});
  A.add(part([PX, PY + 0.1, PZ], mk(merge([tubeY(1.72, 0.2, 0, 0.1), cylY(0.32, -0.2, 0.15)]), rubber)), '28', {ex: [0, -0.9, 0], order: 0.45});
  // 31 O-ring: run 9, seated on the bowl lobe's face beside the diaphragm, round the pump's outlet passage
  A.add(part([PX + 1.3, PYW - 0.06, PZ + 0.6], mk(oring(0.22, 0.06), rubber)), '31', {ex: [0.8, -0.3, 0.8], order: 0.5});
  // 45 the guard plate (run 10, item 6): 1 solid stamped steel shield, every piece a closed solid, 0 holes: the flat
  // plate under the cover's ears (the 3 cover screws through it), a dish pressed down under the cover's dome, a rim
  // bent down round its whole edge, and 5 pressed ribs fanning out along the fan end
  const flat = extrudeXY(rpoly(SHIELD45, 0.3), PT, 0.03, 10, {free: true}).rotateX(Math.PI / 2);
  const ring = rpoly(SHIELD45, 0.3);
  ring.holes.push(rpoly(inset(SHIELD45, 0.13), 0.2, new THREE.Path()));
  const rim = extrudeXY(ring, 0.22, 0.03, 10, {free: true}).rotateX(Math.PI / 2).translate(0, -PT / 2 - 0.09, 0);
  // (the cover's dome reaches 0.09 under the plate's origin, its centre nub 0.39: the dish holds both, 0.48 deep)
  const dish = latheY([[-0.48, 0], [-0.48, 0.55], [-0.42, 0.8], [-0.18, 1.3], [-0.1, 1.42], [-0.05, 1.42], [-0.05, 0]]).translate(PX, 0, PZ);
  const R0 = [-0.5, -5.55], RZ = -6.6;
  const ribs = merge([-1.75, -1.15, -0.55, 0.05, 0.65].map((ex) => {
    const dx = ex - R0[0], dz = RZ - R0[1], L = Math.hypot(dx, dz);
    return rbox(L, 0.09, 0.18, 0.04).rotateY(Math.atan2(-dz, dx)).translate((R0[0] + ex) / 2, -PT / 2 - 0.03, (R0[1] + RZ) / 2);
  }));
  A.add(part([0, PY - 0.4 - PT / 2, 0], mk(merge([flat, rim, dish, ribs]), steel)), '45', {ex: [0, -4.2, -0.6], order: 0.2, axis: [0, -1, 0]});
  // 8 adjusting screw up through the plate's ear into the lobe, a knurled head under it, washers 6 and 7 between
  const yb = PY - 0.4 - PT; // the plate's underside
  const adj = merge([screwY(1.0, 0.13, 0.13, 0.01).rotateX(Math.PI), cylY(0.3, -0.32, 0)]);
  A.add(part([ADJ[0], yb - 0.16, ADJ[1]], mk(adj, steel)), '8', {ex: [0, -3.6, 0], order: 0.1, axis: [0, -1, 0]});
  A.add(part([ADJ[0], yb, ADJ[1]], mk(tubeY(0.3, 0.14, -0.08, 0), steel)), '6', {ex: [0, -2.8, 0], order: 0.12, axis: [0, -1, 0]});
  A.add(part([ADJ[0], yb - 0.08, ADJ[1]], mk(tubeY(0.26, 0.14, -0.08, 0), steel)), '7', {ex: [0, -2.2, 0], order: 0.14, axis: [0, -1, 0]});
  return A;
}
