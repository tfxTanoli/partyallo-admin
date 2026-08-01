import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/auth-provider';
import { FullPageLoader } from '@/components/common/loader';
import { ROUTES } from './paths';

/**
 * Gate for every console route.
 *
 * Waits for Firebase to restore a persisted session before deciding — without
 * this, a reload would bounce an authenticated admin to `/login` for the frame
 * before `onAuthStateChanged` fires.
 *
 * `isAuthenticated` is already role-checked: `AuthProvider` only holds a session
 * for accounts whose `users/{uid}.role` is `admin`.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isResolving } = useAuth();
  const location = useLocation();

  if (isResolving) return <FullPageLoader />;

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
