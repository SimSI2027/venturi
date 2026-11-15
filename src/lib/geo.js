// Shape helpers. Units are centimetres. Bore axis is +X (muzzle), +Y up, +Z is the gun's right side.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries, mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

export {THREE};
const V2 = THREE.Vector2;
const V3 = THREE.Vector3;

/** Mesh at a position, optional euler rotation. */
export function mesh(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  return m;
}
export function group(x = 0, y = 0, z = 0, ...kids) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  kids.forEach((k) => g.add(k));
  return g;
}

/** Rounded box (never a razor edge). */
export function rbox(w, h, d, r = 0.06, seg = 1) {
  r = Math.min(Math.max(r, 0.04), w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3); // never under 0.4 mm
  return new RoundedBoxGeometry(w, h, d, seg, r);
}

/** Lathe around +X. pts = [[x, r], ...] in order (closed loops: outer forward, inner back). */
export function latheX(pts, seg = 32, phiStart = 0, phiLength = Math.PI * 2) {
  const rmax = Math.max(...pts.map((p) => p[1]));
  const g = new THREE.LatheGeometry(pts.map(([x, r]) => new V2(Math.max(r, 1e-4), x)), Math.min(Math.max(seg, 48), rmax < 0.15 ? 12 : rmax < 0.4 ? 16 : rmax < 1 ? 32 : 48), phiStart, phiLength); // 48 radial on the tubes (no polygonal silhouette at a pill close-up), fewer on the thin pins and screws
  g.rotateZ(-Math.PI / 2);
  return g;
}

/** Hollow tube along +X from x0 to x1 with chamfered ends. */
export function tubeX(x0, x1, ro, ri, ch = 0.06, seg = 32) {
  return latheX(
    [
      [x0, ri + ch],
      [x0, ro - ch],
      [x0 + ch, ro],
      [x1 - ch, ro],
      [x1, ro - ch],
      [x1, ri + ch],
      [x1 - ch, ri],
      [x0 + ch, ri],
      [x0, ri + ch],
    ],
    seg,
  );
}

/** Solid rod along +X with chamfered ends. */
export function rodX(x0, x1, r, ch = 0.04, seg = 16) {
  return latheX([[x0, 0], [x0, r - ch], [x0 + ch, r], [x1 - ch, r], [x1, r - ch], [x1, 0]], seg);
}

/** Thread-look profile points: count grooves between x0 and x1, crest r, depth d. */
export function threadPts(x0, x1, r, d, count) {
  const out = [];
  const p = (x1 - x0) / count;
  for (let i = 0; i < count; i++) {
    out.push([x0 + i * p, r - d], [x0 + (i + 0.5) * p, r]);
  }
  out.push([x1, r - d]);
  return out;
}

/** Polygon with filleted corners. pts = [[x, y, r?], ...]. Works for Shape and Path (holes). */
export function rpoly(pts, rdef = 0.15, path = new THREE.Shape()) {
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const r = p[2] ?? rdef;
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ra = Math.min(r, da / 2.01);
    const rb = Math.min(r, db / 2.01);
    const p1 = [p[0] + ((a[0] - p[0]) / da) * ra, p[1] + ((a[1] - p[1]) / da) * ra];
    const p2 = [p[0] + ((b[0] - p[0]) / db) * rb, p[1] + ((b[1] - p[1]) / db) * rb];
    if (i === 0) path.moveTo(p1[0], p1[1]);
    else path.lineTo(p1[0], p1[1]);
    if (r > 0) path.quadraticCurveTo(p[0], p[1], p2[0], p2[1]);
  }
  path.closePath();
  return path;
}
export const hole = (pts, r) => rpoly(pts, r, new THREE.Path());
export function circ(x, y, r, path = new THREE.Path()) {
  path.absarc(x, y, r, 0, Math.PI * 2, false);
  return path;
}
export function slot(x0, x1, y, r) {
  const p = new THREE.Path();
  p.absarc(x1, y, r, -Math.PI / 2, Math.PI / 2, false);
  p.absarc(x0, y, r, Math.PI / 2, Math.PI * 1.5, false);
  p.closePath();
  return p;
}

