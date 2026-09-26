import type { CurriculumData, StopState } from '$lib/curriculum/model';
import { isCleared, meanProgress, skyValue } from './logic';

export interface MapSummary {
	/** Overall progress 0..1. */
	overall: number;
	/** The value the weather runs on. */
	sky: number;
	/** Progress per region slug. */
	regions: Record<string, number>;
	/** Slugs of regions where every stop is Solid or better. */
	cleared: string[];
}

/** Overall and per-region progress from the state of every stop. Missing means Unseen. */
export function summarise(data: CurriculumData, states: Record<string, StopState>): MapSummary {
	const of = (slugs: string[]) => slugs.map((s) => states[s] ?? { level: 0, rusting: false });
	const regions: Record<string, number> = {};
	const cleared: string[] = [];
	for (const region of data.regions) {
		const list = of(region.stopSlugs);
		regions[region.slug] = meanProgress(list);
		if (isCleared(list)) cleared.push(region.slug);
	}
	const overall = meanProgress(of(data.stops.map((s) => s.slug)));
	return { overall, sky: skyValue(overall), regions, cleared };
}
