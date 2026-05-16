import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from 'antd';
import { reportError } from '@/utils/errorReporter';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, { componentStack: info.componentStack ?? '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ margin: 48, textAlign: 'center' }}>
          <h2>页面出错了</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>
            请刷新页面或返回首页
          </p>
          <Button type="primary" onClick={() => window.location.assign('/app/dashboard')}>
            返回首页
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
