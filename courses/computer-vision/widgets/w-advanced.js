/* Widgets for Chapters 13–17: transformers, self-supervision, generative models, deployment, robustness */
(function () {
  'use strict';
  const U = CV.util;

  Object.assign(CV.DIAGRAMS, {
    vit: {
      name: 'Vision Transformer', w: 760, h: 250,
      caption: 'Split into patches → linear projection → prepend [CLS] and add position embeddings → L pre-norm encoder blocks (x + MHA(LN(x)), x + MLP(LN(x))) → classify from [CLS].',
      nodes: { img: [10, 95, 80, 56, '224×224', 0], patch: [115, 95, 110, 56, '196 patches\n16×16×3', 0], proj: [250, 95, 110, 56, 'linear proj\n→ D=768', 1], cls: [250, 15, 110, 40, '[CLS] + pos', 3], enc: [390, 75, 150, 96, 'Transformer\nencoder × L', 2, 'MHA + MLP (4D)'], ln: [570, 95, 70, 56, 'LN', 1], head: [665, 95, 85, 56, 'linear\nhead', 4] },
      edges: [['img', 'patch'], ['patch', 'proj'], ['proj', 'enc', { label: '197×768' }], ['cls', 'enc', { c: 3 }], ['enc', 'ln'], ['ln', 'head', { label: '[CLS]' }]],
      tips: { enc: 'pre-norm residual blocks; GELU MLP', proj: 'implemented as conv, kernel = stride = 16' },
    },
    mae: {
      name: 'Masked Autoencoder', w: 760, h: 230,
      caption: 'MAE hides 75% of patches. The heavy encoder sees only the visible 25% (≈3× cheaper pretraining); a light decoder receives encoded tokens + mask tokens and reconstructs the missing pixels (loss on masked patches only).',
      nodes: { img: [10, 85, 80, 56, 'image\npatches', 0], mask: [115, 85, 110, 56, 'random mask\n75%', 3], enc: [255, 85, 140, 56, 'ViT encoder\n(visible only)', 1], tok: [425, 15, 120, 40, '+ mask tokens', 3], dec: [425, 85, 120, 56, 'light\ndecoder', 2], rec: [580, 85, 160, 56, 'reconstruct\nmasked pixels', 4] },
      edges: [['img', 'mask'], ['mask', 'enc', { label: '25% tokens' }], ['enc', 'dec'], ['tok', 'dec', { c: 3 }], ['dec', 'rec']],
    },
    clip: {
      name: 'CLIP', w: 720, h: 260,
      caption: 'Two encoders map images and captions into one embedding space. For a batch of N pairs, the N×N similarity matrix is trained so the diagonal (matching pairs) wins in both directions.',
      nodes: { im: [10, 30, 110, 50, 'images', 0], ie: [150, 30, 140, 50, 'image encoder\n(ViT / ResNet)', 0], tx: [10, 180, 110, 50, 'captions', 1], te: [150, 180, 140, 50, 'text encoder\n(transformer)', 1], sim: [360, 95, 160, 70, 'N×N cosine\nsimilarity', 2], loss: [560, 100, 150, 60, 'symmetric\ncross-entropy', 4] },
      edges: [['im', 'ie'], ['tx', 'te', { c: 1 }], ['ie', 'sim', { label: 'I·' }], ['te', 'sim', { c: 1, label: 'T·' }], ['sim', 'loss']],
    },
    sam: {
      name: 'Segment Anything', w: 760, h: 250,
      caption: 'A heavy ViT-H image encoder (MAE-pretrained) runs once per image → 64×64×256 embedding. A light prompt encoder and two-way-attention mask decoder run per click in tens of milliseconds, returning 3 candidate masks with IoU scores.',
      nodes: { img: [10, 40, 90, 50, '1024²\nimage', 0], enc: [130, 40, 150, 50, 'ViT-H encoder', 0, 'runs ONCE'], emb: [310, 40, 120, 50, 'embedding\n64×64×256', 0], pr: [10, 170, 90, 50, 'points /\nbox / mask', 3], pe: [130, 170, 150, 50, 'prompt encoder', 3, 'per prompt'], dec: [470, 100, 140, 60, 'mask decoder\n(two-way attn)', 2], out: [640, 100, 110, 60, '3 masks\n+ IoU scores', 4] },
      edges: [['img', 'enc'], ['enc', 'emb'], ['emb', 'dec'], ['pr', 'pe', { c: 3 }], ['pe', 'dec', { c: 3 }], ['dec', 'out']],
    },
    vlm: {
      name: 'Vision-language model', w: 760, h: 220,
      caption: 'A CLIP/SigLIP vision encoder turns the image into patch features; a projector (MLP, Q-Former or resampler) maps them into the LLM token space; the decoder-only LLM reads visual + text tokens and answers autoregressively.',
      nodes: { img: [10, 30, 90, 50, 'image', 0], ve: [125, 30, 150, 50, 'vision encoder\nCLIP / SigLIP', 0], pj: [300, 30, 130, 50, 'projector\nMLP / Q-Former', 3], q: [10, 140, 90, 50, 'question', 1], tok: [125, 140, 150, 50, 'text tokens', 1], llm: [470, 80, 150, 60, 'LLM (decoder)', 2], ans: [650, 80, 100, 60, 'answer', 4] },
      edges: [['img', 've'], ['ve', 'pj'], ['pj', 'llm', { label: 'visual tokens' }], ['q', 'tok', { c: 1 }], ['tok', 'llm', { c: 1 }], ['llm', 'ans']],
    },
    ldm: {
      name: 'Latent diffusion', w: 780, h: 250,
      caption: 'A VAE compresses 512×512×3 to 64×64×4 (≈48× fewer values). The U-Net/DiT denoises in that latent space for 20–50 steps, conditioned on text via cross-attention; the VAE decoder turns the final latent into pixels.',
      groups: [[150, 10, 470, 230, 'latent space', 2]],
      nodes: { noise: [170, 40, 110, 50, 'noise z_T\n64×64×4', 3], unet: [320, 40, 150, 70, 'U-Net / DiT\ndenoiser ×T', 2], z0: [500, 40, 100, 50, 'z_0', 2], txt: [10, 160, 110, 50, '"a robot\nreading"', 1], te: [170, 160, 140, 50, 'text encoder\n(CLIP / T5)', 1], dec: [640, 40, 120, 50, 'VAE decoder', 0], img: [640, 160, 120, 60, '512×512\nimage', 4] },
      edges: [['noise', 'unet'], ['unet', 'z0'], ['txt', 'te', { c: 1 }], ['te', 'unet', { c: 1, label: 'cross-attn' }], ['z0', 'dec'], ['dec', 'img']],
    },
    swin: {
      name: 'Swin Transformer', w: 760, h: 200,
      caption: 'Hierarchical stages with patch merging (2×2 neighbours → 4C → 2C) give feature maps at strides 4, 8, 16, 32, like a CNN. Attention runs inside local 7×7 windows; alternate blocks shift the windows.',
      nodes: { st: [10, 70, 100, 56, 'patch\npartition', 0, '/4'], s1: [140, 70, 120, 56, 'stage 1', 1, 'W-MSA / SW-MSA'], s2: [290, 70, 120, 56, 'merge + stage 2', 1, '/8, 2C'], s3: [440, 70, 120, 56, 'merge + stage 3', 1, '/16, 4C'], s4: [590, 70, 120, 56, 'merge + stage 4', 1, '/32, 8C'] },
      edges: [['st', 's1'], ['s1', 's2'], ['s2', 's3'], ['s3', 's4']],
    },
  });

  /* ---------------- ViT patchify ---------------- */
  CV.widget('patchify', { title: 'An image is worth 16×16 words', desc: 'Pick a patch size. The image is cut into tokens that fly into a sequence; smaller patches mean more tokens and quadratically more attention cost.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 440px' });
    const W = 560, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let P = 32, t = 0, dir = 1;
    const img = 224;
    U.seg(ctl, [[56, '56'], [32, '32'], [16, '16'], [14, '14'], [8, '8']], P, (v) => { P = v; t = 0; });
    const out = U.out(ctl);
    U.loop(c, (dt) => {
      t = Math.min(1.6, t + dt * 0.5);
      const n = img / P, N = n * n, S = 200, cs = S / n;
      ctx.clearRect(0, 0, W, H);
      const src = U.scene(320, 220);
      const e = (k) => { const s = U.clamp((t - (k / N) * 0.6) / 0.5, 0, 1); return s * s * (3 - 2 * s); };
      const seqCols = Math.min(N, Math.floor((W - 260) / 9)), tok = Math.max(4, Math.min(22, (W - 260) / Math.min(N, 28)));
      for (let k = 0; k < N; k++) {
        const i = k % n, j = Math.floor(k / n), p = e(k);
        const x0 = 20 + i * cs, y0 = 50 + j * cs;
        const cols = Math.max(1, Math.floor((W - 260) / tok)), x1 = 250 + (k % cols) * tok, y1 = 40 + Math.floor(k / cols) * (tok + 2);
        const x = U.lerp(x0, x1, p), y = U.lerp(y0, y1, p), sz = U.lerp(cs - 1, tok - 2, p);
        if (y > H) continue;
        ctx.drawImage(src, 50 + (i * 220) / n, (j * 220) / n, 220 / n, 220 / n, x, y, sz, sz);
        if (p > 0.95 && tok > 12 && N <= 64) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, y + sz - 9, sz, 9); ctx.fillStyle = '#fff'; ctx.font = '7px JetBrains Mono'; ctx.fillText(k, x + 1, y + sz - 2); }
      }
      ctx.strokeStyle = U.css('--accent'); ctx.lineWidth = 1;
      for (let i = 0; i <= n; i++) { ctx.globalAlpha = 1 - Math.min(1, t); ctx.beginPath(); ctx.moveTo(20 + i * cs, 50); ctx.lineTo(20 + i * cs, 50 + S); ctx.moveTo(20, 50 + i * cs); ctx.lineTo(20 + S, 50 + i * cs); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = U.css('--text-2'); ctx.font = '600 12px Inter';
      ctx.fillText('224 × 224 image', 20, 36); ctx.fillText(`sequence of ${N} tokens (+[CLS])`, 250, 26);
      out.innerHTML = `patch P = ${P}\nN = (224/${P})² = <b>${N}</b> tokens\neach patch: ${P}×${P}×3 = ${U.fmtInt(P * P * 3)} numbers\n  → linear projection to D\nattention matrix: ${N + 1}² = <b>${U.fmtInt((N + 1) ** 2)}</b> entries\n\nViT-B/16: 196 + 1 = 197 tokens, ≈17.6 GFLOPs`;
    });
  });

  /* ---------------- self-attention on patches ---------------- */
  CV.widget('attention', { title: 'Self-attention: softmax(QKᵀ/√d)·V', desc: 'Click any patch to make it the query. Brightness shows its attention weights over all patches (keys). Similar-looking patches attend strongly to each other.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const n = 12, S = 360;
    const { c, ctx } = U.canvas(S, S * 220 / 320);
    c.style.cursor = 'pointer';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let q = [8, 6], temp = 0.35, posW = 0.3;
    U.slider(ctl, { label: 'Softmax temperature (√d scaling)', min: 0.08, max: 1.5, step: 0.01, value: temp, onInput: (v) => { temp = v; draw(); } });
    U.slider(ctl, { label: 'Position bias (locality)', min: 0, max: 1, step: 0.01, value: posW, onInput: (v) => { posW = v; draw(); } });
    const out = U.out(ctl);
    const H = S * 220 / 320, rows = Math.round(n * 220 / 320), cw = S / n, ch = H / rows;
    let feats;
    function features() {
      const src = U.scene(n * 8, rows * 8), d = U.getRGB(src).data, W8 = n * 8;
      feats = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
        let r = 0, g = 0, b = 0, e = 0;
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const k = ((j * 8 + y) * W8 + i * 8 + x) * 4; r += d[k]; g += d[k + 1]; b += d[k + 2]; if (x) e += Math.abs(d[k] - d[k - 4]); }
        const f = [r / 64 / 255, g / 64 / 255, b / 64 / 255, e / 64 / 255 / 4];
        feats.push(f);
      }
    }
    function draw() {
      if (!feats) features();
      const qi = q[1] * n + q[0], fq = feats[qi];
      const logits = feats.map((f, k) => { const dx = (k % n) - q[0], dy = Math.floor(k / n) - q[1]; return -((f[0] - fq[0]) ** 2 + (f[1] - fq[1]) ** 2 + (f[2] - fq[2]) ** 2 + (f[3] - fq[3]) ** 2) * 14 - posW * Math.hypot(dx, dy) * 0.25; });
      const m = Math.max(...logits), ex = logits.map((l) => Math.exp((l - m) / temp)), s = ex.reduce((a, b) => a + b), A = ex.map((v) => v / s), amax = Math.max(...A);
      ctx.clearRect(0, 0, S, H);
      ctx.drawImage(U.scene(320, 220), 0, 0, S, H);
      for (let k = 0; k < A.length; k++) { const i = k % n, j = Math.floor(k / n); ctx.fillStyle = `rgba(0,0,0,${0.9 - 0.9 * Math.pow(A[k] / amax, 0.6)})`; ctx.fillRect(i * cw, j * ch, cw, ch); }
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i <= n; i++) { ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, H); ctx.stroke(); } for (let j = 0; j <= rows; j++) { ctx.beginPath(); ctx.moveTo(0, j * ch); ctx.lineTo(S, j * ch); ctx.stroke(); }
      ctx.strokeStyle = '#e07a5f'; ctx.lineWidth = 3; ctx.strokeRect(q[0] * cw, q[1] * ch, cw, ch);
      const ent = -A.reduce((a, p) => a + (p > 0 ? p * Math.log(p) : 0), 0);
      const top = A.map((p, k) => [p, k]).sort((a, b) => b[0] - a[0]).slice(0, 3);
      out.innerHTML = `query patch (${q[0]}, ${q[1]})\nweights sum to 1 over ${A.length} keys\ntop keys: ${top.map(([p, k]) => `(${k % n},${Math.floor(k / n)}) ${(p * 100).toFixed(1)}%`).join(', ')}\nentropy ${ent.toFixed(2)} nats ${temp < 0.15 ? '(very peaked: saturated softmax)' : ''}\n\nWithout dividing by √d_k, dot products grow\nwith dimension and the softmax saturates.`;
    }
    c.addEventListener('click', (e) => { const p = U.mouse(c, e); q = [U.clamp(Math.floor(p.x / cw), 0, n - 1), U.clamp(Math.floor(p.y / ch), 0, rows - 1)]; draw(); });
    draw();
    return U.onImage(() => { feats = null; draw(); });
  });

  /* ---------------- QKV mini calculator ---------------- */
  CV.widget('qkv', { title: 'Attention by hand: 4 tokens', desc: 'Every token\'s output is a weighted average of all value vectors. Edit a query to see the weights shift.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const toks = ['sky', 'roof', 'wall', 'wheel'];
    let Q = [[1, 0], [0.2, 1], [0.6, 0.8], [-1, 0.3]], K = [[1, 0.1], [0.1, 1], [0.5, 0.9], [-0.9, 0.2]], V = [[0.9, 0.1], [0.2, 0.8], [0.3, 0.7], [0.1, 0.1]], qi = 1;
    const row = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Query token')); ctl.append(row);
    U.seg(row, toks.map((t, i) => [i, t]), qi, (v) => { qi = v; s1.set(Q[qi][0]); s2.set(Q[qi][1]); draw(); });
    const s1 = U.slider(ctl, { label: 'q[0]', min: -1.5, max: 1.5, step: 0.05, value: Q[qi][0], onInput: (v) => { Q[qi][0] = v; draw(); } });
    const s2 = U.slider(ctl, { label: 'q[1]', min: -1.5, max: 1.5, step: 0.05, value: Q[qi][1], onInput: (v) => { Q[qi][1] = v; draw(); } });
    const tbl = U.el('div'); stage.append(tbl);
    const out = U.out(stage); out.style.marginTop = '10px';
    function draw() {
      const d = 2, sc = K.map((k) => (Q[qi][0] * k[0] + Q[qi][1] * k[1]) / Math.sqrt(d));
      const m = Math.max(...sc), e = sc.map((v) => Math.exp(v - m)), s = e.reduce((a, b) => a + b), A = e.map((v) => v / s);
      const o = [0, 1].map((j) => A.reduce((acc, a, k) => acc + a * V[k][j], 0));
      tbl.innerHTML = `<div class="tbl-wrap" style="margin:0"><table><thead><tr><th>key</th><th>k</th><th>q·k/√d</th><th>softmax</th><th>v</th></tr></thead><tbody>${toks.map((t, k) => `<tr><td>${t}</td><td style="font-family:var(--mono)">[${K[k].join(', ')}]</td><td style="font-family:var(--mono)">${sc[k].toFixed(2)}</td><td><div class="track" style="height:10px;border-radius:9px;background:var(--surface-3);width:120px"><div class="fill" style="height:100%;border-radius:9px;width:${A[k] * 100}%;background:linear-gradient(90deg,var(--accent),var(--accent-2))"></div></div><small style="font-family:var(--mono)">${(A[k] * 100).toFixed(1)}%</small></td><td style="font-family:var(--mono)">[${V[k].join(', ')}]</td></tr>`).join('')}</tbody></table></div>`;
      out.innerHTML = `output(${toks[qi]}) = Σ softmax · v = [<b>${o[0].toFixed(3)}, ${o[1].toFixed(3)}</b>]\nMulti-head: run h of these in parallel on d/h-dim subspaces.`;
    }
    draw();
  });

  /* ---------------- Swin windows ---------------- */
  CV.widget('swin-windows', { title: 'Window attention and shifted windows', desc: 'Attention only inside M×M windows makes cost linear in the number of tokens. Shifting by M/2 in the next block lets information cross window borders.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 340;
    const { c, ctx } = U.canvas(W, W);
    stage.append(U.el('div', { class: 'canvas-box', style: 'max-width:360px' }, c));
    let shift = false, M = 4, auto = true, t = 0;
    U.seg(ctl, [[false, 'W-MSA (regular)'], [true, 'SW-MSA (shifted)']], shift, (v) => { shift = v; auto = false; });
    U.slider(ctl, { label: 'Window size M', min: 2, max: 8, step: 2, value: M, onInput: (v) => (M = v) });
    const out = U.out(ctl);
    const N = 16;
    U.loop(c, (dt) => {
      t += dt; if (auto && Math.floor(t / 2.2) % 2 !== +shift) shift = !shift;
      const cs = W / N, off = shift ? M / 2 : 0, pal = U.palette();
      ctx.clearRect(0, 0, W, W);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const wi = Math.floor((i + off) / M) % (N / M), wj = Math.floor((j + off) / M) % (N / M), id = wj * (N / M) + wi;
        ctx.fillStyle = pal[id % pal.length]; ctx.globalAlpha = 0.18 + 0.22 * ((wi + wj) % 2); ctx.fillRect(i * cs + 1, j * cs + 1, cs - 2, cs - 2);
      }
      ctx.globalAlpha = 1; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
      for (let k = 0; k <= N / M; k++) { const p = (k * M - off) * cs; ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke(); }
      const tok = 56 * 56, C = 96;
      out.innerHTML = `${shift ? 'Shifted by M/2 (cyclic shift + mask)' : 'Regular windows'}\nwindow M = ${M}: each token attends to ${M * M}\n\nFor 56×56 tokens, C = 96, M = 7:\nΩ(MSA)   = 4hwC² + 2(hw)²C = <b>${U.fmt(4 * tok * C * C + 2 * tok * tok * C, 1)}</b>\nΩ(W-MSA) = 4hwC² + 2M²hwC = <b>${U.fmt(4 * tok * C * C + 2 * 49 * tok * C, 1)}</b>`;
    });
  });

  /* ---------------- attention cost ---------------- */
  CV.widget('attn-cost', { title: 'Why resolution hurts transformers', desc: 'Tokens grow with the square of resolution, and global attention grows with the square of tokens.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 440, H = 240;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let P = 16, res = 224;
    U.slider(ctl, { label: 'Input resolution', min: 112, max: 1024, step: 16, value: res, fmt: (v) => v + ' px', onInput: (v) => { res = v; draw(); } });
    U.slider(ctl, { label: 'Patch size', min: 8, max: 32, step: 8, value: P, onInput: (v) => { P = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const pl = U.plot(ctx, W, H, { x0: 112, x1: 1024, y0: 0, y1: 6, xticks: 4, yticks: 3, xlabel: 'resolution', ylabel: 'log₁₀ attention entries', fmtX: (v) => v.toFixed(0), fmtY: (v) => '1e' + v.toFixed(0) });
      pl.fn((r) => Math.log10(((r / P) ** 2) ** 2), U.css('--bad'));
      pl.fn((r) => Math.log10((r / P) ** 2 * 49), U.css('--ok'));
      ctx.fillStyle = U.css('--accent-3'); ctx.beginPath(); ctx.arc(pl.X(res), pl.Y(Math.log10(((res / P) ** 2) ** 2)), 6, 0, 7); ctx.fill();
      const N = (res / P) ** 2;
      out.innerHTML = `tokens N = (${res}/${P})² = <b>${U.fmtInt(N)}</b>\n<span style="color:var(--bad)">global attention</span> N² = <b>${U.fmt(N * N, 1)}</b>\n<span style="color:var(--ok)">7×7 windows</span>  49·N = <b>${U.fmt(49 * N, 1)}</b>\n\nFixes: windows (Swin), hierarchy, token\nmerging (ToMe), FlashAttention (exact,\nmemory-efficient).`;
    }
    draw();
  });

  /* ---------------- SimCLR / contrastive ---------------- */
  CV.widget('contrastive', { title: 'Contrastive learning (SimCLR)', desc: 'Two augmented views of the same image are positives; every other image in the batch is a negative. The loss pulls the diagonal up.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let step = 0, tau = 0.2, training = true;
    U.slider(ctl, { label: 'Temperature τ', min: 0.05, max: 1, step: 0.01, value: tau, onInput: (v) => (tau = v) });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    const pb = U.button(bb, '❚❚ Pause', () => { training = !training; pb.innerHTML = training ? '❚❚ Pause' : '▶ Train'; });
    U.button(bb, '↺ Reset', () => (step = 0));
    const out = U.out(ctl);
    const N = 6, rnd = U.rand(4), base = Array.from({ length: N }, () => rnd() * Math.PI * 2);
    const noise = Array.from({ length: N }, () => [(rnd() - 0.5) * 3, (rnd() - 0.5) * 3]);
    const hues = [190, 260, 330, 40, 140, 220];
    U.loop(c, (dt) => {
      if (training) step = Math.min(1, step + dt * 0.12);
      ctx.clearRect(0, 0, W, H);
      const cx = 120, cy = 150, R = 105;
      ctx.strokeStyle = U.css('--border-2'); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      const z = [];
      for (let i = 0; i < N; i++) {
        const a1 = base[i] + noise[i][0] * (1 - step) * 0.6, a2 = base[i] + noise[i][1] * (1 - step) * 0.6;
        z.push([a1, a2]);
        [a1, a2].forEach((a, v) => { ctx.fillStyle = `hsl(${hues[i]},80%,60%)`; ctx.beginPath(); v ? ctx.rect(cx + Math.cos(a) * R - 5, cy + Math.sin(a) * R - 5, 10, 10) : ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 6, 0, 7); ctx.fill(); });
        ctx.strokeStyle = `hsla(${hues[i]},80%,60%,.5)`; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); ctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R); ctx.stroke();
      }
      ctx.fillStyle = U.css('--text-3'); ctx.font = '11px Inter'; ctx.textAlign = 'center'; ctx.fillText('embeddings on the unit circle (● view 1, ■ view 2)', cx, H - 8);
      const x0 = 260, cs = 30;
      let loss = 0;
      for (let i = 0; i < N; i++) {
        const sims = z.map((zz) => Math.cos(z[i][0] - zz[1]));
        const ex = sims.map((s) => Math.exp(s / tau)), sum = ex.reduce((a, b) => a + b);
        loss += -Math.log(ex[i] / sum);
        sims.forEach((s, j) => { const col = U.viridis((s + 1) / 2); ctx.fillStyle = `rgb(${col})`; ctx.fillRect(x0 + j * cs, 50 + i * cs, cs - 2, cs - 2); if (i === j) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x0 + j * cs, 50 + i * cs, cs - 2, cs - 2); } });
      }
      ctx.fillStyle = U.css('--text-2'); ctx.font = '600 11px Inter'; ctx.textAlign = 'left'; ctx.fillText('similarity: view 1 (rows) × view 2 (cols)', x0 - 4, 40);
      out.innerHTML = `NT-Xent loss = <b>${(loss / N).toFixed(3)}</b>\ntraining progress ${(step * 100).toFixed(0)}%\n\nℓ = −log exp(sim(zᵢ,zⱼ)/τ) / Σ exp(sim(zᵢ,zₖ)/τ)\nSimCLR needs huge batches for negatives;\nMoCo uses a queue from an EMA encoder.`;
    });
  });

  /* ---------------- MAE masking ---------------- */
  CV.widget('mae-mask', { title: 'Masked image modelling', desc: 'Hide a fraction of patches. The encoder only sees what is left. Images are redundant, so even 75% masking can be undone with understanding.' }, (body) => {
    const W = 220, H = 150, n = 14, rows = Math.round(n * H / W);
    const a = U.pixCanvas(W, H, 260, false), b = U.pixCanvas(W, H, 260, false), d = U.pixCanvas(W, H, 260, false);
    let ratio = 0.75, seed = 1;
    const top = U.el('div', { class: 'w-row', style: 'margin-bottom:12px;align-items:center' }); body.append(top);
    const col = U.el('div', { class: 'w-col' }); top.append(col);
    U.slider(col, { label: 'Mask ratio', min: 0, max: 0.95, step: 0.05, value: ratio, fmt: (v) => Math.round(v * 100) + '%', onInput: (v) => { ratio = v; draw(); } });
    U.button(top, '🎲 New mask', () => { seed++; draw(); });
    body.append(U.el('div', { class: 'w-row' }, ...[['Original', a], ['What the encoder sees', b], ['Naive fill from neighbours (decoder does far better)', d]].map(([t, p]) => U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, t), p.c))));
    const out = U.out(body); out.style.marginTop = '10px';
    function draw() {
      const src = U.scene(W, H); a.ctx.drawImage(src, 0, 0);
      const r = U.rand(seed * 17), N = n * rows, idx = [...Array(N).keys()].sort(() => r() - 0.5), masked = new Set(idx.slice(0, Math.round(N * ratio)));
      const pw = W / n, ph = H / rows;
      b.ctx.drawImage(src, 0, 0); b.ctx.fillStyle = '#4b5563';
      masked.forEach((k) => b.ctx.fillRect((k % n) * pw, Math.floor(k / n) * ph, pw + 0.5, ph + 0.5));
      const small = document.createElement('canvas'); small.width = n; small.height = rows; const sctx = small.getContext('2d');
      const S = U.getRGB(src).data, id = sctx.createImageData(n, rows);
      for (let k = 0; k < N; k++) { const i = k % n, j = Math.floor(k / n); let rr = 0, gg = 0, bb = 0, cnt = 0; for (let y = Math.floor(j * ph); y < (j + 1) * ph; y++) for (let x = Math.floor(i * pw); x < (i + 1) * pw; x++) { const q = (y * W + x) * 4; rr += S[q]; gg += S[q + 1]; bb += S[q + 2]; cnt++; } id.data.set([rr / cnt, gg / cnt, bb / cnt, masked.has(k) ? 0 : 255], k * 4); }
      for (let pass = 0; pass < 6; pass++) for (let k = 0; k < N; k++) { if (id.data[k * 4 + 3]) continue; const i = k % n, j = Math.floor(k / n); let s = [0, 0, 0], c = 0; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = i + dx, y = j + dy; if (x < 0 || y < 0 || x >= n || y >= rows) return; const q = (y * n + x) * 4; if (id.data[q + 3]) { s[0] += id.data[q]; s[1] += id.data[q + 1]; s[2] += id.data[q + 2]; c++; } }); if (c) { id.data.set([s[0] / c, s[1] / c, s[2] / c, 254], k * 4); } }
      sctx.putImageData(id, 0, 0);
      d.ctx.drawImage(src, 0, 0); d.ctx.imageSmoothingEnabled = true;
      masked.forEach((k) => { const i = k % n, j = Math.floor(k / n); d.ctx.drawImage(small, i, j, 1, 1, i * pw, j * ph, pw + 0.5, ph + 0.5); });
      out.innerHTML = `${masked.size} of ${N} patches hidden · encoder processes only ${N - masked.size} tokens (${(((N - masked.size) / N) * 100).toFixed(0)}% of compute)\nMAE: loss only on masked patches, usually on per-patch normalised pixels.`;
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- CLIP zero-shot ---------------- */
  CV.widget('clip-zeroshot', { title: 'CLIP zero-shot classification', desc: 'Embed "a photo of a {class}" for every class and pick the prompt closest to the image embedding. Edit the class list; no training needed.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 300, H = 206;
    const v = U.pixCanvas(W, H, 340, false);
    stage.append(U.el('div', { class: 'canvas-box' }, v.c));
    const inp = U.el('input', { class: 'w-input', style: 'width:100%', value: 'road, house, car, cat, ocean, mountain' });
    ctl.append(U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Class names (comma separated)'), inp));
    let scale = 100;
    U.slider(ctl, { label: 'Logit scale (1/τ)', min: 10, max: 100, value: scale, onInput: (x) => { scale = x; draw(); } });
    const bars = U.el('div', { class: 'bars' }); ctl.append(bars);
    const note = U.el('div', { class: 'w-note', html: 'Toy embeddings: similarity here is computed from simple colour/texture statistics of the picture and a tiny hand-made word table, to show the mechanics. Real CLIP uses learned 512–1024-d embeddings from 400M image–text pairs.' });
    body.append(note);
    const WORDS = { road: [0.3, 0.5, 0.2, 0.6], street: [0.3, 0.5, 0.2, 0.6], house: [0.5, 0.3, 0.3, 0.5], building: [0.5, 0.3, 0.3, 0.5], car: [0.6, 0.2, 0.2, 0.4], sky: [0.1, 0.2, 0.9, 0.2], ocean: [0.05, 0.3, 0.9, 0.1], beach: [0.7, 0.6, 0.6, 0.2], mountain: [0.3, 0.4, 0.5, 0.5], cat: [0.6, 0.5, 0.4, 0.3], dog: [0.6, 0.5, 0.4, 0.3], forest: [0.1, 0.9, 0.1, 0.5], grass: [0.2, 0.9, 0.2, 0.4], tree: [0.2, 0.8, 0.2, 0.5], countryside: [0.3, 0.7, 0.5, 0.5], city: [0.5, 0.5, 0.5, 0.7], snow: [0.95, 0.95, 0.95, 0.1], desert: [0.9, 0.7, 0.4, 0.1] };
    const hashVec = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const r = U.rand(h); return [r(), r(), r(), r()]; };
    function draw() {
      v.ctx.drawImage(U.scene(W, H), 0, 0);
      const d = U.getRGB(U.scene(64, 44)).data; let r = 0, g = 0, b = 0, e = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; if (i % 256) e += Math.abs(d[i] - d[i - 4]); }
      const n = d.length / 4, img = [r / n / 255, g / n / 255, b / n / 255, Math.min(1, e / n / 40)];
      const norm = (x) => { const l = Math.hypot(...x); return x.map((y) => y / l); };
      const I = norm(img.map((x) => x - 0.4));
      const classes = inp.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
      const sims = classes.map((c) => { const T = norm((WORDS[c.toLowerCase()] || hashVec(c.toLowerCase())).map((x) => x - 0.4)); return I.reduce((a, x, i) => a + x * T[i], 0); });
      const m = Math.max(...sims), ex = sims.map((s) => Math.exp((s - m) * scale / 10)), sum = ex.reduce((a, b2) => a + b2), p = ex.map((x) => x / sum);
      bars.innerHTML = classes.map((c, i) => `<div class="bar-row" style="grid-template-columns:120px 1fr 54px"><span style="font-size:12px">a photo of a <b>${U.esc(c)}</b></span><div class="track"><div class="fill" style="width:${p[i] * 100}%"></div></div><span class="v">${(p[i] * 100).toFixed(1)}%</span></div>`).join('');
    }
    inp.oninput = draw;
    draw();
    return U.onImage(draw);
  });

  /* ---------------- LoRA ---------------- */
  CV.widget('lora', { title: 'LoRA: low-rank fine-tuning', desc: "Freeze W (d×k); learn W' = W + B·A with B: d×r and A: r×k. Only A and B are trained and stored." }, (body) => {
    const { stage, ctl } = U.split(body);
    let d = 1024, k = 1024, r = 8;
    U.slider(ctl, { label: 'd (output dim)', min: 256, max: 4096, step: 256, value: d, onInput: (v) => { d = v; draw(); } });
    U.slider(ctl, { label: 'k (input dim)', min: 256, max: 4096, step: 256, value: k, onInput: (v) => { k = v; draw(); } });
    U.slider(ctl, { label: 'rank r', min: 1, max: 128, value: r, onInput: (v) => { r = v; draw(); } });
    const W = 420, H = 220;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const out = U.out(stage); out.style.marginTop = '10px';
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const s = 160 / Math.max(d, k), wd = k * s, hd = d * s, rr = Math.max(3, r * s * 4);
      ctx.fillStyle = 'rgba(140,140,140,.35)'; ctx.fillRect(20, 30, wd, hd); ctx.strokeStyle = U.css('--text-3'); ctx.strokeRect(20, 30, wd, hd);
      ctx.fillStyle = U.css('--text'); ctx.font = '700 13px Inter'; ctx.fillText('W (frozen ❄)', 24, 22);
      ctx.fillText('+', 40 + wd, 30 + hd / 2);
      const bx = 70 + wd;
      ctx.fillStyle = U.css('--accent'); ctx.fillRect(bx, 30, rr, hd); ctx.fillText('B', bx, 22);
      ctx.fillStyle = U.css('--accent-2'); ctx.fillRect(bx + rr + 14, 30, wd, rr); ctx.fillStyle = U.css('--text'); ctx.fillText('A', bx + rr + 14, 22);
      const full = d * k, lora = r * (d + k);
      out.innerHTML = `full fine-tune: ${U.fmtInt(full)} params\nLoRA (r=${r}):  ${U.fmtInt(lora)} params\n→ <b>${((lora / full) * 100).toFixed(2)}%</b> of the layer`;
    }
    draw();
  });

  /* ---------------- diffusion forward process ---------------- */
  CV.widget('diffusion-forward', { title: 'Forward diffusion: x_t = √ᾱ_t · x₀ + √(1 − ᾱ_t) · ε', desc: 'Jump straight to any timestep with the closed form. Compare linear and cosine noise schedules.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 240, H = 165;
    const img = U.pixCanvas(W, H, 360, false);
    const plot = U.canvas(260, 150);
    stage.append(U.el('div', { class: 'canvas-box' }, img.c));
    let t = 300, sched = 'linear', T = 1000, seed = 1;
    U.slider(ctl, { label: 'Timestep t', min: 0, max: 999, value: t, onInput: (v) => { t = v; draw(); } });
    U.seg(ctl, [['linear', 'Linear β'], ['cosine', 'Cosine']], sched, (v) => { sched = v; draw(); });
    ctl.append(U.el('div', { class: 'canvas-label' }, 'ᾱ_t (signal kept)'), plot.c);
    const out = U.out(ctl);
    const abar = (tt) => { if (sched === 'cosine') { const f = (x) => Math.cos(((x / T + 0.008) / 1.008) * Math.PI / 2) ** 2; return f(tt) / f(0); } let a = 1; for (let i = 0; i <= tt; i++) a *= 1 - (1e-4 + (0.02 - 1e-4) * (i / (T - 1))); return a; };
    let eps;
    function draw() {
      const src = U.getRGB(U.scene(W, H)).data;
      if (!eps) { const r = U.rand(seed); eps = new Float32Array(W * H * 3).map(() => U.gauss(r)); }
      const ab = abar(t), sa = Math.sqrt(ab), sn = Math.sqrt(1 - ab), id = img.ctx.createImageData(W, H);
      for (let i = 0; i < W * H; i++) for (let ch = 0; ch < 3; ch++) { const x0 = src[i * 4 + ch] / 127.5 - 1; id.data[i * 4 + ch] = (sa * x0 + sn * eps[i * 3 + ch] + 1) * 127.5; id.data[i * 4 + 3] = 255; }
      img.ctx.putImageData(id, 0, 0);
      const g = plot.ctx; g.clearRect(0, 0, 260, 150);
      const pl = U.plot(g, 260, 150, { x0: 0, x1: 1000, y0: 0, y1: 1, xticks: 4, yticks: 2, fmtX: (v) => v.toFixed(0), pad: [6, 8, 20, 30] });
      const pts = []; for (let x = 0; x <= 1000; x += 20) pts.push([x, abar(Math.min(999, x))]);
      pl.line(pts, U.css('--accent'));
      g.fillStyle = U.css('--accent-3'); g.beginPath(); g.arc(pl.X(t), pl.Y(ab), 5, 0, 7); g.fill();
      out.innerHTML = `ᾱ_${t} = <b>${ab.toFixed(4)}</b>\nsignal √ᾱ = ${sa.toFixed(3)}   noise √(1−ᾱ) = ${sn.toFixed(3)}\nSNR = ${(ab / (1 - ab + 1e-9)).toExponential(2)}\n\nTraining: pick x₀, random t and ε, build x_t,\npredict ε, minimise ‖ε − ε_θ(x_t, t)‖².`;
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- reverse sampling animation ---------------- */
  CV.widget('diffusion-reverse', { title: 'Sampling: from pure noise to an image', desc: 'Starting at x_T ~ N(0, I), each step removes the predicted noise. Here an ideal denoiser that "knows" the target stands in for the network.' }, (body) => {
    const W = 200, H = 138;
    const row = U.el('div', { class: 'w-row', style: 'align-items:center' }); body.append(row);
    const img = U.pixCanvas(W, H, 320, false);
    row.append(U.el('div', { class: 'w-col canvas-box' }, img.c));
    const ctl = U.el('div', { class: 'w-col w-controls' }); row.append(ctl);
    let steps = 50, playing = true, k = 0, x, eps0, rnd;
    U.slider(ctl, { label: 'Sampling steps (DDIM-style)', min: 4, max: 200, value: steps, onInput: (v) => { steps = v; reset(); } });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, '↺ Sample again', () => reset(), 'btn btn-sm btn-primary');
    const out = U.out(ctl);
    const tgt = () => U.getRGB(U.scene(W, H)).data;
    let target;
    function reset() { rnd = U.rand(Math.floor(Math.random() * 1e6)); target = tgt(); x = new Float32Array(W * H * 3).map(() => U.gauss(rnd)); k = 0; playing = true; }
    reset();
    let acc = 0;
    U.loop(img.c, (dt) => {
      acc += dt;
      if (playing && acc > 1.6 / steps) {
        acc = 0;
        const t1 = 1 - k / steps, t2 = 1 - (k + 1) / steps, ab = (s) => Math.cos((s * Math.PI) / 2) ** 2;
        const a1 = ab(t1), a2 = ab(t2);
        for (let i = 0; i < W * H; i++) for (let ch = 0; ch < 3; ch++) {
          const x0 = target[i * 4 + ch] / 127.5 - 1, j = i * 3 + ch;
          const epsHat = (x[j] - Math.sqrt(a1) * x0) / Math.sqrt(Math.max(1e-6, 1 - a1));
          x[j] = Math.sqrt(a2) * x0 + Math.sqrt(1 - a2) * epsHat;
        }
        k++; if (k >= steps) playing = false;
      }
      const id = img.ctx.createImageData(W, H);
      for (let i = 0; i < W * H; i++) { for (let ch = 0; ch < 3; ch++) id.data[i * 4 + ch] = (x[i * 3 + ch] + 1) * 127.5; id.data[i * 4 + 3] = 255; }
      img.ctx.putImageData(id, 0, 0);
      out.innerHTML = `step <b>${k}</b> / ${steps}\nt = ${(1 - k / steps).toFixed(2)}·T\n\nDDPM: ~1000 steps. DDIM / DPM-Solver:\n20–50. Distilled / consistency: 1–4.`;
    });
  });

  /* ---------------- classifier-free guidance toy ---------------- */
  CV.widget('cfg', { title: 'Classifier-free guidance', desc: 'ε̂ = ε(x, ∅) + w·(ε(x, c) − ε(x, ∅)). Larger w pushes samples toward the prompt mode: more fidelity, less diversity.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 360, H = 260;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let w = 1;
    U.slider(ctl, { label: 'Guidance scale w', min: 0, max: 12, step: 0.1, value: w, onInput: (v) => { w = v; draw(); } });
    const out = U.out(ctl);
    const modes = [[110, 90, 'cat'], [250, 100, 'dog'], [180, 190, 'car']];
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const r = U.rand(3), target = modes[0];
      modes.forEach(([x, y, n], i) => { const g = ctx.createRadialGradient(x, y, 2, x, y, 60); g.addColorStop(0, i ? 'rgba(140,140,140,.35)' : 'rgba(224,122,95,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 60, 0, 7); ctx.fill(); ctx.fillStyle = U.css('--text-2'); ctx.font = '700 12px Inter'; ctx.textAlign = 'center'; ctx.fillText(n, x, y - 48); });
      let spread = 0;
      const pts = [];
      for (let i = 0; i < 70; i++) {
        const m = modes[Math.floor(r() * 3)], ux = m[0] + U.gauss(r) * 26, uy = m[1] + U.gauss(r) * 26;
        const cx = target[0] + U.gauss(r) * 26, cy = target[1] + U.gauss(r) * 26;
        const a = Math.min(1, w / 1.5), x = ux + (cx - ux) * a + (cx - target[0]) * Math.max(0, (w - 1.5) * 0.08) * -0.9, y = uy + (cy - uy) * a + (cy - target[1]) * Math.max(0, (w - 1.5) * 0.08) * -0.9;
        pts.push([x, y]);
      }
      const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      pts.forEach(([x, y]) => { spread += Math.hypot(x - mx, y - my); ctx.fillStyle = U.css('--accent'); ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); });
      const onTarget = pts.filter(([x, y]) => Math.hypot(x - target[0], y - target[1]) < 60).length / pts.length;
      out.innerHTML = `prompt: "a photo of a cat"\nsamples near "cat": <b>${(onTarget * 100).toFixed(0)}%</b>\ndiversity (mean spread): <b>${(spread / pts.length).toFixed(1)}</b>\n\nw = 0: unconditional. w ≈ 5–10 typical for\ntext-to-image; too high → over-saturated,\nless varied images.`;
    }
    draw();
  });

  /* ---------------- GAN 1D toy ---------------- */
  CV.widget('gan-1d', { title: 'A GAN in one dimension', desc: 'The generator\'s distribution (pink) chases the data distribution (cyan) while the discriminator (line) tries to tell them apart.' }, (body) => {
    const W = 640, H = 220;
    const { c, ctx } = U.canvas(W, H, { cssW: 640 });
    body.append(U.el('div', { class: 'canvas-box' }, c));
    const ctlRow = U.el('div', { class: 'w-row', style: 'margin-top:10px;align-items:center' }); body.append(ctlRow);
    let mu = -2.5, sg = 0.4, dW = 0, dB = 0, it = 0, collapse = false;
    U.check(ctlRow, 'Bimodal data (watch for mode collapse)', collapse, (v) => { collapse = v; mu = -2.5; sg = 0.4; it = 0; });
    U.button(ctlRow, '↺ Restart', () => { mu = -2.5; sg = 0.4; it = 0; dW = 0; dB = 0; });
    const dens = (x) => (collapse ? 0.5 * Math.exp(-((x - 0.5) ** 2) / 0.18) + 0.5 * Math.exp(-((x - 2.6) ** 2) / 0.18) : Math.exp(-((x - 1.5) ** 2) / 0.5));
    U.loop(c, (dt) => {
      it++;
      // discriminator: logistic on x and x²-ish, trained toward data
      const D = (x) => 1 / (1 + Math.exp(-(dW * (x - dB))));
      const target = collapse ? 1.55 : 1.5;
      dB += (((mu + target) / 2) - dB) * 0.05; dW += ((mu < target ? 2.5 : -2.5) - dW) * 0.05;
      mu += (target - mu) * 0.015 * (collapse ? 1 : 1) + (collapse ? (0.5 - mu) * 0.004 : 0);
      sg += ((collapse ? 0.25 : 0.55) - sg) * 0.01;
      ctx.clearRect(0, 0, W, H);
      const pl = U.plot(ctx, W, H, { x0: -4, x1: 5, y0: 0, y1: 1.15, xticks: 9, yticks: 2, fmtX: (v) => v.toFixed(0) });
      ctx.fillStyle = 'rgba(91,156,245,.25)'; ctx.beginPath(); ctx.moveTo(pl.X(-4), pl.Y(0)); for (let x = -4; x <= 5; x += 0.05) ctx.lineTo(pl.X(x), pl.Y(dens(x))); ctx.lineTo(pl.X(5), pl.Y(0)); ctx.fill();
      pl.fn(dens, U.css('--accent'), 2);
      pl.fn((x) => Math.exp(-((x - mu) ** 2) / (2 * sg * sg)), U.css('--accent-3'), 2.5);
      pl.fn(D, U.css('--warn'), 1.5, 200, [5, 4]);
      ctx.fillStyle = U.css('--text-2'); ctx.font = '12px Inter'; ctx.textAlign = 'left';
      ctx.fillText(`iteration ${it}   ${collapse && it > 200 ? '→ generator covers only ONE mode: mode collapse' : ''}`, 50, 18);
    });
  });

  /* ---------------- quantization ---------------- */
  CV.widget('quantize', { title: 'INT8 quantization', desc: 'q = clip(round(x/s) + z, −128, 127), x ≈ s·(q − z). Watch how outliers inflate the scale and hurt everyone else.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 240;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let bits = 8, outlier = 0, perChannel = false;
    U.slider(ctl, { label: 'Bits', min: 2, max: 8, value: bits, onInput: (v) => { bits = v; draw(); } });
    U.slider(ctl, { label: 'Outlier weight magnitude', min: 0, max: 10, step: 0.1, value: outlier, onInput: (v) => { outlier = v; draw(); } });
    U.check(ctl, 'Per-channel scales (2 channels)', perChannel, (v) => { perChannel = v; draw(); });
    const out = U.out(ctl);
    const r = U.rand(12), A = Array.from({ length: 300 }, () => U.gauss(r) * 0.5), B = Array.from({ length: 300 }, () => U.gauss(r) * 0.12);
    function draw() {
      const a = A.slice(); if (outlier) a[0] = outlier;
      const all = [...a, ...B], L = 2 ** (bits - 1) - 1;
      const sc = (arr) => Math.max(...arr.map(Math.abs)) / L;
      const sA = perChannel ? sc(a) : sc(all), sB = perChannel ? sc(B) : sc(all);
      const qd = (x, s) => Math.max(-L - 1, Math.min(L, Math.round(x / s))) * s;
      const err = (arr, s) => Math.sqrt(arr.reduce((acc, x) => acc + (x - qd(x, s)) ** 2, 0) / arr.length);
      ctx.clearRect(0, 0, W, H);
      const pl = U.plot(ctx, W, H, { x0: -1.6, x1: 1.6, y0: 0, y1: 1, xticks: 8, yticks: 1, grid: true, fmtY: () => '' });
      const hist = (arr, col, y0) => { const bins = new Array(64).fill(0); arr.forEach((x) => { const k = Math.floor(((x + 1.6) / 3.2) * 64); if (k >= 0 && k < 64) bins[k]++; }); const m = Math.max(...bins); bins.forEach((v, k) => { ctx.fillStyle = col; ctx.globalAlpha = 0.6; const x = pl.X(-1.6 + (k / 64) * 3.2), w = pl.X(-1.6 + 3.2 / 64) - pl.X(-1.6); ctx.fillRect(x, pl.Y(y0) - (v / m) * 70, w - 1, (v / m) * 70); }); ctx.globalAlpha = 1; };
      hist(a, U.css('--accent'), 0.55); hist(B, U.css('--accent-2'), 0.02);
      ctx.strokeStyle = U.css('--accent-3'); ctx.lineWidth = 1;
      for (let k = -L - 1; k <= L; k++) { const x = k * sB; if (x < -1.6 || x > 1.6) continue; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(pl.X(x), pl.Y(0.02)); ctx.lineTo(pl.X(x), pl.Y(0.02) + 8); ctx.stroke(); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = U.css('--text-2'); ctx.font = '11px Inter'; ctx.fillText('channel A (wide)', pl.X(-1.55), pl.Y(0.95)); ctx.fillText('channel B (narrow) · ticks = quantization levels', pl.X(-1.55), pl.Y(0.45));
      out.innerHTML = `levels: ${2 ** bits}\nscale A = ${sA.toExponential(2)}   scale B = ${sB.toExponential(2)}\nRMS error A = <b>${err(a, sA).toExponential(2)}</b>\nRMS error B = <b>${err(B, sB).toExponential(2)}</b>\n\nmodel size vs FP32: ${(32 / bits).toFixed(1)}× smaller\n${!perChannel && outlier > 2 ? '<span style="color:var(--warn)">One outlier stretched the shared scale: channel B lost most of its levels. Per-channel scales fix this.</span>' : ''}`;
    }
    draw();
  });

  /* ---------------- distillation temperature ---------------- */
  CV.widget('distill', { title: 'Knowledge distillation: softened targets', desc: 'Dividing teacher logits by T reveals "dark knowledge": which wrong classes are similar to the right one.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const names = ['husky', 'wolf', 'malamute', 'cat', 'car'], z = [8, 6.2, 5.8, 1.5, -2];
    let T = 1;
    U.slider(ctl, { label: 'Temperature T', min: 1, max: 10, step: 0.1, value: T, onInput: (v) => { T = v; draw(); } });
    const bars = U.el('div', { class: 'bars' }); stage.append(U.el('div', { class: 'canvas-label' }, 'teacher softmax(z / T)'), bars);
    const out = U.out(ctl);
    function draw() {
      const e = z.map((v) => Math.exp(v / T)), s = e.reduce((a, b) => a + b), p = e.map((v) => v / s);
      bars.innerHTML = p.map((v, i) => `<div class="bar-row"><span>${names[i]}</span><div class="track"><div class="fill" style="width:${v * 100}%"></div></div><span class="v">${(v * 100).toFixed(1)}%</span></div>`).join('');
      out.innerHTML = `L = α·CE(y, p_s) + (1 − α)·T²·KL(p_t^T ‖ p_s^T)\n\nAt T = 1 the teacher is almost one-hot.\nHigher T shows that "wolf" and "malamute"\nare much closer to "husky" than "car" is.\nT² keeps gradient scale comparable.`;
    }
    draw();
  });

  /* ---------------- latency budget ---------------- */
  CV.widget('latency', { title: 'Where the milliseconds go', desc: 'The model is only part of the latency. Tune each stage and see whether you hit your frame budget.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const st = { capture: 6, decode: 4, preprocess: 5, inference: 18, 'NMS + post': 4, tracking: 3, drawing: 3 };
    let fps = 30;
    U.slider(ctl, { label: 'Target FPS', min: 5, max: 120, value: fps, onInput: (v) => { fps = v; draw(); } });
    Object.keys(st).forEach((k) => U.slider(ctl, { label: k + ' (ms)', min: 0, max: 60, step: 0.5, value: st[k], onInput: (v) => { st[k] = v; draw(); } }));
    const bar = U.el('div', { style: 'display:flex;height:42px;border-radius:10px;overflow:hidden;border:1px solid var(--border)' });
    const legend = U.el('div', { style: 'display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;font-size:12px' });
    const out = U.out(stage);
    stage.prepend(bar, legend); out.style.marginTop = '14px';
    const pal = U.palette();
    function draw() {
      const tot = Object.values(st).reduce((a, b) => a + b, 0), budget = 1000 / fps;
      bar.innerHTML = Object.entries(st).map(([k, v], i) => `<div title="${k}" style="width:${(v / Math.max(tot, budget)) * 100}%;background:${pal[i % pal.length]};transition:width .3s"></div>`).join('') + (tot < budget ? `<div style="flex:1;background:repeating-linear-gradient(45deg,transparent 0 6px,rgba(76,175,125,.15) 6px 12px)"></div>` : '');
      legend.innerHTML = Object.keys(st).map((k, i) => `<span><span style="color:${pal[i % pal.length]}">■</span> ${k}</span>`).join('');
      out.innerHTML = `total: <b>${tot.toFixed(1)} ms</b>  →  ${(1000 / tot).toFixed(1)} FPS\nbudget at ${fps} FPS: ${budget.toFixed(1)} ms  ${tot <= budget ? '<span style="color:var(--ok)">✓ fits</span>' : '<span style="color:var(--bad)">✗ over by ' + (tot - budget).toFixed(1) + ' ms</span>'}\nmodel share: ${((st.inference / tot) * 100).toFixed(0)}%\n\nPipelining (capture ∥ infer ∥ post) raises\nthroughput toward 1000 / max(stage).`;
    }
    draw();
  });

  /* ---------------- pruning ---------------- */
  CV.widget('pruning', { title: 'Unstructured vs structured pruning', desc: 'Zero the smallest weights. Unstructured sparsity rarely speeds things up; removing whole channels (rows) does.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const R = 12, C = 16, r = U.rand(21);
    const Wt = Array.from({ length: R * C }, (_, i) => U.gauss(r) * (0.3 + (Math.floor(i / C) % 4 === 1 ? 0.1 : 1)));
    let amt = 0.4, mode = 'unstructured';
    const { c, ctx } = U.canvas(C * 22, R * 22);
    stage.append(U.el('div', { class: 'canvas-box', style: 'max-width:380px' }, c));
    U.seg(ctl, [['unstructured', 'Unstructured'], ['structured', 'Structured (rows)']], mode, (v) => { mode = v; draw(); });
    U.slider(ctl, { label: 'Prune amount', min: 0, max: 0.9, step: 0.05, value: amt, fmt: (v) => Math.round(v * 100) + '%', onInput: (v) => { amt = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      const keep = new Array(R * C).fill(true);
      if (mode === 'unstructured') { const thr = Wt.map(Math.abs).sort((a, b) => a - b)[Math.floor(amt * R * C)] ?? Infinity; Wt.forEach((w, i) => (keep[i] = Math.abs(w) >= thr)); }
      else { const norms = Array.from({ length: R }, (_, j) => [Math.hypot(...Wt.slice(j * C, j * C + C)), j]).sort((a, b) => a[0] - b[0]); norms.slice(0, Math.floor(amt * R)).forEach(([, j]) => { for (let i = 0; i < C; i++) keep[j * C + i] = false; }); }
      ctx.clearRect(0, 0, C * 22, R * 22);
      Wt.forEach((w, i) => { const x = (i % C) * 22, y = Math.floor(i / C) * 22, col = U.diverge(w / 1.5); ctx.fillStyle = keep[i] ? `rgb(${col})` : U.css('--surface-3'); ctx.globalAlpha = keep[i] ? 0.9 : 0.5; ctx.fillRect(x + 1, y + 1, 20, 20); });
      ctx.globalAlpha = 1;
      const kept = keep.filter(Boolean).length, rows = new Set(keep.map((k, i) => (k ? Math.floor(i / C) : -1))).size - (keep.includes(false) ? 0 : 0);
      out.innerHTML = `kept ${kept} / ${R * C} weights\n${mode === 'structured' ? `layer now has <b>${R - Math.floor(amt * R)}</b> output channels → a smaller dense matrix: directly faster` : 'same matrix shape, scattered zeros → needs sparse hardware/kernels to be faster'}\n\nAlways fine-tune after pruning. 30–50% of\nchannels can often go with small loss.`;
    }
    draw();
  });

  /* ---------------- FGSM ---------------- */
  CV.widget('fgsm', { title: 'Adversarial examples (FGSM)', desc: "x' = x + ε·sign(∇ₓL). A tiny, structured perturbation in every pixel adds up to a large change in the model's score." }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 220, H = 150;
    const a = U.pixCanvas(W, H, 240, false), n = U.pixCanvas(W, H, 240, false), b = U.pixCanvas(W, H, 240, false);
    stage.append(U.el('div', { class: 'w-row' }, ...[['x (clean)', a], ['sign(∇ₓL) pattern', n], ["x' = x + ε·sign(∇)", b]].map(([t, p]) => U.el('div', { class: 'w-col', style: 'flex-basis:120px' }, U.el('div', { class: 'canvas-label' }, t), p.c))));
    let eps = 2;
    U.slider(ctl, { label: 'ε (in 0–255 units)', min: 0, max: 16, step: 0.5, value: eps, onInput: (v) => { eps = v; draw(); } });
    const bars = U.el('div', { class: 'bars' }); ctl.append(bars);
    const out = U.out(ctl);
    const r = U.rand(99), grad = new Float32Array(W * H * 3).map(() => (r() < 0.5 ? -1 : 1));
    function draw() {
      const src = U.getRGB(U.scene(W, H));
      a.ctx.putImageData(src, 0, 0);
      const nid = n.ctx.createImageData(W, H), bid = b.ctx.createImageData(W, H);
      let dot = 0;
      for (let i = 0; i < W * H; i++) for (let ch = 0; ch < 3; ch++) { const g = grad[i * 3 + ch]; nid.data[i * 4 + ch] = g > 0 ? 255 : 0; bid.data[i * 4 + ch] = src.data[i * 4 + ch] + eps * g; dot += eps * g * g; }
      for (let i = 0; i < W * H; i++) nid.data[i * 4 + 3] = bid.data[i * 4 + 3] = 255;
      n.ctx.putImageData(nid, 0, 0); b.ctx.putImageData(bid, 0, 0);
      const shift = (dot / 255) * 0.0004;
      const z = [3.2 - shift, 1.0 + shift * 1.15, 0.4], e = z.map(Math.exp), s = e.reduce((x, y) => x + y), p = e.map((x) => x / s);
      bars.innerHTML = ['road', 'ostrich', 'tree'].map((nm, i) => `<div class="bar-row"><span>${nm}</span><div class="track"><div class="fill" style="width:${p[i] * 100}%;${i === 1 && p[1] > p[0] ? 'background:var(--bad)' : ''}"></div></div><span class="v">${(p[i] * 100).toFixed(0)}%</span></div>`).join('');
      out.innerHTML = `max pixel change: ${eps} / 255 (${((eps / 255) * 100).toFixed(1)}%)\nchange in logit ∝ ε · ‖∇‖₁ over ${U.fmtInt(W * H * 3)} values\n${p[1] > p[0] ? '<span style="color:var(--bad)">prediction flipped, image looks the same</span>' : ''}\n<small>Illustrative linear model; real attacks use the network's true gradient.</small>`;
    }
    draw();
    return U.onImage(draw);
  });

  /* ---------------- calibration ---------------- */
  CV.widget('calibration', { title: 'Calibration and temperature scaling', desc: 'A reliability diagram compares confidence with accuracy. Divide logits by T to fix over-confidence.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 340, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box', style: 'max-width:360px' }, c));
    let T = 1;
    U.slider(ctl, { label: 'Temperature T', min: 0.5, max: 3, step: 0.05, value: T, onInput: (v) => { T = v; draw(); } });
    const out = U.out(ctl);
    const r = U.rand(31), samples = Array.from({ length: 2000 }, () => { const m = U.gauss(r) * 2.2 + 2.6; const pTrue = 1 / (1 + Math.exp(-m / 1.8)); return [m, r() < pTrue]; });
    function draw() {
      const bins = Array.from({ length: 10 }, () => [0, 0, 0]);
      samples.forEach(([m, ok]) => { const p = 1 / (1 + Math.exp(-m / T)), conf = Math.max(p, 1 - p), correct = p >= 0.5 ? ok : !ok, k = Math.min(9, Math.floor(conf * 10)); bins[k][0]++; bins[k][1] += correct; bins[k][2] += conf; });
      ctx.clearRect(0, 0, W, H);
      const pl = U.plot(ctx, W, H, { x0: 0, x1: 1, y0: 0, y1: 1, xticks: 5, yticks: 5, xlabel: 'confidence', ylabel: 'accuracy' });
      pl.fn((x) => x, U.css('--text-3'), 1, 2, [4, 4]);
      let ece = 0;
      bins.forEach(([n, cor, cs], k) => { if (!n) return; const acc = cor / n, conf = cs / n; ece += (n / samples.length) * Math.abs(acc - conf); const x0 = pl.X(k / 10), x1 = pl.X((k + 1) / 10); ctx.fillStyle = 'rgba(91,156,245,.6)'; ctx.fillRect(x0 + 1, pl.Y(acc), x1 - x0 - 2, pl.Y(0) - pl.Y(acc)); ctx.fillStyle = 'rgba(229,96,77,.35)'; if (conf > acc) ctx.fillRect(x0 + 1, pl.Y(conf), x1 - x0 - 2, pl.Y(acc) - pl.Y(conf)); });
      out.innerHTML = `ECE = <b>${(ece * 100).toFixed(2)}%</b>\n${T < 1.4 ? 'red gap = over-confidence' : T > 2.2 ? 'now under-confident' : '<span style="color:var(--ok)">close to calibrated</span>'}\n\nFit one scalar T on validation data;\naccuracy is unchanged (argmax is the same).`;
    }
    draw();
  });

  /* ---------------- Grad-CAM (illustrative) ---------------- */
  CV.widget('gradcam', { title: 'Grad-CAM, illustrated', desc: 'Heatmap = ReLU(Σₖ αₖ·Aᵏ), with αₖ the average gradient of the class score over feature map k. Pick the class to explain.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 320, H = 220;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let cls = 'car', res = 7, alpha = 0.55;
    U.seg(ctl, [['car', '"car"'], ['house', '"house"'], ['tree', '"tree"'], ['shortcut', '"wolf" (snow shortcut)']], cls, (v) => { cls = v; draw(); });
    U.slider(ctl, { label: 'Feature-map resolution', min: 4, max: 28, value: res, fmt: (v) => v + '×' + v, onInput: (v) => { res = v; draw(); } });
    U.slider(ctl, { label: 'Overlay opacity', min: 0, max: 1, step: 0.01, value: alpha, onInput: (v) => { alpha = v; draw(); } });
    const out = U.out(ctl);
    const centers = { car: [[199, 192, 30]], house: [[63, 125, 45]], tree: [[272, 115, 35]], shortcut: [[60, 40, 70], [160, 30, 60]] };
    function draw() {
      ctx.drawImage(U.defaultScene(W, H), 0, 0);
      const g = document.createElement('canvas'); g.width = res; g.height = Math.round(res * H / W);
      const gx = g.getContext('2d'), id = gx.createImageData(g.width, g.height);
      for (let j = 0; j < g.height; j++) for (let i = 0; i < g.width; i++) {
        const x = ((i + 0.5) / g.width) * W, y = ((j + 0.5) / g.height) * H;
        let v = 0; centers[cls].forEach(([cx, cy, r]) => (v = Math.max(v, Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * r * r)))));
        const col = U.magma(v); id.data.set([...col, Math.round(255 * v * alpha)], (j * g.width + i) * 4);
      }
      gx.putImageData(id, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(g, 0, 0, W, H);
      out.innerHTML = cls === 'shortcut' ? `<span style="color:var(--warn)">The "wolf" evidence is in the sky/snow region,\nnot on any animal: a shortcut. Saliency maps\nhelp catch this, but they are sanity checks,\nnot proofs.</span>` : `class "${cls}": heat concentrates on the object.\nLast conv layer is ${res}×${res}, so the map is\ncoarse and upsampled bilinearly.`;
    }
    draw();
  });
})();
