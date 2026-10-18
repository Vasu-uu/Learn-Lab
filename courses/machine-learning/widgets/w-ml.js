/* Machine Learning course demos: regression, k-NN, k-means, trees, PCA, ROC */
(function () {
  'use strict';
  const U = CV.util;
  const BLUE = '#5b9cf5', ORANGE = '#e07a5f', GREEN = '#4caf7d', PURPLE = '#9d8fd6';

  /* two-class blobs used by several demos */
  function blobs(seed, n = 40, spread = 0.13) {
    const rnd = U.rand(seed), pts = [];
    for (let i = 0; i < n; i++) {
      const y = i % 2, cx = y ? 0.66 : 0.34, cy = y ? 0.38 : 0.62;
      pts.push({ x: U.clamp(cx + U.gauss(rnd) * spread, 0.03, 0.97), y: U.clamp(cy + U.gauss(rnd) * spread, 0.03, 0.97), c: y });
    }
    return pts;
  }

  /* ======================= linear regression ======================= */
  CV.widget('ml-linreg', { title: 'Linear regression by least squares', desc: 'Click to add points, or drag the line\'s handles to fit it yourself. Compare your MSE with the closed-form solution.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 400px' });
    const W = 420, H = 300;
    const { c, ctx } = U.canvas(W, H);
    c.style.cursor = 'crosshair';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const rnd = U.rand(11);
    let pts = Array.from({ length: 16 }, () => { const x = rnd() * 9 + 0.5; return [x, 1.2 + 0.7 * x + U.gauss(rnd) * 1.1]; });
    let mine = [0, 4], showFit = true, showRes = true, drag = -1;
    U.check(ctl, 'Show least-squares fit', showFit, (v) => { showFit = v; draw(); });
    U.check(ctl, 'Show residuals', showRes, (v) => { showRes = v; draw(); });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'Add outlier', () => { pts.push([9, 0.5]); draw(); });
    U.button(bb, 'Clear points', () => { pts = []; draw(); });
    const out = U.out(ctl);
    const pl = { x0: 0, x1: 10, y0: 0, y1: 10 };
    let P;
    const toData = (p) => [pl.x0 + ((p.x - P.pl) / P.iw) * (pl.x1 - pl.x0), pl.y0 + ((P.pt + P.ih - p.y) / P.ih) * (pl.y1 - pl.y0)];
    const lineY = (l, x) => l[0] + ((l[1] - l[0]) * x) / 10;
    c.addEventListener('pointerdown', (e) => {
      const p = U.mouse(c, e);
      for (const [i, x] of [[0, 0], [1, 10]]) if (Math.hypot(P.X(x) - p.x, P.Y(mine[i]) - p.y) < 14) { drag = i; return; }
      const d = toData(p); if (d[0] >= 0 && d[0] <= 10 && d[1] >= 0 && d[1] <= 10) { pts.push(d); draw(); }
    });
    c.addEventListener('pointermove', (e) => { if (drag < 0) return; mine[drag] = U.clamp(toData(U.mouse(c, e))[1], 0, 10); draw(); });
    addEventListener('pointerup', () => (drag = -1));
    function fit() {
      const n = pts.length; if (n < 2) return null;
      const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
      let sxy = 0, sxx = 0; pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; });
      const w = sxx ? sxy / sxx : 0, b = my - w * mx;
      return { w, b, mx, my };
    }
    const mse = (f) => pts.reduce((s, [x, y]) => s + (y - f(x)) ** 2, 0) / Math.max(1, pts.length);
    function draw() {
      ctx.clearRect(0, 0, W, H);
      P = U.plot(ctx, W, H, { ...pl, xticks: 5, yticks: 5, xlabel: 'x', fmtX: (v) => v.toFixed(0), fmtY: (v) => v.toFixed(0) });
      const F = fit(), fl = F ? (x) => F.b + F.w * x : null, ml = (x) => lineY(mine, x);
      if (showRes && F && showFit) pts.forEach(([x, y]) => { ctx.strokeStyle = 'rgba(224,122,95,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(P.X(x), P.Y(y)); ctx.lineTo(P.X(x), P.Y(fl(x))); ctx.stroke(); });
      if (F && showFit) P.fn(fl, U.css('--text'), 2.5, 2);
      P.fn(ml, BLUE, 2, 2, [6, 5]);
      [[0, mine[0]], [10, mine[1]]].forEach(([x, y]) => { ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(P.X(x), P.Y(y), 7, 0, 7); ctx.fill(); });
      pts.forEach(([x, y]) => { ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(P.X(x), P.Y(y), 4.5, 0, 7); ctx.fill(); });
      const r2 = F ? 1 - mse(fl) / Math.max(1e-9, pts.reduce((s, p) => s + (p[1] - F.my) ** 2, 0) / pts.length) : 0;
      out.innerHTML = `Points: ${pts.length}\n\nYour line (blue, dashed)\n  MSE = <b>${pts.length ? mse(ml).toFixed(3) : '–'}</b>\n` +
        (F ? `\nLeast squares (solid)\n  ŷ = ${F.w.toFixed(3)}·x + ${F.b.toFixed(3)}\n  MSE = <b>${mse(fl).toFixed(3)}</b>   R² = ${r2.toFixed(3)}\n\nw = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²\nb = ȳ − w·x̄` : '\nAdd at least two points.');
    }
    draw();
    body.append(U.el('div', { class: 'w-note', html: 'Least squares minimises the <b>sum of squared</b> vertical distances. Add an outlier and watch it drag the whole line: squared error weights big mistakes heavily. Robust losses (Huber, MAE) are less sensitive.' }));
  });

  /* ======================= k-nearest neighbours ======================= */
  CV.widget('ml-knn', { title: 'k-nearest neighbours decision regions', desc: 'Each pixel takes the majority class of its k nearest training points. Click to add a point of the selected class.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 380px' });
    const W = 360, H = 300, G = 4;
    const { c, ctx } = U.canvas(W, H, { cssW: W });
    c.style.cursor = 'crosshair';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let pts = blobs(5, 40, 0.16), k = 5, cls = 0, metric = 'euclid';
    U.slider(ctl, { label: 'k (neighbours)', min: 1, max: 25, step: 2, value: k, onInput: (v) => { k = v; draw(); } });
    const r1 = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Distance')); ctl.append(r1);
    U.seg(r1, [['euclid', 'Euclidean'], ['manhattan', 'Manhattan']], metric, (v) => { metric = v; draw(); });
    const r2 = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Click adds class')); ctl.append(r2);
    U.seg(r2, [[0, 'Blue'], [1, 'Orange']], cls, (v) => (cls = v));
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'New data', () => { pts = blobs(Math.floor(Math.random() * 1e6), 40, 0.16); draw(); });
    const out = U.out(ctl);
    c.addEventListener('pointerdown', (e) => { const p = U.mouse(c, e); pts.push({ x: p.x / W, y: p.y / H, c: cls }); draw(); });
    const dist = (a, b, x, y) => (metric === 'euclid' ? Math.hypot(a - x, b - y) : Math.abs(a - x) + Math.abs(b - y));
    const predict = (x, y, skip = -1) => {
      const d = pts.map((p, i) => [i === skip ? Infinity : dist(p.x, p.y, x, y), p.c]).sort((a, b) => a[0] - b[0]).slice(0, k);
      return d.filter((v) => v[1] === 1).length > k / 2 ? 1 : 0;
    };
    function draw() {
      for (let y = 0; y < H; y += G) for (let x = 0; x < W; x += G) {
        ctx.fillStyle = predict((x + G / 2) / W, (y + G / 2) / H) ? 'rgba(224,122,95,.28)' : 'rgba(91,156,245,.28)';
        ctx.fillRect(x, y, G, G);
      }
      pts.forEach((p) => { ctx.fillStyle = p.c ? ORANGE : BLUE; ctx.strokeStyle = U.css('--bg'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 5, 0, 7); ctx.fill(); ctx.stroke(); });
      let train = 0, loo = 0;
      pts.forEach((p, i) => { if (predict(p.x, p.y) === p.c) train++; if (predict(p.x, p.y, i) === p.c) loo++; });
      out.innerHTML = `k = <b>${k}</b>\nTraining accuracy: <b>${((train / pts.length) * 100).toFixed(1)}%</b>\nLeave-one-out accuracy: <b>${((loo / pts.length) * 100).toFixed(1)}%</b>\n\n${k === 1 ? 'k = 1 memorises the data: 100% training accuracy, jagged boundary, high variance.' : k > 15 ? 'Large k smooths the boundary: lower variance, more bias.' : 'Moderate k balances noise and detail.'}`;
    }
    draw();
  });

  /* ======================= k-means ======================= */
  CV.widget('ml-kmeans', { title: 'k-means clustering, step by step', desc: 'Alternate two steps: assign each point to its nearest centroid, then move each centroid to the mean of its points. Inertia never increases.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 380px' });
    const W = 380, H = 300;
    const { c, ctx } = U.canvas(W, H, { cssW: W });
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const COL = [BLUE, ORANGE, GREEN, PURPLE, '#d4a73a', '#8a8a8a'];
    let K = 3, pts, cent, assign, phase, iter, seed = 3, init = 'kpp', hist;
    U.slider(ctl, { label: 'Clusters k', min: 1, max: 6, value: K, onInput: (v) => { K = v; reset(); } });
    const r1 = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Initialisation')); ctl.append(r1);
    U.seg(r1, [['random', 'Random'], ['kpp', 'k-means++']], init, (v) => { init = v; reset(); });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'Step', () => { step(); draw(); });
    U.button(bb, 'Run to convergence', () => { for (let i = 0; i < 60; i++) step(); draw(); });
    U.button(bb, '↺ New start', () => { seed++; reset(); });
    U.button(bb, 'New data', () => { seed += 100; makeData(); reset(); });
    const out = U.out(ctl);
    function makeData() {
      const rnd = U.rand(seed * 7 + 1), centers = [[0.25, 0.3], [0.72, 0.28], [0.5, 0.75], [0.2, 0.75]];
      pts = [];
      centers.forEach(([cx, cy], j) => { for (let i = 0; i < 28; i++) pts.push([U.clamp(cx + U.gauss(rnd) * (0.07 + j * 0.01), 0.02, 0.98), U.clamp(cy + U.gauss(rnd) * 0.07, 0.02, 0.98)]); });
    }
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    function reset() {
      const rnd = U.rand(seed * 13 + 5);
      if (init === 'random') cent = Array.from({ length: K }, () => [rnd(), rnd()]);
      else {
        cent = [pts[Math.floor(rnd() * pts.length)].slice()];
        while (cent.length < K) {
          const ds = pts.map((p) => Math.min(...cent.map((q) => d2(p, q)))), tot = ds.reduce((a, b) => a + b);
          let r = rnd() * tot, i = 0; while ((r -= ds[i]) > 0 && i < pts.length - 1) i++;
          cent.push(pts[i].slice());
        }
      }
      assign = null; phase = 'assign'; iter = 0; hist = [];
      draw();
    }
    const inertia = () => (assign ? pts.reduce((s, p, i) => s + d2(p, cent[assign[i]]), 0) : null);
    function step() {
      if (phase === 'assign') {
        const prev = assign && assign.join();
        assign = pts.map((p) => cent.reduce((bi, q, j) => (d2(p, q) < d2(p, cent[bi]) ? j : bi), 0));
        hist.push(inertia());
        phase = prev === assign.join() ? 'done' : 'update';
      } else if (phase === 'update') {
        cent = cent.map((q, j) => { const m = pts.filter((_, i) => assign[i] === j); return m.length ? [m.reduce((s, p) => s + p[0], 0) / m.length, m.reduce((s, p) => s + p[1], 0) / m.length] : q; });
        phase = 'assign'; iter++;
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p, i) => { ctx.fillStyle = assign ? COL[assign[i]] : U.css('--text-3'); ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(p[0] * W, p[1] * H, 4, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      cent.forEach((q, j) => { ctx.fillStyle = COL[j]; ctx.strokeStyle = U.css('--text'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(q[0] * W, q[1] * H - 10); ctx.lineTo(q[0] * W + 9, q[1] * H + 7); ctx.lineTo(q[0] * W - 9, q[1] * H + 7); ctx.closePath(); ctx.fill(); ctx.stroke(); });
      const I = inertia();
      out.innerHTML = `Iteration: <b>${iter}</b>   next: <b>${phase === 'done' ? 'converged ✓' : phase === 'assign' ? 'assign points' : 'move centroids'}</b>\nInertia (within-cluster SSE): <b>${I === null ? '–' : I.toFixed(3)}</b>\n${hist.length ? 'History: ' + hist.slice(-6).map((v) => v.toFixed(2)).join(' → ') : ''}\n\nThe data has 4 true groups. Try k = 4, then try random initialisation with several restarts: k-means can converge to a poor local optimum.`;
    }
    makeData(); reset();
  });

  /* ======================= decision tree split ======================= */
  CV.widget('ml-tree-split', { title: 'How a decision tree picks a split', desc: 'Slide the threshold on feature x. The tree evaluates every threshold and keeps the one with the largest impurity decrease.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 400px' });
    const W = 420, H = 260;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const rnd = U.rand(21);
    const pts = Array.from({ length: 40 }, (_, i) => { const x = rnd(); const p = x < 0.35 ? 0.15 : x < 0.62 ? 0.55 : 0.9; return { x, c: rnd() < p ? 1 : 0, j: rnd() }; });
    let thr = 0.5, crit = 'gini';
    const sl = U.slider(ctl, { label: 'Threshold t (split x ≤ t)', min: 0.02, max: 0.98, step: 0.01, value: thr, fmt: (v) => v.toFixed(2), onInput: (v) => { thr = v; draw(); } });
    const r1 = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Impurity')); ctl.append(r1);
    U.seg(r1, [['gini', 'Gini'], ['entropy', 'Entropy']], crit, (v) => { crit = v; draw(); });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'Find best split', () => { thr = best(); sl.set(thr); draw(); });
    const out = U.out(ctl);
    const imp = (a) => { const n = a.length; if (!n) return 0; const p = a.filter((v) => v.c).length / n; return crit === 'gini' ? 2 * p * (1 - p) : -[p, 1 - p].reduce((s, q) => s + (q > 0 ? q * Math.log2(q) : 0), 0); };
    const gain = (t) => { const L = pts.filter((p) => p.x <= t), R = pts.filter((p) => p.x > t); return imp(pts) - (L.length / pts.length) * imp(L) - (R.length / pts.length) * imp(R); };
    const best = () => { let bt = 0.5, bg = -1; for (let t = 0.02; t <= 0.98; t += 0.005) { const g = gain(t); if (g > bg) { bg = g; bt = t; } } return +bt.toFixed(2); };
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const top = 120;
      const P = U.plot(ctx, W, top + 120, { x0: 0, x1: 1, y0: 0, y1: 0.55, pad: [top, 14, 26, 40], xticks: 5, yticks: 2, fmtX: (v) => v.toFixed(1), fmtY: (v) => v.toFixed(2), xlabel: 'threshold → impurity decrease' });
      P.fn(gain, U.css('--text-3'), 2, 160);
      ctx.fillStyle = U.css('--surface-3'); ctx.fillRect(40, 10, W - 54, top - 30);
      pts.forEach((p) => { ctx.fillStyle = p.c ? ORANGE : BLUE; ctx.beginPath(); ctx.arc(40 + p.x * (W - 54), 18 + p.j * (top - 46), 5, 0, 7); ctx.fill(); });
      const tx = 40 + thr * (W - 54);
      ctx.strokeStyle = U.css('--text'); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(tx, 4); ctx.lineTo(tx, top + 94); ctx.stroke(); ctx.setLineDash([]);
      const L = pts.filter((p) => p.x <= thr), R = pts.filter((p) => p.x > thr), cnt = (a) => `${a.filter((p) => !p.c).length} blue / ${a.filter((p) => p.c).length} orange`;
      out.innerHTML = `Parent impurity: ${imp(pts).toFixed(3)}\nLeft  (x ≤ ${thr.toFixed(2)}): ${cnt(L)}  → ${imp(L).toFixed(3)}\nRight (x > ${thr.toFixed(2)}): ${cnt(R)}  → ${imp(R).toFixed(3)}\n\nWeighted child impurity: ${(imp(pts) - gain(thr)).toFixed(3)}\nImpurity decrease (gain): <b>${gain(thr).toFixed(3)}</b>\n\n${crit === 'gini' ? 'Gini = 1 − Σ pₖ²' : 'Entropy = −Σ pₖ log₂ pₖ'}`;
    }
    draw();
  });

  /* ======================= PCA ======================= */
  CV.widget('ml-pca', { title: 'PCA: the direction of maximum variance', desc: 'Rotate the projection axis. Variance of the projected points (green) is largest along the first principal component, where reconstruction error is smallest.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 380px' });
    const W = 360, H = 300;
    const { c, ctx } = U.canvas(W, H, { cssW: W });
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const rnd = U.rand(9);
    const raw = Array.from({ length: 60 }, () => { const a = U.gauss(rnd) * 1.6, b = U.gauss(rnd) * 0.45; return [a * 0.85 - b * 0.53, a * 0.53 + b * 0.85]; });
    const mx = raw.reduce((s, p) => s + p[0], 0) / raw.length, my = raw.reduce((s, p) => s + p[1], 0) / raw.length;
    const pts = raw.map(([x, y]) => [x - mx, y - my]);
    let sxx = 0, syy = 0, sxy = 0; pts.forEach(([x, y]) => { sxx += x * x; syy += y * y; sxy += x * y; });
    const n = pts.length; sxx /= n; syy /= n; sxy /= n;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2 = tr / 2 - Math.sqrt(tr * tr / 4 - det);
    const pcAng = (Math.atan2(l1 - sxx, sxy) * 180) / Math.PI;
    let ang = 100;
    const sl = U.slider(ctl, { label: 'Axis angle', min: 0, max: 180, value: ang, fmt: (v) => v + '°', onInput: (v) => { ang = v; draw(); } });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'Snap to PC1', () => { ang = Math.round((pcAng + 180) % 180); sl.set(ang); draw(); });
    const out = U.out(ctl);
    const S = 48, ox = W / 2, oy = H / 2;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const a = (ang * Math.PI) / 180, u = [Math.cos(a), Math.sin(a)];
      ctx.strokeStyle = U.css('--border-2'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
      ctx.strokeStyle = U.css('--text'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox - u[0] * 400, oy + u[1] * 400); ctx.lineTo(ox + u[0] * 400, oy - u[1] * 400); ctx.stroke();
      let v = 0, err = 0;
      pts.forEach(([x, y]) => {
        const t = x * u[0] + y * u[1], px = t * u[0], py = t * u[1];
        v += t * t; err += (x - px) ** 2 + (y - py) ** 2;
        ctx.strokeStyle = 'rgba(224,122,95,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ox + x * S, oy - y * S); ctx.lineTo(ox + px * S, oy - py * S); ctx.stroke();
        ctx.fillStyle = GREEN; ctx.beginPath(); ctx.arc(ox + px * S, oy - py * S, 2.5, 0, 7); ctx.fill();
        ctx.fillStyle = BLUE; ctx.beginPath(); ctx.arc(ox + x * S, oy - y * S, 3.5, 0, 7); ctx.fill();
      });
      v /= n; err /= n;
      out.innerHTML = `Projected variance: <b>${v.toFixed(3)}</b>\nReconstruction error: <b>${err.toFixed(3)}</b>\nSum (constant): ${(v + err).toFixed(3)}\n\nEigenvalues of the covariance:\n  λ₁ = ${l1.toFixed(3)}  (PC1 at ${((pcAng + 180) % 180).toFixed(0)}°)\n  λ₂ = ${l2.toFixed(3)}\nPC1 explains <b>${((l1 / (l1 + l2)) * 100).toFixed(1)}%</b> of the variance.`;
    }
    draw();
  });

  /* ======================= threshold, ROC and PR ======================= */
  CV.widget('ml-roc', { title: 'Decision threshold, ROC and AUC', desc: 'A classifier outputs scores. Moving the threshold trades false positives for false negatives. The ROC curve traces every threshold at once.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 440, H = 260;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let sep = 1.6, thr = 0.5, rnd;
    let neg = [], pos = [];
    const gen = () => { rnd = U.rand(4); neg = Array.from({ length: 300 }, () => U.gauss(rnd)); pos = Array.from({ length: 100 }, () => U.gauss(rnd) + sep); };
    const sig = (z) => 1 / (1 + Math.exp(-(z - sep / 2) * 1.6));
    U.slider(ctl, { label: 'Class separation (model quality)', min: 0, max: 4, step: 0.1, value: sep, fmt: (v) => v.toFixed(1), onInput: (v) => { sep = v; gen(); draw(); } });
    U.slider(ctl, { label: 'Threshold', min: 0.01, max: 0.99, step: 0.01, value: thr, fmt: (v) => v.toFixed(2), onInput: (v) => { thr = v; draw(); } });
    const out = U.out(ctl);
    function rates(t) {
      const TP = pos.filter((z) => sig(z) >= t).length, FP = neg.filter((z) => sig(z) >= t).length;
      return { TP, FP, FN: pos.length - TP, TN: neg.length - FP };
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      // score histograms
      const bins = 30, hn = Array(bins).fill(0), hp = Array(bins).fill(0);
      neg.forEach((z) => hn[Math.min(bins - 1, Math.floor(sig(z) * bins))]++); pos.forEach((z) => hp[Math.min(bins - 1, Math.floor(sig(z) * bins))]++);
      const mxh = Math.max(...hn, ...hp), hw = 220, hh = 200, x0 = 10, y0 = 20;
      for (let i = 0; i < bins; i++) {
        ctx.fillStyle = 'rgba(91,156,245,.6)'; ctx.fillRect(x0 + (i * hw) / bins, y0 + hh - (hn[i] / mxh) * hh, hw / bins - 1, (hn[i] / mxh) * hh);
        ctx.fillStyle = 'rgba(224,122,95,.65)'; ctx.fillRect(x0 + (i * hw) / bins, y0 + hh - (hp[i] / mxh) * hh, hw / bins - 1, (hp[i] / mxh) * hh);
      }
      ctx.strokeStyle = U.css('--text'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 + thr * hw, y0 - 6); ctx.lineTo(x0 + thr * hw, y0 + hh + 4); ctx.stroke();
      ctx.fillStyle = U.css('--text-3'); ctx.font = '11px Inter'; ctx.textAlign = 'left'; ctx.fillText('scores: blue = neg, orange = pos', x0, 12); ctx.fillText('0', x0, y0 + hh + 16); ctx.textAlign = 'right'; ctx.fillText('1', x0 + hw, y0 + hh + 16);
      // ROC
      const rx = 260, ry = 20, rs = 170;
      ctx.strokeStyle = U.css('--border-2'); ctx.lineWidth = 1; ctx.strokeRect(rx, ry, rs, rs);
      ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(rx, ry + rs); ctx.lineTo(rx + rs, ry); ctx.stroke(); ctx.setLineDash([]);
      const curve = [];
      for (let t = 1.0001; t >= -0.0001; t -= 0.01) { const r = rates(t); curve.push([r.FP / neg.length, r.TP / pos.length]); }
      let auc = 0; for (let i = 1; i < curve.length; i++) auc += (curve[i][0] - curve[i - 1][0]) * (curve[i][1] + curve[i - 1][1]) / 2;
      ctx.strokeStyle = GREEN; ctx.lineWidth = 2.5; ctx.beginPath(); curve.forEach(([fx, ty], i) => (i ? ctx.lineTo(rx + fx * rs, ry + rs - ty * rs) : ctx.moveTo(rx + fx * rs, ry + rs - ty * rs))); ctx.stroke();
      const r = rates(thr), fpr = r.FP / neg.length, tpr = r.TP / pos.length;
      ctx.fillStyle = U.css('--text'); ctx.beginPath(); ctx.arc(rx + fpr * rs, ry + rs - tpr * rs, 6, 0, 7); ctx.fill();
      ctx.fillStyle = U.css('--text-3'); ctx.textAlign = 'center'; ctx.fillText('FPR', rx + rs / 2, ry + rs + 16); ctx.save(); ctx.translate(rx - 10, ry + rs / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('TPR', 0, 0); ctx.restore();
      ctx.fillText(`ROC · AUC = ${auc.toFixed(3)}`, rx + rs / 2, 12);
      const prec = r.TP / Math.max(1, r.TP + r.FP);
      out.innerHTML = `TP ${r.TP}   FP ${r.FP}\nFN ${r.FN}   TN ${r.TN}\n\nRecall (TPR) = <b>${tpr.toFixed(3)}</b>\nFPR = ${fpr.toFixed(3)}\nPrecision = <b>${prec.toFixed(3)}</b>\nF1 = ${((2 * prec * tpr) / Math.max(1e-9, prec + tpr)).toFixed(3)}\nAUC = <b>${auc.toFixed(3)}</b> (0.5 = random, 1 = perfect)`;
    }
    gen(); draw();
  });
})();
