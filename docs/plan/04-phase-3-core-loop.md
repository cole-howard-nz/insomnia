# Phase 3: Core Loop

Goal: the app does its job. A user can level up stops, log practice, see rust, get a suggestion, and watch the weather change. The author uses it for real for two weeks.

Prerequisites: Phases 0, 1, 2 Done.
Read first: [../02-skill-map.md](../02-skill-map.md), [../01-features.md](../01-features.md), [../04-design.md](../04-design.md).

## Checklist

### Schema
- [ ] Tables: `user_stop_progress`, `user_criteria_done`, `practice_sessions`, `practice_session_stops`, `level_events`. All carry `user_id`, all access through the scoped data layer.
- [ ] Progress rows created lazily, no row means Unseen.

### Progress logic (pure, unit tested)
- [ ] Level calculation from ticked criteria (level N requires all criteria for level N, and lower levels).
- [ ] Rust computation from level, `last_practiced_at`, and thresholds (Playable 21, Solid 45, Mastered 90 days), computed at read time, never stored.
- [ ] Overall and per-region progress value 0..1.
- [ ] "What next?" rules: one rusting, one in progress, one fresh, each with a human-readable reason.
- [ ] Streak calculation (weekly target aware, gentle).

### UI
- [ ] Stop detail: tick criteria, level changes instantly, un-ticking allowed, per-stop notes, best bpm.
- [ ] Map and list nodes now reflect real state, including Rusting.
- [ ] Practice tab: start session, pick stops, timer, finish with minutes, feel, optional bpm and note. One-handed and glanceable.
- [ ] Log tab: session history, filter by stop, streak and weekly summary.
- [ ] "What next?" card on the map screen and after sign-in.
- [ ] Level-up moment: a stop ignites (short, quiet, reduced-motion safe).

### Weather
- [ ] Feed real progress into the weather store: global and per-region values.
- [ ] Local rust cloud over a rusting stop on the map.
- [ ] Smooth tween on change, never a hard cut.
- [ ] Region cleared and first mastered stop milestone moments.

### Data export
- [ ] Extend the export to include progress, criteria, sessions, level events.

### Tests
- [ ] Unit tests for all pure logic above, including boundary days for rust.
- [ ] Isolation tests extended to every new table and route.
- [ ] One Playwright path: sign in, tick criteria, log a session, see the map change.

## Exit criteria

- [ ] The author has used it for real for two weeks and written down what felt wrong in the decision log (thresholds, suggestion quality, missing stops).
- [ ] Rust thresholds tuned from that use.
- [ ] Weather visibly and correctly tracks progress in both directions.
- [ ] Isolation tests pass. Checks, lint, tests pass. Preview deployed.

## Handoff notes

(fill in at end: progress logic module location, thresholds config, weather inputs, tuning changes made)
