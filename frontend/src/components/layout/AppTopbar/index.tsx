import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, Input } from 'antd';
import { LogoutOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { logoutApi } from '@/api/modules/auth';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppStore } from '@/store/appStore';
import { resolveSymbol } from '@/api/modules/market';
import { ScopeVisible } from '@/components/common/ScopeVisible';
import styles from './index.module.less';

export function AppTopbar() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);
  const searchValue = useAppStore((s) => s.searchValue);
  const currentSymbol = useAppStore((s) => s.currentSymbol);
  const setSearchValue = useAppStore((s) => s.setSearchValue);
  const setScopeMarket = useAppStore((s) => s.setScopeMarket);
  const setScopeSymbol = useAppStore((s) => s.setScopeSymbol);
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q) return;
    void resolveSymbol(q).then((info) => {
      if (info) setScopeSymbol(info.code, info.display);
    });
  }, [debouncedSearch, setScopeSymbol]);

  return (
    <header className="topbar">
      <div className="search-box">
        <div className="search-inner">
          <span className="search-icon">
            <SearchOutlined />
          </span>
          <Input
            className={styles.searchInput}
            placeholder="搜索股票代码或名称，留空=全市场概览…"
            value={searchValue}
            onChange={(e) => {
              const v = e.target.value;
              setSearchValue(v);
              if (!v.trim()) setScopeMarket();
            }}
            onPressEnter={() => {
              if (searchValue.trim()) navigate('/app/dashboard');
            }}
            variant="borderless"
          />
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
          实时行情 · 延迟 0.3s
        </div>
        <Dropdown
          menu={{
            items: [
              { key: 'user', label: user?.displayName ?? '用户', disabled: true },
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: '退出登录',
                onClick: () => {
                  void logoutApi().catch(() => undefined);
                  clearAuth();
                  navigate('/login', { replace: true });
                },
              },
            ],
          }}
        >
          <button type="button" className="chart-tab" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserOutlined /> 账户
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
