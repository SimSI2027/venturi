// VENTURI 39: a Keihin flat-slide carburetor (2004 YFZ450, I.D. 5TG1 00) that comes apart part by part.
// Adapted from Ironwood: render on demand, quality tiers and adaptive steps, the framing rule, name cards and
// leaders, the dock and pills, ?perf=1, shader pre-compile with the progress line, the MSAA + SMAA chain.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import fontMed from '@fontsource/barlow-condensed/files/barlow-condensed-latin-500-normal.woff2';
import fontSemi from '@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2';
import {createStage, FLOOR_Y, MM} from './stage.js';
import {createPerf} from './perf.js';
import {Asm, SEC, CLIP} from './lib/asm.js';
import {PARTS, PIECES, KPIECES, GROUPS, STEPS_B, N_B, SPEC_LABELS, CONFLICT_20, KIT, KIT_TOTAL, inKit, inManual, info, nameOf, specValue, groupIndex, needsLT, fitNew, checkLine, LT_TEXT} from './carb/data.js';
import {buildHoses} from './carb/hoses.js';
import {buildSensor} from './carb/sensor.js';
import {buildStarters} from './carb/starters.js';
import {buildTop} from './carb/top.js';
import {buildSlide} from './carb/slide.js';
import {buildLinkage} from './carb/linkage.js';
import {buildPilotAir} from './carb/pilot-air.js';
import {buildPump} from './carb/pump.js';
import {buildBowl} from './carb/bowl.js';
import {buildFloat} from './carb/float.js';
import {buildJets} from './carb/jets.js';
import {buildMixture} from './carb/mixture.js';
import {buildBody} from './carb/body.js';
import {toMM} from './carb/kit.js';
import {createGuide, MODES, REMOVED_AT, FITTED_AT} from './guide.js';

const MARKS = {parsed: performance.now()};
const q = new URLSearchParams(location.search);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const BUILD = {hoses: buildHoses, sensor: buildSensor, starters: buildStarters, top: buildTop, slide: buildSlide, linkage: buildLinkage, 'pilot-air': buildPilotAir, pump: buildPump, bowl: buildBowl, float: buildFloat, jets: buildJets, mixture: buildMixture, body: buildBody};
const NOTICE = 'Visual guide only. Follow the service manual.';
// run 9: the model is at real scale, 1 unit = 1 mm (correction 14)
const SCALE_NOTE = 'real size in mm: 191.8 tall, 120.8 wide, engine spigot 48 across, 63.5 from the engine spigot face to the body’s air-box face (Sudco FCR-MX39 table); every other size is estimated to scale from photos';

