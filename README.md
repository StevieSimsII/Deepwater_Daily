# Deepwater Daily 🛢️

An automated news aggregator for Gulf of America deepwater drilling, oil & gas exploration, pipelines, crude oil, natural gas, and integrated gas industry news.

## 🌊 Overview

Deepwater Daily is a news aggregation platform that collects and curates the latest articles, reports, and insights from leading oil & gas industry sources. The site focuses on:

- **Deepwater Drilling**: Ultra-deepwater operations, drilling rigs, drillships, semi-submersibles
- **Gulf of America Operations**: OCS leasing, BOEM/BSEE updates, regional developments
- **Crude Oil & Natural Gas**: Production data, pricing trends, market analysis
- **Subsea & Pipelines**: Infrastructure projects, flowlines, subsea systems
- **LNG & Integrated Gas**: Export terminals, FLNG, gas processing
- **Wells & Exploration**: Discoveries, well completions, prospect updates

## 🔧 How It Works

1. **Python Collector Script** (`deepwater_news_collector.py`): Fetches RSS feeds from major oil & gas publications
2. **Keyword Filtering**: Filters articles for deepwater drilling and Gulf of America relevant content
3. **Category Classification**: Automatically categorizes articles by topic
4. **CSV Storage**: Saves articles to CSV for the web frontend
5. **GitHub Pages**: Static site hosted on GitHub Pages with modern Substack-like design

## 📂 Project Structure

```
Deepwater_Daily/
├── deepwater_news_collector.py  # Main Python collector script
├── article_history.txt          # Track processed articles
├── OneClickUpdate.ps1           # One-click update script
├── README.md                    # This file
├── docs/                        # GitHub Pages frontend
│   ├── index.html              # Main HTML page
│   ├── styles.css              # Substack-style CSS
│   ├── app.js                  # JavaScript application
│   ├── _config.yml             # Jekyll configuration
│   └── data/
│       ├── deepwater_news.csv  # News articles data
│       └── last_update.json    # Last update timestamp
└── web_app/                    # Alternative web app location
    └── data/
        └── deepwater_news.csv
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/StevieSimsII/Deepwater_Daily.git
   cd Deepwater_Daily
   ```

2. Install Python dependencies:
   ```bash
   pip install feedparser beautifulsoup4 requests pytz
   ```

3. Run the news collector:
   ```bash
   python deepwater_news_collector.py
   ```

### One-Click Update

Use the PowerShell script for a complete update:
```powershell
.\OneClickUpdate.ps1
```

To also push changes to GitHub:
```powershell
.\OneClickUpdate.ps1 -PushToGitHub
```

## 📰 Data Sources

We aggregate content from trusted industry sources including:

- Offshore Magazine
- Rigzone
- World Oil
- Oil Price
- Offshore Technology
- Oil & Gas Journal
- S&P Global Commodity Insights
- BOEM & BSEE (Government agencies)
- EIA (Energy Information Administration)
- Major operators (ExxonMobil, Chevron, Shell, BP)

## 🎨 Frontend Features

- **Modern Substack-like Design**: Clean, article-focused layout
- **Dark/Light Mode**: Toggle between themes
- **Category Filtering**: Filter by topic (Deepwater, Crude Oil, Natural Gas, etc.)
- **View Modes**: Article view or grid view
- **Search**: Find articles by keyword
- **Responsive**: Works on all devices

## 💬 Microsoft Teams Notifications

The collector can optionally post each daily batch of new articles to a Microsoft Teams channel using a webhook-compatible Teams flow. The notification is sent only when new articles are found, and each card includes:

- A headline with the number of new articles for the day
- A tighter list of up to 3 featured articles with larger summaries
- Clickable article titles that open the source story directly
- A button to open the full Deepwater Daily site

### Setup

1. In Microsoft Teams, create a channel workflow/webhook that exposes a POST URL for incoming JSON payloads.
2. In GitHub, open your repository settings and add a repository secret named `TEAMS_WEBHOOK_URL`.
3. Paste the Teams webhook URL into that secret.
4. Optionally add a repository variable named `TEAMS_SITE_URL` if you want the card button to open a different site URL.
5. Run the workflow manually once from GitHub Actions to verify the card renders the way you want.

### Local Testing

You can also test the Teams notification locally before storing the secret in GitHub:

```powershell
$env:TEAMS_WEBHOOK_URL = "https://your-teams-webhook-url"
python deepwater_news_collector.py
```

To send a sample Teams card on demand without running the RSS collection:

```powershell
$env:TEAMS_WEBHOOK_URL = "https://your-teams-webhook-url"
python deepwater_news_collector.py --teams-test
```

You can adjust the sample size from 1 to 5 items:

```powershell
python deepwater_news_collector.py --teams-test --teams-test-count 5
```

To send a live Teams card from the real dataset already committed in the repo:

```powershell
python deepwater_news_collector.py --teams-live-from-csv --teams-live-count 5
```

### GitHub Actions Live Test

The repository also includes a manual workflow named `Teams Live Notification Test`.

1. Open the **Actions** tab in GitHub.
2. Select **Teams Live Notification Test**.
3. Click **Run workflow**.
4. Choose how many real CSV articles to send, from 1 to 5.
5. Run it to post a Teams card using the repository secret `TEAMS_WEBHOOK_URL`.

### GitHub Actions Refresh And Notify

The repository also includes a manual workflow named `Refresh And Notify Teams`.

1. Open the **Actions** tab in GitHub.
2. Select **Refresh And Notify Teams**.
3. Click **Run workflow**.
4. The workflow will fetch fresh RSS articles, update the repo dataset, post newly collected articles to Teams, and push any resulting data changes back to GitHub.

If `TEAMS_WEBHOOK_URL` is not set, the script skips Teams posting and still updates the CSV and site data normally.

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

Stevie Sims

## 🔗 Links

- **Live Site**: https://steviesimsii.github.io/Deepwater_Daily/
- **GitHub Repository**: https://github.com/StevieSimsII/Deepwater_Daily
