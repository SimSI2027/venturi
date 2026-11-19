// node scripts/disc.mjs <round> [--fit-pose]  (run 30, item 7): the discriminators D1-D3 against the 6 hand-traced outlines in
// scratch/masks.json (mine_1, mine_3, mine_4, mine_6, rep_1, rep_3). Per view the model is drawn on HIGH from the photo's side (R, U and
// the pose offset rot in masks.json), hoses, wires and the parts absent from that photo hidden, and framed so its silhouette's box
// matches the traced outline's box (scale from the box area, centre on the centre). Writes scratch/disc.txt (appends the round) and
// scratch/disc/<view>_{render,sil,cast}.png. --fit-pose (round 0 only) searches yaw / pitch / roll within 12 deg for the best D1 and saves
// it into masks.json, so every later round draws the same pose.
//   D1 silhouette IoU of the model's outline and the traced one (0 to 1).
//   D2 the model's high-frequency luminance energy (luminance minus a 1.5 px gaussian, mean square, over the mean luminance squared) on
//      casting pixels (cast and machined finishes, inside both outlines, 2 px in from the edge, photo pixels with saturation > 0.3 left
//      out: hoses, brass, wood) over the photo's on the same pixels; target 0.8 to 1.2.
//   D3 the distance between the 2 casting luminance histograms on those pixels (32 bins, earth mover's, 0 to 1; lower is better).
//   scores: s1 = D1, s2 = 1 - |ln D2| / ln 2 (0 at D2 = 0.5 or 2), s3 = 1 - D3 / 0.25, each clipped to 0..1; total = their mean.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const skill = path.join(os.homedir(), '.claude/skills/cutaway');
const {chromium} = createRequire(path.join(skill, 'x.js'))('playwright');
const {CHROMIUM_ARGS} = await import(pathToFileURL(path.join(skill, 'paths.mjs')).href);
const R = process.argv[2] ?? '0', FIT = process.argv.includes('--fit-pose');
const URL = pathToFileURL(path.resolve('docs/index.html')).href;
const MASKS = JSON.parse(fs.readFileSync('scratch/masks.json', 'utf8'));
const VIEWS = ['mine_1', 'mine_3', 'mine_4', 'mine_6', 'rep_1', 'rep_3'];
fs.mkdirSync('scratch/disc', {recursive: true});
const browser = await chromium.launch({args: CHROMIUM_ARGS});
const errs = [];

