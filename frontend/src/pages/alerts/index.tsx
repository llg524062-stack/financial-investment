import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { ScopeVisible } from '@/components/common/ScopeVisible';
import { PageLoading } from '@/components/common/PageLoading';
import { fetchAlertsPage, type AlertsPageData } from '@/api/modules/pages';

function AlertCard({ item }: { item: AlertsPageData['alerts'][0] }) {
  return (
    <div className={`alert-card ${item.level === 'critical' ? 'critical' : item.level}`}>
      <div className="alert-icon">{item.icon}</div>
      <div className="alert-body">
        <h4>{item.title}</h4>
        <p>{item.description}</p>
        <div className="what-to-do"><strong>建议：</strong>{item.suggestion}</div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const scope = useAppStore((s) => s.scope);
  const symbol = useAppStore((s) => s.currentSymbol);
  const setScopeSymbol = useAppStore((s) => s.setScopeSymbol);
  const navigate = useNavigate();
  const [data, setData] = useState<AlertsPageData | null>(null);

  useEffect(() => {
    void fetchAlertsPage(scope, symbol ?? undefined).then(setData);
  }, [scope, symbol]);

  if (!data) return <PageLoading />;

  return (
    <section className="panel active">
      <ScopeVisible scope="market">
        <div className="section-header"><h2>异常提醒 · 全市场</h2><p>大盘、宏观、自选股汇总</p></div>
      </ScopeVisible>
      <ScopeVisible scope="symbol">
        <div className="section-header"><h2>异常提醒 · {symbol}</h2><p>这只股票上值得你停下来看的变化</p></div>
      </ScopeVisible>

      {data.alerts.map((a) => <AlertCard key={a.id} item={a} />)}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-label">监控规则</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>规则名</th><th>人话解释</th><th>触发条件</th><th>状态</th></tr></thead>
            <tbody>
              {data.monitor_rules.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td><td>{r.explain}</td><td>{r.condition}</td>
                  <td><span className="badge badge-warn">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ScopeVisible scope="market">
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-label">自选股异常一览</div>
          {data.watchlist_alerts.map((w) => (
            <div
              key={w.symbol}
              className="stock-row"
              role="button"
              tabIndex={0}
              onClick={() => { setScopeSymbol(w.symbol, `${w.symbol} · ${w.name}`); navigate('/app/dashboard'); }}
            >
              <span className="sym">{w.symbol}</span>
              <span className="name">{w.name}</span>
              <span className="score">{w.alerts.length} 条异常</span>
            </div>
          ))}
        </div>
      </ScopeVisible>
    </section>
  );
}
