// Watch tracker — records each video the user opens to /watch?v=XYZ.
// Persists to chrome.storage.local via BBStats so the Weekly Mirror can show
// diet/deltas/discovered-channels derived from real history.
//
// Selectors are inspired by the previous extension's video-tracker.js so we
// inherit its battle-tested fallback chain for title/channel/avatar across
// YouTube layouts.
window.BBWatchTracker = (function () {
  const SETTLE_MS = 2000; // wait for metadata to render before extracting
  let lastTrackedId = null;
  let pendingTimer = null;

  function videoIdFromUrl() {
    if (location.pathname !== '/watch') return null;
    return new URLSearchParams(location.search).get('v');
  }

  function pickText(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim()) {
        return el.textContent.trim();
      }
    }
    return '';
  }

  function extractTitle() {
    const t = pickText([
      'h1.ytd-watch-metadata yt-formatted-string',
      'h1.ytd-watch-metadata',
      'ytd-watch-metadata h1',
      '#title h1 yt-formatted-string',
      '#title h1'
    ]);
    if (t) return t;
    // Fallback to <meta> / document.title
    const meta = document.querySelector('meta[name="title"]');
    if (meta && meta.content) return meta.content.trim();
    return (document.title || '').replace(/\s*-\s*YouTube\s*$/, '').trim();
  }

  function extractChannel() {
    return pickText([
      'ytd-watch-metadata ytd-channel-name yt-formatted-string a',
      'ytd-watch-metadata #channel-name a',
      'ytd-video-owner-renderer ytd-channel-name a',
      'ytd-video-owner-renderer #channel-name yt-formatted-string a',
      '#owner ytd-channel-name a',
      '#owner #channel-name a',
      'ytd-watch-metadata ytd-channel-name yt-formatted-string',
      'ytd-channel-name yt-formatted-string',
      '#channel-name yt-formatted-string'
    ]);
  }

  function extractChannelUrl() {
    const a = document.querySelector(
      'ytd-watch-metadata ytd-channel-name a, ytd-video-owner-renderer a, #owner a'
    );
    return a && a.href ? a.href : '';
  }

  function extractChannelAvatar() {
    const img = document.querySelector(
      'ytd-video-owner-renderer #avatar img, #owner #avatar img, #owner img.style-scope.yt-img-shadow'
    );
    return img && img.src ? img.src : '';
  }

  // Description text — used as a third signal for the keyword classifier.
  // YouTube ships boilerplate strings ("Profitez des vidéos...") in the
  // og:description meta which we filter out.
  function extractDescription() {
    const candidates = [
      'ytd-watch-metadata #description-inner ytd-text-inline-expander yt-attributed-string',
      'ytd-watch-metadata #description yt-attributed-string',
      '#description-inline-expander yt-attributed-string',
      '#description ytd-text-inline-expander',
      '#description #attributed-snippet-text yt-attributed-string',
      '#attributed-snippet-text',
      '#description-inner',
      'ytd-expander #content'
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      const t = el && el.textContent && el.textContent.trim();
      if (t && t.length > 20
          && !t.startsWith('Profitez des vidéos')
          && !t.startsWith('Enjoy the videos')) {
        return t;
      }
    }
    const og = document.querySelector('meta[property="og:description"]');
    if (og && og.content
        && !og.content.startsWith('Profitez des vidéos')
        && !og.content.startsWith('Enjoy the videos')) {
      return og.content;
    }
    return '';
  }

  // YouTube ships every video with one of ~15 official categories. We read
  // the canonical value from <meta itemprop="genre"> (set by YouTube on every
  // watch page) and fall back to parsing ytInitialPlayerResponse if needed.
  // This is way more reliable than keyword matching titles.
  const YOUTUBE_CATEGORY_MAP = {
    'Music': 'Music',
    'Gaming': 'Gaming',
    'Sports': 'Sports',
    'Education': 'Education',
    'Entertainment': 'Entertainment',
    'Comedy': 'Entertainment',
    'Film & Animation': 'Entertainment',
    'News & Politics': 'Politics',
    'Howto & Style': 'Lifestyle',
    'Travel & Events': 'Lifestyle',
    'Pets & Animals': 'Lifestyle',
    'Autos & Vehicles': 'Lifestyle',
    'Science & Technology': 'Tech',
    'People & Blogs': 'Vlogs',
    'Nonprofits & Activism': 'Politics'
  };

  function extractYouTubeGenre() {
    // 1. Fast path — meta tag set by YouTube.
    const meta = document.querySelector('meta[itemprop="genre"]');
    if (meta && meta.content && meta.content.trim()) {
      return meta.content.trim();
    }
    // 2. Fallback — parse ytInitialPlayerResponse from inline scripts.
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const txt = s.textContent;
      if (!txt || txt.indexOf('ytInitialPlayerResponse') === -1) continue;
      // Match the JSON literal up to the matching closing brace. We use a
      // greedy match terminated by `;</script>` or `;var ` which YouTube
      // emits right after the assignment.
      const start = txt.indexOf('ytInitialPlayerResponse');
      const eq = txt.indexOf('=', start);
      if (eq === -1) continue;
      const open = txt.indexOf('{', eq);
      if (open === -1) continue;
      // Walk braces to find the matching close.
      let depth = 0, inStr = false, esc = false, end = -1;
      for (let i = open; i < txt.length; i++) {
        const c = txt[i];
        if (inStr) {
          if (esc) esc = false;
          else if (c === '\\') esc = true;
          else if (c === '"') inStr = false;
          continue;
        }
        if (c === '"') { inStr = true; continue; }
        if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end === -1) continue;
      try {
        const data = JSON.parse(txt.slice(open, end + 1));
        const cat = data && data.microformat && data.microformat.playerMicroformatRenderer
          && data.microformat.playerMicroformatRenderer.category;
        if (cat) return cat;
      } catch (_) { /* try next script */ }
    }
    return null;
  }

  function classifyWithMetadata(title, channel, description) {
    const ytGenre = extractYouTubeGenre();
    if (ytGenre) {
      const mapped = YOUTUBE_CATEGORY_MAP[ytGenre];
      if (mapped) {
        // News & Politics is one YouTube bucket but we expose two. Disambiguate
        // via channel signal (e.g. CNN, BFMTV → News) when available.
        if (ytGenre === 'News & Politics' && window.BBClassifier) {
          const sig = window.BBClassifier.classify('', channel, '');
          if (sig === 'News') return { category: 'News', source: 'youtube+channel' };
        }
        return { category: mapped, source: 'youtube' };
      }
    }
    const fallback = window.BBClassifier ? window.BBClassifier.classify(title, channel, description) : null;
    return { category: fallback, source: fallback ? 'keyword' : 'none' };
  }

  function extractData(id) {
    const title = extractTitle();
    const channel = extractChannel();
    if (!title) return null; // not hydrated yet
    const description = extractDescription();
    const cls = classifyWithMetadata(title, channel, description);
    return {
      id,
      title,
      channel,
      channelUrl: extractChannelUrl(),
      avatar: extractChannelAvatar(),
      category: cls.category,
      categorySource: cls.source,
      ts: Date.now()
    };
  }

  function tryTrack() {
    const id = videoIdFromUrl();
    if (!id) return;
    if (id === lastTrackedId) return;

    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => {
      // Bail if user navigated away during settle window.
      if (videoIdFromUrl() !== id) return;
      const data = extractData(id);
      if (!data) {
        // Title still not loaded — try once more after another 2s.
        pendingTimer = setTimeout(() => {
          if (videoIdFromUrl() !== id) return;
          const data2 = extractData(id);
          if (!data2) return;
          lastTrackedId = id;
          window.BBStats && window.BBStats.record(data2);
          console.log('[BB-Tracker] tracked (retry):', data2);
        }, SETTLE_MS);
        return;
      }
      lastTrackedId = id;
      window.BBStats && window.BBStats.record(data);
      if (data.category) {
        console.log('[BB-Tracker] tracked as ' + data.category + ' (' + data.categorySource + '):', data.title, '· channel:', data.channel);
      } else {
        console.warn('[BB-Tracker] UNCLASSIFIED — title:', JSON.stringify(data.title), 'channel:', JSON.stringify(data.channel),
          '\n   → user can reclassify via the Recent Watches panel in the Mirror');
      }
    }, SETTLE_MS);
  }

  function start() {
    tryTrack();
    document.addEventListener('yt-navigate-finish', tryTrack);
    window.addEventListener('popstate', tryTrack);
  }

  return { start };
})();
