import type {
  AlertsPageData,
  FundamentalPageData,
  InsightsPageData,
  MacroPageData,
  MarketExtras,
  MarketPageData,
  NewsPageData,
  PortfolioData,
  SettingsPageData,
} from '@/api/modules/pages';
import { asArray } from '@/utils/apiNormalize';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export const EMPTY_MARKET_PAGE: MarketPageData = {
  symbol: '',
  ohlc: { open: 0, high: 0, low: 0, close: 0, volume: 0, source: 'unavailable' },
  kline: { labels: [], closes: [], source: 'unavailable' },
  level2: { bids: [], asks: [], source: 'unavailable' },
  options: [],
  options_source: 'unavailable',
};

export const EMPTY_NEWS_PAGE: NewsPageData = {
  sentiment_cards: [],
  timeline: [],
  flash: [],
};

export const EMPTY_ALERTS_PAGE: AlertsPageData = {
  alerts: [],
  monitor_rules: [],
  watchlist_alerts: [],
};

export const EMPTY_MACRO_PAGE: MacroPageData = {
  liquidity: {
    rates: [],
    yield_curve: { labels: [], values: [], source: 'unavailable' },
    money_supply: { labels: [], m1: [], m2: [], source: 'unavailable' },
  },
  economy: {
    gauge_score: 0,
    gauge_label: '—',
    gauge_source: 'unavailable',
    social_financing: { labels: [], values: [], source: 'unavailable' },
    cards: [],
  },
  industry: {
    chip_index: { labels: [], values: [], source: 'unavailable' },
    bdi: { value: '—', change: '—', source: 'unavailable' },
    commodities: [],
    commodities_source: 'unavailable',
  },
  fred_configured: false,
};

export const EMPTY_INSIGHTS_PAGE: InsightsPageData = {
  scope: 'market',
  stock_research: [],
  sector_radar: [],
  macro_panel: { title: '—', position: '—', sectors: '—', risk: '—', source: 'unavailable' },
  timeline: [],
};

export const EMPTY_PORTFOLIO: PortfolioData = {
  holdings: [],
  metrics: { sharpe: 0, max_drawdown: '—', total_return: '—' },
  performance: { labels: [], values: [] },
  performance_source: 'unavailable',
  metrics_source: 'unavailable',
};

export const EMPTY_SETTINGS: SettingsPageData = { categories: [] };

export const EMPTY_FUNDAMENTAL: FundamentalPageData = {
  symbol: '',
  overview: [],
  revenue_chart: { labels: [], values: [], source: 'unavailable' },
  tables: { income: [], balance: [], cashflow: [] },
  tables_synthetic: true,
};

export const EMPTY_MARKET_EXTRAS: MarketExtras = {
  industry_heatmap: [],
  industry_heatmap_source: 'unavailable',
  market_advice: { position: '—', direction: '—', action: '—' },
  market_advice_source: 'unavailable',
  environment: [],
  environment_source: 'unavailable',
};

export function normalizeMarketPage(raw: unknown): MarketPageData {
  if (!isRecord(raw)) return { ...EMPTY_MARKET_PAGE };
  const level2 = isRecord(raw.level2) ? raw.level2 : {};
  return {
    symbol: String(raw.symbol ?? ''),
    ohlc: {
      open: Number((raw.ohlc as MarketPageData['ohlc'])?.open ?? 0),
      high: Number((raw.ohlc as MarketPageData['ohlc'])?.high ?? 0),
      low: Number((raw.ohlc as MarketPageData['ohlc'])?.low ?? 0),
      close: Number((raw.ohlc as MarketPageData['ohlc'])?.close ?? 0),
      volume: Number((raw.ohlc as MarketPageData['ohlc'])?.volume ?? 0),
      source: (raw.ohlc as MarketPageData['ohlc'])?.source,
    },
    kline: {
      labels: asArray((raw.kline as MarketPageData['kline'])?.labels),
      closes: asArray((raw.kline as MarketPageData['kline'])?.closes),
      source: (raw.kline as MarketPageData['kline'])?.source,
    },
    level2: {
      bids: asArray(level2.bids as MarketPageData['level2']['bids']),
      asks: asArray(level2.asks as MarketPageData['level2']['asks']),
      source: String(level2.source ?? 'unavailable'),
    },
    options: asArray(raw.options),
    options_source: String(raw.options_source ?? 'unavailable'),
  };
}

export function normalizeNewsPage(raw: unknown): NewsPageData {
  if (!isRecord(raw)) return { ...EMPTY_NEWS_PAGE };
  return {
    sentiment_cards: asArray(raw.sentiment_cards),
    timeline: asArray(raw.timeline),
    flash: asArray(raw.flash),
  };
}

export function normalizeAlertsPage(raw: unknown): AlertsPageData {
  if (!isRecord(raw)) return { ...EMPTY_ALERTS_PAGE };
  const watchlist = asArray<{ symbol?: string; name?: string; alerts?: unknown }>(raw.watchlist_alerts);
  return {
    alerts: asArray(raw.alerts),
    monitor_rules: asArray(raw.monitor_rules),
    monitor_rules_source: raw.monitor_rules_source as string | undefined,
    watchlist_alerts: watchlist.map((w) => ({
      symbol: String(w.symbol ?? ''),
      name: String(w.name ?? ''),
      alerts: asArray(w.alerts),
    })),
  };
}

