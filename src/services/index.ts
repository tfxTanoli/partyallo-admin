import type { DataSource } from './contracts';
import { firebaseDataSource, isFirebaseConfigured } from './firebase';

/**
 * The live data source. Every screen reads and writes the real
 * `partyallo-event-packing` Firebase project — the same one the PartyAllo PWA
 * uses, so changes here are visible there immediately and vice versa.
 */
if (!isFirebaseConfigured()) {
  throw new Error(
    'Firebase credentials are missing. Copy .env.example to .env and fill in the VITE_FIREBASE_* values.',
  );
}

export const api: DataSource = firebaseDataSource;

export * from './contracts';
export { describeAuthError, firebaseAuthService, type AuthSession } from './firebase';
