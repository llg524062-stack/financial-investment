import { useEffect, useState } from 'react';
import { SubTabs } from '@/components/common/SubTabs';
import { PageLoading } from '@/components/common/PageLoading';
import { useAppStore } from '@/store/appStore';
import { fetchInsightsPage, type InsightsPageData } from '@/api/modules/pages';

export default function AiInsightsPage() {
  const scope = useAppStore((s) => s.scope);
  const symbol = useAppStore((s) => s.currentSymbol);
  const [data, setData] = useState<InsightsPageData | null>(null);

  useEffect(() => {
    void fetchInsightsPage(scope, symbol ?? undefined).then(setData);
  }, [scope, symbol]);

  if (!data) return <PageLoading />;

  return (
    <section className="panel active">
      <div className="section-header">
        <h2>深度分析</h2>
        <p>个股研判 · 行业机会雷达 · 宏观仓位</p>
      </div>
      <SubTabs
        defaultKey={scope === 'symbol' ? 'ai-watchlist' : 'ai-sector'}
        items={[
          {
            key: 'ai-watchlist',
            label: '个股研判',
            hidden: scope !== 'symbol',
            content: (
              <div className="card table-wrap">
                <table>
                  <thead><tr><th>代码</th><th>名称</th><th>结论</th><th>得分</th><th>涨跌</th><th>要点</th></tr></thead>
                  <tbody>
                    {data.stock_research.map((r) => (
                      <tr key={r.symbol}>
                        <td>{r.symbol}</td><td>{r.name}</td><td>{r.verdict}</td><td>{r.score}</td><td>{r.change}</td><td>{r.highlight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          },
          {
            key: 'ai-sector',
            label: '行业机会',
            hidden: scope !== 'market',
            content: (
              <div className="card table-wrap">
                <table>
                  <thead><tr><th>赛道</th><th>热度</th><th>观点</th><th>代表标的</th></tr></thead>
                  <tbody>
                    {data.sector_radar.map((r) => (
                      <tr key={r.sector}><td>{r.sector}</td><td>{r.heat}</td><td>{r.view}</td><td>{r.symbols}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          },
          {
            key: 'ai-macro',
            label: '宏观仓位',
            content: (
              <div className="ai-panel">
                <div className="verdict-label"><strong>{data.macro_panel.title}</strong></div>
                <p>{data.macro_panel.position}</p>
                <p>{data.macro_panel.sectors}</p>
                <p style={{ color: 'var(--warning)' }}>{data.macro_panel.risk}</p>
              </div>
            ),
          },
        ]}
      />
    </section>
  );
}
