// One assembly = one group of the carburetor (hoses, sensor, ... body). Each part knows where it rests and how
// it comes off. Adapted from Ironwood's asm.js: creased normals, the dim/rim look hook, bloom soft cap.
import * as THREE from 'three';
import {makeMaterials, NO_BLOOM} from './materials.js';
import {toCreasedNormals, mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// smooth vertex normals on every curved surface, hard edges kept: faces meeting under 35 deg share normals
const CREASE = THREE.MathUtils.degToRad(35);
const creased = new WeakMap(); // shared geometries are processed once
const TEX = ['map', 'bumpMap', 'normalMap', 'roughnessMap'];
function crease(g) {
  if (!creased.has(g)) {
    let c = toCreasedNormals(g, CREASE);
    if (!c.groups.length) c = mergeVertices(c, 1e-5); // indexed again
    creased.set(g, c);
  }
  return creased.get(g);
}

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (t * 6 - 15) + 10));
const clamp01 = (t) => Math.min(1, Math.max(0, t));

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
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDim;\nuniform float uRim;')
      .replace('#include <opaque_fragment>', 'outgoingLight = outgoingLight * uDim * (1.0 + 0.15 * uRim);\n' + NO_BLOOM + '\n#include <opaque_fragment>');
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
  add(obj, id, {ex = [0, 0, 0], rot = null, order = 0, axis = null} = {}) {
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
      U: {dim: {value: 1}, rim: {value: 0}},
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
        o.geometry = crease(o.geometry);
        if (!map.has(o.material)) map.set(o.material, cloneMat(o.material));
        o.material = map.get(o.material);
        for (const k of TEX) {
          const t = o.material[k];
          if (t && t.anisotropy !== 8) Object.assign(t, {anisotropy: 8, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, needsUpdate: true});
        }
      });
      map.forEach((m) => (look(m, part.U), part.mats.add(m)));
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
