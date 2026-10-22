/**
 * GachaFinder Japan - Frontend Application v2.6
 * Features:
 * - Multilingual search (German/English/Romaji -> Japanese) with expanded franchises (Frieren, Kemikaru Hamster, Sakura, etc.)
 * - Prominent release date badges directly on search overview tiles
 * - Multi-source aggregation & cross-linking (Bandai + Gacha-Island + GachaNavi)
 * - Availability status badges on search cards (🟢 In Stock, ⏳ Upcoming, 🔴 Out of Stock, 📦 Archived)
 * - Favorites & Bookmark system (saved items and search queries) in localStorage
 * - Accurate store inventory & caching (Tokyo returns all official stores)
 * - Interactive Leaflet Japan map with live store count indicators
 */

// Dynamic Backend Base URL (Works locally, on network IP, or on GitHub Pages)
let API_BASE = (function() {
  const saved = localStorage.getItem('gacha_backend_url');
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/+$/, '');
  }
  const origin = window.location.origin || '';
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return window.location.port === '8000' ? '' : 'http://localhost:8000';
  }
  // Default for GitHub Pages or remote host
  return 'http://localhost:8000';
})();

// Application State
const state = {
  currentMaker: 'all',
  currentQuery: '',
  popularItems: [],
  currentResults: [],
  prefectures: [],
  activeProduct: null,
  allShops: [],          // All-Japan shops for active product
  filteredShops: [],     // Current region filtered shops
  currentPref: '',       // Default: All Japan ('')
  regionCache: {},       // Cache: prefCode -> shops[] for instant 0ms switching
  currentView: 'map',    // Default: Map View!
  map: null,
  markersLayer: null,
  favorites: {
    items: [],
    searches: []
  }
};

// DOM Elements - Search
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const btnClear = document.getElementById('btnClear');
const btnSubmit = document.getElementById('btnSubmit');
const btnSaveSearch = document.getElementById('btnSaveSearch');
const translationNotice = document.getElementById('translationNotice');
const productGrid = document.getElementById('productGrid');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const resultsHeading = document.getElementById('resultsHeading');
const resultsCount = document.getElementById('resultsCount');
const btnResetToPopular = document.getElementById('btnResetToPopular');
const makerPills = document.querySelectorAll('.maker-pill');
const tagChips = document.querySelectorAll('.tag-chip');

// DOM Elements - Shop Modal
const shopModal = document.getElementById('shopModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const modalMakerBadge = document.getElementById('modalMakerBadge');
const modalProductTitle = document.getElementById('modalProductTitle');
const modalProductImg = document.getElementById('modalProductImg');
const modalProductPrice = document.getElementById('modalProductPrice');
const modalProductJan = document.getElementById('modalProductJan');
const modalProductDesc = document.getElementById('modalProductDesc');
const modalReleaseDate = document.getElementById('modalReleaseDate');
const modalLastChecked = document.getElementById('modalLastChecked');
const modalStatusBanner = document.getElementById('modalStatusBanner');
const modalCollectorBox = document.getElementById('modalCollectorBox');
const modalSourcesBox = document.getElementById('modalSourcesBox');
const modalSourcesLinks = document.getElementById('modalSourcesLinks');
const prefSelect = document.getElementById('prefSelect');
const btnViewList = document.getElementById('btnViewList');
const btnViewMap = document.getElementById('btnViewMap');
const countBadgeMap = document.getElementById('countBadgeMap');
const countBadgeList = document.getElementById('countBadgeList');
const shopLoading = document.getElementById('shopLoading');
const shopMapContainer = document.getElementById('shopMapContainer');
const shopListContainer = document.getElementById('shopListContainer');
const shopList = document.getElementById('shopList');
const shopCountText = document.getElementById('shopCountText');

// DOM Elements - Favorites Modal
const btnOpenFavorites = document.getElementById('btnOpenFavorites');
const btnBackendSettings = document.getElementById('btnBackendSettings');
const favCounterBadge = document.getElementById('favCounterBadge');
const favModal = document.getElementById('favModal');
const btnCloseFav = document.getElementById('btnCloseFav');
const tabFavItems = document.getElementById('tabFavItems');
const tabFavSearches = document.getElementById('tabFavSearches');
const tabCountItems = document.getElementById('tabCountItems');
const tabCountSearches = document.getElementById('tabCountSearches');
const panelFavItems = document.getElementById('panelFavItems');
const panelFavSearches = document.getElementById('panelFavSearches');
const favItemsGrid = document.getElementById('favItemsGrid');
const favSearchesList = document.getElementById('favSearchesList');

// DOM Elements - Help Modal
const helpModal = document.getElementById('helpModal');
const btnHelp = document.getElementById('btnHelp');
const btnCloseHelp = document.getElementById('btnCloseHelp');


// ---------------------------------------------------------
// Initialization
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadFavoritesFromStorage();
  setupEventListeners();
  loadPrefectures();
  loadPopularGachas();
});


