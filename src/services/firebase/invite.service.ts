import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  sendPasswordResetEmail,
  setPersistence,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { COLLECTIONS, firebaseConfig, getDb } from './config';
import { nowIso } from './converters';
import type { InviteUserFormValues, User } from '@/types';

/**
 * Creating an account from an admin console is awkward in Firebase: the client
 * SDK's `createUserWithEmailAndPassword` signs the *calling* session in as the
 * new user, which would kick the admin out of their own console.
 *
 * The fix is a throwaway **secondary** Firebase app. It has its own Auth
 * instance, so creating a user there leaves the primary session untouched, and
 * it is deleted immediately afterwards.
 *
 * `inMemoryPersistence` is the load-bearing detail: without it the secondary
 * Auth instance writes its session to localStorage, which can race with the
 * primary app's persisted session on the next page load.
 *
 * The admin never sees or sets a password. A cryptographically random one is
 * generated, used once to satisfy the API, and discarded unread — the invitee
 * sets their own via the reset email.
 */

const SECONDARY_APP_NAME = 'partyallo-admin-invite';

function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const bytes = new Uint32Array(28);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
}

export interface InviteResult {
  user: User;
  /** False when the account was made but the invite email could not be sent. */
  emailSent: boolean;
}

export async function inviteUser(values: InviteUserFormValues): Promise<InviteResult> {
  const email = values.email.trim().toLowerCase();
  const displayName = values.displayName.trim();

  // Named app → isolated Auth instance. Never reuse the default app here.
  const secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    await setPersistence(secondaryAuth, inMemoryPersistence);

    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      generateTemporaryPassword(),
    );

    await updateProfile(credential.user, { displayName }).catch(() => {
      // Cosmetic only — the Firestore profile below is what the console reads.
    });

    const timestamp = nowIso();
    const profile: Omit<User, 'id'> = {
      email,
      displayName,
      role: values.role,
      status: 'active',
      providers: ['password'],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Written from the ADMIN's session, not the secondary one, so the rules see
    // an admin caller and allow the role to be set.
    await setDoc(doc(getDb(), COLLECTIONS.users, credential.user.uid), profile);

    let emailSent = true;
    try {
      await sendPasswordResetEmail(secondaryAuth, email);
    } catch {
      // The account and profile exist; the admin can resend from the row menu.
      emailSent = false;
    }

    return { user: { id: credential.user.uid, ...profile }, emailSent };
  } finally {
    // Always tear down, even if creation threw, so a retry can re-initialise.
    await deleteApp(secondaryApp).catch(() => {});
  }
}

/** Re-send the set-a-password email to someone who never completed their invite. */
export async function resendInvite(email: string): Promise<void> {
  const secondaryApp = initializeApp(firebaseConfig, `${SECONDARY_APP_NAME}-resend`);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    await setPersistence(secondaryAuth, inMemoryPersistence);
    await sendPasswordResetEmail(secondaryAuth, email);
  } finally {
    await deleteApp(secondaryApp).catch(() => {});
  }
}

/** Turns Firebase's invite-time error codes into something an admin can act on. */
export function describeInviteError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Find them in the list below and change their role instead.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled for this Firebase project. Enable it under Authentication → Sign-in method.';
    case 'auth/too-many-requests':
      return 'Too many attempts from this device. Wait a few minutes and try again.';
    case 'permission-denied':
      return 'Your account is not allowed to create users.';
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Could not create the account. Please try again.';
  }
}
