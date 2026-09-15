#!/usr/bin/env bash
# Выкатка статики на VPS (hoster.kz / любой Linux с nginx).
# Использование: ./deploy/deploy.sh user@IP [ssh-порт]
# Один раз на сервере: apt install nginx certbot python3-certbot-nginx; mkdir -p /var/www/khazarbridge;
#   cp deploy/nginx-khazarbridge.conf /etc/nginx/sites-available/khazarbridge && ln -s ../sites-available/khazarbridge /etc/nginx/sites-enabled/
set -euo pipefail
HOST="${1:?укажите user@host}"; PORT="${2:-22}"
cd "$(dirname "$0")/.."
rsync -az --delete -e "ssh -p $PORT" --exclude-from=deploy/rsync-exclude.txt ./ "$HOST:/var/www/khazarbridge/"
echo "OK → http://$HOST (проверьте nginx -t && systemctl reload nginx при первом деплое)"
