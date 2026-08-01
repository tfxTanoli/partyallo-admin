/**
 * Read-only reconnaissance: prints the shape of every collection so the admin
 * models can be written against the real data rather than assumptions.
 *
 * Run with: node scripts/inspect-firestore.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serviceAccount = JSON.parse(
  readFileSync(path.join(root, 'serviceAccountKey.json'), 'utf8'),
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function describe(value, depth = 0) {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return value.length === 0 ? 'array(empty)' : `array<${describe(value[0], depth + 1)}>[${value.length}]`;
  }
  if (value && typeof value.toDate === 'function') return 'Timestamp';
  if (typeof value === 'object') {
    if (depth >= 1) return `object{${Object.keys(value).slice(0, 8).join(',')}}`;
    return `{ ${Object.entries(value)
      .slice(0, 12)
      .map(([k, v]) => `${k}: ${describe(v, depth + 1)}`)
      .join(', ')} }`;
  }
  return typeof value;
}

const collections = await db.listCollections();
console.log('=== ROOT COLLECTIONS ===');
console.log(collections.map((c) => c.id).join(', ') || '(none)');

for (const col of collections) {
  const snap = await col.limit(3).get();
  const count = (await col.count().get()).data().count;
  console.log(`\n--- ${col.id} (${count} docs) ---`);
  snap.docs.forEach((d, i) => {
    const data = d.data();
    console.log(`  [${i}] id=${d.id}`);
    for (const [k, v] of Object.entries(data)) {
      console.log(`      ${k}: ${describe(v)}`);
    }
    if (i === 0) console.log('      SAMPLE:', JSON.stringify(data).slice(0, 600));
  });
}

console.log('\n=== AUTH USERS ===');
const users = await getAuth().listUsers(50);
console.log(`total listed: ${users.users.length}`);
users.users.forEach((u) => {
  console.log(
    `  ${u.uid} | ${u.email ?? '(no email)'} | name=${u.displayName ?? '-'} | providers=${u.providerData
      .map((p) => p.providerId)
      .join(',')} | claims=${JSON.stringify(u.customClaims ?? {})} | created=${u.metadata.creationTime}`,
  );
});
