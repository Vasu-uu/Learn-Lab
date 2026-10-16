/* Streamlit course demos: a mock Streamlit runtime rendered in the browser */
(function () {
  'use strict';
  const U = CV.util;

  const H = CV.mock, { fmt, pytype, runsBadge } = CV.mock;

  /* ======================= the rerun model ======================= */
  CV.widget('st-rerun', { title: 'Every interaction reruns the whole script', desc: 'Change a widget. Watch the script execute top to bottom, then the page update. A button is True only for the one rerun it triggered.' }, (body) => {
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const left = U.el('div', { class: 'w-col' }), right = U.el('div', { class: 'w-col' }); row.append(left, right);
    const code = H.code(left).set(`
import streamlit as st

st.title("Tip calculator")
bill = st.number_input("Bill ($)", value=50.0)
pct = st.slider("Tip %", 0, 30, 15)
tip = bill * pct / 100
st.metric("Tip", f"\${tip:.2f}")
if st.button("Split two ways"):
    st.write(f"Each pays \${(bill + tip) / 2:.2f}")
st.caption("Every widget change reruns this file")`);
    const app = H.frame(right);
    const status = U.el('div', { class: 'w-row', style: 'margin-top:10px;align-items:center;gap:10px' }); right.append(status);
    const runs = runsBadge(status);
    const note = U.el('span', { class: 'muted small' }); status.append(note);
    let bill = 50, pct = 15, clicked = false, running = false;
    function render() {
      const tip = (bill * pct) / 100;
      app.main.innerHTML = `<h1>Tip calculator</h1>
        <div class="stm-w"><label>Bill ($)</label><input type="number" step="0.5" value="${bill}" id="sb"></div>
        <div class="stm-w"><label>Tip % <b style="float:right">${pct}</b></label><input type="range" min="0" max="30" value="${pct}" id="sp" style="--p:${(pct / 30) * 100}%"></div>
        <div class="stm-metric stm-w"><small>Tip</small><b>$${tip.toFixed(2)}</b></div>
        <div class="stm-w"><button class="stm-btn" id="sbt">Split two ways</button></div>
        ${clicked ? `<p class="stm-flash">Each pays $${((bill + tip) / 2).toFixed(2)}</p>` : ''}
        <p class="muted small">Every widget change reruns this file</p>`;
      app.main.querySelector('#sb').onchange = (e) => trigger(() => (bill = +e.target.value || 0), 'number_input changed');
      app.main.querySelector('#sp').oninput = (e) => { e.target.style.setProperty('--p', (e.target.value / 30) * 100 + '%'); };
      app.main.querySelector('#sp').onchange = (e) => trigger(() => (pct = +e.target.value), 'slider changed');
      app.main.querySelector('#sbt').onclick = () => trigger(() => (clicked = true), 'button clicked → returns True this run only', true);
    }
    function trigger(change, why, isButton) {
      if (running) return;
      running = true; change(); if (!isButton) clicked = false;
      runs.inc(); note.textContent = why;
      app.main.style.opacity = 0.55;
      H.run(code, () => { running = false; app.main.style.opacity = 1; render(); });
    }
    render();
    body.append(U.el('div', { class: 'w-note', html: 'Click <b>Split two ways</b>, then move the slider: the "Each pays" line disappears, because on that new rerun <code>st.button</code> returns <code>False</code>. To remember things across reruns you need <code>st.session_state</code> (lesson 5).' }));
  });

  /* ======================= element gallery ======================= */
  const ELEMENTS = {
    'st.title / header': [`st.title("Sales report")\nst.header("Q3 summary")\nst.subheader("By region")`, `<h1>Sales report</h1><h2>Q3 summary</h2><h3>By region</h3>`],
    'st.markdown': [`st.markdown("**Bold**, *italic*, \`code\` and a [link](https://streamlit.io)")\nst.markdown("- item one\\n- item two")`, `<p><b>Bold</b>, <i>italic</i>, <code>code</code> and a <a href="#">link</a></p><ul><li>item one</li><li>item two</li></ul>`],
    'st.write (magic)': [`st.write("Rows:", 3, {"a": 1})\ndf  # a bare expression is written too ("magic")`, `<p>Rows: 3</p><p style="font-family:var(--mono);font-size:12.5px">{ "a": 1 }</p><table class="stm-table"><tr><th></th><th>city</th><th>sales</th></tr><tr><td>0</td><td>Pune</td><td>120</td></tr><tr><td>1</td><td>Delhi</td><td>95</td></tr></table>`],
    'st.dataframe': [`st.dataframe(df, use_container_width=True, hide_index=True)`, `<table class="stm-table"><tr><th>city ↕</th><th>sales ↕</th><th>growth ↕</th></tr><tr><td>Pune</td><td>120</td><td>0.12</td></tr><tr><td>Delhi</td><td>95</td><td>-0.03</td></tr><tr><td>Chennai</td><td>143</td><td>0.21</td></tr></table><p class="muted small" style="margin-top:6px">interactive: sort, resize, search, download</p>`],
    'st.table': [`st.table(df)  # static, no sorting`, `<table class="stm-table"><tr><th></th><th>city</th><th>sales</th></tr><tr><td>0</td><td>Pune</td><td>120</td></tr><tr><td>1</td><td>Delhi</td><td>95</td></tr></table>`],
    'st.metric': [`c1, c2 = st.columns(2)\nc1.metric("Revenue", "₹4.2L", "+12%")\nc2.metric("Churn", "3.1%", "-0.4%", delta_color="inverse")`, `<div class="stm-cols" style="grid-template-columns:1fr 1fr"><div class="stm-metric"><small>Revenue</small><b>₹4.2L</b><br><em>↑ +12%</em></div><div class="stm-metric"><small>Churn</small><b>3.1%</b><br><em>↓ -0.4%</em></div></div>`],
    'st.json': [`st.json({"model": "yolov8n", "conf": 0.25, "classes": [0, 2]})`, `<pre style="font:12.5px var(--mono);margin:0">{\n  "model": "yolov8n",\n  "conf": 0.25,\n  "classes": [0, 2]\n}</pre>`],
    'st.code': [`st.code("for i in range(3):\\n    print(i)", language="python")`, `<pre style="font:12.5px var(--mono);background:var(--surface-2);padding:10px;border-radius:8px;margin:0">for i in range(3):\n    print(i)</pre>`],
    'status alerts': [`st.success("Saved!")\nst.info("Tip: use the sidebar")\nst.warning("Large file")\nst.error("Upload failed")`, `<div class="stm-alert ok">Saved!</div><div class="stm-alert info">Tip: use the sidebar</div><div class="stm-alert warn">Large file</div><div class="stm-alert err">Upload failed</div>`],
    'st.progress / spinner': [`bar = st.progress(0, text="Training")\nfor i in range(100):\n    bar.progress(i + 1, text=f"Epoch {i+1}")\nwith st.spinner("Loading model..."):\n    model = load()`, `<label class="stm-lab">Epoch 64</label><div class="pbar" style="height:8px"><i style="width:64%"></i></div><p class="muted small" style="margin-top:10px">⟳ Loading model...</p>`],
    'st.image / media': [`st.image("cat.jpg", caption="A cat", width=200)\nst.audio("clip.mp3")\nst.video("demo.mp4")`, `<div style="width:200px;height:120px;border-radius:8px;background:repeating-linear-gradient(45deg,var(--surface-3) 0 10px,var(--surface-2) 10px 20px)"></div><p class="muted small">A cat</p><div class="stm-box">▶ audio player</div>`],
    'st.latex': [`st.latex(r"\\hat{y} = \\sigma(Wx + b)")`, `<p style="text-align:center;font:italic 20px 'Cambria Math',Georgia,serif">ŷ = σ(Wx + b)</p>`],
  };
  CV.widget('st-elements', { title: 'Element gallery', desc: 'Pick an element to see the call and what it renders.' }, (body) => {
    const top = U.el('div', { style: 'margin-bottom:12px' }); body.append(top);
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const left = U.el('div', { class: 'w-col' }), right = U.el('div', { class: 'w-col' }); row.append(left, right);
    const code = H.code(left), app = H.frame(right);
    const show = (k) => { code.set('import streamlit as st\n\n' + ELEMENTS[k][0]); app.main.innerHTML = `<div class="stm-flash">${ELEMENTS[k][1]}</div>`; };
    U.seg(top, Object.keys(ELEMENTS), 'st.metric', show);
    show('st.metric');
  });

  /* ======================= widget playground ======================= */
  CV.widget('st-widgets', { title: 'Widgets return Python values', desc: 'Use the inputs. The panel shows exactly what each call returns on this rerun, with its type.' }, (body) => {
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const left = U.el('div', { class: 'w-col' }), right = U.el('div', { class: 'w-col' }); row.append(left, right);
    const app = H.frame(left);
    const out = U.out(right);
    const W = [
      ['name', 'st.text_input("Name")', '<input type="text" value="Asha">', (e) => e.value],
      ['age', 'st.number_input("Age", 0, 120, 21)', '<input type="number" value="21">', (e) => +e.value],
      ['level', 'st.slider("Level", 1, 10, 4)', '<input type="range" min="1" max="10" value="4" style="--p:33%">', (e) => +e.value],
      ['city', 'st.selectbox("City", ["Pune", "Delhi", "Goa"])', '<select><option>Pune</option><option>Delhi</option><option>Goa</option></select>', (e) => e.value],
      ['tags', 'st.multiselect("Tags", ["ml", "cv", "web"])', '<select multiple style="height:64px"><option selected>ml</option><option>cv</option><option>web</option></select>', (e) => [...e.selectedOptions].map((o) => o.value)],
      ['plan', 'st.radio("Plan", ["Free", "Pro"], horizontal=True)', '<span><label style="display:inline"><input type="radio" name="pl" value="Free" checked> Free</label> &nbsp; <label style="display:inline"><input type="radio" name="pl" value="Pro"> Pro</label></span>', (e) => e.querySelector('input:checked').value],
      ['agree', 'st.checkbox("I agree")', '<label style="display:inline"><input type="checkbox"> I agree</label>', (e) => e.querySelector('input').checked],
      ['go', 'st.button("Go")', '<button class="stm-btn">Go</button>', null],
    ];
    let pressed = false;
    W.forEach(([k, call, html]) => app.main.append(U.el('div', { class: 'stm-w', html: (k === 'agree' || k === 'go' || k === 'plan' ? '' : `<label>${call.match(/"([^"]+)"/)[1]}</label>`) + html, 'data-k': k })));
    const read = () => {
      out.innerHTML = W.map(([k, call, , get]) => {
        const el = app.main.querySelector(`[data-k=${k}]`), inner = el.querySelector('input,select') && !['plan', 'agree'].includes(k) ? el.querySelector('input,select') : el;
        const v = get ? get(inner) : pressed;
        return `<b>${k}</b> = ${call}\n    → ${U.esc(fmt(v))}  <span style="color:var(--text-3)">(${pytype(v)})</span>`;
      }).join('\n');
      pressed = false;
    };
    app.main.addEventListener('input', (e) => { if (e.target.type === 'range') e.target.style.setProperty('--p', ((e.target.value - 1) / 9) * 100 + '%'); read(); });
    app.main.addEventListener('change', read);
    app.main.querySelector('button').onclick = () => { pressed = true; read(); };
    read();
    body.append(U.el('div', { class: 'w-note', html: 'Every widget needs a unique identity. Two identical calls such as <code>st.button("Go")</code> twice raise <code>DuplicateWidgetID</code>; pass <code>key="..."</code> to tell them apart.' }));
  });

  /* ======================= layout builder ======================= */
  CV.widget('st-layout', { title: 'Layout builder', desc: 'Combine sidebar, columns, tabs and expanders. The code updates as you build.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const app = H.frame(stage, { side: true });
    const code = H.code(stage); code.el.style.marginTop = '12px';
    let side = true, cols = 3, ratio = 'equal', tabs = true, exp = true, border = false;
    U.check(ctl, 'Sidebar (st.sidebar)', side, (v) => { side = v; draw(); });
    U.slider(ctl, { label: 'Columns', min: 1, max: 4, value: cols, onInput: (v) => { cols = v; draw(); } });
    U.seg(ctl, [['equal', 'Equal'], ['wide', 'First wider']], ratio, (v) => { ratio = v; draw(); });
    U.check(ctl, 'Tabs (st.tabs)', tabs, (v) => { tabs = v; draw(); });
    U.check(ctl, 'Expander (st.expander)', exp, (v) => { exp = v; draw(); });
    U.check(ctl, 'Bordered container', border, (v) => { border = v; draw(); });
    let tab = 0;
    function draw() {
      app.showSide(side);
      app.side.innerHTML = '<div class="stm-lab">Filters</div><select><option>All regions</option></select><div class="stm-lab" style="margin-top:10px">Year</div><input type="range" style="--p:60%">';
      const spec = ratio === 'equal' ? cols : `[${[2, ...Array(cols - 1).fill(1)].join(', ')}]`;
      const tmpl = ratio === 'equal' ? `repeat(${cols},1fr)` : `2fr ${'1fr '.repeat(cols - 1)}`;
      let h = '<h1 style="font-size:20px">Dashboard</h1>';
      const colsHtml = `<div class="stm-cols" style="grid-template-columns:${tmpl}">${Array.from({ length: cols }, (_, i) => `<div class="stm-box">col${i + 1}</div>`).join('')}</div>`;
      const inner = colsHtml;
      h += tabs ? `<div class="stm-tabs">${['Overview', 'Details'].map((t, i) => `<span data-t="${i}" class="${i === tab ? 'on' : ''}">${t}</span>`).join('')}</div>${tab === 0 ? inner : '<div class="stm-box">tab 2 content</div>'}` : inner;
      if (exp) h += `<div class="stm-exp" style="margin-top:12px"><div>▸ Show raw data</div><div><div class="stm-box">hidden until opened</div></div></div>`;
      if (border) h = `<div style="border:1px solid var(--border-2);border-radius:10px;padding:12px">${h}</div>`;
      app.main.innerHTML = h;
      app.main.querySelectorAll('[data-t]').forEach((s) => (s.onclick = () => { tab = +s.dataset.t; draw(); }));
      const ind = (n) => '    '.repeat(n);
      let c = 'import streamlit as st\n\n';
      if (side) c += 'region = st.sidebar.selectbox("Filters", ["All regions"])\nyear = st.sidebar.slider("Year", 2015, 2025)\n\n';
      c += 'st.title("Dashboard")\n';
      let lvl = 0;
      if (border) { c += 'with st.container(border=True):\n'; lvl++; }
      if (tabs) { c += `${ind(lvl)}tab1, tab2 = st.tabs(["Overview", "Details"])\n${ind(lvl)}with tab1:\n`; lvl++; }
      c += `${ind(lvl)}${Array.from({ length: cols }, (_, i) => 'col' + (i + 1)).join(', ')}${cols === 1 ? ',' : ''} = st.columns(${spec})\n`;
      c += `${ind(lvl)}col1.metric("Users", 1200)\n`;
      if (tabs) { lvl--; c += `${ind(lvl)}tab2.write("tab 2 content")\n`; }
      if (exp) c += `${ind(lvl)}with st.expander("Show raw data"):\n${ind(lvl + 1)}st.dataframe(df)\n`;
      code.set(c);
    }
    draw();
  });

  /* ======================= session state ======================= */
  CV.widget('st-state', { title: 'Why you need st.session_state', desc: 'Two counters, same button. A normal variable is reset on every rerun; session state survives.' }, (body) => {
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const mk = (title, src) => {
      const col = U.el('div', { class: 'w-col' }); row.append(col);
      col.append(U.el('div', { class: 'canvas-label' }, title));
      const code = H.code(col).set(src); const app = H.frame(col); app.frame.style.marginTop = '10px';
      return { code, app };
    };
    const A = mk('Plain variable', `count = 0\nif st.button("+1"):\n    count += 1\nst.write("Count:", count)`);
    const B = mk('Session state', `if "count" not in st.session_state:\n    st.session_state.count = 0\nif st.button("+1"):\n    st.session_state.count += 1\nst.write("Count:", st.session_state.count)`);
    let ss = 0, runs = 0;
    const dict = U.out(body); dict.style.marginTop = '12px';
    function draw(clicked) {
      A.app.main.innerHTML = `<button class="stm-btn">+1</button><p style="margin-top:10px">Count: <b>${clicked ? 1 : 0}</b></p>`;
      B.app.main.innerHTML = `<button class="stm-btn">+1</button><p style="margin-top:10px">Count: <b>${ss}</b></p>`;
      [A, B].forEach((x) => (x.app.main.querySelector('button').onclick = click));
      dict.innerHTML = `rerun #${runs}\nst.session_state = {"count": ${ss}}\n\nThe plain counter can never pass 1: each rerun starts at count = 0.`;
    }
    function click() { runs++; ss++; H.run(A.code, null, 40); H.run(B.code, () => draw(true), 40); }
    draw(false);
  });

  /* ======================= forms batch reruns ======================= */
  CV.widget('st-forms', { title: 'Forms batch input into one rerun', desc: 'Type into the fields. Without a form every change reruns the script (and the slow query). With st.form nothing runs until Submit.' }, (body) => {
    let useForm = true, runs = 0, queries = 0, msg = '';
    const top = U.el('div', { style: 'margin-bottom:12px' }); body.append(top);
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const left = U.el('div', { class: 'w-col' }), right = U.el('div', { class: 'w-col' }); row.append(left, right);
    const code = H.code(left), app = H.frame(right), out = U.out(right); out.style.marginTop = '10px';
    U.seg(top, [[true, 'With st.form'], [false, 'Without a form']], useForm, (v) => { useForm = v; runs = queries = 0; msg = ''; draw(); });
    const rerun = (why) => { runs++; queries++; msg = why; H.run(code, paint, 18); };
    function draw() {
      code.set(useForm
        ? `with st.form("search"):\n    q = st.text_input("Keyword")\n    city = st.selectbox("City", cities)\n    year = st.slider("Year", 2015, 2025)\n    submitted = st.form_submit_button("Search")\n\nif submitted:\n    st.dataframe(slow_query(q, city, year))`
        : `q = st.text_input("Keyword")\ncity = st.selectbox("City", cities)\nyear = st.slider("Year", 2015, 2025)\n\nst.dataframe(slow_query(q, city, year))  # 2 s each time`);
      app.main.innerHTML = `<div ${useForm ? 'style="border:1px solid var(--border-2);border-radius:10px;padding:12px"' : ''}>
        <div class="stm-w"><label>Keyword</label><input type="text" id="fq"></div>
        <div class="stm-w"><label>City</label><select id="fc"><option>Pune</option><option>Delhi</option></select></div>
        <div class="stm-w"><label>Year</label><input type="range" id="fy" min="2015" max="2025" value="2020" style="--p:50%"></div>
        ${useForm ? '<button class="stm-btn pri" id="fs">Search</button>' : ''}</div>`;
      ['fq', 'fc', 'fy'].forEach((id) => (app.main.querySelector('#' + id).onchange = () => { if (!useForm) rerun(`${id === 'fq' ? 'text_input' : id === 'fc' ? 'selectbox' : 'slider'} changed → rerun`); else { msg = 'value held in the form, no rerun'; paint(); } }));
      if (useForm) app.main.querySelector('#fs').onclick = () => rerun('Submit → one rerun with all values');
      paint();
    }
    function paint() { out.innerHTML = `reruns: <b>${runs}</b>   slow queries run: <b>${queries}</b> (${queries * 2} s waited)\n${msg}`; }
    draw();
  });

  /* ======================= caching ======================= */
  CV.widget('st-cache', { title: 'Caching with @st.cache_data', desc: 'Call a slow loader with different arguments. The first call per argument is a miss (slow); repeats are hits (instant) until the TTL expires.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const code = H.code(stage); const tl = U.canvas(460, 170); stage.append(U.el('div', { class: 'canvas-label', style: 'margin-top:12px' }, 'Call timeline (bar length = time)'), tl.c);
    let cached = true, ttl = 30, arg = 'sales.csv', calls = [], cache = new Map(), clock = 0;
    U.seg(ctl, [[true, '@st.cache_data'], [false, 'No cache']], cached, (v) => { cached = v; setCode(); });
    const ac = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Argument'));
    U.seg(ac, [['sales.csv', 'sales.csv'], ['users.csv', 'users.csv'], ['events.csv', 'events.csv']], arg, (v) => (arg = v));
    ctl.append(ac);
    U.slider(ctl, { label: 'ttl (seconds of simulated time)', min: 5, max: 120, value: ttl, onInput: (v) => (ttl = v) });
    const bb = U.el('div', { class: 'w-btns' }); ctl.append(bb);
    U.button(bb, '▶ Rerun app', () => call(), 'btn btn-sm btn-primary');
    U.button(bb, '⏩ +20 s', () => { clock += 20; paint(); });
    U.button(bb, 'Clear cache', () => { cache.clear(); paint(); });
    const out = U.out(ctl);
    function setCode() {
      code.set(`${cached ? `@st.cache_data(ttl=${ttl})\n` : ''}def load(path):\n    time.sleep(2)            # pretend this is slow\n    return pd.read_csv(path)\n\ndf = load("${arg}")\nst.dataframe(df)`);
    }
    function call() {
      setCode();
      const e = cache.get(arg), hit = cached && e && clock - e.t < e.ttl;
      const ms = hit ? 3 : 2000;
      calls.push({ arg, hit, ms }); if (calls.length > 9) calls.shift();
      if (cached && !hit) cache.set(arg, { t: clock, ttl });
      clock += ms / 1000;
      code.hl(hit ? 5 : 2);
      setTimeout(() => code.clear(), 600);
      paint();
    }
    function paint() {
      const ctx = tl.ctx; ctx.clearRect(0, 0, 460, 170);
      calls.forEach((c, i) => {
        const y = 6 + i * 18, w = Math.max(4, (c.ms / 2000) * 330);
        ctx.fillStyle = c.hit ? U.css('--ok') : U.css('--text'); ctx.globalAlpha = c.hit ? 0.9 : 0.75; ctx.fillRect(110, y, w, 13); ctx.globalAlpha = 1;
        ctx.fillStyle = U.css('--text-2'); ctx.font = '11px JetBrains Mono'; ctx.fillText(c.arg, 4, y + 11);
        ctx.fillText(c.hit ? 'hit 3 ms' : 'miss 2000 ms', 116 + w, y + 11);
      });
      const hits = calls.filter((c) => c.hit).length;
      out.innerHTML = `simulated clock: ${clock.toFixed(1)} s\ncache entries:\n${[...cache.entries()].map(([k, v]) => `  "${k}" → expires in ${Math.max(0, v.ttl - (clock - v.t)).toFixed(0)} s`).join('\n') || '  (empty)'}\n\nhits ${hits} / ${calls.length} calls`;
    }
    setCode(); paint();
  });

  /* ======================= charts ======================= */
  CV.widget('st-charts', { title: 'Built-in charts', desc: 'Pick a chart type. Streamlit plots each DataFrame column as a series, with the index on the x-axis.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const app = H.frame(stage); const cv = U.canvas(420, 220); app.main.append(cv.c);
    const code = H.code(stage); code.el.style.marginTop = '12px';
    let kind = 'line', n = 2, seed = 1;
    U.seg(ctl, [['line', 'line_chart'], ['area', 'area_chart'], ['bar', 'bar_chart'], ['scatter', 'scatter_chart']], kind, (v) => { kind = v; draw(); });
    U.slider(ctl, { label: 'Columns (series)', min: 1, max: 3, value: n, onInput: (v) => { n = v; draw(); } });
    U.button(ctl, '🎲 New data', () => { seed++; draw(); });
    U.out(ctl, 'Need more control? Pass a figure:\nst.altair_chart(chart)\nst.plotly_chart(fig)\nst.pyplot(fig)  # matplotlib\nst.map(df)      # lat/lon columns');
    function draw() {
      const r = U.rand(seed * 11), N = 20, cols = ['a', 'b', 'c'].slice(0, n);
      const data = cols.map((_, k) => { let v = 5 + k * 3; return Array.from({ length: N }, () => (v += (r() - 0.45) * 2.4)); });
      const ctx = cv.ctx; ctx.clearRect(0, 0, 420, 220);
      const all = data.flat(), lo = Math.min(0, ...all), hi = Math.max(...all) * 1.1;
      const p = U.plot(ctx, 420, 220, { x0: 0, x1: N - 1, y0: lo, y1: hi, xticks: 4, yticks: 4, fmtX: (v) => v.toFixed(0), fmtY: (v) => v.toFixed(0) });
      const pal = U.palette();
      data.forEach((s, k) => {
        const col = pal[k];
        if (kind === 'bar') s.forEach((v, i) => { const bw = (p.iw / N) / n; ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fillRect(p.X(i) - (p.iw / N) / 2 + k * bw, p.Y(v), bw - 1, p.Y(lo) - p.Y(v)); ctx.globalAlpha = 1; });
        else if (kind === 'scatter') s.forEach((v, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p.X(i), p.Y(v), 4, 0, 7); ctx.fill(); });
        else {
          if (kind === 'area') { ctx.fillStyle = col; ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.moveTo(p.X(0), p.Y(lo)); s.forEach((v, i) => ctx.lineTo(p.X(i), p.Y(v))); ctx.lineTo(p.X(N - 1), p.Y(lo)); ctx.fill(); ctx.globalAlpha = 1; }
          p.line(s.map((v, i) => [i, v]), col, 2.2);
        }
      });
      code.set(`df = pd.DataFrame(np.random.randn(20, ${n}).cumsum(0),\n                  columns=${JSON.stringify(cols).replace(/"/g, "'")})\nst.${kind}_chart(df)`);
    }
    draw();
  });

  /* ======================= multipage ======================= */
  CV.widget('st-multipage', { title: 'Multipage apps', desc: 'Click pages in the app sidebar. Compare the pages/ folder convention with st.navigation.' }, (body) => {
    let mode = 'nav', page = 0;
    const top = U.el('div', { style: 'margin-bottom:12px' }); body.append(top);
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const left = U.el('div', { class: 'w-col' }), right = U.el('div', { class: 'w-col' }); row.append(left, right);
    const tree = U.out(left), code = H.code(left); code.el.style.marginTop = '10px';
    const app = H.frame(right, { side: true });
    const P = [['🏠', 'Home', 'home'], ['📊', 'Dashboard', 'dashboard'], ['⚙️', 'Settings', 'settings']];
    U.seg(top, [['nav', 'st.navigation (recommended)'], ['dir', 'pages/ folder']], mode, (v) => { mode = v; draw(); });
    function draw() {
      tree.innerHTML = mode === 'dir'
        ? `my_app/\n├── <b>Home.py</b>            ← entry point\n└── pages/\n    ├── 1_📊_Dashboard.py\n    └── 2_⚙️_Settings.py\n\n$ streamlit run Home.py`
        : `my_app/\n├── <b>app.py</b>             ← router\n├── home.py\n├── dashboard.py\n└── settings.py\n\n$ streamlit run app.py`;
      code.set(mode === 'dir' ? `# pages are discovered from the folder;\n# file-name prefixes set the order\nst.page_link("pages/1_📊_Dashboard.py", label="Open dashboard")`
        : `pg = st.navigation([\n    st.Page("home.py", title="Home", icon="🏠", default=True),\n    st.Page("dashboard.py", title="Dashboard", icon="📊"),\n    st.Page("settings.py", title="Settings", icon="⚙️"),\n])\npg.run()`);
      app.side.innerHTML = P.map(([ic, t], i) => `<div data-p="${i}" style="padding:6px 8px;border-radius:6px;cursor:pointer;margin-bottom:2px;${i === page ? 'background:var(--surface-3);font-weight:600' : ''}">${ic} ${t}</div>`).join('');
      app.setTitle(`localhost:8501/<b>${page ? P[page][2] : ''}</b>`);
      app.main.innerHTML = `<h1 class="stm-flash">${P[page][0]} ${P[page][1]}</h1><p class="muted">Only <code>${mode === 'dir' ? (page ? `pages/${page}_${P[page][0]}_${P[page][1]}.py` : 'Home.py') : P[page][2] + '.py'}</code> runs for this page. <code>st.session_state</code> is shared by all pages.</p>`;
      app.side.querySelectorAll('[data-p]').forEach((d) => (d.onclick = () => { page = +d.dataset.p; draw(); }));
    }
    draw();
  });

  /* ======================= fragments ======================= */
  CV.widget('st-fragment', { title: 'Fragments rerun only part of the page', desc: 'Click the buttons. A full rerun re-executes every block; a button inside an @st.fragment re-executes only that fragment.' }, (body) => {
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const left = U.el('div', { class: 'w-col' }), right = U.el('div', { class: 'w-col' }); row.append(left, right);
    const code = H.code(left).set(`st.title("Report")
df = load_big_table()          # slow
st.dataframe(df)

@st.fragment
def live_chart():
    n = st.slider("Points", 10, 100)
    st.line_chart(df.head(n))
    st.button("Refresh chart")

live_chart()
st.button("Refresh everything")`);
    const app = H.frame(right);
    const cnt = { page: 0, frag: 0 };
    function block(name, n, inner) { return `<div class="stm-box" data-b="${name}" style="margin-bottom:8px;color:var(--text)"><div style="display:flex;justify-content:space-between;font:11px var(--mono);color:var(--text-3)"><span>${name}</span><span>executed ${n}×</span></div>${inner}</div>`; }
    function draw(flash) {
      app.main.innerHTML = `<h1 style="font-size:20px">Report</h1>${block('load_big_table + dataframe', cnt.page, '<table class="stm-table"><tr><td>…10,000 rows…</td></tr></table>')}${block('@st.fragment live_chart', cnt.frag, '<div class="pbar" style="height:30px;margin:6px 0"><i style="width:' + (30 + ((cnt.frag * 17) % 60)) + '%"></i></div><button class="stm-btn" id="fr">Refresh chart</button>')}<button class="stm-btn pri" id="all">Refresh everything</button>`;
      flash.forEach((b) => app.main.querySelector(`[data-b="${b}"]`).classList.add('stm-flash'));
      app.main.querySelector('#fr').onclick = () => { cnt.frag++; code.hl([5, 6, 7, 8, 9]); setTimeout(() => code.clear(), 700); draw(['@st.fragment live_chart']); };
      app.main.querySelector('#all').onclick = () => { cnt.page++; cnt.frag++; H.run(code, () => draw(['load_big_table + dataframe', '@st.fragment live_chart']), 30); };
    }
    cnt.page = cnt.frag = 1; draw([]);
    body.append(U.el('div', { class: 'w-note', html: 'Also: <code>@st.fragment(run_every="5s")</code> refreshes a fragment on a timer (live dashboards), and <code>@st.dialog</code> opens a modal whose body is a fragment.' }));
  });

  /* ======================= chat app ======================= */
  CV.widget('st-chat', { title: 'A chat app in 15 lines', desc: 'History lives in session_state; each rerun redraws every message; the reply is streamed with st.write_stream.' }, (body) => {
    const row = U.el('div', { class: 'w-row' }); body.append(row);
    const left = U.el('div', { class: 'w-col' }), right = U.el('div', { class: 'w-col' }); row.append(left, right);
    const code = H.code(left).set(`if "messages" not in st.session_state:
    st.session_state.messages = []

for m in st.session_state.messages:
    with st.chat_message(m["role"]):
        st.markdown(m["content"])

if prompt := st.chat_input("Ask something"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)
    with st.chat_message("assistant"):
        reply = st.write_stream(llm_stream(prompt))
    st.session_state.messages.append({"role": "assistant", "content": reply})`);
    const app = H.frame(right);
    const msgs = [];
    const box = U.el('div', { style: 'min-height:180px;max-height:260px;overflow-y:auto' }), inp = U.el('input', { type: 'text', placeholder: 'Ask something (press Enter)' });
    app.main.append(box, inp);
    const reply = (q) => { const l = q.toLowerCase(); return l.includes('cache') ? 'Use @st.cache_data for data and @st.cache_resource for models or connections.' : l.includes('state') ? 'st.session_state keeps values between reruns for one browser session.' : l.includes('deploy') ? 'Push to GitHub, then deploy on Streamlit Community Cloud with a requirements.txt.' : `You said "${q}". Each message triggers a rerun; the history is redrawn from session_state.`; };
    const paint = (streaming) => { box.innerHTML = msgs.map((m, i) => `<div class="stm-chat ${m.role}"><span class="av">${m.role === 'user' ? '🙂' : '✦'}</span><div>${U.esc(m.content)}${streaming && i === msgs.length - 1 ? '▍' : ''}</div></div>`).join('') || '<p class="muted small">No messages yet.</p>'; box.scrollTop = 1e6; };
    inp.onkeydown = (e) => {
      if (e.key !== 'Enter' || !inp.value.trim()) return;
      const q = inp.value.trim(); inp.value = '';
      msgs.push({ role: 'user', content: q }); const full = reply(q), m = { role: 'assistant', content: '' }; msgs.push(m);
      H.run(code, null, 15);
      let i = 0; const t = setInterval(() => { m.content = full.slice(0, (i += 2)); paint(true); if (i >= full.length) { clearInterval(t); paint(false); } }, 25);
    };
    paint(false);
  });
})();
