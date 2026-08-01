import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Live Firebase project `partyallo-event-packing` — the same project the
 * PartyAllo PWA writes to. Every collection below is shared, so changes made
 * here are visible in the PWA immediately and vice versa.
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function app(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env and provide the VITE_FIREBASE_* values.',
    );
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(app());
    // Keep the operator signed in across reloads; failures are non-fatal
    // (private browsing), the session just becomes in-memory only.
    void setPersistence(authInstance, browserLocalPersistence).catch(() => {});
  }
  return authInstance;
}

export function getDb(): Firestore {
  return getFirestore(app());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(app());
}

/** Live collection names. Must stay in step with `firestore.rules` and the PWA. */
export const COLLECTIONS = {
  users: 'users',
  events: 'events',
  stations: 'stations',
  purchases: 'purchases',
  settings: 'settings',
} as const;

export const SETTINGS_DOC_ID = 'app';
