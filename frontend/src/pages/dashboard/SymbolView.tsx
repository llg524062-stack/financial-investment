import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentSymbol } from '@/hooks/useCurrentSymbol';
import { fetchSymbolDashboard, fetchSymbolQuotes, type SymbolDashboard } from '@/api/modules/dashboard';
import { syncSymbol } from '@/api/modules/sync';
import { useLineChart } from '@/hooks/useLineChart';
import { PageLoading } from '@/components/common/PageLoading';
import { DataSourceTag } from '@/components/common/DataSourceTag';

const heatCls = (lvl: number) => {
  if (lvl >= 2) return 'heat-up-3';
  if (lvl === 1) return 'heat-up-1';
  if (lvl === 0) return 'heat-flat';
  if (lvl === -1) return 'heat-down-1';
  return 'heat-down-3';
};

function aiPointKey(p: { tag: string; text: string } | string, i: number) {
  return typeof p === 'string' ? p : `${p.tag}-${i}`;
}

function aiPointText(p: { tag: string; text: string } | string) {
  return typeof p === 'string' ? p : `[${p.tag}] ${p.text}`;
}

export function SymbolView() {
  const { symbol: sym } = useCurrentSymbol();
  const symbol = sym ?? 'NVDA';
  const navigate = useNavigate();
  const mainRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<SymbolDashboard | null>(null);
  const [line, setLine] = useState<number[]>([]);

  useEffect(() => {
    setData(null);
    setLine([]);
    void Promise.all([fetchSymbolDashboard(symbol), fetchSymbolQuotes(symbol, '3m')]).then(([d, quotes]) => {
      setData(d);
      if (quotes.length) {
        setLine(quotes.map((q) => q.close));
      } else if (!d.data_ready) {
        void syncSymbol(symbol).then(() => {
          void fetchSymbolQuotes(symbol, '3m').then((q) => {
            if (q.length) setLine(q.map((b) => b.close));
          });
        });
      }
    });
  }, [symbol]);

  useLineChart(mainRef, line, '#10b981', true);

  if (!data) return <PageLoading />;

  const dims = data.dimensions;

  return (
    <>
      <div className="hero-verdict">
        <div className="question">{data.symbol}（{data.name}）现在值得投资吗？</div>
        <div className={`answer ${data.verdict_level === 'avoid' ? '' : data.verdict_level === 'buy' ? 'buy' : 'caution'}`}>
          {data.verdict}
        </div>
        <p className="summary">{data.summary}</p>
        {data.insight_source && (
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
            研判来源：<DataSourceTag source={data.insight_source === 'llm' ? 'live' : 'rules'} />
            {data.insight_source === 'llm'
              ? '（Ollama 大模型生成）'
              : '（规则引擎）'}
            {data.llm_status === 'unavailable' && ' · Ollama 未连接，已回退规则'}
            {data.llm_status === 'parse_failed' && ' · 模型输出解析失败，已回退规则'}
          </p>
        )}
      </div>

      <div className="bento bento-4" style={{ marginBottom: 24 }}>
        {(data.price_cards ?? []).map((c) => (
          <div key={c.label} className="card">
            <div className="card-label">{c.label}</div>
            <div className={`card-value ${c.type === 'up' ? 'num-up' : c.type === 'down' ? 'num-down' : ''}`}>{c.value}</div>
            {c.source && (
              <div className="card-meta">
                <DataSourceTag source={c.source} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-label">四维体检（满分 100）</div>
        <div className="dim-grid">
          <div className="dim-item"><div className="dim-score" style={{ color: 'var(--accent)' }}>{dims.profit ?? 70}</div><div className="dim-label">赚钱能力</div></div>
          <div className="dim-item"><div className="dim-score" style={{ color: 'var(--warning)' }}>{dims.valuation ?? 55}</div><div className="dim-label">价格贵不贵</div></div>
          <div className="dim-item"><div className="dim-score" style={{ color: 'var(--accent)' }}>{dims.industry ?? 75}</div><div className="dim-label">行业前景</div></div>
          <div className="dim-item"><div className="dim-score" style={{ color: 'var(--warning)' }}>{dims.macro ?? 60}</div><div className="dim-label">大环境</div></div>
        </div>
        <div className="score-bar"><div className="score-bar-fill" style={{ width: `${data.score}%` }} /></div>
      </div>

      {data.checklist && data.checklist.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-label">本周需关注</div>
          <ul className="checklist">
            {data.checklist.map((c) => (
              <li key={c.item} className={`check-${c.status}`}>
                <span className="check-icon">{c.status === 'ok' ? '✓' : c.status === 'critical' ? '!' : '?'}</span>
                <strong>{c.item}</strong> — {c.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bento bento-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-label">人话解读 · 走势</div>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>{data.trend_human}</p>
        </div>
        <div className="card">
          <div className="card-label">人话解读 · 估值</div>
          <p style={{ fontSize: 14, lineHeight: 1.7 }}>{data.valuation_text}</p>
        </div>
      </div>

      {data.inline_alerts && data.inline_alerts.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-label">异常变动速览</div>
            <span className="chart-tab" role="button" tabIndex={0} onClick={() => navigate('/app/alerts')}>
              查看全部 →
            </span>
          </div>
          {data.inline_alerts.map((a) => (
            <div key={a.id} className={`alert-card ${a.level === 'critical' ? 'critical' : a.level}`}>
              <div className="alert-icon">{a.icon}</div>
              <div className="alert-body">
                <h4>{a.title}</h4>
                <p>{a.description}</p>
                <div className="what-to-do">{a.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.ai_points && data.ai_points.length > 0 && (
        <div className="ai-panel" style={{ marginBottom: 24 }}>
          <div className="verdict-label">
            <strong>综合研判要点</strong>
            <DataSourceTag source={data.insight_source === 'llm' ? 'live' : 'rules'} />
          </div>
          <ul>
            {data.ai_points.map((p, i) => (
              <li key={aiPointKey(p, i)}>{aiPointText(p)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="insight-block" style={{ marginBottom: 24 }}>
        <h3>🔮 未来预测（12 个月）</h3>
        <div className="bento bento-3">
          {data.forecast_scenarios.map((s) => (
            <div key={s.name} className="card">
              <div className="card-label">{s.name} · {Math.round(s.probability * 100)}%</div>
              <div className="card-value" style={{ fontSize: 16 }}>{s.target_range}</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{s.drivers}</p>
            </div>
          ))}
        </div>
        {data.composite_advice && <p style={{ marginTop: 12, fontSize: 14 }}>{data.composite_advice}</p>}
      </div>

      {data.history_events && (
        <div className="card table-wrap" style={{ marginBottom: 24 }}>
          <div className="card-label">
            历史回顾
            {data.history_from_news && <DataSourceTag source="live" title="来自已同步新闻" />}
          </div>
          <table>
            <thead><tr><th>时期</th><th>事件</th><th>股价反应</th><th>经验</th></tr></thead>
            <tbody>
              {data.history_events.map((e) => (
                <tr key={`${e.period}-${e.event}`}><td>{e.period}</td><td>{e.event}</td><td>{e.reaction}</td><td>{e.lesson}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bento bento-2-1">
        <div className="card span-2">
          <div className="card-label">K 线（近端走势）<DataSourceTag source="live" /></div>
          <div className="chart-area tall"><canvas ref={mainRef} /></div>
        </div>
        {data.peer_heatmap && (
          <div className="card">
            <div className="card-label">自选股对比热力<DataSourceTag source="live" title="来自 watchlist 涨跌幅" /></div>
            <div className="heatmap">
              {data.peer_heatmap.map((h) => (
                <div key={h.name} className={`heat-cell ${heatCls(h.level)}`}>
                  {h.name}<br />{h.change >= 0 ? '+' : ''}{h.change}%
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <span className="chart-tab" role="button" tabIndex={0} onClick={() => navigate('/app/alerts')}>查看异常 →</span>
    </>
  );
}
