import type { Level } from '$lib/curriculum/model';

/** One row of the user's own progress on a stop. No row means Unseen. */
export interface StopProgress {
	stopId: number;
	level: Level;
	/** ISO timestamp of the last practice or criterion tick, or null. */
	lastPracticedAt: string | null;
	/** ISO timestamp of the last change to the row. */
	updatedAt: string;
	bestBpm: number | null;
	notes: string;
}

/** Everything the client needs to draw the user's map. */
export interface ProgressSnapshot {
	stops: StopProgress[];
	/** Ids of the criteria the user has ticked. */
	criteriaDone: number[];
}

export type Feel = 'sloppy' | 'clean' | 'breakthrough';
export const FEELS: Feel[] = ['sloppy', 'clean', 'breakthrough'];

export interface SessionStop {
	stopId: number;
	bpm: number | null;
}

export interface PracticeSession {
	id: string;
	/** Local calendar date the session counts for, YYYY-MM-DD. */
	practicedOn: string;
	createdAt: string;
	minutes: number;
	feel: Feel;
	note: string;
	stops: SessionStop[];
}

/** A moment worth marking, decided on the server when a level changes. */
export type Milestone =
	| { kind: 'first-mastered'; stop: string }
	| { kind: 'region-cleared'; region: string };
