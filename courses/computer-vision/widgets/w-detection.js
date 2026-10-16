/* Widgets for Chapter 10: object detection (+ the shared flow-diagram renderer) */
(function () {
  'use strict';
  const U = CV.util;

  /* =================== generic animated flow diagram =================== */
  CV.DIAGRAMS = CV.DIAGRAMS || {};
  CV.widget('flow', { title: 'Architecture diagram', desc: '', tag: 'Diagram' }, (body, opts) => {
    const keys = opts.d.split(',');
    let cur = keys[0];
    if (keys.length > 1) { const top = U.el('div', { style: 'margin-bottom:12px' }); body.append(top); U.seg(top, keys.map((k) => [k, CV.DIAGRAMS[k].name]), cur, (v) => { cur = v; build(); }); }
    const host = U.el('div', { class: 'canvas-box', style: 'display:flex;justify-content:center' }); body.append(host);
    const cap = U.el('div', { class: 'w-note' }); body.append(cap);
    let c, ctx, D, t = 0, hover = null, loop;
    function build() {
      D = CV.DIAGRAMS[cur];
      host.innerHTML = '';
      ({ c, ctx } = U.canvas(D.w, D.h, { cssW: D.w }));
      host.append(c);
      cap.innerHTML = D.caption || '';
      c.onpointermove = (e) => { const p = U.mouse(c, e); hover = Object.entries(D.nodes).find(([, n]) => p.x > n[0] && p.x < n[0] + n[2] && p.y > n[1] && p.y < n[1] + n[3]); hover = hover ? hover[0] : null; };
      c.onpointerleave = () => (hover = null);
      if (loop) loop.stop();
      loop = U.loop(c, frame);
    }
    const anchor = (n, toward) => {
      const [x, y, w, h] = n, cx = x + w / 2, cy = y + h / 2, dx = toward[0] - cx, dy = toward[1] - cy;
      const sx = Math.abs(dx) / (w / 2 + 1e-6), sy = Math.abs(dy) / (h / 2 + 1e-6), s = Math.max(sx, sy) || 1;
      return [cx + dx / s, cy + dy / s];
    };
    function frame(dt) {
      t += dt;
      const pal = U.palette();
      ctx.clearRect(0, 0, D.w, D.h);
      (D.groups || []).forEach(([x, y, w, h, label, ci]) => {
        ctx.strokeStyle = pal[ci % pal.length]; ctx.globalAlpha = 0.5; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.2;
        U.roundRect(ctx, x, y, w, h, 12); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.fillStyle = pal[ci % pal.length]; ctx.font = '700 11px Inter'; ctx.textAlign = 'left'; ctx.fillText(label.toUpperCase(), x + 10, y + 16);
      });
      D.edges.forEach(([a, b, o = {}], i) => {
        const A = D.nodes[a], B = D.nodes[b];
        const ca = [A[0] + A[2] / 2, A[1] + A[3] / 2], cb = [B[0] + B[2] / 2, B[1] + B[3] / 2];
        let pts;
        if (o.via) pts = [anchor(A, o.via[0]), ...o.via, anchor(B, o.via[o.via.length - 1])];
        else pts = [anchor(A, cb), anchor(B, ca)];
        const lit = hover && (hover === a || hover === b);
        const col = o.c != null ? pal[o.c % pal.length] : U.css('--text-3');
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lit ? 2.6 : 1.6; ctx.globalAlpha = hover && !lit ? 0.3 : 0.9;
        if (o.dash) { ctx.setLineDash([6, 5]); ctx.lineDashOffset = -t * 24; }
        ctx.beginPath(); pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.setLineDash([]);
        const [p1, p2] = [pts[pts.length - 2], pts[pts.length - 1]];
        U.arrow(ctx, p1[0] + (p2[0] - p1[0]) * 0.9, p1[1] + (p2[1] - p1[1]) * 0.9, p2[0], p2[1], 7);
        if (o.label) { const m = pts[Math.floor((pts.length - 1) / 2)], m2 = pts[Math.floor((pts.length - 1) / 2) + 1]; ctx.font = '600 10.5px Inter'; ctx.textAlign = 'center'; ctx.globalAlpha = 1; ctx.fillStyle = U.css('--text-2'); ctx.fillText(o.label, (m[0] + m2[0]) / 2, (m[1] + m2[1]) / 2 - 5); }
        // travelling pulse
        let L = 0; const seg = []; for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(d); L += d; }
        let s = ((t * 70 + i * 37) % (L + 60)); if (s <= L) { let k = 0; while (k < seg.length - 1 && s > seg[k]) { s -= seg[k]; k++; } const f = seg[k] ? s / seg[k] : 0; const x = U.lerp(pts[k][0], pts[k + 1][0], f), y = U.lerp(pts[k][1], pts[k + 1][1], f); ctx.globalAlpha = 1; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
        ctx.globalAlpha = 1;
      });
      Object.entries(D.nodes).forEach(([id, [x, y, w, h, label, ci, sub]]) => {
        const col = ci == null ? U.css('--border-2') : pal[ci % pal.length], lit = hover === id;
        ctx.fillStyle = U.css('--surface-2'); ctx.strokeStyle = col; ctx.lineWidth = lit ? 2.6 : 1.6;
        if (lit) { ctx.shadowColor = col; ctx.shadowBlur = 18; }
        U.roundRect(ctx, x, y, w, h, 9); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
        ctx.fillStyle = col; ctx.globalAlpha = 0.14; U.roundRect(ctx, x, y, w, h, 9); ctx.fill(); ctx.globalAlpha = 1;
        ctx.fillStyle = U.css('--text'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lines = label.split('\n');
        ctx.font = `700 ${lines.length > 1 || w < 90 ? 11 : 12}px Inter`;
        lines.forEach((ln, k) => ctx.fillText(ln, x + w / 2, y + h / 2 + (k - (lines.length - 1) / 2) * 13 - (sub ? 6 : 0)));
        if (sub) { ctx.font = '10px JetBrains Mono'; ctx.fillStyle = U.css('--text-3'); ctx.fillText(sub, x + w / 2, y + h / 2 + 9 + ((lines.length - 1) * 13) / 2); }
        ctx.textBaseline = 'alphabetic';
      });
      if (hover && D.tips && D.tips[hover]) {
        const n = D.nodes[hover], tip = D.tips[hover];
        ctx.font = '12px Inter'; const tw = Math.min(300, ctx.measureText(tip).width + 20);
        let tx = U.clamp(n[0] + n[2] / 2 - tw / 2, 4, D.w - tw - 4), ty = n[1] + n[3] + 8; if (ty + 30 > D.h) ty = n[1] - 36;
        ctx.fillStyle = 'rgba(0,0,0,.92)'; U.roundRect(ctx, tx, ty, tw, 28, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(tip.length > 48 ? tip.slice(0, 46) + '…' : tip, tx + 10, ty + 18);
      }
    }
    build();
    return () => loop && loop.stop();
  });

  Object.assign(CV.DIAGRAMS, {
    fasterrcnn: {
      name: 'Faster R-CNN (two-stage)', w: 760, h: 250,
      caption: 'The RPN shares backbone features and proposes regions; RoI Align crops a fixed 7×7 feature per proposal; the head classifies and refines each box. Hover nodes for details.',
      nodes: { img: [10, 95, 80, 56, 'image', 0], bb: [120, 95, 110, 56, 'backbone\n(+ FPN)', 1], rpn: [270, 20, 130, 56, 'RPN', 2, '3×3 conv, k anchors'], ra: [270, 170, 130, 56, 'RoI Align', 3, '7×7 per proposal'], head: [450, 170, 120, 56, 'FC head', 1], cls: [620, 135, 120, 44, 'class', 4], box: [620, 200, 120, 44, 'box refine', 4], props: [450, 20, 140, 56, 'top proposals\n(after NMS)', 2] },
      edges: [['img', 'bb'], ['bb', 'rpn', { c: 2 }], ['bb', 'ra'], ['rpn', 'props', { c: 2 }], ['props', 'ra', { c: 2, dash: 1, via: [[520, 130], [335, 130]] }], ['ra', 'head'], ['head', 'cls', { c: 4 }], ['head', 'box', { c: 4 }]],
      tips: { rpn: 'objectness (2k) + box offsets (4k) per location', ra: 'bilinear sampling, no coordinate rounding', bb: 'ResNet-50/101; computed once per image' },
    },
    fpn: {
      name: 'Feature Pyramid Network', w: 640, h: 290,
      caption: 'Bottom-up backbone (left) is fine but semantically weak at the bottom. The top-down path upsamples ×2 and adds 1×1 lateral connections, so every level P2–P5 is both rich and well-localised.',
      groups: [[10, 10, 190, 270, 'bottom-up (backbone)', 0], [330, 10, 300, 270, 'top-down + lateral', 1]],
      nodes: { c2: [40, 225, 140, 40, 'C2  stride 4', 0], c3: [55, 165, 110, 40, 'C3  stride 8', 0], c4: [70, 105, 80, 40, 'C4  /16', 0], c5: [80, 45, 60, 40, 'C5 /32', 0], p5: [400, 45, 60, 40, 'P5', 1], p4: [390, 105, 80, 40, 'P4', 1], p3: [375, 165, 110, 40, 'P3', 1], p2: [360, 225, 140, 40, 'P2', 1], o5: [530, 45, 90, 40, 'large objs', 4], o2: [530, 225, 90, 40, 'small objs', 4] },
      edges: [['c2', 'c3'], ['c3', 'c4'], ['c4', 'c5'], ['c5', 'p5', { c: 2, label: '1×1' }], ['c4', 'p4', { c: 2, label: '1×1' }], ['c3', 'p3', { c: 2, label: '1×1' }], ['c2', 'p2', { c: 2, label: '1×1' }], ['p5', 'p4', { c: 1, label: '↑2×' }], ['p4', 'p3', { c: 1 }], ['p3', 'p2', { c: 1 }], ['p5', 'o5', { c: 4 }], ['p2', 'o2', { c: 4 }]],
      tips: { p2: 'high resolution: small objects', p5: 'coarse, very semantic: large objects' },
    },
    yolo: {
      name: 'YOLOv8 anatomy', w: 780, h: 300,
      caption: 'Backbone (CSPDarknet with C2f + SPPF) → PAN-FPN neck (top-down then bottom-up) → decoupled anchor-free heads at strides 8/16/32. For a 640 input: 80² + 40² + 20² = 8400 candidates.',
      groups: [[10, 10, 230, 280, 'backbone', 0], [260, 10, 260, 280, 'neck: PAN-FPN', 1], [540, 10, 230, 280, 'decoupled heads', 2]],
      nodes: { in: [30, 40, 90, 34, '640×640×3', null], stem: [30, 90, 190, 34, 'Conv s2 + C2f stages', 0], p3: [30, 140, 60, 34, 'P3/8', 0], p4: [100, 140, 60, 34, 'P4/16', 0], p5: [170, 140, 60, 34, 'P5/32', 0], sppf: [150, 200, 80, 34, 'SPPF', 0], td: [280, 70, 220, 34, 'top-down: up + concat + C2f', 1], bu: [280, 200, 220, 34, 'bottom-up: conv s2 + concat', 1], h80: [560, 40, 190, 42, '80×80 (stride 8)', 2, 'cls BCE | box DFL'], h40: [560, 120, 190, 42, '40×40 (stride 16)', 2, 'cls | box'], h20: [560, 200, 190, 42, '20×20 (stride 32)', 2, 'cls | box'] },
      edges: [['in', 'stem'], ['stem', 'p3'], ['stem', 'p4'], ['stem', 'p5'], ['p5', 'sppf'], ['sppf', 'td', { c: 1 }], ['p4', 'td', { c: 1 }], ['p3', 'td', { c: 1 }], ['td', 'bu', { c: 1 }], ['td', 'h80', { c: 2 }], ['bu', 'h40', { c: 2 }], ['bu', 'h20', { c: 2 }]],
      tips: { sppf: 'three 5×5 max-pools, concatenated', h80: 'distances l,t,r,b via 16-bin DFL', td: 'spreads semantics to high-res maps' },
    },
    detr: {
      name: 'DETR', w: 780, h: 230,
      caption: 'CNN features are flattened with positional encodings; a transformer encoder lets every location see the whole image; N learned object queries decode into a fixed-size set; Hungarian matching gives one-to-one targets, so no anchors and no NMS.',
      nodes: { img: [10, 90, 70, 50, 'image', 0], cnn: [100, 90, 90, 50, 'CNN\n(ResNet-50)', 1], flat: [210, 90, 110, 50, '1×1 conv,\nflatten + pos', 1], enc: [345, 90, 110, 50, 'transformer\nencoder', 2], dec: [490, 90, 110, 50, 'transformer\ndecoder', 2], q: [490, 10, 110, 40, 'N=100 queries', 3], ffn: [630, 90, 120, 50, 'FFN per query', 4, 'class + box'], hm: [630, 170, 120, 44, 'Hungarian match', 4] },
      edges: [['img', 'cnn'], ['cnn', 'flat'], ['flat', 'enc'], ['enc', 'dec', { label: 'cross-attn' }], ['q', 'dec', { c: 3 }], ['dec', 'ffn'], ['ffn', 'hm', { c: 4, dash: 1 }]],
      tips: { q: 'learned embeddings, each claims ≤ 1 object', hm: 'cost = cls + L1 + GIoU; unmatched → "no object"' },
    },
  });

  /* =================== IoU and box losses =================== */
  const iouOf = (a, b) => { const ix = Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])), iy = Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])), I = ix * iy, A = (a[2] - a[0]) * (a[3] - a[1]), B = (b[2] - b[0]) * (b[3] - b[1]); return I / (A + B - I || 1); };
  U.iou = iouOf;

  CV.widget('iou', { title: 'IoU, GIoU, DIoU and CIoU', desc: 'Drag the boxes (or their bottom-right corner to resize). Note that plain IoU is 0 for every non-overlapping position.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let A = [80, 70, 230, 210], B = [170, 120, 330, 250], drag = null;
    const out = U.out(ctl);
    function metrics() {
      const iou = iouOf(A, B);
      const C = [Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.max(A[2], B[2]), Math.max(A[3], B[3])];
      const ix = Math.max(0, Math.min(A[2], B[2]) - Math.max(A[0], B[0])), iy = Math.max(0, Math.min(A[3], B[3]) - Math.max(A[1], B[1]));
      const aA = (A[2] - A[0]) * (A[3] - A[1]), aB = (B[2] - B[0]) * (B[3] - B[1]), U_ = aA + aB - ix * iy, aC = (C[2] - C[0]) * (C[3] - C[1]);
      const giou = iou - (aC - U_) / aC;
      const rho2 = ((A[0] + A[2]) / 2 - (B[0] + B[2]) / 2) ** 2 + ((A[1] + A[3]) / 2 - (B[1] + B[3]) / 2) ** 2, c2 = (C[2] - C[0]) ** 2 + (C[3] - C[1]) ** 2;
      const diou = iou - rho2 / c2;
      const v = (4 / Math.PI ** 2) * (Math.atan((B[2] - B[0]) / (B[3] - B[1])) - Math.atan((A[2] - A[0]) / (A[3] - A[1]))) ** 2, alpha = v / (1 - iou + v + 1e-9);
      return { iou, giou, diou, ciou: diou - alpha * v, C, inter: ix * iy, uni: U_ };
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const m = metrics();
      ctx.strokeStyle = U.css('--text-3'); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.strokeRect(m.C[0], m.C[1], m.C[2] - m.C[0], m.C[3] - m.C[1]); ctx.setLineDash([]);
      ctx.fillStyle = U.css('--text-3'); ctx.font = '11px Inter'; ctx.fillText('C (enclosing)', m.C[0] + 4, m.C[1] - 4);
      [[A, U.css('--accent'), 'prediction'], [B, U.css('--accent-3'), 'ground truth']].forEach(([b, col, lab]) => {
        ctx.fillStyle = col; ctx.globalAlpha = 0.15; ctx.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); ctx.globalAlpha = 1;
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
        ctx.fillRect(b[2] - 6, b[3] - 6, 12, 12);
        ctx.fillStyle = col; ctx.font = '600 12px Inter'; ctx.fillText(lab, b[0] + 4, b[1] + 15);
      });
      const ix0 = Math.max(A[0], B[0]), iy0 = Math.max(A[1], B[1]), ix1 = Math.min(A[2], B[2]), iy1 = Math.min(A[3], B[3]);
      if (ix1 > ix0 && iy1 > iy0) { ctx.fillStyle = 'rgba(76,175,125,.45)'; ctx.fillRect(ix0, iy0, ix1 - ix0, iy1 - iy0); }
      ctx.strokeStyle = U.css('--warn'); ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo((A[0] + A[2]) / 2, (A[1] + A[3]) / 2); ctx.lineTo((B[0] + B[2]) / 2, (B[1] + B[3]) / 2); ctx.stroke(); ctx.setLineDash([]);
      const bar = (v) => `${'█'.repeat(Math.round(Math.max(0, (v + 1) / 2) * 14)).padEnd(14, '·')}`;
      out.innerHTML = `intersection ${Math.round(m.inter)}   union ${Math.round(m.uni)}\n\n<b>IoU </b> ${m.iou.toFixed(3)}  ${bar(m.iou)}\n<b>GIoU</b> ${m.giou.toFixed(3)}  ${bar(m.giou)}\n<b>DIoU</b> ${m.diou.toFixed(3)}  ${bar(m.diou)}\n<b>CIoU</b> ${m.ciou.toFixed(3)}  ${bar(m.ciou)}\n\nloss = 1 − metric. ${m.iou === 0 ? '<span style="color:var(--warn)">IoU loss has zero gradient here; GIoU/DIoU still pull the boxes together.</span>' : m.iou > 0.5 ? '<span style="color:var(--ok)">IoU &gt; 0.5 → true positive at mAP@0.5</span>' : ''}`;
    }
    c.addEventListener('pointerdown', (e) => {
      const p = U.mouse(c, e);
      for (const b of [B, A]) {
        if (Math.abs(p.x - b[2]) < 12 && Math.abs(p.y - b[3]) < 12) { drag = { b, mode: 'resize' }; return; }
        if (p.x > b[0] && p.x < b[2] && p.y > b[1] && p.y < b[3]) { drag = { b, mode: 'move', ox: p.x - b[0], oy: p.y - b[1] }; return; }
      }
    });
    c.addEventListener('pointermove', (e) => {
      const p = U.mouse(c, e);
      if (!drag) { c.style.cursor = [A, B].some((b) => Math.abs(p.x - b[2]) < 12 && Math.abs(p.y - b[3]) < 12) ? 'nwse-resize' : [A, B].some((b) => p.x > b[0] && p.x < b[2] && p.y > b[1] && p.y < b[3]) ? 'move' : 'default'; return; }
      const b = drag.b;
      if (drag.mode === 'move') { const w = b[2] - b[0], h = b[3] - b[1]; b[0] = U.clamp(p.x - drag.ox, 0, W - w); b[1] = U.clamp(p.y - drag.oy, 0, H - h); b[2] = b[0] + w; b[3] = b[1] + h; }
      else { b[2] = U.clamp(p.x, b[0] + 20, W); b[3] = U.clamp(p.y, b[1] + 20, H); }
      draw();
    });
    addEventListener('pointerup', () => (drag = null));
    draw();
  });

  /* =================== box formats =================== */
  CV.widget('box-formats', { title: 'Box formats: xyxy, xywh, cxcywh', desc: 'Drag across the image to draw a box and see it in every common format, including the YOLO label line.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 640, H = 440;
    const { c, ctx } = U.canvas(W, H, { cssW: 460 });
    c.style.cursor = 'crosshair';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let box = [352, 354, 444, 416], start = null, cls = 2;
    const out = U.out(ctl);
    function draw() {
      ctx.drawImage(U.defaultScene(W, H), 0, 0, W, H);
      const [x1, y1, x2, y2] = box;
      ctx.strokeStyle = '#5b9cf5'; ctx.lineWidth = 3; ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillStyle = '#e07a5f'; ctx.beginPath(); ctx.arc((x1 + x2) / 2, (y1 + y2) / 2, 5, 0, 7); ctx.fill();
      const w = x2 - x1, h = y2 - y1, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      out.innerHTML = `image: ${W} × ${H}\n\n<b>xyxy</b>   [${x1 | 0}, ${y1 | 0}, ${x2 | 0}, ${y2 | 0}]   OpenCV, many APIs\n<b>xywh</b>   [${x1 | 0}, ${y1 | 0}, ${w | 0}, ${h | 0}]   COCO JSON\n<b>cxcywh</b> [${(cx / W).toFixed(3)}, ${(cy / H).toFixed(3)}, ${(w / W).toFixed(3)}, ${(h / H).toFixed(3)}]\n         normalised 0–1 (YOLO, DETR)\n\n<b>YOLO .txt line</b>\n${cls} ${(cx / W).toFixed(3)} ${(cy / H).toFixed(3)} ${(w / W).toFixed(3)} ${(h / H).toFixed(3)}`;
    }
    c.addEventListener('pointerdown', (e) => { const p = U.mouse(c, e); start = [p.x, p.y]; });
    c.addEventListener('pointermove', (e) => { if (!start) return; const p = U.mouse(c, e); box = [Math.min(start[0], p.x), Math.min(start[1], p.y), Math.max(start[0], p.x), Math.max(start[1], p.y)]; draw(); });
    addEventListener('pointerup', () => (start = null));
    draw();
  });

  /* =================== NMS step-through =================== */
  CV.widget('nms', { title: 'Non-maximum suppression, step by step', desc: 'Sort by score, keep the best, delete same-class boxes overlapping it more than the threshold, repeat.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 480, H = 330, s = W / 320;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let thr = 0.5, soft = false, boxes, step = 0, kept, removed, order;
    const gen = () => {
      const r = U.rand(5), base = [[20, 84, 106, 162, 0.92], [176, 177, 222, 208, 0.95], [242, 86, 303, 160, 0.88], [110, 150, 140, 188, 0.7]];
      boxes = [];
      base.forEach((b) => { boxes.push(b.slice()); for (let k = 0; k < 3; k++) { const j = (v) => v + (r() - 0.5) * 18; const nb = [j(b[0]), j(b[1]), j(b[2]), j(b[3])]; nb.push(Math.max(0.3, b[4] - 0.1 - r() * 0.4)); boxes.push(nb); } });
      boxes.forEach((b, i) => { b[5] = i; b[6] = b[4]; });
    };
    const reset = () => { gen(); step = 0; kept = []; removed = new Set(); order = boxes.slice().sort((a, b) => b[4] - a[4]); };
    U.slider(ctl, { label: 'IoU threshold', min: 0.1, max: 0.9, step: 0.05, value: thr, onInput: (v) => { thr = v; reset(); draw(); } });
    U.check(ctl, 'Soft-NMS (decay scores instead of deleting)', soft, (v) => { soft = v; reset(); draw(); });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'Step →', () => { advance(); draw(); }, 'btn btn-sm btn-primary');
    U.button(bb, 'Run all', () => { while (advance()); draw(); });
    U.button(bb, '↺ Reset', () => { reset(); draw(); });
    const out = U.out(ctl);
    let last = null;
    function advance() {
      const remaining = order.filter((b) => !removed.has(b[5]) && !kept.includes(b) && b[6] > 0.25);
      if (!remaining.length) return false;
      remaining.sort((a, b) => b[6] - a[6]);
      const best = remaining[0]; kept.push(best); last = { best, sup: [] };
      remaining.slice(1).forEach((b) => {
        const o = iouOf(best, b);
        if (o > thr) { if (soft) { b[6] *= 1 - o; if (b[6] < 0.25) { removed.add(b[5]); last.sup.push(b); } } else { removed.add(b[5]); last.sup.push(b); } }
      });
      step++;
      return true;
    }
    function draw() {
      ctx.drawImage(U.defaultScene(W, H), 0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, H);
      boxes.forEach((b) => {
        const isKept = kept.includes(b), isRem = removed.has(b[5]), justSup = last && last.sup.includes(b);
        if (isRem && !justSup) return;
        ctx.strokeStyle = isKept ? '#4caf7d' : justSup ? '#e5604d' : 'rgba(91,156,245,.75)';
        ctx.lineWidth = isKept ? 3 : 1.5; ctx.setLineDash(justSup ? [5, 4] : []);
        ctx.strokeRect(b[0] * s, b[1] * s, (b[2] - b[0]) * s, (b[3] - b[1]) * s); ctx.setLineDash([]);
        if (isKept || justSup || !isRem) { ctx.fillStyle = ctx.strokeStyle; ctx.font = '600 10.5px JetBrains Mono'; ctx.fillText(b[6].toFixed(2), b[0] * s + 2, b[1] * s - 3); }
      });
      const remaining = boxes.length - kept.length - removed.size;
      out.innerHTML = `step <b>${step}</b>\n<span style="color:var(--ok)">■ kept: ${kept.length}</span>   <span style="color:var(--bad)">■ suppressed: ${removed.size}</span>   pending: ${Math.max(0, remaining)}\n${last ? `\nkept box with score ${last.best[4].toFixed(2)}; ${last.sup.length ? `removed ${last.sup.length} box(es) with IoU &gt; ${thr}` : 'nothing overlapped enough'}` : '\nPress Step to start.'}\n\nkeep = torchvision.ops.nms(boxes, scores, ${thr})`;
    }
    reset(); draw();
  });

  /* =================== anchors & box encoding =================== */
  CV.widget('anchors', { title: 'Anchor boxes and offset encoding', desc: 'Nine anchors (3 scales × 3 aspect ratios) sit at a location. The network predicts small offsets that turn the best anchor into the object box. Drag the ground-truth box.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let gt = [250, 90, 360, 230], drag = null;
    const cx0 = 220, cy0 = 150;
    const anchors = []; [40, 70, 110].forEach((sc) => [0.5, 1, 2].forEach((r) => anchors.push([cx0, cy0, sc * Math.sqrt(r), sc / Math.sqrt(r)])));
    const out = U.out(ctl);
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = U.css('--border'); ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const ious = anchors.map(([x, y, w, h]) => iouOf([x - w / 2, y - h / 2, x + w / 2, y + h / 2], gt));
      const bi = ious.indexOf(Math.max(...ious));
      anchors.forEach(([x, y, w, h], i) => {
        const pos = ious[i] > 0.5, neg = ious[i] < 0.3;
        ctx.strokeStyle = i === bi ? '#4caf7d' : pos ? 'rgba(76,175,125,.6)' : neg ? 'rgba(229,96,77,.35)' : 'rgba(212,167,58,.5)';
        ctx.lineWidth = i === bi ? 3 : 1.2; ctx.strokeRect(x - w / 2, y - h / 2, w, h);
      });
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx0, cy0, 4, 0, 7); ctx.fill();
      ctx.strokeStyle = '#e07a5f'; ctx.lineWidth = 2.5; ctx.strokeRect(gt[0], gt[1], gt[2] - gt[0], gt[3] - gt[1]);
      ctx.fillStyle = '#e07a5f'; ctx.font = '600 12px Inter'; ctx.fillText('ground truth', gt[0] + 4, gt[1] - 6);
      const [xa, ya, wa, ha] = anchors[bi], x = (gt[0] + gt[2]) / 2, y = (gt[1] + gt[3]) / 2, w = gt[2] - gt[0], h = gt[3] - gt[1];
      out.innerHTML = `best anchor IoU = <b>${ious[bi].toFixed(2)}</b> (${ious[bi] > 0.5 ? '<span style="color:var(--ok)">positive</span>' : ious[bi] < 0.3 ? '<span style="color:var(--bad)">negative</span>' : '<span style="color:var(--warn)">ignored</span>'})\n\nt_x = (x − x_a)/w_a = <b>${((x - xa) / wa).toFixed(3)}</b>\nt_y = (y − y_a)/h_a = <b>${((y - ya) / ha).toFixed(3)}</b>\nt_w = log(w/w_a)    = <b>${Math.log(w / wa).toFixed(3)}</b>\nt_h = log(h/h_a)    = <b>${Math.log(h / ha).toFixed(3)}</b>\n\n<span style="color:#4caf7d">■</span> IoU &gt; 0.5  <span style="color:#d4a73a">■</span> ignore  <span style="color:#e5604d">■</span> IoU &lt; 0.3`;
    }
    c.addEventListener('pointerdown', (e) => { const p = U.mouse(c, e); if (Math.abs(p.x - gt[2]) < 12 && Math.abs(p.y - gt[3]) < 12) drag = 'r'; else if (p.x > gt[0] && p.x < gt[2] && p.y > gt[1] && p.y < gt[3]) drag = [p.x - gt[0], p.y - gt[1]]; });
    c.addEventListener('pointermove', (e) => { if (!drag) return; const p = U.mouse(c, e); if (drag === 'r') { gt[2] = Math.max(gt[0] + 15, p.x); gt[3] = Math.max(gt[1] + 15, p.y); } else { const w = gt[2] - gt[0], h = gt[3] - gt[1]; gt = [p.x - drag[0], p.y - drag[1], p.x - drag[0] + w, p.y - drag[1] + h]; } draw(); });
    addEventListener('pointerup', () => (drag = null));
    c.style.cursor = 'move';
    draw();
  });

  /* =================== YOLO grid =================== */
  CV.widget('yolo-grid', { title: 'YOLOv1: one grid cell per object centre', desc: 'Each object is assigned to the cell containing its centre. Change S, B and C to see the output tensor size.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 448, H = 448;
    const { c, ctx } = U.canvas(W, H, { cssW: 420 });
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let S = 7, B = 2, C = 20, hov = null;
    U.slider(ctl, { label: 'Grid S', min: 3, max: 13, value: S, onInput: (v) => { S = v; draw(); } });
    U.slider(ctl, { label: 'Boxes per cell B', min: 1, max: 5, value: B, onInput: (v) => { B = v; draw(); } });
    U.slider(ctl, { label: 'Classes C', min: 1, max: 80, value: C, onInput: (v) => { C = v; draw(); } });
    const out = U.out(ctl);
    const objs = [['house', 20, 84, 106, 162, '#e07a5f'], ['sign', 110, 150, 140, 188, '#d4a73a'], ['car', 176, 177, 222, 208, '#5b9cf5'], ['tree', 242, 86, 303, 160, '#4caf7d']];
    function draw() {
      const sx = W / 320, sy = H / 220;
      ctx.drawImage(U.defaultScene(W, H), 0, 0, W, H);
      const cs = W / S;
      objs.forEach(([n, x1, y1, x2, y2, col]) => {
        const cx = ((x1 + x2) / 2) * sx, cy = ((y1 + y2) / 2) * sy, gi = Math.floor(cx / cs), gj = Math.floor(cy / (H / S));
        ctx.fillStyle = col; ctx.globalAlpha = 0.35; ctx.fillRect(gi * cs, gj * (H / S), cs, H / S); ctx.globalAlpha = 1;
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.strokeRect(x1 * sx, y1 * sy, (x2 - x1) * sx, (y2 - y1) * sy);
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1;
      for (let i = 1; i < S; i++) { ctx.beginPath(); ctx.moveTo(i * cs, 0); ctx.lineTo(i * cs, H); ctx.moveTo(0, (i * H) / S); ctx.lineTo(W, (i * H) / S); ctx.stroke(); }
      const per = B * 5 + C;
      out.innerHTML = `output tensor: S × S × (B·5 + C)\n= ${S} × ${S} × (${B}·5 + ${C})\n= ${S} × ${S} × <b>${per}</b> = ${U.fmtInt(S * S * per)} numbers\n\neach box: (x, y, w, h, confidence)\nclass probabilities shared per cell\n\nYOLOv1 (VOC): 7 × 7 × 30\nWeak spot: one class per cell → flocks of\nsmall objects in one cell are missed.`;
    }
    draw();
  });

  /* =================== precision-recall and AP =================== */
  CV.widget('ap-curve', { title: 'Building a precision–recall curve and AP', desc: 'Predictions are sorted by confidence. Click a row to flip it between TP and FP and watch the curve and AP change.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 380px' });
    const W = 400, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let nGT = 8;
    const preds = [[0.97, 1], [0.94, 1], [0.91, 0], [0.88, 1], [0.84, 1], [0.79, 0], [0.75, 1], [0.66, 0], [0.61, 1], [0.52, 0], [0.47, 1], [0.33, 0]];
    U.slider(ctl, { label: 'Ground-truth objects', min: 6, max: 12, value: nGT, onInput: (v) => { nGT = v; draw(); } });
    const list = U.el('div', { style: 'display:grid;grid-template-columns:repeat(2,1fr);gap:4px;font-family:var(--mono);font-size:12px' });
    ctl.append(list);
    const out = U.out(ctl);
    function draw() {
      let tp = 0, fp = 0; const P = [], R = [];
      preds.forEach(([, t]) => { t ? tp++ : fp++; P.push(tp / (tp + fp)); R.push(Math.min(1, tp / nGT)); });
      const Pi = P.map((_, i) => Math.max(...P.slice(i)));
      let ap = 0, prevR = 0; R.forEach((r, i) => { ap += (r - prevR) * Pi[i]; prevR = r; });
      ctx.clearRect(0, 0, W, H);
      const pl = U.plot(ctx, W, H, { x0: 0, x1: 1, y0: 0, y1: 1.05, xticks: 5, yticks: 5, xlabel: 'recall', ylabel: 'precision' });
      ctx.fillStyle = 'rgba(157,143,214,.25)'; ctx.beginPath(); ctx.moveTo(pl.X(0), pl.Y(0));
      let pr = 0; R.forEach((r, i) => { ctx.lineTo(pl.X(pr), pl.Y(Pi[i])); ctx.lineTo(pl.X(r), pl.Y(Pi[i])); pr = r; }); ctx.lineTo(pl.X(pr), pl.Y(0)); ctx.closePath(); ctx.fill();
      pl.line(R.map((r, i) => [r, P[i]]), U.css('--accent'), 2);
      ctx.strokeStyle = U.css('--accent-2'); ctx.lineWidth = 2.5; ctx.beginPath(); pr = 0; R.forEach((r, i) => { i ? ctx.lineTo(pl.X(pr), pl.Y(Pi[i])) : ctx.moveTo(pl.X(0), pl.Y(Pi[0])); ctx.lineTo(pl.X(r), pl.Y(Pi[i])); pr = r; }); ctx.stroke();
      R.forEach((r, i) => { ctx.fillStyle = preds[i][1] ? U.css('--ok') : U.css('--bad'); ctx.beginPath(); ctx.arc(pl.X(r), pl.Y(P[i]), 4, 0, 7); ctx.fill(); });
      list.innerHTML = preds.map(([s, t], i) => `<button type="button" data-i="${i}" style="cursor:pointer;border-radius:6px;padding:4px 6px;border:1px solid var(--border);background:${t ? 'rgba(76,175,125,.18)' : 'rgba(229,96,77,.15)'};color:var(--text);font:inherit;text-align:left">${s.toFixed(2)} ${t ? 'TP' : 'FP'}</button>`).join('');
      list.querySelectorAll('button').forEach((b) => (b.onclick = () => { const p = preds[+b.dataset.i]; p[1] = 1 - p[1]; draw(); }));
      out.innerHTML = `<b>AP = ${(ap * 100).toFixed(1)}%</b>  (shaded area)\n<span style="color:var(--accent)">━ raw P–R</span>  <span style="color:var(--accent-2)">━ interpolated (max P at ≥ R)</span>\nmissed objects (FN): ${Math.max(0, nGT - preds.filter((p) => p[1]).length)}`;
    }
    draw();
  });

  /* =================== focal loss =================== */
  CV.widget('focal-loss', { title: 'Focal loss: FL(p_t) = −α(1 − p_t)^γ log(p_t)', desc: 'Raise γ and watch easy examples (p_t near 1) stop contributing.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 280;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let g = 2;
    U.slider(ctl, { label: 'Focusing γ', min: 0, max: 5, step: 0.1, value: g, onInput: (v) => { g = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const p = U.plot(ctx, W, H, { x0: 0, x1: 1, y0: 0, y1: 5, xticks: 5, yticks: 5, xlabel: 'p_t (probability of the true class)', ylabel: 'loss' });
      const pal = U.palette();
      [0, 0.5, 1, 2, 5].forEach((gg, i) => p.fn((x) => -Math.pow(1 - x, gg) * Math.log(Math.max(1e-4, x)), pal[i], 1.4, 300, [4, 4]));
      p.fn((x) => -Math.pow(1 - x, g) * Math.log(Math.max(1e-4, x)), U.css('--accent-3'), 3.5);
      const easy = -Math.pow(0.1, g) * Math.log(0.9), hard = -Math.pow(0.9, g) * Math.log(0.1);
      out.innerHTML = `easy negative (p_t = 0.9): <b>${easy.toFixed(4)}</b>\nhard example (p_t = 0.1): <b>${hard.toFixed(3)}</b>\nhard / easy ratio: <b>${U.fmt(hard / easy, 0)}×</b>  (CE: ${(Math.log(0.1) / Math.log(0.9)).toFixed(0)}×)\n\nWith ~100,000 mostly-easy background\nlocations, γ = 2 stops them swamping the loss.\nTypical: γ = 2, α = 0.25 (RetinaNet).\nthin dashed: γ = 0, 0.5, 1, 2, 5`;
    }
    draw();
  });

  /* =================== Hungarian matching (DETR) =================== */
  CV.widget('hungarian', { title: 'Hungarian matching: one prediction per object', desc: 'DETR outputs a fixed set of predictions. The optimal one-to-one assignment minimises total cost; the rest learn "no object". Drag predictions to change costs.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, H = 300;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    const gts = [[60, 60, 150, 150], [250, 50, 330, 160], [150, 180, 270, 270]];
    let preds = [[75, 70, 160, 155], [240, 70, 320, 150], [300, 200, 420, 280], [140, 175, 250, 260], [60, 200, 120, 260], [360, 40, 440, 120]];
    const tbl = U.el('div'); ctl.append(tbl);
    const out = U.out(ctl);
    const cost = (p, g) => 1 - iouOf(p, g) + (Math.abs((p[0] + p[2]) / 2 - (g[0] + g[2]) / 2) + Math.abs((p[1] + p[3]) / 2 - (g[1] + g[3]) / 2)) / 400;
    function best() {
      let bestC = Infinity, bestA = null;
      const n = preds.length, perm = (k, used, acc, total) => {
        if (total >= bestC) return;
        if (k === gts.length) { bestC = total; bestA = acc.slice(); return; }
        for (let i = 0; i < n; i++) if (!used[i]) { used[i] = 1; acc.push(i); perm(k + 1, used, acc, total + cost(preds[i], gts[k])); acc.pop(); used[i] = 0; }
      };
      perm(0, [], [], 0);
      return [bestA, bestC];
    }
    let drag = null;
    function draw() {
      const [A, total] = best();
      ctx.clearRect(0, 0, W, H);
      gts.forEach((g, k) => { ctx.strokeStyle = '#e07a5f'; ctx.lineWidth = 3; ctx.strokeRect(g[0], g[1], g[2] - g[0], g[3] - g[1]); ctx.fillStyle = '#e07a5f'; ctx.font = '700 12px Inter'; ctx.fillText('GT' + (k + 1), g[0] + 4, g[1] + 15); });
      preds.forEach((p, i) => {
        const m = A.indexOf(i);
        ctx.strokeStyle = m >= 0 ? '#4caf7d' : 'rgba(165,177,204,.55)'; ctx.lineWidth = m >= 0 ? 2.5 : 1.5; ctx.setLineDash(m >= 0 ? [] : [5, 4]);
        ctx.strokeRect(p[0], p[1], p[2] - p[0], p[3] - p[1]); ctx.setLineDash([]);
        ctx.fillStyle = ctx.strokeStyle; ctx.font = '600 11px Inter'; ctx.fillText(`q${i + 1}${m >= 0 ? ' → GT' + (m + 1) : ' ∅'}`, p[0] + 3, p[3] - 4);
        if (m >= 0) { const g = gts[m]; ctx.strokeStyle = '#4caf7d'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo((p[0] + p[2]) / 2, (p[1] + p[3]) / 2); ctx.lineTo((g[0] + g[2]) / 2, (g[1] + g[3]) / 2); ctx.stroke(); ctx.setLineDash([]); }
      });
      tbl.innerHTML = `<div class="tbl-wrap" style="margin:0"><table><thead><tr><th>cost</th>${gts.map((_, k) => `<th>GT${k + 1}</th>`).join('')}</tr></thead><tbody>${preds.map((p, i) => `<tr><td>q${i + 1}</td>${gts.map((g, k) => `<td style="font-family:var(--mono);${A[k] === i ? 'background:rgba(76,175,125,.25);font-weight:700' : ''}">${cost(p, g).toFixed(2)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      out.innerHTML = `optimal total cost: <b>${total.toFixed(3)}</b>\nmatched: ${A.map((i, k) => `q${i + 1}→GT${k + 1}`).join(', ')}\nunmatched queries → "no object" class.\nNo duplicates, so no NMS needed.`;
    }
    c.addEventListener('pointerdown', (e) => { const p = U.mouse(c, e); const i = preds.findIndex((b) => p.x > b[0] && p.x < b[2] && p.y > b[1] && p.y < b[3]); if (i >= 0) drag = [i, p.x - preds[i][0], p.y - preds[i][1]]; });
    c.addEventListener('pointermove', (e) => { if (!drag) return; const p = U.mouse(c, e), b = preds[drag[0]], w = b[2] - b[0], h = b[3] - b[1]; b[0] = p.x - drag[1]; b[1] = p.y - drag[2]; b[2] = b[0] + w; b[3] = b[1] + h; draw(); });
    addEventListener('pointerup', () => (drag = null));
    c.style.cursor = 'move';
    draw();
  });
})();
