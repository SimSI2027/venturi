// 13 body: the main casting (part of reference 1), shaped from the 7 photos (run 7): a tall narrow slide tower with
// the bore through it, 2 short plain round spigots (air box -X, engine +X; no bell mouth), bosses for every part.
// Run 8: H = 16.55 cm, top cover (y 8.11) to bowl bottom (y -8.44); bore-axis length 8.5 = 0.51 H. The 2 new photos
// (carb_7 engine side, carb_8 air-box side) put the ENGINE at -X and the AIR BOX at +X (run 7 had them swapped).
import {Asm} from '../lib/asm.js';
import {THREE, rbox, extrudeXY, rpoly, circ, merge, at, latheY, cylY, tubeY, hexY, orient, springY, mk, part} from './kit.js';

export const BORE_R = 1.95;
// run 8 proportions (carb_7, along the bore), H = top cover to bowl bottom = 16.55 (the bore ring, 4.8 across, is
// 0.29 H): the top cover's top at +8.11 (0.49 H above the bore centre), the bowl joint at -2.48 (0.64 H under the
// top), the bowl's belly at -8.44; across Z 3 masses side by side, 0.65 H in all: the cable-wheel housing out to -5.1,
// the slide tower +/-3.3, the sensor housing out to +5.6
export const HT = {top: 8.11, joint: -2.48, bottom: -8.44};
export const TOWER = {x0: -2.2, x1: 1.8, z: 3.3, top: 7.3}; // the slide tower; the lower block is x +/-2.6
export const BOT = HT.joint; // the body's underside: the float chamber gasket face
export const UY = 1.52; // the underside's bosses and every part under them, built for BOT -4.0, lifted with it
export const SHAFT = [-0.2, 5.6]; // throttle shaft (x, y), across the tower along Z
export const CUPZ = -4.5; // the cable-wheel housing's face (the cover's gasket sits on it)
export const SENS = 4.95; // the sensor housing: its face at SENS + 0.22, the cover plate's outer face at SENS + 0.65
// the cable side's flat shield-shaped cover outline (x, y, corner r), seen from -Z: wide top, narrow lobe below
export const SHIELD = [[4.0, 7.7, 0.9], [-2.9, 7.9, 0.6], [-2.9, 4.4, 0.5], [-1.3, 2.7, 0.6], [-1.0, -0.8, 0.6], [0.45, -1.6, 0.7], [1.9, -0.8, 0.6], [2.4, 2.2, 0.8], [4.1, 6.1, 0.8]];
// the sensor side's flat cover plate outline (59), cut at lower left round the pilot air cover
export const PLATE59 = [[-1.8, 6.9], [3.6, 6.9], [3.6, -0.2], [1.8, -0.2], [1.8, 2.2], [0.6, 3.1], [-1.8, 3.2]];
// the body seen along the bore (traced from carb_7: z, y, corner r), right half from the joint up to the top: the
// lower block round the bore, a ledge at the shoulder, the tower with a rib band and a step in under the top cover;
// the casting is symmetric about the bore's vertical plane, so the left half is its mirror (28 points in all)
const HALF = [[2.7, BOT, 0.5], [3.15, -1.6, 0.4], [3.2, 0.6, 0.3], [3.3, 2.2, 0.2], [3.6, 2.45, 0.12], [3.6, 2.95, 0.12], [3.3, 3.2, 0.15],
  [3.3, 4.5, 0.08], [3.45, 4.6, 0.06], [3.45, 5.0, 0.06], [3.3, 5.1, 0.08], [3.3, 6.2, 0.25], [3.0, 6.55, 0.2], [3.0, 7.3, 0.3]];
const mirror = (h) => h.slice().reverse().map(([z, y, r]) => [-z, y, r]);
export const OUTLINE = [...HALF, ...mirror(HALF)];
/** The part of an outline under y = ymax (Sutherland-Hodgman against 1 line); cut corners get a small radius. */
function clipY(pts, ymax) {
  const out = [];
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    if (p[1] <= ymax) out.push(p);
    if ((p[1] <= ymax) !== (q[1] <= ymax)) out.push([p[0] + ((q[0] - p[0]) * (ymax - p[1])) / (q[1] - p[1]), ymax, 0.05]);
  });
  return out;
}
/** A counter-clockwise outline moved inward by d (outward if d < 0), corners kept. */
export function inset(pts, d) {
  const n = pts.length;
  const line = (i) => {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    const nx = -dy / l, ny = dx / l; // inward for a CCW outline
    return [a[0] + nx * d, a[1] + ny * d, dx, dy];
  };
  return pts.map((p, i) => {
    const [ax, ay, adx, ady] = line((i - 1 + n) % n);
    const [bx, by, bdx, bdy] = line(i);
    const den = adx * bdy - ady * bdx;
    const t = ((bx - ax) * bdy - (by - ay) * bdx) / den;
    return [ax + adx * t, ay + ady * t, Math.max(0.1, (p[2] ?? 0.3) - d)];
  });
}
/** An outline (x, y) extruded along Z, centred at z, depth dz, with optional holes (outlines or [x, y, r] circles). */
export function slabZ(pts, z, dz, holes = [], r = 0.3) {
  const s = rpoly(pts, r);
  for (const h of holes) s.holes.push(h.length === 3 && typeof h[0] === 'number' ? circ(...h) : rpoly(h, r * 0.7, new THREE.Path()));
  return extrudeXY(s, dz, 0.06, 12, {free: true}).translate(0, 0, z);
}

