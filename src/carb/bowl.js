// 9 bowl: the float chamber (piece of reference 1), a shallow casting from the photos, with the pump lobe, the pump
// rod's guide and the fuel inlet fitting, its gasket (25),
// screws (5), drain plug (26), bottom plug (38) with O-ring (37). Comes off downward.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, oring, screwY, gasketXZ, extrudeXY, rpoly, hose, lift, mk, part} from './kit.js';
import {HT, UY, FLANGE, EARS, slabY} from './body.js';

// run 8, from the 2 underside photos: the lip in the flange's outline (4 corner screw ears), a rounded belly under it
// (0.35 H tall to the plug boss), the big hex plug near the centre, the drain nipple at the engine (-X) end, the round
// pump cover overhanging the cable-side corner by half its width. Built at y local, then lifted by UY.
export const BOWL = {x0: -3.3, x1: 2.4, y0: HT.bottom - UY, yb: HT.bottom - UY + 0.35, y1: -4.1, z: 3.4, lift: UY};
export const PUMP = [-1.5, -3.8]; // the pump's axis (x, z): under the belly's cable-side edge, half of it outside
export const DRAIN = [-3.05, 0.3]; // the drain nipple (x, z), pointing down out of the belly's engine end
export const PY0 = BOWL.y0 + 0.75; // the pump housing's face (local y): the cover under it ends level with the plug boss

/** A hollow rounded belly: a plan outline (32 points of a rounded square fitted to carb_12) lofted down through
 * rings [y, scale] that bulge, then curl in to a flat floor; the inner wall an inset copy with a floor 0.35 thick. */
function belly(cx, a, b, rings, wall) {
  const N = 32, pos = [], idx = [];
  const plan = Array.from({length: N}, (_, i) => {
    const t = (2 * Math.PI * i) / N, c = Math.cos(t), s = Math.sin(t);
    return [Math.sign(c) * Math.abs(c) ** 0.5 * a, Math.sign(s) * Math.abs(s) ** 0.5 * b]; // superellipse n = 4
  });
  const ring = (y, k) => {
    const o = pos.length / 3;
    for (const [x, z] of plan) pos.push(cx + x * k, y, z * k);
    return o;
  };
  const P = (i) => new THREE.Vector3(pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]);
  const tri = (i, j, l, want) => {
    const n = P(j).sub(P(i)).cross(P(l).sub(P(i)));
    idx.push(...(n.dot(want(P(i))) >= 0 ? [i, j, l] : [i, l, j]));
  };
  const out = (p) => new THREE.Vector3(p.x - cx, 0, p.z);
  const inn = (p) => new THREE.Vector3(cx - p.x, 0, -p.z);
  const up = () => new THREE.Vector3(0, 1, 0), down = () => new THREE.Vector3(0, -1, 0);
  const band = (r0, r1, want) => {
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      tri(r0 + i, r1 + i, r0 + j, want);
      tri(r0 + j, r1 + i, r1 + j, want);
    }
  };
  const cap = (r, y, want) => {
    const c = pos.length / 3;
    pos.push(cx, y, 0);
    for (let i = 0; i < N; i++) tri(c, r + i, r + ((i + 1) % N), want);
  };
  const yb = rings[rings.length - 1][0], kin = 1 - wall / Math.min(a, b);
  const O = rings.map(([y, k]) => ring(y, k));
  const I = rings.map(([y, k]) => ring(Math.max(y, yb + 0.35), k * kin));
  for (let r = 0; r + 1 < rings.length; r++) band(O[r], O[r + 1], out), band(I[r], I[r + 1], inn);
  band(O[0], I[0], up); // the rim under the lip
  cap(O[O.length - 1], yb, down);
  cap(I[I.length - 1], yb + 0.35, up);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g.toNonIndexed();
}

