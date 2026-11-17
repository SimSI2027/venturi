// 5 slide: throttle valve (flat slide, 9) on 4 rollers (10), its plate (11) and seal (12), needle holder (14),
// spring (15), collar (16), jet needle (48) with clip (13). Hidden in the tower until the top cover is off.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, latheY, orient, oring, springY, plateXY, extrudeXY, rpoly, mk, part, headY, threadTubeY, cClipY} from './kit.js';

export function buildSlide(index) {
  const A = new Asm('slide', 'Slide', {offset: [0, 9.0, 0], index});
  const {anod, steel, machined, rubber, brass} = A.M;
  const NX = -0.2; // needle axis x
  // 9 throttle valve (flat slide): an anodised slab in profile, x -0.5..0.5 by y -1.8..1.8, 4.4 wide in z, with the
  // cutaway (spec 1.5) chamfered off its bell-mouth (-X) foot; the lift-lever lug on top, and 4 steel roller pins
  // out of its sides (two each side, toward the engine where the rollers run on the cavity wall)
  const prof = rpoly([[-0.5, -1.35], [-0.12, -1.8], [0.5, -1.8], [0.5, 1.8], [-0.5, 1.8]], 0.08);
  const PX = 0.39; // roller pin x (slide space): the rollers' rims touch the cavity's engine-side wall
  const pins = [-1.1, 1.1].flatMap((y) => [-1, 1].map((sz) => orient(merge([cylY(0.11, 0, 0.55), cylY(0.16, 0.5, 0.58)]), [0, 0, sz], [PX, y, sz * 2.15])));
  const valve = merge([
    extrudeXY(prof, 4.4, 0.06, 6),
    rbox(0.5, 0.5, 1.4, 0.12).translate(0.45, 1.9, -0.9),
    ...pins,
  ]);
  A.add(part([NX, 1.4, 0], mk(valve, anod)), '9', {ex: [0, 0, 0], order: 0.2});
  // 10 rollers: four steel bearings on those pins (outer race with chamfered rims, inner hub), two each side
  const wheel = orient(merge([latheY([[-0.12, 0.22], [-0.12, 0.32], [-0.09, 0.36], [0.09, 0.36], [0.12, 0.32], [0.12, 0.22], [-0.12, 0.22]]), tubeY(0.2, 0.11, -0.15, 0.15)]), [0, 0, 1]);
  const rollers = part([NX + PX, 1.4, 0], ...[-1.1, 1.1].flatMap((y) => [-2.5, 2.5].map((z) => mk(wheel.clone(), steel, 0, y, z))));
  A.add(rollers, '10', {ex: [2.0, -0.4, 0], order: 0.1});
  // 11 throttle valve plate: a thin bright plate on the slide's bell-mouth face, above the cutaway, with the
  // needle slot; 12 its seal: a rubber strip seated along the plate's top edge, proud of its face
  const s = rpoly([[-2.1, -1.45], [2.1, -1.45], [2.1, 1.45], [-2.1, 1.45]], 0.25);
  const g11 = extrudeXY(s, 0.12, 0.04, 6);
  g11.rotateY(Math.PI / 2);
  A.add(part([NX - 0.56, 1.6, 0], mk(g11, machined), mk(orient(tubeY(0.3, 0.14, -0.08, 0.08), [1, 0, 0]), machined, 0, 0.3, 0)), '11', {ex: [-2.4, 0, 0], order: 0.3});
  // run 14 (item 6, Keihin 22): the seal is a rubber frame round the plate (4.6 x 3.2 outside, a 4.0 x 2.7 window), proud of it
  const fr = rpoly([[-2.3, -1.6], [2.3, -1.6], [2.3, 1.6], [-2.3, 1.6]], 0.35);
  fr.holes.push(rpoly([[-2.0, -1.35], [2.0, -1.35], [2.0, 1.35], [-2.0, 1.35]], 0.2, new THREE.Path()));
  A.add(part([NX - 0.56, 1.6, 0], mk(extrudeXY(fr, 0.17, 0.05, 8, {free: true}).rotateY(Math.PI / 2), rubber)), '12', {ex: [-3.6, 1.0, 0], order: 0.35});
  // 14 needle holder (screw), 15 spring, 16 collar
  A.add(part([NX, 3.2, 0], mk(merge([headY(0.3, 0.28, 'slot'), threadTubeY(0.4, 0.2, 0.08)]), steel)), '14', {ex: [0, 3.0, 0], order: 0.5});
  A.add(part([NX, 3.52, 0], mk(springY(0.7, 0.2, 0.04, 5), steel)), '15', {ex: [0, 4.3, 0], order: 0.45});
  A.add(part([NX, 2.6, 0], mk(tubeY(0.2, 0.08, 0, 0.28), brass)), '16', {ex: [2.6, 2.4, -1.4], order: 0.55});
  // 48 jet needle: a straight shank, then a visible taper down to a rounded tip hanging into the needle jet, and 7
  // clip grooves at the top (groove 1 the top one; the clip 13 sits in groove 4, y 2.46)
  const np = [[-2.6, 0], [-2.6, 0.022], [-2.55, 0.04], [0.3, 0.105], [0.55, 0.125], [2.08, 0.125]];
  for (let i = 0; i < 7; i++) np.push([2.12 + i * 0.1, 0.125], [2.14 + i * 0.1, 0.09], [2.18 + i * 0.1, 0.09], [2.2 + i * 0.1, 0.125]);
  np.push([2.86, 0.125], [2.9, 0.09], [2.9, 0]);
  A.add(part([NX, 0, 0], mk(latheY(np, 16), steel)), '48', {ex: [3.4, 1.2, 0], order: 0.7});
  // 13 clip on groove 4
  A.add(part([NX, 2.47, 0], mk(cClipY(0.24, 0.1, 70, 0.05), steel)), '13', {ex: [3.4, 2.0, 0], order: 0.65});
  return A;
}
