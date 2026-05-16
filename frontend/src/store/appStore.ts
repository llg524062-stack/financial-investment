import { create } from 'zustand';
import type { MarketScope } from '@/types/market';

interface AppState {
  scope: MarketScope;
  currentSymbol: string | null;
  searchValue: string;
  globalLoading: boolean;
  setScopeMarket: () => void;
  setScopeSymbol: (symbol: string, display?: string) => void;
  setSearchValue: (v: string) => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  scope: 'market',
  currentSymbol: null,
  searchValue: '',
  globalLoading: false,
  setScopeMarket: () => set({ scope: 'market', currentSymbol: null, searchValue: '' }),
  setScopeSymbol: (symbol, display) =>
    set({
      scope: 'symbol',
      currentSymbol: symbol,
      searchValue: display ?? symbol,
    }),
  setSearchValue: (searchValue) => set({ searchValue }),
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
}));
