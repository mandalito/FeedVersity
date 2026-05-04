// Minimal service worker. Held for future state sync between tabs.
chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.local.set({
    bb_banner_dismissed_at: null,
    bb_mirror_seen_at: null
  });

  // Fresh install — broadcast a Warm Welcome trigger to any open YouTube tab.
  // Update / Chrome relaunch reasons are intentionally skipped: we don't want
  // to interrupt users with the onboarding every time we ship a patch.
  if (details && details.reason === 'install') {
    chrome.tabs.query({ url: '*://www.youtube.com/*' }, (tabs) => {
      tabs.forEach(t => {
        if (t.id) chrome.tabs.sendMessage(t.id, { type: 'BB_OPEN_WARM_WELCOME' });
      });
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'BB_TOGGLE_MIRROR' });
  }
});
