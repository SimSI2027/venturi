// ?perf=1: load milestones, per-pass GPU ms (EXT_disjoint_timer_query_webgl2), draw calls,
// triangles and the WebGL renderer string, in a small overlay and on window.__PERF.
// Passes are timed as segments on one stack: a nested pass ends its parent's query and the parent
// resumes in a new one afterwards (WebGL allows one TIME_ELAPSED query at a time).
export function createPerf(S, {gpu, marks, floor, parts, onGpu}) {
  const {renderer, composer} = S;
  const gl = renderer.getContext();
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  renderer.info.autoReset = false;
  const stack = [];
  let fq = [];
  const pending = [];
  const N = 120;
  const hist = {}; // name -> last N frames of ms
  const cpu = [];
  const drawn = []; // timestamps of drawn frames, last second
  const top = () => stack[stack.length - 1];
  const begin = (name) => {
    if (!ext) return;
    const q = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, q);
    fq.push({q, name});
  };
  const end = () => ext && gl.endQuery(ext.TIME_ELAPSED_EXT);
  const push = (name) => (stack.length && end(), stack.push(name), begin(name));
  const pop = () => (end(), stack.pop(), stack.length && begin(top()));
  const wrap = (o, k, name, guard = () => true) => {
    const f = o[k];
    o[k] = function (...a) {
      if (!guard.call(this)) return f.apply(this, a);
      if (top() === 'x-ray') pop();
      push(name);
      const r = f.apply(this, a);
      pop();
      return r;
    };
  };
  const sm = renderer.shadowMap;
  wrap(sm, 'render', 'shadows', function () { return this.enabled && (this.autoUpdate || this.needsUpdate); });
  wrap(floor, 'onBeforeRender', 'reflection');
  const names = ['main', 'ssao', 'bloom', 'outline', 'post', 'post'];
  composer.passes.forEach((p, i) => i > 0 && wrap(p, 'render', names[i] || 'post'));
  wrap(S, 'render', 'main');
  // x-ray: the transparent queue of the gun's parts, inside the main pass
  for (const o of parts) {
    o.onBeforeRender = (r, sc, cam, geo, mat) => {
      if (mat.transparent && top() === 'main') push('x-ray');
      else if (!mat.transparent && top() === 'x-ray') pop();
    };
  }

  const box = document.createElement('pre');
  box.className = 'iw-perf';
  box.style.cssText = 'position:fixed;right:12px;top:12px;z-index:50;margin:0;padding:10px 12px;font:11px/1.45 ui-monospace,Consolas,monospace;color:#d8c9a3;background:rgba(8,9,11,0.82);border:1px solid #3a3326;pointer-events:none;white-space:pre';
  document.body.appendChild(box);
  const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);
  let prev = 0;
  let shown = 0;
  const P = (window.__PERF = {reset: () => (Object.keys(hist).forEach((k) => delete hist[k]), (cpu.length = 0), (prev = 0)), renderer: gpu, timer: !!ext, marks, pass: {}, gpuMs: 0, frameMs: 0, calls: 0, tris: 0, size: ''});
  function poll() {
    while (pending.length) {
      const f = pending[0];
      if (f.length && !gl.getQueryParameter(f[f.length - 1].q, gl.QUERY_RESULT_AVAILABLE)) break;
      pending.shift();
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
      const sums = {};
      for (const {q, name} of f) {
        if (!disjoint) sums[name] = (sums[name] || 0) + gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6;
        gl.deleteQuery(q);
      }
      if (disjoint) continue;
      onGpu?.(f.tag, Object.values(sums).reduce((a, v) => a + v, 0));
      for (const k of new Set([...Object.keys(hist), ...Object.keys(sums)])) {
        (hist[k] ||= []).push(sums[k] || 0);
        if (hist[k].length > N) hist[k].shift();
      }
    }
  }
  return {
    frameStart() {
      renderer.info.reset();
    },
    frameEnd(now, tag) {
      if (prev) cpu.push(now - prev), cpu.length > N && cpu.shift();
      prev = now;
      drawn.push(now);
      while (drawn[0] < now - 1000) drawn.shift();
      if (ext) (fq.tag = tag), pending.push(fq), (fq = []), poll();
      P.calls = renderer.info.render.calls;
      P.tris = renderer.info.render.triangles;
      if (now - shown < 500) return;
      shown = now;
      P.pass = Object.fromEntries(Object.entries(hist).map(([k, v]) => [k, +avg(v).toFixed(3)]));
      P.gpuMs = +Object.values(P.pass).reduce((s, v) => s + v, 0).toFixed(3);
      P.frameMs = +avg(cpu).toFixed(2);
      P.frameMax = +Math.max(0, ...cpu).toFixed(1);
      P.programs = renderer.info.programs.length;
      P.drawnPerS = drawn.length;
      P.size = `${gl.drawingBufferWidth}x${gl.drawingBufferHeight}`;
      P.tier = S.tier;
      P.cut = Object.keys(S.cut).join('+') || 'none';
      const ms = (v) => (v == null ? '-' : v.toFixed(0)).padStart(6) + ' ms';
      box.textContent =
        `VENTURI perf · ${S.tier} · ${P.size}\n` +
        [['script parsed', marks.parsed], ['textures built', marks.textures], ['shaders compiled', marks.shaders], ['first frame', marks.first]].map(([k, v]) => k.padEnd(17) + ms(v)).join('\n') + '\n\n' +
        (ext ? ['shadows', 'main', 'reflection', 'ssao', 'bloom', 'x-ray', 'outline', 'post'].map((k) => `${k.padEnd(11)}${(P.pass[k] || 0).toFixed(2).padStart(6)} ms`).join('\n') + `\n${'GPU total'.padEnd(11)}${P.gpuMs.toFixed(2).padStart(6)} ms` : 'no GPU timer query') +
        `\nframe      ${P.frameMs.toFixed(1).padStart(6)} ms (max ${P.frameMax}) · ${P.drawnPerS} drawn/s\nprograms ${P.programs}\n\ndraws ${P.calls} · tris ${P.tris}\n${gpu}`;
    },
  };
}
