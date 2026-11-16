// The ATV prop: a 2004 YFZ450-style sport quad, eyeballed from ref/atv.jpg, atv_side.jpg and atv_rear.jpg (each
// looked at once). Visual model only: no logos, no graphics kit. Units cm, in carb space: the carburetor sits at the
// origin, +X forward (toward the engine), +Y up, +Z the rider's right. Ground at y = GROUND.
// Proportions in overall lengths L (the carburetor is 0.07 L): width 0.64, handlebar 0.59, wheelbase 0.70, seat
// 0.44, ground clearance 0.06; front tyres 0.29 x 0.10, rear 0.28 x 0.14. At most 90 meshes, under 90k triangles.
// Every mesh has its own material so it can fade on its own.
import * as THREE from 'three';
import {rbox, merge, at} from './lib/geo.js';
import {latheY, cylY, tubeY, orient} from './carb/kit.js';
import {noBloom} from './lib/materials.js';

export const GROUND = -45;
const L = 175; // overall length: the carburetor (12.15 cm) is 0.07 L
const T = 0.006 * L; // bodywork shell thickness
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// wheels: axle x, axle y, centre z (outer face at half the width), radius, width
const FR = (0.29 * L) / 2, FW = 0.1 * L, RR = (0.28 * L) / 2, RW = 0.14 * L;
const FX = 60, RX = FX - 0.7 * L; // wheelbase 0.70 L
const FY = GROUND + FR, RY = GROUND + RR;
const FZ = 0.31 * L - FW / 2, RZ = 0.32 * L - RW / 2; // rear track gives the 0.64 L width
const SEAT_Y = GROUND + 0.44 * L; // seat height (middle of the seat)
const BAR_Y = GROUND + 0.59 * L; // top of the handlebar grips
const LOW_Y = GROUND + 0.06 * L; // lowest point of the frame

/** Tube along a smooth path, ~3 cm per segment. Frame tubes are 0.02 L across. */
function tube(pts, r = 0.01 * L, radial = 10) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => V(...p)), false, 'centripetal');
  return new THREE.TubeGeometry(c, Math.max(8, Math.round(c.getLength() / 3)), r, radial, false);
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
/** Catmull-Rom through evenly spaced keys at u in 0..1. */
function spl(k, u) {
  const n = k.length - 1;
  const s = Math.min(n - 1e-9, Math.max(0, u * n));
  const i = Math.floor(s), t = s - i;
  const p0 = k[Math.max(0, i - 1)], p1 = k[i], p2 = k[i + 1], p3 = k[Math.min(n, i + 2)];
  return 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
}
/**
 * A curved bodywork shell t thick from a surface f(u, v) -> [x, y, z] (u, v in 0..1; du x dv points out of the
 * outside face). The rim is rounded out by half the thickness, so every edge reads bevelled.
 */
