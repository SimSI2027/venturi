// 13 body: the main casting (part of reference 1), shaped from the 7 photos (run 7): a tall narrow slide tower with
// the bore through it, 2 short plain round spigots (air box -X, engine +X; no bell mouth), bosses for every part.
// Run 8: H = 16.55 cm, top cover (y 8.11) to bowl bottom (y -8.44); bore-axis length 8.5 = 0.51 H. The 2 new photos
// (carb_7 engine side, carb_8 air-box side) put the ENGINE at -X and the AIR BOX at +X (run 7 had them swapped).
import {Asm} from '../lib/asm.js';
import {THREE, rbox, extrudeXY, rpoly, rpolyA, circ, merge, at, latheY, cylY, tubeY, hexY, orient, springY, screwY, fastenerY, tappedY, tappedAt, torsionSpring, mk, part, mm} from './kit.js';

export const BORE_R = mm(19.5); // run 9: the 39 bore (sketch units, baked into mm by toMM)
// run 8 proportions (carb_7, along the bore), H = top cover to bowl bottom = 16.55 (the bore ring, 4.8 across, is
// 0.29 H): the top cover's top at +8.11 (0.49 H above the bore centre), the bowl joint at -2.48 (0.64 H under the
// top), the bowl's belly at -8.44; across Z 3 masses side by side, 0.65 H in all: the cable-wheel housing out to -5.1,
// the slide tower +/-3.3, the sensor housing out to +5.6
export const HT = {top: 8.11, joint: -2.48, bottom: -8.44};
// run 11 (item 4, correction 21): B = 63.5 from the engine spigot's face (-X) to the body's own air-box face, where
// the air-box adapter ring (50 across) bolts on as a separate step about 11 deep; run 10's body ran 70.3 to there
export const ENG_FACE = -4.0, BODY_AF = ENG_FACE + mm(63.5), ADAPT = BODY_AF + mm(11);
export const TOWER = {x0: -2.2, x1: 1.8, z: 3.3, top: 7.3}; // the slide tower; the lower block is x +/-2.6
export const BOLT_X = 2.35; // run 14: the top cover's 2 bolts sit this far either side of the tower's middle, in 2 threaded bosses
export const BOT = HT.joint; // the body's underside: the float chamber gasket face
export const UY = 1.52; // the underside's bosses and every part under them, built for BOT -4.0, lifted with it
// throttle shaft (x, y), across the tower along Z; run 11 (item 7, round 1): 1.1 toward the air box (was -0.2), where
// the owner's cable side (mine_4: the wheel) and sensor side (mine_2: the TPS hub) both put it, 12-17 mm off
export const SHAFT = [0.9, 5.6];
export const SLIDE_LUG = [0.2, 3.35]; // the slide's lug the link arm (Keihin 16) lifts
export const LINK = [0.75, -1.7]; // run 10: the pump linkage's pivot (x, y), along Z on the cable side under the cable cup
export const CUPZ = -4.4; // the cable-wheel housing's face (the cover's gasket sits on it); run 9: 0.1 in, for the 120.8 width
// the starters on the engine face (carb_7): hot start boss at (x, z) from y0 to top, the cold start arm at armY out to face
export const STARTER = {x: -2.75, z: 1.9, y0: 3.9, top: 6.6, armY: 3.4, face: 5.2}; // run 9 landmarks (carb_7): the knob 70 out, 30 above the bore
// run 14 (item 4): the sensor cover plate's 3 screws (55), the TPS's own Torx screw K241 and the pilot air cover's 2 screws: where they thread into the sensor side
export const PLATE_SCREWS = [[-1.3, 3.8], [3.25, 4.7], [3.25, 0.2]];
export const PILOT_SCREWS = [0, Math.PI].map((a) => [Math.cos(a + 0.5) * 1.55, 2.2 + Math.sin(a + 0.5) * 1.55]);
export const TA25 = (25 * Math.PI) / 180;
export const K241_AT = (() => { const t = Math.PI - TA25; return [SHAFT[0] + 2.15 * Math.cos(t) + 1.0 * Math.sin(t), SHAFT[1] + 2.15 * Math.sin(t) - 1.0 * Math.cos(t)]; })();
export const SENS = 4.75; // the sensor housing: its face at SENS + 0.22, the cover plate's outer face at SENS + 0.65 (run 10: 0.35 out, so the pump cover (-61.2) to the pilot air cover is the table's 120.8 at MM 10.66)
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
/** carb_3 px -> carb (x, y) on the cover's plane. Run 10 (corrections 17-19): fitted to the overlay's carb_3 frame frozen
 * at run 9 (scratch/c3fit.mjs: the camera ray through each px onto the plane z -5.0, affine within 0.07), so the cover is
 * 9% larger than run 9's 48.8 px per unit and its top edge stands at 9.12, about 11 mm above the top cover: from there
 * to the hex plug's foot (-8.87) is the table's 191.8 */
