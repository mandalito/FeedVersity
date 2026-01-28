// BubbleBreak Background Service Worker

// Category keys for categorization prompt
const CATEGORY_KEYS = [
  'entertainment', 'gaming', 'education', 'lifestyle', 'news', 'tech', 'sports', 'music',
  'political_left', 'political_right', 'political_centrist', 'alternative_media',
  'conspiracy_content', 'pseudoscience', 'extremist_content', 'misinformation', 'other'
];

// Storage keys
const STORAGE_KEYS = {
  VIDEOS: 'bubblebreak_videos',
  CATEGORIZED: 'bubblebreak_categorized',
  API_KEY: 'bubblebreak_openai_key',
  SETTINGS: 'bubblebreak_settings'
};

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Message handlers
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[BubbleBreak BG] Message received:', request.action);

  switch (request.action) {
    case 'contentScriptReady':
      console.log('[BubbleBreak BG] Content script ready at:', request.url);
      sendResponse({ acknowledged: true });
      break;

    case 'scrapeProgress':
      // Forward progress to popup if open
      chrome.runtime.sendMessage(request).catch(() => {
        // Popup might not be open, ignore error
      });
      break;

    case 'scrapeComplete':
      // Save videos and forward to popup
      saveVideos(request.videos).then(() => {
        chrome.runtime.sendMessage(request).catch(() => {});
      });
      sendResponse({ saved: true });
      break;

    case 'saveVideos':
      saveVideos(request.videos)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'getVideos':
      getVideos()
        .then(videos => sendResponse({ videos }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'getCategorizedVideos':
      getCategorizedVideos()
        .then(videos => sendResponse({ videos }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'categorizeVideos':
      categorizeVideos(request.videos, request.apiKey)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'saveApiKey':
      saveApiKey(request.apiKey)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'getApiKey':
      getApiKey()
        .then(apiKey => sendResponse({ apiKey }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'clearData':
      clearAllData()
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'openDashboard':
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('src/dashboard/dashboard.html') 
      });
      sendResponse({ opened: true });
      break;

    case 'openYouTubeHistory':
      chrome.tabs.create({ url: 'https://www.youtube.com/feed/history' });
      sendResponse({ opened: true });
      break;

    case 'trackerReady':
      console.log('[BubbleBreak BG] Video tracker ready at:', request.url);
      sendResponse({ acknowledged: true });
      break;

    case 'trackVideo':
      trackAndCategorizeVideo(request.video)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'getSettings':
      getSettings()
        .then(settings => sendResponse({ settings }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'saveSettings':
      saveSettings(request.settings)
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
  }

  return true;
});

// Storage functions
async function saveVideos(videos) {
  const existing = await getVideos();
  const existingIds = new Set(existing.map(v => v.videoId));
  
  const newVideos = videos.filter(v => !existingIds.has(v.videoId));
  const merged = [...existing, ...newVideos];
  
  await chrome.storage.local.set({ [STORAGE_KEYS.VIDEOS]: merged });
  console.log(`[BubbleBreak BG] Saved ${newVideos.length} new videos. Total: ${merged.length}`);
  return merged;
}

async function getVideos() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.VIDEOS);
  return result[STORAGE_KEYS.VIDEOS] || [];
}

async function getCategorizedVideos() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CATEGORIZED);
  return result[STORAGE_KEYS.CATEGORIZED] || [];
}

async function saveCategorizedVideos(videos) {
  await chrome.storage.local.set({ [STORAGE_KEYS.CATEGORIZED]: videos });
}

async function saveApiKey(apiKey) {
  await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: apiKey });
}

async function getApiKey() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
  return result[STORAGE_KEYS.API_KEY] || '';
}

async function clearAllData() {
  await chrome.storage.local.remove([
    STORAGE_KEYS.VIDEOS,
    STORAGE_KEYS.CATEGORIZED
  ]);
}

// Settings functions
async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || {
    autoCategorize: true,
    showNotifications: true
  };
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

// Track and auto-categorize a single video in real-time
async function trackAndCategorizeVideo(video) {
  if (!video || !video.videoId) {
    throw new Error('Invalid video data');
  }

  // Check if already tracked
  const existingVideos = await getCategorizedVideos();
  const alreadyTracked = existingVideos.some(v => v.videoId === video.videoId);
  
  if (alreadyTracked) {
    console.log('[BubbleBreak BG] Video already tracked:', video.videoId);
    return { success: true, alreadyTracked: true };
  }

  // Save to raw videos list
  await saveVideos([video]);

  // Check if auto-categorize is enabled and API key exists
  const settings = await getSettings();
  const apiKey = await getApiKey();

  if (settings.autoCategorize && apiKey) {
    try {
      // Categorize this single video
      const categorized = await categorizeSingleVideo(video, apiKey);
      
      // Add to categorized videos
      const allCategorized = await getCategorizedVideos();
      allCategorized.push(categorized);
      await saveCategorizedVideos(allCategorized);

      console.log('[BubbleBreak BG] Video categorized:', categorized.category, '| Risk:', categorized.radicalizationRisk);
      
      // Notify popup/dashboard of new video
      chrome.runtime.sendMessage({
        action: 'videoTracked',
        video: categorized
      }).catch(() => {});

      return { success: true, video: categorized };
    } catch (error) {
      console.error('[BubbleBreak BG] Auto-categorization failed:', error);
      // Still save as uncategorized
      const uncategorized = {
        ...video,
        category: 'other',
        radicalizationRisk: 0,
        reasoning: 'Pending categorization',
        categorizedAt: new Date().toISOString()
      };
      const allCategorized = await getCategorizedVideos();
      allCategorized.push(uncategorized);
      await saveCategorizedVideos(allCategorized);
      
      return { success: true, video: uncategorized, error: error.message };
    }
  } else {
    // No auto-categorize, just save as pending
    const pending = {
      ...video,
      category: 'other',
      radicalizationRisk: 0,
      reasoning: apiKey ? 'Auto-categorize disabled' : 'API key not set',
      categorizedAt: new Date().toISOString()
    };
    const allCategorized = await getCategorizedVideos();
    allCategorized.push(pending);
    await saveCategorizedVideos(allCategorized);

    return { success: true, video: pending };
  }
}

