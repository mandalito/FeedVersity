// Category taxonomy for video classification
export const CATEGORY_TAXONOMY = {
  // Neutral entertainment categories
  entertainment: {
    label: "Entertainment",
    color: "#4CAF50",
    subcategories: ["comedy", "music", "movies", "tv_shows", "celebrity"]
  },
  gaming: {
    label: "Gaming",
    color: "#9C27B0",
    subcategories: ["gameplay", "esports", "game_reviews", "streaming"]
  },
  education: {
    label: "Education",
    color: "#2196F3",
    subcategories: ["science", "history", "tutorials", "documentaries", "lectures"]
  },
  lifestyle: {
    label: "Lifestyle",
    color: "#FF9800",
    subcategories: ["cooking", "fitness", "travel", "fashion", "home", "vlogs"]
  },
  news: {
    label: "News",
    color: "#607D8B",
    subcategories: ["mainstream_news", "local_news", "weather", "journalism"]
  },
  tech: {
    label: "Technology",
    color: "#00BCD4",
    subcategories: ["reviews", "programming", "gadgets", "ai", "startups"]
  },
  sports: {
    label: "Sports",
    color: "#8BC34A",
    subcategories: ["highlights", "analysis", "fitness", "extreme_sports"]
  },
  music: {
    label: "Music",
    color: "#E91E63",
    subcategories: ["music_videos", "live_performances", "covers", "production"]
  },
  
  // Political and commentary categories
  political_left: {
    label: "Political (Left-leaning)",
    color: "#3F51B5",
    subcategories: ["progressive", "liberal", "social_justice", "labor"]
  },
  political_right: {
    label: "Political (Right-leaning)",
    color: "#F44336",
    subcategories: ["conservative", "libertarian", "traditional"]
  },
  political_centrist: {
    label: "Political (Centrist)",
    color: "#9E9E9E",
    subcategories: ["moderate", "bipartisan", "analytical"]
  },
  alternative_media: {
    label: "Alternative Media",
    color: "#795548",
    subcategories: ["independent_journalism", "citizen_journalism", "commentary"]
  },
  
  // Categories requiring attention (potentially problematic)
  conspiracy_content: {
    label: "Conspiracy Content",
    color: "#FF5722",
    riskLevel: "high",
    subcategories: ["flat_earth", "anti_vax", "qanon", "new_world_order", "hidden_knowledge"]
  },
  pseudoscience: {
    label: "Pseudoscience",
    color: "#FF7043",
    riskLevel: "medium",
    subcategories: ["alternative_medicine", "astrology", "paranormal", "anti_science"]
  },
  extremist_content: {
    label: "Extremist Content",
    color: "#D32F2F",
    riskLevel: "high",
    subcategories: ["hate_speech", "radicalization", "supremacist", "violent_ideology"]
  },
  misinformation: {
    label: "Misinformation",
    color: "#E64A19",
    riskLevel: "medium",
    subcategories: ["fake_news", "health_misinfo", "political_misinfo", "fear_mongering"]
  },
  
  // Other
  other: {
    label: "Other",
    color: "#BDBDBD",
    subcategories: ["uncategorized", "mixed", "personal"]
  }
};

// Risk level definitions
export const RISK_LEVELS = {
  0: { label: "None", color: "#4CAF50", description: "Standard content" },
  1: { label: "Low", color: "#8BC34A", description: "Slight bias or sensationalism" },
  2: { label: "Moderate", color: "#FFC107", description: "Notable bias or misleading framing" },
  3: { label: "Elevated", color: "#FF9800", description: "Significant misinformation markers" },
  4: { label: "High", color: "#FF5722", description: "Clear misinformation or extreme bias" },
  5: { label: "Severe", color: "#F44336", description: "Dangerous or radicalizing content" }
};

// Get all category keys
export const CATEGORY_KEYS = Object.keys(CATEGORY_TAXONOMY);

// Get category by key
export function getCategory(key) {
  return CATEGORY_TAXONOMY[key] || CATEGORY_TAXONOMY.other;
}

// Get risk color based on level
export function getRiskColor(level) {
  return RISK_LEVELS[Math.min(Math.max(0, level), 5)]?.color || RISK_LEVELS[0].color;
}
