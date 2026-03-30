import requests
import argparse
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
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
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
DEFAULT_SITE_URL = "https://steviesimsii.github.io/Deepwater_Daily/"
TEAMS_MAX_CARD_ARTICLES = 3
TEAMS_DESCRIPTION_LIMIT = 280
EMAIL_MAX_ARTICLES = 5
EMAIL_DESCRIPTION_LIMIT = 400

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

def truncate_text(text, max_length):
    """Trim text to a reasonable length for cards and logs."""
    if not text:
        return ""

    normalized = re.sub(r'\s+', ' ', text).strip()
    if len(normalized) <= max_length:
        return normalized

    return normalized[: max_length - 3].rstrip() + "..."

def build_teams_card_payload(new_articles, current_date, site_url):
    """Build an Adaptive Card payload for Microsoft Teams."""
    article_count = len(new_articles)
    card_articles = new_articles[:TEAMS_MAX_CARD_ARTICLES]
    latest_source_line = ", ".join(
        sorted({article.get("source", "Unknown source") for article in card_articles if article.get("source")})
    )

    body = [
        {
            "type": "TextBlock",
            "text": "Deepwater Daily",
            "size": "Large",
            "weight": "Bolder",
            "wrap": True
        },
        {
            "type": "TextBlock",
            "text": f"{article_count} new article{'s' if article_count != 1 else ''} for {current_date}",
            "spacing": "None",
            "isSubtle": True,
            "wrap": True
        },
        {
            "type": "TextBlock",
            "text": "Latest deepwater, offshore, LNG, and Gulf-focused coverage in a readable daily briefing.",
            "spacing": "Small",
            "wrap": True
        }
    ]

    if latest_source_line:
        body.append(
            {
                "type": "TextBlock",
                "text": f"Featured sources: {latest_source_line}",
                "isSubtle": True,
                "spacing": "Small",
                "wrap": True
            }
        )

    for article in card_articles:
        category = article.get("category", "oil & gas").title()
        description = truncate_text(article.get("description", ""), TEAMS_DESCRIPTION_LIMIT)
        meta_parts = [article.get("source", "Unknown source")]
        if article.get("date"):
            meta_parts.append(article["date"])
        if category:
            meta_parts.append(category)

        body.append(
            {
                "type": "Container",
                "separator": True,
                "items": [
                    {
                        "type": "TextBlock",
                        "text": f"[{article.get('title', 'Untitled article')}]({article.get('url', site_url)})",
                        "weight": "Bolder",
                        "wrap": True
                    },
                    {
                        "type": "TextBlock",
                        "text": " | ".join(meta_parts),
                        "isSubtle": True,
                        "spacing": "None",
                        "wrap": True
                    },
                    {
                        "type": "TextBlock",
                        "text": description or "No description available.",
                        "wrap": True,
                        "spacing": "Small",
                        "maxLines": 6
                    }
                ]
            }
        )

    if article_count > TEAMS_MAX_CARD_ARTICLES:
        body.append(
            {
                "type": "TextBlock",
                "text": f"Showing the top {TEAMS_MAX_CARD_ARTICLES} stories. Open Deepwater Daily for the remaining {article_count - TEAMS_MAX_CARD_ARTICLES} article{'s' if article_count - TEAMS_MAX_CARD_ARTICLES != 1 else ''}.",
                "isSubtle": True,
                "wrap": True,
                "separator": True
            }
        )

    return {
        "type": "message",
        "attachments": [
            {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "contentUrl": None,
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.4",
                    "body": body,
                    "actions": [
                        {
                            "type": "Action.OpenUrl",
                            "title": "Open Deepwater Daily",
                            "url": site_url
                        }
                    ]
                }
            }
        ]
    }

