// Shape helpers for the carburetor, on top of Ironwood's geo.js. Units: cm. Carb space: +X toward the engine
// (spigot), -X the bell mouth (air box), +Y up, +Z the throttle-sensor side. Visual model, eyeballed from the
// fiche and the manual's drawings: no real dimensions.
import * as THREE from 'three';
import {rbox, extrudeXY, rpoly, circ, spring as springX, smooth, merge, at} from '../lib/geo.js';

export {THREE, rbox, extrudeXY, rpoly, circ, merge, at, smooth};
const Y = new THREE.Vector3(0, 1, 0);

/** Segments for a radius: round at the default view, cheap on the small pins. */
const segs = (r) => (r < 0.15 ? 12 : r < 0.4 ? 20 : r < 1 ? 32 : 56);

/** Lathe around +Y. pts = [[y, r], ...]; a closed solid starts and ends on the axis. */
export function latheY(pts, seg = 0) {
  const rmax = Math.max(...pts.map((p) => p[1]));
  return new THREE.LatheGeometry(pts.map(([y, r]) => new THREE.Vector2(Math.max(r, 1e-4), y)), seg || segs(rmax));
}
/** Solid cylinder along Y from y0 to y1 with chamfered rims. */
export function cylY(r, y0, y1, ch = Math.min(0.05, r * 0.25, (y1 - y0) * 0.25), seg = 0) {
  return latheY([[y0, 0], [y0, r - ch], [y0 + ch, r], [y1 - ch, r], [y1, r - ch], [y1, 0]], seg);
}
/** Hollow tube along Y from y0 to y1. */
export function tubeY(ro, ri, y0, y1, ch = Math.min(0.04, (ro - ri) * 0.3), seg = 0) {
  return latheY([[y0, ri + ch], [y0, ro - ch], [y0 + ch, ro], [y1 - ch, ro], [y1, ro - ch], [y1, ri + ch], [y1 - ch, ri], [y0 + ch, ri], [y0, ri + ch]], seg);
}
/** Hex prism along Y (nuts, jet hexes, plugs), lightly chamfered. */
export function hexY(r, y0, y1) {
  const ch = Math.min(0.05, (y1 - y0) * 0.2, r * 0.12);
  const g = new THREE.LatheGeometry([[0, y0], [r - ch, y0], [r, y0 + ch], [r, y1 - ch], [r - ch, y1], [0, y1]].map(([a, b]) => new THREE.Vector2(a, b)), 6);
  return g.toNonIndexed();
}
/** O-ring in the XZ plane (axis Y). */
export const oring = (R, r) => new THREE.TorusGeometry(R, Math.max(r, 0.045), 10, Math.max(24, Math.round(R * 40))).rotateX(Math.PI / 2);
/** Coil spring along +Y from 0 to len. */
export const springY = (len, R, wire, turns) => springX(len, R, Math.max(wire, 0.035), turns, {endTurns: 1}).rotateZ(Math.PI / 2);
/** Screw along -Y: pan head on top (y 0..headH), threaded shank down to -len. Slot across the head. */
export function screwY(len, rHead, rShank, headH = rHead * 0.7) {
  const pts = [[headH, 0], [headH, rHead * 0.7], [headH * 0.75, rHead * 0.95], [headH * 0.3, rHead], [0, rHead], [0, rShank]];
  const n = Math.max(3, Math.round(len / 0.12));
  for (let i = 0; i < n; i++) pts.push([-(i / n) * (len - 0.1), rShank], [-((i + 0.5) / n) * (len - 0.1), rShank * 0.86]);
  pts.push([-len + 0.06, rShank * 0.86], [-len, rShank * 0.6], [-len, 0]);
  return latheY(pts.reverse(), segs(rHead)); // bottom to top: outward normals
}
/** Hex-head bolt along -Y, flange washer under the head. */
export function boltY(len, rHead, rShank, headH = rHead * 0.75) {
  return merge([at(hexY(rHead, 0.08, headH), 0, 0, 0), cylY(rHead * 1.15, 0, 0.1), screwY(len, rShank * 1.01, rShank, 0.02)]);
}
/** Rotate a geometry built along +Y so +Y points along dir [x, y, z]; then move it to p. */
export function orient(g, dir, p = [0, 0, 0]) {
  const q = new THREE.Quaternion().setFromUnitVectors(Y, new THREE.Vector3(...dir).normalize());
  g.applyQuaternion(q);
  g.translate(...p);
  return g;
}
/** Hose along a smooth path (points [[x, y, z]...]), outer radius r, with a dark bore at each end. */
export function hose(points, r, ri = r * 0.55) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const n = Math.max(24, Math.round(curve.getLength() * 6));
  const tube = new THREE.TubeGeometry(curve, n, r, 16, false);
  const ends = [0, 1].map((t) => {
    const p = curve.getPointAt(t);
    const d = curve.getTangentAt(t).multiplyScalar(t ? 1 : -1);
    const ring = new THREE.RingGeometry(ri, r, 16, 1);
    ring.rotateX(-Math.PI / 2); // facing +Y
    return orient(ring, d.toArray(), p.toArray());
  });
  return merge([tube, ...ends]);
}
/** A flat outline gasket (rounded rect w x d with a rounded inner hole, wall thickness t), in the XZ plane. */
export function gasketXZ(w, d, wall, t, r = 0.4) {
  const s = rpoly([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]], r);
  const iw = w / 2 - wall, id = d / 2 - wall;
  s.holes.push(rpoly([[-iw, -id], [-iw, id], [iw, id], [iw, -id]], Math.max(0.05, r - wall), new THREE.Path()));
  const g = extrudeXY(s, Math.max(t, 0.09), 0.03, 8, {free: true});
  g.rotateX(Math.PI / 2);
  return g;
}
/** Rounded-rect plate in the XY plane (normal Z), thickness t, with optional round holes [[x, y, r]]. */
export function plateXY(w, h, t, r = 0.2, holes = []) {
  const s = rpoly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], r);
  for (const [x, y, hr] of holes) s.holes.push(circ(x, y, hr));
  return extrudeXY(s, Math.max(t, 0.09), 0.04, 8, {free: true});
}
/** Lift a group's registered parts (and their rest pose) by dy, all but the ids in skip (run 7: the body's underside moved up). */
export function lift(A, dy, skip = []) {
  for (const p of A.parts) if (!skip.includes(p.id)) (p.obj.position.y += dy), (p.rest.y += dy);
  return A;
}
/** Mesh helper. */
export function mk(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  return m;
}
/** A part root at p, holding the given meshes (their positions are relative to p). */
export function part(p, ...kids) {
  const g = new THREE.Group();
  g.position.set(...p);
  kids.forEach((k) => g.add(k));
  return g;
}
/** A brass jet along -Y: hex on top, threaded body, slotted bottom. len, r. */
export function jetY(len, r, hexR = r * 1.35, hexH = 0.25) {
  return merge([hexY(hexR, 0, hexH), screwY(len, r, r, 0.01).translate(0, 0, 0), tubeY(r * 0.55, r * 0.3, -len - 0.02, -len + 0.15)]);
}
