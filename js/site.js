// site.js — Varga Studio. Talks to window.H (core.js).
//   intro words → horizontal module (desktop) → letter-mask video → lines that light up → brands with a
//   sticky logo → echo word on sand → overview → let's talk → footer.
(() => {
  const { $, $$, clamp } = window.H;
  const G = window.gsap;
  const body = document.body;
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
  const noLoader = /[?&]noloader/.test(location.search) || !H.animate;

  /* ---------------------------------------------------------------- content */
  const quotes = ['“Ship the small version first.”', '“Taste is a habit, not a gift.”', '“Ask the user, not the room.”'];
  $('.foot__quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

  // fictional clients, each with a type-only mark
  const brands = [
    ['Northwind Air', 'heavy', 'NW'], ['Halden Bank', 'serif', 'Halden'], ['Kestrel Motors', 'tilt', 'Kestrel'],
    ['Orbital Foods', 'ring', 'Orb'], ['Lumen Health', 'bar', 'Lumen'], ['Arcadia Records', 'stack', 'Arca<br>dia'],
    ['Tidewater Co.', 'serif', 'Tide'], ['Verso Labs', 'mono', 'VERSO'], ['Fieldnote', 'box', 'Field'],
    ['Ostra Hotels', 'serif', 'Ostra'], ['Mosaic Mobile', 'heavy', 'MO<br>SA'], ['Bellweather', 'stack', 'Bell<br>weather'],
    ['Copperline', 'bar', 'CPR'], ['Quill & Ward', 'serif', 'Q&amp;W'],
  ];
  $('.brands__list').innerHTML = brands.map(([n]) => `<li>${n.replace('&', '&amp;')}</li>`).join('');
  $('.brands__logo').innerHTML = brands.map(([, s, t]) => `<span class="logo-mark"><span class="lm lm--${s}">${t}</span></span>`).join('');
  const brandItems = $$('.brands__list li'), marks = $$('.logo-mark');

  // echo copies of one word: 0 = front, then pairs above / below
  const ECHO = 4, WORD = 'Teacher';
  const echo = $('.call__word');
  let html = '';
  for (let k = ECHO; k >= 1; k--) html += `<span class="cw" data-k="${-k}" style="z-index:${10 - k}">${WORD}</span><span class="cw" data-k="${k}" style="z-index:${10 - k}">${WORD}</span>`;
  echo.innerHTML = html + `<span class="cw" data-k="0" style="z-index:10">${WORD}</span>`;
  const copies = $$('.cw', echo).map((el) => ({ el, k: +el.dataset.k }));

  /* ---------------------------------------------------------------- layout (runs before core measures) */
  const hz = $('.hz'), track = $('.hz__track'), mask = $('.mask'), svg = $('.mask__svg');
  const maskVideo = $('.mask__video'), play = $('.mask__play');
  const NS = 'http://www.w3.org/2000/svg';
  let desk = false, trackW = 0, maskLeft = 0, textEnd = 0;

  function buildMask() {
    const r = rem();
    const twoLines = !desk;
    // desktop: one line, cap height = band height; phones: two centred lines in a scalable viewBox
    const F = desk ? 131.7 * r : 1000, H_ = desk ? 92.3 * r : 0;
    svg.innerHTML = '';
    const t = (s) => { const el = document.createElementNS(NS, 'text'); el.textContent = s; el.setAttribute('font-family', 'Outfit, sans-serif'); el.setAttribute('font-weight', '800'); el.setAttribute('font-size', F); el.setAttribute('letter-spacing', -0.04 * F); return el; };
    const defs = document.createElementNS(NS, 'defs'), m = document.createElementNS(NS, 'mask');
    m.setAttribute('id', 'mm'); m.setAttribute('maskUnits', 'userSpaceOnUse');
    const white = document.createElementNS(NS, 'rect'); white.setAttribute('fill', '#fff');
    m.appendChild(white); defs.appendChild(m); svg.appendChild(defs);
    const shade = document.createElementNS(NS, 'rect');
    shade.setAttribute('fill', '#0a0a0a'); shade.setAttribute('fill-opacity', '.9'); shade.setAttribute('mask', 'url(#mm)');
    svg.appendChild(shade);
    let W, Hh;
    if (!twoLines) {
      const x0 = 30 * r, txt = t('MEET INES');
      txt.setAttribute('x', x0); txt.setAttribute('y', H_); txt.setAttribute('fill', '#000');
      m.appendChild(txt);
      const tw = txt.getComputedTextLength();
      textEnd = x0 + tw + 4 * r;
      W = textEnd; Hh = H_;
    } else {
      const a = t('MEET'), b = t('INES'); m.appendChild(a); m.appendChild(b);
      const wa = a.getComputedTextLength(), wb = b.getComputedTextLength();
      W = Math.max(wa, wb) + 160; Hh = 700 * 2 + 160 + 200;
      [[a, 100 + 700], [b, 100 + 700 + 160 + 700]].forEach(([el, y]) => { el.setAttribute('x', W / 2); el.setAttribute('y', y); el.setAttribute('text-anchor', 'middle'); el.setAttribute('fill', '#000'); });
    }
    [white, shade].forEach((el) => { el.setAttribute('width', W); el.setAttribute('height', Hh); });
    if (desk) { svg.removeAttribute('viewBox'); svg.setAttribute('width', W); svg.setAttribute('height', Hh); }
    else { svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`); svg.removeAttribute('width'); svg.removeAttribute('height'); }
  }

  function layout() {
    desk = H.desk();
    buildMask();
    if (desk) {
      mask.style.width = textEnd + innerWidth + 'px';
      trackW = track.scrollWidth;
      maskLeft = mask.offsetLeft;
      hz.style.height = trackW - innerWidth + innerHeight + 'px';
    } else {
      mask.style.width = hz.style.height = '';
      track.style.transform = maskVideo.style.transform = '';
      mask.style.removeProperty('--ct');
    }
  }
  layout();
  if (document.fonts) document.fonts.ready.then(layout); // core re-measures right after this
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });

  /* ---------------------------------------------------------------- measure (cached tops) */
  const exp = $('.exp'), lines = $$('.exp__lines span'), imgs = $$('.exp__img');
  const brandsSec = $('.brands'), call = $('.call'), talk = $('.talk'), over = $('.over');
  const overImg = $('.over__img img'), talkBg = $('.talk__bg img');
  const sideItems = $$('.side__item');
  const C = {};
  H.onMeasure(() => {
    const vh = innerHeight;
    C.hzTop = desk ? H.top(hz) : 0;
    C.lines = lines.map((l) => H.top(l) + l.offsetHeight / 2);
    C.imgs = imgs.map((im) => ({ im, c: H.top(im) - (im._ty || 0) + im.offsetHeight / 2, s: parseFloat(getComputedStyle(im).getPropertyValue('--s')) || 0 }));
    C.brands = brandItems.map((li) => H.top(li) + li.offsetHeight / 2);
    C.call = H.top(call);
    C.talk = H.top(talk);
    C.over = H.top(over);
    C.cwStep = parseFloat(getComputedStyle(copies[0].el).fontSize) * 0.24;
    // section starts for the sidebar (scroll y) and jump targets
    const meetY = desk ? C.hzTop + maskLeft - innerWidth * 0.5 : H.top(mask) - vh * 0.5;
    C.secs = [0, meetY, H.top(exp) - vh * 0.5, H.top(brandsSec) - vh * 0.5, C.call - vh * 0.5, C.talk - vh * 0.5];
    C.jump = [0, desk ? C.hzTop + maskLeft : H.top(mask), H.top(exp), H.top(brandsSec), C.call, C.talk];
  });

  /* ---------------------------------------------------------------- frame loop */
  const heroVid = $('.hero__portrait video'), maskVid = $('.mask__video video'), portrait = $('.hero__portrait');
  const want = (v, on) => { if (on && v.paused && !body.classList.contains('is-intro')) v.play().catch(() => {}); else if (!on && !v.paused) v.pause(); };
  let litBrand = -2, activeSec = -1, sand = null;

  H.onFrame((y) => {
    if (!C.lines) return; // not measured yet
    const vh = innerHeight, vw = innerWidth;

    // horizontal module
    let x = 0;
    if (desk) {
      x = clamp(y - C.hzTop, 0, trackW - vw);
      track.style.transform = `translate3d(${-x}px,0,0)`;
      maskVideo.style.transform = `translate3d(${Math.max(0, x - maskLeft)}px,0,0)`;
      portrait.style.transform = `translate3d(${x * 0.2}px,0,0)`;
      // after the last letter the band opens to the full screen
      const e = clamp((x - (maskLeft + textEnd - vw)) / (vw * 0.9));
      const ease = e * e * (3 - 2 * e);
      mask.style.setProperty('--ct', (13.9 * rem() * (1 - ease)).toFixed(1) + 'px');
      const po = clamp((e - 0.7) / 0.3);
      play.style.setProperty('--po', po.toFixed(3));
      play.classList.toggle('is-on', po > 0.5);
      want(heroVid, x < 226.5 * rem());
      want(maskVid, x > maskLeft - vw && y < C.hzTop + trackW);
    } else {
      want(heroVid, y < vh);
      const mt = mask.getBoundingClientRect();
      want(maskVid, mt.bottom > 0 && mt.top < vh);
    }

    // experience: lines light up as they pass 62% of the screen; images drift at their own speed
    const mark = y + vh * 0.62;
    lines.forEach((l, i) => { const on = C.lines[i] < mark; if (on !== l.classList.contains('is-lit')) l.classList.toggle('is-lit', on); });
    C.imgs.forEach((o) => { const rel = o.c - (y + vh / 2); if (Math.abs(rel) < vh * 1.5) { o.im._ty = rel * o.s; o.im.style.transform = `translate3d(0,${o.im._ty.toFixed(1)}px,0)`; } });

    // brands: everything above the middle is "done", the logo shows the current one
    let cur = -1;
    C.brands.forEach((c, i) => { if (c < y + vh * 0.5) cur = i; });
    if (cur !== litBrand) {
      brandItems.forEach((li, i) => li.classList.toggle('is-past', i <= cur));
      marks.forEach((m, i) => { m.classList.toggle('is-on', i === Math.max(cur, 0)); m.classList.toggle('is-past', i < Math.max(cur, 0)); });
      litBrand = cur;
    }

    // echo word: copies fan out the further the stage is from its centre position
    const d = clamp(Math.abs(y - C.call) / vh, 0, 1.2);
    if (y > C.call - vh * 1.2 && y < C.call + vh * 2.2) {
      const s = d * d * (3 - 2 * d) * C.cwStep;
      copies.forEach((c) => { if (c.k) c.el.style.transform = `translate3d(0,${(c.k * s).toFixed(1)}px,0)`; });
    }

    // parallax photos
    if (y > C.over - vh && y < C.over + over.offsetHeight) overImg.style.transform = `translate3d(0,${(-(y - C.over) * 0.08).toFixed(1)}px,0)`;
    if (y > C.talk - vh && y < C.talk + talk.offsetHeight) talkBg.style.transform = `translate3d(0,${(-(y - C.talk + vh) * 0.12).toFixed(1)}px,0)`;

    // theme: sand from the echo word to the end of the overview
    const isSand = y > C.call - vh * 0.5 && y < C.talk - vh * 0.5;
    if (isSand !== sand) { body.classList.toggle('is-sand', isSand); sand = isSand; }

    // sidebar
    let a = 0;
    C.secs.forEach((t, i) => { if (y >= t) a = i; });
    if (a !== activeSec) { sideItems.forEach((it, i) => it.classList.toggle('is-on', i === a)); activeSec = a; }
  });

  /* ---------------------------------------------------------------- sidebar + in-track anchors */
  sideItems.forEach((it, i) => it.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); H.scrollTo(C.jump[i], { duration: 2 }); }));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#intro"], a[href="#meet"]');
    if (!a || !desk) return;
    e.preventDefault(); e.stopPropagation();
    const y = a.getAttribute('href') === '#meet' ? C.jump[1] : 0;
    if (body.classList.contains('menu-open')) { H.closeMenu(true); H.lenis ? H.lenis.scrollTo(y, { immediate: true, force: true }) : scrollTo(0, y); }
    else H.scrollTo(y, { duration: 2 });
  }, true);

  /* ---------------------------------------------------------------- menu video + video modal */
  const menuVid = $('.menu__video');
  new MutationObserver(() => { if (body.classList.contains('menu-open')) menuVid.play().catch(() => {}); else if (!body.classList.contains('menu-visible')) menuVid.pause(); })
    .observe(body, { attributes: true, attributeFilter: ['class'] });

  const modal = $('.modal'), mv = $('.modal__video');
  function openModal(src) {
    mv.src = src; modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
    H.lenis && H.lenis.stop(); mv.play().catch(() => {}); $('.modal__close').focus();
  }
  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); mv.pause();
    H.lenis && H.lenis.start();
  }
  $$('[data-play]').forEach((b) => b.addEventListener('click', () => openModal(b.dataset.play)));
  $('.modal__close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------------------------------------------------------------- intro: words rise one by one, stack, then settle */
  const words = $$('.hw');
  function finishIntro() {
    words.forEach((w) => { w.style.visibility = 'visible'; });
    body.classList.remove('is-intro');
    H.hold = false;
    H.lenis && H.lenis.start();
  }
  if (noLoader) { body.classList.remove('is-intro'); words.forEach((w) => { w.style.visibility = 'visible'; }); return; }
  H.hold = true;
  H.onReady(async () => {
    H.lenis && H.lenis.stop();
    if (document.fonts) await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 500));
    const vw = innerWidth, vh = innerHeight;
    const R = words.map((w) => w.getBoundingClientRect());
    const top = R[0].top, L = R[1].top - R[0].top;
    const dx = R.map((r) => vw / 2 + (desk ? 0 : 0) - (r.left + r.width / 2));
    const dyFor = (k) => vh / 2 - (top + (k * L) / 2);
    words.forEach((w, i) => G.set(w, { x: dx[i], y: vh - R[i].top + 40, scale: 0.8, visibility: 'visible' }));
    const tl = G.timeline({ onComplete: finishIntro });
    for (let k = 1; k <= words.length; k++) {
      const at = (k - 1) * 0.88;
      for (let i = 0; i < k; i++) tl.to(words[i], { y: dyFor(k), scale: 1, duration: 0.88, ease: 'power3.out' }, at);
    }
    tl.to(words, { x: 0, y: 0, duration: 1.2, ease: 'expo.inOut', stagger: 0.04 }, '+=0.25');
    tl.call(() => body.classList.add('is-settled'), null, '-=0.5');
  });
})();
