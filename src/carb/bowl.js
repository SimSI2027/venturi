// 9 bowl: the float chamber (piece of reference 1), a shallow casting from the photos, with the pump lobe, the pump
// rod's guide and the fuel inlet fitting, its gasket (25),
// screws (5), drain plug (26), bottom plug (38) with O-ring (37). Comes off downward.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, oring, screwY, gasketXZ, extrudeXY, rpoly, hose, mk, part} from './kit.js';

// a shallow casting (with the pump cover under it 0.28 H tall), from the photos: wider across (Z) than along the bore
export const BOWL = {x0: -3.4, x1: 2.5, y0: -8.4, y1: -4.1, z: 3.6};
export const PUMP = [0.6, -4.0]; // the pump lobe's axis (x, z): under the bowl, sticking out on the cable side

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
  // screw ears at the four corners, the pump lobe under the cable side with the pump rod's guide up its side, the
  // bottom plug boss, the drain boss and the drain plug boss on the sensor side, the accelerator jet boss inside
  const ear = (x, zz) => cylY(0.5, y1 - 0.55, y1 - 0.02).translate(x, 0, zz);
  const [PX, PZ] = PUMP;
  const g = merge([
    walls, floor,
    ear(x0 + 0.35, -z + 0.35), ear(x1 - 0.35, -z + 0.35), ear(x0 + 0.35, z - 0.35), ear(x1 - 0.35, z - 0.35),
    cylY(1.5, y0 - 0.15, y0 + 2.0).translate(PX, 0, PZ), // pump lobe: its face sits on the diaphragm (pump.js)
    cylY(0.36, y0 + 1.8, y1 - 0.25).translate(-0.4, 0, PZ - 0.3), // pump rod guide, up the cable side
    rbox(0.5, y1 - y0 - 2.2, 0.7, 0.15).translate(-0.4, (y1 + y0 + 2.0) / 2, -z - 0.1),
    cylY(1.2, y0 - 0.15, y0 + 0.3).translate(-0.2, 0, 0),
    cylY(0.38, y0 + 0.4, -4.55).translate(-2.7, 0, 2.9), // accelerator jet boss up the corner (jet 77 on top)
    cylY(0.45, y0 - 0.25, y0 + 0.3).translate(1.4, 0, 2.0),
    orient(cylY(0.45, 0, 0.15), [0, 0, 1], [-1.2, -7.5, z - 0.1]),
    orient(cylY(0.36, 0, 0.12), [0, 0, 1], [1.0, -4.7, z - 0.1]),
  ]);
  // fuel inlet fitting: a steel elbow out of the sensor side, turned up, a hex at its foot (hose 73 goes on it)
  const inlet = merge([hose([[1.0, -4.7, z], [1.0, -4.7, z + 0.55], [1.0, -4.42, z + 0.83], [1.0, -3.9, z + 0.86], [1.0, -2.6, z + 0.86]], 0.22, 0.12), orient(hexY(0.34, 0, 0.22), [0, 0, 1], [1.0, -4.7, z])]);
  const face = rbox(w - 0.1, 0.08, 2 * z - 0.1, 0.04).translate(cx, y1 - 0.03, 0); // machined mating face
  A.add(part([0, 0, 0], mk(g, cast), mk(inlet, steel), mk(face, machined)), '1-bowl', {ex: [0, 0, 0], order: 0.3});
  A.add(part([cx, y1 + 0.05, 0], mk(gasketXZ(w, 2 * z, 0.3, 0.1, 0.9), rubber)), '25', {ex: [0, 1.2, 0], order: 0.5});
  // 5 screws: from below through the ears
  const sc = screwY(1.0, 0.3, 0.15, 0.22).rotateX(Math.PI);
  A.add(part([0, y1 - 0.6, 0], ...[[x0 + 0.35, -z + 0.35], [x1 - 0.35, -z + 0.35], [x0 + 0.35, z - 0.35], [x1 - 0.35, z - 0.35]].map(([x, zz]) => mk(sc.clone(), zinc, x, 0, zz))), '5', {ex: [0, -6.0, 0], order: 0});
  A.add(part([-1.2, -7.5, z + 0.05], mk(orient(merge([hexY(0.34, 0, 0.25), screwY(0.6, 0.18, 0.18, 0.01)]), [0, 0, 1]), steel)), '26', {ex: [0, 0, 2.4], order: 0.1, axis: [0, 0, 1]});
  A.add(part([-0.2, y0 - 0.2, 0], mk(merge([hexY(1.05, -0.4, 0), screwY(0.4, 0.62, 0.62, 0.01).rotateX(Math.PI)]), machined)), '38', {ex: [0, -3.4, 0], order: 0.1});
  // 37 O-ring under the plug's hex flange, wider than the hex so its black edge shows
  A.add(part([-0.2, y0 - 0.17, 0], mk(oring(1.08, 0.06), rubber)), '37', {ex: [0, -2.4, 0], order: 0.15});
  return A;
}