export const c3 = (px, py) => [9.4352 - 0.0222245 * px, 10.6865 - 0.000132878 * px - 0.0223022 * py];
const area = (pts) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);
const SH = C3.map(([px, py]) => [...c3(px, py), 0.2]);
export const SHIELD = area(SH) > 0 ? SH : SH.reverse(); // counter-clockwise, as inset() wants
// the sensor side's flat cover plate outline (59), cut at lower left round the pilot air cover
export const PLATE59 = [[-1.8, 6.9], [3.6, 6.9], [3.6, -0.2], [1.8, -0.2], [1.8, 2.2], [0.6, 3.1], [-1.8, 3.2]];
// the body seen along the bore (traced from carb_7: z, y, corner r), right half from the joint up to the top: the
// lower block round the bore, a ledge at the shoulder, the tower with a rib band and a step in under the top cover;
// the casting is symmetric about the bore's vertical plane, so the left half is its mirror (28 points in all)
const HALF = [[2.7, BOT, 0.5], [3.15, -1.6, 0.4], [3.2, 0.6, 0.3], [3.3, 2.2, 0.2], [3.6, 2.45, 0.12], [3.6, 2.95, 0.12], [3.3, 3.2, 0.15],
  [3.3, 4.5, 0.08], [3.45, 4.6, 0.06], [3.45, 5.0, 0.06], [3.3, 5.1, 0.08], [3.3, 6.2, 0.25], [3.0, 6.55, 0.2], [3.0, 7.3, 0.08]]; // run 26 (item 12): top corner 0.3 -> 0.08, so the 2.7 mm wall keeps a flat gasket face
// the float chamber joint seen from below (traced from carb_12 / carb_bottom: x, z, corner r): a rounded rectangle
// with a screw ear at each corner, a boss bulge at each end; the body's flange and the bowl's lip share it (32 points)
// run 9: the trace stays as run 8 drew it from carb_12 / carb_bottom (74 long along the bore): pressing it to the
// Sudco table's 63.5 (B) put the bowl screws 54 apart where the underside landmarks measure about 84, so B is not this
// run 10 (item 5): the plan rebuilt from views 1 and 3, not carb_12: the 4 screws 63 apart along the bore and 72 across
// (true mm), centred where carb_3 and carb_7 put them (scratch/bowlplan.mjs); 1 affine map of the old trace onto them
const FX = (x) => 1.05518 * x + 0.01333;
const ZM = (z) => 1.0313 * z - 0.0832;
/** The same map for the bowl's own plan outlines ([x, z, r?]). */
export const PLAN = (p) => [FX(p[0]), ZM(p[1]), ...p.slice(2)];
const FLANGE0 = [[-2.0, -3.4, 0.2], [-0.2, -3.45, 0.3], [1.3, -3.4, 0.2], [1.75, -3.55, 0.15], [2.35, -3.95, 0.35], [2.85, -3.75, 0.35], [2.85, -3.1, 0.25], [2.45, -2.6, 0.15],
  [2.45, -0.8, 0.2], [2.6, 0, 0.4], [2.45, 0.8, 0.2], [2.45, 2.95, 0.15], [2.85, 3.45, 0.25], [2.85, 4.1, 0.35], [2.35, 4.3, 0.35], [1.75, 3.9, 0.15],
  [1.3, 3.75, 0.2], [-0.2, 3.8, 0.3], [-2.0, 3.75, 0.2], [-2.6, 3.9, 0.15], [-3.25, 4.3, 0.35], [-3.75, 4.1, 0.35], [-3.75, 3.45, 0.25], [-3.35, 2.95, 0.15],
  [-3.35, 0.8, 0.2], [-3.45, 0, 0.4], [-3.35, -0.8, 0.2], [-3.35, -2.6, 0.15], [-3.75, -3.1, 0.25], [-3.75, -3.75, 0.35], [-3.25, -3.95, 0.35], [-2.6, -3.55, 0.15]];
// run 9 landmarks (carb_7, carb_12): the sensor side of the joint and its 2 screws 0.7 in
const ZS = (z) => (z > 2.5 ? z - 0.7 : z);
export const FLANGE = FLANGE0.map(([x, z, r]) => [FX(x), ZM(ZS(z)), r]);
// the 4 bowl screws (run 8 overlays: the sensor side 0.35 wider); run 9 (carb_7): their ears are on the bowl's lower
// flange band, under its upper box, so the joint itself has no ears
export const EARS = [[2.35, -3.45], [2.35, 3.8], [-3.25, 3.8], [-3.25, -3.45]].map(([x, z]) => [FX(x), ZM(ZS(z))]);
// run 9: the joint's outline without the ears (24 points: the flange trace with its corner ears cut back), shared by
// the body's flange face, the gasket (25) and the bowl's top lip
export const RIM = [[-2.0, -3.45], [-0.2, -3.5], [1.3, -3.45], [2.0, -3.45], [2.35, -3.3, 0.3], [2.45, -2.9], [2.45, -0.8], [2.6, 0, 0.4], [2.45, 0.8], [2.45, 3.3],
  [2.35, 3.7, 0.3], [2.0, 3.8], [1.3, 3.8], [-0.2, 3.85], [-2.0, 3.8], [-2.9, 3.8], [-3.25, 3.7, 0.3], [-3.35, 3.3], [-3.35, 0.8], [-3.45, 0, 0.4], [-3.35, -0.8],
  [-3.35, -2.9], [-3.25, -3.3, 0.3], [-2.9, -3.45]].map(([x, z, r = 0.2]) => [FX(x), ZM(ZS(z)), r]);
