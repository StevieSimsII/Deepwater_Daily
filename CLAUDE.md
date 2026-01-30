# CLAUDE.md - Deepwater Daily

## Project Overview

Deepwater Daily is an automated news aggregation platform for the oil & gas industry, focused on deepwater drilling, Gulf of America operations, subsea infrastructure, and LNG. It combines a Python-based RSS collector with a static frontend hosted on GitHub Pages.

**Live site**: https://steviesimsii.github.io/Deepwater_Daily/

## Repository Structure

```
Deepwater_Daily/
├── deepwater_news_collector.py       # Main Python collector (RSS fetch, filter, categorize)
├── requirements.txt                  # Python dependencies (feedparser, beautifulsoup4, requests)
├── article_history.txt               # Processed article URL tracker (deduplication)
├── OneClickUpdate.ps1                # Windows PowerShell automation script
├── README.md                         # Project documentation
├── .gitignore
├── .github/
│   └── workflows/
│       └── daily-news-collector.yml  # GitHub Actions: daily CRON at 12:00 UTC
└── docs/                             # GitHub Pages frontend
    ├── index.html                    # Main HTML page
    ├── app.js                        # Vanilla JS frontend logic
    ├── styles.css                    # CSS with custom properties, dark mode
    ├── _config.yml                   # Jekyll config (minimal theme)
    ├── favicon.png
    └── data/
        ├── deepwater_news.csv        # Generated article data (8 columns)
        └── last_update.json          # Timestamp of last collection run
```

## Tech Stack

- **Backend**: Python 3.11 (feedparser, beautifulsoup4, requests)
- **Frontend**: Vanilla HTML/CSS/JS, D3.js v7 (CSV parsing only), Bootstrap Icons, Google Fonts (Inter, Playfair Display)
- **Hosting**: GitHub Pages (from `docs/` directory)
- **CI/CD**: GitHub Actions (daily cron + manual dispatch)

## Key Commands

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the news collector locally
python deepwater_news_collector.py

# Windows: run collector + optionally push
.\OneClickUpdate.ps1
.\OneClickUpdate.ps1 -PushToGitHub
```

There are no test suites, linters, or build steps configured. The project outputs static files directly.

## Data Flow

1. **Collection**: `deepwater_news_collector.py` fetches from 23 RSS sources (max 5 articles each)
2. **Filtering**: Articles checked against 140+ deepwater/oil&gas keywords via `is_deepwater_related()`
3. **Deduplication**: URLs checked against `article_history.txt` and existing CSV entries
4. **Categorization**: `determine_category()` assigns one of 9 categories via keyword matching
5. **Output**: Atomic write to `docs/data/deepwater_news.csv` (sorted newest-first)
6. **Timestamp**: `docs/data/last_update.json` updated with ISO timestamp
7. **Frontend**: `docs/app.js` loads CSV via D3, renders paginated article cards

### CSV Schema (8 columns)

```
date, title, description, source, url, category, source_type, insights
```

- `date`: ISO format (YYYY-MM-DD)
- `category`: One of: deepwater drilling, gulf of america, crude oil, natural gas, subsea & pipelines, lng & integrated gas, exploration, production, wells, safety & environment
- `source_type`: Major Operator | Government | Industry News
- `insights`: First ~300 chars of key extracted facts

## Architecture Notes

### Python Collector (`deepwater_news_collector.py`)

- Config section at top defines RSS feeds, keywords, and file paths
- Uses unverified SSL context for problematic feeds
- HTML cleaning via BeautifulSoup with regex fallback
- Timezone: Central Time (America/Chicago) throughout
- Atomic file operations: writes to temp file, then renames
- Logging: dual handlers (file + console)

### Frontend (`docs/`)

- No build step or frameworks — plain HTML/CSS/JS
- D3.js used solely for CSV parsing (not visualization)
- Dark/light theme persisted in localStorage
- Article vs. grid view toggle persisted in localStorage
- Search: debounced at 300ms, filters across title/description/source/category
- Pagination: 10 articles per page with "Load More" button
- CSS custom properties (60+ variables) for theming and design tokens
- Mobile-first responsive design with `clamp()` fluid typography

## CI/CD Workflow

The GitHub Actions workflow (`.github/workflows/daily-news-collector.yml`):

- **Schedule**: Daily at 12:00 UTC (6:00 AM CST)
- **Manual**: `workflow_dispatch` trigger available
- **Steps**: Checkout → Python 3.11 setup → pip install (cached) → run collector → update timestamp → commit & push (if changes exist)
- **Commit format**: `📰 Daily news update - YYYY-MM-DD`
- **Permissions**: `contents: write`

## Conventions

- **Commit messages**: Emoji-prefixed (`📰` for automated daily updates)
- **File naming**: `snake_case` for Python files, standard web naming for frontend
- **Timezone**: Central Time (America/Chicago) is the project standard
- **Error handling**: Graceful degradation — log warnings, don't crash on individual feed failures
- **No frameworks**: Frontend is intentionally vanilla JS; do not introduce React/Vue/etc.
- **No build tools**: No webpack/vite/bundler; files are served as-is via GitHub Pages
- **Code organization**: Python file uses config-at-top, then utility functions, then main `collect_news()`, then `if __name__ == "__main__"` entry point

## Common Tasks for AI Assistants

- **Adding a new RSS source**: Add to the `RSS_FEEDS` list in `deepwater_news_collector.py` with URL, name, and source_type
- **Adding keywords**: Update the keyword sets in `deepwater_news_collector.py` (`DEEPWATER_KEYWORDS` and category-specific keyword dicts)
- **Frontend changes**: Edit `docs/index.html`, `docs/app.js`, or `docs/styles.css` directly — no build required
- **Adding a category filter tab**: Update both `docs/index.html` (add tab button) and `docs/app.js` (add filter logic)
- **Styling changes**: Prefer modifying CSS custom properties in `docs/styles.css` `:root` block for theme-wide changes
