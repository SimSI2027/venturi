// Shape helpers for the carburetor, on top of Ironwood's geo.js. Run 9: the world is in mm (1 unit = 1 mm). The parts are
// sketched in sketch units u (the old cm sketch, about 11% small) and baked into mm by toMM at build: 1 u = MM mm. Real sizes
// are written in mm through mm(). Carb space: -X toward the engine,
// +X the air box (run 8: the photos carb_7 and carb_8 settled it; run 7 had them swapped), +Y up, +Z the
// throttle-sensor side. Visual model, eyeballed from the
// fiche and the manual's drawings: no real dimensions.
import * as THREE from 'three';
import {rbox, extrudeXY, rpoly, circ, spring as springX, smooth, merge, at} from '../lib/geo.js';
import {MM} from '../stage.js';

export {THREE, rbox, extrudeXY, rpoly, circ, merge, at, smooth};
const Y = new THREE.Vector3(0, 1, 0);
/** A real size in mm, as sketch units. */
export const mm = (v) => v / MM;
const baked = new WeakSet();
/** Bake a built group into mm: every part's rest pose, fan-out and child positions, the group's offset, and each
 * geometry once (a uniform factor, so rotations and the parts' own scales are kept exactly). */
export function toMM(A) {
  A.offset.multiplyScalar(MM);
  for (const p of A.parts) {
    for (const v of [p.obj.position, p.rest, p.ex]) v.multiplyScalar(MM);
    p.obj.traverse((o) => {
      if (o !== p.obj) o.position.multiplyScalar(MM);
      if (o.isMesh && !baked.has(o.geometry)) baked.add(o.geometry), o.geometry.scale(MM, MM, MM);
    });
  }
  return A;
}

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
export const oring = (R, r) => new THREE.TorusGeometry(R, Math.max(r, 0.045), 14, Math.max(24, Math.round(R * 40))).rotateX(Math.PI / 2); // run 14: 14 sides round the section (the creased normals broke 10 into a bevelled ring)
/** Coil spring along +Y from 0 to len. */
export const springY = (len, R, wire, turns) => springX(len, R, Math.max(wire, 0.035), turns, {endTurns: 1}).rotateZ(Math.PI / 2);
/** Screw along -Y: pan head on top (y 0..headH), threaded shank down to -len. Slot across the head. */
export function screwY(len, rHead, rShank, headH = rHead * 0.7) {
  const pts = [[headH, 0], [headH, rHead * 0.7], [headH * 0.75, rHead * 0.95], [headH * 0.3, rHead], [0, rHead], [0, rShank]];
  const n = Math.max(3, Math.round(len / (rShank < 0.15 ? 0.2 : rShank < 0.25 ? 0.17 : 0.13))); // run 13: shanks under 3 mm across: fewer thread rings; run 14: M4 and up a little coarser
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
  const tube = new THREE.TubeGeometry(curve, n, r, 12, false);
  const ends = [0, 1].map((t) => {
    const p = curve.getPointAt(t);
    const d = curve.getTangentAt(t).multiplyScalar(t ? 1 : -1);
    const ring = new THREE.RingGeometry(ri, r, 16, 1);
    ring.rotateX(-Math.PI / 2); // facing +Y
    return orient(ring, d.toArray(), p.toArray());
  });
  // run 14 (item 6): open ends: a bore wall runs 4 radii into each end (normals inward) and a lip ring rolls round the rim
  const bores = [0, 1].map((t) => {
    const p = curve.getPointAt(t), d = curve.getTangentAt(t).multiplyScalar(t ? -1 : 1); // into the hose
    return orient(latheY([[r * 4, ri], [0, ri]], 16), d.toArray(), p.toArray());
  });
  const lips = [0, 1].map((t) => {
    const p = curve.getPointAt(t), d = curve.getTangentAt(t);
    return orient(new THREE.TorusGeometry(r * 0.92, r * 0.1, 8, 16).rotateX(Math.PI / 2), d.toArray(), p.toArray());
  });
  return merge([tube, ...ends, ...bores, ...lips]);
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
  // run 14 (item 6): a hex head and a threaded shank, both bored through (the bore r * 0.3)
  const bore = r * 0.3, hex = new THREE.Shape();
  for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; i ? hex.lineTo(Math.cos(a) * hexR, Math.sin(a) * hexR) : hex.moveTo(Math.cos(a) * hexR, Math.sin(a) * hexR); }
  hex.holes.push(circ(0, 0, bore));
  const head = extrudeXY(hex, hexH, 0.03, 12, {free: true, bevelSegments: 1}).rotateX(-Math.PI / 2).translate(0, hexH / 2, 0);
  return merge([head, threadTubeY(len, r, bore)]);
}
/** A threaded tube along -Y from y 0 down to -len: outer radius ro (the thread's rings down to 0.86 ro), bore ri, open at both ends. */
export function threadTubeY(len, ro, ri, pitch = ro < 0.15 ? 0.2 : 0.15) {
  const n = Math.max(3, Math.round(len / pitch)), step = len / n, pts = [[-len, ri], [-len, ro * 0.9]];
  for (let k = 0; k < n; k++) pts.push([-len + (k + 0.3) * step, ro * 0.86], [-len + (k + 0.75) * step, ro]);
  pts.push([0, ro], [0, ri]); // the loop goes up the outer wall (outward normals), across the top, down the bore
  return latheY(pts, 24);
}
/** A flat C-shaped wire clip (the jet needle's and valve's clip) in the XZ plane, axis Y: outer radius R, inner r, a gap of gapDeg. */
export function cClipY(R, r, gapDeg, t) {
  const s = new THREE.Shape(), a0 = (gapDeg / 2) * (Math.PI / 180), a1 = Math.PI * 2 - a0;
  s.absarc(0, 0, R, a0, a1, false);
  s.absarc(0, 0, r, a1, a0, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {depth: t, bevelEnabled: false, curveSegments: 20});
  return g.rotateX(-Math.PI / 2).translate(0, -t / 2, 0);
}
/** A hex ring along Y (a hex flange with a round bore): circumradius R, bore ri, y0..y1. */
export function hexRingY(R, ri, y0, y1) {
  const hex = new THREE.Shape();
  for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; i ? hex.lineTo(Math.cos(a) * R, Math.sin(a) * R) : hex.moveTo(Math.cos(a) * R, Math.sin(a) * R); }
  hex.holes.push(circ(0, 0, ri));
  return extrudeXY(hex, y1 - y0, 0.03, 12, {free: true, bevelSegments: 1}).rotateX(-Math.PI / 2).translate(0, (y0 + y1) / 2, 0);
}
/** A diaphragm along Y (y 0..): a thin rubber membrane (radius R, thickness t) with a convolution ring, a round bead on its edge and
 * a steel centre plate (radius pr) with a stud; returns [rubber, steel] geometries. */
