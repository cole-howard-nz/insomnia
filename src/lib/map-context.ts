import { getContext, setContext } from 'svelte';
import type { CurriculumIndex, StopState } from './curriculum/model';

/** What the map layout shares with the stop sheet below it. */
export interface MapContext {
	readonly index: CurriculumIndex;
	readonly states: Record<string, StopState>;
	/** Search string that keeps the current view, e.g. "?view=list". */
	readonly query: string;
}

const KEY = Symbol('map');
export const setMapContext = (context: MapContext) => setContext(KEY, context);
export const getMapContext = () => getContext<MapContext>(KEY);
