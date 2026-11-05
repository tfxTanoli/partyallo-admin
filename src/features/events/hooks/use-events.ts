import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/services';
import { queryKeys } from '@/constants/query-keys';
import { useAuth } from '@/providers/auth-provider';
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
      queryClient.setQueryData(queryKeys.events.detail(event.id), event);
      toast.success('Event created', {
        description: `${event.eventName} is saved. Now add its live stations.`,
      });
    },
    onError: () => toast.error('Could not create the event', { description: 'Please try again.' }),
  });
}

export function useDuplicateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, values }: { sourceId: string; values: EventFormValues }) =>
      api.events.duplicate(sourceId, values),
    onSuccess: (event) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.setQueryData(queryKeys.events.detail(event.id), event);
      toast.success('Event duplicated', {
        description: `${event.eventName} was created with the same stations — packing progress starts fresh.`,
      });
    },
    onError: () =>
      toast.error('Could not duplicate the event', { description: 'Please try again.' }),
  });
}

/** Name recorded on the crew app's Warehouse Timeline for changes made here. */
function useActorName(): string {
  const { profile } = useAuth();
  return profile?.name ? `${profile.name} (admin)` : 'Admin console';
}

export function useAddEventStations() {
  const queryClient = useQueryClient();
  const actor = useActorName();

  return useMutation({
    mutationFn: ({ eventId, stationIds }: { eventId: string; stationIds: string[] }) =>
      api.events.addStations(eventId, stationIds, actor),
    onSuccess: (event, { stationIds }) => {
      queryClient.setQueryData(queryKeys.events.detail(event.id), event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(stationIds.length === 1 ? 'Station added' : `${stationIds.length} stations added`, {
        description: 'Their packing lists are ready in the crew app.',
      });
    },
    onError: () => toast.error('Could not add the stations', { description: 'Please try again.' }),
  });
}

export function useRemoveEventStation() {
  const queryClient = useQueryClient();
  const actor = useActorName();

  return useMutation({
    mutationFn: ({ eventId, instanceKey }: { eventId: string; instanceKey: string }) =>
      api.events.removeStation(eventId, instanceKey, actor),
    onSuccess: (event) => {
      queryClient.setQueryData(queryKeys.events.detail(event.id), event);
      void queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Station removed', { description: 'Its packing items were removed too.' });
    },
    onError: () => toast.error('Could not remove the station', { description: 'Please try again.' }),
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
