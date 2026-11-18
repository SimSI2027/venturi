// 10 float: float (21) on its pin (22), needle valve (23) hung on the float tang by its clip (24).
import {Asm} from '../lib/asm.js';
import {UY, SEAT} from './body.js'; // run 27 (item 5): the needle valve seat at x 1.45 (under_1), was 1.2
import {THREE, merge, rbox, cylY, tubeY, latheY, screwY, fastenerY, orient, oring, lift, mk, part, circ, extrudeXY, cClipY} from './kit.js';

export function buildFloat(index) {
  const A = new Asm('float', 'Float', {offset: [0, -7.0, 0], index});
  const {plastic, steel, rubber, brass} = A.M;
  // two pontoons either side of the jet tower, the arm and hinge to the pin at +X
  const pont = (zz) => rbox(3.0, 2.2, 1.35, 0.4).translate(-0.8, -6.4, zz);
  // run 14 (item 6): 2 lobes on a hinge arm: the cross bar joins the lobes' ends, 2 posts rise from it to 2 hinge lugs, each lug with its pin hole
  const arm = merge([rbox(1.6, 0.35, 3.6, 0.12).translate(0.9, -5.4, 0), rbox(0.5, 1.1, 0.35, 0.1).translate(0.4, -5.9, 1.55), rbox(0.5, 1.1, 0.35, 0.1).translate(0.4, -5.9, -1.55),
    rbox(0.5, 1.05, 0.35, 0.08).translate(1.7, -5.05, 0.9), rbox(0.5, 1.05, 0.35, 0.08).translate(1.7, -5.05, -0.9)]);
  const lugS = new THREE.Shape();
  lugS.absarc(0, 0, 0.34, 0, Math.PI * 2, false);
  lugS.holes.push(circ(0, 0, 0.11));
  const hinge = merge([-0.8, 0.8].map((zz) => extrudeXY(lugS, 0.35, 0.04, 20, {free: true}).translate(1.8, -4.75, zz))); // run 27: inside the posts (z +/-1.2)
  const tang = rbox(0.5, 0.12, 0.6, 0.04).translate(SEAT[0], -5.05, 0); // the tang that sets the float height
  A.add(part([0, 0, 0], mk(merge([pont(1.55), pont(-1.55), arm, hinge]), plastic), mk(tang, brass)), '21', {ex: [0, -0.8, 0], order: 0.3});
  // run 14: the pin has a head at one end and a clip groove at the other
  A.add(part([1.8, -4.75, 0], mk(orient(latheY([[-1.5, 0], [-1.5, 0.16], [-1.42, 0.16], [-1.42, 0.1], [1.2, 0.1], [1.2, 0.065], [1.28, 0.065], [1.28, 0.1], [1.5, 0.1], [1.5, 0]]), [0, 0, 1]), steel)), '22', {ex: [0, 0, 4.0], order: 0, axis: [0, 0, 1]});
  // 23 needle valve: small body with the rubber-tipped cone pointing up into the seat
  A.add(part([SEAT[0], -4.95, 0], mk(latheY([[0, 0], [0, 0.17], [0.55, 0.17], [0.62, 0.12], [0.8, 0.04], [0.8, 0]]), steel), mk(latheY([[0.62, 0], [0.62, 0.12], [0.8, 0.04], [0.85, 0]]), rubber)), '23', {ex: [1.8, 0.4, 0], order: 0.6});
  A.add(part([SEAT[0], -4.92, 0], mk(cClipY(0.26, 0.12, 60, 0.05), steel)), '24', {ex: [2.6, -0.4, 0], order: 0.65});
  // run 11 (item 3): pieces of 23 from the Keihin diagram: the brass valve seat (36, in the body's seat boss, was a
  // body mesh), its O-ring (37), the fuel screen on its top (44) and the retaining screw beside it (38)
  A.add(part([SEAT[0], -4.32, 0], mk(latheY([[-0.17, 0.08], [-0.17, 0.22], [0.05, 0.22], [0.05, 0.2], [0.15, 0.2], [0.15, 0.22], [0.17, 0.21], [0.17, 0.14], [0.04, 0.08], [-0.17, 0.08]], 40), brass)), 'K36', {ex: [2.6, 1.0, 0], order: 0.7});
  A.add(part([SEAT[0], -4.22, 0], mk(oring(0.235, 0.035), rubber)), 'K37', {ex: [2.6, 1.7, 0], order: 0.75});
  // run 15 (item 6): the fuel screen is a mesh thimble: a collar, 3 hoops and 10 wires up the wall, and a flat mesh top (2 hoops, 10 spokes)
  const W = 0.014, RS = 0.16, mesh = [tubeY(RS + 0.012, RS - 0.02, 0, 0.07, 0.006), ...[0.11, 0.17, 0.23].map((y) => new THREE.TorusGeometry(RS, W, 5, 24).rotateX(Math.PI / 2).translate(0, y, 0)),
    ...[0.09, 0.16].map((r) => new THREE.TorusGeometry(r, W, 5, 24).rotateX(Math.PI / 2).translate(0, 0.28, 0)), tubeY(RS + 0.012, RS - 0.012, 0.27, 0.3, 0.004).translate(0, 0, 0)];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    mesh.push(cylY(W, 0.06, 0.28, 0.003).translate(Math.cos(a) * RS, 0, Math.sin(a) * RS), orient(cylY(W, 0, RS, 0.003), [Math.cos(a), 0, Math.sin(a)], [0, 0.28, 0]));
  }
  A.add(part([SEAT[0], -4.15, 0], mk(merge(mesh), steel)), 'K44', {ex: [2.6, 2.4, 0], order: 0.8});
  A.add(part([SEAT[0], -4.45, 0.52], mk(fastenerY(0.35, 0.17, 0.08, 0.16, 'slot').rotateX(Math.PI), steel)), 'K38', {ex: [1.2, -0.6, 1.4], order: 0.68});
  return lift(A, UY);
}
