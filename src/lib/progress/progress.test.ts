import { describe, expect, it } from 'vitest';
import {
	indexCurriculum,
	type CriterionModel,
	type CurriculumData,
	type StopModel,
	type StopState
} from '$lib/curriculum/model';
import { calcLevel, isCleared, isRusting, meanProgress, overdueDays, skyValue } from './logic';
import { suggest } from './suggest';
import { addDays, summariseStreak, todayIn, weekStart } from './streak';
import { summarise } from './summary';

const criteria: CriterionModel[] = [
	{ id: 1, level: 2, text: 'a' },
	{ id: 2, level: 2, text: 'b' },
	{ id: 3, level: 3, text: 'c' },
	{ id: 4, level: 4, text: 'd' }
];
const ids = (...n: number[]) => new Set(n);

describe('level from criteria', () => {
	it('is Unseen until started, then Learning', () => {
		expect(calcLevel(criteria, ids(), false)).toBe(0);
		expect(calcLevel(criteria, ids(), true)).toBe(1);
	});

	it('needs every criterion of a level', () => {
		expect(calcLevel(criteria, ids(1), true)).toBe(1);
		expect(calcLevel(criteria, ids(1, 2), true)).toBe(2);
	});

	it('needs the lower levels too', () => {
		expect(calcLevel(criteria, ids(3, 4), true)).toBe(1);
		expect(calcLevel(criteria, ids(1, 2, 4), true)).toBe(2);
		expect(calcLevel(criteria, ids(1, 2, 3), true)).toBe(3);
		expect(calcLevel(criteria, ids(1, 2, 3, 4), true)).toBe(4);
	});

	it('drops when a criterion is unticked', () => {
		expect(calcLevel(criteria, ids(1, 2, 3, 4), true)).toBe(4);
		expect(calcLevel(criteria, ids(1, 2, 4), true)).toBe(2);
	});

	it('ignores ticks for criteria that no longer exist', () => {
		expect(calcLevel(criteria, ids(1, 2, 99), true)).toBe(2);
	});

	it('cannot pass a level that has no criteria', () => {
		expect(
			calcLevel(
				criteria.filter((c) => c.level !== 3),
				ids(1, 2, 4),
				true
			)
		).toBe(2);
	});
});

describe('rust', () => {
	const now = Date.parse('2026-03-01T12:00:00Z');
	const ago = (days: number, extraHours = 0) =>
		new Date(now - days * 86_400_000 - extraHours * 3_600_000).toISOString();

	it('never applies to Unseen or Learning', () => {
		expect(isRusting(0, ago(500), now)).toBe(false);
		expect(isRusting(1, ago(500), now)).toBe(false);
	});

	it('does not apply without a practice date', () => {
		expect(isRusting(3, null, now)).toBe(false);
	});

	it('rusts Playable on day 21, not day 20', () => {
		expect(isRusting(2, ago(20, 23), now)).toBe(false);
		expect(isRusting(2, ago(21), now)).toBe(true);
	});

	it('rusts Solid on day 45, not day 44', () => {
		expect(isRusting(3, ago(44, 23), now)).toBe(false);
		expect(isRusting(3, ago(45), now)).toBe(true);
	});

	it('rusts Mastered on day 90, not day 89', () => {
		expect(isRusting(4, ago(89, 23), now)).toBe(false);
		expect(isRusting(4, ago(90), now)).toBe(true);
	});

	it('is cleared by practising today', () => {
		expect(isRusting(4, ago(0), now)).toBe(false);
	});

	it('ranks by days past the threshold, not raw days', () => {
		expect(overdueDays(2, ago(24), now)).toBe(3);
		expect(overdueDays(4, ago(95), now)).toBe(5);
		expect(overdueDays(3, ago(10), now)).toBe(0);
	});

	it('treats a date in the future as today', () => {
		expect(isRusting(2, ago(-3), now)).toBe(false);
	});
});

