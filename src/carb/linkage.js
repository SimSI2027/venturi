// 6 linkage, on the cable side (-Z), from the photo: the flat shield-shaped throttle cable cover (65) with gasket (66), seal (67) and 2 bolts (70);
// throttle shaft screw (42, under the top cover); plates (40, 41); adjusting screw (44) and its spring (43).
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, springY, screwY, plateXY, rpoly, circ, extrudeXY, mk, part} from './kit.js';
import {SHIELD, CUPZ, inset, slabZ} from './body.js';

export function buildLinkage(index) {
  const A = new Asm('linkage', 'Linkage', {offset: [0, 1.0, -7.5], index, axis: [0, 0, -1]});
  const {cast, rubber, steel, brass, machined} = A.M;
  // 65 cable cover: 1 flat shield-shaped plate (0.5 H tall) over the throttle wheel and its return spring, the
  // cable boss at its top air-box corner; 2 raised pads for the socket-head bolts (70)
  const BOLTS = [[-2.15, 7.05], [0.45, -0.85]];
  const flat = slabZ(SHIELD, 0, 0.55, [], 0.3);
  const boss = orient(tubeY(0.42, 0.18, 0, 0.75), [0, 1, 0], [-2.2, 7.65, 0]);
  const pads = merge(BOLTS.map(([x, y]) => orient(cylY(0.55, 0, 0.12), [0, 0, -1], [x, y, -0.27])));
  const nip = tubeY(0.2, 0.1, -0.7, 0.1).translate(0.95, -1.25, 0); // the hose 68 nipple at the lobe's foot
  // the cable bracket (carb_7): a flat lug standing up off the cover's engine-end top corner to 0.08 H over the top
  // cover (y 9.43), a round hole near its top for the cable adjuster; outline in (z, y), extruded 0.5 along X
  const ls = rpoly([[5.65, 6.4, 0.2], [3.85, 6.4, 0.2], [3.85, 8.8, 0.5], [4.3, 9.43, 0.45], [5.2, 9.43, 0.45], [5.65, 8.8, 0.5]], 0.3);
  ls.holes.push(circ(4.75, 8.65, 0.42));
  const lug = extrudeXY(ls, 0.5, 0.08, 12, {free: true}).rotateY(Math.PI / 2).translate(-1.6, 0, -(CUPZ - 0.33)); // shape x -> -z
  A.add(part([0, 0, CUPZ - 0.33], mk(merge([flat, boss, pads, lug]), cast), mk(nip, brass)), '65', {ex: [0, 0, -1.8], order: 0.25});
  // 66 gasket under it, its rim a little proud of the cover so the black edge shows
  A.add(part([0, 0, CUPZ - 0.025], mk(slabZ(inset(SHIELD, -0.06), 0, 0.1, [inset(SHIELD, 0.35)], 0.3), rubber)), '66', {ex: [0, 0, -0.7], order: 0.4});
  // 67 seal: the rubber grommet where the cable enters the cover's boss
  A.add(part([-2.2, 8.4, CUPZ - 0.33], mk(merge([tubeY(0.36, 0.16, 0, 0.5), tubeY(0.46, 0.16, 0.38, 0.55)]), rubber)), '67', {ex: [0, 1.8, -1.8], order: 0.15});
  // 70 bolts (2): socket-head cap screws along +Z into the body, the hex socket dark in the head
  const sock = merge([cylY(0.38, 0, 0.36), screwY(1.6, 0.2, 0.2, 0.01)]);
  const bolt = orient(sock, [0, 0, -1]);
  const recess = orient(hexY(0.17, 0.3, 0.365), [0, 0, -1]);
  A.add(part([0, 0, CUPZ - 0.73], ...BOLTS.flatMap(([x, y]) => [mk(bolt.clone(), steel, x, y, 0), mk(recess.clone(), rubber, x, y, 0)])), '70', {ex: [0, 0, -3.4], order: 0});
  // 42 throttle shaft screw: holds the lift lever on the shaft, reached from the top
  A.add(part([0.2, 6.05, -1.6], mk(screwY(0.9, 0.24, 0.13, 0.18), steel)), '42', {ex: [0, 5.5, 4.5], order: 0.6, axis: [0, 1, 0]});
  // 40, 41 plates in the cable-side cup, under the cover
  A.add(part([0.6, 1.2, CUPZ + 0.45], mk(plateXY(1.7, 0.9, 0.14, 0.2, [[-0.5, 0, 0.15]]), machined)), '40', {ex: [0, -1.6, -1.2], order: 0.7});
  A.add(part([-0.9, 3.0, CUPZ + 0.45], mk(plateXY(1.0, 1.4, 0.14, 0.2, [[0, 0.3, 0.15]]), machined)), '41', {ex: [1.2, 1.2, -1.2], order: 0.7});
  // 44 adjusting screw (up into plate 40) and its spring 43, in the cup's lobe
  A.add(part([1.1, -0.3, CUPZ + 0.3], mk(merge([cylY(0.28, -0.35, 0), screwY(1.5, 0.13, 0.13, 0.01).rotateX(Math.PI)]), steel)), '44', {ex: [0, -3.6, -0.6], order: 0.5, axis: [0, -1, 0]});
  A.add(part([1.1, -0.1, CUPZ + 0.3], mk(springY(0.9, 0.22, 0.04, 6), steel)), '43', {ex: [0, -2.2, -0.6], order: 0.55, axis: [0, -1, 0]});
  return A;
}
