// 6 linkage, on the cable side (-Z): throttle cable cover (65) with gasket (66), seal (67) and 2 bolts (70);
// throttle shaft screw (42, under the top cover); plates (40, 41); adjusting screw (44) and its spring (43).
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, orient, springY, screwY, boltY, plateXY, extrudeXY, rpoly, mk, part} from './kit.js';

export function buildLinkage(index) {
  const A = new Asm('linkage', 'Linkage', {offset: [0, 1.0, -7.5], index, axis: [0, 0, -1]});
  const {plastic, rubber, steel, zinc, machined} = A.M;
  // 65 cable cover: a deep rounded shell over the pulley, normal -Z, cable boss on top
  const outline = [[-2.1, -1.9], [2.6, -1.9, 0.8], [2.9, 1.0, 0.9], [1.9, 2.0, 0.9], [-2.0, 2.0, 0.6]];
  const shell = extrudeXY(rpoly(outline, 0.6), 1.3, 0.3, 10, {free: true});
  const boss = orient(tubeY(0.42, 0.18, 0, 1.0), [0, 1, 0], [1.3, 1.9, 0]);
  const ears = merge([cylY(0.45, -0.65, 0.65).rotateX(Math.PI / 2).translate(-1.6, 1.5, 0), cylY(0.45, -0.65, 0.65).rotateX(Math.PI / 2).translate(2.3, -1.4, 0)]);
  A.add(part([0.7, 2.3, -4.05], mk(shell, plastic), mk(boss, plastic), mk(ears, plastic)), '65', {ex: [0, 0, -1.8], order: 0.25});
  // 66 gasket under it
  const gs = rpoly(outline, 0.6);
  gs.holes.push(rpoly([[-1.7, -1.5], [2.2, -1.5], [2.4, 0.9], [1.6, 1.6], [-1.6, 1.6]], 0.4, new THREE.Path()));
  A.add(part([0.7, 2.3, -3.37], mk(extrudeXY(gs, 0.1, 0.03, 8, {free: true}), rubber)), '66', {ex: [0, 0, -0.7], order: 0.4});
  // 67 seal: the rubber grommet where the cable enters the cover
  A.add(part([2.0, 4.75, -4.05], mk(merge([tubeY(0.36, 0.16, 0, 0.5), tubeY(0.46, 0.16, 0.38, 0.55)]), rubber)), '67', {ex: [0, 1.8, -1.8], order: 0.15});
  // 70 bolts (2), along +Z into the body
  const bolt = orient(boltY(1.8, 0.36, 0.22), [0, 0, -1]);
  A.add(part([0, 0, -4.75], mk(bolt, zinc, 0.7 - 1.6, 2.3 + 1.5, 0), mk(bolt.clone(), zinc, 0.7 + 2.3, 2.3 - 1.4, 0)), '70', {ex: [0, 0, -3.4], order: 0});
  // 42 throttle shaft screw: holds the lift lever, reached from the top
  A.add(part([0.8, 3.95, -1.5], mk(screwY(0.9, 0.24, 0.13, 0.18), steel)), '42', {ex: [0, 5.5, 4.5], order: 0.6, axis: [0, 1, 0]});
  // 40, 41 plates on the cable side, under the cover
  A.add(part([-0.7, 0.75, -3.05], mk(plateXY(1.7, 0.9, 0.14, 0.2, [[-0.5, 0, 0.15]]), machined)), '40', {ex: [0, -1.6, -1.2], order: 0.7});
  A.add(part([2.4, 3.4, -3.05], mk(plateXY(1.0, 1.4, 0.14, 0.2, [[0, 0.3, 0.15]]), machined)), '41', {ex: [1.2, 1.2, -1.2], order: 0.7});
  // 44 adjusting screw (up into plate 40) and its spring 43, below the cover
  A.add(part([-1.2, -0.5, -3.3], mk(merge([cylY(0.28, -0.35, 0).translate(0, 0, 0), screwY(1.5, 0.13, 0.13, 0.01).rotateX(Math.PI)]), steel)), '44', {ex: [0, -3.6, -0.6], order: 0.5, axis: [0, -1, 0]});
  A.add(part([-1.2, -0.3, -3.3], mk(springY(0.9, 0.22, 0.04, 6), steel)), '43', {ex: [0, -2.2, -0.6], order: 0.55, axis: [0, -1, 0]});
  return A;
}
