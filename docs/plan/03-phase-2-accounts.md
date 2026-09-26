# Phase 2: Accounts

Goal: people can sign up, sign in, and manage their account securely, and two users provably cannot see each other's data.

Prerequisites: Phase 0 Done. Phase 1 Done (or noted as swapped).
Read first: [../03-accounts-and-auth.md](../03-accounts-and-auth.md), [../05-architecture.md](../05-architecture.md).
Reference code (read only): munkeware `docs/plan/02-auth.md` and `src/lib/server/` for the session pattern.

## Checklist

### Schema
- [x] Tables: `users`, `sessions`, `email_tokens`, `user_settings`, plus `is_curriculum_admin` on users.
- [x] Migration generated and applied.

### Core auth (server)
- [x] Argon2id hashing (`@node-rs/argon2`), Node runtime only, never Edge.
- [x] Session token: random, stored as SHA-256 hash, `httpOnly`, `secure` outside dev, `sameSite=lax`, sliding 30 day expiry.
- [x] `hooks.server.ts` resolves the session into `locals.user`, renews sliding expiry.
- [x] Route group split: public, and authenticated app shell that redirects to sign-in.
- [x] Zod validation on all inputs, password minimum length and a common-password check.
- [x] Generic error messages, no account enumeration on sign-in or reset.
- [x] Rate limiting (Upstash) on sign-in, sign-up, reset, verify, per IP and per account. (Upstash when configured, in-memory fallback otherwise. See the decision log.)

### Flows and pages
- [x] Sign up (email, password, display name), sign in, sign out.
- [x] Email verification: transactional email provider, single-use hashed token, short expiry, resend with rate limit. (Code done, sends through Resend. Not tried with a real inbox, see below.)
- [x] Password reset request and confirm.
- [x] `/me`: change display name, change email (re-verify), change password, session list with device and last seen, sign out everywhere.
- [x] Export my data (JSON) endpoint. Structure ready to include progress later.
- [x] Delete account: password confirm, hard delete of user rows (cascade), placeholder hook for deleting files later.
- [x] All pages styled in the app voice and mobile-first, with clear inline errors.

### Scoped data layer
- [x] Create `src/lib/server/data/` with the convention: every function takes `userId` as a required first argument.
- [x] Add a lint rule or code review checklist entry forbidding private-table queries outside this folder.
- [x] Ship one real example (user settings read/write) that demonstrates the pattern.

### Admin flag
- [x] `is_curriculum_admin` set only by hand in the database. Admin route guard in place, admin UI comes later if needed.

### Tests
- [x] Unit: hashing, token hashing, expiry logic.
- [x] Integration: sign up, verify, sign in, reset, delete.
- [x] **Isolation test:** create users A and B, prove B cannot read or modify any of A's rows through any exposed route or data function.
- [x] Rate limit test on sign-in.

## Exit criteria

- [ ] Full account lifecycle works end to end on a phone, including the real emails. (Deferred by owner: needs a Resend key and sender domain. Works locally with emails printed to the server console.)
- [x] Isolation test passes and is part of the normal test run.
- [ ] Session cookie flags verified in a deployed preview. (Deferred by owner: no preview deploy. `httpOnly`, `sameSite=lax` and the 30 day expiry are checked in e2e, `secure` only switches on outside dev.)
- [x] Security self-review done (run the security-review skill on the branch) and findings addressed. (One low-confidence finding, control characters in the post sign-in redirect, fixed and tested.)
- [ ] Checks, lint, tests pass. Preview deployed. (Checks, lint, unit and integration tests, and e2e pass. Preview deploy deferred by owner.)

## Handoff notes

