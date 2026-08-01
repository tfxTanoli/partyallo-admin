import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services';
import { queryKeys } from '@/constants/query-keys';
import type { EventFilters, EventFormValues, EventSortField, ListQuery } from '@/types';

export function useEvents(query: ListQuery<EventFilters, EventSortField>) {
  return useQuery({
    queryKey: queryKeys.events.list(query),
    queryFn: () => api.events.list(query),
    placeholderData: (previous) => previous,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.events.detail(id ?? ''),
    queryFn: () => api.events.getById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: EventFormValues) => api.events.create(values),
    onSuccess: (event) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Event created', {
        description: `${event.eventName} is live for the crew app — assign stations there.`,
      });
    },
    onError: () => toast.error('Could not create the event', { description: 'Please try again.' }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<EventFormValues> }) =>
      api.events.update(id, values),
    onSuccess: (event) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.setQueryData(queryKeys.events.detail(event.id), event);
      toast.success('Event updated', { description: `${event.eventName} has been saved.` });
    },
    onError: () => toast.error('Could not update the event', { description: 'Please try again.' }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.events.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Event deleted', {
        description: 'It has been removed from the crew app as well.',
      });
    },
    onError: () => toast.error('Could not delete the event', { description: 'Please try again.' }),
  });
}