// ---------------------------------------------------------
// Event Listeners Setup
// ---------------------------------------------------------
function setupEventListeners() {
  // Search submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      executeSearch(query);
    }
  });

  // Clear search input
  searchInput.addEventListener('input', () => {
    btnClear.style.display = searchInput.value ? 'flex' : 'none';
  });

  btnClear.addEventListener('click', () => {
    searchInput.value = '';
    btnClear.style.display = 'none';
    translationNotice.style.display = 'none';
    searchInput.focus();
  });

  // Bookmark / Save Search button
  btnSaveSearch.addEventListener('click', () => {
    saveCurrentSearch();
  });

  // Maker filter pills
  makerPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      makerPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentMaker = pill.dataset.maker;
      if (state.currentQuery) {
        executeSearch(state.currentQuery);
      }
    });
  });

  // Quick search tags
  tagChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const query = chip.dataset.query;
      searchInput.value = query;
      btnClear.style.display = 'flex';
      executeSearch(query);
    });
  });

  // Reset to popular items
  btnResetToPopular.addEventListener('click', () => {
    searchInput.value = '';
    btnClear.style.display = 'none';
    translationNotice.style.display = 'none';
    state.currentQuery = '';
    renderPopularView();
  });

  // Shop Modal Handlers
  btnCloseModal.addEventListener('click', closeShopModal);
  shopModal.addEventListener('click', (e) => {
    if (e.target === shopModal) closeShopModal();
  });

  // Prefecture Filter Change (Dynamic Regional Fetching & Caching)
  prefSelect.addEventListener('change', (e) => {
    state.currentPref = e.target.value;
    handlePrefectureFilterChange();
  });

  // View Switcher (Map default, List on demand)
  btnViewMap.addEventListener('click', () => switchShopView('map'));
  btnViewList.addEventListener('click', () => switchShopView('list'));

  // Favorites Modal Handlers
  btnOpenFavorites.addEventListener('click', () => openFavoritesModal('items'));
  btnCloseFav.addEventListener('click', closeFavoritesModal);
  favModal.addEventListener('click', (e) => {
    if (e.target === favModal) closeFavoritesModal();
  });

  // Backend URL Settings Handler
  if (btnBackendSettings) {
    btnBackendSettings.addEventListener('click', () => {
      const current = localStorage.getItem('gacha_backend_url') || (API_BASE || 'http://localhost:8000');
      const input = prompt(
        "Backend-Server URL für Scraper & Bestandsabfragen:\n\n" +
        "• Lokal: http://localhost:8000\n" +
        "• Im selben WLAN: http://<Deine-Mac-IP>:8000\n" +
        "• Öffentlicher Tunnel: https://<deine-domain>.ngrok-free.app",
        current
      );
      if (input !== null) {
        const trimmed = input.trim().replace(/\/+$/, '');
        if (trimmed) {
          localStorage.setItem('gacha_backend_url', trimmed);
        } else {
          localStorage.removeItem('gacha_backend_url');
        }
        window.location.reload();
      }
    });
  }

  tabFavItems.addEventListener('click', () => switchFavTab('items'));
  tabFavSearches.addEventListener('click', () => switchFavTab('searches'));

  // Help Modal Handlers
  btnHelp.addEventListener('click', (e) => {
    e.preventDefault();
    helpModal.style.display = 'flex';
  });
  btnCloseHelp.addEventListener('click', () => {
    helpModal.style.display = 'none';
  });
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.style.display = 'none';
  });

  // Global Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeShopModal();
      closeFavoritesModal();
      helpModal.style.display = 'none';
    }
  });
}


// ---------------------------------------------------------
// Favorites & Watchlist Management (localStorage)
// ---------------------------------------------------------
function loadFavoritesFromStorage() {
  try {
    const savedItems = localStorage.getItem('gacha_fav_items');
    state.favorites.items = savedItems ? JSON.parse(savedItems) : [];
  } catch (e) {
    state.favorites.items = [];
  }

  try {
    const savedSearches = localStorage.getItem('gacha_fav_searches');
    state.favorites.searches = savedSearches ? JSON.parse(savedSearches) : [];
  } catch (e) {
    state.favorites.searches = [];
  }

  updateFavCounters();
}

function saveFavoritesToStorage() {
  try {
    localStorage.setItem('gacha_fav_items', JSON.stringify(state.favorites.items));
    localStorage.setItem('gacha_fav_searches', JSON.stringify(state.favorites.searches));
  } catch (e) {
    console.warn('Could not save favorites to localStorage:', e);
  }
  updateFavCounters();
}

function updateFavCounters() {
  const itemCount = state.favorites.items.length;
  const searchCount = state.favorites.searches.length;

  if (favCounterBadge) favCounterBadge.textContent = itemCount;
  if (tabCountItems) tabCountItems.textContent = itemCount;
  if (tabCountSearches) tabCountSearches.textContent = searchCount;
}

function isItemFavorited(id) {
  if (!id) return false;
  return state.favorites.items.some((item) => String(item.id) === String(id));
}

function toggleFavoriteItem(item) {
  const itemId = String(item.id);
  const existsIndex = state.favorites.items.findIndex((it) => String(it.id) === itemId);

  if (existsIndex >= 0) {
    state.favorites.items.splice(existsIndex, 1);
  } else {
    // Add item with essential metadata
    state.favorites.items.unshift({
      id: item.id,
      maker: item.maker,
      title: item.title,
      price: item.price,
      image_url: item.image_url,
      jan_code: item.jan_code,
      release_date: item.release_date,
      category: item.category,
      detail_url: item.detail_url,
      availability_status: item.availability_status,
      other_sources: item.other_sources || []
    });
  }

  saveFavoritesToStorage();

  // Update heart icons across the UI
  document.querySelectorAll(`.btn-card-fav[data-id="${CSS.escape(itemId)}"]`).forEach((btn) => {
    const isNowFav = existsIndex < 0;
    btn.classList.toggle('active', isNowFav);
    btn.innerHTML = isNowFav ? '❤️' : '🤍';
    btn.title = isNowFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen';
  });

  if (favModal.style.display === 'flex') {
    renderFavoritesContent();
  }
}

