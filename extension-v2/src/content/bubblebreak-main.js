// Entry point. Runs after all feature modules have registered themselves on
// `window`. We wait for document.body and YouTube's main app shell before
// mounting, then listen for messages from the extension action button.
(function () {
  function boot() {
    if (!document.body) {
      requestAnimationFrame(boot);
      return;
    }
    window.BBFloatingButton.mount();
    window.BBSidebarEntry.start();
    window.BBBanner.start();
    window.BBWhyThisVideo.start();
    window.BBFeedFilter.start();
    window.BBWatchTracker && window.BBWatchTracker.start();

    // Pipe filter state into the dynamic island so the user gets a live
    // hidden-count cue right where the smiley is.
    if (window.BBFeedFilter && window.BBFeedFilter.onChange) {
      window.BBFeedFilter.onChange((state) => {
        window.BBFloatingButton.setHiddenCount(state.hiddenCount);
      });
    }

    // Recompute diversity (number of distinct categories watched in the last
    // 7 days) and refresh the island's evolving icon. Falls back to current
    // feed snapshot diversity when there's no watch history yet.
    function refreshDiversity() {
      const fallback = () => {
        const fs = window.BBFeedFilter && window.BBFeedFilter.getFeedStats();
        const n = fs && fs.diet ? fs.diet.length : 0;
        window.BBFloatingButton.setDiversity(n);
      };
      if (window.BBStats) {
        window.BBStats.getStats((s) => {
          if (s && s.diet) window.BBFloatingButton.setDiversity(s.diet.length);
          else fallback();
        });
      } else {
        fallback();
      }
    }
    refreshDiversity();

    // Flash the island whenever a watch is recorded; refresh diversity too.
    window.addEventListener('bb-watch-recorded', (e) => {
      window.BBFloatingButton.flashTracked(e.detail);
      refreshDiversity();
    });
    // Periodic refresh in case the user mutes a category from the Mirror
    // (which doesn't fire bb-watch-recorded).
    setInterval(refreshDiversity, 15000);

    // Auto-open Warm Welcome on the first YouTube page load after install,
    // unless the user has already seen it. This catches the case where the
    // background-script install message landed on a tab that didn't yet have
    // the content script ready. Idempotent thanks to BBWarmWelcome.wasSeen().
    if (window.BBWarmWelcome && window.BBWarmWelcome.maybeAutoOpen) {
      // Small delay so the YouTube DOM has time to settle and our other UI
      // mounts first — the welcome modal sits on top.
      setTimeout(() => window.BBWarmWelcome.maybeAutoOpen(), 1200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === 'BB_TOGGLE_MIRROR') {
      window.BBWeeklyMirror && window.BBWeeklyMirror.open();
    } else if (msg.type === 'BB_OPEN_WARM_WELCOME') {
      window.BBWarmWelcome && window.BBWarmWelcome.open();
    }
  });
})();
