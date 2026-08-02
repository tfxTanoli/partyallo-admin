import type { ISODateString } from './common';

/**
 * `users/{uid}` — the profile + role document. The document id is always the
 * Firebase Auth uid, which is what the security rules key off.
 *
 * `role` is the single source of truth for dashboard access. It is deliberately
 * NOT a custom auth claim: claims can only be written from a privileged server,
 * whereas this doc can be written by an existing admin straight from the UI
 * (guarded by `firestore.rules`), so promoting a colleague needs no deploy.
 */

export const USER_ROLES = ['admin', 'crew'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface User {
  /** Firebase Auth uid; also the Firestore document id. */
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role: UserRole;
  status: UserStatus;
  /** Auth provider ids, e.g. `['google.com']` or `['password']`. */
  providers: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  lastSignInAt?: ISODateString;
}

export type UserSortField = 'displayName' | 'email' | 'role' | 'status' | 'createdAt';

/** Declared as a type alias (not an interface) so it satisfies `Record<string, unknown>`. */
export type UserFilters = {
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
};

export interface UserFormValues {
  displayName: string;
  role: UserRole;
  status: UserStatus;
}

/**
 * Inviting creates the Firebase Auth account as well as the profile document,
 * so it takes an email. The admin never sets a password — the invitee does,
 * via the reset link they are emailed.
 */
export interface InviteUserFormValues {
  displayName: string;
  email: string;
  role: UserRole;
}
