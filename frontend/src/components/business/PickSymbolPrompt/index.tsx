import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { fetchWatchlist } from '@/api/modules/market';
import type { StockRowItem } from '@/types/market';

const DEFAULT_PICKS = [
  { code: 'NVDA', name: '英伟达' },
  { code: 'MSFT', name: '微软' },
  { code: 'AAPL', name: '苹果' },
  { code: '600519', name: '贵州茅台' },
];

interface PickSymbolPromptProps {
  title?: string;
  description?: string;
}

export function PickSymbolPrompt({
  title = '请先选择要分析的股票',
  description = '在顶栏输入代码后按回车，或点击下方自选股进入个股分析。',
}: PickSymbolPromptProps) {
  const navigate = useNavigate();
  const setScopeSymbol = useAppStore((s) => s.setScopeSymbol);
  const [rows, setRows] = useState<StockRowItem[]>([]);

  useEffect(() => {
    void fetchWatchlist().then(setRows).catch(() => setRows([]));
  }, []);

  const pick = (code: string, name: string) => {
    setScopeSymbol(code, `${code} · ${name}`);
    navigate('/app/dashboard');
  };

  const picks = rows.length
    ? rows.map((r) => ({ code: r.symbol, name: r.name }))
    : DEFAULT_PICKS;

  return (
    <div className="card" style={{ margin: '24px 0', textAlign: 'center', padding: 32 }}>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>{description}</p>
      <div className="quick-picks" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        {picks.map((p) => (
          <button key={p.code} type="button" className="quick-pick" onClick={() => pick(p.code, p.name)}>
            {p.code}
          </button>
        ))}
      </div>
    </div>
  );
}
