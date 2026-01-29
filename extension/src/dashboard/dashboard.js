// BubbleBreak Dashboard - D3 Zoomable Circle Packing Visualization

// Category taxonomy with colors
const CATEGORY_TAXONOMY = {
  entertainment: { label: "Entertainment", color: "#4CAF50" },
  gaming: { label: "Gaming", color: "#9C27B0" },
  education: { label: "Education", color: "#2196F3" },
  lifestyle: { label: "Lifestyle", color: "#FF9800" },
  news: { label: "News", color: "#607D8B" },
  tech: { label: "Technology", color: "#00BCD4" },
  sports: { label: "Sports", color: "#8BC34A" },
  music: { label: "Music", color: "#E91E63" },
  political_left: { label: "Political (Left)", color: "#3F51B5" },
  political_right: { label: "Political (Right)", color: "#F44336" },
  political_centrist: { label: "Political (Centrist)", color: "#9E9E9E" },
  alternative_media: { label: "Alternative Media", color: "#795548" },
  conspiracy_content: { label: "Conspiracy Content", color: "#FF5722", riskLevel: "high" },
  pseudoscience: { label: "Pseudoscience", color: "#FF7043", riskLevel: "medium" },
  extremist_content: { label: "Extremist Content", color: "#D32F2F", riskLevel: "high" },
  misinformation: { label: "Misinformation", color: "#E64A19", riskLevel: "medium" },
  other: { label: "Other", color: "#BDBDBD" }
};

const RISK_LEVELS = {
  0: { label: "None", color: "#4CAF50", description: "Standard content" },
  1: { label: "Low", color: "#8BC34A", description: "Slight bias or sensationalism" },
  2: { label: "Moderate", color: "#FFC107", description: "Notable bias or misleading" },
  3: { label: "Elevated", color: "#FF9800", description: "Significant concerns" },
  4: { label: "High", color: "#FF5722", description: "Clear misinformation" },
  5: { label: "Severe", color: "#F44336", description: "Dangerous content" }
};

// DOM Elements
const loadingEl = document.getElementById('loading');
const emptyStateEl = document.getElementById('emptyState');
const vizEl = document.getElementById('visualization');
const instructionsEl = document.getElementById('instructions');
const tooltipEl = document.getElementById('tooltip');
const sidebarEl = document.getElementById('sidebar');

const totalVideosEl = document.getElementById('totalVideos');
const totalCategoriesEl = document.getElementById('totalCategories');
const avgRiskEl = document.getElementById('avgRisk');
const userRiskMarkerEl = document.getElementById('userRiskMarker');
const riskLegendEl = document.getElementById('riskLegend');
const categoryListEl = document.getElementById('categoryList');
const btnGetStarted = document.getElementById('btnGetStarted');
const btnRefresh = document.getElementById('btnRefresh');
const btnClearData = document.getElementById('btnClearData');
const toggleHighRisk = document.getElementById('toggleHighRisk');

// Modal elements
const customModal = document.getElementById('customModal');
const modalIcon = document.getElementById('modalIcon');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalConfirm = document.getElementById('modalConfirm');
const modalCancel = document.getElementById('modalCancel');

// Chart modal elements
const chartModal = document.getElementById('chartModal');
const chartCloseBtn = document.getElementById('chartCloseBtn');
const btnShowChart = document.getElementById('btnShowChart');
const chartContainer = document.getElementById('chartContainer');
const chartStats = document.getElementById('chartStats');

// Theme toggle elements
const btnToggleTheme = document.getElementById('btnToggleTheme');
const themeIcon = document.getElementById('themeIcon');

let categorizedVideos = [];
let hierarchyData = null;
let showHighRiskOnly = false;
let isDarkMode = true;

