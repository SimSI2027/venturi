// 7 pilot-air: pilot air diaphragm cover (piece of reference 1), spring (79), diaphragm (78); out from its +Z face,
// mid height on the sensor side under the cover plate's cut corner (from the photo): round, 0.11 H across, a tab.
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, latheY, orient, springY, screwY, fastenerY, rbox, mk, part, M3_HOLE} from './kit.js';
import {SENS} from './body.js';

export function buildPilotAir(index) {
  const A = new Asm('pilot-air', 'Pilot air', {offset: [0, -1.0, 6.0], index, axis: [0, 0, 1]});
  const {cast, rubber, steel, zinc, machined} = A.M;
  const Z = [0, 0, 1];
  // cover: a domed round cover with two screw ears and its screws
  const dome = orient(latheY([[0, 0], [0, 1.4], [0.15, 1.45], [0.28, 1.3], [0.45, 0.9], [0.5, 0.4], [0.5, 0]]), Z); // run 9: 0.2 flatter, inside the 120.8 width
  // run 14 (item 4): each of the 2 ears has its through-hole (M3 screw, 3.4 mm) and a flat machined seat ring under the head
  const ears = merge([...[0, Math.PI].map((a) => orient(tubeY(0.4, M3_HOLE, 0, 0.3, 0.03), Z, [Math.cos(a + 0.5) * 1.55, Math.sin(a + 0.5) * 1.55, 0])), rbox(0.7, 1.0, 0.3, 0.2).translate(-0.9, -1.45, 0.15).rotateZ(0.5)]);
  const seats = merge([0, Math.PI].map((a) => orient(tubeY(0.3, M3_HOLE, 0.3, 0.34, 0.01), Z, [Math.cos(a + 0.5) * 1.55, Math.sin(a + 0.5) * 1.55, 0])));
  const scr = orient(fastenerY(0.8, 0.22, 0.12, 0.16, 'cross'), [0, 0, 1]); // run 9: heads out, shanks into the body (they pointed out)
  const screws = [0, Math.PI].map((a) => mk(scr.clone(), zinc, Math.cos(a + 0.5) * 1.55, Math.sin(a + 0.5) * 1.55, 0.34));
  const F = SENS + 0.22; // the boss face, level with the sensor housing's
  A.add(part([0, 2.2, F + 0.12], mk(dome, cast), mk(ears, cast), mk(seats, machined), ...screws), '1-pilot', {ex: [0, 0, 3.0], order: 0});
  A.add(part([0, 2.2, F + 0.15], mk(orient(springY(0.42, 0.45, 0.05, 4), Z), steel)), '79', {ex: [0, 0, 1.9], order: 0.2});
  // diaphragm: a rubber disc on the body's face (z 3.05), its moulded rim wider than the face and the cover so
  // its black edge shows between them; a brass-capped centre pin
  const disc = merge([orient(tubeY(1.3, 0.25, 0, 0.1), Z), orient(tubeY(1.55, 1.15, 0, 0.12), Z), orient(cylY(0.3, 0, 0.14), Z)]);
  A.add(part([0, 2.2, F], mk(disc, rubber), mk(orient(cylY(0.1, -0.6, 0.25), Z), steel)), '78', {ex: [0, 0, 0.8], order: 0.4});
  return A;
}
