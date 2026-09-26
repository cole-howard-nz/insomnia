// Loads the base curriculum into the database. Run with: npm run db:seed
// Idempotent: upserts by slug, never deletes stops or criteria (removed ones are
// archived so progress survives), and only rewrites links and resources.
import { Pool } from '@neondatabase/serverless';
import { and, eq, gte, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { curriculum, layout } from '../src/lib/curriculum/index.ts';
import { collectLinks } from '../src/lib/curriculum/schema.ts';
import {
	criteria,
	regions,
	resources,
	stopLinks,
	stops
} from '../src/lib/server/db/schema/curriculum.ts';

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is not set');

const pool = new Pool({ connectionString: url });
const db = drizzle(pool);

const counts = { regions: 0, stops: 0, criteria: 0, resources: 0, links: 0, archived: 0 };

await db.transaction(async (tx) => {
	const regionIds = new Map<string, number>();
	const stopIds = new Map<string, number>();

	for (const [regionSort, region] of curriculum.entries()) {
		const box = layout.regions[region.slug];
		const values = {
			slug: region.slug,
			name: region.name,
			blurb: region.blurb,
			mapX: box.x,
			mapY: box.y,
			mapW: box.w,
			mapH: box.h,
			sort: regionSort
		};
		const [row] = await tx
			.insert(regions)
			.values(values)
			.onConflictDoUpdate({ target: regions.slug, set: values })
			.returning({ id: regions.id });
		regionIds.set(region.slug, row.id);
		counts.regions++;

		for (const [stopSort, stop] of region.stops.entries()) {
			const at = layout.stops[stop.slug];
			const stopValues = {
				regionId: row.id,
				slug: stop.slug,
				name: stop.name,
				summary: stop.summary,
				kind: stop.kind,
				mapX: at.x,
				mapY: at.y,
				targetBpm: stop.targetBpm ?? null,
				sort: stopSort,
				archivedAt: null
			};
			const [stopRow] = await tx
				.insert(stops)
				.values(stopValues)
				.onConflictDoUpdate({ target: stops.slug, set: stopValues })
				.returning({ id: stops.id });
			stopIds.set(stop.slug, stopRow.id);
			counts.stops++;

			// Criteria keep their ids, so ticks survive edits. Extras are archived.
			for (const level of [2, 3, 4] as const) {
				const texts = stop.criteria[level];
				for (const [sort, text] of texts.entries()) {
					const criterionValues = { stopId: stopRow.id, level, text, sort, archivedAt: null };
					await tx
						.insert(criteria)
						.values(criterionValues)
						.onConflictDoUpdate({
							target: [criteria.stopId, criteria.level, criteria.sort],
							set: { text, archivedAt: null }
						});
					counts.criteria++;
				}
				const archived = await tx
					.update(criteria)
					.set({ archivedAt: sql`now()` })
					.where(
						and(
							eq(criteria.stopId, stopRow.id),
							eq(criteria.level, level),
							gte(criteria.sort, texts.length),
							isNull(criteria.archivedAt)
						)
					)
					.returning({ id: criteria.id });
				counts.archived += archived.length;
			}

			// Nothing references resources, so they are simply replaced.
			await tx.delete(resources).where(eq(resources.stopId, stopRow.id));
			await tx
				.insert(resources)
				.values(stop.resources.map((r, sort) => ({ ...r, stopId: stopRow.id, sort })));
			counts.resources += stop.resources.length;
		}
	}

	// Stops that left the source are archived, never deleted.
	const archivedStops = await tx
		.update(stops)
		.set({ archivedAt: sql`now()` })
		.where(and(notInArray(stops.slug, [...stopIds.keys()]), isNull(stops.archivedAt)))
		.returning({ id: stops.id });
	counts.archived += archivedStops.length;

	// Links are rebuilt from the source.
	await tx.delete(stopLinks).where(inArray(stopLinks.toStopId, [...stopIds.values()]));
	const links = collectLinks(curriculum).map(([from, to, kind]) => ({
		fromStopId: stopIds.get(from)!,
		toStopId: stopIds.get(to)!,
		kind
	}));
	await tx.insert(stopLinks).values(links);
	counts.links = links.length;
});

await pool.end();
console.log(
	`seeded ${counts.regions} regions, ${counts.stops} stops, ${counts.criteria} criteria, ${counts.resources} resources, ${counts.links} links. archived ${counts.archived}.`
);
