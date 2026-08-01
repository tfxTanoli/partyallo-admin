import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { NotFoundError, type UserService } from '../contracts';
import { COLLECTIONS, getDb } from './config';
import { mapUser } from './mappers';
import { nowIso, stripUndefined } from './converters';
import { matchesSearch, paginate, sortRows } from '@/utils/table';
import { DEFAULT_PAGE_SIZE } from '@/constants/app';
import type { User, UserRole } from '@/types';

function usersCollection() {
  return collection(getDb(), COLLECTIONS.users);
}

async function readUser(id: string): Promise<User> {
  const snapshot = await getDoc(doc(getDb(), COLLECTIONS.users, id));
  if (!snapshot.exists()) throw new NotFoundError('User', id);
  return mapUser(snapshot);
}

/**
 * `users/{uid}` is a small collection (one doc per Auth account), so it is read
 * whole and filtered/sorted in memory. That keeps free-text search working —
 * Firestore has no substring index — without a second search service.
 */
export const firebaseUserService: UserService = {
  async list(request) {
    const { search = '', filters, sort, page = 1, pageSize = DEFAULT_PAGE_SIZE } = request;

    const snapshot = await getDocs(usersCollection());
    const rows = snapshot.docs.map(mapUser).filter((user) => {
      if (filters?.role && filters.role !== 'all' && user.role !== filters.role) return false;
      if (filters?.status && filters.status !== 'all' && user.status !== filters.status) {
        return false;
      }
      return matchesSearch(user, search, ['displayName', 'email', 'role']);
    });

    const sorted = sort ? sortRows(rows, sort.field as keyof User, sort.direction) : rows;
    return paginate(sorted, page, pageSize);
  },

  getById: readUser,

  async update(id, values) {
    await updateDoc(
      doc(getDb(), COLLECTIONS.users, id),
      stripUndefined({ ...values, updatedAt: nowIso() }),
    );
    return readUser(id);
  },

  async setRole(id: string, role: UserRole) {
    await updateDoc(doc(getDb(), COLLECTIONS.users, id), { role, updatedAt: nowIso() });
    return readUser(id);
  },

  async remove(id) {
    // Removes the profile + role document only. The Firebase Auth account still
    // exists and must be deleted from the console or the Admin SDK — the client
    // SDK cannot delete another user's account.
    await deleteDoc(doc(getDb(), COLLECTIONS.users, id));
  },
};
