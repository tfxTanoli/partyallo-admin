import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid = false, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full resize-y rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-soft outline-none transition-all duration-200',
        'placeholder:text-muted-foreground/70 hover:border-primary/30',
        'focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-60',
        invalid && 'border-danger focus-visible:border-danger focus-visible:ring-danger/15',
        className,
      )}
      {...props}
    />
  );
});
