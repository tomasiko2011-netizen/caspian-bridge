# Khazar Bridge · پل خزر

Демо B2B-маркетплейса для торговли Иран ↔ Казахстан: 46 позиций (29 Иран → КЗ, 17 КЗ → Иран), ориентировочные экспортные цены, расчёт партии с фрахтом через Каспий, заявки на котировку, логистика коридора.

**Live (Vercel):** https://khazarbridge.vercel.app
**Live (GitHub Pages):** https://tomasiko2011-netizen.github.io/khazarbridge/

## Структура
- `index.html` — разметка; `styles.css` — дизайн-токены и стили (светлая/тёмная тема)
- `app.js` — логика: RU/EN, USD/KZT/IRR, фильтры, карточка товара, калькулятор партии, RFQ, разделы «Заявки», «Логистика», «О платформе»
- `data.js` — каталог, цены, курсы, ставки фрахта; `credits.js` — лицензии фото
- `img/` — 46 фото 900×675 (Wikimedia Commons / Openverse, лицензии в `credits.json`)
- `screens/` — скриншоты для презентации

## Настройка
- `CONFIG.whatsapp` в начале `app.js` — номер для кнопки «В WhatsApp» в заявках (пусто → кнопка скрыта)
- Цены и курсы — `data.js` (`fx`, `freight`, `products`)

## Деплой
Статика без сборки. GitHub Pages собирается с ветки `codex/test`.
Vercel (scope boss-projects, проект `khazarbridge`): `vercel --prod --yes` в папке проекта.
