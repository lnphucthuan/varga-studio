// core.js — shared runtime for a rebuild. Site-specific code goes in site.js and talks to window.H.
//   H.onFrame(fn(y))      run every frame with the scroll position (pinned scenes, parallax...)
//   H.onMeasure(fn)       re-read layout after load / resize (cache section tops here)
//   H.onReady(fn)         run after the preloader lifts (hero intro)
//   H.top(el), H.vh, H.desk(), H.clamp, H.lerp, H.words(text), H.splitLines(el), H.scrollTo(y), H.lenis
// Markup hooks: data-scene="name" on sections (background), data-reveal="words|lines|fade" on text.
(() => {
  const G = window.gsap;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = !!G && !reduce;
  const body = document.body;
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  const frameFns = [], measureFns = [], readyFns = [];
  const H = (window.H = {
    $, $$, animate, reduce, vh: innerHeight,
    clamp: (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    desk: () => innerWidth >= 1200,
    top: (el) => el.getBoundingClientRect().top + scrollY,
    words: (t) => t.split(' ').map((w) => `<span class="w">${w}</span>`).join(' '),
    onFrame: (f) => frameFns.push(f),
    onMeasure: (f) => measureFns.push(f),
    onReady: (f) => readyFns.push(f),
  });

  // Wrap each rendered line in .line > span so it can slide up from a mask.
  H.splitLines = (el) => {
    const text = el.dataset.text || el.innerHTML.trim();
    el.dataset.text = text;
    el.innerHTML = text.split(/<br\s*\/?>/i).map((part) => H.words(part.trim())).join('<br>');
    const lines = []; let topY = null;
    $$('.w', el).forEach((w) => { if (w.offsetTop !== topY) { lines.push([]); topY = w.offsetTop; } lines[lines.length - 1].push(w.innerHTML); });
    el.innerHTML = lines.map((l, k) => `<span class="line"><span style="--i:${k}">${l.join(' ')}</span></span>`).join('');
  };

  /* ---------------------------------------------------------------- smooth scroll */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.stop();
    if (G) { G.ticker.add((t) => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0); }
    else (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  H.lenis = lenis;
  H.scrollTo = (y, o = {}) => (lenis ? lenis.scrollTo(y, { duration: 1.6, ...o }) : scrollTo({ top: y, behavior: o.immediate ? 'auto' : 'smooth' }));

  /* ---------------------------------------------------------------- measure */
  let reveals = [];
  function sceneKeys() {
    const secs = $$('[data-scene]');
    if (!secs.length) return null;
    const v = innerHeight, k = [[0, secs[0].dataset.scene]];
    for (let i = 1; i < secs.length; i++) {
      const t = H.top(secs[i]);
      k.push([t - 0.5 * v, secs[i - 1].dataset.scene], [t - 0.05 * v, secs[i].dataset.scene]);
    }
    for (let i = 1; i < k.length; i++) k[i][0] = Math.max(k[i][0], k[i - 1][0] + 1);
    return k;
  }
  function measure() {
    H.vh = innerHeight;
    reveals = $$('[data-reveal]').map((el) => ({ el, t: H.top(el) }));
    const keys = sceneKeys();
    if (window.BG && keys) window.BG.setKeys(keys);
    measureFns.forEach((f) => f());
    last = -1;
  }

  /* ---------------------------------------------------------------- reveals */
  function prepReveals() {
    $$('[data-reveal="lines"]').forEach(H.splitLines);
    $$('[data-reveal="words"]').forEach((el) => { if (!el.dataset.text) { el.dataset.text = el.textContent.trim(); el.innerHTML = H.words(el.dataset.text); } });
    if (!animate) return;
    $$('[data-reveal]').forEach((el) => {
      if (el.dataset.done) return;
      const kind = el.dataset.reveal;
      if (kind === 'lines') G.set($$('.line > span', el), { yPercent: 110 });
      else if (kind === 'words') G.set($$('.w', el), { opacity: 0, filter: 'blur(10px)', yPercent: 30 });
      else G.set(el, { opacity: 0, y: 40 });
    });
  }
  function play(el) {
    el.dataset.done = 1;
    if (!animate) return;
    const kind = el.dataset.reveal;
    if (kind === 'lines') G.to($$('.line > span', el), { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' });
    else if (kind === 'words') G.to($$('.w', el), { opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: 1.1, stagger: 0.035, ease: 'power3.out' });
    else G.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' });
  }

  /* ---------------------------------------------------------------- frame loop */
  let last = -1, ready = false;
  const header = $('.header');
  function tick() {
    const y = scrollY;
    if (window.BG) {
      window.BG.setScroll(y);
      const light = window.BG.lum() > 0.62;
      if (header && light !== header.classList.contains('is-diff')) header.classList.toggle('is-diff', light);
    }
    if (ready) reveals.forEach((r) => { if (!r.el.dataset.done && r.t - y < H.vh * 0.85) play(r.el); });
    frameFns.forEach((f) => f(y, y !== last));
    last = y;
  }
  if (G) G.ticker.add(tick); else (function loop() { tick(); requestAnimationFrame(loop); })();

  /* ---------------------------------------------------------------- menu (reference timing: 1.4s open, .8s close) */
  const menu = $('.menu'), menuBtn = $('.header__menu');
  let menuOpen = false;
  function openMenu() {
    menuOpen = true;
    body.classList.add('menu-visible', 'menu-open');
    menuBtn && menuBtn.setAttribute('aria-expanded', 'true');
    lenis && lenis.stop();
    if (!animate) return menu.style.setProperty('--mask', '0%');
    G.killTweensOf(menu);
    G.fromTo(menu, { '--mask': '100%' }, { '--mask': '0%', duration: 1.4, ease: 'power3.out' });
    G.fromTo($$('li', menu), { opacity: 0, filter: 'blur(12px)' }, { opacity: 1, filter: 'blur(0px)', duration: 1.1, stagger: 0.07, delay: 0.25, ease: 'power3.out', clearProps: 'all' });
  }
  function closeMenu(instant) {
    menuOpen = false;
    body.classList.remove('menu-open');
    menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
    const done = () => { body.classList.remove('menu-visible'); lenis && !H.hold && lenis.start(); };
    if (!animate || instant) { G && G.killTweensOf(menu); menu.style.setProperty('--mask', '100%'); return done(); }
    G.killTweensOf(menu);
    G.to(menu, { '--mask': '100%', duration: 0.8, ease: 'power3.out', onComplete: done });
  }
  H.closeMenu = closeMenu;
  if (menu && menuBtn) menuBtn.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) closeMenu(); });

  /* ---------------------------------------------------------------- anchor links: near = smooth scroll, far = colour wipe */
  let jumping = false;
  async function jumpTo(y) {
    if (jumping) return;
    jumping = true;
    const W = window.Wipe;
    if (W && animate) await W.cover(window.BG ? window.BG.colorAt(y) : [1, 1, 1]);
    if (menuOpen) closeMenu(true);
    if (lenis) { lenis.start(); lenis.scrollTo(y, { immediate: true, force: true }); } else scrollTo(0, y);
    if (W && animate) { await new Promise((r) => setTimeout(r, 120)); await W.reveal(); }
    jumping = false;
  }
  H.jumpTo = jumpTo;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    const el = hash === '#top' || hash === '#' ? null : $(hash);
    if (hash !== '#top' && hash !== '#' && !el) return;
    e.preventDefault();
    const y = el ? H.top(el) : 0;
    if (menuOpen || Math.abs(y - scrollY) > innerHeight * 2.5) jumpTo(y); else H.scrollTo(y);
  });

  /* ---------------------------------------------------------------- lifecycle */
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { measure(); }, 180); });
  addEventListener('pageshow', (e) => { if (e.persisted) { if (menuOpen) closeMenu(true); lenis && lenis.start(); } });

  function start() {
    body.classList.remove('is-loading');
    prepReveals();
    measure();
    ready = true;
    readyFns.forEach((f) => f());
    setTimeout(() => lenis && !H.hold && lenis.start(), 600); // H.hold: an intro keeps the page still
  }
  // wait for site.js to register its hooks, then run the loader (or start straight away)
  addEventListener('DOMContentLoaded', () => {
    measure();
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    // line breaks change once the web fonts arrive: split again (already revealed text just stays visible)
    fonts.then(() => { if (ready) { prepReveals(); measure(); } });
    if (window.Loader && document.querySelector('.loader')) window.Loader.run([fonts, ...(H.loadTasks || [])], start);
    else start();
  });
})();
