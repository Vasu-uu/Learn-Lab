/* Flask course demos */
(function () {
  'use strict';
  const U = CV.util, H = CV.mock;
  const esc = U.esc;
  const twoCols = (body) => { const row = U.el('div', { class: 'w-row' }); body.append(row); const l = U.el('div', { class: 'w-col' }), r = U.el('div', { class: 'w-col' }); row.append(l, r); return [l, r]; };
  const ta = (val, rows = 8) => { const t = U.el('textarea', { spellcheck: 'false', rows, style: 'width:100%;resize:vertical;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface-2);color:var(--text);font:12.5px/1.6 var(--mono)' }); t.value = val; return t; };
  const field = (label, el) => U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, label), el);
  const STATUS = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 304: 'Not Modified', 308: 'Permanent Redirect', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict', 415: 'Unsupported Media Type', 422: 'Unprocessable Entity', 429: 'Too Many Requests', 500: 'Internal Server Error', 503: 'Service Unavailable' };
  const statusPill = (code) => `<b style="color:${code < 300 ? 'var(--ok)' : code < 400 ? 'var(--text)' : code < 500 ? 'var(--warn)' : 'var(--bad)'}">${code} ${STATUS[code] || ''}</b>`;

  /* ======================= request lifecycle ======================= */
  CV.widget('fl-lifecycle', { title: 'The life of a request', desc: 'Step through what happens between typing a URL and seeing the page.' }, (body) => {
    const S = [
      ['Browser', 'Builds an HTTP request and sends it over TCP (TLS for https).', 'GET /users/7 HTTP/1.1\nHost: example.com\nAccept: text/html\nCookie: session=eyJ1aWQiOjd9…'],
      ['WSGI server', 'Gunicorn / Waitress / the dev server parses the bytes into a WSGI environ dict and calls app(environ, start_response).', "environ = {\n  'REQUEST_METHOD': 'GET',\n  'PATH_INFO': '/users/7',\n  'HTTP_COOKIE': 'session=…', …\n}"],
      ['Contexts pushed', 'Flask pushes the application context (current_app, g) and the request context (request, session).', 'request.method  == "GET"\nrequest.path    == "/users/7"\nsession["uid"]  == 7'],
      ['URL routing', 'Werkzeug matches the path against the URL map and converts variables.', "rule  = '/users/<int:user_id>'\nendpoint = 'show_user'\nview_args = {'user_id': 7}"],
      ['before_request', 'Hooks run in order; any that returns a value short-circuits the view (e.g. auth check).', '@app.before_request\ndef load_user():\n    g.user = User.get(session.get("uid"))'],
      ['View function', 'Your code runs and returns a str, dict, tuple, or Response.', '@app.get("/users/<int:user_id>")\ndef show_user(user_id):\n    user = db.get_or_404(User, user_id)\n    return render_template("user.html", user=user)'],
      ['Response', 'The return value is turned into a Response; after_request hooks can modify it.', 'HTTP/1.1 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 1532\nSet-Cookie: session=…; HttpOnly'],
      ['Teardown', 'teardown_request / teardown_appcontext run (close DB sessions); contexts are popped.', 'db.session.remove()\n# request and g are gone now'],
      ['Browser', 'Renders the HTML, then requests CSS, JS and images, each a new request.', '<h1>Asha</h1> …'],
    ];
    let k = 0, play = true;
    const track = U.el('div', { style: 'display:flex;gap:6px;overflow-x:auto;padding-bottom:8px' }); body.append(track);
    const cards = S.map(([t], i) => { const d = U.el('div', { style: 'flex:1 0 96px;padding:10px;border-radius:10px;border:1px solid var(--border);background:var(--surface);font:600 12px var(--font);text-align:center;cursor:pointer;transition:all .3s' }, `${i + 1}. ${t}`); d.onclick = () => { k = i; play = false; pb.innerHTML = '▶ Play'; paint(); }; track.append(d); return d; });
    const [l, r] = twoCols(body);
    const desc = U.el('div', { class: 'w-out', style: 'min-height:120px' }); l.append(desc);
    const code = U.el('pre', { class: 'codep', style: 'padding:12px 14px;margin:0;min-height:120px;white-space:pre-wrap' }); r.append(code);
    const bb = U.el('div', { class: 'w-btns', style: 'margin-top:12px' }); body.append(bb);
    const pb = U.button(bb, '❚❚ Pause', () => { play = !play; pb.innerHTML = play ? '❚❚ Pause' : '▶ Play'; });
    U.button(bb, '← Back', () => { play = false; pb.innerHTML = '▶ Play'; k = (k + S.length - 1) % S.length; paint(); });
    U.button(bb, 'Next →', () => { play = false; pb.innerHTML = '▶ Play'; k = (k + 1) % S.length; paint(); });
    function paint() {
      cards.forEach((c, i) => { c.style.background = i === k ? 'var(--text)' : i < k ? 'var(--surface-3)' : 'var(--surface)'; c.style.color = i === k ? 'var(--bg)' : ''; c.style.transform = i === k ? 'translateY(-2px)' : ''; });
      desc.innerHTML = `<b>Step ${k + 1}: ${S[k][0]}</b>\n${S[k][1]}`;
      code.innerHTML = U.highlight(S[k][2]);
    }
    paint();
    const t = setInterval(() => { if (play) { k = (k + 1) % S.length; paint(); } }, 2400);
    return () => clearInterval(t);
  });

  /* ======================= URL router ======================= */
  function compileRule(rule) {
    const params = [];
    const re = '^' + rule.replace(/[.*+?^${}()|[\]\\]/g, (c) => (c === '<' || c === '>' ? c : '\\' + c)).replace(/<(?:(\w+):)?(\w+)>/g, (_, conv = 'string', name) => {
      params.push([name, conv]);
      return { string: '([^/]+)', int: '(\\d+)', float: '(\\d+\\.\\d+)', path: '(.+)', uuid: '([0-9a-fA-F-]{36})' }[conv] || '([^/]+)';
    }) + '$';
    return { re: new RegExp(re), params };
  }
  CV.widget('fl-router', { title: 'URL routing playground', desc: 'Edit the routes (METHODS path → endpoint), type a URL, pick a method. See what Werkzeug matches, the converted arguments, or the error Flask returns.' }, (body) => {
    const [l, r] = twoCols(body);
    const routes = ta(`GET        /                         → index
GET        /users/<int:user_id>      → show_user
GET,POST   /login                    → login
GET        /files/<path:filename>    → download
GET        /blog/<slug>/             → post
DELETE     /api/items/<int:item_id>  → delete_item
GET        /price/<float:amount>     → price`, 9);
    l.append(field('Routes', routes));
    const url = U.el('input', { type: 'text', value: '/users/42', class: 'w-input', style: 'width:100%' });
    const meth = U.el('select'); ['GET', 'POST', 'PUT', 'DELETE'].forEach((m) => meth.append(U.el('option', {}, m)));
    const presets = U.el('div', { class: 'w-btns' });
    ['/users/42', '/users/abc', '/blog/hello', '/files/docs/a/b.pdf', '/login', '/price/9.99', '/nope'].forEach((p) => U.button(presets, p, () => { url.value = p; run(); }, 'btn btn-sm btn-ghost'));
    r.append(field('Request URL', url), field('Method', meth), presets);
    const out = U.out(r); out.style.marginTop = '10px';
    function run() {
      const rules = routes.value.split('\n').map((ln) => ln.match(/^\s*([A-Z,]+)\s+(\S+)\s*→\s*(\w+)/)).filter(Boolean).map(([, m, p, e]) => ({ methods: m.split(','), path: p, ep: e, ...compileRule(p) }));
      const path = url.value.split('?')[0], m = meth.value;
      let match = null, methodMismatch = null, slash = null;
      for (const R of rules) {
        const mm = path.match(R.re);
        if (mm) { if (R.methods.includes(m) || (m === 'HEAD' && R.methods.includes('GET'))) { match = [R, mm]; break; } methodMismatch = methodMismatch || R; }
        else if (R.path.endsWith('/') && (path + '/').match(R.re)) slash = R;
      }
      if (match) {
        const [R, mm] = match;
        const args = R.params.map(([n, conv], i) => { const raw = decodeURIComponent(mm[i + 1]); const v = conv === 'int' ? parseInt(raw, 10) : conv === 'float' ? parseFloat(raw) : raw; return [n, v, conv]; });
        out.innerHTML = `${statusPill(200)}  matched <b>${esc(R.path)}</b>\nendpoint: ${R.ep}\nview_args: {${args.map(([n, v]) => `'${n}': ${typeof v === 'number' ? v : `'${esc(v)}'`}`).join(', ')}}\n\n→ calls ${R.ep}(${args.map(([n, v]) => `${n}=${typeof v === 'number' ? v : `'${esc(v)}'`}`).join(', ')})\n   url_for('${R.ep}'${args.map(([n, v]) => `, ${n}=${typeof v === 'number' ? v : `'${esc(v)}'`}`).join('')}) == '${esc(path)}'`;
      } else if (slash) out.innerHTML = `${statusPill(308)}\nRule <b>${esc(slash.path)}</b> ends with a slash.\nFlask redirects ${esc(path)} → ${esc(path)}/ (like a folder).`;
      else if (methodMismatch) out.innerHTML = `${statusPill(405)}\n${esc(path)} exists but only allows ${methodMismatch.methods.join(', ')}.\nResponse includes header Allow: ${methodMismatch.methods.join(', ')}, HEAD, OPTIONS`;
      else out.innerHTML = `${statusPill(404)}\nNo rule matches ${esc(path)}.${/\/users\/\D/.test(path) ? '\n(<int:…> only matches digits, so "abc" falls through to 404.)' : ''}`;
    }
    [routes, url].forEach((e) => (e.oninput = run)); meth.onchange = run;
    run();
  });

  /* ======================= request inspector ======================= */
  CV.widget('fl-request', { title: 'What the request object sees', desc: 'Build a request. The panel shows the raw HTTP message and the matching request.* attributes in Flask.' }, (body) => {
    const [l, r] = twoCols(body);
    const meth = U.el('select'); ['GET', 'POST', 'PUT'].forEach((m) => meth.append(U.el('option', {}, m))); meth.value = 'POST';
    const path = U.el('input', { type: 'text', class: 'w-input', style: 'width:100%', value: '/search?q=flask&page=2' });
    let kind = 'form';
    const bodyTa = ta('name=Asha&email=asha%40example.com', 3);
    l.append(field('Method', meth), field('Path + query', path));
    const kc = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Body type')); l.append(kc);
    U.seg(kc, [['form', 'Form (urlencoded)'], ['json', 'JSON'], ['none', 'No body']], kind, (v) => { kind = v; bodyTa.value = v === 'json' ? '{"name": "Asha", "tags": ["ml", "web"]}' : v === 'form' ? 'name=Asha&email=asha%40example.com' : ''; run(); });
    l.append(field('Body', bodyTa));
    const raw = U.el('pre', { class: 'codep', style: 'padding:12px 14px;margin:0 0 10px;white-space:pre-wrap' }); r.append(U.el('div', { class: 'canvas-label' }, 'Raw HTTP request'), raw);
    const out = U.out(r);
    function run() {
      const [p, qs = ''] = path.value.split('?');
      const args = new URLSearchParams(qs), m = meth.value, hasBody = kind !== 'none' && m !== 'GET';
      const ctype = kind === 'json' ? 'application/json' : 'application/x-www-form-urlencoded';
      raw.textContent = `${m} ${path.value} HTTP/1.1\nHost: localhost:5000\nUser-Agent: Mozilla/5.0\nCookie: session=eyJ1aWQiOjd9.Zx…${hasBody ? `\nContent-Type: ${ctype}\nContent-Length: ${bodyTa.value.length}\n\n${bodyTa.value}` : ''}`;
      let form = '{}', json = 'None', err = '';
      if (hasBody && kind === 'form') form = '{' + [...new URLSearchParams(bodyTa.value)].map(([k, v]) => `'${esc(k)}': '${esc(v)}'`).join(', ') + '}';
      if (hasBody && kind === 'json') { try { json = esc(JSON.stringify(JSON.parse(bodyTa.value))).replace(/"/g, "'"); } catch (e) { err = '\n<span style="color:var(--bad)">request.get_json() → 400 Bad Request (invalid JSON)</span>'; } }
      out.innerHTML = `<b>request.method</b>      ${m}\n<b>request.path</b>        ${esc(p)}\n<b>request.args</b>        {${[...args].map(([k, v]) => `'${esc(k)}': '${esc(v)}'`).join(', ')}}\n<b>request.args.get("page", type=int)</b>  ${args.get('page') ? parseInt(args.get('page'), 10) : 'None'}\n<b>request.form</b>        ${form}\n<b>request.get_json()</b>  ${json}${err}\n<b>request.headers["User-Agent"]</b>  Mozilla/5.0\n<b>request.cookies["session"]</b>  eyJ1aWQiOjd9.Zx…\n${m === 'GET' && kind !== 'none' ? '\n<span style="color:var(--text-3)">GET requests normally carry no body.</span>' : ''}`;
    }
    [path, bodyTa].forEach((e) => (e.oninput = run)); meth.onchange = run;
    run();
  });

  /* ======================= mini Jinja2 ======================= */
  function jinja(src, ctx, autoescape) {
    const toks = []; let i = 0;
    const re = /\{\{([\s\S]*?)\}\}|\{%-?([\s\S]*?)-?%\}|\{#[\s\S]*?#\}/g; let m;
    while ((m = re.exec(src))) { if (m.index > i) toks.push(['t', src.slice(i, m.index)]); if (m[1] != null) toks.push(['e', m[1].trim()]); else if (m[2] != null) toks.push(['s', m[2].trim()]); i = re.lastIndex; }
    if (i < src.length) toks.push(['t', src.slice(i)]);
    let p = 0;
    function parse(stop) {
      const nodes = [];
      while (p < toks.length) {
        const [k, v] = toks[p];
        if (k === 's') {
          const w = v.split(/\s+/)[0];
          if (stop && stop.includes(w)) return nodes;
          p++;
          if (w === 'for') { const mm = v.match(/^for\s+(\w+)(?:\s*,\s*(\w+))?\s+in\s+(.+)$/); if (!mm) throw new Error('bad for: ' + v); const b = parse(['endfor', 'else']); let els = []; if (toks[p] && toks[p][1].startsWith('else')) { p++; els = parse(['endfor']); } p++; nodes.push({ t: 'for', a: mm[1], b2: mm[2], expr: mm[3], body: b, els }); }
          else if (w === 'if') { const br = [[v.slice(2).trim(), null]]; br[0][1] = parse(['elif', 'else', 'endif']); while (toks[p] && toks[p][1].split(/\s+/)[0] !== 'endif') { const tv = toks[p][1]; p++; if (tv.startsWith('elif')) br.push([tv.slice(4).trim(), parse(['elif', 'else', 'endif'])]); else br.push(['true', parse(['endif'])]); } p++; nodes.push({ t: 'if', br }); }
          else if (w === 'set') { const mm = v.match(/^set\s+(\w+)\s*=\s*(.+)$/); nodes.push({ t: 'set', name: mm[1], expr: mm[2] }); }
          else if (['extends', 'block', 'endblock', 'include', 'macro', 'endmacro'].includes(w)) nodes.push({ t: 'text', v: `<!-- {% ${v} %}: template inheritance runs across files; see the lesson -->` });
          else throw new Error('Unknown tag: ' + w);
        } else { p++; nodes.push(k === 't' ? { t: 'text', v } : { t: 'expr', v }); }
      }
      if (stop) throw new Error('Missing {% ' + stop[stop.length - 1] + ' %}');
      return nodes;
    }
    const FILTERS = {
      upper: (s) => String(s).toUpperCase(), lower: (s) => String(s).toLowerCase(), title: (s) => String(s).replace(/\b\w/g, (c) => c.toUpperCase()),
      capitalize: (s) => { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }, length: (s) => (s == null ? 0 : s.length ?? Object.keys(s).length), count: (s) => (s == null ? 0 : s.length),
      default: (s, d = '') => (s === undefined || s === null ? d : s), join: (s, d = '') => (Array.isArray(s) ? s.join(d) : s), round: (s, n = 0) => Number(s).toFixed(n),
      truncate: (s, n = 255) => (String(s).length > n ? String(s).slice(0, n - 3) + '...' : s), safe: (s) => ({ __safe: String(s) }), first: (s) => s && s[0], last: (s) => s && s[s.length - 1],
      sort: (s) => [...s].sort(), reverse: (s) => (Array.isArray(s) ? [...s].reverse() : String(s).split('').reverse().join('')), int: (s) => parseInt(s, 10) || 0, trim: (s) => String(s).trim(),
      replace: (s, a, b) => String(s).split(a).join(b), sum: (s) => s.reduce((x, y) => x + y, 0), escape: (s) => ({ __safe: esc(String(s)) }), e: (s) => ({ __safe: esc(String(s)) }),
    };
    function evalExpr(src, scope) {
      let q = 0; const s = src;
      const ws = () => { while (/\s/.test(s[q] || '')) q++; };
      const peek = (t) => { ws(); return s.startsWith(t, q) && (!/\w/.test(t) || !/\w/.test(s[q + t.length] || '')); };
      const eat = (t) => { if (peek(t)) { q += t.length; return true; } return false; };
      function primary() {
        ws(); let v;
        if (eat('(')) { v = or(); eat(')'); }
        else if (s[q] === '"' || s[q] === "'") { const c = s[q++]; let o = ''; while (q < s.length && s[q] !== c) o += s[q++]; q++; v = o; }
        else if (s[q] === '[') { q++; v = []; ws(); if (!eat(']')) { do { v.push(or()); } while (eat(',')); eat(']'); } }
        else if (/[\d.]/.test(s[q])) { const mm = s.slice(q).match(/^\d+(\.\d+)?/); q += mm[0].length; v = parseFloat(mm[0]); }
        else { const mm = s.slice(q).match(/^\w+/); if (!mm) throw new Error('Cannot parse: ' + s); q += mm[0].length; const n = mm[0]; v = n === 'true' || n === 'True' ? true : n === 'false' || n === 'False' ? false : n === 'none' || n === 'None' ? null : scope[n]; }
        for (;;) {
          ws();
          if (s[q] === '.') { q++; const mm = s.slice(q).match(/^\w+/); q += mm[0].length; v = v == null ? undefined : v[mm[0]]; }
          else if (s[q] === '[') { q++; const k = or(); eat(']'); v = v == null ? undefined : v[k]; }
          else break;
        }
        while (peek('|')) { q++; ws(); const mm = s.slice(q).match(/^\w+/); q += mm[0].length; const args = []; if (eat('(')) { if (!eat(')')) { do { args.push(or()); } while (eat(',')); eat(')'); } } const f = FILTERS[mm[0]]; if (!f) throw new Error('Unknown filter: ' + mm[0]); v = f(v && v.__safe != null && mm[0] !== 'safe' ? v.__safe : v, ...args); }
        return v;
      }
      function unary() { if (eat('-')) return -unary(); return primary(); }
      function mul() { let v = unary(); for (;;) { if (eat('*')) v *= unary(); else if (eat('//')) v = Math.floor(v / unary()); else if (eat('/')) v /= unary(); else if (eat('%')) v %= unary(); else return v; } }
      function add() { let v = mul(); for (;;) { if (eat('+')) v = v + mul(); else if (eat('-')) v -= mul(); else if (eat('~')) v = String(v ?? '') + String(mul() ?? ''); else return v; } }
      function cmp() { let v = add(); for (;;) { if (eat('==')) v = v == add(); else if (eat('!=')) v = v != add(); else if (eat('>=')) v = v >= add(); else if (eat('<=')) v = v <= add(); else if (eat('>')) v = v > add(); else if (eat('<')) v = v < add(); else if (peek('not in')) { q += 6; const r = add(); v = !(r && r.includes && r.includes(v)); } else if (peek('in')) { q += 2; const r = add(); v = !!(r && r.includes && r.includes(v)); } else if (peek('is')) { q += 2; const neg = eat('not'); ws(); const mm = s.slice(q).match(/^\w+/); q += mm[0].length; const t = mm[0] === 'defined' ? v !== undefined : mm[0] === 'none' ? v === null : mm[0] === 'even' ? v % 2 === 0 : mm[0] === 'odd' ? v % 2 === 1 : false; v = neg ? !t : t; } else return v; } }
      function not() { if (peek('not')) { q += 3; return !not(); } return cmp(); }
      function and() { let v = not(); while (peek('and')) { q += 3; const r = not(); v = v && r; } return v; }
      function or() { let v = and(); while (peek('or')) { q += 2; const r = and(); v = v || r; } return v; }
      const v = or(); ws(); if (q < s.length) throw new Error('Unexpected "' + s.slice(q) + '" in {{ ' + s + ' }}');
      return v;
    }
    const truthy = (v) => !(v === undefined || v === null || v === false || v === 0 || v === '' || (Array.isArray(v) && !v.length));
    function render(nodes, scope) {
      let o = '';
      for (const n of nodes) {
        if (n.t === 'text') o += n.v;
        else if (n.t === 'expr') { const v = evalExpr(n.v, scope); o += v && v.__safe != null ? v.__safe : v === undefined || v === null ? '' : autoescape ? esc(String(v)) : String(v); }
        else if (n.t === 'set') scope[n.name] = evalExpr(n.expr, scope);
        else if (n.t === 'if') { for (const [c, b] of n.br) if (truthy(evalExpr(c, scope))) { o += render(b, scope); break; } }
        else if (n.t === 'for') {
          let it = evalExpr(n.expr, scope); const items = Array.isArray(it) ? it : it && typeof it === 'object' ? Object.entries(it) : [];
          if (!items.length) o += render(n.els, scope);
          items.forEach((x, k) => { const sc = Object.create(scope); if (n.b2) { sc[n.a] = x[0]; sc[n.b2] = x[1]; } else sc[n.a] = x; sc.loop = { index: k + 1, index0: k, first: k === 0, last: k === items.length - 1, length: items.length }; o += render(n.body, sc); });
        }
      }
      return o;
    }
    return render(parse(null), Object.assign({}, ctx));
  }
  CV.jinja = jinja;

  CV.widget('fl-jinja', { title: 'Jinja2 playground', desc: 'Edit the template and the context passed to render_template. Supports {{ }}, filters, {% for %}, {% if %}, {% set %}, loop.*, and autoescaping.' }, (body) => {
    const PRE = {
      'Loop + filters': [`<h1>{{ title|upper }}</h1>
<p>{{ user.name|title }} has {{ orders|length }} orders.</p>
<ul>
{% for o in orders %}
  <li class="{{ 'paid' if o.paid else 'due' }}">#{{ loop.index }} {{ o.item }}: ₹{{ o.price|round(2) }}{% if not o.paid %} (due){% endif %}</li>
{% else %}
  <li>No orders yet.</li>
{% endfor %}
</ul>
<p>Total: ₹{{ orders|map_total }}</p>`.replace("{{ 'paid' if o.paid else 'due' }}", '{% if o.paid %}paid{% else %}due{% endif %}').replace('{{ orders|map_total }}', '{{ total }}'),
        `{\n  "title": "My orders",\n  "user": {"name": "asha rao"},\n  "orders": [\n    {"item": "Keyboard", "price": 1499, "paid": true},\n    {"item": "Mouse", "price": 599.5, "paid": false}\n  ],\n  "total": 2098.5\n}`],
      'Autoescaping (XSS)': [`<p>Comment: {{ comment }}</p>\n<p>Marked safe: {{ comment|safe }}</p>`, `{\n  "comment": "<script>alert('hacked')</script>"\n}`],
      'Conditionals + set': [`{% set n = items|length %}\n{% if n == 0 %}Empty cart\n{% elif n == 1 %}1 item\n{% else %}{{ n }} items: {{ items|join(", ") }}\n{% endif %}\n{{ missing|default("fallback value") }}`, `{\n  "items": ["pen", "book", "lamp"]\n}`],
    };
    const top = U.el('div', { style: 'margin-bottom:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:center' }); body.append(top);
    const [l, r] = twoCols(body);
    const tpl = ta('', 12), ctx = ta('', 7);
    l.append(field('templates/page.html', tpl), field('render_template("page.html", **context)', ctx));
    let auto = true;
    U.seg(top, Object.keys(PRE), 'Loop + filters', (k) => { tpl.value = PRE[k][0]; ctx.value = PRE[k][1]; run(); });
    U.check(top, 'Autoescape (Flask default for .html)', auto, (v) => { auto = v; run(); });
    const out = U.el('pre', { class: 'codep', style: 'padding:12px 14px;margin:0 0 10px;white-space:pre-wrap;min-height:120px' }), prev = U.el('div', { class: 'stm', style: 'padding:14px;min-height:80px' });
    r.append(U.el('div', { class: 'canvas-label' }, 'Rendered HTML (source)'), out, U.el('div', { class: 'canvas-label' }, 'Browser'), prev);
    function run() {
      try {
        const html = jinja(tpl.value, JSON.parse(ctx.value || '{}'), auto);
        out.textContent = html.replace(/\n\s*\n/g, '\n').trim();
        prev.innerHTML = html.replace(/<script[\s\S]*?<\/script>/gi, '<span style="color:var(--bad);font-weight:600">⚠ a &lt;script&gt; tag would execute here (XSS)</span>');
      } catch (e) { out.textContent = 'TemplateSyntaxError: ' + e.message; prev.innerHTML = ''; }
    }
    tpl.oninput = run; ctx.oninput = run;
    tpl.value = PRE['Loop + filters'][0]; ctx.value = PRE['Loop + filters'][1]; run();
  });

  /* ======================= Post/Redirect/Get ======================= */
  CV.widget('fl-prg', { title: 'POST / Redirect / GET', desc: 'Submit the order form, then press the browser refresh button. Without a redirect the POST is sent again.' }, (body) => {
    let prg = false, orders = 0, last = null;
    const top = U.el('div', { style: 'margin-bottom:12px' }); body.append(top);
    U.seg(top, [[false, 'return render_template(...) after POST'], [true, 'return redirect(url_for(...)) after POST']], prg, (v) => { prg = v; orders = 0; log.length = 0; last = null; draw(); });
    const [l, r] = twoCols(body);
    const app = H.frame(l, { title: 'localhost:5000/order' });
    const code = H.code(l, 'app.py'); code.el.style.marginTop = '10px';
    const logEl = U.out(r); const log = [];
    function req(m, p, status, note) { log.unshift(`${m.padEnd(4)} ${p.padEnd(10)} → ${status}  ${note}`); if (log.length > 9) log.pop(); }
    function submit() { orders++; if (prg) { req('POST', '/order', '302', 'order saved, Location: /order/done'); req('GET', '/order/done', '200', 'thank-you page'); last = 'GET'; } else { req('POST', '/order', '200', 'order saved, page rendered'); last = 'POST'; } draw(); }
    function refresh() { if (last === 'POST') { if (confirm('Confirm Form Resubmission: the page you are looking for used information that you entered. Repeat the action?')) { orders++; req('POST', '/order', '200', '⚠ DUPLICATE order saved'); } } else if (last === 'GET') req('GET', '/order/done', '200', 'just reloads the page'); draw(); }
    function draw() {
      code.set(prg ? `@app.route("/order", methods=["GET", "POST"])\ndef order():\n    if request.method == "POST":\n        save_order(request.form)\n        flash("Order placed!")\n        return redirect(url_for("order_done"))   # 302\n    return render_template("order.html")` : `@app.route("/order", methods=["GET", "POST"])\ndef order():\n    if request.method == "POST":\n        save_order(request.form)\n        return render_template("done.html")     # 200 to a POST\n    return render_template("order.html")`);
      app.setTitle(last ? (prg ? 'localhost:5000/<b>order/done</b>' : 'localhost:5000/<b>order</b> (POST result)') : 'localhost:5000/order');
      app.main.innerHTML = last ? `<h2>Thanks for your order!</h2><p class="muted">Orders in database: <b>${orders}</b></p><button class="stm-btn" id="rf">⟳ Refresh browser</button> <button class="stm-btn" id="nw">New order</button>` : `<div class="stm-w"><label>Item</label><input type="text" value="Keyboard"></div><button class="stm-btn pri" id="sb">Place order</button>`;
      const b = (id, f) => { const e = app.main.querySelector('#' + id); if (e) e.onclick = f; };
      b('sb', submit); b('rf', refresh); b('nw', () => { last = null; req('GET', '/order', '200', 'empty form'); draw(); });
      logEl.innerHTML = `<b>Server log</b>  (orders saved: ${orders})\n` + (log.join('\n') || 'no requests yet');
    }
    draw();
  });

  /* ======================= signed session cookie ======================= */
  const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64uStr = (s) => b64u(new TextEncoder().encode(s));
  const unb64u = (s) => { try { return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))); } catch (e) { return null; } };
  async function hmac(key, msg) {
    if (!crypto.subtle) return 'insecure-context';
    const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key || ' '), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return b64u(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg))).slice(0, 27);
  }
  CV.widget('fl-cookie', { title: 'How Flask\'s session cookie works', desc: 'The session is stored in the browser, base64-encoded and signed with SECRET_KEY. Users can read it but not change it. Try tampering with the cookie.' }, (body) => {
    const [l, r] = twoCols(body);
    const sess = ta('{"user_id": 7, "role": "user"}', 3), key = U.el('input', { type: 'text', class: 'w-input', style: 'width:100%', value: 'dev-secret-change-me' });
    l.append(field('session (server side, in your view)', sess), field('app.config["SECRET_KEY"]', key));
    const cookie = ta('', 3); r.append(field('Set-Cookie: session=… (what the browser stores, editable)', cookie));
    const bb = U.el('div', { class: 'w-btns' }); r.append(bb);
    U.button(bb, '😈 Tamper: make me admin', () => { const [p, sig] = cookie.value.split('.'); const d = unb64u(p); if (d) { cookie.value = b64uStr(d.replace(/"role":\s*"[^"]*"/, '"role": "admin"')) + '.' + sig; verify(); } });
    U.button(bb, '↺ Re-sign', () => sign());
    const out = U.out(r); out.style.marginTop = '10px';
    async function sign() { let payload; try { payload = JSON.stringify(JSON.parse(sess.value)); } catch (e) { out.innerHTML = '<span style="color:var(--bad)">session must be valid JSON</span>'; return; } const p = b64uStr(payload); cookie.value = p + '.' + (await hmac(key.value, p)); verify(); }
    async function verify() {
      const [p, sig] = cookie.value.trim().split('.'); const data = p && unb64u(p), good = p && sig === (await hmac(key.value, p));
      out.innerHTML = `decoded payload (anyone can read this!):\n  ${esc(data || '(not valid base64)')}\n\nsignature check with SECRET_KEY: ${good ? '<b style="color:var(--ok)">valid ✓</b>\nsession = ' + esc(data) : '<b style="color:var(--bad)">INVALID ✗</b>\nFlask ignores the cookie → session = {} (logged out)'}\n\n<span style="color:var(--text-3)">Real Flask (itsdangerous) also adds a timestamp\nand may compress the payload.</span>`;
    }
    sess.oninput = sign; key.oninput = verify; cookie.oninput = verify;
    sign();
  });

  /* ======================= password hashing ======================= */
  CV.widget('fl-hash', { title: 'Password hashing with a salt', desc: 'Never store passwords. Store a slow, salted hash. Hash the same password twice and compare; then verify a login attempt.' }, (body) => {
    const [l, r] = twoCols(body);
    const pw = U.el('input', { type: 'text', class: 'w-input', style: 'width:100%', value: 'hunter2' }), attempt = U.el('input', { type: 'text', class: 'w-input', style: 'width:100%', value: 'hunter2' });
    let iters = 100000;
    l.append(field('Password at sign-up', pw));
    U.slider(l, { label: 'PBKDF2 iterations (work factor)', min: 1000, max: 600000, step: 1000, value: iters, fmt: (v) => U.fmtInt(v), onInput: (v) => (iters = v) });
    U.button(l, 'generate_password_hash(password)', () => gen(), 'btn btn-sm btn-primary');
    l.append(field('Login attempt', attempt));
    U.button(l, 'check_password_hash(stored, attempt)', () => check(), 'btn btn-sm');
    const out = U.out(r);
    const hashes = [];
    async function derive(p, salt, n) {
      const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(p), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: n }, k, 256);
      return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    async function gen() {
      if (!crypto.subtle) { out.textContent = 'Web Crypto needs https or localhost.'; return; }
      const salt = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('') + 'xQ7v8kLm';
      const t0 = performance.now(), h = await derive(pw.value, salt, iters), ms = performance.now() - t0;
      hashes.unshift({ s: `pbkdf2:sha256:${iters}$${salt}$${h}`, ms }); if (hashes.length > 3) hashes.pop();
      paint();
    }
    async function check() {
      if (!hashes.length) await gen();
      const [meta, salt, h] = hashes[0].s.split('$'), n = +meta.split(':')[2];
      const ok = (await derive(attempt.value, salt, n)) === h;
      paint(`check_password_hash(stored, "${esc(attempt.value)}") → ${ok ? '<b style="color:var(--ok)">True</b>' : '<b style="color:var(--bad)">False</b>'}\n(re-hashes the attempt with the stored salt and iterations)`);
    }
    function paint(extra = '') {
      out.innerHTML = `<b>Stored in the database</b> (newest first):\n${hashes.map((x) => `${esc(x.s.slice(0, 64))}…\n  took ${x.ms.toFixed(0)} ms`).join('\n')}\n\nSame password, different salt → different hash,\nso equal passwords are not visible and\nprecomputed (rainbow) tables are useless.\n${extra ? '\n' + extra : ''}`;
    }
    gen();
  });

  /* ======================= ORM → SQL ======================= */
  const USERS = [[1, 'Asha', 'asha@ex.com', 29, 'Pune'], [2, 'Ravi', 'ravi@ex.com', 35, 'Delhi'], [3, 'Meera', 'meera@ex.com', 41, 'Pune'], [4, 'Kabir', 'kabir@ex.com', 23, 'Goa'], [5, 'Zoya', 'zoya@ex.com', 31, 'Delhi']];
  const POSTS = [[1, 'Hello Flask', 1], [2, 'Jinja tricks', 1], [3, 'SQLAlchemy 2.0', 2], [4, 'Deploying', 3], [5, 'Blueprints', 3], [6, 'Testing', 3]];
  CV.widget('fl-orm', { title: 'From SQLAlchemy to SQL', desc: 'Build a query. See the Python you write, the SQL SQLAlchemy sends, and the rows that come back. Then compare lazy loading with selectinload.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    let city = 'any', minAge = 0, order = 'name', limit = 10, mode = 'select', load = 'lazy';
    U.seg(ctl, [['select', 'Query users'], ['nplus1', 'Users + their posts']], mode, (v) => { mode = v; draw(); });
    const cc = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'where city ==')); U.seg(cc, ['any', 'Pune', 'Delhi', 'Goa'], city, (v) => { city = v; draw(); }); ctl.append(cc);
    U.slider(ctl, { label: 'where age >', min: 0, max: 45, value: minAge, onInput: (v) => { minAge = v; draw(); } });
    const oc = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'order_by')); U.seg(oc, [['name', 'name'], ['age', 'age'], ['-age', 'age desc']], order, (v) => { order = v; draw(); }); ctl.append(oc);
    U.slider(ctl, { label: 'limit', min: 1, max: 10, value: limit, onInput: (v) => { limit = v; draw(); } });
    const lc = U.el('div', { class: 'ctl' }, U.el('div', { class: 'ctl-top' }, 'Relationship loading')); U.seg(lc, [['lazy', 'lazy (default)'], ['selectin', 'selectinload']], load, (v) => { load = v; draw(); }); ctl.append(lc);
    const py = H.code(stage, 'python'), sql = U.el('pre', { class: 'codep', style: 'padding:12px 14px;margin:10px 0;white-space:pre-wrap' }), res = U.el('div'); stage.append(U.el('div', { class: 'canvas-label', style: 'margin-top:10px' }, 'SQL emitted'), sql, res);
    function draw() {
      const where = [], pw = [];
      if (city !== 'any') { where.push(`users.city = '${city}'`); pw.push(`User.city == "${city}"`); }
      if (minAge) { where.push(`users.age > ${minAge}`); pw.push(`User.age > ${minAge}`); }
      const ob = order === '-age' ? 'users.age DESC' : 'users.' + order, pob = order === '-age' ? 'User.age.desc()' : 'User.' + order;
      let rows = USERS.filter((u) => (city === 'any' || u[4] === city) && u[3] > minAge).sort((a, b) => (order === 'name' ? a[1].localeCompare(b[1]) : order === 'age' ? a[3] - b[3] : b[3] - a[3])).slice(0, limit);
      const stmt = `db.select(User)${pw.length ? `\n    .where(${pw.join(', ')})` : ''}\n    .order_by(${pob})\n    .limit(${limit})`;
      const sel = `SELECT users.id, users.name, users.email, users.age, users.city\nFROM users${where.length ? '\nWHERE ' + where.join(' AND ') : ''}\nORDER BY ${ob}\nLIMIT ${limit}`;
      if (mode === 'select') {
        py.set(`users = db.session.execute(\n    ${stmt.replace(/\n/g, '\n    ')}\n).scalars().all()`);
        sql.innerHTML = U.highlight(sel);
        res.innerHTML = `<div class="tbl-wrap" style="margin:0"><table><thead><tr><th>id</th><th>name</th><th>email</th><th>age</th><th>city</th></tr></thead><tbody>${rows.map((u) => `<tr>${u.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="5" style="color:var(--text-3)">no rows</td></tr>'}</tbody></table></div>`;
      } else {
        py.set(`users = db.session.execute(\n    ${stmt.replace(/\n/g, '\n    ')}${load === 'selectin' ? '\n    .options(selectinload(User.posts))' : ''}\n).scalars().all()\nfor u in users:                      # template loop\n    print(u.name, [p.title for p in u.posts])`);
        const ids = rows.map((u) => u[0]);
        const q = load === 'lazy' ? [sel, ...ids.map((id) => `SELECT posts.* FROM posts WHERE ${id} = posts.user_id`)] : [sel, `SELECT posts.* FROM posts WHERE posts.user_id IN (${ids.join(', ')})`];
        sql.innerHTML = U.highlight(q.join(';\n\n')) + `\n\n<span style="color:${load === 'lazy' ? '#e5604d' : '#4caf7d'}">-- ${q.length} queries${load === 'lazy' ? ` (1 + N, N = ${ids.length}): the N+1 problem` : ' total, whatever N is'}</span>`;
        res.innerHTML = `<div class="tbl-wrap" style="margin:0"><table><thead><tr><th>user</th><th>posts</th></tr></thead><tbody>${rows.map((u) => `<tr><td>${u[1]}</td><td>${POSTS.filter((p) => p[2] === u[0]).map((p) => p[1]).join(', ') || '—'}</td></tr>`).join('')}</tbody></table></div>`;
      }
    }
    draw();
  });

  /* ======================= contexts ======================= */
  CV.widget('fl-context', { title: 'Application and request contexts', desc: 'Step through one request. Watch which proxies (current_app, g, request, session) are available at each moment.' }, (body) => {
    const steps = [
      ['Python imports app.py', [], 'app = create_app()\n# no request yet'],
      ['Script touches current_app', [], "print(current_app.name)\n# RuntimeError: Working outside of application context."],
      ['with app.app_context():', ['app'], "with app.app_context():\n    db.create_all()        # current_app and g work"],
      ['Request arrives: app context pushed', ['app'], '# Flask pushes an app context for this request'],
      ['Request context pushed', ['app', 'req'], '# request and session now point at THIS request'],
      ['View runs', ['app', 'req'], 'g.user = load_user()\nreturn render_template("x.html", q=request.args["q"])'],
      ['Teardown: request context popped', ['app'], '@app.teardown_request\ndef cleanup(exc): …'],
      ['Teardown: app context popped', [], '@app.teardown_appcontext\ndef close_db(exc):\n    db.session.remove()\n# g is discarded'],
    ];
    let k = 0;
    const [l, r] = twoCols(body);
    const stack = U.el('div', { style: 'display:flex;flex-direction:column-reverse;gap:6px;min-height:150px;justify-content:flex-start;padding:12px;border:1px dashed var(--border-2);border-radius:12px' });
    const proxies = U.el('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px' });
    l.append(U.el('div', { class: 'canvas-label' }, 'Context stack'), stack, proxies);
    const title = U.el('div', { class: 'w-out', style: 'margin-bottom:10px' }), code = U.el('pre', { class: 'codep', style: 'padding:12px 14px;margin:0;white-space:pre-wrap;min-height:90px' });
    r.append(title, code);
    const bb = U.el('div', { class: 'w-btns', style: 'margin-top:10px' }); r.append(bb);
    U.button(bb, '← Back', () => { k = Math.max(0, k - 1); paint(); });
    U.button(bb, 'Next →', () => { k = Math.min(steps.length - 1, k + 1); paint(); }, 'btn btn-sm btn-primary');
    U.button(bb, '↺', () => { k = 0; paint(); });
    function paint() {
      const [t, st, c] = steps[k];
      stack.innerHTML = st.map((s) => `<div style="padding:10px 12px;border-radius:9px;font:600 13px var(--font);animation:pageIn .35s var(--ease);${s === 'app' ? 'background:var(--surface-3)' : 'background:var(--text);color:var(--bg)'}">${s === 'app' ? 'AppContext  →  current_app, g' : 'RequestContext  →  request, session'}</div>`).join('') || '<div class="muted small" style="text-align:center">empty</div>';
      proxies.innerHTML = [['current_app', st.includes('app')], ['g', st.includes('app')], ['request', st.includes('req')], ['session', st.includes('req')]].map(([n, on]) => `<div style="padding:7px 10px;border-radius:8px;border:1px solid var(--border);font:12.5px var(--mono);${on ? '' : 'opacity:.4;text-decoration:line-through'}">${n} ${on ? '✓' : '✗'}</div>`).join('');
      title.innerHTML = `<b>Step ${k + 1}/${steps.length}</b>  ${t}`;
      code.innerHTML = U.highlight(c).replace('RuntimeError', '<span style="color:#e5604d">RuntimeError</span>');
    }
    paint();
  });

  /* ======================= REST playground ======================= */
  CV.widget('fl-rest', { title: 'REST API playground', desc: 'A real in-memory Flask-style API for /api/todos. Send requests and watch status codes, headers and JSON.' }, (body) => {
    let db = [{ id: 1, title: 'Learn routing', done: true }, { id: 2, title: 'Write tests', done: false }], nextId = 3;
    const [l, r] = twoCols(body);
    const meth = U.el('select'); ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach((m) => meth.append(U.el('option', {}, m)));
    const path = U.el('input', { type: 'text', class: 'w-input', style: 'width:100%', value: '/api/todos' });
    const bodyTa = ta('{"title": "Deploy app"}', 3);
    l.append(field('Method', meth), field('Path', path), field('JSON body', bodyTa));
    const pre = U.el('div', { class: 'w-btns' }); l.append(pre);
    [['GET', '/api/todos'], ['GET', '/api/todos/2'], ['POST', '/api/todos', '{"title": "Deploy app"}'], ['POST', '/api/todos', '{"done": true}'], ['PATCH', '/api/todos/2', '{"done": true}'], ['DELETE', '/api/todos/1'], ['GET', '/api/todos/99'], ['PUT', '/api/todos']].forEach(([m, p, b]) => U.button(pre, `${m} ${p.replace('/api/todos', '…')}${b ? ' ' + b.slice(0, 12) + '…' : ''}`, () => { meth.value = m; path.value = p; if (b) bodyTa.value = b; send(); }, 'btn btn-sm btn-ghost'));
    U.button(l, 'Send request', () => send(), 'btn btn-sm btn-primary');
    const resp = U.el('pre', { class: 'codep', style: 'padding:12px 14px;margin:0 0 10px;white-space:pre-wrap;min-height:160px' }); r.append(U.el('div', { class: 'canvas-label' }, 'Response'), resp);
    const view = H.code(r, 'the view that handled it');
    const V = {
      list: `@bp.get("/todos")\ndef list_todos():\n    return [t.to_dict() for t in Todo.query.all()]   # list → JSON`,
      get: `@bp.get("/todos/<int:todo_id>")\ndef get_todo(todo_id):\n    todo = db.get_or_404(Todo, todo_id)\n    return todo.to_dict()`,
      create: `@bp.post("/todos")\ndef create_todo():\n    data = request.get_json()\n    if not data or not data.get("title"):\n        return {"error": "title is required"}, 400\n    todo = Todo(title=data["title"])\n    db.session.add(todo); db.session.commit()\n    return todo.to_dict(), 201, {"Location": url_for(".get_todo", todo_id=todo.id)}`,
      patch: `@bp.patch("/todos/<int:todo_id>")\ndef update_todo(todo_id):\n    todo = db.get_or_404(Todo, todo_id)\n    for k in ("title", "done"):\n        if k in request.json: setattr(todo, k, request.json[k])\n    db.session.commit()\n    return todo.to_dict()`,
      del: `@bp.delete("/todos/<int:todo_id>")\ndef delete_todo(todo_id):\n    db.session.delete(db.get_or_404(Todo, todo_id))\n    db.session.commit()\n    return "", 204`,
      none: `# no view matched this method + path`,
    };
    function send() {
      const m = meth.value, p = path.value.trim(), mm = p.match(/^\/api\/todos(?:\/(\d+))?\/?$/);
      let code = 404, json = { error: 'Not found' }, headers = {}, v = 'none';
      let data = null; if (['POST', 'PUT', 'PATCH'].includes(m)) { try { data = JSON.parse(bodyTa.value || 'null'); } catch (e) { data = undefined; } }
      if (mm && !mm[1]) {
        if (m === 'GET') { code = 200; json = db; v = 'list'; }
        else if (m === 'POST') { v = 'create'; if (data === undefined) { code = 400; json = { error: 'Invalid JSON' }; } else if (!data || !data.title) { code = 400; json = { error: 'title is required' }; } else { const t = { id: nextId++, title: String(data.title), done: !!data.done }; db.push(t); code = 201; json = t; headers.Location = `/api/todos/${t.id}`; } }
        else { code = 405; json = { error: 'Method Not Allowed' }; headers.Allow = 'GET, HEAD, OPTIONS, POST'; }
      } else if (mm) {
        const id = +mm[1], t = db.find((x) => x.id === id);
        if (m === 'GET') { v = 'get'; if (t) { code = 200; json = t; } }
        else if (m === 'PATCH' || m === 'PUT') { v = 'patch'; if (!t) { } else if (data === undefined) { code = 400; json = { error: 'Invalid JSON' }; } else { Object.assign(t, ...['title', 'done'].filter((k) => data && k in data).map((k) => ({ [k]: data[k] }))); code = 200; json = t; } }
        else if (m === 'DELETE') { v = 'del'; if (t) { db = db.filter((x) => x !== t); code = 204; json = null; } }
        else { code = 405; json = { error: 'Method Not Allowed' }; headers.Allow = 'DELETE, GET, HEAD, OPTIONS, PATCH, PUT'; }
      }
      const hdr = Object.assign(json === null ? {} : { 'Content-Type': 'application/json' }, headers);
      resp.innerHTML = `HTTP/1.1 ${statusPill(code)}\n${Object.entries(hdr).map(([k, x]) => `${k}: ${x}`).join('\n')}${json === null ? '\n\n(no body)' : '\n\n' + esc(JSON.stringify(json, null, 2))}`;
      view.set(V[v]);
    }
    send();
  });

  /* ======================= hooks order ======================= */
  CV.widget('fl-hooks', { title: 'Which hooks run, in what order?', desc: 'Choose what happens inside the request. The timeline shows the functions Flask calls.' }, (body) => {
    let mode = 'ok';
    const top = U.el('div', { style: 'margin-bottom:12px' }); body.append(top);
    U.seg(top, [['ok', 'View returns normally'], ['before', 'before_request returns a response'], ['abort', 'View calls abort(404)'], ['crash', 'View raises an exception']], mode, (v) => { mode = v; draw(); });
    const line = U.el('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center' }); body.append(line);
    const out = U.out(body); out.style.marginTop = '12px';
    const code = H.code(body, 'hooks.py').set(`@app.before_request\ndef check_auth(): ...            # return a response to short-circuit\n\n@app.after_request\ndef add_headers(resp):\n    resp.headers["X-Frame-Options"] = "DENY"\n    return resp                   # must return the response\n\n@app.errorhandler(404)\ndef not_found(e):\n    return render_template("404.html"), 404\n\n@app.teardown_request\ndef cleanup(exc): ...             # always runs; exc is the error or None`);
    code.el.style.marginTop = '12px';
    const SEQ = {
      ok: [['before_request', 1], ['view', 1], ['after_request', 1], ['teardown_request', 1], ['teardown_appcontext', 1]],
      before: [['before_request', 1, '→ returns redirect'], ['view', 0], ['after_request', 1], ['teardown_request', 1], ['teardown_appcontext', 1]],
      abort: [['before_request', 1], ['view', 1, '→ abort(404)'], ['errorhandler(404)', 1], ['after_request', 1], ['teardown_request', 1], ['teardown_appcontext', 1]],
      crash: [['before_request', 1], ['view', 1, '→ raises ZeroDivisionError'], ['errorhandler(500)', 1, 'InternalServerError'], ['after_request', 1], ['teardown_request', 1, 'exc = ZeroDivisionError'], ['teardown_appcontext', 1]],
    };
    const NOTE = { ok: 'Normal path: 200 response.', before: 'If a before_request function returns a value, Flask treats it as the response and skips the view.', abort: 'abort() raises an HTTPException; the matching errorhandler builds the response.', crash: 'Unhandled exceptions become 500 (in debug mode you see the interactive debugger instead). teardown still runs.' };
    function draw() {
      line.innerHTML = SEQ[mode].map(([n, on, x], i) => `<div style="padding:9px 12px;border-radius:10px;font:600 12.5px var(--mono);animation:pageIn .4s ${i * 0.12}s both;${on ? 'background:var(--text);color:var(--bg)' : 'border:1px dashed var(--border-2);color:var(--text-3);text-decoration:line-through'}">${n}${x ? `<br><span style="font-weight:400;font-size:11px;opacity:.75">${x}</span>` : ''}</div>${i < SEQ[mode].length - 1 ? '<span style="color:var(--text-3)">→</span>' : ''}`).join('');
      out.textContent = NOTE[mode];
    }
    draw();
  });

  /* ======================= gunicorn workers ======================= */
  CV.widget('fl-workers', { title: 'Workers, threads and throughput', desc: 'Each sync worker handles one request at a time. Raise the traffic and watch the queue and latency.' }, (body) => {
    const { stage, ctl } = U.split(body, { stageFlex: '3 1 420px' });
    const W = 460, Hh = 250; const { c, ctx } = U.canvas(W, Hh); stage.append(U.el('div', { class: 'canvas-box' }, c));
    let workers = 3, threads = 1, rps = 8, svc = 300;
    U.slider(ctl, { label: 'Workers (--workers)', min: 1, max: 9, value: workers, onInput: (v) => (workers = v) });
    U.slider(ctl, { label: 'Threads per worker (--threads)', min: 1, max: 4, value: threads, onInput: (v) => (threads = v) });
    U.slider(ctl, { label: 'Incoming requests / second', min: 1, max: 40, value: rps, onInput: (v) => (rps = v) });
    U.slider(ctl, { label: 'Time per request (ms, mostly I/O)', min: 50, max: 1000, step: 10, value: svc, onInput: (v) => (svc = v) });
    const out = U.out(ctl);
    let queue = [], slots = [], t = 0, acc = 0, done = [], dropped = 0;
    U.loop(c, (dt) => {
      t += dt; acc += dt * rps;
      while (acc >= 1) { acc--; queue.push({ t0: t }); }
      const cap = workers * threads;
      slots = slots.filter((s) => { if (t >= s.end) { done.push(t - s.r.t0); return false; } return true; });
      while (slots.length < cap && queue.length) { const r = queue.shift(); slots.push({ r, start: t, end: t + svc / 1000, w: slots.length }); }
      if (queue.length > 120) { dropped += queue.length - 120; queue = queue.slice(-120); }
      done = done.slice(-60);
      ctx.clearRect(0, 0, W, Hh);
      ctx.fillStyle = U.css('--text-2'); ctx.font = '600 11px Inter'; ctx.fillText(`queue (${queue.length})`, 10, 18); ctx.fillText('workers', 220, 18);
      queue.slice(0, 60).forEach((_, i) => { ctx.fillStyle = U.css('--warn'); ctx.globalAlpha = 0.8; ctx.fillRect(10 + (i % 12) * 15, 28 + Math.floor(i / 12) * 15, 11, 11); }); ctx.globalAlpha = 1;
      const used = new Map(); slots.forEach((s, i) => used.set(i, s));
      for (let wk = 0; wk < workers; wk++) for (let th = 0; th < threads; th++) {
        const i = wk * threads + th, x = 220 + th * 58, y = 28 + wk * 24, s = slots[i];
        ctx.strokeStyle = U.css('--border-2'); ctx.strokeRect(x, y, 52, 18);
        if (s) { const p = U.clamp((t - s.start) / (s.end - s.start), 0, 1); ctx.fillStyle = U.css('--text'); ctx.fillRect(x + 1, y + 1, 50 * p, 16); }
        if (th === 0) { ctx.fillStyle = U.css('--text-3'); ctx.font = '10px JetBrains Mono'; ctx.fillText('w' + (wk + 1), 196, y + 13); }
      }
      const lat = done.length ? done.reduce((a, b) => a + b, 0) / done.length : 0, capRps = (cap * 1000) / svc;
      out.innerHTML = `capacity ≈ ${cap} × 1000/${svc} = <b>${capRps.toFixed(1)} req/s</b>\nincoming: ${rps} req/s → ${rps > capRps ? '<b style="color:var(--bad)">overloaded, queue grows</b>' : '<b style="color:var(--ok)">keeping up</b>'}\navg latency: <b>${(lat * 1000).toFixed(0)} ms</b>\n\ngunicorn -w ${workers}${threads > 1 ? ` --threads ${threads}` : ''} "app:create_app()"\nrule of thumb: workers = 2 × CPU cores + 1`;
    });
  });
})();
