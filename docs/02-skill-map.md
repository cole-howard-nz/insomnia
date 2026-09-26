# Skill Map: how the pathway works

## Vocabulary

- **Stop**: one learnable skill or song. The unit on the map.
- **Region**: a cluster of related stops (e.g. Rhythm).
- **Link**: a soft relationship between two stops. Two kinds: `helps` (learning A makes B easier) and `unlocks` (B is much more natural after A). Neither blocks anything.
- **Level**: how well the user has learned a stop.
- **Criteria**: concrete checkable requirements attached to each level of a stop.

## Not a ladder, a map

The map is a graph, not a list. Rules:

1. Nothing is locked. Every stop can be opened and worked on at any time.
2. Links only *suggest*. A stop with unmet `helps` links shows a small hint ("easier after Open Chords"), never a wall.
3. The user moves freely: work a stop to Playable, hop to another region, return later to push it to Solid.
4. Stops are meant to be revisited. Depth comes from going back, not from going forward.

## Levels

| Level | Name | Meaning |
|---|---|---|
| 0 | Unseen | Not started |
| 1 | Learning | Working on it, can't do it reliably |
| 2 | Playable | Can do it slowly and deliberately |
| 3 | Solid | Can do it at target tempo, mostly clean |
| 4 | Mastered | Can do it cleanly, on demand, in context (inside a song, cold, without warmup) |

Each stop defines criteria for levels 2, 3 and 4. Moving up requires ticking all criteria for that level. The user ticks them (self-report), with optional evidence attached. Moving down is allowed and never punished.

Example, stop **Barre Chords (F shape)**:
- Playable: form the shape, all six strings ring for one strum, 5 attempts out of 10.
- Solid: switch Am to F and back at 60 bpm, clean, 4 bars in a row.
- Mastered: play a full song that uses the F barre without stopping, twice, cold.

## Rust (the "come back to it" mechanic)

A stop that was Solid or Mastered and has not been practiced for a while begins to **cloud over**: a visual state layered on top of its level, not a level change.

- Only applies to level 2 and above. Unseen and Learning stops don't rust.
- Rust threshold scales with level (higher level takes longer to rust).
- Practicing the stop, even for a minute, clears it. The user can also "re-check" it by re-ticking the top criteria.
- This is the app's main defense against the comfort loop: it reveals which "known" things are quietly slipping and offers a reason to go back.

Exact durations are a tuning question, see [06-roadmap-and-open-questions.md](06-roadmap-and-open-questions.md).

## Regions (initial curriculum draft)

1. **Foundations**: posture, tuning, holding a pick, fretting hand basics, reading tab and chord diagrams, clean single notes.
2. **Chords**: open chords, chord changes, power chords, barre chords, sus/add chords (the twinkly midwest emo voicings), open-string ringing shapes.
3. **Rhythm**: strumming patterns, palm muting, timing with a metronome, syncopation, alternate picking on rhythm parts.
4. **Lead**: pentatonic boxes, bends, vibrato, slides, hammer-ons/pull-offs, tapping, licks, simple solos.
5. **Theory**: notes on the fretboard, major scale, intervals, chord construction, keys, CAGED, modes (later).
6. **Tone and Gear**: amp basics, gain staging, pedals (overdrive, delay, reverb), guitar setup, string changes.
7. **Songs**: real songs tagged with the stops they need. Ships with a starter set spanning easy to hard.

Twinkly emo picking, tapping, odd time signatures, and open tunings get their own stops since they are a core interest, not a niche.

## Curriculum ownership

- The **base curriculum** is authored by the app owner and is the same for every user (a shared, read-only dataset).
- **Progress** is per user and lives entirely in the user's own rows. Editing the base curriculum never deletes anyone's progress. Removed stops are archived, not dropped.
- v1.5 adds user-created **custom stops** that exist only on that user's map.

## Layout of the map

- Regions are placed as loose islands or districts, stops as points inside them, links drawn as thin lines.
- Layout coordinates are stored with the curriculum (hand-placed or generated once), not computed per client, so the map is stable between sessions and devices.
- On a phone, the default is the zoomed-out region view. Tapping a region zooms in. A list view exists as an equal alternative for accessibility and speed.

## "What next?" suggestion logic (v1, simple)

Pick up to three:
1. One **rusting** stop, the most overdue.
2. One **in-progress** stop (Learning or Playable) the user touched most recently.
3. One **fresh** stop from a region the user has explored least, preferring stops whose `helps` links are mostly met.

Purely rule-based, explainable ("because you haven't touched it in 24 days"), and easy to override.
