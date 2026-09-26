# Overview

## Name: Insomnia

Chosen by the owner. It carries the late-night, can't-sleep, playing-quietly-at-2am mood, which pairs with the rain and cloud atmosphere. It says nothing about guitar on its own, so the tagline and UI carry that.

Tagline candidates: "learn guitar in the small hours", "map your way out of the rain", "can't sleep, might as well play".

Design implications: the palette and copy lean late night as well as rainy (dim streetlight amber, a 2am clock feel, "still up?" voice). See [04-design.md](04-design.md).

Before committing: "Insomnia" is a very common word (existing apps, an API client named Insomnia). Check the domain, the npm/GitHub name, and app store collisions. Fallback plan is a qualified name such as "Insomnia Fretboard" or a domain like getinsomnia or insomnia.guitar.

Names considered and passed over: Fret Weather, Nocturne, Fretfall, Basement Show, Half Step.

## The problem

Motivation is not the issue. Direction is. Practice collapses into replaying what is already known because there is no visible map of what to learn next, no proof of improvement, and no reason to return to a skill once it feels "done".

## What this app must do

1. **Show progress.** At any moment you can see what you have learned, what you are learning, and what is untouched.
2. **Make you actually better.** Every stop on the map has concrete, checkable criteria (play X at Y bpm, clean, 3 times in a row), not vague "learn barre chords".
3. **Give visual confirmation.** Progress changes how the app looks, not just a number.

## Core idea in one paragraph

A **map of stops** (skills), grouped into regions (chords, rhythm, lead, theory, tone, songs). Stops are connected by soft "this helps" links, never hard locks, so you can wander: learn a stop, jump elsewhere, return later. Each stop has a **mastery level** you raise by hitting concrete criteria. Time and neglect slowly cloud a stop over again, which pulls you back to revisit it. The environment (rain, clouds, light) reflects overall and per-region progress.

## Audience

- Primary: the author, a self-motivated beginner or intermediate player who stalls in a comfort loop.
- Secondary: anyone else who signs up. The app is a public multi-user product, so every user has their own private progress on top of a shared curriculum.

## Non-goals (v1)

- Not a lesson platform. It does not teach in depth, it links out to good free resources per stop.
- No audio analysis or "listen and grade me" in v1. Progress is self-reported with evidence (see features).
- No social feed, leaderboards, or public profiles in v1.
- No native app. It is a mobile-first web app, installable as a PWA.

## Document index

- [01-features.md](01-features.md): feature list, phased
- [02-skill-map.md](02-skill-map.md): how the pathway and mastery model work
- [03-accounts-and-auth.md](03-accounts-and-auth.md): per-user experience and authentication
- [04-design.md](04-design.md): visual language, borrowed from munkeware
- [05-architecture.md](05-architecture.md): proposed stack and data model
- [06-roadmap-and-open-questions.md](06-roadmap-and-open-questions.md): milestones and decisions still needed
