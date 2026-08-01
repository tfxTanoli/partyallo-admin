import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { useDebounce } from './use-debounce';
import type { ListQuery, SortState } from '@/types';

export interface UseDataTableOptions<TFilters, TSortField extends string> {
  initialSort: SortState<TSortField>;
  initialFilters: TFilters;
  pageSize?: number;
}

export interface DataTableState<TFilters, TSortField extends string> {
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
  sort: SortState<TSortField>;
  toggleSort: (field: TSortField) => void;
  filters: TFilters;
  setFilter: <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  query: ListQuery<TFilters, TSortField>;
}

/**
 * Owns search / sort / filter / pagination state for a list screen and produces
 * the memoised `ListQuery` used as both the service argument and the query key.
 */
export function useDataTable<TFilters extends Record<string, unknown>, TSortField extends string>({
  initialSort,
  initialFilters,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
}: UseDataTableOptions<TFilters, TSortField>): DataTableState<TFilters, TSortField> {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState<TSortField>>(initialSort);
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const debouncedSearch = useDebounce(search, 300);

  // Any narrowing of the result set should send the user back to page one.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, pageSize]);

  const toggleSort = useCallback((field: TSortField) => {
    setSort((current) =>
      current.field === field
        ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    );
  }, []);

  const setFilter = useCallback(
    <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
      setFilters((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearch('');
  }, [initialFilters]);

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => value !== initialFilters[key as keyof TFilters])
        .length,
    [filters, initialFilters],
  );

  const setPageSize = useCallback((size: number) => setPageSizeState(size), []);

  const query = useMemo<ListQuery<TFilters, TSortField>>(
    () => ({ search: debouncedSearch, sort, filters, page, pageSize }),
    [debouncedSearch, sort, filters, page, pageSize],
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
    filters,
    setFilter,
    resetFilters,
    activeFilterCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    query,
  };
}