/** Extrude an XY shape to total thickness `depth` along Z, centred on z=0, with a real bevel. */
export function extrudeXY(shape, depth, bevel = 0.05, curveSegments = 20, extra = {}) {
  if (!extra.free) curveSegments = Math.min(curveSegments, 4); // 4 per curve: fillets and holes stay round at the default view
  const b = Math.min(Math.max(bevel, 0.04), depth * 0.45); // 0.4 mm bevel minimum
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(depth - 2 * b, 1e-3),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: -b,
    bevelSegments: extra.bevelSegments ?? 2,
    curveSegments,
    steps: extra.steps ?? 1,
  });
  g.translate(0, 0, -(depth - 2 * b) / 2);
  return b > 0 ? roundBevels(g) : g;
}

/**
 * Smooth the bevel normals of a (non-indexed) extrusion so edges read as rounded, not faceted.
 * Caps (normal ±Z) stay flat; other faces blend with neighbours inside 50°, area-weighted so big
 * flat walls keep their normal and the narrow bevel strips carry the roll.
 */
function roundBevels(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const nf = p.count / 3;
  const fn = new Float32Array(nf * 3);
  const fa = new Float32Array(nf);
  const a = new V3(), b = new V3(), c = new V3(), e1 = new V3(), e2 = new V3();
  const buckets = new Map();
  const key = (i) => `${Math.round(p.getX(i) * 1e4)},${Math.round(p.getY(i) * 1e4)},${Math.round(p.getZ(i) * 1e4)}`;
  for (let f = 0; f < nf; f++) {
    a.fromBufferAttribute(p, f * 3);
    b.fromBufferAttribute(p, f * 3 + 1);
    c.fromBufferAttribute(p, f * 3 + 2);
    e1.subVectors(b, a).cross(e2.subVectors(c, a));
    fa[f] = e1.length() / 2;
    e1.normalize();
    fn.set([e1.x, e1.y, e1.z], f * 3);
    for (let k = 0; k < 3; k++) {
      const id = key(f * 3 + k);
      if (!buckets.has(id)) buckets.set(id, []);
      buckets.get(id).push(f);
    }
  }
  const cosSide = Math.cos(THREE.MathUtils.degToRad(50));
  for (let f = 0; f < nf; f++) {
    const fx = fn[f * 3], fy = fn[f * 3 + 1], fz = fn[f * 3 + 2];
    if (Math.abs(fz) > 0.999 || fa[f] === 0) {
      for (let k = 0; k < 3; k++) n.setXYZ(f * 3 + k, fx, fy, fz);
      continue;
    }
    for (let k = 0; k < 3; k++) {
      let sx = 0, sy = 0, sz = 0;
      for (const o of buckets.get(key(f * 3 + k))) {
        const ox = fn[o * 3], oy = fn[o * 3 + 1], oz = fn[o * 3 + 2];
        if (fx * ox + fy * oy + fz * oz < cosSide) continue;
        sx += ox * fa[o];
        sy += oy * fa[o];
        sz += oz * fa[o];
      }
      const l = Math.hypot(sx, sy, sz) || 1;
      n.setXYZ(f * 3 + k, sx / l, sy / l, sz / l);
    }
  }
  n.needsUpdate = true;
  return g;
}

/** Cylinder along Y like CylinderGeometry, but with small chamfered rims (no razor edges). */
export function rcyl(rTop, rBot, h, seg = 16, ch = Math.min(0.04, rTop * 0.25, rBot * 0.25, h * 0.25)) {
  const g = new THREE.LatheGeometry(
    [[0, -h / 2], [rBot - ch, -h / 2], [rBot, -h / 2 + ch], [rTop, h / 2 - ch], [rTop - ch, h / 2], [0, h / 2]].map(([r, y]) => new V2(Math.max(r, 1e-4), y)),
    (seg = Math.min(seg, 16)),
  );
  if (seg >= 10) return g;
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}
/** Shape drawn in (x, z) top view, extruded to thickness along Y, centred on y=0. */
export function extrudeXZ(shape, thick, bevel = 0.04, cs = 16) {
  const g = extrudeXY(shape, thick, bevel, cs);
  g.rotateX(Math.PI / 2); // (x, y, z) -> (x, -z, y): shape y becomes world z
  return g;
}
/** Shape drawn in (z, y) cross-section, extruded along +X from 0 to len. */
export function extrudeYZ(shape, len, bevel = 0.05, cs = 32, steps = 1, free = false) {
  const g = extrudeXY(shape, len, bevel, cs, {steps, free});
  g.rotateY(Math.PI / 2); // depth z -> x, shape x -> -z
  g.translate(len / 2, 0, 0);
  return g;
}

