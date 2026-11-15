// node scripts/perf.mjs [W] [H] [query] — loads docs/index.html?perf=1 headless and prints window.__PERF
// RENDER_MS=<n>: every drawn frame also burns n ms of CPU inside S.render (a stand-in for a slow GPU);
// the adaptive steps taken are printed from the header line.
// for three states: idle (default view), exploded (explode 1), selected (part 47 out in front).
import {createRequire} from 'node:module';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const [W = 1920, H = 1080, extra = ''] = process.argv.slice(2);
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const page = await browser.newPage({viewport: {width: +W, height: +H}, deviceScaleFactor: 1});
// THROTTLE=<n>: Chrome CPU throttling n x (CDP); GPU_LOAD=<k>: device scale factor k, which the tier
// caps at DPR 1.25 on MEDIUM, so a 4x GPU load is set by the viewport instead (e.g. 3840 2160 on a 1080p panel)
const errs = [];
if (process.env.THROTTLE) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', {rate: +process.env.THROTTLE});
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await page.goto(pathToFileURL(path.resolve('docs/index.html')).href + '?perf=1' + (/(^|&)q=/.test(extra) ? '' : '&q=high') + (extra ? '&' + extra : ''));
await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
if (process.env.RENDER_MS) await page.evaluate((ms) => { const S = window.VENTURI.S, f = S.render; S.render = () => { f(); const t = performance.now(); while (performance.now() - t < ms); }; }, +process.env.RENDER_MS);
const read = () => page.evaluate(() => JSON.parse(JSON.stringify({...window.__PERF, reset: 0})));
const wait = (ms) => page.waitForTimeout(ms);
const reset = () => page.evaluate(() => window.__PERF.reset());
await wait(1500 + +(process.env.SETTLE || 0));
const still = await read(); // drawn in the second before the last overlay update, with no input
await wait(4000); // the idle auto-turn starts 5 s after the last input
await reset();
await wait(2500);
const idle = await read();
await page.evaluate(() => ((window.VENTURI.st.target = 1), (document.querySelector('.iw-range').value = 1))); // exploded
await wait(1500);
await reset();
await wait(2500);
const xray = await read();
await page.evaluate(() => window.VENTURI.select('47')); // a selected part out in front
await wait(500);
await reset();
await wait(2500);
const cycle = await read();
const r = (o) => Object.fromEntries(Object.entries(o.marks).map(([k, v]) => [k, Math.round(v)]));
console.log('settled (2-3.5 s, no input): last overlay update', still.drawnPerS, 'drawn/s');
console.log('renderer', idle.renderer, '| timer', idle.timer, '| buffer', idle.size, '| marks', JSON.stringify(r(idle)));
for (const [k, s] of Object.entries({idle, exploded: xray, selected: cycle})) console.log(k.padEnd(6), 'gpu', s.gpuMs, 'frame', s.frameMs, 'max', s.frameMax, 'drawn/s', s.drawnPerS, 'cut', s.cut, 'programs', s.programs, 'calls', s.calls, 'tris', s.tris, JSON.stringify(s.pass));
console.log('steps taken:', await page.evaluate(() => document.querySelector('.iw-hint').textContent.split(' · ').slice(4, -1).join(' · ') || 'none'));
console.log('errors', errs.length ? errs.join('\n') : 'none');
await browser.close();
