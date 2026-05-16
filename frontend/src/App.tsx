import { App as AntApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { AppRouter } from '@/router';
import { antdTheme } from '@/config/theme';

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <AntApp>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  );
}
