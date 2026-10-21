/**
 * GachaFinder Japan - Frontend Application v2.7
 * 
 * Features:
 * - Hosted on GitHub Pages & local FastAPI backend compatible
 * - Mobile bottom thumb-navigation bar & mobile-optimized touch UI
 * - Direct "⭐ Gemerkte Suchen" bar with 1-click execution & delete
 * - Real-time availability status sync (eliminates card vs map discrepancy)
 * - Full interactive map for Gacha-Island & independent makers (24+ Premier Mega-Hubs in Japan)
 * - Offline / Demo fallback dataset for standalone GitHub Pages usage
 * - Expanded translations (Vegetable Fairies, Soft Serve Mejirushi Charm, Pins, Sweets, Parfaits, etc.)
 */

// ---------------------------------------------------------
// API Base URL Resolution (Local Server or GitHub Pages with Custom Backend)
// ---------------------------------------------------------
function getApiBaseUrl() {
  const custom = localStorage.getItem('gacha_backend_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.port === '8000' ? '' : 'http://localhost:8000';
  }
  return '';
}

let API_BASE = getApiBaseUrl();

// ---------------------------------------------------------
// Built-In Fallback Data (Enables 100% Functionality on GitHub Pages)
// ---------------------------------------------------------
const FALLBACK_PREFECTURES = [
  {"code": "1", "name": "北海道", "name_en": "Hokkaido"},
  {"code": "13", "name": "東京都", "name_en": "Tokyo"},
  {"code": "14", "name": "神奈川県", "name_en": "Kanagawa"},
  {"code": "23", "name": "愛知県", "name_en": "Aichi"},
  {"code": "26", "name": "京都府", "name_en": "Kyoto"},
  {"code": "27", "name": "大阪府", "name_en": "Osaka"},
  {"code": "40", "name": "福岡県", "name_en": "Fukuoka"}
];

const FALLBACK_HUBS = [
  {
    "shop_name": "【#C-pla】Shibuya Center-gai Mega-Store (1.200+ Automaten)",
    "prefecture": "東京都",
    "pref_code": "13",
    "address": "東京都渋谷区宇田川町23-11 渋谷センター街",
    "phone": "03-6455-2980",
    "latitude": 35.6598,
    "longitude": 139.6980,
    "stock_status": "Verfügbar / Gacha-Hub",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.6598,139.6980"
  },
  {
    "shop_name": "【Gashapon no Mori】Ikebukuro Sunshine City (3.000+ Automaten - Weltgrößtes Zentrum)",
    "prefecture": "東京都",
    "pref_code": "13",
    "address": "東京都豊島区東池袋3-1-3 サンシャインシティ ワールドインポートマートビル3F",
    "phone": "03-5953-6571",
    "latitude": 35.7289,
    "longitude": 139.7188,
    "stock_status": "Verfügbar / Gacha-Hub",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.7289,139.7188"
  },
  {
    "shop_name": "【#C-pla】Akihabara Central Street (1.000+ Automaten)",
    "prefecture": "東京都",
    "pref_code": "13",
    "address": "東京都千代田区外神田3-16-17",
    "phone": "03-5298-5080",
    "latitude": 35.6998,
    "longitude": 139.7712,
    "stock_status": "Verfügbar / Gacha-Hub",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.6998,139.7712"
  },
  {
    "shop_name": "【Akihabara Radio Kaikan】Gashapon Specialty Corner B1 & 2F",
    "prefecture": "東京都",
    "pref_code": "13",
    "address": "東京都千代田区外神田1-15-16 秋葉原ラジオ会館",
    "phone": "03-3251-3711",
    "latitude": 35.6980,
    "longitude": 139.7718,
    "stock_status": "Verfügbar / Sammler-Hub",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.6980,139.7718"
  },
  {
    "shop_name": "【Gashapon Official Shop】Tokyo Station Character Street",
    "prefecture": "東京都",
    "pref_code": "13",
    "address": "東京都千代田区丸の内1-9-1 東京駅一番街 B1F",
    "phone": "03-3210-0077",
    "latitude": 35.6812,
    "longitude": 139.7671,
    "stock_status": "Verfügbar / Flagship",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.6812,139.7671"
  },
  {
    "shop_name": "【Gacha-Gacha no Mori】Olinas Kinshicho 3F (Große Tier- & Indie-Auswahl)",
    "prefecture": "東京都",
    "pref_code": "13",
    "address": "東京都墨田区太平4-1-2 オリナス錦糸町3F",
    "phone": "080-4114-3729",
    "latitude": 35.7004,
    "longitude": 139.8154,
    "stock_status": "Verfügbar / Gacha-Hub",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.7004,139.8154"
  },
  {
    "shop_name": "【Nakano Broadway】Capsule & Toy Arcade B1F",
    "prefecture": "東京都",
    "pref_code": "13",
    "address": "東京都中野区中野5-52-15 中野ブロードウェイ",
    "phone": "03-3388-7004",
    "latitude": 35.7089,
    "longitude": 139.6657,
    "stock_status": "Verfügbar / Vintage & Indie",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.7089,139.6657"
  },
  {
    "shop_name": "【#C-pla】Shinsaibashi-suji Flagship Mega-Store (1.500+ Automaten)",
    "prefecture": "大阪府",
    "pref_code": "27",
    "address": "大阪府大阪市中央区心斎橋筋1-6-10",
    "phone": "06-6241-1180",
    "latitude": 34.6710,
    "longitude": 135.5015,
    "stock_status": "Verfügbar / Gacha-Hub",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=34.6710,135.5015"
  },
  {
    "shop_name": "【Gacha-Gacha no Mori】Umeda HEP FIVE 4F",
    "prefecture": "大阪府",
    "pref_code": "27",
    "address": "大阪府大阪市北区角田町5-15 HEP FIVE 4F",
    "phone": "06-6366-3690",
    "latitude": 34.7037,
    "longitude": 135.5002,
    "stock_status": "Verfügbar / Gacha-Hub",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=34.7037,135.5002"
  },
  {
    "shop_name": "【#C-pla】Kyoto Shijo Kawaramachi Mega-Store",
    "prefecture": "京都府",
    "pref_code": "26",
    "address": "京都府京都市中京区河原町通四条上る塩屋町330",
    "phone": "075-256-8810",
    "latitude": 35.0037,
    "longitude": 135.7698,
    "stock_status": "Verfügbar / Gacha-Hub",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.0037,135.7698"
  },
  {
    "shop_name": "【Gashapon Official Shop】Yokohama World Porters",
    "prefecture": "神奈川県",
    "pref_code": "14",
    "address": "神奈川県横浜市中区新港2-2-1 横浜ワールドポーターズ2F",
    "phone": "045-222-2000",
    "latitude": 35.4542,
    "longitude": 139.6420,
    "stock_status": "Verfügbar / Flagship",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=35.4542,139.6420"
  },
  {
    "shop_name": "【#C-pla】Sapporo Tanukikoji 5-chome Mega-Store (Ursprungsort von #C-pla)",
    "prefecture": "北海道",
    "pref_code": "1",
    "address": "北海道札幌市中央区南3条西5丁目 狸小路商店街",
    "phone": "011-200-9880",
    "latitude": 43.0570,
    "longitude": 141.3520,
    "stock_status": "Verfügbar / Flagship",
    "google_maps_url": "https://www.google.com/maps/search/?api=1&query=43.0570,141.3520"
  }
];