/** Re-smooth a deformed geometry: weld, recompute normals, planar uv. */
export function smooth(g, tol = 1e-4) {
  g = g.index ? g.toNonIndexed() : g;
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, tol);
  g.computeVertexNormals();
  const p = g.attributes.position;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) * 0.1;
    uv[i * 2 + 1] = (p.getY(i) + p.getZ(i)) * 0.1;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

/** Merge geometries of one material into one (mixed indexed / non-indexed is fine). */
export function merge(list) {
  const flat = list.map((g) => {
    let h = g.index ? g.toNonIndexed() : g.clone();
    for (const k of Object.keys(h.attributes)) if (!['position', 'normal', 'uv'].includes(k)) h.deleteAttribute(k);
    if (!h.attributes.uv) h.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(h.attributes.position.count * 2), 2));
    h.morphAttributes = {};
    h.clearGroups();
    return h;
  });
  return mergeGeometries(flat, false);
}
/** Apply a transform to a geometry and return it. */
export function at(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) {
  const m = new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new V3(s, s, s));
  return g.applyMatrix4(m);
}

/**
 * Sweep a closed cross-section along a planar XY path. section = [[n, z], ...] (n along the path's
 * left normal in the XY plane, z across). path = array of [x, y]. scale(t) narrows the section.
 */
