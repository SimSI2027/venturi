// 11 jets: needle jet / main nozzle (17), spacer and main jet #158 (pieces of reference 1), pilot jet #42 (18),
// starter jet #90 (19), accelerator jet (77) inside the float chamber, coming off downward; and the #100 jet (20),
// the pilot air jet, in the bell mouth.
import {Asm} from '../lib/asm.js';
import {UY} from './body.js';
import {merge, cylY, tubeY, hexY, latheY, screwY, jetY, orient, lift, mk, part} from './kit.js';

export function buildJets(index) {
  const A = new Asm('jets', 'Jets', {offset: [8.0, -4.0, 0], index});
  const {brass, cast, machined} = A.M;
  const NX = -0.2;
  // 17 needle jet: long brass tube from the bore floor down, a hex near its foot
  // (run 8: the underside 0.62 higher, so the needle jet is shorter: its foot still 0.27 into the spacer)
  A.add(part([NX, -1.95, 0], mk(merge([tubeY(0.28, 0.12, -0.85, 0), hexY(0.42, -1.1, -0.85), screwY(0.35, 0.3, 0.3, 0.01).translate(0, -1.1, 0)]), brass)), '17', {ex: [0, 0, 0], order: 0.3});
  // spacer under it (piece of reference 1)
  A.add(part([NX, -4.65, 0], mk(merge([tubeY(0.75, 0.5, -0.5, 0), tubeY(0.75, 0.32, -0.6, -0.5)]), machined)), '1-spacer', {ex: [0, -1.4, 0], order: 0.4});
  // main jet #158 (piece of reference 1: no reference of its own on this fiche): threads into the needle jet's foot
  A.add(part([NX, -5.1, 0], mk(merge([hexY(0.38, -0.35, 0), screwY(0.35, 0.24, 0.24, 0.01).rotateX(Math.PI)]), brass)), '1-mainjet', {ex: [0, -2.4, 0], order: 0.2});
  // 20 the #100 jet = pilot air jet: in the air-box spigot's floor (run 8: the air box is +X), screwed in along the
  // bore from the air-box end; it comes off toward +X
  A.add(part([4.0, -2.17, 0], mk(orient(jetY(0.65, 0.15, 0.22, 0.22), [1, 0, 0]), brass)), '20', {ex: [-2.0, 4.0, 0], order: 0.7, axis: [1, 0, 0]});
  // 18 pilot jet #42 (long and slim) and 19 starter jet #90: screwed up into their bosses under the body, hex at
  // the boss foot (body.js); 77 accelerator jet: hex up, in its boss in the bowl's corner (bowl.js)
  A.add(part([0.7, -5.0, 1.1], mk(merge([jetY(1.4, 0.16), latheY([[-1.9, 0], [-1.9, 0.1], [-1.4, 0.1], [-1.4, 0]])]).rotateX(Math.PI), brass)), '18', {ex: [1.8, 0, 0], order: 0.5});
  A.add(part([-1.7, -4.75, -0.8], mk(jetY(0.75, 0.17).rotateX(Math.PI), brass)), '19', {ex: [-1.4, 0, 0], order: 0.6});
  A.add(part([-2.7, -4.55, 2.4], mk(jetY(0.5, 0.14), brass)), '77', {ex: [-2.2, -0.6, 0.6], order: 0, axis: [0, 1, 0]});
  return lift(A, UY, ['17', '20']);
}
