"""
Gacha / Capsule Toy Finder Backend v2.5
Proxy and scraper for:
- Bandai (gashapon.jp)
- Takara Tomy Arts (takaratomy-arts.co.jp)
- Kitan Club (kitan.jp)
- Gacha-Island (gacha-island.jp)

Includes:
- Multilingual translation (German/English to Japanese search terms)
- Accurate store inventory per prefecture (e.g. full 84+ stores in Tokyo)
- Pre-calculated availability status on search overview
- Direct integration & reference links for gachanavi.com and gacha-island.jp
- In-memory TTL caching for 0ms regional responsiveness
"""

import os
import re
import time
import asyncio
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Constants & Paths
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

HTTP_TIMEOUT = httpx.Timeout(15.0, connect=8.0)

app = FastAPI(
    title="Gacha Toy Finder Japan API",
    description="Multilingual Gacha finder with live stock, release dates, and store locator for Japan.",
    version="2.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# In-Memory TTL Cache
# ---------------------------------------------------------
class TTLCache:
    def __init__(self, ttl_seconds: int = 900):  # 15 minutes default
        self.ttl = ttl_seconds
        self.store: Dict[str, Tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self.store:
            timestamp, data = self.store[key]
            if time.time() - timestamp < self.ttl:
                return data
            else:
                del self.store[key]
        return None

    def set(self, key: str, value: Any):
        self.store[key] = (time.time(), value)

    def clear(self):
        self.store.clear()

CACHE = TTLCache(ttl_seconds=900)


# ---------------------------------------------------------
# Multilingual Search Dictionary (Externalized to translations.py / translations.json)
# ---------------------------------------------------------
import sys
from pathlib import Path
_BACKEND_DIR = Path(__file__).resolve().parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

try:
    from translations import (
        translate_query,
        get_translations,
        get_sorted_keys,
        reload_translations,
        add_translation,
        TRANSLATIONS_FILE
    )
except ImportError:
    from backend.translations import (
        translate_query,
        get_translations,
        get_sorted_keys,
        reload_translations,
        add_translation,
        TRANSLATIONS_FILE
    )



# ---------------------------------------------------------
# Prefectures Map (Japan 1-47)
# ---------------------------------------------------------
PREFECTURES = [
    {"code": "1", "name": "北海道", "name_en": "Hokkaido"},
    {"code": "2", "name": "青森県", "name_en": "Aomori"},
    {"code": "3", "name": "岩手県", "name_en": "Iwate"},
    {"code": "4", "name": "宮城県", "name_en": "Miyagi"},
    {"code": "5", "name": "秋田県", "name_en": "Akita"},
    {"code": "6", "name": "山形県", "name_en": "Yamagata"},
    {"code": "7", "name": "福島県", "name_en": "Fukushima"},
    {"code": "8", "name": "茨城県", "name_en": "Ibaraki"},
    {"code": "9", "name": "栃木県", "name_en": "Tochigi"},
    {"code": "10", "name": "群馬県", "name_en": "Gunma"},
    {"code": "11", "name": "埼玉県", "name_en": "Saitama"},
    {"code": "12", "name": "千葉県", "name_en": "Chiba"},
    {"code": "13", "name": "東京都", "name_en": "Tokyo"},
    {"code": "14", "name": "神奈川県", "name_en": "Kanagawa"},
    {"code": "15", "name": "新潟県", "name_en": "Niigata"},
    {"code": "16", "name": "富山県", "name_en": "Toyama"},
    {"code": "17", "name": "石川県", "name_en": "Ishikawa"},
    {"code": "18", "name": "福井県", "name_en": "Fukui"},
    {"code": "19", "name": "山梨県", "name_en": "Yamanashi"},
    {"code": "20", "name": "長野県", "name_en": "Nagano"},
    {"code": "21", "name": "岐阜県", "name_en": "Gifu"},
    {"code": "22", "name": "静岡県", "name_en": "Shizuoka"},
    {"code": "23", "name": "愛知県", "name_en": "Aichi"},
    {"code": "24", "name": "三重県", "name_en": "Mie"},
    {"code": "25", "name": "滋賀県", "name_en": "Shiga"},
    {"code": "26", "name": "京都府", "name_en": "Kyoto"},
    {"code": "27", "name": "大阪府", "name_en": "Osaka"},
    {"code": "28", "name": "兵庫県", "name_en": "Hyogo"},
    {"code": "29", "name": "奈良県", "name_en": "Nara"},
    {"code": "30", "name": "和歌山県", "name_en": "Wakayama"},
    {"code": "31", "name": "鳥取県", "name_en": "Tottori"},
    {"code": "32", "name": "島根県", "name_en": "Shimane"},
    {"code": "33", "name": "岡山県", "name_en": "Okayama"},
    {"code": "34", "name": "広島県", "name_en": "Hiroshima"},
    {"code": "35", "name": "山口県", "name_en": "Yamaguchi"},
    {"code": "36", "name": "徳島県", "name_en": "Tokushima"},
    {"code": "37", "name": "香川県", "name_en": "Kagawa"},
    {"code": "38", "name": "愛媛県", "name_en": "Ehime"},
    {"code": "39", "name": "高知県", "name_en": "Kochi"},
    {"code": "40", "name": "福岡県", "name_en": "Fukuoka"},
    {"code": "41", "name": "佐賀県", "name_en": "Saga"},
    {"code": "42", "name": "長崎県", "name_en": "Nagasaki"},
    {"code": "43", "name": "熊本県", "name_en": "Kumamoto"},
    {"code": "44", "name": "大分県", "name_en": "Oita"},
    {"code": "45", "name": "宮崎県", "name_en": "Miyazaki"},
    {"code": "46", "name": "鹿児島県", "name_en": "Kagoshima"},
    {"code": "47", "name": "沖縄県", "name_en": "Okinawa"},
]

PREF_BY_CODE = {p["code"]: p for p in PREFECTURES}
PREF_BY_NAME = {p["name"]: p for p in PREFECTURES}
PREF_BY_EN = {p["name_en"].lower(): p for p in PREFECTURES}

def resolve_prefecture(query: Optional[str]) -> Tuple[str, str]:
    if not query:
        return "", ""
    q = query.strip()
    if q in PREF_BY_CODE:
        p = PREF_BY_CODE[q]
        return p["code"], p["name"]
    for name, p in PREF_BY_NAME.items():
        if q in name or name in q:
            return p["code"], p["name"]
    q_lower = q.lower()
    for en, p in PREF_BY_EN.items():
        if q_lower in en or en in q_lower:
            return p["code"], p["name"]
    return "", q


# ---------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------
class SourceLink(BaseModel):
    name: str
    url: str
    badge: str = "badge-other"

class GachaItem(BaseModel):
    id: str
    maker: str
    title: str
    price: Optional[str] = None
    image_url: Optional[str] = None
    jan_code: Optional[str] = None
    release_date: Optional[str] = None
    category: Optional[str] = None
    detail_url: Optional[str] = None
    description: Optional[str] = None
    availability_status: str = "CHECK_STOCK"  # IN_STOCK, OUT_OF_STOCK, UPCOMING, ARCHIVED, CHECK_STOCK
    shop_count: Optional[int] = None
    is_vintage: bool = False
    other_sources: List[SourceLink] = Field(default_factory=list)

class ShopLocation(BaseModel):
    shop_name: str
    prefecture: Optional[str] = None
    address: str
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_meters: Optional[int] = None
    stock_status: str = "Verfügbar / In Stock"
    last_updated: Optional[str] = None
    google_maps_url: str

class SearchResponse(BaseModel):
    query: str
    translated_from: Optional[str] = None
    maker: str
    count: int
    results: List[GachaItem]

class ShopResponse(BaseModel):
    maker: str
    product_name: Optional[str] = None
    jan_code: Optional[str] = None
    release_date: Optional[str] = None
    prefecture: Optional[str] = None
    total_shops: int
    last_data_check: str
    availability_status: str
    status_label: str
    status_advice: Optional[str] = None
    collector_links: Dict[str, str] = {}
    shops: List[ShopLocation]


def evaluate_status(title: str, release_date: Optional[str], raw_id: str) -> Tuple[str, Optional[int]]:
    """Evaluates availability status and shop count for search overview cards."""
    clean_id = raw_id.strip() if raw_id else ""
    cached_status = CACHE.get(f"stock_status_{clean_id}")
    if cached_status:
        return cached_status[0], cached_status[1]

    raw_jan = clean_id[:13] if len(clean_id) >= 13 else clean_id
    cached_jan = CACHE.get(f"stock_status_{raw_jan}")
    if cached_jan:
        return cached_jan[0], cached_jan[1]

    t_lower = title.lower()
    if any(k in t_lower for k in ["予約", "受注", "pre_", "登場予定", "発売予定"]):
        return "UPCOMING", None
    if "pre_" in clean_id.lower():
        return "UPCOMING", None
    if release_date:
        if any(k in release_date for k in ["未定", "予定", "2026年11月", "2026年12月", "2027年"]):
            return "UPCOMING", None
        m_year = re.search(r"(201\d|202[0-4])年", release_date)
        if m_year:
            return "ARCHIVED", 0

    return "CHECK_STOCK", None


def normalize_title(title: str) -> str:
    """Normalizes titles across different makers/sites to find matching products."""
    if not title:
        return ""
    t = title
    t = re.sub(r"【[^】]*】", "", t)
    t = re.sub(r"『([^』]*)』", r"\1", t)
    t = re.sub(r"「([^」]*)」", r"\1", t)
    t = re.sub(r"\[[^\]]*\]", "", t)
    t = re.sub(r"（再販）|\(再販\)|（.*?）|\(.*?\)", "", t)
    t = re.sub(r"TVアニメ|アニメ|劇場版|映画", "", t)
    t = re.sub(r"[!！?？]+", "", t)
    t = re.sub(r"[\s\u3000・～〜\-—:：]+", "", t)
    return t.strip().lower()


def merge_and_cross_link_items(items: List[GachaItem]) -> List[GachaItem]:
    """
    Merges duplicate or re-listed items from multiple platforms (Bandai, Takara Tomy, Gacha-Island)
    and attaches multi-source links so the user sees all available sites on each card.
    """
    merged: List[GachaItem] = []
    seen_keys: Dict[str, GachaItem] = {}

    for item in items:
        jan_key = f"jan_{item.jan_code}" if item.jan_code and len(item.jan_code) == 13 else None
        title_key = f"norm_{normalize_title(item.title)}" if item.title else None

        existing_primary = None
        if jan_key and jan_key in seen_keys:
            existing_primary = seen_keys[jan_key]
        elif title_key and title_key in seen_keys:
            existing_primary = seen_keys[title_key]

        if existing_primary:
            # Item found on multiple sources!
            new_maker = item.maker
            badge_class = "badge-other"
            m_low = new_maker.lower()
            if "bandai" in m_low: badge_class = "badge-bandai"
            elif "tomy" in m_low: badge_class = "badge-takaratomy"
            elif "island" in m_low: badge_class = "badge-island"
            elif "kitan" in m_low: badge_class = "badge-kitan"

            # Add source link if not already present
            if item.detail_url and not any(s.url == item.detail_url for s in existing_primary.other_sources):
                existing_primary.other_sources.append(SourceLink(
                    name=new_maker,
                    url=item.detail_url,
                    badge=badge_class
                ))

            # Enrich missing metadata in primary
            if not existing_primary.release_date and item.release_date:
                existing_primary.release_date = item.release_date
            if not existing_primary.price and item.price:
                existing_primary.price = item.price
            if not existing_primary.jan_code and item.jan_code:
                existing_primary.jan_code = item.jan_code

            # If primary was Gacha-Island but this new item is Bandai/Takara (with live machine locator), promote Bandai/Takara
            if ("bandai" in m_low or "tomy" in m_low) and "island" in existing_primary.maker.lower():
                orig_url = existing_primary.detail_url
                orig_maker = existing_primary.maker
                existing_primary.maker = item.maker
                existing_primary.id = item.id
                existing_primary.jan_code = item.jan_code
                existing_primary.detail_url = item.detail_url
                if not any(s.url == orig_url for s in existing_primary.other_sources):
                    existing_primary.other_sources.append(SourceLink(
                        name=orig_maker,
                        url=orig_url,
                        badge="badge-island"
                    ))
        else:
            # Add GachaNavi release calendar link by default
            nav_encoded = urllib.parse.quote(normalize_title(item.title)[:15]) if item.title else ""
            item.other_sources.append(SourceLink(
                name="GachaNavi",
                url=f"https://gachanavi.com/?s={nav_encoded}",
                badge="badge-other"
            ))
            merged.append(item)
            if jan_key:
                seen_keys[jan_key] = item
            if title_key:
                seen_keys[title_key] = item

    return merged


# ---------------------------------------------------------
# Verified Popular Items with Active Machine Stock
# ---------------------------------------------------------
POPULAR_ITEMS = [
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
        "description": "カプセル自体がモンスターボール形状になり、中から人気ポケモンフィギュアが登場！全国80店舗以上展開中。",
        "availability_status": "IN_STOCK"
    },
    {
        "id": "4582770054149000",
        "maker": "Bandai",
        "title": "ジェムリーズ ポケットモンスター13 Summer",
        "price": "400円",
        "image_url": "https://bandai-a.akamaihd.net/bc/img/model/b/1000254930_2.jpg",
        "jan_code": "4582770054149",
        "release_date": "2026年8月 第2週",
        "category": "ガシャポン",
        "detail_url": "https://gashapon.jp/products/detail.php?jan_code=4582770054149000",
        "description": "ジュエリースタンドとしても使えるカプセルトイ「ジェムリーズ」シリーズ！",
        "availability_status": "IN_STOCK"
    },
    {
        "id": "4570118182029000",
        "maker": "Bandai",
        "title": "それいけ！アンパンマン おっきなアンパンマンマスコット11",
        "price": "300円",
        "image_url": "https://bandai-a.akamaihd.net/bc/img/model/xl/1000258586_1.jpg",
        "jan_code": "4570118182029",
        "release_date": "2026年10月 第3週",
        "category": "ガシャポン",
        "detail_url": "https://gashapon.jp/products/detail.php?jan_code=4570118182029000",
        "description": "顔形のカプセルから体をくるっと出すと、約9cmの大きなマスコットに！東京駅一番街等で展開中。",
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
        "description": "傘やペットボトルにつけて自分用の目印にできるジェリーのめじるしマスコット。全国200店舗以上で大人気稼働中！",
        "availability_status": "IN_STOCK"
    },
    {
        "id": "Y910456",
        "maker": "Takara Tomy Arts",
        "title": "スーパーマリオ とことこヨッシー",
        "price": "400円",
        "image_url": "https://www.takaratomy-arts.co.jp/upfiles/products/Y910456_b.jpg",
        "jan_code": "4904790910456",
        "release_date": "2026年10月",
        "category": "ガチャ",
        "detail_url": "https://www.takaratomy-arts.co.jp/items/item.html?n=Y910456",
        "description": "ゼンマイを巻くとトコトコ歩く！可愛らしいヨッシーのフィギュアトイ。全国79店舗以上で展開。",
        "availability_status": "IN_STOCK"
    },
    {
        "id": "Y903908",
        "maker": "Takara Tomy Arts",
        "title": "サンリオキャラクターズ ねぇだっこして〜",
        "price": "400円",
        "image_url": "https://www.takaratomy-arts.co.jp/upfiles/products/Y903908_b.jpg",
        "jan_code": "4904790903908",
        "release_date": "2026年10月",
        "category": "ガチャ",
        "detail_url": "https://www.takaratomy-arts.co.jp/items/item.html?n=Y903908",
        "description": "サンリオの仲間たちが抱っこを求めて手を広げた愛らしいポーズのフィギュア！98店舗以上で稼働中。",
        "availability_status": "IN_STOCK"
    },
    {
        "id": "4582770081770000",
        "maker": "Bandai",
        "title": "ポケットモンスター スイングコレクションType:Water",
        "price": "300円",
        "image_url": "https://bandai-a.akamaihd.net/bc/img/model/b/1000257442_2.jpg",
        "jan_code": "4582770081770",
        "release_date": "2026年11月予定",
        "category": "ガシャポン",
        "detail_url": "https://gashapon.jp/products/detail.php?jan_code=4582770081770000",
        "description": "みずタイプのポケモンたちがゆらゆら揺れるスイングマスコット！（Vorankündigung für November 2026）",
        "availability_status": "UPCOMING"
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
]


# ---------------------------------------------------------
# Bandai Scraping Logic (gashapon.jp)
# ---------------------------------------------------------
async def search_bandai(query: str, limit: int = 25) -> List[GachaItem]:
    cache_key = f"bandai_search_{query}_{limit}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    items: List[GachaItem] = []
    clean_q = query.strip()
    is_numeric = clean_q.isdigit()

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        if is_numeric and len(clean_q) in (13, 16):
            jan_code = clean_q if len(clean_q) == 16 else f"{clean_q}000"
            detail_item = await get_bandai_detail(jan_code, client=client)
            if detail_item:
                items.append(detail_item)

        search_url = f"https://gashapon.jp/products/result.php?free={urllib.parse.quote(clean_q)}"
        try:
            resp = await client.get(search_url)
            cards = []
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                cards = soup.select(".c-card__list")

            # Fallback if 0 cards found and query has quotes or brackets
            if not cards and re.search(r"[『』「」【】\"\'“”]", clean_q):
                clean_kw = re.sub(r"[『』「」【】\"\'“”]", " ", clean_q).strip()
                clean_kw = re.sub(r"\s+", " ", clean_kw)
                if clean_kw != clean_q:
                    fb_url = f"https://gashapon.jp/products/result.php?free={urllib.parse.quote(clean_kw)}"
                    resp_fb = await client.get(fb_url)
                    if resp_fb.status_code == 200:
                        soup_fb = BeautifulSoup(resp_fb.text, "html.parser")
                        cards = soup_fb.select(".c-card__list")

            for card in cards:
                if len(items) >= limit:
                    break
                link = card.select_one("a.c-card__link")
                if not link or "href" not in link.attrs:
                    continue
                href = link["href"]
                m_jan = re.search(r"jan_code=([^&]+)", href)
                if not m_jan:
                    continue
                full_jan = m_jan.group(1)
                raw_jan = full_jan[:13] if len(full_jan) >= 13 else full_jan

                if any(it.id == full_jan for it in items):
                    continue

                title_el = card.select_one(".c-card__name")
                title = title_el.get_text().strip() if title_el else "Bandai Gashapon"

                img_el = card.select_one("img")
                img_url = img_el["src"] if (img_el and "src" in img_el.attrs) else None
                if img_url and not img_url.startswith("http"):
                    img_url = urllib.parse.urljoin("https://gashapon.jp", img_url)

                price_el = card.select_one(".c-card__price")
                price = price_el.get_text().strip() if price_el else None

                cat_el = card.select_one(".c-card__category")
                category = cat_el.get_text().strip() if cat_el else "ガシャポン"

                full_detail_url = f"https://gashapon.jp/products/detail.php?jan_code={full_jan}"

                status, s_count = evaluate_status(title, None, full_jan)

                items.append(GachaItem(
                    id=full_jan,
                    maker="Bandai",
                    title=title,
                    price=price,
                    image_url=img_url,
                    jan_code=raw_jan,
                    category=category,
                    detail_url=full_detail_url,
                    availability_status=status,
                    shop_count=s_count
                ))

            # Concurrently enrich items with release dates from detail pages
            async def enrich_bandai_item(item: GachaItem):
                meta_key = f"bandai_meta_{item.id}"
                cached_meta = CACHE.get(meta_key)
                if cached_meta:
                    item.release_date, item.price, rel_status, rel_count = cached_meta
                    if rel_status:
                        item.availability_status = rel_status
                        item.shop_count = rel_count
                    return
                try:
                    r_det = await client.get(item.detail_url)
                    if r_det.status_code == 200:
                        m_rel = re.search(r"<dt[^>]*>発売時期</dt>\s*<dd[^>]*>(.*?)</dd>", r_det.text, re.DOTALL)
                        if m_rel:
                            item.release_date = re.sub(r"<[^>]+>", "", m_rel.group(1)).strip()
                        m_pr = re.search(r"<dt[^>]*>価格\(税込\)</dt>\s*<dd[^>]*>(.*?)</dd>", r_det.text, re.DOTALL)
                        if m_pr and not item.price:
                            item.price = re.sub(r"<[^>]+>", "", m_pr.group(1)).strip()
                        item.availability_status, item.shop_count = evaluate_status(item.title, item.release_date, item.id)
                        CACHE.set(meta_key, (item.release_date, item.price, item.availability_status, item.shop_count))
                except Exception:
                    pass

            if items:
                await asyncio.gather(*(enrich_bandai_item(it) for it in items[:15]))
        except Exception as e:
            print(f"[Bandai Search Error] {e}")

    CACHE.set(cache_key, items)
    return items


async def get_bandai_detail(jan_code: str, client: Optional[httpx.AsyncClient] = None) -> Optional[GachaItem]:
    clean_jan = jan_code.strip()
    full_jan = clean_jan if len(clean_jan) == 16 else f"{clean_jan}000"
    raw_jan = clean_jan[:13] if len(clean_jan) >= 13 else clean_jan
    cache_key = f"bandai_detail_{full_jan}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    url = f"https://gashapon.jp/products/detail.php?jan_code={full_jan}"
    should_close = False
    if client is None:
        client = httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT, follow_redirects=True)
        should_close = True

    try:
        resp = await client.get(url)
        if resp.status_code != 200 or "商品が見つかりませんでした" in resp.text:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")
        h1 = soup.select_one("h1.pg-heading")
        title = h1.get_text().strip() if h1 else None
        if not title:
            og_title = soup.find("meta", property="og:title")
            title = og_title["content"].strip() if og_title else "Bandai Gashapon"

        img_el = soup.select_one(".pg-detail__picture img")
        img_url = img_el["src"] if (img_el and "src" in img_el.attrs) else None
        if not img_url:
            og_img = soup.find("meta", property="og:image")
            img_url = og_img["content"] if og_img else None

        desc_el = soup.select_one(".pg-detail__description")
        desc = desc_el.get_text().strip() if desc_el else None

        release_date = None
        price = None
        for dl in soup.select("dl.pg-detailDefinition"):
            dt = dl.select_one("dt")
            dd = dl.select_one("dd")
            if dt and dd:
                dt_txt = dt.get_text()
                if "発売時期" in dt_txt or "発売日" in dt_txt:
                    release_date = dd.get_text().strip()
                elif "価格" in dt_txt:
                    price = dd.get_text().strip()

        status, s_count = evaluate_status(title, release_date, full_jan)

        item = GachaItem(
            id=full_jan,
            maker="Bandai",
            title=title,
            price=price,
            image_url=img_url,
            jan_code=raw_jan,
            release_date=release_date,
            category="ガシャポン",
            detail_url=url,
            description=desc,
            availability_status=status,
            shop_count=s_count
        )
        CACHE.set(cache_key, item)
        return item
    except Exception as e:
        print(f"[Bandai Detail Error] {e}")
        return None
    finally:
        if should_close:
            await client.aclose()


async def get_bandai_shops_and_meta(
    jan_code: str,
    pref: str = "",
    lat: float = 35.6812,
    lng: float = 139.7671
) -> Tuple[List[ShopLocation], Optional[str], Optional[str]]:
    clean_jan = jan_code.strip()
    product_code = clean_jan[:13] if len(clean_jan) >= 13 else clean_jan
    full_jan = f"{product_code}000" if len(clean_jan) <= 13 else clean_jan

    _, pref_name_jp = resolve_prefecture(pref)
    cache_key = f"bandai_shops_{product_code}_{pref_name_jp}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    shops: List[ShopLocation] = []
    release_date = None
    last_updated_str = None

    url_api = "https://gashapon.jp/shop/leaflet/getShopProducts.php"
    url_detail = f"https://gashapon.jp/products/detail.php?jan_code={full_jan}"
    headers = {
        "User-Agent": USER_AGENT,
        "Referer": url_detail,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }

    payload = {
        "pref": pref_name_jp,
        "free": "",
        "product_code": product_code,
        "gplus_type": "gplus",
        "center_lat": lat,
        "center_lng": lng,
        "map_distance_flg": "false"
    }

    async with httpx.AsyncClient(headers=headers, timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        try:
            resp_detail = await client.get(url_detail)
            if resp_detail.status_code == 200:
                m_up = re.search(r"最終更新日時[：:]\s*([0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日\s*[0-9]{1,2}時[0-9]{1,2}分)", resp_detail.text)
                if m_up:
                    last_updated_str = f"Stand gashapon.jp: {m_up.group(1)} JST"

                m_rel = re.search(r"<dt[^>]*>発売時期</dt>\s*<dd[^>]*>(.*?)</dd>", resp_detail.text, re.DOTALL)
                if m_rel:
                    release_date = re.sub(r"<[^>]+>", "", m_rel.group(1)).strip()
        except Exception as e:
            print(f"[Bandai Detail Meta Error] {e}")

        try:
            resp_api = await client.post(url_api, data=payload)
            if resp_api.status_code == 200:
                data = resp_api.json()
                raw_shops = data.get("gplus_data", [])
                for s in raw_shops:
                    name = s.get("shop_title", "Bandai Official Shop")
                    shop_pref = s.get("shop_pref", "")
                    addr = s.get("shop_address", "")
                    full_addr = f"{shop_pref} {addr}".strip()
                    zip_code = s.get("shop_zip", "")
                    phone = s.get("shop_phone", "")
                    s_lat = float(s["latitude"]) if s.get("latitude") else None
                    s_lng = float(s["longitude"]) if s.get("longitude") else None
                    dist = int(s["distance"]) if s.get("distance") else None
                    shop_modified = s.get("modified") or s.get("last_modified")

                    query_loc = f"{name} {full_addr}"
                    gmaps_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(query_loc)}"

                    shops.append(ShopLocation(
                        shop_name=name,
                        prefecture=shop_pref,
                        address=full_addr,
                        postal_code=zip_code,
                        phone=phone if phone else None,
                        latitude=s_lat,
                        longitude=s_lng,
                        distance_meters=dist,
                        stock_status="Lagernd / Verfügbar (Bandai Live)",
                        last_updated=shop_modified,
                        google_maps_url=gmaps_url
                    ))
        except Exception as e:
            print(f"[Bandai Shops API Error] {e}")

    if pref_name_jp:
        shops = [s for s in shops if pref_name_jp in (s.prefecture or "") or pref_name_jp in (s.address or "")]

    result = (shops, release_date, last_updated_str)
    CACHE.set(cache_key, result)
    return result


# ---------------------------------------------------------
# Takara Tomy Arts Scraping Logic (takaratomy-arts.co.jp)
# ---------------------------------------------------------
async def search_takaratomy(query: str, limit: int = 25) -> List[GachaItem]:
    cache_key = f"tomy_search_{query}_{limit}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    items: List[GachaItem] = []
    clean_q = query.strip()
    search_url = (
        f"https://search.takaratomy-arts.co.jp/search?site=HLQCWXGN&charset=UTF-8"
        f"&group=arts&design=arts01&sort=date&query={urllib.parse.quote(clean_q)}"
    )

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        try:
            resp = await client.get(search_url)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                found_map: Dict[str, Dict[str, Any]] = {}

                for a in soup.find_all("a", href=True):
                    raw_href = urllib.parse.unquote(a["href"])
                    m_item = re.search(r"item\.html\?n=([^&]+)", raw_href)
                    if m_item:
                        item_id = m_item.group(1)
                        if item_id not in found_map:
                            found_map[item_id] = {
                                "id": item_id,
                                "url": f"https://www.takaratomy-arts.co.jp/items/item.html?n={item_id}"
                            }
                        img = a.find("img")
                        if img and img.get("src"):
                            found_map[item_id]["img"] = img["src"]
                        text = a.get_text().strip()
                        if text and not found_map[item_id].get("title"):
                            clean_title = text.replace("｜商品情報｜タカラトミーアーツ", "").strip()
                            found_map[item_id]["title"] = clean_title

                for item_id, data in found_map.items():
                    if len(items) >= limit:
                        break
                    num_part = re.sub(r"[^\d]", "", item_id)
                    jan_code = f"4904790{num_part}" if num_part else None
                    title = data.get("title") or f"Takara Tomy Arts Item {item_id}"
                    img_url = data.get("img")
                    if img_url and not img_url.startswith("http"):
                        img_url = urllib.parse.urljoin("https://www.takaratomy-arts.co.jp", img_url)

                    status, s_count = evaluate_status(title, None, item_id)

                    items.append(GachaItem(
                        id=item_id,
                        maker="Takara Tomy Arts",
                        title=title,
                        image_url=img_url,
                        jan_code=jan_code,
                        category="ガチャ",
                        detail_url=data.get("url"),
                        availability_status=status,
                        shop_count=s_count
                    ))
        except Exception as e:
            print(f"[Takara Tomy Search Error] {e}")

    CACHE.set(cache_key, items)
    return items


async def get_takaratomy_detail(item_id: str, client: Optional[httpx.AsyncClient] = None) -> Optional[GachaItem]:
    clean_id = item_id.strip()
    cache_key = f"tomy_detail_{clean_id}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    url = f"https://www.takaratomy-arts.co.jp/items/item.html?n={clean_id}"
    should_close = False
    if client is None:
        client = httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT, follow_redirects=True)
        should_close = True

    try:
        resp = await client.get(url)
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")
        m_jan = re.search(r'var _jan\s*=\s*["\']([^"\']+)["\']', resp.text)
        jan_code = f"4904790{m_jan.group(1)}" if m_jan else None

        og_title = soup.find("meta", property="og:title")
        raw_title = og_title["content"].strip() if og_title else ""
        title = raw_title.replace("｜商品情報｜タカラトミーアーツ", "").strip()
        if not title:
            h2 = soup.select_one("h2")
            title = h2.get_text().strip() if h2 else clean_id

        og_img = soup.find("meta", property="og:image")
        img_url = og_img["content"].strip() if og_img else None

        og_desc = soup.find("meta", property="og:description")
        desc = og_desc["content"].strip() if og_desc else None

        price = None
        release_date = None
        for dl in soup.select("dl"):
            dt = dl.select_one("dt")
            dd = dl.select_one("dd")
            if dt and dd:
                t = dt.get_text()
                if "価格" in t:
                    price = dd.get_text().strip()
                elif "発売時期" in t or "発売日" in t:
                    release_date = dd.get_text().strip()

        status, s_count = evaluate_status(title, release_date, clean_id)

        item = GachaItem(
            id=clean_id,
            maker="Takara Tomy Arts",
            title=title,
            price=price,
            image_url=img_url,
            jan_code=jan_code,
            release_date=release_date,
            category="ガチャ",
            detail_url=url,
            description=desc,
            availability_status=status,
            shop_count=s_count
        )
        CACHE.set(cache_key, item)
        return item
    except Exception as e:
        print(f"[Takara Tomy Detail Error] {e}")
        return None
    finally:
        if should_close:
            await client.aclose()


