// 9 bowl: the float chamber (piece of reference 1) with the pump housing and fuel inlet, its gasket (25),
// screws (5), drain plug (26), bottom plug (38) with O-ring (37). Comes off downward.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, oring, screwY, gasketXZ, extrudeXY, rpoly, mk, part} from './kit.js';

export const BOWL = {x0: -3.2, x1: 2.8, y0: -7.4, y1: -2.95, z: 2.9};

export function buildBowl(index) {
  const A = new Asm('bowl', 'Bowl', {offset: [0, -11.0, 0], index});
  const {cast, machined, rubber, steel, zinc, brass} = A.M;
  const {x0, x1, y0, y1, z} = BOWL;
  const cx = (x0 + x1) / 2, w = x1 - x0, h = y1 - y0;
  // open-top chamber: walls (an outline extruded down) and a floor
  const s = rpoly([[x0, -z], [x1, -z], [x1, z], [x0, z]], 0.9);
  s.holes.push(rpoly([[x0 + 0.3, -z + 0.3], [x0 + 0.3, z - 0.3], [x1 - 0.3, z - 0.3], [x1 - 0.3, -z + 0.3]], 0.6, new THREE.Path()));
  const walls = extrudeXY(s, h - 0.4, 0.1, 10, {free: true}).rotateX(Math.PI / 2).translate(0, y1 - (h - 0.4) / 2, 0);
  const floor = rbox(w, 0.5, 2 * z, 0.3).translate(cx, y0 + 0.25, 0);
  // screw ears at the four corners, the pump housing under the bell-mouth end, the bottom plug boss,
  // the fuel inlet nipple on the +Z side, the drain boss, the accelerator jet boss inside
  const ear = (x, zz) => cylY(0.5, y1 - 0.55, y1 - 0.02).translate(x, 0, zz);
  const g = merge([
    walls, floor,
    ear(x0 + 0.35, -z + 0.35), ear(x1 - 0.35, -z + 0.35), ear(x0 + 0.35, z - 0.35), ear(x1 - 0.35, z - 0.35),
    cylY(1.45, -8.0, y0 + 0.1).translate(-2.0, 0, 0), // pump housing: its face sits on the diaphragm (pump.js)
    cylY(0.95, y0 - 0.15, y0 + 0.3).translate(-0.2, 0, 0),
    cylY(0.38, y0 + 0.4, -3.2).translate(-2.5, 0, 2.2), // accelerator jet boss up the corner (jet 77 on top)
    cylY(0.45, y0 - 0.25, y0 + 0.3).translate(1.6, 0, 1.0),
    orient(cylY(0.5, 0, 0.35), [0, 0, 1], [2.3, -3.9, z - 0.1]),
    orient(cylY(0.45, 0, 0.3), [0, 0, -1], [0.8, -6.8, -z + 0.1]),
  ]);
  const inlet = orient(merge([tubeY(0.24, 0.13, 0, 1.0), tubeY(0.3, 0.13, 0.7, 0.85)]), [0, 0, 1], [2.3, -3.9, z + 0.2]);
  const face = rbox(w - 0.1, 0.08, 2 * z - 0.1, 0.04).translate(cx, y1 - 0.03, 0); // machined mating face
  A.add(part([0, 0, 0], mk(g, cast), mk(inlet, brass), mk(face, machined)), '1-bowl', {ex: [0, 0, 0], order: 0.3});
  A.add(part([cx, y1 + 0.05, 0], mk(gasketXZ(w, 2 * z, 0.3, 0.1, 0.9), rubber)), '25', {ex: [0, 1.2, 0], order: 0.5});
  // 5 screws: from below through the ears
  const sc = screwY(1.0, 0.3, 0.15, 0.22).rotateX(Math.PI);
  A.add(part([0, y1 - 0.6, 0], ...[[x0 + 0.35, -z + 0.35], [x1 - 0.35, -z + 0.35], [x0 + 0.35, z - 0.35], [x1 - 0.35, z - 0.35]].map(([x, zz]) => mk(sc.clone(), zinc, x, 0, zz))), '5', {ex: [0, -6.0, 0], order: 0});
  A.add(part([0.8, -6.8, -z - 0.3], mk(orient(merge([cylY(0.32, -0.2, 0), screwY(0.6, 0.18, 0.18, 0.01)]), [0, 0, 1]), steel)), '26', {ex: [0, 0, -2.4], order: 0.1, axis: [0, 0, -1]});
  A.add(part([-0.2, y0 - 0.2, 0], mk(merge([hexY(0.8, -0.35, 0), screwY(0.4, 0.62, 0.62, 0.01).rotateX(Math.PI)]), machined)), '38', {ex: [0, -3.4, 0], order: 0.1});
  // 37 O-ring under the plug's hex flange, wider than the hex so its black edge shows
  A.add(part([-0.2, y0 - 0.17, 0], mk(oring(0.82, 0.06), rubber)), '37', {ex: [0, -2.4, 0], order: 0.15});
  return A;
}
