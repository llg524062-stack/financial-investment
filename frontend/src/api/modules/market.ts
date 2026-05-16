import { httpGet } from '@/api/request';
import { asArray } from '@/utils/apiNormalize';
import type { AlertItem, IndexCard, StockRowItem, SymbolInfo } from '@/types/market';

export async function fetchIndexCards(): Promise<IndexCard[]> {
  try {
    return asArray<IndexCard>(await httpGet<unknown>('/market/indices', { useCache: true }));
  } catch {
    return [];
  }
}

export async function fetchWatchlist(): Promise<StockRowItem[]> {
  try {
    return asArray<StockRowItem>(await httpGet<unknown>('/market/watchlist'));
  } catch {
    return [];
  }
}

export async function fetchAlerts(
  scope: 'market' | 'symbol',
  symbol?: string | null,
): Promise<AlertItem[]> {
  try {
    return asArray<AlertItem>(
      await httpGet<unknown>('/market/alerts', {
        params: { scope, symbol: symbol ?? undefined },
      }),
    );
  } catch {
    return [];
  }
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
