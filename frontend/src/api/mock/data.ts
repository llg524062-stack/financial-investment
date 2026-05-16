import type { AlertItem, IndexCard, MarketIndexPeriod, StockRowItem, SymbolInfo } from '@/types/market';

export const SYMBOL_DB: Record<string, SymbolInfo> = {
  NVDA: { code: 'NVDA', name: '英伟达', display: 'NVDA · 英伟达' },
  MSFT: { code: 'MSFT', name: '微软', display: 'MSFT · 微软' },
  AAPL: { code: 'AAPL', name: '苹果', display: 'AAPL · 苹果' },
  TSLA: { code: 'TSLA', name: '特斯拉', display: 'TSLA · 特斯拉' },
  '600519': { code: '600519', name: '贵州茅台', display: '600519 · 贵州茅台' },
};

export const INDEX_CARDS: IndexCard[] = [
  { label: '标普 500', value: '5,842', change: '+0.6%', changeType: 'up', meta: '美股大盘 · 温和上涨' },
  { label: '纳斯达克', value: '18,456', change: '+0.9%', changeType: 'up', meta: '科技股偏强' },
  { label: '沪深 300', value: '3,892', change: '+0.3%', changeType: 'up', meta: 'A股 · 震荡偏多' },
  { label: '市场温度', value: '62', change: '偏热', changeType: 'warn', meta: '综合估值与情绪' },
];

export const WATCHLIST: StockRowItem[] = [
  { symbol: 'NVDA', name: '英伟达', change: '+2.3%', changeType: 'up', score: 72, scoreLabel: '谨慎偏多', scoreType: 'warn' },
  { symbol: 'MSFT', name: '微软', change: '+1.1%', changeType: 'up', score: 78, scoreLabel: '偏多', scoreType: 'up' },
  { symbol: 'AAPL', name: '苹果', change: '-0.4%', changeType: 'down', score: 65, scoreLabel: '中性', scoreType: 'neutral' },
  { symbol: 'TSLA', name: '特斯拉', change: '-3.2%', changeType: 'down', score: 48, scoreLabel: '观望', scoreType: 'down' },
];

export const MARKET_ALERTS: AlertItem[] = [
  {
    id: 'm1',
    level: 'warning',
    icon: '⚠',
    title: '【市场】VIX 恐慌指数单周升 8%',
    description: '全市场波动加大，建议降低追高意愿。',
    suggestion: '股票总仓位不超过 60%，单只不超过 20%。',
    scope: 'market',
  },
  {
    id: 'm2',
    level: 'info',
    icon: 'ℹ',
    title: '【市场】5月22日 美联储会议纪要',
    description: '宏观事件，影响所有成长股估值。',
    suggestion: '事件前避免大额加仓。',
    scope: 'market',
  },
];

export const SYMBOL_ALERTS: AlertItem[] = [
  {
    id: 's1',
    level: 'critical',
    icon: '🔴',
    title: '【紧急】30 天涨幅 18% — 短期涨太猛',
    description: '触发：30 日涨幅 > 15%。',
    suggestion: '不追高；等回调后分批进场。',
    scope: 'symbol',
  },
  {
    id: 's2',
    level: 'warning',
    icon: '⚠',
    title: '【警告】估值高于行业均值 113%',
    description: '触发：PE > 行业中位数 ×1.5。',
    suggestion: '新买入需更耐心等便宜价。',
    scope: 'symbol',
  },
];

export const MARKET_INDEX_SERIES: Record<string, MarketIndexPeriod> = {
  '1m': {
    labels: ['4/16', '4/23', '4/30', '5/7', '5/14'],
    sp500: [100, 101.2, 99.8, 102.5, 103.8],
    nasdaq: [100, 102.1, 101.5, 104.2, 106.1],
    csi300: [100, 99.2, 98.5, 100.1, 101.2],
    insight:
      '近 1 个月纳指最强（+6.1%），标普跟随（+3.8%），沪深 300 仅微涨（+1.2%）。短线资金仍集中在 AI 产业链。',
  },
  '3m': {
    labels: ['2/16', '3/2', '3/16', '3/30', '4/13', '4/27', '5/11'],
    sp500: [100, 99, 101, 102, 101, 105, 106.2],
    nasdaq: [100, 101, 104, 106, 105, 110, 111.4],
    csi300: [100, 98, 99, 100, 99, 101, 102.8],
    insight:
      '近 3 个月纳指涨幅领先（+11.4%），显著跑赢沪深 300（+2.8%），反映全球资金仍偏好 AI 与科技成长。',
  },
  '6m': {
    labels: ['11月', '12月', '1月', '2月', '3月', '4月', '5月'],
    sp500: [100, 102, 104, 103, 105, 106, 108.5],
    nasdaq: [100, 105, 108, 107, 112, 114, 118.2],
    csi300: [100, 99, 101, 100, 102, 103, 104.1],
    insight: '半年维度纳指 +18.2% 领先，标普 +8.5% 稳健，沪深 300 +4.1% 温和修复。',
  },
  '1y': {
    labels: ['2025Q2', 'Q3', 'Q4', '2026Q1', 'Q2'],
    sp500: [100, 105, 108, 106, 112.4],
    nasdaq: [100, 112, 118, 115, 124.6],
    csi300: [100, 97, 99, 101, 103.5],
    insight: '过去一年纳指 +24.6%、标普 +12.4%，沪深 300 +3.5%，中美市场分化明显。',
  },
};

export const INDEX_META = {
  sp500: { name: '标普 500', color: '#10b981', price: '5,842' },
  nasdaq: { name: '纳斯达克', color: '#3b82f6', price: '18,456' },
  csi300: { name: '沪深 300', color: '#f59e0b', price: '3,892' },
} as const;
