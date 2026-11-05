import { useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Boxes,
  Copy,
  LayoutGrid,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Rows3,
  Tag,
  Trash2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip } from '@/components/ui/tooltip';
import { PageHeader } from '@/components/common/page-header';
import { SearchInput } from '@/components/common/search-input';
import { FilterSelect } from '@/components/common/filter-select';
import { DataTable, type DataTableColumn } from '@/components/common/data-table';
import { Pagination } from '@/components/common/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { RowActions } from '@/components/common/row-actions';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { staggerContainer } from '@/components/common/motion';
import { useDataTable } from '@/hooks/use-data-table';
import { useDisclosure, useEntityDisclosure } from '@/hooks/use-disclosure';
import { useLocalStorage } from '@/hooks/use-local-storage';
import {
  useAllCatalogues,
  useCatalogues,
  useCreateCatalogue,
  useDeleteCatalogue,
  useDuplicateCatalogue,
  useUpdateCatalogue,
} from '@/features/catalogue/hooks/use-catalogues';
import { StationCard, StationCardSkeleton } from '@/features/catalogue/station-card';
import { CatalogueFormDialog } from '@/features/catalogue/catalogue-form-dialog';
import { STORAGE_KEYS } from '@/constants/app';
import { formatDate, formatNumber, stringToHue } from '@/utils/format';
import type {
  CatalogueFilters,
  CatalogueSortField,
  CatalogueViewMode,
  SelectOption,
  StationCatalogue,
} from '@/types';

const INITIAL_FILTERS: Required<CatalogueFilters> = { category: 'all' };

/** Turn a Firestore failure into something an operator can act on. */
function describeLoadError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'permission-denied') {
    return 'Your account is not allowed to read the catalogue. Sign out and back in, or ask an admin to check your access.';
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'The database could not be reached. Check your connection and try again.';
  }
  return error instanceof Error && error.message
    ? `The catalogue could not be loaded: ${error.message}`
    : 'The catalogue could not be loaded. Check your connection and try again.';
}

