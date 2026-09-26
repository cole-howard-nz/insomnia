import { describe, expect, it } from 'vitest';
import type { CurriculumData, StopModel, StopState } from '$lib/curriculum/model';
import { derive, detectMilestones } from './snapshot';

const stop = (id: number, slug: string, region: string): StopModel => ({
	id,
	slug,
	name: slug,
	summary: '',
	kind: 'skill',
	regionSlug: region,
	x: 0,
	y: 0,
	targetBpm: null,
	criteria: [],
	resources: []
});

const data: CurriculumData = {
	regions: [
		{ slug: 'a', name: 'a', blurb: '', x: 0, y: 0, w: 1, h: 1, stopSlugs: ['a1', 'a2'] },
		{ slug: 'b', name: 'b', blurb: '', x: 0, y: 0, w: 1, h: 1, stopSlugs: ['b1'] }
	],
	stops: [stop(1, 'a1', 'a'), stop(2, 'a2', 'a'), stop(3, 'b1', 'b')],
	links: []
};

const at = (level: StopState['level']): StopState => ({ level, rusting: false });
const now = Date.parse('2026-03-01T12:00:00Z');

describe('derive', () => {
	it('reads a snapshot into states, ignoring stops that are no longer on the map', () => {
		const old = new Date(now - 30 * 86_400_000).toISOString();
		const out = derive(
			data,
			{
				stops: [
					{ stopId: 1, level: 2, lastPracticedAt: old, updatedAt: old, bestBpm: null, notes: '' },
					{ stopId: 99, level: 4, lastPracticedAt: old, updatedAt: old, bestBpm: null, notes: '' }
				],
				criteriaDone: []
			},
			now
		);
		expect(out.states).toEqual({ a1: { level: 2, rusting: true } });
		expect(out.practiced.a1).toBe(old);
		expect(out.touched.a1).toBe(old);
	});

	it('falls back to the update time when a stop was never practiced', () => {
		const at = new Date(now).toISOString();
		const out = derive(
			data,
			{
				stops: [
					{ stopId: 3, level: 1, lastPracticedAt: null, updatedAt: at, bestBpm: null, notes: '' }
				],
				criteriaDone: []
			},
			now
		);
		expect(out.touched.b1).toBe(at);
		expect(out.practiced.b1).toBeUndefined();
	});
});

describe('milestones', () => {
	it('marks a region cleared once its last stop reaches Solid', () => {
		const before = { a1: at(3), a2: at(2) };
		const after = { a1: at(3), a2: at(3) };
		expect(detectMilestones(data, before, after, 'a2', false)).toEqual([
			{ kind: 'region-cleared', region: 'a' }
		]);
	});

	it('does not repeat a region that was already cleared', () => {
		const state = { a1: at(3), a2: at(3) };
		expect(detectMilestones(data, state, { ...state, a2: at(4) }, 'a2', false)).toEqual([]);
	});

	it('marks the first mastered stop, and both when they land together', () => {
		expect(detectMilestones(data, { b1: at(2) }, { b1: at(4) }, 'b1', true)).toEqual([
			{ kind: 'first-mastered', stop: 'b1' },
			{ kind: 'region-cleared', region: 'b' }
		]);
	});

	it('is quiet when nothing crossed a line', () => {
		expect(detectMilestones(data, { a1: at(1) }, { a1: at(2) }, 'a1', false)).toEqual([]);
	});
});
