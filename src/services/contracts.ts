import type {
  AppSettings,
  CatalogueFilters,
  CatalogueFormValues,
  CatalogueSortField,
  DashboardOverview,
  EventFilters,
  EventFormValues,
  EventSortField,
  ListQuery,
  Paginated,
  PartyEvent,
  PurchaseItem,
  StationCatalogue,
  User,
  UserFilters,
  UserFormValues,
  UserRole,
  UserSortField,
} from '@/types';

/** The typed surface every screen talks to. Implemented by `services/firebase`. */

export interface UserService {
  list(query: ListQuery<UserFilters, UserSortField>): Promise<Paginated<User>>;
  getById(id: string): Promise<User>;
  update(id: string, values: Partial<UserFormValues>): Promise<User>;
  /** Promote or demote. Rejected by `firestore.rules` unless the caller is an admin. */
  setRole(id: string, role: UserRole): Promise<User>;
  remove(id: string): Promise<void>;
}

export interface EventService {
  list(query: ListQuery<EventFilters, EventSortField>): Promise<Paginated<PartyEvent>>;
  getById(id: string): Promise<PartyEvent>;
  listRecent(limit?: number): Promise<PartyEvent[]>;
  create(values: EventFormValues): Promise<PartyEvent>;
  update(id: string, values: Partial<EventFormValues>): Promise<PartyEvent>;
  remove(id: string): Promise<void>;
}

export interface CatalogueService {
  list(
    query: ListQuery<CatalogueFilters, CatalogueSortField>,
  ): Promise<Paginated<StationCatalogue>>;
  getById(id: string): Promise<StationCatalogue>;
  listAll(): Promise<StationCatalogue[]>;
  create(values: CatalogueFormValues): Promise<StationCatalogue>;
  update(id: string, values: Partial<CatalogueFormValues>): Promise<StationCatalogue>;
  /** Clones the station and its default packing list under a new id. */
  duplicate(id: string): Promise<StationCatalogue>;
  remove(id: string): Promise<void>;
}

export interface DashboardService {
  getOverview(): Promise<DashboardOverview>;
}

export interface SettingsService {
  get(): Promise<AppSettings>;
  update(settings: AppSettings): Promise<AppSettings>;
}

export interface PurchaseService {
  listOutstanding(): Promise<PurchaseItem[]>;
}

export interface DataSource {
  users: UserService;
  events: EventService;
  catalogues: CatalogueService;
  dashboard: DashboardService;
  settings: SettingsService;
  purchases: PurchaseService;
}

/** Thrown when a document id cannot be resolved. */
export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} "${id}" was not found.`);
    this.name = 'NotFoundError';
  }
}
