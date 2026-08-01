import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';

export interface TooltipEntry {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface ChartTooltipProps {
  title: string;
  entries: TooltipEntry[];
  footer?: ReactNode;
  className?: string;
}

/**
 * Shared tooltip surface. Values wear text tokens; the colour lives in the swatch
 * beside the label so identity is never carried by the number itself.
 */
export function ChartTooltip({ title, entries, footer, className }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        'min-w-[9.5rem] rounded-xl border border-border bg-popover px-3 py-2.5 shadow-pop',
        className,
      )}
    >
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {entries.map((entry) => (
          <li key={entry.key} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex-1 text-muted-foreground">{entry.label}</span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(entry.value)}
            </span>
          </li>
        ))}
      </ul>
      {footer ? (
        <div className="mt-2 border-t border-border pt-2 text-[0.6875rem] text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export interface ChartLegendItem {
  label: string;
  color: string;
}

export function ChartLegend({ items, className }: { items: ChartLegendItem[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden
            className="size-2.5 rounded-[3px]"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
