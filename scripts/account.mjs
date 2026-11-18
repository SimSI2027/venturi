// node scripts/account.mjs  (run 15, item 11): checks every clickable part of docs/index.html and writes scratch/account.txt, 1 line each:
// mesh (has triangles), card (clicking it shows a card with its group, fits-into and step), row (a parts-panel row), td / rb (the number of
// tear-down / rebuild steps it is in: exactly 1, the body 0), tray (a tray slot), seat (the gap in mm from its surface to the surface of the part
// it fits into, at rest, both sampled every 1.5 mm; at most 2), fits (names an existing part), home (run 25: THROTTLE 0% after 100% leaves it
// within 0.1 mm of home). Prints the failures and the count.
// Run 16 (correction 34): the body and the 4 throttle shaft parts (K12, K14, K15, K18; run 17: K16 rides in step 9) stay in the body: 0 tear-down steps, 0 rebuild steps, 0 tray slots, card
// 'Stays in the body: not in the manual's removal list'; every other part no step of the manual's list names keeps its step and its card says 'not named in the manual's list'.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const page = await browser.newPage({viewport: {width: 1400, height: 850}});
const errs = [];
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(pathToFileURL(path.resolve('docs/index.html')).href + '?q=low');
await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
await page.waitForTimeout(800);
const ids = await page.evaluate(() => window.VENTURI.parts.map((p) => p.id));
const key = (id) => { const k = id[0] === 'K' ? 1000 + parseInt(id.slice(1)) : parseInt(id); return k + (id.includes('-') ? 0.5 : 0); };
ids.sort((a, b) => key(a) - key(b));
// the fits-into ids from data.js (copied, as scratch/seats.mjs does)
fs.copyFileSync('src/carb/data.js', 'scratch/_d.mjs');
const D = await import(pathToFileURL(path.resolve('scratch/_d.mjs')).href);
const fits = Object.fromEntries(ids.map((id) => [id, D.info(id).fits]));
const STAYS = ['K12', 'K14', 'K15', 'K18'];
// 1. the gaps at rest (nothing selected, explode 0), before any click moves a part
const gaps = await page.evaluate(({ids, fits}) => {
  const V = window.VENTURI, T = V.THREE, by = Object.fromEntries(V.parts.map((p) => [p.id, p]));
  const STEP = 1.5, cache = {};
  const sample = (p) => {
    const out = [], a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
    p.obj.traverse((m) => {
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position, idx = m.geometry.index, n = idx ? idx.count : pos.count;
      const get = (k, v) => v.fromBufferAttribute(pos, idx ? idx.getX(k) : k).applyMatrix4(m.matrixWorld);
      for (let k = 0; k + 2 < n; k += 3) {
        get(k, a); get(k + 1, b); get(k + 2, c);
        const e = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)), s = Math.min(40, Math.max(1, Math.ceil(e / STEP)));
        for (let i = 0; i <= s; i++) for (let j = 0; j <= s - i; j++) { const u = i / s, v = j / s, w = 1 - u - v; out.push(a.x * w + b.x * u + c.x * v, a.y * w + b.y * u + c.y * v, a.z * w + b.z * u + c.z * v); }
      }
    });
    return new Float32Array(out);
  };
  const grid = (pts) => { const g = new Map(); for (let i = 0; i < pts.length; i += 3) { const k = Math.floor(pts[i] / 2) + ',' + Math.floor(pts[i + 1] / 2) + ',' + Math.floor(pts[i + 2] / 2); let l = g.get(k); if (!l) g.set(k, (l = [])); l.push(i); } return g; };
  const gap = (A, B, gB) => {
    let m = 1e9;
    for (let i = 0; i < A.length; i += 3) {
      const x = A[i], y = A[i + 1], z = A[i + 2], cx = Math.floor(x / 2), cy = Math.floor(y / 2), cz = Math.floor(z / 2);
      for (let r = 0; r <= 14 && (r - 1) * 2 < m; r++) {
        for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== r) continue;
          const l = gB.get((cx + dx) + ',' + (cy + dy) + ',' + (cz + dz));
          if (l) for (const j of l) { const d = Math.hypot(x - B[j], y - B[j + 1], z - B[j + 2]); if (d < m) m = d; }
        }
      }
      if (m < 0.2) break;
    }
    return m;
  };
  V.asms.forEach((a) => a.group.updateMatrixWorld(true));
  const out = {};
  for (const id of ids) {
    const f = fits[id];
    if (!f || !by[f]) { out[id] = null; continue; }
    const A = sample(by[id]);
    const t = (cache[f] ||= (() => { const P = sample(by[f]); return [P, grid(P)]; })());
    out[id] = +gap(A, t[0], t[1]).toFixed(2);
  }
  return out;
}, {ids, fits});
// 1b. run 25 (item 8): THROTTLE to 100% and back to 0%: every part's box (8 corners, so a turn shows too) back within 0.1 mm of home
const boxes = () => page.evaluate(() => Object.fromEntries(window.VENTURI.parts.map((p) => { const b = new window.VENTURI.THREE.Box3().setFromObject(p.obj); return [p.id, [...b.min.toArray(), ...b.max.toArray()]]; })));
const setThrottle = async (t) => {
  await page.evaluate((t) => { const r = document.querySelector('.vt-th'); r.value = String(t); r.dispatchEvent(new Event('input')); }, t);
  await page.waitForFunction(() => window.VENTURI.settled(), null, {timeout: 20000});
  await page.waitForTimeout(100);
};
const home0 = await boxes();
await setThrottle(1);
const open1 = await boxes();
await setThrottle(0);
const back0 = await boxes();
const thMoved = ids.filter((id) => open1[id].some((v, i) => Math.abs(v - home0[id][i]) > 0.1));
const thHome = Object.fromEntries(ids.map((id) => [id, Math.max(...back0[id].map((v, i) => Math.abs(v - home0[id][i])))]));
// 2. the cards, by clicking each part
const cards = {};
for (const id of ids) {
  await page.evaluate((id) => window.VENTURI.select(id), id);
  await page.waitForTimeout(120);
  cards[id] = await page.evaluate(() => { const d = document.querySelector('.vt-detail'); return {show: d.classList.contains('show'), t: d.innerText.replace(/\s+/g, ' ')}; });
  await page.evaluate(() => window.VENTURI.deselect());
  await page.waitForTimeout(40);
}
// 3. meshes, panel rows, steps, tray slots
const rest = await page.evaluate((ids) => {
  const V = window.VENTURI, by = Object.fromEntries(V.parts.map((p) => [p.id, p])), out = {};
  for (const id of ids) {
    const p = by[id];
    let tris = 0, meshes = 0;
    p.obj.traverse((o) => { if (o.isMesh) { meshes++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; } });
    const count = (mode) => V.MODES[mode].steps.filter((s) => s.parts.includes(id) || s.moves.includes(id)).length;
    out[id] = {meshes, tris: Math.round(tris), row: !!document.querySelector(`.vt-row[data-id="${id.startsWith('1-') ? '1' : id}"]`), td: count('teardown'), rb: count('rebuild'), tray: !!p.tray};
  }
  return out;
}, ids);
const lines = [], fails = [];
for (const id of ids) {
  const r = rest[id], c = cards[id], f = fits[id], isBody = id === '1', stays = isBody || STAYS.includes(id), unnamed = !stays && !D.inManual(id);
  const checks = {
    mesh: r.meshes > 0 && r.tris > 0,
    card: c.show && /Fits into/.test(c.t) && /Step/.test(c.t) && /Group/.test(c.t) && (isBody || (STAYS.includes(id) ? /Stays in the body: not in the manual’s removal list/.test(c.t) : unnamed ? /not named in the manual’s list/.test(c.t) : !/not named in the manual/.test(c.t))),
    row: r.row,
    td: stays ? r.td === 0 : r.td === 1,
    rb: stays ? r.rb === 0 : r.rb === 1,
    tray: stays ? !r.tray : r.tray,
    seat: isBody ? true : gaps[id] !== null && gaps[id] <= 2,
    fits: isBody ? !f : !!f && ids.includes(f),
    home: thHome[id] <= 0.1, // run 25 (item 8): THROTTLE 0% after 100%
  };
  const bad = Object.keys(checks).filter((k) => !checks[k]);
  if (bad.length) fails.push(id);
  lines.push(`${id.padEnd(9)} mesh ${r.meshes}/${r.tris}t  card ${checks.card ? 'y' : 'N'}  row ${checks.row ? 'y' : 'N'}  td ${r.td}  rb ${r.rb}  tray ${checks.tray ? 'y' : 'N'}  seat ${isBody ? '-' : gaps[id] === null ? 'none' : gaps[id] + 'mm'}  fits ${isBody ? '-' : f}  home ${thHome[id].toFixed(3)}mm${bad.length ? '   FAIL: ' + bad.join(',') : ''}`);
}
lines.push(`# THROTTLE 100%: ${thMoved.length} parts moved (${thMoved.join(' ')}); back at 0%: worst ${Math.max(...Object.values(thHome)).toFixed(4)} mm from home`);
lines.push(`# ${ids.length} parts checked, ${fails.length} failures${fails.length ? ': ' + fails.join(' ') : ''}; console errors: ${errs.length ? errs.slice(0, 3).join(' | ') : 'none'}`);
fs.writeFileSync('scratch/account.txt', lines.join('\n') + '\n');
console.log(lines.filter((l) => /FAIL|^#/.test(l)).join('\n'));
await browser.close();
