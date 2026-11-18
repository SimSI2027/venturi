// 9 bowl: the float chamber (piece of reference 1), its gasket (25), screws (5), drain plug (26), bottom plug (38) with
// O-ring (37). Comes off downward.
// Run 9, rebuilt from carb_7, carb_12, carb_bottom and the Keihin FCR-MX diagram (its float chamber 49: a box with the
// screws at its lower corners): no cylinder or lofted pillow; every casting piece is a traced outline extruded with
// rounded edges. From the joint down (carb_7, mm under the bore centre): an upper box (-26..-47) in the joint's outline,
// the flange band stepping out (-47..-54) with an ear at each corner for the 4 M4 x 12 screws (heads at -56), a
// shallow flat-bottomed belly (-54..-73) stepped twice (a shallow end toward the air box, a deeper floor under the
// jets), the round hex-plug boss with its curled passage (-73..-80), the drain nipple at the engine end, the pump
// housing lobe on the cable side under the round 3-screw pump cover (pump.js). Built in carb space (sketch units).
import {Asm} from '../lib/asm.js';
import {THREE, merge, tubeY, latheY, ringsUp, hexY, orient, oring, screwY, fastenerY, tappedY, extrudeXY, rpolyA, circ, hose, rbox, mk, part, mm, M4_HOLE} from './kit.js';
import {HT, RIM, EARS, PLAN, inset} from './body.js';

// heights (carb space): the joint, the top lip under the gasket, the flange band, the belly's 2 floors, the boss
export const BY = {lip: HT.joint - 0.1, band: -4.45, ear: -5.05, shallow: -6.4, deep: -7.35, boss: -8.42};
BY.earBot = BY.lip - mm(4); // run 15 (item 2): the 4 screw ears are 4 mm thick tabs at the joint (M4 x 12 = ear 4 + gasket 1 + 7 into the body's tapped holes) // run 10: deep floor 0.3 and plug boss 0.42 lower (carb_7: boss foot 90 under the bore)
// run 10 (item 5): placed from the 4 screws of views 1 and 3, each keeping only its place relative to the screws in
// carb_12 (scratch/bowlplan.mjs: carb_12's px cast onto the plane at the part's own height)
export const PUMP = [0.77, -3.7]; // the pump's axis (x, z): its housing lobe out of the belly's cable side
export const PYW = -6.6; // the pump housing's face (carb space): the cover (pump.js) sits under it
export const PUMP_EARS = [0.55, 2.85, 4.95].map((a) => [PUMP[0] + Math.cos(a) * 1.85, PUMP[1] + Math.sin(a) * 1.85]); // the pump cover's 3 screws (pump.js)
export const DRAIN = [-2.16, -0.07]; // the drain nipple (x, z), pointing down out of the deep floor near the engine end
export const DRAIN_END = [-3.37, -8.66, 0.76]; // the drain pipe's end (carb_7): the pipe angles out from the nipple to it
const PLUG = [0.32, 0.1]; // the bottom plug under the main jet (0.2 toward the sensor side of its place from the screws: carb_7)
const DSCR = [1.46, 0.74]; // the drain screw (26) in its boss on the shallow end

/** An outline in (x, z) extruded from y0 down to y1 with rounded edges (bevel b), an optional hole outline. */
function tier(pts, y0, y1, b = 0.12, hole = null, r = 0.25, rounds = []) {
  const s = rpolyA(pts, r);
  if (hole) s.holes.push(rpolyA(hole, Math.max(0.1, r - 0.15), new THREE.Path()));
  for (const [x, z, hr] of rounds) s.holes.push(circ(x, z, hr)); // run 14: round through-holes
  return extrudeXY(s, y0 - y1, b, y0 - y1 < 0.2 ? 8 : 16, {free: true}).rotateX(Math.PI / 2).translate(0, (y0 + y1) / 2, 0);
}
/** n points of an arc round (cx, cz), radius r, from angle a0 to a1 (radians), corner radius cr. */
const arc = (cx, cz, r, a0, a1, n, cr = 0.1) => Array.from({length: n}, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / (n - 1);
  return [cx + Math.cos(a) * r, cz + Math.sin(a) * r, cr];
});

