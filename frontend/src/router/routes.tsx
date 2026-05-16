import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { AppLayout } from '@/components/layout/AppLayout';

/** Lazy-loaded page modules */
const LoginPage = lazy(() => import('@/pages/login'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const AlertsPage = lazy(() => import('@/pages/alerts'));
const AiInsightsPage = lazy(() => import('@/pages/ai-insights'));
const MarketPage = lazy(() => import('@/pages/market'));
const FundamentalPage = lazy(() => import('@/pages/fundamental'));
const MacroPage = lazy(() => import('@/pages/macro'));
const NewsPage = lazy(() => import('@/pages/news'));
const PortfolioSimPage = lazy(() => import('@/pages/portfolio-sim'));
const SettingsPage = lazy(() => import('@/pages/settings'));
const NotFoundPage = lazy(() => import('@/pages/errors/NotFound'));
const ForbiddenPage = lazy(() => import('@/pages/errors/Forbidden'));
const ServerErrorPage = lazy(() => import('@/pages/errors/ServerError'));

/** Application route tree — add new business routes here */
export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/app',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'alerts', element: <AlertsPage /> },
      { path: 'ai-insights', element: <AiInsightsPage /> },
      { path: 'market', element: <MarketPage /> },
      { path: 'fundamental', element: <FundamentalPage /> },
      { path: 'macro', element: <MacroPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'portfolio-sim', element: <PortfolioSimPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '/', element: <LoginPage /> },
  { path: '*', element: <NotFoundPage /> },
];
