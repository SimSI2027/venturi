// 2 sensor, on the +Z side (from the photo): throttle position sensor (47) with screw (36) and O-ring (62) on the shaft end;
// covers 59/60 with gasket 61 and screws 55; carburetor switch with the throttle stop screw assembly (46) on plate 63.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, hexY, orient, oring, screwY, plateXY, hose, rpoly, circ, extrudeXY, mk, part} from './kit.js';
import {SHAFT, SENS, PLATE59, slabZ} from './body.js';

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
  // 46 carburetor switch with the throttle stop screw assembly: switch body on plate 63, its wire to a grey coupler,
  // the stop screw along the bore to the big black knurled knob (0.1 H across) beside the engine spigot
  const sw = merge([rbox(1.5, 1.3, 0.8, 0.25), orient(cylY(0.3, 0, 0.5), [0, 1, 0], [-0.3, 0.6, 0])]);
  const stop = merge([orient(cylY(0.14, 0, 0.9), [1, 0, 0], [0.6, 0, 0]), orient(cylY(0.22, 0, 0.3), [1, 0, 0], [0.7, 0, 0])]);
  const knob = merge([orient(cylY(0.95, 0, 0.6, 0.08, 14), [1, 0, 0], [1.4, 0, 0]), orient(hexY(0.32, 0.6, 0.85), [1, 0, 0], [1.4, 0, 0])]);
  // its 2 wires (carb_7) run down the sensor side to the small grey connector beside the fuel inlet, at the bowl
  const sLead = hose([[-0.3, -0.4, 0.1], [-0.25, -1.8, 0.35], [-0.4, -4.4, 0.1], [-0.7, -5.6, -0.7]], 0.12, 0.001);
  const sConn = merge([rbox(0.8, 1.3, 0.7, 0.12), rbox(0.95, 0.35, 0.85, 0.1).translate(0, 0.5, 0)]).translate(-0.75, -6.4, -0.9);
  A.add(part([2.6, 2.2, FZ + 0.52], mk(sw, plastic), mk(stop, steel), mk(knob, plastic), mk(sLead, wire), mk(sConn, grey)), '46', {ex: [2.4, -1.2, 2.6], order: 0.6});
  A.add(part([2.6, 2.2, FZ + 0.06], mk(plateXY(1.9, 1.6, 0.12, 0.2, [[0.5, 0.4, 0.15]]), machined)), '63', {ex: [2.4, -1.2, 1.2], order: 0.7});
  return A;
}
