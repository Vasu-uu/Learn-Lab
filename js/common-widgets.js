/* Widgets shared by every course: reference tables, glossaries, flashcards, checklists, pickers */
(function () {
  'use strict';
  const U = CV.util;
  CV.REF = CV.REF || {};
  CV.GLOSSARIES = CV.GLOSSARIES || {};
  CV.DECKS = CV.DECKS || {};

  /* ================= mock app frames and code panels (Streamlit, Flask, …) ================= */
  /* ---------- shared styles for mock apps and code panels (used by the Flask course too) ---------- */
  if (!document.getElementById('mock-styles')) {
    const st = document.createElement('style');
    st.id = 'mock-styles';
    st.textContent = `
      .stm { border: 1px solid var(--border-2); border-radius: 12px; overflow: hidden; background: var(--bg); font-size: 14px; }
      .stm-bar { display: flex; align-items: center; gap: 6px; padding: 7px 10px; border-bottom: 1px solid var(--border); background: var(--surface-2); font: 11.5px var(--mono); color: var(--text-3); }
      .stm-bar i { width: 9px; height: 9px; border-radius: 50%; background: var(--border-2); }
      .stm-bar span { margin-left: 8px; flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      .stm-bar b { font-weight: 600; color: var(--text-2); }
      .stm-body { display: flex; min-height: 220px; }
      .stm-side { width: 34%; max-width: 200px; padding: 14px; background: var(--surface-2); border-right: 1px solid var(--border); }
      .stm-main { flex: 1; min-width: 0; padding: 16px 20px 20px; }
      .stm h1 { font-size: 24px; margin: 0 0 10px; font-weight: 700; letter-spacing: -.01em; }
      .stm h2 { font-size: 19px; margin: 12px 0 8px; } .stm h3 { font-size: 16px; margin: 10px 0 6px; }
      .stm p { margin: 0 0 10px; }
      .stm-w { margin-bottom: 12px; } .stm-w label, .stm-lab { display: block; font-size: 13px; color: var(--text-2); margin-bottom: 4px; }
      .stm input[type=text], .stm input[type=number], .stm input[type=date], .stm select, .stm textarea { width: 100%; height: 34px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--border-2); background: var(--surface); color: var(--text); font: 14px var(--font); }
      .stm-btn { height: 34px; padding: 0 14px; border-radius: 8px; border: 1px solid var(--border-2); background: var(--surface); color: var(--text); font: 600 13.5px var(--font); cursor: pointer; transition: transform .15s, border-color .15s; }
      .stm-btn:hover { border-color: var(--text); } .stm-btn:active { transform: scale(.97); }
      .stm-btn.pri { background: var(--text); color: var(--bg); border-color: var(--text); }
      .stm-metric small { display: block; font-size: 13px; color: var(--text-2); } .stm-metric b { font-size: 30px; font-weight: 600; line-height: 1.2; } .stm-metric em { font-style: normal; font-size: 13px; color: var(--ok); }
      .stm-alert { padding: 10px 14px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--border); background: var(--surface-2); }
      .stm-alert.ok { border-left: 3px solid var(--ok); } .stm-alert.warn { border-left: 3px solid var(--warn); } .stm-alert.err { border-left: 3px solid var(--bad); } .stm-alert.info { border-left: 3px solid var(--text-3); }
      .stm-cols { display: grid; gap: 12px; } .stm-box { border: 1px dashed var(--border-2); border-radius: 8px; padding: 10px; min-height: 54px; font: 12px var(--mono); color: var(--text-3); }
      .stm-tabs { display: flex; gap: 16px; border-bottom: 1px solid var(--border); margin-bottom: 10px; } .stm-tabs span { padding: 6px 0; font-size: 13.5px; color: var(--text-3); cursor: pointer; } .stm-tabs span.on { color: var(--text); box-shadow: inset 0 -2px var(--text); }
      .stm-exp { border: 1px solid var(--border); border-radius: 8px; margin-bottom: 10px; } .stm-exp > div:first-child { padding: 8px 12px; cursor: pointer; font-size: 13.5px; } .stm-exp > div + div { padding: 0 12px 10px; }
      .stm-table { width: 100%; border-collapse: collapse; font: 12.5px var(--mono); } .stm-table td, .stm-table th { padding: 5px 8px; border: 1px solid var(--border); text-align: right; } .stm-table th { background: var(--surface-2); text-transform: none; letter-spacing: 0; color: var(--text-2); }
      .stm-flash { animation: stmFlash .9s var(--ease); } @keyframes stmFlash { 0% { box-shadow: 0 0 0 2px var(--text); } 100% { box-shadow: 0 0 0 2px transparent; } }
      .stm-chat { display: flex; gap: 10px; margin-bottom: 10px; } .stm-chat .av { flex: none; width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: var(--surface-3); font-size: 13px; } .stm-chat.user .av { background: var(--text); color: var(--bg); }
      .codep { border-radius: 12px; overflow: hidden; background: #0a0a0a; border: 1px solid #222; font: 12.5px/1.7 var(--mono); color: #e8e8e8; }
      .codep-h { padding: 6px 12px; border-bottom: 1px solid #1d1d1d; color: #7a7a7a; font-size: 11.5px; display: flex; justify-content: space-between; }
      .codep pre { margin: 0; padding: 10px 0; overflow-x: auto; } .codep .ln { display: block; padding: 0 14px; transition: background .15s; white-space: pre; }
      .codep .ln.hl { background: rgba(255,255,255,.14); box-shadow: inset 3px 0 #fff; } .codep .ln.run { background: rgba(255,255,255,.06); }
      .runs { display: inline-flex; align-items: center; gap: 6px; font: 600 12px var(--mono); padding: 3px 9px; border-radius: 99px; border: 1px solid var(--border-2); color: var(--text-2); }
      .runs.bump { animation: bump .5s var(--spring); }
    `;
    document.head.append(st);
  }

  /* ---------- helpers ---------- */
  const H = (CV.mock = {});
  H.frame = (parent, { title = 'localhost:8501', side = false } = {}) => {
    const sideEl = U.el('div', { class: 'stm-side' }), mainEl = U.el('div', { class: 'stm-main' });
    const bar = U.el('div', { class: 'stm-bar', html: `<i></i><i></i><i></i><span>${title}</span>` });
    const body = U.el('div', { class: 'stm-body' }, sideEl, mainEl);
    const frame = U.el('div', { class: 'stm' }, bar, body);
    sideEl.style.display = side ? '' : 'none';
    parent.append(frame);
    return { frame, side: sideEl, main: mainEl, bar, setTitle: (t) => (bar.querySelector('span').innerHTML = t), showSide: (v) => (sideEl.style.display = v ? '' : 'none') };
  };
  H.code = (parent, title = 'app.py') => {
    const wrap = U.el('div', { class: 'codep' }), head = U.el('div', { class: 'codep-h', html: `<span>${title}</span><span></span>` }), pre = U.el('pre');
    wrap.append(head, pre); parent.append(wrap);
    let lines = [];
    const api = {
      set(src) { lines = src.replace(/^\n+|\s+$/g, '').split('\n'); pre.innerHTML = lines.map((l) => `<span class="ln">${U.highlight(l) || ' '}</span>`).join(''); return api; },
      hl(i, cls = 'hl') { pre.querySelectorAll('.ln').forEach((e, k) => e.classList.toggle(cls, Array.isArray(i) ? i.includes(k) : k === i)); },
      clear() { pre.querySelectorAll('.ln').forEach((e) => e.classList.remove('hl', 'run')); },
      note(t) { head.lastChild.textContent = t; },
      count: () => lines.length,
      el: wrap,
    };
    return api;
  };
  /* animate execution top-to-bottom, then call done() */
  H.run = (code, done, speed = 28) => {
    const n = code.count(); let i = 0;
    clearInterval(code._t);
    code._t = setInterval(() => { code.hl(i); i++; if (i > n) { clearInterval(code._t); code.clear(); done && done(); } }, speed);
  };
  const runsBadge = (parent) => { const b = U.el('span', { class: 'runs' }, 'reruns: 0'); parent.append(b); let n = 0; return { inc() { n++; b.textContent = `reruns: ${n}`; b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); return n; }, get n() { return n; }, reset() { n = 0; b.textContent = 'reruns: 0'; } }; };
  const fmt = (v) => (typeof v === 'string' ? `"${v}"` : Array.isArray(v) ? `[${v.map(fmt).join(', ')}]` : typeof v === 'boolean' ? (v ? 'True' : 'False') : v === null ? 'None' : String(v));
  const pytype = (v) => (typeof v === 'string' ? 'str' : Array.isArray(v) ? 'list' : typeof v === 'boolean' ? 'bool' : Number.isInteger(v) ? 'int' : typeof v === 'number' ? 'float' : v === null ? 'NoneType' : 'object');
  H.fmt = fmt; H.pytype = pytype; H.runsBadge = runsBadge;


  /* searchable table: opts.key → CV.REF[key], or inline opts.head + opts.rows */
  CV.widget('ref-table', { title: 'Reference', desc: '', tag: 'Searchable' }, (body, opts) => {
    const data = opts.rows ? opts : CV.REF[opts.key];
    const inp = U.el('input', { placeholder: 'Filter…', type: 'text' });
    body.append(U.el('div', { class: 'filter-row' }, inp));
    const host = U.el('div'); body.append(host);
    function draw() {
      const q = inp.value.trim().toLowerCase();
      const rows = data.rows.filter((r) => !q || r.join(' ').toLowerCase().includes(q));
      host.innerHTML = `<div class="tbl-wrap" style="margin:0"><table><thead><tr>${data.head.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${i && data.mono && data.mono.includes(i) ? ' style="font-family:var(--mono);font-size:13px"' : ''}>${c}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${data.head.length}" style="color:var(--text-3)">No matches</td></tr>`}</tbody></table></div>`;
    }
    inp.oninput = draw;
    draw();
  });

  /* glossary: opts.key → CV.GLOSSARIES[key] = [[term, meaning], …] */
  CV.widget('glossary', { title: 'Glossary', desc: 'Filter by term or meaning.', tag: 'Searchable' }, (body, opts) => {
    const terms = CV.GLOSSARIES[opts.key || 'cv'] || [];
    const inp = U.el('input', { placeholder: `Search ${terms.length} terms…`, type: 'text' });
    const count = U.el('span', { class: 'pill' });
    body.append(U.el('div', { class: 'filter-row' }, inp, count));
    const grid = U.el('div', { class: 'gloss-grid' }); body.append(grid);
    function draw() {
      const q = inp.value.trim().toLowerCase();
      const items = terms.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
      count.textContent = `${items.length} shown`;
      grid.innerHTML = items.map(([t, d], i) => `<div class="gloss" style="animation:pageIn .35s ${Math.min(i, 20) * 0.02}s both"><b>${t}</b><span>${d}</span></div>`).join('');
    }
    inp.oninput = draw;
    draw();
  });

  /* flashcards: opts.deck → CV.DECKS[deck] = [[section, [[q, a], …]], …] */
  CV.widget('flashcards', { title: 'Interview-style flashcards', desc: 'Say your answer out loud, flip, then mark how you did. Cards you miss come back sooner.', tag: 'Practice' }, (body, opts) => {
    const D = CV.DECKS[opts.deck || 'cv'] || [];
    const all = D.flatMap(([sec, qs]) => qs.map(([q, a]) => ({ sec, q, a })));
    let deck = all.slice(), i = 0, known = 0, again = 0;
    const top = U.el('div', { class: 'filter-row' }); body.append(top);
    U.seg(top, [['all', 'All'], ...D.map(([s]) => [s, s])], 'all', (v) => { deck = all.filter((c) => v === 'all' || c.sec === v); i = 0; known = again = 0; draw(); });
    U.button(top, '🔀 Shuffle', () => { deck.sort(() => Math.random() - 0.5); i = 0; draw(); });
    const stageEl = U.el('div', { class: 'flash-stage' }); body.append(stageEl);
    const flip = U.el('div', { class: 'flip' }), inner = U.el('div', { class: 'flip-inner' });
    const front = U.el('div', { class: 'flip-face' }), back = U.el('div', { class: 'flip-face flip-back' });
    inner.append(front, back); flip.append(inner);
    flip.onclick = () => flip.classList.toggle('on');
    const btns = U.el('div', { class: 'w-btns' }), prog = U.el('div', { class: 'w-note', style: 'text-align:center' });
    stageEl.append(prog, flip, btns);
    U.button(btns, '✗ Again', () => { again++; deck.splice(Math.min(deck.length, i + 3), 0, deck[i]); next(); }, 'btn btn-sm');
    U.button(btns, '✓ Got it', () => { known++; next(); }, 'btn btn-sm btn-primary');
    function next() { flip.classList.remove('on'); setTimeout(() => { i++; if (i >= deck.length) { i = 0; CV.confetti && CV.confetti(); } draw(); }, 250); }
    function draw() {
      const c = deck[i]; if (!c) return;
      front.innerHTML = `<span class="q-n">${c.sec} · card ${i + 1} / ${deck.length}</span><div class="q-t">${c.q}</div><span class="hint" style="margin:14px auto 0">↻ tap to flip</span>`;
      back.innerHTML = `<span class="q-n">Answer</span><div class="q-a">${c.a}</div>`;
      prog.innerHTML = `✓ ${known} known · ↺ ${again} to revisit`;
    }
    draw();
  });

  /* picker: click a situation, get the answer. opts.items = [[label, answer], …] */
  CV.widget('picker', { title: 'Pick a situation', desc: '', tag: 'Decision helper' }, (body, opts) => {
    const list = U.el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px' });
    const ans = U.el('div', { class: 'w-out', style: 'margin-top:14px;min-height:60px', html: opts.prompt || 'Select an option above.' });
    body.append(list, ans);
    opts.items.forEach(([s, f], i) => {
      const b = U.el('button', { type: 'button', class: 'opt', style: 'font-size:13.5px;padding:10px 12px' }, U.el('span', { class: 'ol' }, String(i + 1)), U.el('span', { html: s }));
      b.onclick = () => { list.querySelectorAll('.opt').forEach((x) => x.classList.remove('right')); b.classList.add('right'); ans.innerHTML = `<b>${s}</b>\n→ ${f}`; };
      list.append(b);
    });
  });

  /* checklist with persistence: opts.id, opts.items = [[label, detail], …] */
  CV.widget('checklist', { title: 'Checklist', desc: 'Tick items as you go. Saved in this browser.', tag: 'Checklist' }, (body, opts) => {
    const S = CV.state || {}; S.checklists = S.checklists || {};
    const st = (S.checklists[opts.id] = S.checklists[opts.id] || {});
    const bar = U.el('div', { class: 'overall', style: 'margin-bottom:12px' }); body.append(bar);
    const list = U.el('div', { style: 'display:flex;flex-direction:column;gap:6px' }); body.append(list);
    const paint = () => { const n = opts.items.filter((_, i) => st[i]).length; bar.innerHTML = `<div class="overall-top"><span>${opts.label || 'Done'}</span><span>${n}/${opts.items.length}</span></div><div class="overall-bar"><i style="width:${(n / opts.items.length) * 100}%"></i></div>`; };
    opts.items.forEach(([l, d], i) => {
      const cb = U.el('input', { type: 'checkbox' }); cb.checked = !!st[i];
      cb.onchange = () => { st[i] = cb.checked; CV.save && CV.save(); paint(); };
      list.append(U.el('label', { class: 'check', style: 'align-items:flex-start;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface)' }, cb, U.el('span', { html: `<b style="color:var(--text)">${l}</b>${d ? `<br><span style="font-size:13px">${d}</span>` : ''}` })));
    });
    paint();
  });
})();
