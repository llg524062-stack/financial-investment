import { useEffect, useRef, useState } from 'react';
import { PageLoading } from '@/components/common/PageLoading';
import { fetchPortfolio, type PortfolioData } from '@/api/modules/pages';
import { useLineChart } from '@/hooks/useLineChart';
import { DataSourceTag } from '@/components/common/DataSourceTag';

export default function PortfolioSimPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const perfRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    void fetchPortfolio().then(setData);
  }, []);

  useLineChart(perfRef, data?.performance.values ?? [100, 105, 112], '#10b981', true);

  if (!data) return <PageLoading />;

  return (
    <section className="panel active">
      <div className="section-header">
        <h2>收益模拟器</h2>
        <p>
          模拟持仓、组合绩效与风险指标
          <DataSourceTag source={data.performance_source ?? 'synthetic'} title="绩效曲线为示意" />
        </p>
      </div>

      <div className="bento bento-3">
        <div className="card"><div className="card-label">夏普比率</div><div className="card-value">{data.metrics.sharpe}</div></div>
        <div className="card"><div className="card-label">最大回撤</div><div className="card-value">{data.metrics.max_drawdown}</div></div>
        <div className="card"><div className="card-label">累计收益</div><div className="card-value">{data.metrics.total_return}</div></div>
      </div>

      <div className="card table-wrap" style={{ marginTop: 24 }}>
        <div className="card-label">模拟持仓</div>
        <table>
          <thead><tr><th>代码</th><th>名称</th><th>股数</th><th>成本</th><th>现价</th><th>权重</th><th>30日涨跌</th></tr></thead>
          <tbody>
            {data.holdings.map((h) => (
              <tr key={h.symbol}>
                <td>{h.symbol}</td><td>{h.name}</td><td>{h.shares}</td><td>{h.cost}</td>
                <td>{h.price?.toFixed(2) ?? '—'}</td><td>{h.weight}%</td>
                <td className={h.pnl_pct && h.pnl_pct >= 0 ? 'num-up' : 'num-down'}>{h.pnl_pct != null ? `${h.pnl_pct.toFixed(1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-label">组合净值曲线（归一化 100）</div>
        <div className="chart-area tall"><canvas ref={perfRef} /></div>
      </div>
    </section>
  );
}
