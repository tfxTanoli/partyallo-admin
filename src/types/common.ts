/** Shared primitives used across every feature module. */

/** ISO-8601 timestamp string. Firestore `Timestamp`s are converted to this at the service boundary. */
export type ISODateString = string;

export type SortDirection = 'asc' | 'desc';

export interface SortState<TField extends string = string> {
  field: TField;
  direction: SortDirection;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** Generic query envelope every list service accepts. */
export interface ListQuery<TFilters = Record<string, unknown>, TSortField extends string = string> {
  search?: string;
  sort?: SortState<TSortField>;
  page?: number;
  pageSize?: number;
  filters?: TFilters;
}

export interface SelectOption<TValue extends string = string> {
  label: string;
  value: TValue;
  description?: string;
}

export type Trend = 'up' | 'down' | 'flat';

export interface DeltaMetric {
  value: number;
  /** Records created in the current period (e.g. the last 30 days). */
  absoluteChange: number;
  /**
   * Percentage change versus the equivalent previous period, or `null` when
   * there is no prior baseline to divide by. A null here is meaningful: the UI
   * shows the absolute count instead of inventing a percentage.
   */
  changePercent: number | null;
  trend: Trend;
}

/** Every record persisted through the service layer carries these. */
export interface AuditFields {
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type WithId<T> = T & { id: string };

/** Payload shape for creating a record — audit fields are server-generated. */
export type CreateInput<T extends AuditFields & { id: string }> = Omit<
  T,
  'id' | 'createdAt' | 'updatedAt'
>;

/** Payload shape for updating a record. */
export type UpdateInput<T extends AuditFields & { id: string }> = Partial<CreateInput<T>>;
