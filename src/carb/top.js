// 4 top: carburetor top cover (piece of reference 1), its gasket (2) and bolts (3). Comes off upward.
import {Asm} from '../lib/asm.js';
import {rbox, merge, cylY, screwY, mk, part} from './kit.js';
import {TOWER, slabY} from './body.js';

// run 8: the cover's plan (traced from carb_11: x, z, corner r), a rectangle 4.3 along the bore by 4.9 across (0.30 H,
// narrower than the body), a small rib bump on each long side and a bolt tab out of the middle of each end (26 points)
const COVER = [[-2.15, -2.45, 0.5], [-0.8, -2.45, 0.2], [-0.5, -2.55, 0.15], [0.5, -2.55, 0.15], [0.8, -2.45, 0.2], [2.15, -2.45, 0.5], [2.15, -0.75, 0.15],
  [2.4, -0.6, 0.15], [2.65, -0.45, 0.3], [2.7, 0, 0.45], [2.65, 0.45, 0.3], [2.4, 0.6, 0.15], [2.15, 0.75, 0.15], [2.15, 2.45, 0.5], [0.8, 2.45, 0.2],
  [0.5, 2.55, 0.15], [-0.5, 2.55, 0.15], [-0.8, 2.45, 0.2], [-2.15, 2.45, 0.5], [-2.15, 0.75, 0.15], [-2.4, 0.6, 0.15], [-2.65, 0.45, 0.3], [-2.7, 0, 0.45],
  [-2.65, -0.45, 0.3], [-2.4, -0.6, 0.15], [-2.15, -0.75, 0.15]];
const INNER = [[-1.75, -2.05], [1.75, -2.05], [1.75, 2.05], [-1.75, 2.05]];

export function buildTop(index) {
  const A = new Asm('top', 'Top', {offset: [0, 10, 0], index});
  const {cast, machined, rubber, steel} = A.M;
  // the cover: a flat lid in that plan with rounded edges, a raised plain panel in the middle (0 lettering), a vent
  // boss, the 2 bolt bosses on the end tabs (over the tower's bolt bosses, body.js)
  const {x0, x1, top} = TOWER;
  const cx = (x0 + x1) / 2;
  const E = [[-2.35, 0], [2.35, 0]];
  const lid = merge([
    slabY(COVER, 0.21, 0.42, null, 0.3),
    rbox(3.0, 0.32, 3.4, 0.22).translate(0, 0.52, 0),
    cylY(0.3, 0.4, 0.75).translate(1.25, 0, 1.5),
    ...E.map(([ex, ez]) => cylY(0.45, 0, 0.55).translate(ex, 0, ez)),
  ]);
  // the gasket (2) lies on the tower's top face and the cover sits on the gasket, so its black edge shows
  const cover = part([cx, top + 0.11, 0], mk(lid, cast), mk(slabY(INNER.map(([x, z]) => [x * 1.1, z * 1.1]), 0.02, 0.06, null, 0.4), machined));
  A.add(cover, '1-top', {ex: [0, 2.2, 0], order: 0.3});
  A.add(part([cx, top + 0.055, 0], mk(slabY(COVER, 0, 0.11, INNER, 0.3), rubber)), '2', {ex: [0, 0.6, 0], order: 0.6});
  const b = screwY(1.2, 0.36, 0.17, 0.26);
  A.add(part([cx, top + 0.66, 0], ...E.map(([ex, ez]) => mk(b.clone(), steel, ex, 0, ez))), '3', {ex: [0, 4.5, 0], order: 0});
  return A;
}