// in the page: pose, framing, silhouette IoU against the traced outline, and the 2 masks
const pageCode = () => {
  const V = window.VENTURI, T = V.THREE, cam = V.camera, S = V.S, carb = V.asms[0].group.parent;
  const keep = new Set();
  for (let e = document.querySelector('canvas'); e; e = e.parentElement) keep.add(e);
  document.body.querySelectorAll('*').forEach((e) => !keep.has(e) && !e.closest('canvas') && (e.style.visibility = 'hidden'));
  V.controls.dispatchEvent({type: 'start'});
  V.controls.update = () => false;
  const D = (window.__disc = {});
  D.setup = (hide) => {
    const hoses = new Set(V.asms.find((a) => a.key === 'hoses').parts.map((p) => p.id));
    D.meshes = [];
    V.parts.forEach((p) => p.obj.traverse((m) => {
      if (!m.isMesh) return;
      const wire = m.material && m.material.color && m.material.color.getHex() === 0x1a1b1d && m.material.roughness === 0.5;
      m.visible = !hoses.has(p.id) && !hide.includes(p.id) && p.id !== 'K83' && !wire; // K83 the brass inlet elbow: the traces leave loose brass pipes out
      if (m.visible) D.meshes.push(m);
    }));
    S.scene.traverse((o) => (o.isMesh || o.isLine || o.isPoints) && !o.userData.partRoot && (o.visible = false));
    carb.updateMatrixWorld(true);
    const box = new T.Box3();
    D.meshes.forEach((m) => box.expandByObject(m));
    D.ctr = box.getCenter(new T.Vector3());
    D.rad = box.getSize(new T.Vector3()).length() / 2;
  };
  D.bbox = (w, h) => {
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    const v = new T.Vector3();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const m of D.meshes) {
      const a = m.geometry.attributes.position;
      m.updateMatrixWorld();
      for (let i = 0; i < a.count; i += 3) {
        v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld).project(cam);
        const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    return [x0, y0, x1, y1];
  };
  // R, U in the carburetor's frame; rot = [yaw about U, pitch about R, roll about the view axis] in degrees
  D.pose = (Rv, Uv, rot, tb, w, h) => {
    const Rw = new T.Vector3(...Rv).transformDirection(carb.matrixWorld), Uw = new T.Vector3(...Uv).transformDirection(carb.matrixWorld);
    const q = new T.Quaternion().setFromAxisAngle(Uw, (rot[0] * Math.PI) / 180)
      .multiply(new T.Quaternion().setFromAxisAngle(Rw, (rot[1] * Math.PI) / 180));
    Rw.applyQuaternion(q); Uw.applyQuaternion(q);
    const back = new T.Vector3().crossVectors(Rw, Uw).normalize();
    Uw.applyAxisAngle(back, (rot[2] * Math.PI) / 180);
    cam.up.copy(Uw);
    let dist = D.rad / Math.sin(((cam.fov / 2) * Math.PI) / 180);
    let t = D.ctr.clone();
    const tw = tb[2] - tb[0], th = tb[3] - tb[1], tcx = (tb[0] + tb[2]) / 2, tcy = (tb[1] + tb[3]) / 2;
    const right = new T.Vector3();
    for (let it = 0; it < 5; it++) {
      cam.position.copy(t).addScaledVector(back, dist);
      cam.lookAt(t);
      const m = D.bbox(w, h), s = Math.sqrt((tw * th) / ((m[2] - m[0]) * (m[3] - m[1])));
      dist /= s;
      cam.position.copy(t).addScaledVector(back, dist);
      cam.lookAt(t);
      const m2 = D.bbox(w, h), ppu = h / (2 * Math.tan((cam.fov * Math.PI) / 360) * dist);
      right.crossVectors(cam.getWorldDirection(new T.Vector3()), cam.up).normalize();
      const up = new T.Vector3().crossVectors(right, cam.getWorldDirection(new T.Vector3())).normalize();
      t.addScaledVector(right, ((m2[0] + m2[2]) / 2 - tcx) / ppu).addScaledVector(up, -((m2[1] + m2[3]) / 2 - tcy) / ppu);
    }
    cam.position.copy(t).addScaledVector(back, dist);
    cam.lookAt(t);
    cam.updateMatrixWorld();
    return D.bbox(w, h);
  };
  const white = new T.MeshBasicMaterial({color: 0xffffff, side: T.DoubleSide}), black = new T.MeshBasicMaterial({color: 0x000000, side: T.DoubleSide});
  // a mask drawn straight with the renderer (no composer): 1 byte a pixel, top row first
  D.mask = (w, h, which) => {
    const rt = new T.WebGLRenderTarget(w, h, {samples: 4}), saved = new Map(), bg = S.scene.background;
    for (const m of D.meshes) {
      saved.set(m, m.material);
      const f = m.material.userData && m.material.userData.finish;
      m.material = which === 'sil' || f === 'cast' || f === 'machined' ? white : black;
    }
    S.scene.background = new T.Color(0);
    const r = S.renderer, oldRT = r.getRenderTarget(), oldTM = r.toneMapping;
    r.setRenderTarget(rt);
    r.setClearColor(0x000000, 1);
    r.clear();
    r.render(S.scene, cam);
    const px = new Uint8Array(w * h * 4);
    r.readRenderTargetPixels(rt, 0, 0, w, h, px);
    r.setRenderTarget(oldRT);
    r.toneMapping = oldTM;
    S.scene.background = bg;
    for (const [m, mat] of saved) m.material = mat;
    rt.dispose();
    const out = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[y * w + x] = px[((h - 1 - y) * w + x) * 4] > 127 ? 1 : 0;
    return out;
  };
  // the traced outline rasterised on a 2D canvas
  D.poly = (pts, f, w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x * f, y * f) : g.moveTo(x * f, y * f)));
    g.closePath();
    g.fill();
    const d = g.getImageData(0, 0, w, h).data, out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) out[i] = d[i * 4] > 127 ? 1 : 0;
    return out;
  };
  D.iou = (a, b) => {
    let i = 0, u = 0;
    for (let k = 0; k < a.length; k++) { i += a[k] & b[k]; u += a[k] | b[k]; }
    return i / u;
  };
  D.b64 = (u8) => {
    let s = '';
    for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  };
};

