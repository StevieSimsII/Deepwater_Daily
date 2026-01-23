import requests
import csv
import os
import datetime
import time
import logging
import re
import feedparser
import ssl
import html
import shutil
from pathlib import Path
from urllib.parse import urlparse
from bs4 import BeautifulSoup

# Try to create unverified HTTPS context for feedparser (needed for some feeds)
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Path(__file__).parent / "deepwater_news_collector.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("Deepwater_News_Collector")

# Configuration
BASE_DIR = Path(__file__).parent
CSV_OUTPUT_PATH = BASE_DIR / "docs" / "data" / "deepwater_news.csv"
HISTORY_FILE = BASE_DIR / "article_history.txt"
MAX_ARTICLES_PER_SOURCE = 5

# Secondary CSV locations
SECONDARY_CSV_PATHS = [
    BASE_DIR / "web_app" / "data" / "deepwater_news.csv"
]

# List of RSS feeds focused on Oil & Gas, Deepwater Drilling, Gulf of America
RSS_FEEDS = [
    # Oil & Gas Industry News
    "https://www.offshore-mag.com/rss/",
    "https://www.rigzone.com/news/rss/rigzone_latest.aspx",
    "https://www.worldoil.com/rss/news",
    "https://www.oilprice.com/rss/main",
    "https://www.offshore-technology.com/feed/",
    "https://www.ogj.com/rss/",
    "https://www.hydrocarbonprocessing.com/rss/",
    
    # Energy & Industry Publications
    "https://www.spglobal.com/commodityinsights/en/rss-feed/oil",
    "https://www.reuters.com/markets/commodities/energy/rss",
    "https://www.bloomberg.com/feed/podcast/bnn-bloomberg-markets.xml",
    
    # Gulf of Mexico / America Specific
    "https://www.boem.gov/newsroom/rss.xml",
    "https://www.bsee.gov/newsroom/rss.xml",
    
    # Drilling & Exploration
    "https://www.drillingcontractor.org/feed",
    "https://jpt.spe.org/rss",
    
    # Natural Gas
    "https://www.naturalgasintel.com/rss/",
    "https://www.naturalgasworld.com/feed/",
    
    # Energy General
    "https://www.energy.gov/rss.xml",
    "https://www.eia.gov/rss/todayinenergy.xml",
    
    # Subsea & Pipeline
    "https://www.offshore-energy.biz/feed/",
    "https://www.subsea-world-news.com/feed/",
    
    # Major Company News
    "https://news.exxonmobil.com/rss/news-releases.aspx",
    "https://www.chevron.com/rss/news",
    "https://www.shell.com/rss/news-and-media-releases.html",
    "https://www.bp.com/content/bp/en/global/corporate/news-releases.rss.xml",
]

