(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  const themeBtn = $('.theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  const applyTheme = (t, save) => {
    root.dataset.theme = t;
    themeBtn?.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} mode`);
    themeMeta?.setAttribute('content', t === 'dark' ? '#0d0e11' : '#f7f5f0');
    if (save) { try { localStorage.setItem('sbm-theme', t); } catch (_) {} }
  };
  applyTheme(root.dataset.theme || 'light', false);
  themeBtn?.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));

  /* ---------- Mobile menu ---------- */
  const toggle = $('.menu-toggle');
  const menu = $('#nav-links');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle?.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) setMenu(false); });
  matchMedia('(min-width: 1041px)').addEventListener?.('change', () => setMenu(false));

  /* ---------- Header state + progress bar ---------- */
  const header = $('.site-header');
  const bar = $('.progress');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = root.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      header.classList.toggle('is-stuck', scrollY > 8);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll-spy ---------- */
  const links = $$('.nav-links a[href^="#"]');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.removeAttribute('aria-current'));
        $(`.nav-links a[href="#${en.target.id}"]`)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  const items = $$('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        en.target.querySelectorAll('[data-metrics]').forEach(m => m.classList.add('is-in'));
        if (en.target.matches('[data-metrics]')) en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    items.forEach(i => io.observe(i));
    $$('[data-metrics]').forEach(m => io.observe(m));
    // Failsafe: never leave content hidden if the observer misbehaves.
    setTimeout(() => items.forEach(i => { if (!i.classList.contains('is-in') && i.getBoundingClientRect().top < innerHeight) i.classList.add('is-in'); }), 1200);
  } else {
    items.forEach(i => i.classList.add('is-in'));
    $$('[data-metrics]').forEach(m => m.classList.add('is-in'));
  }

  /* ---------- Project filters ---------- */
  const chips = $$('[data-filter]');
  const cases = $$('.case[data-cat]');
  const count = $('#count');
  const empty = $('#empty');
  const has = (c, f) => f === 'all' || c.dataset.cat.split(' ').includes(f);
  chips.forEach(chip => {
    const n = cases.filter(c => has(c, chip.dataset.filter)).length;
    $('small', chip).textContent = String(n).padStart(2, '0');
  });
  const applyFilter = f => {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c.dataset.filter === f)));
    let shown = 0;
    cases.forEach(c => {
      const show = has(c, f);
      clearTimeout(c._t);
      if (show) {
        shown++;
        c.hidden = false;
        requestAnimationFrame(() => c.classList.remove('is-leaving'));
        c.classList.add('is-in');
      } else {
        c.classList.add('is-leaving');
        c._t = setTimeout(() => { c.hidden = true; syncGroups(); }, reduce ? 0 : 220);
      }
    });
    syncGroups(shown === 0);
    const name = $('.chip[aria-pressed="true"]')?.firstChild.textContent.trim();
    count.textContent = f === 'all' ? `Showing ${cases.length} projects` : `Showing ${shown} of ${cases.length} · ${name}`;
  };
  function syncGroups(forceEmpty) {
    $$('.cases-2').forEach(g => { g.hidden = cases.filter(c => g.contains(c)).every(c => c.hidden || c.classList.contains('is-leaving')); });
    empty.hidden = !(forceEmpty === true);
  }
  chips.forEach(c => c.addEventListener('click', () => applyFilter(c.dataset.filter)));

  /* ---------- Lightbox with gallery navigation ---------- */
  const dlg = $('#lightbox');
  const img = $('img', dlg);
  const cap = $('.lb-cap', dlg);
  let group = [], idx = 0;
  const show = i => {
    idx = (i + group.length) % group.length;
    const a = group[idx];
    img.src = a.href;
    img.alt = $('img', a)?.alt || '';
    cap.textContent = group.length > 1 ? `${a.dataset.caption || ''}  ·  ${idx + 1} / ${group.length}` : (a.dataset.caption || '');
    $('.lb-prev', dlg).hidden = $('.lb-next', dlg).hidden = group.length < 2;
  };
  $$('[data-lightbox]').forEach(a => a.addEventListener('click', e => {
    if (typeof dlg.showModal !== 'function') return;
    e.preventDefault();
    group = $$(`[data-lightbox="${a.dataset.lightbox}"]`);
    show(group.indexOf(a));
    dlg.showModal();
    document.body.style.overflow = 'hidden';
  }));
  const closeDlg = () => dlg.close();
  $('.lb-close', dlg).addEventListener('click', closeDlg);
  $('.lb-prev', dlg).addEventListener('click', () => show(idx - 1));
  $('.lb-next', dlg).addEventListener('click', () => show(idx + 1));
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('lb-stage')) closeDlg(); });
  dlg.addEventListener('close', () => { document.body.style.overflow = ''; img.src = ''; });
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });

  /* ---------- Copy email ---------- */
  const toast = $('.toast');
  let tt;
  const say = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); };
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); say('Email address copied'); }
    catch (_) { say(b.dataset.copy); }
  }));
})();