const lines = [];
for (const k of VIEWS) {
  const v = MASKS[k], [W, H] = v.size, f = Math.min(800 / W, 640 / H), w = Math.round(W * f), h = Math.round(H * f);
  const page = await browser.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 1});
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${URL}?q=high`);
  await page.waitForFunction(() => window.__READY, null, {timeout: 90000});
  await page.waitForTimeout(1500);
  await page.evaluate(pageCode);
  const xs = v.poly.map((p) => p[0] * f), ys = v.poly.map((p) => p[1] * f);
  const tb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const res = await page.evaluate(({v, f, w, h, tb, FIT}) => {
    const D = window.__disc;
    D.setup(v.hide);
    const pm = D.poly(v.poly, f, w, h);
    const score = (rot) => (D.pose(v.R, v.U, rot, tb, w, h), D.iou(D.mask(w, h, 'sil'), pm));
    let rot = v.rot || [0, 0, 0];
    if (FIT) {
      let best = [score([0, 0, 0]), [0, 0, 0]];
      for (const st of [6, 3, 1.5]) {
        const c = best[1];
        for (const a of [-2, -1, 0, 1, 2]) for (const b of [-2, -1, 0, 1, 2]) for (const r of st === 6 ? [-1, 0, 1] : [0]) {
          const cand = [c[0] + a * st, c[1] + b * st, c[2] + r * 3];
          if (Math.abs(cand[0]) > 12 || Math.abs(cand[1]) > 12) continue;
          const s = score(cand);
          if (s > best[0]) best = [s, cand];
        }
      }
      rot = best[1];
    }
    D.pose(v.R, v.U, rot, tb, w, h);
    const sil = D.mask(w, h, 'sil'), cast = D.mask(w, h, 'cast');
    return {rot, iou: D.iou(sil, pm), sil: D.b64(sil), cast: D.b64(cast)};
  }, {v, f, w, h, tb, FIT});
  if (FIT) v.rot = res.rot;
  await page.waitForTimeout(900);
  await page.screenshot({path: `scratch/disc/${k}_render.png`});
  fs.writeFileSync(`scratch/disc/${k}_sil.bin`, Buffer.from(res.sil, 'base64'));
  fs.writeFileSync(`scratch/disc/${k}_cast.bin`, Buffer.from(res.cast, 'base64'));
  await page.close();
  // D2, D3 in python (numpy)
  const py = execFileSync('python', ['-I', '-c', `
import json, sys, numpy as np
from PIL import Image, ImageDraw
k, img, w, h, f = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
poly = json.loads(sys.argv[6])
def lum(a): a = a[..., :3].astype(np.float64) / 255; return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
ph = np.asarray(Image.open(img).convert('RGB').resize((w, h), Image.LANCZOS))
md = np.asarray(Image.open('scratch/disc/%s_render.png' % k).convert('RGB'))
sil = np.frombuffer(open('scratch/disc/%s_sil.bin' % k, 'rb').read(), np.uint8).reshape(h, w).astype(bool)
cast = np.frombuffer(open('scratch/disc/%s_cast.bin' % k, 'rb').read(), np.uint8).reshape(h, w).astype(bool)
pm = Image.new('L', (w, h), 0); ImageDraw.Draw(pm).polygon([(x * f, y * f) for x, y in poly], fill=255); pm = np.asarray(pm) > 127
def erode(m, n):
    for _ in range(n):
        m = m & np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1)
    return m
hsv = np.asarray(Image.fromarray(ph).convert('HSV')).astype(np.float64) / 255
A = erode(cast & sil, 2) & erode(pm, 2) & (hsv[..., 1] <= 0.3)
def blur(y, s=1.5):
    r = int(3 * s); x = np.arange(-r, r + 1); g = np.exp(-x * x / (2 * s * s)); g /= g.sum()
    y = np.apply_along_axis(lambda c: np.convolve(np.pad(c, r, mode='edge'), g, 'valid'), 0, y)
    return np.apply_along_axis(lambda c: np.convolve(np.pad(c, r, mode='edge'), g, 'valid'), 1, y)
