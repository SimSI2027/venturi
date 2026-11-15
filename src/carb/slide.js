// 5 slide: throttle valve (flat slide, 9) on 4 rollers (10), its plate (11) and seal (12), needle holder (14),
// spring (15), collar (16), jet needle (48) with clip (13). Hidden in the tower until the top cover is off.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, latheY, orient, oring, springY, plateXY, extrudeXY, rpoly, mk, part} from './kit.js';

export function buildSlide(index) {
  const A = new Asm('slide', 'Slide', {offset: [0, 5.5, 0], index});
  const {anod, steel, machined, rubber, brass} = A.M;
  const NX = -0.2; // needle axis x
  // 9 throttle valve: an anodised block with the roller axles and the lift-lever slot on top
  const valve = merge([
    rbox(1.0, 3.6, 4.4, 0.18),
    rbox(0.5, 0.5, 1.4, 0.12).translate(0.45, 1.9, -0.9),
    orient(cylY(0.12, -2.55, 2.55), [0, 0, 1], [0.2, -1.1, 0]),
    orient(cylY(0.12, -2.55, 2.55), [0, 0, 1], [0.2, 1.1, 0]),
  ]);
  A.add(part([NX, 1.4, 0], mk(valve, anod)), '9', {ex: [0, 0, 0], order: 0.2});
  // 10 rollers: four steel wheels on the axle ends, two each side
  const wheel = orient(merge([cylY(0.36, -0.13, 0.13), cylY(0.2, -0.17, 0.17)]), [0, 0, 1]);
  const rollers = part([NX + 0.2, 1.4, 0], ...[-1.1, 1.1].flatMap((y) => [-2.5, 2.5].map((z) => mk(wheel.clone(), steel, 0, y, z))));
  A.add(rollers, '10', {ex: [2.0, -0.4, 0], order: 0.1});
  // 11 throttle valve plate: thin bright plate on the bell-mouth face, with the cutaway and the needle slot
  const s = rpoly([[-2.25, -2.3], [2.25, -2.3], [2.25, 2.2], [-2.25, 2.2]], 0.25);
  const g11 = extrudeXY(s, 0.12, 0.04, 6);
  g11.rotateY(Math.PI / 2);
  A.add(part([NX - 0.62, 0.75, 0], mk(g11, machined), mk(orient(tubeY(0.3, 0.14, -0.08, 0.08), [1, 0, 0]), machined, 0, 1.0, 0)), '11', {ex: [-2.4, 0, 0], order: 0.3});
  // 12 seal: a rubber strip along the plate's top edge
  A.add(part([NX - 0.55, 2.85, 0], mk(rbox(0.22, 0.24, 4.2, 0.06), rubber)), '12', {ex: [-3.6, 1.0, 0], order: 0.35});
  // 14 needle holder (screw), 15 spring, 16 collar
  A.add(part([NX, 3.2, 0], mk(merge([hexY(0.3, 0, 0.28), tubeY(0.2, 0.08, -0.4, 0)]), steel)), '14', {ex: [0, 3.0, 0], order: 0.5});
  A.add(part([NX, 3.52, 0], mk(springY(0.7, 0.2, 0.04, 5), steel)), '15', {ex: [0, 4.3, 0], order: 0.45});
  A.add(part([NX, 2.6, 0], mk(tubeY(0.2, 0.08, 0, 0.28), brass)), '16', {ex: [2.6, 2.4, -1.4], order: 0.55});
  // 48 jet needle: long taper with clip grooves at the top, hanging into the needle jet
  const np = [[-2.6, 0], [-2.6, 0.035], [-1.2, 0.07], [0.6, 0.115], [2.1, 0.12]];
  for (let i = 0; i < 6; i++) np.push([2.15 + i * 0.09, 0.12], [2.19 + i * 0.09, 0.095]);
  np.push([2.75, 0.12], [2.8, 0.09], [2.8, 0]);
  A.add(part([NX, 0, 0], mk(latheY(np, 16), steel)), '48', {ex: [3.4, 1.2, 0], order: 0.7});
  // 13 clip on groove 4
  A.add(part([NX, 2.47, 0], mk(oring(0.15, 0.035), steel)), '13', {ex: [3.4, 2.0, 0], order: 0.65});
  return A;
}
