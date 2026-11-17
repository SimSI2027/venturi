// Run 18 (Blender pilot): writes the 4 castings' cast meshes, as they are in the built page, to scratch/blender/in_<id>.glb.
// Usage: node tools/blender/export_in.mjs [docs/index.html]
// Each GLB has 1 node named by part ID ('1', '1-bowl', '1-top', '65') holding the part's biggest cast-material mesh in the
// part's own space: Y up, 1 unit = 1 mm (a glTF "metre" is 1 mm here; refine.py keeps Blender units = mm the same way).
import path from 'node:path'; import os from 'node:os'; import fs from 'node:fs';
import {createRequire} from 'node:module'; import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const IDS = ['1', '1-bowl', '1-top', '65'];
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const page = await browser.newPage({viewport: {width: 800, height: 500}});
await page.goto(pathToFileURL(path.resolve(process.argv[2] || 'docs/index.html')).href);
await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString('base64');
const data = await page.evaluate((ids) => {
  const enc = (ta) => { let s = ''; const u = new Uint8Array(ta.buffer, ta.byteOffset, ta.byteLength); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
  const out = {};
  for (const id of ids) {
    const p = window.VENTURI.parts.find((q) => q.id === id);
    let best = null;
    p.obj.traverse((o) => { if (o.isMesh && o.material.normalMap && (!best || o.geometry.attributes.position.count > best.geometry.attributes.position.count)) best = o; });
    const g = best.geometry;
    const pos = g.attributes.position.array, nor = g.attributes.normal.array, uv = g.attributes.uv.array;
    const idx = g.index ? g.index.array : Uint32Array.from({length: pos.length / 3}, (_, i) => i);
    out[id] = {pos: enc(new Float32Array(pos)), nor: enc(new Float32Array(nor)), uv: enc(new Float32Array(uv)), idx: enc(new Uint32Array(idx)), n: pos.length / 3, t: idx.length / 3,
      mat: best.position.toArray().concat(best.scale.toArray())};
  }
  return out;
}, IDS);
await browser.close();
fs.mkdirSync('scratch/blender', {recursive: true});
for (const id of IDS) {
  const d = data[id];
  if (d.mat.some((v, i) => v !== [0, 0, 0, 1, 1, 1][i])) throw new Error(`mesh of ${id} is not at the part origin`);
  const bufs = ['pos', 'nor', 'uv', 'idx'].map((k) => Buffer.from(d[k], 'base64'));
  const bin = Buffer.concat(bufs);
  const off = [0, bufs[0].length, bufs[0].length + bufs[1].length, bufs[0].length + bufs[1].length + bufs[2].length];
  const P = new Float32Array(bufs[0].buffer, bufs[0].byteOffset, bufs[0].length / 4);
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < P.length; i++) { mn[i % 3] = Math.min(mn[i % 3], P[i]); mx[i % 3] = Math.max(mx[i % 3], P[i]); }
  const json = {asset: {version: '2.0', generator: 'venturi export_in.mjs'}, scene: 0, scenes: [{nodes: [0]}], nodes: [{name: id, mesh: 0}],
    meshes: [{name: id, primitives: [{attributes: {POSITION: 0, NORMAL: 1, TEXCOORD_0: 2}, indices: 3}]}],
    accessors: [{bufferView: 0, componentType: 5126, count: d.n, type: 'VEC3', min: mn, max: mx}, {bufferView: 1, componentType: 5126, count: d.n, type: 'VEC3'},
      {bufferView: 2, componentType: 5126, count: d.n, type: 'VEC2'}, {bufferView: 3, componentType: 5125, count: d.t * 3, type: 'SCALAR'}],
    bufferViews: [0, 1, 2, 3].map((i) => ({buffer: 0, byteOffset: off[i], byteLength: bufs[i].length})), buffers: [{byteLength: bin.length}]};
  let j = Buffer.from(JSON.stringify(json)); j = Buffer.concat([j, Buffer.alloc((4 - (j.length % 4)) % 4, 0x20)]);
  const hdr = Buffer.alloc(12), ch = Buffer.alloc(8), ch2 = Buffer.alloc(8);
  hdr.writeUInt32LE(0x46546c67, 0); hdr.writeUInt32LE(2, 4); hdr.writeUInt32LE(12 + 8 + j.length + 8 + bin.length, 8);
  ch.writeUInt32LE(j.length, 0); ch.writeUInt32LE(0x4e4f534a, 4); ch2.writeUInt32LE(bin.length, 0); ch2.writeUInt32LE(0x004e4942, 4);
  fs.writeFileSync(`scratch/blender/in_${id}.glb`, Buffer.concat([hdr, ch, j, ch2, bin]));
  console.log(`in_${id}.glb`, d.t, 'tris', d.n, 'verts', 'bbox', mn.map((v) => v.toFixed(1)), mx.map((v) => v.toFixed(1)));
}