// (run 9: belly and deep step drawn for the 63.5 flange, stretched back to the 74 one along X)
// the belly's plan (24 points, carb_12: a rounded rectangle inside the band, its engine end bulged round the drain)
const BELLY = [[-2.73, -2.95], [-1.68, -2.98], [-0.51, -3.0], [0.31, -2.98], [1.13, -2.95], [1.59, -2.8, 0.35], [1.77, -2.4], [1.83, -1.0], [1.88, 0, 0.4], [1.83, 1.0],
  [1.77, 2.2], [1.59, 2.6, 0.35], [1.13, 2.7], [0.31, 2.72], [-0.51, 2.75], [-1.68, 2.72], [-2.73, 2.7], [-3.13, 2.55, 0.35], [-3.25, 2.2], [-3.25, 1.0],
  [-3.37, 0.3, 0.45], [-3.25, -0.4], [-3.25, -2.4], [-3.13, -2.8, 0.35]].map(PLAN);
// the deeper step under the jets and the plug (the shallow end toward the air box stays up at BY.shallow)
const DEEP = [[-2.78, -2.7], [-1.09, -2.75], [0.43, -2.7], [0.78, -2.4, 0.35], [0.83, -1.0], [0.87, 0, 0.3], [0.83, 1.0], [0.78, 2.2, 0.35], [0.43, 2.45], [-1.09, 2.5],
  [-2.78, 2.45], [-3.02, 2.2, 0.35], [-3.08, 1.0], [-3.13, 0.3, 0.35], [-3.08, -1.0], [-3.02, -2.4, 0.35]].map(PLAN);

// run 27 (item 8): the chamber's one inner outline (the belly's, 3 mm in), the flat floor's top, and the accelerator jet's column (x, z, top y): up
// the cable-side wall under the body's pump outlet stub (body.js, x 0.77 z -2.75), 77 seated in its top
// (round 1: its engine end held at x -3.08, so the inner land round it keeps 1.6 mm or more: at 0.7 mm the land's hole triangulated solid)
export const CH = inset(BELLY, 0.28).map(([x, z, r]) => [Math.max(x, -3.08), z, r]);
export const FL = BY.shallow + 0.32;
export const AJ = [0.77, -2.75, -3.2];
/** Run 12 (item 8, cmp_2): the belly narrows toward the drain: its outline scales about the drain nipple, from 1 at the
 * flange band's foot (BY.ear) to 0.9 at the shallow floor and 0.8 at the deep one. The side walls are single quads from
 * ring to ring, so moving the ring vertices tapers them in a straight line; the flange band and its screws stay put. */
const TAPER = (y) => (y >= BY.ear ? 1 : y >= BY.shallow ? 1 - (0.1 * (BY.ear - y)) / (BY.ear - BY.shallow) : Math.max(0.8, 0.9 - (0.1 * (BY.shallow - y)) / (BY.shallow - BY.deep)));
function taper(g) {
  const p = g.attributes.position, [dx, dz] = DRAIN;
  for (let i = 0; i < p.count; i++) {
    const f = TAPER(p.getY(i));
    p.setX(i, dx + (p.getX(i) - dx) * f);
    p.setZ(i, dz + (p.getZ(i) - dz) * f);
  }
  g.computeVertexNormals();
  return g;
}

