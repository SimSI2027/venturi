// footer readability: in each state, a grid of points over the footer's text; with pointer-events forced on everywhere, the topmost
// element at each point must be the footer itself. Also the text must sit inside the viewport on 1 line set.
import path from 'node:path'; import os from 'node:os'; import {createRequire} from 'node:module'; import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const sizes = (process.env.SIZES || '1418x930,1366x768,390x844').split(',').map((s) => s.split('x').map(Number));
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const STATES = [
  ['explore', ''], ['explode 1', 'V.st.target = 1;'], ['throttle 100', "const r = document.querySelectorAll('.iw-range')[1]; r.value = 1; r.dispatchEvent(new Event('input'));"],
  ['circuit', "document.querySelector('.vt-circ .iw-btn').click();"], ['part 27', "V.select('27');"], ['parts panel', "document.querySelector('.vt-pbtn').click();"],
  ['specs tab', "document.querySelector('.vt-pbtn').click(); document.querySelector('.vt-tabs [data-k=specs]').click();"], ['help', "document.querySelector('.iw-help').click();"],
  ['section', "document.querySelector('.iw-section').click();"],
  ...[1, 9, 20, 29].map((n) => [`teardown ${n}`, `V.setMode('teardown', ${n});`]), ...[1, 15, 29].map((n) => [`rebuild ${n}`, `V.setMode('rebuild', ${n});`]),
  ['teardown 9 part', "V.setMode('teardown', 9); await new Promise((r) => setTimeout(r, 1500)); V.select('9');"],
];
let total = 0;
for (const [W, H] of sizes) {
  const phone = W < 720;
  const ctx = await browser.newContext({viewport: {width: W, height: H}, hasTouch: phone, isMobile: phone});
  const out = [];
  for (const [name, js] of STATES) {
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(path.resolve('docs/index.html')).href + '?q=low');
    await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
    await page.evaluate(`(async () => { const V = window.VENTURI; ${js} })()`);
    await page.waitForTimeout(2200);
    const r = await page.evaluate(() => {
      const f = document.querySelector('.vt-foot'), st = document.createElement('style');
      st.textContent = '* { pointer-events: auto !important; }';
      document.head.appendChild(st);
      const rg = document.createRange(); rg.selectNodeContents(f);
      const rs = [...rg.getClientRects()].filter((q) => q.width > 2);
      const alpha = (c) => { const m = c.match(/rgba?(([^)]+))/); if (!m) return 0; const v = m[1].split(/[ ,/]+/).filter(Boolean); return v.length > 3 ? +v[3] : 1; };
      const shown = (e) => { for (let q = e; q && q.nodeType === 1; q = q.parentElement) { const cs = getComputedStyle(q); if (+cs.opacity < 0.02 || cs.visibility === 'hidden' || cs.display === 'none') return false; } return true; };
      const paints = (e, x, y) => {
        if (!shown(e)) return false;
        if (e instanceof SVGElement && e.tagName.toLowerCase() !== 'svg') return true;
        const cs = getComputedStyle(e);
        if (alpha(cs.backgroundColor) > 0.02 || cs.backgroundImage !== 'none' || (cs.backdropFilter && cs.backdropFilter !== 'none')) return true;
        const r = e.getBoundingClientRect(), bw = parseFloat(cs.borderTopWidth) || 0;
        if (bw > 0 && alpha(cs.borderTopColor) > 0.02 && (x - r.left < bw + 1 || r.right - x < bw + 1 || y - r.top < bw + 1 || r.bottom - y < bw + 1)) return true;
        for (const t of e.childNodes) if (t.nodeType === 3 && t.textContent.trim()) { const g = document.createRange(); g.selectNodeContents(t); for (const q of g.getClientRects()) if (x >= q.left && x <= q.right && y >= q.top && y <= q.bottom) return true; }
        return false;
      };
      let n = 0, bad = 0, by = new Map(), off = 0;
      for (const q of rs) for (let i = 0; i <= 40; i++) for (const fy of [0.25, 0.5, 0.75]) {
        const x = q.left + (q.width * i) / 40, y = q.top + q.height * fy; n++;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) { off++; continue; }
        const X = Math.min(innerWidth - 1, x);
        for (const e of document.elementsFromPoint(X, y)) {
          if (e === f || f.contains(e)) break;
          if (!paints(e, X, y)) continue;
          bad++; const k = (e.className?.baseVal ?? e.className) || e.tagName; by.set(k, (by.get(k) || 0) + 1); break;
        }
      }
      st.remove();
      return {n, bad, off, lines: rs.length, by: [...by].map(([k, v]) => `${k}:${v}`).join(' ')};
    });
    if (r.bad || r.off) out.push(`${name}: ${r.bad + r.off}/${r.n} covered or off (${r.by}${r.off ? ' off:' + r.off : ''})`);
    total += r.bad + r.off;
    await page.close();
  }
  console.log(`${W}x${H}: ${out.length ? out.join(' | ') : 'all ' + STATES.length + ' states clear'}`);
  await ctx.close();
}
console.log('covered points', total);
await browser.close();
