import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { NotFoundError, type CatalogueService } from '../contracts';
import { COLLECTIONS, getDb } from './config';
import { mapStation } from './mappers';
import { nowIso, stripUndefined } from './converters';
import { queryStations } from '@/utils/catalogue';
import type { StationCatalogue } from '@/types';

function stationsCollection() {
  return collection(getDb(), COLLECTIONS.stations);
}

async function readStation(id: string): Promise<StationCatalogue> {
  const snapshot = await getDoc(doc(getDb(), COLLECTIONS.stations, id));
  if (!snapshot.exists()) throw new NotFoundError('Station', id);
  return mapStation(snapshot);
}

/** `stations` — the shared catalogue the PWA clones onto events. */
export const firebaseCatalogueService: CatalogueService = {
  async list(request) {
    const snapshot = await getDocs(stationsCollection());
    return queryStations(snapshot.docs.map(mapStation), request);
  },

  getById: readStation,

  async listAll() {
    const snapshot = await getDocs(stationsCollection());
    return snapshot.docs.map(mapStation).sort((a, b) => a.name.localeCompare(b.name));
  },

  async create(values) {
    const timestamp = nowIso();
    const reference = await addDoc(
      stationsCollection(),
      stripUndefined({
        name: values.name,
        category: values.category,
        description: values.description ?? '',
        powerRequired: values.powerRequired ?? '',
        helperCount: values.helperCount,
        defaultPackingList: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );

    await updateDoc(reference, { id: reference.id });
    return readStation(reference.id);
  },

  async update(id, values) {
    await updateDoc(
      doc(getDb(), COLLECTIONS.stations, id),
      stripUndefined({ ...values, updatedAt: nowIso() }),
    );
    return readStation(id);
  },

  async duplicate(id) {
    const source = await readStation(id);
    const timestamp = nowIso();

    const reference = await addDoc(
      stationsCollection(),
      stripUndefined({
        name: `${source.name} (copy)`,
        category: source.category,
        description: source.description ?? '',
        powerRequired: source.powerRequired ?? '',
        helperCount: source.helperCount,
        // Fresh item ids so the copy's packing state is independent of the original.
        defaultPackingList: source.defaultPackingList.map((item, index) => ({
          ...item,
          id: `item-${Date.now().toString(36)}-${index}`,
        })),
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );

    await updateDoc(reference, { id: reference.id });
    return readStation(reference.id);
  },

  async remove(id) {
    await deleteDoc(doc(getDb(), COLLECTIONS.stations, id));
  },
};