// Custom modal function
function showModal(options) {
  return new Promise((resolve) => {
    modalIcon.textContent = options.icon || '⚠️';
    modalTitle.textContent = options.title || 'Confirm';
    modalMessage.textContent = options.message || 'Are you sure?';
    modalConfirm.textContent = options.confirmText || 'Confirm';
    modalCancel.textContent = options.cancelText || 'Cancel';
    
    // Style confirm button
    modalConfirm.className = 'modal-btn modal-btn-confirm' + (options.danger ? '' : ' primary');
    
    customModal.classList.add('active');
    
    const handleConfirm = () => {
      customModal.classList.remove('active');
      cleanup();
      resolve(true);
    };
    
    const handleCancel = () => {
      customModal.classList.remove('active');
      cleanup();
      resolve(false);
    };
    
    const handleBackdrop = (e) => {
      if (e.target === customModal) {
        handleCancel();
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    const cleanup = () => {
      modalConfirm.removeEventListener('click', handleConfirm);
      modalCancel.removeEventListener('click', handleCancel);
      customModal.removeEventListener('click', handleBackdrop);
      document.removeEventListener('keydown', handleEscape);
    };
    
    modalConfirm.addEventListener('click', handleConfirm);
    modalCancel.addEventListener('click', handleCancel);
    customModal.addEventListener('click', handleBackdrop);
    document.addEventListener('keydown', handleEscape);
  });
}

// Update risk meter visualization
function updateRiskMeter(riskValue) {
  if (!userRiskMarkerEl) return;
  
  // Clamp value between 0 and 5
  const clampedRisk = Math.max(0, Math.min(5, riskValue || 0));
  
  // Convert to percentage (0-5 -> 0-100%)
  const percentage = (clampedRisk / 5) * 100;
  
  // Update marker position
  userRiskMarkerEl.style.left = `${percentage}%`;
  
  // Update marker color based on risk level
  const markerValue = userRiskMarkerEl.querySelector('.risk-marker-value');
  if (markerValue) {
    // Color gradient from green to red
    if (clampedRisk < 1) {
      markerValue.style.color = '#4CAF50';
    } else if (clampedRisk < 2) {
      markerValue.style.color = '#8BC34A';
    } else if (clampedRisk < 3) {
      markerValue.style.color = '#FFC107';
    } else if (clampedRisk < 4) {
      markerValue.style.color = '#FF9800';
    } else if (clampedRisk < 4.5) {
      markerValue.style.color = '#FF5722';
    } else {
      markerValue.style.color = '#F44336';
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  
  // Initialize risk meter to 0
  updateRiskMeter(0);
  
  await loadData();
  
  if (categorizedVideos.length > 0) {
    processData();
    renderSidebar();
    showVisualization(); // Show container FIRST so it has dimensions
    // Small delay to ensure container is visible before rendering D3
    setTimeout(() => {
      renderVisualization();
    }, 50);
  } else {
    showEmptyState();
  }
});

// Get Started button
btnGetStarted.addEventListener('click', () => {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({ action: 'openYouTubeHistory' });
  } else {
    window.open('https://www.youtube.com/feed/history', '_blank');
  }
});

// Load Sample Data button (for demo/testing)
const btnLoadSample = document.getElementById('btnLoadSample');
btnLoadSample.addEventListener('click', () => {
  if (typeof loadSampleData === 'function') {
    categorizedVideos = loadSampleData();
    processData();
    renderSidebar();
    showVisualization(); // Show container FIRST so it has dimensions
    // Small delay to ensure container is visible before rendering D3
    setTimeout(() => {
      renderVisualization();
    }, 50);
  } else {
    alert('Sample data not available');
  }
});

// Refresh button
if (btnRefresh) {
  btnRefresh.addEventListener('click', async () => {
    btnRefresh.style.transform = 'rotate(360deg)';
    btnRefresh.style.transition = 'transform 0.5s';
    
    await loadData();
    
    if (categorizedVideos.length > 0) {
      processData();
      renderSidebar();
      showVisualization();
      setTimeout(() => {
        renderVisualization();
      }, 50);
    } else {
      showEmptyState();
    }
    
    setTimeout(() => {
      btnRefresh.style.transform = '';
    }, 500);
  });
}

// Clear Data button
if (btnClearData) {
  btnClearData.addEventListener('click', async () => {
    const confirmed = await showModal({
      icon: '🗑️',
      title: 'Clear All Data?',
      message: 'This will permanently delete all your tracked videos and categories. This action cannot be undone.',
      confirmText: 'Delete All',
      cancelText: 'Keep Data',
      danger: true
    });
    
    if (!confirmed) return;
    
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        await chrome.runtime.sendMessage({ action: 'clearData' });
      }
      
      categorizedVideos = [];
      hierarchyData = null;
      
      // Reset stats
      totalVideosEl.textContent = '0';
      totalCategoriesEl.textContent = '0';
      avgRiskEl.textContent = '0.0';
      updateRiskMeter(0);
      
      // Clear visualization
      vizEl.innerHTML = '';
      
      // Show empty state
      showEmptyState();
      
      // Show success modal
      await showModal({
        icon: '✅',
        title: 'Data Cleared',
        message: 'All your tracked videos have been successfully deleted.',
        confirmText: 'OK',
        cancelText: 'OK',
        danger: false
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      await showModal({
        icon: '❌',
        title: 'Error',
        message: 'Failed to clear data. Please try again.',
        confirmText: 'OK',
        cancelText: 'OK',
        danger: true
      });
    }
  });
}

// Toggle High Risk Filter
if (toggleHighRisk) {
  toggleHighRisk.addEventListener('change', () => {
    showHighRiskOnly = toggleHighRisk.checked;
    if (categorizedVideos.length > 0) {
      processData();
      renderSidebar();
      showVisualization();
      setTimeout(() => {
        renderVisualization();
      }, 50);
    }
  });
}

// Show Chart button
if (btnShowChart) {
  btnShowChart.addEventListener('click', () => {
    showChartModal();
  });
}

// Close chart modal
if (chartCloseBtn) {
  chartCloseBtn.addEventListener('click', () => {
    hideChartModal();
  });
}

// Close chart modal on outside click
if (chartModal) {
  chartModal.addEventListener('click', (e) => {
    if (e.target === chartModal) {
      hideChartModal();
    }
  });
}

// Theme toggle functionality
function setTheme(dark) {
  isDarkMode = dark;
  if (dark) {
    document.body.classList.remove('light-mode');
    if (themeIcon) themeIcon.textContent = '🌙';
  } else {
    document.body.classList.add('light-mode');
    if (themeIcon) themeIcon.textContent = '☀️';
  }
  // Save preference
  localStorage.setItem('bubblebreak-theme', dark ? 'dark' : 'light');
  
  // Update SVG background if it exists
  const svgEl = document.getElementById('bubbleVizSvg');
  if (svgEl) {
    const svgBackground = dark 
      ? 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)'
      : 'radial-gradient(circle at center, #f5f7fa 0%, #e4e8ec 100%)';
    svgEl.style.background = svgBackground;
  }
}

function toggleTheme() {
  setTheme(!isDarkMode);
}

// Initialize theme from localStorage
function initTheme() {
  const savedTheme = localStorage.getItem('bubblebreak-theme');
  if (savedTheme === 'light') {
    setTheme(false);
  } else {
    setTheme(true);
  }
}

// Theme toggle button
if (btnToggleTheme) {
  btnToggleTheme.addEventListener('click', toggleTheme);
}

// Initialize theme on load
initTheme();

// Export Data button - Export as CSV for research
const btnExport = document.getElementById('btnExport');
if (btnExport) {
  btnExport.addEventListener('click', () => {
    if (categorizedVideos.length === 0) {
      alert('No data to export. Start tracking videos first!');
      return;
    }
    
    exportToCSV(categorizedVideos);
  });
}

// Export data to CSV file
function exportToCSV(videos) {
  // Define CSV columns - includes risk evolution data for research
  const columns = [
    'video_id',
    'title',
    'channel_name',
    'channel_url',
    'duration',
    'views',
    'likes',
    'subscribers',
    'upload_date',
    'category',
    'radicalization_risk',
    'ai_reasoning',
    'description',
    'thumbnail_url',
    'video_url',
    'scraped_at',
    // Risk evolution columns for research
    'sequence_number',
    'running_simple_avg',
    'running_ema',
    'running_combined_risk',
    'streak_at_time',
    'is_recovery_video'
  ];
  
  // Clean text fields - remove line breaks, tabs, and normalize whitespace
  function cleanText(field) {
    if (field === null || field === undefined) return '';
    return String(field)
      .replace(/[\r\n\t]+/g, ' ')  // Replace line breaks and tabs with space
      .replace(/\s+/g, ' ')         // Normalize multiple spaces to single space
      .trim();                       // Remove leading/trailing whitespace
  }
  
  // Escape CSV field (handle commas and quotes)
  function escapeCSV(field) {
    if (field === null || field === undefined) return '';
    const str = String(field);
    // If field contains comma or quote, wrap in quotes and escape internal quotes
    if (str.includes(',') || str.includes('"')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }
  
  // Calculate risk evolution for each video in chronological order
  const evolution = calculateRiskEvolution(videos);
  
  // Create a map of videoId to evolution data
  const evolutionMap = new Map();
  
  // Sort videos by timestamp for evolution mapping
  const sortedVideos = [...videos].sort((a, b) => {
    const timeA = new Date(a.scrapedAt || a.categorizedAt || 0).getTime();
    const timeB = new Date(b.scrapedAt || b.categorizedAt || 0).getTime();
    return timeA - timeB;
  });
  
  sortedVideos.forEach((video, index) => {
    if (evolution[index]) {
      evolutionMap.set(video.videoId, evolution[index]);
    }
  });
  
  // Build CSV content with UTF-8 BOM for Excel compatibility
  // The BOM (\uFEFF) tells Excel to interpret the file as UTF-8
  let csvContent = '\uFEFF' + columns.join(',') + '\n';
  
  // Export in chronological order for research analysis
  for (const video of sortedVideos) {
    const evo = evolutionMap.get(video.videoId) || {};
    
    const row = [
      video.videoId || '',
      cleanText(video.title),
      cleanText(video.channelName),
      video.channelUrl || '',
      video.duration || '',
      video.views || '',
      video.likes || '',
      video.subscribers || '',
      video.uploadDate || '',
      video.category || 'uncategorized',
      video.radicalizationRisk !== undefined ? video.radicalizationRisk : '',
      cleanText(video.reasoning),
      cleanText(video.description),
      video.thumbnail || '',
      video.url || '',
      video.scrapedAt || '',
      // Risk evolution data
      evo.index || '',
      evo.simpleAvg !== undefined ? evo.simpleAvg.toFixed(4) : '',
      evo.emaRisk !== undefined ? evo.emaRisk.toFixed(4) : '',
      evo.combinedRisk !== undefined ? evo.combinedRisk.toFixed(4) : '',
      evo.streak !== undefined ? evo.streak : '',
      video.isRecoveryVideo ? 'true' : 'false'
    ];
    
    csvContent += row.map(escapeCSV).join(',') + '\n';
  }
  
  // Create and download the file with UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Generate filename with date
  const date = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `bubblebreak_export_${date}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  URL.revokeObjectURL(url);
  
  console.log(`📤 Exported ${videos.length} videos to CSV with risk evolution data`);
}

// Show states
function showLoading() {
  loadingEl.classList.add('active');
  emptyStateEl.classList.remove('active');
  vizEl.style.display = 'none';
  instructionsEl.style.display = 'none';
}

function showEmptyState() {
  loadingEl.classList.remove('active');
  emptyStateEl.classList.add('active');
  vizEl.style.display = 'none';
  instructionsEl.style.display = 'none';
  sidebarEl.style.display = 'none';
}

function showVisualization() {
  loadingEl.classList.remove('active');
  emptyStateEl.classList.remove('active');
  vizEl.style.display = 'block';
  instructionsEl.style.display = 'block';
  sidebarEl.style.display = 'block';
}

// Load data from storage
async function loadData() {
  // Check if running in Chrome extension context
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCategorizedVideos' });
      categorizedVideos = response.videos || [];
      console.log(`Loaded ${categorizedVideos.length} categorized videos`);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  } else {
    // Running outside extension (for development/testing)
    console.log('Running outside Chrome extension context');
    categorizedVideos = [];
  }
}

// Process data for visualization
function processData() {
  // Filter videos based on high risk toggle
  const videosToProcess = showHighRiskOnly 
    ? categorizedVideos.filter(v => (v.radicalizationRisk || 0) >= 2.5)
    : categorizedVideos;
  
  // Group by category
  const categoryGroups = {};
  
  videosToProcess.forEach(video => {
    const cat = video.category || 'other';
    if (!categoryGroups[cat]) {
      categoryGroups[cat] = {
        name: cat,
        label: CATEGORY_TAXONOMY[cat]?.label || cat,
        color: CATEGORY_TAXONOMY[cat]?.color || '#BDBDBD',
        children: []
      };
    }
    
    categoryGroups[cat].children.push({
      name: video.title,
      videoId: video.videoId,
      channel: video.channelName,
      channelUrl: video.channelUrl,
      url: video.url,
      duration: video.duration,
      views: video.views,
      likes: video.likes,
      subscribers: video.subscribers,
      uploadDate: video.uploadDate,
      description: video.description,
      thumbnail: video.thumbnail,
      risk: video.radicalizationRisk || 0,
      reasoning: video.reasoning,
      secondaryCategories: video.secondaryCategories,
      value: 1
    });
  });

  // Build hierarchy - filter out empty categories
  hierarchyData = {
    name: showHighRiskOnly ? "High Risk Content (≥2.5)" : "Your Watch History",
    children: Object.values(categoryGroups).filter(cat => cat.children.length > 0)
  };

  // Update stats - show filtered count if toggle is on
  if (showHighRiskOnly) {
    totalVideosEl.textContent = `${videosToProcess.length}/${categorizedVideos.length}`;
  } else {
    totalVideosEl.textContent = categorizedVideos.length;
  }
  totalCategoriesEl.textContent = Object.keys(categoryGroups).filter(k => categoryGroups[k].children.length > 0).length;
  
  // Calculate risk using EMA + Streak (same as background)
  const riskStats = calculateAdvancedRiskStats(categorizedVideos);
  avgRiskEl.textContent = riskStats.avgRisk.toFixed(1);
  
  // Update risk meter position (0-5 scale to 0-100%)
  updateRiskMeter(riskStats.avgRisk);
  
  // Update streak indicator
  const streakEl = document.getElementById('currentStreak');
  const streakContainer = document.getElementById('streakContainer');
  if (streakEl && streakContainer) {
    streakEl.textContent = riskStats.currentStreak;
    // Show streak indicator only when there's an active streak
    streakContainer.style.display = riskStats.currentStreak > 0 ? 'flex' : 'none';
  }
}

// ==========================================
// ADVANCED RISK CALCULATION (EMA + Streak)
// Mirrors the background.js calculation
// ==========================================

const EMA_ALPHA = 0.15;
const STREAK_CONFIG = {
  HIGH_RISK_THRESHOLD: 2.5,
  MULTIPLIER_BASE: 1.15,
  MAX_MULTIPLIER: 2.0,
  RESET_REDUCTION: 2
};

function calculateAdvancedRiskStats(videos) {
  if (!videos || videos.length === 0) {
    return { avgRisk: 0, emaRisk: 0, simpleAvgRisk: 0, currentStreak: 0 };
  }
  
  // Simple average
  const totalRisk = videos.reduce((sum, v) => sum + (v.radicalizationRisk || 0), 0);
  const simpleAvgRisk = totalRisk / videos.length;
  
  // Sort by timestamp (oldest first)
  const sorted = [...videos].sort((a, b) => {
    const timeA = new Date(a.scrapedAt || a.categorizedAt || 0).getTime();
    const timeB = new Date(b.scrapedAt || b.categorizedAt || 0).getTime();
    return timeA - timeB;
  });
  
  // Calculate EMA
  let emaRisk = sorted[0].radicalizationRisk || 0;
  for (let i = 1; i < sorted.length; i++) {
    const risk = sorted[i].radicalizationRisk || 0;
    emaRisk = EMA_ALPHA * risk + (1 - EMA_ALPHA) * emaRisk;
  }
  
  // Calculate streak-adjusted EMA
  let consecutiveHighRisk = 0;
  let adjustedEMA = sorted[0].radicalizationRisk || 0;
  
  for (let i = 0; i < sorted.length; i++) {
    const baseRisk = sorted[i].radicalizationRisk || 0;
    let effectiveRisk = baseRisk;
    
    if (baseRisk >= STREAK_CONFIG.HIGH_RISK_THRESHOLD) {
      consecutiveHighRisk++;
      const streakMultiplier = Math.min(
        Math.pow(STREAK_CONFIG.MULTIPLIER_BASE, consecutiveHighRisk - 1),
        STREAK_CONFIG.MAX_MULTIPLIER
      );
      effectiveRisk = Math.min(baseRisk * streakMultiplier, 5);
    } else {
      consecutiveHighRisk = Math.max(0, consecutiveHighRisk - STREAK_CONFIG.RESET_REDUCTION);
    }
    
    if (i === 0) {
      adjustedEMA = effectiveRisk;
    } else {
      adjustedEMA = EMA_ALPHA * effectiveRisk + (1 - EMA_ALPHA) * adjustedEMA;
    }
  }
  
  // Final combined score
  const avgRisk = 0.7 * adjustedEMA + 0.3 * emaRisk;
  
  return {
    avgRisk,
    emaRisk,
    simpleAvgRisk,
    currentStreak: consecutiveHighRisk
  };
}

// ==========================================
// RISK EVOLUTION CHART
// ==========================================

function calculateRiskEvolution(videos) {
  if (!videos || videos.length === 0) return [];
  
  // Sort by timestamp
  const sorted = [...videos].sort((a, b) => {
    const timeA = new Date(a.scrapedAt || a.categorizedAt || 0).getTime();
    const timeB = new Date(b.scrapedAt || b.categorizedAt || 0).getTime();
    return timeA - timeB;
  });
  
  const evolution = [];
  let runningSum = 0;
  let ema = 0;
  let adjustedEMA = 0;
  let consecutiveHighRisk = 0;
  
  for (let i = 0; i < sorted.length; i++) {
    const video = sorted[i];
    const risk = video.radicalizationRisk || 0;
    runningSum += risk;
    
    // Simple average
    const simpleAvg = runningSum / (i + 1);
    
    // EMA
    if (i === 0) {
      ema = risk;
      adjustedEMA = risk;
    } else {
      ema = EMA_ALPHA * risk + (1 - EMA_ALPHA) * ema;
    }
    
    // Streak-adjusted
    let effectiveRisk = risk;
    if (risk >= STREAK_CONFIG.HIGH_RISK_THRESHOLD) {
      consecutiveHighRisk++;
      const multiplier = Math.min(
        Math.pow(STREAK_CONFIG.MULTIPLIER_BASE, consecutiveHighRisk - 1),
        STREAK_CONFIG.MAX_MULTIPLIER
      );
      effectiveRisk = Math.min(risk * multiplier, 5);
    } else {
      consecutiveHighRisk = Math.max(0, consecutiveHighRisk - STREAK_CONFIG.RESET_REDUCTION);
    }
    
    if (i > 0) {
      adjustedEMA = EMA_ALPHA * effectiveRisk + (1 - EMA_ALPHA) * adjustedEMA;
    }
    
    const combinedRisk = 0.7 * adjustedEMA + 0.3 * ema;
    
    evolution.push({
      index: i + 1,
      timestamp: new Date(video.scrapedAt || video.categorizedAt),
      title: video.title,
      videoRisk: risk,
      simpleAvg: simpleAvg,
      emaRisk: ema,
      combinedRisk: combinedRisk,
      streak: consecutiveHighRisk
    });
  }
  
  return evolution;
}

function renderRiskChart() {
  const evolution = calculateRiskEvolution(categorizedVideos);
  
  if (evolution.length < 2) {
    chartContainer.innerHTML = `
      <div style="text-align: center; padding: 60px; color: #8892b0;">
        <p style="font-size: 48px; margin-bottom: 20px;">📊</p>
        <p>Need at least 2 videos to show evolution chart.</p>
        <p style="font-size: 14px; margin-top: 10px;">Currently tracking: ${evolution.length} video(s)</p>
      </div>
    `;
    chartStats.innerHTML = '';
    return;
  }
  
  // Reset container
  chartContainer.innerHTML = '<svg id="riskChart"></svg>';
  
  const svg = d3.select('#riskChart');
  const containerRect = chartContainer.getBoundingClientRect();
  const margin = { top: 30, right: 30, bottom: 50, left: 50 };
  const width = Math.max(600, containerRect.width - 40) - margin.left - margin.right;
  const height = 320 - margin.top - margin.bottom;
  
  svg.attr('width', width + margin.left + margin.right)
     .attr('height', height + margin.top + margin.bottom);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Scales
  const x = d3.scaleLinear()
    .domain([1, evolution.length])
    .range([0, width]);
  
  const y = d3.scaleLinear()
    .domain([0, 5])
    .range([height, 0]);
  
  // Gradient for background zones
  const gradient = g.append('defs')
    .append('linearGradient')
    .attr('id', 'riskGradient')
    .attr('x1', '0%').attr('y1', '100%')
    .attr('x2', '0%').attr('y2', '0%');
  
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#4CAF50').attr('stop-opacity', 0.1);
  gradient.append('stop').attr('offset', '50%').attr('stop-color', '#FFC107').attr('stop-opacity', 0.1);
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#F44336').attr('stop-opacity', 0.1);
  
  g.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'url(#riskGradient)');
  
  // Blackout threshold line
  g.append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', y(2.5))
    .attr('y2', y(2.5))
    .attr('stroke', '#f87171')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '8,4')
    .attr('opacity', 0.8);
  
  g.append('text')
    .attr('x', width - 5)
    .attr('y', y(2.5) - 8)
    .attr('text-anchor', 'end')
    .attr('fill', '#f87171')
    .attr('font-size', '11px')
    .text('Blackout Threshold');
  
  // Axes
  const xAxis = d3.axisBottom(x)
    .ticks(Math.min(evolution.length, 10))
    .tickFormat(d => `#${d}`);
  
  const yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickFormat(d => d.toFixed(1));
  
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .attr('color', '#8892b0');
  
  g.append('g')
    .call(yAxis)
    .attr('color', '#8892b0');
  
  // X axis label
  g.append('text')
    .attr('x', width / 2)
    .attr('y', height + 40)
    .attr('text-anchor', 'middle')
    .attr('fill', '#8892b0')
    .attr('font-size', '12px')
    .text('Video #');
  
  // Y axis label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -35)
    .attr('text-anchor', 'middle')
    .attr('fill', '#8892b0')
    .attr('font-size', '12px')
    .text('Risk Score');
  
  // Line generators
  const lineSimple = d3.line()
    .x(d => x(d.index))
    .y(d => y(d.simpleAvg))
    .curve(d3.curveMonotoneX);
  
  const lineCombined = d3.line()
    .x(d => x(d.index))
    .y(d => y(d.combinedRisk))
    .curve(d3.curveMonotoneX);
  
  // Draw simple average line
  g.append('path')
    .datum(evolution)
    .attr('fill', 'none')
    .attr('stroke', '#8892b0')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,4')
    .attr('d', lineSimple);
  
  // Draw combined risk line
  g.append('path')
    .datum(evolution)
    .attr('fill', 'none')
    .attr('stroke', '#64ffda')
    .attr('stroke-width', 3)
    .attr('d', lineCombined);
  
  // Add dots for each video
  g.selectAll('.dot-combined')
    .data(evolution)
    .enter()
    .append('circle')
    .attr('class', 'dot-combined')
    .attr('cx', d => x(d.index))
    .attr('cy', d => y(d.combinedRisk))
    .attr('r', 5)
    .attr('fill', '#64ffda')
    .attr('stroke', '#0a192f')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 8);
      showChartTooltip(event, d);
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 5);
      hideChartTooltip();
    });
  
  // Update stats
  const latest = evolution[evolution.length - 1];
  const highest = evolution.reduce((max, d) => d.combinedRisk > max.combinedRisk ? d : max, evolution[0]);
  const lowest = evolution.reduce((min, d) => d.combinedRisk < min.combinedRisk ? d : min, evolution[0]);
  const trend = evolution.length > 5 
    ? (latest.combinedRisk - evolution[evolution.length - 6].combinedRisk).toFixed(2)
    : 'N/A';
  
  chartStats.innerHTML = `
    <div class="chart-stat">
      <div class="chart-stat-value">${latest.combinedRisk.toFixed(2)}</div>
      <div class="chart-stat-label">Current Risk</div>
    </div>
    <div class="chart-stat">
      <div class="chart-stat-value" style="color: #f87171;">${highest.combinedRisk.toFixed(2)}</div>
      <div class="chart-stat-label">Peak Risk (#${highest.index})</div>
    </div>
    <div class="chart-stat">
      <div class="chart-stat-value" style="color: #4CAF50;">${lowest.combinedRisk.toFixed(2)}</div>
      <div class="chart-stat-label">Lowest (#${lowest.index})</div>
    </div>
    <div class="chart-stat">
      <div class="chart-stat-value" style="color: ${trend !== 'N/A' && parseFloat(trend) > 0 ? '#f87171' : '#4CAF50'};">
        ${trend !== 'N/A' ? (parseFloat(trend) > 0 ? '↑' : '↓') + ' ' + Math.abs(parseFloat(trend)).toFixed(2) : trend}
      </div>
      <div class="chart-stat-label">Last 5 Trend</div>
    </div>
  `;
}

