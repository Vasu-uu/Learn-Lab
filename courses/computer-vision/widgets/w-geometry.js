/* Widgets for Chapter 4 (features) and Chapter 5 (geometry, stereo, motion) */
(function () {
  'use strict';
  const U = CV.util;

  /* ---------------- Harris corners ---------------- */
  CV.widget('harris', { title: 'Harris corner detector', desc: 'Drag the probe window. Flat: both eigenvalues small. Edge: one large. Corner: both large.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 320, H = 220;
    const v = U.pixCanvas(W, H, 460, false);
    const over = U.canvas(W, H);
    over.c.style.cssText += ';position:absolute;left:8px;top:8px;width:calc(100% - 16px);max-width:460px;cursor:move';
    const box = U.el('div', { class: 'canvas-box', style: 'position:relative;max-width:476px' }, v.c, over.c);
    stage.append(box);
    let k = 0.05, thr = 0.02, view = 'image', probe = [63, 86], R, Ixx, Iyy, Ixy, mx;
    U.seg(ctl, [['image', 'Image + corners'], ['response', 'Response R']], view, (x) => { view = x; paint(); });
    U.slider(ctl, { label: 'k', min: 0.02, max: 0.15, step: 0.005, value: k, onInput: (x) => { k = x; compute(); } });
    U.slider(ctl, { label: 'Threshold (× max R)', min: 0.001, max: 0.2, step: 0.001, value: thr, onInput: (x) => { thr = x; paint(); } });
    const out = U.out(ctl);
    function compute() {
      const g = U.blur(U.getGray(U.scene(W, H)), 0.8);
      const gx = U.convolve(g, [-1, 0, 1, -2, 0, 2, -1, 0, 1], 3).data, gy = U.convolve(g, [-1, -2, -1, 0, 0, 0, 1, 2, 1], 3).data;
      const n = W * H, a = new Float32Array(n), b = new Float32Array(n), c = new Float32Array(n);
      for (let i = 0; i < n; i++) { a[i] = gx[i] * gx[i] / 64; b[i] = gy[i] * gy[i] / 64; c[i] = gx[i] * gy[i] / 64; }
      Ixx = U.blur({ w: W, h: H, data: a }, 1.5).data; Iyy = U.blur({ w: W, h: H, data: b }, 1.5).data; Ixy = U.blur({ w: W, h: H, data: c }, 1.5).data;
      R = new Float32Array(n); mx = 0;
      for (let i = 0; i < n; i++) { const det = Ixx[i] * Iyy[i] - Ixy[i] ** 2, tr = Ixx[i] + Iyy[i]; R[i] = det - k * tr * tr; if (R[i] > mx) mx = R[i]; }
      paint();
    }
    function paint() {
      if (view === 'image') v.ctx.drawImage(U.scene(W, H), 0, 0);
      else U.putGray(v.ctx, { w: W, h: H, data: R.map((x) => Math.sign(x) * Math.sqrt(Math.abs(x))) }, { mode: 'norm', map: U.magma });
      let nC = 0;
      for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
        const r = R[y * W + x]; if (r < thr * mx) continue;
        let isMax = true;
        for (let j = -3; j <= 3 && isMax; j++) for (let i = -3; i <= 3; i++) if (R[(y + j) * W + x + i] > r) { isMax = false; break; }
        if (!isMax) continue;
        nC++;
        v.ctx.strokeStyle = '#5b9cf5'; v.ctx.lineWidth = 1.5; v.ctx.beginPath(); v.ctx.arc(x + 0.5, y + 0.5, 4, 0, 7); v.ctx.stroke();
      }
      probeDraw(nC);
    }
    function probeDraw(nC) {
      const ctx = over.ctx; ctx.clearRect(0, 0, W, H);
      const [px, py] = probe, i = Math.round(py) * W + Math.round(px);
      const a = Ixx[i], b = Iyy[i], c = Ixy[i], tr = a + b, det = a * b - c * c, disc = Math.sqrt(Math.max(0, (tr / 2) ** 2 - det));
      const l1 = tr / 2 + disc, l2 = tr / 2 - disc, r = det - k * tr * tr;
      const big = 40;
      const kind = l1 < big && l2 < big ? ['FLAT', '#a5b1cc'] : l2 < big || l1 / Math.max(l2, 1e-6) > 8 ? ['EDGE', '#d4a73a'] : ['CORNER', '#4caf7d'];
      ctx.strokeStyle = kind[1]; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.strokeRect(px - 12, py - 12, 24, 24); ctx.setLineDash([]);
      // ellipse of M
      const ang = 0.5 * Math.atan2(2 * c, a - b), s1 = 4 + Math.sqrt(l1) * 0.8, s2 = 4 + Math.sqrt(Math.max(0, l2)) * 0.8;
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(0, 0, Math.min(40, s1), Math.min(40, s2), 0, 0, 7); ctx.fillStyle = kind[1] + '44'; ctx.fill(); ctx.stroke(); ctx.restore();
      out.innerHTML = `<b>probe</b> (${px | 0}, ${py | 0}) → <span style="color:${kind[1]};font-weight:700">${kind[0]}</span>\nλ₁ = ${l1.toFixed(0)}   λ₂ = ${l2.toFixed(0)}\nR = det(M) − k·tr(M)² = ${r.toFixed(0)}\n\ncorners detected: <b>${nC}</b>`;
    }
    let drag = false;
    over.c.addEventListener('pointerdown', (e) => { drag = true; const p = U.mouse(over.c, e); probe = [U.clamp(p.x, 2, W - 3), U.clamp(p.y, 2, H - 3)]; probeDraw('–'); });
    over.c.addEventListener('pointermove', (e) => { if (!drag) return; const p = U.mouse(over.c, e); probe = [U.clamp(p.x, 2, W - 3), U.clamp(p.y, 2, H - 3)]; probeDraw('–'); });
    addEventListener('pointerup', () => (drag = false));
    compute();
    return U.onImage(compute);
  });

  /* ---------------- HOG ---------------- */
  CV.widget('hog', { title: 'Histogram of Oriented Gradients', desc: 'Each cell gets a 9-bin histogram of gradient directions, weighted by magnitude. The glyphs show the dominant directions.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 320, H = 220;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let cell = 10, dim = 0.35;
    U.slider(ctl, { label: 'Cell size', min: 6, max: 20, value: cell, fmt: (v) => v + '×' + v + ' px', onInput: (v) => { cell = v; draw(); } });
    U.slider(ctl, { label: 'Image visibility', min: 0, max: 1, step: 0.01, value: dim, onInput: (v) => { dim = v; draw(); } });
    const out = U.out(ctl, `For a 64×128 pedestrian window:\n8×8 cells → 8×16 cells\n2×2-cell blocks, stride 1 cell → 7×15 = 105 blocks\n105 blocks × (4 cells × 9 bins) = <b>3780</b> numbers`);
    function draw() {
      const g = U.getGray(U.scene(W, H));
      const gx = U.convolve(g, [-1, 0, 1, -2, 0, 2, -1, 0, 1], 3).data, gy = U.convolve(g, [-1, -2, -1, 0, 0, 0, 1, 2, 1], 3).data;
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#05080f'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = dim; ctx.drawImage(U.scene(W, H), 0, 0, W, H); ctx.globalAlpha = 1;
      const nx = Math.floor(W / cell), ny = Math.floor(H / cell);
      let gmax = 0; const hists = [];
      for (let cy = 0; cy < ny; cy++) for (let cx = 0; cx < nx; cx++) {
        const h = new Float32Array(9);
        for (let y = cy * cell; y < (cy + 1) * cell; y++) for (let x = cx * cell; x < (cx + 1) * cell; x++) {
          const i = y * W + x, m = Math.hypot(gx[i], gy[i]); let a = Math.atan2(gy[i], gx[i]) * 180 / Math.PI; if (a < 0) a += 180;
          const b = (a / 20) % 9, b0 = Math.floor(b) % 9, f = b - Math.floor(b);
          h[b0] += m * (1 - f); h[(b0 + 1) % 9] += m * f;
        }
        hists.push(h); for (const v of h) gmax = Math.max(gmax, v);
      }
      ctx.lineCap = 'round';
      hists.forEach((h, k) => {
        const cx = (k % nx) * cell + cell / 2, cy = Math.floor(k / nx) * cell + cell / 2;
        h.forEach((v, b) => {
          if (v < gmax * 0.04) return;
          const a = ((b * 20 + 10 + 90) * Math.PI) / 180, L = (cell / 2) * Math.sqrt(v / gmax);
          ctx.strokeStyle = `rgba(91,156,245,${0.25 + 0.75 * (v / gmax)})`; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(cx - Math.cos(a) * L, cy - Math.sin(a) * L); ctx.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); ctx.stroke();
        });
      });
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- RANSAC ---------------- */
  CV.widget('ransac', { title: 'RANSAC: robust fitting with outliers', desc: 'Least squares is dragged by outliers. RANSAC samples 2 points, counts inliers, and keeps the best line.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let outFrac = 0.5, tol = 10, pts = [], best = null, cur = null, iter = 0, seed = 1, running = true;
    const gen = () => {
      const rnd = U.rand(seed * 31), n = 60, no = Math.round(n * outFrac);
      pts = [];
      const m = -0.45 + rnd() * 0.3, b = 190;
      for (let i = 0; i < n - no; i++) { const x = 30 + rnd() * (W - 60); pts.push([x, b + m * (x - W / 2) + U.gauss(rnd) * 4, 1]); }
      for (let i = 0; i < no; i++) pts.push([20 + rnd() * (W - 40), 20 + rnd() * (H - 40), 0]);
      best = null; cur = null; iter = 0;
    };
    U.slider(ctl, { label: 'Outlier fraction', min: 0, max: 0.8, step: 0.05, value: outFrac, fmt: (v) => Math.round(v * 100) + '%', onInput: (v) => { outFrac = v; gen(); } });
    U.slider(ctl, { label: 'Inlier tolerance (px)', min: 3, max: 30, value: tol, onInput: (v) => { tol = v; best = null; iter = 0; } });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    const pb = U.button(bb, '❚❚ Pause', () => { running = !running; pb.innerHTML = running ? '❚❚ Pause' : '▶ Run'; });
    U.button(bb, '🎲 New data', () => { seed++; gen(); });
    const out = U.out(ctl);
    const calc = U.el('div', { style: 'margin-top:4px' }); ctl.append(calc);
    let w = 0.5, s = 4, p = 0.99;
    const calcOut = U.el('div', { class: 'w-out' });
    const upd = () => { const N = Math.log(1 - p) / Math.log(1 - Math.pow(w, s)); calcOut.innerHTML = `N = log(1 − p) / log(1 − wˢ)\n  = <b>${Math.ceil(N)}</b> iterations`; };
    U.el('div');
    calc.append(U.el('div', { class: 'canvas-label' }, 'How many iterations?'));
    U.slider(calc, { label: 'Inlier ratio w', min: 0.1, max: 0.95, step: 0.01, value: w, onInput: (v) => { w = v; upd(); } });
    U.slider(calc, { label: 'Sample size s (4 = homography)', min: 2, max: 8, value: s, onInput: (v) => { s = v; upd(); } });
    U.slider(calc, { label: 'Success prob. p', min: 0.9, max: 0.999, step: 0.001, value: p, onInput: (v) => { p = v; upd(); } });
    calc.append(calcOut); upd();
    const lsq = () => { let sx = 0, sy = 0, sxx = 0, sxy = 0; pts.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; }); const n = pts.length, m = (n * sxy - sx * sy) / (n * sxx - sx * sx); return [m, (sy - m * sx) / n]; };
    const dist = (L, [x, y]) => { const [a, b, cc] = L; return Math.abs(a * x + b * y + cc) / Math.hypot(a, b); };
    gen();
    let acc = 0;
    U.loop(c, (dt) => {
      acc += dt;
      if (running && acc > 0.35 && iter < 200) {
        acc = 0; iter++;
        const r = Math.random;
        const i = Math.floor(r() * pts.length); let j = Math.floor(r() * pts.length); if (j === i) j = (j + 1) % pts.length;
        const [x1, y1] = pts[i], [x2, y2] = pts[j], L = [y2 - y1, x1 - x2, x2 * y1 - x1 * y2];
        const inl = pts.filter((q) => dist(L, q) < tol).length;
        cur = { L, i, j, inl };
        if (!best || inl > best.inl) best = { L, inl, it: iter };
      }
      ctx.clearRect(0, 0, W, H);
      const lineAt = (L, col, wd, dash) => { const [a, b, cc] = L; ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.setLineDash(dash || []); ctx.beginPath(); if (Math.abs(b) > 1e-6) { ctx.moveTo(0, -cc / b); ctx.lineTo(W, -(a * W + cc) / b); } else { ctx.moveTo(-cc / a, 0); ctx.lineTo(-cc / a, H); } ctx.stroke(); ctx.setLineDash([]); };
      const [m, b0] = lsq();
      lineAt([m, -1, b0], U.css('--bad'), 2, [6, 5]);
      if (cur) {
        const [a, b, cc] = cur.L, nrm = Math.hypot(a, b);
        ctx.fillStyle = 'rgba(157,143,214,.12)'; ctx.beginPath();
        if (Math.abs(b) > 1e-6) { const o = (tol * nrm) / Math.abs(b); ctx.moveTo(0, -cc / b - o); ctx.lineTo(W, -(a * W + cc) / b - o); ctx.lineTo(W, -(a * W + cc) / b + o); ctx.lineTo(0, -cc / b + o); }
        ctx.fill();
        lineAt(cur.L, U.css('--accent-2'), 1.5);
      }
      if (best) lineAt(best.L, U.css('--ok'), 3);
      pts.forEach((q, k) => {
        const inl = best && dist(best.L, q) < tol;
        ctx.fillStyle = inl ? U.css('--ok') : U.css('--text-3');
        ctx.beginPath(); ctx.arc(q[0], q[1], cur && (k === cur.i || k === cur.j) ? 6 : 3.5, 0, 7); ctx.fill();
        if (cur && (k === cur.i || k === cur.j)) { ctx.strokeStyle = U.css('--accent-2'); ctx.lineWidth = 2; ctx.stroke(); }
      });
      out.innerHTML = `iteration <b>${iter}</b>\ncurrent sample inliers: ${cur ? cur.inl : '–'}\n<span style="color:var(--ok)">best: ${best ? best.inl : '–'} inliers</span> (found at iter ${best ? best.it : '–'})\n<span style="color:var(--bad)">- - least squares (fooled by outliers)</span>`;
    });
  });

  /* ---------------- ratio test ---------------- */
  CV.widget('ratio-test', { title: "Lowe's ratio test", desc: 'A distinctive feature has one clearly best match. Accept only if d₁ < ratio × d₂.' }, (body) => {
    const { stage, ctl } = U.split(body);
    let ratio = 0.75;
    const rnd = U.rand(4);
    const feats = Array.from({ length: 12 }, (_, i) => { const d1 = 20 + rnd() * 60, amb = rnd() < 0.45; return { name: 'kp' + (i + 1), d1, d2: amb ? d1 * (1.02 + rnd() * 0.2) : d1 * (1.5 + rnd() * 1.5), correct: !amb || rnd() < 0.3 }; });
    const list = U.el('div', { class: 'bars' }); stage.append(list);
    U.slider(ctl, { label: 'Ratio threshold', min: 0.4, max: 1, step: 0.01, value: ratio, onInput: (v) => { ratio = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      let acc = 0, good = 0;
      list.innerHTML = feats.map((f) => {
        const r = f.d1 / f.d2, ok = r < ratio; if (ok) { acc++; if (f.correct) good++; }
        return `<div class="bar-row" style="grid-template-columns:50px 1fr 110px"><span style="font-family:var(--mono)">${f.name}</span><div class="track" style="position:relative"><div class="fill" style="width:${Math.min(100, r * 100)}%;background:${ok ? 'linear-gradient(90deg,var(--ok),var(--accent))' : 'var(--border-2)'}"></div><div style="position:absolute;top:-3px;bottom:-3px;left:${ratio * 100}%;width:2px;background:var(--warn)"></div></div><span class="v">${r.toFixed(2)} ${ok ? (f.correct ? '✓ keep' : '✗ keep') : '— drop'}</span></div>`;
      }).join('');
      out.innerHTML = `accepted: <b>${acc}</b> / ${feats.length}\ncorrect among accepted: <b>${good}</b>\n\nLower ratio → fewer, more reliable matches.\nThe survivors still go through RANSAC.`;
    }
    draw();
  });

  /* ---------------- virtual camera (K [R|t] + distortion) ---------------- */
  CV.widget('virtual-camera', { title: 'Virtual camera: s·[u v 1]ᵀ = K [R | t] X', desc: 'Change intrinsics (focal length, principal point), extrinsics (pose) and radial distortion k₁.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 440, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const P = { f: 380, cx: 220, yaw: 30, pitch: 20, dist: 7, k1: 0 };
    U.slider(ctl, { label: 'Focal length fx = fy (px)', min: 150, max: 800, value: P.f, onInput: (v) => { P.f = v; draw(); } });
    U.slider(ctl, { label: 'Principal point cx', min: 120, max: 320, value: P.cx, onInput: (v) => { P.cx = v; draw(); } });
    U.slider(ctl, { label: 'Yaw (R)', min: -90, max: 90, value: P.yaw, fmt: (v) => v + '°', onInput: (v) => { P.yaw = v; draw(); } });
    U.slider(ctl, { label: 'Pitch (R)', min: -10, max: 60, value: P.pitch, fmt: (v) => v + '°', onInput: (v) => { P.pitch = v; draw(); } });
    U.slider(ctl, { label: 'Distance (t)', min: 3.5, max: 14, step: 0.1, value: P.dist, onInput: (v) => { P.dist = v; draw(); } });
    U.slider(ctl, { label: 'Radial distortion k₁', min: -0.5, max: 0.5, step: 0.01, value: P.k1, fmt: (v) => v.toFixed(2) + (v < 0 ? ' barrel' : v > 0 ? ' pincushion' : ''), onInput: (v) => { P.k1 = v; draw(); } });
    const out = U.out(ctl);
    function project([X, Y, Z]) {
      const a = (P.yaw * Math.PI) / 180, b = (P.pitch * Math.PI) / 180;
      let x = Math.cos(a) * X - Math.sin(a) * Z, z = Math.sin(a) * X + Math.cos(a) * Z, y = Y;
      const y2 = Math.cos(b) * y - Math.sin(b) * z, z2 = Math.sin(b) * y + Math.cos(b) * z;
      const zc = z2 + P.dist;
      if (zc < 0.2) return null;
      let xn = x / zc, yn = -y2 / zc;
      const r2 = xn * xn + yn * yn, fac = 1 + P.k1 * r2 * 4;
      xn *= fac; yn *= fac;
      return [P.f * xn + P.cx, P.f * yn + H / 2];
    }
    function seg3(a, b, col, wd) {
      ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); let st = false;
      for (let i = 0; i <= 24; i++) { const t = i / 24, p = project([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); if (!p) { st = false; continue; } st ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); st = true; }
      ctx.stroke();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H);
      for (let i = -5; i <= 5; i++) { seg3([i, -1, -5], [i, -1, 5], 'rgba(150,150,150,.35)', 1); seg3([-5, -1, i], [5, -1, i], 'rgba(150,150,150,.35)', 1); }
      const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => seg3(V[a], V[b], '#5b9cf5', 2.5));
      seg3([0, -1, 0], [2.2, -1, 0], '#e5604d', 2); seg3([0, -1, 0], [0, 1.4, 0], '#4caf7d', 2); seg3([0, -1, 0], [0, -1, 2.2], '#60a5fa', 2);
      ctx.fillStyle = '#e07a5f'; ctx.beginPath(); ctx.arc(P.cx, H / 2, 4, 0, 7); ctx.fill();
      ctx.fillStyle = '#a5b1cc'; ctx.font = '11px Inter'; ctx.fillText('principal point', P.cx + 7, H / 2 - 6);
      out.innerHTML = `K = [ ${P.f}   0  ${P.cx} ]\n    [   0  ${P.f}  ${H / 2} ]\n    [   0    0    1 ]\n\nR: yaw ${P.yaw}°, pitch ${P.pitch}°   t = (0, 0, ${P.dist})\npose = 6 DoF (3 rotation + 3 translation)`;
    }
    draw();
  });

  /* ---------------- stereo depth ---------------- */
  CV.widget('stereo', { title: 'Stereo depth: Z = f · B / d', desc: 'Drag the 3D point. Far points have tiny disparity, so a 1-pixel error costs a lot of depth.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 320;
    const { c, ctx } = U.canvas(W, H);
    c.style.cursor = 'grab';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let B = 1.2, f = 1.0, P = [0.4, 5];
    const sc = 34, ox = W / 2, oy = H - 40;
    U.slider(ctl, { label: 'Baseline B (m)', min: 0.3, max: 3, step: 0.05, value: B, onInput: (v) => { B = v; draw(); } });
    U.slider(ctl, { label: 'Focal length f', min: 0.5, max: 2, step: 0.05, value: f, onInput: (v) => { f = v; draw(); } });
    const out = U.out(ctl);
    const chart = U.canvas(240, 120); ctl.append(U.el('div', { class: 'canvas-label' }, 'Depth error from 1 px disparity error'), chart.c);
    const X = (x) => ox + x * sc, Y = (z) => oy - z * sc;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cl = [-B / 2, 0], cr = [B / 2, 0];
      const a1 = U.css('--accent'), a2 = U.css('--accent-2'), a3 = U.css('--accent-3'), t3 = U.css('--text-3');
      [cl, cr].forEach(([x], k) => {
        ctx.fillStyle = k ? a2 : a1; U.roundRect(ctx, X(x) - 14, Y(0) - 4, 28, 20, 4); ctx.fill();
        ctx.strokeStyle = t3; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(x) - 40, Y(f)); ctx.lineTo(X(x) + 40, Y(f)); ctx.stroke();
      });
      const xl = (f * (P[0] - cl[0])) / P[1], xr = (f * (P[0] - cr[0])) / P[1], d = xl - xr;
      [[cl, xl, a1], [cr, xr, a2]].forEach(([cam, xi, col]) => {
        ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(X(cam[0]), Y(0)); ctx.lineTo(X(P[0]), Y(P[1])); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(cam[0] + xi), Y(f), 5, 0, 7); ctx.fill();
      });
      ctx.fillStyle = a3; ctx.beginPath(); ctx.arc(X(P[0]), Y(P[1]), 9, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center'; ctx.fillText('P', X(P[0]), Y(P[1]) + 4);
      ctx.fillStyle = t3; ctx.font = '11px Inter';
      ctx.fillText('left camera', X(cl[0]) - 10, Y(0) + 32); ctx.fillText('right camera', X(cr[0]) + 10, Y(0) + 32);
      ctx.textAlign = 'left'; ctx.fillText('image planes (at f)', X(cr[0]) + 44, Y(f) + 4);
      ctx.strokeStyle = t3; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(X(cl[0]), Y(0) + 20); ctx.lineTo(X(cr[0]), Y(0) + 20); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = 'center'; ctx.fillText('B', X(0), Y(0) + 18);
      const pxPerUnit = 500;
      out.innerHTML = `x_L = ${xl.toFixed(3)}   x_R = ${xr.toFixed(3)}\ndisparity d = x_L − x_R = <b>${d.toFixed(3)}</b>\nZ = f·B/d = ${f.toFixed(2)}×${B.toFixed(2)}/${d.toFixed(3)} = <b>${((f * B) / d).toFixed(2)} m</b>\n(true Z = ${P[1].toFixed(2)})`;
      const g = chart.ctx;
      g.clearRect(0, 0, 240, 120);
      const p = U.plot(g, 240, 120, { x0: 1, x1: 9, y0: 0, y1: 4, xticks: 4, yticks: 2, fmtX: (v) => v.toFixed(0) + 'm', fmtY: (v) => v.toFixed(0), pad: [6, 8, 20, 26] });
      p.fn((z) => (z * z) / (f * B * pxPerUnit) * 10, U.css('--accent-3'));
      g.fillStyle = U.css('--accent'); g.beginPath(); g.arc(p.X(U.clamp(P[1], 1, 9)), p.Y(Math.min(4, (P[1] ** 2 / (f * B * pxPerUnit)) * 10)), 5, 0, 7); g.fill();
    }
    let drag = false;
    c.addEventListener('pointerdown', () => (drag = true));
    c.addEventListener('pointermove', (e) => { if (!drag) return; const p = U.mouse(c, e); P = [U.clamp((p.x - ox) / sc, -6, 6), U.clamp((oy - p.y) / sc, f + 0.6, 8.3)]; draw(); });
    addEventListener('pointerup', () => (drag = false));
    draw();
  });

  /* ---------------- aperture problem ---------------- */
  CV.widget('aperture', { title: 'The aperture problem', desc: 'Through a small window, a moving edge only reveals motion perpendicular to itself. Widen the window until a corner appears.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 380px' });
    const W = 420, H = 280;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let rad = 50, ang = 35, showTrue = true;
    U.slider(ctl, { label: 'Aperture radius', min: 25, max: 200, value: rad, onInput: (v) => (rad = v) });
    U.slider(ctl, { label: 'True motion direction', min: 0, max: 360, value: ang, fmt: (v) => v + '°', onInput: (v) => (ang = v) });
    U.check(ctl, 'Show true motion', showTrue, (v) => (showTrue = v));
    U.out(ctl, `Brightness constancy gives one equation\nper pixel:  Ix·u + Iy·v + It = 0\nbut there are two unknowns (u, v).\n\nLucas–Kanade: assume constant flow in a\nwindow and solve by least squares → needs\ntexture in 2 directions (a corner).`);
    let t = 0;
    U.loop(c, (dt) => {
      t += dt;
      ctx.clearRect(0, 0, W, H);
      const a = (ang * Math.PI) / 180, sp = 40, cx = W / 2, cy = H / 2;
      const ph = ((t * sp) % 200) - 100;
      const sx = cx - 80 + Math.cos(a) * ph, sy = cy - 60 + Math.sin(a) * ph;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.clip();
      ctx.fillStyle = '#0d0d0d'; ctx.fillRect(0, 0, W, H);
      // big rotated square
      ctx.translate(sx, sy); ctx.rotate(0.5);
      const grad = ctx.createLinearGradient(-120, 0, 120, 0); grad.addColorStop(0, '#5b9cf5'); grad.addColorStop(1, '#9d8fd6');
      ctx.fillStyle = grad; ctx.fillRect(-150, -150, 190, 190);
      ctx.restore();
      ctx.strokeStyle = U.css('--text-2'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.stroke();
      // normal component (edge normal is rotation 0.5)
      const n = [Math.cos(0.5), Math.sin(0.5)], v = [Math.cos(a), Math.sin(a)], dot = v[0] * n[0] + v[1] * n[1];
      ctx.lineWidth = 3;
      if (showTrue) { ctx.strokeStyle = ctx.fillStyle = '#e07a5f'; U.arrow(ctx, cx, cy, cx + v[0] * 70, cy + v[1] * 70, 10); }
      ctx.strokeStyle = ctx.fillStyle = '#d4a73a'; U.arrow(ctx, cx, cy, cx + n[0] * dot * 70, cy + n[1] * dot * 70, 10);
      ctx.font = '600 12px Inter'; ctx.fillStyle = '#d4a73a'; ctx.fillText('perceived (normal) motion', 10, 20);
      if (showTrue) { ctx.fillStyle = '#e07a5f'; ctx.fillText('true motion', 10, 38); }
    });
  });
})();