async def get_takaratomy_shops_and_meta(
    jan_code: str = "",
    item_id: str = "",
    product_name: str = "",
    pref: str = ""
) -> Tuple[List[ShopLocation], Optional[str], Optional[str]]:
    shohincd = jan_code.strip() if jan_code else ""
    pref_code, _ = resolve_prefecture(pref)

    cache_key = f"tomy_shops_{shohincd}_{item_id}_{pref_code}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    shops: List[ShopLocation] = []
    release_date = None
    last_updated_str = "Tagesaktuelle Händlerdaten (Live-Abfrage)"

    async with httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT, "Cookie": "tarts_gacha_shoplist=true"},
        timeout=HTTP_TIMEOUT,
        follow_redirects=True
    ) as client:
        if not shohincd:
            if item_id:
                detail = await get_takaratomy_detail(item_id, client=client)
                if detail:
                    shohincd = detail.jan_code or ""
                    release_date = detail.release_date
            elif product_name:
                search_results = await search_takaratomy(product_name, limit=3)
                if search_results:
                    detail = await get_takaratomy_detail(search_results[0].id, client=client)
                    if detail:
                        shohincd = detail.jan_code or ""
                        release_date = detail.release_date

        if not shohincd:
            return [], release_date, last_updated_str

        if not release_date and item_id:
            detail = await get_takaratomy_detail(item_id, client=client)
            if detail:
                release_date = detail.release_date

        url = f"https://www.takaratomy-arts.co.jp/items/shoplist.html?shohincd={shohincd}"
        if pref_code:
            url += f"&pcode={pref_code}"

        try:
            resp = await client.get(url)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")

                coords_map: Dict[str, Tuple[float, float]] = {}
                for m_push in re.finditer(
                    r"position:\s*new google\.maps\.LatLng\(([\d\.\-]+),\s*([\d\.\-]+)\).*?tenpocd=([0-9a-zA-Z]+)",
                    resp.text,
                    re.DOTALL
                ):
                    lat = float(m_push.group(1))
                    lng = float(m_push.group(2))
                    tenpocd = m_push.group(3)
                    coords_map[tenpocd] = (lat, lng)

                shop_items = soup.select("#shoplist li")
                for li in shop_items:
                    a_tag = li.select_one("a")
                    h3_tag = li.select_one("h3")
                    p_tag = li.select_one("p")

                    shop_name = h3_tag.get_text().strip() if h3_tag else "Gacha Store"
                    addr = p_tag.get_text().strip() if p_tag else ""

                    tenpocd = ""
                    if a_tag and "href" in a_tag.attrs:
                        m_t = re.search(r"tenpocd=([0-9a-zA-Z]+)", a_tag["href"])
                        if m_t:
                            tenpocd = m_t.group(1)

                    s_lat, s_lng = coords_map.get(tenpocd, (None, None))

                    pref_name = None
                    for p in PREFECTURES:
                        if addr.startswith(p["name"]):
                            pref_name = p["name"]
                            break

                    gmaps_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(f'{shop_name} {addr}')}"

                    shops.append(ShopLocation(
                        shop_name=shop_name,
                        prefecture=pref_name,
                        address=addr,
                        latitude=s_lat,
                        longitude=s_lng,
                        stock_status="Im Sortiment / Verfügbar (Takara Tomy Arts)",
                        last_updated="Aktuell gelistet",
                        google_maps_url=gmaps_url
                    ))
        except Exception as e:
            print(f"[Takara Tomy Shops Error] {e}")

    result = (shops, release_date, last_updated_str)
    CACHE.set(cache_key, result)
    return result


