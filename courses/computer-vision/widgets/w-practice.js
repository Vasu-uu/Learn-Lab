/* Widgets for Part V: roadmap, projects, cheat sheets, glossary, flashcards */
(function () {
  'use strict';
  const U = CV.util;

  /* ---------------- 16-week roadmap with persistent checkboxes ---------------- */
  CV.widget('roadmap', { title: 'Your 16-week study plan', desc: 'Tick weeks as you finish them. Progress is saved in this browser.', tag: 'Tracker' }, (body) => {
    const R = [
      ['1–2', 'Python, NumPy, images, OpenCV', 'Load, crop, resize, colour spaces, filters; build a document scanner and coin counter.', 2],
      ['3', 'Classical vision', 'Edges, thresholds, morphology, contours; ORB matching and a panorama stitcher.', 3],
      ['4', 'ML basics', 'Linear and softmax classifiers, loss, SGD, metrics; MLP on MNIST in PyTorch.', 6],
      ['5–6', 'CNNs', 'Build a small CNN on CIFAR-10; reach above 90% with augmentation and BatchNorm.', 7],
      ['7', 'Transfer learning', 'Fine-tune ResNet or EfficientNet on a custom 5–10 class dataset; Grad-CAM.', 9],
      ['8–9', 'Object detection', 'Metrics (IoU, mAP); train YOLO on a custom dataset; analyse failures; optional: implement NMS and IoU from scratch.', 10],
      ['10', 'Segmentation', 'U-Net on a small dataset (Dice loss); try SAM for auto-labelling.', 11],
      ['11', 'Tracking and video', 'Detector + ByteTrack; count people or vehicles crossing a line.', 12],
      ['12–13', 'Transformers & foundation models', 'Fine-tune a ViT; DINOv2 features + linear head; CLIP zero-shot search; Grounding DINO + SAM labelling.', 13],
      ['14', 'Generative models', 'Train a tiny diffusion model on MNIST; use Stable Diffusion with LoRA.', 15],
      ['15', 'Deployment', 'Export to ONNX, quantize, run on a CPU/Jetson/phone; measure latency.', 16],
      ['16', 'Capstone', 'An end-to-end project with a report, demo and GitHub repository.', 18],
    ];
    const S = CV.state; S.roadmap = S.roadmap || {};
    const bar = U.el('div', { class: 'overall', style: 'margin:0 0 16px' }); body.append(bar);
    const list = U.el('div', { class: 'roadmap' }); body.append(list);
    function paint() {
      const n = R.filter((r) => S.roadmap[r[0]]).length;
      bar.innerHTML = `<div class="overall-top"><span>Plan progress</span><span>${n}/${R.length} blocks</span></div><div class="overall-bar"><i style="width:${(n / R.length) * 100}%"></i></div>`;
    }
    R.forEach(([wk, t, d, ch]) => {
      const item = U.el('div', { class: 'rm-item' + (S.roadmap[wk] ? ' done' : '') });
      item.innerHTML = `<div class="wk">WEEK ${wk}</div><h4>${t}</h4><p>${d} <a href="#/ch/${ch}">→ Chapter ${ch}</a></p>`;
      const cb = U.el('input', { type: 'checkbox' }); cb.checked = !!S.roadmap[wk];
      cb.style.cssText = 'width:18px;height:18px;accent-color:var(--ok);cursor:pointer';
      cb.onchange = () => { S.roadmap[wk] = cb.checked; item.classList.toggle('done', cb.checked); CV.save(); paint(); if (cb.checked) CV.addXP(10, `Week ${wk} done`); };
      const lab = U.el('label', {}, cb); item.append(lab);
      list.append(item);
    });
    paint();
  });

  /* ---------------- project ladder ---------------- */
  CV.widget('projects', { title: 'Project ladder', desc: 'Pick a level. Each project links to the chapters you need.', tag: 'Projects' }, (body) => {
    const P = [
      [1, 'Digit or fashion-item classifier (MNIST, Fashion-MNIST), then CIFAR-10 with a CNN.', [6, 7]],
      [1, 'Document scanner: edge detection, contour finding, perspective warp.', [3]],
      [1, 'Face detection with a pretrained detector and an app that blurs faces.', [12]],
      [1, 'Colour-based object tracker with HSV masks.', [2]],
      [2, 'Custom image classifier with transfer learning on your own photos (plants, food, defects) and a small web demo.', [9]],
      [2, 'Custom object detector with YOLO (hard hats, vehicles, shelf products); report mAP, PR curves and a failure analysis.', [10]],
      [2, 'Semantic segmentation of roads, buildings, leaves or medical images with U-Net.', [11]],
      [2, 'Object counting and speed estimation: detector + tracker + homography to the ground plane.', [10, 12, 3]],
      [2, 'Visual search engine: DINOv2 or CLIP embeddings + FAISS.', [14, 12]],
      [2, 'OCR pipeline: detect text regions, recognise, extract fields from receipts.', [12]],
      [3, 'Implement a mini detector (anchor-free, FPN, simple assigner) from scratch and compare with a library model.', [10]],
      [3, 'Reproduce a paper (ViT on CIFAR, a small DETR, MAE pretraining) and write up the differences.', [13, 14]],
      [3, 'Auto-labelling pipeline: Grounding DINO + SAM, human review, train a small YOLO, compare against hand labels.', [14, 10]],
      [3, 'Edge deployment: quantize and run a detector on Jetson or Raspberry Pi at real-time FPS, with a latency report.', [16]],
      [3, 'Multi-camera tracking with re-identification; or 3D reconstruction with COLMAP and Gaussian Splatting.', [12, 5]],
      [3, 'Domain-shift study: train on one dataset, test on another, apply augmentation/adaptation, quantify gains.', [17, 9]],
      [3, 'Fine-tune a vision-language model for a domain task (documents, medical, retail) and evaluate hallucination.', [14]],
    ];
    let lvl = 1;
    const top = U.el('div', { style: 'margin-bottom:14px' }); body.append(top);
    U.seg(top, [[1, '🌱 Beginner'], [2, '🌿 Intermediate'], [3, '🌳 Advanced']], lvl, (v) => { lvl = v; draw(); });
    const grid = U.el('div', { class: 'gloss-grid' }); body.append(grid);
    function draw() {
      grid.innerHTML = P.filter((p) => p[0] === lvl).map((p, i) => `<div class="gloss" style="animation:pageIn .4s ${i * 0.05}s both"><b>Project ${P.indexOf(p) + 1}</b><span>${p[1]}</span><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${p[2].map((c) => `<a class="pill" href="#/ch/${c}" style="text-decoration:none">Ch ${c}</a>`).join('')}</div></div>`).join('');
    }
    draw();
  });

  /* ---------------- searchable reference table ---------------- */
  CV.widget('ref-table', { title: 'Reference', desc: '', tag: 'Searchable' }, (body, opts) => {
    const data = CV.REF[opts.key];
    const inp = U.el('input', { placeholder: 'Filter…', type: 'text' });
    body.append(U.el('div', { class: 'filter-row' }, inp));
    const host = U.el('div'); body.append(host);
    function draw() {
      const q = inp.value.trim().toLowerCase();
      const rows = data.rows.filter((r) => !q || r.join(' ').toLowerCase().includes(q));
      host.innerHTML = `<div class="tbl-wrap" style="margin:0"><table><thead><tr>${data.head.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${i && data.mono && data.mono.includes(i) ? ' style="font-family:var(--mono);font-size:13px"' : ''}>${c}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${data.head.length}" style="color:var(--text-3)">No matches</td></tr>`}</tbody></table></div>`;
    }
    inp.oninput = draw;
    draw();
  });

  /* ---------------- method chooser ---------------- */
  CV.widget('chooser', { title: 'Which method should I start with?', desc: 'Pick what you need to do.', tag: 'Decision helper' }, (body) => {
    const C = [
      ['classify images with a few thousand labels', 'pretrained ConvNeXt / EfficientNet / ViT, fine-tuned', [9, 8]],
      ['classify with almost no labels', 'CLIP zero-shot, or DINOv2 features + linear head', [14]],
      ['find and box objects in real time', 'YOLO (n/s/m) fine-tuned on your data', [10]],
      ['get the highest detection accuracy (GPU available)', 'RT-DETR / DINO-style DETR, large YOLO, Cascade R-CNN', [10]],
      ['outline exact object shapes', 'YOLO-seg, Mask R-CNN, or SAM prompted by a detector', [11, 14]],
      ['segment every pixel into classes', 'U-Net with a pretrained encoder, SegFormer, Mask2Former', [11]],
      ['track objects in video', 'YOLO + ByteTrack', [12]],
      ['detect arbitrary text-described objects', 'Grounding DINO / YOLO-World', [14]],
      ['find defects with only normal samples', 'PatchCore / PaDiM', [12]],
      ['generate or edit images', 'Stable Diffusion family with ControlNet / LoRA', [15]],
      ['run on a tiny device', 'MobileNet / YOLO-n quantized to INT8', [16]],
    ];
    const grid = U.el('div', { style: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px' });
    const ans = U.el('div', { class: 'w-out', style: 'margin-top:14px;min-height:64px', html: 'I need to…' });
    body.append(grid, ans);
    C.forEach(([need, rec, chs], i) => {
      const b = U.el('button', { type: 'button', class: 'opt', style: 'font-size:13.5px;padding:10px 12px' }, U.el('span', { class: 'ol' }, String(i + 1)), U.el('span', {}, need));
      b.onclick = () => { grid.querySelectorAll('.opt').forEach((x) => x.classList.remove('right')); b.classList.add('right'); ans.innerHTML = `I need to <b>${need}</b>\n→ start with: <b>${rec}</b>\n\nread: ${chs.map((c) => `<a href="#/ch/${c}">Chapter ${c}</a>`).join(', ')}`; };
      grid.append(b);
    });
  });

  /* ---------------- glossary ---------------- */
  CV.widget('glossary', { title: 'Glossary', desc: 'Filter by term or meaning.', tag: 'Searchable' }, (body) => {
    const inp = U.el('input', { placeholder: 'Search 40 terms…', type: 'text' });
    const count = U.el('span', { class: 'pill' });
    body.append(U.el('div', { class: 'filter-row' }, inp, count));
    const grid = U.el('div', { class: 'gloss-grid' }); body.append(grid);
    function draw() {
      const q = inp.value.trim().toLowerCase();
      const items = CV.glossary.filter(([t, d]) => !q || t.toLowerCase().includes(q) || d.toLowerCase().includes(q));
      count.textContent = `${items.length} shown`;
      grid.innerHTML = items.map(([t, d], i) => `<div class="gloss" style="animation:pageIn .35s ${Math.min(i, 20) * 0.02}s both"><b>${t}</b><span>${d}</span></div>`).join('');
    }
    inp.oninput = draw;
    draw();
  });

  /* ---------------- interview flashcards ---------------- */
  CV.widget('flashcards', { title: 'Interview-style flashcards', desc: 'Say your answer out loud, flip, then mark how you did. Cards you miss come back sooner.', tag: 'Practice' }, (body) => {
    const all = CV.INTERVIEW.flatMap(([sec, qs]) => qs.map(([q, a]) => ({ sec, q, a })));
    let deck = all.slice(), i = 0, known = 0, again = 0, sec = 'all';
    const top = U.el('div', { class: 'filter-row' }); body.append(top);
    U.seg(top, [['all', 'All'], ...CV.INTERVIEW.map(([s]) => [s, s])], sec, (v) => { sec = v; deck = all.filter((c) => v === 'all' || c.sec === v); i = 0; known = again = 0; draw(); });
    U.button(top, '🔀 Shuffle', () => { deck.sort(() => Math.random() - 0.5); i = 0; draw(); });
    const stageEl = U.el('div', { class: 'flash-stage' }); body.append(stageEl);
    const flip = U.el('div', { class: 'flip' });
    const inner = U.el('div', { class: 'flip-inner' });
    const front = U.el('div', { class: 'flip-face' }), back = U.el('div', { class: 'flip-face flip-back' });
    inner.append(front, back); flip.append(inner);
    flip.onclick = () => flip.classList.toggle('on');
    const btns = U.el('div', { class: 'w-btns' });
    const prog = U.el('div', { class: 'w-note', style: 'text-align:center' });
    stageEl.append(prog, flip, btns);
    U.button(btns, '✗ Again', () => { again++; deck.splice(Math.min(deck.length, i + 3), 0, deck[i]); next(); }, 'btn btn-sm');
    U.button(btns, '✓ Got it', () => { known++; next(); }, 'btn btn-sm btn-primary');
    function next() { flip.classList.remove('on'); setTimeout(() => { i++; if (i >= deck.length) { i = 0; CV.confetti(); } draw(); }, 250); }
    function draw() {
      const c = deck[i];
      front.innerHTML = `<span class="q-n">${c.sec} · card ${i + 1} / ${deck.length}</span><div class="q-t">${c.q}</div><span class="hint" style="margin:14px auto 0">↻ tap to flip</span>`;
      back.innerHTML = `<span class="q-n">Answer</span><div class="q-a">${c.a}</div>`;
      prog.innerHTML = `<span style="color:var(--ok)">✓ ${known} known</span> · <span style="color:var(--warn)">↺ ${again} to revisit</span>`;
    }
    draw();
  });
})();
