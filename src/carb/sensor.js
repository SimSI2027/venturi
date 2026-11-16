// 2 sensor, on the +Z side (from the photo): throttle position sensor (47) with screw (36) and O-ring (62) on the shaft end;
// covers 59/60 with gasket 61 and screws 55; carburetor switch with the throttle stop screw assembly (46) on plate 63.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, oring, screwY, plateXY, hose, rpoly, circ, extrudeXY, mk, part, mm} from './kit.js';
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
  const head = merge([orient(cylY(0.85, 0, 0.9), [0, 0, 1]), rbox(4.2, 1.7, 0.9, 0.3).translate(1.6, 0.6, 0.45), rbox(0.9, 0.9, 0.45, 0.2).translate(-1.2, 0.55, 0.23)]).translate(0, 0, 0.25);
  const bs = rpoly([[-1.6, -1.5, 0.4], [2.6, -1.5, 0.4], [2.6, 1.0, 0.3], [1.2, 1.55, 0.4], [-1.6, 1.55, 0.4]], 0.3);
  bs.holes.push(circ(-1.15, -1.0, 0.16), circ(2.15, -1.0, 0.16), circ(0, 0, 1.08)); // the O-ring (62) shows in its hole
  const bracket = extrudeXY(bs, 0.22, 0.05, 8, {free: true}).translate(0, 0, 0.12);
  const conn = (w, h, d) => merge([rbox(w, h, d, 0.15), rbox(w + 0.16, 0.4, d + 0.16, 0.12).translate(0, h / 2 - 0.2, 0), rbox(0.3, 0.5, 0.2, 0.06).translate(0, 0, d / 2 + 0.05)]);
  const lead = hose([[3.65, 0.7, 0.7], [4.3, 0.5, 1.0], [4.6, -0.8, 1.8], [4.0, -3.5, 2.4], [2.6, -5.8, 2.5], [1.5, -7.4, 2.4]], 0.17, 0.001);
  A.add(part([SX, SY, FZ + 0.02], mk(head, plastic), mk(bracket, cast), mk(lead, wire), mk(conn(1.1, 2.4, 1.0).translate(1.4, -8.8, 2.4), grey)), '47', {ex: [0, 1.8, 3.0], order: 0});
  A.add(part([SX - 1.2, SY + 0.55, FZ + 0.72], mk(orient(screwY(0.9, 0.24, 0.13, 0.18), [0, 0, 1]), zinc)), '36', {ex: [0, 1.8, 5.0], order: 0});
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
  const sLead = hose([[-0.2, 1.75, 0.3], [-0.45, 0.6, 0.55], [-0.9, -2.2, 0.75], [-1.6, -5.2, 0.8], [-2.2, -6.3, 0.75]], 0.12, 0.001);
  const sConn = merge([rbox(0.8, 1.3, 0.7, 0.12), rbox(0.95, 0.35, 0.85, 0.1).translate(0, 0.5, 0)]).translate(-2.3, -6.9, 0.75);
  A.add(part([KX, KY, KZ], mk(sw, plastic), mk(stop, steel), mk(knob, plastic), mk(sLead, wire), mk(sConn, grey)), '46', {ex: [2.6, -0.6, 0.6], order: 0.6, axis: [1, 0, 0]});
  A.add(part([HOUSE_X + 0.06, KY + 2.3, KZ], mk(plateXY(1.3, 1.5, 0.12, 0.2, [[0.3, 0.4, 0.15]]).rotateY(Math.PI / 2), machined)), '63', {ex: [1.4, -0.6, 0.6], order: 0.7, axis: [1, 0, 0]});
  return A;
}
