/* Widgets for Chapter 11 (segmentation) and Chapter 12 (tracking, faces, pose, video, 3D) */
(function () {
  'use strict';
  const U = CV.util;

  Object.assign(CV.DIAGRAMS, {
    unet: {
      name: 'U-Net', w: 760, h: 330,
      caption: 'Contracting encoder (left), bottleneck, expanding decoder (right). The dashed skip connections copy encoder features across and concatenate them into the decoder: "what" from depth plus "where" from early layers.',
      nodes: {
        e1: [20, 30, 120, 40, 'enc 1', 0, '64 · H'], e2: [60, 100, 120, 40, 'enc 2', 0, '128 · H/2'], e3: [100, 170, 120, 40, 'enc 3', 0, '256 · H/4'], e4: [140, 240, 120, 40, 'enc 4', 0, '512 · H/8'],
        bn: [315, 270, 130, 44, 'bottleneck', 2, '1024 · H/16'],
        d4: [500, 240, 120, 40, 'dec 4', 1, '512'], d3: [540, 170, 120, 40, 'dec 3', 1, '256'], d2: [580, 100, 120, 40, 'dec 2', 1, '128'], d1: [620, 30, 120, 40, 'dec 1', 1, '64 → 1×1 conv'],
      },
      edges: [['e1', 'e2', { label: 'pool' }], ['e2', 'e3'], ['e3', 'e4'], ['e4', 'bn'], ['bn', 'd4', { label: 'up-conv' }], ['d4', 'd3'], ['d3', 'd2'], ['d2', 'd1'],
        ['e1', 'd1', { c: 4, dash: 1, label: 'copy + concat' }], ['e2', 'd2', { c: 4, dash: 1 }], ['e3', 'd3', { c: 4, dash: 1 }], ['e4', 'd4', { c: 4, dash: 1 }]],
      tips: { bn: 'lowest resolution, widest context', d1: '1×1 conv to n classes (sigmoid for binary)', e1: 'two 3×3 convs + ReLU, then 2×2 max pool' },
    },
    aspp: {
      name: 'DeepLab ASPP', w: 700, h: 300,
      caption: 'Atrous Spatial Pyramid Pooling: parallel branches with different dilation rates plus an image-level pooling branch see context at several scales; their outputs are concatenated and fused by a 1×1 conv.',
      nodes: { f: [20, 125, 110, 50, 'backbone\nfeatures', 0], b1: [200, 15, 150, 38, '1×1 conv', 1], b2: [200, 70, 150, 38, '3×3, rate 6', 1], b3: [200, 125, 150, 38, '3×3, rate 12', 1], b4: [200, 180, 150, 38, '3×3, rate 18', 1], b5: [200, 235, 150, 38, 'image pooling', 3], cat: [420, 125, 100, 50, 'concat\n+ 1×1', 2], dec: [570, 125, 110, 50, 'decoder\n(v3+)', 4] },
      edges: [['f', 'b1'], ['f', 'b2'], ['f', 'b3'], ['f', 'b4'], ['f', 'b5'], ['b1', 'cat'], ['b2', 'cat'], ['b3', 'cat'], ['b4', 'cat'], ['b5', 'cat'], ['cat', 'dec']],
    },
    maskrcnn: {
      name: 'Mask R-CNN', w: 700, h: 220,
      caption: 'Faster R-CNN plus a third parallel branch: a small FCN predicting a 28×28 binary mask per class for each RoI. RoI Align (no rounding) is essential for accurate masks. The box branch decides the class; the mask branch only decides the shape.',
      nodes: { bb: [20, 85, 110, 50, 'backbone\n+ FPN + RPN', 0], ra: [170, 85, 110, 50, 'RoI Align', 3, '14×14 / 7×7'], cls: [340, 15, 140, 44, 'class', 1], box: [340, 88, 140, 44, 'box', 1], mask: [340, 160, 140, 44, 'mask FCN', 2, '28×28 per class'], out: [540, 88, 140, 44, 'instances', 4] },
      edges: [['bb', 'ra'], ['ra', 'cls'], ['ra', 'box'], ['ra', 'mask', { c: 2 }], ['cls', 'out'], ['box', 'out'], ['mask', 'out', { c: 2 }]],
    },
  });

  /* ---------------- IoU vs Dice on masks ---------------- */
  CV.widget('iou-dice', { title: 'Mask IoU and Dice', desc: 'Drag the predicted blob over the ground-truth mask. Dice = 2·IoU / (1 + IoU) is always ≥ IoU.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 300, H = 220;
    const { c, ctx } = U.pixCanvas(W, H, 380, false);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const curve = U.canvas(220, 150);
    let P = [170, 120], r = 55, drag = false;
    U.slider(ctl, { label: 'Prediction radius', min: 20, max: 100, value: r, onInput: (v) => { r = v; draw(); } });
    const out = U.out(ctl);
    ctl.append(U.el('div', { class: 'canvas-label' }, 'Dice vs IoU'), curve.c);
    const inGT = (x, y) => ((x - 130) / 70) ** 2 + ((y - 110) / 55) ** 2 < 1 || (x > 150 && x < 200 && y > 60 && y < 160);
    function draw() {
      const id = ctx.createImageData(W, H); let TP = 0, FP = 0, FN = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const g = inGT(x, y), p = (x - P[0]) ** 2 + (y - P[1]) ** 2 < r * r, k = (y * W + x) * 4;
        if (g && p) TP++; else if (p) FP++; else if (g) FN++;
        id.data.set(g && p ? [52, 211, 153, 255] : p ? [251, 191, 36, 255] : g ? [248, 113, 113, 255] : [18, 18, 18, 255], k);
      }
      ctx.putImageData(id, 0, 0);
      const iou = TP / (TP + FP + FN || 1), dice = (2 * TP) / (2 * TP + FP + FN || 1);
      out.innerHTML = `<span style="color:#4caf7d">■ TP</span> ${TP}  <span style="color:#d4a73a">■ FP</span> ${FP}  <span style="color:#e5604d">■ FN</span> ${FN}\n\nIoU  = TP/(TP+FP+FN) = <b>${iou.toFixed(3)}</b>\nDice = 2TP/(2TP+FP+FN) = <b>${dice.toFixed(3)}</b>\ncheck: 2·IoU/(1+IoU) = ${((2 * iou) / (1 + iou)).toFixed(3)}`;
      const g = curve.ctx; g.clearRect(0, 0, 220, 150);
      const pl = U.plot(g, 220, 150, { x0: 0, x1: 1, y0: 0, y1: 1, xticks: 2, yticks: 2, xlabel: 'IoU', pad: [6, 6, 22, 30] });
      pl.fn((x) => x, U.css('--text-3'), 1, 2, [3, 3]); pl.fn((x) => (2 * x) / (1 + x), U.css('--accent-2'));
      g.fillStyle = U.css('--accent-3'); g.beginPath(); g.arc(pl.X(iou), pl.Y(dice), 5, 0, 7); g.fill();
    }
    c.style.cursor = 'grab';
    c.addEventListener('pointerdown', () => (drag = true));
    c.addEventListener('pointermove', (e) => { if (!drag) return; const p = U.mouse(c, e); P = [p.x, p.y]; draw(); });
    addEventListener('pointerup', () => (drag = false));
    draw();
  });

  /* ---------------- atrous convolution ---------------- */
  CV.widget('atrous', { title: 'Atrous (dilated) convolution', desc: 'Same 9 weights, wider view. Rate r inserts r−1 gaps between kernel taps.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 340, H = 340;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box', style: 'max-width:360px' }, c));
    let r = 2;
    U.slider(ctl, { label: 'Dilation rate r', min: 1, max: 6, value: r, onInput: (v) => { r = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      const N = 17, cs = W / N, cx = 8, cy = 8;
      ctx.clearRect(0, 0, W, H);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { ctx.fillStyle = U.css('--surface-3'); ctx.fillRect(i * cs + 1, j * cs + 1, cs - 2, cs - 2); }
      const span = 2 * r + 1;
      ctx.fillStyle = 'rgba(91,156,245,.12)'; ctx.fillRect((cx - r) * cs, (cy - r) * cs, span * cs, span * cs);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { ctx.fillStyle = a || b ? U.css('--accent') : U.css('--accent-3'); ctx.fillRect((cx + b * r) * cs + 2, (cy + a * r) * cs + 2, cs - 4, cs - 4); }
      out.innerHTML = `taps: 9 (always)\nfield covered: <b>${span} × ${span}</b>\neffective kernel = r(K−1) + 1 = ${r * 2 + 1}\n\nDeepLab keeps feature maps large and uses\natrous convs to keep the receptive field big.\nASPP runs rates 6, 12, 18 in parallel.`;
    }
    draw();
  });

  /* ---------------- transposed conv checkerboard ---------------- */
  CV.widget('upsample', { title: 'Upsampling and the checkerboard artefact', desc: 'A transposed convolution spreads each input pixel over a K×K patch every S pixels. When K is not divisible by S, some outputs receive more contributions than others.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 360, H = 200;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let K = 3, S = 2;
    U.slider(ctl, { label: 'Kernel size K', min: 2, max: 6, value: K, onInput: (v) => { K = v; draw(); } });
    U.slider(ctl, { label: 'Stride S', min: 1, max: 3, value: S, onInput: (v) => { S = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      const n = 8, N = (n - 1) * S + K, cnt = new Array(N * N).fill(0);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) for (let a = 0; a < K; a++) for (let b = 0; b < K; b++) cnt[(y * S + a) * N + x * S + b]++;
      const mx = Math.max(...cnt), cs = Math.min(W, H) / N;
      ctx.clearRect(0, 0, W, H);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = cnt[j * N + i] / mx, col = U.magma(v); ctx.fillStyle = `rgb(${col})`; ctx.fillRect((W - N * cs) / 2 + i * cs, j * cs, cs - 0.5, cs - 0.5); }
      const even = K % S === 0;
      out.innerHTML = `overlap counts (bright = more)\nmin ${Math.min(...cnt.slice(N * (K) + K, N * (N - K)))}, max ${mx}\n${even ? '<span style="color:var(--ok)">K divisible by S → uniform interior ✓</span>' : '<span style="color:var(--bad)">uneven overlap → checkerboard pattern</span>'}\n\nAlternatives: bilinear/nearest upsample + conv,\npixel shuffle, or max-unpooling (SegNet).`;
    }
    draw();
  });

  /* ---------------- YOLACT prototype masks ---------------- */
  CV.widget('proto-masks', { title: 'Prototype masks + coefficients (YOLACT / YOLO-seg)', desc: 'The network predicts a few prototype masks for the whole image, and per detection a coefficient vector. Instance mask = sigmoid(Σ cᵢ·Pᵢ), cropped to the box.' }, (body) => {
    const S = 96;
    const protos = [
      (x, y) => (x < 0.5 ? 1 : -1),
      (x, y) => (y < 0.55 ? 1 : -1),
      (x, y) => 1 - 2 * Math.hypot(x - 0.65, y - 0.6) * 2.2,
      (x, y) => Math.sin(x * 9) * Math.cos(y * 7),
    ];
    let coef = [0.4, 0.8, 1.6, 0], box = [0.4, 0.3, 0.92, 0.9];
    const row = U.el('div', { style: 'display:grid;grid-template-columns:repeat(4,1fr) 1.4fr;gap:10px;align-items:end' }); body.append(row);
    const pcs = protos.map((f, i) => { const p = U.pixCanvas(S, S, 120); const id = p.ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const v = f(x / S, y / S), col = U.diverge(v); id.data.set([...col, 255], (y * S + x) * 4); } p.ctx.putImageData(id, 0, 0); row.append(U.el('div', {}, U.el('div', { class: 'canvas-label' }, 'P' + (i + 1)), p.c)); return p; });
    const res = U.pixCanvas(S, S, 180); row.append(U.el('div', {}, U.el('div', { class: 'canvas-label' }, 'instance mask'), res.c));
    const ctl = U.el('div', { class: 'w-row', style: 'margin-top:14px' }); body.append(ctl);
    coef.forEach((v, i) => { const col = U.el('div', { class: 'w-col', style: 'flex-basis:150px' }); ctl.append(col); U.slider(col, { label: `c${i + 1}`, min: -3, max: 3, step: 0.05, value: v, onInput: (x) => { coef[i] = x; draw(); } }); });
    let crop = true; U.check(ctl, 'Crop to box', crop, (v) => { crop = v; draw(); });
    function draw() {
      const id = res.ctx.createImageData(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const u = x / S, v = y / S; let z = 0; protos.forEach((f, i) => (z += coef[i] * f(u, v)));
        let m = 1 / (1 + Math.exp(-z * 2));
        const inBox = u > box[0] && u < box[2] && v > box[1] && v < box[3];
        if (crop && !inBox) m = 0;
        id.data.set([20 + m * 224, 30 + m * 184, 50 + m * 132, 255], (y * S + x) * 4);
      }
      res.ctx.putImageData(id, 0, 0);
      res.ctx.strokeStyle = '#5b9cf5'; res.ctx.lineWidth = 1; res.ctx.strokeRect(box[0] * S, box[1] * S, (box[2] - box[0]) * S, (box[3] - box[1]) * S);
    }
    draw();
    body.append(U.el('div', { class: 'w-note', html: 'Real models use about 32 prototypes. Because the mask is a linear combination, it is very cheap per detection, which is why YOLO-seg is fast.' }));
  });

  /* ---------------- multi-object tracking ---------------- */
  CV.widget('tracking', { title: 'Tracking-by-detection', desc: 'Objects cross paths and pass behind an occluder. Constant-velocity prediction + IoU matching keeps IDs; ByteTrack also uses low-confidence detections.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 480, H = 280;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let useMotion = true, byte = true, occl = true;
    U.check(ctl, 'Use motion prediction (Kalman-style)', useMotion, (v) => { useMotion = v; reset(); });
    U.check(ctl, 'Second pass with low-confidence detections (ByteTrack)', byte, (v) => { byte = v; reset(); });
    U.check(ctl, 'Occluder (lowers detection confidence)', occl, (v) => { occl = v; reset(); });
    U.button(ctl, '↺ Restart', () => reset());
    const out = U.out(ctl);
    let objs, tracks, nextId, switches, frame, rnd;
    const pal = ['#5b9cf5', '#e07a5f', '#d4a73a', '#4caf7d', '#9d8fd6', '#fb923c', '#60a5fa', '#e5604d'];
    function reset() {
      rnd = U.rand(3);
      objs = [{ x: 30, y: 60, vx: 1.6, vy: 0.55, gt: 0 }, { x: 440, y: 70, vx: -1.5, vy: 0.5, gt: 1 }, { x: 40, y: 220, vx: 1.4, vy: -0.45, gt: 2 }, { x: 430, y: 210, vx: -1.3, vy: -0.4, gt: 3 }];
      tracks = []; nextId = 1; switches = 0; frame = 0;
    }
    reset();
    const box = (o) => [o.x - 16, o.y - 22, o.x + 16, o.y + 22];
    let acc = 0;
    U.loop(c, (dt) => {
      acc += dt;
      while (acc > 1 / 30) {
        acc -= 1 / 30; frame++;
        objs.forEach((o) => { o.x += o.vx; o.y += o.vy; if (o.x < 20 || o.x > W - 20) o.vx *= -1; if (o.y < 25 || o.y > H - 25) o.vy *= -1; });
        const dets = objs.map((o) => { const inOcc = occl && o.x > 200 && o.x < 280; return { b: box(o).map((v) => v + (rnd() - 0.5) * 4), conf: inOcc ? 0.15 + rnd() * 0.15 : 0.7 + rnd() * 0.3, gt: o.gt }; });
        tracks.forEach((t) => { if (useMotion) { t.b = t.b.map((v, i) => v + (i % 2 ? t.vy : t.vx)); } t.age++; });
        const match = (cands, pool) => {
          const pairs = [];
          cands.forEach((d, di) => pool.forEach((t, ti) => { const o = U.iou(d.b, t.b); if (o > 0.15) pairs.push([o, di, ti]); }));
          pairs.sort((a, b) => b[0] - a[0]);
          const ud = new Set(), ut = new Set();
          pairs.forEach(([, di, ti]) => { if (ud.has(di) || ut.has(ti)) return; ud.add(di); ut.add(ti); const d = cands[di], t = pool[ti]; const ncx = (d.b[0] + d.b[2]) / 2, ocx = (t.b[0] + t.b[2]) / 2, ncy = (d.b[1] + d.b[3]) / 2, ocy = (t.b[1] + t.b[3]) / 2; t.vx = 0.7 * t.vx + 0.3 * (ncx - ocx + (useMotion ? t.vx : 0)); t.vy = 0.7 * t.vy + 0.3 * (ncy - ocy + (useMotion ? t.vy : 0)); t.b = d.b; t.age = 0; if (t.gt !== d.gt) { switches++; t.gt = d.gt; } });
          return [cands.filter((_, i) => !ud.has(i)), pool.filter((_, i) => !ut.has(i))];
        };
        const high = dets.filter((d) => d.conf >= 0.5), low = dets.filter((d) => d.conf < 0.5);
        let [unD, unT] = match(high, tracks);
        if (byte) [, unT] = match(low, unT);
        unD.forEach((d) => tracks.push({ id: nextId++, b: d.b, vx: 0, vy: 0, age: 0, gt: d.gt }));
        tracks = tracks.filter((t) => t.age < 25);
        dets.forEach((d) => (d.show = true)); c.dets = dets;
      }
      ctx.clearRect(0, 0, W, H);
      if (occl) { ctx.fillStyle = 'rgba(140,140,140,.25)'; ctx.fillRect(200, 0, 80, H); ctx.fillStyle = U.css('--text-3'); ctx.font = '11px Inter'; ctx.fillText('occluder', 216, 14); }
      (c.dets || []).forEach((d) => { ctx.strokeStyle = d.conf >= 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.18)'; ctx.setLineDash(d.conf >= 0.5 ? [] : [3, 3]); ctx.lineWidth = 1; ctx.strokeRect(d.b[0], d.b[1], d.b[2] - d.b[0], d.b[3] - d.b[1]); ctx.setLineDash([]); });
      tracks.forEach((t) => { if (t.age > 0) ctx.globalAlpha = 0.4; const col = pal[(t.id - 1) % pal.length]; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.strokeRect(t.b[0], t.b[1], t.b[2] - t.b[0], t.b[3] - t.b[1]); ctx.fillStyle = col; ctx.fillRect(t.b[0], t.b[1] - 16, 34, 16); ctx.fillStyle = '#000'; ctx.font = 'bold 11px Inter'; ctx.fillText('ID ' + t.id, t.b[0] + 3, t.b[1] - 4); ctx.globalAlpha = 1; });
      out.innerHTML = `frame ${frame}\ntrue objects: 4\nIDs created: <b>${nextId - 1}</b> ${nextId - 1 > 4 ? '(extra IDs = broken tracks)' : '✓'}\nidentity switches: <b>${switches}</b>\n\nsolid = high-conf detection, dashed = low-conf`;
    });
  });

  /* ---------------- ArcFace angular margin ---------------- */
  CV.widget('arcface', { title: 'ArcFace: an angular margin on the hypersphere', desc: 'Embeddings are normalised, so logits are cosines. Adding margin m to the true-class angle forces tighter, better-separated clusters.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 340, H = 340;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box', style: 'max-width:360px' }, c));
    let m = 0.5, s = 64, th = 0.6;
    U.slider(ctl, { label: 'Margin m (radians)', min: 0, max: 0.8, step: 0.01, value: m, onInput: (v) => { m = v; draw(); } });
    U.slider(ctl, { label: 'Sample angle to its class θ_y', min: 0, max: 1.4, step: 0.01, value: th, onInput: (v) => { th = v; draw(); } });
    const out = U.out(ctl);
    const centers = [0.3, 2.3, 4.2];
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, R = 130, pal = U.palette();
      ctx.strokeStyle = U.css('--border-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      const rnd = U.rand(2);
      centers.forEach((a, k) => {
        const spread = 0.55 - m * 0.5;
        ctx.fillStyle = pal[k]; ctx.globalAlpha = 0.15; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a - spread, a + spread); ctx.fill(); ctx.globalAlpha = 1;
        for (let i = 0; i < 14; i++) { const t = a + U.gauss(rnd) * spread * 0.45; ctx.fillStyle = pal[k]; ctx.beginPath(); ctx.arc(cx + Math.cos(t) * R, cy + Math.sin(t) * R, 4, 0, 7); ctx.fill(); }
        ctx.strokeStyle = pal[k]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 1.12, cy + Math.sin(a) * R * 1.12); ctx.stroke();
        ctx.fillStyle = pal[k]; ctx.font = '700 12px Inter'; ctx.fillText('W' + (k + 1), cx + Math.cos(a) * R * 1.2 - 8, cy + Math.sin(a) * R * 1.2 + 4);
      });
      const a = centers[0] + th;
      ctx.strokeStyle = '#fff'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 6, 0, 7); ctx.fill();
      ctx.strokeStyle = U.css('--warn'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 40, centers[0], a); ctx.stroke();
      ctx.strokeStyle = U.css('--bad'); ctx.beginPath(); ctx.arc(cx, cy, 52, a, a + m); ctx.stroke();
      const others = centers.slice(1).map((cc) => Math.cos(Math.abs(((a - cc + Math.PI * 3) % (Math.PI * 2)) - Math.PI)));
      const lt = s * Math.cos(th + m), lo = others.map((v) => s * v), L = -Math.log(Math.exp(lt) / (Math.exp(lt) + lo.reduce((x, v) => x + Math.exp(v), 0)));
      out.innerHTML = `<span style="color:var(--warn)">θ_y</span> = ${th.toFixed(2)}   <span style="color:var(--bad)">+ m</span> = ${m.toFixed(2)}\ntrue logit s·cos(θ_y + m) = <b>${lt.toFixed(1)}</b>\nwithout margin: ${(s * Math.cos(th)).toFixed(1)}\nloss = <b>${L.toFixed(3)}</b>  (s = 64)\n\nThe margin makes the task harder in training,\nso identities must cluster tighter.`;
    }
    draw();
  });

  /* ---------------- pose heatmaps ---------------- */
  CV.widget('pose', { title: 'Keypoints as heatmaps', desc: '17 COCO keypoints. Most models regress one Gaussian heatmap per keypoint; the prediction is the peak. Click a joint.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 300, H = 340;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box', style: 'max-width:320px' }, c));
    const K = { nose: [150, 50], 'left eye': [140, 42], 'right eye': [160, 42], 'left ear': [128, 48], 'right ear': [172, 48], 'left shoulder': [115, 95], 'right shoulder': [185, 95], 'left elbow': [92, 145], 'right elbow': [210, 140], 'left wrist': [80, 190], 'right wrist': [240, 115], 'left hip': [127, 190], 'right hip': [173, 190], 'left knee': [120, 255], 'right knee': [185, 250], 'left ankle': [115, 318], 'right ankle': [200, 312] };
    const names = Object.keys(K);
    const E = [['left shoulder', 'right shoulder'], ['left shoulder', 'left elbow'], ['left elbow', 'left wrist'], ['right shoulder', 'right elbow'], ['right elbow', 'right wrist'], ['left shoulder', 'left hip'], ['right shoulder', 'right hip'], ['left hip', 'right hip'], ['left hip', 'left knee'], ['left knee', 'left ankle'], ['right hip', 'right knee'], ['right knee', 'right ankle'], ['nose', 'left eye'], ['nose', 'right eye'], ['left eye', 'left ear'], ['right eye', 'right ear']];
    let sel = 'right wrist', sigma = 10, showAll = false;
    U.slider(ctl, { label: 'Heatmap σ (px)', min: 3, max: 25, value: sigma, onInput: (v) => { sigma = v; draw(); } });
    U.check(ctl, 'Show all 17 heatmaps summed', showAll, (v) => { showAll = v; draw(); });
    const out = U.out(ctl);
    function draw() {
      const sw = c.width, sh = c.height, kx0 = sw / W;
      const id = ctx.createImageData(sw, sh);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (let y = 0; y < sh; y += 2) for (let x = 0; x < sw; x += 2) {
        let v = 0; const px = x / kx0, py = y / kx0;
        (showAll ? names : [sel]).forEach((n) => { const [kx, ky] = K[n]; v = Math.max(v, Math.exp(-((px - kx) ** 2 + (py - ky) ** 2) / (2 * sigma * sigma))); });
        const col = U.magma(v * 0.9);
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (x + b < sw && y + a < sh) id.data.set([...col, 255], ((y + a) * sw + x + b) * 4);
      }
      ctx.putImageData(id, 0, 0); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      E.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...K[a]); ctx.lineTo(...K[b]); ctx.stroke(); });
      names.forEach((n) => { ctx.fillStyle = n === sel ? '#5b9cf5' : '#fff'; ctx.beginPath(); ctx.arc(K[n][0], K[n][1], n === sel ? 7 : 4.5, 0, 7); ctx.fill(); });
      out.innerHTML = `selected: <b>${sel}</b>\ntarget: 2D Gaussian centred on the joint\nprediction: argmax (+ sub-pixel refinement)\n\nTop-down: detect person → crop → heatmaps\nBottom-up: all keypoints → group (OpenPose)\nMetric: OKS, AP over OKS thresholds`;
    }
    c.addEventListener('click', (e) => { const p = U.mouse(c, e); let best = sel, bd = 1e9; names.forEach((n) => { const d = Math.hypot(K[n][0] - p.x, K[n][1] - p.y); if (d < bd) { bd = d; best = n; } }); sel = best; draw(); });
    c.style.cursor = 'pointer';
    draw();
  });

  /* ---------------- PointNet order invariance ---------------- */
  CV.widget('pointnet', { title: 'Why PointNet uses max-pooling', desc: 'A point cloud is an unordered set. A shared per-point MLP followed by a symmetric max gives the same global feature for any ordering.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 320, H = 200;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const rnd = U.rand(8);
    let pts = Array.from({ length: 10 }, () => [rnd() * 2 - 1, rnd() * 2 - 1]);
    const feat = ([x, y]) => [Math.max(0, x + y), Math.max(0, x - y), Math.max(0, -x + 0.5 * y), Math.max(0, y * 0.8 - 0.2)];
    const out = U.out(ctl);
    U.button(ctl, '🔀 Shuffle point order', () => { pts = pts.sort(() => Math.random() - 0.5); draw(); }, 'btn btn-sm btn-primary');
    function draw() {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(([x, y], i) => { const px = 60 + x * 50, py = 100 + y * 70; ctx.fillStyle = U.css('--accent'); ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center'; ctx.fillText(i, px, py + 3.5); });
      const fs = pts.map(feat), mx = [0, 1, 2, 3].map((k) => Math.max(...fs.map((f) => f[k]))), first = fs[0];
      ctx.textAlign = 'left'; ctx.fillStyle = U.css('--text-2'); ctx.font = '12px JetBrains Mono';
      ctx.fillText('per-point order: ' + pts.slice(0, 4).map((p) => p[0].toFixed(1)).join(', ') + '…', 140, 40);
      out.innerHTML = `global feature = max over points of MLP(p)\n= [${mx.map((v) => v.toFixed(3)).join(', ')}]\n\n(unchanged by shuffling ✓)\nA "first point" feature would change:\n[${first.map((v) => v.toFixed(2)).join(', ')}]`;
    }
    draw();
  });
})();
