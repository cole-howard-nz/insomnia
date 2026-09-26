# Accounts and the per-user experience

The app is built for the author but deployed publicly, so it is multi-tenant from day one. Two layers of data:

- **Shared**: the curriculum (regions, stops, links, criteria, resources). Read-only for users.
- **Private**: everything a user creates or changes (progress, criteria ticks, practice sessions, notes, evidence files, settings). Only ever readable and writable by that user.

## User journeys

### First visit (logged out)
- Landing page: the atmosphere (rain, clouds), one-line pitch, a read-only **preview of the map** so the value is visible before signing up.
- Primary actions: Sign up, Sign in.
- Decision pending: whether to offer a **guest mode** that stores progress locally and merges into an account at signup. Attractive for conversion, but adds a merge path to build. See open questions.

### Sign up
- Email and password, plus display name. Later: Google sign-in, magic link.
- Email verification required before evidence uploads and reminders are enabled. Core use is allowed immediately, so the first minute is not blocked by an inbox.
- Onboarding (three quick screens, skippable):
  1. Experience level: never touched one / know some chords / play a bit.
  2. What are you chasing: a song, a style, general skill (free text or picks).
  3. Weekly practice target (days per week).
- Onboarding **seeds the map**: stops below the user's stated level start pre-marked as "Learning" or "Playable" for them to confirm, not silently marked Mastered. A new user is never dumped on an empty, all-dark map.

### Returning user
- Persistent session, lands on the map with the weather reflecting their current state and the "What next?" suggestion.

### Account management
- Change display name, email (re-verify), password.
- Sign out here / sign out everywhere (session list with device and last-active).
- **Export my data** (JSON, includes practice log and notes; evidence files as a zip).
- **Delete account**: requires password, confirms, then hard-deletes all private rows and files. Wording is plain about permanence.
- Reset password via emailed one-time link (short expiry, single use).

## Authentication design

Requirements: secure by default, simple to operate solo, no lock-in, works on mobile browsers and as an installed PWA.

### Proposed approach
Follow the pattern already proven in munkeware (hand-rolled, session-cookie), trimmed to what this app needs:

- Passwords hashed with **Argon2id** (`@node-rs/argon2`, Node runtime, not Edge).
- Random **session token** in an `httpOnly`, `secure`, `sameSite=lax` cookie. Only the **SHA-256 hash** of the token is stored in the database, so a database leak cannot be replayed as sessions.
- Sliding expiry (e.g. 30 days, renewed when less than half remains). Long sessions matter: a practice app must not log people out mid-week.
- Sessions table records device label, created, last seen, so the session list in settings is cheap.
- Password reset and email verification use random single-use tokens, stored hashed, with short expiry.
- **Rate limiting** on sign-in, sign-up, reset, and verification endpoints (per IP and per account).
- CSRF: `sameSite=lax` cookies plus SvelteKit's built-in origin check on form actions; JSON endpoints require a custom header or same-origin check.
- Generic error messages on sign-in and reset ("email or password incorrect", "if that email exists, we sent a link") to avoid account enumeration.

Alternative worth a look before building: **Better Auth** would cover email/password, verification, reset, sessions, and Google/passkeys with less code. Munkeware avoided libraries for schema-control reasons that don't apply here. Decision belongs in [06-roadmap-and-open-questions.md](06-roadmap-and-open-questions.md).

### What is deliberately left out of v1
- 2FA/TOTP: overkill for the data involved (practice logs). Revisit with passkeys.
- Admin roles for users. Only one privileged role exists: the owner, who edits the curriculum via a separate protected admin surface (see below).
- Invite codes. Munkeware is invite-only, this app is open signup.

### Authorization rules
- Every private table has a `user_id` column, and **every query filters by the session's user id**, enforced in a single data-access layer, never ad hoc in route handlers.
- Ids in URLs are never trusted: a practice session, evidence file, or progress row is loaded with `WHERE id = ? AND user_id = ?`.
- Evidence files are served through an authenticated endpoint or signed short-lived URLs, never as public blob URLs.
- Postgres row-level security is an optional second wall if the data layer allows it.

### Curriculum admin
- The owner account carries an `is_curriculum_admin` flag (set by hand in the database, no UI to grant it).
- Admin routes are gated server-side on that flag. They let the owner edit stops, criteria, links, resources, and map layout.
- Curriculum edits are versioned, and user progress references stop ids, so edits never orphan progress.

## Data ownership and privacy

- Collect the minimum: email, display name, password hash, practice data. No tracking pixels, no third-party analytics that identify users.
- Recordings and notes are private by default, and there is no public profile in v1.
- Errors are logged without practice content or tokens.
- A short plain-language privacy page states what is stored, and where.
- Account deletion is real deletion, including files, within a stated window.

## Edge cases to design for

| Case | Behavior |
|---|---|
| Two devices editing at once | Last write wins per field, practice log entries are append-only so nothing is lost |
| Curriculum changes under an active user | Progress kept by stop id, new stops appear unseen, removed stops archived and hidden |
| User offline (PWA, v1.5) | Practice logging queued locally, synced on reconnect, conflicts resolved by append |
| Forgot password + unverified email | Reset only works on verified emails, otherwise support path is manual |
| Abandoned accounts | Untouched for a long period (e.g. 24 months) get an email warning, then deletion |
| Spam signups | Rate limit, email verification, optional CAPTCHA only if abuse actually appears |
