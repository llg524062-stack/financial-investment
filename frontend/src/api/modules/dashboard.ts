import { httpGet } from '@/api/request';
import { asArray } from '@/utils/apiNormalize';
import type { MarketIndexPeriod } from '@/types/market';

const EMPTY_INDEX_PERIOD: MarketIndexPeriod = {
  labels: [],
  sp500: [100],
  nasdaq: [100],
  csi300: [100],
  insight: '暂无指数数据，请确认后端已同步',
};

export interface ForecastScenario {
  name: string;
  probability: number;
  target_range: string;
  drivers: string;
}

export interface SymbolDashboard {
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  verdict: string;
  verdict_level: 'buy' | 'caution' | 'hold' | 'avoid';
  summary: string;
  score: number;
  dimensions: Record<string, number>;
  forecast_scenarios: ForecastScenario[];
  insight: string;
  checklist?: { item: string; status: string; detail: string }[];
  trend_human?: string;
  valuation_text?: string;
  ai_points?: ({ tag: string; text: string } | string)[];
  history_events?: { period: string; event: string; reaction: string; lesson: string }[];
  peer_heatmap?: { name: string; change: number; level: number }[];
  price_cards?: { label: string; value: string; type?: string; source?: string }[];
  composite_advice?: string;
  insight_source?: 'rules' | 'llm';
  llm_status?: 'ok' | 'disabled' | 'unavailable' | 'parse_failed';
  history_from_news?: boolean;
  data_ready?: boolean;
  inline_alerts?: {
    id: string;
    level: string;
    icon: string;
    title: string;
    description: string;
    suggestion: string;
  }[];
}

export interface QuoteBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchSymbolDashboard(symbol: string): Promise<SymbolDashboard> {
  return httpGet<SymbolDashboard>(`/symbol/${symbol}/dashboard`);
}

export async function fetchSymbolQuotes(symbol: string, period = '3m'): Promise<QuoteBar[]> {
  return httpGet<QuoteBar[]>(`/symbol/${symbol}/quotes`, { params: { period } });
}

export async function fetchIndexSeries(period: string): Promise<MarketIndexPeriod> {
  try {
    const raw = await httpGet<unknown>('/market/index-series', { params: { period }, useCache: true });
    if (!raw || typeof raw !== 'object') return EMPTY_INDEX_PERIOD;
    const p = raw as MarketIndexPeriod;
    return {
      labels: asArray(p.labels),
      sp500: asArray(p.sp500, [100]),
      nasdaq: asArray(p.nasdaq, [100]),
      csi300: asArray(p.csi300, [100]),
      insight: typeof p.insight === 'string' ? p.insight : EMPTY_INDEX_PERIOD.insight,
    };
  } catch {
    return EMPTY_INDEX_PERIOD;
  }
}
