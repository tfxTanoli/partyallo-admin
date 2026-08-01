import type { CatalogueFilters, EventFilters, ListQuery, UserFilters } from '@/types';

/** Centralised TanStack Query key factory — keeps invalidation predictable. */
export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    overview: () => [...queryKeys.dashboard.all, 'overview'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (query: ListQuery<UserFilters>) => [...queryKeys.users.all, 'list', query] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
  },
  events: {
    all: ['events'] as const,
    list: (query: ListQuery<EventFilters>) => [...queryKeys.events.all, 'list', query] as const,
    detail: (id: string) => [...queryKeys.events.all, 'detail', id] as const,
    recent: () => [...queryKeys.events.all, 'recent'] as const,
  },
  catalogues: {
    all: ['catalogues'] as const,
    list: (query: ListQuery<CatalogueFilters>) =>
      [...queryKeys.catalogues.all, 'list', query] as const,
    detail: (id: string) => [...queryKeys.catalogues.all, 'detail', id] as const,
    every: () => [...queryKeys.catalogues.all, 'every'] as const,
  },
  settings: {
    all: ['settings'] as const,
    detail: () => [...queryKeys.settings.all, 'detail'] as const,
  },
  purchases: {
    all: ['purchases'] as const,
    outstanding: () => [...queryKeys.purchases.all, 'outstanding'] as const,
  },
} as const;
