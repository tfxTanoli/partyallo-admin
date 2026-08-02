import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services';
import { queryKeys } from '@/constants/query-keys';
import { isOverdue } from '@/services/firebase/purchases.service';
import type {
  ListQuery,
  PurchaseFilters,
  PurchaseFormValues,
  PurchaseSortField,
  PurchaseSummary,
} from '@/types';

export function usePurchases(query: ListQuery<PurchaseFilters, PurchaseSortField>) {
  return useQuery({
    queryKey: queryKeys.purchases.list(query),
    queryFn: () => api.purchases.list(query),
    placeholderData: (previous) => previous,
  });
}

/**
 * Whole registry — powers the summary tiles and the category/supplier filter
 * options, which must reflect every item rather than just the current page.
 */
export function useAllPurchases() {
  return useQuery({
    queryKey: queryKeys.purchases.every(),
    queryFn: () => api.purchases.listAll(),
    staleTime: 60_000,
  });
}

export function usePurchaseSummary(): PurchaseSummary {
  const { data } = useAllPurchases();
  const items = data ?? [];
  return {
    total: items.length,
    outstanding: items.filter((item) => !item.purchased).length,
    purchased: items.filter((item) => item.purchased).length,
    overdue: items.filter((item) => isOverdue(item)).length,
  };
}

/** Every mutation touches both the paged list and the summary, so invalidate the branch. */
function invalidatePurchases(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: PurchaseFormValues) => api.purchases.create(values),
    onSuccess: (item) => {
      invalidatePurchases(queryClient);
      toast.success('Item added', {
        description: `${item.name} is now on the crew app's shopping list.`,
      });
    },
    onError: () => toast.error('Could not add the item', { description: 'Please try again.' }),
  });
}

export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<PurchaseFormValues> }) =>
      api.purchases.update(id, values),
    onSuccess: (item) => {
      invalidatePurchases(queryClient);
      toast.success('Item updated', { description: `${item.name} has been saved.` });
    },
    onError: () => toast.error('Could not update the item', { description: 'Please try again.' }),
  });
}

/**
 * Row-level tick. Optimistic, because this is the highest-frequency action on
 * the screen and a full round-trip before the checkbox moves feels broken.
 */
export function useSetPurchased() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, purchased }: { id: string; purchased: boolean; name?: string }) =>
      api.purchases.setPurchased(id, purchased),
    onMutate: async ({ id, purchased }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.purchases.all });
      const snapshot = queryClient.getQueriesData({ queryKey: queryKeys.purchases.all });

      queryClient.setQueriesData({ queryKey: queryKeys.purchases.all }, (old: unknown) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((item) => (item.id === id ? { ...item, purchased } : item));
        }
        const paged = old as { items?: { id: string }[] };
        if (!paged.items) return old;
        return {
          ...paged,
          items: paged.items.map((item) => (item.id === id ? { ...item, purchased } : item)),
        };
      });

      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      // Put every touched cache entry back exactly as it was.
      context?.snapshot.forEach(([key, value]) => queryClient.setQueryData(key, value));
      toast.error('Could not update that item', { description: 'Please try again.' });
    },
    onSettled: () => invalidatePurchases(queryClient),
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.purchases.remove(id),
    onSuccess: () => {
      invalidatePurchases(queryClient);
      toast.success('Item removed', { description: 'It is gone from the crew app too.' });
    },
    onError: () => toast.error('Could not remove the item', { description: 'Please try again.' }),
  });
}
