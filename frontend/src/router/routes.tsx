import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

/** Lazy-loaded page modules */
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

/** Application route tree — no login required (private demo) */
export const routes: RouteObject[] = [
  {
    path: '/app',
    element: <AppLayout />,
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
  { path: '/login', element: <Navigate to="/app/dashboard" replace /> },
  { path: '/', element: <Navigate to="/app/dashboard" replace /> },
  { path: '/403', element: <ForbiddenPage /> },
  { path: '/500', element: <ServerErrorPage /> },
  { path: '*', element: <NotFoundPage /> },
];
