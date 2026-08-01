import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { APP_NAME } from '@/constants/app';

export interface LoaderProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 'size-4', md: 'size-6', lg: 'size-8' } as const;

export function Loader({ label, className, size = 'md' }: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center gap-3 text-muted-foreground', className)}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
      {label ? <span className="text-sm">{label}</span> : <span className="sr-only">Loading</span>}
    </div>
  );
}

/** Full-viewport splash used as the router-level lazy fallback. */
export function FullPageLoader() {
  return (
    <div className="surface-gradient grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/20" />
          <div className="relative grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lifted">
            <span className="text-lg font-bold">P</span>
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Loading {APP_NAME}…</p>
      </div>
    </div>
  );
}
