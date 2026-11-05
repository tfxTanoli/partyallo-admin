import type {
  AppSettings,
  CatalogueFilters,
  CatalogueFormValues,
  CatalogueSortField,
  DashboardOverview,
  EventFilters,
  InviteUserFormValues,
  EventFormValues,
  EventSortField,
  ListQuery,
  Paginated,
  PartyEvent,
  PurchaseFilters,
  PurchaseFormValues,
  PurchaseItem,
  PurchaseSortField,
  StationCatalogue,
  User,
  UserFilters,
  UserFormValues,
  UserRole,
  UserSortField,
} from '@/types';
import type { InviteResult } from './firebase/invite.service';

/** The typed surface every screen talks to. Implemented by `services/firebase`. */

export interface UserService {
  list(query: ListQuery<UserFilters, UserSortField>): Promise<Paginated<User>>;
  getById(id: string): Promise<User>;
  update(id: string, values: Partial<UserFormValues>): Promise<User>;
  /** Promote or demote. Rejected by `firestore.rules` unless the caller is an admin. */
  setRole(id: string, role: UserRole): Promise<User>;
  /** Creates the Auth account *and* the profile, then emails a set-password link. */
  invite(values: InviteUserFormValues): Promise<InviteResult>;
  /** Re-send the set-password email to an invitee who never signed in. */
  resendInvite(email: string): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface EventService {
  list(query: ListQuery<EventFilters, EventSortField>): Promise<Paginated<PartyEvent>>;
  getById(id: string): Promise<PartyEvent>;
  listRecent(limit?: number): Promise<PartyEvent[]>;
  create(values: EventFormValues): Promise<PartyEvent>;
  update(id: string, values: Partial<EventFormValues>): Promise<PartyEvent>;
  /**
   * Creates a new event from `sourceId`'s setup (stations, packing list, pax),
   * with `values` applied on top. Packing progress, statuses and the activity
   * log are reset; the source event is not modified.
   */
  duplicate(sourceId: string, values: EventFormValues): Promise<PartyEvent>;
  /** Assigns catalogue stations to an event, cloning each one's default packing list. */
  addStations(eventId: string, stationIds: string[], actor: string): Promise<PartyEvent>;
  /** Removes one station slot (by its instance key) and its packing items. */
  removeStation(eventId: string, instanceKey: string, actor: string): Promise<PartyEvent>;
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
  list(query: ListQuery<PurchaseFilters, PurchaseSortField>): Promise<Paginated<PurchaseItem>>;
  /** Unpaginated — used to derive summary counts and filter options. */
  listAll(): Promise<PurchaseItem[]>;
  listOutstanding(): Promise<PurchaseItem[]>;
  getById(id: string): Promise<PurchaseItem>;
  create(values: PurchaseFormValues): Promise<PurchaseItem>;
  update(id: string, values: Partial<PurchaseFormValues>): Promise<PurchaseItem>;
  /** Dedicated toggle so a row checkbox does not round-trip the whole record. */
  setPurchased(id: string, purchased: boolean): Promise<PurchaseItem>;
  remove(id: string): Promise<void>;
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
