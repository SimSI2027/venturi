// The two guided modes (TEAR DOWN, REBUILD): their numbered steps from data.js, the saved checkboxes, the step
// card (Back / Next, the one-line note, the brass callouts, the progress line), the Steps list and the owner's
// Notes field. Everything saved goes to local storage only.
import {STEPS_B, N_B, ADDED_STEP, NOTES_C, info} from './carb/data.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const nn = (n) => String(n).padStart(2, '0');
const callouts = (mode, n) => NOTES_C.filter((c) => c.at.some((a) => a.mode === mode && a.step === n)).map((c) => c.text);
const partLine = (ids) => ids.map((id) => {
  const i = info(id);
  return `${i.ref} ${i.name}${i.piece ? ` (${i.piece})` : ''}`;
});

export const MODES = {
  teardown: {
    label: 'Tear down',
    short: 'Tear down',
    steps: STEPS_B.map((s) => ({n: s.n, title: `Remove: ${s.text}`, parts: s.parts, added: !!s.added, note: s.note || null, calls: callouts('teardown', s.n)})),
  },
  rebuild: {
    label: 'Rebuild',
    short: 'Rebuild',
    steps: STEPS_B.slice().reverse().map((s, i) => ({n: i + 1, title: `Fit: ${s.text}`, parts: s.parts, td: s.n, added: !!s.added, note: s.note || null, calls: callouts('rebuild', i + 1)})),
  },
};

// tear-down step that takes each part off; rebuild step that puts it back (each part is in exactly 1 step)
export const REMOVED_AT = {};
export const FITTED_AT = {};
for (const s of STEPS_B) for (const id of s.parts) {
  REMOVED_AT[id] = s.n;
  FITTED_AT[id] = N_B + 1 - s.n;
}

// v2: the steps were renumbered in run 6 (2 added steps), so the run-5 ticks would land on the wrong steps
const KEY = {done: 'venturi.done.v2', notes: 'venturi.notes.v1', step: 'venturi.step.v2'};
function load(k, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v && typeof v === 'object' ? v : fallback;
  } catch (e) {
    return fallback;
  }
}
function save(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}

/**
 * The guide's UI. el(tag, cls, html, parent) builds elements. ui: the overlay root. tabs: the panel's tab bar,
 * body: its body (the Steps and Notes views go in there). go(mode, n): the page moves to that step.
 * onPart(id): a part named on the card was clicked.
 */