export function buildBowl(index) {
  const A = new Asm('bowl', 'Bowl', {offset: [0, -11.0, 0], index});
  const {cast, machined, rubber, steel, zinc, brass} = A.M;
  const {y0, yb, y1, z} = BOWL;
  const cx = -0.45, yt = y1 - 0.3, hb = yt - yb;
  // the lip: the flange outline, 0.4 thick, open over the belly; the belly: straight sides bulging a little, then
  // curling in under a rounded lower edge to a flat floor
  const OPEN = [[-2.95, -3.0], [2.05, -3.0], [2.05, 3.0], [-2.95, 3.0]];
  const lip = slabY(FLANGE, y1 - 0.2, 0.4, OPEN);
  const body = belly(cx, 2.75, 3.25, [[yt, 1.0], [yt - 0.3 * hb, 1.02], [yt - 0.6 * hb, 1.0], [yt - 0.8 * hb, 0.96], [yt - 0.9 * hb, 0.9], [yt - 0.96 * hb, 0.82], [yb, 0.72]], 0.3);
  const [PX, PZ] = PUMP, [DX, DZ] = DRAIN;
  const g = merge([
    lip, body,
    cylY(1.25, y0, yb + 0.25, 0.12).translate(-0.2, 0, 0), // the plug boss in the floor's centre (the bowl's lowest point)
    cylY(1.55, PY0, yb + 1.3, 0.12).translate(PX, 0, PZ), // pump housing: its face (PY0) sits on the diaphragm (pump.js)
    cylY(0.36, PY0 + 0.3, y1 - 0.45).translate(PX + 0.9, 0, PZ + 0.3), // pump rod guide, up the cable side
    cylY(0.5, yb - 0.1, yb + 0.9).translate(DX, 0, DZ), // drain nipple boss at the engine end (pipe 71 in it)
    cylY(0.38, yb + 0.4, -4.55).translate(-2.7, 0, 2.4), // accelerator jet boss up the corner (jet 77 on top)
    orient(cylY(0.45, 0, 0.5), [0, 0, 1], [-0.6, yb + 0.75, 2.05]), // drain plug boss, sensor side, low
    orient(cylY(0.4, 0, 0.5), [0, 0, 1], [1.0, -4.7, 2.95]), // fuel inlet boss
  ]);
  // fuel inlet fitting: a steel elbow out of the sensor side, turned up, a hex at its foot (hose 73 goes on it)
  const inlet = merge([hose([[1.0, -4.7, z], [1.0, -4.7, z + 0.55], [1.0, -4.42, z + 0.83], [1.0, -3.9, z + 0.86], [1.0, -1.6, z + 0.86]], 0.22, 0.12), orient(hexY(0.34, 0, 0.22), [0, 0, 1], [1.0, -4.7, z])]);
  const face = slabY(OPEN.map(([x, zz]) => [x + (x < 0 ? -0.3 : 0.3), zz + (zz < 0 ? -0.3 : 0.3)]), y1 - 0.02, 0.06, OPEN, 0.5); // machined mating face
  A.add(part([0, 0, 0], mk(g, cast), mk(inlet, steel), mk(face, machined)), '1-bowl', {ex: [0, 0, 0], order: 0.3});
  A.add(part([0, y1 + 0.05, 0], mk(slabY(FLANGE, 0, 0.1, OPEN), rubber)), '25', {ex: [0, 1.2, 0], order: 0.5});
  // 5 screws: 4 Phillips pan heads from below through the corner ears
  const sc = screwY(1.0, 0.3, 0.15, 0.22).rotateX(Math.PI);
  A.add(part([0, y1 - 0.42, 0], ...EARS.map(([x, zz]) => mk(sc.clone(), zinc, x, 0, zz))), '5', {ex: [0, -6.0, 0], order: 0});
  A.add(part([-0.6, yb + 0.75, 2.55], mk(orient(merge([hexY(0.34, 0, 0.25), screwY(0.6, 0.18, 0.18, 0.01)]), [0, 0, 1]), steel)), '26', {ex: [0, 0, 2.4], order: 0.1, axis: [0, 0, 1]});
  // 38 the big hex bottom plug (main jet access) under the boss, 37 its O-ring, wider than the hex so its edge shows
  A.add(part([-0.2, y0 - 0.03, 0], mk(merge([hexY(1.05, -0.4, 0), screwY(0.4, 0.62, 0.62, 0.01).rotateX(Math.PI)]), machined)), '38', {ex: [0, -3.4, 0], order: 0.1});
  A.add(part([-0.2, y0 - 0.0, 0], mk(oring(1.08, 0.06), rubber)), '37', {ex: [0, -2.4, 0], order: 0.15});
  return lift(A, BOWL.lift);
}
