/**
 * Mints a short-lived Firebase custom token for a given account so you can sign
 * in to a local dev build without typing a password.
 *
 *   node scripts/dev-signin-token.mjs usman5194999@gmail.com
 *
 * Then, in the browser console on http://localhost:5173:
 *   const { getAuth, signInWithCustomToken } = await import(
 *     'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js');
 *   await signInWithCustomToken(getAuth(), '<token>');
 *
 * LOCAL DEVELOPMENT ONLY. It reads the service account key, so never run it on
 * a shared machine or paste the output anywhere public. Tokens expire in 1 hour.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/dev-signin-token.mjs <email>');
  process.exit(1);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const serviceAccount = JSON.parse(
  readFileSync(path.join(root, 'serviceAccountKey.json'), 'utf8'),
);

initializeApp({ credential: cert(serviceAccount) });

const user = await getAuth().getUserByEmail(email);
const token = await getAuth().createCustomToken(user.uid);

console.log(`uid:   ${user.uid}`);
console.log(`email: ${user.email}`);
console.log(`\n${token}`);
