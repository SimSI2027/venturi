// The studio: dark charcoal room, RoomEnvironment PMREM, soft key from upper left, cool rim,
// soft contact shadow on a faint glossy floor, ACES, brass hover outline, subtle vignette.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {OutlinePass} from 'three/addons/postprocessing/OutlinePass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {FullScreenQuad} from 'three/addons/postprocessing/Pass.js';
import {CopyShader} from 'three/addons/shaders/CopyShader.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {setEnvironment, grainAniso, LOOK} from './lib/materials.js';

// The background is a CSS gradient (#15171c -> #07080a) behind a transparent canvas, so its
// colours are exact on both tiers; the floor fades to transparent into it.
// the floor sits 3.5 cm under the gun's lowest point (the stock's toe, y -18.5) so its contact shadow and
// reflection read right under it in the default view; it sinks to FLOOR_LOW as the parts drop on explode
// Venturi: the floor sits 5 mm under the carburetor's lowest point (the hose ends); main.js lowers it under the
// exploded parts.
// Run 9: the world is in mm (1 unit = 1 mm). The carburetor's parts are still sketched in their old units and
// baked into mm at build time (kit.js toMM); every stage size below is written in those old units times MM.
export const MM = 10.66; // run 10 (correction 17): the 11.22 stretch undone; the cable cover's top edge (9.12) to the hex plug's foot (-8.87) = 191.8
export const FLOOR_Y = -12.5 * MM;

