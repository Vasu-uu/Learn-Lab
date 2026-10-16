/* =========================================================
   LearnLab core: course registry, content helpers, Markdown, canvas utils
   ========================================================= */
(function () {
  'use strict';

  const CV = (window.CV = {
    PLATFORM: 'LearnLab',
    courses: [],
    chapters: [],
    extras: [],
    widgets: {},
    courseFolders: [],
    _cur: null,
  });

  /* ---------------- courses ---------------- */
  CV.registerCourses = (folders) => { CV.courseFolders = folders; };
  CV.defineCourse = (def) => {
    def.parts = def.parts || [{ n: 1, title: 'Lessons', desc: '' }];
    def.files = def.files || [];
    CV.courses.push(def);
    CV._cur = def.id;
  };
  CV.course = (id) => CV.courses.find((c) => c.id === id);

  const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'section';
  function normalise(ch) {
    ch.course = ch.course || CV._cur;
    ch.part = ch.part || 1;
    if (ch.md && !ch.sections) {
      // split a single markdown string on "## " headings into sections
      ch.sections = [];
      const chunks = ch.md.split(/^##\s+/m).filter((s) => s.trim());
      chunks.forEach((chunk) => {
        const nl = chunk.indexOf('\n'), title = (nl < 0 ? chunk : chunk.slice(0, nl)).trim();
        ch.sections.push({ id: slug(title), title, md: nl < 0 ? '' : chunk.slice(nl + 1) });
      });
    }
    (ch.sections || []).forEach((s) => { if (s.md != null && s.html == null) s.html = CV.md(s.md); s.id = s.id || slug(s.title); });
    return ch;
  }
  CV.addChapter = (ch) => CV.chapters.push(normalise(ch));
  CV.addExtra = (x) => CV.extras.push(normalise(x));
  CV.widget = (name, meta, mount) => { CV.widgets[name] = { meta, mount }; };

  /* ---------------- authoring helpers ---------------- */
  const ICONS = {
    key: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warn: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 3l10 18H2z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M12 10v5M12 18h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    tip: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    note: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 11v6M12 7.5h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
  };
  CV.ICONS = ICONS;

  const callout = (kind, title) => (html) =>
    `<div class="callout ${kind}"><div class="ci">${ICONS[kind]}</div><div><b class="ct">${title}</b>${html.startsWith('<') ? html : `<p>${html}</p>`}</div></div>`;

  CV.h = {
    key: callout('key', 'Key idea'),
    warn: callout('warn', 'Watch out'),
    tip: callout('tip', 'Tip'),
    note: callout('note', 'Note'),
    f: (html, label) => `<div class="formula">${label ? `<span class="lbl">${label}</span>` : ''}${html}</div>`,
    frac: (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`,
    table: (head, rows) =>
      `<div class="tbl-wrap"><table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
        .join('')}</tbody></table></div>`,
    code: (src, title = 'python') => {
      const s = src.replace(/^\n+|\s+$/g, '');
      return `<div class="code"><div class="code-head"><span class="dots"><i></i><i></i><i></i></span>${title}<button class="copy-btn">copy</button></div><pre><code>${CV.util.highlight(s)}</code></pre></div>`;
    },
    w: (name, opts) => `<div data-widget="${name}"${opts ? ` data-opts='${JSON.stringify(opts).replace(/&/g, '&amp;').replace(/'/g, '&#39;')}'` : ''}></div>`,
    ul: (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`,
    ol: (items) => `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`,
  };

  /* ---------------- general utils ---------------- */
  const U = (CV.util = {});

  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.clamp = (v, a, b) => (v !== v ? a : Math.max(a, Math.min(b, v)));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  U.rand = (seed) => {
    let s = seed >>> 0 || 1;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  };
  U.gauss = (rnd) => {
    const u = Math.max(1e-9, rnd()), v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  U.el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  };

  /* Python-ish syntax highlighter */
  U.highlight = (code) => {
    const KW = new Set('import from as def class return for in if else elif while with not and or is None True False lambda yield try except finally raise pass break continue global assert del'.split(' '));
    const BI = new Set('print len range zip enumerate sum int float str list dict set tuple super isinstance sorted reversed min max abs open map'.split(' '));
    let out = '', i = 0;
    const n = code.length;
    while (i < n) {
      const c = code[i];
      if (c === '#') {
        let j = code.indexOf('\n', i); if (j < 0) j = n;
        out += `<span class="tok-c">${U.esc(code.slice(i, j))}</span>`; i = j; continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < n && code[j] !== c && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
        out += `<span class="tok-s">${U.esc(code.slice(i, j + 1))}</span>`; i = j + 1; continue;
      }
      if (/[0-9]/.test(c) && !/[A-Za-z_]/.test(code[i - 1] || '')) {
        let j = i; while (j < n && /[0-9._e]/.test(code[j])) j++;
        out += `<span class="tok-n">${code.slice(i, j)}</span>`; i = j; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < n && /[A-Za-z0-9_]/.test(code[j])) j++;
        const w = code.slice(i, j);
        if (KW.has(w)) out += `<span class="tok-k">${w}</span>`;
        else if (BI.has(w)) out += `<span class="tok-b">${w}</span>`;
        else if (code[j] === '(') out += `<span class="tok-f">${w}</span>`;
        else out += w;
        i = j; continue;
      }
      out += U.esc(c); i++;
    }
    return out;
  };

  /* ---------------- controls ---------------- */
  U.slider = (parent, { label, min, max, step = 1, value, fmt = (v) => v, onInput }) => {
    const out = U.el('output');
    const input = U.el('input', { type: 'range', min, max, step, value });
    const wrap = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, U.el('span', {}, label), out), input);
    const paint = () => {
      const p = ((input.value - min) / (max - min)) * 100;
      input.style.setProperty('--p', p + '%');
      out.textContent = fmt(+input.value);
    };
    input.addEventListener('input', () => { paint(); onInput && onInput(+input.value); });
    paint();
    parent.append(wrap);
    return { input, get value() { return +input.value; }, set(v) { input.value = v; paint(); }, el: wrap };
  };

  U.seg = (parent, options, value, onChange) => {
    const wrap = U.el('div', { class: 'seg' });
    const btns = options.map((o) => {
      const [val, lab] = Array.isArray(o) ? o : [o, o];
      const b = U.el('button', { type: 'button', class: val === value ? 'on' : '' }, lab);
      b.onclick = () => { btns.forEach((x) => x.classList.remove('on')); b.classList.add('on'); onChange(val); };
      return b;
    });
    wrap.append(...btns);
    parent.append(wrap);
    return wrap;
  };

  /* standard widget layout: stage (left) + controls (right) + note (below) */
  U.split = (body, { stageFlex, note } = {}) => {
    const stage = U.el('div', { class: 'w-stage' });
    const ctl = U.el('div', { class: 'w-col w-controls' });
    if (stageFlex) stage.style.flex = stageFlex;
    body.append(U.el('div', { class: 'w-row' }, stage, ctl));
    let noteEl = null;
    if (note) { noteEl = U.el('div', { class: 'w-note', html: note }); body.append(noteEl); }
    return { stage, ctl, note: noteEl };
  };
  U.out = (parent, html = '') => { const o = U.el('div', { class: 'w-out', html }); parent.append(o); return o; };
  U.label = (parent, text) => { const l = U.el('div', { class: 'canvas-label' }, text); parent.append(l); return l; };

  U.button = (parent, label, onClick, cls = 'btn btn-sm') => {
    const b = U.el('button', { type: 'button', class: cls, html: label });
    b.onclick = onClick;
    parent.append(b);
    return b;
  };

  U.check = (parent, label, checked, onChange) => {
    const inp = U.el('input', { type: 'checkbox' });
    inp.checked = checked;
    inp.onchange = () => onChange(inp.checked);
    const l = U.el('label', { class: 'check' }, inp, label);
    parent.append(l);
    return inp;
  };

  /* ---------------- canvas ---------------- */
  U.canvas = (w, h, { crisp = false, cssW } = {}) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const c = U.el('canvas');
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    c.style.width = (cssW || w) + 'px';
    c.style.aspectRatio = `${w} / ${h}`;
    c.style.width = '100%';
    c.style.maxWidth = (cssW || w) + 'px';
    if (crisp) c.style.imageRendering = 'pixelated';
    const ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    c.W = w; c.H = h; c.dpr = dpr;
    return { c, ctx, w, h };
  };

  /* pixel canvas (1:1 buffer, scaled by CSS) */
  U.pixCanvas = (w, h, cssW = w, crisp = true) => {
    const c = U.el('canvas');
    c.width = w; c.height = h;
    c.style.width = '100%'; c.style.maxWidth = cssW + 'px';
    if (crisp) c.style.imageRendering = 'pixelated';
    return { c, ctx: c.getContext('2d', { willReadFrequently: true }), w, h };
  };

  U.mouse = (canvas, e) => {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: ((t.clientX - r.left) / r.width) * (canvas.W || canvas.width), y: ((t.clientY - r.top) / r.height) * (canvas.H || canvas.height) };
  };

  U.roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  U.arrow = (ctx, x1, y1, x2, y2, head = 8) => {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - 0.4), y2 - head * Math.sin(a - 0.4));
    ctx.lineTo(x2 - head * Math.cos(a + 0.4), y2 - head * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
  };

  /* colour maps */
  U.viridis = (t) => {
    t = U.clamp(t, 0, 1);
    const s = [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]];
    const x = t * (s.length - 1), i = Math.min(s.length - 2, Math.floor(x)), f = x - i;
    return s[i].map((v, k) => Math.round(v + (s[i + 1][k] - v) * f));
  };
  U.magma = (t) => {
    t = U.clamp(t, 0, 1);
    const s = [[0, 0, 4], [81, 18, 124], [183, 55, 121], [252, 137, 97], [252, 253, 191]];
    const x = t * (s.length - 1), i = Math.min(s.length - 2, Math.floor(x)), f = x - i;
    return s[i].map((v, k) => Math.round(v + (s[i + 1][k] - v) * f));
  };
  U.diverge = (t) => { // -1..1 blue-white-red
    t = U.clamp(t, -1, 1);
    return t < 0 ? [Math.round(255 + t * 200), Math.round(255 + t * 120), 255] : [255, Math.round(255 - t * 150), Math.round(255 - t * 200)];
  };

  /* ---------------- synthetic test image ---------------- */
  let userImage = null;
  const sceneCache = {};
  const imgListeners = new Set();
  U.onImage = (fn) => { imgListeners.add(fn); return () => imgListeners.delete(fn); };
  U.setUserImage = (img) => { userImage = img; Object.keys(sceneCache).forEach((k) => delete sceneCache[k]); imgListeners.forEach((f) => f()); };
  U.hasUserImage = () => !!userImage;
  U.pickImage = () => {
    const inp = U.el('input', { type: 'file', accept: 'image/*' });
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const img = new Image();
      img.onload = () => U.setUserImage(img);
      img.src = URL.createObjectURL(f);
    };
    inp.click();
  };
  U.resetImage = () => U.setUserImage(null);

  function drawScene(ctx, w, h) {
    const s = w / 320;
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, '#1e5fb4'); sky.addColorStop(1, '#a8d4f5');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // sun
    const sg = ctx.createRadialGradient(250 * s, 46 * s, 2, 250 * s, 46 * s, 40 * s);
    sg.addColorStop(0, '#fff7c2'); sg.addColorStop(0.45, '#ffd84a'); sg.addColorStop(1, 'rgba(255,216,74,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(250 * s, 46 * s, 40 * s, 0, 7); ctx.fill();
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    [[60, 40], [92, 34], [120, 44]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * s, y * s, 15 * s, 0, 7); ctx.fill(); });
    // mountains
    ctx.fillStyle = '#4a5f7e';
    ctx.beginPath(); ctx.moveTo(0, 140 * s); ctx.lineTo(70 * s, 70 * s); ctx.lineTo(130 * s, 125 * s); ctx.lineTo(190 * s, 80 * s); ctx.lineTo(320 * s, 140 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#eef3fb';
    ctx.beginPath(); ctx.moveTo(70 * s, 70 * s); ctx.lineTo(56 * s, 84 * s); ctx.lineTo(84 * s, 84 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(190 * s, 80 * s); ctx.lineTo(176 * s, 92 * s); ctx.lineTo(205 * s, 92 * s); ctx.closePath(); ctx.fill();
    // ground
    const g = ctx.createLinearGradient(0, 130 * s, 0, h);
    g.addColorStop(0, '#5cae4a'); g.addColorStop(1, '#2f6e2a');
    ctx.fillStyle = g; ctx.fillRect(0, 132 * s, w, h);
    // road
    ctx.fillStyle = '#3b3f47';
    ctx.beginPath(); ctx.moveTo(140 * s, 132 * s); ctx.lineTo(180 * s, 132 * s); ctx.lineTo(260 * s, h); ctx.lineTo(60 * s, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f5f5f5'; ctx.lineWidth = 3 * s; ctx.setLineDash([10 * s, 10 * s]);
    ctx.beginPath(); ctx.moveTo(160 * s, 134 * s); ctx.lineTo(160 * s, h); ctx.stroke(); ctx.setLineDash([]);
    // house
    ctx.fillStyle = '#e9d8b4'; ctx.fillRect(28 * s, 112 * s, 70 * s, 50 * s);
    ctx.fillStyle = '#b5372f';
    ctx.beginPath(); ctx.moveTo(20 * s, 114 * s); ctx.lineTo(63 * s, 84 * s); ctx.lineTo(106 * s, 114 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5b3a22'; ctx.fillRect(56 * s, 132 * s, 14 * s, 30 * s);
    ctx.fillStyle = '#2b5c8f'; ctx.fillRect(36 * s, 122 * s, 14 * s, 12 * s); ctx.fillRect(78 * s, 122 * s, 14 * s, 12 * s);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * s;
    ctx.strokeRect(36 * s, 122 * s, 14 * s, 12 * s); ctx.strokeRect(78 * s, 122 * s, 14 * s, 12 * s);
    // tree
    ctx.fillStyle = '#6b4423'; ctx.fillRect(268 * s, 120 * s, 9 * s, 40 * s);
    ctx.fillStyle = '#2f7d32';
    [[272, 108, 22], [258, 120, 16], [287, 120, 16]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, 7); ctx.fill(); });
    // car
    ctx.fillStyle = '#e11d48'; U.roundRect(ctx, 176 * s, 186 * s, 46 * s, 16 * s, 4 * s); ctx.fill();
    ctx.fillRect(186 * s, 177 * s, 26 * s, 12 * s);
    ctx.fillStyle = '#bfe3ff'; ctx.fillRect(189 * s, 179 * s, 9 * s, 8 * s); ctx.fillRect(200 * s, 179 * s, 9 * s, 8 * s);
    ctx.fillStyle = '#111'; [[186, 203], [212, 203]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * s, y * s, 5 * s, 0, 7); ctx.fill(); });
    // sign with text
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(110 * s, 150 * s, 30 * s, 20 * s);
    ctx.fillStyle = '#6b4423'; ctx.fillRect(123 * s, 170 * s, 4 * s, 18 * s);
    ctx.fillStyle = '#111'; ctx.font = `bold ${13 * s}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CV', 125 * s, 161 * s);
  }

  U.drawScene = drawScene;
  U.defaultScene = (w = 320, h = 220) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    drawScene(c.getContext('2d'), w, h); return c;
  };

  U.scene = (w = 320, h = 220) => {
    const key = w + 'x' + h;
    if (sceneCache[key]) return sceneCache[key];
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (userImage) {
      const r = Math.max(w / userImage.width, h / userImage.height);
      const iw = userImage.width * r, ih = userImage.height * r;
      ctx.drawImage(userImage, (w - iw) / 2, (h - ih) / 2, iw, ih);
    } else drawScene(ctx, w, h);
    sceneCache[key] = c;
    return c;
  };

  U.getRGB = (canvas) => canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
  U.getGray = (canvas) => {
    const d = U.getRGB(canvas).data, n = d.length / 4, g = new Float32Array(n);
    for (let i = 0; i < n; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    return { w: canvas.width, h: canvas.height, data: g };
  };

  U.convolve = (img, kernel, k) => {
    const { w, h, data } = img, out = new Float32Array(w * h), r = (k - 1) / 2;
    const refl = (v, m) => (v < 0 ? -v - 1 : v >= m ? 2 * m - v - 1 : v);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let s = 0;
        for (let j = -r; j <= r; j++) {
          const yy = refl(y + j, h) * w;
          for (let i = -r; i <= r; i++) s += kernel[(j + r) * k + (i + r)] * data[yy + refl(x + i, w)];
        }
        out[y * w + x] = s;
      }
    return { w, h, data: out };
  };

  U.gaussKernel = (sigma) => {
    const r = Math.max(1, Math.ceil(sigma * 2.5)), k = 2 * r + 1, ker = new Float32Array(k * k);
    let s = 0;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const v = Math.exp(-(x * x + y * y) / (2 * sigma * sigma)); ker[(y + r) * k + x + r] = v; s += v; }
    for (let i = 0; i < ker.length; i++) ker[i] /= s;
    return { ker, k };
  };

  U.blur = (img, sigma) => {
    if (sigma <= 0.05) return img;
    const r = Math.max(1, Math.ceil(sigma * 2.5)), k1 = [];
    let s = 0;
    for (let i = -r; i <= r; i++) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); k1.push(v); s += v; }
    const kk = k1.map((v) => v / s), { w, h, data } = img, tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    const cl = (v, m) => (v < 0 ? 0 : v >= m ? m - 1 : v);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let a = 0; for (let i = -r; i <= r; i++) a += kk[i + r] * data[y * w + cl(x + i, w)]; tmp[y * w + x] = a; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let a = 0; for (let i = -r; i <= r; i++) a += kk[i + r] * tmp[cl(y + i, h) * w + x]; out[y * w + x] = a; }
    return { w, h, data: out };
  };

  U.putGray = (ctx, img, { mode = 'clip', map } = {}) => {
    const { w, h, data } = img, id = ctx.createImageData(w, h);
    let lo = 0, hi = 255;
    if (mode === 'norm' || mode === 'abs') {
      lo = Infinity; hi = -Infinity;
      for (const v of data) { const a = mode === 'abs' ? Math.abs(v) : v; if (a < lo) lo = a; if (a > hi) hi = a; }
      if (mode === 'abs') lo = 0;
      if (hi - lo < 1e-6) hi = lo + 1;
    }
    for (let i = 0; i < data.length; i++) {
      let v = mode === 'abs' ? Math.abs(data[i]) : data[i];
      v = mode === 'clip' ? U.clamp(v, 0, 255) : ((v - lo) / (hi - lo)) * 255;
      if (map) { const c = map(v / 255); id.data[i * 4] = c[0]; id.data[i * 4 + 1] = c[1]; id.data[i * 4 + 2] = c[2]; }
      else id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
      id.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
  };

  U.histogram = (data) => { const hst = new Array(256).fill(0); for (const v of data) hst[U.clamp(Math.round(v), 0, 255)]++; return hst; };

  /* ---------------- plotting ---------------- */
  U.plot = (ctx, W, H, { x0, x1, y0, y1, pad = [16, 14, 28, 40], grid = true, xlabel, ylabel, xticks = 5, yticks = 4, fmtX = (v) => +v.toFixed(2), fmtY = (v) => +v.toFixed(2) }) => {
    const [pt, pr, pb, pl] = pad, iw = W - pl - pr, ih = H - pt - pb;
    const X = (v) => pl + ((v - x0) / (x1 - x0)) * iw;
    const Y = (v) => pt + ih - ((v - y0) / (y1 - y0)) * ih;
    const fg = U.css('--text-3'), line = U.css('--border');
    ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = fg; ctx.lineWidth = 1;
    if (grid) {
      ctx.strokeStyle = line;
      for (let i = 0; i <= xticks; i++) {
        const v = x0 + ((x1 - x0) * i) / xticks, px = X(v);
        ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(px, pt); ctx.lineTo(px, pt + ih); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(fmtX(v), px, pt + ih + 6);
      }
      for (let i = 0; i <= yticks; i++) {
        const v = y0 + ((y1 - y0) * i) / yticks, py = Y(v);
        ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(pl, py); ctx.lineTo(pl + iw, py); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(fmtY(v), pl - 6, py);
      }
    }
    if (xlabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(xlabel, pl + iw, H - 1); }
    if (ylabel) { ctx.save(); ctx.translate(11, pt + ih / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ylabel, 0, 0); ctx.restore(); }
    return { X, Y, iw, ih, pl, pt,
      fn(f, color, width = 2.5, n = 300, dash) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash || []);
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n, y = f(x);
          if (!isFinite(y)) { started = false; continue; }
          const py = U.clamp(Y(y), pt - 4, pt + ih + 4);
          started ? ctx.lineTo(X(x), py) : ctx.moveTo(X(x), py); started = true;
        }
        ctx.stroke(); ctx.setLineDash([]);
      },
      line(pts, color, width = 2.5) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)))); ctx.stroke();
      },
    };
  };

  /* data-series palette: foreground first, then muted hues that stay readable in both themes */
  U.palette = () => [U.css('--accent'), '#5b9cf5', '#e07a5f', '#9d8fd6', '#4caf7d', '#d4a73a', '#8a8a8a'];

  /* ---------------- animation loops that pause off-screen ---------------- */
  const loops = new Set();
  U.loop = (el, fn) => {
    const L = { el, fn, visible: false, raf: 0, last: 0, dead: false };
    const tick = (t) => {
      if (L.dead) return;
      const dt = L.last ? Math.min(0.05, (t - L.last) / 1000) : 0.016;
      L.last = t;
      fn(dt, t / 1000);
      L.raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      L.visible = e.isIntersecting;
      if (L.visible && !L.raf && !L.dead) { L.last = 0; L.raf = requestAnimationFrame(tick); }
      else if (!L.visible && L.raf) { cancelAnimationFrame(L.raf); L.raf = 0; }
    });
    io.observe(el);
    L.stop = () => { L.dead = true; cancelAnimationFrame(L.raf); io.disconnect(); loops.delete(L); };
    loops.add(L);
    return L;
  };
  U.stopAllLoops = () => [...loops].forEach((l) => l.stop());

  /* ---------------- tiny Markdown renderer (for course authoring) ----------------
     Supports: ### headings, paragraphs, **bold**, *italic*, `code`, [links](url), ![img](src),
     - / 1. lists, | tables |, ```fenced code```, $$ formula $$,
     > [!key|tip|warn|note] callouts, and "::demo name" to place an interactive widget. */
  CV.md = (src) => {
    const H = CV.h, lines = src.replace(/\r/g, '').split('\n'), out = [];
    const inline = (t) => U.esc(t)
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:12px">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
      .replace(/==([^=]+)==/g, '<span class="term">$1</span>');
    let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      if (l.startsWith('```')) {
        const title = l.slice(3).trim() || 'code', buf = [];
        i++; while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
        i++; out.push(H.code(buf.join('\n'), title)); continue;
      }
      if (l.trim().startsWith('$$')) {
        let body = l.trim().slice(2); const buf = [];
        if (body.endsWith('$$')) { out.push(H.f(inline(body.slice(0, -2).trim()))); i++; continue; }
        i++; while (i < lines.length && !lines[i].includes('$$')) buf.push(lines[i++]);
        i++; out.push(H.f(inline((body + ' ' + buf.join(' ')).trim()))); continue;
      }
      let m;
      if ((m = l.match(/^::demo\s+([\w-]+)\s*(.*)$/))) { let o; try { o = m[2] ? JSON.parse(m[2]) : undefined; } catch (e) {} out.push(H.w(m[1], o)); i++; continue; }
      if ((m = l.match(/^(#{3,4})\s+(.*)$/))) { out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`); i++; continue; }
      if (l.startsWith('>')) {
        const buf = []; while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
        const km = buf[0].match(/^\[!(key|tip|warn|note)\]\s*(.*)$/i);
        const kind = km ? km[1].toLowerCase() : 'note'; if (km) buf[0] = km[2];
        out.push(H[kind](`<p>${inline(buf.join(' ').trim())}</p>`)); continue;
      }
      if (l.trim().startsWith('|')) {
        const rows = []; while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++]);
        const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
        const body = rows.filter((r, k) => !(k === 1 && /^[\s|:-]+$/.test(r)));
        out.push(H.table(cells(body[0]), body.slice(1).map(cells))); continue;
      }
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
        const ordered = /^\s*\d+\./.test(l), items = [];
        while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
          let t = lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, '');
          while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) t += ' ' + lines[i++].trim();
          items.push(inline(t));
        }
        out.push(ordered ? H.ol(items) : H.ul(items)); continue;
      }
      const buf = []; while (i < lines.length && lines[i].trim() && !/^(```|#{3,4}\s|>|\||::demo|\s*([-*]|\d+\.)\s|\s*\$\$)/.test(lines[i])) buf.push(lines[i++].trim());
      if (buf.length) out.push(`<p>${inline(buf.join(' '))}</p>`); else i++;
    }
    return out.join('\n');
  };

  U.fmt = (v, d = 2) => (Math.abs(v) >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.abs(v) >= 1e4 ? (v / 1e3).toFixed(1) + 'K' : (+v.toFixed(d)).toString());
  U.fmtInt = (v) => Math.round(v).toLocaleString('en-US');
})();
