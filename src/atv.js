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
const FZ = 0.31 * L - 0.53 * FW, RZ = 0.32 * L - 0.53 * RW; // the rear knobs' outer edges give the 0.64 L width
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
    gloss: P({color: 0x050506, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.16, envMapIntensity: 0.4}),
    seat: P({color: 0x55585d, roughness: 0.85, sheen: 0.4, sheenRoughness: 0.7, sheenColor: new THREE.Color(0x6a6d73)}),
    alu: P({color: 0x8c9197, metalness: 1, roughness: 0.4, envMapIntensity: 0.7}),
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
      add(tyre(R - 1.45, w).translate(x, y, s * z), M.tyre, 'body', {name: 'tyre'}); // knobs reach R
      add(wheel(R, w, s).translate(x, y, s * z), M.wheel, 'body', {name: 'wheel'});
    }
  }

  // --- the carburetor's neighbours, named by the steps of section A
  const ringX = (R, r, x) => new THREE.TorusGeometry(R, r, 8, 40).rotateY(Math.PI / 2).translate(x, 0, 0);
  add(merge([tubeY(3.2, 2.55, 0, 8.4, 0.2, 36).rotateZ(-Math.PI / 2).translate(3, 0, 0), tubeY(3.9, 2.6, 7.4, 8.4, 0.2, 36).rotateZ(-Math.PI / 2).translate(3, 0, 0)]), M.rubber, 'piece', {name: 'carburetor joint', piece: 'joint'});
  add(merge([ringX(3.3, 0.28, 4.0), ringX(3.3, 0.28, 9.8), rbox(1.4, 1.2, 1.6, 0.3).translate(4.0, 3.5, 0), rbox(1.4, 1.2, 1.6, 0.3).translate(9.8, 3.5, 0)]), M.steel, 'piece', {name: 'joint clamps', piece: 'jointClamps'});
  add(merge([tubeY(3.9, 3.2, 0, 11.6, 0.2, 36).rotateZ(Math.PI / 2).translate(-4.4, 0, 0), ringX(3.95, 0.35, -9), ringX(3.95, 0.35, -11), ringX(3.95, 0.35, -13)]), M.rubber, 'piece', {name: 'air intake duct', piece: 'duct'});
  add(merge([ringX(4.0, 0.3, -5.6), rbox(1.4, 1.2, 1.6, 0.3).translate(-5.6, 4.2, 0)]), M.steel, 'piece', {name: 'duct clamp', piece: 'ductClamp'});

  // --- bodywork: curved shells T thick, no flat slabs. Each fender covers only the inner top half of its tyre
  // (outer edge at the tyre's centre line) and is raised or lowered until its closest point clears the tread by 0.03 L.
  const clearance = (f, ax, ay, R, zc, w) => {
    let lo = Infinity;
    for (let i = 0; i <= 80; i++) {
      for (let j = 0; j <= 20; j++) {
        const [x, y, z] = f(i / 80, j / 20);
        if (Math.abs(z) >= zc - w / 2 && Math.abs(z) <= zc + w / 2) lo = Math.min(lo, Math.hypot(x - ax, y - ay) - R - T / 2);
      }
    }
    return lo;
  };
  const raise = (f, dy) => (u, v) => {
    const p = f(u, v);
    p[1] += dy;
    return p;
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  // front fenders: sharp blades from the narrow nose, arching over the tyre, then up and back to the shrouds
  const ffen0 = (u, v) => {
    const yo = spl([0, 5, 9.5, 11.2, 11.6, 14, 19], u);
    return [spl([85, 79, 71, 62, 52, 43, 36], u), lerp(yo + spl([1, 3, 5, 5.5, 5, 4, 2], u), yo, v) + 1.5 * Math.sin(Math.PI * v), lerp(spl([2.5, 6, 11, 14, 16, 17, 17.5], u), spl([3.5, 24, 39, FZ, 44, 31, 19.5], u), v)];
  };
  const ffen = raise(ffen0, 0.03 * L - clearance(ffen0, FX, FY, FR, FZ, FW));
  add(merge(S.map((s) => shell(sided(ffen, s), 48, 10))), M.gloss, 'body', {name: 'front fenders'});
  // the nose: narrow and pointed, sides falling away under the fenders
  const nose = (u, v) => {
    const c = 2 * v - 1;
    return [spl([87, 81, 74, 64, 52], u) - 2.5 * c * c, spl([2, 6.5, 11, 15.5, 20], u) - spl([5, 11, 13, 13, 11], u) * c * c, c * spl([2, 8.5, 12.5, 14.5, 14], u)];
  };
  add(shell(nose, 24, 16), M.gloss, 'body', {name: 'nose'});
  // two almond headlight lenses 0.08 L long, set into the nose's front faces and swept back along them
  const almond = new THREE.Shape();
  const la = 0.04 * L;
  almond.moveTo(-la, 0);
  almond.quadraticCurveTo(0, la * 0.46, la, 0);
  almond.quadraticCurveTo(0, -la * 0.46, -la, 0);
  const lensG = new THREE.ExtrudeGeometry(almond, {depth: 0.8, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 2, curveSegments: 14}).translate(0, 0, -0.4);
  const lenses = S.map((s) => {
    const u = 0.24, v = 0.5 + s * 0.31;
    const p = V(...nose(u, v));
    const n = V(...nose(u + 0.01, v)).sub(V(...nose(u - 0.01, v))).cross(V(...nose(u, v + 0.01)).sub(V(...nose(u, v - 0.01)))).normalize();
    const ax = V(...nose(u + 0.1, v + s * 0.12)).sub(V(...nose(u - 0.1, v - s * 0.12)));
    ax.addScaledVector(n, -ax.dot(n)).normalize();
    const m = new THREE.Matrix4().makeBasis(ax, n.clone().cross(ax), n).setPosition(p.addScaledVector(n, T * 0.7));
    return lensG.clone().applyMatrix4(m);
  });
  add(merge(lenses), M.lens, 'body', {name: 'headlights'});
  // the tank cover: narrow, crowned, between the shrouds
  const tank = (u, v) => {
    const c = 2 * v - 1;
    return [spl([50, 40, 28, 16, 5], u), spl([31, 34, 35, 33.5, 30.5], u) - spl([7, 9, 10, 10, 9], u) * c * c, c * spl([7.5, 10.5, 12, 11.5, 10], u)];
  };
  add(shell(tank, 24, 14), M.gloss, 'plastic', {name: 'tank cover', lift: [12, 62, 0], t0: 1.6});
  // two side shrouds beside the tank, pointing forward and down to a tip over the front fender
  const shroud = (u, v) => [spl([66, 54, 42, 28, 12], u), lerp(spl([17, 23, 29, 32.5, 30], u), spl([17, 12, 6, 2, 4], u), v), spl([21, 20.5, 19, 17, 15], u) + 1.5 * Math.sin(Math.PI * v)];
  add(merge(S.map((s) => shell(sided(shroud, s), 28, 10))), M.gloss, 'body', {name: 'side shrouds'});
  // two side covers under the front of the seat (off first, with the seat and tank cover)
  const sideCover = (u, v) => [spl([2, -12, -26, -36], u), lerp(spl([24, 26, 25, 21], u), spl([6, 1, 1, 6], u), v), spl([16.5, 17, 17.5, 17.5], u) + 1.2 * Math.sin(Math.PI * v)];
  for (const s of S) add(shell(sided(sideCover, s), 16, 8), M.gloss, 'plastic', {name: 'side cover', lift: [-6, 22, s * 60], t0: 2.0});
  // rear fenders: wings rising 20 deg toward the tail, their outer corners pointed behind the rear axle
  const rise = Math.tan(THREE.MathUtils.degToRad(20));
  const rfen0 = (u, v) => {
    const x = spl([-30, -44, -58, -72, -84, -88], u);
    return [x, -rise * x + 7 * v + 1.2 * Math.sin(Math.PI * v), lerp(spl([17, 17, 18, 22, 30, 37], u), spl([24, 38, RZ, RZ, 42, 38.5], u), v)];
  };
  const rfen = raise(rfen0, 0.03 * L - clearance(rfen0, RX, RY, RR, RZ, RW));
  add(merge(S.map((s) => shell(sided(rfen, s), 48, 12))), M.gloss, 'body', {name: 'rear fenders'});

  // --- one grey seat 0.42 L long, 0.12 L wide at the front and 0.20 L at the rear, rising 10 deg toward the tail
  const sLen = 0.42 * L, sx0 = 4, sMid = sx0 - sLen / 2;
  const sRise = Math.tan(THREE.MathUtils.degToRad(10));
  const seat = (u, v) => {
    const c = 2 * v - 1;
    const x = sx0 - u * sLen;
    const end = 5 * (Math.max(0, 1 - u / 0.07) ** 2 + Math.max(0, (u - 0.93) / 0.07) ** 2);
    return [x, SEAT_Y + sRise * (sMid - x) - end - 7 * c ** 4, c * lerp(0.06 * L, 0.1 * L, u)];
  };
  add(shell(seat, 36, 14, 2), M.seat, 'plastic', {name: 'seat', lift: [-18, 55, 0], t0: 1.2});

  // --- bare-aluminium frame, tubes 0.02 L across; its lower rails are the lowest point, 0.06 L off the ground
  const lowC = LOW_Y + 0.01 * L;
  const frame = [];
  for (const s of S) {
    frame.push(
      tube([[46, 28, s * 6], [36, 22, s * 11], [14, 18, s * 12], [-10, 18, s * 12], [-30, 17, s * 11], [-56, 20, s * 10], [-74, 24, s * 9]]),
      tube([[47, 26, s * 5], [50, 6, s * 10], [48, -16, s * 12], [40, -30, s * 12], [20, lowC, s * 12], [-20, lowC, s * 12], [-30, -27, s * 12]]),
      tube([[-30, -27, s * 12], [-32, -4, s * 12], [-30, 17, s * 11]]),
      tube([[-32, -4, s * 12], [-52, 8, s * 10.5], [-56, 20, s * 10]]),
    );
  }
  frame.push(
    orient(cylY(2.6, -7, 7, 0.4, 20), [-0.3, 1, 0], [47, 27, 0]),
    ...[[-30, 17, 11], [-20, lowC, 12], [48, -16, 12], [-56, 20, 10], [20, lowC, 12]].map(([x, y, z]) => tube([[x, y, -z], [x, y, z]])),
  );
  add(merge(frame), M.alu, 'body', {name: 'frame'});
  // the low front bumper hoop, 0.20 L wide
  const bw = 0.1 * L;
  add(merge([
    tube([[46, -29, -12], [68, -27, -15], [80, -25, -bw], [84.5, -16, -bw], [85, -9, -12], [85.5, -7.5, 0], [85, -9, 12], [84.5, -16, bw], [80, -25, bw], [68, -27, 15], [46, -29, 12]]),
    tube([[83.5, -20, -bw], [83.5, -20, bw]], 1.3),
  ]), M.alu, 'body', {name: 'bumper'});
  // double A-arms each side, a knuckle and hub inside the wheel
  for (const s of S) {
    add(merge([
      tube([[52, -8, s * 11], [57, -10, s * 36]], 1.3, 8), tube([[38, -8, s * 12], [57, -10, s * 36]], 1.3, 8),
      tube([[54, -27, s * 12], [58, -28, s * 37]], 1.3, 8), tube([[36, -27, s * 12], [58, -28, s * 37]], 1.3, 8),
      cylY(2.0, -30, -8, 0.3, 16).translate(58, 0, s * 38),
      at(cylY(3, -2.5, 2.5, 0.4, 20), FX, FY, s * 39.5, Math.PI / 2, 0, 0),
    ]), M.alu, 'body', {name: 'A-arms'});
  }
  // two front shocks leaning in 30 deg (pale springs), one rear monoshock on the swingarm
  const shock = (bot, top, R, name) => {
    const d = V(...top).sub(V(...bot));
    const len = d.length();
    add(orient(merge([cylY(0.9, 0, len, 0.2, 12), cylY(1.9, len * 0.55, len * 0.97, 0.3, 16), cylY(1.4, 0, 1.5, 0.3, 12)]), d.toArray(), bot), M.shock, 'body', {name});
    add(orient(coil(len * 0.62, R, 0.42, 7), d.toArray(), V(...bot).addScaledVector(d, 0.07).toArray()), M.spring, 'body', {name: name + ' spring'});
  };
  const lean = Math.tan(THREE.MathUtils.degToRad(30));
  for (const s of S) shock([57, -26, s * 30], [50, 7.5, s * (30 - 33.5 * lean)], 2.5, 'front shock');
  shock([-38, -19, 0], [-27, 12, 0], 2.9, 'rear shock');
  // swingarm to the solid rear axle
  add(merge([
    ...S.map((s) => tube([[-28, -22, s * 10], [-45, -21.5, s * 12], [RX, RY, s * 12]], 2.4)),
    tube([[-38, -21, -12], [-38, -21, 12]], 1.8),
    at(cylY(2.6, -12, 12, 0.4, 20), -28, -22, 0, Math.PI / 2, 0, 0),
    at(cylY(4.2, -13, 13, 0.5, 24), RX, RY, 0, Math.PI / 2, 0, 0),
  ]), M.alu, 'body', {name: 'swingarm'});
  add(at(cylY(1.9, -(RZ - RW * 0.3), RZ - RW * 0.3, 0.3, 20), RX, RY, 0, Math.PI / 2, 0, 0), M.steel, 'body', {name: 'rear axle'});
  // two footpegs with heel guards behind them
  const heel = (u, v) => [lerp(-11, -30, u), lerp(spl([-14, -9, -5], u), -31, v), 16 + Math.sin(Math.PI * v)];
  add(merge([
    ...S.map((s) => rbox(5, 2, 12, 0.6).translate(-6, -29.5, s * 20)),
    ...S.map((s) => shell(sided(heel, s), 10, 6, 0.6)),
  ]), M.alu, 'body', {name: 'footpegs and heel guards'});

  // --- black single-cylinder engine, upright under the tank, its intake facing the carburetor (0.07 L) behind it;
  // the radiator core in front
  const fins = [0, 1, 2, 3, 4].map((i) => at(rbox(15, 0.7, 14, 0.3), 19 - i * 0.35, -10 + i * 2.8, 0, 0, 0, -0.12));
  add(merge([
    rbox(30, 20, 20, 4, 2).translate(15, -22, 0),
    ...[[12, -21, 1, 8], [17, -23, -1, 7]].map(([x, y, s, r]) => at(cylY(r, 0, 3.5, 0.8, 32), x, y, s * 9.5, (s * Math.PI) / 2, 0, 0)),
    at(rbox(13, 16, 12, 2), 19, -4, 0, 0, 0, -0.12),
    ...fins,
    rbox(16, 9, 14, 2.5, 2).translate(20.5, 8.5, 0),
    rbox(13, 3, 11, 1.2).translate(21, 14, 0),
    at(cylY(3.4, 0, 2.5, 0.3, 24), 11, 0, 0, 0, 0, Math.PI / 2),
    at(rbox(4, 22, 28, 1), 44, 4, 0, 0, 0, -0.2),
  ]), M.engine, 'body', {name: 'engine'});
  // one exhaust pipe from the front of the cylinder head, round the right side, back to a silver muffler under the
  // right rear fender
  const pipe = [[27, 7, 1], [33, 6, 4], [35, 0, 10], [30, -6, 16], [18, -9, 19.5], [0, -8, 21.5], [-18, -4, 22.5], [-34, -1, 23]];
  add(tube(pipe, 2, 12), M.steel, 'body', {name: 'exhaust pipe'});
  const mDir = V(-40, 5, 1);
  const mLen = mDir.length();
  add(merge([
    orient(cylY(6.2, 0, mLen, 1, 28), mDir.toArray(), [-34, -1, 23]),
    orient(cylY(2, mLen, mLen + 3, 0.3, 16), mDir.toArray(), [-34, -1, 23]),
  ]), M.silver, 'body', {name: 'muffler'});
  add(rbox(22, 14, 18, 3, 2).translate(-45, 11, 0), M.plastic, 'body', {name: 'air box'});
  // handlebar on its column, with the crossbar and its pad; grips (tops at 0.59 L), thumb-throttle housing, levers
  const by = BAR_Y - 1.7;
  add(merge([
    orient(cylY(1.8, 0, 22, 0.3, 16), [-0.3, 1, 0], [47.5, 27.5, 0]),
    rbox(5, 3, 8, 1).translate(41, 50, 0),
    tube([[39, by, -38], [40, by - 1, -27], [41, 52, -12], [41, 51, 0], [41, 52, 12], [40, by - 1, 27], [39, by, 38]], 1.1, 10),
    tube([[40.5, by - 1.5, -13], [40.5, by - 1.5, 13]], 0.9, 8),
  ]), M.alu, 'body', {name: 'handlebar'});
  add(merge([
    ...S.map((s) => at(cylY(1.7, -4, 4, 0.4, 16), 39.2, by, s * 34.5, Math.PI / 2, 0, 0)),
    at(cylY(2, -7, 7, 0.5, 16), 40.5, by - 1.5, 0, Math.PI / 2, 0, 0),
    rbox(4.5, 4, 4.5, 1).translate(40, by - 0.3, 27.5),
    rbox(3.6, 0.8, 2.6, 0.3).translate(42.6, by - 1.8, 27.2),
    rbox(4, 3.6, 4, 1).translate(40, by - 0.3, -27.5),
    ...S.map((s) => rbox(1.4, 0.9, 13, 0.3).translate(43.5, by + 0.4, s * 32)),
  ]), M.plastic, 'body', {name: 'grips and throttle housing'});
  add(tube([[40, by - 1, 28], [36, 46, 24], [30, 25, 13], [17, 18, -3], [7, 11, -6], [2.6, 7.5, -4.6], [2.0, 5.6, -4.05]], 0.45, 8), M.plastic, 'piece', {name: 'throttle cable', piece: 'cable'});

  for (const it of items) {
    it.mesh.castShadow = it.mesh.receiveShadow = false; // the floor shader draws the contact shadow
    it.mesh.geometry.computeBoundingBox();
    it.centre = it.mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
  }
  return {group, items};
}
