// 4 top: carburetor top cover (piece of reference 1), its gasket (2) and bolts (3). Comes off upward.
import {Asm} from '../lib/asm.js';
import {rbox, merge, cylY, screwY, gasketXZ, mk, part} from './kit.js';

export function buildTop(index) {
  const A = new Asm('top', 'Top', {offset: [0, 9, 0], index});
  const {cast, machined, rubber, steel} = A.M;
  // the cover: a rounded lid over the slide tower with a raised centre and two bolt ears
  const lid = merge([
    rbox(3.4, 0.45, 6.7, 0.18).translate(0, 0.22, 0),
    rbox(2.4, 0.4, 5.0, 0.3).translate(0, 0.55, 0),
    cylY(0.42, 0, 0.5).translate(-1.15, 0, -2.85),
    cylY(0.42, 0, 0.5).translate(1.15, 0, 2.85),
  ]);
  const cover = part([-0.5, 4.45, 0], mk(lid, cast), mk(rbox(3.3, 0.1, 6.6, 0.04), machined, 0, 0.05, 0));
  A.add(cover, '1-top', {ex: [0, 2.2, 0], order: 0.3});
  A.add(part([-0.5, 4.42, 0], mk(gasketXZ(3.3, 6.5, 0.35, 0.1, 0.5), rubber)), '2', {ex: [0, 0.6, 0], order: 0.6});
  const b = screwY(1.2, 0.36, 0.17, 0.26);
  A.add(part([-0.5, 4.95, 0], mk(b, steel, -1.15, 0, -2.85), mk(b, steel, 1.15, 0, 2.85)), '3', {ex: [0, 4.5, 0], order: 0});
  return A;
}
