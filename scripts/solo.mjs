// node scripts/solo.mjs [outDir=scratch/solo] [only=id,id,...]  (run 14, item 5)
// Renders every clickable part alone (the 79 references and their sub-parts: every part the page has) in docs/index.html
// and writes contact sheets of 20 parts, 5 x 4 cells, 1600 px wide: <outDir>/sheet_N.png and <outDir>/index.txt (the ids on each).
// Each part is framed on its own: of the 8 diagonal directions the one showing its widest silhouette, the part filling
// about 85% of its cell, every other mesh hidden.
import {createRequire} from 'node:module';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const {nameOf} = await import(pathToFileURL(path.resolve('src/carb/data.js')).href);
const [outDir = 'scratch/solo', only = ''] = process.argv.slice(2);
fs.mkdirSync(outDir, {recursive: true});
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const page = await browser.newPage({viewport: {width: 800, height: 800}, deviceScaleFactor: 1});
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(pathToFileURL(path.resolve('docs/index.html')).href);
await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
await page.waitForTimeout(1500);
const ids = await page.evaluate(() => window.VENTURI.parts.map((p) => p.id));
const key = (id) => { const k = id[0] === 'K' ? 1000 + parseInt(id.slice(1)) : parseInt(id); return k + (id.includes('-') ? 0.5 : 0); };
let list = ids.slice().sort((a, b) => key(a) - key(b));
if (only) list = list.filter((id) => only.split(',').includes(id));
const names = Object.fromEntries(list.map((id) => [id, nameOf(id)]));
const SHEET = 20, COLS = 5, CW = 320, CH = 320;
const index = [];
for (let s = 0; s * SHEET < list.length; s++) {
  const chunk = list.slice(s * SHEET, (s + 1) * SHEET);
  const url = await page.evaluate(async ({chunk, names, COLS, CW, CH}) => {
    const V = window.VENTURI, {camera, S, controls} = V;
    const R = S.renderer, cv = R.domElement;
    const meshes = [];
    V.asms.forEach((a) => a.group.traverse((o) => o.isMesh && meshes.push(o)));
    const rows = Math.ceil(chunk.length / COLS);
    const sheet = document.createElement('canvas');
    sheet.width = COLS * CW; sheet.height = rows * CH;
    const g = sheet.getContext('2d');
    g.fillStyle = '#15171a'; g.fillRect(0, 0, sheet.width, sheet.height);
    const Vc = camera.position.constructor;
    const dirs = [];
    for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) dirs.push(new Vc(sx, sy * 0.8, sz).normalize());
    const hidden = meshes.map((m) => m.visible);
    for (let i = 0; i < chunk.length; i++) {
      const p = V.parts.find((q) => q.id === chunk[i]);
      meshes.forEach((m) => (m.visible = false));
      const mine = [];
      p.obj.traverse((o) => o.isMesh && mine.push(o));
      mine.forEach((m) => (m.visible = true));
      p.obj.updateWorldMatrix(true, true);
      const pts = [];
      for (const m of mine) {
        const P = m.geometry.attributes.position, step = Math.max(1, Math.floor(P.count / 400));
        for (let k = 0; k < P.count; k += step) pts.push(new Vc().fromBufferAttribute(P, k).applyMatrix4(m.matrixWorld));
      }
      const c = new Vc();
      pts.forEach((q) => c.add(q)); c.multiplyScalar(1 / pts.length);
      // the bounding box centre (not the mean) keeps hoses and springs centred
      const lo = new Vc(1e9, 1e9, 1e9), hi = new Vc(-1e9, -1e9, -1e9);
      pts.forEach((q) => { lo.min(q); hi.max(q); });
      c.addVectors(lo, hi).multiplyScalar(0.5);
      let best = null;
      for (const d of dirs) {
        const f = d.clone().negate(), up = new Vc(0, 1, 0);
        const r = new Vc().crossVectors(f, up).normalize(), u = new Vc().crossVectors(r, f);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z1 = -1e9;
        for (const q of pts) { const v = q.clone().sub(c), x = v.dot(r), y = v.dot(u); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z1 = Math.max(z1, Math.abs(v.dot(f))); }
        const w = x1 - x0, h = y1 - y0, score = (w * h) * (d.y > 0 ? 1 : 0.92);
        if (!best || score > best.score) best = {score, d, w, h, z1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, r, u};
      }
      const half = Math.max(best.w, best.h) / 2 / 0.85;
      const dist = half / Math.tan((camera.fov * Math.PI) / 360) + best.z1;
      const tgt = c.clone().add(best.r.clone().multiplyScalar(best.cx)).add(best.u.clone().multiplyScalar(best.cy));
      camera.position.copy(tgt).add(best.d.clone().multiplyScalar(dist));
      camera.up.set(0, 1, 0);
      camera.near = Math.max(1, dist * 0.02); camera.far = dist * 6;
      camera.aspect = cv.width / cv.height;
      camera.lookAt(tgt);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
      controls.target.copy(tgt);
      S.render();
      const x = (i % COLS) * CW, y = Math.floor(i / COLS) * CH;
      g.drawImage(cv, 0, 0, cv.width, cv.height, x, y, CW, CH);
      g.strokeStyle = '#2a2d31'; g.strokeRect(x + 0.5, y + 0.5, CW - 1, CH - 1);
      g.font = '600 15px sans-serif'; g.fillStyle = '#e8d9b0'; g.textBaseline = 'top';
      g.fillText(`${chunk[i]}  ${names[chunk[i]]}`.slice(0, 40), x + 8, y + 7);
      await new Promise((r) => setTimeout(r, 0));
    }
    meshes.forEach((m, i) => (m.visible = hidden[i]));
    return sheet.toDataURL('image/png');
  }, {chunk, names, COLS, CW, CH});
  const file = path.join(outDir, `sheet_${s + 1}.png`);
  fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
  index.push(`sheet_${s + 1}: ${chunk.join(' ')}`);
  console.log(file, chunk.length);
}
fs.writeFileSync(path.join(outDir, 'index.txt'), index.join('\n') + '\n');
console.log('console errors:', errs.length ? errs.slice(0, 5).join(' | ') : 'none');
await browser.close();