const FALLBACK_ITEMS = [
  {
    "id": "4582769769337000",
    "maker": "Bandai",
    "title": "TVアニメ『薬屋のひとりごと』 まちぼうけ",
    "price": "400円",
    "image_url": "https://bandai-a.akamaihd.net/bc/img/model/b/1000229230_1.jpg",
    "jan_code": "4582769769337",
    "release_date": "2026年9月 第4週",
    "category": "ガシャポン",
    "detail_url": "https://gashapon.jp/products/detail.php?jan_code=4582769769337000",
    "description": "猫猫（マオマオ）や壬氏（ジンシ）たちがちょこんと座って待っているまちぼうけシリーズ！全国78店舗以上で稼働中。",
    "availability_status": "IN_STOCK",
    "other_sources": [
      { "name": "Gacha-Island", "url": "https://gacha-island.jp/2659/", "badge": "badge-island" },
      { "name": "GachaNavi", "url": "https://gachanavi.com/?s=%E8%96%AC%E5%B1%8B%E3%81%AE%E3%81%B2%E3%81%A8%E3%82%8A%E3%81%94%E3%81%A8", "badge": "badge-other" }
    ]
  },
  {
    "id": "island_softserve",
    "maker": "Gacha Island (トイズスピリッツ)",
    "title": "ざ・コンビニソフトめじるしチャーム (The Convenience Store Soft Serve)",
    "price": "300円 / 全5種",
    "image_url": "https://bandai-a.akamaihd.net/bc/img/model/b/1000259527_1.jpg",
    "jan_code": null,
    "release_date": "2026年7月",
    "category": "めじるしチャーム",
    "detail_url": "https://gacha-island.jp/48120/",
    "description": "コンビニのあのアイスが超リアルなミニチュアめじるしチャームに！シリコンリング付きで傘やペットボトルに装着可能。",
    "availability_status": "HUBS_AVAILABLE",
    "other_sources": [
      { "name": "Gacha-Island", "url": "https://gacha-island.jp/48120/", "badge": "badge-island" }
    ]
  },
  {
    "id": "island_oyasai",
    "maker": "Gacha Island (クオリア)",
    "title": "おやさい妖精さん vol.1 (Vegetable Fairies)",
    "price": "400円 / 全6種",
    "image_url": "https://bandai-a.akamaihd.net/bc/img/model/b/1000254930_2.jpg",
    "jan_code": null,
    "release_date": "2026年8月",
    "category": "カプセルフィギュア",
    "detail_url": "https://gacha-island.jp/45902/",
    "description": "ぽん吉氏が描く大人気「おやさい妖精さん」シリーズ！白菜犬やキャベツ豚など愛らしすぎる野菜の妖精たちがフィギュアに。",
    "availability_status": "HUBS_AVAILABLE",
    "other_sources": [
      { "name": "Gacha-Island", "url": "https://gacha-island.jp/45902/", "badge": "badge-island" }
    ]
  },
  {
    "id": "island_51223",
    "maker": "Gacha Island (ウルトラニュープランニング)",
    "title": "けみかるハムスタースクイーズ！",
    "price": "200円 / 全6種",
    "image_url": "https://gacha-island.jp/wp-content/uploads/2026/09/29_%EF%BD%B9%EF%BD%B0%EF%BD%B6%EF%BD%B9%EF%BE%91%EF%BD%BD%EF%BD%BF%EF%BD%B0%EF%BD%BD%EF%BD%AF%EF%BD%B2%EF%BD%B0%EF%BD%BD%EF%BE%9E_w-300x274.jpg",
    "jan_code": null,
    "release_date": "2026年11月",
    "category": "スクイーズ",
    "detail_url": "https://gacha-island.jp/51223/",
    "description": "ぷにぷに感触がたまらない、理科室モチーフのキュートな「けみかるハムスター」スクイーズ！",
    "availability_status": "HUBS_AVAILABLE",
    "other_sources": [
      { "name": "Gacha-Island", "url": "https://gacha-island.jp/51223/", "badge": "badge-island" }
    ]
  },
  {
    "id": "4582770095142000",
    "maker": "Bandai",
    "title": "＃ハッシュタグつける 葬送のフリーレン",
    "price": "300円",
    "image_url": "https://bandai-a.akamaihd.net/bc/img/model/b/1000259527_1.jpg",
    "jan_code": "4582770095142",
    "release_date": "2026年11月未定",
    "category": "ガシャポン",
    "detail_url": "https://gashapon.jp/products/detail.php?jan_code=4582770095142000",
    "description": "フリーレンやフェルンたちの名言ハッシュタグチャーム！（Vorankündigung für November 2026）",
    "availability_status": "UPCOMING"
  },
  {
    "id": "4570118183859000",
    "maker": "Bandai",
    "title": "ポケットモンスター ガシャっとコレクト07",
    "price": "300円",
    "image_url": "https://bandai-a.akamaihd.net/bc/img/model/b/1000258661_2.jpg",
    "jan_code": "4570118183859",
    "release_date": "2026年9月 第4週",
    "category": "ガシャポン",
    "detail_url": "https://gashapon.jp/products/detail.php?jan_code=4570118183859000",
    "description": "モンスターボール形状のカプセルから人気ポケモンフィギュアが登場！全国84店舗展開中。",
    "availability_status": "IN_STOCK"
  },
  {
    "id": "Y904783",
    "maker": "Takara Tomy Arts",
    "title": "トムとジェリー ジェリー Funny moment めじるしガチャマスコット",
    "price": "300円",
    "image_url": "https://www.takaratomy-arts.co.jp/upfiles/products/Y904783_b.jpg",
    "jan_code": "4904790904783",
    "release_date": "2026年10月",
    "category": "ガチャ",
    "detail_url": "https://www.takaratomy-arts.co.jp/items/item.html?n=Y904783",
    "description": "傘やペットボトルにつけて自分用の目印にできるジェリーのめじるしマスコット。",
    "availability_status": "IN_STOCK"
  },
  {
    "id": "4582770137750000",
    "maker": "Bandai",
    "title": "ポンデクルール ちいかわ マルチカラーパウダー",
    "price": "500円",
    "image_url": "https://bandai-a.akamaihd.net/bc/img/model/b/1000259513_2.jpg",
    "jan_code": "4582770137750",
    "release_date": "2026年10月",
    "category": "ガシャポン",
    "detail_url": "https://gashapon.jp/products/detail.php?jan_code=4582770137750000",
    "description": "大人気「ちいかわ」のマルチカラーパウダー。店頭機では現在大人気のため完売中（Out of Stock）。",
    "availability_status": "OUT_OF_STOCK"
  }
];

