/**
 * Adds a domain to Firebase Authentication's authorized-domain allowlist.
 *
 *   node scripts/authorize-domain.mjs partyallo-admin.vercel.app
 *   node scripts/authorize-domain.mjs                    # list current domains
 *
 * Google sign-in fails with `auth/unauthorized-domain` on any origin not in
 * this list, so every new hosting domain (and custom domain) needs adding once.
 * Email/password sign-in is unaffected, which makes this easy to misdiagnose.
 *
 * Requires serviceAccountKey.json in the project root.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { GoogleAuth } from 'google-auth-library';

const domain = process.argv[2];
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const keyPath = path.join(root, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
const projectId = serviceAccount.project_id;

const auth = new GoogleAuth({
  keyFile: keyPath,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();
const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

const current = await client.request({ url: configUrl });
const domains = current.data.authorizedDomains ?? [];

console.log(`Authorized domains for ${projectId}:`);
domains.forEach((d) => console.log(`  - ${d}`));

if (!domain) {
  console.log('\nPass a domain to add it, e.g. node scripts/authorize-domain.mjs my.app');
  process.exit(0);
}

if (domains.includes(domain)) {
  console.log(`\n"${domain}" is already authorized. Nothing to do.`);
  process.exit(0);
}

await client.request({
  url: `${configUrl}?updateMask=authorizedDomains`,
  method: 'PATCH',
  data: { authorizedDomains: [...domains, domain] },
});

console.log(`\nAdded "${domain}". Google sign-in will now work on that origin.`);