describe('progress values', () => {
	const at = (level: StopState['level'], rusting = false): StopState => ({ level, rusting });

	it('is the mean of level over four', () => {
		expect(meanProgress([])).toBe(0);
		expect(meanProgress([at(0), at(4)])).toBe(0.5);
		expect(meanProgress([at(4), at(4)])).toBe(1);
	});

	it('is lower when a stop rusts, so the sky can close back in', () => {
		expect(meanProgress([at(4, true)])).toBeLessThan(meanProgress([at(4)]));
		expect(meanProgress([at(4, true)])).toBeGreaterThan(0);
	});

	it('stretches to a sky value clamped to 0..1', () => {
		expect(skyValue(0)).toBe(0);
		expect(skyValue(1)).toBe(1);
		expect(skyValue(0.25)).toBeCloseTo(0.5);
	});

	it('clears a region when every stop is Solid or better', () => {
		expect(isCleared([at(3), at(4)])).toBe(true);
		expect(isCleared([at(3), at(2)])).toBe(false);
		expect(isCleared([])).toBe(false);
	});
});

function stop(slug: string, region: string, x = 0): StopModel {
	return {
		id: x,
		slug,
		name: slug,
		summary: '',
		kind: 'skill',
		regionSlug: region,
		x,
		y: 0,
		targetBpm: null,
		criteria: [],
		resources: []
	};
}
const data: CurriculumData = {
	regions: ['a', 'b'].map((slug, i) => ({
		slug,
		name: slug,
		blurb: '',
		x: i * 100,
		y: 0,
		w: 90,
		h: 90,
		stopSlugs: slug === 'a' ? ['a1', 'a2', 'a3'] : ['b1', 'b2']
	})),
	stops: [
		stop('a1', 'a', 1),
		stop('a2', 'a', 2),
		stop('a3', 'a', 3),
		stop('b1', 'b', 4),
		stop('b2', 'b', 5)
	],
	links: [{ from: 'a1', to: 'b2', kind: 'helps' }]
};
const index = indexCurriculum(data);

describe('regional summary', () => {
	it('reports per-region progress and cleared regions', () => {
		const s = summarise(data, {
			b1: { level: 3, rusting: false },
			b2: { level: 4, rusting: false }
		});
		expect(s.regions.a).toBe(0);
		expect(s.regions.b).toBeCloseTo(0.875);
		expect(s.cleared).toEqual(['b']);
		expect(s.overall).toBeCloseTo(0.35);
	});
});

describe('what next', () => {
	const now = Date.parse('2026-03-01T12:00:00Z');
	const iso = (days: number) => new Date(now - days * 86_400_000).toISOString();

	it('suggests one fresh stop to someone brand new, from the first region', () => {
		const out = suggest({ index, states: {}, touched: {}, practiced: {}, now });
		expect(out.map((s) => s.kind)).toEqual(['fresh']);
		expect(out[0].stop.slug).toBe('a1');
	});

	it('gives one of each with a reason for each', () => {
		const out = suggest({
			index,
			states: {
				a1: { level: 2, rusting: true },
				a2: { level: 1, rusting: false },
				a3: { level: 2, rusting: false }
			},
			touched: { a2: iso(5), a3: iso(2) },
			practiced: { a1: iso(24) },
			now
		});
		expect(out.map((s) => [s.kind, s.stop.slug])).toEqual([
			['rusting', 'a1'],
			['in-progress', 'a3'],
			['fresh', 'b1']
		]);
		expect(out[0].reason).toBe("it's been 24 days. it misses you.");
		expect(out[1].reason).toContain('2 days ago');
		for (const s of out) expect(s.reason.length).toBeGreaterThan(0);
	});

	it('picks the most overdue rusting stop', () => {
		const out = suggest({
			index,
			states: { a1: { level: 2, rusting: true }, a2: { level: 2, rusting: true } },
			touched: {},
			practiced: { a1: iso(22), a2: iso(40) },
			now
		});
		expect(out[0].stop.slug).toBe('a2');
	});

	it('prefers the least explored region for fresh stops', () => {
		const out = suggest({
			index,
			states: { a1: { level: 1, rusting: false }, a2: { level: 1, rusting: false } },
			touched: { a1: iso(1), a2: iso(2) },
			practiced: {},
			now
		});
		expect(out.at(-1)?.stop.slug).toBe('b1');
	});

	it('prefers a fresh stop whose helpers are met', () => {
		const out = suggest({
			index,
			states: {
				a1: { level: 0, rusting: false },
				a2: { level: 3, rusting: false },
				a3: { level: 3, rusting: false }
			},
			touched: {},
			practiced: {},
			now
		});
		// b is the least explored region, and b1 has no helpers while b2 is helped by unmet a1.
		expect(out[0].stop.slug).toBe('b1');
	});

	it('says nothing when everything is Mastered and nothing rusts', () => {
		const full: Record<string, StopState> = Object.fromEntries(
			data.stops.map((s) => [s.slug, { level: 4, rusting: false }])
		);
		expect(suggest({ index, states: full, touched: {}, practiced: {}, now })).toEqual([]);
	});
});

