// The typed curriculum the app reads. Shared by server loaders and the client,
// so it holds plain data only (it crosses the wire as JSON).

export type StopKind = 'skill' | 'song';
export type LinkKind = 'helps' | 'unlocks';
export type ResourceKind = 'video' | 'tab' | 'article' | 'exercise';
export type Level = 0 | 1 | 2 | 3 | 4;

export interface CriterionModel {
	id: number;
	level: 2 | 3 | 4;
	text: string;
}

export interface ResourceModel {
	title: string;
	url: string;
	kind: ResourceKind;
}

export interface StopModel {
	id: number;
	slug: string;
	name: string;
	summary: string;
	kind: StopKind;
	regionSlug: string;
	x: number;
	y: number;
	targetBpm: number | null;
	criteria: CriterionModel[];
	resources: ResourceModel[];
}

export interface RegionModel {
	slug: string;
	name: string;
	blurb: string;
	x: number;
	y: number;
	w: number;
	h: number;
	stopSlugs: string[];
}

export interface LinkModel {
	from: string;
	to: string;
	kind: LinkKind;
}

export interface CurriculumData {
	regions: RegionModel[];
	stops: StopModel[];
	links: LinkModel[];
}

export const LEVEL_NAMES = ['unseen', 'learning', 'playable', 'solid', 'mastered'] as const;

/** What the map needs to draw a stop. Rust is a layer on top of a level. */
export interface StopState {
	level: Level;
	rusting: boolean;
}

export const UNSEEN: StopState = { level: 0, rusting: false };

export interface CurriculumIndex {
	data: CurriculumData;
	stop(slug: string): StopModel | undefined;
	region(slug: string): RegionModel | undefined;
	/** Links pointing into a stop, e.g. the stops that make it easier. */
	incoming(slug: string, kind: LinkKind): StopModel[];
	/** Links leaving a stop, e.g. the stops it makes easier. */
	outgoing(slug: string, kind: LinkKind): StopModel[];
	/** Bounding box of every region, for fitting the whole map in view. */
	bounds: { x: number; y: number; w: number; h: number };
}

export function indexCurriculum(data: CurriculumData): CurriculumIndex {
	const stops = new Map(data.stops.map((s) => [s.slug, s]));
	const regions = new Map(data.regions.map((r) => [r.slug, r]));
	const pick = (links: LinkModel[], side: 'from' | 'to', slug: string, kind: LinkKind) =>
		links
			.filter((l) => l[side === 'from' ? 'to' : 'from'] === slug && l.kind === kind)
			.map((l) => stops.get(l[side]))
			.filter((s): s is StopModel => s !== undefined);

	const minX = Math.min(...data.regions.map((r) => r.x));
	const minY = Math.min(...data.regions.map((r) => r.y));
	const maxX = Math.max(...data.regions.map((r) => r.x + r.w));
	const maxY = Math.max(...data.regions.map((r) => r.y + r.h));

	return {
		data,
		stop: (slug) => stops.get(slug),
		region: (slug) => regions.get(slug),
		incoming: (slug, kind) => pick(data.links, 'from', slug, kind),
		outgoing: (slug, kind) => pick(data.links, 'to', slug, kind),
		bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
	};
}

/** Screen reader label, e.g. "barre chords, region chords, level 2 of 4, rusting". */
export function describeStop(stop: StopModel, region: RegionModel | undefined, state: StopState) {
	const parts = [stop.name, `region ${region?.name ?? stop.regionSlug}`, `level ${state.level} of 4`];
	if (stop.kind === 'song') parts.splice(1, 0, 'song');
	if (state.rusting) parts.push('rusting');
	return parts.join(', ');
}
