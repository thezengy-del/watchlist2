/* ══════════════════════════════════════════════════════════════════
   stocks-data.js
   • Live prices come from Google Sheet (see SHEET_CSV_URL below)
   • SQ / Dis shown as "current (original)"
   • PW Target shown as "updated ($original)" when revised
   • Priority (Watchlist / Bought / Backburner) is user-editable
     and persisted to localStorage independently
   • openCard() shows the company tearsheet in a fullscreen iframe
══════════════════════════════════════════════════════════════════ */

/* ── GOOGLE SHEET PRICE SOURCE ───────────────────────────────────
   Uses fetch() to the published CSV endpoint — works from file://
   because Google sends Access-Control-Allow-Origin: * on pub CSV.
─────────────────────────────────────────────────────────────────── */
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRowYEHwVGAzLs-fqF2obTNqnuGonIzhxk-aXIdyAEZTDFIcOVCmoT0DFbV87G3OiznoLrTswff3DT5/pub?output=csv';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyVP_R5LQlIwnFk08gAya3ClBErxSuELZ3meQrCJkuvSTl-m-_bEy_gfVxktdHw3kX0/exec';

// Sheet column letters (A=first column). Set these to match your Google Sheet layout.
const SHEET_COLS = { price: 'F', chgDay: 'G', chgWeek: 'U', chgMonth: 'V', chg5m: 'X' };

