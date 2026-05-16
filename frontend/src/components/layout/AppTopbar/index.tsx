import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { resolveSymbol } from '@/api/modules/market';
import { syncSymbol } from '@/api/modules/sync';
import { ScopeVisible } from '@/components/common/ScopeVisible';
import styles from './index.module.less';

const QUICK_SYMBOLS = ['NVDA', 'MSFT', 'AAPL', '600519'];

export function AppTopbar() {
  const navigate = useNavigate();
  const searchValue = useAppStore((s) => s.searchValue);
  const currentSymbol = useAppStore((s) => s.currentSymbol);
  const setSearchValue = useAppStore((s) => s.setSearchValue);
  const setScopeMarket = useAppStore((s) => s.setScopeMarket);
  const setScopeSymbol = useAppStore((s) => s.setScopeSymbol);

  const commitSearch = useCallback(() => {
    const q = searchValue.trim();
    if (!q) {
      setScopeMarket();
      navigate('/app/dashboard');
      return;
    }
    void resolveSymbol(q).then((info) => {
      if (!info) {
        message.warning('未识别该代码，请尝试 NVDA、MSFT、600519 等');
        return;
      }
      setScopeSymbol(info.code, info.display);
      navigate('/app/dashboard');
      message.success(`已切换到 ${info.display}`);
      void syncSymbol(info.code).catch(() => {
        message.info('后台正在同步行情，请稍后刷新页面');
      });
    });
  }, [searchValue, setScopeMarket, setScopeSymbol, navigate]);

  const quickPick = (code: string) => {
    void resolveSymbol(code).then((info) => {
      if (info) {
        setScopeSymbol(info.code, info.display);
        navigate('/app/dashboard');
        void syncSymbol(info.code).catch(() => undefined);
      }
    });
  };

  return (
    <header className="topbar">
      <div className="search-box">
        <div className="search-inner">
          <span className="search-icon">
            <SearchOutlined />
          </span>
          <Input
            className={styles.searchInput}
            placeholder="输入代码或名称，回车切换标的（如 NVDA、600519）"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={commitSearch}
            variant="borderless"
          />
          <button type="button" className="search-clear" title="搜索" onClick={commitSearch}>
            搜索
          </button>
          {searchValue ? (
            <button
              type="button"
              className="search-clear"
              title="返回全市场"
              onClick={() => {
                setScopeMarket();
                navigate('/app/dashboard');
              }}
            >
              ×
            </button>
          ) : null}
        </div>
        <div className="quick-picks" style={{ marginTop: 8 }}>
          {QUICK_SYMBOLS.map((s) => (
            <button
              key={s}
              type="button"
              className={`quick-pick${currentSymbol === s ? ' active' : ''}`}
              onClick={() => quickPick(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="topbar-actions">
        <span className="scope-badge">
          <ScopeVisible scope="market">
            <span>◎ 全市场</span>
          </ScopeVisible>
          <ScopeVisible scope="symbol">
            <span>◈ {currentSymbol ?? '—'}</span>
          </ScopeVisible>
        </span>
        <div className="watchlist-pill">
          <span className="dot" />
          {currentSymbol ? `当前标的 ${currentSymbol}` : '全市场概览'}
        </div>
      </div>
    </header>
  );
}
