// node scripts/bright.mjs [query] [WxH=1902x935] [out_prefix]  (run 32, item 3)
// Each of the body and the float chamber clicked alone (V.select), HIGH tier, no flags unless a query is given. Screenshot A is measured;
// screenshot B only makes the masks (cast materials flat magenta, machined and bore flat green). Over the cast pixels: mean value and
// Rec. 709 luma (0-100%), the share with any channel at 250 or more (blown out); over the machined pixels: the same means, and the
// machined / cast ratio of the value means.
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const [query = '', size = '1902x935', prefix = 'scratch/_bright'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const url = pathToFileURL(path.resolve('docs/index.html')).href + '?q=high' + (query ? '&' + query : '');
const browser = await chromium.launch({args: CHROMIUM_ARGS});
for (const id of ['1', '1-bowl']) {
  const page = await browser.newPage({viewport: {width: W, height: H}});
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.__READY, null, {timeout: 90000});
  await page.waitForTimeout(2500);
  const ok = await page.evaluate((id) => { window.VENTURI.select(id); return !!window.VENTURI.solo.part; }, id);
  await page.waitForTimeout(3000);
  if (process.env.PRE) { await page.evaluate(process.env.PRE); await page.waitForTimeout(1500); } // optional: change the page before the measured frame
  const f = `${prefix}_${id}`;
  await page.screenshot({path: f + '_a.png'});
  await page.evaluate(() => {
    const V = window.VENTURI, seen = new Set();
    V.controls.dispatchEvent({type: 'start'});
    const mine = new Set();
    V.solo.part.obj.traverse((o) => o.isMesh && mine.add(o.material));
    V.parts.forEach((p) => p.obj.traverse((o) => {
      const m = o.isMesh && o.material;
      if (!m || !m.color || seen.has(m)) return;
      seen.add(m);
      const fin = mine.has(m) && m.userData.finish, cast = fin === 'cast', mach = fin === 'machined';
      // only the clicked part's own cast and machined faces are painted; everything else (dimmed parts, its brass and steel) goes black
      m.color.setRGB(0, 0, 0); m.emissive.setRGB(cast ? 1 : 0, mach ? 1 : 0, cast ? 1 : 0); m.emissiveIntensity = 3; m.envMapIntensity = 0; m.roughness = 1; m.metalness = 0; m.specularIntensity = 0; // uniforms only: no recompile (a recompile dropped the front faces)
    }));
    V.S.render();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({path: f + '_b.png'});
  await page.close();
  const out = execFileSync('python', ['-I', '-c', `
import numpy as np
from PIL import Image
a = np.asarray(Image.open('${f}_a.png').convert('RGB')).astype(float)
b = np.asarray(Image.open('${f}_b.png').convert('RGB')).astype(float)
mc = (b[:, :, 0] - b[:, :, 1] > 60) & (b[:, :, 2] - b[:, :, 1] > 60)
mm = (b[:, :, 1] - b[:, :, 0] > 50) & (b[:, :, 1] - b[:, :, 2] > 50)
def st(m):
    if m.sum() == 0: return None
    c = a[m] / 255.0
    return c.max(1).mean() * 100, (c @ np.array([0.2126, 0.7152, 0.0722])).mean() * 100, (a[m].max(1) >= 250).mean() * 100, int(m.sum())
c, m = st(mc), st(mm)
print('cast: value %.1f%% luma %.1f%% blown %.2f%% n=%d' % c, '|', ('machined: value %.1f%% luma %.1f%% blown %.2f%% n=%d' % m + ' ratio %.3f' % (m[0] / c[0])) if m else 'machined none')
`]).toString();
  console.log(id, 'solo', ok, size, query || 'no flags', '|', out.trim(), '| errors', errs.length, errs.slice(0, 2).join(' / '));
}
await browser.close();