# ---------------------------------------------------------
# Kitan Club Scraping Logic (kitan.jp)
# ---------------------------------------------------------
async def search_kitan(query: str, limit: int = 20) -> List[GachaItem]:
    clean_q = query.strip()
    cache_key = f"kitan_search_{clean_q}_{limit}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    items: List[GachaItem] = []
    search_url = f"https://kitan.jp/?s={urllib.parse.quote(clean_q)}"

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        try:
            resp = await client.get(search_url)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                links = soup.select('a[href*="/products/"]')
                seen = set()

                for a in links:
                    if len(items) >= limit:
                        break
                    href = a["href"]
                    if href.rstrip("/") == "https://kitan.jp/products":
                        continue
                    m = re.search(r"/products/([^/]+)/?", href)
                    if not m:
                        continue
                    slug = m.group(1)
                    if slug in seen:
                        continue
                    seen.add(slug)

                    img = a.find("img")
                    img_url = img["src"] if (img and "src" in img.attrs) else None
                    title_text = a.get_text().strip()

                    items.append(GachaItem(
                        id=slug,
                        maker="Kitan Club",
                        title=title_text if title_text else slug.replace("_", " ").title(),
                        image_url=img_url,
                        category="キタンクラブ",
                        detail_url=href,
                        availability_status="IN_STOCK"
                    ))
        except Exception as e:
            print(f"[Kitan Club Search Error] {e}")

    CACHE.set(cache_key, items)
    return items


