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
  SETTINGS: 'bubblebreak_settings',
  BLACKOUT: 'bubblebreak_blackout'
};

// Blackout thresholds
const BLACKOUT_THRESHOLDS = {
  ACTIVATE: 2.5,    // Activate when avg risk >= 2.5
  DEACTIVATE: 2.0,  // Deactivate when avg risk < 2.0 (hysteresis)
  MIN_VIDEOS: 5     // Minimum videos required to trigger blackout
};

// High-risk categories that contribute more to blackout
const HIGH_RISK_CATEGORIES = [
  'conspiracy_content', 'pseudoscience', 'extremist_content', 'misinformation'
];

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

    case 'getBlackoutState':
      getBlackoutState()
        .then(state => sendResponse({ state }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'checkBlackout':
      checkAndUpdateBlackoutState()
        .then(state => sendResponse({ state }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'generateRecommendations':
      generateCounterRecommendations()
        .then(recommendations => sendResponse({ recommendations }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'disableBlackout':
      disableBlackout()
        .then(() => sendResponse({ success: true }))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'trackRecoveryVideo':
      // Track a video watched from recommendations (gives recovery bonus)
      trackRecoveryVideo(request.video, request.recommendationQuery)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ error: err.message }));
      return true;

    case 'getRecoveryProgress':
      getRecoveryProgress()
        .then(progress => sendResponse({ progress }))
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

// ==========================================
// BLACKOUT STATE MANAGEMENT
// ==========================================

// Get current blackout state
async function getBlackoutState() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BLACKOUT);
  return result[STORAGE_KEYS.BLACKOUT] || {
    isActive: false,
    activatedAt: null,
    triggerRisk: 0,
    avgRisk: 0,
    problematicCategories: [],
    recommendations: []
  };
}

// Save blackout state
async function saveBlackoutState(state) {
  await chrome.storage.local.set({ [STORAGE_KEYS.BLACKOUT]: state });
  
  // Notify all YouTube tabs about state change
  try {
    const tabs = await chrome.tabs.query({ url: '*://www.youtube.com/*' });
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'blackoutStateChanged',
        state: state
      }).catch(() => {});
    }
  } catch (e) {
    console.log('[BubbleBreak BG] Could not notify tabs:', e);
  }
}

// Calculate risk statistics from videos
function calculateRiskStats(videos) {
  if (!videos || videos.length === 0) {
    return { avgRisk: 0, highRiskCount: 0, problematicCategories: [] };
  }
  
  const totalRisk = videos.reduce((sum, v) => sum + (v.radicalizationRisk || 0), 0);
  const avgRisk = totalRisk / videos.length;
  
  // Count videos by category
  const categoryCount = {};
  const categoryRisk = {};
  
  videos.forEach(v => {
    const cat = v.category || 'other';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    categoryRisk[cat] = (categoryRisk[cat] || 0) + (v.radicalizationRisk || 0);
  });
  
  // Find problematic categories (high risk or in HIGH_RISK_CATEGORIES)
  const problematicCategories = Object.entries(categoryCount)
    .filter(([cat, count]) => {
      const avgCatRisk = categoryRisk[cat] / count;
      return HIGH_RISK_CATEGORIES.includes(cat) || avgCatRisk >= 3;
    })
    .map(([cat, count]) => ({
      category: cat,
      count: count,
      avgRisk: categoryRisk[cat] / count
    }))
    .sort((a, b) => b.avgRisk - a.avgRisk);
  
  const highRiskCount = videos.filter(v => (v.radicalizationRisk || 0) >= 3).length;
  
  return { avgRisk, highRiskCount, problematicCategories };
}

