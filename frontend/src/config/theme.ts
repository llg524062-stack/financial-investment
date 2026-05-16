import { theme, type ThemeConfig } from 'antd';

/** Ant Design theme — align with Less variables */
export const antdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#10b981',
    colorBgBase: '#0a0e17',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    borderRadius: 12,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  components: {
    Layout: {
      bodyBg: '#0a0e17',
      siderBg: 'rgba(10, 14, 23, 0.85)',
    },
    Card: {
      colorBgContainer: 'rgba(15, 23, 42, 0.5)',
    },
    Table: {
      colorBgContainer: 'transparent',
    },
  },
};