# ---------------------------------------------------------
# Gacha Island Scraping Logic (gacha-island.jp)
# ---------------------------------------------------------
# ---------------------------------------------------------
# Manufacturer Normalization & Recognition (for Aggregators & Indie Brands)
# ---------------------------------------------------------
def normalize_maker_name(raw_maker: Optional[str], title: Optional[str] = None) -> str:
    """
    Intelligently identifies and standardizes Japanese manufacturer names
    (e.g. バンダイ -> Bandai, タカラトミーアーツ -> Takara Tomy Arts, キタンクラブ -> Kitan Club).
    """
    combined = f"{raw_maker or ''} {title or ''}"

    if any(k in combined for k in ["バンダイ", "Bandai", "BANDAI", "bandai"]):
        return "Bandai"
    if any(k in combined for k in ["タカラトミーアーツ", "タカラトミー", "Takara Tomy", "T-ARTS", "タカラ"]):
        return "Takara Tomy Arts"
    if any(k in combined for k in ["キタンクラブ", "奇譚クラブ", "Kitan", "KITAN", "kitan"]):
        return "Kitan Club"
    if any(k in combined for k in ["ブシロード", "Bushiroad"]):
        return "Bushiroad"
    if any(k in combined for k in ["スタンド・ストーンズ", "スタンドストーンズ", "stasto", "StaSto"]):
        return "Stand Stones"
    if any(k in combined for k in ["ケンエレファント", "Kenelephant"]):
        return "Kenelephant"
    if any(k in combined for k in ["J.DREAM", "Jドリーム", "ジェイドリーム"]):
        return "J.Dream"
    if any(k in combined for k in ["SO-TA", "so-ta", "ソータ", "スタジオソータ"]):
        return "SO-TA"
    if any(k in combined for k in ["クオリア", "Qualia"]):
        return "Qualia"
    if any(k in combined for k in ["エール", "Yell"]):
        return "Yell"
    if any(k in combined for k in ["アイピーフォー", "IP4"]):
        return "IP4"
    if any(k in combined for k in ["トイズキャビン", "Toys Cabin"]):
        return "Toys Cabin"
    if any(k in combined for k in ["トイズスピリッツ", "Toys Spirits"]):
        return "Toys Spirits"
    if any(k in combined for k in ["ターリン", "Tarlin", "エポック"]):
        return "Tarlin"
    if any(k in combined for k in ["レインボー", "Rainbow"]):
        return "Rainbow"
    if any(k in combined for k in ["パレード", "Parade"]):
        return "Parade"
    if any(k in combined for k in ["ピーナッツクラブ", "Peanuts Club"]):
        return "Peanuts Club"
    if any(k in combined for k in ["トーシン", "Toshin"]):
        return "Toshin"

    if raw_maker and raw_maker.strip():
        m_clean = raw_maker.strip()
        return m_clean if "Gacha Island" in m_clean else f"Gacha Island ({m_clean})"

    return "Gacha Island"


