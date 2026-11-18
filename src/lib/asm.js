// One assembly = one group of the carburetor (hoses, sensor, ... body). Each part knows where it rests and how
// it comes off. Adapted from Ironwood's asm.js: creased normals, the dim/rim look hook, bloom soft cap.
import * as THREE from 'three';
import {makeMaterials, NO_BLOOM} from './materials.js';
import {toCreasedNormals, mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// smooth vertex normals on every curved surface, hard edges kept: faces meeting under 35 deg share normals
const CREASE = THREE.MathUtils.degToRad(35);
const creased = new WeakMap(); // shared geometries are processed once
const TEX = ['map', 'bumpMap', 'normalMap', 'roughnessMap'];
// run 22: a triangle with a neighbour in the same plane (within 0.5 deg) is a flat face: its 3 normals are its face normal,
// so a flat face next to a gentle curve no longer shades in diagonal bands. Positions, indices and triangle count do not change.
// run 23: the same rule for the other 3 castings: the float chamber, the top cover and cable cover 65 (the body is part 1)
const FLAT_PARTS = new Set(['body:1', 'bowl:1-bowl', 'top:1-top', 'linkage:65']);
const FLAT = Math.cos(THREE.MathUtils.degToRad(0.5)), SAME = Math.cos(THREE.MathUtils.degToRad(0.05));
// run 26 (item 3): the 4 castings replace that rule with area-weighted normals. Faces whose normals are within 0.5 deg and share an
// edge form a flat region. At each vertex a region takes its own normal (and so do the corners of faces within 35 deg of it) only when
// its area is at least 4 times that of the other regions there within 35 deg; every other corner averages the face normals within
// 35 deg of its own, each weighted by its area. A cylinder's strips (2 coplanar triangles each) come out smooth, a big flat face flat.
const FLAT_DOM = 4;
function areaNormals(g0) {
  const g = g0.index ? g0.toNonIndexed() : g0.clone();
  const P = g.attributes.position, nc = P.count, nt = nc / 3;
  const ids = new Map(), vid = new Int32Array(nc);
  for (let i = 0; i < nc; i++) {
    const k = `${P.getX(i).toFixed(4)},${P.getY(i).toFixed(4)},${P.getZ(i).toFixed(4)}`;
    let v = ids.get(k);
    if (v === undefined) ids.set(k, (v = ids.size));
    vid[i] = v;
  }
  const nv = ids.size, fn = new Float32Array(nt * 3), fa = new Float32Array(nt);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < nt; t++) {
    a.fromBufferAttribute(P, t * 3); b.fromBufferAttribute(P, t * 3 + 1).sub(a); c.fromBufferAttribute(P, t * 3 + 2).sub(a);
    b.cross(c);
    const l = b.length();
    fa[t] = l / 2;
    if (l > 0) fn.set([b.x / l, b.y / l, b.z / l], t * 3);
  }
  const dot = (s, t) => fn[s * 3] * fn[t * 3] + fn[s * 3 + 1] * fn[t * 3 + 1] + fn[s * 3 + 2] * fn[t * 3 + 2];
  // the faces round each vertex
  const off = new Int32Array(nv + 1);
  for (let i = 0; i < nc; i++) off[vid[i] + 1]++;
  for (let v = 0; v < nv; v++) off[v + 1] += off[v];
  const fill = off.slice(0, nv), at = new Int32Array(nc);
  for (let i = 0; i < nc; i++) at[fill[vid[i]]++] = (i / 3) | 0;
  // flat regions (union-find): coplanar faces sharing a vertex lie in 1 plane, so a face cut up by T-junctions stays 1 region
  const up = Int32Array.from({length: nt}, (_, i) => i);
  const find = (x) => { while (up[x] !== x) x = up[x] = up[up[x]]; return x; };
  const grown = new Uint8Array(nt);
  for (let v = 0; v < nv; v++) for (let i = off[v]; i < off[v + 1]; i++) {
    const s = at[i];
    // joined only when the 2 regions' own normals agree, so a gently curving strip never chains into 1 'flat' region
    // (a face joins a region only while it is still alone, and only within 0.5 deg of the region's first face)
    // (2 grown regions merge only when their first faces lie in 1 plane to 0.05 deg: the pieces of a face cut up by T-junctions)
    if (fa[s] > 0) for (let j = off[v]; j < i; j++) {
      const t = at[j], rs = find(s), rt = find(t);
      if (fa[t] <= 0 || rs === rt) continue;
      if (rs === s && !grown[s] ? dot(s, rt) > FLAT : dot(rs, rt) > SAME) (up[rs] = rt), (grown[rt] = 1);
    }
  }
  const reg = new Int32Array(nt), ra = new Float64Array(nt);
  for (let t = 0; t < nt; t++) (reg[t] = find(t)), (ra[reg[t]] += fa[t]);
  const N = new Float32Array(nc * 3), cornerOf = (t, v) => t * 3 + (vid[t * 3] === v ? 0 : vid[t * 3 + 1] === v ? 1 : 2);
  const C = Math.cos(CREASE);
  for (let v = 0; v < nv; v++) {
    const fs = at.subarray(off[v], off[v + 1]);
    const rs = [...new Set(Array.from(fs, (t) => reg[t]))];
    const dom = rs.filter((r) => ra[r] >= FLAT_DOM * rs.reduce((s, o) => s + (o !== r && dot(o, r) > C ? ra[o] : 0), 0));
    for (const t of fs) {
      let best = -1, bd = C;
      for (const r of dom) { const d = dot(t, r); if (d > bd || reg[t] === r) (bd = reg[t] === r ? 2 : d), (best = r); }
      let x = 0, y = 0, z = 0;
      if (best >= 0) (x = fn[best * 3]), (y = fn[best * 3 + 1]), (z = fn[best * 3 + 2]);
      else for (const f of fs) if (dot(f, t) > C) (x += fa[f] * fn[f * 3]), (y += fa[f] * fn[f * 3 + 1]), (z += fa[f] * fn[f * 3 + 2]);
      const l = Math.hypot(x, y, z) || 1, i = cornerOf(t, v);
      N[i * 3] = x / l; N[i * 3 + 1] = y / l; N[i * 3 + 2] = z / l;
    }
  }
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  return g;
}
function crease(g, flatFaces = false) {
  if (!creased.has(g)) {
    let c = flatFaces ? areaNormals(g) : toCreasedNormals(g, CREASE);
    if (!c.groups.length) c = mergeVertices(c, 1e-5); // indexed again
    creased.set(g, c);
  }
  return creased.get(g);
}

