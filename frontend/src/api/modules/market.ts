import { httpGet } from '@/api/request';
import type { AlertItem, IndexCard, StockRowItem, SymbolInfo } from '@/types/market';

export async function fetchIndexCards(): Promise<IndexCard[]> {
  return httpGet<IndexCard[]>('/market/indices', { useCache: true });
}

export async function fetchWatchlist(): Promise<StockRowItem[]> {
  return httpGet<StockRowItem[]>('/market/watchlist');
}

export async function fetchAlerts(
  scope: 'market' | 'symbol',
  symbol?: string | null,
): Promise<AlertItem[]> {
  return httpGet<AlertItem[]>('/market/alerts', {
    params: { scope, symbol: symbol ?? undefined },
  });
}

export async function fetchIndexSeries(period: string) {
  const { fetchIndexSeries: fetchFromDashboard } = await import('@/api/modules/dashboard');
  return fetchFromDashboard(period);
}

export async function resolveSymbol(query: string): Promise<SymbolInfo | null> {
  const key = query.trim().toUpperCase().split(/[·\s]/)[0];
  if (!key) return null;
  return httpGet<SymbolInfo | null>(`/market/symbol/${key}`);
}