function saveCurrentSearch() {
  const query = (searchInput.value || state.currentQuery || '').trim();
  if (!query) {
    searchInput.focus();
    return;
  }

  if (!state.favorites.searches.includes(query)) {
    state.favorites.searches.unshift(query);
    saveFavoritesToStorage();
  }

  // Visual button feedback
  const originalHtml = btnSaveSearch.innerHTML;
  btnSaveSearch.innerHTML = '✅ Gemerkt!';
  btnSaveSearch.style.background = '#e8faf0';
  btnSaveSearch.style.borderColor = '#10ac84';
  btnSaveSearch.style.color = '#10ac84';

  setTimeout(() => {
    btnSaveSearch.innerHTML = originalHtml;
    btnSaveSearch.style.background = '';
    btnSaveSearch.style.borderColor = '';
    btnSaveSearch.style.color = '';
  }, 1500);

  if (favModal.style.display === 'flex') {
    renderFavoritesContent();
  }
}

function removeSearchFavorite(query) {
  state.favorites.searches = state.favorites.searches.filter((q) => q !== query);
  saveFavoritesToStorage();
  renderFavoritesContent();
}

function openFavoritesModal(defaultTab = 'items') {
  favModal.style.display = 'flex';
  switchFavTab(defaultTab);
  renderFavoritesContent();
}

function closeFavoritesModal() {
  favModal.style.display = 'none';
}

function switchFavTab(tab) {
  if (tab === 'items') {
    tabFavItems.classList.add('active');
    tabFavSearches.classList.remove('active');
    panelFavItems.style.display = 'block';
    panelFavSearches.style.display = 'none';
  } else {
    tabFavSearches.classList.add('active');
    tabFavItems.classList.remove('active');
    panelFavSearches.style.display = 'block';
    panelFavItems.style.display = 'none';
  }
}

function renderFavoritesContent() {
  updateFavCounters();

  // Render Saved Items Grid
  favItemsGrid.innerHTML = '';
  if (state.favorites.items.length === 0) {
    favItemsGrid.innerHTML = `
      <div class="fav-empty">
        <div class="fav-empty-icon">❤️</div>
        <strong>Noch keine Gachas gemerkt.</strong>
        <small>Klicke bei einem Gacha auf das Herz ❤️, um es für deine Japan-Reise abzuspeichern!</small>
      </div>
    `;
  } else {
    state.favorites.items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'fav-card';

      const fallbackImg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f2f6'/><text x='50' y='55' font-size='30' text-anchor='middle'>🎁</text></svg>";
      const imgSrc = item.image_url || fallbackImg;

      const isKitan = (item.maker || '').toLowerCase().includes('kitan');
      const isIsland = (item.maker || '').toLowerCase().includes('island') && !item.jan_code;

      card.innerHTML = `
        <div class="fav-thumb-wrap">
          <img class="fav-thumb" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='${fallbackImg}'" />
          <button type="button" class="btn-fav-remove" title="Aus Gemerkt entfernen" data-id="${escapeHtml(item.id)}">✕</button>
        </div>
        <div class="fav-content">
          <div style="font-size:0.72rem; font-weight:800; color:#57606f; margin-bottom:2px;">${escapeHtml(item.maker)} ${item.price ? `• ${escapeHtml(item.price)}` : ''}</div>
          <div class="fav-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
          <div class="fav-actions">
            ${isKitan 
              ? `<a href="${item.detail_url || '#'}" target="_blank" rel="noopener" class="btn-fav-check" style="text-align:center;text-decoration:none;display:block;">🔗 Auf Kitan Club ↗</a>`
              : (isIsland
                ? `<a href="${item.detail_url || '#'}" target="_blank" rel="noopener" class="btn-fav-check" style="text-align:center;text-decoration:none;display:block;">🏝️ Auf Gacha-Island ↗</a>`
                : `<button type="button" class="btn-fav-check btn-find-shops-fav">🏬 Standorte & Bestand</button>`)
            }
          </div>
        </div>
      `;

      // Remove button handler
      const btnRemove = card.querySelector('.btn-fav-remove');
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteItem(item);
      });

      // Shop Check button handler
      const btnCheck = card.querySelector('.btn-find-shops-fav');
      if (btnCheck) {
        btnCheck.addEventListener('click', () => {
          closeFavoritesModal();
          openShopModal(item);
        });
      }

      favItemsGrid.appendChild(card);
    });
  }

  // Render Saved Searches List
  favSearchesList.innerHTML = '';
  if (state.favorites.searches.length === 0) {
    favSearchesList.innerHTML = `
      <div class="fav-empty">
        <div class="fav-empty-icon">⭐</div>
        <strong>Keine Suchbegriffe gespeichert.</strong>
        <small>Tippe oben neben der Suchleiste auf "⭐ Merken", um deine Lieblingsbegriffe hier zu sammeln!</small>
      </div>
    `;
  } else {
    state.favorites.searches.forEach((query) => {
      const chip = document.createElement('div');
      chip.className = 'fav-search-chip';
      chip.innerHTML = `
        <span class="fav-search-text">🔍 ${escapeHtml(query)}</span>
        <button type="button" class="btn-del-search" title="Löschen" data-query="${escapeHtml(query)}">✕</button>
      `;

      chip.querySelector('.fav-search-text').addEventListener('click', () => {
        closeFavoritesModal();
        searchInput.value = query;
        btnClear.style.display = 'flex';
        executeSearch(query);
      });

      chip.querySelector('.btn-del-search').addEventListener('click', (e) => {
        e.stopPropagation();
        removeSearchFavorite(query);
      });

      favSearchesList.appendChild(chip);
    });
  }
}


// ---------------------------------------------------------
// Load Prefectures
// ---------------------------------------------------------
async function loadPrefectures() {
  try {
    const res = await fetch(`${API_BASE}/api/prefectures`);
    if (res.ok) {
      const prefs = await res.json();
      state.prefectures = prefs;
      renderPrefSelect(prefs);
    }
  } catch (err) {
    console.warn('Could not load prefectures:', err);
  }
}