def build_email_html(new_articles, current_date, site_url):
    """Build an HTML email body for the daily Deepwater Daily digest."""
    article_count = len(new_articles)
    email_articles = new_articles[:EMAIL_MAX_ARTICLES]

    source_set = sorted({a.get("source", "") for a in email_articles if a.get("source")})
    source_line = ", ".join(source_set) if source_set else ""

    articles_html = ""
    for article in email_articles:
        category = article.get("category", "oil & gas").title()
        description = truncate_text(article.get("description", ""), EMAIL_DESCRIPTION_LIMIT)
        meta_parts = [article.get("source", "Unknown source")]
        if article.get("date"):
            meta_parts.append(article["date"])
        if category:
            meta_parts.append(category)
        meta_line = " &nbsp;|&nbsp; ".join(html.escape(p) for p in meta_parts)
        title_text = html.escape(article.get("title", "Untitled article"))
        article_url = article.get("url", site_url)
        description_text = html.escape(description) if description else "No description available."

        articles_html += f"""
        <div style="border-top:1px solid #e0e0e0;padding:16px 0;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;">
            <a href="{article_url}" style="color:#005f8c;text-decoration:none;">{title_text}</a>
          </p>
          <p style="margin:0 0 8px;font-size:12px;color:#888;">{meta_line}</p>
          <p style="margin:0;font-size:14px;color:#333;line-height:1.5;">{description_text}</p>
        </div>"""

    overflow_note = ""
    if article_count > EMAIL_MAX_ARTICLES:
        remaining = article_count - EMAIL_MAX_ARTICLES
        overflow_note = f"""
        <p style="font-size:13px;color:#888;border-top:1px solid #e0e0e0;padding-top:12px;margin-top:0;">
          Showing top {EMAIL_MAX_ARTICLES} stories.
          <a href="{site_url}" style="color:#005f8c;">Open Deepwater Daily</a> for the remaining {remaining} article{"s" if remaining != 1 else ""}.
        </p>"""

    source_block = ""
    if source_line:
        source_block = f'<p style="margin:4px 0 0;font-size:12px;color:#888;">Featured sources: {html.escape(source_line)}</p>'

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="background:#003a52;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:.5px;">Deepwater Daily</h1>
      <p style="margin:6px 0 0;color:#a0c8d8;font-size:14px;">
        {article_count} new article{"s" if article_count != 1 else ""} &mdash; {html.escape(current_date)}
      </p>
      {source_block}
    </div>
    <div style="padding:0 32px 8px;">
      {articles_html}
      {overflow_note}
    </div>
    <div style="background:#f5f5f5;padding:16px 32px;text-align:center;">
      <a href="{site_url}" style="display:inline-block;background:#005f8c;color:#fff;text-decoration:none;padding:10px 24px;border-radius:4px;font-size:14px;font-family:Arial,sans-serif;">
        Open Deepwater Daily
      </a>
      <p style="margin:12px 0 0;font-size:11px;color:#aaa;font-family:Arial,sans-serif;">
        You are receiving this because you subscribed to Deepwater Daily email updates.
      </p>
    </div>
  </div>