// run 23: the casting grain is a normal map tuned for flat faces; on a round boss or cylinder under 15 mm across it shows as speckle.
// Every connected piece of a cast mesh that is round in 1 cross-section (2 equal extents, every vertex within 4% of that radius)
// and under 15 mm across gets aGrain = SMALL_GRAIN (the cast material scales its normal map by it), every other vertex 1.
const SMALL_GRAIN = 0.12, SMALL_MM = 15;
function grainOf(g) {
  const P = g.attributes.position, I = g.index, n = P.count;
  if (g.attributes.aGrain) return;
  const id = new Int32Array(n), seen = new Map();
  for (let i = 0; i < n; i++) {
    const k = `${P.getX(i).toFixed(4)},${P.getY(i).toFixed(4)},${P.getZ(i).toFixed(4)}`;
    if (!seen.has(k)) seen.set(k, seen.size);
    id[i] = seen.get(k);
  }
  const up = Int32Array.from({length: seen.size}, (_, i) => i);
  const find = (a) => { while (up[a] !== a) a = up[a] = up[up[a]]; return a; };
  const nv = I ? I.count : n;
  for (let t = 0; t < nv; t += 3) {
    const a = id[I ? I.getX(t) : t], b = id[I ? I.getX(t + 1) : t + 1], c = id[I ? I.getX(t + 2) : t + 2];
    up[find(b)] = find(a);
    up[find(c)] = find(a);
  }
  const comp = new Map(); // root -> the vertex indices of that piece
  for (let i = 0; i < n; i++) {
    const r = find(id[i]);
    if (!comp.has(r)) comp.set(r, []);
    comp.get(r).push(i);
  }
  const grain = new Float32Array(n).fill(1);
  for (const vs of comp.values()) {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const i of vs) for (let d = 0; d < 3; d++) { const v = d === 0 ? P.getX(i) : d === 1 ? P.getY(i) : P.getZ(i); if (v < lo[d]) lo[d] = v; if (v > hi[d]) hi[d] = v; }
    const e = [0, 1, 2].map((d) => hi[d] - lo[d]);
    for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) {
      const w = Math.max(e[a], e[b]);
      if (w > SMALL_MM || Math.min(e[a], e[b]) < 0.88 * w) continue;
      const ca = (lo[a] + hi[a]) / 2, cb = (lo[b] + hi[b]) / 2, r = w / 2;
      let out = 0;
      for (const i of vs) {
        const va = a === 0 ? P.getX(i) : P.getY(i), vb = b === 2 ? P.getZ(i) : P.getY(i);
        if (Math.hypot(va - ca, vb - cb) > 1.04 * r) out++;
      }
      if (out <= 0.02 * vs.length) { for (const i of vs) grain[i] = SMALL_GRAIN; break; }
    }
  }
  g.setAttribute('aGrain', new THREE.BufferAttribute(grain, 1));
}

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (t * 6 - 15) + 10));
const clamp01 = (t) => Math.min(1, Math.max(0, t));