export function buildBowl(index) {
  const A = new Asm('bowl', 'Bowl', {offset: [0, -11.0, 0], index});
  const {cast, machined, rubber, steel, zinc, brass} = A.M;
  const BOX = inset(RIM, 0.1);
  const [PX, PZ] = PUMP, [DX, DZ] = DRAIN, [QX, QZ] = PLUG, [SX, SZ] = DSCR;
  // the plug boss: round under the hex plug; the cast passage curls round it from the pump side past the air-box
  // side to the drain screw's boss (carb_12, carb_bottom)
  const BOSS = arc(QX, QZ, 1.3, 0, Math.PI * 2 * (23 / 24), 24, 0.1);
  const PASS = [...arc(QX, QZ, 1.68, -Math.PI * 0.62, Math.PI * 0.3, 10, 0.1), [SX + 0.35, SZ + 0.15, 0.2], ...arc(QX, QZ, 1.18, Math.PI * 0.3, -Math.PI * 0.62, 10, 0.1)];
  const DSB = arc(SX, SZ, 0.5, 0, Math.PI * 2 * (11 / 12), 12, 0.05);
  // the pump housing: a D-shaped lobe out of the belly's cable side (its round edge outboard)
  const LOBE = [...arc(PX, PZ, 1.6, Math.PI * 1.02, Math.PI * 1.98, 14, 0.1), [PX + 1.55, -2.6, 0.3], [PX - 1.55, -2.6, 0.3]];
  // the drain nipple's round boss under the deep floor and the pump rod's guide up the cable side wall (with the pump)
  const NIPB = arc(DX, DZ, 0.5, 0, Math.PI * 2 * (11 / 12), 12, 0.05);
  const RG = [[0.5, -3.35], [1.1, -3.35], [1.15, -3.75, 0.2], [0.9, -4.05, 0.15], [0.55, -3.75, 0.2]].map(([x, z, r]) => [x + 0.77, z - 0.3, r]);
  // run 14 (item 4): 3 threaded bosses hanging under the pump housing's face for the pump cover's 3 screws (M4: thread 7.4 mm
  // across, 8 mm deep, open at the bottom)
  const PBOSS = PUMP_EARS.map(([x, z]) => tappedY(0.45, mm(1.85), 0, 0.9, mm(8)).rotateX(Math.PI).translate(x, PYW + 0.7, z));
  const g = merge([
    // run 26 (round 1, D2 line 8): bevel 0.08 -> 0.03: on this 0.1 wide ring the 2 bevels crossed and it triangulated solid, closing the chamber
    // run 27 (item 4, bowl_4 / bowl_6): the rim is 2 lands either side of the groove gasket 25 lies in (RIM 0.12 to 0.28 in, 1.3 mm deep)
    tier(RIM, BY.lip, BY.lip - 0.3, 0.03, inset(RIM, 0.12)), // the outer land, in the joint's outline
    // run 27 (item 8, bowl_1 / bowl_4 / bowl_6): the chamber is 1 straight-walled pocket, CH (the belly's outline 3 mm in), from the rim to the
    // flat floor: the box and band are hollowed to CH too, so the walls meet the floor with no ledge (they stepped in at the band's foot)
    tier(inset(RIM, 0.28), BY.lip, BY.lip - 0.14, 0.02, CH), // the inner land
    tier(BOX, BY.lip - 0.12, BY.band, 0.04, CH), // the upper box: straight walls, its top the groove's floor
    // the flange band stepping out (run 15: no ears on it any more); run 26 (round 1): its outline is RIM scaled 3% (about 0.1 out), not
    // inset(RIM, -0.1), whose outward offset looped at RIM's concave points and closed the band over the chamber
    tier(RIM.map(([x, z, r]) => [x * 1.03, z * 1.03, r]), BY.band, BY.ear, 0.15, CH),
    ...EARS.map(([x, z]) => { // run 15 (item 2): the 4 ears, 4 mm thick at the joint, each with its 4.5 mm through-hole
      const sx = x > -0.5 ? 1 : -1, sz = z > 0 ? 1 : -1, x0 = x - sx * 0.35, x1 = x + sx * 0.38, z0 = z - sz * 0.35, z1 = z + sz * 0.38; // run 26 (round 1, D1 lines 3 and 8): 0.6 -> 0.38 out, corner lobes, not arms
      const q = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
      if (sx * sz < 0) q.reverse();
      return tier(q, BY.lip, BY.earBot, 0.06, null, 0.3, [[x, z, M4_HOLE]]);
    }),
    // run 27 (item 8): the belly's walls and floor straight (no taper: the chamber's walls leaned in with it); the floor has the centre hole
    // for plug 38 (main jet access) through it, the deep step and the plug boss under it
    tier(BELLY, BY.ear, BY.shallow, 0.12, CH), // the belly's walls
    tier(BELLY, FL, BY.shallow, 0.04, null, 0.25, [[QX, QZ, 0.55]]), // the flat floor (round 1: bevel 0.04, its 1.4 mm bevel closed the hole)
    // the deeper step under the jets; round 1: its air-box side 0.4 further out, so the hole has metal round it, and no taper (it moved the hole
    // off the floor's)
    tier(DEEP.map(([x, z, r]) => [x > 0.5 ? x + 0.42 : x, z, r]), BY.shallow + 0.1, BY.deep, 0.12, null, 0.25, [[QX, QZ, 0.55]]),
    tier(BOSS, BY.deep + 0.1, BY.boss, 0.2, null, 0.1, [[QX, QZ, 0.55]]), // the plug boss
    tier(PASS, BY.deep + 0.05, BY.deep - 0.38, 0.12, null, 0.1), // the curled passage
    tier(DSB, BY.shallow + 0.05, BY.shallow - 0.45, 0.12, null, 0.05), // the drain screw's boss
    // run 26 (item 14): the pump housing lobe, its lower 6.4 mm hollow: the pump chamber's well, open under cover 27 (pump.js)
    tier(LOBE, BY.ear - 0.25, PYW + 0.6, 0.2, null, 0.1),
    tier(LOBE, PYW + 0.6, PYW, 0.1, null, 0.1, [[PX, PZ, 1.25]]),
    // inside, on the flat floor (top at FL, walls 3 mm): a low collar round the centre hole and the curved wall standing round its air-box and
    // cable sides (bowl_4, bowl_6), the 4 small pads near the floor's corners, the drain passage's port toward drain screw 26, and the
    // accelerator jet's column up the cable-side wall to under the body's pump outlet, its seat at the top (77, jets.js)
    tubeY(0.8, 0.55, FL - 0.02, FL + 0.15).translate(QX, 0, QZ),
    tier([...arc(QX, QZ, 1.2, -2.8, 0.35, 14, 0.05), ...arc(QX, QZ, 0.95, 0.35, -2.8, 14, 0.05)], FL + 0.62, FL - 0.02, 0.04, null, 0.05),
    ...[[-2.75, -2.35], [1.2, -2.35], [1.2, 1.95], [-2.75, 1.95]].map(([x, z]) => rbox(0.28, 0.16, 0.28, 0.04).translate(x, FL + 0.06, z)),
    tubeY(0.32, 0.15, FL - 0.02, FL + 0.13).translate(SX, 0, SZ),
    tubeY(0.3, 0.12, FL - 0.02, AJ[2]).translate(AJ[0], 0, AJ[1]),
    tier(NIPB, BY.deep + 0.1, BY.deep - 0.3, 0.1, null, 0.05), // the drain nipple's boss
    tier(RG, BY.lip - 0.4, BY.ear - 0.3, 0.06, null, 0.1), // the pump rod's guide
  ]);
  // the drain nipple (pipe 71 goes in it), the machined mating face round the top lip
  // run 14 (item 4): the flat machined seat under each screw head: a washer face round each ear hole, 0.5 mm proud of the band's foot
  const seats = merge(EARS.map(([x, z]) => tubeY(mm(4.6), M4_HOLE, BY.earBot - 0.05, BY.earBot + 0.02, 0.015).translate(x, 0, z)));
  const nipple = tubeY(0.21, 0.1, BY.deep - 0.5, BY.deep - 0.2).translate(DX, 0, DZ);
  // run 27 (item 4): both lands' tops machined flat, level, against the body's flat face
  const face = tier(RIM, BY.lip + 0.02, BY.lip - 0.03, 0.015, inset(RIM, 0.12));
  const rim = tier(inset(RIM, 0.28), BY.lip + 0.02, BY.lip - 0.03, 0.015, CH, 0.15);
  // the pump rod: from the housing lobe up the cable side, through its guide, to the lever under the cable cover (body.js)
  // run 10 (item 7): the Keihin diagram's thin pump rod (its 72), 2 mm, a ball end up in link lever 41's arm (linkage.js)
  // run 15 (item 7): the rod has a chamfered foot with thread rings, a retaining groove and a collar under the ball
  const RT = -1.35, y0 = PYW + 0.4, rr = mm(1.0), th = ringsUp(y0 + 0.08, y0 + 0.42, rr);
  const rod = merge([latheY([[y0, 0], [y0, rr * 0.7], [y0 + 0.04, rr], ...th.pts, [th.end, rr], [RT - 0.75, rr], [RT - 0.75, rr * 1.9], [RT - 0.6, rr * 1.9], [RT - 0.6, rr], [RT - 0.4, rr], [RT - 0.4, rr * 0.7], [RT - 0.3, rr * 0.7], [RT - 0.3, rr], [RT - 0.1, rr], [RT - 0.1, 0]], 16), new THREE.SphereGeometry(mm(2.2), 12, 8).translate(0, RT, 0)]).translate(1.57, 0, -4.09);
  // fuel inlet fitting (carb_7): a steel elbow out of the upper box's sensor side, turned up, a hex at its foot, a
  // bead near its top (hose 73 goes on it)
  const IY = -3.18, IZ = 6.6, IT = IY + 2.675, z0 = RIM[13][1]; // run 10 landmarks (carb_7): 0.4 further out, its top 0.22 higher
  const inlet = merge([hose([[1.0, IY, z0 - 0.3], [1.0, IY, IZ - 0.5], [1.0, IY + 0.3, IZ - 0.05], [1.0, IY + 0.85, IZ], [1.0, IT, IZ]], 0.36, 0.2), orient(hexY(0.5, 0, 0.3), [0, 0, 1], [1.0, IY, z0 - 0.1]), tubeY(0.42, 0.2, IT - 0.45, IT - 0.3).translate(1.0, 0, IZ)]); // overlay round 1 (carb_8): 8 across
  // overlay round 2 (carb_7, carb_8): the cast boss the inlet comes out of, on the upper box's sensor side
  const iboss = rbox(1.4, 1.1, 1.0, 0.3).translate(1.0, IY, z0 + 0.35);
  // run 27 (item 8, bowl_1 / bowl_4 / bowl_6): the brass tube pressed into the floor beside the centre hole, standing up 14 mm, leaning a little
  const btube = orient(merge([tubeY(0.11, 0.06, 0, 1.3, 0.01), tubeY(0.16, 0.06, 0, 0.1, 0.02)]), [0.12, 1, 0.2], [QX + 0.25, FL - 0.02, QZ + 1.0]);
  A.add(part([0, 0, 0], mk(merge([g, iboss, ...PBOSS]), cast), mk(merge([face, nipple, seats, rim]), machined), mk(btube, brass)), '1-bowl', {ex: [0, 0, 0], order: 0.3});
  // run 11 (item 3): Keihin pieces of reference 1 with their own meshes: the fuel joint (83) with its 3 O-rings (85)
  // in the boss, the pump rod (72) with its U-ring (52) on the guide's top
  A.add(part([0, 0, 0], mk(inlet, brass)), 'K83', {ex: [0, 0, 1.6], order: 0.2, axis: [0, 0, 1]});
  A.add(part([1.0, IY, z0], mk(merge([0.3, 0.45, 0.6].map((dz) => oring(0.38, 0.045).rotateX(Math.PI / 2).translate(0, 0, dz))), rubber)), 'K85', {ex: [0, 0, 2.6], order: 0.25, axis: [0, 0, 1]});
  A.add(part([0, 0, 0], mk(rod, steel)), 'K72', {ex: [0, 0.6, 0], order: 0.35, axis: [0, 1, 0]});
  A.add(part([1.57, BY.lip - 0.4, -4.09], mk(tubeY(0.17, mm(1.0), 0, 0.12, 0.02), rubber)), 'K52', {ex: [0, 1.4, 0], order: 0.4, axis: [0, 1, 0]});
  // run 27 (item 4, bowl_4 / bowl_6): gasket 25 is a black rubber cord of round section (1.8 mm), its straight sides and corners on the bowl's
  // outline 0.2 in (the groove's middle), lying in the groove with its top 0.5 mm proud of the lands
  const cordPts = rpolyA(inset(RIM, 0.2), 0.15).getPoints(6).filter((p, i, a) => i === 0 || p.distanceTo(a[i - 1]) > 0.01);
  if (cordPts.length > 2 && cordPts[0].distanceTo(cordPts[cordPts.length - 1]) < 0.01) cordPts.pop();
  const cord = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts.map((p) => new THREE.Vector3(p.x, 0, p.y)), true, 'centripetal'), 300, 0.085, 6, true); // (item 12: 420 x 8 -> 300 x 6 sides, 6720 -> 3600 triangles; half of it sits in the groove)
  A.add(part([0, HT.joint - 0.05, 0], mk(cord.translate(0, BY.lip - 0.035 - (HT.joint - 0.05), 0), rubber)), '25', {ex: [0, 1.2, 0], order: 0.5});
  // 5 screws: 4 Phillips pan heads, M4 x 12, up through the corner ears of the flange band
  const sc = fastenerY(mm(12), mm(3.5), mm(2), mm(2.6), 'cross').rotateX(Math.PI); // M4 x 12 (fiche 98502-04012)
  A.add(part([0, BY.earBot - 0.02, 0], ...EARS.map(([x, zz]) => mk(sc.clone(), zinc, x, 0, zz))), '5', {ex: [0, -6.0, 0], order: 0});
  // 26 drain screw: a slotted screw up into its boss on the shallow end
  A.add(part([SX, BY.shallow - 0.45, SZ], mk(fastenerY(mm(9), mm(3.2), mm(2.5), mm(2.4), 'cross').rotateX(Math.PI), steel)), '26', {ex: [0, -2.4, 0], order: 0.1, axis: [0, -1, 0]});
  // 38 the big hex bottom plug (main jet access) under the boss: a recessed face with 6 spokes (carb_12), 37 its
  // O-ring between it and the boss, a little wider than the hex so its edge shows
  const HB = -0.43, hex = hexY(1.0, HB, 0); // 19 across the flats; run 10: its foot at -8.87, the end of the 191.8 height
  const recess = hexY(0.78, HB - 0.01, HB + 0.12);
  const spokes = merge(Array.from({length: 6}, (_, i) => rbox(0.62, 0.13, 0.13, 0.04).translate(0.34, HB + 0.05, 0).rotateY((i * Math.PI) / 3 + Math.PI / 6)));
  const hub = tubeY(0.2, 0.08, HB - 0.02, HB + 0.1);
  A.add(part([QX, BY.boss - 0.02, QZ], mk(merge([hex, screwY(0.4, 0.62, 0.62, 0.01).rotateX(Math.PI)]), machined), mk(recess, rubber), mk(merge([spokes, hub]), machined)), '38', {ex: [0, -3.4, 0], order: 0.1});
  A.add(part([QX, BY.boss, QZ], mk(oring(1.08, 0.06), rubber)), '37', {ex: [0, -2.4, 0], order: 0.15});
  return A;
}
