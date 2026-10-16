/* Widgets for Chapter 6: machine learning essentials */
(function () {
  'use strict';
  const U = CV.util;

  /* ---------------- softmax + cross entropy ---------------- */
  CV.widget('softmax-ce', { title: 'Softmax and cross-entropy', desc: 'Drag the raw scores (logits). Softmax turns them into probabilities; the loss is −log of the true class probability.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const names = ['cat', 'dog', 'car', 'tree'];
    let z = [2.0, 1.0, -0.5, 0.3], y = 0, T = 1;
    const bars = U.el('div', { class: 'bars' }); stage.append(U.el('div', { class: 'canvas-label' }, 'Probabilities p = softmax(s / T)'), bars);
    const lossC = U.canvas(360, 150); stage.append(U.el('div', { class: 'canvas-label', style: 'margin-top:14px' }, 'Loss L = −log p_true'), lossC.c);
    names.forEach((n, i) => U.slider(ctl, { label: `logit s(${n})`, min: -5, max: 5, step: 0.05, value: z[i], fmt: (v) => v.toFixed(2), onInput: (v) => { z[i] = v; draw(); } }));
    U.slider(ctl, { label: 'Temperature T', min: 0.2, max: 4, step: 0.05, value: T, fmt: (v) => v.toFixed(2), onInput: (v) => { T = v; draw(); } });
    const row = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'True class')); ctl.append(row);
    U.seg(row, names.map((n, i) => [i, n]), y, (v) => { y = v; draw(); });
    const out = U.out(ctl);
    function draw() {
      const m = Math.max(...z), e = z.map((v) => Math.exp((v - m) / T)), s = e.reduce((a, b) => a + b), p = e.map((v) => v / s);
      bars.innerHTML = p.map((v, i) => `<div class="bar-row"><span style="${i === y ? 'color:var(--ok);font-weight:700' : ''}">${names[i]}${i === y ? ' ✓' : ''}</span><div class="track"><div class="fill" style="width:${v * 100}%;${i === y ? 'background:linear-gradient(90deg,var(--ok),var(--accent))' : ''}"></div></div><span class="v">${(v * 100).toFixed(1)}%</span></div>`).join('');
      const L = -Math.log(p[y]);
      const ctx = lossC.ctx; ctx.clearRect(0, 0, 360, 150);
      const pl = U.plot(ctx, 360, 150, { x0: 0.001, x1: 1, y0: 0, y1: 5, xticks: 4, yticks: 5, xlabel: 'p_true', fmtX: (v) => v.toFixed(2), fmtY: (v) => v.toFixed(0) });
      pl.fn((x) => -Math.log(x), U.css('--accent-2'));
      ctx.fillStyle = U.css('--accent-3'); ctx.beginPath(); ctx.arc(pl.X(p[y]), pl.Y(Math.min(5, L)), 6, 0, 7); ctx.fill();
      out.innerHTML = `p_k = exp(s_k) / Σ_j exp(s_j)\nL = −log(${p[y].toFixed(3)}) = <b>${L.toFixed(3)}</b>\n\n${L < 0.2 ? 'Confident and right: tiny loss.' : p[y] < 0.1 ? 'Confidently wrong: loss explodes.' : 'Uncertain: moderate loss.'}\nRandom guess over 4 classes: ln 4 = 1.386`;
    }
    draw();
  });

  /* ---------------- gradient descent on a 2D loss ---------------- */
  CV.widget('grad-descent', { title: 'Gradient descent on a loss landscape', desc: 'Click to drop a starting point. Compare learning rates and optimizers on an elongated valley.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 440, H = 300;
    const { c, ctx } = U.canvas(W, H);
    c.style.cursor = 'crosshair';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let lr = 0.06, opt = 'sgd', start = [-1.6, 1.3], path = [], state = null, playing = true;
    const Lf = (x, y) => 0.5 * (x * x * 0.6 + 6 * y * y) + 0.12 * Math.sin(2 * x) + 0.04;
    const grad = (x, y) => [0.6 * x + 0.24 * Math.cos(2 * x), 6 * y];
    const X0 = -2.4, X1 = 2.4, Y0 = -1.6, Y1 = 1.6;
    const toPx = (x, y) => [((x - X0) / (X1 - X0)) * W, H - ((y - Y0) / (Y1 - Y0)) * H];
    const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    (function paintBg() {
      const b = bg.getContext('2d'), id = b.createImageData(W, H);
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const x = X0 + (i / W) * (X1 - X0), y = Y0 + ((H - j) / H) * (Y1 - Y0), v = Lf(x, y);
        const sv = Math.sqrt(Math.max(0, v + 0.15)), t = Math.min(1, sv / 3), col = U.viridis(1 - t);
        const contour = Math.abs((sv * 4) % 1 - 0.5) > 0.46;
        id.data.set([col[0] * (contour ? 1.25 : 0.55), col[1] * (contour ? 1.25 : 0.55), col[2] * (contour ? 1.25 : 0.55), 255], (j * W + i) * 4);
      }
      b.putImageData(id, 0, 0);
    })();
    U.slider(ctl, { label: 'Learning rate η', min: 0.005, max: 0.36, step: 0.005, value: lr, fmt: (v) => v.toFixed(3), onInput: (v) => { lr = v; reset(); } });
    U.seg(ctl, [['sgd', 'SGD'], ['mom', 'Momentum 0.9'], ['adam', 'Adam']], opt, (v) => { opt = v; reset(); });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, '↺ Restart', reset);
    const out = U.out(ctl);
    function reset() { path = [start.slice()]; state = { v: [0, 0], m: [0, 0], s: [0, 0], t: 0 }; playing = true; }
    c.addEventListener('pointerdown', (e) => { const p = U.mouse(c, e); start = [X0 + (p.x / W) * (X1 - X0), Y0 + ((H - p.y) / H) * (Y1 - Y0)]; reset(); });
    reset();
    let acc = 0;
    U.loop(c, (dt) => {
      acc += dt;
      if (playing && acc > 0.06 && path.length < 160) {
        acc = 0;
        const [x, y] = path[path.length - 1], g = grad(x, y);
        let step;
        if (opt === 'sgd') step = g.map((v) => lr * v);
        else if (opt === 'mom') { state.v = state.v.map((v, i) => 0.9 * v + g[i]); step = state.v.map((v) => lr * v); }
        else { state.t++; state.m = state.m.map((v, i) => 0.9 * v + 0.1 * g[i]); state.s = state.s.map((v, i) => 0.999 * v + 0.001 * g[i] * g[i]); step = state.m.map((v, i) => (lr * 0.5 * (v / (1 - 0.9 ** state.t))) / (Math.sqrt(state.s[i] / (1 - 0.999 ** state.t)) + 1e-8)); }
        const nx = x - step[0], ny = y - step[1];
        path.push([nx, ny]);
        if (Math.abs(nx) > 50 || Math.abs(ny) > 50) playing = false;
      }
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath();
      path.forEach(([x, y], i) => { const [px, py] = toPx(x, y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke();
      path.forEach(([x, y], i) => { const [px, py] = toPx(x, y); ctx.fillStyle = i === path.length - 1 ? '#e07a5f' : '#fff'; ctx.beginPath(); ctx.arc(px, py, i === path.length - 1 ? 6 : 2.5, 0, 7); ctx.fill(); });
      const [x, y] = path[path.length - 1], L = Lf(x, y);
      const status = !isFinite(L) || L > 40 ? '<span style="color:var(--bad)">DIVERGED: η too large</span>' : Math.hypot(...grad(x, y)) < 0.01 ? '<span style="color:var(--ok)">converged ✓</span>' : path.length >= 160 ? 'still crawling: η too small?' : 'descending…';
      out.innerHTML = `θ ← θ − η · ∇L\nstep <b>${path.length - 1}</b>   loss = <b>${isFinite(L) ? L.toFixed(4) : '∞'}</b>\n${status}\n\nThe valley is 10× steeper in y than x:\nSGD zig-zags; momentum and Adam smooth it.`;
    });
  });

  /* ---------------- activation functions ---------------- */
  CV.widget('activations', { title: 'Activation functions', desc: 'Toggle functions and their derivatives. Flat tails (saturation) mean tiny gradients.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 280;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const F = {
      sigmoid: [(x) => 1 / (1 + Math.exp(-x)), (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }],
      tanh: [Math.tanh, (x) => 1 - Math.tanh(x) ** 2],
      ReLU: [(x) => Math.max(0, x), (x) => (x > 0 ? 1 : 0)],
      'Leaky ReLU': [(x) => (x > 0 ? x : 0.1 * x), (x) => (x > 0 ? 1 : 0.1)],
      GELU: [(x) => 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3))), null],
      'SiLU / Swish': [(x) => x / (1 + Math.exp(-x)), null],
    };
    const on = { sigmoid: true, ReLU: true, GELU: true };
    let deriv = false;
    const pal = U.palette();
    Object.keys(F).forEach((k, i) => U.check(ctl, U.el('span', { html: `<span style="color:${pal[i]}">●</span> ${k}` }), !!on[k], (v) => { on[k] = v; draw(); }));
    U.check(ctl, 'Show derivatives (dashed)', deriv, (v) => { deriv = v; draw(); });
    U.out(ctl, 'ReLU = max(0, x): cheap, no saturation\nfor x &gt; 0, but a neuron stuck at negative\ninputs "dies" (gradient 0).\nGELU/SiLU: smooth ReLU-like curves used\nin transformers, EfficientNet, ConvNeXt, YOLO.');
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const p = U.plot(ctx, W, H, { x0: -5, x1: 5, y0: -1.5, y1: 3, xticks: 10, yticks: 9, fmtX: (v) => v.toFixed(0), fmtY: (v) => v.toFixed(1) });
      ctx.strokeStyle = U.css('--text-3'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.X(0), p.Y(-1.5)); ctx.lineTo(p.X(0), p.Y(3)); ctx.moveTo(p.X(-5), p.Y(0)); ctx.lineTo(p.X(5), p.Y(0)); ctx.stroke();
      Object.entries(F).forEach(([k, [f, df]], i) => {
        if (!on[k]) return;
        p.fn(f, pal[i], 2.6);
        if (deriv) { const d = df || ((x) => (f(x + 1e-3) - f(x - 1e-3)) / 2e-3); p.fn(d, pal[i], 1.6, 300, [5, 4]); }
      });
    }
    draw();
  });

  /* ---------------- LR schedules ---------------- */
  CV.widget('lr-schedules', { title: 'Learning-rate schedules', desc: 'Step decay, cosine annealing, and linear warm-up followed by cosine decay.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 240;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let E = 100, warm = 10, stepEvery = 30, gamma = 0.1, lr0 = 1;
    U.slider(ctl, { label: 'Warm-up epochs', min: 0, max: 30, value: warm, onInput: (v) => { warm = v; draw(); } });
    U.slider(ctl, { label: 'Step decay every', min: 10, max: 50, value: stepEvery, fmt: (v) => v + ' epochs', onInput: (v) => { stepEvery = v; draw(); } });
    U.slider(ctl, { label: 'Step factor γ', min: 0.1, max: 0.7, step: 0.05, value: gamma, onInput: (v) => { gamma = v; draw(); } });
    const pal = U.palette();
    U.out(ctl, `<span style="color:${pal[0]}">━ step decay</span>\n<span style="color:${pal[1]}">━ cosine</span>\n<span style="color:${pal[2]}">━ warm-up + cosine</span>\n\nWarm-up stabilises large models;\ndecay settles into a good minimum.`);
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const p = U.plot(ctx, W, H, { x0: 0, x1: E, y0: 0, y1: 1.05, xticks: 5, yticks: 4, xlabel: 'epoch', ylabel: 'LR / LR₀', fmtX: (v) => v.toFixed(0) });
      p.fn((e) => lr0 * Math.pow(gamma, Math.floor(e / stepEvery)), pal[0], 2.5, 500);
      p.fn((e) => 0.5 * lr0 * (1 + Math.cos((Math.PI * e) / E)), pal[1]);
      p.fn((e) => (e < warm ? (lr0 * e) / Math.max(1, warm) : 0.5 * lr0 * (1 + Math.cos((Math.PI * (e - warm)) / (E - warm)))), pal[2], 3);
    }
    draw();
  });

  /* ---------------- overfitting with polynomials ---------------- */
  CV.widget('overfit', { title: 'Underfitting vs overfitting', desc: 'Fit polynomials of increasing degree to 14 noisy points. Training error keeps falling; validation error does not.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 260;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const curve = U.canvas(240, 140);
    let deg = 3, lam = 0, seed = 2, tr, va;
    const truth = (x) => Math.sin(2.5 * x) * 0.8 + 0.3 * x;
    const gen = () => { const r = U.rand(seed * 13); tr = Array.from({ length: 14 }, () => { const x = -1 + 2 * r(); return [x, truth(x) + U.gauss(r) * 0.18]; }); va = Array.from({ length: 30 }, () => { const x = -1 + 2 * r(); return [x, truth(x) + U.gauss(r) * 0.18]; }); };
    gen();
    U.slider(ctl, { label: 'Polynomial degree (capacity)', min: 1, max: 13, value: deg, onInput: (v) => { deg = v; draw(); } });
    U.slider(ctl, { label: 'Weight decay λ', min: 0, max: 0.1, step: 0.001, value: lam, fmt: (v) => v.toFixed(3), onInput: (v) => { lam = v; draw(); } });
    U.button(ctl, '🎲 New sample', () => { seed++; draw(); });
    const out = U.out(ctl);
    ctl.append(U.el('div', { class: 'canvas-label' }, 'Error vs degree'), curve.c);
    function fit(d, l) {
      const n = d + 1, A = Array.from({ length: n }, () => new Float64Array(n + 1));
      tr.forEach(([x, y]) => { const pw = Array.from({ length: n }, (_, i) => x ** i); for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += pw[i] * pw[j]; A[i][n] += pw[i] * y; } });
      for (let i = 1; i < n; i++) A[i][i] += l * 14 + 1e-9;
      for (let cI = 0; cI < n; cI++) { let p = cI; for (let r = cI + 1; r < n; r++) if (Math.abs(A[r][cI]) > Math.abs(A[p][cI])) p = r; [A[cI], A[p]] = [A[p], A[cI]]; for (let r = 0; r < n; r++) if (r !== cI) { const f = A[r][cI] / A[cI][cI]; for (let k = cI; k <= n; k++) A[r][k] -= f * A[cI][k]; } }
      const w = A.map((r, i) => r[n] / r[i]);
      return (x) => w.reduce((s, wi, i) => s + wi * x ** i, 0);
    }
    const mse = (f, D) => D.reduce((s, [x, y]) => s + (f(x) - y) ** 2, 0) / D.length;
    function draw() {
      gen();
      ctx.clearRect(0, 0, W, H);
      const p = U.plot(ctx, W, H, { x0: -1, x1: 1, y0: -1.6, y1: 1.6, xticks: 4, yticks: 4 });
      p.fn(truth, U.css('--text-3'), 1.5, 200, [4, 4]);
      const f = fit(deg, lam);
      p.fn(f, U.css('--accent-3'), 3);
      va.forEach(([x, y]) => { ctx.strokeStyle = U.css('--accent-2'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.X(x), p.Y(y), 3.5, 0, 7); ctx.stroke(); });
      tr.forEach(([x, y]) => { ctx.fillStyle = U.css('--accent'); ctx.beginPath(); ctx.arc(p.X(x), p.Y(y), 4.5, 0, 7); ctx.fill(); });
      const te = mse(f, tr), ve = mse(f, va);
      out.innerHTML = `<span style="color:var(--accent)">● train</span>  MSE = <b>${te.toFixed(4)}</b>\n<span style="color:var(--accent-2)">○ val</span>    MSE = <b>${ve.toFixed(4)}</b>\n${deg <= 2 ? 'Underfitting: too simple.' : ve > te * 3 && ve > 0.08 ? '<span style="color:var(--bad)">Overfitting: memorising noise.</span>' : 'Good fit.'}`;
      const g = curve.ctx; g.clearRect(0, 0, 240, 140);
      const q = U.plot(g, 240, 140, { x0: 1, x1: 13, y0: 0, y1: 0.3, xticks: 4, yticks: 3, pad: [6, 6, 20, 34], fmtX: (v) => v.toFixed(0) });
      const ds = Array.from({ length: 13 }, (_, i) => i + 1), fs = ds.map((d) => fit(d, lam));
      q.line(ds.map((d, i) => [d, Math.min(0.3, mse(fs[i], tr))]), U.css('--accent'));
      q.line(ds.map((d, i) => [d, Math.min(0.3, mse(fs[i], va))]), U.css('--accent-2'));
      g.strokeStyle = U.css('--accent-3'); g.setLineDash([3, 3]); g.beginPath(); g.moveTo(q.X(deg), 6); g.lineTo(q.X(deg), 120); g.stroke(); g.setLineDash([]);
    }
    draw();
  });

  /* ---------------- metrics from a confusion matrix ---------------- */
  CV.widget('metrics', { title: 'Confusion matrix → metrics', desc: 'Change the counts. Try the imbalanced preset to see why accuracy can lie.' }, (body) => {
    const { stage, ctl } = U.split(body);
    let M = { TP: 80, FN: 20, FP: 15, TN: 85 };
    const grid = U.el('div', { style: 'display:grid;grid-template-columns:auto 1fr 1fr;gap:6px;max-width:360px;font-size:13px' });
    stage.append(grid);
    const bars = U.el('div', { class: 'bars', style: 'margin-top:16px' }); stage.append(bars);
    const sl = {};
    [['TP', 'True positives'], ['FN', 'False negatives (missed)'], ['FP', 'False positives (false alarms)'], ['TN', 'True negatives']].forEach(([k, l]) => (sl[k] = U.slider(ctl, { label: l, min: 0, max: 1000, value: M[k], onInput: (v) => { M[k] = v; draw(); } })));
    const pb = U.el('div', { class: 'w-btns' }); ctl.append(pb);
    const set = (o) => { Object.assign(M, o); Object.keys(o).forEach((k) => sl[k].set(o[k])); draw(); };
    U.button(pb, 'Balanced', () => set({ TP: 80, FN: 20, FP: 15, TN: 85 }));
    U.button(pb, '1% defects, "always no"', () => set({ TP: 0, FN: 10, FP: 0, TN: 990 }));
    U.button(pb, 'Imbalanced, decent model', () => set({ TP: 7, FN: 3, FP: 25, TN: 965 }));
    function draw() {
      const { TP, FN, FP, TN } = M, tot = TP + FN + FP + TN || 1;
      const cell = (v, l, col) => `<div style="padding:14px;border-radius:10px;text-align:center;background:${col};font-family:var(--mono);color:#000"><b style="font-size:20px">${v}</b><br><small>${l}</small></div>`;
      grid.innerHTML = `<div></div><div class="canvas-label" style="text-align:center">Predicted +</div><div class="canvas-label" style="text-align:center">Predicted −</div>
        <div class="canvas-label" style="align-self:center">Actual +</div>${cell(TP, 'TP', 'rgba(76,175,125,.75)')}${cell(FN, 'FN', 'rgba(229,96,77,.7)')}
        <div class="canvas-label" style="align-self:center">Actual −</div>${cell(FP, 'FP', 'rgba(212,167,58,.75)')}${cell(TN, 'TN', 'rgba(91,156,245,.6)')}`;
      const P = TP / (TP + FP || 1), R = TP / (TP + FN || 1), F1 = (2 * P * R) / (P + R || 1);
      const rows = [['Accuracy', (TP + TN) / tot, '(TP+TN)/total'], ['Precision', P, 'TP/(TP+FP)'], ['Recall', R, 'TP/(TP+FN)'], ['F1', F1, '2PR/(P+R)'], ['Specificity', TN / (TN + FP || 1), 'TN/(TN+FP)']];
      bars.innerHTML = rows.map(([n, v, fm]) => `<div class="bar-row" style="grid-template-columns:90px 1fr 120px"><span title="${fm}">${n}</span><div class="track"><div class="fill" style="width:${v * 100}%"></div></div><span class="v">${(v * 100).toFixed(1)}% <small style="color:var(--text-3)">${fm}</small></span></div>`).join('');
    }
    draw();
  });

  /* ---------------- tiny neural network playground ---------------- */
  CV.widget('nn-playground', { title: 'Train a tiny neural network', desc: 'A 2-layer MLP learns to separate two classes in 2D, live in your browser. Linear models can only draw straight lines.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 380px' });
    const W = 360, H = 360;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box', style: 'max-width:380px' }, c));
    let data = 'moons', hidden = 12, act = 'tanh', lr = 0.15, net, pts, epoch = 0, running = true;
    U.seg(ctl, [['moons', 'Moons'], ['circles', 'Circles'], ['spiral', 'Spiral'], ['linear', 'Linear']], data, (v) => { data = v; init(); });
    U.slider(ctl, { label: 'Hidden units (0 = linear model)', min: 0, max: 32, value: hidden, onInput: (v) => { hidden = v; init(); } });
    U.seg(ctl, [['tanh', 'tanh'], ['relu', 'ReLU']], act, (v) => { act = v; init(); });
    U.slider(ctl, { label: 'Learning rate', min: 0.01, max: 0.6, step: 0.01, value: lr, onInput: (v) => (lr = v) });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    const pbtn = U.button(bb, '❚❚ Pause', () => { running = !running; pbtn.innerHTML = running ? '❚❚ Pause' : '▶ Train'; });
    U.button(bb, '↺ Reset weights', () => init());
    const out = U.out(ctl);
    function genData() {
      const r = U.rand(42), P = [];
      for (let i = 0; i < 200; i++) {
        const cl = i % 2; let x, y;
        if (data === 'moons') { const t = Math.PI * r(); x = cl ? 1 - Math.cos(t) - 0.5 : Math.cos(t) - 0.5; y = cl ? 0.5 - Math.sin(t) + 0.25 : Math.sin(t) - 0.25; x += U.gauss(r) * 0.1; y += U.gauss(r) * 0.1; x *= 0.9; y *= 0.9; }
        else if (data === 'circles') { const t = 2 * Math.PI * r(), rad = cl ? 0.35 : 0.85; x = rad * Math.cos(t) + U.gauss(r) * 0.08; y = rad * Math.sin(t) + U.gauss(r) * 0.08; }
        else if (data === 'spiral') { const t = 0.5 + 3.2 * r(), rad = t / 4; x = rad * Math.cos(t + cl * Math.PI) + U.gauss(r) * 0.04; y = rad * Math.sin(t + cl * Math.PI) + U.gauss(r) * 0.04; }
        else { x = r() * 2 - 1; y = r() * 2 - 1; if ((x + y * 0.5 > 0) !== !!cl) { x = -x; y = -y; } }
        P.push([x, y, cl]);
      }
      return P;
    }
    function init() {
      pts = genData(); epoch = 0;
      const r = U.rand(7), g = () => U.gauss(r);
      const h = hidden;
      net = h ? { W1: Array.from({ length: h }, () => [g() * 1.2, g() * 1.2]), b1: new Array(h).fill(0).map(() => g() * 0.3), W2: Array.from({ length: h }, () => g() * 0.6), b2: 0 } : { W2: [g(), g()], b2: 0 };
    }
    const sig = (z) => 1 / (1 + Math.exp(-z));
    const fa = (z) => (act === 'tanh' ? Math.tanh(z) : Math.max(0, z));
    const da = (a, z) => (act === 'tanh' ? 1 - a * a : z > 0 ? 1 : 0);
    function forward(x, y) {
      if (!hidden) return { p: sig(net.W2[0] * x + net.W2[1] * y + net.b2) };
      const z = net.W1.map((w, i) => w[0] * x + w[1] * y + net.b1[i]), a = z.map(fa);
      return { z, a, p: sig(a.reduce((s, v, i) => s + v * net.W2[i], net.b2)) };
    }
    function trainStep() {
      let loss = 0, acc = 0;
      const gW1 = hidden ? net.W1.map(() => [0, 0]) : null, gb1 = hidden ? new Array(hidden).fill(0) : null, gW2 = net.W2.map(() => 0); let gb2 = 0;
      for (const [x, y, t] of pts) {
        const f = forward(x, y), d = f.p - t;
        loss += -(t * Math.log(f.p + 1e-9) + (1 - t) * Math.log(1 - f.p + 1e-9)); acc += (f.p > 0.5) === !!t;
        gb2 += d;
        if (!hidden) { gW2[0] += d * x; gW2[1] += d * y; continue; }
        f.a.forEach((a, i) => { gW2[i] += d * a; const dz = d * net.W2[i] * da(a, f.z[i]); gW1[i][0] += dz * x; gW1[i][1] += dz * y; gb1[i] += dz; });
      }
      const n = pts.length;
      net.W2 = net.W2.map((w, i) => w - (lr * gW2[i]) / n * 4); net.b2 -= (lr * gb2) / n * 4;
      if (hidden) { net.W1 = net.W1.map((w, i) => [w[0] - (lr * gW1[i][0]) / n * 4, w[1] - (lr * gW1[i][1]) / n * 4]); net.b1 = net.b1.map((b, i) => b - (lr * gb1[i]) / n * 4); }
      epoch++;
      return [loss / n, acc / n];
    }
    init();
    const G = 60, img = document.createElement('canvas'); img.width = G; img.height = G;
    const ictx = img.getContext('2d');
    let last = [0, 0];
    U.loop(c, () => {
      if (running) for (let k = 0; k < 5; k++) last = trainStep();
      const id = ictx.createImageData(G, G);
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const p = forward((i / G) * 2.4 - 1.2, 1.2 - (j / G) * 2.4).p;
        const a = [91, 156, 245], b = [224, 122, 95], t = p;
        id.data.set([a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t, 90 + Math.abs(p - 0.5) * 200], (j * G + i) * 4);
      }
      ictx.putImageData(id, 0, 0);
      ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(img, 0, 0, W, H);
      pts.forEach(([x, y, t]) => { ctx.fillStyle = t ? '#e07a5f' : '#5b9cf5'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(((x + 1.2) / 2.4) * W, ((1.2 - y) / 2.4) * H, 4, 0, 7); ctx.fill(); ctx.stroke(); });
      out.innerHTML = `epoch <b>${epoch}</b>\nloss (BCE) = <b>${last[0].toFixed(4)}</b>\naccuracy   = <b>${(last[1] * 100).toFixed(1)}%</b>\n${hidden ? `2 → ${hidden} (${act}) → 1 (sigmoid)\nparams: ${hidden * 3 + hidden + 1}` : 'linear model: 2 → 1 (sigmoid)\nonly straight boundaries possible'}`;
    });
  });
})();
