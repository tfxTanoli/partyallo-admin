import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { NotFoundError, type EventService } from '../contracts';
import { COLLECTIONS, getDb } from './config';
import { mapEvent } from './mappers';
import { nowIso, stripUndefined } from './converters';
import { matchesSearch, paginate, sortRows } from '@/utils/table';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { todayKey } from '@/utils/format';
import type { PartyEvent } from '@/types';

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

    const sorted = sort
      ? sortRows(rows, sort.field as keyof PartyEvent, sort.direction)
      : sortRows(rows, 'date', 'desc');

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

  async remove(id) {
    await deleteDoc(doc(getDb(), COLLECTIONS.events, id));
  },
};
