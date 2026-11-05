import { useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Layers, Tag } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchInput } from '@/components/common/search-input';
import { FilterSelect } from '@/components/common/filter-select';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { useAllCatalogues } from '@/features/catalogue/hooks/use-catalogues';
import { matchesSearch } from '@/utils/table';
import type { SelectOption } from '@/types';

export interface AddStationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventName: string;
  /** How many slots of each catalogue station the event already has. */
  assignedCounts: Record<string, number>;
  onSubmit: (stationIds: string[]) => Promise<unknown>;
  loading?: boolean;
  /** Shown right after creating an event: offers "Skip for now" instead of "Cancel". */
  isFollowUp?: boolean;
}

export function AddStationsDialog({
  open,
  onOpenChange,
  eventName,
  assignedCounts,
  onSubmit,
  loading = false,
  isFollowUp = false,
}: AddStationsDialogProps) {
  const { data: stations, isPending, isError, refetch } = useAllCatalogues();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setCategory('all');
    setSelected([]);
  }, [open]);

  const categoryOptions = useMemo<SelectOption<string>[]>(() => {
    const categories = [...new Set((stations ?? []).map((station) => station.category))].sort();
    return [
      { label: 'All categories', value: 'all' },
      ...categories.map((value) => ({ label: value, value })),
    ];
  }, [stations]);

  const visible = useMemo(
    () =>
      (stations ?? []).filter(
        (station) =>
          (category === 'all' || station.category === category) &&
          matchesSearch(station, search, ['name', 'category', 'description']),
      ),
    [stations, category, search],
  );

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const submit = async () => {
    if (selected.length === 0 || submittingRef.current) return;
    submittingRef.current = true;
    try {
      await onSubmit(selected);
      onOpenChange(false);
    } catch {
      // Error toast comes from the mutation hook; keep the selection for a retry.
    } finally {
      submittingRef.current = false;
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && loading) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isFollowUp ? 'Add live stations' : 'Add stations'}</DialogTitle>
          <DialogDescription>
            {isFollowUp
              ? `Step 2 of 2 — pick the stations for ${eventName}. Each one's default packing list is copied onto the event.`
              : `Pick stations from the catalogue for ${eventName}. Each one's default packing list is copied onto the event.`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search stations…"
              className="sm:flex-1"
            />
            <FilterSelect
              ariaLabel="Filter by category"
              icon={Tag}
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              className="sm:w-52"
            />
          </div>

          {isError ? (
            <ErrorState
              title="Could not load the catalogue"
              description="The station list did not load. Check your connection and try again."
              onRetry={() => void refetch()}
            />
          ) : isPending ? (
            <div className="space-y-2" aria-busy="true" aria-label="Loading stations">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              size="sm"
              icon={Boxes}
              title={(stations ?? []).length === 0 ? 'The catalogue is empty' : 'No stations match'}
              description={
                (stations ?? []).length === 0
                  ? 'Create stations on the Station Catalogue screen first.'
                  : 'Try another search or category.'
              }
            />
          ) : (
            <ul
              className="max-h-[22rem] space-y-1.5 overflow-y-auto pr-1"
              aria-label="Catalogue stations"
            >
              {visible.map((station) => {
                const checked = selected.includes(station.id);
                const already = assignedCounts[station.id] ?? 0;
                return (
                  <li key={station.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                        checked
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border hover:border-primary/25 hover:bg-muted/40',
                      )}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggle(station.id)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {station.name}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{station.category}</span>
                          <span className="inline-flex items-center gap-1">
                            <Layers className="size-3" />
                            {station.defaultPackingList.length} items
                          </span>
                        </span>
                      </span>
                      {already > 0 ? (
                        <Badge tone="info" size="sm">
                          {already === 1 ? 'Already added' : `Added ×${already}`}
                        </Badge>
                      ) : null}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </DialogBody>

        <DialogFooter>
          <p
            className="text-center text-xs text-muted-foreground sm:mr-auto sm:self-center sm:text-left"
            aria-live="polite"
          >
            {selected.length > 0 ? `${selected.length} selected` : 'Nothing selected'}
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            {isFollowUp ? 'Skip for now' : 'Cancel'}
          </Button>
          <Button
            type="button"
            loading={loading}
            disabled={selected.length === 0 || loading}
            onClick={() => void submit()}
          >
            {selected.length > 1 ? `Add ${selected.length} stations` : 'Add station'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