export function sweepXY(section, path, {closed = false, scale = () => [1, 1], samples = 0} = {}) {
  let pts = path.map(([x, y]) => new V2(x, y)).filter((p, i, a) => i === 0 || p.distanceTo(a[i - 1]) > 1e-5);
  if (samples) {
    const c = closed ? new THREE.SplineCurve([...pts, pts[0]]) : new THREE.SplineCurve(pts);
    pts = c.getSpacedPoints(samples);
    if (closed) pts.pop();
  }
  const N = pts.length;
  const S = section.length;
  const pos = [];
  const frames = [];
  for (let i = 0; i < N; i++) {
    const a = pts[closed ? (i - 1 + N) % N : Math.max(i - 1, 0)];
    const b = pts[closed ? (i + 1) % N : Math.min(i + 1, N - 1)];
    const t = new V2().subVectors(b, a).normalize();
    frames.push(new V2(-t.y, t.x));
  }
  for (let i = 0; i < N; i++) {
    const [sn, sz] = scale(closed ? i / N : i / (N - 1));
    for (let j = 0; j < S; j++) {
      const [n, z] = section[j];
      pos.push(pts[i].x + frames[i].x * n * sn, pts[i].y + frames[i].y * n * sn, z * sz);
    }
  }
  const idx = [];
  const rings = closed ? N : N - 1;
  for (let i = 0; i < rings; i++) {
    const i2 = (i + 1) % N;
    for (let j = 0; j < S; j++) {
      const j2 = (j + 1) % S;
      const a = i * S + j;
      const b = i2 * S + j;
      const c = i2 * S + j2;
      const d = i * S + j2;
      idx.push(a, d, b, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  // fix winding: outward normals for a counter-clockwise section
  g.computeVertexNormals();
  let body = g;
  if (!closed) {
    const caps = [];
    const tri = THREE.ShapeUtils.triangulateShape(section.map(([n, z]) => new V2(n, z)), []);
    for (const end of [0, N - 1]) {
      const [sn, sz] = scale(end / (N - 1));
      const cp = [];
      for (let j = 0; j < S; j++) {
        const [n, z] = section[j];
        cp.push(pts[end].x + frames[end].x * n * sn, pts[end].y + frames[end].y * n * sn, z * sz);
      }
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
      const want = new V3(pts[Math.min(end + 1, N - 1)].x - pts[Math.max(end - 1, 0)].x, pts[Math.min(end + 1, N - 1)].y - pts[Math.max(end - 1, 0)].y, 0).multiplyScalar(end === 0 ? -1 : 1);
      const P = (k) => new V3(cp[k * 3], cp[k * 3 + 1], cp[k * 3 + 2]);
      const f0 = tri[0];
      const nrm = new V3().subVectors(P(f0[1]), P(f0[0])).cross(new V3().subVectors(P(f0[2]), P(f0[0])));
      const flip = nrm.dot(want) < 0;
      cg.setIndex(tri.flatMap((f) => (flip ? [f[0], f[2], f[1]] : [f[0], f[1], f[2]])));
      cg.computeVertexNormals();
      caps.push(cg);
    }
    body = merge([g, ...caps]);
  }
  return body;
}
/** Rounded-rectangle cross-section points for sweepXY: half sizes hn, hz, corner r. CCW. */
export function rrectSection(hn, hz, r, seg = 4) {
  const out = [];
  const c = [
    [hn - r, hz - r, 0],
    [-hn + r, hz - r, Math.PI / 2],
    [-hn + r, -hz + r, Math.PI],
    [hn - r, -hz + r, Math.PI * 1.5],
  ];
  for (const [cn, cz, a0] of c) for (let k = 0; k <= seg; k++) {
    const a = a0 + (k / seg) * (Math.PI / 2);
    out.push([cn + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return out;
}

/** Coil spring along +X: closed ground ends, real helix. */
export function spring(len, R, wire, turns, {endTurns = 1.25} = {}) {
  const pitchEnd = wire * 2.05;
  const body = turns - 2 * endTurns;
  const pitch = (len - 2 * endTurns * pitchEnd - wire * 2) / body;
  const xAt = (k) => {
    if (k <= endTurns) return wire + k * pitchEnd;
    if (k <= endTurns + body) return wire + endTurns * pitchEnd + (k - endTurns) * pitch;
    return wire + endTurns * pitchEnd + body * pitch + (k - endTurns - body) * pitchEnd;
  };
  class Helix extends THREE.Curve {
    getPoint(t, out = new V3()) {
      const k = t * turns;
      const a = k * Math.PI * 2;
      return out.set(xAt(k), R * Math.cos(a), R * Math.sin(a));
    }
  }
  // 24 segments per turn, 12 round the wire: no polygonal coil or flat-sided wire at any close-up
  return new THREE.TubeGeometry(new Helix(), Math.ceil(turns * 24), wire, 12, false);
}

/** Knurled cylinder along +X (straight knurl): n ridges. */
export function knurlX(x0, x1, r, n = 48, depth = 0.05, ch = 0.08, ri = 0) {
  const s = new THREE.Shape();
  if (ri > 0) s.holes.push(new THREE.Path().absarc(0, 0, ri, 0, Math.PI * 2, true));
  const M = n * 2;
  for (let i = 0; i <= M; i++) {
    const a = (i / M) * Math.PI * 2;
    const rr = i % 2 ? r - depth : r;
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  return extrudeYZ(s, x1 - x0, ch, 1).translate(x0, 0, 0);
}

/** Pin along +Z (cross pin), chamfered. */
export function pinZ(len, r, seg = 20) {
  const g = rodX(-len / 2, len / 2, r, Math.min(0.04, r * 0.3), seg);
  g.rotateY(-Math.PI / 2);
  return g;
}
/** Screw along +X, head at x=0 facing -X, shank toward +X. Slot cut look via groove. */
export function screwX(len, rHead, rShank, headH, threads = 12) {
  const pts = [
    [-headH, 0],
    [-headH, rHead * 0.75],
    [-headH * 0.55, rHead],
    [0, rHead],
    [0, rShank],
    ...threadPts(headH * 0.3, len - 0.1, rShank, rShank * 0.18, threads),
    [len, rShank * 0.6],
    [len, 0],
  ];
  return latheX(pts, 12);
}
export {mergeVertices, mergeGeometries};
