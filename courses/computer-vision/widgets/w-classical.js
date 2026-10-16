/* Widgets for Chapter 3: classical image processing */
(function () {
  'use strict';
  const U = CV.util;

  const otsu = (hist, total) => {
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, best = 0, T = 127;
    for (let t = 0; t < 256; t++) {
      wB += hist[t]; if (!wB) continue;
      const wF = total - wB; if (!wF) break;
      sB += t * hist[t];
      const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) ** 2;
      if (v > best) { best = v; T = t; }
    }
    return T;
  };
  U.otsu = otsu;

  function drawHist(ctx, W, H, hist, color, extra) {
    ctx.clearRect(0, 0, W, H);
    const mx = Math.max(...hist) || 1;
    ctx.fillStyle = color;
    for (let i = 0; i < 256; i++) { const h = (hist[i] / mx) * (H - 6); ctx.fillRect((i / 256) * W, H - h, W / 256 + 0.4, h); }
    if (extra) extra();
  }

  /* ---------------- point operations ---------------- */
  CV.widget('point-ops', { title: 'Point operations: s = T(r)', desc: 'Every output pixel depends only on the input pixel at the same place. The curve is the whole operation.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 320, H = 220;
    const img = U.pixCanvas(W, H, 420, false);
    const curve = U.canvas(200, 150), hist = U.canvas(200, 70);
    stage.append(U.el('div', { class: 'canvas-box' }, img.c));
    const row = U.el('div', { class: 'w-row', style: 'margin-top:10px' },
      U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, 'Transfer curve T(r)'), curve.c),
      U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, 'Output histogram'), hist.c));
    stage.append(row);
    let a = 1, b = 0, gamma = 1, neg = false, thr = -1;
    U.slider(ctl, { label: 'Contrast a', min: 0.2, max: 3, step: 0.01, value: a, fmt: (v) => v.toFixed(2), onInput: (v) => { a = v; draw(); } });
    U.slider(ctl, { label: 'Brightness b', min: -128, max: 128, value: b, onInput: (v) => { b = v; draw(); } });
    U.slider(ctl, { label: 'Gamma γ', min: 0.2, max: 3, step: 0.01, value: gamma, fmt: (v) => v.toFixed(2) + (v < 1 ? ' brightens darks' : v > 1 ? ' darkens' : ''), onInput: (v) => { gamma = v; draw(); } });
    U.check(ctl, 'Negative (255 − r)', neg, (v) => { neg = v; draw(); });
    const ts = U.slider(ctl, { label: 'Threshold T (−1 = off)', min: -1, max: 255, value: thr, onInput: (v) => { thr = v; draw(); } });
    const btns = U.el('div', { class: 'w-btns' }); ctl.append(btns);
    U.button(btns, 'Otsu threshold', () => { const g = U.getGray(U.scene(W, H)); thr = otsu(U.histogram(g.data), W * H); ts.set(thr); draw(); });
    U.button(btns, 'Reset', () => { a = 1; b = 0; gamma = 1; thr = -1; ts.set(-1); ctl.querySelectorAll('input[type=range]').forEach((r, i) => { r.value = [1, 0, 1][i] ?? r.value; r.dispatchEvent(new Event('input')); }); });
    const out = U.out(ctl);
    const T = (r) => {
      let s = a * r + b;
      s = U.clamp(s, 0, 255);
      s = 255 * Math.pow(s / 255, gamma);
      if (neg) s = 255 - s;
      if (thr >= 0) s = s > thr ? 255 : 0;
      return s;
    };
    function draw() {
      const g = U.getGray(U.scene(W, H)), lut = new Float32Array(256);
      for (let i = 0; i < 256; i++) lut[i] = T(i);
      const o = new Float32Array(g.data.length);
      for (let i = 0; i < o.length; i++) o[i] = lut[Math.round(g.data[i])];
      U.putGray(img.ctx, { w: W, h: H, data: o });
      const p = U.plot(curve.ctx, 200, 150, { x0: 0, x1: 255, y0: 0, y1: 255, xticks: 2, yticks: 2, fmtX: (v) => v.toFixed(0), fmtY: (v) => v.toFixed(0), pad: [8, 8, 20, 30] });
      p.fn((x) => x, U.css('--text-3'), 1, 2, [3, 4]);
      p.fn((x) => lut[Math.round(x)], U.css('--accent'), 2.5);
      drawHist(hist.ctx, 200, 70, U.histogram(o), U.css('--accent-2'));
      out.innerHTML = `s = ${neg ? '255 − ' : ''}255·((${a.toFixed(2)}·r ${b >= 0 ? '+' : '−'} ${Math.abs(b)})/255)^${gamma.toFixed(2)}${thr >= 0 ? `\nthen s = 255 if s &gt; <b>${thr}</b> else 0` : ''}`;
    }
    curve.c.style.maxWidth = hist.c.style.maxWidth = '100%';
    draw();
    return U.onImage(draw);
  });

  /* ---------------- histogram equalization ---------------- */
  CV.widget('hist-eq', { title: 'Histogram equalization', desc: 'A dull image has a narrow histogram. Remapping through the CDF spreads it across the full range.' }, (body) => {
    const W = 260, H = 180;
    const a = U.pixCanvas(W, H, 300, false), b = U.pixCanvas(W, H, 300, false);
    const ha = U.canvas(260, 90), hb = U.canvas(260, 90);
    let squash = 0.35, mode = 'global';
    const ctl = U.el('div', { class: 'w-row', style: 'margin-bottom:14px;align-items:center' });
    body.append(ctl);
    const c1 = U.el('div', { class: 'w-col' }); ctl.append(c1);
    U.slider(c1, { label: 'Input contrast (make it dull)', min: 0.1, max: 1, step: 0.01, value: squash, fmt: (v) => Math.round(v * 100) + '%', onInput: (v) => { squash = v; draw(); } });
    const c2 = U.el('div', { class: 'w-col' }); ctl.append(c2);
    U.seg(c2, [['global', 'Global equalization'], ['clahe', 'CLAHE-like (tiles, clipped)']], mode, (v) => { mode = v; draw(); });
    body.append(U.el('div', { class: 'w-row' },
      U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, 'Low-contrast input'), a.c, U.el('div', { class: 'canvas-label', style: 'margin-top:8px' }, 'Histogram + CDF'), ha.c),
      U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, 'Equalized output'), b.c, U.el('div', { class: 'canvas-label', style: 'margin-top:8px' }, 'Histogram + CDF'), hb.c)));
    body.append(U.el('div', { class: 'w-note', html: 'Each level k maps to s<sub>k</sub> = (L − 1) · Σ<sub>j≤k</sub> p(r<sub>j</sub>). The CDF line (white) becomes nearly straight after equalization: every intensity is equally used.' }));
    const cdfLine = (ctx, hist) => () => {
      let s = 0; const tot = hist.reduce((x, y) => x + y, 0);
      ctx.strokeStyle = U.css('--text'); ctx.lineWidth = 2; ctx.beginPath();
      hist.forEach((v, i) => { s += v; const x = (i / 255) * 260, y = 88 - (s / tot) * 84; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    };
    function equalize(data, n) {
      const h = U.histogram(data), lut = new Float32Array(256); let s = 0;
      for (let i = 0; i < 256; i++) { s += h[i]; lut[i] = (255 * s) / n; }
      return lut;
    }
    function draw() {
      const g = U.getGray(U.scene(W, H)), n = W * H, inp = new Float32Array(n);
      for (let i = 0; i < n; i++) inp[i] = 90 + (g.data[i] - 128) * squash * 0.6 + 30;
      let out = new Float32Array(n);
      if (mode === 'global') { const lut = equalize(inp, n); for (let i = 0; i < n; i++) out[i] = lut[Math.round(inp[i])]; }
      else {
        const tx = 4, ty = 3, tw = W / tx, th = H / ty, luts = [];
        for (let j = 0; j < ty; j++) for (let i = 0; i < tx; i++) {
          const h = new Array(256).fill(0); let cnt = 0;
          for (let y = Math.floor(j * th); y < (j + 1) * th; y++) for (let x = Math.floor(i * tw); x < (i + 1) * tw; x++) { h[Math.round(inp[y * W + x])]++; cnt++; }
          const clip = (cnt / 256) * 3; let ex = 0;
          for (let k = 0; k < 256; k++) if (h[k] > clip) { ex += h[k] - clip; h[k] = clip; }
          const lut = new Float32Array(256); let s = 0;
          for (let k = 0; k < 256; k++) { s += h[k] + ex / 256; lut[k] = (255 * s) / cnt; }
          luts.push(lut);
        }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const fx = U.clamp(x / tw - 0.5, 0, tx - 1), fy = U.clamp(y / th - 0.5, 0, ty - 1);
          const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(tx - 1, x0 + 1), y1 = Math.min(ty - 1, y0 + 1), ax = fx - x0, ay = fy - y0, v = Math.round(inp[y * W + x]);
          const L = (i, j) => luts[j * tx + i][v];
          out[y * W + x] = (L(x0, y0) * (1 - ax) + L(x1, y0) * ax) * (1 - ay) + (L(x0, y1) * (1 - ax) + L(x1, y1) * ax) * ay;
        }
      }
      U.putGray(a.ctx, { w: W, h: H, data: inp }); U.putGray(b.ctx, { w: W, h: H, data: out });
      const h1 = U.histogram(inp), h2 = U.histogram(out);
      drawHist(ha.ctx, 260, 90, h1, U.css('--accent'), cdfLine(ha.ctx, h1));
      drawHist(hb.ctx, 260, 90, h2, U.css('--accent-2'), cdfLine(hb.ctx, h2));
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- convolution step-through ---------------- */
  const KERNELS = {
    'Box blur': [[1, 1, 1, 1, 1, 1, 1, 1, 1], 1 / 9],
    Gaussian: [[1, 2, 1, 2, 4, 2, 1, 2, 1], 1 / 16],
    Sharpen: [[0, -1, 0, -1, 5, -1, 0, -1, 0], 1],
    'Sobel x': [[-1, 0, 1, -2, 0, 2, -1, 0, 1], 1],
    'Sobel y': [[-1, -2, -1, 0, 0, 0, 1, 2, 1], 1],
    Laplacian: [[0, 1, 0, 1, -4, 1, 0, 1, 0], 1],
    Emboss: [[-2, -1, 0, -1, 1, 1, 0, 1, 2], 1],
    Identity: [[0, 0, 0, 0, 1, 0, 0, 0, 0], 1],
  };
  CV.KERNELS = KERNELS;

  CV.widget('conv-step', { title: 'Watch a 3×3 kernel slide', desc: 'Each output value is a sum of nine products. Step through it or let it play.' }, (body) => {
    const N = 7, inp = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) inp.push(x < 3 ? 1 : x === 3 ? 5 : 9);
    inp[2 * N + 5] = 2; inp[4 * N + 1] = 7;
    let kname = 'Sobel x', pos = 0, playing = true;
    const top = U.el('div', { class: 'w-row', style: 'align-items:center;margin-bottom:14px' }); body.append(top);
    U.seg(top, Object.keys(KERNELS).slice(0, 6), kname, (v) => { kname = v; pos = 0; render(); });
    const btns = U.el('div', { class: 'w-btns' }); top.append(btns);
    const pb = U.button(btns, '❚❚ Pause', () => { playing = !playing; pb.innerHTML = playing ? '❚❚ Pause' : '▶ Play'; });
    U.button(btns, 'Step →', () => { playing = false; pb.innerHTML = '▶ Play'; pos = (pos + 1) % 25; render(); });
    const row = U.el('div', { class: 'w-row', style: 'align-items:center;justify-content:center;gap:22px' }); body.append(row);
    const gIn = U.el('div', { class: 'mgrid', style: `grid-template-columns:repeat(${N},34px)` });
    const gK = U.el('div', { class: 'mgrid', style: 'grid-template-columns:repeat(3,34px)' });
    const gOut = U.el('div', { class: 'mgrid', style: 'grid-template-columns:repeat(5,34px)' });
    const col = (l, g) => U.el('div', { style: 'display:flex;flex-direction:column;align-items:center;gap:6px' }, U.el('div', { class: 'canvas-label' }, l), g);
    row.append(col('Input 7×7', gIn), U.el('div', { style: 'font-size:26px;color:var(--text-3)' }, '⊛'), col('Kernel', gK), U.el('div', { style: 'font-size:26px;color:var(--text-3)' }, '='), col('Output 5×5 (valid)', gOut));
    const out = U.out(body); out.style.marginTop = '14px';
    const cells = (g, n) => { g.innerHTML = ''; return Array.from({ length: n }, () => { const d = U.el('div'); g.append(d); return d; }); };
    const ci = cells(gIn, N * N), ck = cells(gK, 9), co = cells(gOut, 25);
    const val = (p) => { const [k, s] = KERNELS[kname]; const ox = p % 5, oy = Math.floor(p / 5); let a = 0; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) a += k[j * 3 + i] * inp[(oy + j) * N + ox + i]; return a * s; };
    const heat = (v, mx) => { const t = U.clamp(v / (mx || 1), -1, 1); const [r, g, b] = U.diverge(t); return `rgb(${r},${g},${b})`; };
    function render() {
      const [k, s] = KERNELS[kname], ox = pos % 5, oy = Math.floor(pos / 5);
      ci.forEach((d, i) => { const x = i % N, y = Math.floor(i / N), on = x >= ox && x < ox + 3 && y >= oy && y < oy + 3; d.textContent = inp[i]; d.style.background = `rgba(91,156,245,${inp[i] / 14})`; d.classList.toggle('hl', on); });
      ck.forEach((d, i) => { d.textContent = s !== 1 ? `${k[i]}` : k[i]; d.style.background = k[i] > 0 ? 'rgba(76,175,125,.35)' : k[i] < 0 ? 'rgba(229,96,77,.35)' : ''; });
      const all = Array.from({ length: 25 }, (_, p) => val(p)), mx = Math.max(...all.map(Math.abs));
      co.forEach((d, p) => { const done = p <= pos; d.textContent = done ? +all[p].toFixed(1) : ''; d.style.background = done ? heat(all[p], mx) : ''; d.style.color = done ? '#000' : ''; d.classList.toggle('hl', p === pos); });
      const terms = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) terms.push(`${k[j * 3 + i]}×${inp[(oy + j) * N + ox + i]}`);
      out.innerHTML = `<b>out[${oy}, ${ox}]</b> = ${s !== 1 ? `(1/${Math.round(1 / s)})·(` : ''}${terms.join(' + ')}${s !== 1 ? ')' : ''}\n          = <b>${+val(pos).toFixed(2)}</b>`;
    }
    render();
    const iv = setInterval(() => { if (playing) { pos = (pos + 1) % 25; render(); } }, 650);
    return () => clearInterval(iv);
  });

  /* ---------------- filter lab ---------------- */
  CV.widget('filter-lab', { title: 'Filter lab', desc: 'Apply classic kernels to a real image, add noise, and compare the Gaussian with the median filter. Edit the kernel cells too.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 440px' });
    const W = 300, H = 206;
    const a = U.pixCanvas(W, H, 300, false), b = U.pixCanvas(W, H, 300, false);
    stage.append(U.el('div', { class: 'w-row' },
      U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, 'Input'), a.c),
      U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, 'Output'), b.c)));
    let kname = 'Gaussian', noise = 'none', sigma = 1.5, custom = null;
    const names = [...Object.keys(KERNELS), 'Median 3×3', 'Median 5×5', 'Gaussian σ'];
    const sel = U.el('select'); names.forEach((n) => sel.append(U.el('option', { value: n }, n))); sel.value = kname;
    sel.onchange = () => { kname = sel.value; custom = null; syncGrid(); draw(); };
    ctl.append(U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Filter'), sel));
    const kg = U.el('div', { class: 'mgrid', style: 'grid-template-columns:repeat(3,40px)' });
    const inputs = Array.from({ length: 9 }, () => { const i = U.el('input', { type: 'text' }); i.oninput = () => { custom = inputs.map((x) => parseFloat(x.value) || 0); draw(); }; kg.append(i); return i; });
    ctl.append(U.el('div', {}, U.el('div', { class: 'canvas-label' }, 'Kernel (editable)'), kg));
    const ss = U.slider(ctl, { label: 'Gaussian σ', min: 0.3, max: 5, step: 0.1, value: sigma, onInput: (v) => { sigma = v; if (kname === 'Gaussian σ') draw(); } });
    U.seg(ctl, [['none', 'No noise'], ['gauss', 'Gaussian'], ['sp', 'Salt & pepper']], noise, (v) => { noise = v; draw(); });
    const out = U.out(ctl);
    function syncGrid() {
      const k = KERNELS[kname];
      inputs.forEach((x, i) => { x.disabled = !k; x.value = k ? +(k[0][i] * (k[1] === 1 ? 1 : 1)).toFixed(2) : '–'; });
      ss.el.style.opacity = kname === 'Gaussian σ' ? 1 : 0.4;
    }
    function median(g, r) {
      const { w, h, data } = g, o = new Float32Array(w * h), buf = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        buf.length = 0;
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) buf.push(data[U.clamp(y + j, 0, h - 1) * w + U.clamp(x + i, 0, w - 1)]);
        buf.sort((p, q) => p - q); o[y * w + x] = buf[buf.length >> 1];
      }
      return { w, h, data: o };
    }
    function draw() {
      const g = U.getGray(U.scene(W, H)), rnd = U.rand(5);
      if (noise === 'gauss') for (let i = 0; i < g.data.length; i++) g.data[i] = U.clamp(g.data[i] + U.gauss(rnd) * 22, 0, 255);
      if (noise === 'sp') for (let i = 0; i < g.data.length; i++) { const r = rnd(); if (r < 0.04) g.data[i] = 0; else if (r < 0.08) g.data[i] = 255; }
      U.putGray(a.ctx, g);
      let res, mode = 'clip';
      if (kname.startsWith('Median')) res = median(g, kname.includes('5') ? 2 : 1);
      else if (kname === 'Gaussian σ') res = U.blur(g, sigma);
      else {
        const [k, s] = KERNELS[kname];
        const ker = custom || k.map((v) => v * s);
        res = U.convolve(g, ker, 3);
        if (/Sobel|Laplacian/.test(kname)) mode = 'abs';
        if (kname === 'Emboss') res.data = res.data.map((v) => v * 0.5 + 128);
      }
      U.putGray(b.ctx, res, { mode });
      const sum = (custom || (KERNELS[kname] ? KERNELS[kname][0].map((v) => v * KERNELS[kname][1]) : [1])).reduce((x, y) => x + y, 0);
      out.innerHTML = kname.startsWith('Median') ? 'Non-linear: take the median of the window.\nKills salt-and-pepper noise, keeps edges.' : kname === 'Gaussian σ' ? `Separable: a k×k blur = one row pass + one column pass\nO(k²) → O(2k) per pixel` : `Kernel sum = <b>${+sum.toFixed(2)}</b>  ${Math.abs(sum - 1) < 1e-6 ? '(brightness preserved)' : Math.abs(sum) < 1e-6 ? '(responds only to change: an edge/derivative filter)' : ''}${mode === 'abs' ? '\nShowing |response|, normalised.' : ''}`;
    }
    syncGrid(); draw();
    return U.onImage(draw);
  });

  /* ---------------- Canny ---------------- */
  U.canny = (g, sigma, lo, hi) => {
    const { w, h } = g;
    const s = U.blur(g, sigma);
    const gx = U.convolve(s, [-1, 0, 1, -2, 0, 2, -1, 0, 1], 3).data, gy = U.convolve(s, [-1, -2, -1, 0, 0, 0, 1, 2, 1], 3).data;
    const mag = new Float32Array(w * h), dir = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      mag[i] = Math.hypot(gx[i], gy[i]);
      let a = (Math.atan2(gy[i], gx[i]) * 180) / Math.PI; if (a < 0) a += 180;
      dir[i] = a < 22.5 || a >= 157.5 ? 0 : a < 67.5 ? 1 : a < 112.5 ? 2 : 3;
    }
    const nms = new Float32Array(w * h);
    const off = [[1, 0], [1, 1], [0, 1], [-1, 1]];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, [dx, dy] = off[dir[i]];
      const m = mag[i];
      if (m >= mag[(y + dy) * w + x + dx] && m >= mag[(y - dy) * w + x - dx]) nms[i] = m;
    }
    const cls = new Uint8Array(w * h); // 0 none, 1 weak, 2 strong
    for (let i = 0; i < w * h; i++) cls[i] = nms[i] >= hi ? 2 : nms[i] >= lo ? 1 : 0;
    const edge = new Uint8Array(w * h), stack = [];
    for (let i = 0; i < w * h; i++) if (cls[i] === 2) { edge[i] = 1; stack.push(i); }
    while (stack.length) {
      const i = stack.pop(), x = i % w, y = (i / w) | 0;
      for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
        const xx = x + k, yy = y + j; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const n = yy * w + xx; if (!edge[n] && cls[n] === 1) { edge[n] = 1; stack.push(n); }
      }
    }
    return { s, mag, nms, cls, edge };
  };

  CV.widget('canny', { title: 'Canny edge detector, step by step', desc: 'Move through the five stages. Tune σ and the two thresholds and see weak edges survive only when connected to strong ones.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 320, H = 220;
    const v = U.pixCanvas(W, H, 460, false);
    stage.append(U.el('div', { class: 'canvas-box' }, v.c));
    let step = 5, sigma = 1.4, lo = 40, hi = 100;
    U.seg(ctl, [[1, '1 Smooth'], [2, '2 Gradient'], [3, '3 NMS'], [4, '4 Thresholds'], [5, '5 Hysteresis']], step, (x) => { step = x; draw(); });
    U.slider(ctl, { label: 'Gaussian σ', min: 0.5, max: 4, step: 0.1, value: sigma, onInput: (x) => { sigma = x; draw(); } });
    U.slider(ctl, { label: 'Low threshold', min: 5, max: 200, value: lo, onInput: (x) => { lo = x; draw(); } });
    U.slider(ctl, { label: 'High threshold', min: 10, max: 400, value: hi, onInput: (x) => { hi = x; draw(); } });
    const out = U.out(ctl);
    const TXT = {
      1: 'Smooth with a Gaussian to suppress noise.\nDerivatives amplify noise, so this comes first.',
      2: 'Gradient magnitude |∇f| = √(gx² + gy²) from Sobel.\nEdges are thick ridges here.',
      3: 'Non-maximum suppression: keep a pixel only if it is the\nlocal max along the gradient direction → 1-px edges.',
      4: '<span style="color:#5b9cf5">strong</span> (≥ high) and <span style="color:#e07a5f">weak</span> (between thresholds).\nEverything else is rejected.',
      5: 'Hysteresis: keep weak edges only if connected\nto a strong edge. Final edge map.',
    };
    function draw() {
      const g = U.getGray(U.scene(W, H));
      const r = U.canny(g, sigma, lo, hi);
      if (step === 1) U.putGray(v.ctx, r.s);
      else if (step === 2) U.putGray(v.ctx, { w: W, h: H, data: r.mag }, { mode: 'norm', map: U.magma });
      else if (step === 3) U.putGray(v.ctx, { w: W, h: H, data: r.nms }, { mode: 'norm', map: U.magma });
      else {
        const id = v.ctx.createImageData(W, H);
        for (let i = 0; i < W * H; i++) {
          let c = [10, 10, 10];
          if (step === 4) c = r.cls[i] === 2 ? [91, 156, 245] : r.cls[i] === 1 ? [224, 122, 95] : c;
          else c = r.edge[i] ? [255, 255, 255] : c;
          id.data.set([...c, 255], i * 4);
        }
        v.ctx.putImageData(id, 0, 0);
      }
      let n = 0; for (const e of r.edge) n += e;
      out.innerHTML = TXT[step] + `\n\nedge pixels: <b>${n}</b>\nedges = cv2.Canny(blur, ${lo}, ${hi})`;
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- morphology ---------------- */
  CV.widget('morphology', { title: 'Morphology playground', desc: 'Paint white pixels (drag), then erode, dilate, open or close with a 3×3 structuring element.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const GW = 32, GH = 20, cs = 15;
    const { c, ctx } = U.canvas(GW * cs, GH * cs);
    c.style.cursor = 'crosshair';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let grid = new Uint8Array(GW * GH), prev = null, flash = 0, paint = 1;
    const preset = () => {
      grid.fill(0);
      const rnd = U.rand(9);
      for (let y = 4; y < 15; y++) for (let x = 4; x < 14; x++) grid[y * GW + x] = 1;
      grid[8 * GW + 8] = grid[9 * GW + 9] = grid[10 * GW + 7] = 0; // holes
      for (let y = 5; y < 16; y++) for (let x = 18; x < 28; x++) if ((x - 23) ** 2 + (y - 10) ** 2 < 22) grid[y * GW + x] = 1;
      for (let x = 18; x < 28; x++) grid[10 * GW + x] = x === 23 ? 0 : grid[10 * GW + x];
      for (let k = 0; k < 14; k++) grid[Math.floor(rnd() * GH) * GW + Math.floor(rnd() * GW)] = 1; // specks
      prev = null;
    };
    preset();
    const op = (g, kind) => {
      const o = new Uint8Array(GW * GH);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        let all = 1, any = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; const v = xx < 0 || yy < 0 || xx >= GW || yy >= GH ? 0 : g[yy * GW + xx]; all &= v; any |= v; }
        o[y * GW + x] = kind === 'erode' ? all : any;
      }
      return o;
    };
    const apply = (name) => {
      prev = grid; flash = 1;
      if (name === 'erode') grid = op(grid, 'erode');
      else if (name === 'dilate') grid = op(grid, 'dilate');
      else if (name === 'open') grid = op(op(grid, 'erode'), 'dilate');
      else if (name === 'close') grid = op(op(grid, 'dilate'), 'erode');
      else if (name === 'gradient') { const d = op(grid, 'dilate'), e = op(grid, 'erode'); grid = d.map((v, i) => v & !e[i]); }
      info(name);
    };
    const btns = U.el('div', { class: 'w-btns' }); ctl.append(btns);
    [['erode', 'Erode'], ['dilate', 'Dilate'], ['open', 'Open'], ['close', 'Close'], ['gradient', 'Gradient']].forEach(([k, l]) => U.button(btns, l, () => apply(k)));
    const b2 = U.el('div', { class: 'w-btns' }); ctl.append(b2);
    U.button(b2, '↺ Example', () => { preset(); info(); }, 'btn btn-sm btn-ghost');
    U.button(b2, 'Clear', () => { grid.fill(0); prev = null; info(); }, 'btn btn-sm btn-ghost');
    const out = U.out(ctl);
    const DESC = { erode: 'Erosion: a pixel stays white only if ALL 9 neighbours are white. Shrinks shapes, removes specks.', dilate: 'Dilation: white if ANY neighbour is white. Grows shapes, fills small holes.', open: 'Opening = erode → dilate. Removes small bright specks, keeps object size.', close: 'Closing = dilate → erode. Fills small dark holes and gaps.', gradient: 'Gradient = dilation − erosion: an outline.' };
    function info(name) { let n = 0; for (const v of grid) n += v; out.innerHTML = (name ? DESC[name] + '\n\n' : 'Drag to paint. Shift-drag (or right-click) to erase.\n\n') + `white pixels: <b>${n}</b>  <span style="color:var(--ok)">■ added</span>  <span style="color:var(--bad)">■ removed</span>`; }
    info();
    let down = false;
    const pt = (e) => { const p = U.mouse(c, e); const x = Math.floor(p.x / cs), y = Math.floor(p.y / cs); if (x >= 0 && y >= 0 && x < GW && y < GH) { grid[y * GW + x] = paint; prev = null; } };
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointerdown', (e) => { down = true; paint = e.shiftKey || e.button === 2 ? 0 : 1; pt(e); });
    c.addEventListener('pointermove', (e) => down && pt(e));
    addEventListener('pointerup', () => (down = false));
    U.loop(c, (dt) => {
      flash = Math.max(0, flash - dt * 0.8);
      ctx.fillStyle = U.css('--surface-2'); ctx.fillRect(0, 0, GW * cs, GH * cs);
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
        const i = y * GW + x, v = grid[i], p = prev ? prev[i] : v;
        let col = v ? '#f0f0f0' : null;
        if (prev && flash > 0 && v !== p) col = v ? `rgba(76,175,125,${0.4 + flash * 0.6})` : `rgba(229,96,77,${flash})`;
        if (col) { ctx.fillStyle = col; ctx.fillRect(x * cs + 1, y * cs + 1, cs - 2, cs - 2); }
      }
    });
  });

  /* ---------------- geometric transforms ---------------- */
  CV.widget('geo-transform', { title: 'Geometric transformations & homography', desc: 'Pick a transform family. Each adds degrees of freedom and preserves less. In Projective mode, drag the four corners.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 360, H = 250, SW = 200, SH = 138;
    const v = U.pixCanvas(W, H, 460, false);
    v.c.style.cursor = 'default';
    stage.append(U.el('div', { class: 'canvas-box' }, v.c));
    let fam = 'similarity', P = { tx: 0, ty: 0, ang: 15, sc: 1, shx: 0, shy: 0 };
    let corners = [[80, 56], [280, 56], [280, 194], [80, 194]];
    const ox = (W - SW) / 2, oy = (H - SH) / 2;
    const famInfo = { translation: [2, 'shape, size, angles'], rigid: [3, 'lengths, angles'], similarity: [4, 'angles, ratios'], affine: [6, 'parallel lines, ratios along lines'], projective: [8, 'straight lines only'] };
    U.seg(ctl, Object.keys(famInfo).map((k) => [k, k[0].toUpperCase() + k.slice(1)]), fam, (x) => { fam = x; vis(); draw(); });
    const sl = {
      tx: U.slider(ctl, { label: 'Translate x', min: -80, max: 80, value: 0, onInput: (x) => { P.tx = x; draw(); } }),
      ty: U.slider(ctl, { label: 'Translate y', min: -60, max: 60, value: 0, onInput: (x) => { P.ty = x; draw(); } }),
      ang: U.slider(ctl, { label: 'Rotation', min: -180, max: 180, value: 15, fmt: (x) => x + '°', onInput: (x) => { P.ang = x; draw(); } }),
      sc: U.slider(ctl, { label: 'Scale', min: 0.4, max: 1.6, step: 0.01, value: 1, onInput: (x) => { P.sc = x; draw(); } }),
      shx: U.slider(ctl, { label: 'Shear x', min: -0.8, max: 0.8, step: 0.01, value: 0, onInput: (x) => { P.shx = x; draw(); } }),
      shy: U.slider(ctl, { label: 'Scale y (anisotropic)', min: 0.4, max: 1.6, step: 0.01, value: 1, onInput: (x) => { P.shy = x; draw(); } }),
    };
    P.shy = 1;
    const out = U.out(ctl);
    function vis() {
      const show = { translation: ['tx', 'ty'], rigid: ['tx', 'ty', 'ang'], similarity: ['tx', 'ty', 'ang', 'sc'], affine: ['tx', 'ty', 'ang', 'sc', 'shx', 'shy'], projective: [] }[fam];
      Object.entries(sl).forEach(([k, s]) => (s.el.style.display = show.includes(k) ? '' : 'none'));
      v.c.style.cursor = fam === 'projective' ? 'grab' : 'default';
    }
    function homFrom4(src, dst) {
      const A = [], bb = [];
      for (let i = 0; i < 4; i++) {
        const [x, y] = src[i], [u, w] = dst[i];
        A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); bb.push(u);
        A.push([0, 0, 0, x, y, 1, -w * x, -w * y]); bb.push(w);
      }
      for (let c = 0; c < 8; c++) { // gaussian elimination
        let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
        [A[c], A[p]] = [A[p], A[c]]; [bb[c], bb[p]] = [bb[p], bb[c]];
        for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; bb[r] -= f * bb[c]; }
      }
      const h = bb.map((v2, i) => v2 / A[i][i]);
      return [[h[0], h[1], h[2]], [h[3], h[4], h[5]], [h[6], h[7], 1]];
    }
    const inv3 = (m) => {
      const [[a, b, c], [d, e, f], [g, h, i]] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C;
      return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]];
    };
    function matrix() {
      if (fam === 'projective') return homFrom4([[0, 0], [SW, 0], [SW, SH], [0, SH]], corners);
      const t = (P.ang * Math.PI) / 180, s = fam === 'similarity' || fam === 'affine' ? P.sc : 1, rot = fam === 'translation' ? 0 : t;
      const ax = fam === 'affine' ? P.shx : 0, sy = fam === 'affine' ? P.shy : 1;
      // M = T · R · S · Shear, about image centre
      const cx = SW / 2, cy = SH / 2, co = Math.cos(rot) * s, si = Math.sin(rot) * s;
      const a = co, b = co * ax - si * sy, c2 = si, d = si * ax + co * sy;
      return [[a, b, ox + cx + P.tx - (a * cx + b * cy)], [c2, d, oy + cy + P.ty - (c2 * cx + d * cy)], [0, 0, 1]];
    }
    function draw() {
      const M = matrix(), Mi = inv3(M);
      const src = U.getRGB(U.scene(SW, SH)), id = v.ctx.createImageData(W, H);
      const bg = U.css('--surface-2') === '' ? [20, 20, 20] : [20, 20, 20];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const w = Mi[2][0] * x + Mi[2][1] * y + Mi[2][2], u = (Mi[0][0] * x + Mi[0][1] * y + Mi[0][2]) / w, q = (Mi[1][0] * x + Mi[1][1] * y + Mi[1][2]) / w;
        const k = (y * W + x) * 4;
        if (u >= 0 && q >= 0 && u < SW - 1 && q < SH - 1) {
          const x0 = u | 0, y0 = q | 0, fx = u - x0, fy = q - y0;
          for (let ch = 0; ch < 3; ch++) {
            const p = (yy, xx) => src.data[(yy * SW + xx) * 4 + ch];
            id.data[k + ch] = (p(y0, x0) * (1 - fx) + p(y0, x0 + 1) * fx) * (1 - fy) + (p(y0 + 1, x0) * (1 - fx) + p(y0 + 1, x0 + 1) * fx) * fy;
          }
          id.data[k + 3] = 255;
        } else { id.data.set([...bg, 255], k); if ((x % 20 === 0) || (y % 20 === 0)) id.data.set([40, 40, 40, 255], k); }
      }
      v.ctx.putImageData(id, 0, 0);
      if (fam === 'projective') corners.forEach(([x, y]) => { v.ctx.fillStyle = '#e07a5f'; v.ctx.beginPath(); v.ctx.arc(x, y, 7, 0, 7); v.ctx.fill(); v.ctx.strokeStyle = '#fff'; v.ctx.lineWidth = 2; v.ctx.stroke(); });
      const f = (n) => (n >= 0 ? ' ' : '') + n.toFixed(fam === 'projective' ? 4 : 2);
      const rows = fam === 'projective' ? M : M.slice(0, 2);
      out.innerHTML = `<b>${fam}</b>  ${rows.length}×3 matrix · <b>${famInfo[fam][0]} DoF</b>\npreserves: ${famInfo[fam][1]}\n\n` + rows.map((r) => '[' + r.map(f).join('  ') + ' ]').join('\n') + (fam === 'projective' ? '\n\n(u, v) = (x\'/w\', y\'/w\')  — divide by the 3rd coordinate' : '');
    }
    let drag = -1;
    v.c.addEventListener('pointerdown', (e) => { if (fam !== 'projective') return; const p = U.mouse(v.c, e); drag = corners.findIndex(([x, y]) => Math.hypot(x - p.x, y - p.y) < 16); });
    v.c.addEventListener('pointermove', (e) => { if (drag < 0) return; const p = U.mouse(v.c, e); corners[drag] = [U.clamp(p.x, 0, W), U.clamp(p.y, 0, H)]; draw(); });
    addEventListener('pointerup', () => (drag = -1));
    vis(); draw();
    return U.onImage(draw);
  });

  /* ---------------- frequency split ---------------- */
  CV.widget('freq-split', { title: 'Low and high frequencies', desc: 'A blur keeps low frequencies (structure). Image − blur keeps high frequencies (edges, detail, noise). Adding detail back sharpens.' }, (body) => {
    const W = 220, H = 152;
    const cs = [0, 1, 2].map(() => U.pixCanvas(W, H, 260, false));
    let sigma = 2.5, k = 1.5;
    const ctl = U.el('div', { class: 'w-row', style: 'margin-bottom:12px' }); body.append(ctl);
    const c1 = U.el('div', { class: 'w-col' }), c2 = U.el('div', { class: 'w-col' }); ctl.append(c1, c2);
    U.slider(c1, { label: 'Blur σ (cut-off)', min: 0.5, max: 8, step: 0.1, value: sigma, onInput: (v) => { sigma = v; draw(); } });
    U.slider(c2, { label: 'Unsharp amount k', min: 0, max: 4, step: 0.05, value: k, onInput: (v) => { k = v; draw(); } });
    body.append(U.el('div', { class: 'w-row' }, ...['Low-pass: blur(f)', 'High-pass: f − blur(f)', 'Sharpened: f + k(f − blur(f))'].map((t, i) => U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, t), cs[i].c))));
    function draw() {
      const g = U.getGray(U.scene(W, H)), b = U.blur(g, sigma), n = W * H;
      const hp = new Float32Array(n), sh = new Float32Array(n);
      for (let i = 0; i < n; i++) { const d = g.data[i] - b.data[i]; hp[i] = 128 + d * 2; sh[i] = g.data[i] + k * d; }
      U.putGray(cs[0].ctx, b); U.putGray(cs[1].ctx, { w: W, h: H, data: hp }); U.putGray(cs[2].ctx, { w: W, h: H, data: sh });
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- coin counting pipeline ---------------- */
  CV.widget('coin-pipeline', { title: 'A complete classical pipeline: counting coins', desc: 'Blur → Otsu threshold → open/close → connected components. No training data needed.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 320, H = 220;
    const v = U.pixCanvas(W, H, 460, false);
    stage.append(U.el('div', { class: 'canvas-box' }, v.c));
    let step = 5, seed = 3, iters = 2, minArea = 60;
    U.seg(ctl, [[1, 'Input'], [2, 'Blur'], [3, 'Otsu'], [4, 'Morph'], [5, 'Count']], step, (x) => { step = x; draw(); });
    U.slider(ctl, { label: 'Morphology iterations', min: 0, max: 4, value: iters, onInput: (x) => { iters = x; draw(); } });
    U.slider(ctl, { label: 'Min contour area', min: 0, max: 400, value: minArea, onInput: (x) => { minArea = x; draw(); } });
    U.button(ctl, '🎲 New coins', () => { seed++; draw(); });
    const out = U.out(ctl);
    function scene() {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'), rnd = U.rand(seed * 77);
      const bg = x.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#5b4636'); bg.addColorStop(1, '#3a2c22');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      const coins = [];
      for (let k = 0; k < 40 && coins.length < 9; k++) {
        const r = 14 + rnd() * 12, cx = r + rnd() * (W - 2 * r), cy = r + rnd() * (H - 2 * r);
        if (coins.some((q) => Math.hypot(q[0] - cx, q[1] - cy) < q[2] + r + 6)) continue;
        coins.push([cx, cy, r]);
        const gr = x.createRadialGradient(cx - r / 3, cy - r / 3, 1, cx, cy, r);
        gr.addColorStop(0, '#fff3c4'); gr.addColorStop(0.7, '#d4a83a'); gr.addColorStop(1, '#8a6a1f');
        x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
        x.fillStyle = 'rgba(90,60,10,.6)'; x.beginPath(); x.arc(cx + r * 0.2, cy, r * 0.25, 0, 7); x.fill();
      }
      const id = x.getImageData(0, 0, W, H);
      for (let i = 0; i < id.data.length; i += 4) { const nz = (rnd() - 0.5) * 50; id.data[i] += nz; id.data[i + 1] += nz; id.data[i + 2] += nz; if (rnd() < 0.003) id.data[i] = id.data[i + 1] = id.data[i + 2] = 255; }
      x.putImageData(id, 0, 0);
      return { c, coins };
    }
    function draw() {
      const { c, coins } = scene();
      if (step === 1) { v.ctx.drawImage(c, 0, 0); out.innerHTML = 'img = cv2.imread("coins.jpg")'; return; }
      const g = U.blur(U.getGray(c), 2);
      if (step === 2) { U.putGray(v.ctx, g); out.innerHTML = 'blur = cv2.GaussianBlur(gray, (7, 7), 0)'; return; }
      const T = otsu(U.histogram(g.data), W * H);
      let bw = new Uint8Array(W * H); for (let i = 0; i < bw.length; i++) bw[i] = g.data[i] > T ? 1 : 0;
      const morph = (b, er) => { const o = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let all = 1, any = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { if (i * i + j * j > 5) continue; const xx = x + i, yy = y + j; const q = xx < 0 || yy < 0 || xx >= W || yy >= H ? 0 : b[yy * W + xx]; all &= q; any |= q; } o[y * W + x] = er ? all : any; } return o; };
      if (step >= 4) { for (let k = 0; k < iters; k++) bw = morph(bw, 1); for (let k = 0; k < iters; k++) bw = morph(bw, 0); for (let k = 0; k < iters; k++) bw = morph(bw, 0); for (let k = 0; k < iters; k++) bw = morph(bw, 1); }
      const id = v.ctx.createImageData(W, H);
      if (step < 5) {
        for (let i = 0; i < bw.length; i++) id.data.set(bw[i] ? [255, 255, 255, 255] : [0, 0, 0, 255], i * 4);
        v.ctx.putImageData(id, 0, 0);
        out.innerHTML = step === 3 ? `Otsu picked T = <b>${T}</b> automatically\n(maximises between-class variance)` : `opened (remove specks) then closed (fill holes)\n${iters} iteration(s) each, elliptical 5×5 element`;
        return;
      }
      // connected components
      const lab = new Int32Array(W * H), comps = [];
      for (let i = 0; i < bw.length; i++) if (bw[i] && !lab[i]) {
        const st = [i], id2 = comps.length + 1; lab[i] = id2; let area = 0, sx = 0, sy = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
        while (st.length) { const p = st.pop(), x = p % W, y = (p / W) | 0; area++; sx += x; sy += y; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const q = yy * W + xx; if (bw[q] && !lab[q]) { lab[q] = id2; st.push(q); } } }
        comps.push({ area, cx: sx / area, cy: sy / area, box: [x0, y0, x1, y1] });
      }
      v.ctx.drawImage(c, 0, 0);
      const keep = comps.filter((q) => q.area > minArea), pal = U.palette();
      keep.forEach((q, k) => { v.ctx.strokeStyle = pal[k % pal.length]; v.ctx.lineWidth = 2; v.ctx.strokeRect(q.box[0] - 1, q.box[1] - 1, q.box[2] - q.box[0] + 2, q.box[3] - q.box[1] + 2); v.ctx.fillStyle = '#000a'; v.ctx.fillRect(q.cx - 9, q.cy - 9, 18, 18); v.ctx.fillStyle = '#fff'; v.ctx.font = 'bold 12px Inter'; v.ctx.textAlign = 'center'; v.ctx.fillText(k + 1, q.cx, q.cy + 4); });
      v.ctx.textAlign = 'left';
      out.innerHTML = `components found: ${comps.length}\nafter area filter (&gt; ${minArea}): <b>coins: ${keep.length}</b>\ntrue number of coins: ${coins.length} ${keep.length === coins.length ? '✓' : '✗ tune me'}`;
    }
    draw();
  });
})();