function renderPrefSelect(prefs) {
  prefSelect.innerHTML = `<option value="" selected>🇯🇵 Ganz Japan (Alle Standorte)</option>`;
  prefs.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.code;
    opt.dataset.name = p.name;
    opt.textContent = `${p.name} (${p.name_en})`;
    prefSelect.appendChild(opt);
  });
}


// ---------------------------------------------------------
// Load Popular / Featured Gachas
// Fallback popular items for offline or initial GitHub Pages view
const FALLBACK_POPULAR = [
  {
    id: "4570118183859000",
    maker: "Bandai",
    title: "ポケットモンスター ガシャっとコレクト07",
    price: "300円",
    image_url: "https://bandai-a.akamaihd.net/bc/img/model/b/1000258661_2.jpg",
    jan_code: "4570118183859",
    category: "ガシャポン",
    detail_url: "https://gashapon.jp/products/detail.php?jan_code=4570118183859000",
    availability_status: "IN_STOCK",
    release_date: "2025年03月"
  },
  {
    id: "4570118228185000",
    maker: "Bandai",
    title: "ジェムリーズ ポケットモンスター13 Summer",
    price: "400円",
    image_url: "https://bandai-a.akamaihd.net/bc/img/model/b/1000228795_2.jpg",
    jan_code: "4570118228185",
    category: "ガシャポン",
    detail_url: "https://gashapon.jp/products/detail.php?jan_code=4570118228185000",
    availability_status: "IN_STOCK",
    release_date: "2025年06月"
  },
  {
    id: "Y903991",
    maker: "Takara Tomy Arts",
    title: "ポケモン おやすみフレンズ なかよくうとうと",
    price: "300円 / 全4種",
    image_url: "https://www.takaratomy-arts.co.jp/items/itemimages/Y903991_1.jpg",
    jan_code: "4904790903991",
    category: "ガチャ",
    detail_url: "https://www.takaratomy-arts.co.jp/items/item.html?n=Y903991",
    availability_status: "IN_STOCK",
    release_date: "2025年04月"
  },
  {
    id: "Y098703",
    maker: "Takara Tomy Arts",
    title: "肩ズンFig. 葬送のフリーレン",
    price: "400円 / 全4種",
    image_url: "https://www.takaratomy-arts.co.jp/items/itemimages/Y098703_1.jpg",
    jan_code: "4904790098703",
    category: "ガチャ",
    detail_url: "https://www.takaratomy-arts.co.jp/items/item.html?n=Y098703",
    availability_status: "IN_STOCK",
    release_date: "2024年11月"
  }
];

// ---------------------------------------------------------
async function loadPopularGachas() {
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/popular`);
    if (res.ok) {
      const data = await res.json();
      state.popularItems = data;
      renderPopularView();
      return;
    }
  } catch (err) {
    console.warn('Backend currently unreachable, using featured fallback items:', err);
  } finally {
    setLoading(false);
  }
  state.popularItems = FALLBACK_POPULAR;
  renderPopularView();
}

function renderPopularView() {
  resultsHeading.textContent = '🔥 Beliebte & Aktuelle Gachas (Mit Live-Bestand)';
  resultsCount.textContent = `${state.popularItems.length} Artikel`;
  btnResetToPopular.style.display = 'none';
  translationNotice.style.display = 'none';
  renderProducts(state.popularItems);
}


// ---------------------------------------------------------
// Execute Search (with Multilingual Translation notice)
// ---------------------------------------------------------
async function executeSearch(query) {
  state.currentQuery = query;
  setLoading(true);
  emptyState.style.display = 'none';
  translationNotice.style.display = 'none';
  productGrid.innerHTML = '';

  resultsHeading.textContent = `Suchergebnisse für "${query}"`;
  btnResetToPopular.style.display = 'inline-block';

  try {
    const url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}&maker=${state.currentMaker}&limit=35`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const data = await res.json();
    state.currentResults = data.results || [];
    resultsCount.textContent = `${state.currentResults.length} Treffer`;

    // Multilingual translation notice
    if (data.translated_from) {
      translationNotice.innerHTML = `💡 Begriff erkannt: <strong>"${escapeHtml(data.translated_from)}"</strong> → Japanische Gachapon-Datenbanken nach <strong>"${escapeHtml(data.query)}"</strong> durchsucht.`;
      translationNotice.style.display = 'block';
    }

    if (state.currentResults.length === 0) {
      emptyState.style.display = 'block';
    } else {
      renderProducts(state.currentResults);
    }
  } catch (err) {
    console.error('Search failed:', err);
    emptyState.style.display = 'block';
    emptyState.innerHTML = `
      <div class="empty-icon">⚠️</div>
      <h3>Verbindung zum Backend fehlgeschlagen</h3>
      <p style="margin-top:8px; line-height:1.5;">Konnte keine Daten von <code>${escapeHtml(API_BASE || 'lokalem Server')}</code> abrufen.<br>
      Stelle sicher, dass das Backend läuft (z. B. mit <code>uvicorn backend.app:app</code> auf Port 8000), oder klicke oben auf <strong>⚙️ Backend</strong> um die Adresse anzupassen.</p>
    `;
    resultsCount.textContent = '0 Treffer';
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  loadingState.style.display = isLoading ? 'block' : 'none';
  const btnSpinner = btnSubmit.querySelector('.btn-spinner');
  const btnText = btnSubmit.querySelector('.btn-text');
  if (btnSpinner && btnText) {
    btnSpinner.style.display = isLoading ? 'inline' : 'none';
    btnText.style.display = isLoading ? 'none' : 'inline';
  }
}


