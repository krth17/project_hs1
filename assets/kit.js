/* ==========================================================================
   kit.js — tiny shared toolkit for every game page.
   Plain script (no modules, no fetch) so pages also work when opened
   straight from disk (file://) as well as on GitHub Pages.
   API reference: GAMES_GUIDE.md, section "Kit API".
   ========================================================================== */
(function () {
  'use strict';
  const Kit = {};

  /* ---- DOM ------------------------------------------------------------- */
  Kit.$ = (sel, root) => (root || document).querySelector(sel);

  // h('div', {class: 'x', onclick: fn, hidden: true}, 'text', node, [more])
  Kit.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      el.append(kid instanceof Node ? kid : String(kid));
    }
    return el;
  };

  // Restart a one-shot CSS animation class (e.g. 'shake', 'pop').
  Kit.flash = function (el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };

  // Buttons that must not steal focus from a text field (keeps the phone
  // keyboard up). Call on every button shown next to an answer box.
  Kit.keepFocus = function (...buttons) {
    buttons.forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));
  };

  /* ---- random & time --------------------------------------------------- */
  Kit.randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  Kit.pick = arr => arr[Math.floor(Math.random() * arr.length)];
  Kit.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  Kit.fmtTime = function (ms) {
    const s = ms / 1000;
    if (s < 60) return s.toFixed(1) + ' s';
    const m = Math.floor(s / 60), r = Math.floor(s % 60);
    return m + ':' + String(r).padStart(2, '0');
  };

  Kit.stopwatch = function () {
    let t0 = performance.now(), end = null;
    return {
      reset() { t0 = performance.now(); end = null; },
      stop() { if (end === null) end = performance.now(); return end - t0; },
      ms() { return (end === null ? performance.now() : end) - t0; }
    };
  };

  /* ---- storage (convenience only; may be unavailable) ------------------ */
  Kit.store = {
    get(k) { try { return JSON.parse(localStorage.getItem('eduplay:' + k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('eduplay:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---- settings -------------------------------------------------------- */
  // schema: [{ key, label, default, options: [{ value, label, hint? }] }]
  // Settings live in the URL query (?level=2&list=no) so Replay and
  // bookmarks keep them. "?setup" shows the settings page instead.
  Kit.readSettings = function (schema) {
    const q = new URLSearchParams(location.search);
    const settings = {};
    let fromUrl = false;
    for (const f of schema) {
      const v = q.get(f.key);
      const ok = f.options.some(o => String(o.value) === v);
      if (ok) fromUrl = true;
      settings[f.key] = ok ? v : String(f.default);
    }
    return { settings, fromUrl, setup: q.has('setup') };
  };

  Kit.query = settings => '?' + new URLSearchParams(settings).toString();

  // Points the ⚙️ button (id="gear") at the settings page, pre-filled with
  // the settings currently in play.
  Kit.wireHeader = function (settings) {
    const gear = document.getElementById('gear');
    if (gear) gear.href = '?setup&' + new URLSearchParams(settings).toString();
  };

  // Renders the settings page into `root`.
  // game: { id, title, emoji, schema, initial (from readSettings),
  //         adjust?(values, changedKey) -> note string; may edit values }
  Kit.renderSetup = function (root, game) {
    const { h } = Kit;
    const { id, title, emoji, schema, adjust, initial } = game;
    const saved = Kit.store.get('setup:' + id);
    const start = Object.assign({}, initial.fromUrl ? initial.settings : (saved || initial.settings));
    for (const f of schema) {
      if (!f.options.some(o => String(o.value) === String(start[f.key]))) start[f.key] = String(f.default);
    }

    const form = h('form', { class: 'setup card' },
      h('div', { class: 'setup-head' }, h('span', { class: 'big-emoji' }, emoji), h('h2', null, title)));
    for (const f of schema) {
      const seg = h('div', { class: 'seg' });
      for (const o of f.options) {
        seg.append(h('label', { class: 'seg-opt' },
          h('input', { type: 'radio', name: f.key, value: o.value, checked: String(o.value) === String(start[f.key]) }),
          h('span', null, h('b', null, o.label), o.hint ? h('small', null, o.hint) : null)));
      }
      form.append(h('fieldset', null, h('legend', null, f.label), seg));
    }
    const note = h('p', { class: 'setup-note' });
    const go = h('button', { type: 'submit', class: 'btn primary big' }, '▶ Start');
    form.append(note, h('div', { class: 'row' }, go, h('a', { class: 'btn', href: 'index.html' }, '🏠 Home')));

    function sync(changedKey) {
      const fd = new FormData(form), v = {};
      for (const f of schema) v[f.key] = String(fd.get(f.key));
      note.textContent = adjust ? (adjust(v, changedKey) || '') : '';
      for (const f of schema) {
        const inp = form.querySelector('input[name="' + f.key + '"][value="' + v[f.key] + '"]');
        if (inp) inp.checked = true;
      }
      return v;
    }
    form.addEventListener('change', e => sync(e.target.name));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = sync();
      Kit.store.set('setup:' + id, v);
      location.href = Kit.query(v);
    });

    root.replaceChildren(form);
    sync();
    go.focus();
  };

  Kit.isTouch = () => window.matchMedia('(pointer: coarse)').matches;

  window.Kit = Kit;
})();
