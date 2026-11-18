// tray clearance per guided step: px from the lowest tray pixel (parts in the tray, projected hull boxes, and the outline boxes) to the top
// of the dock (mode buttons) and to the footer text; and frames where a brass outline shows with its parts not landed
import path from 'node:path'; import os from 'node:os'; import {createRequire} from 'node:module'; import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const sizes = (process.env.SIZES || '1418x930,1366x768').split(',').map((s) => s.split('x').map(Number));
const modes = (process.env.MODES || 'teardown,rebuild').split(',');
const browser = await chromium.launch({args: CHROMIUM_ARGS});
for (const [W, H] of sizes) {
  const page = await browser.newPage({viewport: {width: W, height: H}});
  await page.goto(pathToFileURL(path.resolve('docs/index.html')).href + '?q=low');
  await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
  await page.evaluate(() => {
    window.__EMPTY = 0;
    const loop = () => { const V = window.VENTURI; if (V.guide.mode) for (const e of document.querySelectorAll('.vt-tg.show.on')) window.__EMPTY += 0; requestAnimationFrame(loop); };
    loop();
  });
  for (const m of modes) {
    let worst = {d: Infinity}, rows = [], emptyT = 0, moveW = {d: Infinity};
    for (let n = 1; n <= 29; n++) {
      await page.evaluate(([m, n]) => window.VENTURI.setMode(m, n), [m, n]);
      const mv = await page.evaluate(() => new Promise((res) => { let empty = 0, frames = 0, minD = Infinity; const V = window.VENTURI, T = V.THREE, v = new T.Vector3(), bx = new T.Box3(), t0 = performance.now();
        const dockT = () => Math.min(document.querySelector('.iw-dock').getBoundingClientRect().top, document.querySelector('.vt-foot').getBoundingClientRect().top);
        const loop = () => { frames++;
          for (const b of V.trayLay.v?.boxes || []) { const e = [...document.querySelectorAll('.vt-tg')][V.trayGroups.findIndex((g) => g.n === b.n)]; if (!e || !e.classList.contains('show')) continue; const g = V.trayGroups.find((g) => g.n === b.n); if (g.ps.some((p) => V.trayT(p) < 0.98)) { empty++; break; } }
          let lo = -Infinity, who = ''; for (const p of V.parts) { if (!p.tray || V.trayT(p) < 0.98 || !p.obj.visible) continue; bx.setFromObject(p.obj); for (let i = 0; i < 8; i++) { v.set(i & 1 ? bx.max.x : bx.min.x, i & 2 ? bx.max.y : bx.min.y, i & 4 ? bx.max.z : bx.min.z).project(V.camera); if (v.z < 1 && (-v.y * 0.5 + 0.5) * innerHeight > lo) (lo = (-v.y * 0.5 + 0.5) * innerHeight), (who = 'part ' + p.id + ' t=' + V.trayT(p).toFixed(2)); } }
          for (const e of document.querySelectorAll('.vt-tg.show')) if (e.getBoundingClientRect().bottom > lo) (lo = e.getBoundingClientRect().bottom), (who = 'box ' + e.textContent + ' h=' + Math.round(e.getBoundingClientRect().height) + ' tray ' + getComputedStyle(e.parentNode).opacity);
          if (dockT() - lo < minD) (minD = dockT() - lo), (window.__WHO = who + ' at ' + Math.round(performance.now() - t0) + ' ms');
          if (performance.now() - t0 < 1800) requestAnimationFrame(loop); else res({empty, frames, minD: Math.round(minD), who: window.__WHO}); }; loop(); }));
      emptyT += mv.empty; if (mv.minD < moveW.d) moveW = {d: mv.minD, n, who: mv.who};
      await page.waitForFunction(() => window.VENTURI.settled(), null, {timeout: 8000}).catch(() => 0);
      await page.waitForTimeout(150);
      const r = await page.evaluate(() => {
        const V = window.VENTURI, T = V.THREE, cam = V.camera;
        let lo = -Infinity; const v = new T.Vector3(), b = new T.Box3();
        for (const p of V.parts) {
          if (!p.tray || V.trayT(p) < 0.5 || !p.obj.visible) continue;
          b.setFromObject(p.obj);
          for (let i = 0; i < 8; i++) { v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(cam); lo = Math.max(lo, (-v.y * 0.5 + 0.5) * innerHeight); }
        }
        for (const e of document.querySelectorAll('.vt-tg.show')) lo = Math.max(lo, e.getBoundingClientRect().bottom);
        const dock = document.querySelector('.iw-dock').getBoundingClientRect().top, foot = document.querySelector('.vt-foot').getBoundingClientRect().top;
        return {lo: Math.round(lo), dock: Math.round(dock - lo), foot: Math.round(foot - lo), rows: V.trayLay.v?.rows, f: +(V.trayLay.v?.f || 0).toFixed(2)};
      });
      rows.push(`${n}:${r.dock}/${r.foot}`);
      const d = Math.min(r.dock, r.foot);
      if (d < worst.d) worst = {d, n, ...r};
    }
    console.log(`${W}x${H} ${m} settled worst ${JSON.stringify(worst)} | moving worst ${JSON.stringify(moveW)} | outline frames with parts not landed ${emptyT}\n  step:px to dock/footer ${rows.join(' ')}`);
  }
  await page.close();
}
await browser.close();
