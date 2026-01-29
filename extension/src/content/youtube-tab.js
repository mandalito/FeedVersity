// BubbleBreak YouTube Tab Injection
// Adds a "BubbleBreak" tab to YouTube's navigation

(function() {
  'use strict';

  let tabInjected = false;
  let dashboardVisible = false;
  let blackoutActive = false;

  // SVG icon for BubbleBreak (bubble/circle design matching YouTube style)
  const BUBBLEBREAK_ICON = `
    <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 24px; height: 24px; fill: currentColor;">
      <circle cx="12" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="17" cy="16" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="7" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="10" cy="8" r="1" fill="currentColor"/>
    </svg>
  `;

  // Create the BubbleBreak tab element
  function createBubbleBreakTab() {
    const tab = document.createElement('a');
    tab.id = 'bubblebreak-tab';
    tab.href = '#bubblebreak';
    tab.className = 'yt-simple-endpoint style-scope ytd-guide-entry-renderer';
    tab.style.cssText = 'display: flex !important; text-decoration: none !important;';
    tab.innerHTML = `
      <tp-yt-paper-item class="style-scope ytd-guide-entry-renderer" role="option" tabindex="0" style="display: flex !important; align-items: center !important; padding: 0 24px !important; height: 40px !important;">
        <yt-icon class="guide-icon style-scope ytd-guide-entry-renderer" style="margin-right: 24px !important; width: 24px !important; height: 24px !important; color: var(--yt-spec-text-primary, #f1f1f1) !important;">
          ${BUBBLEBREAK_ICON}
        </yt-icon>
        <span style="color: var(--yt-spec-text-primary, #f1f1f1) !important; font-size: 14px !important; font-family: 'Roboto', 'Arial', sans-serif !important; line-height: 20px !important;">BubbleBreak</span>
      </tp-yt-paper-item>
    `;
    
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDashboard();
    });

    return tab;
  }

  // Create mini dashboard tab for collapsed sidebar
  function createMiniTab() {
    const mini = document.createElement('a');
    mini.id = 'bubblebreak-mini-tab';
    mini.href = '#bubblebreak';
    mini.className = 'yt-simple-endpoint style-scope ytd-mini-guide-entry-renderer';
    mini.style.cssText = 'display: flex !important; flex-direction: column !important; align-items: center !important; text-decoration: none !important;';
    mini.innerHTML = `
      <tp-yt-paper-item class="style-scope ytd-mini-guide-entry-renderer" role="option" tabindex="0" style="display: flex !important; flex-direction: column !important; align-items: center !important; padding: 16px 0 14px !important;">
        <yt-icon class="guide-icon style-scope ytd-mini-guide-entry-renderer" style="margin-bottom: 6px !important; width: 24px !important; height: 24px !important; color: var(--yt-spec-text-primary, #f1f1f1) !important;">
          ${BUBBLEBREAK_ICON}
        </yt-icon>
        <span style="color: var(--yt-spec-text-secondary, #aaa) !important; font-size: 10px !important; font-family: 'Roboto', 'Arial', sans-serif !important; line-height: 1.2 !important; text-overflow: ellipsis !important; max-width: 64px !important; overflow: hidden !important; white-space: nowrap !important;">Bubble</span>
      </tp-yt-paper-item>
    `;
    
    mini.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDashboard();
    });

    return mini;
  }

  // Inject tabs into YouTube's navigation
  function injectTabs() {
    console.log('🫧 [BubbleBreak] Attempting to inject tabs...');
    
    // Don't re-inject if already present
    if (document.getElementById('bubblebreak-tab')) {
      console.log('🫧 [BubbleBreak] Tab already exists');
      return;
    }

    // Try multiple selectors for the main sidebar
    const sidebarSelectors = [
      'ytd-guide-section-renderer:first-of-type #items',
      'ytd-guide-renderer ytd-guide-section-renderer #items',
      '#guide-content ytd-guide-section-renderer #items',
      'tp-yt-app-drawer #guide-content #items'
    ];

    let sidebarItems = null;
    for (const selector of sidebarSelectors) {
      sidebarItems = document.querySelector(selector);
      if (sidebarItems) {
        console.log('🫧 [BubbleBreak] Found sidebar with selector:', selector);
        break;
      }
    }

    if (sidebarItems && !document.getElementById('bubblebreak-tab')) {
      const tab = createBubbleBreakTab();
      const wrapper = document.createElement('ytd-guide-entry-renderer');
      wrapper.className = 'style-scope ytd-guide-section-renderer';
      wrapper.style.cssText = 'display: block;';
      wrapper.appendChild(tab);
      
      // Insert at the beginning of the sidebar
      if (sidebarItems.firstChild) {
        sidebarItems.insertBefore(wrapper, sidebarItems.firstChild);
      } else {
        sidebarItems.appendChild(wrapper);
      }
      console.log('🫧 [BubbleBreak] Main tab injected successfully!');
      tabInjected = true;
    } else {
      console.log('🫧 [BubbleBreak] Sidebar not found, will retry...');
    }

    // Mini sidebar (collapsed) - try multiple selectors
    const miniSelectors = [
      'ytd-mini-guide-renderer #items',
      '#mini-guide #items'
    ];

    let miniGuide = null;
    for (const selector of miniSelectors) {
      miniGuide = document.querySelector(selector);
      if (miniGuide) break;
    }

    if (miniGuide && !document.getElementById('bubblebreak-mini-tab')) {
      const wrapper = document.createElement('ytd-mini-guide-entry-renderer');
      wrapper.className = 'style-scope ytd-mini-guide-renderer';
      wrapper.appendChild(createMiniTab());
      
      if (miniGuide.firstChild) {
        miniGuide.insertBefore(wrapper, miniGuide.firstChild);
      } else {
        miniGuide.appendChild(wrapper);
      }
      console.log('🫧 [BubbleBreak] Mini tab injected');
    }

    // Also add a floating button as fallback
    if (!document.getElementById('bubblebreak-floating-btn')) {
      createFloatingButton();
    }
  }

  // Create a floating button on the right side
  function createFloatingButton() {
    const btn = document.createElement('div');
    btn.id = 'bubblebreak-floating-btn';
    btn.innerHTML = `
      <div style="
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        z-index: 9998;
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 24px;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        🫧
      </div>
    `;
    btn.addEventListener('click', toggleDashboard);
    document.body.appendChild(btn);
    console.log('🫧 [BubbleBreak] Floating button added (right side)');
  }

  // Create the dashboard overlay
  function createDashboardOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'bubblebreak-overlay';
    overlay.innerHTML = `
      <div id="bubblebreak-dashboard-container">
        <div id="bubblebreak-header">
          <div class="bubblebreak-logo">
            <span class="logo-icon">🫧</span>
            <span class="logo-text">BubbleBreak</span>
          </div>
          <div class="bubblebreak-actions">
            <button id="bubblebreak-fullscreen" title="Open full dashboard">⛶</button>
            <button id="bubblebreak-close" title="Close">✕</button>
          </div>
        </div>
        <iframe id="bubblebreak-iframe" src="${chrome.runtime.getURL('src/dashboard/dashboard.html')}"></iframe>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      #bubblebreak-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
      }

      #bubblebreak-overlay.visible {
        display: flex;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      #bubblebreak-dashboard-container {
        width: 90%;
        max-width: 1400px;
        height: 90%;
        background: #0f0f1a;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      #bubblebreak-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .bubblebreak-logo {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .logo-icon {
        font-size: 28px;
      }

      .logo-text {
        font-size: 20px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .bubblebreak-actions {
        display: flex;
        gap: 8px;
      }

      .bubblebreak-actions button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.2s;
      }

      .bubblebreak-actions button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      #bubblebreak-iframe {
        flex: 1;
        border: none;
        width: 100%;
        height: 100%;
      }

      /* Highlight the BubbleBreak tab */
      #bubblebreak-tab tp-yt-paper-item,
      #bubblebreak-mini-tab tp-yt-paper-item {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        border-radius: 10px;
        margin: 4px 8px;
      }

      #bubblebreak-tab:hover tp-yt-paper-item,
      #bubblebreak-mini-tab:hover tp-yt-paper-item {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(overlay);

    // Event listeners
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDashboard();
      }
    });

    document.getElementById('bubblebreak-close').addEventListener('click', closeDashboard);
    
    document.getElementById('bubblebreak-fullscreen').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
      closeDashboard();
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dashboardVisible) {
        closeDashboard();
      }
    });

    return overlay;
  }

  // Toggle dashboard visibility
  function toggleDashboard() {
    let overlay = document.getElementById('bubblebreak-overlay');
    if (!overlay) {
      overlay = createDashboardOverlay();
    }

    if (dashboardVisible) {
      closeDashboard();
    } else {
      openDashboard();
    }
  }

  function openDashboard() {
    const overlay = document.getElementById('bubblebreak-overlay');
    if (overlay) {
      // Auto-refresh the iframe to get latest data
      const iframe = document.getElementById('bubblebreak-iframe');
      if (iframe) {
        iframe.src = chrome.runtime.getURL('src/dashboard/dashboard.html');
      }
      overlay.classList.add('visible');
      dashboardVisible = true;
      document.body.style.overflow = 'hidden';
    }
  }

  function closeDashboard() {
    const overlay = document.getElementById('bubblebreak-overlay');
    if (overlay) {
      overlay.classList.remove('visible');
      dashboardVisible = false;
      document.body.style.overflow = '';
    }
  }

  // Wait for YouTube's sidebar to load, then inject
  function waitForSidebar() {
    const observer = new MutationObserver((mutations, obs) => {
      const sidebar = document.querySelector('ytd-guide-renderer, ytd-mini-guide-renderer, #guide-content');
      if (sidebar && !document.getElementById('bubblebreak-tab')) {
        setTimeout(injectTabs, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Try multiple times with increasing delays
    setTimeout(injectTabs, 500);
    setTimeout(injectTabs, 1500);
    setTimeout(injectTabs, 3000);
    setTimeout(injectTabs, 5000);
  }

  // Update floating button to show blackout status
  function updateFloatingButtonStatus(isBlackout) {
    const btn = document.getElementById('bubblebreak-floating-btn');
    if (!btn) return;
    
    const innerDiv = btn.querySelector('div');
    if (!innerDiv) return;
    
    if (isBlackout) {
      innerDiv.style.background = 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)';
      innerDiv.style.animation = 'pulse-warning 1.5s infinite';
      innerDiv.innerHTML = '⚠️';
      
      // Add pulse animation if not exists
      if (!document.getElementById('bubblebreak-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'bubblebreak-pulse-style';
        style.textContent = `
          @keyframes pulse-warning {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }
            50% { transform: scale(1.1); box-shadow: 0 4px 25px rgba(239, 68, 68, 0.6); }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      innerDiv.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      innerDiv.style.animation = '';
      innerDiv.innerHTML = '🫧';
    }
    
    blackoutActive = isBlackout;
  }
  
  // Check blackout state on load
  async function checkBlackoutState() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getBlackoutState' });
      if (response && response.state) {
        updateFloatingButtonStatus(response.state.isActive);
      }
    } catch (e) {
      console.log('🫧 [BubbleBreak] Could not check blackout state:', e);
    }
  }
  
  // Listen for blackout state changes
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'blackoutStateChanged') {
      console.log('🫧 [BubbleBreak] Tab received blackout state change:', request.state?.isActive);
      updateFloatingButtonStatus(request.state?.isActive);
      sendResponse({ received: true });
    }
    return true;
  });
  
  // Also listen for storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.bubblebreak_blackout) {
      const newState = changes.bubblebreak_blackout.newValue;
      console.log('🫧 [BubbleBreak] Tab storage change, blackout:', newState?.isActive);
      updateFloatingButtonStatus(newState?.isActive);
    }
  });

  // Initialize
  console.log('🫧 [BubbleBreak] YouTube tab injection loaded');
  
  // Always add floating button first (guaranteed access)
  setTimeout(() => {
    if (!document.getElementById('bubblebreak-floating-btn')) {
      createFloatingButton();
    }
    // Check blackout state after button is created
    setTimeout(checkBlackoutState, 500);
  }, 1000);
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForSidebar);
  } else {
    waitForSidebar();
  }

  // Re-inject on YouTube navigation
  window.addEventListener('yt-navigate-finish', () => {
    console.log('🫧 [BubbleBreak] YouTube navigation detected');
    setTimeout(injectTabs, 500);
  });

  // Also listen for page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(injectTabs, 500);
    }
  });
})();