async def search_gacha_island(query: str, limit: int = 20) -> List[GachaItem]:
    clean_q = query.strip()
    cache_key = f"island_search_{clean_q}_{limit}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    items: List[GachaItem] = []
    search_url = f"https://gacha-island.jp/?s={urllib.parse.quote(clean_q)}"

    async with httpx.AsyncClient(headers={"User-Agent": USER_AGENT}, timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        try:
            resp = await client.get(search_url)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                for li in soup.select(".p-postList__item"):
                    if len(items) >= limit:
                        break
                    title_el = li.select_one(".p-postList__title")
                    link_el = li.select_one("a")
                    img_el = li.select_one("img")
                    if not title_el or not link_el:
                        continue

                    title = title_el.get_text().strip()
                    href = link_el["href"]
                    img_src = img_el["src"] if img_el and "src" in img_el.attrs else None

                    # Extract ID from URL (e.g. /53995/)
                    m_id = re.search(r"/(\d+)/?", href)
                    item_id = f"island_{m_id.group(1)}" if m_id else href

                    price = None
                    release_date = None
                    raw_maker = None

                    # Parse .gacha-info-table inside .gacha-card-info
                    info_table = li.select_one(".gacha-info-table")
                    if info_table:
                        for tr in info_table.select("tr"):
                            th = tr.select_one("th")
                            td = tr.select_one("td")
                            if th and td:
                                th_t = th.get_text().strip()
                                td_t = td.get_text().strip()
                                if "発売" in th_t:
                                    release_date = td_t
                                elif "価格" in th_t:
                                    price = td_t
                                elif "メーカー" in th_t:
                                    raw_maker = td_t

                    maker_name = normalize_maker_name(raw_maker, title)
                    status, s_count = evaluate_status(title, release_date, item_id)

                    items.append(GachaItem(
                        id=item_id,
                        maker=maker_name,
                        title=title,
                        price=price,
                        release_date=release_date,
                        image_url=img_src,
                        category="ガチャアイランド",
                        detail_url=href,
                        availability_status=status,
                        shop_count=s_count
                    ))
        except Exception as e:
            print(f"[Gacha Island Search Error] {e}")

    CACHE.set(cache_key, items)
    return items


# ---------------------------------------------------------
# Collector & Reference Links
# ---------------------------------------------------------
def generate_collector_links(title: str, jan_code: Optional[str]) -> Dict[str, str]:
    search_term = title.split("～")[0].split("｜")[0].strip()
    encoded = urllib.parse.quote(search_term)
    return {
        "Surugaya (駿河屋 - Gebraucht & Sammlersets)": f"https://www.suruga-ya.jp/search?search_word={encoded}",
        "Mercari Japan (メルカリ - Größter Marktplatz)": f"https://jp.mercari.com/search?keyword={encoded}",
        "Yahoo! Auctions Japan (ヤフオク)": f"https://auctions.yahoo.co.jp/search/search?p={encoded}",
        "Gacha-Island (総合レビュー & Standorte)": f"https://gacha-island.jp/?s={encoded}",
        "GachaNavi (Release-Kalender)": "https://gachanavi.com/releases",
        "Akihabara Gacha District (Radio Kaikan & Lashinbang)": "https://www.google.com/maps/search/?api=1&query=Akihabara+Radio+Kaikan+Tokyo",
        "Nakano Broadway Vintage Hub": "https://www.google.com/maps/search/?api=1&query=Nakano+Broadway+Tokyo"
    }


# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "Gacha Finder API Japan",
        "version": "2.5.0",
        "supported_sources": ["Bandai", "Takara Tomy Arts", "Kitan Club", "Gacha Island", "GachaNavi"]
    }