# Keywords to filter for deepwater drilling and oil & gas content
DEEPWATER_KEYWORDS = [
    # Deepwater & Offshore Drilling
    "deepwater", "deep water", "deep-water", "offshore drilling", "offshore oil",
    "offshore gas", "ultra-deepwater", "subsea", "floating production",
    "drilling rig", "drillship", "semi-submersible", "jack-up", "fpso",
    "spar platform", "tension leg platform", "tlp",
    
    # Gulf of America / Mexico
    "gulf of mexico", "gulf of america", "gom", "outer continental shelf",
    "ocs", "boem", "bsee", "louisiana offshore", "texas offshore",
    "mississippi canyon", "green canyon", "garden banks", "alaminos canyon",
    "keathley canyon", "walker ridge",
    
    # Oil & Gas General
    "oil exploration", "gas exploration", "petroleum", "crude oil",
    "natural gas", "hydrocarbon", "oil production", "gas production",
    "upstream oil", "upstream gas", "e&p", "exploration and production",
    
    # Wells & Drilling
    "oil well", "gas well", "drilling operations", "well completion",
    "well intervention", "workover", "wellhead", "blowout preventer",
    "bop", "casing", "drilling mud", "well control", "spudding",
    
    # Pipelines & Infrastructure
    "offshore pipeline", "subsea pipeline", "gas pipeline", "oil pipeline",
    "flowline", "riser", "umbilical", "manifold", "subsea infrastructure",
    "pipeline construction", "pipeline integrity",
    
    # Integrated Gas & LNG
    "integrated gas", "lng", "liquefied natural gas", "gas processing",
    "gas liquefaction", "lng terminal", "floating lng", "flng",
    "gas export", "lng export",
    
    # Reserves & Resources
    "oil reserves", "gas reserves", "proven reserves", "probable reserves",
    "barrels of oil", "bcf", "billion cubic feet", "mmcf", "mboe",
    "recoverable reserves", "oil discovery", "gas discovery",
    
    # Companies & Operations
    "shell deepwater", "bp deepwater", "chevron deepwater", "exxon deepwater",
    "conocophillips", "petrobras", "equinor", "total energies",
    "occidental petroleum", "murphy oil", "anadarko", "noble energy",
    
    # Safety & Environment
    "offshore safety", "well integrity", "spill prevention", "oil spill",
    "environmental monitoring", "decommissioning", "plugging and abandonment",
    
    # Industry Terms
    "barrel per day", "bpd", "production rate", "first oil",
    "final investment decision", "fid", "sanctioned project",
    "lease sale", "block award", "acreage", "prospect",
]

# Deepwater topic categories for classification
DEEPWATER_CATEGORIES = {
    "deepwater drilling": ["deepwater", "deep water", "ultra-deepwater", "drilling rig", "drillship", "semi-submersible", "jack-up"],
    "gulf of america": ["gulf of mexico", "gulf of america", "gom", "outer continental shelf", "boem", "bsee", "louisiana", "texas offshore"],
    "subsea & pipelines": ["subsea", "pipeline", "flowline", "riser", "umbilical", "manifold", "subsea infrastructure"],
    "lng & integrated gas": ["lng", "liquefied natural gas", "integrated gas", "gas processing", "flng", "gas export"],
    "exploration": ["oil exploration", "gas exploration", "discovery", "prospect", "seismic", "reserves"],
    "production": ["oil production", "gas production", "fpso", "floating production", "first oil", "production rate"],
    "wells": ["oil well", "gas well", "well completion", "well intervention", "workover", "wellhead", "bop"],
    "crude oil": ["crude oil", "barrel", "bpd", "oil price", "wti", "brent"],
    "natural gas": ["natural gas", "bcf", "mcf", "gas price", "henry hub"],
    "safety & environment": ["offshore safety", "spill", "environmental", "decommissioning", "well integrity"],
}

def is_deepwater_related(title, description):
    """Check if an article is related to deepwater drilling and oil & gas."""
    text = (title + " " + description).lower()
    return any(keyword.lower() in text for keyword in DEEPWATER_KEYWORDS)

def clean_html(html_text):
    """Remove HTML tags from text using BeautifulSoup."""
    if not html_text:
        return ""
    try:
        soup = BeautifulSoup(html_text, "html.parser")
        return soup.get_text(separator=" ", strip=True)
    except Exception as e:
        logger.warning(f"BeautifulSoup HTML cleaning failed, using regex fallback: {str(e)}")
        clean_text = re.sub(r'<.*?>', '', html_text)
        return clean_text.strip()

def determine_category(text):
    """Determine the most specific category for the article."""
    text = text.lower()
    
    for category, keywords in DEEPWATER_CATEGORIES.items():
        if any(keyword in text for keyword in keywords):
            return category
    
    return "oil & gas"

def extract_industry_insights(text, source):
    """Extract key insights from industry content."""
    if not text:
        return ""
    
    insights = []
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    industry_terms = [
        "production", "drilling", "discovery", "reserves", "investment",
        "barrel", "cubic feet", "pipeline", "offshore", "deepwater",
        "exploration", "development", "project", "contract", "lease",
        "billion", "million", "percent", "growth", "decline"
    ]
    
    for sentence in sentences:
        if any(term in sentence.lower() for term in industry_terms):
            insights.append(sentence)
    
    if insights:
        return " ".join(insights[:3])
    else:
        return text[:300] + ("..." if len(text) > 300 else "")

