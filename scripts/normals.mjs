// node scripts/normals.mjs (run 26, item 3): stripe and band metric on the 4 castings; prints per casting the smooth edges whose 2 corner normals step > 2% and the dominant flat-face corners bent > 2%.
// stripes / bands metric on the 4 castings: smooth edges (dihedral < 35 deg) whose 2 faces' corner normals differ by > 2%,
// and flat-region corners (coplanar regions >= 20 mm^2) whose normal bends > 2% off the face normal
import path from 'node:path'; import os from 'node:os'; import {createRequire} from 'node:module'; import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const page = await browser.newPage({viewport: {width: 800, height: 500}});
await page.goto(pathToFileURL(path.resolve('docs/index.html')).href + '?q=low&still');
await page.waitForFunction(() => window.__READY, null, {timeout: 60000});
console.log(await page.evaluate(() => {
  const V = window.VENTURI, out = [], process_dbg = true, ex = [];
  for (const id of ['1', '1-bowl', '1-top', '65']) {
    let edges = 0, bad = 0, worst = 0, fc = 0, fbad = 0, fworst = 0;
    V.parts.find((p) => p.id === id).obj.traverse((m) => {
      if (!m.isMesh) return;
      const g = m.geometry, P = g.attributes.position, N = g.attributes.normal, I = g.index;
      const nt = (I ? I.count : P.count) / 3, ix = (t, k) => (I ? I.getX(t * 3 + k) : t * 3 + k);
      const key = (i) => `${P.getX(i).toFixed(4)},${P.getY(i).toFixed(4)},${P.getZ(i).toFixed(4)}`;
      const vk = new Map(), vid = (i) => { const k = key(i); let v = vk.get(k); if (v === undefined) vk.set(k, (v = vk.size)); return v; };
      const fn = [], fa = [], E = new Map();
      for (let t = 0; t < nt; t++) {
        const a = [0, 1, 2].map((k) => [P.getX(ix(t, k)), P.getY(ix(t, k)), P.getZ(ix(t, k))]);
        const u = a[1].map((v, j) => v - a[0][j]), w = a[2].map((v, j) => v - a[0][j]);
        const c = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(...c) || 1;
        fn.push(c.map((v) => v / l)); fa.push(l / 2);
        const vv = [0, 1, 2].map((k) => vid(ix(t, k)));
        for (let e = 0; e < 3; e++) { const p = vv[e], q = vv[(e + 1) % 3], id = p < q ? p + ',' + q : q + ',' + p; (E.get(id) || E.set(id, []).get(id)).push([t, e]); }
      }
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
      const nrm = (i) => [N.getX(i), N.getY(i), N.getZ(i)];
      const up = fn.map((_, i) => i), find = (a) => { while (up[a] !== a) a = up[a] = up[up[a]]; return a; };
      const C35 = Math.cos(35 * Math.PI / 180), C05 = Math.cos(0.5 * Math.PI / 180);
      for (const l of E.values()) {
        if (l.length !== 2) continue;
        const [[t1, e1], [t2, e2]] = l, d = dot(fn[t1], fn[t2]);
        
        if (d < C35) continue;
        edges++;
        // the corner of t1 and of t2 at each end of the shared edge
        for (const [k1] of [[e1], [(e1 + 1) % 3]]) {
          const v = vid(ix(t1, k1)); let k2 = [0, 1, 2].find((k) => vid(ix(t2, k)) === v);
          const a = nrm(ix(t1, k1)), b = nrm(ix(t2, k2)), s = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
          worst = Math.max(worst, s); if (s > 0.02) { bad++; break; }
        }
      }
      const at = new Map(); for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) { const v = vid(ix(t, k)); (at.get(v) || at.set(v, []).get(v)).push(t); }
      const grown = new Uint8Array(nt), C005 = Math.cos(0.05 * Math.PI / 180);
      for (const fs of at.values()) for (let i = 0; i < fs.length; i++) for (let j = 0; j < i; j++) { const s = fs[i], t = fs[j], rs = find(s), rt = find(t); if (fa[s] <= 0 || fa[t] <= 0 || rs === rt) continue; if (rs === s && !grown[s] ? dot(fn[s], fn[rt]) > C05 : dot(fn[rs], fn[rt]) > C005) (up[rs] = rt), (grown[rt] = 1); }
      const ra = new Map(); fn.forEach((_, t) => ra.set(find(t), (ra.get(find(t)) || 0) + fa[t]));
      for (let t = 0; t < nt; t++) {
        if (ra.get(find(t)) < 20) continue;
        for (let k = 0; k < 3; k++) {
          const fs = at.get(vid(ix(t, k))), r = find(t), rs = [...new Set(fs.map(find))];
          if (ra.get(r) < 4 * rs.reduce((s, o) => s + (o !== r && dot(fn[o], fn[r]) > C35 ? ra.get(o) : 0), 0)) continue; // not the dominant flat face here
          const n = nrm(ix(t, k)), s = Math.hypot(n[0] - fn[t][0], n[1] - fn[t][1], n[2] - fn[t][2]); fc++; fworst = Math.max(fworst, s); if (s > 0.02) { fbad++; if (process_dbg && ex.length < 4) ex.push({fn: fn[t].map((v) => +v.toFixed(3)), vn: n.map((v) => +v.toFixed(3)), ra: +ra.get(r).toFixed(1), rs: rs.map((o) => [+ra.get(o).toFixed(2), fn[o].map((v) => +v.toFixed(2))])}); } }
      }
    });
    out.push(`${id}: smooth edges ${edges}, stepped > 2% ${bad} (${(100 * bad / edges).toFixed(2)}%), worst ${(100 * worst).toFixed(1)}% | flat corners ${fc}, bent > 2% ${fbad} (${(100 * fbad / fc).toFixed(2)}%), worst ${(100 * fworst).toFixed(1)}%` + (ex.length ? ' || ' + JSON.stringify(ex.splice(0)) : ''));
  }
  return out.join('\n');
}));
await browser.close();
