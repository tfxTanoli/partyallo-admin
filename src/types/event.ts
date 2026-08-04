import type { ISODateString } from './common';

/**
 * Domain model mirrors the live `events` collection exactly as the PartyAllo PWA
 * writes it. Do not "improve" these shapes — the PWA reads the same documents.
 */

export const EVENT_STATUSES = ['Packing', 'Loading', 'Loaded', 'Complete'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const STATION_STATUSES = ['Packing', 'Loading', 'Loaded', 'Complete'] as const;
export type StationStatus = (typeof STATION_STATUSES)[number];

export const PACKING_ITEM_CATEGORIES = [
  'default',
  'Live station',
  'Fresh food',
  'Others',
] as const;
export type PackingItemCategory = (typeof PACKING_ITEM_CATEGORIES)[number];

export interface PackingItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  category: PackingItemCategory;
  notes?: string;
  stationName?: string;
  /** Catalogue station this item was generated from. */
  stationId?: string;
  /** Distinguishes two assignments of the same station within one event. */
  stationInstanceId?: string;
  isPacked: boolean;
  isLoaded: boolean;
  packedBy?: string;
  packedAt?: string;
  isFixed: boolean;
  baseQty: number;
  isToPack: boolean;
}

export interface PackingLog {
  id: string;
  timestamp: string;
  packerName: string;
  action: string;
}

export interface PartyEvent {
  id: string;
  eventName: string;
  clientName: string;
  venue: string;
  /** `yyyy-MM-dd`, exactly as the PWA date input stores it. */
  date: string;
  /**
   * 24h `HH:mm` start time, as the PWA time input stores it. Optional: events
   * booked before this field existed carry no time and are ordered after the
   * timed ones on their day.
   */
  startTime?: string;
  eventDuration: string;
  status: EventStatus;
  servings: number;
  paxMode?: 'auto' | 'manual';
  servingsPerHour?: number;
  assignedStationIds: string[];
  packingList: PackingItem[];
  stationServings: Record<string, number>;
  stationStatuses: Record<string, StationStatus>;
  categoryPackedIn: Record<string, string>;
  logs: PackingLog[];
  notes?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type EventSortField = 'eventName' | 'clientName' | 'date' | 'status' | 'servings';

/** Declared as a type alias (not an interface) so it satisfies `Record<string, unknown>`. */
export type EventFilters = {
  status?: EventStatus | 'all';
  /** `upcoming` = today or later and not Complete; `past` = before today. */
  window?: 'all' | 'upcoming' | 'past';
};

export interface EventFormValues {
  eventName: string;
  clientName: string;
  venue: string;
  date: string;
  startTime: string;
  eventDuration: string;
  status: EventStatus;
  servings: number;
  notes?: string;
}

/** Derived packing metrics — computed from `packingList`, never persisted. */
export interface PackingProgress {
  itemsTotal: number;
  itemsPacked: number;
  itemsLoaded: number;
  percentPacked: number;
  percentLoaded: number;
  stationsTotal: number;
  stationsComplete: number;
}

/** A station as it appears inside one event, rolled up from `packingList`. */
export interface EventStationSummary {
  instanceId: string;
  stationId?: string;
  name: string;
  itemsTotal: number;
  itemsPacked: number;
  status: StationStatus;
  servings?: number;
}
