// node scripts/step29.mjs (run 26, item 7): every mesh drawn at TEAR DOWN step 29 that is not the body (part 1), not one of step 29's
// parts and not in the bench tray. Expected: 0, except parts the manual's list never removes (correction 34), which are named as such.
import path from 'node:path'; import os from 'node:os'; import {createRequire} from 'node:module'; import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const page = await browser.newPage({viewport: {width: 1418, height: 930}});
await page.goto(pathToFileURL(path.resolve('docs/index.html')).href + '?q=low&mode=teardown&step=29');
await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
await page.waitForFunction(() => window.VENTURI.settled(), null, {timeout: 10000}).catch(() => 0);
await page.waitForTimeout(500);
const r = await page.evaluate(() => {
  const V = window.VENTURI, step = V.guide.step(), mine = new Set([...step.parts, ...(step.moves || [])]);
  const drawn = (o) => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  const out = [];
  for (const p of V.parts) {
    if (p.id === '1' || mine.has(p.id) || (p.tray && V.trayT(p) > 0.5)) continue;
    let n = 0, mats = new Set();
    p.obj.traverse((m) => { if (m.isMesh && drawn(m) && [m.material].flat().some((x) => x.opacity > 0.02 && x.visible !== false)) n++, [m.material].flat().forEach((x) => mats.add('#' + x.color.getHexString() + ' m' + x.metalness)); });
    if (n) out.push({id: p.id, meshes: n, mats: [...mats].join(','), stays: !p.tray});
  }
  return {step: step.parts, out};
});
console.log('step 29 parts:', r.step.join(' '));
console.log(r.out.length + ' other parts drawn' + (r.out.length ? ':\n' + r.out.map((o) => `  ${o.id} (${o.meshes} meshes, ${o.mats})${o.stays ? ' no tray slot: stays in the body' : ''}`).join('\n') : ''));
await browser.close();
