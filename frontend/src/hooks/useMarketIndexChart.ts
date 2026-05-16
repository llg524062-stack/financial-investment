import { useEffect } from 'react';
import { INDEX_META } from '@/constants/indexMeta';
import type { MarketIndexPeriod } from '@/types/market';

type IndexKey = keyof typeof INDEX_META;

function periodReturn(series: number[]): { text: string; up: boolean } {
  const pct = ((series[series.length - 1] - series[0]) / series[0]) * 100;
  const sign = pct >= 0 ? '+' : '';
  return { text: sign + pct.toFixed(1) + '%', up: pct >= 0 };
}

export function useMarketIndexChart(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  pack: MarketIndexPeriod | null,
  visible: Set<IndexKey>,
): void {
  const key = pack ? pack.labels.join() + [...visible].join() : '';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pack) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const pad = { t: 20, r: 20, b: 32, l: 44 };
      const cw = w - pad.l - pad.r;
      const ch = h - pad.t - pad.b;
      const activeKeys = (['sp500', 'nasdaq', 'csi300'] as IndexKey[]).filter((k) => visible.has(k));
      const allVals = activeKeys.flatMap((k) => pack[k]);
      let min = Math.min(...allVals);
      let max = Math.max(...allVals);
      const margin = (max - min) * 0.12 || 2;
      min -= margin;
      max += margin;
      const range = max - min || 1;
      ctx.clearRect(0, 0, w, h);
      const y100 = pad.t + ch - ((100 - min) / range) * ch;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.l, y100);
      ctx.lineTo(w - pad.r, y100);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i <= 4; i++) {
        const v = min + (range / 4) * i;
        const y = pad.t + ch - ((v - min) / range) * ch;
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
        ctx.stroke();
        ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(((v - 100) >= 0 ? '+' : '') + (v - 100).toFixed(0) + '%', pad.l - 6, y + 3);
      }
      ctx.textAlign = 'center';
      pack.labels.forEach((lb, i) => {
        const x = pad.l + (cw / Math.max(pack.labels.length - 1, 1)) * i;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
        ctx.fillText(lb, x, h - 8);
      });
      activeKeys.forEach((k) => {
        const data = pack[k];
        const color = INDEX_META[k].color;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        data.forEach((v, i) => {
          const x = pad.l + (cw / Math.max(data.length - 1, 1)) * i;
          const y = pad.t + ch - ((v - min) / range) * ch;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        const lastI = data.length - 1;
        const lx = pad.l + (cw / Math.max(data.length - 1, 1)) * lastI;
        const ly = pad.t + ch - ((data[lastI] - min) / range) * ch;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fill();
        const ret = periodReturn(data);
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ret.text, lx + 8, ly - 6);
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [canvasRef, key, pack, visible]);
}
