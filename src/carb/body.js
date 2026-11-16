// 13 body: the main casting (part of reference 1), shaped from the 7 photos (run 7): a tall narrow slide tower with
// the bore through it, 2 short plain round spigots (air box -X, engine +X; no bell mouth), bosses for every part.
// Run 8: H = 16.55 cm, top cover (y 8.11) to bowl bottom (y -8.44); bore-axis length 8.5 = 0.51 H. The 2 new photos
// (carb_7 engine side, carb_8 air-box side) put the ENGINE at -X and the AIR BOX at +X (run 7 had them swapped).
import {Asm} from '../lib/asm.js';
import {THREE, rbox, extrudeXY, rpoly, circ, merge, at, latheY, cylY, tubeY, hexY, orient, springY, mk, part, mm} from './kit.js';

export const BORE_R = mm(19.5); // run 9: the 39 bore (sketch units, baked into mm by toMM)
// run 8 proportions (carb_7, along the bore), H = top cover to bowl bottom = 16.55 (the bore ring, 4.8 across, is
// 0.29 H): the top cover's top at +8.11 (0.49 H above the bore centre), the bowl joint at -2.48 (0.64 H under the
// top), the bowl's belly at -8.44; across Z 3 masses side by side, 0.65 H in all: the cable-wheel housing out to -5.1,
// the slide tower +/-3.3, the sensor housing out to +5.6
export const HT = {top: 8.11, joint: -2.48, bottom: -8.44};
export const TOWER = {x0: -2.2, x1: 1.8, z: 3.3, top: 7.3}; // the slide tower; the lower block is x +/-2.6
export const BOT = HT.joint; // the body's underside: the float chamber gasket face
export const UY = 1.52; // the underside's bosses and every part under them, built for BOT -4.0, lifted with it
export const SHAFT = [-0.2, 5.6]; // throttle shaft (x, y), across the tower along Z
export const CUPZ = -4.4; // the cable-wheel housing's face (the cover's gasket sits on it); run 9: 0.1 in, for the 120.8 width
// the starters on the engine face (carb_7): hot start boss at (x, z) from y0 to top, the cold start arm at armY out to face
export const STARTER = {x: -2.75, z: 1.9, y0: 3.9, top: 6.6, armY: 3.4, face: 5.2}; // run 9 landmarks (carb_7): the knob 70 out, 30 above the bore
export const SENS = 4.4; // the sensor housing: its face at SENS + 0.22, the cover plate's outer face at SENS + 0.65 (run 9: 0.55 in, for the 120.8 width)
export const HOUSE_X = 3.6; // run 9: the sensor housing's air-box face (PLATE59's +X edge), where the star knob sits
// the cable side's flat shield-shaped cover outline (x, y, corner r), seen from -Z: wide top, narrow lobe below;
// run 8 (carb_3): 15% smaller and turned 20 degrees about the throttle shaft, its air-box top corner down, the lobe
// swung toward the engine. shieldXY places anything fixed to the cover (bolts, cable boss, hose nipple, cup plates).
const SHIELD0 = [[4.0, 7.7, 0.9], [-2.9, 7.9, 0.6], [-2.9, 4.4, 0.5], [-1.3, 2.7, 0.6], [-1.0, -0.8, 0.6], [0.45, -1.6, 0.7], [1.9, -0.8, 0.6], [2.4, 2.2, 0.8], [4.1, 6.1, 0.8]];
export function shieldXY(x, y, k = 0.85, a = (-20 * Math.PI) / 180) {
  const dx = x - SHAFT[0], dy = y - SHAFT[1], c = Math.cos(a), s = Math.sin(a);
  return [SHAFT[0] + k * (dx * c - dy * s), SHAFT[1] + k * (dx * s + dy * c)];
}
// run 9: retraced from carb_3 (40 points, photo px; carb_3 looks from -Z, so +X is to the left): a wide rounded shoulder
// at the top, the engine-side edge stepping in under the bracket, narrowing to the lobe round the lower bolt; 48.8 px
// per sketch unit, its top level with the top cover's (y 8.1), so nothing stands above the body
const C3 = [[250, 190], [252, 160], [258, 130], [270, 108], [288, 92], [310, 83], [340, 78], [380, 74], [420, 71], [460, 68], [488, 70], [508, 80], [522, 98],
  [533, 122], [542, 150], [548, 182], [549, 212], [540, 240], [522, 262], [498, 283], [476, 300], [468, 320], [470, 350], [472, 385], [471, 420], [466, 447],
  [452, 463], [430, 470], [400, 472], [372, 470], [350, 462], [332, 452], [320, 435], [316, 410], [308, 385], [296, 355], [282, 322], [268, 290], [258, 255], [252, 222]];
