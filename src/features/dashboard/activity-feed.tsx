import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { formatRelative } from '@/utils/format';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { eventDetailsPath } from '@/routes/paths';
import type { ActivityEntry } from '@/types';

/** Real packing history, flattened from every event's `logs[]`. */
export function ActivityFeed({ activities }: { activities: ActivityEntry[] }) {
  if (activities.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={History}
        title="No packing activity yet"
        description="Every pack, load and status change made in the crew app appears here."
      />
    );
  }

  return (
    <ul className="space-y-1">
      {activities.map((activity) => (
        <li key={activity.id}>
          <Link
            to={eventDetailsPath(activity.eventId)}
            className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent/60"
          >
            <Avatar name={activity.packerName} size="sm" className="shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug text-muted-foreground">
                <span className="font-medium text-foreground">{activity.packerName}</span>{' '}
                {activity.action}
              </span>
              <span className="mt-1 block truncate text-xs text-muted-foreground/80">
                {activity.eventName} · {formatRelative(activity.at)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="flex items-start gap-3 p-2.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}
