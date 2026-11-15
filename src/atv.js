// The ATV prop: a low, wide black sport quad, eyeballed from the owner's photo (ref/atv.jpg, notes in data.js).
// Visual model only: no real dimensions, no logos, no graphics kit. Units cm, in carb space: the carburetor sits at
// the origin, +X forward (toward the engine), +Y up, +Z the rider's right. Ground at y = GROUND.
// At most 45 meshes, under 60k triangles. Every mesh has its own material so it can fade on its own.
import * as THREE from 'three';
import {rbox, merge, at, extrudeXY, rpoly} from './lib/geo.js';
import {latheY, cylY, tubeY, orient} from './carb/kit.js';
import {noBloom} from './lib/materials.js';

export const GROUND = -45;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Tube along a smooth path, ~3 cm per segment. */
function tube(pts, r, radial = 10) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'centripetal');
  return new THREE.TubeGeometry(c, Math.max(8, Math.round(c.getLength() / 3)), r, radial, false);
}
/** A side profile (XY points) extruded across Z to width w, rounded corners r, bevel b. */
function prof(pts, w, r = 2, b = 1.2, cs = 5) {
  return extrudeXY(rpoly(pts, r), w, b, cs, {free: true, bevelSegments: 2});
}
/** An arch (fender) round (0, 0): radii r0..r1 from angle a0 to a1 (rad), extruded across Z to width w. */
function arch(r0, r1, a0, a1, w) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r1, a0, a1, false);
  s.absarc(0, 0, r0, a1, a0, true);
  s.closePath();
  return extrudeXY(s, w, 1, 18, {free: true, bevelSegments: 2});
}
/** A light coil spring along +Y, 12 segments a turn, 6 round the wire. */
function coil(len, R, wire, turns) {
  class Helix extends THREE.Curve {
    getPoint(t, out = new THREE.Vector3()) {
      const a = t * turns * Math.PI * 2;
      return out.set(R * Math.cos(a), wire + t * (len - 2 * wire), R * Math.sin(a));
    }
  }
  return new THREE.TubeGeometry(new Helix(), Math.ceil(turns * 12), wire, 6, false);
}
/** A knobby tyre round +Z (axle), radius R, width w: lathe carcass, two staggered rows of tread blocks and shoulders. */
function tyre(R, w) {
  const h = w / 2;
  const body = latheY([[-h * 0.78, R * 0.6], [-h, R * 0.7], [-h, R * 0.86], [-h * 0.86, R * 0.965], [-h * 0.55, R], [h * 0.55, R], [h * 0.86, R * 0.965], [h, R * 0.86], [h, R * 0.7], [h * 0.78, R * 0.6]], 44);
  const k = [body];
  const N = 28;
  for (let i = 0; i < N; i++) {
    for (const row of [-1, 1]) {
      const a = ((i + (row > 0 ? 0.5 : 0)) / N) * Math.PI * 2;
      k.push(new THREE.BoxGeometry(1.7, w * 0.3, 2.8).rotateY(-a).translate((R + 0.6) * Math.cos(a), row * w * 0.2, (R + 0.6) * Math.sin(a)));
      const b = a + Math.PI / N;
      k.push(new THREE.BoxGeometry(1.3, w * 0.16, 2.4).rotateY(-b).translate((R - 0.2) * Math.cos(b), row * w * 0.45, (R - 0.2) * Math.sin(b)));
    }
  }
  return merge(k).rotateX(Math.PI / 2);
}
/** The wheel inside a tyre: rim, dished face, hub, outer face toward side s. */
function wheel(R, w, s) {
  const h = w / 2;
  const g = merge([
    tubeY(R * 0.6, R * 0.54, -h * 0.8, h * 0.8, 0.3, 36),
    tubeY(R * 0.58, R * 0.2, h * 0.3, h * 0.5, 0.3, 36),
    cylY(R * 0.24, h * 0.3, h * 0.75, 0.4, 24),
    ...[0, 1, 2, 3].map((i) => cylY(0.7, h * 0.7, h * 0.85, 0.15, 8).translate(R * 0.14 * Math.cos(i * 1.571), 0, R * 0.14 * Math.sin(i * 1.571))),
  ]);
  return g.rotateX(s > 0 ? Math.PI / 2 : -Math.PI / 2);
}

