/* Widgets for Chapters 7–9: CNNs, architectures, training */
(function () {
  'use strict';
  const U = CV.util;

  /* ---------------- conv output size & params ---------------- */
  CV.widget('conv-calc', { title: 'Convolution layer calculator', desc: 'Set kernel, padding, stride and dilation. The animation shows which input cells feed each output cell.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const P = { I: 7, K: 3, P: 1, S: 2, D: 1, cin: 64, cout: 128 };
    const s = (k, l, min, max) => U.slider(ctl, { label: l, min, max, value: P[k], onInput: (v) => { P[k] = v; pos = 0; } });
    s('I', 'Input size I', 4, 10); s('K', 'Kernel K', 1, 5); s('P', 'Padding P', 0, 3); s('S', 'Stride S', 1, 3); s('D', 'Dilation D', 1, 3);
    s('cin', 'C_in', 1, 512); s('cout', 'C_out', 1, 512);
    const out = U.out(ctl);
    let pos = 0, acc = 0;
    U.loop(c, (dt) => {
      const { I, K, S, D } = P, Pd = P.P;
      const O = Math.floor((I + 2 * Pd - D * (K - 1) - 1) / S) + 1;
      acc += dt; if (acc > 0.7) { acc = 0; pos = O > 0 ? (pos + 1) % (O * O) : 0; }
      ctx.clearRect(0, 0, W, H);
      const N = I + 2 * Pd, cs = Math.min(26, 250 / N), x0 = 16, y0 = (H - N * cs) / 2;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const pad = i < Pd || j < Pd || i >= N - Pd || j >= N - Pd;
        ctx.fillStyle = pad ? 'rgba(140,140,140,.12)' : U.css('--surface-3');
        ctx.fillRect(x0 + i * cs + 1, y0 + j * cs + 1, cs - 2, cs - 2);
        if (pad) { ctx.fillStyle = U.css('--text-3'); ctx.font = `${cs * 0.4}px JetBrains Mono`; ctx.textAlign = 'center'; ctx.fillText('0', x0 + i * cs + cs / 2, y0 + j * cs + cs * 0.65); }
      }
      if (O > 0) {
        const ox = pos % O, oy = Math.floor(pos / O);
        for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) {
          const ix = ox * S + b * D, iy = oy * S + a * D;
          ctx.fillStyle = 'rgba(91,156,245,.55)'; ctx.fillRect(x0 + ix * cs + 1, y0 + iy * cs + 1, cs - 2, cs - 2);
        }
        const span = D * (K - 1) + 1;
        ctx.strokeStyle = U.css('--accent'); ctx.lineWidth = 2; ctx.strokeRect(x0 + ox * S * cs, y0 + oy * S * cs, span * cs, span * cs);
        const oc = Math.min(26, 150 / O), ox0 = W - O * oc - 20, oy0 = (H - O * oc) / 2;
        for (let j = 0; j < O; j++) for (let i = 0; i < O; i++) {
          const k = j * O + i;
          ctx.fillStyle = k === pos ? U.css('--accent-3') : k < pos ? 'rgba(157,143,214,.5)' : U.css('--surface-3');
          ctx.fillRect(ox0 + i * oc + 1, oy0 + j * oc + 1, oc - 2, oc - 2);
        }
        ctx.strokeStyle = U.css('--accent-3'); ctx.globalAlpha = 0.4; ctx.beginPath();
        ctx.moveTo(x0 + (ox * S + span / 2) * cs, y0 + (oy * S + span / 2) * cs); ctx.lineTo(ox0 + (ox + 0.5) * oc, oy0 + (oy + 0.5) * oc); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = U.css('--text-2'); ctx.font = '600 12px Inter'; ctx.textAlign = 'left';
        ctx.fillText(`input ${I}×${I} (+pad)`, x0, y0 - 8); ctx.fillText(`output ${O}×${O}`, ox0, oy0 - 8);
      }
      const params = (K * K * P.cin + 1) * P.cout;
      out.innerHTML = `O = ⌊(I + 2P − D(K−1) − 1) / S⌋ + 1\n  = ⌊(${I} + ${2 * Pd} − ${D * (K - 1)} − 1) / ${S}⌋ + 1 = <b>${O}</b>\n\nparams = (K·K·C_in + 1)·C_out\n       = (${K}·${K}·${P.cin} + 1)·${P.cout} = <b>${U.fmtInt(params)}</b>\n(independent of image size)\nreceptive span of one tap set: ${D * (K - 1) + 1}×${D * (K - 1) + 1}`;
    });
  });

  /* ---------------- receptive field growth ---------------- */
  CV.widget('receptive-field', { title: 'How the receptive field grows', desc: 'Hover a unit in the top layer to light up every input pixel that can influence it.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 480, H = 280;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let L = 3, K = 3, S = 1, hov = null;
    U.slider(ctl, { label: 'Number of layers', min: 1, max: 5, value: L, onInput: (v) => { L = v; draw(); } });
    U.slider(ctl, { label: 'Kernel size', min: 2, max: 5, value: K, onInput: (v) => { K = v; draw(); } });
    U.slider(ctl, { label: 'Stride (every layer)', min: 1, max: 2, value: S, onInput: (v) => { S = v; draw(); } });
    const out = U.out(ctl);
    const N0 = 24;
    function sizes() { const s = [N0]; for (let l = 0; l < L; l++) s.push(Math.max(1, Math.floor((s[l] - K) / S) + 1)); return s; }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const sz = sizes(), rowH = (H - 30) / L, cw = (W - 20) / N0;
      const pos = (l, i) => { const off = l === 0 ? 0 : (() => { let o = 0, st = 1; for (let k = 0; k < l; k++) { o += ((K - 1) / 2) * st; st *= S; } return o; })(); let st = 1; for (let k = 0; k < l; k++) st *= S; return [10 + (off + i * st + 0.5) * cw, H - 14 - l * rowH]; };
      const lit = sz.map((n) => new Uint8Array(n));
      if (hov) { lit[hov[0]][hov[1]] = 1; for (let l = hov[0]; l > 0; l--) for (let i = 0; i < sz[l]; i++) if (lit[l][i]) for (let k = 0; k < K; k++) lit[l - 1][i * S + k] = 1; }
      for (let l = 1; l <= L; l++) for (let i = 0; i < sz[l]; i++) {
        const [x, y] = pos(l, i);
        for (let k = 0; k < K; k++) { const [x2, y2] = pos(l - 1, i * S + k); ctx.strokeStyle = lit[l][i] && lit[l - 1][i * S + k] ? U.css('--accent') : 'rgba(140,140,140,.12)'; ctx.lineWidth = lit[l][i] ? 1.6 : 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }
      }
      sz.forEach((n, l) => { for (let i = 0; i < n; i++) { const [x, y] = pos(l, i); ctx.fillStyle = lit[l][i] ? (l === 0 ? U.css('--accent-3') : U.css('--accent')) : U.css('--surface-3'); ctx.beginPath(); ctx.arc(x, y, Math.min(7, cw * 0.38), 0, 7); ctx.fill(); } });
      let rf = 1, j = 1; for (let l = 0; l < L; l++) { rf += (K - 1) * j; j *= S; }
      out.innerHTML = `receptive field after ${L} layer(s): <b>${rf} px</b>\nr = 1 + Σ (K−1)·(product of earlier strides)\n\nThree stacked 3×3 convs see 7×7 with\n27 weights vs 49 for one 7×7, plus two\nextra non-linearities (the VGG insight).`;
      c.onpointermove = (e) => { const p = U.mouse(c, e); let best = null, bd = 1e9; for (let l = 1; l <= L; l++) for (let i = 0; i < sz[l]; i++) { const [x, y] = pos(l, i); const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = [l, i]; } } hov = bd < 30 ? best : hov; draw(); };
    }
    hov = [L, 0];
    draw();
  });

  /* ---------------- pooling ---------------- */
  CV.widget('pooling', { title: 'Max vs average pooling', desc: '2×2 windows, stride 2. Click Shuffle for new activations.' }, (body) => {
    let mode = 'max', seed = 1;
    const top = U.el('div', { class: 'w-row', style: 'align-items:center;margin-bottom:14px' }); body.append(top);
    U.seg(top, [['max', 'Max pool'], ['avg', 'Average pool']], mode, (v) => { mode = v; draw(); });
    U.button(top, '🎲 Shuffle', () => { seed++; draw(); });
    const row = U.el('div', { class: 'w-row', style: 'justify-content:center;align-items:center;gap:30px' }); body.append(row);
    const gi = U.el('div', { class: 'mgrid', style: 'grid-template-columns:repeat(4,42px)' }), go = U.el('div', { class: 'mgrid', style: 'grid-template-columns:repeat(2,52px)' });
    row.append(gi, U.el('div', { style: 'font-size:28px;color:var(--text-3)' }, '→'), go);
    const cols = ['rgba(91,156,245,.4)', 'rgba(157,143,214,.4)', 'rgba(224,122,95,.4)', 'rgba(212,167,58,.4)'];
    function draw() {
      const r = U.rand(seed * 9), v = Array.from({ length: 16 }, () => Math.floor(r() * 10));
      gi.innerHTML = ''; go.innerHTML = '';
      v.forEach((x, i) => { const bx = Math.floor((i % 4) / 2), by = Math.floor(Math.floor(i / 4) / 2), q = by * 2 + bx; gi.append(U.el('div', { style: `width:42px;height:42px;background:${cols[q]}` }, String(x))); });
      for (let q = 0; q < 4; q++) {
        const bx = q % 2, by = Math.floor(q / 2), w = [0, 1, 4, 5].map((o) => v[by * 8 + bx * 2 + o]);
        const res = mode === 'max' ? Math.max(...w) : w.reduce((a, b) => a + b) / 4;
        const d = U.el('div', { style: `width:52px;height:52px;font-size:15px;font-weight:700;background:${cols[q].replace('.4', '.8')};color:#000;animation:pop .5s var(--spring)` }, String(+res.toFixed(2)));
        go.append(d);
        if (mode === 'max') { const idx = [0, 1, 4, 5][w.indexOf(res)]; gi.children[by * 8 + bx * 2 + idx].classList.add('hl'); }
      }
    }
    draw();
    body.append(U.el('div', { class: 'w-note', html: 'Pooling downsamples, reduces compute and adds small-shift invariance. <strong>Global average pooling</strong> averages a whole feature map to one number and replaced the huge FC layers of early nets.' }));
  });

  /* ---------------- depthwise separable cost ---------------- */
  CV.widget('dw-cost', { title: 'Standard vs depthwise-separable convolution', desc: 'Multiply-adds per output location. The ratio is 1/C_out + 1/K².' }, (body) => {
    const { stage, ctl } = U.split(body);
    let K = 3, cin = 128, cout = 128;
    U.slider(ctl, { label: 'Kernel K', min: 1, max: 7, step: 2, value: K, onInput: (v) => { K = v; draw(); } });
    U.slider(ctl, { label: 'C_in', min: 8, max: 512, step: 8, value: cin, onInput: (v) => { cin = v; draw(); } });
    U.slider(ctl, { label: 'C_out', min: 8, max: 512, step: 8, value: cout, onInput: (v) => { cout = v; draw(); } });
    const bars = U.el('div', { class: 'bars' }); stage.append(bars);
    const out = U.out(stage); out.style.marginTop = '14px';
    function draw() {
      const std = K * K * cin * cout, dw = K * K * cin, pw = cin * cout, sep = dw + pw, mx = std;
      const row = (n, v, col) => `<div class="bar-row" style="grid-template-columns:150px 1fr 90px"><span>${n}</span><div class="track"><div class="fill" style="width:${Math.max(0.5, (v / mx) * 100)}%;${col ? 'background:' + col : ''}"></div></div><span class="v">${U.fmt(v, 1)}</span></div>`;
      bars.innerHTML = row('Standard K²·Cin·Cout', std) + row('Depthwise K²·Cin', dw, 'var(--accent-3)') + row('Pointwise Cin·Cout', pw, 'var(--warn)') + row('Separable (sum)', sep, 'linear-gradient(90deg,var(--ok),var(--accent))');
      out.innerHTML = `ratio = sep / std = 1/${cout} + 1/${K * K} = <b>${(sep / std).toFixed(3)}</b>\n→ about <b>${(std / sep).toFixed(1)}× cheaper</b>\n\nNote: fewer FLOPs ≠ always faster. Depthwise layers are\nmemory-bound on GPUs. Measure latency on target hardware.`;
    }
    draw();
  });

  /* ---------------- feature maps (hand-made filter bank) ---------------- */
  CV.widget('feature-maps', { title: 'What a first conv layer sees', desc: 'A bank of 8 oriented filters → ReLU → 2×2 max pool. Learned first-layer filters look very much like these.' }, (body) => {
    const W = 160, H = 110;
    const grid = U.el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px' });
    body.append(grid);
    let relu = true;
    const top = U.el('div', { class: 'w-row', style: 'margin-bottom:10px' }); body.prepend(top);
    U.check(top, 'Apply ReLU (keep positive responses)', relu, (v) => { relu = v; draw(); });
    const bank = [];
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 6, ker = [];
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const u = x * Math.cos(a) + y * Math.sin(a), v = -x * Math.sin(a) + y * Math.cos(a); ker.push(Math.exp(-(u * u + v * v) / 3) * Math.sin(1.4 * u)); }
      bank.push([`edge ${Math.round((k * 180) / 6)}°`, ker]);
    }
    bank.push(['blob (LoG)', [0, 0, -1, 0, 0, 0, -1, -2, -1, 0, -1, -2, 16, -2, -1, 0, -1, -2, -1, 0, 0, 0, -1, 0, 0].map((v) => v / 8)]);
    bank.push(['red–green', null]);
    function draw() {
      grid.innerHTML = '';
      const src = U.scene(W, H), g = U.getGray(src), rgb = U.getRGB(src).data;
      const inCell = U.el('div', {}, U.el('div', { class: 'canvas-label' }, 'input'));
      const ic = U.pixCanvas(W, H, 200, false); ic.ctx.drawImage(src, 0, 0); inCell.append(ic.c); grid.append(inCell);
      bank.forEach(([name, ker], idx) => {
        let r;
        if (ker) r = U.convolve(g, ker, 5);
        else { const d = new Float32Array(W * H); for (let i = 0; i < W * H; i++) d[i] = rgb[i * 4] - rgb[i * 4 + 1]; r = { w: W, h: H, data: d }; }
        if (relu) r.data = r.data.map((v) => Math.max(0, v));
        const pw = W >> 1, ph = H >> 1, pd = new Float32Array(pw * ph);
        for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) pd[y * pw + x] = Math.max(r.data[2 * y * W + 2 * x], r.data[2 * y * W + 2 * x + 1], r.data[(2 * y + 1) * W + 2 * x], r.data[(2 * y + 1) * W + 2 * x + 1]);
        const pc = U.pixCanvas(pw, ph, 200, false);
        U.putGray(pc.ctx, { w: pw, h: ph, data: pd }, { mode: relu ? 'norm' : 'norm', map: U.viridis });
        const cell = U.el('div', { style: `animation:pageIn .5s ${idx * 0.06}s both` }, U.el('div', { class: 'canvas-label' }, name), pc.c);
        grid.append(cell);
      });
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- CNN shape flow ---------------- */
  CV.widget('cnn-shapes', { title: 'Spatial size shrinks, channels grow', desc: 'A ResNet-style backbone: 224 → 112 → 56 → 28 → 14 → 7 while channels go 3 → 64 → … → 512, then global pooling and a classifier.' }, (body) => {
    const W = 760, H = 260;
    const { c, ctx } = U.canvas(W, H, { cssW: 760 });
    body.append(U.el('div', { class: 'canvas-box' }, c));
    const stages = [[224, 3, 'input'], [112, 64, 'conv1'], [56, 64, 'stage1'], [28, 128, 'stage2'], [14, 256, 'stage3'], [7, 512, 'stage4'], [1, 512, 'GAP'], [1, 1000, 'FC']];
    let t = 0;
    U.loop(c, (dt) => {
      t += dt;
      ctx.clearRect(0, 0, W, H);
      let x = 20;
      const act = Math.floor(t * 1.2) % stages.length;
      stages.forEach(([s, ch, name], i) => {
        const h = Math.max(10, Math.sqrt(s / 224) * 170), d = Math.max(6, Math.log2(ch + 1) * 8), w = name === 'FC' ? 10 : Math.max(10, d);
        const y = H / 2 - h / 2 - 10;
        const col = i === act ? U.css('--accent-3') : i % 2 ? U.css('--accent-2') : U.css('--accent');
        ctx.globalAlpha = i === act ? 1 : 0.75;
        // 3D box
        const dx = h * 0.3 * (name === 'FC' || name === 'GAP' ? 0.2 : 1), dy = -dx * 0.6;
        ctx.fillStyle = col; ctx.globalAlpha *= 0.35; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.lineTo(x + dx + w, y + dy); ctx.lineTo(x + w, y); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + dx, y + dy); ctx.lineTo(x + w + dx, y + dy + h); ctx.lineTo(x + w, y + h); ctx.fill();
        ctx.globalAlpha = i === act ? 0.95 : 0.6; ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 1; ctx.fillStyle = U.css('--text-2'); ctx.font = '600 11px Inter'; ctx.textAlign = 'center';
        ctx.fillText(name, x + w / 2, H - 34);
        ctx.font = '10.5px JetBrains Mono'; ctx.fillStyle = i === act ? U.css('--accent-3') : U.css('--text-3');
        ctx.fillText(name === 'FC' ? '1000' : `${ch}×${s}×${s}`, x + w / 2, H - 18);
        if (i < stages.length - 1) { ctx.strokeStyle = ctx.fillStyle = U.css('--text-3'); ctx.lineWidth = 1.2; U.arrow(ctx, x + w + dx + 6, H / 2 - 10, x + w + dx + 24, H / 2 - 10, 5); }
        x += w + dx + 30;
      });
      ctx.fillStyle = U.css('--text-3'); ctx.font = '12px Inter'; ctx.textAlign = 'left';
      ctx.fillText('early layers: edges, colour blobs → middle: textures, parts → deep: objects, scenes', 20, 20);
    });
  });

  /* ---------------- architecture explorer ---------------- */
  const MODELS = [
    { n: 'LeNet-5', y: 1998, p: 0.06, top1: null, idea: 'conv + pool + FC template', layers: [['Input', 'grayscale image', '1×32×32'], ['C1', '6 filters 5×5', '6×28×28'], ['S2', 'avg pool 2×2', '6×14×14'], ['C3', '16 filters 5×5', '16×10×10'], ['S4', 'avg pool 2×2', '16×5×5'], ['C5', '120 units (5×5 conv = FC)', '120'], ['F6', 'fully connected', '84'], ['Output', '10 classes', '10']] },
    { n: 'AlexNet', y: 2012, p: 60, top1: 56.5, idea: 'ReLU, dropout, GPUs, augmentation', layers: [['conv1', '96 × 11×11, stride 4', '96×55×55'], ['pool', '3×3 max, s2 (overlapping)', '96×27×27'], ['conv2', '256 × 5×5', '256×27×27'], ['pool', '3×3 max, s2', '256×13×13'], ['conv3–5', '384, 384, 256 × 3×3', '256×13×13'], ['pool', '3×3 max, s2', '256×6×6'], ['FC', '4096 → 4096 (dropout 0.5)', '4096'], ['FC', '1000 classes', '1000']] },
    { n: 'VGG-16', y: 2014, p: 138, top1: 71.6, idea: 'only 3×3 convs, depth', layers: [['block1', '2× conv3 64 + pool', '64×112×112'], ['block2', '2× conv3 128 + pool', '128×56×56'], ['block3', '3× conv3 256 + pool', '256×28×28'], ['block4', '3× conv3 512 + pool', '512×14×14'], ['block5', '3× conv3 512 + pool', '512×7×7'], ['FC6', '7·7·512 → 4096 (≈103 M params!)', '4096'], ['FC7', '4096', '4096'], ['FC8', '1000', '1000']] },
    { n: 'GoogLeNet', y: 2014, p: 7, top1: 69, idea: 'inception module, 1×1 bottleneck, GAP', layers: [['stem', 'conv 7×7 s2, pool, conv 3×3, pool', '192×28×28'], ['3a–3b', 'inception modules', '480×28×28'], ['pool', 'max pool', '480×14×14'], ['4a–4e', 'inception (+ aux classifiers)', '832×14×14'], ['pool', 'max pool', '832×7×7'], ['5a–5b', 'inception', '1024×7×7'], ['GAP', 'global average pool', '1024'], ['FC', '1000 + dropout', '1000']] },
    { n: 'ResNet-50', y: 2015, p: 25.6, top1: 76.1, idea: 'residual connections', layers: [['conv1', '7×7, 64, stride 2, BN, ReLU', '64×112×112'], ['pool', '3×3 max pool, stride 2', '64×56×56'], ['conv2_x', '3 bottlenecks (1×1,64 / 3×3,64 / 1×1,256)', '256×56×56'], ['conv3_x', '4 bottlenecks (128/128/512), first stride 2', '512×28×28'], ['conv4_x', '6 bottlenecks (256/256/1024), first stride 2', '1024×14×14'], ['conv5_x', '3 bottlenecks (512/512/2048), first stride 2', '2048×7×7'], ['head', 'global average pool, FC 1000', '1000']] },
    { n: 'DenseNet-121', y: 2017, p: 8, top1: 74.4, idea: 'dense concatenation', layers: [['stem', 'conv 7×7 s2 + pool', '64×56×56'], ['dense 1', '6 layers, growth k=32', '256×56×56'], ['transition', '1×1 conv + avg pool', '128×28×28'], ['dense 2', '12 layers', '512×28×28'], ['transition', '1×1 + pool', '256×14×14'], ['dense 3', '24 layers', '1024×14×14'], ['dense 4', '16 layers (after transition)', '1024×7×7'], ['head', 'GAP + FC', '1000']] },
    { n: 'MobileNetV2', y: 2018, p: 3.4, top1: 72, idea: 'inverted residual, linear bottleneck', layers: [['stem', 'conv 3×3 s2, 32', '32×112×112'], ['bneck', 'expand 1×1 (×6) → dw 3×3 → project 1×1 (linear)', '…'], ['stages', '17 inverted residual blocks', '320×7×7'], ['conv', '1×1, 1280', '1280×7×7'], ['head', 'GAP + FC', '1000']] },
    { n: 'EfficientNet-B0', y: 2019, p: 5.3, top1: 77.1, idea: 'compound scaling, NAS', layers: [['stem', 'conv 3×3 s2', '32×112×112'], ['MBConv1', 'k3, SE', '16×112×112'], ['MBConv6 ×2', 'k3', '24×56×56'], ['MBConv6 ×2', 'k5', '40×28×28'], ['MBConv6 ×3', 'k3', '80×14×14'], ['MBConv6 ×3', 'k5', '112×14×14'], ['MBConv6 ×4', 'k5', '192×7×7'], ['MBConv6 + head', 'k3, conv 1×1 1280, GAP, FC', '1000']] },
    { n: 'EfficientNet-B7', y: 2019, p: 66, top1: 84.3, idea: 'same, scaled up (600 px input)', layers: [['scaled B0', 'depth ×3.1, width ×2.0, resolution 600', '…']] },
    { n: 'ConvNeXt-T', y: 2022, p: 28, top1: 82.1, idea: 'modernised ResNet: 7×7 depthwise, LayerNorm, GELU', layers: [['stem', '4×4 conv, stride 4 (patchify) + LN', '96×56×56'], ['stage 1', '3 blocks: dw 7×7 → LN → 1×1 (4×) → GELU → 1×1', '96×56×56'], ['down', 'LN + 2×2 conv s2', '192×28×28'], ['stage 2', '3 blocks', '192×28×28'], ['stage 3', '9 blocks', '384×14×14'], ['stage 4', '3 blocks', '768×7×7'], ['head', 'GAP + LN + FC', '1000']] },
    { n: 'ViT-B/16', y: 2020, p: 86, top1: 77.9, idea: 'transformer on patches (IN-1k only)', layers: [['patchify', '16×16 patches → linear 768', '196×768'], ['tokens', '+ [CLS] + position embeddings', '197×768'], ['encoder', '12 blocks: MHA (12 heads) + MLP 3072', '197×768'], ['head', 'LN on [CLS] → FC', '1000']] },
  ];
  CV.MODELS = MODELS;

  CV.widget('arch-explorer', { title: 'Architecture explorer', desc: 'Bubble size = parameters. Click a model to see its layers. Up and to the left is better.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 440px' });
    const W = 480, H = 320;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const table = U.el('div'); ctl.append(table);
    let sel = 4, hov = -1, t0 = performance.now();
    const ms = MODELS.filter((m) => m.top1);
    const pal = U.palette();
    let pl;
    function chart() {
      ctx.clearRect(0, 0, W, H);
      pl = U.plot(ctx, W, H, { x0: 0.5, x1: 3, y0: 54, y1: 88, xticks: 5, yticks: 4, xlabel: 'parameters (log₁₀ M)', ylabel: 'ImageNet top-1 %', fmtX: (v) => (10 ** v).toFixed(v < 1 ? 1 : 0) + 'M', fmtY: (v) => v.toFixed(0) });
      const e = Math.min(1, (performance.now() - t0) / 900);
      ms.forEach((m, i) => {
        const x = pl.X(Math.log10(m.p)), y = pl.Y(m.top1), r = (5 + Math.sqrt(m.p) * 1.6) * (1 - Math.pow(1 - e, 3));
        const isSel = MODELS.indexOf(m) === sel;
        ctx.fillStyle = pal[i % pal.length]; ctx.globalAlpha = isSel || hov === i ? 0.95 : 0.55;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
        if (isSel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke(); }
        ctx.fillStyle = U.css('--text'); ctx.font = `${isSel ? 700 : 500} 11px Inter`; ctx.textAlign = 'center';
        ctx.fillText(m.n, x, y - r - 5);
      });
    }
    function info() {
      const m = MODELS[sel];
      table.innerHTML = `<div class="w-out"><b>${m.n}</b> (${m.y}) · ${m.p} M params${m.top1 ? ` · top-1 ≈ ${m.top1}%` : ''}\n<span style="color:var(--text-2)">${m.idea}</span></div>
        <div class="tbl-wrap" style="margin:10px 0 0"><table><thead><tr><th>Layer</th><th>Operation</th><th>Output</th></tr></thead><tbody>${m.layers.map((l, i) => `<tr style="animation:pageIn .4s ${i * 0.05}s both"><td>${l[0]}</td><td>${l[1]}</td><td style="font-family:var(--mono);font-size:12px">${l[2]}</td></tr>`).join('')}</tbody></table></div>`;
    }
    const pick = U.el('select'); MODELS.forEach((m, i) => pick.append(U.el('option', { value: i }, m.n))); pick.value = sel;
    pick.onchange = () => { sel = +pick.value; info(); };
    ctl.prepend(pick);
    c.addEventListener('pointermove', (e) => { const p = U.mouse(c, e); hov = ms.findIndex((m) => Math.hypot(pl.X(Math.log10(m.p)) - p.x, pl.Y(m.top1) - p.y) < 5 + Math.sqrt(m.p) * 1.6); c.style.cursor = hov >= 0 ? 'pointer' : 'default'; });
    c.addEventListener('click', () => { if (hov >= 0) { sel = MODELS.indexOf(ms[hov]); pick.value = sel; info(); } });
    info();
    U.loop(c, chart);
  });

  /* ---------------- residual gradient flow ---------------- */
  CV.widget('residual-flow', { title: 'Why residual connections let networks go deep', desc: 'Gradient magnitude reaching each layer during backprop. Plain nets multiply many factors below 1; skips add an identity path.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 260;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let depth = 30, gain = 0.8, t = 0;
    U.slider(ctl, { label: 'Depth (layers)', min: 4, max: 60, value: depth, onInput: (v) => (depth = v) });
    U.slider(ctl, { label: 'Per-layer gradient factor', min: 0.5, max: 1.2, step: 0.01, value: gain, onInput: (v) => (gain = v) });
    const out = U.out(ctl);
    U.loop(c, (dt) => {
      t += dt;
      ctx.clearRect(0, 0, W, H);
      const bw = (W - 40) / depth;
      const plain = [], res = [];
      for (let l = 0; l < depth; l++) { const k = depth - 1 - l; plain.push(Math.pow(gain, k)); res.push(Math.pow(1 + (gain - 1) * 0.15, k)); }
      const sweep = (t * 0.5) % 1.4;
      const draw = (arr, y0, col, label) => {
        ctx.fillStyle = U.css('--text-2'); ctx.font = '600 12px Inter'; ctx.textAlign = 'left'; ctx.fillText(label, 20, y0 - 92);
        arr.forEach((v, l) => {
          const h = Math.min(1, Math.log10(v * 100 + 1) / 2.1) * 80;
          const lit = (depth - 1 - l) / depth < sweep;
          ctx.fillStyle = col; ctx.globalAlpha = lit ? 0.95 : 0.25;
          ctx.fillRect(20 + l * bw + 1, y0 - h, bw - 2, h);
        });
        ctx.globalAlpha = 1;
      };
      draw(plain, 118, U.css('--bad'), 'Plain network: gradient at layer l ∝ factor^(depth−l)');
      draw(res, 240, U.css('--ok'), 'Residual: y = F(x) + x → ∂y/∂x = ∂F/∂x + 1');
      ctx.fillStyle = U.css('--text-3'); ctx.font = '11px Inter'; ctx.textAlign = 'right'; ctx.fillText('← input layers        output →', W - 20, H - 4);
      out.innerHTML = `gradient reaching layer 1:\n<span style="color:var(--bad)">plain    ${plain[0].toExponential(2)}</span>\n<span style="color:var(--ok)">residual ${res[0].toExponential(2)}</span>\n\nA block with nothing to add can learn\nF(x) ≈ 0, so extra depth rarely hurts.`;
    });
  });

  /* ---------------- block diagrams ---------------- */
  const BLOCKS = {
    basic: { title: 'ResNet basic block', nodes: ['x', '3×3 conv, BN, ReLU', '3×3 conv, BN', '⊕ add', 'ReLU'], skip: [0, 3] },
    bottleneck: { title: 'ResNet bottleneck', nodes: ['x (256-d)', '1×1, 64 (reduce)', '3×3, 64', '1×1, 256 (expand)', '⊕ add', 'ReLU'], skip: [0, 4] },
    mbconv: { title: 'MobileNetV2 inverted residual / MBConv', nodes: ['x (narrow)', '1×1 expand ×6, ReLU6', '3×3 depthwise, ReLU6', '(SE: squeeze-excite)', '1×1 project, linear', '⊕ add'], skip: [0, 5] },
    convnext: { title: 'ConvNeXt block', nodes: ['x', '7×7 depthwise', 'LayerNorm', '1×1, 4× wider', 'GELU', '1×1 back', '⊕ add'], skip: [0, 6] },
    se: { title: 'Squeeze-and-Excitation', nodes: ['feature map C×H×W', 'global avg pool → C', 'FC C/16, ReLU', 'FC C, sigmoid', '⊗ rescale channels'], skip: [0, 4] },
  };
  CV.widget('block-diagram', { title: 'Building blocks, animated', desc: 'Data flows top to bottom; the skip path carries the input around the block.', tag: 'Diagram' }, (body, opts) => {
    let kind = opts.kind || 'bottleneck';
    const top = U.el('div', { style: 'margin-bottom:12px' }); body.append(top);
    U.seg(top, (opts.kinds || Object.keys(BLOCKS)).map((k) => [k, BLOCKS[k].title]), kind, (v) => { kind = v; });
    const W = 520, H = 360;
    const { c, ctx } = U.canvas(W, H);
    body.append(U.el('div', { class: 'canvas-box', style: 'display:flex;justify-content:center' }, c));
    let t = 0;
    U.loop(c, (dt) => {
      t += dt;
      const B = BLOCKS[kind], n = B.nodes.length, gap = (H - 40) / (n - 1), cx = W / 2 - 30;
      ctx.clearRect(0, 0, W, H);
      const ys = B.nodes.map((_, i) => 20 + i * gap);
      // skip path
      const [a, b] = B.skip;
      ctx.strokeStyle = U.css('--ok'); ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.moveTo(cx + 110, ys[a]); ctx.lineTo(cx + 190, ys[a]); ctx.lineTo(cx + 190, ys[b]); ctx.lineTo(cx + 70, ys[b]); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = U.css('--ok'); ctx.font = '600 11px Inter'; ctx.textAlign = 'left'; ctx.fillText(kind === 'se' ? 'identity (to rescale)' : 'identity / skip', cx + 196, (ys[a] + ys[b]) / 2);
      // main path
      for (let i = 0; i < n - 1; i++) { ctx.strokeStyle = U.css('--text-3'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, ys[i] + 14); ctx.lineTo(cx, ys[i + 1] - 14); ctx.stroke(); }
      const k = (t * 1.3) % (n - 1), i0 = Math.floor(k), f = k - i0;
      ctx.fillStyle = U.css('--accent-3'); ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(cx, U.lerp(ys[i0], ys[i0 + 1], f), 5, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      B.nodes.forEach((label, i) => {
        const isOp = label.startsWith('⊕') || label.startsWith('⊗');
        ctx.font = '600 12.5px Inter'; const tw = ctx.measureText(label).width + 28, bw = isOp ? 80 : Math.max(140, tw);
        ctx.fillStyle = i === 0 ? U.css('--surface-3') : isOp ? U.css('--ok') : U.css('--surface-2');
        ctx.strokeStyle = Math.abs(i - k) < 0.5 ? U.css('--accent') : U.css('--border-2'); ctx.lineWidth = 1.5;
        U.roundRect(ctx, cx - bw / 2, ys[i] - 14, bw, 28, 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = isOp ? '#000' : U.css('--text'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, ys[i] + 1); ctx.textBaseline = 'alphabetic';
      });
    });
  });

  /* ---------------- compound scaling ---------------- */
  CV.widget('compound-scaling', { title: 'EfficientNet compound scaling', desc: 'depth = α^φ, width = β^φ, resolution = γ^φ with α·β²·γ² ≈ 2, so FLOPs roughly double per step of φ.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 420, H = 240;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let phi = 1;
    const a = 1.2, b = 1.1, g = 1.15;
    U.slider(ctl, { label: 'Compound coefficient φ', min: 0, max: 6, step: 0.1, value: phi, onInput: (v) => { phi = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      const d = a ** phi, w = b ** phi, r = g ** phi;
      ctx.clearRect(0, 0, W, H);
      const layers = Math.round(5 * d), bw = 18 * w, res = 80 * r * 0.55;
      for (let i = 0; i < layers; i++) {
        const x = 20 + i * Math.min(bw + 6, (W - 60) / layers), hh = Math.min(180, res);
        ctx.fillStyle = i % 2 ? U.css('--accent-2') : U.css('--accent'); ctx.globalAlpha = 0.75;
        ctx.fillRect(x, H / 2 - hh / 2, Math.min(bw, (W - 60) / layers - 3), hh);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = U.css('--text-3'); ctx.font = '11px Inter'; ctx.fillText('depth = #bars, width = bar thickness, resolution = bar height', 20, H - 10);
      out.innerHTML = `α=1.2, β=1.1, γ=1.15  (α·β²·γ² ≈ 1.92)\ndepth ×<b>${d.toFixed(2)}</b>\nwidth ×<b>${w.toFixed(2)}</b>\nresolution ×<b>${r.toFixed(2)}</b> → ${Math.round(224 * r)} px\nFLOPs ×<b>${(a * b * b * g * g) ** phi < 100 ? ((a * b * b * g * g) ** phi).toFixed(1) : Math.round((a * b * b * g * g) ** phi)}</b>`;
    }
    draw();
  });

  /* ---------------- augmentation playground ---------------- */
  CV.widget('augment', { title: 'Data augmentation playground', desc: 'Label-preserving changes create new training samples. Toggle transforms, then hit Randomise to see a batch.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const S = 140, N = 6;
    const grid = U.el('div', { style: 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px' });
    stage.append(grid);
    const cvs = Array.from({ length: N }, () => { const p = U.pixCanvas(S, S, 200, false); grid.append(p.c); p.c.style.borderRadius = '8px'; return p; });
    const on = { flip: true, crop: true, rotate: true, color: true, cutout: false, mixup: false, mosaic: false };
    const labels = { flip: 'Horizontal flip', crop: 'Random resized crop', rotate: 'Rotation ±20°', color: 'Colour jitter', cutout: 'Cutout / random erasing', mixup: 'MixUp (blend two images)', mosaic: 'Mosaic (4 in 1)' };
    Object.keys(on).forEach((k) => U.check(ctl, labels[k], on[k], (v) => { on[k] = v; draw(); }));
    U.button(ctl, '🎲 Randomise batch', () => { seed++; draw(); }, 'btn btn-sm btn-primary');
    U.out(ctl, 'Apply only to the training set.\nValidation/test: deterministic resize + normalise.\nDon\'t flip digits or text.');
    let seed = 1;
    const other = document.createElement('canvas'); other.width = S; other.height = S;
    (function () { const x = other.getContext('2d'); const g = x.createLinearGradient(0, 0, S, S); g.addColorStop(0, '#f59e0b'); g.addColorStop(1, '#7c3aed'); x.fillStyle = g; x.fillRect(0, 0, S, S); x.fillStyle = '#fff'; x.beginPath(); x.arc(S / 2, S / 2, 34, 0, 7); x.fill(); x.fillStyle = '#111'; x.font = 'bold 28px Arial'; x.textAlign = 'center'; x.fillText('B', S / 2, S / 2 + 10); })();
    function draw() {
      const src = U.scene(320, 220);
      cvs.forEach(({ ctx }, i) => {
        const r = U.rand(seed * 100 + i * 7);
        ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, S, S);
        const drawOne = (x, y, w, h) => {
          ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
          ctx.translate(x + w / 2, y + h / 2);
          if (on.rotate) ctx.rotate((r() - 0.5) * 0.7);
          if (on.flip && r() < 0.5) ctx.scale(-1, 1);
          let sx = 50, sy = 0, sw = 220, sh = 220;
          if (on.crop) { const sc = 0.45 + r() * 0.55; sw = 220 * sc; sh = sw * (0.8 + r() * 0.4); sx = r() * (320 - sw); sy = r() * Math.max(0, 220 - sh); }
          ctx.drawImage(src, sx, sy, sw, Math.min(sh, 220 - sy), -w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
          ctx.restore();
        };
        if (on.mosaic) { const cx = S * (0.35 + r() * 0.3), cy = S * (0.35 + r() * 0.3); drawOne(0, 0, cx, cy); drawOne(cx, 0, S - cx, cy); drawOne(0, cy, cx, S - cy); drawOne(cx, cy, S - cx, S - cy); }
        else drawOne(0, 0, S, S);
        ctx.restore();
        const id = ctx.getImageData(0, 0, S, S), d = id.data;
        if (on.color) { const br = 0.7 + r() * 0.6, co = 0.7 + r() * 0.6, sa = r() * 1.4, hue = (r() - 0.5) * 40; for (let p = 0; p < d.length; p += 4) { let R = d[p], G = d[p + 1], B = d[p + 2]; const y = 0.299 * R + 0.587 * G + 0.114 * B; R = y + (R - y) * sa; G = y + (G - y) * sa; B = y + (B - y) * sa; R = (R - 128) * co + 128; G = (G - 128) * co + 128; B = (B - 128) * co + 128; d[p] = (R + hue) * br; d[p + 1] = G * br; d[p + 2] = (B - hue) * br; } }
        ctx.putImageData(id, 0, 0);
        if (on.mixup) { ctx.globalAlpha = 0.3 + r() * 0.3; ctx.drawImage(other, 0, 0); ctx.globalAlpha = 1; }
        if (on.cutout) { ctx.fillStyle = '#7f7f7f'; const cw = 30 + r() * 30; ctx.fillRect(r() * (S - cw), r() * (S - cw), cw, cw); }
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, S - 18, S, 18); ctx.fillStyle = '#fff'; ctx.font = '10.5px Inter';
        ctx.fillText(on.mixup ? 'label: 0.6 road + 0.4 B' : 'label: country road', 5, S - 5);
      });
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- training loop ---------------- */
  CV.widget('training-loop', { title: 'The training loop', desc: 'Repeated for each mini-batch, for every epoch.', tag: 'Animation' }, (body) => {
    const W = 640, H = 230;
    const { c, ctx } = U.canvas(W, H, { cssW: 640 });
    body.append(U.el('div', { class: 'canvas-box', style: 'display:flex;justify-content:center' }, c));
    const steps = [['load batch', 'x, y = next(loader)'], ['forward', 'logits = model(x)'], ['loss', 'loss = crit(logits, y)'], ['zero grads', 'opt.zero_grad()'], ['backward', 'loss.backward()'], ['step', 'opt.step(); sched.step()']];
    let t = 0, epoch = 1, batch = 0, loss = 2.3;
    U.loop(c, (dt) => {
      t += dt * 0.9;
      const k = Math.floor(t) % steps.length;
      if (Math.floor(t) !== Math.floor(t - dt * 0.9) && k === 0) { batch++; loss = loss * 0.93 + 0.02; if (batch % 8 === 0) epoch++; }
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = 110, R = 82;
      steps.forEach(([n, codeTxt], i) => {
        const a = -Math.PI / 2 + (i / steps.length) * Math.PI * 2, x = cx + Math.cos(a) * R * 2.1, y = cy + Math.sin(a) * R;
        const active = i === k;
        ctx.fillStyle = active ? U.css('--accent') : U.css('--surface-2'); ctx.strokeStyle = active ? U.css('--accent') : U.css('--border-2'); ctx.lineWidth = 1.5;
        U.roundRect(ctx, x - 62, y - 17, 124, 34, 10); ctx.fill(); ctx.stroke();
        ctx.fillStyle = active ? '#000' : U.css('--text'); ctx.font = '700 12.5px Inter'; ctx.textAlign = 'center'; ctx.fillText(n, x, y + 4);
      });
      const a = -Math.PI / 2 + ((t % steps.length) / steps.length) * Math.PI * 2;
      ctx.fillStyle = U.css('--accent-3'); ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 1.55, cy + Math.sin(a) * R * 0.72, 6, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = U.css('--text'); ctx.font = '600 13px JetBrains Mono';
      ctx.fillText(steps[k][1], cx, cy - 4);
      ctx.fillStyle = U.css('--text-3'); ctx.font = '12px Inter';
      ctx.fillText(`epoch ${epoch} · batch ${batch} · loss ${loss.toFixed(3)}`, cx, cy + 18);
    });
  });

  /* ---------------- debugging checklist ---------------- */
  CV.widget('debug-checklist', { title: 'Training debugger', desc: 'Pick the symptom you see. Get the likely cause and fix.', tag: 'Checklist' }, (body) => {
    const D = [
      ['Loss does not decrease at all', 'LR far too high or too low; labels shuffled relative to images; forgot optimizer.step() or zero_grad().'],
      ['Initial loss is not about ln(C) (2.30 for 10 classes)', 'Wrong loss/activation combination (e.g. softmax before CrossEntropyLoss), bad init, unnormalised input.'],
      ['Cannot overfit a single small batch', 'Bug in model, loss, or labels: fix this before anything else.'],
      ['Train accuracy high, validation low', 'Overfitting or data leakage: more augmentation, regularisation, more data, check splits.'],
      ['Train and validation both low', 'Underfitting: bigger model, train longer, lower regularisation, check LR.'],
      ['Validation worse only in eval mode', 'BatchNorm/dropout mode, or different preprocessing between train and val.'],
      ['Great offline accuracy, poor in production', 'Distribution shift; preprocessing mismatch (BGR/RGB, resize method); different camera.'],
      ['NaN loss', 'LR too high, division by zero, FP16 overflow; add gradient clipping.'],
    ];
    const list = U.el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px' });
    const ans = U.el('div', { class: 'w-out', style: 'margin-top:14px;min-height:60px', html: 'Select a symptom above.' });
    body.append(list, ans);
    D.forEach(([s, f], i) => {
      const b = U.el('button', { type: 'button', class: 'opt', style: 'font-size:14px;padding:10px 12px' }, U.el('span', { class: 'ol' }, String(i + 1)), U.el('span', {}, s));
      b.onclick = () => { list.querySelectorAll('.opt').forEach((x) => x.classList.remove('right')); b.classList.add('right'); ans.innerHTML = `<b>${s}</b>\n→ ${f}`; };
      list.append(b);
    });
  });
})();
