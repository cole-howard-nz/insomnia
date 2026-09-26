import { UNSEEN, type CurriculumData, type StopState } from './curriculum/model';

// Placeholder for phase 3, when real progress feeds the map. Until then every
// stop is Unseen, and in dev a toggle cycles the stops through every state.

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

	/** The state of each stop, by slug. */
	for(data: CurriculumData): Record<string, StopState> {
		const out: Record<string, StopState> = {};
		data.stops.forEach((s, i) => {
			out[s.slug] = this.preview ? CYCLE[i % CYCLE.length] : UNSEEN;
		});
		return out;
	}
}

export const mapState = new MapState();
