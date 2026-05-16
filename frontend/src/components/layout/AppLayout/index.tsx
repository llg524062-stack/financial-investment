import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppTopbar } from '@/components/layout/AppTopbar';
import { BackendStatusBar } from '@/components/layout/BackendStatusBar';
import { useAppStore } from '@/store/appStore';
import styles from './index.module.less';

export function AppLayout() {
  const scope = useAppStore((s) => s.scope);
  const globalLoading = useAppStore((s) => s.globalLoading);

  useEffect(() => {
    document.body.classList.remove('scope-market', 'scope-symbol');
    document.body.classList.add(scope === 'symbol' ? 'scope-symbol' : 'scope-market');
  }, [scope]);

  return (
    <div className="app">
      <AppSidebar />
      <main className="main">
        <AppTopbar />
        <div className={`content ${styles.content}`}>
          <BackendStatusBar />
          <Spin spinning={globalLoading} tip="加载中...">
            <Outlet />
          </Spin>
        </div>
      </main>
    </div>
  );
}
