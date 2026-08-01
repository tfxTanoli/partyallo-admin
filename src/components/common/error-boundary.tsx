import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches render-time failures so a broken screen never blanks the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[partyallo] Unhandled render error', error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="surface-gradient grid min-h-dvh place-items-center bg-background px-6">
        <div className="max-w-md text-center">
          <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-danger-soft text-danger">
            <AlertOctagon className="size-6" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Something broke on this screen
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {this.state.error.message || 'An unexpected error occurred while rendering.'}
          </p>
          <Button
            className="mt-6"
            leftIcon={<RefreshCw />}
            onClick={() => window.location.reload()}
          >
            Reload the console
          </Button>
        </div>
      </div>
    );
  }
}