/** An outline in (x, z), extruded along Y (thickness t, centred at y), rounded edges, an optional hole outline. */
export function slabY(pts, y, t, hole = null, r = 0.3) {
  const s = rpolyA(pts, r);
  if (hole) s.holes.push(rpolyA(hole, 0.5, new THREE.Path()));
  return extrudeXY(s, t, 0.08, 16, {free: true}).rotateX(Math.PI / 2).translate(0, y, 0); // run 15 (item 8): corners at 16 steps again
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
    const r = Math.max(0.1, (p[2] ?? 0.3) - d);
    // run 10: collinear neighbours (carb_3's px 380 / 420 / 460) gave 0 / 0 here: the offset point itself
    if (Math.abs(den) < 1e-6 * Math.hypot(adx, ady) * Math.hypot(bdx, bdy)) return [bx, by, r];
    const t = ((bx - ax) * bdy - (by - ay) * bdx) / den;
    return [ax + adx * t, ay + ady * t, r];
  });
}
/** An outline (x, y) extruded along Z, centred at z, depth dz, with optional holes (outlines or [x, y, r] circles). */
export function slabZ(pts, z, dz, holes = [], r = 0.3) {
  const s = rpoly(pts, r);
  for (const h of holes) s.holes.push(h.length === 3 && typeof h[0] === 'number' ? circ(...h) : rpoly(h, r * 0.7, new THREE.Path()));
  return extrudeXY(s, dz, 0.06, dz < 0.15 ? 3 : 8, {free: true, bevelSegments: dz < 0.15 ? 1 : 2}).translate(0, 0, z); // run 13: thin gaskets and shims: fewer arc and bevel steps
}

/** An outline in (z, y), extruded along X from x0 to x1 with rounded edges, the bore cut through. */
function outlineX(pts, x0, x1, holeR) {
  const s = rpolyA(pts, 0.3);
  // run 14 (triangle budget): the bore's circle is 72 explicit points (not counted by curveSegments), the outline's rounded corners 8 steps (run 15, item 8: 16)
  if (holeR) { const h = new THREE.Path(); for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; i ? h.lineTo(Math.cos(a) * holeR, Math.sin(a) * holeR) : h.moveTo(Math.cos(a) * holeR, Math.sin(a) * holeR); } h.closePath(); s.holes.push(h); }
  const g = extrudeXY(s, x1 - x0, 0.12, 16, {free: true});
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
const SX0 = -0.95, SX1 = 0.55, SZ = 2.75, SY = -1.9; // run 15 (item 5): the cavity runs down to the bore's floor (-BORE_R), so the slide can sit fully down and close the bore
/** The body's section across the cavity: the outline with the slot (narrower under the top cover) and the bore's
 * lower half cut out of it, extruded along X. */
