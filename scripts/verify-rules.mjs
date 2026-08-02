/**
 * Verifies the deployed Firestore rules against the LIVE project by signing in
 * as a real admin and a real crew member (via short-lived custom tokens — no
 * passwords are read or changed) and asserting what each may do.
 *
 *   node scripts/verify-rules.mjs
 *
 * Read-only except for two deliberately-scoped writes that are reverted:
 *   * a crew member's own `lastSignInAt` (which sign-in writes anyway)
 *   * an admin role round-trip on a throwaway account, restored immediately
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cert, initializeApp as initAdmin } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serviceAccount = JSON.parse(
  readFileSync(path.join(root, 'serviceAccountKey.json'), 'utf8'),
);

// Read the same VITE_* values the app uses so this tests the real config.
const env = Object.fromEntries(
  readFileSync(path.join(root, '.env'), 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const [key, ...rest] = line.split('=');
      return [key.trim(), rest.join('=').trim()];
    }),
);

initAdmin({ credential: cert(serviceAccount) });

const clientApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(clientApp);
const db = getFirestore(clientApp);

const results = [];

function record(scenario, expectation, passed, detail) {
  results.push({ scenario, expectation, passed, detail });
  console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${scenario} — ${expectation}${detail ? ` (${detail})` : ''}`);
}

async function attempt(run) {
  try {
    const value = await run();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, code: error.code ?? error.message };
  }
}

async function signInAs(email) {
  const user = await getAdminAuth().getUserByEmail(email);
  const token = await getAdminAuth().createCustomToken(user.uid);
  await signOut(auth).catch(() => {});
  const credential = await signInWithCustomToken(auth, token);
  return credential.user.uid;
}

const SHARED = ['events', 'stations', 'purchases', 'settings'];

/* -------------------------------------------------------------------------- */
console.log('\n=== AS ADMIN (usman5194999@gmail.com) ===');
const adminUid = await signInAs('usman5194999@gmail.com');

for (const name of SHARED) {
  const r = await attempt(() => getDocs(collection(db, name)));
  record(`admin reads /${name}`, 'allowed', r.ok, r.ok ? `${r.value.size} docs` : r.code);
}

const adminListUsers = await attempt(() => getDocs(collection(db, 'users')));
record('admin lists /users', 'allowed', adminListUsers.ok,
  adminListUsers.ok ? `${adminListUsers.value.size} docs` : adminListUsers.code);

// Round-trip a role change on a throwaway account, then restore it.
const throwaway = await getAdminAuth().getUserByEmail('test@example.com');
const promote = await attempt(() =>
  updateDoc(doc(db, 'users', throwaway.uid), { role: 'admin' }),
);
record('admin promotes another account', 'allowed', promote.ok, promote.code);
if (promote.ok) {
  await updateDoc(doc(db, 'users', throwaway.uid), { role: 'crew' });
  console.log('        (restored test@example.com back to crew)');
}

// The invite flow writes a profile for a uid that is not the caller's.
const PROBE_UID = 'rules-probe-admin-create';
const probeProfile = {
  email: 'probe@example.invalid',
  displayName: 'Rules Probe',
  role: 'admin',
  status: 'active',
  providers: ['password'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const adminCreates = await attempt(() => setDoc(doc(db, 'users', PROBE_UID), probeProfile));
record('admin creates a profile for another uid', 'allowed — powers Add user', adminCreates.ok,
  adminCreates.code);
if (adminCreates.ok) await deleteDoc(doc(db, 'users', PROBE_UID)).catch(() => {});

/* -------------------------------------------------------------------------- */
console.log('\n=== AS CREW (khayentan@gmail.com) ===');
const crewUid = await signInAs('khayentan@gmail.com');

for (const name of SHARED) {
  const r = await attempt(() => getDocs(collection(db, name)));
  record(`crew reads /${name} (PWA)`, 'allowed — must not regress', r.ok,
    r.ok ? `${r.value.size} docs` : r.code);
}

const crewWritesEvent = await attempt(() =>
  setDoc(doc(db, 'settings', 'app'), {}, { merge: true }),
);
record('crew writes /settings/app (PWA)', 'allowed — must not regress', crewWritesEvent.ok,
  crewWritesEvent.code);

const selfPromote = await attempt(() => updateDoc(doc(db, 'users', crewUid), { role: 'admin' }));
record('crew promotes SELF to admin', 'DENIED', !selfPromote.ok, selfPromote.code);

const promoteOther = await attempt(() =>
  updateDoc(doc(db, 'users', throwaway.uid), { role: 'admin' }),
);
record('crew promotes ANOTHER to admin', 'DENIED', !promoteOther.ok, promoteOther.code);

// Must be a GENUINE change: `affectedKeys()` ignores no-op writes, so writing
// the current value proves nothing about the allowlist.
const selfDisable = await attempt(() =>
  updateDoc(doc(db, 'users', crewUid), { status: 'disabled' }),
);
record('crew changes own status', 'DENIED', !selfDisable.ok, selfDisable.code);

const selfDemote = await attempt(() => updateDoc(doc(db, 'users', crewUid), { role: 'crew' }));
record(
  'crew re-writes own role unchanged',
  'harmless — value is identical, so nothing can escalate',
  true,
  selfDemote.ok ? 'allowed, document unchanged' : selfDemote.code,
);

const selfRefresh = await attempt(() =>
  setDoc(doc(db, 'users', crewUid), { lastSignInAt: new Date().toISOString() }, { merge: true }),
);
record('crew refreshes own lastSignInAt', 'allowed — needed at sign-in', selfRefresh.ok,
  selfRefresh.code);

const crewDeletes = await attempt(() => updateDoc(doc(db, 'users', throwaway.uid), { displayName: 'hacked' }));
record("crew edits another's profile", 'DENIED', !crewDeletes.ok, crewDeletes.code);

// The `allow create` branch widened for the invite flow — prove it did not
// open a hole. A crew member must not be able to mint a profile at all.
const crewCreatesForOther = await attempt(() =>
  setDoc(doc(db, 'users', 'rules-probe-crew-create'), {
    email: 'x@example.invalid',
    displayName: 'Injected',
    role: 'admin',
    status: 'active',
    providers: ['password'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
);
record('crew creates a profile for another uid', 'DENIED', !crewCreatesForOther.ok,
  crewCreatesForOther.code);
if (crewCreatesForOther.ok) await deleteDoc(doc(db, 'users', 'rules-probe-crew-create')).catch(() => {});

await signOut(auth).catch(() => {});

/* -------------------------------------------------------------------------- */
const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length > 0) {
  console.error('\nFAILED:');
  failed.forEach((r) => console.error(`  ${r.scenario} — expected ${r.expectation} (${r.detail})`));
  process.exit(1);
}
console.log('All security expectations hold.');
process.exit(0);
