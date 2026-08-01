import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  invalid?: boolean;
  /**
   * Sizes the positioning wrapper. Use this — not `className` — when the input
   * is a flex item, since the wrapper is what the parent layout actually sees.
   */
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, containerClassName, leftIcon, rightSlot, invalid = false, type = 'text', ...props },
  ref,
) {
  return (
    <div className={cn('relative w-full', containerClassName)}>
      {leftIcon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
          {leftIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        className={cn(
          'h-10 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground shadow-soft outline-none transition-all duration-200',
          'placeholder:text-muted-foreground/70',
          'hover:border-primary/30',
          'focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60',
          leftIcon && 'pl-9.5',
          rightSlot && 'pr-10',
          invalid && 'border-danger focus-visible:border-danger focus-visible:ring-danger/15',
          className,
        )}
        {...props}
      />
      {rightSlot ? (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
          {rightSlot}
        </span>
      ) : null}
    </div>
  );
});
