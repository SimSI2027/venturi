// node scripts/shot.mjs <query> [out.png]  — loads docs/index.html headless, reports console errors,
// and (only when out.png is given) saves an 800 px wide screenshot.
import {createRequire} from 'node:module';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const req = createRequire(path.join(skill, 'x.js'));
const {chromium} = req('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const [query = '', out] = process.argv.slice(2);
const browser = await chromium.launch({args: CHROMIUM_ARGS});
// optional phone run: SHOT_VW / SHOT_VH viewport, SHOT_TAP=<assembly index> taps that assembly's centre
const VW = Number(process.env.SHOT_VW || 800), VH = Number(process.env.SHOT_VH || 500), TAP = process.env.SHOT_TAP;
const phone = VW < 720;
const page = await browser.newPage({viewport: {width: VW, height: VH}, deviceScaleFactor: 1, hasTouch: phone, isMobile: phone});
const errs = [];
page.on('console', (m) => m.type() === 'error' || m.type() === 'warning' ? errs.push(`${m.type()}: ${m.text()}`) : 0);
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto(pathToFileURL(path.resolve('docs/index.html')).href + (query ? '?' + query : ''));
await page.waitForFunction(() => window.__READY, null, {timeout: 60000}).catch(() => errs.push('never ready'));
await page.waitForTimeout(1500);
if (TAP != null) {
  const p = await page.evaluate((i) => {
    const {asms, camera} = window.VENTURI;
    const g = asms[i].group;
    const o = g.children.find((c) => c.isMesh || c.children.length) || g;
    const v = o.getWorldPosition(o.position.clone()).project(camera);
    return {x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight};
  }, Number(TAP));
  await page.touchscreen.tap(p.x, p.y);
  await page.waitForTimeout(700);
  console.log('tap', JSON.stringify(p), 'card', await page.evaluate(() => document.querySelector('.iw-card').className + ' ' + document.querySelector('.iw-card .nm').textContent));
}
// SHOT_HOVER=<assembly index> moves the mouse onto the centre of that assembly's first part
if (process.env.SHOT_HOVER != null) {
  const p = await page.evaluate((i) => {
    const {asms, camera} = window.VENTURI;
    let m = null;
    asms[i].parts[0].obj.traverse((o) => o.isMesh && !m && (m = o));
    m.geometry.computeBoundingSphere();
    const v = m.localToWorld(m.geometry.boundingSphere.center.clone()).project(camera);
    return {x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight};
  }, Number(process.env.SHOT_HOVER));
  await page.mouse.move(p.x, p.y);
  await page.waitForTimeout(700);
  console.log('hover', JSON.stringify(p), 'card', await page.evaluate(() => document.querySelector('.iw-card').className + ' ' + document.querySelector('.iw-card .nm').textContent));
}
// SHOT_EVAL=<js> runs in the page after load (async ok); its result is printed, then 900 ms settle
if (process.env.SHOT_EVAL) {
  console.log('eval', JSON.stringify(await page.evaluate(`(async () => { ${process.env.SHOT_EVAL} })()`)));
  await page.waitForTimeout(900);
}
const stats = await page.evaluate(() => ({...window.__STATS, probe: window.__PROBE}));
console.log('stats', JSON.stringify(stats));
console.log('errors', errs.length ? errs.slice(0, 12).join('\n') : 'none');
if (out) await page.screenshot({path: out});
await browser.close();