// Categorize a single video
async function categorizeSingleVideo(video, apiKey) {
  const prompt = `Analyze this YouTube video and categorize it. Be objective and evidence-based.

Title: "${video.title}"
Channel: "${video.channelName}"
${video.description ? `Description: "${video.description.slice(0, 300)}"` : ''}

Available categories: ${CATEGORY_KEYS.join(', ')}

Provide:
1. primary_category: The main category (must be from the list above)
2. secondary_categories: Up to 2 additional relevant categories (array)
3. radicalization_risk: Score 0-5:
   - 0: Standard, neutral content
   - 1-2: Slight bias or sensationalism  
   - 3: Notable bias, misleading framing, or fear tactics
   - 4: Clear misinformation, extreme bias, us-vs-them framing
   - 5: Dangerous, radicalizing, or extremist content
4. reasoning: Brief explanation (max 20 words)

Return ONLY valid JSON:
{"primary_category": "...", "secondary_categories": [...], "radicalization_risk": 0, "reasoning": "..."}`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a media literacy expert. Categorize YouTube videos objectively. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from API');
  }

  // Parse JSON response
  let categorization;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    categorization = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[BubbleBreak BG] Parse error:', content);
    throw new Error('Failed to parse API response');
  }

  return {
    ...video,
    category: categorization.primary_category || 'other',
    secondaryCategories: categorization.secondary_categories || [],
    radicalizationRisk: categorization.radicalization_risk || 0,
    reasoning: categorization.reasoning || 'Categorized',
    categorizedAt: new Date().toISOString()
  };
}

// OpenAI Categorization
async function categorizeVideos(videos, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }

  const categorized = [];
  const batchSize = 5; // Process 5 videos at a time to reduce API calls
  
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    
    try {
      const results = await categorizeBatch(batch, apiKey);
      categorized.push(...results);
      
      // Send progress update
      chrome.runtime.sendMessage({
        action: 'categorizationProgress',
        progress: {
          completed: categorized.length,
          total: videos.length,
          percent: Math.round((categorized.length / videos.length) * 100)
        }
      }).catch(() => {});
      
    } catch (error) {
      console.error('[BubbleBreak BG] Batch categorization error:', error);
      // Add uncategorized entries for failed batch
      batch.forEach(video => {
        categorized.push({
          ...video,
          category: 'other',
          secondaryCategories: [],
          radicalizationRisk: 0,
          reasoning: 'Categorization failed',
          error: error.message
        });
      });
    }

    // Rate limiting: wait between batches
    if (i + batchSize < videos.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save categorized videos
  await saveCategorizedVideos(categorized);
  
  return { success: true, videos: categorized };
}

async function categorizeBatch(videos, apiKey) {
  const videosInfo = videos.map((v, idx) => 
    `[${idx}] Title: "${v.title}" | Channel: "${v.channelName}"`
  ).join('\n');

  const categoryList = CATEGORY_KEYS.join(', ');

  const prompt = `Analyze these YouTube videos and categorize each one. Be objective and evidence-based.

Videos:
${videosInfo}

Available categories: ${categoryList}

For each video, provide:
1. primary_category: The main category (must be from the list above)
2. secondary_categories: Up to 2 additional relevant categories
3. radicalization_risk: Score 0-5 based on:
   - 0: Standard, neutral content
   - 1-2: Slight bias or sensationalism
   - 3: Notable bias, misleading framing, or fear tactics
   - 4: Clear misinformation, extreme bias, us-vs-them framing
   - 5: Dangerous, radicalizing, or extremist content
4. reasoning: Brief explanation (max 20 words)

IMPORTANT: Base your assessment on the title and channel name. If unsure, default to lower risk scores.

Return a JSON array with objects for each video index:
[
  {"index": 0, "primary_category": "...", "secondary_categories": [...], "radicalization_risk": 0, "reasoning": "..."},
  ...
]

Return ONLY valid JSON, no other text.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a media literacy expert analyzing YouTube content for educational purposes. Categorize videos objectively based on their titles and channels. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from API');
  }

  // Parse the JSON response
  let categorizations;
  try {
    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }
    categorizations = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('[BubbleBreak BG] JSON parse error:', content);
    throw new Error('Failed to parse API response');
  }

  // Merge categorizations with original video data
  return videos.map((video, idx) => {
    const cat = categorizations.find(c => c.index === idx) || {};
    return {
      ...video,
      category: cat.primary_category || 'other',
      secondaryCategories: cat.secondary_categories || [],
      radicalizationRisk: cat.radicalization_risk || 0,
      reasoning: cat.reasoning || 'Unable to categorize',
      categorizedAt: new Date().toISOString()
    };
  });
}

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[BubbleBreak BG] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Open welcome/setup page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/dashboard/dashboard.html')
    });
  }
});

console.log('[BubbleBreak BG] Background service worker started');
