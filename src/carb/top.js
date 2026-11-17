// 4 top: carburetor top cover (piece of reference 1), its gasket (2) and bolts (3). Comes off upward.
// Run 14 (item 2, cmp_5): rebuilt from scratch: a rounded cap (one outline with a bolt ear at each of its 2 short ends), a
// raised centre panel, 0 lettering. Each ear has a 4.5 mm through-hole with a flat machined seat round it; the 2 M4
// hex-socket cap bolts (3) pass through them into the 2 threaded bosses in the tower (body.js).
import {Asm} from '../lib/asm.js';
import {merge, cylY, tubeY, mk, part, mm, fastenerY, slabHolesY} from './kit.js';
import {TOWER, BOLT_X} from './body.js';

// the cap's plan (x along the bore, z across; corner radius): a rounded rectangle 4.0 x 4.9 with a narrow ear out of the
// middle of each short end, the ear holding the bolt hole (x +/- BOLT_X from the cover's centre)
// run 16 (item 7, lines 4 and 49): each ear 1.7 wide (was 1.36) and out to 3.05 (was 2.9), so the air-box bolt lug reads from the air-box side
const CAP = [[-2.0, -2.45, 0.55], [2.0, -2.45, 0.55], [2.0, -0.85, 0.2], [3.05, -0.85, 0.45], [3.05, 0.85, 0.45], [2.0, 0.85, 0.2], [2.0, 2.45, 0.55], [-2.0, 2.45, 0.55], [-2.0, 0.85, 0.2],
  [-3.05, 0.85, 0.45], [-3.05, -0.85, 0.45], [-2.0, -0.85, 0.2]];
const HOLE_R = mm(2.25); // 4.5 mm through-hole
const HOLES = [-BOLT_X, BOLT_X].map((x) => [x, 0, HOLE_R]);
const INNER = [[-1.75, -2.05], [1.75, -2.05], [1.75, 2.05], [-1.75, 2.05]];
const CAP_T = 0.5, SEAT_T = 0.05;

export function buildTop(index) {
  const A = new Asm('top', 'Top', {offset: [0, 10, 0], index});
  const {cast, machined, rubber, steel} = A.M;
  const {x0, x1, top} = TOWER;
  const cx = (x0 + x1) / 2;
  // the cap 0..CAP_T high with its 2 through-holes, a raised centre panel on it with rounded corners (0.5 high)
  const lid = merge([
    slabHolesY(CAP, CAP_T / 2, CAP_T, HOLES, 0.4, 0.12),
    slabHolesY([[-1.65, -2.1], [1.65, -2.1], [1.65, 2.1], [-1.65, 2.1]], CAP_T + 0.19, 0.42, [], 0.8, 0.14),
  ]);
  // the flat seat round each hole: a machined washer face, SEAT_T proud of the ear's top, the hole through it
  const seats = merge(HOLES.map(([x]) => tubeY(mm(4.6), HOLE_R, CAP_T - 0.06, CAP_T + SEAT_T, 0.015).translate(x, 0, 0)));
  // the machined mating face under the cap (inside the gasket's opening)
  const face = slabHolesY(INNER.map(([x, z]) => [x * 1.1, z * 1.1]), 0.02, 0.06, [], 0.4, 0.04);
  const cover = part([cx, top + 0.11, 0], mk(lid, cast), mk(merge([seats, face]), machined));
  A.add(cover, '1-top', {ex: [0, 2.2, 0], order: 0.3});
  // the gasket (2) lies on the tower's top face under the cap, its black edge showing; the 2 bolt holes in its ears
  A.add(part([cx, top + 0.055, 0], mk(slabHolesY(CAP, 0.055, 0.11, HOLES, 0.4, 0.04), rubber)), '2', {ex: [0, 0.6, 0], order: 0.6});
  // 3 bolts: M4 hex-socket cap bolts, head on the seat, the thread down through the ear, the gasket and into the boss
  const b = fastenerY(mm(16), mm(3.5), mm(2), mm(4), 'hex');
  A.add(part([cx, top + 0.11 + CAP_T + SEAT_T, 0], ...HOLES.map(([x]) => mk(b.clone(), steel, x, 0, 0))), '3', {ex: [0, 4.5, 0], order: 0});
  return A;
}