// Chart tooltip
let chartTooltipEl = null;

function showChartTooltip(event, d) {
  if (!chartTooltipEl) {
    chartTooltipEl = document.createElement('div');
    chartTooltipEl.style.cssText = `
      position: fixed;
      background: rgba(17, 34, 64, 0.95);
      border: 1px solid rgba(100, 255, 218, 0.3);
      border-radius: 8px;
      padding: 12px;
      font-size: 12px;
      color: #ccd6f6;
      pointer-events: none;
      z-index: 100001;
      max-width: 250px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(chartTooltipEl);
  }
  
  const riskColor = d.videoRisk >= 3 ? '#f87171' : d.videoRisk >= 2 ? '#FFC107' : '#4CAF50';
  
  chartTooltipEl.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px; color: #64ffda;">Video #${d.index}</div>
    <div style="margin-bottom: 6px; font-size: 11px; color: #8892b0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${d.title}</div>
    <div style="display: grid; gap: 4px; font-size: 11px;">
      <div>Video Risk: <span style="color: ${riskColor}; font-weight: 600;">${d.videoRisk}</span></div>
      <div>Combined: <span style="color: #64ffda; font-weight: 600;">${d.combinedRisk.toFixed(2)}</span></div>
      <div>Simple Avg: <span style="color: #8892b0;">${d.simpleAvg.toFixed(2)}</span></div>
      ${d.streak > 0 ? `<div>Streak: <span style="color: #f87171;">🔥 ${d.streak}</span></div>` : ''}
    </div>
  `;
  
  chartTooltipEl.style.display = 'block';
  chartTooltipEl.style.left = `${event.clientX + 15}px`;
  chartTooltipEl.style.top = `${event.clientY - 10}px`;
}

function hideChartTooltip() {
  if (chartTooltipEl) {
    chartTooltipEl.style.display = 'none';
  }
}

function showChartModal() {
  chartModal.classList.add('active');
  renderRiskChart();
}

function hideChartModal() {
  chartModal.classList.remove('active');
  hideChartTooltip();
}

// Render sidebar
function renderSidebar() {
  // Risk legend
  riskLegendEl.innerHTML = Object.entries(RISK_LEVELS).map(([level, info]) => {
    const count = categorizedVideos.filter(v => (v.radicalizationRisk || 0) === parseInt(level)).length;
    return `
      <div class="risk-item">
        <div class="risk-dot" style="background: ${info.color}"></div>
        <div class="risk-info">
          <div class="risk-label">${info.label}</div>
          <div class="risk-desc">${info.description}</div>
        </div>
        <div class="risk-count">${count}</div>
      </div>
    `;
  }).join('');

  // Category list
  const categoryCount = {};
  categorizedVideos.forEach(v => {
    const cat = v.category || 'other';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1]);

  categoryListEl.innerHTML = sortedCategories.map(([cat, count]) => {
    const info = CATEGORY_TAXONOMY[cat] || { label: cat, color: '#BDBDBD' };
    return `
      <div class="category-item" data-category="${cat}">
        <div class="category-color" style="background: ${info.color}"></div>
        <div class="category-name">${info.label}</div>
        <div class="category-count">${count}</div>
      </div>
    `;
  }).join('');
}

// D3 Zoomable Circle Packing Visualization
function renderVisualization() {
  // Clear previous
  vizEl.innerHTML = '';

  const width = vizEl.clientWidth || 800;
  const height = width;

  // Risk-based color scale
  const riskColorScale = d3.scaleLinear()
    .domain([0, 2, 5])
    .range(["#4CAF50", "#FFC107", "#F44336"])
    .interpolate(d3.interpolateHcl);

  // Category color function
  const getCategoryColor = (d) => {
    if (d.data.color) return d.data.color;
    if (d.parent && d.parent.data.color) return d.parent.data.color;
    return CATEGORY_TAXONOMY[d.data.name]?.color || '#667eea';
  };

  // Compute the layout
  const pack = data => d3.pack()
    .size([width, height])
    .padding(4)
    (d3.hierarchy(data)
      .sum(d => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0)));

  const root = pack(hierarchyData);

  // Create SVG with theme-aware background
  const isLightMode = document.body.classList.contains('light-mode');
  const svgBackground = isLightMode 
    ? 'radial-gradient(circle at center, #f5f7fa 0%, #e4e8ec 100%)'
    : 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)';
  
  const svg = d3.create("svg")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("id", "bubbleVizSvg")
    .attr("style", `max-width: 100%; height: auto; display: block; background: ${svgBackground}; cursor: pointer; border-radius: 20px;`);

  // Focus tracking
  let focus = root;
  let view;

  // Create defs for clip paths (for circular thumbnails)
  const defs = svg.append("defs");
  
  // Add clip paths for each leaf node with thumbnail
  root.descendants().slice(1).forEach((d, i) => {
    if (!d.children && d.data.thumbnail) {
      defs.append("clipPath")
        .attr("id", `clip-${i}`)
        .append("circle")
        .attr("r", d.r);
    }
  });

  // Append the nodes (circles)
  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("fill", d => {
      // Leaf nodes with thumbnail: transparent (image will show)
      if (!d.children && d.data.thumbnail) {
        return "transparent";
      }
      // Leaf nodes without thumbnail: color by risk level
      if (!d.children) {
        return riskColorScale(d.data.risk || 0);
      }
      // Category nodes: use category color
      return getCategoryColor(d);
    })
    .attr("fill-opacity", d => d.children ? 0.4 : 0.85)
    .attr("stroke", d => {
      if (!d.children) {
        // Video bubbles: colored border based on risk
        return riskColorScale(d.data.risk || 0);
      }
      return getCategoryColor(d);
    })
    .attr("stroke-width", d => d.children ? 2 : 3)
    .attr("pointer-events", d => !d.children ? "all" : null)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .attr("stroke", "#fff")
        .attr("stroke-width", 4);
      showTooltip(event, d);
    })
    .on("mouseout", function(event, d) {
      const strokeColor = !d.children ? riskColorScale(d.data.risk || 0) : getCategoryColor(d);
      d3.select(this)
        .attr("stroke", strokeColor)
        .attr("stroke-width", d.children ? 2 : 3);
      hideTooltip();
    })
    .on("click", (event, d) => {
      if (d.children) {
        // Zoom into category
        if (focus !== d) {
          zoom(event, d);
          event.stopPropagation();
        }
      } else {
        // Open video in new tab
        if (d.data.url) {
          window.open(d.data.url, '_blank');
        }
        event.stopPropagation();
      }
    });

  // Append thumbnail images for leaf nodes
  const images = svg.append("g")
    .selectAll("image")
    .data(root.descendants().slice(1).filter(d => !d.children && d.data.thumbnail))
    .join("image")
    .attr("xlink:href", d => d.data.thumbnail)
    .attr("width", d => d.r * 2)
    .attr("height", d => d.r * 2)
    .attr("x", d => -d.r)
    .attr("y", d => -d.r)
    .attr("clip-path", (d, i) => `url(#clip-${root.descendants().slice(1).findIndex(n => n === d)})`)
    .attr("preserveAspectRatio", "xMidYMid slice")
    .attr("pointer-events", "none")
    .style("opacity", 0.9);

  // Append label groups (background + text)
  const labelGroup = svg.append("g")
    .attr("pointer-events", "none")
    .selectAll("g")
    .data(root.descendants().filter(d => d.children && d.depth > 0))
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .style("opacity", d => d.parent === root ? 1 : 0);

  // Background rectangles for labels
  const labelBg = labelGroup.append("rect")
    .attr("fill", "rgba(0, 0, 0, 0.7)")
    .attr("rx", 6)
    .attr("ry", 6);

  // Text labels
  const label = labelGroup.append("text")
    .style("font", "13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
    .style("fill", "#fff")
    .style("font-weight", "600")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text(d => `${CATEGORY_TAXONOMY[d.data.name]?.label || d.data.name} (${d.children.length})`);

  // Function to update label background sizes
  function updateLabelBackgrounds() {
    labelGroup.each(function() {
      const text = d3.select(this).select("text");
      const textNode = text.node();
      if (textNode) {
        const bbox = textNode.getBBox();
        if (bbox.width > 0) {
          d3.select(this).select("rect")
            .attr("x", bbox.x - 8)
            .attr("y", bbox.y - 4)
            .attr("width", bbox.width + 16)
            .attr("height", bbox.height + 8);
        }
      }
    });
  }

  // Initial background sizing (delayed to ensure rendering)
  setTimeout(updateLabelBackgrounds, 100);

  // Click on background to zoom out
  svg.on("click", (event) => zoom(event, root));

  // Initial zoom
  zoomTo([root.x, root.y, root.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];
    view = v;

    // Update label groups position
    labelGroup.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    label.style("font-size", `${Math.min(13 * k, 15)}px`);
    
    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
    
    // Update images position and size
    images
      .attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`)
      .attr("width", d => d.r * 2 * k)
      .attr("height", d => d.r * 2 * k)
      .attr("x", d => -d.r * k)
      .attr("y", d => -d.r * k);
    
    // Update clip paths
    defs.selectAll("clipPath circle")
      .attr("r", function() {
        const clipId = d3.select(this.parentNode).attr("id");
        const idx = parseInt(clipId.split("-")[1]);
        const d = root.descendants().slice(1)[idx];
        return d ? d.r * k : 0;
      });
    
    // Update label background sizes after font change
    updateLabelBackgrounds();
  }

  function zoom(event, d) {
    focus = d;

    const transition = svg.transition()
      .duration(event.altKey ? 7500 : 750)
      .tween("zoom", () => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return t => zoomTo(i(t));
      });

    labelGroup
      .filter(function(d) { 
        return d.parent === focus || this.style.display === "block"; 
      })
      .transition(transition)
      .style("opacity", d => d.parent === focus ? 1 : 0)
      .on("start", function(d) { 
        if (d.parent === focus) this.style.display = "block"; 
      })
      .on("end", function(d) { 
        if (d.parent !== focus) this.style.display = "none"; 
      });
  }

  // Append to DOM
  vizEl.appendChild(svg.node());
}

// Tooltip functions
function showTooltip(event, d) {
  const riskInfo = RISK_LEVELS[d.data.risk || 0];
  
  let content = '';
  
  if (d.children) {
    // Category tooltip
    const catInfo = CATEGORY_TAXONOMY[d.data.name] || {};
    const avgRisk = d.leaves().reduce((sum, leaf) => sum + (leaf.data.risk || 0), 0) / d.leaves().length;
    
    content = `
      <div class="tooltip-title">${catInfo.label || d.data.name}</div>
      <div class="tooltip-channel">${d.children.length} videos</div>
      <div class="tooltip-meta">
        <div class="tooltip-meta-item">
          <span>Avg Risk:</span>
          <span class="tooltip-risk" style="background: ${RISK_LEVELS[Math.round(avgRisk)].color}">${avgRisk.toFixed(1)}</span>
        </div>
      </div>
    `;
  } else {
    // Video tooltip - show all available metadata
    const videoData = d.data;
    
    // Build metadata line
    let metaItems = [];
    if (videoData.duration) metaItems.push(`⏱️ ${videoData.duration}`);
    if (videoData.views) metaItems.push(`👁️ ${videoData.views}`);
    if (videoData.likes) metaItems.push(`👍 ${videoData.likes}`);
    
    // Truncate description
    let descriptionPreview = '';
    if (videoData.description && videoData.description.length > 0) {
      descriptionPreview = videoData.description.slice(0, 150);
      if (videoData.description.length > 150) descriptionPreview += '...';
    }

    content = `
      <div class="tooltip-title">${videoData.name}</div>
      <div class="tooltip-channel">
        <span style="color: #667eea;">📺</span> ${videoData.channel || 'Unknown Channel'}
        ${videoData.subscribers ? `<span style="color: #6b7280; margin-left: 8px;">(${videoData.subscribers})</span>` : ''}
      </div>
      ${metaItems.length > 0 ? `
        <div class="tooltip-stats" style="display: flex; gap: 12px; margin-top: 8px; font-size: 11px; color: #8892b0;">
          ${metaItems.join(' <span style="color: #4b5563;">•</span> ')}
        </div>
      ` : ''}
      ${videoData.uploadDate ? `<div style="margin-top: 4px; font-size: 10px; color: #6b7280;">📅 ${videoData.uploadDate}</div>` : ''}
      ${descriptionPreview ? `
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #9ca3af; line-height: 1.4;">
          ${descriptionPreview}
        </div>
      ` : ''}
      <div class="tooltip-meta" style="margin-top: 10px;">
        <div class="tooltip-meta-item">
          <span class="tooltip-risk" style="background: ${riskInfo.color}">${riskInfo.label} Risk (${videoData.risk})</span>
        </div>
      </div>
      ${videoData.reasoning ? `<div style="margin-top: 6px; font-size: 11px; color: #8892b0; font-style: italic;">"${videoData.reasoning}"</div>` : ''}
      <div style="margin-top: 10px; font-size: 10px; color: #667eea; text-align: center;">Click to open video ↗</div>
    `;
  }

  tooltipEl.innerHTML = content;
  tooltipEl.classList.add('active');
  
  // Position tooltip
  const tooltipWidth = 350;
  const tooltipHeight = d.children ? 150 : 280;
  
  let x = event.pageX + 15;
  let y = event.pageY + 15;
  
  // Adjust if tooltip would go off screen
  if (x + tooltipWidth > window.innerWidth) {
    x = event.pageX - tooltipWidth - 15;
  }
  if (y + tooltipHeight > window.innerHeight) {
    y = Math.max(10, window.innerHeight - tooltipHeight - 10);
  }
  
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
}

function hideTooltip() {
  tooltipEl.classList.remove('active');
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (categorizedVideos.length > 0) {
      renderVisualization();
    }
  }, 250);
});
