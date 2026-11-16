// 6 linkage, on the cable side (-Z), from the photo: the flat shield-shaped throttle cable cover (65) with gasket (66), seal (67) and 2 bolts (70);
// throttle shaft screw (42, under the top cover); plates (40, 41); adjusting screw (44) and its spring (43).
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, springY, screwY, plateXY, rpoly, circ, extrudeXY, mk, part} from './kit.js';
import {SHIELD, CUPZ, inset, slabZ, shieldXY, c3, clipY} from './body.js';

export function buildLinkage(index) {
  const A = new Asm('linkage', 'Linkage', {offset: [0, 1.0, -7.5], index, axis: [0, 0, -1]});
  const {cast, rubber, steel, brass, machined} = A.M;
  // 65 cable cover: 1 flat shield-shaped plate (0.5 H tall) over the throttle wheel and its return spring, the
  // cable boss at its top air-box corner; 2 raised pads for the socket-head bolts (70)
  // (run 8: everything fixed to the cover goes where shieldXY puts it, the cover 15% smaller and turned 20 degrees)
  // run 9 (carb_3): the 2 socket-head bolts at the upper engine-side corner and in the lobe; the hose nipple at the
  // lobe's foot; the cable boss along -X out of the shoulder's engine end, under the bracket
  const BOLTS = [c3(495, 160), c3(345, 445)];
  const [BX, BY] = [-2.55, 7.35], [NX, NY] = c3(415, 455);
  // the flat cover, and its wide rounded shoulder: the top part standing 0.2 further out with a soft edge
  const flat = slabZ(SHIELD, 0, 0.55, [], 0.3);
  const shoulder = slabZ(inset(clipY(SHIELD, 99, 4.6), 0.3), -0.3, 0.3, [], 0.5);
  const boss = orient(tubeY(0.42, 0.18, 0, 0.6), [-1, 0, 0], [BX, BY, 0]);
  const pads = merge(BOLTS.map(([x, y]) => orient(cylY(0.55, 0, 0.12), [0, 0, -1], [x, y, -0.27])));
  const nip = tubeY(0.2, 0.1, -0.7, 0.1).translate(NX, NY, 0); // the hose 68 nipple at the lobe's foot
  // the cable bracket (carb_7, carb_3): a thick lug behind the cover's top edge at its engine end, from the body out
  // to the cover's face, its top level with the cover's (0 slabs above the body), the hole for the cable adjuster;
  // outline in (-z, y), extruded 0.6 along X
  const ls = rpoly([[5.1, 5.0, 0.2], [3.45, 5.0, 0.2], [3.45, 7.55, 0.4], [3.75, 8.05, 0.3], [4.85, 8.05, 0.3], [5.1, 7.6, 0.35]], 0.3);
  ls.holes.push(circ(4.35, 6.75, 0.42));
  const lug = extrudeXY(ls, 0.6, 0.1, 12, {free: true}).rotateY(Math.PI / 2).translate(-2.95, 0, -(CUPZ - 0.33)); // shape x -> -z
  A.add(part([0, 0, CUPZ - 0.33], mk(merge([flat, shoulder, boss, pads, lug]), cast), mk(nip, brass)), '65', {ex: [0, 0, -1.8], order: 0.25});
  // 66 gasket under it, its rim a little proud of the cover so the black edge shows
  A.add(part([0, 0, CUPZ - 0.025], mk(slabZ(inset(SHIELD, -0.06), 0, 0.1, [inset(SHIELD, 0.35)], 0.3), rubber)), '66', {ex: [0, 0, -0.7], order: 0.4});
  // 67 seal: the rubber grommet where the cable enters the cover's boss
  A.add(part([BX - 0.6, BY, CUPZ - 0.33], mk(orient(merge([tubeY(0.36, 0.16, 0, 0.5), tubeY(0.46, 0.16, 0.38, 0.55)]), [-1, 0, 0]), rubber)), '67', {ex: [-1.8, 0, -1.8], order: 0.15, axis: [-1, 0, 0]});
  // 70 bolts (2): socket-head cap screws along +Z into the body, the hex socket dark in the head
  const sock = merge([cylY(0.38, 0, 0.36), screwY(1.6, 0.2, 0.2, 0.01)]);
  const bolt = orient(sock, [0, 0, -1]);
  const recess = orient(hexY(0.17, 0.3, 0.365), [0, 0, -1]);
  A.add(part([0, 0, CUPZ - 0.73], ...BOLTS.flatMap(([x, y]) => [mk(bolt.clone(), steel, x, y, 0), mk(recess.clone(), rubber, x, y, 0)])), '70', {ex: [0, 0, -3.4], order: 0});
  // 42 throttle shaft screw: holds the lift lever on the shaft, reached from the top
  A.add(part([0.2, 6.05, -1.6], mk(screwY(0.9, 0.24, 0.13, 0.18), steel)), '42', {ex: [0, 5.5, 4.5], order: 0.6, axis: [0, 1, 0]});
  // 40, 41 plates in the cable-side cup, under the cover
  A.add(part([...shieldXY(0.6, 1.2), CUPZ + 0.45], mk(plateXY(1.7, 0.9, 0.14, 0.2, [[-0.5, 0, 0.15]]), machined)), '40', {ex: [0, -1.6, -1.2], order: 0.7});
  A.add(part([...shieldXY(-0.9, 3.0), CUPZ + 0.45], mk(plateXY(1.0, 1.4, 0.14, 0.2, [[0, 0.3, 0.15]]), machined)), '41', {ex: [1.2, 1.2, -1.2], order: 0.7});
  // 44 adjusting screw (up into plate 40) and its spring 43, in the cup's lobe
  A.add(part([...shieldXY(1.1, -0.3), CUPZ + 0.3], mk(merge([cylY(0.28, -0.35, 0), screwY(1.5, 0.13, 0.13, 0.01).rotateX(Math.PI)]), steel)), '44', {ex: [0, -3.6, -0.6], order: 0.5, axis: [0, -1, 0]});
  A.add(part([...shieldXY(1.1, -0.1), CUPZ + 0.3], mk(springY(0.9, 0.22, 0.04, 6), steel)), '43', {ex: [0, -2.2, -0.6], order: 0.55, axis: [0, -1, 0]});
  return A;
}
