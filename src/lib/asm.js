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
const FLAT = Math.cos(THREE.MathUtils.degToRad(0.5));
function flatten(g) {
  const P = g.attributes.position, N = g.attributes.normal, nt = P.count / 3;
  const key = (i) => `${P.getX(i).toFixed(4)},${P.getY(i).toFixed(4)},${P.getZ(i).toFixed(4)}`;
  const fn = [], edges = new Map();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let t = 0; t < nt; t++) {
    a.fromBufferAttribute(P, t * 3); b.fromBufferAttribute(P, t * 3 + 1); c.fromBufferAttribute(P, t * 3 + 2);
    fn.push(b.sub(a).cross(c.sub(a)).normalize().clone());
    const k = [key(t * 3), key(t * 3 + 1), key(t * 3 + 2)];
    for (let e = 0; e < 3; e++) {
      const id = [k[e], k[(e + 1) % 3]].sort().join('|');
      if (!edges.has(id)) edges.set(id, []);
      edges.get(id).push(t);
    }
  }
  const flat = new Uint8Array(nt);
  for (const l of edges.values()) if (l.length === 2 && fn[l[0]].dot(fn[l[1]]) > FLAT) flat[l[0]] = flat[l[1]] = 1;
  for (let t = 0; t < nt; t++) if (flat[t] && fn[t].lengthSq() > 0) for (let k = 0; k < 3; k++) N.setXYZ(t * 3 + k, fn[t].x, fn[t].y, fn[t].z);
}
function crease(g, flatFaces = false) {
  if (!creased.has(g)) {
    let c = toCreasedNormals(g, CREASE);
    if (flatFaces) flatten(c);
    if (!c.groups.length) c = mergeVertices(c, 1e-5); // indexed again
    creased.set(g, c);
  }
  return creased.get(g);
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
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDim;\nuniform float uRim;\nuniform float uSec;\nuniform vec3 uCap;')
      .replace('#include <opaque_fragment>', 'outgoingLight = outgoingLight * uDim * (1.0 + 0.15 * uRim);\n' + NO_BLOOM + '\nif (!gl_FrontFacing) { if (uSec < 0.5) discard; outgoingLight = uCap; diffuseColor.a = 1.0; }\n#include <opaque_fragment>');
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
