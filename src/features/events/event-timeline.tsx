import { History } from 'lucide-react';
import { formatDateTime } from '@/utils/format';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/common/empty-state';
import type { PackingLog } from '@/types';

/**
 * The real packing history the crew app writes to `event.logs[]` — newest first.
 * Nothing here is synthesised; an event with no activity yet shows an empty state.
 */
export function EventTimeline({ logs }: { logs: PackingLog[] }) {
  if (logs.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={History}
        title="No packing activity yet"
        description="Every pack, load and status change made in the crew app is recorded here."
      />
    );
  }

  const ordered = [...logs].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  return (
    // A busy event accumulates hundreds of log lines; scroll them inside the
    // card rather than letting the page grow without bound.
    <ol className="relative max-h-[28rem] space-y-0 overflow-y-auto pr-1">
      {ordered.map((log, index) => {
        const isLast = index === ordered.length - 1;

        return (
          <li key={log.id} className="relative flex gap-4 pb-5 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className="absolute left-4 top-9 h-[calc(100%-1.75rem)] w-0.5 rounded-full bg-border"
              />
            ) : null}

            <Avatar name={log.packerName} size="sm" className="relative z-10 mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium text-foreground">{log.packerName}</p>
                <time className="text-xs tabular-nums text-muted-foreground" dateTime={log.timestamp}>
                  {formatDateTime(log.timestamp)}
                </time>
              </div>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{log.action}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
