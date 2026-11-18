// node scripts/review.mjs <round>  (run 26, item 9): the critic loop's evidence (correction 54).
// scratch/review_A_r<round>.png, 1600 px wide: mine_1, mine_3, mine_4, mine_6 each beside the model from the same angle (the run 11 landmark
//   fit, scratch/lm11_cam.json; the photos only composed here, never shipped).
// scratch/review_B_r<round>.png, 1600 px wide: B1 the body alone from above (top cover off), B2 the body's underside (bowl off), B3 the float
//   chamber alone from above, B4 the bore looked through from the air-box end (+X) with the slide group out.
// scratch/metrics.txt: stripe strength (scripts/normals.mjs), speckle (the grain's p99 to median contrast on the body alone), whether the bore
//   shows through (share of rays inside 0.8 of the bore radius that pass every part), triangles drawn (one scene pass, visible meshes) in 8
//   states, the quality flags, first frame, tray clearance and empty outline frames (scripts/tray.mjs), footer (scripts/foot.mjs), errors.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const R = process.argv[2] ?? '0';
const URL = pathToFileURL(path.resolve('docs/index.html')).href;
const CAM = JSON.parse(fs.readFileSync('scratch/lm11_cam.json', 'utf8'));
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const errs = [];
const watch = (page) => (page.on('console', (m) => m.type() === 'error' && errs.push(m.text())), page.on('pageerror', (e) => errs.push(e.message)), page);
const open = async (w, h, q = 'q=high') => {
  const page = watch(await browser.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 1}));
  await page.goto(`${URL}?${q}`);
  await page.waitForFunction(() => window.__READY, null, {timeout: 90000});
  await page.waitForTimeout(1500);
  return page;
};
// the visitor's camera, held: no sway, no framing rule; every page element but the canvas hidden
const freeze = () => {
  const V = window.VENTURI, keep = new Set();
  for (let e = document.querySelector('canvas'); e; e = e.parentElement) keep.add(e);
  document.body.querySelectorAll('*').forEach((e) => !keep.has(e) && !e.closest('canvas') && (e.style.visibility = 'hidden'));
  V.controls.dispatchEvent({type: 'start'});
  V.controls.update = () => false;
};
const tmp = (n) => `scratch/_rv_${n}.png`;

// --- sheet A
const HIDE = {4: ['65', '66', '67', '70', '68', '69']}; // mine_4 has the cable cover off
const sizes = {};
for (const k of ['1', '3', '4', '6']) {
  const c = CAM[k];
  const [W, H] = execFileSync('python', ['-I', '-c', `from PIL import Image; print(*Image.open('scratch/own/m${k}.jpg').size)`]).toString().trim().split(' ').map(Number);
  const f = 800 / W, h = Math.round(H * f);
  sizes[k] = h;
  const page = await open(800, h);
  await page.evaluate(freeze);
  await page.evaluate(({c, f, h, hide}) => {
    const V = window.VENTURI, cam = V.camera, C = cam.position.constructor;
    V.parts.forEach((p) => hide.includes(p.id) && p.obj.traverse((m) => m.isMesh && (m.visible = false)));
    const carb = V.asms[0].group.parent;
    carb.updateMatrixWorld(true);
    const Rv = new C(...c.R).transformDirection(carb.matrixWorld), U = new C(...c.U).transformDirection(carb.matrixWorld);
    const back = new C().crossVectors(Rv, U).normalize(), P = new C(...c.P).applyMatrix4(carb.matrixWorld);
    const s = c.s * f, px = c.px[0] * f, py = c.px[1] * f, D = h / (2 * Math.tan((cam.fov * Math.PI) / 360) * s);
    const t = P.clone().addScaledVector(Rv, -(px - 400) / s).addScaledVector(U, (py - h / 2) / s);
    cam.up.copy(U);
    cam.position.copy(t).addScaledVector(back, D);
    cam.lookAt(t);
    cam.updateMatrixWorld();
  }, {c, f, h, hide: HIDE[k] || []});
  await page.waitForTimeout(900);
  await page.screenshot({path: tmp('a' + k)});
  await page.close();
}

