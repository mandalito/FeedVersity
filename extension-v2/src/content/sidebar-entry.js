// Inject a "Feedversity" entry into YouTube's left sidebar.
//
// We append into the items list of the first section, alongside Home/Shorts/
// Subscriptions, instead of inserting a foreign <div> as a sibling of
// <ytd-guide-section-renderer>. The latter breaks Polymer's internal section
// tracking and causes YouTube to drop the Subscriptions section.
window.BBSidebarEntry = (function () {
  function makeDot() {
    const dot = document.createElement('span');
    dot.className = 'bb-logo-dot';
    return dot;
  }

  function buildFull() {
    const el = document.createElement('div');
    el.className = 'bb-sidebar-entry';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Open Feedversity Weekly Mirror');
    el.appendChild(makeDot());
    const label = document.createElement('span');
    label.textContent = 'Feedversity';
    el.appendChild(label);
    el.addEventListener('click', () => {
      window.BBWeeklyMirror && window.BBWeeklyMirror.open();
    });
    return el;
  }

  function buildMini() {
    const el = document.createElement('div');
    el.className = 'bb-sidebar-entry-mini';
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Open Feedversity Weekly Mirror');
    el.appendChild(makeDot());
    const label = document.createElement('span');
    label.textContent = 'Feed';
    el.appendChild(label);
    el.addEventListener('click', () => {
      window.BBWeeklyMirror && window.BBWeeklyMirror.open();
    });
    return el;
  }

  function tryInject() {
    // Full guide: insert as the first item INSIDE the first section's items
    // list (so it sits above Home, but stays within YouTube's expected
    // section structure).
    const firstItems = document.querySelector(
      'ytd-guide-renderer #sections > ytd-guide-section-renderer:first-of-type #items'
    );
    if (firstItems && !firstItems.querySelector(':scope > .bb-sidebar-entry')) {
      firstItems.insertBefore(buildFull(), firstItems.firstChild);
    }

    // Mini guide (collapsed sidebar).
    const miniHost = document.querySelector('ytd-mini-guide-renderer #items');
    if (miniHost && !miniHost.querySelector(':scope > .bb-sidebar-entry-mini')) {
      miniHost.insertBefore(buildMini(), miniHost.firstChild);
    }
  }

  function start() {
    tryInject();
    // Throttled re-injection — YouTube re-renders the guide on SPA nav.
    let scheduled = null;
    const obs = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = null;
        tryInject();
      });
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  return { start };
})();