/** carb_3 px -> carb (x, y) on the cover's plane. */
export const c3 = (px, py) => [-(px - 410) / 48.8, 8.1 - (py - 68) / 48.8];
const area = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
const SH = C3.map(([px, py]) => [...c3(px, py), 0.2]);
export const SHIELD = area(SH) > 0 ? SH : SH.reverse(); // counter-clockwise, as inset() wants
// the sensor side's flat cover plate outline (59), cut at lower left round the pilot air cover
export const PLATE59 = [[-1.8, 6.9], [3.6, 6.9], [3.6, -0.2], [1.8, -0.2], [1.8, 2.2], [0.6, 3.1], [-1.8, 3.2]];
// the body seen along the bore (traced from carb_7: z, y, corner r), right half from the joint up to the top: the
// lower block round the bore, a ledge at the shoulder, the tower with a rib band and a step in under the top cover;
// the casting is symmetric about the bore's vertical plane, so the left half is its mirror (28 points in all)
const HALF = [[2.7, BOT, 0.5], [3.15, -1.6, 0.4], [3.2, 0.6, 0.3], [3.3, 2.2, 0.2], [3.6, 2.45, 0.12], [3.6, 2.95, 0.12], [3.3, 3.2, 0.15],
  [3.3, 4.5, 0.08], [3.45, 4.6, 0.06], [3.45, 5.0, 0.06], [3.3, 5.1, 0.08], [3.3, 6.2, 0.25], [3.0, 6.55, 0.2], [3.0, 7.3, 0.3]];
// the float chamber joint seen from below (traced from carb_12 / carb_bottom: x, z, corner r): a rounded rectangle
// with a screw ear at each corner, a boss bulge at each end; the body's flange and the bowl's lip share it (32 points)
// run 9: the trace stays as run 8 drew it from carb_12 / carb_bottom (74 long along the bore): pressing it to the
// Sudco table's 63.5 (B) put the bowl screws 54 apart where the underside landmarks measure about 84, so B is not this
const FX = (x) => x;
const FLANGE0 = [[-2.0, -3.4, 0.2], [-0.2, -3.45, 0.3], [1.3, -3.4, 0.2], [1.75, -3.55, 0.15], [2.35, -3.95, 0.35], [2.85, -3.75, 0.35], [2.85, -3.1, 0.25], [2.45, -2.6, 0.15],
  [2.45, -0.8, 0.2], [2.6, 0, 0.4], [2.45, 0.8, 0.2], [2.45, 2.95, 0.15], [2.85, 3.45, 0.25], [2.85, 4.1, 0.35], [2.35, 4.3, 0.35], [1.75, 3.9, 0.15],
  [1.3, 3.75, 0.2], [-0.2, 3.8, 0.3], [-2.0, 3.75, 0.2], [-2.6, 3.9, 0.15], [-3.25, 4.3, 0.35], [-3.75, 4.1, 0.35], [-3.75, 3.45, 0.25], [-3.35, 2.95, 0.15],
  [-3.35, 0.8, 0.2], [-3.45, 0, 0.4], [-3.35, -0.8, 0.2], [-3.35, -2.6, 0.15], [-3.75, -3.1, 0.25], [-3.75, -3.75, 0.35], [-3.25, -3.95, 0.35], [-2.6, -3.55, 0.15]];
