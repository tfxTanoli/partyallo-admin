import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services';
import { queryKeys } from '@/constants/query-keys';
import type {
  CatalogueFilters,
  CatalogueFormValues,
  CatalogueSortField,
  ListQuery,
} from '@/types';

export function useCatalogues(query: ListQuery<CatalogueFilters, CatalogueSortField>) {
  return useQuery({
    queryKey: queryKeys.catalogues.list(query),
    queryFn: () => api.catalogues.list(query),
    placeholderData: (previous) => previous,
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
