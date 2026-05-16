import { useRef } from 'react';
import { SubTabs } from '@/components/common/SubTabs';
import { useLineChart } from '@/hooks/useLineChart';

export default function FundamentalPage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useLineChart(ref, [16,27,27,61,115], '#10b981');
  return (
    <section className="panel active">
      <div className="section-header"><h2>基本面与财务</h2></div>
      <SubTabs items={[
        { key: 'fin-overview', label: '估值概览', content: <div className="card"><div className="chart-area"><canvas ref={ref} /></div></div> },
        { key: 'fin-income', label: '利润表', content: <div className="card">利润表 Mock</div> },
      ]} />
    </section>
  );
}