// ---------------------------------------------------------
// Application State
// ---------------------------------------------------------
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
  isOnline: true,
  favorites: {
    items: [],
    searches: []
  }
};

// ---------------------------------------------------------
// DOM Elements
// ---------------------------------------------------------
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

// Direct Saved Searches Bar on Main Page
const savedSearchesBar = document.getElementById('savedSearchesBar');
const savedSearchesChips = document.getElementById('savedSearchesChips');
const btnClearAllSearches = document.getElementById('btnClearAllSearches');

// Server Status & Settings Modal
const btnServerStatus = document.getElementById('btnServerStatus');
const serverStatusText = document.getElementById('serverStatusText');
const settingsModal = document.getElementById('settingsModal');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const backendUrlInput = document.getElementById('backendUrlInput');
const btnSaveBackendUrl = document.getElementById('btnSaveBackendUrl');
const btnResetBackendUrl = document.getElementById('btnResetBackendUrl');

// Mobile Bottom Navigation Bar
const mobileBottomNav = document.getElementById('mobileBottomNav');
const mNavSearch = document.getElementById('mNavSearch');
const mNavSaved = document.getElementById('mNavSaved');
const mNavSavedBadge = document.getElementById('mNavSavedBadge');
const mNavFavs = document.getElementById('mNavFavs');
const mNavFavBadge = document.getElementById('mNavFavBadge');
const mNavHubs = document.getElementById('mNavHubs');

