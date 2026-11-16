// 8 pump: accelerator pump on the float chamber's underside, cable side (from the photos). Cover (27) with screws
// (4) and gasket (29), spring (30), diaphragm (28), O-ring (31); the link lever plate (45) with the pump rod running
// up the cable side to it, the timing adjusting screw (8) and its washers (6, 7) on the plate.
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, hexY, latheY, orient, oring, springY, screwY, plateXY, rbox, mk, part} from './kit.js';
import {BOWL, PUMP} from './bowl.js';

const [PX, PZ] = PUMP, PY = BOWL.y0 - 0.35; // pump axis under the bowl (the lobe's face at PY + 0.2)

export function buildPump(index) {
  const A = new Asm('pump', 'Pump', {offset: [0, -9.0, -3.0], index, axis: [0, -1, 0]});
  const {cast, rubber, steel, zinc, machined} = A.M;
  // 27 cover: a shallow round cover with three screw ears and the rod boss
  const ears = merge([0, 2.1, 4.2].map((a) => cylY(0.32, -0.4, 0).translate(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5)));
  const cov = merge([latheY([[-0.55, 0], [-0.55, 1.1], [-0.4, 1.32], [0, 1.4], [0, 0]].reverse().map(([y, r]) => [y, r]).reverse()), ears, cylY(0.35, -0.85, -0.5)]);
  A.add(part([PX, PY, PZ], mk(cov, cast)), '27', {ex: [0, -3.4, 0], order: 0.15});
  const scr = screwY(0.9, 0.2, 0.11, 0.14).rotateX(Math.PI);
  A.add(part([PX, PY - 0.42, PZ], ...[0, 2.1, 4.2].map((a) => mk(scr.clone(), zinc, Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5))), '4', {ex: [0, -5.0, 0], order: 0});
  // the stack under the bowl's pump housing (its face at PY + 0.2): gasket 29 on the cover, diaphragm 28 on the
  // gasket; both a little wider than the cover and housing, so their black edges show between them
  A.add(part([PX, PY, PZ], mk(tubeY(1.52, 1.1, 0, 0.1), rubber)), '29', {ex: [0, -2.5, 0], order: 0.3});
  A.add(part([PX, PY - 0.5, PZ], mk(springY(0.75, 0.55, 0.06, 4), steel)), '30', {ex: [0, -1.7, 0], order: 0.35});
  A.add(part([PX, PY + 0.1, PZ], mk(merge([tubeY(1.52, 0.2, 0, 0.1), cylY(0.32, -0.2, 0.15)]), rubber)), '28', {ex: [0, -0.9, 0], order: 0.45});
  // 31 O-ring: round the rod boss under the cover
  A.add(part([PX, PY - 0.6, PZ], mk(oring(0.4, 0.06), rubber)), '31', {ex: [0.8, -0.3, 0.8], order: 0.5});
  // 45 link lever plate at the foot of the cable cover, with the pump rod running down the cable side through the
  // bowl's guide to the diaphragm; 8 adjusting screw through the plate's end with washers 6, 7
  const RX = -0.4, RZ = PZ - 0.3, RY = -0.9;
  A.add(part([RX, RY, RZ], mk(merge([rbox(1.9, 0.7, 0.18, 0.06).translate(0.55, 0, -0.35), cylY(0.12, PY + 0.05 - RY, 0.1)]), machined)), '45', {ex: [0, 1.2, -2.4], order: 0.55, axis: [0, 0, -1]});
  const sx = RX + 1.0, sy = RY + 0.55, sz = RZ - 0.35; // the head 0.2 above the plate, the 2 washers under it
  const adj = merge([screwY(1.2, 0.13, 0.13, 0.01), cylY(0.3, 0, 0.32)]);
  A.add(part([sx, sy, sz], mk(adj, steel)), '8', {ex: [0, 3.6, -3.0], order: 0.6, axis: [0, 1, 0]});
  A.add(part([sx, sy, sz], mk(tubeY(0.3, 0.14, -0.08, 0), steel)), '6', {ex: [0, 2.8, -3.0], order: 0.65, axis: [0, 1, 0]});
  A.add(part([sx, sy - 0.08, sz], mk(tubeY(0.26, 0.14, -0.08, 0), steel)), '7', {ex: [0, 2.2, -3.0], order: 0.7, axis: [0, 1, 0]});
  return A;
}
