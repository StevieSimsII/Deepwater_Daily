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

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

Stevie Sims

## 🔗 Links

- **Live Site**: https://steviesimsii.github.io/Deepwater_Daily/
- **GitHub Repository**: https://github.com/StevieSimsII/Deepwater_Daily