/* ── STOCK DEFINITIONS ───────────────────────────────────────────
   sqScore / dislocationScore  = current (updated) values
   sqScoreOrig / dislocationOrig = values at original memo date
   targetPrice      = latest/updated PW target
   targetPriceOrig  = original PW target (shown in brackets if differs)
   livePrice / livePxChange / week52High / week52Low = from Google Sheet
   sheetFile        = path to company HTML tearsheet
─────────────────────────────────────────────────────────────────── */
const STOCKS = {
  TTD: {
    ticker: 'TTD',
    name: 'The Trade Desk, Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 6,
    sqScoreOrig: 7,
    dislocationScore: 6,
    dislocationOrig: 8,
    targetPrice: 44.37,
    targetPriceOrig: 44.37,   // unchanged from original memo
    livePrice: 0,
    livePxChange: 0,
    week52High: 72.00,
    week52Low: 18.00,
    sector: 'Ad Tech / Internet',
    exchange: 'NASDAQ',
    currency: 'USD',
    sheetFile: 'Company sheets/The Trade Desk.html',
    _embeddedAt: '2026-06-01T00:00:00Z'
  },
  ACN: {
    ticker: 'ACN',
    name: 'Accenture plc',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7,
    sqScoreOrig: 8,
    dislocationScore: 6,
    dislocationOrig: 7,
    targetPrice: 235,
    targetPriceOrig: 286,     // revised down from $286
    livePrice: 0,
    livePxChange: 0,
    week52High: 322.86,
    week52Low: 155.82,
    sector: 'IT Professional Services',
    exchange: 'NYSE',
    currency: 'USD',
    sheetFile: 'Company sheets/Accenture.html',
    _embeddedAt: '2026-06-01T00:00:00Z'
  },
  '1299.HK': {
    ticker: '1299.HK',
    name: 'AIA Group Limited',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 7, dislocationOrig: 6,
    targetPrice: 105, targetPriceOrig: 105,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Pan-Asian Insurance',
    exchange: 'HKEX', currency: 'HKD',
    sheetFile: 'Company sheets/AIAGroupLimited.html'
  },
  APH: {
    ticker: 'APH',
    name: 'Amphenol Corporation',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 7, dislocationOrig: 5,
    targetPrice: 177, targetPriceOrig: 177,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Electronic Components',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'Company sheets/Amphenol.html'
  },
  APO: {
    ticker: 'APO',
    name: 'Apollo Global Management',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 8,
    dislocationScore: 7, dislocationOrig: 8,
    targetPrice: 148.42, targetPriceOrig: 148.42,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Alt. Asset Management',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'Company sheets/Apollo.html'
  },
  BILI: {
    ticker: 'BILI',
    name: 'Bilibili Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 6, sqScoreOrig: 6,
    dislocationScore: 7, dislocationOrig: 7,
    targetPrice: 27, targetPriceOrig: 27,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Chinese Video / Gaming',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'Company sheets/BilibiliInc.html'
  },
  '285.HK': {
    ticker: '285.HK',
    name: 'BYD Electronic International',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 7, dislocationOrig: 7,
    targetPrice: 41.90, targetPriceOrig: 41.90,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Electronics Manufacturing',
    exchange: 'HKEX', currency: 'HKD',
    sheetFile: 'Company sheets/BYD Electronics.html'
  },
  '1211.HK': {
    ticker: '1211.HK',
    name: 'BYD Co., Ltd.',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 6, dislocationOrig: 6,
    targetPrice: 125, targetPriceOrig: 125,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'EV / Automotive',
    exchange: 'HKEX', currency: 'HKD',
    sheetFile: 'Company sheets/BYD.html'
  },
  CHRW: {
    ticker: 'CHRW',
    name: 'CH Robinson Worldwide',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 4, dislocationOrig: 4,
    targetPrice: 185, targetPriceOrig: 185,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: '3PL / Freight Logistics',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'Company sheets/CH Robinson.html'
  },
  CMCSA: {
    ticker: 'CMCSA',
    name: 'Comcast Corporation',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 5, sqScoreOrig: 5,
    dislocationScore: 6, dislocationOrig: 6,
    targetPrice: 33, targetPriceOrig: 33,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Cable / Telecom / Media',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'Company sheets/Comcast_Corporation.html'
  },
  '388.HK': {
    ticker: '388.HK',
    name: 'Hong Kong Exchanges & Clearing',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 9, sqScoreOrig: 9,
    dislocationScore: 6, dislocationOrig: 6,
    targetPrice: 477, targetPriceOrig: 477,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Financial Exchanges',
    exchange: 'HKEX', currency: 'HKD',
    sheetFile: 'Company sheets/HongKongExchangesandClearingLimited.html'
  },
  INTU: {
    ticker: 'INTU',
    name: 'Intuit Inc.',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 6, dislocationOrig: 8,
    targetPrice: 580, targetPriceOrig: 580,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Financial Software',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'Company sheets/Intuit.html'
  },
  LMT: {
    ticker: 'LMT',
    name: 'Lockheed Martin Corporation',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 5, dislocationOrig: 5,
    targetPrice: 615, targetPriceOrig: 615,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Defense Aerospace',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'Company sheets/LockheedMartin.html'
  },
  NFLX: {
    ticker: 'NFLX',
    name: 'Netflix, Inc.',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 6, dislocationOrig: 6,
    targetPrice: 117, targetPriceOrig: 115,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Streaming',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'Company sheets/Netflix.html'
  },
  '7974.T': {
    ticker: '7974.T',
    name: 'Nintendo Co., Ltd.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 6, dislocationOrig: 6,
    targetPrice: 9250, targetPriceOrig: 9250,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Gaming',
    exchange: 'TSE', currency: 'JPY',
    sheetFile: 'Company sheets/NintendoCoLtd.html'
  },
  NU: {
    ticker: 'NU',
    name: 'Nu Holdings Ltd.',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 5, dislocationOrig: 5,
    targetPrice: 19.00, targetPriceOrig: 18.45,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Digital Banking',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'Company sheets/NuBank.html'
  },
  POOL: {
    ticker: 'POOL',
    name: 'Pool Corporation',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 7, dislocationOrig: 7,
    targetPrice: 248, targetPriceOrig: 248,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Pool Distribution',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'Company sheets/PoolCorporation.html'
  },
  DIS: {
    ticker: 'DIS',
    name: 'The Walt Disney Company',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 6, sqScoreOrig: 6,
    dislocationScore: 5, dislocationOrig: 5,
    targetPrice: 120, targetPriceOrig: 120,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Media / Entertainment',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'Company sheets/TheWaltDisneyCompany.html'
  },
  TCOM: {
    ticker: 'TCOM',
    name: 'Trip.com Group',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 7, dislocationOrig: 7,
    targetPrice: 68.00, targetPriceOrig: 68.25,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Online Travel',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'Company sheets/Trip.com.html'
  },
  VEEV: {
    ticker: 'VEEV',
    name: 'Veeva Systems Inc.',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 7, dislocationOrig: 7,
    targetPrice: 258, targetPriceOrig: 253,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Life Sciences SaaS',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'Company sheets/Veeva Systems.html'
  },
  '1810.HK': {
    ticker: '1810.HK',
    name: 'Xiaomi Corporation',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 6, sqScoreOrig: 6,
    dislocationScore: 6, dislocationOrig: 6,
    targetPrice: 37.00, targetPriceOrig: 41.13,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Consumer Electronics / EV',
    exchange: 'HKEX', currency: 'HKD',
    sheetFile: 'Company sheets/Xiaomi.html'
  },
  ADBE: {
    ticker: 'ADBE',
    name: 'Adobe Inc.',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 9, sqScoreOrig: 9,
    dislocationScore: 9, dislocationOrig: 9,
    targetPrice: 387, targetPriceOrig: 389,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Creative / Enterprise Software',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/Adobe.html'
  },
  ARES: {
    ticker: 'ARES',
    name: 'Ares Management Corporation',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 8, dislocationOrig: 8,
    targetPrice: 175, targetPriceOrig: 176,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Alt. Asset Management',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/Ares.html'
  },
  DAL: {
    ticker: 'DAL',
    name: 'Delta Air Lines Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 7, dislocationOrig: 7,
    targetPrice: 85, targetPriceOrig: 74.10,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Airlines',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/DeltaAirlines.html'
  },
  GRAB: {
    ticker: 'GRAB',
    name: 'Grab Holdings Limited',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 8, dislocationOrig: 8,
    targetPrice: 5.85, targetPriceOrig: 6.12,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Southeast Asia Super App',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/GrabHoldings.html'
  },
  KKR: {
    ticker: 'KKR',
    name: 'KKR & Co. Inc.',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 8, dislocationOrig: 8,
    targetPrice: 117, targetPriceOrig: 113.50,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Alt. Asset Management',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/KKR.html'
  },
  MDB: {
    ticker: 'MDB',
    name: 'MongoDB Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 6, dislocationOrig: 6,
    targetPrice: 300, targetPriceOrig: 257,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Database / Developer Platform',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/MongoDB.html'
  },
  RCL: {
    ticker: 'RCL',
    name: 'Royal Caribbean Cruises',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 5, dislocationOrig: 5,
    targetPrice: 366, targetPriceOrig: 385,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Cruise / Travel Leisure',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/RoyalCaribbean.html'
  },
  SE: {
    ticker: 'SE',
    name: 'Sea Limited',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 7, dislocationOrig: 7,
    targetPrice: 120, targetPriceOrig: 143,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Southeast Asia Internet',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/SeaLtd.html'
  },
  SNOW: {
    ticker: 'SNOW',
    name: 'Snowflake Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 7, dislocationOrig: 7,
    targetPrice: 303, targetPriceOrig: 210,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Data Cloud / Analytics',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/Snowflake.html'
  },
  SPGI: {
    ticker: 'SPGI',
    name: 'S&P Global Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 6, dislocationOrig: 6,
    targetPrice: 465, targetPriceOrig: 446,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Financial Data & Analytics',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/SPGlobal.html'
  },
  ULTA: {
    ticker: 'ULTA',
    name: 'Ulta Beauty Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 5, dislocationOrig: 5,
    targetPrice: 693, targetPriceOrig: 693,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Beauty Retail',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/UltaBeauty.html'
  },
  GOOG: {
    ticker: 'GOOG',
    name: 'Alphabet Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 5, dislocationOrig: 3,
    targetPrice: 370, targetPriceOrig: 290,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Internet / Search / Cloud',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/Alphabet.html',
    _embeddedAt: '2026-06-05T00:00:00Z'
  },
  MSFT: {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 9, sqScoreOrig: 9,
    dislocationScore: 6, dislocationOrig: 7,
    targetPrice: 545, targetPriceOrig: 520,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Enterprise Software / Cloud',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/Microsoft.html',
    _embeddedAt: '2026-06-05T00:00:00Z'
  },
  AER: {
    ticker: 'AER',
    name: 'AerCap Holdings N.V.',
    rating: 'BUY',
    priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 5, dislocationOrig: 6,
    targetPrice: 170, targetPriceOrig: 175,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Aircraft Leasing',
    exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/AerCap.html',
    _embeddedAt: '2026-06-05T00:00:00Z'
  },
  '868.HK': {
    ticker: '868.HK',
    name: 'Xinyi Glass Holdings Limited',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 6, sqScoreOrig: 6,
    dislocationScore: 6, dislocationOrig: 5,
    targetPrice: 10.80, targetPriceOrig: 10.80,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Glass Manufacturing',
    exchange: 'HKEX', currency: 'HKD',
    sheetFile: 'New Company Sheets/XinyiGlass.html',
    _embeddedAt: '2026-06-05T00:00:00Z'
  },
  PYPL: {
    ticker: 'PYPL',
    name: 'PayPal Holdings Inc.',
    rating: 'HOLD',
    priority: 'watchlist',
    sqScore: 6, sqScoreOrig: 6,
    dislocationScore: 6, dislocationOrig: 5,
    targetPrice: 62, targetPriceOrig: 80,
    livePrice: 0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Digital Payments',
    exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/PayPal.html',
    _embeddedAt: '2026-06-05T00:00:00Z'
  },

  /* ── BATCH 1: Memoconverter + Memorefresh (Jun 6 2026) ─────────── */
  MBLY: {
    ticker: 'MBLY', name: 'Mobileye Global Inc.',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 6,
    dislocationScore: 6, dislocationOrig: 8,
    targetPrice: 14.00, targetPriceOrig: 13.05,
    livePrice: 10.56, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'ADAS / Autonomous Driving', exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/Mobileye.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  AWI: {
    ticker: 'AWI', name: 'Armstrong World Industries Inc.',
    rating: 'HOLD', priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 5, dislocationOrig: 4,
    targetPrice: 185, targetPriceOrig: 190,
    livePrice: 159.7, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Building Materials / Ceiling Systems', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/ArmstrongWorldIndustries.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  '0700.HK': {
    ticker: '0700.HK', name: 'Tencent Holdings Limited',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 9, sqScoreOrig: 9,
    dislocationScore: 6, dislocationOrig: 7,
    targetPrice: 664, targetPriceOrig: 646,
    livePrice: 453.2, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Internet / Gaming / AI', exchange: 'HKEX', currency: 'HKD',
    sheetFile: 'New Company Sheets/Tencent.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  'BRK.B': {
    ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.',
    rating: 'HOLD', priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 5, dislocationOrig: 4,
    targetPrice: 505, targetPriceOrig: 494,
    livePrice: 485.86, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Conglomerate / Insurance / Rail', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/BerkshireHathaway.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  BKNG: {
    ticker: 'BKNG', name: 'Booking Holdings Inc.',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 8, dislocationOrig: 7,
    targetPrice: 218, targetPriceOrig: 218,
    livePrice: 168.0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Online Travel / OTA', exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/BookingHoldings.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  CMG: {
    ticker: 'CMG', name: 'Chipotle Mexican Grill Inc.',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 6, sqScoreOrig: 7,
    dislocationScore: 8, dislocationOrig: 7,
    targetPrice: 41.70, targetPriceOrig: 43.95,
    livePrice: 29.84, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Fast Casual Restaurants', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/Chipotle.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  GE: {
    ticker: 'GE', name: 'GE Aerospace',
    rating: 'HOLD', priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 4, dislocationOrig: 4,
    targetPrice: 318, targetPriceOrig: 315,
    livePrice: 327.65, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Aerospace Engines / Aftermarket', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/GEAerospace.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  PANW: {
    ticker: 'PANW', name: 'Palo Alto Networks Inc.',
    rating: 'HOLD', priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 4, dislocationOrig: 7,
    targetPrice: 255, targetPriceOrig: 193.50,
    livePrice: 273.56, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Cybersecurity Platform', exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/PaloAltoNetworks.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },

  /* ── BATCH 2: Memoconverter + Memorefresh (Jun 6 2026) ─────────── */
  TYL: {
    ticker: 'TYL', name: 'Tyler Technologies Inc.',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 7, dislocationOrig: 6,
    targetPrice: 455, targetPriceOrig: 434,
    livePrice: 312.07, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Government SaaS / GovTech', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/TylerTechnologies.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  ECPG: {
    ticker: 'ECPG', name: 'Encore Capital Group Inc.',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 7,
    dislocationScore: 6, dislocationOrig: 7,
    targetPrice: 98.00, targetPriceOrig: 88.85,
    livePrice: 80.6, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Specialty Finance / Debt Purchasing', exchange: 'NASDAQ', currency: 'USD',
    sheetFile: 'New Company Sheets/EncoreCapitalGroup.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  GIS: {
    ticker: 'GIS', name: 'General Mills Inc.',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 5, sqScoreOrig: 6,
    dislocationScore: 8, dislocationOrig: 8,
    targetPrice: 38, targetPriceOrig: 45,
    livePrice: 33.2, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Consumer Staples / Packaged Foods', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/GeneralMills.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  DHR: {
    ticker: 'DHR', name: 'Danaher Corporation',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 9, sqScoreOrig: 8,
    dislocationScore: 8, dislocationOrig: 8,
    targetPrice: 240, targetPriceOrig: 224,
    livePrice: 186.78, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Life Science Tools / Bioprocessing', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/Danaher.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  WMT: {
    ticker: 'WMT', name: 'Walmart Inc.',
    rating: 'HOLD', priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 4, dislocationOrig: 3,
    targetPrice: 122, targetPriceOrig: 118.25,
    livePrice: 117.71, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Mass Retail / Grocery / Advertising', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/Walmart.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  PGR: {
    ticker: 'PGR', name: 'The Progressive Corporation',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 9, sqScoreOrig: 8,
    dislocationScore: 8, dislocationOrig: 7,
    targetPrice: 252, targetPriceOrig: 234,
    livePrice: 204.02, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'P&C Auto Insurance', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/ProgressiveCorporation.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  '9992.HK': {
    ticker: '9992.HK', name: 'Pop Mart International Group Limited',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 7, sqScoreOrig: 7,
    dislocationScore: 6, dislocationOrig: 7,
    targetPrice: 218, targetPriceOrig: 246,
    livePrice: 173.4, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Art Toys / Consumer Discretionary', exchange: 'HKEX', currency: 'HKD',
    sheetFile: 'New Company Sheets/PopMart.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  ETN: {
    ticker: 'ETN', name: 'Eaton Corporation plc',
    rating: 'HOLD', priority: 'watchlist',
    sqScore: 9, sqScoreOrig: 8,
    dislocationScore: 5, dislocationOrig: 4,
    targetPrice: 405, targetPriceOrig: 392,
    livePrice: 395.94, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Electrical / Power Management / Data Center', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/Eaton.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  ORCL: {
    ticker: 'ORCL', name: 'Oracle Corporation',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 8, sqScoreOrig: 8,
    dislocationScore: 6, dislocationOrig: 7,
    targetPrice: 310, targetPriceOrig: 310,
    livePrice: 220.84, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Cloud / Database / AI Infrastructure', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/OracleCorporation.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  },
  NOW: {
    ticker: 'NOW', name: 'ServiceNow Inc.',
    rating: 'BUY', priority: 'watchlist',
    sqScore: 9, sqScoreOrig: 9,
    dislocationScore: 7, dislocationOrig: 6,
    targetPrice: 230, targetPriceOrig: 230,
    livePrice: 119.0, livePxChange: 0, week52High: 0, week52Low: 0,
    sector: 'Enterprise SaaS / AI Workflow', exchange: 'NYSE', currency: 'USD',
    sheetFile: 'New Company Sheets/ServiceNow.html',
    _embeddedAt: '2026-06-06T00:00:00Z'
  }
};

/* ── PRIORITY PERSISTENCE (independent of live-price localStorage) */
(function loadPriorities() {
  try {
    var raw = localStorage.getItem('wl_priorities');
    if (!raw) return;
    var saved = JSON.parse(raw);
    Object.keys(saved).forEach(function(ticker) {
      if (STOCKS[ticker]) STOCKS[ticker].priority = saved[ticker];
    });
  } catch (e) {}
})();

function savePriorities() {
  var out = {};
  Object.keys(STOCKS).forEach(function(t) { out[t] = STOCKS[t].priority || 'watchlist'; });
  try { localStorage.setItem('wl_priorities', JSON.stringify(out)); } catch (e) {}
}

function setPriorityForTicker(ticker, priority) {
  if (!STOCKS[ticker]) return;
  STOCKS[ticker].priority = priority;
  savePriorities();
  // Re-apply filters so priority-based filter chips update counts
  try { applyAllFilters(); } catch (e) {}
}

/* ── OPEN COMPANY TEARSHEET (embedded inline — no iframe) ───────
   Each company sheet is embedded as a hidden <div id="sheet-TTD">
   inside #sheetContent in index.html. openCard shows the right one.
─────────────────────────────────────────────────────────────────── */
function openCard(ticker) {
  var s = STOCKS[ticker];
  if (!s) return;

  var overlay = document.getElementById('sheetOverlay');
  var frame   = document.getElementById('sheetFrame');
  if (!overlay || !frame) return;

  var safeId = 'sheet-' + ticker.replace(/\./g, '_');
  var tmpl   = document.getElementById(safeId);
  var errEl  = document.getElementById('sheetError');

  if (tmpl) {
    // Preferred: embedded <template> — load via srcdoc (works offline/file://)
    if (errEl) errEl.style.display = 'none';
    frame.style.display = '';
    frame.src = 'about:blank';
    frame.srcdoc = tmpl.innerHTML;
  } else if (s.sheetFile) {
    // Fallback: external HTML file referenced by sheetFile path
    // srcdoc takes priority over src per HTML spec, so remove it first
    if (errEl) errEl.style.display = 'none';
    frame.style.display = '';
    frame.removeAttribute('srcdoc');
    frame.src = s.sheetFile;
  } else {
    frame.style.display = 'none';
    if (errEl) { errEl.style.display = 'flex'; }
  }

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  var label = document.getElementById('sheetLabel');
  if (label) label.textContent = s.name + ' · ' + ticker;
}

function hideSheet() {
  var overlay = document.getElementById('sheetOverlay');
  var frame   = document.getElementById('sheetFrame');
  if (overlay) overlay.style.display = 'none';
  if (frame)   frame.src = 'about:blank';
  document.body.style.overflow = '';
}

function closeCard() { hideSheet(); }

/* ── ROW HTML ────────────────────────────────────────────────── */
function _buildRowHTML(s) {
  var ccy  = s.currency === 'HKD' ? 'HK$' : s.currency === 'JPY' ? '¥' : '$';
  var live = s.livePrice || 0;

  // 52-week bar
  var hi  = s.week52High || 0;
  var lo  = s.week52Low  || 0;
  var w52 = (hi > lo && live > 0)
    ? Math.max(0, Math.min(100, (live - lo) / (hi - lo) * 100)).toFixed(0)
    : 50;
  var dotColor = +w52 >= 60 ? 'var(--green)' : +w52 <= 30 ? 'var(--red)' : 'var(--amber)';

  // Colour-coded % formatter — used for Day, 1W, 1M, 5M
  function _fmtPct(val) {
    if (val == null || val === 0) return '<span style="color:var(--text3)">—</span>';
    var cls = val > 0 ? 'px-chg-pos' : 'px-chg-neg';
    return '<span class="' + cls + '">' + (val > 0 ? '+' : '') + val.toFixed(1) + '%</span>';
  }
  var chgStr      = _fmtPct(s.livePxChange || null);
  var chgWeekStr  = _fmtPct(s.chgWeek  != null ? s.chgWeek  : null);
  var chgMonthStr = _fmtPct(s.chgMonth != null ? s.chgMonth : null);
  var chg5mStr    = _fmtPct(s.chg5m    != null ? s.chg5m    : null);

  // PW Target: show "updated (original)" only when they differ
  var target     = s.targetPrice     || 0;
  var origTarget = s.targetPriceOrig || target;
  var targetStr  = target > 0 ? ccy + target.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '—';
  if (origTarget && Math.abs(origTarget - target) > 0.01) {
    targetStr += ' <span style="font-size:9px;color:var(--text3);font-family:\'DM Mono\',monospace">('
      + ccy + origTarget.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
      + ')</span>';
  }

  // Upside to target — same _fmtPct style as performance columns
  var upNum  = (target > 0 && live > 0) ? ((target - live) / live * 100) : null;
  var upStr  = _fmtPct(upNum);

  // SQ / Dislocation — score-coloured badges (green ≥8, amber 6-7, red ≤5)
  function _sc(n) {
    if (n >= 8) return { bg:'var(--green-bg)',  bd:'var(--green-bd)',  tx:'var(--green)'  };
    if (n >= 6) return { bg:'var(--amber-bg)',  bd:'var(--amber-bd)',  tx:'var(--amber)'  };
    return             { bg:'var(--red-bg)',    bd:'var(--red-bd)',    tx:'var(--red)'    };
  }
  function _scoreBadge(label, cur, orig) {
    var c = _sc(cur || 0);
    var badge = '<span style="font-family:\'DM Mono\',monospace;font-size:10px;font-weight:700;'
      + 'padding:2px 8px;border-radius:4px;letter-spacing:.04em;white-space:nowrap;'
      + 'background:' + c.bg + ';color:' + c.tx + ';border:1px solid ' + c.bd + ';">'
      + label + ' ' + (cur != null ? cur : '—') + '</span>';
    var delta = (orig != null && orig !== cur)
      ? '<div style="font-size:8px;color:var(--text3);font-family:\'DM Mono\',monospace;'
        + 'text-align:center;margin-top:2px;letter-spacing:.02em;">was ' + orig + '</div>'
      : '';
    return '<div style="display:inline-flex;flex-direction:column;align-items:center;">'
      + badge + delta + '</div>';
  }
  var sqDisHTML = '<div style="display:inline-flex;align-items:flex-start;gap:5px;">'
    + _scoreBadge('SQ',  s.sqScore,          s.sqScoreOrig)
    + _scoreBadge('Dis', s.dislocationScore, s.dislocationOrig)
    + '</div>';

  // Priority editable dropdown (stops row-click propagation)
  var prio = (s.priority || 'watchlist').toLowerCase();
  var prioSelect = '<select class="prio-pill ' + prio + '"'
    + ' onchange="setPriorityForTicker(\'' + s.ticker + '\', this.value); this.className=\'prio-pill \' + this.value"'
    + ' onclick="event.stopPropagation()">'
    + '<option value="watchlist"'   + (prio === 'watchlist'   ? ' selected' : '') + '>Watchlist</option>'
    + '<option value="bought"'      + (prio === 'bought'      ? ' selected' : '') + '>Bought</option>'
    + '<option value="backburner"'  + (prio === 'backburner'  ? ' selected' : '') + '>Backburner</option>'
    + '</select>';

  // Live price — dim if no data yet
  var pxStr  = live > 0
    ? ccy + live.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
    : '<span style="color:var(--text3)">—</span>';

  return '<td class="ticker-cell">' + s.ticker + '</td>'
    + '<td class="name-cell">' + s.name + '</td>'
    + '<td><span class="rating-badge ' + (s.rating || 'HOLD') + '">' + (s.rating || 'HOLD') + '</span></td>'
    + '<td>' + prioSelect + '</td>'
    + '<td>' + sqDisHTML + '</td>'
    + '<td class="price-mono">' + pxStr + '</td>'
    + '<td class="chg-cell">' + chgStr + '</td>'
    + '<td class="chg-cell">' + chgWeekStr  + '</td>'
    + '<td class="chg-cell">' + chgMonthStr + '</td>'
    + '<td class="chg-cell">' + chg5mStr    + '</td>'
    + '<td>'
      + '<div class="w52-bar-wrap">'
        + '<div class="w52-track">'
          + '<div class="w52-slider-dot" style="left:' + w52 + '%;background:' + dotColor + '"></div>'
        + '</div>'
        + '<div class="w52-pct" style="left:' + w52 + '%">' + w52 + '%</div>'
      + '</div>'
    + '</td>'
    + '<td class="price-mono">' + targetStr + '</td>'
    + '<td class="chg-cell">' + upStr + '</td>'
    + '<td><span class="sector-chip">' + (s.sector || '—') + '</span></td>'
    + '<td style="white-space:nowrap;">' + _fmtMemoDate(s._embeddedAt) + '</td>';
}

/* ── DATE FORMATTER ──────────────────────────────────────────── */
function _fmtMemoDate(iso) {
  if (!iso) return '<span style="color:var(--text3);font-family:\'DM Mono\',monospace;font-size:9px;">—</span>';
  var d = new Date(iso);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var dd  = String(d.getUTCDate()).padStart(2,'0');
  var mmm = months[d.getUTCMonth()];
  var yy  = String(d.getUTCFullYear()).slice(-2);
  return '<span style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--text3);'
    + 'letter-spacing:.04em;white-space:nowrap;">' + dd + '-' + mmm + '-' + yy + '</span>';
}

/* ── THEME MAPPING ────────────────────────────────────────────
   Maps each stock's sector string to one of 6 broad themes.
   Themes are intentionally wide — avoid creating more than 6-7.
─────────────────────────────────────────────────────────────── */
var _THEME_ORDER = [
  'Technology',
  'Internet & Media',
  'Financials',
  'Consumer',
  'Industrials',
  'Healthcare',
  'Other'
];

function _getTheme(sector) {
  if (!sector) return 'Other';
  var s = sector;
  if (/cloud|saas|software|ai infra|cyber|database|developer|govtech|government|semiconductor|data platform|it professional|electronic component|adas|autonomous|enterprise saa/i.test(s))
    return 'Technology';
  if (/internet|streaming|gaming|ad tech|online travel|\bota\b|super app|video platform|search|media|entertainment|consumer.*tech|digital bank|fintech|southeast asia/i.test(s))
    return 'Internet & Media';
  if (/insurance|asset management|payment|banking|exchange|financial data|specialty finance|debt|rating|conglomerate|p&c|p&amp;c|aviation.*financ|leasing/i.test(s))
    return 'Financials';
  if (/retail|restaurant|consumer|food|beauty|travel|leisure|cruise|airline|art toy|toy|grocery|pool/i.test(s))
    return 'Consumer';
  if (/aerospace|defense|electrical|building|logistics|aviation|auto|ev|power management|freight|glass|manufacturing/i.test(s))
    return 'Industrials';
  if (/healthcare|life science|bioprocess|medical|pharma/i.test(s))
    return 'Healthcare';
  return 'Other';
}

/* ── RENDER TABLE ────────────────────────────────────────────── */
var _themeGrouped = true;   // default: group by theme; column sort disables this

function _appendStockRow(tbody, s) {
  var tr = document.createElement('tr');
  tr.setAttribute('data-ticker', s.ticker);
  tr.className = s.rating || 'HOLD';
  tr.innerHTML = _buildRowHTML(s);
  tr.addEventListener('click', function(e) {
    var tag = e.target.tagName;
    if (tag !== 'BUTTON' && tag !== 'SELECT' && tag !== 'OPTION') openCard(s.ticker);
  });
  tbody.appendChild(tr);
}

function renderTable() {
  var tbody = document.getElementById('watchlistBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (_themeGrouped) {
    // Group stocks by broad theme, preserving insertion order within each group
    var groups = {};
    _THEME_ORDER.forEach(function(t) { groups[t] = []; });
    Object.values(STOCKS).forEach(function(s) {
      var t = _getTheme(s.sector);
      if (!groups[t]) groups[t] = [];
      groups[t].push(s);
    });

    _THEME_ORDER.forEach(function(theme) {
      var stocks = groups[theme];
      if (!stocks || stocks.length === 0) return;
      // Theme divider row
      var divTr = document.createElement('tr');
      divTr.className = 'theme-divider-row';
      divTr.setAttribute('data-divider', theme);
      divTr.innerHTML = '<td colspan="15" class="theme-divider-cell">' + theme + '</td>';
      tbody.appendChild(divTr);
      // Stock rows
      stocks.forEach(function(s) { _appendStockRow(tbody, s); });
    });
  } else {
    Object.values(STOCKS).forEach(function(s) { _appendStockRow(tbody, s); });
  }

  _updateHeaderStats();
}

function _updateHeaderStats() {
  var all = Object.values(STOCKS);
  var el;
  el = document.getElementById('stockCount');   if (el) el.textContent = all.length;
  el = document.getElementById('statBuys');     if (el) el.textContent = all.filter(function(s) { return s.rating === 'BUY'; }).length;

  var withTarget = all.filter(function(s) { return s.targetPrice > 0 && s.livePrice > 0; });
  var avg = withTarget.length
    ? withTarget.reduce(function(a, s) { return a + (s.targetPrice - s.livePrice) / s.livePrice * 100; }, 0) / withTarget.length
    : 0;
  el = document.getElementById('statAvgUpside');
  if (el) el.textContent = (avg > 0 ? '+' : '') + avg.toFixed(0) + '%';
}

/* ── UPDATE A SINGLE ROW ─────────────────────────────────────── */
function updateTableRow(s) {
  var tbody = document.getElementById('watchlistBody');
  if (!tbody) return;
  var tr = tbody.querySelector('tr[data-ticker="' + s.ticker + '"]');
  if (!tr) return;
  tr.className = s.rating || 'HOLD';
  tr.innerHTML = _buildRowHTML(s);
  tr.addEventListener('click', function(e) {
    var tag = e.target.tagName;
    if (tag !== 'BUTTON' && tag !== 'SELECT' && tag !== 'OPTION') openCard(s.ticker);
  });
  _updateHeaderStats();
  try { applyAllFilters(); } catch (e) {}
}

/* ── SORT TABLE ──────────────────────────────────────────────── */
var _sortCol = -1;
var _sortAsc  = true;

function sortTable(col) {
  col = parseInt(col, 10);
  var tbody = document.getElementById('watchlistBody');
  if (!tbody) return;
  _sortAsc = (_sortCol === col) ? !_sortAsc : true;
  _sortCol = col;

  var colFns = {
    0: function(s) { return s.ticker || ''; },
    1: function(s) { return s.name || ''; },
    2: function(s) { return s.rating || ''; },
    3: function(s) { return (s.sqScore || 0) + (s.dislocationScore || 0); },
    4: function(s) { return s.livePrice || 0; },
    5: function(s) { return s.livePxChange || 0; },
    6: function(s) {
         var h = s.week52High || 0, l = s.week52Low || 0, p = s.livePrice || 0;
         return h > l ? (p - l) / (h - l) : 0.5;
       },
    7: function(s) { return s.targetPrice || 0; },
    8: function(s) { var t = s.targetPrice || 0, p = s.livePrice || 0; return (t > 0 && p > 0) ? (t - p) / p : 0; },
    9: function(s) { return s.sector || ''; },
    10: function(s) { return s.chgWeek  != null ? s.chgWeek  : -999; },
    11: function(s) { return s.chgMonth != null ? s.chgMonth : -999; },
    12: function(s) { return s.chg5m    != null ? s.chg5m    : -999; },
    13: function(s) { return s._embeddedAt || ''; }
  };
  var fn  = colFns[col] || function(s) { return s.ticker; };
  var asc = _sortAsc;

  // Column sort: flatten the theme grouping (remove divider rows, re-render flat)
  if (_themeGrouped) {
    _themeGrouped = false;
    tbody.innerHTML = '';
    Object.values(STOCKS).forEach(function(s) { _appendStockRow(tbody, s); });
  }

  var rows = Array.from(tbody.querySelectorAll('tr[data-ticker]'));
  rows.sort(function(a, b) {
    var sa = STOCKS[a.getAttribute('data-ticker')];
    var sb = STOCKS[b.getAttribute('data-ticker')];
    if (!sa || !sb) return 0;
    var va = fn(sa), vb = fn(sb);
    return typeof va === 'string'
      ? (asc ? va.localeCompare(vb) : vb.localeCompare(va))
      : (asc ? va - vb : vb - va);
  });
  rows.forEach(function(tr) { tbody.appendChild(tr); });

  document.querySelectorAll('#theadRow .sort-icon').forEach(function(el) { el.textContent = '⇅'; });
  var icon = document.querySelector('#theadRow th[data-col="' + col + '"] .sort-icon');
  if (icon) icon.textContent = asc ? '↑' : '↓';
}

/* ── COUNTRY TABS ────────────────────────────────────────────── */
function buildCountryTabs() {
  var bar = document.getElementById('countryTabBar');
  if (!bar) return;
  var counts = {};
  Object.values(STOCKS).forEach(function(s) {
    var c = _getCountry(s);
    counts[c] = (counts[c] || 0) + 1;
  });
  var total = Object.values(STOCKS).length;
  var html = '<button class="country-tab active" data-country="all" onclick="_setCountryTab(this,\'all\')">'
    + 'All <span class="tab-count">' + total + '</span></button>';
  Object.entries(counts).forEach(function(kv) {
    html += '<button class="country-tab" data-country="' + kv[0] + '" onclick="_setCountryTab(this,\'' + kv[0].replace(/'/g, "\\'") + '\')">'
      + kv[0] + ' <span class="tab-count">' + kv[1] + '</span></button>';
  });
  bar.innerHTML = html;
}

function _getCountry(stock) {
  if (!stock) return 'Other';
  var ex = (stock.exchange || '').toUpperCase();
  var cy = (stock.currency || '').toUpperCase();
  var t  = (stock.ticker   || '').toUpperCase();
  if (ex === 'HKEX' || cy === 'HKD' || /\.HK$/.test(t)) return 'Hong Kong / China';
  if (ex === 'NYSE' || ex === 'NASDAQ' || ex === 'NASDAQ-GS' || cy === 'USD') return 'United States';
  if (ex === 'LSE'  || cy === 'GBP') return 'United Kingdom';
  if (ex === 'TSE'  || cy === 'JPY') return 'Japan';
  if (ex === 'SGX'  || cy === 'SGD') return 'Singapore';
  if (ex === 'KRX'  || cy === 'KRW') return 'Korea';
  if (ex === 'ASX'  || cy === 'AUD') return 'Australia';
  if (ex === 'EURONEXT' || cy === 'EUR') return 'Europe';
  return 'Other';
}

var _activeCountry  = 'all';
var _activePriority = 'all';

function _setCountryTab(btn, country) {
  document.querySelectorAll('.country-tab').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  _activeCountry = country;
  applyAllFilters();
}

/* ── PRIORITY FILTER CHIPS ───────────────────────────────────── */
function setPriorityFilter(p) {
  _activePriority = p;
  ['all', 'bought', 'watchlist', 'backburner'].forEach(function(id) {
    var btn = document.getElementById('pf-' + id);
    if (btn) btn.classList.toggle('pf-active', id === p);
  });
  applyAllFilters();
}

/* ── UNIFIED FILTER ──────────────────────────────────────────── */
function applyAllFilters() {
  var q      = ((document.getElementById('searchInput') || {}).value || '').toLowerCase().trim();
  var ratingEl = document.querySelector('.rating-chip.active');
  var rating   = ratingEl ? (ratingEl.getAttribute('data-rating') || 'all') : 'all';
  var prio     = _activePriority  || 'all';
  var country  = _activeCountry   || 'all';

  var tbody = document.getElementById('watchlistBody');
  if (!tbody) return;
  var visible = 0, total = 0;

  Array.from(tbody.querySelectorAll('tr[data-ticker]')).forEach(function(tr) {
    total++;
    var s = STOCKS[tr.getAttribute('data-ticker')];
    if (!s) { tr.style.display = 'none'; return; }
    var show = true;
    if (q && !s.ticker.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) show = false;
    if (rating !== 'all' && s.rating !== rating) show = false;
    if (prio   !== 'all' && (s.priority || 'watchlist').toLowerCase() !== prio) show = false;
    if (country !== 'all' && _getCountry(s) !== country) show = false;
    tr.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  var fc = document.getElementById('filterCount');
  if (fc) fc.textContent = visible === total
    ? total + ' positions'
    : visible + ' of ' + total + ' shown';
  var pc = document.getElementById('priorityCount');
  if (pc && prio !== 'all') {
    pc.textContent = Object.values(STOCKS).filter(function(s) {
      return (s.priority || 'watchlist').toLowerCase() === prio;
    }).length + ' ' + prio;
  } else if (pc) { pc.textContent = ''; }
}

/* ── PRICE STRING (paste-in manual update) ───────────────────── */
function applyPriceString() {
  var raw = (document.getElementById('priceInput') || {}).value || '';
  raw.split(/[\n,;]+/).forEach(function(line) {
    line = line.trim();
    if (!line) return;
    var m = line.match(/^([A-Z.]+)\s+([\d.]+)\s*([+-][\d.]+%?)?/i);
    if (!m) return;
    var ticker = m[1].toUpperCase();
    var price  = parseFloat(m[2]);
    var chg    = m[3] ? parseFloat(m[3].replace('%', '')) : null;
    if (!STOCKS[ticker] || isNaN(price)) return;
    STOCKS[ticker].livePrice = price;
    if (chg !== null) STOCKS[ticker].livePxChange = chg;
    updateTableRow(STOCKS[ticker]);
  });
}

// Robust CSV row parser — handles quoted fields containing commas
function parseCSVRow(line) {
  const result = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      result.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

/* ── REFRESH ALL PRICES — fetch published CSV (works from file://) ── */
async function refreshAllPrices() {
  const btn    = document.getElementById('refreshAllBtn');
  const icon   = document.getElementById('refreshAllIcon');
  const status = document.getElementById('refreshAllStatus');

  if (btn)  { btn.disabled = true; }
  if (icon) icon.classList.add('spin-anim');
  if (status) { status.style.color = 'var(--text3)'; status.textContent = 'Fetching…'; }

  try {
    let csv = null;

    // Direct fetch from published CSV — works when sheet is published to web
    const directUrl = SHEET_CSV_URL + '&cachebust=' + Date.now();
    try {
      const r = await fetch(directUrl, { cache: 'no-store', mode: 'cors' });
      if (r.ok) {
        const t = await r.text();
        if (t && t.includes(',') && t.split('\n').length >= 2) csv = t;
      }
    } catch(e) {}

    // Fallback: Apps Script web app
    if (!csv && APPS_SCRIPT_URL) {
      try {
        const r = await fetch(APPS_SCRIPT_URL + '?cachebust=' + Date.now(), {
          cache: 'no-store', redirect: 'follow', mode: 'cors',
        });
        if (r.ok) { const json = await r.json(); if (json && json.csv) csv = json.csv; }
      } catch(e) {}
    }

    if (!csv || csv.split('\n').length < 2 || !csv.includes(',')) {
      throw new Error('Sheet fetch failed — ensure the sheet is published to web (File → Share → Publish to web).');
    }

    const allLines = csv.trim().split('\n');
    if (allLines.length < 2) throw new Error('Sheet has no data rows (' + allLines.length + ' line(s))');

    // Auto-detect header row
    const HEADER_KEYWORDS = ['ticker','symbol','price','last','change','market','52','name','company'];
    let headerRowIdx = 0;
    for (let li = 0; li < Math.min(10, allLines.length); li++) {
      const cells = parseCSVRow(allLines[li]).map(c => c.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
      if (cells.some(c => HEADER_KEYWORDS.some(k => c.includes(k)))) { headerRowIdx = li; break; }
      const upper = parseCSVRow(allLines[li]).map(c => c.toUpperCase().trim());
      if (upper.some(v => STOCKS[v])) { headerRowIdx = Math.max(0, li - 1); break; }
    }

    const headers = parseCSVRow(allLines[headerRowIdx]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim());
    const rows    = allLines.slice(headerRowIdx + 1).map(l => parseCSVRow(l)).filter(r => r.some(c => c.trim()));

    const findCol = (...keywords) => {
      for (let i = 0; i < headers.length; i++) {
        if (keywords.every(k => headers[i].includes(k))) return i;
      }
      return -1;
    };

    const col = {
      ticker  : findCol('ticker') !== -1 ? findCol('ticker') : findCol('symbol'),
      price   : findCol('price')  !== -1 ? findCol('price')  : findCol('last'),
      high52  : (() => { for(let i=0;i<headers.length;i++) { if(headers[i].includes('52')&&headers[i].includes('high')&&!headers[i].includes('low')) return i; } for(let i=0;i<headers.length;i++) { if(headers[i].includes('high')&&!headers[i].includes('low')) return i; } return -1; })(),
      low52   : (() => { for(let i=0;i<headers.length;i++) { if(headers[i].includes('52')&&headers[i].includes('low')&&!headers[i].includes('high')) return i; } for(let i=0;i<headers.length;i++) { if(headers[i].includes('low')&&!headers[i].includes('high')) return i; } return -1; })(),
      range52 : (() => { for(let i=0;i<headers.length;i++) { const h=headers[i]; if(h.includes('52')&&h.includes('high')&&h.includes('low')) return i; if(h.includes('52')&&h.includes('range')) return i; } return -1; })(),
      pxchg   : (() => { for(let i=0;i<headers.length;i++) { const h=headers[i]; if((h.includes('change')||h.includes('chg'))&&!h.includes('52')) return i; } return -1; })(),
      mktcap  : findCol('market') !== -1 ? findCol('market') : findCol('cap'),
    };

    // Override with explicit column-letter positions from SHEET_COLS
    const L = c => c.toUpperCase().charCodeAt(0) - 65;
    col.price    = L(SHEET_COLS.price);
    col.pxchg    = L(SHEET_COLS.chgDay);
    col.chgWeek  = L(SHEET_COLS.chgWeek);
    col.chgMonth = L(SHEET_COLS.chgMonth);
    col.chg5m    = L(SHEET_COLS.chg5m);

    if (col.ticker < 0) {
      for (let c = 0; c < Math.min(5, (rows[0]||[]).length); c++) {
        const sampleVals = rows.slice(0,8).map(r => (r[c]||'').toUpperCase().trim());
        if (sampleVals.filter(v => STOCKS[v]).length >= 2) { col.ticker = c; break; }
      }
    }
    if (col.ticker < 0) throw new Error('Cannot find ticker column. Headers: [' + headers.join(' | ') + ']');
    if (col.price  < 0) throw new Error('Cannot find price column. Headers: ['  + headers.join(' | ') + ']');

    const parseNum = v => {
      if (v === undefined || v === null || v === '') return null;
      const n = parseFloat(String(v).replace(/[,$%\s]/g, ''));
      return isNaN(n) ? null : n;
    };

    // parsePct: handles three formats from Google Sheets CSV:
    //   1. "4.40%"  — already percentage with sign  → return n as-is
    //   2. 0.044    — true decimal fraction (Sheets stores % cells this way in some exports) → × 100
    //   3. 4.4      — plain number already in pct form (manual entry or GOOGLEFINANCE) → return as-is
    // Heuristic for case 2 vs 3: |n| < 1 means decimal fraction → multiply by 100.
    // Edge case: genuine sub-1% values (e.g. 0.5%) stored as 0.005 → also caught correctly.
    const parsePct = v => {
      if (v === undefined || v === null || v === '') return null;
      const s = String(v);
      const n = parseFloat(s.replace(/[,$\s]/g, '').replace('%', ''));
      if (isNaN(n)) return null;
      if (s.includes('%')) return n;          // already formatted as "4.40%" — use directly
      if (n !== 0 && Math.abs(n) < 1) return n * 100;  // decimal fraction like 0.044 → 4.4%
      return n;                               // already in pct form like 4.4 → 4.4%
    };

    // Resolve "EXCHANGE:TICKER" or plain "TICKER" -> STOCKS key
    // Build name → STOCKS key lookup for name-based fallback
    const nameToKey = {};
    for (const [key, s] of Object.entries(STOCKS)) {
      if (s.name) nameToKey[s.name.toLowerCase().trim()] = key;
    }

    // Detect name column
    const colName = (() => {
      for (let i = 0; i < headers.length; i++) {
        if (headers[i].includes('name') || headers[i].includes('company') || headers[i].includes('security')) return i;
      }
      return -1;
    })();

    // Primary: ticker code (with exchange-prefix stripping + HK zero-padding)
    // Fallback: company name substring match against STOCKS[].name
    function resolveTicker(rawTicker, rawName) {
      let t = (rawTicker || '').toUpperCase().trim();
      if (!t) return null;

      // 1. Direct match
      if (STOCKS[t]) return t;

      // 2. Strip exchange prefix  e.g. "NYSE:DIS" → "DIS"
      const noPrefix = t.replace(/^(NYSE|NASDAQ|AMEX|HKEX|HKG|HK|LON|TSX|ASX)[:\-\.\s]/, '');
      if (STOCKS[noPrefix]) return noPrefix;

      // 3. Strip leading zeros  e.g. "0285" → "285"
      const stripped = noPrefix.replace(/^0+/, '');
      if (STOCKS[stripped]) return stripped;

      // 4. HK numeric variants  e.g. "285" → "285.HK"
      for (const c of [noPrefix + '.HK', stripped + '.HK', noPrefix + '.T', stripped + '.T']) {
        if (STOCKS[c]) return c;
      }

      // 5. Name fallback — only if a name column exists in the sheet
      if (rawName) {
        const nl = rawName.toLowerCase().trim();
        if (nameToKey[nl]) return nameToKey[nl];
        // Substring match: sheet name contains or is contained by stock name
        for (const [sName, sKey] of Object.entries(nameToKey)) {
          if (nl.length > 3 && (sName.includes(nl) || nl.includes(sName))) return sKey;
        }
      }

      return null;
    }

    let updated = 0;
    const skipped = [];
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const rawTicker = (row[col.ticker] || '').trim();
      if (!rawTicker) continue;
      const rawName   = colName >= 0 ? (row[colName] || '').trim() : '';
      const resolvedKey = resolveTicker(rawTicker, rawName);
      if (!resolvedKey) { skipped.push(rawTicker); continue; }

      const s = STOCKS[resolvedKey];
      const price = parseNum(row[col.price]);
      console.log('[sheet]', rawTicker, rawName ? '('+rawName+')' : '', '→', resolvedKey, '| price raw:', row[col.price], '| parsed:', price);
      if (price && price > 0.01) s.livePrice = price;

      if (col.high52  >= 0) { const v = parseNum(row[col.high52]);  if (v && v > 0) s.week52High = v; }
      if (col.low52   >= 0) { const v = parseNum(row[col.low52]);   if (v && v > 0) s.week52Low  = v; }
      if (col.range52 >= 0 && row[col.range52]) {
        const parts = String(row[col.range52]).split(/[-–\/|]/).map(p => parseFloat(p.replace(/[,$]/g,'')));
        const vp = parts.filter(p => !isNaN(p) && p > 0);
        if (vp.length >= 2) { s.week52Low = Math.min(...vp); s.week52High = Math.max(...vp); }
      }
      if (col.mktcap   >= 0) { const v = parseNum(row[col.mktcap]);   if (v && v > 0) s.liveMarketCap = v; }
      if (col.pxchg    >= 0) { const v = parsePct(row[col.pxchg]);    if (v != null)  s.livePxChange  = v; }
      if (col.chgWeek  >= 0) { const v = parsePct(row[col.chgWeek]);  if (v != null)  s.chgWeek       = v; }
      if (col.chgMonth >= 0) { const v = parsePct(row[col.chgMonth]); if (v != null)  s.chgMonth      = v; }
      if (col.chg5m    >= 0) { const v = parsePct(row[col.chg5m]);    if (v != null)  s.chg5m         = v; }

      updateTableRow(s);
      updated++;
    }

    const now = new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });
    if (updated === 0) throw new Error('No matching tickers found.' + (skipped.length ? ' Sheet had: ' + skipped.slice(0,6).join(', ') : ''));
    const skipNote = skipped.length ? ' · ' + skipped.length + ' skipped' : '';
    if (status) { status.style.color = skipped.length ? 'var(--amber)' : 'var(--green)'; status.textContent = '✓ ' + updated + ' updated · ' + now + skipNote; }

  } catch(e) {
    console.error('refreshAllPrices error:', e);
    if (status) { status.style.color = 'var(--red)'; status.textContent = '✗ ' + e.message.substring(0, 100); }
  }

  if (icon) icon.classList.remove('spin-anim');
  if (btn)  btn.disabled = false;
}

/* ── LIVE REFRESH stub (AI assessment now lives in tearsheet) ── */
async function liveRefresh() {
  var btn = document.getElementById('refreshBtn');
  if (btn) {
    btn.classList.add('loading');
    await new Promise(function(r) { setTimeout(r, 300); });
    btn.classList.remove('loading');
    var status = document.getElementById('lastRefreshed');
    if (status) status.textContent = 'Open the tearsheet for the latest AI assessment';
  }
}
