// 3 starters (from the photos), both on the engine side of the tower (carb_7): the cold start set out along +Z (plunger 32
// with its black mushroom knob, spring 33, seal 34, O-ring 35) and the hot start set in the vertical boss (plunger
// 53, springs 56 and 64, black knurled cap 54 on top).
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, hexY, latheY, orient, oring, springY, ringsUp, mk, part} from './kit.js';
import {STARTER} from './body.js';
import {knurlX} from '../lib/geo.js';

export function buildStarters(index) {
  const A = new Asm('starters', 'Starters', {offset: [-1.5, 1.0, 3.0], index, axis: [0, 0, 1]});
  const {steel, brass, rubber, plastic, machined} = A.M;
  const Z = [0, 0, 1];
  // run 8 (carb_7): both on the tower's engine face (body.js STARTER). Cold start: the plunger along +Z out of the
  // cast side arm (face z 3.6), its black boot, a short steel stem and the black mushroom pull knob 1.6 across, the
  // arm 0.15 H from the hot start boss to the knob's end
  const {x: CX, armY: CY, face: CF} = STARTER;
  const pl = merge([
    orient(latheY([[-1.1, 0], [-1.1, 0.16], [-0.95, 0.2], [0, 0.2], [0, 0]]), Z), // run 15: the boot covers only the knob end, the stem shows below it
    orient(latheY([[0, 0], [0, 0.36], [0.16, 0.4], [0.24, 0.7], [0.4, 0.8], [0.55, 0.72], [0.62, 0.46], [0.64, 0]]), Z),
  ]);
  // run 15 (item 7): the stem has a tapered tip, 6 thread rings above it, and an O-ring groove under the knob (the seat of 35)
  const th = ringsUp(-2.15, -1.55, 0.17);
  const stem = latheY([[-2.65, 0], [-2.62, 0.07], [-2.2, 0.17], ...th.pts, [th.end, 0.17], [-1.4, 0.17], [-1.4, 0.12], [-1.25, 0.12], [-1.25, 0.17], [-0.05, 0.17], [-0.05, 0]], 24);
  A.add(part([CX, CY, CF + 0.75], mk(pl, plastic), mk(orient(stem, Z), steel)), '32', {ex: [0, 0, 5.0], order: 0.2});
  A.add(part([CX, CY, CF - 1.0], mk(orient(springY(0.9, 0.24, 0.05, 6), Z), steel)), '33', {ex: [0, 0, 3.4], order: 0.3});
  A.add(part([CX, CY, CF - 0.05], mk(orient(merge([tubeY(0.4, 0.2, 0, 0.25), tubeY(0.3, 0.2, 0.25, 0.45)]), Z), rubber)), '34', {ex: [0, 0, 2.2], order: 0.4});
  A.add(part([CX, CY, CF + 0.66], mk(oring(0.23, 0.06).rotateX(Math.PI / 2), rubber)), '35', {ex: [0, 0, 1.1], order: 0.5});
  // hot start: plunger and springs inside the vertical boss, the black knurled cap screwed on top (boss and cap 0.20 H)
  const {x: HX, z: HZ, top: HT} = STARTER;
  A.add(part([HX, HT - 0.05, HZ], mk(merge([knurlX(0, 0.5, 0.74, 28, 0.045, 0.06).rotateZ(Math.PI / 2), cylY(0.55, 0.45, 0.6), tubeY(0.18, 0.08, 0.6, 0.8)]), plastic)), '54', {ex: [0, 6.2, 0], order: 0, axis: [0, 1, 0]});
  A.add(part([HX, HT - 0.9, HZ], mk(springY(0.9, 0.3, 0.05, 6), steel)), '64', {ex: [0, 5.0, 0], order: 0.15, axis: [0, 1, 0]});
  A.add(part([HX, HT - 0.8, HZ], mk(springY(0.7, 0.16, 0.035, 6), steel)), '56', {ex: [0, 4.0, 0], order: 0.25, axis: [0, 1, 0]});
  const HP = ringsUp(0.95, 1.37, 0.12); // run 15 (item 7): the 53 plunger has a seat cone, an O-ring groove and thread rings
  A.add(part([HX, HT - 1.4, HZ], mk(latheY([[-0.2, 0], [-0.2, 0.18], [0, 0.26], [0.1, 0.26], [0.1, 0.2], [0.25, 0.2], [0.25, 0.26], [0.4, 0.26], [0.4, 0.12], [0.9, 0.12], ...HP.pts, [HP.end, 0.12], [1.4, 0.12], [1.4, 0]]), brass), mk(cylY(0.2, -0.32, -0.18), rubber)), '53', {ex: [0, 2.7, 0], order: 0.35, axis: [0, 1, 0]});
  return A;
}
