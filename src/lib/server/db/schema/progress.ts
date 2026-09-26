import {
	check,
	date,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	uuid
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';
import { criteria, stops } from './curriculum';

// The user's own progress. Every table carries user_id and cascades from users, and is
// only touched through src/lib/server/data. Add new ones to PRIVATE_TABLES in eslint.config.js.

export const feel = pgEnum('practice_feel', ['sloppy', 'clean', 'breakthrough']);

/** One row per stop the user has touched. No row means Unseen. */
export const userStopProgress = pgTable(
	'user_stop_progress',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		stopId: integer('stop_id')
			.notNull()
			.references(() => stops.id),
		/** Recomputed from the ticked criteria on every change. */
		level: smallint().notNull().default(1),
		/** Last practice or criterion tick. Rust is computed from this at read time. */
		lastPracticedAt: timestamp('last_practiced_at', { withTimezone: true }),
		bestBpm: integer('best_bpm'),
		notes: text().notNull().default(''),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.stopId] }),
		check('progress_level_range', sql`${t.level} between 1 and 4`)
	]
);

export const userCriteriaDone = pgTable(
	'user_criteria_done',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		criterionId: integer('criterion_id')
			.notNull()
			.references(() => criteria.id),
		doneAt: timestamp('done_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.userId, t.criterionId] })]
);

export const practiceSessions = pgTable(
	'practice_sessions',
	{
		id: uuid().primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		/** The local calendar day the session counts for, so a 1am session belongs to the night before. */
		practicedOn: date('practiced_on', { mode: 'string' }).notNull(),
		minutes: integer().notNull(),
		feel: feel().notNull(),
		note: text().notNull().default(''),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		index('practice_sessions_user_idx').on(t.userId, t.practicedOn),
		check('practice_minutes_range', sql`${t.minutes} between 1 and 720`)
	]
);

export const practiceSessionStops = pgTable(
	'practice_session_stops',
	{
		sessionId: uuid('session_id')
			.notNull()
			.references(() => practiceSessions.id, { onDelete: 'cascade' }),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		stopId: integer('stop_id')
			.notNull()
			.references(() => stops.id),
		bpm: integer()
	},
	(t) => [
		primaryKey({ columns: [t.sessionId, t.stopId] }),
		index('practice_session_stops_user_stop_idx').on(t.userId, t.stopId)
	]
);

/** Every level change, kept for the phase 4 timeline. */
export const levelEvents = pgTable(
	'level_events',
	{
		id: uuid().primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		stopId: integer('stop_id')
			.notNull()
			.references(() => stops.id),
		fromLevel: smallint('from_level').notNull(),
		toLevel: smallint('to_level').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('level_events_user_stop_idx').on(t.userId, t.stopId, t.createdAt)]
);
