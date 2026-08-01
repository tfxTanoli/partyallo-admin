import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { EASE_OUT_EXPO } from './motion';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        size === 'md' ? 'py-16' : 'py-10',
        className,
      )}
    >
      <div className="relative mb-5">
        <div
          aria-hidden
          className="absolute inset-0 -m-3 rounded-3xl bg-gradient-to-br from-primary/12 via-secondary/8 to-transparent blur-xl"
        />
        <div
          className={cn(
            'relative grid place-items-center rounded-2xl border border-border bg-card shadow-soft',
            size === 'md' ? 'size-16' : 'size-14',
          )}
        >
          <Icon className={cn('text-primary', size === 'md' ? 'size-7' : 'size-6')} strokeWidth={1.6} />
        </div>
      </div>

      <h3 className={cn('font-semibold text-foreground', size === 'md' ? 'text-lg' : 'text-base')}>
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>

      {action || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </motion.div>
  );
}