// Shop Modal
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

// Favorites Modal
const btnOpenFavorites = document.getElementById('btnOpenFavorites');
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

// Help Modal
const helpModal = document.getElementById('helpModal');
const btnHelp = document.getElementById('btnHelp');
const btnCloseHelp = document.getElementById('btnCloseHelp');


// ---------------------------------------------------------
// Initialization
// ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadFavoritesFromStorage();
  setupEventListeners();
  checkBackendHealth();
  loadPrefectures();
  loadPopularGachas();
});


// ---------------------------------------------------------
// Backend Health Check & Settings
// ---------------------------------------------------------
async function checkBackendHealth() {
  API_BASE = getApiBaseUrl();
  try {
    const res = await fetch(`${API_BASE}/api/health`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      setBackendStatus(true, 'Online');
      return;
    }
  } catch (e) {
    // Backend not reachable
  }
  if (!API_BASE && window.location.hostname !== 'localhost') {
    setBackendStatus(false, 'GitHub Pages (Demo/Offline)');
  } else {
    setBackendStatus(false, 'Offline / Demo');
  }
}

function setBackendStatus(online, label) {
  state.isOnline = online;
  if (serverStatusText) serverStatusText.textContent = label;
  const dot = btnServerStatus?.querySelector('.status-indicator-dot');
  if (dot) {
    dot.className = `status-indicator-dot ${online ? 'online' : 'offline'}`;
  }
}


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

  // Clear all saved searches
  if (btnClearAllSearches) {
    btnClearAllSearches.addEventListener('click', () => {
      if (confirm('Möchtest du alle gemerkten Suchbegriffe löschen?')) {
        state.favorites.searches = [];
        saveFavoritesToStorage();
      }
    });
  }

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
      window.scrollTo({ top: searchForm.offsetTop - 10, behavior: 'smooth' });
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

  tabFavItems.addEventListener('click', () => switchFavTab('items'));
  tabFavSearches.addEventListener('click', () => switchFavTab('searches'));

  // Backend Settings Modal Handlers
  if (btnServerStatus) {
    btnServerStatus.addEventListener('click', () => {
      if (backendUrlInput) backendUrlInput.value = localStorage.getItem('gacha_backend_url') || '';
      settingsModal.style.display = 'flex';
    });
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => settingsModal.style.display = 'none');
  }
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) settingsModal.style.display = 'none';
    });
  }
  if (btnSaveBackendUrl) {
    btnSaveBackendUrl.addEventListener('click', () => {
      const val = (backendUrlInput.value || '').trim();
      if (val) {
        localStorage.setItem('gacha_backend_url', val);
      } else {
        localStorage.removeItem('gacha_backend_url');
      }
      settingsModal.style.display = 'none';
      checkBackendHealth();
      loadPopularGachas();
    });
  }
  if (btnResetBackendUrl) {
    btnResetBackendUrl.addEventListener('click', () => {
      localStorage.removeItem('gacha_backend_url');
      if (backendUrlInput) backendUrlInput.value = '';
      settingsModal.style.display = 'none';
      checkBackendHealth();
      loadPopularGachas();
    });
  }

  // Mobile Bottom Navigation Handlers
  if (mNavSearch) {
    mNavSearch.addEventListener('click', () => {
      setActiveNavBtn(mNavSearch);
      window.scrollTo({ top: searchForm.offsetTop - 15, behavior: 'smooth' });
      searchInput.focus();
    });
  }
  if (mNavSaved) {
    mNavSaved.addEventListener('click', () => {
      setActiveNavBtn(mNavSaved);
      if (state.favorites.searches.length > 0 && savedSearchesBar) {
        window.scrollTo({ top: savedSearchesBar.offsetTop - 20, behavior: 'smooth' });
      } else {
        openFavoritesModal('searches');
      }
    });
  }
  if (mNavFavs) {
    mNavFavs.addEventListener('click', () => {
      setActiveNavBtn(mNavFavs);
      openFavoritesModal('items');
    });
  }
  if (mNavHubs) {
    mNavHubs.addEventListener('click', () => {
      setActiveNavBtn(mNavHubs);
      // Open Japan Premier Mega-Hubs Explorer directly!
      openShopModal({
        id: 'japan_hubs_explorer',
        maker: 'Gacha-Island / Mega-Hubs',
        title: '🗾 Japan Gacha Mega-Hubs & Flagship Stores',
        price: '3.000+ Maschinen vor Ort',
        release_date: 'Ganzjährig geöffnet',
        image_url: 'https://gacha-island.jp/wp-content/uploads/2026/09/29_%EF%BD%B9%EF%BD%B0%EF%BD%B6%EF%BD%B9%EF%BE%91%EF%BD%BD%EF%BD%BF%EF%BD%B0%EF%BD%BD%EF%BD%AF%EF%BD%B2%EF%BD%B0%EF%BD%BD%EF%BE%9E_w-300x274.jpg',
        description: 'Alle großen Gashapon-Fachzentren in Japan (#C-pla Flagships, Gacha-Gacha no Mori, Akihabara Radio Kaikan, Nakano Broadway) auf einer interaktiven Karte.',
        availability_status: 'HUBS_AVAILABLE'
      });
    });
  }

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
      if (settingsModal) settingsModal.style.display = 'none';
    }
  });
}

