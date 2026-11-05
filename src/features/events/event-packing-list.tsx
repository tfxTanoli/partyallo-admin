import { useMemo, useState } from 'react';
import { Check, PackageOpen, Search, Truck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/empty-state';
import { formatNumber, formatRelative } from '@/utils/format';
import type { PackingItem } from '@/types';

type Filter = 'all' | 'outstanding' | 'packed';

/** Read-only view of the event's real packing list. Ticking happens in the crew app. */
export function EventPackingList({ items }: { items: PackingItem[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [term, setTerm] = useState('');

  const packable = useMemo(() => items.filter((item) => item.isToPack), [items]);

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return packable.filter((item) => {
      if (filter === 'packed' && !item.isPacked) return false;
      if (filter === 'outstanding' && item.isPacked) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        (item.stationName ?? '').toLowerCase().includes(needle)
      );
    });
  }, [packable, filter, term]);

  const packedCount = packable.filter((item) => item.isPacked).length;

  if (packable.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={PackageOpen}
        title="Nothing to pack yet"
        description="Add stations to this event (Stations → Add) to generate its packing list."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All {packable.length}</TabsTrigger>
            <TabsTrigger value="outstanding">
              Outstanding {packable.length - packedCount}
            </TabsTrigger>
            <TabsTrigger value="packed">Packed {packedCount}</TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Filter items…"
          aria-label="Filter packing items"
          leftIcon={<Search />}
          containerClassName="sm:ml-auto sm:max-w-56"
          className="h-9 [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          size="sm"
          icon={Search}
          title="No items match"
          description="Try a different search term or switch the filter above."
        />
      ) : (
        <ul className="max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
          {visible.map((item) => (
            <li
              key={item.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors',
                item.isPacked
                  ? 'border-success/20 bg-success-soft/45'
                  : 'border-border bg-muted/25',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-md border',
                  item.isPacked
                    ? 'border-success bg-success text-white'
                    : 'border-input bg-card',
                )}
              >
                {item.isPacked ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-sm',
                    item.isPacked ? 'text-muted-foreground' : 'font-medium text-foreground',
                  )}
                >
                  {item.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.stationName ?? 'Unassigned'}
                  {item.packedBy ? ` · packed by ${item.packedBy}` : ''}
                  {item.packedAt ? ` ${formatRelative(item.packedAt)}` : ''}
                </p>
              </div>

              {item.isLoaded ? (
                <Badge tone="secondary" size="sm">
                  <Truck className="size-3" />
                  Loaded
                </Badge>
              ) : null}

              <span className="shrink-0 whitespace-nowrap text-xs font-medium tabular-nums text-muted-foreground">
                {formatNumber(item.qty)} {item.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
