/* Deep Learning course demos: backprop, initialisation, gradients through time, dropout */
(function () {
  'use strict';
  const U = CV.util;
  const BLUE = '#5b9cf5', ORANGE = '#e07a5f', GREEN = '#4caf7d';

  /* ======================= backprop on a computational graph ======================= */
  CV.widget('dl-backprop', { title: 'Backpropagation on a computational graph', desc: 'One neuron: L = (σ(w·x + b) − y)². Step forward to compute values, then backward to apply the chain rule node by node.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 440px' });
    const W = 520, H = 252;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let x = 1.5, w = 0.8, b = -0.4, y = 1, stepN = 0, lr = 0.5, losses = [];
    const sx = U.slider(ctl, { label: 'input x', min: -3, max: 3, step: 0.1, value: x, fmt: (v) => v.toFixed(1), onInput: (v) => { x = v; stepN = 0; draw(); } });
    const sw = U.slider(ctl, { label: 'weight w', min: -3, max: 3, step: 0.05, value: w, fmt: (v) => v.toFixed(2), onInput: (v) => { w = v; stepN = 0; draw(); } });
    const sb = U.slider(ctl, { label: 'bias b', min: -3, max: 3, step: 0.05, value: b, fmt: (v) => v.toFixed(2), onInput: (v) => { b = v; stepN = 0; draw(); } });
    U.slider(ctl, { label: 'target y', min: 0, max: 1, step: 0.05, value: y, fmt: (v) => v.toFixed(2), onInput: (v) => { y = v; stepN = 0; draw(); } });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'Next step ▸', () => { stepN = (stepN + 1) % 10; draw(); });
    U.button(bb, 'Apply gradient update', () => { const g = calc(); w -= lr * g.dw; b -= lr * g.db; sw.set(w); sb.set(b); losses.push(g.L); stepN = 9; draw(); });
    const out = U.out(ctl);
    function calc() {
      const z = w * x + b, a = 1 / (1 + Math.exp(-z)), L = (a - y) ** 2;
      const dLda = 2 * (a - y), dadz = a * (1 - a), dLdz = dLda * dadz;
      return { z, a, L, dLda, dadz, dLdz, dw: dLdz * x, db: dLdz, dx: dLdz * w, wx: w * x };
    }
    // nodes: [x, y, label]
    const N = { x: [30, 40], w: [30, 120], b: [150, 178], mul: [150, 80], add: [260, 120], sig: [360, 120], sub: [440, 120], L: [490, 120] };
    const E = [['x', 'mul'], ['w', 'mul'], ['mul', 'add'], ['b', 'add'], ['add', 'sig'], ['sig', 'sub'], ['sub', 'L']];
    function draw() {
      const g = calc(), fg = U.css('--text'), mute = U.css('--text-3');
      ctx.clearRect(0, 0, W, H);
      // forward reveals: 1 mul, 2 add, 3 sig, 4 loss; backward: 5 dL/da, 6 dL/dz, 7 dw/db, 8 summary
      const fwd = Math.min(stepN, 4), bwd = Math.max(0, stepN - 4);
      E.forEach(([a, b2]) => { ctx.strokeStyle = U.css('--border-2'); ctx.lineWidth = 2; U.arrow(ctx, N[a][0] + 18, N[a][1], N[b2][0] - 18, N[b2][1], 7); });
      const node = (k, label, val, grad, on, gon) => {
        const [px, py] = N[k];
        ctx.fillStyle = on ? U.css('--surface-3') : U.css('--surface'); ctx.strokeStyle = on ? fg : U.css('--border-2'); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(px, py, 18, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = fg; ctx.font = '600 12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, px, py);
        ctx.font = '11px JetBrains Mono, monospace';
        if (on && val !== null) { ctx.fillStyle = GREEN; ctx.fillText(val, px, py - 28); }
        if (gon && grad !== null) { ctx.fillStyle = ORANGE; ctx.fillText(grad, px, py + 30); }
      };
      node('x', 'x', x.toFixed(2), bwd >= 3 ? '∂=' + g.dx.toFixed(3) : null, true, bwd >= 3);
      node('w', 'w', w.toFixed(2), '∂=' + g.dw.toFixed(3), true, bwd >= 3);
      node('b', 'b', b.toFixed(2), '∂=' + g.db.toFixed(3), true, bwd >= 3);
      node('mul', '×', g.wx.toFixed(3), '∂=' + g.dLdz.toFixed(3), fwd >= 1, bwd >= 3);
      node('add', '+', 'z=' + g.z.toFixed(3), '∂=' + g.dLdz.toFixed(3), fwd >= 2, bwd >= 2);
      node('sig', 'σ', 'a=' + g.a.toFixed(3), '∂=' + g.dLda.toFixed(3), fwd >= 3, bwd >= 1);
      node('sub', '−y', (g.a - y).toFixed(3), null, fwd >= 4, false);
      node('L', 'L', g.L.toFixed(4), '1', fwd >= 4, bwd >= 1);
      ctx.fillStyle = mute; ctx.font = '11px Inter'; ctx.textAlign = 'left';
      ctx.fillText('green = forward value   orange = gradient ∂L/∂(node)', 8, H - 8);
      const msgs = [
        'Press "Next step" to run the forward pass.',
        `Forward: w·x = ${w.toFixed(2)} × ${x.toFixed(2)} = ${g.wx.toFixed(3)}`,
        `Forward: z = w·x + b = ${g.z.toFixed(3)}`,
        `Forward: a = σ(z) = ${g.a.toFixed(3)}`,
        `Forward: L = (a − y)² = ${g.L.toFixed(4)}\nNow the backward pass starts at ∂L/∂L = 1.`,
        `Backward: ∂L/∂a = 2(a − y) = <b>${g.dLda.toFixed(3)}</b>`,
        `Backward through σ: ∂a/∂z = a(1 − a) = ${g.dadz.toFixed(3)}\n∂L/∂z = ∂L/∂a · ∂a/∂z = <b>${g.dLdz.toFixed(3)}</b>`,
        `Backward through + and ×:\n∂L/∂b = ∂L/∂z · 1 = <b>${g.db.toFixed(3)}</b>\n∂L/∂w = ∂L/∂z · x = <b>${g.dw.toFixed(3)}</b>\n∂L/∂x = ∂L/∂z · w = ${g.dx.toFixed(3)}`,
        'Every gradient is a local derivative times the gradient flowing in from above: the chain rule, applied once per edge.',
        `Update with η = ${lr}: w ← w − η·∂L/∂w, b ← b − η·∂L/∂b.\nLoss history: ${losses.slice(-6).map((v) => v.toFixed(4)).join(' → ') || '(apply an update)'}`,
      ];
      out.innerHTML = `Step ${stepN}/9\n\n${msgs[stepN]}`;
    }
    draw();
  });

  /* ======================= weight initialisation ======================= */
  CV.widget('dl-init', { title: 'Why initialisation matters', desc: 'Push random inputs through a deep MLP. Watch the spread of activations in each layer: too small and the signal vanishes, too large and it explodes or saturates.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 440, H = 250;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let act = 'relu', init = 'he', depth = 12, width = 128, scale = 1;
    const r1 = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Activation')); ctl.append(r1);
    U.seg(r1, [['tanh', 'tanh'], ['relu', 'ReLU']], act, (v) => { act = v; draw(); });
    const r2 = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Initialisation')); ctl.append(r2);
    U.seg(r2, [['small', 'N(0, 0.01²)'], ['xavier', 'Xavier'], ['he', 'He'], ['large', 'N(0, 1)']], init, (v) => { init = v; draw(); });
    U.slider(ctl, { label: 'Layers', min: 2, max: 20, value: depth, onInput: (v) => { depth = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      const rnd = U.rand(42), n = width, B = 64;
      let h = Array.from({ length: B }, () => Array.from({ length: n }, () => U.gauss(rnd)));
      const stds = [], dead = [];
      const sd = init === 'small' ? 0.01 : init === 'large' ? 1 : init === 'xavier' ? Math.sqrt(1 / n) : Math.sqrt(2 / n);
      for (let l = 0; l < depth; l++) {
        const Wm = Array.from({ length: n }, () => Array.from({ length: n }, () => U.gauss(rnd) * sd * scale));
        h = h.map((row) => Wm.map((col) => { let s = 0; for (let i = 0; i < n; i++) s += row[i] * col[i]; return act === 'relu' ? Math.max(0, s) : Math.tanh(s); }));
        const flat = h.flat(), m = flat.reduce((a, v) => a + v, 0) / flat.length;
        stds.push(Math.sqrt(flat.reduce((a, v) => a + (v - m) ** 2, 0) / flat.length));
        dead.push(act === 'tanh' ? flat.filter((v) => Math.abs(v) > 0.97).length / flat.length : flat.filter((v) => v === 0).length / flat.length);
      }
      ctx.clearRect(0, 0, W, H);
      const top = Math.max(...stds, 1e-9), useLog = top / Math.max(Math.min(...stds), 1e-12) > 50;
      const P = U.plot(ctx, W, H, { x0: 0.5, x1: depth + 0.5, y0: useLog ? -6 : 0, y1: useLog ? Math.log10(top) + 0.5 : top * 1.15, xticks: Math.min(depth, 10), yticks: 4, xlabel: 'layer', ylabel: useLog ? 'log₁₀ std' : 'activation std', fmtX: (v) => v.toFixed(0), fmtY: (v) => (useLog ? v.toFixed(1) : v.toPrecision(2)) });
      stds.forEach((s, i) => { const v = useLog ? Math.max(-6, Math.log10(Math.max(s, 1e-12))) : s; ctx.fillStyle = i === stds.length - 1 ? ORANGE : BLUE; const bw = Math.max(4, (P.iw / depth) * 0.6); ctx.fillRect(P.X(i + 1) - bw / 2, P.Y(v), bw, P.Y(useLog ? -6 : 0) - P.Y(v)); });
      const last = stds[stds.length - 1];
      out.innerHTML = `Std of activations\n  layer 1: ${stds[0].toPrecision(3)}\n  layer ${depth}: <b>${last.toPrecision(3)}</b>\n${act === 'tanh' ? 'Saturated (|a| > 0.97)' : 'Dead (exactly 0)'} in last layer: ${(dead[dead.length - 1] * 100).toFixed(0)}%\n\n` +
        (last < 1e-3 ? 'Signal vanished: gradients will vanish too.' : last > 1e3 ? 'Signal exploded.' : act === 'tanh' && dead[dead.length - 1] > 0.3 ? 'Saturation: tanh is flat here, gradients die.' : 'Healthy: the scale is preserved through depth.') +
        `\n\nXavier: Var(W) = 1/n_in (tanh, sigmoid)\nHe: Var(W) = 2/n_in (ReLU)`;
    }
    draw();
  });

  /* ======================= gradients through time ======================= */
  CV.widget('dl-rnn-gradient', { title: 'Vanishing and exploding gradients through time', desc: 'In a simple RNN, the gradient from step T back to step t is multiplied by the recurrent factor once per step. An LSTM\'s additive cell path keeps it alive.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 440, H = 250;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let rho = 0.9, steps = 50, forget = 0.98;
    U.slider(ctl, { label: 'RNN recurrent factor |W·σ\'|', min: 0.5, max: 1.3, step: 0.01, value: rho, fmt: (v) => v.toFixed(2), onInput: (v) => { rho = v; draw(); } });
    U.slider(ctl, { label: 'LSTM forget gate f', min: 0.5, max: 1, step: 0.01, value: forget, fmt: (v) => v.toFixed(2), onInput: (v) => { forget = v; draw(); } });
    U.slider(ctl, { label: 'Sequence length', min: 10, max: 100, value: steps, onInput: (v) => { steps = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const P = U.plot(ctx, W, H, { x0: 0, x1: steps, y0: -8, y1: 4, xticks: 5, yticks: 6, xlabel: 'steps back in time', ylabel: 'log₁₀ |gradient|', fmtX: (v) => v.toFixed(0), fmtY: (v) => v.toFixed(0) });
      P.fn((k) => U.clamp(k * Math.log10(rho), -8, 4), ORANGE, 2.5);
      P.fn((k) => U.clamp(k * Math.log10(forget), -8, 4), GREEN, 2.5);
      ctx.strokeStyle = U.css('--border-2'); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(0)); ctx.lineTo(P.X(steps), P.Y(0)); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '12px Inter'; ctx.fillStyle = ORANGE; ctx.textAlign = 'left'; ctx.fillText('vanilla RNN', P.X(1), P.pt + 12); ctx.fillStyle = GREEN; ctx.fillText('LSTM cell path', P.X(1), P.pt + 28);
      const g = rho ** steps, gl = forget ** steps;
      out.innerHTML = `After ${steps} steps\n  RNN gradient scale: <b>${g.toExponential(2)}</b>\n  LSTM cell gradient: <b>${gl.toExponential(2)}</b>\n\n${rho < 0.97 ? 'RNN gradients vanish exponentially: early inputs cannot be learned.' : rho > 1.03 ? 'RNN gradients explode: use gradient clipping.' : 'Near 1 the RNN is on a knife edge.'}\nThe LSTM cell state is updated additively (c = f·c + i·g), so the gradient is scaled by f, which the network learns to keep near 1.`;
    }
    draw();
  });

  /* ======================= dropout ======================= */
  CV.widget('dl-dropout', { title: 'Dropout: training an ensemble of thinned networks', desc: 'Each training step randomly drops units with probability p. Survivors are scaled by 1/(1 − p) so the expected activation is unchanged. At test time nothing is dropped.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 420, H = 240;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let p = 0.5, mode = 'train', seed = 1, auto = true;
    U.slider(ctl, { label: 'Drop probability p', min: 0, max: 0.9, step: 0.05, value: p, fmt: (v) => v.toFixed(2), onInput: (v) => { p = v; } });
    U.seg(ctl, [['train', 'Training'], ['eval', 'Inference']], mode, (v) => { mode = v; });
    U.check(ctl, 'Resample every step', auto, (v) => (auto = v));
    const out = U.out(ctl);
    const layers = [4, 7, 7, 2];
    let acc = 0;
    U.loop(c, (dt) => {
      acc += dt; if (auto && acc > 0.7) { acc = 0; seed++; }
      const rnd = U.rand(seed * 31 + 7), fg = U.css('--text');
      ctx.clearRect(0, 0, W, H);
      const pos = layers.map((n, li) => Array.from({ length: n }, (_, i) => [50 + li * ((W - 100) / (layers.length - 1)), H / 2 + (i - (n - 1) / 2) * 28]));
      const alive = layers.map((n, li) => Array.from({ length: n }, () => li === 0 || li === layers.length - 1 || mode === 'eval' || rnd() >= p));
      for (let li = 0; li < layers.length - 1; li++) pos[li].forEach((a, i) => pos[li + 1].forEach((b, j) => {
        const on = alive[li][i] && alive[li + 1][j];
        ctx.strokeStyle = on ? fg : U.css('--border'); ctx.globalAlpha = on ? 0.35 : 0.35; ctx.lineWidth = on ? 1.2 : 0.6;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }));
      ctx.globalAlpha = 1;
      pos.forEach((L, li) => L.forEach(([x, y], i) => {
        ctx.beginPath(); ctx.arc(x, y, 9, 0, 7);
        if (alive[li][i]) { ctx.fillStyle = li === 0 ? BLUE : li === layers.length - 1 ? ORANGE : fg; ctx.fill(); }
        else { ctx.strokeStyle = U.css('--text-3'); ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke(); }
      }));
      const kept = alive.slice(1, -1).flat().filter(Boolean).length, tot = alive.slice(1, -1).flat().length;
      out.innerHTML = `${mode === 'train' ? 'Training step' : 'Inference'}: ${kept}/${tot} hidden units active\nScale on survivors: ${mode === 'train' ? '1/(1 − p) = <b>' + (1 / (1 - p)).toFixed(2) + '</b>' : 'none (inverted dropout)'}\n\nUnits cannot rely on specific partners, so they learn robust, redundant features. Typical p: 0.1–0.5.`;
    });
  });
})();
