import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/dashboard-layout';
import { FullPageLoader } from '@/components/common/loader';
import { ProtectedRoute } from './protected-route';
import { RouteErrorBoundary } from './route-error';
import { ROUTES } from './paths';

// Route-level code splitting keeps the initial bundle small.
const LoginPage = lazy(() => import('@/pages/login-page'));
const DashboardPage = lazy(() => import('@/pages/dashboard-page'));
const UsersPage = lazy(() => import('@/pages/users-page'));
const EventsPage = lazy(() => import('@/pages/events-page'));
const EventDetailsPage = lazy(() => import('@/pages/event-details-page'));
const CataloguePage = lazy(() => import('@/pages/catalogue-page'));
const SettingsPage = lazy(() => import('@/pages/settings-page'));
const NotFoundPage = lazy(() => import('@/pages/not-found-page'));

function lazyRoute(element: React.ReactNode) {
  return <Suspense fallback={<FullPageLoader />}>{element}</Suspense>;
}

const routes: RouteObject[] = [
  {
    path: ROUTES.login,
    element: lazyRoute(<LoginPage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: lazyRoute(<DashboardPage />) },
          { path: ROUTES.users, element: lazyRoute(<UsersPage />) },
          { path: ROUTES.events, element: lazyRoute(<EventsPage />) },
          { path: ROUTES.eventDetails, element: lazyRoute(<EventDetailsPage />) },
          { path: ROUTES.catalogue, element: lazyRoute(<CataloguePage />) },
          { path: ROUTES.settings, element: lazyRoute(<SettingsPage />) },
          { path: '404', element: lazyRoute(<NotFoundPage />) },
          { path: '*', element: <Navigate to="/404" replace /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
