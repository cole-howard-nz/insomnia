import { describe, expect, it } from 'vitest';
import { curriculum } from '$lib/curriculum';
import { proposeSeeds, skippedSeeds, type Chasing, type Experience } from './seed';

const known = new Set(curriculum.flatMap((r) => r.stops.map((s) => s.slug)));
const experiences: Experience[] = ['new', 'some', 'plays'];
const chasings: Chasing[] = ['songs', 'rhythm', 'lead', 'tone', 'general'];

describe('proposeSeeds', () => {
	it('only names stops that exist in the curriculum, for every combination', () => {
		for (const experience of experiences) {
			const all = proposeSeeds({ experience, chasing: chasings }, known);
			expect(all.length).toBeGreaterThan(0);
			for (const p of all) expect(known.has(p.slug), p.slug).toBe(true);
		}
	});

	it('never proposes above Playable, so nothing is silently Mastered', () => {
		for (const experience of experiences) {
			for (const p of proposeSeeds({ experience, chasing: chasings }, known))
				expect([1, 2]).toContain(p.level);
		}
	});

	it('gives a brand new player Learning stops only, and never an empty map', () => {
		const seeds = proposeSeeds({ experience: 'new', chasing: [] }, known);
		expect(seeds.length).toBeGreaterThanOrEqual(3);
		expect(seeds.every((s) => s.level === 1)).toBe(true);
	});

	it('starts a player who knows chords further along, with some stops Playable', () => {
		const some = proposeSeeds({ experience: 'some', chasing: [] }, known);
		const plays = proposeSeeds({ experience: 'plays', chasing: [] }, known);
		expect(some.some((s) => s.level === 2)).toBe(true);
		expect(plays.filter((s) => s.level === 2).length).toBeGreaterThan(
			some.filter((s) => s.level === 2).length
		);
		expect(plays.length).toBeGreaterThan(
			proposeSeeds({ experience: 'new', chasing: [] }, known).length
		);
	});

	it('adds a stop for what they are chasing, and nothing for "just getting better"', () => {
		const base = proposeSeeds({ experience: 'new', chasing: [] }, known);
		expect(proposeSeeds({ experience: 'new', chasing: ['general'] }, known)).toEqual(base);
		const lead = proposeSeeds({ experience: 'new', chasing: ['lead'] }, known);
		expect(lead.map((s) => s.slug)).toContain('pentatonic-box-1');
	});

	it('keeps the higher level when a stop is proposed twice', () => {
		const seeds = proposeSeeds({ experience: 'plays', chasing: ['lead'] }, known);
		const slugs = seeds.map((s) => s.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('drops stops that no longer exist instead of failing', () => {
		const partial = new Set(['posture-and-hold']);
		expect(proposeSeeds({ experience: 'new', chasing: [] }, partial).map((s) => s.slug)).toEqual([
			'posture-and-hold'
		]);
		expect(skippedSeeds(new Set())).toEqual([]);
	});
});
