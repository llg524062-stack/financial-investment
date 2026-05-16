import type { ReactNode } from 'react';
import { PickSymbolPrompt } from '@/components/business/PickSymbolPrompt';
import { useCurrentSymbol } from '@/hooks/useCurrentSymbol';

interface SymbolScopedPageProps {
  children: (symbol: string) => ReactNode;
  promptTitle?: string;
}

/** 仅在个股态下渲染子内容，否则显示选股引导 */
export function SymbolScopedPage({ children, promptTitle }: SymbolScopedPageProps) {
  const { isSymbolMode, symbol } = useCurrentSymbol();
  if (!isSymbolMode || !symbol) {
    return <PickSymbolPrompt title={promptTitle} />;
  }
  return <>{children(symbol)}</>;
}
