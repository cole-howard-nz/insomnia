import type { ResourceSource, StopSource } from './schema';

// Authoring helpers for the region files. Resources are search links for now:
// they never rot and never point at content we did not vet. Swap in curated
// links as they are found, the shape does not change.

const q = encodeURIComponent;

/** A youtube search, as a video resource. */
export const yt = (query: string): ResourceSource => ({
	title: `youtube: ${query}`,
	url: `https://www.youtube.com/results?search_query=${q(query)}`,
	kind: 'video'
});

/** A tab search on ultimate guitar. */
export const tabs = (query: string): ResourceSource => ({
	title: `tabs: ${query}`,
	url: `https://www.ultimate-guitar.com/search.php?search_type=title&value=${q(query)}`,
	kind: 'tab'
});

/** A wikipedia search, for the theory articles. */
export const wiki = (query: string): ResourceSource => ({
	title: `wikipedia: ${query}`,
	url: `https://en.wikipedia.org/w/index.php?search=${q(query)}`,
	kind: 'article'
});

/** A practice drill (backing tracks, exercises), found by youtube search. */
export const drill = (query: string): ResourceSource => ({
	title: `drill: ${query}`,
	url: `https://www.youtube.com/results?search_query=${q(query)}`,
	kind: 'exercise'
});

interface Options {
	kind?: 'skill' | 'song';
	bpm?: number;
	/** Stops that make this one easier. */
	helpedBy?: string[];
	/** Stops after which this one is much more natural. */
	unlockedBy?: string[];
}

/** One stop. Criteria are given as [playable, solid, mastered]. */
export function stop(
	slug: string,
	name: string,
	summary: string,
	criteria: [string[], string[], string[]],
	resources: ResourceSource[],
	options: Options = {}
): StopSource {
	return {
		slug,
		name,
		summary,
		kind: options.kind ?? 'skill',
		targetBpm: options.bpm,
		helpedBy: options.helpedBy ?? [],
		unlockedBy: options.unlockedBy ?? [],
		criteria: { 2: criteria[0], 3: criteria[1], 4: criteria[2] },
		resources
	};
}