export default function CataloguePage() {
  const [view, setView] = useLocalStorage<CatalogueViewMode>(STORAGE_KEYS.catalogueView, 'grid');

  const table = useDataTable<Required<CatalogueFilters>, CatalogueSortField>({
    initialSort: { field: 'name', direction: 'asc' },
    initialFilters: INITIAL_FILTERS,
    // 12 divides evenly into the 2/3/4-column grid and reads fine as a table page.
    pageSize: 12,
  });

  const { data, isPending, isError, error, refetch, isRefetching } = useCatalogues(table.query);
  const { data: allStations } = useAllCatalogues();

  // Categories are free text in the PWA, so the filter options are derived from
  // what is actually in use rather than a fixed list.
  const categories = useMemo(
    () => [...new Set((allStations ?? []).map((station) => station.category))].sort(),
    [allStations],
  );

  const categoryOptions = useMemo<SelectOption<string>[]>(
    () => [
      { label: 'All categories', value: 'all' },
      ...categories.map((category) => ({ label: category, value: category })),
    ],
    [categories],
  );

  const createDialog = useDisclosure();
  const editDialog = useEntityDisclosure<StationCatalogue>();
  const deleteDialog = useEntityDisclosure<StationCatalogue>();

  const createStation = useCreateCatalogue();
  const updateStation = useUpdateCatalogue();
  const duplicateStation = useDuplicateCatalogue();
  const deleteStation = useDeleteCatalogue();

  const handleDuplicate = useCallback(
    (station: StationCatalogue) => duplicateStation.mutate(station.id),
    [duplicateStation],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.entity) return;
    await deleteStation.mutateAsync(deleteDialog.entity.id);
    deleteDialog.close();
  }, [deleteDialog, deleteStation]);

  const columns = useMemo<DataTableColumn<StationCatalogue, CatalogueSortField>[]>(
    () => [
      {
        id: 'name',
        header: 'Station',
        sortField: 'name',
        cell: (station) => {
          const hue = stringToHue(station.category || station.name);
          return (
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 52%), hsl(${(hue + 35) % 360} 68% 44%))`,
                }}
              >
                <Package className="size-4 text-white/90" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{station.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {station.description || 'No description'}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'category',
        header: 'Category',
        sortField: 'category',
        hideBelow: 'md',
        cell: (station) => <span className="text-muted-foreground">{station.category}</span>,
      },
      {
        id: 'items',
        header: 'Items',
        sortField: 'itemsCount',
        align: 'right',
        hideBelow: 'sm',
        cell: (station) => (
          <span className="tabular-nums text-foreground">
            {formatNumber(station.defaultPackingList.length)}
          </span>
        ),
      },
      {
        id: 'helpers',
        header: 'Helpers',
        sortField: 'helperCount',
        align: 'right',
        hideBelow: 'lg',
        cell: (station) => (
          <span className="tabular-nums text-muted-foreground">{station.helperCount}</span>
        ),
      },
      {
        id: 'power',
        header: 'Power',
        hideBelow: 'xl',
        cell: (station) => (
          <span className="text-muted-foreground">{station.powerRequired || '—'}</span>
        ),
      },
      {
        id: 'created',
        header: 'Created',
        sortField: 'createdAt',
        hideBelow: 'lg',
        cell: (station) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDate(station.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        align: 'right',
        headerClassName: 'w-16',
        cell: (station) => (
          <RowActions label={`Actions for ${station.name}`}>
            <DropdownMenuItem onSelect={() => editDialog.open(station)}>
              <Pencil />
              Edit station
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDuplicate(station)}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => deleteDialog.open(station)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </RowActions>
        ),
      },
    ],
    [deleteDialog, editDialog, handleDuplicate],
  );

  const hasActiveQuery = table.debouncedSearch.length > 0 || table.activeFilterCount > 0;

  const emptyState = hasActiveQuery ? (
    <EmptyState
      icon={Boxes}
      title="No stations match your filters"
      description="Nothing here under this combination. Try another category, or clear the filters."
      action={
        <Button variant="outline" leftIcon={<RotateCcw />} onClick={table.resetFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={PackagePlus}
      title="No stations yet"
      description="Stations are reusable packing templates. Build one once, then assign it to any event."
      action={
        <Button leftIcon={<Plus />} onClick={createDialog.open}>
          Create station
        </Button>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Station Catalogue"
        description="Reusable packing templates the crew assigns to events."
        breadcrumbs={[{ label: 'Station Catalogue' }]}
        meta={
          allStations ? (
            <span className="text-sm text-muted-foreground">
              {allStations.length} stations across {categories.length} categories
              {isRefetching ? ' · refreshing…' : ''}
            </span>
          ) : null
        }
        actions={
          <Button leftIcon={<Plus />} onClick={createDialog.open}>
            Create station
          </Button>
        }
      />

      <Card className="overflow-visible">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <SearchInput
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search stations…"
            className="sm:max-w-sm"
          />

          <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
            <FilterSelect
              ariaLabel="Filter by category"
              icon={Tag}
              value={table.filters.category}
              onChange={(value) => table.setFilter('category', value)}
              options={categoryOptions}
              className="sm:w-56"
            />

            {hasActiveQuery ? (
              <Button variant="ghost" size="sm" leftIcon={<RotateCcw />} onClick={table.resetFilters}>
                Reset
              </Button>
            ) : null}

            <div
              role="group"
              aria-label="View mode"
              className="ml-auto flex items-center gap-0.5 rounded-xl border border-border bg-muted/60 p-1 sm:ml-0"
            >
              <Tooltip content="Grid view">
                <Button
                  variant={view === 'grid' ? 'outline' : 'ghost'}
                  size="icon-sm"
                  aria-pressed={view === 'grid'}
                  aria-label="Grid view"
                  onClick={() => setView('grid')}
                  className={cn(view === 'grid' && 'bg-card shadow-soft')}
                >
                  <LayoutGrid />
                </Button>
              </Tooltip>
              <Tooltip content="Table view">
                <Button
                  variant={view === 'table' ? 'outline' : 'ghost'}
                  size="icon-sm"
                  aria-pressed={view === 'table'}
                  aria-label="Table view"
                  onClick={() => setView('table')}
                  className={cn(view === 'table' && 'bg-card shadow-soft')}
                >
                  <Rows3 />
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </Card>

      {isError ? (
        <Card>
          <ErrorState
            title="Could not load the station catalogue"
            description={describeLoadError(error)}
            onRetry={() => void refetch()}
          />
        </Card>
      ) : view === 'grid' ? (
        <>
          {isPending ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, index) => (
                <StationCardSkeleton key={index} />
              ))}
            </div>
          ) : (data?.items.length ?? 0) === 0 ? (
            <Card>{emptyState}</Card>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            >
              {data?.items.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  onEdit={editDialog.open}
                  onDuplicate={handleDuplicate}
                  onDelete={deleteDialog.open}
                />
              ))}
            </motion.div>
          )}

          {data && data.total > 0 ? (
            <Card>
              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={table.setPage}
                onPageSizeChange={table.setPageSize}
                itemLabel="stations"
                className="border-t-0"
              />
            </Card>
          ) : null}
        </>
      ) : (
        <Card className="overflow-hidden">
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            getRowId={(station) => station.id}
            isLoading={isPending}
            sort={table.sort}
            onSortChange={table.toggleSort}
            onRowClick={editDialog.open}
            emptyState={emptyState}
          />

          {data && data.total > 0 ? (
            <Pagination
              page={data.page}
              pageCount={data.pageCount}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={table.setPage}
              onPageSizeChange={table.setPageSize}
              itemLabel="stations"
            />
          ) : null}
        </Card>
      )}

      <CatalogueFormDialog
        open={createDialog.isOpen}
        onOpenChange={createDialog.setOpen}
        loading={createStation.isPending}
        categories={categories}
        onSubmit={(values) => createStation.mutateAsync(values)}
      />

      <CatalogueFormDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.setOpen}
        station={editDialog.entity}
        loading={updateStation.isPending}
        categories={categories}
        onSubmit={(values) => updateStation.mutateAsync({ id: editDialog.entity!.id, values })}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete this station?"
        description={
          <>
            <strong className="text-foreground">{deleteDialog.entity?.name}</strong> will be removed
            from the catalogue in the crew app too. Events that already used it keep their own copy
            of the packing list.
          </>
        }
        confirmLabel="Delete station"
        loading={deleteStation.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
