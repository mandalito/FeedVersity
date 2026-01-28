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
const riskLegendEl = document.getElementById('riskLegend');
const categoryListEl = document.getElementById('categoryList');
const btnGetStarted = document.getElementById('btnGetStarted');
const btnRefresh = document.getElementById('btnRefresh');
const btnClearData = document.getElementById('btnClearData');

let categorizedVideos = [];
let hierarchyData = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
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
    if (!confirm('Are you sure you want to clear all tracked videos? This cannot be undone.')) {
      return;
    }
    
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
      
      // Clear visualization
      vizEl.innerHTML = '';
      
      // Show empty state
      showEmptyState();
      
      alert('All data has been cleared!');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    }
  });
}

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
  // Define CSV columns
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
    'scraped_at'
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
  
  // Build CSV content with UTF-8 BOM for Excel compatibility
  // The BOM (\uFEFF) tells Excel to interpret the file as UTF-8
  let csvContent = '\uFEFF' + columns.join(',') + '\n';
  
  for (const video of videos) {
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
      video.radicalization_risk !== undefined ? video.radicalization_risk : '',
      cleanText(video.reasoning),
      cleanText(video.description),
      video.thumbnail || '',
      video.url || '',
      video.scrapedAt || ''
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
  
  console.log(`📤 Exported ${videos.length} videos to CSV`);
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
  // Group by category
  const categoryGroups = {};
  
  categorizedVideos.forEach(video => {
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

  // Build hierarchy
  hierarchyData = {
    name: "Your Watch History",
    children: Object.values(categoryGroups)
  };

  // Update stats
  totalVideosEl.textContent = categorizedVideos.length;
  totalCategoriesEl.textContent = Object.keys(categoryGroups).length;
  
  const avgRisk = categorizedVideos.reduce((sum, v) => sum + (v.radicalizationRisk || 0), 0) / categorizedVideos.length;
  avgRiskEl.textContent = avgRisk.toFixed(1);
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

  // Create SVG
  const svg = d3.create("svg")
    .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("style", `max-width: 100%; height: auto; display: block; background: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); cursor: pointer; border-radius: 20px;`);

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

  // Append labels
  const label = svg.append("g")
    .style("font", "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .style("fill", "#fff")
    .style("fill-opacity", d => d.parent === root ? 1 : 0)
    .style("display", d => d.parent === root ? "inline" : "none")
    .style("font-weight", d => d.children ? "600" : "400")
    .style("text-shadow", "0 2px 4px rgba(0,0,0,0.5)")
    .text(d => {
      if (d.children) {
        // Category label with count
        return `${CATEGORY_TAXONOMY[d.data.name]?.label || d.data.name} (${d.children.length})`;
      }
      return '';
    });

  // Click on background to zoom out
  svg.on("click", (event) => zoom(event, root));

  // Initial zoom
  zoomTo([root.x, root.y, root.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];
    view = v;

    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    label.style("font-size", d => d.children ? `${Math.min(14 * k, 16)}px` : "10px");
    
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
  }

  function zoom(event, d) {
    focus = d;

    const transition = svg.transition()
      .duration(event.altKey ? 7500 : 750)
      .tween("zoom", () => {
        const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return t => zoomTo(i(t));
      });

    label
      .filter(function(d) { 
        return d.parent === focus || this.style.display === "inline"; 
      })
      .transition(transition)
      .style("fill-opacity", d => d.parent === focus ? 1 : 0)
      .on("start", function(d) { 
        if (d.parent === focus) this.style.display = "inline"; 
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
