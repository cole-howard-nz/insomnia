import type { CurriculumData, StopState } from '$lib/curriculum/model';
import { stopState } from './logic';
import type { Milestone, ProgressSnapshot } from './model';
import { summarise } from './summary';

export interface Derived {
	/** State of every stop that has a progress row. Others are Unseen. */
	states: Record<string, StopState>;
	/** Last practice (or tick) per stop slug. Rust runs off this. */
	practiced: Record<string, string | undefined>;
	/** Last change per stop slug, for "what were you on lately". */
	touched: Record<string, string | undefined>;
}

/** Turns the raw rows into what the map, the sky and the suggestions read. */
export function derive(data: CurriculumData, snapshot: ProgressSnapshot, now: number): Derived {
	const slugById = new Map(data.stops.map((s) => [s.id, s.slug]));
	const out: Derived = { states: {}, practiced: {}, touched: {} };
	for (const row of snapshot.stops) {
		const slug = slugById.get(row.stopId);
		if (!slug) continue; // archived stop, kept in the database but off the map
		out.states[slug] = stopState(row, now);
		out.practiced[slug] = row.lastPracticedAt ?? undefined;
		out.touched[slug] = row.lastPracticedAt ?? row.updatedAt;
	}
	return out;
}

/** What is worth marking now that a stop moved from `before` to `after`. */
export function detectMilestones(
	data: CurriculumData,
	before: Record<string, StopState>,
	after: Record<string, StopState>,
	stopSlug: string,
	firstMastered: boolean
): Milestone[] {
	const out: Milestone[] = [];
	if (firstMastered) out.push({ kind: 'first-mastered', stop: stopSlug });
	const was = new Set(summarise(data, before).cleared);
	for (const region of summarise(data, after).cleared) {
		if (!was.has(region)) out.push({ kind: 'region-cleared', region });
	}
	return out;
}