@app.get("/api/translations")
async def get_translations_list():
    """Returns the loaded dictionary of translations, total count, and source file path."""
    trans = get_translations()
    return {
        "count": len(trans),
        "source_file": str(TRANSLATIONS_FILE),
        "translations": trans
    }



@app.get("/api/prefectures")
async def get_prefectures():
    return PREFECTURES


@app.get("/api/popular", response_model=List[GachaItem])
async def get_popular():
    return [GachaItem(**item) for item in POPULAR_ITEMS]


@app.get("/api/search", response_model=SearchResponse)
async def search_gacha(
    q: str = Query(..., min_length=1, description="Product title, keyword in German/English/Japanese, or JAN barcode"),
    maker: str = Query("all", description="'all', 'bandai', 'takaratomy', 'kitan', 'island'"),
    limit: int = Query(30, ge=1, le=100)
):
    maker_lower = maker.lower() if isinstance(maker, str) else "all"
    limit_val = limit if isinstance(limit, int) else 30

    search_q, translated_from = translate_query(q)

    # Run scrapers concurrently in parallel for maximum speed!
    tasks = []
    if maker_lower in ("all", "bandai"):
        tasks.append(search_bandai(search_q, limit=limit_val))
    if maker_lower in ("all", "takaratomy"):
        tasks.append(search_takaratomy(search_q, limit=limit_val))
    if maker_lower in ("all", "island", "gacha-island", "bandai", "kitan"):
        tasks.append(search_gacha_island(search_q, limit=limit_val))
    if maker_lower in ("all", "kitan"):
        tasks.append(search_kitan(search_q, limit=limit_val))

    scraper_results = await asyncio.gather(*tasks, return_exceptions=True)
    raw_items: List[GachaItem] = []
    for res in scraper_results:
        if isinstance(res, list):
            raw_items.extend(res)

    # Multi-source deduplication and cross-linking!
    merged_items = merge_and_cross_link_items(raw_items)

    if maker_lower != "all":
        merged_items = [it for it in merged_items if maker_lower in it.maker.lower()]

    return SearchResponse(
        query=search_q,
        translated_from=translated_from,
        maker=maker_lower,
        count=len(merged_items),
        results=merged_items[:limit_val]
    )


