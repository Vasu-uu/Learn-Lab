/* Generative AI course demos: tokenisation, sampling, embeddings, RAG, agents */
(function () {
  'use strict';
  const U = CV.util;
  const BLUE = '#5b9cf5', ORANGE = '#e07a5f', GREEN = '#4caf7d', PURPLE = '#9d8fd6';
  const esc = U.esc;

  /* ======================= byte-pair encoding ======================= */
  CV.widget('gen-bpe', { title: 'Byte-pair encoding, merge by merge', desc: 'BPE starts from characters and repeatedly merges the most frequent adjacent pair into a new token. Edit the training text and step through the merges.' }, (body) => {
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const left = U.el('div', { class: 'w-col' }), right = U.el('div', { class: 'w-col w-controls' }); row.append(left, right);
    const ta = U.el('textarea', { class: 'w-input', style: 'width:100%;height:84px;padding:10px;font:13px/1.5 var(--mono);resize:vertical' });
    ta.value = 'low lower lowest newer newest wider widest the slower runner runs';
    left.append(U.el('div', { class: 'canvas-label' }, 'Training text'), ta);
    const toks = U.el('div', { style: 'display:flex;flex-wrap:wrap;gap:4px;margin-top:12px;font:13px var(--mono)' }); left.append(U.el('div', { class: 'canvas-label', style: 'margin-top:12px' }, 'Tokenised text'), toks);
    let nMerges = 0;
    const sl = U.slider(right, { label: 'Number of merges', min: 0, max: 30, value: 0, onInput: (v) => { nMerges = v; run(); } });
    const bb = U.el('div', { class: 'w-btns' }); right.append(bb);
    U.button(bb, '+1 merge', () => { nMerges = Math.min(30, nMerges + 1); sl.set(nMerges); run(); });
    U.button(bb, 'Reset', () => { nMerges = 0; sl.set(0); run(); });
    const out = U.out(right);
    ta.oninput = run;
    function run() {
      let words = ta.value.trim().split(/\s+/).filter(Boolean).map((w) => [...w, '_']);
      const merges = [];
      for (let m = 0; m < nMerges; m++) {
        const cnt = new Map();
        words.forEach((w) => { for (let i = 0; i < w.length - 1; i++) { const k = w[i] + '\u0000' + w[i + 1]; cnt.set(k, (cnt.get(k) || 0) + 1); } });
        let best = null, bc = 1;
        cnt.forEach((v, k) => { if (v > bc) { bc = v; best = k; } });
        if (!best) break;
        const [a, b] = best.split('\u0000');
        merges.push(`${a}+${b} → ${a + b} (×${bc})`);
        words = words.map((w) => { const o = []; for (let i = 0; i < w.length; i++) { if (i < w.length - 1 && w[i] === a && w[i + 1] === b) { o.push(a + b); i++; } else o.push(w[i]); } return o; });
      }
      const pal = [BLUE, ORANGE, GREEN, PURPLE, '#d4a73a'];
      toks.innerHTML = words.map((w) => w.map((t, i) => `<span style="padding:2px 5px;border-radius:5px;background:${pal[(t.length + i) % pal.length]}33;border:1px solid ${pal[(t.length + i) % pal.length]}88">${esc(t)}</span>`).join('')).join('<span style="width:8px"></span>');
      const vocab = new Set(words.flat());
      const start = ta.value.replace(/\s+/g, '').length + words.length;
      out.innerHTML = `Tokens: <b>${words.flat().length}</b> (started with ${start} characters)\nDistinct tokens in use: ${vocab.size}\n\nLast merges:\n${merges.slice(-6).map((m) => '  ' + m).join('\n') || '  (none yet)'}\n\n"_" marks the end of a word. Frequent words become single tokens; rare words stay split into pieces.`;
    }
    run();
  });

  /* ======================= next-token sampling ======================= */
  CV.widget('gen-sampling', { title: 'Next-token sampling: temperature, top-k, top-p', desc: 'The model scores every token in its vocabulary. Decoding settings reshape that distribution before one token is drawn.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const ctxLine = U.el('div', { class: 'w-out', style: 'margin-bottom:12px' }); stage.append(ctxLine);
    const bars = U.el('div', { class: 'bars' }); stage.append(bars);
    const VOC = [['mat', 3.1], ['floor', 2.6], ['sofa', 2.3], ['bed', 2.0], ['roof', 1.4], ['keyboard', 1.1], ['moon', 0.2], ['spreadsheet', -0.6], ['idea', -1.0], ['purple', -1.6]];
    let temp = 1, topk = 10, topp = 1, text = 'The cat sat on the', rnd = U.rand(3);
    U.slider(ctl, { label: 'Temperature', min: 0.05, max: 2.5, step: 0.05, value: temp, fmt: (v) => v.toFixed(2), onInput: (v) => { temp = v; draw(); } });
    U.slider(ctl, { label: 'Top-k', min: 1, max: 10, value: topk, onInput: (v) => { topk = v; draw(); } });
    U.slider(ctl, { label: 'Top-p (nucleus)', min: 0.05, max: 1, step: 0.05, value: topp, fmt: (v) => v.toFixed(2), onInput: (v) => { topp = v; draw(); } });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    const hist = [];
    U.button(bb, 'Sample 20×', () => { for (let i = 0; i < 20; i++) hist.push(sample()); draw(); });
    U.button(bb, 'Clear', () => { hist.length = 0; draw(); });
    const out = U.out(ctl);
    function dist() {
      const z = VOC.map(([, l]) => l / temp), m = Math.max(...z), e = z.map((v) => Math.exp(v - m)), s = e.reduce((a, b) => a + b);
      let p = e.map((v) => v / s);
      const order = p.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
      const keep = new Set(); let cum = 0;
      for (const [v, i] of order) { if (keep.size >= topk) break; if (cum >= topp && keep.size) break; keep.add(i); cum += v; }
      const raw = p.slice();
      p = p.map((v, i) => (keep.has(i) ? v : 0)); const s2 = p.reduce((a, b) => a + b); p = p.map((v) => v / s2);
      return { raw, p, keep };
    }
    function sample() { const { p } = dist(); let r = rnd(), i = 0; while ((r -= p[i]) > 0 && i < p.length - 1) i++; return VOC[i][0]; }
    function draw() {
      const { raw, p, keep } = dist();
      ctxLine.innerHTML = `${esc(text)} <b>▁</b>`;
      bars.innerHTML = VOC.map(([t], i) => `<div class="bar-row" style="opacity:${keep.has(i) ? 1 : 0.35}"><span>${t}</span><div class="track"><div class="fill" style="width:${p[i] * 100}%"></div></div><span class="v">${(p[i] * 100).toFixed(1)}%</span></div>`).join('');
      const H = -p.reduce((s, v) => s + (v > 0 ? v * Math.log2(v) : 0), 0);
      const counts = {}; hist.forEach((t) => (counts[t] = (counts[t] || 0) + 1));
      out.innerHTML = `Candidates kept: <b>${keep.size}</b>\nEntropy: ${H.toFixed(2)} bits\n\n${temp < 0.3 ? 'Low temperature ≈ greedy: always "mat". Safe but repetitive.' : temp > 1.5 ? 'High temperature flattens the distribution: creative, then incoherent.' : 'Moderate settings: varied but sensible.'}` +
        (hist.length ? `\n\nSamples (${hist.length}): ${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}×${n}`).join(', ')}` : '');
    }
    draw();
  });

  /* ======================= embedding space ======================= */
  CV.widget('gen-embeddings', { title: 'Embeddings: meaning as geometry', desc: 'Sentences mapped to vectors (projected to 2D). Type a query: it is embedded and the nearest sentences by cosine similarity are highlighted.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 400px' });
    const W = 420, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    // hand-made 2D "embeddings" with a topic axis layout; words drive query placement
    const DOCS = [
      ['How do I reset my password?', [0.06, 0.12], 'account'], ['I forgot my login credentials', [0.1, 0.2], 'account'], ['Change the email on my account', [0.05, 0.28], 'account'],
      ['My card was charged twice', [0.56, 0.12], 'billing'], ['Request a refund for my order', [0.6, 0.2], 'billing'], ['Update my payment method', [0.55, 0.28], 'billing'],
      ['The app crashes on startup', [0.06, 0.66], 'bug'], ['Error message when uploading files', [0.1, 0.74], 'bug'], ['Page loads very slowly', [0.05, 0.82], 'bug'],
      ['Where is my parcel?', [0.56, 0.66], 'shipping'], ['Delivery is late', [0.6, 0.74], 'shipping'], ['Change my shipping address', [0.55, 0.82], 'shipping'],
    ];
    const KW = { account: ['password', 'login', 'account', 'email', 'sign', 'forgot', 'username', 'credential'], billing: ['charge', 'refund', 'payment', 'card', 'bill', 'invoice', 'money', 'price', 'paid'], bug: ['crash', 'error', 'bug', 'slow', 'broken', 'upload', 'freeze', 'load'], shipping: ['parcel', 'package', 'delivery', 'ship', 'late', 'track', 'address', 'arrive', 'order'] };
    const CENT = { account: [0.07, 0.2], billing: [0.57, 0.2], bug: [0.07, 0.74], shipping: [0.57, 0.74] };
    const COL = { account: BLUE, billing: ORANGE, bug: PURPLE, shipping: GREEN };
    const inp = U.el('input', { class: 'w-input', style: 'width:100%', value: 'I was billed two times' });
    ctl.append(U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Query'), inp));
    let k = 3;
    U.slider(ctl, { label: 'Top-k results', min: 1, max: 6, value: k, onInput: (v) => { k = v; draw(); } });
    const out = U.out(ctl);
    inp.oninput = draw;
    const vec = ([x, y]) => [x - 0.32, y - 0.47, 0.25];
    const cos = (a, b) => { const d = a.reduce((s, v, i) => s + v * b[i], 0); return d / (Math.hypot(...a) * Math.hypot(...b)); };
    function embedQuery(q) {
      const words = q.toLowerCase().match(/[a-z]+/g) || [];
      const score = {}; Object.keys(KW).forEach((t) => (score[t] = words.filter((w) => KW[t].some((k2) => { const L = Math.min(5, k2.length); return w.length >= L && w.slice(0, L) === k2.slice(0, L); })).length + 0.05));
      if (/twice|two times|double/.test(q.toLowerCase())) score.billing += 1;
      const tot = Object.values(score).reduce((a, b) => a + b);
      return Object.keys(score).reduce((p, t) => [p[0] + (CENT[t][0] * score[t]) / tot, p[1] + (CENT[t][1] * score[t]) / tot], [0, 0]);
    }
    function draw() {
      const q = embedQuery(inp.value), qv = vec(q);
      const ranked = DOCS.map((d, i) => [cos(qv, vec(d[1])), i]).sort((a, b) => b[0] - a[0]);
      const top = new Set(ranked.slice(0, k).map((r) => r[1]));
      ctx.clearRect(0, 0, W, H);
      ctx.font = '11px Inter'; ctx.textBaseline = 'middle';
      DOCS.forEach(([t, [x, y], topic], i) => {
        if (top.has(i)) { ctx.strokeStyle = U.css('--text'); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(q[0] * W, q[1] * H); ctx.lineTo(x * W, y * H); ctx.stroke(); ctx.setLineDash([]); }
        ctx.fillStyle = COL[topic]; ctx.globalAlpha = top.has(i) ? 1 : 0.55; ctx.beginPath(); ctx.arc(x * W, y * H, top.has(i) ? 7 : 5, 0, 7); ctx.fill();
        ctx.fillStyle = U.css('--text-2'); ctx.textAlign = 'left'; ctx.fillText(t.length > 28 ? t.slice(0, 27) + '…' : t, x * W + 11, y * H);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = U.css('--text'); ctx.beginPath(); ctx.moveTo(q[0] * W, q[1] * H - 9); ctx.lineTo(q[0] * W + 8, q[1] * H + 6); ctx.lineTo(q[0] * W - 8, q[1] * H + 6); ctx.closePath(); ctx.fill();
      out.innerHTML = `Nearest by cosine similarity:\n${ranked.slice(0, k).map(([s, i]) => `  ${s.toFixed(3)}  ${esc(DOCS[i][0])}`).join('\n')}\n\ncos(a, b) = a·b / (‖a‖‖b‖)\nNo shared keywords are needed: "billed two times" lands near "charged twice".`;
    }
    draw();
    body.append(U.el('div', { class: 'w-note', html: 'A toy model with hand-placed vectors. Real embedding models output 384–3,072 dimensions learned with contrastive training, but the retrieval logic is exactly this.' }));
  });

  /* ======================= RAG pipeline ======================= */
  CV.widget('gen-rag', { title: 'Retrieval-augmented generation, step by step', desc: 'Ask a question about a small company handbook. Watch the pipeline chunk, embed, retrieve and build the prompt the LLM actually sees.' }, (body) => {
    const top = U.el('div', { class: 'w-row', style: 'align-items:flex-end' }); body.append(top);
    const qsel = U.el('select', { style: 'flex:1 1 260px' });
    const Q = ['How many vacation days do new employees get?', 'Can I work from home on Fridays?', 'What is the laptop refresh policy?', 'Who approves travel over ₹50,000?'];
    Q.forEach((q) => qsel.append(U.el('option', {}, q)));
    top.append(U.el('div', { class: 'ctl', style: 'flex:1 1 260px' }, U.el('div', { class: 'ctl-top' }, 'Question'), qsel));
    const bb = U.el('div', { class: 'w-btns' }); top.append(bb);
    const steps = ['1 Chunk', '2 Embed & index', '3 Retrieve', '4 Augment prompt', '5 Generate'];
    let cur = 0;
    const seg = U.el('div', { style: 'margin:14px 0 10px' }); body.append(seg);
    const view = U.el('div', { class: 'w-out', style: 'min-height:190px' }); body.append(view);
    U.button(bb, '◂ Back', () => { cur = Math.max(0, cur - 1); paint(); });
    U.button(bb, 'Next ▸', () => { cur = Math.min(steps.length - 1, cur + 1); paint(); });
    qsel.onchange = () => { cur = 2; paint(); };
    const CH = [
      ['leave.md#1', 'Full-time employees receive 18 days of paid vacation per year. In the first year, vacation accrues monthly (1.5 days per month).', ['vacation', 'days', 'new', 'leave', 'first', 'year']],
      ['leave.md#2', 'Sick leave is separate from vacation: 10 days per year, with a doctor\'s note needed after 3 consecutive days.', ['sick', 'leave', 'days']],
      ['remote.md#1', 'Hybrid policy: employees work from the office Tuesday to Thursday. Monday and Friday are flexible remote days with manager visibility.', ['home', 'remote', 'friday', 'work', 'office']],
      ['remote.md#2', 'Fully remote arrangements require VP approval and a 6-month review.', ['remote', 'approval', 'home']],
      ['it.md#1', 'Laptops are refreshed every 3 years, or earlier if a repair costs more than 40% of a new device.', ['laptop', 'refresh', 'device', 'years']],
      ['it.md#2', 'Personal software installs need an IT ticket; admin rights are not granted by default.', ['software', 'it', 'install']],
      ['travel.md#1', 'Travel under ₹50,000 is approved by your manager. Above ₹50,000 requires department head approval in the expense tool.', ['travel', 'approve', '50,000', 'approves', 'expense']],
      ['travel.md#2', 'Book flights at least 14 days ahead; economy class for flights under 6 hours.', ['travel', 'flight', 'book']],
    ];
    const score = (q, ch) => { const w = q.toLowerCase().match(/[a-z0-9,₹]+/g) || []; const hits = ch[2].filter((k) => w.some((x) => x.startsWith(k) || k.startsWith(x) && x.length > 3)).length; return Math.min(0.97, 0.18 + hits * 0.19 + (ch[0].length % 7) / 100); };
    const ANS = [
      'New employees accrue vacation monthly at 1.5 days per month during their first year, which adds up to the standard 18 days per year [leave.md#1].',
      'Yes. Friday is a flexible remote day under the hybrid policy, as long as your manager has visibility [remote.md#1].',
      'Laptops are refreshed every 3 years, or sooner if a repair would cost more than 40% of a new device [it.md#1].',
      'Travel above ₹50,000 must be approved by your department head in the expense tool; below that, your manager approves [travel.md#1].',
    ];
    function paint() {
      seg.innerHTML = ''; U.seg(seg, steps.map((s, i) => [i, s]), cur, (v) => { cur = v; paint(); });
      const q = qsel.value, qi = Q.indexOf(q);
      const ranked = CH.map((c) => [score(q, c), c]).sort((a, b) => b[0] - a[0]);
      const k = 2, hits = ranked.slice(0, k);
      if (cur === 0) view.innerHTML = `Documents are split into chunks (here ~1–2 sentences; in practice 200–800 tokens with overlap), each keeping its source id:\n\n${CH.map(([id, t]) => `<b>${id}</b>  ${esc(t)}`).join('\n')}`;
      else if (cur === 1) view.innerHTML = `Each chunk is converted to an embedding vector and stored in a vector index (FAISS, pgvector, Chroma, Pinecone…):\n\n${CH.map(([id], i) => `<b>${id}</b>  → [${Array.from({ length: 5 }, (_, j) => (Math.sin(i * 3.1 + j * 1.7) * 0.6).toFixed(2)).join(', ')}, …]  (768 dims)`).join('\n')}\n\nThis happens once, offline. Only the question is embedded at query time.`;
      else if (cur === 2) view.innerHTML = `Query: "${esc(q)}"\nEmbed the query, then find the most similar chunks (top-k = ${k}):\n\n${ranked.map(([s, c], i) => `${i < k ? '✓' : ' '} ${s.toFixed(3)}  <b>${c[0]}</b>  ${esc(c[1].slice(0, 70))}…`).join('\n')}\n\nOptional: a cross-encoder re-ranker re-scores the top 20–50 for better precision.`;
      else if (cur === 3) view.innerHTML = `The retrieved text is inserted into the prompt:\n\n<b>System:</b> Answer using only the context. Cite sources in [brackets]. If the answer is not in the context, say you don't know.\n\n<b>Context:</b>\n${hits.map(([, c]) => `[${c[0]}] ${esc(c[1])}`).join('\n')}\n\n<b>Question:</b> ${esc(q)}`;
      else view.innerHTML = `<b>Answer:</b> ${esc(ANS[qi])}\n\nThe model never memorised the handbook. Update a document, re-index it, and the next answer changes: no retraining.\n\nEvaluate RAG on two levels: retrieval (did the right chunk come back? recall@k) and generation (is the answer faithful to the context and relevant?).`;
    }
    paint();
  });

  /* ======================= agent loop ======================= */
  CV.widget('gen-agent', { title: 'An LLM agent loop', desc: 'The model thinks, calls a tool, reads the result, and repeats until it can answer. Step through a real-looking trace.' }, (body) => {
    const tasks = {
      weather: { q: 'Should I carry an umbrella to my 3 pm meeting in Bengaluru?', steps: [
        ['think', 'I need the meeting location/time and the forecast. The calendar tool gives the meeting; the weather tool gives the forecast.'],
        ['tool', 'calendar.search(date="today", after="14:00")'], ['result', '{"title": "Design review", "start": "15:00", "location": "Koramangala, Bengaluru"}'],
        ['think', 'Meeting is at 15:00 in Bengaluru. Now get the hourly forecast for that time.'],
        ['tool', 'weather.hourly(city="Bengaluru", hour=15)'], ['result', '{"precip_prob": 0.72, "condition": "thundershowers", "temp_c": 26}'],
        ['answer', 'Yes, take an umbrella: there is a 72% chance of thundershowers around 3 pm in Bengaluru, when your design review in Koramangala starts.']] },
      code: { q: 'Fix the failing test in utils/dates.py', steps: [
        ['think', 'First run the tests to see the actual failure.'],
        ['tool', 'bash("pytest tests/test_dates.py -q")'], ['result', 'FAILED test_parse_iso - ValueError: Invalid isoformat string: "2026-10-18Z"'],
        ['think', 'fromisoformat on older Python versions rejects the "Z" suffix. Read the function.'],
        ['tool', 'read_file("utils/dates.py")'], ['result', 'def parse_iso(s):\n    return datetime.fromisoformat(s)'],
        ['tool', 'edit_file("utils/dates.py", old="fromisoformat(s)", new="fromisoformat(s.replace(\\"Z\\", \\"+00:00\\"))")'], ['result', 'ok'],
        ['tool', 'bash("pytest tests/test_dates.py -q")'], ['result', '4 passed in 0.12s'],
        ['answer', 'Fixed: parse_iso now converts a trailing "Z" to "+00:00" before parsing. All 4 date tests pass.']] },
    };
    let task = 'weather', i = 0;
    const top = U.el('div', { class: 'w-row', style: 'align-items:center;margin-bottom:12px' }); body.append(top);
    U.seg(top, [['weather', 'Personal assistant'], ['code', 'Coding agent']], task, (v) => { task = v; i = 0; paint(); });
    const bb = U.el('div', { class: 'w-btns' }); top.append(bb);
    U.button(bb, 'Next step ▸', () => { i = Math.min(tasks[task].steps.length, i + 1); paint(); });
    U.button(bb, 'Run all', () => { i = tasks[task].steps.length; paint(); });
    U.button(bb, '↺ Reset', () => { i = 0; paint(); });
    const log = U.el('div', { style: 'display:flex;flex-direction:column;gap:8px' }); body.append(log);
    const STY = { think: ['Thought', 'var(--text-3)'], tool: ['Tool call', BLUE], result: ['Observation', GREEN], answer: ['Final answer', ORANGE] };
    function paint() {
      const t = tasks[task];
      log.innerHTML = `<div class="w-out"><b>User:</b> ${esc(t.q)}</div>` + t.steps.slice(0, i).map(([k, txt]) => `<div class="w-out" style="border-left:3px solid ${STY[k][1]}"><b style="color:${STY[k][1]}">${STY[k][0]}</b>\n${esc(txt)}</div>`).join('') +
        (i < t.steps.length ? `<div class="muted small">${i ? 'Loop continues: the model sees everything above and decides the next action.' : 'Press Next step.'}</div>` : `<div class="w-note">Loop ended because the model produced a final answer. Real agents also stop on step limits, errors or when they need human approval.</div>`);
    }
    paint();
  });
})();
