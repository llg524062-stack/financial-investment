import { useRef } from 'react';
import { useLineChart } from '@/hooks/useLineChart';

export default function MarketPage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useLineChart(ref, [118,120,122,125,128,131], '#10b981', true);
  return (
    <section className="panel active">
      <div className="section-header"><h2>行情数据</h2><p>分时/K线、Level2、期权链</p></div>
      <div className="bento bento-4">
        <div className="card"><div className="card-label">开盘</div><div className="card-value">$128.50</div></div>
        <div className="card"><div className="card-label">最高</div><div className="card-value">$132.10</div></div>
      </div>
      <div className="card"><div className="card-label">K线图</div><div className="chart-area tall"><canvas ref={ref} /></div></div>
    </section>
  );
}