Yp, Ym = lum(ph), lum(md)
def hf(Y): d = Y - blur(Y); return (d[A] ** 2).mean() / max(Y[A].mean(), 1e-6) ** 2
d2 = hf(Ym) / max(hf(Yp), 1e-12)
hp = np.histogram(Yp[A], 32, (0, 1))[0].astype(float); hm = np.histogram(Ym[A], 32, (0, 1))[0].astype(float)
d3 = np.abs(np.cumsum(hp / hp.sum()) - np.cumsum(hm / hm.sum())).sum() / 32
# the 3 masks side by side for the record: photo outline red, model outline green, measured casting pixels white
vis = np.zeros((h, w, 3), np.uint8); vis[pm & ~sil] = (200, 40, 40); vis[sil & ~pm] = (40, 200, 40); vis[pm & sil] = (70, 70, 80); vis[A] = (220, 220, 220)
Image.fromarray(vis).save('scratch/disc/%s_masks.png' % k)
print(json.dumps({'d2': d2, 'd3': d3, 'n': int(A.sum()), 'mp': float(Yp[A].mean()), 'mm': float(Ym[A].mean())}))
`, k, v.img, String(w), String(h), String(f), JSON.stringify(v.poly)]).toString();
  const q = JSON.parse(py.trim().split('\n').pop());
  const s1 = Math.max(0, Math.min(1, res.iou)), s2 = Math.max(0, 1 - Math.abs(Math.log(q.d2)) / Math.log(2)), s3 = Math.max(0, Math.min(1, 1 - q.d3 / 0.25));
  lines.push({k, d1: res.iou, d2: q.d2, d3: q.d3, s1, s2, s3, total: (s1 + s2 + s3) / 3, n: q.n, mp: q.mp, mm: q.mm, rot: res.rot});
  console.log(k, res.iou.toFixed(3), q.d2.toFixed(3), q.d3.toFixed(3));
}
await browser.close();
if (FIT) fs.writeFileSync('scratch/masks.json', JSON.stringify(MASKS, null, 1));
const avg = (key) => lines.reduce((s, l) => s + l[key], 0) / lines.length;
const out = [`round ${R} · ${new Date().toISOString().slice(0, 16)} · console errors ${errs.length}`,
  'view     D1 IoU  D2 energy  D3 hist  | s1    s2    s3    total | casting px  photo / model mean luminance  pose (yaw pitch roll)'];
for (const l of lines) out.push(`${l.k.padEnd(8)} ${l.d1.toFixed(3)}   ${l.d2.toFixed(3).padStart(6)}     ${l.d3.toFixed(3)}    | ${l.s1.toFixed(3)} ${l.s2.toFixed(3)} ${l.s3.toFixed(3)} ${l.total.toFixed(3)} | ${String(l.n).padStart(6)}      ${l.mp.toFixed(3)} / ${l.mm.toFixed(3)}   ${l.rot.join(' ')}`);
out.push(`mean     ${avg('d1').toFixed(3)}   ${avg('d2').toFixed(3).padStart(6)}     ${avg('d3').toFixed(3)}    | ${avg('s1').toFixed(3)} ${avg('s2').toFixed(3)} ${avg('s3').toFixed(3)} ${avg('total').toFixed(3)}`, '');
fs.appendFileSync('scratch/disc.txt', out.join('\n') + '\n');
// the round's review sheet (D4's evidence): per view the photo, the model and the masks, 3 x 2 views, 1560 px wide
execFileSync('python', ['-I', '-c', `
import json, sys
from PIL import Image, ImageDraw
M = json.load(open('scratch/masks.json')); V = json.loads(sys.argv[1]); L = json.loads(sys.argv[2])
cells = []
for k in V:
    md = Image.open('scratch/disc/%s_render.png' % k).convert('RGB'); mk = Image.open('scratch/disc/%s_masks.png' % k).convert('RGB')
    ph = Image.open(M[k]['img']).convert('RGB').resize(md.size, Image.LANCZOS)
    f = md.width / M[k]['size'][0]; xs = [p[0] * f for p in M[k]['poly']]; ys = [p[1] * f for p in M[k]['poly']]
    m = 0.08 * max(max(xs) - min(xs), max(ys) - min(ys)); box = (int(min(xs) - m), int(min(ys) - m), int(max(xs) + m), int(max(ys) + m))
    c = Image.new('RGB', (780, 318), (20, 20, 22)); x = 0
    for im in (ph, md, mk):
        im = im.crop(box); s = min(260 / im.width, 300 / im.height); im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        c.paste(im, (x + (260 - im.width) // 2, 18 + (300 - im.height) // 2)); x += 260
    ImageDraw.Draw(c).text((4, 3), L[k], fill=(230, 210, 150)); cells.append(c)
S = Image.new('RGB', (1560, 3 * 318), (20, 20, 22))
for i, c in enumerate(cells): S.paste(c, (780 * (i % 2), 318 * (i // 2)))
S.save('scratch/disc/sheet_r%s.png' % sys.argv[3])
`, JSON.stringify(VIEWS), JSON.stringify(Object.fromEntries(lines.map((l) => [l.k, `${l.k}  D1 ${l.d1.toFixed(3)}  D2 ${l.d2.toFixed(3)}  D3 ${l.d3.toFixed(3)}  total ${l.total.toFixed(3)}  | photo | model | masks (red photo only, green model only, white measured)`]))), R]);
console.log(out.join('\n'));
if (errs.length) console.log(errs.slice(0, 5).join('\n'));
