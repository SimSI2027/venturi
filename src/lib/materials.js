// Materials. makeMaterials() is called once per assembly so each assembly can be dimmed on its own.
import * as THREE from 'three';

const NOISE = /* glsl */ `
float wHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float wNoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wHash(i + vec3(0,0,0)), wHash(i + vec3(1,0,0)), f.x), mix(wHash(i + vec3(0,1,0)), wHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wHash(i + vec3(0,0,1)), wHash(i + vec3(1,0,1)), f.x), mix(wHash(i + vec3(0,1,1)), wHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float wFbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * wNoise(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
`;

// The studio's PMREM, set by the stage before any assembly is built. three.js overrides
// material.envMapIntensity with scene.environmentIntensity unless the material holds its own envMap,
// so the steel and wood take it directly and their envMapIntensity counts.
let ENV = null;
export function setEnvironment(tex) { ENV = tex; }

/** GLSL: soft-caps the lit colour's luminance under the bloom threshold (0.9), so the surface never blooms. */
export const NO_BLOOM = /* glsl */ `{ float lum = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
  if (lum > 0.6) outgoingLight *= (0.6 + 0.28 * (1.0 - exp(-(lum - 0.6) / 0.28))) / lum; }`;
/** Chain NO_BLOOM onto a material, just before its output. */
export function noBloom(m) {
  const base = m.onBeforeCompile;
  const key = m.customProgramCacheKey();
  m.onBeforeCompile = (sh, r) => {
    base.call(m, sh, r);
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', NO_BLOOM + '\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => key + '|nobloom';
  return m;
}

/**
 * Oiled walnut: long grain along the part's local X, two brown tones and dark figure.
 * opt.dark tints it (checkered panels), opt.seed shifts the figure between parts.
 */
export function walnut({seed = 0, dark = 0, bump = null, bumpScale = 0, tint = 1, specular = 1} = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(tint, tint, tint), // base tone only; the grain below is shared
    specularIntensity: specular,
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.4,
    envMap: ENV,
    envMapIntensity: 0.25,
    sheen: 0.25,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0x5a2c12),
    bumpMap: bump,
    bumpScale,
  });
  m.userData.seed = seed;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSeed = {value: new THREE.Vector3(seed * 7.13, seed * 3.71, seed * 5.29)};
    sh.uniforms.uDark = {value: dark};
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWood;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWood = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vWood;\nuniform vec3 uSeed;\nuniform float uDark;\n${NOISE}`)
      .replace(
        '#include <map_fragment>',
        `
        vec3 wp = vWood + uSeed;
        // slow wandering of the growth rings: uneven spacing, long along X
        float warp = wFbm(wp * vec3(0.03, 0.22, 0.22)) * 4.0;
        float rp = (wp.y * 1.1 + wp.z * 0.4 + warp * 2.6) * 2.6;
        rp += 0.9 * sin(rp * 0.37 + warp);
        float ring = 0.5 + 0.5 * sin(rp);
        ring = smoothstep(0.35, 1.0, ring) * 0.6 + smoothstep(0.75, 1.0, 0.5 + 0.5 * sin(rp * 3.1 + 1.7)) * 0.18;
        // long pores: fine dark dashes along the grain
        float pores = wFbm(wp * vec3(0.1, 10.0, 10.0));
        float dash = smoothstep(0.62, 0.8, wNoise(wp * vec3(0.9, 22.0, 22.0)));
        float streak = smoothstep(0.35, 0.75, wFbm(wp * vec3(0.05, 2.0, 2.0) + 5.0));
        // dark figure: flame and mineral streaks
        float fig = smoothstep(0.5, 0.8, wFbm(wp * vec3(0.08, 0.8, 0.8) + vec3(3.0, 1.0, 7.0)));
        vec3 light = vec3(0.43, 0.27, 0.155);
        vec3 mid   = vec3(0.255, 0.15, 0.085);
        vec3 deep  = vec3(0.085, 0.048, 0.032);
        vec3 wc = mix(mid, light, ring * 0.7 + streak * 0.3);
        wc = mix(wc, deep, fig * 0.65);
        wc *= (0.88 + 0.18 * pores) * (1.0 - 0.28 * dash);
        wc *= 1.0 - uDark;
        diffuseColor.rgb *= pow(wc, vec3(2.2));
        float woodPore = pores;
        `,
      )
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * (0.8 + 0.45 * woodPore) + fig * 0.08, 0.05, 1.0);');
  };
  m.customProgramCacheKey = () => 'walnut';
  return m;
}

const normalTex = new Map();
/**
 * Tangent-space normal map of a diamond relief (pyramids between two sets of diagonal V grooves),
 * computed from the height field. Used for grip checkering and the magazine cap knurl.
 */
export function diamondNormal(size = 128, cells = 4, strength = 2.2) {
  const k = `${size}/${cells}/${strength}`;
  if (normalTex.has(k)) return normalTex.get(k);
  const h = (x, y) => {
    const u = (x / size) * cells;
    const v = (y / size) * cells;
    const d1 = Math.abs((((u + v) % 1) + 1) % 1 - 0.5) * 2;
    const d2 = Math.abs((((u - v) % 1) + 1) % 1 - 0.5) * 2;
    return Math.pow(1 - Math.max(d1, d2), 0.8); // 1 at pyramid tip, 0 in the grooves
  };
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) * strength;
      const dy = (h(x, y + 1) - h(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = Math.round((-dx / l * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round((dy / l * 0.5 + 0.5) * 255); // canvas y runs down, uv v runs up
      img.data[i + 2] = Math.round((1 / l * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 8;
  normalTex.set(k, t);
  return t;
}

let machTex = null;
/** Fine machining lines: uneven parallel grinding marks along u (vary along v). */
export function machiningTexture() {
  if (machTex) return machTex;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < 256; y++) {
    const v = 0.5 + 0.35 * Math.sin(y * 1.9) * rnd() + 0.15 * (rnd() - 0.5);
    const b = Math.round(Math.min(1, Math.max(0, v)) * 255);
    g.fillStyle = `rgb(${b},${b},${b})`;
    g.fillRect(0, y, 4, 1);
  }
  machTex = new THREE.CanvasTexture(c);
  machTex.wrapS = machTex.wrapT = THREE.RepeatWrapping;
  machTex.colorSpace = THREE.NoColorSpace;
  return machTex;
}

let ribTex = null;
/** Fine lengthwise lines (matted rib, serrations). */
export function lineTexture() {
  if (ribTex) return ribTex;
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 64;
  const g = c.getContext('2d');
  for (let y = 0; y < 64; y++) {
    const v = 0.5 + 0.5 * Math.cos((y / 64) * Math.PI * 2 * 4);
    g.fillStyle = `rgb(${v * 255},${v * 255},${v * 255})`;
    g.fillRect(0, y, 4, 1);
  }
  ribTex = new THREE.CanvasTexture(c);
  ribTex.wrapS = ribTex.wrapT = THREE.RepeatWrapping;
  ribTex.colorSpace = THREE.NoColorSpace;
  return ribTex;
}

/**
 * Worn finish for metal: bright bare steel on convex edges (curvature from screen-space normal
 * derivatives, so every bevel wears, at any zoom) and a faint satin unevenness in roughness.
 */
function worn(m, {wear = 1, bare = 0x8d949c, mottle = 0.22} = {}) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uWear = {value: wear};
    sh.uniforms.uBare = {value: new THREE.Color(bare)};
    sh.uniforms.uMottle = {value: mottle};
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMetal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMetal = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vMetal;\nuniform float uWear;\nuniform vec3 uBare;\nuniform float uMottle;\n${NOISE}`)
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        {
          vec3 gN = normalize(vNormal);
          float curv = length(fwidth(gN)) / max(length(fwidth(vViewPosition)), 1e-4);
          float n1 = wNoise(vMetal * 5.0);
          float edge = smoothstep(3.5, 11.0, curv) * smoothstep(0.25, 0.65, n1 + 0.15) * uWear;
          // 0.4 mm bevel catch: every tight convex edge (bevel radius ~0.04 cm, curvature ~25/cm)
          // gets a thin bright polished line, independent of the wear noise
          float bevel = smoothstep(9.0, 22.0, curv) * 0.55;
          edge = max(edge, bevel);
          float mot = wFbm(vMetal * vec3(0.35, 2.2, 2.2));
          roughnessFactor = clamp(roughnessFactor * (1.0 + uMottle * (mot - 0.5) * 2.0), 0.08, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, uBare, edge);
          roughnessFactor = mix(roughnessFactor, 0.2, edge);
        }`,
      );
  };
  m.customProgramCacheKey = () => 'worn';
  return m;
}

function makeMaterialsIronwood() {
  const steel = worn(
    new THREE.MeshPhysicalMaterial({
      color: 0x252c39,
      metalness: 1,
      roughness: 0.38,
      anisotropy: 0.6,
      clearcoat: 0.2,
      clearcoatRoughness: 0.16,
      envMap: ENV,
      envMapIntensity: 0.6,
    }),
  );
  const M = {
    steel, // deep blued gunmetal
    steelSatin: worn(new THREE.MeshPhysicalMaterial({color: 0x30353d, metalness: 1, roughness: 0.42, anisotropy: 0.45, envMap: ENV, envMapIntensity: 0.6}), {wear: 0.8}),
    steelBright: worn(new THREE.MeshPhysicalMaterial({color: 0x9aa2ad, metalness: 1, roughness: 0.24, anisotropy: 0.7, envMap: ENV, envMapIntensity: 0.6}), {wear: 0.5, bare: 0xc4cad1, mottle: 0.3}), // bolt, in the white
    steelInner: new THREE.MeshStandardMaterial({color: 0x1a1d22, metalness: 1, roughness: 0.48, envMap: ENV, envMapIntensity: 0.6}),
    alloy: worn(new THREE.MeshPhysicalMaterial({color: 0x23262c, metalness: 0.8, roughness: 0.42, clearcoat: 0.15, envMap: ENV, envMapIntensity: 0.6}), {wear: 0.7, bare: 0x7b7f86}), // anodised housing
    brass: new THREE.MeshPhysicalMaterial({color: 0xc29a48, metalness: 1, roughness: 0.27, anisotropy: 0.3}),
    rubber: new THREE.MeshPhysicalMaterial({color: 0x0f1012, metalness: 0, roughness: 0.82, sheen: 0.4, sheenRoughness: 0.8, sheenColor: new THREE.Color(0x2a2c30)}),
    polymer: new THREE.MeshPhysicalMaterial({color: 0x121315, metalness: 0, roughness: 0.55, clearcoat: 0.1}),
    bore: new THREE.MeshStandardMaterial({color: 0x07080a, metalness: 1, roughness: 0.35}),
    rib: new THREE.MeshPhysicalMaterial({color: 0x1f252e, metalness: 1, roughness: 0.55, bumpMap: lineTexture(), bumpScale: 1.2, envMap: ENV, envMapIntensity: 0.6}),
    walnut: (seed, opt) => walnut({seed, ...opt}),
    // the one walnut of the forend and the stock: same two tones, figure and grain scale (an
    // instance per assembly only so each can dim on its own). opt: base tone and specular only.
    wood: (opt) => walnut({seed: 0, ...opt}),
  };
  M.rib.bumpMap.repeat.set(1, 1);
  // Lathe uv runs u around the tube, so the default tangent is circumferential; turn it 90°
  // so the brushed highlight streaks along the tube's length.
  const tubes = new Map();
  M.tube = (m) => {
    if (!m.anisotropy) return m;
    if (!tubes.has(m)) {
      const t = m.clone();
      t.anisotropyRotation = Math.PI / 2;
      t.onBeforeCompile = m.onBeforeCompile;
      t.customProgramCacheKey = m.customProgramCacheKey;
      tubes.set(m, t);
    }
    return tubes.get(m);
  };
  return M;
}

let castTex = null;
/** Run 28 (item 3): the grain's anisotropic filtering per tier (8 HIGH, 4 MED, 2 LOW), set by the stage's setTier. */
export function grainAniso(tier) {
  const n = {high: 8, med: 4, low: 2}[tier] || 4;
  if (castTex && castTex.anisotropy !== n) Object.assign(castTex, {anisotropy: n, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, needsUpdate: true});
}
/** Fine casting grain: a tangent-space normal map from a few octaves of value noise (sand-cast aluminium). */
export function castNormal(size = 256, strength = 1.6) {
  if (castTex) return castTex;
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const N = size;
  const hgt = new Float32Array(N * N);
  for (const [cell, amp] of [[2, 0.5], [4, 0.3], [8, 0.2]]) {
    const G = N / cell;
    const g = new Float32Array((G + 1) * (G + 1)).map(() => rnd());
    for (let i = 0; i <= G; i++) g[i * (G + 1) + G] = g[i * (G + 1)], g[G * (G + 1) + i] = g[i]; // tiles
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const gx = x / cell, gy = y / cell, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const a = g[iy * (G + 1) + ix], b = g[iy * (G + 1) + ix + 1], c = g[(iy + 1) * (G + 1) + ix], d = g[(iy + 1) * (G + 1) + ix + 1];
        hgt[y * N + x] += amp * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
      }
  }
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(N, N);
  const H = (x, y) => hgt[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * N + x) * 4;
      img.data[i] = Math.round((-dx / l * 0.5 + 0.5) * 255);
      img.data[i + 1] = Math.round((dy / l * 0.5 + 0.5) * 255);
      img.data[i + 2] = Math.round((1 / l * 0.5 + 0.5) * 255);
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  castTex = new THREE.CanvasTexture(c);
  castTex.wrapS = castTex.wrapT = THREE.RepeatWrapping;
  castTex.colorSpace = THREE.NoColorSpace;
  castTex.repeat.set(1.5, 1.5);
  return castTex;
}

/**
 * The carburetor's materials ("The look"): cast aluminium body and bowl (pale grey, roughness 0.55, casting grain
 * normal map), machined faces smoother and brighter, brass jets, steel screws/springs/needle/rollers, black rubber,
 * black plastic, hard-anodised grey slide. One set per assembly (each part clones its own for dimming).
 */
/** Run 25 (item 6): brass with a light roughness variation, +/-15% from a smooth value noise on the part's own coordinates (about 4 mm cells). */
function brassVar(m) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vBrP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvBrP = position * 0.25;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBrP;\nfloat brH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }\nfloat brN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);\n  return mix(mix(mix(brH(i), brH(i + vec3(1, 0, 0)), f.x), mix(brH(i + vec3(0, 1, 0)), brH(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(brH(i + vec3(0, 0, 1)), brH(i + vec3(1, 0, 1)), f.x), mix(brH(i + vec3(0, 1, 1)), brH(i + vec3(1, 1, 1)), f.x), f.y), f.z); }')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor *= 0.85 + 0.3 * brN(vBrP);');
  };
  m.customProgramCacheKey = () => 'brass-var';
  return m;
}

export function makeMaterials() {
  const grain = castNormal(256, 0.6); // run 26 (round 1, D3 line 3): slope 1.6 -> 0.6: at 0.25 mm a texel (item 4) 1.6 read as hammered paint
  const std = (o) => new THREE.MeshPhysicalMaterial({envMap: ENV, envMapIntensity: 0.7, ...o});
  const cast = std({color: 0x919397, metalness: 0.3, roughness: 0.55, envMapIntensity: 0.3, // run 27 (item 2): #7a7d83 -> #919397, light neutral satin silver (rep_1..5, mine_1..6) // run 26 (item 16): 0.52 -> 0.55 as-cast, against 0.3 machined // run 10: measured on the page as it loads (HIGH, scratch/castlive.mjs): darker, and a cool tint against the warm key so red and blue match
    normalMap: grain, normalScale: new THREE.Vector2(0.9, 0.9)}); // run 30 (round 1, D2 0.52 -> target 0.8-1.2): grain 0.55 -> 0.9 // run 27 (item 2): grain 1 -> 0.55, fine satin, not hammered
  // run 26 (item 4): the grain is triplanar in the mesh's own (part) space, 256 texels to 64 mm (0.25 mm a texel), at strength 1 on every
  // as-cast face: no uv, so a round cap or boss shows the same grain as a flat face (its radial uv gave radial speckle). Whiteout blend
  // of the 3 projections, weighted by the 4th power of the object-space normal; back faces flip it (both sides are drawn).
  cast.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTriP;\nvarying vec3 vTriN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvTriP = position / 64.0;\nvTriN = normal;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTriP;\nvarying vec3 vTriN;\nuniform mat3 normalMatrix;')
      .replace('#include <normal_fragment_maps>', `{
        vec3 on = normalize(vTriN) * faceDirection, bw = pow(abs(on), vec3(4.0));
        bw /= bw.x + bw.y + bw.z;
        vec3 tx = texture2D(normalMap, vTriP.zy).xyz * 2.0 - 1.0, ty = texture2D(normalMap, vTriP.xz).xyz * 2.0 - 1.0, tz = texture2D(normalMap, vTriP.xy).xyz * 2.0 - 1.0;
        // run 28 (item 3): the grain fades out as 1 texel covers fewer pixels, each projection's footprint from its own 2 axes' screen
        // derivatives; the mip chain and the 8x / 4x anisotropy filter it. Run 29 (item 3): the fade starts at 0.5 pixels a texel (it started
        // at 2) and ends at 0.125 (texels a pixel 2 -> 8: grain 1 -> 0; it was 0.5 -> 1), so a casting clicked alone at 800x500 keeps its grain
        // (scratch/grain29.mjs; shimmer the same, scratch/shimmer28.mjs)
        vec3 gdx = dFdx(vTriP) * 256.0, gdy = dFdy(vTriP) * 256.0;
        float tpp = dot(bw, vec3(max(length(gdx.zy), length(gdy.zy)), max(length(gdx.xz), length(gdy.xz)), max(length(gdx.xy), length(gdy.xy))));
        vec2 gs = normalScale * (1.0 - smoothstep(2.0, 8.0, tpp));
        tx.xy *= gs; ty.xy *= gs; tz.xy *= gs;
        tx = vec3(tx.xy + on.zy, abs(tx.z) * on.x);
        ty = vec3(ty.xy + on.xz, abs(ty.z) * on.y);
        tz = vec3(tz.xy + on.xy, abs(tz.z) * on.z);
        vec3 pn = normalize(tx.zyx * bw.x + ty.xzy * bw.y + tz.xyz * bw.z);
        // keep the interpolated (smooth) normal and add only the grain's tilt
        normal = normalize(normal + normalize(normalMatrix * pn) - normalize(normalMatrix * on));
      }`);
  };
  cast.customProgramCacheKey = () => 'cast-grain';
  const tag = (m, f) => ((m.userData.finish = f), m); // run 27: cast / machined, for the measuring scripts' masks (clones keep userData)
  tag(cast, 'cast');
  return {
    // run 8: neutral silver (#b9b9b5, roughness 0.5); less metal and less of the cool studio reflection, so the cast faces show no blue or lavender tint at the default view
    cast,
    // run 27 (item 3): less metal, so a machined face is about as lit as the cast beside it from any side (metal 0.8 mirrored the studio's
    // top light: +73% over the cast round it in the top view, -10% in the default view, where it now reads +8%), smoother (0.26 to the cast's 0.55)
    machined: tag(std({color: 0xbcbcba, metalness: 0.35, roughness: 0.26, envMapIntensity: 0.3}), 'machined'),
    bore: tag(std({color: 0xb8b8b6, metalness: 0.35, roughness: 0.26, envMapIntensity: 0.3}), 'machined'), // run 13 (item 9): brighter machined bore; run 26 (item 16): 0.26 -> 0.3
    brass: brassVar(std({color: 0xc9a24b, metalness: 1, roughness: 0.3})),
    steel: std({color: 0xa7adb5, metalness: 1, roughness: 0.32}),
    steelDark: std({color: 0x5c626b, metalness: 1, roughness: 0.38}),
    zinc: std({color: 0xb7b39c, metalness: 1, roughness: 0.36}), // zinc-plated screws and clips
    // run 25 (item 6): a satin sheen (was roughness 0.78, sheen 0.3 at 0.8, #2a2c30): a soft lighter rim at grazing angles, still no gloss
    rubber: std({color: 0x121314, metalness: 0, roughness: 0.66, envMapIntensity: 0.4, sheen: 0.55, sheenRoughness: 0.5, sheenColor: new THREE.Color(0x3a3d42)}),
    hose: std({color: 0x151618, metalness: 0, roughness: 0.6, envMapIntensity: 0.45}),
    vinyl: std({color: 0x8f989c, metalness: 0, roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.6}),
    plastic: std({color: 0x161719, metalness: 0, roughness: 0.45, clearcoat: 0.15, envMapIntensity: 0.5}),
    anod: std({color: 0x666a72, metalness: 0.2, roughness: 0.5, envMapIntensity: 0.3}), // run 15 (item 5): hard-anodised grey (run 14 had it charcoal)
    wire: std({color: 0x1a1b1d, metalness: 0, roughness: 0.5, envMapIntensity: 0.4}),
  };
}