def get_domain(url):
    """Extract domain from URL."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    if domain.startswith('www.'):
        domain = domain[4:]
    return domain

def fetch_articles_from_rss(rss_url, max_articles=10):
    """Fetch articles from an RSS feed."""
    articles = []
    
    try:
        feed = feedparser.parse(rss_url)
        
        if not feed or hasattr(feed, 'bozo_exception') and feed.bozo_exception:
            logger.warning(f"Feed parsing warning for {rss_url}: {feed.bozo_exception if hasattr(feed, 'bozo_exception') else 'Unknown error'}")
        
        if not hasattr(feed, 'entries') or len(feed.entries) == 0:
            logger.warning(f"No entries found in feed: {rss_url}")
            return articles
        
        domain = get_domain(rss_url)
        logger.info(f"Processing {len(feed.entries)} entries from {domain}")
        
        for entry in feed.entries[:max_articles * 2]:
            title = entry.get('title', '')
            link = entry.get('link', '')
            
            description = ''
            if 'summary' in entry:
                description = clean_html(entry.summary)
            elif 'description' in entry:
                description = clean_html(entry.description)
            elif 'content' in entry and entry.content:
                content_value = entry.content[0].value if isinstance(entry.content, list) else entry.content
                description = clean_html(content_value)
            
            pub_date = datetime.datetime.now().strftime("%Y-%m-%d")
            if 'published_parsed' in entry and entry.published_parsed:
                pub_date = time.strftime("%Y-%m-%d", entry.published_parsed)
            elif 'updated_parsed' in entry and entry.updated_parsed:
                pub_date = time.strftime("%Y-%m-%d", entry.updated_parsed)
            
            if not is_deepwater_related(title, description):
                continue
            
            source = domain
            
            articles.append({
                'title': title,
                'description': description,
                'link': link,
                'date': pub_date,
                'source': source
            })
            
            if len(articles) >= max_articles:
                break
        
        logger.info(f"Found {len(articles)} deepwater/oil & gas articles from {domain}")
    
    except Exception as e:
        logger.error(f"Error fetching articles from {rss_url}: {str(e)}")
    
    return articles

def get_processed_article_ids():
    """Get a list of article IDs that have already been processed."""
    if not os.path.exists(HISTORY_FILE):
        return set()
    
    with open(HISTORY_FILE, "r") as f:
        return set(line.strip() for line in f)

def save_article_id(article_id):
    """Save an article ID to the history file."""
    with open(HISTORY_FILE, "a") as f:
        f.write(f"{article_id}\n")

def parse_date(date_str):
    """Convert various date formats to datetime objects for sorting."""
    try:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        try:
            return datetime.datetime.strptime(date_str, "%m/%d/%Y")
        except ValueError:
            try:
                return datetime.datetime.strptime(date_str, "%d-%m-%Y")
            except ValueError:
                logger.warning(f"Could not parse date format: {date_str}")
                return datetime.datetime(1900, 1, 1)

def read_existing_articles():
    """Read all articles from the existing CSV file."""
    existing_articles = []
    existing_urls = set()
    
    try:
        with open(CSV_OUTPUT_PATH, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row['url'] not in existing_urls:
                    existing_articles.append(row)
                    existing_urls.add(row['url'])
        logger.info(f"Read {len(existing_articles)} articles from {CSV_OUTPUT_PATH}")
    except Exception as e:
        logger.warning(f"Error reading CSV file at {CSV_OUTPUT_PATH}: {str(e)}")
    
    return existing_articles, existing_urls

try:
    from zoneinfo import ZoneInfo
except ImportError:
    from pytz import timezone as ZoneInfo

def collect_news():
    """Collect news articles and save them to a CSV file."""
    logger.info(f"Starting news collection, writing to: {CSV_OUTPUT_PATH}")
    
    try:
        central = ZoneInfo("America/Chicago")
    except Exception:
        import pytz
        central = pytz.timezone("America/Chicago")
    
    now_central = datetime.datetime.now(central)
    current_date = now_central.strftime("%Y-%m-%d")
    iso_timestamp = now_central.isoformat()
    last_update = {
        "last_updated": current_date,
        "timestamp": iso_timestamp
    }

    update_info_path = os.path.join(os.path.dirname(CSV_OUTPUT_PATH), "last_update.json")
    try:
        with open(update_info_path, 'w') as f:
            import json
            json.dump(last_update, f)
        logger.info(f"Saved last update timestamp (Central Time): {current_date}")
    except Exception as e:
        logger.error(f"Error saving update timestamp: {str(e)}")
    
    processed_ids = get_processed_article_ids()
    existing_articles, existing_urls = read_existing_articles()
    logger.info(f"Found {len(existing_articles)} existing articles in CSV")
    
    new_articles = []
    
    for feed_url in RSS_FEEDS:
        source_domain = get_domain(feed_url)
        logger.info(f"Fetching articles from: {source_domain}")
        
        try:
            # Determine source type
            if "boem" in source_domain or "bsee" in source_domain:
                source_type = "Government Agency"
            elif any(company in source_domain for company in ["exxon", "chevron", "shell", "bp.com"]):
                source_type = "Major Operator"
            elif "eia.gov" in source_domain or "energy.gov" in source_domain:
                source_type = "Government Data"
            else:
                source_type = "Industry News"
            
            articles = fetch_articles_from_rss(feed_url, MAX_ARTICLES_PER_SOURCE)
            
            for article in articles:
                article_id = article['link']
                
                if article_id in processed_ids or article_id in existing_urls:
                    continue
                
                text = (article['title'] + " " + article['description']).lower()
                category = determine_category(text)
                
                insights = extract_industry_insights(article['description'], source_domain)
                
                title = html.unescape(article['title'])
                description = html.unescape(article['description'])
                pub_date = article['date']
                
                new_articles.append({
                    'date': pub_date,
                    'title': title,
                    'description': description,
                    'source': article['source'],
                    'url': article_id,
                    'category': category,
                    'source_type': source_type,
                    'insights': insights
                })
                
                save_article_id(article_id)
                existing_urls.add(article_id)
            
            time.sleep(2)
            
        except Exception as e:
            logger.error(f"Error processing feed {feed_url}: {str(e)}")
    
    if new_articles:
        logger.info(f"Found {len(new_articles)} new articles to add")
        
        all_articles = existing_articles + new_articles
        all_articles.sort(key=lambda x: parse_date(x['date']), reverse=True)
        
        os.makedirs(os.path.dirname(CSV_OUTPUT_PATH), exist_ok=True)
        
        temp_file = CSV_OUTPUT_PATH.with_suffix('.temp.csv')
        with open(temp_file, mode='w', newline='', encoding='utf-8') as file:
            fieldnames = ['date', 'title', 'description', 'source', 'url', 'category', 'source_type', 'insights']
            writer = csv.DictWriter(file, fieldnames=fieldnames)
            writer.writeheader()
            for article in all_articles:
                writer.writerow(article)
        
        if os.path.exists(CSV_OUTPUT_PATH):
            os.remove(CSV_OUTPUT_PATH)
        os.rename(temp_file, CSV_OUTPUT_PATH)
        
        logger.info(f"Updated primary CSV with {len(all_articles)} total articles")
        
        for secondary_path in SECONDARY_CSV_PATHS:
            try:
                os.makedirs(os.path.dirname(secondary_path), exist_ok=True)
                shutil.copy2(CSV_OUTPUT_PATH, secondary_path)
                logger.info(f"Copied CSV to secondary location: {secondary_path}")
            except Exception as e:
                logger.error(f"Error copying CSV to {secondary_path}: {str(e)}")
        
        logger.info("CSV update completed successfully")
    else:
        logger.info("No new articles found to add")

if __name__ == "__main__":
    try:
        collect_news()
    except Exception as e:
        logger.error(f"Unhandled exception in the main process: {str(e)}")
