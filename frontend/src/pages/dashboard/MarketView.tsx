import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchIndexCards, fetchWatchlist, fetchAlerts } from '@/api/modules/market';
import { fetchMarketExtras } from '@/api/modules/pages';
import type { MarketExtras } from '@/api/modules/pages';
import { useAppStore } from '@/store/appStore';
import { MarketIndexChart } from '@/components/business/MarketIndexChart';
import { PageLoading } from '@/components/common/PageLoading';
import type { AlertItem, IndexCard, StockRowItem } from '@/types/market';

const badgeClass = (t: IndexCard['changeType']) =>
  t === 'up' ? 'badge-up' : t === 'down' ? 'badge-down' : t === 'warn' ? 'badge-warn' : 'badge-neutral';

export function MarketView() {
  const navigate = useNavigate();
  const setScopeSymbol = useAppStore((s) => s.setScopeSymbol);
  const [cards, setCards] = useState<IndexCard[]>([]);
  const [watchlist, setWatchlist] = useState<StockRowItem[]>([]);
  const [extras, setExtras] = useState<MarketExtras | null>(null);
  const [alertCount, setAlertCount] = useState(0);
  const [marketAlerts, setMarketAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetchIndexCards(),
      fetchWatchlist(),
      fetchMarketExtras(),
      fetchAlerts('market'),
    ]).then(([c, w, ex, alerts]) => {
      setCards(c);
      setWatchlist(w);
      setExtras(ex);
      setAlertCount(alerts.length);
      setMarketAlerts(alerts);
      setLoading(false);
    });
  }, []);

  const heatCls = (lvl: number) => {
    if (lvl >= 2) return 'heat-up-3';
    if (lvl === 1) return 'heat-up-1';
    if (lvl === 0) return 'heat-flat';
    if (lvl === -1) return 'heat-down-1';
    return 'heat-down-3';
  };

  const pickSymbol = (symbol: string, name: string) => {
    setScopeSymbol(symbol, `${symbol} · ${name}`);
    navigate('/app/dashboard');
  };

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="market-hero">
        <h3>今天市场整体怎么样？</h3>
        <p>
          大盘小幅上涨，科技板块偏强，但估值整体偏高。
          <strong style={{ color: 'var(--text-primary)' }}>
            适合持有优质仓位，新开仓宜精选、不宜追涨。
          </strong>{' '}
          点击下面任意股票可查看「值不值得买」的详细结论。
        </p>
      </div>
      <div className="bento bento-4">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="card-label">{c.label}</div>
            <div className="card-value">
              {c.value} <span className={`badge ${badgeClass(c.changeType)}`}>{c.change}</span>
            </div>
            <div className="card-meta">{c.meta}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-label">大环境一句话</div>
        <div className="dim-grid">
          {(extras?.environment?.length ? extras.environment : [
            { label: '适合买股票吗', score: 62, desc: '可以参与，控制仓位' },
            { label: '建议股票仓位', score: 55, desc: '中性偏积极' },
            { label: '最佳方向', score: 78, desc: 'AI算力、电力设备' },
            { label: '建议回避', score: 35, desc: '地产链、高估值题材' },
          ]).map((e) => (
            <div key={e.label} className="dim-item">
              <div className="dim-score" style={{ color: e.score >= 65 ? 'var(--accent)' : 'var(--warning)' }}>{e.score}</div>
              <div className="dim-label">{e.label}</div>
              <div className="dim-plain">{e.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-label">自选股雷达 · 点击深入分析</div>
          <span className="card-meta">共 {watchlist.length} 只 · {watchlist.filter((w) => w.scoreType === 'warn' || w.scoreType === 'down').length} 只需关注</span>
        </div>
        <div className="quick-picks">
          {['NVDA', 'MSFT', 'AAPL', '600519'].map((s) => (
            <button key={s} type="button" className="quick-pick" onClick={() => pickSymbol(s, s)}>
              {s}
            </button>
          ))}
        </div>
        {watchlist.map((row) => (
          <div
            key={row.symbol}
            className="stock-row"
            role="button"
            tabIndex={0}
            onClick={() => pickSymbol(row.symbol, row.name)}
            onKeyDown={(e) => e.key === 'Enter' && pickSymbol(row.symbol, row.name)}
          >
            <span className="sym">{row.symbol}</span>
            <span className="name">{row.name}</span>
            <span className={`chg num-${row.changeType}`}>{row.change}</span>
            <span className="score">
              <span className={`badge badge-${row.scoreType}`}>
                {row.score} {row.scoreLabel}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="bento bento-2">
        <div className="card">
          <div className="card-label">今日行业涨跌</div>
          <div className="heatmap" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {(extras?.industry_heatmap ?? []).map((h) => (
              <div key={h.name} className={`heat-cell ${heatCls(h.level)}`}>
                {h.name}
                <br />
                {h.change >= 0 ? '+' : ''}{h.change}%
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-label">全市场异常速览</div>
          {marketAlerts.slice(0, 2).map((a) => (
            <div key={a.id} className={`alert-card ${a.level === 'critical' ? 'critical' : a.level}`} style={{ marginBottom: 8 }}>
              <div className="alert-icon">{a.icon}</div>
              <div className="alert-body">
                <h4>{a.title}</h4>
                <p>{a.description}</p>
              </div>
            </div>
          ))}
          <span
            className="chart-tab"
            style={{ cursor: 'pointer', marginTop: 12, display: 'inline-block' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/app/alerts')}
          >
            查看全部 {alertCount} 条 →
          </span>
        </div>
      </div>
      <div className="card insight-block">
        <h3>💡 全市场投资建议</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 8 }}>
          {extras?.market_advice?.position} {extras?.market_advice?.direction} {extras?.market_advice?.action}
        </p>
      </div>
      <MarketIndexChart />
    </>
  );
}
