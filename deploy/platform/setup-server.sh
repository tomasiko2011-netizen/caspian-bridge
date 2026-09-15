#!/usr/bin/env bash
# Первичная настройка VPS hoster.kz под платформу Khazar Bridge. Запускать на сервере под root.
# Проверено на Ubuntu 22.04/24.04. Идемпотентен: повторный запуск безопасен.
set -euo pipefail

APP_USER=khazar
APP_ROOT=/srv/khazarbridge
SSH_PORT="${SSH_PORT:-22}"

echo "→ пакеты"
apt-get update -y
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw fail2ban sqlite3 rsync unzip

echo "→ Node.js 22"
if ! command -v node >/dev/null || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "→ пользователь и каталоги"
id -u "$APP_USER" >/dev/null 2>&1 || useradd -r -m -d "$APP_ROOT" -s /bin/bash "$APP_USER"
mkdir -p "$APP_ROOT"/{releases,shared/{db,uploads,backups},current}
chown -R "$APP_USER:$APP_USER" "$APP_ROOT"

echo "→ swap (нужен для сборки Next.js на 4 ГБ)"
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "→ firewall"
ufw allow "$SSH_PORT"/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban

echo "→ nginx"
install -m 644 /tmp/nginx-khazarbridge.conf /etc/nginx/sites-available/khazarbridge 2>/dev/null || true
ln -sfn ../sites-available/khazarbridge /etc/nginx/sites-enabled/khazarbridge
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo
echo "Готово. Дальше:"
echo "  1) положить .env в $APP_ROOT/shared/.env (chown $APP_USER, chmod 600)"
echo "  2) выкатить код:  ./deploy/platform/deploy-app.sh user@IP"
echo "  3) сертификат:    certbot --nginx -d khazarbridge.kz -d www.khazarbridge.kz -d khazarbridge.com -d www.khazarbridge.com"
echo "  4) бэкапы:        crontab -e →  30 3 * * * $APP_ROOT/backup.sh"
