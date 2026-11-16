// 10 float: float (21) on its pin (22), needle valve (23) hung on the float tang by its clip (24).
import {Asm} from '../lib/asm.js';
import {merge, rbox, cylY, latheY, orient, oring, lift, mk, part} from './kit.js';

export function buildFloat(index) {
  const A = new Asm('float', 'Float', {offset: [0, -7.0, 0], index});
  const {plastic, steel, rubber, brass} = A.M;
  // two pontoons either side of the jet tower, the arm and hinge to the pin at +X
  const pont = (zz) => rbox(3.0, 2.2, 1.35, 0.4).translate(-0.8, -6.4, zz);
  const arm = merge([rbox(1.6, 0.35, 3.6, 0.12).translate(0.9, -5.4, 0), rbox(0.5, 1.1, 0.35, 0.1).translate(0.4, -5.9, 1.55), rbox(0.5, 1.1, 0.35, 0.1).translate(0.4, -5.9, -1.55)]);
  const hinge = merge([-0.9, 0.9].map((zz) => orient(cylY(0.3, -0.25, 0.25), [0, 0, 1], [1.8, -4.75, zz])));
  const tang = rbox(0.5, 0.12, 0.6, 0.04).translate(1.2, -5.05, 0); // the tang that sets the float height
  A.add(part([0, 0, 0], mk(merge([pont(1.55), pont(-1.55), arm, hinge]), plastic), mk(tang, brass)), '21', {ex: [0, -0.8, 0], order: 0.3});
  A.add(part([1.8, -4.75, 0], mk(orient(cylY(0.09, -1.5, 1.5), [0, 0, 1]), steel)), '22', {ex: [0, 0, 4.0], order: 0, axis: [0, 0, 1]});
  // 23 needle valve: small body with the rubber-tipped cone pointing up into the seat
  A.add(part([1.2, -4.95, 0], mk(latheY([[0, 0], [0, 0.17], [0.55, 0.17], [0.62, 0.12], [0.8, 0.04], [0.8, 0]]), steel), mk(latheY([[0.62, 0], [0.62, 0.12], [0.8, 0.04], [0.85, 0]]), rubber)), '23', {ex: [1.8, 0.4, 0], order: 0.6});
  A.add(part([1.2, -4.92, 0], mk(oring(0.2, 0.03), steel)), '24', {ex: [2.6, -0.4, 0], order: 0.65});
  return lift(A, 0.9);
}
