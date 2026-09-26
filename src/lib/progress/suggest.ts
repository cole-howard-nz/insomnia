import type { CurriculumIndex, StopModel, StopState } from '$lib/curriculum/model';
import { daysSince, overdueDays } from './logic';

export interface Suggestion {
	kind: 'rusting' | 'in-progress' | 'fresh';
	stop: StopModel;
	/** Plain and explainable: why this stop, in the app's voice. */
	reason: string;
}

export interface SuggestInput {
	index: CurriculumIndex;
	states: Record<string, StopState>;
	/** Last touched (practice or tick) per stop slug, ISO. Missing means never. */
	touched: Record<string, string | undefined>;
	/** Last practiced per stop slug, ISO. Rust runs off this. */
	practiced: Record<string, string | undefined>;
	now: number;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Up to three: the most overdue rusting stop, the freshest in-progress one, one fresh stop. */
export function suggest({ index, states, touched, practiced, now }: SuggestInput): Suggestion[] {
	const stops = index.data.stops;
	const state = (s: StopModel) => states[s.slug] ?? { level: 0, rusting: false };
	const out: Suggestion[] = [];

	const rusting = stops
		.filter((s) => state(s).rusting)
		.sort(
			(a, b) =>
				overdueDays(state(b).level, practiced[b.slug] ?? null, now) -
				overdueDays(state(a).level, practiced[a.slug] ?? null, now)
		)[0];
	if (rusting) {
		const days = daysSince(practiced[rusting.slug]!, now);
		out.push({
			kind: 'rusting',
			stop: rusting,
			reason: `it's been ${plural(days, 'day')}. it misses you.`
		});
	}

	const inProgress = stops
		.filter((s) => {
			const l = state(s).level;
			return (l === 1 || l === 2) && !state(s).rusting;
		})
		.sort((a, b) => Date.parse(touched[b.slug] ?? '0') - Date.parse(touched[a.slug] ?? '0'))[0];
	if (inProgress) {
		const at = touched[inProgress.slug];
		const when = at ? daysSince(at, now) : null;
		out.push({
			kind: 'in-progress',
			stop: inProgress,
			reason:
				when === null
					? 'you started it. it is waiting.'
					: when === 0
						? 'you were on it today. one more push.'
						: `you were on it ${plural(when, 'day')} ago. one more push.`
		});
	}

	// Fresh: an unseen stop in the region the user has explored least, easiest first.
	const explored = (slug: string) => {
		const list = index.region(slug)?.stopSlugs ?? [];
		return list.length === 0
			? 1
			: list.filter((s) => (states[s]?.level ?? 0) > 0).length / list.length;
	};
	const metShare = (s: StopModel) => {
		const helpers = index.incoming(s.slug, 'helps');
		if (helpers.length === 0) return 1;
		return helpers.filter((h) => (states[h.slug]?.level ?? 0) >= 2).length / helpers.length;
	};
	const regionOrder = new Map(index.data.regions.map((r, i) => [r.slug, i]));
	const stopOrder = new Map(stops.map((s, i) => [s.slug, i]));
	const fresh = stops
		.filter((s) => state(s).level === 0)
		.sort(
			(a, b) =>
				explored(a.regionSlug) - explored(b.regionSlug) ||
				(regionOrder.get(a.regionSlug) ?? 0) - (regionOrder.get(b.regionSlug) ?? 0) ||
				metShare(b) - metShare(a) ||
				(stopOrder.get(a.slug) ?? 0) - (stopOrder.get(b.slug) ?? 0)
		)[0];
	if (fresh) {
		const region = index.region(fresh.regionSlug)?.name ?? fresh.regionSlug;
		const helpers = index.incoming(fresh.slug, 'helps');
		const met = helpers.filter((h) => (states[h.slug]?.level ?? 0) >= 2).length;
		out.push({
			kind: 'fresh',
			stop: fresh,
			reason:
				helpers.length === 0
					? `new ground in ${region}. nothing else needs to come first.`
					: met === helpers.length
						? `new ground in ${region}. what makes it easier is already in your hands.`
						: `new ground in ${region}. ${met} of ${helpers.length} things that make it easier are done.`
		});
	}

	return out;
}
