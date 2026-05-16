import { create } from 'zustand';
import { QUERY_CACHE_PREFIX } from '@/utils/constants';

interface QueryCacheState {
  cache: Record<string, Record<string, string>>;
  setQuery: (pageKey: string, values: Record<string, string>) => void;
  getQuery: (pageKey: string) => Record<string, string> | undefined;
  clearQuery: (pageKey: string) => void;
}

export const useQueryCacheStore = create<QueryCacheState>((set, get) => ({
  cache: {},
  setQuery: (pageKey, values) => {
    try {
      sessionStorage.setItem(QUERY_CACHE_PREFIX + pageKey, JSON.stringify(values));
    } catch {
      /* ignore */
    }
    set((s) => ({ cache: { ...s.cache, [pageKey]: values } }));
  },
  getQuery: (pageKey) => {
    const mem = get().cache[pageKey];
    if (mem) return mem;
    try {
      const raw = sessionStorage.getItem(QUERY_CACHE_PREFIX + pageKey);
      return raw ? (JSON.parse(raw) as Record<string, string>) : undefined;
    } catch {
      return undefined;
    }
  },
  clearQuery: (pageKey) => {
    sessionStorage.removeItem(QUERY_CACHE_PREFIX + pageKey);
    set((s) => {
      const next = { ...s.cache };
      delete next[pageKey];
      return { cache: next };
    });
  },
}));
