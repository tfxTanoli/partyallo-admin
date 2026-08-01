import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from './empty-state';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. Check your connection and try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={AlertOctagon}
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw />}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}
