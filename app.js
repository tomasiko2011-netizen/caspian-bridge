/* Khazar Bridge — demo marketplace app (vanilla JS, no build step) */
(function () {
  'use strict';

  /* ── config ─────────────────────────────────────────────────── */
  const CONFIG = {
    whatsapp: '',            // номер для приёма заявок, формат 77XXXXXXXXX (пусто — кнопка скрыта)
    brand: 'Khazar Bridge'
  };

  const D = window.CB_DATA;
  const P = D.products;
  const CREDITS = window.CB_CREDITS || {};
  const TOP_ORDER = ['saffron', 'pistachios', 'dates', 'ceramic-tile', 'bitumen', 'wheat', 'flour', 'sunflower-oil', 'copper', 'ferroalloys'];
  const STATUSES = ['new', 'quote', 'contract', 'shipping'];

  const LS = {
    get(k, d) { try { const v = localStorage.getItem('cb:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cb:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  const state = {
    lang: LS.get('lang', 'ru'),
    cur: LS.get('cur', 'USD'),
    view: 'catalog',
    dir: 'all', cat: 'all', top: false, q: '', sort: 'default',
    open: null,
    calc: { qty: 0, mode: 'sea' },
    rfqs: LS.get('rfqs', null)
  };
  if (!Array.isArray(state.rfqs)) state.rfqs = seedRfqs();

  /* ── i18n ───────────────────────────────────────────────────── */
  const T = {
    ru: {
      nav_catalog: 'Каталог', nav_rfq: 'Заявки', nav_logistics: 'Логистика', nav_about: 'О платформе',
      tick_kzt: 'USD/KZT', tick_irr_o: 'USD/IRR офиц.', tick_irr_m: 'USD/IRR рынок', tick_sea: 'Актау → Энзели', tick_40: '40ft', tick_truck: 'Алматы → Тегеран', tick_asof: 'ориентир на',
      eyebrow: 'B2B-маркетплейс · Каспийский коридор',
      h1_a: 'Прямые поставки между ', h1_ir: 'Ираном', h1_and: ' и ', h1_kz: 'Казахстаном', h1_b: ' — без посредников.',
      lede: 'Проверенные экспортёры, ориентировочные цены по базису поставки, расчёт партии с фрахтом и запрос котировки в один шаг. Всё, что нужно импортёру, чтобы начать сделку через Каспий.',
      tile_ir: 'Иран → Казахстан', tile_kz: 'Казахстан → Иран', positions: 'позиций',
      tile_ir_sub: 'Фрукты, орехи, специи, ковры, плитка, битум, полимеры, текстиль',
      tile_kz_sub: 'Пшеница, мука, масло, мясо халяль, медь, ферросплавы, уголь, удобрения',
      top10: 'Топ-10 по марже', top10_sub: 'самые прибыльные позиции коридора',
      f_search: 'Поиск по названию, коду ТН ВЭД…', f_dir: 'Направление', f_all: 'Все направления', f_cat: 'Категория', f_allcat: 'Все категории',
      f_top: 'Только топ-10', f_sort: 'Сортировка', s_default: 'По списку', s_price_asc: 'Цена ↑', s_price_desc: 'Цена ↓', s_name: 'По названию',
      grid_title: 'Каталог', found: 'позиций', empty: 'Ничего не найдено. Измените фильтры или запрос.',
      moq: 'MOQ', on_request: 'по запросу', ask: 'Запросить цену', close: 'Закрыть',
      d_spec: 'Спецификация', d_moq: 'Мин. партия', d_inc: 'Базис поставки', d_hs: 'Код ТН ВЭД', d_origin: 'Происхождение', d_lead: 'Срок отгрузки', d_sup: 'Поставщиков в базе', days: 'дн.',
      d_price_note: 'ориентировочная цена, ', d_price_note2: 'уточняется котировкой',
      calc: 'Расчёт партии', qty: 'Количество', mode: 'Доставка',
      m_sea: 'Море: Актау / Курык → Бендер-Энзели', m_rail: 'Ж/д: Болашак → Инче-Бурун', m_truck: 'Авто: Алматы → Тегеран',
      c_goods: 'Товар', c_freight: 'Фрахт (ориентир)', c_total: 'Итого', c_transit: 'транзит', c_note: 'Без пошлин, НДС и страхования. Минимальная ставка за отправку учтена; для контейнерных партий принят 1 × 40ft.', c_container: '1 × 40ft',
      rfq: 'Запросить котировку', f_company: 'Компания', f_country: 'Страна', f_contact: 'Телефон / WhatsApp / e-mail', f_comment: 'Комментарий', f_comment_ph: 'Упаковка, сроки, порт назначения, документы…',
      c_kz: 'Казахстан', c_ir: 'Иран', c_other: 'Другая', send: 'Отправить запрос', sent: 'Запрос сохранён в разделе «Заявки»',
      req_title: 'Заявки на котировку', req_lede: 'Запросы покупателей с этапами сделки. Примеры отмечены — их можно удалить. Новые заявки из каталога появляются здесь.',
      req_empty: 'Заявок пока нет. Откройте товар в каталоге и нажмите «Запросить котировку».',
      st_new: 'Новая', st_quote: 'Котировка', st_contract: 'Контракт', st_shipping: 'Отгрузка', example: 'пример',
      next_step: 'Следующий этап', copy: 'Скопировать текст', copied: 'Текст скопирован', wa: 'В WhatsApp', del: 'Удалить', reset_examples: 'Восстановить примеры',
      req_text_title: 'Запрос котировки', req_product: 'Товар', req_qty: 'Количество', req_basis: 'Базис', req_company: 'Компания', req_contact: 'Контакт', req_comment: 'Комментарий', req_est: 'Ориентир по каталогу',
      lg_title: 'Логистика Каспийского коридора', lg_lede: 'Три рабочих маршрута между Казахстаном и Ираном: море через Каспий, железная дорога через Туркменистан и автодоставка. Сроки и ставки — ориентир для расчёта партии.',
      lg_map: 'Схема маршрутов', lg_routes: 'Маршруты и ставки', lg_mode: 'Вид', lg_corridor: 'Коридор', lg_transit: 'Транзит', lg_rate: 'Ставка', lg_for: 'Подходит для',
      lg_sea_for: 'зерно, мука, битум, стройматериалы, металлы — навал и контейнеры', lg_rail_for: 'вагонные партии: зерно, ферросплавы, уголь, удобрения', lg_truck_for: 'свежие фрукты, сухофрукты, ковры, срочные партии до 20 т',
      lg_inc: 'Базисы поставки (Incoterms 2020)', lg_docs: 'Документы для сделки', lg_docs_ir: 'Экспорт из Ирана', lg_docs_kz: 'Экспорт из Казахстана',
      lg_pay: 'Расчёты', lg_pay_text: 'Платежи между странами проходят в национальных валютах (тенге / риал) через уполномоченные банки, по аккредитиву или с частичной предоплатой. Платформа не проводит платежи: она фиксирует условия сделки и подключает партнёров по расчётам и таможенному оформлению.',
      ab_title: 'О платформе', ab_lede: 'Khazar Bridge — B2B-маркетплейс для торговли между Ираном и Казахстаном. Каталог из 46 позиций собран по реальному списку экспортно-импортных товаров коридора: 29 позиций из Ирана и 17 из Казахстана.',
      ab_how: 'Как проходит сделка', ab_for: 'Для кого', ab_buyers: 'Импортёрам', ab_sellers: 'Экспортёрам', ab_model: 'Модель платформы', ab_road: 'Дорожная карта', ab_src: 'Источники цен и фото',
      ab_buyers_t: 'Сравнение цен по базису, спецификации и MOQ, запрос котировки нескольким поставщикам сразу, расчёт полной стоимости партии с фрахтом.',
      ab_sellers_t: 'Витрина с проверенным статусом, входящие запросы из соседней страны, поддержка по документам, сертификации и логистике.',
      ab_disclaimer: 'Демонстрационная версия. Цены — ориентировочные экспортные уровни на сентябрь 2026 г. по открытым прайс-листам и отраслевым обзорам; поставщики и заявки-примеры — условные.',
      footer_l: 'Демо-версия маркетплейса · цены ориентировочные', footer_r: 'Разработка: Truest Digital'
    },
    en: {
      nav_catalog: 'Catalogue', nav_rfq: 'Requests', nav_logistics: 'Logistics', nav_about: 'About',
      tick_kzt: 'USD/KZT', tick_irr_o: 'USD/IRR official', tick_irr_m: 'USD/IRR market', tick_sea: 'Aktau → Anzali', tick_40: '40ft', tick_truck: 'Almaty → Tehran', tick_asof: 'indicative as of',
      eyebrow: 'B2B marketplace · Caspian corridor',
      h1_a: 'Direct trade between ', h1_ir: 'Iran', h1_and: ' and ', h1_kz: 'Kazakhstan', h1_b: ' — no middlemen.',
      lede: 'Verified exporters, indicative prices on delivery basis, lot calculator with freight and a one-step request for quotation. Everything an importer needs to start a deal across the Caspian.',
      tile_ir: 'Iran → Kazakhstan', tile_kz: 'Kazakhstan → Iran', positions: 'products',
      tile_ir_sub: 'Fruit, nuts, spices, carpets, tile, bitumen, polymers, textile',
      tile_kz_sub: 'Wheat, flour, oil, halal meat, copper, ferroalloys, coal, fertilizers',
      top10: 'Top-10 by margin', top10_sub: 'most profitable lines of the corridor',
      f_search: 'Search by name or HS code…', f_dir: 'Direction', f_all: 'All directions', f_cat: 'Category', f_allcat: 'All categories',
      f_top: 'Top-10 only', f_sort: 'Sort', s_default: 'Listed order', s_price_asc: 'Price ↑', s_price_desc: 'Price ↓', s_name: 'By name',
      grid_title: 'Catalogue', found: 'products', empty: 'Nothing found. Change the filters or the query.',
      moq: 'MOQ', on_request: 'on request', ask: 'Request a quote', close: 'Close',
      d_spec: 'Specification', d_moq: 'Min. order', d_inc: 'Delivery basis', d_hs: 'HS code', d_origin: 'Origin', d_lead: 'Lead time', d_sup: 'Suppliers listed', days: 'days',
      d_price_note: 'indicative price, ', d_price_note2: 'confirmed by quotation',
      calc: 'Lot calculator', qty: 'Quantity', mode: 'Transport',
      m_sea: 'Sea: Aktau / Kuryk → Bandar Anzali', m_rail: 'Rail: Bolashak → Incheh Borun', m_truck: 'Truck: Almaty → Tehran',
      c_goods: 'Goods', c_freight: 'Freight (indicative)', c_total: 'Total', c_transit: 'transit', c_note: 'Excludes duties, VAT and insurance. Minimum shipment charge applied; container lots assume 1 × 40ft.', c_container: '1 × 40ft',
      rfq: 'Request a quotation', f_company: 'Company', f_country: 'Country', f_contact: 'Phone / WhatsApp / e-mail', f_comment: 'Comment', f_comment_ph: 'Packaging, timing, destination port, documents…',
      c_kz: 'Kazakhstan', c_ir: 'Iran', c_other: 'Other', send: 'Send request', sent: 'Request saved under “Requests”',
      req_title: 'Requests for quotation', req_lede: 'Buyer requests with deal stages. Examples are marked and can be deleted. New requests from the catalogue appear here.',
      req_empty: 'No requests yet. Open a product in the catalogue and press “Request a quotation”.',
      st_new: 'New', st_quote: 'Quoted', st_contract: 'Contract', st_shipping: 'Shipping', example: 'example',
      next_step: 'Next stage', copy: 'Copy text', copied: 'Text copied', wa: 'WhatsApp', del: 'Delete', reset_examples: 'Restore examples',
      req_text_title: 'Request for quotation', req_product: 'Product', req_qty: 'Quantity', req_basis: 'Basis', req_company: 'Company', req_contact: 'Contact', req_comment: 'Comment', req_est: 'Catalogue estimate',
      lg_title: 'Caspian corridor logistics', lg_lede: 'Three working routes between Kazakhstan and Iran: sea across the Caspian, rail via Turkmenistan and road haulage. Transit times and rates are indicative for lot costing.',
      lg_map: 'Route map', lg_routes: 'Routes and rates', lg_mode: 'Mode', lg_corridor: 'Corridor', lg_transit: 'Transit', lg_rate: 'Rate', lg_for: 'Best for',
      lg_sea_for: 'grain, flour, bitumen, building materials, metals — bulk and containers', lg_rail_for: 'wagon lots: grain, ferroalloys, coal, fertilizers', lg_truck_for: 'fresh fruit, dried fruit, carpets, urgent lots up to 20 t',
      lg_inc: 'Delivery terms (Incoterms 2020)', lg_docs: 'Deal documents', lg_docs_ir: 'Export from Iran', lg_docs_kz: 'Export from Kazakhstan',
      lg_pay: 'Payments', lg_pay_text: 'Cross-border payments run in national currencies (tenge / rial) through authorised banks, by letter of credit or with partial prepayment. The platform does not process payments: it records deal terms and connects settlement and customs partners.',
      ab_title: 'About the platform', ab_lede: 'Khazar Bridge is a B2B marketplace for trade between Iran and Kazakhstan. The 46-product catalogue follows the corridor’s actual export–import list: 29 lines from Iran and 17 from Kazakhstan.',
      ab_how: 'How a deal runs', ab_for: 'Who it is for', ab_buyers: 'Importers', ab_sellers: 'Exporters', ab_model: 'Platform model', ab_road: 'Roadmap', ab_src: 'Price and photo sources',
      ab_buyers_t: 'Compare prices by basis, specification and MOQ, request quotes from several suppliers at once, cost a full lot with freight.',
      ab_sellers_t: 'A storefront with verified status, inbound requests from the neighbouring market, support on documents, certification and logistics.',
      ab_disclaimer: 'Demo version. Prices are indicative export levels for September 2026 from public price lists and industry reviews; suppliers and example requests are illustrative.',
      footer_l: 'Marketplace demo · prices are indicative', footer_r: 'Built by Truest Digital'
    }
  };
  const t = (k) => (T[state.lang] && T[state.lang][k]) || T.ru[k] || k;
  const L = (o) => (o && (o[state.lang] || o.ru)) || '';
  const locale = () => (state.lang === 'ru' ? 'ru-RU' : 'en-US');

  /* ── formatting ─────────────────────────────────────────────── */
  function fmtNum(n, maxFrac) {
    if (maxFrac === undefined) maxFrac = n < 10 ? 2 : (n < 100 ? 1 : 0);
    return new Intl.NumberFormat(locale(), { maximumFractionDigits: maxFrac }).format(n);
  }
  function fmtMoney(usd, cur) {
    cur = cur || state.cur;
    if (usd == null) return t('on_request');
    if (cur === 'USD') return state.lang === 'ru' ? fmtNum(usd) + ' $' : '$' + fmtNum(usd);
    if (cur === 'KZT') return fmtNum(usd * D.fx.usdKzt, 0) + ' ₸';
    const irr = usd * D.fx.usdIrrMarket;
    if (irr >= 1e9) return fmtNum(irr / 1e9, 2) + (state.lang === 'ru' ? ' млрд ﷼' : ' bn IRR');
    if (irr >= 1e6) return fmtNum(irr / 1e6, 1) + (state.lang === 'ru' ? ' млн ﷼' : ' M IRR');
    return fmtNum(irr, 0) + ' ﷼';
  }
  const unitLabel = (u) => L(D.units[u]);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const byId = (id) => P.find((p) => p.id === id);
  const dirLabel = (d) => (d === 'ir' ? t('tile_ir') : t('tile_kz'));

  function defaultQty(p) {
    if (p.id === 'saffron') return 25;
    if (p.id === 'wheat' || p.id === 'barley' || p.id === 'flour') return 68;
    if (p.id === 'cement') return 500;
    if (p.id === 'carpets') return 50;
    switch (p.unit) {
      case 't': return 20; case 'kg': return 20000; case 'm2': return 1000; case 'm': return 3000; default: return 1000;
    }
  }
  function calcLot(p, qty, mode) {
    const fr = D.freight[mode];
    const goods = p.price == null ? null : p.price * qty;
    const tonnes = D.units[p.unit].tonnes ? qty * D.units[p.unit].tonnes : null;
    const freight = tonnes != null ? Math.max(tonnes * fr.perTonne, fr.minCharge || 0) : fr.per40ft;
    return { goods, freight, total: goods == null ? null : goods + freight, days: fr.days, byContainer: tonnes == null };
  }

  /* ── seed example requests ──────────────────────────────────── */
  function seedRfqs() {
    const d = (n) => { const x = new Date('2026-09-13T10:00:00'); x.setDate(x.getDate() - n); return x.toISOString(); };
    return [
      { id: 'RQ-1041', pid: 'wheat', qty: 2000, mode: 'sea', company: { ru: 'Импортёр зерна, Тегеран', en: 'Grain importer, Tehran' }, country: 'ir', contact: '+98 ··· ·· ·· (demo)', comment: { ru: 'Порт назначения Амирабад, отгрузка октябрь', en: 'Destination Amirabad, October shipment' }, status: 'quote', example: true, created: d(6) },
      { id: 'RQ-1044', pid: 'saffron', qty: 25, mode: 'truck', company: { ru: 'Дистрибьютор специй, Алматы', en: 'Spice distributor, Almaty' }, country: 'kz', contact: '+7 ··· ··· ·· ·· (demo)', comment: { ru: 'Негин, ISO 3632 кат. 1, фасовка 1 кг, авиа', en: 'Negin, ISO 3632 cat. 1, 1 kg packs, by air' }, status: 'new', example: true, created: d(2) },
      { id: 'RQ-1038', pid: 'bitumen', qty: 500, mode: 'sea', company: { ru: 'Дорожно-строительная компания, Астана', en: 'Road construction company, Astana' }, country: 'kz', contact: '+7 ··· ··· ·· ·· (demo)', comment: { ru: 'Биг-бэги, поставка до 30.09, CPT Актау', en: 'Jumbo bags, delivery by 30 Sep, CPT Aktau' }, status: 'contract', example: true, created: d(11) }
    ];
  }

  /* ── render: header & ticker ────────────────────────────────── */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function renderHeader() {
    const views = ['catalog', 'rfq', 'logistics', 'about'];
    $('#nav').innerHTML = views.map((v) => {
      const cnt = v === 'rfq' && state.rfqs.length ? '<span class="cnt">' + state.rfqs.length + '</span>' : '';
      return '<button class="nav-btn" data-action="view" data-view="' + v + '"' + (state.view === v ? ' aria-current="page"' : '') + '>' + t('nav_' + v) + cnt + '</button>';
    }).join('');
    $$('#lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang)));
    $$('#cur button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cur === state.cur)));
    document.documentElement.lang = state.lang;
  }
  function renderTicker() {
    const f = D.freight, fx = D.fx;
    const tick = (k, v, u) => '<span class="tick"><span class="k">' + k + '</span><span class="v">' + v + '</span>' + (u ? '<span class="u">' + u + '</span>' : '') + '</span>';
    $('#ticker').innerHTML =
      tick(t('tick_kzt'), fmtNum(fx.usdKzt, 0)) +
      tick(t('tick_irr_o'), fmtNum(fx.usdIrrOfficial, 0)) +
      tick(t('tick_irr_m'), fmtNum(fx.usdIrrMarket, 0)) +
      tick(t('tick_sea'), fmtNum(f.sea.perTonne, 0) + ' $', state.lang === 'ru' ? '/т' : '/t') +
      tick(t('tick_40'), fmtNum(f.sea.per40ft, 0) + ' $') +
      tick(t('tick_truck'), fmtNum(f.truck.perTonne, 0) + ' $', state.lang === 'ru' ? '/т' : '/t') +
      '<span class="tick asof">' + t('tick_asof') + ' ' + new Date(D.asOf).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }) + '</span>';
  }

  /* ── render: hero ───────────────────────────────────────────── */
  function renderHero() {
    const nIr = P.filter((p) => p.dir === 'ir').length, nKz = P.filter((p) => p.dir === 'kz').length;
    $('#hero').innerHTML =
      '<div>' +
        '<div class="eyebrow">' + t('eyebrow') + '</div>' +
        '<h1>' + t('h1_a') + '<span class="ir">' + t('h1_ir') + '</span>' + t('h1_and') + '<span class="kz">' + t('h1_kz') + '</span>' + t('h1_b') + '</h1>' +
        '<p class="lede">' + t('lede') + '</p>' +
        '<div class="tiles">' +
          tile('ir', nIr) + tile('kz', nKz) +
        '</div>' +
      '</div>' +
      '<aside class="top10" aria-labelledby="top10-h">' +
        '<div class="top10-head"><h2 id="top10-h">' + t('top10') + '</h2><span class="small muted">' + t('top10_sub') + '</span></div>' +
        '<ol>' + TOP_ORDER.map((id, i) => {
          const p = byId(id);
          return '<li><button data-action="open" data-id="' + p.id + '">' +
            '<span class="rank">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<img class="th" src="img/' + p.id + '.jpg" alt="" loading="lazy" width="46" height="34">' +
            '<span><span class="nm">' + esc(L(p.name)) + '</span><span class="og"><span class="dot ' + p.dir + '"></span>' + esc(L(p.origin)) + '</span></span>' +
            '<span class="pr">' + fmtMoney(p.price) + '<small>' + (state.lang === 'ru' ? 'за ' : 'per ') + unitLabel(p.unit) + ' · ' + esc(p.inc.split(' /')[0]) + '</small></span>' +
          '</button></li>';
        }).join('') + '</ol>' +
      '</aside>';
    function tile(dir, n) {
      return '<button class="tile ' + dir + '" data-action="dir" data-dir="' + dir + '" aria-pressed="' + (state.dir === dir) + '">' +
        '<span class="route"><span class="dot ' + dir + '"></span>' + t('tile_' + dir) + '</span>' +
        '<span class="big">' + n + '<small>' + t('positions') + '</small></span>' +
        '<span class="sub">' + t('tile_' + dir + '_sub') + '</span></button>';
    }
  }

  /* ── render: filters & grid ─────────────────────────────────── */
  function visibleByDir() { return P.filter((p) => state.dir === 'all' || p.dir === state.dir); }
  function filtered() {
    const q = state.q.trim().toLowerCase();
    let list = visibleByDir().filter((p) =>
      (state.cat === 'all' || p.cat === state.cat) &&
      (!state.top || p.top) &&
      (!q || [p.name.ru, p.name.en, p.name.fa, p.spec.ru, p.spec.en, p.hs, p.origin.ru, p.origin.en, L(D.cats[p.cat])].join(' ').toLowerCase().includes(q))
    );
    const pr = (p) => (p.price == null ? Infinity : p.price);
    if (state.sort === 'price_asc') list = list.slice().sort((a, b) => pr(a) - pr(b));
    if (state.sort === 'price_desc') list = list.slice().sort((a, b) => (b.price == null ? -1 : b.price) - (a.price == null ? -1 : a.price));
    if (state.sort === 'name') list = list.slice().sort((a, b) => L(a.name).localeCompare(L(b.name), locale()));
    return list;
  }
  function renderFilters() {
    const base = visibleByDir();
    const cats = Object.keys(D.cats).filter((c) => base.some((p) => p.cat === c));
    const cnt = (fn) => base.filter(fn).length;
    const dirs = [['all', t('f_all')], ['ir', t('tile_ir')], ['kz', t('tile_kz')]];
    $('#filters').innerHTML =
      '<div class="fgroup search-g"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
        '<input id="f-search" type="search" placeholder="' + esc(t('f_search')) + '" value="' + esc(state.q) + '" aria-label="' + esc(t('f_search')) + '"></div></div>' +
      '<div class="fgroup"><div class="eyebrow">' + t('f_dir') + '</div><div class="flist">' +
        dirs.map(([d, lab]) => '<button data-action="dir" data-dir="' + d + '" aria-pressed="' + (state.dir === d) + '"><span>' + (d !== 'all' ? '<span class="dot ' + d + '"></span>' : '') + lab + '</span><span class="c">' + (d === 'all' ? P.length : P.filter((p) => p.dir === d).length) + '</span></button>').join('') +
      '</div></div>' +
      '<div class="fgroup"><div class="eyebrow">' + t('f_cat') + '</div><div class="flist">' +
        '<button data-action="cat" data-cat="all" aria-pressed="' + (state.cat === 'all') + '"><span>' + t('f_allcat') + '</span><span class="c">' + base.length + '</span></button>' +
        cats.map((c) => '<button data-action="cat" data-cat="' + c + '" aria-pressed="' + (state.cat === c) + '"><span>' + esc(L(D.cats[c])) + '</span><span class="c">' + cnt((p) => p.cat === c) + '</span></button>').join('') +
      '</div></div>' +
      '<div class="fgroup"><label class="check"><input id="f-top" type="checkbox"' + (state.top ? ' checked' : '') + '> ' + t('f_top') + '</label>' +
        '<div class="eyebrow">' + t('f_sort') + '</div><select id="f-sort" class="sel" aria-label="' + esc(t('f_sort')) + '">' +
        ['default', 'price_asc', 'price_desc', 'name'].map((s) => '<option value="' + s + '"' + (state.sort === s ? ' selected' : '') + '>' + t('s_' + s) + '</option>').join('') +
      '</select></div>';
  }
  function renderGrid() {
    const list = filtered();
    $('#grid-head').innerHTML = '<h2>' + t('grid_title') + (state.dir !== 'all' ? ' · ' + dirLabel(state.dir) : '') + (state.cat !== 'all' ? ' · ' + esc(L(D.cats[state.cat])) : '') + '</h2><span class="n">' + list.length + ' ' + t('found') + '</span>';
    $('#grid').innerHTML = list.length ? list.map(card).join('') : '<div class="empty">' + t('empty') + '</div>';
  }
  function card(p) {
    return '<article class="card" data-action="open" data-id="' + p.id + '" tabindex="0" role="button" aria-label="' + esc(L(p.name)) + '">' +
      '<div class="card-media"><img src="img/' + p.id + '.jpg" alt="' + esc(L(p.name)) + '" loading="lazy" width="900" height="675">' +
        '<div class="chips"><span class="chip ' + p.dir + '">' + (p.dir === 'ir' ? 'IR → KZ' : 'KZ → IR') + '</span>' + (p.top ? '<span class="chip top">' + (state.lang === 'ru' ? 'топ-10' : 'top-10') + '</span>' : '') + '</div></div>' +
      '<div class="card-body">' +
        '<div class="nm">' + esc(L(p.name)) + '</div>' +
        '<div class="sp">' + esc(L(p.spec)) + '</div>' +
        '<div class="prow">' + (p.price == null ? '<span class="price na">' + t('on_request') + '</span>' : '<span class="price">' + fmtMoney(p.price) + '</span><span class="unit">/ ' + unitLabel(p.unit) + '</span>') + '</div>' +
        '<div class="meta"><span>' + t('moq') + ' ' + esc(L(p.moq)) + '</span><span>' + esc(p.inc) + '</span><span class="hs">HS ' + esc(p.hs) + '</span></div>' +
        '<span class="btn btn-ghost btn-block">' + t('ask') + ' →</span>' +
      '</div></article>';
  }

  /* ── render: drawer ─────────────────────────────────────────── */
  function openDrawer(id) {
    const p = byId(id); if (!p) return;
    state.open = id; state.calc = { qty: defaultQty(p), mode: state.calc.mode || 'sea' };
    renderDrawer();
    $('#drawer').classList.add('open'); $('#backdrop').classList.add('open');
    $('#drawer').scrollTop = 0; document.body.style.overflow = 'hidden';
    setTimeout(() => { const c = $('#d-close'); if (c) c.focus(); }, 60);
  }
  function closeDrawer() {
    state.open = null;
    $('#drawer').classList.remove('open'); $('#backdrop').classList.remove('open');
    document.body.style.overflow = '';
  }
  function renderDrawer() {
    const p = byId(state.open); if (!p) return;
    const ru = state.lang === 'ru';
    $('#drawer').innerHTML =
      '<div class="d-media"><img src="img/' + p.id + '.jpg" alt="' + esc(L(p.name)) + '" width="900" height="675">' +
        '<button id="d-close" class="d-close" data-action="close" aria-label="' + esc(t('close')) + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>' +
      '<div class="d-body">' +
        '<div class="d-head"><div class="chips"><span class="chip ' + p.dir + '">' + dirLabel(p.dir) + '</span><span class="chip" style="background:var(--surface-2);color:var(--ink-2)">' + esc(L(D.cats[p.cat])) + '</span>' + (p.top ? '<span class="chip top">' + (ru ? 'топ-10' : 'top-10') + '</span>' : '') + '</div>' +
          '<h2>' + esc(L(p.name)) + '</h2><div class="fa">' + esc(p.name.fa) + '</div></div>' +
        '<div class="pricebox"><div class="row">' +
            (p.price == null ? '<span class="price na" style="font-size:18px">' + t('on_request') + '</span>' : '<span><span class="price">' + fmtMoney(p.price) + '</span> <span class="unit">/ ' + unitLabel(p.unit) + ' · ' + esc(p.inc) + '</span></span>') +
            '<div class="seg on-surface" role="group" aria-label="Currency">' + ['USD', 'KZT', 'IRR'].map((c) => '<button data-action="cur" data-cur="' + c + '" aria-pressed="' + (state.cur === c) + '">' + c + '</button>').join('') + '</div>' +
          '</div>' +
          (p.price == null ? '' : '<div class="conv"><span>' + fmtMoney(p.price, 'USD') + '</span><span>' + fmtMoney(p.price, 'KZT') + '</span><span>' + fmtMoney(p.price, 'IRR') + '</span><span>' + t('d_price_note') + t('d_price_note2') + '</span></div>') +
        '</div>' +
        '<dl class="kv">' +
          '<dt>' + t('d_spec') + '</dt><dd>' + esc(L(p.spec)) + '</dd>' +
          '<dt>' + t('d_moq') + '</dt><dd>' + esc(L(p.moq)) + '</dd>' +
          '<dt>' + t('d_inc') + '</dt><dd>' + esc(p.inc) + '</dd>' +
          '<dt>' + t('d_hs') + '</dt><dd><span class="hs">' + esc(p.hs) + '</span></dd>' +
          '<dt>' + t('d_origin') + '</dt><dd>' + esc(L(p.origin)) + '</dd>' +
          '<dt>' + t('d_lead') + '</dt><dd>' + p.lead + ' ' + t('days') + '</dd>' +
          '<dt>' + t('d_sup') + '</dt><dd>' + p.suppliers + '</dd>' +
        '</dl>' +
        '<section class="section" aria-labelledby="calc-h"><h3 id="calc-h">' + t('calc') + '</h3>' +
          '<div class="calc-form">' +
            '<label class="field" for="calc-qty">' + t('qty') + '<span class="with-unit"><input id="calc-qty" type="number" min="1" step="1" value="' + state.calc.qty + '"><span>' + unitLabel(p.unit) + '</span></span></label>' +
            '<label class="field" for="calc-mode">' + t('mode') + '<select id="calc-mode">' + ['sea', 'rail', 'truck'].map((m) => '<option value="' + m + '"' + (state.calc.mode === m ? ' selected' : '') + '>' + t('m_' + m) + '</option>').join('') + '</select></label>' +
          '</div><div id="calc-out" class="calc-out"></div></section>' +
        '<section class="section" aria-labelledby="rfq-h"><h3 id="rfq-h">' + t('rfq') + '</h3>' +
          '<form id="rfq-form" class="rfq-form" novalidate><input type="hidden" name="pid" value="' + p.id + '"><input type="hidden" name="qty" value="' + (state.calc.qty || defaultQty(p)) + '"><input type="hidden" name="mode" value="' + state.calc.mode + '">' +
            '<div class="two"><label class="field" for="rfq-company">' + t('f_company') + '<input id="rfq-company" name="company" required></label>' +
              '<label class="field" for="rfq-country">' + t('f_country') + '<select id="rfq-country" name="country"><option value="kz"' + (p.dir === 'ir' ? ' selected' : '') + '>' + t('c_kz') + '</option><option value="ir"' + (p.dir === 'kz' ? ' selected' : '') + '>' + t('c_ir') + '</option><option value="other">' + t('c_other') + '</option></select></label></div>' +
            '<label class="field" for="rfq-contact">' + t('f_contact') + '<input id="rfq-contact" name="contact" required></label>' +
            '<label class="field" for="rfq-comment">' + t('f_comment') + '<textarea id="rfq-comment" name="comment" placeholder="' + esc(t('f_comment_ph')) + '"></textarea></label>' +
            '<button class="btn btn-primary" type="submit">' + t('send') + '</button>' +
          '</form></section>' +
      '</div>';
    renderCalc();
  }
  function renderCalc() {
    const p = byId(state.open); if (!p) return;
    const r = calcLot(p, state.calc.qty || 0, state.calc.mode);
    const ru = state.lang === 'ru';
    $('#calc-out').innerHTML =
      '<div class="r"><span>' + t('c_goods') + ' · ' + fmtNum(state.calc.qty || 0, 0) + ' ' + unitLabel(p.unit) + '</span><span class="v">' + (r.goods == null ? t('on_request') : fmtMoney(r.goods)) + '</span></div>' +
      '<div class="r"><span>' + t('c_freight') + (r.byContainer ? ' · ' + t('c_container') : '') + '</span><span class="v">' + fmtMoney(r.freight) + '</span></div>' +
      '<div class="r total"><span>' + t('c_total') + ' <span class="muted small">(' + t('c_transit') + ' ' + r.days[0] + '–' + r.days[1] + ' ' + t('days') + ')</span></span><span class="v">' + (r.total == null ? t('on_request') : fmtMoney(r.total)) + '</span></div>' +
      '<div class="note">' + t('c_note') + (ru ? '' : '') + '</div>';
  }

  /* ── requests ───────────────────────────────────────────────── */
  function rfqText(r) {
    const p = byId(r.pid); const lot = calcLot(p, r.qty, r.mode);
    const lines = [
      t('req_text_title') + ' · ' + CONFIG.brand + ' · ' + r.id,
      t('req_product') + ': ' + L(p.name) + ' (HS ' + p.hs + ')',
      t('req_qty') + ': ' + fmtNum(r.qty, 0) + ' ' + unitLabel(p.unit),
      t('req_basis') + ': ' + p.inc + ' · ' + t('m_' + r.mode),
      t('req_est') + ': ' + (lot.total == null ? t('on_request') : fmtMoney(lot.total, 'USD')),
      t('req_company') + ': ' + (typeof r.company === 'string' ? r.company : L(r.company)) + ' (' + t('c_' + (r.country || 'other')) + ')',
      t('req_contact') + ': ' + r.contact
    ];
    const c = typeof r.comment === 'string' ? r.comment : L(r.comment);
    if (c) lines.push(t('req_comment') + ': ' + c);
    return lines.join('\n');
  }
  function renderRequests() {
    const list = state.rfqs.slice().sort((a, b) => (a.created < b.created ? 1 : -1));
    const hasExamples = list.some((r) => r.example);
    $('#view-rfq').innerHTML =
      '<div class="view-head"><h1>' + t('req_title') + '</h1><p>' + t('req_lede') + '</p></div>' +
      (list.length ? '<div class="req-list">' + list.map(reqCard).join('') + '</div>' : '<div class="empty">' + t('req_empty') + '</div>') +
      (!hasExamples ? '<div><button class="btn btn-ghost" data-action="reset-examples">' + t('reset_examples') + '</button></div>' : '');
  }
  function reqCard(r) {
    const p = byId(r.pid); const lot = calcLot(p, r.qty, r.mode); const si = STATUSES.indexOf(r.status);
    const company = typeof r.company === 'string' ? r.company : L(r.company);
    const date = new Date(r.created).toLocaleDateString(locale(), { day: '2-digit', month: 'short' });
    return '<article class="req">' +
      '<img src="img/' + p.id + '.jpg" alt="" loading="lazy" width="64" height="48">' +
      '<div class="req-main">' +
        '<div class="req-title"><b>' + esc(L(p.name)) + '</b><span class="id">' + r.id + '</span>' + (r.example ? '<span class="tag">' + t('example') + '</span>' : '') + '<span class="dot ' + p.dir + '"></span><span class="small muted">' + dirLabel(p.dir) + '</span></div>' +
        '<div class="req-line"><span class="sum">' + fmtNum(r.qty, 0) + ' ' + unitLabel(p.unit) + '</span><span class="sum">' + (lot.total == null ? t('on_request') : fmtMoney(lot.total)) + '</span><span>' + esc(p.inc) + '</span><span>' + t('m_' + r.mode).split(':')[0] + '</span></div>' +
        '<div class="req-line muted"><span>' + esc(company) + '</span><span>' + esc(r.contact) + '</span><span>' + date + '</span></div>' +
        '<div class="steps">' + STATUSES.map((s, i) => '<span class="step' + (i < si ? ' done' : i === si ? ' cur' : '') + '">' + (i > 0 ? '<span class="bar"></span>' : '') + '<span class="pip"></span>' + t('st_' + s) + '</span>').join('') + '</div>' +
        '<div class="req-actions">' +
          (si < STATUSES.length - 1 ? '<button class="btn btn-ghost" data-action="advance" data-id="' + r.id + '">' + t('next_step') + ' →</button>' : '') +
          '<button class="btn btn-ghost" data-action="copy" data-id="' + r.id + '">' + t('copy') + '</button>' +
          (CONFIG.whatsapp ? '<a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(rfqText(r)) + '">' + t('wa') + '</a>' : '') +
          '<button class="btn btn-text" data-action="delete" data-id="' + r.id + '">' + t('del') + '</button>' +
        '</div>' +
      '</div></article>';
  }
  function saveRfqs() { LS.set('rfqs', state.rfqs); renderHeader(); }

  /* ── logistics view ─────────────────────────────────────────── */
  function renderLogistics() {
    const ru = state.lang === 'ru'; const f = D.freight;
    const nodes = ru
      ? { aktau: 'Актау / Курык', bolashak: 'Болашак (ж/д)', almaty: 'Алматы', anzali: 'Бендер-Энзели / Амирабад', incheh: 'Инче-Бурун (ж/д)', tehran: 'Тегеран', sea: 'КАСПИЙСКОЕ МОРЕ', tkm: 'через Туркменистан', kz: 'КАЗАХСТАН', ir: 'ИРАН' }
      : { aktau: 'Aktau / Kuryk', bolashak: 'Bolashak (rail)', almaty: 'Almaty', anzali: 'Bandar Anzali / Amirabad', incheh: 'Incheh Borun (rail)', tehran: 'Tehran', sea: 'CASPIAN SEA', tkm: 'via Turkmenistan', kz: 'KAZAKHSTAN', ir: 'IRAN' };
    const dd = (m) => f[m].days[0] + '–' + f[m].days[1] + ' ' + t('days');
    const svg =
      '<svg class="schematic" viewBox="0 0 760 300" role="img" aria-label="' + esc(t('lg_map')) + '">' +
        '<text x="40" y="34" class="sea-t" style="fill:var(--steppe-ink)">' + nodes.kz + '</text><text x="720" y="34" class="sea-t" text-anchor="end" style="fill:var(--saffron-ink)">' + nodes.ir + '</text>' +
        '<rect x="290" y="52" width="180" height="96" rx="48" class="sea-band"/><text x="380" y="106" text-anchor="middle" class="sea-t">' + nodes.sea + '</text>' +
        '<path class="r-sea" d="M132 90 C 240 90, 250 100, 380 100 S 520 90, 628 90"/>' +
        '<path class="r-rail" d="M132 180 L 628 180"/>' +
        '<path class="r-truck" d="M132 262 C 300 262, 460 262, 628 262"/>' +
        '<text x="380" y="168" text-anchor="middle" class="lbl">' + nodes.tkm + ' · ' + dd('rail') + '</text>' +
        '<text x="380" y="250" text-anchor="middle" class="lbl">' + nodes.tkm + ' · ' + dd('truck') + '</text>' +
        '<text x="380" y="72" text-anchor="middle" class="lbl">' + dd('sea') + '</text>' +
        node(124, 90, 'kz', nodes.aktau, 'end') + node(124, 180, 'kz', nodes.bolashak, 'end') + node(124, 262, 'kz', nodes.almaty, 'end') +
        node(636, 90, 'ir', nodes.anzali, 'start') + node(636, 180, 'ir', nodes.incheh, 'start') + node(636, 262, 'ir', nodes.tehran, 'start') +
      '</svg>';
    function node(x, y, cls, label, anchor) {
      const tx = anchor === 'end' ? x - 16 : x + 16;
      return '<circle cx="' + x + '" cy="' + y + '" r="7" class="node ' + cls + '"/><text x="' + tx + '" y="' + (y + 4) + '" text-anchor="' + anchor + '" class="ttl">' + label + '</text>';
    }
    const routes = [
      ['sea', t('m_sea').split(': ')[0], t('m_sea').split(': ')[1], dd('sea'), fmtNum(f.sea.perTonne, 0) + ' $/' + unitLabel('t') + ' · ' + fmtNum(f.sea.per40ft, 0) + ' $/40ft', t('lg_sea_for')],
      ['rail', t('m_rail').split(': ')[0], t('m_rail').split(': ')[1] + ' (' + nodes.tkm + ')', dd('rail'), fmtNum(f.rail.perTonne, 0) + ' $/' + unitLabel('t'), t('lg_rail_for')],
      ['truck', t('m_truck').split(': ')[0], t('m_truck').split(': ')[1] + ' (' + nodes.tkm + ')', dd('truck'), fmtNum(f.truck.perTonne, 0) + ' $/' + unitLabel('t') + ' · ' + fmtNum(f.truck.per40ft, 0) + ' $/20 ' + unitLabel('t'), t('lg_truck_for')]
    ];
    const inc = ru ? [
      ['FOB Aktau / Bandar Abbas', 'Продавец грузит на судно в порту отправления; фрахт, страховка и импорт — на покупателе. Основной базис для зерна, металлов, битума.'],
      ['CPT Almaty / Tehran', 'Продавец оплачивает перевозку до названного пункта; риск переходит при передаче первому перевозчику. Удобно для ковров, специй, авиапартий.'],
      ['DAP граница / порт', 'Продавец доставляет до пункта назначения без выгрузки и таможни. Используется для муки и удобрений при ж/д поставках.'],
      ['EXW склад', 'Покупатель забирает со склада продавца и сам организует экспорт. Минимальная цена, максимум организации на стороне покупателя.']
    ] : [
      ['FOB Aktau / Bandar Abbas', 'Seller loads on board at the port of shipment; freight, insurance and import are on the buyer. Main basis for grain, metals, bitumen.'],
      ['CPT Almaty / Tehran', 'Seller pays carriage to the named place; risk passes on handover to the first carrier. Handy for carpets, spices, air lots.'],
      ['DAP border / port', 'Seller delivers to the destination without unloading or customs. Used for flour and fertilizers on rail deliveries.'],
      ['EXW warehouse', 'Buyer collects at the seller’s warehouse and arranges export. Lowest price, most organisation on the buyer side.']
    ];
    const docsIr = ru ? ['Инвойс и упаковочный лист', 'Сертификат происхождения (ТПП Ирана)', 'Фитосанитарный сертификат — фрукты, орехи, специи', 'Сертификат качества / анализа (ISO 3632 для шафрана)', 'Экспортная декларация Ирана', 'Коносамент / CMR / ж/д накладная СМГС', 'Декларация соответствия ЕАЭС при ввозе в РК']
      : ['Invoice and packing list', 'Certificate of origin (Iran Chamber of Commerce)', 'Phytosanitary certificate — fruit, nuts, spices', 'Quality / analysis certificate (ISO 3632 for saffron)', 'Iranian export declaration', 'Bill of lading / CMR / SMGS rail note', 'EAEU declaration of conformity on import to KZ'];
    const docsKz = ru ? ['Инвойс и упаковочный лист', 'Сертификат происхождения СТ-1 / общей формы', 'Фитосанитарный сертификат — зерно, мука, масличные', 'Ветеринарный сертификат и халяль — мясо', 'Экспортная декларация (ГТД) РК', 'Коносамент / CMR / СМГС', 'Регистрация импортёра и разрешение на ввоз в Иране']
      : ['Invoice and packing list', 'Certificate of origin CT-1 / general form', 'Phytosanitary certificate — grain, flour, oilseeds', 'Veterinary and halal certificates — meat', 'KZ export declaration', 'Bill of lading / CMR / SMGS', 'Importer registration and import permit in Iran'];
    $('#view-logistics').innerHTML =
      '<div class="view-head"><h1>' + t('lg_title') + '</h1><p>' + t('lg_lede') + '</p></div>' +
      '<section class="panel"><h2>' + t('lg_map') + '</h2>' + svg + '</section>' +
      '<section class="panel"><h2>' + t('lg_routes') + '</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + t('lg_mode') + '</th><th>' + t('lg_corridor') + '</th><th>' + t('lg_transit') + '</th><th>' + t('lg_rate') + '</th><th>' + t('lg_for') + '</th></tr></thead><tbody>' +
        routes.map((r) => '<tr><td><b>' + r[1] + '</b></td><td>' + r[2] + '</td><td class="num">' + r[3] + '</td><td class="num">' + r[4] + '</td><td>' + r[5] + '</td></tr>').join('') +
      '</tbody></table></div></section>' +
      '<section class="panel"><h2>' + t('lg_inc') + '</h2><div class="cards3">' + inc.map((i) => '<div class="mini"><span class="k">' + i[0] + '</span><p>' + i[1] + '</p></div>').join('') + '</div></section>' +
      '<section class="panel"><h2>' + t('lg_docs') + '</h2><div class="cols2">' +
        '<div class="docs"><h3><span class="dot ir"></span>' + t('lg_docs_ir') + '</h3><ul>' + docsIr.map((d) => '<li>' + d + '</li>').join('') + '</ul></div>' +
        '<div class="docs"><h3><span class="dot kz"></span>' + t('lg_docs_kz') + '</h3><ul>' + docsKz.map((d) => '<li>' + d + '</li>').join('') + '</ul></div>' +
      '</div></section>' +
      '<section class="panel"><h2>' + t('lg_pay') + '</h2><p style="max-width:70ch;color:var(--ink-2)">' + t('lg_pay_text') + '</p></section>';
  }

  /* ── about view ─────────────────────────────────────────────── */
  function renderAbout() {
    const ru = state.lang === 'ru';
    const steps = ru ? [
      ['Каталог', 'Импортёр находит позицию, сравнивает цену по базису, спецификацию и MOQ.'],
      ['Запрос котировки', 'Одна форма — запрос уходит поставщикам направления. Расчёт партии с фрахтом виден сразу.'],
      ['Котировка и контракт', 'Поставщик подтверждает цену, срок и упаковку. Платформа фиксирует условия и Incoterms.'],
      ['Логистика и документы', 'Море, ж/д или авто через Каспийский коридор; чек-лист сертификатов под товар.'],
      ['Расчёт', 'Аккредитив или предоплата через уполномоченные банки в национальных валютах.']
    ] : [
      ['Catalogue', 'The importer finds a product and compares price by basis, specification and MOQ.'],
      ['Request for quotation', 'One form — the request goes to the suppliers of that direction. Lot costing with freight is visible at once.'],
      ['Quote and contract', 'The supplier confirms price, timing and packaging. The platform records terms and Incoterms.'],
      ['Logistics and documents', 'Sea, rail or road through the Caspian corridor; certificate checklist per product.'],
      ['Settlement', 'Letter of credit or prepayment through authorised banks in national currencies.']
    ];
    const model = ru ? [
      ['Бесплатно', 'Импортёрам', 'Поиск, сравнение, запросы котировок — без оплаты. Рост спроса делает витрину ценной для экспортёров.'],
      ['Подписка', 'Экспортёрам', 'Верифицированный профиль, приоритет в выдаче, аналитика запросов. Тариф по числу позиций.'],
      ['1–2 % от сделки', 'Сервисный сбор', 'Только при сделке через платформу: сопровождение контракта, логистика, документы.']
    ] : [
      ['Free', 'For importers', 'Search, comparison and quote requests at no cost. Growing demand makes the storefront valuable to exporters.'],
      ['Subscription', 'For exporters', 'Verified profile, ranking priority, request analytics. Tiered by number of listed products.'],
      ['1–2 % per deal', 'Service fee', 'Only on deals closed through the platform: contract support, logistics, documents.']
    ];
    const road = ru ? [
      ['Демо-каталог', '46 позиций, цены, расчёт партии, заявки — эта версия.'],
      ['Верификация поставщиков', 'KYC компаний, проверка лицензий и сертификатов, рейтинг по сделкам.'],
      ['Расчёты и эскроу', 'Партнёрские банки КЗ и Ирана, аккредитивы, страхование груза.'],
      ['Мобильное приложение и API', 'Интеграция с 1С/ERP, уведомления по сделке, персидский интерфейс.']
    ] : [
      ['Demo catalogue', '46 products, prices, lot calculator, requests — this version.'],
      ['Supplier verification', 'Company KYC, licence and certificate checks, deal-based rating.'],
      ['Settlement and escrow', 'Partner banks in KZ and Iran, letters of credit, cargo insurance.'],
      ['Mobile app and API', 'ERP integration, deal notifications, Persian interface.']
    ];
    const credits = Object.keys(CREDITS).map((id) => {
      const c = CREDITS[id]; const p = byId(id);
      const who = [c.creator, c.license].filter(Boolean).join(', ');
      return '<div>' + esc(L(p.name)) + ' — ' + esc(c.source || '') + (who ? ' (' + esc(who) + ')' : '') + '</div>';
    }).join('');
    $('#view-about').innerHTML =
      '<div class="view-head"><h1>' + t('ab_title') + '</h1><p>' + t('ab_lede') + '</p></div>' +
      '<section class="panel"><h2>' + t('ab_how') + '</h2><div class="steps-h">' + steps.map((s) => '<div class="st"><b>' + s[0] + '</b><p>' + s[1] + '</p></div>').join('') + '</div></section>' +
      '<section class="panel"><h2>' + t('ab_for') + '</h2><div class="cols2">' +
        '<div class="mini"><b>' + t('ab_buyers') + '</b><p>' + t('ab_buyers_t') + '</p></div>' +
        '<div class="mini"><b>' + t('ab_sellers') + '</b><p>' + t('ab_sellers_t') + '</p></div></div></section>' +
      '<section class="panel"><h2>' + t('ab_model') + '</h2><div class="cards3">' + model.map((m) => '<div class="mini"><span class="k">' + m[0] + '</span><b>' + m[1] + '</b><p>' + m[2] + '</p></div>').join('') + '</div></section>' +
      '<section class="panel"><h2>' + t('ab_road') + '</h2><div class="steps-h">' + road.map((s) => '<div class="st"><b>' + s[0] + '</b><p>' + s[1] + '</p></div>').join('') + '</div></section>' +
      '<section class="panel"><h2>' + t('ab_src') + '</h2>' +
        '<div class="warnbox"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg><span>' + t('ab_disclaimer') + '</span></div>' +
        '<p class="small muted">' + (ru ? 'Цены: прайс-листы экспортёров Ирана (фисташки, шафран, финики, плитка, битум, полимеры), APK-Inform и Зерновой союз Казахстана (зерно), Tridge (сухофрукты), LME (металлы), Нацбанк РК и рыночные котировки риала (курсы).' : 'Prices: Iranian exporter price lists (pistachios, saffron, dates, tile, bitumen, polymers), APK-Inform and the Grain Union of Kazakhstan (grain), Tridge (dried fruit), LME (metals), National Bank of Kazakhstan and rial market quotes (FX).') + '</p>' +
        '<div class="credits">' + credits + '</div></section>';
  }

  /* ── views ──────────────────────────────────────────────────── */
  function setView(v) {
    state.view = v;
    ['catalog', 'rfq', 'logistics', 'about'].forEach((x) => { $('#view-' + x).hidden = x !== v; });
    if (v === 'rfq') renderRequests();
    if (v === 'logistics') renderLogistics();
    if (v === 'about') renderAbout();
    renderHeader();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function renderAll() {
    renderHeader(); renderTicker(); renderHero(); renderFilters(); renderGrid();
    $('#foot-l').textContent = t('footer_l') + ' · ' + new Date(D.asOf).toLocaleDateString(locale(), { day: '2-digit', month: 'long', year: 'numeric' });
    $('#foot-r').textContent = t('footer_r');
    if (state.view !== 'catalog') setView(state.view);
    if (state.open) renderDrawer();
  }

  /* ── toast ──────────────────────────────────────────────────── */
  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }
  function copyText(text) {
    const done = () => toast(t('copied'));
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallback());
    else fallback();
    function fallback() {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast(text.slice(0, 80) + '…'); }
      document.body.removeChild(ta);
    }
  }

  /* ── events ─────────────────────────────────────────────────── */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const a = el.dataset.action;
    if (a === 'view') setView(el.dataset.view);
    else if (a === 'lang') { state.lang = el.dataset.lang; LS.set('lang', state.lang); renderAll(); }
    else if (a === 'cur') { state.cur = el.dataset.cur; LS.set('cur', state.cur); renderAll(); }
    else if (a === 'dir') {
      const d = el.dataset.dir; state.dir = (state.dir === d && d !== 'all') ? 'all' : d; state.cat = 'all';
      renderHero(); renderFilters(); renderGrid();
      if (state.view !== 'catalog') setView('catalog');
      if (el.classList.contains('tile')) $('#catalog').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    else if (a === 'cat') { state.cat = el.dataset.cat; renderFilters(); renderGrid(); }
    else if (a === 'open') openDrawer(el.dataset.id);
    else if (a === 'close') closeDrawer();
    else if (a === 'advance') {
      const r = state.rfqs.find((x) => x.id === el.dataset.id); if (!r) return;
      const i = STATUSES.indexOf(r.status); if (i < STATUSES.length - 1) r.status = STATUSES[i + 1];
      saveRfqs(); renderRequests();
    }
    else if (a === 'copy') { const r = state.rfqs.find((x) => x.id === el.dataset.id); if (r) copyText(rfqText(r)); }
    else if (a === 'delete') { state.rfqs = state.rfqs.filter((x) => x.id !== el.dataset.id); saveRfqs(); renderRequests(); }
    else if (a === 'reset-examples') { state.rfqs = seedRfqs().concat(state.rfqs); saveRfqs(); renderRequests(); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.open) closeDrawer();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('card')) { e.preventDefault(); openDrawer(e.target.dataset.id); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'f-search') { state.q = e.target.value; renderGrid(); }
    if (e.target.id === 'calc-qty') { state.calc.qty = Math.max(0, Number(e.target.value) || 0); renderCalc(); const h = document.querySelector('#rfq-form input[name="qty"]'); if (h) h.value = state.calc.qty; }
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'f-top') { state.top = e.target.checked; renderGrid(); }
    if (e.target.id === 'f-sort') { state.sort = e.target.value; renderGrid(); }
    if (e.target.id === 'calc-mode') { state.calc.mode = e.target.value; renderCalc(); const h = document.querySelector('#rfq-form input[name="mode"]'); if (h) h.value = state.calc.mode; }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'rfq-form') return;
    e.preventDefault();
    const f = e.target; const p = byId(state.open) || byId(f.pid && f.pid.value); if (!p) { toast(state.lang === 'ru' ? 'Откройте товар и повторите' : 'Open a product and try again'); return; }
    const company = f.company.value.trim(), contact = f.contact.value.trim();
    if (!company || !contact) { toast(state.lang === 'ru' ? 'Заполните компанию и контакт' : 'Fill in company and contact'); (company ? f.contact : f.company).focus(); return; }
    const nextNum = 1045 + state.rfqs.filter((r) => !r.example).length;
    const qty = (state.open === p.id && state.calc.qty) || Number(f.qty && f.qty.value) || defaultQty(p);
    const mode = (state.open === p.id ? state.calc.mode : (f.mode && f.mode.value)) || 'sea';
    const r = { id: 'RQ-' + nextNum, pid: p.id, qty: qty, mode: mode, company, country: f.country.value, contact, comment: f.comment.value.trim(), status: 'new', example: false, created: new Date().toISOString() };
    state.rfqs.push(r); saveRfqs();
    closeDrawer(); toast(t('sent')); setView('rfq');
  });

  /* ── boot ───────────────────────────────────────────────────── */
  renderAll();
})();
