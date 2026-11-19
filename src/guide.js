// The two guided modes (TEAR DOWN, REBUILD): their numbered steps from data.js, the saved checkboxes, the step
// card (Back / Next, the one-line note, the brass callouts, the progress line), the Steps list and the owner's
// Notes field. Everything saved goes to local storage only.
import {STEPS_A, STEPS_B, N_B, ADDED_STEP, NOTES_C, PIECES, KPIECES, KIT, KIT_TOTAL, needsLT, fitNew, LT_TEXT, nameOf} from './carb/data.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const nn = (n) => String(n).padStart(2, '0');
const callouts = (mode, n) => NOTES_C.filter((c) => c.at.some((a) => a.mode === mode && a.step === n)).map((c) => c.text);
const partLine = (ids) => ids.map(nameOf);
// run 11: the Keihin pieces are in no step's own list; each moves with the step of the part it rides on
const moves = (n) => KPIECES.filter((id) => PIECES[id].step === n);

export const MODES = {
  teardown: {
    label: 'Tear down',
    short: 'Tear down',
    steps: STEPS_B.map((s) => ({n: s.n, title: `Remove: ${s.text}`, parts: s.parts, moves: moves(s.n), added: !!s.added, note: s.note || null, calls: callouts('teardown', s.n)})),
  },
  rebuild: {
    label: 'Rebuild',
    short: 'Rebuild',
    steps: STEPS_B.slice().reverse().map((s, i) => ({n: i + 1, title: `Fit: ${s.text}`, parts: s.parts, moves: moves(s.n), td: s.n, added: !!s.added, note: s.rnote || s.note || null, calls: callouts('rebuild', i + 1)})),
  },
};

// tear-down step that takes each part off; rebuild step that puts it back (each part is in exactly 1 step)
export const REMOVED_AT = {};
export const FITTED_AT = {};
for (const s of STEPS_B) for (const id of s.parts) {
  REMOVED_AT[id] = s.n;
  FITTED_AT[id] = N_B + 1 - s.n;
}
for (const id of KPIECES) if (PIECES[id].step) (REMOVED_AT[id] = PIECES[id].step), (FITTED_AT[id] = N_B + 1 - PIECES[id].step);

