// 11 jets: needle jet / main nozzle (17), spacer (piece of reference 1), main jet (20, the #100/#158 conflict),
// pilot jet #42 (18), starter jet #90 (19), accelerator jet (77). Inside the float chamber; they come off downward.
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, hexY, latheY, screwY, jetY, mk, part} from './kit.js';

export function buildJets(index) {
  const A = new Asm('jets', 'Jets', {offset: [8.0, -4.0, 0], index});
  const {brass, cast, machined} = A.M;
  const NX = -0.2;
  // 17 needle jet: long brass tube from the bore floor down, a hex near its foot
  A.add(part([NX, -1.95, 0], mk(merge([tubeY(0.28, 0.12, -1.5, 0), hexY(0.42, -1.85, -1.5), screwY(0.35, 0.3, 0.3, 0.01).translate(0, -1.85, 0)]), brass)), '17', {ex: [0, 0, 0], order: 0.3});
  // spacer under it (piece of reference 1)
  A.add(part([NX, -3.5, 0], mk(merge([tubeY(0.75, 0.5, -0.5, 0), tubeY(0.75, 0.32, -0.6, -0.5)]), machined)), '1-spacer', {ex: [0, -1.4, 0], order: 0.4});
  // 20 main jet: threads into the needle jet's foot
  A.add(part([NX, -3.95, 0], mk(merge([hexY(0.38, -0.35, 0), screwY(0.35, 0.24, 0.24, 0.01).rotateX(Math.PI)]), brass)), '20', {ex: [0, -2.4, 0], order: 0.2});
  // 18 pilot jet #42: long and slim, 19 starter jet #90, 77 accelerator jet
  A.add(part([1.2, -2.9, 0.4], mk(merge([jetY(1.4, 0.16), latheY([[-1.9, 0], [-1.9, 0.1], [-1.4, 0.1], [-1.4, 0]])]), brass)), '18', {ex: [1.8, 0, 0], order: 0.5});
  A.add(part([-1.7, -2.9, -0.8], mk(jetY(0.75, 0.17), brass)), '19', {ex: [-1.4, 0, 0], order: 0.6});
  A.add(part([-2.4, -3.1, 1.6], mk(jetY(0.5, 0.14), brass)), '77', {ex: [-2.2, -0.6, 0.6], order: 0});
  return A;
}