export function normalizeMacroPage(raw: unknown): MacroPageData {
  if (!isRecord(raw)) return { ...EMPTY_MACRO_PAGE };
  const liq = isRecord(raw.liquidity) ? raw.liquidity : {};
  const eco = isRecord(raw.economy) ? raw.economy : {};
  const ind = isRecord(raw.industry) ? raw.industry : {};
  const yc = isRecord(liq.yield_curve) ? liq.yield_curve : {};
  const chip = isRecord(ind.chip_index) ? ind.chip_index : {};
  const bdi = isRecord(ind.bdi) ? ind.bdi : {};
  return {
    liquidity: {
      rates: asArray(liq.rates),
      yield_curve: {
        labels: asArray(yc.labels as string[]),
        values: asArray(yc.values as number[]),
        source: yc.source as string | undefined,
      },
      money_supply: {
        labels: asArray((liq.money_supply as MacroPageData['liquidity']['money_supply'])?.labels),
        m1: asArray((liq.money_supply as MacroPageData['liquidity']['money_supply'])?.m1),
        m2: asArray((liq.money_supply as MacroPageData['liquidity']['money_supply'])?.m2),
        source: (liq.money_supply as MacroPageData['liquidity']['money_supply'])?.source,
      },
    },
    economy: {
      gauge_score: Number(eco.gauge_score ?? 0),
      gauge_label: String(eco.gauge_label ?? '—'),
      gauge_source: eco.gauge_source as string | undefined,
      social_financing: {
        labels: asArray((eco.social_financing as MacroPageData['economy']['social_financing'])?.labels),
        values: asArray((eco.social_financing as MacroPageData['economy']['social_financing'])?.values),
        source: (eco.social_financing as MacroPageData['economy']['social_financing'])?.source,
      },
      cards: asArray(eco.cards),
    },
    industry: {
      chip_index: {
        labels: asArray(chip.labels as string[]),
        values: asArray(chip.values as number[]),
        source: chip.source as string | undefined,
      },
      bdi: {
        value: String(bdi.value ?? '—'),
        change: String(bdi.change ?? '—'),
        source: bdi.source as string | undefined,
      },
      commodities: asArray<string[]>(ind.commodities),
      commodities_source: ind.commodities_source as string | undefined,
    },
    fred_configured: Boolean(raw.fred_configured),
  };
}

export function normalizeInsightsPage(raw: unknown): InsightsPageData {
  if (!isRecord(raw)) return { ...EMPTY_INSIGHTS_PAGE };
  const panel = isRecord(raw.macro_panel) ? raw.macro_panel : {};
  return {
    scope: String(raw.scope ?? 'market'),
    stock_research: asArray(raw.stock_research),
    sector_radar: asArray(raw.sector_radar),
    sector_radar_source: raw.sector_radar_source as string | undefined,
    macro_panel: {
      title: String(panel.title ?? '—'),
      position: String(panel.position ?? '—'),
      sectors: String(panel.sectors ?? '—'),
      risk: String(panel.risk ?? '—'),
      source: panel.source as string | undefined,
    },
    timeline: asArray(raw.timeline),
    insight_source: raw.insight_source as string | undefined,
  };
}

export function normalizePortfolio(raw: unknown): PortfolioData {
  if (!isRecord(raw)) return { ...EMPTY_PORTFOLIO };
  const metrics = isRecord(raw.metrics) ? raw.metrics : {};
  const perf = isRecord(raw.performance) ? raw.performance : {};
  return {
    holdings: asArray(raw.holdings),
    metrics: {
      sharpe: Number(metrics.sharpe ?? 0),
      max_drawdown: String(metrics.max_drawdown ?? '—'),
      total_return: String(metrics.total_return ?? '—'),
    },
    performance: {
      labels: asArray(perf.labels as string[]),
      values: asArray(perf.values as number[]),
    },
    performance_source: raw.performance_source as string | undefined,
    metrics_source: raw.metrics_source as string | undefined,
  };
}

export function normalizeSettingsPage(raw: unknown): SettingsPageData {
  if (!isRecord(raw)) return { ...EMPTY_SETTINGS };
  const cats = asArray<{ id?: string; title?: string; subtitle?: string; rows?: unknown }>(raw.categories);
  return {
    categories: cats.map((cat) => ({
      id: String(cat.id ?? ''),
      title: String(cat.title ?? ''),
      subtitle: String(cat.subtitle ?? ''),
      rows: asArray<string[]>(cat.rows),
    })),
  };
}

export function normalizeFundamentalPage(raw: unknown): FundamentalPageData {
  if (!isRecord(raw)) return { ...EMPTY_FUNDAMENTAL };
  const tables = isRecord(raw.tables) ? raw.tables : {};
  const rev = isRecord(raw.revenue_chart) ? raw.revenue_chart : {};
  return {
    symbol: String(raw.symbol ?? ''),
    overview: asArray(raw.overview),
    revenue_chart: {
      labels: asArray(rev.labels as string[]),
      values: asArray(rev.values as number[]),
      source: rev.source as string | undefined,
    },
    tables: {
      income: asArray<string[]>(tables.income),
      balance: asArray<string[]>(tables.balance),
      cashflow: asArray<string[]>(tables.cashflow),
    },
    table_sources: raw.table_sources as FundamentalPageData['table_sources'],
    tables_synthetic: Boolean(raw.tables_synthetic),
  };
}

export function normalizeMarketExtras(raw: unknown): MarketExtras {
  if (!isRecord(raw)) return { ...EMPTY_MARKET_EXTRAS };
  const advice = isRecord(raw.market_advice) ? raw.market_advice : {};
  return {
    industry_heatmap: asArray(raw.industry_heatmap),
    industry_heatmap_source: raw.industry_heatmap_source as string | undefined,
    market_advice: {
      position: String(advice.position ?? '—'),
      direction: String(advice.direction ?? '—'),
      action: String(advice.action ?? '—'),
    },
    market_advice_source: raw.market_advice_source as string | undefined,
    environment: asArray(raw.environment),
    environment_source: raw.environment_source as string | undefined,
  };
}
