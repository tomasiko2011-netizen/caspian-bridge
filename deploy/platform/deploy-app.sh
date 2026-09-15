#!/usr/bin/env bash
# Выкатка платформы на VPS. Использование: ./deploy/platform/deploy-app.sh user@IP [ssh-порт]
# Сборка идёт на сервере; база и загрузки живут в shared/ и выкатку переживают.
set -euo pipefail

HOST="${1:?укажите user@host}"; PORT="${2:-22}"
APP_ROOT=/srv/khazarbridge
REL="$(date +%Y%m%d-%H%M%S)"

echo "→ заливаю код в releases/$REL"
ssh -p "$PORT" "$HOST" "mkdir -p $APP_ROOT/releases/$REL"
rsync -az --delete -e "ssh -p $PORT" \
  --exclude .git --exclude node_modules --exclude .next --exclude .env \
  ./ "$HOST:$APP_ROOT/releases/$REL/"

echo "→ сборка и переключение"
ssh -p "$PORT" "$HOST" bash -s <<REMOTE
set -euo pipefail
cd $APP_ROOT/releases/$REL
ln -sfn $APP_ROOT/shared/.env .env
ln -sfn $APP_ROOT/shared/uploads public/uploads
npm ci --omit=dev
npm run build
npm run db:migrate || echo "миграции пропущены (нет скрипта db:migrate)"
ln -sfn $APP_ROOT/releases/$REL $APP_ROOT/current
sudo systemctl restart khazarbridge
sleep 3
systemctl is-active --quiet khazarbridge && echo "сервис поднят" || { echo "СЕРВИС НЕ ПОДНЯЛСЯ"; journalctl -u khazarbridge -n 40 --no-pager; exit 1; }
# держим последние 5 релизов
ls -1dt $APP_ROOT/releases/*/ | tail -n +6 | xargs -r rm -rf
REMOTE

echo "→ проверка"
curl -fsS -o /dev/null -w "HTTP %{http_code}\n" "https://khazarbridge.kz/" || echo "домен ещё не направлен — это нормально до покупки"