</body>
</html>"""


def send_email_notification(new_articles, current_date):
    """Send an HTML digest email when SMTP credentials are configured."""
    smtp_host = os.getenv("EMAIL_SMTP_HOST", "").strip()
    smtp_port_str = os.getenv("EMAIL_SMTP_PORT", "587").strip()
    username = os.getenv("EMAIL_USERNAME", "").strip()
    password = os.getenv("EMAIL_PASSWORD", "").strip()
    to_raw = os.getenv("EMAIL_TO", "").strip()
    from_addr = os.getenv("EMAIL_FROM", username).strip() or username

    if not all([smtp_host, username, password, to_raw]):
        logger.info("Email credentials not fully configured; skipping email notification")
        return False

    if not new_articles:
        logger.info("No new articles found; skipping email notification")
        return False

    try:
        smtp_port = int(smtp_port_str)
    except ValueError:
        logger.error("EMAIL_SMTP_PORT is not a valid integer: %s", smtp_port_str)
        return False

    recipients = [addr.strip() for addr in to_raw.split(",") if addr.strip()]
    if not recipients:
        logger.error("EMAIL_TO contains no valid addresses")
        return False

    site_url = os.getenv("TEAMS_SITE_URL", DEFAULT_SITE_URL).strip() or DEFAULT_SITE_URL
    subject = f"Deepwater Daily — {len(new_articles)} new article{'s' if len(new_articles) != 1 else ''} for {current_date}"
    html_body = build_email_html(new_articles, current_date, site_url)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = ", ".join(recipients)
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.login(username, password)
            server.sendmail(from_addr, recipients, msg.as_string())
        logger.info("Sent email digest to %s recipient(s)", len(recipients))
        return True
    except Exception as exc:
        logger.error("Failed to send email notification: %s", exc)
        return False


def run_email_test_notification(sample_count):
    """Send a test email using sample articles."""
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    site_url = os.getenv("TEAMS_SITE_URL", DEFAULT_SITE_URL).strip() or DEFAULT_SITE_URL
    sample_articles = build_sample_articles(current_date, site_url, sample_count)
    return send_email_notification(sample_articles, current_date)


def run_email_live_notification(article_count):
    """Send an email using real articles already stored in the CSV."""
    if not os.path.exists(CSV_OUTPUT_PATH):
        logger.warning("CSV not found; cannot send live email notification")
        return False
    live_articles = []
    with open(CSV_OUTPUT_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            live_articles.append(row)
            if len(live_articles) >= article_count:
                break
    if not live_articles:
        logger.warning("No articles found in CSV dataset; cannot send live email notification")
        return False
    current_date = live_articles[0].get("date", datetime.datetime.now().strftime("%Y-%m-%d"))
    return send_email_notification(live_articles, current_date)


def build_sample_articles(current_date, site_url, count=3):
    """Build sample articles for validating the Teams card layout."""
    sample_pool = [
        {
            "date": current_date,
            "title": "Sample Deepwater Card: Kaikias Waterflood Update",
            "description": "This sample item shows how a subsea project headline, summary, and source metadata will render in Microsoft Teams.",
            "source": "deepwaterdaily.test",
            "url": site_url,
            "category": "subsea & pipelines",
            "source_type": "Test Feed",
            "insights": "Sample Teams notification card."
        },
        {
            "date": current_date,
            "title": "Sample Deepwater Card: Gulf Production Briefing",
            "description": "Use this card to verify title links, summary trimming, and the overall readability of your Teams channel notification.",
            "source": "deepwaterdaily.test",
            "url": site_url,
            "category": "production",
            "source_type": "Test Feed",
            "insights": "Sample Teams notification card."
        },
        {
            "date": current_date,
            "title": "Sample Deepwater Card: LNG Market Snapshot",
            "description": "This sample entry helps confirm the Adaptive Card layout before the scheduled workflow starts posting live daily articles.",
            "source": "deepwaterdaily.test",
            "url": site_url,
            "category": "lng & integrated gas",
            "source_type": "Test Feed",
            "insights": "Sample Teams notification card."
        },
        {
            "date": current_date,
            "title": "Sample Deepwater Card: Drillship Contract Watch",
            "description": "A fourth sample row lets you check how multiple articles stack visually when the Teams card grows longer.",
            "source": "deepwaterdaily.test",
            "url": site_url,
            "category": "deepwater drilling",
            "source_type": "Test Feed",
            "insights": "Sample Teams notification card."
        },
        {
            "date": current_date,
            "title": "Sample Deepwater Card: New Exploration Acreage",
            "description": "Use five items to preview the maximum number of article blocks that the Teams card will show before truncating the list.",
            "source": "deepwaterdaily.test",
            "url": site_url,
            "category": "exploration",
            "source_type": "Test Feed",
            "insights": "Sample Teams notification card."
        }
    ]

    safe_count = max(1, min(count, len(sample_pool)))
    return sample_pool[:safe_count]

def parse_args():
    """Parse command-line options for collector and Teams test mode."""
    parser = argparse.ArgumentParser(description="Collect Deepwater Daily news and optionally test Teams delivery.")
    parser.add_argument(
        "--teams-test",
        action="store_true",
        help="Send a sample Teams Adaptive Card without running the RSS collection pipeline."
    )
    parser.add_argument(
        "--teams-test-count",
        type=int,
        default=3,
        help="Number of sample articles to include when using --teams-test (1-5)."
    )
    parser.add_argument(
        "--teams-live-from-csv",
        action="store_true",
        help="Send a Teams Adaptive Card using the latest real articles already stored in docs/data/deepwater_news.csv."
    )
    parser.add_argument(
        "--teams-live-count",
        type=int,
        default=5,
        help="Number of real CSV articles to include when using --teams-live-from-csv (1-5)."
    )
    parser.add_argument(
        "--teams-required",
        action="store_true",
        help="Exit with a nonzero status if Teams notification is skipped or fails."
    )
    parser.add_argument(
        "--email-test",
        action="store_true",
        help="Send a sample email digest without running the RSS collection pipeline."
    )
    parser.add_argument(
        "--email-test-count",
        type=int,
        default=3,
        help="Number of sample articles to include when using --email-test (1-5)."
    )
    parser.add_argument(
        "--email-live-from-csv",
        action="store_true",
        help="Send an email digest using the latest real articles already stored in docs/data/deepwater_news.csv."
    )
    parser.add_argument(
        "--email-live-count",
        type=int,
        default=5,
        help="Number of real CSV articles to include when using --email-live-from-csv (1-5)."
    )
    parser.add_argument(
        "--email-required",
        action="store_true",
        help="Exit with a nonzero status if email notification is skipped or fails."
    )
    return parser.parse_args()

def send_teams_notification(new_articles, current_date):
    """Send an Adaptive Card notification to Microsoft Teams when configured."""
    webhook_url = os.getenv("TEAMS_WEBHOOK_URL", "").strip()
    if not webhook_url:
        logger.info("TEAMS_WEBHOOK_URL not configured; skipping Teams notification")
        return False

    if not new_articles:
        logger.info("No new articles found; skipping Teams notification")
        return False

    site_url = os.getenv("TEAMS_SITE_URL", DEFAULT_SITE_URL).strip() or DEFAULT_SITE_URL
    payload = build_teams_card_payload(new_articles, current_date, site_url)
    payload_size = len(json.dumps(payload).encode("utf-8"))

    if payload_size > 28000:
        logger.warning("Teams payload exceeded size limit; trimming descriptions")
        for article in new_articles[:TEAMS_MAX_CARD_ARTICLES]:
            article["description"] = truncate_text(article.get("description", ""), 96)
        payload = build_teams_card_payload(new_articles, current_date, site_url)

    try:
        response = requests.post(webhook_url, json=payload, timeout=20)
        response.raise_for_status()
        logger.info("Posted %s new articles to Microsoft Teams", len(new_articles))
        return True
    except requests.RequestException as exc:
        logger.error("Failed to post Microsoft Teams notification: %s", exc)
        return False

def run_teams_test_notification(sample_count):
    """Send a sample Teams card on demand for manual validation."""
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    site_url = os.getenv("TEAMS_SITE_URL", DEFAULT_SITE_URL).strip() or DEFAULT_SITE_URL
    sample_articles = build_sample_articles(current_date, site_url, sample_count)
    logger.info("Sending sample Microsoft Teams card with %s articles", len(sample_articles))
    return send_teams_notification(sample_articles, current_date)

def get_latest_articles_from_csv(limit=5):
    """Load the latest articles from the existing CSV for manual Teams posts."""
    existing_articles, _ = read_existing_articles()
    if not existing_articles:
        return []

    sorted_articles = sorted(
        existing_articles,
        key=lambda article: parse_date(article.get("date", "")),
        reverse=True
    )
    safe_limit = max(1, min(limit, TEAMS_MAX_CARD_ARTICLES))
    return sorted_articles[:safe_limit]

def run_teams_live_notification(article_count):
    """Send a Teams card from the latest real articles already stored in the repo CSV."""
    live_articles = get_latest_articles_from_csv(article_count)
    if not live_articles:
        logger.warning("No articles found in CSV dataset; cannot send live Teams notification")
        return False

    current_date = live_articles[0].get("date") or datetime.datetime.now().strftime("%Y-%m-%d")
    logger.info("Sending live Microsoft Teams card with %s CSV articles", len(live_articles))
    return send_teams_notification(live_articles, current_date)

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
    result = {
        "current_date": current_date,
        "timestamp": iso_timestamp,
        "new_articles": []
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
        result["new_articles"] = new_articles
    else:
        logger.info("No new articles found to add")

    return result

if __name__ == "__main__":
    try:
        args = parse_args()

        # --- Teams path ---
        if args.teams_test:
            teams_sent = run_teams_test_notification(args.teams_test_count)
            email_sent = False
        elif args.teams_live_from_csv:
            teams_sent = run_teams_live_notification(args.teams_live_count)
            email_sent = False
        # --- Email-only test paths ---
        elif args.email_test:
            teams_sent = False
            email_sent = run_email_test_notification(args.email_test_count)
        elif args.email_live_from_csv:
            teams_sent = False
            email_sent = run_email_live_notification(args.email_live_count)
        # --- Normal collection: send both Teams and email ---
        else:
            run_result = collect_news()
            teams_sent = send_teams_notification(run_result["new_articles"], run_result["current_date"])
            email_sent = send_email_notification(run_result["new_articles"], run_result["current_date"])

        if args.teams_required and not teams_sent:
            raise RuntimeError("Teams notification was required but was skipped or failed")
        if args.email_required and not email_sent:
            raise RuntimeError("Email notification was required but was skipped or failed")
    except Exception as e:
        logger.error(f"Unhandled exception in the main process: {str(e)}")
        raise
