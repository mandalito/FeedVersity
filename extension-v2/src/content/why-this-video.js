// "Why this Video?" — adds:
//   1. A pill button next to Share on the watch page (primary affordance).
//   2. A "Why this Video ?" entry inside the 3-dot dropdown menu of any video
//      card (home, search results, suggestions, watch page).
//
// YouTube reuses a single popup listbox for many different menus and
// repopulates items each time, so we cannot mark it once-injected — we have
// to re-inject whenever the listbox content changes.
window.BBWhyThisVideo = (function () {
  const PILL_FLAG = 'data-bb-why-pill';
  const ITEM_MARK = 'bb-why-item'; // class used to detect our own item
  let tooltip = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function currentVideoTitle() {
    const t = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')
           || document.querySelector('h1.ytd-watch-metadata')
           || document.querySelector('#title h1');
    return t ? t.textContent.trim() : '';
  }

  function currentVideoChannel() {
    const sels = [
      'ytd-watch-metadata ytd-channel-name yt-formatted-string a',
      'ytd-watch-metadata #channel-name a',
      'ytd-video-owner-renderer ytd-channel-name a',
      'ytd-video-owner-renderer #channel-name yt-formatted-string a',
      '#owner ytd-channel-name a',
      '#owner #channel-name a',
      '#channel-name yt-formatted-string'
    ];
    for (const s of sels) {
      const node = document.querySelector(s);
      if (node && node.textContent && node.textContent.trim()) return node.textContent.trim();
    }
    return '';
  }

  // Build a contextual reason from real watch history. Hierarchy:
  //   1. Same-channel signal — if user has watched this channel ≥2× this week
  //   2. Same-category in user's diet — count + share
  //   3. Category outside diet — frame as algorithm exploration
  //   4. Insufficient data — invite the user to keep watching
  // Calls cb({ reason, category }) once resolved.
  function generateReason(cb) {
    const title   = currentVideoTitle();
    const channel = currentVideoChannel();
    const category = (window.BBClassifier && window.BBClassifier.classify(title, channel, '')) || null;

    // Without BBStats we can only fall back to the static mock. Rare path.
    if (!window.BBStats) {
      cb({
        reason: (window.BB_MOCK && window.BB_MOCK.whyForTitle(title)) || 'No data yet to explain this recommendation.',
        category
      });
      return;
    }

    window.BBStats.load((watches) => {
      const now = Date.now();
      const weekStart = now - 7 * 86400000;
      const weekly = watches.filter(w => w.ts >= weekStart);
      const totalWeek = weekly.length;

      // 1. Channel signal — strongest. The user clearly engages with this creator.
      if (channel) {
        const sameChannel = weekly.filter(w => w.channel === channel);
        if (sameChannel.length >= 2) {
          cb({
            reason: 'Recommended because you\'ve watched ' + sameChannel.length
              + ' video' + (sameChannel.length > 1 ? 's' : '')
              + ' from ' + channel + ' this week.',
            category
          });
          return;
        }
      }

      // 2. Category signal. Need a classified category and a non-trivial week.
      if (category && totalWeek >= 3) {
        const sameCat = weekly.filter(w => w.category === category);
        const share = sameCat.length / totalWeek;
        const pct = Math.round(share * 100);

        // Find rank of this category in the user's diet (1 = top).
        const counts = {};
        weekly.forEach(w => { if (w.category) counts[w.category] = (counts[w.category] || 0) + 1; });
        const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => k);
        const rank = ranked.indexOf(category) + 1;

        if (sameCat.length >= 1) {
          let prefix;
          if (rank === 1)      prefix = 'It\'s your top category this week';
          else if (rank === 2) prefix = 'It\'s your #2 category this week';
          else                 prefix = 'A category you watch';
          cb({
            reason: prefix + ' — you\'ve watched ' + sameCat.length + ' '
              + category + ' video' + (sameCat.length > 1 ? 's' : '')
              + ' (' + pct + '% of your week).',
            category
          });
          return;
        }

        // Category not yet in the user's diet → algorithm exploration framing.
        cb({
          reason: 'YouTube is recommending ' + category
            + ' content — a category you don\'t usually watch. The algorithm is testing whether to expand into it.',
          category
        });
        return;
      }

      // 3. Insufficient data — be honest.
      if (totalWeek < 3) {
        cb({
          reason: 'Not enough data yet to explain this. Watch a few more videos and check back — this card will get specific.',
          category
        });
        return;
      }

      // 4. Last-ditch fallback (no category extracted).
      cb({
        reason: 'YouTube\'s recommendation isn\'t mapped to a category we recognise. Try the Mirror to see your overall patterns.',
        category
      });
    });
  }

  function buildTooltipBody(reason, category) {
    const frag = document.createDocumentFragment();
    frag.appendChild(el('span', 'bb-banner-dot'));
    const body = el('div', 'bb-why-tooltip-body');
    if (category) {
      const chip = el('span', 'bb-why-tooltip-chip', category);
      const color = (window.BB_MOCK && window.BB_MOCK.colorFor(category)) || '#6B7280';
      chip.style.color = color;
      chip.style.borderColor = color;
      body.appendChild(chip);
    }
    body.appendChild(el('div', 'bb-why-tooltip-text', reason));
    frag.appendChild(body);
    return frag;
  }

  function showTooltipNear(anchor) {
    hideTooltip();
    tooltip = el('div', 'bb-why-tooltip');
    tooltip.appendChild(el('div', 'bb-why-tooltip-loading', 'Analysing your week…'));
    document.body.appendChild(tooltip);

    const rect = anchor.getBoundingClientRect();
    const top = window.scrollY + rect.bottom + 8;
    const maxLeft = window.innerWidth - tooltip.offsetWidth - 12;
    const left = Math.min(window.scrollX + rect.left, maxLeft);
    tooltip.style.top = top + 'px';
    tooltip.style.left = Math.max(12, left) + 'px';

    generateReason(({ reason, category }) => {
      if (!tooltip) return;
      while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);
      tooltip.appendChild(buildTooltipBody(reason, category));
    });

    setTimeout(() => {
      document.addEventListener('click', dismissOnOutside, { once: true });
    }, 0);
  }

  function showTooltipCentered() {
    hideTooltip();
    tooltip = el('div', 'bb-why-tooltip');
    tooltip.appendChild(el('div', 'bb-why-tooltip-loading', 'Analysing your week…'));
    tooltip.style.position = 'fixed';
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
    tooltip.style.maxWidth = '420px';
    document.body.appendChild(tooltip);

    generateReason(({ reason, category }) => {
      if (!tooltip) return;
      while (tooltip.firstChild) tooltip.removeChild(tooltip.firstChild);
      tooltip.appendChild(buildTooltipBody(reason, category));
    });

    setTimeout(() => {
      document.addEventListener('click', dismissOnOutside, { once: true });
    }, 0);
  }

  function dismissOnOutside(e) {
    if (tooltip && !tooltip.contains(e.target)) hideTooltip();
  }

  function hideTooltip() {
    if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
    tooltip = null;
  }

  // ----- Pill next to Share on the watch page -----
  function injectPill() {
    if (!location.pathname.startsWith('/watch')) return;
    const row = document.querySelector('ytd-watch-metadata #actions #top-row')
             || document.querySelector('ytd-watch-metadata #top-row')
             || document.querySelector('#above-the-fold #actions');
    if (!row || row.hasAttribute(PILL_FLAG)) return;

    const pill = el('button', 'bb-why-pill', 'Why this Video ?');
    pill.setAttribute('type', 'button');
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      showTooltipNear(pill);
    });
    row.appendChild(pill);
    row.setAttribute(PILL_FLAG, '1');
  }

  // ----- Entry inside any 3-dot dropdown menu -----
  // Detect when the popup listbox contains items typical of a video menu
  // (Share / Save to playlist / Not interested / Don't recommend channel).
  // If yes and our item isn't already there, inject it at the top.
  function isVideoMenu(listbox) {
    const text = listbox.textContent || '';
    // Multilingual matches (FR + EN). Short keywords good enough for the demo.
    return /Share|Partager|Save to|Enregistrer|Not interested|Pas intéressé|recommend|recommander|Add to queue|Ajouter à la file/i.test(text);
  }

  function injectMenuItem() {
    const listbox = document.querySelector('ytd-popup-container tp-yt-paper-listbox');
    if (!listbox) return;
    if (listbox.querySelector('.' + ITEM_MARK)) return;
    if (!isVideoMenu(listbox)) return;

    const item = el('div', 'bb-menu-item ' + ITEM_MARK);
    item.setAttribute('role', 'menuitem');
    item.appendChild(el('span', 'bb-banner-dot'));
    item.appendChild(el('span', null, 'Why this Video ?'));
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close YouTube popup, then show tooltip.
      const dropdown = document.querySelector('ytd-popup-container tp-yt-iron-dropdown');
      if (dropdown && typeof dropdown.close === 'function') {
        try { dropdown.close(); } catch (_) {}
      } else if (dropdown) {
        dropdown.style.display = 'none';
      }
      // Anchor the tooltip near the original 3-dot button if we can find it,
      // otherwise center on screen.
      const anchor = document.querySelector('.bb-why-pill')
                  || document.querySelector('ytd-watch-metadata #top-row')
                  || document.activeElement;
      if (anchor && anchor.getBoundingClientRect) {
        const r = anchor.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          showTooltipNear(anchor);
          return;
        }
      }
      showTooltipCentered();
    });
    listbox.insertBefore(item, listbox.firstChild);
  }

  function start() {
    injectPill();
    injectMenuItem();
    const obs = new MutationObserver(() => {
      injectPill();
      injectMenuItem();
    });
    obs.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('scroll', hideTooltip, { passive: true });
    window.addEventListener('resize', hideTooltip);
  }

  return { start };
})();
