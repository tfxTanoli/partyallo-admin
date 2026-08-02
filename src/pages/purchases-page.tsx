import { useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Pencil,
  Plus,
  RotateCcw,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { fadeInUp, staggerContainer } from '@/components/common/motion';
import { useDataTable } from '@/hooks/use-data-table';
import { useDisclosure, useEntityDisclosure } from '@/hooks/use-disclosure';
import {
  useAllPurchases,
  useCreatePurchase,
  useDeletePurchase,
  usePurchaseSummary,
  usePurchases,
  useSetPurchased,
  useUpdatePurchase,
} from '@/features/purchases/hooks/use-purchases';
import { PurchaseFormDialog } from '@/features/purchases/purchase-form-dialog';
import { isOverdue } from '@/services/firebase/purchases.service';
import { formatDate, formatNumber } from '@/utils/format';
import type {
  PurchaseFilters,
  PurchaseItem,
  PurchaseSortField,
  SelectOption,
} from '@/types';

type StateFilter = NonNullable<PurchaseFilters['state']>;

const STATE_TABS: { value: StateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'purchased', label: 'Purchased' },
];

const INITIAL_FILTERS: Required<PurchaseFilters> = {
  state: 'outstanding',
  category: 'all',
  supplier: 'all',
};

interface SummaryTileProps {
  label: string;
  value: number;
  tone: 'primary' | 'warning' | 'danger' | 'success';
  icon: typeof ShoppingCart;
  active: boolean;
  onClick: () => void;
}

const toneStyles = {
  primary: 'bg-primary-soft text-primary',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  success: 'bg-success-soft text-success',
} as const;

function SummaryTile({ label, value, tone, icon: Icon, active, onClick }: SummaryTileProps) {
  return (
    <motion.button
      type="button"
      variants={fadeInUp}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-3.5 rounded-2xl border bg-card p-4 text-left shadow-card transition-colors',
        active ? 'border-primary/40 ring-2 ring-primary/12' : 'border-border hover:border-primary/25',
      )}
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', toneStyles[tone])}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-semibold leading-tight tabular-nums text-foreground">
          {formatNumber(value)}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{label}</span>
      </span>
    </motion.button>
  );
}

