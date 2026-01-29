// BubbleBreak Video Tracker
// Tracks videos as the user watches them on YouTube

(function() {
  'use strict';

  console.log('🫧 [BubbleBreak] Video tracker script LOADED on:', window.location.href);

  let currentVideoId = null;
  let watchStartTime = null;
  let hasTrackedCurrentVideo = false;
  let wasBlackoutActive = false; // Track previous blackout state
  const MIN_WATCH_TIME_MS = 5000; // Minimum 5 seconds to count as "watched"

  // Check if current page is a video page
  function isVideoPage(url = window.location.href) {
    return url.includes('/watch') && url.includes('v=');
  }

  // Extract video ID from URL
  function getVideoIdFromUrl(url = window.location.href) {
    try {
      const urlParams = new URLSearchParams(new URL(url).search);
      return urlParams.get('v');
    } catch (e) {
      return null;
    }
  }

  // Extract video metadata from the page
  function extractVideoData() {
    const videoId = getVideoIdFromUrl();
    if (!videoId) return null;

    try {
      // Get title
      const titleElement = document.querySelector(
        'h1.ytd-video-primary-info-renderer yt-formatted-string, ' +
        'h1.ytd-watch-metadata yt-formatted-string, ' +
        '#title h1 yt-formatted-string, ' +
        'h1.title'
      );
      const title = titleElement?.textContent?.trim() || 
                    document.querySelector('meta[name="title"]')?.content ||
                    document.title.replace(' - YouTube', '').trim() ||
                    'Unknown Title';

      // Get channel name - try multiple selectors for different YouTube layouts
      let channelName = 'Unknown Channel';
      let channelUrl = '';
      
      // Modern YouTube layout selectors (2024+)
      const channelSelectors = [
        'ytd-watch-metadata ytd-channel-name yt-formatted-string a',
        'ytd-watch-metadata #channel-name a',
        'ytd-video-owner-renderer ytd-channel-name a',
        'ytd-video-owner-renderer #channel-name yt-formatted-string a',
        '#owner ytd-channel-name a',
        '#owner #channel-name a',
        '#upload-info #channel-name a',
        '#upload-info ytd-channel-name a',
        // Fallback without link
        'ytd-watch-metadata ytd-channel-name yt-formatted-string',
        'ytd-video-owner-renderer ytd-channel-name yt-formatted-string',
        '#channel-name yt-formatted-string',
        // Legacy selectors
        '#owner-name a',
        '.ytd-channel-name a'
      ];
      
      for (const selector of channelSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          if (text && text.length > 0 && text !== channelName) {
            channelName = text;
            if (el.href) {
              channelUrl = el.href;
            }
            break;
          }
        }
      }
      
      // Fallback to meta tag
      if (channelName === 'Unknown Channel') {
        const metaAuthor = document.querySelector('meta[itemprop="author"]')?.content ||
                          document.querySelector('link[itemprop="name"]')?.content ||
                          document.querySelector('span[itemprop="author"] link[itemprop="name"]')?.getAttribute('content');
        if (metaAuthor) {
          channelName = metaAuthor;
        }
      }
      
      // Try to get channel URL if not found
      if (!channelUrl) {
        const urlEl = document.querySelector('ytd-video-owner-renderer a, #owner a');
        channelUrl = urlEl?.href || '';
      }
      
      console.log('🫧 [BubbleBreak] Extracted channel:', channelName);

      // Get full description from the video's description box
      // Priority: DOM elements first (actual description), then meta as fallback
      let description = '';
      
      // Try DOM elements that contain the actual video description
      const descriptionSelectors = [
        // Modern YouTube layout - expanded description
        'ytd-watch-metadata #description-inner ytd-text-inline-expander yt-attributed-string',
        'ytd-watch-metadata #description yt-attributed-string',
        '#description-inline-expander yt-attributed-string',
        '#description ytd-text-inline-expander',
        // Snippet text (collapsed description preview)
        '#description #attributed-snippet-text yt-attributed-string',
        '#attributed-snippet-text',
        // Legacy selectors
        '#description-inner',
        'ytd-expander #content'
      ];
      
      for (const selector of descriptionSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim();
          // Check it's not YouTube's generic description
          if (text && text.length > 20 && !text.startsWith('Profitez des vidéos') && !text.startsWith('Enjoy the videos')) {
            description = text;
            break;
          }
        }
      }
      
      // Fallback to og:description meta (video-specific, not the generic one)
      if (!description) {
        const ogDescription = document.querySelector('meta[property="og:description"]')?.content;
        if (ogDescription && !ogDescription.startsWith('Profitez des vidéos') && !ogDescription.startsWith('Enjoy the videos')) {
          description = ogDescription;
        }
      }
      
      console.log('🫧 [BubbleBreak] Extracted description (first 100 chars):', description?.substring(0, 100));

      // Get video duration from the video element or player
      let duration = '';
      const videoElement = document.querySelector('video.html5-main-video');
      if (videoElement && videoElement.duration && !isNaN(videoElement.duration)) {
        const totalSeconds = Math.floor(videoElement.duration);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
          duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }
      
      // Fallback: try to get duration from time display
      if (!duration) {
        const durationElement = document.querySelector('.ytp-time-duration');
        duration = durationElement?.textContent?.trim() || '';
      }

      // Get view count
      const viewCountElement = document.querySelector(
        '#info-strings yt-formatted-string, ' +
        'ytd-video-view-count-renderer span, ' +
        '#info span.view-count'
      );
      const views = viewCountElement?.textContent?.trim() || '';

      // Get likes count
      const likesElement = document.querySelector(
        '#top-level-buttons-computed ytd-toggle-button-renderer:first-child #text, ' +
        'ytd-menu-renderer yt-formatted-string[aria-label*="like"], ' +
        '#segmented-like-button button .yt-spec-button-shape-next__button-text-content'
      );
      const likes = likesElement?.textContent?.trim() || '';

      // Get upload date
      const dateElement = document.querySelector(
        '#info-strings yt-formatted-string:last-child, ' +
        'ytd-video-primary-info-renderer #info-strings span, ' +
        '#description-inline-expander .style-scope.yt-formatted-string'
      );
      let uploadDate = '';
      if (dateElement) {
        const dateText = dateElement.textContent;
        // Look for date patterns like "Jan 15, 2024" or "15 janv. 2024"
        const dateMatch = dateText?.match(/(\d{1,2}\s+\w+\.?\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})/);
        uploadDate = dateMatch ? dateMatch[0] : '';
      }

      // Get subscriber count from channel
      const subscriberElement = document.querySelector(
        '#owner-sub-count, ' +
        'ytd-video-owner-renderer #owner-sub-count'
      );
      const subscribers = subscriberElement?.textContent?.trim() || '';

      // Get thumbnail
      const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      return {
        videoId,
        title,
        channelName,
        channelUrl,
        description,
        duration,
        thumbnail,
        views,
        likes,
        uploadDate,
        subscribers,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[BubbleBreak] Error extracting video data:', error);
      return null;
    }
  }

  // Track the current video
  async function trackVideo() {
    console.log('🫧 [BubbleBreak] trackVideo() called');
    const videoData = extractVideoData();
    console.log('🫧 [BubbleBreak] Extracted video data:', videoData);
    
    if (!videoData) {
      console.log('🫧 [BubbleBreak] No video data extracted, aborting');
      return;
    }

    console.log('🫧 [BubbleBreak] Tracking video:', videoData.title);

    // Check if this video is from a recovery recommendation
    const recoveryQuery = sessionStorage.getItem('bubblebreak_recovery_query');
    const isRecoveryVideo = !!recoveryQuery;
    
    if (isRecoveryVideo) {
      console.log('🫧 [BubbleBreak] This is a RECOVERY video from query:', recoveryQuery);
      // Clear the recovery query after use
      sessionStorage.removeItem('bubblebreak_recovery_query');
    }

    try {
      // Determine which action to use
      const action = isRecoveryVideo ? 'trackRecoveryVideo' : 'trackVideo';
      
      // Send to background script for storage
      chrome.runtime.sendMessage({
        action: action,
        video: videoData,
        recommendationQuery: recoveryQuery
      }, (response) => {
        console.log('🫧 [BubbleBreak] Background response:', response);
        if (chrome.runtime.lastError) {
          console.error('🫧 [BubbleBreak] Runtime error:', chrome.runtime.lastError);
          return;
        }
        if (response?.success) {
          console.log('🫧 [BubbleBreak] Video tracked successfully');
          hasTrackedCurrentVideo = true;
          
          // Show different indicator for recovery videos
          if (isRecoveryVideo && response.recoveryCredit) {
            showRecoveryIndicator(videoData);
          } else {
            showTrackingIndicator(videoData);
          }
          
          // If blackout was just deactivated (transitioned from active to inactive), notify
          if (response.blackoutState) {
            const isNowActive = response.blackoutState.isActive;
            if (wasBlackoutActive && !isNowActive) {
              console.log('🫧 [BubbleBreak] Blackout just cleared! Showing recovery notification.');
              showRecoveryCompleteNotification();
            }
            wasBlackoutActive = isNowActive;
          }
        } else {
          console.log('🫧 [BubbleBreak] Track response not successful:', response);
        }
      });
    } catch (error) {
      console.error('🫧 [BubbleBreak] Error tracking video:', error);
    }
  }
  
  // Show indicator for recovery video
  function showRecoveryIndicator(videoData) {
    hideTrackingIndicator();

    const indicator = document.createElement('div');
    indicator.id = 'bubblebreak-tracked';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        bottom: 150px;
        right: 20px;
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease, fadeOut 0.5s ease 4s forwards;
        cursor: pointer;
      ">
        <span style="font-size: 16px;">✨</span>
        <span>Great choice! Helping you break the bubble</span>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateX(20px); }
        }
      </style>
    `;
    document.body.appendChild(indicator);

    // Auto-remove after animation
    setTimeout(() => {
      indicator.remove();
    }, 5000);
  }
  
  // Show notification when recovery is complete
  function showRecoveryCompleteNotification() {
    const notification = document.createElement('div');
    notification.id = 'bubblebreak-recovery-complete';
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: white;
        padding: 40px;
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        text-align: center;
        animation: popIn 0.4s ease;
      ">
        <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
        <h2 style="font-size: 24px; margin-bottom: 12px; color: #4ade80;">Filter Bubble Cleared!</h2>
        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 24px; max-width: 300px;">
          Great job! Your YouTube recommendations have been restored. 
          Keep watching diverse content to stay balanced.
        </p>
        <button id="bb-recovery-ok" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 14px 40px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        ">Got it!</button>
      </div>
      <style>
        @keyframes popIn {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      </style>
    `;
    document.body.appendChild(notification);
    
    document.getElementById('bb-recovery-ok').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.remove();
    }, 10000);
  }

  // Check if we should track the current video
  function checkAndTrack() {
    // Only track on video pages
    if (!isVideoPage()) {
      console.log('🫧 [BubbleBreak] Not a video page, skipping');
      return;
    }

    const videoId = getVideoIdFromUrl();
    console.log('🫧 [BubbleBreak] checkAndTrack called, videoId:', videoId, 'currentVideoId:', currentVideoId);
    
    // Video changed
    if (videoId !== currentVideoId) {
      currentVideoId = videoId;
      watchStartTime = Date.now();
      hasTrackedCurrentVideo = false;
      hideTrackingIndicator();
      
      if (videoId) {
        console.log('🫧 [BubbleBreak] New video detected:', videoId);
        // Wait a bit for page to load metadata, then track
        setTimeout(() => {
          console.log('🫧 [BubbleBreak] Timer fired, hasTracked:', hasTrackedCurrentVideo, 'currentId:', currentVideoId, 'videoId:', videoId);
          if (!hasTrackedCurrentVideo && currentVideoId === videoId) {
            trackVideo();
          }
        }, 2000);
      }
    } else {
      console.log('🫧 [BubbleBreak] Same video, skipping');
    }
  }

  // Show a small indicator that video was tracked
  function showTrackingIndicator(videoData) {
    // Remove existing indicator
    hideTrackingIndicator();

    const indicator = document.createElement('div');
    indicator.id = 'bubblebreak-tracked';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        bottom: 150px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 10px 16px;
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease, fadeOut 0.5s ease 3s forwards;
        cursor: pointer;
      ">
        <span style="font-size: 14px;">🫧</span>
        <span>Video tracked</span>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateX(20px); }
        }
      </style>
    `;
    document.body.appendChild(indicator);

    // Auto-remove after animation
    setTimeout(hideTrackingIndicator, 3500);
  }

  function hideTrackingIndicator() {
    const existing = document.getElementById('bubblebreak-tracked');
    if (existing) existing.remove();
  }

  // Listen for URL changes (YouTube is a SPA)
  function setupUrlChangeListener() {
    // YouTube uses History API for navigation
    let lastUrl = location.href;
    
    // Check periodically for URL changes
    setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        checkAndTrack();
      }
    }, 1000);

    // Also listen for popstate
    window.addEventListener('popstate', () => {
      setTimeout(checkAndTrack, 500);
    });

    // Listen for YouTube's custom navigation events
    window.addEventListener('yt-navigate-finish', () => {
      setTimeout(checkAndTrack, 500);
    });
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'ping':
        sendResponse({ 
          status: 'ready', 
          url: window.location.href,
          videoId: currentVideoId,
          tracked: hasTrackedCurrentVideo
        });
        break;

      case 'getCurrentVideo':
        const videoData = extractVideoData();
        sendResponse({ video: videoData });
        break;

      case 'forceTrack':
        hasTrackedCurrentVideo = false;
        trackVideo();
        sendResponse({ success: true });
        break;

      case 'blackoutStateChanged':
        // Update our tracking of blackout state
        if (request.state) {
          wasBlackoutActive = request.state.isActive;
          console.log('🫧 [BubbleBreak] Blackout state updated:', wasBlackoutActive);
        }
        sendResponse({ received: true });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
    return true;
  });

  // Initialize
  console.log('🫧 [BubbleBreak] Video tracker initializing...');
  console.log('🫧 [BubbleBreak] Current URL:', window.location.href);
  console.log('🫧 [BubbleBreak] Is video page:', isVideoPage());
  
  setupUrlChangeListener();
  
  // Check initial blackout state
  chrome.runtime.sendMessage({ action: 'getBlackoutState' }, (response) => {
    if (response && response.state) {
      wasBlackoutActive = response.state.isActive;
      console.log('🫧 [BubbleBreak] Initial blackout state:', wasBlackoutActive);
    }
  });
  
  // Initial check after page load
  console.log('🫧 [BubbleBreak] Setting up initial check timer (1.5s)');
  setTimeout(() => {
    console.log('🫧 [BubbleBreak] Initial check timer fired');
    checkAndTrack();
  }, 1500);

  // Notify background that tracker is ready
  chrome.runtime.sendMessage({ 
    action: 'trackerReady',
    url: window.location.href 
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('🫧 [BubbleBreak] Error notifying background:', chrome.runtime.lastError);
    } else {
      console.log('🫧 [BubbleBreak] Background notified, response:', response);
    }
  });
  
  console.log('🫧 [BubbleBreak] Video tracker initialization complete');
})();
