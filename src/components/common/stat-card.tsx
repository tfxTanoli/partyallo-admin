import { motion } from 'motion/react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatCompactNumber, formatNumber, formatSigned } from '@/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeInUp } from './motion';
import type { DeltaMetric } from '@/types';

export type StatTone = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

const toneStyles: Record<StatTone, { icon: string; glow: string }> = {
  primary: { icon: 'bg-primary-soft text-primary', glow: 'from-primary/12' },
  secondary: { icon: 'bg-secondary-soft text-secondary', glow: 'from-secondary/12' },
  success: { icon: 'bg-success-soft text-success', glow: 'from-success/12' },
  warning: { icon: 'bg-warning-soft text-warning', glow: 'from-warning/12' },
  danger: { icon: 'bg-danger-soft text-danger', glow: 'from-danger/12' },
  info: { icon: 'bg-info-soft text-info', glow: 'from-info/12' },
};

export interface StatCardProps {
  label: string;
  metric: DeltaMetric;
  icon: LucideIcon;
  tone?: StatTone;
  /** Shown next to the delta, e.g. "vs last 30 days". */
  comparisonLabel?: string;
  /** Shown alone when there is no movement to report. */
  staticLabel?: string;
  className?: string;
}

export function StatCard({
  label,
  metric,
  icon: Icon,
  tone = 'primary',
  comparisonLabel = 'in the last 30 days',
  staticLabel,
  className,
}: StatCardProps) {
  const styles = toneStyles[tone];
  const TrendIcon =
    metric.trend === 'up' ? ArrowUpRight : metric.trend === 'down' ? ArrowDownRight : ArrowRight;

  const trendClass =
    metric.trend === 'up'
      ? 'text-success bg-success-soft'
      : metric.trend === 'down'
        ? 'text-danger bg-danger-soft'
        : 'text-muted-foreground bg-muted';

  return (
    <motion.article
      variants={fadeInUp}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-shadow duration-300 hover:shadow-lifted',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100',
          styles.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', styles.icon)}>
          <Icon className="size-4.5" />
        </span>
      </div>

      <p className="relative mt-4 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
        {formatCompactNumber(metric.value)}
      </p>

      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        {metric.changePercent !== null ? (
          <>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                trendClass,
              )}
            >
              <TrendIcon className="size-3" />
              {formatSigned(metric.changePercent)}
            </span>
            <span className="text-xs text-muted-foreground">{comparisonLabel}</span>
          </>
        ) : metric.absoluteChange > 0 ? (
          // No prior-period baseline to divide by — state the real count
          // rather than inventing a percentage.
          <>
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold tabular-nums text-success">
              <ArrowUpRight className="size-3" />+{formatNumber(metric.absoluteChange)}
            </span>
            <span className="text-xs text-muted-foreground">{comparisonLabel}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{staticLabel ?? comparisonLabel}</span>
        )}
      </div>
    </motion.article>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-9 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-3.5 h-5 w-32" />
    </div>
  );
}
