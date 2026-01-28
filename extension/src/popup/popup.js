// BubbleBreak Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const videoCountEl = document.getElementById('videoCount');
  const messageEl = document.getElementById('message');
  const progressSection = document.getElementById('progressSection');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const apiStatus = document.getElementById('apiStatus');
  const trackingStatus = document.getElementById('trackingStatus');

  const btnScrape = document.getElementById('btnScrape');
  const btnCategorize = document.getElementById('btnCategorize');
  const btnDashboard = document.getElementById('btnDashboard');
  const btnSaveKey = document.getElementById('btnSaveKey');
  const btnClearData = document.getElementById('btnClearData');

  // State
  let videos = [];
  let categorizedVideos = [];
  let apiKey = '';
  let isScrapingActive = false;

  // Initialize
  await loadData();
  await loadApiKey();
  updateUI();

  // Load saved data
  async function loadData() {
    try {
      const videosResponse = await chrome.runtime.sendMessage({ action: 'getVideos' });
      videos = videosResponse.videos || [];

      const categorizedResponse = await chrome.runtime.sendMessage({ action: 'getCategorizedVideos' });
      categorizedVideos = categorizedResponse.videos || [];
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Load API key
  async function loadApiKey() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getApiKey' });
      apiKey = response.apiKey || '';
      if (apiKey) {
        apiKeyInput.value = '••••••••••••••••';
        apiStatus.className = 'api-status saved';
        apiStatus.innerHTML = '<span>✓</span> API key saved';
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  }

  // Update UI state
  function updateUI() {
    videoCountEl.textContent = categorizedVideos.length;

    // Dashboard always available
    btnDashboard.disabled = false;

    // Show API key message if not set
    if (!apiKey) {
      showMessage('Add your OpenAI API key for auto-categorization', 'info');
    }
  }

  // Show message
  function showMessage(text, type = 'info') {
    messageEl.textContent = text;
    messageEl.className = `message active ${type}`;
    
    if (type !== 'error') {
      setTimeout(() => {
        messageEl.className = 'message';
      }, 5000);
    }
  }

  // Show progress
  function showProgress(percent, text) {
    progressSection.className = 'progress-section active';
    progressFill.style.width = `${percent}%`;
    progressText.textContent = text;
  }

  // Hide progress
  function hideProgress() {
    progressSection.className = 'progress-section';
  }

  // Scrape/Import button handler
  btnScrape.addEventListener('click', async () => {
    if (isScrapingActive) {
      // Stop scraping
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.tabs.sendMessage(tab.id, { action: 'stopScraping' });
        isScrapingActive = false;
        btnScrape.innerHTML = '<span>📥</span> Import from History';
        hideProgress();
      } catch (error) {
        showMessage('Error stopping import', 'error');
      }
      return;
    }

    // Check if we're on YouTube history page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url?.includes('youtube.com/feed/history')) {
      // Open YouTube history in new tab
      showMessage('Opening YouTube history page...', 'info');
      chrome.runtime.sendMessage({ action: 'openYouTubeHistory' });
      return;
    }

    // Start scraping
    try {
      isScrapingActive = true;
      btnScrape.innerHTML = '<span>⏹️</span> Stop Import';
      showProgress(0, 'Starting import...');

      await chrome.tabs.sendMessage(tab.id, { 
        action: 'startScraping',
        maxVideos: 200
      });

      showMessage('Importing history! Auto-scroll in progress...', 'info');
    } catch (error) {
      console.error('Import error:', error);
      showMessage('Failed to start import. Make sure you\'re on YouTube history page.', 'error');
      isScrapingActive = false;
      btnScrape.innerHTML = '<span>📥</span> Import from History';
      hideProgress();
    }
  });

  // Categorize button handler
  btnCategorize.addEventListener('click', async () => {
    if (!apiKey) {
      showMessage('Please save your OpenAI API key first', 'error');
      return;
    }

    // Get uncategorized videos
    const categorizedIds = new Set(categorizedVideos.map(v => v.videoId));
    const uncategorized = videos.filter(v => !categorizedIds.has(v.videoId));

    if (uncategorized.length === 0) {
      showMessage('All videos are already categorized!', 'info');
      return;
    }

    btnCategorize.disabled = true;
    showProgress(0, `Categorizing ${uncategorized.length} videos...`);

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'categorizeVideos',
        videos: uncategorized,
        apiKey: apiKey
      });

      if (response.error) {
        throw new Error(response.error);
      }

      categorizedVideos = response.videos || [];
      showMessage(`Categorized ${categorizedVideos.length} videos!`, 'success');
      updateUI();
    } catch (error) {
      console.error('Categorization error:', error);
      showMessage(`Categorization failed: ${error.message}`, 'error');
    } finally {
      btnCategorize.disabled = false;
      hideProgress();
    }
  });

  // Dashboard button handler
  btnDashboard.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openDashboard' });
  });

  // Save API key handler
  btnSaveKey.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    
    if (!key || key === '••••••••••••••••') {
      showMessage('Please enter a valid API key', 'error');
      return;
    }

    if (!key.startsWith('sk-')) {
      showMessage('Invalid API key format (should start with sk-)', 'error');
      return;
    }

    try {
      await chrome.runtime.sendMessage({ action: 'saveApiKey', apiKey: key });
      apiKey = key;
      apiKeyInput.value = '••••••••••••••••';
      apiStatus.className = 'api-status saved';
      apiStatus.innerHTML = '<span>✓</span> API key saved';
      showMessage('API key saved!', 'success');
      updateUI();
    } catch (error) {
      showMessage('Failed to save API key', 'error');
    }
  });

  // Clear data handler
  btnClearData.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to clear all scraped data?')) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({ action: 'clearData' });
      videos = [];
      categorizedVideos = [];
      showMessage('All data cleared', 'success');
      updateUI();
    } catch (error) {
      showMessage('Failed to clear data', 'error');
    }
  });

  // Listen for progress messages from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'scrapeProgress':
        showProgress(
          Math.min(request.progress.total / 2, 100),
          `Scraped ${request.progress.total} videos...`
        );
        break;

      case 'scrapeComplete':
        isScrapingActive = false;
        btnScrape.innerHTML = '<span>📥</span> Import from History';
        videos = [...videos, ...request.videos.filter(v => 
          !videos.some(existing => existing.videoId === v.videoId)
        )];
        hideProgress();
        showMessage(`Import complete! Found ${request.count} videos.`, 'success');
        updateUI();
        break;

      case 'categorizationProgress':
        showProgress(
          request.progress.percent,
          `Categorizing: ${request.progress.completed}/${request.progress.total}`
        );
        break;

      case 'videoTracked':
        // Real-time update when a new video is tracked
        categorizedVideos.push(request.video);
        updateUI();
        break;
    }
  });
});
