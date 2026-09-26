import { describe, expect, it } from 'vitest';
import { buildTimeline, dayNumber, defaultCompare } from './timeline';
import type { EvidenceItem, LevelEventItem } from './types';

const clip = (
	id: string,
	createdAt: string,
	kind: EvidenceItem['kind'] = 'audio'
): EvidenceItem => ({
	id,
	stopId: 1,
	kind,
	levelAt: 1,
	note: '',
	mime: kind === 'note' ? null : 'audio/webm',
	bytes: 10,
	durationSeconds: 5,
	createdAt
});
const level = (toLevel: number, createdAt: string): LevelEventItem => ({
	fromLevel: toLevel - 1,
	toLevel,
	createdAt
});

describe('dayNumber', () => {
	it('starts at day 1 and counts calendar days', () => {
		expect(dayNumber('2026-03-01T10:00:00', '2026-03-01T23:59:00')).toBe(1);
		expect(dayNumber('2026-03-01T23:59:00', '2026-03-02T00:01:00')).toBe(2);
		expect(dayNumber('2026-03-01T10:00:00', '2026-04-29T10:00:00')).toBe(60);
	});
});

describe('buildTimeline', () => {
	it('merges level events and evidence oldest first, counting days from the first entry', () => {
		const entries = buildTimeline(
			[level(1, '2026-03-01T10:00:00'), level(2, '2026-04-29T10:00:00')],
			[clip('a', '2026-03-01T10:05:00'), clip('b', '2026-04-29T10:05:00')]
		);
		expect(entries.map((e) => [e.type, e.day])).toEqual([
			['level', 1],
			['evidence', 1],
			['level', 60],
			['evidence', 60]
		]);
	});

	it('is empty for a stop with nothing on it', () => {
		expect(buildTimeline([], [])).toEqual([]);
	});
});

describe('defaultCompare', () => {
	it('picks the first and latest recording, ignoring notes', () => {
		const items = [
			clip('n', '2026-03-01T09:00:00', 'note'),
			clip('a', '2026-03-01T10:00:00'),
			clip('m', '2026-03-15T10:00:00', 'video'),
			clip('b', '2026-04-29T10:00:00')
		];
		expect(defaultCompare(items)?.map((i) => i.id)).toEqual(['a', 'b']);
	});

	it('needs two recordings', () => {
		expect(defaultCompare([clip('a', '2026-03-01T10:00:00')])).toBeNull();
		expect(defaultCompare([clip('a', '2026-03-01T10:00:00', 'note')])).toBeNull();
		expect(defaultCompare([])).toBeNull();
	});
});