describe('dates and streaks', () => {
	it('finds the local date in a timezone', () => {
		const now = Date.parse('2026-03-01T22:00:00Z');
		expect(todayIn('UTC', now)).toBe('2026-03-01');
		expect(todayIn('Pacific/Auckland', now)).toBe('2026-03-02');
		expect(todayIn('not/a-zone', now)).toBe('2026-03-01');
	});

	it('finds the Monday of a week', () => {
		expect(weekStart('2026-03-01')).toBe('2026-02-23'); // a Sunday
		expect(weekStart('2026-03-02')).toBe('2026-03-02'); // a Monday
		expect(weekStart('2026-03-04')).toBe('2026-03-02');
		expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
	});

	const log = (...dates: string[]) => dates.map((practicedOn) => ({ practicedOn, minutes: 10 }));

	it('starts at nothing', () => {
		expect(summariseStreak([], '2026-03-04', 3)).toEqual({
			daysThisWeek: 0,
			target: 3,
			dayStreak: 0,
			weekStreak: 0,
			minutesThisWeek: 0
		});
	});

	it('keeps the day streak alive until today is over', () => {
		const s = summariseStreak(log('2026-03-02', '2026-03-03'), '2026-03-04', 3);
		expect(s.dayStreak).toBe(2);
		const broken = summariseStreak(log('2026-03-01', '2026-03-02'), '2026-03-04', 3);
		expect(broken.dayStreak).toBe(0);
	});

	it('counts today in the day streak', () => {
		expect(summariseStreak(log('2026-03-03', '2026-03-04'), '2026-03-04', 3).dayStreak).toBe(2);
	});

	it('counts several sessions in a day once', () => {
		const s = summariseStreak(log('2026-03-04', '2026-03-04'), '2026-03-04', 3);
		expect(s.dayStreak).toBe(1);
		expect(s.daysThisWeek).toBe(1);
		expect(s.minutesThisWeek).toBe(20);
	});

	it('counts weeks that met the target and is not broken by an unfinished week', () => {
		const dates = [
			'2026-02-16',
			'2026-02-18',
			'2026-02-20',
			'2026-02-23',
			'2026-02-25',
			'2026-02-27',
			'2026-03-02'
		];
		const s = summariseStreak(log(...dates), '2026-03-04', 3);
		expect(s.weekStreak).toBe(2);
		expect(s.daysThisWeek).toBe(1);
	});

	it('adds this week once it meets the target', () => {
		const s = summariseStreak(
			log('2026-02-23', '2026-02-24', '2026-02-25', '2026-03-02', '2026-03-03', '2026-03-04'),
			'2026-03-04',
			3
		);
		expect(s.weekStreak).toBe(2);
	});

	it('breaks on a missed week', () => {
		const s = summariseStreak(
			log('2026-02-16', '2026-02-17', '2026-02-18', '2026-02-23', '2026-03-03'),
			'2026-03-04',
			3
		);
		expect(s.weekStreak).toBe(0);
	});

	it('only counts this week for minutes', () => {
		const s = summariseStreak(log('2026-02-27', '2026-03-02'), '2026-03-04', 3);
		expect(s.minutesThisWeek).toBe(10);
	});
});
