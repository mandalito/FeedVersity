// "Dynamic island" — bottom-right pill that combines:
//   • the smiley launcher (always visible, opens the Weekly Mirror)
//   • a live count of feed videos hidden by BubbleBreak
//   • a transient flash whenever a new watch is recorded by BBWatchTracker
//
// The pill sits collapsed (just the smiley) by default and expands when there
// is something to surface. Hovering the smiley always expands it to give a
// quick "what's BubbleBreak doing right now" cue.
window.BBFloatingButton = (function () {
  let pill = null;
  let smileyEl = null;
  let contentEl = null;
  let flashTimer = null;
  let currentHidden = 0;
  let currentDiversity = 0; // distinct categories — drives the evolving icon
  let isHovered = false;
  let inFlash = false;

  // Evolving icon: more categories = richer media diet.
  // Monotone (single ingredient) → Two flavors → Mixed → Varied → Rich.
  // Aligned with the food/Diet metaphor used throughout the extension.
  function iconForDiversity(n) {
    if (n <= 1) return { emoji: '🍞', label: 'Monotone' };
    if (n === 2) return { emoji: '🥪', label: 'Two flavors' };
    if (n === 3) return { emoji: '🥗', label: 'Mixed bowl' };
    if (n === 4) return { emoji: '🍱', label: 'Varied diet' };
    return { emoji: '🍲', label: 'Rich diet' };
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function ensureMounted() {
    if (pill && document.body.contains(pill)) return;
    pill = el('div', 'bb-island');
    pill.setAttribute('role', 'button');
    pill.setAttribute('aria-label', 'Open Feedversity Weekly Mirror');
    pill.title = 'Feedversity — click to open Weekly Mirror';

    smileyEl = el('div', 'bb-island-smiley', iconForDiversity(currentDiversity).emoji);
    pill.appendChild(smileyEl);

    contentEl = el('div', 'bb-island-content');
    pill.appendChild(contentEl);

    pill.addEventListener('click', () => {
      window.BBWeeklyMirror && window.BBWeeklyMirror.open();
    });
    pill.addEventListener('mouseenter', () => {
      isHovered = true;
      render();
    });
    pill.addEventListener('mouseleave', () => {
      isHovered = false;
      render();
    });

    document.body.appendChild(pill);
    render();
  }

  // Decide what the pill should display right now.
  function render() {
    if (!pill) return;
    while (contentEl.firstChild) contentEl.removeChild(contentEl.firstChild);
    pill.classList.remove('bb-island-flash');

    // Always reflect the latest diversity emoji.
    smileyEl.textContent = iconForDiversity(currentDiversity).emoji;
    smileyEl.title = iconForDiversity(currentDiversity).label
      + ' — ' + currentDiversity + ' categor' + (currentDiversity === 1 ? 'y' : 'ies') + ' watched';

    if (inFlash) return; // flash content set imperatively by flashTracked

    let label = '';
    if (isHovered) {
      label = iconForDiversity(currentDiversity).label;
      if (currentHidden > 0) label += ' · ' + currentHidden + ' hidden';
    } else if (currentHidden > 0) {
      label = currentHidden + ' hidden';
    }

    if (label) {
      contentEl.appendChild(document.createTextNode(label));
      pill.classList.add('bb-island-expanded');
    } else {
      pill.classList.remove('bb-island-expanded');
    }
  }

  function setHiddenCount(n) {
    currentHidden = n || 0;
    if (!inFlash) render();
  }

  // Flash a "✓ Tracked: <title>" pill for ~3s, then return to normal state.
  function flashTracked(video) {
    if (!pill) return;
    clearTimeout(flashTimer);
    inFlash = true;
    while (contentEl.firstChild) contentEl.removeChild(contentEl.firstChild);
    const check = el('span', 'bb-island-check', '✓');
    contentEl.appendChild(check);
    const title = (video && video.title) || 'video';
    const trimmed = title.length > 36 ? title.slice(0, 36) + '…' : title;
    contentEl.appendChild(document.createTextNode(' Tracked: ' + trimmed));
    pill.classList.add('bb-island-expanded', 'bb-island-flash');
    flashTimer = setTimeout(() => {
      inFlash = false;
      render();
    }, 3200);
  }

  function setDiversity(n) {
    const next = Math.max(0, n | 0);
    if (next === currentDiversity) return;
    currentDiversity = next;
    if (!inFlash) render();
  }

  return { mount: ensureMounted, setHiddenCount, flashTracked, setDiversity };
})();
