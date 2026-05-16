export type MarketScope = 'market' | 'symbol';

export type PanelKey =
  | 'dashboard'
  | 'alerts'
  | 'ai-insights'
  | 'market'
  | 'fundamental'
  | 'macro'
  | 'news'
  | 'portfolio-sim'
  | 'settings';

export interface SymbolInfo {
  code: string;
  name: string;
  display: string;
}

export interface IndexCard {
  label: string;
  value: string;
  change: string;
  changeType: 'up' | 'down' | 'warn' | 'neutral';
  meta: string;
}

export interface StockRowItem {
  symbol: string;
  name: string;
  change: string;
  changeType: 'up' | 'down';
  score: number;
  scoreLabel: string;
  scoreType: 'up' | 'warn' | 'neutral' | 'down';
}

export interface AlertItem {
  id: string;
  level: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  suggestion: string;
  scope?: 'market' | 'symbol';
}

export interface MarketIndexPeriod {
  labels: string[];
  sp500: number[];
  nasdaq: number[];
  csi300: number[];
  insight: string;
}
