#!/usr/bin/env bash
# Бэкап базы и загрузок. На сервере: crontab → 30 3 * * * /srv/khazarbridge/backup.sh
# Урок 185.98: провайдер может переустановить сервер без предупреждения, свежего дампа не окажется.
# Поэтому копия обязана уезжать за пределы этого VPS (REMOTE_TARGET).
set -euo pipefail

APP_ROOT=/srv/khazarbridge
STAMP="$(date +%Y-%m-%d-%H%M)"
OUT="$APP_ROOT/shared/backups"
KEEP_DAYS=14
REMOTE_TARGET="${REMOTE_TARGET:-}"   # напр. user@backup-host:/path/khazar-backups/ — задать в crontab, в репозитории не хранить

mkdir -p "$OUT"

# База (SQLite/libSQL): .backup делает согласованную копию на живой базе, в отличие от cp
if [[ -f "$APP_ROOT/shared/db/khazar.db" ]]; then
  sqlite3 "$APP_ROOT/shared/db/khazar.db" ".backup '$OUT/db-$STAMP.db'"
  gzip -f "$OUT/db-$STAMP.db"
fi

# Загрузки: фото товаров, сканы документов
tar -czf "$OUT/uploads-$STAMP.tar.gz" -C "$APP_ROOT/shared" uploads

# Ротация
find "$OUT" -type f -mtime +$KEEP_DAYS -delete

# Копия наружу — иначе бэкап умрёт вместе с сервером
if [[ -n "$REMOTE_TARGET" ]]; then
  rsync -az "$OUT/" "$REMOTE_TARGET" || echo "ВНИМАНИЕ: внешняя копия не ушла"
fi

echo "бэкап $STAMP готов"
