import type { EvidenceItem, LevelEventItem } from './types';

// The per-stop timeline: level changes and evidence in one list, oldest first, each with
// its day number counted from the first thing that happened on the stop. Pure, so the
// "day 1 versus day 60" wording is unit tested.

export type TimelineEntry =
	| { type: 'level'; at: string; day: number; event: LevelEventItem }
	| { type: 'evidence'; at: string; day: number; item: EvidenceItem };

const DAY = 86_400_000;

/** Whole days between two instants, by calendar day in the viewer's timezone. */
export function dayNumber(fromIso: string, atIso: string): number {
	const start = new Date(fromIso);
	const end = new Date(atIso);
	const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
	const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
	return Math.round((b - a) / DAY) + 1;
}

export function buildTimeline(levels: LevelEventItem[], items: EvidenceItem[]): TimelineEntry[] {
	const merged = [
		...levels.map((event) => ({ type: 'level' as const, at: event.createdAt, event })),
		...items.map((item) => ({ type: 'evidence' as const, at: item.createdAt, item }))
	].sort((x, y) => x.at.localeCompare(y.at));
	const first = merged[0]?.at;
	return merged.map((entry) => ({ ...entry, day: first ? dayNumber(first, entry.at) : 1 }));
}

/** Only recordings can be played side by side. */
export const recordings = (items: EvidenceItem[]) => items.filter((i) => i.kind !== 'note');

/** "Day 1 versus day 60": the first and the latest recording, or null with fewer than two. */
export function defaultCompare(items: EvidenceItem[]): [EvidenceItem, EvidenceItem] | null {
	const clips = recordings(items);
	return clips.length < 2 ? null : [clips[0], clips[clips.length - 1]];
}

/** "day 1", "day 60". The day is counted from the stop's first entry. */
export const dayLabel = (day: number) => `day ${day}`;
