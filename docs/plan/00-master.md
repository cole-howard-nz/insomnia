# Master Plan (start every session here)

Project: **Insomnia**, a mobile-first, multi-user web app that maps a guitar learning pathway. Product docs are in [../](../00-overview.md). This folder is the execution plan, one file per phase, each run in its own session.

## How to run a session

1. Read this file, then the phase file you are executing. Read the product docs it links, and nothing else unless needed.
2. Confirm the phase's **prerequisites** are marked Done in the status table below. If not, stop and say so.
3. Work through the phase checklist in order. Tick items in the phase file as they are completed.
4. Commit frequently per [../../CLAUDE.md](../../CLAUDE.md).
5. Before ending: verify every **exit criterion**, fill in the phase's **Handoff notes**, then update the status table and **Decision log** here.
6. Never start the next phase in the same session.

Kickoff prompt template:

> Read docs/plan/00-master.md and docs/plan/0N-name.md, then execute phase N. Follow the session protocol in the master file.

## Status

| Phase | File | Goal | Status |
|---|---|---|---|
| 0 | [01-phase-0-foundations.md](01-phase-0-foundations.md) | Scaffold, design system, weather background on a phone | Done (phone perf check and preview deploy deferred by owner) |
| 1 | [02-phase-1-curriculum-and-map.md](02-phase-1-curriculum-and-map.md) | Curriculum data, map, list view, stop detail (no accounts) | Done (phone smoothness check and preview deploy deferred by owner) |
| 2 | [03-phase-2-accounts.md](03-phase-2-accounts.md) | Authentication and account management | Done (real emails on a phone and preview deploy deferred by owner) |
| 3 | [04-phase-3-core-loop.md](04-phase-3-core-loop.md) | Progress, criteria, practice log, rust, what next, weather | In progress (code complete, tested. Two weeks of real use, threshold tuning and preview deploy still open) |
| 4 | [05-phase-4-evidence-and-polish.md](05-phase-4-evidence-and-polish.md) | Evidence, timeline, onboarding, landing, privacy | Not started |
| 5 | [06-phase-5-launch.md](06-phase-5-launch.md) | Deploy, monitoring, abuse controls, launch | Not started |

Status values: Not started, In progress, Done, Blocked (with reason).

## Dependency order

0 -> 1 -> 2 -> 3 -> 4 -> 5. Phases 1 and 2 are independent of each other in code but are ordered so the map is seen before auth work starts. If a session wants to swap them, note it in the decision log.

## Fixed decisions (provisional defaults, change via the decision log)

These resolve the open questions in [../06-roadmap-and-open-questions.md](../06-roadmap-and-open-questions.md) so no session stalls.

| Topic | Decision |
|---|---|
| Name | Insomnia (verify domain, handles, and app store collisions before Phase 5) |
| Stack | SvelteKit (Svelte 5), TypeScript, Tailwind v4, Drizzle, Neon Postgres, Vercel |
| Auth | Hand-rolled session cookies, Argon2id, ported from munkeware |
| Guest mode | None in v1, landing page has a read-only map preview |
| Email verification | Does not block core use, gates uploads and reminders |
| Curriculum | Authored in repo as versioned data, loaded by seed script |
| Resources | Link out only, never embed or host third-party content |
| Rust thresholds | Playable 21 days, Solid 45, Mastered 90 |
| Evidence limits | 200 MB per user, 2 minute clips |
| Repo visibility | Private until decided |

## Conventions for every phase

- Commits: `type(scope): description`, 15 words or less. Small and frequent.
- Mobile-first: build and check at 390px wide before anything larger.
- Every private table has `user_id`, and every private query goes through the scoped data layer in `src/lib/server/data/`. No exceptions.
- Respect `prefers-reduced-motion` in every animation.
- Tests: add tests alongside the feature, not at the end. Run `npm run check`, `npm run lint`, `npm test` before closing a phase.
- Do not add features outside the phase. Park ideas in the "Parking lot" below.
- Copy voice: lowercase, deadpan, a little sad, never mean. See [../04-design.md](../04-design.md).

