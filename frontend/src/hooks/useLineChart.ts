import { useEffect } from 'react';

export function useLineChart(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  data: number[],
  color = '#10b981',
  withCandles = false,
): void {
  const dataKey = data.join(',');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      if (rect.width < 10) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const pad = { t: 16, r: 16, b: 24, l: 40 };
      const cw = w - pad.l - pad.r;
      const ch = h - pad.t - pad.b;
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min || 1;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      for (let i = 0; i <= 4; i++) {
        const y = pad.t + (ch / 4) * i;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(w - pad.r, y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      data.forEach((v, i) => {
        const x = pad.l + (cw / (data.length - 1)) * i;
        const y = pad.t + ch - ((v - min) / range) * ch;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      if (withCandles) {
        const candles = 24;
        const bw = (cw / candles) * 0.6;
        let price = 120;
        for (let i = 0; i < candles; i++) {
          const o = price;
          const change = (Math.random() - 0.45) * 4;
          const c = o + change;
          const hi = Math.max(o, c) + Math.random() * 2;
          const lo = Math.min(o, c) - Math.random() * 2;
          price = c;
          const x = pad.l + (cw / candles) * i + cw / candles / 2;
          const scale = (v: number) => pad.t + ch - ((v - 115) / 20) * ch;
          const up = c >= o;
          ctx.strokeStyle = ctx.fillStyle = up ? '#10b981' : '#ef4444';
          ctx.beginPath();
          ctx.moveTo(x, scale(hi));
          ctx.lineTo(x, scale(lo));
          ctx.stroke();
          const top = scale(Math.max(o, c));
          const bot = scale(Math.min(o, c));
          ctx.fillRect(x - bw / 2, top, bw, Math.max(bot - top, 2));
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [canvasRef, dataKey, color, withCandles]);
}
