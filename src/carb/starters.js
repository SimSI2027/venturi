// 3 starters (from the photos), both on the air-box side of the tower: the cold start set out along +Z (plunger 32
// with its black mushroom knob, spring 33, seal 34, O-ring 35) and the hot start set in the vertical boss (plunger
// 53, springs 56 and 64, black knurled cap 54 on top).
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, hexY, latheY, orient, oring, springY, mk, part} from './kit.js';

export function buildStarters(index) {
  const A = new Asm('starters', 'Starters', {offset: [-1.5, 1.0, 3.0], index, axis: [0, 0, 1]});
  const {steel, brass, rubber, plastic, machined} = A.M;
  const Z = [0, 0, 1];
  // cold start: plunger along +Z out of its boss (face z 3.5), a black mushroom knob 0.07 H across well out
  const CX = -2.75, CY = 3.8, CF = 3.5;
  const pl = merge([
    orient(latheY([[-3.4, 0], [-3.4, 0.16], [-2.8, 0.2], [0, 0.2], [0, 0]]), Z),
    orient(latheY([[0, 0], [0, 0.32], [0.18, 0.34], [0.26, 0.62], [0.42, 0.7], [0.58, 0.62], [0.66, 0.4], [0.68, 0]]), Z),
  ]);
  A.add(part([CX, CY, CF + 1.9], mk(pl, plastic), mk(orient(cylY(0.21, -3.45, -0.05), Z), steel)), '32', {ex: [0, 0, 5.0], order: 0.2});
  A.add(part([CX, CY, CF], mk(orient(springY(0.9, 0.32, 0.05, 6), Z), steel)), '33', {ex: [0, 0, 3.4], order: 0.3});
  A.add(part([CX, CY, CF - 0.05], mk(orient(merge([tubeY(0.4, 0.2, 0, 0.25), tubeY(0.3, 0.2, 0.25, 0.45)]), Z), rubber)), '34', {ex: [0, 0, 2.2], order: 0.4});
  A.add(part([CX, CY, CF + 0.06], mk(oring(0.62, 0.06).rotateX(Math.PI / 2), rubber)), '35', {ex: [0, 0, 1.1], order: 0.5});
  // hot start: plunger and springs inside the vertical boss (top y 7.9), the black knurled cap screwed on top
  const HX = -2.75, HZ = 1.6, HT = 7.9;
  A.add(part([HX, HT - 0.05, HZ], mk(merge([cylY(0.66, 0, 0.5, 0.06, 16), cylY(0.5, 0.45, 0.6), tubeY(0.18, 0.08, 0.6, 1.0)]), plastic)), '54', {ex: [0, 6.2, 0], order: 0, axis: [0, 1, 0]});
  A.add(part([HX, HT - 0.9, HZ], mk(springY(0.9, 0.3, 0.05, 6), steel)), '64', {ex: [0, 5.0, 0], order: 0.15, axis: [0, 1, 0]});
  A.add(part([HX, HT - 0.8, HZ], mk(springY(0.7, 0.16, 0.035, 6), steel)), '56', {ex: [0, 4.0, 0], order: 0.25, axis: [0, 1, 0]});
  A.add(part([HX, HT - 1.4, HZ], mk(merge([latheY([[-0.2, 0], [-0.2, 0.18], [0, 0.26], [0.4, 0.26], [0.4, 0.12], [1.4, 0.12], [1.4, 0]])]), brass), mk(cylY(0.2, -0.32, -0.18), rubber)), '53', {ex: [0, 2.7, 0], order: 0.35, axis: [0, 1, 0]});
  return A;
}