// ---------------------------------------------------------
// Helper: Card Availability Status Badge
// ---------------------------------------------------------
function getStatusBadgeHtml(status, count) {
  switch (status) {
    case 'IN_STOCK':
      if (typeof count === 'number' && count > 0) {
        return `<div class="card-status-badge status-in-stock"><span>🟢</span> <span>An ${count} Standorten</span></div>`;
      }
      return `<div class="card-status-badge status-in-stock"><span>🟢</span> <span>Auf Lager</span></div>`;
    case 'OUT_OF_STOCK':
      return `<div class="card-status-badge status-out-of-stock"><span>🔴</span> <span>Ausverkauft (0 Standorte)</span></div>`;
    case 'UPCOMING':
      return `<div class="card-status-badge status-upcoming"><span>⏳</span> <span>Vorankündigung</span></div>`;
    case 'ARCHIVED':
      return `<div class="card-status-badge status-archived"><span>📦</span> <span>Archiv / Vergriffen</span></div>`;
    case 'CHECK_STOCK':
    default:
      return `<div class="card-status-badge status-check-stock"><span>📍</span> <span>Bestand auf Karte prüfen</span></div>`;
  }
}

function updateCardStatusInDOM(productId, status, count) {
  if (!productId) return;
  try {
    const selector = `.product-card[data-id="${CSS.escape(productId)}"]`;
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
      const badgeRow = card.querySelector('.card-badges-row');
      if (badgeRow) {
        const existingBadge = badgeRow.querySelector('.card-status-badge');
        if (existingBadge) {
          existingBadge.outerHTML = getStatusBadgeHtml(status, count);
        }
      }
    });
  } catch (e) {
    console.warn('DOM card update skipped:', e);
  }
}


// ---------------------------------------------------------
// Render Product Cards (with Prominent Release Dates & Multi-Source Badges)
// ---------------------------------------------------------
function renderProducts(items) {
  productGrid.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', item.id);

    let badgeClass = 'badge-other';
    const mLower = (item.maker || '').toLowerCase();
    if (mLower.includes('bandai')) badgeClass = 'badge-bandai';
    else if (mLower.includes('tomy')) badgeClass = 'badge-takaratomy';
    else if (mLower.includes('island')) badgeClass = 'badge-island';
    else if (mLower.includes('kitan')) badgeClass = 'badge-kitan';

    const fallbackImg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f2f6'/><text x='50' y='55' font-size='30' text-anchor='middle'>🎁</text></svg>";
    const imgSrc = item.image_url || fallbackImg;

    const isFav = isItemFavorited(item.id);
    const statusHtml = getStatusBadgeHtml(item.availability_status, item.shop_count);
    const releaseText = item.release_date ? `📅 Release: ${escapeHtml(item.release_date)}` : '📅 Release: Aktuell';

    const isKitan = mLower.includes('kitan');
    const isIslandOnly = mLower.includes('island') && !item.jan_code;

    // Render other sources pills if available
    let sourcesPillsHtml = '';
    if (item.other_sources && item.other_sources.length > 0) {
      const realSources = item.other_sources.filter(s => s.name !== 'GachaNavi');
      if (realSources.length > 0) {
        sourcesPillsHtml = `
          <div class="card-sources-row">
            <span style="font-size:0.68rem; color:#64748b; font-weight:700;">Quellen:</span>
            <span class="source-pill-mini ${badgeClass}">${escapeHtml(item.maker.split(' ')[0])}</span>
            ${realSources.map(s => `<span class="source-pill-mini ${s.badge}">+ ${escapeHtml(s.name.split(' ')[0])}</span>`).join('')}
          </div>
        `;
      }
    }

    // Additional external links for other sources
    let extraLinksHtml = '';
    if (item.other_sources && item.other_sources.length > 0) {
      item.other_sources.forEach((s) => {
        if (s.name.toLowerCase().includes('island')) {
          extraLinksHtml += `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener" class="btn-source-link">🏝️ Auf Gacha-Island ansehen ↗</a>`;
        }
      });
    }

    card.innerHTML = `
      <div class="card-thumb-wrap">
        <span class="card-maker-badge ${badgeClass}">${escapeHtml(item.maker)}</span>
        <button type="button" class="btn-card-fav ${isFav ? 'active' : ''}" data-id="${escapeHtml(item.id)}" title="${isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}">${isFav ? '❤️' : '🤍'}</button>
        ${item.price ? `<span class="card-price-badge">${escapeHtml(item.price)}</span>` : ''}
        <img class="card-thumb" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='${fallbackImg}'" />
      </div>
      <div class="card-content">
        <div class="card-badges-row">
          ${statusHtml}
          <div class="card-release-tag" title="Offizielles Erscheinungsdatum">${releaseText}</div>
        </div>
        ${sourcesPillsHtml}
        <h4 class="card-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h4>
        <div class="card-meta">
          ${item.jan_code ? `<span class="card-jan" title="JAN Barcode">JAN: ${escapeHtml(item.jan_code)}</span>` : ''}
        </div>
        <div class="card-actions">
          ${isKitan 
            ? `<a href="${item.detail_url || '#'}" target="_blank" rel="noopener" class="btn-source-link">🔗 Auf Kitan Club ansehen ↗</a>`
            : (isIslandOnly
              ? `<a href="${item.detail_url || '#'}" target="_blank" rel="noopener" class="btn-source-link">🏝️ Auf Gacha-Island ansehen ↗</a>`
              : `<button type="button" class="btn-find-shops" data-id="${escapeHtml(item.id)}">🏬 Standorte & Bestand</button>`)
          }
          ${item.detail_url && !isKitan && !isIslandOnly ? `<a href="${escapeHtml(item.detail_url)}" target="_blank" rel="noopener" class="btn-source-link">Offizielle Seite ↗</a>` : ''}
          ${extraLinksHtml}
        </div>
      </div>
    `;

    // Heart favorite toggle handler
    const btnFav = card.querySelector('.btn-card-fav');
    if (btnFav) {
      btnFav.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteItem(item);
      });
    }

    // Shop availability modal handler
    const btnFind = card.querySelector('.btn-find-shops');
    if (btnFind) {
      btnFind.addEventListener('click', () => openShopModal(item));
    }

    productGrid.appendChild(card);
  });

  // Automatically pre-check stock for top results in background
  autoCheckTopResultsStock(items);
}

