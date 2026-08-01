import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors',
  {
    variants: {
      tone: {
        primary: 'border-primary/20 bg-primary-soft text-primary',
        secondary: 'border-secondary/20 bg-secondary-soft text-secondary',
        success: 'border-success/20 bg-success-soft text-success',
        warning: 'border-warning/25 bg-warning-soft text-warning',
        danger: 'border-danger/20 bg-danger-soft text-danger',
        info: 'border-info/20 bg-info-soft text-info',
        neutral: 'border-border bg-muted text-muted-foreground',
      },
      size: {
        sm: 'px-2 py-0.5 text-[0.6875rem]',
        md: 'px-2.5 py-1 text-xs',
      },
      solid: {
        true: 'border-transparent text-white',
      },
    },
    compoundVariants: [
      { solid: true, tone: 'primary', class: 'bg-primary text-primary-foreground' },
      { solid: true, tone: 'secondary', class: 'bg-secondary text-secondary-foreground' },
      { solid: true, tone: 'success', class: 'bg-success text-success-foreground' },
      { solid: true, tone: 'warning', class: 'bg-warning text-warning-foreground' },
      { solid: true, tone: 'danger', class: 'bg-danger text-danger-foreground' },
      { solid: true, tone: 'info', class: 'bg-info text-info-foreground' },
      { solid: true, tone: 'neutral', class: 'bg-foreground/80 text-background' },
    ],
    defaultVariants: {
      tone: 'neutral',
      size: 'md',
    },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Renders a small leading status dot. */
  dot?: boolean;
}

export function Badge({ className, tone, size, solid, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size, solid }), className)} {...props}>
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export { badgeVariants };
