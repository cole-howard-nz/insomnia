# Phase 1: Curriculum and Map

Goal: the shared curriculum exists as data, and the map, list view, and stop detail are browsable and look the part. No accounts, no progress yet.

Prerequisites: Phase 0 Done.
Read first: [../02-skill-map.md](../02-skill-map.md), [../05-architecture.md](../05-architecture.md), [../04-design.md](../04-design.md).

## Checklist

### Schema and seed
- [ ] Drizzle tables: `regions`, `stops`, `stop_links`, `criteria`, `resources` (see architecture doc). Include `archived_at` on stops and stable slugs.
- [ ] Curriculum source files in `src/lib/curriculum/` (TypeScript or JSON), one file per region, validated with Zod.
- [ ] Seed script `scripts/seed.ts`, idempotent (upsert by slug), never deletes, archives removed stops.
- [ ] Author the first draft curriculum: about 60 stops across the 7 regions, each with a summary, criteria for levels 2, 3, 4, at least one resource link, and target bpm where relevant.
- [ ] Author 8 to 10 starter songs as stops with `kind = song` linked to the skills they need.
- [ ] Layout coordinates for regions and stops (hand-placed or generated once by a script, then committed).
- [ ] Unit tests: schema validation rejects broken links, missing criteria levels, duplicate slugs.

### Read layer
- [ ] Server loaders for curriculum (cached, since it is shared and read-only).
- [ ] Typed curriculum model shared between server and client.

### Map view
- [ ] SVG map in a pan/zoom container: drag to pan, pinch to zoom, wheel zoom on desktop, +/- and reset buttons.
- [ ] Regions as districts, stops as nodes, links as thin hand-cut style lines.
- [ ] Stop visual states per [../04-design.md](../04-design.md), driven by a placeholder state (all Unseen for now, plus a dev toggle to preview every state including Rusting).
- [ ] Hit areas larger than the drawn node, tap opens the detail sheet.
- [ ] Default zoomed-out region view on mobile, tap a region to zoom in.

### List view
- [ ] Equal alternative to the map, grouped by region, filter by region and state, search by name.
- [ ] Full screen reader labels ("Barre chords, region Chords, level 0 of 4").

### Stop detail sheet
- [ ] Summary, criteria per level (read-only for now), target bpm, `helps` and `unlocks` links (tap to jump), resources, empty notes area stub.
- [ ] Deep-linkable route `/map/[stop]`.

### Landing preview
- [ ] Public read-only map preview at `/` (this is the seed of the landing page, no sign-up needed).

## Exit criteria

- [ ] All seven regions and about 60 stops render, every link resolves, every stop opens.
- [ ] Map is smooth to pan and zoom on the author's phone.
- [ ] Every stop reachable by keyboard and screen reader through the list view.
- [ ] Seed script can be run twice with no changes and no errors.
- [ ] Checks, lint, tests pass. Preview deployed.

## Handoff notes

(fill in at end: where curriculum files live, how to add a stop, the map component API, how state is fed into nodes)