function setActiveNavBtn(btn) {
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
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
  renderSavedSearchesBar();
}

function saveFavoritesToStorage() {
  try {
    localStorage.setItem('gacha_fav_items', JSON.stringify(state.favorites.items));
    localStorage.setItem('gacha_fav_searches', JSON.stringify(state.favorites.searches));
  } catch (e) {
    console.warn('Could not save favorites to localStorage:', e);
  }
  updateFavCounters();
  renderSavedSearchesBar();
}

function updateFavCounters() {
  const itemCount = state.favorites.items.length;
  const searchCount = state.favorites.searches.length;

  if (favCounterBadge) favCounterBadge.textContent = itemCount;
  if (tabCountItems) tabCountItems.textContent = itemCount;
  if (tabCountSearches) tabCountSearches.textContent = searchCount;
  if (mNavFavBadge) mNavFavBadge.textContent = itemCount;
  if (mNavSavedBadge) {
    mNavSavedBadge.textContent = searchCount;
    mNavSavedBadge.style.display = searchCount > 0 ? 'flex' : 'none';
  }
}

// ---------------------------------------------------------
// Saved Searches Bar (Direct Access on Main Page)
// ---------------------------------------------------------
function renderSavedSearchesBar() {
  if (!savedSearchesBar || !savedSearchesChips) return;
  const searches = state.favorites.searches || [];

  if (searches.length === 0) {
    savedSearchesBar.style.display = 'none';
    savedSearchesChips.innerHTML = '';
    return;
  }

  savedSearchesBar.style.display = 'flex';
  savedSearchesChips.innerHTML = searches.map((query) => `
    <div class="saved-search-pill" data-query="${escapeHtml(query)}">
      <span class="pill-text">🔍 ${escapeHtml(query)}</span>
      <button type="button" class="btn-del-pill" title="Aus gemerkten Suchen entfernen" data-query="${escapeHtml(query)}">✕</button>
    </div>
  `).join('');

  savedSearchesChips.querySelectorAll('.saved-search-pill').forEach((pill) => {
    pill.querySelector('.pill-text').addEventListener('click', () => {
      const q = pill.dataset.query;
      searchInput.value = q;
      btnClear.style.display = 'flex';
      executeSearch(q);
      window.scrollTo({ top: searchForm.offsetTop - 15, behavior: 'smooth' });
    });

    pill.querySelector('.btn-del-pill').addEventListener('click', (e) => {
      e.stopPropagation();
      removeSearchFavorite(pill.dataset.query);
    });
  });
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
              : `<button type="button" class="btn-fav-check btn-find-shops-fav">🏬 Standorte & Karte</button>`
            }
          </div>
        </div>
      `;

      card.querySelector('.btn-fav-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavoriteItem(item);
      });

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
  API_BASE = getApiBaseUrl();
  try {
    const res = await fetch(`${API_BASE}/api/prefectures`);
    if (res.ok) {
      const prefs = await res.json();
      state.prefectures = prefs;
      renderPrefSelect(prefs);
      return;
    }
  } catch (err) {
    // Fallback
  }
  state.prefectures = FALLBACK_PREFECTURES;
  renderPrefSelect(FALLBACK_PREFECTURES);
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
// ---------------------------------------------------------
async function loadPopularGachas() {
  setLoading(true);
  API_BASE = getApiBaseUrl();
  try {
    const res = await fetch(`${API_BASE}/api/popular`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      state.popularItems = data;
      renderPopularView();
      return;
    }
  } catch (err) {
    console.warn('Could not load popular from backend, using fallback catalog:', err);
  } finally {
    setLoading(false);
  }

  // Graceful standalone fallback
  state.popularItems = FALLBACK_ITEMS;
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
// Execute Search (with Multilingual Translation notice & Offline Fallback)
// ---------------------------------------------------------
async function executeSearch(query) {
  state.currentQuery = query;
  setLoading(true);
  emptyState.style.display = 'none';
  translationNotice.style.display = 'none';
  productGrid.innerHTML = '';

  resultsHeading.textContent = `Suchergebnisse für "${query}"`;
  btnResetToPopular.style.display = 'inline-block';

  API_BASE = getApiBaseUrl();
  try {
    const url = `${API_BASE}/api/search?q=${encodeURIComponent(query)}&maker=${state.currentMaker}&limit=35`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      state.currentResults = data.results || [];
      resultsCount.textContent = `${state.currentResults.length} Treffer`;

      if (data.translated_from) {
        translationNotice.innerHTML = `💡 Begriff erkannt: <strong>"${escapeHtml(data.translated_from)}"</strong> → Japanische Gachapon-Datenbanken nach <strong>"${escapeHtml(data.query)}"</strong> durchsucht.`;
        translationNotice.style.display = 'block';
      }

      if (state.currentResults.length === 0) {
        emptyState.style.display = 'block';
      } else {
        renderProducts(state.currentResults);
      }
      return;
    }
  } catch (err) {
    console.warn('Live search unreachable, executing offline/demo matching:', err);
  } finally {
    setLoading(false);
  }

  // Offline / Standalone Demo Search Fallback
  const qLower = query.toLowerCase();
  const matched = FALLBACK_ITEMS.filter(it => {
    const t = (it.title || '').toLowerCase();
    const d = (it.description || '').toLowerCase();
    const m = (it.maker || '').toLowerCase();
    return t.includes(qLower) || d.includes(qLower) || m.includes(qLower) || qLower.includes('apotheke') || qLower.includes('soft') || qLower.includes('fairy') || qLower.includes('hamster') || qLower.includes('frieren');
  });

  state.currentResults = matched.length > 0 ? matched : FALLBACK_ITEMS;
  resultsCount.textContent = `${state.currentResults.length} Treffer (Demo-Katalog)`;
  renderProducts(state.currentResults);
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
// Helper: Card Availability Status Badge (Accurate & Synced)
// ---------------------------------------------------------
function getStatusBadgeHtml(status, totalShops = null) {
  switch (status) {
    case 'IN_STOCK':
      const shopTxt = (totalShops !== null && totalShops > 0) ? `Auf Lager (${totalShops})` : 'Auf Lager';
      return `<div class="card-status-badge status-in-stock"><span>🟢</span> <span>${shopTxt}</span></div>`;
    case 'HUBS_AVAILABLE':
      return `<div class="card-status-badge status-hubs"><span>🏬</span> <span>An Fachzentren</span></div>`;
    case 'RELEASED':
      return `<div class="card-status-badge status-released"><span>🏬</span> <span>Im Handel (Bestand prüfen)</span></div>`;
    case 'UPCOMING':
      return `<div class="card-status-badge status-upcoming"><span>⏳</span> <span>Vorankündigung</span></div>`;
    case 'ARCHIVED':
      return `<div class="card-status-badge status-archived"><span>📦</span> <span>Archiv / Vintage</span></div>`;
    case 'OUT_OF_STOCK':
    default:
      return `<div class="card-status-badge status-out-of-stock"><span>🔴</span> <span>Vergriffen (0 Standorte)</span></div>`;
  }
}


// ---------------------------------------------------------
// Render Product Cards (Prominent Release Dates & Multi-Source Badges)
// ---------------------------------------------------------
function renderProducts(items) {
  productGrid.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    let badgeClass = 'badge-other';
    const mLower = (item.maker || '').toLowerCase();
    if (mLower.includes('bandai')) badgeClass = 'badge-bandai';
    else if (mLower.includes('tomy')) badgeClass = 'badge-takaratomy';
    else if (mLower.includes('island')) badgeClass = 'badge-island';
    else if (mLower.includes('kitan')) badgeClass = 'badge-kitan';

    const fallbackImg = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f2f6'/><text x='50' y='55' font-size='30' text-anchor='middle'>🎁</text></svg>";
    const imgSrc = item.image_url || fallbackImg;

    const isFav = isItemFavorited(item.id);
    const statusHtml = getStatusBadgeHtml(item.availability_status);
    const releaseText = item.release_date ? `📅 Release: ${escapeHtml(item.release_date)}` : '📅 Release: Aktuell';

    const isKitan = mLower.includes('kitan');
    const isIslandOrIndie = mLower.includes('island') || isKitan || !item.jan_code;

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
          <button type="button" class="btn-find-shops ${isIslandOrIndie ? 'btn-hubs' : ''}" data-id="${escapeHtml(item.id)}">
            ${isIslandOrIndie ? '🏬 Gacha-Hubs & Karte' : '🏬 Standorte & Bestand'}
          </button>
          ${item.detail_url && isIslandOrIndie ? `<a href="${escapeHtml(item.detail_url)}" target="_blank" rel="noopener" class="btn-source-link">🏝️ Auf Gacha-Island ansehen ↗</a>` : ''}
          ${item.detail_url && !isIslandOrIndie ? `<a href="${escapeHtml(item.detail_url)}" target="_blank" rel="noopener" class="btn-source-link">Offizielle Seite ↗</a>` : ''}
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

  const mLower = (product.maker || '').toLowerCase();
  let makerParam = 'bandai';
  if (mLower.includes('tomy')) {
    makerParam = 'takaratomy';
  } else if (mLower.includes('island') || mLower.includes('kitan') || !product.jan_code) {
    makerParam = 'island';
  }

  const janParam = product.jan_code || '';
  const itemIdParam = product.id || '';

  API_BASE = getApiBaseUrl();
  let queryUrl = `${API_BASE}/api/shops?maker=${makerParam}&pref=`;
  if (janParam) queryUrl += `&jan_code=${encodeURIComponent(janParam)}`;
  if (itemIdParam) queryUrl += `&item_id=${encodeURIComponent(itemIdParam)}`;
  if (product.title) queryUrl += `&product_name=${encodeURIComponent(product.title)}`;

  try {
    const res = await fetch(queryUrl, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    state.allShops = data.shops || [];
    state.regionCache[''] = state.allShops;
    state.filteredShops = [...state.allShops];

    if (data.release_date) {
      modalReleaseDate.textContent = `📅 Release: ${data.release_date}`;
    }
    modalLastChecked.textContent = `🕒 Bestandsdaten: ${data.last_data_check}`;

    // Sync live availability status back to product object and card badge!
    product.availability_status = data.availability_status;
    const cardEl = document.querySelector(`.product-card [data-id="${CSS.escape(product.id)}"]`)?.closest('.product-card');
    if (cardEl) {
      const badgeEl = cardEl.querySelector('.card-status-badge');
      if (badgeEl) {
        badgeEl.outerHTML = getStatusBadgeHtml(data.availability_status, data.total_shops);
      }
    }

    renderStatusBanner(data);
    renderCollectorBox(data);
    renderShopsUI(state.filteredShops);
    return;
  } catch (err) {
    console.warn('Live shop query unavailable, falling back to hubs/offline data:', err);
  } finally {
    shopLoading.style.display = 'none';
  }

  // Offline / GitHub Pages fallback
  state.allShops = FALLBACK_HUBS;
  state.regionCache[''] = state.allShops;
  state.filteredShops = [...state.allShops];

  const fallbackData = {
    availability_status: 'HUBS_AVAILABLE',
    status_label: `🏬 An Fachzentren verfügbar (${FALLBACK_HUBS.length} Mega-Stores gelistet)`,
    status_advice: 'Artikel dieses Herstellers sind zuverlässig in den großen Gacha-Mega-Zentren (#C-pla Flagships, Gacha-Gacha no Mori, Akihabara Radio Kaikan) vor Ort zu finden.',
    collector_links: {
      "Gacha-Island Review": "https://gacha-island.jp/",
      "Akihabara Gacha District": "https://www.google.com/maps/search/?api=1&query=Akihabara+Radio+Kaikan+Tokyo"
    }
  };

  modalReleaseDate.textContent = product.release_date ? `📅 Release: ${product.release_date}` : '📅 Release: Aktuell';
  modalLastChecked.textContent = '🕒 Bestandsdaten: Tagesaktuell im Hub';
  renderStatusBanner(fallbackData);
  renderCollectorBox(fallbackData);
  renderShopsUI(state.filteredShops);
}

function renderStatusBanner(data) {
  modalStatusBanner.style.display = 'flex';
  let bannerClass = 'status-in-stock';
  let icon = '🟢';

  if (data.availability_status === 'OUT_OF_STOCK') {
    bannerClass = 'status-out-of-stock';
    icon = '🔴';
  } else if (data.availability_status === 'HUBS_AVAILABLE') {
    bannerClass = 'status-hubs';
    icon = '🏬';
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
  if (data.availability_status === 'IN_STOCK' || data.availability_status === 'HUBS_AVAILABLE') {
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
    state.filteredShops = state.regionCache[''] || state.allShops;
    renderShopsUI(state.filteredShops);
    return;
  }

  if (state.regionCache[prefCode]) {
    state.filteredShops = state.regionCache[prefCode];
    renderShopsUI(state.filteredShops);
    return;
  }

  const product = state.activeProduct;
  const mLower = (product.maker || '').toLowerCase();
  let makerParam = 'bandai';
  if (mLower.includes('tomy')) {
    makerParam = 'takaratomy';
  } else if (mLower.includes('island') || mLower.includes('kitan') || !product.jan_code) {
    makerParam = 'island';
  }

  const janParam = product.jan_code || '';
  const itemIdParam = product.id || '';

  const opt = prefSelect.querySelector(`option[value="${prefCode}"]`);
  const prefLabel = opt ? opt.textContent : 'Region';

  shopLoading.style.display = 'block';
  shopCountText.textContent = `Standorte für ${prefLabel} werden in Echtzeit abgefragt...`;

  API_BASE = getApiBaseUrl();
  let queryUrl = `${API_BASE}/api/shops?maker=${makerParam}&pref=${encodeURIComponent(prefCode)}`;
  if (janParam) queryUrl += `&jan_code=${encodeURIComponent(janParam)}`;
  if (itemIdParam) queryUrl += `&item_id=${encodeURIComponent(itemIdParam)}`;
  if (product.title) queryUrl += `&product_name=${encodeURIComponent(product.title)}`;

  try {
    const res = await fetch(queryUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const shops = data.shops || [];

    state.regionCache[prefCode] = shops;
    if (state.currentPref === prefCode) {
      state.filteredShops = shops;
      renderShopsUI(state.filteredShops);
    }
    return;
  } catch (err) {
    console.warn('Regional fetch fallback to local filter:', err);
  } finally {
    shopLoading.style.display = 'none';
  }

  // Local filter fallback
  const prefName = opt ? (opt.dataset.name || '') : '';
  state.filteredShops = state.allShops.filter((s) => {
    if (s.pref_code && String(s.pref_code) === String(prefCode)) return true;
    if (s.prefecture && prefName && s.prefecture.includes(prefName)) return true;
    if (s.address && prefName && s.address.includes(prefName)) return true;
    return false;
  });
  renderShopsUI(state.filteredShops);
}


// ---------------------------------------------------------
// Switch Map / List View
// ---------------------------------------------------------
function switchShopView(view) {
  state.currentView = view;

  if (view === 'map') {
    btnViewMap.classList.add('active');
    btnViewList.classList.remove('active');
    shopMapContainer.style.display = 'block';
    shopListContainer.style.display = 'none';

    setTimeout(() => {
      initMapIfNeeded();
      if (state.map) {
        state.map.invalidateSize();
        renderMapMarkers(state.filteredShops);
      }
    }, 100);
  } else {
    btnViewList.classList.add('active');
    btnViewMap.classList.remove('active');
    shopListContainer.style.display = 'block';
    shopMapContainer.style.display = 'none';
  }
}


// ---------------------------------------------------------
// Render Shops UI (Count synchronizer across top bar and views)
// ---------------------------------------------------------
function renderShopsUI(shops) {
  const count = shops.length;
  const opt = prefSelect.querySelector(`option[value="${state.currentPref}"]`);
  const regionName = opt ? opt.textContent : 'Japan';

  shopCountText.textContent = count > 0 
    ? `${count} Standorte in ${regionName} gefunden`
    : `Keine Standorte für ${regionName} gemeldet`;

  if (countBadgeMap) countBadgeMap.textContent = count;
  if (countBadgeList) countBadgeList.textContent = count;

  renderShopList(shops);

  if (state.currentView === 'map' && state.map) {
    renderMapMarkers(shops);
  }
}

function renderShopList(shops) {
  shopList.innerHTML = '';
  if (shops.length === 0) {
    shopList.innerHTML = `
      <div style="text-align: center; padding: 30px; color: #64748b;">
        <div style="font-size: 2rem; margin-bottom: 8px;">📍</div>
        <p>In dieser Region wurden aktuell keine Verkaufsstellen gemeldet.</p>
        <small>Wähle oben "Ganz Japan", um alle Standorte im Land zu durchsuchen.</small>
      </div>
    `;
    return;
  }

  shops.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'shop-card';

    const distStr = s.distance_meters != null
      ? (s.distance_meters >= 1000 ? `${(s.distance_meters / 1000).toFixed(1)} km` : `${s.distance_meters} m`)
      : null;

    card.innerHTML = `
      <div class="shop-info">
        <h5 class="shop-name">${escapeHtml(s.shop_name)}</h5>
        <p class="shop-address">📍 ${escapeHtml(s.address)}</p>
        ${s.phone ? `<p class="shop-phone">📞 ${escapeHtml(s.phone)}</p>` : ''}
        <div class="shop-meta-row">
          <span class="shop-status">● ${escapeHtml(s.stock_status || 'Auf Lager')}</span>
          ${distStr ? `<span class="shop-dist">Distanz: ${distStr}</span>` : ''}
          ${s.last_updated ? `<span style="font-size: 0.7rem; color: #94a3b8;">(${escapeHtml(s.last_updated)})</span>` : ''}
        </div>
      </div>
      <div class="shop-action">
        <a href="${escapeHtml(s.google_maps_url)}" target="_blank" rel="noopener" class="btn-gmaps">
          🗺️ Google Maps Navigation ↗
        </a>
      </div>
    `;

    shopList.appendChild(card);
  });
}


// ---------------------------------------------------------
// Leaflet Map Initialization & Rendering
// ---------------------------------------------------------
function initMapIfNeeded() {
  if (state.map) return;

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Center on Tokyo / Japan
  state.map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true,
    tap: !L.Browser.mobile
  }).setView([36.2048, 138.2529], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(state.map);

  state.markersLayer = L.layerGroup().addTo(state.map);
}

function renderMapMarkers(shops) {
  if (!state.map || !state.markersLayer) return;

  state.markersLayer.clearLayers();

  const validShops = shops.filter((s) => s.latitude != null && s.longitude != null);
  if (validShops.length === 0) {
    state.map.setView([36.2048, 138.2529], 5);
    return;
  }

  const latLngs = [];

  const capsuleIcon = L.divIcon({
    className: 'custom-capsule-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: #ff4757;
        border: 2.5px solid #2f3542;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        color: white;
        font-size: 15px;
        transform: translate(-16px, -16px);
      ">
        🔴
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [0, 0],
    popupAnchor: [0, -16]
  });

  validShops.forEach((s) => {
    const latLng = [s.latitude, s.longitude];
    latLngs.push(latLng);

    const marker = L.marker(latLng, { icon: capsuleIcon });

    const popupHtml = `
      <div style="font-family: 'Outfit', sans-serif; font-size: 13px; max-width: 250px; padding: 4px;">
        <strong style="color: #1e272e; font-size: 14px; display: block; margin-bottom: 4px;">${escapeHtml(s.shop_name)}</strong>
        <p style="color: #57606f; margin: 0 0 6px;">📍 ${escapeHtml(s.address)}</p>
        <span style="display:inline-block; font-size: 11px; font-weight: bold; color: #10ac84; background: #e8faf0; padding: 2px 6px; border-radius: 4px; margin-bottom: 8px;">● ${escapeHtml(s.stock_status || 'Auf Lager')}</span>
        <div>
          <a href="${escapeHtml(s.google_maps_url)}" target="_blank" rel="noopener" style="display: block; text-align: center; background: #2f3542; color: #fff; padding: 6px 10px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 12px;">Google Maps Navigation ↗</a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    state.markersLayer.addLayer(marker);
  });

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
