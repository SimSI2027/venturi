// 2 sensor, on the +Z side (from the photo): throttle position sensor (47) with screw (36) and O-ring (62) on the shaft end;
// covers 59/60 with gasket 61 and screws 55; carburetor switch with the throttle stop screw assembly (46) on plate 63.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, oring, screwY, springY, plateXY, hose, rpoly, circ, extrudeXY, mk, part, mm} from './kit.js';
import {SHAFT, SENS, PLATE59, HOUSE_X, slabZ} from './body.js';

export function buildSensor(index) {
  const A = new Asm('sensor', 'Sensor', {offset: [0, 3.0, 7.5], index, axis: [0, 0, 1]});
  const {plastic, rubber, steel, zinc, wire, machined, cast} = A.M;
  const grey = A.M.plastic.clone();
  grey.color.set(0x5a5d62); // couplers are grey
  // 47 TPS (from the photo): black, on the shaft's +Z end at the top, its long body along the bore toward the
  // engine, an ear for its screw (36), a wire lead to its grey coupler
  const [SX, SY] = SHAFT, FZ = SENS + 0.65; // FZ: the cover plate's outer face, on the sensor housing
  // run 8 (carb_7): the TPS sits on its bracket plate (an aluminium plate on the cover plate, up to just under the
  // top cover), and its lead runs down the sensor side, out, to the big grey 2-pin connector hanging by the bowl
  // run 12 (item 4, cmp_2): 1 long angled block, 45 x 20 mm (4.3 x 1.9), its far end cut at a slant with a socket bump
  // on top, rising 25 degrees from the hub toward the engine (-X); the screw (36) at the hub. (Run 11's `scale.x = -1` never
  // showed: main.js resets every part's scale each frame, so the body ran toward the air box. Built into the geometry now.)
  const TA = (25 * Math.PI) / 180;
  const blk = rpoly([[-0.7, -0.95, 0.55], [3.6, -0.8, 0.3], [3.25, 1.0, 0.3], [-0.7, 0.95, 0.55]], 0.3);
  const head = merge([extrudeXY(blk, 0.9, 0.12, 8, {free: true}).translate(0, 0, 0.7), rbox(1.1, 1.0, 0.4, 0.15).translate(2.7, 0.1, 1.35)]).rotateZ(Math.PI - TA);
  const bs = rpoly([[-1.6, -1.5, 0.4], [2.6, -1.5, 0.4], [2.6, 1.0, 0.3], [1.2, 1.55, 0.4], [-1.6, 1.55, 0.4]], 0.3);
  bs.holes.push(circ(-1.15, -1.0, 0.16), circ(2.15, -1.0, 0.16), circ(0, 0, 1.08)); // the O-ring (62) shows in its hole
  const bracket = extrudeXY(bs, 0.22, 0.05, 8, {free: true}).translate(0, 0, 0.12).rotateZ(Math.PI - TA);
  const conn = (w, h, d) => merge([rbox(w, h, d, 0.15), rbox(w + 0.16, 0.4, d + 0.16, 0.12).translate(0, h / 2 - 0.2, 0), rbox(0.3, 0.5, 0.2, 0.06).translate(0, 0, d / 2 + 0.05)]);
  // run 12 (items 4, 5, cmp_2 and cmp_5): both leads (TPS 47 and the switch 46) leave the sensor side's top and run out
  // toward the engine side, each ending in a grey coupler lying along X. Paths are drawn in carb space (world mm / 10.5)
  // and moved into each part's frame: 47 sits at its hub, 46 at (KX, KY, KZ)
  const hubZ = FZ + 0.02;
  const in47 = (p) => [p[0] - SX, p[1] - SY, p[2] - hubZ];
  const L47 = [[-1.6, 6.7, 6.95], [-2.0, 7.3, 7.5], [-3.4, 8.3, 7.7], [-5.8, 8.5, 7.3], [-8.2, 7.7, 6.9]];
  const lead = hose(L47.map(in47), 0.17, 0.001);
  const coupX = (len) => conn(1.0, len, 0.9).rotateZ(Math.PI / 2); // lies along X, its socket toward -X
  const C47 = coupX(2.3).translate(...in47([-9.35, 7.6, 6.9]));
  // 47: the TPS and its lead, with the grey coupler (run 12: see the block above; no mirroring)
  A.add(part([SX, SY, FZ + 0.02], mk(head, plastic), mk(bracket, cast), mk(lead, wire), mk(C47, grey)), '47', {ex: [0, 1.8, 3.0], order: 0});
  A.add(part([SX, SY, FZ + 0.72], mk(orient(screwY(0.9, 0.24, 0.13, 0.18), [0, 0, 1]), zinc)), '36', {ex: [0, 1.8, 5.0], order: 0});
  // 62 O-ring: on the shaft boss's face, between it and the sensor head
  A.add(part([SX, SY, FZ], mk(oring(0.95, 0.06).rotateX(Math.PI / 2), rubber)), '62', {ex: [0, 1.8, 1.6], order: 0.1});
  // 59 cover 1: the flat aluminium plate over the sensor side (cut at lower left round the pilot air cover), on its
  // gasket 61 on the body's pad; 60 cover 2: a small plate on it; 55 screws through the plate
  const P = SENS + 0.22;
  A.add(part([0, 0, P + 0.255], mk(slabZ(PLATE59, 0, 0.35, [[SX, SY, 1.05]], 0.4), cast)), '59', {ex: [-1.6, -0.6, 2.2], order: 0.35});
  A.add(part([0, 0, P + 0.03], mk(slabZ(PLATE59, 0, 0.1, [[[-1.4, 6.5], [3.2, 6.5], [3.2, 0.2], [2.2, 0.2], [2.2, 2.4], [0.8, 3.5], [-1.4, 3.6]]], 0.42), rubber)), '61', {ex: [-1.6, -0.6, 1.0], order: 0.45});
  A.add(part([2.6, 3.5, FZ + 0.1], mk(plateXY(1.6, 1.0, 0.2, 0.2), cast)), '60', {ex: [-2.2, 1.0, 2.6], order: 0.3});
  const scr = orient(screwY(0.8, 0.22, 0.11, 0.16), [0, 0, 1]);
  A.add(part([0, 0, FZ], ...[[-1.3, 3.8], [3.25, 4.7], [3.25, 0.2]].map(([x, y]) => mk(scr.clone(), zinc, x, y, 0))), '55', {ex: [-1.6, -0.6, 4.0], order: 0.2});
  // 46 carburetor switch with the throttle stop screw assembly (run 9, carb_8 and carb_3): on the sensor housing's
  // air-box face, the stop screw comes out along the bore to the black star knob (8 rounded lobes, 20 across) at
  // knob height 2.2, z 4.0; the switch body sits higher up on that face on plate 63, its 2 wires run down the
  // sensor side to the small grey connector beside the fuel inlet
  const KX = HOUSE_X + 0.55, KY = 3.2, KZ = 4.4; // run 10 landmarks (carb_8): the knob 1.0 higher, 0.4 out
  const star = new THREE.Shape();
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2, r = mm(7.4) + mm(2.6) * Math.pow(0.5 + 0.5 * Math.cos(8 * t), 0.7);
    i ? star.lineTo(Math.cos(t) * r, Math.sin(t) * r) : star.moveTo(Math.cos(t) * r, Math.sin(t) * r);
  }
  const knob = merge([extrudeXY(star, 0.7, 0.08, 4, {free: true}).rotateY(Math.PI / 2), orient(hexY(0.3, 0, 0.22), [1, 0, 0], [0.33, 0, 0])]);
  const stop = orient(cylY(0.14, -0.6, -0.3), [1, 0, 0]);
  const sw = merge([rbox(0.7, 1.2, 1.0, 0.22), orient(cylY(0.28, 0, 0.35), [0, 1, 0], [0, 0.6, 0.2])]).translate(-0.2, 2.35, 0);
  const in46 = (p) => [p[0] - KX, p[1] - KY, p[2] - KZ];
  const sLead = hose([[3.95, 6.3, 4.6], [3.9, 7.5, 4.9], [2.4, 8.5, 5.0], [-0.5, 9.0, 4.9], [-3.5, 9.0, 4.8], [-6.0, 9.0, 4.9], [-8.4, 9.3, 4.7]].map(in46), 0.12, 0.001);
  const sConn = coupX(2.0).translate(...in46([-9.5, 9.4, 4.6]));
  A.add(part([KX, KY, KZ], mk(sw, plastic), mk(stop, steel), mk(knob, plastic), mk(sLead, wire), mk(sConn, grey)), '46', {ex: [2.6, -0.6, 0.6], order: 0.6, axis: [1, 0, 0]});
  // run 11 (item 3): pieces of 46 from the Keihin diagram: on the stop screw's shank between the housing and the
  // knob the washer (91) and the spring (92); the switch's screw into plate 63 (177)
  const SOPT = {ex: [2.6, -0.6, 0.6], axis: [1, 0, 0]};
  A.add(part([KX - 0.34, KY, KZ], mk(orient(tubeY(0.27, 0.15, 0, 0.04), [1, 0, 0]), steel)), 'K91', {...SOPT, order: 0.62});
  A.add(part([KX - 0.3, KY, KZ], mk(orient(springY(0.3, 0.22, 0.035, 4), [1, 0, 0]), steel)), 'K92', {...SOPT, order: 0.61});
  A.add(part([KX + 0.15, KY + 2.0, KZ - 0.3], mk(orient(screwY(0.5, 0.15, 0.08, 0.09), [1, 0, 0]), zinc)), 'K177', {...SOPT, order: 0.65});
  A.add(part([HOUSE_X + 0.06, KY + 2.3, KZ], mk(plateXY(1.3, 1.5, 0.12, 0.2, [[0.3, 0.4, 0.15]]).rotateY(Math.PI / 2), machined)), '63', {ex: [1.4, -0.6, 0.6], order: 0.7, axis: [1, 0, 0]});
  return A;
}
