// 6 linkage, on the cable side (-Z), from the photo: the flat shield-shaped throttle cable cover (65) with gasket (66), seal (67) and 2 bolts (70);
// throttle shaft screw (42, under the top cover); plates (40, 41); adjusting screw (44) and its spring (43).
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, springY, screwY, fastenerY, tappedY, rpoly, circ, extrudeXY, mk, part, mm, M5_HOLE} from './kit.js';
import {SHIELD, CUPZ, LINK, SHAFT, inset, slabZ, c3, clipY} from './body.js';

export function buildLinkage(index) {
  const A = new Asm('linkage', 'Linkage', {offset: [0, 1.0, -7.5], index, axis: [0, 0, -1]});
  const {cast, rubber, steel, brass, machined} = A.M;
  // 65 cable cover: 1 flat shield-shaped plate (0.5 H tall) over the throttle wheel and its return spring, the
  // cable boss at its top air-box corner; 2 raised pads for the socket-head bolts (70)
  // (run 8: everything fixed to the cover goes where shieldXY puts it, the cover 15% smaller and turned 20 degrees)
  // run 9 (carb_3): the 2 socket-head bolts at the upper engine-side corner and in the lobe; the hose nipple at the
  // lobe's foot; the cable boss along -X out of the shoulder's engine end, under the bracket
  const BOLTS = [c3(495, 160), c3(345, 445)];
  const [BX, BY] = [-2.55, 7.35], [NX, NY] = c3(415, 455);
  // the flat cover, and its wide rounded shoulder: the top part standing 0.2 further out with a soft edge
  // run 14 (item 4): each bolt has its 5.5 mm through-hole in the cover, the shoulder and the seat pad
  const flatS = rpoly(SHIELD, 0.3);
  BOLTS.forEach(([x, y]) => flatS.holes.push(circ(x, y, M5_HOLE)));
  const flat = extrudeXY(flatS, 0.55, 0.2, 12, {free: true}); // run 9: rounded edges, so the housing reads curved end-on
  const shoulder = slabZ(inset(clipY(SHIELD, 99, 4.6), 0.3), -0.3, 0.3, BOLTS.filter((b) => b[1] > 5.2).map(([x, y]) => [x, y, M5_HOLE]), 0.5);
  const boss = orient(tubeY(0.42, 0.18, 0, 0.6), [-1, 0, 0], [BX, BY, 0]);
  const pads = merge(BOLTS.map(([x, y]) => orient(tubeY(0.55, M5_HOLE, 0, 0.12, 0.02), [0, 0, -1], [x, y, -0.27])));
  const nip = tubeY(0.2, 0.1, -0.7, 0.1).translate(NX, NY, 0); // the hose 68 nipple at the lobe's foot
  // the cable bracket (carb_7, carb_3): a thick lug behind the cover's top edge at its engine end, from the body out
  // to the cover's face, the hole for the cable adjuster; outline in (-z, y), extruded along X
  // run 10 (correction 18, carb_3 / carb_7 landmarks): its top at 9.02, level with the raised cover's and about 10 mm
  // above the top cover; the hole stays 73 mm above the bore (6.6), nearer the face; 0.95 along X, out past the
  // cover's engine edge
  const ls = rpoly([[5.15, 5.0, 0.2], [3.45, 5.0, 0.2], [3.45, 8.5, 0.4], [3.75, 9.02, 0.3], [4.85, 9.02, 0.3], [5.15, 8.55, 0.35]], 0.3);
  ls.holes.push(circ(4.55, 6.6, 0.42), circ(4.3, 5.6, M5_HOLE)); // run 14 (item 4): + the 5.5 mm hole for screw K11
  const lug = extrudeXY(ls, 0.45, 0.08, 12, {free: true}).rotateY(Math.PI / 2).translate(-3.375, 0, -(CUPZ - 0.33)); // shape x -> -z; run 14: 4.5 mm thick (was 9.5), x -3.6..-3.15
  A.add(part([0, 0, CUPZ - 0.33], mk(merge([flat, shoulder, boss, pads, orient(tappedY(0.4, mm(2.4), 0, 0.95, 0.75), [-1, 0, 0], [-2.2, 5.6, -0.02])]), cast), mk(nip, brass)), '65', {ex: [0, 0, -1.8], order: 0.25});
  // run 11 (item 3): the bracket is Keihin 10, its own piece of 65, held by Keihin 11 (M5 x 8) from the engine side
  // item 7 round 2: 0.45 (4.8 mm) further out toward the cable side, where mine_3 (3.7) and mine_5 (6.2) both put it
  const KZ = -0.45;
  // run 12 (item 3, cmp_5): the bracket runs along the cable side: a flange out of the lug's top, 2 holes through it
  // (the lug's world z span is -3.9 to -5.6; the part sits at z -5.18)
  const fl = rpoly([[-3.6, -3.95, 0.3], [-0.9, -3.95, 0.3], [-0.9, -5.55, 0.3], [-3.6, -5.55, 0.3]], 0.3);
  fl.holes.push(circ(-3.05, -4.75, 0.24), circ(-1.45, -4.75, 0.24));
  const flange = extrudeXY(fl, 0.3, 0.05, 8, {free: true}).rotateX(Math.PI / 2).translate(0, 8.85, -(CUPZ - 0.33 + KZ));
  const kseat = orient(tubeY(mm(5), M5_HOLE, 0, 0.03, 0.01), [-1, 0, 0], [-3.6, 5.6, 0.43]); // the flat seat under K11's head
  A.add(part([0, 0, CUPZ - 0.33 + KZ], mk(merge([lug, flange]), cast), mk(kseat, machined)), 'K10', {ex: [0, 0, -1.8], order: 0.25});
  A.add(part([-3.63, 5.6, -4.3 + KZ], mk(orient(fastenerY(mm(8), mm(4), mm(2.5), mm(4.5), 'hex'), [-1, 0, 0]), steel)), 'K11', {ex: [-1.6, 0, -1.8], order: 0.2, axis: [-1, 0, 0]});
  // 66 gasket under it, its rim a little proud of the cover so the black edge shows
  A.add(part([0, 0, CUPZ - 0.025], mk(slabZ(inset(SHIELD, -0.06), 0, 0.1, [inset(SHIELD, 0.35), ...BOLTS.map(([x, y]) => [x, y, M5_HOLE])], 0.3), rubber)), '66', {ex: [0, 0, -0.7], order: 0.4});
  // 67 seal: the rubber grommet where the cable enters the cover's boss
  A.add(part([BX - 0.6, BY, CUPZ - 0.33], mk(orient(merge([tubeY(0.36, 0.16, 0, 0.5), tubeY(0.46, 0.16, 0.38, 0.55)]), [-1, 0, 0]), rubber)), '67', {ex: [-1.8, 0, -1.8], order: 0.15, axis: [-1, 0, 0]});
  // 70 bolts (2): socket-head cap screws along +Z into the body, the hex socket dark in the head
  const bolt = orient(fastenerY(1.6, mm(4.25), mm(2.5), mm(5), 'hex'), [0, 0, -1]); // run 14: a real cap head, hex socket 1.15 mm deep
  A.add(part([0, 0, CUPZ - 0.73], ...BOLTS.map(([x, y]) => mk(bolt.clone(), steel, x, y, 0))), '70', {ex: [0, 0, -3.4], order: 0});
  // 42 throttle shaft screw: holds the lift lever on the shaft, reached from the top
  // (run 11: over the shaft's axis, which moved 1.1 toward the air box; the shank down through it)
  A.add(part([SHAFT[0], 6.05, -1.6], mk(fastenerY(0.9, 0.24, 0.13, 0.18, 'cross'), steel)), '42', {ex: [0, 5.5, 4.5], order: 0.6, axis: [0, 1, 0]});
  // run 10 (item 7): 40 and 41 are the accelerator pump's 2 link levers as the Keihin FCR-MX diagram draws them (its 64
  // and 65), stamped steel on the pivot pin under the cable cup (body.js LINK, its 2 torsion springs there): 40 with a
  // tab bent out toward the cover holding the timing adjusting screw 44 (Keihin 250) and its spring 43 (251), the
  // screw's tip up against the cup lobe's foot over the throttle cam; 41 with its arm out to the thin rod's ball end
  const [LX, LY] = LINK, LT = mm(1.6);
  const lever = (ax, ay) => {
    const L = Math.hypot(ax, ay);
    return merge([orient(tubeY(0.4, 0.24, -LT / 2, LT / 2, 0.03), [0, 0, 1]), rbox(L, 0.3, LT, 0.05).translate(L / 2, 0, 0).rotateZ(Math.atan2(ay, ax)), orient(cylY(0.2, -LT / 2, LT / 2, 0.03), [0, 0, 1], [ax, ay, 0])]);
  };
  const T40 = [-0.65, 0.34], A41 = [0.82, 0.35];
  const tab = rbox(0.5, 0.1, 0.6, 0.04).translate(T40[0], T40[1], -0.27);
  A.add(part([LX, LY, -3.56], mk(merge([lever(...T40), tab]), steel)), '40', {ex: [0, -0.8, -1.6], order: 0.7});
  A.add(part([LX, LY, -4.09], mk(lever(...A41), steel)), '41', {ex: [0.8, -0.8, -2.4], order: 0.65});
  // 44 the timing adjusting screw up through 40's tab (its head under the tab), 43 its spring on the shank above it
  const SX = LX + T40[0], SY = LY + T40[1] - 0.05, SZ = -3.83;
  A.add(part([SX, SY, SZ], mk(fastenerY(1.5, 0.24, 0.13, 0.3, 'cross').rotateX(Math.PI), steel)), '44', {ex: [0, -3.6, -0.6], order: 0.5, axis: [0, -1, 0]});
  A.add(part([SX, SY + 0.11, SZ], mk(springY(0.7, 0.22, 0.04, 5), steel)), '43', {ex: [0, -2.2, -0.6], order: 0.55, axis: [0, -1, 0]});
  // run 11 (item 3): on the pin (body.js), behind each lever its torsion spring (Keihin 66 behind 40, 67 behind 41),
  // and at the pin's end the washer (69) and the E-clip (70): pieces of reference 1, off the pin first
  const leg = (z, a, len) => orient(cylY(0.04, 0, len, 0.01), [Math.cos(a), Math.sin(a), 0], [Math.cos(a) * 0.25, Math.sin(a) * 0.25, z]);
  A.add(part([LX, LY, 0], mk(merge([orient(springY(0.24, 0.25, 0.045, 3), [0, 0, -1], [0, 0, -3.22]), leg(-3.24, Math.PI * 1.25, 0.4), leg(-3.44, Math.PI * 0.75, 0.45)]), steel)), 'K66', {ex: [0, -0.8, -1.2], order: 0.75});
  A.add(part([LX, LY, 0], mk(merge([orient(springY(0.3, 0.25, 0.045, 3.5), [0, 0, -1], [0, 0, -3.68]), leg(-3.7, Math.PI * 0.8, 0.45), leg(-3.96, Math.PI * 0.12, 0.5)]), steel)), 'K67', {ex: [0.8, -0.8, -2.0], order: 0.68});
  A.add(part([LX, LY, -4.48], mk(orient(tubeY(0.26, 0.11, 0, 0.05), [0, 0, -1]), steel)), 'K69', {ex: [0, 0, -3.0], order: 0.62});
  A.add(part([LX, LY, -4.535], mk(new THREE.TorusGeometry(0.25, 0.035, 6, 20, Math.PI * 1.6).rotateZ(Math.PI * 0.7), steel)), 'K70', {ex: [0, 0, -3.6], order: 0.6});
  return A;
}
