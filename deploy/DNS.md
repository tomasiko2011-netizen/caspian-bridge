# DNS для khazarbridge.kz и khazarbridge.com

> **Решение 15.09.2026:** хостинг — VPS на hoster.kz (вариант B ниже), платформа, а не статика. Файлы выкатки — `deploy/platform/`.
>
> **⚠️ Cloudflare-прокси не включать.** Cloudflare ограничивает обслуживание Ирана: оранжевое облако может отрезать иранских посетителей, ради которых мы и уходим с Vercel. Только DNS-only, A-записи прямо на IP сервера.


Основной хостинг в Казахстане (доступен из Ирана и КЗ без VPN). Vercel оставляем зеркалом на khazarbridge.vercel.app.

## Вариант A — Plesk на ps.kz (загрузка архива dist/khazarbridge-site-*.zip в httpdocs)
| Домен | Тип | Имя | Значение |
|---|---|---|---|
| khazarbridge.kz | A | @ | IP сервера Plesk (см. панель ps.kz → «Веб-сайты и домены») |
| khazarbridge.kz | CNAME | www | khazarbridge.kz |
| khazarbridge.com | A | @ | тот же IP |
| khazarbridge.com | CNAME | www | khazarbridge.com |
В Plesk: добавить оба домена на один httpdocs (второй как alias), включить Let's Encrypt для всех четырёх имён.

## Вариант B — VPS hoster.kz (nginx, deploy/deploy.sh)
Те же записи, IP = адрес VPS. HTTPS: `certbot --nginx -d khazarbridge.kz -d www.khazarbridge.kz -d khazarbridge.com -d www.khazarbridge.com`.

## Если домен нужно направить на Vercel (только для международной аудитории, из Ирана не откроется)
| Тип | Имя | Значение |
|---|---|---|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |
Затем `vercel domains add khazarbridge.com` в папке проекта.
