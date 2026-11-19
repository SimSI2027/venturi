// 1 hoses (from the photos): drain pipe (71) and drain hose (72) with its clamp (75); two air vent hoses (57, 58) with clip (39);
// the cable-cover hose (68) with clip (69); fuel hose (73) with clips (74, 76). Each comes away from its fitting.
import {Asm} from '../lib/asm.js';
import {THREE, merge, cylY, tubeY, latheY, orient, hose, rbox, mk, part} from './kit.js';
import {BY, DRAIN, DRAIN_END} from './bowl.js';

/** A spring hose clip, run 14 (item 6): a wire ring round the hose (axis dir) with a small wire loop for the pliers. */
function clip(r, dir, p) {
  const band = new THREE.TorusGeometry(r + 0.06, 0.04, 10, 40).rotateX(Math.PI / 2);
  const ear = new THREE.TorusGeometry(0.11, 0.03, 8, 20).rotateX(Math.PI / 2).translate(r + 0.15, 0, 0);
  return orient(merge([band, ear]), dir, p);
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
  // (run 10: from the nipple where item 3's larger cover puts it, past the pump linkage, round the guard plate's fan)
  A.add(part([0, 0, 0], mk(hose([[0.21, -0.15, -4.73], [0.15, -1.3, -4.86], [-0.6, -3.8, -5.5], [-1.6, -6.5, -5.75], [-1.8, -10.0, -5.7]], 0.24, 0.12), vinyl)), '68', {ex: [2.5, -2.0, -6.0], order: 0.2});
  A.add(part([0, 0, 0], mk(clip(0.24, [0, -1, -0.1], [0.2, -0.55, -4.76]), zinc)), '69', {ex: [2.5, -1.2, -6.4], order: 0.15});
  // drain: steel pipe in the bowl's floor, the clear vinyl hose on it, a clamp holding the hose
  // (run 8: the drain nipple points down out of the belly's engine end, bowl.js DRAIN)
  // (run 10: the nipple under the deep floor, placed from the screws (item 5); the pipe angles out of it to its end
  // where carb_7 shows it (item 4), 16 long as the scale table has it)
  const p0 = [DRAIN[0], BY.deep - 0.3, DRAIN[1]], dv = DRAIN_END.map((v, i) => v - p0[i]), dl = Math.hypot(...dv);
  // run 14: a flange at the nipple end, 2 barbs and a chamfered mouth at the far end, bored through
  const pipe = latheY([[0, 0.11], [0, 0.26], [0.15, 0.26], [0.15, 0.16], [dl - 0.6, 0.16], [dl - 0.55, 0.21], [dl - 0.35, 0.21], [dl - 0.3, 0.16], [dl - 0.25, 0.21], [dl - 0.05, 0.21], [dl, 0.15], [dl, 0.11], [0, 0.11]], 28); // run 15: closed with the bore's wall, a hollow tube
  A.add(part(p0, mk(orient(pipe, dv), steel)), '71', {ex: [-4.0, -9.0, 2.0], order: 0.4});
  A.add(part([0, 0, 0], mk(hose([[-3.14, -8.48, 0.57], [-3.55, -8.86, 0.96], [-3.65, -9.9, 1.05], [-3.45, -11.3, 1.15]], 0.25), vinyl)), '72', {ex: [-4.0, -12.0, 2.0], order: 0.1});
  A.add(part([-3.64, -9.65, 1.04], mk(clip(0.27, [0, 1, 0], [0, 0, 0]), zinc)), '75', {ex: [7.6, -11.0, 4.0], order: 0}); // run 30 (item 14): formed wire, as clips 39 and 69 (was a plastic band)
  // fuel hose on the inlet elbow (on the bowl's sensor side), up and out toward the tank
  // (run 8: the inlet's top at y -1.53, z 5.6, bowl.js)
  // (overlay round 2: a short stub, the photos show the inlet bare)
  const fuel = hose([[1.0, -1.28, 6.6], [1.0, 0.02, 6.62], [1.2, 1.02, 6.9], [1.8, 1.72, 7.4]], 0.42, 0.22); // (run 10: on the inlet, 0.4 out, 0.22 up)
  A.add(part([0, 0, 0], mk(fuel, hm)), '73', {ex: [3.5, -4.0, 6.5], order: 0.3, axis: [0, 0, 1]});
  A.add(part([0, 0, 0], mk(clip(0.42, [0, 1, 0], [1.0, -0.98, 6.6]), zinc)), '74', {ex: [3.5, -5.2, 5.4], order: 0.2, axis: [0, 0, 1]});
  A.add(part([0, 0, 0], mk(clip(0.42, [0.2, 1, 0.3], [1.15, 0.82, 6.85]), zinc)), '76', {ex: [3.9, -2.8, 6.5], order: 0.25, axis: [0, 0, 1]});
  return A;
}
