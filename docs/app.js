const APP_CONFIG = {
  csvPath: "data/deepwater_news.csv",
  emptyCategory: "oil & gas",
  sourceLabel: "Deepwater Daily",
};

const state = {
  allItems: [],
  filteredItems: [],
  activeCategory: "all",
  searchQuery: "",
  page: 1,
  perPage: 12,
};

document.addEventListener("DOMContentLoaded", () => {
  bindShell();
  loadLastUpdateTime();
  loadNewsData()
    .then((items) => {
      state.allItems = items;
      buildCategoryFilters(items);
      applyFilters();
      updateSummary(items);
    })
    .catch((error) => {
      console.error("Error loading news data:", error);
      const container = document.getElementById("news-container");
      if (container) {
        container.innerHTML = '<div class="section-empty"><p>Error loading news data. Please try again later.</p></div>';
      }
    });
});

function bindShell() {
  document.getElementById("brand-home")?.addEventListener("click", showAllNews);
  document.getElementById("all-news-link")?.addEventListener("click", showAllNews);
  document.getElementById("about-link")?.addEventListener("click", showAboutPage);
  document.getElementById("search-input")?.addEventListener("input", (event) => {
    state.searchQuery = event.target.value.trim().toLowerCase();
    state.page = 1;
    applyFilters();
  });
  document.getElementById("filters")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    state.activeCategory = button.dataset.category;
    state.page = 1;
    document.querySelectorAll(".tag-pill").forEach((pill) => pill.classList.toggle("active", pill === button));
    applyFilters();
  });
  document.getElementById("load-more-btn")?.addEventListener("click", () => {
    state.page += 1;
    renderNews();
  });
}

function loadNewsData() {
  return d3.csv(APP_CONFIG.csvPath).then((rows) => {
    return rows
      .map((item) => {
        const date = new Date(item.date);
        return {
          title: item.title || "Untitled article",
          description: item.description || item.insights || "",
          source: item.source || APP_CONFIG.sourceLabel,
          url: item.url || "#",
          category: (item.category || APP_CONFIG.emptyCategory).trim(),
          sourceType: item.source_type || "",
          insights: item.insights || "",
          date,
          formattedDate: Number.isNaN(date.valueOf())
            ? item.date || "Unknown date"
            : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        };
      })
      .sort((a, b) => b.date - a.date);
  });
}

function buildCategoryFilters(items) {
  const filters = document.getElementById("filters");
  if (!filters) return;

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = "tag-pill";
    button.type = "button";
    button.dataset.category = category;
    button.textContent = titleCase(category);
    filters.appendChild(button);
  });
}

function updateSummary(items) {
  const categories = new Set(items.map((item) => item.category).filter(Boolean));
  setText("digest-count", `${items.length} articles / ${categories.size} categories`);
  setText("article-count", String(items.length));
  setText("total-stat", `${items.length} saved articles`);
  setText("category-stat", `${categories.size} categories`);
}

function applyFilters() {
  const query = state.searchQuery;
  const category = state.activeCategory;

  state.filteredItems = state.allItems.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const searchable = [item.title, item.description, item.source, item.category, item.sourceType, item.insights]
      .join(" ")
      .toLowerCase();
    return matchesCategory && (!query || searchable.includes(query));
  });

  updateViewMeta();
  renderNews();
}

function renderNews() {
  const container = document.getElementById("news-container");
  const noResults = document.getElementById("no-results");
  const loadMore = document.getElementById("load-more-btn");
  if (!container) return;

  const visibleItems = state.filteredItems.slice(0, state.page * state.perPage);
  container.innerHTML = "";
  visibleItems.forEach((item) => container.appendChild(createStoryCard(item)));

  if (noResults) noResults.hidden = state.filteredItems.length > 0;
  if (loadMore) loadMore.hidden = visibleItems.length >= state.filteredItems.length;
  setText("result-count", `${state.filteredItems.length} results`);
}

function createStoryCard(item) {
  const article = document.createElement("article");
  article.className = "story-card";

  const kicker = document.createElement("div");
  kicker.className = "story-kicker";
  kicker.textContent = titleCase(item.category);

  const title = document.createElement("h3");
  const link = document.createElement("a");
  link.className = "story-link";
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = item.title;
  title.appendChild(link);

  const summary = document.createElement("p");
  summary.className = "story-summary";
  summary.textContent = item.description;

  const meta = document.createElement("div");
  meta.className = "card-meta";
  [item.formattedDate, item.source, item.sourceType].filter(Boolean).forEach((bit) => {
    const span = document.createElement("span");
    span.textContent = bit;
    meta.appendChild(span);
  });

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const action = document.createElement("a");
  action.className = "card-action";
  action.href = item.url;
  action.target = "_blank";
  action.rel = "noreferrer";
  action.textContent = "Read story";
  actions.appendChild(action);

  article.append(kicker, title, summary, meta, actions);
  return article;
}

function updateViewMeta() {
  const label = state.activeCategory === "all" ? "All articles" : titleCase(state.activeCategory);
  const filterText = state.searchQuery ? ` matching "${state.searchQuery}"` : "";
  setText("active-view-label", label);
  setText("active-view-meta", `${state.filteredItems.length} articles${filterText}`);
}

function showAllNews(event) {
  event?.preventDefault();
  document.getElementById("about-view").hidden = true;
  document.getElementById("all-news-view").hidden = false;
  document.getElementById("hero-section").hidden = false;
  setActiveNav("all-news-link");
}

function showAboutPage(event) {
  event?.preventDefault();
  document.getElementById("all-news-view").hidden = true;
  document.getElementById("hero-section").hidden = true;
  document.getElementById("about-view").hidden = false;
  setActiveNav("about-link");
}

function setActiveNav(id) {
  document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.id === id));
}

function loadLastUpdateTime() {
  fetch("data/last_update.json")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load update timestamp");
      return response.json();
    })
    .then((data) => {
      const timestamp = new Date(data.timestamp);
      setText("last-updated-date", formatDateTime(timestamp));
    })
    .catch(() => setText("last-updated-date", formatDateTime(new Date())));
}

function formatDateTime(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}
