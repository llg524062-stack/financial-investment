import { useEffect, useMemo, useRef, useState } from 'react';
import { INDEX_META } from '@/constants/indexMeta';
import { fetchIndexSeries } from '@/api/modules/dashboard';
import { useMarketIndexChart } from '@/hooks/useMarketIndexChart';
import type { MarketIndexPeriod } from '@/types/market';

type IndexKey = keyof typeof INDEX_META;
type PeriodKey = '1m' | '3m' | '6m' | '1y';

function periodReturn(series: number[]): { text: string; up: boolean } {
  if (!series.length) return { text: '区间 —', up: true };
  const pct = ((series[series.length - 1] - series[0]) / series[0]) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { text: `区间 ${sign}${pct.toFixed(1)}%`, up: pct >= 0 };
}

const EMPTY_PACK: MarketIndexPeriod = {
  labels: [],
  sp500: [100],
  nasdaq: [100],
  csi300: [100],
  insight: '加载中…',
};

export function MarketIndexChart() {
  const [period, setPeriod] = useState<PeriodKey>('3m');
  const [visible, setVisible] = useState<Set<IndexKey>>(
    () => new Set(['sp500', 'nasdaq', 'csi300']),
  );
  const [pack, setPack] = useState<MarketIndexPeriod>(EMPTY_PACK);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    void fetchIndexSeries(period).then(setPack);
  }, [period]);

  useMarketIndexChart(canvasRef, pack, visible);

  const stats = useMemo(
    () =>
      (['sp500', 'nasdaq', 'csi300'] as IndexKey[]).map((key) => {
        const series = pack[key];
        const last = series.length ? series[series.length - 1] : 0;
        return {
          key,
          name: INDEX_META[key].label,
          color: INDEX_META[key].color,
          price: series.length ? `${last.toFixed(1)}` : '—',
          ret: periodReturn(series),
        };
      }),
    [pack],
  );

  const toggleIndex = (key: IndexKey) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size <= 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="card index-chart-card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="card-label">主要指数走势</div>
          <p className="index-chart-sub">归一化对比（数据来自后端 AkShare / yfinance 同步）</p>
        </div>
        <div className="chart-tabs" role="tablist">
          {(['1m', '3m', '6m', '1y'] as PeriodKey[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`chart-tab${period === p ? ' active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '1m' ? '1 月' : p === '3m' ? '3 月' : p === '6m' ? '6 月' : '1 年'}
            </button>
          ))}
        </div>
      </div>

      <div className="index-legend">
        {(Object.keys(INDEX_META) as IndexKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`index-legend-item${visible.has(key) ? ' active' : ''}`}
            onClick={() => toggleIndex(key)}
          >
            <span className="dot" style={{ background: INDEX_META[key].color }} />
            {INDEX_META[key].label}
          </button>
        ))}
      </div>

      <div className="chart-area index-chart-area">
        <canvas ref={canvasRef} aria-label="主要指数归一化走势对比图" />
      </div>

      <div className="index-stat-row">
        {stats.map((s) => (
          <div
            key={s.key}
            className="index-stat"
            style={{ opacity: visible.has(s.key) ? 1 : 0.35 }}
          >
            <div className="name">{s.name}</div>
            <div className="val">{s.price}</div>
            <div className={`chg ${s.ret.up ? 'num-up' : 'num-down'}`}>{s.ret.text}</div>
          </div>
        ))}
      </div>

      <div className="plain-box index-insight">
        <strong>读图要点：</strong>
        {pack.insight}
      </div>
    </div>
  );
}
