import { describe, expect, it } from 'vitest';
import { curriculum, layout } from './index';
import { computeLayout } from './layout';
import { collectLinks, validateCurriculum, type RegionSource } from './schema';
import { sources } from './sources';

const clone = () => structuredClone(sources) as RegionSource[];

describe('the base curriculum', () => {
	const stops = curriculum.flatMap((r) => r.stops);

	it('has seven regions and about sixty stops', () => {
		expect(curriculum).toHaveLength(7);
		expect(stops.length).toBeGreaterThanOrEqual(58);
		expect(stops.length).toBeLessThanOrEqual(70);
	});

	it('has eight to ten songs, each linked to at least one skill', () => {
		const songs = stops.filter((s) => s.kind === 'song');
		expect(songs.length).toBeGreaterThanOrEqual(8);
		expect(songs.length).toBeLessThanOrEqual(10);
		for (const song of songs)
			expect(song.helpedBy.length + song.unlockedBy.length).toBeGreaterThan(0);
	});

	it('gives every stop criteria for levels 2, 3 and 4 and a resource', () => {
		for (const stop of stops) {
			for (const level of [2, 3, 4] as const)
				expect(stop.criteria[level].length).toBeGreaterThan(0);
			expect(stop.resources.length).toBeGreaterThan(0);
		}
	});

	it('links only skills and songs that exist', () => {
		const slugs = new Set(stops.map((s) => s.slug));
		for (const [from, to] of collectLinks(curriculum)) {
			expect(slugs.has(from)).toBe(true);
			expect(slugs.has(to)).toBe(true);
		}
	});

	it('keeps the committed layout in step with the data', () => {
		expect(layout).toEqual(computeLayout(curriculum));
	});

	it('never places two stops close enough to overlap', () => {
		const points = Object.values(layout.stops);
		for (let i = 0; i < points.length; i++) {
			for (let j = i + 1; j < points.length; j++) {
				expect(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y)).toBeGreaterThan(
					60
				);
			}
		}
	});

	it('keeps every stop inside its region', () => {
		for (const region of curriculum) {
			const box = layout.regions[region.slug];
			for (const stop of region.stops) {
				const p = layout.stops[stop.slug];
				expect(p.x).toBeGreaterThan(box.x);
				expect(p.x).toBeLessThan(box.x + box.w);
				expect(p.y).toBeGreaterThan(box.y);
				expect(p.y).toBeLessThan(box.y + box.h);
			}
		}
	});
});

describe('validateCurriculum', () => {
	it('accepts the real data', () => {
		expect(() => validateCurriculum(sources, layout)).not.toThrow();
	});

	it('rejects a link to a stop that does not exist', () => {
		const data = clone();
		data[0].stops[1].helpedBy = ['not-a-stop'];
		expect(() => validateCurriculum(data)).toThrow(/unknown stop "not-a-stop"/);
	});

	it('rejects a stop that links to itself', () => {
		const data = clone();
		data[0].stops[0].unlockedBy = [data[0].stops[0].slug];
		expect(() => validateCurriculum(data)).toThrow(/links to itself/);
	});

	it('rejects link cycles', () => {
		const data = clone();
		const [a, b] = data[0].stops;
		a.helpedBy = [b.slug];
		b.helpedBy = [a.slug];
		expect(() => validateCurriculum(data)).toThrow(/link cycle/);
	});

	it('rejects a stop missing criteria for a level', () => {
		const data = clone();
		// @ts-expect-error deliberately broken
		delete data[0].stops[0].criteria[3];
		expect(() => validateCurriculum(data)).toThrow(/criteria/);
	});

	it('rejects a level with no criteria', () => {
		const data = clone();
		data[0].stops[0].criteria[4] = [];
		expect(() => validateCurriculum(data)).toThrow(/criteria/);
	});

	it('rejects duplicate stop slugs across regions', () => {
		const data = clone();
		data[1].stops[0].slug = data[0].stops[0].slug;
		expect(() => validateCurriculum(data)).toThrow(/duplicate stop slug/);
	});

	it('rejects duplicate region slugs', () => {
		const data = clone();
		data[1].slug = data[0].slug;
		expect(() => validateCurriculum(data)).toThrow(/duplicate region slug/);
	});

	it('rejects a stop with no resource', () => {
		const data = clone();
		data[0].stops[0].resources = [];
		expect(() => validateCurriculum(data)).toThrow(/resources/);
	});

	it('rejects a non-https resource', () => {
		const data = clone();
		data[0].stops[0].resources = [
			{ title: 'plain http', url: 'http://example.com', kind: 'article' }
		];
		expect(() => validateCurriculum(data)).toThrow(/https/);
	});

	it('rejects a layout that misses a stop', () => {
		const partial = structuredClone(layout);
		delete partial.stops[sources[0].stops[0].slug];
		expect(() => validateCurriculum(sources, partial)).toThrow(/no layout for stop/);
	});
});
