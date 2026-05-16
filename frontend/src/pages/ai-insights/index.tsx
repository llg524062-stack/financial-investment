import { SubTabs } from '@/components/common/SubTabs';
import { useAppStore } from '@/store/appStore';

export default function AiInsightsPage() {
  const scope = useAppStore((s) => s.scope);
  return (
    <section className="panel active">
      <div className="section-header"><h2>深度分析</h2></div>
      <SubTabs
        defaultKey={scope === 'symbol' ? 'ai-watchlist' : 'ai-sector'}
        items={[
          { key: 'ai-watchlist', label: '个股研判', hidden: scope !== 'symbol', content: <div className="card"><div className="card-label">NVDA 情景预测</div></div> },
          { key: 'ai-sector', label: '行业机会', hidden: scope !== 'market', content: <div className="card"><div className="card-label">行业机会雷达</div></div> },
          { key: 'ai-macro', label: '宏观仓位', content: <div className="ai-panel"><div className="verdict-label"><strong>建议仓位 55%</strong></div></div> },
        ]}
      />
    </section>
  );
}
