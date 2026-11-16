// 1 hoses (from the photos): drain pipe (71) and drain hose (72) with its clamp (75); two air vent hoses (57, 58) with clip (39);
// the cable-cover hose (68) with clip (69); fuel hose (73) with clips (74, 76). Each comes away from its fitting.
import {Asm} from '../lib/asm.js';
import {THREE, merge, cylY, tubeY, orient, hose, rbox, mk, part} from './kit.js';

/** A spring hose clip: a band round the hose (axis dir) with two tabs. */
function clip(r, dir, p) {
  const band = new THREE.TorusGeometry(r + 0.05, 0.05, 6, 28).rotateX(Math.PI / 2);
  const tabs = merge([rbox(0.12, 0.12, 0.5, 0.04).translate(r + 0.05, 0, 0.12), rbox(0.12, 0.12, 0.5, 0.04).translate(r + 0.05, 0, -0.12)]);
  return orient(merge([band, tabs]), dir, p);
}

export function buildHoses(index) {
  const A = new Asm('hoses', 'Hoses', {offset: [0, -1.0, 0], index, axis: [0, -1, 0]});
  const {hose: hm, vinyl, steel, zinc, plastic} = A.M;
  // 2 air vent hoses (from the photos), each about 1.5 H long: from the 2 nipples on the tower's engine face up in a
  // loop over the top cover, crossing, then down in front of the engine spigot to below the bowl
  const NX = 2.45, NY = 6.6; // run 8: the top 1.2 lower
  // (run 8 overlays: the 2 hoses loop back over the top cover and hang down the cable side, outside the cable cover,
  // as carb_7, carb_8 and carb_3 show, not down the air-box end)
  // (overlay round 2: taped together over the top, one on the other, down the air-box face of the cable housing to
  // the cable side, ending a little under the bowl)
  // (run 10: round the air-box face of the larger, raised cable housing, which reaches x 3.9)
  const v1 = hose([[NX, NY, 1.6], [2.9, 7.2, 1.7], [2.4, 9.6, 1.3], [1.6, 10.3, -0.4], [2.9, 9.9, -2.4], [4.3, 7.9, -4.4], [4.0, 5.0, -5.75], [2.6, 1.0, -5.75], [2.0, -4.0, -5.7], [2.0, -9.2, -5.7]], 0.32, 0.17);
  const v2 = hose([[NX, NY, -1.6], [2.9, 7.2, -1.5], [2.3, 9.1, -0.9], [1.7, 9.7, -0.5], [3.1, 9.3, -2.5], [4.5, 7.3, -4.6], [4.3, 4.6, -6.4], [3.1, 1.0, -6.4], [2.7, -4.0, -6.3], [2.7, -9.8, -6.3]], 0.32, 0.17);
  A.add(part([0, 0, 0], mk(v1, hm)), '57', {ex: [6.0, 1.0, 0], order: 0.1, axis: [1, 0, 0]});
  A.add(part([0, 0, 0], mk(v2, hm)), '58', {ex: [8.0, 1.0, 0], order: 0.15, axis: [1, 0, 0]});
  A.add(part([0, 0, 0], mk(clip(0.32, [1, 0.6, 0], [2.75, 6.8, 1.6]), zinc)), '39', {ex: [5.0, 1.6, 0], order: 0.05, axis: [1, 0, 0]});
  // the cable cover's hose (vinyl, from the photos): from the nipple at the cover's foot down the cable side,
  // out round the pump lobe, to below the bowl
  // (run 8: from the nipple on the smaller, turned cover, linkage.js; clear of the pump cover's ears)
  A.add(part([0, 0, 0], mk(hose([[-0.1, -0.45, -4.73], [-0.1, -1.6, -4.88], [-0.6, -3.8, -5.55], [-1.1, -6.5, -5.85], [-1.0, -10.0, -5.8]], 0.24, 0.12), vinyl)), '68', {ex: [2.5, -2.0, -6.0], order: 0.2});
  A.add(part([0, 0, 0], mk(clip(0.24, [0, -1, -0.1], [-0.1, -0.85, -4.76]), zinc)), '69', {ex: [2.5, -1.2, -6.4], order: 0.15});
  // drain: steel pipe in the bowl's floor, the clear vinyl hose on it, a clamp holding the hose
  // (run 8: the drain nipple points down out of the belly's engine end, bowl.js DRAIN)
  A.add(part([-3.37, -7.4, 0.3], mk(tubeY(0.16, 0.09, -1.47, 0.2), steel)), '71', {ex: [-4.0, -9.0, 2.0], order: 0.4});
  A.add(part([0, 0, 0], mk(hose([[-3.37, -8.55, 0.3], [-3.37, -9.9, 0.35], [-3.2, -11.5, 0.5]], 0.25), vinyl)), '72', {ex: [-4.0, -12.0, 2.0], order: 0.1});
  A.add(part([-3.39, -9.9, 0.33], mk(merge([new THREE.TorusGeometry(0.33, 0.07, 6, 24).rotateX(Math.PI / 2), rbox(0.6, 0.3, 0.2, 0.06).translate(0.55, 0, 0)]), plastic)), '75', {ex: [7.6, -11.0, 4.0], order: 0});
  // fuel hose on the inlet elbow (on the bowl's sensor side), up and out toward the tank
  // (run 8: the inlet's top at y -1.53, z 5.6, bowl.js)
  // (overlay round 2: a short stub, the photos show the inlet bare)
  const fuel = hose([[1.0, -1.5, 6.2], [1.0, -0.2, 6.22], [1.2, 0.8, 6.5], [1.8, 1.5, 7.0]], 0.42, 0.22); // (run 9: on the moved inlet)
  A.add(part([0, 0, 0], mk(fuel, hm)), '73', {ex: [3.5, -4.0, 6.5], order: 0.3, axis: [0, 0, 1]});
  A.add(part([0, 0, 0], mk(clip(0.42, [0, 1, 0], [1.0, -1.2, 6.2]), zinc)), '74', {ex: [3.5, -5.2, 5.4], order: 0.2, axis: [0, 0, 1]});
  A.add(part([0, 0, 0], mk(clip(0.42, [0.2, 1, 0.3], [1.15, 0.6, 6.45]), zinc)), '76', {ex: [3.9, -2.8, 6.5], order: 0.25, axis: [0, 0, 1]});
  return A;
}
