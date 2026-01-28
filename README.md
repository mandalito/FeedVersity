# 🫧 BubbleBreak

**Visualize your YouTube media consumption bubble to understand your information diet**

BubbleBreak is a Chrome extension that scrapes your YouTube watch history, categorizes videos using AI (OpenAI), and displays an interactive zoomable circle packing visualization to help you understand your media consumption patterns—including potentially problematic content like conspiracy theories, misinformation, or radicalized content.

![BubbleBreak Dashboard](docs/screenshot.png)

## Features

- **📥 YouTube History Scraping**: Automatically scrapes your watch history directly from YouTube (no export needed)
- **🤖 AI-Powered Categorization**: Uses OpenAI GPT-4o-mini to categorize videos and assess radicalization risk
- **📊 Interactive Visualization**: D3.js zoomable circle packing shows your consumption bubble
- **⚠️ Risk Assessment**: Each video receives a 0-5 risk score for potential radicalization/misinformation
- **🔒 Privacy-First**: All data stays in your browser; only video titles/channels are sent to OpenAI for categorization

## Categories

The extension categorizes videos into these categories:

| Category | Description |
|----------|-------------|
| Entertainment | Comedy, movies, TV shows, celebrity content |
| Gaming | Gameplay, esports, game reviews, streaming |
| Education | Science, history, tutorials, documentaries |
| Lifestyle | Cooking, fitness, travel, fashion, vlogs |
| News | Mainstream news, local news, journalism |
| Technology | Tech reviews, programming, gadgets, AI |
| Sports | Highlights, analysis, fitness |
| Music | Music videos, live performances, covers |
| Political (Left/Right/Centrist) | Political commentary by leaning |
| Alternative Media | Independent journalism, commentary |
| **Conspiracy Content** | Flat earth, anti-vax, QAnon, etc. |
| **Pseudoscience** | Alternative medicine, astrology, paranormal |
| **Extremist Content** | Hate speech, radicalization content |
| **Misinformation** | Fake news, health/political misinformation |

## Risk Levels (0-5)

| Level | Label | Description |
|-------|-------|-------------|
| 0 | None | Standard, neutral content |
| 1 | Low | Slight bias or sensationalism |
| 2 | Moderate | Notable bias or misleading framing |
| 3 | Elevated | Significant misinformation markers |
| 4 | High | Clear misinformation or extreme bias |
| 5 | Severe | Dangerous or radicalizing content |

## Installation

### Prerequisites

- Google Chrome browser
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/BubbleBreak.git
   cd BubbleBreak
   ```

2. **Generate extension icons**
   - Open `scripts/generate-icons.html` in your browser
   - Right-click each icon and save to `extension/icons/` as:
     - `icon16.png`
     - `icon48.png`
     - `icon128.png`

3. **Load the extension in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `extension` folder

4. **Configure your API key**
   - Click the BubbleBreak extension icon
   - Enter your OpenAI API key
   - Click "Save"

## Usage

1. **Scrape your watch history**
   - Click the extension icon
   - Click "Scrape Watch History"
   - If not on YouTube history, it will open the page
   - The scraper will auto-scroll and collect videos

2. **Categorize with AI**
   - Once videos are scraped, click "Categorize with AI"
   - Wait for the AI to process (batches of 5 videos)
   - Progress is shown in the popup

3. **View your bubble**
   - Click "Open Dashboard" to see the visualization
   - Click on category bubbles to zoom in
   - Hover over videos to see details
   - Click videos to open them on YouTube

## Project Structure

```
BubbleBreak/
├── extension/
│   ├── manifest.json           # Chrome extension manifest
│   ├── icons/                  # Extension icons
│   └── src/
│       ├── background/
│       │   └── background.js   # Service worker (API calls, storage)
│       ├── content/
│       │   └── youtube-scraper.js  # Content script for scraping
│       ├── popup/
│       │   ├── popup.html      # Extension popup UI
│       │   └── popup.js        # Popup logic
│       ├── dashboard/
│       │   ├── dashboard.html  # Full dashboard page
│       │   └── dashboard.js    # D3 visualization
│       └── shared/
│           └── taxonomy.js     # Category definitions
├── scripts/
│   └── generate-icons.html     # Icon generator
└── README.md
```

## Technical Details

### YouTube Scraping

The content script (`youtube-scraper.js`) runs on `youtube.com/feed/history` and:
- Extracts video ID, title, channel name, thumbnail
- Auto-scrolls to load more videos
- Sends data to the background script for storage

### AI Categorization

The background script (`background.js`) sends batched requests to OpenAI:
- Uses GPT-4o-mini for cost efficiency
- Processes 5 videos per API call
- Includes rate limiting (1s between batches)
- Returns category + risk score + reasoning

### Visualization

The dashboard uses D3.js zoomable circle packing:
- Videos are grouped by category
- Colors indicate risk level (green → yellow → red)
- Click to zoom into categories
- Hover for detailed information

## Privacy & Security

- **Local Storage Only**: All data is stored in Chrome's local storage
- **Minimal API Calls**: Only video titles and channel names are sent to OpenAI
- **No Tracking**: No analytics or third-party services
- **Open Source**: Full transparency in how your data is handled

## Cost Estimation

Using GPT-4o-mini at approximately $0.15 per 1M input tokens:
- 100 videos ≈ $0.01-0.02
- 500 videos ≈ $0.05-0.10
- 1000 videos ≈ $0.10-0.20

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [D3.js](https://d3js.org/) for the visualization library
- [OpenAI](https://openai.com/) for the categorization API
- Inspired by the [Observable D3 Gallery](https://observablehq.com/@d3/zoomable-circle-packing)

---

**Disclaimer**: This tool is for educational and self-awareness purposes. AI categorization may not be 100% accurate. The risk scores are algorithmic estimates and should not be considered definitive judgments about content.
