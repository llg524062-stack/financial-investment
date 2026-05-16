import { useEffect, useRef, useState } from 'react';
import { SubTabs } from '@/components/common/SubTabs';
import { PageLoading } from '@/components/common/PageLoading';
import { fetchMacroPage, type MacroPageData } from '@/api/modules/pages';
import { useLineChart } from '@/hooks/useLineChart';

export default function MacroPage() {
  const [data, setData] = useState<MacroPageData | null>(null);
  const curveRef = useRef<HTMLCanvasElement>(null);
  const chipRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    void fetchMacroPage().then(setData);
  }, []);

  useLineChart(curveRef, data?.liquidity.yield_curve.values ?? [5, 4.6, 4.3], '#6366f1');
  useLineChart(chipRef, data?.industry.chip_index.values ?? [100, 102, 105], '#10b981', true);

  if (!data) return <PageLoading />;

  const heatClass = (chg: string) => (chg.startsWith('+') ? 'heat-up-2' : chg.startsWith('-') ? 'heat-down-2' : 'heat-flat');

  return (
    <section className="panel active">
      <div className="section-header">
        <h2>宏观与行业</h2>
        <p>流动性 · 经济晴雨表 · 行业景气</p>
      </div>

      <SubTabs
        defaultKey="macro-liquidity"
        items={[
          {
            key: 'macro-liquidity',
            label: '流动性',
            content: (
              <>
                <div className="bento bento-3">
                  {data.liquidity.rates.map((r) => (
                    <div key={r.label} className="card">
                      <div className="card-label">{r.label}</div>
                      <div className="card-value">{r.value}</div>
                      <div className="card-meta">{r.meta}</div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ marginTop: 24 }}>
                  <div className="card-label">美债收益率曲线</div>
                  <div className="chart-area"><canvas ref={curveRef} /></div>
                </div>
              </>
            ),
          },
          {
            key: 'macro-economy',
            label: '经济晴雨表',
            content: (
              <>
                <div className="card">
                  <div className="card-label">综合评分 · {data.economy.gauge_label}</div>
                  <div className="dim-score" style={{ fontSize: 48, color: 'var(--warning)' }}>{data.economy.gauge_score}</div>
                </div>
                <div className="bento bento-3" style={{ marginTop: 24 }}>
                  {data.economy.cards.map((c) => (
                    <div key={c.label} className="card">
                      <div className="card-label">{c.label}</div>
                      <div className="card-value">{c.value}</div>
                      <div className="card-meta">{c.change}</div>
                    </div>
                  ))}
                </div>
              </>
            ),
          },
          {
            key: 'macro-industry',
            label: '行业指标',
            content: (
              <>
                <div className="bento bento-2">
                  <div className="card">
                    <div className="card-label">半导体指数</div>
                    <div className="chart-area"><canvas ref={chipRef} /></div>
                  </div>
                  <div className="card">
                    <div className="card-label">BDI 波罗的海指数</div>
                    <div className="card-value">{data.industry.bdi.value}</div>
                    <div className="card-meta">{data.industry.bdi.change}</div>
                  </div>
                </div>
                <div className="card table-wrap" style={{ marginTop: 24 }}>
                  <table>
                    <thead><tr><th>品种</th><th>价格</th><th>涨跌</th></tr></thead>
                    <tbody>
                      {data.industry.commodities.map((row) => (
                        <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td className={heatClass(row[2])}>{row[2]}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ),
          },
        ]}
      />
    </section>
  );
}
