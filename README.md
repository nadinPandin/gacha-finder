# 🇯🇵 GachaFinder Japan (ガチャファインダー) v2.5

Ein moderner **Gacha / Capsule Toy Finder** für Japan. Die Anwendung ermöglicht es, nach beliebten Gachapon-Artikeln von führenden Herstellern (**Bandai**, **Takara Tomy Arts**, **Kitan Club**) sowie Partnerplattformen (**Gacha-Island**, **GachaNavi**) zu suchen und deren **Lagerbestand und Verkaufsstellen in ganz Japan** in einer aufgeräumten Liste sowie auf einer **interaktiven Karte** anzuzeigen.

---

## 🌟 Neue Features in Version 2.5

- 🟢 **Verfügbarkeits-Status direkt in der Such-Übersicht:**
  - Jede Gacha-Karte zeigt sofort ihren Verfügbarkeits-Status an:
    - `🟢 Auf Lager` (Aktuell an Automaten / Verkaufsstellen)
    - `⏳ Vorankündigung` (Offiziell angekündigt, erscheint demnächst)
    - `🔴 Vergriffen` (Vorübergehend vergriffen)
    - `📦 Archiv / Vintage` (Älterer Jahrgang / Sammlerstück)
- ❤️ **Favoriten- und Merklisten-System (Watchlist):**
  - **Gachas merken:** Klicke bei jedem Gacha auf das Herz `❤️`, um es in deiner persönlichen Merkliste zu speichern.
  - **Suchbegriffe speichern:** Klicke neben der Suchleiste auf `⭐ Merken`, um Lieblings-Franchises mit einem Klick abzurufen.
  - Gespeichert im lokalen Browserspeicher (`localStorage`), bleibt auch nach dem Neuladen erhalten!
- 🗼 **Präfektur-Abfrage behoben (Tokyo zeigt alle 84+ Standorte):**
  - Bisher zeigte die Auswahl von Tokyo nur 2-3 Standorte, da nur die Stichprobe der landesweiten Abfrage gefiltert wurde.
  - **Neu:** Beim Auswählen einer Präfektur (z. B. Tokyo / `東京都`) wird der herstellerspezifische Präfektur-Endpunkt abgefragt. Bandai liefert so **alle 84 Standorte in Tokio** und Takara Tomy **32 Standorte**.
  - **Intelligenter Cache:** Bereits geladene Regionen werden im Speicher gehalten, sodass ein Wechsel zwischen *Ganz Japan* und *Tokyo* mit **0ms Latenz** erfolgt!
- 🧪 **Erweiterte mehrsprachige Anime- & Franchise-Übersetzungen:**
  - `Tagebücher der Apothekerin` / `Apothecary Diaries` ➔ `薬屋のひとりごと`
  - `Monster Hunter` / `Monhun` ➔ `モンスターハンター`
  - `Card Captor Sakura` / `Cardcaptor` ➔ `カードキャプターさくら`
  - `Detektiv Conan` / `Detektive Conan` ➔ `名探偵コナン`
  - `Chainsaw Man` / `Pochita` ➔ `チェンソーマン`
  - `One Piece` / `Luffy` ➔ `ワンピース`
  - `Kamera (Canon)` / `Camera` / `Canon` ➔ `カメラ` / `キヤノン`
  - `Madoka` / `Madoka Magica` ➔ `まどか`
  - `Chemischer Hamster` / `Hamster` ➔ `ハムスター` / `エビちゅ`
  - `Squishy` / `Squischi` ➔ `スクイーズ` / `ぷにぷに`
  - `Pokémon` / `Pokemon` ➔ `ポケモン`
- 🏝️ **Integration von Gacha-Island & GachaNavi:**
  - **Gacha-Island (`gacha-island.jp`):** Integrierter Live-Scraper und eigener Hersteller-Filter `🏝️ Gacha-Island` für herstellerübergreifende Kapsel-Artikel.
  - **GachaNavi (`gachanavi.com`):** Direkte Links zum monatlichen Release-Kalender für Sammler.
- 🗺️ **Interaktive Leaflet-Karte (Japan Nationwide als Standard):**
  - Automatisches Zentrieren auf ganz Japan mit maßgeschneiderten Kapsel-Pins und Google Maps-Navigation.

---

## 📁 Projektstruktur

