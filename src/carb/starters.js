// 3 starters: the cold start set on the +Z side (plunger 32, spring 33, seal 34, O-ring 35) and the hot start set
// on top (plunger 53, springs 56 and 64, cap 54).
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, hexY, latheY, orient, oring, springY, mk, part} from './kit.js';

export function buildStarters(index) {
  const A = new Asm('starters', 'Starters', {offset: [-1.5, 0.5, 3.0], index});
  const {steel, brass, rubber, plastic, machined} = A.M;
  const Z = [0, 0, 1];
  // cold start: plunger along +Z out of its boss, a black knob on the end
  const pl = merge([
    orient(latheY([[-2.2, 0], [-2.2, 0.16], [-1.6, 0.2], [0, 0.2], [0, 0]]), Z),
    orient(latheY([[0, 0], [0, 0.45], [0.1, 0.55], [0.75, 0.55], [0.85, 0.45], [0.85, 0]]), Z),
  ]);
  A.add(part([-2.4, -1.2, 4.35], mk(pl, plastic), mk(orient(cylY(0.21, -2.25, -0.05), Z), steel)), '32', {ex: [0, 0, 5.0], order: 0.2});
  A.add(part([-2.4, -1.2, 3.4], mk(orient(springY(0.9, 0.32, 0.05, 6), Z), steel)), '33', {ex: [0, 0, 3.4], order: 0.3});
  A.add(part([-2.4, -1.2, 3.35], mk(orient(merge([tubeY(0.4, 0.2, 0, 0.25), tubeY(0.3, 0.2, 0.25, 0.45)]), Z), rubber)), '34', {ex: [0, 0, 2.2], order: 0.4});
  A.add(part([-2.4, -1.2, 3.42], mk(oring(0.62, 0.06).rotateX(Math.PI / 2), rubber)), '35', {ex: [0, 0, 1.1], order: 0.5});
  // hot start: plunger and springs inside the top boss, the cap screwed on top
  A.add(part([2.1, 3.85, 1.6], mk(merge([hexY(0.66, 0, 0.35), cylY(0.5, 0.35, 0.8), tubeY(0.18, 0.08, 0.8, 1.2)]), machined)), '54', {ex: [0, 6.2, 0], order: 0});
  A.add(part([2.1, 3.0, 1.6], mk(springY(0.9, 0.3, 0.05, 6), steel)), '64', {ex: [0, 5.0, 0], order: 0.15});
  A.add(part([2.1, 3.1, 1.6], mk(springY(0.7, 0.16, 0.035, 6), steel)), '56', {ex: [0, 4.0, 0], order: 0.25});
  A.add(part([2.1, 2.5, 1.6], mk(merge([latheY([[-0.2, 0], [-0.2, 0.18], [0, 0.26], [0.4, 0.26], [0.4, 0.12], [1.4, 0.12], [1.4, 0]])]), brass), mk(cylY(0.2, -0.32, -0.18), rubber)), '53', {ex: [0, 2.7, 0], order: 0.35});
  return A;
}
