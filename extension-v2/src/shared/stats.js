// Watch history store + aggregation engine.
//
// Storage layout (chrome.storage.local):
//   bb_watches: [
//     { id, title, channel, channelUrl, avatar, category, ts },
//     ...
//   ]
//
// Cap: MAX_WATCHES (oldest entries trimmed when exceeded). At ~250B per
// record this stays under 250KB total.
window.BBStats = (function () {
  const STORAGE_KEY = 'bb_watches';
  const MAX_WATCHES = 1000;
  const MS_PER_DAY = 86400000;
  const WEEK_MS = 7 * MS_PER_DAY;
  // Skip dedupe if same video re-opened within this window.
  const DEDUPE_WINDOW_MS = 60_000;
  // Minimum samples in the current week before we surface real stats.
  // Aligned with Warm Welcome promise ("After 5 videos, your real Mirror unlocks").
  const MIN_SAMPLES = 5;

  function load(cb) {
    try {
      chrome.storage.local.get(STORAGE_KEY, (res) => {
        cb((res && res[STORAGE_KEY]) || []);
      });
    } catch (_) { cb([]); }
  }

  function save(watches, cb) {
    const trimmed = watches.length > MAX_WATCHES
      ? watches.slice(watches.length - MAX_WATCHES)
      : watches;
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: trimmed }, () => cb && cb());
    } catch (_) { cb && cb(); }
  }

  function record(video) {
    if (!video || !video.id) return;
    load((watches) => {
      const last = watches[watches.length - 1];
      if (last && last.id === video.id && (Date.now() - last.ts) < DEDUPE_WINDOW_MS) return;
      watches.push(video);
      save(watches, () => {
        // Notify the UI (dynamic island) that a new watch was recorded.
        try {
          window.dispatchEvent(new CustomEvent('bb-watch-recorded', { detail: video }));
        } catch (_) {}
      });
    });
  }

  function clear(cb) {
    try { chrome.storage.local.remove(STORAGE_KEY, () => cb && cb()); }
    catch (_) { cb && cb(); }
  }

  // ---------- Aggregation ----------
  function dietForRange(watches, startTs, endTs) {
    const counts = {};
    for (const w of watches) {
      if (w.ts >= startTs && w.ts < endTs && w.category) {
        counts[w.category] = (counts[w.category] || 0) + 1;
      }
    }
    return counts;
  }

  function uniqueChannelsInRange(watches, startTs, endTs) {
    const set = new Set();
    for (const w of watches) {
      if (w.ts >= startTs && w.ts < endTs && w.channel) set.add(w.channel);
    }
    return set;
  }

  function newChannelsThisWeek(watches, thisStart, thisEnd, lastStart) {
    const seenLast = uniqueChannelsInRange(watches, lastStart, thisStart);
    const out = [];
    const seen = new Set();
    // Most-recent-first so we feature freshly discovered channels.
    for (let i = watches.length - 1; i >= 0; i--) {
      const w = watches[i];
      if (w.ts < thisStart || w.ts >= thisEnd) continue;
      if (!w.channel || seenLast.has(w.channel) || seen.has(w.channel)) continue;
      seen.add(w.channel);
      out.push({
        name: w.channel,
        avatar: w.avatar || null,
        channelUrl: w.channelUrl || null,
        category: w.category || null
      });
      if (out.length >= 6) break;
    }
    return out;
  }

  function fmtMonthDay(d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate();
  }

  function formatRange(startTs, endTs) {
    const start = new Date(startTs);
    const end = new Date(endTs - 1);
    if (start.getMonth() === end.getMonth()) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[start.getMonth()] + ' ' + start.getDate() + ' – ' + end.getDate();
    }
    return fmtMonthDay(start) + ' – ' + fmtMonthDay(end);
  }

  function getStats(cb) {
    load((watches) => {
      const now = Date.now();
      const thisStart = now - WEEK_MS;
      const lastStart = now - 2 * WEEK_MS;

      const thisWeek = dietForRange(watches, thisStart, now);
      const lastWeek = dietForRange(watches, lastStart, thisStart);

      const total = Object.values(thisWeek).reduce((a, b) => a + b, 0);

      // Below threshold: still return a structured payload so the Mirror can
      // render a progress empty-state ("watched X/5") instead of guessing.
      if (total < MIN_SAMPLES) {
        return cb({
          ready: false,
          watchCount: total,
          watchCountTotal: watches.length,
          minSamples: MIN_SAMPLES,
          dateRange: formatRange(thisStart, now)
        });
      }

      const lastTotal = Object.values(lastWeek).reduce((a, b) => a + b, 0);

      const diet = Object.entries(thisWeek)
        .map(([label, count]) => {
          const thisPct = count * 100 / total;
          const lastPct = lastTotal > 0 ? (lastWeek[label] || 0) * 100 / lastTotal : thisPct;
          return {
            label,
            count,
            percent: Math.round(thisPct),
            delta: Math.round(thisPct - lastPct)
          };
        })
        .sort((a, b) => b.percent - a.percent);

      // Diversity proxy: number of distinct categories. Could swap for entropy.
      const thisCats = Object.keys(thisWeek).length;
      const lastCats = Object.keys(lastWeek).length;
      let direction, change, label, comparison;
      if (lastTotal === 0) {
        // No previous-week data — fall back to comparing against the average
        // YouTube user (mocked baseline in BB_MOCK.avgUserDiet).
        const avgDiet = (window.BB_MOCK && window.BB_MOCK.avgUserDiet) || {};
        const avgCats = Object.keys(avgDiet).length;
        if (thisCats > avgCats) {
          direction = 'broader';
          change = Math.round((thisCats - avgCats) * 100 / Math.max(avgCats, 1));
          label = 'broader than the average user';
        } else if (thisCats < avgCats) {
          direction = 'narrower';
          change = Math.round((avgCats - thisCats) * 100 / Math.max(avgCats, 1));
          label = 'narrower than the average user';
        } else {
          direction = 'broader';
          change = 0;
          label = 'as broad as the average user';
        }
        comparison = 'avg-user';
      } else if (thisCats > lastCats) {
        direction = 'broader';
        change = Math.round((thisCats - lastCats) * 100 / Math.max(lastCats, 1));
        label = 'broader than last week';
        comparison = 'last-week';
      } else if (thisCats < lastCats) {
        direction = 'narrower';
        change = Math.round((lastCats - thisCats) * 100 / Math.max(lastCats, 1));
        label = 'narrower than last week';
        comparison = 'last-week';
      } else {
        direction = 'broader';
        change = 0;
        label = 'as broad as last week';
        comparison = 'last-week';
      }

      // Expose raw category counts for the Diversity Score card so it can
      // render "X categories this week" + "↑ N more than last week (was Y)"
      // without re-deriving from percentages. avgCats is the avg-user baseline.
      const avgCatsCount = Object.keys((window.BB_MOCK && window.BB_MOCK.avgUserDiet) || {}).length;
      cb({
        ready: true,
        minSamples: MIN_SAMPLES,
        diet,
        newChannels: newChannelsThisWeek(watches, thisStart, now, lastStart),
        vsLastWeek: { direction, change, label, comparison },
        diversity: {
          thisCats,
          previousCats: lastTotal === 0 ? avgCatsCount : lastCats,
          comparison,           // 'last-week' | 'avg-user'
          isBroader: thisCats > (lastTotal === 0 ? avgCatsCount : lastCats)
        },
        watchCount: total,
        dateRange: formatRange(thisStart, now),
        totalStored: watches.length,
        firstWeek: lastTotal === 0
      });
    });
  }

  // Set of channel names the user has watched (any time, any category).
  // Used by the Mirror to filter candidate channels — we don't want to
  // suggest channels the user already watches as "new to explore".
  function getWatchedChannels(cb) {
    load((watches) => {
      const set = new Set();
      for (const w of watches) if (w.channel) set.add(w.channel);
      cb(set);
    });
  }

  // Last N watches, most-recent-first.
  function recentWatches(n, cb) {
    load((watches) => {
      const out = watches.slice(Math.max(0, watches.length - n));
      cb(out.reverse());
    });
  }

  // User-driven re-classification of a tracked watch. Updates the most
  // recent occurrence of the given video ID. We mark the entry so future
  // automatic re-runs don't overwrite the human decision.
  function updateCategory(videoId, newCategory) {
    if (!videoId) return;
    load((watches) => {
      let changed = false;
      for (let i = watches.length - 1; i >= 0; i--) {
        if (watches[i].id === videoId) {
          watches[i].category = newCategory || null;
          watches[i].editedByUser = true;
          changed = true;
          break;
        }
      }
      if (!changed) return;
      save(watches, () => {
        try {
          window.dispatchEvent(new CustomEvent('bb-watch-updated', {
            detail: { videoId, category: newCategory }
          }));
        } catch (_) {}
      });
    });
  }

  return { record, getStats, load, clear, getWatchedChannels, recentWatches, updateCategory };
})();
