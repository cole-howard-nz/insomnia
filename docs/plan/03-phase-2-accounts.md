# Phase 2: Accounts

Goal: people can sign up, sign in, and manage their account securely, and two users provably cannot see each other's data.

Prerequisites: Phase 0 Done. Phase 1 Done (or noted as swapped).
Read first: [../03-accounts-and-auth.md](../03-accounts-and-auth.md), [../05-architecture.md](../05-architecture.md).
Reference code (read only): munkeware `docs/plan/02-auth.md` and `src/lib/server/` for the session pattern.

## Checklist

### Schema
- [ ] Tables: `users`, `sessions`, `email_tokens`, `user_settings`, plus `is_curriculum_admin` on users.
- [ ] Migration generated and applied.

### Core auth (server)
- [ ] Argon2id hashing (`@node-rs/argon2`), Node runtime only, never Edge.
- [ ] Session token: random, stored as SHA-256 hash, `httpOnly`, `secure` outside dev, `sameSite=lax`, sliding 30 day expiry.
- [ ] `hooks.server.ts` resolves the session into `locals.user`, renews sliding expiry.
- [ ] Route group split: public, and authenticated app shell that redirects to sign-in.
- [ ] Zod validation on all inputs, password minimum length and a common-password check.
- [ ] Generic error messages, no account enumeration on sign-in or reset.
- [ ] Rate limiting (Upstash) on sign-in, sign-up, reset, verify, per IP and per account.

### Flows and pages
- [ ] Sign up (email, password, display name), sign in, sign out.
- [ ] Email verification: transactional email provider, single-use hashed token, short expiry, resend with rate limit.
- [ ] Password reset request and confirm.
- [ ] `/me`: change display name, change email (re-verify), change password, session list with device and last seen, sign out everywhere.
- [ ] Export my data (JSON) endpoint. Structure ready to include progress later.
- [ ] Delete account: password confirm, hard delete of user rows (cascade), placeholder hook for deleting files later.
- [ ] All pages styled in the app voice and mobile-first, with clear inline errors.

### Scoped data layer
- [ ] Create `src/lib/server/data/` with the convention: every function takes `userId` as a required first argument.
- [ ] Add a lint rule or code review checklist entry forbidding private-table queries outside this folder.
- [ ] Ship one real example (user settings read/write) that demonstrates the pattern.

### Admin flag
- [ ] `is_curriculum_admin` set only by hand in the database. Admin route guard in place, admin UI comes later if needed.

### Tests
- [ ] Unit: hashing, token hashing, expiry logic.
- [ ] Integration: sign up, verify, sign in, reset, delete.
- [ ] **Isolation test:** create users A and B, prove B cannot read or modify any of A's rows through any exposed route or data function.
- [ ] Rate limit test on sign-in.

## Exit criteria

- [ ] Full account lifecycle works end to end on a phone, including the real emails.
- [ ] Isolation test passes and is part of the normal test run.
- [ ] Session cookie flags verified in a deployed preview.
- [ ] Security self-review done (run the security-review skill on the branch) and findings addressed.
- [ ] Checks, lint, tests pass. Preview deployed.

## Handoff notes

(fill in at end: session helper API, data layer convention, env vars added, email provider setup)
