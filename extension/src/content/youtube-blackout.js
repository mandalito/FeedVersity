// BubbleBreak - YouTube Blackout Content Script
// Hides YouTube recommendations when user is in a filter bubble

(function() {
  'use strict';
  
  const PREFIX = '🫧 [BubbleBreak Blackout]';
  let blackoutState = null;
  let blackoutOverlay = null;
  
  // CSS to hide YouTube content
  const BLACKOUT_STYLES = `
    /* Hide homepage video grid */
    .bubblebreak-blackout ytd-rich-grid-renderer #contents,
    .bubblebreak-blackout ytd-browse[page-subtype="home"] #contents {
      display: none !important;
    }
    
    /* Hide recommendations sidebar on video pages */
    .bubblebreak-blackout ytd-watch-flexy #secondary,
    .bubblebreak-blackout ytd-watch-next-secondary-results-renderer {
      display: none !important;
    }
    
    /* Hide ALL Shorts content */
    .bubblebreak-blackout ytd-reel-shelf-renderer,
    .bubblebreak-blackout ytd-rich-shelf-renderer[is-shorts],
    .bubblebreak-blackout ytd-reel-video-renderer,
    .bubblebreak-blackout ytd-shorts,
    .bubblebreak-blackout [is-shorts],
    .bubblebreak-blackout ytd-rich-grid-slim-media {
      display: none !important;
    }
    
    /* Hide Shorts tab in sidebar */
    .bubblebreak-blackout ytd-guide-entry-renderer a[title="Shorts"],
    .bubblebreak-blackout ytd-mini-guide-entry-renderer a[title="Shorts"],
    .bubblebreak-blackout ytd-guide-entry-renderer a[href="/shorts"],
    .bubblebreak-blackout ytd-mini-guide-entry-renderer a[href="/shorts"],
    .bubblebreak-blackout a[href="/shorts"] {
      display: none !important;
    }
    
    /* Hide Shorts page content completely */
    .bubblebreak-blackout ytd-browse[page-subtype="shorts"],
    .bubblebreak-blackout ytd-shorts-player-page {
      display: none !important;
    }
    
    /* Hide Shorts in search results */
    .bubblebreak-blackout ytd-reel-item-renderer {
      display: none !important;
    }
    
    /* Hide end screen recommendations */
    .bubblebreak-blackout .ytp-endscreen-content {
      display: none !important;
    }
    
    /* Blackout overlay styles */
    #bubblebreak-blackout-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 15, 26, 0.95);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
      padding: 40px;
      box-sizing: border-box;
    }
    
    #bubblebreak-blackout-overlay.hidden {
      display: none;
    }
    
    .blackout-icon {
      font-size: 80px;
      margin-bottom: 24px;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    .blackout-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-align: center;
    }
    
    .blackout-message {
      font-size: 18px;
      color: #9ca3af;
      text-align: center;
      max-width: 600px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    
    .blackout-stats {
      display: flex;
      gap: 32px;
      margin-bottom: 40px;
    }
    
    .blackout-stat {
      text-align: center;
      padding: 20px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      min-width: 120px;
    }
    
    .blackout-stat-value {
      font-size: 36px;
      font-weight: 700;
      color: #f87171;
    }
    
    .blackout-stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 8px;
    }
    
    .blackout-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      margin-bottom: 32px;
      max-width: 500px;
    }
    
    .blackout-category {
      padding: 8px 16px;
      background: rgba(248, 113, 113, 0.2);
      border: 1px solid rgba(248, 113, 113, 0.3);
      border-radius: 20px;
      font-size: 13px;
      color: #fca5a5;
    }
    
    .blackout-actions {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .blackout-btn {
      padding: 14px 28px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }
    
    .blackout-btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .blackout-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }
    
    .blackout-btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .blackout-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .blackout-btn-danger {
      background: transparent;
      color: #6b7280;
      border: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 12px;
      padding: 10px 20px;
    }
    
    .blackout-btn-danger:hover {
      color: #f87171;
      border-color: rgba(248, 113, 113, 0.3);
    }
    
    /* Warning badge for when overlay is dismissed */
    #bubblebreak-warning-badge {
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 30px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      z-index: 9998;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    #bubblebreak-warning-badge:hover {
      transform: translateX(-50%) scale(1.05);
    }
    
    #bubblebreak-warning-badge.hidden {
      display: none;
    }
  `;
  
  // Initialize
  async function init() {
    console.log(PREFIX, 'Initializing blackout script');
    
    // Inject styles
    injectStyles();
    
    // Check initial blackout state
    await checkBlackoutState();
    
    // Listen for state changes from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'blackoutStateChanged') {
        console.log(PREFIX, 'State changed:', request.state);
        blackoutState = request.state;
        updateBlackoutUI();
        sendResponse({ received: true });
      }
      return true;
    });
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.bubblebreak_blackout) {
        console.log(PREFIX, 'Storage changed, new state:', changes.bubblebreak_blackout.newValue);
        blackoutState = changes.bubblebreak_blackout.newValue;
        updateBlackoutUI();
      }
    });
    
    // Re-check on YouTube navigation
    window.addEventListener('yt-navigate-finish', () => {
      console.log(PREFIX, 'YouTube navigation detected');
      updateBlackoutUI();
    });
  }
  
  // Inject CSS styles
  function injectStyles() {
    if (document.getElementById('bubblebreak-blackout-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'bubblebreak-blackout-styles';
    style.textContent = BLACKOUT_STYLES;
    document.head.appendChild(style);
  }
  
  // Check blackout state from background
  async function checkBlackoutState() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getBlackoutState' });
      blackoutState = response.state;
      console.log(PREFIX, 'Initial state:', blackoutState);
      updateBlackoutUI();
    } catch (error) {
      console.error(PREFIX, 'Error checking state:', error);
    }
  }
  
  // Update UI based on blackout state
  function updateBlackoutUI() {
    if (!blackoutState) return;
    
    if (blackoutState.isActive) {
      activateBlackout();
    } else {
      deactivateBlackout();
    }
  }
  
  // Activate blackout mode
  function activateBlackout() {
    console.log(PREFIX, 'Activating blackout mode');
    
    // Add blackout class to body
    document.body.classList.add('bubblebreak-blackout');
    
    // Show overlay on homepage or Shorts page (both need intervention)
    if (isHomepage() || isShortsPage()) {
      showBlackoutOverlay();
    } else {
      showWarningBadge();
    }
  }
  
  // Deactivate blackout mode
  function deactivateBlackout() {
    console.log(PREFIX, 'Deactivating blackout mode');
    
    // Remove blackout class
    document.body.classList.remove('bubblebreak-blackout');
    
    // Remove overlay and badge
    hideBlackoutOverlay();
    hideWarningBadge();
  }
  
  // Check if on homepage
  function isHomepage() {
    return window.location.pathname === '/' || 
           window.location.pathname === '/feed/subscriptions' ||
           window.location.pathname.startsWith('/feed/');
  }
  
  // Check if user is on Shorts page
  function isShortsPage() {
    return window.location.pathname.startsWith('/shorts');
  }
  
  // Show the full blackout overlay
  function showBlackoutOverlay() {
    if (document.getElementById('bubblebreak-blackout-overlay')) {
      document.getElementById('bubblebreak-blackout-overlay').classList.remove('hidden');
      return;
    }
    
    const categories = blackoutState.problematicCategories || [];
    const recommendations = blackoutState.recommendations || [];
    
    const categoriesHtml = categories.slice(0, 5).map(cat => 
      `<span class="blackout-category">${formatCategory(cat.category)} (${cat.count})</span>`
    ).join('');
    
    const overlay = document.createElement('div');
    overlay.id = 'bubblebreak-blackout-overlay';
    overlay.innerHTML = `
      <div class="blackout-icon">🫧</div>
      <h1 class="blackout-title">You're in a Filter Bubble</h1>
      <p class="blackout-message">
        Your recent YouTube activity suggests you may be consuming content that could 
        reinforce a narrow viewpoint. We've temporarily hidden recommendations to help 
        you break out of this pattern.
      </p>
      
      <div class="blackout-stats">
        <div class="blackout-stat">
          <div class="blackout-stat-value">${blackoutState.avgRisk?.toFixed(1) || '?'}</div>
          <div class="blackout-stat-label">Risk Score</div>
        </div>
        <div class="blackout-stat">
          <div class="blackout-stat-value">${categories.length}</div>
          <div class="blackout-stat-label">Problematic Categories</div>
        </div>
      </div>
      
      ${categoriesHtml ? `
        <div class="blackout-categories">
          ${categoriesHtml}
        </div>
      ` : ''}
      
      <div class="blackout-actions">
        <button class="blackout-btn blackout-btn-primary" id="bb-open-dashboard">
          🫧 Open BubbleBreak Dashboard
        </button>
        <button class="blackout-btn blackout-btn-secondary" id="bb-view-recommendations">
          📚 View Recommended Content
        </button>
      </div>
      
      <div style="margin-top: 24px;">
        <button class="blackout-btn blackout-btn-danger" id="bb-dismiss-overlay">
          Continue anyway (not recommended)
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event listeners
    document.getElementById('bb-open-dashboard').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
    });
    
    document.getElementById('bb-view-recommendations').addEventListener('click', () => {
      showRecommendationsPanel();
    });
    
    document.getElementById('bb-dismiss-overlay').addEventListener('click', () => {
      hideBlackoutOverlay();
      showWarningBadge();
    });
  }
  
  // Hide the blackout overlay
  function hideBlackoutOverlay() {
    const overlay = document.getElementById('bubblebreak-blackout-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }
  
  // Show warning badge (when overlay is dismissed but blackout still active)
  function showWarningBadge() {
    if (document.getElementById('bubblebreak-warning-badge')) {
      document.getElementById('bubblebreak-warning-badge').classList.remove('hidden');
      return;
    }
    
    const badge = document.createElement('div');
    badge.id = 'bubblebreak-warning-badge';
    badge.innerHTML = `
      <span>⚠️</span>
      <span>Filter Bubble Active - Click for help</span>
    `;
    badge.addEventListener('click', () => {
      showBlackoutOverlay();
      hideWarningBadge();
    });
    
    document.body.appendChild(badge);
  }
  
  // Hide warning badge
  function hideWarningBadge() {
    const badge = document.getElementById('bubblebreak-warning-badge');
    if (badge) {
      badge.classList.add('hidden');
    }
  }
  
  // Show recommendations panel
  function showRecommendationsPanel() {
    const recommendations = blackoutState.recommendations || [];
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'bubblebreak-recommendations-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    `;
    
    const recsHtml = recommendations.length > 0 
      ? recommendations.map((rec, idx) => `
          <a href="${rec.searchUrl}" data-query="${rec.query}" data-idx="${idx}" class="bb-rec-link" style="
            display: block;
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin-bottom: 12px;
            text-decoration: none;
            color: white;
            transition: background 0.2s;
          " onmouseover="this.style.background='rgba(102, 126, 234, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'">
            <div style="font-size: 15px; font-weight: 600; margin-bottom: 6px;">🔍 ${rec.query}</div>
            <div style="font-size: 13px; color: #9ca3af;">${rec.reason}</div>
          </a>
        `).join('')
      : '<p style="color: #6b7280; text-align: center;">No recommendations available. Try opening the dashboard.</p>';
    
    modal.innerHTML = `
      <div style="
        background: #1a1a2e;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h2 style="color: white; font-size: 24px; margin-bottom: 8px;">📚 Recommended Content</h2>
        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 24px;">
          These searches can help you explore different perspectives and break out of your filter bubble.
          <br><br>
          <span style="color: #667eea;">💡 Watching videos from these searches helps restore your feed!</span>
        </p>
        
        <div id="bb-recovery-progress" style="
          background: rgba(102, 126, 234, 0.1);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 20px;
        ">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #9ca3af; font-size: 12px;">Recovery Progress</span>
            <span style="color: #667eea; font-size: 12px;" id="bb-progress-text">Loading...</span>
          </div>
          <div style="height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
            <div id="bb-progress-bar" style="height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); width: 0%; transition: width 0.5s;"></div>
          </div>
        </div>
        
        <div style="margin-bottom: 24px;">
          ${recsHtml}
        </div>
        
        <button id="bb-close-recommendations" style="
          width: 100%;
          padding: 14px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Track clicks on recommendation links
    modal.querySelectorAll('.bb-rec-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const query = link.dataset.query;
        console.log(PREFIX, 'User clicked recommendation:', query);
        
        // Store the active recommendation query for recovery tracking
        sessionStorage.setItem('bubblebreak_recovery_query', query);
        
        // Close modal
        modal.remove();
      });
    });
    
    // Load recovery progress
    loadRecoveryProgress();
    
    // Close events
    document.getElementById('bb-close-recommendations').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // Load and display recovery progress
  async function loadRecoveryProgress() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getRecoveryProgress' });
      if (response && response.progress) {
        const progress = response.progress;
        const progressBar = document.getElementById('bb-progress-bar');
        const progressText = document.getElementById('bb-progress-text');
        
        if (progressBar && progressText) {
          progressBar.style.width = `${progress.progressPercent}%`;
          progressText.textContent = progress.message;
        }
      }
    } catch (e) {
      console.log(PREFIX, 'Could not load recovery progress:', e);
    }
  }
  
  // Format category name for display
  function formatCategory(cat) {
    const labels = {
      conspiracy_content: 'Conspiracy',
      pseudoscience: 'Pseudoscience',
      extremist_content: 'Extremist',
      misinformation: 'Misinformation',
      political_left: 'Political Left',
      political_right: 'Political Right',
      alternative_media: 'Alt Media'
    };
    return labels[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
