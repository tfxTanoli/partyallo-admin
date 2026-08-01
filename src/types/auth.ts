import type { User, UserRole } from './user';

/** The signed-in operator, resolved from Firebase Auth + their `users/{uid}` doc. */
export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export function toAdminProfile(user: User): AdminProfile {
  return {
    id: user.id,
    name: user.displayName || user.email,
    email: user.email,
    role: user.role,
    avatarUrl: user.photoUrl,
  };
}

/** Why a sign-in attempt was rejected — drives the message on the login screen. */
export type AuthDenialReason = 'not-admin' | 'disabled' | 'no-profile';

export class AuthDeniedError extends Error {
  readonly reason: AuthDenialReason;

  constructor(reason: AuthDenialReason, message: string) {
    super(message);
    this.name = 'AuthDeniedError';
    this.reason = reason;
  }
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  at: string;
  read: boolean;
  tone: 'info' | 'success' | 'warning' | 'danger';
}
