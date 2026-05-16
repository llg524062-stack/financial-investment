import { useEffect, useRef, useState } from 'react';
import { SubTabs } from '@/components/common/SubTabs';
import { PageLoading } from '@/components/common/PageLoading';
import { SymbolScopedPage } from '@/components/business/SymbolScopedPage';
import { fetchFundamentalPage, type FundamentalPageData } from '@/api/modules/pages';
import { useLineChart } from '@/hooks/useLineChart';
import { DataSourceTag } from '@/components/common/DataSourceTag';
import { asArray } from '@/utils/apiNormalize';

function FinTable({ rows }: { rows: string[][] }) {
  const safeRows = asArray<string[]>(rows);
  return (
    <table>
      <thead><tr><th>科目</th><th>数值</th><th>同比</th><th>说明</th></tr></thead>
      <tbody>
        {safeRows.map((r) => (
          <tr key={r[0]}>
            {asArray<string>(r).map((c, i) => (
              <td key={i}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FundamentalPageContent({ symbol }: { symbol: string }) {
  const [data, setData] = useState<FundamentalPageData | null>(null);
  const revRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setData(null);
    void fetchFundamentalPage(symbol).then(setData);
  }, [symbol]);

  useLineChart(revRef, data?.revenue_chart.values ?? [16, 27, 35], '#10b981');

  if (!data) return <PageLoading />;

  return (
    <>
      <div className="section-header">
        <h2>基本面与财务 · {symbol}</h2>
        <p>
          估值与财报均来自后台同步（yfinance / AkShare）；请先完成数据同步
          {data.tables_synthetic ? '（当前仅估值快照）' : '（已缓存季报）'}
        </p>
      </div>

      <SubTabs
        defaultKey="fin-overview"
        items={[
          {
            key: 'fin-overview',
            label: '估值概览',
            content: (
              <>
                <div className="bento bento-4">
                  {data.overview.map((c) => (
                    <div key={c.label} className="card">
                      <div className="card-label">{c.label}</div>
                      <div className="card-value">{c.value}</div>
                      <div className="card-meta">{c.meta}</div>
                    </div>
                  ))}
                </div>
                <div className="card" style={{ marginTop: 24 }}>
                  <div className="card-label">
                    营收趋势
                    <DataSourceTag source={data.revenue_chart.source ?? 'synthetic'} />
                  </div>
                  <div className="chart-area"><canvas ref={revRef} /></div>
                </div>
              </>
            ),
          },
          {
            key: 'fin-income',
            label: '利润表',
            content: (
              <div className="card table-wrap">
                {!data.tables_synthetic ? (
                  <p style={{ marginBottom: 8 }}>
                    <DataSourceTag source="live" /> 利润表来自 yfinance / AkShare 季报
                  </p>
                ) : (
                  <p style={{ marginBottom: 8 }}>
                    <DataSourceTag source="synthetic" /> 完整财报未拉取到时显示估值快照摘要
                  </p>
                )}
                <FinTable rows={data.tables.income} />
              </div>
            ),
          },
          {
            key: 'fin-balance',
            label: '资产负债',
            content: <div className="card table-wrap"><FinTable rows={data.tables.balance} /></div>,
          },
          {
            key: 'fin-cashflow',
            label: '现金流',
            content: <div className="card table-wrap"><FinTable rows={data.tables.cashflow} /></div>,
          },
        ]}
      />
    </>
  );
}

export default function FundamentalPage() {
  return (
    <section className="panel active">
      <SymbolScopedPage promptTitle="查看基本面需先选择股票">
        {(symbol) => <FundamentalPageContent symbol={symbol} />}
      </SymbolScopedPage>
    </section>
  );
}
