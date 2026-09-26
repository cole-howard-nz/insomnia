import {
	check,
	doublePrecision,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	unique
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// The shared curriculum. Read-only to users, loaded by scripts/seed.ts.

export const stopKind = pgEnum('stop_kind', ['skill', 'song']);
export const linkKind = pgEnum('link_kind', ['helps', 'unlocks']);
export const resourceKind = pgEnum('resource_kind', ['video', 'tab', 'article', 'exercise']);

export const regions = pgTable('regions', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	slug: text().notNull().unique(),
	name: text().notNull(),
	blurb: text().notNull(),
	/** Top-left of the district in map space, plus its size. */
	mapX: doublePrecision('map_x').notNull(),
	mapY: doublePrecision('map_y').notNull(),
	mapW: doublePrecision('map_w').notNull(),
	mapH: doublePrecision('map_h').notNull(),
	sort: integer().notNull()
});

export const stops = pgTable(
	'stops',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		regionId: integer('region_id')
			.notNull()
			.references(() => regions.id),
		slug: text().notNull().unique(),
		name: text().notNull(),
		summary: text().notNull(),
		kind: stopKind().notNull().default('skill'),
		/** Absolute position in map space. */
		mapX: doublePrecision('map_x').notNull(),
		mapY: doublePrecision('map_y').notNull(),
		targetBpm: integer('target_bpm'),
		sort: integer().notNull(),
		/** Removed stops are archived, never dropped, so progress survives. */
		archivedAt: timestamp('archived_at', { withTimezone: true })
	},
	(t) => [index('stops_region_idx').on(t.regionId)]
);

export const stopLinks = pgTable(
	'stop_links',
	{
		fromStopId: integer('from_stop_id')
			.notNull()
			.references(() => stops.id),
		toStopId: integer('to_stop_id')
			.notNull()
			.references(() => stops.id),
		kind: linkKind().notNull()
	},
	(t) => [primaryKey({ columns: [t.fromStopId, t.toStopId, t.kind] })]
);

export const criteria = pgTable(
	'criteria',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		stopId: integer('stop_id')
			.notNull()
			.references(() => stops.id),
		level: smallint().notNull(),
		text: text().notNull(),
		sort: integer().notNull(),
		/** Users tick criteria by id, so a removed criterion is archived too. */
		archivedAt: timestamp('archived_at', { withTimezone: true })
	},
	(t) => [
		unique('criteria_stop_level_sort').on(t.stopId, t.level, t.sort),
		check('criteria_level_range', sql`${t.level} between 2 and 4`)
	]
);

export const resources = pgTable(
	'resources',
	{
		id: integer().primaryKey().generatedAlwaysAsIdentity(),
		stopId: integer('stop_id')
			.notNull()
			.references(() => stops.id),
		title: text().notNull(),
		url: text().notNull(),
		kind: resourceKind().notNull(),
		sort: integer().notNull()
	},
	(t) => [unique('resources_stop_sort').on(t.stopId, t.sort)]
);
