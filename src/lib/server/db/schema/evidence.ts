import {
	check,
	index,
	integer,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { stops } from './curriculum';

// Evidence: a recording or a note pinned to a stop. The file itself lives in private object
// storage under `storageKey`, never behind a public URL. Only touched through src/lib/server/data.

export const evidenceKind = pgEnum('evidence_kind', ['audio', 'video', 'note']);

export const evidence = pgTable(
	'evidence',
	{
		id: uuid().primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		stopId: integer('stop_id')
			.notNull()
			.references(() => stops.id),
		kind: evidenceKind().notNull(),
		/** The stop's level when this was attached, so the timeline can say "day 1, learning". */
		levelAt: smallint('level_at').notNull(),
		/** The words, for a note. A caption for a recording. */
		note: text().notNull().default(''),
		/** Null for a note. */
		storageKey: text('storage_key'),
		mime: text(),
		bytes: integer().notNull().default(0),
		durationSeconds: integer('duration_seconds'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		index('evidence_user_stop_idx').on(t.userId, t.stopId, t.createdAt),
		check('evidence_level_range', sql`${t.levelAt} between 0 and 4`),
		check('evidence_bytes_nonneg', sql`${t.bytes} >= 0`)
	]
);
