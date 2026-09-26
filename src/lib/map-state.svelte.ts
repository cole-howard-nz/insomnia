import { type CurriculumData, type StopState } from './curriculum/model';

// Dev only: a toggle that shows every stop in every state, to check how the map draws
// them. Real progress comes from the progress store.

const CYCLE: StopState[] = [
	{ level: 0, rusting: false },
	{ level: 1, rusting: false },
	{ level: 2, rusting: false },
	{ level: 3, rusting: false },
	{ level: 4, rusting: false },
	{ level: 3, rusting: true },
	{ level: 2, rusting: true },
	{ level: 4, rusting: true }
];

class MapState {
	/** Dev only: show every state on the map. */
	preview = $state(false);

	/** Every stop cycled through every state, by slug. */
	for(data: CurriculumData): Record<string, StopState> {
		const out: Record<string, StopState> = {};
		data.stops.forEach((s, i) => {
			out[s.slug] = CYCLE[i % CYCLE.length];
		});
		return out;
	}
}

export const mapState = new MapState();
