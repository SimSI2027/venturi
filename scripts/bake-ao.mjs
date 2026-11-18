// node scripts/bake-ao.mjs  (run 25, item 5): bake recess shading into the 4 castings (body 1, float chamber 1-bowl, top cover 1-top,
// cable cover 65). Loads docs/index.html headless; for each casting renders its own depth (all its meshes, nothing else) from 128 directions
// round the sphere, and gives every vertex the cosine-weighted share of its hemisphere it sees out of (a). The shading factor is
// f = 1 - 0.4 * clamp((0.92 - a) / 0.47, 0, 1): open faces 1, a 90 deg inside corner about 0.75-0.8, a deep pocket 0.6 (40% darker at most).
// f is stored in 16 levels, 2 vertices a byte, base64, in src/carb/ao.js; src/lib/ao.js applies it. Rebuild after baking.
// Run it again only when a casting's geometry changes (src/lib/ao.js skips a mesh whose vertex count no longer matches).
import {createRequire} from 'node:module';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const page = await browser.newPage({viewport: {width: 800, height: 500}});
await page.goto(pathToFileURL(path.resolve('docs/index.html')).href + '?q=low&still');
await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
const t0 = Date.now();
const res = await page.evaluate(() => {
  const V = window.VENTURI, T = V.THREE, R = V.S.renderer;
  const N = 128, RES = 1024, BIAS_N = 0.4, BIAS_D = 0.8, MAX = 0.4;
  const dirs = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N, rr = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
    dirs.push(new T.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr));
  }
  const rt = new T.WebGLRenderTarget(RES, RES, {type: T.FloatType, format: T.RGBAFormat, depthBuffer: true});
  const mat = new T.ShaderMaterial({
    vertexShader: 'varying float vz; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vz = -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vz; void main() { gl_FragColor = vec4(vz, 0.0, 0.0, 1.0); }',
    side: T.DoubleSide,
  });
  const buf = new Float32Array(RES * RES * 4);
  const oldRT = R.getRenderTarget(), oldC = new T.Color(), oldA = R.getClearAlpha(), oldTM = R.toneMapping;
  R.getClearColor(oldC);
  const out = {}, stats = {};
  const v = new T.Vector3(), n = new T.Vector3(), q = new T.Vector3(), rgt = new T.Vector3(), up = new T.Vector3(), fwd = new T.Vector3();
  for (const id of ['1', '1-bowl', '1-top', '65']) {
    const p = V.parts.find((k) => k.id === id);
    p.obj.updateWorldMatrix(true, true);
    const inv = p.obj.matrixWorld.clone().invert();
    const scene = new T.Scene(), ms = [];
    p.obj.traverse((m) => m.isMesh && ms.push(m));
    const box = new T.Box3();
    const data = ms.map((m) => {
      const M = inv.clone().multiply(m.matrixWorld), NM = new T.Matrix3().getNormalMatrix(M);
      const pos = m.geometry.attributes.position, nor = m.geometry.attributes.normal, c = pos.count;
      const P = new Float32Array(c * 3), Nn = new Float32Array(c * 3);
      for (let i = 0; i < c; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(M);
        n.fromBufferAttribute(nor, i).applyMatrix3(NM).normalize();
        v.toArray(P, i * 3), n.toArray(Nn, i * 3), box.expandByPoint(v);
      }
      const k = new T.Mesh(m.geometry, mat);
      k.matrixAutoUpdate = false;
      k.matrix.copy(M);
      scene.add(k);
      return {c, P, Nn, acc: new Float32Array(c), w: new Float32Array(c)};
    });
    const sph = box.getBoundingSphere(new T.Sphere()), C = sph.center, r = sph.radius * 1.02;
    const cam = new T.OrthographicCamera(-r, r, r, -r, 0.01, 4 * r);
    for (const d of dirs) {
      cam.position.copy(C).addScaledVector(d, 2 * r);
      cam.lookAt(C);
      cam.updateMatrixWorld();
      R.setRenderTarget(rt);
      R.setClearColor(0x000000, 0);
      R.clear(true, true, false);
      R.render(scene, cam);
      R.readRenderTargetPixels(rt, 0, 0, RES, RES, buf);
      rgt.setFromMatrixColumn(cam.matrixWorld, 0);
      up.setFromMatrixColumn(cam.matrixWorld, 1);
      fwd.copy(d).negate();
      for (const D of data) {
        for (let i = 0; i < D.c; i++) {
          const nx = D.Nn[i * 3], ny = D.Nn[i * 3 + 1], nz = D.Nn[i * 3 + 2];
          const cs = nx * d.x + ny * d.y + nz * d.z;
          if (cs <= 0) continue;
          q.set(D.P[i * 3] + nx * BIAS_N, D.P[i * 3 + 1] + ny * BIAS_N, D.P[i * 3 + 2] + nz * BIAS_N);
          const dep = q.x * fwd.x + q.y * fwd.y + q.z * fwd.z - (cam.position.x * fwd.x + cam.position.y * fwd.y + cam.position.z * fwd.z);
          q.sub(C);
          const px = Math.floor(((q.dot(rgt) / r) * 0.5 + 0.5) * RES), py = Math.floor(((q.dot(up) / r) * 0.5 + 0.5) * RES);
          const z = px >= 0 && py >= 0 && px < RES && py < RES ? buf[(py * RES + px) * 4] : 0;
          if (z === 0 || dep <= z + BIAS_D) D.acc[i] += cs;
          D.w[i] += cs;
        }
      }
    }
    const hist = new Array(16).fill(0);
    out[id] = data.map((D) => {
      const bytes = new Uint8Array(Math.ceil(D.c / 2));
      for (let i = 0; i < D.c; i++) {
        const a = D.w[i] > 0 ? D.acc[i] / D.w[i] : 1;
        const f = 1 - MAX * Math.min(1, Math.max(0, (0.92 - a) / 0.47));
        const L = Math.round(((1 - f) / MAX) * 15);
        hist[L]++;
        bytes[i >> 1] |= L << ((i & 1) * 4);
      }
      let s = '';
      for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return [D.c, btoa(s)];
    });
    stats[id] = hist;
  }
  R.setRenderTarget(oldRT);
  R.setClearColor(oldC, oldA);
  R.toneMapping = oldTM;
  rt.dispose();
  return {out, stats};
});
const lines = Object.entries(res.out).map(([id, list]) => `  '${id}': [\n${list.map(([c, b]) => `    [${c}, '${b}'],`).join('\n')}\n  ],`);
const src = `// Generated by scripts/bake-ao.mjs (run 25, item 5): baked recess shading for the 4 castings, per mesh in traverse order:\n// [vertex count, base64 of 16 levels a vertex, 2 a byte]. Level L darkens by AO_MAX * L / 15. Do not edit by hand.\nexport const AO_MAX = 0.4;\nexport const AO = {\n${lines.join('\n')}\n};\n`;
fs.writeFileSync('src/carb/ao.js', src.replace(/\n/g, '\r\n'));
const kb = (Buffer.byteLength(src) / 1024).toFixed(1);
for (const [id, h] of Object.entries(res.stats)) {
  const tot = h.reduce((a, b) => a + b, 0);
  console.log(`${id}: ${tot} vertices; open (0%) ${((h[0] / tot) * 100).toFixed(1)}%, 1-24% darker ${((h.slice(1, 10).reduce((a, b) => a + b, 0) / tot) * 100).toFixed(1)}%, 25-40% darker ${((h.slice(10).reduce((a, b) => a + b, 0) / tot) * 100).toFixed(1)}%`);
}
console.log(`src/carb/ao.js ${kb} KB, baked in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
