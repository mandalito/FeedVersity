// Single source of truth for category classification.
// Used by feed-filter (to hide cards) and watch-tracker (to label watches).
//
// Strategy:
//   1. Strong channel signals (e.g. YouTube's auto "- Topic" music channels,
//      VEVO, "Records" labels) win immediately — they don't depend on the
//      title containing a keyword.
//   2. Otherwise fall back to keyword matching against title + channel,
//      using BB_MOCK.categoryKeywords.
window.BBClassifier = (function () {
  function channelSignal(channel) {
    if (!channel) return null;
    const c = channel.toLowerCase().trim();

    // Music — strongest signals first
    if (/\s-\s*topic$/.test(c)) return 'Music';
    if (/vevo$/.test(c)) return 'Music';
    if (/\b(records|recordings|music\s*group|music\s*official|sound\s*official|sound\s*records)\b/.test(c)) return 'Music';

    // News outlets
    if (/(le\s+monde|le\s+figaro|liberation|mediapart|france\s*24|france\s*info|bfmtv|tf1\s*info|cnn|fox\s*news|msnbc|bbc\s*news|al\s*jazeera|reuters|euronews|sky\s*news|the\s*guardian|nyt\s*|new\s*york\s*times|wapo|washington\s*post)/.test(c)) {
      return 'News';
    }

    // Sports
    if (/(espn|sky\s*sport|bein\s*sport|canal\s*sport|rmc\s*sport|eurosport|nba\s*official|fifa\s*official|uefa|la\s*liga|premier\s*league|f1)/.test(c)) {
      return 'Sports';
    }

    // Gaming
    if (/(gaming|playthrough|games?\s*official|let'?s\s*play|esports?|twitch\s*highlights|nintendo\s*official|playstation|xbox|riot\s*games|blizzard|hearthstone|league\s*of\s*legends|valorant\s*official|epic\s*games)/.test(c)) {
      return 'Gaming';
    }

    // Finance
    if (/(finance|investing|bloomberg|wsj|cnbc|coin\s*bureau|coin\s*desk|trading|bourse)/.test(c)) {
      return 'Finance';
    }

    // Tech
    if (/(tech\s*review|techlinked|linus\s*tech|mkbhd|fireship|the\s*verge|engadget|wired|9to5)/.test(c)) {
      return 'Tech';
    }

    // Documentary
    if (/(arte|national\s*geographic|nat\s*geo|bbc\s*earth|discovery|history\s*channel|smithsonian|imineo|planete\+|planete\s*plus)/.test(c)) {
      return 'Documentary';
    }

    // Education
    if (/(crash\s*course|khan\s*academy|kurzgesagt|veritasium|3blue1brown|numberphile|computerphile|mit\s*ocw|mit\s*opencourseware|stanford\s*online|coursera|edx)/.test(c)) {
      return 'Education';
    }

    return null;
  }

  function classify(title, channel, description) {
    const sig = channelSignal(channel);
    if (sig) return sig;

    // Build haystack from title + channel + description (truncated). Description
    // is heavily weighted toward the first ~500 chars to avoid false positives
    // from generic disclaimers/affiliate links at the end of long descriptions.
    const desc = (description || '').slice(0, 800);
    const haystack = ((title || '') + ' ' + (channel || '') + ' ' + desc).toLowerCase();
    if (!haystack.trim()) return null;
    const map = (window.BB_MOCK && window.BB_MOCK.categoryKeywords) || {};
    for (const cat of Object.keys(map)) {
      const kws = map[cat];
      for (let i = 0; i < kws.length; i++) {
        if (haystack.includes(kws[i].toLowerCase())) return cat;
      }
    }
    return null;
  }

  return { classify };
})();
