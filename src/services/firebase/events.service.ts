import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  updateDoc,
} from 'firebase/firestore';
import { NotFoundError, type EventService } from '../contracts';
import { COLLECTIONS, getDb } from './config';
import { mapEvent, mapStation } from './mappers';
import { asArray, asNumber, asRecord, nowIso, stripUndefined } from './converters';
import { matchesSearch, paginate, sortRows } from '@/utils/table';
import { sortByEventSchedule } from '@/utils/schedule';
import {
  buildLog,
  duplicatePackingList,
  expandStationPackingItems,
  newStationInstanceId,
  stationInstanceKey,
} from '@/utils/packing-items';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { todayKey } from '@/utils/format';
import type { PackingItem, PackingLog, PartyEvent } from '@/types';

function eventsCollection() {
  return collection(getDb(), COLLECTIONS.events);
}

async function readEvent(id: string): Promise<PartyEvent> {
  const snapshot = await getDoc(doc(getDb(), COLLECTIONS.events, id));
  if (!snapshot.exists()) throw new NotFoundError('Event', id);
  return mapEvent(snapshot);
}

/**
 * Events are read whole (tens of documents, not thousands) and filtered in
 * memory. This is deliberate: `date` is stored as a `yyyy-MM-dd` **string** by
 * the PWA, and free-text search has no Firestore index, so a server-side query
 * could not express the upcoming/past window and the search term together.
 * If this collection grows past a few thousand documents, move to a paged
 * `orderBy('date')` cursor query and hand search to Algolia/Typesense.
 */
