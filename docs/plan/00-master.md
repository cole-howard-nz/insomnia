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
| 0 | [01-phase-0-foundations.md](01-phase-0-foundations.md) | Scaffold, design system, weather background on a phone | Not started |
| 1 | [02-phase-1-curriculum-and-map.md](02-phase-1-curriculum-and-map.md) | Curriculum data, map, list view, stop detail (no accounts) | Not started |
| 2 | [03-phase-2-accounts.md](03-phase-2-accounts.md) | Authentication and account management | Not started |
| 3 | [04-phase-3-core-loop.md](04-phase-3-core-loop.md) | Progress, criteria, practice log, rust, what next, weather | Not started |
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

## Parking lot

Ideas that came up but belong to a later phase or v1.5. Append only.

-

## Phase handoff summary

Each finished phase adds two or three lines here: what exists now, where the key code lives, anything the next session must know.

-