## Decision log

Append newest at the bottom: date, phase, decision, reason.

| Date | Phase | Decision | Reason |
|---|---|---|---|
| 2026-09-26 | Planning | App named Insomnia | Owner choice, fits the late-night rainy mood |
| 2026-09-26 | Planning | Vercel project and Neon DB created by owner via Vercel Storage; env pulled to `.env.local` | Phase 0 links to them, does not recreate |
| 2026-09-26 | Planning | Ignore the `NEON_AUTH_*` and `VITE_NEON_AUTH_URL` vars, keep hand-rolled auth | Neon Auth was provisioned by the integration but the plan owns its sessions and schema. Consider disabling it in Neon |
| 2026-09-26 | Planning | Never add co-author trailers to commits | Owner rule, recorded in CLAUDE.md |
| 2026-09-26 | 0 | Playwright runs against the dev server on Pixel 5 emulation | adapter-vercel build needs symlinks, which fail on Windows without Developer Mode; webkit not installed |
| 2026-09-26 | 0 | Closed phase 0 with phone frame rate and preview deploy unverified | Owner will check the phone later; looks good on desktop. Deploy needs the Vercel CLI or a git push |
| 2026-09-26 | 0 | Lightened `--text-dim` to `#9296a0`, capped cloud alpha at 0.3 | Secondary text failed AA over the brightest cloud state |
| 2026-09-26 | 1 | Curriculum is read from the database, not the source files | One source of truth once progress rows reference stop and criterion ids |
| 2026-09-26 | 1 | Criteria are archived, not deleted, when removed from source | Users tick criteria by id, so ids must survive edits |
| 2026-09-26 | 1 | Resources are search links for now | Never rot, never point at unvetted content. Curate later |
| 2026-09-26 | 1 | Cross-region links are only drawn for the open stop | Songs link to skills all over, drawing them all makes the map unreadable |
| 2026-09-26 | 1 | `/` is the public map preview, the redirect to `/map` is gone | Seed of the phase 4 landing page |
| 2026-09-26 | 1 | Closed phase 1 with phone smoothness and preview deploy unverified | Owner closed the phase, will check the phone and deploy later |
| 2026-09-26 | 2 | Everything under the `(app)` route group is guarded in `hooks.server.ts` | Covers pages, loads, actions and endpoints, so no private route can forget the check |
| 2026-09-26 | 2 | `/map` and stop pages now need an account, `/` stays public | Matches the route sketch. Guest mode is still out of v1 |
| 2026-09-26 | 2 | Rate limiter falls back to in-memory when Upstash is not configured (was fail open) | Still limits locally and in tests. Best effort on serverless, so set Upstash in production |
| 2026-09-26 | 2 | Verify and reset links show a button, the token is spent by a POST | Mail scanners that prefetch links cannot burn single-use tokens |
| 2026-09-26 | 2 | Password reset only emails verified addresses | Per the edge-case table. An unverified account that forgets its password has no self-serve path |
| 2026-09-26 | 2 | Sign-up reveals that an email is already registered | Core use is not blocked on verification, so hiding it is not possible. Rate limited per IP |
| 2026-09-26 | 2 | Resend called over HTTP, no SDK. `AUTH_SECRET` dropped | Tokens are random and hashed, nothing is signed, so no secret is needed |
| 2026-09-26 | 2 | Changing email unverifies it, notifies the old address, and voids pending links | Stops a stolen session quietly moving the account |
| 2026-09-26 | 2 | Closed phase 2 with real emails on a phone and preview deploy unverified | Owner will do them in the final clean-up phase |

