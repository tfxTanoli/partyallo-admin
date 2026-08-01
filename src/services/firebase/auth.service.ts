import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { COLLECTIONS, getDb, getFirebaseAuth } from './config';
import { mapUser } from './mappers';
import { nowIso } from './converters';
import { AuthDeniedError, toAdminProfile, type AdminProfile, type User } from '@/types';

/**
 * Access control for the admin console.
 *
 * Authentication is Firebase Auth (shared with the PWA), but **authorisation is
 * the `users/{uid}.role` document**. A crew member has perfectly valid
 * credentials for the PWA and must still be refused here.
 *
 * Role lives in Firestore rather than a custom auth claim so an existing admin
 * can promote a colleague straight from the Users screen. Custom claims can only
 * be written by a privileged server, which would mean deploying a Cloud Function
 * for every role change. `firestore.rules` enforces that only admins may write
 * the `role` field, so this is not weaker — just deployable without a backend.
 */

/**
 * Resolve the caller's profile, creating it on first sign-in.
 *
 * A first-time signer-in gets a `crew` document and is then refused, which is
 * the correct default: new accounts must be promoted deliberately.
 */
async function resolveProfile(firebaseUser: FirebaseUser): Promise<User> {
  const reference = doc(getDb(), COLLECTIONS.users, firebaseUser.uid);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    // Refresh the fields Auth owns so the Users screen never shows a stale name.
    const profile = mapUser(snapshot);
    const patch: Record<string, string> = { lastSignInAt: nowIso() };
    if (firebaseUser.email && firebaseUser.email !== profile.email) {
      patch.email = firebaseUser.email;
    }
    if (firebaseUser.photoURL && firebaseUser.photoURL !== profile.photoUrl) {
      patch.photoUrl = firebaseUser.photoURL;
    }
    await setDoc(reference, patch, { merge: true });
    return { ...profile, ...patch } as User;
  }

  const timestamp = nowIso();
  const created = {
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Unknown',
    photoUrl: firebaseUser.photoURL ?? '',
    role: 'crew' as const,
    status: 'active' as const,
    providers: firebaseUser.providerData.map((p) => p.providerId),
    createdAt: firebaseUser.metadata.creationTime
      ? new Date(firebaseUser.metadata.creationTime).toISOString()
      : timestamp,
    updatedAt: timestamp,
    lastSignInAt: timestamp,
  };

  await setDoc(reference, created);
  return { id: firebaseUser.uid, ...created };
}

/** Throws `AuthDeniedError` unless this profile may use the admin console. */
function assertMayAccessConsole(profile: User): void {
  if (profile.status === 'disabled') {
    throw new AuthDeniedError(
      'disabled',
      'This account has been disabled. Contact a workspace administrator.',
    );
  }
  if (profile.role !== 'admin') {
    throw new AuthDeniedError(
      'not-admin',
      'This account does not have admin access to the console.',
    );
  }
}

export interface AuthSession {
  profile: AdminProfile;
  user: User;
}

async function authorise(firebaseUser: FirebaseUser): Promise<AuthSession> {
  const user = await resolveProfile(firebaseUser);
  assertMayAccessConsole(user);
  return { profile: toAdminProfile(user), user };
}

export const firebaseAuthService = {
  /** Signs in, then signs straight back out if the account is not an admin. */
  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    try {
      return await authorise(credential.user);
    } catch (error) {
      await signOut(getFirebaseAuth());
      throw error;
    }
  },

  async signInWithGoogle(): Promise<AuthSession> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const credential = await signInWithPopup(getFirebaseAuth(), provider);
    try {
      return await authorise(credential.user);
    } catch (error) {
      await signOut(getFirebaseAuth());
      throw error;
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  },

  async signOut(): Promise<void> {
    await signOut(getFirebaseAuth());
  },

  /**
   * Restores a session on reload. Emits `null` for a signed-out visitor *and*
   * for a signed-in non-admin (who is signed out as a side effect), so a crew
   * member who used the PWA on this browser can never land inside the console.
   */
  subscribe(listener: (session: AuthSession | null) => void): () => void {
    return onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      if (!firebaseUser) {
        listener(null);
        return;
      }

      void authorise(firebaseUser)
        .then(listener)
        .catch(async () => {
          await signOut(getFirebaseAuth()).catch(() => {});
          listener(null);
        });
    });
  },
};

/** Maps Firebase Auth error codes to messages worth showing a human. */
export function describeAuthError(error: unknown): string {
  if (error instanceof AuthDeniedError) return error.message;

  const code = (error as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled in Firebase Authentication.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'The Google sign-in window was closed before finishing.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Allow popups and retry.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'permission-denied':
      return 'Your account is not allowed to read this workspace.';
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Could not sign you in. Please try again.';
  }
}
