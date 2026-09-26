import type { StopState } from '$lib/curriculum/model';

/**
 * A made-up map for the landing page, so a visitor sees what a few weeks in looks like:
 * some stops lit, one going quiet. Stops that are not here stay Unseen. Not anyone's data.
 */
export const DEMO_STATES: Record<string, StopState> = {
	'posture-and-hold': { level: 4, rusting: false },
	tuning: { level: 3, rusting: false },
	'holding-a-pick': { level: 3, rusting: false },
	'fretting-basics': { level: 3, rusting: false },
	'reading-chord-diagrams': { level: 2, rusting: false },
	'open-chords-em-am': { level: 3, rusting: false },
	'open-chords-cgd': { level: 2, rusting: false },
	'chord-changes': { level: 2, rusting: true },
	'downstroke-strumming': { level: 2, rusting: false },
	'strumming-patterns': { level: 1, rusting: false },
	'power-chords': { level: 1, rusting: false }
};