| 2026-09-26 | 3 | Level 1 (Learning) means a progress row exists, and any tick, session, note or best tempo creates it | No row stays Unseen, and there is no separate "started" flag to drift |
| 2026-09-26 | 3 | Ticking a criterion counts as practice, unticking does not | The design's "re-check" clears rust, and undoing a tick should not fake a practice |
| 2026-09-26 | 3 | Rust starts on whole day 21, 45, 90 from the last practice | First rusting day is the threshold day itself, boundary tested |
| 2026-09-26 | 3 | Rusting stops count 60% towards progress, and the sky is fully clear at 50% overall progress | Rust has to push the sky back in both directions, and a full map at Mastered is not realistic. Both are in `config.ts` to tune |
| 2026-09-26 | 3 | A region is cleared when every stop is Solid or better | Mastered everywhere would rarely happen. Tune after real use |
| 2026-09-26 | 3 | Session days come from a `tz` cookie, stored as a local date on each session | Streaks need the player's day, and the account has no timezone. Falls back to UTC until the cookie exists |
| 2026-09-26 | 3 | Progress writes are JSON endpoints with optimistic updates, not form actions | The level has to change the instant a box is ticked. Writes are queued in order |
| 2026-09-26 | 3 | The e2e `signedIn` fixture plants a session instead of using the form | The suite was tripping the sign-in rate limit |
| 2026-09-26 | 3 | Phase 3 code closed, real-use exit criteria left open | Two weeks of use cannot happen in a build session. Tune thresholds and log what felt wrong here after |

## Parking lot

Ideas that came up but belong to a later phase or v1.5. Append only.

- Hand-tuned, less grid-like map layout (phase 1 generates a grid).
- Toggle to show all cross-region links on the map.
- Curated resource links to replace the search links.
- Edit or delete a logged session, and a settings control for the weekly target.
- Rate limits on the progress and practice endpoints (phase 5 abuse controls).
- Phase 3 open items: two weeks of real use, tune `src/lib/progress/config.ts`, eyeball the sky moving both ways on a phone, preview deploy.
- Clean-up phase loose ends: phone perf check of map (phase 0, 1), preview deploy and cookie `secure` check, Resend setup and real emails on a phone, Upstash for production, disable Neon Auth, curate resource links.

## Phase handoff summary

Each finished phase adds two or three lines here: what exists now, where the key code lives, anything the next session must know.

- Phase 0 (done, owner deferred phone perf check and preview deploy): scaffold, tokens, UI kit, weather background, tab bar shell. See the handoff notes in [01-phase-0-foundations.md](01-phase-0-foundations.md). Weather store is `src/lib/weather.svelte.ts`, Sheet is `src/lib/components/Sheet.svelte`.
- Phase 1 (done, owner deferred phone check and preview deploy): curriculum in `src/lib/curriculum/` (62 stops, seeded to Neon), map/list/stop sheet under `src/routes/(app)/map/`, public preview at `/`. `MapView` takes a `states` record, phase 3 feeds it real progress via `src/lib/map-state.svelte.ts`. See handoff notes in [02-phase-1-curriculum-and-map.md](02-phase-1-curriculum-and-map.md).
- Phase 2 (done, owner deferred real emails on a phone and preview deploy): accounts in `src/lib/server/auth/`, session in `locals.user` and `locals.session`, `(app)` routes guarded by the hook, pages in `(auth)` and `(app)/me`. Private data goes through `src/lib/server/data/` (`userId` first), add new user-owned tables to `PRIVATE_TABLES` in `eslint.config.js` and to `exportUserData`. See handoff notes in [03-phase-2-accounts.md](03-phase-2-accounts.md).
- Phase 3 (code complete, real-use exit criteria open): pure logic in `src/lib/progress/` with all tuning in `config.ts`, tables in `db/schema/progress.ts`, scoped access in `src/lib/server/data/progress.ts` and `practice.ts`, client state in `ProgressStore` (a context). Practice and log tabs are real, the map shows real state, rust, what next and level-up moments. See handoff notes in [04-phase-3-core-loop.md](04-phase-3-core-loop.md).
