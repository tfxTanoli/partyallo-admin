# PartyAllo Admin

Admin console for the **PartyAllo Event Packing Tracker**, running on **live
Firebase data** — the same `partyallo-event-packing` project the PartyAllo crew
PWA uses. Changes made here appear in the crew app immediately, and vice versa.

React 19 · Vite · TypeScript (strict, no `any`) · Tailwind v4 · React Router ·
TanStack Query · React Hook Form + Zod · Motion · Recharts · Radix primitives.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Sign in at `/login` with a Firebase account that has the **admin** role
(Google or email + password). Everyone else is refused — see *Access control*.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck (`tsc -b`) then bundle |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint over `src/` |
| `npm run users:sync` | **Dry run** — show the Auth → `users/{uid}` sync plan |
| `npm run users:sync:apply -- --admin a@b.com` | Apply it, granting admin to the named accounts |
| `npm run rules:deploy` | Deploy `firestore.rules` |
| `npm run rules:verify` | Assert the deployed rules behave, as a real admin *and* a real crew member |
| `npm run firestore:inspect` | Print the live collection shapes |
| `npm run auth:domains` | List Firebase Auth authorized domains; pass one to add it |

---

## Screens

| Route | What it covers |
| --- | --- |
| `/login` | Google or email + password. Non-admins are signed straight back out with a clear message. |
| `/` | Live metrics, events-by-month and users-growth charts, recent events with packing progress, the crew's real packing activity, newest accounts, outstanding-purchases banner. |
| `/users` | Directory, search / filter / sort, details drawer, **Add user**, promote and demote, resend invite. |
| `/events` | List with live packing progress; All / Upcoming / Past tabs and a status filter. |
| `/events/:id` | Packing progress, the full packing list (who packed what, when), per-station rollup, the crew's activity log. |
| `/catalogue` | Stations as cards or a table; create, edit, duplicate, delete. |
| `/purchases` | The shopping list: summary tiles that double as filters, overdue flagging, row-level purchased toggle, full CRUD. |
| `/settings` | Company info and crew-app lists (shared with the PWA), console theme and brand colour (local to the browser). |

Unknown paths redirect to an in-shell 404.

---

## Deployment

Deployed to Vercel at **partyallo-admin.vercel.app**. Pushes to `main`
auto-deploy; `npx vercel deploy --prod` deploys the working tree.

`vercel.json` pins the Vite preset and — the important part — rewrites every
unmatched path to `index.html`. Without that, loading `/users` directly or
refreshing on it returns a 404, because Vercel looks for a file at that path.

Three things that are easy to get wrong:

1. **Env vars must exist before the build.** Vite inlines `VITE_*` at build
   time, so setting them after a deploy does nothing until you redeploy.
   `.env` is git-ignored, so Vercel needs its own copy of all six.
2. **New domains need authorising in Firebase.** Google sign-in fails with
   `auth/unauthorized-domain` on any origin not in Firebase Auth's allowlist.
   Email/password keeps working, which makes it easy to misdiagnose. Fix with
   `npm run auth:domains -- yourdomain.com`.
3. **`vercel.json` rejects unknown properties.** JSON has no comment syntax; a
   stray `comment` key fails schema validation and aborts the build before it
   starts.

---

## Access control

**Authentication** is Firebase Auth, shared with the crew app.
**Authorisation** is the `users/{uid}.role` document — a crew member has
perfectly valid credentials for the PWA and is still refused here.

Role lives in Firestore rather than a custom auth claim **so an existing admin
can promote a colleague straight from the Users screen**. Custom claims can only
be written from a privileged server, which would mean deploying a Cloud Function
for every role change. `firestore.rules` enforces that only admins may write
`role`, so this is not weaker — just deployable without a backend.

```
users/{uid} = {
  email, displayName, photoUrl, providers[],   // mirrored from Firebase Auth
  role:   'admin' | 'crew',                    // ← console access
  status: 'active' | 'disabled',
  createdAt, updatedAt, lastSignInAt
}
```

**What the rules guarantee.** `npm run rules:verify` asserts all of this against
the live project, signed in as a real admin and a real crew member via
short-lived custom tokens — including that the crew PWA's access has not
regressed. Run it after any rules edit.

| Actor | Action | Result |
| --- | --- | --- |
| crew | read/write events, stations, purchases, settings | allowed — PWA unchanged |
| crew | promote self to admin | **denied** |
| crew | promote anyone else | **denied** |
| crew | change own `status` | **denied** |
| crew | refresh own `displayName` / `lastSignInAt` | allowed (needed at sign-in) |
| crew | edit another person's profile | **denied** |
| crew | create a profile for another uid | **denied** |
| admin | list `users`, change any role | allowed |
| admin | create a profile for another uid | allowed — powers **Add user** |

Two details in `firestore.rules` are load-bearing and worth not "simplifying":

1. The legacy rule matches `users/{uid}/{collection}/{docId}` — **exactly two**
   further segments — rather than a recursive `{document=**}`. A recursive
   wildcard also matches *zero* segments, so it would match `/users/{uid}`
   itself; because rules are OR'd, that would hand every crew member write
   access to their own `role`.
2. Self-updates are gated on `preservesPrivileges()` (role and status carried
   through unchanged) **as well as** a field allowlist. `diff().affectedKeys()`
   only reports keys whose value actually changed, so an allowlist alone lets a
   no-op write of `role` pass vacuously.

### Adding someone

**Users → Add user** creates the Firebase Auth account *and* the profile
document, then emails the invitee a link to set their own password. The admin
never sees or handles a password.

