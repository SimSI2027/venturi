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

// the slide cavity: x SX0..SX1 (the slide is x -0.7..0.3, its plate at -0.88), z +/-SZ (its rollers reach 2.63),
// open from y SY (below the closed slide's foot) up through the tower top; its 2 side walls are the guide faces
const SX0 = -0.95, SX1 = 0.55, SZ = 2.75, SY = -0.5;
/** The body's section across the cavity: a U round the slot and the bore's lower half, extruded along X. */
function cavitySection() {
  const zc = Math.sqrt(BORE_R * BORE_R - SY * SY);
  const s = new THREE.Shape();
  s.moveTo(-3.25, -2.85);
  s.lineTo(3.25, -2.85);
  s.lineTo(3.25, 4.45);
  s.lineTo(SZ, 4.45);
  s.lineTo(SZ, SY);
  s.lineTo(zc, SY);
  s.absarc(0, 0, BORE_R, Math.atan2(SY, zc), Math.atan2(SY, -zc), true);
  s.lineTo(-SZ, SY);
  s.lineTo(-SZ, 4.45);
  s.lineTo(-3.25, 4.45);
  s.closePath();
  const g = extrudeXY(s, SX1 - SX0, 0.08, 48, {free: true});
  g.rotateY(Math.PI / 2);
  g.translate((SX0 + SX1) / 2, 0, 0);
  return g;
}

