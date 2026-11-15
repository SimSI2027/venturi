// 7 pilot-air: pilot air diaphragm cover (piece of reference 1), spring (79), diaphragm (78); out from its +Z face.
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, latheY, orient, springY, screwY, mk, part} from './kit.js';

export function buildPilotAir(index) {
  const A = new Asm('pilot-air', 'Pilot air', {offset: [1.0, -2.6, 6.0], index});
  const {cast, rubber, steel, zinc} = A.M;
  const Z = [0, 0, 1];
  // cover: a domed round cover with two screw ears and its screws
  const dome = orient(latheY([[0, 0], [0, 1.4], [0.18, 1.45], [0.35, 1.3], [0.6, 0.9], [0.7, 0.4], [0.7, 0]]), Z);
  const ears = merge([0, Math.PI].map((a) => orient(cylY(0.36, 0, 0.3), Z, [Math.cos(a + 0.5) * 1.55, Math.sin(a + 0.5) * 1.55, 0])));
  const scr = orient(screwY(0.8, 0.22, 0.12, 0.16), [0, 0, -1]);
  const screws = [0, Math.PI].map((a) => mk(scr.clone(), zinc, Math.cos(a + 0.5) * 1.55, Math.sin(a + 0.5) * 1.55, 0.32));
  A.add(part([1.6, -1.4, 3.15], mk(dome, cast), mk(ears, cast), ...screws), '1-pilot', {ex: [0, 0, 3.0], order: 0});
  A.add(part([1.6, -1.4, 3.2], mk(orient(springY(0.55, 0.45, 0.05, 4), Z), steel)), '79', {ex: [0, 0, 1.9], order: 0.2});
  // diaphragm: a rubber disc with a moulded rim and a brass-capped centre pin
  const disc = merge([orient(tubeY(1.3, 0.25, 0, 0.1), Z), orient(tubeY(1.38, 1.15, -0.05, 0.16), Z), orient(cylY(0.3, 0, 0.14), Z)]);
  A.add(part([1.6, -1.4, 3.05], mk(disc, rubber), mk(orient(cylY(0.1, -0.6, 0.25), Z), steel)), '78', {ex: [0, 0, 0.8], order: 0.4});
  return A;
}
