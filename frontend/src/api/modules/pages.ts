import { httpGet, httpPut } from '@/api/request';

export interface MarketPageData {
  symbol: string;
  ohlc: { open: number; high: number; low: number; close: number; volume: number; source?: string };
  kline: { labels: string[]; closes: number[]; source?: string };
  level2: { bids: { price: number; size: number }[]; asks: { price: number; size: number }[]; source?: string };
  options: { strike: number; call_bid: number; call_ask: number; put_bid: number; put_ask: number; iv: string }[];
  options_source?: string;
}

export interface FundamentalPageData {
  symbol: string;
  overview: { label: string; value: string; meta: string; source?: string }[];
  revenue_chart: { labels: string[]; values: number[]; source?: string };
  tables: { income: string[][]; balance: string[][]; cashflow: string[][] };
  table_sources?: Record<string, string>;
  tables_synthetic?: boolean;
}

export interface MacroPageData {
  liquidity: {
    rates: { label: string; value: string; meta: string; source?: string }[];
    yield_curve: { labels: string[]; values: number[]; source?: string };
    money_supply: { labels: string[]; m1: number[]; m2: number[]; source?: string };
  };
  economy: {
    gauge_score: number;
    gauge_label: string;
    gauge_source?: string;
    social_financing: { labels: string[]; values: number[]; source?: string };
    cards: { label: string; value: string; change: string; source?: string }[];
  };
  industry: {
    chip_index: { labels: string[]; values: number[]; source?: string };
    bdi: { value: string; change: string; source?: string };
    commodities: string[][];
    commodities_source?: string;
  };
  fred_configured?: boolean;
}

export interface NewsPageData {
  sentiment_cards: { label: string; value: string; meta: string; source?: string }[];
  timeline: { date: string; title: string; type: string; source?: string }[];
  flash: { time: string; title: string; tag: string; url: string; source?: string }[];
}

export interface InsightsPageData {
  scope: string;
  stock_research: { symbol: string; name: string; verdict: string; score: number; change: string; highlight: string }[];
  sector_radar: { sector: string; heat: string; view: string; symbols: string }[];
  sector_radar_source?: string;
  macro_panel: { title: string; position: string; sectors: string; risk: string; source?: string };
  timeline: { date: string; event: string; impact: string; source?: string }[];
  insight_source?: string;
}

export interface AlertsPageData {
  alerts: { id: string; level: string; icon: string; title: string; description: string; suggestion: string }[];
  monitor_rules: { name: string; explain: string; condition: string; status: string }[];
  monitor_rules_source?: string;
  watchlist_alerts: { symbol: string; name: string; alerts: AlertsPageData['alerts'] }[];
}

export interface PortfolioData {
  holdings: { symbol: string; name: string; shares: number; cost: number; weight: number; price?: number; pnl_pct?: number }[];
  metrics: { sharpe: number; max_drawdown: string; total_return: string };
  performance: { labels: string[]; values: number[] };
  performance_source?: string;
  metrics_source?: string;
}

export interface SettingsPageData {
  categories: { id: string; title: string; subtitle: string; rows: string[][] }[];
}

export interface MarketExtras {
  industry_heatmap: { name: string; change: number; level: number }[];
  industry_heatmap_source?: string;
  market_advice: { position: string; direction: string; action: string };
  market_advice_source?: string;
  environment: { label: string; score: number; desc: string }[];
  environment_source?: string;
}

export async function fetchMarketPage(symbol: string) {
  return httpGet<MarketPageData>(`/pages/market/${symbol}`);
}

export async function fetchFundamentalPage(symbol: string) {
  return httpGet<FundamentalPageData>(`/pages/fundamental/${symbol}`);
}

export async function fetchMacroPage() {
  return httpGet<MacroPageData>('/pages/macro');
}

export async function fetchNewsPage(symbol?: string) {
  return httpGet<NewsPageData>('/pages/news', { params: symbol ? { symbol } : {} });
}

export async function fetchInsightsPage(scope: string, symbol?: string) {
  return httpGet<InsightsPageData>('/pages/insights', { params: { scope, symbol } });
}

export async function fetchAlertsPage(scope: string, symbol?: string) {
  return httpGet<AlertsPageData>('/pages/alerts', { params: { scope, symbol } });
}

export async function fetchMarketExtras() {
  return httpGet<MarketExtras>('/pages/dashboard/market-extras');
}

export async function fetchSettingsPage() {
  return httpGet<SettingsPageData>('/pages/settings');
}

export async function fetchPortfolio() {
  return httpGet<PortfolioData>('/pages/portfolio');
}

export async function savePortfolio(data: PortfolioData) {
  return httpPut<PortfolioData>('/pages/portfolio', data);
}