export default function PurchasesPage() {
  // Outstanding first — that is the working set an admin opens this screen for.
  const table = useDataTable<Required<PurchaseFilters>, PurchaseSortField>({
    initialSort: { field: 'requiredDate', direction: 'asc' },
    initialFilters: INITIAL_FILTERS,
  });

  const { data, isPending, isError, refetch } = usePurchases(table.query);
  const { data: allItems } = useAllPurchases();
  const summary = usePurchaseSummary();

  const createDialog = useDisclosure();
  const editDialog = useEntityDisclosure<PurchaseItem>();
  const deleteDialog = useEntityDisclosure<PurchaseItem>();

  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const setPurchased = useSetPurchased();
  const deletePurchase = useDeletePurchase();

  const { categories, suppliers, units } = useMemo(() => {
    const items = allItems ?? [];
    const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort();
    return {
      categories: unique(items.map((item) => item.category)),
      suppliers: unique(items.map((item) => item.supplier)),
      units: unique(items.map((item) => item.unit)),
    };
  }, [allItems]);

  const categoryOptions = useMemo<SelectOption<string>[]>(
    () => [
      { label: 'All categories', value: 'all' },
      ...categories.map((category) => ({ label: category, value: category })),
    ],
    [categories],
  );

  const supplierOptions = useMemo<SelectOption<string>[]>(
    () => [
      { label: 'All suppliers', value: 'all' },
      ...suppliers.map((supplier) => ({ label: supplier, value: supplier })),
    ],
    [suppliers],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteDialog.entity) return;
    await deletePurchase.mutateAsync(deleteDialog.entity.id);
    deleteDialog.close();
  }, [deleteDialog, deletePurchase]);

  const toggle = useCallback(
    (item: PurchaseItem) =>
      setPurchased.mutate({ id: item.id, purchased: !item.purchased, name: item.name }),
    [setPurchased],
  );

  const columns = useMemo<DataTableColumn<PurchaseItem, PurchaseSortField>[]>(
    () => [
      {
        id: 'done',
        header: <span className="sr-only">Purchased</span>,
        headerClassName: 'w-12',
        cell: (item) => (
          <div onClick={(event) => event.stopPropagation()} className="flex">
            {/* The tooltip trigger gets its own wrapper: `asChild` would merge
                Radix Tooltip's `data-state` onto the checkbox and clobber the
                checkbox's own checked/unchecked state, so it would never
                render as ticked. */}
            <Tooltip content={item.purchased ? 'Mark as outstanding' : 'Mark as purchased'}>
              <span className="inline-flex">
                <Checkbox
                  checked={item.purchased}
                  onCheckedChange={() => toggle(item)}
                  aria-label={`Mark ${item.name} as ${item.purchased ? 'outstanding' : 'purchased'}`}
                />
              </span>
            </Tooltip>
          </div>
        ),
      },
      {
        id: 'name',
        header: 'Item',
        sortField: 'name',
        cell: (item) => (
          <div className="min-w-0">
            <p
              className={cn(
                'truncate font-medium',
                item.purchased ? 'text-muted-foreground line-through' : 'text-foreground',
              )}
            >
              {item.name}
            </p>
            {item.notes ? (
              <p className="truncate text-xs text-muted-foreground">{item.notes}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'qty',
        header: 'Qty',
        sortField: 'qtyNeeded',
        align: 'right',
        cell: (item) => (
          <span className="whitespace-nowrap tabular-nums text-foreground">
            {formatNumber(item.qtyNeeded)} {item.unit}
          </span>
        ),
      },
      {
        id: 'category',
        header: 'Category',
        sortField: 'category',
        hideBelow: 'md',
        cell: (item) => (
          <Badge tone="neutral" size="sm">
            {item.category}
          </Badge>
        ),
      },
      {
        id: 'supplier',
        header: 'Supplier',
        sortField: 'supplier',
        hideBelow: 'lg',
        // Some live rows have an empty supplier; render a dash rather than a
        // lone icon with nothing beside it.
        cell: (item) => (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Truck className="size-3.5 shrink-0" />
            <span className={cn('truncate', !item.supplier && 'opacity-60')}>
              {item.supplier || 'Not set'}
            </span>
          </span>
        ),
      },
      {
        id: 'required',
        header: 'Required by',
        sortField: 'requiredDate',
        hideBelow: 'sm',
        cell: (item) => {
          if (!item.requiredDate) return <span className="text-muted-foreground">—</span>;
          const overdue = isOverdue(item);
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap',
                overdue ? 'font-medium text-danger' : 'text-muted-foreground',
              )}
            >
              {overdue ? <AlertTriangle className="size-3.5" /> : null}
              {formatDate(item.requiredDate)}
            </span>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        hideBelow: 'xl',
        cell: (item) =>
          item.purchased ? (
            <Badge tone="success" dot>
              Purchased
            </Badge>
          ) : isOverdue(item) ? (
            <Badge tone="danger" dot>
              Overdue
            </Badge>
          ) : (
            <Badge tone="warning" dot>
              Outstanding
            </Badge>
          ),
      },
      {
        id: 'actions',
        header: <span className="sr-only">Actions</span>,
        align: 'right',
        headerClassName: 'w-16',
        cell: (item) => (
          <RowActions label={`Actions for ${item.name}`}>
            <DropdownMenuItem onSelect={() => editDialog.open(item)}>
              <Pencil />
              Edit item
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toggle(item)}>
              {item.purchased ? <Circle /> : <CheckCircle2 />}
              {item.purchased ? 'Mark outstanding' : 'Mark purchased'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => deleteDialog.open(item)}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </RowActions>
        ),
      },
    ],
    [deleteDialog, editDialog, toggle],
  );

  const hasActiveQuery = table.debouncedSearch.length > 0 || table.activeFilterCount > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="The shared shopping list — what still needs buying before the next events."
        breadcrumbs={[{ label: 'Purchases' }]}
        actions={
          <Button leftIcon={<Plus />} onClick={createDialog.open}>
            Add purchase
          </Button>
        }
      />

      <motion.section
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        aria-label="Purchase summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryTile
          label="All items"
          value={summary.total}
          tone="primary"
          icon={ShoppingCart}
          active={table.filters.state === 'all'}
          onClick={() => table.setFilter('state', 'all')}
        />
        <SummaryTile
          label="Still to buy"
          value={summary.outstanding}
          tone="warning"
          icon={Circle}
          active={table.filters.state === 'outstanding'}
          onClick={() => table.setFilter('state', 'outstanding')}
        />
        <SummaryTile
          label="Overdue"
          value={summary.overdue}
          tone="danger"
          icon={AlertTriangle}
          active={table.filters.state === 'overdue'}
          onClick={() => table.setFilter('state', 'overdue')}
        />
        <SummaryTile
          label="Purchased"
          value={summary.purchased}
          tone="success"
          icon={CheckCircle2}
          active={table.filters.state === 'purchased'}
          onClick={() => table.setFilter('state', 'purchased')}
        />
      </motion.section>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <Tabs
            value={table.filters.state}
            onValueChange={(value) => table.setFilter('state', value as StateFilter)}
          >
            <TabsList>
              {STATE_TABS.map((tab) => (
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
              placeholder="Search item, supplier or notes…"
              className="sm:max-w-sm"
            />

            <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
              <FilterSelect
                ariaLabel="Filter by category"
                icon={Tag}
                value={table.filters.category}
                onChange={(value) => table.setFilter('category', value)}
                options={categoryOptions}
              />
              <FilterSelect
                ariaLabel="Filter by supplier"
                icon={Truck}
                value={table.filters.supplier}
                onChange={(value) => table.setFilter('supplier', value)}
                options={supplierOptions}
                className="sm:w-52"
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
              getRowId={(item) => item.id}
              isLoading={isPending}
              sort={table.sort}
              onSortChange={table.toggleSort}
              onRowClick={editDialog.open}
              emptyState={
                hasActiveQuery ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="Nothing matches these filters"
                    description={
                      table.filters.state === 'outstanding'
                        ? 'Nothing outstanding here — the crew is all caught up.'
                        : 'Try a different search term, or clear the filters.'
                    }
                    action={
                      <Button variant="outline" leftIcon={<RotateCcw />} onClick={table.resetFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    icon={ShoppingCart}
                    title="The registry is empty"
                    description="Add what needs buying and it appears on the crew's shopping list straight away."
                    action={
                      <Button leftIcon={<Plus />} onClick={createDialog.open}>
                        Add purchase
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
                itemLabel="items"
              />
            ) : null}
          </>
        )}
      </Card>

      <PurchaseFormDialog
        open={createDialog.isOpen}
        onOpenChange={createDialog.setOpen}
        loading={createPurchase.isPending}
        categories={categories}
        suppliers={suppliers}
        units={units}
        onSubmit={(values) => createPurchase.mutateAsync(values)}
      />

      <PurchaseFormDialog
        open={editDialog.isOpen}
        onOpenChange={editDialog.setOpen}
        item={editDialog.entity}
        loading={updatePurchase.isPending}
        categories={categories}
        suppliers={suppliers}
        units={units}
        onSubmit={(values) => updatePurchase.mutateAsync({ id: editDialog.entity!.id, values })}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onOpenChange={deleteDialog.setOpen}
        title="Delete this item?"
        description={
          <>
            <strong className="text-foreground">{deleteDialog.entity?.name}</strong> will be removed
            from the purchase registry — including in the crew app. This cannot be undone.
          </>
        }
        confirmLabel="Delete item"
        loading={deletePurchase.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
