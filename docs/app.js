// Deepwater Daily - Main JavaScript Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();

    // Navigation event listeners
    document.getElementById('all-news-link').addEventListener('click', function(e) {
        e.preventDefault();
        showAllNews();
        setActiveNav(this);
    });

    document.getElementById('about-link').addEventListener('click', function(e) {
        e.preventDefault();
        showAboutPage();
        setActiveNav(this);
    });
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            filterNewsBySearch(this.value);
        }, 300));
        
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterNewsBySearch(this.value);
            }
        });
    }
    
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                filterNewsBySearch(searchInput.value);
            }
        });
    }
    
    // View toggle buttons
    const articleViewBtn = document.getElementById('article-view-btn');
    const gridViewBtn = document.getElementById('grid-view-btn');
    
    if (articleViewBtn && gridViewBtn) {
        articleViewBtn.addEventListener('click', function() {
            setViewMode('article');
        });
        
        gridViewBtn.addEventListener('click', function() {
            setViewMode('grid');
        });
    }
    
    // Category filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterNewsByCategory(this.dataset.category);
        });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
        
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }
    
    // Load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            if (window.currentNewsItems && window.currentPage) {
                window.currentPage++;
                displayNews(window.currentNewsItems, false);
            }
        });
    }
    
    // Initialize with article view
    setViewMode('article');
});

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize the application
function initApp() {
    loadLastUpdateTime();
    
    loadNewsData()
        .then(data => {
            window.newsData = data;
            window.currentNewsItems = data;
            window.currentPage = 1;
            window.itemsPerPage = 10;
            
            displayNews(data);
        })
        .catch(error => {
            console.error('Error loading news data:', error);
            document.getElementById('loading-indicator').style.display = 'none';
            document.getElementById('news-container').innerHTML = 
                '<div class="loading-state"><p>Error loading news data. Please try again later.</p></div>';
        });
}

// Load news data from CSV
function loadNewsData() {
    return new Promise((resolve, reject) => {
        d3.csv('data/deepwater_news.csv')
            .then(data => {
                const processedData = processNewsData(data);
                resolve(processedData);
            })
            .catch(error => {
                console.error('Error fetching CSV:', error);
                reject(error);
            });
    });
}

// Process and format the news data
function processNewsData(data) {
    return data.map(item => {
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return {
            ...item,
            formattedDate: formattedDate,
            date: date,
            category: item.category ? item.category.trim() : 'oil & gas'
        };
    }).sort((a, b) => b.date - a.date);
}

