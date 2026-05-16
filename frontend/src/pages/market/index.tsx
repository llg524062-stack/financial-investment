import { useEffect, useRef, useState } from 'react';
import { SubTabs } from '@/components/common/SubTabs';
import { PageLoading } from '@/components/common/PageLoading';
import { SymbolScopedPage } from '@/components/business/SymbolScopedPage';
import { fetchMarketPage, type MarketPageData } from '@/api/modules/pages';
import { useLineChart } from '@/hooks/useLineChart';
import { DataSourceTag } from '@/components/common/DataSourceTag';

function MarketPageContent({ symbol }: { symbol: string }) {
  const [data, setData] = useState<MarketPageData | null>(null);
  const kRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setData(null);
    void fetchMarketPage(symbol).then(setData);
  }, [symbol]);

  useLineChart(kRef, data?.kline.closes ?? [100, 102, 105], '#10b981', true);

  if (!data) return <PageLoading />;

  const { ohlc, level2, options } = data;
  const fmt = (n: number) => (n >= 1000 ? n.toLocaleString() : n.toFixed(2));

  return (
    <>
      <div className="section-header">
        <h2>行情数据 · {symbol}</h2>
        <p>开高低收、K 线来自数据库同步行情；Level2 / 期权链需交易所授权，未接入时显示为空。</p>
      </div>

      <div className="bento bento-4">
        <div className="card"><div className="card-label">开盘</div><div className="card-value">{fmt(ohlc.open)}</div></div>
        <div className="card"><div className="card-label">最高</div><div className="card-value">{fmt(ohlc.high)}</div></div>
        <div className="card"><div className="card-label">最低</div><div className="card-value">{fmt(ohlc.low)}</div></div>
        <div className="card"><div className="card-label">收盘 / 成交量</div><div className="card-value">{fmt(ohlc.close)}</div><div className="card-meta">量 {fmt(ohlc.volume)}</div></div>
      </div>

      <SubTabs
        defaultKey="mkt-kline"
        items={[
          {
            key: 'mkt-kline',
            label: 'K 线',
            content: (
              <div className="card">
                <div className="card-label">日 K（近 30 交易日）<DataSourceTag source={data.kline.source} /></div>
                <div className="chart-area tall"><canvas ref={kRef} /></div>
              </div>
            ),
          },
          {
            key: 'mkt-level2',
            label: 'Level2',
            content: (
              <div className="bento bento-2">
                <p style={{ fontSize: 12, marginBottom: 12, color: 'var(--text-tertiary)' }}>
                  <DataSourceTag source={level2.source ?? 'unavailable'} />
                  {level2.bids.length ? '五档盘口' : '暂无 Level2 数据（未接入交易所行情）'}
                </p>
                <div className="card">
                  <div className="card-label">买盘五档</div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>价格</th><th>数量</th></tr></thead>
                      <tbody>{level2.bids.map((b) => <tr key={b.price}><td className="num-up">{b.price}</td><td>{b.size}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-label">卖盘五档</div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>价格</th><th>数量</th></tr></thead>
                      <tbody>{level2.asks.map((a) => <tr key={a.price}><td className="num-down">{a.price}</td><td>{a.size}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'mkt-options',
            label: '期权链',
            content: (
              <div className="card">
                <div className="card-label">
                  近月期权链
                  <DataSourceTag source={data.options_source ?? 'unavailable'} />
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>行权价</th><th>Call Bid</th><th>Call Ask</th><th>Put Bid</th><th>Put Ask</th><th>IV</th></tr></thead>
                    <tbody>
                      {options.length ? (
                        options.map((o) => (
                          <tr key={o.strike}>
                            <td>{o.strike}</td><td>{o.call_bid}</td><td>{o.call_ask}</td><td>{o.put_bid}</td><td>{o.put_ask}</td><td>{o.iv}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={6}>暂无期权链数据（需期权行情授权）</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}

export default function MarketPage() {
  return (
    <section className="panel active">
      <SymbolScopedPage promptTitle="查看行情需先选择股票">
        {(symbol) => <MarketPageContent symbol={symbol} />}
      </SymbolScopedPage>
    </section>
  );
}