// --- sheet B: 4 detail views, 800 x 560 each
const VIEWS = [
  ['B1 body from above, top cover off', ['1'], [0, 1, 0], [-1, 0, 0]],
  ['B2 body underside, bowl off', ['1'], [0, -1, 0], [-1, 0, 0]],
  ['B3 float chamber from above', ['1-bowl'], [0, 1, 0], [-1, 0, 0]],
  ['B4 bore from the air-box end, slide out', null, [1, 0, 0], [0, 1, 0]],
];
let bore = null;
for (const [i, [label, only, dir, up]] of VIEWS.entries()) {
  const page = await open(800, 560);
  await page.evaluate(freeze);
  const r = await page.evaluate(({only, dir, up, label}) => {
    const V = window.VENTURI, T = V.THREE, cam = V.camera, carb = V.asms[0].group.parent;
    const slide = new Set(V.asms.find((a) => a.key === 'slide').parts.map((p) => p.id));
    const show = (p) => (only ? only.includes(p.id) : !slide.has(p.id));
    V.parts.forEach((p) => p.obj.traverse((m) => m.isMesh && (m.visible = show(p))));
    V.S.scene.traverse((o) => o.isMesh && !o.userData.partRoot && (o.visible = false)); // floor, shadow catcher
    carb.updateMatrixWorld(true);
    const box = new T.Box3();
    V.parts.forEach((p) => show(p) && box.expandByObject(p.obj));
    const ctr = box.getCenter(new T.Vector3()), rad = box.getSize(new T.Vector3()).length() / 2;
    const d = new T.Vector3(...dir).transformDirection(carb.matrixWorld), u = new T.Vector3(...up).transformDirection(carb.matrixWorld);
    const dist = (rad / Math.sin(((cam.fov / 2) * Math.PI) / 180)) * (label.startsWith('B4') ? 1.05 : 0.8);
    cam.up.copy(u);
    cam.position.copy(ctr).addScaledVector(d, dist);
    cam.lookAt(ctr);
    cam.updateMatrixWorld();
    if (!label.startsWith('B4')) return null;
    // the bore: rays parallel to the bore axis inside 0.8 of its radius; a ray that meets no shown mesh shows the background
    const meshes = [];
    V.parts.forEach((p) => show(p) && p.obj.traverse((m) => m.isMesh && meshes.push(m)));
    const body = V.parts.find((p) => p.id === '1').obj, ax = d.clone().negate(), ray = new T.Raycaster();
    const o0 = body.getWorldPosition(new T.Vector3()); // the bore axis runs through the body's origin along X
    const side = new T.Vector3().crossVectors(ax, u).normalize(), rB = 19.5 * 0.8 * new T.Vector3(1, 0, 0).transformDirection(body.matrixWorld).length() * body.getWorldScale(new T.Vector3()).x;
    let n = 0, clear = 0;
    for (let a = -1; a <= 1; a += 0.1) for (let b = -1; b <= 1; b += 0.1) {
      if (a * a + b * b > 1) continue;
      n++;
      const o = o0.clone().addScaledVector(side, a * rB).addScaledVector(u, b * rB).addScaledVector(ax, -500);
      ray.set(o, ax);
      if (!ray.intersectObjects(meshes, false).length) clear++;
    }
    return {n, clear};
  }, {only, dir, up, label});
  if (r) bore = r;
  await page.waitForTimeout(900);
  await page.screenshot({path: tmp('b' + i)});
  await page.close();
}
const labels = JSON.stringify(VIEWS.map((v) => v[0]));
execFileSync('python', ['-I', '-c', `
from PIL import Image, ImageDraw
import json
def lab(im, t):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 + 7 * len(t), 18], fill=(0, 0, 0)); d.text((4, 3), t, fill=(230, 210, 150))
ks = ['1', '3', '4', '6']; hs = ${JSON.stringify(sizes)}
pairs = []
for k in ks:
    ph = Image.open('scratch/own/m%s.jpg' % k).convert('RGB'); ph = ph.resize((400, round(ph.height * 400 / ph.width)))
    md = Image.open('scratch/_rv_a%s.png' % k).convert('RGB'); md = md.resize((400, round(md.height * 400 / md.width)))
    p = Image.new('RGB', (800, max(ph.height, md.height)), (20, 20, 22)); p.paste(ph, (0, 0)); p.paste(md, (400, 0))
    lab(p, 'A%d mine_%s | model' % (ks.index(k) + 1, k)); pairs.append(p)
rows = [pairs[0:2], pairs[2:4]]
H = sum(max(q.height for q in r) for r in rows)
A = Image.new('RGB', (1600, H), (20, 20, 22)); y = 0
for r in rows:
    for j, q in enumerate(r): A.paste(q, (800 * j, y))
    y += max(q.height for q in r)
A.save('scratch/review_A_r${R}.png')
B = Image.new('RGB', (1600, 1120), (20, 20, 22)); L = json.loads('${labels}')
for i in range(4):
    q = Image.open('scratch/_rv_b%d.png' % i).convert('RGB'); lab(q, L[i]); B.paste(q, (800 * (i % 2), 560 * (i // 2)))
B.save('scratch/review_B_r${R}.png')
`]);

