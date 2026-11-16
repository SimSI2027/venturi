// 2 sensor, on the +Z side: throttle position sensor (47) with screw (36) and O-ring (62) on the shaft end;
// covers 59/60 with gasket 61 and screws 55; carburetor switch with the throttle stop screw assembly (46) on plate 63.
import {Asm} from '../lib/asm.js';
import {THREE, rbox, merge, cylY, tubeY, orient, oring, screwY, plateXY, hose, extrudeXY, rpoly, mk, part} from './kit.js';

export function buildSensor(index) {
  const A = new Asm('sensor', 'Sensor', {offset: [0, 3.0, 7.5], index, axis: [0, 0, 1]});
  const {plastic, rubber, steel, zinc, wire, machined} = A.M;
  const grey = A.M.plastic.clone();
  grey.color.set(0x5a5d62); // couplers are grey
  // 47 TPS: a round sensor head on the shaft end with a wire lead to its coupler
  const head = merge([orient(cylY(1.15, 0, 0.75), [0, 0, 1]), rbox(1.2, 1.0, 0.7, 0.2).translate(0.9, 0.7, 0.36), rbox(0.8, 1.2, 0.5, 0.2).translate(-1.1, 0.6, 0.25)]);
  const lead = hose([[1.4, 0.9, 0.45], [2.4, 1.1, 0.6], [3.6, 0.4, 1.2], [4.4, -0.8, 1.6], [4.8, -1.8, 1.7]], 0.17, 0.001);
  const coupler = rbox(1.1, 1.5, 0.9, 0.15).translate(4.9, -2.6, 1.7);
  A.add(part([0.8, 2.55, 3.35], mk(head, plastic), mk(lead, wire), mk(coupler, grey)), '47', {ex: [0, 1.8, 3.0], order: 0});
  A.add(part([-0.3, 3.4, 4.12], mk(orient(screwY(0.9, 0.24, 0.13, 0.18), [0, 0, -1]), zinc)), '36', {ex: [0, 1.8, 5.0], order: 0});
  A.add(part([0.8, 2.55, 3.3], mk(oring(0.6, 0.06).rotateX(Math.PI / 2), rubber)), '62', {ex: [0, 1.8, 1.6], order: 0.1});
  // 59 cover 1, 61 gasket, 60 cover 2, 55 screws: a cover plate below the sensor
  A.add(part([-1.5, 0.7, 3.25], mk(plateXY(2.4, 2.1, 0.3, 0.4), plastic)), '59', {ex: [-1.6, -0.6, 2.2], order: 0.35});
  A.add(part([-1.5, 0.7, 3.06], mk(plateXY(2.2, 1.9, 0.09, 0.35, [[0, 0, 0.6]]), rubber)), '61', {ex: [-1.6, -0.6, 1.0], order: 0.45});
  A.add(part([-1.5, 2.15, 3.2], mk(plateXY(1.6, 0.7, 0.2, 0.2), plastic)), '60', {ex: [-2.2, 1.0, 2.6], order: 0.3});
  const scr = orient(screwY(0.8, 0.2, 0.11, 0.14), [0, 0, 1]);
  A.add(part([-1.5, 0.7, 3.4], mk(scr, zinc, -0.85, 0.7, 0), mk(scr.clone(), zinc, 0.85, -0.7, 0)), '55', {ex: [-1.6, -0.6, 4.0], order: 0.2});
  // 46 carburetor switch with the throttle stop screw assembly: switch body, wire stub, long stop screw and knob
  const sw = merge([rbox(1.5, 1.3, 1.0, 0.25), orient(cylY(0.3, 0, 0.5), [1, 0, 0], [0.7, 0.2, 0])]);
  const stop = merge([orient(screwY(2.8, 0.14, 0.14, 0.01), [0.25, 1, 0]), orient(cylY(0.42, -0.4, 0), [0.25, 1, 0])]);
  const stopAt = new THREE.Vector3(0.45, -2.2, 0.2);
  stop.translate(...stopAt.toArray()); // the knob end hangs below
  const sLead = hose([[1.0, 0.3, 0], [1.8, 0.4, 0.2], [2.6, -0.2, 0.5]], 0.12, 0.001);
  A.add(part([2.7, 0.9, 3.55], mk(sw, plastic), mk(stop, steel), mk(sLead, wire)), '46', {ex: [2.4, -1.2, 2.6], order: 0.6});
  A.add(part([2.7, 0.9, 3.0], mk(plateXY(1.9, 1.6, 0.12, 0.2, [[0.5, 0.4, 0.15]]), machined)), '63', {ex: [2.4, -1.2, 1.2], order: 0.7});
  return A;
}
