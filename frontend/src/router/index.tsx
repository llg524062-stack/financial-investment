import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PageLoading } from '@/components/common/PageLoading';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
