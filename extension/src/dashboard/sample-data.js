// Sample data for testing the dashboard without scraping
// To use: uncomment the loadSampleData() call in dashboard.js

const SAMPLE_CATEGORIZED_VIDEOS = [
  // Entertainment
  { videoId: "v1", title: "Epic Movie Trailer Breakdown", channelName: "CinemaScope", category: "entertainment", radicalizationRisk: 0, reasoning: "Standard entertainment review content", duration: "15:32", views: "1.2M views", likes: "45K", subscribers: "2.5M subscribers", description: "In this video, we break down the latest blockbuster trailer frame by frame. Join us as we analyze the hidden details and Easter eggs!" },
  { videoId: "v2", title: "Top 10 Comedy Moments 2024", channelName: "FunnyClips", category: "entertainment", radicalizationRisk: 0, reasoning: "Lighthearted comedy compilation", duration: "12:45", views: "3.4M views", likes: "120K", subscribers: "5M subscribers", description: "The funniest moments of 2024 compiled into one hilarious video!" },
  { videoId: "v3", title: "Late Night Show Best Of", channelName: "LateNightTV", category: "entertainment", radicalizationRisk: 1, reasoning: "Contains political humor", duration: "22:10", views: "890K views", likes: "32K", subscribers: "8M subscribers", description: "The best moments from this week's late night shows." },
  { videoId: "v4", title: "Celebrity Interview Special", channelName: "StarTalk", category: "entertainment", radicalizationRisk: 0, reasoning: "Standard celebrity interview", duration: "45:00", views: "2.1M views", likes: "67K", subscribers: "3.2M subscribers", description: "An exclusive sit-down interview with Hollywood's biggest stars." },
  { videoId: "v5", title: "Viral Dance Challenge", channelName: "TrendSetters", category: "entertainment", radicalizationRisk: 0, reasoning: "Harmless viral content", duration: "3:22", views: "15M views", likes: "890K", subscribers: "1.8M subscribers", description: "Learn the viral dance that's taking over the internet!" },

  // Gaming
  { videoId: "v6", title: "Elden Ring Boss Guide", channelName: "GamersUnite", category: "gaming", radicalizationRisk: 0, reasoning: "Standard gaming tutorial" },
  { videoId: "v7", title: "Minecraft Mega Build Timelapse", channelName: "BuildMaster", category: "gaming", radicalizationRisk: 0, reasoning: "Creative gaming content" },
  { videoId: "v8", title: "Esports Finals Highlights", channelName: "ESLGaming", category: "gaming", radicalizationRisk: 0, reasoning: "Professional esports coverage" },
  { videoId: "v9", title: "PS5 vs Xbox Series X", channelName: "TechGamer", category: "gaming", radicalizationRisk: 0, reasoning: "Balanced console comparison" },

  // Education
  { videoId: "v10", title: "Quantum Physics Explained", channelName: "ScienceDaily", category: "education", radicalizationRisk: 0, reasoning: "Educational science content" },
  { videoId: "v11", title: "History of Ancient Rome", channelName: "HistoryBuff", category: "education", radicalizationRisk: 0, reasoning: "Historical documentary" },
  { videoId: "v12", title: "Learn Python in 1 Hour", channelName: "CodeAcademy", category: "education", radicalizationRisk: 0, reasoning: "Programming tutorial" },
  { videoId: "v13", title: "Climate Science Basics", channelName: "EarthMatters", category: "education", radicalizationRisk: 0, reasoning: "Scientific climate education" },
  { videoId: "v14", title: "Mathematics Made Easy", channelName: "MathGenius", category: "education", radicalizationRisk: 0, reasoning: "Math education content" },
  { videoId: "v15", title: "Space Exploration 2024", channelName: "NASA", category: "education", radicalizationRisk: 0, reasoning: "Official space agency content" },

  // Tech
  { videoId: "v16", title: "iPhone 16 Review", channelName: "MKBHD", category: "tech", radicalizationRisk: 0, reasoning: "Objective tech review" },
  { videoId: "v17", title: "AI Revolution 2024", channelName: "TechCrunch", category: "tech", radicalizationRisk: 1, reasoning: "Some hype but mostly factual" },
  { videoId: "v18", title: "Best Laptops for Students", channelName: "LaptopMag", category: "tech", radicalizationRisk: 0, reasoning: "Consumer buying guide" },

  // News (Mainstream)
  { videoId: "v19", title: "Evening News Broadcast", channelName: "CBSNews", category: "news", radicalizationRisk: 0, reasoning: "Mainstream news coverage" },
  { videoId: "v20", title: "Election Analysis 2024", channelName: "APNews", category: "news", radicalizationRisk: 1, reasoning: "Factual election coverage" },
  { videoId: "v21", title: "Economic Update Report", channelName: "Reuters", category: "news", radicalizationRisk: 0, reasoning: "Objective economic reporting" },

  // Political Left
  { videoId: "v22", title: "Progressive Policy Explained", channelName: "LeftVoice", category: "political_left", radicalizationRisk: 2, reasoning: "Strong progressive bias, some sensationalism" },
  { videoId: "v23", title: "Worker Rights Movement", channelName: "LaborWatch", category: "political_left", radicalizationRisk: 1, reasoning: "Pro-labor perspective" },
  { videoId: "v24", title: "Social Justice Discussion", channelName: "EquityNow", category: "political_left", radicalizationRisk: 2, reasoning: "Activist content with strong framing" },

  // Political Right
  { videoId: "v25", title: "Conservative Values Today", channelName: "RightNow", category: "political_right", radicalizationRisk: 2, reasoning: "Conservative bias, some inflammatory language" },
  { videoId: "v26", title: "Traditional Family Discussion", channelName: "FamilyFirst", category: "political_right", radicalizationRisk: 1, reasoning: "Conservative social commentary" },
  { videoId: "v27", title: "Economic Freedom Debate", channelName: "FreeMarket", category: "political_right", radicalizationRisk: 2, reasoning: "Strong free-market advocacy" },

  // Alternative Media
  { videoId: "v28", title: "Mainstream Media Critique", channelName: "MediaWatch", category: "alternative_media", radicalizationRisk: 2, reasoning: "Media criticism with some bias" },
  { videoId: "v29", title: "Independent Journalism Report", channelName: "IndiePresse", category: "alternative_media", radicalizationRisk: 1, reasoning: "Independent reporting, some bias" },
  { videoId: "v30", title: "What They Won't Tell You", channelName: "TruthSeeker", category: "alternative_media", radicalizationRisk: 3, reasoning: "Conspiratorial framing, us-vs-them narrative" },

  // Conspiracy Content
  { videoId: "v31", title: "Hidden Truth About Vaccines", channelName: "WakeUpPeople", category: "conspiracy_content", radicalizationRisk: 5, reasoning: "Anti-vaccine misinformation, dangerous health claims" },
  { videoId: "v32", title: "Government Cover-Up Exposed", channelName: "DeepState", category: "conspiracy_content", radicalizationRisk: 4, reasoning: "Unfounded conspiracy claims about government" },
  { videoId: "v33", title: "What NASA Doesn't Want You to Know", channelName: "FlatEarthTruth", category: "conspiracy_content", radicalizationRisk: 4, reasoning: "Flat earth content, anti-science" },
  { videoId: "v34", title: "Secret Societies Control Everything", channelName: "IlluminatiWatch", category: "conspiracy_content", radicalizationRisk: 4, reasoning: "NWO conspiracy theories" },

  // Pseudoscience
  { videoId: "v35", title: "Crystal Healing Complete Guide", channelName: "HolisticLife", category: "pseudoscience", radicalizationRisk: 2, reasoning: "Unproven alternative medicine claims" },
  { videoId: "v36", title: "Your Zodiac Predictions 2024", channelName: "AstroGuide", category: "pseudoscience", radicalizationRisk: 1, reasoning: "Astrology content, mostly harmless" },
  { videoId: "v37", title: "Cure Cancer Naturally", channelName: "NaturalCures", category: "pseudoscience", radicalizationRisk: 4, reasoning: "Dangerous health misinformation" },

  // Misinformation
  { videoId: "v38", title: "Election Fraud Evidence", channelName: "PatriotNews", category: "misinformation", radicalizationRisk: 5, reasoning: "Debunked election fraud claims" },
  { videoId: "v39", title: "COVID Truth They Hide", channelName: "RealNews247", category: "misinformation", radicalizationRisk: 5, reasoning: "COVID-19 misinformation" },
  { videoId: "v40", title: "Climate Change Hoax Exposed", channelName: "SkepticsUnite", category: "misinformation", radicalizationRisk: 4, reasoning: "Climate change denial" },

  // Lifestyle
  { videoId: "v41", title: "Morning Routine 2024", channelName: "LifeWithEmma", category: "lifestyle", radicalizationRisk: 0, reasoning: "Standard lifestyle vlog" },
  { videoId: "v42", title: "Home Organization Tips", channelName: "TidyHome", category: "lifestyle", radicalizationRisk: 0, reasoning: "Home improvement content" },
  { videoId: "v43", title: "Healthy Meal Prep Guide", channelName: "HealthyEats", category: "lifestyle", radicalizationRisk: 0, reasoning: "Cooking and nutrition" },
  { videoId: "v44", title: "Travel Vlog: Japan 2024", channelName: "Wanderlust", category: "lifestyle", radicalizationRisk: 0, reasoning: "Travel documentation" },
  { videoId: "v45", title: "Fitness Transformation Journey", channelName: "FitLife", category: "lifestyle", radicalizationRisk: 0, reasoning: "Fitness motivation content" },

  // Music
  { videoId: "v46", title: "Official Music Video", channelName: "ArtistVEVO", category: "music", radicalizationRisk: 0, reasoning: "Official music content" },
  { videoId: "v47", title: "Guitar Cover - Classic Rock", channelName: "GuitarHero", category: "music", radicalizationRisk: 0, reasoning: "Music performance" },
  { videoId: "v48", title: "Music Production Tutorial", channelName: "BeatMaker", category: "music", radicalizationRisk: 0, reasoning: "Music education" },

  // Sports
  { videoId: "v49", title: "NBA Finals Highlights", channelName: "ESPN", category: "sports", radicalizationRisk: 0, reasoning: "Sports highlights" },
  { videoId: "v50", title: "Soccer Skills Training", channelName: "FootballDaily", category: "sports", radicalizationRisk: 0, reasoning: "Sports training content" }
];

// Function to load sample data for testing
function loadSampleData() {
  return SAMPLE_CATEGORIZED_VIDEOS.map(v => ({
    ...v,
    url: `https://www.youtube.com/watch?v=${v.videoId}`,
    scrapedAt: new Date().toISOString(),
    categorizedAt: new Date().toISOString()
  }));
}

// Export for use in dashboard
if (typeof window !== 'undefined') {
  window.loadSampleData = loadSampleData;
  window.SAMPLE_CATEGORIZED_VIDEOS = SAMPLE_CATEGORIZED_VIDEOS;
}