/** An outline in (z, y), extruded along X from x0 to x1 with rounded edges, the bore cut through. */
function outlineX(pts, x0, x1, holeR) {
  const s = rpoly(pts, 0.3);
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
/** The body's section across the cavity: the outline with the slot (narrower under the top cover) and the bore's
 * lower half cut out of it, extruded along X. */
function cavitySection() {
  const zc = Math.sqrt(BORE_R * BORE_R - SY * SY);
  const T = TOWER.top, ZT = 2.3, YT = T - 1.0;
  const a0 = Math.atan2(SY, zc), a1 = Math.atan2(SY, -zc);
  const arc = Array.from({length: 11}, (_, i) => a0 + ((a1 - a0) * (i + 1)) / 12).map((a) => [Math.cos(a) * BORE_R, Math.sin(a) * BORE_R, 0]);
  const slot = [[ZT, T, 0.05], [ZT, YT, 0.05], [SZ, YT - 0.25, 0.05], [SZ, SY, 0.05], [zc, SY, 0]];
  const s = rpoly([...HALF, ...slot, ...arc, ...mirror(slot), ...mirror(HALF)], 0.3);
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
  const {x0: TX0, x1: TX1, z: TZ, top: TT} = TOWER;
  const [SHX, SHY] = SHAFT;
  const LOW = clipY(OUTLINE, 3.1);
  for (const [x0, x1] of [[-2.6, SX0], [SX1, 2.6]]) g.push(outlineX(LOW, x0, x1, BORE_R));
  for (const [x0, x1] of [[TX0, SX0], [SX1, TX1]]) g.push(outlineX(OUTLINE, x0, x1, BORE_R + 0.05));
  g.push(cavitySection());
  // cable side (-Z): the cable-wheel housing, a cup in the shield outline round the throttle wheel, out to CUPZ;
  // the cover (65) closes it
  g.push(slabZ(SHIELD, -TZ - 0.15, 0.3), slabZ(SHIELD, (CUPZ - TZ) / 2, -CUPZ - TZ, [inset(SHIELD, 0.35)]));
  // sensor side (+Z): the sensor housing in the plate's outline, out to SENS + 0.22, where the flat cover plate (59)
  // and its gasket (61) sit
  const SF = SENS + 0.22;
  g.push(slabZ(PLATE59, (TZ - 0.1 + SF) / 2, SF - TZ + 0.1, [[SHX, SHY, 1.1]], 0.4));
  // bosses: throttle shaft both sides (the +Z one through the plate: the TPS O-ring 62 sits on it), pilot air face
  // (out to the housing's face, under the plate's cut corner)
  g.push(orient(cylY(1.0, 0, SF + 0.4 - TZ), [0, 0, 1], [SHX, SHY, TZ]));
  g.push(orient(cylY(0.6, 0, 0.2), [0, 0, -1], [SHX, SHY, -TZ - 0.1]));
  g.push(orient(cylY(1.3, 0, SF - TZ), [0, 0, 1], [0, 2.2, TZ]));
  // the 2 starter plunger bores on the air-box side of the tower: cold start out along +Z, hot start a vertical boss
  g.push(orient(tubeY(0.7, 0.25, 0, 3.0), [0, 0, 1], [-2.75, 3.8, 0.5]));
  g.push(tubeY(0.62, 0.3, 3.0, 7.9).translate(-2.75, 0, 1.6));
  // pilot screw: a lug under the engine spigot, outside the bowl, with a bored boss; its O-ring (51) shows under it
  g.push(rbox(1.3, 1.9, 1.6, 0.3).translate(3.0, -3.15 + UY, 0));
  g.push(tubeY(0.5, 0.17, -4.6 + UY, -3.9 + UY).translate(3.0, 0, 0));
  // float chamber mating flange: its face at y BOT sits on the bowl gasket (25)
  g.push(rbox(6.1, 0.35, 6.4, 0.12).translate(-0.45, BOT + 0.175, 0));
  // the projection on the engine spigot that keys into the joint slot
  g.push(rbox(0.5, 0.4, 0.6, 0.12).translate(3.3, 2.5, 0));
  // vent nipples (57, 58) on the tower's engine face, near the top
  const nipG = [-1.6, 1.6].map((z) => orient(tubeY(0.22, 0.12, 0, 0.9), [1, 0, 0], [TX1 - 0.05, 6.6, z]));
  // the underside (every fitted jet sits in its own boss): the main jet tower round the needle jet (open below:
  // spacer and main jet hex show), the pilot jet and starter jet bosses, the needle valve seat boss, the 2 float
  // pin posts either side of the float's hinge
  g.push(tubeY(0.98, 0.8, -5.2 + UY, BOT + 0.05).translate(-0.2, 0, 0));
  g.push(cylY(0.32, -5.0 + UY, BOT + 0.05).translate(0.7, 0, 1.1));
  g.push(cylY(0.32, -4.75 + UY, BOT + 0.05).translate(-1.7, 0, -0.8));
  g.push(tubeY(0.4, 0.2, -4.45 + UY, BOT + 0.05).translate(1.2, 0, 0));
  for (const z of [-1.35, 1.35]) g.push(rbox(0.5, 1.15, 0.36, 0.1).translate(1.8, -4.52 + UY, z));
  const casting = mk(merge(g), cast);
  // the machined face the bowl gasket seals on, and the brass needle valve seat in its boss
  const bowlFace = mk(rbox(5.8, 0.02, 6.1, 0.008).translate(-0.45, BOT - 0.005, 0), machined);
  const seat = mk(tubeY(0.22, 0.1, -4.49 + UY, -4.15 + UY).translate(1.2, 0, 0), brass);
  // 2 short plain round spigots (outer r 2.4 = 0.25 H across), a thin bead near each lip, machined end faces
  const SP = 4.25;
  const spigots = mk(merge([
    latheX([[2.5, 2.4], [SP - 0.3, 2.4], [SP - 0.25, 2.52], [SP - 0.08, 2.52], [SP - 0.03, 2.4], [SP, 2.36], [SP, BORE_R + 0.05], [2.5, BORE_R + 0.05]]),
    latheX([[-2.5, BORE_R + 0.05], [-SP, BORE_R + 0.05], [-SP, 2.36], [-SP + 0.03, 2.4], [-SP + 0.08, 2.52], [-SP + 0.25, 2.52], [-SP + 0.3, 2.4], [-2.5, 2.4]]),
  ]), cast);
  // the bore itself: machined, brighter than the casting, open to the slide cavity between SX0 and SX1
  const ring = (x0, x1) => latheX([[x0, BORE_R + 0.002], [x1, BORE_R + 0.002], [x1, BORE_R - 0.03], [x0, BORE_R - 0.03]], 64);
  // inside: the cavity's 2 guide faces (machined strips on its engine-side wall, where the 4 rollers run), the needle jet bore in the bore floor
  // (a machined ring round the nozzle's top), the accelerator pump nozzle aimed into the bore toward the engine
  const guides = [-1, 1].map((sz) => rbox(0.02, 6.0, 0.5, 0.008).translate(SX1 - 0.012, 3.2, sz * 2.5));
  const boreM = mk(merge([ring(-SP, SX0), ring(SX1, SP), ...guides, tubeY(0.45, 0.29, -2.02, -1.9).translate(-0.2, 0, 0)]), bore);
  const nozzle = mk(orient(merge([tubeY(0.11, 0.05, 0, 0.55), cylY(0.17, 0, 0.12)]), [0.55, 0.85, 0], [-2.0, -1.93, 0]), brass);
  // throttle shaft across the tower top, its lift lever down to the slide's lug, and on its -Z end (in the cup,
  // under the cable cover) the throttle wheel with its cable groove and the return spring behind it
  const shaft = mk(merge([orient(cylY(0.22, -4.0, 4.0), [0, 0, 1]), rbox(0.22, 2.4, 0.5, 0.08).translate(0.4, -1.05, -0.9)]), steel, SHX, SHY, 0);
  const wheel = latheY([[0, 0], [0, 1.55], [0.04, 1.62], [0.08, 1.62], [0.1, 1.42], [0.16, 1.42], [0.18, 1.62], [0.22, 1.62], [0.26, 1.55], [0.26, 0]]);
  const pulley = mk(merge([orient(wheel, [0, 0, -1]), orient(cylY(0.3, 0, 0.3), [0, 0, -1], [1.1, 1.0, 0.0])]), machined, SHX, SHY, CUPZ + 0.28);
  const rspring = mk(orient(springY(0.26, 0.75, 0.04, 2.5), [0, 0, -1]), steel, SHX, SHY, CUPZ + 0.55);
  const nips = mk(merge(nipG), brass);
  const body = part([0, 0, 0], casting, bowlFace, seat, spigots, boreM, nozzle, shaft, pulley, rspring, nips);
  A.add(body, '1');
  return A;
}
