// 8 pump: accelerator pump under the float chamber's cable-side lobe (from the photos). Cover (27) with screws (4) and
// gasket (29), spring (30), diaphragm (28), O-ring (31).
// Run 11: 45 PLATE is a small strap under the cover's cable-side ear (mine_6 has no guard plate); the adjusting screw
// (8, fits 45) goes up through its far end with its washers (6, 7). The pump rod rides with the bowl. Carb space.
import {Asm} from '../lib/asm.js';
import {THREE, merge, cylY, tubeY, latheY, oring, springY, screwY, fastenerY, rpoly, rbox, extrudeXY, mk, part, mm, M4_HOLE, M3_HOLE, circ, diaphragmY} from './kit.js';
import {PUMP, PYW} from './bowl.js';
import {inset} from './body.js';

const [PX, PZ] = PUMP, PY = PYW - 0.2; // the cover's top: gasket and diaphragm fill the 0.2 up to the housing's face
const ADJ = [1.16, -5.88]; // the adjusting screw (8) up through the fan near its air-box edge (item 5: carb_12's place from the screws)

export function buildPump(index) {
  const A = new Asm('pump', 'Pump', {offset: [0, -9.0, -3.0], index, axis: [0, -1, 0]});
  const {cast, rubber, steel, zinc, machined} = A.M;
  // 27 cover: a shallow round cover with three screw ears and the rod boss
  const ER = 1.85; // a round cover 3.2 across (carb_12, carb_bottom), screw ears at r 1.85 (run 14: 0.1 out so the holes clear the dome)
  const EA = [0.55, 2.85, 4.95]; // the ears clear of the plate's ear and the lobe's root
  // run 14 (item 4): each ear has its 4.5 mm through-hole and, under it, a flat machined seat for the screw head
  const ears = merge(EA.map((a) => tubeY(0.45, M4_HOLE, -0.4, 0, 0.03).translate(Math.cos(a) * ER, 0, Math.sin(a) * ER)));
  const seats = merge(EA.map((a) => tubeY(mm(4.6), M4_HOLE, -0.44, -0.4, 0.015).translate(Math.cos(a) * ER, 0, Math.sin(a) * ER)));
  const cov = merge([latheY([[-0.55, 0], [-0.55, 1.25], [-0.4, 1.5], [0, 1.6], [0, 0]].reverse().map(([y, r]) => [y, r]).reverse()), ears, cylY(0.35, -0.85, -0.5)]);
  A.add(part([PX, PY, PZ], mk(cov, cast), mk(seats, machined)), '27', {ex: [0, -3.4, 0], order: 0.15});
  const scr = fastenerY(mm(8), mm(3.5), mm(2), mm(2.6), 'cross').rotateX(Math.PI); // M4 x 8 (Keihin list)
  const PT = mm(1.2); // the plate's thickness
  A.add(part([PX, PY - 0.44, PZ], ...EA.map((a) => mk(scr.clone(), zinc, Math.cos(a) * ER, 0, Math.sin(a) * ER))), '4', {ex: [0, -5.0, 0], order: 0});
  // the stack under the bowl's pump housing: gasket 29 on the cover, diaphragm 28 on the gasket; both a little
  // wider than the cover and housing, so their black edges show between them
  // run 14: the gasket has its 3 screw ears, each with its hole (a little thinner than the ring so the faces do not fight)
  A.add(part([PX, PY, PZ], mk(merge([tubeY(1.72, 1.3, 0, 0.1), ...EA.map((a) => tubeY(0.45, M4_HOLE, 0.015, 0.085, 0.01).translate(Math.cos(a) * ER, 0, Math.sin(a) * ER))]), rubber)), '29', {ex: [0, -2.5, 0], order: 0.3});
  A.add(part([PX, PY - 0.5, PZ], mk(springY(0.75, 0.55, 0.06, 4), steel)), '30', {ex: [0, -1.7, 0], order: 0.35});
  const [dRub, dPlate] = diaphragmY(1.68, 0.05, 0.55); // run 14: membrane with a convolution, an edge bead and a steel centre plate on a stud
  A.add(part([PX, PY + 0.1, PZ], mk(dRub, rubber), mk(dPlate, steel)), '28', {ex: [0, -0.9, 0], order: 0.45});
  // 31 O-ring: run 9, seated on the bowl lobe's face beside the diaphragm, round the pump's outlet passage
  A.add(part([PX + 1.3, PYW - 0.06, PZ + 0.6], mk(oring(0.22, 0.06), rubber)), '31', {ex: [0.8, -0.3, 0.8], order: 0.5});
  // 45 PLATE (run 11, item 8): the owner's underside (mine_6) has 0 large guard plates, so the plate is a small
  // stamped strap, 9 wide and 14 long (run 27, correction 60: Keihin 209 is not this but the main jet's collar, jets.js): under the cover's cable-side ear (its screw through
  // it) out to the adjusting screw (8). Run 10's shield-shaped guard plate came from a listing photo, another carburetor.
  const EAR = [PX + Math.cos(EA[2]) * ER, PZ + Math.sin(EA[2]) * ER], SR = mm(4.5);
  const dv = [ADJ[0] - EAR[0], ADJ[1] - EAR[1]], dl = Math.hypot(...dv), d = [dv[0] / dl, dv[1] / dl], nrm = [-d[1], d[0]];
  const c = (p, s, t) => [p[0] + d[0] * s + nrm[0] * t, p[1] + d[1] * s + nrm[1] * t];
  const STRAP = [c(EAR, -SR, -SR), c(ADJ, SR, -SR), c(ADJ, SR, SR), c(EAR, -SR, SR)];
  const strapS = rpoly(STRAP, SR * 0.9);
  strapS.holes.push(circ(EAR[0], EAR[1], M4_HOLE), circ(ADJ[0], ADJ[1], M3_HOLE)); // run 14: the cover's screw through the ear end, the adjusting screw (8) through the far end
  const strap = extrudeXY(strapS, PT, 0.03, 10, {free: true}).rotateX(Math.PI / 2);
  // (on its seat: on the ear's top, against the bowl lobe's face, the cover screw through both)
  A.add(part([0, PY + PT / 2, 0], mk(strap, steel)), '45', {ex: [0, -4.2, -0.6], order: 0.2, axis: [0, -1, 0]});
  // 8 adjusting screw up through the plate's ear into the lobe, a knurled head under it, washers 6 and 7 between
  const yb = PY; // the plate's underside (run 11: it sits on the cover ear's top)
  const adj = fastenerY(1.0, 0.3, 0.13, 0.32, 'hex').rotateX(Math.PI);
  A.add(part([ADJ[0], yb - 0.16, ADJ[1]], mk(adj, steel)), '8', {ex: [0, -3.6, 0], order: 0.1, axis: [0, -1, 0]});
  A.add(part([ADJ[0], yb, ADJ[1]], mk(tubeY(0.3, 0.14, -0.08, 0), steel)), '6', {ex: [0, -2.8, 0], order: 0.12, axis: [0, -1, 0]});
  A.add(part([ADJ[0], yb - 0.08, ADJ[1]], mk(tubeY(0.26, 0.14, -0.08, 0), steel)), '7', {ex: [0, -2.2, 0], order: 0.14, axis: [0, -1, 0]});
  return A;
}
