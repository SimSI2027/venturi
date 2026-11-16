// 12 mixture: pilot screw (49) from below at the engine end, with spring (50), washer (52), O-ring (51).
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, latheY, oring, springY, screwY, mk, part} from './kit.js';

export function buildMixture(index) {
  const A = new Asm('mixture', 'Mixture', {offset: [5.0, -4.0, 4.0], index, axis: [0, -1, 0]});
  const {brass, steel, rubber} = A.M;
  const X = 3.35;
  // 49 pilot screw: knurled head below, shank up into its boss, brass needle tip
  const head = merge([cylY(0.3, -4.15, -3.8), screwY(0.7, 0.14, 0.14, 0.01).rotateX(Math.PI).translate(0, -3.8, 0)]);
  const tip = latheY([[-3.1, 0.13], [-2.9, 0.09], [-2.7, 0.02], [-2.68, 0]].reverse().concat([[-3.1, 0]]).reverse());
  A.add(part([X, 0, 0], mk(head, steel), mk(tip, brass)), '49', {ex: [0, -3.2, 0], order: 0});
  A.add(part([X, -3.78, 0], mk(springY(0.42, 0.2, 0.035, 5), steel)), '50', {ex: [0.9, -2.0, 0], order: 0.2});
  A.add(part([X, -3.37, 0], mk(tubeY(0.24, 0.14, -0.05, 0.03), steel)), '52', {ex: [1.6, -1.2, 0], order: 0.3});
  A.add(part([X, -3.3, 0], mk(oring(0.17, 0.045), rubber)), '51', {ex: [2.3, -0.5, 0], order: 0.4});
  return A;
}