function autoCheckTopResultsStock(items) {
  if (!Array.isArray(items)) return;
  const toCheck = items.slice(0, 3).filter(it => it.availability_status === 'CHECK_STOCK' && !it.shop_count);
  toCheck.forEach((it, idx) => {
    setTimeout(async () => {
      try {
        const makerParam = it.maker.toLowerCase().includes('bandai') ? 'bandai' : 'takaratomy';
        let qUrl = `${API_BASE}/api/shops?maker=${makerParam}&pref=`;
        if (it.jan_code) qUrl += `&jan_code=${encodeURIComponent(it.jan_code)}`;
        if (it.id) qUrl += `&item_id=${encodeURIComponent(it.id)}`;
        if (it.title) qUrl += `&product_name=${encodeURIComponent(it.title)}`;

        const res = await fetch(qUrl);
        if (res.ok) {
          const data = await res.json();
          const count = (data.shops || []).length;
          const status = data.availability_status || (count > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK');
          it.availability_status = status;
          it.shop_count = count;
          updateCardStatusInDOM(it.id, status, count);
        }
      } catch (e) {
        // Silently keep default badge
      }
    }, (idx + 1) * 800);
  });
}


// ---------------------------------------------------------
// Shop Availability Modal
// ---------------------------------------------------------
function openShopModal(product) {
  state.activeProduct = product;
  state.allShops = [];
  state.filteredShops = [];
  state.regionCache = {}; // Clear region cache for new product
  state.currentPref = ''; // Default to Ganz Japan!
  prefSelect.value = '';

  // Set modal header & product summary
  modalProductTitle.textContent = product.title;
  modalMakerBadge.textContent = product.maker;
  modalMakerBadge.className = 'modal-maker-badge';
  const mLower = (product.maker || '').toLowerCase();
  if (mLower.includes('bandai')) modalMakerBadge.classList.add('badge-bandai');
  else if (mLower.includes('tomy')) modalMakerBadge.classList.add('badge-takaratomy');
  else if (mLower.includes('island')) modalMakerBadge.classList.add('badge-island');

  modalProductImg.src = product.image_url || '';
  modalProductPrice.textContent = product.price ? `Preis: ${product.price}` : '';
  modalProductJan.textContent = product.jan_code ? `JAN Code: ${product.jan_code}` : (product.id ? `ID: ${product.id}` : '');
  modalReleaseDate.textContent = product.release_date ? `📅 Release: ${product.release_date}` : '📅 Release: Lädt...';
  modalLastChecked.textContent = '🕒 Bestandsdaten: Lädt...';
  modalProductDesc.textContent = product.description || '';

  // Render Multi-Sources box if product is found on multiple sites
  if (product.other_sources && product.other_sources.length > 0) {
    modalSourcesBox.style.display = 'flex';
    modalSourcesLinks.innerHTML = product.other_sources.map(s => `
      <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener" class="modal-source-pill ${s.badge}">
        🌐 ${escapeHtml(s.name)} ↗
      </a>
    `).join('');
  } else {
    modalSourcesBox.style.display = 'none';
  }

  modalStatusBanner.style.display = 'none';
  modalCollectorBox.style.display = 'none';

  // Show modal
  shopModal.style.display = 'flex';

  // Set Map View as Default
  switchShopView('map');

  // Fetch initial shops for Ganz Japan
  fetchShopsForActiveProduct();
}

function closeShopModal() {
  shopModal.style.display = 'none';
  state.activeProduct = null;
  state.allShops = [];
  state.filteredShops = [];
  state.regionCache = {};
}

async function fetchShopsForActiveProduct() {
  if (!state.activeProduct) return;

  const product = state.activeProduct;
  shopLoading.style.display = 'block';
  shopList.innerHTML = '';
  shopCountText.textContent = 'Lagerbestände in ganz Japan werden geprüft...';
  if (countBadgeMap) countBadgeMap.textContent = '...';
  if (countBadgeList) countBadgeList.textContent = '...';

  const makerParam = product.maker.toLowerCase().includes('bandai') ? 'bandai' : 'takaratomy';
  const janParam = product.jan_code || '';
  const itemIdParam = product.id || '';

  // Query All Japan (pref='') to populate nationwide pins
  let queryUrl = `${API_BASE}/api/shops?maker=${makerParam}&pref=`;
  if (janParam) queryUrl += `&jan_code=${encodeURIComponent(janParam)}`;
  if (itemIdParam) queryUrl += `&item_id=${encodeURIComponent(itemIdParam)}`;
  if (product.title) queryUrl += `&product_name=${encodeURIComponent(product.title)}`;

  try {
    const res = await fetch(queryUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    state.allShops = data.shops || [];
    state.regionCache[''] = state.allShops; // Cache All Japan results
    state.filteredShops = [...state.allShops];

    // Real-time update of product card in search list
    const finalCount = state.allShops.length;
    const finalStatus = data.availability_status || (finalCount > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK');
    product.availability_status = finalStatus;
    product.shop_count = finalCount;
    updateCardStatusInDOM(product.id, finalStatus, finalCount);

    // Update release date & last checked timestamp
    if (data.release_date) {
      modalReleaseDate.textContent = `📅 Release: ${data.release_date}`;
    }
    modalLastChecked.textContent = `🕒 Bestandsdaten: ${data.last_data_check}`;

    // Update Status Banner
    renderStatusBanner(data);

    // Update Collector Box if out of stock or vintage
    renderCollectorBox(data);

    // Render shops
    renderShopsUI(state.filteredShops);
  } catch (err) {
    console.error('Failed to fetch shops:', err);
    shopCountText.textContent = 'Keine Bestandsdaten von der Hersteller-API gemeldet.';
    if (countBadgeMap) countBadgeMap.textContent = '0';
    if (countBadgeList) countBadgeList.textContent = '0';
    modalStatusBanner.innerHTML = `⚠️ Keine Live-Standorte gemeldet (Siehe Sammler-Tipps unten)`;
    modalStatusBanner.className = 'modal-status-banner status-out-of-stock';
    modalStatusBanner.style.display = 'flex';
    updateCardStatusInDOM(product.id, 'OUT_OF_STOCK', 0);
  } finally {
    shopLoading.style.display = 'none';
  }
}

function renderStatusBanner(data) {
  modalStatusBanner.style.display = 'flex';
  let bannerClass = 'status-in-stock';
  let icon = '🟢';

  if (data.availability_status === 'OUT_OF_STOCK') {
    bannerClass = 'status-out-of-stock';
    icon = '🔴';
  } else if (data.availability_status === 'UPCOMING') {
    bannerClass = 'status-upcoming';
    icon = '⏳';
  } else if (data.availability_status === 'ARCHIVED') {
    bannerClass = 'status-archived';
    icon = '📦';
  }

  modalStatusBanner.className = `modal-status-banner ${bannerClass}`;
  modalStatusBanner.innerHTML = `
    <span>${icon}</span>
    <span>${escapeHtml(data.status_label)}</span>
  `;
}

function renderCollectorBox(data) {
  if (data.availability_status === 'IN_STOCK') {
    modalCollectorBox.style.display = 'none';
    return;
  }

  modalCollectorBox.style.display = 'block';
  const advice = data.status_advice || 'Keine Maschinen-Standorte gemeldet.';
  const links = data.collector_links || {};

  let linksHtml = '';
  for (const [name, url] of Object.entries(links)) {
    linksHtml += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="btn-collector-link">🔍 ${escapeHtml(name)} ↗</a>`;
  }

  modalCollectorBox.innerHTML = `
    <h4>💡 Hinweise für Sammler & Gacha-Fans</h4>
    <p>${escapeHtml(advice)}</p>
    <div class="collector-links-grid">
      ${linksHtml}
    </div>
  `;
}


// ---------------------------------------------------------
// Dynamic Regional Fetching & Caching (Accurate Tokyo & Regional Filtering)
// ---------------------------------------------------------
async function handlePrefectureFilterChange() {
  const prefCode = state.currentPref;
  if (!state.activeProduct) return;

  if (!prefCode) {
    // Ganz Japan: instant lookup from All-Japan cache
    state.filteredShops = state.regionCache[''] || state.allShops;
    renderShopsUI(state.filteredShops);
    return;
  }

  // If already in region cache, instant 0ms display!
  if (state.regionCache[prefCode]) {
    state.filteredShops = state.regionCache[prefCode];
    renderShopsUI(state.filteredShops);
    return;
  }

  // Not yet cached for this region: fetch from backend with pref parameter
  const product = state.activeProduct;
  const makerParam = product.maker.toLowerCase().includes('bandai') ? 'bandai' : 'takaratomy';
  const janParam = product.jan_code || '';
  const itemIdParam = product.id || '';

  const opt = prefSelect.querySelector(`option[value="${prefCode}"]`);
  const prefLabel = opt ? opt.textContent : 'Region';

  shopLoading.style.display = 'block';
  shopCountText.textContent = `Standorte für ${prefLabel} werden in Echtzeit abgefragt...`;

  let queryUrl = `${API_BASE}/api/shops?maker=${makerParam}&pref=${encodeURIComponent(prefCode)}`;
  if (janParam) queryUrl += `&jan_code=${encodeURIComponent(janParam)}`;
  if (itemIdParam) queryUrl += `&item_id=${encodeURIComponent(itemIdParam)}`;
  if (product.title) queryUrl += `&product_name=${encodeURIComponent(product.title)}`;

  try {
    const res = await fetch(queryUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const shops = data.shops || [];

    // Save in region cache
    state.regionCache[prefCode] = shops;

    // Only update view if user is still on this prefecture
    if (state.currentPref === prefCode) {
      state.filteredShops = shops;
      renderShopsUI(state.filteredShops);
    }
  } catch (err) {
    console.warn('Regional fetch failed, falling back to local filter:', err);
    // Fallback: local filter on allShops
    const prefName = opt ? (opt.dataset.name || '') : '';
    state.filteredShops = state.allShops.filter((s) => {
      if (s.prefecture && prefName && s.prefecture.includes(prefName)) return true;
      if (s.address && prefName && s.address.includes(prefName)) return true;
      return false;
    });
    renderShopsUI(state.filteredShops);
  } finally {
    shopLoading.style.display = 'none';
  }
}


// ---------------------------------------------------------
// Render Shops UI (List + Map)
// ---------------------------------------------------------
function renderShopsUI(shops) {
  const regionLabel = state.currentPref ? 'in dieser Region' : 'in ganz Japan';
  if (shopCountText) {
    shopCountText.textContent = shops.length > 0
      ? `🏬 ${shops.length} Verkaufsstellen ${regionLabel} gemeldet`
      : `Keine direkten Automaten ${regionLabel} gemeldet`;
  }
  if (countBadgeMap) countBadgeMap.textContent = shops.length;
  if (countBadgeList) countBadgeList.textContent = shops.length;

  renderShopList(shops);
  updateMapMarkers(shops);

  // Invalidate Leaflet size safely after rendering
  setTimeout(() => {
    if (state.map) state.map.invalidateSize();
  }, 100);
}

function renderShopList(shops) {
  shopList.innerHTML = '';
  const regionLabel = state.currentPref ? 'in dieser Region' : 'in ganz Japan';

  if (shops.length === 0) {
    shopList.innerHTML = `
      <div style="text-align: center; padding: 28px 16px; color: #57606f;">
        <p style="font-size: 2rem; margin-bottom: 6px;">🏬</p>
        <p><strong>Keine direkten Automaten ${regionLabel} gemeldet.</strong></p>
        <small>Tipp: Wähle oben "Ganz Japan" oder prüfe die Sammler-Tipps unter der Karte.</small>
      </div>
    `;
    return;
  }

  shops.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'shop-card';

    card.innerHTML = `
      <div class="shop-info">
        <div class="shop-header-row">
          ${s.prefecture ? `<span class="shop-pref-pill">${escapeHtml(s.prefecture)}</span>` : ''}
          <span class="shop-status-badge">● ${escapeHtml(s.stock_status)}</span>
        </div>
        <div class="shop-name">${escapeHtml(s.shop_name)}</div>
        <div class="shop-address">📍 ${escapeHtml(s.address)}</div>
        ${s.phone ? `<div style="font-size:0.78rem;color:#747d8c;margin-top:2px;">📞 ${escapeHtml(s.phone)}</div>` : ''}
        ${s.distance_meters ? `<div class="shop-distance">Entfernung: ca. ${(s.distance_meters / 1000).toFixed(1)} km</div>` : ''}
      </div>
      <div class="shop-actions">
        <a href="${escapeHtml(s.google_maps_url)}" target="_blank" rel="noopener" class="btn-gmaps">
          <span>Google Maps</span> ↗
        </a>
      </div>
    `;

    shopList.appendChild(card);
  });
}


// ---------------------------------------------------------
// View Switcher (Map default, List on demand)
// ---------------------------------------------------------
function switchShopView(view) {
  state.currentView = view;
  if (view === 'map') {
    btnViewMap.classList.add('active');
    btnViewList.classList.remove('active');
    shopMapContainer.style.display = 'block';
    shopListContainer.style.display = 'none';
    initMapIfNeeded();
  } else {
    btnViewList.classList.add('active');
    btnViewMap.classList.remove('active');
    shopListContainer.style.display = 'block';
    shopMapContainer.style.display = 'none';
  }
}


// ---------------------------------------------------------
// Leaflet Map Integration (Japan Nationwide)
// ---------------------------------------------------------
function initMapIfNeeded() {
  if (!state.map) {
    if (typeof L === 'undefined') {
      console.warn('Leaflet not loaded');
      return;
    }

    // Centered on the center of Japan [36.2048, 138.2529] with nationwide zoom level
    state.map = L.map('shopMap').setView([36.2048, 138.2529], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(state.map);

    state.markersLayer = L.layerGroup().addTo(state.map);
  }

  // Redraw map and bounds on display
  setTimeout(() => {
    if (state.map) {
      state.map.invalidateSize();
      updateMapMarkers(state.filteredShops);
    }
  }, 100);
}

function updateMapMarkers(shops) {
  if (!state.map || !state.markersLayer) return;

  state.markersLayer.clearLayers();

  const validShops = shops.filter((s) => s.latitude && s.longitude);

  if (validShops.length === 0) {
    // Reset view to Japan nationwide
    state.map.setView([36.2048, 138.2529], 5);
    return;
  }

  const latLngs = [];

  const capsuleIcon = L.divIcon({
    className: 'custom-capsule-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: #ff4757;
        border: 2.5px solid #2f3542;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        color: white;
        font-size: 15px;
        transform: translate(-15px, -15px);
      ">
        🔴
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [0, 0],
    popupAnchor: [0, -15]
  });

  validShops.forEach((s) => {
    const latLng = [s.latitude, s.longitude];
    latLngs.push(latLng);

    const marker = L.marker(latLng, { icon: capsuleIcon });

    const popupHtml = `
      <div style="font-family: 'Outfit', sans-serif; font-size: 13px; max-width: 250px; padding: 4px;">
        <strong style="color: #1e272e; font-size: 14px; display: block; margin-bottom: 4px;">${escapeHtml(s.shop_name)}</strong>
        <p style="color: #57606f; margin: 0 0 6px;">📍 ${escapeHtml(s.address)}</p>
        <span style="display:inline-block; font-size: 11px; font-weight: bold; color: #10ac84; background: #e8faf0; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px;">● ${escapeHtml(s.stock_status)}</span>
        <div>
          <a href="${escapeHtml(s.google_maps_url)}" target="_blank" rel="noopener" style="display: block; text-align: center; background: #2f3542; color: #fff; padding: 6px 10px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 12px;">Google Maps Route ↗</a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    state.markersLayer.addLayer(marker);
  });

  // Fit bounds to show all shops across Japan or prefecture
  if (latLngs.length > 0) {
    if (latLngs.length === 1) {
      state.map.setView(latLngs[0], 14);
    } else {
      const bounds = L.latLngBounds(latLngs);
      state.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }
}


// ---------------------------------------------------------
// Helper: HTML Escaping
// ---------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
