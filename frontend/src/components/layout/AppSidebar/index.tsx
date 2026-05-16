import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertOutlined,
  ApiOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  DashboardOutlined,
  GlobalOutlined,
  LineChartOutlined,
  ReadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { APP_TITLE } from '@/utils/constants';
import { ScopeVisible } from '@/components/common/ScopeVisible';
import styles from './index.module.less';

interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  badgeMarket?: number;
  badgeSymbol?: number;
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: '先看这些',
    items: [
      { key: 'dashboard', path: '/app/dashboard', label: '投资结论', icon: <DashboardOutlined /> },
      {
        key: 'alerts',
        path: '/app/alerts',
        label: '异常提醒',
        icon: <ThunderboltOutlined />,
        badgeMarket: 5,
        badgeSymbol: 3,
      },
      { key: 'ai-insights', path: '/app/ai-insights', label: '深度分析', icon: <AlertOutlined /> },
    ],
  },
  {
    title: '数据模块',
    items: [
      { key: 'market', path: '/app/market', label: '行情数据', icon: <LineChartOutlined /> },
      { key: 'fundamental', path: '/app/fundamental', label: '基本面财务', icon: <BarChartOutlined /> },
      { key: 'macro', path: '/app/macro', label: '宏观与行业', icon: <GlobalOutlined /> },
      { key: 'news', path: '/app/news', label: '资讯与舆情', icon: <ReadOutlined /> },
    ],
  },
  {
    title: '工具',
    items: [
      { key: 'portfolio-sim', path: '/app/portfolio-sim', label: '收益模拟器', icon: <CalculatorOutlined /> },
      { key: 'settings', path: '/app/settings', label: '数据源百科', icon: <ApiOutlined /> },
    ],
  },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeKey = useMemo(() => {
    const seg = location.pathname.split('/').pop();
    return seg ?? 'dashboard';
  }, [location.pathname]);

  return (
    <aside className={`sidebar ${styles.sidebar}`}>
      <div className="logo">
        <h1>
          <span className="logo-icon">◈</span> {APP_TITLE}
        </h1>
        <span>Financial Investment Command</span>
      </div>
      <nav className="nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="nav-section">{section.title}</div>
            {section.items.map((item) => (
              <div
                key={item.key}
                className={`nav-item${activeKey === item.key ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
                role="button"
                tabIndex={0}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
                {item.badgeMarket != null && (
                  <ScopeVisible scope="market">
                    <span className="badge badge-warn" style={{ marginLeft: 'auto', fontSize: 10 }}>
                      {item.badgeMarket}
                    </span>
                  </ScopeVisible>
                )}
                {item.badgeSymbol != null && (
                  <ScopeVisible scope="symbol">
                    <span className="badge badge-warn" style={{ marginLeft: 'auto', fontSize: 10 }}>
                      {item.badgeSymbol}
                    </span>
                  </ScopeVisible>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
