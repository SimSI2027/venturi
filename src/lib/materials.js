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
export function makeMaterials() {
  const grain = castNormal();
  const std = (o) => new THREE.MeshPhysicalMaterial({envMap: ENV, envMapIntensity: 0.7, ...o});
  return {
    // run 8: neutral silver (#b9b9b5, roughness 0.5); less metal and less of the cool studio reflection, so the
    // cast faces show no blue or lavender tint at the default view
    cast: std({color: 0xb9b9b5, metalness: 0.3, roughness: 0.5, envMapIntensity: 0.35, normalMap: grain, normalScale: new THREE.Vector2(0.35, 0.35)}),
    machined: std({color: 0xc4c3bf, metalness: 0.8, roughness: 0.3, envMapIntensity: 0.45}),
    bore: std({color: 0x9a9995, metalness: 0.8, roughness: 0.28, envMapIntensity: 0.45}),
    brass: std({color: 0xc9a24b, metalness: 1, roughness: 0.3}),
    steel: std({color: 0xa7adb5, metalness: 1, roughness: 0.32}),
    steelDark: std({color: 0x5c626b, metalness: 1, roughness: 0.38}),
    zinc: std({color: 0xb7b39c, metalness: 1, roughness: 0.36}), // zinc-plated screws and clips
    rubber: std({color: 0x121314, metalness: 0, roughness: 0.78, envMapIntensity: 0.4, sheen: 0.3, sheenRoughness: 0.8, sheenColor: new THREE.Color(0x2a2c30)}),
    hose: std({color: 0x151618, metalness: 0, roughness: 0.6, envMapIntensity: 0.45}),
    vinyl: std({color: 0x8f989c, metalness: 0, roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.6}),
    plastic: std({color: 0x161719, metalness: 0, roughness: 0.45, clearcoat: 0.15, envMapIntensity: 0.5}),
    anod: std({color: 0x5d6168, metalness: 0.7, roughness: 0.4}),
    wire: std({color: 0x1a1b1d, metalness: 0, roughness: 0.5, envMapIntensity: 0.4}),
  };
}
