import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchIndexCards, fetchWatchlist } from '@/api/modules/market';
import { useAppStore } from '@/store/appStore';
import { MarketIndexChart } from '@/components/business/MarketIndexChart';
import { PageLoading } from '@/components/common/PageLoading';
import type { IndexCard, StockRowItem } from '@/types/market';

const badgeClass = (t: IndexCard['changeType']) =>
  t === 'up' ? 'badge-up' : t === 'down' ? 'badge-down' : t === 'warn' ? 'badge-warn' : 'badge-neutral';

export function MarketView() {
  const navigate = useNavigate();
  const setScopeSymbol = useAppStore((s) => s.setScopeSymbol);
  const [cards, setCards] = useState<IndexCard[]>([]);
  const [watchlist, setWatchlist] = useState<StockRowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([fetchIndexCards(), fetchWatchlist()]).then(([c, w]) => {
      setCards(c);
      setWatchlist(w);
      setLoading(false);
    });
  }, []);

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
          <div className="dim-item">
            <div className="dim-score" style={{ color: 'var(--warning)' }}>62</div>
            <div className="dim-label">适合买股票吗</div>
            <div className="dim-plain">可以参与，控制仓位</div>
          </div>
          <div className="dim-item">
            <div className="dim-score" style={{ color: 'var(--accent)' }}>55%</div>
            <div className="dim-label">建议股票仓位</div>
            <div className="dim-plain">中性偏积极</div>
          </div>
          <div className="dim-item">
            <div className="dim-score" style={{ color: 'var(--accent)' }}>78</div>
            <div className="dim-label">最佳方向</div>
            <div className="dim-plain">AI算力、电力设备</div>
          </div>
          <div className="dim-item">
            <div className="dim-score" style={{ color: 'var(--danger)' }}>35</div>
            <div className="dim-label">建议回避</div>
            <div className="dim-plain">地产链、高估值题材</div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-label">自选股雷达 · 点击深入分析</div>
          <span className="card-meta">共 6 只 · 2 只触发异常</span>
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
            {[
              ['半导体', '+2.1%', 'heat-up-3'],
              ['AI软件', '+1.5%', 'heat-up-2'],
              ['电力', '+0.8%', 'heat-up-1'],
              ['消费', '0.0%', 'heat-flat'],
            ].map(([name, chg, cls]) => (
              <div key={name} className={`heat-cell ${cls}`}>
                {name}
                <br />
                {chg}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-label">全市场异常速览</div>
          <span
            className="chart-tab"
            style={{ cursor: 'pointer', marginTop: 12, display: 'inline-block' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/app/alerts')}
          >
            查看全部 5 条 →
          </span>
        </div>
      </div>
      <div className="card insight-block">
        <h3>💡 全市场投资建议</h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 8 }}>
          建议股票仓位 55%，超配 AI 算力与电力设备，不追涨。
        </p>
      </div>
      <MarketIndexChart />
    </>
  );
}