export function buildBody(index) {
  const A = new Asm('body', 'Body', {index});
  const {cast, machined, bore, steel, brass} = A.M;
  const g = [];
  // main block round the bore and the slide tower above it (tower wider for the rollers' rails), each in two
  // halves either side of the slide cavity (x SX0..SX1), which runs from the bore up through the tower top
  for (const [x0, x1] of [[-3.2, SX0], [SX1, 2.6]]) g.push(blockX(-2.9, 2.9, -2.85, 2.6, x0, x1, BORE_R));
  for (const [x0, x1] of [[-2.0, SX0], [SX1, 1.0]]) g.push(blockX(-3.25, 3.25, -2.2, 4.45, x0, x1, BORE_R + 0.05, 0.6));
  g.push(cavitySection());
  // bosses: throttle shaft both sides, pilot air face, starter plunger, hot start, pilot screw, sensor seat
  // (the +Z shaft boss and the pilot air face stop short so the sensor O-ring 62 and diaphragm 78 show on them)
  g.push(orient(cylY(1.05, 0, 0.15), [0, 0, 1], [0.8, 2.55, 3.1]));
  g.push(orient(cylY(1.05, 0, 0.5), [0, 0, -1], [0.8, 2.55, -3.1]));
  g.push(orient(cylY(1.45, 0, 0.2), [0, 0, 1], [1.6, -1.4, 2.85]));
  // the 2 starter plunger bores: cold start out of the +Z face, hot start down from the top boss
  g.push(orient(tubeY(0.72, 0.25, 0, 0.55), [0, 0, 1], [-2.4, -1.2, 2.85]));
  g.push(tubeY(0.62, 0.3, 2.4, 3.9).translate(2.1, 0, 1.6));
  // pilot screw boss: a bored boss under the engine end, its O-ring (51) shows under the face
  g.push(tubeY(0.5, 0.17, -3.25, -2.4).translate(3.35, 0, 0), cylY(0.62, -2.62, -2.4).translate(3.35, 0, 0));
  g.push(rbox(1.2, 1.6, 1.2, 0.25).translate(3.1, -2.2, 0));
  // float chamber mating flange: its face at y -2.85 sits on the bowl gasket (25, y -2.95..-2.85)
  g.push(rbox(6.6, 0.35, 6.1, 0.12).translate(-0.2, -2.675, 0));
  // spigot ridge and the projection that keys into the joint slot
  g.push(rbox(0.6, 0.5, 0.6, 0.12).translate(3.6, 2.55, 0));
  // the underside, from the manual's drawings (every fitted jet sits in its own boss): the main jet tower round
  // the needle jet (open below: spacer and main jet hex show), the pilot jet and starter jet bosses, the needle
  // valve seat boss, and the 2 float pin posts either side of the float's hinge
  g.push(tubeY(0.98, 0.8, -4.05, -2.8).translate(-0.2, 0, 0));
  g.push(cylY(0.32, -3.85, -2.8).translate(1.1, 0, 0.7));
  g.push(cylY(0.32, -3.6, -2.8).translate(-1.7, 0, -0.8));
  g.push(tubeY(0.4, 0.2, -3.3, -2.8).translate(1.7, 0, 0));
  for (const z of [-1.35, 1.35]) g.push(rbox(0.5, 1.15, 0.36, 0.1).translate(2.3, -3.37, z));
  const casting = mk(merge(g), cast);
  // the machined face the bowl gasket seals on, and the brass needle valve seat in its boss
  const bowlFace = mk(rbox(5.9, 0.02, 5.7, 0.008).translate(-0.2, -2.855, 0), machined);
  const seat = mk(tubeY(0.22, 0.1, -3.34, -3.0).translate(1.7, 0, 0), brass);
  // bell mouth toward the air box: flared, its lip machined
  const bell = mk(latheX([[-3.1, 2.45], [-4.4, 2.55], [-5.1, 2.8], [-5.55, 3.1], [-5.75, 3.05], [-5.8, 2.75], [-5.6, 2.35], [-5.0, 2.05], [-4.0, BORE_R], [-3.1, BORE_R]].reverse()), cast);
  const lip = mk(latheX([[-5.9, 2.95], [-5.82, 3.12], [-5.62, 3.16], [-5.62, 2.95], [-5.9, 2.95]]), machined);
  // spigot toward the engine
  const spigot = mk(latheX([[2.5, 2.4], [4.2, 2.4], [4.25, 2.55], [4.6, 2.55], [4.65, 2.35], [4.9, 2.3], [4.9, BORE_R + 0.05], [2.5, BORE_R + 0.05]]), cast);
  // the bore itself: machined, brighter than the casting, open to the slide cavity between SX0 and SX1
  const ring = (x0, x1) => latheX([[x0, BORE_R + 0.002], [x1, BORE_R + 0.002], [x1, BORE_R - 0.03], [x0, BORE_R - 0.03]], 64);
  // inside: the cavity's 2 guide faces (machined strips on its engine-side wall, where the 4 rollers run), the needle jet bore in the bore floor
  // (a machined ring round the nozzle's top), the accelerator pump nozzle aimed into the bore toward the engine
  const guides = [-1, 1].map((sz) => rbox(0.02, 4.4, 0.5, 0.008).translate(SX1 - 0.012, 2.2, sz * 2.5));
  const boreM = mk(merge([ring(-5.8, SX0), ring(SX1, 4.9), ...guides, tubeY(0.45, 0.29, -2.02, -1.9).translate(-0.2, 0, 0)]), bore);
  const nozzle = mk(orient(merge([tubeY(0.11, 0.05, 0, 0.55), cylY(0.17, 0, 0.12)]), [0.55, 0.85, 0], [-2.7, -1.93, 0]), brass);
  // throttle shaft through the body, and the cable pulley on it (-Z, under the cable cover)
  const shaft = mk(orient(cylY(0.22, -4.0, 4.0), [0, 0, 1]), steel, 0.8, 2.55, 0);
  const pulley = mk(merge([orient(cylY(0.95, 0, 0.55), [0, 0, -1], [0, 0, 0]), orient(cylY(1.2, 0.45, 0.6), [0, 0, -1], [0, 0, 0])]), machined, 0.8, 2.55, -3.6);
  // vent and overflow nipples on the -Z face, the fuel inlet nipple on the bowl side lives on the bowl
  const nips = mk(merge([orient(tubeY(0.22, 0.12, 0, 0.9), [0, 0, -1], [-1.8, -2.25, -2.9]), orient(tubeY(0.22, 0.12, 0, 0.9), [0, 0, -1], [1.0, -2.25, -2.9])]), brass);
  const body = part([0, 0, 0], casting, bowlFace, seat, bell, lip, spigot, boreM, nozzle, shaft, pulley, nips);
  A.add(body, '1');
  return A;
}
