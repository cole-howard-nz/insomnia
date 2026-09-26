# Features

Phased so v1 is small enough to actually finish and use. Everything in v1 exists to serve the three goals: see progress, get better, visual confirmation.

## v1 (MVP)

### The map
- Full-screen, pannable, pinch-zoomable map of stops, grouped into regions.
- Each stop shows its state at a glance (see [02-skill-map.md](02-skill-map.md)): unseen, learning, playable, solid, mastered, and "clouding over" when neglected.
- Tap a stop to open its detail sheet (bottom sheet on mobile).
- A list view of the same stops for quick scanning, filtering by region or state.
- "What next?" button: suggests a small mix, e.g. one stop to push forward, one to revisit, one fresh. Directly attacks the comfort-loop problem.

### Stop detail
- What it is and why it matters, in a sentence or two.
- **Criteria checklist**: concrete, checkable goals per mastery level (e.g. "Change between G and C in under 2s, 5 times in a row").
- **Target tempo** where relevant, with your best logged tempo.
- Recommended prerequisites and "unlocks" as soft links (tap to jump).
- Curated links to free resources (video, tab, exercise). Author-maintained.
- Your own notes for that stop.

### Practice log
- Start a session, pick one or more stops, log minutes and a quick result ("felt clean / sloppy / breakthrough").
- Optional tempo entry per stop, which feeds the target-tempo tracker.
- Daily and weekly streak, gentle rather than guilt-driven.
- Session history, filterable by stop.

### Evidence (visual confirmation of real improvement)
- Attach a short recording or a note to a stop at a level-up ("Day 1" vs "Day 60").
- Timeline per stop showing level changes and evidence in order.
- Files stay private to the user.

### Progress and weather
- Per-region and overall progress meters.
- The environment reflects progress: heavy rain and thick cloud at the start, thinning as you climb, breaks of light at milestones. Details in [04-design.md](04-design.md).
- Milestone moments (region cleared, first mastered stop, 30 hours logged) get a short, restrained animation, not confetti.

### Accounts
- Sign up, sign in, sign out, password reset, delete account, export my data. See [03-accounts-and-auth.md](03-accounts-and-auth.md).

## v1.5

- **Songs as stops.** A song lists the skills it needs and lights up as you unlock those. Answers "what song can I play right now?" and "which skill gets me to that song?".
- **Goal pinning.** Pick a song or skill as a goal, the map highlights the shortest useful route as a suggestion only.
- **Custom stops.** Users add their own stops and songs to their personal map.
- **Reminders.** Optional web push: "the Barre Chords cloud is coming back".
- **PWA install** with offline read access to the map and the ability to log practice offline, synced later.
- Sign in with Google, magic-link login.

## Later / maybe

- Multiple instruments or tracks (bass, acoustic) reusing the same engine.
- Shareable read-only progress card (opt-in).
- Import/export a curriculum, so others can publish their own pathway.
- Built-in metronome and tuner.
- Passkeys.
- Audio-based tempo detection for evidence.

## Explicitly rejected

- **Hard-locked levels.** Contradicts the wander-and-return principle.
- **XP, coins, leaderboards.** The reward is a clearer sky and a better player, not points.
- **Guilt notifications.** Rusting stops are information, not punishment.
