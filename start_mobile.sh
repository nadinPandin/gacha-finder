#!/usr/bin/env bash
# ====================================================================
# GachaFinder Japan - Mobile On-The-Go Launcher (Zero-Config / No Sign-up)
# ====================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🇯🇵 Starte GachaFinder Japan für Mobile & Unterwegs..."

# 1. Start Python Backend if not running
if ! lsof -i :8000 > /dev/null 2>&1; then
    echo "⚙️ Starte lokales Python-Backend auf Port 8000..."
    ./venv/bin/python3 -m uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload > /dev/null 2>&1 &
    sleep 2
else
    echo "✅ Python-Backend läuft bereits auf Port 8000."
fi

# 2. Check cloudflared binary
CLOUDFLARED="$DIR/bin/cloudflared"
if [ ! -f "$CLOUDFLARED" ]; then
    echo "📥 Lade Cloudflare Tunnel Binary herunter..."
    mkdir -p "$DIR/bin"
    curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz -o "$DIR/bin/cloudflared.tgz"
    tar -xzf "$DIR/bin/cloudflared.tgz" -C "$DIR/bin"
    rm -f "$DIR/bin/cloudflared.tgz"
    chmod +x "$CLOUDFLARED"
fi

echo "🚀 Erzeuge sicheren HTTPS-Tunnel (Ohne Anmeldung / Kostenlos)..."
echo "Kopiere einfach den angezeigten 'https://xxxx.trycloudflare.com'-Link auf dein Handy!"
echo ""
exec "$CLOUDFLARED" tunnel --url http://127.0.0.1:8000
