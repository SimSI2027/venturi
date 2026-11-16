// 4 top: carburetor top cover (piece of reference 1), its gasket (2) and bolts (3). Comes off upward.
import {Asm} from '../lib/asm.js';
import {rbox, merge, cylY, screwY, gasketXZ, mk, part} from './kit.js';
import {TOWER} from './body.js';

export function buildTop(index) {
  const A = new Asm('top', 'Top', {offset: [0, 10, 0], index});
  const {cast, machined, rubber, steel} = A.M;
  // the cover (from the photos): a flat rectangular lid over the tower, 0.36 H across, a raised plain panel in the
  // middle (0 lettering), a vent boss at its front, two bolt ears at opposite corners
  const {x0, x1, z, top} = TOWER;
  const cx = (x0 + x1) / 2, w = x1 - x0 + 0.1, d = 2 * z + 0.1;
  const E = [[-w / 2 + 0.45, -z + 0.35], [w / 2 - 0.45, z - 0.35]];
  const lid = merge([
    rbox(w, 0.42, d, 0.16).translate(0, 0.21, 0),
    rbox(w - 1.1, 0.32, d - 1.6, 0.22).translate(0, 0.52, 0),
    cylY(0.3, 0.4, 0.75).translate(w / 2 - 0.6, 0, 0.6),
    ...E.map(([ex, ez]) => cylY(0.42, 0, 0.5).translate(ex, 0, ez)),
  ]);
  // the gasket (2) lies on the tower's top face and the cover sits on the gasket, so its black edge shows
  const cover = part([cx, top + 0.11, 0], mk(lid, cast), mk(rbox(w - 0.1, 0.1, d - 0.1, 0.04), machined, 0, 0.05, 0));
  A.add(cover, '1-top', {ex: [0, 2.2, 0], order: 0.3});
  A.add(part([cx, top + 0.055, 0], mk(gasketXZ(w, d - 0.1, 0.35, 0.11, 0.5), rubber)), '2', {ex: [0, 0.6, 0], order: 0.6});
  const b = screwY(1.2, 0.36, 0.17, 0.26);
  A.add(part([cx, top + 0.61, 0], ...E.map(([ex, ez]) => mk(b.clone(), steel, ex, 0, ez))), '3', {ex: [0, 4.5, 0], order: 0});
  return A;
}