// run 9 landmarks (carb_7, carb_12): the sensor side of the joint and its 2 screws 0.7 in
const ZS = (z) => (z > 2.5 ? z - 0.7 : z);
export const FLANGE = FLANGE0.map(([x, z, r]) => [FX(x), ZS(z), r]);
// the 4 bowl screws (run 8 overlays: the sensor side 0.35 wider); run 9 (carb_7): their ears are on the bowl's lower
// flange band, under its upper box, so the joint itself has no ears
export const EARS = [[2.35, -3.45], [2.35, 3.8], [-3.25, 3.8], [-3.25, -3.45]].map(([x, z]) => [FX(x), ZS(z)]);
// run 9: the joint's outline without the ears (24 points: the flange trace with its corner ears cut back), shared by
// the body's flange face, the gasket (25) and the bowl's top lip
export const RIM = [[-2.0, -3.45], [-0.2, -3.5], [1.3, -3.45], [2.0, -3.45], [2.35, -3.3, 0.3], [2.45, -2.9], [2.45, -0.8], [2.6, 0, 0.4], [2.45, 0.8], [2.45, 3.3],
  [2.35, 3.7, 0.3], [2.0, 3.8], [1.3, 3.8], [-0.2, 3.85], [-2.0, 3.8], [-2.9, 3.8], [-3.25, 3.7, 0.3], [-3.35, 3.3], [-3.35, 0.8], [-3.45, 0, 0.4], [-3.35, -0.8],
  [-3.35, -2.9], [-3.25, -3.3, 0.3], [-2.9, -3.45]].map(([x, z, r = 0.2]) => [FX(x), ZS(z), r]);
