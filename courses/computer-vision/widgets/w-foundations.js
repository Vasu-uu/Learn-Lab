/* Widgets for Chapter 1 (What is CV) and Chapter 2 (Images) */
(function () {
  'use strict';
  const U = CV.util;

  /* ======================= Ch1: task explorer ======================= */
  const OBJ = {
    house: { box: [20, 84, 106, 162], c: '#e07a5f' },
    sign: { box: [110, 150, 140, 188], c: '#d4a73a' },
    car: { box: [176, 177, 222, 208], c: '#5b9cf5' },
    tree: { box: [242, 86, 303, 160], c: '#4caf7d' },
  };
  function drawLabels(ctx, s, mode) {
    // flat colour semantic map replicating the scene geometry
    const fill = (c) => (ctx.fillStyle = c);
    const stuff = mode !== 'instance';
    const W = 320 * s, H = 220 * s;
    if (stuff) {
      fill('#3b82f6'); ctx.fillRect(0, 0, W, H); // sky
      fill('#8b5cf6'); ctx.beginPath(); ctx.moveTo(0, 140 * s); ctx.lineTo(70 * s, 70 * s); ctx.lineTo(130 * s, 125 * s); ctx.lineTo(190 * s, 80 * s); ctx.lineTo(320 * s, 140 * s); ctx.closePath(); ctx.fill();
      fill('#16a34a'); ctx.fillRect(0, 132 * s, W, H);
      fill('#64748b'); ctx.beginPath(); ctx.moveTo(140 * s, 132 * s); ctx.lineTo(180 * s, 132 * s); ctx.lineTo(260 * s, H); ctx.lineTo(60 * s, H); ctx.closePath(); ctx.fill();
    }
    const thing = (k, sem) => fill(mode === 'semantic' ? sem : OBJ[k].c);
    thing('house', '#ef4444'); ctx.fillRect(28 * s, 112 * s, 70 * s, 50 * s);
    ctx.beginPath(); ctx.moveTo(20 * s, 114 * s); ctx.lineTo(63 * s, 84 * s); ctx.lineTo(106 * s, 114 * s); ctx.closePath(); ctx.fill();
    thing('tree', '#facc15'); ctx.fillRect(268 * s, 120 * s, 9 * s, 40 * s);
    [[272, 108, 22], [258, 120, 16], [287, 120, 16]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * s, y * s, r * s, 0, 7); ctx.fill(); });
    thing('car', '#06b6d4'); ctx.fillRect(176 * s, 186 * s, 46 * s, 16 * s); ctx.fillRect(186 * s, 177 * s, 26 * s, 12 * s);
    [[186, 203], [212, 203]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * s, y * s, 5 * s, 0, 7); ctx.fill(); });
    thing('sign', '#f97316'); ctx.fillRect(110 * s, 150 * s, 30 * s, 20 * s); ctx.fillRect(123 * s, 170 * s, 4 * s, 18 * s);
  }

  const TASKS = {
    classification: ['image', 'one label (or several)', 'ResNet, EfficientNet, ViT, ConvNeXt'],
    detection: ['image', 'boxes + labels + scores', 'Faster R-CNN, YOLO, RT-DETR'],
    semantic: ['image', 'class label for every pixel', 'U-Net, DeepLab, SegFormer'],
    instance: ['image', 'a mask per object', 'Mask R-CNN, YOLO-seg, SAM'],
    panoptic: ['image', 'semantic + instance together', 'Mask2Former'],
    keypoints: ['image', 'landmark coordinates', 'HRNet, YOLO-pose'],
    depth: ['image(s)', 'distance for each pixel', 'MiDaS, Depth Anything'],
  };

  CV.widget('task-explorer', { title: 'One image, many questions', desc: 'Pick a task and watch what a model of that type would output for the same picture.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 480, H = 330, s = W / 320;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const base = U.defaultScene(W, H);
    const lab = document.createElement('canvas'); lab.width = W; lab.height = H;
    let mode = 'detection', t0 = performance.now(), depthCanvas = null;
    U.seg(ctl, Object.keys(TASKS).map((k) => [k, k[0].toUpperCase() + k.slice(1)]), mode, (m) => { mode = m; t0 = performance.now(); info(); });
    const out = U.out(ctl);
    const bars = U.el('div', { class: 'bars' }); ctl.append(bars);
    function info() {
      const [i, o, m] = TASKS[mode];
      out.innerHTML = `<b>Input</b>   ${i}\n<b>Output</b>  ${o}\n<b>Models</b>  ${m}`;
      bars.innerHTML = '';
      if (mode === 'classification') {
        [['country road', 0.71], ['farmhouse', 0.14], ['valley', 0.08], ['sports car', 0.04], ['traffic sign', 0.03]].forEach(([n, p]) => {
          bars.insertAdjacentHTML('beforeend', `<div class="bar-row"><span>${n}</span><div class="track"><div class="fill" style="width:0"></div></div><span class="v">${(p * 100).toFixed(0)}%</span></div>`);
          requestAnimationFrame(() => requestAnimationFrame(() => (bars.lastElementChild.querySelector('.fill').style.width = p * 100 + '%')));
        });
      }
    }
    info();
    U.loop(c, () => {
      const t = Math.min(1, (performance.now() - t0) / 900), e = 1 - Math.pow(1 - t, 3);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);
      const lctx = lab.getContext('2d');
      if (mode === 'semantic' || mode === 'instance' || mode === 'panoptic') {
        lctx.clearRect(0, 0, W, H);
        drawLabels(lctx, s, mode === 'semantic' ? 'semantic' : mode);
        ctx.save(); ctx.globalAlpha = 0.68 * e;
        ctx.beginPath(); ctx.rect(0, 0, W * e, H); ctx.clip();
        ctx.drawImage(lab, 0, 0); ctx.restore();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * e, 0); ctx.lineTo(W * e, H); if (t < 1) ctx.stroke();
        if (mode !== 'semantic' && t >= 1) {
          ctx.font = 'bold 12px Inter'; ctx.fillStyle = '#fff';
          Object.entries(OBJ).forEach(([k, o], i) => ctx.fillText(`${k} #${i + 1}`, o.box[0] * s + 4, o.box[1] * s + 14));
        }
        if (mode === 'semantic' && t >= 1) {
          const leg = [['sky', '#3b82f6'], ['mountain', '#8b5cf6'], ['grass', '#16a34a'], ['road', '#64748b'], ['building', '#ef4444'], ['tree', '#facc15'], ['car', '#06b6d4'], ['sign', '#f97316']];
          leg.forEach(([n, col], i) => { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(6, 6 + i * 18, 84, 16); ctx.fillStyle = col; ctx.fillRect(10, 9 + i * 18, 10, 10); ctx.fillStyle = '#fff'; ctx.font = '11px Inter'; ctx.fillText(n, 26, 18 + i * 18); });
        }
      } else if (mode === 'detection') {
        Object.entries(OBJ).forEach(([k, o], i) => {
          const tt = U.clamp(e * 1.6 - i * 0.18, 0, 1);
          if (!tt) return;
          const [x1, y1, x2, y2] = o.box.map((v) => v * s);
          ctx.strokeStyle = o.c; ctx.lineWidth = 2.5;
          const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, hw = ((x2 - x1) / 2) * tt, hh = ((y2 - y1) / 2) * tt;
          ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);
          if (tt >= 1) {
            const score = [0.94, 0.81, 0.97, 0.89][i];
            const txt = `${k} ${score.toFixed(2)}`;
            ctx.font = 'bold 12px Inter'; const tw = ctx.measureText(txt).width + 8;
            ctx.fillStyle = o.c; ctx.fillRect(x1, y1 - 18, tw, 18);
            ctx.fillStyle = '#000'; ctx.fillText(txt, x1 + 4, y1 - 5);
          }
        });
      } else if (mode === 'keypoints') {
        const kp = [[[20, 114], [63, 84], [106, 114], [98, 162], [28, 162], [20, 114]], [[176, 186], [186, 177], [212, 177], [222, 186], [222, 202], [176, 202], [176, 186]], [[268, 160], [272, 86], [242, 120], [303, 120], [272, 86]]];
        kp.forEach((pts, j) => {
          const n = Math.ceil(pts.length * e);
          ctx.strokeStyle = ['#e07a5f', '#5b9cf5', '#4caf7d'][j]; ctx.lineWidth = 2;
          ctx.beginPath(); pts.slice(0, n).forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s))); ctx.stroke();
          pts.slice(0, n).forEach(([x, y]) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x * s, y * s, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(x * s, y * s, 2.5, 0, 7); ctx.fill(); });
        });
      } else if (mode === 'depth') {
        if (!depthCanvas) {
          depthCanvas = document.createElement('canvas'); depthCanvas.width = W; depthCanvas.height = H;
          const lctx2 = lab.getContext('2d'); lctx2.clearRect(0, 0, W, H); drawLabels(lctx2, s, 'semantic');
          const L = lctx2.getImageData(0, 0, W, H).data, dctx = depthCanvas.getContext('2d'), id = dctx.createImageData(W, H);
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 4, r = L[i], g = L[i + 1];
            let d;
            if (r === 59 && g === 130) d = 0.02; // sky: far
            else if (r === 139 && g === 92) d = 0.12; // mountains
            else if (r === 239) d = 0.55; // house
            else if (r === 250 && g === 204) d = 0.5; // tree
            else if (r === 6) d = 0.85; // car
            else if (r === 249) d = 0.7; // sign
            else d = U.clamp(0.25 + 0.75 * ((y / s - 132) / 88), 0.1, 1); // ground recedes upward
            const col = U.magma(d);
            id.data.set([col[0], col[1], col[2], 255], i);
          }
          dctx.putImageData(id, 0, 0);
        }
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H * e); ctx.clip(); ctx.drawImage(depthCanvas, 0, 0); ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(W - 120, 8, 112, 22); ctx.fillStyle = '#fff'; ctx.font = '11px Inter'; ctx.fillText('near = bright', W - 112, 23);
      } else if (mode === 'classification') {
        ctx.fillStyle = 'rgba(5,10,22,.55)'; ctx.fillRect(0, H - 40, W, 40);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Inter'; ctx.globalAlpha = e;
        ctx.fillText('→ "country road"  (71%)', 14, H - 15); ctx.globalAlpha = 1;
      }
    });
  });

  /* ======================= Ch1: why vision is hard ======================= */
  CV.widget('difficulty', { title: 'Same object, different pixels', desc: 'Each nuisance factor changes most pixel values while the scene content stays the same.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 260, H = 180;
    const a = U.pixCanvas(W, H, 260, false), b = U.pixCanvas(W, H, 260, false);
    stage.append(U.el('div', { class: 'w-row' },
      U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, 'Reference image'), a.c),
      U.el('div', { class: 'w-col' }, U.el('div', { class: 'canvas-label' }, 'What the camera sees now'), b.c)));
    let mode = 'illumination', amt = 0.6;
    U.seg(ctl, [['viewpoint', 'Viewpoint'], ['illumination', 'Lighting'], ['scale', 'Scale'], ['occlusion', 'Occlusion'], ['deformation', 'Deformation'], ['noise', 'Noise/blur']], mode, (m) => { mode = m; draw(); });
    U.slider(ctl, { label: 'Strength', min: 0, max: 1, step: 0.01, value: amt, fmt: (v) => Math.round(v * 100) + '%', onInput: (v) => { amt = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      const src = U.scene(W, H);
      a.ctx.drawImage(src, 0, 0);
      const ctx = b.ctx;
      ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      if (mode === 'viewpoint') {
        ctx.translate(W / 2, H / 2); ctx.transform(1, amt * 0.25, -amt * 0.5, 1, 0, 0); ctx.rotate(amt * 0.35); ctx.drawImage(src, -W / 2, -H / 2);
      } else if (mode === 'scale') {
        const k = 1 - amt * 0.82; ctx.fillStyle = '#7aa7d8'; ctx.fillRect(0, 0, W, H); ctx.drawImage(src, (W - W * k) * 0.7, (H - H * k) * 0.3, W * k, H * k);
      } else if (mode === 'deformation') {
        for (let x = 0; x < W; x += 2) ctx.drawImage(src, x, 0, 2, H, x, Math.sin(x / 18) * amt * 14, 2, H);
      } else ctx.drawImage(src, 0, 0);
      ctx.restore();
      const id = ctx.getImageData(0, 0, W, H), d = id.data, rnd = U.rand(11);
      if (mode === 'illumination') {
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4, shade = 1 - amt * 0.75 * U.clamp((x - y * 0.4) / W, 0, 1);
          d[i] = d[i] * shade * (1 + amt * 0.25); d[i + 1] *= shade * (1 - amt * 0.05); d[i + 2] *= shade * (1 - amt * 0.35);
        }
      } else if (mode === 'noise') {
        const tmp = new Uint8ClampedArray(d);
        const r = Math.round(amt * 3);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) for (let ch = 0; ch < 3; ch++) {
          let s = 0, n = 0;
          for (let j = -r; j <= r; j++) for (let i2 = -r; i2 <= r; i2++) { const yy = U.clamp(y + j, 0, H - 1), xx = U.clamp(x + i2, 0, W - 1); s += tmp[(yy * W + xx) * 4 + ch]; n++; }
          d[(y * W + x) * 4 + ch] = s / n + U.gauss(rnd) * 40 * amt;
        }
      } else if (mode === 'occlusion') {
        const n = Math.round(amt * 9);
        for (let k = 0; k < n; k++) {
          const bx = Math.floor(rnd() * (W - 50)), by = Math.floor(rnd() * (H - 40)), bw = 25 + rnd() * 40, bh = 20 + rnd() * 30, g = 60 + rnd() * 120;
          for (let y = by; y < Math.min(H, by + bh); y++) for (let x = bx; x < Math.min(W, bx + bw); x++) { const i = (y * W + x) * 4; d[i] = g; d[i + 1] = g * 0.9; d[i + 2] = g * 0.8; }
        }
      }
      ctx.putImageData(id, 0, 0);
      const A = a.ctx.getImageData(0, 0, W, H).data;
      let changed = 0, mad = 0;
      for (let i = 0; i < A.length; i += 4) { const df = (Math.abs(A[i] - d[i]) + Math.abs(A[i + 1] - d[i + 1]) + Math.abs(A[i + 2] - d[i + 2])) / 3; mad += df; if (df > 20) changed++; }
      out.innerHTML = `<b>Pixels changed by &gt;20 levels</b>  ${((changed / (W * H)) * 100).toFixed(1)}%\n<b>Mean abs. difference</b>       ${(mad / (W * H)).toFixed(1)} / 255\n<b>Objects in the scene</b>       still: house, car, tree, sign`;
    }
    draw();
    return U.onImage(draw);
  });

  /* ======================= Ch1: history timeline ======================= */
  CV.widget('timeline', { title: 'A short history of computer vision', desc: 'Click a milestone. Notice the shift from hand-designed features to learned ones in 2012.', tag: 'Timeline' }, (body) => {
    const E = [
      ['1959', 'Hubel & Wiesel', 'Orientation-selective neurons found in cat visual cortex, inspiring hierarchical feature models.', 0],
      ['1963', 'Blocks world', "Larry Roberts' thesis: recover 3D shape from line drawings.", 0],
      ['1980', 'Neocognitron', "Fukushima's early convolution-like hierarchical network.", 0],
      ['1989–98', 'LeNet', "LeCun's convolutional networks read handwritten digits; LeNet-5 deployed for cheques.", 0],
      ['1999–2005', 'Hand-crafted features', 'SIFT (Lowe), Viola–Jones faces (2001), HOG pedestrians (2005) dominate.', 0],
      ['2009', 'ImageNet', 'About 1.2M training images, 1000 classes: enables large-scale learning.', 0],
      ['2012', 'AlexNet', 'Wins ImageNet by a huge margin. The deep learning era begins.', 1],
      ['2014–15', 'Going deeper', 'VGG, GoogLeNet, ResNet; R-CNN family; GANs; U-Net; fully convolutional nets.', 1],
      ['2016–18', 'Real time', 'YOLO, SSD, RetinaNet; Mask R-CNN; MobileNet for phones.', 1],
      ['2020–21', 'Transformers', 'ViT, DETR, Swin, CLIP, MAE: transformers and self-supervision arrive.', 2],
      ['2022–23', 'Foundation models', 'Latent diffusion (Stable Diffusion), Segment Anything, DINOv2.', 2],
      ['2024+', 'Multimodal', 'Vision-language models, video foundation models, edge-optimised NMS-free detectors.', 2],
    ];
    const cols = [U.css('--accent'), U.css('--accent-2'), U.css('--accent-3')];
    const track = U.el('div', { style: 'position:relative;display:flex;gap:0;overflow-x:auto;padding:30px 4px 10px' });
    const line = U.el('div', { style: `position:absolute;left:0;right:0;top:41px;height:3px;border-radius:3px;background:linear-gradient(90deg,${cols[0]},${cols[0]} 48%,${cols[1]} 55%,${cols[2]})` });
    track.append(line);
    const card = U.el('div', { class: 'w-out', style: 'margin-top:14px;min-height:74px' });
    const nodes = E.map((e, i) => {
      const n = U.el('button', { type: 'button', style: `flex:1 0 74px;display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:0;color:var(--text-2);cursor:pointer;font:600 11.5px Inter;position:relative;z-index:1` });
      const dot = U.el('span', { style: `width:16px;height:16px;border-radius:50%;background:var(--surface);border:3px solid ${cols[e[3]]};transition:transform .3s var(--spring),box-shadow .3s` });
      n.append(dot, U.el('span', {}, e[0]));
      n.onclick = () => sel(i);
      track.append(n);
      return { n, dot };
    });
    const legend = U.el('div', { class: 'w-note', html: `<span style="color:${cols[0]}">●</span> classical & early neural · <span style="color:${cols[1]}">●</span> deep CNN era · <span style="color:${cols[2]}">●</span> transformers & foundation models` });
    body.append(track, card, legend);
    function sel(i) {
      nodes.forEach((x, k) => { x.dot.style.transform = k === i ? 'scale(1.5)' : ''; x.dot.style.boxShadow = k === i ? `0 0 14px ${cols[E[k][3]]}` : ''; x.dot.style.background = k <= i ? cols[E[k][3]] : 'var(--surface)'; });
      card.innerHTML = `<b>${E[i][0]} · ${E[i][1]}</b>\n${E[i][2]}`;
    }
    sel(6);
    let i = 0, auto = setInterval(() => { sel(i); i++; if (i >= E.length) { clearInterval(auto); sel(6); } }, 700);
    track.addEventListener('click', () => clearInterval(auto));
    return () => clearInterval(auto);
  });

  /* ======================= Ch2: pinhole camera ======================= */
  CV.widget('pinhole', { title: 'Pinhole camera: x = f · X / Z', desc: 'Drag the object (or use sliders). Watch the inverted image shrink as distance grows.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 440px' });
    const W = 620, H = 280;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let f = 2, Z = 6, Y = 1.6;
    const sf = U.slider(ctl, { label: 'Focal length f', min: 0.8, max: 4, step: 0.05, value: f, fmt: (v) => v.toFixed(2), onInput: (v) => { f = v; draw(); } });
    const sz = U.slider(ctl, { label: 'Object distance Z', min: 2, max: 12, step: 0.05, value: Z, fmt: (v) => v.toFixed(2), onInput: (v) => { Z = v; draw(); } });
    const sy = U.slider(ctl, { label: 'Object height X', min: 0.4, max: 2.4, step: 0.02, value: Y, fmt: (v) => v.toFixed(2), onInput: (v) => { Y = v; draw(); } });
    const out = U.out(ctl);
    const sc = 42, axisY = H / 2, planeX = 40;
    const holeX = () => planeX + f * sc;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const ox = holeX() + Z * sc * 0.95, top = axisY - Y * sc, img = (f * Y) / Z;
      const accent = U.css('--accent'), a2 = U.css('--accent-2'), a3 = U.css('--accent-3'), t2 = U.css('--text-2'), t3 = U.css('--text-3');
      // optical axis
      ctx.strokeStyle = t3; ctx.setLineDash([4, 5]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, axisY); ctx.lineTo(W - 10, axisY); ctx.stroke(); ctx.setLineDash([]);
      // camera box
      ctx.fillStyle = U.css('--surface-3'); ctx.fillRect(planeX - 6, axisY - 110, holeX() - planeX + 6, 220);
      ctx.fillStyle = U.css('--surface'); ctx.fillRect(planeX, axisY - 104, holeX() - planeX - 2, 208);
      // image plane
      ctx.strokeStyle = a2; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(planeX, axisY - 104); ctx.lineTo(planeX, axisY + 104); ctx.stroke();
      // pinhole wall
      ctx.strokeStyle = t2; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(holeX(), axisY - 110); ctx.lineTo(holeX(), axisY - 4); ctx.moveTo(holeX(), axisY + 4); ctx.lineTo(holeX(), axisY + 110); ctx.stroke();
      // rays
      ctx.strokeStyle = accent; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.5;
      const imgTop = axisY + img * sc;
      ctx.beginPath(); ctx.moveTo(ox, top); ctx.lineTo(planeX, imgTop); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, axisY); ctx.lineTo(planeX, axisY); ctx.stroke();
      ctx.globalAlpha = 1;
      // object arrow
      ctx.strokeStyle = a3; ctx.fillStyle = a3; ctx.lineWidth = 4; U.arrow(ctx, ox, axisY, ox, top, 12);
      ctx.beginPath(); ctx.arc(ox, top, 9, 0, 7); ctx.globalAlpha = 0.25; ctx.fill(); ctx.globalAlpha = 1;
      // image arrow (inverted)
      ctx.strokeStyle = accent; ctx.fillStyle = accent; ctx.lineWidth = 4; U.arrow(ctx, planeX + 10, axisY, planeX + 10, imgTop, 9);
      // labels
      ctx.font = '600 12px Inter'; ctx.fillStyle = t2; ctx.textAlign = 'center';
      ctx.fillText('image plane', planeX + 10, axisY + 124);
      ctx.fillText('pinhole', holeX(), axisY - 118);
      ctx.fillText('object', ox, top - 16);
      // dimension lines
      ctx.strokeStyle = t3; ctx.lineWidth = 1;
      const dy = axisY + 140 - 10;
      ctx.beginPath(); ctx.moveTo(planeX, dy); ctx.lineTo(holeX(), dy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(holeX(), dy); ctx.lineTo(ox, dy); ctx.stroke();
      ctx.fillStyle = t3; ctx.fillText('f', (planeX + holeX()) / 2, dy - 5); ctx.fillText('Z', (holeX() + ox) / 2, dy - 5);
      out.innerHTML = `x = f · X / Z\n  = ${f.toFixed(2)} × ${Y.toFixed(2)} / ${Z.toFixed(2)}\n  = <b>${img.toFixed(3)}</b>  (inverted)\n\nDouble Z → image size halves.`;
    }
    let drag = false;
    const down = (e) => { const p = U.mouse(c, e); const ox = holeX() + Z * sc * 0.95; if (Math.abs(p.x - ox) < 30) { drag = true; e.preventDefault(); } };
    const move = (e) => {
      if (!drag) return; const p = U.mouse(c, e);
      Z = U.clamp((p.x - holeX()) / (sc * 0.95), 2, 12); Y = U.clamp((axisY - p.y) / sc, 0.4, 2.4);
      sz.set(Z); sy.set(Y); draw();
    };
    c.addEventListener('pointerdown', down); addEventListener('pointermove', move); addEventListener('pointerup', () => (drag = false));
    c.style.cursor = 'grab';
    draw();
    return () => removeEventListener('pointermove', move);
  });

  /* ======================= Ch2: pixel inspector ======================= */
  CV.widget('pixel-inspector', { title: 'An image is a grid of numbers', desc: 'Hover over the image. Every pixel is three numbers in 0–255; a grayscale image is one.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 380px' });
    const w = 64, h = 44;
    const { c, ctx } = U.pixCanvas(w, h, 460);
    c.style.cursor = 'crosshair';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let chan = 'rgb', px = 20, py = 30;
    U.seg(ctl, [['rgb', 'RGB'], ['r', 'R'], ['g', 'G'], ['b', 'B'], ['gray', 'Gray']], chan, (v) => { chan = v; draw(); });
    const grid = U.el('div', { class: 'mgrid', style: 'grid-template-columns:repeat(5,34px)' });
    ctl.append(grid);
    const out = U.out(ctl);
    let src;
    function draw() {
      const big = U.scene(320, 220);
      const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
      const tctx = tmp.getContext('2d', { willReadFrequently: true });
      tctx.imageSmoothingQuality = 'high'; tctx.drawImage(big, 0, 0, w, h);
      src = tctx.getImageData(0, 0, w, h);
      const id = ctx.createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        const r = src.data[i * 4], g = src.data[i * 4 + 1], b = src.data[i * 4 + 2], y = 0.299 * r + 0.587 * g + 0.114 * b;
        const v = { rgb: [r, g, b], r: [r, 0, 0], g: [0, g, 0], b: [0, 0, b], gray: [y, y, y] }[chan];
        id.data.set([...v, 255], i * 4);
      }
      ctx.putImageData(id, 0, 0);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.35; ctx.strokeRect(px - 2 - 0.2, py - 2 - 0.2, 5.4, 5.4);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 0.2; ctx.strokeRect(px + 0.1, py + 0.1, 0.8, 0.8);
      grid.innerHTML = '';
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
        const x = U.clamp(px + i, 0, w - 1), y = U.clamp(py + j, 0, h - 1), k = (y * w + x) * 4;
        const r = src.data[k], g = src.data[k + 1], b = src.data[k + 2], gy = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        const val = { rgb: gy, r, g, b, gray: gy }[chan];
        const bg = chan === 'rgb' ? `rgb(${r},${g},${b})` : chan === 'gray' ? `rgb(${gy},${gy},${gy})` : `rgb(${chan === 'r' ? r : 0},${chan === 'g' ? g : 0},${chan === 'b' ? b : 0})`;
        const d = U.el('div', { style: `background:${bg};color:${(chan === 'rgb' || chan === 'gray' ? gy : val) > 128 ? '#000' : '#fff'}` }, String(val));
        if (!i && !j) d.classList.add('hl');
        grid.append(d);
      }
      const k = (py * w + px) * 4, R = src.data[k], G = src.data[k + 1], B = src.data[k + 2];
      out.innerHTML = `<b>shape</b>        (${h}, ${w}, 3)  H × W × C\n<b>img[${py}, ${px}]</b>  RGB = [${R}, ${G}, ${B}]\n<b>OpenCV</b> gives  BGR = [${B}, ${G}, ${R}]\n<b>gray</b>  0.299R + 0.587G + 0.114B = ${(0.299 * R + 0.587 * G + 0.114 * B).toFixed(1)}\n<small>grid shows ${chan === 'rgb' ? 'gray value' : chan.toUpperCase() + ' channel'} of the 5×5 neighbourhood</small>`;
    }
    c.addEventListener('pointermove', (e) => { const p = U.mouse(c, e); px = U.clamp(Math.floor(p.x), 0, w - 1); py = U.clamp(Math.floor(p.y), 0, h - 1); draw(); });
    draw();
    return U.onImage(draw);
  });

  /* ======================= Ch2: tensor layouts ======================= */
  CV.widget('tensor-layout', { title: 'HWC, CHW and the BGR trap', desc: 'See how one image is stored by OpenCV, PIL and PyTorch, and what happens when red and blue are swapped.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 520, H = 280;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let layout = 'hwc', bgr = false, t = 0, target = 0;
    U.seg(ctl, [['hwc', 'H×W×C (image)'], ['chw', 'C×H×W (PyTorch)']], layout, (v) => { layout = v; target = v === 'chw' ? 1 : 0; });
    U.check(ctl, 'Feed BGR (forgot cvtColor)', bgr, (v) => { bgr = v; build(); });
    const out = U.out(ctl);
    const planes = [];
    function build() {
      const src = U.scene(160, 110), d = U.getRGB(src);
      planes.length = 0;
      for (let ch = 0; ch < 3; ch++) {
        const cv = document.createElement('canvas'); cv.width = 160; cv.height = 110;
        const x = cv.getContext('2d'), id = x.createImageData(160, 110);
        for (let i = 0; i < 160 * 110; i++) { const v = d.data[i * 4 + ch]; id.data[i * 4 + ch] = v; id.data[i * 4 + 3] = 255; }
        x.putImageData(id, 0, 0); planes.push(cv);
      }
      const comp = document.createElement('canvas'); comp.width = 160; comp.height = 110;
      const cx = comp.getContext('2d'), id = cx.createImageData(160, 110);
      for (let i = 0; i < 160 * 110; i++) { const r = d.data[i * 4], g = d.data[i * 4 + 1], b = d.data[i * 4 + 2]; id.data.set(bgr ? [b, g, r, 255] : [r, g, b, 255], i * 4); }
      cx.putImageData(id, 0, 0); planes.push(comp);
      out.innerHTML = layout === 'chw' || target
        ? `<b>torch</b>  x.shape = (3, 224, 224)\n<b>batch</b>  (N, 3, 224, 224)  float, normalised\nx = np.transpose(x, (2, 0, 1))  # HWC → CHW`
        : `<b>cv2 / PIL</b>  img.shape = (224, 224, 3)\nuint8 0–255, OpenCV order is <b>B,G,R</b>`;
      if (bgr) out.innerHTML += `\n\n<span style="color:var(--bad)">⚠ Red and blue swapped: the sky turns orange, the car blue. A pretrained model sees the wrong colours and accuracy silently drops.</span>`;
    }
    build();
    U.loop(c, (dt) => {
      t += (target - t) * Math.min(1, dt * 5);
      ctx.clearRect(0, 0, W, H);
      const names = bgr ? ['B', 'G', 'R'] : ['R', 'G', 'B'];
      const order = bgr ? [2, 1, 0] : [0, 1, 2];
      // composite image fades out as planes separate
      const baseX = 40, baseY = 70;
      for (let k = 2; k >= 0; k--) {
        const ch = order[k];
        const ox = baseX + t * (k * 160) + (1 - t) * k * 10, oy = baseY + (1 - t) * -k * 10 + t * 30;
        ctx.save(); ctx.translate(ox, oy); ctx.transform(1, -0.18 * (1 - t), 0, 1, 0, 0);
        ctx.globalAlpha = 0.25 + 0.75 * t; ctx.drawImage(planes[ch], 0, 0, 140, 96);
        ctx.globalAlpha = 1; ctx.strokeStyle = ['#ef4444', '#22c55e', '#3b82f6'][ch]; ctx.lineWidth = 2; ctx.strokeRect(0, 0, 140, 96);
        ctx.fillStyle = ctx.strokeStyle; ctx.font = 'bold 13px JetBrains Mono'; ctx.fillText(`[${k}] ${names[k]}`, 4, -6);
        ctx.restore();
      }
      ctx.globalAlpha = 1 - t;
      ctx.save(); ctx.translate(baseX, baseY); ctx.drawImage(planes[3], 0, 0, 140, 96); ctx.restore();
      ctx.fillStyle = U.css('--text-2'); ctx.font = '600 12px Inter';
      ctx.fillText('interleaved: each pixel stores (' + names.join(', ') + ')', baseX, baseY + 122);
      ctx.globalAlpha = 1;
      ctx.fillStyle = U.css('--text'); ctx.font = 'bold 14px JetBrains Mono';
      ctx.fillText(t > 0.5 ? 'C × H × W  →  3 separate planes' : 'H × W × C  →  one picture, 3 values per pixel', 40, 30);
    });
  });

  /* ======================= Ch2: colour spaces ======================= */
  function rgb2hsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    return [h, mx ? d / mx : 0, mx];
  }
  function rgb2lab(r, g, b) {
    const lin = (v) => { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; };
    const R = lin(r), G = lin(g), B = lin(b);
    let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    X = f(X); Y = f(Y); Z = f(Z);
    return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
  }
  CV.util.rgb2hsv = rgb2hsv;

  CV.widget('color-spaces', { title: 'One colour, five coordinate systems', desc: 'Move the RGB sliders and compare how each colour space describes the same colour.' }, (body) => {
    const { stage, ctl } = U.split(body);
    let r = 230, g = 90, b = 40;
    const sw = U.el('div', { style: 'height:120px;border-radius:12px;border:1px solid var(--border);transition:background .15s' });
    const out = U.out(stage);
    stage.prepend(sw);
    out.style.marginTop = '12px';
    const bars = U.el('div', { class: 'bars', style: 'margin-top:12px' }); stage.append(bars);
    const mk = (lab, v, col) => U.slider(ctl, { label: lab, min: 0, max: 255, value: v, onInput: (x) => { if (col === 'r') r = x; else if (col === 'g') g = x; else b = x; draw(); } });
    mk('Red', r, 'r'); mk('Green', g, 'g'); mk('Blue', b, 'b');
    const presets = U.el('div', { class: 'w-btns' }); ctl.append(presets);
    [['Sky', [91, 160, 222]], ['Grass', [86, 160, 70]], ['Skin', [224, 172, 140]], ['Shadow sky', [40, 70, 110]]].forEach(([n, v]) => U.button(presets, n, () => { [r, g, b] = v; ctl.querySelectorAll('input[type=range]').forEach((inp, i) => { inp.value = v[i]; inp.dispatchEvent(new Event('input')); }); }));
    function draw() {
      sw.style.background = `rgb(${r},${g},${b})`;
      const [h, s, v] = rgb2hsv(r, g, b), Y = 0.299 * r + 0.587 * g + 0.114 * b;
      const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b, Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const [L, A, B2] = rgb2lab(r, g, b);
      out.innerHTML = `<b>RGB</b>     (${r}, ${g}, ${b})        additive, sensor/screen\n<b>Gray</b>    Y = ${Y.toFixed(1)}             0.299R + 0.587G + 0.114B\n<b>HSV</b>     H=${h.toFixed(0)}° S=${s.toFixed(2)} V=${v.toFixed(2)}   hue ≈ independent of brightness\n<b>YCbCr</b>   (${Y.toFixed(0)}, ${Cb.toFixed(0)}, ${Cr.toFixed(0)})          JPEG keeps luma, subsamples chroma\n<b>CIE Lab</b> (${L.toFixed(1)}, ${A.toFixed(1)}, ${B2.toFixed(1)})   perceptually uniform`;
      bars.innerHTML = [['Hue', h / 360, `hsl(${h},90%,55%)`], ['Saturation', s, null], ['Value', v, null]].map(([n, p, col]) => `<div class="bar-row"><span>${n}</span><div class="track"><div class="fill" style="width:${p * 100}%;${col ? 'background:' + col : ''}"></div></div><span class="v">${(p * (n === 'Hue' ? 360 : 1)).toFixed(n === 'Hue' ? 0 : 2)}</span></div>`).join('');
    }
    draw();
  });

  CV.widget('hsv-mask', { title: 'Colour segmentation with HSV', desc: 'Select a hue range. Because hue ignores brightness, the mask survives shadows better than an RGB threshold.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 320, H = 220;
    const a = U.pixCanvas(W, H, 420, false);
    stage.append(U.el('div', { class: 'canvas-box' }, a.c));
    let hc = 120, tol = 25, smin = 0.3, vmin = 0.15, show = 'overlay';
    const strip = U.el('div', { style: 'height:12px;border-radius:6px;background:linear-gradient(90deg,hsl(0,90%,55%),hsl(60,90%,55%),hsl(120,90%,45%),hsl(180,90%,50%),hsl(240,90%,60%),hsl(300,90%,55%),hsl(360,90%,55%))' });
    ctl.append(strip);
    U.slider(ctl, { label: 'Hue centre', min: 0, max: 359, value: hc, fmt: (v) => v + '°', onInput: (v) => { hc = v; draw(); } });
    U.slider(ctl, { label: 'Hue tolerance ±', min: 2, max: 90, value: tol, fmt: (v) => v + '°', onInput: (v) => { tol = v; draw(); } });
    U.slider(ctl, { label: 'Min saturation', min: 0, max: 1, step: 0.01, value: smin, onInput: (v) => { smin = v; draw(); } });
    U.slider(ctl, { label: 'Min value', min: 0, max: 1, step: 0.01, value: vmin, onInput: (v) => { vmin = v; draw(); } });
    U.seg(ctl, [['overlay', 'Overlay'], ['mask', 'Mask']], show, (v) => { show = v; draw(); });
    const out = U.out(ctl);
    function draw() {
      const src = U.getRGB(U.scene(W, H)), id = a.ctx.createImageData(W, H);
      let n = 0;
      for (let i = 0; i < W * H; i++) {
        const r = src.data[i * 4], g = src.data[i * 4 + 1], b = src.data[i * 4 + 2];
        const [h, s, v] = rgb2hsv(r, g, b);
        const dh = Math.min(Math.abs(h - hc), 360 - Math.abs(h - hc));
        const on = dh <= tol && s >= smin && v >= vmin;
        if (on) n++;
        if (show === 'mask') id.data.set(on ? [255, 255, 255, 255] : [0, 0, 0, 255], i * 4);
        else { const k = on ? 1 : 0.25; id.data.set([r * k + (on ? 0 : 20), g * k, b * k + (on ? 0 : 30), 255], i * 4); }
      }
      a.ctx.putImageData(id, 0, 0);
      out.innerHTML = `mask = cv2.inRange(hsv, lower, upper)\n<b>${((n / (W * H)) * 100).toFixed(1)}%</b> of pixels selected\n<small>OpenCV stores H as 0–179 (degrees / 2).</small>`;
    }
    draw();
    return U.onImage(draw);
  });

  /* ======================= Ch2: sampling & quantization ======================= */
  CV.widget('sampling', { title: 'Sampling, aliasing and quantization', desc: 'Downsample a fine pattern without blurring and watch false patterns (moiré) appear. Reduce bits to see banding.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const S = 256;
    const view = U.pixCanvas(S, S, 380);
    stage.append(U.el('div', { class: 'canvas-box' }, view.c));
    let src = 'zone', factor = 4, bits = 8, aa = false;
    U.seg(ctl, [['zone', 'Zone plate'], ['scene', 'Photo']], src, (v) => { src = v; draw(); });
    U.slider(ctl, { label: 'Downsample factor', min: 1, max: 12, value: factor, fmt: (v) => v + '×', onInput: (v) => { factor = v; draw(); } });
    U.slider(ctl, { label: 'Bits per channel', min: 1, max: 8, value: bits, fmt: (v) => `${v} bit → ${2 ** v} levels`, onInput: (v) => { bits = v; draw(); } });
    U.check(ctl, 'Blur before downsampling (anti-alias)', aa, (v) => { aa = v; draw(); });
    const out = U.out(ctl);
    let zone;
    function getSrc() {
      if (src === 'scene') {
        const c = document.createElement('canvas'); c.width = S; c.height = S;
        c.getContext('2d').drawImage(U.scene(320, 220), 32, 0, 220, 220, 0, 0, S, S);
        return U.getGray(c);
      }
      if (!zone) { const d = new Float32Array(S * S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const r2 = (x - S / 2) ** 2 + (y - S / 2) ** 2; d[y * S + x] = 127.5 + 127.5 * Math.cos((Math.PI * r2) / (S * 1.05)); } zone = { w: S, h: S, data: d }; }
      return zone;
    }
    function draw() {
      let g = getSrc();
      if (aa && factor > 1) g = U.blur(g, factor * 0.5);
      const n = Math.ceil(S / factor), L = 2 ** bits;
      const id = view.ctx.createImageData(S, S);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const sx = Math.min(S - 1, Math.floor(x / factor) * factor), sy = Math.min(S - 1, Math.floor(y / factor) * factor);
        let v = g.data[sy * S + sx];
        v = Math.round((v / 255) * (L - 1)) * (255 / (L - 1));
        id.data.set([v, v, v, 255], (y * S + x) * 4);
      }
      view.ctx.putImageData(id, 0, 0);
      const bytes = 1920 * 1080 * 3 * (bits / 8) / (factor * factor);
      out.innerHTML = `<b>samples</b>  ${n} × ${n}\n<b>levels</b>   ${L} per channel\n<b>1080p RGB at this setting</b> ≈ ${(bytes / 1e6).toFixed(2)} MB\n<small>Full 8-bit 1920×1080×3 = 6,220,800 bytes ≈ 6 MB</small>`;
    }
    draw();
    return U.onImage(draw);
  });
})();
