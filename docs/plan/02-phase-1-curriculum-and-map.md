# Phase 1: Curriculum and Map

Goal: the shared curriculum exists as data, and the map, list view, and stop detail are browsable and look the part. No accounts, no progress yet.

Prerequisites: Phase 0 Done.
Read first: [../02-skill-map.md](../02-skill-map.md), [../05-architecture.md](../05-architecture.md), [../04-design.md](../04-design.md).

## Checklist

### Schema and seed
- [x] Drizzle tables: `regions`, `stops`, `stop_links`, `criteria`, `resources` (see architecture doc). Include `archived_at` on stops and stable slugs.
- [x] Curriculum source files in `src/lib/curriculum/` (TypeScript or JSON), one file per region, validated with Zod.
- [x] Seed script `scripts/seed.ts`, idempotent (upsert by slug), never deletes, archives removed stops.
- [x] Author the first draft curriculum: about 60 stops across the 7 regions, each with a summary, criteria for levels 2, 3, 4, at least one resource link, and target bpm where relevant.
- [x] Author 8 to 10 starter songs as stops with `kind = song` linked to the skills they need.
- [x] Layout coordinates for regions and stops (hand-placed or generated once by a script, then committed).
- [x] Unit tests: schema validation rejects broken links, missing criteria levels, duplicate slugs.

### Read layer
- [x] Server loaders for curriculum (cached, since it is shared and read-only).
- [x] Typed curriculum model shared between server and client.

### Map view
- [x] SVG map in a pan/zoom container: drag to pan, pinch to zoom, wheel zoom on desktop, +/- and reset buttons.
- [x] Regions as districts, stops as nodes, links as thin hand-cut style lines.
- [x] Stop visual states per [../04-design.md](../04-design.md), driven by a placeholder state (all Unseen for now, plus a dev toggle to preview every state including Rusting).
- [x] Hit areas larger than the drawn node, tap opens the detail sheet.
- [x] Default zoomed-out region view on mobile, tap a region to zoom in.

### List view
- [x] Equal alternative to the map, grouped by region, filter by region and state, search by name.
- [x] Full screen reader labels ("Barre chords, region Chords, level 0 of 4").

### Stop detail sheet
- [x] Summary, criteria per level (read-only for now), target bpm, `helps` and `unlocks` links (tap to jump), resources, empty notes area stub.
- [x] Deep-linkable route `/map/[stop]`.

### Landing preview
- [x] Public read-only map preview at `/` (this is the seed of the landing page, no sign-up needed).

## Exit criteria

- [x] All seven regions and about 60 stops render, every link resolves, every stop opens.
- [ ] Map is smooth to pan and zoom on the author's phone. (Deferred by owner: phone check to follow.)
- [x] Every stop reachable by keyboard and screen reader through the list view.
- [x] Seed script can be run twice with no changes and no errors.
- [x] Checks, lint, tests pass.
- [ ] Preview deployed. (Deferred by owner: no Vercel CLI here, same as phase 0. Push or `vercel deploy`, and run `npm run db:seed` against the preview database first if it is not the shared one.)

## Handoff notes

- **Curriculum source**: one file per region in [src/lib/curriculum/regions/](../../src/lib/curriculum/regions/), assembled in `sources.ts`. 7 regions, 52 skills, 10 songs (62 stops), 189 criteria, 122 links. Helpers in `author.ts`.
- **Add a stop**: add a `stop(slug, name, summary, [playable, solid, mastered], resources, { bpm, helpedBy, unlockedBy })` to a region file, run `npm run curriculum:layout` (regenerates `layout.json`, commit it), then `npm run db:seed`. `helpedBy` / `unlockedBy` list the stops that make this one easier, so a song lists the skills it needs. Slugs are permanent: they are how progress finds a stop. Remove a stop by deleting it from the file, the seed archives it.
- **Validation**: `schema.ts` (Zod plus cross checks: unique slugs, links resolve, no self links, no cycles, every level has criteria, https resources, layout coverage). `curriculum.test.ts` also fails if `layout.json` drifts from what the script would generate.
- **DB and seed**: tables in [schema/curriculum.ts](../../src/lib/server/db/schema/curriculum.ts), migration `0000` applied to the shared Neon database, seeded twice with identical output. Criteria and stops are archived (`archived_at`), never deleted, because phase 3 progress rows reference their ids. Links and resources are rebuilt on each run, nothing references them. Seed uses the unpooled URL and a transaction.
- **Read layer**: [src/lib/server/curriculum.ts](../../src/lib/server/curriculum.ts) `loadCurriculum()` reads the DB, drops archived stops, caches 5 minutes. Client and server share [src/lib/curriculum/model.ts](../../src/lib/curriculum/model.ts) (`CurriculumData`, `indexCurriculum`, `describeStop`, `StopState`).
- **Map**: `MapView.svelte` props are `index` (from `indexCurriculum`), `states` (record of slug to `{ level, rusting }`, missing means Unseen), `selected`, `query`. Below zoom 0.55 it is an overview and regions are the tap targets, above that stops are links to `/map/[stop]`. Pan/zoom math is in `src/lib/map/viewport.ts` (tested). `StopGlyph.svelte` draws the six states, songs are diamonds.
- **Feeding state in phase 3**: replace `mapState.for(data)` in [src/lib/map-state.svelte.ts](../../src/lib/map-state.svelte.ts) with real progress, everything downstream already takes `states`. The dev checkbox on `/map` previews every state.
- **Routes**: the `(app)/map` layout holds header, map or list (`?view=list`) and the shared context, so panning survives opening a stop. `[stop]` renders the sheet and closing returns to the map or list. `/` is now the public map preview, no redirect.
- **Resources are search links** (youtube, ultimate guitar, wikipedia), so none can rot or be wrong. Curate real ones later, the shape does not change.

Not done, needs the owner:
- Phone smoothness of pan and zoom is not measured. Run `npm run dev -- --host` and try it. Likely levers: fewer link paths, drop the stop labels while moving.
- No preview deploy (see exit criteria).
- Cross-region links (mostly songs to skills) are only drawn for the open stop, to keep the map readable. Say if you would rather see them all.
- Layout is a plain 3-column grid per region, ordered by link depth. It reads fine but is not artful, and links cross. Hand-tune `layout.json` coordinates if wanted (the drift test will complain, so change `layout.ts` or drop that test).
