// 12 mixture: pilot screw (49) with spring (50), washer (52), O-ring (51).
// Run 27 (item 5, under_1 labelled): the screw lies along the bore axis at the underside and enters at the engine end (-X), through the bored
// boss in the flange's end wall (body.js), its brass tip in the underside's pocket toward the pilot jet; it comes off toward the engine.
import {Asm} from '../lib/asm.js';
import {UY, PSY} from './body.js';
import {merge, tubeY, latheY, oring, springY, fastenerY, orient, lift, mk, part, mm} from './kit.js';

export function buildMixture(index) {
  const A = new Asm('mixture', 'Mixture', {offset: [-5.0, -2.0, 0], index, axis: [-1, 0, 0]});
  const {brass, steel, rubber} = A.M;
  const X = -3.75, Y = PSY - UY; // the head's bearing face on the boss's end (x -3.75..-3.2); pre-lift height
  const IN = [1, 0, 0]; // into the body
  // 49 pilot screw: a slotted head, a threaded shank and a brass needle tip tapering over 8 mm from 2.8 mm to 0.8 mm across (run 15)
  const head = fastenerY(0.45, 0.3, 0.14, 0.25, 'slot').rotateX(Math.PI);
  const tip = latheY([[0.45, 0], [0.45, 0.13], [0.45 + mm(8), mm(0.4)], [0.45 + mm(8) + 0.012, 0]]);
  A.add(part([X, Y, 0], mk(orient(head, IN), steel), mk(orient(tip, IN), brass)), '49', {ex: [-3.2, 0, 0], order: 0});
  // inside the boss's bore, in fitting order: the spring round the shank, the washer, the O-ring at the bottom
  A.add(part([X + 0.02, Y, 0], mk(orient(springY(0.38, 0.13, 0.03, 5), IN), steel)), '50', {ex: [-2.4, -0.6, 0], order: 0.2});
  A.add(part([X + 0.42, Y, 0], mk(orient(tubeY(0.15, 0.08, 0, 0.05), IN), steel)), '52', {ex: [-1.8, -1.0, 0], order: 0.3});
  A.add(part([X + 0.5, Y, 0], mk(orient(oring(0.12, 0.04), IN), rubber)), '51', {ex: [-1.2, -1.4, 0], order: 0.4});
  return lift(A, UY);
}
