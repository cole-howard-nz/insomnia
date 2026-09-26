# Phase 4: Evidence and Polish

Goal: real visual confirmation of improvement, a welcoming first run, and the app is safe to show strangers.

Prerequisites: Phase 3 Done.
Read first: [../01-features.md](../01-features.md), [../03-accounts-and-auth.md](../03-accounts-and-auth.md), [../04-design.md](../04-design.md).

## Checklist

### Evidence
- [ ] Table `evidence`, private object storage (Vercel Blob or S3 compatible), never public URLs.
- [ ] Upload on a stop or at level-up: audio, video, or note. Client-side size and length check, server-side enforcement (200 MB per user, 2 minute clips).
- [ ] Authenticated download or short-lived signed URLs only, ownership check on every request.
- [ ] Gated on verified email.
- [ ] Record in the browser (MediaRecorder) with a file picker fallback.
- [ ] Per-stop timeline: level events and evidence in order, "day 1 versus day 60" playback.
- [ ] Delete evidence, and account deletion now removes files. Export includes files as a zip.
- [ ] Isolation tests cover evidence access.

### Onboarding
- [ ] Three skippable screens: experience, what you are chasing, weekly target.
- [ ] Seeds the map with suggested Learning or Playable stops for the user to confirm, never silently Mastered.
- [ ] Never leaves a new user on an empty all-dark map.

### Landing and legal
- [ ] Real landing page: atmosphere, one-line pitch, map preview, sign up.
- [ ] Privacy page in plain language: what is stored, where, deletion.
- [ ] Terms page (short).

### Polish
- [ ] Milestone animations finished (region cleared, first mastered, hours logged), restrained.
- [ ] Empty, loading, and error states everywhere, in the app voice.
- [ ] Accessibility pass: keyboard through the whole app, screen reader labels on the map, focus order, contrast in every weather state.
- [ ] Performance pass on a mid-range phone, tune the cloud shader and rain counts, battery-aware pausing.
- [ ] Optional rain ambience toggle, off by default.
- [ ] PWA manifest and icons so it can be installed (offline support stays v1.5).

## Exit criteria

- [ ] A new user can sign up, onboard, level a stop, log practice, and attach evidence with no dead ends.
- [ ] Lighthouse mobile: accessibility 95 or above, performance acceptable on the author's phone.
- [ ] Storage limits enforced and tested.
- [ ] Checks, lint, tests pass. Preview deployed.

## Handoff notes

(fill in at end: storage setup, limits config, onboarding seeding rules, remaining known issues)
