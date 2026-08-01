/**
 * Backfills `users/{uid}` profile + role documents from Firebase Authentication.
 *
 *   node scripts/sync-users.mjs                      # dry run — prints the plan
 *   node scripts/sync-users.mjs --apply              # write the documents
 *   node scripts/sync-users.mjs --apply --admin a@b.com --admin c@d.com
 *
 * Safe to re-run: existing documents keep their `role` and `status` unless an
 * `--admin` flag names them, so a re-sync never silently demotes anyone. Only
 * the Auth-owned fields (email, display name, photo, providers) are refreshed.
 *
 * Requires `serviceAccountKey.json` in the project root (git-ignored).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const { values } = parseArgs({
  options: {
    apply: { type: 'boolean', default: false },
    admin: { type: 'string', multiple: true, default: [] },
  },
});

const adminEmails = new Set(values.admin.map((email) => email.trim().toLowerCase()));
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(path.join(root, 'serviceAccountKey.json'), 'utf8'));
} catch {
  console.error(
    'Could not read serviceAccountKey.json from the project root.\n' +
      'Download it from Firebase console → Project settings → Service accounts.',
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

/** Page through every Auth account. */
async function listAllUsers() {
  const all = [];
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    all.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return all;
}

const authUsers = await listAllUsers();
console.log(`Found ${authUsers.length} Firebase Auth accounts in ${serviceAccount.project_id}.\n`);

const plan = [];

for (const user of authUsers) {
  const ref = db.collection('users').doc(user.uid);
  const existing = await ref.get();
  const email = (user.email ?? '').toLowerCase();
  const shouldBeAdmin = adminEmails.has(email);

  const authOwned = {
    email: user.email ?? '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Unknown',
    photoUrl: user.photoURL ?? '',
    providers: user.providerData.map((p) => p.providerId),
    createdAt: user.metadata.creationTime
      ? new Date(user.metadata.creationTime).toISOString()
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...(user.metadata.lastSignInTime
      ? { lastSignInAt: new Date(user.metadata.lastSignInTime).toISOString() }
      : {}),
  };

  if (existing.exists) {
    const current = existing.data();
    // Never demote on a re-sync: role only moves when --admin names this account.
    const role = shouldBeAdmin ? 'admin' : (current.role ?? 'crew');
    plan.push({
      uid: user.uid,
      email: authOwned.email,
      action: role !== current.role ? `update (role ${current.role ?? 'crew'} → ${role})` : 'refresh',
      payload: { ...authOwned, role, status: current.status ?? 'active' },
    });
  } else {
    const role = shouldBeAdmin ? 'admin' : 'crew';
    plan.push({
      uid: user.uid,
      email: authOwned.email,
      action: `create (${role})`,
      payload: { ...authOwned, role, status: 'active' },
    });
  }
}

for (const entry of plan) {
  console.log(
    `  ${entry.payload.role.padEnd(5)} | ${entry.email.padEnd(32)} | ${entry.action}`,
  );
}

const adminCount = plan.filter((entry) => entry.payload.role === 'admin').length;
console.log(`\n${adminCount} admin(s), ${plan.length - adminCount} crew.`);

if (adminCount === 0) {
  console.error(
    '\nRefusing to continue: that would leave the console with no admin and lock everyone out.\n' +
      'Re-run with at least one --admin <email>.',
  );
  process.exit(1);
}

if (!values.apply) {
  console.log('\nDry run — nothing written. Re-run with --apply to commit.');
  process.exit(0);
}

const batch = db.batch();
for (const entry of plan) {
  batch.set(db.collection('users').doc(entry.uid), entry.payload, { merge: true });
}
await batch.commit();

console.log(`\nWrote ${plan.length} user document(s).`);
