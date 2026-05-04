// Small floating indicator pill that appears top-right when at least one
// feed video has been hidden by BubbleBreak. Lets the user toggle a session
// override to see what was hidden, without having to reopen the Mirror.
window.BBFeedIndicator = (function () {
  let pill = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function render(state) {
    const { hiddenCount, mutedCategories, override } = state;

    // Nothing muted at all — remove.
    if (!mutedCategories.length) {
      if (pill && pill.parentNode) pill.parentNode.removeChild(pill);
      pill = null;
      return;
    }

    if (!pill) {
      pill = el('div', 'bb-feed-indicator');
      document.body.appendChild(pill);
    }

    while (pill.firstChild) pill.removeChild(pill.firstChild);

    const icon = el('span', 'bb-feed-indicator-icon', override ? '👁' : '🔇');
    pill.appendChild(icon);

    let label;
    if (override) {
      label = 'Showing all videos this session';
    } else if (hiddenCount === 0) {
      label = mutedCategories.join(', ') + ' muted — 0 hidden here';
    } else {
      label = hiddenCount + ' video' + (hiddenCount > 1 ? 's' : '') + ' hidden by Feedversity';
    }
    pill.appendChild(el('span', 'bb-feed-indicator-text', label));

    if (hiddenCount > 0 || override) {
      const action = el('button', 'bb-feed-indicator-action', override ? 'Hide again' : 'Show');
      action.addEventListener('click', () => {
        window.BBFeedFilter && window.BBFeedFilter.setSessionOverride(!override);
      });
      pill.appendChild(action);
    }
  }

  function start() {
    if (!window.BBFeedFilter) return;
    window.BBFeedFilter.onChange(render);
  }

  return { start };
})();
