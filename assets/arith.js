/* ==========================================================================
   arith.js — shared engine for the arithmetic drill games.
   A page sets   window.ARITH = { op: '+' | '-', id, title, emoji }
   and then loads this script. See GAMES_GUIDE.md ("Arithmetic games").
   ========================================================================== */
(function () {
  'use strict';
  const { h } = Kit;
  const G = window.ARITH;
  const SIGN = G.op === '+' ? '+' : '−';

  const RANGES = ['', '1–9', '10–99', '100–999', '1000–9999', '10000–99999'];
  const digitOptions = [1, 2, 3, 4, 5].map(n => ({ value: String(n), label: String(n), hint: RANGES[n] }));
  const SCHEMA = [
    { key: 'a', label: 'Digits in the first number', default: '1', options: digitOptions },
    { key: 'b', label: 'Digits in the second number', default: '1', options: digitOptions }
  ];
  if (G.op === '-') {
    SCHEMA.push({ key: 'neg', label: 'Answers below zero?', default: 'no', options: [
      { value: 'no', label: 'No', hint: 'bigger number on top' },
      { value: 'yes', label: 'Yes', hint: 'e.g. 3 − 8 = −5' } ] });
  }

  // Without negative answers, the 2nd number can't be longer than the 1st.
  function adjust(v, changed) {
    if (G.op !== '-' || v.neg === 'yes' || +v.b <= +v.a) return '';
    if (changed === 'b') v.a = v.b; else v.b = v.a;
    return 'The second number can’t be longer than the first unless answers below zero are allowed.';
  }

  const app = document.getElementById('app');
  const init = Kit.readSettings(SCHEMA);
  Kit.wireHeader(init.settings);
  if (init.setup) {
    Kit.renderSetup(app, { id: G.id, title: G.title + ' settings', emoji: G.emoji, schema: SCHEMA, adjust, initial: init });
    return;
  }

  const S = init.settings;
  adjust(S, 'a');
  const da = +S.a, db = +S.b;
  const NEG = S.neg === 'yes';
  const width = Math.max(da, db + 2, Math.max(da, db) + 1) + (NEG ? 1 : 0);

  /* ---- problems ------------------------------------------------------- */
  const rnd = d => (d === 1 ? Kit.randInt(1, 9) : Kit.randInt(10 ** (d - 1), 10 ** d - 1));
  function makeProblem(prev) {
    for (;;) {
      let x = rnd(da), y = rnd(db);
      if (G.op === '-' && !NEG && y > x) [x, y] = [y, x];
      if (prev && prev.x === x && prev.y === y && da + db > 2) continue;
      return { x, y, ans: G.op === '+' ? x + y : x - y, tries: 0, firstAnswer: null, ms: 0 };
    }
  }

  /* ---- state ---------------------------------------------------------- */
  let rows, cur, stars, solved, qsw, gsw, tick;
  let input, goBtn, xEl, yEl, fb, qEl, starEl, timeEl;

  /* ---- screens -------------------------------------------------------- */
  // A tap is needed before the phone keyboard can open, so the game begins
  // with a single Start button (Enter on desktop).
  function ready() {
    // Touch devices use our own number pad, so no keyboard needs a tap to open.
    if (Kit.isTouch()) { play(); return; }
    const start = h('button', { class: 'btn primary big', onclick: play }, '▶ Start');
    app.replaceChildren(h('section', { class: 'card center' },
      h('div', { class: 'big-emoji' }, G.emoji),
      h('h2', null, 'Ready?'),
      h('p', null, da + '-digit ' + SIGN + ' ' + db + '-digit numbers', NEG ? ' · answers can be below zero' : ''),
      start,
      h('p', { class: 'muted' }, 'Type the answer, press ', h('kbd', null, 'Enter'), '. Press ',
        h('kbd', null, 'Enter'), ' again for the next one. ', h('kbd', null, 'Esc'), ' ends the game.',
        NEG ? [' Type ', h('kbd', null, '-'), ' or tap ', h('b', null, '±'), ' for a minus sign.'] : null)));
    start.focus();
  }

  function play() {
    rows = [];
    stars = 0;
    cur = null;
    clearInterval(tick);

    qEl = h('span', { class: 'pill' });
    starEl = h('span', { class: 'pill' });
    timeEl = h('span', { class: 'pill' });
    const endBtn = h('button', { class: 'btn small', type: 'button', onclick: end }, '■ End');

    // On a phone or tablet the system keyboard would cover half the screen, so
    // touch devices get our own compact number pad instead (inputmode="none"
    // keeps the system keyboard closed). Desktops type on the real keyboard.
    const touch = Kit.isTouch();
    xEl = h('span');
    yEl = h('span');
    input = h('input', {
      class: 'ans', id: 'ans', type: 'text', inputmode: touch ? 'none' : 'numeric', pattern: '[0-9]*',
      autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'go',
      'aria-label': 'Your answer'
    });
    // ↵ is inside the form on desktop; on touch it is part of the number pad.
    goBtn = h('button', touch
      ? { class: 'btn primary go', type: 'button', 'aria-label': 'Enter', onclick: submit }
      : { class: 'btn primary go', type: 'submit', 'aria-label': 'Enter' }, '↵');
    // Phone number pads often have no minus key, hence the ± button.
    const signBtn = NEG ? h('button', { class: 'btn sign', type: 'button', 'aria-label': 'Minus sign', onclick: toggleSign }, '±') : null;
    const form = h('form', { class: 'play', novalidate: true },
      h('div', { class: 'sum', style: '--w:' + width },
        h('div', { class: 'sum-row' }, xEl),
        h('div', { class: 'sum-row op' }, h('span', null, SIGN), yEl),
        h('div', { class: 'sum-line' }),
        input),
      touch ? null : h('div', { class: 'keys' }, signBtn, goBtn));
    fb = h('div', { class: 'feedback', 'aria-live': 'polite' });
    Kit.keepFocus(goBtn, endBtn);
    if (signBtn) Kit.keepFocus(signBtn);

    let pad = null;
    if (touch) {
      const key = (label, aria, fn, cls) => {
        const b = h('button', { class: 'btn key ' + (cls || ''), type: 'button', 'aria-label': aria, onclick: fn }, label);
        Kit.keepFocus(b);
        return b;
      };
      const digit = d => key(String(d), String(d), () => typeDigit(String(d)));
      Kit.keepFocus(goBtn);
      pad = h('div', { class: 'pad' },
        h('div', { class: 'digits' },
          [1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit),
          signBtn ? (signBtn.classList.add('key'), signBtn) : h('span'),
          digit(0),
          key('⌫', 'Delete', backspace, 'back')),
        goBtn);
    }

    form.addEventListener('submit', e => { e.preventDefault(); submit(); });
    input.addEventListener('input', () => {
      if (solved) { input.value = String(cur.ans); return; }
      input.value = clean(input.value);
    });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); end(); } });

    app.replaceChildren(h('div', { class: 'pills play-stats' }, qEl, starEl, timeEl, endBtn),
      h('div', { class: touch ? 'arena touch' : 'arena' }, h('div', { class: 'arena-main' }, form, fb), pad));

    gsw = Kit.stopwatch();
    qsw = Kit.stopwatch();
    tick = setInterval(() => { timeEl.textContent = '⏱ ' + Kit.fmtTime(gsw.ms()); }, 250);
    next();
  }

  function next() {
    cur = makeProblem(cur);
    solved = false;
    xEl.textContent = cur.x;
    yEl.textContent = cur.y;
    input.value = '';
    input.className = 'ans';
    goBtn.textContent = '↵';
    goBtn.setAttribute('aria-label', 'Enter');
    fb.className = 'feedback';
    fb.textContent = '';
    qEl.textContent = 'Q ' + (rows.length + 1);
    starEl.textContent = '⭐ ' + stars;
    timeEl.textContent = '⏱ ' + Kit.fmtTime(gsw.ms());
    qsw.reset();
    input.focus();
  }

  // Digits only, plus a leading minus when negative answers are allowed.
  function clean(raw) {
    const minus = NEG && /[-−]/.test(raw);
    return (minus ? '-' : '') + raw.replace(/\D/g, '').slice(0, 7);
  }

  function typeDigit(d) {
    if (solved) return;
    input.value = clean(input.value + d);
  }

  function backspace() {
    if (solved) return;
    input.value = input.value.slice(0, -1);
  }

  function toggleSign() {
    input.focus();
    if (solved) return;
    const v = input.value;
    input.value = v.startsWith('-') ? v.slice(1) : '-' + v;
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function submit() {
    input.focus();
    if (solved) { next(); return; }
    const v = input.value.trim();
    if (v === '' || v === '-') { Kit.flash(input, 'shake'); return; }
    cur.tries++;
    if (cur.firstAnswer === null) cur.firstAnswer = +v;
    if (+v === cur.ans) {
      cur.ms = qsw.stop();
      solved = true;
      rows.push(cur);
      if (cur.tries === 1) stars++;
      starEl.textContent = '⭐ ' + stars;
      input.className = 'ans good';
      Kit.flash(input, 'pop');
      goBtn.textContent = 'Next';
      goBtn.setAttribute('aria-label', 'Next question');
      fb.className = 'feedback ok';
      fb.replaceChildren(cur.tries === 1 ? '⭐ Correct, first try!' : '✓ Correct!',
        h('small', null, Kit.isTouch() ? 'Tap Next for the next one' : 'Press Enter for the next one'));
    } else {
      input.value = '';
      input.className = 'ans bad';
      Kit.flash(input, 'shake');
      fb.className = 'feedback no';
      fb.replaceChildren('Not quite — try again!');
    }
  }

  function end() {
    clearInterval(tick);
    const total = gsw.stop();
    const firstTry = rows.filter(r => r.tries === 1).length;
    const answeredMs = rows.reduce((s, r) => s + r.ms, 0);

    const replay = h('button', { class: 'btn primary big', onclick: play }, '🔁 Replay');
    const body = [
      h('div', { class: 'center' },
        h('div', { class: 'big-emoji' }, rows.length && firstTry === rows.length ? '🏆' : '🎉'),
        h('h2', null, rows.length ? 'Well done!' : 'Game over')),
      h('div', { class: 'stat-cards' },
        h('div', { class: 'card' }, h('b', null, firstTry + ' / ' + rows.length), h('span', null, '⭐ right first try')),
        h('div', { class: 'card' }, h('b', null, Kit.fmtTime(total)), h('span', null, '⏱ total time')),
        h('div', { class: 'card' }, h('b', null, rows.length ? Kit.fmtTime(answeredMs / rows.length) : '–'),
          h('span', null, '⌛ per question')))
    ];
    if (rows.length) {
      body.push(h('div', { class: 'table-wrap' }, h('table', { class: 'results' },
        h('thead', null, h('tr', null,
          ['#', 'Question', 'Answer', 'First try', 'Tries', 'Time'].map(t => h('th', null, t)))),
        h('tbody', null, rows.map((r, i) => h('tr', null,
          h('td', null, i + 1),
          h('td', null, r.x + ' ' + SIGN + ' ' + r.y),
          h('td', null, r.ans),
          r.tries === 1 ? h('td', { class: 'yes' }, '✓') : h('td', { class: 'no' }, '✗ (' + r.firstAnswer + ')'),
          h('td', null, r.tries),
          h('td', null, Kit.fmtTime(r.ms))))))));
    }
    if (!solved && cur && cur.tries) {
      body.push(h('p', { class: 'muted center' }, 'The last question (' + cur.x + ' ' + SIGN + ' ' + cur.y + ') was not finished, so it is not counted.'));
    }
    body.push(h('div', { class: 'row' }, replay, h('a', { class: 'btn', href: 'index.html' }, '🏠 Main screen')));
    app.replaceChildren(...body);
    window.scrollTo(0, 0);
    replay.focus();
  }

  ready();
})();