// Check and update blackout state based on current video data
async function checkAndUpdateBlackoutState() {
  const videos = await getCategorizedVideos();
  const currentState = await getBlackoutState();
  const { avgRisk, highRiskCount, problematicCategories } = calculateRiskStats(videos);
  
  console.log(`[BubbleBreak BG] Checking blackout: avgRisk=${avgRisk.toFixed(2)}, videos=${videos.length}, highRisk=${highRiskCount}`);
  
  // Not enough videos to make a determination
  if (videos.length < BLACKOUT_THRESHOLDS.MIN_VIDEOS) {
    console.log('[BubbleBreak BG] Not enough videos for blackout check');
    return currentState;
  }
  
  let newState = { ...currentState, avgRisk };
  
  // Check if we should activate blackout
  if (!currentState.isActive && avgRisk >= BLACKOUT_THRESHOLDS.ACTIVATE) {
    console.log('[BubbleBreak BG] ACTIVATING BLACKOUT - avg risk:', avgRisk);
    
    // Generate recommendations when activating
    const apiKey = await getApiKey();
    let recommendations = [];
    
    if (apiKey) {
      try {
        recommendations = await generateCounterRecommendations(problematicCategories, apiKey);
      } catch (e) {
        console.error('[BubbleBreak BG] Failed to generate recommendations:', e);
      }
    }
    
    newState = {
      isActive: true,
      activatedAt: new Date().toISOString(),
      triggerRisk: avgRisk,
      avgRisk: avgRisk,
      problematicCategories: problematicCategories,
      recommendations: recommendations
    };
    
    await saveBlackoutState(newState);
    return newState;
  }
  
  // Check if we should deactivate blackout (with hysteresis)
  if (currentState.isActive && avgRisk < BLACKOUT_THRESHOLDS.DEACTIVATE) {
    console.log('[BubbleBreak BG] DEACTIVATING BLACKOUT - avg risk:', avgRisk);
    
    newState = {
      isActive: false,
      activatedAt: null,
      triggerRisk: 0,
      avgRisk: avgRisk,
      problematicCategories: [],
      recommendations: []
    };
    
    await saveBlackoutState(newState);
    return newState;
  }
  
  // Update stats without changing active state
  newState.problematicCategories = problematicCategories;
  await saveBlackoutState(newState);
  
  return newState;
}

// Manually disable blackout (user override)
async function disableBlackout() {
  const state = {
    isActive: false,
    activatedAt: null,
    triggerRisk: 0,
    avgRisk: 0,
    problematicCategories: [],
    recommendations: [],
    userDisabled: true,
    disabledAt: new Date().toISOString()
  };
  await saveBlackoutState(state);
  console.log('[BubbleBreak BG] Blackout manually disabled by user');
}

// Track a video watched from recommendations (recovery bonus)
async function trackRecoveryVideo(video, recommendationQuery) {
  if (!video || !video.videoId) {
    throw new Error('Invalid video data');
  }
  
  console.log('[BubbleBreak BG] Tracking recovery video:', video.title, 'from query:', recommendationQuery);
  
  // Mark this as a recovery video
  video.isRecoveryVideo = true;
  video.recoveryQuery = recommendationQuery;
  
  // Track the video normally (it will be categorized)
  const result = await trackAndCategorizeVideo(video);
  
  // If categorized with low risk, give additional recovery credit
  if (result.video && result.video.radicalizationRisk <= 1) {
    console.log('[BubbleBreak BG] Good recovery video! Low risk:', result.video.radicalizationRisk);
    
    // Check and update blackout state
    const newState = await checkAndUpdateBlackoutState();
    
    // Notify about recovery progress
    chrome.runtime.sendMessage({
      action: 'recoveryProgress',
      progress: await getRecoveryProgress()
    }).catch(() => {});
    
    return { ...result, recoveryCredit: true, blackoutState: newState };
  }
  
  return result;
}

