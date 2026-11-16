// 13 body: the main casting (part of reference 1). Bore along X (39 mm), bell mouth toward the air box (-X),
// spigot toward the engine (+X), the slide tower above the bore, bosses for every part around it.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, extrudeXY, rpoly, circ, merge, at, latheY, cylY, tubeY, hexY, orient, mk, part} from './kit.js';

export const BORE_R = 1.95;

/** Shape in (z, y), extruded along X from x0 to x1, with the bore cut through. */
function blockX(z0, z1, y0, y1, x0, x1, holeR, r = 0.45) {
  const s = rpoly([[z0, y0], [z1, y0], [z1, y1], [z0, y1]], r);
  if (holeR) s.holes.push(circ(0, 0, holeR));
  const g = extrudeXY(s, x1 - x0, 0.12, 24, {free: true});
  g.rotateY(Math.PI / 2); // depth -> x, shape x -> -z
  g.translate((x0 + x1) / 2, 0, 0);
  return g;
}
/** Lathe around X: pts [[x, r]]. */
function latheX(pts, seg = 64) {
  const g = latheY(pts.map(([x, r]) => [x, r]), seg);
  g.rotateZ(-Math.PI / 2); // +Y -> +X
  return g;
}

export function buildBody(index) {
  const A = new Asm('body', 'Body', {index});
  const {cast, machined, bore, steel, brass} = A.M;
  const g = [];
  // main block round the bore and the slide tower above it (tower wider for the rollers' rails)
  g.push(blockX(-2.9, 2.9, -2.85, 2.6, -3.2, 2.6, BORE_R));
  g.push(blockX(-3.25, 3.25, -2.2, 4.45, -2.0, 1.0, BORE_R + 0.05, 0.6));
  // bosses: throttle shaft both sides, pilot air face, starter plunger, hot start, pilot screw, sensor seat
  // (the +Z shaft boss and the pilot air face stop short so the sensor O-ring 62 and diaphragm 78 show on them)
  g.push(orient(cylY(1.05, 0, 0.15), [0, 0, 1], [0.8, 2.55, 3.1]));
  g.push(orient(cylY(1.05, 0, 0.5), [0, 0, -1], [0.8, 2.55, -3.1]));
  g.push(orient(cylY(1.45, 0, 0.2), [0, 0, 1], [1.6, -1.4, 2.85]));
  g.push(orient(cylY(0.72, 0, 0.55), [0, 0, 1], [-2.4, -1.2, 2.85]));
  g.push(cylY(0.62, 2.4, 3.9).translate(2.1, 0, 1.6));
  g.push(cylY(0.5, -3.25, -2.4).translate(3.35, 0, 0)); // pilot screw boss: its O-ring (51) shows under the face
  g.push(rbox(1.2, 1.6, 1.2, 0.25).translate(3.1, -2.2, 0));
  // float chamber mating flange: its face at y -2.85 sits on the bowl gasket (25, y -2.95..-2.85)
  g.push(rbox(6.6, 0.35, 6.1, 0.12).translate(-0.2, -2.675, 0));
  // spigot ridge and the projection that keys into the joint slot
  g.push(rbox(0.6, 0.5, 0.6, 0.12).translate(3.6, 2.55, 0));
  const casting = mk(merge(g), cast);
  // bell mouth toward the air box: flared, its lip machined
  const bell = mk(latheX([[-3.1, 2.45], [-4.4, 2.55], [-5.1, 2.8], [-5.55, 3.1], [-5.75, 3.05], [-5.8, 2.75], [-5.6, 2.35], [-5.0, 2.05], [-4.0, BORE_R], [-3.1, BORE_R]].reverse()), cast);
  const lip = mk(latheX([[-5.9, 2.95], [-5.82, 3.12], [-5.62, 3.16], [-5.62, 2.95], [-5.9, 2.95]]), machined);
  // spigot toward the engine
  const spigot = mk(latheX([[2.5, 2.4], [4.2, 2.4], [4.25, 2.55], [4.6, 2.55], [4.65, 2.35], [4.9, 2.3], [4.9, BORE_R + 0.05], [2.5, BORE_R + 0.05]]), cast);
  // the bore itself: machined, brighter than the casting
  const boreM = mk(latheX([[-5.8, BORE_R + 0.002], [4.9, BORE_R + 0.002], [4.9, BORE_R - 0.03], [-5.8, BORE_R - 0.03]], 64), bore);
  // throttle shaft through the body, and the cable pulley on it (-Z, under the cable cover)
  const shaft = mk(orient(cylY(0.22, -4.0, 4.0), [0, 0, 1]), steel, 0.8, 2.55, 0);
  const pulley = mk(merge([orient(cylY(0.95, 0, 0.55), [0, 0, -1], [0, 0, 0]), orient(cylY(1.2, 0.45, 0.6), [0, 0, -1], [0, 0, 0])]), machined, 0.8, 2.55, -3.6);
  // vent and overflow nipples on the -Z face, the fuel inlet nipple on the bowl side lives on the bowl
  const nips = mk(merge([orient(tubeY(0.22, 0.12, 0, 0.9), [0, 0, -1], [-1.8, -2.25, -2.9]), orient(tubeY(0.22, 0.12, 0, 0.9), [0, 0, -1], [1.0, -2.25, -2.9])]), brass);
  const body = part([0, 0, 0], casting, bell, lip, spigot, boreM, shaft, pulley, nips);
  A.add(body, '1');
  return A;
}
