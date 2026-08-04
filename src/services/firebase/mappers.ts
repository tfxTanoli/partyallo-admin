import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  EVENT_STATUSES,
  PACKING_ITEM_CATEGORIES,
  USER_ROLES,
  USER_STATUSES,
  type AppSettings,
  type PackingItem,
  type PackingLog,
  type PartyEvent,
  type PurchaseItem,
  type StationCatalogue,
  type StationStatus,
  type User,
} from '@/types';
import {
  asArray,
  asBoolean,
  asEnum,
  asNumber,
  asRecord,
  asString,
  toIso,
} from './converters';

/**
 * Defensive readers for live documents.
 *
 * The PWA has evolved over time, so older documents are missing fields that
 * newer ones have (e.g. `logs`, `paxMode`, `stationInstanceId`). Every mapper
 * therefore supplies a sane default rather than trusting the shape — a single
 * malformed legacy document must never blank out a whole screen.
 */

export function mapPackingItem(raw: unknown, index: number): PackingItem {
  const data = asRecord<unknown>(raw);
  return {
    id: asString(data.id, `item-${index}`),
    name: asString(data.name, 'Untitled item'),
    qty: asNumber(data.qty, 0),
    unit: asString(data.unit),
    category: asEnum(data.category, PACKING_ITEM_CATEGORIES, 'default'),
    notes: typeof data.notes === 'string' ? data.notes : undefined,
    stationName: typeof data.stationName === 'string' ? data.stationName : undefined,
    stationId: typeof data.stationId === 'string' ? data.stationId : undefined,
    stationInstanceId:
      typeof data.stationInstanceId === 'string' ? data.stationInstanceId : undefined,
    isPacked: asBoolean(data.isPacked),
    isLoaded: asBoolean(data.isLoaded),
    packedBy: typeof data.packedBy === 'string' ? data.packedBy : undefined,
    packedAt: typeof data.packedAt === 'string' ? data.packedAt : undefined,
    isFixed: asBoolean(data.isFixed),
    baseQty: asNumber(data.baseQty, asNumber(data.qty, 0)),
    isToPack: asBoolean(data.isToPack, true),
  };
}

function mapPackingLog(raw: unknown, index: number): PackingLog {
  const data = asRecord<unknown>(raw);
  return {
    id: asString(data.id, `log-${index}`),
    timestamp: toIso(data.timestamp),
    packerName: asString(data.packerName, 'Unknown'),
    action: asString(data.action),
  };
}

export function mapEvent(snapshot: QueryDocumentSnapshot<DocumentData>): PartyEvent {
  const data = snapshot.data();
  const createdAt = toIso(data.createdAt);

  return {
    id: snapshot.id,
    eventName: asString(data.eventName, 'Untitled event'),
    clientName: asString(data.clientName),
    venue: asString(data.venue),
    date: asString(data.date),
    startTime: typeof data.startTime === 'string' && data.startTime ? data.startTime : undefined,
    eventDuration: asString(data.eventDuration),
    status: asEnum(data.status, EVENT_STATUSES, 'Packing'),
    servings: asNumber(data.servings),
    paxMode: data.paxMode === 'auto' || data.paxMode === 'manual' ? data.paxMode : undefined,
    servingsPerHour:
      typeof data.servingsPerHour === 'number' ? data.servingsPerHour : undefined,
    assignedStationIds: asArray<string>(data.assignedStationIds).filter(
      (id): id is string => typeof id === 'string',
    ),
    packingList: asArray(data.packingList).map(mapPackingItem),
    stationServings: asRecord<number>(data.stationServings),
    stationStatuses: asRecord<StationStatus>(data.stationStatuses),
    categoryPackedIn: asRecord<string>(data.categoryPackedIn),
    logs: asArray(data.logs).map(mapPackingLog),
    notes: typeof data.notes === 'string' && data.notes ? data.notes : undefined,
    createdAt,
    updatedAt: toIso(data.updatedAt, createdAt),
  };
}

export function mapStation(snapshot: QueryDocumentSnapshot<DocumentData>): StationCatalogue {
  const data = snapshot.data();
  const createdAt = toIso(data.createdAt);

  return {
    id: snapshot.id,
    name: asString(data.name, 'Untitled station'),
    category: asString(data.category, 'Uncategorised'),
    description: typeof data.description === 'string' && data.description ? data.description : undefined,
    defaultPackingList: asArray(data.defaultPackingList).map(mapPackingItem),
    powerRequired:
      typeof data.powerRequired === 'string' && data.powerRequired ? data.powerRequired : undefined,
    helperCount: asNumber(data.helperCount),
    createdAt,
    updatedAt: toIso(data.updatedAt, createdAt),
  };
}

export function mapUser(snapshot: QueryDocumentSnapshot<DocumentData>): User {
  const data = snapshot.data();
  const createdAt = toIso(data.createdAt);

  return {
    id: snapshot.id,
    email: asString(data.email),
    displayName: asString(data.displayName) || asString(data.email),
    photoUrl: typeof data.photoUrl === 'string' && data.photoUrl ? data.photoUrl : undefined,
    role: asEnum(data.role, USER_ROLES, 'crew'),
    status: asEnum(data.status, USER_STATUSES, 'active'),
    providers: asArray<string>(data.providers).filter((p): p is string => typeof p === 'string'),
    createdAt,
    updatedAt: toIso(data.updatedAt, createdAt),
    lastSignInAt: data.lastSignInAt ? toIso(data.lastSignInAt) : undefined,
  };
}

export function mapPurchase(snapshot: QueryDocumentSnapshot<DocumentData>): PurchaseItem {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: asString(data.name, 'Untitled item'),
    qtyNeeded: asNumber(data.qtyNeeded),
    unit: asString(data.unit),
    notes: typeof data.notes === 'string' && data.notes ? data.notes : undefined,
    requiredDate: typeof data.requiredDate === 'string' ? data.requiredDate : undefined,
    category: asString(data.category, 'Uncategorised'),
    supplier: asString(data.supplier, 'Unknown'),
    purchased: asBoolean(data.purchased),
    createdAt: toIso(data.createdAt),
  };
}

export function mapSettings(data: DocumentData | undefined): AppSettings {
  const raw = asRecord<unknown>(data);
  return {
    companyName: asString(raw.companyName, 'PartyAllo'),
    appSubtitle: asString(raw.appSubtitle, 'Event Packing Tracker'),
    logoUri: typeof raw.logoUri === 'string' && raw.logoUri ? raw.logoUri : undefined,
    customStationCategories: asArray<string>(raw.customStationCategories),
    customPurchaseCategories: asArray<string>(raw.customPurchaseCategories),
    customSuppliers: asArray<string>(raw.customSuppliers),
    themeId: typeof raw.themeId === 'string' ? raw.themeId : undefined,
  };
}
