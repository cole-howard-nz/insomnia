# Phase 3: Core Loop

Goal: the app does its job. A user can level up stops, log practice, see rust, get a suggestion, and watch the weather change. The author uses it for real for two weeks.

Prerequisites: Phases 0, 1, 2 Done.
Read first: [../02-skill-map.md](../02-skill-map.md), [../01-features.md](../01-features.md), [../04-design.md](../04-design.md).

## Checklist

### Schema
- [x] Tables: `user_stop_progress`, `user_criteria_done`, `practice_sessions`, `practice_session_stops`, `level_events`. All carry `user_id`, all access through the scoped data layer.
- [x] Progress rows created lazily, no row means Unseen.

### Progress logic (pure, unit tested)
- [x] Level calculation from ticked criteria (level N requires all criteria for level N, and lower levels).
- [x] Rust computation from level, `last_practiced_at`, and thresholds (Playable 21, Solid 45, Mastered 90 days), computed at read time, never stored.
- [x] Overall and per-region progress value 0..1.
- [x] "What next?" rules: one rusting, one in progress, one fresh, each with a human-readable reason.
- [x] Streak calculation (weekly target aware, gentle).

### UI
- [x] Stop detail: tick criteria, level changes instantly, un-ticking allowed, per-stop notes, best bpm.
- [x] Map and list nodes now reflect real state, including Rusting.
- [x] Practice tab: start session, pick stops, timer, finish with minutes, feel, optional bpm and note. One-handed and glanceable.
- [x] Log tab: session history, filter by stop, streak and weekly summary.
- [x] "What next?" card on the map screen and after sign-in.
- [x] Level-up moment: a stop ignites (short, quiet, reduced-motion safe).

### Weather
- [x] Feed real progress into the weather store: global and per-region values.
- [x] Local rust cloud over a rusting stop on the map.
- [x] Smooth tween on change, never a hard cut.
- [x] Region cleared and first mastered stop milestone moments.

### Data export
- [x] Extend the export to include progress, criteria, sessions, level events.

### Tests
- [x] Unit tests for all pure logic above, including boundary days for rust.
- [x] Isolation tests extended to every new table and route.
- [x] One Playwright path: sign in, tick criteria, log a session, see the map change.

## Exit criteria

- [ ] The author has used it for real for two weeks and written down what felt wrong in the decision log (thresholds, suggestion quality, missing stops).
- [ ] Rust thresholds tuned from that use.
- [x] Weather tracks progress in both directions (unit tested: rust lowers the value, ticks and sessions raise it). Not yet eyeballed on a phone.
- [x] Isolation tests pass. Checks, lint, tests pass (124 unit and integration, 28 e2e).
- [ ] Preview deployed (owner deferred, as in phases 0 to 2).

## Handoff notes

**Status: code complete. The real-use exit criteria are still open** (two weeks of use, threshold tuning, preview deploy). Do those, write what felt wrong in the master decision log, then close the phase.

Where things live:
- Pure logic, all unit tested, in `src/lib/progress/`: `logic.ts` (level from criteria, rust, progress values), `suggest.ts` (what next), `streak.ts` (dates, streaks), `summary.ts` (overall and per-region), `snapshot.ts` (rows to states, milestone detection). **All tuning numbers are in `config.ts`**: rust days per level, cleared level, rust weight, and `SKY_CLEAR_AT` (progress at which the sky is fully clear).
- Tables in `src/lib/server/db/schema/progress.ts`, migration `drizzle/0002_progress.sql` (applied to the dev Neon). Access only through `src/lib/server/data/progress.ts` and `practice.ts`. The export includes all of it, by stop slug.
- Writes are JSON POSTs under `(app)`: `/progress/criteria`, `/progress/stop`, `/practice/log`. The client queues them in order (`src/lib/progress/api.ts`), and a failure reloads the data and toasts.
- Client state is `ProgressStore` (`src/lib/progress/store.svelte.ts`), a per-layout context, not a module singleton, so the server never shares it between requests. `(app)/+layout.server.ts` loads curriculum, progress, weekly target and the user's local date once for every tab. `(app)/+layout.svelte` builds the store and feeds the weather.
- Weather inputs: `store.summary.sky` (overall) and `store.summary.regions` (per region) go through `skyValue`. Rust weighs a stop at 60% so the sky closes back in. Moments are in `src/lib/celebrate.svelte.ts` and `Moment.svelte`.
- Timezone: the client sets a `tz` cookie, and the server turns it into the user's local date (`src/lib/server/today.ts`). Sessions store that date, so a 1am session counts for the night before.

How the rules landed (all tunable in `config.ts` or the pure modules):
- Level 1 (Learning) means a row exists: started, ticked something, put it in a session, or saved a note or best tempo. Un-ticking everything leaves it at Learning. Level N needs every criterion of N and below. A level with no criteria cannot be reached.
- Ticking counts as practice, so it clears rust (the "re-check"). Un-ticking does not.
- Rust starts on whole day 21, 45, 90 (not the day before), computed at read time from `last_practiced_at`.
- Cleared region: every stop at Solid or better. First mastered stop is judged from the user's level events.
- What next: most overdue rusting, most recently touched Learning or Playable, and a fresh stop from the least explored region (foundations first for a new user, then the one whose helpers are met). A new user gets one suggestion, not three.
- Streak: days practised this week against the weekly target (default 3, no UI to change it yet), a day streak that survives until today ends, and a week streak that an unfinished week never breaks.

Tuning changes made: none yet. That is the point of the two weeks.

Things the next session should know:
- The Playwright `signedIn` fixture now plants a session row instead of using the form, because the sign-in rate limit (20 a minute per IP) was tripped by the suite. The sign-in form has its own specs.
- No rate limits on the new endpoints yet. Phase 5 abuse controls should cover them.
- Sessions cannot be edited or deleted, and `weeklyTargetDays` has no settings UI. Both are parked.