// v2: the steps were renumbered in run 6 (2 added steps), so the run-5 ticks would land on the wrong steps
const KEY = {done: 'venturi.done.v2', notes: 'venturi.notes.v1', off: 'venturi.off.v1', step: 'venturi.step.v2', fin: 'venturi.fin.v3', mig: 'venturi.mig.v51'};
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
  // run 24 (correction 51): progress follows position. Each mode saves its current step (last) and whether Done was ticked on its last step (fin);
  // on step n, steps 1 to n-1 are done (and step n too when fin), however step n was reached. The run-23 ticks (venturi.done.v2) are cleared once.
  try {
    if (!localStorage.getItem(KEY.mig)) {
      localStorage.removeItem(KEY.done);
      localStorage.setItem(KEY.mig, '1');
    }
  } catch (e) {}
  const last = load(KEY.step, {});
  const fin = load(KEY.fin, {});
  for (const k of Object.keys(MODES)) {
    const N = MODES[k].steps.length;
    last[k] = Number.isInteger(last[k]) ? Math.min(Math.max(1, last[k]), N) : 1;
    fin[k] = fin[k] === true && last[k] === N;
  }
  const G = {mode: null, n: 1, last};

  // the step card
  const card = el('div', 'vt-step', null, ui);
  card.setAttribute('aria-live', 'polite');
  // the Steps list and the Notes field (panel tabs)
  const steps = el('div', 'vt-steps', null, body);
  steps.hidden = true;
  // run 33 (item 5, correction 76): PRINT, the bench checklist as black text on white paper
  const prBar = el('div', 'vt-prbar', '<button class="iw-btn">Print</button><span>Off the ATV, the 29 rebuild steps, the kit list and blank lines for your numbers, black on white.</span>', steps);
  prBar.querySelector('button').onclick = () => printSheet();
  // run 17 (item 8): the "Off the ATV" list (steps.md section A), text only, each line with a checkbox saved in this browser
  const offDone = load(KEY.off, {});
  const OFF = [{t: 'Seat, fuel tank cover and both side covers: off first'}, ...STEPS_A.list.map((s) => ({t: `${s.n}. ${s.text}`}))];
  const offBox = el('div', 'vt-off', `<div class="vt-lh">Off the ATV</div>` + OFF.map((o, i) => `<label class="vt-orow"><input type="checkbox" data-i="${i}"${offDone[i] ? ' checked' : ''}><span>${esc(o.t)}</span></label>`).join('') + `<p class="vt-on">${esc(STEPS_A.owner)}</p>`, steps);
  offBox.addEventListener('change', (e) => {
    if (!e.target.matches('input')) return;
    offDone[e.target.dataset.i] = e.target.checked;
    save(KEY.off, offDone);
    offBox.querySelectorAll('.vt-orow').forEach((r, i) => r.classList.toggle('done', !!offDone[i]));
  });
  offBox.querySelectorAll('.vt-orow').forEach((r, i) => r.classList.toggle('done', !!offDone[i]));
  const list = el('div', 'vt-list', null, steps);
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

  const count = (m) => last[m] - 1 + (fin[m] ? 1 : 0);
  const isDone = (m, n) => n <= count(m);
  G.progress = (m) => `${count(m)}/${MODES[m].steps.length}`;

  // The print sheet: a plain page appended to the body only for the print (the print CSS hides everything else, the 3D view included).
  // Boxes are empty (a clean sheet, not this browser's ticks). LT and "fit new" are flagged on the steps that fit those parts.
  function printSheet() {
    const box = '<i class="pr-box"></i>';
    const line = (label) => `<div class="pr-line"><span>${esc(label)}</span><u></u></div>`;
    const rows = MODES.rebuild.steps.map((s) => {
      const lt = s.parts.filter(needsLT);
      const nw = s.parts.filter(fitNew);
      return `<div class="pr-step"><div class="pr-h">${box}<b>${nn(s.n)}</b><span>${esc(s.title)}</span></div>` +
        (s.parts.length ? `<div class="pr-p">${esc(partLine(s.parts).join('; '))}</div>` : '') +
        (lt.length ? `<div class="pr-f"><b>LT</b> ${esc(LT_TEXT)}: ${esc(partLine(lt).join('; '))}</div>` : '') +
        (nw.length ? `<div class="pr-f"><b>FIT NEW</b> ${esc(partLine(nw).join('; '))}</div>` : '') +
        (s.note ? `<div class="pr-c">${esc(s.note)}</div>` : '') +
        s.calls.filter((c) => !c.startsWith(LT_TEXT)).map((c) => `<div class="pr-c">${esc(c)}</div>`).join('') + `</div>`;
    }).join('');
    const kit = KIT.map((k) => `<tr><td>${box}</td><td>${esc(k.id[0] === 'K' ? `${k.id} · ${nameOf(k.id)}` : nameOf(k.id))} <small>${k.kind}</small></td><td>${k.qty}${k.known ? '' : '*'}</td><td>${fitNew(k.id) ? 'fit new' : ''}</td></tr>`).join('');
    const d = document.createElement('div');
    d.className = 'vt-printdoc';
    d.innerHTML = `<h1>VENTURI 39 · carburetor rebuild checklist</h1><p class="pr-s">2004 YFZ450, Keihin flat-slide carburetor. Visual guide only. Follow the service manual.</p>` +
      `<h2>Your numbers</h2>${line('Pilot screw turns out from seated')}${line('Main jet found, stamped #')}${line('Pilot jet found, stamped #')}${line('Starter jet found, stamped #')}${line('Pilot air jet found, stamped #')}` +
      `<h2>Off the ATV</h2>` + OFF.map((o) => `<div class="pr-o">${box}<span>${esc(o.t)}</span></div>`).join('') + `<p class="pr-s">${esc(STEPS_A.owner)}</p>` +
      `<h2>Rebuild, 29 steps</h2>${rows}` +
      `<h2>Kit: ${KIT_TOTAL} pieces in ${KIT.length} lines</h2><table class="pr-t">${kit}</table><p class="pr-s">* the sources give no quantity for this line: counted once.</p>` +
      `<p class="pr-s">Visual guide only. Follow the service manual.</p>`;
    document.body.appendChild(d);
    addEventListener('afterprint', () => d.remove(), {once: true});
    window.print();
  }

  function renderList() {
    const M = MODES[G.mode];
    if (!M) return (list.innerHTML = '<p class="vt-src">Pick TEAR DOWN or REBUILD below to see its steps.</p>');
    list.innerHTML =
      `<div class="vt-lh">${esc(M.label)} · ${count(G.mode)} of ${M.steps.length} done</div>` +
      M.steps.map((s) => `<div class="vt-srow${s.n === G.n ? ' on' : ''}${isDone(G.mode, s.n) ? ' done' : ''}" data-n="${s.n}"><input type="checkbox" aria-label="Step ${s.n} done"${isDone(G.mode, s.n) ? ' checked' : ''}><b>${nn(s.n)}</b><span>${esc(s.title)}${s.added ? ' <em>· added step, not in the manual’s list</em>' : ''}</span>${s.calls.length ? '<i title="has a note">!</i>' : ''}</div>`).join('');
    list.querySelector('.vt-srow.on')?.scrollIntoView({block: 'nearest'});
  }
  list.addEventListener('click', (e) => {
    const r = e.target.closest('.vt-srow');
    if (!r) return;
    const n = Number(r.dataset.n);
    fin[G.mode] = false; // a click on a row or its checkbox goes to that step: steps n to 29 are not done
    go(G.mode, n);
  });

  function renderCard() {
    const M = MODES[G.mode];
    if (!M) return card.classList.remove('show');
    const s = M.steps[G.n - 1];
    const N = M.steps.length;
    const names = partLine(s.parts);
    card.innerHTML =
      `<div class="vt-sb"><div class="vt-sh"><span>${esc(M.label)}</span><b>${nn(s.n)}</b><i>/ ${N}</i></div>` +
      `<div class="vt-st">${esc(s.title)}</div>` +
      (s.added ? `<div class="vt-add">${esc(ADDED_STEP)}</div>` : '') +
      (names.length ? `<div class="vt-sp">${s.parts.map((id, k) => `<button data-id="${esc(id)}">${esc(names[k])}</button>`).join('')}</div>` : '') +
      (s.note ? `<div class="vt-note">${esc(s.note)}</div>` : '') +
      s.calls.map((c) => `<div class="vt-call">${esc(c)}</div>`).join('') + `</div>` +
      // run 23 (item 3): the progress line is its own pinned row under the scrolling chips, note and callouts, above Back / Done / Next
      `<div class="vt-pg"><div class="vt-prog" style="--n:${N}">${M.steps.map((t) => `<i class="${isDone(G.mode, t.n) ? 'd' : ''}${t.n === s.n ? ' c' : ''}"></i>`).join('')}</div>` +
      `<div class="vt-pl">${count(G.mode)} of ${N} done</div></div>` +
      `<div class="vt-nav"><button class="iw-btn" data-go="-1"${s.n === 1 ? ' disabled' : ''}>Back</button><label><input type="checkbox"${isDone(G.mode, s.n) ? ' checked' : ''}> Done</label><button class="iw-btn" data-go="1"${s.n === N ? ' disabled' : ''}>Next</button></div>`;
    card.classList.add('show');
  }
  card.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b?.dataset.id) return onPart(b.dataset.id);
    if (b?.dataset.go) return Number(b.dataset.go) > 0 ? G.next() : go(G.mode, G.n - 1);
  });
  G.next = () => {
    const {mode, n} = G;
    if (mode && n < MODES[mode].steps.length) go(mode, n + 1);
  };
  // Done ticks the current step and moves to the next; on the last step it marks all of them done
  card.addEventListener('change', (e) => {
    if (!e.target.matches('input')) return;
    const {mode, n} = G;
    if (n < MODES[mode].steps.length) return go(mode, n + 1);
    fin[mode] = e.target.checked;
    save(KEY.fin, fin);
    render();
    G.onProgress?.();
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
      if (G.n !== last[m]) fin[m] = false;
      last[m] = G.n;
      save(KEY.step, last);
      save(KEY.fin, fin);
    }
    render();
    G.onProgress?.();
  };
  G.step = () => (G.mode ? MODES[G.mode].steps[G.n - 1] : null);
  G.card = card;
  G.views = {steps, notes: notesBox};
  return G;
}
