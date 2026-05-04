// Hide YouTube feed videos that match a muted category from the Weekly Mirror.
//
// Classification is heuristic: we lower-case the title + channel name and
// look for any keyword from BB_MOCK.categoryKeywords[<category>]. First match
// wins — the rendering order in the Mirror's diet (Tech, Politics, Music)
// also dictates priority.
//
// Hidden cards are not removed; we set display:none so the user can restore
// them by unmuting the category. We also expose a one-shot "show hidden for
// this session" toggle through the indicator pill in feed-indicator.js.
window.BBFeedFilter = (function () {
  const HIDDEN_FLAG = 'data-bb-hidden';
  const CATEGORY_FLAG = 'data-bb-category';
  const SESSION_OVERRIDE_KEY = 'bb_session_show_hidden';

  let mutedSet = new Set();
  let sessionOverride = false;
  let observer = null;
  let pendingScan = null;
  let listeners = new Set();

  const DEBUG = true; // flip to false to silence console output
  function log() {
    if (DEBUG) console.log.apply(console, ['[BB-Filter]'].concat(Array.from(arguments)));
  }

  // Per-category map of channels seen in the feed: Map<category, Map<name, {name, avatar}>>
  const channelsByCategory = new Map();
  function recordChannel(card, category) {
    if (!category) return;
    const nameNode = card.querySelector('ytd-channel-name #text, #channel-name a, ytd-channel-name a');
    const name = nameNode ? (nameNode.textContent || '').trim() : '';
    if (!name) return;
    const avatarImg = card.querySelector('a#avatar-link img, #channel-thumbnail img, yt-img-shadow img');
    const avatar = avatarImg ? (avatarImg.src || avatarImg.getAttribute('src') || '') : '';
    if (!channelsByCategory.has(category)) channelsByCategory.set(category, new Map());
    const m = channelsByCategory.get(category);
    if (!m.has(name) || (!m.get(name).avatar && avatar)) {
      m.set(name, { name, avatar, category });
    }
  }

  // ----- Classification -----
  // Pull the most reliable text we can from a card. Strategy in order of
  // preference:
  //   1. aria-label on the title link (YouTube ships full "TITLE de CHANNEL
  //      il y a 2 jours 452 k vues" string here — guaranteed presence)
  //   2. title attribute
  //   3. raw textContent of the card (noisy but dependable)
  function getCardText(card) {
    const titleLink = card.querySelector(
      'a#video-title-link, a#video-title, a.yt-lockup-metadata-view-model__title, h3 a'
    );
    if (titleLink) {
      const aria = titleLink.getAttribute('aria-label');
      if (aria && aria.trim()) return aria.trim();
      const titleAttr = titleLink.getAttribute('title');
      if (titleAttr && titleAttr.trim()) return titleAttr.trim();
    }
    return (card.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // Kept for the debug table only.
  function getTitle(card) {
    const link = card.querySelector('a#video-title-link, a#video-title, h3 a');
    if (link) {
      return (link.getAttribute('aria-label')
        || link.getAttribute('title')
        || link.textContent || '').replace(/\s+/g, ' ').trim();
    }
    return '';
  }
  function getChannel(card) {
    const node = card.querySelector('ytd-channel-name #text, #channel-name a, ytd-channel-name, #channel-name, #byline');
    return node ? (node.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  function categoryFor(card) {
    if (card.hasAttribute(CATEGORY_FLAG)) {
      const cached = card.getAttribute(CATEGORY_FLAG);
      if (cached) return cached;
      // Empty cache means previous scan saw an empty card — retry below.
    }
    const text = getCardText(card);
    if (!text) return null; // not hydrated yet — retry next scan
    const cat = window.BBClassifier ? window.BBClassifier.classify(text, '') : null;
    card.setAttribute(CATEGORY_FLAG, cat || '');
    return cat;
  }

  function feedCards() {
    const matched = document.querySelectorAll([
      'ytd-rich-item-renderer',          // home grid
      'ytd-grid-video-renderer',         // channel page grid
      'ytd-video-renderer',              // search results
      'ytd-compact-video-renderer',      // watch page sidebar suggestions
      'ytd-compact-radio-renderer',      // watch page mix/playlist suggestions
      'ytd-compact-playlist-renderer',   // watch page playlist suggestions
      'ytd-rich-grid-media',             // standalone rich media (rare wrappers)
      'yt-lockup-view-model'             // newer YouTube lockup component
    ].join(', '));
    // Drop any card that is a descendant of another matched card. YouTube
    // nests ytd-rich-grid-media inside ytd-rich-item-renderer, etc., and we
    // only want to overlay the outermost wrapper (otherwise we end up with
    // two stacked placeholders on the same video).
    const arr = Array.from(matched);
    return arr.filter(card => !arr.some(other => other !== card && other.contains(card)));
  }

  function shouldHide(category) {
    if (sessionOverride) return false;
    return category && mutedSet.has(category);
  }

  let lastLogKey = '';
  let sampleCount = 0;
  const MAX_SAMPLES = 3;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function isCompactCard(card) {
    const t = card.tagName ? card.tagName.toLowerCase() : '';
    if (t.includes('compact')) return true;
    // Search results card is wide but not very tall; treat it as compact too.
    if (t === 'ytd-video-renderer') return true;
    // Fallback: anything < 200px tall behaves like a compact row.
    const r = card.getBoundingClientRect();
    return r.height > 0 && r.height < 200;
  }

  function addOverlay(card, category) {
    if (card.querySelector(':scope > .bb-card-overlay')) return; // already overlaid
    // Ensure absolute children anchor against the card.
    const cs = getComputedStyle(card);
    if (cs.position === 'static') card.style.setProperty('position', 'relative');

    const compact = isCompactCard(card);
    const overlay = el('div', 'bb-card-overlay' + (compact ? ' bb-card-overlay-compact' : ''));
    const inner = el('div', 'bb-card-overlay-inner');
    inner.appendChild(el('div', 'bb-card-overlay-icon', '🔇'));
    inner.appendChild(el('div', 'bb-card-overlay-label', 'Hidden by Feedversity'));
    if (category) inner.appendChild(el('div', 'bb-card-overlay-cat', category));
    const showBtn = el('button', 'bb-card-overlay-show', compact ? 'Show' : 'Show this video');
    inner.appendChild(showBtn);
    overlay.appendChild(inner);

    const reveal = (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.remove();
      card.setAttribute('data-bb-revealed', '1');
      card.removeAttribute(HIDDEN_FLAG);
    };
    overlay.addEventListener('click', reveal);
    card.appendChild(overlay);
  }

  function removeOverlay(card) {
    const o = card.querySelector(':scope > .bb-card-overlay');
    if (o) o.remove();
  }

  function applyOnce() {
    let hiddenCount = 0;
    let totalScanned = 0;
    const breakdown = {};
    const cards = Array.from(feedCards());
    cards.forEach(card => {
      totalScanned++;
      const cat = categoryFor(card);
      if (cat) {
        breakdown[cat] = (breakdown[cat] || 0) + 1;
        recordChannel(card, cat);
      }
      const userRevealed = card.hasAttribute('data-bb-revealed');
      if (shouldHide(cat) && !userRevealed) {
        if (!card.hasAttribute(HIDDEN_FLAG)) {
          card.setAttribute(HIDDEN_FLAG, '1');
        }
        addOverlay(card, cat);
        hiddenCount++;
      } else if (card.hasAttribute(HIDDEN_FLAG) || userRevealed) {
        if (!shouldHide(cat)) {
          // No longer in muted set — clear reveal flag too so future re-mutes work.
          card.removeAttribute('data-bb-revealed');
        }
        card.removeAttribute(HIDDEN_FLAG);
        removeOverlay(card);
      }
    });
    const key = totalScanned + '|' + hiddenCount + '|' + Array.from(mutedSet).sort().join(',') + '|' + JSON.stringify(breakdown);
    if (key !== lastLogKey) {
      lastLogKey = key;
      log('scan — scanned:', totalScanned, '| muted:', Array.from(mutedSet), '| hidden:', hiddenCount, '| matched per category:', breakdown);
      // Auto-dump a sample of cards (up to 3 times across the session) so we
      // can confirm the extractor is reading actual content after lazy load.
      if (sampleCount < MAX_SAMPLES && totalScanned > 0) {
        sampleCount++;
        const rows = cards.slice(0, 12).map((card, i) => ({
          idx: i,
          title: getTitle(card).slice(0, 60) || getCardText(card).slice(0, 60),
          channel: getChannel(card).slice(0, 25),
          category: card.getAttribute(CATEGORY_FLAG) || '(unmatched)',
          hidden: card.hasAttribute(HIDDEN_FLAG) ? 'yes' : '',
          textLen: (card.textContent || '').length
        }));
        try { console.log('[BB-Filter] sample #' + sampleCount); console.table(rows); } catch (_) {}
      }
    }
    notify(hiddenCount);
  }

  function scheduleScan() {
    if (pendingScan) return;
    pendingScan = requestAnimationFrame(() => {
      pendingScan = null;
      applyOnce();
    });
  }

  // ----- Public API -----
  function refresh() {
    loadMuted(() => {
      // Reclassify everything from scratch (categories may have changed).
      feedCards().forEach(c => c.removeAttribute(CATEGORY_FLAG));
      applyOnce();
    });
  }

  // Direct setter — avoids the storage round-trip race when toggling from the
  // Mirror.
  function setMuted(arr) {
    mutedSet = new Set(arr || []);
    log('setMuted', Array.from(mutedSet));
    applyOnce();
  }

  function setSessionOverride(value) {
    sessionOverride = !!value;
    sessionStorage.setItem(SESSION_OVERRIDE_KEY, sessionOverride ? '1' : '0');
    applyOnce();
  }

  function isSessionOverride() {
    return sessionOverride;
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function notify(hiddenCount) {
    listeners.forEach(fn => {
      try { fn({ hiddenCount, mutedCategories: Array.from(mutedSet), override: sessionOverride }); }
      catch (_) {}
    });
  }

  // ----- Storage -----
  function loadMuted(cb) {
    try {
      chrome.storage.local.get('bb_muted_categories', (res) => {
        const arr = (res && res.bb_muted_categories) || [];
        mutedSet = new Set(arr);
        cb && cb();
      });
    } catch (_) {
      mutedSet = new Set();
      cb && cb();
    }
  }

  function watchStorage() {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.bb_muted_categories) {
          mutedSet = new Set(changes.bb_muted_categories.newValue || []);
          applyOnce();
        }
      });
    } catch (_) {}
  }

  function start() {
    sessionOverride = sessionStorage.getItem(SESSION_OVERRIDE_KEY) === '1';
    loadMuted(() => {
      applyOnce();
      observer = new MutationObserver(() => scheduleScan());
      observer.observe(document.body, { childList: true, subtree: true });
      watchStorage();
      document.addEventListener('yt-navigate-finish', () => {
        // After SPA nav, force a fresh classification (DOM may have just
        // been replaced).
        sampleCount = 0;
        feedCards().forEach(c => c.removeAttribute(CATEGORY_FLAG));
        scheduleScan();
      });
      // Polling backup: 5 deferred re-scans over 15s after page load to
      // catch lazy-loaded cards that the MutationObserver might miss.
      [2000, 4000, 7000, 10000, 15000].forEach(ms => setTimeout(scheduleScan, ms));
    });
  }

  function getFeedStats() {
    // Re-derive percentages from the cards currently in the DOM.
    const counts = {};
    feedCards().forEach(card => {
      const cat = card.getAttribute(CATEGORY_FLAG);
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const diet = Object.entries(counts)
      .map(([label, count]) => ({ label, count, percent: total > 0 ? Math.round(count * 100 / total) : 0 }))
      .sort((a, b) => b.percent - a.percent);
    const channels = [];
    for (const [, m] of channelsByCategory) {
      for (const info of m.values()) channels.push(info);
    }
    return { diet, channels, totalCards: total };
  }

  const api = {
    start,
    refresh,
    setMuted,
    setSessionOverride,
    isSessionOverride,
    onChange,
    getFeedStats,
    getMuted: () => Array.from(mutedSet),
    // Debug helpers for the console
    debug: () => {
      const cards = Array.from(feedCards());
      console.log('[BB-Filter] === DEBUG ===');
      console.log('[BB-Filter] muted:', Array.from(mutedSet));
      console.log('[BB-Filter] override:', sessionOverride);
      console.log('[BB-Filter] cards found:', cards.length);
      const rows = cards.slice(0, 15).map((card, i) => ({
        idx: i,
        title: getTitle(card).slice(0, 70),
        channel: getChannel(card).slice(0, 30),
        category: card.getAttribute(CATEGORY_FLAG) || '(unmatched)',
        hidden: card.hasAttribute(HIDDEN_FLAG) ? 'yes' : ''
      }));
      console.table(rows);
    }
  };
  return api;
})();