- **Who is signed in**: `event.locals.user` (`SessionUser`: id, email, displayName, emailVerified, isCurriculumAdmin, onboardingDone) and `event.locals.session` (`{ id, expiresAt }`), set in [src/hooks.server.ts](../../src/hooks.server.ts). Never carries the password hash. The root layout server load passes `user` to every page as `data.user`.
- **The guard**: the hook redirects to `/sign-in?next=...` for anything under the `(app)` route group, so pages, loads, actions and endpoints are all covered. New private routes go inside `(app)`. Inside a load or action, `requireUser(event)` from [guards.ts](../../src/lib/server/auth/guards.ts) returns `{ user, session }` and gives you a typed user. `requireAdmin(event)` 404s for non-admins, `safeNext()` sanitises redirect targets.
- **Auth modules** in [src/lib/server/auth/](../../src/lib/server/auth/): `session.ts` (create, validate, invalidate, list, cookies, `startSession`, `clientIp`), `accounts.ts` (sign up, authenticate, verify, reset, change email or password, delete), `tokens.ts`, `password.ts`, `password-policy.ts`, `validation.ts` (Zod schemas, `fieldErrors`, `formFields`), `email.ts`, `device.ts`. Pure logic lives in files with no `$` imports so it unit-tests without a database.
- **Data layer convention**: everything private lives in [src/lib/server/data/](../../src/lib/server/data/), every function takes `userId` first, every query filters by it, ids from a URL or form use `WHERE id = ? AND user_id = ?`. `settings.ts` is the worked example. ESLint (`no-restricted-imports` in `eslint.config.js`) blocks importing user-owned tables from anywhere else except `auth/` and `db/`. **When you add a private table, add its export name to `PRIVATE_TABLES` in `eslint.config.js`**, give it a `user_id` that references `users.id` with `onDelete: 'cascade'`, and add it to `exportUserData` in `data/export.ts`. Phase 4 fills in `deleteUserFiles` in `data/files.ts`, account deletion already calls it.
- **Forms**: plain SvelteKit form actions with `use:enhance`, Zod on the server, errors returned as `{ errors: { field: message, _: general } }` and read in pages through a typed `errs` derived value. The `/me` page uses named actions and returns `action` so each section shows only its own result.
- **Verify and reset links** open a page with a button, the token is spent by a POST, so mail scanners that prefetch links cannot burn it. Tokens are 160 random bits, only the SHA-256 is stored, verify lasts 24 hours, reset 1 hour, only the newest of each kind works. A verify link only counts while the address it was sent to is still the account's. Reset only sends to verified addresses and signs out every device.
- **Rate limits**: [rate-limit.ts](../../src/lib/server/rate-limit.ts). Upstash when `UPSTASH_REDIS_REST_URL` and `_TOKEN` are set, otherwise a per-instance in-memory limiter (fine locally, best effort on serverless). Set both in production.
- **Env vars**: `PUBLIC_APP_URL` (required in production, used for links in emails), `RESEND_API_KEY` and `EMAIL_FROM` (without them in dev, emails print to the server console, in production sending throws), `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. `AUTH_SECRET` is not used and was removed from `.env.example`.
- **Email provider**: Resend over its HTTP API (no SDK). To finish: create a Resend account, verify a sending domain, set the two env vars in Vercel, sign up with a real address and click through verify and reset on a phone.
- **Making an admin**: `update users set is_curriculum_admin = true where email = '...'` in the Neon console. `/admin` is a placeholder page.
- **Tests**: `accounts.integration.test.ts` runs against the real database (skips when `DATABASE_URL` is missing, cleans up the users it makes, mocks the email module to capture tokens) and holds the isolation tests. `e2e/auth.test.ts` covers the flows in the browser. e2e specs get users from `e2e/fixtures.ts` (`account`, `signedIn`), which inserts users directly so the sign-up rate limit is not spent, and every map and shell spec now signs in first.
- **Known gaps, by design**: sign-up says when an email is already registered (a verify-first flow would hide it, but core use is not blocked on email). The `/me` delete button needs the page hydrated, e2e retries the click.

Not done, needs the owner:
- Real emails on a phone (Resend key and sender domain).
- Preview deploy, then confirm the session cookie has `secure` set.
- Consider disabling Neon Auth in the Neon console, this app owns its sessions and schema.
