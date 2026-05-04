// Weekly Mirror modal: Your Diet bar, VS Last Week box, and New Channels grid.
// All data is mocked from window.BB_MOCK.weeklyMirror.
window.BBWeeklyMirror = (function () {
  let backdrop = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // Relative timestamp ("2h ago", "yesterday", "3d ago"). Plain English so a
  // screen reader can announce it naturally (C07 accessibility).
  function relativeTime(ts) {
    if (!ts) return '';
    const diffMs = Date.now() - ts;
    const sec = Math.max(0, Math.round(diffMs / 1000));
    if (sec < 60)        return 'just now';
    const min = Math.round(sec / 60);
    if (min < 60)        return min + 'm ago';
    const hr = Math.round(min / 60);
    if (hr < 24)         return hr + 'h ago';
    const day = Math.round(hr / 24);
    if (day === 1)       return 'yesterday';
    if (day < 7)         return day + 'd ago';
    const wk = Math.round(day / 7);
    if (wk < 4)          return wk + 'w ago';
    return new Date(ts).toLocaleDateString();
  }

  function buildHeader(data) {
    const header = el('div', 'bb-mirror-header');

    const title = el('div', 'bb-mirror-title');
    title.appendChild(el('span', 'bb-logo-dot'));
    title.appendChild(el('span', null, 'Your YouTube Diet'));
    title.appendChild(el('span', 'bb-mirror-title-sep', '—'));
    title.appendChild(el('span', 'bb-mirror-title-sub', 'Weekly Mirror'));
    header.appendChild(title);

    const right = el('div', 'bb-mirror-actions');

    // Discreet reset button — wipes the watch history. Visible only when there
    // is something to wipe (count > 0) so first-time users don't see a
    // destructive action they can't perform.
    const resetCount = (data && data.watchCount) || (data && data.totalStored) || 0;
    if (resetCount > 0) {
      const resetBtn = el('button', 'bb-mirror-reset', 'Reset');
      resetBtn.title = 'Erase ' + resetCount + ' tracked watches';
      resetBtn.addEventListener('click', () => {
        const msg = 'Erase ' + resetCount + ' tracked watch' + (resetCount > 1 ? 'es' : '') +
          '? This cannot be undone.';
        if (!confirm(msg)) return;
        window.BBStats && window.BBStats.clear(() => {
          close();
          setTimeout(open, 60);
        });
      });
      right.appendChild(resetBtn);
    }

    // Help button — opens the Warm Welcome onboarding (Vague 4). For now,
    // gracefully no-ops if the module isn't loaded yet so we can ship the
    // header refactor independently.
    const helpBtn = el('button', 'bb-mirror-help', '?');
    helpBtn.setAttribute('aria-label', 'How does the Mirror work?');
    helpBtn.title = 'How does the Mirror work?';
    helpBtn.addEventListener('click', () => {
      if (window.BBWarmWelcome && window.BBWarmWelcome.open) {
        window.BBWarmWelcome.open();
      } else {
        // Stub — Warm Welcome ships in Vague 4.
        console.log('[BB-Mirror] Warm Welcome onboarding coming soon.');
      }
    });
    right.appendChild(helpBtn);

    const closeBtn = el('button', 'bb-mirror-close', '×');
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', close);
    right.appendChild(closeBtn);

    header.appendChild(right);
    return header;
  }

  function buildDiet(diet, mutedSet, opts) {
    const showDelta = !(opts && opts.firstWeek);
    const watchCount = (opts && opts.watchCount) || 0;
    const card = el('div', 'bb-card');
    card.appendChild(el('div', 'bb-card-title', 'YOUR DIET'));

    const colorOf = (d) => d.color || (window.BB_MOCK && window.BB_MOCK.colorFor(d.label)) || '#6B7280';
    const isRisk  = (cat) => window.BB_MOCK && window.BB_MOCK.isRiskCategory && window.BB_MOCK.isRiskCategory(cat);

    const bar = el('div', 'bb-diet-bar');
    const barSegByLabel = {};
    diet.forEach(d => {
      const seg = el('span');
      seg.style.background = colorOf(d);
      seg.style.width = d.percent + '%';
      seg.dataset.label = d.label;
      if (mutedSet.has(d.label)) seg.classList.add('bb-diet-seg-muted');
      bar.appendChild(seg);
      barSegByLabel[d.label] = seg;
    });
    card.appendChild(bar);

    const TOP_N = 3;
    const hasLongTail = diet.length > TOP_N;
    const rows = el('div', 'bb-diet-rows bb-diet-rows-mute' + (showDelta ? '' : ' bb-diet-rows-no-delta'));
    diet.forEach((d, idx) => {
      const label = el('span', 'bb-diet-label', d.label);
      label.style.color = colorOf(d);
      if (mutedSet.has(d.label)) label.classList.add('bb-diet-label-muted');
      // Combine percent and delta into a single column so they read as one unit.
      const pctWrap = el('span', 'bb-diet-pct-wrap');
      pctWrap.appendChild(el('span', 'bb-diet-pct', d.percent + '%'));
      if (showDelta && d.delta !== 0) {
        // Delta color logic (B2):
        //   • risk category INCREASING  → red (semantic warning)
        //   • all other deltas          → neutral grey (no value judgment)
        // Up arrow = absolute direction, separate from semantic color.
        const isRiskUp = d.delta > 0 && isRisk(d.label);
        const deltaClass = isRiskUp ? 'bb-diet-delta bb-delta-risk' : 'bb-diet-delta bb-delta-neutral';
        const arrow = d.delta > 0 ? '↑' : '↓';
        const deltaText = arrow + ' ' + Math.abs(d.delta) + '%';
        const deltaSpan = el('span', deltaClass, deltaText);
        // B3 — tooltip on the delta gives the reference window so the number
        // is interpretable (C02 Visibility of system status).
        const refText = watchCount > 0
          ? 'vs last week (' + watchCount + ' video' + (watchCount > 1 ? 's' : '') + ' tracked)'
          : 'vs last week';
        deltaSpan.title = (d.delta > 0 ? '+' : '−') + Math.abs(d.delta) + '% ' + refText
          + (isRiskUp ? '\n⚠ This category is sensitive — keep an eye on it.' : '');
        pctWrap.appendChild(deltaSpan);
      }

      // B1 — toggle pill instead of opaque speaker icon. Affordance is now
      // explicit (text label + state) per C02 Affordance + Visibility.
      const muteBtn = el('button', 'bb-mute-pill');
      const isMuted = mutedSet.has(d.label);
      const setLabel = (muted) => {
        muteBtn.textContent = muted ? '✓ Muted' : 'Mute';
        muteBtn.setAttribute('aria-pressed', String(muted));
        muteBtn.title = muted
          ? d.label + ' is hidden from your feed — click to unmute'
          : 'Hide ' + d.label + ' videos from your feed';
        muteBtn.classList.toggle('bb-muted', muted);
      };
      setLabel(isMuted);
      muteBtn.addEventListener('click', () => {
        const newMuted = !muteBtn.classList.contains('bb-muted');
        if (newMuted) mutedSet.add(d.label);
        else mutedSet.delete(d.label);
        setLabel(newMuted);
        // Mirror the state on the diet bar segment + the label so the user
        // sees the consequence immediately (C09 microinteraction model).
        label.classList.toggle('bb-diet-label-muted', newMuted);
        const seg = barSegByLabel[d.label];
        if (seg) seg.classList.toggle('bb-diet-seg-muted', newMuted);
        // Quick spring animation to confirm the toggle.
        muteBtn.classList.remove('bb-just-toggled');
        // Force reflow so re-adding the class re-triggers the animation.
        void muteBtn.offsetWidth;
        muteBtn.classList.add('bb-just-toggled');
        persistMuted(mutedSet);
        if (window.BBFeedFilter) window.BBFeedFilter.setMuted(Array.from(mutedSet));
      });

      // Tag the 3 cells of long-tail rows so the toggle can hide them as a group.
      if (hasLongTail && idx >= TOP_N) {
        label.classList.add('bb-diet-tail');
        pctWrap.classList.add('bb-diet-tail');
        muteBtn.classList.add('bb-diet-tail');
      }
      rows.appendChild(label);
      rows.appendChild(pctWrap);
      rows.appendChild(muteBtn);
    });
    card.appendChild(rows);

    // Long-tail toggle: collapsed by default. C02 Progressive disclosure.
    if (hasLongTail) {
      const tailCount = diet.length - TOP_N;
      const toggle = el('button', 'bb-diet-toggle');
      const labelExpanded   = 'Hide ' + tailCount + ' more ↑';
      const labelCollapsed  = 'Show ' + tailCount + ' more ↓';
      let expanded = false;
      const apply = () => {
        rows.classList.toggle('bb-diet-rows-expanded', expanded);
        toggle.textContent = expanded ? labelExpanded : labelCollapsed;
        toggle.setAttribute('aria-expanded', String(expanded));
      };
      apply();
      toggle.addEventListener('click', () => { expanded = !expanded; apply(); });
      card.appendChild(toggle);
    }

    return card;
  }

  function persistMuted(set) {
    try {
      chrome.storage.local.set({ bb_muted_categories: Array.from(set) });
    } catch (_) {}
  }

  function loadMuted(cb) {
    try {
      chrome.storage.local.get('bb_muted_categories', (res) => {
        const arr = (res && res.bb_muted_categories) || [];
        cb(new Set(arr));
      });
    } catch (_) {
      cb(new Set());
    }
  }

  // Diversity Score card. Replaces the old "VS. LAST WEEK ±N%" oxymoron with
  // an explicit categories count + a permanent help line. Green only when the
  // score is BROADER than the baseline (last week, or avg user). Otherwise
  // neutral so we don't impose a value judgment (cf prof feedback + DG4).
  function buildDiversityScore(vs, diversity) {
    const card = el('div', 'bb-vs');
    const ref = (diversity && diversity.comparison) || (vs && vs.comparison) || 'last-week';
    const refLabel = ref === 'avg-user' ? 'avg user' : 'last week';

    const isBroader = diversity ? diversity.isBroader : (vs && vs.direction === 'broader');
    if (!isBroader) card.classList.add('bb-vs-neutral');

    card.appendChild(el('div', 'bb-card-title', 'DIVERSITY SCORE'));

    // Headline: "7 categories this week"
    const thisCats = diversity ? diversity.thisCats : null;
    const headlineText = thisCats != null
      ? thisCats + ' categor' + (thisCats === 1 ? 'y' : 'ies') + ' this week'
      : (vs.direction === 'narrower' ? '↓' : '↑') + ' ' + Math.abs(vs.change) + '%';
    card.appendChild(el('div', 'bb-vs-big', headlineText));

    // Comparison line: "↑ 1 more than last week (was 6)"
    if (diversity) {
      const prev = diversity.previousCats;
      const diff = diversity.thisCats - prev;
      let cmpText;
      if (diff > 0)      cmpText = '↑ ' + diff + ' more than ' + refLabel + ' (was ' + prev + ')';
      else if (diff < 0) cmpText = '↓ ' + Math.abs(diff) + ' fewer than ' + refLabel + ' (was ' + prev + ')';
      else               cmpText = '= same as ' + refLabel + ' (' + prev + ')';
      card.appendChild(el('div', 'bb-vs-cmp', cmpText));
    } else {
      card.appendChild(el('div', 'bb-vs-cmp', vs.label || ('vs ' + refLabel)));
    }

    // Permanent help line — addresses prof feedback "explain the green tag".
    // Plain language; defines the metric inside the surface so the user
    // doesn't have to remember it (Recognition over recall — C02 slide 30).
    const helpText = ref === 'avg-user'
      ? 'How many distinct content categories appeared this week. Higher = broader exposure than the average YouTube user.'
      : 'How many distinct content categories appeared this week. Higher = broader exposure than your usual.';
    card.appendChild(el('div', 'bb-vs-help', helpText));

    return card;
  }

  // Backwards-compat shim — older call sites still pass just `vs`.
  function buildVs(vs, diversity) {
    return buildDiversityScore(vs, diversity);
  }

  function buildChannelRow(ch) {
    const row = el('div', 'bb-channel-row');

    const info = el('div', 'bb-channel-info');
    const fallbackColor = ch.color
      || (ch.category && window.BB_MOCK && window.BB_MOCK.colorFor(ch.category))
      || '#6B7280';
    let avatarNode;
    if (ch.avatar) {
      avatarNode = document.createElement('img');
      avatarNode.className = 'bb-channel-avatar bb-channel-avatar-img';
      avatarNode.src = ch.avatar;
      avatarNode.alt = '';
      avatarNode.referrerPolicy = 'no-referrer';
      avatarNode.addEventListener('error', () => {
        const fallback = el('span', 'bb-channel-avatar');
        fallback.style.background = fallbackColor;
        fallback.style.color = '#fff';
        fallback.textContent = (ch.name || '?').charAt(0).toUpperCase();
        avatarNode.replaceWith(fallback);
      });
    } else {
      avatarNode = el('span', 'bb-channel-avatar');
      avatarNode.style.background = fallbackColor;
      avatarNode.style.color = '#fff';
      avatarNode.textContent = (ch.name || '?').charAt(0).toUpperCase();
    }
    info.appendChild(avatarNode);

    const meta = el('div', 'bb-channel-meta');
    meta.appendChild(el('div', 'bb-channel-name', ch.name));

    // Tag line: category chip(s). Kept compact on a single line.
    const tags = el('div', 'bb-channel-tags');
    (ch.tags || []).forEach((t, i) => {
      if (i > 0) tags.appendChild(el('span', 'bb-tag-sep', '·'));
      const tagSpan = el('span', null, t.text);
      const tagColor = t.color || (window.BB_MOCK && window.BB_MOCK.colorFor(t.text)) || '#6B7280';
      tagSpan.style.color = tagColor;
      tagSpan.style.fontWeight = '600';
      tags.appendChild(tagSpan);
    });
    meta.appendChild(tags);

    // Reason line — explains WHY this channel was suggested.
    // Addresses F1 (users don't understand why content is recommended).
    if (ch.reason) {
      meta.appendChild(el('div', 'bb-channel-reason', ch.reason));
    }
    info.appendChild(meta);

    row.appendChild(info);

    // Resolve a YouTube URL for this channel with sensible fallbacks:
    //   1. handle  → https://www.youtube.com/@HugoDecrypteActus
    //   2. channelUrl (raw URL captured from the watch page) → use as-is
    //   3. nothing → search YouTube for the channel name
    const channelUrl = resolveChannelUrl(ch);
    info.style.cursor = 'pointer';
    info.title = 'Open ' + ch.name + ' on YouTube';
    info.addEventListener('click', () => window.open(channelUrl, '_blank', 'noopener'));

    const btn = el('button', 'bb-add-feed', 'Open channel');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(channelUrl, '_blank', 'noopener');
      btn.classList.add('bb-added');
      btn.textContent = 'Opened ↗';
    });
    row.appendChild(btn);

    return row;
  }

  // Build the best YouTube URL for a channel record. Always returns a usable
  // URL (search fallback) so the "Open channel" button never feels broken.
  function resolveChannelUrl(ch) {
    if (ch.handle) {
      const h = ch.handle.startsWith('@') ? ch.handle : '@' + ch.handle;
      return 'https://www.youtube.com/' + h;
    }
    if (ch.channelUrl) return ch.channelUrl;
    return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ch.name || '');
  }

  function buildChannels(list) {
    const card = el('div', 'bb-card bb-channels');
    card.appendChild(el('div', 'bb-card-title', 'NEW CHANNELS TO EXPLORE'));

    // CTA banner — frames the section as actionable diversification, not
    // browsing. Aligns with DG2 + the diet metaphor: each channel here is
    // an ingredient the user could add to their week.
    const cta = el('div', 'bb-channels-cta');
    cta.appendChild(el('span', 'bb-channels-cta-icon', '💡'));
    const ctaText = el('div', 'bb-channels-cta-text');
    ctaText.appendChild(el('div', 'bb-channels-cta-title', 'How to diversify your diet'));
    ctaText.appendChild(el('div', 'bb-channels-cta-body',
      'Pick a channel below from a category you don\'t usually watch — your Diet rebalances on the next video.'));
    cta.appendChild(ctaText);
    card.appendChild(cta);

    if (list.length === 0) {
      card.appendChild(el('div', 'bb-channels-empty', 'Watch a few videos to unlock personalized suggestions.'));
      return card;
    }

    // D3 — Hero card for the most-relevant suggestion. Visual hierarchy
    // (C03 slide 14) gives the user a clear entry point instead of treating
    // all 4-6 suggestions as equivalent.
    const [hero, ...rest] = list;
    card.appendChild(buildChannelHero(hero));

    if (rest.length > 0) {
      const grid = el('div', 'bb-channels-grid');
      rest.forEach(ch => grid.appendChild(buildChannelRow(ch)));
      card.appendChild(grid);
    }
    return card;
  }

  // Hero variant of a channel suggestion: bigger avatar, prominent CTA,
  // category chip and reason kept on separate lines for readability.
  function buildChannelHero(ch) {
    const url = resolveChannelUrl(ch);
    const accent = ch.color
      || (ch.category && window.BB_MOCK && window.BB_MOCK.colorFor(ch.category))
      || 'var(--bb-cta)';

    const wrap = el('div', 'bb-channel-hero');
    wrap.style.setProperty('--bb-hero-accent', accent);

    // Avatar (large, clickable)
    let avatar;
    if (ch.avatar) {
      avatar = document.createElement('img');
      avatar.className = 'bb-channel-hero-avatar bb-channel-avatar-img';
      avatar.src = ch.avatar;
      avatar.alt = '';
      avatar.referrerPolicy = 'no-referrer';
      avatar.addEventListener('error', () => {
        const fb = el('span', 'bb-channel-hero-avatar');
        fb.style.background = accent;
        fb.style.color = '#fff';
        fb.textContent = (ch.name || '?').charAt(0).toUpperCase();
        avatar.replaceWith(fb);
      });
    } else {
      avatar = el('span', 'bb-channel-hero-avatar');
      avatar.style.background = accent;
      avatar.style.color = '#fff';
      avatar.textContent = (ch.name || '?').charAt(0).toUpperCase();
    }
    avatar.style.cursor = 'pointer';
    avatar.title = 'Open ' + ch.name + ' on YouTube';
    avatar.addEventListener('click', () => window.open(url, '_blank', 'noopener'));
    wrap.appendChild(avatar);

    const body = el('div', 'bb-channel-hero-body');

    // Top label (small uppercase) — frames this as a featured pick.
    const eyebrow = el('div', 'bb-channel-hero-eyebrow', 'Featured pick');
    body.appendChild(eyebrow);

    // Name (larger than regular row)
    const name = el('div', 'bb-channel-hero-name', ch.name);
    body.appendChild(name);

    // Category chip — colored chip pill rather than inline text for prominence.
    const chip = el('span', 'bb-channel-hero-chip', ch.category || (ch.tags && ch.tags[0] && ch.tags[0].text) || '');
    chip.style.background = accent;
    body.appendChild(chip);

    // Reason
    if (ch.reason) {
      body.appendChild(el('div', 'bb-channel-hero-reason', ch.reason));
    }

    // CTA
    const cta = el('button', 'bb-channel-hero-cta', 'Open channel ↗');
    cta.addEventListener('click', () => {
      window.open(url, '_blank', 'noopener');
      cta.classList.add('bb-added');
      cta.textContent = 'Opened ↗';
    });
    body.appendChild(cta);

    wrap.appendChild(body);
    return wrap;
  }

  // E4 — Group recent watches by (channel, category). If a group has 3+
  // items, collapse them into a summary row with an expand toggle. Preserves
  // chronological order: the group renders at the position of its
  // most-recent item. Solo items render as before.
  function groupRecentWatches(watches) {
    const COLLAPSE_AT = 3;
    const counts = {};
    watches.forEach(w => {
      const key = (w.channel || '?') + '|' + (w.category || '');
      counts[key] = (counts[key] || 0) + 1;
    });
    const seen = new Set();
    const out = [];
    watches.forEach(w => {
      const key = (w.channel || '?') + '|' + (w.category || '');
      if (counts[key] >= COLLAPSE_AT) {
        if (seen.has(key)) return;
        seen.add(key);
        const items = watches.filter(x =>
          ((x.channel || '?') + '|' + (x.category || '')) === key
        );
        out.push({ type: 'group', key, items });
      } else {
        out.push({ type: 'single', item: w });
      }
    });
    return out;
  }

  // List of recent watches with an inline category dropdown so the user can
  // correct any mis-classification. This is the primary lever for legitimacy
  // (DG5 / F4): when the keyword classifier misses, the user fixes it.
  function buildRecentWatches(watches) {
    const card = el('div', 'bb-card bb-recent-watches');
    card.appendChild(el('div', 'bb-card-title', 'RECENT WATCHES'));
    const sub = el('div', 'bb-recent-sub', 'Wrong category? Pick the right one — your diet updates instantly.');
    card.appendChild(sub);

    const list = el('div', 'bb-watch-list');
    const groups = groupRecentWatches(watches);
    groups.forEach(g => {
      if (g.type === 'group') {
        list.appendChild(buildWatchGroupRow(g.items));
      } else {
        list.appendChild(buildWatchRow(g.item));
      }
    });
    card.appendChild(list);
    return card;
  }

  // Collapsed group row: summary + expand toggle revealing individual rows.
  function buildWatchGroupRow(items) {
    const wrap = el('div', 'bb-watch-group');
    const head = el('div', 'bb-watch-row bb-watch-group-head');
    const first = items[0];

    // Avatar (same as single row)
    const avatar = makeWatchAvatar(first);
    head.appendChild(avatar);

    const meta = el('div', 'bb-watch-meta');
    meta.appendChild(el('div', 'bb-watch-title', first.channel || ''));
    const sub = el('div', 'bb-watch-channel-line');
    sub.appendChild(el('span', 'bb-watch-channel',
      items.length + ' videos'));
    if (first.ts) {
      sub.appendChild(el('span', 'bb-watch-sep', '·'));
      sub.appendChild(el('span', 'bb-watch-time', 'most recent: ' + relativeTime(first.ts)));
    }
    meta.appendChild(sub);
    head.appendChild(meta);

    // Read-only category chip — the per-item dropdown lives in the expand.
    const chipColor = (window.BB_MOCK && window.BB_MOCK.colorFor(first.category)) || '#6B7280';
    const chip = el('span', 'bb-watch-group-chip', first.category || '—');
    chip.style.background = chipColor + '22';
    chip.style.color = chipColor;
    chip.style.borderColor = chipColor + '55';
    head.appendChild(chip);

    wrap.appendChild(head);

    // Expand toggle
    const expand = el('div', 'bb-watch-group-expand');
    const toggle = el('button', 'bb-watch-group-toggle');
    let open = false;
    const apply = () => {
      expand.classList.toggle('bb-expanded', open);
      toggle.textContent = open
        ? 'Hide individual videos ↑'
        : 'Show all ' + items.length + ' ↓';
      toggle.setAttribute('aria-expanded', String(open));
    };
    apply();
    toggle.addEventListener('click', () => { open = !open; apply(); });
    wrap.appendChild(toggle);

    items.forEach(it => expand.appendChild(buildWatchRow(it)));
    wrap.appendChild(expand);

    return wrap;
  }

  // Build the avatar element for a single watch (used by both row and group).
  function makeWatchAvatar(w) {
    if (w.avatar) {
      const img = document.createElement('img');
      img.className = 'bb-watch-avatar';
      img.src = w.avatar;
      img.referrerPolicy = 'no-referrer';
      img.alt = '';
      img.addEventListener('error', () => {
        const fb = el('span', 'bb-watch-avatar bb-empty', (w.channel || '?').charAt(0).toUpperCase());
        img.replaceWith(fb);
      });
      return img;
    }
    return el('span', 'bb-watch-avatar bb-empty', (w.channel || '?').charAt(0).toUpperCase());
  }

  // Single watch row builder — extracted from the previous inline forEach so
  // it can be reused by groups in their expanded state.
  function buildWatchRow(w) {
    const row = el('div', 'bb-watch-row');
    row.appendChild(makeWatchAvatar(w));

    const meta = el('div', 'bb-watch-meta');
    // E2 — title is an <a> opening the video in a new tab. Better affordance
    // (cursor + underline on hover) and correct semantics for screen readers
    // (C07 slide 29 — linear sequence reading).
    const titleEl = w.id ? document.createElement('a') : el('div');
    titleEl.className = 'bb-watch-title';
    titleEl.title = w.title;
    titleEl.textContent = w.title;
    if (w.id) {
      titleEl.href = 'https://www.youtube.com/watch?v=' + encodeURIComponent(w.id);
      titleEl.target = '_blank';
      titleEl.rel = 'noopener noreferrer';
    }
    meta.appendChild(titleEl);

    // Channel + relative timestamp on the same line so they read as one unit
    // (C02 Proximity slide 21).
    const channelLine = el('div', 'bb-watch-channel-line');
    channelLine.appendChild(el('span', 'bb-watch-channel', w.channel || ''));
    if (w.ts) {
      channelLine.appendChild(el('span', 'bb-watch-sep', '·'));
      channelLine.appendChild(el('span', 'bb-watch-time', relativeTime(w.ts)));
    }
    meta.appendChild(channelLine);
    row.appendChild(meta);

    // Category select — user-pickable categories. Conspiracy and
    // Misinformation are intentionally hidden here: a participant will never
    // self-identify a video as such, but the auto-detector still flags them
    // when confident.
    const HIDDEN_FROM_DROPDOWN = new Set(['Conspiracy', 'Misinformation']);
    const select = document.createElement('select');
    select.className = 'bb-watch-category';
    const options = [{ value: '', label: '— uncategorized —' }];
    Object.keys(CATEGORY_PALETTE)
      .filter(k => k !== 'Other' && !HIDDEN_FROM_DROPDOWN.has(k))
      .forEach(k => options.push({ value: k, label: k }));
    options.push({ value: 'Other', label: 'Other' });
    if (w.category && HIDDEN_FROM_DROPDOWN.has(w.category)) {
      options.unshift({ value: w.category, label: w.category + ' (auto)' });
    }
    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      if ((w.category || '') === o.value) opt.selected = true;
      select.appendChild(opt);
    });
    const palette = CATEGORY_PALETTE[w.category] || CATEGORY_PALETTE.Other;
    select.style.borderColor = palette.color;
    select.style.color = w.category ? palette.color : '';
    if (w.editedByUser) select.title = 'Edited by you';

    select.addEventListener('change', (e) => {
      const newCat = e.target.value || null;
      window.BBStats && window.BBStats.updateCategory(w.id, newCat);
      const p = CATEGORY_PALETTE[newCat] || CATEGORY_PALETTE.Other;
      select.style.borderColor = p.color;
      select.style.color = newCat ? p.color : '';
      // Glow the row in the new category colour to confirm the change
      // (C09 microinteraction — feedback completes the action loop).
      row.style.setProperty('--bb-glow-color', p.color + '33'); // ~20% alpha
      row.classList.remove('bb-just-reclassified');
      void row.offsetWidth;
      row.classList.add('bb-just-reclassified');
    });

    row.appendChild(select);
    return row;
  }

  // Compatibility shim built from BB_MOCK.categoryColors at module init.
  // Single source of truth lives in mock-data.js — changing a hue there
  // propagates everywhere automatically.
  const CATEGORY_PALETTE = (function () {
    const colors = (window.BB_MOCK && window.BB_MOCK.categoryColors) || {};
    const out = {};
    Object.keys(colors).forEach(cat => {
      out[cat] = { color: colors[cat], tags: [{ text: cat, color: colors[cat] }] };
    });
    return out;
  })();

  // Merge live feed stats into the mock structure. Falls back to mock when the
  // feed hasn't been classified yet.
  function buildLiveData(mock, stats) {
    if (!stats || !stats.diet || stats.diet.length === 0) return mock;

    // Diet from feed counts. Keep the same color per category as the mock for
    // continuity; assign Other-grey if a new category appears.
    const mockByLabel = Object.fromEntries(mock.diet.map(d => [d.label, d]));
    const diet = stats.diet.map(d => {
      const palette = CATEGORY_PALETTE[d.label] || CATEGORY_PALETTE.Other;
      const previous = mockByLabel[d.label];
      return {
        label: d.label,
        percent: d.percent,
        delta: previous ? previous.delta : 0,
        color: palette.color
      };
    });

    // Use curated discovery candidates (channels the user is unlikely to
    // already see in their feed). Prioritise underrepresented categories.
    const watched = (stats && stats.watchedChannels) || new Set();
    const channels = pickCuratedChannels(diet, watched);

    return {
      ...mock,
      diet,
      newChannels: channels.length > 0 ? channels : mock.newChannels
    };
  }

  // Compute the "Suggested because…" line for a curated suggestion.
  // The phrasing reflects WHY the algorithm picked this — addresses F1
  // (users don't understand why something was recommended).
  function reasonForCurated(category, diet) {
    if (!diet || diet.length === 0) {
      return 'Suggested to discover ' + category;
    }
    const total = diet.reduce((s, d) => s + (d.percent || 0), 0) || 100;
    const entry = diet.find(d => d.label === category);
    const share = entry ? (entry.percent || 0) : 0;
    if (share === 0) {
      return 'You don\'t watch any ' + category + ' yet — try this for variety';
    }
    if (share / total < 0.10) {
      return 'Diversify your ' + category + ' consumption';
    }
    if (share / total > 0.30) {
      return 'Because you watch a lot of ' + category;
    }
    return 'Recommended ' + category + ' channel';
  }

  // Reason for channels surfaced from the user's own watch history (channels
  // they started watching this week and weren't watching last week).
  function reasonForDiscovered(category) {
    return category
      ? 'New ' + category + ' channel you started watching this week'
      : 'New channel you started watching this week';
  }

  // Pick up to 6 curated channels from underrepresented categories. We rank
  // categories by ASCENDING share in the user's diet (so the smallest
  // category gets first pick), then round-robin one channel per category.
  function pickCuratedChannels(diet, watched) {
    const curated = (window.BB_MOCK && window.BB_MOCK.curatedChannels) || {};
    const dietByLabel = {};
    diet.forEach(d => { dietByLabel[d.label] = d.percent; });

    const allCats = Object.keys(curated);
    // Order: low-share first, missing-from-diet first.
    const ordered = allCats.sort((a, b) => {
      const sa = dietByLabel[a] != null ? dietByLabel[a] : -1;
      const sb = dietByLabel[b] != null ? dietByLabel[b] : -1;
      return sa - sb;
    });

    // Round-robin: take 1 channel from each cat in priority order, then loop.
    const out = [];
    const seenNames = new Set();
    const cursors = {};
    let rounds = 0;
    while (out.length < 6 && rounds < 4) {
      let added = false;
      for (const cat of ordered) {
        if (out.length >= 6) break;
        const list = curated[cat] || [];
        const cursor = cursors[cat] || 0;
        if (cursor >= list.length) continue;
        const ch = list[cursor];
        cursors[cat] = cursor + 1;
        if (watched.has(ch.name) || seenNames.has(ch.name)) continue;
        const palette = CATEGORY_PALETTE[cat] || CATEGORY_PALETTE.Other;
        seenNames.add(ch.name);
        // Public service that resolves a YouTube handle to its avatar.
        // The <img> error handler in buildChannelRow gracefully falls back
        // to a colored-initial circle if unavatar fails.
        const handleNoAt = ch.handle ? ch.handle.replace(/^@/, '') : '';
        const avatarUrl = handleNoAt
          ? 'https://unavatar.io/youtube/' + encodeURIComponent(handleNoAt) + '?fallback=false'
          : null;
        out.push({
          name: ch.name,
          avatar: avatarUrl,
          tags: palette.tags,
          color: palette.color,
          handle: ch.handle,
          category: cat,
          reason: reasonForCurated(cat, diet)
        });
        added = true;
      }
      if (!added) break;
      rounds++;
    }
    return out;
  }

  // Convert real watch stats (BBStats.getStats()) into the same shape we feed
  // to the renderer. Used when we have enough real data; otherwise we fall
  // back to the live feed snapshot, then to the mock.
  function buildFromWatchStats(mock, real) {
    const palette = CATEGORY_PALETTE;
    const diet = real.diet.map(d => ({
      label: d.label,
      percent: d.percent,
      delta: d.delta,
      color: (palette[d.label] || palette.Other).color
    }));
    const channels = real.newChannels.slice(0, 6).map(c => {
      const p = palette[c.category] || palette.Other;
      return {
        name: c.name,
        avatar: c.avatar,
        tags: p.tags,
        color: p.color,
        channelUrl: c.channelUrl || null,
        category: c.category || null,
        reason: reasonForDiscovered(c.category)
      };
    });
    return {
      ...mock,
      diet,
      newChannels: channels.length > 0 ? channels : mock.newChannels,
      vsLastWeek: real.vsLastWeek,
      diversity: real.diversity,
      dateRange: real.dateRange,
      source: 'watch',
      watchCount: real.watchCount,
      firstWeek: !!real.firstWeek
    };
  }

  function buildHeaderWithSource(data) {
    const header = buildHeader(data);
    if (data.source === 'watch' && data.watchCount) {
      const sub = el('div', 'bb-mirror-subtitle',
        'Based on ' + data.watchCount + ' video' + (data.watchCount > 1 ? 's' : '') + ' watched this week');
      header.parentNode && header.parentNode.insertBefore(sub, header.nextSibling);
      // Will actually be inserted after we append header; handled below.
    }
    return header;
  }

  function buildModal(mutedSet, watchStats, watchedChannels, recentList) {
    const mock = window.BB_MOCK.weeklyMirror;
    const feedStatsRaw = window.BBFeedFilter ? window.BBFeedFilter.getFeedStats() : null;
    const isReady  = !!(watchStats && watchStats.ready);
    const watchCountSoFar = (watchStats && watchStats.watchCount) || 0;
    const minNeeded = (watchStats && watchStats.minSamples) || 5;

    let data;
    if (!isReady) {
      // Not enough watch history yet — show progress empty state so the user
      // knows how close they are to unlocking the real Mirror. Avoids the
      // ambiguous "is this real?" feeling of mock-mixed-with-feed estimates.
      data = {
        source: 'empty',
        watchCount: watchCountSoFar,
        minSamples: minNeeded,
        dateRange: (watchStats && watchStats.dateRange) || null
      };
    } else {
      data = buildFromWatchStats(mock, watchStats);
      // The "NEW CHANNELS TO EXPLORE" section must show channels the user is
      // NOT already watching — otherwise the title lies. We always prefer
      // curated suggestions filtered by the user's watched set; only fall
      // back to "discovered this week" framing if curated runs dry.
      const watchedSet = watchedChannels || new Set();
      const curated = pickCuratedChannels(data.diet, watchedSet);
      if (curated.length > 0) {
        data.newChannels = curated;
      }
      // else: keep data.newChannels from buildFromWatchStats as a fallback
      // (channels the user just started watching this week — still useful).
    }

    backdrop = el('div', 'bb-backdrop');
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    const modal = el('div', 'bb-mirror');
    modal.appendChild(buildHeader(data));

    // Empty state — not enough watches yet. Show how close the user is and
    // surface the Recent Watches list (if any) so progress feels tangible.
    if (data.source === 'empty') {
      const cnt = data.watchCount;
      const need = data.minSamples;
      const remaining = Math.max(0, need - cnt);
      const subText = cnt === 0
        ? 'Watch a few YouTube videos to unlock your real Mirror.'
        : 'You\'ve watched ' + cnt + ' video' + (cnt > 1 ? 's' : '') + ' this week · ' + remaining + ' more to unlock your real stats.';
      modal.appendChild(el('div', 'bb-mirror-subtitle', subText));
      modal.appendChild(buildEmptyState(cnt, need));
      // If the user has watched 1-4 videos, surface them so they can already
      // experiment with reclassification (DG3 control on day 1).
      if (recentList && recentList.length > 0) {
        modal.appendChild(buildRecentWatches(recentList));
      }
      backdrop.appendChild(modal);
      return backdrop;
    }

    // Subtitle: combines the source signal with the date range so the user
    // sees both "where do these numbers come from" and "what window is this".
    // C02 Visibility of system status (Nielsen #1).
    let subText;
    if (data.source === 'watch') {
      const n = data.watchCount;
      subText = 'Based on ' + n + ' video' + (n > 1 ? 's' : '') + ' watched · ' + (data.dateRange || 'this week');
    } else if (data.source === 'feed') {
      subText = 'Estimated from your current feed · keep watching to build a real history';
    } else {
      subText = 'Sample data — your real diet will appear here once you watch a few videos';
    }
    modal.appendChild(el('div', 'bb-mirror-subtitle', subText));

    const grid = el('div', 'bb-mirror-grid');
    grid.appendChild(buildDiet(data.diet, mutedSet, { firstWeek: !!data.firstWeek, watchCount: data.watchCount || 0 }));
    grid.appendChild(buildDiversityScore(data.vsLastWeek, data.diversity));
    modal.appendChild(grid);

    modal.appendChild(buildChannels(data.newChannels));

    if (recentList && recentList.length > 0) {
      modal.appendChild(buildRecentWatches(recentList));
    }

    backdrop.appendChild(modal);
    return backdrop;
  }

  // Empty state — not enough watches yet. Shows progress bar so the user
  // knows exactly how close they are. C02 Visibility of system status +
  // C09 empty state pattern + C02 slide 38 Predictive aiding (clear next step).
  function buildEmptyState(watchCount, minSamples) {
    const cnt = watchCount || 0;
    const need = minSamples || 5;
    const remaining = Math.max(0, need - cnt);
    const isFresh = cnt === 0;

    const wrap = el('div', 'bb-empty-state');

    // Big visual: stylised plate-with-fork emoji + colourful chips behind
    const visual = el('div', 'bb-empty-visual');
    const plate = el('div', 'bb-empty-plate', isFresh ? '🍽️' : '🍳');
    visual.appendChild(plate);
    const chips = el('div', 'bb-empty-chips');
    ['tech', 'music', 'gaming', 'documentary', 'sports'].forEach(c => {
      const chip = el('span', 'bb-empty-chip');
      chip.style.background = 'var(--bb-cat-' + c + ')';
      chips.appendChild(chip);
    });
    visual.appendChild(chips);
    wrap.appendChild(visual);

    // Headline adapts to progress
    const headline = isFresh
      ? 'Your Diet is empty.'
      : (cnt === need - 1
          ? 'One more video to go!'
          : remaining + ' more videos to unlock');
    wrap.appendChild(el('h3', 'bb-empty-title', headline));

    // Body — instruction + value prop
    wrap.appendChild(el('p', 'bb-empty-body',
      'Watch ' + need + ' YouTube videos this week and your real Mirror unlocks — diet balance, diversity score, and personalised channel discoveries based on your actual history.'));

    // Progress indicator: N filled cells out of N — visual feedback that
    // converts an abstract threshold into a tangible goal (C02 Visibility).
    const progressWrap = el('div', 'bb-empty-progress');
    const progressLabel = el('div', 'bb-empty-progress-label',
      cnt + ' / ' + need + ' videos watched this week');
    progressWrap.appendChild(progressLabel);
    const progressBar = el('div', 'bb-empty-progress-bar');
    for (let i = 0; i < need; i++) {
      const cell = el('span', 'bb-empty-progress-cell' + (i < cnt ? ' bb-filled' : ''));
      progressBar.appendChild(cell);
    }
    progressWrap.appendChild(progressBar);
    wrap.appendChild(progressWrap);

    // Action row
    const actions = el('div', 'bb-empty-actions');
    const watchBtn = el('button', 'bb-empty-cta',
      isFresh ? 'Browse YouTube ↗' : 'Keep watching ↗');
    watchBtn.addEventListener('click', () => {
      window.open('https://www.youtube.com', '_blank', 'noopener');
    });
    actions.appendChild(watchBtn);
    const tourBtn = el('button', 'bb-empty-secondary', 'Replay the tour');
    tourBtn.addEventListener('click', () => {
      close();
      setTimeout(() => {
        window.BBWarmWelcome && window.BBWarmWelcome.open();
      }, 100);
    });
    actions.appendChild(tourBtn);
    wrap.appendChild(actions);

    return wrap;
  }

  function open() {
    if (backdrop && document.body.contains(backdrop)) return;
    loadMuted((mutedSet) => {
      const finish = (watchStats, watchedChannels, recent) => {
        document.body.appendChild(buildModal(mutedSet, watchStats, watchedChannels, recent));
        document.addEventListener('keydown', onEsc);
      };
      if (window.BBStats) {
        window.BBStats.getStats((watchStats) => {
          window.BBStats.getWatchedChannels((watched) => {
            window.BBStats.recentWatches(8, (recent) => finish(watchStats, watched, recent));
          });
        });
      } else {
        finish(null, new Set(), []);
      }
    });
  }

  function close() {
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    backdrop = null;
    document.removeEventListener('keydown', onEsc);
  }

  function onEsc(e) {
    if (e.key === 'Escape') close();
  }

  return { open, close };
})();