// Get recovery progress information
async function getRecoveryProgress() {
  const videos = await getCategorizedVideos();
  const blackoutState = await getBlackoutState();
  
  if (!blackoutState.isActive) {
    return {
      isRecovering: false,
      message: 'No active filter bubble'
    };
  }
  
  const { avgRisk } = calculateRiskStats(videos);
  const targetRisk = BLACKOUT_THRESHOLDS.DEACTIVATE;
  const currentRisk = avgRisk;
  const triggerRisk = blackoutState.triggerRisk || BLACKOUT_THRESHOLDS.ACTIVATE;
  
  // Calculate progress percentage (from trigger to target)
  const totalReduction = triggerRisk - targetRisk;
  const currentReduction = triggerRisk - currentRisk;
  const progressPercent = Math.min(100, Math.max(0, (currentReduction / totalReduction) * 100));
  
  // Count recovery videos watched
  const recoveryVideos = videos.filter(v => v.isRecoveryVideo).length;
  const lowRiskVideos = videos.filter(v => (v.radicalizationRisk || 0) <= 1).length;
  
  // Estimate videos needed to recover
  const riskPerVideo = 0.1; // Approximate impact per low-risk video
  const videosNeeded = Math.ceil((currentRisk - targetRisk) / riskPerVideo);
  
  return {
    isRecovering: true,
    currentRisk: currentRisk.toFixed(2),
    targetRisk: targetRisk.toFixed(2),
    triggerRisk: triggerRisk.toFixed(2),
    progressPercent: Math.round(progressPercent),
    recoveryVideosWatched: recoveryVideos,
    lowRiskVideosTotal: lowRiskVideos,
    estimatedVideosNeeded: Math.max(0, videosNeeded),
    message: progressPercent >= 100 
      ? 'Almost there! Your feed will be restored soon.'
      : `Watch ${Math.max(1, videosNeeded)} more balanced videos to recover.`
  };
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

      // Check if blackout should be triggered after this video
      const blackoutState = await checkAndUpdateBlackoutState();
      
      return { success: true, video: categorized, blackoutState };
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

// ==========================================
// COUNTER-RECOMMENDATIONS GENERATION
// ==========================================

// Generate counter-recommendation search queries using OpenAI
async function generateCounterRecommendations(problematicCategories, apiKey) {
  if (!apiKey) {
    apiKey = await getApiKey();
  }
  
  if (!apiKey) {
    console.log('[BubbleBreak BG] No API key for recommendations');
    return getDefaultRecommendations(problematicCategories);
  }
  
  // Get recent high-risk videos for context
  const videos = await getCategorizedVideos();
  const highRiskVideos = videos
    .filter(v => (v.radicalizationRisk || 0) >= 3)
    .slice(-10)
    .map(v => `- "${v.title}" (${v.category}, risk: ${v.radicalizationRisk})`);
  
  const categoriesInfo = problematicCategories
    .map(c => `- ${c.category}: ${c.count} videos, avg risk ${c.avgRisk.toFixed(1)}`)
    .join('\n');
  
  const prompt = `You are helping a user break out of a YouTube filter bubble. They have been watching content that may be leading them toward misinformation or extreme viewpoints.

Their problematic viewing patterns:
${categoriesInfo}

Recent high-risk videos they watched:
${highRiskVideos.join('\n')}

Generate 5 YouTube search queries that would help this user:
1. Find balanced, factual content on similar topics
2. Expose them to different perspectives
3. Lead them to authoritative, trustworthy sources
4. Help them develop critical thinking about these topics

Requirements:
- Queries should be related to their interests but from credible sources
- Include searches for fact-checking, educational, and mainstream news content
- Suggest queries for media literacy and critical thinking
- Make queries specific and searchable on YouTube

Return ONLY a JSON array:
[
  {"query": "YouTube search query here", "reason": "Why this helps balance their view (max 15 words)"},
  ...
]`;

  try {
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
            content: 'You are a media literacy expert helping users break out of filter bubbles. Generate helpful YouTube search queries. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from API');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const recommendations = JSON.parse(jsonMatch[0]);
    
    // Add YouTube search URLs
    return recommendations.map(rec => ({
      ...rec,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.query)}`
    }));
    
  } catch (error) {
    console.error('[BubbleBreak BG] Failed to generate recommendations:', error);
    return getDefaultRecommendations(problematicCategories);
  }
}

// Default recommendations when API is unavailable
function getDefaultRecommendations(problematicCategories) {
  const defaults = [
    {
      query: "media literacy how to spot misinformation",
      reason: "Learn to identify misleading content"
    },
    {
      query: "fact checking techniques for news",
      reason: "Develop skills to verify information"
    },
    {
      query: "multiple perspectives on current events",
      reason: "See different viewpoints on issues"
    },
    {
      query: "critical thinking skills education",
      reason: "Strengthen analytical abilities"
    },
    {
      query: "reliable news sources explained",
      reason: "Find trustworthy information sources"
    }
  ];
  
  return defaults.map(rec => ({
    ...rec,
    searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(rec.query)}`
  }));
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
