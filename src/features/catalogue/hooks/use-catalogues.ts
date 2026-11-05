import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services';
import { queryKeys } from '@/constants/query-keys';
import { queryStations } from '@/utils/catalogue';
import type {
  CatalogueFilters,
  CatalogueFormValues,
  CatalogueSortField,
  ListQuery,
  StationCatalogue,
} from '@/types';

/**
 * One page of the catalogue, derived in memory from the full station list.
 *
 * This deliberately shares the `every()` query instead of calling
 * `api.catalogues.list` per page: every station document embeds its whole
 * default packing list, so each read of the collection is ~570 KB. Querying per
 * page meant two full reads on open (this plus `useAllCatalogues`) and another
 * on every page, sort, filter and search keystroke — the screen sat on
 * skeletons for many seconds on an ordinary connection.
 */
export function useCatalogues(query: ListQuery<CatalogueFilters, CatalogueSortField>) {
  const select = useCallback(
    (stations: StationCatalogue[]) => queryStations(stations, query),
    [query],
  );

  return useQuery({
    queryKey: queryKeys.catalogues.every(),
    queryFn: () => api.catalogues.listAll(),
    // Short enough that edits made in the crew app show up on the next visit;
    // a background refetch keeps the current cards on screen meanwhile.
    staleTime: 60_000,
    select,
  });
}

/** Full station list — used to resolve category options and event station names. */
export function useAllCatalogues() {
  return useQuery({
    queryKey: queryKeys.catalogues.every(),
    queryFn: () => api.catalogues.listAll(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCatalogue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CatalogueFormValues) => api.catalogues.create(values),
    onSuccess: (station) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalogues.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Station created', {
        description: `${station.name} is available in the crew app — add its packing list there.`,
      });
    },
    onError: () => toast.error('Could not create the station', { description: 'Please try again.' }),
  });
}

export function useUpdateCatalogue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CatalogueFormValues> }) =>
      api.catalogues.update(id, values),
    onSuccess: (station) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalogues.all });
      toast.success('Station updated', { description: `${station.name} has been saved.` });
    },
    onError: () => toast.error('Could not update the station', { description: 'Please try again.' }),
  });
}

export function useDuplicateCatalogue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.catalogues.duplicate(id),
    onSuccess: (station) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalogues.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Station duplicated', {
        description: `${station.name} was created with a copy of the packing list.`,
      });
    },
    onError: () =>
      toast.error('Could not duplicate the station', { description: 'Please try again.' }),
  });
}

export function useDeleteCatalogue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.catalogues.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalogues.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Station deleted', {
        description: 'Events that already cloned it keep their own copy of the list.',
      });
    },
    onError: () => toast.error('Could not delete the station', { description: 'Please try again.' }),
  });
}
