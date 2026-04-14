#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════
#  Discovery Radio — Raspberry Pi Installer
#  Run this directly on the Pi:
#    bash install-pi.sh
# ═══════════════════════════════════════════════════════
set -e

REPO="https://github.com/ravijankar/discovery-radio.git"
INSTALL_DIR="/var/www/discovery-radio"
DOMAIN="raspberrypi.local"

echo ""
echo "═══════════════════════════════════════════════"
echo "  DISCOVERY RADIO — PI INSTALL"
echo "═══════════════════════════════════════════════"

# ── 1. Detect web server ────────────────────────────
WEB_SERVER=""
if systemctl is-active --quiet nginx 2>/dev/null; then
  WEB_SERVER="nginx"
elif systemctl is-active --quiet apache2 2>/dev/null; then
  WEB_SERVER="apache2"
elif systemctl is-active --quiet caddy 2>/dev/null; then
  WEB_SERVER="caddy"
elif systemctl is-active --quiet lighttpd 2>/dev/null; then
  WEB_SERVER="lighttpd"
fi

if [ -z "$WEB_SERVER" ]; then
  echo "ERROR: No recognised web server found (nginx/apache2/caddy/lighttpd)."
  echo "Install one first, e.g.:  sudo apt install nginx"
  exit 1
fi

echo "  Web server : $WEB_SERVER"
echo "  Install dir: $INSTALL_DIR"
echo "  Host       : $DOMAIN"
echo ""

# ── 2. Clone or update repo ─────────────────────────
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "→ Updating existing clone..."
  git -C "$INSTALL_DIR" pull --ff-only
else
  echo "→ Cloning repository..."
  sudo git clone "$REPO" "$INSTALL_DIR"
fi

sudo chown -R www-data:www-data "$INSTALL_DIR" 2>/dev/null || true

# ── 3. Configure web server ─────────────────────────

configure_nginx() {
  CONF="/etc/nginx/sites-available/discovery-radio"
  echo "→ Writing nginx config: $CONF"
  sudo tee "$CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN discovery-radio.local _;

    root $INSTALL_DIR;
    index index.html;

    # Cache static assets
    location ~* \.(js|css|svg|png|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Service worker must not be cached
    location = /sw.js {
        expires off;
        add_header Cache-Control "no-store";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
  sudo ln -sf "$CONF" /etc/nginx/sites-enabled/discovery-radio
  # Remove default site if it's squatting on port 80
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t && sudo systemctl reload nginx
}

configure_apache2() {
  CONF="/etc/apache2/sites-available/discovery-radio.conf"
  echo "→ Writing apache2 config: $CONF"
  sudo tee "$CONF" > /dev/null <<EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    DocumentRoot $INSTALL_DIR

    <Directory $INSTALL_DIR>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>

    # No caching for service worker
    <Files "sw.js">
        Header set Cache-Control "no-store"
    </Files>
</VirtualHost>
EOF
  sudo a2ensite discovery-radio
  sudo a2enmod headers
  sudo systemctl reload apache2
}

configure_caddy() {
  CONF="/etc/caddy/sites/discovery-radio"
  sudo mkdir -p /etc/caddy/sites
  echo "→ Writing Caddy config: $CONF"
  sudo tee "$CONF" > /dev/null <<EOF
$DOMAIN {
    root * $INSTALL_DIR
    file_server
    try_files {path} /index.html
}
EOF
  sudo systemctl reload caddy
}

configure_lighttpd() {
  CONF="/etc/lighttpd/conf-available/99-discovery-radio.conf"
  echo "→ Writing lighttpd config: $CONF"
  sudo tee "$CONF" > /dev/null <<EOF
server.document-root = "$INSTALL_DIR"
EOF
  sudo ln -sf "$CONF" /etc/lighttpd/conf-enabled/99-discovery-radio.conf
  sudo service lighttpd restart
}

case "$WEB_SERVER" in
  nginx)    configure_nginx   ;;
  apache2)  configure_apache2 ;;
  caddy)    configure_caddy   ;;
  lighttpd) configure_lighttpd ;;
esac

# ── 4. Done ─────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "  INSTALLATION COMPLETE"
echo "  Open: http://$DOMAIN/discovery-radio"
echo "         or http://$(hostname -I | awk '{print $1}')"
echo "═══════════════════════════════════════════════"
echo ""
echo "To update later, run:"
echo "  sudo git -C $INSTALL_DIR pull"
echo "  sudo systemctl reload $WEB_SERVER"
echo ""