function cavitySection() {
  // run 26 (item 12, manual 6-6 'throttle valve movement'): the well runs straight up to the gasket face (it narrowed to 2.3 under the top
  // cover), so its side walls are 3.0 - SZ = 2.7 mm thick at the top
  const T = TOWER.top;
  const slot = [[SZ, T, 0.05], [SZ, SY, 0.05]];
  const s = rpolyA([...HALF, ...slot, ...mirror(slot), ...mirror(HALF)], 0.3);
  const g = extrudeXY(s, SX1 - SX0, 0.08, 16, {free: true});
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
  for (const [x0, x1] of [[-2.6, SX0], [SX1, BODY_AF]]) g.push(outlineX(LOW, x0, x1, BORE_R));
  for (const [x0, x1] of [[TX0, SX0], [SX1, TX1]]) g.push(outlineX(OUTLINE, x0, x1, BORE_R + 0.05));
  g.push(cavitySection());
  // run 26 (item 12): the well's 4 plan corners rounded to 4 mm: a concave fillet column in each, from the bore's top to the gasket face
  const FR = mm(4);
  for (const [cx, cz, sx, sz] of [[SX0, -SZ, 1, 1], [SX1, -SZ, -1, 1], [SX1, SZ, -1, -1], [SX0, SZ, 1, -1]]) {
    const f = new THREE.Shape();
    f.moveTo(0, 0); f.lineTo(FR, 0);
    for (let k = 1; k < 8; k++) { const a = (k / 8) * (Math.PI / 2); f.lineTo(FR - FR * Math.sin(a), FR - FR * Math.cos(a)); }
    f.lineTo(0, FR); f.closePath();
    const col = new THREE.ExtrudeGeometry(f, {depth: TT - BORE_R + 0.02, bevelEnabled: false, curveSegments: 8});
    // shape (u, v) -> plan (x, z) = (cx + sx u, cz + sz v); depth along y from the bore's top
    col.rotateX(-Math.PI / 2).scale(sx, 1, -sz).translate(cx, BORE_R - 0.01, cz);
    const cg = col.index ? col.toNonIndexed() : col;
    if (sx * sz > 0) for (const k of ['position', 'normal', 'uv']) { // the scale's determinant -sx sz < 0 flips the winding: swap 2 corners
      const a = cg.attributes[k], n = a.itemSize;
      for (let t = 0; t < a.count; t += 3) for (let j = 0; j < n; j++) { const v = a.array[(t + 1) * n + j]; a.array[(t + 1) * n + j] = a.array[(t + 2) * n + j]; a.array[(t + 2) * n + j] = v; }
    }
    g.push(cg);
  }
  // the tower's ribs and bosses (carb_7, carb_8, carb_11): the top cover's 2 bolt bosses down the middle of the
  // engine and air-box faces, 2 vertical ribs on the engine face, 2 round bosses on the air-box face, a rib band
  // round both faces at the outline's band height
  const CX = (TX0 + TX1) / 2;
  // run 14 (item 2): each boss is tapped for the cover's M4 bolt (3): 10 mm deep, the thread's rings in the hole
  for (const sx of [-1, 1]) g.push(tappedY(0.5, mm(1.85), 4.9, TT, mm(11)).translate(CX + sx * BOLT_X, 0, 0));
  for (const z of [-1.4, -2.5]) g.push(rbox(0.5, 3.6, 0.36, 0.12).translate(TX0 - 0.1, 4.6, z));
  for (const z of [-2.3, 2.3]) g.push(orient(tubeY(0.68, 0.3, 0, 0.8), [1, 0, 0], [TX1 - 0.05, 5.55, z])); // run 9 landmarks (carb_8): 4 out, 4 up; run 13 (item 8, line 3): 0.55 radius, 0.55 out; run 16 (item 7, line 3): 0.68 radius, 0.8 out
  for (const x of [TX0, TX1]) g.push(rbox(0.36, 0.4, 6.7, 0.1).translate(x, 4.8, 0));
  // run 9 (carb_8): the top cover's bolt lug on the tower's air-box face, a tapered block under the cover's tab
  // (run 9 landmarks: under the top cover's lowered air-box bolt, top.js; run 10: 0.39 higher with it)
  g.push(rbox(0.9, 1.5, 1.9, 0.3).translate(CX + 2.2, TT - 1.66, 0), rbox(0.6, 0.9, 1.3, 0.2).translate(CX + 2.55, TT - 1.36, 0)); // run 13 (item 8, line 4): a bigger lug
  // cable side (-Z): the cable-wheel housing, a cup in the shield outline round the throttle wheel, out to CUPZ;
  // the cover (65) closes it
  // run 9 (carb_8): the wheel housing reads curved from the air-box end: its outer rim rounded off (bevel 0.3)
  const cupS = rpolyA(SHIELD, 0.3);
  cupS.holes.push(rpolyA(inset(SHIELD, 0.35), 0.21, new THREE.Path()));
  // run 11: bevel 0.1 (was 0.3): on the 0.35 wall a 0.3 bevel from both the outline and the hole crossed, and the
  // cup triangulated as a solid face over the throttle wheel at the cover's plane (since run 9)
  // run 12 (item 6): the 2 cover bolt bosses in the housing, where the cover's bolts (70, linkage.js) go in: the upper one
  // at the engine side, the lower one in the lobe toward the air box; hollow, from the floor out to the cover's gasket face
  for (const [bx, by] of [c3(495, 160), c3(345, 445)]) g.push(orient(tappedY(0.5, mm(2.4), 0, -CUPZ - TZ - 0.1, 0.85), [0, 0, -1], [bx, by, -TZ])); // run 14: M5 tapped, 9 mm deep
  // run 14 (item 7, cmp_4): the pocket is 8 mm deep (floor face at -3.65, rim at the cover's face -4.4) with a rib along its wall: a ledge
  // 0.23 wide and 3.6 mm high on the wall's inner face, standing from the floor
  g.push(slabZ(SHIELD, -3.5, 0.3), slabZ(inset(SHIELD, 0.35), -3.82, 0.34, [inset(SHIELD, 0.58)], 0.3), extrudeXY(cupS, -CUPZ - TZ, 0.1, 16, {free: true}).translate(0, 0, (CUPZ - TZ) / 2));
  // sensor side (+Z): the sensor housing in the plate's outline, out to SENS + 0.22, where the flat cover plate (59)
  // and its gasket (61) sit
  const SF = SENS + 0.22;
  g.push(slabZ(PLATE59, (TZ - 0.1 + SF) / 2, SF - TZ + 0.1, [[SHX, SHY, 1.1], ...PLATE_SCREWS.map(([x, y]) => [x, y, 0.3])], 0.4));
  // run 14 (item 4): the plate's 3 screws (M3) thread into blind holes in this housing (6 mm deep, thread 2.8 mm across), each hole
  // a plug that fills the slab's hole: solid at the bottom, tapped from the face
  for (const [x, y] of PLATE_SCREWS) g.push(tappedAt(0.3, 0.125, 0, 1.2, 0.6, [0, 0, 1], [x, y, SF - 1.2]));
  // the pilot air cover's 2 ears sit over empty housing (the plate is cut there): 2 tapped lugs from the housing's back to its face
  for (const [x, y] of PILOT_SCREWS) g.push(tappedAt(0.45, 0.125, 0, SF - TZ, 0.6, [0, 0, 1], [x, y, TZ]));
  // bosses: throttle shaft both sides (the +Z one through the plate: the TPS O-ring 62 sits on it), pilot air face
  // (out to the housing's face, under the plate's cut corner)
  g.push(tappedAt(1.0, 0.115, 0, SF + 0.4 - TZ, 1.0, [0, 0, 1], [SHX, SHY, TZ])); // run 14: the shaft boss is tapped for the TPS screw (36)
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
  // run 26 (item 11): its top stops at the engine spigot's outside (y -RE): from y -0.68 it stood 12 mm up into the bore, where 42 of 315 rays
  // along the bore stopped
  g.push(rbox(0.95, 0.85, 1.4, 0.3).translate(-3.95, -3.05 + 0.85 / 2, 0));
  g.push(tubeY(0.45, 0.17, -4.6 + UY, -3.9 + UY).translate(-3.95, 0, 0));
  // run 15 (item 2): the 4 bowl screws thread up into 4 tapped holes in the flange (M4: thread 7.4 mm across, 8 mm deep, open at
  // the bottom), each in a round boss at the flange's corner: no posts
  // run 26 (item 15, mine_1 / mine_3 / mine_6): flush ears, not round posts: each a rounded-square lobe of the flange on the bowl ear's own
  // footprint (bowl.js), flush with the mating face and 7.5 mm thick, the M4 tapped through it (7 mm of the screw's 12)
  for (const [ex, ez] of EARS) {
    const sx = ex > -0.5 ? 1 : -1, sz = ez > 0 ? 1 : -1, x0 = ex - sx * 0.35, x1 = ex + sx * 0.6, z0 = ez - sz * 0.35, z1 = ez + sz * 0.6;
    const q = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
    if (sx * sz < 0) q.reverse();
    const s = rpolyA(q, 0.4);
    s.holes.push(circ(ex, ez, 0.3));
    g.push(extrudeXY(s, 0.7, 0.06, 12, {free: true}).rotateX(Math.PI / 2).translate(0, BOT + 0.35, 0), tappedY(0.3, mm(1.85), 0, 0.7, 0.66).rotateX(Math.PI).translate(ex, BOT + 0.7, ez));
  }
  // float chamber mating flange: its face at y BOT sits on the bowl gasket (25)
  g.push(slabY(RIM, BOT + 0.2, 0.4));
  // the projection on the engine spigot (-X) that keys into the joint slot
  g.push(rbox(0.5, 0.4, 0.6, 0.12).translate(-3.3, 2.5, 0));
  // vent nipples (57, 58) on the tower's engine face, near the top
  const nipG = [-1.6, 1.6].map((z) => orient(tubeY(0.22, 0.12, 0, 0.9), [1, 0, 0], [TX1 - 0.05, 6.6, z]));
  // the underside (every fitted jet sits in its own boss): the main jet tower round the needle jet (open below:
  // spacer and main jet hex show), the pilot jet and starter jet bosses, the needle valve seat boss, the 2 float
  // pin posts either side of the float's hinge
  // run 26 (item 13, manual 6-2 and carb_main): the main jet tower closes at the joint round the needle jet's bore (17 passes through it,
  // 0.28 across its tube), the hex of 17 and the spacer below inside the tower
  g.push(tubeY(0.98, 0.8, -5.2 + UY, BOT + 0.05).translate(-0.2, 0, 0), tubeY(0.8, 0.31, BOT - 0.2, BOT + 0.05).translate(-0.2, 0, 0));
  // the pilot jet (18) and starter jet (19) each in its own threaded boss, tapped 8 mm up from the boss's foot (were solid cylinders)
  for (const [x, z, y0, r, hr] of [[0.7, 1.1, -5.0 + UY, 0.42, mm(2.6)], [-1.7, -0.8, -4.75 + UY, 0.36, mm(1.9)]]) { const h = BOT + 0.05 - y0; g.push(tappedY(r, hr, 0, h, Math.min(mm(8), h - 0.1)).rotateX(Math.PI).translate(x, BOT + 0.05, z)); }
  g.push(tubeY(0.4, 0.2, -4.45 + UY, BOT + 0.05).translate(1.2, 0, 0)); // the needle valve seat boss, bored through
  // the 2 float pin posts, each with the pin's cross hole (22 runs along Z at y -3.23, 0.1 across)
  for (const z of [-1.35, 1.35]) g.push(slabZ([[1.55, -3.6], [2.05, -3.6], [2.05, -2.43], [1.55, -2.43]], z, 0.36, [[1.8, -3.23, 0.115]], 0.1));
  // the accelerator pump outlet: a bored stub on the cable side of the joint, over the pump housing (bowl.js PUMP), where its passage goes up
  g.push(tubeY(0.24, 0.1, BOT - 0.25, BOT + 0.05).translate(0.77, 0, -2.75));
  const casting = mk(merge(g), cast);
  // the machined face the bowl gasket seals on, and the brass needle valve seat in its boss
  // run 26 (item 13): the mating face is the flange's rim only (it was a solid 5.9 x 6.0 plate drawn over every boss and hole), in 2 machined
  // bands 0.6 mm proud with the groove gasket 25 (an O-ring loop, RIM to 0.3 in) lies in between them
  const band = (o, h) => { const s = rpolyA(o, 0.2); s.holes.push(rpolyA(h, 0.15, new THREE.Path())); return extrudeXY(s, 0.06, 0.012, 8, {free: true}).rotateX(Math.PI / 2).translate(0, BOT - 0.025, 0); };
  const bowlFace = mk(merge([band(RIM, inset(RIM, 0.06)), band(inset(RIM, 0.3), inset(RIM, 0.42))]), machined);
  // run 26 (item 12): the machined face gasket 2 seals on, round the well, and the tops of the top cover's 2 tapped bolt bosses
  const gS = rpolyA([[TX0 + 0.1, -2.94], [TX1 - 0.1, -2.94], [TX1 - 0.1, 2.94], [TX0 + 0.1, 2.94]], 0.15);
  gS.holes.push(rpolyA([[SX0, -SZ], [SX1, -SZ], [SX1, SZ], [SX0, SZ]], FR, new THREE.Path()));
  // (run 26, item 16: 1.3 mm thick, sunk 0.9 into the casting, so its outer and well edges carry a 0.5 mm chamfer down to the cast)
  const gasketFace = mk(merge([extrudeXY(gS, 0.12, 0.047, 8, {free: true}).rotateX(Math.PI / 2).translate(0, TT - 0.044, 0),
    ...[-1, 1].map((sx) => tubeY(0.48, mm(1.85) + 0.02, TT - 0.004, TT + 0.016).translate(CX + sx * BOLT_X, 0, 0))]), machined);
  // (run 11: the needle valve seat in it is Keihin 36, a piece of 23 in float.js)
  // 2 short plain round spigots, a thin bead near each lip, machined end faces; run 9 real sizes: the engine one (-X)
  // 48 across (Sudco table A), the air-box one (+X) 50 (photos carb_7 / carb_8), 90 spigot face to spigot face
  // run 11 (item 4): the air-box one is the adapter ring, BODY_AF to ADAPT (11), a 3 mm flange step at its root
  // against the body's face, the bead near its lip
  const SP = -ENG_FACE, RE = mm(24), RA = mm(25), BD = mm(1), FL = mm(3), AF = BODY_AF, AD = ADAPT;
  // the ring wall: an annulus (the bore's radius + 0.05 to RA) from the flange's face to the lip, 10 rounded windows (3.2 radial x 2.4 across, at
  // the annulus's middle radius) cut through it: real holes, their floor the flange's face
  const wallS = new THREE.Shape(), ringPts = (r, f) => Array.from({length: 72}, (_, k) => [Math.cos((k / 72) * Math.PI * 2) * r, Math.sin((k / 72) * Math.PI * 2) * r]);
  ringPts(RA, 1).forEach(([x, y], k) => (k ? wallS.lineTo(x, y) : wallS.moveTo(x, y)));
  wallS.closePath();
  const wallHole = new THREE.Path();
  ringPts(BORE_R + 0.05, 1).forEach(([x, y], k) => (k ? wallHole.lineTo(x, y) : wallHole.moveTo(x, y)));
  wallHole.closePath();
  wallS.holes.push(wallHole);
  const WMID = (BORE_R + 0.05 + RA) / 2;
  for (let k = 0; k < 10; k++) {
    const a = ((k + 0.5) * Math.PI * 2) / 10, c = Math.cos(a), sn = Math.sin(a), hl = mm(1.6), hw = mm(1.2);
    const P = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(([u, v]) => [(WMID + u) * c - v * sn, (WMID + u) * sn + v * c, mm(0.9)]);
    wallS.holes.push(rpoly(P, mm(0.9), new THREE.Path()));
  }
  const WX0 = AF + mm(2.5) + 0.05;
  const windowRing = extrudeXY(wallS, AD - 0.03 - WX0, 0.04, 6, {free: true}).rotateY(Math.PI / 2).translate((AD - 0.03 + WX0) / 2, 0, 0);
  const spigots = mk(merge([
    // run 14 (item 8): the adapter is 11 mm deep (AF to AD): the root flange step (2.5 mm), then the ring wall with 10 windows cut
    // through it from the lip down to the flange's face (below), the bead near the lip
    latheX([[AF - 0.05, BORE_R + 0.05], [AF - 0.05, RA + FL - 0.03], [AF, RA + FL], [AF + mm(2.5), RA + FL], [AF + mm(2.5) + 0.03, RA + FL - 0.05], [AF + mm(2.5) + 0.05, RA], [AF + mm(2.5) + 0.05, BORE_R + 0.05]]),
    latheX([[AD - 0.3, RA - 0.03], [AD - 0.3, RA], [AD - 0.25, RA + BD], [AD - 0.08, RA + BD], [AD - 0.03, RA], [AD - 0.03, RA - 0.03]]),
    windowRing,
    // run 13 (item 8, lines 21 44 54 71): a 3 mm flange step at the engine spigot's root, as the adapter has
    latheX([[-2.5, RE - 0.1], [-2.5 - mm(2.5), RE - 0.1], [-2.5 - mm(2.5), RE + FL - 0.05], [-2.5 - mm(2.5) + 0.03, RE + FL], [-2.5, RE + FL]]),
    latheX([[-2.5, BORE_R + 0.05], [-SP, BORE_R + 0.05], [-SP, RE - 0.04], [-SP + 0.03, RE], [-SP + 0.08, RE + BD], [-SP + 0.25, RE + BD], [-SP + 0.3, RE], [-2.5, RE]]),
  ]), machined); // run 13 (item 9): the spigots are machined faces, brighter than the cast
  // run 12 (item 7, mine_1): about 10 radial windows round the adapter ring's end face (dark slots, 3.4 x 1.6 mm, set in the
  // 5.5 mm annulus between the bore and the ring's rim), and 2 small holes at its foot, in the flange step's air-box face
  const rmid = (BORE_R + RA) / 2;
  const wins = merge(Array.from({length: 10}, (_, i) => rbox(0.03, mm(3.0), mm(2.2), 0.02).translate(WX0 + 0.012, WMID, 0).rotateX(((i + 0.5) * Math.PI * 2) / 10 - Math.PI / 2))); // run 14: the dark floor of each window, on the flange's face
  const fx = AF + mm(2.5) + 0.04, fr = RA + FL * 0.55;
  const holes = merge([-1, 1].map((k) => cylY(mm(1.1), 0, 0.03, 0.005).rotateZ(-Math.PI / 2).translate(fx, -fr * Math.cos(k * 0.2), -fr * Math.sin(k * 0.2) * 1)));
  const adapterMarks = mk(merge([wins, holes]), A.M.rubber);
  // the bore itself: machined, brighter than the casting, open to the slide cavity between SX0 and SX1
  const ring = (x0, x1) => latheX([[x0, BORE_R + 0.002], [x1, BORE_R + 0.002], [x1, BORE_R - 0.03], [x0, BORE_R - 0.03]], 64);
  // inside: the cavity's 2 guide faces (machined strips on its engine-side wall, where the 4 rollers run), the needle jet bore in the bore floor
  // (a machined ring round the nozzle's top), the accelerator pump nozzle aimed into the bore toward the engine
  const guides = [-1, 1].map((sz) => rbox(0.02, 6.0, 0.5, 0.008).translate(SX1 - 0.012, 3.2, sz * 2.5));
  const LIP = mm(5); // run 15 (item 8): the bore's wall is bright only within 5 mm of each lip, dark beyond
  const boreM = mk(merge([ring(-SP, -SP + LIP), ring(ADAPT - LIP, ADAPT), ...guides, tubeY(0.45, 0.29, -BORE_R - 0.07, -BORE_R + 0.05).translate(-0.2, 0, 0)]), bore);
  // run 14 (item 8): the air-box half of the bore is dark inside (owner's mine_1: black); the engine half stays bright machined steel
  const boreDark = A.M.bore.clone();
  boreDark.color.set(0x0b0c0e);
  boreDark.metalness = 0.1;
  boreDark.roughness = 0.9;
  const boreD = mk(merge([ring(-SP + LIP, SX0), ring(SX1, ADAPT - LIP)]), boreDark);
  const nozzle = mk(orient(merge([tubeY(0.11, 0.05, 0, 0.55), cylY(0.17, 0, 0.12)]), [0.55, 0.85, 0], [-2.0, -BORE_R + 0.02, 0]), brass);
  // throttle shaft across the tower top, its lift lever down to the slide's lug, and on its -Z end (in the cup,
  // under the cable cover) the throttle wheel with its cable groove and the return spring behind it
  // run 11 (item 3): the shaft (Keihin 12) with its wheel, the link arm (16) with its stop screw (18), the return
  // spring (14) and a washer (15) are pieces of reference 1 with their own meshes, each clickable
  const shaft = mk(orient(cylY(0.22, -4.0, 4.0), [0, 0, 1]), steel);
  // run 11 (item 8, mine_4 with the cover off): 1 round wheel 40 across (68 px at 3.12 px/mm, 8% off for the wheel
  // standing nearer that camera), 6 thick, 2 cable grooves round its rim and 2 cable slots, each with its barrel
  // pocket; an arm off the hub, down toward the engine, its pin holding the return spring (Keihin 14) under the wheel
  const WR = mm(20), WT = mm(4.2), WZ = -3.8; // radius, thickness, the wheel's inner face (run 12: 4.2 thick with the bushing 1.4 proud, as before 6)
  // run 12 (item 6, cmp_4 and mine_4): pale cream (#d9d2b0), 1 stepped rim (full radius for the first 0.2, then 0.15 down),
  // a raised centre bushing with the shaft's end in it
  const prof = [[0, 0], [0, WR - 0.05], [0.04, WR], [0.2, WR], [0.2, WR - 0.15], [WT - 0.04, WR - 0.15], [WT, WR - 0.2], [WT, 0]];
  const wheel = merge([latheY(prof, 64), cylY(0.85, WT - 0.02, WT + 0.13, 0.04), cylY(0.42, WT + 0.12, WT + 0.17, 0.02), cylY(0.48, -0.12, 0)]);
  const SLOTS = [0.38, -0.84]; // the 2 cable slots (rad, from +X): mine_4 shows one at the air-box side, a little up
  const slots = merge(SLOTS.flatMap((a) => [
    rbox(0.5, WT + 0.02, 0.2, 0.04).translate(WR - 0.2, WT / 2, 0).rotateY(-a),
    cylY(0.17, -0.01, WT + 0.01).translate(WR - 0.5, 0, 0).rotateY(-a),
  ]));
  const ARM = [-0.54, 3.34]; // the arm's pin (x, y): mine_4's spring's upper end
  const aL = Math.hypot(ARM[0] - SHX, ARM[1] - SHY), aA = Math.atan2(ARM[1] - SHY, ARM[0] - SHX);
  // run 14 (item 7): the lever below the wheel is black plastic, a paddle from an eye round the shaft to a foot with the pin's hole, between
  // the pocket floor and the wheel (z -3.65 to -3.8)
  const lv = rpoly([[0, -0.42, 0.4], [aL, -0.5, 0.45], [aL, 0.5, 0.45], [0, 0.42, 0.4]], 0.4);
  lv.holes.push(circ(0, 0, 0.23), circ(aL, 0, 0.1));
  const arm = extrudeXY(lv, 0.15, 0.04, 10, {free: true}).rotateZ(aA).translate(0, 0, -3.725 - 0);
  const apin = orient(cylY(0.09, 0, 0.32), [0, 0, -1], [ARM[0] - SHX, ARM[1] - SHY, WZ + 0.07]);
  const cream = A.M.plastic.clone();
  cream.color.set(0xd9d2b0); // pale cream, as the owner's photos show it (run 11's brass was too saturated)
  cream.roughness = 0.55;
  const pulley = mk(orient(wheel, [0, 0, -1], [0, 0, WZ]), cream);
  A.add(part([SHX, SHY, 0], shaft, pulley, mk(orient(slots, [0, 0, -1], [0, 0, WZ]), A.M.rubber), mk(apin, steel), mk(arm, A.M.plastic)), 'K12', {axis: [0, 0, -1]}); // run 15 (item 11): it has a tear-down step now, off toward the cable side
  // the return spring (Keihin 14): from the arm's pin down to a post on the cup's floor, toward the air box (mine_4)
  const POST = [0.6, 2.74], sd = [ARM[0] - POST[0], ARM[1] - POST[1]], sL = Math.hypot(...sd), SZW = WZ - 0.15;
  // run 15 (item 6, Keihin 14): a torsion spring: 4 whole turns round the pivot axis (along z), a straight leg off each end, one bent onto the post and one onto the arm's pin
  // run 16 (item 6): K14 is the coil and its 2 legs only (all the coil's wire radius); the post the lower leg bends onto is the body's, below
  const rsp = torsionSpring(POST, ARM, SZW);
  const rpost = mk(orient(cylY(0.1, 0, 0.5), [0, 0, -1], [POST[0], POST[1], -3.6]), steel);
  // the link arm from the shaft down to the slide's lug (run 11: angled, the shaft now stands 0.7 toward the air box of it)
  const [LGX, LGY] = SLIDE_LUG, LA = Math.atan2(LGX - SHX, SHY - LGY), LL = Math.hypot(LGX - SHX, SHY - LGY) + 0.3;
  // run 14 (item 6, Keihin 16): a flat lever with an eye round the shaft and a forked foot for the slide's lug, the stop screw's hole through it
  const yb = -(LL - 0.15), kS = rpoly([[-0.25, 0.15], [0.25, 0.15], [0.25, yb], [0.13, yb], [0.13, yb + 0.4], [-0.13, yb + 0.4], [-0.13, yb], [-0.25, yb]], 0.05);
  kS.holes.push(circ(0, yb + 0.6, 0.09));
  const kArm = merge([extrudeXY(kS, 0.22, 0.04, 8, {free: true}).rotateY(Math.PI / 2).translate(0, 0, -0.9), orient(tubeY(0.42, 0.23, -0.25, 0.25, 0.03), [0, 0, 1], [0, 0, -0.9])]).rotateZ(LA);
  A.add(part([SHX, SHY, 0], mk(kArm, steel)), 'K16', {axis: [0, 0, 1], legs: [[[0, 0, 1], 1.4], [[0, 1, 0], 0.6]]}); // item 5: -Z ran through the cable wheel, washer and spring; it slides off the shaft's +Z end (1.4 hovers, the end of the shaft plus its eye), then lifts away
  A.add(part([LGX + 0.12, LGY + 0.45, -0.9], mk(orient(fastenerY(0.45, 0.17, 0.08, 0.16, 'cross'), [1, 0, 0]), steel)), 'K18', {axis: [1, 0, 0]});
  A.add(part([0, 0, 0], mk(rsp, steel)), 'K14', {axis: [0, 0, -1]});
  A.add(part([SHX, SHY, -TZ - 0.3], mk(orient(tubeY(0.42, 0.23, 0, 0.06), [0, 0, -1]), steel)), 'K15', {axis: [0, 0, -1]});
  const nips = mk(merge(nipG), brass);
  // run 26 (item 7): pressed into the casting, so they stay at TEAR DOWN step 29; the hover card says so (main.js setHover)
  nozzle.userData.note = 'Accelerator pump nozzle';
  nips.userData.note = 'Air vent nipples (hoses 57, 58)';
  // run 10 (item 7): the accelerator pump linkage as the Keihin FCR-MX diagram draws it (its 64-67, 72), replacing
  // run 9's T-bar: a cast boss on the body's cable side under the cable cup, a pivot pin out of it with a washer at its
  // end, and the 2 torsion springs on the pin (pieces of reference 1, as the T-bar was), one behind each link lever
  // (40 and 41, linkage.js); the thin rod rides with the bowl (bowl.js)
  const [LX, LY] = LINK;
  const pboss = mk(orient(cylY(0.42, 0, 0.32, 0.06), [0, 0, -1], [LX, LY, -2.9]), cast);
  // run 11: its washer (Keihin 69), E-clip (70) and the 2 torsion springs (66, 67) are linkage.js pieces now
  const link = mk(orient(cylY(mm(2.5), 0, 1.4, 0.02), [0, 0, -1], [LX, LY, -3.15]), steel);
  const body = part([0, 0, 0], casting, bowlFace, spigots, boreM, boreD, nozzle, nips, pboss, link, adapterMarks, rpost, gasketFace);
  A.add(body, '1');
  return A;
}
