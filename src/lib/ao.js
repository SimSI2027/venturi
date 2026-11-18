// Run 25 (item 5): the castings' baked recess shading (src/carb/ao.js, from scripts/bake-ao.mjs). Each mesh of the part gets its
// normalized byte attribute aAO (the shading factor, 1 on open faces); the look hook in asm.js multiplies every part's lit result by
// aAO, which finalize() sets to 1 on every other mesh, so no shader variant is added. A mesh whose vertex count no longer matches the
// bake keeps its 1s.
import * as THREE from 'three';
import {AO, AO_MAX} from '../carb/ao.js';

export function applyAO(part) {
  const list = AO[part.id];
  if (!list) return false;
  const ms = [];
  part.obj.traverse((m) => m.isMesh && ms.push(m));
  ms.forEach((m, k) => {
    const c = m.geometry.attributes.position.count, [n, b64] = list[k] || [];
    if (n !== c) return;
    const a = new Uint8Array(c), bin = atob(b64);
    for (let i = 0; i < c; i++) a[i] = Math.round(255 * (1 - (AO_MAX * ((bin.charCodeAt(i >> 1) >> ((i & 1) * 4)) & 15)) / 15));
    m.geometry.setAttribute('aAO', new THREE.BufferAttribute(a, 1, true));
  });
  return true;
}
