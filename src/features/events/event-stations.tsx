import { motion } from 'motion/react';
import { Boxes, PackageCheck, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { Progress } from '@/components/ui/progress';
import { StationStatusBadge } from '@/components/common/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { stationPercent } from './packing';
import type { EventStationSummary } from '@/types';

export function EventStations({ stations }: { stations: EventStationSummary[] }) {
  if (stations.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={Boxes}
        title="No stations assigned"
        description="Assign stations to this event in the PartyAllo crew app and their packing progress will appear here."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {stations.map((station, index) => {
        const percent = stationPercent(station.itemsPacked, station.itemsTotal);
        const complete = percent >= 100;

        return (
          <motion.li
            key={station.instanceId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
            className="rounded-xl border border-border bg-muted/25 p-4 transition-colors hover:border-primary/25 hover:bg-muted/45"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{station.name}</p>
                {station.servings ? (
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    {formatNumber(station.servings)} servings
                  </p>
                ) : null}
              </div>
              <StationStatusBadge status={station.status} />
            </div>

            <div className="mt-3.5 flex items-center gap-3">
              <Progress
                value={percent}
                size="sm"
                label={`${station.name} packing progress`}
                indicatorClassName={cn(complete ? 'bg-success' : 'bg-primary')}
                className="flex-1"
              />
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 text-xs font-semibold tabular-nums',
                  complete ? 'text-success' : 'text-muted-foreground',
                )}
              >
                {complete ? <PackageCheck className="size-3.5" /> : null}
                {formatNumber(station.itemsPacked)} / {formatNumber(station.itemsTotal)}
              </span>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
