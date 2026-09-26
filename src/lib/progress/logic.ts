import type { CriterionModel, Level, StopState } from '$lib/curriculum/model';
import { CLEARED_LEVEL, RUST_DAYS, RUST_WEIGHT, SKY_CLEAR_AT } from './config';

const DAY_MS = 86_400_000;

/**
 * The level a stop is at, from the criteria ticked.
 * Level N needs every criterion for N and every lower level. A level with no
 * criteria cannot be reached. `started` is Learning: the user has touched the stop.
 */
export function calcLevel(
	criteria: readonly CriterionModel[],
	done: ReadonlySet<number>,
	started: boolean
): Level {
	let level: Level = started ? 1 : 0;
	for (const n of [2, 3, 4] as const) {
		const needed = criteria.filter((c) => c.level === n);
		if (needed.length === 0 || !needed.every((c) => done.has(c.id))) break;
		level = n;
	}
	return level;
}

/** Whole days since a timestamp, never negative. */
export function daysSince(iso: string, now: number): number {
	return Math.max(0, Math.floor((now - Date.parse(iso)) / DAY_MS));
}

/** Days without practice that make this level start to rust. Unseen and Learning never do. */
export function rustThreshold(level: Level): number | null {
	return level >= 2 ? RUST_DAYS[level as 2 | 3 | 4] : null;
}

/**
 * Rust is computed when read and never stored. A stop rusts once it has gone
 * the threshold's worth of whole days without practice, so day 21 is the first
 * rusting day for Playable.
 */
export function isRusting(level: Level, lastPracticedAt: string | null, now: number): boolean {
	const threshold = rustThreshold(level);
	if (threshold === null || lastPracticedAt === null) return false;
	return daysSince(lastPracticedAt, now) >= threshold;
}

/** Whole days past the rust threshold, 0 when not rusting. Used to rank the most overdue. */
export function overdueDays(level: Level, lastPracticedAt: string | null, now: number): number {
	const threshold = rustThreshold(level);
	if (threshold === null || lastPracticedAt === null) return 0;
	return Math.max(0, daysSince(lastPracticedAt, now) - threshold);
}

export function stopState(
	progress: { level: Level; lastPracticedAt: string | null } | undefined,
	now: number
): StopState {
	if (!progress) return { level: 0, rusting: false };
	return {
		level: progress.level,
		rusting: isRusting(progress.level, progress.lastPracticedAt, now)
	};
}

/** How far along one stop is, 0..1. Rust weighs it down. */
export function stopValue(state: StopState): number {
	return (state.level / 4) * (state.rusting ? RUST_WEIGHT : 1);
}

/** Mean progress of a group of stops, 0..1. An empty group is 0. */
export function meanProgress(states: readonly StopState[]): number {
	if (states.length === 0) return 0;
	return states.reduce((sum, s) => sum + stopValue(s), 0) / states.length;
}

/** The sky value the weather runs on: progress stretched so a half-mastered map is clear. */
export function skyValue(progress: number): number {
	return Math.min(1, Math.max(0, progress / SKY_CLEAR_AT));
}

export function isCleared(states: readonly StopState[]): boolean {
	return states.length > 0 && states.every((s) => s.level >= CLEARED_LEVEL);
}
