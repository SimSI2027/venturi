// 8 pump: accelerator pump under the float chamber's cable-side lobe (from the photos). Cover (27) with screws (4) and
// gasket (29), spring (30), diaphragm (28), O-ring (31).
// Run 9: 45 PLATE is the stamped guard plate of carb_12, a shield-shaped plate under the pump cover's ears that
// reaches out past the bowl's cable-side edge; the adjusting screw (8, fits 45) goes up through its far ear with its
// washers (6, 7). The pump rod now rides with the bowl and its lever with the body. Built in carb space.
import {Asm} from '../lib/asm.js';
import {THREE, merge, cylY, tubeY, latheY, oring, springY, screwY, rpoly, circ, extrudeXY, mk, part, mm} from './kit.js';
import {PUMP, PYW} from './bowl.js';

const [PX, PZ] = PUMP, PY = PYW - 0.2; // the cover's top: gasket and diaphragm fill the 0.2 up to the housing's face
// the guard plate's outline (x, z), traced from carb_12: round the cover's engine-side half, out past the cable side
const PLATE45 = [[-1.3, -2.45], [-2.4, -2.75], [-3.1, -3.3, 0.4], [-3.3, -4.3, 0.45], [-2.9, -5.1, 0.4], [-1.8, -5.45, 0.35], [-0.6, -5.38, 0.4], [0.1, -4.7, 0.3], [0.3, -3.6, 0.3], [-0.2, -2.7, 0.3]].map(([x, z, r]) => [x + 1.67, z - 0.3, r]); // (landmarks: with the pump, 0.9 toward the air box)
const ADJ = [1.72, -4.9]; // the adjusting screw (8) in the plate's ear at its air-box corner (carb_12; run 10: with the pump)

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
  // 45 the stamped guard plate: flat, a raised pressed panel inside its edge and a pressed rib, a hole the cover's
  // dome shows through, under the cover's ears (the 3 cover screws go through it)
  const ps = rpoly(PLATE45.slice().reverse(), 0.3);
  ps.holes.push(circ(PX, PZ, 1.55));
  const flat = extrudeXY(ps, PT, 0.03, 10, {free: true});
  const inner = rpoly([[-2.75, -4.2, 0.3], [-2.45, -5.05, 0.3], [-1.6, -5.3, 0.3], [-0.75, -5.2, 0.3], [-1.2, -4.85, 0.2], [-2.05, -4.55, 0.2]].map(([x, z, r]) => [x + 1.52, z - 0.3, r]).reverse(), 0.2);
  const pressed = extrudeXY(inner, mm(1.0), 0.03, 8, {free: true}).translate(0, 0, PT / 2 + mm(0.4));
  const plate = merge([flat, pressed]).rotateX(Math.PI / 2); // shape y -> z, pressed side down
  A.add(part([0, PY - 0.4 - PT / 2, 0], mk(plate, steel)), '45', {ex: [0, -4.2, -0.6], order: 0.2, axis: [0, -1, 0]});
  // 8 adjusting screw up through the plate's ear into the lobe, a knurled head under it, washers 6 and 7 between
  const yb = PY - 0.4 - PT; // the plate's underside
  const adj = merge([screwY(1.0, 0.13, 0.13, 0.01).rotateX(Math.PI), cylY(0.3, -0.32, 0)]);
  A.add(part([ADJ[0], yb - 0.16, ADJ[1]], mk(adj, steel)), '8', {ex: [0, -3.6, 0], order: 0.1, axis: [0, -1, 0]});
  A.add(part([ADJ[0], yb, ADJ[1]], mk(tubeY(0.3, 0.14, -0.08, 0), steel)), '6', {ex: [0, -2.8, 0], order: 0.12, axis: [0, -1, 0]});
  A.add(part([ADJ[0], yb - 0.08, ADJ[1]], mk(tubeY(0.26, 0.14, -0.08, 0), steel)), '7', {ex: [0, -2.2, 0], order: 0.14, axis: [0, -1, 0]});
  return A;
}