export function diaphragmY(R, t, pr) {
  const bead = new THREE.TorusGeometry(R, t * 1.6, 12, 56).rotateX(Math.PI / 2).translate(0, t / 2, 0);
  const mem = latheY([[0, 0], [0, R], [t, R], [t, R * 0.86], [t * 2.6, R * 0.78], [t * 2.6, R * 0.7], [t, R * 0.62], [t, 0]], 48);
  const plate = merge([cylY(pr, -t * 0.9, t * 1.2, t * 0.4), cylY(pr * 0.32, t * 1.2, t * 3.2, 0.01)]);
  return [merge([bead, mem]), plate];
}

// ---- run 14 (items 2-4): real fastener heads with a drive recess at least 1 mm deep, flat seats, through and threaded holes
export const DRIVE_DEPTH = mm(1.15);
/** The drive recess outline (a hole Path, radius r about the axis): hex socket, 6-lobe Torx or Phillips cross. */
function driveHole(kind, r) {
  const p = new THREE.Path();
  const pts = [];
  if (kind === 'hex') for (let i = 0; i < 6; i++) pts.push([Math.cos((i * Math.PI) / 3) * r, Math.sin((i * Math.PI) / 3) * r]);
  else if (kind === 'torx') for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, k = 0.5 + 0.5 * Math.cos(6 * a); pts.push([Math.cos(a) * r * (0.72 + 0.28 * k ** 0.6), Math.sin(a) * r * (0.72 + 0.28 * k ** 0.6)]); }
  else if (kind === 'slot') pts.push([r, -r * 0.2], [-r, -r * 0.2], [-r, r * 0.2], [r, r * 0.2]);
  else { // cross: 2 slots r long and 0.3 r wide
    const w = r * 0.3, l = r;
    pts.push([l, -w], [w, -w], [w, -l], [-w, -l], [-w, -w], [-l, -w], [-l, w], [-w, w], [-w, l], [w, l], [w, w], [l, w]);
  }
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}
/** A fastener head along +Y, base at y 0, top at headH: a solid body, then a ring on it whose hole is the drive recess
 * (depth DRIVE_DEPTH, floored by the body), the ring's outer top edge rounded. drive: 'hex' | 'torx' | 'cross'. */
