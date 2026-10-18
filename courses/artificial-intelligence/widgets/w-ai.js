/* Artificial Intelligence course demos: search, games, probability, MDPs, local search */
(function () {
  'use strict';
  const U = CV.util;

  /* ======================= grid path-finding ======================= */
  CV.widget('ai-search', { title: 'Search algorithms on a grid', desc: 'Click cells to add or remove walls. Pick an algorithm and watch the frontier grow. Numbers show nodes expanded and path cost.' }, (body, opts) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const C = 22, R = 14, S = 20, W = C * S, H = R * S;
    const { c, ctx } = U.canvas(W, H, { cssW: W });
    c.style.cursor = 'pointer';
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let alg = opts.alg || 'astar', speed = 3;
    const start = [2, 7], goal = [19, 6];
    const wall = new Set(), mud = new Set();
    for (let y = 2; y < 12; y++) wall.add(`11,${y}`);
    for (let x = 5; x < 11; x++) wall.add(`${x},3`);
    for (let y = 8; y < 13; y++) for (let x = 14; x < 18; x++) mud.add(`${x},${y}`);
    const cost = (x, y) => (mud.has(`${x},${y}`) ? 5 : 1);
    U.seg(ctl, [['bfs', 'BFS'], ['dfs', 'DFS'], ['ucs', 'UCS'], ['greedy', 'Greedy'], ['astar', 'A*']], alg, (v) => { alg = v; reset(); });
    U.slider(ctl, { label: 'Speed (steps / frame)', min: 1, max: 12, value: speed, onInput: (v) => (speed = v) });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, '↺ Restart', reset);
    U.button(bb, 'Clear walls', () => { wall.clear(); reset(); });
    const out = U.out(ctl);
    const h = (x, y) => Math.abs(x - goal[0]) + Math.abs(y - goal[1]);
    let frontier, came, g, closed, done, path, order;
    function reset() {
      frontier = [{ x: start[0], y: start[1], g: 0, f: 0, n: 0 }]; came = { [start + '']: null }; g = { [start + '']: 0 };
      closed = new Set(); done = false; path = null; order = 0;
    }
    function pop() {
      if (alg === 'bfs') return frontier.shift();
      if (alg === 'dfs') return frontier.pop();
      let bi = 0;
      for (let i = 1; i < frontier.length; i++) {
        const a = frontier[i], b = frontier[bi];
        if (a.f < b.f || (a.f === b.f && a.n < b.n)) bi = i;
      }
      return frontier.splice(bi, 1)[0];
    }
    function step() {
      if (done) return;
      if (!frontier.length) { done = true; return; }
      const cur = pop(), k = cur.x + ',' + cur.y;
      if (closed.has(k)) return;
      closed.add(k);
      if (cur.x === goal[0] && cur.y === goal[1]) {
        done = true; path = [];
        for (let p = k; p; p = came[p]) path.push(p.split(',').map(Number));
        return;
      }
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const nx = cur.x + dx, ny = cur.y + dy, nk = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= C || ny >= R || wall.has(nk) || closed.has(nk)) continue;
        const ng = g[k] + cost(nx, ny);
        if (alg === 'bfs' || alg === 'dfs') { if (nk in came) continue; }
        else if (nk in g && g[nk] <= ng) continue;
        g[nk] = ng; came[nk] = k;
        const f = alg === 'ucs' ? ng : alg === 'greedy' ? h(nx, ny) : alg === 'astar' ? ng + h(nx, ny) : 0;
        frontier.push({ x: nx, y: ny, g: ng, f, n: ++order });
      }
    }
    c.addEventListener('pointerdown', (e) => {
      const p = U.mouse(c, e), x = Math.floor(p.x / S), y = Math.floor(p.y / S), k = x + ',' + y;
      if ((x === start[0] && y === start[1]) || (x === goal[0] && y === goal[1])) return;
      wall.has(k) ? wall.delete(k) : wall.add(k); reset();
    });
    reset();
    U.loop(c, () => {
      for (let i = 0; i < speed; i++) step();
      const fg = U.css('--text'), bg = U.css('--surface-2'), bd = U.css('--border');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      const fr = new Set(frontier.map((n) => n.x + ',' + n.y)), onPath = new Set((path || []).map((p) => p + ''));
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const k = x + ',' + y;
        let col = null;
        if (mud.has(k)) col = 'rgba(212,167,58,.22)';
        if (closed.has(k)) col = 'rgba(91,156,245,.35)';
        if (fr.has(k)) col = 'rgba(76,175,125,.55)';
        if (onPath.has(k)) col = '#e07a5f';
        if (wall.has(k)) col = fg;
        if (col) { ctx.fillStyle = col; ctx.fillRect(x * S + 1, y * S + 1, S - 2, S - 2); }
        ctx.strokeStyle = bd; ctx.strokeRect(x * S + 0.5, y * S + 0.5, S, S);
      }
      ctx.font = '700 12px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [[start, 'S'], [goal, 'G']].forEach(([[x, y], t]) => { ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x * S + S / 2, y * S + S / 2, S / 2 - 2, 0, 7); ctx.fill(); ctx.fillStyle = U.css('--bg'); ctx.fillText(t, x * S + S / 2, y * S + S / 2 + 0.5); });
      const pc = path ? path.slice(0, -1).reduce((s, [x, y]) => s + cost(x, y), 0) : null;
      out.innerHTML = `Expanded: <b>${closed.size}</b>   Frontier: <b>${frontier.length}</b>\n` +
        (done ? (path ? `Path found: ${path.length - 1} steps, cost <b>${pc}</b>` : 'No path exists.') : 'Searching…') +
        `\n\n${{ bfs: 'BFS: FIFO queue. Fewest steps, ignores the mud cost.', dfs: 'DFS: LIFO stack. Dives deep; path is rarely optimal.', ucs: 'UCS: expands lowest g(n). Optimal cost, but searches in every direction.', greedy: 'Greedy: expands lowest h(n). Fast, not optimal.', astar: 'A*: expands lowest f = g + h. Optimal with an admissible h and far fewer expansions than UCS.' }[alg]}`;
    });
    body.append(U.el('div', { class: 'w-note', html: 'Legend: <b>blue</b> = expanded (closed), <b>green</b> = frontier, <b>amber</b> = mud (cost 5), <b>orange</b> = final path. Heuristic h = Manhattan distance.' }));
  });

  /* ======================= tic-tac-toe minimax ======================= */
  CV.widget('ai-minimax', { title: 'Minimax and alpha–beta pruning', desc: 'Play X against a perfect O. After each move the AI reports how many game states it searched. Toggle pruning to compare.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const grid = U.el('div', { style: 'display:grid;grid-template-columns:repeat(3,72px);gap:6px;justify-content:center' });
    stage.append(grid);
    let b = Array(9).fill(''), prune = true, over = false, lastNodes = 0, lastVal = null;
    U.check(ctl, 'Alpha–beta pruning', prune, (v) => (prune = v));
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, '↺ New game', () => { b = Array(9).fill(''); over = false; lastNodes = 0; lastVal = null; paint(); });
    U.button(bb, 'AI moves first', () => { if (b.every((v) => !v)) { aiMove(); paint(); } });
    const out = U.out(ctl);
    const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    const win = (s) => { for (const [a, c, d] of L) if (s[a] && s[a] === s[c] && s[a] === s[d]) return s[a]; return s.every((v) => v) ? 'draw' : null; };
    let nodes = 0;
    function mm(s, me, alpha, beta, depth) {
      nodes++;
      const w = win(s);
      if (w === 'O') return 10 - depth; if (w === 'X') return depth - 10; if (w === 'draw') return 0;
      let best = me ? -Infinity : Infinity;
      for (let i = 0; i < 9; i++) {
        if (s[i]) continue;
        s[i] = me ? 'O' : 'X';
        const v = mm(s, !me, alpha, beta, depth + 1);
        s[i] = '';
        if (me) { best = Math.max(best, v); alpha = Math.max(alpha, v); } else { best = Math.min(best, v); beta = Math.min(beta, v); }
        if (prune && beta <= alpha) break;
      }
      return best;
    }
    function aiMove() {
      nodes = 0; let best = -Infinity, mv = -1;
      for (let i = 0; i < 9; i++) {
        if (b[i]) continue;
        b[i] = 'O'; const v = mm(b, false, -Infinity, Infinity, 1); b[i] = '';
        if (v > best) { best = v; mv = i; }
      }
      if (mv >= 0) b[mv] = 'O';
      lastNodes = nodes; lastVal = best;
    }
    function paint() {
      grid.innerHTML = '';
      const w = win(b); over = !!w;
      b.forEach((v, i) => {
        const cell = U.el('button', { type: 'button', style: `height:72px;font:700 34px var(--font);border-radius:12px;border:1px solid var(--border-2);background:var(--surface-2);color:${v === 'O' ? 'var(--text-2)' : 'var(--text)'};cursor:${v || over ? 'default' : 'pointer'}` }, v);
        cell.onclick = () => { if (v || over) return; b[i] = 'X'; if (!win(b)) aiMove(); paint(); };
        grid.append(cell);
      });
      out.innerHTML = `${w ? (w === 'draw' ? '<b>Draw.</b> Perfect play from both sides always ends here.' : `<b>${w} wins.</b>`) : 'Your move (X).'}\n\nStates searched for the last AI move: <b>${lastNodes.toLocaleString('en-US')}</b>` +
        (lastVal !== null ? `\nMinimax value: ${lastVal > 0 ? 'O can force a win' : lastVal < 0 ? 'X can force a win' : '0 (draw with best play)'}` : '') +
        `\n\nTip: on an empty board, minimax without pruning searches ~550,000 states; alpha–beta cuts that by over 90% and still picks the same move.`;
    }
    paint();
  });

  /* ======================= Bayes rule / base rates ======================= */
  CV.widget('ai-bayes', { title: 'Bayes\' rule and the base-rate trap', desc: 'A test for a rare condition. Each square is one person out of 1,000. How likely is a positive result to be a true case?' }, (body) => {
    const { stage, ctl } = U.split(body);
    const W = 400, H = 250;
    const { c, ctx } = U.canvas(W, H);
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let prior = 0.01, sens = 0.95, spec = 0.95;
    U.slider(ctl, { label: 'Prevalence P(D)', min: 0.001, max: 0.5, step: 0.001, value: prior, fmt: (v) => (v * 100).toFixed(1) + '%', onInput: (v) => { prior = v; draw(); } });
    U.slider(ctl, { label: 'Sensitivity P(+|D)', min: 0.5, max: 1, step: 0.005, value: sens, fmt: (v) => (v * 100).toFixed(1) + '%', onInput: (v) => { sens = v; draw(); } });
    U.slider(ctl, { label: 'Specificity P(−|¬D)', min: 0.5, max: 1, step: 0.005, value: spec, fmt: (v) => (v * 100).toFixed(1) + '%', onInput: (v) => { spec = v; draw(); } });
    const out = U.out(ctl);
    function draw() {
      const N = 1000, nD = Math.round(N * prior), TP = Math.round(nD * sens), FN = nD - TP, nH = N - nD, FP = Math.round(nH * (1 - spec)), TN = nH - FP;
      const cols = 50, s = W / cols;
      ctx.clearRect(0, 0, W, H);
      const kinds = [...Array(TP).fill('#4caf7d'), ...Array(FN).fill('#2f6b4c'), ...Array(FP).fill('#e5604d'), ...Array(TN).fill(U.css('--surface-3'))];
      kinds.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect((i % cols) * s + 1, Math.floor(i / cols) * (H / 20) + 1, s - 2, H / 20 - 2); });
      const post = TP / Math.max(1, TP + FP);
      out.innerHTML = `Out of 1,000 people:\n  sick & test + (TP): <b>${TP}</b>\n  sick & test − (FN): ${FN}\n  healthy & test + (FP): <b>${FP}</b>\n  healthy & test −: ${TN}\n\nP(D | +) = TP / (TP + FP)\n         = ${TP} / ${TP + FP} = <b>${(post * 100).toFixed(1)}%</b>`;
    }
    draw();
    body.append(U.el('div', { class: 'w-note', html: 'Green = true positives, dark green = missed cases, red = false positives, grey = true negatives. With 1% prevalence, even a "95% accurate" test gives mostly false alarms: the prior matters as much as the evidence.' }));
  });

  /* ======================= value iteration gridworld ======================= */
  CV.widget('ai-gridworld', { title: 'Value iteration in a gridworld', desc: 'An agent earns +1 at the gem and −1 in the pit. Each sweep applies the Bellman update to every state. Arrows show the greedy policy.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const C = 5, R = 4, S = 74, W = C * S, H = R * S;
    const { c, ctx } = U.canvas(W, H, { cssW: W });
    stage.append(U.el('div', { class: 'canvas-box' }, c));
    let gamma = 0.9, noise = 0.2, living = -0.04, V, iters = 0;
    const term = { '4,0': 1, '4,1': -1 }, blocked = new Set(['1,1', '2,2']);
    U.slider(ctl, { label: 'Discount γ', min: 0.1, max: 0.99, step: 0.01, value: gamma, fmt: (v) => v.toFixed(2), onInput: (v) => { gamma = v; reset(); } });
    U.slider(ctl, { label: 'Slip noise', min: 0, max: 0.5, step: 0.05, value: noise, fmt: (v) => v.toFixed(2), onInput: (v) => { noise = v; reset(); } });
    U.slider(ctl, { label: 'Living reward', min: -0.5, max: 0.1, step: 0.01, value: living, fmt: (v) => v.toFixed(2), onInput: (v) => { living = v; reset(); } });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'One sweep', () => { sweep(); draw(); });
    U.button(bb, '×20 sweeps', () => { for (let i = 0; i < 20; i++) sweep(); draw(); });
    U.button(bb, '↺ Reset', reset);
    const out = U.out(ctl);
    const A = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const ok = (x, y) => x >= 0 && y >= 0 && x < C && y < R && !blocked.has(x + ',' + y);
    const q = (x, y, a, Vs) => {
      let s = 0;
      [[a, 1 - noise], [(a + 1) % 4, noise / 2], [(a + 3) % 4, noise / 2]].forEach(([d, p]) => {
        const nx = x + A[d][0], ny = y + A[d][1], [tx, ty] = ok(nx, ny) ? [nx, ny] : [x, y];
        s += p * (living + gamma * Vs[ty][tx]);
      });
      return s;
    };
    function reset() { V = Array.from({ length: R }, () => Array(C).fill(0)); iters = 0; draw(); }
    function sweep() {
      const nV = V.map((r) => r.slice());
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const k = x + ',' + y;
        if (blocked.has(k)) continue;
        if (k in term) { nV[y][x] = term[k]; continue; }
        nV[y][x] = Math.max(...A.map((_, a) => q(x, y, a, V)));
      }
      V = nV; iters++;
    }
    function draw() {
      const fg = U.css('--text');
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const k = x + ',' + y, v = V[y][x], px = x * S, py = y * S;
        if (blocked.has(k)) { ctx.fillStyle = fg; ctx.fillRect(px + 2, py + 2, S - 4, S - 4); continue; }
        const a = Math.min(1, Math.abs(v));
        ctx.fillStyle = v >= 0 ? `rgba(76,175,125,${a * 0.7})` : `rgba(229,96,77,${a * 0.7})`;
        ctx.fillRect(px + 2, py + 2, S - 4, S - 4);
        ctx.strokeStyle = U.css('--border-2'); ctx.strokeRect(px + 2, py + 2, S - 4, S - 4);
        ctx.fillStyle = fg; ctx.font = '600 13px JetBrains Mono, monospace';
        ctx.fillText(k in term ? (term[k] > 0 ? '+1 ◆' : '−1 ✕') : v.toFixed(2), px + S / 2, py + S / 2 + (k in term ? 0 : 14));
        if (!(k in term) && iters) {
          const best = A.map((_, a) => q(x, y, a, V)).reduce((bi, v2, i, arr) => (v2 > arr[bi] ? i : bi), 0);
          const [dx, dy] = A[best];
          U.arrow(ctx, px + S / 2 - dx * 10, py + S / 2 - 10 - dy * 10, px + S / 2 + dx * 14, py + S / 2 - 10 + dy * 14, 7);
        }
      }
      out.innerHTML = `Sweeps: <b>${iters}</b>\n\nV(s) ← max_a Σ P(s'|s,a)·[R + γ·V(s')]\n\n${noise > 0.3 ? 'High noise: the policy gives the pit a wide berth.' : living < -0.3 ? 'Living is painful: the agent rushes, even past the pit.' : living > 0 ? 'Positive living reward: the agent may avoid ending the episode.' : 'Values spread outward from the rewards, one step per sweep.'}`;
    }
    reset();
  });

  /* ======================= N-queens with min-conflicts ======================= */
  CV.widget('ai-nqueens', { title: 'Local search: min-conflicts on N-queens', desc: 'Start from a random board. Each step picks a conflicted queen and moves it, within its column, to the row with the fewest conflicts.' }, (body) => {
    const { stage, ctl } = U.split(body);
    const host = U.el('div', { class: 'canvas-box', style: 'display:flex;justify-content:center' }); stage.append(host);
    let N = 8, q, steps, c, ctx, S, playing = false, loop, rnd = U.rand(7), hist = [];
    U.slider(ctl, { label: 'Board size N', min: 4, max: 24, value: N, onInput: (v) => { N = v; reset(); } });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, 'Step', () => { step(); draw(); });
    const pb = U.button(bb, '▶ Solve', () => { playing = !playing; pb.innerHTML = playing ? '❚❚ Pause' : '▶ Solve'; });
    U.button(bb, '↺ Shuffle', reset);
    const out = U.out(ctl);
    const conf = (col, row) => { let n = 0; for (let j = 0; j < N; j++) if (j !== col && (q[j] === row || Math.abs(q[j] - row) === Math.abs(j - col))) n++; return n; };
    const total = () => { let t = 0; for (let i = 0; i < N; i++) t += conf(i, q[i]); return t / 2; };
    function reset() {
      q = Array.from({ length: N }, () => Math.floor(rnd() * N)); steps = 0; hist = [total()];
      S = Math.floor(Math.min(360, 32 * N) / N); host.innerHTML = '';
      ({ c, ctx } = U.canvas(S * N, S * N, { cssW: S * N })); host.append(c);
      if (loop) loop.stop();
      let acc = 0;
      loop = U.loop(c, (dt) => { acc += dt; if (playing && acc > 0.12) { acc = 0; step(); draw(); } });
      draw();
    }
    function step() {
      const bad = [...Array(N).keys()].filter((i) => conf(i, q[i]) > 0);
      if (!bad.length) { playing = false; pb.innerHTML = '▶ Solve'; return; }
      const col = bad[Math.floor(rnd() * bad.length)];
      let best = Infinity, rows = [];
      for (let r = 0; r < N; r++) { const v = conf(col, r); if (v < best) { best = v; rows = [r]; } else if (v === best) rows.push(r); }
      q[col] = rows[Math.floor(rnd() * rows.length)]; steps++; hist.push(total());
    }
    function draw() {
      const fg = U.css('--text');
      for (let r = 0; r < N; r++) for (let col = 0; col < N; col++) { ctx.fillStyle = (r + col) % 2 ? U.css('--surface-3') : U.css('--surface'); ctx.fillRect(col * S, r * S, S, S); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${Math.round(S * 0.7)}px serif`;
      for (let col = 0; col < N; col++) { ctx.fillStyle = conf(col, q[col]) ? '#e5604d' : fg; ctx.fillText('♛', col * S + S / 2, q[col] * S + S / 2 + 1); }
      const t = total();
      out.innerHTML = `Steps: <b>${steps}</b>\nAttacking pairs: <b>${t}</b>${t === 0 ? '  ✓ solved' : ''}\n\nHistory: ${hist.slice(-14).join(' → ')}\n\nMin-conflicts solves even N = 1,000,000 in ~50 steps on average: the state space is huge but full of solutions.`;
    }
    reset();
  });
})();
