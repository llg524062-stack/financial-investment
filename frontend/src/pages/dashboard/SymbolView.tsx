import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useLineChart } from '@/hooks/useLineChart';

const LINE = [118, 120, 122, 119, 125, 128, 126, 130, 128, 131, 129, 132, 130, 131];

export function SymbolView() {
  const symbol = useAppStore((s) => s.currentSymbol) ?? 'NVDA';
  const navigate = useNavigate();
  const mainRef = useRef<HTMLCanvasElement>(null);
  useLineChart(mainRef, LINE, '#10b981', true);

  return (
    <>
      <div className="hero-verdict">
        <div className="question">{symbol}（英伟达）现在值得投资吗？</div>
        <div className="answer caution">可以考虑，但别追高</div>
        <p className="summary">公司赚钱能力很强，AI 赛道景气度高，但股价已经不便宜。</p>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-label">四维体检（满分 100）</div>
        <div className="dim-grid">
          <div className="dim-item">
            <div className="dim-score" style={{ color: 'var(--accent)' }}>85</div>
            <div className="dim-label">赚钱能力</div>
          </div>
          <div className="dim-item">
            <div className="dim-score" style={{ color: 'var(--warning)' }}>55</div>
            <div className="dim-label">价格贵不贵</div>
          </div>
        </div>
        <div className="score-bar">
          <div className="score-bar-fill" style={{ width: '72%' }} />
        </div>
      </div>
      <div className="insight-block">
        <h3>🔮 未来预测（12 个月）</h3>
        <div className="bento bento-3">
          <div className="card">
            <div className="card-label">乐观 · 35%</div>
            <div className="card-value">$160-180</div>
          </div>
          <div className="card">
            <div className="card-label">基准 · 45%</div>
            <div className="card-value">$135-150</div>
          </div>
          <div className="card">
            <div className="card-label">悲观 · 20%</div>
            <div className="card-value" style={{ color: 'var(--danger)' }}>
              $95-110
            </div>
          </div>
        </div>
      </div>
      <div className="bento bento-2-1">
        <div className="card span-2">
          <div className="card-label">K 线</div>
          <div className="chart-area tall">
            <canvas ref={mainRef} />
          </div>
        </div>
      </div>
      <span
        className="chart-tab"
        role="button"
        tabIndex={0}
        onClick={() => navigate('/app/alerts')}
      >
        查看异常 →
      </span>
    </>
  );
}
