// Similar-content banner. Triggered ONLY when the user's actual watch stats
// show evidence of homogeneous consumption — no longer fires blindly after
// N navigations. Rules (all must hold):
//
//   1. The user has at least MIN_WATCHES this week (statistical floor).
//   2. EITHER the top category > TOP_SHARE_THRESHOLD of the diet,
//      OR    distinct categories <= MAX_DISTINCT_CATS.
//   3. The banner is not snoozed (24h cooldown after dismiss).
//
// We re-check after each yt-navigate-finish on /watch — but the storage
// snooze + the stats threshold mean the user sees this rarely and only when
// it's actually informative.
window.BBBanner = (function () {
  const MIN_WATCHES         = 10;
  const TOP_SHARE_THRESHOLD = 0.65;  // 65% of diet in one bucket
  const MAX_DISTINCT_CATS   = 2;     // or fewer than 3 categories total
  const SHOW_DELAY_MS       = 2500;
  const SNOOZE_MS           = 24 * 60 * 60 * 1000;
  const SNOOZE_KEY          = 'bb_banner_snoozed_until';

  let banner = null;
  let timer = null;
  let lastEvaluatedAt = 0;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Build the dynamic text: name the dominant category if there is one so
  // the message reflects the actual situation (C02 Match real world).
  function buildText(stats) {
    const top = stats.diet && stats.diet[0];
    const distinct = stats.diet ? stats.diet.length : 0;
    const data = window.BB_MOCK.similarBanner;
    if (top && top.percent > TOP_SHARE_THRESHOLD * 100) {
      return 'You\'ve watched a lot of ' + top.label
        + ' this week (' + top.percent + '% of your diet). Want suggestions to broaden it?';
    }
    if (distinct > 0 && distinct <= MAX_DISTINCT_CATS) {
      const names = stats.diet.map(d => d.label).join(' and ');
      return 'Your week is mostly ' + names + '. Want to discover something different?';
    }
    return data && data.text ? data.text : 'Want to discover something different?';
  }

  function build(stats) {
    const data = window.BB_MOCK.similarBanner;
    const backdrop = el('div', 'bb-banner-backdrop');

    const card = el('div', 'bb-banner');

    const row = el('div', 'bb-banner-row');
    row.appendChild(el('span', 'bb-banner-dot'));
    row.appendChild(el('div', 'bb-banner-text', buildText(stats)));
    card.appendChild(row);

    const actions = el('div', 'bb-banner-actions');
    const yes = el('button', 'bb-banner-yes', data.yesLabel);
    yes.addEventListener('click', () => {
      hide();
      snooze();
      window.BBWeeklyMirror && window.BBWeeklyMirror.open();
    });
    const no = el('button', 'bb-banner-no', data.noLabel);
    no.addEventListener('click', () => {
      hide();
      snooze();
    });
    actions.appendChild(yes);
    actions.appendChild(no);
    card.appendChild(actions);

    backdrop.appendChild(card);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        hide();
        snooze();
      }
    });
    return backdrop;
  }

  function show(stats) {
    if (banner && document.body.contains(banner)) return;
    banner = build(stats);
    document.body.appendChild(banner);
  }

  function hide() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function snooze() {
    try {
      chrome.storage.local.set({ [SNOOZE_KEY]: Date.now() + SNOOZE_MS });
    } catch (_) {}
  }

  function isSnoozed(cb) {
    try {
      chrome.storage.local.get(SNOOZE_KEY, (res) => {
        const until = (res && res[SNOOZE_KEY]) || 0;
        cb(Date.now() < until);
      });
    } catch (_) { cb(false); }
  }

  // Decide whether the current diet warrants the banner. Returns the stats
  // payload (or null if the banner shouldn't show).
  function evaluate(cb) {
    if (!window.BBStats) return cb(null);
    isSnoozed((snoozed) => {
      if (snoozed) return cb(null);
      window.BBStats.getStats((stats) => {
        if (!stats || !stats.ready) return cb(null);
        if (stats.watchCount < MIN_WATCHES) return cb(null);
        const top = stats.diet && stats.diet[0];
        const distinct = stats.diet ? stats.diet.length : 0;
        const concentrated = top && top.percent > TOP_SHARE_THRESHOLD * 100;
        const fewCats      = distinct > 0 && distinct <= MAX_DISTINCT_CATS;
        if (concentrated || fewCats) return cb(stats);
        cb(null);
      });
    });
  }

  function isWatch() {
    return location.pathname === '/watch';
  }

  // Throttle re-evaluation: at most once every 30s, and only on /watch.
  function maybeEvaluate() {
    if (!isWatch()) return;
    const now = Date.now();
    if (now - lastEvaluatedAt < 30000) return;
    lastEvaluatedAt = now;
    evaluate((stats) => {
      if (!stats) return;
      clearTimeout(timer);
      timer = setTimeout(() => show(stats), SHOW_DELAY_MS);
    });
  }

  function start() {
    // Evaluate after a short delay so BBStats has time to populate on first load.
    setTimeout(maybeEvaluate, 4000);
    // YouTube fires this on every SPA navigation.
    document.addEventListener('yt-navigate-finish', maybeEvaluate);
    window.addEventListener('popstate', maybeEvaluate);
    // Re-evaluate when a new watch is recorded — that's the moment the diet
    // could just have crossed the homogeneity threshold.
    window.addEventListener('bb-watch-recorded', () => {
      // Slight delay so stats.js has flushed.
      setTimeout(maybeEvaluate, 300);
    });
  }

  return { start, show, hide, evaluate };
})();