// Display news in the container
function displayNews(newsItems, resetPage = true) {
    const container = document.getElementById('news-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noResults = document.getElementById('no-results');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    if (!container) {
        console.error('News container not found!');
        return;
    }
    
    window.currentNewsItems = newsItems;
    
    if (resetPage) {
        window.currentPage = 1;
        container.innerHTML = '';
    }
    
    const startIndex = resetPage ? 0 : (window.currentPage - 1) * window.itemsPerPage;
    const endIndex = window.currentPage * window.itemsPerPage;
    const paginatedItems = newsItems.slice(startIndex, endIndex);
    
    if (loadMoreBtn) {
        loadMoreBtn.style.display = endIndex >= newsItems.length ? 'none' : 'block';
    }
    
    if (newsItems.length === 0) {
        if (noResults) noResults.style.display = 'block';
        container.innerHTML = '';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    const viewMode = localStorage.getItem('viewMode') || 'article';
    
    if (resetPage) {
        container.innerHTML = '';
    }
    
    paginatedItems.forEach((item) => {
        container.appendChild(createArticleCard(item, viewMode));
    });
}

// Create article card element
function createArticleCard(item, viewMode) {
    const article = document.createElement('article');
    article.className = 'article-card';
    
    const categoryClass = getCategoryClass(item.category);
    const relativeTime = getRelativeTime(item.date);
    
    article.innerHTML = `
        <span class="article-category ${categoryClass}">${item.category}</span>
        <h2 class="article-title">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>
        </h2>
        <p class="article-excerpt">${item.description}</p>
        <div class="article-meta">
            <span class="article-meta-item">
                <i class="bi bi-clock"></i>
                ${relativeTime}
            </span>
            <span class="article-source">${item.source}</span>
        </div>
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="read-more-link">
            Read Full Article <i class="bi bi-arrow-right"></i>
        </a>
    `;
    
    return article;
}

// Get relative time string
function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
        return `${diffMinutes} min ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
    }
}

// Get category CSS class
function getCategoryClass(category) {
    category = category.toLowerCase();
    
    if (category.includes('deepwater') || category.includes('drilling')) {
        return 'category-deepwater';
    } else if (category.includes('gulf')) {
        return 'category-gulf';
    } else if (category.includes('crude')) {
        return 'category-crude';
    } else if (category.includes('natural gas') || category.includes('gas')) {
        return 'category-gas';
    } else if (category.includes('pipeline') || category.includes('subsea')) {
        return 'category-pipeline';
    } else if (category.includes('lng')) {
        return 'category-lng';
    }
    return '';
}

// Set view mode
function setViewMode(mode) {
    localStorage.setItem('viewMode', mode);
    
    const articleBtn = document.getElementById('article-view-btn');
    const gridBtn = document.getElementById('grid-view-btn');
    const container = document.getElementById('news-container');
    
    if (articleBtn && gridBtn) {
        if (mode === 'article') {
            articleBtn.classList.add('active');
            gridBtn.classList.remove('active');
        } else {
            articleBtn.classList.remove('active');
            gridBtn.classList.add('active');
        }
    }
    
    if (container) {
        container.classList.remove('grid-view');
        if (mode === 'grid') {
            container.classList.add('grid-view');
        }
    }
    
    if (window.currentNewsItems) {
        displayNews(window.currentNewsItems);
    }
}

// Update theme toggle icon
function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
}

// Set active navigation link
function setActiveNav(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Filter news by search query
function filterNewsBySearch(query) {
    if (!window.newsData) return;
    
    query = query.toLowerCase().trim();
    
    if (!query) {
        displayNews(window.newsData);
        return;
    }
    
    const filtered = window.newsData.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.description.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
    
    displayNews(filtered);
}

// Filter news by category
function filterNewsByCategory(category) {
    if (!window.newsData) return;
    
    if (category === 'all') {
        displayNews(window.newsData);
        return;
    }
    
    const filtered = window.newsData.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
    );
    
    displayNews(filtered);
}

// Show all news view
function showAllNews() {
    document.getElementById('about-view').style.display = 'none';
    document.getElementById('all-news-view').style.display = 'block';
    document.getElementById('hero-section').style.display = 'block';
    
    if (window.newsData) {
        displayNews(window.newsData);
    }
}

// Show about page
function showAboutPage() {
    document.getElementById('all-news-view').style.display = 'none';
    document.getElementById('hero-section').style.display = 'none';
    document.getElementById('about-view').style.display = 'block';
}

// Load and display the last update timestamp
function loadLastUpdateTime() {
    fetch('data/last_update.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load update timestamp');
            }
            return response.json();
        })
        .then(data => {
            const timestamp = new Date(data.timestamp);
            const months = ["January", "February", "March", "April", "May", "June", 
                          "July", "August", "September", "October", "November", "December"];
            const month = months[timestamp.getMonth()];
            const day = timestamp.getDate();
            const year = timestamp.getFullYear();
            
            function ordinal(n) {
                if (n > 3 && n < 21) return 'th';
                switch (n % 10) {
                    case 1: return 'st';
                    case 2: return 'nd';
                    case 3: return 'rd';
                    default: return 'th';
                }
            }
            
            let hour = timestamp.getHours();
            let minute = timestamp.getMinutes();
            if (minute < 10) minute = '0' + minute;
            
            const options = { timeZone: 'America/Chicago', timeZoneName: 'short' };
            const tzString = timestamp.toLocaleTimeString('en-US', options);
            const tzAbbr = tzString.match(/([A-Z]{2,4})$/) ? tzString.match(/([A-Z]{2,4})$/)[1] : '';
            
            const formattedDate = `${month} ${day}${ordinal(day)}, ${year} at ${hour}:${minute} ${tzAbbr}`;
            
            const lastUpdatedElement = document.getElementById('last-updated-date');
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = formattedDate;
            }
        })
        .catch(error => {
            console.warn('Error loading update timestamp:', error);
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            };
            const currentDate = new Date().toLocaleDateString('en-US', options);
            
            const lastUpdatedElement = document.getElementById('last-updated-date');
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = currentDate;
            }
        });
}
