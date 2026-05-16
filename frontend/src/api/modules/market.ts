import { MOCK_DELAY_MS } from '@/utils/constants';
import {
  INDEX_CARDS,
  MARKET_ALERTS,
  MARKET_INDEX_SERIES,
  SYMBOL_ALERTS,
  SYMBOL_DB,
  WATCHLIST,
} from '@/api/mock/data';
import type { AlertItem, IndexCard, MarketIndexPeriod, StockRowItem, SymbolInfo } from '@/types/market';

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), MOCK_DELAY_MS));
}

export async function fetchIndexCards(): Promise<IndexCard[]> {
  if (import.meta.env.VITE_USE_MOCK !== 'false') return delay(INDEX_CARDS);
  const { httpGet } = await import('@/api/request');
  return httpGet<IndexCard[]>('/market/indices', { useCache: true });
}

export async function fetchWatchlist(): Promise<StockRowItem[]> {
  if (import.meta.env.VITE_USE_MOCK !== 'false') return delay(WATCHLIST);
  const { httpGet } = await import('@/api/request');
  return httpGet<StockRowItem[]>('/market/watchlist');
}

export async function fetchAlerts(scope: 'market' | 'symbol'): Promise<AlertItem[]> {
  if (import.meta.env.VITE_USE_MOCK !== 'false') {
    return delay(scope === 'market' ? MARKET_ALERTS : SYMBOL_ALERTS);
  }
  const { httpGet } = await import('@/api/request');
  return httpGet<AlertItem[]>(`/market/alerts?scope=${scope}`);
}

export async function fetchIndexSeries(period: string): Promise<MarketIndexPeriod> {
  if (import.meta.env.VITE_USE_MOCK !== 'false') {
    return delay(MARKET_INDEX_SERIES[period] ?? MARKET_INDEX_SERIES['3m']);
  }
  const { httpGet } = await import('@/api/request');
  return httpGet<MarketIndexPeriod>(`/market/index-series?period=${period}`);
}

export async function resolveSymbol(query: string): Promise<SymbolInfo | null> {
  const key = query.trim().toUpperCase().split(/[·\s]/)[0];
  if (!key) return null;
  if (import.meta.env.VITE_USE_MOCK !== 'false') {
    return delay(SYMBOL_DB[key] ?? { code: key, name: key, display: key });
  }
  const { httpGet } = await import('@/api/request');
  return httpGet<SymbolInfo | null>(`/market/symbol/${key}`);
}

export { SYMBOL_DB };