// --- metrics
const M = [`round ${R} · ${new Date().toISOString().slice(0, 16)}`];
const run = (args, env = {}) => { try { return execFileSync('node', args, {env: {...process.env, ...env}, maxBuffer: 1 << 24}).toString(); } catch (e) { return String(e.stdout || e); } };
// stripes
const nm = run(['scripts/normals.mjs']).split('\n').filter((l) => /^\S+: smooth/.test(l)).map((l) => l.split(' || ')[0]);
M.push('stripes (smooth edges with a corner-normal step > 2%; dominant flat corners bent > 2%):', ...nm.map((l) => '  ' + l));
// speckle, triangles, flags, first frame
{
  const page = await open(1418, 930, '');
  const sp = await page.evaluate(async () => {
    const V = window.VENTURI, S = V.S, cv = document.querySelector('canvas');
    V.controls.dispatchEvent({type: 'start'});
    V.controls.update = () => false;
    V.parts.forEach((p) => p.obj.traverse((m) => m.isMesh && (m.visible = p.id === '1')));
    const shot = () => { S.render(); const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const x = c.getContext('2d'); x.drawImage(cv, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const mats = [];
    V.parts.forEach((p) => p.obj.traverse((m) => m.isMesh && [m.material].flat().forEach((q) => q.normalMap && mats.push(q))));
    const a = shot();
    mats.forEach((q) => q.normalScale.set(0, 0));
    const b = shot();
    mats.forEach((q) => q.normalScale.set(1, 1));
    const d = [];
    for (let i = 0; i < a.length; i += 4) { const l = (k, j) => 0.2126 * k[j] + 0.7152 * k[j + 1] + 0.0722 * k[j + 2]; const v = Math.abs(l(a, i) - l(b, i)); if (v > 0) d.push(v); }
    d.sort((x, y) => x - y);
    const q = (f) => d[Math.floor(f * (d.length - 1))] || 0;
    return {px: d.length, med: q(0.5), p99: q(0.99)};
  });
  M.push(`speckle (cast grain contrast on the body alone, default view): median ${(sp.med / 2.55).toFixed(1)}%, p99 ${(sp.p99 / 2.55).toFixed(1)}%, ratio ${(sp.p99 / Math.max(sp.med, 1e-6)).toFixed(2)} over ${sp.px} px`);
  await page.close();
}
M.push(`bore shows through from the air-box end with the slide out: ${bore ? `${bore.clear} of ${bore.n} rays inside 0.8 of the bore radius pass (${((100 * bore.clear) / bore.n).toFixed(0)}%)` : 'not measured'}`);
{
  const page = await open(1418, 930, '');
  const tri = () => page.evaluate(() => {
    const V = window.VENTURI;
    let t = 0;
    const drawn = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
    V.S.scene.traverse((m) => { if (!m.isMesh || !drawn(m) || [m.material].flat().every((x) => x.opacity < 0.01)) return; const g = m.geometry; t += (g.index ? g.index.count : g.attributes.position.count) / 3; });
    return Math.round(t);
  });
  const states = [['explore', ''], ['explode 1', 'V.st.target = 1;'], ['part 27 alone', "V.select('27');"], ['section', "document.querySelector('.iw-section').click();"], ['teardown 9', "V.setMode('teardown', 9);"], ['teardown 29', "V.setMode('teardown', 29);"], ['rebuild 1', "V.setMode('rebuild', 1);"], ['rebuild 29', "V.setMode('rebuild', 29);"]];
  const out = [];
  let max = 0;
  for (const [n, js] of states) {
    await page.evaluate(`(() => { const V = window.VENTURI; V.setMode(null); V.deselect(); V.st.target = 0; ${js} })()`);
    await page.waitForTimeout(2500);
    const t = await tri();
    max = Math.max(max, t);
    out.push(`${n} ${(t / 1000).toFixed(0)}k`);
  }
  M.push(`triangles drawn (one scene pass, visible meshes): max ${(max / 1000).toFixed(0)}k · ${out.join(' · ')}`);
  const fl = await page.evaluate(() => ({hint: document.querySelector('.iw-hint').textContent, cut: Object.keys(window.VENTURI.S.cut).join('+') || 'none', tier: window.VENTURI.S.tier, first: window.__STATS.firstMs}));
  M.push(`quality flags after the states above (default tier ${fl.tier}): cuts ${fl.cut} · line "${fl.hint}"`);
  await page.close();
  const firsts = [];
  for (let i = 0; i < 3; i++) { const p = await open(1418, 930, ''); firsts.push(await p.evaluate(() => window.__STATS.firstMs)); await p.close(); }
  firsts.sort((a, b) => a - b);
  M.push(`first frame at 1418x930: median ${firsts[1]} ms of 3 (${firsts.join(', ')})`);
}
await browser.close();
const tr = run(['scripts/tray.mjs'], {SIZES: '1418x930,1366x768'}).split('\n').filter((l) => /settled/.test(l)).map((l) => '  ' + l.replace(/,"lo".*?\}/, '}'));
M.push('tray (settled worst = px to the mode buttons; outline frames with parts not landed):', ...tr);
const ft = run(['scripts/foot.mjs']).trim().split('\n');
M.push('footer:', ...ft.map((l) => '  ' + l));
M.push(`console errors while rendering: ${errs.length ? errs.slice(0, 5).join(' | ') : 0}`);
fs.writeFileSync('scratch/metrics.txt', M.join('\n') + '\n');
console.log(M.join('\n'));
