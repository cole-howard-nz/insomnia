# Roadmap and open questions

## Milestones

**M0: Foundations**
- Name decided, repo scaffolded (SvelteKit, Tailwind, Drizzle, Neon).
- Design tokens, fonts, and the ported rain plus cloud background running on a real phone.
- Exit: an empty page that already feels right, at 60fps on the author's phone.

**M1: Curriculum and map (no accounts yet)**
- Curriculum schema, seed script, first draft of the base curriculum (aim for about 60 stops across the 7 regions, enough to feel like a world).
- Map view with pan/zoom, stop states, detail sheet, list view.
- Exit: the map is browsable and looks the part.

**M2: Accounts**
- Sign up, sign in, sessions, verification, reset, rate limits, account settings, export and delete.
- Per-user progress storage behind the scoped data-access layer, with cross-user access tests.
- Exit: two test users cannot see or alter each other's data (proven by tests).

**M3: The core loop**
- Levels and criteria ticking, practice log, level events, rust computation, "What next?".
- Weather driven by progress.
- Exit: the author uses it for real for two weeks.

**M4: Evidence and polish**
- Recording and note attachments, per-stop timeline, milestone animations, onboarding, landing page, privacy page.
- Exit: safe to show strangers.

**M5: Public launch**
- Deploy, monitoring, backups, abuse controls, feedback channel.

Then v1.5 items from [01-features.md](01-features.md).

## Open questions

Decisions that change the build. Recommendation in bold where I have one.

1. **Name.** Decided: Insomnia, see [00-overview.md](00-overview.md). Still needs a domain, handle, and collision check since the word is common.
2. **Auth: hand-rolled or Better Auth?** **Hand-rolled for M2 if it stays close to munkeware's code (fast to port, you already trust it), Better Auth if you want Google and passkeys soon.** Either way the data-access scoping rule does not change.
3. **Guest mode?** **Skip in v1.** Show a read-only map preview on the landing page instead, and avoid building a local-to-account merge.
4. **Email verification blocking?** **Do not block core use, gate only uploads and reminders.**
5. **Who writes the curriculum?** You, from your own knowledge, then refined by use. Needs a source list of good free resources per stop, and a decision on whether to link only (recommended, avoids copyright and hosting) or embed.
6. **Rust durations.** Suggested starting point: Playable rusts after 21 days, Solid after 45, Mastered after 90. Tune from real use.
7. **Recording storage cost and limits.** Cap per-user storage (e.g. 200 MB) and clip length (e.g. 2 minutes) to keep hosting cheap on a public deployment.
8. **Cloud shader on mobile.** Unknown cost until tested on the author's phone. If it janks, fall back to layered CSS/SVG clouds with slow drift.
9. **Guitar-only or multi-instrument long term?** Guitar-only for now, but keep the word "guitar" out of table and route names where free to do so.
10. **Open source or private?** Affects license choice, secret hygiene, and whether the curriculum is public.

## Risks

| Risk | Mitigation |
|---|---|
| Curriculum authoring is the real bulk of work | Start at about 60 stops, ship, grow by use |
| Self-reported progress can be gamed | Only the user is harmed, evidence and timeline exist to keep yourself honest |
| Atmosphere hurts performance and battery | Reduced-motion, half-res shader, pause when hidden, static fallback |
| Scope creep into a lessons platform | Non-goals list in overview, link out instead |
| Public deployment invites abuse | Rate limits, verification, storage caps, no public user content in v1 |
