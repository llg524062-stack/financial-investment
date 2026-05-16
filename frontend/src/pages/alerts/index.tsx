import { useEffect, useState } from 'react';
import { fetchAlerts } from '@/api/modules/market';
import { useAppStore } from '@/store/appStore';
import { ScopeVisible } from '@/components/common/ScopeVisible';
import { PageLoading } from '@/components/common/PageLoading';
import type { AlertItem } from '@/types/market';

function AlertCard({ item }: { item: AlertItem }) {
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
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetchAlerts(scope).then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, [scope]);

  if (loading) return <PageLoading />;

  return (
    <section className="panel active">
      <ScopeVisible scope="market">
        <div className="section-header"><h2>异常提醒 · 全市场</h2><p>大盘、宏观、自选股汇总</p></div>
      </ScopeVisible>
      <ScopeVisible scope="symbol">
        <div className="section-header"><h2>异常提醒 · {symbol}</h2><p>这只股票上值得你停下来看的变化</p></div>
      </ScopeVisible>
      {alerts.map((a) => <AlertCard key={a.id} item={a} />)}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-label">监控规则</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>规则名</th><th>解释</th><th>状态</th></tr></thead>
            <tbody>
              <tr><td>短期暴涨</td><td>30日涨幅&gt;15%</td><td><span className="badge badge-down">已触发</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