function shell(f, nu, nv, t = T) {
  const W = nv + 1;
  const P = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) P.push(V(...f(i / nu, j / nv)));
  const cl = (i, j) => P[Math.min(nu, Math.max(0, i)) * W + Math.min(nv, Math.max(0, j))];
  const N = P.map((p, k) => {
    const i = Math.floor(k / W), j = k % W;
    return cl(i + 1, j).clone().sub(cl(i - 1, j)).cross(cl(i, j + 1).clone().sub(cl(i, j - 1)));
  });
  // a pointed end (a whole row on one point) borrows the normal of the row next to it
  N.forEach((n, k) => {
    const i = Math.floor(k / W);
    if (n.lengthSq() < 1e-10) n.copy(N[(i < nu / 2 ? i + 1 : i - 1) * W + (k % W)]);
  });
  N.forEach((n) => n.normalize());
  const pos = [];
  const idx = [];
  const push = (v) => (pos.push(v.x, v.y, v.z), pos.length / 3 - 1);
  const top = P.map((p, k) => push(p.clone().addScaledVector(N[k], t / 2)));
  const bot = P.map((p, k) => push(p.clone().addScaledVector(N[k], -t / 2)));
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * W + j, b = a + W, c = b + 1, d = a + 1;
      idx.push(top[a], top[b], top[c], top[a], top[c], top[d], bot[a], bot[c], bot[b], bot[a], bot[d], bot[c]);
    }
  }
  const loop = [];
  for (let i = 0; i < nu; i++) loop.push([i, 0]);
  for (let j = 0; j < nv; j++) loop.push([nu, j]);
  for (let i = nu; i > 0; i--) loop.push([i, nv]);
  for (let j = nv; j > 0; j--) loop.push([0, j]);
  const ring = loop.map(([i, j]) => {
    const k = i * W + j, p = P[k], n = N[k];
    const e = p.clone().sub(cl(i === 0 ? 1 : i === nu ? nu - 1 : i, j === 0 ? 1 : j === nv ? nv - 1 : j));
    e.addScaledVector(n, -e.dot(n));
    if (e.lengthSq() > 1e-10) e.normalize();
    return [push(p.clone().addScaledVector(n, t / 2)), push(p.clone().addScaledVector(e, t / 2)), push(p.clone().addScaledVector(n, -t / 2))];
  });
  ring.forEach(([t0, m0, b0], k) => {
    const [t1, m1, b1] = ring[(k + 1) % ring.length];
    idx.push(t0, m1, t1, t0, m0, m1, m0, b1, m1, m0, b0, b1);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
/** The same surface for both sides: side s mirrors z (and flips v so the outside stays outside). */
const sided = (f, s) => (u, v) => {
  const [x, y, z] = f(u, s > 0 ? v : 1 - v);
  return [x, y, s * z];
};
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
/** The black wheel inside a tyre: rim, dished face, hub, outer face toward side s. */
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
    seat: P({color: 0x55585d, roughness: 0.85, sheen: 0.4, sheenRoughness: 0.7, sheenColor: new THREE.Color(0x6a6d73)}),
    alu: P({color: 0xb7bbc0, metalness: 1, roughness: 0.32}),
    tyre: P({color: 0x111112, roughness: 0.92}),
    wheel: P({color: 0x131416, metalness: 0.4, roughness: 0.45}),
    spring: P({color: 0xdcd6c6, metalness: 0.5, roughness: 0.38}),
    shock: P({color: 0x2c2e32, metalness: 0.8, roughness: 0.35}),
    engine: P({color: 0x151618, metalness: 0.5, roughness: 0.55}),
    steel: P({color: 0xa9adb2, metalness: 1, roughness: 0.3}),
    silver: P({color: 0xd4d7db, metalness: 1, roughness: 0.22}),
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

  // --- tyres (front narrow, rear wide), all four outside the bodywork, on black wheels
  for (const [x, y, z, R, w] of [[FX, FY, FZ, FR, FW], [RX, RY, RZ, RR, RW]]) {
    for (const s of S) {
      add(tyre(R, w).translate(x, y, s * z), M.tyre, 'body', {name: 'tyre'});
      add(wheel(R, w, s).translate(x, y, s * z), M.wheel, 'body', {name: 'wheel'});
    }
  }

  // --- the carburetor's neighbours, named by the steps of section A
  const ringX = (R, r, x) => new THREE.TorusGeometry(R, r, 8, 40).rotateY(Math.PI / 2).translate(x, 0, 0);
  add(merge([tubeY(3.2, 2.55, 0, 8.4, 0.2, 36).rotateZ(-Math.PI / 2).translate(3, 0, 0), tubeY(3.9, 2.6, 7.4, 8.4, 0.2, 36).rotateZ(-Math.PI / 2).translate(3, 0, 0)]), M.rubber, 'piece', {name: 'carburetor joint', piece: 'joint'});
  add(merge([ringX(3.3, 0.28, 4.0), ringX(3.3, 0.28, 9.8), rbox(1.4, 1.2, 1.6, 0.3).translate(4.0, 3.5, 0), rbox(1.4, 1.2, 1.6, 0.3).translate(9.8, 3.5, 0)]), M.steel, 'piece', {name: 'joint clamps', piece: 'jointClamps'});
  add(merge([tubeY(3.9, 3.2, 0, 11.6, 0.2, 36).rotateZ(Math.PI / 2).translate(-4.4, 0, 0), ringX(3.95, 0.35, -9), ringX(3.95, 0.35, -11), ringX(3.95, 0.35, -13)]), M.rubber, 'piece', {name: 'air intake duct', piece: 'duct'});
  add(merge([ringX(4.0, 0.3, -5.6), rbox(1.4, 1.2, 1.6, 0.3).translate(-5.6, 4.2, 0)]), M.steel, 'piece', {name: 'duct clamp', piece: 'ductClamp'});

  // @bodywork

  // @seat

  // @frame

  // @engine

  for (const it of items) {
    it.mesh.castShadow = it.mesh.receiveShadow = false; // the floor shader draws the contact shadow
    it.mesh.geometry.computeBoundingBox();
    it.centre = it.mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
  }
  return {group, items};
}
