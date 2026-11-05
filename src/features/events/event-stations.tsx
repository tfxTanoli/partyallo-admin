import { motion } from 'motion/react';
import { Boxes, PackageCheck, Plus, Trash2, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip } from '@/components/ui/tooltip';
import { StationStatusBadge } from '@/components/common/status-badge';
import { EmptyState } from '@/components/common/empty-state';
import { stationPercent } from './packing';
import type { EventStationSummary } from '@/types';

export interface EventStationsProps {
  stations: EventStationSummary[];
  /** When provided, each assigned station gets a remove action. */
  onRemove?: (station: EventStationSummary) => void;
  /** When provided, the empty state offers to add stations. */
  onAdd?: () => void;
}

/** Custom items with no station share this pseudo-group; it cannot be removed as a station. */
const UNASSIGNED_KEY = 'Unassigned';

export function EventStations({ stations, onRemove, onAdd }: EventStationsProps) {
  if (stations.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={Boxes}
        title="No stations assigned"
        description={
          onAdd
            ? 'Add live stations from the catalogue. Their packing lists go straight to the crew app.'
            : 'Assign stations to this event and their packing progress will appear here.'
        }
        action={
          onAdd ? (
            <Button size="sm" leftIcon={<Plus />} onClick={onAdd}>
              Add stations
            </Button>
          ) : undefined
        }
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
              <div className="flex items-center gap-1">
                <StationStatusBadge status={station.status} />
                {onRemove && station.instanceId !== UNASSIGNED_KEY ? (
                  <Tooltip content="Remove station">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${station.name}`}
                      className="text-muted-foreground hover:bg-danger-soft hover:text-danger"
                      onClick={() => onRemove(station)}
                    >
                      <Trash2 />
                    </Button>
                  </Tooltip>
                ) : null}
              </div>
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
