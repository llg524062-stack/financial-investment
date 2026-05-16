const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../src/pages');

function w(rel, content) {
  const fixed = content.replace(/<motion\.div/g, '<div').replace(/<\/motion\.div>/g, '</motion.div>');
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, fixed.replace(/<\/motion\.motion\.div>/g, '</div>').replace(/<\/motion\.motion\.motion\.div>/g, '</div>').replace(/<\/motion\.div>/g, '</div>'));
}

w('alerts/index.tsx', `import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAlerts } from '@/api/modules/market';
import { useAppStore } from '@/store/appStore';
import { ScopeVisible } from '@/components/common/ScopeVisible';
import { PageLoading } from '@/components/common/PageLoading';
import type { AlertItem } from '@/types/market';

function AlertCard({ item }: { item: AlertItem }) {
  return (
    <div className={\`alert-card \${item.level === 'critical' ? 'critical' : item.level}\`}>
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
        <div className="section-header"><h2>异常提醒 · 全市场</h2><p>大盘、宏观、自选股汇总</p></motion.div>
      </ScopeVisible>
      <ScopeVisible scope="symbol">
        <div className="section-header"><h2>异常提醒 · {symbol}</h2><p>这只股票上值得你停下来看的变化</p></motion.div>
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
        </motion.div>
      </motion.div>
    </section>
  );
}
`);

w('ai-insights/index.tsx', `import { ScopeVisible } from '@/components/common/ScopeVisible';
import { SubTabs } from '@/components/common/SubTabs';
import { useAppStore } from '@/store/appStore';

export default function AiInsightsPage() {
  const scope = useAppStore((s) => s.scope);
  return (
    <section className="panel active">
      <div className="section-header"><h2>深度分析</h2></motion.div>
      <SubTabs
        defaultKey={scope === 'symbol' ? 'ai-watchlist' : 'ai-sector'}
        items={[
          { key: 'ai-watchlist', label: '个股研判', hidden: scope !== 'symbol', content: <div className="card"><div className="card-label">NVDA 情景预测</div></motion.div> },
          { key: 'ai-sector', label: '行业机会', hidden: scope !== 'market', content: <motion.div className="card"><div className="card-label">行业机会雷达</div></motion.div> },
          { key: 'ai-macro', label: '宏观仓位', content: <div className="ai-panel"><div className="verdict-label"><strong>建议仓位 55%</strong></motion.div></motion.div> },
        ]}
      />
    </section>
  );
}
`);

w('market/index.tsx', `import { useRef } from 'react';
import { useLineChart } from '@/hooks/useLineChart';

export default function MarketPage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useLineChart(ref, [118,120,122,125,128,131], '#10b981', true);
  return (
    <section className="panel active">
      <div className="section-header"><h2>行情数据</h2><p>分时/K线、Level2、期权链</p></motion.div>
      <div className="bento bento-4">
        <div className="card"><div className="card-label">开盘</div><div className="card-value">$128.50</div></motion.div>
        <div className="card"><div className="card-label">最高</div><div className="card-value">$132.10</div></motion.div>
      </motion.div>
      <div className="card"><motion.div className="card-label">K线图</div><div className="chart-area tall"><canvas ref={ref} /></motion.div></motion.div>
    </section>
  );
}
`);

w('fundamental/index.tsx', `import { useRef } from 'react';
import { SubTabs } from '@/components/common/SubTabs';
import { useLineChart } from '@/hooks/useLineChart';

export default function FundamentalPage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useLineChart(ref, [16,27,27,61,115], '#10b981');
  return (
    <section className="panel active">
      <div className="section-header"><h2>基本面与财务</h2></motion.div>
      <SubTabs items={[
        { key: 'fin-overview', label: '估值概览', content: <div className="card"><div className="chart-area"><canvas ref={ref} /></motion.div></motion.div> },
        { key: 'fin-income', label: '利润表', content: <div className="card">利润表 Mock</motion.div> },
      ]} />
    </section>
  );
}
`);

w('macro/index.tsx', `export default function MacroPage() {
  return (
    <section className="panel active">
      <div className="section-header"><h2>宏观与行业</h2></motion.div>
      <div className="card"><motion.div className="card-label">美联储利率</div><div className="card-value">5.25-5.50%</div></motion.div>
    </section>
  );
}
`);

w('news/index.tsx', `export default function NewsPage() {
  const items = [
    { title: '英伟达发布 Blackwell 架构', source: '财联社', url: 'https://www.cls.cn' },
    { title: '美联储维持利率不变', source: '华尔街见闻', url: 'https://wallstreetcn.com' },
  ];
  return (
    <section className="panel active">
      <div className="section-header"><h2>资讯与舆情</h2></motion.div>
      <div className="news-feed">
        {items.map((n) => (
          <a key={n.title} className="news-item news-link" href={n.url} target="_blank" rel="noreferrer">
            <span className="news-source">{n.source}</span>
            <span className="news-title">{n.title}</span>
          </a>
        ))}
      </motion.div>
    </section>
  );
}
`);

w('portfolio-sim/index.tsx', `import { useRef } from 'react';
import { Form, InputNumber, Button } from 'antd';
import { useLineChart } from '@/hooks/useLineChart';
import { useThrottleFn } from '@/hooks/useThrottle';

export default function PortfolioSimPage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useLineChart(ref, [100,102,105,110,115,120,125,130,135,140], '#10b981');
  const onSim = useThrottleFn(() => {});
  return (
    <section className="panel active">
      <div className="section-header"><h2>收益模拟器</h2></motion.div>
      <Form layout="inline" onFinish={onSim}>
        <Form.Item name="amount" label="本金" rules={[{ required: true }]}><InputNumber min={1} /></Form.Item>
        <Button type="primary" htmlType="submit">模拟</Button>
      </Form>
      <div className="chart-area" style={{ marginTop: 16 }}><canvas ref={ref} /></motion.div>
    </section>
  );
}
`);

w('settings/index.tsx', `export default function SettingsPage() {
  return (
    <section className="panel active">
      <div className="section-header"><h2>数据源百科</h2><p>数据指标、推荐源与 API</p></motion.div>
      <div className="ds-category">
        <div className="ds-category-header"><h3>① 行情数据</h3></motion.div>
        <div className="card"><div className="table-wrap"><table className="ds-table">
          <thead><tr><th>指标</th><th>数据源</th></tr></thead>
          <tbody><tr><td>实时报价</td><td>yfinance / AkShare</td></tr></tbody>
        </table></motion.div></motion.div>
      </motion.div>
    </section>
  );
}
`);

w('errors/NotFound.tsx', `export default function NotFoundPage() {
  return <div className="card" style={{ margin: 48, textAlign: 'center' }}><h2>404</h2><p>页面不存在</p></motion.div>;
}
`);
w('errors/Forbidden.tsx', `export default function ForbiddenPage() {
  return <div className="card" style={{ margin: 48, textAlign: 'center' }}><h2>403</h2><p>无权限访问</p></motion.div>;
}
`);
w('errors/ServerError.tsx', `export default function ServerErrorPage() {
  return <div className="card" style={{ margin: 48, textAlign: 'center' }}><h2>500</h2><p>服务异常</p></motion.div>;
}
`);

console.log('generated pages');