export const firebaseEventService: EventService = {
  async list(request) {
    const { search = '', filters, sort, page = 1, pageSize = DEFAULT_PAGE_SIZE } = request;
    const today = todayKey();

    const snapshot = await getDocs(eventsCollection());
    const rows = snapshot.docs.map(mapEvent).filter((event) => {
      if (filters?.status && filters.status !== 'all' && event.status !== filters.status) {
        return false;
      }
      if (filters?.window === 'upcoming' && (event.date < today || event.status === 'Complete')) {
        return false;
      }
      if (filters?.window === 'past' && event.date >= today) return false;
      return matchesSearch(event, search, ['eventName', 'clientName', 'venue']);
    });

    // Sorting by date means "running order": same-day events are ordered by
    // their start time, which is the sequence the crew packs and loads in.
    const sorted =
      !sort || sort.field === 'date'
        ? sortByEventSchedule(rows, sort?.direction ?? 'desc')
        : sortRows(rows, sort.field as keyof PartyEvent, sort.direction);

    return paginate(sorted, page, pageSize);
  },

  getById: readEvent,

  async listRecent(limit = 6) {
    const snapshot = await getDocs(eventsCollection());
    return snapshot.docs
      .map(mapEvent)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, limit);
  },

  async create(values) {
    const timestamp = nowIso();
    const reference = await addDoc(eventsCollection(), {
      eventName: values.eventName,
      clientName: values.clientName,
      venue: values.venue,
      date: values.date,
      startTime: values.startTime,
      eventDuration: values.eventDuration,
      status: values.status,
      servings: values.servings,
      paxMode: 'manual',
      // Every field the PWA expects, seeded empty so it never reads `undefined`.
      assignedStationIds: [],
      packingList: [],
      stationServings: {},
      stationStatuses: {},
      categoryPackedIn: {},
      logs: [],
      notes: values.notes ?? '',
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // The PWA reads a duplicated `id` field on the document body, so mirror it.
    await updateDoc(reference, { id: reference.id });
    return readEvent(reference.id);
  },

  async update(id, values) {
    await updateDoc(
      doc(getDb(), COLLECTIONS.events, id),
      stripUndefined({ ...values, updatedAt: nowIso() }),
    );
    return readEvent(id);
  },

  async duplicate(sourceId, values) {
    const source = await getDoc(doc(getDb(), COLLECTIONS.events, sourceId));
    if (!source.exists()) throw new NotFoundError('Event', sourceId);

    // Work from the raw document, not the mapped model, so items keep exactly
    // the fields the crew apps wrote (the mappers fill in defaults).
    const raw = source.data();
    const timestamp = nowIso();
    const sourceServings = asNumber(raw.servings);

    const copy = {
      // Booking details, as edited in the duplicate dialog.
      eventName: values.eventName,
      clientName: values.clientName,
      venue: values.venue,
      date: values.date,
      startTime: values.startTime,
      eventDuration: values.eventDuration,
      status: values.status,
      servings: values.servings,
      notes: values.notes ?? '',
      // Reusable setup, carried over.
      paxMode: values.servings === sourceServings ? raw.paxMode : 'manual',
      servingsPerHour: raw.servingsPerHour,
      // The mobile app's own schedule fields; absent on PWA-created events.
      setupTime: typeof raw.setupTime === 'string' ? raw.setupTime : undefined,
      endTime: typeof raw.endTime === 'string' ? raw.endTime : undefined,
      assignedStationIds: asArray<string>(raw.assignedStationIds),
      packingList: duplicatePackingList(asArray<PackingItem>(raw.packingList)),
      stationServings: asRecord<number>(raw.stationServings),
      // Event history and progress — never copied.
      stationStatuses: {},
      categoryPackedIn: {},
      logs: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const reference = await addDoc(eventsCollection(), stripUndefined(copy));
    await updateDoc(reference, { id: reference.id });
    return readEvent(reference.id);
  },

  async addStations(eventId, stationIds, actor) {
    if (stationIds.length === 0) return readEvent(eventId);
    const db = getDb();
    const eventRef = doc(db, COLLECTIONS.events, eventId);

    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists()) throw new NotFoundError('Event', eventId);

      const stationSnaps = await Promise.all(
        [...new Set(stationIds)].map((id) => transaction.get(doc(db, COLLECTIONS.stations, id))),
      );
      const stations = new Map(
        stationSnaps.flatMap((snap) => {
          if (!snap.exists()) return [];
          // Clone the template as stored, not as mapped, for the same reason as above.
          const rawItems = asArray<PackingItem>(snap.data().defaultPackingList);
          return [[snap.id, { ...mapStation(snap), defaultPackingList: rawItems }] as const];
        }),
      );

      const raw = eventSnap.data();
      const newItems: PackingItem[] = [];
      const logs: PackingLog[] = [];

      for (const stationId of stationIds) {
        const station = stations.get(stationId);
        if (!station) throw new NotFoundError('Station', stationId);
        const items = expandStationPackingItems(station, newStationInstanceId(stationId));
        newItems.push(...items);
        logs.push(buildLog(actor, `Added station: ${station.name} (${items.length} items)`));
      }

      transaction.update(
        eventRef,
        stripUndefined({
          packingList: [...asArray<PackingItem>(raw.packingList), ...newItems],
          assignedStationIds: [...asArray<string>(raw.assignedStationIds), ...stationIds],
          logs: [...asArray<PackingLog>(raw.logs), ...logs],
          updatedAt: nowIso(),
        }),
      );
    });

    return readEvent(eventId);
  },

  async removeStation(eventId, instanceKey, actor) {
    const db = getDb();
    const eventRef = doc(db, COLLECTIONS.events, eventId);

    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists()) throw new NotFoundError('Event', eventId);

      const raw = eventSnap.data();
      const packingList = asArray<PackingItem>(raw.packingList);
      const removed = packingList.filter((item) => stationInstanceKey(item) === instanceKey);
      if (removed.length === 0) throw new NotFoundError('Station', instanceKey);

      const kept = packingList.filter((item) => stationInstanceKey(item) !== instanceKey);
      const stationId = removed.find((item) => item.stationId)?.stationId;

      // `assignedStationIds` holds one entry per slot, so drop exactly one.
      let assignedStationIds = asArray<string>(raw.assignedStationIds);
      const slotIndex = stationId ? assignedStationIds.indexOf(stationId) : -1;
      if (slotIndex >= 0) {
        assignedStationIds = assignedStationIds.filter((_, index) => index !== slotIndex);
      }

      // Per-station pax/status are keyed by catalogue id and shared by every slot
      // of that station. Prune them only once the last slot is gone, so a station
      // that is re-added later does not inherit a stale value (as the PWA does).
      const stationServings = { ...asRecord<number>(raw.stationServings) };
      const stationStatuses = { ...asRecord<string>(raw.stationStatuses) };
      if (stationId && !kept.some((item) => item.stationId === stationId)) {
        delete stationServings[stationId];
        delete stationStatuses[stationId];
      }

      const name = removed[0]?.stationName ?? 'station';
      transaction.update(
        eventRef,
        stripUndefined({
          packingList: kept,
          assignedStationIds,
          stationServings,
          stationStatuses,
          logs: [
            ...asArray<PackingLog>(raw.logs),
            buildLog(actor, `Removed station: ${name} (${removed.length} items)`),
          ],
          updatedAt: nowIso(),
        }),
      );
    });

    return readEvent(eventId);
  },

  async remove(id) {
    await deleteDoc(doc(getDb(), COLLECTIONS.events, id));
  },
};