function materials() {
  const P = (o) => noBloom(new THREE.MeshPhysicalMaterial({transparent: true, ...o}));
  return {
    gloss: P({color: 0x09090a, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08}),
    seat: P({color: 0x3d3f43, roughness: 0.85, sheen: 0.4, sheenRoughness: 0.7, sheenColor: new THREE.Color(0x55585e)}),
    seatPanel: P({color: 0x8f9297, roughness: 0.55}),
    alu: P({color: 0xb7bbc0, metalness: 1, roughness: 0.32}),
    tyre: P({color: 0x111112, roughness: 0.92}),
    wheel: P({color: 0x131416, metalness: 0.4, roughness: 0.45}),
    spring: P({color: 0xdcd6c6, metalness: 0.5, roughness: 0.38}),
    shock: P({color: 0x2c2e32, metalness: 0.8, roughness: 0.35}),
    engine: P({color: 0x2b2d31, metalness: 0.55, roughness: 0.6}),
    steel: P({color: 0xa9adb2, metalness: 1, roughness: 0.3}),
    lens: P({color: 0xd5dbe1, roughness: 0.08, clearcoat: 1}),
    plastic: P({color: 0x161719, roughness: 0.55}),
    rubber: P({color: 0x141415, roughness: 0.75}),
  };
}

/**
 * Build the ATV. Returns {group, items}: each item {mesh, kind, lift?, piece?}. kind: 'plastic' (seat, tank cover,
 * side covers: lifted away first, lift = where they go), 'body' (the rest: flies outward), 'piece' (on the ATV
 * but named by a step of section A: joint, jointClamps, duct, ductClamp, cable).
 */
