import { ScopeVisible } from '@/components/common/ScopeVisible';
import { MarketView } from './MarketView';
import { SymbolView } from './SymbolView';

export default function DashboardPage() {
  return (
    <section className="panel active">
      <ScopeVisible scope="market">
        <div className="section-header">
          <h2>市场总览</h2>
          <p>全市场扫描 — 指数、行业、宏观环境、自选股雷达与投资建议</p>
        </div>
        <MarketView />
      </ScopeVisible>
      <ScopeVisible scope="symbol">
        <div className="section-header">
          <h2>投资结论</h2>
          <p>投资建议、历史回顾、未来预测与完整行情数据</p>
        </div>
        <SymbolView />
      </ScopeVisible>
    </section>
  );
}