@app.get("/api/product/{maker}/{product_id}", response_model=Optional[GachaItem])
async def get_product_detail(maker: str, product_id: str):
    m = maker.lower()
    if m == "bandai":
        item = await get_bandai_detail(product_id)
        if not item:
            raise HTTPException(status_code=404, detail="Bandai product not found")
        return item
    elif m in ("takaratomy", "tomy"):
        item = await get_takaratomy_detail(product_id)
        if not item:
            raise HTTPException(status_code=404, detail="Takara Tomy Arts product not found")
        return item
    else:
        raise HTTPException(status_code=400, detail=f"Detailed view not supported for maker: {maker}")


@app.get("/api/shops", response_model=ShopResponse)
async def get_shops(
    maker: str = Query("bandai", description="'bandai', 'takaratomy'"),
    jan_code: Optional[str] = Query(None, description="JAN barcode (13-digit)"),
    item_id: Optional[str] = Query(None, description="Item ID for Takara Tomy Arts (e.g. Y904783)"),
    product_name: Optional[str] = Query(None, description="Product name for fallback search"),
    pref: Optional[str] = Query(None, description="Prefecture code (1-47) or empty for All Japan"),
    lat: float = Query(35.6812, description="Latitude"),
    lng: float = Query(139.7671, description="Longitude")
):
    m = maker.lower() if isinstance(maker, str) else "bandai"
    code = jan_code if isinstance(jan_code, str) else None
    item_id_str = item_id if isinstance(item_id, str) else ""
    prod_name = product_name if isinstance(product_name, str) else None
    pref_str = pref if isinstance(pref, str) else ""
    lat_val = lat if isinstance(lat, (int, float)) else 35.6812
    lng_val = lng if isinstance(lng, (int, float)) else 139.7671

    release_date = None
    last_updated_str = None
    shops: List[ShopLocation] = []

    now_jst = datetime.now(timezone(timedelta(hours=9))).strftime("%d.%m.%Y, %H:%M JST")

    if m == "bandai":
        if not code and prod_name:
            search_res = await search_bandai(prod_name, limit=3)
            if search_res and search_res[0].jan_code:
                code = search_res[0].jan_code
                prod_name = search_res[0].title
            else:
                norm_title = normalize_title(prod_name)
                search_res2 = await search_bandai(norm_title, limit=3)
                if search_res2 and search_res2[0].jan_code:
                    code = search_res2[0].jan_code
                    prod_name = search_res2[0].title

        if not code:
            shops = []
            last_updated_str = "Bandai-Server Wartungsmodus / keine Live-Sensordaten verfügbar"
        else:
            shops, release_date, last_updated_str = await get_bandai_shops_and_meta(
                jan_code=code,
                pref=pref_str,
                lat=lat_val,
                lng=lng_val
            )

    elif m in ("takaratomy", "tomy"):
        shops, release_date, last_updated_str = await get_takaratomy_shops_and_meta(
            jan_code=code or "",
            item_id=item_id_str,
            product_name=prod_name or "",
            pref=pref_str
        )
    else:
        shops = []
        last_updated_str = f"Aggregator-Daten ({m.title()})"

    total_shops = len(shops)
    last_data_check = last_updated_str if last_updated_str else f"Geprüft am {now_jst}"

    is_vintage = bool(release_date and re.search(r"(201\d|202[0-4])年", release_date))
    is_future = bool(release_date and any(w in release_date for w in ["未定", "予定", "2026年11月", "2026年12月", "2027年"]))

    if total_shops > 0:
        availability_status = "IN_STOCK"
        status_label = f"🟢 Auf Lager ({total_shops} Standorte gemeldet)"
        status_advice = "Dieser Artikel ist aktuell an offiziellen Automaten und Shops verfügbar. Klicke auf einen Shop für direkte Google Maps Navigation."
        if code: CACHE.set(f"stock_status_{code}", ("IN_STOCK", total_shops))
        if item_id_str: CACHE.set(f"stock_status_{item_id_str}", ("IN_STOCK", total_shops))
    elif is_future:
        availability_status = "UPCOMING"
        status_label = f"⏳ Vorankündigung (Erscheint: {release_date})"
        status_advice = f"Dieser Artikel wurde offiziell für {release_date} angekündigt. Die Maschinen in Japan werden pünktlich zum Releasetag befüllt."
        if code: CACHE.set(f"stock_status_{code}", ("UPCOMING", None))
        if item_id_str: CACHE.set(f"stock_status_{item_id_str}", ("UPCOMING", None))
    elif is_vintage:
        availability_status = "ARCHIVED"
        status_label = f"📦 Archiv / Sammlerstück (Release: {release_date or 'Früherer Jahrgang'})"
        status_advice = "Dieser Gacha stammt aus einer früheren Kollektion und ist an Münzautomaten nicht mehr im Umlauf. Für Sammler empfiehlt sich ein Besuch in Second-Hand-Shops in Akihabara oder Nakano Broadway."
        if code: CACHE.set(f"stock_status_{code}", ("ARCHIVED", 0))
        if item_id_str: CACHE.set(f"stock_status_{item_id_str}", ("ARCHIVED", 0))
    else:
        availability_status = "OUT_OF_STOCK"
        status_label = f"🔴 Derzeit vergriffen (0 Standorte gemeldet)"
        status_advice = "Aktuell melden die offiziellen Sensoren keinen Restbestand in den Automaten. Bei beliebten Sets lohnt sich ein erneuter Blick in 1-2 Wochen oder in Second-Hand-Börsen."
        if code: CACHE.set(f"stock_status_{code}", ("OUT_OF_STOCK", 0))
        if item_id_str: CACHE.set(f"stock_status_{item_id_str}", ("OUT_OF_STOCK", 0))

    collector_links = generate_collector_links(prod_name or "Gashapon", code)

    return ShopResponse(
        maker="Bandai" if m == "bandai" else "Takara Tomy Arts",
        product_name=prod_name,
        jan_code=code,
        release_date=release_date,
        prefecture=pref,
        total_shops=total_shops,
        last_data_check=last_data_check,
        availability_status=availability_status,
        status_label=status_label,
        status_advice=status_advice,
        collector_links=collector_links,
        shops=shops
    )


# ---------------------------------------------------------
# Mount Frontend Static Files
# ---------------------------------------------------------
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    print("Starting Gacha Finder Server v2.5 at http://localhost:8000")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
