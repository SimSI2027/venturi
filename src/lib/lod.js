// Run 30 (item 10, correction 67): the lower level of detail, made at load by vertex clustering. Every vertex falls in a grid cell of
// `cell` mm and a normal bucket (each normal component rounded to 1 / nq; 1.2 mm and 1 / 1.5 measured: castings 144k -> 77k
// triangles, the other parts 198k -> 97k, 35 ms for all), so a crease or a bevel's turn keeps its 2 sides apart while the
// dense small rounds and ring segments inside 1 cell merge. A cluster takes the mean of its vertices' attributes (position, normal
// renormalised, the baked recess shading aAO, uv), and a triangle whose corners fall in fewer than 3 clusters is dropped. Same
// attributes as the source, so no shader variant is added.
import * as THREE from 'three';

export function cluster(g, cell, nq = 1.5) {
  const P = g.attributes.position, N = g.attributes.normal, n = P.count;
  const map = new Map(), rep = new Int32Array(n);
  const q = (v) => Math.round(v * nq) + 3; // 0..6
  for (let i = 0; i < n; i++) {
    const x = Math.floor(P.getX(i) / cell) + 4096, y = Math.floor(P.getY(i) / cell) + 4096, z = Math.floor(P.getZ(i) / cell) + 4096;
    const b = N ? (q(N.getX(i)) * 7 + q(N.getY(i))) * 7 + q(N.getZ(i)) : 0;
    const k = ((x * 8192 + y) * 8192 + z) * 343 + b;
    let id = map.get(k);
    if (id === undefined) map.set(k, (id = map.size));
    rep[i] = id;
  }
  const m = map.size, out = new THREE.BufferGeometry(), cnt = new Float32Array(m);
  for (let i = 0; i < n; i++) cnt[rep[i]]++;
  for (const [name, a] of Object.entries(g.attributes)) {
    const s = a.itemSize, sum = new Float32Array(m * s);
    for (let i = 0; i < n; i++) for (let c = 0; c < s; c++) sum[rep[i] * s + c] += a.getComponent(i, c);
    const na = new THREE.BufferAttribute(new a.array.constructor(m * s), s, a.normalized);
    for (let j = 0; j < m; j++) for (let c = 0; c < s; c++) na.setComponent(j, c, sum[j * s + c] / cnt[j]);
    out.setAttribute(name, na);
  }
  if (out.attributes.normal) {
    const v = new THREE.Vector3(), A = out.attributes.normal;
    for (let j = 0; j < m; j++) v.fromBufferAttribute(A, j).normalize(), A.setXYZ(j, v.x, v.y, v.z);
  }
  const idx = g.index ? g.index.array : null, T = idx ? idx.length : n, tri = [];
  for (let t = 0; t < T; t += 3) {
    const a = rep[idx ? idx[t] : t], b = rep[idx ? idx[t + 1] : t + 1], c = rep[idx ? idx[t + 2] : t + 2];
    if (a !== b && b !== c && a !== c) tri.push(a, b, c);
  }
  out.setIndex(new THREE.BufferAttribute(m > 65535 ? new Uint32Array(tri) : new Uint16Array(tri), 1));
  out.boundingSphere = g.boundingSphere; // every part mesh carries 1 material (no groups)
  return out;
}

/** Each mesh keeps its full geometry in userData.lodHi and makes its clustered one (userData.lodLo) the first time it is needed. */
export function setLOD(meshes, lo, cell) {
  let n = 0;
  for (const m of meshes) {
    const u = m.userData;
    u.lodHi ??= m.geometry;
    if (lo && !u.lodLo) u.lodLo = cluster(u.lodHi, cell);
    m.geometry = lo ? u.lodLo : u.lodHi;
    n += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
  }
  return n;
}
