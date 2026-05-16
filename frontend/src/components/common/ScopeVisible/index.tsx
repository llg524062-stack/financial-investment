import type { ReactNode } from 'react';
import { useAppStore } from '@/store/appStore';
import type { MarketScope } from '@/types/market';

interface ScopeVisibleProps {
  scope: MarketScope;
  children: ReactNode;
}

/** Show children only when current scope matches */
export function ScopeVisible({ scope, children }: ScopeVisibleProps) {
  const current = useAppStore((s) => s.scope);
  if (current !== scope) return null;
  return <>{children}</>;
}
