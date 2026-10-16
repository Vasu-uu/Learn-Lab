/* =========================================================
   LearnLab app: course loading, routing, dashboard, lessons,
   progress, spaced review, notes, search
   ========================================================= */
(async function () {
  'use strict';
  const U = CV.util;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $('#main');
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  /* ---------------- load every registered course ---------------- */
  const loadScript = (src) => new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src));
    document.body.append(s);
  });
  const loadErrors = [];
  // cache-bust so newly added or edited course files show up on a normal reload
  const bust = (src) => `${src}?v=${Date.now()}`;
  try { await loadScript(bust('courses/courses.js')); } catch (e) { loadErrors.push(e.message); }
  for (const folder of CV.courseFolders) {
    const before = CV.courses.length;
    try {
      await loadScript(bust(`courses/${folder}/course.js`));
      if (CV.courses.length === before) throw new Error(`courses/${folder}/course.js did not call CV.defineCourse`);
      const c = CV.courses[CV.courses.length - 1];
      c.folder = folder; CV._cur = c.id;
      for (const f of c.files) { CV._cur = c.id; await loadScript(bust(`courses/${folder}/${f}`)); }
    } catch (e) { console.error(e); loadErrors.push(e.message); }
  }
  CV.chapters.sort((a, b) => (a.course === b.course ? a.n - b.n : 0));

  const lessonsOf = (cid) => CV.chapters.filter((c) => c.course === cid);
  const pagesOf = (cid) => [...lessonsOf(cid), ...CV.extras.filter((x) => x.course === cid)];
  const pid = (p) => (p.n ? `${p.course}/${p.n}` : `${p.course}/x/${p.slug}`);
  const url = (p) => '#/c/' + pid(p);
  const pageById = (id) => [...CV.chapters, ...CV.extras].find((p) => pid(p) === id);
  const demosIn = (p) => (p.sections || []).reduce((a, s) => a + (s.html.match(/data-widget=/g) || []).length, 0);

  /* ---------------- persistent state ---------------- */
  const KEY = 'learnlab-v1';
  let S = { done: {}, quiz: {}, flips: {}, xp: 0, last: null, notes: {}, srs: {}, days: {}, roadmap: {}, read: {} };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = Object.assign(S, JSON.parse(raw));
    else {
      const old = JSON.parse(localStorage.getItem('visionlab-progress-v1') || 'null');
      if (old) { // migrate the single-course version
        const m = (k) => k.replace(/^ch(\d+)/, 'cv/$1');
        Object.keys(old.done || {}).forEach((k) => (S.done[m(k)] = true));
        Object.entries(old.quiz || {}).forEach(([k, v]) => (S.quiz[m(k)] = v));
        S.xp = old.xp || 0; S.roadmap = old.roadmap || {};
      }
    }
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  CV.state = S; CV.save = save;

  const today = (d = new Date()) => d.toISOString().slice(0, 10);
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return today(d); };
  function touchDay() { const t = today(); S.days[t] = (S.days[t] || 0) + 1; save(); paintChips(); }
  function streak() {
    let n = 0; const d = new Date();
    if (!S.days[today(d)]) d.setDate(d.getDate() - 1);
    while (S.days[today(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function paintChips() { $('#xpVal').textContent = S.xp; $('#streakVal').textContent = streak(); }

  function addXP(n, msg) {
    if (n <= 0) return;
    S.xp += n; save(); paintChips();
    const chip = $('#xpChip'); chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
    if (msg) toast(`+${n}`, msg);
  }
  CV.addXP = addXP;

  function toast(icon, msg) {
    const t = U.el('div', { class: 'toast' }, U.el('div', { class: 'ti' }, icon), U.el('div', {}, msg));
    $('#toasts').append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 2600);
  }

  /* ---------------- spaced repetition ---------------- */
  const INTERVALS = [0, 1, 3, 7, 16, 35, 80];
  const cardsOf = (p) => (p.checks || []).map(([q, a], i) => ({ id: `${pid(p)}#${i}`, q, a, page: p }));
  function enroll(p) { let n = 0; cardsOf(p).forEach((c) => { if (!S.srs[c.id]) { S.srs[c.id] = { box: 0, due: today() }; n++; } }); save(); return n; }
  const allCards = () => CV.chapters.flatMap(cardsOf).filter((c) => S.srs[c.id]);
  const dueCards = () => allCards().filter((c) => S.srs[c.id].due <= today());

  /* ---------------- theme ---------------- */
  $('#themeBtn').onclick = () => {
    const html = document.documentElement;
    html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('ll-theme', html.dataset.theme); } catch (e) {}
    const y = scrollY; route(true); scrollTo(0, y);
  };

  /* ---------------- sidebar ---------------- */
  const ICON = {
    home: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    review: '<svg viewBox="0 0 24 24" width="17" height="17"><rect x="4" y="5" width="13" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 3h11a1 1 0 0 1 1 1v13" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    notes: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" width="14" height="14"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="3" fill="none"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const courseProgress = (cid) => { const L = lessonsOf(cid); return L.length ? L.filter((c) => S.done[pid(c)]).length / L.length : 0; };

  let curCourse = null;
  function renderNav() {
    const nDue = dueCards().length;
    let html = `<div class="nav-group">
      <a class="nav-item" href="#/">${ICON.home}Dashboard</a>
      <a class="nav-item" href="#/review">${ICON.review}Review${nDue ? `<span class="badge">${nDue}</span>` : ''}</a>
      <a class="nav-item" href="#/notes">${ICON.notes}Notes</a>
    </div><div class="nav-label">Courses</div>`;
    for (const c of CV.courses) {
      const open = c.id === curCourse, pct = courseProgress(c.id);
      html += `<div class="nav-course ${open ? 'open' : ''}"><a class="nav-course-head" href="#/c/${c.id}"><span class="glyph">${c.glyph || c.title[0]}</span><span class="nc-t">${c.title}<small>${Math.round(pct * 100)}% complete</small></span></a>`;
      if (open) {
        for (const p of c.parts) {
          const items = pagesOf(c.id).filter((x) => x.part === p.n);
          if (!items.length) continue;
          html += `<div class="nav-part"><button class="nav-part-title">${c.parts.length > 1 ? `${ROMAN[p.n - 1]} · ` : ''}${p.title}${ICON.chev}</button><ul class="nav-list">`;
          for (const x of items) {
            const id = pid(x);
            html += `<li><a class="nav-link ${S.done[id] ? 'done' : ''}" href="${url(x)}"><span class="nav-num">${S.done[id] ? ICON.check : x.n || x.icon || '•'}</span><span>${x.title}</span></a></li>`;
          }
          html += '</ul></div>';
        }
      }
      html += '</div>';
    }
    html += `<a class="nav-item add" href="#/guide">${ICON.plus}Add a course</a>`;
    $('#nav').innerHTML = html;
    $$('.nav-part-title').forEach((b) => (b.onclick = () => b.parentElement.classList.toggle('collapsed')));
    const h = location.hash || '#/';
    $$('#nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === h));
    const act = $('#nav .nav-link.active'); act && act.scrollIntoView({ block: 'nearest' });
  }
  $('#menuBtn').onclick = () => document.body.classList.toggle('nav-open');
  $('#scrim').onclick = () => document.body.classList.remove('nav-open');

  /* ---------------- router ---------------- */
  let cleanups = [];
  function route(keepScroll) {
    U.stopAllLoops();
    cleanups.forEach((f) => { try { f(); } catch (e) {} });
    cleanups = [];
    document.body.classList.remove('nav-open');
    closeNotes(true);
    const h = location.hash || '#/';
    let m;
    // legacy / course-relative links (#/ch/7, #/x/glossary) resolve inside the current course
    if ((m = h.match(/^#\/ch\/(\d+)/))) return location.replace(`#/c/${curCourse || (CV.courses[0] || {}).id}/${m[1]}`);
    if ((m = h.match(/^#\/x\/([\w-]+)/))) return location.replace(`#/c/${curCourse || (CV.courses[0] || {}).id}/x/${m[1]}`);
    if ((m = h.match(/^#\/c\/([\w-]+)\/x\/([\w-]+)/))) { curCourse = m[1]; const p = pageById(`${m[1]}/x/${m[2]}`); p ? renderLesson(p) : renderNotFound(); }
    else if ((m = h.match(/^#\/c\/([\w-]+)\/(\d+)/))) { curCourse = m[1]; const p = pageById(`${m[1]}/${m[2]}`); p ? renderLesson(p) : renderNotFound(); }
    else if ((m = h.match(/^#\/c\/([\w-]+)/))) { curCourse = m[1]; CV.course(m[1]) ? renderCourse(CV.course(m[1])) : renderNotFound(); }
    else if (h.startsWith('#/review')) renderReview();
    else if (h.startsWith('#/notes')) renderNotes();
    else if (h.startsWith('#/guide')) renderGuide();
    else renderDashboard();
    renderNav();
    paintChips();
    if (!keepScroll) setReadProgress();
  }
  addEventListener('hashchange', () => { route(); scrollTo(0, 0); });

  const page = (html) => { main.innerHTML = `<div class="page">${html}</div>`; };
  function renderNotFound() { page(`<section class="wrap"><h1 class="display">Not found</h1><p class="lead">That page does not exist. <a href="#/">Back to the dashboard</a>.</p></section>`); }

  /* ---------------- shared bits ---------------- */
  function ring(pct, size = 56, stroke = 4) {
    const r = size / 2 - stroke, C = 2 * Math.PI * r;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="transition:stroke-dashoffset 1s var(--ease)"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${size / 4.6}" font-weight="700" fill="var(--text)">${Math.round(pct * 100)}%</text></svg>`;
  }
  const bar = (pct) => `<div class="pbar"><i style="width:${pct * 100}%"></i></div>`;

  /* animated dot field used on the dashboard and course heroes */
  function dotField(canvas, { density = 22, amp = 1 } = {}) {
    const ctx = canvas.getContext('2d');
    let W, H;
    const resize = () => { const d = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas); cleanups.push(() => ro.disconnect());
    const fg = U.css('--text');
    let mx = -999, my = -999;
    const mv = (e) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
    canvas.parentElement.addEventListener('pointermove', mv);
    U.loop(canvas, (dt, t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = fg;
      for (let y = density / 2; y < H; y += density) for (let x = density / 2; x < W; x += density) {
        const fx = x / W, fy = y / H;
        let v = 0.5 + 0.5 * Math.sin(fx * 7 + t * 0.9 + Math.sin(fy * 5 + t * 0.6) * 1.6) * Math.cos(fy * 6 - t * 0.5);
        const d = Math.hypot(x - mx, y - my); if (d < 120) v = Math.max(v, 1 - d / 120);
        const fade = U.clamp((fx - 0.42) / 0.38, 0, 1);
        v *= fade * amp;
        ctx.globalAlpha = 0.05 * fade + v * 0.42;
        const r = 0.6 + v * 2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  /* ---------------- dashboard ---------------- */
  function greet() { const h = new Date().getHours(); return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
  function heatmap(weeks = 20) {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() - (weeks - 1) * 7);
    let cols = '';
    for (let w = 0; w < weeks; w++) {
      let cells = '';
      for (let k = 0; k < 7; k++) {
        const key = today(d), v = S.days[key] || 0, lvl = v ? Math.min(4, 1 + Math.floor(Math.log2(v))) : 0, future = key > today();
        cells += `<i class="hm l${lvl}${future ? ' f' : ''}" title="${key}: ${v} activit${v === 1 ? 'y' : 'ies'}"></i>`;
        d.setDate(d.getDate() + 1);
      }
      cols += `<div class="hm-col">${cells}</div>`;
    }
    return `<div class="heat">${cols}</div>`;
  }

  function renderDashboard() {
    curCourse = null;
    document.title = CV.PLATFORM;
    const all = CV.chapters, doneN = all.filter((c) => S.done[pid(c)]).length;
    const nDue = dueCards().length, last = S.last && pageById(S.last);
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    const lastCourse = last && CV.course(last.course);
    page(`
      <section class="dash-hero"><canvas class="field"></canvas>
        <div class="dash-hero-in">
          <p class="eyebrow">${date}</p>
          <h1 class="display">${greet()}.</h1>
          <p class="lead">${doneN ? `You have finished <b>${doneN}</b> of ${all.length} lessons across ${CV.courses.length} course${CV.courses.length > 1 ? 's' : ''}.` : `Welcome to your learning space. Pick a course and start with lesson one.`}${nDue ? ` <b>${nDue}</b> review card${nDue > 1 ? 's are' : ' is'} waiting.` : ''}</p>
          <div class="stats">
            <div class="stat"><b>${streak()}</b><span>day streak</span></div>
            <div class="stat"><b>${S.xp}</b><span>XP earned</span></div>
            <div class="stat"><b>${doneN}<small>/${all.length}</small></b><span>lessons done</span></div>
            <div class="stat"><b>${nDue}</b><span>cards due</span></div>
          </div>
        </div>
      </section>
      ${loadErrors.length ? `<section class="wrap" style="padding-bottom:0">${CV.h.warn('Some course files failed to load:<br>' + loadErrors.map(U.esc).join('<br>'))}</section>` : ''}
      ${last ? `<section class="wrap" style="padding-bottom:0"><a class="continue reveal" href="${url(last)}">
          <div class="cont-glyph">${lastCourse.glyph || lastCourse.title[0]}</div>
          <div class="cont-body"><small>Continue · ${lastCourse.title}</small><h3>${last.n ? last.n + '. ' : ''}${last.title}</h3>${bar(courseProgress(last.course))}</div>
          <span class="btn btn-primary">${ICON.play}Resume</span></a></section>` : ''}
      <section class="wrap">
        <div class="sec-head"><h2>Your courses</h2><a href="#/guide" class="muted-link">How to add one →</a></div>
        <div class="course-grid">
          ${CV.courses.map((c) => {
            const L = lessonsOf(c.id), pct = courseProgress(c.id), nD = pagesOf(c.id).reduce((a, p) => a + demosIn(p), 0);
            const next = L.find((x) => !S.done[pid(x)]) || L[0];
            return `<div class="course-card reveal"><a class="cc-top" href="#/c/${c.id}"><div class="cc-glyph">${c.glyph || c.title[0]}</div>${ring(pct)}</a>
              <a href="#/c/${c.id}" class="cc-title"><h3>${c.title}</h3><p class="cc-sub">${c.subtitle || ''}</p></a>
              <p class="cc-desc">${c.desc || ''}</p>
              <div class="cc-meta"><span>${L.length} lessons</span><span>${nD} demos</span><span>${L.reduce((a, x) => a + (x.minutes || 0), 0) / 60 | 0} h</span></div>
              <div class="cc-actions"><a class="btn btn-primary btn-sm" href="${next ? url(next) : '#/c/' + c.id}">${pct ? 'Continue' : 'Start'}${ICON.arrow}</a><a class="btn btn-sm" href="#/c/${c.id}">Syllabus</a></div></div>`;
          }).join('')}
          <a class="course-card add-card reveal" href="#/guide"><div class="add-plus">${ICON.plus}</div><h3>Add your next course</h3><p class="cc-desc">Drop a new folder into <code>courses/</code>, or give Claude your next PDF and ask it to add the course.</p></a>
        </div>
      </section>
      <section class="wrap two-col">
        <div class="panel reveal"><div class="sec-head"><h3>Study activity</h3><span class="muted">${Object.keys(S.days).length} active days</span></div>${heatmap()}<div class="hm-legend">less <i class="hm l0"></i><i class="hm l1"></i><i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i> more</div></div>
        <div class="panel reveal"><div class="sec-head"><h3>Review</h3><a class="muted-link" href="#/review">Open →</a></div>
          <p class="big-num">${nDue}</p><p class="muted">${nDue ? 'cards due today' : allCards().length ? 'all caught up' : 'Finish a lesson to add its questions to your review deck.'}</p>
          <div class="boxes">${[0, 1, 2, 3, 4, 5].map((b) => { const n = allCards().filter((c) => Math.min(5, S.srs[c.id].box) === b).length; return `<div><i style="height:${Math.min(100, n * 8)}%"></i><span>${n}</span></div>`; }).join('')}</div>
          <p class="muted small">Boxes: new → mastered</p></div>
      </section>`);
    dotField($('.dash-hero .field'));
    revealObserve();
  }

  /* ---------------- course overview ---------------- */
  function renderCourse(c) {
    document.title = `${c.title} — ${CV.PLATFORM}`;
    const L = lessonsOf(c.id), pct = courseProgress(c.id), P = pagesOf(c.id);
    const next = L.find((x) => !S.done[pid(x)]) || L[0];
    const mins = L.reduce((a, x) => a + (x.minutes || 0), 0), nD = P.reduce((a, p) => a + demosIn(p), 0), nQ = L.reduce((a, x) => a + (x.quiz || []).length, 0);
    page(`
      <section class="course-hero"><canvas class="field"></canvas><div class="course-hero-in">
        <div class="crumbs"><a href="#/">Dashboard</a><span>/</span><span>Course</span></div>
        <h1 class="display">${c.title}</h1>
        ${c.subtitle ? `<p class="serif-sub">${c.subtitle}</p>` : ''}
        <p class="lead">${c.desc || ''}</p>
        <div class="hero-actions"><a class="btn btn-primary" href="${url(next)}">${ICON.play}${pct ? 'Continue: ' + next.title : 'Start lesson 1'}</a>
          ${P.filter((p) => !p.n).map((x) => `<a class="btn" href="${url(x)}">${x.title}</a>`).join('')}</div>
        <div class="stats">
          <div class="stat"><b>${L.length}</b><span>lessons</span></div><div class="stat"><b>${(mins / 60).toFixed(1)}h</b><span>reading</span></div>
          <div class="stat"><b>${nD}</b><span>live demos</span></div><div class="stat"><b>${nQ}</b><span>quiz questions</span></div>
        </div>
      </div><div class="course-ring">${ring(pct, 120, 6)}</div></section>
      <section class="wrap">
        ${c.parts.map((p) => {
          const items = P.filter((x) => x.part === p.n);
          if (!items.length) return '';
          const chs = items.filter((x) => x.n), pp = chs.length ? chs.filter((x) => S.done[pid(x)]).length / chs.length : 0;
          return `<div class="part reveal"><div class="part-head"><span class="part-no">${c.parts.length > 1 ? 'Part ' + ROMAN[p.n - 1] : ''}</span><div><h2>${p.title}</h2><p class="muted">${p.desc || ''}</p></div><div class="part-pct">${chs.length ? Math.round(pp * 100) + '%' : ''}</div></div>
            <div class="lesson-list">${items.map((x) => {
              const id = pid(x), nW = demosIn(x), rd = (S.read[id] || []).length / ((x.sections || []).length || 1);
              return `<a class="lesson-row ${S.done[id] ? 'done' : ''}" href="${url(x)}"><span class="lr-num">${S.done[id] ? ICON.check : x.n ? String(x.n).padStart(2, '0') : x.icon || '•'}</span>
                <span class="lr-main"><b>${x.title}</b><small>${x.sub || ''}</small></span>
                <span class="lr-meta">${x.minutes ? `${x.minutes} min` : 'reference'}${nW ? ` · ${nW} demos` : ''}</span>
                <span class="lr-read">${!S.done[id] && rd > 0 && rd < 1 ? `<span class="mini-bar"><i style="width:${rd * 100}%"></i></span>` : ''}</span>
                <span class="lr-go">${ICON.arrow}</span></a>`;
            }).join('')}</div></div>`;
        }).join('')}
      </section>`);
    dotField($('.course-hero .field'), { density: 20 });
    revealObserve();
  }

  /* ---------------- lesson page ---------------- */
  function renderLesson(ch) {
    const id = pid(ch), course = CV.course(ch.course), part = course.parts.find((p) => p.n === ch.part) || course.parts[0];
    S.last = id; S.lastCourse = ch.course; save(); touchDay();
    document.title = `${ch.n ? ch.n + '. ' : ''}${ch.title} — ${course.title}`;
    const P = pagesOf(ch.course), idx = P.indexOf(ch), prev = P[idx - 1], next = P[idx + 1];
    const secs = ch.sections.map((s, i) => `<section id="${s.id}" class="reveal" data-sec="${s.id}"><h2><span class="h-num">${ch.n ? ch.n + '.' + (i + 1) : String(i + 1).padStart(2, '0')}</span>${s.title}</h2>${s.html}</section>`).join('');
    const hasChecks = ch.checks && ch.checks.length, enrolled = hasChecks && cardsOf(ch).every((c) => S.srs[c.id]);
    const checks = hasChecks ? `<section id="check" class="reveal"><h2><span class="h-num">✓</span>Check yourself</h2>
        <div class="check-head"><p>Answer in your head first, then tap a card to flip it.</p><button class="btn btn-sm" id="enrollBtn" ${enrolled ? 'disabled' : ''}>${enrolled ? '✓ In your review deck' : '+ Add to review deck'}</button></div>
        <div class="checks">${ch.checks.map(([q, a], i) => `<div class="flip" data-k="${id}#${i}"><div class="flip-inner"><div class="flip-face"><span class="q-n">Question ${i + 1}</span><div class="q-t">${q}</div><span class="hint">↻ Tap to reveal</span></div><div class="flip-face flip-back"><span class="q-n">Answer</span><div class="q-a">${a}</div></div></div></div>`).join('')}</div></section>` : '';
    const quiz = ch.quiz && ch.quiz.length ? `<section id="quiz" class="reveal"><h2><span class="h-num">?</span>Lesson quiz</h2><div id="quizMount"></div></section>` : '';
    const toc = [...ch.sections.map((s) => [s.id, s.title]), ...(checks ? [['check', 'Check yourself']] : []), ...(quiz ? [['quiz', 'Lesson quiz']] : [])];
    const doneNow = !!S.done[id], nW = (secs.match(/data-widget=/g) || []).length;
    page(`
      <header class="ch-hero"><canvas></canvas><div class="ch-hero-inner">
        <div class="crumbs"><a href="#/">Dashboard</a><span>/</span><a href="#/c/${course.id}">${course.title}</a><span>/</span><span>${part.title}</span></div>
        ${ch.n ? `<div class="ch-kicker">Lesson ${ch.n}</div>` : '<div class="ch-kicker">Reference</div>'}
        <h1 class="display">${ch.title}</h1>
        <p class="sub">${ch.sub || ''}</p>
        <div class="ch-meta">${ch.minutes ? `<span class="pill">${ch.minutes} min read</span>` : ''}${nW ? `<span class="pill">${nW} interactive demo${nW > 1 ? 's' : ''}</span>` : ''}${ch.quiz ? `<span class="pill">${ch.quiz.length}-question quiz</span>` : ''}${doneNow ? '<span class="pill solid">✓ Completed</span>' : ''}</div>
      </div></header>
      <div class="ch-layout"><article class="content">${secs}${checks}${quiz}
        ${ch.n ? `<div class="ch-complete reveal"><div><h3>${doneNow ? 'Lesson completed' : 'Finished this lesson?'}</h3><p>${doneNow ? 'Its questions are in your review deck. Revisit any time.' : 'Mark it complete to track progress, earn 100 XP and add its questions to your review deck.'}</p></div><button class="btn ${doneNow ? '' : 'btn-primary'}" id="completeBtn">${doneNow ? 'Mark as not done' : '✓ Mark complete'}</button></div>` : ''}
        <nav class="ch-nav">${prev ? `<a href="${url(prev)}"><small>← Previous</small><span>${prev.title}</span></a>` : '<span></span>'}${next ? `<a class="next" href="${url(next)}"><small>Next →</small><span>${next.title}</span></a>` : `<a class="next" href="#/c/${course.id}"><small>Done →</small><span>Back to course</span></a>`}</nav>
        <p class="kbd-hint">Tip: <kbd>←</kbd> <kbd>→</kbd> move between lessons · <kbd>N</kbd> opens notes · <kbd>Ctrl K</kbd> searches</p>
      </article>
      <aside class="toc">
        <div class="toc-card"><div class="toc-prog"><span>Reading</span><b id="readPct">0%</b></div><div class="pbar"><i id="readBar"></i></div></div>
        <h5>On this page</h5><ol>${toc.map(([i, t]) => `<li><a href="#" data-target="${i}"><span class="tick"></span>${t}</a></li>`).join('')}</ol>
        <button class="btn btn-sm btn-block" id="notesBtn">${ICON.notes} Notes${S.notes[id] ? ' •' : ''}</button>
        ${nW ? `<div class="toc-card"><b>Image for demos</b><div class="row-btns"><button class="btn btn-sm" id="tocUpload">Use my photo</button>${U.hasUserImage() ? '<button class="btn btn-sm btn-ghost" id="tocReset">Reset</button>' : ''}</div></div>` : ''}
      </aside></div>
      <aside class="notes-drawer" id="notesDrawer"><div class="nd-head"><b>Notes</b><span class="muted small">${ch.title}</span><button class="icon-btn" id="ndClose" aria-label="Close notes">✕</button></div>
        <textarea id="ndText" placeholder="Write what you learned, questions, links… Saved automatically in this browser.">${U.esc(S.notes[id] || '')}</textarea><div class="nd-foot"><span id="ndSaved" class="muted small">${S.notes[id] ? 'Saved' : ''}</span><a href="#/notes" class="muted-link small">All notes →</a></div></aside>`);

    chapterHeroAnim($('.ch-hero canvas'));
    mountWidgets(main);
    bindCode(main);
    bindFlips(main);
    if (quiz) mountQuiz($('#quizMount'), ch, id);
    const cb = $('#completeBtn');
    if (cb) cb.onclick = () => {
      if (S.done[id]) { delete S.done[id]; save(); route(true); return; }
      S.done[id] = true; const n = enroll(ch); save();
      addXP(100, `Lesson ${ch.n} complete${n ? ` · ${n} cards added to review` : ''}`);
      confetti(); route(true);
    };
    const eb = $('#enrollBtn');
    if (eb) eb.onclick = () => { const n = enroll(ch); eb.disabled = true; eb.textContent = '✓ In your review deck'; toast('+' + n, 'cards added to review'); renderNav(); };
    $$('.toc a').forEach((a) => (a.onclick = (e) => { e.preventDefault(); document.getElementById(a.dataset.target).scrollIntoView({ behavior: 'smooth' }); }));
    const up = $('#tocUpload'); if (up) up.onclick = U.pickImage;
    const tr = $('#tocReset'); if (tr) tr.onclick = U.resetImage;
    $('#notesBtn').onclick = () => openNotes();
    $('#ndClose').onclick = () => closeNotes();
    let tmr;
    $('#ndText').oninput = (e) => {
      $('#ndSaved').textContent = 'Saving…';
      clearTimeout(tmr);
      tmr = setTimeout(() => { const v = e.target.value; if (v.trim()) S.notes[id] = v; else delete S.notes[id]; S.notesAt = S.notesAt || {}; S.notesAt[id] = Date.now(); save(); $('#ndSaved').textContent = 'Saved'; }, 400);
    };
    cleanups.push(U.onImage(() => { const y = scrollY; route(true); scrollTo(0, y); }));
    const key = (e) => {
      if (/input|textarea|select/i.test(document.activeElement.tagName) || e.ctrlKey || e.metaKey || e.altKey || !$('#searchModal').hidden) return;
      if (e.key === 'ArrowRight' && next) location.hash = url(next);
      else if (e.key === 'ArrowLeft' && prev) location.hash = url(prev);
      else if (e.key.toLowerCase() === 'n') { e.preventDefault(); openNotes(); }
    };
    addEventListener('keydown', key); cleanups.push(() => removeEventListener('keydown', key));
    trackReading(ch, id, toc.map((t) => t[0]));
    revealObserve();
  }

  function openNotes() { const d = $('#notesDrawer'); if (!d) return; d.classList.add('open'); setTimeout(() => $('#ndText').focus(), 250); }
  function closeNotes(silent) { const d = $('#notesDrawer'); if (d) d.classList.remove('open'); if (!silent && document.activeElement) document.activeElement.blur(); }

  function trackReading(ch, id, ids) {
    const secIds = ch.sections.map((s) => s.id);
    const read = new Set(S.read[id] || []);
    const links = new Map($$('.toc a').map((a) => [a.dataset.target, a]));
    const paint = () => {
      const pct = secIds.length ? [...read].filter((x) => secIds.includes(x)).length / secIds.length : 0;
      $('#readPct').textContent = Math.round(pct * 100) + '%'; $('#readBar').style.width = pct * 100 + '%';
      read.forEach((r) => links.get(r) && links.get(r).classList.add('read'));
    };
    // a section counts as read once its end has scrolled into view
    const ends = secIds.map((s) => { const sec = document.getElementById(s), m = U.el('div', { class: 'sec-end', 'data-s': s }); sec.append(m); return m; });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !read.has(e.target.dataset.s)) { read.add(e.target.dataset.s); S.read[id] = [...read]; save(); paint(); } }));
    ends.forEach((m) => io.observe(m));
    const spy = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { links.forEach((a) => a.classList.remove('on')); const a = links.get(e.target.id); a && a.classList.add('on'); } }), { rootMargin: '-20% 0px -70% 0px' });
    ids.forEach((i) => { const s = document.getElementById(i); s && spy.observe(s); });
    cleanups.push(() => { io.disconnect(); spy.disconnect(); });
    paint();
  }

  function chapterHeroAnim(canvas) {
    const ctx = canvas.getContext('2d');
    let W, H;
    const resize = () => { const d = Math.min(2, devicePixelRatio || 1); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas); cleanups.push(() => ro.disconnect());
    const rnd = U.rand(3), fg = U.css('--text');
    const P = Array.from({ length: 42 }, () => ({ x: 0.45 + rnd() * 0.55, y: rnd(), vx: (rnd() - 0.5) * 0.015, vy: (rnd() - 0.5) * 0.015, r: 0.8 + rnd() * 1.8 }));
    U.loop(canvas, (dt) => {
      ctx.clearRect(0, 0, W, H);
      for (const p of P) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < 0.4 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1; }
      ctx.strokeStyle = fg; ctx.fillStyle = fg;
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
        const d = Math.hypot((P[i].x - P[j].x) * W, (P[i].y - P[j].y) * H);
        if (d < 120) { ctx.globalAlpha = (1 - d / 120) * 0.16; ctx.beginPath(); ctx.moveTo(P[i].x * W, P[i].y * H); ctx.lineTo(P[j].x * W, P[j].y * H); ctx.stroke(); }
      }
      P.forEach((p) => { ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
    });
  }

  function mountWidgets(root) {
    $$('[data-widget]', root).forEach((host) => {
      const name = host.dataset.widget, def = CV.widgets[name];
      if (!def) { host.innerHTML = CV.h.warn(`Missing demo: <code>${U.esc(name)}</code>`); return; }
      const opts = host.dataset.opts ? JSON.parse(host.dataset.opts) : {};
      const meta = Object.assign({}, def.meta, opts.meta || {});
      const body = U.el('div', { class: 'widget-body' });
      const shell = U.el('div', { class: 'widget' },
        U.el('div', { class: 'widget-head', html: `<div class="wi"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="16" cy="6" r="2" fill="currentColor"/><circle cx="10" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="18" r="2" fill="currentColor"/></svg></div><div><h4>${meta.title}</h4><p>${meta.desc || ''}</p></div><span class="tag">${meta.tag || 'Interactive'}</span>` }),
        body);
      host.replaceWith(shell);
      try { const c = def.mount(body, opts, shell); if (typeof c === 'function') cleanups.push(c); }
      catch (err) { console.error(err); body.innerHTML = `<div class="w-note">This demo failed to load: ${U.esc(err.message)}</div>`; }
    });
  }

  function bindCode(root) {
    $$('.copy-btn', root).forEach((b) => (b.onclick = () => {
      const txt = b.closest('.code').querySelector('pre').innerText;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { b.textContent = 'copied ✓'; setTimeout(() => (b.textContent = 'copy'), 1400); }).catch(() => { b.textContent = 'select & copy'; });
    }));
  }
  function bindFlips(root) {
    $$('.flip', root).forEach((f) => (f.onclick = () => {
      f.classList.toggle('on');
      const k = f.dataset.k;
      if (k && !S.flips[k]) { S.flips[k] = 1; save(); addXP(5); }
    }));
  }

  /* ---------------- quiz ---------------- */
  function mountQuiz(el, ch, id) {
    const Q = ch.quiz, L = 'ABCDEFG';
    let i = 0, score = 0;
    const draw = () => {
      if (i >= Q.length) return result();
      const q = Q[i];
      el.innerHTML = `<div class="quiz"><div class="quiz-head"><h3>Test your understanding</h3><span class="qprog">${i + 1} / ${Q.length} · score ${score}</span></div><div class="quiz-track"><i style="width:${(i / Q.length) * 100}%"></i></div>
        <div class="quiz-body"><div class="quiz-q">${q.q}</div><div class="opts">${q.o.map((o, k) => `<button class="opt" data-k="${k}"><span class="ol">${L[k]}</span><span>${o}</span></button>`).join('')}</div><div id="qx"></div></div></div>`;
      $$('.opt', el).forEach((b) => (b.onclick = () => {
        const k = +b.dataset.k, ok = k === q.a;
        if (ok) score++;
        $$('.opt', el).forEach((x) => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        $('#qx', el).innerHTML = `<div class="explain"><b>${ok ? 'Correct.' : 'Not quite.'}</b> ${q.e || ''}</div><div class="quiz-foot"><button class="btn btn-primary btn-sm" id="qn">${i + 1 < Q.length ? 'Next question →' : 'See result'}</button></div>`;
        $('.qprog', el).textContent = `${i + 1} / ${Q.length} · score ${score}`;
        $('#qn', el).onclick = () => { i++; draw(); };
        $('#qn', el).focus();
      }));
    };
    const result = () => {
      const best = S.quiz[id] || 0, pct = score / Q.length;
      if (score > best) { addXP((score - best) * 20, `Quiz: ${score}/${Q.length}`); S.quiz[id] = score; save(); }
      touchDay();
      if (pct === 1) confetti();
      el.innerHTML = `<div class="quiz"><div class="quiz-head"><h3>Quiz complete</h3><span class="qprog">best ${Math.max(best, score)} / ${Q.length}</span></div><div class="quiz-track"><i style="width:100%"></i></div>
        <div class="quiz-body quiz-result"><div class="score">${score}/${Q.length}</div><p>${pct === 1 ? 'Perfect score.' : pct >= 0.7 ? 'Solid. Review the questions you missed and try again.' : 'Worth another pass through the lesson; the demos help.'}</p><button class="btn btn-primary" id="qr">↻ Retry quiz</button></div></div>`;
      $('#qr', el).onclick = () => { i = 0; score = 0; draw(); };
    };
    draw();
  }

  /* ---------------- review (spaced repetition) ---------------- */
  function renderReview() {
    curCourse = null;
    document.title = `Review — ${CV.PLATFORM}`;
    const all = allCards();
    let queue = dueCards().sort(() => Math.random() - 0.5), done = 0;
    const mastered = all.filter((c) => S.srs[c.id].box >= 4).length;
    page(`<section class="wrap narrow">
      <div class="crumbs"><a href="#/">Dashboard</a><span>/</span><span>Review</span></div>
      <h1 class="display">Review</h1>
      <p class="lead">Spaced repetition: cards you know come back less often, cards you miss come back sooner. Finishing a lesson adds its "Check yourself" questions here.</p>
      <div class="stats"><div class="stat"><b>${queue.length}</b><span>due now</span></div><div class="stat"><b>${all.length}</b><span>in deck</span></div><div class="stat"><b>${mastered}</b><span>mastered</span></div><div class="stat"><b>${streak()}</b><span>day streak</span></div></div>
      <div id="rv" class="rv"></div></section>`);
    const host = $('#rv');
    function draw() {
      if (!all.length) { host.innerHTML = `<div class="empty"><h3>Your deck is empty</h3><p class="muted">Open a lesson and press <b>+ Add to review deck</b> or mark it complete.</p><a class="btn btn-primary" href="${CV.courses[0] ? '#/c/' + CV.courses[0].id : '#/'}">Go to a course</a></div>`; return; }
      if (!queue.length) {
        const nextDue = all.map((c) => S.srs[c.id].due).sort()[0];
        host.innerHTML = `<div class="empty"><h3>All caught up${done ? ` · ${done} reviewed` : ''}</h3><p class="muted">Next cards are due ${nextDue <= today() ? 'today' : 'on ' + new Date(nextDue + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}.</p></div>`;
        if (done) confetti();
        return;
      }
      const c = queue[0], st = S.srs[c.id], course = CV.course(c.page.course);
      host.innerHTML = `<div class="rv-meta"><span>${course.title} · ${c.page.n}. ${c.page.title}</span><span>${queue.length} left · box ${st.box}</span></div>
        <div class="flip rv-card"><div class="flip-inner"><div class="flip-face"><span class="q-n">Question</span><div class="q-t">${c.q}</div><span class="hint">↻ Tap or press Space to reveal</span></div><div class="flip-face flip-back"><span class="q-n">Answer</span><div class="q-a">${c.a}</div><a class="muted-link small" href="${url(c.page)}" style="margin-top:auto">Open lesson →</a></div></div></div>
        <div class="rv-btns" hidden><button class="btn" data-g="0">Again<small>1</small></button><button class="btn" data-g="1">Hard<small>2</small></button><button class="btn btn-primary" data-g="2">Good<small>3</small></button><button class="btn" data-g="3">Easy<small>4</small></button></div>`;
      const card = $('.rv-card', host), btns = $('.rv-btns', host);
      const reveal = () => { card.classList.add('on'); btns.hidden = false; };
      card.onclick = reveal;
      $$('[data-g]', host).forEach((b) => (b.onclick = () => grade(+b.dataset.g)));
      host.reveal = reveal;
    }
    function grade(g) {
      const c = queue.shift(), st = S.srs[c.id];
      if (g === 0) { st.box = 0; st.due = today(); queue.splice(Math.min(queue.length, 3), 0, c); }
      else { st.box = Math.max(0, Math.min(6, st.box + (g === 1 ? 0 : g === 2 ? 1 : 2))); st.due = addDays(Math.max(1, INTERVALS[st.box] * (g === 1 ? 0.5 : 1)) | 0); done++; addXP(2); }
      save(); touchDay(); renderNav(); draw();
    }
    const key = (e) => {
      if (/input|textarea/i.test(document.activeElement.tagName)) return;
      if (e.key === ' ' && host.reveal) { e.preventDefault(); host.reveal(); }
      const btns = $('.rv-btns', host);
      if (btns && !btns.hidden && /^[1-4]$/.test(e.key)) grade(+e.key - 1);
    };
    addEventListener('keydown', key); cleanups.push(() => removeEventListener('keydown', key));
    draw();
  }

  /* ---------------- notes ---------------- */
  function renderNotes() {
    curCourse = null;
    document.title = `Notes — ${CV.PLATFORM}`;
    const ids = Object.keys(S.notes).filter((k) => pageById(k));
    page(`<section class="wrap narrow">
      <div class="crumbs"><a href="#/">Dashboard</a><span>/</span><span>Notes</span></div>
      <h1 class="display">Notes</h1>
      <p class="lead">Everything you wrote while studying. Press <kbd>N</kbd> inside any lesson to add more.</p>
      <div class="filter-row"><input id="nf" placeholder="Search your notes…" type="text"><button class="btn" id="nExport" ${ids.length ? '' : 'disabled'}>Export as Markdown</button></div>
      <div id="nl"></div></section>`);
    const draw = () => {
      const q = $('#nf').value.toLowerCase();
      const list = ids.filter((k) => !q || S.notes[k].toLowerCase().includes(q) || pageById(k).title.toLowerCase().includes(q));
      $('#nl').innerHTML = list.length ? list.map((k) => { const p = pageById(k), c = CV.course(p.course); return `<div class="note-card"><div class="nc-h"><a href="${url(p)}"><small>${c.title}</small><b>${p.n ? p.n + '. ' : ''}${p.title}</b></a></div><textarea data-k="${k}">${U.esc(S.notes[k])}</textarea></div>`; }).join('')
        : `<div class="empty"><h3>${ids.length ? 'No matches' : 'No notes yet'}</h3><p class="muted">${ids.length ? 'Try another word.' : 'Open a lesson and press N.'}</p></div>`;
      $$('#nl textarea').forEach((t) => { t.style.height = Math.max(90, t.scrollHeight + 4) + 'px'; t.oninput = () => { if (t.value.trim()) S.notes[t.dataset.k] = t.value; else delete S.notes[t.dataset.k]; save(); }; });
    };
    $('#nf').oninput = draw;
    $('#nExport').onclick = () => {
      const md = ids.map((k) => { const p = pageById(k); return `## ${CV.course(p.course).title}: ${p.title}\n\n${S.notes[k]}\n`; }).join('\n');
      const a = U.el('a', { href: URL.createObjectURL(new Blob([`# My notes\n\n${md}`], { type: 'text/markdown' })), download: 'learnlab-notes.md' });
      a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    draw();
  }

  /* ---------------- guide: adding a course ---------------- */
  function renderGuide() {
    curCourse = null;
    document.title = `Add a course — ${CV.PLATFORM}`;
    const T = '```';
    page(`<section class="wrap narrow"><div class="crumbs"><a href="#/">Dashboard</a><span>/</span><span>Add a course</span></div>
      <h1 class="display">Add a course</h1>
      <p class="lead">Every course is a folder. The platform finds it, builds the dashboard card, syllabus, lessons, quizzes, review cards and search for you.</p>
      <div class="content guide">${CV.md(`
### The quick way

Put your next PDF or notes in this folder and ask Claude: *"Add this as a new course to my learning platform, in the same style as Computer Vision."* It will create the folder, lessons, quizzes and demos.

### The manual way

1. Copy the folder \`courses/_template\` to \`courses/your-course\` (any name, no spaces).
2. Edit \`course.js\`: set a short \`id\`, the title, the parts, and the list of files.
3. Write lessons in \`lessons.js\` using Markdown (see below).
4. Add the folder name to \`courses/courses.js\`.
5. Reload the page. Your course appears on the dashboard.

### course.js

${T}js
CV.defineCourse({
  id: 'ml',                         // short, unique, used in URLs
  title: 'Machine Learning',
  subtitle: 'Foundations',
  desc: 'One or two sentences shown on the dashboard.',
  glyph: 'ML',                      // 1–3 letters for the course badge
  parts: [{ n: 1, title: 'Basics' }, { n: 2, title: 'Models' }],
  files: ['lessons.js'],            // loaded in this order
});
${T}

### A lesson, written in Markdown

${T}js
CV.addChapter({
  n: 1, part: 1, minutes: 12,
  title: 'Linear regression',
  sub: 'Fitting a line by least squares.',
  md: \`
## The idea
We look for the line that minimises the **squared error**.

$$ L = (1/N) Σ (y − ŷ)² $$

> [!tip] Plot your data before fitting anything.

| Term | Meaning |
|---|---|
| w | slope |
| b | intercept |

::demo overfit
\`,
  checks: [['What does least squares minimise?', 'The sum of squared residuals.']],
  quiz: [{ q: 'Which loss is used?', o: ['MAE', 'MSE', 'Hinge'], a: 1, e: 'Mean squared error.' }],
});
${T}

Each \`## heading\` becomes a section with its own entry in the table of contents and reading tracker.

### Markdown you can use

| Write | You get |
|---|---|
| \`## Title\` | a new section |
| \`### Sub\` | a sub-heading |
| \`**bold**\`, \`*italic*\`, \`==term==\` | emphasis and highlighted terms |
| \`$$ formula $$\` | a formula block |
| \`> [!key] …\` / \`[!tip]\` / \`[!warn]\` / \`[!note]\` | callout boxes |
| \`::demo name\` | an interactive demo (any registered widget) |
| fenced code with a language | code with a copy button |
| rows starting and ending with a pipe | styled tables |

### Interactive demos

Any demo already in the platform can be reused with \`::demo name\` (for example \`softmax-ce\`, \`grad-descent\`, \`metrics\`, \`activations\`). New demos are small JavaScript files that call \`CV.widget(name, meta, mount)\`; see \`courses/computer-vision/widgets\` for many examples.

> [!note] Progress, notes and review cards are stored in this browser only. Clearing site data resets them.
`)}</div></section>`);
    bindCode(main);
  }

  /* ---------------- scroll effects ---------------- */
  let revealIO;
  function revealObserve() {
    revealIO && revealIO.disconnect();
    revealIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => revealIO.observe(el));
  }
  function setReadProgress() {
    const h = document.documentElement.scrollHeight - innerHeight;
    $('#readProgress').style.width = (h > 0 ? (scrollY / h) * 100 : 0) + '%';
  }
  addEventListener('scroll', setReadProgress, { passive: true });

  /* ---------------- confetti (monochrome) ---------------- */
  function confetti() {
    const c = $('#confetti'), ctx = c.getContext('2d');
    c.width = innerWidth; c.height = innerHeight;
    const fg = U.css('--text'), mid = U.css('--text-3');
    const P = Array.from({ length: 150 }, () => ({ x: innerWidth / 2 + (Math.random() - 0.5) * 220, y: innerHeight * 0.55, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 18 - 6, r: Math.random() * 6 + 3, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.4, c: Math.random() < 0.6 ? fg : mid }));
    let f = 0;
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      P.forEach((p) => { p.vy += 0.5; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (++f < 160) requestAnimationFrame(tick); else ctx.clearRect(0, 0, c.width, c.height);
    };
    tick();
  }
  CV.confetti = confetti;

  /* ---------------- search across all courses ---------------- */
  const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const index = [];
  [...CV.chapters, ...CV.extras].forEach((p) => (p.sections || []).forEach((s) => index.push({ page: p, sec: s, title: s.title, text: strip(s.html) })));
  (CV.glossary || []).forEach(([t, d]) => { const g = CV.extras.find((x) => x.slug === 'glossary'); g && index.push({ page: g, sec: { id: 'terms' }, title: t, text: d }); });

  const modal = $('#searchModal'), input = $('#searchInput'), results = $('#searchResults');
  let sel = 0, hits = [];
  const openSearch = () => { modal.hidden = false; input.value = ''; doSearch(); setTimeout(() => input.focus(), 30); };
  const closeSearch = () => (modal.hidden = true);
  $('#searchBtn').onclick = openSearch;
  modal.onclick = (e) => { if (e.target === modal) closeSearch(); };
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); modal.hidden ? openSearch() : closeSearch(); }
    else if (!modal.hidden) {
      if (e.key === 'Escape') closeSearch();
      else if (e.key === 'ArrowDown') { sel = Math.min(hits.length - 1, sel + 1); paint(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
      else if (e.key === 'Enter' && hits[sel]) go(hits[sel]);
    } else if (e.key === 'Escape') closeNotes();
    else if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
  input.oninput = doSearch;
  function doSearch() {
    const q = input.value.trim().toLowerCase();
    if (!q) hits = CV.chapters.filter((c) => !curCourse || c.course === curCourse).slice(0, 8).map((p) => ({ page: p, sec: p.sections[0], title: p.title, text: p.sub || '' }));
    else {
      const terms = q.split(/\s+/);
      hits = index.map((r) => {
        const tl = r.title.toLowerCase(), tx = r.text.toLowerCase();
        let sc = 0;
        for (const t of terms) { if (tl.includes(t)) sc += 10; const c = tx.split(t).length - 1; if (!c && !tl.includes(t)) return null; sc += Math.min(c, 5); }
        if (curCourse && r.page.course === curCourse) sc += 3;
        return Object.assign({ sc }, r);
      }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 30);
    }
    sel = 0; paint(q);
  }
  function paint(q = input.value.trim().toLowerCase()) {
    if (!hits.length) { results.innerHTML = '<div class="sr-empty">No matches.</div>'; return; }
    const mk = (s) => { let o = U.esc(s); if (q) q.split(/\s+/).forEach((t) => { if (t.length > 1) o = o.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); }); return o; };
    results.innerHTML = hits.map((h, i) => {
      let ctx = h.text;
      if (q) { const p = ctx.toLowerCase().indexOf(q.split(/\s+/)[0]); ctx = (p > 40 ? '…' : '') + ctx.slice(Math.max(0, p - 40), p + 110) + '…'; } else ctx = ctx.slice(0, 120);
      const c = CV.course(h.page.course);
      return `<a class="sr ${i === sel ? 'sel' : ''}" data-i="${i}" href="${url(h.page)}"><small>${c.title} · ${h.page.n ? 'Lesson ' + h.page.n + ' · ' : ''}${h.page.title}</small><b>${mk(h.title)}</b><div class="ctx">${mk(ctx)}</div></a>`;
    }).join('');
    $$('.sr', results).forEach((a) => (a.onclick = (e) => { e.preventDefault(); go(hits[+a.dataset.i]); }));
    const s = $('.sr.sel', results); s && s.scrollIntoView({ block: 'nearest' });
  }
  function go(h) {
    closeSearch();
    const target = url(h.page);
    const jump = () => setTimeout(() => { const el = document.getElementById(h.sec.id); if (el) { el.scrollIntoView({ behavior: 'smooth' }); el.classList.add('in'); } }, 120);
    if (location.hash === target) jump(); else { location.hash = target; jump(); }
  }

  /* ---------------- boot ---------------- */
  route();
})();