export function headY(rHead, headH, drive = 'cross', depth = DRIVE_DEPTH) {
  const top = Math.max(0.03, headH - depth), seg = segs(rHead);
  const body = latheY([[0, 0], [0, rHead - 0.02], [0.02, rHead], [top, rHead], [top, 0]], seg);
  const ring = new THREE.Shape();
  // the ring's outline is the lathe body's own polygon (same vertices), so the two never show corners past each other
  for (let i = 0; i < seg; i++) { const f = (i / seg) * Math.PI * 2, x = Math.sin(f) * rHead, y = -Math.cos(f) * rHead; i ? ring.lineTo(x, y) : ring.moveTo(x, y); }
  ring.closePath();
  ring.holes.push(driveHole(drive, rHead * (drive === 'hex' ? 0.55 : drive === 'torx' ? 0.5 : drive === 'slot' ? 0.9 : 0.62)));
  const r = extrudeXY(ring, headH - top, 0.04, rHead < 0.2 ? 8 : 16, {free: true, bevelSegments: 1}).rotateX(-Math.PI / 2).translate(0, (top + headH) / 2, 0);
  return merge([body, r]);
}
/** A screw or bolt along -Y: a real head (base y 0, top headH) with its drive recess and a threaded shank down to -len. */
export function fastenerY(len, rHead, rShank, headH, drive = 'cross') {
  return merge([headY(rHead, headH, drive), screwY(len, rShank, rShank, 0.01).translate(0, 0, 0)]);
}
/** A boss along Y from y0 up to y1 (outer radius ro) with a threaded blind hole (thread radius ri, the thread's rings
 * between ri and 0.86 ri) of the given depth from the top; the floor closes it. */
export function tappedY(ro, ri, y0, y1, depth) {
  const n = Math.max(3, Math.round(depth / 0.15));
  const pts = [[y0, 0], [y0, ro], [y1, ro], [y1, ri + 0.02]];
  for (let i = 0; i < n; i++) pts.push([y1 - (i / n) * (depth - 0.06), ri], [y1 - ((i + 0.5) / n) * (depth - 0.06), ri * 0.86]);
  pts.push([y1 - depth, ri * 0.86], [y1 - depth, 0]);
  return latheY(pts, segs(ro));
}
/** A plate in the XZ plane (axis Y): outline pts [x, z, r], round through-holes [[x, z, r]] , centred at height yc, thickness t. */
export function slabHolesY(pts, yc, t, holes = [], r = 0.3, bevel = 0.08) {
  const s = rpoly(pts, r);
  for (const [x, z, hr] of holes) s.holes.push(circ(x, z, hr));
  return extrudeXY(s, t, bevel, 10, {free: true}).rotateX(Math.PI / 2).translate(0, yc, 0);
}
/** A threaded blind hole in a slab: the plug that fills a slab's round hole (outer radius ro), solid from y0 up to y1, the hole
 * (thread radius ri, depth) open at y1; oriented so +Y points along dir, its y = 0 at pos. */
export const tappedAt = (ro, ri, y0, y1, depth, dir, pos = [0, 0, 0]) => orient(tappedY(ro, ri, y0, y1, depth), dir, pos);
export const M4_HOLE = mm(2.25), M3_HOLE = 0.16, M5_HOLE = mm(2.75);
