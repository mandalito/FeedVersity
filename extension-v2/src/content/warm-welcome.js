// Warm Welcome — 5-slide onboarding modal that introduces BubbleBreak's
// vocabulary ("Diet", "Diversity score") and key controls (mute, reclassify).
// Triggered on first install via background.js → BB_OPEN_WARM_WELCOME message,
// and on demand via the ? button in the Weekly Mirror header.
//
// Mockups are CSS-only mini-UIs (no PNG screenshots) so they stay in sync if
// we re-skin the real components later.
window.BBWarmWelcome = (function () {
  const STORAGE_KEY = 'bb_warm_welcome_seen';
  let backdrop = null;
  let currentIdx = 0;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Build a paragraph from a string supporting **bold** segments. Avoids
  // innerHTML — safe DOM construction with split + capture group.
  function buildRichText(parent, str) {
    const parts = str.split(/\*\*([^*]+)\*\*/g);
    parts.forEach((part, i) => {
      if (i % 2 === 0) {
        if (part) parent.appendChild(document.createTextNode(part));
      } else {
        const strong = document.createElement('strong');
        strong.textContent = part;
        parent.appendChild(strong);
      }
    });
  }

  // ---------- Mockups (one per slide) ----------

  function mockupHook(parent) {
    const wrap = el('div', 'bb-ww-mock bb-ww-mock-hook');

    // "Plain" plate: one giant red blob (monotone diet)
    const before = el('div', 'bb-ww-plate bb-ww-plate-plain');
    before.appendChild(el('div', 'bb-ww-plate-emoji', '🍞'));
    before.appendChild(el('div', 'bb-ww-plate-label', 'Monotone'));
    wrap.appendChild(before);

    wrap.appendChild(el('div', 'bb-ww-arrow', '→'));

    // "Balanced" plate: rich colorful bento
    const after = el('div', 'bb-ww-plate bb-ww-plate-rich');
    after.appendChild(el('div', 'bb-ww-plate-emoji', '🍱'));
    after.appendChild(el('div', 'bb-ww-plate-label', 'Balanced'));
    wrap.appendChild(after);

    parent.appendChild(wrap);
  }

  // Slide 2 — tracking. Reproduces the actual orange flash island that pops
  // when a watch is recorded (so the user recognises it instantly when it
  // happens for real), then explains the 3 detection methods used.
  function mockupTrack(parent) {
    const wrap = el('div', 'bb-ww-mock bb-ww-mock-track');

    // 1. Faithful replica of the live tracked banner.
    //    Same structure as floating-button.js flashTracked() output.
    const banner = el('div', 'bb-ww-tracked-banner');
    banner.appendChild(el('span', 'bb-ww-tracked-emoji', '🥗'));
    const text = el('span', 'bb-ww-tracked-text');
    text.appendChild(el('span', 'bb-ww-tracked-check', '✓'));
    text.appendChild(document.createTextNode(' Tracked: TED talk on climate'));
    banner.appendChild(text);
    wrap.appendChild(banner);

    // 2. Categorization explanation — addresses F1 (transparency) and gives
    //    the user the mental model for *how* a category gets assigned.
    const explain = el('div', 'bb-ww-categorize');
    explain.appendChild(el('div', 'bb-ww-categorize-title', 'How we categorize'));

    [
      { num: '1', label: 'YouTube\'s own category metadata' },
      { num: '2', label: 'Channel signals ("- Topic" → Music, "BBC News" → News)' },
      { num: '3', label: 'Keywords in title + description' }
    ].forEach(m => {
      const row = el('div', 'bb-ww-categorize-row');
      row.appendChild(el('span', 'bb-ww-categorize-num', m.num));
      row.appendChild(el('div', 'bb-ww-categorize-text', m.label));
      explain.appendChild(row);
    });

    wrap.appendChild(explain);
    parent.appendChild(wrap);
  }

  // Slide 5 — "Find me here": YouTube wireframe with arrows pointing to the
  // 3 surfaces (sidebar entry, dynamic island, why-this-video pill).
  function mockupFindMe(parent) {
    const wrap = el('div', 'bb-ww-mock bb-ww-mock-find');
    const frame = el('div', 'bb-ww-yt-frame');

    // Top bar
    const top = el('div', 'bb-ww-yt-top');
    frame.appendChild(top);

    // Body: sidebar + content
    const body = el('div', 'bb-ww-yt-body');
    const side = el('div', 'bb-ww-yt-side');
    // Sidebar: 4 row stubs + the BubbleBreak entry
    for (let i = 0; i < 2; i++) side.appendChild(el('div', 'bb-ww-yt-side-row'));
    const bbEntry = el('div', 'bb-ww-yt-side-row bb-ww-yt-side-bb');
    bbEntry.appendChild(el('span', 'bb-ww-yt-side-dot'));
    bbEntry.appendChild(el('span', null, 'Feedversity'));
    side.appendChild(bbEntry);
    for (let i = 0; i < 2; i++) side.appendChild(el('div', 'bb-ww-yt-side-row'));
    body.appendChild(side);

    // Content area: video grid stubs
    const content = el('div', 'bb-ww-yt-content');
    for (let i = 0; i < 4; i++) content.appendChild(el('div', 'bb-ww-yt-card'));
    body.appendChild(content);

    frame.appendChild(body);

    // Floating island bottom-right
    const island = el('div', 'bb-ww-yt-island', '🥗');
    frame.appendChild(island);

    // Arrows + labels overlay
    const overlay = el('div', 'bb-ww-find-overlay');
    const labelSide = el('div', 'bb-ww-find-label bb-ww-find-label-left');
    labelSide.appendChild(el('span', 'bb-ww-find-arrow', '←'));
    labelSide.appendChild(el('span', null, 'Sidebar entry'));
    overlay.appendChild(labelSide);

    const labelIsland = el('div', 'bb-ww-find-label bb-ww-find-label-right');
    labelIsland.appendChild(el('span', null, 'Always here'));
    labelIsland.appendChild(el('span', 'bb-ww-find-arrow', '→'));
    overlay.appendChild(labelIsland);

    wrap.appendChild(frame);
    wrap.appendChild(overlay);
    parent.appendChild(wrap);
  }

  function mockupDiet(parent) {
    const wrap = el('div', 'bb-ww-mock bb-ww-mock-diet');

    // Wrap everything in a fake "card" matching the real Mirror's diet card
    // so the user recognises the surface they're about to see.
    const card = el('div', 'bb-ww-diet-card');
    card.appendChild(el('div', 'bb-ww-diet-card-eyebrow', 'YOUR DIET'));

    const bar = el('div', 'bb-ww-bar');
    [
      { color: 'var(--bb-cat-tech)',   pct: 60 },
      { color: 'var(--bb-cat-music)',  pct: 25 },
      { color: 'var(--bb-cat-sports)', pct: 15 }
    ].forEach(s => {
      const seg = el('span');
      seg.style.background = s.color;
      seg.style.width = s.pct + '%';
      bar.appendChild(seg);
    });
    card.appendChild(bar);

    const rows = el('div', 'bb-ww-rows');
    [
      { label: 'Tech',   pct: '60%', color: 'var(--bb-cat-tech)' },
      { label: 'Music',  pct: '25%', color: 'var(--bb-cat-music)' },
      { label: 'Sports', pct: '15%', color: 'var(--bb-cat-sports)' }
    ].forEach(r => {
      const row = el('div', 'bb-ww-row');
      const lbl = el('span', 'bb-ww-row-label', r.label);
      lbl.style.color = r.color;
      row.appendChild(lbl);
      row.appendChild(el('span', 'bb-ww-row-pct', r.pct));
      rows.appendChild(row);
    });
    card.appendChild(rows);

    wrap.appendChild(card);
    parent.appendChild(wrap);
  }

  function mockupDiversity(parent) {
    const wrap = el('div', 'bb-ww-mock bb-ww-mock-diversity');
    const card = el('div', 'bb-ww-divcard');
    card.appendChild(el('div', 'bb-ww-divcard-eyebrow', 'DIVERSITY SCORE'));
    card.appendChild(el('div', 'bb-ww-divcard-big', '5 categories this week'));
    card.appendChild(el('div', 'bb-ww-divcard-cmp', '↑ 2 more than last week (was 3)'));
    card.appendChild(el('div', 'bb-ww-divcard-help',
      'How many distinct content categories appeared this week. Higher = broader exposure.'));
    wrap.appendChild(card);
    parent.appendChild(wrap);
  }

  function mockupControl(parent) {
    const wrap = el('div', 'bb-ww-mock bb-ww-mock-control');

    // Card 1 — MUTE: shows the visual effect on the diet bar (cause → effect).
    const col1 = el('div', 'bb-ww-col');
    col1.appendChild(el('div', 'bb-ww-col-eyebrow', '1 · Mute a category'));

    const muteVisual = el('div', 'bb-ww-mute-visual');
    // Mini diet bar with one segment getting muted live
    const muteBar = el('div', 'bb-ww-mute-bar');
    const segTech = el('span', 'bb-ww-mute-seg bb-ww-mute-seg-muted');
    segTech.style.background = 'var(--bb-cat-tech)';
    segTech.style.width = '60%';
    muteBar.appendChild(segTech);
    const segMusic = el('span', 'bb-ww-mute-seg');
    segMusic.style.background = 'var(--bb-cat-music)';
    segMusic.style.width = '25%';
    muteBar.appendChild(segMusic);
    const segSports = el('span', 'bb-ww-mute-seg');
    segSports.style.background = 'var(--bb-cat-sports)';
    segSports.style.width = '15%';
    muteBar.appendChild(segSports);
    muteVisual.appendChild(muteBar);

    // Row showing Tech with strike-through + the active mute pill
    const muteRow = el('div', 'bb-ww-mute-row');
    const muteLbl = el('span', 'bb-ww-mute-label', 'Tech');
    muteLbl.style.color = 'var(--bb-cat-tech)';
    muteRow.appendChild(muteLbl);
    muteRow.appendChild(el('span', 'bb-ww-mute-pct', '60%'));
    muteRow.appendChild(el('button', 'bb-mute-pill bb-muted', '✓ Muted'));
    muteVisual.appendChild(muteRow);
    col1.appendChild(muteVisual);
    wrap.appendChild(col1);

    // Card 2 — RECLASSIFY: shows category change with before/after color.
    const col2 = el('div', 'bb-ww-col');
    col2.appendChild(el('div', 'bb-ww-col-eyebrow', '2 · Reclassify if wrong'));

    const watchRow = el('div', 'bb-ww-watch');
    const av = el('span', 'bb-ww-watch-av', 'M');
    av.style.background = 'var(--bb-cat-music)';
    watchRow.appendChild(av);
    const meta = el('div', 'bb-ww-watch-meta');
    meta.appendChild(el('div', 'bb-ww-watch-title', 'Concert highlights'));
    meta.appendChild(el('div', 'bb-ww-watch-channel', 'NPR Tiny Desk'));
    watchRow.appendChild(meta);

    // Before → After category chips
    const swap = el('div', 'bb-ww-reclassify-swap');
    const chipBefore = el('span', 'bb-ww-watch-chip bb-ww-chip-before', 'Tech');
    chipBefore.style.color = 'var(--bb-cat-tech)';
    chipBefore.style.borderColor = 'var(--bb-cat-tech)';
    swap.appendChild(chipBefore);
    swap.appendChild(el('span', 'bb-ww-reclassify-arrow', '→'));
    const chipAfter = el('span', 'bb-ww-watch-chip bb-ww-chip-after', '✓ Music');
    chipAfter.style.color = 'var(--bb-cat-music)';
    chipAfter.style.borderColor = 'var(--bb-cat-music)';
    swap.appendChild(chipAfter);
    watchRow.appendChild(swap);

    col2.appendChild(watchRow);
    wrap.appendChild(col2);

    parent.appendChild(wrap);
  }

  function mockupCTA(parent) {
    const wrap = el('div', 'bb-ww-mock bb-ww-mock-cta');
    const island = el('div', 'bb-ww-island');
    island.appendChild(el('span', 'bb-ww-island-emoji', '🌳'));
    island.appendChild(el('span', 'bb-ww-island-text', '5 watched · 4 categories'));
    wrap.appendChild(island);
    wrap.appendChild(el('div', 'bb-ww-cta-hint',
      'Watch your usual videos — we\'ll keep score in the corner.'));
    parent.appendChild(wrap);
  }

  // ---------- Slide config ----------
  // Body strings support **bold** segments via buildRichText().
  // Food/Diet metaphor only — single mental model.
  const SLIDES = [
    {
      eyebrow: '01 / Welcome to Feedversity',
      title: 'We are what we watch.',
      body: 'Like food, what you watch shapes how you think. Feedversity tracks your weekly diet and helps you broaden it.',
      mockup: mockupHook
    },
    {
      eyebrow: '02 / Track',
      title: 'We track every video you watch.',
      body: 'Privately, on your device. Nothing leaves your browser.',
      bodyVerified: true,
      mockup: mockupTrack
    },
    {
      eyebrow: '03 / Reflect',
      title: 'See your weekly diet.',
      body: 'Categories, balance, growth — at a glance.',
      mockup: mockupDiet
    },
    {
      eyebrow: '04 / Adjust',
      title: 'Adjust what doesn\'t fit.',
      body: '**Mute**, **reclassify**, broaden — your diet updates instantly.',
      mockup: mockupControl
    },
    {
      eyebrow: '05 / Find me',
      title: 'Find Feedversity here.',
      body: 'Click the dish bottom-right or the sidebar entry anytime to open your Mirror.',
      mockup: mockupFindMe,
      ctaLabel: 'Got it, let\'s eat'
    }
  ];

  // ---------- Modal building ----------

  function buildSlide(slide) {
    const node = el('div', 'bb-ww-slide');

    // Title block FIRST — keeps the lede in the user's eye-line at slide entry.
    const text = el('div', 'bb-ww-text');
    text.appendChild(el('div', 'bb-ww-eyebrow', slide.eyebrow));
    text.appendChild(el('h2', 'bb-ww-title', slide.title));
    if (slide.body) {
      const body = el('p', 'bb-ww-body');
      buildRichText(body, slide.body);
      // Optional verified badge — small green check after the body, used to
      // visually validate privacy-related claims without repeating the seal.
      if (slide.bodyVerified) {
        body.appendChild(document.createTextNode(' '));
        body.appendChild(el('span', 'bb-ww-body-check', '✓'));
      }
      text.appendChild(body);
    }
    node.appendChild(text);

    // Visual mockup BELOW the title block.
    const mockBox = el('div', 'bb-ww-mockup');
    slide.mockup(mockBox);
    node.appendChild(mockBox);

    return node;
  }

  function buildProgress() {
    const dots = el('div', 'bb-ww-dots');
    SLIDES.forEach((_, i) => {
      const d = el('button', 'bb-ww-dot');
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      dots.appendChild(d);
    });
    return dots;
  }

  function buildNav(track, dotsEl, nextBtn, backBtn, skipBtn) {
    return function update() {
      const isFirst = currentIdx === 0;
      const isLast  = currentIdx === SLIDES.length - 1;
      backBtn.style.visibility = isFirst ? 'hidden' : 'visible';
      nextBtn.textContent = isLast
        ? (SLIDES[currentIdx].ctaLabel || 'Got it, let\'s go')
        : 'Next →';
      nextBtn.classList.toggle('bb-ww-cta-final', isLast);
      skipBtn.style.visibility = isLast ? 'hidden' : 'visible';
      Array.from(dotsEl.children).forEach((d, i) => {
        d.classList.toggle('bb-active', i === currentIdx);
        d.classList.toggle('bb-passed', i < currentIdx);
      });
      // Track is N×100% wide; we shift by 100/N per step.
      track.style.transform = 'translateX(-' + (currentIdx * (100 / SLIDES.length)) + '%)';
    };
  }

  function goTo(idx) {
    if (!backdrop) return;
    currentIdx = Math.max(0, Math.min(SLIDES.length - 1, idx));
    backdrop.__bbUpdate && backdrop.__bbUpdate();
  }

  function next() {
    if (currentIdx >= SLIDES.length - 1) finish();
    else goTo(currentIdx + 1);
  }

  function back() { goTo(currentIdx - 1); }

  function finish() {
    markSeen();
    close();
  }

  // ---------- Public API ----------

  function open() {
    if (backdrop && document.body.contains(backdrop)) return;
    currentIdx = 0;

    backdrop = el('div', 'bb-ww-backdrop');
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    const modal = el('div', 'bb-ww-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const closeBtn = el('button', 'bb-ww-close', '×');
    closeBtn.setAttribute('aria-label', 'Close onboarding');
    closeBtn.addEventListener('click', close);
    modal.appendChild(closeBtn);

    const viewport = el('div', 'bb-ww-viewport');
    const track = el('div', 'bb-ww-track');
    track.style.width = (SLIDES.length * 100) + '%';
    SLIDES.forEach(s => track.appendChild(buildSlide(s)));
    viewport.appendChild(track);
    modal.appendChild(viewport);

    const footer = el('div', 'bb-ww-footer');
    const skipBtn = el('button', 'bb-ww-skip', 'Skip');
    skipBtn.addEventListener('click', finish);
    footer.appendChild(skipBtn);

    const dotsEl = buildProgress();
    footer.appendChild(dotsEl);

    const navBtns = el('div', 'bb-ww-navbtns');
    const backBtn = el('button', 'bb-ww-back', '← Back');
    backBtn.addEventListener('click', back);
    navBtns.appendChild(backBtn);
    const nextBtn = el('button', 'bb-ww-next');
    nextBtn.addEventListener('click', next);
    navBtns.appendChild(nextBtn);
    footer.appendChild(navBtns);

    modal.appendChild(footer);

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    backdrop.__bbUpdate = buildNav(track, dotsEl, nextBtn, backBtn, skipBtn);
    backdrop.__bbUpdate();

    document.addEventListener('keydown', onKey);
    setTimeout(() => nextBtn.focus(), 50);
  }

  function close() {
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    backdrop = null;
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape')           close();
    else if (e.key === 'ArrowRight')  next();
    else if (e.key === 'ArrowLeft')   back();
  }

  function markSeen() {
    try { chrome.storage.local.set({ [STORAGE_KEY]: Date.now() }); } catch (_) {}
  }

  function wasSeen(cb) {
    try {
      chrome.storage.local.get(STORAGE_KEY, (res) => {
        cb(!!(res && res[STORAGE_KEY]));
      });
    } catch (_) { cb(false); }
  }

  // Auto-open on first install if not yet seen.
  function maybeAutoOpen() {
    wasSeen((seen) => { if (!seen) open(); });
  }

  return { open, close, markSeen, wasSeen, maybeAutoOpen };
})();