The client SDK's `createUserWithEmailAndPassword` signs the **calling** session
in as the new user, which would kick the admin out of their own console. So the
account is created through a throwaway secondary Firebase app
(`services/firebase/invite.service.ts`), which has its own Auth instance and is
deleted immediately afterwards. `inMemoryPersistence` on that instance is
load-bearing: without it the secondary session lands in localStorage and can
race with the primary one on the next page load.

**Resend invite** (row menu) re-sends the set-password email. It only shows for
password accounts — Google users manage their password with Google.

### Promoting someone

From the UI: **Users → ⋯ → Make admin**. You cannot change your own role or
delete your own profile — the controls are disabled, so you can't lock yourself
out.

From the CLI (useful for bootstrapping the first admin):

```bash
npm run users:sync -- --admin someone@example.com          # preview
npm run users:sync:apply -- --admin someone@example.com    # write
```

Re-running never silently demotes anyone: existing documents keep their `role`
unless an `--admin` flag names them. The script refuses to run if the result
would leave zero admins.

---

## Live data model

Every screen reads the real collections. Nothing is mocked.

| Collection | Screen | Notes |
| --- | --- | --- |
| `events` | Events, Event details, Dashboard | Status is the PWA's `Packing → Loading → Loaded → Complete`. `date` is a `yyyy-MM-dd` **string**; `createdAt`/`updatedAt` are ISO **strings**, not Timestamps. |
| `stations` | Station Catalogue | Categories are free text (the crew app lets users add their own), so the filter options are derived from what is in use. |
| `users` | Users | Profile + role. Backfilled from Firebase Auth by `users:sync`, and written directly by the Add user flow. |
| `purchases` | Purchases, Dashboard banner | Full CRUD. `category`, `supplier` and `unit` are free text in the crew app, so the form suggests values already in use rather than locking them to a union. Overdue is **derived** (outstanding and past `requiredDate`), never stored. |
| `settings/app` | Settings | Shared document. Writes are **merged**, so keys this console does not surface (`themeId`, `defaultItems`) survive a save from here. |

`services/firebase/mappers.ts` reads every document defensively. The PWA has
evolved, so older records are missing fields newer ones have (`logs`, `paxMode`,
`stationInstanceId`) — each mapper supplies a default so one malformed legacy
document can never blank out a whole screen.

**What this console deliberately does not do:** assign stations to events, edit
an event's packing list, or tick packing items. Those are crew-app workflows
tied to the servings maths; the console shows them read-only.

---

## Architecture

```
src/
├─ components/{ui,common,charts}   primitives, shared building blocks, Recharts wrappers
├─ features/                       dashboard, users, events, catalogue, purchases, settings (+ hooks)
├─ layouts/                        shell, sidebar, navbar, global search
├─ pages/                          one lazily-loaded component per route
├─ hooks/                          useDataTable, useDebounce, useDisclosure, …
├─ providers/                      Theme, Query, Auth, Toast
├─ routes/                         route table, guards, route-level error boundary
├─ services/                       contracts.ts + firebase/ (config, mappers, one service per collection)
├─ types/                          domain models mirroring the live documents
├─ constants/ utils/ styles/
```

- **`services/contracts.ts`** is the typed surface every screen talks to;
  `services/firebase/` implements it. Screens never import Firebase directly.
- **`useDataTable`** owns search / sort / filter / pagination for every list
  screen and emits the memoised `ListQuery` used as both the service argument
  and the TanStack Query key.
- **Filtering and sorting happen in memory** after a full collection read. This
  is deliberate: `date` is a string, free-text search has no Firestore index, and
  these collections are in the tens–hundreds of documents. Past a few thousand,
  move to `orderBy` + cursor paging and hand search to Algolia/Typesense — the
  seam is the service, nothing above it changes.
- **Dashboard aggregates** are computed from a full read of four collections.
  At volume, move that into a scheduled Cloud Function maintaining
  `metrics/{month}`; the return shape is designed to stay identical.
- **Stat deltas are period-over-period** (created in the last 30 days vs the 30
  before). When there is no prior baseline the card shows the absolute count
  rather than inventing a percentage — comparing a running total against
  "total minus recent" produces nonsense like "+3300%".

---

## Design system

Tokens are CSS variables in `src/styles/index.css`. Settings rewrites
`--primary` at runtime and every button, link and highlight follows; that
preference is **local to the browser** and is not written to Firestore.

Chart series colours (`--chart-*`) are deliberately **excluded** from theming so
series identity survives a rebrand, and are validated for colour-vision
separation and contrast against both the light and dark chart surfaces.

Dark mode is a designed second theme with its own surfaces, elevations and chart
steps — not an inverted first one. `prefers-reduced-motion` collapses every
animation.

---

## Secrets

`.env` and `serviceAccountKey.json` are git-ignored and must never be committed
or bundled. The service account key grants full, **rules-bypassing** access to
the project; it is read only by the Node scripts in `scripts/`, never by app
code. `scripts/dev-signin-token.mjs` mints a 1-hour custom token for local
sign-in without a password — local development only.

`.rules-backup/` holds the ruleset that was live before this console existed, so
`firestore.rules` can be rolled back in one command if ever needed.

---

## Notes

- `npm audit` reports a high advisory against `react-router` for **RSC-mode
  CSRF**. This is a client-side SPA that does not use RSC mode, so it is not
  exposed; the offered fix downgrades below the installed version.
- The build warns that the `firebase` chunk exceeds 500 kB. That is inherent to
  the Firebase SDK; it is split into its own long-lived vendor chunk so ordinary
  app changes do not invalidate it.
