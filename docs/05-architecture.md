# Architecture (proposal)

Not final. Chosen to reuse what already works in munkeware, so the atmosphere components can be lifted with minimal change.

## Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | SvelteKit (Svelte 5) | Same as munkeware, rain and cloud components port directly |
| Styling | Tailwind v4 with CSS tokens | Same as munkeware |
| Language | TypeScript | |
| Database | Postgres (Neon) | Relational fits users, curriculum graph, logs |
| ORM/migrations | Drizzle | Same as munkeware |
| Auth | Session cookies, Argon2id (see [03](03-accounts-and-auth.md)) or Better Auth | Decision pending |
| Validation | Zod (+ sveltekit-superforms for forms) | |
| Files (evidence) | Object storage (Vercel Blob or S3-compatible) behind authenticated access | |
| Email | Transactional provider (Resend or similar) | Verification and reset |
| Rate limiting | Upstash Redis | Same as munkeware |
| Hosting | Vercel | Same as munkeware |
| Map rendering | SVG in a pan/zoom container to start, Canvas if stop count grows large | SVG gives free hit-testing and accessibility for a few hundred nodes |
| PWA | Web manifest and service worker (v1.5) | |
| Testing | Vitest (unit), Playwright (a few end-to-end paths) | |

## Data model (first draft)

Shared curriculum (read-only to users):

- `regions` (id, slug, name, blurb, map_x, map_y, sort)
- `stops` (id, region_id, slug, name, summary, kind [`skill`|`song`], map_x, map_y, target_bpm nullable, archived_at nullable)
- `stop_links` (from_stop_id, to_stop_id, kind [`helps`|`unlocks`])
- `criteria` (id, stop_id, level [2|3|4], text, sort)
- `resources` (id, stop_id, title, url, kind [`video`|`tab`|`article`|`exercise`], sort)
- `song_requirements` (song_stop_id, skill_stop_id) (v1.5, could reuse `stop_links`)

Users and auth:

- `users` (id, email, email_verified_at, password_hash, display_name, is_curriculum_admin, created_at, onboarding_done)
- `sessions` (id = sha256(token), user_id, device_label, created_at, last_seen_at, expires_at)
- `email_tokens` (id, user_id, kind [`verify`|`reset`], token_hash, expires_at, used_at)

Private per-user:

- `user_stop_progress` (user_id, stop_id, level [0-4], last_practiced_at, best_bpm, notes, updated_at) primary key (user_id, stop_id)
- `user_criteria_done` (user_id, criterion_id, done_at)
- `practice_sessions` (id, user_id, started_at, minutes, feel [`sloppy`|`ok`|`clean`|`breakthrough`], note)
- `practice_session_stops` (session_id, stop_id, bpm nullable)
- `evidence` (id, user_id, stop_id, level_at_time, kind [`audio`|`video`|`note`], storage_key, created_at)
- `level_events` (id, user_id, stop_id, from_level, to_level, at) (drives the per-stop timeline, append-only)
- `user_settings` (user_id, weekly_target_days, reduced_effects, reminders_enabled, ...)
- v1.5: `custom_stops`, `goals`, `push_subscriptions`

Notes:
- `level_events` and `practice_sessions` are append-only, so offline sync and multi-device use cannot lose history.
- Rust is **computed**, not stored: derived from `level`, `last_practiced_at`, and now. No cron job needed.
- Progress rows are created lazily. A stop with no row means Unseen.

## Access pattern

All private reads and writes go through one server module (e.g. `src/lib/server/data/*`) that takes the authenticated `userId` as a required argument. Route handlers never write raw queries against private tables. This makes "every query is scoped to the user" a structural property, and reviewable in one place.

## Route sketch

Public: `/` (landing + map preview), `/sign-in`, `/sign-up`, `/reset`, `/privacy`.

Authenticated app shell (bottom tab bar):
- `/map` and `/map/[stop]`
- `/practice` (start session, timer, log)
- `/log` (history, streaks, per-stop timeline)
- `/me` (settings, sessions, export, delete)

Admin (owner only): `/admin/curriculum`.

## Seed content

The initial curriculum lives as versioned data in the repo (JSON or TypeScript) and a seed script loads it. This makes the curriculum reviewable in git and rebuildable, with an admin UI only if hand-editing gets painful.
