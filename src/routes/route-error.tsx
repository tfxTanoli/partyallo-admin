import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { AlertOctagon, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from './paths';

/**
 * Router-level fallback. The app-level `<ErrorBoundary>` sits above
 * `RouterProvider`, so React Router intercepts route errors before it —
 * this keeps them inside the product shell instead of the dev overlay.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : 'Something went wrong';

  const detail = isRouteErrorResponse(error)
    ? 'That route could not be resolved.'
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred while loading this screen.';

  return (
    <div className="surface-gradient grid min-h-dvh place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger">
          <AlertOctagon className="size-6" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 break-words text-sm leading-relaxed text-muted-foreground">{detail}</p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Button leftIcon={<RefreshCw />} onClick={() => window.location.reload()}>
            Reload
          </Button>
          <Button variant="outline" asChild leftIcon={<Home />}>
            <Link to={ROUTES.dashboard}>Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
