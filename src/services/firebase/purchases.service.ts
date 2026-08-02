import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { NotFoundError, type PurchaseService } from '../contracts';
import { COLLECTIONS, getDb } from './config';
import { mapPurchase } from './mappers';
import { nowIso, stripUndefined } from './converters';
import { matchesSearch, paginate, sortRows } from '@/utils/table';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import { todayKey } from '@/utils/format';
import type { PurchaseItem } from '@/types';

function purchasesCollection() {
  return collection(getDb(), COLLECTIONS.purchases);
}

async function readPurchase(id: string): Promise<PurchaseItem> {
  const snapshot = await getDoc(doc(getDb(), COLLECTIONS.purchases, id));
  if (!snapshot.exists()) throw new NotFoundError('Purchase', id);
  return mapPurchase(snapshot);
}

/** Outstanding and past its required date — the set that needs chasing. */
export function isOverdue(item: PurchaseItem, today = todayKey()): boolean {
  return !item.purchased && Boolean(item.requiredDate) && item.requiredDate! < today;
}

export const firebasePurchaseService: PurchaseService = {
  async list(request) {
    const { search = '', filters, sort, page = 1, pageSize = DEFAULT_PAGE_SIZE } = request;
    const today = todayKey();

    const snapshot = await getDocs(purchasesCollection());
    const rows = snapshot.docs.map(mapPurchase).filter((item) => {
      if (filters?.state === 'outstanding' && item.purchased) return false;
      if (filters?.state === 'purchased' && !item.purchased) return false;
      if (filters?.state === 'overdue' && !isOverdue(item, today)) return false;
      if (filters?.category && filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      if (filters?.supplier && filters.supplier !== 'all' && item.supplier !== filters.supplier) {
        return false;
      }
      return matchesSearch(item, search, ['name', 'category', 'supplier', 'notes']);
    });

    const sorted = sort
      ? sortRows(rows, sort.field as keyof PurchaseItem, sort.direction)
      : sortRows(rows, 'createdAt', 'desc');

    return paginate(sorted, page, pageSize);
  },

  async listAll() {
    const snapshot = await getDocs(purchasesCollection());
    return snapshot.docs.map(mapPurchase);
  },

  async listOutstanding() {
    const snapshot = await getDocs(purchasesCollection());
    return snapshot.docs.map(mapPurchase).filter((item) => !item.purchased);
  },

  getById: readPurchase,

  async create(values) {
    const reference = await addDoc(
      purchasesCollection(),
      stripUndefined({
        name: values.name,
        qtyNeeded: values.qtyNeeded,
        unit: values.unit,
        category: values.category,
        supplier: values.supplier,
        requiredDate: values.requiredDate ?? '',
        notes: values.notes ?? '',
        purchased: values.purchased,
        createdAt: nowIso(),
      }),
    );

    // The crew app reads a duplicated `id` field on the document body.
    await updateDoc(reference, { id: reference.id });
    return readPurchase(reference.id);
  },

  async update(id, values) {
    await updateDoc(doc(getDb(), COLLECTIONS.purchases, id), stripUndefined({ ...values }));
    return readPurchase(id);
  },

  async setPurchased(id, purchased) {
    await updateDoc(doc(getDb(), COLLECTIONS.purchases, id), { purchased });
    return readPurchase(id);
  },

  async remove(id) {
    await deleteDoc(doc(getDb(), COLLECTIONS.purchases, id));
  },
};