const Vignette = {
  uniforms: {tDiffuse: {value: null}, uAmount: {value: 0}, uAspect: {value: 1}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAmount; uniform float uAspect; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      // half-float overflow (Inf) on the sharpest speculars would tone-map to black specks
      if (any(isnan(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
      c.rgb = min(c.rgb, vec3(64.0));
      vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0);
      float r = length(d) / length(vec2(uAspect, 1.0) * 0.5);
      c.rgb *= 1.0 - uAmount * smoothstep(0.35, 1.05, r);
      gl_FragColor = c;
    }`,
};

// Bloom high-pass: luminance over 0.9. Every gun, shell and floor surface is soft-capped under it
// (NO_BLOOM), so only the muzzle flash, the primer spark and the hull's Burn glow can bloom.
const BRASS_HIGHPASS = `
  uniform sampler2D tDiffuse; uniform vec3 defaultColor; uniform float defaultOpacity;
  uniform float luminosityThreshold; uniform float smoothWidth; varying vec2 vUv;
  void main(){
    vec4 t = texture2D(tDiffuse, vUv);
    // a few NaN/Inf pixels in the HDR buffer are invisible on their own, but the blur would
    // smear them over the whole frame: drop them here
    if (any(isnan(t)) || any(isinf(t))) t = vec4(0.0);
    t.rgb = min(t.rgb, vec3(32.0));
    float l = dot(t.rgb, vec3(0.299, 0.587, 0.114));
    float a = smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, l);
    gl_FragColor = mix(vec4(defaultColor, defaultOpacity), t, a);
  }`;

/**
 * The scene pass draws into its own multisampled HDR target (8 samples HIGH, 4 MED, none LOW) and
 * resolves into the post chain, whose ping-pong buffers stay single-sampled (two MSAA buffers at
 * DPR 2 would cost twice the memory for nothing: only geometry edges need the samples).
 */
class MSRenderPass extends RenderPass {
  constructor(scene, camera) {
    super(scene, camera);
    this.ms = new THREE.WebGLRenderTarget(4, 4, {type: THREE.HalfFloatType, samples: 4});
    this.quad = new FullScreenQuad(new THREE.ShaderMaterial({...CopyShader, uniforms: THREE.UniformsUtils.clone(CopyShader.uniforms), blending: THREE.NoBlending, depthTest: false, depthWrite: false}));
  }
  setSamples(n) {
    if (this.ms.samples === n) return;
    this.ms.samples = n;
    this.ms.dispose();
  }
  setSize(w, h) {
    this.ms.setSize(w, h);
  }
  render(renderer, writeBuffer, readBuffer, dt, mask) {
    super.render(renderer, writeBuffer, this.ms, dt, mask);
    this.quad.material.uniforms.tDiffuse.value = this.ms.texture;
    renderer.setRenderTarget(readBuffer);
    this.quad.render(renderer);
  }
}

const REFLECT = 0.12; // the floor's mirror strength
export function createStage(canvas) {
  // every tier draws through the composer (MSAA scene pass, SMAA last), so the canvas itself needs none
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false});
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  // the light never moves: re-render (and re-blur) the shadow only when a part moves (main.js)
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  // the room's four side panels (-x, -x, +x, +z, -z; not the +y top light) at 60%, so only the
  // top-left key reads as a highlight on steel and walnut
  const room = new RoomEnvironment();
  room.traverse((o) => o.isMesh && o.material.emissiveIntensity > 0 && o.position.y < 19 && (o.material.emissiveIntensity *= 0.6));
  // run 32 (correction 74): the default; ?light=classic keeps the RoomEnvironment above. Run 30's item 15 studio of soft boxes (scratch/item15_studio.patch, C15b): a charcoal
  // room, a large overhead box, the key's box upper left in front, a tall strip at the right, a rim box behind and a floor bounce; HDR
  const studio = () => {
    const s = new THREE.Scene();
    const roomBox = new THREE.Mesh(new THREE.BoxGeometry(44, 26, 44), new THREE.MeshBasicMaterial({color: 0x5a5c61, side: THREE.BackSide}));
    roomBox.position.y = 7;
    s.add(roomBox);
    const softbox = (w, h, k, pos, tint = 0xffffff) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(tint).multiplyScalar(k), side: THREE.DoubleSide}));
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      s.add(m);
    };
    softbox(16, 11, 6, [0, 18, 1]); // overhead
    softbox(9, 13, 8, [-13, 10, 11], 0xfff4e8); // key box, upper left front
    softbox(4, 17, 4.5, [17, 5, 5], 0xf2f4f8); // strip, right
    softbox(12, 6, 3.5, [3, 9, -17]); // rim box, behind
    softbox(30, 30, 1.1, [0, -6, 0]); // floor bounce
    return s;
  };
  scene.environment = pmrem.fromScene(LOOK.studio ? studio() : room, 0.04).texture;
  setEnvironment(scene.environment);
  scene.environmentIntensity = 0.95;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.3 * MM, 1500 * MM);

  // key: soft, upper left, slightly warm
  const key = new THREE.DirectionalLight(0xfff0dd, 3.0);
  key.position.set(-40 * MM, 70 * MM, 50 * MM);
  key.target.position.set(0, -6 * MM, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {left: -40 * MM, right: 40 * MM, top: 40 * MM, bottom: -40 * MM, near: 20 * MM, far: 200 * MM});
  key.shadow.radius = 22;
  key.shadow.blurSamples = 24;
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.04 * MM;
  scene.add(key, key.target);
  // cool rim from behind
  const rim = new THREE.DirectionalLight(0xe4e4e5, 3.2); // run 8: barely cool, so silver aluminium reads neutral
  rim.position.set(90, 55, -130);
  scene.add(rim);
  // low fill so the shadow side keeps its form
  const fill = new THREE.HemisphereLight(0xbababc, 0x0c0c0e, 0.35);
  scene.add(fill);
  const under = new THREE.DirectionalLight(0xffe6c8, 0.35);
  under.position.set(30, -60, 90);
  scene.add(under);
  // cool fill from the lower right at 25% of the key (main.js keeps the ratio): lifts the receiver's side
  // wall and port edges out of black, no shadow, so it costs nothing on any tier
  const cool = new THREE.DirectionalLight(0xdcdde0, 0.75); // run 8: only just cool (no blue on silver)
  cool.position.set(90, -50, 70);
  scene.add(cool);

  // dark reflective floor (both tiers; 512 px reflection on low): a blurred planar reflection at
  // 12% that fades out within 40 cm of the gun's footprint (x -44..71, z 0), one soft elliptical
  // contact shadow centred under the gun, and a soft warm pool of light, fading to transparent
  // into the CSS background. Linear values, tone mapped like the rest.
  const floorGeo = new THREE.CircleGeometry(400 * MM, 96);
  const floorU = {
    uBase: {value: new THREE.Color(0.011, 0.012, 0.014)},
    uPool: {value: new THREE.Color(0.05, 0.042, 0.032)},
    uC: {value: new THREE.Vector2(0, 0)}, // the carburetor's centre over the floor
    uStrength: {value: REFLECT},
    uR: {value: new THREE.Vector2(45 * MM, 240 * MM)},
    uS: {value: MM}, // footprint scale: the carburetor in mm
  };
  const floorR = new Reflector(floorGeo, {
      textureWidth: 1024,
      textureHeight: 1024,
      clipBias: 0.003,
      shader: {
        name: 'IronwoodFloor',
        uniforms: {color: {value: null}, tDiffuse: {value: null}, textureMatrix: {value: null}, ...floorU},
        vertexShader: `uniform mat4 textureMatrix; varying vec4 vRefl; varying vec3 vW;
          void main(){ vRefl = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 uBase; uniform vec3 uPool; uniform vec2 uC; uniform float uStrength; uniform vec2 uR; uniform float uS;
          varying vec4 vRefl; varying vec3 vW;
          void main(){
            vec2 uv = vRefl.xy / vRefl.w; vec2 px = 1.0 / vec2(textureSize(tDiffuse, 0));
            // blur: centre plus two rings of 6 taps (3 and 6 px)
            vec3 r = texture2D(tDiffuse, uv).rgb;
            for (int k = 0; k < 6; k++) {
              float a = float(k) * 1.0472;
              vec2 o = vec2(cos(a), sin(a)) * px;
              r += texture2D(tDiffuse, uv + o * 3.0).rgb + texture2D(tDiffuse, uv + vec2(-o.y, o.x) * 6.0).rgb;
            }
            r /= 13.0;
            // the reflection fades out within 40 cm of the gun's footprint
            float gd = length(vec2(max(abs(vW.x) - 7.0 * uS, 0.0), max(abs(vW.z) - 4.0 * uS, 0.0))) / uS;
            float rm = (1.0 - smoothstep(0.0, 18.0, gd)) * step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0); // no clamped-edge smear
            vec2 d = vW.xz - uC;
            float fade = 1.0 - smoothstep(uR.x, uR.y, length(d * vec2(0.75, 1.0)));
            vec2 pq = d / (vec2(16.0, 11.0) * uS);
            float pool = exp(-dot(pq, pq) * 1.6);
            float contact = 1.0 - smoothstep(0.0, 1.0, length(d / (vec2(7.5, 5.5) * uS)));
            vec3 col = (uBase + uPool * pool) * (1.0 - 0.8 * contact);
            // a 12% mirror: the reflection is blended at uStrength in display (gamma) space, as the eye reads it;
            // added in linear light, 12% of the dark gun moved the floor by at most 4 levels
            col = pow(mix(pow(col, vec3(0.4545)), pow(r * 1.6, vec3(0.4545)), uStrength * rm), vec3(2.2));
            gl_FragColor = vec4(col, fade);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      },
    });
  floorR.material.transparent = true;
  // adaptive quality can stop the reflection render; the floor itself (base, pool, contact shadow) stays
  const reflect = floorR.onBeforeRender;
  // noReflect: objects left out of the mirror (main.js: the ATV prop, to keep its triangles to one pass)
  const noReflect = [];
  floorR.onBeforeRender = function (...a) {
    if (S.cut.reflection) return;
    const skip = S.reflectSkip ? [...noReflect, ...S.reflectSkip()] : noReflect; // main.js: the bench tray's parts (run 25)
    const vis = skip.map((o) => o.visible);
    skip.forEach((o) => (o.visible = false));
    reflect.apply(this, a);
    skip.forEach((o, i) => (o.visible = vis[i]));
  };
  floorR.renderOrder = -2;
  floorR.rotation.x = -Math.PI / 2;
  floorR.position.y = FLOOR_Y;
  scene.add(floorR);
  const catcher = new THREE.Mesh(new THREE.CircleGeometry(260 * MM, 64), new THREE.ShadowMaterial({color: 0x050506, opacity: 0.55, depthWrite: false}));
  catcher.rotation.x = -Math.PI / 2;
  catcher.position.y = FLOOR_Y + 0.05 * MM;
  catcher.receiveShadow = true;
  catcher.renderOrder = -1;
  // not added: the floor shader draws the one contact shadow (the key light's cast shadow sat
  // off to one side as a second one)

  const target = new THREE.WebGLRenderTarget(4, 4, {type: THREE.HalfFloatType});
  const composer = new EffectComposer(renderer, target);
  const scenePass = new MSRenderPass(scene, camera);
  composer.addPass(scenePass);
  // run 31 (correction 71): GTAO removed on every tier; the baked recess shading (src/lib/ao.js) is the only ambient occlusion
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.25, 0.45, 0.9);
  bloom.highPassUniforms.smoothWidth.value = 0.5;
  bloom.materialHighPassFilter.fragmentShader = BRASS_HIGHPASS;
  bloom.materialHighPassFilter.needsUpdate = true;
  composer.addPass(bloom);
  const outline = new OutlinePass(new THREE.Vector2(4, 4), scene, camera);
  outline.visibleEdgeColor.set(0xe2b65c);
  outline.hiddenEdgeColor.set(0x6b5222);
  // full resolution (not the default half), about 2 px wide; SMAA smooths it with everything else
  outline.downSampleRatio = 1;
  outline.edgeStrength = 4.5;
  outline.edgeThickness = 1.0;
  outline.edgeGlow = 0.0;
  // noOutline: left out of the outline's depth pass (main.js: the ATV prop; the outline then draws over it)
  const noOutline = [];
  const olRender = outline.render.bind(outline);
  // run 26 (item 2): the bench tray's parts also leave the depth pre-pass (they sit beside the carburetor, never in
  // front of a step's parts); at TEAR DOWN step 29 that pass drew the whole tray again, +177 draw calls a frame
  outline.render = (...args) => {
    const sel = new Set(outline.selectedObjects);
    const skip = S.outlineSkip ? [...noOutline, ...S.outlineSkip().filter((o) => !sel.has(o))] : noOutline;
    const vis = skip.map((o) => o.visible);
    skip.forEach((o) => (o.visible = false));
    olRender(...args);
    skip.forEach((o, i) => (o.visible = vis[i]));
  };
  composer.addPass(outline);
  const vig = new ShaderPass(Vignette);
  composer.addPass(vig);
  composer.addPass(new OutputPass());
  // SMAA last, on the tone-mapped sRGB image: on every tier, the only AA on LOW
  const smaa = new SMAAPass();
  composer.addPass(smaa);
  const maxSamples = renderer.getContext().getParameter(renderer.getContext().MAX_SAMPLES) || 4;

  const size = {w: 1, h: 1};
  const resize = () => {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    const pr = S.cut.dpr ? 1 : Math.min(devicePixelRatio || 1, {high: 2, med: 1.5, low: 1}[S.tier]);
    hullMat.uniforms.uK.value = (2 * 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) / h; // 2 px
    size.w = w;
    size.h = h;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    vig.uniforms.uAspect.value = w / h;
    if (S.tier) showFloors();
  };
  const v = new THREE.Vector3();
  const project = (p) => {
    v.copy(p).project(camera);
    return {x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h, visible: v.z < 1};
  };
  // --- low tier: no SSAO, bloom or outline pass; the hover outline is an inverted hull, 2 px at full resolution.
  const vigEl = document.createElement('div');
  vigEl.className = 'iw-vig on'; // one CSS vignette for both tiers (the canvas is transparent)
  canvas.after(vigEl);
  const hullMat = new THREE.ShaderMaterial({
    uniforms: {uK: {value: 0.002}, uC: {value: new THREE.Color(0xe2b65c)}},
    vertexShader: `uniform float uK; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
      mv.xyz += normalize(normalMatrix * normal) * uK * -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, 1.0);\n#include <colorspace_fragment>\n}',
    side: THREE.BackSide,
  });
  const hulls = [];
  let sel = null;
  // h: one object or a list (the hovered part plus a guided step's parts)
  const select = (h) => {
    sel = h;
    const list = [h].flat().filter(Boolean);
    outline.selectedObjects = S.tier !== 'low' ? list : [];
    hulls.forEach((m) => m.removeFromParent());
    hulls.length = 0;
    if (!list.length || S.tier !== 'low') return;
    const ms = [];
    list.forEach((o) => o.traverse((c) => c.isMesh && c.material !== hullMat && ms.push(c)));
    for (const o of ms) {
      const m = new THREE.Mesh(o.geometry, hullMat);
      m.raycast = () => {};
      o.add(m);
      hulls.push(m);
    }
  };
  function showFloors() {
    // phones (< 700 px) on the low tier keep the contact shadow but skip the reflection (a second scene pass)
    floorR.visible = !(S.tier === 'low' && innerWidth < 700);
    catcher.visible = true;
  }
  /** high: 4096 shadow, bloom, outline, 8x MSAA, reflection 1024, DPR <= 2. med: 1024 shadow, 4x MSAA, reflection 512, DPR <= 1.5. low: 1024 shadow, SMAA only, DPR 1. SMAA last on all three. */
  const disposeShadow = () => {
    key.shadow.map?.dispose();
    key.shadow.mapPass?.dispose();
    key.shadow.map = key.shadow.mapPass = null;
    renderer.shadowMap.needsUpdate = true;
  };
  const setTier = (t) => {
    S.tier = t;
    grainAniso(t); // run 28 (item 3)
    const hi = t === 'high';
    // run 26 (item 2, correction 56): HIGH on a named discrete GPU takes back every cut but the pixel ratio, so a
    // reflection or shadow cut taken on MEDIUM no longer stays in force after a click on HIGH
    if (hi && S.discrete) {
      for (const k of ['reflection', 'shadowmap', 'shadows']) delete S.cut[k];
      floorR.material.uniforms.uStrength.value = REFLECT;
      if (!renderer.shadowMap.enabled) (renderer.shadowMap.enabled = true), scene.traverse((o) => o.material && [o.material].flat().forEach((m) => (m.needsUpdate = true)));
    }
    const sm = hi && !S.cut.shadowmap ? 4096 : 1024;
    key.shadow.mapSize.set(sm, sm);
    key.shadow.radius = hi ? 40 : 22; // texels: ~2 world units of blur on high, ~5 on low
    key.shadow.blurSamples = hi ? 20 : 24;
    disposeShadow();
    showFloors();
    floorR.getRenderTarget().setSize(hi ? 1024 : 512, hi ? 1024 : 512);
    scenePass.setSamples(Math.min(maxSamples, {high: 8, med: 4, low: 0}[t]));
    bloom.enabled = outline.enabled = t !== 'low';
    resize();
    select(sel);
  };
  /**
   * Adaptive quality: one step down per call, never back up: SSAO off, floor reflection off, shadow map
   * 1024, DPR 1, shadows off. Steps that change nothing here (no SSAO on MEDIUM/LOW, shadow map already
   * 1024, DPR already 1) are skipped.
   * Returns the step taken, or null when none is left.
   */
  // a quality change dissolves: a copy of the frame just drawn (same task, so the drawing buffer is still
  // valid) laid over the canvas and faded out with a cubic in-out over 0.45 s
  const crossfade = () => {
    if (!canvas.width) return;
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    c.getContext('2d').drawImage(canvas, 0, 0);
    c.style.cssText = `position:absolute;left:${canvas.offsetLeft}px;top:${canvas.offsetTop}px;width:${canvas.clientWidth}px;height:${canvas.clientHeight}px;pointer-events:none;transition:opacity .45s cubic-bezier(.65,0,.35,1)`;
    canvas.after(c);
    requestAnimationFrame(() => requestAnimationFrame(() => (c.style.opacity = '0')));
    setTimeout(() => c.remove(), 700);
  };
  const degrade = () => {
    const hiLock = S.tier === 'high' && S.discrete; // correction 56: there only the pixel ratio may drop
    const steps = [
      ['reflection', () => floorR.visible && floorR.material.uniforms.uStrength.value > 0, () => (floorR.material.uniforms.uStrength.value = 0)],
      ['shadowmap', () => key.shadow.mapSize.x > 1024, () => ((key.shadow.mapSize.x = key.shadow.mapSize.y = 1024), disposeShadow())],
      ['dpr', () => renderer.getPixelRatio() > 1, () => 0],
      ['shadows', () => renderer.shadowMap.enabled, () => ((renderer.shadowMap.enabled = false), scene.traverse((o) => o.material && [o.material].flat().forEach((m) => (m.needsUpdate = true))))],
    ];
    for (const [k, live, off] of steps) {
      if (S.cut[k] || (hiLock && k !== 'dpr')) continue;
      S.cut[k] = true;
      if (!live()) continue;
      crossfade();
      off();
      resize();
      return k;
    }
    return null;
  };
  const S = {THREE, renderer, scene, camera, composer, outline, noOutline, size, resize, project, select, setTier, degrade, crossfade, key, rim, cool, fill, under, noReflect, floor: floorR, cut: {}, tier: 'high'};
  S.render = () => composer.render();
  return S;
}
