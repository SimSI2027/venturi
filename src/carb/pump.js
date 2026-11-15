// 8 pump: accelerator pump under the float chamber's bell-mouth end. Cover (27) with screws (4) and gasket (29),
// spring (30), diaphragm (28), O-ring (31); the link lever plate (45) up the bell-mouth face with the timing
// adjusting screw (8) and its washers (6, 7).
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, hexY, latheY, orient, oring, springY, screwY, plateXY, rbox, mk, part} from './kit.js';

const PX = -2.0, PY = -8.2; // pump axis under the bowl

export function buildPump(index) {
  const A = new Asm('pump', 'Pump', {offset: [-6.5, -9.0, 0], index});
  const {cast, rubber, steel, zinc, machined} = A.M;
  // 27 cover: a shallow round cover with three screw ears and the rod boss
  const ears = merge([0, 2.1, 4.2].map((a) => cylY(0.32, -0.4, 0).translate(Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5)));
  const cov = merge([latheY([[-0.55, 0], [-0.55, 1.1], [-0.4, 1.32], [0, 1.4], [0, 0]].reverse().map(([y, r]) => [y, r]).reverse()), ears, cylY(0.35, -0.85, -0.5)]);
  A.add(part([PX, PY, 0], mk(cov, cast)), '27', {ex: [0, -3.4, 0], order: 0.15});
  const scr = screwY(0.9, 0.2, 0.11, 0.14).rotateX(Math.PI);
  A.add(part([PX, PY - 0.42, 0], ...[0, 2.1, 4.2].map((a) => mk(scr.clone(), zinc, Math.cos(a) * 1.5, 0, Math.sin(a) * 1.5))), '4', {ex: [0, -5.0, 0], order: 0});
  A.add(part([PX, PY + 0.02, 0], mk(tubeY(1.38, 1.1, -0.05, 0.05), rubber)), '29', {ex: [0, -2.5, 0], order: 0.3});
  A.add(part([PX, PY - 0.5, 0], mk(springY(0.75, 0.55, 0.06, 4), steel)), '30', {ex: [0, -1.7, 0], order: 0.35});
  A.add(part([PX, PY + 0.08, 0], mk(merge([tubeY(1.3, 0.2, 0, 0.1), cylY(0.32, -0.2, 0.15)]), rubber)), '28', {ex: [0, -0.9, 0], order: 0.45});
  A.add(part([PX + 0.8, PY + 0.25, 0.5], mk(oring(0.18, 0.05), rubber)), '31', {ex: [0.8, -0.3, 0.8], order: 0.5});
  // 45 link lever plate up the bell-mouth face of the bowl; 8 adjusting screw at its top with washers 6, 7
  A.add(part([-3.45, -5.0, -1.9], mk(merge([rbox(0.16, 5.2, 0.7, 0.06), rbox(0.16, 0.8, 1.4, 0.06).translate(0, -2.4, 0.4)]), machined)), '45', {ex: [-2.4, 2.6, 0], order: 0.55});
  const sx = -3.75, sy = -2.6, sz = -1.9;
  const adj = orient(merge([screwY(1.4, 0.13, 0.13, 0.01), cylY(0.3, 0, 0.35)]), [-1, 0, 0]);
  A.add(part([sx, sy, sz], mk(adj, steel)), '8', {ex: [-4.6, 3.6, 0], order: 0.6});
  A.add(part([sx + 0.05, sy, sz], mk(orient(tubeY(0.3, 0.14, 0, 0.06), [1, 0, 0]), steel)), '6', {ex: [-3.6, 3.6, 0], order: 0.65});
  A.add(part([sx + 0.16, sy, sz], mk(orient(tubeY(0.26, 0.14, 0, 0.06), [1, 0, 0]), steel)), '7', {ex: [-3.0, 3.6, 0], order: 0.7});
  return A;
}
