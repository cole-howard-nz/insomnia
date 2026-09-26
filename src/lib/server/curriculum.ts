import { asc, isNull } from 'drizzle-orm';
import type { CurriculumData } from '$lib/curriculum/model';
import { db } from './db';
import { criteria, regions, resources, stopLinks, stops } from './db/schema';

// The base curriculum is shared and read-only, so it is cached in memory. A
// re-seed shows up within the TTL (or on the next cold start).
const TTL_MS = 5 * 60 * 1000;
let cached: { at: number; data: CurriculumData } | undefined;
let inflight: Promise<CurriculumData> | undefined;

async function read(): Promise<CurriculumData> {
	const [regionRows, stopRows, linkRows, criterionRows, resourceRows] = await Promise.all([
		db.select().from(regions).orderBy(asc(regions.sort)),
		db.select().from(stops).where(isNull(stops.archivedAt)).orderBy(asc(stops.sort)),
		db.select().from(stopLinks),
		db
			.select()
			.from(criteria)
			.where(isNull(criteria.archivedAt))
			.orderBy(asc(criteria.level), asc(criteria.sort)),
		db.select().from(resources).orderBy(asc(resources.sort))
	]);

	const regionSlugById = new Map(regionRows.map((r) => [r.id, r.slug]));
	const stopSlugById = new Map(stopRows.map((s) => [s.id, s.slug]));

	const stopModels = stopRows.map((s) => ({
		id: s.id,
		slug: s.slug,
		name: s.name,
		summary: s.summary,
		kind: s.kind,
		regionSlug: regionSlugById.get(s.regionId)!,
		x: s.mapX,
		y: s.mapY,
		targetBpm: s.targetBpm,
		criteria: criterionRows
			.filter((c) => c.stopId === s.id)
			.map((c) => ({ id: c.id, level: c.level as 2 | 3 | 4, text: c.text })),
		resources: resourceRows
			.filter((r) => r.stopId === s.id)
			.map((r) => ({ title: r.title, url: r.url, kind: r.kind }))
	}));

	return {
		regions: regionRows.map((r) => ({
			slug: r.slug,
			name: r.name,
			blurb: r.blurb,
			x: r.mapX,
			y: r.mapY,
			w: r.mapW,
			h: r.mapH,
			stopSlugs: stopModels.filter((s) => s.regionSlug === r.slug).map((s) => s.slug)
		})),
		stops: stopModels,
		links: linkRows
			.filter((l) => stopSlugById.has(l.fromStopId) && stopSlugById.has(l.toStopId))
			.map((l) => ({
				from: stopSlugById.get(l.fromStopId)!,
				to: stopSlugById.get(l.toStopId)!,
				kind: l.kind
			}))
	};
}

/** The whole base curriculum, without archived stops. Cached. */
export async function loadCurriculum(): Promise<CurriculumData> {
	if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
	inflight ??= read()
		.then((data) => {
			cached = { at: Date.now(), data };
			return data;
		})
		.finally(() => (inflight = undefined));
	return inflight;
}