export function createGuide({el, ui, body, go, onPart}) {
  const done = load(KEY.done, {});
  const last = load(KEY.step, {});
  for (const k of Object.keys(MODES)) done[k] = Array.isArray(done[k]) ? done[k].filter((n) => typeof n === 'number') : [];
  const G = {mode: null, n: 1, last};

  // the step card
  const card = el('div', 'vt-step', null, ui);
  card.setAttribute('aria-live', 'polite');
  // the Steps list and the Notes field (panel tabs)
  const steps = el('div', 'vt-steps', null, body);
  steps.hidden = true;
  const notesBox = el('div', 'vt-notes', '<p>Your own numbers: pilot screw turns counted, jets found, anything to remember on the rebuild. Saved in this browser only.</p>', body);
  notesBox.hidden = true;
  const notes = el('textarea', 'vt-ta', null, notesBox);
  notes.setAttribute('aria-label', 'Your notes');
  notes.placeholder = 'Pilot screw: … turns out from seated\nMain jet stamped: #…\nPilot air jet stamped: #…';
  try {
    notes.value = localStorage.getItem(KEY.notes) || '';
  } catch (e) {}
  let tq = 0;
  notes.addEventListener('input', () => {
    clearTimeout(tq);
    tq = setTimeout(() => {
      try {
        localStorage.setItem(KEY.notes, notes.value);
      } catch (e) {}
    }, 250);
  });

  const isDone = (m, n) => done[m].includes(n);
  function setDone(m, n, v) {
    done[m] = done[m].filter((k) => k !== n);
    if (v) done[m].push(n);
    save(KEY.done, done);
    render();
    G.onProgress?.();
  }
  const count = (m) => done[m].length;
  G.progress = (m) => `${count(m)}/${MODES[m].steps.length}`;

  function renderList() {
    const M = MODES[G.mode];
    if (!M) return (steps.innerHTML = '<p class="vt-src">Pick TEAR DOWN or REBUILD below to see its steps.</p>');
    steps.innerHTML =
      `<div class="vt-lh">${esc(M.label)} · ${count(G.mode)} of ${M.steps.length} done</div>` +
      M.steps.map((s) => `<div class="vt-srow${s.n === G.n ? ' on' : ''}${isDone(G.mode, s.n) ? ' done' : ''}" data-n="${s.n}"><input type="checkbox" aria-label="Step ${s.n} done"${isDone(G.mode, s.n) ? ' checked' : ''}><b>${nn(s.n)}</b><span>${esc(s.title)}${s.added ? ' <em>· added step, not in the manual’s list</em>' : ''}</span>${s.calls.length ? '<i title="has a note">!</i>' : ''}</div>`).join('');
    steps.querySelector('.vt-srow.on')?.scrollIntoView({block: 'nearest'});
  }
  steps.addEventListener('click', (e) => {
    const r = e.target.closest('.vt-srow');
    if (!r) return;
    const n = Number(r.dataset.n);
    if (e.target.matches('input')) return setDone(G.mode, n, e.target.checked);
    go(G.mode, n);
  });

  function renderCard() {
    const M = MODES[G.mode];
    if (!M) return card.classList.remove('show');
    const s = M.steps[G.n - 1];
    const N = M.steps.length;
    const names = partLine(s.parts);
    card.innerHTML =
      `<div class="vt-sh"><span>${esc(M.label)}</span><b>${nn(s.n)}</b><i>/ ${N}</i></div>` +
      `<div class="vt-st">${esc(s.title)}</div>` +
      (s.added ? `<div class="vt-add">${esc(ADDED_STEP)}</div>` : '') +
      (names.length ? `<div class="vt-sp">${s.parts.map((id, k) => `<button data-id="${esc(id)}">${esc(names[k])}</button>`).join('')}</div>` : '') +
      (s.note ? `<div class="vt-note">${esc(s.note)}</div>` : '') +
      s.calls.map((c) => `<div class="vt-call">${esc(c)}</div>`).join('') +
      `<div class="vt-prog" style="--n:${N}">${M.steps.map((t) => `<i class="${isDone(G.mode, t.n) ? 'd' : ''}${t.n === s.n ? ' c' : ''}"></i>`).join('')}</div>` +
      `<div class="vt-pl">${count(G.mode)} of ${N} done</div>` +
      `<div class="vt-nav"><button class="iw-btn" data-go="-1"${s.n === 1 ? ' disabled' : ''}>Back</button><label><input type="checkbox"${isDone(G.mode, s.n) ? ' checked' : ''}> Done</label><button class="iw-btn" data-go="1"${s.n === N ? ' disabled' : ''}>Next</button></div>`;
    card.classList.add('show');
  }
  card.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b?.dataset.id) return onPart(b.dataset.id);
    if (b?.dataset.go) return go(G.mode, G.n + Number(b.dataset.go));
  });
  // Done marks the step and moves on to the next one
  card.addEventListener('change', (e) => {
    if (!e.target.matches('input')) return;
    const {mode, n} = G;
    setDone(mode, n, e.target.checked);
    if (e.target.checked && n < MODES[mode].steps.length) go(mode, n + 1);
  });

  function render() {
    renderCard();
    renderList();
  }
  /** Show mode m at step n (null mode: explore, no card). */
  G.set = (m, n) => {
    G.mode = m;
    if (m) {
      G.n = Math.min(Math.max(1, n || 1), MODES[m].steps.length);
      last[m] = G.n;
      save(KEY.step, last);
    }
    render();
  };
  G.step = () => (G.mode ? MODES[G.mode].steps[G.n - 1] : null);
  G.card = card;
  G.views = {steps, notes: notesBox};
  return G;
}