```text
gacha-finder/
├── backend/
│   ├── app.py              # FastAPI-Server: Scraper, Proxy, Cache & Shop-Locator
│   ├── translations.py     # Übersetzungs-Modul mit automatischem Hot-Reload
│   ├── translations.json   # 🌟 Eigene Datei für Übersetzungen (Deutsch/Englisch -> Japanisch)
│   └── requirements.txt    # Python-Abhängigkeiten
├── frontend/
│   ├── index.html          # Web-App (Map as Default, Favoriten-Modal, Such-Merker, Filter)
│   ├── style.css           # Styling, Card-Badges, Favoriten-Drawer, Responsive Layout
│   └── app.js              # Client-Logik, localStorage-Favoriten, dynamischer Präfektur-Cache
├── requirements.txt        # Root-Abhängigkeiten
└── README.md               # Dokumentation & Startanleitung
```

---

## 📖 Übersetzungen erweitern (`backend/translations.json`)

Neue Anime-, Manga-, Gaming- oder Begriffsübersetzungen können jederzeit in der Datei [`backend/translations.json`](file:///Users/Nadin/Gachapon/gacha-finder/backend/translations.json) eingetragen werden. 

### Format:
```json
{
  "dein suchbegriff": "日本語の検索語",
  "frieren": "葬送のフリーレン",
  "naruto": "NARUTO -ナルト-"
}
```

* **⚡ Automatischer Hot-Reload:** Nach dem Speichern von `translations.json` übernimmt das Backend die neuen Begriffe **sofort live ohne Server-Neustart**!
* **Übersetzungsliste abrufen:** Über den Endpunkt `http://localhost:8000/api/translations` kann das aktuell geladene Wörterbuch inklusive Zähler eingesehen werden.

---

## 🚀 Schnellstart

### 1. Repository-Verzeichnis betreten
```bash
cd /Users/Nadin/Gachapon/gacha-finder
```

### 2. Virtuelle Umgebung aktivieren
```bash
source venv/bin/activate
```

### 3. Server starten
```bash
python backend/app.py
```
*(Oder mit uvicorn: `uvicorn backend.app:app --host 127.0.0.1 --port 8000 --reload`)*

### 4. Im Browser öffnen
👉 **[http://localhost:8000](http://localhost:8000)**

*(Swagger-API-Dokumentation: [http://localhost:8000/docs](http://localhost:8000/docs))*

---

## 🔍 Empfohlene Test-Eingaben

| Typ | Eingabe | Was passiert? |
|---|---|---|
| **Apothekerin** | `Tagebücher der Apothekerin` | Übersetzt zu `薬屋のひとりごと` – zeigt aktuelle Maomao & Jinshi Gachas! |
| **Monster Hunter** | `Monster Hunter` | Übersetzt zu `モンスターハンター` – Zubehör & Figuren. |
| **Sakura** | `Card Captor Sakura` | Übersetzt zu `カードキャプターさくら` – Anhänger & Charms. |
| **Kamera (Canon)** | `Kamera (Canon)` | Findet Miniatur-Kameras & Canon-Repliken. |
| **Hamster** | `Chemischer Hamster` | Findet Hamster-Figuren & Ebichu/Sukeroku. |
| **Squishy** | `Squischi` | Findet Knautsch- und Squishy-Kapseln (`スクイーズ`). |
| **Bandai Tokyo-Test** | `4570118183859` | Wähle Tokyo im Dropdown: **84 Standorte in Tokio**! |
| **Takara Tomy Tokyo** | `4904790904783` | Wähle Tokyo im Dropdown: **32 Standorte in Tokio**! |
| **Gacha-Island Filter** | Klick auf `🏝️ Gacha-Island` | Durchsucht herstellerübergreifend Gacha-Island-Artikel. |
| **Favoriten merken** | Klick auf `❤️` bei einer Karte | Speichert das Gacha in der Header-Favoritenliste. |
| **Suche merken** | Klick auf `⭐ Merken` | Speichert den aktuellen Suchbegriff. |

---

## 🛠️ Technologien
- **Backend:** Python 3, FastAPI, Uvicorn, HTTPX (Async Client), BeautifulSoup4, Pydantic, In-Memory TTL Cache.
- **Frontend:** HTML5, CSS3 (Modern Variables, Glassmorphism, CSS Grid), Vanilla JavaScript (ES6+).
- **Storage:** `localStorage` für Favoriten & Suchbegriffe.
- **Mapping:** Leaflet.js & OpenStreetMap (Japan-weite Übersicht, Capsule-Pins, Popups, Bounds fitting).
- **Navigation:** Deep-Links zu Google Maps mit formatierten Suchadressen.
