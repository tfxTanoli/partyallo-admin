import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/common/page-header';
import { SearchInput } from '@/components/common/search-input';
import { FilterSelect } from '@/components/common/filter-select';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { Pagination } from '@/components/common/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { RowActions } from '@/components/common/row-actions';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EventStatusBadge } from '@/components/common/status-badge';
import { useDataTable } from '@/hooks/use-data-table';
import { useDisclosure, useEntityDisclosure } from '@/hooks/use-disclosure';
import {
  useCreateEvent,
  useDeleteEvent,
  useEvents,
  useUpdateEvent,
} from '@/features/events/hooks/use-events';
import { EventFormDialog } from '@/features/events/event-form-dialog';
import { computePackingProgress } from '@/features/events/packing';
import { EVENT_STATUS_META } from '@/constants/status';
import { formatDate, formatNumber, isUpcoming, truncate } from '@/utils/format';
import { formatEventTimeRange } from '@/utils/schedule';
import { eventDetailsPath } from '@/routes/paths';
import { EVENT_STATUSES } from '@/types';
import type { EventFilters, EventSortField, PartyEvent, SelectOption } from '@/types';

type WindowFilter = NonNullable<EventFilters['window']>;
type StatusFilter = NonNullable<EventFilters['status']>;

const WINDOW_TABS: { value: WindowFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

const STATUS_OPTIONS: SelectOption<StatusFilter>[] = [
  { label: 'All statuses', value: 'all' },
  ...EVENT_STATUSES.map((status) => ({ label: EVENT_STATUS_META[status].label, value: status })),
];

const INITIAL_FILTERS: Required<EventFilters> = { status: 'all', window: 'all' };

export default function EventsPage() {
  const navigate = useNavigate();

  const table = useDataTable<Required<EventFilters>, EventSortField>({
    initialSort: { field: 'date', direction: 'desc' },
    initialFilters: INITIAL_FILTERS,
  });

  const { data, isPending, isError, refetch } = useEvents(table.query);

  const createDialog = useDisclosure();
  const editDialog = useEntityDisclosure<PartyEvent>();
  const deleteDialog = useEntityDisclosure<PartyEvent>();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.entity) return;
    await deleteEvent.mutateAsync(deleteDialog.entity.id);
    deleteDialog.close();
  }, [deleteDialog, deleteEvent]);

  const openDetails = useCallback(
    (event: PartyEvent) => navigate(eventDetailsPath(event.id)),
    [navigate],
  );

  const columns = useMemo<DataTableColumn<PartyEvent, EventSortField>[]>(
    () => [
      {
        id: 'event',
        header: 'Event',
        sortField: 'eventName',
        cell: (event) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{event.eventName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {truncate(event.venue, 52) || 'No venue set'}
            </p>
          </div>
        ),
      },
      {
        id: 'client',
        header: 'Client',
        sortField: 'clientName',
        hideBelow: 'lg',
        cell: (event) => (
          <span className="text-muted-foreground">{event.clientName || '—'}</span>
        ),
      },
      {
        id: 'date',
        header: 'Date & time',
        sortField: 'date',
        cell: (event) => (
          <div className="whitespace-nowrap">
            <p className="text-foreground">{event.date ? formatDate(event.date) : '—'}</p>
            <p className="text-xs text-muted-foreground">
              {formatEventTimeRange(event) || event.eventDuration || 'No time set'}
              {event.date ? ` · ${isUpcoming(event.date) ? 'Upcoming' : 'Past'}` : ''}
            </p>
          </div>
        ),
      },
      {
        id: 'servings',
        header: 'Pax',
        sortField: 'servings',
        align: 'right',
        hideBelow: 'md',
        cell: (event) => (
          <span className="inline-flex items-center gap-1.5 tabular-nums text-muted-foreground">
            <Users className="size-3.5" />
            {formatNumber(event.servings)}
          </span>
        ),
      },
      {
        id: 'progress',
        header: 'Packing',
        hideBelow: 'xl',
        cell: (event) => {
          const progress = computePackingProgress(event);
          return progress.itemsTotal === 0 ? (
            <span className="text-xs text-muted-foreground">No items</span>
          ) : (
            <div className="flex w-36 items-center gap-2">
              <Progress
                value={progress.percentPacked}
                size="sm"
                label={`${event.eventName} packing progress`}
                indicatorClassName={progress.percentPacked >= 100 ? 'bg-success' : 'bg-primary'}
              />
              <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {progress.percentPacked}%
              </span>
            </div>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        sortField: 'status',
        cell: (event) => <EventStatusBadge status={event.status} />,
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        align: 'right',
        headerClassName: 'w-16',
        cell: (event) => (
          <RowActions label={`Actions for ${event.eventName}`}>
            <DropdownMenuItem onSelect={() => openDetails(event)}>
              <Eye />
              View event
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => editDialog.open(event)}>
              <Pencil />
              Edit event
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => deleteDialog.open(event)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </RowActions>
        ),
      },
    ],
    [deleteDialog, editDialog, openDetails],
  );

  const hasActiveQuery = table.debouncedSearch.length > 0 || table.activeFilterCount > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Every booking in the PartyAllo workspace, with live packing progress."
        breadcrumbs={[{ label: 'Events' }]}
        actions={
          <Button leftIcon={<Plus />} onClick={createDialog.open}>
            Create event
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <Tabs
            value={table.filters.window}
            onValueChange={(value) => table.setFilter('window', value as WindowFilter)}
          >
            <TabsList>
              {WINDOW_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={table.search}
              onChange={table.setSearch}
              placeholder="Search by event, client or venue…"
              className="sm:max-w-sm"
            />

            <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
              <FilterSelect
                ariaLabel="Filter by status"
                icon={CalendarDays}
                value={table.filters.status}
                onChange={(value) => table.setFilter('status', value)}
                options={STATUS_OPTIONS}
              />
              {hasActiveQuery ? (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<RotateCcw />}
                  onClick={table.resetFilters}
                >
                  Reset
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.items ?? []}
              getRowId={(event) => event.id}
              isLoading={isPending}
              sort={table.sort}
              onSortChange={table.toggleSort}
              onRowClick={openDetails}
              emptyState={
                hasActiveQuery ? (
                  <EmptyState
                    icon={CalendarDays}
                    title="No events match your filters"
                    description="Nothing is booked under this combination. Widen the search or clear the filters."
                    action={
                      <Button variant="outline" leftIcon={<RotateCcw />} onClick={table.resetFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={CalendarPlus}
                    title="No events on the books"
                    description="Create your first booking, then assign stations to it in the PartyAllo crew app."
                    action={
                      <Button leftIcon={<Plus />} onClick={createDialog.open}>
                        Create event
                      </Button>
                    }
                  />
                )
              }
            />

            {data && data.total > 0 ? (
              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={table.setPage}
                onPageSizeChange={table.setPageSize}
                itemLabel="events"
              />
            ) : null}
          </>
        )}
      </Card>

      <EventFormDialog
        open={createDialog.isOpen}
        onOpenChange={createDialog.setOpen}
        loading={createEvent.isPending}
        onSubmit={(values) => createEvent.mutateAsync(values)}
      />

      <EventFormDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.setOpen}
        event={editDialog.entity}
        loading={updateEvent.isPending}
        onSubmit={(values) => updateEvent.mutateAsync({ id: editDialog.entity!.id, values })}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete this event?"
        description={
          <>
            <strong className="text-foreground">{deleteDialog.entity?.eventName}</strong> and its
            packing progress will be permanently removed — including from the crew app. This cannot
            be undone.
          </>
        }
        confirmLabel="Delete event"
        loading={deleteEvent.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