/** An outline in (x, z), extruded along Y (thickness t, centred at y), rounded edges, an optional hole outline. */
export function slabY(pts, y, t, hole = null, r = 0.3) {
  const s = rpoly(pts, r);
  if (hole) s.holes.push(rpoly(hole, 0.5, new THREE.Path()));
  return extrudeXY(s, t, 0.08, 10, {free: true}).rotateX(Math.PI / 2).translate(0, y, 0);
}
const mirror = (h) => h.slice().reverse().map(([z, y, r]) => [-z, y, r]);
export const OUTLINE = [...HALF, ...mirror(HALF)];
/** The part of an outline under y = ymax (Sutherland-Hodgman against 1 line); cut corners get a small radius. */
export function clipY(pts, ymax, ymin = -Infinity) {
  const cut = (pts, keep, yc) => {
    const out = [];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      if (keep(p[1])) out.push(p);
      if (keep(p[1]) !== keep(q[1])) out.push([p[0] + ((q[0] - p[0]) * (yc - p[1])) / (q[1] - p[1]), yc, 0.05]);
    });
    return out;
  };
  const top = cut(pts, (y) => y <= ymax, ymax);
  return ymin > -Infinity ? cut(top, (y) => y >= ymin, ymin) : top; // run 9: and above ymin
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
  // the tower's ribs and bosses (carb_7, carb_8, carb_11): the top cover's 2 bolt bosses down the middle of the
  // engine and air-box faces, 2 vertical ribs on the engine face, 2 round bosses on the air-box face, a rib band
  // round both faces at the outline's band height
  const CX = (TX0 + TX1) / 2;
  for (const sx of [-1, 1]) g.push(cylY(0.5, 4.9, TT, 0.1).translate(CX + sx * 2.35, 0, 0));
  for (const z of [-1.4, -2.5]) g.push(rbox(0.5, 3.6, 0.36, 0.12).translate(TX0 - 0.1, 4.6, z));
  for (const z of [-2.3, 2.3]) g.push(orient(tubeY(0.45, 0.2, 0, 0.35), [1, 0, 0], [TX1 - 0.05, 5.55, z])); // run 9 landmarks (carb_8): 4 out, 4 up
  for (const x of [TX0, TX1]) g.push(rbox(0.36, 0.4, 6.7, 0.1).translate(x, 4.8, 0));
  // run 9 (carb_8): the top cover's bolt lug on the tower's air-box face, a tapered block under the cover's tab
  // (run 9 landmarks: under the top cover's lowered air-box bolt, top.js)
  g.push(rbox(0.75, 1.3, 1.5, 0.3).translate(CX + 2.15, TT - 1.95, 0), rbox(0.5, 0.8, 1.1, 0.2).translate(CX + 2.45, TT - 1.7, 0));
  // cable side (-Z): the cable-wheel housing, a cup in the shield outline round the throttle wheel, out to CUPZ;
  // the cover (65) closes it
  // run 9 (carb_8): the wheel housing reads curved from the air-box end: its outer rim rounded off (bevel 0.3)
  const cupS = rpoly(SHIELD, 0.3);
  cupS.holes.push(rpoly(inset(SHIELD, 0.35), 0.21, new THREE.Path()));
  g.push(slabZ(SHIELD, -TZ - 0.15, 0.3), extrudeXY(cupS, -CUPZ - TZ, 0.3, 12, {free: true}).translate(0, 0, (CUPZ - TZ) / 2));
  // sensor side (+Z): the sensor housing in the plate's outline, out to SENS + 0.22, where the flat cover plate (59)
  // and its gasket (61) sit
  const SF = SENS + 0.22;
  g.push(slabZ(PLATE59, (TZ - 0.1 + SF) / 2, SF - TZ + 0.1, [[SHX, SHY, 1.1]], 0.4));
  // bosses: throttle shaft both sides (the +Z one through the plate: the TPS O-ring 62 sits on it), pilot air face
  // (out to the housing's face, under the plate's cut corner)
  g.push(orient(cylY(1.0, 0, SF + 0.4 - TZ), [0, 0, 1], [SHX, SHY, TZ]));
  g.push(orient(cylY(0.6, 0, 0.2), [0, 0, -1], [SHX, SHY, -TZ - 0.1]));
  g.push(orient(cylY(1.3, 0, SF - TZ), [0, 0, 1], [0, 2.2, TZ]));
  // the starters on the tower's engine face (carb_7): the hot start's vertical boss, 0.20 H tall with its cap
  // (starters.js), a wide foot, a thread collar at the top, a web back to the tower; out of its foot the cold start's
  // cast side arm along +Z (0.15 H to the end of the pull knob)
  g.push(latheY([[STARTER.y0, 0], [STARTER.y0, 0.78], [STARTER.y0 + 0.15, 0.85], [STARTER.y0 + 0.7, 0.85], [STARTER.y0 + 0.85, 0.64], [STARTER.top - 0.3, 0.6], [STARTER.top - 0.25, 0.7], [STARTER.top, 0.7], [STARTER.top, 0.32], [STARTER.top - 1.9, 0.32], [STARTER.top - 1.9, 0]]).translate(STARTER.x, 0, STARTER.z)); // bored for the plunger
  g.push(rbox(0.7, STARTER.top - STARTER.y0 - 0.4, 0.35, 0.12).translate(STARTER.x + 0.35, (STARTER.top + STARTER.y0) / 2, STARTER.z));
  g.push(orient(merge([cylY(0.45, STARTER.z, STARTER.face, 0.06), cylY(0.53, STARTER.face - 0.25, STARTER.face, 0.06)]), [0, 0, 1], [STARTER.x, STARTER.armY, 0]));
  // pilot screw: a lug under the engine spigot (-X), outside the bowl's lip, with a bored boss; its O-ring (51)
  // shows under it
  g.push(rbox(0.95, 1.9, 1.4, 0.3).translate(-3.95, -3.15 + UY, 0));
  g.push(tubeY(0.45, 0.17, -4.6 + UY, -3.9 + UY).translate(-3.95, 0, 0));
  // float chamber mating flange: its face at y BOT sits on the bowl gasket (25)
  g.push(slabY(RIM, BOT + 0.2, 0.4));
  // the projection on the engine spigot (-X) that keys into the joint slot
  g.push(rbox(0.5, 0.4, 0.6, 0.12).translate(-3.3, 2.5, 0));
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
  const bowlFace = mk(rbox(5.9, 0.02, 6.0, 0.008).translate(-0.45, BOT - 0.005, -0.2), machined);
  const seat = mk(tubeY(0.22, 0.1, -4.49 + UY, -4.15 + UY).translate(1.2, 0, 0), brass);
  // 2 short plain round spigots, a thin bead near each lip, machined end faces; run 9 real sizes: the engine one (-X)
  // 48 across (Sudco table A), the air-box one (+X) 50 (photos carb_7 / carb_8), 90 spigot face to spigot face
  const SP = 4.25, RE = mm(24), RA = mm(25), BD = mm(1);
  const spigots = mk(merge([
    latheX([[2.5, RA], [SP - 0.3, RA], [SP - 0.25, RA + BD], [SP - 0.08, RA + BD], [SP - 0.03, RA], [SP, RA - 0.04], [SP, BORE_R + 0.05], [2.5, BORE_R + 0.05]]),
    latheX([[-2.5, BORE_R + 0.05], [-SP, BORE_R + 0.05], [-SP, RE - 0.04], [-SP + 0.03, RE], [-SP + 0.08, RE + BD], [-SP + 0.25, RE + BD], [-SP + 0.3, RE], [-2.5, RE]]),
  ]), cast);
  // the bore itself: machined, brighter than the casting, open to the slide cavity between SX0 and SX1
  const ring = (x0, x1) => latheX([[x0, BORE_R + 0.002], [x1, BORE_R + 0.002], [x1, BORE_R - 0.03], [x0, BORE_R - 0.03]], 64);
  // inside: the cavity's 2 guide faces (machined strips on its engine-side wall, where the 4 rollers run), the needle jet bore in the bore floor
  // (a machined ring round the nozzle's top), the accelerator pump nozzle aimed into the bore toward the engine
  const guides = [-1, 1].map((sz) => rbox(0.02, 6.0, 0.5, 0.008).translate(SX1 - 0.012, 3.2, sz * 2.5));
  const boreM = mk(merge([ring(-SP, SX0), ring(SX1, SP), ...guides, tubeY(0.45, 0.29, -BORE_R - 0.07, -BORE_R + 0.05).translate(-0.2, 0, 0)]), bore);
  const nozzle = mk(orient(merge([tubeY(0.11, 0.05, 0, 0.55), cylY(0.17, 0, 0.12)]), [0.55, 0.85, 0], [-2.0, -BORE_R + 0.02, 0]), brass);
  // throttle shaft across the tower top, its lift lever down to the slide's lug, and on its -Z end (in the cup,
  // under the cable cover) the throttle wheel with its cable groove and the return spring behind it
  const shaft = mk(merge([orient(cylY(0.22, -4.0, 4.0), [0, 0, 1]), rbox(0.22, 2.4, 0.5, 0.08).translate(0.4, -1.05, -0.9)]), steel, SHX, SHY, 0);
  const wheel = latheY([[0, 0], [0, 1.33], [0.04, 1.39], [0.08, 1.39], [0.1, 1.22], [0.16, 1.22], [0.18, 1.39], [0.22, 1.39], [0.26, 1.33], [0.26, 0]]); // run 8: 14% smaller, inside the smaller cover
  const pulley = mk(merge([orient(wheel, [0, 0, -1]), orient(cylY(0.3, 0, 0.3), [0, 0, -1], [0.9, 0.8, 0.0])]), machined, SHX, SHY, CUPZ + 0.28);
  const rspring = mk(orient(springY(0.26, 0.75, 0.04, 2.5), [0, 0, -1]), steel, SHX, SHY, CUPZ + 0.55);
  const nips = mk(merge(nipG), brass);
  // run 9: the accelerator pump's link lever (was drawn in 45), at the foot of the cable cup over the pump rod's top
  const lever = mk(rbox(1.9, 0.5, 0.18, 0.06).translate(0.6, -0.75, -3.85), steel);
  const body = part([0, 0, 0], casting, bowlFace, seat, spigots, boreM, nozzle, shaft, pulley, rspring, nips, lever);
  A.add(body, '1');
  return A;
}
