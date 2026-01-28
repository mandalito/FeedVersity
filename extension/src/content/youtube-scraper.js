// YouTube Watch History Scraper
// This content script runs on youtube.com/feed/history

(function() {
  'use strict';

  const SCRAPE_DELAY = 500; // ms between scroll attempts
  const MAX_VIDEOS = 500; // Maximum videos to scrape in one session
  
  let isScrapingActive = false;
  let scrapedVideos = [];

  // Extract video data from a video renderer element
  function extractVideoData(videoElement) {
    try {
      // Get video link and ID
      const linkElement = videoElement.querySelector('a#video-title-link, a#video-title');
      if (!linkElement) return null;

      const href = linkElement.getAttribute('href');
      if (!href || !href.includes('watch?v=')) return null;

      const videoId = new URLSearchParams(href.split('?')[1]).get('v');
      if (!videoId) return null;

      // Get title
      const title = linkElement.textContent?.trim() || 
                    linkElement.getAttribute('title')?.trim() || 
                    'Unknown Title';

      // Get channel name
      const channelElement = videoElement.querySelector(
        'ytd-channel-name a, ' +
        '#channel-name a, ' +
        '.ytd-channel-name a, ' +
        '#text.ytd-channel-name, ' +
        '#text-container.ytd-channel-name yt-formatted-string a'
      );
      const channelName = channelElement?.textContent?.trim() || 'Unknown Channel';

      // Get channel URL
      const channelUrl = channelElement?.getAttribute('href') || '';

      // Get thumbnail URL
      const thumbnailElement = videoElement.querySelector('img#img, yt-image img');
      const thumbnail = thumbnailElement?.src || '';

      // Get video duration if available
      const durationElement = videoElement.querySelector(
        'span.ytd-thumbnail-overlay-time-status-renderer, ' +
        'ytd-thumbnail-overlay-time-status-renderer span'
      );
      const duration = durationElement?.textContent?.trim() || '';

      // Get view count if available
      const metadataLine = videoElement.querySelector('#metadata-line');
      const viewsElement = metadataLine?.querySelector('span.ytd-video-meta-block');
      const views = viewsElement?.textContent?.trim() || '';

      // Get watch date/time context (YouTube shows relative time)
      const watchTimeElement = videoElement.closest('ytd-item-section-renderer')
        ?.querySelector('#title')?.textContent?.trim();

      return {
        videoId,
        title,
        channelName,
        channelUrl: channelUrl ? `https://www.youtube.com${channelUrl}` : '',
        thumbnail,
        duration,
        views,
        watchContext: watchTimeElement || 'Unknown',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        scrapedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[BubbleBreak] Error extracting video data:', error);
      return null;
    }
  }

  // Get all video elements currently in the DOM
  function getVideoElements() {
    return document.querySelectorAll(
      'ytd-video-renderer, ' +
      'ytd-compact-video-renderer, ' +
      'ytd-grid-video-renderer, ' +
      'ytd-playlist-video-renderer'
    );
  }

  // Scrape all visible videos
  function scrapeVisibleVideos() {
    const videoElements = getVideoElements();
    const existingIds = new Set(scrapedVideos.map(v => v.videoId));
    let newCount = 0;

    videoElements.forEach(element => {
      const videoData = extractVideoData(element);
      if (videoData && !existingIds.has(videoData.videoId)) {
        scrapedVideos.push(videoData);
        existingIds.add(videoData.videoId);
        newCount++;
      }
    });

    return newCount;
  }

  // Auto-scroll to load more videos
  async function autoScrollAndScrape(maxVideos = MAX_VIDEOS, progressCallback = null) {
    isScrapingActive = true;
    scrapedVideos = [];
    let previousHeight = 0;
    let noNewContentCount = 0;
    const maxNoNewContent = 5;

    while (scrapedVideos.length < maxVideos && isScrapingActive) {
      // Scrape current videos
      const newVideos = scrapeVisibleVideos();
      
      if (progressCallback) {
        progressCallback({
          total: scrapedVideos.length,
          new: newVideos,
          status: 'scraping'
        });
      }

      // Scroll down
      window.scrollTo(0, document.documentElement.scrollHeight);
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, SCRAPE_DELAY));

      // Check if we've reached the end
      const currentHeight = document.documentElement.scrollHeight;
      if (currentHeight === previousHeight) {
        noNewContentCount++;
        if (noNewContentCount >= maxNoNewContent) {
          console.log('[BubbleBreak] Reached end of history');
          break;
        }
      } else {
        noNewContentCount = 0;
      }
      previousHeight = currentHeight;
    }

    isScrapingActive = false;
    return scrapedVideos;
  }

  // Stop scraping
  function stopScraping() {
    isScrapingActive = false;
  }

  // Quick scrape without scrolling (just visible content)
  function quickScrape() {
    scrapedVideos = [];
    scrapeVisibleVideos();
    return scrapedVideos;
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[BubbleBreak] Received message:', request.action);

    switch (request.action) {
      case 'ping':
        sendResponse({ status: 'ready', url: window.location.href });
        break;

      case 'quickScrape':
        const quickResults = quickScrape();
        sendResponse({ 
          success: true, 
          videos: quickResults,
          count: quickResults.length 
        });
        break;

      case 'startScraping':
        const maxVideos = request.maxVideos || MAX_VIDEOS;
        
        // Start scraping in background
        autoScrollAndScrape(maxVideos, (progress) => {
          // Send progress updates
          chrome.runtime.sendMessage({
            action: 'scrapeProgress',
            progress
          });
        }).then(videos => {
          // Send final results
          chrome.runtime.sendMessage({
            action: 'scrapeComplete',
            videos,
            count: videos.length
          });
        });

        sendResponse({ success: true, message: 'Scraping started' });
        break;

      case 'stopScraping':
        stopScraping();
        sendResponse({ 
          success: true, 
          videos: scrapedVideos,
          count: scrapedVideos.length 
        });
        break;

      case 'getStatus':
        sendResponse({
          isActive: isScrapingActive,
          count: scrapedVideos.length
        });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }

    return true; // Keep the message channel open for async responses
  });

  // Inject indicator that extension is active
  function showIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'bubblebreak-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <span style="font-size: 18px;">🫧</span>
        <span>BubbleBreak Active</span>
      </div>
    `;
    document.body.appendChild(indicator);

    // Click to open extension popup (just a visual indicator)
    indicator.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard' });
    });
  }

  // Initialize
  console.log('[BubbleBreak] Content script loaded on YouTube History page');
  showIndicator();

  // Notify background that we're ready
  chrome.runtime.sendMessage({ 
    action: 'contentScriptReady',
    url: window.location.href 
  });
})();
