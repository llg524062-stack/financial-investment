import { useAppStore } from '@/store/appStore';

/**
 * 全站「当前标的」状态（与 HTML 原型 body.scope-market / scope-symbol 一致）
 * - scope=market：全市场态，个股页应提示先选股
 * - scope=symbol：currentSymbol 为正在分析的代码
 */
export function useCurrentSymbol() {
  const scope = useAppStore((s) => s.scope);
  const symbol = useAppStore((s) => s.currentSymbol);
  const searchValue = useAppStore((s) => s.searchValue);

  return {
    scope,
    /** 仅在个股态下有值 */
    symbol,
    isSymbolMode: scope === 'symbol',
    isMarketMode: scope === 'market',
    displayLabel: searchValue || symbol || '全市场',
  };
}