export function buildAtv() {
  const M = materials();
  const group = new THREE.Group();
  group.name = 'atv';
  const items = [];
  const add = (geo, mat, kind, extra = {}) => {
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.material.onBeforeCompile = mat.onBeforeCompile;
    mesh.material.customProgramCacheKey = mat.customProgramCacheKey;
    mesh.name = extra.name || kind;
    group.add(mesh);
    items.push({mesh, kind, ...extra});
    return mesh;
  };
  const S = [-1, 1];

  // --- plastics that come off first: seat (with its pale side panel), tank cover, two side covers
  add(prof([[-6, 24.5], [-30, 23], [-78, 23.5], [-80, 20], [-76, 17], [-8, 17]], 28, 2.5, 3), M.seat, 'plastic', {name: 'seat', lift: [-18, 55, 0], t0: 1.2});
  add(prof([[-10, 18.6], [-76, 18.6], [-77, 16.6], [-10, 15.8]], 30.6, 0.6, 0.4), M.seatPanel, 'plastic', {name: 'seat panel', lift: [-18, 55, 0], t0: 1.2});
  add(prof([[38, 14], [34, 25], [22, 29.5], [4, 28], [-7, 23], [-7, 15], [14, 12.5]], 34, 3, 2), M.gloss, 'plastic', {name: 'tank cover', lift: [12, 62, 0], t0: 1.6});
  for (const s of S) add(prof([[-8, 17], [-46, 17], [-50, 10], [-44, 0], [-30, -5], [-12, -3], [-6, 6]], 2, 2.5, 0.8).translate(0, 0, s * 16.5), M.gloss, 'plastic', {name: 'side cover', lift: [-6, 22, s * 60], t0: 2.0});

  // --- front fenders with the nose and two headlight lenses; rear fenders; radiator shrouds
  add(merge([
    ...S.map((s) => arch(28.5, 31.5, 0.26, 2.93, 24).translate(58, -19, s * 44)),
    ...S.map((s) => rbox(34, 2.2, 22, 1).translate(60, 12.2, s * 40)),
    rbox(36, 2.5, 60, 1.2).translate(62, 11.5, 0),
    prof([[95, 6], [92, 13], [78, 16], [60, 15], [56, 8], [64, -2], [86, -4]], 34, 3, 2),
  ]), M.gloss, 'body', {name: 'front fenders'});
  add(merge(S.map((s) => new THREE.SphereGeometry(5, 18, 12).scale(0.4, 0.55, 1).rotateY(s * 0.3).translate(93.6, 6, s * 9))), M.lens, 'body', {name: 'headlights'});
  add(merge([
    prof([[-38, 15.5], [-70, 16.5], [-98, 17], [-101, 12], [-96, 8], [-60, 9.5], [-40, 10]], 60, 2.5, 2),
    ...S.map((s) => arch(30, 33, 0.17, 2.97, 30).translate(-62, -20, s * 44)),
    ...S.map((s) => rbox(44, 2.2, 30, 1).translate(-64, 12.4, s * 44)),
  ]), M.gloss, 'body', {name: 'rear fenders'});
  for (const s of S) add(prof([[50, 16], [44, 27], [30, 28], [16, 18], [14, 2], [26, -6], [44, -4], [52, 6]], 2.4, 3, 0.8).translate(0, 0, s * 19), M.gloss, 'body', {name: 'radiator shroud'});

  // --- frame, bumper hoop, A-arms, swingarm (bare aluminium)
  const frame = [];
  for (const s of S) {
    frame.push(
      tube([[50, 26, s * 9], [46, 6, s * 12], [44, -14, s * 13], [38, -28, s * 13], [0, -31, s * 13], [-22, -30, s * 13], [-32, -22, s * 12]], 1.5),
      tube([[50, 28, s * 8], [36, 20, s * 12], [14, 16, s * 13], [-8, 14, s * 13], [-26, 13, s * 12], [-50, 15, s * 11], [-84, 17, s * 10]], 1.5),
      tube([[-26, 13, s * 12], [-30, -4, s * 12], [-32, -22, s * 12]], 1.5),
      tube([[-32, -22, s * 12], [-50, -2, s * 11], [-62, 13, s * 10]], 1.3),
      tube([[30, -27, s * 16], [28, -29, s * 38], [10, -30, s * 41], [-28, -30, s * 41], [-36, -28, s * 30], [-30, -27, s * 16]], 1.4),
      rbox(7, 2, 10, 0.8).translate(-8, -29.5, s * 30),
    );
  }
  frame.push(at(cylY(2.4, 0, 14, 0.3, 20), 49, 18, 0, 0, 0, 0.35), tube([[0, -31, -13], [0, -31, 13]], 1.4), tube([[-26, 13, -12], [-26, 13, 12]], 1.4), tube([[44, -14, -13], [44, -14, 13]], 1.4));
  add(merge(frame), M.alu, 'body', {name: 'frame'});
  add(merge([
    tube([[74, -24, -14], [90, -22, -15], [97, -10, -14], [98, 0, -8], [98.5, 2, 0], [98, 0, 8], [97, -10, 14], [90, -22, 15], [74, -24, 14]], 1.6),
    tube([[96.5, -12, -14], [96.5, -12, 14]], 1.3),
  ]), M.alu, 'body', {name: 'bumper'});
  for (const s of S) {
    add(merge([
      tube([[48, -8, s * 12], [56, -10, s * 33]], 1.3, 8), tube([[36, -8, s * 13], [56, -10, s * 33]], 1.3, 8),
      tube([[50, -25, s * 12], [58, -26, s * 34]], 1.3, 8), tube([[34, -25, s * 13], [58, -26, s * 34]], 1.3, 8),
      cylY(2.0, -27, -9, 0.3, 16).translate(58, 0, s * 35),
      at(cylY(3, -2.5, 2.5, 0.4, 20), 58, -19, s * 37.5, Math.PI / 2, 0, 0),
    ]), M.alu, 'body', {name: 'A-arms'});
  }
  add(merge([
    ...S.map((s) => tube([[-12, -22, s * 14], [-35, -22, s * 18], [-62, -20, s * 20]], 2.2)),
    tube([[-20, -22, -15], [-20, -22, 15]], 1.6),
    at(cylY(3, -24, 24, 0.4, 20), -62, -20, 0, Math.PI / 2, 0, 0),
    at(cylY(2.6, -15, 15, 0.4, 20), -12, -22, 0, Math.PI / 2, 0, 0),
  ]), M.alu, 'body', {name: 'swingarm'});

  // --- four shocks with pale springs (bodies and springs separate: two materials)
  const shocks = [...S.map((s) => [[47, 6, s * 15], [56, -24, s * 31]]), ...S.map((s) => [[-26, 10, s * 9], [-42, -19, s * 17]])];
  for (const [top, bot] of shocks) {
    const d = V(...top).sub(V(...bot));
    const L = d.length();
    add(orient(merge([cylY(0.9, 0, L, 0.2, 12), cylY(1.9, L * 0.55, L * 0.97, 0.3, 16), cylY(1.4, 0, 1.5, 0.3, 12)]), d.toArray(), bot), M.shock, 'body', {name: 'shock'});
    add(orient(coil(L * 0.62, 2.5, 0.42, 7), d.toArray(), V(...bot).addScaledVector(d, 0.07 / 1).toArray()), M.spring, 'body', {name: 'shock spring'});
  }

  // --- tyres (front narrow, rear wide) and black wheels
  const wheels = [[58, -19, 45, 26, 17], [-62, -20, 44, 25, 25]];
  for (const [x, y, z, R, w] of wheels) {
    for (const s of S) {
      add(tyre(R, w).translate(x, y, s * z), M.tyre, 'body', {name: 'tyre'});
      add(wheel(R, w, s).translate(x, y, s * z), M.wheel, 'body', {name: 'wheel'});
    }
  }

  // --- handlebar with grips, thumb-throttle housing and levers
  add(merge([
    orient(cylY(1.8, 0, 11, 0.3, 16), [-0.35, 1, 0], [44.5, 30, 0]),
    rbox(5, 3, 8, 1).translate(40.5, 41, 0),
    tube([[40, 41.5, -39], [41, 42, -24], [41.5, 42.3, -8], [41.5, 42.3, 8], [41, 42, 24], [40, 41.5, 39]], 1.1, 10),
  ]), M.alu, 'body', {name: 'handlebar'});
  add(merge([
    ...S.map((s) => at(cylY(1.7, -5.5, 5.5, 0.4, 16), 40.1, 41.6, s * 34, Math.PI / 2, 0, 0)),
    rbox(4.5, 4, 4.5, 1).translate(40.5, 41.4, 27),
    rbox(4, 0.8, 2.6, 0.3).translate(37.6, 40.6, 26.5),
    rbox(4, 3.6, 4, 1).translate(40.5, 41.4, -27),
    ...S.map((s) => rbox(1.4, 0.9, 15, 0.3).translate(35.8, 41.8, s * 31)),
  ]), M.plastic, 'body', {name: 'grips and throttle housing'});

  // --- engine block with head (and the radiator core), exhaust, air box
  const fins = [0, 1, 2, 3, 4].map((i) => at(rbox(17, 0.7, 17, 0.3), 21 + i * 0.45, -14 + i * 3, 0, 0, 0, -0.15));
  add(merge([
    rbox(34, 18, 24, 4, 2).translate(14, -24, 0),
    at(rbox(13, 15, 13, 2), 21, -8, 0, 0, 0, -0.15),
    ...fins,
    rbox(17, 9, 16, 2.5, 2).translate(23, 4, 0),
    rbox(14, 3.5, 13, 1.5).translate(23, 10, 0),
    at(cylY(3.4, 0, 3, 0.3, 24), 12.2, 1, 0, 0, 0, Math.PI / 2),
    at(cylY(9, 0, 4, 0.8, 32), 10, -24, 12, Math.PI / 2, 0, 0),
    at(cylY(8, 0, 4, 0.8, 32), 16, -24, -12, -Math.PI / 2, 0, 0),
    at(rbox(4, 22, 30, 1), 46, -2, 0, 0, 0, -0.2),
  ]), M.engine, 'body', {name: 'engine'});
  add(merge([
    tube([[31, 3, 3], [37, -2, 5], [38, -12, 10], [30, -20, 17], [10, -21, 22], [-14, -12, 23], [-34, 0, 22], [-44, 5, 20]], 2, 12),
    at(cylY(6.2, 0, 34, 1, 28), -44, 5, 20, 0, 0, Math.PI / 2),
    at(cylY(2, 0, 3, 0.3, 16), -78, 5, 20, 0, 0, Math.PI / 2),
  ]), M.steel, 'body', {name: 'exhaust'});
  add(rbox(30, 22, 24, 4, 2).translate(-31, 3, 0), M.plastic, 'body', {name: 'air box'});

  // --- the carburetor's neighbours, named by the steps of section A
  const ringX = (R, r, x) => new THREE.TorusGeometry(R, r, 8, 40).rotateY(Math.PI / 2).translate(x, 0, 0);
  add(merge([tubeY(3.2, 2.55, 0, 8.4, 0.2, 36).rotateZ(-Math.PI / 2).translate(3, 0, 0), tubeY(3.9, 2.6, 7.4, 8.4, 0.2, 36).rotateZ(-Math.PI / 2).translate(3, 0, 0)]), M.rubber, 'piece', {name: 'carburetor joint', piece: 'joint'});
  add(merge([ringX(3.3, 0.28, 4.0), ringX(3.3, 0.28, 9.8), rbox(1.4, 1.2, 1.6, 0.3).translate(4.0, 3.5, 0), rbox(1.4, 1.2, 1.6, 0.3).translate(9.8, 3.5, 0)]), M.steel, 'piece', {name: 'joint clamps', piece: 'jointClamps'});
  add(merge([tubeY(3.9, 3.2, 0, 11.6, 0.2, 36).rotateZ(Math.PI / 2).translate(-4.4, 0, 0), ringX(3.95, 0.35, -9), ringX(3.95, 0.35, -11), ringX(3.95, 0.35, -13)]), M.rubber, 'piece', {name: 'air intake duct', piece: 'duct'});
  add(merge([ringX(4.0, 0.3, -5.6), rbox(1.4, 1.2, 1.6, 0.3).translate(-5.6, 4.2, 0)]), M.steel, 'piece', {name: 'duct clamp', piece: 'ductClamp'});
  add(tube([[41, 40.5, 29], [37, 35, 24], [29, 26, 12], [17, 17, -3], [7, 11, -6], [2.6, 7.5, -4.6], [2.0, 5.6, -4.05]], 0.45, 8), M.plastic, 'piece', {name: 'throttle cable', piece: 'cable'});

  for (const it of items) {
    it.mesh.castShadow = it.mesh.receiveShadow = false; // the floor shader draws the contact shadow
    it.mesh.geometry.computeBoundingBox();
    it.centre = it.mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
  }
  return {group, items};
}