async function loadFonts() {
  const faces = [
    new FontFace('Barlow Condensed', `url(data:font/woff2;base64,${fontMed})`, {weight: '500'}),
    new FontFace('Barlow Condensed', `url(data:font/woff2;base64,${fontSemi})`, {weight: '600'}),
  ];
  await Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff)))).catch(() => {});
}
function el(tag, cls, html, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  if (parent) parent.appendChild(e);
  return e;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const nn = (i) => String(i + 1).padStart(2, '0');

async function main() {
  await loadFonts();
  const app = document.getElementById('app');
  const canvas = el('canvas', null, null, app);
  canvas.id = 'gl';
  const S = createStage(canvas);
  const {scene, camera} = S;
  S.renderer.localClippingEnabled = true; // run 13 (item 11): SECTION's plane

  // --- the carburetor: each group's programs compile in parallel as soon as it is built; a brass line shows progress
  const load = el('div', 'iw-load', '<i></i>', app);
  const jobs = [];
  let built = 0;
  const bump = () => load.firstChild.style.setProperty('--p', `${((++built / Math.max(jobs.length, 14)) * 100).toFixed(0)}%`);
  const compile = (o, rt = S.composer.readBuffer, lit = scene) => {
    S.renderer.setRenderTarget(rt);
    jobs.push(S.renderer.compileAsync(o, camera, lit).then(bump));
    S.renderer.setRenderTarget(null);
  };
  const carb = new THREE.Group();
  scene.add(carb);
  const asms = GROUPS.map((g, i) => {
    const a = toMM(BUILD[g.key](i)); // run 9: baked into mm (1 unit = 1 mm)
    carb.add(a.group);
    a.finalize();
    compile(a.group);
    return a;
  });
  const parts = asms.flatMap((a) => a.parts);
  const partOf = Object.fromEntries(parts.map((p) => [p.id, p]));
  const missing = PARTS.filter((p) => !partOf[String(p.ref)]).map((p) => p.ref);
  if (missing.length) console.error('parts not built:', missing.join(', '));
  const meshes = [];
  asms.forEach((a) => a.group.traverse((o) => o.isMesh && meshes.push(o)));
  scene.children.filter((o) => o !== carb && o.isMesh).forEach((o) => compile(o));
  const quad = new THREE.PlaneGeometry(1, 1).deleteAttribute('normal');
  S.composer.passes.forEach((p, i, all) => {
    const g = new THREE.Group();
    for (const v of Object.values(p)) for (const m of [v].flat()) if (m?.isMaterial) g.add(new THREE.Mesh(quad, m));
    if (g.children.length && i < all.length - 1) compile(g, undefined, g);
  });
  MARKS.textures = performance.now();

  // --- UI: header, hint, dock (explode + pills), parts panel (PARTS / SPECS), detail card, hover card, footer
  const ui = el('div', 'iw', null, app);
  const head = el('div', 'iw-head', `<span class="iw-brand">VENTURI <b>39</b></span><span class="iw-dot">·</span><span class="iw-sub">Find it, turn it, put it back.<span class="iw-cnt"> · <b>${PARTS.length}</b> references</span></span>`, ui);
  const qSeg = el('span', 'iw-q', '<button data-t="high">High</button><button data-t="med">Med</button><button data-t="low">Low</button>', head);
  // the "?" controls card
  const helpBtn = el('button', 'iw-help', '?', head);
  helpBtn.setAttribute('aria-label', 'Controls');
  helpBtn.setAttribute('aria-expanded', 'false');
  const HELP = [['Drag', 'orbit'], ['Wheel / pinch', 'zoom'], ['Hover a part', 'its name and group'], ['Click a part', 'bring it forward, drag to spin it'], ['Esc / click away', 'put it back, leave a group'], ['Explode', 'groups, then their parts, come apart'], ['01 to 13', 'fly to a group, dim the rest'], ['Tear down · Rebuild', 'guided steps: Back / Next or ← →'], ['Parts', 'search, specs, steps and your notes'], ['High · Med · Low', 'render quality'], ['Scale', SCALE_NOTE], ['?', 'this card']];
  const helpCard = el('div', 'iw-helpcard', HELP.map(([k, v]) => `<div><b>${k}</b><span>${v}</span></div>`).join(''), ui);
  const setHelp = (on) => (helpCard.classList.toggle('on', on), helpBtn.setAttribute('aria-expanded', String(on)));
  helpBtn.onclick = () => setHelp(!helpCard.classList.contains('on'));
  addEventListener('pointerdown', (e) => helpCard.classList.contains('on') && !e.target.closest('.iw-helpcard, .iw-help') && setHelp(false));
  el('div', 'iw-rule', null, ui);
  const hint =el('div', 'iw-hint', null, ui);
  const dropped = [];
  const setHint = () => (hint.textContent = `13 groups · ${meshes.length} meshes · ${{high: 'HIGH', med: 'MEDIUM', low: 'LOW'}[S.tier]}${dropped.map((k) => ' · ' + k).join('')}`);
  el('div', 'vt-foot', NOTICE, ui);

  const TIERS = ['high', 'med', 'low'];
  const forced = TIERS.includes(q.get('q')) ? q.get('q') : null;
  let stored = null;
  try {
    stored = localStorage.getItem('venturi.tier.v1');
  } catch (e) {}
  if (!TIERS.includes(stored)) stored = null;
  const gl = S.renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
  const discrete = /\b(rtx|gtx)\b|radeon\s*rx\b|\barc\b|apple\s*m\d/i.test(gpu);
  const phone = matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 600;
  S.setTier(forced || stored || (phone ? 'low' : discrete ? 'high' : 'med'));
  window.__PROBE = {gpu, discrete, tier: S.tier};
  const showQ = () => [...qSeg.children].forEach((b) => b.classList.toggle('on', b.dataset.t === S.tier));
  let epoch = 0;
  qSeg.onclick = (e) => {
    const t = e.target.dataset?.t;
    if (!t) return;
    S.render();
    S.crossfade();
    S.setTier(t);
    epoch++;
    try {
      localStorage.setItem('venturi.tier.v1', t); // saved only on a click
    } catch (err) {}
    showQ();
    setHint();
  };
  showQ();
  setHint();

  const lead = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  lead.setAttribute('class', 'iw-lead');
  lead.innerHTML = '<polyline points="" visibility="hidden"/><circle r="2.6" visibility="hidden"/><circle r="6" class="halo" visibility="hidden"/>';
  ui.appendChild(lead);
  const [lLine, lDot, lHalo] = lead.children;
  const card = el('div', 'iw-card', '<div class="nm"></div><div class="as"></div>', ui);

  const dock = el('div', 'iw-dock', null, ui);
  // the mode bar: free exploring, or one of the guided modes (each button shows its steps done)
  const MODE_KEYS = ['explore', 'teardown', 'rebuild'];
  const modeBar = el('div', 'vt-modes', MODE_KEYS.map((k) => `<button class="iw-btn" data-m="${k}">${k === 'explore' ? 'Explore' : `<span class="l">${MODES[k].label}</span><span class="s">${MODES[k].short}</span><i></i>`}</button>`).join(''), dock);
  const ctl = el('div', 'iw-ctl', '<label>Explode</label>', dock);
  const range = el('input', 'iw-range', null, ctl);
  Object.assign(range, {type: 'range', min: 0, max: 1, step: 0.001, value: 0});
  range.setAttribute('aria-label', 'Explode');
  const out = el('output', null, '0.00', ctl);
  let secOn = false; // run 13 (item 11): SECTION on
  const secBtn = el('button', 'iw-btn iw-section', 'Section', ctl);
  secBtn.setAttribute('aria-pressed', 'false');
  secBtn.setAttribute('aria-label', 'Section: cut the body along the bore');
  const pillWrap = el('div', 'iw-pw', null, dock); // run 23 (item 8): a strip too narrow for all 13 pills scrolls, with a fade and an arrow at each cut edge
  const pills = el('div', 'iw-pills', null, pillWrap);
  const pillBtns = asms.map((a, i) => {
    const b = el('button', 'iw-btn', `<i>${nn(i)}</i>${a.label}`, pills);
    b.onclick = () => focusOn(focus === i ? -1 : i);
    return b;
  });
  const pillEdge = () => {
    const room = pills.scrollWidth - pills.clientWidth;
    pillWrap.classList.toggle('more-l', pills.scrollLeft > 2);
    pillWrap.classList.toggle('more-r', pills.scrollLeft < room - 2);
  };
  [-1, 1].forEach((d) => {
    const b = el('button', `iw-pa ${d < 0 ? 'l' : 'r'}`, d < 0 ? '‹' : '›', pillWrap);
    b.setAttribute('aria-label', d < 0 ? 'Earlier groups' : 'More groups');
    b.onclick = () => pills.scrollBy({left: d * pills.clientWidth * 0.6, behavior: 'smooth'});
  });
  pills.addEventListener('scroll', pillEdge, {passive: true});
  new ResizeObserver(pillEdge).observe(pills);

  // parts panel: search + 79 rows; SPECS: specs.json as a table
  const panel = el('div', 'vt-panel', null, ui);
  const pTabs = el('div', 'vt-tabs', '<button data-k="parts" class="on">Parts</button><button data-k="specs">Specs</button><button data-k="steps">Steps</button><button data-k="kit">Kit</button><button data-k="notes">Notes</button><button class="vt-x" aria-label="Close">×</button>', panel);
  const pBody = el('div', 'vt-pbody', null, panel);
  const search = el('input', 'vt-search', null, pBody);
  Object.assign(search, {type: 'search', placeholder: 'Search number or name'});
  search.setAttribute('aria-label', 'Search parts');
  const list = el('div', 'vt-list', null, pBody);
  // run 11: each reference's Keihin pieces (no fiche number of their own) as indented rows under it, "K12" first
  const rows = PARTS.flatMap((p) => {
    const r = el('button', 'vt-row', `<b>${p.ref}</b><span>${esc(p.name)}</span><i>${nn(groupIndex(p.group))}</i>`, list);
    r.dataset.id = String(p.ref);
    r.dataset.q = `${p.ref} ${p.name} ${p.role}`.toLowerCase();
    r.onclick = () => select(String(p.ref));
    const subs = KPIECES.filter((k) => PIECES[k].of === String(p.ref)).map((k) => {
      const s = el('button', 'vt-row sub', `<b>${k}</b><span>${esc(nameOf(k))}</span><i>${nn(groupIndex(PIECES[k].group))}</i>`, list);
      s.dataset.id = k;
      s.dataset.q = `${k} ${nameOf(k)} ${PIECES[k].role}`.toLowerCase();
      s.onclick = () => select(k);
      return s;
    });
    return [r, ...subs];
  });
  const specs = el('div', 'vt-specs', null, pBody);
  specs.innerHTML = `<table>${Object.keys(SPEC_LABELS).map((k) => `<tr><th>${esc(SPEC_LABELS[k])}</th><td>${esc(specValue(k))}</td></tr>`).join('')}</table><p class="vt-src">${esc('Source: YFZ450 service manual, chapter 2 specifications and chapter 6')}</p><p class="vt-src">${esc('Model scale: ' + SCALE_NOTE + '.')}</p>`;
  specs.hidden = true;
  // run 13 (item 13): the KIT tab: every seal, O-ring, gasket and diaphragm, with quantities and the total
  const kit = el('div', 'vt-specs vt-kit-tab', null, pBody);
  kit.innerHTML = `<p class="vt-src">Usually replaced at a rebuild: seals, O-rings, gaskets and diaphragms.</p>` +
    `<table><tr class="vt-kh"><th>Part</th><td>Qty</td><td class="vt-fn">manual: fit new</td></tr>${KIT.map((k) => `<tr data-id="${k.id}" tabindex="0"><th>${esc(k.id.startsWith('K') ? `${k.id} · ${PIECES[k.id].piece[0].toUpperCase()}${PIECES[k.id].piece.slice(1)}` : nameOf(k.id))}<small>${k.kind}${k.id.startsWith('K') ? ' · part of ' + esc(info(k.id).ref) : ''}</small></th><td>${k.qty}${k.known ? '' : '*'}</td><td class="vt-fn">${fitNew(k.id) ? 'fit new' : ''}</td></tr>`).join('')}` +
    `<tr class="tot"><th>Total</th><td colspan="2">${KIT_TOTAL} pieces in ${KIT.length} lines</td></tr></table>` +
    `<p class="vt-src">* the sources give no quantity for this line: counted once. Quantities come from the fiche table (refs 61-79) and the Keihin diagram.</p>`;
  kit.hidden = true;
  kit.onclick = (e) => {
    const r = e.target.closest('tr[data-id]');
    if (r) select(r.dataset.id);
  };
  search.addEventListener('input', () => {
    const s = search.value.trim().toLowerCase();
    rows.forEach((r) => (r.hidden = !!s && !(/^\d+$/.test(s) ? r.dataset.id === s || r.dataset.id.startsWith(s) : r.dataset.q.includes(s))));
  });
  const pBtn = el('button', 'iw-btn vt-pbtn', 'Parts', ui);
  const setPanel = (open) => (panel.classList.toggle('open', open), pBtn.classList.toggle('on', open));
  pBtn.onclick = () => setPanel(!panel.classList.contains('open'));
  pTabs.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('vt-x')) return setPanel(false);
    showTab(b.dataset.k);
  };
  function showTab(k) {
    [...pTabs.children].forEach((c) => c.classList.toggle('on', c.dataset.k === k));
    list.hidden = search.hidden = k !== 'parts';
    specs.hidden = k !== 'specs';
    kit.hidden = k !== 'kit';
    guide.views.steps.hidden = k !== 'steps';
    guide.views.notes.hidden = k !== 'notes';
  }
  // the guided modes: the step card, the Steps list and the Notes field
  const guide = createGuide({el, ui, body: pBody, go: (m, n) => setMode(m, n), onPart: (id) => select(id)});
  const showProgress = () => MODE_KEYS.forEach((k, i) => k !== 'explore' && (modeBar.children[i].querySelector('i').textContent = guide.progress(k)));
  guide.onProgress = showProgress;
  showProgress();
  modeBar.onclick = (e) => {
    const b = e.target.closest('button');
    if (b?.dataset.m) setMode(b.dataset.m === 'explore' ? null : b.dataset.m);
  };
  // the selected part's card
  const detail = el('div', 'vt-detail', null, ui);
  const docked = () => innerWidth >= 1000; // the panel sits beside the view; narrower, it opens over it

  // --- controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 6 * MM;
  controls.maxDistance = 300 * MM;
  controls.maxPolarAngle = Math.PI * 0.9; // low enough to look up at the jets (the floor is one-sided)
  controls.zoomSpeed = 0.9;
  let lastInput = performance.now();
  controls.addEventListener('start', () => {
    lastInput = performance.now();
    view.user = true;
    view.follow = null;
    view.base = null;
  });

  // --- state and tweens (cubic in-out from wherever the value is now)
  const QUICK = 0.45; // a step change inside a guided mode: the parts and the camera settle in 0.45 s
  const st = {explode: Number(q.get('explode') ?? 0), target: Number(q.get('explode') ?? 0)};
  range.value = st.target;
  let focus = -1;
  const tween = (v, dur) => ({v, from: v, to: v, t0: 0, dur});
  const aim = (T, to, now, dur = T.dur) => to !== T.to && Object.assign(T, {from: T.v, to, t0: now, dur});
  const stepT = (T, now) => (T.v = still ? T.to : T.from + (T.to - T.from) * ease(clamp01((now - T.t0) / (T.dur * 1000))));
  const hold = (T, v) => Object.assign(T, {v, from: v, to: v});
  const exT = tween(st.explode, 0.6);
  let exDrag = false;
  const dimT = parts.map(() => tween(0, QUICK));
  const rimT = parts.map(() => tween(0, QUICK));
  const dim = parts.map(() => 0);
  const hvT = tween(0, 0.22);
  // the guided modes pose each part on its own: w 0 home, 1 off along the way it really comes off. mixT blends
  // the explode's pose (0) into the guided pose (1). gRim: the parts the step outlines in brass.
  parts.forEach((p, i) => (p.k = i));
  const wT = parts.map(() => tween(0, 1.1));
  const mixT = tween(0, 0.9);
  const gRim = parts.map(() => 0);
  // guided "off": 0.3 body-lengths out along the part's real fitting axis (its own, else its group's), so it hovers
  // directly in line with its seat. seat: the part's centre at rest (carb space); ext: its half-length on the axis.
  const bodyBox = new THREE.Box3().setFromObject(partOf['1'].obj).getSize(new THREE.Vector3());
  const OFF = 0.3 * Math.max(bodyBox.x, bodyBox.y, bodyBox.z);
  carb.updateMatrixWorld(true);
  for (const p of parts) {
    const gd = new THREE.Vector3(...GROUPS[asms.indexOf(p.asm)].dir);
    p.ax = (p.axis || p.asm.axis || (gd.lengthSq() > 1e-8 ? gd.normalize() : new THREE.Vector3(0, 1, 0))).clone();
    p.gOff = p.ax.clone().multiplyScalar(OFF);
    if (p.legs) p.legV = p.legs.map((v) => v.clone().multiplyScalar(OFF)); // item 5: a path in legs (first along p.ax)
    const b =new THREE.Box3().setFromObject(p.obj);
    const s = b.getSize(new THREE.Vector3());
    p.seat = carb.worldToLocal(b.getCenter(new THREE.Vector3()));
    p.ext = 0.5 * (Math.abs(p.ax.x) * s.x + Math.abs(p.ax.y) * s.y + Math.abs(p.ax.z) * s.z);
    p.size = s;
    p.extL = (p.legV || [p.gOff]).map((v) => { const d = v.clone().normalize(); return 0.5 * (Math.abs(d.x) * s.x + Math.abs(d.y) * s.y + Math.abs(d.z) * s.z); }); // half-length along each leg
  }
  // 1 thin brass dashed line per hovering part, from its seat to the part (drawn over everything)
  const DASH = [0.22 * MM, 0.14 * MM];
  const MAXD = 1200;
  const dashGeo = new THREE.BufferGeometry();
  dashGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXD * 6), 3));
  const dashes = new THREE.LineSegments(dashGeo, new THREE.LineBasicMaterial({color: 0xc9a24b, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, toneMapped: false}));
  Object.assign(dashes, {renderOrder: 20, frustumCulled: false, visible: false});
  carb.add(dashes);
  compile(dashes);
  const dv = new THREE.Vector3();
  /** The guided hover offset of p at w (0-1 of its path): 1 straight leg along its axis, or its legs one after the other by length. */
  function hoverAt(p, w, out = new THREE.Vector3()) {
    if (!p.legV) return out.copy(p.gOff).multiplyScalar(w);
    let r = w * p.legV.reduce((a, v) => a + v.length(), 0);
    out.set(0, 0, 0);
    for (const v of p.legV) {
      const L = v.length(), k = Math.min(r, L);
      out.addScaledVector(v, k / L);
      if ((r -= k) <= 0) break;
    }
    return out;
  }
  function placeDashes() {
    const arr = dashGeo.attributes.position.array;
    let k = 0;
    if (guide.mode) for (const p of [...curParts(), ...legged()]) {
      const w = wT[p.k].v * mixT.v;
      if (w < 0.03 || hT[p.k].v > 0.5 || p === solo.part) continue;
      // run 22 (item 3): the dashes follow every leg of the path; a finished leg is dashed to its end, the leg it is on from the seat to the part's near face
      const legs = p.legV || [p.gOff];
      let r = w * legs.reduce((a, v) => a + v.length(), 0);
      dv.copy(p.seat);
      for (let i = 0; i < legs.length && r > 0; i++) {
        const Ll = legs[i].length(), dir = legs[i].clone().divideScalar(Ll), last = r <= Ll;
        const L = last ? Math.max(r - p.extL[i], i ? 0 : 0.25 * MM) : Ll;
        const a0 = dv.clone();
        for (let s = 0; s < L && k < MAXD; s += DASH[0] + DASH[1], k++) {
          dv.copy(a0).addScaledVector(dir, s).toArray(arr, k * 6);
          dv.copy(a0).addScaledVector(dir, Math.min(L, s + DASH[0])).toArray(arr, k * 6 + 3);
        }
        dv.copy(a0).addScaledVector(dir, Ll);
        r -= Ll;
      }
    }
    dashGeo.setDrawRange(0, k * 2);
    dashGeo.attributes.position.needsUpdate = true;
    dashes.visible = k > 0;
  }
  const hT = parts.map(() => tween(0, 0.45)); // guided: the part hidden (1) or shown (0) (since run 13 nothing is hidden: see the tray)
  // run 13 (item 12): the bench tray. A part taken off in a guided mode goes to a slot in a tray below the carburetor, in the order it came
  // off (rows of the parts' own sizes, 8 mm apart, left to right, wrapping at 2.2 body widths), instead of vanishing. trT: 0 on the carburetor
  // (or hovering at its step), 1 in its slot; p.tray: the slot as a position of the part's object. TEAR DOWN: the parts of steps before n
  // are in the tray; REBUILD: the parts not yet fitted are (their slots stay by removal order, so the fitted ones leave gaps).
  const trT = parts.map(() => tween(0, 0.8));
  // run 16 (item 5): the tray is grouped by step. Each tear-down step's parts sit side by side in one group, the groups in step order (REBUILD:
  // rebuild order) in TRAY_ROWS rows hanging under the carburetor, 1 small step number under each group, the current step's group outlined in
  // brass. Parts keep their true relative scale (one factor f for all, as large as the tray's height allows), except that none shows smaller
  // than TRAY_MIN mm across on screen (12 px at 800 x 500). The tray faces the camera: its slots follow the camera's right and up (layTray).
  const TRAY_MIN = 11.8, TRAY_GAP = 0.8, TRAY_GG = 2, TRAY_PAD = 0.4, TRAY_LB = 6.4, TRAY_RG = 0.3, TRAY_ROWS = 5, TRAY_H = 97;
  const tr = new THREE.Vector3(), tu = new THREE.Vector3(), tc = new THREE.Vector3(), tp = new THREE.Vector3();
  let trayBox = null;
  const trayGroups = []; // {n: tear-down step, ps: its parts in the tray}, in tear-down order
  const trayLay = {v: null, to: null}; // the layout for the camera as it is, and for the target camera
  {
    const order = parts.filter((p) => Number.isFinite(REMOVED_AT[p.id])).sort((a, b) => REMOVED_AT[a.id] - REMOVED_AT[b.id] || a.k - b.k);
    trayBox = new THREE.Box3().setFromObject(partOf['1'].obj).union(new THREE.Box3().setFromObject(partOf['1-bowl'].obj));
    for (const p of order) {
      p.trayS = 1;
      p.tg = true;
      p.tray = new THREE.Vector3();
      const n = REMOVED_AT[p.id];
      let g = trayGroups[trayGroups.length - 1];
      if (!g || g.n !== n) trayGroups.push((g = {n, ps: []}));
      g.ps.push(p);
    }
  }
  const trayUI = el('div', 'vt-tray', null, ui);
  const trayEls = new Map(trayGroups.map((g) => [g.n, el('div', 'vt-tg', '<b></b>', trayUI)]));
  /** A part's hull points relative to its origin, at rest (taken once). */
  function hullLocal(p) {
    if (!p.hp) {
      p.obj.updateWorldMatrix(true, true);
      const inv = p.obj.matrixWorld.clone().invert();
      p.hp = [];
      p.obj.traverse((m) => m.isMesh && hullOf(m).forEach((q) => p.hp.push(q.clone().applyMatrix4(m.matrixWorld).applyMatrix4(inv).applyQuaternion(p.obj.quaternion))));
    }
    return p.hp;
  }
  /** The groups' layout at part scale factor f, in mm on the tray's plane (x along the camera's right, y down from the tray's top). sz: p -> [width, height] of its projection. */
  function trayFit(f, seq, sz, R = TRAY_ROWS) {
    const gs = seq.map((g) => {
      const items = g.ps.map((p) => {
        const [er, eu] = sz.get(p);
        const s = THREE.MathUtils.clamp(Math.max(f, TRAY_MIN / Math.max(er, eu, 1e-3)), 0.04, 30);
        return {p, s, w: er * s, h: eu * s};
      });
      return {n: g.n, items, w: items.reduce((a, i) => a + i.w, 0) + TRAY_GAP * (items.length - 1) + 2 * TRAY_PAD, h: Math.max(...items.map((i) => i.h))};
    });
    const tot = gs.reduce((a, g) => a + g.w + TRAY_GG, -TRAY_GG), widest = Math.max(...gs.map((g) => g.w));
    let rows;
    for (let lim = Math.max((tot / R) * 1.03, widest), k = 0; k < 30; k++, lim *= 1.03) {
      rows = [[]];
      let x = 0;
      for (const g of gs) {
        if (x > 0 && x + g.w > lim) rows.push([]), (x = 0);
        rows[rows.length - 1].push(g);
        x += g.w + TRAY_GG;
      }
      if (rows.length <= R) break;
    }
    const rh = rows.map((r) => Math.max(...r.map((g) => g.h)));
    const W = Math.max(...rows.map((r) => r.reduce((a, g) => a + g.w + TRAY_GG, -TRAY_GG)));
    return {gs, rows, rh, W, H: rh.reduce((a, h) => a + h + TRAY_LB + 2 * TRAY_PAD, 0) + (rows.length - 1) * TRAY_RG};
  }
  const tC = new THREE.Vector3(), tF = new THREE.Vector3(), tQ = new THREE.Vector3();
  /** The tray's slots for the camera's right and up (the target camera's when useTo): the rows hang under the carburetor's lowest point along up. */
  function layTray(useTo) {
    if (!trayBox) return;
    if (useTo) {
      const f = autoDir().clone().normalize().negate();
      tr.crossVectors(f, camera.up).normalize();
      tu.crossVectors(tr, f);
    } else {
      camera.updateMatrixWorld();
      tr.setFromMatrixColumn(camera.matrixWorld, 0);
      tu.setFromMatrixColumn(camera.matrixWorld, 1);
    }
    trayBox.getCenter(tc);
    // run 25 (item 2): the lowest (and highest) point of every part not in the tray, at its pose now (hovering parts included), as the camera
    // sees it: each hull point is carried along its sight line onto the tray's plane (through tc, facing the camera). A part on its way to
    // the tray counts less as it goes (tw), so the tray moves smoothly.
    tF.crossVectors(tu, tr);
    if (useTo) tC.copy(tc).addScaledVector(tF, -camera.position.distanceTo(tc));
    else tC.copy(camera.position);
    const d0 = tp.copy(tc).sub(tC).dot(tF);
    const ext = (p) => {
      let lo = Infinity, hi = -Infinity;
      for (const q of hullLocal(p)) {
        tQ.copy(q).add(p.obj.position).applyMatrix4(p.obj.parent.matrixWorld).sub(tC);
        const u = tQ.multiplyScalar(d0 / Math.max(1e-6, tQ.dot(tF))).add(tC).sub(tc).dot(tu);
        lo = Math.min(lo, u), (hi = Math.max(hi, u));
      }
      return [lo, hi];
    };
    const [bl, bh] = ext(partOf['1']);
    let low = bl, high = bh;
    for (const p of parts) {
      if (p === partOf['1'] || !p.obj.visible) continue;
      const tw = p.tray ? (useTo ? trT[p.k].to : trT[p.k].v) : 0;
      if (tw >= 1) continue;
      const [l, h] = ext(p);
      low = Math.min(low, bl + Math.min(0, l - bl) * (1 - tw));
      high = Math.max(high, bh + Math.max(0, h - bh) * (1 - tw));
    }
    // 16 px clear of it (12 asked) plus 2 mm, at the tray plane's scale
    const mmPx = (2 * d0 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, S.size.h);
    const gapMM = 16 * mmPx + 2;
    // each part's size as the camera sees it
    const sz = new Map();
    for (const g of trayGroups) for (const p of g.ps) {
      hullLocal(p);
      let r0 = Infinity, r1 = -Infinity, u0 = Infinity, u1 = -Infinity;
      for (const q of p.hp) { const a = q.dot(tr), b = q.dot(tu); r0 = Math.min(r0, a); r1 = Math.max(r1, a); u0 = Math.min(u0, b); u1 = Math.max(u1, b); }
      sz.set(p, [r1 - r0, u1 - u0]);
    }
    const seq = guide.mode === 'rebuild' ? trayGroups.slice().reverse() : trayGroups;
    // run 25 (item 2): wide before tall. For 1 to TRAY_ROWS rows, the largest f (at most 1: never bigger than in the carburetor) whose rows
    // fit TRAY_H mm and no wider than the usable area allows at the height they make with the carburetor; the fewest rows whose f is at
    // least 0.6 of the best f win (cells shrink before a row is added). Too wide even at the smallest cells: the old rule (TRAY_ROWS rows).
    const U = usable(), asp = (U.r - U.l) / Math.max(1, U.b - U.t);
    const okAt = (f, R) => { const L = trayFit(f, seq, sz, R); return L.rows.length <= R && L.H <= TRAY_H && L.W <= asp * (high - low + gapMM + L.H) * 0.98; };
    const bestF = (R, ok) => {
      if (ok(1, R)) return 1;
      if (!ok(0.01, R)) return 0;
      let lo = 0.01, hi = 1;
      for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (ok(m, R)) lo = m; else hi = m; }
      return lo;
    };
    const fs = [];
    for (let R = 1; R <= TRAY_ROWS; R++) fs.push(bestF(R, okAt));
    const fMax = Math.max(...fs);
    let R = TRAY_ROWS, lo = fMax;
    if (fMax > 0) (R = fs.findIndex((f) => f >= 0.6 * fMax) + 1), (lo = fs[R - 1]);
    else lo = bestF(TRAY_ROWS, (f) => trayFit(f, seq, sz).H <= TRAY_H) || 0.01;
    const L = trayFit(lo, seq, sz, R);
    const top = low - gapMM, boxes = [];
    let y = 0;
    L.rows.forEach((row, ri) => {
      const rw = row.reduce((a, g) => a + g.w + TRAY_GG, -TRAY_GG), rhh = L.rh[ri];
      let x = -rw / 2;
      for (const g of row) {
        let px = x + TRAY_PAD;
        for (const it of g.items) {
          const p = it.p;
          p.trayS = it.s;
          // its centre lands on the slot at its scale there
          p.tray.copy(tc).addScaledVector(tr, px + it.w / 2).addScaledVector(tu, top - (y + TRAY_PAD + rhh / 2)).sub(tp.copy(p.seat).sub(p.rest).multiplyScalar(it.s));
          px += it.w + TRAY_GAP;
        }
        const h = rhh + TRAY_LB + 2 * TRAY_PAD, c = (a, b) => new THREE.Vector3().copy(tc).addScaledVector(tr, a).addScaledVector(tu, top - b);
        boxes.push({n: g.n, pts: [c(x, y), c(x + g.w, y), c(x + g.w, y + h), c(x, y + h)]});
        x += g.w + TRAY_GG;
      }
      y += rhh + TRAY_LB + 2 * TRAY_PAD + TRAY_RG;
    });
    trayLay[useTo ? 'to' : 'v'] = {f: lo, H: L.H, W: L.W, rows: L.rows.length, boxes};
  }
  /** The tray's step numbers and the brass outline of the current step's group, placed from the layout the parts were laid by (run 16, item 5). */
  function drawTrayUI() {
    const L = guide.mode ? trayLay.v : null;
    trayUI.classList.toggle('on', !!L && !(solo.part && solo.T.to > 0)); // run 23 (item 6): 0% while a part is clicked alone
    if (!L) return;
    camera.updateMatrixWorld();
    const cur = guide.mode === 'rebuild' ? N_B + 1 - guide.n : guide.n;
    for (const b of L.boxes) {
      const g = trayGroups.find((q) => q.n === b.n), e = trayEls.get(b.n);
      const show = b.n === cur || g.ps.some((p) => trT[p.k].to > 0.5);
      e.classList.toggle('show', show);
      e.classList.toggle('on', b.n === cur);
      if (!show) continue;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const q of b.pts) { const o = S.project(q); x0 = Math.min(x0, o.x); x1 = Math.max(x1, o.x); y0 = Math.min(y0, o.y); y1 = Math.max(y1, o.y); }
      e.style.transform = `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`;
      e.style.width = `${(x1 - x0).toFixed(1)}px`;
      e.style.height = `${(y1 - y0).toFixed(1)}px`;
      const t = String(guide.mode === 'rebuild' ? N_B + 1 - b.n : b.n);
      if (e.dataset.t !== t) (e.dataset.t = t), (e.firstChild.textContent = t);
    }
  }
  const hOff = new THREE.Vector3();
  function poseAll(e, useTo = false) {
    const m = useTo ? mixT.to : mixT.v;
    for (const a of asms) {
      const g = a.groupAmt(e) * (1 - m);
      a.poseEach((p) => [g, Asm.partAmt(p, e) * (1 - m)]);
      for (const p of a.parts) p.obj.position.add(hoverAt(p, (useTo ? wT[p.k].to : wT[p.k].v) * m, hOff)), p.obj.scale.setScalar(1);
    }
    if (guide.mode) layTray(useTo); // run 25 (item 2): laid from the poses above, so it clears the hovering parts too
    for (const p of parts) {
      const tw = p.tray ? (useTo ? trT[p.k].to : trT[p.k].v) : 0;
      if (tw > 0) p.obj.position.lerp(p.tray, tw), p.obj.scale.setScalar(1 + (p.trayS - 1) * tw);
    }
  }
  S.reflectSkip = () => (guide.mode ? parts.filter((p) => p.tray && trT[p.k].v > 0.3).map((p) => p.obj) : []); // run 25 (item 2): the tray casts 0 floor reflection
  /**
   * Each part's target for the current step. TEAR DOWN: steps before n hidden, step n's parts 0.3 body-lengths
   * out on their fitting axis, later parts in place. REBUILD: steps before n in place, step n's parts hovering off their seat (home in
   * 0.6 s on Next), later parts hidden. The step's own parts move 0.35 s after the camera sets off.
   */
  function guideTargets(now, enter = false, quick = false) {
    const s = guide.step();
    const cur = new Set(s ? [...s.parts, ...s.moves] : []); // run 11: with the Keihin pieces riding on them
    const n = guide.n;
    parts.forEach((p, i) => {
      let w = 0;
      let h = 0;
      if (guide.mode === 'teardown') {
        const r = REMOVED_AT[p.id] ?? Infinity; // the body (reference 1) never comes off
        w = cur.has(p.id) || r < n ? 1 : 0;
        h = !cur.has(p.id) && r < n ? 1 : 0;
      } else if (guide.mode === 'rebuild') {
        const f = FITTED_AT[p.id] ?? 0;
        w = cur.has(p.id) || f > n ? 1 : 0;
        h = !cur.has(p.id) && f > n ? 1 : 0;
      }
      gRim[i] = cur.has(p.id) ? 1 : 0;
      const tray = h; // run 13: what was hidden now goes to the tray
      h = 0;
      const wasHidden = hT[i].v > 0.5;
      aim(hT[i], 0, now);
      if (enter || !guide.mode) hold(trT[i], guide.mode ? tray : 0);
      else aim(trT[i], tray, now, quick ? QUICK : 0.8);
      if (!guide.mode) return;
      if (tray) {
        if (enter) hold(wT[i], 0); // straight to its slot
      } else if (wasHidden) hold(wT[i], w); // fades in where it belongs
      else if (cur.has(p.id)) {
        if (enter) hold(wT[i], 0);
        aim(wT[i], 1, now + (quick ? 0 : 350), quick ? QUICK : 0.6);
      } else aim(wT[i], 0, now, quick ? QUICK : 0.6);
    });
  }
  /** SECTION (run 13, item 11): the body cut along the bore (the +Z half away, z 0 of the carburetor), seen from the cut side; the cut
   * faces are the inside faces, drawn a flat brass tint by the part shader (asm.js). Needs the assembled carburetor: any explode, focus,
   * selection or guided mode ends it. */
  function setSection(on, quiet = false) {
    if (on === secOn) return;
    if (on) {
      if (solo.part) deselect();
      if (guide.mode) setMode(null);
      if (focus >= 0) focusOn(-1);
    }
    secOn = on;
    SEC.value = on ? 1 : 0;
    secBtn.classList.toggle('on', on);
    secBtn.setAttribute('aria-pressed', String(on));
    if (on) {
      range.value = st.target = 0;
      carb.updateMatrixWorld(true);
      CLIP.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, -1).transformDirection(carb.matrixWorld), new THREE.Vector3().applyMatrix4(carb.matrixWorld));
      view.user = false;
      view.base = new THREE.Vector3(-0.14, 0.2, 1).normalize();
      followFrom(1.1);
    } else {
      CLIP.constant = 1e5;
      view.base = null;
      if (!quiet) flyTo(1.1);
    }
    S.renderer.shadowMap.needsUpdate = true;
    lastInput = performance.now();
  }
  secBtn.onclick = () => setSection(!secOn);
  /** Go to a guided mode (null: explore) at step n (default: the last step seen there). */
  function setMode(m, n) {
    if (secOn) setSection(false, true);
    const enter = m !== guide.mode;
    if (solo.part) deselect();
    if (m && focus >= 0) focusOn(-1);
    guide.set(m, n ?? (enter ? guide.last[m] : guide.n));
    modeBar.querySelectorAll('button[data-m]').forEach((b) => b.classList.toggle('on', (b.dataset.m === 'explore' ? null : b.dataset.m) === m));
    dock.classList.toggle('guided', !!m);
    const now = performance.now();
    if (enter) {
      aim(mixT, m ? 1 : 0, now);
      if (m && docked()) showTab('steps');
      if (m) range.value = st.target = 0; // the guided carburetor starts assembled
    }
    guideTargets(now, enter && !!m && mixT.v === 0, !enter);
    lastInput = now;
    flyTo(enter ? 1.1 : QUICK);
  }

  // --- framing (Ironwood's rule): the subject's projected bounds fill FILL of the usable area, centred.
  const FILL = 0.8;
  const HERO_DIR = new THREE.Vector3(-0.55, 0.42, 1);
  function usable() {
    const W = S.size.w;
    const H = S.size.h;
    const r = {l: 0, r: W, t: Math.max(head.getBoundingClientRect().bottom, hint.offsetParent ? hint.getBoundingClientRect().bottom : 0) + 6, b: dock.getBoundingClientRect().top - (guide.mode ? 22 : 6)}; // run 23 (item 6): in a guided mode 16 px more, so the tray's outline stays 16 px clear of the mode buttons
    if (docked()) r.r = panel.getBoundingClientRect().left - 8;
    const side = detail.classList.contains('show') ? detail : guide.card.classList.contains('show') ? guide.card : null;
    if (side) {
      const d = side.getBoundingClientRect();
      if (innerWidth >= 720) r.l = Math.max(r.l, d.right + 8);
      else r.b = Math.min(r.b, d.top - 6);
    }
    const pb = document.querySelector('.iw-perf')?.getBoundingClientRect();
    if (pb && pb.width) r.r = Math.min(r.r, pb.left - 8);
    if (r.b - r.t < 0.25 * H) r.b = r.t + 0.25 * H;
    return r;
  }
  function windowOf(fill = FILL) {
    const U = usable();
    const W = S.size.w;
    const H = S.size.h;
    const cx = (U.l + U.r) / 2, cy = (U.t + U.b) / 2, hw = ((U.r - U.l) * fill) / 2, hh = ((U.b - U.t) * fill) / 2;
    return {x0: ((cx - hw) / W) * 2 - 1, x1: ((cx + hw) / W) * 2 - 1, y0: 1 - ((cy + hh) / H) * 2, y1: 1 - ((cy - hh) / H) * 2};
  }
  const DIRS = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) if (i || j || k) DIRS.push(new THREE.Vector3(i, j, k).normalize());
  function hullOf(o) {
    if (o.userData.hull) return o.userData.hull;
    const a = o.geometry.attributes.position;
    const best = new Float64Array(DIRS.length).fill(-Infinity);
    const arg = DIRS.map(() => new THREE.Vector3());
    const v = new THREE.Vector3();
    for (let i = 0; i < a.count; i++) {
      v.fromBufferAttribute(a, i);
      for (let d = 0; d < DIRS.length; d++) {
        const dot = v.dot(DIRS[d]);
        if (dot > best[d]) (best[d] = dot), arg[d].copy(v);
      }
    }
    return (o.userData.hull = arg);
  }
  /** World points bounding obj (an object or a list), skipping the solo part. */
  function subjectPts(obj) {
    carb.updateMatrixWorld(true);
    const out = [];
    for (const o of [obj].flat()) {
      if (!o) continue;
      if (o.isVector3) {
        out.push(o.clone());
        continue;
      }
      o.traverse((m) => {
        if (!m.isMesh) return;
        if (solo.part && m.userData.partRoot === solo.part.obj && solo.T.v > 0.001) return;
        for (const p of hullOf(m)) out.push(p.clone().applyMatrix4(m.matrixWorld));
      });
    }
    return out;
  }
  function frame(obj, dir = HERO_DIR, fill = 1, keep = [], loose = []) {
    const pts = subjectPts(obj);
    dir = dir.clone().normalize();
    const f = dir.clone().negate();
    const r = new THREE.Vector3().crossVectors(f, camera.up).normalize();
    const u = new THREE.Vector3().crossVectors(r, f);
    const ty = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const tx = ty * camera.aspect;
    const W = windowOf();
    const c = new THREE.Box3().setFromPoints(pts).getCenter(new THREE.Vector3());
    const P = pts.map((p) => (p.sub(c), [p.dot(r), p.dot(u), p.dot(f)]));
    let ox = 0, oy = 0;
    let D = (Math.max(...P.map((q) => Math.hypot(q[0], q[1]))) / Math.min(tx, ty)) * 1.5 + 1;
    for (let it = 0; it < 16; it++) {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const q of P) {
        const z = Math.max(q[2] + D, 1e-3);
        const x = (q[0] - ox) / (z * tx);
        const y = (q[1] - oy) / (z * ty);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      ox += ((x0 + x1) / 2 - (W.x0 + W.x1) / 2) * D * tx;
      oy += ((y0 + y1) / 2 - (W.y0 + W.y1) / 2) * D * ty;
      D *= Math.max((x1 - x0) / (W.x1 - W.x0), (y1 - y0) / (W.y1 - W.y0));
    }
    // run 10 (item 9): loose points (the hanging hose runs on load) stay inside the usable area (which keeps its own
    // 6 px margins) but take no part in the fill or the centring
    if (loose.length) {
      const WF = windowOf(1), xc = (WF.x0 + WF.x1) / 2, yc = (WF.y0 + WF.y1) / 2, hw = (WF.x1 - WF.x0) / 2, hh = (WF.y1 - WF.y0) / 2;
      let k = 1;
      for (const p of loose) {
        const d = p.clone().sub(c), z = Math.max(d.dot(f) + D, 1e-3);
        k = Math.max(k, Math.abs((d.dot(r) - ox) / (z * tx) - xc) / hw, Math.abs((d.dot(u) - oy) / (z * ty) - yc) / hh);
      }
      D *= k;
    }
    // keep: points that must stay inside the window but take no part in centring (the contact shadow)
    if (keep.length) {
      let need = 0;
      for (const p of keep) {
        const d = p.clone().sub(c);
        need = Math.min(need, (d.dot(u) - oy) / (Math.max(d.dot(f) + D, 1e-3) * ty) - W.y0);
      }
      let room = Infinity;
      for (const q of P) room = Math.min(room, W.y1 - (q[1] - oy) / (Math.max(q[2] + D, 1e-3) * ty));
      oy += Math.max(need, -room) * D * ty;
    }
    const t = c.clone().addScaledVector(r, ox).addScaledVector(u, oy);
    return {t, p: t.clone().addScaledVector(dir, D * fill)};
  }
  const blend = (a, b, w) => ({t: a.t.clone().lerp(b.t, w), p: a.p.clone().lerp(b.p, w)});
  /** The camera rule, measured: the subject's (or the solo part's) projected bounds over the usable area. */
  function fitNow() {
    camera.updateMatrixWorld();
    const sp = solo.part && solo.T.v > 0.5 ? solo.part.obj : null;
    let pts;
    if (sp) (pts = []), sp.updateMatrixWorld(true), sp.traverse((m) => m.isMesh && hullOf(m).forEach((p) => pts.push(p.clone().applyMatrix4(m.matrixWorld))));
    else pts = subjectPts(autoSubject());
    const U = usable();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pts) {
      const s = S.project(p);
      x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y);
    }
    const r2 = (v) => Math.round(v * 100) / 100;
    return {fill: r2(Math.max((x1 - x0) / (U.r - U.l), (y1 - y0) / (U.b - U.t))), dx: r2(((x0 + x1) / 2 - (U.l + U.r) / 2) / (U.r - U.l)), dy: r2(((y0 + y1) / 2 - (U.t + U.b) / 2) / (U.b - U.t)), inside: x0 >= U.l - 1 && x1 <= U.r + 1 && y0 >= U.t - 1 && y1 <= U.b + 1};
  }

  // --- auto camera: the framing rule along the hero (or the group's) direction, swayed +/-20 deg while idle
  const SWAY = THREE.MathUtils.degToRad(20);
  const SWAY_P = 24;
  const view = {user: false, base: null, follow: null, phase: 0, env: tween(0, 1.6)};
  const swayDir = (d, a) => d.clone().applyAxisAngle(camera.up, a);
  const groupDir = (i) => {
    const d = GROUPS[i].dir;
    return Math.abs(d[2]) > 0.5 ? new THREE.Vector3(-0.45 * Math.sign(d[2]), 0.45, Math.sign(d[2])) : HERO_DIR;
  };
  const ground = (y = S.floor.position.y) => [-3 * MM, 3 * MM].flatMap((x) => [-2.5 * MM, 2.5 * MM].map((z) => new THREE.Vector3(x, y, z)));
  // guided: the current step's parts with the body they come off, seen from the side they come off
  const curParts = () => (guide.step()?.parts || []).map((id) => partOf[id]).filter(Boolean);
  // run 22 (item 3): the Keihin pieces riding the step that fly a path in legs (K16) are dashed and framed like the step's own parts
  const legged = () => (guide.step()?.moves || []).map((id) => partOf[id]).filter((p) => p && p.legV);
  // ...from the end of the step's first part's fitting axis, so its seat shows: from below for the jets, float and
  // bowl, from above for the top and slide, square to the face for the side covers
  const guideDir = () => {
    const p = curParts()[0];
    if (!p) return HERO_DIR;
    const a = p.ax;
    if (Math.abs(a.y) > 0.7) return new THREE.Vector3(-0.42, 1.25 * Math.sign(a.y), 0.62);
    if (Math.abs(a.z) > 0.7) return new THREE.Vector3(-0.4, 0.42, Math.sign(a.z));
    return new THREE.Vector3(Math.sign(a.x), 0.4, 0.5);
  };
  // run 10 (item 9): assembled, with nothing in focus, the carburetor is framed without its hanging hose runs (they
  // stay inside the usable area as loose points), so the castings fill 70-85% on load, not the hoses' ends
  const hoseAsm = asms.find((a) => a.key === 'hoses');
  const bare = () => !guide.mode && focus < 0 && st.explode < 0.02;
  // run 22 (item 3): a part that flies a path in legs (K16) is framed along its whole flight: its box at the seat and at the end of each leg
  const flightPts = () => [...curParts(), ...legged()].filter((p) => p.legV).flatMap((p) => {
    const o = new THREE.Vector3(), h = p.size.clone().multiplyScalar(0.5), pts = [];
    for (let j = 0; j <= p.legV.length; j++) {
      if (j) o.add(p.legV[j - 1]);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(carb.localToWorld(p.seat.clone().add(o).add(new THREE.Vector3(sx * h.x, sy * h.y, sz * h.z))));
    }
    return pts;
  });
  // run 23 (item 6): the current step's tray group (the 4 corners of its brass outline, label row included) is framed too, also on a step whose parts are not in the tray yet
  const trayCur = () => {
    const cur = guide.mode === 'rebuild' ? N_B + 1 - guide.n : guide.n;
    return (guide.mode && trayLay.to?.boxes.find((b) => b.n === cur)?.pts) || [];
  };
  const autoSubject = () => (guide.mode ? [...curParts().map((p) => p.obj), ...flightPts(), ...trayCur(), partOf['1'].obj, ...parts.filter((p) => p.tray && trT[p.k].to > 0.5).map((p) => p.obj)] : focus >= 0 ? asms[focus].group : bare() ? asms.filter((a) => a !== hoseAsm).map((a) => a.group) : carb);
  const autoLoose = () => (bare() ? subjectPts(hoseAsm.group) : []);
  const autoKeep = () => (focus >= 0 || guide.mode ? [] : ground());
  const autoDir = () => swayDir(view.base || (guide.mode ? guideDir() : focus >= 0 ? groupDir(focus) : HERO_DIR), SWAY * view.env.v * Math.sin(view.phase));
  // run 17 (item 9): the lights sit fixed in the room, so a guided step seen from below or from the cable side lit the castings at 37-42% against 49% in
  // EXPLORE's first view. In a guided step the whole rig turns by the angle between that first view and the step's view, once per step (the key's shadow
  // is redrawn once), so the castings are lit the way they are in EXPLORE.
  const EXPOSURE = S.renderer.toneMappingExposure;
  const RIG = [S.key, S.rim, S.under, S.cool];
  const RIG0 = RIG.map((l) => l.position.clone());
  const rigQ = new THREE.Quaternion();
  let rigKey = '';
  function turnRig() {
    const k = guide.mode ? `${guide.mode}${guide.n}` : '';
    if (k === rigKey) return;
    rigKey = k;
    const d = (guide.mode ? guideDir() : HERO_DIR).clone().normalize();
    rigQ.setFromUnitVectors(HERO_DIR.clone().normalize(), d);
    // measured at 800 x 500 on HIGH: with the rig turned the castings still read 42-46% from the cable side and 44-46% from above and below (EXPLORE 45%)
    S.renderer.toneMappingExposure = EXPOSURE * (guide.mode ? (d.z < -0.3 ? 1.18 : d.y > 0.8 ? 1.09 : 1.05) : 1);
    RIG.forEach((l, i) => l.position.copy(RIG0[i]).applyQuaternion(rigQ));
    S.renderer.shadowMap.needsUpdate = true;
  }
  const followFrom = (dur = 0.9) => (view.follow = {from: {t: controls.target.clone(), p: camera.position.clone()}, t0: performance.now(), dur: dur * 1000});
  function flyTo(dur = 1.2) {
    view.user = false;
    view.base = null;
    followFrom(dur);
  }
  function focusOn(i, dur = 1.2) {
    if (secOn) setSection(false, true);
    focus = i;
    pillBtns.forEach((b, k) => b.classList.toggle('on', k === i));
    if (i >= 0) pillBtns[i].scrollIntoView({block: 'nearest', inline: 'center'});
    if (solo.part) deselect();
    flyTo(dur);
  }

  range.addEventListener('pointerdown', () => (exDrag = true));
  addEventListener('pointerup', () => (exDrag = false));
  range.addEventListener('change', () => (exDrag = false));
  range.addEventListener('input', () => {
    st.target = Number(range.value);
    if (secOn && st.target > 0.02) setSection(false, true);
    lastInput = performance.now();
  });

  // --- the selected part, brought forward and spun on its own. T: 0 home, 1 in front of the camera.
  // drag turns it 360 deg in SPIN_PX on both axes; the wheel zooms it (zoom, eased to zoomV); selT fades the rest to 10%
  const SPIN = (2 * Math.PI) / 500;
  const solo = {part: null, T: tween(0, 0.7), spin: new THREE.Quaternion(), c: new THREE.Vector3(), r: 1, drag: null, zoom: 1, zoomV: 1};
  const selT = tween(0, 0.45);
  const SOLO_TRIM = -1.2; // uRim of the clicked part: its lit result x (1 + 0.15 x -1.2) = 0.82
  function select(id) {
    const p = partOf[id];
    if (!p) return;
    if (secOn) setSection(false, true);
    if (solo.part && solo.part !== p) hold(solo.T, 0);
    solo.part = p;
    solo.spin.identity();
    solo.zoom = solo.zoomV = 1;
    // the part's centre and radius in its own space, from its meshes' hulls
    p.obj.updateMatrixWorld(true);
    const inv = p.obj.matrixWorld.clone().invert();
    const pts = [];
    p.obj.traverse((m) => m.isMesh && hullOf(m).forEach((v) => pts.push(v.clone().applyMatrix4(m.matrixWorld).applyMatrix4(inv))));
    const b = new THREE.Box3().setFromPoints(pts);
    b.getCenter(solo.c);
    solo.r = Math.max(0.2, ...pts.map((v) => v.distanceTo(solo.c)));
    solo.pts = pts.map((v) => v.sub(solo.c));
    aim(solo.T, 1, performance.now());
    rows.forEach((r) => r.classList.toggle('on', r.dataset.id === (id.startsWith('1-') ? '1' : id))); // a K piece has its own row
    showDetail(id);
    if (!docked()) setPanel(false);
    lastInput = performance.now();
  }
  function deselect() {
    if (!solo.part) return;
    aim(solo.T, 0, performance.now());
    detail.classList.remove('show');
    guide.card.classList.remove('away');
    rows.forEach((r) => r.classList.remove('on'));
  }
  const label = nameOf;
  function showDetail(id) {
    const i = info(id);
    const gi = groupIndex(i.group);
    const role = i.ref === 20 ? CONFLICT_20 : i.likely ? `likely: ${i.role}` : i.role;
    const sB = STEPS_B[i.step - 1];
    const step = sB ? `Tear down ${i.step} of ${N_B} · rebuild ${N_B + 1 - i.step}${sB.added ? ' (added step, not in the manual’s list' + (inManual(id) ? '' : '; this part is not named in the manual’s list') + ')' : inManual(id) ? '' : ' (not named in the manual’s list)'}` : id === '1' ? 'Stays: everything else comes off it' : 'Stays in the body: not in the manual’s removal list';
    const fits = i.fits ? label(i.fits) : 'the carburetor joint (engine) and the air intake duct';
    const sp = i.specs.map((k) => `<tr><th>${esc(SPEC_LABELS[k])}</th><td>${esc(specValue(k))}</td></tr>`).join('');
    detail.innerHTML =
      // a piece of reference 1 names itself first, then the fiche number and name it belongs to
      (i.piece
        ? `<div class="vt-dn"><span>${esc(nameOf(id).split(' · ')[0])}</span></div><div class="vt-pc">${i.k ? `Keihin ${i.k} · ` : ''}part of <b>${i.ref}</b> · ${esc(i.name)}</div>`
        : `<div class="vt-dn"><b>${i.ref}</b><span>${esc(i.name)}</span></div>`) +
      `<div class="vt-role${i.ref === 20 || i.id === '1-mainjet' ? ' warn' : ''}">${esc(role)}</div>` + (inKit(id) ? '<div class="vt-kitnote">Usually replaced at rebuild</div>' : '') + (fitNew(id) ? '<div class="vt-kitnote">manual: fit new</div>' : '') +
      (checkLine(id) ? `<div class="vt-check">${esc(checkLine(id))}</div>` : '') + (needsLT(id) ? `<div class="vt-check">${esc(LT_TEXT)}</div>` : '') +
      `<dl><dt>Group</dt><dd>${nn(gi)} · ${esc(GROUPS[gi].label)}</dd><dt>Fits into</dt><dd>${esc(fits)}</dd><dt>Step</dt><dd>${esc(step)}</dd>${!i.piece && i.kk.length ? `<dt>Keihin</dt><dd>${esc(i.kk.map((k) => `K${k}`).join(', '))}</dd>` : ''}${i.qty ? `<dt>Qty</dt><dd>${i.qty}</dd>` : ''}</dl>` +
      (sp ? `<table>${sp}</table>` : '') +
      '<div class="vt-hint">Drag to turn it · Esc or click away to put it back</div>';
    detail.classList.add('show');
    guide.card.classList.add('away');
  }
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && solo.part && solo.T.to > 0) return e.target.blur?.(), deselect(); // also from the search box
    if (e.key === 'Escape' && secOn) return setSection(false);
    if (e.target.closest?.('input, textarea')) return;
    if (e.key === '?') return setHelp(!helpCard.classList.contains('on'));
    if (e.key === 'Escape' && helpCard.classList.contains('on')) return setHelp(false);
    if (guide.mode &&(e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest?.('input, textarea')) {
      e.preventDefault();
      return e.key === 'ArrowRight' ? guide.next() : setMode(guide.mode, guide.n - 1);
    }
    if (e.key !== 'Escape') return;
    if (solo.part) deselect();
    else if (focus >= 0) focusOn(-1);
  });

  // --- hover and click
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointer = null;
  let hovered = null;
  let lastOl = '';
  let olVer = 0; // the outline's change counter for the change check (lastOl is text: a string never compares as unchanged)
  let guideLab = false; // the name card is the guided step's label, not a pointer hover
  let bodyC = null;
  let pickDirty = true;
  let lastPick = null;
  const anchor = new THREE.Vector3();
  const setNdc = (e) => ndc.set((e.clientX / S.size.w) * 2 - 1, -(e.clientY / S.size.h) * 2 + 1);
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointer = {x: e.clientX, y: e.clientY};
    pickDirty = true;
    setNdc(e);
  });
  canvas.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && ((pointer = null), (pickDirty = true)));
  function pick() {
        ray.setFromCamera(ndc, camera);
    for (const h of ray.intersectObjects(meshes, false)) {
      const root = h.object.userData.partRoot;
      if (!root) continue;
      const p = partOf[root.userData.part];
      if (solo.part && solo.T.to > 0) {
        if (p === solo.part) return root;
        continue;
      }
      if (dim[parts.indexOf(p)] > 0.4 || !root.visible || (secOn && CLIP.distanceToPoint(h.point) < 0)) continue;
      anchor.copy(root.worldToLocal(h.point.clone()));
      return root;
    }
    return null;
  }
  let down = null;
  // two fingers on a held part zoom it (the wheel's twin)
  const fingers = new Map();
  let pinch = null;
  const gap = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
  canvas.addEventListener('pointerdown', (e) => {
    fingers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (fingers.size === 2 && solo.part && solo.T.to > 0) return (pinch = {d: gap(), z: solo.zoom}), (solo.drag = null), (down = null);
    down = {x: e.clientX, y: e.clientY, t: performance.now()};
    setNdc(e);
    if (solo.part && solo.T.to > 0) {
      // dragging anywhere on the view turns the part out in front; a tap off it sends it home (pointerup)
      solo.drag = {id: e.pointerId, x: e.clientX, y: e.clientY};
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  });
  const axY = new THREE.Vector3(), axX = new THREE.Vector3(), qd = new THREE.Quaternion();
  canvas.addEventListener('pointermove', (e) => {
    if (fingers.has(e.pointerId)) fingers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pinch && fingers.size === 2) {
      solo.zoom = THREE.MathUtils.clamp(pinch.z * (gap() / pinch.d), 0.35, 5);
      lastInput = performance.now();
    }
    if (!solo.drag || e.pointerId !== solo.drag.id) return;
    const dx = e.clientX - solo.drag.x, dy = e.clientY - solo.drag.y;
    solo.drag.x = e.clientX;
    solo.drag.y = e.clientY;
    axY.set(0, 1, 0);
    axX.setFromMatrixColumn(camera.matrixWorld, 0);
    solo.spin.premultiply(qd.setFromAxisAngle(axY, dx * SPIN)).premultiply(qd.setFromAxisAngle(axX, dy * SPIN));
    lastInput = performance.now();
  });
  canvas.addEventListener('wheel', (e) => {
    if (!(solo.part && solo.T.to > 0)) return;
    e.preventDefault();
    solo.zoom = THREE.MathUtils.clamp(solo.zoom * Math.exp(-e.deltaY * 0.0015), 0.35, 5);
    lastInput = performance.now();
  }, {passive: false});
  const lift = (e) => (fingers.delete(e.pointerId), fingers.size < 2 && (pinch = null));
  canvas.addEventListener('pointercancel', lift);
  canvas.addEventListener('pointerup', (e) => {
    lift(e);
    solo.drag = null;
    if (!down) return;
    const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 500;
    down = null;
    if (!tap) return;
    setNdc(e);
    const h = pick();
    if (solo.part && solo.T.to > 0) {
      if (!h) deselect();
      return;
    }
    if (h) select(h.userData.part);
  });

  const cardPos = {side: 'r'};
  function setHover(h) {
    if (h === hovered) return;
    hovered = h;
    cardPos.side = 'r';
    card.classList.toggle('show', !!h);
    if (h) {
      const i = info(h.userData.part);
      card.children[0].textContent = nameOf(h.userData.part);
      card.children[1].textContent = `${nn(groupIndex(i.group))} · ${GROUPS[groupIndex(i.group)].label}`;
    }
  }
  const hoverPts = [];
  let hoverOf = null;
  const hv = new THREE.Vector3();
  const hInv = new THREE.Matrix4();
  function partBounds() {
    hovered.updateWorldMatrix(true, true);
    if (hoverOf !== hovered) {
      hoverOf = hovered;
      hoverPts.length = 0;
      hInv.copy(hovered.matrixWorld).invert();
      hovered.traverse((o) => o.isMesh && hullOf(o).forEach((p) => hoverPts.push(p.clone().applyMatrix4(o.matrixWorld).applyMatrix4(hInv))));
    }
    const B = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};
    for (const p of hoverPts) {
      hv.copy(p).applyMatrix4(hovered.matrixWorld).project(camera);
      if (hv.z > 1) continue;
      const x = (hv.x * 0.5 + 0.5) * S.size.w;
      const y = (-hv.y * 0.5 + 0.5) * S.size.h;
      B.x0 = Math.min(B.x0, x); B.x1 = Math.max(B.x1, x); B.y0 = Math.min(B.y0, y); B.y1 = Math.max(B.y1, y);
    }
    return B;
  }
  // run 14 (item 10): in the guided modes the step's name label sits where it covers 0 px of the carburetor (every carburetor mesh
  // drawn: the body, the parts left on it, the hovering parts and the tray). The carburetor's silhouette is drawn flat white at a
  // quarter of the screen's size into a small target (the shadow pass and the lights left alone), its summed-area table tells every
  // candidate rectangle in the usable area whether it touches a white pixel, and the nearest free one to the part's hit point wins.
  const maskRT = new THREE.WebGLRenderTarget(8, 8), maskMat = new THREE.MeshBasicMaterial({color: 0xffffff}), maskCol = new THREE.Color();
  const MASK = {key: '', w: 0, h: 0, sat: null};
  function carbMask() {
    camera.updateMatrixWorld();
    const key = [S.size.w, S.size.h, ...camera.matrixWorld.elements.map((v) => v.toFixed(3)), poseKey.toFixed(4), guide.mode, guide.n, ...meshes.map((m) => (m.visible ? 1 : 0))].join();
    if (key === MASK.key) return MASK;
    const sc = 0.25, w = Math.max(8, Math.round(S.size.w * sc)), h = Math.max(8, Math.round(S.size.h * sc));
    maskRT.setSize(w, h);
    const R = S.renderer, hid = [];
    scene.children.forEach((o) => o !== carb && !o.isLight && o.visible && (hid.push(o), (o.visible = false)));
    const bg = scene.background, oldRT = R.getRenderTarget(), oldA = R.getClearAlpha(), sm = R.shadowMap.enabled;
    R.getClearColor(maskCol);
    const oc = maskCol.getHex();
    scene.background = null;
    scene.overrideMaterial = maskMat;
    R.shadowMap.enabled = false;
    R.setRenderTarget(maskRT);
    R.setClearColor(0x000000, 1);
    R.clear();
    R.render(scene, camera);
    const buf = new Uint8Array(w * h * 4);
    R.readRenderTargetPixels(maskRT, 0, 0, w, h, buf);
    R.setRenderTarget(oldRT);
    R.setClearColor(oc, oldA);
    R.shadowMap.enabled = sm;
    scene.overrideMaterial = null;
    scene.background = bg;
    hid.forEach((o) => (o.visible = true));
    const sat = new Int32Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += buf[((h - 1 - y) * w + x) * 4] > 100 ? 1 : 0; // the target's rows run bottom to top
        sat[(y + 1) * (w + 1) + x + 1] = sat[y * (w + 1) + x + 1] + row;
      }
    }
    Object.assign(MASK, {key, w, h, sat, sc});
    return MASK;
  }
  /** The free spot (card top-left, px) nearest the hit point a: {x, y}, or null when the mask is empty of room. */
  function freeSpot(cw, ch, a, U) {
    const M = carbMask(), sc = M.sc, P = 8, E = 8;
    const hit = (x, y) => {
      const x0 = Math.max(0, Math.floor((x - P) * sc)), x1 = Math.min(M.w, Math.ceil((x + cw + P) * sc)), y0 = Math.max(0, Math.floor((y - P) * sc)), y1 = Math.min(M.h, Math.ceil((y + ch + P) * sc));
      const q = M.w + 1;
      return M.sat[y1 * q + x1] - M.sat[y0 * q + x1] - M.sat[y1 * q + x0] + M.sat[y0 * q + x0];
    };
    let best = null;
    for (let y = U.t + E; y <= U.b - ch - E; y += 6) {
      for (let x = U.l + E; x <= U.r - cw - E; x += 6) {
        const c = hit(x, y);
        const d = Math.hypot(x + cw / 2 - a.x, y + ch / 2 - a.y);
        if (!best || c < best.c || (c === best.c && d < best.d)) best = {x, y, c, d};
      }
    }
    return best;
  }
  /** Name card 40 px clear of the part's screen bounds; the leader runs from the hit point into the card's near edge. */
  function drawLeader() {
    camera.updateMatrixWorld();
    const a = S.project(hovered.localToWorld(anchor.clone()));
    const B = partBounds();
    if (!(B.x1 > B.x0)) Object.assign(B, {x0: a.x, x1: a.x, y0: a.y, y1: a.y});
    // run 23 (item 7): the name card keeps clear of the open side panel (docked beside the view, or opened over it when wide enough to matter)
    const pr = panel.offsetParent ? panel.getBoundingClientRect() : null;
    const cw = card.offsetWidth, ch = card.offsetHeight, W = pr && pr.left > 0.5 * S.size.w ? pr.left : S.size.w, H = S.size.h, G = 42, E = 8;
    if (guideLab) {
      const spot = freeSpot(cw, ch, a, usable());
      if (spot) {
        const cx = Math.min(spot.x + cw, Math.max(spot.x, a.x)), cy = Math.min(spot.y + ch, Math.max(spot.y, a.y));
        const ex = a.x < spot.x ? spot.x : a.x > spot.x + cw ? spot.x + cw : cx, ey = a.y < spot.y ? spot.y : a.y > spot.y + ch ? spot.y + ch : cy;
        card.classList.toggle('flip', spot.x + cw / 2 < a.x);
        card.style.transform = `translate(${spot.x.toFixed(1)}px, ${spot.y.toFixed(1)}px)`;
        lLine.setAttribute('points', `${a.x.toFixed(1)},${a.y.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`);
        for (const c of [lDot, lHalo]) (c.setAttribute('cx', a.x), c.setAttribute('cy', a.y));
        const vis = a.visible ? 'visible' : 'hidden';
        for (const c of [lLine, lDot, lHalo]) c.setAttribute('visibility', vis);
        return;
      }
    }
    const lift = W < 720 ? 20 : 32;
    const fits = {r: B.x1 + G + cw <= W - E, l: B.x0 - G - cw >= E, t: B.y0 - G - ch >= E, b: B.y1 + G + ch <= H - E};
    const room = {r: W - E - B.x1 - cw, l: B.x0 - E - cw, t: B.y0 - E - ch, b: H - E - B.y1 - ch};
    // a guided step's card goes on the side away from the carburetor body, else above or below, never across it
    let order = ['r', 'l', 't', 'b'];
    if (guideLab) {
      bodyC ??= new THREE.Box3().setFromObject(partOf['1'].obj).getCenter(new THREE.Vector3());
      const away = (B.x0 + B.x1) / 2 >= S.project(bodyC).x ? 'r' : 'l';
      // above or below: on the side away from the part's seat, so the card never covers the seat
      const p = partOf[hovered.userData.part];
      const sy = p?.seat ? S.project(carb.localToWorld(p.seat.clone())).y : -Infinity;
      order = [away, sy < (B.y0 + B.y1) / 2 ? 'b' : 't', away === 'r' ? 'l' : 'r'];
      // above / below must also clear the header and the dock
      const U = usable();
      fits.t = fits.t && B.y0 - G - ch >= U.t;
      fits.b = fits.b && B.y1 + G + ch <= U.b;
      if (!order.some((k) => fits[k])) fits[order.slice().sort((p, q) => room[q] - room[p])[0]] = true;
    }
    const side = fits[cardPos.side] && order.includes(cardPos.side) ? cardPos.side : order.find((k) => fits[k]) || Object.keys(room).sort((p, q) => room[q] - room[p])[0];
    cardPos.side = side;
    const cl = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    let x, y, pts;
    if (side === 'r' || side === 'l') {
      x = side === 'r' ? B.x1 + G : B.x0 - G - cw;
      y = cl(a.y - lift - ch / 2, E, H - ch - E);
      const cy = y + ch / 2;
      pts = [[a.x, a.y], [side === 'r' ? B.x1 + 14 : B.x0 - 14, cy], [side === 'r' ? x : x + cw, cy]];
    } else {
      y = side === 't' ? B.y0 - G - ch : B.y1 + G;
      x = cl(a.x - cw / 2, E, W - cw - E);
      const cx = x + cw / 2;
      pts = [[a.x, a.y], [cx, side === 't' ? B.y0 - 14 : B.y1 + 14], [cx, side === 't' ? y + ch : y]];
    }
    card.classList.toggle('flip', side === 'l');
    card.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    lLine.setAttribute('points', pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' '));
    for (const c of [lDot, lHalo]) (c.setAttribute('cx', a.x), c.setAttribute('cy', a.y));
    const vis = a.visible ? 'visible' : 'hidden';
    for (const c of [lLine, lDot, lHalo]) c.setAttribute('visibility', vis);
  }

  // --- the floor follows the lowest part down as the carburetor comes apart
    let floorKey = NaN;
  let carbFloor = FLOOR_Y;
  let poseKey = NaN; // changes only when a carburetor part moves (the shadow pass follows it)
  function placeFloor() {
    poseKey = st.explode + mixT.v * 7 + wT.reduce((s, T) => s + T.v, 0) * 13 + hT.reduce((s, T) => s + T.v, 0) * 23;
    if (floorKey === poseKey) return;
    floorKey = poseKey;
    let lo = Infinity;
    for (const p of subjectPts(carb)) lo = Math.min(lo, p.y);
    carbFloor = Math.min(FLOOR_Y, lo - 0.5 * MM);
    S.floor.position.y = carbFloor;
  }

  // --- the solo part's transform: from its pose (w 0) to the centre of the usable area in front of the camera (w 1)
  const mW = new THREE.Matrix4(), mP = new THREE.Matrix4(), mT = new THREE.Matrix4();
  const qW = new THREE.Quaternion(), sW = new THREE.Vector3(), pW = new THREE.Vector3(), pS = new THREE.Vector3(), cW = new THREE.Vector3(), pP = new THREE.Vector3();
  function placeSolo(w) {
    const p = solo.part;
    const o = p.obj;
    o.parent.updateMatrixWorld(true);
    o.updateMatrix();
    mW.multiplyMatrices(o.parent.matrixWorld, o.matrix);
    mW.decompose(pW, qW, sW);
    cW.copy(solo.c).applyMatrix4(mW); // the part's centre where it sits now
    // target: the usable area's centre, at 55% of the camera's distance to its target
    const U = usable();
    const nx = ((U.l + U.r) / 2 / S.size.w) * 2 - 1, ny = 1 - ((U.t + U.b) / 2 / S.size.h) * 2;
    camera.updateMatrixWorld();
    const dir = new THREE.Vector3(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
    const D = 0.55 * camera.position.distanceTo(controls.target);
    pS.copy(camera.position).addScaledVector(dir, D);
    const hh = D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // the camera rule: the part as it faces the camera now fills 78% of the usable area; capped so that a spin
    // keeps it (its bounding sphere) within the usable area's longer side
    const uw = 2 * hh * camera.aspect * ((U.r - U.l) / S.size.w), uh = 2 * hh * ((U.b - U.t) / S.size.h);
    axX.setFromMatrixColumn(camera.matrixWorld, 0);
    axY.setFromMatrixColumn(camera.matrixWorld, 1);
    let ex0 = Infinity, ex1 = -Infinity, ey0 = Infinity, ey1 = -Infinity;
    for (const v of solo.pts) {
      const r = pP.copy(v).multiply(sW).applyQuaternion(qW);
      const a = r.dot(axX), b = r.dot(axY);
      ex0 = Math.min(ex0, a); ex1 = Math.max(ex1, a); ey0 = Math.min(ey0, b); ey1 = Math.max(ey1, b);
    }
    const s = solo.zoomV * THREE.MathUtils.clamp(Math.min(0.78 * Math.min(uw / Math.max(ex1 - ex0, 1e-3), uh / Math.max(ey1 - ey0, 1e-3)), Math.max(uw, uh) / (2 * solo.r * sW.x)), 0.3, 80);
    const k = ease(w);
    const sc = 1 + (s - 1) * k;
    const q = qW.clone().slerp(solo.spin.clone().multiply(qW), k);
    const c = cW.lerp(pS, k);
    // world = T(c) R(q) S(sc) T(-centre)
    mT.compose(c, q, new THREE.Vector3(sc, sc, sc)).multiply(mP.makeTranslation(-solo.c.x, -solo.c.y, -solo.c.z));
    mT.premultiply(mP.copy(o.parent.matrixWorld).invert());
    mT.decompose(o.position, o.quaternion, o.scale);
  }

  // --- resize and the first camera
  addEventListener('resize', () => {
    S.resize();
    autoKey = '';
  });
  S.resize();
  poseAll(st.explode);
  placeFloor();
  const hero = frame(carb, HERO_DIR, 1, ground());
  camera.position.copy(hero.p);
  controls.target.copy(hero.t);
  controls.update();

  const perf = q.has('perf') ? createPerf(S, {gpu, marks: MARKS, floor: S.floor, parts: meshes, onGpu: (id, ms) => { const f = cpuOf.get(id); if (f) cpuOf.delete(id), sample(f.at, Math.max(f.cpu, ms), f.epoch); }}) : null;
  const still = q.has('still');
  let prev = performance.now();
  let lastE = NaN;
  let lastSolo = '|0';
  let lastSig = null;
  let lastCam = null;
  let swaying = false;
  let autoKey = '';
  let autoCam = null;
  let lastExF = NaN;
  // adaptive quality judges render time (GPU timer query, else the CPU time of the call), never frame spacing:
  // a median over 20 ms across 1 s of drawn frames drops one step; never back up in this visit
  const tq = !perf && gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const inflight = [];
  const cpuOf = new Map();
  const cost = [];
  const STEP = {ssao: 'no SSAO', reflection: 'no reflection', shadowmap: 'shadow map 1024', dpr: 'DPR 1', shadows: 'no shadows'};
  const sample = (at, ms, e) => {
    if (e !== epoch || !window.__READY || still) return;
    cost.push([at, ms]);
    while (cost[0][0] < at - 1000) cost.shift();
    if (cost.length < 8 || at - cost[0][0] < 900) return;
    const med = cost.map((c) => c[1]).sort((a, b) => a - b)[cost.length >> 1];
    if (med <= 20) return;
    const k = S.degrade();
    if (k) dropped.push(STEP[k]), setHint();
    epoch++;
    cost.length = 0;
  };
  const pollCost = () => {
    while (inflight.length && (inflight.length > 6 || gl.getQueryParameter(inflight[0].q, gl.QUERY_RESULT_AVAILABLE))) {
      const f = inflight.shift();
      const ready = gl.getQueryParameter(f.q, gl.QUERY_RESULT_AVAILABLE);
      const gpuMs = ready && !gl.getParameter(tq.GPU_DISJOINT_EXT) ? gl.getQueryParameter(f.q, gl.QUERY_RESULT) / 1e6 : 0;
      gl.deleteQuery(f.q);
      sample(f.at, Math.max(f.cpu, gpuMs), f.epoch);
    }
  };
  let tag = 0;
  // the change check: anything that animates is in here, or it freezes
  // every tween at its target and the camera arrived (the scripted check of the guided modes reads this)
  const settled = () => !view.follow && [mixT, ...wT, ...trT, ...hT, ...dimT, ...rimT, selT].every((T) => Math.abs(T.v - T.to) < 1e-6);
  const sigOf = () => [st.explode, secOn ? 1 : 0, S.size.w, S.size.h, TIERS.indexOf(S.tier), Object.keys(S.cut).length, hovered ? hovered.id : -1, hvT.v, solo.T.v, solo.zoomV, selT.v, ...solo.spin.toArray(), solo.part ? solo.part.obj.id : -1, S.floor.position.y, ...dim, ...rimT.map((t) => t.v), mixT.v, ...wT.map((t) => t.v), ...trT.map((t) => t.v), ...hT.map((t) => t.v), olVer];
  const camOf = () => [...camera.position.toArray(), ...camera.quaternion.toArray(), camera.aspect];
  const same = (a, b, eps) => !!a && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < eps);

  const tick = (now) => {
    const raw = now - prev;
    if (swaying && raw < 30 && !still) return requestAnimationFrame(tick); // idle: 30 fps
    const dt = Math.min(0.05, raw / 1000);
    prev = now;
    if (exDrag) hold(exT, st.target);
    else aim(exT, st.target, now, 0.35 + 0.55 * Math.abs(st.target - exT.v));
    st.explode = stepT(exT, now);
    out.value = st.explode.toFixed(2);
    range.style.setProperty('--p', `${(st.explode * 100).toFixed(1)}%`);
    stepT(mixT, now);
    wT.forEach((T) => stepT(T, now));
    trT.forEach((T) => stepT(T, now)); // run 15 (item 9): the tray tweens were never stepped, so a part only reached the tray on entering a mode
    poseAll(st.explode);
    placeFloor();
    placeDashes();
    // solo: the selected part flies forward; once home again it is released
    stepT(solo.T, now);
    solo.zoomV = Math.abs(solo.zoom - solo.zoomV) < 1e-4 ? solo.zoom : solo.zoomV + (solo.zoom - solo.zoomV) * 0.3;
    if (solo.part && solo.T.v <= 0 && solo.T.to === 0) solo.part = null;
    if (solo.part) placeSolo(solo.T.v);

    turnRig();
    // dimming: a selection dims every other part; a pill dims every other group
    const sel = solo.part && solo.T.to > 0 ? solo.part : null;
    aim(selT, sel ? 1 : 0, now);
    const selV = stepT(selT, now);
    const floor = 0.5 - 0.4 * selV; // the rest of the carburetor fades to 10% opacity
    parts.forEach((p, i) => {
      aim(dimT[i], sel ? (p === sel ? 0 : 1) : guide.mode ? 0 : focus >= 0 && p.asm !== asms[focus] ? 1 : 0, now);
      aim(rimT[i], sel ? (p === sel ? SOLO_TRIM : 0) : guide.mode ? gRim[i] : focus >= 0 && p.asm === asms[focus] ? 1 : 0, now); // run 16 (item 4, correction 35): a clicked part gets no +15% lift but a trim: with no neighbours to shade it the casting read 56-59% against 40-43% in the assembly, now 47-51% on HIGH (blown 0%)
      dim[i] = stepT(dimT[i], now);
      const r = stepT(rimT[i], now);
      let hd = stepT(hT[i], now);
      // run 23 (item 6): a part in the bench tray fades to 0% while another part is clicked alone (the other parts stay at 10%)
      if (sel && p !== sel && p.tray) hd = 1 - (1 - hd) * (1 - selV * trT[p.k].v);
      Asm.setLook(p, dim[i] < 0.004 ? 0 : dim[i], Math.abs(r) < 0.004 ? 0 : r, hd < 0.004 ? 0 : hd, floor);
    });
    const fl = 1 + 0.3 * THREE.MathUtils.smoothstep(st.explode, 0.5, 0.8);
    S.cool.intensity = 0.25 * S.key.intensity * fl; // the cool fill keeps 25% of the key
    S.fill.intensity = 0.35 * fl;
    S.under.intensity = 0.35 * fl;

    // camera: the visitor's (orbiting) or the framing rule (auto); held still while a part is out
    const idle = !still && !sel && now - lastInput > 5000;
    controls.enabled = !sel;
    const exMoving = Math.abs(st.explode - lastExF) > 1e-6;
    lastExF = st.explode;
    if (view.user && idle) flyTo(1.6);
    if (view.user && exMoving) {
      view.user = false;
      view.base = camera.position.clone().sub(controls.target).normalize();
      followFrom(0.5);
    }
    if (view.user) controls.update(dt);
    else if (!sel || exMoving) {
      aim(view.env, idle && !view.base ? 1 : 0, now);
      stepT(view.env, now);
      view.phase = view.env.v > 0 ? view.phase + (dt * 2 * Math.PI) / SWAY_P : 0;
      const key = [st.explode, focus, view.phase, view.env.v, S.size.w, S.size.h, view.base ? view.base.toArray() : 0, detail.classList.contains('show'), guide.mode, guide.n].join();
      if (key !== autoKey || !autoCam) {
        // guided: framed where the parts are going, not where they are on the way
        if (guide.mode) poseAll(st.explode, true);
        autoCam = frame(autoSubject(), autoDir(), 1, autoKeep(), autoLoose());
        if (guide.mode) {
          poseAll(st.explode);
          if (solo.part) placeSolo(solo.T.v);
        }
      }
      autoKey = key;
      let cm = autoCam;
      if (view.follow) {
        const w = ease(clamp01((now - view.follow.t0) / view.follow.dur));
        cm = blend(view.follow.from, autoCam, w);
        if (w >= 1) view.follow = null;
      }
      controls.target.copy(cm.t);
      camera.position.copy(cm.p);
      camera.lookAt(cm.t);
    }

    // hover outline + name card
    const ph = pointer ? (pickDirty ? (lastPick = pick()) : lastPick) : null;
    pickDirty = false; // the raycast reruns after the pointer moves or a frame is drawn
    // guided: the step's parts keep the brass outline and the first one carries the name card
    const gOut = sel ? [] : guide.mode ? curParts().map((p) => p.obj).filter((o) => o.visible) : [];
    const gLab = gOut[0] || null;
    if (!ph && gLab && hovered !== gLab) anchor.copy(gLab.worldToLocal(new THREE.Box3().setFromObject(gLab).getCenter(new THREE.Vector3())));
    setHover(sel ? null : ph || (S.size.w < 480 ? null : gLab)); // run 15 (item 10): on a phone the step panel names the part (its first button), no 3D label over the carburetor
    guideLab = !ph && !!gLab && hovered === gLab;
    const olKey = [hovered, ...gOut].map((o) => o?.id).join();
    if (olKey !== lastOl) S.select([hovered, ...gOut].filter((o, k, a) => o && a.indexOf(o) === k)), (lastOl = olKey), olVer++;
    canvas.style.cursor = solo.drag ? 'grabbing' : sel && ph ? 'grab' : ph ? 'pointer' : '';
    aim(hvT, hovered || gOut.length ? 1 : 0, now);
    S.outline.edgeStrength = 4.5 * stepT(hvT, now);
    lead.classList.toggle('show', !!hovered);
    if (hovered) drawLeader();
    drawTrayUI();

    // shadows follow the parts, not the camera: re-rendered when the explode moves, and once when a solo move
    // settles (never every frame while a part flies or spins: that pass alone would pass the 350k triangle budget)
    const soloKey = `${solo.part ? solo.part.id : ''}|${solo.T.to}`;
    const settled = solo.T.v === solo.T.to;
    if (Math.abs(poseKey - lastE) > 1e-5 || Number.isNaN(lastE) || (settled && soloKey !== lastSolo)) {
      S.renderer.shadowMap.needsUpdate = true;
      lastE = poseKey;
      if (settled) lastSolo = soloKey;
    }
    const sg = sigOf();
    const cm = camOf();
    const moved = !same(lastSig, sg, 1e-6);
    const camMoved = !same(lastCam, cm, 1e-5);
    const draw = moved || camMoved || still;
    swaying = !moved && camMoved && view.env.v > 0 && !view.follow && !view.user;
    if (!draw) return requestAnimationFrame(tick);
    pickDirty = true;
    lastSig = sg;
    lastCam = cm;
    perf?.frameStart();
    const t0 = performance.now();
    const gq = tq && gl.createQuery();
    if (gq) gl.beginQuery(tq.TIME_ELAPSED_EXT, gq);
    S.render();
    if (gq) gl.endQuery(tq.TIME_ELAPSED_EXT);
    const cpu = performance.now() - t0;
    if (gq) inflight.push({q: gq, cpu, at: now, epoch}), pollCost();
    else if (perf) cpuOf.set(++tag, {cpu, at: now, epoch}), cpuOf.size > 16 && cpuOf.delete(cpuOf.keys().next().value);
    else sample(now, cpu, epoch);
    if (!window.__READY) {
      MARKS.shaders ??= performance.now();
      MARKS.first = performance.now();
      setTimeout(() => warmTransparent(), 300);
      window.__READY = true;
      window.__STATS = {meshes: meshes.length, parts: parts.length, refs: new Set(parts.map((p) => p.id.split('-')[0])).size, tris: S.renderer.info.render.triangles, calls: S.renderer.info.render.calls, tier: S.tier, firstMs: Math.round(MARKS.first)};
    }
    perf?.frameEnd(now, tag);
    requestAnimationFrame(tick);
  };
  /** After the first frame: the transparent variant of every part material (dimming), compiled in the background. */
  function warmTransparent(groups = asms.map((a) => a.group)) {
    const g = groups.shift();
    if (!g) {
      if (S.tier === 'low') return;
      const keep = S.outline.selectedObjects;
      S.outline.selectedObjects = [parts[0].obj];
      S.outline.render(S.renderer, S.composer.writeBuffer, S.composer.readBuffer, 0, false);
      S.outline.selectedObjects = keep;
      return;
    }
    const mats = new Set();
    g.traverse((o) => o.isMesh && [o.material].flat().forEach((m) => !m.transparent && mats.add(m)));
    const flip = (t) => mats.forEach((m) => ((m.transparent = t), (m.needsUpdate = true)));
    flip(true);
    compile(g);
    flip(false);
    setTimeout(() => warmTransparent(groups), 60);
  }
  await Promise.all(jobs);
  MARKS.shaders = performance.now();
  load.remove();
  if (MODES[q.get('mode')]) setMode(q.get('mode'), Number(q.get('step')) || 1);
  if (q.has('sel')) select(q.get('sel'));
  requestAnimationFrame(tick);
  window.VENTURI = {THREE, trayLay, trayT: (p) => trT[p.k].v, MODES, settled, asms, parts, st, focusOn, select, deselect, setMode, guide, camera, S, controls, frame, usable, solo, fit: fitNow, get hovered() { return hovered; }};
}

main().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="color:#e66;position:fixed;left:16px;top:80px">${e.stack || e}</pre>`);
});