// run 13 (item 11): SECTION. CLIP is the one clipping plane every part material carries (normal (0, 0, -1): the +Z half is cut
// away; constant 1e5 = nothing clipped). SEC.value 1 = on: the inside faces seen through the cut are drawn a flat brass tint
// (a cap without a stencil buffer); at 0 they are discarded, so the page looks as before.
export const SEC = {value: 0};
export const CLIP = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e5);
const capTint = (id) => new THREE.Color(0xb98f3c).multiplyScalar(0.88 + 0.06 * ([...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % 3));

/** Clone a material with its shader hook (Material.copy drops onBeforeCompile). */
function cloneMat(m) {
  const c = m.clone();
  c.onBeforeCompile = m.onBeforeCompile;
  c.customProgramCacheKey = m.customProgramCacheKey;
  return c;
}
/**
 * Chain a look hook onto a material: uDim scales the lit result (dimming keeps the material, just darker),
 * uRim lifts it 15% (the focused group or the selected part). Every part is soft-capped under the bloom threshold.
 */
function look(m, U) {
  const base = m.onBeforeCompile;
  const key = m.customProgramCacheKey();
  m.onBeforeCompile = (sh, r) => {
    base.call(m, sh, r);
    sh.uniforms.uDim = U.dim;
    sh.uniforms.uRim = U.rim;
    sh.uniforms.uSec = SEC;
    sh.uniforms.uCap = U.cap;
    // run 25 (item 5): every part mesh carries aAO, the baked recess shading (1 where none is baked: src/lib/ao.js), so the 4 castings need
    // no shader variant of their own; it darkens the lit result on front faces only (the SECTION's cut faces keep their flat tint)
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aAO;\nvarying float vAO;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAO = aAO;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDim;\nuniform float uRim;\nuniform float uSec;\nuniform vec3 uCap;\nvarying float vAO;')
      .replace('#include <opaque_fragment>', 'outgoingLight = outgoingLight * uDim * (1.0 + 0.15 * uRim);\nif (gl_FrontFacing) outgoingLight *= vAO;\n' + NO_BLOOM + '\nif (!gl_FrontFacing) { if (uSec < 0.5) discard; outgoingLight = uCap; diffuseColor.a = 1.0; }\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => key + '|look';
}

export class Asm {
  /**
   * key, label: ids. offset: where the whole group goes at full explode [x, y, z] cm (along the way it really
   * comes off). index: its place in the manual's disassembly order (staggers the group phase).
   */
  constructor(key, label, {offset = [0, 0, 0], index = 0, axis = null} = {}) {
    this.key = key;
    this.label = label;
    this.axis = axis ? new THREE.Vector3(...axis).normalize() : null; // its parts' usual fitting axis
    this.group = new THREE.Group();
    this.group.name = key;
    this.parts = [];
    this.offset = new THREE.Vector3(...offset);
    this.index = index;
    this.M = makeMaterials();
  }

  /**
   * Register a part. id: its part id ('47', '1-top'). ex: its own fan-out [x, y, z] cm in group space at full
   * explode. rot: fan-out rotation [rx, ry, rz]. order: 0..1 stagger inside the part phase (first off = 0).
   * axis: the way it really comes off its seat, when not the group's direction (the guided modes use it).
   */
  add(obj, id, {ex = [0, 0, 0], rot = null, order = 0, axis = null, legs = null} = {}) {
    obj.userData.part = id;
    obj.userData.asm = this.key;
    this.group.add(obj);
    const part = {
      obj,
      id,
      asm: this,
      rest: obj.position.clone(),
      restQ: obj.quaternion.clone(),
      ex: new THREE.Vector3(...ex),
      rot: rot ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)) : null,
      order,
      axis: axis ? new THREE.Vector3(...axis).normalize() : null, // its real fitting axis, off its seat (null: the group's)
      legs: legs ? legs.map(([d, k]) => new THREE.Vector3(...d).normalize().multiplyScalar(k)) : null, // guided path in legs, each a direction times a number of 0.3-body-length hovers (null: 1 straight leg along axis)
      U: {dim: {value: 1}, rim: {value: 0}, cap: {value: capTint(id)}},
      mats: new Set(),
    };
    this.parts.push(part);
    obj.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData.partRoot = obj;
      }
    });
    return obj;
  }

  /**
   * Explode e in 0..1. Groups separate first (e 0-0.55, staggered in the manual's order), then each group's
   * parts fan out (e 0.45-1, staggered by order).
   */
  pose(e) {
    this.poseEach(() => [this.groupAmt(e), null], e);
  }
  /** The explode's group phase (0..1) at e. */
  groupAmt(e) {
    return ease(clamp01((e - this.index * 0.018) / 0.36));
  }
  /** The explode's part phase (0..1) for one part at e. */
  static partAmt(part, e) {
    return ease(clamp01((e - 0.45 - part.order * 0.18) / 0.34));
  }
  /**
   * Pose each part on its own (the guided modes): fn(part) -> [g, b], g the share of the group's offset it has
   * travelled, b the share of its own fan-out (null: the explode's part phase at e).
   */
  poseEach(fn, e = 0) {
    this.group.position.set(0, 0, 0);
    const q = new THREE.Quaternion();
    for (const part of this.parts) {
      const [g, bb] = fn(part);
      const b = bb ?? Asm.partAmt(part, e);
      part.obj.position.copy(part.ex).multiplyScalar(b).add(part.rest).addScaledVector(this.offset, g);
      part.obj.quaternion.copy(part.restQ);
      if (part.rot) {
        q.identity().slerp(part.rot, b);
        part.obj.quaternion.premultiply(q);
      }
    }
  }

  /** After building: creased normals, mipmapped textures, one material set per part with the look hook. */
  finalize() {
    for (const part of this.parts) {
      const map = new Map();
      part.obj.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry = crease(o.geometry, FLAT_PARTS.has(`${this.key}:${part.id}`));
        if (o.material.normalMap) grainOf(o.geometry);
        if (!o.geometry.attributes.aAO) o.geometry.setAttribute('aAO', new THREE.BufferAttribute(new Uint8Array(o.geometry.attributes.position.count).fill(255), 1, true)); // run 25 (item 5)
        if (!map.has(o.material)) map.set(o.material, cloneMat(o.material));
        o.material = map.get(o.material);
        for (const k of TEX) {
          const t = o.material[k];
          if (t && t.anisotropy !== 8) Object.assign(t, {anisotropy: 8, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, needsUpdate: true});
        }
      });
      map.forEach((m) => {
        look(m, part.U);
        // run 13 (item 11): both sides drawn (the inside faces are what the cut shows), the back faces discarded unless SECTION is on
        Object.assign(m, {side: THREE.DoubleSide, shadowSide: THREE.BackSide, forceSinglePass: true, clippingPlanes: [CLIP]});
        part.mats.add(m);
      });
    }
  }

  /** One part's look. d: dim 0..1 (1 = 30% brightness, half opacity). rim: lift 0..1 (+15%). hide: 0..1 fade out (1 = not drawn). */
  static setLook(part, d, rim = 0, hide = 0, floor = 0.5) {
    part.U.dim.value = 1 - 0.7 * d;
    part.U.rim.value = rim;
    part.obj.visible = hide < 0.99;
    for (const m of part.mats) {
      const a = (1 - (1 - floor) * d) * (1 - hide);
      const t = a < 0.999;
      if (m.transparent !== t) {
        m.transparent = t;
        m.needsUpdate = true;
      }
      m.opacity = a;
      m.depthWrite = !t;
    }
  }
}
